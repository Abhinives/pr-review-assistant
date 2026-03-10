from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import uuid
import json

from ..database import get_db
from ..models import PullRequest, PRReview, ReviewIssue, GithubCredential
from ..schemas import RunAnalysisRequest
from ..utils.helpers import parse_pr_url
from ..security import decrypt_token

from ..services.github_service import (
    get_pr_metadata,
    get_pr_files,
    get_review_comments,
    get_issue_comments,
    get_file_content
)

from ..services.ai_service import analyze_file_diff, generate_final_summary
from ..utils.skeletonizer import Skeletonizer

router = APIRouter(prefix="/analysis", tags=["Run Analysis"])

IGNORED_FILE_EXTENSIONS = (".json", ".lock", ".svg", ".png", ".jpg", ".jpeg", ".gif")
IGNORED_DIRECTORIES = ("node_modules/", "dist/", "build/", ".git/")

def should_review_file(filename: str) -> bool:
    if filename.endswith(IGNORED_FILE_EXTENSIONS):
        return False
    if any(filename.startswith(d) or f"/{d}" in filename for d in IGNORED_DIRECTORIES):
        return False
    return True

@router.post("/run")
def run_analysis(request: RunAnalysisRequest, db: Session = Depends(get_db)):

    owner, repo, pr_number = parse_pr_url(request.pr_url)

    token = request.github_token
    if request.credential_id:
        try:
            cred_uuid = uuid.UUID(request.credential_id)
            credential = db.query(GithubCredential).filter(GithubCredential.id == cred_uuid).first()
            if not credential:
                raise HTTPException(status_code=404, detail="Credential not found")
            token = decrypt_token(credential.encrypted_token)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid credential_id format")

    if not token:
        raise HTTPException(status_code=400, detail="Either github_token or credential_id must be provided")

    # Fetch GitHub data
    metadata = get_pr_metadata(owner, repo, pr_number, token)
    files = get_pr_files(owner, repo, pr_number, token)
    review_comments = get_review_comments(owner, repo, pr_number, token)
    issue_comments = get_issue_comments(owner, repo, pr_number, token)

    pr_title = metadata.get("title", "")
    pr_description = metadata.get("body", "")
    head_sha = metadata.get("head", {}).get("sha", "")

    all_issues = []

    for file in files:
        if not isinstance(file, dict):
            continue
            
        filename = file.get("filename", "")
        if not should_review_file(filename):
            continue
            
        patch = file.get("patch")
        if not patch:
            continue

        file_comments = [
            {"body": c.get("body"), "line": c.get("line")}
            for c in review_comments
            if isinstance(c, dict) and c.get("path") == filename
        ]

        # Fetch full file from GitHub
        full_file_content = ""
        if head_sha:
            try:
                full_file_content = get_file_content(owner, repo, filename, head_sha, token)
            except Exception as e:
                print(f"Failed to fetch full file content for {filename}: {e}")

        context = {
            "pr_title": pr_title,
            "pr_description": pr_description,
            "file_name": filename,
            "patch": patch,
            "existing_comments": file_comments
        }
        
        # Apply Skeletonization logic
        if filename.endswith(".py") and full_file_content.count("\n") > 300:
            context["full_file_skeleton"] = Skeletonizer.skeletonize(full_file_content, patch)
        elif full_file_content:
            context["full_file_content"] = full_file_content

        # Analyze individual file
        try:
            ai_result_str = analyze_file_diff(context)
            parsed_result = json.loads(ai_result_str)
            if "issues" in parsed_result:
                all_issues.extend(parsed_result["issues"])
        except Exception as e:
            print(f"Error analyzing file {filename}: {e}")

    # Generate final summary
    try:
        final_summary_response = generate_final_summary(pr_title, pr_description, all_issues)
        final_result = json.loads(final_summary_response)
    except Exception as e:
        print(f"Error generating final summary: {e}")
        final_result = {"decision": "unknown", "summary": f"Error: {e}"}

    result = {
        "decision": final_result.get("decision", "unknown"),
        "summary": final_result.get("summary", ""),
        "issues": all_issues
    }

    # Store PR
    pr = PullRequest(
        id=uuid.uuid4(),
        pr_url=request.pr_url,
        repo_owner=owner,
        repo_name=repo,
        pr_number=pr_number
    )

    db.add(pr)
    db.commit()
    db.refresh(pr)

    # Store review
    review = PRReview(
        id=uuid.uuid4(),
        pr_id=pr.id,
        decision=result["decision"],
        summary=result["summary"]
    )

    db.add(review)
    db.commit()
    db.refresh(review)

    # Store issues
    for issue in result.get("issues", []):
        if not isinstance(issue, dict):
            continue
            
        db_issue = ReviewIssue(
            id=uuid.uuid4(),
            review_id=review.id,
            file_name=issue.get("file"),
            line_number=issue.get("line"),
            severity=issue.get("severity"),
            description=issue.get("description"),
            fix_suggestion=issue.get("fix")
        )

        db.add(db_issue)

    db.commit()

    return result
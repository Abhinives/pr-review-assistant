from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import PullRequest, PRReview, ReviewIssue

router = APIRouter(prefix="/history", tags=["History"])

@router.get("/")
def get_history(db: Session = Depends(get_db)):

    results = (
        db.query(PullRequest, PRReview)
        .join(PRReview, PullRequest.id == PRReview.pr_id)
        .all()
    )

    history = []

    for pr, review in results:
        history.append({
            "id": str(review.id),
            "pr_url": pr.pr_url,
            "decision": review.decision,
            "summary": review.summary,
            "created_at": review.created_at.isoformat()
        })

    return history

@router.get("/{review_id}")
def get_review_details(review_id: str, db: Session = Depends(get_db)):

    review = (
        db.query(PRReview)
        .filter(PRReview.id == review_id)
        .first()
    )

    if not review:
        raise HTTPException(status_code=404, detail="Review not found")

    pr = (
        db.query(PullRequest)
        .filter(PullRequest.id == review.pr_id)
        .first()
    )

    issues = (
        db.query(ReviewIssue)
        .filter(ReviewIssue.review_id == review.id)
        .all()
    )

    issue_list = []

    for issue in issues:
        issue_list.append({
            "file_name": issue.file_name,
            "line_number": issue.line_number,
            "severity": issue.severity,
            "description": issue.description,
            "fix_suggestion": issue.fix_suggestion
        })

    return {
        "review_id": str(review.id),
        "pr_url": pr.pr_url,
        "decision": review.decision,
        "summary": review.summary,
        "created_at": review.created_at.isoformat(),
        "issues": issue_list
    }
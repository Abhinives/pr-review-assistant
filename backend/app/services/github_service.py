import requests


GITHUB_API = "https://api.github.com"


def _make_github_request(url, headers):
    try:
        print(f"Calling GitHub API: {url}")
        response = requests.get(url, headers=headers)
        if response.status_code != 200:
            print(f"GitHub API returned error {response.status_code}: {response.text}")
        response.raise_for_status()
        
        json_response = response.json()
        print(f"GitHub API Response: {json_response}")
        return json_response
    except Exception as e:
        print(f"Exception calling GitHub API: {e}")
        raise


def get_pr_metadata(owner, repo, pr_number, token):
    url = f"{GITHUB_API}/repos/{owner}/{repo}/pulls/{pr_number}"
    headers = {"Authorization": f"Bearer {token}"}
    return _make_github_request(url, headers)


def get_pr_files(owner, repo, pr_number, token):
    url = f"{GITHUB_API}/repos/{owner}/{repo}/pulls/{pr_number}/files"
    headers = {"Authorization": f"Bearer {token}"}
    return _make_github_request(url, headers)


def get_review_comments(owner, repo, pr_number, token):
    url = f"{GITHUB_API}/repos/{owner}/{repo}/pulls/{pr_number}/comments"
    headers = {"Authorization": f"Bearer {token}"}
    return _make_github_request(url, headers)


def get_issue_comments(owner, repo, pr_number, token):
    url = f"{GITHUB_API}/repos/{owner}/{repo}/issues/{pr_number}/comments"
    headers = {"Authorization": f"Bearer {token}"}
    return _make_github_request(url, headers)

def get_file_content(owner, repo, file_path, ref, token):
    import base64
    url = f"{GITHUB_API}/repos/{owner}/{repo}/contents/{file_path}?ref={ref}"
    headers = {"Authorization": f"Bearer {token}"}
    response = _make_github_request(url, headers)
    
    # GitHub's content API returns base64 encoded strings
    content_b64 = response.get("content", "")
    if content_b64:
        return base64.b64decode(content_b64).decode("utf-8")
    return ""

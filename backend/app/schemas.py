from pydantic import BaseModel


# ---------------------------
# SAVE GITHUB TOKEN
# ---------------------------
class GithubCredentialCreate(BaseModel):
    email: str
    github_username: str
    github_token: str


# ---------------------------
# RUN ANALYSIS
# ---------------------------
class RunAnalysisRequest(BaseModel):
    pr_url: str
    github_token: str | None = None
    credential_id: str | None = None


# ---------------------------
# HISTORY RESPONSE
# ---------------------------
class HistoryResponse(BaseModel):
    pr_url: str
    decision: str
    summary: str
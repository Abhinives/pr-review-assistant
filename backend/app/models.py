from sqlalchemy import Column, String, Text, Integer, ForeignKey, TIMESTAMP
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import uuid

from .database import Base


# -----------------------------
# USERS
# -----------------------------
class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True)
    created_at = Column(TIMESTAMP, server_default=func.now())


# -----------------------------
# GITHUB CREDENTIALS
# -----------------------------
class GithubCredential(Base):
    __tablename__ = "github_credentials"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"))
    github_username = Column(String(255))
    encrypted_token = Column(Text, nullable=False)
    created_at = Column(TIMESTAMP, server_default=func.now())


# -----------------------------
# PULL REQUESTS
# -----------------------------
class PullRequest(Base):
    __tablename__ = "pull_requests"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    pr_url = Column(Text, nullable=False)
    repo_owner = Column(String(255))
    repo_name = Column(String(255))
    pr_number = Column(Integer)
    created_at = Column(TIMESTAMP, server_default=func.now())


# -----------------------------
# PR REVIEWS
# -----------------------------
class PRReview(Base):
    __tablename__ = "pr_reviews"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    pr_id = Column(UUID(as_uuid=True), ForeignKey("pull_requests.id", ondelete="CASCADE"))
    decision = Column(String(50))
    summary = Column(Text)
    created_at = Column(TIMESTAMP, server_default=func.now())



# -----------------------------
# REVIEW ISSUES
# -----------------------------
class ReviewIssue(Base):
    __tablename__ = "review_issues"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    review_id = Column(UUID(as_uuid=True), ForeignKey("pr_reviews.id", ondelete="CASCADE"))
    file_name = Column(Text)
    line_number = Column(Integer)
    severity = Column(String(20))
    description = Column(Text)
    fix_suggestion = Column(Text)
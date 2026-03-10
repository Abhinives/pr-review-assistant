from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
import uuid

from ..database import get_db
from ..models import User, GithubCredential
from ..schemas import GithubCredentialCreate
from ..security import encrypt_token

router = APIRouter(prefix="/credentials", tags=["Credentials"])


@router.post("/")
def save_github_credentials(data: GithubCredentialCreate, db: Session = Depends(get_db)):

    user = db.query(User).filter(User.email == data.email).first()

    if not user:
        user = User(id=uuid.uuid4(), email=data.email)
        db.add(user)
        db.commit()
        db.refresh(user)

    credential = GithubCredential(
    id=uuid.uuid4(),
    user_id=user.id,
    github_username=data.github_username,
    encrypted_token=encrypt_token(data.github_token)
)

    db.add(credential)
    db.commit()

    return {"message": "GitHub credentials saved"}


@router.get("/")
def get_credentials(db: Session = Depends(get_db)):
    credentials = db.query(GithubCredential).all()

    result = []
    for cred in credentials:
        result.append({
            "id": str(cred.id),
            "github_username": cred.github_username,
            "user_id": str(cred.user_id)
        })

    return result
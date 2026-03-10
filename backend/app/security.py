import os
from cryptography.fernet import Fernet
from dotenv import load_dotenv

from pathlib import Path

env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(env_path)

ENCRYPTION_KEY = os.getenv("ENCRYPTION_KEY")

cipher = Fernet(ENCRYPTION_KEY)


def encrypt_token(token: str) -> str:
    encrypted = cipher.encrypt(token.encode())
    return encrypted.decode()


def decrypt_token(encrypted_token: str) -> str:
    decrypted = cipher.decrypt(encrypted_token.encode())
    return decrypted.decode()
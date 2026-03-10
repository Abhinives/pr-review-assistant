from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .routers import github_config
from .routers import analysis
from .routers import history

app = FastAPI(title="AI PR Review Agent")

origins = [
    "http://localhost:8081",
    "http://127.0.0.1:8081",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(github_config.router)
app.include_router(analysis.router)
app.include_router(history.router)


@app.get("/")
def root():
    return {"message": "PR Review Agent running"}
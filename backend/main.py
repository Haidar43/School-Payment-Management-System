from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routes import students
from .routes import academic

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
)

app.include_router(students.router)

app.include_router(academic.router)
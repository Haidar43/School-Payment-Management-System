from fastapi import Depends, HTTPException, FastAPI
from sqlalchemy.orm import Session
from backend.database.base import get_db
from backend.schema import AdminBase, AdminCreate

app = FastAPI()

@app.get("/admin")
async def admin():
    return get_db()
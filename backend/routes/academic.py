from typing import List
from fastapi import Depends, HTTPException, APIRouter, status
from sqlalchemy.orm import Session
from ..database.base import get_db
from ..schema import SessionRead, SessionBase, TermRead, TermCreate
from ..CRUD.academic import create_session, read_sessions, read_terms, read_term, read_session_terms, create_term

router = APIRouter(
    tags=["Session"]
)

@router.post("/session", response_model=SessionRead, status_code=status.HTTP_201_CREATED)
async def create(session: SessionBase, db: Session = Depends(get_db)):
    return create_session(db=db, session=session)

@router.get("/session", response_model=List[SessionRead], status_code=status.HTTP_200_OK)
async def get_sessions(db: Session = Depends(get_db)):
    return read_sessions(db=db)

@router.post("/term", response_model=TermRead, status_code=status.HTTP_201_CREATED)
async def create(term: TermCreate, db: Session = Depends(get_db)):
    return create_term(term=term, db=db)

@router.get("/session/terms", response_model=List[TermRead], status_code=status.HTTP_200_OK)
async def get_terms(db: Session = Depends(get_db)):
    return read_terms(db=db)

@router.get("/term/{term_id}", response_model=TermRead, status_code=status.HTTP_200_OK)
async def get_term(term_id: int, db: Session = Depends(get_db)):
    return read_term(term_id=term_id, db=db)

@router.get("/term/{session_id}", response_model=List[TermRead], status_code=status.HTTP_200_OK)
async def get_session_terms(session_id: int, db: Session = Depends(get_db)):
    return read_session_terms(session_id=session_id, db=db)
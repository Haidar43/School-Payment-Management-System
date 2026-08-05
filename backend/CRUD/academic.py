from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session as orm_session
from ..database.models import Session, Term
from ..database.base import get_db
from ..schema import SessionRead, SessionBase, TermRead, TermCreate

def create_session(session: SessionBase, db: orm_session = Depends(get_db)):
    db_session = Session(**session.dict())
    db.add(db_session)
    db.commit()
    db.refresh(db_session)
    return db_session

def read_sessions(db: orm_session = Depends(get_db)):
    db_sessions = db.query(Session).all()

    if db_sessions is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Sessions are empty"
        )
    return db_sessions

def create_term(term: TermCreate, db: orm_session = Depends(get_db)):
    db_term = Term(**term.dict())
    db.add(db_term)
    db.commit()
    db.refresh(db_term)
    return db_term

def read_terms(db: orm_session = Depends(get_db)):
    db_terms = db.query(Term).all()

    if db_terms is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Terms are empty"
        )

    return db_terms

def read_term(term_id: int, db: orm_session = Depends(get_db)):
    db_term = db.query(Term).filter(Term.id == term_id).first()

    if db_term is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Term with ID {term_id} not found."
        )

    return db_term

def read_session_terms(session_id: int, db: orm_session = Depends(get_db)):
    db_session_terms = db.query(Term).filter(Session.id == session_id).all()

    if db_session_terms is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Session {session_id} terms are empty"
        )
    return db_session_terms
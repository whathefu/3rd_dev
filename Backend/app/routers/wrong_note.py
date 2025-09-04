# app/routers/wrong_note.py
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import select
from typing import List

from app.database import get_db
from app.core.deps import get_current_user
from app.models.wrong_note import WrongNote

from pydantic import BaseModel

router = APIRouter(prefix="/wrong-notes", tags=["Wrong Notes"])

class WrongNoteOut(BaseModel):
    wrong_note_id: str
    user_id: str
    wrong_quiz_id: str
    created_at: str

@router.get("", response_model=List[WrongNoteOut])
def list_wrong_notes(db: Session = Depends(get_db), user=Depends(get_current_user)):
    rows = db.execute(
        select(WrongNote).where(WrongNote.user_id == user.id).order_by(WrongNote.created_at.desc())
    ).scalars().all()
    return [WrongNoteOut.model_validate(r.__dict__) for r in rows]

@router.post("", response_model=WrongNoteOut, status_code=201)
def create_wrong_note(quiz_id: str, db: Session = Depends(get_db), user=Depends(get_current_user)):
    w = WrongNote(user_id=user.id, wrong_quiz_id=quiz_id)
    db.add(w); db.commit(); db.refresh(w)
    return WrongNoteOut.model_validate(w.__dict__)

@router.get("/{wrong_note_id}", response_model=WrongNoteOut)
def get_wrong_note(wrong_note_id: str, db: Session = Depends(get_db), user=Depends(get_current_user)):
    w = db.get(WrongNote, wrong_note_id)
    if not w or w.user_id != user.id:
        raise HTTPException(404, "not found")
    return WrongNoteOut.model_validate(w.__dict__)

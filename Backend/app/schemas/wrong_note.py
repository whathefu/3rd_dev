from pydantic import BaseModel

class WrongNoteOut(BaseModel):
    wrong_note_id: str
    user_id: str
    wrong_quiz_id: str
    created_at: str

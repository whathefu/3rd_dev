from typing import List
from pydantic import BaseModel, conint

class OptionOut(BaseModel):
    option_id: str
    label: conint(ge=1, le=4)
    option_text: str
    explanation_text: str | None = None
    is_answer: conint(ge=0, le=1)

class QuizOut(BaseModel):
    quiz_id: str
    video_id: str
    question_text: str
    options: List[OptionOut]

class SubmitIn(BaseModel):
    quiz_id: str
    selected_label: conint(ge=1, le=4)
    quiz_set_no: int = 1
    time_spent_sec: int = 0

class SubmitOut(BaseModel):
    is_correct: bool
    correct_label: int

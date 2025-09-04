from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import String, DateTime, ForeignKey, func
from app.database import Base
import uuid

class WrongNote(Base):
    __tablename__ = "wrong_note"

    wrong_note_id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("users.user_id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    wrong_quiz_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("quiz.quiz_id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    created_at: Mapped[DateTime] = mapped_column(DateTime, server_default=func.now(), nullable=False)

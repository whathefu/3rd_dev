from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import String, Integer, Text, DateTime, ForeignKey, func, UniqueConstraint, CheckConstraint
from app.database import Base
import uuid

# ----- category -----
class Category(Base):
    __tablename__ = "category"

    category_id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    category_name: Mapped[str] = mapped_column(String(100), nullable=False)
    category_sub_name: Mapped[str] = mapped_column(String(100), nullable=False)

    __table_args__ = (
        UniqueConstraint("category_name", "category_sub_name", name="uq_category_name_sub"),
    )

# ----- quiz -----
class Quiz(Base):
    __tablename__ = "quiz"

    quiz_id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    video_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("video.video_id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    # 정의서 상 'question_text'는 TEXT로 해석 (문자열 질문)
    question_text: Mapped[str] = mapped_column(Text, nullable=False)

    # 주: 정의서가 category_sub_name(문자열) FK를 명시
    # FK 타겟 컬럼이 고유해야 참조가 안전하므로 위 Category에 (name, sub_name) UNIQUE를 두고,
    # 여기서는 편의상 sub_name만 참조합니다. (가능하면 category_id로 참조하는 설계가 더 안전)
    category_sub_name_1: Mapped[str | None] = mapped_column(
        String(100),
        ForeignKey("category.category_sub_name", ondelete="CASCADE", onupdate="CASCADE"),
        nullable=True,
    )
    category_sub_name_2: Mapped[str | None] = mapped_column(
        String(100),
        ForeignKey("category.category_sub_name", ondelete="CASCADE", onupdate="CASCADE"),
        nullable=True,
    )
    category_sub_name_3: Mapped[str | None] = mapped_column(
        String(100),
        ForeignKey("category.category_sub_name", ondelete="CASCADE", onupdate="CASCADE"),
        nullable=True,
    )

# ----- options -----
class Option(Base):
    __tablename__ = "options"

    option_id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    quiz_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("quiz.quiz_id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    label: Mapped[int] = mapped_column(Integer, nullable=False)  # 1~4
    option_text: Mapped[str] = mapped_column(Text, nullable=False)
    explanation_text: Mapped[str] = mapped_column(Text, nullable=False)
    is_answer: Mapped[int] = mapped_column(Integer, nullable=False, default=0)  # 0/1

    __table_args__ = (
        CheckConstraint("label BETWEEN 1 AND 4", name="ck_options_label_1_4"),
        CheckConstraint("is_answer IN (0,1)", name="ck_options_is_answer_01"),
    )

# ----- history -----
class History(Base):
    __tablename__ = "history"

    history_id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("users.user_id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    quiz_set_no: Mapped[int] = mapped_column(Integer, nullable=False)
    quiz_set_date: Mapped[DateTime] = mapped_column(DateTime, nullable=False)
    quiz_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("quiz.quiz_id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    is_correct: Mapped[int] = mapped_column(Integer, nullable=False)  # 0/1
    time_spent_sec: Mapped[int] = mapped_column(Integer, nullable=False)

    __table_args__ = (
        CheckConstraint("is_correct IN (0,1)", name="ck_history_is_correct_01"),
        CheckConstraint("time_spent_sec >= 0", name="ck_history_time_spent_nonneg"),
    )

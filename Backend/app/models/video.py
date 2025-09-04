from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import String, Integer, Text, DateTime, func, CheckConstraint
from app.database import Base
import uuid

class Video(Base):
    __tablename__ = "video"

    video_id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    video_url: Mapped[str] = mapped_column(String(500), nullable=False)
    # 난이도 1~3 (상:1, 중:2, 하:3)
    difficulty: Mapped[int] = mapped_column(Integer, nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    # 추가 메타가 필요하면 created_at 정도는 허용
    created_at: Mapped[DateTime] = mapped_column(DateTime, server_default=func.now(), nullable=False)

    __table_args__ = (
        CheckConstraint("difficulty BETWEEN 1 AND 3", name="ck_video_difficulty_1_3"),
    )

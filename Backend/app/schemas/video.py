from pydantic import BaseModel, AnyUrl, conint
from typing import List

class VideoCreate(BaseModel):
    video_url: AnyUrl | str
    difficulty: conint(ge=1, le=3)
    description: str

class VideoOut(BaseModel):
    video_id: str
    video_url: str
    difficulty: int
    description: str

class PaginatedVideos(BaseModel):
    items: List[VideoOut]
    page: int
    size: int
    total: int

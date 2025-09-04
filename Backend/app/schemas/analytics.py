from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class SummaryOut(BaseModel):
    totalSolved: int
    accuracyPct: int
    wrongPct: int
    lastActiveAt: Optional[datetime] = None

class WeeklyItem(BaseModel):
    day: str   # Mon, Tue, ...
    solved: int

class WeeklyOut(BaseModel):
    days: List[WeeklyItem]

class CategoryStat(BaseModel):
    name: str
    quizCount: int
    accuracyPct: int

class CategoriesOut(BaseModel):
    categories: List[CategoryStat]

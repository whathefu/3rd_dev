from __future__ import annotations

from typing import Literal, Optional, Tuple, Union


LevelName = Literal["easy", "medium", "hard"]


DB_TO_NAME = {
    3: "easy",
    2: "medium",
    1: "hard",
}

NAME_TO_DB = {v: k for k, v in DB_TO_NAME.items()}


def parse_level_to_name(value: Optional[Union[int, str]]) -> Optional[LevelName]:
    """Normalize incoming level to a canonical string name.

    Accepts 3/2/1 (or "3"/"2"/"1") per DB rule: 3=easy, 2=medium, 1=hard.
    Also accepts already-normalized names (case-insensitive).
    Returns None if value is falsy/empty.
    """

    if value is None:
        return None

    # numeric (or numeric string) mapping per DB convention
    if isinstance(value, int):
        return DB_TO_NAME.get(value)  # type: ignore[return-value]

    s = str(value).strip().lower()
    if not s:
        return None

    if s.isdigit():
        try:
            n = int(s)
        except ValueError:
            n = -1
        return DB_TO_NAME.get(n)  # type: ignore[return-value]

    # canonical names
    if s in NAME_TO_DB:
        return s  # type: ignore[return-value]

    # allow localized strings (Korean)
    if s in ("쉬움", "easy"):
        return "easy"
    if s in ("중간", "보통", "medium"):
        return "medium"
    if s in ("고급", "어려움", "hard"):
        return "hard"

    return None


def level_name_to_db(value: Union[str, int]) -> Optional[int]:
    """Convert canonical name or number to DB integer value (3/2/1)."""
    name = parse_level_to_name(value)
    if name is None:
        return None
    return NAME_TO_DB.get(name)




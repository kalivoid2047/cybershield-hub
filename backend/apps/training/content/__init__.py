from .lessons import LESSONS
from .quizzes import QUIZZES as _CORE_QUIZZES
from .quizzes_extra import EXTRA_QUIZZES

QUIZZES = _CORE_QUIZZES + EXTRA_QUIZZES

__all__ = ["LESSONS", "QUIZZES"]

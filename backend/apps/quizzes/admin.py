from django.contrib import admin

from apps.quizzes.models import AnswerOption, Question, Quiz, QuizAttempt, QuizAttemptAnswer


class AnswerInline(admin.TabularInline):
    model = AnswerOption
    extra = 4


class QuestionInline(admin.StackedInline):
    model = Question
    extra = 1
    show_change_link = True


@admin.register(Quiz)
class QuizAdmin(admin.ModelAdmin):
    list_display = ("title", "is_active", "pass_score", "time_limit_minutes", "created_at")
    list_filter = ("is_active", "category")
    prepopulated_fields = {"slug": ("title",)}
    search_fields = ("title", "description")
    inlines = [QuestionInline]


@admin.register(Question)
class QuestionAdmin(admin.ModelAdmin):
    list_display = ("prompt", "quiz", "competency", "points", "order")
    list_filter = ("quiz", "competency")
    search_fields = ("prompt",)
    inlines = [AnswerInline]


admin.site.register(AnswerOption)
admin.site.register(QuizAttempt)
admin.site.register(QuizAttemptAnswer)

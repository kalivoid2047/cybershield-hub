from rest_framework import serializers

from apps.quizzes.models import AnswerOption, Question, Quiz, QuizAttempt, QuizAttemptAnswer
from apps.quizzes.services import attempts_remaining


class AnswerOptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = AnswerOption
        fields = ["id", "text", "order"]


class AnswerOptionAdminSerializer(serializers.ModelSerializer):
    class Meta:
        model = AnswerOption
        fields = ["id", "text", "is_correct", "order"]


class QuestionSerializer(serializers.ModelSerializer):
    """Question as shown to someone taking the quiz.

    Explanations often reveal the answer, so only staff receive them here; learners get
    them per question on the graded attempt (QuizAttemptAnswerSerializer).
    """

    answers = AnswerOptionSerializer(many=True, read_only=True)

    class Meta:
        model = Question
        fields = ["id", "prompt", "explanation", "competency", "points", "order", "answers"]

    def to_representation(self, instance):
        data = super().to_representation(instance)
        request = self.context.get("request")
        if not (request and request.user.is_authenticated and request.user.is_staff):
            data.pop("explanation", None)
        return data


class QuestionAdminSerializer(serializers.ModelSerializer):
    answers = AnswerOptionAdminSerializer(many=True)

    class Meta:
        model = Question
        fields = ["id", "prompt", "explanation", "competency", "points", "order", "answers"]

    def create(self, validated_data):
        answers_data = validated_data.pop("answers", [])
        question = Question.objects.create(**validated_data)
        for item in answers_data:
            AnswerOption.objects.create(question=question, **item)
        return question

    def update(self, instance, validated_data):
        answers_data = validated_data.pop("answers", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if answers_data is not None:
            instance.answers.all().delete()
            for item in answers_data:
                AnswerOption.objects.create(question=instance, **item)
        return instance


class AttemptUsageMixin(serializers.Serializer):
    """Adds attempts_used / attempts_remaining for the requesting user.

    ``attempts_used`` comes from a queryset annotation (see QuizViewSet.get_queryset), so
    lists do not query per quiz. ``attempts_remaining`` is ``None`` for unlimited quizzes.
    """

    attempts_used = serializers.SerializerMethodField()
    attempts_remaining = serializers.SerializerMethodField()

    def get_attempts_used(self, obj):
        return getattr(obj, "attempts_used", 0)

    def get_attempts_remaining(self, obj):
        if not obj.max_attempts:
            return None
        return max(0, obj.max_attempts - getattr(obj, "attempts_used", 0))


class QuizListSerializer(AttemptUsageMixin, serializers.ModelSerializer):
    question_count = serializers.IntegerField(read_only=True)
    best_score = serializers.DecimalField(max_digits=5, decimal_places=2, read_only=True)

    class Meta:
        model = Quiz
        fields = [
            "id",
            "title",
            "slug",
            "description",
            "time_limit_minutes",
            "pass_score",
            "max_attempts",
            "is_active",
            "question_count",
            "best_score",
            "attempts_used",
            "attempts_remaining",
        ]


class QuizDetailSerializer(AttemptUsageMixin, serializers.ModelSerializer):
    questions = QuestionSerializer(many=True, read_only=True)

    class Meta:
        model = Quiz
        fields = [
            "id",
            "title",
            "slug",
            "description",
            "lesson",
            "category",
            "time_limit_minutes",
            "pass_score",
            "max_attempts",
            "is_active",
            "randomize_questions",
            "attempts_used",
            "attempts_remaining",
            "questions",
            "created_at",
            "updated_at",
        ]


class QuizAdminSerializer(serializers.ModelSerializer):
    questions = QuestionAdminSerializer(many=True, required=False)

    class Meta:
        model = Quiz
        fields = [
            "id",
            "title",
            "slug",
            "description",
            "lesson",
            "category",
            "time_limit_minutes",
            "pass_score",
            "max_attempts",
            "is_active",
            "randomize_questions",
            "questions",
        ]

    def create(self, validated_data):
        questions_data = validated_data.pop("questions", [])
        quiz = Quiz.objects.create(**validated_data)
        for question_data in questions_data:
            answers_data = question_data.pop("answers", [])
            question = Question.objects.create(quiz=quiz, **question_data)
            for answer_data in answers_data:
                AnswerOption.objects.create(question=question, **answer_data)
        return quiz

    def update(self, instance, validated_data):
        questions_data = validated_data.pop("questions", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if questions_data is not None:
            instance.questions.all().delete()
            for question_data in questions_data:
                answers_data = question_data.pop("answers", [])
                question = Question.objects.create(quiz=instance, **question_data)
                for answer_data in answers_data:
                    AnswerOption.objects.create(question=question, **answer_data)
        return instance


class QuizAttemptAnswerSerializer(serializers.ModelSerializer):
    question_prompt = serializers.CharField(source="question.prompt", read_only=True)
    competency = serializers.CharField(source="question.competency", read_only=True)
    explanation = serializers.CharField(source="question.explanation", read_only=True)
    selected_text = serializers.CharField(source="selected_answer.text", read_only=True)
    correct_answer_text = serializers.SerializerMethodField()

    class Meta:
        model = QuizAttemptAnswer
        fields = [
            "id",
            "question",
            "question_prompt",
            "competency",
            "explanation",
            "selected_answer",
            "selected_text",
            "correct_answer_text",
            "is_correct",
            "points_awarded",
        ]

    def get_correct_answer_text(self, obj):
        # Iterate the (prefetched) answers rather than filtering, to avoid a query per row.
        for answer in obj.question.answers.all():
            if answer.is_correct:
                return answer.text
        return None


class QuizAttemptSerializer(serializers.ModelSerializer):
    quiz_title = serializers.CharField(source="quiz.title", read_only=True)
    pass_score = serializers.IntegerField(source="quiz.pass_score", read_only=True)
    lesson_slug = serializers.CharField(source="quiz.lesson.slug", read_only=True)
    lesson_title = serializers.CharField(source="quiz.lesson.title", read_only=True)
    attempts_remaining = serializers.SerializerMethodField()
    answers = QuizAttemptAnswerSerializer(many=True, read_only=True)

    def get_attempts_remaining(self, obj):
        # One count query, and only for quizzes that actually have a limit.
        return attempts_remaining(obj.user, obj.quiz)

    class Meta:
        model = QuizAttempt
        fields = [
            "id",
            "quiz",
            "quiz_title",
            "pass_score",
            "lesson_slug",
            "lesson_title",
            "attempts_remaining",
            "score",
            "total_points",
            "earned_points",
            "passed",
            "started_at",
            "completed_at",
            "duration_seconds",
            "weakness_map",
            "recommendations",
            "answers",
        ]
        read_only_fields = fields


class SubmitQuizSerializer(serializers.Serializer):
    answers = serializers.ListField(
        child=serializers.DictField(child=serializers.IntegerField()),
        allow_empty=False,
    )

    def validate_answers(self, value):
        for item in value:
            if "question_id" not in item or "answer_id" not in item:
                raise serializers.ValidationError("Each answer must include question_id and answer_id.")
        return value

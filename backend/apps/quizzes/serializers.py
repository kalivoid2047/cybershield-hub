from rest_framework import serializers

from apps.quizzes.models import AnswerOption, Question, Quiz, QuizAttempt, QuizAttemptAnswer


class AnswerOptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = AnswerOption
        fields = ["id", "text", "order"]


class AnswerOptionAdminSerializer(serializers.ModelSerializer):
    class Meta:
        model = AnswerOption
        fields = ["id", "text", "is_correct", "order"]


class QuestionSerializer(serializers.ModelSerializer):
    answers = AnswerOptionSerializer(many=True, read_only=True)

    class Meta:
        model = Question
        fields = ["id", "prompt", "explanation", "competency", "points", "order", "answers"]


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


class QuizListSerializer(serializers.ModelSerializer):
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
        ]


class QuizDetailSerializer(serializers.ModelSerializer):
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
    selected_text = serializers.CharField(source="selected_answer.text", read_only=True)

    class Meta:
        model = QuizAttemptAnswer
        fields = ["id", "question", "question_prompt", "selected_answer", "selected_text", "is_correct", "points_awarded"]


class QuizAttemptSerializer(serializers.ModelSerializer):
    quiz_title = serializers.CharField(source="quiz.title", read_only=True)
    answers = QuizAttemptAnswerSerializer(many=True, read_only=True)

    class Meta:
        model = QuizAttempt
        fields = [
            "id",
            "quiz",
            "quiz_title",
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

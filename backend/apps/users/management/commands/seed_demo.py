from django.core.management.base import BaseCommand
from django.utils import timezone

from apps.alerts.models import Notification, SecurityAlert
from apps.incidents.models import Incident, IncidentCategory, IncidentUpdate
from apps.phishing.models import PhishingSimulation
from apps.quizzes.models import AnswerOption, Question, Quiz
from apps.training.models import Lesson, LessonCategory
from apps.users.models import Role, User


class Command(BaseCommand):
    help = "Seed CyberShield Hub with roles, demo users, lessons, quizzes, phishing simulations, incidents, and alerts."

    def add_arguments(self, parser):
        parser.add_argument("--password", default="CyberShield123!", help="Password for demo accounts.")

    def handle(self, *args, **options):
        password = options["password"]
        roles = self.seed_roles()
        users = self.seed_users(roles, password)
        categories = self.seed_training(users["admin"])
        self.seed_quizzes(categories, users["admin"])
        self.seed_phishing(users["admin"])
        incident_categories = self.seed_incident_categories()
        self.seed_incidents(incident_categories, users)
        self.seed_alerts(users["admin"])
        self.stdout.write(self.style.SUCCESS("CyberShield demo data seeded."))
        self.stdout.write("Demo accounts:")
        self.stdout.write("  admin@cybershield.local / CyberShield123!")
        self.stdout.write("  officer@cybershield.local / CyberShield123!")
        self.stdout.write("  user@cybershield.local / CyberShield123!")

    def seed_roles(self):
        payload = [
            (
                Role.NORMAL_USER,
                "Normal User",
                ["training.read", "quiz.attempt", "phishing.attempt", "incident.report", "alert.read"],
            ),
            (
                Role.CYBERSECURITY_OFFICER,
                "Cybersecurity Officer",
                ["incident.manage", "analytics.read", "audit.read", "alert.manage", "training.read"],
            ),
            (
                Role.SYSTEM_ADMIN,
                "System Administrator",
                ["*"],
            ),
        ]
        roles = {}
        for code, name, permissions in payload:
            role, _ = Role.objects.update_or_create(
                code=code,
                defaults={"name": name, "description": f"{name} role for CyberShield Hub.", "permissions": permissions},
            )
            roles[code] = role
        return roles

    def seed_users(self, roles, password):
        specs = {
            "admin": ("admin@cybershield.local", "System", "Admin", roles[Role.SYSTEM_ADMIN], True, True),
            "officer": ("officer@cybershield.local", "SOC", "Officer", roles[Role.CYBERSECURITY_OFFICER], True, False),
            "user": ("user@cybershield.local", "Demo", "Learner", roles[Role.NORMAL_USER], False, False),
        }
        users = {}
        for key, (email, first, last, role, is_staff, is_superuser) in specs.items():
            user, _ = User.objects.update_or_create(
                email=email,
                defaults={
                    "username": email.split("@")[0],
                    "first_name": first,
                    "last_name": last,
                    "role": role,
                    "organization": "CyberShield Demo Org",
                    "department": "Security" if key != "user" else "Operations",
                    "is_staff": is_staff,
                    "is_superuser": is_superuser,
                    "is_active": True,
                    "is_email_verified": True,
                },
            )
            user.set_password(password)
            user.save(update_fields=["password"])
            users[key] = user
        return users

    def seed_training(self, admin):
        category_specs = [
            ("Phishing", "phishing", "Spot suspicious emails, links, and credential theft attempts.", "MailWarning"),
            ("Password Security", "password-security", "Build resilient password and MFA habits.", "KeyRound"),
            ("Malware", "malware", "Recognize malicious files, payloads, and risky downloads.", "Bug"),
            ("Social Engineering", "social-engineering", "Defend against manipulation and impersonation.", "UserRoundCheck"),
            ("Safe Browsing", "safe-browsing", "Browse safely and validate web trust signals.", "ShieldCheck"),
            ("Mobile Security", "mobile-security", "Secure mobile devices and apps.", "Smartphone"),
            ("Data Privacy", "data-privacy", "Handle sensitive data responsibly.", "Database"),
            ("Email Security", "email-security", "Use email securely in daily workflows.", "Inbox"),
        ]
        categories = {}
        for order, (name, slug, description, icon) in enumerate(category_specs, start=1):
            category, _ = LessonCategory.objects.update_or_create(
                slug=slug,
                defaults={"name": name, "description": description, "icon": icon, "order": order},
            )
            categories[slug] = category

        lesson_specs = [
            (
                "phishing",
                "Phishing Red Flags in 10 Minutes",
                "Learn the core signals that separate routine email from credential theft.",
                "Check sender domains, urgency cues, mismatched URLs, attachment context, and requests for secrets. When in doubt, report instead of replying.",
            ),
            (
                "password-security",
                "Password Managers and MFA",
                "Create unique credentials and protect critical accounts with multi-factor authentication.",
                "Use long generated passwords, never reuse credentials, and prefer phishing-resistant MFA where available.",
            ),
            (
                "data-privacy",
                "Handling Sensitive Data",
                "Classify, store, and share sensitive information with practical guardrails.",
                "Validate the recipient, minimize data exposure, encrypt approved transfers, and record exceptions.",
            ),
            (
                "malware",
                "Malware Intake Basics",
                "Understand risky attachments, macros, and suspicious downloads.",
                "Do not open unexpected attachments. Preserve evidence, isolate the endpoint if needed, and notify security.",
            ),
        ]
        for slug, title, summary, content in lesson_specs:
            Lesson.objects.update_or_create(
                slug=title.lower().replace(" ", "-").replace("&", "and"),
                defaults={
                    "category": categories[slug],
                    "title": title,
                    "summary": summary,
                    "content": content,
                    "difficulty": Lesson.BEGINNER,
                    "estimated_minutes": 8,
                    "tags": [slug, "awareness"],
                    "is_published": True,
                    "created_by": admin,
                },
            )
        return categories

    def seed_quizzes(self, categories, admin):
        quiz, _ = Quiz.objects.update_or_create(
            slug="phishing-foundations",
            defaults={
                "title": "Phishing Foundations Assessment",
                "description": "A quick check of phishing detection fundamentals.",
                "category": categories["phishing"],
                "time_limit_minutes": 8,
                "pass_score": 75,
                "is_active": True,
                "created_by": admin,
            },
        )
        quiz.questions.all().delete()
        questions = [
            (
                "Which signal is most suspicious in an email asking you to reset your password?",
                "URL Inspection",
                "A mismatched domain is a strong phishing indicator.",
                ["A verified internal sender", "A link to a lookalike domain", "A normal signature", "A recent ticket number"],
                1,
            ),
            (
                "What should you do with an unexpected attachment from an external sender?",
                "Malware Prevention",
                "Preserve the message and report it before opening the file.",
                ["Open it quickly", "Forward it to coworkers", "Report it for review", "Disable antivirus first"],
                2,
            ),
            (
                "A message demands urgent gift card purchases from an executive. What is the likely tactic?",
                "Social Engineering",
                "Urgency plus authority pressure is a common social engineering pattern.",
                ["Business email compromise", "Routine finance approval", "Patch management", "Data backup"],
                0,
            ),
        ]
        for index, (prompt, competency, explanation, answers, correct_index) in enumerate(questions, start=1):
            question = Question.objects.create(quiz=quiz, prompt=prompt, competency=competency, explanation=explanation, order=index)
            for answer_index, text in enumerate(answers):
                AnswerOption.objects.create(question=question, text=text, is_correct=answer_index == correct_index, order=answer_index)

    def seed_phishing(self, admin):
        simulations = [
            {
                "title": "Quarterly Password Reset",
                "scenario": "A user receives a realistic password reset email with a lookalike domain.",
                "difficulty": PhishingSimulation.EASY,
                "sender_name": "IT Service Desk",
                "sender_email": "support@micros0ft-security.com",
                "subject": "Immediate password reset required",
                "body": "Your account will be suspended in 30 minutes. Verify your password at https://login.micros0ft-security.com/reset.",
                "urls": ["https://login.micros0ft-security.com/reset"],
                "red_flags": ["lookalike domain", "urgent language", "credential request"],
                "is_phishing": True,
                "training_tip": "Verify domains carefully and never enter passwords from email links.",
                "created_by": admin,
                "is_active": True,
            },
            {
                "title": "Approved Maintenance Notice",
                "scenario": "A legitimate maintenance message from the internal helpdesk.",
                "difficulty": PhishingSimulation.MEDIUM,
                "sender_name": "Internal Helpdesk",
                "sender_email": "helpdesk@cybershield.local",
                "subject": "VPN maintenance Saturday",
                "body": "VPN maintenance is scheduled for Saturday 01:00 UTC. No action is required.",
                "urls": [],
                "red_flags": [],
                "is_phishing": False,
                "training_tip": "Legitimate operational messages usually do not request secrets or urgent payment.",
                "created_by": admin,
                "is_active": True,
            },
        ]
        for data in simulations:
            PhishingSimulation.objects.update_or_create(title=data["title"], defaults=data)

    def seed_incident_categories(self):
        specs = [
            ("Phishing Email", "phishing-email", "Suspicious or malicious email reports.", "medium"),
            ("Malware Infection", "malware-infection", "Potential endpoint compromise.", "high"),
            ("Data Exposure", "data-exposure", "Possible sensitive data disclosure.", "critical"),
            ("Unauthorized Access", "unauthorized-access", "Suspected account or system access abuse.", "high"),
        ]
        categories = {}
        for name, slug, description, default_severity in specs:
            category, _ = IncidentCategory.objects.update_or_create(
                slug=slug,
                defaults={"name": name, "description": description, "default_severity": default_severity},
            )
            categories[slug] = category
        return categories

    def seed_incidents(self, categories, users):
        incident, _ = Incident.objects.update_or_create(
            reference_number="INC-DEMO-000001",
            defaults={
                "title": "Suspicious MFA fatigue prompts",
                "category": categories["unauthorized-access"],
                "severity": Incident.HIGH,
                "description": "User received multiple unexpected MFA prompts after a password reset email.",
                "affected_system": "Identity Provider",
                "occurred_at": timezone.now(),
                "reporter": users["user"],
                "assigned_to": users["officer"],
                "status": Incident.INVESTIGATING,
                "is_draft": False,
            },
        )
        IncidentUpdate.objects.get_or_create(
            incident=incident,
            note="Initial triage started. User account temporarily locked pending review.",
            defaults={"actor": users["officer"], "status_to": Incident.INVESTIGATING, "is_internal": False},
        )

    def seed_alerts(self, admin):
        alert, _ = SecurityAlert.objects.update_or_create(
            title="Credential phishing campaign observed",
            defaults={
                "body": "A campaign using fake Microsoft password reset pages is targeting staff. Report suspicious reset emails immediately.",
                "priority": SecurityAlert.HIGH,
                "alert_type": SecurityAlert.THREAT_ADVISORY,
                "is_active": True,
                "created_by": admin,
            },
        )
        for user in User.objects.filter(is_active=True):
            Notification.objects.get_or_create(user=user, alert=alert)

-- CyberShield Hub MySQL schema reference.
-- Django migrations are generated from backend models; this file documents the normalized production tables.

CREATE TABLE roles (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  code VARCHAR(40) NOT NULL UNIQUE,
  name VARCHAR(120) NOT NULL,
  description LONGTEXT NOT NULL,
  permissions JSON NOT NULL,
  is_system BOOLEAN NOT NULL DEFAULT TRUE,
  created_at DATETIME(6) NOT NULL,
  updated_at DATETIME(6) NOT NULL,
  INDEX idx_roles_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE users (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  password VARCHAR(128) NOT NULL,
  last_login DATETIME(6) NULL,
  is_superuser BOOLEAN NOT NULL DEFAULT FALSE,
  username VARCHAR(150) NOT NULL UNIQUE,
  first_name VARCHAR(150) NOT NULL,
  last_name VARCHAR(150) NOT NULL,
  is_staff BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  date_joined DATETIME(6) NOT NULL,
  email VARCHAR(254) NOT NULL UNIQUE,
  role_id BIGINT NULL,
  organization VARCHAR(180) NOT NULL DEFAULT '',
  department VARCHAR(120) NOT NULL DEFAULT '',
  phone VARCHAR(40) NOT NULL DEFAULT '',
  avatar VARCHAR(100) NULL,
  is_email_verified BOOLEAN NOT NULL DEFAULT FALSE,
  is_deactivated BOOLEAN NOT NULL DEFAULT FALSE,
  failed_login_attempts INT UNSIGNED NOT NULL DEFAULT 0,
  last_failed_login DATETIME(6) NULL,
  last_login_ip CHAR(39) NULL,
  password_changed_at DATETIME(6) NULL,
  activated_at DATETIME(6) NULL,
  security_score INT UNSIGNED NOT NULL DEFAULT 72,
  CONSTRAINT fk_users_role FOREIGN KEY (role_id) REFERENCES roles(id),
  INDEX idx_users_email (email),
  INDEX idx_users_active_deactivated (is_active, is_deactivated)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE lesson_categories (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(120) NOT NULL UNIQUE,
  slug VARCHAR(140) NOT NULL UNIQUE,
  description LONGTEXT NOT NULL,
  icon VARCHAR(80) NOT NULL,
  color VARCHAR(24) NOT NULL,
  `order` INT UNSIGNED NOT NULL DEFAULT 0,
  created_at DATETIME(6) NOT NULL,
  updated_at DATETIME(6) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE lessons (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  category_id BIGINT NOT NULL,
  title VARCHAR(220) NOT NULL,
  slug VARCHAR(240) NOT NULL UNIQUE,
  summary LONGTEXT NOT NULL,
  content LONGTEXT NOT NULL,
  media_url VARCHAR(200) NOT NULL DEFAULT '',
  estimated_minutes INT UNSIGNED NOT NULL DEFAULT 8,
  difficulty VARCHAR(24) NOT NULL,
  tags JSON NOT NULL,
  is_published BOOLEAN NOT NULL DEFAULT FALSE,
  recommended_for_roles JSON NOT NULL,
  created_by_id BIGINT NULL,
  created_at DATETIME(6) NOT NULL,
  updated_at DATETIME(6) NOT NULL,
  CONSTRAINT fk_lessons_category FOREIGN KEY (category_id) REFERENCES lesson_categories(id),
  CONSTRAINT fk_lessons_created_by FOREIGN KEY (created_by_id) REFERENCES users(id),
  INDEX idx_lessons_slug (slug),
  INDEX idx_lessons_difficulty_published (difficulty, is_published)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE lesson_progress (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  lesson_id BIGINT NOT NULL,
  progress_percent INT UNSIGNED NOT NULL DEFAULT 0,
  completed_at DATETIME(6) NULL,
  last_viewed_at DATETIME(6) NOT NULL,
  created_at DATETIME(6) NOT NULL,
  updated_at DATETIME(6) NOT NULL,
  CONSTRAINT fk_lesson_progress_user FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_lesson_progress_lesson FOREIGN KEY (lesson_id) REFERENCES lessons(id),
  UNIQUE KEY uq_lesson_progress_user_lesson (user_id, lesson_id),
  INDEX idx_lesson_progress_user_completed (user_id, completed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE lesson_bookmarks (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  lesson_id BIGINT NOT NULL,
  created_at DATETIME(6) NOT NULL,
  updated_at DATETIME(6) NOT NULL,
  CONSTRAINT fk_lesson_bookmarks_user FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_lesson_bookmarks_lesson FOREIGN KEY (lesson_id) REFERENCES lessons(id),
  UNIQUE KEY uq_lesson_bookmarks_user_lesson (user_id, lesson_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE quizzes (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(220) NOT NULL,
  slug VARCHAR(240) NOT NULL UNIQUE,
  description LONGTEXT NOT NULL,
  lesson_id BIGINT NULL,
  category_id BIGINT NULL,
  time_limit_minutes INT UNSIGNED NOT NULL DEFAULT 10,
  pass_score INT UNSIGNED NOT NULL DEFAULT 80,
  max_attempts INT UNSIGNED NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  randomize_questions BOOLEAN NOT NULL DEFAULT TRUE,
  created_by_id BIGINT NULL,
  created_at DATETIME(6) NOT NULL,
  updated_at DATETIME(6) NOT NULL,
  CONSTRAINT fk_quizzes_lesson FOREIGN KEY (lesson_id) REFERENCES lessons(id),
  CONSTRAINT fk_quizzes_category FOREIGN KEY (category_id) REFERENCES lesson_categories(id),
  CONSTRAINT fk_quizzes_created_by FOREIGN KEY (created_by_id) REFERENCES users(id),
  INDEX idx_quizzes_slug_active (slug, is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE questions (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  quiz_id BIGINT NOT NULL,
  prompt LONGTEXT NOT NULL,
  explanation LONGTEXT NOT NULL,
  competency VARCHAR(120) NOT NULL,
  points INT UNSIGNED NOT NULL DEFAULT 1,
  `order` INT UNSIGNED NOT NULL DEFAULT 0,
  created_at DATETIME(6) NOT NULL,
  updated_at DATETIME(6) NOT NULL,
  CONSTRAINT fk_questions_quiz FOREIGN KEY (quiz_id) REFERENCES quizzes(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE answers (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  question_id BIGINT NOT NULL,
  text LONGTEXT NOT NULL,
  is_correct BOOLEAN NOT NULL DEFAULT FALSE,
  `order` INT UNSIGNED NOT NULL DEFAULT 0,
  created_at DATETIME(6) NOT NULL,
  updated_at DATETIME(6) NOT NULL,
  CONSTRAINT fk_answers_question FOREIGN KEY (question_id) REFERENCES questions(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE quiz_attempts (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  quiz_id BIGINT NOT NULL,
  score DECIMAL(5,2) NOT NULL DEFAULT 0,
  total_points INT UNSIGNED NOT NULL DEFAULT 0,
  earned_points INT UNSIGNED NOT NULL DEFAULT 0,
  passed BOOLEAN NOT NULL DEFAULT FALSE,
  started_at DATETIME(6) NOT NULL,
  completed_at DATETIME(6) NULL,
  duration_seconds INT UNSIGNED NOT NULL DEFAULT 0,
  weakness_map JSON NOT NULL,
  recommendations JSON NOT NULL,
  created_at DATETIME(6) NOT NULL,
  updated_at DATETIME(6) NOT NULL,
  CONSTRAINT fk_quiz_attempts_user FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_quiz_attempts_quiz FOREIGN KEY (quiz_id) REFERENCES quizzes(id),
  INDEX idx_quiz_attempts_user_quiz_created (user_id, quiz_id, created_at),
  INDEX idx_quiz_attempts_pass_score (passed, score)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE quiz_attempt_answers (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  attempt_id BIGINT NOT NULL,
  question_id BIGINT NOT NULL,
  selected_answer_id BIGINT NULL,
  is_correct BOOLEAN NOT NULL DEFAULT FALSE,
  points_awarded INT UNSIGNED NOT NULL DEFAULT 0,
  created_at DATETIME(6) NOT NULL,
  updated_at DATETIME(6) NOT NULL,
  CONSTRAINT fk_quiz_attempt_answers_attempt FOREIGN KEY (attempt_id) REFERENCES quiz_attempts(id),
  CONSTRAINT fk_quiz_attempt_answers_question FOREIGN KEY (question_id) REFERENCES questions(id),
  CONSTRAINT fk_quiz_attempt_answers_selected FOREIGN KEY (selected_answer_id) REFERENCES answers(id),
  UNIQUE KEY uq_quiz_attempt_question (attempt_id, question_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE phishing_simulations (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(220) NOT NULL,
  scenario LONGTEXT NOT NULL,
  difficulty VARCHAR(24) NOT NULL,
  sender_name VARCHAR(160) NOT NULL,
  sender_email VARCHAR(254) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  body LONGTEXT NOT NULL,
  urls JSON NOT NULL,
  red_flags JSON NOT NULL,
  is_phishing BOOLEAN NOT NULL DEFAULT TRUE,
  training_tip LONGTEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_by_id BIGINT NULL,
  created_at DATETIME(6) NOT NULL,
  updated_at DATETIME(6) NOT NULL,
  CONSTRAINT fk_phishing_created_by FOREIGN KEY (created_by_id) REFERENCES users(id),
  INDEX idx_phishing_difficulty_active (difficulty, is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE phishing_attempts (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  simulation_id BIGINT NOT NULL,
  classification VARCHAR(24) NOT NULL,
  inspected_urls JSON NOT NULL,
  selected_flags JSON NOT NULL,
  correct BOOLEAN NOT NULL DEFAULT FALSE,
  score INT UNSIGNED NOT NULL DEFAULT 0,
  feedback JSON NOT NULL,
  created_at DATETIME(6) NOT NULL,
  updated_at DATETIME(6) NOT NULL,
  CONSTRAINT fk_phishing_attempts_user FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_phishing_attempts_sim FOREIGN KEY (simulation_id) REFERENCES phishing_simulations(id),
  INDEX idx_phishing_attempts_user_sim_created (user_id, simulation_id, created_at),
  INDEX idx_phishing_attempts_correct_score (correct, score)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE incident_categories (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(140) NOT NULL UNIQUE,
  slug VARCHAR(160) NOT NULL UNIQUE,
  description LONGTEXT NOT NULL,
  default_severity VARCHAR(24) NOT NULL,
  created_at DATETIME(6) NOT NULL,
  updated_at DATETIME(6) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE incidents (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  reference_number VARCHAR(32) NOT NULL UNIQUE,
  title VARCHAR(220) NOT NULL,
  category_id BIGINT NOT NULL,
  severity VARCHAR(24) NOT NULL,
  description LONGTEXT NOT NULL,
  affected_system VARCHAR(180) NOT NULL,
  occurred_at DATETIME(6) NOT NULL,
  reporter_id BIGINT NOT NULL,
  assigned_to_id BIGINT NULL,
  status VARCHAR(24) NOT NULL,
  priority_score INT UNSIGNED NOT NULL DEFAULT 50,
  is_draft BOOLEAN NOT NULL DEFAULT FALSE,
  submitted_at DATETIME(6) NULL,
  resolved_at DATETIME(6) NULL,
  closed_at DATETIME(6) NULL,
  created_at DATETIME(6) NOT NULL,
  updated_at DATETIME(6) NOT NULL,
  CONSTRAINT fk_incidents_category FOREIGN KEY (category_id) REFERENCES incident_categories(id),
  CONSTRAINT fk_incidents_reporter FOREIGN KEY (reporter_id) REFERENCES users(id),
  CONSTRAINT fk_incidents_assigned_to FOREIGN KEY (assigned_to_id) REFERENCES users(id),
  INDEX idx_incidents_reference (reference_number),
  INDEX idx_incidents_status_severity (status, severity),
  INDEX idx_incidents_reporter_created (reporter_id, created_at),
  INDEX idx_incidents_assignee_status (assigned_to_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE incident_attachments (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  incident_id BIGINT NOT NULL,
  file VARCHAR(100) NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  content_type VARCHAR(120) NOT NULL,
  size INT UNSIGNED NOT NULL,
  uploaded_by_id BIGINT NULL,
  created_at DATETIME(6) NOT NULL,
  updated_at DATETIME(6) NOT NULL,
  CONSTRAINT fk_incident_attachments_incident FOREIGN KEY (incident_id) REFERENCES incidents(id),
  CONSTRAINT fk_incident_attachments_user FOREIGN KEY (uploaded_by_id) REFERENCES users(id),
  INDEX idx_incident_attachments_incident_created (incident_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE incident_updates (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  incident_id BIGINT NOT NULL,
  actor_id BIGINT NULL,
  status_from VARCHAR(24) NOT NULL DEFAULT '',
  status_to VARCHAR(24) NOT NULL DEFAULT '',
  note LONGTEXT NOT NULL,
  is_internal BOOLEAN NOT NULL DEFAULT FALSE,
  created_at DATETIME(6) NOT NULL,
  updated_at DATETIME(6) NOT NULL,
  CONSTRAINT fk_incident_updates_incident FOREIGN KEY (incident_id) REFERENCES incidents(id),
  CONSTRAINT fk_incident_updates_actor FOREIGN KEY (actor_id) REFERENCES users(id),
  INDEX idx_incident_updates_incident_created (incident_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE incident_assignments (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  incident_id BIGINT NOT NULL,
  assigned_to_id BIGINT NOT NULL,
  assigned_by_id BIGINT NULL,
  note LONGTEXT NOT NULL,
  created_at DATETIME(6) NOT NULL,
  updated_at DATETIME(6) NOT NULL,
  CONSTRAINT fk_incident_assignments_incident FOREIGN KEY (incident_id) REFERENCES incidents(id),
  CONSTRAINT fk_incident_assignments_to FOREIGN KEY (assigned_to_id) REFERENCES users(id),
  CONSTRAINT fk_incident_assignments_by FOREIGN KEY (assigned_by_id) REFERENCES users(id),
  INDEX idx_incident_assignments_to_created (assigned_to_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE alerts (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(220) NOT NULL,
  body LONGTEXT NOT NULL,
  priority VARCHAR(24) NOT NULL,
  alert_type VARCHAR(32) NOT NULL,
  audience_role VARCHAR(40) NOT NULL DEFAULT '',
  starts_at DATETIME(6) NOT NULL,
  expires_at DATETIME(6) NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_by_id BIGINT NULL,
  created_at DATETIME(6) NOT NULL,
  updated_at DATETIME(6) NOT NULL,
  CONSTRAINT fk_alerts_created_by FOREIGN KEY (created_by_id) REFERENCES users(id),
  INDEX idx_alerts_active_window (is_active, starts_at, expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE notifications (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  alert_id BIGINT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  read_at DATETIME(6) NULL,
  created_at DATETIME(6) NOT NULL,
  updated_at DATETIME(6) NOT NULL,
  CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_notifications_alert FOREIGN KEY (alert_id) REFERENCES alerts(id),
  UNIQUE KEY uq_notifications_user_alert (user_id, alert_id),
  INDEX idx_notifications_user_read (user_id, is_read)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE audit_logs (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  actor_id BIGINT NULL,
  action VARCHAR(120) NOT NULL,
  resource_type VARCHAR(120) NOT NULL DEFAULT '',
  resource_id VARCHAR(80) NOT NULL DEFAULT '',
  ip_address CHAR(39) NULL,
  user_agent LONGTEXT NOT NULL,
  metadata JSON NOT NULL,
  created_at DATETIME(6) NOT NULL,
  CONSTRAINT fk_audit_logs_actor FOREIGN KEY (actor_id) REFERENCES users(id),
  INDEX idx_audit_logs_actor_created (actor_id, created_at),
  INDEX idx_audit_logs_action_resource (action, resource_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

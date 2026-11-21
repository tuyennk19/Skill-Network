CREATE DATABASE IF NOT EXISTS skill_network
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE skill_network;

CREATE TABLE users (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  email         VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  full_name     VARCHAR(100) NOT NULL,
  role          ENUM('student','admin') NOT NULL DEFAULT 'student',
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE career_tracks (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  code        VARCHAR(50)  NOT NULL UNIQUE,
  name        VARCHAR(150) NOT NULL,
  description TEXT,
  is_active   TINYINT(1) NOT NULL DEFAULT 1,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE track_criteria (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  track_id    INT NOT NULL,
  code        VARCHAR(50)  NOT NULL,
  name        VARCHAR(100) NOT NULL,
  description VARCHAR(255),
  rubric_low  VARCHAR(500) NOT NULL,
  rubric_mid  VARCHAR(500) NOT NULL,
  rubric_high VARCHAR(500) NOT NULL,
  sort_order  INT NOT NULL DEFAULT 0,
  UNIQUE KEY uq_track_code (track_id, code),
  CONSTRAINT fk_tc_track FOREIGN KEY (track_id) REFERENCES career_tracks(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE courses (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  title          VARCHAR(200) NOT NULL,
  description    TEXT,
  level          VARCHAR(30)  NOT NULL DEFAULT 'Cơ bản',
  duration_hours INT,
  thumbnail_url  VARCHAR(255),
  is_demo        TINYINT(1) NOT NULL DEFAULT 0,
  is_active      TINYINT(1) NOT NULL DEFAULT 1,
  created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE course_criteria (
  course_id    INT NOT NULL,
  criterion_id INT NOT NULL,
  PRIMARY KEY (course_id, criterion_id),
  INDEX idx_cc_criterion (criterion_id),
  CONSTRAINT fk_cc_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
  CONSTRAINT fk_cc_criterion FOREIGN KEY (criterion_id) REFERENCES track_criteria(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE cases (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  track_id   INT NOT NULL,
  title      VARCHAR(200) NOT NULL,
  scenario   TEXT NOT NULL,
  difficulty VARCHAR(30) NOT NULL DEFAULT 'Trung bình',
  is_active  TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_cases_track (track_id, is_active),
  CONSTRAINT fk_cases_track FOREIGN KEY (track_id) REFERENCES career_tracks(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE assessments (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  user_id       INT NOT NULL,
  case_id       INT NOT NULL,
  track_id      INT NOT NULL,
  answer        TEXT NOT NULL,
  overall_score DECIMAL(4,2) NOT NULL,
  result_json   JSON NOT NULL,
  is_mock       TINYINT(1) NOT NULL DEFAULT 0,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_as_user_time (user_id, created_at),
  INDEX idx_as_track (track_id),
  CONSTRAINT chk_overall CHECK (overall_score BETWEEN 0 AND 10),
  CONSTRAINT fk_as_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT,
  CONSTRAINT fk_as_case FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE RESTRICT,
  CONSTRAINT fk_as_track FOREIGN KEY (track_id) REFERENCES career_tracks(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE assessment_scores (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  assessment_id INT NOT NULL,
  criterion_id  INT NOT NULL,
  score         DECIMAL(4,2) NOT NULL,
  comment       VARCHAR(500),
  UNIQUE KEY uq_as_criterion (assessment_id, criterion_id),
  CONSTRAINT chk_score CHECK (score BETWEEN 0 AND 10),
  CONSTRAINT fk_asc_as FOREIGN KEY (assessment_id) REFERENCES assessments(id) ON DELETE CASCADE,
  CONSTRAINT fk_asc_crit FOREIGN KEY (criterion_id) REFERENCES track_criteria(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE recommendations (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  assessment_id INT NOT NULL,
  course_id     INT NOT NULL,
  criterion_id  INT NOT NULL,
  reason        VARCHAR(255),
  CONSTRAINT fk_rc_as FOREIGN KEY (assessment_id) REFERENCES assessments(id) ON DELETE CASCADE,
  CONSTRAINT fk_rc_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
  CONSTRAINT fk_rc_crit FOREIGN KEY (criterion_id) REFERENCES track_criteria(id) ON DELETE CASCADE
) ENGINE=InnoDB;

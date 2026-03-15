-- Users table
CREATE TABLE IF NOT EXISTS users (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  uuid CHAR(36) NOT NULL UNIQUE,
  fname VARCHAR(100) NULL,
  lname VARCHAR(100) NULL,
  email VARCHAR(190) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  email_verified_at DATETIME NULL,
  last_login_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_users_email (email),
  INDEX idx_users_is_active (is_active),
  INDEX idx_users_verified (email_verified_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- User sessions table
CREATE TABLE IF NOT EXISTS user_sessions (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  session_id CHAR(36) NOT NULL UNIQUE,
  ip_address VARCHAR(45) NULL,
  user_agent VARCHAR(512) NULL,
  device_label VARCHAR(120) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_seen_at DATETIME NULL,
  revoked_at DATETIME NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_sessions_user (user_id),
  INDEX idx_sessions_revoked (revoked_at),
  INDEX idx_sessions_last_seen (last_seen_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Refresh tokens table
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  session_id CHAR(36) NOT NULL,
  token_hash CHAR(64) NOT NULL UNIQUE,
  expires_at DATETIME NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  revoked_at DATETIME NULL,
  replaced_by_token_hash CHAR(64) NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (session_id) REFERENCES user_sessions(session_id) ON DELETE CASCADE,
  INDEX idx_refresh_user (user_id),
  INDEX idx_refresh_session (session_id),
  INDEX idx_refresh_expires (expires_at),
  INDEX idx_refresh_revoked (revoked_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Email tokens table
CREATE TABLE IF NOT EXISTS email_tokens (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(190) NOT NULL,
  user_id BIGINT UNSIGNED DEFAULT NULL,
  type VARCHAR(100) NOT NULL,
  token_hash CHAR(64) NOT NULL UNIQUE,
  is_used TINYINT(1) NOT NULL DEFAULT 0,
  expires_at DATETIME NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  used_at DATETIME NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_email_tokens_user (user_id),
  INDEX idx_email_tokens_type (type),
  INDEX idx_email_tokens_used (is_used),
  INDEX idx_email_tokens_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Login attempts table
CREATE TABLE IF NOT EXISTS login_attempts (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(190) NULL,
  ip_address VARCHAR(45) NULL,
  success TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_attempts_email (email),
  INDEX idx_attempts_ip (ip_address),
  INDEX idx_attempts_time (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- States table
CREATE TABLE IF NOT EXISTS states (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  code VARCHAR(10) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Roles table
CREATE TABLE IF NOT EXISTS roles (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  parent_id BIGINT UNSIGNED NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (parent_id) REFERENCES roles(id) ON DELETE SET NULL,
  UNIQUE KEY uq_role_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Permissions table
CREATE TABLE IF NOT EXISTS permissions (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- User roles table
CREATE TABLE IF NOT EXISTS user_roles (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  role_id BIGINT UNSIGNED NOT NULL,
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
  UNIQUE KEY uq_user_role (user_id, role_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Role permissions table
CREATE TABLE IF NOT EXISTS role_permissions (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  role_id BIGINT UNSIGNED NOT NULL,
  permission_id BIGINT UNSIGNED NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
  FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE,
  UNIQUE KEY uq_role_permission (role_id, permission_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS subscriptions (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  uuid CHAR(36) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  description TEXT NULL,
  price_monthly DECIMAL(10,2) NULL,
  price_yearly DECIMAL(10,2) NULL,
  max_users INT NULL,
  max_branches INT NULL,
  max_storage_mb INT NULL,
  parent_id BIGINT UNSIGNED NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (parent_id) REFERENCES subscriptions(id) ON DELETE SET NULL,
  INDEX idx_subscriptions_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS subscription_permissions (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  subscription_id BIGINT UNSIGNED NOT NULL,
  permission_id BIGINT UNSIGNED NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE CASCADE,
  FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE,
  UNIQUE KEY uq_subscription_permission (subscription_id, permission_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


CREATE TABLE IF NOT EXISTS clinics (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  uuid CHAR(36) NOT NULL UNIQUE,
  name VARCHAR(200) NOT NULL,
  email VARCHAR(190) NULL,
  phone VARCHAR(50) NULL,
  address TEXT NULL,
  city VARCHAR(190) NULL,
  state_id BIGINT UNSIGNED NULL,
  owner_id BIGINT UNSIGNED NOT NULL,
  subscription_id BIGINT UNSIGNED NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (state_id) REFERENCES states(id) ON DELETE SET NULL,
  FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE SET NULL,
  INDEX idx_clinics_subscription (subscription_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS clinic_subscriptions (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  clinic_id BIGINT UNSIGNED NOT NULL,
  subscription_id BIGINT UNSIGNED NOT NULL,
  start_date DATETIME NOT NULL,
  end_date DATETIME NULL,
  price_paid DECIMAL(10,2) NULL,
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE,
  FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE CASCADE,
  INDEX idx_clinic_subs_clinic (clinic_id),
  INDEX idx_clinic_subs_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Branches table
CREATE TABLE IF NOT EXISTS branches (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  uuid CHAR(36) NOT NULL UNIQUE,
  clinic_id BIGINT UNSIGNED NOT NULL,
  name VARCHAR(150) NOT NULL,
  address TEXT NULL,
  phone VARCHAR(50) NULL,
  city  VARCHAR(150) DEFAULT NULL,
  state_id BIGINT UNSIGNED NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE,
  FOREIGN KEY (state_id) REFERENCES states(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS branch_users (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  branch_id BIGINT UNSIGNED NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  role_id BIGINT UNSIGNED NOT NULL,
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
  UNIQUE KEY uq_branch_user (branch_id, user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS staff_profiles (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL UNIQUE,
  clinic_id BIGINT UNSIGNED NULL,

  staff_id VARCHAR(50) NULL UNIQUE,

  phone VARCHAR(50) NULL,
  alt_phone VARCHAR(50) NULL,
  gender ENUM('male','female','other') NULL,
  date_of_birth DATE NULL,
  profile_photo_url VARCHAR(512) NULL,

  address TEXT NULL,
  city VARCHAR(150) NULL,
  state_id BIGINT UNSIGNED NULL,

  date_joined DATE NULL,
  date_left DATE NULL,

  employment_type ENUM('full_time','part_time','contract','locum') NULL,
  status ENUM('active','suspended','terminated','resigned') DEFAULT 'active',

  salary DECIMAL(12,2) NULL,
  salary_frequency ENUM('monthly','weekly','daily','hourly') DEFAULT 'monthly',

  specialization VARCHAR(150) NULL,
  license_number VARCHAR(100) NULL,
  license_expiry DATE NULL,
  qualification VARCHAR(255) NULL,

  emergency_contact_name VARCHAR(150) NULL,
  emergency_contact_phone VARCHAR(50) NULL,
  emergency_contact_relationship VARCHAR(80) NULL,

  notes TEXT NULL,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE,
  FOREIGN KEY (state_id) REFERENCES states(id) ON DELETE SET NULL,

  INDEX idx_staff_status (status),
  INDEX idx_staff_specialization (specialization)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


CREATE TABLE IF NOT EXISTS branch_user_invites (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

  branch_id BIGINT UNSIGNED NOT NULL,
  clinic_id BIGINT UNSIGNED NOT NULL,

  email VARCHAR(190) NOT NULL,
  role_id BIGINT UNSIGNED NOT NULL,

  invited_by BIGINT UNSIGNED NOT NULL,

  token CHAR(64) NOT NULL UNIQUE,

  status ENUM('pending','accepted','declined','expired') DEFAULT 'pending',

  expires_at DATETIME NOT NULL,
  accepted_at DATETIME NULL, 

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE,
  FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE,
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
  FOREIGN KEY (invited_by) REFERENCES users(id) ON DELETE CASCADE,

  INDEX idx_invite_email (email),
  INDEX idx_invite_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS departments (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  uuid CHAR(36) NOT NULL UNIQUE,

  branch_id BIGINT UNSIGNED NOT NULL,

  name VARCHAR(150) NOT NULL,
  description TEXT NULL,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE,

  UNIQUE KEY uq_branch_department (branch_id, name),

  INDEX idx_department_branch (branch_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


CREATE TABLE IF NOT EXISTS staff_departments (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

  staff_profile_id BIGINT UNSIGNED NOT NULL,
  department_id BIGINT UNSIGNED NOT NULL,

  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (staff_profile_id) REFERENCES staff_profiles(id) ON DELETE CASCADE,
  FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE,

  UNIQUE KEY uq_staff_department (staff_profile_id, department_id),

  INDEX idx_staff_department_staff (staff_profile_id),
  INDEX idx_staff_department_department (department_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS clinic_assets (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  clinic_id BIGINT UNSIGNED NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  file_uuid CHAR(36) NOT NULL UNIQUE,
  file_original_name VARCHAR(255) NULL,
  file_name VARCHAR(255) NULL,
  file_url VARCHAR(512) NOT NULL,
  file_size BIGINT UNSIGNED NULL,
  mime_type VARCHAR(120) NULL,
  extension VARCHAR(20) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_clinic_assets_clinic (clinic_id),
  INDEX idx_clinic_assets_user (user_id),
  INDEX idx_clinic_assets_deleted (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS asset_transfers (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  asset_id BIGINT UNSIGNED NOT NULL,
  sender_id BIGINT UNSIGNED NOT NULL,
  receiver_id BIGINT UNSIGNED NOT NULL,
  message VARCHAR(500) NULL,
  status ENUM('sent','received','declined') DEFAULT 'sent',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  received_at DATETIME NULL,
  FOREIGN KEY (asset_id) REFERENCES clinic_assets(id) ON DELETE CASCADE,
  FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_transfer_sender (sender_id),
  INDEX idx_transfer_receiver (receiver_id),
  INDEX idx_transfer_asset (asset_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS patients (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  uuid CHAR(36) NOT NULL UNIQUE,

  clinic_id BIGINT UNSIGNED NOT NULL,
  branch_id BIGINT UNSIGNED NULL,

  patient_code VARCHAR(50) NULL UNIQUE,

  first_name VARCHAR(120) NOT NULL,
  last_name VARCHAR(120) NOT NULL,
  middle_name VARCHAR(120) NULL,

  gender ENUM('male','female') NULL,
  date_of_birth DATE NULL,

  phone VARCHAR(50) NULL,
  alt_phone VARCHAR(50) NULL,
  email VARCHAR(190) NULL,
   profile_photo_url VARCHAR(512) NULL,

  address TEXT NULL,
  city VARCHAR(150) NULL,
  state_id BIGINT UNSIGNED NULL,

  blood_group VARCHAR(10) NULL,
  genotype VARCHAR(10) NULL,
  allergies TEXT NULL,
  chronic_conditions TEXT NULL,

  emergency_contact_name VARCHAR(150) NULL,
  emergency_contact_phone VARCHAR(50) NULL,
  emergency_contact_relationship VARCHAR(80) NULL,

  status ENUM('active','inactive','deceased') DEFAULT 'active',

  registered_by BIGINT UNSIGNED NULL,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE,
  FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL,
  FOREIGN KEY (state_id) REFERENCES states(id) ON DELETE SET NULL,
  FOREIGN KEY (registered_by) REFERENCES users(id) ON DELETE SET NULL,

  INDEX idx_patient_clinic (clinic_id),
  INDEX idx_patient_branch (branch_id),
  INDEX idx_patient_status (status),
  INDEX idx_patient_phone (phone)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS patient_departments (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

  patient_id BIGINT UNSIGNED NOT NULL,
  department_id BIGINT UNSIGNED NOT NULL,

  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
  FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE,

  UNIQUE KEY uq_patient_department (patient_id, department_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS patient_doctors (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

  patient_id BIGINT UNSIGNED NOT NULL,
  staff_profile_id BIGINT UNSIGNED NOT NULL,

  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_primary TINYINT(1) DEFAULT 0,

  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
  FOREIGN KEY (staff_profile_id) REFERENCES staff_profiles(id) ON DELETE CASCADE,

  UNIQUE KEY uq_patient_doctor (patient_id, staff_profile_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS patient_assets (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  patient_id BIGINT UNSIGNED NOT NULL,
  asset_id BIGINT UNSIGNED NOT NULL,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
  FOREIGN KEY (asset_id) REFERENCES clinic_assets(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS patient_visits (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  uuid CHAR(36) NOT NULL UNIQUE,

  patient_id BIGINT UNSIGNED NOT NULL,
  clinic_id BIGINT UNSIGNED NOT NULL,
  branch_id BIGINT UNSIGNED NULL,
  department_id BIGINT UNSIGNED NULL,

  attending_staff_id BIGINT UNSIGNED NULL,

  visit_type ENUM('consultation','emergency','follow_up','admission','lab','pharmacy') DEFAULT 'consultation',

  visit_status ENUM('waiting','in_progress','completed','cancelled','admitted') DEFAULT 'waiting',

  reason_for_visit VARCHAR(255) NULL,
  symptoms TEXT NULL,
  diagnosis TEXT NULL,
  notes TEXT NULL,

  visit_date DATETIME NOT NULL,
  completed_at DATETIME NULL,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
  FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE,
  FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL,
  FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL,
  FOREIGN KEY (attending_staff_id) REFERENCES staff_profiles(id) ON DELETE SET NULL,

  INDEX idx_visit_patient (patient_id),
  INDEX idx_visit_status (visit_status),
  INDEX idx_visit_date (visit_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS appointments (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  uuid CHAR(36) NOT NULL UNIQUE,

  patient_id BIGINT UNSIGNED NOT NULL,
  clinic_id BIGINT UNSIGNED NOT NULL,
  branch_id BIGINT UNSIGNED NULL,
  department_id BIGINT UNSIGNED NULL,
  staff_profile_id BIGINT UNSIGNED NULL,

  appointment_date DATETIME NOT NULL,
  status ENUM('scheduled','confirmed','completed','cancelled','no_show') DEFAULT 'scheduled',

  reason TEXT NULL,
  notes TEXT NULL,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
  FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE,
  FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL,
  FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL,
  FOREIGN KEY (staff_profile_id) REFERENCES staff_profiles(id) ON DELETE SET NULL,

  INDEX idx_appointment_date (appointment_date),
  INDEX idx_appointment_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS patient_vitals (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

  visit_id BIGINT UNSIGNED NOT NULL,

  temperature DECIMAL(5,2) NULL,
  blood_pressure VARCHAR(20) NULL,
  pulse_rate INT NULL,
  respiratory_rate INT NULL,
  oxygen_saturation DECIMAL(5,2) NULL,
  weight DECIMAL(6,2) NULL,
  height DECIMAL(6,2) NULL,

  recorded_by BIGINT UNSIGNED NULL,
  recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (visit_id) REFERENCES patient_visits(id) ON DELETE CASCADE,
  FOREIGN KEY (recorded_by) REFERENCES staff_profiles(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS prescriptions (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

  visit_id BIGINT UNSIGNED NOT NULL,
  prescribed_by BIGINT UNSIGNED NULL,

  medication_name VARCHAR(255) NOT NULL,
  dosage VARCHAR(100) NULL,
  frequency VARCHAR(100) NULL,
  duration VARCHAR(100) NULL,
  instructions TEXT NULL,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (visit_id) REFERENCES patient_visits(id) ON DELETE CASCADE,
  FOREIGN KEY (prescribed_by) REFERENCES staff_profiles(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


CREATE TABLE IF NOT EXISTS lab_tests (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

  visit_id BIGINT UNSIGNED NOT NULL,

  test_name VARCHAR(255) NOT NULL,
  result TEXT NULL,
  status ENUM('requested','in_progress','completed') DEFAULT 'requested',

  requested_by BIGINT UNSIGNED NULL,
  performed_by BIGINT UNSIGNED NULL,

  requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME NULL,

  FOREIGN KEY (visit_id) REFERENCES patient_visits(id) ON DELETE CASCADE,
  FOREIGN KEY (requested_by) REFERENCES staff_profiles(id) ON DELETE SET NULL,
  FOREIGN KEY (performed_by) REFERENCES staff_profiles(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS invoices (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  uuid CHAR(36) NOT NULL UNIQUE,

  patient_id BIGINT UNSIGNED NOT NULL,
  visit_id BIGINT UNSIGNED NULL,
  clinic_id BIGINT UNSIGNED NOT NULL,

  total_amount DECIMAL(12,2) NOT NULL,
  amount_paid DECIMAL(12,2) DEFAULT 0,
  status ENUM('unpaid','partial','paid','cancelled') DEFAULT 'unpaid',

  issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  due_date DATETIME NULL,

  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
  FOREIGN KEY (visit_id) REFERENCES patient_visits(id) ON DELETE SET NULL,
  FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS patient_portal_accounts (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

  patient_id BIGINT UNSIGNED NOT NULL UNIQUE,

  email VARCHAR(190) NULL UNIQUE,

  password_hash VARCHAR(255) NULL,

  is_active TINYINT(1) NOT NULL DEFAULT 1,
  email_verified_at DATETIME NULL,

  last_login_at DATETIME NULL,
  last_login_ip VARCHAR(45) NULL,

  failed_login_attempts INT DEFAULT 0,
  locked_until DATETIME NULL,

  created_by BIGINT UNSIGNED NULL, -- staff who enabled portal
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,

  INDEX idx_portal_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


CREATE TABLE IF NOT EXISTS patient_portal_tokens (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

  portal_account_id BIGINT UNSIGNED NOT NULL,

  token_hash CHAR(64) NOT NULL UNIQUE,
  type ENUM('activation','password_reset') NOT NULL,

  expires_at DATETIME NOT NULL,
  used_at DATETIME NULL,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (portal_account_id)
    REFERENCES patient_portal_accounts(id)
    ON DELETE CASCADE,

  INDEX idx_portal_token_type (type),
  INDEX idx_portal_token_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS patient_portal_sessions (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

  portal_account_id BIGINT UNSIGNED NOT NULL,
  session_id CHAR(36) NOT NULL UNIQUE,

  ip_address VARCHAR(45) NULL,
  user_agent VARCHAR(512) NULL,
  device_label VARCHAR(120) NULL,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_seen_at DATETIME NULL,
  revoked_at DATETIME NULL,

  FOREIGN KEY (portal_account_id)
    REFERENCES patient_portal_accounts(id)
    ON DELETE CASCADE,

  INDEX idx_portal_session_account (portal_account_id),
  INDEX idx_portal_session_revoked (revoked_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;



CREATE TABLE IF NOT EXISTS patient_portal_login_attempts (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

  email VARCHAR(190) NULL,
  phone VARCHAR(50) NULL,
  ip_address VARCHAR(45) NULL,

  success TINYINT(1) DEFAULT 0,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_portal_attempt_email (email),
  INDEX idx_portal_attempt_phone (phone),
  INDEX idx_portal_attempt_ip (ip_address),
  INDEX idx_portal_attempt_time (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
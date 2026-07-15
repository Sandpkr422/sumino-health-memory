-- SUMINO – AI Health Memory Relational Database Schema Blueprint
-- Configured for PostgreSQL / Standard Relational Databases

-- 1. USERS TABLE
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    dob DATE,
    gender VARCHAR(50)
);

-- 2. REPORTS TABLE
CREATE TABLE reports (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    upload_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    lab_name VARCHAR(255),
    pdf_url VARCHAR(500),
    CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 3. BIOMARKERS TABLE
CREATE TABLE biomarkers (
    report_id INT REFERENCES reports(id) ON DELETE CASCADE,
    marker VARCHAR(255) NOT NULL,
    value NUMERIC(8, 2) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    reference_range VARCHAR(100),
    status VARCHAR(50),
    PRIMARY KEY (report_id, marker),
    CONSTRAINT fk_report FOREIGN KEY (report_id) REFERENCES reports(id)
);

-- 4. CONVERSATIONS TABLE
CREATE TABLE conversations (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_user_conv FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Create Indexes for optimization
CREATE INDEX idx_reports_user ON reports(user_id);
CREATE INDEX idx_biomarkers_report ON biomarkers(report_id);
CREATE INDEX idx_conversations_user ON conversations(user_id);

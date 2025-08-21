-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "first_name" TEXT,
    "last_name" TEXT,
    "level" INTEGER NOT NULL DEFAULT 1,
    "xp" INTEGER NOT NULL DEFAULT 0,
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "preferences" TEXT NOT NULL DEFAULT '{}',
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "verification_token" TEXT,
    "reset_token" TEXT,
    "reset_token_expiry" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "last_login_at" DATETIME
);

-- CreateTable
CREATE TABLE "scenarios" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL,
    "estimated_time" INTEGER NOT NULL,
    "xp_reward" INTEGER NOT NULL,
    "ticket_template" TEXT NOT NULL,
    "customer_persona" TEXT NOT NULL,
    "knowledge_base_entries" TEXT NOT NULL,
    "assessment_criteria" TEXT NOT NULL,
    "prerequisites" TEXT NOT NULL DEFAULT '[]',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "user_sessions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "scenario_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "started_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" DATETIME,
    "chat_history" TEXT NOT NULL DEFAULT '[]',
    "performance_data" TEXT NOT NULL DEFAULT '{}',
    "verification_status" TEXT NOT NULL DEFAULT '{}',
    "resolution_data" TEXT NOT NULL DEFAULT '{}',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "user_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "user_sessions_scenario_id_fkey" FOREIGN KEY ("scenario_id") REFERENCES "scenarios" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "performance_metrics" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "scenario_id" TEXT NOT NULL,
    "verification_score" REAL NOT NULL,
    "communication_score" REAL NOT NULL,
    "technical_score" REAL NOT NULL,
    "documentation_score" REAL NOT NULL,
    "response_time_score" REAL NOT NULL,
    "overall_score" REAL NOT NULL,
    "xp_earned" INTEGER NOT NULL,
    "completion_time" INTEGER NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "performance_metrics_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "performance_metrics_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "user_sessions" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "performance_metrics_scenario_id_fkey" FOREIGN KEY ("scenario_id") REFERENCES "scenarios" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "chat_messages" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "session_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "sender_type" TEXT NOT NULL,
    "message_content" TEXT NOT NULL,
    "message_type" TEXT NOT NULL DEFAULT 'text',
    "metadata" TEXT NOT NULL DEFAULT '{}',
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "chat_messages_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "user_sessions" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "chat_messages_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "achievements" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "tier" TEXT NOT NULL,
    "xp_reward" INTEGER NOT NULL,
    "criteria" TEXT NOT NULL DEFAULT '{}',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "user_achievements" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "achievement_id" TEXT NOT NULL,
    "earned_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "user_achievements_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "user_achievements_achievement_id_fkey" FOREIGN KEY ("achievement_id") REFERENCES "achievements" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_verification_token_key" ON "users"("verification_token");

-- CreateIndex
CREATE UNIQUE INDEX "users_reset_token_key" ON "users"("reset_token");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_verification_token_idx" ON "users"("verification_token");

-- CreateIndex
CREATE INDEX "users_reset_token_idx" ON "users"("reset_token");

-- CreateIndex
CREATE INDEX "scenarios_difficulty_idx" ON "scenarios"("difficulty");

-- CreateIndex
CREATE INDEX "scenarios_is_active_idx" ON "scenarios"("is_active");

-- CreateIndex
CREATE INDEX "user_sessions_user_id_idx" ON "user_sessions"("user_id");

-- CreateIndex
CREATE INDEX "user_sessions_scenario_id_idx" ON "user_sessions"("scenario_id");

-- CreateIndex
CREATE INDEX "user_sessions_status_idx" ON "user_sessions"("status");

-- CreateIndex
CREATE INDEX "performance_metrics_user_id_idx" ON "performance_metrics"("user_id");

-- CreateIndex
CREATE INDEX "performance_metrics_session_id_idx" ON "performance_metrics"("session_id");

-- CreateIndex
CREATE INDEX "performance_metrics_scenario_id_idx" ON "performance_metrics"("scenario_id");

-- CreateIndex
CREATE INDEX "chat_messages_session_id_idx" ON "chat_messages"("session_id");

-- CreateIndex
CREATE INDEX "chat_messages_user_id_idx" ON "chat_messages"("user_id");

-- CreateIndex
CREATE INDEX "chat_messages_timestamp_idx" ON "chat_messages"("timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "user_achievements_user_id_achievement_id_key" ON "user_achievements"("user_id", "achievement_id");

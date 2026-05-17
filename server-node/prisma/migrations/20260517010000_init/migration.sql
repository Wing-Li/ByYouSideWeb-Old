-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'DISABLED', 'DESTROY_REQUESTED', 'DESTROYED');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('UNKNOWN', 'MALE', 'FEMALE');

-- CreateEnum
CREATE TYPE "VerificationPurpose" AS ENUM ('PASSWORD_RESET', 'EMAIL_VERIFY');

-- CreateEnum
CREATE TYPE "FriendStatus" AS ENUM ('REJECTED_BLOCKED', 'REJECTED', 'PENDING', 'ACCEPTED');

-- CreateEnum
CREATE TYPE "FriendBlockState" AS ENUM ('NORMAL', 'REQUESTER_BLOCKED_RECEIVER', 'RECEIVER_BLOCKED_REQUESTER');

-- CreateEnum
CREATE TYPE "VipPlanStatus" AS ENUM ('DISABLED', 'ACTIVE', 'DUET', 'TEST');

-- CreateEnum
CREATE TYPE "VipOrderSource" AS ENUM ('IOS', 'ANDROID', 'BIND', 'ADMIN');

-- CreateTable
CREATE TABLE "users" (
    "id" BIGSERIAL NOT NULL,
    "username" VARCHAR(20) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "nickname" VARCHAR(20) NOT NULL DEFAULT '',
    "avatar_url" TEXT NOT NULL DEFAULT '',
    "gender" "Gender" NOT NULL DEFAULT 'UNKNOWN',
    "bio" VARCHAR(200) NOT NULL DEFAULT '',
    "birthday" TIMESTAMP(3),
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "disabled_days" INTEGER NOT NULL DEFAULT 0,
    "upload_interval_minutes" INTEGER NOT NULL DEFAULT 120,
    "vip_level" INTEGER NOT NULL DEFAULT 0,
    "vip_source" "VipOrderSource",
    "vip_expires_at" TIMESTAMP(3),
    "vip_bind_quota_total" INTEGER NOT NULL DEFAULT 0,
    "vip_bind_quota_used" INTEGER NOT NULL DEFAULT 0,
    "destroy_requested_at" TIMESTAMP(3),
    "destroy_reason" TEXT,
    "last_location_address" TEXT NOT NULL DEFAULT '',
    "last_location_longitude" DECIMAL(10,7) NOT NULL DEFAULT 0,
    "last_location_latitude" DECIMAL(10,7) NOT NULL DEFAULT 0,
    "last_location_at" TIMESTAMP(3),
    "push_device_type" VARCHAR(20),
    "push_alias_type" VARCHAR(50),
    "push_alias" VARCHAR(255),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_codes" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT,
    "email" VARCHAR(255) NOT NULL,
    "code_hash" VARCHAR(255) NOT NULL,
    "purpose" "VerificationPurpose" NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "consumed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "verification_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "friend_relations" (
    "id" BIGSERIAL NOT NULL,
    "requester_id" BIGINT NOT NULL,
    "receiver_id" BIGINT NOT NULL,
    "requester_alias" VARCHAR(50) NOT NULL DEFAULT '',
    "receiver_alias" VARCHAR(50) NOT NULL DEFAULT '',
    "is_best_friend" BOOLEAN NOT NULL DEFAULT false,
    "status" "FriendStatus" NOT NULL DEFAULT 'PENDING',
    "block_state" "FriendBlockState" NOT NULL DEFAULT 'NORMAL',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "friend_relations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "device_snapshots" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "device_name" VARCHAR(100) NOT NULL DEFAULT '',
    "screen_status" VARCHAR(50) NOT NULL DEFAULT '',
    "screen_level" VARCHAR(50) NOT NULL DEFAULT '',
    "battery_status" VARCHAR(50) NOT NULL DEFAULT '',
    "battery_level" VARCHAR(50) NOT NULL DEFAULT '',
    "volume_level" VARCHAR(50) NOT NULL DEFAULT '',
    "bluetooth_status" VARCHAR(50) NOT NULL DEFAULT '',
    "bluetooth_name" VARCHAR(100) NOT NULL DEFAULT '',
    "wifi_status" VARCHAR(50) NOT NULL DEFAULT '',
    "wifi_name" VARCHAR(100) NOT NULL DEFAULT '',
    "gps_status" VARCHAR(50) NOT NULL DEFAULT '',
    "location_source" VARCHAR(50) NOT NULL DEFAULT '',
    "location_address" TEXT NOT NULL DEFAULT '',
    "location_longitude" DECIMAL(10,7) NOT NULL DEFAULT 0,
    "location_latitude" DECIMAL(10,7) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "device_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "memoirs" (
    "id" BIGSERIAL NOT NULL,
    "friend_relation_id" BIGINT NOT NULL,
    "author_id" BIGINT NOT NULL,
    "title" VARCHAR(120) NOT NULL DEFAULT '',
    "content" TEXT NOT NULL,
    "happened_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "memoirs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "moments" (
    "id" BIGSERIAL NOT NULL,
    "friend_relation_id" BIGINT NOT NULL,
    "author_id" BIGINT NOT NULL,
    "content" TEXT NOT NULL,
    "happened_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "moments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vip_plans" (
    "id" BIGSERIAL NOT NULL,
    "name" VARCHAR(80) NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "level" INTEGER NOT NULL DEFAULT 1,
    "duration_months" INTEGER NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "product_code" VARCHAR(120) NOT NULL,
    "status" "VipPlanStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vip_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vip_orders" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "plan_id" BIGINT NOT NULL,
    "source" "VipOrderSource" NOT NULL,
    "bind_from_user_id" BIGINT,
    "amount" DECIMAL(10,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vip_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app_configs" (
    "id" BIGSERIAL NOT NULL,
    "environment" VARCHAR(50) NOT NULL DEFAULT 'development',
    "app_name" VARCHAR(80) NOT NULL DEFAULT '伴你左右',
    "un_check_mode" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "app_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "announcements" (
    "id" BIGSERIAL NOT NULL,
    "author_id" BIGINT NOT NULL,
    "title" VARCHAR(120) NOT NULL,
    "author_name" VARCHAR(50) NOT NULL DEFAULT '管理员',
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "announcements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feedbacks" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "feedbacks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app_versions" (
    "id" BIGSERIAL NOT NULL,
    "title" VARCHAR(120) NOT NULL DEFAULT '',
    "description" TEXT NOT NULL DEFAULT '',
    "android_version_name" VARCHAR(50) NOT NULL DEFAULT '',
    "ios_version_name" VARCHAR(50) NOT NULL DEFAULT '',
    "android_download_url" TEXT NOT NULL DEFAULT '',
    "ios_download_url" TEXT NOT NULL DEFAULT '',
    "force_update" BOOLEAN NOT NULL DEFAULT false,
    "released_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "app_versions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "verification_codes_email_purpose_created_at_idx" ON "verification_codes"("email", "purpose", "created_at");

-- CreateIndex
CREATE INDEX "verification_codes_user_id_idx" ON "verification_codes"("user_id");

-- CreateIndex
CREATE INDEX "friend_relations_requester_id_status_updated_at_idx" ON "friend_relations"("requester_id", "status", "updated_at");

-- CreateIndex
CREATE INDEX "friend_relations_receiver_id_status_updated_at_idx" ON "friend_relations"("receiver_id", "status", "updated_at");

-- CreateIndex
CREATE UNIQUE INDEX "friend_relations_requester_id_receiver_id_key" ON "friend_relations"("requester_id", "receiver_id");

-- CreateIndex
CREATE INDEX "device_snapshots_user_id_created_at_idx" ON "device_snapshots"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "memoirs_friend_relation_id_happened_at_idx" ON "memoirs"("friend_relation_id", "happened_at");

-- CreateIndex
CREATE INDEX "memoirs_author_id_created_at_idx" ON "memoirs"("author_id", "created_at");

-- CreateIndex
CREATE INDEX "moments_friend_relation_id_happened_at_idx" ON "moments"("friend_relation_id", "happened_at");

-- CreateIndex
CREATE INDEX "moments_author_id_created_at_idx" ON "moments"("author_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "vip_plans_product_code_key" ON "vip_plans"("product_code");

-- CreateIndex
CREATE INDEX "vip_plans_status_duration_months_idx" ON "vip_plans"("status", "duration_months");

-- CreateIndex
CREATE INDEX "vip_orders_user_id_created_at_idx" ON "vip_orders"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "vip_orders_plan_id_idx" ON "vip_orders"("plan_id");

-- CreateIndex
CREATE INDEX "vip_orders_bind_from_user_id_idx" ON "vip_orders"("bind_from_user_id");

-- CreateIndex
CREATE INDEX "app_configs_created_at_idx" ON "app_configs"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "app_configs_environment_key" ON "app_configs"("environment");

-- CreateIndex
CREATE INDEX "announcements_created_at_idx" ON "announcements"("created_at");

-- CreateIndex
CREATE INDEX "feedbacks_user_id_created_at_idx" ON "feedbacks"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "app_versions_released_at_idx" ON "app_versions"("released_at");

-- AddForeignKey
ALTER TABLE "verification_codes" ADD CONSTRAINT "verification_codes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "friend_relations" ADD CONSTRAINT "friend_relations_requester_id_fkey" FOREIGN KEY ("requester_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "friend_relations" ADD CONSTRAINT "friend_relations_receiver_id_fkey" FOREIGN KEY ("receiver_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "device_snapshots" ADD CONSTRAINT "device_snapshots_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "memoirs" ADD CONSTRAINT "memoirs_friend_relation_id_fkey" FOREIGN KEY ("friend_relation_id") REFERENCES "friend_relations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "memoirs" ADD CONSTRAINT "memoirs_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "moments" ADD CONSTRAINT "moments_friend_relation_id_fkey" FOREIGN KEY ("friend_relation_id") REFERENCES "friend_relations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "moments" ADD CONSTRAINT "moments_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vip_orders" ADD CONSTRAINT "vip_orders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vip_orders" ADD CONSTRAINT "vip_orders_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "vip_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vip_orders" ADD CONSTRAINT "vip_orders_bind_from_user_id_fkey" FOREIGN KEY ("bind_from_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feedbacks" ADD CONSTRAINT "feedbacks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

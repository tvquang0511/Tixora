-- CreateTable
CREATE TABLE "public"."users" (
    "id" UUID NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "full_name" VARCHAR(255) NOT NULL,
    "status" VARCHAR(50) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."roles" (
    "id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" VARCHAR(255),

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."permissions" (
    "id" UUID NOT NULL,
    "code" VARCHAR(100) NOT NULL,
    "description" VARCHAR(255),

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."user_roles" (
    "user_id" UUID NOT NULL,
    "role_id" UUID NOT NULL,

    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("user_id","role_id")
);

-- CreateTable
CREATE TABLE "public"."role_permissions" (
    "role_id" UUID NOT NULL,
    "permission_id" UUID NOT NULL,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("role_id","permission_id")
);

-- CreateTable
CREATE TABLE "public"."concerts" (
    "id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "location" VARCHAR(255) NOT NULL,
    "ai_bio" TEXT,
    "start_time" TIMESTAMP(3) NOT NULL,
    "svg_map_url" VARCHAR(500),
    "status" VARCHAR(50) NOT NULL,

    CONSTRAINT "concerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ticket_categories" (
    "id" UUID NOT NULL,
    "concert_id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "total_quantity" INTEGER NOT NULL,
    "max_per_user" INTEGER NOT NULL,

    CONSTRAINT "ticket_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."orders" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "concert_id" UUID NOT NULL,
    "total_amount" DECIMAL(10,2) NOT NULL,
    "status" VARCHAR(50) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."tickets" (
    "id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "category_id" UUID NOT NULL,
    "qr_code_hash" VARCHAR(255) NOT NULL,
    "is_scanned" BOOLEAN NOT NULL DEFAULT false,
    "scanned_at" TIMESTAMP(3),
    "scanned_by" UUID,

    CONSTRAINT "tickets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."payment_transactions" (
    "id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "payment_method" VARCHAR(50) NOT NULL,
    "transaction_id_3rd_party" VARCHAR(255),
    "amount" DECIMAL(10,2) NOT NULL,
    "status" VARCHAR(50) NOT NULL,
    "idempotency_key" VARCHAR(255) NOT NULL,
    "raw_response" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."guest_lists" (
    "id" UUID NOT NULL,
    "concert_id" UUID NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "full_name" VARCHAR(255) NOT NULL,
    "ticket_category" VARCHAR(100) NOT NULL,
    "is_scanned" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "guest_lists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."background_jobs" (
    "id" UUID NOT NULL,
    "trigger_by_user_id" UUID NOT NULL,
    "job_type" VARCHAR(100) NOT NULL,
    "target_id" UUID NOT NULL,
    "status" VARCHAR(50) NOT NULL,
    "progress_percentage" INTEGER NOT NULL,
    "payload" JSONB,
    "result_data" JSONB,
    "error_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "background_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."notification_templates" (
    "id" UUID NOT NULL,
    "code" VARCHAR(100) NOT NULL,
    "channel" VARCHAR(50) NOT NULL,
    "subject" VARCHAR(255) NOT NULL,
    "content" TEXT NOT NULL,

    CONSTRAINT "notification_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."notification_logs" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "template_id" UUID NOT NULL,
    "target" VARCHAR(255) NOT NULL,
    "status" VARCHAR(50) NOT NULL,
    "error_message" TEXT,
    "retry_count" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sent_at" TIMESTAMP(3),

    CONSTRAINT "notification_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "roles_name_key" ON "public"."roles"("name");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_code_key" ON "public"."permissions"("code");

-- CreateIndex
CREATE UNIQUE INDEX "tickets_qr_code_hash_key" ON "public"."tickets"("qr_code_hash");

-- CreateIndex
CREATE UNIQUE INDEX "payment_transactions_idempotency_key_key" ON "public"."payment_transactions"("idempotency_key");

-- CreateIndex
CREATE UNIQUE INDEX "guest_lists_concert_id_email_key" ON "public"."guest_lists"("concert_id", "email");

-- AddForeignKey
ALTER TABLE "public"."user_roles" ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_roles" ADD CONSTRAINT "user_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."role_permissions" ADD CONSTRAINT "role_permissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."role_permissions" ADD CONSTRAINT "role_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "public"."permissions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ticket_categories" ADD CONSTRAINT "ticket_categories_concert_id_fkey" FOREIGN KEY ("concert_id") REFERENCES "public"."concerts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."orders" ADD CONSTRAINT "orders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."orders" ADD CONSTRAINT "orders_concert_id_fkey" FOREIGN KEY ("concert_id") REFERENCES "public"."concerts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."tickets" ADD CONSTRAINT "tickets_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."tickets" ADD CONSTRAINT "tickets_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."ticket_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."tickets" ADD CONSTRAINT "tickets_scanned_by_fkey" FOREIGN KEY ("scanned_by") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payment_transactions" ADD CONSTRAINT "payment_transactions_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."guest_lists" ADD CONSTRAINT "guest_lists_concert_id_fkey" FOREIGN KEY ("concert_id") REFERENCES "public"."concerts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."background_jobs" ADD CONSTRAINT "background_jobs_trigger_by_user_id_fkey" FOREIGN KEY ("trigger_by_user_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."background_jobs" ADD CONSTRAINT "background_jobs_target_id_fkey" FOREIGN KEY ("target_id") REFERENCES "public"."concerts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."notification_logs" ADD CONSTRAINT "notification_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."notification_logs" ADD CONSTRAINT "notification_logs_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "public"."notification_templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

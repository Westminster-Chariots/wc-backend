-- Migration: Add documents table for document management system
-- Date: 2024
-- Description: Creates documents table to store driver manifests, client invoices, and trip confirmations

-- Create document_type enum
CREATE TYPE "public"."document_type" AS ENUM('driver_manifest', 'client_invoice', 'trip_confirmation');

-- Create documents table
CREATE TABLE "documents" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "document_type" "document_type" NOT NULL,
  "document_number" text NOT NULL,
  "client_email" text NOT NULL,
  "client_name" text NOT NULL,
  "booking_id" uuid,
  "user_id" uuid,
  "document_data" jsonb NOT NULL,
  "created_by" uuid,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "documents_document_number_unique" UNIQUE("document_number")
);

-- Add foreign key constraints
ALTER TABLE "documents" ADD CONSTRAINT "documents_booking_id_bookings_id_fk" 
  FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE set null ON UPDATE no action;

ALTER TABLE "documents" ADD CONSTRAINT "documents_user_id_users_id_fk" 
  FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;

ALTER TABLE "documents" ADD CONSTRAINT "documents_created_by_users_id_fk" 
  FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;

-- Create indexes for better query performance
CREATE INDEX "idx_documents_client_email" ON "documents"("client_email");
CREATE INDEX "idx_documents_document_type" ON "documents"("document_type");
CREATE INDEX "idx_documents_created_at" ON "documents"("created_at");
CREATE INDEX "idx_documents_booking_id" ON "documents"("booking_id");

-- Add comment to table
COMMENT ON TABLE "documents" IS 'Stores driver manifests, client invoices, and trip confirmations';

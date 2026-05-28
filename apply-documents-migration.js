const { neon } = require('@neondatabase/serverless');
require('dotenv').config();

const sql = neon(process.env.DATABASE_URL);

async function applyMigration() {
  try {
    console.log('Checking if documents table exists...');
    
    // Check if table exists
    const tableCheck = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'documents'
      );
    `;
    
    if (tableCheck[0].exists) {
      console.log('✓ Documents table already exists');
      return;
    }

    console.log('Creating documents table...');
    
    // Create enum type
    await sql`
      DO $$ BEGIN
        CREATE TYPE document_type AS ENUM('driver_manifest', 'client_invoice', 'trip_confirmation');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `;
    
    // Create table
    await sql`
      CREATE TABLE IF NOT EXISTS documents (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        document_type document_type NOT NULL,
        document_number text NOT NULL UNIQUE,
        client_email text NOT NULL,
        client_name text NOT NULL,
        booking_id uuid,
        user_id uuid,
        document_data jsonb NOT NULL,
        created_by uuid,
        created_at timestamp DEFAULT now() NOT NULL,
        updated_at timestamp DEFAULT now() NOT NULL
      );
    `;
    
    // Add foreign keys
    await sql`
      ALTER TABLE documents 
      ADD CONSTRAINT documents_booking_id_bookings_id_fk 
      FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE SET NULL;
    `;
    
    await sql`
      ALTER TABLE documents 
      ADD CONSTRAINT documents_user_id_users_id_fk 
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;
    `;
    
    await sql`
      ALTER TABLE documents 
      ADD CONSTRAINT documents_created_by_users_id_fk 
      FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;
    `;
    
    // Create indexes
    await sql`CREATE INDEX IF NOT EXISTS idx_documents_client_email ON documents(client_email);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_documents_document_type ON documents(document_type);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_documents_created_at ON documents(created_at);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_documents_booking_id ON documents(booking_id);`;
    
    console.log('✓ Documents table created successfully');
    
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

applyMigration();

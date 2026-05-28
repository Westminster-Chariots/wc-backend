-- Document Management System - Migration Verification Script
-- Run this script to verify the documents table was created successfully

-- 1. Check if document_type enum exists
SELECT 
    'document_type enum' as check_name,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_type WHERE typname = 'document_type'
        ) THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END as status;

-- 2. Check if documents table exists
SELECT 
    'documents table' as check_name,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name = 'documents'
        ) THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END as status;

-- 3. Check table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'documents'
ORDER BY ordinal_position;

-- 4. Check foreign key constraints
SELECT
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name = 'documents';

-- 5. Check indexes
SELECT
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'documents'
ORDER BY indexname;

-- 6. Check unique constraints
SELECT
    tc.constraint_name,
    kcu.column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.constraint_type = 'UNIQUE' 
    AND tc.table_name = 'documents';

-- 7. Test insert (optional - comment out if you don't want to insert test data)
/*
INSERT INTO documents (
    document_type,
    document_number,
    client_email,
    client_name,
    document_data
) VALUES (
    'client_invoice',
    'TEST-001-2024',
    'test@example.com',
    'Test Client',
    '{"test": true}'::jsonb
);

-- Verify insert
SELECT * FROM documents WHERE document_number = 'TEST-001-2024';

-- Clean up test data
DELETE FROM documents WHERE document_number = 'TEST-001-2024';
*/

-- 8. Count existing documents
SELECT 
    'Total documents' as metric,
    COUNT(*) as count
FROM documents;

-- 9. Count by document type
SELECT 
    document_type,
    COUNT(*) as count
FROM documents
GROUP BY document_type
ORDER BY document_type;

-- 10. Check recent documents
SELECT 
    id,
    document_type,
    document_number,
    client_email,
    client_name,
    created_at
FROM documents
ORDER BY created_at DESC
LIMIT 10;

-- Expected Results:
-- ✅ document_type enum should exist
-- ✅ documents table should exist with 11 columns
-- ✅ 3 foreign key constraints (booking_id, user_id, created_by)
-- ✅ 1 unique constraint (document_number)
-- ✅ 4+ indexes (including primary key and custom indexes)

-- Migration: Add scheduling fields to payams table
-- Date: 2026-02-09
-- Description: Adds status, publishAt, and publishedAt fields for payam scheduling functionality

-- Add new columns
ALTER TABLE payams
ADD COLUMN status VARCHAR(20) DEFAULT 'published' NOT NULL,
ADD COLUMN publish_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN published_at TIMESTAMP WITH TIME ZONE;

-- Create indexes for performance
CREATE INDEX idx_payams_status ON payams(status);
CREATE INDEX idx_payams_publish_at ON payams(publish_at);

-- Set existing payams to 'published' status with publishedAt = createdAt
UPDATE payams
SET status = 'published',
    published_at = created_at
WHERE status = 'published';

-- Add comment to columns
COMMENT ON COLUMN payams.status IS 'Payam status: draft, scheduled, published, or archived';
COMMENT ON COLUMN payams.publish_at IS 'Scheduled publish date/time (null for immediate publish)';
COMMENT ON COLUMN payams.published_at IS 'Actual publish timestamp (null until published)';

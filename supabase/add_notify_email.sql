ALTER TABLE resources ADD COLUMN IF NOT EXISTS notify_email TEXT;

UPDATE resources
SET notify_email = 'info@veterancare.com'
WHERE source_name = 'Veteran Care'
  AND notify_email IS NULL;

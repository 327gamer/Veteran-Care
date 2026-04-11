ALTER TABLE navigator_requests
ADD COLUMN IF NOT EXISTS billing_workflow_status TEXT DEFAULT 'ready',
ADD COLUMN IF NOT EXISTS billing_hold_reason TEXT;

CREATE INDEX IF NOT EXISTS idx_nr_billing_workflow_status ON navigator_requests(billing_workflow_status);

UPDATE navigator_requests
SET billing_workflow_status = 'charged'
WHERE billed = true AND billing_workflow_status IS DISTINCT FROM 'charged';

UPDATE navigator_requests
SET billing_workflow_status = 'ready'
WHERE is_billable = true AND billed = false AND billing_workflow_status IS NULL;

UPDATE navigator_requests
SET billing_workflow_status = NULL
WHERE is_billable = false OR is_billable IS NULL;

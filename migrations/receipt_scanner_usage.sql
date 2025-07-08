-- Create receipt_scanner_usage table to track monthly usage
CREATE TABLE IF NOT EXISTS receipt_scanner_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  month VARCHAR(7) NOT NULL, -- Format: YYYY-MM
  count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, month)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_receipt_scanner_usage_user_id ON receipt_scanner_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_receipt_scanner_usage_month ON receipt_scanner_usage(month);

-- Add RLS policies
ALTER TABLE receipt_scanner_usage ENABLE ROW LEVEL SECURITY;

-- Users can only read their own usage data
CREATE POLICY receipt_scanner_usage_select_policy ON receipt_scanner_usage 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Users can only update their own usage data
CREATE POLICY receipt_scanner_usage_update_policy ON receipt_scanner_usage 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Users can only insert their own usage data
CREATE POLICY receipt_scanner_usage_insert_policy ON receipt_scanner_usage 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Create function to reset usage counts on the 1st of each month
CREATE OR REPLACE FUNCTION reset_monthly_usage()
RETURNS TRIGGER AS $$
DECLARE
  current_month VARCHAR(7);
BEGIN
  -- Get the current month in YYYY-MM format
  current_month := to_char(NOW(), 'YYYY-MM');
  
  -- If the record's month is not the current month, reset the count
  IF NEW.month <> current_month THEN
    NEW.count := 0;
    NEW.month := current_month;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to reset usage on the 1st of each month
CREATE TRIGGER reset_monthly_usage_trigger
BEFORE UPDATE ON receipt_scanner_usage
FOR EACH ROW
EXECUTE FUNCTION reset_monthly_usage(); 
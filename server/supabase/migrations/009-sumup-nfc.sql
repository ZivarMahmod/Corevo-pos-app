-- SumUp NFC terminal columns for tenants
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS terminal_enabled boolean DEFAULT false;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS terminal_provider text DEFAULT '';
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS terminal_api_key text DEFAULT '';
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS terminal_merchant_id text DEFAULT '';
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS sumup_test_mode boolean DEFAULT true;

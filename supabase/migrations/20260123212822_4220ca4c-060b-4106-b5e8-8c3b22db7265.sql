-- Enable pgcrypto extension for gen_random_bytes function
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Verify the extension is working by testing the function
DO $$
BEGIN
  PERFORM gen_random_bytes(16);
END $$;
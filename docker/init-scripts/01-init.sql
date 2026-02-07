-- Initial database setup script
-- This script runs when the PostgreSQL container starts for the first time

-- Create extensions if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- You can add any additional database setup here
-- For example, creating additional users, setting permissions, etc.

-- The main tables will be created by Drizzle migrations

-- AgroMarket Bolivia — PostgreSQL initialization
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "unaccent";
DO $$ BEGIN RAISE NOTICE 'AgroMarket Bolivia DB initialized'; END $$;

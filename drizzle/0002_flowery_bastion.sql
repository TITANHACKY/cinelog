-- Originally rewrote credits / creators / production_companies into join tables.
-- Those tables are gone after the catalog split and 0004. Keep this file as a
-- no-op so `drizzle-kit migrate` can record 0002 on databases that already
-- dropped them, without recreating unused tables.
SELECT 1;

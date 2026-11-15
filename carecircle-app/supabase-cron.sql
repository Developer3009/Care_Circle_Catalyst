-- Supabase pg_cron Setup for Automated 5-Minute Escalation Engine
-- Run this in your Supabase SQL Editor (Database -> Extensions -> Enable pg_cron)

-- 1. Enable pg_cron and pg_net extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 2. Define the SQL cron task to trigger CareCircle's Escalation Engine every 5 minutes
-- Replace YOUR_PROJECT_DOMAIN with your deployed Vercel domain or API gateway
SELECT cron.schedule(
  'carecircle-escalation-5min',
  '*/5 * * * *',
  $$
  SELECT
    net.http_get(
      url:='https://carecircle.app/api/cron/escalation',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_CRON_SECRET"}'::jsonb
    ) as request_id;
  $$
);

-- 3. Helpful queries to check cron run status
-- SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;

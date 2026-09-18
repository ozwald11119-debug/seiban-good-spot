# Database security

All exposed application tables use RLS. The frontend uses a publishable key only. Authorization for content mutations requires both an authenticated session and membership in `public.admins`.
# Admin model

The database is prepared for Supabase Auth administrators through `public.admins`. No user is granted admin rights automatically. Add an authenticated user's UUID to `admins` only after verifying the account owner.
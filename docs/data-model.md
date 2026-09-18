# Data model

`spots` stores public guide entries. `recommendations` is a write-only public suggestion inbox. `admins` contains authorized Supabase Auth user IDs for protected content management. `spot-images` is the public image bucket with admin-only mutation policies.
# Architecture

GitHub Pages serves the static frontend. The browser reads published guide entries from Supabase REST with a publishable key. Supabase RLS permits public SELECT only when `published=true`. Favorites stay on-device in localStorage.
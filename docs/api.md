# Public API use

The frontend performs a read-only REST request for `spots` filtered to `published=true`, ordered by `sort_order` and creation time. RLS independently enforces the same publication boundary.
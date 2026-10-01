# Supabase account and knowledge setup

This project uses Supabase Auth for email/password accounts and Postgres for reviewed travel facts. The planner remains available when Supabase is unconfigured; account forms are disabled and itinerary generation uses live research.

1. Create a Supabase project. In **Project Settings → API Keys**, copy the project URL and **publishable** key into `.env.local` as `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Restart `npm run dev`. Never put a secret or service-role key in a `NEXT_PUBLIC_` variable.
2. Apply [`supabase/migrations/20260925000000_knowledge.sql`](supabase/migrations/20260925000000_knowledge.sql) in the Supabase SQL Editor, or use `supabase db push` if this repository is linked to your project. The migration enables RLS and grants the public only access to currently approved facts.
   Apply [`supabase/migrations/20260928000000_itinerary_history.sql`](supabase/migrations/20260928000000_itinerary_history.sql) as well. It creates private itinerary history for signed-in users. Completed trips appear under `/account`; guests can still plan without an account.
3. Under **Authentication → URL Configuration**, set **Site URL** to the production site (`https://hellosrilanka.netlify.app` for the current Netlify project), not localhost. Add these exact redirect URLs for the current callback flow: `https://hellosrilanka.netlify.app/auth/callback`, `https://hellosrilanka.netlify.app/auth/callback?source=google`, `https://hellosrilanka.netlify.app/auth/callback?source=email`, plus the same three paths at `http://localhost:3000` for local development. Supabase falls back to Site URL if a requested redirect does not match the allow list. Keep email confirmation enabled.
4. Under **Authentication → Email Templates → Confirm signup**, use a link to your app's confirmation endpoint so its server can store the session cookie. Because this app's `emailRedirectTo` includes `?source=email`, append the token with `&`: `<a href="{{ .RedirectTo }}&token_hash={{ .TokenHash }}&type=email">Confirm your email</a>`. The app also accepts a PKCE `code` callback. Confirm the template's URL points to your own configured site.
5. Sign up at `/signup` and confirm the email. Regular sign-ups have no admin privileges. In the SQL Editor, grant your account admin access by replacing the address below:

   ```sql
   insert into public.admin_users (user_id)
   select id from auth.users where lower(email) = lower('your-email@example.com')
   on conflict (user_id) do nothing;
   ```

6. Sign in at `/login`, open `/account`, then `/admin`. Add one sourced claim per record as a draft, open the source and check it, then approve it. Editing an approved fact returns it to draft. Previous versions are retained in `knowledge_revisions` for audit. Approved facts expire after 30 days for stays, 60 for connections, 90 for activities and seasonal facts, or 180 for destination facts. Review an expired record again to renew it. Archiving removes it from itinerary retrieval.

## Google sign-in and One Tap

The login and signup pages offer Google OAuth sign-in whenever Supabase is configured. Google One Tap is optional and appears for visitors without a Supabase session when `NEXT_PUBLIC_GOOGLE_CLIENT_ID` is set. In **Supabase → Authentication → Providers → Google**, enable Google and enter the web OAuth client ID and client secret from **Google Cloud → Google Auth Platform → Clients**. To enable One Tap, set `NEXT_PUBLIC_GOOGLE_CLIENT_ID` to that same web client ID in `.env.local` and in the deployed environment. The client ID is public; keep the client secret only in Supabase.

In Google Cloud, add `http://localhost:3000` and your production origin to **Authorized JavaScript origins**. For this hosted Supabase project, add **exactly** `https://rbpfdgvnktaukkrnupux.supabase.co/auth/v1/callback` to **Authorized redirect URIs** on the web OAuth client whose ID is in `.env.local`. This is the URL Google redirects to; `http://localhost:3000/auth/callback` belongs in Supabase **Authentication → URL Configuration**, not in Google's redirect URI field. Allow each site's `/auth/callback` URL in Supabase as described above. If Google's consent screen is in testing mode, add the accounts you will use under **Audience → Test users**. A dismissed One Tap prompt can be reopened later by Google; the visible **Continue with Google** button always starts the regular Supabase OAuth flow.

The itinerary endpoint retrieves approved, unexpired facts for the traveller's dates and interests. When a single-base route has enough supported activities, a stay, seasonal context, and both airport connections, composition uses those facts without a new web search. Otherwise live research fills gaps. Empty knowledge collections continue to use the existing live research flow. Provider prices and availability still need date-specific confirmation. New completed itineraries are saved to the signed-in account; trips generated before this migration cannot be recovered from the temporary browser session.

The admin page and its server actions check the authenticated user against `admin_users`; database RLS independently enforces the same access. No account or admin access can be obtained solely by setting client-side user metadata.

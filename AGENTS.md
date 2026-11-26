<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# HelloSriLanka development guide

## Maintainability

- Start with the affected entry point and its tests. Use `README.md` for setup and `.env.example` for configuration names. Keep diffs focused and preserve unrelated work.
- Reuse existing types, components, and validation. Keep provider calls and authorization in server code and keep UI logic separate. Add abstractions and dependencies when they solve a concrete problem.
- Preserve existing callers and saved itineraries when changing request or data shapes. Use versioned migrations for database changes. Account for retries, partial failures, and concurrent requests when changing writes or background jobs.

## Secure coding

- Keep OpenAI keys, Supabase secret or service-role keys, and hotel provider credentials in server-side environment variables. Keep secrets, session tokens, and private traveller details out of source control, client bundles, logs, and test fixtures.
- Derive identity from the verified session. Check ownership on the server for private itinerary reads, writes, revisions, and job results. Preserve Supabase row-level security in `supabase/migrations/`. For authorization changes, verify that a signed-out visitor and a second account cannot access a private trip.
- Validate request bodies and external responses at the server boundary. Treat model output, researched pages, and provider data as untrusted. Use trusted provider endpoints and validate external URLs before fetching or displaying them.

## Credit and API usage

- Keep task context focused on the files needed to make and verify the change. Use `ITINERARY_MODE=sample`, existing fixtures, or mocked providers for routine checks. Run paid evaluations only when requested. Start with one relevant case from `tests/fixtures/planner-eval.json`.
- Preserve request deduplication across `app/api/itinerary/route.ts` and `netlify/functions/generate-itinerary.mts`. Use shared rate and spend limits for new paid endpoints, with timeouts and bounded retries. Reuse approved research where it fits and keep one-day revisions scoped to the selected day.
- Fetch live hotel rates when travellers choose **Check hotel prices**. Keep missing prices unconfirmed and make changes to paid workflows measurable by tracking calls and estimated cost per successful itinerary.

## Verify before handing off

- Run `git diff --check` and the checks relevant to the change. Use `npm test` for regressions, `npm run typecheck` for TypeScript changes, and `npm run lint` for lint-sensitive changes. Run `npm run build` when changing build configuration, routes, or shared app wiring.
- Check affected user flows through their normal entry points. Report checks run and any outstanding verification.

## References

- [OpenAI project instructions](https://learn.chatgpt.com/docs/agent-configuration/agents-md) and [OpenAI spend limits](https://developers.openai.com/api/docs/guides/spend-limits)
- [Supabase row-level security](https://supabase.com/docs/guides/database/postgres/row-level-security) and [OWASP API resource consumption](https://api-security.owasp.org/editions/2023/en/0xa4-unrestricted-resource-consumption/)

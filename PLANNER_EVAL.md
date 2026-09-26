# Itinerary quality and cost evaluation

The nine fixed test cases in `tests/fixtures/planner-eval.json` cover short and 21-day trips, children, step-free access, different airports, and a destination with potentially sparse reviewed knowledge. Both runs must use the same cases. The runner calls the production `generateLiveItinerary` workflow and writes one local JSON report per run. Reports are ignored by Git because they contain generated travel plans.

Live runs use paid OpenAI requests and are **never** started without `--live`. From the project root, with the development API key loaded:

```sh
npm run eval:planner -- run --live --variant baseline --label baseline --out eval-results/baseline.json
npm run eval:planner -- run --live --variant optimized --label current --out eval-results/current.json --knowledge-from eval-results/baseline.json
npm run eval:planner -- compare --baseline eval-results/baseline.json --current eval-results/current.json
```

For a small smoke test, append `--case short-nature` to both run commands. Never put keys in fixture or report files. The output path must not already exist, so a run cannot silently overwrite a prior report. `baseline` reproduces the former 32-bullet cap and full-draft repair; `optimized` uses the activity/leg budget and focused day repair. `--knowledge-from` reuses the baseline's reviewed-knowledge snapshot, but live web results can still change between runs. Record the code revision and run date alongside each report when comparing deployments.

The report records successful validation, repair calls, web searches, input/output tokens, duration, estimated USD cost, cost per successful itinerary, and citation coverage. A citation ID existing in the source list is **not** proof that its factual claim is supported. For factual citation accuracy, open each URL in `reviewItems`, check the **entire** activity, transport, stay, or price claim, and mark `supported` as `true` or `false`; leave it `null` if unreviewed. Run `compare` again after review. Accuracy remains `null` until at least one claim has been checked. Review a comparable sample of claims in each run, including long-trip activities and transfers. This metric does not cover uncited summary or highlights prose. Human review should also note unusable routes, poor personalization, or stale sources even when automatic validation passes.

OpenAI's current [evaluation guidance](https://developers.openai.com/api/docs/guides/evaluation-best-practices) recommends representative, task-specific cases and human calibration. Compare success and cost **together**: cheaper calls that produce more failed itineraries are not an improvement.

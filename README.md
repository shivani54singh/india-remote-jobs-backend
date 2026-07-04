# India Remote Jobs — Backend

Aggregates postings from Greenhouse, Lever, RemoteOK, and We Work Remotely,
tags each one for India eligibility (visa/work-auth status, IST timezone
overlap, domain), and serves the result as JSON at `/api/jobs`.

## Setup

```bash
npm install
npm start
```

Runs on `http://localhost:4000`. On boot it fetches all sources once, then
refreshes every 6 hours.

## Before it's useful

1. **Add company tokens.** `src/sources/greenhouse.js` and
   `src/sources/lever.js` need a list of company board tokens — these are
   empty by default. Find a token from a company's careers URL:
   `boards.greenhouse.io/{token}` or `jobs.lever.co/{token}`.
   RemoteOK and We Work Remotely need no configuration; they're already
   multi-company feeds.
2. **Tune `src/tagging.js`.** The visa-detection and timezone-extraction
   logic is keyword-based — a reasonable starting point, not a finished
   classifier. Expect to spend real time here; misclassifying a US-only
   role as India-eligible is the failure mode that costs user trust.
3. **Swap the in-memory cache for a database** once you want history,
   dedup across refreshes, or multiple app instances — right now a
   restart wipes the cache.

## API

```
GET /api/jobs?domain=Engineering&visaFree=true&minOverlap=4&q=react
GET /api/health
```

## Endpoint

- Frontend calls `/api/jobs` instead of the mock `JOBS` array in the
  React prototype — swap that array for a `fetch("/api/jobs")` call.

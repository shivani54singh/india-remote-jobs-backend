import express from "express";
import cors from "cors";
import cron from "node-cron";
import { aggregateAndTagJobs } from "./aggregate.js";
import { overlapHours } from "./tagging.js";

const app = express();
app.use(cors());

let cache = { jobs: [], lastUpdated: null };

async function refresh() {
  try {
    const jobs = await aggregateAndTagJobs();
    cache = { jobs, lastUpdated: new Date().toISOString() };
  } catch (err) {
    console.error("Refresh failed:", err);
  }
}

// GET /api/jobs?domain=Engineering&visaFree=true&minOverlap=4&q=react
app.get("/api/jobs", (req, res) => {
  const { domain, visaFree, minOverlap, q } = req.query;
  let jobs = cache.jobs;

  if (domain) jobs = jobs.filter((j) => j.domain === domain);
  if (visaFree === "true") jobs = jobs.filter((j) => j.visaFree);
  if (minOverlap) {
    const min = Number(minOverlap);
    jobs = jobs.filter((j) => overlapHours(j.utcOffset) >= min);
  }
  if (q) {
    const needle = q.toLowerCase();
    jobs = jobs.filter((j) => `${j.title} ${j.company} ${j.tags.join(" ")}`.toLowerCase().includes(needle));
  }

  res.json({ count: jobs.length, lastUpdated: cache.lastUpdated, jobs });
});

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, lastUpdated: cache.lastUpdated, jobCount: cache.jobs.length });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, async () => {
  console.log(`API listening on :${PORT}`);
  await refresh();
  cron.schedule("0 */6 * * *", refresh);
});


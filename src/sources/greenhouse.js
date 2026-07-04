// Greenhouse public job-board API — no auth needed.
// Find a company's token from their careers page URL:
// boards.greenhouse.io/{token} -> token goes in COMPANY_TOKENS below.
import fetch from "node-fetch";

export const COMPANY_TOKENS = [
  // "acme",
  // "examplecorp",
];

export async function fetchGreenhouseJobs() {
  const results = [];
  for (const token of COMPANY_TOKENS) {
    try {
      const res = await fetch(`https://boards-api.greenhouse.io/v1/boards/${token}/jobs?content=true`);
      if (!res.ok) continue;
      const data = await res.json();
      for (const job of data.jobs || []) {
        results.push({
          id: `gh-${token}-${job.id}`,
          title: job.title,
          company: token,
          location: job.location?.name || "",
          description: (job.content || "").replace(/<[^>]+>/g, " "),
          url: job.absolute_url,
          source: "greenhouse",
        });
      }
    } catch (err) {
      console.error(`Greenhouse fetch failed for ${token}:`, err.message);
    }
  }
  return results;
}

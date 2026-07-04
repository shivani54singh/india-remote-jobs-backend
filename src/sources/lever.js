// Lever public postings API — no auth needed.
// Find a company's token from their careers page URL:
// jobs.lever.co/{token} -> token goes in COMPANY_TOKENS below.
import fetch from "node-fetch";

export const COMPANY_TOKENS = [
  // "acme",
  // "examplecorp",
];

export async function fetchLeverJobs() {
  const results = [];
  for (const token of COMPANY_TOKENS) {
    try {
      const res = await fetch(`https://api.lever.co/v0/postings/${token}?mode=json`);
      if (!res.ok) continue;
      const data = await res.json();
      for (const job of data || []) {
        results.push({
          id: `lever-${token}-${job.id}`,
          title: job.text,
          company: token,
          location: job.categories?.location || "",
          description: (job.descriptionPlain || job.description || "").toString(),
          url: job.hostedUrl,
          source: "lever",
        });
      }
    } catch (err) {
      console.error(`Lever fetch failed for ${token}:`, err.message);
    }
  }
  return results;
}

// RemoteOK public API — a single JSON endpoint covering many companies.
// No auth needed. Be a good citizen: cache results, don't poll more than
// hourly, and set a real User-Agent so requests aren't mistaken for abuse.
import fetch from "node-fetch";

export async function fetchRemoteOkJobs() {
  try {
    const res = await fetch("https://remoteok.com/api", {
      headers: { "User-Agent": "IndiaRemoteJobsBot/1.0 (contact: you@example.com)" },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.slice(1).map((job) => ({
      id: `remoteok-${job.id}`,
      title: job.position,
      company: job.company,
      location: job.location || "Fully distributed",
      description: (job.description || "").replace(/<[^>]+>/g, " "),
      salaryUSD: job.salary_min && job.salary_max ? [job.salary_min, job.salary_max] : null,
      tags: job.tags || [],
      url: job.url,
      source: "remoteok",
    }));
  } catch (err) {
    console.error("RemoteOK fetch failed:", err.message);
    return [];
  }
}

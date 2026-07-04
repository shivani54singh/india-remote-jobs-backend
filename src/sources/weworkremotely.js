// We Work Remotely publishes RSS feeds per category — no auth needed.
import Parser from "rss-parser";

const parser = new Parser();

const FEEDS = [
  { url: "https://weworkremotely.com/categories/remote-programming-jobs.rss", domainHint: "Engineering" },
  { url: "https://weworkremotely.com/categories/remote-design-jobs.rss", domainHint: "Design" },
  { url: "https://weworkremotely.com/categories/remote-marketing-jobs.rss", domainHint: "Marketing" },
  { url: "https://weworkremotely.com/categories/remote-customer-support-jobs.rss", domainHint: "Support" },
  { url: "https://weworkremotely.com/categories/remote-management-and-finance-jobs.rss", domainHint: "Finance" },
];

export async function fetchWeWorkRemotelyJobs() {
  const results = [];
  for (const feed of FEEDS) {
    try {
      const parsed = await parser.parseURL(feed.url);
      for (const item of parsed.items || []) {
        const [company, ...rest] = (item.title || "").split(":");
        results.push({
          id: `wwr-${item.guid || item.link}`,
          title: rest.join(":").trim() || item.title,
          company: company?.trim() || "Unknown",
          location: "Fully distributed",
          description: item.contentSnippet || item.content || "",
          url: item.link,
          source: "weworkremotely",
          domainHint: feed.domainHint,
        });
      }
    } catch (err) {
      console.error(`WWR feed failed (${feed.url}):`, err.message);
    }
  }
  return results;
}

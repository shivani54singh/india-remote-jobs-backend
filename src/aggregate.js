import { fetchGreenhouseJobs } from "./sources/greenhouse.js";
import { fetchLeverJobs } from "./sources/lever.js";
import { fetchRemoteOkJobs } from "./sources/remoteok.js";
import { fetchWeWorkRemotelyJobs } from "./sources/weworkremotely.js";
import { tagJob, classifyDomain } from "./tagging.js";

export async function aggregateAndTagJobs() {
  const [gh, lever, remoteok, wwr] = await Promise.all([
    fetchGreenhouseJobs(),
    fetchLeverJobs(),
    fetchRemoteOkJobs(),
    fetchWeWorkRemotelyJobs(),
  ]);

  const raw = [...gh, ...lever, ...remoteok, ...wwr];

  const tagged = raw
    .map((job) => {
      const result = tagJob(job);
      if (!result && job.domainHint && classifyDomain(job.title, job.description) === null) {
        return tagJob({ ...job, title: `${job.domainHint} ${job.title}` });
      }
      return result;
    })
    .filter(Boolean);

  console.log(
    `Aggregated ${raw.length} raw postings -> ${tagged.length} tagged as India-eligible ` +
      `(${gh.length} Greenhouse, ${lever.length} Lever, ${remoteok.length} RemoteOK, ${wwr.length} WWR)`
  );

  return tagged;
}

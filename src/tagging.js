// tagging.js
// Turns a raw job posting (title, description, location string) into the
// eligibility fields the frontend cards render: domain, visaFree, utcOffset,
// reasons[]. This is the part worth iterating on carefully — bad tags here
// break user trust faster than missing jobs do.

const IST_OFFSET = 5.5;

// ---- 1. Domain classification (keyword scoring, cheap + transparent) ----
const DOMAIN_KEYWORDS = {
  Engineering: ["engineer", "developer", "backend", "frontend", "full stack", "devops", "sre", "infrastructure", "software"],
  Design: ["designer", "ux", "ui", "product design", "figma"],
  Marketing: ["marketing", "growth", "seo", "performance media", "demand gen", "paid media"],
  Finance: ["financial analyst", "accountant", "fp&a", "controller", "bookkeeper"],
  Legal: ["paralegal", "counsel", "compliance", "contracts", "legal"],
  Support: ["customer success", "customer support", "support specialist", "onboarding"],
  Content: ["content", "copywriter", "technical writer", "editor", "editorial"],
  Data: ["data scientist", "data analyst", "analytics engineer", "machine learning", "data engineer"],
};

export function classifyDomain(title, description = "") {
  const text = `${title} ${description}`.toLowerCase();
  let best = null;
  let bestScore = 0;
  for (const [domain, keywords] of Object.entries(DOMAIN_KEYWORDS)) {
    const score = keywords.reduce((acc, kw) => acc + (text.includes(kw) ? 1 : 0), 0);
    if (score > bestScore) {
      best = domain;
      bestScore = score;
    }
  }
  return best;
}

// ---- 2. Visa / work-authorization detection ----
const VISA_BLOCK_PHRASES = [
  "must be authorized to work in the united states",
  "must be a us citizen",
  "no sponsorship available",
  "requires eu work permit",
  "must be based in the uk",
  "right to work in the uk required",
  "must reside in",
];
const VISA_OPEN_PHRASES = [
  "hire from anywhere",
  "hire globally",
  "open to candidates worldwide",
  "we hire in india",
  "candidates from india",
  "global contractor",
  "deel",
  "remote.com",
  "employer of record",
];

export function detectVisaStatus(description = "") {
  const text = description.toLowerCase();
  if (VISA_BLOCK_PHRASES.some((p) => text.includes(p))) return "blocked";
  if (VISA_OPEN_PHRASES.some((p) => text.includes(p))) return "open";
  return "unknown";
}

// ---- 3. Timezone extraction ----
const REGION_OFFSETS = [
  { pattern: /\b(pst|pacific)\b/i, offset: -8 },
  { pattern: /\b(mst|mountain)\b/i, offset: -7 },
  { pattern: /\b(cst|central)\b/i, offset: -6 },
  { pattern: /\b(est|eastern)\b/i, offset: -5 },
  { pattern: /\b(gmt|uk|london)\b/i, offset: 0 },
  { pattern: /\b(cet|germany|berlin|paris)\b/i, offset: 1 },
  { pattern: /\b(ist|india)\b/i, offset: 5.5 },
  { pattern: /\b(aest|australia|sydney)\b/i, offset: 10 },
  { pattern: /\b(anywhere|remote|worldwide|distributed)\b/i, offset: null },
];

export function extractUtcOffset(locationText = "") {
  for (const { pattern, offset } of REGION_OFFSETS) {
    if (pattern.test(locationText)) return offset;
  }
  return undefined;
}

export function overlapHours(utcOffset) {
  if (utcOffset === null || utcOffset === undefined) return 24;
  const diff = Math.abs(IST_OFFSET - utcOffset);
  const shifted = diff > 12 ? 24 - diff : diff;
  return Math.max(0, 12 - shifted);
}

// ---- 4. Assemble reasons[] shown on the card ----
export function buildReasons({ visaStatus, utcOffset, description = "" }) {
  const reasons = [];
  if (visaStatus === "open") reasons.push("Explicitly open to hiring from India");
  if (visaStatus === "unknown") reasons.push("Visa requirement not stated — verify before applying");
  if (utcOffset === null || utcOffset === undefined) {
    reasons.push("No fixed working hours mentioned");
  } else {
    const hrs = overlapHours(utcOffset);
    reasons.push(`${hrs}hr overlap with IST`);
  }
  if (/async/i.test(description)) reasons.push("Team describes itself as async-first");
  return reasons;
}

// ---- 5. Full tagging pipeline for one raw posting ----
export function tagJob(raw) {
  const domain = classifyDomain(raw.title, raw.description);
  if (!domain) return null;

  const visaStatus = detectVisaStatus(raw.description);
  if (visaStatus === "blocked") return null;

  const utcOffset = extractUtcOffset(raw.location || raw.description);

  return {
    id: raw.id,
    domain,
    title: raw.title,
    company: raw.company,
    region: raw.location || "Not specified",
    utcOffset,
    visaFree: visaStatus !== "blocked",
    visaStatus,
    salaryUSD: raw.salaryUSD || null,
    tags: raw.tags || [],
    url: raw.url,
    source: raw.source,
    reasons: buildReasons({ visaStatus, utcOffset, description: raw.description }),
  };
}

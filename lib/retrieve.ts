import { ALL_PAGES } from "./nav";
import { getDoc } from "./content";

/**
 * Section-level retrieval for the docs assistant.
 *
 * The corpus is ~190k tokens, most of it in a handful of contract source
 * pages, so sending it whole on every question is neither cheap nor useful.
 * Each page is split at its `##` headings and the sections that best match
 * the question go to the model. Scoring is the same idea as the search box:
 * a term in a title or heading is worth more than a term in the body, and
 * every term has to land somewhere or the section is not a match.
 */
export interface Section {
  slug: string;
  title: string;
  heading: string;
  body: string;
}

let sections: Section[] | null = null;

function plain(source: string): string {
  return source
    .replace(/<\/?[A-Z][A-Za-z]*[^>]*>/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function build(): Section[] {
  const out: Section[] = [];
  for (const p of ALL_PAGES) {
    const doc = getDoc(p.slug);
    if (!doc) continue;
    const title = doc.frontmatter.title ?? p.title;
    const parts = doc.source.split(/^(?=## )/m);
    for (const part of parts) {
      const m = /^## (.+)\n/.exec(part);
      const heading = m ? m[1].replace(/[`*_]/g, "").trim() : "";
      const body = plain(m ? part.slice(m[0].length) : part);
      if (body.length < 40) continue;
      out.push({ slug: p.slug, title, heading, body });
    }
  }
  return out;
}

function score(s: Section, terms: string[]): number {
  const title = s.title.toLowerCase();
  const heading = s.heading.toLowerCase();
  const body = s.body.toLowerCase();
  let total = 0;
  for (const t of terms) {
    let v = 0;
    if (title.includes(t)) v += 40;
    if (heading.includes(t)) v += 25;
    const hits = body.split(t).length - 1;
    if (hits) v += Math.min(hits, 8) * 4;
    if (v === 0) return 0;
    total += v;
  }
  // Long source dumps match everything a little; prefer prose-sized sections.
  return total / Math.log2(Math.max(s.body.length, 512) / 256 + 1);
}

const STOP = new Set(
  "the a an and or of to in on for is are be it this that with how do i can what why my me does".split(" ")
);

export function retrieve(question: string, currentSlug?: string, limit = 10): Section[] {
  sections ??= build();
  const terms = question
    .toLowerCase()
    .replace(/[^a-z0-9_\-\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 1 && !STOP.has(t));
  if (terms.length === 0) return [];
  const scored = sections
    .map((s) => ({ s, v: score(s, terms) + (s.slug === currentSlug ? 8 : 0) }))
    .filter((r) => r.v > 0)
    .sort((a, b) => b.v - a.v);
  // Drop terms one at a time if nothing matches all of them.
  if (scored.length === 0 && terms.length > 1) {
    return retrieve(terms.slice(0, -1).join(" "), currentSlug, limit);
  }
  return scored.slice(0, limit).map((r) => ({
    ...r.s,
    body: r.s.body.length > 3500 ? r.s.body.slice(0, 3500) + "\n[...]" : r.s.body,
  }));
}

/** Every page as one line, so the model can point at pages it was not shown. */
export function directory(): string {
  return ALL_PAGES.map((p) => {
    const doc = getDoc(p.slug);
    const title = doc?.frontmatter.title ?? p.title;
    const desc = doc?.frontmatter.description ?? "";
    return `/${p.slug} | ${title}${desc ? " | " + desc : ""}`;
  }).join("\n");
}

import fs from "node:fs";
import path from "node:path";
import { ALL_PAGES } from "./nav";
import { getDoc } from "./content";

/**
 * A search index built at render time from the 118 pages.
 *
 * Small enough to ship whole and filter in the browser, which is why there is
 * no search service here: the entire corpus is a few hundred KB of prose and
 * a network round trip per keystroke would be slower than scanning it.
 */
export interface SearchDoc {
  slug: string;
  title: string;
  description: string;
  /** Section headings, so a hit can name the part of the page it came from. */
  headings: string[];
  /** Body text, stripped of MDX syntax, for matching only. */
  body: string;
}

/** Strip frontmatter, fences, JSX tags and markdown punctuation. */
function plain(source: string): string {
  return source
    .replace(/^---\n[\s\S]*?\n---\n/, "")
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/<\/?[A-Za-z][^>]*>/g, " ")
    .replace(/[#*_`|>-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function buildIndex(): SearchDoc[] {
  const out: SearchDoc[] = [];
  for (const p of ALL_PAGES) {
    const doc = getDoc(p.slug);
    if (!doc) continue;
    out.push({
      slug: p.slug,
      title: doc.frontmatter.title ?? p.title,
      description: doc.frontmatter.description ?? "",
      headings: doc.headings.map((h) => h.text),
      body: plain(doc.source).slice(0, 6000),
    });
  }
  return out;
}

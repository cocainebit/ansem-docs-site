import fs from "node:fs";
import path from "node:path";
import { slugify } from "./slug";

const ROOT = path.join(process.cwd(), "content");

export interface Frontmatter {
  title?: string;
  description?: string;
}
export interface Heading {
  depth: 2 | 3;
  text: string;
  id: string;
}

export interface Doc {
  slug: string;
  /** MDX with the frontmatter block removed. */
  source: string;
  frontmatter: Frontmatter;
  headings: Heading[];
}

function filePath(slug: string): string {
  return path.join(ROOT, (slug === "" ? "index" : slug) + ".mdx");
}

export function docExists(slug: string): boolean {
  return fs.existsSync(filePath(slug));
}

/**
 * Headings for the table of contents.
 *
 * Read off the raw MDX rather than out of the rendered tree, because the
 * rendering happens inside the MDX compiler and there is no hook to collect
 * from. Fenced code is stripped first: a shell comment beginning with `##`
 * is not a section, and it used to become one.
 */
function headingsOf(source: string): Heading[] {
  const body = source
    .replace(/^---\n[\s\S]*?\n---\n/, "")
    .replace(/```[\s\S]*?```/g, "");
  const out: Heading[] = [];
  for (const line of body.split("\n")) {
    const m = /^(#{2,3})\s+(.+?)\s*$/.exec(line);
    if (!m) continue;
    const text = m[2].replace(/[`*_]/g, "");
    out.push({ depth: m[1].length as 2 | 3, text, id: slugify(text) });
  }
  return out;
}

function parseFrontmatter(source: string): Frontmatter {
  const m = /^---\n([\s\S]*?)\n---/.exec(source);
  if (!m) return {};
  const fm: Frontmatter = {};
  for (const line of m[1].split("\n")) {
    const kv = /^(\w+):\s*(.*)$/.exec(line);
    if (!kv) continue;
    const value = kv[2].trim().replace(/^["'](.*)["']$/, "$1");
    if (kv[1] === "title") fm.title = value;
    // Decks are prose, not code: a description that names `ExecuteMsg` in
    // backticks would otherwise print the backticks.
    if (kv[1] === "description") fm.description = value.replace(/`/g, "");
  }
  return fm;
}

export function getDoc(slug: string): Doc | null {
  const p = filePath(slug);
  if (!fs.existsSync(p)) return null;
  const raw = fs.readFileSync(p, "utf8");
  // MDX has no frontmatter concept of its own: left in place, the `---`
  // fences compile to two horizontal rules with the YAML rendered as a
  // paragraph between them, which is exactly what the first render showed.
  const source = raw.replace(/^---\n[\s\S]*?\n---\n?/, "");
  return {
    slug,
    source,
    frontmatter: parseFrontmatter(raw),
    headings: headingsOf(raw),
  };
}

/** Titles for the sidebar, taken from each page's own frontmatter. */
export function titleMap(): Record<string, string> {
  const out: Record<string, string> = {};
  const walk = (dir: string) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const q = path.join(dir, e.name);
      if (e.isDirectory()) walk(q);
      else if (e.name.endsWith(".mdx")) {
        const rel = path.relative(ROOT, q).replace(/\.mdx$/, "");
        const slug = rel === "index" ? "" : rel;
        const fm = parseFrontmatter(fs.readFileSync(q, "utf8"));
        if (fm.title) out[slug] = fm.title;
      }
    }
  };
  walk(ROOT);
  return out;
}

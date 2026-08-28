"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search as SearchIcon, CornerDownLeft } from "lucide-react";
import type { SearchDoc } from "@/lib/search";

/**
 * Search over the whole corpus, scored rather than merely filtered.
 *
 * The weighting is the useful part: a term in a title means the page is about
 * that term, a term in the body only means the page mentions it. Sorting by
 * position in the file, which a plain filter effectively does, buries the
 * page you wanted under every page that name-drops it.
 */
function score(doc: SearchDoc, terms: string[]): number {
  const title = doc.title.toLowerCase();
  const desc = doc.description.toLowerCase();
  const heads = doc.headings.join(" ").toLowerCase();
  const body = doc.body.toLowerCase();
  let total = 0;
  for (const t of terms) {
    let s = 0;
    if (title.includes(t)) s += title.startsWith(t) ? 120 : 80;
    if (desc.includes(t)) s += 30;
    if (heads.includes(t)) s += 20;
    if (body.includes(t)) s += 6;
    // Every term must appear somewhere, or the result is not a match at all.
    if (s === 0) return 0;
    total += s;
  }
  return total;
}

/** The sentence a term appears in, for the result's second line. */
function excerpt(doc: SearchDoc, term: string): string {
  const i = doc.body.toLowerCase().indexOf(term);
  if (i === -1) return doc.description;
  const start = Math.max(0, i - 60);
  return (start > 0 ? "…" : "") + doc.body.slice(start, start + 150).trim() + "…";
}

export function SearchModal({
  index,
  open,
  onClose,
}: {
  index: SearchDoc[];
  open: boolean;
  onClose: () => void;
}) {
  const [q, setQ] = useState("");
  const [sel, setSel] = useState(0);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const results = useMemo(() => {
    const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
    if (terms.length === 0) return [];
    return index
      .map((d) => ({ doc: d, s: score(d, terms), term: terms[0] }))
      .filter((r) => r.s > 0)
      .sort((a, b) => b.s - a.s)
      .slice(0, 8);
  }, [q, index]);

  useEffect(() => setSel(0), [q]);

  useEffect(() => {
    if (open) {
      setQ("");
      // The autofocus has to wait for the element to exist.
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSel((v) => Math.min(v + 1, results.length - 1));
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSel((v) => Math.max(v - 1, 0));
      }
      if (e.key === "Enter" && results[sel]) {
        e.preventDefault();
        router.push("/" + results[sel].doc.slug);
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, results, sel, router, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center bg-[#17201a]/40 px-4 pt-[12vh] backdrop-blur-sm"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="w-full max-w-xl overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Search the docs"
      >
        <div className="flex items-center gap-3 border-b border-[var(--line)] px-4">
          <SearchIcon className="h-4 w-4 shrink-0 text-[var(--faint)]" aria-hidden="true" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search the docs..."
            aria-label="Search query"
            className="h-14 flex-1 bg-transparent text-[0.9375rem] text-[var(--foreground)]
                       outline-none placeholder:text-[var(--faint)]"
          />
          <kbd className="font-mono text-[0.6875rem] text-[var(--faint)]">esc</kbd>
        </div>

        {q && results.length === 0 && (
          <div className="px-4 py-8 text-center text-sm text-[var(--faint)]">
            Nothing matches “{q}”. Try a contract name, a CLI command, or a
            query field.
          </div>
        )}

        {results.length > 0 && (
          <ul className="max-h-[52vh] overflow-y-auto py-2">
            {results.map((r, i) => (
              <li key={r.doc.slug}>
                <button
                  type="button"
                  onMouseEnter={() => setSel(i)}
                  onClick={() => {
                    router.push("/" + r.doc.slug);
                    onClose();
                  }}
                  className={`flex w-full cursor-pointer items-start gap-3 px-4 py-2.5 text-left transition-colors ${
                    i === sel ? "bg-[var(--accent-wash)]" : ""
                  }`}
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-[var(--foreground)]">
                      {r.doc.title}
                    </span>
                    <span className="mt-0.5 block truncate text-[0.75rem] text-[var(--faint)]">
                      {excerpt(r.doc, r.term)}
                    </span>
                  </span>
                  {i === sel && (
                    <CornerDownLeft
                      className="mt-1 h-3.5 w-3.5 shrink-0 text-[var(--faint)]"
                      aria-hidden="true"
                    />
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

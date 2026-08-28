"use client";

import { useEffect, useState } from "react";
import type { Heading } from "@/lib/content";

/**
 * On this page, with the current section marked.
 *
 * Scroll-spy uses IntersectionObserver with a top-heavy root margin so a
 * heading counts as current once it reaches the upper third of the viewport,
 * not when it first peeks in at the bottom. Reading the observer's own
 * entries is not enough: at rest, nothing is intersecting, so the last
 * heading above the fold is tracked explicitly.
 */
export function Toc({ headings }: { headings: Heading[] }) {
  const [active, setActive] = useState<string>("");

  useEffect(() => {
    if (headings.length === 0) return;
    const nodes = headings
      .map((h) => document.getElementById(h.id))
      .filter((n): n is HTMLElement => n !== null);
    if (nodes.length === 0) return;

    const pick = () => {
      const line = window.scrollY + 140;
      let current = nodes[0];
      for (const n of nodes) if (n.offsetTop <= line) current = n;
      setActive(current.id);
    };

    pick();
    window.addEventListener("scroll", pick, { passive: true });
    window.addEventListener("resize", pick);
    return () => {
      window.removeEventListener("scroll", pick);
      window.removeEventListener("resize", pick);
    };
  }, [headings]);

  if (headings.length === 0) return null;

  return (
    <nav aria-label="On this page" className="flex flex-col gap-2 py-8 text-[0.8125rem]">
      <h5 className="mb-1 text-[0.6875rem] font-semibold uppercase tracking-[0.09em] text-[var(--faint)]">
        On this page
      </h5>
      <ul className="flex flex-col gap-0.5 border-l border-[var(--line)]">
        {headings.map((h) => {
          const on = h.id === active;
          return (
            <li key={h.id}>
              <a
                href={`#${h.id}`}
                className={`-ml-px block border-l py-1 leading-snug transition-colors ${
                  h.depth === 3 ? "pl-6" : "pl-3"
                } ${
                  on
                    ? "border-[var(--accent)] text-[var(--accent)]"
                    : "border-transparent text-[var(--faint)] hover:text-[var(--muted)]"
                }`}
              >
                {h.text}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

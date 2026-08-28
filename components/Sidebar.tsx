"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { TABS } from "@/lib/nav";

/**
 * The page list for whichever tab you are in.
 *
 * Showing only the active tab's groups is the point: all 118 pages at once is
 * a directory, and the tab bar already narrowed the question to one section.
 */
export function Sidebar({
  titles,
  onNavigate,
}: {
  titles: Record<string, string>;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const slug = pathname === "/" ? "" : pathname.replace(/^\//, "");
  const tab =
    TABS.find((t) => t.groups.some((g) => g.pages.some((p) => p.slug === slug))) ??
    TABS[0];

  return (
    /* min-h-full plus mt-auto on the footer pins the social link to the
       bottom of the rail rather than to the end of the page list, which on a
       four-item tab would leave it floating in the middle. */
    <nav className="flex min-h-full flex-col gap-7 py-8 pr-4 text-sm">
      {tab.groups.map((g) => (
        <div key={g.group} className="flex flex-col gap-0.5">
          <h5 className="mb-1.5 px-3 text-[0.6875rem] font-semibold uppercase tracking-[0.09em] text-[var(--faint)]">
            {g.group}
          </h5>
          {g.pages.map((p) => {
            const active = p.slug === slug;
            return (
              <Link
                key={p.slug}
                href={"/" + p.slug}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                /* Active row is an accent rail plus plain white text. The rail
                   is the accent's whole job here, so the label never has to
                   carry emphasis as well. */
                className={`rounded-lg px-3 py-1.5 transition-colors ${
                  active
                    ? "bg-[var(--accent-wash)] font-medium text-[var(--foreground)] shadow-[inset_2px_0_0_0_var(--accent)]"
                    : "text-[var(--muted)] hover:bg-[var(--raised)] hover:text-[var(--foreground)]"
                }`}
              >
                {titles[p.slug] ?? p.title}
              </Link>
            );
          })}
        </div>
      ))}

      <div className="mt-auto border-t border-[var(--line-soft)] pt-4">
        <a
          href="https://x.com/ansemchainfun"
          target="_blank"
          rel="noopener noreferrer"
          onClick={onNavigate}
          className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-[0.8125rem]
                     text-[var(--muted)] transition-colors hover:bg-[var(--raised)]
                     hover:text-[var(--foreground)] focus-visible:outline-2
                     focus-visible:outline-[var(--accent)]"
        >
          <XLogo />
          @ansemchainfun
        </a>
      </div>
    </nav>
  );
}

/* Lucide has no X mark: its `Twitter` is the retired bird and its `X` is a
   close icon. Inlined rather than reached for. */
function XLogo() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-3.5 w-3.5 shrink-0 fill-current"
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

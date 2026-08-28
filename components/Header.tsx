"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, Menu } from "lucide-react";
import Image from "next/image";
import { GlassPill } from "./GlassPill";
import { TABS } from "@/lib/nav";

export function Header({
  onSearch,
  onMenu,
}: {
  onSearch: () => void;
  onMenu: () => void;
}) {
  const pathname = usePathname();
  const slug = pathname === "/" ? "" : pathname.replace(/^\//, "");
  const activeTab = TABS.find((t) =>
    t.groups.some((g) => g.pages.some((p) => p.slug === slug))
  );

  return (
    <header
      className="fixed inset-x-0 top-0 z-50 h-16 border-b border-[var(--line-soft)]
                 bg-[var(--background)]/72 backdrop-blur-xl backdrop-saturate-150"
    >
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
        <button
          type="button"
          onClick={onMenu}
          aria-label="Open navigation"
          className="-ml-1 cursor-pointer rounded-lg p-2 text-[var(--muted)] transition-colors
                     hover:text-[var(--foreground)] lg:hidden
                     focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* The mark sits left of the wordmark and is decorative: the word
            "ansem" is already the accessible name of this link, so the image
            takes an empty alt rather than repeating it to a screen reader. */}
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2 text-[1.375rem] font-semibold
                     tracking-[-0.03em] text-[var(--foreground)]
                     focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
        >
          <Image
            src="/ansem.png"
            alt=""
            width={512}
            height={512}
            priority
            className="h-[30px] w-auto rounded-md"
          />
          ansem
        </Link>

        {/* Tab bar. Docs need it and the blog has no equivalent, so it borrows
            the blog's centred-nav position and its quiet weight. */}
        <nav className="ml-6 hidden items-center gap-1 lg:flex">
          {TABS.map((t) => (
            <Link
              key={t.tab}
              href={t.href}
              className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${
                t === activeTab
                  ? "bg-[var(--accent-wash)] font-medium text-[var(--accent)]"
                  : "text-[var(--muted)] hover:text-[var(--foreground)]"
              }`}
            >
              {t.tab}
            </Link>
          ))}
        </nav>

        <div className="flex-1" />

        <button
          type="button"
          onClick={onSearch}
          aria-label="Search the docs"
          className="hidden cursor-pointer md:block"
        >
          <GlassPill className="h-10 w-[240px] px-3.5 text-sm text-[var(--muted)]">
            <Search className="mr-2 h-4 w-4 shrink-0" aria-hidden="true" />
            <span className="flex-1 text-left">Search...</span>
            <kbd className="font-mono text-[0.6875rem] text-[var(--faint)]">⌘K</kbd>
          </GlassPill>
        </button>

        <button
          type="button"
          onClick={onSearch}
          aria-label="Search the docs"
          className="cursor-pointer rounded-lg p-2 text-[var(--muted)] md:hidden"
        >
          <Search className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
}

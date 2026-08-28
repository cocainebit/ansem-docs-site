"use client";

import { useEffect, useState, type ReactNode } from "react";
import { X } from "lucide-react";
import Image from "next/image";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import { SearchModal } from "./Search";
import type { SearchDoc } from "@/lib/search";

/**
 * Header, the mobile nav drawer, and search: everything that holds open/closed
 * state. Keeping it in one client component means the pages themselves, and
 * all 118 documents' worth of MDX, still render on the server.
 */
export function Shell({
  index,
  titles,
  children,
}: {
  index: SearchDoc[];
  titles: Record<string, string>;
  children: ReactNode;
}) {
  const [search, setSearch] = useState(false);
  const [menu, setMenu] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearch(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <Header onSearch={() => setSearch(true)} onMenu={() => setMenu(true)} />
      {children}

      {menu && (
        <div
          className="fixed inset-0 z-[90] bg-[#17201a]/40 lg:hidden"
          onClick={() => setMenu(false)}
          role="presentation"
        >
          <div
            className="h-full w-[280px] overflow-y-auto border-r border-[var(--line)] bg-[var(--background)] px-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex h-16 items-center justify-between">
              <span className="flex items-center gap-2 text-[1.25rem] font-semibold tracking-[-0.03em]">
                <Image src="/ansem.png" alt="" width={512} height={512} className="h-[26px] w-auto rounded-md" />
                ansem
              </span>
              <button
                type="button"
                onClick={() => setMenu(false)}
                aria-label="Close navigation"
                className="cursor-pointer rounded-lg p-2 text-[var(--muted)]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <Sidebar titles={titles} onNavigate={() => setMenu(false)} />
          </div>
        </div>
      )}

      <SearchModal index={index} open={search} onClose={() => setSearch(false)} />
    </>
  );
}

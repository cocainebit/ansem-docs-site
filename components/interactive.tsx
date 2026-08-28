"use client";

import {
  createContext,
  useContext,
  useId,
  useState,
  type ReactNode,
} from "react";
import { ChevronRight } from "lucide-react";

/**
 * The two components that need state. Everything else in the MDX map renders
 * on the server, so this file is deliberately the whole client boundary.
 */

/**
 * Whether an Accordion is inside an AccordionGroup.
 *
 * The MDX uses both shapes, and the surface belongs to whichever is outermost:
 * a grouped accordion is one row of a shared card, a lone one is its own card.
 * Without this the grouped case draws a rounded border around every row inside
 * an already-bordered group.
 */
const Grouped = createContext(false);

export function AccordionGroupShell({ children }: { children: ReactNode }) {
  return (
    <Grouped.Provider value={true}>
      <div className="my-6 overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--surface)]">
        {children}
      </div>
    </Grouped.Provider>
  );
}

export function Accordion({
  title,
  defaultOpen = false,
  children,
}: {
  title?: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const grouped = useContext(Grouped);
  const [open, setOpen] = useState(defaultOpen);
  const panel = useId();

  const row = (
    <div className={grouped ? "border-b border-[var(--line-soft)] last:border-b-0" : ""}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={panel}
        className="flex w-full cursor-pointer items-center gap-2.5 px-4 py-3.5 text-left
                   text-[0.9375rem] font-medium text-[var(--foreground)]
                   transition-colors hover:bg-[var(--raised)]
                   focus-visible:outline-2 focus-visible:-outline-offset-2
                   focus-visible:outline-[var(--accent)]"
      >
        <ChevronRight
          className={`h-4 w-4 shrink-0 text-[var(--faint)] transition-transform duration-150 ${
            open ? "rotate-90" : ""
          }`}
          aria-hidden="true"
        />
        <span className="flex-1">{title}</span>
      </button>
      {open && (
        <div id={panel} className="doc px-4 pb-4 pl-11 text-[0.9375rem]">
          {children}
        </div>
      )}
    </div>
  );

  if (grouped) return row;
  return (
    <div className="my-6 overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--surface)]">
      {row}
    </div>
  );
}

export interface TabChild {
  title: string;
  content: ReactNode;
}

export function TabsClient({ tabs }: { tabs: TabChild[] }) {
  const [active, setActive] = useState(0);
  if (tabs.length === 0) return null;
  return (
    <div className="my-6">
      {/* Underline rather than a pill row: the active tab is marked the same
          way the header marks the active section, so the page keeps one idea
          of "you are here". */}
      <div
        role="tablist"
        className="flex gap-1 overflow-x-auto border-b border-[var(--line)]"
      >
        {tabs.map((t, i) => (
          <button
            key={t.title}
            role="tab"
            type="button"
            aria-selected={i === active}
            onClick={() => setActive(i)}
            className={`-mb-px cursor-pointer whitespace-nowrap border-b-2 px-3.5 py-2.5 text-sm
                        transition-colors focus-visible:outline-2
                        focus-visible:outline-[var(--accent)] ${
                          i === active
                            ? "border-[var(--accent)] font-medium text-[var(--foreground)]"
                            : "border-transparent text-[var(--muted)] hover:text-[var(--foreground)]"
                        }`}
          >
            {t.title}
          </button>
        ))}
      </div>
      <div role="tabpanel" className="doc pt-5">
        {tabs[active].content}
      </div>
    </div>
  );
}

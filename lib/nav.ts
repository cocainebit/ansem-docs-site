import raw from "./nav-source.json";

/**
 * The sidebar, read from the Mintlify config that already described it.
 *
 * Kept as the source rather than re-typed here so that adding a page stays a
 * one-line edit in one file, which is what it was before this site existed.
 */

export interface NavPage {
  /** Route slug, e.g. `concepts/units`. The overview page is "". */
  slug: string;
  title: string;
}
export interface NavGroup {
  group: string;
  pages: NavPage[];
}
export interface NavTab {
  tab: string;
  /** Route the tab lands on: its first page. */
  href: string;
  groups: NavGroup[];
}

interface RawTab {
  tab: string;
  groups: { group: string; pages: string[] }[];
}

/** `concepts/quote-modes` -> `Quote modes`. Overridden by frontmatter later. */
function titleFromSlug(slug: string): string {
  const last = slug.split("/").pop() ?? slug;
  const words = last.replace(/[-_]/g, " ");
  return words.charAt(0).toUpperCase() + words.slice(1);
}

const tabsRaw = (raw as { navigation: { tabs: RawTab[] } }).navigation.tabs;

export const TABS: NavTab[] = tabsRaw.map((t) => {
  const groups: NavGroup[] = t.groups.map((g) => ({
    group: g.group,
    pages: g.pages.map((p) => ({
      slug: p === "index" ? "" : p,
      title: titleFromSlug(p),
    })),
  }));
  return {
    tab: t.tab,
    href: "/" + (groups[0]?.pages[0]?.slug ?? ""),
    groups,
  };
});

/** Every page in nav order. Drives prev/next and static params. */
export const ALL_PAGES: NavPage[] = TABS.flatMap((t) =>
  t.groups.flatMap((g) => g.pages)
);

/** Which tab a slug belongs to, so the tab bar can mark itself. */
export function tabForSlug(slug: string): NavTab | undefined {
  return TABS.find((t) =>
    t.groups.some((g) => g.pages.some((p) => p.slug === slug))
  );
}

export function neighbours(slug: string): {
  prev: NavPage | null;
  next: NavPage | null;
} {
  const i = ALL_PAGES.findIndex((p) => p.slug === slug);
  if (i === -1) return { prev: null, next: null };
  return {
    prev: i > 0 ? ALL_PAGES[i - 1] : null,
    next: i < ALL_PAGES.length - 1 ? ALL_PAGES[i + 1] : null,
  };
}

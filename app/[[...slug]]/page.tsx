import Link from "next/link";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { getDoc, titleMap } from "@/lib/content";
import { ALL_PAGES, neighbours, tabForSlug } from "@/lib/nav";
import { mdxComponents } from "@/components/mdx";
import { Sidebar } from "@/components/Sidebar";
import { Toc } from "@/components/Toc";
import { Hero } from "@/components/Hero";

export function generateStaticParams() {
  return ALL_PAGES.map((p) => ({
    slug: p.slug === "" ? [] : p.slug.split("/"),
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug?: string[] }>;
}) {
  const { slug } = await params;
  const doc = getDoc((slug ?? []).join("/"));
  if (!doc) return {};
  return {
    title: doc.frontmatter.title,
    description: doc.frontmatter.description,
  };
}

export default async function Page({
  params,
}: {
  params: Promise<{ slug?: string[] }>;
}) {
  const { slug } = await params;
  const key = (slug ?? []).join("/");
  const doc = getDoc(key);
  if (!doc) notFound();

  const titles = titleMap();
  const { prev, next } = neighbours(key);
  const tab = tabForSlug(key);
  const group = tab?.groups.find((g) => g.pages.some((p) => p.slug === key));

  return (
    <div className="mx-auto flex max-w-[110rem] gap-0 px-4 pt-16 sm:px-6">
      {/* Sidebar. Sticky under the 64px header and scrolls on its own so a
          long page list never drags the article with it. */}
      <aside className="hidden w-[248px] shrink-0 border-r border-[var(--line-soft)] lg:block">
        <div className="sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto">
          <Sidebar titles={titles} />
        </div>
      </aside>

      {/* The article. The blog's measure, centred in whatever is left. */}
      <main className="min-w-0 flex-1 px-0 py-12 lg:px-10 xl:px-14">
        <article className="mx-auto max-w-[46rem]">
          {/* The overview page opens on the loop. Only this page: a masthead
              that repeated on all 118 would stop being a masthead. */}
          {key === "" && <Hero src="/hero.png" alt="The creation of ansem" />}

          <header className="mb-10">
            {group && (
              <div className="mb-3 text-[0.6875rem] font-semibold uppercase tracking-[0.09em] text-[var(--faint)]">
                {group.group}
              </div>
            )}
            <h1 className="text-[2.5rem] font-bold leading-[1.1] tracking-[-0.028em] text-[var(--foreground)] text-balance">
              {doc.frontmatter.title}
            </h1>
            {doc.frontmatter.description && (
              /* The deck: large, light, muted. This pairing with the title is
                 the blog's masthead and most of why a page reads as edited. */
              <p className="mt-4 text-xl font-light leading-relaxed text-[var(--muted)] text-pretty">
                {doc.frontmatter.description}
              </p>
            )}
            <hr className="mt-8 border-0 border-t border-[var(--line)]" />
          </header>

          <div className="doc">
            {/* GFM is not on by default, and without it every pipe table in
                the docs renders as a paragraph of literal pipes. */}
            <MDXRemote
              source={doc.source}
              components={mdxComponents}
              options={{ mdxOptions: { remarkPlugins: [remarkGfm] } }}
            />
          </div>

          {(prev || next) && (
            <nav className="mt-16 grid gap-3 border-t border-[var(--line)] pt-8 sm:grid-cols-2">
              {prev ? (
                <Link
                  href={"/" + prev.slug}
                  data-plain
                  className="group flex flex-col gap-1 rounded-xl border border-[var(--line)]
                             bg-[var(--surface)] px-4 py-3 transition-colors
                             hover:border-[var(--accent-border)] hover:bg-[var(--raised)]"
                >
                  <span className="flex items-center gap-1.5 text-[0.6875rem] font-semibold uppercase tracking-[0.09em] text-[var(--faint)]">
                    <ArrowLeft className="h-3 w-3" aria-hidden="true" /> Previous
                  </span>
                  <span className="text-sm font-medium text-[var(--foreground)]">
                    {titles[prev.slug] ?? prev.title}
                  </span>
                </Link>
              ) : (
                <span />
              )}
              {next && (
                <Link
                  href={"/" + next.slug}
                  data-plain
                  className="group flex flex-col items-end gap-1 rounded-xl border border-[var(--line)]
                             bg-[var(--surface)] px-4 py-3 text-right transition-colors
                             hover:border-[var(--accent-border)] hover:bg-[var(--raised)]"
                >
                  <span className="flex items-center gap-1.5 text-[0.6875rem] font-semibold uppercase tracking-[0.09em] text-[var(--faint)]">
                    Next <ArrowRight className="h-3 w-3" aria-hidden="true" />
                  </span>
                  <span className="text-sm font-medium text-[var(--foreground)]">
                    {titles[next.slug] ?? next.title}
                  </span>
                </Link>
              )}
            </nav>
          )}
        </article>
      </main>

      {/* On this page */}
      <aside className="hidden w-[220px] shrink-0 xl:block">
        <div className="sticky top-16 max-h-[calc(100vh-4rem)] overflow-y-auto">
          <Toc headings={doc.headings} />
        </div>
      </aside>
    </div>
  );
}

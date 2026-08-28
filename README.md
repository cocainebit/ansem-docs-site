# Ansemchain docs

The ansemchain documentation site. 118 pages of MDX rendered by Next.js.

## Running it

```bash
npm install
npm run dev        # http://localhost:3000
```

`npm run build` prerenders every page as static HTML, so the output can be
hosted anywhere that serves files. There are no environment variables and no
runtime services: the whole site is the `content/` directory plus a renderer.

## The docs assistant

The "Ask the docs" button (bottom right) posts to `app/api/ask/route.ts`,
which splits every page at its `##` headings, picks the sections that best
match the question (`lib/retrieve.ts`), and streams an answer from Claude
(`claude-opus-5`, Anthropic SDK) with links to the pages it used. It needs
`ANTHROPIC_API_KEY` in the environment (`.env.local` locally; the host's
secrets in production). Without it the button still renders and the panel
says the assistant is not configured. Refusal fallbacks are on
(`fallbacks: "default"`), the page directory is prompt-cached for an hour,
and each IP gets 30 questions an hour per instance.

Because of that route, the site is no longer a pure static export: it needs
a Node host (Vercel, a `next start` process, a container). Everything except
`/api/ask` is still prerendered.

## Where things are

```
content/            the docs themselves, one .mdx per page
lib/nav-source.json the sidebar and tab structure
lib/nav.ts          reads the above into tabs, groups and page order
lib/content.ts      loads a page, strips frontmatter, extracts headings
lib/search.ts       builds the search index at render time
lib/retrieve.ts    section retrieval for the docs assistant
app/api/ask/       the assistant route (streams from Claude)
components/Ask.tsx the assistant button and panel
components/mdx.tsx  the MDX component map
app/globals.css     the token layer: every colour is defined once, here
```

## Adding or moving a page

Two edits, and only two:

1. write `content/<path>.mdx` with `title` and `description` frontmatter
2. add its slug to the right group in `lib/nav-source.json`

Page order, prev/next links, the sidebar and the search index all derive from
that file, so nothing else needs touching.

## Notes for whoever picks this up

**Frontmatter is stripped before the MDX compiler sees it.** MDX has no
frontmatter concept of its own, so left in place the `---` fences compile to
two horizontal rules with the YAML rendered as a paragraph between them.

**GFM is enabled explicitly** in `app/[[...slug]]/page.tsx`. Without
`remark-gfm` every pipe table in the docs renders as literal pipes.

**Headings and the table of contents share one `slugify`.** If they ever
diverge, the TOC links silently go nowhere and no build catches it.

**Prose links are styled with `.doc a:not([data-plain])`.** Cards, pager links
and heading anchors are links too, and styling those as prose underlines every
card on the page. They opt out with `data-plain`.

## Theme

Light, single theme, deliberately. The shell is the peard docs shell (same
layout, same components); only the palette differs. The accent is the green
of the horns on the coin, darkened to clear contrast on marble. Colours are
defined once as custom properties at the top of `app/globals.css`;
components never carry a raw hex. Semantic colour (crimson for warnings, gold
for ordinals) is kept separate from the accent on purpose, so that a warning
reads as a warning.

## Where the content came from

`content/` is the Mintlify tree from `~/ansem-docs` (branch `ansem-rebrand`)
with two mechanical changes: `introduction.mdx` became `index.mdx`, and the
body-level `# Title` line was removed from every page because this shell
renders the frontmatter `title` as the page heading. The Mintlify `docs.json`
navigation was regrouped into four tabs in `lib/nav-source.json`; twelve
pages that were on disk but absent from the old nav (the launchpad/REST/gRPC
API pages and `contracts/deployed`) are now linked.

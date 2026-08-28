# ansem-docs-site (Ansemchain docs)

Next.js + MDX docs site for ansemchain, built 2026-08-27 by porting the
content of `~/ansem-docs` (Mintlify) into the `~/peard-docs` shell. See
README.md for layout and the two-edit rule for adding a page.

## Who is working on what

| date       | session   | area                                                        |
|------------|-----------|-------------------------------------------------------------|
| 2026-08-27 | docs port | whole tree: initial port, retheme, nav. Dev server on :3344 |
| 2026-08-28 | docs port | docs assistant: `app/api/ask`, `lib/retrieve.ts`, `components/Ask.tsx`. Needs ANTHROPIC_API_KEY in .env.local |

Add your row BEFORE you write a file. Several Claude instances run on this
machine at once; see ~/.claude/CLAUDE.md for the machine-wide rules.

## Running

`npm run dev -- --port 3344` (3000 is not ours; check `lsof -ti :<port>`).
The source content still lives in `~/ansem-docs`; edit pages HERE from now on,
that tree is the Mintlify original and is not synced.

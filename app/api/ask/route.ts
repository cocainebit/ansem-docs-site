import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";
import { retrieve, directory } from "@/lib/retrieve";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MODEL = "claude-opus-5";
const MAX_TURNS = 12;
const MAX_CHARS = 2000;

/** Per-IP budget: 30 questions an hour. In-memory, so per instance. */
const budget = new Map<string, { n: number; reset: number }>();
function allow(ip: string): boolean {
  const now = Date.now();
  const b = budget.get(ip);
  if (!b || b.reset < now) {
    budget.set(ip, { n: 1, reset: now + 3600_000 });
    return true;
  }
  b.n += 1;
  return b.n <= 30;
}

const SYSTEM = `You are the Ansemchain docs assistant, embedded on docs pages. You answer questions about Ansemchain: the CHANSE gas token, the ANSEM bridged asset, the launchpad, AMM, bridge, proposals, wallet, CLI, SDK, APIs and contract source.

Rules:
- Answer only from the documentation excerpts you are given and the page directory. If the excerpts do not cover the question, say so plainly and point to the most likely page from the directory. Never invent addresses, commands, parameters or numbers.
- Be brief: a short paragraph or a few bullets, then a command or snippet if one helps. Plain prose, no headings, no preamble, no em dashes.
- When you use a page, link it inline as a Markdown link with its site path, e.g. [Bridging](/bridge/deposit). Use only paths from the directory.
- CHANSE (uchanse) is gas, staking and fees. ANSEM (uansem) is a separate bridged asset, not gas. Do not conflate them.
- Keep secrets out: never ask for or repeat seed phrases or private keys.

Page directory (path | title | description):
`;

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json(
      { error: "The docs assistant is not configured on this deployment." },
      { status: 503 }
    );
  }
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "local";
  if (!allow(ip)) {
    return Response.json({ error: "Too many questions, try again in a bit." }, { status: 429 });
  }

  let body: { messages?: { role: string; content: string }[]; page?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Bad request." }, { status: 400 });
  }
  const turns = (body.messages ?? [])
    .filter((m) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
    .slice(-MAX_TURNS)
    .map((m) => ({ role: m.role as "user" | "assistant", content: m.content.slice(0, MAX_CHARS) }));
  if (turns.length === 0 || turns[turns.length - 1].role !== "user") {
    return Response.json({ error: "Bad request." }, { status: 400 });
  }

  const question = turns[turns.length - 1].content;
  const page = typeof body.page === "string" ? body.page.replace(/^\//, "") : undefined;
  const sections = retrieve(question, page);
  const sources = [...new Map(sections.map((s) => [s.slug, s.title])).entries()].map(
    ([slug, title]) => ({ path: "/" + slug, title })
  );

  const excerpts = sections.length
    ? sections
        .map((s) => `<excerpt path="/${s.slug}" title="${s.title}"${s.heading ? ` section="${s.heading}"` : ""}>\n${s.body}\n</excerpt>`)
        .join("\n\n")
    : "(no matching excerpts)";

  const messages: Anthropic.MessageParam[] = turns.slice(0, -1);
  messages.push({
    role: "user",
    content: `The reader is on ${page ? "/" + page : "/"}.\n\nDocumentation excerpts:\n\n${excerpts}\n\nQuestion: ${question}`,
  });

  const client = new Anthropic();
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      // First line: the sources, as JSON. Everything after: answer text.
      controller.enqueue(encoder.encode(JSON.stringify({ sources }) + "\n"));
      try {
        const run = client.beta.messages.stream({
          model: MODEL,
          max_tokens: 4096,
          output_config: { effort: "medium" },
          betas: ["server-side-fallback-2026-07-01"],
          fallbacks: "default",
          system: [
            {
              type: "text",
              text: SYSTEM + directory(),
              cache_control: { type: "ephemeral", ttl: "1h" },
            },
          ],
          messages,
        });
        for await (const event of run) {
          if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }
        const final = await run.finalMessage();
        if (final.stop_reason === "refusal") {
          controller.enqueue(encoder.encode("\n\nI can't help with that one."));
        }
      } catch (err) {
        const msg =
          err instanceof Anthropic.RateLimitError
            ? "The assistant is busy, try again in a moment."
            : err instanceof Anthropic.AuthenticationError
              ? "The assistant's API key is invalid."
              : "The assistant hit an error. Try again.";
        controller.enqueue(encoder.encode("\n\n" + msg));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
  });
}

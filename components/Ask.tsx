"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageCircle, X, ArrowUp, Square } from "lucide-react";

/**
 * The docs assistant: a button in the bottom-right corner that opens a
 * panel. Questions go to /api/ask, which retrieves the relevant sections and
 * streams an answer back. The first line of the response is a JSON list of
 * the pages it was shown; the rest is the answer text.
 *
 * Client state only. Nothing is stored anywhere; closing the panel keeps the
 * thread for the session, reloading the page loses it.
 */
interface Turn {
  role: "user" | "assistant";
  content: string;
  sources?: { path: string; title: string }[];
}

const SUGGESTIONS = [
  "How do I bridge CHANSE from Solana?",
  "What is the difference between CHANSE and ANSEM?",
  "How does a launchpad token graduate?",
  "How do I run a localnet?",
];

export function Ask() {
  const [open, setOpen] = useState(false);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const pathname = usePathname();
  const abort = useRef<AbortController | null>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (open) requestAnimationFrame(() => inputRef.current?.focus());
  }, [open]);

  // A link to any page with #ask opens the panel.
  useEffect(() => {
    if (window.location.hash === "#ask") setOpen(true);
  }, []);

  useEffect(() => {
    const el = scroller.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [turns]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  async function ask(text: string) {
    const q = text.trim();
    if (!q || busy) return;
    setInput("");
    const history: Turn[] = [...turns, { role: "user", content: q }];
    setTurns([...history, { role: "assistant", content: "" }]);
    setBusy(true);
    const ctrl = new AbortController();
    abort.current = ctrl;
    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: history.map((t) => ({ role: t.role, content: t.content })),
          page: pathname,
        }),
        signal: ctrl.signal,
      });
      if (!res.ok || !res.body) {
        let msg = "The assistant is unavailable right now.";
        try {
          msg = (await res.json()).error ?? msg;
        } catch {}
        setTurns([...history, { role: "assistant", content: msg }]);
        return;
      }
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = "";
      let sources: Turn["sources"];
      let answer = "";
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        if (!sources) {
          const nl = buf.indexOf("\n");
          if (nl === -1) continue;
          try {
            sources = JSON.parse(buf.slice(0, nl)).sources;
          } catch {
            sources = [];
          }
          buf = buf.slice(nl + 1);
        }
        answer += buf;
        buf = "";
        setTurns([...history, { role: "assistant", content: answer, sources }]);
      }
    } catch (e) {
      if ((e as Error).name !== "AbortError") {
        setTurns([...history, { role: "assistant", content: "The assistant hit an error. Try again." }]);
      }
    } finally {
      setBusy(false);
      abort.current = null;
    }
  }

  return (
    <>
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Ask the docs"
          className="fixed bottom-5 right-5 z-[80] flex h-12 cursor-pointer items-center gap-2 rounded-full
                     border border-[var(--line)] bg-[var(--surface)] px-4 text-sm font-medium
                     text-[var(--foreground)] shadow-[0_1px_2px_rgb(23_32_26_/_0.08),0_8px_24px_rgb(23_32_26_/_0.12)]
                     transition-colors hover:border-[var(--accent-border)] hover:bg-[var(--raised)]
                     focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
        >
          <MessageCircle className="h-4 w-4 text-[var(--accent)]" aria-hidden="true" />
          Ask the docs
        </button>
      )}

      {open && (
        <div
          role="dialog"
          aria-label="Ask the docs"
          className="fixed bottom-5 right-5 z-[80] flex h-[min(600px,calc(100vh-2.5rem))] w-[min(400px,calc(100vw-2.5rem))]
                     flex-col overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)]
                     shadow-[0_1px_2px_rgb(23_32_26_/_0.08),0_16px_48px_rgb(23_32_26_/_0.16)]"
        >
          <div className="flex h-12 shrink-0 items-center gap-2 border-b border-[var(--line-soft)] px-4">
            <MessageCircle className="h-4 w-4 text-[var(--accent)]" aria-hidden="true" />
            <span className="text-sm font-medium text-[var(--foreground)]">Ask the docs</span>
            <span className="flex-1" />
            {turns.length > 0 && !busy && (
              <button
                type="button"
                onClick={() => setTurns([])}
                className="cursor-pointer rounded-md px-2 py-1 text-[0.75rem] text-[var(--faint)] hover:text-[var(--foreground)]"
              >
                Clear
              </button>
            )}
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close"
              className="cursor-pointer rounded-md p-1 text-[var(--muted)] hover:text-[var(--foreground)]"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div ref={scroller} className="flex-1 overflow-y-auto px-4 py-4">
            {turns.length === 0 ? (
              <div className="flex flex-col gap-2">
                <p className="mb-1 text-[0.8125rem] leading-relaxed text-[var(--muted)]">
                  Answers come from these docs, with links to the pages used.
                  It will tell you when the docs do not cover something.
                </p>
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => ask(s)}
                    className="cursor-pointer rounded-lg border border-[var(--line)] px-3 py-2 text-left text-[0.8125rem]
                               text-[var(--foreground)] transition-colors hover:border-[var(--accent-border)] hover:bg-[var(--raised)]"
                  >
                    {s}
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {turns.map((t, i) =>
                  t.role === "user" ? (
                    <div key={i} className="self-end max-w-[85%] rounded-2xl rounded-br-md bg-[var(--accent-wash)] px-3.5 py-2 text-[0.875rem] leading-relaxed text-[var(--foreground)]">
                      {t.content}
                    </div>
                  ) : (
                    <div key={i} className="text-[0.875rem] leading-relaxed text-[var(--foreground)]">
                      {t.content ? (
                        <Answer text={t.content} />
                      ) : (
                        <span className="inline-flex gap-1 py-1" aria-label="Thinking">
                          <Dot d="0ms" /><Dot d="150ms" /><Dot d="300ms" />
                        </span>
                      )}
                      {t.sources && t.sources.length > 0 && t.content && (
                        <div className="mt-2.5 flex flex-wrap gap-1.5">
                          {t.sources.slice(0, 4).map((s) => (
                            <Link
                              key={s.path}
                              href={s.path}
                              data-plain
                              className="rounded-md border border-[var(--line)] px-2 py-0.5 text-[0.6875rem] text-[var(--muted)]
                                         transition-colors hover:border-[var(--accent-border)] hover:text-[var(--accent)]"
                            >
                              {s.title}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                )}
              </div>
            )}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              ask(input);
            }}
            className="shrink-0 border-t border-[var(--line-soft)] p-3"
          >
            <div className="flex items-end gap-2 rounded-xl border border-[var(--line)] bg-[var(--background)] px-3 py-2 focus-within:border-[var(--accent-border)]">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    ask(input);
                  }
                }}
                rows={1}
                placeholder="Ask about Ansemchain..."
                aria-label="Your question"
                className="max-h-28 flex-1 resize-none bg-transparent text-[0.875rem] leading-relaxed text-[var(--foreground)]
                           outline-none placeholder:text-[var(--faint)]"
              />
              {busy ? (
                <button
                  type="button"
                  onClick={() => abort.current?.abort()}
                  aria-label="Stop"
                  className="flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-lg bg-[var(--raised)] text-[var(--muted)]"
                >
                  <Square className="h-3 w-3" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={!input.trim()}
                  aria-label="Send"
                  className="flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-lg bg-[var(--accent)]
                             text-[var(--accent-contrast)] transition-opacity disabled:cursor-default disabled:opacity-30"
                >
                  <ArrowUp className="h-4 w-4" />
                </button>
              )}
            </div>
            <p className="mt-2 px-1 text-[0.6875rem] text-[var(--faint)]">
              May be wrong. Check the linked page before sending funds.
            </p>
          </form>
        </div>
      )}
    </>
  );
}

function Dot({ d }: { d: string }) {
  return (
    <span
      className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--faint)]"
      style={{ animationDelay: d }}
    />
  );
}

/* ---------------------------------------------------------------------------
   A small Markdown renderer for answers: paragraphs, bullets, fenced code,
   inline code, bold, links. Enough for what the system prompt allows the
   model to produce; anything else falls through as plain text.
   --------------------------------------------------------------------------- */

function Answer({ text }: { text: string }) {
  const blocks: ReactNode[] = [];
  const lines = text.split("\n");
  let i = 0;
  let key = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (line.startsWith("```")) {
      const code: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) code.push(lines[i++]);
      i++;
      blocks.push(
        <pre key={key++} className="my-2 overflow-x-auto rounded-lg border border-[var(--pre-line)] bg-[var(--pre-bg)] px-3 py-2 font-mono text-[0.75rem] leading-relaxed text-[var(--code-fg)]">
          <code>{code.join("\n")}</code>
        </pre>
      );
      continue;
    }
    if (/^\s*[-*] /.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*[-*] /.test(lines[i])) items.push(lines[i++].replace(/^\s*[-*] /, ""));
      blocks.push(
        <ul key={key++} className="my-2 flex list-disc flex-col gap-1 pl-5">
          {items.map((it, j) => <li key={j}>{inline(it)}</li>)}
        </ul>
      );
      continue;
    }
    if (/^\s*\d+\. /.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*\d+\. /.test(lines[i])) items.push(lines[i++].replace(/^\s*\d+\. /, ""));
      blocks.push(
        <ol key={key++} className="my-2 flex list-decimal flex-col gap-1 pl-5">
          {items.map((it, j) => <li key={j}>{inline(it)}</li>)}
        </ol>
      );
      continue;
    }
    if (line.trim() === "") {
      i++;
      continue;
    }
    const para: string[] = [line];
    i++;
    while (i < lines.length && lines[i].trim() !== "" && !/^(```|\s*[-*] |\s*\d+\. )/.test(lines[i])) para.push(lines[i++]);
    blocks.push(<p key={key++} className="my-2 first:mt-0 last:mb-0">{inline(para.join(" "))}</p>);
  }
  return <>{blocks}</>;
}

function inline(s: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /(`[^`]+`)|(\*\*[^*]+\*\*)|(\[[^\]]+\]\((\/[^)\s]*|https?:[^)\s]*)\))/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let k = 0;
  while ((m = re.exec(s))) {
    if (m.index > last) out.push(s.slice(last, m.index));
    if (m[1]) {
      out.push(<code key={k++} className="rounded bg-[var(--code-bg)] px-1 py-0.5 font-mono text-[0.8em] text-[var(--code-fg)]">{m[1].slice(1, -1)}</code>);
    } else if (m[2]) {
      out.push(<strong key={k++} className="font-semibold">{m[2].slice(2, -2)}</strong>);
    } else if (m[3]) {
      const label = m[3].slice(1, m[3].indexOf("]("));
      const href = m[4];
      out.push(
        href.startsWith("/") ? (
          <Link key={k++} href={href} className="text-[var(--accent)] underline decoration-[var(--accent-border)] underline-offset-2">{label}</Link>
        ) : (
          <a key={k++} href={href} target="_blank" rel="noopener noreferrer" className="text-[var(--accent)] underline decoration-[var(--accent-border)] underline-offset-2">{label}</a>
        )
      );
    }
    last = m.index + m[0].length;
  }
  if (last < s.length) out.push(s.slice(last));
  return out;
}

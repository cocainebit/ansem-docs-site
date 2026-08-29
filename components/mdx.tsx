import Link from "next/link";
import type { ReactElement, ReactNode } from "react";
import { Children, isValidElement } from "react";
import { Info, TriangleAlert, Lightbulb } from "lucide-react";
import {
  Accordion,
  AccordionGroupShell,
  TabsClient,
  type TabChild,
} from "./interactive";
import { slugify, textOf } from "@/lib/slug";
import { HornCatalog } from "./horn-catalog";

/* -------------------------------------------------------------------------
   Callouts

   One device for all four kinds: a rail on the left, a faint tinted ground,
   no border box. Only Warning colours its rail, because if every callout is
   accented then none of them is a warning.
   ------------------------------------------------------------------------- */

function Callout({
  tone,
  icon,
  children,
}: {
  tone: "neutral" | "warn" | "tip";
  icon: ReactNode;
  children: ReactNode;
}) {
  const rail =
    tone === "warn"
      ? "border-l-[var(--crimson)]"
      : tone === "tip"
        ? "border-l-[var(--line-strong)]"
        : "border-l-[var(--line-strong)]";
  return (
    <div
      className={`doc my-6 flex gap-3 rounded-r-lg border-l-2 bg-white/[0.028] px-4 py-3.5 text-[0.9375rem] ${rail}`}
    >
      <span
        className={`mt-0.5 shrink-0 ${tone === "warn" ? "text-[var(--crimson)]" : "text-[var(--faint)]"}`}
      >
        {icon}
      </span>
      <div className="[&>p:last-child]:mb-0 [&>p]:mb-3">{children}</div>
    </div>
  );
}

const Note = ({ children }: { children: ReactNode }) => (
  <Callout tone="neutral" icon={<Info className="h-4 w-4" aria-hidden="true" />}>
    {children}
  </Callout>
);
const Warning = ({ children }: { children: ReactNode }) => (
  <Callout tone="warn" icon={<TriangleAlert className="h-4 w-4" aria-hidden="true" />}>
    {children}
  </Callout>
);
const Tip = ({ children }: { children: ReactNode }) => (
  <Callout tone="tip" icon={<Lightbulb className="h-4 w-4" aria-hidden="true" />}>
    {children}
  </Callout>
);

/* -------------------------------------------------------------------------
   Fields

   `ResponseField` appears 260 times and `ParamField` 98, so these two carry
   the reference section on their own. Both render as one dense row: name in
   mono, type in the accent, then the qualifiers as small caps. Anything
   heavier turns a 40-field account into a wall of cards.
   ------------------------------------------------------------------------- */

function Field({
  name,
  type,
  required,
  deprecated,
  defaultValue,
  children,
}: {
  name?: string;
  type?: string;
  required?: boolean;
  deprecated?: boolean;
  defaultValue?: string;
  children?: ReactNode;
}) {
  const hasBody = Children.count(children) > 0;
  return (
    <div className="border-b border-[var(--line-soft)] py-3 last:border-b-0">
      <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
        {name && (
          <code className="font-mono text-[0.8125rem] font-medium text-[var(--foreground)]">
            {name}
          </code>
        )}
        {type && (
          <code className="font-mono text-[0.75rem] text-[var(--accent)]">
            {type}
          </code>
        )}
        {required && (
          <span className="text-[0.625rem] font-semibold uppercase tracking-[0.08em] text-[var(--crimson)]">
            required
          </span>
        )}
        {deprecated && (
          <span className="text-[0.625rem] font-semibold uppercase tracking-[0.08em] text-[var(--faint)]">
            deprecated
          </span>
        )}
        {defaultValue && (
          <span className="font-mono text-[0.75rem] text-[var(--faint)]">
            default {defaultValue}
          </span>
        )}
      </div>
      {hasBody && (
        <div className="doc mt-1.5 text-[0.9375rem] leading-relaxed [&>p:last-child]:mb-0 [&>p]:mb-2">
          {children}
        </div>
      )}
    </div>
  );
}

const ResponseField = (p: {
  name?: string;
  type?: string;
  required?: boolean;
  deprecated?: boolean;
  default?: string;
  children?: ReactNode;
}) => <Field {...p} defaultValue={p.default} />;

/** Mintlify spells the name `path`, `query` or `body` depending on where it sits. */
const ParamField = (p: {
  path?: string;
  query?: string;
  body?: string;
  header?: string;
  type?: string;
  required?: boolean;
  deprecated?: boolean;
  default?: string;
  children?: ReactNode;
}) => (
  <Field
    name={p.path ?? p.query ?? p.body ?? p.header}
    type={p.type}
    required={p.required}
    deprecated={p.deprecated}
    defaultValue={p.default}
  >
    {p.children}
  </Field>
);

/* -------------------------------------------------------------------------
   Containers
   ------------------------------------------------------------------------- */

const AccordionGroup = AccordionGroupShell;

function Card({
  title,
  href,
  children,
}: {
  title?: string;
  icon?: string;
  href?: string;
  children?: ReactNode;
}) {
  const body = (
    <>
      {title && (
        <div className="mb-1.5 font-medium text-[var(--foreground)]">{title}</div>
      )}
      <div className="doc text-[0.9375rem] leading-relaxed [&>p:last-child]:mb-0 [&>p]:mb-2">
        {children}
      </div>
    </>
  );
  const cls =
    "block rounded-xl border border-[var(--line)] bg-[var(--surface)] p-4 transition-colors";
  return href ? (
    <Link
      href={href}
      data-plain
      className={`${cls} hover:border-[var(--accent-border)] hover:bg-[var(--raised)]`}
    >
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}

const CardGroup = ({ cols = 2, children }: { cols?: number; children: ReactNode }) => (
  <div
    className={`my-6 grid gap-3 ${cols >= 3 ? "sm:grid-cols-2 lg:grid-cols-3" : "sm:grid-cols-2"}`}
  >
    {children}
  </div>
);

/* Steps: a numbered rail. The numbers are real here, so the ordinal markers
   are carrying information rather than decorating. */
function Steps({ children }: { children: ReactNode }) {
  const items = Children.toArray(children).filter(isValidElement);
  return (
    <div className="my-6 flex flex-col gap-6">
      {items.map((child, i) => {
        const title = (child as ReactElement<{ title?: string }>).props?.title;
        return (
          <div key={i} className="flex gap-4">
            <div className="flex flex-col items-center">
              <span
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full
                           border border-[var(--line-strong)] bg-[var(--surface)]
                           font-mono text-[0.75rem] tabular-nums text-[var(--gold)]"
              >
                {i + 1}
              </span>
              {i < items.length - 1 && (
                <span className="mt-1 w-px flex-1 bg-[var(--line)]" aria-hidden="true" />
              )}
            </div>
            <div className="min-w-0 flex-1 pb-1">
              {title && (
                <div className="mb-1.5 pt-0.5 font-medium text-[var(--foreground)]">
                  {title}
                </div>
              )}
              <div className="doc text-[0.9375rem] [&>p:last-child]:mb-0 [&>p]:mb-3">
                {child}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** Rendered by Steps, which owns the numbering and the title. */
const Step = ({ children }: { title?: string; children: ReactNode }) => <>{children}</>;

/** Tabs is a server component that hands its children's titles to the client. */
function Tabs({ children }: { children: ReactNode }) {
  const tabs: TabChild[] = Children.toArray(children)
    .filter(isValidElement)
    .map((c) => {
      const p = (c as ReactElement<{ title?: string; children?: ReactNode }>).props;
      return { title: p.title ?? "", content: p.children };
    });
  return <TabsClient tabs={tabs} />;
}
const Tab = ({ children }: { title?: string; children: ReactNode }) => <>{children}</>;

const CodeGroup = ({ children }: { children: ReactNode }) => (
  <div className="my-6">{children}</div>
);

/* -------------------------------------------------------------------------
   Base HTML
   ------------------------------------------------------------------------- */

/** Headings get ids from the same slugify the TOC uses, and link to themselves. */
function heading(Tag: "h2" | "h3") {
  const H = ({ children }: { children?: ReactNode }) => {
    const id = slugify(textOf(children));
    return (
      <Tag id={id} className="group scroll-mt-24">
        <a href={`#${id}`} data-plain>
          {children}
          <span
            className="ml-2 align-middle text-[var(--faint)] opacity-0 transition-opacity
                       group-hover:opacity-100"
            aria-hidden="true"
          >
            #
          </span>
        </a>
      </Tag>
    );
  };
  H.displayName = Tag;
  return H;
}

/** Tables scroll inside their own container so the page never scrolls sideways. */
const table = ({ children }: { children?: ReactNode }) => (
  <div className="table-wrap">
    <table>{children}</table>
  </div>
);

const a = ({ href = "", children }: { href?: string; children?: ReactNode }) => {
  const external = /^https?:/.test(href);
  return external ? (
    <a href={href} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  ) : (
    <Link href={href}>{children}</Link>
  );
};

export const mdxComponents = {
  Note,
  Info: Note,
  Warning,
  Tip,
  Check: Tip,
  ResponseField,
  ParamField,
  Accordion,
  AccordionGroup,
  Card,
  CardGroup,
  Steps,
  Step,
  Tabs,
  Tab,
  CodeGroup,
  Frame: ({ children }: { children: ReactNode }) => <div className="my-6">{children}</div>,
  HornCatalog,
  h2: heading("h2"),
  h3: heading("h3"),
  table,
  a,
};

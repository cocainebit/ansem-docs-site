/**
 * Heading id, shared by the renderer and the table of contents.
 *
 * Both sides MUST use this one function: a TOC that slugifies differently
 * from the headings produces links that silently go nowhere, and nothing in a
 * build catches it.
 */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[`*_~]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

/** Turns a React children prop back into the plain text of a heading. */
export function textOf(node: unknown): string {
  if (node == null || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textOf).join("");
  if (typeof node === "object" && "props" in (node as Record<string, unknown>)) {
    const props = (node as { props?: { children?: unknown } }).props;
    return textOf(props?.children);
  }
  return "";
}

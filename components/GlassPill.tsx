import type { ReactNode } from "react";

/**
 * The blog's "liquid glass" control, rebuilt for a light ground.
 *
 * The dark original stacked a blurred backdrop, a flat tint, and a bright
 * white inner edge along the top-left. That last layer is what sold the
 * effect there and is worthless here: a white highlight on a white surface
 * is invisible. On marble the same read comes from the opposite direction, so
 * the card sits ABOVE the page (lighter than the ground, with a soft drop
 * shadow) and the hairline ring does the edge definition the shine used to.
 */
export function GlassPill({
  children,
  className = "",
  radius = "0.75rem",
}: {
  children: ReactNode;
  className?: string;
  radius?: string;
}) {
  return (
    <div className={`relative ${className}`} style={{ borderRadius: radius }}>
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden"
        style={{
          borderRadius: "inherit",
          boxShadow:
            "0 1px 2px rgb(23 32 26 / 0.06), 0 2px 8px rgb(23 32 26 / 0.05)",
        }}
      >
        <div
          className="absolute inset-0"
          style={{
            backdropFilter: "blur(6px) saturate(140%)",
            WebkitBackdropFilter: "blur(6px) saturate(140%)",
            borderRadius: "inherit",
          }}
        />
        <div
          className="absolute inset-0"
          style={{ background: "var(--surface)", borderRadius: "inherit" }}
        />
        <div
          className="absolute inset-0"
          style={{
            boxShadow: "inset 0 0 0 1px var(--line)",
            borderRadius: "inherit",
          }}
        />
      </div>
      <div className="relative flex h-full w-full items-center">{children}</div>
    </div>
  );
}

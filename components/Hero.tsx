import Image from "next/image";

/**
 * The masthead on the overview page: one still, framed the way the rest of
 * the site frames cards. Only the overview carries it; a masthead that
 * repeated on all 118 pages would stop being a masthead.
 */
export function Hero({
  src,
  alt,
  caption,
}: {
  src: string;
  alt: string;
  caption?: string;
}) {
  return (
    <figure className="mb-10">
      <div
        className="overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--raised)]
                   shadow-[0_1px_2px_rgb(23_32_26_/_0.06),0_8px_24px_rgb(23_32_26_/_0.07)]"
      >
        <Image
          src={src}
          alt={alt}
          width={2000}
          height={1125}
          priority
          sizes="(min-width: 1024px) 46rem, 100vw"
          className="block h-auto w-full"
        />
      </div>
      {caption && (
        <figcaption className="mt-2.5 text-[0.8125rem] text-[var(--faint)]">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}

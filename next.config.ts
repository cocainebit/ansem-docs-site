import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /*
   * The dev-tools badge defaults to bottom-left, which is now where the
   * sidebar's social link lives. Moved rather than disabled: the overlay is
   * still worth having, it just cannot sit on top of a link.
   */
  devIndicators: { position: "bottom-right" },
};

export default nextConfig;

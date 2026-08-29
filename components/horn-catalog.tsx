/**
 * Horns catalog grid for the docs.
 *
 * Every Horn is a v4-style hook contract on the graduation AMM. Data mirrors the
 * launchpad's lib/horns-catalog.ts (name / tagline / category / blurb); the art
 * is the same transparent PNG set served from /horns/art/<slug>.png. Grouped by
 * category so the reader sees the shape of the set at a glance.
 */

type Horn = {
  slug: string;
  name: string;
  tagline: string;
  blurb: string;
};

type Group = { category: string; horns: Horn[] };

const GROUPS: Group[] = [
  {
    category: "Reward layer",
    horns: [
      {
        slug: "vault",
        name: "Horn Vault",
        tagline: "Stake ANSEM or CHANSE, earn every pool's skim",
        blurb:
          "The reward keystone. A MasterChef-style staking contract with two global sinks (ANSEM and CHANSE); every graduated pool's skimmed fee flows in and stakers accrue a per-share cut each block.",
      },
      {
        slug: "feeshare",
        name: "Fee-Share",
        tagline: "Routes each swap's skim into the Vault's two sinks",
        blurb:
          "The plumbing between the AMM and the Vault. Splits the after-swap skim into the ANSEM and CHANSE sinks by a set ratio, riding as a reply-on-error message so a broken Vault can never revert a trade.",
      },
      {
        slug: "gauge",
        name: "Gauge",
        tagline: "Anti-JIT vesting gate in front of the Vault",
        blurb:
          "Buffers incoming skim into short vesting buckets; a permissionless settle() drains only matured buckets, bounding what a just-in-time staker can capture in a single stake-settle-unstake.",
      },
      {
        slug: "rehypo",
        name: "Rehypothecation",
        tagline: "Banks the skim, optionally deploys idle reserves",
        blurb:
          "A treasury Horn: banks the skim and can deploy idle reserves into a pluggable external yield sink while keeping a minimum reserve floor. Ships with no sink wired, so it is a safe passive fee bank by default.",
      },
    ],
  },
  {
    category: "Fee strategy",
    horns: [
      {
        slug: "dynfee",
        name: "Dynamic Fee",
        tagline: "Adjusts the swap fee to conditions",
        blurb:
          "Overrides the pool fee per swap based on trade conditions rather than a flat rate, always clamped to a hard maximum so a misconfiguration can never brick trading.",
      },
      {
        slug: "decay",
        name: "Fee Decay",
        tagline: "Launch fee starts high and decays down",
        blurb:
          "Opens a pool at an elevated fee right after graduation and decays it toward the base rate over a set window. Snipers who rush the first blocks pay the most; everyone who follows pays normal.",
      },
      {
        slug: "auction",
        name: "Fee Auction (am-AMM)",
        tagline: "Managers bid to own the pool's fee and collect its skim",
        blurb:
          "An am-AMM fee seat: managers bid (highest deposit wins) to own the fee, paying rent that decays per second. Recaptures MEV that would otherwise leak to searchers and routes it back on-chain.",
      },
      {
        slug: "schedule",
        name: "Dutch Fee Schedule",
        tagline: "Delta-priced ramp over a fixed launch window",
        blurb:
          "Prices swaps against a scheduled curve that ramps over a fixed window after launch, then hands control back to the pool. Bounded by a tolerance band and a per-swap fill cap.",
      },
      {
        slug: "witness",
        name: "Same-Block Witness",
        tagline: "Surcharges same-block follow-on swaps",
        blurb:
          "Witnesses prior activity within the same block and surcharges same-block follow-on trades (the sandwich shape), making the sandwich uneconomic and feeding the surcharge back to holders.",
      },
    ],
  },
  {
    category: "Liquidity & pricing",
    horns: [
      {
        slug: "curve",
        name: "StableSwap Curve",
        tagline: "Re-prices swaps on a StableSwap invariant",
        blurb:
          "Overrides constant-product with a Newton-solved StableSwap invariant for pegged or correlated pairs: deep, near-flat liquidity around the peg that steepens as reserves skew.",
      },
      {
        slug: "ldf",
        name: "Liquidity Distribution",
        tagline: "Bunni-style shaped liquidity via delta-pricing",
        blurb:
          "Emulates a Bunni-v2 liquidity distribution function on a positionless AMM, concentrating depth around a target price and stepping aside once price drifts outside a tolerance band.",
      },
      {
        slug: "arb",
        name: "Oracle Arb",
        tagline: "Hands traders a capped improvement toward the oracle",
        blurb:
          "References the ANSEM oracle: when the oracle beats the pool's marginal price, returns a capped Delta handing over the improvement. Every subsidy draws from a funded budget, so give-away is bounded.",
      },
      {
        slug: "twamm",
        name: "TWAMM",
        tagline: "Large orders executed as time-sliced fills",
        blurb:
          "A time-weighted AMM: park a large order and have it executed as time-proportional slices via a permissionless advance(), spreading a whale order across time to cut price impact.",
      },
      {
        slug: "limit",
        name: "Limit Order Book",
        tagline: "On-chain resting orders, filled before the AMM",
        blurb:
          "A price-ordered on-chain order book. A swap routes through the book first (taking better-priced maker liquidity) then the AMM for the remainder, with a hard-capped matching walk.",
      },
      {
        slug: "floor",
        name: "Price Floor",
        tagline: "A funded buyback wall under the price",
        blurb:
          "A capital-backed price floor: deposited funds stand as a buyback wall at or below a set price, absorbing sells so holders have a funded settlement floor rather than a promise.",
      },
    ],
  },
  {
    category: "Composition",
    horns: [
      {
        slug: "composite",
        name: "Composite Router",
        tagline: "Attach many Horns to one pool",
        blurb:
          "A router that runs several Horns on one pool, combining their before_swap decisions under strict rules (any Reject wins, at most one Delta, conflicting fee overrides rejected) then fanning after_swap out to each child.",
      },
    ],
  },
];

function HornCard({ horn }: { horn: Horn }) {
  return (
    <div className="flex flex-col rounded-xl border border-[var(--line)] bg-[var(--surface)] p-4">
      <div className="mb-2.5 flex items-center gap-3">
        <img
          src={`/horns/art/${horn.slug}.png`}
          alt={`${horn.name} horn`}
          width={44}
          height={44}
          className="h-11 w-11 shrink-0 object-contain"
        />
        <div className="min-w-0">
          <div className="font-medium leading-tight text-[var(--foreground)]">
            {horn.name}
          </div>
          <div className="mt-0.5 text-[0.8125rem] leading-snug text-[var(--accent)]">
            {horn.tagline}
          </div>
        </div>
      </div>
      <p className="m-0 text-[0.875rem] leading-relaxed text-[var(--faint)]">
        {horn.blurb}
      </p>
    </div>
  );
}

export function HornCatalog() {
  return (
    <div className="my-8 flex flex-col gap-8">
      {GROUPS.map((g) => (
        <section key={g.category}>
          <h3
            className="mb-3 text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-[var(--faint)]"
          >
            {g.category}
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {g.horns.map((h) => (
              <HornCard key={h.slug} horn={h} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

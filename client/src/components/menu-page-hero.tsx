import logoImg from "@assets/Veteran_Care_-_Shadow_(TM)_-_PNG_1775367756504.png";

type Props = {
  eyebrow?: string;
  /** Either a single title string OR a 2-line tuple to break across lines */
  title: string | [string, string];
  /** Highlight (gold accent) the second line; defaults to false */
  accentSecondLine?: boolean;
  subtitle?: string;
  detail?: string;
  testIdPrefix?: string;
};

/**
 * Universal menu-page header.
 *
 *   1) WHITE section with the premium dog-tag logo.
 *   2) GREEN hero with white title, subtitle, and optional detail line.
 *
 * Use this on every page reachable from the main Menu so they all share
 * the exact same opening rhythm.
 */
export default function MenuPageHero({
  eyebrow,
  title,
  accentSecondLine = false,
  subtitle,
  detail,
  testIdPrefix = "page",
}: Props) {
  const lines = Array.isArray(title) ? title : [title];

  return (
    <>
      {/* WHITE logo header — tightened spacing 2026-04-23 to feel premium
          and let the green hero start higher. Logo enlarged for brand impact. */}
      <section className="bg-white">
        <div className="container mx-auto px-5 pt-5 pb-3 sm:pt-7 sm:pb-4 max-w-5xl text-center">
          <img
            src={logoImg}
            alt="Veteran Care"
            className="h-56 sm:h-72 w-auto object-contain mx-auto drop-shadow-lg"
            data-testid={`img-${testIdPrefix}-hero-logo`}
          />
        </div>
      </section>

      {/* GREEN hero */}
      <section className="bg-primary text-primary-foreground">
        <div className="container mx-auto px-5 py-14 sm:py-20 max-w-4xl text-center">
          {eyebrow && (
            <p className="text-xs uppercase tracking-[0.2em] text-white/70 mb-3">
              {eyebrow}
            </p>
          )}
          <h1
            className="font-heading text-4xl sm:text-6xl font-extrabold tracking-tight leading-[1.05] uppercase text-white"
            data-testid={`text-${testIdPrefix}-title`}
          >
            {lines.map((line, idx) => (
              <span
                key={idx}
                className={`block ${
                  accentSecondLine && idx === 1 ? "text-accent" : ""
                }`}
              >
                {line}
              </span>
            ))}
          </h1>
          {subtitle && (
            <p className="text-lg sm:text-2xl text-white/95 leading-snug max-w-3xl mx-auto mt-6 font-medium">
              {subtitle}
            </p>
          )}
          {detail && (
            <p className="text-base sm:text-lg text-white/85 leading-relaxed max-w-3xl mx-auto mt-3">
              {detail}
            </p>
          )}
        </div>
      </section>
    </>
  );
}

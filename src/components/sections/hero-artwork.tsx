/**
 * Decorative engineering drawing: a device housing (software + embedded),
 * a wireframe part (prototyping), axes, dimension lines and construction
 * lines. Purely SVG, hidden from assistive tech.
 */
export function HeroArtwork({ className }: { className?: string }) {
  const ink = "var(--foreground)";
  const blue = "var(--primary)";
  const green = "var(--accent)";

  return (
    <svg
      viewBox="0 0 520 520"
      fill="none"
      aria-hidden
      focusable="false"
      className={className}
    >
      <defs>
        <pattern id="hero-grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M40 0H0V40" stroke="var(--border)" strokeWidth="1" />
        </pattern>
      </defs>

      {/* drawing sheet */}
      <rect x="8" y="8" width="504" height="504" fill="var(--surface)" fillOpacity="0.7" stroke="var(--border)" />
      <rect x="8" y="8" width="504" height="504" fill="url(#hero-grid)" />

      {/* axes */}
      <g stroke={ink} strokeOpacity="0.55" strokeWidth="1.25">
        <path d="M70 450H486M70 450V62" />
        <path d="M480 445l8 5-8 5M65 68l5-8 5 8" />
        <path d="M110 446v8M150 446v8M190 446v8M230 446v8M270 446v8M310 446v8M350 446v8M390 446v8M430 446v8" strokeOpacity="0.4" />
        <path d="M66 410h8M66 370h8M66 330h8M66 290h8M66 250h8M66 210h8M66 170h8M66 130h8M66 90h8" strokeOpacity="0.4" />
      </g>
      <g fill={ink} fillOpacity="0.6" fontFamily="var(--font-sans)" fontSize="16">
        <text x="492" y="474" textAnchor="end">X</text>
        <text x="48" y="64" textAnchor="end">Y</text>
        <text x="54" y="472" textAnchor="end">O</text>
      </g>

      {/* construction lines */}
      <g stroke={green} strokeOpacity="0.8" strokeWidth="1" strokeDasharray="4 6">
        <path d="M265 90V430" />
        <path d="M70 316H500" />
      </g>
      <circle cx="265" cy="316" r="150" stroke={blue} strokeOpacity="0.28" strokeDasharray="2 6" />

      {/* device housing */}
      <rect x="170" y="130" width="190" height="250" rx="14" fill="var(--surface)" stroke={blue} strokeWidth="2" />
      <rect x="186" y="148" width="158" height="110" rx="4" fill="var(--primary-soft)" stroke={blue} strokeWidth="1" />
      <g fill={blue} fillOpacity="0.55">
        <rect x="200" y="164" width="70" height="6" />
        <rect x="200" y="180" width="110" height="6" />
        <rect x="214" y="196" width="80" height="6" />
        <rect x="214" y="212" width="56" height="6" />
      </g>
      <rect x="200" y="228" width="44" height="6" fill={green} />
      <circle cx="265" cy="316" r="28" stroke={ink} strokeOpacity="0.5" fill="var(--surface)" />
      <circle cx="265" cy="316" r="11" fill={green} />
      <g fill={ink} fillOpacity="0.55">
        {[190, 216, 242, 268, 294, 320].map((x) => (
          <rect key={x} x={x} y="380" width="10" height="16" />
        ))}
      </g>

      {/* dimension lines */}
      <g stroke={ink} strokeOpacity="0.6" strokeWidth="1">
        <path d="M170 128V98M360 128V98M170 104H360" />
        <path d="M168 130H124M168 380H124M130 130V380" />
      </g>
      <g fill={ink} fillOpacity="0.6" fontFamily="var(--font-sans)" fontSize="16" textAnchor="middle">
        <rect x="251" y="94" width="28" height="20" fill="var(--surface)" stroke="none" />
        <text x="265" y="110">A</text>
        <rect x="116" y="246" width="28" height="20" fill="var(--surface)" stroke="none" />
        <text x="130" y="262">B</text>
      </g>

      {/* wireframe part (prototype) */}
      <g strokeLinejoin="round">
        <path d="M435 300l43 25-43 25-43-25z" fill="var(--surface)" stroke={blue} strokeWidth="1.5" />
        <path d="M392 325l43 25v50l-43-25z" fill="var(--primary-soft)" stroke={blue} strokeWidth="1.5" />
        <path d="M435 350l43-25v50l-43 25z" fill="var(--accent-soft)" stroke={blue} strokeWidth="1.5" />
        <path d="M435 350l-43 25M435 350l43 25" stroke={blue} strokeOpacity="0.5" strokeDasharray="3 4" />
        <ellipse cx="435" cy="325" rx="13" ry="7.5" stroke={blue} strokeWidth="1.25" />
        <circle cx="435" cy="325" r="3" fill={green} />
      </g>
      <path d="M360 316H392" stroke={ink} strokeOpacity="0.5" strokeDasharray="2 3" />
    </svg>
  );
}

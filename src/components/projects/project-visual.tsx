import type { ProjectVisualKind } from "@/content/projects";

const BLUE = "var(--primary)";
const INK = "var(--foreground)";
const GREEN = "var(--accent)";

function Arrow({ x, y }: { x: number; y: number }) {
  return <path d={`M${x - 8} ${y - 5}L${x} ${y}L${x - 8} ${y + 5}Z`} fill={BLUE} />;
}

/**
 * Technical-drawing placeholder covers, one motif per project type.
 * Text-free and abstract: no screenshots, metrics or product claims.
 */
export function ProjectVisual({ kind }: { kind: ProjectVisualKind }) {
  return (
    <svg
      viewBox="0 0 400 250"
      fill="none"
      aria-hidden
      focusable="false"
      className="h-full w-full"
      preserveAspectRatio="xMidYMid slice"
    >
      <rect width="400" height="250" fill="var(--surface-muted)" />
      <g stroke="var(--border)" strokeWidth="1">
        {Array.from({ length: 11 }, (_, i) => (
          <path key={`v${i}`} d={`M${i * 40} 0V250`} />
        ))}
        {Array.from({ length: 7 }, (_, i) => (
          <path key={`h${i}`} d={`M0 ${i * 40}H400`} />
        ))}
      </g>

      {kind === "software" && (
        <g strokeWidth="1.5" strokeLinejoin="round">
          {/* records */}
          <rect x="28" y="68" width="92" height="114" fill="var(--surface)" stroke={BLUE} />
          <g fill="var(--primary-soft)" stroke={BLUE} strokeWidth="1">
            <rect x="40" y="82" width="68" height="14" />
            <rect x="40" y="104" width="68" height="14" />
            <rect x="40" y="126" width="68" height="14" />
            <rect x="40" y="148" width="68" height="14" />
          </g>
          <rect x="40" y="82" width="14" height="14" fill={BLUE} />
          {/* flow */}
          <path d="M120 125H152" stroke={BLUE} />
          <Arrow x={160} y={125} />
          <path d="M200 85L240 125L200 165L160 125Z" fill="var(--surface)" stroke={BLUE} />
          <circle cx="200" cy="125" r="6" fill={GREEN} />
          <path d="M240 125H272" stroke={BLUE} />
          <Arrow x={280} y={125} />
          {/* overview grid */}
          <rect x="280" y="68" width="92" height="114" fill="var(--surface)" stroke={BLUE} />
          <path d="M280 106H372M280 144H372M326 68V182" stroke={BLUE} strokeWidth="1" />
          <rect x="327" y="107" width="44" height="37" fill={GREEN} fillOpacity="0.55" />
          {/* feedback loop */}
          <path d="M326 182V214H74V182" stroke={INK} strokeOpacity="0.5" strokeDasharray="4 5" />
        </g>
      )}

      {kind === "iot" && (
        <g strokeWidth="1.5" strokeLinejoin="round">
          {/* rain */}
          <g stroke={BLUE} strokeOpacity="0.6" strokeLinecap="round">
            <path d="M140 18l-6 16M170 12l-6 16M200 18l-6 16M230 12l-6 16M260 18l-6 16" />
          </g>
          {/* funnel */}
          <path d="M120 62H280L226 126H174Z" fill="var(--primary-soft)" stroke={BLUE} />
          {/* collector */}
          <rect x="174" y="126" width="52" height="96" fill="var(--surface)" stroke={BLUE} />
          <rect x="175" y="182" width="50" height="39" fill={GREEN} fillOpacity="0.45" />
          <path d="M190 150H210L200 166Z" stroke={INK} strokeOpacity="0.55" />
          <path d="M226 142h10M226 158h6M226 174h10M226 190h6M226 206h10" stroke={INK} strokeOpacity="0.6" strokeWidth="1" />
          <path d="M150 222H250" stroke={INK} strokeOpacity="0.6" />
          {/* dimension */}
          <path d="M108 126V222M102 126h12M102 222h12" stroke={INK} strokeOpacity="0.5" strokeWidth="1" />
          {/* wireless node */}
          <path d="M240 182H318V150" stroke={INK} strokeOpacity="0.5" strokeDasharray="3 4" strokeWidth="1" />
          <circle cx="240" cy="182" r="4" fill={GREEN} />
          <rect x="290" y="104" width="56" height="46" fill="var(--surface)" stroke={BLUE} />
          <circle cx="318" cy="127" r="6" stroke={BLUE} />
          <path d="M302 92a22 22 0 0 1 32 0M308 98a13 13 0 0 1 20 0" stroke={GREEN} strokeLinecap="round" />
        </g>
      )}

      {kind === "agri" && (
        <g strokeWidth="1.5" strokeLinejoin="round">
          {/* reservoir */}
          <rect x="34" y="140" width="96" height="82" fill="var(--surface)" stroke={BLUE} />
          <path d="M35 170H129V221H35Z" fill="var(--primary-soft)" />
          <path d="M35 170q12-6 24 0t24 0t24 0t22 0" stroke={BLUE} strokeWidth="1" />
          {/* sensor probe */}
          <path d="M60 112V196" stroke={INK} strokeOpacity="0.6" />
          <circle cx="60" cy="108" r="5" fill={GREEN} />
          {/* pump + supply */}
          <path d="M100 140V104H172" stroke={BLUE} strokeWidth="2" />
          <circle cx="100" cy="122" r="9" fill="var(--surface)" stroke={BLUE} />
          <path d="M96 122h8" stroke={GREEN} />
          {/* growing channel */}
          <rect x="172" y="86" width="204" height="36" fill="var(--surface)" stroke={BLUE} />
          {[204, 254, 304, 350].map((x) => (
            <g key={x}>
              <circle cx={x} cy="104" r="7" fill="var(--accent-soft)" stroke={GREEN} />
              <path d={`M${x} 97V78`} stroke="var(--accent-strong)" strokeWidth="1.5" />
              <path d={`M${x} 82q-12-3-14-15q12 1 14 15z`} fill={GREEN} fillOpacity="0.6" stroke="var(--accent-strong)" strokeWidth="1" />
            </g>
          ))}
          {/* return line */}
          <path d="M376 112H388V200H130" stroke={BLUE} strokeDasharray="4 5" />
          <Arrow x={138} y={200} />
        </g>
      )}

      {kind === "prototype" && (
        <g strokeWidth="1.5" strokeLinejoin="round">
          {/* construction */}
          <g stroke={GREEN} strokeOpacity="0.8" strokeDasharray="4 6" strokeWidth="1">
            <path d="M200 30V230M40 125H360" />
          </g>
          {/* part */}
          <path d="M200 52l66 38-66 38-66-38z" fill="var(--surface)" stroke={BLUE} />
          <path d="M134 90l66 38v78l-66-38z" fill="var(--primary-soft)" stroke={BLUE} />
          <path d="M200 128l66-38v78l-66 38z" fill="var(--accent-soft)" stroke={BLUE} />
          <path d="M200 128L134 166M200 128L266 166" stroke={BLUE} strokeOpacity="0.5" strokeDasharray="3 4" />
          <ellipse cx="200" cy="90" rx="22" ry="12.5" stroke={BLUE} />
          <circle cx="200" cy="90" r="4" fill={GREEN} />
          {/* dimension */}
          <path d="M296 90V168M290 90h12M290 168h12M268 90H296M268 168H296" stroke={INK} strokeOpacity="0.55" strokeWidth="1" />
          {/* layer lines */}
          <g stroke={INK} strokeOpacity="0.4" strokeWidth="1">
            <path d="M60 200h50M60 208h50M60 216h50" />
          </g>
          {/* axis triad */}
          <path d="M60 180V150M60 180L86 195M60 180L34 195" stroke={INK} strokeOpacity="0.6" strokeWidth="1" />
        </g>
      )}
    </svg>
  );
}

export default function HubHome() {
  const modules = [
    {
      title: "Public Website",
      category: "Frontend Core",
      path: "apps/website (src/)",
      status: "Active",
      statusColor: "emerald",
      desc: "Main public portfolio and services site on Next.js 16 App Router.",
      meta: "Static Export • Cloudflare Pages",
    },
    {
      title: "BizTrack",
      category: "Enterprise Module",
      path: "public/projects/biztrack",
      status: "Integrated",
      statusColor: "cyan",
      desc: "Business tracking dashboard and analytics tool suite.",
      meta: "Client App • In-Tree",
    },
    {
      title: "Hidroponik IoT & Log",
      category: "Research & IoT",
      path: "public/projects/hidroponik",
      status: "Active",
      statusColor: "emerald",
      desc: "Harvest guides, visual logs, and sensor tracking telemetry.",
      meta: "Static App • Plant Tracking",
    },
    {
      title: "Memburu Jejak",
      category: "Creative Media",
      path: "public/projects/memburu-jejak",
      status: "Active",
      statusColor: "indigo",
      desc: "Interactive comic reader, character bible, and narrative analytics.",
      meta: "Interactive Reader • Engine",
    },
    {
      title: "PixelPop",
      category: "Hardware Showcase",
      path: "public/projects/pixelpop",
      status: "Active",
      statusColor: "amber",
      desc: "Physical computing product renders and CAD assembly visualization.",
      meta: "Product CAD • Interactive",
    },
    {
      title: "Infrastructure & Ops",
      category: "Systems & Security",
      path: "infrastructure/",
      status: "Phase 1 Ready",
      statusColor: "cyan",
      desc: "Multi-app Cloudflare deployment configs, security headers, and domain routing.",
      meta: "Monorepo Routing • Cloudflare",
    },
  ];

  return (
    <div className="min-h-screen bg-[#090d16] text-[#e6edf3] flex flex-col">
      {/* Top Navigation */}
      <header className="border-b border-[#1f2c42] bg-[#101623]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center font-bold text-white shadow-lg shadow-cyan-500/20">
              K
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold tracking-wide text-white">KHAI SPACE HUB</span>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
                  Command Center
                </span>
              </div>
              <p className="text-xs text-[#8b9bb4]">Internal Monorepo Control Platform</p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono">
            <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#162032] border border-[#1f2c42]">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-emerald-400 font-medium">Build Isolated</span>
            </div>
            <div className="hidden sm:block text-[#8b9bb4]">
              Branch: <span className="text-white">feature/khai-space-hub</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {/* System Status Banner */}
        <div className="mb-8 p-5 rounded-xl border border-[#1f2c42] bg-gradient-to-r from-[#101623] via-[#162032] to-[#101623] shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-white flex items-center gap-2">
                Mission Control & Telemetry
                <span className="text-xs font-normal font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  Phase 1 Initialized
                </span>
              </h1>
              <p className="text-sm text-[#8b9bb4] mt-1 max-w-2xl">
                Independent execution environment running under <code className="text-cyan-400 font-mono text-xs">apps/hub/</code>.
                Production website files, dependencies, and main branch deployments are strictly isolated.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="px-4 py-2 rounded-lg bg-[#090d16] border border-[#1f2c42] text-xs font-mono">
                <span className="text-[#8b9bb4]">Host Target:</span> <span className="text-cyan-400">Cloudflare Pages</span>
              </div>
              <div className="px-4 py-2 rounded-lg bg-[#090d16] border border-[#1f2c42] text-xs font-mono">
                <span className="text-[#8b9bb4]">Target Output:</span> <span className="text-emerald-400">apps/hub/out</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modules Grid */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[#8b9bb4]">
            Monorepo Project Matrix
          </h2>
          <span className="text-xs font-mono text-[#8b9bb4]">
            Total Registered: {modules.length}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {modules.map((m) => (
            <div
              key={m.title}
              className="group p-5 rounded-xl border border-[#1f2c42] bg-[#101623] hover:border-cyan-500/50 transition-all duration-200 hover:shadow-lg hover:shadow-cyan-950/20 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="text-xs font-mono text-[#8b9bb4]">{m.category}</span>
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                      m.statusColor === "emerald"
                        ? "bg-emerald-950/60 text-emerald-300 border-emerald-800"
                        : m.statusColor === "cyan"
                        ? "bg-cyan-950/60 text-cyan-300 border-cyan-800"
                        : m.statusColor === "indigo"
                        ? "bg-indigo-950/60 text-indigo-300 border-indigo-800"
                        : "bg-amber-950/60 text-amber-300 border-amber-800"
                    }`}
                  >
                    {m.status}
                  </span>
                </div>
                <h3 className="text-base font-semibold text-white group-hover:text-cyan-300 transition-colors">
                  {m.title}
                </h3>
                <p className="text-xs text-[#8b9bb4] mt-1.5 leading-relaxed">
                  {m.desc}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-[#1f2c42]/60 flex items-center justify-between text-[11px] font-mono">
                <span className="text-cyan-400/80 truncate max-w-[170px]">{m.path}</span>
                <span className="text-[#8b9bb4]">{m.meta.split("•")[0]}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Isolation & Architectural Safeguards */}
        <div className="mt-10 p-6 rounded-xl border border-[#1f2c42] bg-[#101623]">
          <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
            <svg
              className="w-5 h-5 text-emerald-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
            Monorepo Isolation Safeguards Verified
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-3 rounded-lg bg-[#090d16] border border-[#1f2c42]">
              <div className="text-emerald-400 font-semibold mb-1">✓ Production Website Untouched</div>
              <p className="text-[#8b9bb4]">
                Root files under <code>src/</code>, <code>public/</code>, and root build configs continue operating independently.
              </p>
            </div>
            <div className="p-3 rounded-lg bg-[#090d16] border border-[#1f2c42]">
              <div className="text-emerald-400 font-semibold mb-1">✓ TypeScript & Lint Segregation</div>
              <p className="text-[#8b9bb4]">
                Root TypeScript excludes <code>apps/</code>, and root ESLint config isolates the Hub app from root type checks.
              </p>
            </div>
            <div className="p-3 rounded-lg bg-[#090d16] border border-[#1f2c42]">
              <div className="text-emerald-400 font-semibold mb-1">✓ Git Branch Confinement</div>
              <p className="text-[#8b9bb4]">
                All work confined to <code>feature/khai-space-hub</code>. Zero direct commits to <code>main</code>.
              </p>
            </div>
            <div className="p-3 rounded-lg bg-[#090d16] border border-[#1f2c42]">
              <div className="text-emerald-400 font-semibold mb-1">✓ Cloudflare Pages Isolation</div>
              <p className="text-[#8b9bb4]">
                Hub builds via <code>apps/hub</code> root directory, producing independent output without colliding with main site.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#1f2c42] bg-[#101623] py-4 text-center text-xs text-[#8b9bb4] font-mono">
        Khai Space Hub • Phase 1 Scaffold Verified • khairultajudin/khaispace
      </footer>
    </div>
  );
}

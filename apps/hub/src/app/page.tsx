export default function HubHome() {
  const projects = [
    {
      title: "Public Website",
      category: "Production Web",
      location: "Repository Root (src/)",
      status: "Production",
      statusStyle: "production",
      desc: "Official Khai Space public website built with Next.js 16 App Router and Tailwind CSS.",
      notes: "Deployed to Cloudflare Pages from repository root. Preserved intact.",
    },
    {
      title: "BizTrack",
      category: "Standalone Project",
      location: "public/projects/biztrack",
      status: "Standalone Demo",
      statusStyle: "neutral",
      desc: "Business tracking dashboard and assets. Maintained as a separate static project showcase.",
      notes: "Not integrated into Hub. Preserved as an independent asset bundle.",
    },
    {
      title: "Hidroponik Logbook",
      category: "Documentation & Research",
      location: "public/projects/hidroponik",
      status: "Active Records",
      statusStyle: "active",
      desc: "Comprehensive Pak Choy and Salad Framoc harvest logs, photography, and cultivation guides.",
      notes: "Static HTML logs and photo records in repository public assets.",
    },
    {
      title: "Memburu Jejak",
      category: "Creative Media",
      location: "public/projects/memburu-jejak",
      status: "Active Project",
      statusStyle: "active",
      desc: "Interactive comic reader, character dossier bible, and narrative analytics data.",
      notes: "Comprises standalone reader HTML, character sheets, and novel analysis data.",
    },
    {
      title: "PixelPop",
      category: "Hardware Showcase",
      location: "public/projects/pixelpop",
      status: "Active Showcase",
      statusStyle: "neutral",
      desc: "Physical computing product showcase featuring exploded CAD visuals and 3D enclosure renders.",
      notes: "Static showcase page hosted within public assets.",
    },
    {
      title: "Air Fryer Dashboard",
      category: "Prototype",
      location: "public/projects/air-fryer-dashboard",
      status: "Static Demo",
      statusStyle: "neutral",
      desc: "Single-page static dashboard prototype and control interface demonstration.",
      notes: "Self-contained HTML prototype in public assets.",
    },
  ];

  return (
    <div className="min-h-screen bg-[#FAF8F4] text-[#0C2340] flex flex-col antialiased">
      {/* Top Header */}
      <header className="border-b border-[#DCD7CC] bg-[#FAF8F4]/90 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-9 h-9 rounded-md bg-[#0C2340] flex items-center justify-center font-bold text-white text-sm shadow-sm">
              K
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <span className="font-semibold text-base tracking-tight text-[#0C2340]">
                  Khai Space Hub
                </span>
                <span className="text-[11px] font-medium px-2 py-0.5 rounded border border-[#DCD7CC] bg-[#E9E5DC] text-[#0C2340]">
                  Internal Directory
                </span>
              </div>
              <p className="text-xs text-[#536B85]">
                Centralized project catalog & workspace navigator
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded border border-[#DCD7CC] bg-[#E9E5DC] text-[#0C2340] font-mono text-[11px]">
              Branch: feature/khai-space-hub
            </span>
            <span className="inline-flex items-center px-2.5 py-1 rounded border border-[#A8CFC2] bg-[#EDF5F2] text-[#347A63] font-medium text-[11px]">
              Isolated Build
            </span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full space-y-8">
        {/* Workspace Notice Banner */}
        <div className="p-6 rounded-lg border border-[#DCD7CC] bg-[#FFFFFF] shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-xl font-bold tracking-tight text-[#0C2340]">
                Workspace Overview & Project Index
              </h1>
              <p className="text-sm text-[#536B85] max-w-2xl leading-relaxed">
                This internal hub operates as an independent application located under{" "}
                <code className="text-xs font-mono bg-[#E9E5DC] px-1.5 py-0.5 rounded text-[#0C2340]">
                  apps/hub/
                </code>
                . The public website remains stationed at the repository root, ensuring zero disruption
                to existing production deployments.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
              <div className="px-3 py-1.5 rounded border border-[#DCD7CC] bg-[#FAF8F4] text-[#536B85]">
                Target: <span className="text-[#0C2340] font-semibold">hub.khaispace.com</span>
              </div>
              <div className="px-3 py-1.5 rounded border border-[#DCD7CC] bg-[#FAF8F4] text-[#536B85]">
                Output: <span className="text-[#0C2340] font-semibold">apps/hub/out</span>
              </div>
            </div>
          </div>
        </div>

        {/* Section Header */}
        <div className="flex items-center justify-between pt-2">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#536B85]">
              Cataloged Repository Projects
            </h2>
            <p className="text-xs text-[#536B85] mt-0.5">
              Verified modules and assets currently residing in the repository tree.
            </p>
          </div>
          <span className="text-xs font-mono px-2 py-1 rounded border border-[#DCD7CC] bg-[#E9E5DC] text-[#0C2340]">
            {projects.length} Cataloged
          </span>
        </div>

        {/* Project Matrix Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {projects.map((p) => (
            <div
              key={p.title}
              className="p-5 rounded-lg border border-[#DCD7CC] bg-[#FFFFFF] shadow-sm flex flex-col justify-between hover:border-[#347A63] transition-colors duration-150"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2.5">
                  <span className="text-[11px] font-medium uppercase tracking-wider text-[#536B85]">
                    {p.category}
                  </span>
                  <span
                    className={`text-[11px] font-medium px-2 py-0.5 rounded border ${
                      p.statusStyle === "production"
                        ? "bg-[#EDF5F2] text-[#347A63] border-[#A8CFC2]"
                        : p.statusStyle === "active"
                        ? "bg-[#EDF5F2] text-[#347A63] border-[#A8CFC2]"
                        : "bg-[#FAF8F4] text-[#536B85] border-[#DCD7CC]"
                    }`}
                  >
                    {p.status}
                  </span>
                </div>

                <h3 className="text-base font-semibold text-[#0C2340] tracking-tight">
                  {p.title}
                </h3>

                <p className="text-xs text-[#536B85] mt-2 leading-relaxed">
                  {p.desc}
                </p>
              </div>

              <div className="mt-5 pt-3.5 border-t border-[#E9E5DC] space-y-1.5 text-[11px]">
                <div className="flex items-center justify-between text-[#536B85] font-mono">
                  <span>Location:</span>
                  <span className="text-[#0C2340] truncate max-w-[170px]">{p.location}</span>
                </div>
                <div className="text-[11px] text-[#536B85] leading-normal">
                  {p.notes}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Architectural Principles Card */}
        <div className="p-6 rounded-lg border border-[#DCD7CC] bg-[#E9E5DC]/50">
          <h2 className="text-sm font-bold uppercase tracking-wider text-[#0C2340] mb-3">
            Monorepo Governance & Separation of Concerns
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs text-[#536B85]">
            <div className="p-3.5 rounded bg-[#FFFFFF] border border-[#DCD7CC]">
              <div className="font-semibold text-[#0C2340] mb-1">Root Website Preserved</div>
              <p>
                Website files live in repository root. No directory moving or restructuring performed.
              </p>
            </div>
            <div className="p-3.5 rounded bg-[#FFFFFF] border border-[#DCD7CC]">
              <div className="font-semibold text-[#0C2340] mb-1">Isolated Hub Build</div>
              <p>
                Hub maintains its own <code className="font-mono text-[10px]">package.json</code> and tsconfig under <code className="font-mono text-[10px]">apps/hub/</code>.
              </p>
            </div>
            <div className="p-3.5 rounded bg-[#FFFFFF] border border-[#DCD7CC]">
              <div className="font-semibold text-[#0C2340] mb-1">Separate Deployments</div>
              <p>
                Website and Hub deploy as independent Cloudflare Pages targets from their respective roots.
              </p>
            </div>
            <div className="p-3.5 rounded bg-[#FFFFFF] border border-[#DCD7CC]">
              <div className="font-semibold text-[#0C2340] mb-1">Branch Discipline</div>
              <p>
                All development occurs on <code className="font-mono text-[10px]">feature/khai-space-hub</code>. Direct commits to main are blocked.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#DCD7CC] bg-[#FAF8F4] py-5 text-center text-xs text-[#536B85]">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Khai Space Hub &bull; Phase 1.1 Scaffold Verified</span>
          <span className="font-mono text-[11px] text-[#536B85]">khairultajudin/khaispace</span>
        </div>
      </footer>
    </div>
  );
}

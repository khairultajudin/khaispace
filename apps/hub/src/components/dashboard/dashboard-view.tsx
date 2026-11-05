"use client";

import React, { useState } from "react";
import { NavSection } from "../../types/dashboard";
import { Sidebar } from "../layout/sidebar";
import { Header } from "../layout/header";
import { WelcomeBanner } from "./welcome-banner";
import { SummaryMetrics } from "./summary-metrics";
import { ProjectCatalog } from "./project-catalog";
import { RecentActivity } from "./recent-activity";
import { UpcomingTasks } from "./upcoming-tasks";
import { ComingSoonView } from "./coming-soon-view";
import { ProjectsView } from "../projects/projects-view";
import { TasksView } from "../tasks/tasks-view";

const VALID_SECTIONS: NavSection[] = [
  "overview",
  "projects",
  "tasks",
  "finance",
  "subscriptions",
  "notes",
  "settings",
];

export function DashboardView() {
  const [currentSection, setCurrentSection] = useState<NavSection>(() => {
    if (typeof window !== "undefined") {
      const rawHash = window.location.hash.replace("#", "");
      if (VALID_SECTIONS.includes(rawHash as NavSection)) {
        return rawHash as NavSection;
      }
      if (rawHash.startsWith("project-")) {
        return "projects";
      }
      if (rawHash.startsWith("task-") || rawHash === "milestones") {
        return "tasks";
      }
    }
    return "overview";
  });

  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return window.location.hash === "#menu";
    }
    return false;
  });

  React.useEffect(() => {
    const handleHash = () => {
      const rawHash = window.location.hash.replace("#", "");
      if (VALID_SECTIONS.includes(rawHash as NavSection)) {
        setCurrentSection(rawHash as NavSection);
      } else if (rawHash.startsWith("project-")) {
        setCurrentSection("projects");
      } else if (rawHash.startsWith("task-") || rawHash === "milestones") {
        setCurrentSection("tasks");
      }
    };

    handleHash();
    window.addEventListener("hashchange", handleHash);
    return () => window.removeEventListener("hashchange", handleHash);
  }, []);

  return (
    <div className="min-h-screen bg-[#FAF8F4] text-[#0C2340] flex antialiased">
      {/* Sidebar Navigation */}
      <Sidebar
        currentSection={currentSection}
        onSelectSection={setCurrentSection}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <Header
          currentSection={currentSection}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
        />

        {/* Dynamic Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-8">
          {currentSection === "overview" ? (
            <>
              {/* Section 1: Welcome Header & Disclosure */}
              <WelcomeBanner />

              {/* Section 2: Summary Metrics Cards */}
              <SummaryMetrics />

              {/* Section 3: Project Catalog Overview */}
              <ProjectCatalog onNavigateToProjects={setCurrentSection} />

              {/* Section 4 & 5: Activity Feed & Upcoming Tasks */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <RecentActivity />
                <UpcomingTasks onNavigateToTasks={() => setCurrentSection("tasks")} />
              </div>
            </>
          ) : currentSection === "projects" ? (
            <ProjectsView />
          ) : currentSection === "tasks" ? (
            <TasksView />
          ) : (
            <ComingSoonView
              section={currentSection}
              onBackToOverview={() => setCurrentSection("overview")}
            />
          )}
        </main>

        {/* Footer */}
        <footer className="border-t border-[#DCD7CC] bg-[#FAF8F4] py-4 px-6 text-xs text-[#536B85] mt-auto">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
            <span>Khai Space Hub &bull; Personal Business &amp; Project Command Center</span>
            <span className="font-mono text-[11px] text-[#536B85]">
              apps/hub &bull; khairultajudin/khaispace
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
}

import { useState } from "react";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import AIAssistant from "../AIAssistant";

export default function DashboardLayout({ children }) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden relative">
      {/* Sidebar: passes state and toggle handler */}
      <Sidebar
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden w-full">
        {/* Navbar: has hamburger button for mobile view */}
        <Navbar onToggleMobileMenu={() => setMobileSidebarOpen((prev) => !prev)} />
        <main className="flex-1 overflow-y-auto p-3 sm:p-6">
          {children}
        </main>
      </div>

      {/* Voice AI Assistant widget */}
      <AIAssistant />
    </div>
  );
}

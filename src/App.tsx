import { useState, useEffect } from "react";
import { TopNav } from "./components/TopNav";
import { Sidebar } from "./components/Sidebar";
import { RightSidebar } from "./components/RightSidebar";
import { MainContent } from "./components/MainContent";
import { StreamersView } from "./components/StreamersView";
import { UserProfileView } from "./components/UserProfileView";

export default function App() {
  const [currentView, setCurrentView] = useState("MATCHES");

  useEffect(() => {
    const handleNavigate = (e: any) => {
      setCurrentView(e.detail);
    };
    window.addEventListener('navigate', handleNavigate);
    return () => window.removeEventListener('navigate', handleNavigate);
  }, []);

  return (
    <div className="flex flex-col h-screen bg-background text-foreground overflow-hidden">
      <TopNav />
      <div className="flex flex-1 overflow-hidden">
        {currentView !== "STREAMERS" && currentView !== "PROFILE" && <Sidebar />}
        {currentView === "STREAMERS" ? (
          <StreamersView />
        ) : currentView === "PROFILE" ? (
          <UserProfileView />
        ) : (
          <>
            <MainContent />
            <RightSidebar />
          </>
        )}
      </div>
    </div>
  );
}

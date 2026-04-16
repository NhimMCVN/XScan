import { useState, useEffect } from "react";
import { TopNav } from "./components/TopNav";
import { Sidebar } from "./components/Sidebar";
import { RightSidebar } from "./components/RightSidebar";
import { MainContent } from "./components/MainContent";
import { StreamersView } from "./components/StreamersView";
import { UserDashboardView } from "./components/UserDashboardView";
import { StreamerDashboardView } from "./components/StreamerDashboardView";
import { StreamerRegistrationView } from "./components/StreamerRegistrationView";
import { StreamerChallengesView } from "./components/StreamerChallengesView";
import { StreamerDonationsView } from "./components/StreamerDonationsView";
import { StreamerDonationLinksView } from "./components/StreamerDonationLinksView";
import { StreamerObsSettingsView } from "./components/StreamerObsSettingsView";
import { AuthView } from "./components/AuthView";

export default function App() {
  const [currentView, setCurrentView] = useState("MATCHES");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [role, setRole] = useState<"USER" | "STREAMER">("USER");

  useEffect(() => {
    const handleNavigate = (e: any) => {
      if (e.detail === 'LOGOUT') {
        setIsLoggedIn(false);
        setCurrentView("MATCHES");
        return;
      }
      setCurrentView(e.detail);
    };
    const handleToggleRole = () => {
      setRole(prev => prev === "USER" ? "STREAMER" : "USER");
    };
    window.addEventListener('navigate', handleNavigate);
    window.addEventListener('toggleRole', handleToggleRole);
    return () => {
      window.removeEventListener('navigate', handleNavigate);
      window.removeEventListener('toggleRole', handleToggleRole);
    };
  }, []);

  if (!isLoggedIn) {
    return <AuthView onLogin={() => setIsLoggedIn(true)} />;
  }

  return (
    <div className="flex flex-col h-screen bg-background text-foreground overflow-hidden">
      <TopNav />
      <div className="flex flex-1 overflow-hidden">
        {currentView !== "STREAMERS" && currentView !== "PROFILE" && currentView !== "BECOME_STREAMER" && currentView !== "STREAMER_CHALLENGES" && currentView !== "STREAMER_DONATIONS" && currentView !== "DONATION_LINKS" && currentView !== "OBS_SETTINGS" && <Sidebar />}
        {currentView === "STREAMERS" ? (
          <StreamersView />
        ) : currentView === "PROFILE" ? (
          role === "USER" ? <UserDashboardView /> : <StreamerDashboardView />
        ) : currentView === "BECOME_STREAMER" ? (
          <StreamerRegistrationView />
        ) : currentView === "STREAMER_CHALLENGES" ? (
          <StreamerChallengesView />
        ) : currentView === "STREAMER_DONATIONS" ? (
          <StreamerDonationsView />
        ) : currentView === "DONATION_LINKS" ? (
          <StreamerDonationLinksView />
        ) : currentView === "OBS_SETTINGS" ? (
          <StreamerObsSettingsView />
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

import { useState, useEffect } from "react";
import { TopNav } from "./components/TopNav";
import { Sidebar } from "./components/Sidebar";
import { RightSidebar } from "./components/RightSidebar";
import { MainContent } from "./components/MainContent";
import { StreamersView } from "./components/StreamersView";
import { UserProfileView } from "./components/UserProfileView";
import { StreamerRegistrationView } from "./components/StreamerRegistrationView";
import { StreamerChallengesView } from "./components/StreamerChallengesView";
import { StreamerDonationsView } from "./components/StreamerDonationsView";
import { AuthView } from "./components/AuthView";

export default function App() {
  const [currentView, setCurrentView] = useState("MATCHES");
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const handleNavigate = (e: any) => {
      if (e.detail === 'LOGOUT') {
        setIsLoggedIn(false);
        setCurrentView("MATCHES");
        return;
      }
      setCurrentView(e.detail);
    };
    window.addEventListener('navigate', handleNavigate);
    return () => window.removeEventListener('navigate', handleNavigate);
  }, []);

  if (!isLoggedIn) {
    return <AuthView onLogin={() => setIsLoggedIn(true)} />;
  }

  return (
    <div className="flex flex-col h-screen bg-background text-foreground overflow-hidden">
      <TopNav />
      <div className="flex flex-1 overflow-hidden">
        {currentView !== "STREAMERS" && currentView !== "PROFILE" && currentView !== "BECOME_STREAMER" && currentView !== "STREAMER_CHALLENGES" && currentView !== "STREAMER_DONATIONS" && <Sidebar />}
        {currentView === "STREAMERS" ? (
          <StreamersView />
        ) : currentView === "PROFILE" ? (
          <UserProfileView />
        ) : currentView === "BECOME_STREAMER" ? (
          <StreamerRegistrationView />
        ) : currentView === "STREAMER_CHALLENGES" ? (
          <StreamerChallengesView />
        ) : currentView === "STREAMER_DONATIONS" ? (
          <StreamerDonationsView />
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

import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { TopNav } from "./components/TopNav";
import { Sidebar } from "./components/Sidebar";
import { RightSidebar } from "./components/RightSidebar";
import { MainContent } from "./components/MainContent";
import { StreamersView } from "./components/StreamersView";
import { UserDashboardView } from "./components/UserDashboardView";
import { StreamerDashboardView } from "./components/StreamerDashboardView";
import { StreamerRegistrationView } from "./components/StreamerRegistrationView";
import { StreamerChallengesView } from "./components/StreamerChallengesView";
import { DonorChallengesView } from "./components/DonorChallengesView";
import { StreamerDonationsView } from "./components/StreamerDonationsView";
import { StreamerDonationLinksView } from "./components/StreamerDonationLinksView";
import { StreamerObsSettingsView } from "./components/StreamerObsSettingsView";
import { AuthView } from "./components/AuthView";
import { useAppDispatch, type RootState } from "./redux";
import { logout } from "./redux/slices/auth.slice";
import { isStreamerRole } from "./utils/userRole";
import {
  getInitialViewFromLocation,
  pathFromView,
  pathsEqual,
  viewFromPathname,
} from "./utils/appNavigation";

export default function App() {
  const dispatch = useAppDispatch();
  const isAuthenticated = useSelector((s: RootState) => s.auth.isAuthenticated);
  const userRole = useSelector((s: RootState) => s.auth.user?.role);
  const [currentView, setCurrentView] = useState(() =>
    typeof window !== "undefined" ? getInitialViewFromLocation() : "MATCHES",
  );

  useEffect(() => {
    const handleNavigate = (e: Event) => {
      const detail = (e as CustomEvent<string>).detail;
      if (detail === "LOGOUT") {
        dispatch(logout());
        setCurrentView("MATCHES");
        return;
      }
      setCurrentView(detail);
    };
    window.addEventListener("navigate", handleNavigate);
    return () => window.removeEventListener("navigate", handleNavigate);
  }, [dispatch]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const desired = pathFromView(currentView);
    if (pathsEqual(window.location.pathname, desired)) return;
    window.history.replaceState(
      null,
      "",
      `${desired}${window.location.search}`,
    );
  }, [currentView]);

  useEffect(() => {
    const onPopState = () => {
      setCurrentView(viewFromPathname(window.location.pathname));
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  if (!isAuthenticated) {
    return <AuthView />;
  }

  return (
    <div className="flex flex-col h-screen bg-background text-foreground overflow-hidden">
      <TopNav currentView={currentView} />
      <div className="flex flex-1 overflow-hidden">
        {currentView !== "STREAMERS" &&
          currentView !== "PROFILE" &&
          currentView !== "BECOME_STREAMER" &&
          currentView !== "STREAMER_CHALLENGES" &&
          currentView !== "STREAMER_DONATIONS" &&
          currentView !== "DONATION_LINKS" &&
          currentView !== "OBS_SETTINGS" && <Sidebar />}
        {currentView === "STREAMERS" ? (
          <StreamersView />
        ) : currentView === "PROFILE" ? (
          isStreamerRole(userRole) ? (
            <StreamerDashboardView />
          ) : (
            <UserDashboardView />
          )
        ) : currentView === "BECOME_STREAMER" ? (
          <StreamerRegistrationView />
        ) : currentView === "STREAMER_CHALLENGES" ? (
          userRole && !isStreamerRole(userRole) ? (
            <DonorChallengesView />
          ) : (
            <StreamerChallengesView />
          )
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

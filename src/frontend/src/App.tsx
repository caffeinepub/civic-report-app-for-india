import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import React, { useEffect } from "react";
import { AdminDashboard } from "./components/AdminDashboard";
import { Dashboard } from "./components/Dashboard";
import { Footer } from "./components/Footer";
import { Header } from "./components/Header";
import { KnowYourNeta } from "./components/KnowYourNeta";
import { MapView } from "./components/MapView";
import { NgoNpoDashboard } from "./components/NgoNpoDashboard";
import { NgoNpoDirectory } from "./components/NgoNpoDirectory";
import { NgoNpoRegistration } from "./components/NgoNpoRegistration";
import { RecentReports } from "./components/RecentReports";
import { ReportForm } from "./components/ReportForm";
import { ReportPage } from "./components/ReportPage";
import { ReportVerification } from "./components/ReportVerification";
import { Roadmap } from "./components/Roadmap";
import { VolunteerDashboard } from "./components/VolunteerDashboard";
import { VolunteerDirectory } from "./components/VolunteerDirectory";
import { VolunteerRegistration } from "./components/VolunteerRegistration";
import { LanguageProvider } from "./contexts/LanguageContext";
import { LocationRefreshProvider } from "./contexts/LocationRefreshContext";
import { useActor } from "./hooks/useActor";
import { useTrackUniqueVisitor } from "./hooks/useQueries";

function AppLayout() {
  const { mutate: trackVisitor } = useTrackUniqueVisitor();
  const { actor, isFetching } = useActor();

  useEffect(() => {
    // Track unique visitor on app mount once actor is ready
    if (actor && !isFetching) {
      trackVisitor();
    }
  }, [actor, isFetching, trackVisitor]);

  return (
    <LanguageProvider>
      <LocationRefreshProvider>
        <div className="min-h-screen bg-gray-50 flex flex-col">
          <Header />
          <main className="container mx-auto px-4 py-8 max-w-4xl pt-20 grow">
            <Outlet />
          </main>
          <Footer />
        </div>
      </LocationRefreshProvider>
    </LanguageProvider>
  );
}

const rootRoute = createRootRoute({
  component: AppLayout,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: () => (
    <div className="space-y-8">
      <ReportForm />
      <RecentReports />
    </div>
  ),
});

const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/dashboard",
  component: Dashboard,
});

const mapRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/map",
  component: MapView,
});

const roadmapRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/roadmap",
  component: Roadmap,
});

const adminRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin",
  component: AdminDashboard,
});

const volunteerRegistrationRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/volunteer/register",
  component: VolunteerRegistration,
});

const volunteerDashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/volunteer/dashboard",
  component: VolunteerDashboard,
});

const volunteerDirectoryRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/volunteer/directory",
  component: VolunteerDirectory,
});

const ngoNpoRegistrationRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/ngo-npo/register",
  component: NgoNpoRegistration,
});

const ngoNpoDashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/ngo-npo/dashboard",
  component: NgoNpoDashboard,
});

const ngoNpoDirectoryRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/ngo-npo/directory",
  component: NgoNpoDirectory,
});

const knowYourNetaRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/know-your-neta",
  component: KnowYourNeta,
});

const verifyRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/verify/$reportId",
  component: ReportVerification,
});

const reportRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/report/$reportId",
  component: ReportPage,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  dashboardRoute,
  mapRoute,
  roadmapRoute,
  adminRoute,
  volunteerRegistrationRoute,
  volunteerDashboardRoute,
  volunteerDirectoryRoute,
  ngoNpoRegistrationRoute,
  ngoNpoDashboardRoute,
  ngoNpoDirectoryRoute,
  knowYourNetaRoute,
  verifyRoute,
  reportRoute,
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

function App() {
  return <RouterProvider router={router} />;
}

export default App;

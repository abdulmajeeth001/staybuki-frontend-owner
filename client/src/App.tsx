import { Switch, Route } from "wouter";
import React, { Suspense, lazy } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { TenantRouteGuard } from "@/components/TenantRouteGuard";
import { AuthGate } from "@/components/AuthGate";
import { Loader2 } from "lucide-react";

// --- LAZY LOADING PAGES (Production Standard) ---
// This splits your code into smaller chunks for faster initial load.
const Home = lazy(() => import("@/pages/auth/Home"));
const Login = lazy(() => import("@/pages/auth/Login"));
const Register = lazy(() => import("@/pages/auth/Register"));
const Dashboard = lazy(() => import("@/pages/owner/Dashboard"));
const SubscriptionPlan = lazy(() => import("@/pages/auth/SubscriptionPlan"));
const TenantsList = lazy(() => import("@/pages/owner/TenantsList"));
const AddTenant = lazy(() => import("@/pages/owner/AddTenant"));
const EditTenant = lazy(() => import("@/pages/owner/EditTenant"));
const ViewTenant = lazy(() => import("@/pages/owner/ViewTenant"));
const Payments = lazy(() => import("@/pages/owner/Payments"));
const Notifications = lazy(() => import("@/pages/owner/Notifications"));
const Rooms = lazy(() => import("@/pages/owner/Rooms"));
const AddRoom = lazy(() => import("@/pages/owner/AddRoom"));
const EditRoom = lazy(() => import("@/pages/owner/EditRoom"));
const Complaints = lazy(() => import("@/pages/owner/Complaints"));
const Maintenance = lazy(() => import("@/pages/owner/Maintenance"));
const Reports = lazy(() => import("@/pages/owner/Reports"));
const Settings = lazy(() => import("@/pages/owner/Settings"));
const ManageDevices = lazy(() => import("@/pages/owner/ManageDevices"));
const TenantResetPassword = lazy(() => import("@/pages/tenant/TenantResetPassword"));
const TenantDashboard = lazy(() => import("@/pages/tenant/TenantDashboard"));
const TenantProfile = lazy(() => import("@/pages/tenant/TenantProfile"));
const TenantRoomDetails = lazy(() => import("@/pages/tenant/TenantRoomDetails"));
const TenantPayments = lazy(() => import("@/pages/tenant/TenantPayments"));
const TenantComplaints = lazy(() => import("@/pages/tenant/TenantComplaints"));
const TenantPgDetails = lazy(() => import("@/pages/tenant/TenantPgDetails"));
const TenantPgFacilities = lazy(() => import("@/pages/tenant/TenantPgFacilities"));
const TenantVisitRequestsPage = lazy(() => import("@/pages/tenant/TenantVisitRequestsPage"));
const TenantAnnouncements = lazy(() => import("@/pages/tenant/TenantAnnouncements"));
const ForgotPassword = lazy(() => import("@/pages/auth/ForgotPassword"));
const PGManagement = lazy(() => import("@/pages/owner/PGManagement"));
const AdminDashboard = lazy(() => import("@/pages/admin/AdminDashboard"));
const AdminPGManagement = lazy(() => import("@/pages/admin/AdminPGManagement"));
const AdminSubscriptions = lazy(() => import("@/pages/admin/AdminSubscriptions"));
const AdminComplaints = lazy(() => import("@/pages/admin/AdminComplaints"));
const AdminAmenities = lazy(() => import("@/pages/admin/AdminAmenities"));
const AdminOwnerAnalytics = lazy(() => import("@/pages/admin/AdminOwnerAnalytics"));
const PGSearchPage = lazy(() => import("@/pages/owner/PGSearchPage"));
const PGDetailsPage = lazy(() => import("@/pages/owner/PGDetailsPage"));
const OwnerVisitRequestsPage = lazy(() => import("@/pages/owner/OwnerVisitRequestsPage"));
const OwnerOnboardingRequestsPage = lazy(() => import("@/pages/owner/OwnerOnboardingRequestsPage"));
const ElectricityHistory = lazy(() => import("@/pages/owner/ElectricityHistory"));
const FoodMenu = lazy(() => import("@/pages/owner/FoodMenu"));
const Announcements = lazy(() => import("@/pages/owner/Announcements"));
const NotFound = lazy(() => import("@/pages/owner/not-found"));

// Loading fallback for lazy components
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen bg-background">
    <Loader2 className="w-10 h-10 animate-spin text-primary" />
  </div>
);

/**
 * PROTECTED ROUTER
 * Only contains routes that require a valid login session via AuthGate.
 */
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Suspense fallback={<PageLoader />}>
          <Switch>
            {/* PUBLIC ROUTES */}
            <Route path="/" component={Home} />
            <Route path="/login" component={Login} />
            <Route path="/register" component={Register} />
            <Route path="/subscription" component={SubscriptionPlan} />
            <Route path="/forgot-password" component={ForgotPassword} />

            {/* OWNER ROUTES */}
            <Route path="/dashboard">
              <AuthGate><Dashboard /></AuthGate>
            </Route>
            <Route path="/tenants/add">
              <AuthGate><AddTenant /></AuthGate>
            </Route>
            <Route path="/tenants/view/:id">
              <AuthGate><ViewTenant /></AuthGate>
            </Route>
            <Route path="/tenants/edit/:id">
              <AuthGate><EditTenant /></AuthGate>
            </Route>
            <Route path="/tenants">
              <AuthGate><TenantsList /></AuthGate>
            </Route>
            <Route path="/payments">
              <AuthGate><Payments /></AuthGate>
            </Route>
            <Route path="/electricity-history">
              <AuthGate><ElectricityHistory /></AuthGate>
            </Route>
            <Route path="/notifications">
              <AuthGate><Notifications /></AuthGate>
            </Route>
            <Route path="/rooms/add">
              <AuthGate><AddRoom /></AuthGate>
            </Route>
            <Route path="/rooms/edit/:id">
              <AuthGate><EditRoom /></AuthGate>
            </Route>
            <Route path="/rooms">
              <AuthGate><Rooms /></AuthGate>
            </Route>
            <Route path="/complaints">
              <AuthGate><Complaints /></AuthGate>
            </Route>
            <Route path="/maintenance">
              <AuthGate><Maintenance /></AuthGate>
            </Route>
            <Route path="/reports">
              <AuthGate><Reports /></AuthGate>
            </Route>
            <Route path="/settings">
              <AuthGate><Settings /></AuthGate>
            </Route>
            <Route path="/manage-devices">
              <AuthGate><ManageDevices /></AuthGate>
            </Route>
            <Route path="/pg-management">
              <AuthGate><PGManagement /></AuthGate>
            </Route>
            <Route path="/owner-visit-requests">
              <AuthGate><OwnerVisitRequestsPage /></AuthGate>
            </Route>
            <Route path="/owner-onboarding-requests">
              <AuthGate><OwnerOnboardingRequestsPage /></AuthGate>
            </Route>
            <Route path="/announcements">
              <AuthGate><Announcements /></AuthGate>
            </Route>
            <Route path="/food-menu">
              <AuthGate><FoodMenu /></AuthGate>
            </Route>

            {/* ADMIN ROUTES */}
            <Route path="/admin-dashboard">
              <AuthGate><AdminDashboard /></AuthGate>
            </Route>
            <Route path="/admin-pgs">
              <AuthGate><AdminPGManagement /></AuthGate>
            </Route>
            <Route path="/admin-subscriptions">
              <AuthGate><AdminSubscriptions /></AuthGate>
            </Route>
            <Route path="/admin-complaints">
              <AuthGate><AdminComplaints /></AuthGate>
            </Route>
            <Route path="/admin-amenities">
              <AuthGate><AdminAmenities /></AuthGate>
            </Route>
            <Route path="/admin-owner-analytics">
              <AuthGate><AdminOwnerAnalytics /></AuthGate>
            </Route>

            {/* TENANT ROUTES */}
            <Route path="/tenant-reset-password">
              <AuthGate><TenantResetPassword /></AuthGate>
            </Route>
            <Route path="/tenant-dashboard">
              <AuthGate><TenantRouteGuard requiresOnboarding={true}><TenantDashboard /></TenantRouteGuard></AuthGate>
            </Route>
            <Route path="/tenant-profile">
              <AuthGate><TenantRouteGuard requiresOnboarding={true}><TenantProfile /></TenantRouteGuard></AuthGate>
            </Route>
            <Route path="/tenant-room">
              <AuthGate><TenantRouteGuard requiresOnboarding={true}><TenantRoomDetails /></TenantRouteGuard></AuthGate>
            </Route>
            <Route path="/tenant-payments">
              <AuthGate><TenantRouteGuard requiresOnboarding={true}><TenantPayments /></TenantRouteGuard></AuthGate>
            </Route>
            <Route path="/tenant-complaints">
              <AuthGate><TenantRouteGuard requiresOnboarding={true}><TenantComplaints /></TenantRouteGuard></AuthGate>
            </Route>
            <Route path="/tenant-pg">
              <AuthGate><TenantRouteGuard requiresOnboarding={true}><TenantPgDetails /></TenantRouteGuard></AuthGate>
            </Route>
            <Route path="/tenant-facilities">
              <AuthGate><TenantRouteGuard requiresOnboarding={true}><TenantPgFacilities /></TenantRouteGuard></AuthGate>
            </Route>
            <Route path="/tenant-announcements">
              <AuthGate><TenantRouteGuard requiresOnboarding={true}><TenantAnnouncements /></TenantRouteGuard></AuthGate>
            </Route>
            <Route path="/tenant-search-pgs">
              <AuthGate><TenantRouteGuard requiresOnboarding={false}><PGSearchPage /></TenantRouteGuard></AuthGate>
            </Route>
            <Route path="/pg/:id">
              <AuthGate><TenantRouteGuard requiresOnboarding={false}><PGDetailsPage /></TenantRouteGuard></AuthGate>
            </Route>
            <Route path="/tenant-visit-requests">
              <AuthGate><TenantRouteGuard requiresOnboarding={false}><TenantVisitRequestsPage /></TenantRouteGuard></AuthGate>
            </Route>

            <Route component={NotFound} />
          </Switch>
        </Suspense>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
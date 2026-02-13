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

function Router() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Switch>
        {/* Basic Routes */}
        <Route path="/" component={Home} />
        <Route path="/login" component={Login} />
        <Route path="/register" component={Register} />
        <Route path="/subscription" component={SubscriptionPlan} />
        <Route path="/forgot-password" component={ForgotPassword} />

        {/* Owner/General Dashboards */}
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/tenants" component={TenantsList} />
        <Route path="/tenants/add" component={AddTenant} />
        <Route path="/tenants/view/:id" component={ViewTenant} />
        <Route path="/tenants/edit/:id" component={EditTenant} />
        <Route path="/payments" component={Payments} />
        <Route path="/electricity-history" component={ElectricityHistory} />
        <Route path="/notifications" component={Notifications} />
        <Route path="/rooms" component={Rooms} />
        <Route path="/rooms/add" component={AddRoom} />
        <Route path="/rooms/edit/:id" component={EditRoom} />
        <Route path="/complaints" component={Complaints} />
        <Route path="/maintenance" component={Maintenance} />
        <Route path="/reports" component={Reports} />
        <Route path="/settings" component={Settings} />
        <Route path="/manage-devices" component={ManageDevices} />
        <Route path="/pg-management" component={PGManagement} />
        <Route path="/owner-visit-requests" component={OwnerVisitRequestsPage} />
        <Route path="/owner-onboarding-requests" component={OwnerOnboardingRequestsPage} />
        <Route path="/announcements" component={Announcements} />
        <Route path="/food-menu" component={FoodMenu} />

        {/* Admin Routes */}
        <Route path="/admin-dashboard" component={AdminDashboard} />
        <Route path="/admin-pgs" component={AdminPGManagement} />
        <Route path="/admin-subscriptions" component={AdminSubscriptions} />
        <Route path="/admin-complaints" component={AdminComplaints} />
        <Route path="/admin-amenities" component={AdminAmenities} />
        <Route path="/admin-owner-analytics" component={AdminOwnerAnalytics} />

        {/* Tenant Routes (Guarded) */}
        <Route path="/tenant-reset-password" component={TenantResetPassword} />
        
        <Route path="/tenant-dashboard">
          <TenantRouteGuard requiresOnboarding={true}><TenantDashboard /></TenantRouteGuard>
        </Route>
        <Route path="/tenant-profile">
          <TenantRouteGuard requiresOnboarding={true}><TenantProfile /></TenantRouteGuard>
        </Route>
        <Route path="/tenant-room">
          <TenantRouteGuard requiresOnboarding={true}><TenantRoomDetails /></TenantRouteGuard>
        </Route>
        <Route path="/tenant-payments">
          <TenantRouteGuard requiresOnboarding={true}><TenantPayments /></TenantRouteGuard>
        </Route>
        <Route path="/tenant-complaints">
          <TenantRouteGuard requiresOnboarding={true}><TenantComplaints /></TenantRouteGuard>
        </Route>
        <Route path="/tenant-pg">
          <TenantRouteGuard requiresOnboarding={true}><TenantPgDetails /></TenantRouteGuard>
        </Route>
        <Route path="/tenant-facilities">
          <TenantRouteGuard requiresOnboarding={true}><TenantPgFacilities /></TenantRouteGuard>
        </Route>
        <Route path="/tenant-announcements">
          <TenantRouteGuard requiresOnboarding={true}><TenantAnnouncements /></TenantRouteGuard>
        </Route>

        {/* Tenant Search/Onboarding Routes */}
        <Route path="/tenant-search-pgs">
          <TenantRouteGuard requiresOnboarding={false}><PGSearchPage /></TenantRouteGuard>
        </Route>
        <Route path="/pg/:id">
          <TenantRouteGuard requiresOnboarding={false}><PGDetailsPage /></TenantRouteGuard>
        </Route>
        <Route path="/tenant-visit-requests">
          <TenantRouteGuard requiresOnboarding={false}><TenantVisitRequestsPage /></TenantRouteGuard>
        </Route>

        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <AuthGate>
          <Router />
        </AuthGate>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
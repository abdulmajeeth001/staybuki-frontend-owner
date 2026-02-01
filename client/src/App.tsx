import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { TenantRouteGuard } from "@/components/TenantRouteGuard";
import { AuthGate } from "@/components/AuthGate";
import NotFound from "@/pages/not-found";

import Home from "@/pages/Home";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Dashboard from "@/pages/Dashboard";
import SubscriptionPlan from "@/pages/SubscriptionPlan";
import TenantsList from "@/pages/TenantsList";
import AddTenant from "@/pages/AddTenant";
import EditTenant from "@/pages/EditTenant";
import ViewTenant from "@/pages/ViewTenant";
import Payments from "@/pages/Payments";
import Notifications from "@/pages/Notifications";
import Rooms from "@/pages/Rooms";
import AddRoom from "@/pages/AddRoom";
import EditRoom from "@/pages/EditRoom";
import Complaints from "@/pages/Complaints";
import Maintenance from "@/pages/Maintenance";
import Reports from "@/pages/Reports";
import Settings from "@/pages/Settings";
import ManageDevices from "@/pages/ManageDevices";
import TenantResetPassword from "@/pages/TenantResetPassword";
import TenantDashboard from "@/pages/TenantDashboard";
import TenantProfile from "@/pages/TenantProfile";
import TenantRoomDetails from "@/pages/TenantRoomDetails";
import TenantPayments from "@/pages/TenantPayments";
import TenantComplaints from "@/pages/TenantComplaints";
import TenantPgDetails from "@/pages/TenantPgDetails";
import TenantPgFacilities from "@/pages/TenantPgFacilities";
import ForgotPassword from "@/pages/ForgotPassword";
import PGManagement from "@/pages/PGManagement";
import AdminDashboard from "@/pages/AdminDashboard";
import AdminPGManagement from "@/pages/AdminPGManagement";
import AdminSubscriptions from "@/pages/AdminSubscriptions";
import AdminComplaints from "@/pages/AdminComplaints";
import AdminAmenities from "@/pages/AdminAmenities";
import AdminOwnerAnalytics from "@/pages/AdminOwnerAnalytics";
import PGSearchPage from "@/pages/PGSearchPage";
import PGDetailsPage from "@/pages/PGDetailsPage";
import TenantVisitRequestsPage from "@/pages/TenantVisitRequestsPage";
import OwnerVisitRequestsPage from "@/pages/OwnerVisitRequestsPage";
import OwnerOnboardingRequestsPage from "@/pages/OwnerOnboardingRequestsPage";
import ElectricityHistory from "@/pages/ElectricityHistory";
import FoodMenu from "@/pages/FoodMenu";
import Announcements from "@/pages/Announcements";
import TenantAnnouncements from "@/pages/TenantAnnouncements";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/subscription" component={SubscriptionPlan} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/admin-dashboard" component={AdminDashboard} />
      <Route path="/admin-pgs" component={AdminPGManagement} />
      <Route path="/admin-subscriptions" component={AdminSubscriptions} />
      <Route path="/admin-complaints" component={AdminComplaints} />
      <Route path="/admin-amenities" component={AdminAmenities} />
      <Route path="/admin-owner-analytics" component={AdminOwnerAnalytics} />
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
      <Route path="/tenant-reset-password" component={TenantResetPassword} />
      <Route path="/tenant-dashboard">
        <TenantRouteGuard requiresOnboarding={true}>
          <TenantDashboard />
        </TenantRouteGuard>
      </Route>
      <Route path="/tenant-profile">
        <TenantRouteGuard requiresOnboarding={true}>
          <TenantProfile />
        </TenantRouteGuard>
      </Route>
      <Route path="/tenant-room">
        <TenantRouteGuard requiresOnboarding={true}>
          <TenantRoomDetails />
        </TenantRouteGuard>
      </Route>
      <Route path="/tenant-payments">
        <TenantRouteGuard requiresOnboarding={true}>
          <TenantPayments />
        </TenantRouteGuard>
      </Route>
      <Route path="/tenant-complaints">
        <TenantRouteGuard requiresOnboarding={true}>
          <TenantComplaints />
        </TenantRouteGuard>
      </Route>
      <Route path="/tenant-pg">
        <TenantRouteGuard requiresOnboarding={true}>
          <TenantPgDetails />
        </TenantRouteGuard>
      </Route>
      <Route path="/tenant-facilities">
        <TenantRouteGuard requiresOnboarding={true}>
          <TenantPgFacilities />
        </TenantRouteGuard>
      </Route>
      <Route path="/food-menu" component={FoodMenu} />
      <Route path="/announcements" component={Announcements} />
      <Route path="/tenant-announcements">
        <TenantRouteGuard>
          <TenantAnnouncements />
        </TenantRouteGuard>
      </Route>
      <Route path="/tenant-search-pgs">
        <TenantRouteGuard requiresOnboarding={false}>
          <PGSearchPage />
        </TenantRouteGuard>
      </Route>
      <Route path="/pg/:id">
        <TenantRouteGuard requiresOnboarding={false}>
          <PGDetailsPage />
        </TenantRouteGuard>
      </Route>
      <Route path="/tenant-visit-requests">
        <TenantRouteGuard requiresOnboarding={false}>
          <TenantVisitRequestsPage />
        </TenantRouteGuard>
      </Route>
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route component={NotFound} />
    </Switch>
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

import { useLocation } from "wouter";
import { Home, Users, CreditCard, Bell, Settings, DoorOpen, Wrench, AlertCircle, BarChart3, Menu, X, Building2, LogOut, Shield, Search, CalendarCheck, UtensilsCrossed, Tag, Megaphone } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useUser } from "@/hooks/use-user";
import { usePG } from "@/hooks/use-pg";
import { PGSwitcher } from "@/components/PGSwitcher";
import { useQuery } from "@tanstack/react-query";
import { useLogout } from "@/hooks/use-logout";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { NotificationBell } from "@/components/NotificationBell";
import { UserProfileMenu } from "@/components/UserProfileMenu";
import { ownerService } from "@/services/ownerService";

interface MobileLayoutProps {
  children: React.ReactNode;
  showNav?: boolean;
  title?: string;
  action?: React.ReactNode;
}

export default function MobileLayout({ 
  children, 
  showNav = true, 
  title,
  action
}: MobileLayoutProps) {
  const [location, navigate] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const { logout, isLoggingOut } = useLogout();
  const { user, isTenantOnboarded, isApplicant } = useUser();
  const normalizedUserType = (user?.userType || "").toLowerCase().trim();
  const isOwner = normalizedUserType === "owner";
  const { pg } = usePG(isOwner);
  const isAdmin = normalizedUserType === "admin";
  const isTenant = normalizedUserType === "tenant";

  const { data: tenantData } = useQuery<{ photoUrl?: string }>({
    queryKey: ["/api/users/profile"],
    queryFn: async () => {
      try {
        return await ownerService.getProfile() as any;
      } catch (error) {
        return null;
      }
    },
    enabled: isTenant,
  });

  const getAvatarImage = () => {
    if (isOwner && pg?.imageUrl) return pg.imageUrl;
    if (isTenant && tenantData?.photoUrl) return tenantData.photoUrl;
    return null;
  };

  const getAvatarFallback = () => {
    if (isOwner && pg?.pgName) return pg.pgName.substring(0, 2).toUpperCase();
    if (user?.name) return user.name.substring(0, 2).toUpperCase();
    return "U";
  };

  const avatarImage = getAvatarImage();
  const avatarFallback = getAvatarFallback();

  // Close sidebar when location changes
  useEffect(() => {
    setSidebarOpen(false);
  }, [location]);

  const handleLogout = async () => {
    await logout();
    setShowLogoutConfirm(false);
  };

  // Owner navigation items
  const ownerSideNavItems = [
    { icon: Home, label: "Dashboard", path: "/dashboard" },
    { icon: DoorOpen, label: "Rooms", path: "/rooms" },
    { icon: Users, label: "Tenants", path: "/tenants" },
    { icon: CreditCard, label: "Payments", path: "/payments" },
    { icon: UtensilsCrossed, label: "Food Menu", path: "/food-menu" },
    { icon: Megaphone, label: "Announcements", path: "/announcements" },
    { icon: CalendarCheck, label: "Visit Requests", path: "/owner-visit-requests" },
    { icon: Users, label: "Onboarding", path: "/owner-onboarding-requests" },
    { icon: AlertCircle, label: "Complaints", path: "/complaints" },
    { icon: Wrench, label: "Maintenance", path: "/maintenance" },
    { icon: BarChart3, label: "Reports", path: "/reports" },
    { icon: Bell, label: "Notifications", path: "/notifications" },
    { icon: Building2, label: "My PGs", path: "/pg-management" },
    { icon: Settings, label: "Settings", path: "/settings" },
  ];

  // Applicant navigation items (searching for PG)
  const applicantSideNavItems = [
    { icon: Search, label: "Search PGs", path: "/tenant-search-pgs" },
    { icon: CalendarCheck, label: "Visit Requests", path: "/tenant-visit-requests" },
    { icon: Bell, label: "Notifications", path: "/notifications" },
    { icon: Settings, label: "Settings", path: "/settings" },
  ];

  // Tenant navigation items (already living in PG)
  const tenantSideNavItems = [
    { icon: Home, label: "Dashboard", path: "/tenant-dashboard" },
    { icon: DoorOpen, label: "Room", path: "/tenant-room" },
    { icon: CreditCard, label: "Payments", path: "/tenant-payments" },
    { icon: UtensilsCrossed, label: "Food Menu", path: "/food-menu" },
    { icon: Megaphone, label: "Announcements", path: "/tenant-announcements" },
    { icon: AlertCircle, label: "Complaints", path: "/tenant-complaints" },
    { icon: Bell, label: "Notifications", path: "/notifications" },
    { icon: Settings, label: "Settings", path: "/settings" },
  ];

  const ownerBottomNavItems = [
    { icon: Home, label: "Home", path: "/dashboard" },
    { icon: UtensilsCrossed, label: "Menu", path: "/food-menu" },
    { icon: Users, label: "Tenants", path: "/tenants" },
    { icon: Bell, label: "Alerts", path: "/notifications" },
    { icon: Settings, label: "Settings", path: "/settings" },
  ];

  // Applicant bottom navigation
  const applicantBottomNavItems = [
    { icon: Search, label: "Search", path: "/tenant-search-pgs" },
    { icon: CalendarCheck, label: "Visits", path: "/tenant-visit-requests" },
    { icon: Bell, label: "Alerts", path: "/notifications" },
    { icon: Settings, label: "Settings", path: "/settings" },
  ];

  // Tenant bottom navigation
  const tenantBottomNavItems = [
    { icon: Home, label: "Home", path: "/tenant-dashboard" },
    { icon: UtensilsCrossed, label: "Menu", path: "/food-menu" },
    { icon: CreditCard, label: "Payments", path: "/tenant-payments" },
    { icon: AlertCircle, label: "Issues", path: "/tenant-complaints" },
    { icon: Settings, label: "Settings", path: "/settings" },
  ];

  // Admin navigation items
  const adminSideNavItems = [
    { icon: Home, label: "Dashboard", path: "/admin-dashboard" },
    { icon: Building2, label: "PG Management", path: "/admin-pgs" },
    { icon: CreditCard, label: "Subscriptions", path: "/admin-subscriptions" },
    { icon: AlertCircle, label: "Complaints", path: "/admin-complaints" },
    { icon: Tag, label: "Amenities", path: "/admin-amenities" },
    { icon: Bell, label: "Notifications", path: "/notifications" },
    { icon: Settings, label: "Settings", path: "/settings" },
  ];

  const adminBottomNavItems = [
    { icon: Home, label: "Home", path: "/admin-dashboard" },
    { icon: Building2, label: "PGs", path: "/admin-pgs" },
    { icon: Tag, label: "Amenities", path: "/admin-amenities" },
    { icon: AlertCircle, label: "Alerts", path: "/admin-complaints" },
    { icon: Settings, label: "Settings", path: "/settings" },
  ];

  // Select navigation based on user type
  // Note: userType now reflects actual state - "applicant" = searching for housing, "tenant" = has housing
  // When a tenant is removed, their userType reverts to "applicant"
  const sideNavItems = normalizedUserType === "admin" ? adminSideNavItems 
    : normalizedUserType === "applicant" ? applicantSideNavItems
    : normalizedUserType === "tenant" ? tenantSideNavItems 
    : ownerSideNavItems;
  const bottomNavItems = normalizedUserType === "admin" ? adminBottomNavItems 
    : normalizedUserType === "applicant" ? applicantBottomNavItems
    : normalizedUserType === "tenant" ? tenantBottomNavItems 
    : ownerBottomNavItems;

  return (
    <div className="h-[100dvh] bg-background max-w-4xl mx-auto border-x border-border shadow-2xl relative flex flex-col overflow-hidden">
      {/* Side Navigation - Collapsible */}
      <aside className={cn(
        "bg-card border-r border-border flex flex-col shrink-0 overflow-hidden transition-all duration-300 absolute lg:relative h-full",
        sidebarOpen ? "w-64 z-40" : "w-0"
      )}>
        {/* Header */}
        <div className="p-6 border-b border-border">
          <div 
            onClick={() => {
              if (isApplicant) return;
              if (isAdmin) navigate("/admin-dashboard");
              else if (isTenant) navigate("/tenant-dashboard");
              else navigate("/dashboard");
            }}
            className={cn("mb-4", !isApplicant ? "cursor-pointer" : "")}
          >
            <div className="flex items-center gap-3">
              <img 
                src="/logo.png"
                alt="StayBuki" 
                className="h-10 w-auto"
              />
              {(isOwner || isTenant) && (
                <Avatar className="h-9 w-9 border-2 border-primary/20" data-testid="avatar-profile-mobile">
                  {avatarImage ? (
                    <AvatarImage src={avatarImage} alt="Profile" />
                  ) : null}
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xs">
                    {avatarFallback}
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
            {isAdmin && (
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                <Shield className="h-3 w-3" />
                Admin Panel
              </p>
            )}
          </div>
          {isOwner && (
            <PGSwitcher variant="sidebar" />
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-2">
          {sideNavItems.map(({ icon: Icon, label, path }) => {
            const isActive = location === path || (path !== "/dashboard" && location.startsWith(path));
            
            return (
              <div
                key={path}
                onClick={() => navigate(path)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 cursor-pointer",
                  isActive 
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/20" 
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{label}</span>
                {isActive && <div className="ml-auto w-2 h-2 bg-primary-foreground rounded-full" />}
              </div>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-border space-y-2">
          <div className="px-4 py-3 bg-secondary rounded-lg">
            <p className="text-xs font-medium text-muted-foreground mb-1">Plan</p>
            <p className="font-bold text-sm text-foreground">Pro Plan</p>
          </div>
          <Button 
            variant="outline" 
            className="w-full justify-start gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={() => setShowLogoutConfirm(true)}
            disabled={isLoggingOut}
            data-testid="button-mobile-logout"
          >
            <LogOut className="w-4 h-4" />
            {isLoggingOut ? "Logging out..." : "Logout"}
          </Button>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="bg-card border-b border-border h-14 flex items-center justify-between px-4 shrink-0 relative z-50">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="text-muted-foreground hover:text-foreground"
              aria-label="Open menu"
            >
              <Menu className="w-6 h-6" />
            </button>
            {title && <h1 className="font-semibold text-foreground">{title}</h1>}
          </div>
          <div className="flex items-center gap-2">
            {action}
            {isOwner && <PGSwitcher variant="header" />}
            {isOwner && <NotificationBell />}
            {isTenant && <NotificationBell />}
            {isAdmin && <NotificationBell />}
            {isApplicant && <NotificationBell />}
            <UserProfileMenu />
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto pb-safe">
          <div className="min-h-full">
            {children}
          </div>
        </main>

        {/* Bottom Navigation - Only show if showNav is true */}
        {showNav && (
          <nav className="bg-card border-t border-border h-16 flex items-center justify-around shrink-0">
            {bottomNavItems.map(({ icon: Icon, label, path }) => {
              const isActive = location === path || (path !== "/dashboard" && location.startsWith(path));
              
              return (
                <button
                  key={path}
                  onClick={() => navigate(path)}
                  className={cn(
                    "flex flex-col items-center justify-center gap-1 h-full flex-1 transition-colors",
                    isActive ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-xs font-medium">{label}</span>
                </button>
              );
            })}
          </nav>
        )}
      </div>

      <AlertDialog open={showLogoutConfirm} onOpenChange={setShowLogoutConfirm}>
        <AlertDialogContent>
          <AlertDialogTitle>Logout Confirmation</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to logout? You'll need to login again to access your account.
          </AlertDialogDescription>
          <div className="flex gap-2 justify-end mt-4">
            <AlertDialogCancel disabled={isLoggingOut}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleLogout} 
              className="bg-destructive hover:bg-destructive/90"
              disabled={isLoggingOut}
            >
              {isLoggingOut ? "Logging out..." : "Logout"}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

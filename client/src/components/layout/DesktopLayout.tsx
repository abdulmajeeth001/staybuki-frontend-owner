import Sidebar from "./Sidebar";
import MobileLayout from "./MobileLayout";
import { useUser } from "@/hooks/use-user";
import { PGSwitcher } from "@/components/PGSwitcher";
import { PendingApprovalBanner } from "@/components/PendingApprovalBanner";
import { NotificationBell } from "@/components/NotificationBell";
import { UserProfileMenu } from "@/components/UserProfileMenu";
import { Menu } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface DesktopLayoutProps {
  children: React.ReactNode;
  title?: string;
  action?: React.ReactNode;
  showNav?: boolean;
}

export default function DesktopLayout({ 
  children, 
  title,
  action,
  showNav = true
}: DesktopLayoutProps) {
  const { user, isTenantOnboarded, isApplicant } = useUser();
  const isOwner = user?.userType === "owner";
  const isAdmin = user?.userType === "admin";
  const isTenant = user?.userType === "tenant";
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  return (
    <div className="flex h-screen bg-background">
      <div className={cn("hidden lg:block transition-all duration-300 overflow-hidden shrink-0", sidebarOpen ? "w-64" : "w-0")}>
        <Sidebar className="w-64 h-screen" />
      </div>
      <div className="flex-1 overflow-hidden">
        {/* Desktop Header */}
        <header className="hidden lg:flex bg-card border-b border-border h-16 items-center justify-between px-8 sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)} 
              className="p-2 -ml-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors"
              aria-label="Toggle Sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-2xl font-bold text-foreground">{title}</h1>
          </div>
          <div className="flex items-center gap-4">
            {isOwner && <PGSwitcher variant="header" />}
            {isOwner && <NotificationBell />}
            {isTenant && isTenantOnboarded && <NotificationBell />}
            {isAdmin && <NotificationBell />}
            {isApplicant && <NotificationBell />}
            {action}
            <UserProfileMenu />
          </div>
        </header>

        {/* Desktop Main Content
            ✅ overflow-y-auto (not scroll), NO flex, NO inner wrapper div.
            Children render directly inside — pages control their own padding. */}
        <main className="hidden lg:block overflow-y-auto h-[calc(100vh-4rem)]">
          {children}
        </main>

        {/* Mobile Layout */}
        <div className="lg:hidden h-full">
          <MobileLayout title={title} action={action} showNav={showNav}>
            {children}
          </MobileLayout>
        </div>

        {/* Pending Approval Banner for Owners */}
        {isOwner && <PendingApprovalBanner />}
      </div>
    </div>
  );
}
import Sidebar from "./Sidebar";
import MobileLayout from "./MobileLayout";
import { useUser } from "@/hooks/use-user";
import { PGSwitcher } from "@/components/PGSwitcher";
import { PendingApprovalBanner } from "@/components/PendingApprovalBanner";
import { NotificationBell } from "@/components/NotificationBell";
import { UserProfileMenu } from "@/components/UserProfileMenu";

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
  
  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      
      <div className="flex-1 overflow-hidden">
        {/* Desktop Header */}
        <header className="hidden lg:flex bg-card border-b border-border h-16 items-center justify-between px-8 sticky top-0 z-40">
          <h1 className="text-2xl font-bold text-foreground">{title}</h1>
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

        {/* Desktop Main Content */}
        <main className="hidden lg:flex flex-col overflow-y-scroll h-[calc(100vh-4rem)]">
          <div className="p-8 space-y-6">
            {children}
          </div>
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

import { User, Settings, LogOut, Shield, UserCircle, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useUser } from "@/hooks/use-user";
import { usePG } from "@/hooks/use-pg";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useLogout } from "@/hooks/use-logout";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { api } from "@/apiClient";

export function UserProfileMenu() {
  const { user } = useUser();
  const { pg } = usePG();
  const [, navigate] = useLocation();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const { logout, isLoggingOut } = useLogout();

  const isOwner = user?.userType === "owner";
  const isAdmin = user?.userType === "admin";
  const isTenant = user?.userType === "tenant";
  const isApplicant = user?.userType === "applicant";

  const { data: tenantData } = useQuery<{ photoUrl?: string }>({
    queryKey: ["/api/users/profile"],
    queryFn: async () => {
      try {
        const res = await api.get("/api/users/profile");
        return res.data;
      } catch (error) {
        return null;
      }
    },
    enabled: isTenant || isApplicant,
  });

  const getAvatarImage = () => {
    if (isOwner && pg?.imageUrl) return pg.imageUrl;
    if ((isTenant || isApplicant) && tenantData?.photoUrl) return tenantData.photoUrl;
    return null;
  };

  const getAvatarFallback = () => {
    if (user?.name) return user.name.substring(0, 2).toUpperCase();
    return "U";
  };

  const avatarImage = getAvatarImage();
  const avatarFallback = getAvatarFallback();

  const getUserTypeLabel = () => {
    switch (user?.userType) {
      case "owner": return "PG Owner";
      case "tenant": return "Tenant";
      case "admin": return "Administrator";
      case "applicant": return "Looking for PG";
      default: return "User";
    }
  };

  const handleLogout = async () => {
    await logout();
    setShowLogoutConfirm(false);
  };

  const handleProfileClick = () => {
    if (isTenant) {
      navigate("/tenant-profile");
    } else if (isApplicant) {
      navigate("/tenant-profile");
    } else if (isOwner) {
      navigate("/settings");
    } else if (isAdmin) {
      navigate("/settings");
    }
  };

  const handleSettingsClick = () => {
    navigate("/settings");
  };

  const handleManagePGsClick = () => {
    navigate("/pg-management");
  };

  if (!user) return null;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            size="icon" 
            className="relative rounded-full h-9 w-9 hover:ring-2 hover:ring-primary/20 transition-all"
            data-testid="button-user-profile-menu"
          >
            <Avatar className="h-9 w-9 border-2 border-primary/20">
              {avatarImage ? (
                <AvatarImage src={avatarImage} alt="Profile" />
              ) : null}
              <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
                {avatarFallback}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64" sideOffset={8}>
          <DropdownMenuLabel className="font-normal">
            <div className="flex items-center gap-3 py-2">
              <Avatar className="h-12 w-12 border-2 border-primary/20">
                {avatarImage ? (
                  <AvatarImage src={avatarImage} alt="Profile" />
                ) : null}
                <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                  {avatarFallback}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user.name}</p>
                <p className="text-xs text-muted-foreground truncate max-w-[160px]">{user.email}</p>
                <div className="flex items-center gap-1 mt-1">
                  {isAdmin && <Shield className="h-3 w-3 text-amber-500" />}
                  <span className="text-xs text-primary font-medium">{getUserTypeLabel()}</span>
                </div>
              </div>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          <DropdownMenuItem 
            onClick={handleProfileClick}
            className="cursor-pointer gap-2 py-2.5"
            data-testid="menu-item-profile"
          >
            <UserCircle className="h-4 w-4" />
            <span>My Profile</span>
          </DropdownMenuItem>
          
          {isOwner && (
            <DropdownMenuItem 
              onClick={handleManagePGsClick}
              className="cursor-pointer gap-2 py-2.5"
              data-testid="menu-item-manage-pgs"
            >
              <Building2 className="h-4 w-4" />
              <span>Manage PGs</span>
            </DropdownMenuItem>
          )}
          
          <DropdownMenuItem 
            onClick={handleSettingsClick}
            className="cursor-pointer gap-2 py-2.5"
            data-testid="menu-item-settings"
          >
            <Settings className="h-4 w-4" />
            <span>Settings</span>
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem 
            onClick={() => setShowLogoutConfirm(true)}
            className="cursor-pointer gap-2 py-2.5 text-destructive focus:text-destructive focus:bg-destructive/10"
            data-testid="menu-item-logout"
          >
            <LogOut className="h-4 w-4" />
            <span>Logout</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

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
    </>
  );
}

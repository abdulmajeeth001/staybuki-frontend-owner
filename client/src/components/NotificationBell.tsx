import { Bell, CheckCheck, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNotifications } from "@/hooks/useNotifications";
import { useLocation } from "wouter";
import { formatDistanceToNow } from "date-fns";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/hooks/use-user";
import { api } from "@/apiClient";

export function NotificationBell() {
  const { notifications, unreadCount, markAsRead, requestPermission, hasActiveSubscription, isPushAvailable, debugInfo } = useNotifications();
  const { user } = useUser();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleNotificationClick = (notification: typeof notifications[0]) => {
    markAsRead(notification.id);

    // Navigate based on notification type and user type
    if (user?.userType === "tenant" || user?.userType === "applicant") {
      // Tenant/Applicant routes
      switch (notification.type) {
        case "payment":
          setLocation(`/tenant-payments${notification.referenceId ? `?paymentId=${notification.referenceId}` : ''}`);
          break;
        case "complaint":
          setLocation(`/tenant-complaints${notification.referenceId ? `?complaintId=${notification.referenceId}` : ''}`);
          break;
        case "announcement":
          setLocation("/tenant-announcements");
          break;
        case "food_alert":
          setLocation("/tenant-food-menu");
          break;
        case "visit_request":
          setLocation("/tenant-visit-requests");
          break;
        case "onboarding_request":
        case "onboarding":
          setLocation("/tenant-profile");
          break;
        default:
          break;
      }
    } else {
      // Owner routes
      switch (notification.type) {
        case "visit_request":
          setLocation("/owner-visit-requests");
          break;
        case "onboarding_request":
          setLocation("/owner-onboarding-requests");
          break;
        case "payment":
          setLocation(`/payments${notification.referenceId ? `?paymentId=${notification.referenceId}` : ''}`);
          break;
        case "complaint":
          setLocation(`/complaints${notification.referenceId ? `?complaintId=${notification.referenceId}` : ''}`);
          break;
        case "food_alert":
          setLocation("/food-menu");
          break;
        default:
          break;
      }
    }
  };

  const handleEnableNotifications = async () => {
    await requestPermission();
  };

  // Mark all notifications as read
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post("/api/notifications/mark-all-read");
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications", "unread-count"] });
      toast({
        title: "Success",
        description: "All notifications marked as read",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to mark all notifications as read",
        variant: "destructive",
      });
    },
  });

  const handleMarkAllAsRead = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    markAllAsReadMutation.mutate();
  };

  const handleViewAll = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setLocation("/notifications");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" data-testid="button-notification-bell">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
              data-testid="badge-unread-count"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80" data-testid="dropdown-notifications">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          <div className="flex gap-1">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkAllAsRead}
                className="text-xs h-7"
                disabled={markAllAsReadMutation.isPending}
                data-testid="button-mark-all-read"
              >
                <CheckCheck className="h-3 w-3 mr-1" />
                Clear All
              </Button>
            )}
            {isPushAvailable && !hasActiveSubscription && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleEnableNotifications}
                className="text-xs h-7"
                data-testid="button-enable-push"
              >
                Enable Push
              </Button>
            )}
          </div>
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />
        <ScrollArea className="h-[400px]">
          {notifications.filter(n => !n.isRead).length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground" data-testid="text-no-notifications">
              No unread notifications
            </div>
          ) : (
            notifications.filter(n => !n.isRead).map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className="flex flex-col items-start p-3 cursor-pointer hover:bg-accent"
                onClick={() => handleNotificationClick(notification)}
                data-testid={`notification-item-${notification.id}`}
              >
                <div className="flex items-start justify-between w-full">
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${!notification.isRead ? "font-semibold" : ""}`}>
                      {notification.title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {notification.message}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {(() => {
                        const date = new Date(notification.createdAt);
                        return !isNaN(date.getTime())
                          ? formatDistanceToNow(date, { addSuffix: true })
                          : "Just now";
                      })()}
                    </p>
                  </div>
                  {!notification.isRead && (
                    <div className="w-2 h-2 bg-blue-500 rounded-full ml-2 mt-1" data-testid={`unread-indicator-${notification.id}`} />
                  )}
                </div>
              </DropdownMenuItem>
            ))
          )}
        </ScrollArea>
        <>
          <DropdownMenuSeparator />
          <div className="p-2">
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={handleViewAll}
              data-testid="button-view-all-notifications"
            >
              <Eye className="h-4 w-4 mr-2" />
              View All Notifications
            </Button>
          </div>
        </>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

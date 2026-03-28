import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import DesktopLayout from "@/components/layout/DesktopLayout";
import MobileLayout from "@/components/layout/MobileLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Bell, 
  MessageSquare, 
  AlertTriangle, 
  Check, 
  CheckCheck,
  Mail,
  MailOpen,
  Trash2,
  Archive,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { useLocation } from "wouter";
import { useUser } from "@/hooks/use-user";
import { api } from "@/apiClient";

interface Notification {
  id: number;
  userId: number;
  pgId: number | null;
  title: string;
  message: string;
  type: string;
  referenceId: number | null;
  isRead: boolean;
  createdAt: string;
}

export default function Notifications() {
  return (
    <>
      <div className="hidden lg:block">
        <NotificationsDesktop />
      </div>
      <div className="lg:hidden">
        <NotificationsMobile />
      </div>
    </>
  );
}

function NotificationsDesktop() {
  const [filter, setFilter] = useState<string>("all");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const { user } = useUser();

  // Fetch notifications with real-time updates
  const { data: notifications = [], isLoading } = useQuery<Notification[]>({
    queryKey: ["notifications"],
    queryFn: async () => {
      try {
        const response = await api.get("/api/notifications");
        return response.data;
      } catch (error: any) {
        throw new Error(error.response?.data?.error || error.message || "Failed to fetch notifications");
      }
    },
    staleTime: 15000, // Data stays fresh for 15 seconds
    refetchInterval: 30000, // Refresh every 30 seconds for near real-time data
  });

  // Mark single notification as read
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: number) => {
      const response = await api.post(`/api/notifications/${notificationId}/read`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications", "unread-count"] });
    },
  });

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
        description: error.response?.data?.error || error.message || "Failed to mark all notifications as read",
        variant: "destructive",
      });
    },
  });

  // Filter notifications
  const filteredNotifications = notifications.filter((notif) => {
    if (filter === "all") return true;
    if (filter === "unread") return !notif.isRead;
    if (filter === "read") return notif.isRead;
    return true;
  });

  const getStatusCounts = () => {
    return {
      all: notifications.length,
      unread: notifications.filter((n) => !n.isRead).length,
      read: notifications.filter((n) => n.isRead).length,
    };
  };

  const markAsRead = (id: number) => {
    markAsReadMutation.mutate(id);
  };

  const markAllAsRead = () => {
    markAllAsReadMutation.mutate();
  };

  const handleNotificationClick = (notification: Notification) => {
    // Mark as read if not already read
    if (!notification.isRead) {
      markAsRead(notification.id);
    }

    // Navigate based on notification type and user type
    if (user?.userType === "tenant" || user?.userType === "applicant") {
      switch (notification.type.toLowerCase()) {
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
      switch (notification.type.toLowerCase()) {
        case "visit_request":
          setLocation("/owner-visit-requests");
          break;
        case "onboarding_request":
        case "onboarding":
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

  const getNotificationIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "visit_request":
      case "onboarding_request":
      case "onboarding":
        return MessageSquare;
      case "payment":
        return CheckCheck;
      case "complaint":
        return AlertTriangle;
      case "food_alert":
        return Bell;
      default:
        return Bell;
    }
  };

  const counts = getStatusCounts();

  return (
    <DesktopLayout title="Notifications" showNav>
      {/* Gradient Hero Section */}
      <div className="relative -mx-6 -mt-6 mb-8 overflow-hidden rounded-b-3xl">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-blue-600 to-purple-700" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(120,119,198,0.3),rgba(255,255,255,0))]" />
        <div className="relative px-8 py-10 text-white">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-4xl font-bold tracking-tight mb-2" data-testid="title-notifications">
                Notifications
              </h2>
              <p className="text-white/80 text-sm">
                Stay updated with important alerts and messages
              </p>
            </div>
            <div className="flex gap-3">
              <Button 
                className="bg-white/20 backdrop-blur-sm border-white/30 hover:bg-white/30 text-white transition-all duration-300"
                onClick={markAllAsRead}
                disabled={counts.unread === 0}
                data-testid="button-mark-all-read"
              >
                <CheckCheck className="w-4 h-4 mr-2" />
                Mark All Read
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="group hover:shadow-lg transition-all duration-300 border-2 border-transparent hover:border-purple-200 overflow-hidden relative" data-testid="card-stat-all">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-blue-50 opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardContent className="p-6 relative">
              <div className="flex items-center justify-between mb-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <Bell className="w-7 h-7 text-white" />
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Total</p>
                <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent" data-testid="stat-all">
                  {counts.all}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-lg transition-all duration-300 border-2 border-transparent hover:border-purple-200 overflow-hidden relative" data-testid="card-stat-unread">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-blue-50 opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardContent className="p-6 relative">
              <div className="flex items-center justify-between mb-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <Mail className="w-7 h-7 text-white" />
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Unread</p>
                <p className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent" data-testid="stat-unread">
                  {counts.unread}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-lg transition-all duration-300 border-2 border-transparent hover:border-purple-200 overflow-hidden relative" data-testid="card-stat-read">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-blue-50 opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardContent className="p-6 relative">
              <div className="flex items-center justify-between mb-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <MailOpen className="w-7 h-7 text-white" />
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Read</p>
                <p className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent" data-testid="stat-read">
                  {counts.read}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filter Controls */}
        <Card className="p-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex gap-2 overflow-x-auto flex-wrap">
              <Button
                variant={filter === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter("all")}
                className={filter === "all" ? "bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700" : ""}
                data-testid="filter-all"
              >
                All ({counts.all})
              </Button>
              <Button
                variant={filter === "unread" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter("unread")}
                className={filter === "unread" ? "bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700" : ""}
                data-testid="filter-unread"
              >
                Unread ({counts.unread})
              </Button>
              <Button
                variant={filter === "read" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter("read")}
                className={filter === "read" ? "bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700" : ""}
                data-testid="filter-read"
              >
                Read ({counts.read})
              </Button>
            </div>
          </div>
        </Card>

        {/* Notification Cards */}
        {isLoading ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center">
              <Bell className="w-8 h-8 text-purple-600 animate-pulse" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Loading notifications...</h3>
            <p className="text-sm text-muted-foreground">Please wait</p>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center">
              <Bell className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2" data-testid="text-no-notifications">
              {filter === "all"
                ? "No notifications yet"
                : `No ${filter} notifications`}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {filter === "all"
                ? "You're all caught up! New notifications will appear here"
                : `You don't have any ${filter} notifications at the moment`}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredNotifications.map((notif) => {
              const Icon = getNotificationIcon(notif.type);

              return (
                <Card
                  key={notif.id}
                  className={cn(
                    "group hover:shadow-lg transition-all duration-300 border-2 overflow-hidden relative cursor-pointer",
                    notif.isRead 
                      ? "border-transparent hover:border-purple-200" 
                      : "border-purple-200 hover:border-purple-300 bg-purple-50/30"
                  )}
                  onClick={() => handleNotificationClick(notif)}
                  data-testid={`card-notification-${notif.id}`}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-blue-50 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <CardContent className="p-5 relative">
                    <div className="flex gap-4">
                      <div className={cn(
                        "w-12 h-12 rounded-xl shrink-0 flex items-center justify-center shadow-md group-hover:scale-110 transition-transform",
                        notif.isRead 
                          ? "bg-gradient-to-br from-gray-400 to-gray-500" 
                          : "bg-gradient-to-br from-purple-500 to-blue-600"
                      )}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex justify-between items-start gap-4">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-sm" data-testid={`text-title-${notif.id}`}>
                              {notif.title}
                            </h4>
                            {!notif.isRead && (
                              <Badge 
                                variant="outline" 
                                className="bg-orange-100 text-orange-700 border-orange-200 text-[10px] px-1.5 py-0"
                                data-testid={`badge-unread-${notif.id}`}
                              >
                                New
                              </Badge>
                            )}
                          </div>
                          <span className="text-[10px] text-muted-foreground" data-testid={`text-time-${notif.id}`}>
                            {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed" data-testid={`text-message-${notif.id}`}>
                          {notif.message}
                        </p>
                        <div className="flex items-center gap-2 pt-2">
                          {!notif.isRead && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs"
                              onClick={(e) => {
                                e.stopPropagation();
                                markAsRead(notif.id);
                              }}
                              data-testid={`button-mark-read-${notif.id}`}
                            >
                              <CheckCheck className="w-3 h-3 mr-1" />
                              Mark as read
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </DesktopLayout>
  );
}

function NotificationsMobile() {
  const [filter, setFilter] = useState<string>("all");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const { user } = useUser();

  // Fetch notifications with real-time updates
  const { data: notifications = [], isLoading } = useQuery<Notification[]>({
    queryKey: ["notifications"],
    queryFn: async () => {
      try {
        const response = await api.get("/api/notifications");
        return response.data;
      } catch (error: any) {
        throw new Error(error.response?.data?.error || error.message || "Failed to fetch notifications");
      }
    },
    staleTime: 15000, // Data stays fresh for 15 seconds
    refetchInterval: 30000, // Refresh every 30 seconds for near real-time data
  });

  // Mark single notification as read
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: number) => {
      const response = await api.post(`/api/notifications/${notificationId}/read`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications", "unread-count"] });
    },
  });

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
        description: error.response?.data?.error || error.message || "Failed to mark all notifications as read",
        variant: "destructive",
      });
    },
  });

  const filteredNotifications = notifications.filter((notif) => {
    if (filter === "all") return true;
    if (filter === "unread") return !notif.isRead;
    if (filter === "read") return notif.isRead;
    return true;
  });

  const getStatusCounts = () => {
    return {
      all: notifications.length,
      unread: notifications.filter((n) => !n.isRead).length,
      read: notifications.filter((n) => n.isRead).length,
    };
  };

  const markAsRead = (id: number) => {
    markAsReadMutation.mutate(id);
  };

  const markAllAsRead = () => {
    markAllAsReadMutation.mutate();
  };

  const handleNotificationClick = (notification: Notification) => {
    // Mark as read if not already read
    if (!notification.isRead) {
      markAsRead(notification.id);
    }

    // Navigate based on notification type and user type
    if (user?.userType === "tenant" || user?.userType === "applicant") {
      switch (notification.type.toLowerCase()) {
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
      switch (notification.type.toLowerCase()) {
        case "visit_request":
          setLocation("/owner-visit-requests");
          break;
        case "onboarding_request":
        case "onboarding":
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

  const getNotificationIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "visit_request":
      case "onboarding_request":
      case "onboarding":
        return MessageSquare;
      case "payment":
        return CheckCheck;
      case "complaint":
        return AlertTriangle;
      case "food_alert":
        return Bell;
      default:
        return Bell;
    }
  };

  const counts = getStatusCounts();

  return (
    <MobileLayout 
      title="Notifications"
      action={
        <Button 
          size="sm"
          className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white h-9"
          onClick={markAllAsRead}
          disabled={counts.unread === 0}
          data-testid="button-mark-all-read-mobile"
        >
          <CheckCheck className="w-4 h-4 mr-1" />
          Mark All
        </Button>
      }
    >
      <div className="space-y-4 pb-20">
        <div className="grid grid-cols-3 gap-3">
          <Card className="group hover:shadow-lg transition-all duration-300 border-2 border-transparent hover:border-purple-200 overflow-hidden relative" data-testid="card-stat-all-mobile">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-blue-50 opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardContent className="p-3 relative">
              <div className="flex flex-col items-center justify-center text-center space-y-2">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center shadow-lg">
                  <Bell className="w-5 h-5 text-white" />
                </div>
                <div className="w-full">
                  <p className="text-[10px] font-medium text-muted-foreground mb-0.5">Total</p>
                  <p className="text-lg font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent" data-testid="stat-all-mobile">
                    {counts.all}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-lg transition-all duration-300 border-2 border-transparent hover:border-purple-200 overflow-hidden relative" data-testid="card-stat-unread-mobile">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-blue-50 opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardContent className="p-3 relative">
              <div className="flex flex-col items-center justify-center text-center space-y-2">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-lg">
                  <Mail className="w-5 h-5 text-white" />
                </div>
                <div className="w-full">
                  <p className="text-[10px] font-medium text-muted-foreground mb-0.5">Unread</p>
                  <p className="text-lg font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent" data-testid="stat-unread-mobile">
                    {counts.unread}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-lg transition-all duration-300 border-2 border-transparent hover:border-purple-200 overflow-hidden relative" data-testid="card-stat-read-mobile">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-blue-50 opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardContent className="p-3 relative">
              <div className="flex flex-col items-center justify-center text-center space-y-2">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-lg">
                  <MailOpen className="w-5 h-5 text-white" />
                </div>
                <div className="w-full">
                  <p className="text-[10px] font-medium text-muted-foreground mb-0.5">Read</p>
                  <p className="text-lg font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent" data-testid="stat-read-mobile">
                    {counts.read}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          <Button
            variant={filter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("all")}
            className={cn(
              "rounded-full px-3 h-8 text-xs flex-shrink-0",
              filter === "all" && "bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            )}
            data-testid="filter-all-mobile"
          >
            All ({counts.all})
          </Button>
          <Button
            variant={filter === "unread" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("unread")}
            className={cn(
              "rounded-full px-3 h-8 text-xs flex-shrink-0",
              filter === "unread" && "bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700"
            )}
            data-testid="filter-unread-mobile"
          >
            Unread ({counts.unread})
          </Button>
          <Button
            variant={filter === "read" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("read")}
            className={cn(
              "rounded-full px-3 h-8 text-xs flex-shrink-0",
              filter === "read" && "bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700"
            )}
            data-testid="filter-read-mobile"
          >
            Read ({counts.read})
          </Button>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center">
              <Bell className="w-8 h-8 text-purple-600 animate-pulse" />
            </div>
            <h3 className="text-base font-semibold mb-2">Loading notifications...</h3>
            <p className="text-xs text-muted-foreground">Please wait</p>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center">
              <Bell className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="text-base font-semibold mb-2" data-testid="text-no-notifications-mobile">
              {filter === "all"
                ? "No notifications yet"
                : `No ${filter} notifications`}
            </h3>
            <p className="text-xs text-muted-foreground px-4">
              {filter === "all"
                ? "You're all caught up! New notifications will appear here"
                : `You don't have any ${filter} notifications at the moment`}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredNotifications.map((notif) => {
              const Icon = getNotificationIcon(notif.type);

              return (
                <Card
                  key={notif.id}
                  className={cn(
                    "group active:scale-[0.98] transition-all duration-200 border-2 overflow-hidden relative cursor-pointer",
                    notif.isRead 
                      ? "border-transparent" 
                      : "border-purple-200 bg-purple-50/30"
                  )}
                  onClick={() => handleNotificationClick(notif)}
                  data-testid={`card-notification-${notif.id}-mobile`}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-blue-50 opacity-0 group-active:opacity-100 transition-opacity" />
                  <CardContent className="p-4 relative">
                    <div className="flex gap-3">
                      <div className={cn(
                        "w-10 h-10 rounded-lg shrink-0 flex items-center justify-center shadow-md",
                        notif.isRead 
                          ? "bg-gradient-to-br from-gray-400 to-gray-500" 
                          : "bg-gradient-to-br from-purple-500 to-blue-600"
                      )}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 space-y-1 min-w-0">
                        <div className="flex justify-between items-start gap-2">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <h4 className="font-semibold text-xs truncate" data-testid={`text-title-${notif.id}-mobile`}>
                              {notif.title}
                            </h4>
                            {!notif.isRead && (
                              <Badge 
                                variant="outline" 
                                className="bg-orange-100 text-orange-700 border-orange-200 text-[9px] px-1 py-0 flex-shrink-0"
                                data-testid={`badge-unread-${notif.id}-mobile`}
                              >
                                New
                              </Badge>
                            )}
                          </div>
                          <span className="text-[9px] text-muted-foreground flex-shrink-0" data-testid={`text-time-${notif.id}-mobile`}>
                            {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground leading-relaxed" data-testid={`text-message-${notif.id}-mobile`}>
                          {notif.message}
                        </p>
                        <div className="flex items-center gap-1 pt-1">
                          {!notif.isRead && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-[10px] px-2"
                              onClick={(e) => {
                                e.stopPropagation();
                                markAsRead(notif.id);
                              }}
                              data-testid={`button-mark-read-${notif.id}-mobile`}
                            >
                              <CheckCheck className="w-3 h-3 mr-0.5" />
                              Mark read
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </MobileLayout>
  );
}

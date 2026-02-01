import DesktopLayout from "@/components/layout/DesktopLayout";
import MobileLayout from "@/components/layout/MobileLayout";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Users, Wallet, AlertCircle, TrendingUp, UserPlus, Building2, ArrowUpRight, ArrowDownRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { usePG } from "@/hooks/use-pg";
import { api } from "@/apiClient";

export default function Dashboard() {
  return (
    <>
      <div className="hidden lg:block">
        <DashboardDesktop />
      </div>
      <div className="lg:hidden">
        <DashboardMobile />
      </div>
    </>
  );
}

function DashboardDesktop() {
  const [, navigate] = useLocation();
  const { pg } = usePG();
  
  // Fetch dashboard stats - include pgId in query key for proper caching per PG
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['owner-dashboard-stats', pg?.id],
    queryFn: async () => {
      try {
        const res = await api.get('/api/owner/dashboard-stats');
        return res.data;
      } catch (error: any) {
        throw new Error(error.response?.data?.error || error.message || "Failed to fetch dashboard stats");
      }
    },
    enabled: !!pg?.id,
    staleTime: 60000, // Data stays fresh for 1 minute
    refetchInterval: 120000, // Refetch every 2 minutes
  });

  // Fetch recent activity - include pgId in query key for proper caching per PG
  const { data: activities, isLoading: activitiesLoading } = useQuery<Array<{
    id: number;
    type: string;
    title: string;
    description: string;
    createdAt: Date;
  }>>({
    queryKey: ['owner-recent-activity', pg?.id],
    queryFn: async () => {
      try {
        const res = await api.get('/api/owner/recent-activity');
        return res.data;
      } catch (error: any) {
        throw new Error(error.response?.data?.error || error.message || "Failed to fetch recent activity");
      }
    },
    enabled: !!pg?.id,
    staleTime: 60000, // Data stays fresh for 1 minute
    refetchInterval: 120000, // Refetch every 2 minutes
  });
  
  const stats = [
    { 
      label: "Total Tenants", 
      value: statsLoading ? "..." : statsData?.totalTenants?.toString() || "0", 
      icon: Users, 
      gradient: "from-blue-500 to-cyan-600", 
      description: "Active tenants"
    },
    { 
      label: "Total Revenue", 
      value: statsLoading ? "..." : `₹${statsData?.revenue?.toLocaleString('en-IN') || '0'}`, 
      icon: Wallet, 
      gradient: "from-emerald-500 to-green-600", 
      description: "All time paid"
    },
    { 
      label: "Pending Dues", 
      value: statsLoading ? "..." : `₹${statsData?.pendingDues?.toLocaleString('en-IN') || '0'}`, 
      icon: AlertCircle, 
      gradient: "from-orange-500 to-red-600", 
      description: "Outstanding payments"
    },
    { 
      label: "Occupancy", 
      value: statsLoading ? "..." : `${statsData?.occupancyRate || 0}%`, 
      icon: TrendingUp, 
      gradient: "from-purple-500 to-pink-600", 
      description: "Room utilization"
    },
  ];

  const quickActions = [
    { label: "Add Tenant", icon: UserPlus, action: () => navigate("/tenants/add"), gradient: "from-blue-500 to-cyan-600" },
    { label: "Add Room", icon: Building2, action: () => navigate("/rooms/add"), gradient: "from-purple-500 to-pink-600" },
    { label: "View Reports", icon: TrendingUp, action: () => navigate("/reports"), gradient: "from-emerald-500 to-green-600" },
    { label: "Manage PG", icon: Building2, action: () => navigate("/pg-management"), gradient: "from-orange-500 to-red-600" },
  ];

  return (
    <DesktopLayout title="Dashboard" showNav={false}>
      {/* Hero Section with Gradient */}
      <div className="relative -mx-6 -mt-6 mb-8 overflow-hidden rounded-b-3xl">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-blue-600 to-purple-700" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(120,119,198,0.3),rgba(255,255,255,0))]" />
        
        <div className="relative px-8 py-10 text-white">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-white/80 text-sm mb-2">Welcome back,</p>
              <h2 className="text-4xl font-bold tracking-tight">Owner Dashboard</h2>
            </div>
            <div className="flex gap-3">
              {quickActions.map((action, i) => (
                <Button
                  key={i}
                  onClick={action.action}
                  className="bg-white/20 backdrop-blur-sm border-white/30 hover:bg-white/30 text-white transition-all duration-300"
                  size="sm"
                  data-testid={`button-quick-${action.label.toLowerCase().replace(" ", "-")}`}
                >
                  <action.icon className="w-4 h-4 mr-2" />
                  {action.label}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid with Enhanced Design */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, i) => (
          <Card key={i} className="group relative overflow-hidden border-2 hover:border-purple-200 hover:shadow-2xl transition-all duration-300" data-testid={`card-stat-${stat.label.toLowerCase().replace(/\s+/g, "-")}`}>
            <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-blue-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <CardContent className="relative p-6">
              <div className="flex items-start justify-between mb-4">
                <div className={cn(
                  "w-14 h-14 rounded-xl flex items-center justify-center shadow-lg transition-transform duration-300 group-hover:scale-110",
                  `bg-gradient-to-br ${stat.gradient}`
                )}>
                  <stat.icon className="w-7 h-7 text-white" />
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-semibold mb-1">{stat.label}</p>
                <h3 className={cn(
                  "text-3xl font-bold mb-1 bg-gradient-to-r bg-clip-text text-transparent",
                  `${stat.gradient}`
                )}>{stat.value}</h3>
                <p className="text-xs text-muted-foreground">{stat.description}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Activity with Enhanced Design */}
      <Card className="border-2 shadow-xl">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-blue-50 border-b-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">Recent Activity</h3>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {activitiesLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
            </div>
          ) : !activities || activities.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-sm">No recent activity</p>
            </div>
          ) : (
            <div className="space-y-3">
              {activities.map((activity) => {
                const iconMap: Record<string, typeof Wallet> = {
                  payment: Wallet,
                  tenant: UserPlus,
                  complaint: AlertCircle,
                };
                const gradientMap: Record<string, string> = {
                  payment: "from-emerald-500 to-green-600",
                  tenant: "from-blue-500 to-cyan-600",
                  complaint: "from-orange-500 to-red-600",
                };
                const ActivityIcon = iconMap[activity.type] || AlertCircle;
                const gradient = gradientMap[activity.type] || "from-gray-500 to-gray-600";
                
                return (
                  <div key={activity.id} className="group flex items-center gap-4 p-4 bg-gradient-to-r from-white to-gray-50 hover:from-purple-50 hover:to-blue-50 rounded-xl border-2 border-transparent hover:border-purple-200 transition-all duration-300 cursor-pointer" data-testid={`activity-${activity.id}`}>
                    <div className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-md transition-transform duration-300 group-hover:scale-110",
                      `bg-gradient-to-br ${gradient}`
                    )}>
                      <ActivityIcon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-sm text-gray-800 mb-0.5">{activity.title}</h4>
                      <p className="text-xs text-muted-foreground">{activity.description}</p>
                    </div>
                    <span className="text-xs text-muted-foreground font-medium">{format(new Date(activity.createdAt), 'MMM d, h:mm a')}</span>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </DesktopLayout>
  );
}

function DashboardMobile() {
  const [, navigate] = useLocation();
  const { pg } = usePG();
  
  // Fetch dashboard stats - include pgId in query key for proper caching per PG
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['owner-dashboard-stats', pg?.id],
    queryFn: async () => {
      try {
        const res = await api.get('/api/owner/dashboard-stats');
        return res.data;
      } catch (error: any) {
        throw new Error(error.response?.data?.error || error.message || "Failed to fetch dashboard stats");
      }
    },
    enabled: !!pg?.id,
    staleTime: 60000, // Data stays fresh for 1 minute
    refetchInterval: 120000, // Refetch every 2 minutes
  });

  // Fetch recent activity - include pgId in query key for proper caching per PG
  const { data: activities, isLoading: activitiesLoading } = useQuery<Array<{
    id: number;
    type: string;
    title: string;
    description: string;
    createdAt: Date;
  }>>({
    queryKey: ['owner-recent-activity', pg?.id],
    queryFn: async () => {
      try {
        const res = await api.get('/api/owner/recent-activity');
        return res.data;
      } catch (error: any) {
        throw new Error(error.response?.data?.error || error.message || "Failed to fetch recent activity");
      }
    },
    enabled: !!pg?.id,
    staleTime: 60000, // Data stays fresh for 1 minute
    refetchInterval: 120000, // Refetch every 2 minutes
  });
  
  const stats = [
    { 
      label: "Total Tenants", 
      value: statsLoading ? "..." : statsData?.totalTenants?.toString() || "0", 
      icon: Users, 
      gradient: "from-blue-500 to-cyan-600"
    },
    { 
      label: "Revenue", 
      value: statsLoading ? "..." : `₹${statsData?.revenue?.toLocaleString('en-IN') || '0'}`, 
      icon: Wallet, 
      gradient: "from-emerald-500 to-green-600"
    },
    { 
      label: "Pending Dues", 
      value: statsLoading ? "..." : `₹${statsData?.pendingDues?.toLocaleString('en-IN') || '0'}`, 
      icon: AlertCircle, 
      gradient: "from-orange-500 to-red-600"
    },
    { 
      label: "Occupancy", 
      value: statsLoading ? "..." : `${statsData?.occupancyRate || 0}%`, 
      icon: TrendingUp, 
      gradient: "from-purple-500 to-pink-600"
    },
  ];

  return (
    <MobileLayout title="Dashboard">
      {/* Hero Section with Gradient */}
      <div className="relative -mx-4 -mt-6 mb-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-blue-600 to-purple-700" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(120,119,198,0.3),rgba(255,255,255,0))]" />
        
        <div className="relative px-6 py-8 text-white">
          <div className="mb-6">
            <p className="text-white/80 text-sm mb-2">Welcome back,</p>
            <h2 className="text-3xl font-bold tracking-tight mb-4">Owner Dashboard</h2>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-3">
            <Button 
              onClick={() => navigate("/tenants/add")} 
              className="bg-white/20 backdrop-blur-sm border-white/30 hover:bg-white/30 text-white h-11"
              data-testid="button-add-tenant"
            >
              <UserPlus className="mr-2 w-4 h-4" /> Add Tenant
            </Button>
            <Button 
              onClick={() => navigate("/rooms/add")}
              className="bg-white/20 backdrop-blur-sm border-white/30 hover:bg-white/30 text-white h-11"
              data-testid="button-add-room"
            >
              <Building2 className="mr-2 w-4 h-4" /> Add Room
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Grid with Enhanced Design */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {stats.map((stat, i) => (
          <Card key={i} className="group relative overflow-hidden border-2 hover:border-purple-200 hover:shadow-xl transition-all duration-300" data-testid={`card-stat-${stat.label.toLowerCase().replace(/\s+/g, "-")}`}>
            <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-blue-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <CardContent className="relative p-4">
              <div className="flex items-start justify-between mb-3">
                <div className={cn(
                  "w-11 h-11 rounded-xl flex items-center justify-center shadow-lg transition-transform duration-300 group-hover:scale-110",
                  `bg-gradient-to-br ${stat.gradient}`
                )}>
                  <stat.icon className="w-5 h-5 text-white" />
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-semibold mb-1">{stat.label}</p>
                <h3 className={cn(
                  "text-2xl font-bold bg-gradient-to-r bg-clip-text text-transparent",
                  `${stat.gradient}`
                )}>{stat.value}</h3>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Activity with Enhanced Design */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">Recent Activity</h2>
        </div>
        
        {activitiesLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
          </div>
        ) : !activities || activities.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-sm">No recent activity</p>
          </div>
        ) : (
          <div className="space-y-3">
            {activities.map((activity) => {
              const iconMap: Record<string, typeof Wallet> = {
                payment: Wallet,
                tenant: UserPlus,
                complaint: AlertCircle,
              };
              const gradientMap: Record<string, string> = {
                payment: "from-emerald-500 to-green-600",
                tenant: "from-blue-500 to-cyan-600",
                complaint: "from-orange-500 to-red-600",
              };
              const ActivityIcon = iconMap[activity.type] || AlertCircle;
              const gradient = gradientMap[activity.type] || "from-gray-500 to-gray-600";
              
              return (
                <div key={activity.id} className="group flex items-start gap-3 p-4 bg-gradient-to-r from-white to-gray-50 hover:from-purple-50 hover:to-blue-50 rounded-xl border-2 border-transparent hover:border-purple-200 shadow-sm hover:shadow-lg transition-all duration-300" data-testid={`activity-${activity.id}`}>
                  <div className={cn(
                    "w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-md transition-transform duration-300 group-hover:scale-110",
                    `bg-gradient-to-br ${gradient}`
                  )}>
                    <ActivityIcon className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-sm truncate text-gray-800">{activity.title}</h4>
                    <p className="text-xs text-muted-foreground truncate">{activity.description}</p>
                  </div>
                  <span className="text-xs text-muted-foreground font-medium whitespace-nowrap">{format(new Date(activity.createdAt), 'MMM d')}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </MobileLayout>
  );
}

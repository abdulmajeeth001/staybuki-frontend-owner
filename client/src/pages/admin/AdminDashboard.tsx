import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, Clock, CreditCard, DollarSign, AlertTriangle, Users, TrendingUp, CheckCircle, BarChart3, Sparkles } from "lucide-react";
import { useLocation } from "wouter";
import DesktopLayout from "@/components/layout/DesktopLayout";
import MobileLayout from "@/components/layout/MobileLayout";
import { useIsMobile } from "@/hooks/use-mobile";
import { motion } from "framer-motion";

interface AdminStats {
  totalPgs: number;
  pendingApprovals: number;
  approvedPgs: number;
  rejectedPgs: number;
  activePgs: number;
  activeSubscriptions: number;
  totalRevenue: number;
  totalTenants: number;
  totalComplaints: number;
  openComplaints: number;
}

export default function AdminDashboard() {
  const isMobile = useIsMobile();
  const [, navigate] = useLocation();

  const { data: stats, isLoading } = useQuery<AdminStats>({
    queryKey: ["/api/admin/stats"],
  });

  const statCards = [
    {
      title: "Total PGs",
      value: stats?.totalPgs || 0,
      icon: Building2,
      description: "Registered properties",
      color: "text-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-950/30",
      borderColor: "border-blue-200 dark:border-blue-800",
      trend: "+12%",
    },
    {
      title: "Pending Approvals",
      value: stats?.pendingApprovals || 0,
      icon: Clock,
      description: "Awaiting review",
      color: "text-orange-600",
      bgColor: "bg-orange-50 dark:bg-orange-950/30",
      borderColor: "border-orange-200 dark:border-orange-800",
      action: () => navigate("/admin-pgs?filter=pending"),
      highlight: (stats?.pendingApprovals || 0) > 0,
    },
    {
      title: "Active PGs",
      value: stats?.activePgs || 0,
      icon: CheckCircle,
      description: "Currently operational",
      color: "text-green-600",
      bgColor: "bg-green-50 dark:bg-green-950/30",
      borderColor: "border-green-200 dark:border-green-800",
    },
    {
      title: "Total Revenue",
      value: `₹${(stats?.totalRevenue || 0).toLocaleString('en-IN')}`,
      icon: DollarSign,
      description: "Lifetime earnings",
      color: "text-purple-600",
      bgColor: "bg-purple-50 dark:bg-purple-950/30",
      borderColor: "border-purple-200 dark:border-purple-800",
      trend: "+8%",
    },
    {
      title: "Total Tenants",
      value: stats?.totalTenants || 0,
      icon: Users,
      description: "Platform-wide",
      color: "text-teal-600",
      bgColor: "bg-teal-50 dark:bg-teal-950/30",
      borderColor: "border-teal-200 dark:border-teal-800",
    },
    {
      title: "Open Complaints",
      value: stats?.openComplaints || 0,
      icon: AlertTriangle,
      description: `${stats?.totalComplaints || 0} total`,
      color: "text-red-600",
      bgColor: "bg-red-50 dark:bg-red-950/30",
      borderColor: "border-red-200 dark:border-red-800",
      action: () => navigate("/admin-complaints"),
      highlight: (stats?.openComplaints || 0) > 0,
    },
  ];

  const content = (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground" data-testid="text-admin-dashboard-title">
          Admin Dashboard
        </h1>
        <p className="text-sm md:text-base text-muted-foreground mt-2">
          Platform overview and management
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="border-border">
              <CardHeader className="space-y-3 pb-4">
                <div className="flex items-center justify-between">
                  <div className="h-4 bg-muted rounded w-1/2 animate-pulse" />
                  <div className="h-10 w-10 bg-muted rounded-lg animate-pulse" />
                </div>
                <div className="h-8 bg-muted rounded w-1/3 animate-pulse" />
                <div className="h-3 bg-muted rounded w-2/3 animate-pulse" />
              </CardHeader>
            </Card>
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {statCards.map((stat, index) => (
              <motion.div
                key={stat.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <Card
                  className={`
                    ${stat.action ? "cursor-pointer hover:shadow-lg transition-all duration-300" : ""}
                    ${stat.highlight ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : ""}
                    border-border hover:border-primary/50
                  `}
                  onClick={stat.action}
                  data-testid={`card-stat-${stat.title.toLowerCase().replace(/\s+/g, "-")}`}
                >
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      {stat.title}
                    </CardTitle>
                    <div className={`p-2.5 rounded-xl ${stat.bgColor} border ${stat.borderColor}`}>
                      <stat.icon className={`h-5 w-5 ${stat.color}`} />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-1">
                    <div className="flex items-baseline justify-between">
                      <div className="text-2xl md:text-3xl font-bold text-foreground" data-testid={`text-stat-value-${stat.title.toLowerCase().replace(/\s+/g, "-")}`}>
                        {stat.value}
                      </div>
                      {stat.trend && (
                        <div className="flex items-center text-xs font-medium text-green-600">
                          <TrendingUp className="h-3 w-3 mr-1" />
                          {stat.trend}
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {stat.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="text-lg md:text-xl">Quick Actions</CardTitle>
                <CardDescription>Common administrative tasks</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  className="w-full justify-start h-11"
                  variant={stats?.pendingApprovals ? "default" : "outline"}
                  onClick={() => navigate("/admin-pgs?filter=pending")}
                  data-testid="button-view-pending-pgs"
                >
                  <Clock className="mr-2 h-4 w-4" />
                  View Pending Approvals ({stats?.pendingApprovals || 0})
                </Button>
                <Button
                  className="w-full justify-start h-11"
                  variant="outline"
                  onClick={() => navigate("/admin-pgs")}
                  data-testid="button-view-all-pgs"
                >
                  <Building2 className="mr-2 h-4 w-4" />
                  Manage All PGs ({stats?.totalPgs || 0})
                </Button>
                <Button
                  className="w-full justify-start h-11"
                  variant="outline"
                  onClick={() => navigate("/admin-subscriptions")}
                  data-testid="button-manage-subscriptions"
                >
                  <CreditCard className="mr-2 h-4 w-4" />
                  Manage Subscriptions
                </Button>
                <Button
                  className="w-full justify-start h-11"
                  variant="outline"
                  onClick={() => navigate("/admin-complaints")}
                  data-testid="button-view-complaints"
                >
                  <AlertTriangle className="mr-2 h-4 w-4" />
                  View All Complaints ({stats?.totalComplaints || 0})
                </Button>
                <Button
                  className="w-full justify-start h-11 mt-2"
                  variant="outline"
                  onClick={() => navigate("/admin-owner-analytics")}
                  data-testid="button-owner-analytics"
                >
                  <BarChart3 className="mr-2 h-4 w-4" />
                  Owner & PG Analytics
                </Button>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardHeader>
                <CardTitle className="text-lg md:text-xl">Platform Overview</CardTitle>
                <CardDescription>Key metrics at a glance</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                    <div>
                      <span className="text-sm font-medium text-foreground">Approval Rate</span>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {stats?.totalPgs ? Math.round(((stats.approvedPgs || 0) / stats.totalPgs) * 100) : 0}% approved
                      </p>
                    </div>
                    <div className="text-2xl font-bold text-green-600">
                      {stats?.approvedPgs || 0}/{stats?.totalPgs || 0}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                    <div>
                      <span className="text-sm font-medium text-foreground">Active Subscriptions</span>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Monthly recurring
                      </p>
                    </div>
                    <div className="text-2xl font-bold text-purple-600">
                      {stats?.activeSubscriptions || 0}
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                    <div>
                      <span className="text-sm font-medium text-foreground">Complaint Resolution</span>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {stats?.totalComplaints ? Math.round(((stats.totalComplaints - (stats.openComplaints || 0)) / stats.totalComplaints) * 100) : 0}% resolved
                      </p>
                    </div>
                    <div className="text-2xl font-bold text-teal-600">
                      {stats?.totalComplaints ? stats.totalComplaints - (stats.openComplaints || 0) : 0}/{stats?.totalComplaints || 0}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );

  return isMobile ? (
    <MobileLayout title="Admin Dashboard">{content}</MobileLayout>
  ) : (
    <DesktopLayout>{content}</DesktopLayout>
  );
}

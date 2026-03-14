import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import MobileLayout from "@/components/layout/MobileLayout";
import DesktopLayout from "@/components/layout/DesktopLayout";
import { useIsMobile } from "@/hooks/use-mobile";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Home,
  User,
  Wallet,
  Building2,
  Lightbulb,
  AlertCircle,
} from "lucide-react";
import { tenantApi } from "@/api/tenantApi";
import { getApiErrorMessage } from "@/utils/apiError";

export default function TenantDashboard() {
  const isMobile = useIsMobile();
  const Layout = isMobile ? MobileLayout : DesktopLayout;

  const [, navigate] = useLocation();
  const [tenantData, setTenantData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkOnboardingStatus();
  }, []);

  const checkOnboardingStatus = async (): Promise<void> => {
  try {
    setLoading(true);

    const data = await tenantApi.getOnboardingStatus();

    if (!data.isOnboarded) {
      navigate("/tenant-search-pgs", { replace: true });
      return;
    }

    await fetchTenantData();
  } catch (error: unknown) {
    console.error("Failed to check onboarding status:", error);
    const message = getApiErrorMessage(error);

    // optional UX
    // toast.error(message);
  } finally {
    setLoading(false);
  }
};
  
  const fetchTenantData = async (): Promise<void> => {
  try {
    setLoading(true);

    const data = await tenantApi.getDashboard();
    setTenantData(data);
  } catch (error: unknown) {
    console.error("Failed to fetch tenant dashboard:", error);
    const message = getApiErrorMessage(error);
    // toast.error(message);
  } finally {
    setLoading(false);
  }
};

  if (loading) {
    return (
      <Layout title="Dashboard" showNav={!isMobile ? false : undefined}>
        <div className={isMobile ? "" : "flex items-center justify-center h-64"}>Loading...</div>
      </Layout>
    );
  }

  const menuItems = [
    {
      label: "Profile",
      icon: User,
      href: "/tenant-profile",
      color: "bg-blue-100 text-blue-600",
    },
    {
      label: "Room Details",
      icon: Home,
      href: "/tenant-room",
      color: "bg-emerald-100 text-emerald-600",
    },
    {
      label: "Payments",
      icon: Wallet,
      href: "/tenant-payments",
      color: "bg-purple-100 text-purple-600",
    },
    {
      label: "Complaints",
      icon: AlertCircle,
      href: "/tenant-complaints",
      color: "bg-red-100 text-red-600",
    },
    {
      label: "PG Details",
      icon: Building2,
      href: "/tenant-pg",
      color: "bg-orange-100 text-orange-600",
    },
    {
      label: "Facilities",
      icon: Lightbulb,
      href: "/tenant-facilities",
      color: "bg-pink-100 text-pink-600",
    },
  ];

  return (
    <Layout title="Dashboard" showNav={!isMobile ? false : undefined}>
      <DashboardContent tenantData={tenantData} menuItems={menuItems} isDesktop={!isMobile} />
    </Layout>
  );
}

function DashboardContent({ tenantData, menuItems, isDesktop }: { tenantData: any, menuItems: any[], isDesktop: boolean }) {
  const [, navigate] = useLocation();

  return (
    <>
      {/* Hero Welcome Section with Gradient */}
      <div className={isDesktop ? "relative -mx-6 -mt-6 mb-8 overflow-hidden rounded-b-3xl" : "relative -mx-4 -mt-6 mb-6 overflow-hidden"}>
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-blue-600 to-purple-700" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAgTSAwIDIwIEwgNDAgMjAgTSAyMCAwIEwgMjAgNDAgTSAwIDMwIEwgNDAgMzAgTSAzMCAwIEwgMzAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjAzIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-20" />
        
        <div className={isDesktop ? "relative px-8 py-10 text-white" : "relative px-6 py-8 text-white"}>
          <div className="mb-6">
            <p className="text-white/80 text-sm mb-2">Welcome back,</p>
            <h2 className="text-3xl font-bold tracking-tight mb-2">{tenantData?.name}</h2>
            <div className="flex items-center gap-2 text-white/90">
              <Home className="w-4 h-4" />
              <p className="text-sm">Room {tenantData?.roomNumber}</p>
            </div>
          </div>

          {/* Rent Quick Info */}
          {tenantData?.monthlyRent && (
            <Card className="backdrop-blur-sm bg-white/95 border-white/20 shadow-2xl max-w-md">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
                      Monthly Rent
                    </p>
                    <p className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                      ₹{parseInt(tenantData?.monthlyRent).toLocaleString()}
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                    <Wallet className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Quick Actions Grid */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-gray-800">Quick Actions</h3>
        <div className={`grid ${isDesktop ? "grid-cols-3 lg:grid-cols-4" : "grid-cols-2"} gap-4`}>
          {menuItems.map((item, index) => (
            <div
              key={item.href}
              onClick={() => navigate(item.href)}
              className="block cursor-pointer group"
              data-testid={`link-dashboard-${item.label.toLowerCase().replace(" ", "-")}`}
            >
              <Card className="relative h-full border-2 hover:border-purple-200 hover:shadow-xl transition-all duration-300 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-blue-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <CardContent className="relative p-5 flex flex-col items-center justify-center gap-3 h-full">
                  <div className={`w-14 h-14 rounded-xl flex items-center justify-center shadow-md ${item.color} group-hover:scale-110 transition-transform duration-300`}>
                    <item.icon className="w-7 h-7" />
                  </div>
                  <p className="text-sm font-semibold text-center text-gray-700">{item.label}</p>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

import { useEffect, useState } from "react";
import MobileLayout from "@/components/layout/MobileLayout";
import DesktopLayout from "@/components/layout/DesktopLayout";
import { useIsMobile } from "@/hooks/use-mobile";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Building2, MapPin, Navigation, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { tenantService } from "@/services/tenantService";
import type { PgResponse } from "@/types/tenant";

export default function TenantPgDetails() {
  const isMobile = useIsMobile();
  const Layout = isMobile ? MobileLayout : DesktopLayout;

  const [pg, setPg] = useState<PgResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPgDetails();
  }, []);

  const fetchPgDetails = async () => {
    try {
      const data = await tenantService.getTenantPg();
      setPg(data || null);
    } catch (err) {
      console.error("Failed to fetch PG details:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout title="PG Details">
        <PgDetailsSkeleton />
      </Layout>
    );
  }

  if (!pg) {
    const EmptyState = (
      <Card className="text-center py-12 border-2 border-dashed">
        <CardContent>
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
            <AlertCircle className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-xl font-bold mb-2 text-gray-800">No PG Details</h3>
          <p className="text-sm text-gray-600">
            PG information is currently unavailable.
          </p>
        </CardContent>
      </Card>
    );

    return (
      <Layout title="PG Details">
        {EmptyState}
      </Layout>
    );
  }

  return (
    <Layout title="PG Details">
      <PgDetailsContent pg={pg} isDesktop={!isMobile} />
    </Layout>
  );
}

function PgDetailsSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-48 w-full rounded-b-3xl" />
      <div className="space-y-4 px-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    </div>
  );
}

function PgDetailsContent({ pg, isDesktop }: { pg: PgResponse; isDesktop: boolean }) {
  return (
    <div className={isDesktop ? "max-w-5xl mx-auto" : ""}>
      {/* Hero Section */}
      <div className={cn(
        "relative overflow-hidden",
        isDesktop ? "-mx-8 -mt-8 mb-8 rounded-b-3xl" : "-mx-4 -mt-6 mb-6"
      )}>
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-blue-600 to-purple-700" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(120,119,198,0.3),rgba(255,255,255,0))]" />
        
        <div className={cn("relative text-white", isDesktop ? "px-8 py-10" : "px-6 py-8")}>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center border-2 border-white/30 shadow-xl">
              <Building2 className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold drop-shadow-lg">{pg.pgName}</h1>
              <p className="text-sm text-white/90 mt-1">
                {pg.totalRooms ? `${pg.totalRooms} Rooms` : "PG Accommodation"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Details Cards */}
      <div className="space-y-4">
        <InfoCard 
          icon={MapPin}
          label="Address"
          value={pg.pgAddress}
          colorClass="text-orange-600"
          bgClass="bg-orange-100"
          testId="text-pg-address"
        />
        <InfoCard 
          icon={Navigation}
          label="Location"
          value={pg.pgLocation}
          colorClass="text-green-600"
          bgClass="bg-green-100"
          testId="text-pg-location"
        />
      </div>
    </div>
  );
}

function InfoCard({ icon: Icon, label, value, colorClass, bgClass, testId }: any) {
  return (
    <Card className="border-2 hover:border-purple-200 transition-all duration-300">
      <CardContent className="p-4 flex items-center gap-4">
        <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", bgClass)}>
          <Icon className={cn("w-6 h-6", colorClass)} />
        </div>
        <div>
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{label}</p>
          <p className="font-bold text-gray-800" data-testid={testId}>{value || "N/A"}</p>
        </div>
      </CardContent>
    </Card>
  );
}

import { useEffect, useState, useMemo } from "react";
import MobileLayout from "@/components/layout/MobileLayout";
import DesktopLayout from "@/components/layout/DesktopLayout";
import { useIsMobile } from "@/hooks/use-mobile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Wifi,
  Droplets,
  Zap,
  Tv,
  Utensils,
  Trash2,
  Lightbulb,
  Sofa,
  Check,
  X as XIcon,
  Building2,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { tenantService } from "@/services/tenantService";
import type { FacilityResponse } from "@/types/tenant";

const DEFAULT_FACILITIES = [
  { name: "WiFi", icon: Wifi, available: true },
  { name: "Water Supply", icon: Droplets, available: true },
  { name: "Electricity", icon: Zap, available: true },
  { name: "Cable TV", icon: Tv, available: false },
  { name: "Kitchen", icon: Utensils, available: true },
  { name: "Waste Management", icon: Trash2, available: true },
  { name: "Common Area", icon: Sofa, available: true },
  { name: "Laundry", icon: Lightbulb, available: false },
];

export default function TenantPgFacilities() {
  const isMobile = useIsMobile();
  const Layout = isMobile ? MobileLayout : DesktopLayout;

  // State can hold API data (FacilityResponse) or local defaults with icons
  const [facilities, setFacilities] = useState<(FacilityResponse | typeof DEFAULT_FACILITIES[0])[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFacilities();
  }, []);

  const fetchFacilities = async () => {
    try {
      const data = await tenantService.getFacilities();
      setFacilities(data);
    } catch (err) {
      console.error("Failed to fetch facilities:", err);
      // Set default facilities if API fails
      setFacilities(DEFAULT_FACILITIES);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout title="Facilities">
        <FacilitiesSkeleton />
      </Layout>
    );
  }

  return (
    <Layout title="Facilities">
      <FacilitiesContent facilities={facilities} isDesktop={!isMobile} />
    </Layout>
  );
}

function FacilitiesSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-2/3" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
      </div>
    </div>
  );
}

function FacilitiesContent({ facilities, isDesktop }: { facilities: (FacilityResponse | typeof DEFAULT_FACILITIES[0])[], isDesktop: boolean }) {
  const facilitiesToDisplay = useMemo(() => 
    facilities.length > 0 ? facilities : DEFAULT_FACILITIES,
  [facilities]);

  const { availableFacilities, unavailableFacilities } = useMemo(() => {
    return {
      availableFacilities: facilitiesToDisplay.filter((f) => f.available),
      unavailableFacilities: facilitiesToDisplay.filter((f) => !f.available)
    };
  }, [facilitiesToDisplay]);

  // Helper to resolve icon from object property or name lookup
  const getIcon = (facility: any) => {
    if (facility.icon) return facility.icon;
    const match = DEFAULT_FACILITIES.find(f => f.name.toLowerCase() === facility.name.toLowerCase());
    return match?.icon || Sparkles;
  };

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
            <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border-2 border-white/30">
              <Building2 className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold drop-shadow-lg">PG Facilities</h1>
              <p className="text-sm text-white/90 mt-1">Available amenities at your PG</p>
            </div>
          </div>

          <div className="flex items-center gap-2 mt-4">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-sm border border-white/30">
              <Check className="w-4 h-4 text-white" />
              <span className="text-sm font-semibold">{availableFacilities.length} Available</span>
            </div>
            {unavailableFacilities.length > 0 && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20">
                <XIcon className="w-4 h-4 text-white" />
                <span className="text-sm font-semibold">{unavailableFacilities.length} Unavailable</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Available Facilities */}
      {availableFacilities.length > 0 && (
        <Card className="relative mb-6 border-2 hover:shadow-xl transition-all duration-300 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-emerald-50 opacity-50" />
          <CardHeader className="relative">
            <CardTitle className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-green-600" />
              Available Facilities
            </CardTitle>
          </CardHeader>
          <CardContent className="relative p-6">
            <div className={cn("grid gap-4", isDesktop ? "grid-cols-4" : "grid-cols-2")}>
              {availableFacilities.map((facility) => (
                <FacilityCard 
                  key={facility.name}
                  facility={facility}
                  icon={getIcon(facility)}
                  isAvailable={true}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Unavailable Facilities */}
      {unavailableFacilities.length > 0 && (
        <Card className="relative border-2 overflow-hidden">
          <div className="absolute inset-0 bg-gray-50 opacity-50" />
          <CardHeader className="relative">
            <CardTitle className="text-lg font-bold text-gray-700">Not Available</CardTitle>
          </CardHeader>
          <CardContent className="relative p-6">
            <div className={cn("grid gap-4", isDesktop ? "grid-cols-4" : "grid-cols-2")}>
              {unavailableFacilities.map((facility) => (
                <FacilityCard 
                  key={facility.name}
                  facility={facility}
                  icon={getIcon(facility)}
                  isAvailable={false}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function FacilityCard({ facility, icon: Icon, isAvailable }: { facility: any, icon: any, isAvailable: boolean }) {
  return (
    <div
      className={cn(
        "relative p-4 rounded-xl border-2 transition-all duration-300 group overflow-hidden",
        isAvailable 
          ? "bg-white border-green-200 hover:border-green-300 hover:shadow-lg hover:scale-105" 
          : "bg-gray-50 border-gray-200 opacity-60"
      )}
      data-testid={`card-facility-${facility.name.toLowerCase().replace(" ", "-")}`}
    >
      {isAvailable && (
        <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-emerald-50 opacity-50" />
      )}
      
      <div className="relative flex flex-col items-center text-center gap-2">
        <div className={cn(
          "w-12 h-12 rounded-full flex items-center justify-center transition-transform duration-300",
          isAvailable 
            ? "bg-gradient-to-br from-green-500 to-emerald-600 group-hover:scale-110" 
            : "bg-gray-300"
        )}>
          <Icon className={cn("w-6 h-6", isAvailable ? "text-white" : "text-gray-500")} />
        </div>
        
        <p className={cn("font-bold text-sm", isAvailable ? "text-gray-800" : "text-gray-600")}>
          {facility.name}
        </p>
        
        <div className={cn(
          "flex items-center gap-1 px-2 py-1 rounded-full",
          isAvailable ? "bg-green-100" : "bg-gray-200"
        )}>
          {isAvailable ? (
            <>
              <Check className="w-3 h-3 text-green-600" />
              <span className="text-xs font-semibold text-green-600">Available</span>
            </>
          ) : (
            <>
              <XIcon className="w-3 h-3 text-gray-500" />
              <span className="text-xs font-semibold text-gray-500">Not Available</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

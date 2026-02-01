import { useEffect, useState } from "react";
import MobileLayout from "@/components/layout/MobileLayout";
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
import { api } from "@/apiClient";

export default function TenantPgFacilities() {
  const [facilities, setFacilities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFacilities();
  }, []);

  const fetchFacilities = async () => {
    try {
      const res = await api.get("/api/tenant/facilities");
      setFacilities(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Failed to fetch facilities:", err);
      // Set default facilities if API fails
      setFacilities([
        { name: "WiFi", icon: Wifi, available: true },
        { name: "Water Supply", icon: Droplets, available: true },
        { name: "Electricity", icon: Zap, available: true },
        { name: "Cable TV", icon: Tv, available: false },
        { name: "Kitchen", icon: Utensils, available: true },
        { name: "Waste Management", icon: Trash2, available: true },
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <MobileLayout title="Facilities">
        <div className="space-y-6">
          <Skeleton className="h-8 w-2/3" />
          <div className="grid grid-cols-2 gap-3">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
        </div>
      </MobileLayout>
    );
  }

  const defaultFacilities = [
    { name: "WiFi", icon: Wifi, available: true },
    { name: "Water Supply", icon: Droplets, available: true },
    { name: "Electricity", icon: Zap, available: true },
    { name: "Cable TV", icon: Tv, available: false },
    { name: "Kitchen", icon: Utensils, available: true },
    { name: "Waste Management", icon: Trash2, available: true },
    { name: "Common Area", icon: Sofa, available: true },
    { name: "Laundry", icon: Lightbulb, available: false },
  ];

  const facilitiesToDisplay =
    facilities.length > 0 ? facilities : defaultFacilities;

  const availableFacilities = facilitiesToDisplay.filter((f) => f.available);
  const unavailableFacilities = facilitiesToDisplay.filter((f) => !f.available);

  return (
    <MobileLayout title="Facilities">
      {/* Hero Section */}
      <div className="relative -mx-4 -mt-6 mb-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-blue-600 to-purple-700" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(120,119,198,0.3),rgba(255,255,255,0))]" />
        
        <div className="relative px-6 py-8 text-white">
          <div className="flex items-center gap-3 mb-3">
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
          <CardContent className="relative">
            <div className="grid grid-cols-2 gap-3">
              {availableFacilities.map((facility) => (
                <div
                  key={facility.name}
                  className="relative p-4 rounded-xl border-2 bg-white border-green-200 hover:border-green-300 hover:shadow-lg hover:scale-105 transition-all duration-300 group overflow-hidden"
                  data-testid={`card-facility-${facility.name.toLowerCase().replace(" ", "-")}`}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-emerald-50 opacity-50" />
                  <div className="relative flex flex-col items-center text-center gap-2">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
                      {facility.icon ? (
                        <facility.icon className="w-6 h-6 text-white" />
                      ) : null}
                    </div>
                    <p className="font-bold text-sm text-gray-800">{facility.name}</p>
                    <div className="flex items-center gap-1 px-2 py-1 bg-green-100 rounded-full">
                      <Check className="w-3 h-3 text-green-600" />
                      <span className="text-xs font-semibold text-green-600">Available</span>
                    </div>
                  </div>
                </div>
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
          <CardContent className="relative">
            <div className="grid grid-cols-2 gap-3">
              {unavailableFacilities.map((facility) => (
                <div
                  key={facility.name}
                  className="relative p-4 rounded-xl border-2 bg-gray-50 border-gray-200 opacity-60"
                  data-testid={`card-facility-${facility.name.toLowerCase().replace(" ", "-")}`}
                >
                  <div className="relative flex flex-col items-center text-center gap-2">
                    <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center">
                      {facility.icon ? (
                        <facility.icon className="w-6 h-6 text-gray-500" />
                      ) : null}
                    </div>
                    <p className="font-semibold text-sm text-gray-600">{facility.name}</p>
                    <div className="flex items-center gap-1 px-2 py-1 bg-gray-200 rounded-full">
                      <XIcon className="w-3 h-3 text-gray-500" />
                      <span className="text-xs font-semibold text-gray-500">Not Available</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </MobileLayout>
  );
}

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useIsMobile } from "@/hooks/use-mobile";
import MobileLayout from "@/components/layout/MobileLayout";
import DesktopLayout from "@/components/layout/DesktopLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Home,
  Users,
  AirVent,
  Droplets,
  DoorOpen,
  IndianRupee,
  Sparkles,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { tenantService } from "@/services/tenantService";
import type { RoomResponse } from "@/types/tenant";

export default function TenantRoomDetails() {
  const isMobile = useIsMobile();
  const Layout = isMobile ? MobileLayout : DesktopLayout;

  const { 
    data: room, 
    isLoading, 
    error 
  } = useQuery({
    queryKey: ["tenant-room-details"],
    queryFn: tenantService.getRoomDetails,
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes cache
  });

  if (isLoading) {
    return (
      <Layout title="Room Details">
        <RoomDetailsSkeleton />
      </Layout>
    );
  }

  if (error || !room) {
    const errorMessage = error instanceof Error ? error.message : "You don't have a room assigned yet. Please contact the PG owner.";
    
    return (
      <Layout title="Room Details">
        <Card className="text-center py-12">
          <CardContent>
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center">
              <Home className="w-10 h-10 text-purple-600" />
            </div>
            <h3 className="text-xl font-bold mb-2 text-gray-800">No Room Assigned</h3>
            <p className="text-sm text-gray-600">
              {errorMessage}
            </p>
          </CardContent>
        </Card>
      </Layout>
    );
  }

  return (
    <Layout title="Room Details">
      <RoomDetailsContent room={room} isDesktop={!isMobile} />
    </Layout>
  );
}

function RoomDetailsSkeleton() {
  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6">
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
      </div>
    </div>
  );
}

function RoomDetailsContent({ room, isDesktop }: { room: RoomResponse; isDesktop: boolean }) {
  const { displayAmenities, features } = useMemo(() => {
    const hasAC = room.amenities?.some((a) => a.toLowerCase().includes("ac") || a.toLowerCase().includes("air condition"));
    const hasAttachedBathroom = room.amenities?.some((a) => a.toLowerCase().includes("attached bathroom"));

    const displayAmenities = room.amenities?.filter((a) => {
      const lower = a.toLowerCase();
      return !lower.includes("ac") && !lower.includes("air condition") && !lower.includes("attached bathroom");
    });

    const features = [
      {
        label: "Sharing",
        value: `${room.sharing} people`,
        icon: Users,
        gradient: "from-blue-500 to-cyan-600",
        bgGradient: "from-blue-50 to-cyan-50",
      },
      {
        label: "Floor",
        value: `Floor ${room.floor}`,
        icon: DoorOpen,
        gradient: "from-green-500 to-emerald-600",
        bgGradient: "from-green-50 to-emerald-50",
      },
      {
        label: "AC",
        value: hasAC ? "Yes" : "No",
        icon: AirVent,
        gradient: "from-cyan-500 to-blue-600",
        bgGradient: "from-cyan-50 to-blue-50",
        available: hasAC,
      },
      {
        label: "Bathroom",
        value: hasAttachedBathroom ? "Attached" : "Common",
        icon: Droplets,
        gradient: "from-purple-500 to-pink-600",
        bgGradient: "from-purple-50 to-pink-50",
      },
    ];

    return { displayAmenities, features };
  }, [room]);

  return (
    <div className={cn("space-y-6", isDesktop ? "max-w-5xl mx-auto" : "")}>
      {/* Hero Section */}
      <div className={cn(
        "relative overflow-hidden",
        isDesktop ? "-mx-8 -mt-8 mb-8 rounded-b-3xl" : "-mx-4 -mt-6 mb-6"
      )}>
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-blue-600 to-purple-700" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(120,119,198,0.3),rgba(255,255,255,0))]" />
        
        <div className={cn("relative text-white", isDesktop ? "px-8 py-10" : "px-6 py-8")}>
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center border-2 border-white/30 shadow-xl">
              <Home className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold drop-shadow-lg">Room {room.roomNumber}</h1>
              <p className="text-sm md:text-base text-white/90 mt-1">Your assigned accommodation</p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex items-center gap-3 p-4 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 min-w-[200px]">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-lg">
                <IndianRupee className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-white/80 font-medium uppercase tracking-wide">Monthly Rent</p>
                <div className="text-2xl font-bold">
                  {room.monthlyRent}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <Card className="relative mb-6 border-2 hover:shadow-xl transition-all duration-300 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-blue-50 opacity-50" />
        <CardHeader className="relative border-b bg-white/50 backdrop-blur-sm">
          <CardTitle className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            Room Features
          </CardTitle>
        </CardHeader>
        <CardContent className="relative p-6">
          <div className={cn("grid gap-4", isDesktop ? "grid-cols-4" : "grid-cols-2")}>
            {features.map((feature) => (
              <div
                key={feature.label}
                className={cn(
                  "relative p-4 rounded-xl border-2 transition-all duration-300 group overflow-hidden",
                  feature.available === false
                    ? "bg-gray-50 border-gray-200 opacity-60"
                    : "bg-white border-purple-200 hover:border-purple-300 hover:shadow-lg hover:scale-105"
                )}
              >
                {feature.available !== false && (
                  <div className={cn("absolute inset-0 bg-gradient-to-br opacity-30", feature.bgGradient)} />
                )}
                <div className="relative flex flex-col items-center text-center gap-3">
                  <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center transition-transform duration-300 shadow-sm",
                    feature.available === false
                      ? "bg-gray-200"
                      : `bg-gradient-to-br ${feature.gradient} group-hover:scale-110`
                  )}>
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-1">{feature.label}</p>
                    <p
                      className="font-bold text-base text-gray-800"
                      data-testid={`text-room-${feature.label.toLowerCase()}`}
                    >
                      {feature.value}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Amenities */}
      {displayAmenities && displayAmenities.length > 0 && (
        <Card className="relative border-2 hover:shadow-xl transition-all duration-300 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-purple-50 opacity-50" />
          <CardHeader className="relative border-b bg-white/50 backdrop-blur-sm">
            <CardTitle className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <Check className="w-5 h-5 text-blue-600" />
              Additional Amenities
            </CardTitle>
          </CardHeader>
          <CardContent className="relative p-6">
            <div className="flex flex-wrap gap-3">
              {displayAmenities.map((amenity: string) => (
                <span
                  key={amenity}
                  className="px-4 py-2 bg-white border-2 border-purple-100 text-purple-700 rounded-full text-sm font-semibold shadow-sm hover:shadow-md hover:border-purple-300 hover:bg-purple-50 transition-all duration-300 flex items-center gap-2"
                  data-testid={`tag-amenity-${amenity.toLowerCase()}`}
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                  {amenity}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

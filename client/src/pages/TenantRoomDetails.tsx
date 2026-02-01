import { useEffect, useState } from "react";
import MobileLayout from "@/components/layout/MobileLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Home,
  Users,
  AirVent,
  Droplets,
  Wind,
  DoorOpen,
  IndianRupee,
  Sparkles,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/apiClient";

export default function TenantRoomDetails() {
  const [room, setRoom] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRoomDetails();
  }, []);

  const fetchRoomDetails = async () => {
    try {
      const res = await api.get("/api/tenant/room");
      setRoom(res.data);
    } catch (err: any) {
      console.error("Failed to fetch room details:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <MobileLayout title="Room Details">
        <div className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <Skeleton className="h-24 w-full" />
            </CardContent>
          </Card>
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

  if (!room) {
    return (
      <MobileLayout title="Room Details">
        <Card className="text-center py-12">
          <CardContent>
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center">
              <Home className="w-10 h-10 text-purple-600" />
            </div>
            <h3 className="text-xl font-bold mb-2 text-gray-800">No Room Assigned</h3>
            <p className="text-sm text-gray-600">
              You don't have a room assigned yet. Please contact the PG owner.
            </p>
          </CardContent>
        </Card>
      </MobileLayout>
    );
  }

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
      value: room.hasAC ? "Yes" : "No",
      icon: AirVent,
      gradient: "from-cyan-500 to-blue-600",
      bgGradient: "from-cyan-50 to-blue-50",
      available: room.hasAC,
    },
    {
      label: "Bathroom",
      value: room.hasAttachedBathroom ? "Attached" : "Common",
      icon: Droplets,
      gradient: "from-purple-500 to-pink-600",
      bgGradient: "from-purple-50 to-pink-50",
    },
  ];

  return (
    <MobileLayout title="Room Details">
      {/* Hero Section */}
      <div className="relative -mx-4 -mt-6 mb-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-blue-600 to-purple-700" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(120,119,198,0.3),rgba(255,255,255,0))]" />
        
        <div className="relative px-6 py-8 text-white">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border-2 border-white/30">
              <Home className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold drop-shadow-lg">Room {room.roomNumber}</h1>
              <p className="text-sm text-white/90 mt-1">Your assigned accommodation</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 p-4 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20">
            <div className="flex-1">
              <p className="text-xs text-white/80 mb-1">Monthly Rent</p>
              <div className="flex items-center gap-1 text-2xl font-bold">
                <IndianRupee className="w-5 h-5" />
                {room.monthlyRent}
              </div>
            </div>
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center">
              <Check className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <Card className="relative mb-6 border-2 hover:shadow-xl transition-all duration-300 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-blue-50 opacity-50" />
        <CardHeader className="relative">
          <CardTitle className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            Room Features
          </CardTitle>
        </CardHeader>
        <CardContent className="relative">
          <div className="grid grid-cols-2 gap-3">
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
                <div className="relative flex flex-col items-center text-center gap-2">
                  <div className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center transition-transform duration-300",
                    feature.available === false
                      ? "bg-gray-300"
                      : `bg-gradient-to-br ${feature.gradient} group-hover:scale-110`
                  )}>
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <p className="text-xs text-gray-600 font-medium">{feature.label}</p>
                  <p
                    className="font-bold text-sm text-gray-800"
                    data-testid={`text-room-${feature.label.toLowerCase()}`}
                  >
                    {feature.value}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Amenities */}
      {room.amenities && room.amenities.length > 0 && (
        <Card className="relative border-2 hover:shadow-xl transition-all duration-300 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-purple-50 opacity-50" />
          <CardHeader className="relative">
            <CardTitle className="text-xl font-bold text-gray-800">Additional Amenities</CardTitle>
          </CardHeader>
          <CardContent className="relative">
            <div className="flex flex-wrap gap-2">
              {room.amenities.map((amenity: string) => (
                <span
                  key={amenity}
                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-full text-sm font-semibold shadow-md hover:shadow-lg transition-shadow duration-300"
                  data-testid={`tag-amenity-${amenity.toLowerCase()}`}
                >
                  {amenity}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </MobileLayout>
  );
}

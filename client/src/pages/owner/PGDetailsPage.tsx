import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import MobileLayout from "@/components/layout/MobileLayout";
import DesktopLayout from "@/components/layout/DesktopLayout";
import { useIsMobile } from "@/hooks/use-mobile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MapPin,
  Star,
  Utensils,
  Car,
  Wind,
  Camera,
  Wifi,
  Shirt,
  Dumbbell,
  Check,
  X as XIcon,
  ArrowLeft,
  Building2,
  Home as HomeIcon,
  Calendar,
  Clock,
  DoorOpen,
  Users,
  IndianRupee,
  Sparkles,
  Bed,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { useUser } from "@/hooks/use-user";
import { api } from "@/apiClient";

interface BedPosition {
  id: number;
  position: string;
  displayOrder: number;
  status: string;
  tenantId: number | null;
}

interface Room {
  id: number;
  roomNumber: string;
  monthlyRent: string;
  sharing: number;
  floor: number;
  hasAttachedBathroom: boolean;
  hasAC: boolean;
  status: string;
  tenantIds: number[];
  beds?: BedPosition[];
}

interface PGDetails {
  id: number;
  pgName: string;
  pgAddress: string;
  pgLocation: string;
  latitude: string | null;
  longitude: string | null;
  imageUrl: string | null;
  pgType: string;
  hasFood: boolean;
  hasParking: boolean;
  hasAC: boolean;
  hasCCTV: boolean;
  hasWifi: boolean;
  hasLaundry: boolean;
  hasGym: boolean;
  averageRating: string;
  totalRatings: number;
  ownerId: number;
  availableRooms: Room[];
}

const AMENITY_ICONS = {
  hasFood: { icon: Utensils, label: "Food" },
  hasParking: { icon: Car, label: "Parking" },
  hasAC: { icon: Wind, label: "AC" },
  hasCCTV: { icon: Camera, label: "CCTV" },
  hasWifi: { icon: Wifi, label: "WiFi" },
  hasLaundry: { icon: Shirt, label: "Laundry" },
  hasGym: { icon: Dumbbell, label: "Gym" },
};

const TIME_SLOTS = [
  { value: "morning", label: "Morning (9:00 AM - 12:00 PM)" },
  { value: "afternoon", label: "Afternoon (12:00 PM - 4:00 PM)" },
  { value: "evening", label: "Evening (4:00 PM - 7:00 PM)" },
];

export default function PGDetailsPage() {
  const isMobile = useIsMobile();
  const Layout = isMobile ? MobileLayout : DesktopLayout;
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const { user } = useUser();
  
  const [showVisitModal, setShowVisitModal] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [visitDate, setVisitDate] = useState("");
  const [visitTime, setVisitTime] = useState("");
  const [visitNotes, setVisitNotes] = useState("");
  const [visitGender, setVisitGender] = useState("");
  const [roomBeds, setRoomBeds] = useState<Record<number, BedPosition[]>>({});

  const pgId = parseInt(id || "0");

  // Fetch PG details
  const { data: pg, isLoading, error } = useQuery<PGDetails>({
    queryKey: ["/api/tenant/pgs", pgId],
    queryFn: async () => {
      try {
        const res = await api.get(`/api/tenant/pgs/${pgId}`);
        return res.data;
      } catch (err: any) {
        if (err.response?.status === 404) throw new Error("PG not found");
        throw new Error(err.response?.data?.error || err.message || "Failed to fetch PG details");
      }
    },
    enabled: !!pgId,
  });

  // Fetch existing visit requests to check for pending ones
  const { data: visitRequests } = useQuery<any[]>({
    queryKey: ["/api/tenant/visit-requests"],
    queryFn: async () => {
      try {
        const res = await api.get("/api/tenant/visit-requests");
        return res.data;
      } catch (err: any) {
        throw new Error(err.response?.data?.error || err.message || "Failed to fetch visit requests");
      }
    },
  });

  // Check if there's a pending request for this PG
  const hasPendingRequest = visitRequests?.some(
    (req) =>
      req.pgId === pgId &&
      (req.status === "pending" || req.status === "approved" || req.status === "rescheduled")
  );

  // Fetch bed positions for rooms when PG data is loaded
  useEffect(() => {
    const fetchBeds = async () => {
      if (!pg?.availableRooms?.length) return;
      
      const bedsData: Record<number, BedPosition[]> = {};
      await Promise.all(
        pg.availableRooms.map(async (room) => {
          try {
            const res = await api.get(`/api/rooms/${room.id}/beds`);
            bedsData[room.id] = res.data;
          } catch (err) {
            console.error(`Failed to fetch beds for room ${room.id}:`, err);
          }
        })
      );
      setRoomBeds(bedsData);
    };
    fetchBeds();
  }, [pg?.availableRooms]);

  // Create visit request mutation
  const createVisitRequest = useMutation({
    mutationFn: async (data: {
      pgId: number;
      roomId?: number;
      requestedDate: string;
      requestedTime: string;
      notes?: string;
      gender?: string;
    }) => {
      const res = await api.post("/api/tenant/visit-requests", data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tenant/visit-requests"] });
      toast({
        title: "Visit Request Submitted",
        description: "Your visit request has been sent to the PG owner. You'll be notified once it's reviewed.",
      });
      setShowVisitModal(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.error || error.message || "Failed to create visit request",
        variant: "destructive",
      });
    },
  });

  const handleRequestVisit = (room?: Room) => {
    if (hasPendingRequest) {
      toast({
        title: "Pending Request Exists",
        description: "You already have a pending visit request for this PG. Please wait for the owner's response.",
        variant: "destructive",
      });
      return;
    }
    setSelectedRoom(room || null);
    setShowVisitModal(true);
  };

  // Check if this is a gender-restricted PG and user needs to provide gender
  const isGenderRestrictedPG = pg?.pgType === "boys" || pg?.pgType === "girls";
  const userHasGender = !!user?.gender;
  const needsGenderInput = isGenderRestrictedPG && !userHasGender;

  const handleSubmitVisit = () => {
    if (!visitDate || !visitTime) {
      toast({
        title: "Missing Information",
        description: "Please select a date and time for your visit.",
        variant: "destructive",
      });
      return;
    }

    // Validate gender for gender-restricted PGs
    if (needsGenderInput && !visitGender) {
      toast({
        title: "Gender Required",
        description: "Please select your gender to continue with this visit request.",
        variant: "destructive",
      });
      return;
    }

    createVisitRequest.mutate({
      pgId,
      roomId: selectedRoom?.id,
      requestedDate: visitDate,
      requestedTime: visitTime,
      notes: visitNotes,
      gender: needsGenderInput ? visitGender : undefined,
    });
  };

  const resetForm = () => {
    setVisitDate("");
    setVisitTime("");
    setVisitNotes("");
    setVisitGender("");
    setSelectedRoom(null);
  };

  if (isLoading) {
    return (
      <Layout title="PG Details" showNav={true}>
        <div className={cn("space-y-6", !isMobile ? "max-w-5xl mx-auto mt-8" : "")}>
          <Card>
            <CardContent className="p-6">
              <Skeleton className="h-8 w-3/4 mb-4" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-2/3" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <Skeleton className="h-32 w-full" />
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  if (error || !pg) {
    return (
      <Layout title="PG Details" showNav={true}>
        <div className={cn(!isMobile ? "max-w-5xl mx-auto mt-8" : "")}>
          <Card className="text-center py-12">
          <CardContent>
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center">
              <Building2 className="w-10 h-10 text-purple-600" />
            </div>
            <h3 className="text-xl font-bold mb-2 text-gray-800" data-testid="text-error">
              {error?.message || "PG not found"}
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              The PG you're looking for doesn't exist or you don't have access to it.
            </p>
            <Button 
              onClick={() => navigate("/tenant-search-pgs")} 
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-lg"
              data-testid="button-back-to-search"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Search
            </Button>
          </CardContent>
        </Card>
        </div>
      </Layout>
    );
  }

  const rating = parseFloat(pg.averageRating);

  return (
    <Layout
      title="PG Details"
      showNav={true}
      action={
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/tenant-search-pgs")}
          data-testid="button-back"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
      }
    >
      <div className={cn(!isMobile ? "max-w-5xl mx-auto" : "")}>
        {/* Full-Bleed Hero Image Section */}
        <div className={cn("relative overflow-hidden mb-6", !isMobile ? "-mx-8 -mt-8 rounded-b-3xl" : "-mx-4 -mt-6")} data-testid="card-pg-header">
          {/* Hero Image */}
          <div className="relative h-64 overflow-hidden">
          {pg.imageUrl ? (
            <>
              <img
                src={pg.imageUrl}
                alt={pg.pgName}
                className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                data-testid="img-pg"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
            </>
          ) : (
            <>
              <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-blue-600 to-purple-700" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(120,119,198,0.3),rgba(255,255,255,0))]" />
            </>
          )}
          
          {/* Overlay Content */}
          <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
            <div className="flex items-center gap-2 mb-3">
              <Badge
                className={cn(
                  "capitalize text-white border-white/30 backdrop-blur-sm",
                  pg.pgType === "male" && "bg-blue-600/80",
                  pg.pgType === "female" && "bg-pink-600/80",
                  pg.pgType === "common" && "bg-purple-600/80"
                )}
                data-testid="badge-pg-type"
              >
                {pg.pgType}
              </Badge>
              
              {rating > 0 && (
                <Badge className="gap-1 bg-white/20 text-white border-white/30 backdrop-blur-sm" data-testid="badge-rating">
                  <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                  {rating.toFixed(1)} ({pg.totalRatings})
                </Badge>
              )}
            </div>
            
            <h1 className="text-3xl font-bold mb-3 drop-shadow-lg" data-testid="text-pg-name">
              {pg.pgName}
            </h1>
            
            <div className="space-y-1">
              <p className="text-sm flex items-center gap-2 drop-shadow">
                <MapPin className="w-4 h-4" />
                <span data-testid="text-pg-address">{pg.pgAddress}</span>
              </p>
              <p className="text-sm flex items-center gap-2 drop-shadow">
                <HomeIcon className="w-4 h-4" />
                <span data-testid="text-pg-location">{pg.pgLocation}</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Amenities Section */}
      <Card className="relative mb-6 border-2 hover:shadow-xl transition-all duration-300 overflow-hidden" data-testid="card-amenities">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-blue-50 opacity-50" />
        <CardHeader className="relative">
          <CardTitle className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            Amenities & Facilities
          </CardTitle>
        </CardHeader>
        <CardContent className="relative">
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(AMENITY_ICONS).map(([key, { icon: Icon, label }]) => {
              const isAvailable = pg[key as keyof PGDetails];
              return (
                <div
                  key={key}
                  className={cn(
                    "relative flex items-center gap-3 p-4 rounded-xl border-2 transition-all duration-300 group overflow-hidden",
                    isAvailable
                      ? "bg-white border-green-200 hover:border-green-300 hover:shadow-lg hover:scale-105"
                      : "bg-gray-50 border-gray-200 opacity-60"
                  )}
                  data-testid={`amenity-${key}`}
                >
                  {isAvailable && (
                    <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-emerald-50 opacity-50" />
                  )}
                  <div className={cn(
                    "relative w-10 h-10 rounded-full flex items-center justify-center transition-transform duration-300",
                    isAvailable 
                      ? "bg-gradient-to-br from-green-500 to-emerald-600 group-hover:scale-110" 
                      : "bg-gray-300"
                  )}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="relative flex-1">
                    <span className={cn(
                      "text-sm font-semibold",
                      isAvailable ? "text-gray-800" : "text-gray-400"
                    )}>
                      {label}
                    </span>
                    {isAvailable && (
                      <Check className="absolute -top-1 -right-1 w-4 h-4 text-green-600" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Available Rooms Section */}
      <Card className="relative border-2 hover:shadow-xl transition-all duration-300 overflow-hidden" data-testid="card-rooms">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-purple-50 opacity-50" />
        <CardHeader className="relative flex flex-row items-center justify-between">
          <CardTitle className="text-xl font-bold text-gray-800">Available Rooms</CardTitle>
          <Badge className="bg-gradient-to-r from-purple-600 to-blue-600 text-white" data-testid="badge-room-count">
            {pg.availableRooms.length} {pg.availableRooms.length === 1 ? "room" : "rooms"}
          </Badge>
        </CardHeader>
        <CardContent className="relative">
          {pg.availableRooms.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center">
                <DoorOpen className="w-10 h-10 text-purple-600" />
              </div>
              <p className="text-sm text-gray-600 font-medium" data-testid="text-no-rooms">
                No rooms available at the moment
              </p>
              <p className="text-xs text-gray-500 mt-2">Check back later for updates</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pg.availableRooms.map((room) => {
                const availableBeds = room.sharing - (room.tenantIds?.length || 0);
                const isFullyOccupied = availableBeds === 0;

                return (
                  <Card 
                    key={room.id} 
                    className="relative border-2 hover:shadow-xl transition-all duration-300 overflow-hidden group" 
                    data-testid={`card-room-${room.id}`}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-blue-50 opacity-40 group-hover:opacity-60 transition-opacity duration-300" />
                    <CardContent className="relative p-5">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h4 className="text-xl font-bold text-gray-800 mb-2" data-testid={`text-room-number-${room.id}`}>
                            Room {room.roomNumber}
                          </h4>
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="outline" className="border-purple-300 text-purple-700 bg-white" data-testid={`badge-sharing-${room.id}`}>
                              <Users className="w-3 h-3 mr-1" />
                              {room.sharing} Sharing
                            </Badge>
                            <Badge variant="outline" className="border-blue-300 text-blue-700 bg-white" data-testid={`badge-floor-${room.id}`}>
                              Floor {room.floor}
                            </Badge>
                            {isFullyOccupied ? (
                              <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white">
                                Fully Occupied
                              </Badge>
                            ) : (
                              <Badge className="bg-gradient-to-r from-green-500 to-emerald-600 text-white" data-testid={`badge-availability-${room.id}`}>
                                {availableBeds}/{room.sharing} beds free
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-1 text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent" data-testid={`text-rent-${room.id}`}>
                            <IndianRupee className="w-5 h-5 text-purple-600" />
                            {parseFloat(room.monthlyRent).toLocaleString("en-IN")}
                          </div>
                          <p className="text-xs text-gray-600 font-medium">per month</p>
                        </div>
                      </div>

                      {(room.hasAC || room.hasAttachedBathroom) && (
                        <div className="flex items-center gap-2 mb-4">
                          {room.hasAC && (
                            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-blue-100 to-cyan-100 border border-blue-200">
                              <Wind className="w-4 h-4 text-blue-600" />
                              <span className="text-xs font-semibold text-blue-700">AC</span>
                            </div>
                          )}
                          {room.hasAttachedBathroom && (
                            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-100 to-pink-100 border border-purple-200">
                              <DoorOpen className="w-4 h-4 text-purple-600" />
                              <span className="text-xs font-semibold text-purple-700">Attached Bathroom</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Bed Positions Display */}
                      {roomBeds[room.id] && roomBeds[room.id].length > 0 && (
                        <div className="mb-4 p-3 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border border-indigo-100">
                          <div className="flex items-center gap-2 mb-2">
                            <Bed className="w-4 h-4 text-indigo-600" />
                            <span className="text-xs font-semibold text-indigo-700">Bed Positions</span>
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            {roomBeds[room.id].map((bed) => (
                              <div 
                                key={bed.id}
                                className={cn(
                                  "p-2 rounded-lg text-center border transition-all",
                                  bed.status === "available"
                                    ? "bg-green-50 border-green-200 text-green-700"
                                    : "bg-red-50 border-red-200 text-red-600 opacity-75"
                                )}
                                data-testid={`bed-${bed.id}`}
                              >
                                <p className="text-xs font-medium truncate">{bed.position}</p>
                                <Badge 
                                  variant="secondary" 
                                  className={cn(
                                    "text-[10px] mt-1 px-1.5",
                                    bed.status === "available" 
                                      ? "bg-green-100 text-green-700" 
                                      : "bg-red-100 text-red-600"
                                  )}
                                >
                                  {bed.status === "available" ? "Free" : "Taken"}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <Button
                        onClick={() => handleRequestVisit(room)}
                        className={cn(
                          "w-full transition-all duration-300",
                          !hasPendingRequest && !isFullyOccupied
                            ? "bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-lg hover:shadow-xl"
                            : ""
                        )}
                        disabled={hasPendingRequest || isFullyOccupied}
                        data-testid={`button-request-visit-${room.id}`}
                      >
                        {hasPendingRequest
                          ? "Visit Request Pending"
                          : isFullyOccupied
                          ? "Room Full"
                          : "Request Visit"}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* General Request Visit Button */}
          {pg.availableRooms.length > 0 && (
            <div className="mt-6 pt-6 border-t-2 border-dashed border-gray-200">
              <Button
                onClick={() => handleRequestVisit()}
                variant="outline"
                className="w-full border-2 border-purple-300 hover:border-purple-400 hover:bg-purple-50 transition-all duration-300 group"
                disabled={hasPendingRequest}
                data-testid="button-request-visit-general"
              >
                <Calendar className="w-4 h-4 mr-2 text-purple-600 group-hover:scale-110 transition-transform duration-300" />
                <span className="font-semibold">
                  {hasPendingRequest ? "Visit Request Pending" : "Request General Visit"}
                </span>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Visit Request Modal */}
      <Dialog open={showVisitModal} onOpenChange={setShowVisitModal}>
        <DialogContent className="sm:max-w-md" data-testid="dialog-visit-request">
          <DialogHeader>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <DialogTitle className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Request Visit
              </DialogTitle>
            </div>
            <DialogDescription className="text-gray-600">
              {selectedRoom
                ? `Schedule a visit for Room ${selectedRoom.roomNumber}`
                : "Schedule a visit to this PG"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 mt-4">
            <div className="space-y-2">
              <Label htmlFor="visit-date" className="text-sm font-semibold text-gray-700">Preferred Date</Label>
              <Input
                id="visit-date"
                type="date"
                min={format(new Date(), "yyyy-MM-dd")}
                value={visitDate}
                onChange={(e) => setVisitDate(e.target.value)}
                className="border-2 focus:border-purple-400"
                data-testid="input-visit-date"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="visit-time" className="text-sm font-semibold text-gray-700">Preferred Time</Label>
              <Select value={visitTime} onValueChange={setVisitTime}>
                <SelectTrigger id="visit-time" className="border-2 focus:border-purple-400" data-testid="select-visit-time">
                  <SelectValue placeholder="Select a time slot" />
                </SelectTrigger>
                <SelectContent>
                  {TIME_SLOTS.map((slot) => (
                    <SelectItem
                      key={slot.value}
                      value={slot.label}
                      data-testid={`time-slot-${slot.value}`}
                    >
                      {slot.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {needsGenderInput && (
              <div className="space-y-2">
                <Label htmlFor="visit-gender" className="text-sm font-semibold text-gray-700">
                  Your Gender <span className="text-red-500">*</span>
                </Label>
                <p className="text-xs text-muted-foreground mb-2">
                  This {pg?.pgType === "boys" ? "Boys Only" : "Girls Only"} PG requires gender verification
                </p>
                <Select value={visitGender} onValueChange={setVisitGender}>
                  <SelectTrigger id="visit-gender" className="border-2 focus:border-purple-400" data-testid="select-visit-gender">
                    <SelectValue placeholder="Select your gender" />
                  </SelectTrigger>
                  <SelectContent>
                    {pg?.pgType === "boys" ? (
                      <SelectItem value="male" data-testid="gender-male">Male</SelectItem>
                    ) : pg?.pgType === "girls" ? (
                      <SelectItem value="female" data-testid="gender-female">Female</SelectItem>
                    ) : (
                      <>
                        <SelectItem value="male" data-testid="gender-male">Male</SelectItem>
                        <SelectItem value="female" data-testid="gender-female">Female</SelectItem>
                        <SelectItem value="other" data-testid="gender-other">Other</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="visit-notes" className="text-sm font-semibold text-gray-700">Notes (Optional)</Label>
              <Textarea
                id="visit-notes"
                placeholder="Any specific requirements or questions..."
                value={visitNotes}
                onChange={(e) => setVisitNotes(e.target.value)}
                rows={3}
                className="border-2 focus:border-purple-400 resize-none"
                data-testid="textarea-visit-notes"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                onClick={handleSubmitVisit}
                disabled={createVisitRequest.isPending}
                className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-lg"
                data-testid="button-submit-visit"
              >
                {createVisitRequest.isPending ? "Submitting..." : "Submit Request"}
              </Button>
              <Button
                onClick={() => {
                  setShowVisitModal(false);
                  resetForm();
                }}
                variant="outline"
                className="border-2"
                disabled={createVisitRequest.isPending}
                data-testid="button-cancel-visit"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      </div>
    </Layout>
  );
}

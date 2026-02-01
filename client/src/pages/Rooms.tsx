import DesktopLayout from "@/components/layout/DesktopLayout";
import MobileLayout from "@/components/layout/MobileLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DoorOpen, Plus, Wifi, Droplet, Zap, Wind, Bath, Search, MoreVertical, Upload, Users, Home, DoorClosed, Edit2, Bed, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useEffect, useState, useMemo } from "react";
import { useLocation } from "wouter";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { BulkUploadModal } from "@/components/BulkUploadModal";
import { cn } from "@/lib/utils";
import { api } from "@/apiClient";

interface Tenant {
  id: number;
  name: string;
  phone: string;
}

interface BedData {
  id: number;
  position: string;
  displayOrder: number;
  status: string;
  tenantId: number | null;
  tenant?: Tenant | null;
}

interface RoomData {
  room: {
    id: number;
    roomNumber: string;
    monthlyRent: string;
    sharing: number;
    floor: number;
    hasAttachedBathroom: boolean;
    hasAC: boolean;
    tenantIds: number[];
    status: string;
    amenities: string[];
  };
  tenants: Tenant[];
  beds?: BedData[];
}

export default function Rooms() {
  return (
    <>
      <div className="hidden lg:block">
        <RoomsDesktop />
      </div>
      <div className="lg:hidden">
        <RoomsMobile />
      </div>
    </>
  );
}

function RoomsDesktop() {
  const [, setLocation] = useLocation();
  const [roomsData, setRoomsData] = useState<RoomData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "fully_occupied" | "partially_occupied" | "vacant">("all");
  const [bulkUploadOpen, setBulkUploadOpen] = useState(false);

  const getRoomOccupancyStatus = (room: any) => {
    const tenantCount = room.tenantIds?.length || 0;
    if (tenantCount === 0) return "vacant";
    if (tenantCount === room.sharing) return "fully_occupied";
    return "partially_occupied";
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const response = await api.get("/api/rooms");
      setRoomsData(response.data);
      setError(null);
    } catch (err: any) {
      console.error("Error fetching rooms:", err);
      setError(err.response?.data?.error || "Failed to load rooms");
    } finally {
      setLoading(false);
    }
  };

  const handleSeedRooms = async () => {
    try {
      setLoading(true);
      await api.post("/api/rooms/seed");
      await fetchRooms();
    } catch (err: any) {
      console.error("Error seeding rooms:", err);
      setError(err.response?.data?.error || "Failed to seed rooms");
      setLoading(false);
    }
  };

  const filteredRooms = useMemo(() => {
    return roomsData.filter((item) => {
      const matchSearch = item.room.roomNumber.toLowerCase().includes(search.toLowerCase());
      const occupancyStatus = getRoomOccupancyStatus(item.room);
      const matchFilter = filter === "all" || occupancyStatus === filter;
      return matchSearch && matchFilter;
    });
  }, [roomsData, search, filter]);

  const stats = {
    total: roomsData.length,
    fully_occupied: roomsData.filter((item) => getRoomOccupancyStatus(item.room) === "fully_occupied").length,
    partially_occupied: roomsData.filter((item) => getRoomOccupancyStatus(item.room) === "partially_occupied").length,
    vacant: roomsData.filter((item) => getRoomOccupancyStatus(item.room) === "vacant").length,
  };

  const filterTabs = [
    { label: "All", value: "all", count: stats.total },
    { label: "Fully Occupied", value: "fully_occupied", count: stats.fully_occupied },
    { label: "Partially Occupied", value: "partially_occupied", count: stats.partially_occupied },
    { label: "Vacant", value: "vacant", count: stats.vacant },
  ] as const;

  const statCards = [
    { 
      label: "Total Rooms", 
      value: stats.total, 
      icon: Home, 
      gradient: "from-purple-500 to-pink-600",
      description: "All rooms"
    },
    { 
      label: "Fully Occupied", 
      value: stats.fully_occupied, 
      icon: DoorClosed, 
      gradient: "from-emerald-500 to-green-600",
      description: "All beds filled"
    },
    { 
      label: "Partially Occupied", 
      value: stats.partially_occupied, 
      icon: DoorOpen, 
      gradient: "from-blue-500 to-cyan-600",
      description: "Some beds available"
    },
    { 
      label: "Vacant", 
      value: stats.vacant, 
      icon: DoorOpen, 
      gradient: "from-orange-500 to-red-600",
      description: "No tenants"
    },
  ];

  if (loading) {
    return (
      <DesktopLayout title="Room Management" showNav>
        <div className="flex items-center justify-center h-64">
          <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center animate-pulse">
            <DoorOpen className="w-6 h-6 text-purple-600" />
          </div>
        </div>
      </DesktopLayout>
    );
  }

  if (error) {
    return (
      <DesktopLayout title="Room Management" showNav>
        <div className="text-center text-destructive">{error}</div>
      </DesktopLayout>
    );
  }

  return (
    <DesktopLayout title="Rooms" showNav>
      {/* Hero Section with Gradient */}
      <div className="relative -mx-6 -mt-6 mb-8 overflow-hidden rounded-b-3xl">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-blue-600 to-purple-700" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(120,119,198,0.3),rgba(255,255,255,0))]" />
        
        <div className="relative px-8 py-10 text-white">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-4xl font-bold tracking-tight mb-2">Room Management</h2>
              <p className="text-white/80 text-sm">Manage rooms, amenities, and occupancy</p>
            </div>
            <div className="flex gap-3">
              {roomsData.length === 0 && (
                <Button 
                  onClick={handleSeedRooms} 
                  className="bg-white/20 backdrop-blur-sm border-white/30 hover:bg-white/30 text-white transition-all duration-300" 
                  data-testid="button-seed-rooms"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Seed Demo
                </Button>
              )}
              <Button 
                onClick={() => setBulkUploadOpen(true)}
                className="bg-white/20 backdrop-blur-sm border-white/30 hover:bg-white/30 text-white transition-all duration-300"
                data-testid="button-bulk-upload"
              >
                <Upload className="w-4 h-4 mr-2" />
                Bulk Upload
              </Button>
              <Button 
                onClick={() => setLocation("/rooms/add")}
                className="bg-white/20 backdrop-blur-sm border-white/30 hover:bg-white/30 text-white transition-all duration-300"
                data-testid="button-add-room"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Room
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {roomsData.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center">
              <DoorOpen className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No rooms yet</h3>
            <p className="text-sm text-muted-foreground mb-4">Add your first room to get started</p>
            <Button onClick={handleSeedRooms} className="gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
              <Plus className="w-4 h-4" /> Seed Demo Rooms
            </Button>
          </div>
        ) : (
          <>
            {/* Stats Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {statCards.map((stat, i) => (
                <Card key={i} className="group relative overflow-hidden border-2 hover:border-purple-200 hover:shadow-2xl transition-all duration-300" data-testid={`card-stat-${stat.label.toLowerCase().replace(/\s+/g, "-")}`}>
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-blue-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <CardContent className="relative p-6">
                    <div className="flex items-center justify-between mb-4">
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
                        "text-3xl font-bold bg-gradient-to-r bg-clip-text text-transparent",
                        `${stat.gradient}`
                      )}>{stat.value}</h3>
                      <p className="text-xs text-muted-foreground">{stat.description}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Search and Filters */}
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input 
                  placeholder="Search by room number..." 
                  className="pl-10 h-12 bg-secondary border border-border rounded-xl"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  data-testid="input-search-room"
                />
              </div>
              <div className="flex gap-2">
                {filterTabs.map((tab) => (
                  <Button
                    key={tab.value}
                    onClick={() => setFilter(tab.value)}
                    variant={filter === tab.value ? "default" : "outline"}
                    size="sm"
                    className="rounded-full px-4"
                    data-testid={`filter-room-${tab.value}`}
                  >
                    {tab.label} <span className="ml-2 text-xs opacity-70">({tab.count})</span>
                  </Button>
                ))}
              </div>
            </div>

            {/* Rooms Grid */}
            <Card className="border-2 shadow-xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
                      <DoorOpen className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">Room Directory</h3>
                  </div>
                  <span className="text-sm text-muted-foreground font-medium">{filteredRooms.length} rooms</span>
                </div>

                {filteredRooms.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center">
                      <DoorOpen className="w-8 h-8 text-purple-600" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">No rooms found</h3>
                    <p className="text-sm text-muted-foreground">Try adjusting your search filters</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredRooms.map(({ room, tenants, beds }) => {
                      const occupancyStatus = getRoomOccupancyStatus(room);
                      return (
                        <div 
                          key={room.id} 
                          className="group relative overflow-hidden border-2 border-transparent hover:border-purple-200 rounded-xl p-4 bg-gradient-to-r from-white to-gray-50 hover:from-purple-50 hover:to-blue-50 shadow-sm hover:shadow-xl transition-all duration-300" 
                          data-testid={`card-room-${room.id}`}
                        >
                          {/* Header */}
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3 flex-1">
                              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300">
                                <DoorOpen className="w-6 h-6 text-white" />
                              </div>
                              <div>
                                <h4 className="text-xl font-bold text-foreground mb-1">Room {room.roomNumber}</h4>
                                <p className="text-sm text-muted-foreground">Floor {room.floor}</p>
                              </div>
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  className="h-7 w-7 flex-shrink-0 hover:bg-purple-100"
                                  data-testid={`button-more-room-${room.id}`}
                                >
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => setLocation(`/rooms/edit/${room.id}`)}
                                  data-testid={`button-edit-room-menu-${room.id}`}
                                >
                                  <Edit2 className="h-4 w-4 mr-2" />
                                  Edit Room
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>

                          {/* Status Badge */}
                          <div className="mb-4">
                            <span className={cn(
                              "inline-flex items-center px-3 py-1 rounded-full text-xs font-bold",
                              occupancyStatus === "fully_occupied"
                                ? "bg-gradient-to-r from-emerald-100 to-green-100 text-green-700"
                                : occupancyStatus === "partially_occupied"
                                ? "bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-700"
                                : "bg-gradient-to-r from-orange-100 to-red-100 text-orange-700"
                            )} data-testid={`status-room-${room.id}`}>
                              {occupancyStatus === "fully_occupied" ? "Fully Occupied" : 
                               occupancyStatus === "partially_occupied" ? "Partially Occupied" :
                               "Vacant"}
                            </span>
                          </div>

                          {/* Rent */}
                          <div className="flex items-center gap-2 mb-4 pb-4 border-b">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-100 to-green-100 flex items-center justify-center">
                              <span className="text-green-600 font-bold">₹</span>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Monthly Rent</p>
                              <p className="font-bold text-lg bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
                                ₹{parseFloat(room.monthlyRent).toLocaleString()}
                              </p>
                            </div>
                          </div>

                          {/* Room Features */}
                          <div className="grid grid-cols-3 gap-2 mb-4 pb-4 border-b">
                            <div className="text-center">
                              <p className="text-xs text-muted-foreground mb-1">Sharing</p>
                              <p className="font-bold text-foreground">{room.sharing}</p>
                            </div>
                            <div className="text-center">
                              <p className="text-xs text-muted-foreground mb-1">AC</p>
                              <p className="font-bold">{room.hasAC ? '✅' : '❌'}</p>
                            </div>
                            <div className="text-center">
                              <p className="text-xs text-muted-foreground mb-1">Bathroom</p>
                              <p className="font-bold">{room.hasAttachedBathroom ? '🚿' : '👥'}</p>
                            </div>
                          </div>

                          {/* Bed Positions Section */}
                          {beds && beds.length > 0 && (
                            <div className="mb-4">
                              <div className="flex items-center gap-2 mb-3">
                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-100 to-cyan-100 flex items-center justify-center">
                                  <Bed className="h-4 w-4 text-blue-600" />
                                </div>
                                <p className="text-sm font-semibold text-foreground">
                                  Bed Layout ({beds.filter(b => b.status === "occupied").length}/{beds.length} occupied)
                                </p>
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                {beds.map((bed) => (
                                  <div 
                                    key={bed.id} 
                                    className={cn(
                                      "p-2 rounded-lg border-2 transition-all",
                                      bed.status === "occupied" 
                                        ? "bg-red-50 border-red-200" 
                                        : "bg-green-50 border-green-200"
                                    )}
                                    data-testid={`bed-${room.id}-${bed.id}`}
                                  >
                                    <div className="flex items-center gap-2">
                                      <div className={cn(
                                        "w-6 h-6 rounded flex items-center justify-center",
                                        bed.status === "occupied" ? "bg-red-200" : "bg-green-200"
                                      )}>
                                        {bed.status === "occupied" ? (
                                          <User className="w-3 h-3 text-red-600" />
                                        ) : (
                                          <Bed className="w-3 h-3 text-green-600" />
                                        )}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-xs font-medium truncate">{bed.position}</p>
                                        <p className={cn(
                                          "text-[10px]",
                                          bed.status === "occupied" ? "text-red-600" : "text-green-600"
                                        )}>
                                          {bed.status === "occupied" 
                                            ? (bed.tenant?.name || "Occupied") 
                                            : "Available"}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Tenants Section */}
                          {tenants.length > 0 ? (
                            <div className="mb-4">
                              <div className="flex items-center gap-2 mb-3">
                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
                                  <Users className="h-4 w-4 text-purple-600" />
                                </div>
                                <p className="text-sm font-semibold text-foreground">
                                  Tenants ({tenants.length}/{room.sharing})
                                </p>
                              </div>
                              <div className="space-y-2">
                                {tenants.map((tenant) => (
                                  <div key={tenant.id} className="p-2.5 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200">
                                    <p className="font-semibold text-green-900 text-sm" data-testid={`text-tenant-${room.id}`}>
                                      {tenant.name}
                                    </p>
                                    <p className="text-xs text-green-700">{tenant.phone}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <div className="mb-4 py-3 px-3 rounded-lg bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200">
                              <p className="text-sm text-orange-700 font-medium">No tenants assigned yet</p>
                            </div>
                          )}
                          
                          {/* Amenities */}
                          {room.amenities && room.amenities.length > 0 && (
                            <div className="mb-4">
                              <p className="text-xs font-semibold text-muted-foreground mb-2">Amenities</p>
                              <div className="flex gap-2 flex-wrap">
                                {room.amenities.map((amenity) => (
                                  <div key={amenity} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 text-blue-700">
                                    {amenity === 'WiFi' && <Wifi className="w-3 h-3" />}
                                    {amenity === 'Water' && <Droplet className="w-3 h-3" />}
                                    {amenity === 'Power' && <Zap className="w-3 h-3" />}
                                    <span>{amenity}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          <Button 
                            onClick={() => setLocation(`/rooms/edit/${room.id}`)}
                            className="w-full gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
                            data-testid={`button-edit-room-${room.id}`}
                          >
                            <Edit2 className="w-4 h-4" />
                            Edit Room
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <BulkUploadModal 
        open={bulkUploadOpen} 
        onOpenChange={setBulkUploadOpen}
        onSuccess={fetchRooms}
      />
    </DesktopLayout>
  );
}

function RoomsMobile() {
  const [, setLocation] = useLocation();
  const [roomsData, setRoomsData] = useState<RoomData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "fully_occupied" | "partially_occupied" | "vacant">("all");
  const [bulkUploadOpen, setBulkUploadOpen] = useState(false);

  const getRoomOccupancyStatus = (room: any) => {
    const tenantCount = room.tenantIds?.length || 0;
    if (tenantCount === 0) return "vacant";
    if (tenantCount === room.sharing) return "fully_occupied";
    return "partially_occupied";
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const response = await api.get("/api/rooms");
      setRoomsData(response.data);
      setError(null);
    } catch (err: any) {
      console.error("Error fetching rooms:", err);
      setError(err.response?.data?.error || "Failed to load rooms");
    } finally {
      setLoading(false);
    }
  };

  const handleSeedRooms = async () => {
    try {
      setLoading(true);
      await api.post("/api/rooms/seed");
      await fetchRooms();
    } catch (err: any) {
      console.error("Error seeding rooms:", err);
      setError(err.response?.data?.error || "Failed to seed rooms");
      setLoading(false);
    }
  };

  const filteredRooms = useMemo(() => {
    return roomsData.filter((item) => {
      const matchSearch = item.room.roomNumber.toLowerCase().includes(search.toLowerCase());
      const occupancyStatus = getRoomOccupancyStatus(item.room);
      const matchFilter = filter === "all" || occupancyStatus === filter;
      return matchSearch && matchFilter;
    });
  }, [roomsData, search, filter]);

  const stats = {
    total: roomsData.length,
    fully_occupied: roomsData.filter((item) => getRoomOccupancyStatus(item.room) === "fully_occupied").length,
    partially_occupied: roomsData.filter((item) => getRoomOccupancyStatus(item.room) === "partially_occupied").length,
    vacant: roomsData.filter((item) => getRoomOccupancyStatus(item.room) === "vacant").length,
  };

  if (loading) {
    return (
      <MobileLayout title="Rooms">
        <div className="flex items-center justify-center h-64">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center animate-pulse">
            <DoorOpen className="w-6 h-6 text-purple-600" />
          </div>
        </div>
      </MobileLayout>
    );
  }

  if (error) {
    return (
      <MobileLayout title="Rooms">
        <div className="text-center text-destructive py-8">{error}</div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout 
      title="Rooms"
      action={
        <div className="flex gap-2">
          <Button 
            size="sm"
            onClick={() => setBulkUploadOpen(true)}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
            data-testid="button-bulk-upload-mobile"
          >
            <Upload className="w-4 h-4" />
          </Button>
          <Button 
            size="sm"
            onClick={() => setLocation("/rooms/add")}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
            data-testid="button-add-room-mobile"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        {roomsData.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center">
              <DoorOpen className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No rooms yet</h3>
            <p className="text-sm text-muted-foreground mb-4">Add your first room to get started</p>
            <Button onClick={handleSeedRooms} className="gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
              <Plus className="w-4 h-4" /> Seed Demo Rooms
            </Button>
          </div>
        ) : (
          <>
            {/* Stats Cards - Stacked on mobile */}
            <div className="grid grid-cols-2 gap-3">
              <Card className="border-2" data-testid="card-stat-total-mobile">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                      <Home className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground font-semibold">Total</p>
                  <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-500 to-pink-600 bg-clip-text text-transparent">{stats.total}</h3>
                </CardContent>
              </Card>

              <Card className="border-2" data-testid="card-stat-occupied-mobile">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center">
                      <DoorClosed className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground font-semibold">Occupied</p>
                  <h3 className="text-2xl font-bold bg-gradient-to-r from-emerald-500 to-green-600 bg-clip-text text-transparent">{stats.fully_occupied}</h3>
                </CardContent>
              </Card>

              <Card className="border-2" data-testid="card-stat-partial-mobile">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
                      <DoorOpen className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground font-semibold">Partial</p>
                  <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-cyan-600 bg-clip-text text-transparent">{stats.partially_occupied}</h3>
                </CardContent>
              </Card>

              <Card className="border-2" data-testid="card-stat-vacant-mobile">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
                      <DoorOpen className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground font-semibold">Vacant</p>
                  <h3 className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-red-600 bg-clip-text text-transparent">{stats.vacant}</h3>
                </CardContent>
              </Card>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search rooms..." 
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                data-testid="input-search-room-mobile"
              />
            </div>

            {/* Filters - Scrollable on mobile */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              <Button
                onClick={() => setFilter("all")}
                variant={filter === "all" ? "default" : "outline"}
                size="sm"
                className="rounded-full flex-shrink-0"
                data-testid="filter-room-all-mobile"
              >
                All ({stats.total})
              </Button>
              <Button
                onClick={() => setFilter("fully_occupied")}
                variant={filter === "fully_occupied" ? "default" : "outline"}
                size="sm"
                className="rounded-full flex-shrink-0"
                data-testid="filter-room-fully_occupied-mobile"
              >
                Full ({stats.fully_occupied})
              </Button>
              <Button
                onClick={() => setFilter("partially_occupied")}
                variant={filter === "partially_occupied" ? "default" : "outline"}
                size="sm"
                className="rounded-full flex-shrink-0"
                data-testid="filter-room-partially_occupied-mobile"
              >
                Partial ({stats.partially_occupied})
              </Button>
              <Button
                onClick={() => setFilter("vacant")}
                variant={filter === "vacant" ? "default" : "outline"}
                size="sm"
                className="rounded-full flex-shrink-0"
                data-testid="filter-room-vacant-mobile"
              >
                Vacant ({stats.vacant})
              </Button>
            </div>

            {/* Rooms List - Stacked cards */}
            <div className="space-y-3">
              {filteredRooms.length === 0 ? (
                <Card className="text-center py-8">
                  <CardContent>
                    <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center">
                      <DoorOpen className="w-6 h-6 text-purple-600" />
                    </div>
                    <p className="text-sm text-muted-foreground">No rooms found</p>
                  </CardContent>
                </Card>
              ) : (
                filteredRooms.map(({ room, tenants, beds }) => {
                  const occupancyStatus = getRoomOccupancyStatus(room);
                  return (
                    <Card 
                      key={room.id}
                      className="border-2 hover:border-purple-200 transition-colors"
                      data-testid={`card-room-mobile-${room.id}`}
                    >
                      <CardContent className="p-4">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl flex items-center justify-center">
                              <DoorOpen className="w-6 h-6 text-white" />
                            </div>
                            <div>
                              <h4 className="text-lg font-bold">Room {room.roomNumber}</h4>
                              <p className="text-xs text-muted-foreground">Floor {room.floor}</p>
                            </div>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => setLocation(`/rooms/edit/${room.id}`)}
                            data-testid={`button-edit-room-mobile-${room.id}`}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                        </div>

                        {/* Status */}
                        <div className="mb-3">
                          <span className={cn(
                            "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold",
                            occupancyStatus === "fully_occupied"
                              ? "bg-gradient-to-r from-emerald-100 to-green-100 text-green-700"
                              : occupancyStatus === "partially_occupied"
                              ? "bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-700"
                              : "bg-gradient-to-r from-orange-100 to-red-100 text-orange-700"
                          )}>
                            {occupancyStatus === "fully_occupied" ? "Fully Occupied" : 
                             occupancyStatus === "partially_occupied" ? "Partially Occupied" :
                             "Vacant"}
                          </span>
                        </div>

                        {/* Rent */}
                        <div className="flex items-center gap-2 mb-3 p-3 rounded-lg bg-gradient-to-r from-emerald-50 to-green-50 border border-green-200">
                          <div className="text-green-600 font-bold text-lg">₹</div>
                          <div>
                            <p className="text-xs text-green-700">Monthly Rent</p>
                            <p className="font-bold text-green-900">₹{parseFloat(room.monthlyRent).toLocaleString()}</p>
                          </div>
                        </div>

                        {/* Features */}
                        <div className="grid grid-cols-3 gap-2 mb-3">
                          <div className="text-center p-2 rounded-lg bg-gray-50">
                            <p className="text-xs text-muted-foreground mb-1">Sharing</p>
                            <p className="font-bold">{room.sharing}</p>
                          </div>
                          <div className="text-center p-2 rounded-lg bg-gray-50">
                            <p className="text-xs text-muted-foreground mb-1">AC</p>
                            <p className="font-bold">{room.hasAC ? '✅' : '❌'}</p>
                          </div>
                          <div className="text-center p-2 rounded-lg bg-gray-50">
                            <p className="text-xs text-muted-foreground mb-1">Bath</p>
                            <p className="font-bold">{room.hasAttachedBathroom ? '🚿' : '👥'}</p>
                          </div>
                        </div>

                        {/* Bed Layout */}
                        {beds && beds.length > 0 && (
                          <div className="mb-3">
                            <div className="flex items-center gap-2 mb-2">
                              <Bed className="h-4 w-4 text-blue-600" />
                              <p className="text-sm font-semibold">
                                Beds ({beds.filter(b => b.status === "occupied").length}/{beds.length} occupied)
                              </p>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              {beds.map((bed) => (
                                <div 
                                  key={bed.id} 
                                  className={cn(
                                    "p-2 rounded-lg border-2",
                                    bed.status === "occupied" 
                                      ? "bg-red-50 border-red-200" 
                                      : "bg-green-50 border-green-200"
                                  )}
                                  data-testid={`bed-mobile-${room.id}-${bed.id}`}
                                >
                                  <div className="flex items-center gap-2">
                                    <div className={cn(
                                      "w-5 h-5 rounded flex items-center justify-center",
                                      bed.status === "occupied" ? "bg-red-200" : "bg-green-200"
                                    )}>
                                      {bed.status === "occupied" ? (
                                        <User className="w-3 h-3 text-red-600" />
                                      ) : (
                                        <Bed className="w-3 h-3 text-green-600" />
                                      )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-xs font-medium truncate">{bed.position}</p>
                                      <p className={cn(
                                        "text-[10px]",
                                        bed.status === "occupied" ? "text-red-600" : "text-green-600"
                                      )}>
                                        {bed.status === "occupied" 
                                          ? (bed.tenant?.name || "Occupied") 
                                          : "Available"}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Tenants */}
                        {tenants.length > 0 ? (
                          <div className="mb-3">
                            <div className="flex items-center gap-2 mb-2">
                              <Users className="h-4 w-4 text-purple-600" />
                              <p className="text-sm font-semibold">
                                Tenants ({tenants.length}/{room.sharing})
                              </p>
                            </div>
                            <div className="space-y-1.5">
                              {tenants.map((tenant) => (
                                <div key={tenant.id} className="p-2 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200">
                                  <p className="font-semibold text-green-900 text-sm">{tenant.name}</p>
                                  <p className="text-xs text-green-700">{tenant.phone}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="mb-3 p-2 rounded-lg bg-orange-50 border border-orange-200">
                            <p className="text-xs text-orange-700 font-medium">No tenants assigned</p>
                          </div>
                        )}

                        {/* Amenities */}
                        {room.amenities && room.amenities.length > 0 && (
                          <div className="flex gap-1.5 flex-wrap">
                            {room.amenities.map((amenity) => (
                              <div key={amenity} className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 border border-blue-200 text-blue-700">
                                {amenity === 'WiFi' && <Wifi className="w-3 h-3" />}
                                {amenity === 'Water' && <Droplet className="w-3 h-3" />}
                                {amenity === 'Power' && <Zap className="w-3 h-3" />}
                                <span>{amenity}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </>
        )}
      </div>

      <BulkUploadModal 
        open={bulkUploadOpen} 
        onOpenChange={setBulkUploadOpen}
        onSuccess={fetchRooms}
      />
    </MobileLayout>
  );
}

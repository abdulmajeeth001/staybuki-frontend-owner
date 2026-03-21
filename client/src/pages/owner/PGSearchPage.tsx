import { useState, useEffect, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import MobileLayout from "@/components/layout/MobileLayout";
import DesktopLayout from "@/components/layout/DesktopLayout";
import { useIsMobile } from "@/hooks/use-mobile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MapPin,
  Navigation,
  Star,
  Utensils,
  Car,
  Wind,
  Camera,
  Wifi,
  Shirt,
  Dumbbell,
  SlidersHorizontal,
  X,
  ChevronRight,
  Building2,
  DoorOpen,
  Search,
  Users,
  Check,
  Zap,
  Flame,
  Sparkles,
  BookOpen,
  Gamepad2,
  ShieldCheck,
  Refrigerator,
  Microwave,
  Droplets,
  Bath,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { applicantService } from "@/services/applicantService";
import type { PgSearchRequest, PgSearchResult, AmenityResponse } from "@/types/applicant";
import { toast } from "@/hooks/use-toast";

const DISTANCE_PRESETS = [
  { label: "5 km", value: 5 },
  { label: "10 km", value: 10 },
  { label: "20 km", value: 20 },
  { label: "50 km", value: 50 },
];

const AMENITY_ICONS = {
  hasFood: { icon: Utensils, label: "Food" },
  hasParking: { icon: Car, label: "Parking" },
  hasAC: { icon: Wind, label: "AC" },
  hasCCTV: { icon: Camera, label: "CCTV" },
  hasWifi: { icon: Wifi, label: "WiFi" },
  hasLaundry: { icon: Shirt, label: "Laundry" },
  hasGym: { icon: Dumbbell, label: "Gym" },
};

const getDynamicAmenityIcon = (name: string) => {
  const lower = name.toLowerCase();
  if (lower.includes("wifi")) return Wifi;
  if (lower.includes("food") || lower.includes("meal")) return Utensils;
  if (lower.includes("parking")) return Car;
  if (lower.includes("ac ") || lower === "ac" || lower.includes("air")) return Wind;
  if (lower.includes("cctv") || lower.includes("camera")) return Camera;
  if (lower.includes("laundry") || lower.includes("wash")) return Shirt;
  if (lower.includes("gym") || lower.includes("fit")) return Dumbbell;
  if (lower.includes("power") || lower.includes("backup")) return Zap;
  if (lower.includes("hot water") || lower.includes("geyser")) return Flame;
  if (lower.includes("housekeeping") || lower.includes("clean")) return Sparkles;
  if (lower.includes("study") || lower.includes("read") || lower.includes("library")) return BookOpen;
  if (lower.includes("recreation") || lower.includes("play") || lower.includes("game") || lower.includes("tv")) return Gamepad2;
  if (lower.includes("security") || lower.includes("guard")) return ShieldCheck;
  if (lower.includes("fridge") || lower.includes("refrigerator")) return Refrigerator;
  if (lower.includes("microwave") || lower.includes("oven")) return Microwave;
  if (lower.includes("purifier") || lower.includes("water")) return Droplets;
  if (lower.includes("bath") || lower.includes("washroom")) return Bath;
  return Check;
};

function PGSearchContent() {
  const isMobile = useIsMobile();
  const [, navigate] = useLocation();
  const [filters, setFilters] = useState<PgSearchRequest>({
    maxDistance: 10,
    limit: 20,
    offset: 0,
  });
  const [tempFilters, setTempFilters] = useState<PgSearchRequest>({ ...filters });
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [showFilters, setShowFilters] = useState(!isMobile);
  const [sortBy, setSortBy] = useState<"distance" | "rating" | "both">("both");
  const [hasSearched, setHasSearched] = useState(false);
  const [showAllAmenities, setShowAllAmenities] = useState(false);

  const { data: amenities = [] } = useQuery<AmenityResponse[]>({
    queryKey: ["/api/amenities"],
    queryFn: () => applicantService.getAmenities(true),
  });

  const { data: pgs, isLoading, refetch } = useQuery<PgSearchResult[]>({
    queryKey: ["/api/applicant/search", filters],
    enabled: hasSearched,
    queryFn: () => applicantService.searchPgs(filters),
  });

  useEffect(() => {
    setShowFilters(!isMobile);
  }, [isMobile]);

  useEffect(() => {
    if (navigator.geolocation) {
      setIsGettingLocation(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setTempFilters(prev => ({
            ...prev,
            latitude: lat,
            longitude: lng,
          }));
          setIsGettingLocation(false);
          
          // Auto-update filters if search was already triggered
          if (hasSearched) {
            setFilters(prev => ({
              ...prev,
              latitude: lat,
              longitude: lng,
            }));
          }
        },
        (error) => {
          setIsGettingLocation(false);
          console.log("Location access denied or unavailable");
        }
      );
    }
  }, [hasSearched]);

  const getCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      toast({ 
        title: "Error", 
        description: "Geolocation is not supported by your browser", 
        variant: "destructive" 
      });
      return;
    }

    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setTempFilters((prev) => ({
          ...prev,
          latitude: lat,
          longitude: lng,
        }));
        setIsGettingLocation(false);
      },
      (error) => {
        setIsGettingLocation(false);
        if (error.code === error.PERMISSION_DENIED) {
          toast({ 
            title: "Permission Denied", 
            description: "Please enable location permissions to search nearby PGs.", 
            variant: "destructive" 
          });
        } else {
          toast({ 
            title: "Error", 
            description: "Failed to get your location. Please try manual input.", 
            variant: "destructive" 
          });
        }
      }
    );
  }, []);

  const handleSearch = useCallback(() => {
    setFilters({ ...tempFilters });
    setHasSearched(true);
    setShowFilters(false);
  }, [tempFilters]);

  const clearFilters = useCallback(() => {
    setTempFilters((prev) => {
      const resetFilters = {
        maxDistance: 10,
        limit: 20,
        offset: 0,
        latitude: prev.latitude,
        longitude: prev.longitude,
      };
      setFilters(resetFilters);
      return resetFilters;
    });
    setHasSearched(false);
  }, []);

  const sortedAmenities = useMemo(() => {
    return [...amenities].sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
  }, [amenities]);

  const visibleAmenities = showAllAmenities ? sortedAmenities : sortedAmenities.slice(0, 10);

  const loadMore = useCallback(() => {
    setFilters((prev) => ({
      ...prev,
      offset: (prev.offset || 0) + (prev.limit || 20),
    }));
  }, []);

  const sortedPgs = useMemo(() => {
    return [...(pgs || [])].sort((a, b) => {
      if (sortBy === "distance" && a.distance !== undefined && b.distance !== undefined) {
        return a.distance - b.distance;
      }
      if (sortBy === "rating") {
        return parseFloat(String(b.averageRating || 0)) - parseFloat(String(a.averageRating || 0));
      }
      // both: prioritize rating, then distance
      const ratingDiff = parseFloat(String(b.averageRating || 0)) - parseFloat(String(a.averageRating || 0));
      if (Math.abs(ratingDiff) > 0.1) return ratingDiff;
      if (a.distance !== undefined && b.distance !== undefined) {
        return a.distance - b.distance;
      }
      return 0;
    });
  }, [pgs, sortBy]);

  const getAmenityIcons = useCallback((pg: PgSearchResult) => {
    return Object.entries(AMENITY_ICONS)
      .filter(([key]) => (pg as any)[key])
      .slice(0, 4);
  }, []);

  return (
    <div className={cn(!isMobile ? "max-w-7xl mx-auto" : "")}>
      {/* Hero Search Section with Gradient */}
      <div className={cn(
        "relative overflow-hidden",
        !isMobile ? "-mx-6 -mt-6 mb-8 rounded-b-3xl" : "-mx-4 mb-6"
      )}>
          <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-blue-600 to-purple-700 opacity-90" />
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAgTSAwIDIwIEwgNDAgMjAgTSAyMCAwIEwgNDAgMjAgTSAyMCAwIEwgMjAgNDAgTSAwIDMwIEwgNDAgMzAgTSAzMCAwIEwgMzAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjAzIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-20" />
          
          <div className={cn("relative space-y-6", !isMobile ? "px-6 py-12" : "px-6 py-8")}>
            <div className="text-center space-y-2">
              <h2 className={cn("font-bold text-white tracking-tight", !isMobile ? "text-4xl" : "text-3xl")}>
                Find Your Perfect PG
              </h2>
              <p className={cn("text-white/90", !isMobile ? "text-base" : "text-sm")}>
                Discover comfortable stays near you
              </p>
            </div>

            <Card className={cn("backdrop-blur-sm bg-white/95 border-white/20 shadow-2xl mx-auto", !isMobile ? "max-w-4xl" : "")}>
              <CardContent className={cn("space-y-4", !isMobile ? "p-6" : "p-5")}>
                <div className="relative">
                  <Search className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="search-query"
                    type="text"
                    placeholder="Search by PG name or area..."
                    value={tempFilters.searchQuery || ""}
                    onChange={(e) =>
                      setTempFilters({ ...tempFilters, searchQuery: e.target.value })
                    }
                    className="pl-11 h-12 text-base border-2 focus:border-purple-500"
                    data-testid="input-search-query"
                  />
                </div>

                {isGettingLocation && (
                  <div className="flex items-center gap-2 text-sm text-purple-700 bg-purple-50 px-3 py-2 rounded-lg">
                    <Navigation className="w-4 h-4 animate-pulse" />
                    Getting your location...
                  </div>
                )}

                {tempFilters.latitude && tempFilters.longitude && (
                  <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 px-3 py-2 rounded-lg">
                    <MapPin className="w-4 h-4" />
                    Location detected - showing nearby PGs
                  </div>
                )}

                <div className={cn("flex flex-col gap-4", !isMobile ? "md:flex-row md:items-end" : "space-y-2")}>
                  <div className="flex-1 space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">Search Within</Label>
                    <div className="grid grid-cols-4 gap-2">
                      {DISTANCE_PRESETS.map((preset) => (
                        <Button
                          key={preset.value}
                          variant={tempFilters.maxDistance === preset.value ? "default" : "outline"}
                          size="sm"
                          onClick={() =>
                            setTempFilters({ ...tempFilters, maxDistance: preset.value })
                          }
                          className={cn(
                            "font-semibold transition-all",
                            tempFilters.maxDistance === preset.value 
                              ? "bg-purple-600 hover:bg-purple-700 shadow-lg shadow-purple-200" 
                              : "hover:border-purple-300 hover:bg-purple-50"
                          )}
                          data-testid={`button-distance-${preset.value}`}
                        >
                          {preset.label}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <Button
                    onClick={handleSearch}
                    className={cn("h-12 text-base font-semibold bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-lg shadow-purple-200", !isMobile ? "w-48" : "w-full")}
                    size="lg"
                    disabled={isGettingLocation}
                    data-testid="button-search-pgs"
                  >
                    <Search className="w-5 h-5 mr-2" />
                    {isGettingLocation ? "Locating..." : "Search PGs"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className={cn(!isMobile ? "grid grid-cols-12 gap-8 px-6 pb-12" : "space-y-4")}>
          {/* Sidebar / Filters */}
          {(!isMobile && showFilters) || isMobile ? (
            <div className={cn(!isMobile ? "col-span-4 space-y-6" : "")}>
            {/* Filter Toggle Button */}
            <div className="mb-4">
              <Button
                onClick={() => setShowFilters(!showFilters)}
                variant="outline"
                className="w-full border-2 hover:border-purple-300 hover:bg-purple-50 transition-colors rounded-xl h-11 font-semibold text-gray-700 shadow-sm"
                data-testid="button-toggle-filters"
              >
                <SlidersHorizontal className="w-4 h-4 mr-2" />
                {showFilters ? "Hide Filters" : "Show Filters"}
              </Button>
            </div>

            {/* Filters Section */}
            <div className={cn("space-y-4", !showFilters && "hidden", !isMobile && "sticky top-24")}>
              <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-xl ring-1 ring-black/5 rounded-2xl overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between pb-4 pt-5 px-5 bg-gradient-to-br from-white to-gray-50/50">
                  <CardTitle className="text-lg font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent flex items-center gap-2">
                    <SlidersHorizontal className="w-5 h-5 text-purple-600" />
                    Refine Search
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="hover:bg-gray-100 rounded-full h-8 w-8 transition-colors"
                    onClick={() => setShowFilters(false)}
                    data-testid="button-close-filters"
                  >
                    <X className="w-4 h-4 text-gray-500" />
                  </Button>
                </CardHeader>
                <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent w-full" />
                <CardContent className="space-y-8 pt-6 px-5 pb-6">
                  {/* PG Type */}
                  <div>
                    <Label className="text-sm font-bold mb-4 block text-gray-800 uppercase tracking-wider">PG Type</Label>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { value: "all", label: "All Types", icon: Building2 },
                        { value: "male", label: "Male Only", icon: Users },
                        { value: "female", label: "Female Only", icon: Users },
                        { value: "common", label: "Co-ed", icon: Users },
                      ].map((type) => {
                        const isSelected = (tempFilters.pgType || "all") === type.value;
                        const Icon = type.icon;
                        return (
                          <button
                            key={type.value}
                            type="button"
                            onClick={() =>
                              setTempFilters({
                                ...tempFilters,
                                pgType: type.value === "all" ? undefined : (type.value as any),
                              })
                            }
                            className={cn(
                              "flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-purple-500",
                              isSelected
                                ? "border-purple-600 bg-purple-50 text-purple-700 shadow-sm"
                                : "border-gray-100 bg-white text-gray-600 hover:border-purple-300 hover:bg-purple-50/50 hover:shadow-sm"
                            )}
                            data-testid={`btn-type-${type.value}`}
                          >
                            <Icon className={cn("w-5 h-5 mb-1.5 transition-colors shrink-0", isSelected ? "text-purple-600" : "text-gray-400")} />
                            <span className="text-[11px] md:text-xs font-bold text-center leading-tight whitespace-normal">{type.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Amenities */}
                  <div>
                    <Label className="text-sm font-bold mb-4 block text-gray-800 uppercase tracking-wider">Amenities</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {visibleAmenities.map((amenity) => {
                        const currentIds: number[] = (tempFilters as any).amenityIds || [];
                        const isSelected = currentIds.includes(amenity.id);
                        const Icon = getDynamicAmenityIcon(amenity.name);
                        return (
                          <button
                            key={amenity.id}
                            type="button"
                            onClick={() => {
                              setTempFilters({
                                ...tempFilters,
                                amenityIds: isSelected 
                                  ? currentIds.filter((id) => id !== amenity.id)
                                  : [...currentIds, amenity.id],
                              } as any);
                            }}
                            className={cn(
                              "flex items-center gap-2 px-2.5 py-2 rounded-xl border-2 transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-blue-500 w-full justify-start h-full min-h-[44px]",
                              isSelected
                                ? "border-blue-600 bg-blue-50 text-blue-700 shadow-sm"
                                : "border-gray-100 bg-white text-gray-600 hover:border-blue-300 hover:bg-blue-50/50 hover:shadow-sm"
                            )}
                            title={amenity.name}
                            data-testid={`btn-amenity-${amenity.id}`}
                          >
                            <Icon className={cn("w-4 h-4 transition-colors shrink-0", isSelected ? "text-blue-600" : "text-gray-400")} />
                            <span className="text-[11px] lg:text-xs font-bold text-left leading-tight break-words whitespace-normal flex-1 min-w-0">{amenity.name}</span>
                          </button>
                        );
                      })}
                      {sortedAmenities.length > 10 && (
                        <button
                          type="button"
                          onClick={() => setShowAllAmenities(!showAllAmenities)}
                          className="flex items-center justify-center gap-1 px-4 py-2 rounded-xl border-2 border-dashed border-gray-300 text-gray-500 hover:text-purple-600 hover:border-purple-300 hover:bg-purple-50 transition-all text-xs font-bold col-span-2"
                        >
                          {showAllAmenities ? "Show Less" : `+${sortedAmenities.length - 10} More`}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Filter Actions */}
                  <div className="pt-2">
                    <Button
                      onClick={clearFilters}
                      variant="outline"
                      className="w-full border-2 hover:border-purple-300 hover:bg-purple-50 font-bold h-11 rounded-xl text-gray-600 hover:text-purple-700 transition-all"
                      data-testid="button-clear-filters"
                    >
                      Clear All Filters
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
            </div>
          ) : null}

          {/* Main Content Area */}
          <div className={cn(!isMobile ? (showFilters ? "col-span-8" : "col-span-12") : "", "space-y-4 md:space-y-6")}>
            {/* Desktop Filter Toggle (When Sidebar is closed) */}
            {!isMobile && !showFilters && (
              <div className="flex items-center mb-2">
                <Button
                  onClick={() => setShowFilters(true)}
                  variant="outline"
                  className="bg-white/80 backdrop-blur-sm border-2 hover:border-purple-300 hover:bg-purple-50 transition-colors rounded-xl h-11 font-semibold text-gray-700 shadow-sm"
                >
                  <SlidersHorizontal className="w-4 h-4 mr-2" />
                  Show Filters
                </Button>
              </div>
            )}

            {/* Welcome State - Show before first search */}
            {!hasSearched && (
              <Card className="border-2 border-dashed border-purple-200 bg-gradient-to-br from-purple-50/50 to-blue-50/50">
                <CardContent className="py-12 px-6">
                  <div className="text-center space-y-6">
                    <div className="w-20 h-20 mx-auto bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center shadow-lg">
                      <Search className="w-10 h-10 text-white" />
                    </div>
                    
                    <div className="space-y-3">
                      <h3 className="text-2xl font-bold text-gray-800" data-testid="text-welcome-title">
                        Ready to Find Your PG?
                      </h3>
                      <p className="text-gray-600 max-w-md mx-auto text-sm leading-relaxed">
                        Use the search above to discover comfortable PG accommodations near you. 
                        You can filter by amenities, distance, and PG type to find your perfect match.
                      </p>
                    </div>

                    <div className="flex flex-col items-center gap-3 pt-2">
                      <Button
                        onClick={handleSearch}
                        size="lg"
                        className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-lg shadow-purple-200 px-8"
                        disabled={isGettingLocation}
                        data-testid="button-start-search"
                      >
                        <Search className="w-5 h-5 mr-2" />
                        {isGettingLocation ? "Getting location..." : "Start Searching"}
                      </Button>
                      <p className="text-xs text-muted-foreground">
                        💡 Tip: Allow location access for the best nearby results
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Results Section - Only show after search */}
            {hasSearched && (
              <>
                {/* Sort & Results Count */}
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <Select value={sortBy} onValueChange={(value: "distance" | "rating" | "both") => setSortBy(value)}>
                      <SelectTrigger data-testid="select-sort" className="bg-white/80 backdrop-blur-sm border-2 hover:border-purple-300 transition-colors rounded-xl h-11 font-semibold text-gray-700">
                        <SelectValue placeholder="Sort by" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="both" data-testid="sort-both" className="font-medium cursor-pointer">Best Match</SelectItem>
                        <SelectItem value="rating" data-testid="sort-rating" className="font-medium cursor-pointer">Highest Rated</SelectItem>
                        {filters.latitude && filters.longitude && (
                          <SelectItem value="distance" data-testid="sort-distance" className="font-medium cursor-pointer">Nearest First</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  {!isLoading && sortedPgs && (
                    <p className="text-sm text-muted-foreground" data-testid="text-results-count">
                      {sortedPgs.length} PG{sortedPgs.length !== 1 ? "s" : ""} found
                    </p>
                  )}
                </div>

                {isLoading ? (
              <div className={cn("grid gap-4", !isMobile ? "grid-cols-2" : "grid-cols-1")}>
                {[1, 2, 3, 4].map((i) => (
                  <Card key={i}>
                    <CardContent className="p-4">
                      <Skeleton className="h-48 w-full mb-4" />
                      <Skeleton className="h-6 w-3/4 mb-2" />
                      <Skeleton className="h-4 w-full mb-4" />
                      <div className="flex gap-2">
                        <Skeleton className="h-8 w-16" />
                        <Skeleton className="h-8 w-16" />
                        <Skeleton className="h-8 w-16" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : sortedPgs && sortedPgs.length > 0 ? (
              <>
                <div className={cn("grid gap-6", !isMobile ? "grid-cols-2" : "grid-cols-1")}>
                  {sortedPgs.map((pg) => {
                    const pgAmenitiesList = getAmenityIcons(pg);
                    const rating = parseFloat(String(pg.averageRating || 0));

                    return (
                      <Card
                        key={pg.id}
                        className="overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer border-2 hover:border-purple-200 group flex flex-col h-full"
                        data-testid={`card-pg-${pg.id}`}
                        onClick={() => navigate(`/pg/${pg.id}`)}
                      >
                        {pg.imageUrl && (
                          <div className="relative h-48 overflow-hidden bg-gradient-to-br from-purple-100 to-blue-100 flex-shrink-0">
                            <img
                              src={pg.imageUrl}
                              alt={pg.pgName}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            />
                            <div className="absolute top-3 right-3 flex gap-2">
                              {rating > 0 && (
                                <Badge className="bg-white/95 text-yellow-700 border-0 shadow-lg backdrop-blur-sm" data-testid={`badge-rating-${pg.id}`}>
                                  <Star className="w-3 h-3 mr-1 fill-yellow-500 text-yellow-500" />
                                  {rating.toFixed(1)}
                                </Badge>
                              )}
                            </div>
                            <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-black/60 to-transparent" />
                          </div>
                        )}
                        
                        <CardContent className="p-5 flex flex-col flex-1">
                          <div className="space-y-4 flex-1">
                            <div>
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <h3 className="font-bold text-xl text-gray-800 leading-tight" data-testid={`text-pg-name-${pg.id}`}>
                                  {pg.pgName}
                                </h3>
                                <Badge
                                  className={cn(
                                    "text-xs font-semibold px-2.5 py-1 capitalize shrink-0",
                                    pg.pgType === "male" && "bg-blue-100 text-blue-700 border-blue-300",
                                    pg.pgType === "female" && "bg-pink-100 text-pink-700 border-pink-300",
                                    pg.pgType === "common" && "bg-purple-100 text-purple-700 border-purple-300"
                                  )}
                                  data-testid={`badge-type-${pg.id}`}
                                >
                                  {pg.pgType}
                                </Badge>
                              </div>
                              
                              <p className="text-sm text-gray-600 flex items-center gap-1.5">
                                <MapPin className="w-4 h-4 text-purple-600 shrink-0" />
                                <span className="line-clamp-2">{pg.pgAddress}</span>
                              </p>
                            </div>

                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                {pg.distance != null && (
                                  <div className="flex items-center gap-1 bg-green-50 text-green-700 px-3 py-1.5 rounded-full text-xs font-semibold" data-testid={`badge-distance-${pg.id}`}>
                                    <Navigation className="w-3 h-3" />
                                    {pg.distance.toFixed(1)} km
                                  </div>
                                )}
                                {rating > 0 && pg.totalRatings > 0 && (
                                  <div className="flex items-center gap-1 bg-yellow-50 text-yellow-700 px-3 py-1.5 rounded-full text-xs font-semibold">
                                    {pg.totalRatings} {pg.totalRatings === 1 ? 'review' : 'reviews'}
                                  </div>
                                )}
                              </div>
                              {(pg as any).availableRoomCount !== undefined && (
                                <div className="flex items-center gap-1 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full text-xs font-semibold shrink-0" data-testid={`badge-rooms-${pg.id}`}>
                                  <DoorOpen className="w-3 h-3" />
                                  {(pg as any).availableRoomCount} {(pg as any).availableRoomCount === 1 ? 'room' : 'rooms'} available
                                </div>
                              )}
                            </div>

                            {pgAmenitiesList.length > 0 && (
                              <div className="flex items-center gap-2 flex-wrap">
                                {pgAmenitiesList.map(([key, { icon: Icon, label }]) => (
                                  <div
                                    key={key}
                                    className="flex items-center gap-1.5 text-xs font-medium text-purple-700 bg-purple-50 px-2.5 py-1.5 rounded-lg border border-purple-100"
                                    data-testid={`amenity-${key}-${pg.id}`}
                                  >
                                    <Icon className="w-3.5 h-3.5" />
                                    <span>{label}</span>
                                  </div>
                                ))}
                                {Object.entries(AMENITY_ICONS).filter(([key]) => (pg as any)[key])
                                  .length > 4 && (
                                  <div className="text-xs font-medium text-gray-500 bg-gray-50 px-2.5 py-1.5 rounded-lg">
                                    +{Object.entries(AMENITY_ICONS).filter(([key]) => (pg as any)[key])
                                      .length - 4} more
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          <Button
                            className="w-full h-11 mt-4 font-semibold bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-md hover:shadow-lg transition-all"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/pg/${pg.id}`);
                            }}
                            data-testid={`button-view-details-${pg.id}`}
                          >
                            View Details
                            <ChevronRight className="w-5 h-5 ml-2" />
                          </Button>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                {/* Load More */}
                {sortedPgs.length >= (filters.limit || 20) && (
                  <div className="flex justify-center mt-6">
                    <Button
                      onClick={loadMore}
                      variant="outline"
                      className={cn("w-full", !isMobile ? "max-w-xs" : "")}
                      data-testid="button-load-more"
                    >
                      Load More
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <Card className="text-center py-16 border-2 border-dashed">
                <CardContent className="space-y-6">
                  <div className="w-24 h-24 mx-auto bg-gradient-to-br from-purple-100 to-blue-100 rounded-full flex items-center justify-center">
                    <Building2 className="w-12 h-12 text-purple-600" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-bold text-gray-800" data-testid="text-empty-state">
                      No PGs Found
                    </h3>
                    <p className="text-sm text-gray-600 max-w-sm mx-auto">
                      We couldn't find any PGs matching your search. Try adjusting your filters or expanding your search area.
                    </p>
                  </div>
                  <div className="flex gap-3 justify-center flex-wrap">
                    <Button 
                      onClick={clearFilters} 
                      className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-md"
                      data-testid="button-clear-from-empty"
                    >
                      Clear Filters
                    </Button>
                    <Button 
                      onClick={() => setTempFilters({ ...tempFilters, maxDistance: 50 })}
                      variant="outline"
                      className="border-2 hover:border-purple-300 hover:bg-purple-50"
                    >
                      Expand Search Area
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
              </>
            )}
          </div>
        </div>
    </div>
  );
}

export default function PGSearchPage() {
  const isMobile = useIsMobile();
  const Layout = isMobile ? MobileLayout : DesktopLayout;

  return (
    <Layout title="Search PGs" showNav={true}>
      <PGSearchContent />
    </Layout>
  );
}

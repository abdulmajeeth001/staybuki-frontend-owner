import { useState, useRef, useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { MapPin, Search, Loader, CheckCircle2, Map as MapIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { LatLngExpression } from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix Leaflet default marker icon issue
import L from "leaflet";
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

interface LocationResult {
  id: number;
  display_name: string;
  lat: string;
  lon: string;
  address: {
    city?: string;
    county?: string;
    state?: string;
    country?: string;
  };
}

interface LocationMapPickerProps {
  onLocationSelect: (location: { 
    address: string; 
    city: string; 
    lat: string; 
    lon: string 
  }) => void;
  selectedLocation?: { 
    address: string; 
    city: string;
    lat?: string;
    lon?: string;
  };
}

// Component to handle map clicks and marker dragging
function LocationMarker({ 
  position, 
  setPosition,
  onPositionChange 
}: { 
  position: LatLngExpression;
  setPosition: (pos: LatLngExpression) => void;
  onPositionChange: (lat: number, lng: number) => void;
}) {
  const markerRef = useRef<any>(null);

  const map = useMapEvents({
    click(e) {
      const newPos: LatLngExpression = [e.latlng.lat, e.latlng.lng];
      setPosition(newPos);
      onPositionChange(e.latlng.lat, e.latlng.lng);
      map.flyTo(e.latlng, map.getZoom());
    },
  });

  return (
    <Marker
      position={position}
      ref={markerRef}
      draggable={true}
      eventHandlers={{
        dragend() {
          const marker = markerRef.current;
          if (marker != null) {
            const pos = marker.getLatLng();
            setPosition([pos.lat, pos.lng]);
            onPositionChange(pos.lat, pos.lng);
          }
        },
      }}
    />
  );
}

export default function LocationMapPicker({ onLocationSelect, selectedLocation }: LocationMapPickerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<LocationResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [selected, setSelected] = useState<LocationResult | null>(null);
  const [mapPosition, setMapPosition] = useState<LatLngExpression>([12.9716, 77.5946]); // Default: Bangalore
  const debounceTimer = useRef<NodeJS.Timeout>();

  // Initialize from selected location if provided
  useEffect(() => {
    if (selectedLocation?.lat && selectedLocation?.lon) {
      const lat = parseFloat(selectedLocation.lat);
      const lon = parseFloat(selectedLocation.lon);
      if (!isNaN(lat) && !isNaN(lon)) {
        setMapPosition([lat, lon]);
        setSearchQuery(selectedLocation.address);
        setSelected({
          id: 0,
          display_name: selectedLocation.address,
          lat: selectedLocation.lat,
          lon: selectedLocation.lon,
          address: { city: selectedLocation.city }
        });
      }
    }
  }, [selectedLocation]);

  const reverseGeocode = async (lat: number, lng: number) => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
      );
      const data = await response.json();

      const city = data.address?.city || data.address?.county || data.address?.state || "Unknown";
      
      setSearchQuery(data.display_name);
      setSelected({
        id: 0,
        display_name: data.display_name,
        lat: lat.toString(),
        lon: lng.toString(),
        address: data.address
      });
      
      onLocationSelect({
        address: data.display_name,
        city: city,
        lat: lat.toString(),
        lon: lng.toString()
      });
    } catch (error) {
      console.error("Reverse geocoding failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const searchLocations = async (query: string) => {
    if (!query || query.length < 2) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5`
      );
      const data = await response.json();
      setResults(data || []);
      setShowResults(true);
    } catch (error) {
      console.error("Location search failed:", error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    debounceTimer.current = setTimeout(() => {
      searchLocations(value);
    }, 500);
  };

  const handleLocationSelect = (location: LocationResult) => {
    const lat = parseFloat(location.lat);
    const lon = parseFloat(location.lon);
    
    setSelected(location);
    setShowResults(false);
    setSearchQuery(location.display_name);
    setMapPosition([lat, lon]);
    
    const city = location.address?.city || location.address?.county || location.address?.state || "Unknown";
    onLocationSelect({
      address: location.display_name,
      city: city,
      lat: location.lat,
      lon: location.lon
    });
  };

  const handleUseCurrentLocation = async () => {
    setIsLoading(true);
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      });

      const { latitude, longitude } = position.coords;
      setMapPosition([latitude, longitude]);
      await reverseGeocode(latitude, longitude);
      setShowResults(false);
    } catch (error) {
      console.error("Geolocation failed:", error);
      alert("Unable to get your location. Please search manually.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleMapPositionChange = (lat: number, lng: number) => {
    reverseGeocode(lat, lng);
  };

  return (
    <div className="space-y-3">
      <Label>PG Location</Label>
      
      <div className="space-y-2">
        <div className="relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search for area, city, or building name"
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10 bg-card"
            data-testid="input-location-search"
          />
          {isLoading && <Loader className="absolute right-3 top-3 w-4 h-4 animate-spin text-muted-foreground" />}
        </div>

        {selected && (
          <div className="flex items-start gap-2 p-2 bg-green-50 dark:bg-green-950 rounded border border-green-200 dark:border-green-800">
            <CheckCircle2 className="w-4 h-4 mt-0.5 text-green-600 dark:text-green-400 flex-shrink-0" />
            <div className="text-sm flex-1 min-w-0">
              <p className="font-medium text-green-900 dark:text-green-100">Location Selected</p>
              <p className="text-green-700 dark:text-green-200 truncate text-xs">{selected.display_name}</p>
            </div>
          </div>
        )}

        {showResults && results.length > 0 && (
          <div className="absolute z-50 w-full bg-card border border-border rounded-md shadow-lg mt-1">
            <div className="max-h-48 overflow-y-auto">
              {results.map((result, idx) => (
                <button
                  key={`${result.id}-${idx}`}
                  onClick={() => handleLocationSelect(result)}
                  className="w-full text-left px-3 py-2 hover:bg-secondary transition-colors border-b border-border last:border-b-0"
                  type="button"
                  data-testid={`location-result-${result.id}`}
                >
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{result.display_name}</p>
                      {result.address && (
                        <p className="text-xs text-muted-foreground truncate">
                          {[result.address.city, result.address.state, result.address.country]
                            .filter(Boolean)
                            .join(", ")}
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleUseCurrentLocation}
            disabled={isLoading}
            className="flex-1"
            data-testid="button-use-current-location"
          >
            <MapPin className="w-4 h-4 mr-2" />
            Use Current Location
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowMap(!showMap)}
            className="flex-1"
            data-testid="button-toggle-map"
          >
            <MapIcon className="w-4 h-4 mr-2" />
            {showMap ? "Hide Map" : "Show Map"}
          </Button>
        </div>

        {showMap && (
          <Card>
            <CardContent className="p-3">
              <div className="h-[300px] rounded-md overflow-hidden border border-border">
                <MapContainer
                  center={mapPosition}
                  zoom={13}
                  style={{ height: "100%", width: "100%" }}
                  data-testid="map-container"
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <LocationMarker 
                    position={mapPosition} 
                    setPosition={setMapPosition}
                    onPositionChange={handleMapPositionChange}
                  />
                </MapContainer>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Click on the map or drag the marker to select a location
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

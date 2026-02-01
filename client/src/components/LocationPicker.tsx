import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { MapPin, Search, Loader, CheckCircle2 } from "lucide-react";

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

interface LocationPickerProps {
  onLocationSelect: (location: { address: string; city: string; lat: string; lon: string }) => void;
  selectedLocation?: { address: string; city: string };
}

export default function LocationPicker({ onLocationSelect, selectedLocation }: LocationPickerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<LocationResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selected, setSelected] = useState<LocationResult | null>(null);
  const debounceTimer = useRef<NodeJS.Timeout>();

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
    setSelected(location);
    setShowResults(false);
    setSearchQuery(location.display_name);
    
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

      // Reverse geocode to get address
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
      );
      const data = await response.json();

      const city = data.address?.city || data.address?.county || data.address?.state || "Unknown";
      
      setSearchQuery(data.display_name);
      setSelected({
        id: 0,
        display_name: data.display_name,
        lat: latitude.toString(),
        lon: longitude.toString(),
        address: data.address
      });
      
      onLocationSelect({
        address: data.display_name,
        city: city,
        lat: latitude.toString(),
        lon: longitude.toString()
      });
      setShowResults(false);
    } catch (error) {
      console.error("Geolocation failed:", error);
      alert("Unable to get your location. Please search manually.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-3 relative">
      <Label>PG Location</Label>
      
      <div className="space-y-2 relative">
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
          <div className="w-full bg-card border border-border rounded-md shadow-lg">
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

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleUseCurrentLocation}
          disabled={isLoading}
          className="w-full"
          data-testid="button-use-current-location"
        >
          <MapPin className="w-4 h-4 mr-2" />
          Use Current Location
        </Button>
      </div>
    </div>
  );
}

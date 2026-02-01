import { useEffect, useState } from "react";
import MobileLayout from "@/components/layout/MobileLayout";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Building2, MapPin, Home } from "lucide-react";
import { api } from "@/apiClient";

export default function TenantPgDetails() {
  const [pg, setPg] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPgDetails();
  }, []);

  const fetchPgDetails = async () => {
    try {
      const res = await api.get("/api/tenant/pg");
      setPg(res.data);
    } catch (err: any) {
      console.error("Failed to fetch PG details:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <MobileLayout title="PG Details">Loading...</MobileLayout>;
  }

  if (!pg) {
    return (
      <MobileLayout title="PG Details">
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            PG information not available.
          </CardContent>
        </Card>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout title="PG Details">
      {/* PG Header */}
      <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20 mb-4">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="bg-primary/20 rounded-lg p-3">
              <Building2 className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">{pg.pgName}</h2>
              <p className="text-sm text-muted-foreground">
                {pg.totalRooms || 0} rooms
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Details */}
      <div className="space-y-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-secondary rounded-lg p-2">
                <MapPin className="w-5 h-5 text-orange-600" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">Address</p>
                <p
                  className="font-semibold text-sm"
                  data-testid="text-pg-address"
                >
                  {pg.pgAddress}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-secondary rounded-lg p-2">
                <Home className="w-5 h-5 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">Location</p>
                <p
                  className="font-semibold text-sm"
                  data-testid="text-pg-location"
                >
                  {pg.pgLocation}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </MobileLayout>
  );
}

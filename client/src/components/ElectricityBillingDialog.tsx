import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Zap, ArrowRight, ArrowLeft, Check, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { usePG } from "@/hooks/use-pg";
import { api } from "@/apiClient";

interface Room {
  id: number;
  roomNumber: string;
  status: string;
}

interface RoomBill {
  roomId: number;
  roomNumber: string;
  meterNumber: string;
  previousReading: number;
  currentReading: number;
  unitsConsumed: number;
  ratePerUnit: number;
  roomAmount: number;
  notes: string;
}

interface TenantBill {
  tenantName: string;
  roomNumber: string;
  amount: string;
}

interface BillingSummary {
  roomBills: Array<{
    roomNumber: string;
    meterNumber: string | null;
    unitsConsumed: string;
    roomAmount: string;
    tenantCount: number;
  }>;
  tenantCharges: TenantBill[];
  totalUnits: string;
  totalAmount: string;
}

interface ElectricityBillingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const STEPS = ["Billing Details", "Meter Readings", "Preview & Confirm"];

export function ElectricityBillingDialog({
  open,
  onOpenChange,
  onSuccess,
}: ElectricityBillingDialogProps) {
  const { pg } = usePG();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [cycleId, setCycleId] = useState<number | null>(null);

  // Step 1: Billing Details
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [billingMonth, setBillingMonth] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");

  // Step 2: Room Readings
  const [roomBills, setRoomBills] = useState<RoomBill[]>([]);

  // Step 3: Summary
  const [summary, setSummary] = useState<BillingSummary | null>(null);

  // Fetch rooms when dialog opens
  useEffect(() => {
    if (open) {
      fetchRooms();
      // Set default dates
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      setPeriodStart(format(start, "yyyy-MM-dd"));
      setPeriodEnd(format(end, "yyyy-MM-dd"));
      setBillingMonth(format(now, "yyyy-MM"));
      setInvoiceNumber(`EB-${format(now, "yyyyMM")}-${Math.floor(Math.random() * 1000)}`);
    }
  }, [open]);

  const fetchRooms = async () => {
    try {
      const res = await api.get("/api/electricity/rooms");
      const data = res.data;
      // API now returns only occupied rooms directly (no nested structure)
      setRooms(data);
      // Initialize room bills with default values
      setRoomBills(
        data.map((room: Room) => ({
          roomId: room.id,
          roomNumber: room.roomNumber,
          meterNumber: "",
          previousReading: 0,
          currentReading: 0,
          unitsConsumed: 0,
          ratePerUnit: 7.5,
          roomAmount: 0,
          notes: "",
        }))
      );
    } catch (error: any) {
      console.error("Failed to fetch rooms:", error);
      toast.error(error.response?.data?.error || "Failed to load rooms for billing");
    }
  };

  const handleCreateCycle = async () => {
    if (!periodStart || !periodEnd || !billingMonth) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (!pg?.id) {
      toast.error("No PG selected");
      return;
    }

    setLoading(true);
    try {
      const res = await api.post("/api/electricity/cycles", {
        pgId: pg.id,
        periodStart,
        periodEnd,
        billingMonth,
        invoiceNumber: invoiceNumber || undefined,
      });

      const data = res.data;
      setCycleId(data.id);
      setCurrentStep(1);
      toast.success("Billing cycle created");
    } catch (error: any) {
      console.error("Create cycle error:", error);
      toast.error(error.response?.data?.error || "Failed to create billing cycle");
    } finally {
      setLoading(false);
    }
  };

  const updateRoomBill = (roomId: number, field: keyof RoomBill, value: any) => {
    setRoomBills((prev) =>
      prev.map((bill) => {
        if (bill.roomId !== roomId) return bill;

        // Convert numeric fields to numbers
        let processedValue = value;
        if (field === "currentReading" || field === "previousReading" || field === "ratePerUnit") {
          processedValue = value === "" ? 0 : Number(value);
        }

        const updated = { ...bill, [field]: processedValue };

        // Auto-calculate units consumed and amount
        if (field === "currentReading" || field === "previousReading") {
          const current = field === "currentReading" ? processedValue : updated.currentReading;
          const previous = field === "previousReading" ? processedValue : updated.previousReading;
          updated.unitsConsumed = Math.max(0, current - previous);
          updated.roomAmount = updated.unitsConsumed * updated.ratePerUnit;
        } else if (field === "ratePerUnit") {
          updated.roomAmount = updated.unitsConsumed * processedValue;
        }

        return updated;
      })
    );
  };

  const handleBackToRoomReadings = async () => {
    if (!cycleId) return;

    setLoading(true);
    try {
      // Delete existing room bills to prevent duplication
      await api.delete(`/api/electricity/cycles/${cycleId}/room-bills`);

      // Go back to room readings step
      setCurrentStep(1);
    } catch (error: any) {
      console.error("Error clearing room bills:", error);
      toast.error(error.response?.data?.error || "Failed to go back");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveRoomReadings = async () => {
    if (!cycleId) return;

    // Validate that at least one room has readings
    const hasReadings = roomBills.some(
      (bill) => bill.currentReading > 0 || bill.previousReading > 0
    );

    if (!hasReadings) {
      toast.error("Please enter meter readings for at least one room");
      return;
    }

    setLoading(true);
    try {
      // First, delete any existing room bills for this cycle to prevent duplication
      await api.delete(`/api/electricity/cycles/${cycleId}/room-bills`);

      // Save all room bills that have readings
      const billsToSave = roomBills.filter(
        (bill) => bill.currentReading > 0 || bill.previousReading > 0
      );

      await Promise.all(
        billsToSave.map((bill) =>
          api.post(`/api/electricity/cycles/${cycleId}/room-bills`, {
            roomId: bill.roomId,
            meterNumber: bill.meterNumber || undefined,
            previousReading: bill.previousReading || 0,
            currentReading: bill.currentReading,
            unitsConsumed: bill.unitsConsumed,
            roomAmount: bill.roomAmount,
            ratePerUnit: bill.ratePerUnit,
            notes: bill.notes || undefined,
          })
        )
      );

      // If Promise.all doesn't throw, all requests were successful
      // Fetch summary
      await fetchSummary();
      setCurrentStep(2);
      toast.success("Meter readings saved");
    } catch (error: any) {
      console.error("Save readings error:", error);
      toast.error(error.response?.data?.error || "Failed to save meter readings");
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    if (!cycleId) return;

    try {
      const res = await api.get(`/api/electricity/cycles/${cycleId}/summary`);
      setSummary(res.data);
    } catch (error: any) {
      console.error("Fetch summary error:", error);
      toast.error(error.response?.data?.error || "Failed to load summary");
    }
  };

  const handleConfirm = async () => {
    if (!cycleId) return;

    setLoading(true);
    try {
      await api.post(`/api/electricity/cycles/${cycleId}/confirm`, {});

      toast.success("Electricity billing completed! Payment requests created.");
      handleClose();
      onSuccess();
    } catch (error: any) {
      console.error("Confirm billing error:", error);
      toast.error(error.response?.data?.error || "Failed to confirm billing");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setCurrentStep(0);
    setCycleId(null);
    setSummary(null);
  };

  const canProceedStep1 = periodStart && periodEnd && billingMonth;
  const canProceedStep2 = roomBills.some(
    (bill) => bill.currentReading > 0 || bill.previousReading > 0
  );

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-4xl max-w-[95vw] max-h-[90vh] overflow-y-auto" data-testid="dialog-electricity-billing">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl" data-testid="text-dialog-title">
            <Zap className="w-6 h-6 text-yellow-500" />
            Create Electricity Bill
          </DialogTitle>
          <DialogDescription data-testid="text-dialog-description">
            Generate electricity bills for all tenants in a few simple steps
          </DialogDescription>
        </DialogHeader>

        {/* Step Progress */}
        <div className="flex items-center justify-center gap-1 sm:gap-2 mb-6 flex-wrap">
          {STEPS.map((step, idx) => (
            <div key={idx} className="flex items-center">
              <div
                className={cn(
                  "flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 rounded-full transition-all",
                  idx === currentStep
                    ? "bg-purple-100 text-purple-700 font-semibold"
                    : idx < currentStep
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-500"
                )}
                data-testid={`step-indicator-${idx}`}
              >
                {idx < currentStep ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-white flex items-center justify-center text-xs">
                    {idx + 1}
                  </span>
                )}
                <span className="text-xs sm:text-sm hidden sm:inline">{step}</span>
                <span className="text-xs sm:hidden">{idx + 1}</span>
              </div>
              {idx < STEPS.length - 1 && (
                <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 mx-1 sm:mx-2 text-gray-400" />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Billing Details */}
        {currentStep === 0 && (
          <div className="space-y-4" data-testid="step-billing-details">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="period-start">Period Start *</Label>
                <Input
                  id="period-start"
                  type="date"
                  value={periodStart}
                  onChange={(e) => setPeriodStart(e.target.value)}
                  data-testid="input-period-start"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="period-end">Period End *</Label>
                <Input
                  id="period-end"
                  type="date"
                  value={periodEnd}
                  onChange={(e) => setPeriodEnd(e.target.value)}
                  data-testid="input-period-end"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="billing-month">Billing Month *</Label>
              <Input
                id="billing-month"
                type="month"
                value={billingMonth}
                onChange={(e) => setBillingMonth(e.target.value)}
                data-testid="input-billing-month"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="invoice-number">Invoice Number (Optional)</Label>
              <Input
                id="invoice-number"
                type="text"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                placeholder="e.g., EB-202412-001"
                data-testid="input-invoice-number"
              />
            </div>
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                The billing month must be unique. You cannot create multiple bills for the same month.
              </AlertDescription>
            </Alert>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={handleClose} data-testid="button-cancel">
                Cancel
              </Button>
              <Button
                onClick={handleCreateCycle}
                disabled={!canProceedStep1 || loading}
                data-testid="button-next-step-1"
              >
                {loading ? "Creating..." : "Next"}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Meter Readings */}
        {currentStep === 1 && (
          <div className="space-y-4" data-testid="step-meter-readings">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Enter meter readings for each room. The bill will be split equally among all tenants in the room.
              </AlertDescription>
            </Alert>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {roomBills.map((bill) => (
                <Card key={bill.roomId} data-testid={`room-bill-card-${bill.roomNumber}`}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Room {bill.roomNumber}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Meter Number</Label>
                        <Input
                          type="text"
                          value={bill.meterNumber}
                          onChange={(e) =>
                            updateRoomBill(bill.roomId, "meterNumber", e.target.value)
                          }
                          placeholder="Optional"
                          className="h-9"
                          data-testid={`input-meter-${bill.roomNumber}`}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Previous Reading</Label>
                        <Input
                          type="number"
                          value={bill.previousReading || ""}
                          onChange={(e) =>
                            updateRoomBill(bill.roomId, "previousReading", e.target.value)
                          }
                          placeholder="0"
                          className="h-9"
                          data-testid={`input-prev-${bill.roomNumber}`}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Current Reading *</Label>
                        <Input
                          type="number"
                          value={bill.currentReading || ""}
                          onChange={(e) =>
                            updateRoomBill(bill.roomId, "currentReading", e.target.value)
                          }
                          placeholder="0"
                          className="h-9"
                          data-testid={`input-current-${bill.roomNumber}`}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Units Consumed</Label>
                        <Input
                          type="number"
                          value={bill.unitsConsumed}
                          readOnly
                          className="h-9 bg-gray-50"
                          data-testid={`text-units-${bill.roomNumber}`}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Rate/Unit (₹)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={bill.ratePerUnit}
                          onChange={(e) =>
                            updateRoomBill(bill.roomId, "ratePerUnit", e.target.value)
                          }
                          className="h-9"
                          data-testid={`input-rate-${bill.roomNumber}`}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Room Amount (₹)</Label>
                        <Input
                          type="number"
                          value={bill.roomAmount.toFixed(2)}
                          readOnly
                          className="h-9 bg-gray-50 font-semibold"
                          data-testid={`text-amount-${bill.roomNumber}`}
                        />
                      </div>
                      <div className="md:col-span-2 space-y-1">
                        <Label className="text-xs">Notes (Optional)</Label>
                        <Input
                          type="text"
                          value={bill.notes}
                          onChange={(e) =>
                            updateRoomBill(bill.roomId, "notes", e.target.value)
                          }
                          placeholder="e.g., AC usage high"
                          className="h-9"
                          data-testid={`input-notes-${bill.roomNumber}`}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="flex justify-between gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  // Just go back without clearing - user might want to edit billing details
                  setCurrentStep(0);
                }}
                data-testid="button-back-step-2"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button
                onClick={handleSaveRoomReadings}
                disabled={!canProceedStep2 || loading}
                data-testid="button-next-step-2"
              >
                {loading ? "Saving..." : "Next"}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Preview & Confirm */}
        {currentStep === 2 && summary && (
          <div className="space-y-4" data-testid="step-preview">
            <Alert className="bg-blue-50 border-blue-200">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-900">
                Review the calculated bills below. Click confirm to create payment requests for all tenants.
              </AlertDescription>
            </Alert>

            {/* Summary Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-sm text-muted-foreground mb-1">Total Units</div>
                  <div className="text-2xl font-bold">{summary.totalUnits} kWh</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-sm text-muted-foreground mb-1">Total Amount</div>
                  <div className="text-2xl font-bold text-green-600">₹{summary.totalAmount}</div>
                </CardContent>
              </Card>
            </div>

            {/* Room Bills */}
            <div>
              <h3 className="font-semibold mb-2">Room-wise Breakdown</h3>
              <div className="space-y-2">
                {summary.roomBills.map((room, idx) => (
                  <Card key={idx} data-testid={`summary-room-${room.roomNumber}`}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-semibold">Room {room.roomNumber}</div>
                          <div className="text-sm text-muted-foreground">
                            {room.meterNumber && `Meter: ${room.meterNumber} • `}
                            {room.unitsConsumed} units • {room.tenantCount} tenant(s)
                          </div>
                        </div>
                        <div className="text-lg font-bold">₹{room.roomAmount}</div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Tenant Bills */}
            <div>
              <h3 className="font-semibold mb-2">Tenant Payment Requests</h3>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {summary.tenantCharges.map((tenant, idx) => (
                  <div
                    key={idx}
                    className="flex justify-between items-center p-3 border rounded-lg"
                    data-testid={`tenant-bill-${idx}`}
                  >
                    <div>
                      <div className="font-medium">{tenant.tenantName}</div>
                      <div className="text-sm text-muted-foreground">Room {tenant.roomNumber}</div>
                    </div>
                    <div className="font-semibold text-purple-600">₹{tenant.amount}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-between gap-2 pt-4">
              <Button
                variant="outline"
                onClick={handleBackToRoomReadings}
                disabled={loading}
                data-testid="button-back-step-3"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={loading}
                className="bg-green-600 hover:bg-green-700"
                data-testid="button-confirm"
              >
                {loading ? "Confirming..." : "Confirm & Create Payments"}
                <Check className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

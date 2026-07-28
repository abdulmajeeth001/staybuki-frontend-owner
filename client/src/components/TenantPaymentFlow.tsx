import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Banknote, Upload, Check, X, Copy, Smartphone } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { tenantService } from "@/services/tenantService";
import type { TenantPaymentResponse, PaymentUpdateRequest } from "@/types/tenant";

interface TenantPaymentFlowProps {
  payment: TenantPaymentResponse;
  ownerUpiId?: string;
  onSuccess: () => void;
}

export function TenantPaymentFlow({ payment, ownerUpiId, onSuccess }: TenantPaymentFlowProps) {
  const { toast } = useToast();
  const [paymentMethod, setPaymentMethod] = useState<"upi" | "cash" | null>(null);
  const [transactionId, setTransactionId] = useState("");
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const handleCopyUpiId = () => {
    if (!ownerUpiId) return;
    
    navigator.clipboard.writeText(ownerUpiId).then(() => {
      setIsCopied(true);
      toast({
        title: "UPI ID Copied!",
        description: "Open any UPI app (GPay, PhonePe, Paytm) to pay",
      });
      setTimeout(() => setIsCopied(false), 2000);
    }).catch(() => {
      toast({
        title: "Copy Failed",
        description: "Please manually copy the UPI ID",
        variant: "destructive",
      });
    });
  };

  const handleQuickPay = (app: 'gpay' | 'phonepe') => {
    if (!ownerUpiId) return;

    // Generate unique transaction reference
    const txnRef = `RENT${Date.now()}`;
    
    // Build UPI parameters
    const params = new URLSearchParams({
      pa: ownerUpiId,
      pn: 'PG Rent Payment',
      am: String(payment.amount),
      cu: 'INR',
      tr: txnRef,
      tn: `Rent Payment ${payment.paymentMonth || ''}`
    });

    // Use app-specific deep link schemes
    const deepLinks = {
      gpay: `gpay://upi/pay?${params.toString()}`,
      phonepe: `phonepe://pay?${params.toString()}`
    };

    // Try to open the selected UPI app
    window.location.href = deepLinks[app];

    toast({
      title: `Opening ${app === 'gpay' ? 'Google Pay' : 'PhonePe'}`,
      description: "If app doesn't open, use the Copy UPI ID option below",
    });
  };

  const handleCashPayment = async () => {
    if (!payment.id) {
      toast({ title: "Error", description: "Invalid payment ID", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    try {
      await tenantService.initiateCashPayment(payment.id);

      toast({
        title: "Cash Payment Request Sent",
        description: "Your request has been sent to the owner for approval.",
      });
      onSuccess();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to send cash payment request",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleScreenshotUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please upload an image smaller than 5MB",
        variant: "destructive",
      });
      return;
    }

    // Convert to base64
    setScreenshotFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setScreenshotPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitUpiPayment = async () => {
    if (!screenshotFile) {
      toast({
        title: "Screenshot Required",
        description: "Please upload payment screenshot to proceed",
        variant: "destructive",
      });
      return;
    }

    if (!payment.id) {
      toast({ title: "Error", description: "Invalid payment ID", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: PaymentUpdateRequest = {
        transactionId: transactionId.trim() || undefined,
        paymentMethod: "UPI",
      };
      await tenantService.submitUpiPayment(payment.id, payload, screenshotFile);

      toast({
        title: "Payment Submitted",
        description: "Your payment is pending owner approval.",
      });
      onSuccess();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || error.response?.data?.error || "Failed to submit payment proof",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Payment method selection screen
  if (paymentMethod === null) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl md:text-2xl">Pay ₹{payment.amount}</CardTitle>
          <CardDescription className="text-sm md:text-base">Choose your payment method</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 md:space-y-4 px-4 md:px-6">
          <Button
            onClick={() => setPaymentMethod("upi")}
            className="w-full h-14 md:h-16 text-base md:text-lg"
            disabled={!ownerUpiId}
            data-testid="button-pay-upi"
          >
            <Smartphone className="w-5 h-5 mr-2" />
            Pay via UPI
          </Button>
          {!ownerUpiId && (
            <p className="text-sm text-orange-600 text-center px-2">
              Owner hasn't set up UPI ID yet
            </p>
          )}
          
          <Button
            onClick={handleCashPayment}
            variant="outline"
            className="w-full h-14 md:h-16 text-base md:text-lg"
            disabled={isSubmitting}
            data-testid="button-pay-cash"
          >
            <Banknote className="w-5 h-5 mr-2" />
            {isSubmitting ? "Sending Request..." : "Pay Cash"}
          </Button>
        </CardContent>
      </Card>
    );
  }

  // UPI Payment screen
  if (paymentMethod === "upi") {
    return (
      <Card className="w-full max-w-2xl mx-auto flex flex-col max-h-[90vh]">
        <CardHeader className="pb-3 md:pb-4 shrink-0">
          <CardTitle className="text-xl md:text-2xl">Pay ₹{payment.amount} via UPI</CardTitle>
          <CardDescription className="text-sm md:text-base">
            Choose Quick Pay or copy UPI ID manually
          </CardDescription>
        </CardHeader>
        <div className="flex-1 overflow-y-auto min-h-0 w-full">
          <CardContent className="space-y-4 md:space-y-6 px-4 md:px-6 pb-6">
            {/* Quick Pay Buttons */}
            <div className="bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-200 rounded-lg p-3 md:p-4 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <Label className="text-sm md:text-base font-bold text-gray-800">Quick Pay (Recommended)</Label>
                <span className="text-xs bg-green-600 text-white px-2 py-1 rounded-full font-medium">Fast</span>
              </div>
              <p className="text-xs md:text-sm text-gray-600">
                Opens app with pre-filled amount and UPI ID
              </p>
              <div className="grid grid-cols-2 gap-2 md:gap-3">
                <Button
                  onClick={() => handleQuickPay('gpay')}
                  className="h-12 md:h-14 bg-blue-600 hover:bg-blue-700 text-sm md:text-base"
                  data-testid="button-quick-pay-gpay"
                >
                  <svg className="w-4 h-4 md:w-5 md:h-5 mr-1.5 md:mr-2" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                  </svg>
                  Google Pay
                </Button>
                <Button
                  onClick={() => handleQuickPay('phonepe')}
                  className="h-12 md:h-14 bg-purple-600 hover:bg-purple-700 text-sm md:text-base"
                  data-testid="button-quick-pay-phonepe"
                >
                  <Smartphone className="w-4 h-4 md:w-5 md:h-5 mr-1.5 md:mr-2" />
                  PhonePe
                </Button>
              </div>
            </div>

            {/* OR Divider */}
            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-xs md:text-sm">
                <span className="px-3 md:px-4 bg-white text-gray-500 font-medium">OR</span>
              </div>
            </div>

            {/* Manual Copy UPI ID */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 rounded-lg p-3 md:p-4 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <Label className="text-sm md:text-base font-bold text-gray-800">Copy UPI ID</Label>
                <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded-full font-medium">Manual</span>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  value={ownerUpiId || ""}
                  readOnly
                  className="bg-white border-2 font-mono text-xs md:text-base h-11"
                  data-testid="input-owner-upi"
                />
                <Button
                  size="lg"
                  onClick={handleCopyUpiId}
                  className={`h-11 px-3 md:px-4 whitespace-nowrap text-xs md:text-sm ${isCopied ? 'bg-green-600 hover:bg-green-700' : ''}`}
                  data-testid="button-copy-upi"
                >
                  {isCopied ? (
                    <>
                      <Check className="h-4 w-4 md:h-5 md:w-5 md:mr-1" />
                      <span className="hidden md:inline">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 md:h-5 md:w-5 md:mr-1" />
                      <span className="hidden md:inline">Copy</span>
                    </>
                  )}
                </Button>
              </div>
              <div className="bg-white/60 rounded p-2.5 md:p-3 space-y-1">
                <p className="text-xs md:text-sm font-medium text-gray-800">How to pay manually:</p>
                <ol className="text-xs text-gray-700 list-decimal list-inside space-y-0.5 md:space-y-1 pl-1">
                  <li>Copy the UPI ID above</li>
                  <li>Open any UPI app (GPay, PhonePe, Paytm, etc.)</li>
                  <li>Send ₹{payment.amount} to this UPI ID</li>
                  <li>Come back here and upload screenshot below</li>
                </ol>
              </div>
            </div>

            {/* Upload Payment Proof */}
            <div className="border-2 border-purple-200 rounded-lg p-3 md:p-4 space-y-3 md:space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <Label className="text-sm md:text-base font-bold text-gray-800">Upload Payment Proof</Label>
                <span className="text-xs bg-purple-600 text-white px-2 py-1 rounded-full font-medium">Required</span>
              </div>

              <div className="space-y-2">
                <Label htmlFor="transaction-id" className="text-xs md:text-sm">Transaction ID (Optional)</Label>
                <Input
                  id="transaction-id"
                  placeholder="e.g., 123456789012"
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  className="h-11 text-sm md:text-base"
                  data-testid="input-transaction-id"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="screenshot" className="text-xs md:text-sm">
                  Payment Screenshot <span className="text-red-500">*</span>
                </Label>
                <div className="border-2 border-dashed border-purple-300 rounded-lg p-3 md:p-4 text-center bg-purple-50/30">
                  {screenshotPreview ? (
                    <div className="space-y-2">
                      <img
                        src={screenshotPreview}
                        alt="Payment screenshot"
                        className="max-w-full h-32 md:h-40 mx-auto object-contain rounded"
                      />
                      <Button
                        variant="ghost"
                        onClick={() => { setScreenshotFile(null); setScreenshotPreview(null); }}
                        className="text-xs md:text-sm h-11"
                        data-testid="button-remove-screenshot"
                      >
                        <X className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                        Remove
                      </Button>
                    </div>
                  ) : (
                    <label htmlFor="screenshot" className="cursor-pointer block py-2">
                      <Upload className="w-6 h-6 md:w-8 md:h-8 mx-auto mb-2 text-purple-600" />
                      <p className="text-xs md:text-sm font-medium text-gray-700 mb-1">
                        Click to upload screenshot
                      </p>
                      <p className="text-xs text-gray-500">
                        Upload the success screen from your UPI app
                      </p>
                      <input
                        id="screenshot"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleScreenshotUpload}
                        data-testid="input-screenshot"
                      />
                    </label>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 md:gap-3 pt-2 md:pt-4">
              <Button
                onClick={() => {
                  setPaymentMethod(null);
                  setScreenshotFile(null); setScreenshotPreview(null);
                  setTransactionId("");
                  setIsCopied(false);
                }}
                variant="outline"
                size="lg"
                className="flex-1 h-11 md:h-12 text-sm md:text-base"
                data-testid="button-cancel"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmitUpiPayment}
                disabled={!screenshotFile || isSubmitting}
                size="lg"
                className="flex-1 h-11 md:h-12 text-sm md:text-base"
                data-testid="button-submit-payment"
              >
                <Check className="w-4 h-4 mr-1" />
                {isSubmitting ? "Submitting..." : "Submit Payment"}
              </Button>
            </div>
          </CardContent>
        </div>
      </Card>
    );
  }

  return null;
}

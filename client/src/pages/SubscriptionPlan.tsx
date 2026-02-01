import MobileLayout from "@/components/layout/MobileLayout";
import { Check, ShieldCheck, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocation } from "wouter";

export default function SubscriptionPlan() {
  const [, setLocation] = useLocation();

  const plans = [
    {
      name: "Starter",
      price: "₹499",
      period: "/month",
      features: ["Up to 20 Tenants", "Basic Reports", "Email Support"],
      recommended: false,
    },
    {
      name: "Pro",
      price: "₹999",
      period: "/month",
      features: ["Unlimited Tenants", "Advanced Analytics", "Priority Support", "Auto Payment Reminders"],
      recommended: true,
    },
    {
      name: "Enterprise",
      price: "₹2499",
      period: "/month",
      features: ["Multiple Branches", "Dedicated Account Manager", "Custom Branding", "API Access"],
      recommended: false,
    },
  ];

  return (
    <div className="min-h-screen bg-background max-w-md mx-auto p-4 py-8 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold">Choose Your Plan</h1>
        <p className="text-muted-foreground text-sm">Select a subscription to manage your PG efficiently.</p>
      </div>

      <div className="space-y-4">
        {plans.map((plan) => (
          <Card 
            key={plan.name} 
            className={`relative overflow-hidden transition-all ${plan.recommended ? 'border-primary shadow-lg shadow-primary/10' : 'border-border shadow-sm'}`}
          >
            {plan.recommended && (
              <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-[10px] font-bold px-3 py-1 rounded-bl-xl">
                RECOMMENDED
              </div>
            )}
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex justify-between items-center">
                {plan.name}
                {plan.recommended && <Zap className="w-4 h-4 text-yellow-500 fill-yellow-500" />}
              </CardTitle>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold">{plan.price}</span>
                <span className="text-muted-foreground text-sm">{plan.period}</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2 text-sm">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-green-100 text-green-600 flex items-center justify-center shrink-0">
                      <Check className="w-3 h-3" />
                    </div>
                    <span className="text-muted-foreground">{feature}</span>
                  </li>
                ))}
              </ul>
              <Button 
                className={`w-full ${plan.recommended ? 'bg-primary' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'}`}
                onClick={() => setLocation("/dashboard")}
              >
                Subscribe Now
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground pt-4">
        <ShieldCheck className="w-4 h-4" />
        <span>Secure payment via Stripe</span>
      </div>
    </div>
  );
}

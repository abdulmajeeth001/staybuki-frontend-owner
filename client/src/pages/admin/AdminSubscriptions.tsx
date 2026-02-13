import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CreditCard, Check, Zap, Crown, Building } from "lucide-react";
import DesktopLayout from "@/components/layout/DesktopLayout";
import MobileLayout from "@/components/layout/MobileLayout";
import { useIsMobile } from "@/hooks/use-mobile";
import { motion } from "framer-motion";

interface SubscriptionPlan {
  id: number;
  name: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  maxRooms: number;
  maxTenants: number;
  features: string[];
  isActive: boolean;
}

interface PGSubscription {
  id: number;
  pgName: string;
  ownerName: string;
  planName: string;
  billingCycle: string;
  amount: number;
  status: string;
  startDate: string;
  endDate: string;
  paidAt: string | null;
}

export default function AdminSubscriptions() {
  const isMobile = useIsMobile();

  const { data: plans, isLoading: plansLoading } = useQuery<SubscriptionPlan[]>({
    queryKey: ["/api/admin/subscription-plans"],
  });

  const { data: subscriptions, isLoading: subsLoading } = useQuery<PGSubscription[]>({
    queryKey: ["/api/admin/pg-subscriptions"],
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge variant="default" className="bg-green-600 hover:bg-green-700 font-medium">Active</Badge>;
      case "pending":
        return <Badge variant="secondary" className="font-medium">Pending</Badge>;
      case "expired":
        return <Badge variant="destructive" className="font-medium">Expired</Badge>;
      case "cancelled":
        return <Badge variant="outline" className="font-medium">Cancelled</Badge>;
      default:
        return <Badge variant="outline" className="font-medium">{status}</Badge>;
    }
  };

  const getPlanIcon = (planName: string) => {
    const name = planName.toLowerCase();
    if (name.includes('premium') || name.includes('pro')) return Crown;
    if (name.includes('plus')) return Zap;
    return CreditCard;
  };

  const content = (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground" data-testid="text-subscriptions-title">
          Subscription Management
        </h1>
        <p className="text-sm md:text-base text-muted-foreground mt-2">
          Manage subscription plans and PG subscriptions
        </p>
      </div>

      <Card className="border-border">
        <CardHeader>
          <CardTitle>Subscription Plans</CardTitle>
          <CardDescription>Available pricing tiers for PG owners</CardDescription>
        </CardHeader>
        <CardContent>
          {plansLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="border-border">
                  <CardHeader className="space-y-3">
                    <div className="h-6 bg-muted rounded w-24 animate-pulse" />
                    <div className="h-4 bg-muted rounded w-full animate-pulse" />
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="h-10 bg-muted rounded w-32 animate-pulse" />
                    <div className="h-20 bg-muted rounded animate-pulse" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : plans?.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <CreditCard className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-lg font-medium">No subscription plans configured</p>
              <p className="text-sm mt-1">Create plans to enable subscriptions</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {plans?.map((plan, index) => {
                const Icon = getPlanIcon(plan.name);
                return (
                  <motion.div
                    key={plan.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  >
                    <Card 
                      className={`border-border hover:border-primary/50 transition-all duration-300 ${!plan.isActive ? "opacity-60" : ""}`} 
                      data-testid={`card-plan-${plan.id}`}
                    >
                      <CardHeader className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                              <Icon className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <CardTitle className="text-lg">{plan.name}</CardTitle>
                            </div>
                          </div>
                          {!plan.isActive && <Badge variant="outline">Inactive</Badge>}
                        </div>
                        <CardDescription className="text-xs">{plan.description}</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-1">
                          <div className="flex items-baseline gap-1">
                            <span className="text-3xl font-bold">₹{plan.monthlyPrice.toLocaleString('en-IN')}</span>
                            <span className="text-sm text-muted-foreground">/month</span>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            or ₹{plan.yearlyPrice.toLocaleString('en-IN')}/year
                          </div>
                        </div>
                        
                        <div className="space-y-2 pt-3 border-t">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Max Rooms</span>
                            <span className="font-semibold">{plan.maxRooms}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Max Tenants</span>
                            <span className="font-semibold">{plan.maxTenants}</span>
                          </div>
                        </div>
                        
                        {plan.features.length > 0 && (
                          <div className="space-y-2 pt-3 border-t">
                            {plan.features.slice(0, 3).map((feature, idx) => (
                              <div key={idx} className="text-xs text-muted-foreground flex items-start gap-2">
                                <Check className="h-3 w-3 text-green-600 mt-0.5 shrink-0" />
                                <span>{feature}</span>
                              </div>
                            ))}
                            {plan.features.length > 3 && (
                              <div className="text-xs text-muted-foreground">
                                +{plan.features.length - 3} more features
                              </div>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-border">
        <CardHeader>
          <CardTitle>Active Subscriptions</CardTitle>
          <CardDescription>
            {subscriptions?.length || 0} active subscription{subscriptions?.length !== 1 ? "s" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {subsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-muted rounded animate-pulse" />
              ))}
            </div>
          ) : subscriptions?.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Building className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-lg font-medium">No active subscriptions</p>
              <p className="text-sm mt-1">Subscriptions will appear here once PGs subscribe</p>
            </div>
          ) : (
            <>
              {/* Mobile Card View */}
              <div className="md:hidden space-y-3">
                {subscriptions?.map((sub, index) => (
                  <motion.div
                    key={sub.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: index * 0.05 }}
                  >
                    <Card className="border-border" data-testid={`card-subscription-${sub.id}`}>
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-base">{sub.pgName}</CardTitle>
                            <CardDescription className="text-xs mt-1">{sub.ownerName}</CardDescription>
                          </div>
                          {getStatusBadge(sub.status)}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <p className="text-muted-foreground text-xs">Plan</p>
                            <p className="font-medium">{sub.planName}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground text-xs">Amount</p>
                            <p className="font-medium">₹{sub.amount.toLocaleString('en-IN')}</p>
                          </div>
                        </div>
                        <div className="pt-2 border-t text-xs text-muted-foreground">
                          {new Date(sub.startDate).toLocaleDateString()} - {new Date(sub.endDate).toLocaleDateString()}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>

              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>PG Name</TableHead>
                      <TableHead>Owner</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Billing</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Period</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {subscriptions?.map((sub) => (
                      <TableRow key={sub.id} data-testid={`row-subscription-${sub.id}`}>
                        <TableCell className="font-medium">{sub.pgName}</TableCell>
                        <TableCell>{sub.ownerName}</TableCell>
                        <TableCell>{sub.planName}</TableCell>
                        <TableCell className="capitalize">{sub.billingCycle}</TableCell>
                        <TableCell className="font-semibold">₹{sub.amount.toLocaleString('en-IN')}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(sub.startDate).toLocaleDateString()} - {new Date(sub.endDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell>{getStatusBadge(sub.status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );

  return isMobile ? (
    <MobileLayout title="Subscriptions">{content}</MobileLayout>
  ) : (
    <DesktopLayout>{content}</DesktopLayout>
  );
}

import { useEffect, useState } from "react";
import MobileLayout from "@/components/layout/MobileLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Mail, Phone, Calendar, User, Sparkles, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/apiClient";

export default function TenantProfile() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await api.get("/api/tenant/profile");
      setProfile(res.data);
    } catch (err) {
      console.error("Failed to fetch profile:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <MobileLayout title="Profile">
        <div className="space-y-6">
          <div className="flex justify-center">
            <Skeleton className="w-32 h-32 rounded-full" />
          </div>
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </MobileLayout>
    );
  }

  const profileSections = [
    {
      title: "Personal Information",
      icon: User,
      gradient: "from-purple-500 to-blue-600",
      fields: [
        { label: "Name", value: profile?.name, icon: User },
        { label: "Email", value: profile?.email, icon: Mail },
        { label: "Phone", value: profile?.phone, icon: Phone },
      ],
    },
    {
      title: "Account Details",
      icon: Shield,
      gradient: "from-blue-500 to-cyan-600",
      fields: [
        { label: "Member Since", value: profile?.joinDate || "N/A", icon: Calendar },
      ],
    },
  ];

  return (
    <MobileLayout title="Profile">
      {/* Hero Section with Avatar */}
      <div className="relative -mx-4 -mt-6 mb-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-blue-600 to-purple-700" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(120,119,198,0.3),rgba(255,255,255,0))]" />
        
        <div className="relative px-6 py-12 text-white text-center">
          {/* Avatar */}
          <div className="flex justify-center mb-4">
            <div className="relative">
              <div className="w-32 h-32 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border-4 border-white/30 shadow-2xl">
                <User className="w-16 h-16 text-white" />
              </div>
              <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 border-4 border-white flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>
          
          <h1 className="text-3xl font-bold drop-shadow-lg mb-1">{profile?.name || "Tenant"}</h1>
          <p className="text-sm text-white/90">StayBuki Member</p>
        </div>
      </div>

      {/* Profile Sections */}
      <div className="space-y-6">
        {profileSections.map((section) => {
          const SectionIcon = section.icon;
          return (
            <Card key={section.title} className="relative border-2 hover:shadow-xl transition-all duration-300 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-blue-50 opacity-50" />
              
              {/* Section Header */}
              <div className="relative px-5 pt-5 pb-3 border-b-2 border-dashed border-gray-200">
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center",
                    `bg-gradient-to-br ${section.gradient}`
                  )}>
                    <SectionIcon className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-lg font-bold text-gray-800">{section.title}</h2>
                </div>
              </div>
              
              {/* Section Fields */}
              <CardContent className="relative p-5 space-y-3">
                {section.fields.map((field) => {
                  const FieldIcon = field.icon;
                  return (
                    <div 
                      key={field.label}
                      className="flex items-center gap-4 p-4 rounded-xl bg-white border-2 border-gray-200 hover:border-purple-200 hover:shadow-md transition-all duration-300 group"
                    >
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                        <FieldIcon className="w-6 h-6 text-purple-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-gray-600 font-medium mb-0.5">{field.label}</p>
                        <p
                          className="font-bold text-base text-gray-800"
                          data-testid={`text-profile-${field.label.toLowerCase().replace(" ", "-")}`}
                        >
                          {field.value || "N/A"}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </MobileLayout>
  );
}

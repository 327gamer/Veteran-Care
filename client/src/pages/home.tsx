
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  HeartPulse, 
  Briefcase, 
  Home as HomeIcon, 
  FileText, 
  ChevronRight,
  MapPin,
  ShieldAlert,
  Brain,
  GraduationCap,
  Scale,
  Users,
  FileArchive,
  Flag
} from "lucide-react";
import { Link, useLocation } from "wouter";
import logoImg from "@assets/IMG_9105_1766382279761.png";

const quickActions = [
  { label: "Benefits & VA Claims", icon: FileText, color: "text-blue-600", bg: "bg-blue-50" },
  { label: "Healthcare", icon: HeartPulse, color: "text-red-600", bg: "bg-red-50" },
  { label: "Crisis Help", icon: ShieldAlert, color: "text-rose-600", bg: "bg-rose-50" },
  { label: "Mental Health", icon: Brain, color: "text-purple-600", bg: "bg-purple-50" },
  { label: "Housing Support", icon: HomeIcon, color: "text-orange-600", bg: "bg-orange-50" },
  { label: "Employment", icon: Briefcase, color: "text-emerald-600", bg: "bg-emerald-50" },
  { label: "Education & GI Bill", icon: GraduationCap, color: "text-indigo-600", bg: "bg-indigo-50" },
  { label: "Legal & Financial", icon: Scale, color: "text-slate-600", bg: "bg-slate-50" },
  { label: "Family & Caregivers", icon: Users, color: "text-pink-600", bg: "bg-pink-50" },
  { label: "Military Records", icon: FileArchive, color: "text-amber-600", bg: "bg-amber-50" },
  { label: "Transition", icon: Flag, color: "text-cyan-600", bg: "bg-cyan-50" },
];

export default function Home() {
  const [, setLocation] = useLocation();

  const handleCategoryClick = (category: string) => {
    setLocation(`/resources?category=${encodeURIComponent(category)}`);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Brand Header - Green Banner Style */}
      <section className="bg-primary -mx-4 md:-mx-6 -mt-4 md:-mt-6 py-10 flex flex-col items-center justify-center text-center space-y-4 shadow-lg mb-6">
        <div className="h-32 w-56 overflow-hidden rounded-xl bg-primary shadow-2xl border border-white/20 flex items-center justify-center">
          <img src={logoImg} alt="VeteranCare" className="h-full w-full object-cover" />
        </div>
        <div className="space-y-1">
          <h1 className="text-4xl font-heading font-extrabold text-white tracking-tight uppercase drop-shadow-md">VeteranCare</h1>
          <p className="text-primary-foreground/90 font-medium max-w-xs mx-auto text-sm">Your trusted guide to benefits, health, and local resources.</p>
        </div>
      </section>

      {/* Welcome / Quick Prompt */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-primary">Good Morning, Soldier</h2>
          <Badge variant="outline" className="border-primary/20 text-primary bg-primary/5">
            <MapPin className="mr-1 h-3 w-3" />
            Austin, TX
          </Badge>
        </div>
        
        <Card className="bg-gradient-to-br from-primary to-primary/90 text-white border-none shadow-lg overflow-hidden relative">
          <div className="absolute right-0 top-0 h-32 w-32 bg-white/5 rounded-full blur-3xl -mr-10 -mt-10"></div>
          <CardHeader>
            <CardTitle className="text-xl">How can we help today?</CardTitle>
            <p className="text-primary-foreground/80 text-sm">
              Our AI Guide is ready to assist you with benefits, health, and more.
            </p>
          </CardHeader>
          <CardContent>
            <Button variant="secondary" className="w-full text-primary font-semibold shadow-md">
              Ask the Guide
            </Button>
          </CardContent>
        </Card>
      </section>

      {/* Quick Actions - All Categories */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-heading font-semibold">Quick Actions</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {quickActions.map((item, i) => (
            <Card 
              key={i} 
              className="hover:border-primary/50 transition-colors cursor-pointer h-full group"
              onClick={() => handleCategoryClick(item.label)}
            >
              <CardContent className="p-4 flex flex-col items-center justify-center gap-2 text-center">
                <div className={`h-10 w-10 rounded-full ${item.bg} flex items-center justify-center ${item.color}`}>
                  <item.icon className="h-5 w-5" />
                </div>
                <span className="font-medium text-sm text-foreground group-hover:text-primary transition-colors line-clamp-2">
                  {item.label}
                </span>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Recommended for You */}
      <section className="space-y-3">
        <h2 className="text-lg font-heading font-semibold">Recommended for You</h2>
        <Card className="overflow-hidden border-l-4 border-l-accent">
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-2">
              <Badge variant="secondary">New Benefit</Badge>
            </div>
            <h3 className="text-lg font-semibold mb-1">PACT Act Updates</h3>
            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
              New eligibility requirements have been released for toxic exposure claims. Check if you qualify.
            </p>
            <Button variant="ghost" size="sm" className="w-full justify-between text-primary font-medium hover:text-primary/80 p-0 h-auto">
              Read Details <ChevronRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

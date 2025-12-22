
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  HeartPulse, 
  Briefcase, 
  Home as HomeIcon, 
  FileText, 
  ChevronRight,
  Star,
  MapPin
} from "lucide-react";
import { Link } from "wouter";

export default function Home() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Welcome / Quick Prompt */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-primary">Good Morning, Soldier</h1>
          <Badge variant="outline" className="border-primary/20 text-primary bg-primary/5">
            <MapPin className="mr-1 h-3 w-3" />
            Austin, TX
          </Badge>
        </div>
        
        <Card className="bg-gradient-to-br from-primary to-primary/90 text-white border-none shadow-lg overflow-hidden relative">
          <div className="absolute right-0 top-0 h-32 w-32 bg-white/5 rounded-full blur-3xl -mr-10 -mt-10"></div>
          <CardHeader>
            <CardTitle className="text-xl">How can we help today?</CardTitle>
            <CardDescription className="text-primary-foreground/80">
              Our AI Guide is ready to assist you with benefits, health, and more.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="secondary" className="w-full text-primary font-semibold shadow-md">
              Ask the Guide
            </Button>
          </CardContent>
        </Card>
      </section>

      {/* Quick Access Categories */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-heading font-semibold">Quick Actions</h2>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "My Benefits", icon: FileText, color: "text-blue-600", bg: "bg-blue-50" },
            { label: "Healthcare", icon: HeartPulse, color: "text-red-600", bg: "bg-red-50" },
            { label: "Find Jobs", icon: Briefcase, color: "text-emerald-600", bg: "bg-emerald-50" },
            { label: "Housing", icon: HomeIcon, color: "text-orange-600", bg: "bg-orange-50" },
          ].map((item, i) => (
            <Link key={i} href="/resources">
              <a className="block group">
                <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
                  <CardContent className="p-4 flex flex-col items-center justify-center gap-2 text-center">
                    <div className={`h-10 w-10 rounded-full ${item.bg} flex items-center justify-center ${item.color}`}>
                      <item.icon className="h-5 w-5" />
                    </div>
                    <span className="font-medium text-sm text-foreground group-hover:text-primary transition-colors">
                      {item.label}
                    </span>
                  </CardContent>
                </Card>
              </a>
            </Link>
          ))}
        </div>
      </section>

      {/* Recommended for You */}
      <section className="space-y-3">
        <h2 className="text-lg font-heading font-semibold">Recommended for You</h2>
        <Card className="overflow-hidden border-l-4 border-l-accent">
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between">
              <div>
                <Badge variant="secondary" className="mb-2">New Benefit</Badge>
                <CardTitle className="text-lg">PACT Act Updates</CardTitle>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground line-clamp-2">
              New eligibility requirements have been released for toxic exposure claims. Check if you qualify.
            </p>
          </CardContent>
          <CardFooter className="bg-muted/30 p-3">
            <Button variant="ghost" size="sm" className="w-full justify-between text-primary font-medium hover:text-primary/80">
              Read Details <ChevronRight className="h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
      </section>

       {/* Favorites */}
       <section className="space-y-3 pb-8">
        <h2 className="text-lg font-heading font-semibold">Your Favorites</h2>
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {[1, 2, 3].map((_, i) => (
            <Card key={i} className="min-w-[140px] w-[140px] flex-shrink-0">
               <CardContent className="p-3 flex flex-col gap-2">
                  <div className="flex justify-between items-start">
                    <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center">
                      <Star className="h-4 w-4 text-accent fill-accent" />
                    </div>
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Folder {i + 1}</p>
                    <p className="text-xs text-muted-foreground">3 items</p>
                  </div>
               </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}

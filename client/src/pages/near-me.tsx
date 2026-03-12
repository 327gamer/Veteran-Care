
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Navigation, Phone } from "lucide-react";
import { Link } from "wouter";

export default function NearMe() {
  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
       <div className="flex-none mb-4">
        <h1 className="text-2xl font-bold text-primary">Near You</h1>
        <p className="text-muted-foreground text-sm">Showing resources within 25 miles of Austin, TX</p>
        <Link href="/resources">
          <Button data-testid="button-browse-resources" className="mt-3 rounded-full px-5">
            Browse Resources
          </Button>
        </Link>
       </div>

       {/* Map Placeholder */}
       <div className="flex-1 bg-muted rounded-xl border relative overflow-hidden mb-4 min-h-[200px]">
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground font-medium">
             <div className="text-center">
               <MapPin className="h-12 w-12 mx-auto mb-2 opacity-50" />
               <p>Map View Loading...</p>
             </div>
          </div>
       </div>

       {/* List of Places */}
       <div className="space-y-3">
          {[
            { name: "Austin VA Outpatient Clinic", type: "Medical Center", dist: "2.4 mi" },
            { name: "Texas Veterans Commission", type: "Benefits Office", dist: "5.1 mi" },
            { name: "VFW Post 8787", type: "Organization", dist: "8.3 mi" },
          ].map((place, i) => (
             <Card key={i}>
                <CardContent className="p-4 flex items-center justify-between">
                   <div className="flex items-start gap-3">
                      <div className="mt-1 h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                        <MapPin className="h-4 w-4" />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm">{place.name}</h3>
                        <p className="text-xs text-muted-foreground">{place.type}</p>
                        <p className="text-xs font-medium text-primary mt-1">{place.dist}</p>
                      </div>
                   </div>
                   <div className="flex gap-2">
                     <Button size="icon" variant="outline" className="h-8 w-8">
                       <Phone className="h-4 w-4" />
                     </Button>
                     <Button size="icon" className="h-8 w-8">
                       <Navigation className="h-4 w-4" />
                     </Button>
                   </div>
                </CardContent>
             </Card>
          ))}
       </div>
    </div>
  );
}

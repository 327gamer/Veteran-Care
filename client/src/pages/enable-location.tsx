
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import logoImg from "@assets/IMG_9105_1766382279761.png";
import { MapPin } from "lucide-react";

export default function EnableLocation() {
  const [, setLocation] = useLocation();

  const handleAllow = () => {
    // In a real app, this would request permission
    // For prototype, we simulate allowing and move to onboarding
    setLocation("/onboarding");
  };

  const handleMaybeLater = () => {
    setLocation("/onboarding");
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-6 bg-background relative overflow-hidden">
      
      {/* Content Container */}
      <div className="w-full max-w-md flex flex-col items-center text-center space-y-6 animate-in fade-in zoom-in duration-500">
        
        {/* Logo Section */}
        <div className="w-full flex justify-center mb-0">
          <div className="h-40 w-full max-w-[240px] flex items-center justify-center drop-shadow-2xl">
             <img src={logoImg} alt="VeteranCare Logo" className="h-full w-full object-contain" />
          </div>
        </div>

        {/* Map Pin Icon with Circle Background */}
        <div className="relative flex items-center justify-center -mt-4">
          <div className="h-12 w-12 rounded-full bg-primary/5 flex items-center justify-center animate-pulse">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
               <MapPin className="h-4 w-4 text-primary fill-primary" />
            </div>
          </div>
        </div>

        {/* Text Section */}
        <div className="space-y-1">
          <h1 className="text-lg font-heading font-extrabold tracking-tight uppercase text-primary">
            ENABLE LOCATION
          </h1>
          <p className="text-muted-foreground text-[10px] leading-relaxed px-4">
            Help us show resources near you.
            <br /><br />
            Enabling location allows VeteranCare to quickly direct you to local benefits, services, and support in your area—without you having to search or sort through unnecessary information.
          </p>
        </div>

        {/* Buttons Section */}
        <div className="w-full space-y-2 pt-2">
          <Button 
            className="w-full h-10 text-base font-bold rounded-full shadow-lg" 
            onClick={handleAllow}
          >
            Allow
          </Button>

          <Button 
            variant="ghost" 
            className="w-full text-sm font-medium text-muted-foreground hover:text-primary hover:bg-transparent h-8"
            onClick={handleMaybeLater}
          >
            Maybe later
          </Button>
        </div>
      </div>
    </div>
  );
}


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
          <div className="h-72 w-full max-w-[320px] flex items-center justify-center drop-shadow-2xl">
             <img src={logoImg} alt="VeteranCare Logo" className="h-full w-full object-contain" />
          </div>
        </div>

        {/* Map Pin Icon with Circle Background */}
        <div className="relative flex items-center justify-center -mt-4">
          <div className="h-20 w-20 rounded-full bg-primary/5 flex items-center justify-center animate-pulse">
            <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
               <MapPin className="h-7 w-7 text-primary fill-primary" />
            </div>
          </div>
        </div>

        {/* Text Section */}
        <div className="space-y-2">
          <h1 className="text-2xl font-heading font-extrabold tracking-tight uppercase text-primary">
            ENABLE LOCATION
          </h1>
          <p className="text-muted-foreground text-sm leading-relaxed px-4">
            Help us show resources near you.
            <br /><br />
            Enabling location allows VeteranCare to quickly direct you to local benefits, services, and support in your area—without you having to search or sort through unnecessary information.
          </p>
        </div>

        {/* Buttons Section */}
        <div className="w-full space-y-3 pt-2">
          <Button 
            className="w-full h-12 text-lg font-bold rounded-full shadow-lg" 
            onClick={handleAllow}
          >
            Allow
          </Button>

          <Button 
            variant="ghost" 
            className="w-full text-base font-medium text-muted-foreground hover:text-primary hover:bg-transparent h-10"
            onClick={handleMaybeLater}
          >
            Maybe later
          </Button>
        </div>
      </div>
    </div>
  );
}


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
      <div className="w-full max-w-md flex flex-col items-center text-center space-y-10 animate-in fade-in zoom-in duration-500">
        
        {/* Logo Section */}
        <div className="w-full flex justify-center mb-4">
          <div className="h-32 w-auto flex items-center justify-center">
             <img src={logoImg} alt="VeteranCare Logo" className="h-full w-full object-contain" />
          </div>
        </div>

        {/* Map Pin Icon with Circle Background */}
        <div className="relative flex items-center justify-center">
          <div className="h-32 w-32 rounded-full bg-primary/5 flex items-center justify-center animate-pulse">
            <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center">
               <MapPin className="h-12 w-12 text-primary fill-primary" />
            </div>
          </div>
        </div>

        {/* Text Section */}
        <div className="space-y-4">
          <h1 className="text-3xl font-heading font-extrabold tracking-tight uppercase text-primary">
            ENABLE LOCATION
          </h1>
          <p className="text-muted-foreground text-base leading-relaxed px-4">
            Help us show resources near you.
            <br /><br />
            Enabling location allows VeteranCare to quickly direct you to local benefits, services, and support in your area—without you having to search or sort through unnecessary information. Your location is only used to improve your experience.
          </p>
        </div>

        {/* Buttons Section */}
        <div className="w-full space-y-4 pt-8">
          <Button 
            className="w-full h-14 text-lg font-bold rounded-full shadow-lg" 
            onClick={handleAllow}
          >
            Allow
          </Button>

          <Button 
            variant="ghost" 
            className="w-full text-base font-medium text-muted-foreground hover:text-primary hover:bg-transparent"
            onClick={handleMaybeLater}
          >
            Maybe later
          </Button>
        </div>
      </div>
    </div>
  );
}


import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import logoImg from "@assets/IMG_9105_1766382279761.png";

export default function Landing() {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-6 relative overflow-hidden bg-primary">
      {/* Background Effects */}
      <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-white/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-black/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Content Container */}
      <div className="relative z-10 w-full max-w-md flex flex-col items-center text-center space-y-8 animate-in fade-in zoom-in duration-700">
        
        {/* Logo Section */}
        <div className="mb-4 w-full flex justify-center transform hover:scale-105 transition-transform duration-500">
          <div className="h-40 w-full max-w-[240px] flex items-center justify-center drop-shadow-2xl">
             <img src={logoImg} alt="VeteranCare Logo" className="h-full w-full object-contain" />
          </div>
        </div>

        {/* Text Section */}
        <div className="space-y-2 text-white">
          <h1 className="text-2xl font-heading font-extrabold tracking-tight uppercase drop-shadow-md">
            VeteranCare
          </h1>
          <p className="text-primary-foreground/90 text-xs leading-relaxed font-medium px-2">
            VeteranCare is a comprehensive, easy-to-use resource center for veterans from all branches of the U.S. Military. Find benefits, healthcare, housing, employment, education, and support services in one place—quickly and clearly. VeteranCare helps veterans navigate the resources they’ve earned, without confusion or wasted time.
          </p>
        </div>

        {/* Buttons Section */}
        <div className="w-full space-y-2 pt-2">
          <Link href="/enable-location">
            <Button className="w-full h-10 text-base font-bold bg-white text-primary hover:bg-white/90 rounded-full shadow-lg transition-all hover:scale-[1.02]">
              Get Started
            </Button>
          </Link>

          <Link href="/home">
            <Button variant="outline" className="w-full h-10 text-base font-bold border-2 border-white text-white hover:bg-white/10 bg-transparent rounded-full transition-all hover:scale-[1.02]">
              I already have an account
            </Button>
          </Link>
          
          <Link href="/enable-location">
             <Button className="w-full h-10 text-base font-bold bg-accent hover:bg-accent/90 text-white rounded-full shadow-lg mt-1 transition-all hover:scale-[1.02]">
               Try Demo - See Full Experience
             </Button>
          </Link>
        </div>
      </div>
      
      {/* Footer Text */}
      <p className="absolute bottom-6 text-primary-foreground/40 text-xs font-medium">
        © 2025 VeteranCare. All rights reserved.
      </p>
    </div>
  );
}

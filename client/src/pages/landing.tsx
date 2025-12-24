
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import logoImg from "@assets/IMG_9105_1766382279761.png";

export default function Landing() {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-6 relative overflow-hidden bg-primary pb-24">
      {/* Background Effects */}
      <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-white/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-black/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Content Container */}
      <div className="relative z-10 w-full max-w-md flex flex-col items-center text-center space-y-2 animate-in fade-in zoom-in duration-700">
        
        {/* Logo Section */}
        <div className="w-full flex justify-center transform hover:scale-105 transition-transform duration-500">
          <div className="h-48 w-full max-w-[280px] flex items-center justify-center drop-shadow-2xl">
             <img src={logoImg} alt="VeteranCare Logo" className="h-full w-full object-contain" />
          </div>
        </div>

        {/* Text Section */}
        <div className="space-y-2 text-white">
          <h1 className="text-2xl font-heading font-extrabold tracking-tight uppercase drop-shadow-md leading-tight">
            Welcome to<br/>Veteran Care
          </h1>
          <p className="text-primary-foreground/90 text-xs leading-snug font-medium px-2 text-justify">
            Welcome to Veteran Care, a state-of-the-art, easy-to-navigate resource center built for veterans from all branches of the U.S. Military. Veteran Care brings essential services together in one place, including Benefits & VA Claims, Healthcare, Crisis Help, Mental Health, Housing Support, Employment, Education & GI Bill, Legal & Financial Assistance, Family & Caregivers Support, Military Records, and Transition Resources. The app also features an AI Guide you can talk to and ask questions, designed to help you quickly find the right resources based on your needs and location. Any information you share is private and confidential and is used only to make navigating the system easier. Veterans can save important resources for later and connect with one another through a powerful community where they can create or join groups centered around support, shared interests, experiences, organizations, or causes. Veteran Care simplifies finding help—so you can focus on what’s next.
          </p>
        </div>

        {/* Buttons Section */}
        <div className="w-full space-y-2 pt-1">
          <Link href="/enable-location">
            <Button className="w-full h-10 text-sm font-bold bg-white text-primary hover:bg-white/90 rounded-full shadow-lg transition-all hover:scale-[1.02]">
              Get Started
            </Button>
          </Link>

          <Link href="/home">
            <Button variant="outline" className="w-full h-10 text-sm font-bold border-2 border-white text-white hover:bg-white/10 bg-transparent rounded-full transition-all hover:scale-[1.02]">
              I already have an account
            </Button>
          </Link>
          
          <Link href="/enable-location">
             <Button className="w-full h-10 text-sm font-bold bg-accent hover:bg-accent/90 text-white rounded-full shadow-lg mt-1 transition-all hover:scale-[1.02]">
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

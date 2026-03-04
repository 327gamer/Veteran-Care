import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Shield, Check, ArrowRight } from "lucide-react";
import logoImg from "@assets/Veteran_Care_-_Shadow_-_PNG_1772598034200.png";

export default function Onboarding() {
  const [step, setStep] = useState(1);
  const [, setLocation] = useLocation();

  const nextStep = () => setStep(s => s + 1);
  const finish = () => setLocation("/home");

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background relative overflow-hidden">
      
      {/* Content Container */}
      <div className="w-full max-w-md flex flex-col items-center text-center space-y-4 animate-in fade-in zoom-in duration-500">
        
        {step === 1 && (
             <div className="w-full flex flex-col items-center">
              {/* Logo Section */}
              <div className="w-full flex justify-center mb-0">
                <div className="h-48 w-full max-w-[280px] flex items-center justify-center drop-shadow-2xl">
                   <img src={logoImg} alt="VeteranCare Logo" className="h-full w-full object-contain" />
                </div>
              </div>

              <div className="space-y-1 mb-6 text-center">
                <h1 className="text-xl font-heading font-extrabold tracking-tight uppercase text-primary">
                  SERVICE INFORMATION
                </h1>
                <p className="text-muted-foreground text-[10px] leading-relaxed px-4">
                  Optional. Helps us personalize your benefits.
                </p>
              </div>

              <div className="w-full space-y-3">
                 <div className="space-y-1 text-left">
                    <Label className="text-xs">Branch</Label>
                    <Select>
                      <SelectTrigger className="h-10"><SelectValue placeholder="Select Branch" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="army">Army</SelectItem>
                        <SelectItem value="navy">Navy</SelectItem>
                        <SelectItem value="marines">Marine Corps</SelectItem>
                        <SelectItem value="airforce">Air Force</SelectItem>
                        <SelectItem value="coastguard">Coast Guard</SelectItem>
                        <SelectItem value="spaceforce">Space Force</SelectItem>
                      </SelectContent>
                    </Select>
                 </div>
                 <div className="space-y-1 text-left">
                    <Label className="text-xs">Service Era</Label>
                    <Select>
                      <SelectTrigger className="h-10"><SelectValue placeholder="Select Era" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="post911">Post-9/11</SelectItem>
                        <SelectItem value="gulfwar">Gulf War</SelectItem>
                        <SelectItem value="vietnam">Vietnam</SelectItem>
                        <SelectItem value="korea">Korean War</SelectItem>
                        <SelectItem value="peacetime">Peacetime</SelectItem>
                      </SelectContent>
                    </Select>
                 </div>
              </div>
              
              <div className="w-full space-y-2 pt-6">
                <Button className="w-full h-10 text-base font-bold rounded-full shadow-lg" onClick={nextStep}>
                  Continue
                </Button>
                <Button variant="ghost" className="w-full text-sm font-medium text-muted-foreground h-8" onClick={nextStep}>
                  Skip
                </Button>
              </div>
             </div>
          )}

          {step === 2 && (
            <div className="w-full flex flex-col items-center h-full">
               {/* Logo Section */}
               <div className="w-full flex justify-center mb-0">
                 <div className="h-48 w-full max-w-[280px] flex items-center justify-center drop-shadow-2xl">
                    <img src={logoImg} alt="VeteranCare Logo" className="h-full w-full object-contain" />
                 </div>
               </div>

               <div className="space-y-1 mb-4 text-center">
                  <h1 className="text-xl font-heading font-extrabold tracking-tight uppercase text-primary">
                    HOW CAN VETERAN CARE SUPPORT YOU?
                  </h1>
                  <p className="text-muted-foreground text-[10px] leading-relaxed px-4">
                    Select all that apply.
                  </p>
               </div>
               
               <div className="w-full grid grid-cols-2 gap-2 mb-4">
                 {[
                   "Benefits & VA Claims", 
                   "Healthcare", 
                   "Crisis Help", 
                   "Mental Health", 
                   "Housing Support", 
                   "Employment", 
                   "Education & GI Bill", 
                   "Legal & Financial", 
                   "Family & Caregivers", 
                   "Military Records", 
                   "Transition"
                 ].map((item) => (
                   <div key={item} className="flex items-center space-x-2 border p-2 rounded-md hover:bg-muted/50 transition-colors h-full">
                     <Checkbox id={item} className="h-3.5 w-3.5 shrink-0" />
                     <Label htmlFor={item} className="cursor-pointer font-medium text-[10px] leading-tight">{item}</Label>
                   </div>
                 ))}
               </div>
               
               <div className="w-full pt-1 mt-auto">
                  <Button className="w-full h-10 text-base font-bold rounded-full shadow-lg" onClick={nextStep}>Continue</Button>
               </div>
            </div>
          )}

          {step === 3 && (
             <div className="w-full flex flex-col items-center justify-center space-y-4">
               {/* Logo Section */}
               <div className="w-full flex justify-center mb-2">
                 <div className="h-48 w-full max-w-[280px] flex items-center justify-center drop-shadow-2xl">
                    <img src={logoImg} alt="VeteranCare Logo" className="h-full w-full object-contain" />
                 </div>
               </div>

               <div className="mx-auto bg-green-100 p-3 rounded-full w-fit">
                 <Check className="h-8 w-8 text-green-600" />
               </div>
               
               <div className="text-center space-y-1">
                 <h1 className="text-xl font-heading font-extrabold tracking-tight uppercase text-primary">YOU'RE ALL SET!</h1>
                 <p className="text-muted-foreground text-sm">Your profile has been created.</p>
               </div>
               
               <div className="w-full pt-2">
                 <Button className="w-full h-10 text-base font-bold rounded-full shadow-lg" onClick={finish}>Go to Home</Button>
               </div>
             </div>
          )}
      </div>
    </div>
  );
}

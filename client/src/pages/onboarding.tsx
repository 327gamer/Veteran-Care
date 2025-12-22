import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Shield, Check, ArrowRight } from "lucide-react";
import logoImg from "@assets/IMG_9104_1766377226249.jpeg";

export default function Onboarding() {
  const [step, setStep] = useState(1);
  const [, setLocation] = useLocation();

  const nextStep = () => setStep(s => s + 1);
  const finish = () => setLocation("/");

  return (
    <div className="min-h-screen bg-muted/20 flex flex-col items-center justify-center p-4">
      
      {/* Brand Header */}
      <div className="mb-8 flex flex-col items-center">
        <div className="h-16 w-16 overflow-hidden rounded-lg shadow-md mb-3">
          <img src={logoImg} alt="VeteranCare" className="h-full w-full object-cover" />
        </div>
        <h1 className="text-2xl font-bold font-heading text-primary">VeteranCare</h1>
      </div>

      <div className="w-full max-w-md space-y-4">
        
        {/* Progress Indicator */}
        <div className="flex justify-between px-2">
           {[1, 2, 3, 4].map(i => (
             <div key={i} className={`h-1.5 flex-1 mx-1 rounded-full transition-all duration-300 ${i <= step ? 'bg-primary' : 'bg-muted'}`} />
           ))}
        </div>

        <Card className="border-t-4 border-t-primary shadow-xl">
          {step === 1 && (
            <div className="animate-in fade-in slide-in-from-right-8 duration-300">
              <CardHeader className="text-center">
                <div className="mx-auto bg-primary/10 p-4 rounded-full w-fit mb-2">
                  <MapPin className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="font-heading">Location Setup</CardTitle>
                <CardDescription>Help us show resources near you.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button className="w-full py-6 text-base" variant="outline" onClick={nextStep}>
                  <MapPin className="mr-2 h-5 w-5" /> Enable Location Services
                </Button>
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">Or enter manually</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>City</Label>
                    <Input placeholder="Austin" />
                  </div>
                  <div className="space-y-2">
                    <Label>State</Label>
                    <Select>
                      <SelectTrigger><SelectValue placeholder="TX" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="tx">Texas</SelectItem>
                        <SelectItem value="ca">California</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full" onClick={nextStep}>Continue <ArrowRight className="ml-2 h-4 w-4" /></Button>
              </CardFooter>
            </div>
          )}

          {step === 2 && (
             <div className="animate-in fade-in slide-in-from-right-8 duration-300">
              <CardHeader className="text-center">
                <div className="mx-auto bg-secondary/10 p-4 rounded-full w-fit mb-2">
                  <Shield className="h-8 w-8 text-secondary" />
                </div>
                <CardTitle className="font-heading">Service Information</CardTitle>
                <CardDescription>Optional. Helps us personalize your benefits.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                 <div className="space-y-2">
                    <Label>Branch</Label>
                    <Select>
                      <SelectTrigger><SelectValue placeholder="Select Branch" /></SelectTrigger>
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
                 <div className="space-y-2">
                    <Label>Service Era</Label>
                    <Select>
                      <SelectTrigger><SelectValue placeholder="Select Era" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="post911">Post-9/11</SelectItem>
                        <SelectItem value="gulfwar">Gulf War</SelectItem>
                        <SelectItem value="vietnam">Vietnam</SelectItem>
                        <SelectItem value="korea">Korean War</SelectItem>
                        <SelectItem value="peacetime">Peacetime</SelectItem>
                      </SelectContent>
                    </Select>
                 </div>
              </CardContent>
              <CardFooter className="flex-col gap-2">
                <Button className="w-full" onClick={nextStep}>Continue</Button>
                <Button variant="ghost" className="w-full" onClick={nextStep}>Skip</Button>
              </CardFooter>
             </div>
          )}

          {step === 3 && (
            <div className="animate-in fade-in slide-in-from-right-8 duration-300">
               <CardHeader className="text-center">
                  <CardTitle className="font-heading">What are you looking for?</CardTitle>
                  <CardDescription>Select all that apply.</CardDescription>
               </CardHeader>
               <CardContent>
                 <div className="grid grid-cols-1 gap-3">
                   {["Benefits & Claims", "Healthcare", "Mental Health", "Employment", "Housing", "Education"].map((item) => (
                     <div key={item} className="flex items-center space-x-2 border p-3 rounded-md hover:bg-muted/50 transition-colors">
                       <Checkbox id={item} />
                       <Label htmlFor={item} className="flex-1 cursor-pointer font-medium">{item}</Label>
                     </div>
                   ))}
                 </div>
               </CardContent>
               <CardFooter>
                  <Button className="w-full" onClick={nextStep}>Continue</Button>
               </CardFooter>
            </div>
          )}

          {step === 4 && (
             <div className="animate-in fade-in slide-in-from-right-8 duration-300">
               <CardHeader className="text-center">
                 <div className="mx-auto bg-green-100 p-4 rounded-full w-fit mb-4">
                   <Check className="h-10 w-10 text-green-600" />
                 </div>
                 <CardTitle className="font-heading">You're All Set!</CardTitle>
                 <CardDescription>Your profile has been created.</CardDescription>
               </CardHeader>
               <CardFooter>
                 <Button className="w-full" size="lg" onClick={finish}>Go to Home</Button>
               </CardFooter>
             </div>
          )}
        </Card>
      </div>
    </div>
  );
}

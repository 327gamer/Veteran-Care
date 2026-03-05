
import { useLocation } from "wouter";
import { useEffect } from "react";
import { useSavedResources } from "@/lib/store";

export default function Landing() {
  const [, setLocation] = useLocation();
  const { onboardingComplete } = useSavedResources();

  useEffect(() => {
    if (onboardingComplete) {
      setLocation("/home");
    } else {
      setLocation("/onboarding");
    }
  }, [onboardingComplete, setLocation]);

  return null;
}

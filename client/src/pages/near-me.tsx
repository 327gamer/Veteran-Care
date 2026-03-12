
import { useEffect } from "react";
import { useLocation } from "wouter";

export default function NearMe() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    setLocation("/resources?mode=nearme");
  }, [setLocation]);

  return null;
}

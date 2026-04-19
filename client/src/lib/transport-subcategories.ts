import { Car, Bus, HeartPulse, Users, Hospital, HandHeart, type LucideIcon } from "lucide-react";

export interface TransportSubcategory {
  name: string;
  slug: string;
  icon: LucideIcon;
  description: string;
}

export const TRANSPORT_SUBCATEGORIES: TransportSubcategory[] = [
  {
    name: "VA Medical Transport",
    slug: "va-medical-transport",
    icon: Hospital,
    description: "DAV transportation network and VA-coordinated rides to VA medical appointments.",
  },
  {
    name: "Non-Emergency Medical Transport",
    slug: "nonemergency-medical-transport",
    icon: HeartPulse,
    description: "Scheduled rides to non-emergency medical visits when you can't drive yourself.",
  },
  {
    name: "Veteran Transportation Programs",
    slug: "veteran-transportation-programs",
    icon: Car,
    description: "Veteran-specific transportation programs run by VSOs and nonprofits.",
  },
  {
    name: "Volunteer Driver Programs",
    slug: "volunteer-driver-programs",
    icon: HandHeart,
    description: "Volunteer driver programs that take veterans to appointments, errands, and events.",
  },
  {
    name: "Ride Assistance Programs",
    slug: "ride-assistance-programs",
    icon: Users,
    description: "Subsidized rideshare and taxi voucher programs for veterans.",
  },
  {
    name: "Public Transit Assistance",
    slug: "public-transit-assistance",
    icon: Bus,
    description: "Reduced-fare passes and help navigating public transit for veterans.",
  },
];

import {
  Users,
  Bike,
  Trophy,
  HandHelping,
  Home as HomeIcon,
  Tractor,
  CalendarHeart,
  Trees,
  Music,
  Armchair,
  type LucideIcon,
} from "lucide-react";

export interface CsSubcategory {
  name: string;
  slug: string;
  icon: LucideIcon;
  description: string;
}

/**
 * Step 3 Slice 3d-B — Community Support subcategories.
 *
 * The 10 canonical subs that live under the `community-support` parent
 * category. Order is by curatorial priority (social groups first because
 * they have the broadest coverage after Phase 1 retag, then recreation /
 * volunteer / family / events / hobbies).
 */
export const CS_SUBCATEGORIES: CsSubcategory[] = [
  {
    name: "Veteran Social Groups",
    slug: "veteran-social-groups",
    icon: Users,
    description:
      "American Legion, VFW, DAV, MCL, and other local posts and chapters where veterans gather, organize, and stay connected.",
  },
  {
    name: "Adaptive Recreation",
    slug: "adaptive-recreation",
    icon: Bike,
    description:
      "Adaptive sports, accessible outdoor programs, and inclusive recreation built for veterans of all abilities.",
  },
  {
    name: "Fitness, Sports & Wellness Groups",
    slug: "fitness-sports-wellness-groups",
    icon: Trophy,
    description:
      "Team RWB, Veterans Yoga Project, group runs, gyms, and fitness communities focused on veteran wellness.",
  },
  {
    name: "Volunteer & Mission-Based Community",
    slug: "volunteer-mission-community",
    icon: HandHelping,
    description:
      "Team Rubicon, The Mission Continues, and other groups that channel veterans into service projects.",
  },
  {
    name: "Family-Friendly Veteran Activities",
    slug: "family-friendly-veteran-activities",
    icon: HomeIcon,
    description:
      "Family events, spouse and kids' programs, Blue Star Mothers, and gatherings that welcome the whole household.",
  },
  {
    name: "Farm, Ranch & Equine Programs",
    slug: "farm-ranch-equine-programs",
    icon: Tractor,
    description:
      "Therapeutic riding, ranch retreats, and farm-based programs that pair veterans with animals and the outdoors.",
  },
  {
    name: "Events, Trips & Retreats",
    slug: "events-trips-retreats",
    icon: CalendarHeart,
    description:
      "Honor Flights, weekend retreats, family trips, and special events organized for veterans and their families.",
  },
  {
    name: "Outdoor Recreation",
    slug: "outdoor-recreation",
    icon: Trees,
    description:
      "Fly fishing, hunting, hiking, and outdoor adventure programs designed around veteran camaraderie.",
  },
  {
    name: "Creative Arts, Music & Hobbies",
    slug: "creative-arts-music-hobbies",
    icon: Music,
    description:
      "Guitars for Vets, art therapy, writing groups, woodworking, and other creative outlets for veterans.",
  },
  {
    name: "Senior & Retired Veteran Social",
    slug: "senior-retired-veteran-social",
    icon: Armchair,
    description:
      "Honor Flight programs, senior centers, and social groups built for older and retired veterans.",
  },

  {
    name: "American Legion Posts",
    slug: "american-legion-posts",
    icon: Users,
    description: "Local American Legion posts where veterans gather, organize, and serve.",
  },
  {
    name: "VFW Posts",
    slug: "vfw-posts",
    icon: Users,
    description: "Veterans of Foreign Wars posts across South Carolina open to combat veterans.",
  },
  {
    name: "Veteran Service Organizations",
    slug: "veteran-service-organizations",
    icon: Users,
    description: "Accredited VSOs that advocate, organize events, and help veterans access benefits.",
  },
  {
    name: "Veteran Nonprofit Organizations",
    slug: "veteran-nonprofit-organizations",
    icon: Users,
    description: "Veteran-focused nonprofits running programs across community, recreation, and outreach.",
  },
  {
    name: "Veteran Outreach Programs",
    slug: "veteran-outreach-programs",
    icon: Users,
    description: "Programs that proactively reach veterans in their communities to connect them with help.",
  },
];

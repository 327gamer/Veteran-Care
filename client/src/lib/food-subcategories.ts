import { Utensils, ShoppingBasket, Soup, HeartHandshake, Truck, Home as HomeIcon, Leaf, type LucideIcon } from "lucide-react";

export interface FoodSubcategory {
  name: string;
  slug: string;
  icon: LucideIcon;
  description: string;
}

export const FOOD_SUBCATEGORIES: FoodSubcategory[] = [
  {
    name: "Food Banks",
    slug: "food-banks",
    icon: ShoppingBasket,
    description: "Regional food banks distributing groceries to families across South Carolina.",
  },
  {
    name: "Food Pantries",
    slug: "food-pantries",
    icon: HomeIcon,
    description: "Local food pantries with weekly or monthly grocery distribution.",
  },
  {
    name: "SNAP Assistance",
    slug: "snap-assistance",
    icon: HeartHandshake,
    description: "Help applying for SNAP (food stamps) and connecting to other federal nutrition programs.",
  },
  {
    name: "Community Kitchens",
    slug: "community-kitchens",
    icon: Soup,
    description: "Free hot meals served at community kitchens and soup kitchens.",
  },
  {
    name: "Senior & Disabled Meal Programs",
    slug: "senior-disabled-meal-programs",
    icon: Truck,
    description: "Meals on Wheels and home-delivered meal programs for elderly and disabled veterans.",
  },
  {
    name: "Veteran Meal Programs",
    slug: "veteran-meal-programs",
    icon: Utensils,
    description: "Veteran-specific meal programs and free community meals for veterans.",
  },
  {
    name: "Food Assistance",
    slug: "food-assistance",
    icon: Leaf,
    description: "Other food assistance and nutrition programs.",
  },
];

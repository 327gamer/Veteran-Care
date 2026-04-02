import { Button } from "@/components/ui/button";
import { Navigation } from "lucide-react";
import { type DirectionsLocation, hasDirectionsData, openDirections } from "@/lib/directions";
import { trackEvent } from "@/lib/analytics";

interface GetDirectionsButtonProps {
  location: DirectionsLocation;
  listingType: string;
  listingId?: string;
  listingName?: string;
  variant?: "outline" | "default" | "ghost";
  size?: "sm" | "default" | "lg";
  className?: string;
  fullWidth?: boolean;
}

export default function GetDirectionsButton({
  location,
  listingType,
  listingId,
  listingName,
  variant = "outline",
  size = "sm",
  className = "",
  fullWidth = true,
}: GetDirectionsButtonProps) {
  if (!hasDirectionsData(location)) return null;

  const handleClick = () => {
    trackEvent("get_directions_click", {
      listing_type: listingType,
      listing_id: listingId,
      listing_name: listingName,
      has_coords: location.latitude != null && location.longitude != null,
    });
    openDirections(location);
  };

  return (
    <Button
      data-testid={`button-directions-${listingType}`}
      variant={variant}
      size={size}
      className={`${fullWidth ? "w-full" : ""} ${className}`}
      onClick={handleClick}
    >
      <Navigation className="h-3.5 w-3.5 mr-2" />
      Get Directions
    </Button>
  );
}

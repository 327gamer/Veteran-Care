
import { Users } from "lucide-react";

export default function Community() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] animate-in fade-in duration-500 px-6">
      <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
        <Users className="h-8 w-8 text-primary" />
      </div>
      <h1 className="text-2xl font-heading font-extrabold text-primary tracking-tight mb-2">Community</h1>
      <p className="text-muted-foreground text-sm text-center max-w-xs leading-relaxed">
        Connect with veterans near you. Community features coming soon.
      </p>
    </div>
  );
}

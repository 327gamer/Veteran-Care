
import { ShoppingBag } from "lucide-react";

export default function Shop() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] animate-in fade-in duration-500 px-6">
      <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
        <ShoppingBag className="h-8 w-8 text-primary" />
      </div>
      <h1 className="text-2xl font-heading font-extrabold text-primary tracking-tight mb-2">Shop & Savings</h1>
      <p className="text-muted-foreground text-sm text-center max-w-xs leading-relaxed">
        Verified discounts for veterans and families. Shop features coming soon.
      </p>
    </div>
  );
}


import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, Tag, Image } from "lucide-react";
import { Input } from "@/components/ui/input";

// Import real assets for better visual
import discountImg1 from "@assets/IMG_9107_1766377226249.png";
import discountImg2 from "@assets/BF398233-45C7-4479-8FF5-9121EB071FFD_1766377226249.png";

export default function Shop() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-primary -mx-4 -mt-4 p-6 pb-12 text-white">
        <h1 className="text-2xl font-bold mb-2 font-heading">Shop & Savings</h1>
        <p className="text-primary-foreground/80 text-sm mb-4">Verified discounts for veterans & families.</p>
        
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input className="bg-white text-foreground pl-9 border-none shadow-sm" placeholder="Search deals..." />
        </div>
      </div>

      <div className="-mt-8 grid grid-cols-2 gap-3 px-1">
        {[
          { name: "Tactical Gear Co", discount: "15% OFF", category: "Gear", img: discountImg1 },
          { name: "Patriot Insurance", discount: "$50 Credit", category: "Services", img: discountImg2 },
          { name: "Freedom Travel", discount: "20% OFF", category: "Travel", img: discountImg1 },
          { name: "Base Supply", discount: "10% OFF", category: "Clothing", img: discountImg2 },
          { name: "Tech For Vets", discount: "Student Pricing", category: "Electronics", img: discountImg1 },
          { name: "Home Depot", discount: "10% OFF", category: "Home", img: discountImg2 },
        ].map((item, i) => (
          <Card key={i} className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer">
            <div className="h-28 w-full bg-muted relative">
               <img src={item.img} alt={item.name} className="h-full w-full object-cover" />
               <div className="absolute inset-0 bg-black/10"></div>
            </div>
            <CardContent className="p-3">
              <Badge variant="secondary" className="mb-2 text-[10px] h-5">{item.category}</Badge>
              <h3 className="font-bold text-sm truncate font-heading">{item.name}</h3>
              <p className="text-accent-foreground font-bold text-sm flex items-center gap-1 mt-1">
                <Tag className="h-3 w-3" /> {item.discount}
              </p>
              <Button size="sm" variant="outline" className="w-full mt-3 h-8 text-xs">
                View Deal
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

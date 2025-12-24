import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  HeartPulse, 
  ShieldAlert, 
  Brain, 
  Home, 
  Briefcase, 
  GraduationCap, 
  Scale, 
  Users, 
  FileArchive, 
  Flag,
  Bookmark,
  ChevronLeft,
  ExternalLink,
  MapPin
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { resourcesData, ResourceItem } from "@/lib/resources-data";
import { Button } from "@/components/ui/button";
import ResourceDetail from "@/components/resource-detail";

const categories = [
  { title: "Benefits & VA Claims", icon: FileText, desc: "Compensation, pension, and appeals" },
  { title: "Healthcare", icon: HeartPulse, desc: "VA health, TRICARE, and community care" },
  { title: "Crisis Help", icon: ShieldAlert, desc: "Emergency support and suicide prevention", variant: "destructive" },
  { title: "Mental Health", icon: Brain, desc: "PTSD, TBI, and counseling support" },
  { title: "Housing Support", icon: Home, desc: "Loans, homelessness, and grants" },
  { title: "Employment", icon: Briefcase, desc: "Job search, resume help, and training" },
  { title: "Education & GI Bill", icon: GraduationCap, desc: "College, trade school, and VET TEC" },
  { title: "Legal & Financial", icon: Scale, desc: "Legal aid, tax relief, and advice" },
  { title: "Family & Caregivers", icon: Users, desc: "Support for spouses and dependents" },
  { title: "Military Records", icon: FileArchive, desc: "DD214, corrections, and medals" },
  { title: "Transition", icon: Flag, desc: "Returning to civilian life" },
];

export default function Resources() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedResource, setSelectedResource] = useState<ResourceItem | null>(null);

  const activeResources = selectedCategory ? resourcesData[selectedCategory] : [];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-8">
      
      {/* Detail View Modal */}
      <ResourceDetail 
        resource={selectedResource} 
        open={!!selectedResource} 
        onOpenChange={(open) => !open && setSelectedResource(null)} 
      />

      <div>
        <div className="flex items-center gap-2 mb-2">
          {selectedCategory && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 -ml-2 rounded-full" 
              onClick={() => setSelectedCategory(null)}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
          )}
          <h1 className="text-2xl font-bold text-primary font-heading">
            {selectedCategory ? selectedCategory : "My Resources"}
          </h1>
        </div>
        <p className="text-muted-foreground">
          {selectedCategory 
            ? `Browse available resources for ${selectedCategory}.`
            : "Your collection of saved guides and the full resource library."}
        </p>
      </div>

      <Tabs defaultValue="library" className="w-full">
        {!selectedCategory && (
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="saved">Saved Items</TabsTrigger>
            <TabsTrigger value="library">Full Library</TabsTrigger>
          </TabsList>
        )}

        <TabsContent value="saved" className="space-y-4">
          {!selectedCategory && (
             <Card className="bg-muted/30 border-dashed">
               <CardContent className="flex flex-col items-center justify-center py-10 text-center space-y-3">
                 <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                   <Bookmark className="h-6 w-6" />
                 </div>
                 <div>
                   <h3 className="font-semibold text-lg">No saved resources yet</h3>
                   <p className="text-muted-foreground text-sm max-w-xs mx-auto">
                     Browse the library and save guides that are important to you for quick access here.
                   </p>
                 </div>
               </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="library" className="space-y-4">
          
          {selectedCategory ? (
            <div className="space-y-3 animate-in fade-in slide-in-from-right-4 duration-300">
               {activeResources?.map((resource, i) => (
                 <Card 
                    key={i} 
                    className="group hover:border-primary/50 transition-colors cursor-pointer"
                    onClick={() => setSelectedResource(resource)}
                 >
                   <CardContent className="p-4">
                     <div className="flex justify-between items-start gap-3">
                       <div className="space-y-1">
                         <div className="flex items-center gap-2">
                           <h3 className="font-semibold text-base group-hover:text-primary transition-colors">{resource.title}</h3>
                           {resource.isScLocal && (
                             <Badge variant="outline" className="text-[10px] h-5 px-1.5 border-primary/30 text-primary bg-primary/5">
                               <MapPin className="h-2.5 w-2.5 mr-0.5" /> SC
                             </Badge>
                           )}
                         </div>
                         <p className="text-sm text-muted-foreground">{resource.description}</p>
                         <div className="flex items-center gap-2 mt-2">
                           <Badge variant="secondary" className="text-[10px] bg-muted font-normal text-muted-foreground">
                             {resource.source}
                           </Badge>
                           <Badge variant="secondary" className="text-[10px] bg-muted font-normal text-muted-foreground capitalize">
                             {resource.type}
                           </Badge>
                         </div>
                       </div>
                       <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
                         <ExternalLink className="h-4 w-4" />
                       </Button>
                     </div>
                   </CardContent>
                 </Card>
               ))}
               {!activeResources && (
                 <p className="text-center text-muted-foreground py-8">No resources found for this category yet.</p>
               )}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {categories.map((cat, i) => (
                <Card 
                  key={i} 
                  className="hover:border-primary/50 transition-colors cursor-pointer group shadow-sm hover:shadow-md"
                  onClick={() => setSelectedCategory(cat.title)}
                >
                  <CardHeader className="flex flex-row items-center gap-4 pb-2">
                    <div className={`p-2.5 rounded-lg transition-colors ${cat.variant === 'destructive' ? 'bg-destructive/10 text-destructive group-hover:bg-destructive group-hover:text-destructive-foreground' : 'bg-secondary/10 text-secondary group-hover:bg-secondary group-hover:text-secondary-foreground'}`}>
                      <cat.icon className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-base font-heading group-hover:text-primary transition-colors">{cat.title}</CardTitle>
                      {cat.variant === 'destructive' && <Badge variant="destructive" className="mt-1 text-[10px] h-5">Urgent</Badge>}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground leading-snug">{cat.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

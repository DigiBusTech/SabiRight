
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Phone, ShieldCheck, HeartPulse, Flame, Scale } from "lucide-react";

const SERVICES = [
  {
    id: 1,
    name: "Central Police Station",
    type: "Police",
    distance: "0.8 km",
    status: "Open 24/7",
    icon: ShieldCheck,
    color: "blue"
  },
  {
    id: 2,
    name: "General Hospital",
    type: "Medical",
    distance: "1.2 km",
    status: "Open 24/7",
    icon: HeartPulse,
    color: "red"
  },
  {
    id: 3,
    name: "Fire Service HQ",
    type: "Fire",
    distance: "2.5 km",
    status: "Emergency Only",
    icon: Flame,
    color: "orange"
  },
  {
    id: 4,
    name: "Legal Aid Council",
    type: "Legal",
    distance: "3.1 km",
    status: "Open 9am-5pm",
    icon: Scale,
    color: "purple"
  }
];

export function VerifiedServices() {
  return (
    <Card className="shadow-sm border-2 border-slate-200">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2 text-slate-700">
          <ShieldCheck className="h-4 w-4 text-green-600" /> Verified Services Near You
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2">
        {SERVICES.map((service) => (
          <div key={service.id} className="flex items-start gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50 hover:bg-slate-100 transition-colors">
            <div className={`h-10 w-10 rounded-full flex items-center justify-center bg-${service.color}-100 text-${service.color}-600 flex-shrink-0`}>
              <service.icon className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-sm truncate">{service.name}</h4>
              <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                <Badge variant="outline" className="text-[10px] h-5 px-1.5 font-normal bg-white">
                  {service.type}
                </Badge>
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" /> {service.distance}
                </span>
              </div>
            </div>
            <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-400 hover:text-primary">
              <Phone className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

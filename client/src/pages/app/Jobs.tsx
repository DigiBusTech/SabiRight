import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MOCK_JOBS } from "@/lib/constants";
import { Briefcase, Building2, MapPin, DollarSign, Clock } from "lucide-react";

export default function Jobs() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">AI Job Matches</h2>
        <p className="text-slate-500">Opportunities curated for your verified profile.</p>
      </div>

      <div className="grid gap-4">
        {MOCK_JOBS.map((job, i) => (
          <Card key={i} className="hover:border-primary/50 transition-colors">
            <CardContent className="p-6 flex flex-col md:flex-row gap-6 items-start md:items-center">
              <div className="h-16 w-16 rounded-xl bg-slate-100 flex items-center justify-center text-2xl">
                <Building2 className="h-8 w-8 text-slate-400" />
              </div>
              
              <div className="flex-1 space-y-2">
                <div className="flex flex-wrap items-center gap-3">
                  <h3 className="font-bold text-lg">{job.title}</h3>
                  <Badge variant={job.type === "Full-time" ? "default" : "secondary"}>
                    {job.type}
                  </Badge>
                  <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full border border-green-100">
                    98% Match
                  </span>
                </div>
                
                <div className="flex flex-wrap gap-4 text-sm text-slate-500">
                  <span className="flex items-center gap-1"><Building2 className="h-4 w-4" /> {job.company}</span>
                  <span className="flex items-center gap-1"><MapPin className="h-4 w-4" /> {job.location}</span>
                  <span className="flex items-center gap-1"><DollarSign className="h-4 w-4" /> {job.salary}</span>
                  <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> Posted 2 days ago</span>
                </div>
              </div>

              <div className="flex gap-3 w-full md:w-auto">
                <Button variant="outline" className="flex-1 md:flex-none">Save</Button>
                <Button className="flex-1 md:flex-none">Apply Now</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

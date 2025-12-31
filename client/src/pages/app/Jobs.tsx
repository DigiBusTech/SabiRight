import { useState, useEffect, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Briefcase, Building2, MapPin, DollarSign, Clock, Search, Loader2, X, AlertCircle, Plus, Filter } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CreditDisplay } from "@/components/CreditDisplay";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";

const NIGERIAN_CITIES = [
  "Lagos", "Abuja", "Port Harcourt", "Kano", "Ibadan", "Kaduna", 
  "Benin City", "Enugu", "Onitsha", "Jos", "Calabar", "Warri", 
  "Uyo", "Owerri", "Abeokuta"
];

interface Job {
  id: string;
  title: string;
  company?: string;
  location: string;
  type: string;
  workMode?: string;
  salary?: string;
  description?: string;
  contact?: string;
  source?: string;
  postedAt?: any;
}

export default function Jobs() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  
  const [role, setRole] = useState("");
  const [location, setLocation] = useState(profile?.city || "Lagos");
  const [employmentType, setEmploymentType] = useState("");
  const [workMode, setWorkMode] = useState("");
  const [cityFilter, setCityFilter] = useState<string>("");
  const [showPostJob, setShowPostJob] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [jobForm, setJobForm] = useState({
    title: "",
    company: "",
    location: profile?.city || "Lagos",
    type: "Full-time",
    workMode: "Onsite",
    salary: "",
    description: "",
    contact: ""
  });

  const userCity = profile?.city || "";

  // Fetch credits
  const { data: credits, refetch: refetchCredits } = useQuery({
    queryKey: [`credits-${user?.uid}`],
    queryFn: async () => {
      if (!user?.uid) return null;
      const res = await fetch(`/api/credits/${user.uid}/available`);
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!user?.uid,
    refetchInterval: 30000,
  });

  const queryClient = useQueryClient();

  const { data: jobsData, isLoading: jobsLoading, refetch: refetchJobs } = useQuery({
    queryKey: ['jobs'],
    queryFn: async () => {
      const res = await fetch('/api/jobs');
      if (!res.ok) return [];
      return res.json();
    },
  });

  useEffect(() => {
    if (jobsData) {
      setJobs(jobsData);
      setLoading(false);
    }
  }, [jobsData]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!role.trim()) {
      toast({ 
        title: "Enter a Role", 
        description: "Please enter a job role or keywords to search.",
        variant: "destructive"
      });
      return;
    }

    if (!credits || credits.availableCredits < 1) {
      toast({ 
        title: "No Credits", 
        description: "Each job search uses 1 credit. Upgrade your plan for unlimited searches.",
        variant: "destructive"
      });
      return;
    }

    setSearching(true);

    try {
      const response = await fetch('/api/ai/jobs/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.uid,
          role,
          location,
          employmentType,
          workMode
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Job search failed');
      }

      const data = await response.json();
      
      toast({ 
        title: "Jobs Found", 
        description: `${data.jobs?.length || 0} new job listings added to your feed (1 credit used)`
      });
      
      refetchJobs();
      refetchCredits();
    } catch (err: any) {
      console.error(err);
      toast({ 
        title: "Search Failed", 
        description: err.message || "Failed to search for jobs",
        variant: "destructive"
      });
    } finally {
      setSearching(false);
    }
  };

  const handlePostJob = async () => {
    if (!jobForm.title || !jobForm.company || !jobForm.description) {
      toast({ title: "Error", description: "Please fill required fields", variant: "destructive" });
      return;
    }

    setIsPosting(true);
    try {
      const response = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...jobForm,
          postedBy: user?.uid,
          source: 'User Posted'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to post job');
      }

      toast({ title: "Success", description: "Job posted successfully!" });
      setShowPostJob(false);
      setJobForm({
        title: "", company: "", location: "Lagos", type: "Full-time",
        workMode: "Onsite", salary: "", description: "", contact: ""
      });
      refetchJobs();
    } catch (err) {
      toast({ title: "Error", description: "Failed to post job", variant: "destructive" });
    } finally {
      setIsPosting(false);
    }
  };

  const sortedAndFilteredJobs = useMemo(() => {
    let filtered = jobs.filter(job => {
      if (employmentType && job.type !== employmentType) return false;
      if (workMode && job.workMode !== workMode) return false;
      if (cityFilter && !job.location?.toLowerCase().includes(cityFilter.toLowerCase())) return false;
      return true;
    });
    
    return filtered.sort((a, b) => {
      const aInUserCity = userCity && a.location?.toLowerCase().includes(userCity.toLowerCase());
      const bInUserCity = userCity && b.location?.toLowerCase().includes(userCity.toLowerCase());
      
      if (aInUserCity && !bInUserCity) return -1;
      if (!aInUserCity && bInUserCity) return 1;
      return 0;
    });
  }, [jobs, employmentType, workMode, cityFilter, userCity]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">AI Job Matches</h2>
          <p className="text-slate-500">Opportunities curated for your verified profile.</p>
        </div>
        <div className="flex gap-2">
          <CreditDisplay compact={true} />
          <Button onClick={() => setShowPostJob(true)}>
              <Plus className="h-4 w-4 mr-1" /> Post a Job
          </Button>
        </div>
      </div>

      {(!credits || credits.availableCredits < 1) && (
        <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-yellow-600" />
          <div className="text-sm">
            <p className="font-semibold text-yellow-900">No credits for job generation</p>
            <p className="text-xs text-yellow-700">You can still browse and apply to jobs already generated. <a href="/app/plans" className="underline font-bold">Upgrade your plan</a> for unlimited searches.</p>
          </div>
        </div>
      )}

      {/* City Filter */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-500" />
          <span className="text-sm font-bold text-slate-600 uppercase">Filter by City</span>
        </div>
        <select
          data-testid="filter-city-jobs"
          value={cityFilter}
          onChange={(e) => setCityFilter(e.target.value)}
          className="px-4 py-2 rounded-lg border border-slate-200 text-sm font-medium bg-white focus:ring-2 ring-primary/20 outline-none"
        >
          <option value="">All Cities</option>
          {NIGERIAN_CITIES.map(city => (
            <option key={city} value={city}>
              {city} {city === userCity && "(Your City)"}
            </option>
          ))}
        </select>
        {userCity && (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <MapPin className="h-3 w-3 mr-1" />
            Your city: {userCity}
          </Badge>
        )}
      </div>

      {/* Search Form */}
      <Card className="bg-blue-50 border-blue-100">
        <CardContent className="p-6">
            <form id="search-form" onSubmit={handleSearch} className="grid md:grid-cols-5 gap-4">
                <div className="space-y-2">
                    <label className="text-xs font-bold text-blue-800 uppercase">Role / Keywords</label>
                    <input 
                        className="w-full p-2 rounded border border-blue-200 focus:ring-2 ring-blue-500 outline-none" 
                        placeholder="e.g. Software Engineer"
                        value={role}
                        onChange={e => setRole(e.target.value)}
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-xs font-bold text-blue-800 uppercase">Location</label>
                    <select
                        className="w-full p-2 rounded border border-blue-200 focus:ring-2 ring-blue-500 outline-none bg-white"
                        value={location}
                        onChange={e => setLocation(e.target.value)}
                    >
                      {NIGERIAN_CITIES.map(city => (
                        <option key={city} value={city}>{city}</option>
                      ))}
                    </select>
                </div>
                <div className="space-y-2">
                    <label className="text-xs font-bold text-blue-800 uppercase">Employment</label>
                    <select 
                        className="w-full p-2 rounded border border-blue-200 focus:ring-2 ring-blue-500 outline-none bg-white"
                        value={employmentType}
                        onChange={e => setEmploymentType(e.target.value)}
                    >
                        <option value="">All Types</option>
                        <option value="Full-time">Full-time</option>
                        <option value="Part-time">Part-time</option>
                    </select>
                </div>
                <div className="space-y-2">
                    <label className="text-xs font-bold text-blue-800 uppercase">Work Mode</label>
                    <select 
                        className="w-full p-2 rounded border border-blue-200 focus:ring-2 ring-blue-500 outline-none bg-white"
                        value={workMode}
                        onChange={e => setWorkMode(e.target.value)}
                    >
                        <option value="">All Modes</option>
                        <option value="Remote">Remote</option>
                        <option value="Onsite">Onsite</option>
                        <option value="Hybrid">Hybrid</option>
                    </select>
                </div>
                <div className="flex items-end">
                    <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 font-bold" disabled={searching}>
                        {searching ? <Loader2 className="animate-spin mr-2" /> : <Search className="mr-2 h-4 w-4" />}
                        Find
                    </Button>
                </div>
            </form>
        </CardContent>
      </Card>

      {/* Jobs Grid */}
      <div className="grid gap-4">
        {loading ? (
            <div className="text-center py-10 text-slate-400">Loading jobs...</div>
        ) : sortedAndFilteredJobs.length === 0 ? (
            <div className="text-center py-10 text-slate-400">No jobs match your filters. Try adjusting them!</div>
        ) : (
            sortedAndFilteredJobs.map((job) => (
            <Card 
              key={job.id} 
              className="hover:border-primary/50 transition-all cursor-pointer hover:shadow-md group relative overflow-hidden"
              onClick={() => setSelectedJob(job)}
            >
                {job.source && job.source !== 'User Posted' && (
                    <div className="absolute top-0 right-0 bg-purple-100 text-purple-800 text-[10px] px-2 py-1 font-bold rounded-bl-lg">
                        AI Matched
                    </div>
                )}
                <CardContent className="p-6">
                  <div className="flex gap-4 items-start">
                    <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-blue-100 to-slate-100 flex items-center justify-center shrink-0">
                        <Building2 className="h-6 w-6 text-slate-400" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div className="flex-1">
                          <h3 className="font-bold text-lg text-slate-900">{job.title}</h3>
                          <p className="text-sm text-slate-600">{job.company || "Confidential"}</p>
                        </div>
                        <Badge variant={job.type === "Full-time" ? "default" : "secondary"} className="shrink-0">
                            {job.type}
                        </Badge>
                      </div>
                      
                      <div className="flex flex-wrap gap-3 text-sm text-slate-500 mb-3">
                        <span className="flex items-center gap-1"><MapPin className="h-4 w-4 text-slate-400" /> {job.location}</span>
                        {job.workMode && <span className="flex items-center gap-1"><Briefcase className="h-4 w-4 text-slate-400" /> {job.workMode}</span>}
                        {job.salary && <span className="flex items-center gap-1"><DollarSign className="h-4 w-4 text-slate-400" /> {job.salary}</span>}
                      </div>
                      
                      <p className="text-sm text-slate-600 line-clamp-2 mb-3">{job.description?.replace(/\*\*/g, '').replace(/\#/g, '') || "No description"}</p>
                      
                      <Button size="sm" className="w-full sm:w-auto">
                        View Details
                      </Button>
                    </div>
                  </div>
                </CardContent>
            </Card>
            ))
        )}
      </div>

      {/* Job Detail Modal */}
      {selectedJob && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-lg shadow-xl">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div className="flex-1">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="h-14 w-14 rounded-lg bg-gradient-to-br from-blue-100 to-slate-100 flex items-center justify-center shrink-0">
                        <Building2 className="h-7 w-7 text-slate-400" />
                    </div>
                    <div className="flex-1">
                      <h2 className="text-2xl font-bold text-slate-900">{selectedJob.title}</h2>
                      <p className="text-lg text-slate-600">{selectedJob.company || "Confidential"}</p>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mb-4">
                    <Badge variant={selectedJob.type === "Full-time" ? "default" : "secondary"}>
                        {selectedJob.type}
                    </Badge>
                    {selectedJob.workMode && <Badge variant="outline">{selectedJob.workMode}</Badge>}
                    {selectedJob.source && <Badge variant="outline" className="bg-purple-50">{selectedJob.source}</Badge>}
                  </div>
                </div>
                
                <button 
                  onClick={() => setSelectedJob(null)}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5 text-slate-500" />
                </button>
              </div>

              <div className="grid md:grid-cols-4 gap-4 mb-6 p-4 bg-slate-50 rounded-lg">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase">Location</p>
                  <p className="text-sm font-medium text-slate-900 mt-1">{selectedJob.location}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase">Employment</p>
                  <p className="text-sm font-medium text-slate-900 mt-1">{selectedJob.type}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase">Work Mode</p>
                  <p className="text-sm font-medium text-slate-900 mt-1">{selectedJob.workMode || "Not specified"}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase">Salary</p>
                  <p className="text-sm font-medium text-slate-900 mt-1">{selectedJob.salary || "Negotiable"}</p>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-bold text-slate-900 mb-3">Job Description</h3>
                <div className="prose prose-sm max-w-none text-slate-700">
                  <ReactMarkdown>{selectedJob.description || "No description available"}</ReactMarkdown>
                </div>
              </div>

              <Button 
                size="lg" 
                className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3"
                onClick={() => window.open(selectedJob.contact?.startsWith('http') ? selectedJob.contact : `mailto:${selectedJob.contact}`, '_blank')}
              >
                Apply Now
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Post Job Modal */}
      {showPostJob && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg bg-white max-h-[90vh] overflow-y-auto">
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold">Post a Job</h3>
                <button onClick={() => setShowPostJob(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold mb-1">Job Title *</label>
                  <Input
                    value={jobForm.title}
                    onChange={(e) => setJobForm({...jobForm, title: e.target.value})}
                    placeholder="e.g., Senior Software Engineer"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold mb-1">Company Name *</label>
                  <Input
                    value={jobForm.company}
                    onChange={(e) => setJobForm({...jobForm, company: e.target.value})}
                    placeholder="Your company name"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold mb-1">Location</label>
                    <Input
                      value={jobForm.location}
                      onChange={(e) => setJobForm({...jobForm, location: e.target.value})}
                      placeholder="e.g., Lagos"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold mb-1">Salary Range</label>
                    <Input
                      value={jobForm.salary}
                      onChange={(e) => setJobForm({...jobForm, salary: e.target.value})}
                      placeholder="e.g., N500k - N800k"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold mb-1">Employment Type</label>
                    <select
                      value={jobForm.type}
                      onChange={(e) => setJobForm({...jobForm, type: e.target.value})}
                      className="w-full border rounded-lg p-2 text-sm"
                    >
                      <option value="Full-time">Full-time</option>
                      <option value="Part-time">Part-time</option>
                      <option value="Contract">Contract</option>
                      <option value="Internship">Internship</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold mb-1">Work Mode</label>
                    <select
                      value={jobForm.workMode}
                      onChange={(e) => setJobForm({...jobForm, workMode: e.target.value})}
                      className="w-full border rounded-lg p-2 text-sm"
                    >
                      <option value="Onsite">Onsite</option>
                      <option value="Remote">Remote</option>
                      <option value="Hybrid">Hybrid</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold mb-1">Job Description *</label>
                  <Textarea
                    value={jobForm.description}
                    onChange={(e) => setJobForm({...jobForm, description: e.target.value})}
                    placeholder="Describe the role, requirements, and responsibilities..."
                    rows={5}
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold mb-1">Contact (Email or URL)</label>
                  <Input
                    value={jobForm.contact}
                    onChange={(e) => setJobForm({...jobForm, contact: e.target.value})}
                    placeholder="hr@company.com or application URL"
                  />
                </div>

                <Button 
                  onClick={handlePostJob} 
                  className="w-full bg-primary hover:bg-primary/90"
                  disabled={isPosting}
                >
                  {isPosting ? 'Posting...' : 'Post Job'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

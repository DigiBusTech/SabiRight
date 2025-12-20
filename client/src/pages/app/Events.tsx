import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Users, Clock, Search, Filter, ChevronRight } from "lucide-react";
import { db, FIREBASE_APP_ID } from "@/lib/firebase";
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface Event {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  category: string;
  description: string;
  attendees: number;
  maxAttendees?: number;
  organizer: string;
  image?: string;
  timestamp?: any;
}

export default function Events() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const categories = ["Workshop", "Civic Training", "Legal Aid", "Community Meeting", "Seminar"];

  useEffect(() => {
    const q = query(
      collection(db, 'artifacts', FIREBASE_APP_ID, 'public', 'data', 'civic_events'),
      orderBy('date', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const eventsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Event));
      setEvents(eventsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleRegister = async (event: Event) => {
    if (!user) {
      toast({ title: "Login Required", description: "Please login to register for events." });
      return;
    }

    toast({ title: "Registered!", description: `You're registered for ${event.title}` });
  };

  const filteredEvents = selectedCategory 
    ? events.filter(e => e.category === selectedCategory)
    : events;

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Civic Events & Trainings</h2>
          <p className="text-slate-500">Learn your rights and build community connections.</p>
        </div>
        <Button>Host Event</Button>
      </div>

      {/* Category Filter */}
      <div className="space-y-3">
        <p className="text-sm font-bold text-slate-600 uppercase">Filter by Category</p>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              selectedCategory === null
                ? "bg-primary text-white"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            All Events
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                selectedCategory === cat
                  ? "bg-primary text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Events Grid */}
      <div className="grid gap-4">
        {loading ? (
          <div className="text-center py-10 text-slate-400">Loading events...</div>
        ) : filteredEvents.length === 0 ? (
          <div className="text-center py-10 text-slate-400">
            No events found {selectedCategory && `in "${selectedCategory}"`}
          </div>
        ) : (
          filteredEvents.map((event) => (
            <Card key={event.id} className="hover:border-primary/50 transition-all hover:shadow-md overflow-hidden">
              <CardContent className="p-6">
                <div className="flex gap-6 items-start">
                  {/* Event Card */}
                  <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-green-100 to-slate-100 flex flex-col items-center justify-center shrink-0">
                    <p className="text-2xl font-bold text-green-700">{new Date(event.date).getDate()}</p>
                    <p className="text-xs font-bold text-slate-600 uppercase">
                      {new Date(event.date).toLocaleString('default', { month: 'short' })}
                    </p>
                  </div>

                  {/* Event Info */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-slate-900">{event.title}</h3>
                        <p className="text-sm text-slate-600 mt-1">by {event.organizer}</p>
                      </div>
                      <Badge variant="outline" className="shrink-0 bg-green-50 text-green-700 border-green-200">
                        {event.category}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 my-4 text-sm text-slate-600">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-slate-400" />
                        <span>{event.time}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-slate-400" />
                        <span>{event.location}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-slate-400" />
                        <span>{event.attendees} attending</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-slate-400" />
                        <span>{new Date(event.date).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <p className="text-sm text-slate-700 mb-4 line-clamp-2">{event.description}</p>

                    <Button 
                      size="sm" 
                      onClick={() => handleRegister(event)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Users className="h-4 w-4 mr-2" />
                      Register Now
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

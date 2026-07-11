import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { runGemini } from "@/lib/gemini";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles, X, MessageSquare, AlertTriangle, Clock, Loader2, ChevronRight } from "lucide-react";
import { Link } from "wouter";

interface Suggestion {
  id: string;
  type: "forum" | "traffic" | "booking";
  title: string;
  description: string;
  actionText: string;
  actionLink: string;
}

const DISMISSED_KEY = "ai_suggestions_dismissed";
const SESSION_KEY = "ai_suggestions_shown_session";

function getDismissedSuggestions(): string[] {
  try {
    return JSON.parse(localStorage.getItem(DISMISSED_KEY) || "[]");
  } catch {
    return [];
  }
}

function dismissSuggestion(id: string) {
  const dismissed = getDismissedSuggestions();
  if (!dismissed.includes(id)) {
    dismissed.push(id);
    localStorage.setItem(DISMISSED_KEY, JSON.stringify(dismissed));
  }
}

function hasShownThisSession(): boolean {
  return sessionStorage.getItem(SESSION_KEY) === "true";
}

function markShownThisSession() {
  sessionStorage.setItem(SESSION_KEY, "true");
}

interface AISuggestionsProps {
  onClose: () => void;
  isOpen: boolean;
}

export default function AISuggestions({ isOpen, onClose }: AISuggestionsProps) {
  const { user, profile } = useAuth();
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: forumPosts = [] } = useQuery({
    queryKey: ["forumPosts", profile?.city],
    queryFn: async () => {
      const url = profile?.city ? `/api/forum/posts?city=${encodeURIComponent(profile.city)}` : "/api/forum/posts";
      const res = await fetch(url);
      return res.ok ? res.json() : [];
    },
  });

  const { data: trafficCard } = useQuery({
    queryKey: [`traffic-card-${user?.uid}`],
    queryFn: async () => {
      if (!user) return null;
      const token = await user.getIdToken();
      const res = await fetch(`/api/dashboard/traffic/${user.uid}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return res.ok ? res.json() : null;
    },
    enabled: !!user?.uid,
  });

  const { data: customerBookings = [] } = useQuery({
    queryKey: [`bookings-user-${user?.uid}`],
    queryFn: async () => {
      if (!user?.uid) return [];
      const res = await fetch(`/api/bookings/user/${user.uid}`);
      return res.ok ? res.json() : [];
    },
    enabled: !!user?.uid,
  });

  useEffect(() => {
    if (!isOpen || !user || suggestions.length > 0 || isGenerating) return;

    const generateSuggestions = async () => {
      setIsGenerating(true);
      setError(null);

      try {
        const userCity = profile?.city || "";
        const dismissedIds = getDismissedSuggestions();
        
        const pendingBookings = customerBookings.filter(
          (b: any) => b.status === "pending" || b.status === "in_progress"
        );
        
        const hotForumTopics = forumPosts
          .filter((p: any) => !p.shadowedForReview)
          .slice(0, 5);

        const contextData = {
          userCity,
          pendingBookingsCount: pendingBookings.length,
          trafficStatus: trafficCard?.status || "normal",
          trafficLocation: trafficCard?.location || "",
          trafficDescription: trafficCard?.description || "",
          hotForumTopics: hotForumTopics.map((p: any) => ({
            id: p.id,
            content: p.content?.slice(0, 60),
            author: p.author,
            upvotes: p.upvotes || 0,
            city: p.city || "",
          })),
          pendingBookings: pendingBookings.map((b: any) => ({
            id: b.id,
            vendorName: b.vendorName || "Service Provider",
            serviceName: b.serviceName || "Service",
            status: b.status,
          })),
        };

        const prompt = `You are a helpful assistant for a Nigerian civic services app called SabiRight. Based on the user's activity and real-time civic/forum/traffic data, generate 2-3 personalized, actionable suggestions.

User Data:
- City: ${contextData.userCity || "Not set"}
- Pending Bookings: ${contextData.pendingBookingsCount}
- Live City Traffic Status: Location: ${contextData.trafficLocation}, Status: ${contextData.trafficStatus}, Description: ${contextData.trafficDescription}

Hot Forum Topics:
${JSON.stringify(contextData.hotForumTopics, null, 2)}

Available bookings to suggest:
${JSON.stringify(contextData.pendingBookings, null, 2)}

Generate suggestions in this exact JSON format (array of objects):
[
  {
    "id": "unique-id-string",
    "type": "forum" | "traffic" | "booking",
    "title": "Short catchy title",
    "description": "Brief helpful description (max 100 chars)",
    "actionText": "Button text like 'Join Forum', 'Avoid Route' or 'Check Booking'",
    "actionLink": "/app/forum" or "/app/civic" or "/app/bookings"
  }
]

Rules:
- Remove all suggestions for jobs and events.
- Suggest "top or hot topics in the community/forum" (actionLink: "/app/forum") and highlight/suggest action around active discussions.
- Suggest avoiding specific streets or traffic jam/checkpoint routes in their city based on traffic status (actionLink: "/app/civic").
- For pending bookings, suggest checking or completing them.
- Keep suggestions extremely concise, specific, and actionable.
- Return ONLY valid JSON array, no markdown or extra text`;

        const result = await runGemini(prompt);
        
        if (result.error) {
          setError(result.error);
          const fallbackSuggestions: Suggestion[] = [];
          
          if (pendingBookings.length > 0) {
            fallbackSuggestions.push({
              id: `booking-${pendingBookings[0].id}`,
              type: "booking",
              title: "Complete Your Booking",
              description: `You have ${pendingBookings.length} pending booking(s) to follow up on`,
              actionText: "View Bookings",
              actionLink: "/app/bookings",
            });
          }
          
          if (trafficCard && trafficCard.status !== "normal" && trafficCard.status !== "cleared") {
            fallbackSuggestions.push({
              id: `traffic-${Date.now()}`,
              type: "traffic",
              title: "Traffic Warning",
              description: trafficCard.description || `Heavy traffic / checkpoint reported in ${userCity || 'your city'}`,
              actionText: "Check Route",
              actionLink: "/app/civic",
            });
          }
          
          if (hotForumTopics.length > 0) {
            fallbackSuggestions.push({
              id: `forum-${hotForumTopics[0].id}`,
              type: "forum",
              title: "Trending Forum Topic",
              description: hotForumTopics[0].content ? `${hotForumTopics[0].content.slice(0, 50)}...` : "Join active community discussions",
              actionText: "Go to Forum",
              actionLink: "/app/forum",
            });
          }
          
          const filtered = fallbackSuggestions.filter(s => !dismissedIds.includes(s.id));
          setSuggestions(filtered);
          return;
        }
        
        if (result.response) {
          try {
            let jsonStr = result.response.trim();
            const jsonMatch = jsonStr.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
              jsonStr = jsonMatch[0];
            }
            const parsed = JSON.parse(jsonStr) as Suggestion[];
            const filtered = parsed.filter(s => !dismissedIds.includes(s.id));
            setSuggestions(filtered.slice(0, 3));
          } catch (parseError) {
            console.error("Failed to parse AI suggestions:", parseError);
            setError("Could not process suggestions");
          }
        }
      } catch (err) {
        console.error("Error generating suggestions:", err);
        setError("Failed to generate suggestions");
      } finally {
        setIsGenerating(false);
      }
    };

    generateSuggestions();
  }, [isOpen, user, profile, forumPosts, trafficCard, customerBookings]);

  const handleDismiss = (id: string) => {
    dismissSuggestion(id);
    setSuggestions(prev => prev.filter(s => s.id !== id));
  };

  const handleClose = () => {
    markShownThisSession();
    onClose();
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "forum":
        return <MessageSquare className="h-5 w-5 text-blue-600" />;
      case "traffic":
        return <AlertTriangle className="h-5 w-5 text-amber-600" />;
      case "booking":
        return <Clock className="h-5 w-5 text-purple-600" />;
      default:
        return <Sparkles className="h-5 w-5 text-primary" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "forum":
        return "bg-blue-50 border-blue-200";
      case "traffic":
        return "bg-amber-50 border-amber-200";
      case "booking":
        return "bg-purple-50 border-purple-200";
      default:
        return "bg-slate-50 border-slate-200";
    }
  };

  if (suggestions.length === 0 && !isGenerating && !error) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md" data-testid="dialog-ai-suggestions">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Suggestions for You
          </DialogTitle>
          <DialogDescription>
            Based on your activity, here are some personalized recommendations
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 mt-2">
          {isGenerating ? (
            <div className="flex flex-col items-center justify-center py-8" data-testid="loading-suggestions">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
              <p className="text-sm text-slate-500">Generating personalized suggestions...</p>
            </div>
          ) : error && suggestions.length === 0 ? (
            <div className="text-center py-6" data-testid="error-suggestions">
              <p className="text-sm text-slate-500">{error}</p>
              <Button variant="outline" size="sm" className="mt-3" onClick={handleClose}>
                Close
              </Button>
            </div>
          ) : (
            suggestions.map((suggestion) => (
              <div
                key={suggestion.id}
                className={`relative p-4 rounded-lg border-2 ${getTypeColor(suggestion.type)}`}
                data-testid={`suggestion-${suggestion.id}`}
              >
                <button
                  onClick={() => handleDismiss(suggestion.id)}
                  className="absolute top-2 right-2 p-1 rounded-full hover:bg-white/50 transition-colors"
                  data-testid={`button-dismiss-${suggestion.id}`}
                  aria-label="Dismiss suggestion"
                >
                  <X className="h-4 w-4 text-slate-400" />
                </button>

                <div className="flex items-start gap-3 pr-6">
                  <div className="shrink-0 mt-0.5">{getIcon(suggestion.type)}</div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-sm mb-1">{suggestion.title}</h4>
                    <p className="text-xs text-slate-600 mb-3">{suggestion.description}</p>
                    <Link href={suggestion.actionLink}>
                      <Button
                        size="sm"
                        className="h-8 text-xs"
                        onClick={handleClose}
                        data-testid={`button-action-${suggestion.id}`}
                      >
                        {suggestion.actionText}
                        <ChevronRight className="h-3 w-3 ml-1" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {suggestions.length > 0 && (
          <div className="flex justify-end pt-2">
            <Button variant="ghost" size="sm" onClick={handleClose} data-testid="button-close-suggestions">
              Maybe Later
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export { hasShownThisSession, markShownThisSession };

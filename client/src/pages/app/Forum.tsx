import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MOCK_FORUM_TOPICS } from "@/lib/constants";
import { MessageSquare, Eye, ThumbsUp, MoreHorizontal } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function Forum() {
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Community Forum</h2>
          <p className="text-slate-500">Verified discussions by verified citizens.</p>
        </div>
        <Button>New Topic</Button>
      </div>

      <div className="grid gap-4">
        {MOCK_FORUM_TOPICS.map((topic, i) => (
          <Card key={i} className="hover:border-primary/50 transition-colors cursor-pointer">
            <CardContent className="p-6">
              <div className="flex gap-4">
                <div className="flex flex-col items-center gap-1 min-w-[3rem]">
                   <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-green-600"><ThumbsUp className="h-4 w-4" /></Button>
                   <span className="font-bold text-sm">{Math.floor(topic.views / 100)}</span>
                </div>
                
                <div className="flex-1">
                  <h3 className="font-bold text-lg mb-2 hover:text-primary transition-colors">{topic.title}</h3>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="px-2 py-0.5 bg-slate-100 rounded text-[10px] font-bold text-slate-500 uppercase">Policy</span>
                    <span className="text-xs text-slate-400">• Posted by {topic.author} • 2h ago</span>
                  </div>
                  
                  <div className="flex items-center gap-4 text-xs text-slate-500 font-medium">
                    <span className="flex items-center gap-1"><MessageSquare className="h-3 w-3" /> {topic.replies} Replies</span>
                    <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> {topic.views} Views</span>
                  </div>
                </div>

                <div className="hidden md:flex items-center">
                  <div className="flex -space-x-2 mr-4">
                    {[1,2,3].map(j => (
                      <Avatar key={j} className="h-8 w-8 border-2 border-white">
                        <AvatarFallback className="bg-slate-200 text-[10px]">U{j}</AvatarFallback>
                      </Avatar>
                    ))}
                  </div>
                  <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

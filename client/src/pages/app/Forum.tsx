import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquare, ThumbsUp, Flag, Trash2, Send, CornerDownRight, Reply } from "lucide-react";
import { Input } from "@/components/ui/input";
import { db, FIREBASE_APP_ID } from "@/lib/firebase";
import { collection, onSnapshot, addDoc, serverTimestamp, doc, updateDoc, increment, arrayUnion, orderBy, query, deleteDoc } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface Comment {
    id: string;
    text: string;
    author: string;
    userId: string;
    upvotes?: number;
    upvotedBy?: string[];
    timestamp: any;
}

interface Post {
    id: string;
    content: string;
    author: string;
    userId: string;
    city: string;
    upvotes: number;
    downvotes: number;
    flagged?: boolean;
    flagCount?: number;
    flaggedBy?: string[];
    shadowedForReview?: boolean;
    comments: Comment[];
    upvotedBy?: string[];
    timestamp: any;
}

export default function Forum() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPostContent, setNewPostContent] = useState("");
  
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);

  useEffect(() => {
    const q = query(
        collection(db, 'artifacts', FIREBASE_APP_ID, 'public', 'data', 'forum_posts'),
        orderBy('timestamp', 'desc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
        let postsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Post));
        
        // Sort by city if user city is available
        if (profile?.city) {
          postsData.sort((a, b) => {
            const aInCity = a.city?.toLowerCase() === profile.city.toLowerCase();
            const bInCity = b.city?.toLowerCase() === profile.city.toLowerCase();
            if (aInCity && !bInCity) return -1;
            if (!aInCity && bInCity) return 1;
            return 0;
          });
        }
        
        setPosts(postsData);
    });
    return () => unsubscribe();
  }, [profile?.city]);

  const handleCreatePost = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!user) {
          toast({ title: "Login Required", description: "Please login to post." });
          return;
      }

      if (profile?.kycStatus !== 'verified') {
          toast({ title: "KYC Required", description: "You must be KYC verified to create a post.", variant: "destructive" });
          return;
      }

      if (!newPostContent.trim()) return;

      try {
          const idToken = await user.getIdToken();
          const response = await fetch('/api/forum/posts', {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${idToken}`
            },
            body: JSON.stringify({
              content: newPostContent,
              city: profile?.city || "Lagos",
              author: user?.displayName || "Citizen",
              userId: user?.uid || "anon"
            })
          });

          if (!response.ok) {
            throw new Error('Failed to create post');
          }

          setNewPostContent("");
          toast({ title: "Posted", description: "Your voice has been heard." });
      } catch (err) {
          console.error("Error creating post", err);
          toast({ title: "Error", description: "Failed to post message.", variant: "destructive" });
      }
  };

  const handleVote = async (postId: string, type: 'up' | 'down') => {
      if (!user) {
          toast({ title: "Login Required", description: "You must be logged in to vote." });
          return;
      }

      const post = posts.find(p => p.id === postId);
      if (!post) return;

      if (post.upvotedBy?.includes(user.uid)) {
          toast({ title: "Already Voted", description: "You can only vote once per post." });
          return;
      }

      const postRef = doc(db, 'artifacts', FIREBASE_APP_ID, 'public', 'data', 'forum_posts', postId);
      await updateDoc(postRef, {
          [type === 'up' ? 'upvotes' : 'downvotes']: increment(1),
          upvotedBy: arrayUnion(user.uid)
      });
  };

  const handleCommentVote = async (postId: string, commentId: string) => {
      if (!user) {
          toast({ title: "Login Required", description: "Please login to like comments." });
          return;
      }

      const post = posts.find(p => p.id === postId);
      if (!post) return;

      const comment = post.comments.find(c => c.id === commentId);
      if (!comment) return;

      if (comment.upvotedBy?.includes(user.uid)) {
          toast({ title: "Already Liked", description: "You already liked this comment." });
          return;
      }

      const newComments = post.comments.map(c => 
          c.id === commentId 
              ? { ...c, upvotes: (c.upvotes || 0) + 1, upvotedBy: [...(c.upvotedBy || []), user.uid] }
              : c
      );

      const postRef = doc(db, 'artifacts', FIREBASE_APP_ID, 'public', 'data', 'forum_posts', postId);
      await updateDoc(postRef, { comments: newComments });
  };

  const handleFlag = async (postId: string) => {
      if (!user) return;
      
      // Check if user already flagged this post
      const post = posts.find(p => p.id === postId);
      if (post?.flaggedBy?.includes(user.uid)) {
          toast({ title: "Already Flagged", description: "You have already flagged this post." });
          return;
      }
      
      if (!confirm("Flag this post as inappropriate?")) return;
      
      try {
          const idToken = await user.getIdToken();
          const response = await fetch(`/api/forum/posts/${postId}/flag`, {
              method: 'POST',
              headers: {
                  'Authorization': `Bearer ${idToken}`,
                  'Content-Type': 'application/json'
              }
          });

          if (!response.ok) {
              const error = await response.json();
              throw new Error(error.error || 'Failed to flag post');
          }

          const result = await response.json();
          
          if (result.shadowed) {
              toast({ title: "Post Shadowed", description: "This post has been hidden for admin review due to multiple flags." });
          } else {
              toast({ title: "Flagged", description: `Post has been reported for review. (${result.flagCount}/${result.threshold} flags)` });
          }
      } catch (err: any) {
          console.error("Error flagging post", err);
          toast({ title: "Error", description: err.message || "Failed to flag post.", variant: "destructive" });
      }
  };

  const handleDelete = async (postId: string) => {
      if (!confirm("Are you sure you want to delete this post?")) return;
      await deleteDoc(doc(db, 'artifacts', FIREBASE_APP_ID, 'public', 'data', 'forum_posts', postId));
      toast({ title: "Deleted", description: "Post removed." });
  };

  const handleComment = async (e: React.FormEvent, postId: string) => {
      e.preventDefault();
      if (!user) {
          toast({ title: "Login Required", description: "Please login to comment." });
          return;
      }

      if (profile?.kycStatus !== 'verified') {
          toast({ title: "KYC Required", description: "You must be KYC verified to comment.", variant: "destructive" });
          return;
      }

      if (!commentText.trim()) return;

      try {
          const idToken = await user.getIdToken();
          const response = await fetch(`/api/forum/posts/${postId}/comments`, {
              method: 'POST',
              headers: { 
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${idToken}`
              },
              body: JSON.stringify({
                  text: replyingTo ? `@${posts.find(p => p.id === postId)?.comments.find(c => c.id === replyingTo)?.author || 'User'} ${commentText}` : commentText,
                  author: user.displayName || "Citizen",
                  userId: user.uid
              })
          });

          if (!response.ok) {
              throw new Error('Failed to add comment');
          }
          
          setCommentText("");
          setReplyingTo(null);
          toast({ title: "Comment Added", description: "Your reply has been posted." });
      } catch (err) {
          console.error("Error adding comment", err);
          toast({ title: "Error", description: "Failed to post comment.", variant: "destructive" });
      }
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Community Forum</h2>
          <p className="text-slate-500">Verified discussions by verified citizens.</p>
        </div>
      </div>

      {/* Create Post */}
      {!user ? (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-6 text-center">
            <h3 className="font-bold text-lg mb-2">Join the Conversation</h3>
            <p className="text-slate-500 mb-4">You must be logged in to share thoughts, vote, and comment.</p>
            <div className="flex justify-center gap-4">
              <Button onClick={() => window.location.href = '/auth/login'}>Login / Sign Up</Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-4">
                <form onSubmit={handleCreatePost} className="flex gap-4">
                    <Input 
                      value={newPostContent}
                      onChange={e => setNewPostContent(e.target.value)}
                      placeholder="Share a thought or report..." 
                      className="bg-white"
                    />
                    <Button type="submit">Post</Button>
                </form>
            </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {posts
          .filter(post => !post.shadowedForReview) // Hide shadowed posts from regular users
          .map((post) => (
          <Card key={post.id} className={cn("transition-colors", post.flagged ? "bg-red-50 border-red-100" : "hover:border-primary/50")}>
            <CardContent className="p-6">
              <div className="flex gap-4">
                {/* Voting Column */}
                <div className="flex flex-col items-center gap-1 min-w-[3rem]">
                   <Button 
                       variant="ghost" 
                       size="icon" 
                       className={cn("h-8 w-8", post.upvotedBy?.includes(user?.uid || "") ? "text-green-600" : "hover:text-green-600")}
                       onClick={() => handleVote(post.id, 'up')}
                   >
                       <ThumbsUp className="h-4 w-4" />
                   </Button>
                   <span className="font-bold text-sm">{(post.upvotes || 0) - (post.downvotes || 0)}</span>
                </div>
                
                {/* Main Content */}
                <div className="flex-1">
                  <h3 className={cn("font-bold text-lg mb-2 text-slate-800", post.flagged && "text-red-800 italic")}>
                      {post.flagged ? "[This post has been flagged for review]" : post.content}
                  </h3>
                  
                  <div className="flex items-center gap-2 mb-4">
                    <span className="px-2 py-0.5 bg-slate-100 rounded text-[10px] font-bold text-slate-500 uppercase">{post.city}</span>
                    <span className="text-xs text-slate-400">• Posted by <span className="font-semibold text-slate-600">{post.author}</span></span>
                  </div>
                  
                  {/* Action Bar */}
                  <div className="flex items-center gap-4 text-xs text-slate-500 font-medium border-t pt-3">
                    <button 
                        onClick={() => setExpandedPostId(expandedPostId === post.id ? null : post.id)}
                        className="flex items-center gap-1 hover:text-primary transition-colors"
                    >
                        <MessageSquare className="h-3 w-3" /> {post.comments?.length || 0} Comments
                    </button>
                    
                    {user?.uid === post.userId && (
                        <button 
                            onClick={() => handleDelete(post.id)}
                            className="flex items-center gap-1 hover:text-red-600 transition-colors ml-auto"
                        >
                            <Trash2 className="h-3 w-3" /> Delete
                        </button>
                    )}
                    
                    <button 
                        onClick={() => handleFlag(post.id)}
                        className="flex items-center gap-1 hover:text-red-500 transition-colors"
                    >
                        <Flag className="h-3 w-3" /> Flag
                    </button>
                  </div>

                          {expandedPostId === post.id && (
                      <div className="mt-4 pt-4 border-t bg-slate-50/50 -mx-6 px-6 pb-6 rounded-b-xl animate-in fade-in slide-in-from-top-2">
                          <div className="space-y-4 mb-4">
                              {post.comments?.length === 0 && <p className="text-xs text-slate-400 italic">No comments yet. Be the first.</p>}
                              {post.comments?.map((comment) => (
                                  <div key={comment.id} className="flex gap-3 text-sm">
                                      <CornerDownRight className="h-4 w-4 text-slate-300 mt-1 shrink-0" />
                                      <div className="bg-white p-3 rounded-lg border shadow-sm flex-1">
                                          <div className="flex justify-between items-baseline mb-1">
                                              <span className="font-bold text-xs text-slate-700">{comment.author}</span>
                                          </div>
                                          <p className="text-slate-600 mb-2">{comment.text}</p>
                                          <div className="flex items-center gap-3">
                                              <button 
                                                  onClick={() => handleCommentVote(post.id, comment.id)}
                                                  className={cn("flex items-center gap-1 text-[10px] font-medium transition-colors", comment.upvotedBy?.includes(user?.uid || "") ? "text-green-600" : "text-slate-400 hover:text-green-600")}
                                              >
                                                  <ThumbsUp className="h-3 w-3" /> {comment.upvotes || 0}
                                              </button>
                                              <button 
                                                  onClick={() => {
                                                    if (!user) {
                                                      toast({ title: "Login Required", description: "Please login to reply." });
                                                      return;
                                                    }
                                                    setReplyingTo(comment.id);
                                                  }}
                                                  className="flex items-center gap-1 text-[10px] font-medium text-slate-400 hover:text-primary transition-colors"
                                              >
                                                  <Reply className="h-3 w-3" /> Reply
                                              </button>
                                              {user?.uid === comment.userId && (
                                                  <button 
                                                      onClick={async () => {
                                                          const postRef = doc(db, 'artifacts', FIREBASE_APP_ID, 'public', 'data', 'forum_posts', post.id);
                                                          const newComments = post.comments.filter(c => c.id !== comment.id);
                                                          await updateDoc(postRef, { comments: newComments });
                                                      }}
                                                      className="text-[10px] text-red-500 hover:text-red-700 font-medium ml-auto"
                                                  >
                                                      Delete
                                                  </button>
                                              )}
                                          </div>
                                      </div>
                                  </div>
                              ))}
                          </div>

                          {replyingTo && (
                              <div className="mb-3 pl-7 text-xs text-slate-500 italic">
                                  Replying to <span className="font-semibold">{post.comments.find(c => c.id === replyingTo)?.author}</span>
                                  <button onClick={() => setReplyingTo(null)} className="ml-2 text-red-500 hover:text-red-700">Cancel</button>
                              </div>
                          )}

                          {user ? (
                            <form onSubmit={(e) => handleComment(e, post.id)} className="flex gap-2 pl-7">
                                <Input 
                                    value={commentText}
                                    onChange={e => setCommentText(e.target.value)}
                                    placeholder={replyingTo ? "Write a reply..." : "Write a comment..."} 
                                    className="h-9 text-xs bg-white"
                                />
                                <Button type="submit" size="sm" className="h-9 w-9 p-0">
                                    <Send className="h-4 w-4" />
                                </Button>
                            </form>
                          ) : (
                            <div className="pl-7 pt-2">
                              <p className="text-xs text-slate-500">
                                <button 
                                  onClick={() => window.location.href = '/auth/login'}
                                  className="text-primary font-semibold hover:underline"
                                >
                                  Login
                                </button> to join the discussion.
                              </p>
                            </div>
                          )}
                      </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

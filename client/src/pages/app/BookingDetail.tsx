import { useState, useRef, useEffect } from "react";
import { useParams, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/context/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Calendar,
  DollarSign,
  User,
  Store,
  Loader2,
  CheckCircle,
  Clock,
  AlertTriangle,
  FileText,
  MessageSquare,
  Send,
  Lock,
  Unlock,
  Flag,
  Wallet,
  PenLine,
} from "lucide-react";

interface BookingDetails {
  id: string;
  serviceId: string;
  serviceName: string;
  userId: string;
  vendorId: string;
  customerName: string;
  vendorName: string;
  status: string;
  totalAmount: number;
  description: string;
  scheduledDate: string;
  createdAt: string;
  confirmedAt: string;
  completedAt: string;
}

interface Milestone {
  id: string;
  bookingId: string;
  title: string;
  description: string;
  amountPercent: number;
  amount: number;
  order: number;
  status: string;
  dueDate: string;
  completedAt: string;
  releasedAt: string;
}

interface Escrow {
  id: string;
  bookingId: string;
  totalAmount: number;
  fundedAmount: number;
  releasedAmount: number;
  status: string;
  createdAt: string;
  fundedAt: string;
  releasedAt: string;
}

interface Contract {
  id: string;
  bookingId: string;
  title: string;
  terms: string;
  vendorSignedAt: string;
  userSignedAt: string;
  status: string;
  createdAt: string;
}

interface Message {
  id: string;
  bookingId: string;
  senderId: string;
  senderName: string;
  message: string;
  isAdminMessage: boolean;
  createdAt: string;
  readAt: string;
}

interface BookingData {
  booking: BookingDetails;
  milestones: Milestone[];
  escrow: Escrow | null;
  contract: Contract | null;
}

const STATUS_COLORS: Record<string, string> = {
  requested: "bg-yellow-100 text-yellow-800 border-yellow-200",
  confirmed: "bg-blue-100 text-blue-800 border-blue-200",
  in_progress: "bg-purple-100 text-purple-800 border-purple-200",
  completed: "bg-green-100 text-green-800 border-green-200",
  disputed: "bg-red-100 text-red-800 border-red-200",
  cancelled: "bg-gray-100 text-gray-800 border-gray-200",
  pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
  funded: "bg-green-100 text-green-800 border-green-200",
  partial: "bg-orange-100 text-orange-800 border-orange-200",
  released: "bg-blue-100 text-blue-800 border-blue-200",
  refunded: "bg-gray-100 text-gray-800 border-gray-200",
  vendor_signed: "bg-blue-100 text-blue-800 border-blue-200",
  fully_signed: "bg-green-100 text-green-800 border-green-200",
};

const MILESTONE_STATUS_ICONS: Record<string, React.ReactNode> = {
  pending: <Clock className="h-4 w-4 text-yellow-600" />,
  in_progress: <Loader2 className="h-4 w-4 text-purple-600 animate-spin" />,
  completed: <CheckCircle className="h-4 w-4 text-blue-600" />,
  released: <Unlock className="h-4 w-4 text-green-600" />,
};

export default function BookingDetail() {
  const params = useParams<{ id: string }>();
  const bookingId = params.id;
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [messageInput, setMessageInput] = useState("");
  const [disputeReason, setDisputeReason] = useState("");
  const [showDisputeForm, setShowDisputeForm] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data, isLoading, error } = useQuery<BookingData>({
    queryKey: ["booking-detail", bookingId],
    queryFn: async () => {
      if (!bookingId) throw new Error("No booking ID");
      const res = await fetch(`/api/bookings/${bookingId}`);
      if (!res.ok) throw new Error("Failed to fetch booking");
      return res.json();
    },
    enabled: !!bookingId && !!user,
  });

  const { data: messages = [], refetch: refetchMessages } = useQuery<Message[]>({
    queryKey: ["booking-messages", bookingId],
    queryFn: async () => {
      if (!bookingId) return [];
      const res = await fetch(`/api/bookings/${bookingId}/messages`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!bookingId && !!user,
    refetchInterval: 10000,
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const getAuthHeaders = async () => {
    const token = await user?.getIdToken();
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
  };

  const sendMessageMutation = useMutation({
    mutationFn: async (message: string) => {
      const headers = await getAuthHeaders();
      const res = await fetch(`/api/bookings/${bookingId}/messages`, {
        method: "POST",
        headers,
        body: JSON.stringify({ message }),
      });
      if (!res.ok) throw new Error("Failed to send message");
      return res.json();
    },
    onSuccess: () => {
      setMessageInput("");
      refetchMessages();
    },
  });

  const completeMilestoneMutation = useMutation({
    mutationFn: async (milestoneId: string) => {
      const headers = await getAuthHeaders();
      const res = await fetch(`/api/bookings/${bookingId}/milestones/${milestoneId}/complete`, {
        method: "POST",
        headers,
      });
      if (!res.ok) throw new Error("Failed to complete milestone");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["booking-detail", bookingId] });
    },
  });

  const releaseFundsMutation = useMutation({
    mutationFn: async (milestoneId: string) => {
      const headers = await getAuthHeaders();
      const res = await fetch(`/api/bookings/${bookingId}/milestones/${milestoneId}/release`, {
        method: "POST",
        headers,
      });
      if (!res.ok) throw new Error("Failed to release funds");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["booking-detail", bookingId] });
    },
  });

  const fundEscrowMutation = useMutation({
    mutationFn: async () => {
      const headers = await getAuthHeaders();
      const res = await fetch(`/api/bookings/${bookingId}/escrow/fund`, {
        method: "POST",
        headers,
      });
      if (!res.ok) throw new Error("Failed to fund escrow");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["booking-detail", bookingId] });
    },
  });

  const signContractMutation = useMutation({
    mutationFn: async () => {
      const headers = await getAuthHeaders();
      const res = await fetch(`/api/bookings/${bookingId}/contract/sign`, {
        method: "POST",
        headers,
      });
      if (!res.ok) throw new Error("Failed to sign contract");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["booking-detail", bookingId] });
    },
  });

  const openDisputeMutation = useMutation({
    mutationFn: async (reason: string) => {
      const headers = await getAuthHeaders();
      const res = await fetch(`/api/bookings/${bookingId}/dispute`, {
        method: "POST",
        headers,
        body: JSON.stringify({ reason }),
      });
      if (!res.ok) throw new Error("Failed to open dispute");
      return res.json();
    },
    onSuccess: () => {
      setShowDisputeForm(false);
      setDisputeReason("");
      queryClient.invalidateQueries({ queryKey: ["booking-detail", bookingId] });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20" data-testid="loader-booking-detail">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-4 pb-20">
        <Link href="/app/bookings">
          <Button variant="ghost" size="sm" data-testid="button-back">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Bookings
          </Button>
        </Link>
        <Card className="border-red-200" data-testid="card-error">
          <CardContent className="py-8 text-center">
            <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <h4 className="font-bold text-red-600 mb-1">Booking Not Found</h4>
            <p className="text-sm text-slate-500">The booking you're looking for doesn't exist or you don't have access.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { booking, milestones, escrow, contract } = data;
  const isVendor = user?.uid === booking.vendorId;
  const isCustomer = user?.uid === booking.userId;
  const statusColor = STATUS_COLORS[booking.status] || STATUS_COLORS.pending;
  const formattedDate = booking.createdAt
    ? new Date(booking.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
    : "";
  const scheduledDate = booking.scheduledDate
    ? new Date(booking.scheduledDate).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
    : "";

  const canSignContract = contract && (
    (isVendor && !contract.vendorSignedAt) ||
    (isCustomer && !contract.userSignedAt)
  );
  const canFundEscrow = isCustomer && escrow && escrow.status === "pending";
  const canOpenDispute = isCustomer && booking.status !== "disputed" && booking.status !== "cancelled" && booking.status !== "completed";

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center gap-4">
        <Link href="/app/bookings">
          <Button variant="ghost" size="sm" data-testid="button-back">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <div>
          <h2 className="text-2xl font-bold tracking-tight" data-testid="text-booking-title">
            {booking.serviceName}
          </h2>
          <p className="text-slate-500 text-sm">Booking #{booking.id.slice(0, 8)}</p>
        </div>
      </div>

      <Card data-testid="card-header">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Badge className={statusColor} data-testid="badge-status">
                {booking.status.replace("_", " ").toUpperCase()}
              </Badge>
              <div className="flex items-center gap-1 text-lg font-bold text-slate-700">
                <DollarSign className="h-4 w-4" />
                <span data-testid="text-amount">₦{booking.totalAmount?.toLocaleString() || "0"}</span>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span data-testid="text-created-date">Created: {formattedDate}</span>
              </div>
              {scheduledDate && (
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span data-testid="text-scheduled-date">Scheduled: {scheduledDate}</span>
                </div>
              )}
            </div>
          </div>
          {booking.description && (
            <p className="text-sm text-slate-600 mt-3" data-testid="text-description">
              {booking.description}
            </p>
          )}
        </CardContent>
      </Card>

      <Card data-testid="card-parties">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Parties</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
            <div className="p-2 bg-blue-100 rounded-full">
              <User className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Customer</p>
              <p className="font-semibold" data-testid="text-customer-name">{booking.customerName}</p>
            </div>
            {isCustomer && <Badge variant="outline" className="ml-auto">You</Badge>}
          </div>
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
            <div className="p-2 bg-purple-100 rounded-full">
              <Store className="h-4 w-4 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Vendor</p>
              <p className="font-semibold" data-testid="text-vendor-name">{booking.vendorName}</p>
            </div>
            {isVendor && <Badge variant="outline" className="ml-auto">You</Badge>}
          </div>
        </CardContent>
      </Card>

      {milestones && milestones.length > 0 && (
        <Card data-testid="card-milestones">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-primary" />
              Milestones
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {milestones.sort((a, b) => a.order - b.order).map((milestone) => {
              const milestoneStatusColor = STATUS_COLORS[milestone.status] || STATUS_COLORS.pending;
              const dueDate = milestone.dueDate
                ? new Date(milestone.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                : null;
              const canMarkComplete = isVendor && milestone.status === "pending";
              const canReleaseFunds = isCustomer && milestone.status === "completed";

              return (
                <div
                  key={milestone.id}
                  className="p-4 border rounded-lg"
                  data-testid={`milestone-${milestone.id}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      {MILESTONE_STATUS_ICONS[milestone.status] || MILESTONE_STATUS_ICONS.pending}
                      <div>
                        <p className="font-semibold" data-testid={`text-milestone-title-${milestone.id}`}>
                          {milestone.title}
                        </p>
                        {milestone.description && (
                          <p className="text-sm text-slate-500">{milestone.description}</p>
                        )}
                        <div className="flex items-center gap-3 mt-2 text-sm">
                          <span className="font-medium text-slate-700">
                            ₦{milestone.amount?.toLocaleString() || "0"} ({milestone.amountPercent}%)
                          </span>
                          {dueDate && (
                            <span className="text-slate-500">Due: {dueDate}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge className={milestoneStatusColor}>
                        {milestone.status.replace("_", " ").toUpperCase()}
                      </Badge>
                      {canMarkComplete && (
                        <Button
                          size="sm"
                          onClick={() => completeMilestoneMutation.mutate(milestone.id)}
                          disabled={completeMilestoneMutation.isPending}
                          data-testid={`button-complete-${milestone.id}`}
                        >
                          {completeMilestoneMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Mark Complete
                            </>
                          )}
                        </Button>
                      )}
                      {canReleaseFunds && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-green-500 text-green-600 hover:bg-green-50"
                          onClick={() => releaseFundsMutation.mutate(milestone.id)}
                          disabled={releaseFundsMutation.isPending}
                          data-testid={`button-release-${milestone.id}`}
                        >
                          {releaseFundsMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <Unlock className="h-4 w-4 mr-1" />
                              Release Funds
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {escrow && (
        <Card data-testid="card-escrow">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Wallet className="h-5 w-5 text-primary" />
              Escrow
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
              <div className="p-3 bg-slate-50 rounded-lg text-center">
                <p className="text-xs text-slate-500">Status</p>
                <Badge className={STATUS_COLORS[escrow.status] || STATUS_COLORS.pending} data-testid="badge-escrow-status">
                  {escrow.status.toUpperCase()}
                </Badge>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg text-center">
                <p className="text-xs text-slate-500">Total</p>
                <p className="font-bold" data-testid="text-escrow-total">₦{escrow.totalAmount?.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg text-center">
                <p className="text-xs text-green-600">Funded</p>
                <p className="font-bold text-green-700" data-testid="text-escrow-funded">₦{escrow.fundedAmount?.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg text-center">
                <p className="text-xs text-blue-600">Released</p>
                <p className="font-bold text-blue-700" data-testid="text-escrow-released">₦{escrow.releasedAmount?.toLocaleString()}</p>
              </div>
            </div>
            {canFundEscrow && (
              <Button
                className="w-full"
                onClick={() => fundEscrowMutation.mutate()}
                disabled={fundEscrowMutation.isPending}
                data-testid="button-fund-escrow"
              >
                {fundEscrowMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Lock className="h-4 w-4 mr-2" />
                )}
                Fund Escrow (₦{escrow.totalAmount?.toLocaleString()})
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {contract && (
        <Card data-testid="card-contract">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Contract
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2" data-testid="text-contract-title">{contract.title}</h4>
              <div className="p-4 bg-slate-50 rounded-lg text-sm text-slate-700 whitespace-pre-wrap max-h-60 overflow-y-auto" data-testid="text-contract-terms">
                {contract.terms}
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <div className={`p-1 rounded-full ${contract.vendorSignedAt ? "bg-green-100" : "bg-slate-100"}`}>
                  {contract.vendorSignedAt ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <Clock className="h-4 w-4 text-slate-400" />
                  )}
                </div>
                <span className="text-sm" data-testid="text-vendor-signature">
                  Vendor: {contract.vendorSignedAt ? "Signed" : "Pending"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`p-1 rounded-full ${contract.userSignedAt ? "bg-green-100" : "bg-slate-100"}`}>
                  {contract.userSignedAt ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <Clock className="h-4 w-4 text-slate-400" />
                  )}
                </div>
                <span className="text-sm" data-testid="text-customer-signature">
                  Customer: {contract.userSignedAt ? "Signed" : "Pending"}
                </span>
              </div>
            </div>
            {canSignContract && (
              <Button
                onClick={() => signContractMutation.mutate()}
                disabled={signContractMutation.isPending}
                data-testid="button-sign-contract"
              >
                {signContractMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <PenLine className="h-4 w-4 mr-2" />
                )}
                Sign Contract
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      <Card data-testid="card-chat">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            Messages
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ScrollArea className="h-64 pr-4">
            {messages.length === 0 ? (
              <div className="text-center text-slate-400 py-8">
                No messages yet. Start the conversation!
              </div>
            ) : (
              <div className="space-y-3">
                {messages.map((msg) => {
                  const isMine = msg.senderId === user?.uid;
                  const msgTime = msg.createdAt
                    ? new Date(msg.createdAt).toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })
                    : "";
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                      data-testid={`message-${msg.id}`}
                    >
                      <div
                        className={`max-w-[80%] p-3 rounded-lg ${
                          msg.isAdminMessage
                            ? "bg-yellow-50 border border-yellow-200"
                            : isMine
                            ? "bg-primary text-white"
                            : "bg-slate-100"
                        }`}
                      >
                        {!isMine && (
                          <p className="text-xs font-medium mb-1" data-testid={`text-sender-${msg.id}`}>
                            {msg.senderName || (msg.isAdminMessage ? "Admin" : "User")}
                          </p>
                        )}
                        <p className="text-sm" data-testid={`text-message-${msg.id}`}>{msg.message}</p>
                        <p className={`text-xs mt-1 ${isMine ? "text-white/70" : "text-slate-400"}`}>
                          {msgTime}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            )}
          </ScrollArea>
          <Separator />
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (messageInput.trim()) {
                sendMessageMutation.mutate(messageInput.trim());
              }
            }}
            className="flex gap-2"
          >
            <Input
              placeholder="Type a message..."
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              disabled={sendMessageMutation.isPending}
              data-testid="input-message"
            />
            <Button
              type="submit"
              size="icon"
              disabled={sendMessageMutation.isPending || !messageInput.trim()}
              data-testid="button-send-message"
            >
              {sendMessageMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {canOpenDispute && (
        <Card className="border-red-200" data-testid="card-dispute">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-red-600">
              <Flag className="h-5 w-5" />
              Open a Dispute
            </CardTitle>
          </CardHeader>
          <CardContent>
            {showDisputeForm ? (
              <div className="space-y-3">
                <Textarea
                  placeholder="Describe the issue you're experiencing..."
                  value={disputeReason}
                  onChange={(e) => setDisputeReason(e.target.value)}
                  rows={4}
                  data-testid="input-dispute-reason"
                />
                <div className="flex gap-2">
                  <Button
                    variant="destructive"
                    onClick={() => {
                      if (disputeReason.trim()) {
                        openDisputeMutation.mutate(disputeReason.trim());
                      }
                    }}
                    disabled={openDisputeMutation.isPending || !disputeReason.trim()}
                    data-testid="button-submit-dispute"
                  >
                    {openDisputeMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Flag className="h-4 w-4 mr-2" />
                    )}
                    Submit Dispute
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowDisputeForm(false);
                      setDisputeReason("");
                    }}
                    data-testid="button-cancel-dispute"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-500">
                  If you have an issue with this booking, you can open a dispute for admin review.
                </p>
                <Button
                  variant="outline"
                  className="border-red-300 text-red-600 hover:bg-red-50"
                  onClick={() => setShowDisputeForm(true)}
                  data-testid="button-open-dispute"
                >
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Open Dispute
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

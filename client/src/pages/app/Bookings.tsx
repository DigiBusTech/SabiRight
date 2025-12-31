import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Calendar, DollarSign, User, Store, Loader2 } from "lucide-react";

interface Booking {
  id: number;
  serviceName: string;
  vendorName?: string;
  customerName?: string;
  status: string;
  totalAmount: number;
  createdAt: string;
}

const STATUS_COLORS: Record<string, string> = {
  requested: "bg-yellow-100 text-yellow-800 border-yellow-200",
  confirmed: "bg-blue-100 text-blue-800 border-blue-200",
  in_progress: "bg-purple-100 text-purple-800 border-purple-200",
  completed: "bg-green-100 text-green-800 border-green-200",
  disputed: "bg-red-100 text-red-800 border-red-200",
  cancelled: "bg-gray-100 text-gray-800 border-gray-200",
};

function BookingCard({ booking, isVendorView }: { booking: Booking; isVendorView: boolean }) {
  const statusColor = STATUS_COLORS[booking.status] || STATUS_COLORS.cancelled;
  const formattedDate = new Date(booking.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <Link href={`/app/bookings/${booking.id}`}>
      <Card
        className="hover:border-primary/50 transition-colors cursor-pointer"
        data-testid={`card-booking-${booking.id}`}
      >
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <h4 className="font-bold text-sm" data-testid={`text-service-${booking.id}`}>
                {booking.serviceName}
              </h4>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                {isVendorView ? (
                  <>
                    <User className="h-3 w-3" />
                    <span data-testid={`text-customer-${booking.id}`}>{booking.customerName}</span>
                  </>
                ) : (
                  <>
                    <Store className="h-3 w-3" />
                    <span data-testid={`text-vendor-${booking.id}`}>{booking.vendorName}</span>
                  </>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Badge className={statusColor} data-testid={`badge-status-${booking.id}`}>
                {booking.status.replace("_", " ").toUpperCase()}
              </Badge>
              <div className="flex items-center gap-1 text-sm font-semibold text-slate-700">
                <DollarSign className="h-3 w-3" />
                <span data-testid={`text-amount-${booking.id}`}>
                  ₦{booking.totalAmount?.toLocaleString() || "0"}
                </span>
              </div>
              <div className="flex items-center gap-1 text-xs text-slate-500">
                <Calendar className="h-3 w-3" />
                <span data-testid={`text-date-${booking.id}`}>{formattedDate}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function BookingsList({ bookings, isLoading, isVendorView }: { bookings: Booking[]; isLoading: boolean; isVendorView: boolean }) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12" data-testid="loader-bookings">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!bookings || bookings.length === 0) {
    return (
      <Card className="border-dashed" data-testid="empty-bookings">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <Calendar className="h-12 w-12 text-slate-300 mb-4" />
          <h4 className="font-bold text-slate-600 mb-1">No bookings yet</h4>
          <p className="text-sm text-slate-400">
            {isVendorView
              ? "You haven't received any bookings as a vendor yet."
              : "You haven't made any bookings yet."}
          </p>
          {!isVendorView && (
            <Link href="/app/marketplace">
              <Button className="mt-4" data-testid="button-browse-services">
                Browse Services
              </Button>
            </Link>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3" data-testid="list-bookings">
      {bookings.map((booking) => (
        <BookingCard key={booking.id} booking={booking} isVendorView={isVendorView} />
      ))}
    </div>
  );
}

export default function Bookings() {
  const { user, profile } = useAuth();

  const { data: customerBookings = [], isLoading: isLoadingCustomer } = useQuery<Booking[]>({
    queryKey: [`bookings-user-${user?.uid}`],
    queryFn: async () => {
      if (!user?.uid) return [];
      const res = await fetch(`/api/bookings/user/${user.uid}`);
      return res.ok ? res.json() : [];
    },
    enabled: !!user?.uid,
  });

  const { data: vendorBookings = [], isLoading: isLoadingVendor } = useQuery<Booking[]>({
    queryKey: [`bookings-vendor-${user?.uid}`],
    queryFn: async () => {
      if (!user?.uid || !profile?.vendorMode) return [];
      const res = await fetch(`/api/bookings/vendor/${user.uid}`);
      return res.ok ? res.json() : [];
    },
    enabled: !!user?.uid && !!profile?.vendorMode,
  });

  return (
    <div className="space-y-6 pb-20">
      <div>
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight" data-testid="text-page-title">
          My Bookings
        </h2>
        <p className="text-slate-500 text-sm md:text-base mt-1">
          View and manage your service bookings.
        </p>
      </div>

      <Tabs defaultValue="customer" className="w-full" data-testid="tabs-bookings">
        <TabsList className="w-full sm:w-auto" data-testid="tabs-list">
          <TabsTrigger value="customer" className="flex-1 sm:flex-initial" data-testid="tab-customer">
            As Customer
          </TabsTrigger>
          {profile?.vendorMode && (
            <TabsTrigger value="vendor" className="flex-1 sm:flex-initial" data-testid="tab-vendor">
              As Vendor
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="customer" className="mt-4" data-testid="content-customer">
          <BookingsList
            bookings={customerBookings}
            isLoading={isLoadingCustomer}
            isVendorView={false}
          />
        </TabsContent>

        {profile?.vendorMode && (
          <TabsContent value="vendor" className="mt-4" data-testid="content-vendor">
            <BookingsList
              bookings={vendorBookings}
              isLoading={isLoadingVendor}
              isVendorView={true}
            />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}

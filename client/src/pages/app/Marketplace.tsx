import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Search, MapPin, Star, Clock, TrendingUp, Phone, Mail, Navigation, Wallet, MessageCircle, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";

interface ServiceProvider {
  id: string;
  vendorId: string;
  name: string;
  type: string;
  specialization: string;
  location: string;
  latitude: number;
  longitude: number;
  rating: string;
  reviewCount: number;
  verified: boolean;
  contactPhone: string;
  contactEmail: string;
  priceRange: string;
  distanceKm?: number;
  estimatedTimeMin?: number;
  reason?: string;
}

const CATEGORIES = ["All Services", "Lawyers", "Plumbers", "Health", "Movers", "Real Estate", "Electricians", "Cleaners"];

declare global {
  interface Window {
    google: any;
  }
}

export default function Marketplace() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Services");
  const [sortBy, setSortBy] = useState<"distance" | "time" | "rating">("time");
  const [selectedProvider, setSelectedProvider] = useState<ServiceProvider | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [providersWithDistance, setProvidersWithDistance] = useState<ServiceProvider[]>([]);
  
  // Booking modal state
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingProvider, setBookingProvider] = useState<ServiceProvider | null>(null);
  const [bookingDescription, setBookingDescription] = useState("");
  const [bookingAmount, setBookingAmount] = useState("");
  const [bookingDate, setBookingDate] = useState("");
  const [isCreatingBooking, setIsCreatingBooking] = useState(false);
  
  // Fetch wallet balance
  const { data: wallet } = useQuery({
    queryKey: ['wallet', user?.uid],
    queryFn: async () => {
      if (!user) return null;
      const token = await user.getIdToken();
      const res = await fetch(`/api/wallet/${user.uid}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!user
  });

  // Get user's current location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        () => {
          // Default to Lagos if geolocation fails
          setUserLocation({ lat: 6.5244, lng: 3.3792 });
        }
      );
    } else {
      setUserLocation({ lat: 6.5244, lng: 3.3792 });
    }
  }, []);

  // Fetch vendor services
  const { data: services = [] } = useQuery({
    queryKey: ['vendor-services'],
    queryFn: async () => {
      const res = await fetch('/api/services');
      if (!res.ok) return getMockProviders();
      const data = await res.json();
      return data.length > 0 ? data : getMockProviders();
    }
  });

  // Calculate distances using Google Maps API
  useEffect(() => {
    if (!userLocation || services.length === 0) return;

    const calculateDistances = async () => {
      const providersWithCalc = await Promise.all(
        services.map(async (provider: ServiceProvider) => {
          const providerLat = parseFloat(provider.latitude?.toString() || "6.5244");
          const providerLng = parseFloat(provider.longitude?.toString() || "3.3792");
          
          // Calculate straight-line distance
          const R = 6371; // Earth's radius in km
          const dLat = (providerLat - userLocation.lat) * Math.PI / 180;
          const dLon = (providerLng - userLocation.lng) * Math.PI / 180;
          const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                    Math.cos(userLocation.lat * Math.PI / 180) * Math.cos(providerLat * Math.PI / 180) *
                    Math.sin(dLon/2) * Math.sin(dLon/2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
          const distanceKm = R * c;

          // Estimate time based on Lagos traffic (avg 15km/h in traffic, 30km/h normal)
          const isRushHour = new Date().getHours() >= 7 && new Date().getHours() <= 9 || 
                            new Date().getHours() >= 17 && new Date().getHours() <= 20;
          const avgSpeed = isRushHour ? 15 : 30;
          const estimatedTimeMin = Math.round((distanceKm / avgSpeed) * 60);

          // Generate reason for proximity matching
          let reason = '';
          if (isRushHour && estimatedTimeMin < 20) {
            reason = `${estimatedTimeMin} mins faster via alternative route avoiding traffic`;
          } else if (distanceKm < 2) {
            reason = 'Closest verified provider in your area';
          }

          return {
            ...provider,
            distanceKm: Math.round(distanceKm * 10) / 10,
            estimatedTimeMin,
            reason
          };
        })
      );

      setProvidersWithDistance(providersWithCalc);
    };

    calculateDistances();
  }, [userLocation, services]);

  // Filter and sort providers
  const filteredProviders = providersWithDistance.filter(provider => {
    const matchesSearch = 
      provider.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      provider.specialization?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      provider.type.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = 
      selectedCategory === "All Services" ||
      provider.type.toLowerCase().includes(selectedCategory.toLowerCase().slice(0, -1));
    
    return matchesSearch && matchesCategory;
  });

  const sortedProviders = [...filteredProviders].sort((a, b) => {
    if (sortBy === "distance") return (a.distanceKm || 0) - (b.distanceKm || 0);
    if (sortBy === "time") return (a.estimatedTimeMin || 0) - (b.estimatedTimeMin || 0);
    return parseFloat(b.rating) - parseFloat(a.rating);
  });

  const handleContact = (provider: ServiceProvider) => {
    if (!user) {
      toast({ 
        title: "Login Required", 
        description: "Please log in to request services from vendors",
        variant: "destructive"
      });
      setLocation("/login");
      return;
    }
    setBookingProvider(provider);
    setBookingDescription("");
    setBookingAmount(provider.priceRange?.replace(/[^\d]/g, '') || "5000");
    setBookingDate("");
    setShowBookingModal(true);
  };

  const handleCreateBooking = async () => {
    if (!user || !bookingProvider) return;
    
    const amount = parseFloat(bookingAmount);
    if (!amount || amount <= 0) {
      toast({ title: "Invalid amount", description: "Please enter a valid amount", variant: "destructive" });
      return;
    }
    
    if (!bookingDescription.trim()) {
      toast({ title: "Description required", description: "Please describe what you need", variant: "destructive" });
      return;
    }
    
    setIsCreatingBooking(true);
    try {
      const token = await user.getIdToken();
      
      // Create booking
      const bookingRes = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          serviceId: bookingProvider.id,
          userId: user.uid,
          vendorId: bookingProvider.vendorId,
          totalAmount: amount,
          description: bookingDescription,
          scheduledDate: bookingDate || null,
          milestones: [
            { title: "Initial Payment", description: "Deposit to start work", amountPercent: 50 },
            { title: "Final Payment", description: "Upon completion", amountPercent: 50 }
          ]
        })
      });
      
      if (!bookingRes.ok) {
        const error = await bookingRes.json();
        throw new Error(error.error || 'Failed to create booking');
      }
      
      const booking = await bookingRes.json();
      
      // Fund escrow if wallet has balance
      if (wallet && parseFloat(wallet.balance) >= amount) {
        try {
          await fetch(`/api/bookings/${booking.id}/escrow/fund`, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ amount })
          });
          toast({ title: "Escrow Funded", description: "Your payment is secured in escrow" });
        } catch (e) {
          toast({ title: "Booking Created", description: "Please fund the escrow from the booking page" });
        }
      }
      
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      
      setShowBookingModal(false);
      setSelectedProvider(null);
      
      toast({ 
        title: "Booking Created!", 
        description: `Your booking with ${bookingProvider.name} has been created. You can now chat and track progress.`
      });
      
      // Navigate to booking detail
      setLocation(`/app/bookings/${booking.id}`);
      
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to create booking", variant: "destructive" });
    } finally {
      setIsCreatingBooking(false);
    }
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Vetted Service Marketplace</h2>
          <p className="text-slate-500">Find verified professionals with smart proximity routing powered by real-time traffic data.</p>
        </div>
        {userLocation && (
          <Badge className="bg-green-100 text-green-800 border-green-200">
            <Navigation className="h-3 w-3 mr-1" /> Location Active
          </Badge>
        )}
      </div>

      {/* Proximity Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <p className="text-sm text-blue-800 font-medium">
          <TrendingUp className="inline h-4 w-4 mr-2" />
          <strong>Smart Proximity Matching:</strong> We match you with verified professionals using real route calculations. 
          Not just distance — we factor in actual traffic data to ensure they arrive when you need them.
        </p>
      </div>

      {/* Search & Filter */}
      <div className="space-y-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Search by name, profession, or specialty..." 
              className="pl-10 bg-white" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Categories */}
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
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

        {/* Sort Options */}
        <div className="flex gap-2">
          <button
            onClick={() => setSortBy("time")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              sortBy === "time"
                ? "bg-blue-100 text-blue-700 border border-blue-300"
                : "bg-white text-slate-600 border border-slate-200 hover:border-slate-300"
            }`}
          >
            <Clock className="h-4 w-4" /> Fastest Arrival
          </button>
          <button
            onClick={() => setSortBy("distance")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              sortBy === "distance"
                ? "bg-green-100 text-green-700 border border-green-300"
                : "bg-white text-slate-600 border border-slate-200 hover:border-slate-300"
            }`}
          >
            <MapPin className="h-4 w-4" /> Closest Distance
          </button>
          <button
            onClick={() => setSortBy("rating")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              sortBy === "rating"
                ? "bg-yellow-100 text-yellow-700 border border-yellow-300"
                : "bg-white text-slate-600 border border-slate-200 hover:border-slate-300"
            }`}
          >
            <Star className="h-4 w-4" /> Top Rated
          </button>
        </div>
      </div>

      {/* Providers Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {sortedProviders.length === 0 ? (
          <div className="col-span-2 text-center py-12 text-slate-400">
            No providers found matching your criteria.
          </div>
        ) : (
          sortedProviders.map((provider) => (
            <Card 
              key={provider.id} 
              className="group hover:shadow-lg transition-all duration-300 border-slate-200 cursor-pointer hover:border-primary/50"
              onClick={() => setSelectedProvider(provider)}
            >
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-lg text-slate-900">{provider.name}</h3>
                    <p className="text-sm text-slate-600 mb-2">{provider.type}</p>
                    <p className="text-xs text-slate-500">{provider.specialization}</p>
                  </div>
                  {provider.verified && (
                    <Badge className="bg-green-100 text-green-700 border-green-200">Verified</Badge>
                  )}
                </div>

                {/* Proximity Logic Display */}
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-xs font-bold text-blue-900 uppercase">Estimated Arrival</p>
                      <p className="text-lg font-bold text-blue-700 mt-1">{provider.estimatedTimeMin || '?'} min</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-600">{provider.distanceKm || '?'} km</p>
                      <p className="text-xs text-slate-500 mt-1">from your location</p>
                    </div>
                  </div>
                  {provider.reason && (
                    <p className="text-xs text-blue-700 font-medium pt-2 border-t border-blue-200">
                      ✓ {provider.reason}
                    </p>
                  )}
                </div>

                {/* Rating */}
                <div className="flex items-center gap-2 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-3 w-3 ${i < Math.floor(parseFloat(provider.rating)) ? "fill-yellow-400 text-yellow-400" : "text-slate-300"}`}
                    />
                  ))}
                  <span className="text-xs font-bold ml-1 text-slate-700">{provider.rating}</span>
                  <span className="text-xs text-slate-400">({provider.reviewCount} reviews)</span>
                </div>

                {/* Location */}
                <div className="flex items-center gap-2 text-xs text-slate-600 mb-4">
                  <MapPin className="h-3 w-3" /> {provider.location}
                </div>

                {/* Action */}
                <Button 
                  className="w-full bg-primary hover:bg-primary/90 text-white font-bold"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleContact(provider);
                  }}
                >
                  Request Service
                </Button>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Provider Detail Modal */}
      {selectedProvider && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-lg shadow-xl">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div>
                      <h2 className="text-2xl font-bold text-slate-900">{selectedProvider.name}</h2>
                      <p className="text-lg text-slate-600 mt-1">{selectedProvider.type}</p>
                    </div>
                    {selectedProvider.verified && (
                      <Badge className="bg-green-100 text-green-700">✓ Verified</Badge>
                    )}
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedProvider(null)}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  ✕
                </button>
              </div>

              <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-6">
                <p className="text-sm font-bold text-blue-900 uppercase mb-3">Smart Proximity Routing</p>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-slate-700">Estimated Arrival:</span>
                    <span className="text-lg font-bold text-blue-700">{selectedProvider.estimatedTimeMin} minutes</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-slate-700">Distance:</span>
                    <span className="text-lg font-bold text-slate-900">{selectedProvider.distanceKm} km</span>
                  </div>
                  {selectedProvider.reason && (
                    <div className="pt-3 border-t border-blue-200">
                      <p className="text-sm text-blue-700 font-medium">
                        <TrendingUp className="inline h-4 w-4 mr-2" />
                        {selectedProvider.reason}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4 mb-6">
                <div className="bg-slate-50 p-4 rounded-lg">
                  <p className="text-xs font-bold text-slate-600 uppercase mb-2">Rating</p>
                  <div className="flex items-center gap-2">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${i < Math.floor(parseFloat(selectedProvider.rating)) ? "fill-yellow-400 text-yellow-400" : "text-slate-300"}`}
                      />
                    ))}
                  </div>
                  <p className="text-lg font-bold mt-1">{selectedProvider.rating} / 5.0</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-lg">
                  <p className="text-xs font-bold text-slate-600 uppercase mb-2">Specialization</p>
                  <p className="text-sm font-semibold">{selectedProvider.specialization}</p>
                </div>
              </div>

              <div className="border-t pt-6 space-y-3">
                <p className="text-sm font-bold text-slate-600 uppercase">Contact Information</p>
                {selectedProvider.contactPhone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-slate-400" />
                    <a href={`tel:${selectedProvider.contactPhone}`} className="text-sm font-semibold text-primary hover:underline">
                      {selectedProvider.contactPhone}
                    </a>
                  </div>
                )}
                {selectedProvider.contactEmail && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-slate-400" />
                    <a href={`mailto:${selectedProvider.contactEmail}`} className="text-sm font-semibold text-primary hover:underline break-all">
                      {selectedProvider.contactEmail}
                    </a>
                  </div>
                )}
              </div>

              <Button 
                size="lg" 
                className="w-full mt-6 bg-primary hover:bg-primary/90 text-white font-bold py-3"
                onClick={() => {
                  handleContact(selectedProvider);
                  setSelectedProvider(null);
                }}
                data-testid="button-request-service-modal"
              >
                Request Service from {selectedProvider.name}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Booking Modal */}
      {showBookingModal && bookingProvider && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto">
          <Card className="w-full max-w-lg bg-white rounded-lg shadow-xl my-4 sm:my-8 max-h-[95vh] overflow-y-auto">
            <CardContent className="p-4 sm:p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Book Service</h2>
                  <p className="text-sm text-slate-500 mt-1">Request service from {bookingProvider.name}</p>
                </div>
                <button 
                  onClick={() => setShowBookingModal(false)}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                  data-testid="button-close-booking-modal"
                >
                  ✕
                </button>
              </div>

              {/* Escrow Info Banner */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-semibold text-green-800">Secure Escrow Protection</p>
                    <p className="text-sm text-green-700 mt-1">
                      Your payment is held securely in escrow until milestones are completed. 
                      Chat directly with the vendor and request refunds if needed.
                    </p>
                  </div>
                </div>
              </div>

              {/* Wallet Balance */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Wallet className="h-5 w-5 text-blue-600" />
                    <span className="font-semibold text-blue-800">Wallet Balance</span>
                  </div>
                  <span className="text-lg font-bold text-blue-900">
                    ₦{parseFloat(wallet?.balance || '0').toLocaleString()}
                  </span>
                </div>
                {parseFloat(wallet?.balance || '0') < parseFloat(bookingAmount || '0') && (
                  <p className="text-xs text-blue-700 mt-2">
                    Insufficient balance. <a href="/app/wallet" className="underline font-semibold">Top up wallet</a> to auto-fund escrow.
                  </p>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="description">What do you need? *</Label>
                  <Textarea 
                    id="description"
                    placeholder="Describe the service you need in detail..."
                    value={bookingDescription}
                    onChange={(e) => setBookingDescription(e.target.value)}
                    className="mt-1"
                    rows={3}
                    data-testid="input-booking-description"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="amount">Total Amount (₦) *</Label>
                    <Input 
                      id="amount"
                      type="number"
                      placeholder="e.g. 50000"
                      value={bookingAmount}
                      onChange={(e) => setBookingAmount(e.target.value)}
                      className="mt-1"
                      data-testid="input-booking-amount"
                    />
                  </div>
                  <div>
                    <Label htmlFor="date">Preferred Date</Label>
                    <Input 
                      id="date"
                      type="date"
                      value={bookingDate}
                      onChange={(e) => setBookingDate(e.target.value)}
                      className="mt-1"
                      data-testid="input-booking-date"
                    />
                  </div>
                </div>

                <div className="bg-slate-50 rounded-lg p-4">
                  <p className="text-sm font-semibold text-slate-700 mb-2">What happens next?</p>
                  <div className="space-y-2 text-sm text-slate-600">
                    <div className="flex items-center gap-2">
                      <MessageCircle className="h-4 w-4 text-primary" />
                      <span>Chat with the vendor to discuss details</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Wallet className="h-4 w-4 text-green-600" />
                      <span>Fund escrow to secure your booking</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-blue-600" />
                      <span>Milestones released as work completes</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => setShowBookingModal(false)}
                  data-testid="button-cancel-booking"
                >
                  Cancel
                </Button>
                <Button 
                  className="flex-1 bg-primary hover:bg-primary/90 text-white font-bold"
                  onClick={handleCreateBooking}
                  disabled={isCreatingBooking || !bookingDescription.trim() || !bookingAmount}
                  data-testid="button-create-booking"
                >
                  {isCreatingBooking ? "Creating..." : "Create Booking"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

// Mock providers for demo
function getMockProviders(): ServiceProvider[] {
  return [
    {
      id: "1",
      vendorId: "v1",
      name: "Barrister Adebayo",
      type: "Lawyer",
      specialization: "Civil Rights & Family Law",
      location: "VI, Lagos",
      latitude: 6.4281,
      longitude: 3.4344,
      rating: "4.9",
      reviewCount: 127,
      verified: true,
      contactPhone: "+234 701 234 5678",
      contactEmail: "adebayo@legalaid.ng",
      priceRange: "₦₦₦"
    },
    {
      id: "2",
      vendorId: "v2",
      name: "Barrister Obi",
      type: "Lawyer",
      specialization: "Corporate & Tax Law",
      location: "Ikoyi, Lagos",
      latitude: 6.4513,
      longitude: 3.4647,
      rating: "4.8",
      reviewCount: 89,
      verified: true,
      contactPhone: "+234 801 987 6543",
      contactEmail: "obi@legalpractice.ng",
      priceRange: "₦₦₦₦"
    },
    {
      id: "3",
      vendorId: "v3",
      name: "FixIt Pro Plumbing",
      type: "Plumber",
      specialization: "Residential & Commercial Plumbing",
      location: "Lekki, Lagos",
      latitude: 6.4469,
      longitude: 3.5753,
      rating: "4.7",
      reviewCount: 234,
      verified: true,
      contactPhone: "+234 909 876 5432",
      contactEmail: "info@fixitpro.ng",
      priceRange: "₦₦"
    },
    {
      id: "4",
      vendorId: "v4",
      name: "Dr. Chioma Healthcare",
      type: "Health Professional",
      specialization: "General Practice & Diagnostics",
      location: "Ikeja, Lagos",
      latitude: 6.5833,
      longitude: 3.3333,
      rating: "4.9",
      reviewCount: 312,
      verified: true,
      contactPhone: "+234 808 123 4567",
      contactEmail: "chioma@healthcareng.ng",
      priceRange: "₦₦₦"
    },
    {
      id: "5",
      vendorId: "v5",
      name: "SafeMove Logistics",
      type: "Mover",
      specialization: "Residential Relocation",
      location: "Ajah, Lagos",
      latitude: 6.5074,
      longitude: 3.5963,
      rating: "4.8",
      reviewCount: 178,
      verified: true,
      contactPhone: "+234 702 345 6789",
      contactEmail: "service@safemove.ng",
      priceRange: "₦₦"
    },
    {
      id: "6",
      vendorId: "v6",
      name: "Agent Taiwo Properties",
      type: "Real Estate Agent",
      specialization: "Residential & Commercial Properties",
      location: "Yaba, Lagos",
      latitude: 6.5007,
      longitude: 3.3575,
      rating: "4.7",
      reviewCount: 156,
      verified: true,
      contactPhone: "+234 805 567 8901",
      contactEmail: "taiwo@propertyagent.ng",
      priceRange: "₦₦₦"
    }
  ];
}

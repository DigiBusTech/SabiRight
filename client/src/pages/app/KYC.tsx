import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, Upload, CheckCircle2, Clock, Image, X, FileText } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";

export default function KYCVerification() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [fullName, setFullName] = useState("");
  const [documentType, setDocumentType] = useState("national_id");
  const [documentNumber, setDocumentNumber] = useState("");
  const [idImage, setIdImage] = useState<string | null>(null);
  const [idFileName, setIdFileName] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: profile, refetch } = useQuery({
    queryKey: [`profile-${user?.uid}`],
    queryFn: async () => {
      if (!user?.uid) return null;
      const res = await fetch(`/api/profile/${user.uid}`);
      return res.ok ? res.json() : null;
    },
    enabled: !!user?.uid,
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({ title: "Error", description: "File must be less than 5MB", variant: "destructive" });
        return;
      }
      
      if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
        toast({ title: "Error", description: "Only images and PDF files are accepted", variant: "destructive" });
        return;
      }

      setIdFileName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        setIdImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmitKYC = async () => {
    if (!user?.uid || !fullName || !documentNumber || !idImage) {
      toast({ title: "Error", description: "Please fill all fields and upload ID photo", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/kyc/${user.uid}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          kycDocument: `${documentType}:${documentNumber}`,
          fullName,
          documentType,
          documentNumber,
          idImage
        })
      });

      if (res.ok) {
        toast({ title: "Success", description: "KYC submitted! Pending admin review" });
        setFullName("");
        setDocumentNumber("");
        setIdImage(null);
        setIdFileName("");
        refetch();
      } else {
        throw new Error('Failed to submit KYC');
      }
    } catch (err) {
      toast({ title: "Error", description: "Failed to submit KYC", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 pb-20">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Identity Verification (KYC)</h2>
        <p className="text-slate-500 mt-1">Verify your identity to access all platform features</p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Verification Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-slate-50 rounded-lg flex items-center justify-between">
            <div>
              <p className="font-bold mb-1">Current Status</p>
              <p className="text-sm text-slate-600">
                {profile?.kycStatus === 'verified' 
                  ? 'Your identity has been verified'
                  : profile?.kycStatus === 'pending'
                  ? 'Your KYC is pending admin review'
                  : 'Not yet submitted'}
              </p>
            </div>
            <Badge className={`${
              profile?.kycStatus === 'verified' 
                ? 'bg-green-100 text-green-800 border-green-300'
                : profile?.kycStatus === 'pending'
                ? 'bg-yellow-100 text-yellow-800 border-yellow-300'
                : 'bg-slate-100 text-slate-800 border-slate-300'
            }`}>
              {profile?.kycStatus === 'verified' && <CheckCircle2 className="h-3 w-3 mr-1" />}
              {profile?.kycStatus === 'pending' && <Clock className="h-3 w-3 mr-1" />}
              {profile?.kycStatus?.toUpperCase() || 'NOT SUBMITTED'}
            </Badge>
          </div>

          {profile?.kycVerifiedAt && (
            <div className="text-xs text-slate-500 text-center">
              Verified on {new Date(profile.kycVerifiedAt).toLocaleDateString()}
            </div>
          )}
        </CardContent>
      </Card>

      {profile?.kycStatus !== 'verified' && (
        <Card className="border-blue-100 bg-blue-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Submit KYC Documents</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-bold mb-2">Full Legal Name</label>
              <Input
                placeholder="Enter your full name as on ID"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-bold mb-2">Document Type</label>
              <select
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value)}
                className="w-full border rounded-lg p-2 text-sm bg-white"
              >
                <option value="national_id">National ID (NIN)</option>
                <option value="passport">International Passport</option>
                <option value="drivers_license">Driver's License</option>
                <option value="voters_card">Voter's Card</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold mb-2">Document Number</label>
              <Input
                placeholder="Enter your document number"
                value={documentNumber}
                onChange={(e) => setDocumentNumber(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-bold mb-2">Upload ID Photo</label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.pdf"
                onChange={handleFileSelect}
                className="hidden"
              />
              
              {!idImage ? (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-slate-300 rounded-lg p-8 hover:border-primary hover:bg-primary/5 transition-colors"
                >
                  <div className="flex flex-col items-center gap-2 text-slate-500">
                    <Image className="h-10 w-10" />
                    <span className="font-bold">Click to upload ID photo</span>
                    <span className="text-xs">JPG, PNG or PDF (max 5MB)</span>
                  </div>
                </button>
              ) : (
                <div className="border rounded-lg p-4 bg-white">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileText className="h-8 w-8 text-primary" />
                      <div>
                        <p className="font-bold text-sm">{idFileName}</p>
                        <p className="text-xs text-green-600">File uploaded successfully</p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setIdImage(null);
                        setIdFileName("");
                      }}
                      className="p-2 hover:bg-red-50 rounded-lg"
                    >
                      <X className="h-4 w-4 text-red-500" />
                    </button>
                  </div>
                  {idImage.startsWith('data:image') && (
                    <img src={idImage} alt="ID Preview" className="mt-3 rounded-lg max-h-40 object-contain" />
                  )}
                </div>
              )}
            </div>

            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-xs text-yellow-800">
                Your document will be reviewed by our team within 24-48 hours. Make sure the photo is clear and all information is visible.
              </p>
            </div>

            <Button
              onClick={handleSubmitKYC}
              disabled={isSubmitting || !fullName || !documentNumber || !idImage}
              className="w-full bg-primary hover:bg-primary/90 gap-2"
            >
              <Upload className="h-4 w-4" />
              {isSubmitting ? 'Submitting...' : 'Submit for Verification'}
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Why Verify?</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-sm">Full Feature Access</p>
                <p className="text-xs text-slate-600">Unlock all marketplace and civic features</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-sm">Become a Vendor</p>
                <p className="text-xs text-slate-600">List services and reach customers</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-sm">Community Trust</p>
                <p className="text-xs text-slate-600">Build reputation as verified citizen</p>
              </div>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

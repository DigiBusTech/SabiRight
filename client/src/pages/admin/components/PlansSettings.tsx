import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export function PlansSettings() {
  const [planName, setPlanName] = useState("");
  const [tierLevel, setTierLevel] = useState("Basic");
  const [targetAudience, setTargetAudience] = useState("Regular User");
  const [price, setPrice] = useState("0");
  const [creditAllowance, setCreditAllowance] = useState("10");
  const [planDescription, setPlanDescription] = useState("");

  const existingPlans = [
    { id: 1, name: "Basic", audience: "user", price: "NGN 2000", credits: 0 },
    { id: 2, name: "Free", audience: "user", price: "NGN 0", credits: 0 },
    { id: 3, name: "Vendor Free", audience: "vendor", price: "NGN 0", credits: 0 },
    { id: 4, name: "Pro", audience: "user", price: "NGN 5000", credits: 0 },
    { id: 5, name: "Vendor Pro", audience: "vendor", price: "NGN 10000", credits: 0 },
  ];

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end border-b border-slate-100 dark:border-slate-800 pb-4">
        <div>
          <h2 className="text-3xl font-black tracking-tight">Plans</h2>
          <p className="text-slate-500 mt-1">Manage your platform plans and overview.</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-red-500 bg-red-50 dark:bg-red-900/20 px-3 py-1.5 rounded-full border border-red-100 dark:border-red-900/30">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
          </span>
          Admin Access
        </div>
      </div>

      <Card className="rounded-[2rem] border-none shadow-sm overflow-hidden">
        <div className="p-8 pb-4">
          <h3 className="font-bold text-lg">Create New Plan</h3>
        </div>
        <CardContent className="p-8 pt-0 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label>Plan Name</Label>
              <Input value={planName} onChange={(e) => setPlanName(e.target.value)} placeholder="e.g. Basic Monthly" />
              <p className="text-xs text-slate-500">Public name of the subscription plan</p>
            </div>
            <div className="space-y-2">
              <Label>Tier Level</Label>
              <select 
                value={tierLevel}
                onChange={(e) => setTierLevel(e.target.value)}
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option>Basic</option>
                <option>Pro</option>
                <option>Premium</option>
              </select>
              <p className="text-xs text-slate-500">Service tier for feature access</p>
            </div>
            <div className="space-y-2">
              <Label>Target Audience</Label>
              <select 
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option>Regular User</option>
                <option>Vendor</option>
              </select>
              <p className="text-xs text-slate-500">Who can subscribe to this plan</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label>Price (NGN)</Label>
              <Input type="number" value={price} onChange={(e) => setPrice(e.target.value)} />
              <p className="text-xs text-slate-500">Monthly billing amount in Naira</p>
            </div>
            <div className="space-y-2">
              <Label>Credit Allowance</Label>
              <Input type="number" value={creditAllowance} onChange={(e) => setCreditAllowance(e.target.value)} />
              <p className="text-xs text-slate-500">Credits provided per month/refresh</p>
            </div>
            <div className="space-y-2">
              <Label>Plan Description</Label>
              <Input value={planDescription} onChange={(e) => setPlanDescription(e.target.value)} placeholder="Features, benefits..." />
              <p className="text-xs text-slate-500">Short summary of plan features</p>
            </div>
          </div>
          
          <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-8">Create Plan</Button>
        </CardContent>
      </Card>

      <Card className="rounded-[2rem] border-none shadow-sm overflow-hidden">
        <div className="p-8 pb-4">
          <h3 className="font-bold text-lg">Existing Plans ({existingPlans.length})</h3>
        </div>
        <CardContent className="p-8 pt-0 space-y-4">
          {existingPlans.map(plan => (
            <div key={plan.id} className="p-4 border border-slate-100 dark:border-slate-800 rounded-2xl flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/20">
              <div>
                <h4 className="font-bold">{plan.name}</h4>
                <p className="text-sm text-slate-500">{plan.name.toLowerCase()} - {plan.audience} | {plan.price} | {plan.credits} credits</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="rounded-xl border-slate-200">Edit</Button>
                <Button variant="destructive" className="rounded-xl">Delete</Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
      
    </div>
  );
}

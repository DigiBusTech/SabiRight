import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { testSabiUnifyConnection } from "@/app/actions/sabiUnify";

export function SabiUnifySettings() {
  const { profile } = useAuth();
  const [apiKey, setApiKey] = useState("");
  const [endpointId, setEndpointId] = useState("");
  const [modelName, setModelName] = useState("");
  const [loading, setLoading] = useState(false);
  const [testLoading, setTestLoading] = useState(false);

  useEffect(() => {
    if (profile) {
      fetchSettings();
    }
  }, [profile]);

  const fetchSettings = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("settings")
      .select("sabi_unify_api_key, sabi_unify_endpoint_id, sabi_unify_model_name")
      .single();

    if (error) {
      console.error("Error fetching settings:", error);
      toast({ title: "Error", description: "Could not fetch Sabi Unify settings." });
    } else if (data) {
      setApiKey(data.sabi_unify_api_key || "");
      setEndpointId(data.sabi_unify_endpoint_id || "g1u4ryxed6afze");
      setModelName(data.sabi_unify_model_name || "sabi-unify-v1");
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setLoading(true);
    const { error } = await supabase
      .from("settings")
      .update({
        sabi_unify_api_key: apiKey,
        sabi_unify_endpoint_id: endpointId,
        sabi_unify_model_name: modelName,
      })
      .eq("id", 1); // Assuming there"s a single row for settings with id 1

    if (error) {
      console.error("Error saving settings:", error);
      toast({ title: "Error", description: "Could not save Sabi Unify settings." });
    } else {
      toast({ title: "Success", description: "Sabi Unify settings saved." });
    }
    setLoading(false);
  };

  const handleConnectionTest = async () => {
    setTestLoading(true);
    const result = await testSabiUnifyConnection();
    if (result.success) {
      toast({ title: "Success", description: result.message });
    } else {
      toast({ title: "Error", description: result.message });
    }
    setTestLoading(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sabi Unify Configuration</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="apiKey">API Key</Label>
          <Input
            id="apiKey"
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            disabled={loading}
          />
        </div>
        <div>
          <Label htmlFor="endpointId">Endpoint ID</Label>
          <Input
            id="endpointId"
            value={endpointId}
            onChange={(e) => setEndpointId(e.target.value)}
            disabled={loading}
          />
        </div>
        <div>
          <Label htmlFor="modelName">Model Name</Label>
          <Input
            id="modelName"
            value={modelName}
            onChange={(e) => setModelName(e.target.value)}
            disabled={loading}
          />
        </div>
        <div className="flex justify-end gap-2">
          <Button onClick={handleConnectionTest} variant="outline" disabled={loading || testLoading}>
            {testLoading ? "Testing..." : "Test Connection"}
          </Button>
          <Button onClick={handleSave} disabled={loading || testLoading}>
            {loading ? "Saving..." : "Save"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

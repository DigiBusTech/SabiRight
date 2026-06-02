import { supabase } from "./supabase";

export async function runSabiUnify(prompt: string) {
  const { data: settings, error: settingsError } = await supabase
    .from("settings")
    .select("sabi_unify_api_key, sabi_unify_endpoint_id, sabi_unify_model_name")
    .single();

  if (settingsError) {
    throw new Error("Could not fetch Sabi Unify settings.");
  }

  const { sabi_unify_api_key, sabi_unify_endpoint_id, sabi_unify_model_name } = settings;

  if (!sabi_unify_api_key || !sabi_unify_endpoint_id || !sabi_unify_model_name) {
    throw new Error("Sabi Unify settings are not configured.");
  }

  const response = await fetch(`https://api.runpod.ai/v2/${sabi_unify_endpoint_id}/runsync`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${sabi_unify_api_key}`,
    },
    body: JSON.stringify({
      input: {
        messages: [{ role: "user", content: prompt }],
        max_tokens: 500,
        temperature: 0.5,
        model: sabi_unify_model_name,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`RunPod API request failed: ${errorText}`);
  }

  const result = await response.json();
  return result;
}

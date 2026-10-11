import crypto from "crypto";
import { supabase } from "./supabaseStorage.js";

export const ANALYTICS_LANGUAGES = [
  "English",
  "Nigerian Pidgin",
  "Hausa",
  "Yoruba",
  "Igbo"
] as const;

export type AnalyticsLanguage = typeof ANALYTICS_LANGUAGES[number];
export type AnalyticsChannel = "web" | "native_app" | "whatsapp" | "telegram";

interface AnalyticsProfile {
  id: string;
  auth_id: string | null;
  channel: string | null;
  gender: string | null;
  dob: string | null;
  state: string | null;
  language: string | null;
}

function isSupportedLanguage(language: string): language is AnalyticsLanguage {
  return ANALYTICS_LANGUAGES.includes(language as AnalyticsLanguage);
}

export function hashAnalyticsVisitorId(channel: AnalyticsChannel, sourceId: string): string {
  const secret = process.env.ANALYTICS_VISITOR_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret) {
    throw new Error("ANALYTICS_VISITOR_SECRET or SUPABASE_SERVICE_ROLE_KEY must be configured");
  }
  return crypto.createHmac("sha256", secret).update(`${channel}\0${sourceId}`).digest("hex");
}

export async function recordAnalyticsEvent(event: {
  channel: AnalyticsChannel;
  eventType: "visit" | "language_interaction";
  visitorId: string;
  language?: string;
}): Promise<boolean> {
  if (event.eventType === "language_interaction" && (!event.language || !isSupportedLanguage(event.language))) {
    throw new Error("A supported language is required for a language interaction");
  }

  const { error } = await supabase.from("analytics_events").insert({
    channel: event.channel,
    event_type: event.eventType,
    visitor_id: event.visitorId,
    language: event.eventType === "language_interaction" ? event.language : null
  });

  if (error?.code === "23505") return false;
  if (error) throw error;
  return true;
}

function emptyChannelCounts(): Record<AnalyticsChannel, number> {
  return { web: 0, native_app: 0, whatsapp: 0, telegram: 0 };
}

function profileChannel(channel: string | null): AnalyticsChannel | null {
  const normalized = channel?.toLowerCase();
  if (normalized === "web" || normalized === "native_app" || normalized === "whatsapp" || normalized === "telegram") {
    return normalized;
  }
  return null;
}

function ageGroup(dob: string | null): string {
  if (!dob) return "Unknown";
  const birthDate = new Date(dob);
  if (Number.isNaN(birthDate.getTime())) return "Unknown";
  const now = new Date();
  let age = now.getUTCFullYear() - birthDate.getUTCFullYear();
  if (
    now.getUTCMonth() < birthDate.getUTCMonth() ||
    (now.getUTCMonth() === birthDate.getUTCMonth() && now.getUTCDate() < birthDate.getUTCDate())
  ) age--;
  if (age < 0 || age > 120) return "Unknown";
  if (age < 18) return "Under 18";
  if (age <= 24) return "18-24";
  if (age <= 34) return "25-34";
  if (age <= 44) return "35-44";
  if (age <= 54) return "45-54";
  return "55+";
}

async function fetchAllPages<T>(
  fetchPage: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>
): Promise<T[]> {
  const rows: T[] = [];
  const pageSize = 1000;
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await fetchPage(from, from + pageSize - 1);
    if (error) throw error;
    const page = data || [];
    rows.push(...page);
    if (page.length < pageSize) return rows;
  }
}

export async function getInnovationAnalytics(startDate: string, endDate: string) {
  const endExclusive = new Date(`${endDate}T00:00:00.000Z`);
  endExclusive.setUTCDate(endExclusive.getUTCDate() + 1);
  const endExclusiveIso = endExclusive.toISOString();

  const [profiles, links, botMessages, events, impactMetrics] = await Promise.all([
    fetchAllPages<AnalyticsProfile>((from, to) =>
      supabase.from("profiles")
        .select("id,auth_id,channel,gender,dob,state,language")
        .order("id")
        .range(from, to)
    ),
    fetchAllPages<{ channel: string; user_id: string }>((from, to) =>
      supabase.from("channel_links")
        .select("channel,user_id")
        .order("channel")
        .order("channel_user_id")
        .range(from, to)
    ),
    fetchAllPages<{ channel: string; channel_user_id: string; received_at: string }>((from, to) =>
      supabase.from("inbound_bot_messages")
        .select("channel,channel_user_id,received_at")
        .gte("received_at", `${startDate}T00:00:00.000Z`)
        .lt("received_at", endExclusiveIso)
        .order("id")
        .range(from, to)
    ),
    fetchAllPages<{
      channel: AnalyticsChannel;
      event_type: "visit" | "language_interaction";
      visitor_id: string;
      language: string | null;
      event_date: string;
    }>((from, to) =>
      supabase.from("analytics_events")
        .select("channel,event_type,visitor_id,language,event_date")
        .gte("event_date", startDate)
        .lte("event_date", endDate)
        .order("id")
        .range(from, to)
    ),
    fetchAllPages<{ metric_key: string; channel: string | null; created_at: string }>((from, to) =>
      supabase.from("impact_metrics")
        .select("metric_key,channel,created_at")
        .gte("created_at", `${startDate}T00:00:00.000Z`)
        .lt("created_at", endExclusiveIso)
        .order("id")
        .range(from, to)
    )
  ]);

  const registeredByChannel = emptyChannelCounts();
  let webRegisteredUsers = 0;
  for (const profile of profiles) {
    const channel = profileChannel(profile.channel);
    if (channel) registeredByChannel[channel]++;
    if (profile.channel?.toLowerCase() === "web" && profile.auth_id) webRegisteredUsers++;
  }

  const linkedUserSets: Record<"whatsapp" | "telegram", Set<string>> = {
    whatsapp: new Set(),
    telegram: new Set()
  };
  const linkedUsers = new Set<string>();
  const linkedAccountCounts: Record<"whatsapp" | "telegram", number> = { whatsapp: 0, telegram: 0 };
  for (const link of links) {
    const channel = link.channel?.toLowerCase();
    if (channel === "whatsapp" || channel === "telegram") {
      linkedAccountCounts[channel]++;
      linkedUserSets[channel].add(link.user_id);
      linkedUsers.add(link.user_id);
    }
  }

  const visitors: Record<AnalyticsChannel, Set<string>> = {
    web: new Set(),
    native_app: new Set(),
    whatsapp: new Set(),
    telegram: new Set()
  };
  const dailyVisits = new Map<string, Record<AnalyticsChannel, Set<string>>>();
  const dailyCounts = (date: string) => {
    let counts = dailyVisits.get(date);
    if (!counts) {
      counts = { web: new Set(), native_app: new Set(), whatsapp: new Set(), telegram: new Set() };
      dailyVisits.set(date, counts);
    }
    return counts;
  };

  for (const event of events) {
    if (event.event_type !== "visit") continue;
    const daily = dailyCounts(event.event_date);
    daily[event.channel].add(event.visitor_id);
    visitors[event.channel].add(event.visitor_id);
  }
  for (const message of botMessages) {
    if (message.channel !== "whatsapp" && message.channel !== "telegram") continue;
    const date = message.received_at.slice(0, 10);
    visitors[message.channel].add(message.channel_user_id);
    dailyCounts(date)[message.channel].add(message.channel_user_id);
  }

  const dailyVisitRows = [...dailyVisits.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, counts]) => ({
      date,
      web: counts.web.size,
      native_app: counts.native_app.size,
      whatsapp: counts.whatsapp.size,
      telegram: counts.telegram.size
    }));

  const languageUserDays = new Map<string, number>();
  const languageChannels = new Map<string, Record<AnalyticsChannel, number>>();
  for (const event of events) {
    if (event.event_type === "language_interaction" && event.language && isSupportedLanguage(event.language)) {
      languageUserDays.set(event.language, (languageUserDays.get(event.language) || 0) + 1);
      let channelCounts = languageChannels.get(event.language);
      if (!channelCounts) {
        channelCounts = emptyChannelCounts();
        languageChannels.set(event.language, channelCounts);
      }
      channelCounts[event.channel]++;
    }
  }
  const preferredProfileLanguages = new Map<string, number>();
  for (const profile of profiles) {
    if (profile.language && isSupportedLanguage(profile.language)) {
      preferredProfileLanguages.set(profile.language, (preferredProfileLanguages.get(profile.language) || 0) + 1);
    }
  }

  const gender = new Map<string, number>();
  const age = new Map<string, number>();
  const states = new Map<string, number>();
  for (const profile of profiles) {
    const rawGender = profile.gender?.trim().toLowerCase();
    const genderValue = rawGender === "male" || rawGender === "m"
      ? "Male"
      : rawGender === "female" || rawGender === "f"
        ? "Female"
        : rawGender === "other"
          ? "Other"
          : "Unknown";
    gender.set(genderValue, (gender.get(genderValue) || 0) + 1);
    const ageValue = ageGroup(profile.dob);
    age.set(ageValue, (age.get(ageValue) || 0) + 1);
    const stateValue = profile.state?.trim() || "Unknown";
    states.set(stateValue, (states.get(stateValue) || 0) + 1);
  }

  const impactMetricCounts = new Map<string, number>();
  const guidanceByChannel = emptyChannelCounts();
  for (const metric of impactMetrics) {
    impactMetricCounts.set(metric.metric_key, (impactMetricCounts.get(metric.metric_key) || 0) + 1);
    if (metric.metric_key === "civic_guidance_delivered") {
      const channel = profileChannel(metric.channel);
      if (channel) guidanceByChannel[channel]++;
    }
  }

  return {
    period: { startDate, endDate },
    accounts: {
      totalProfiles: profiles.length,
      webRegisteredUsers,
      registeredByChannel,
      linkedSocialUsers: linkedUsers.size,
      linkedUsersByChannel: {
        whatsapp: linkedUserSets.whatsapp.size,
        telegram: linkedUserSets.telegram.size
      },
      linkedAccounts: linkedAccountCounts
    },
    visitors: {
      botEvents: botMessages.length,
      byChannel: Object.fromEntries(
        (Object.keys(visitors) as AnalyticsChannel[]).map(channel => [
          channel,
            visitors[channel].size
        ])
      ),
      daily: dailyVisitRows
    },
    languageUsage: [...languageUserDays.entries()].map(([language, userDays]) => ({ language, userDays })),
    languageByChannel: [...languageChannels.entries()].map(([language, counts]) => ({ language, ...counts })),
    preferredLanguages: [...preferredProfileLanguages.entries()].map(([language, users]) => ({ language, users })),
    impact: {
      metrics: [...impactMetricCounts.entries()].map(([metric, count]) => ({ metric, count })),
      guidanceDelivered: impactMetricCounts.get("civic_guidance_delivered") || 0,
      guidanceByChannel
    },
    demographics: {
      gender: [...gender.entries()].map(([name, value]) => ({ name, value })),
      age: [...age.entries()].map(([name, value]) => ({ name, value })),
      states: [...states.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 15)
    }
  };
}

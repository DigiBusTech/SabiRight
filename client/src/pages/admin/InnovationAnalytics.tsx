import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  Clock,
  Download,
  FileText,
  RefreshCw,
  Users
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { supabase } from "@/lib/supabase";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";

type Channel = "web" | "native_app" | "whatsapp" | "telegram";

interface InnovationAnalyticsData {
  period: { startDate: string; endDate: string; hours?: number | null; label?: string };
  accounts: {
    totalProfiles: number;
    webRegisteredUsers: number;
    registeredByChannel: Record<Channel, number>;
    linkedSocialUsers: number;
    linkedUsersByChannel: { whatsapp: number; telegram: number };
    linkedAccounts: { whatsapp: number; telegram: number };
  };
  visitors: {
    botEvents: number;
    byChannel: Record<Channel, number>;
    daily: Array<Record<Channel | "date", string | number>>;
  };
  testingActivity?: {
    filterHours: number | null;
    windowHours: number;
    activeTestingHours: number;
    activePercentage: number;
    totalTestingUsers: number;
    totalInteractions: number;
    peakHour: string;
    peakHourUsers: number;
    hourly: Array<{
      hour: string;
      label: string;
      date: string;
      web: number;
      native_app: number;
      whatsapp: number;
      telegram: number;
      testingUsers: number;
      interactions: number;
    }>;
  };
  languageUsage: Array<{ language: string; userDays: number }>;
  languageByChannel: Array<Record<Channel | "language", string | number>>;
  preferredLanguages: Array<{ language: string; users: number }>;
  impact: {
    metrics: Array<{ metric: string; count: number }>;
    guidanceDelivered: number;
    guidanceByChannel: Record<Channel, number>;
  };
  demographics: {
    gender: Array<{ name: string; value: number }>;
    age: Array<{ name: string; value: number }>;
    states: Array<{ name: string; value: number }>;
  };
}

const channelLabels: Record<Channel, string> = {
  web: "Web",
  native_app: "Native app",
  whatsapp: "WhatsApp",
  telegram: "Telegram"
};

const channelColors: Record<Channel, string> = {
  web: "#2563eb",
  native_app: "#7c3aed",
  whatsapp: "#16a34a",
  telegram: "#0891b2"
};

function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getRangeStart(days: number): string {
  const start = new Date();
  start.setDate(start.getDate() - (days - 1));
  return formatLocalDate(start);
}

function downloadFile(filename: string, content: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function csvCell(value: string | number): string {
  const text = String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

export default function InnovationAnalytics() {
  const [range, setRange] = useState("30");
  const [startDate, setStartDate] = useState(() => getRangeStart(30));
  const [endDate, setEndDate] = useState(() => formatLocalDate(new Date()));
  const [customRange, setCustomRange] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const { toast } = useToast();

  const isHourlyRange = range === "12h" || range === "24h";

  const { data, isLoading, isFetching, error, refetch } = useQuery<InnovationAnalyticsData>({
    queryKey: ["admin-innovation-analytics", startDate, endDate, range],
    queryFn: async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      const params = new URLSearchParams();
      if (range === "12h" || range === "24h") {
        params.set("hours", range.replace("h", ""));
      } else {
        params.set("startDate", startDate);
        params.set("endDate", endDate);
      }
      const response = await fetch(`/api/admin/innovation-analytics?${params}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "Unable to load innovation analytics");
      return result;
    },
    staleTime: 60_000,
    enabled: range === "12h" || range === "24h" || startDate <= endDate
  });

  const accountChartData = useMemo(() => (Object.keys(channelLabels) as Channel[]).map(channel => ({
    name: channelLabels[channel],
    users: data?.accounts.registeredByChannel[channel] || 0
  })), [data]);

  const visitorRows = useMemo(() => (Object.keys(channelLabels) as Channel[]).map(channel => ({
    channel,
    label: channelLabels[channel],
    count: data?.visitors.byChannel[channel] || 0
  })), [data]);

  const applyRange = (value: string) => {
    setRange(value);
    if (value === "custom") {
      setCustomRange(true);
      return;
    }
    setCustomRange(false);
    if (value === "12h" || value === "24h") {
      const start = new Date(Date.now() - (value === "12h" ? 12 : 24) * 3600 * 1000);
      setStartDate(formatLocalDate(start));
      setEndDate(formatLocalDate(new Date()));
    } else if (value !== "all") {
      setStartDate(getRangeStart(Number(value)));
      setEndDate(formatLocalDate(new Date()));
    } else {
      setStartDate(`${new Date().getFullYear() - 10}-01-01`);
      setEndDate(formatLocalDate(new Date()));
    }
  };

  const exportRows = (): Array<Array<string | number>> => {
    if (!data) return [];
    const periodLabel = isHourlyRange
      ? `Last ${range} (Active Testing Window)`
      : `${data.period.startDate} to ${data.period.endDate}`;

    const rows: Array<Array<string | number>> = [
      ["Innovation Analytics"],
      ["Period", periodLabel],
      ...(data.testingActivity ? [
        [],
        ["User testing activity & hours used", ""],
        ["Hours used for testing", `${data.testingActivity.activeTestingHours} of ${data.testingActivity.windowHours} hours (${data.testingActivity.activePercentage}% active)`],
        ["Distinct testing users", data.testingActivity.totalTestingUsers],
        ["Total testing interactions", data.testingActivity.totalInteractions],
        ["Peak testing window", data.testingActivity.peakHour],
        [],
        ["Testing hour", "Web", "Native app", "WhatsApp", "Telegram", "Active testers", "Interactions"],
        ...data.testingActivity.hourly.map(h => [
          h.label,
          h.web,
          h.native_app,
          h.whatsapp,
          h.telegram,
          h.testingUsers,
          h.interactions
        ])
      ] : []),
      [],
      ["Registered profile source", "Count"],
      ...accountChartData.map(row => [row.name, row.users]),
      ["All profiles", data.accounts.totalProfiles],
      ["Authenticated web accounts", data.accounts.webRegisteredUsers],
      ["Distinct linked social users", data.accounts.linkedSocialUsers],
      ["WhatsApp linked identities", data.accounts.linkedAccounts.whatsapp],
      ["Telegram linked identities", data.accounts.linkedAccounts.telegram],
      ["Bot events received", data.visitors.botEvents],
      ["Recorded civic guidance delivery events", data.impact.guidanceDelivered],
      ...data.impact.metrics.map(row => [`Impact metric: ${row.metric}`, row.count]),
      [],
      ["Unique visitors by channel", "Count"],
      ...visitorRows.map(row => [row.label, row.count]),
      [],
      ["Language", "Language user-days (distinct visitors per day)"],
      ...data.languageUsage.map(row => [row.language, row.userDays]),
      ["Language", "Web", "Native app", "WhatsApp", "Telegram"],
      ...data.languageByChannel.map(row => [
        String(row.language),
        Number(row.web),
        Number(row.native_app),
        Number(row.whatsapp),
        Number(row.telegram)
      ]),
      [],
      ["Preferred profile language", "Profiles"],
      ...data.preferredLanguages.map(row => [row.language, row.users]),
      [],
      ["Gender", "Profiles"],
      ...data.demographics.gender.map(row => [row.name, row.value]),
      [],
      ["Age group", "Profiles"],
      ...data.demographics.age.map(row => [row.name, row.value]),
      [],
      ["Profile state (may include default profile values)", "Profiles"],
      ...data.demographics.states.map(row => [row.name, row.value]),
      [],
      ["Date", "Web", "Native app", "WhatsApp", "Telegram"],
      ...data.visitors.daily.map(row => [
        String(row.date),
        Number(row.web),
        Number(row.native_app),
        Number(row.whatsapp),
        Number(row.telegram)
      ])
    ];
    return rows;
  };

  const exportCsv = () => {
    const csv = exportRows().map(row => row.map(csvCell).join(",")).join("\r\n");
    const filename = isHourlyRange
      ? `sabiright-innovation-analytics-past-${range}-testing.csv`
      : `sabiright-innovation-analytics-${startDate}-to-${endDate}.csv`;
    downloadFile(filename, `\uFEFF${csv}`, "text/csv;charset=utf-8");
  };

  const exportPdf = async () => {
    if (!data) return;
    setIsExportingPdf(true);
    setExportError(null);
    try {
      const [{ jsPDF }, { default: autoTable }, html2canvasModule] = await Promise.all([
        import("jspdf"),
        import("jspdf-autotable"),
        import("html2canvas-pro")
      ]);
      const html2canvas = html2canvasModule.default || html2canvasModule;

      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
      });

      const marginX = 12;
      const printableWidth = 210 - marginX * 2; // 186 mm
      const pageHeight = 297;
      const bottomMargin = 16;
      const maxPageY = pageHeight - bottomMargin; // 281 mm

      const drawHeader = (pageDoc: typeof doc) => {
        pageDoc.setFillColor(15, 118, 110);
        pageDoc.rect(marginX, 8, printableWidth, 1.2, "F");

        pageDoc.setFont("helvetica", "bold");
        pageDoc.setFontSize(8.5);
        pageDoc.setTextColor(30, 41, 59);
        pageDoc.text("SabiRight Innovation Analytics Report", marginX, 13);

        pageDoc.setFont("helvetica", "normal");
        pageDoc.setFontSize(8);
        pageDoc.setTextColor(100, 116, 139);
        pageDoc.text("Sabi AI Technologies Ltd", 210 - marginX, 13, { align: "right" });
      };

      drawHeader(doc);

      let currentY = 18;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.setTextColor(15, 23, 42);
      doc.text("Innovation Analytics & Channel Reach", marginX, currentY + 3);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(71, 85, 105);
      doc.text(
        "Multi-channel reach, registered user attributions, local language telemetry, and participant demographics.",
        marginX,
        currentY + 9
      );

      // Meta info banner
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.3);
      doc.roundedRect(marginX, currentY + 12, printableWidth, 9, 1.5, 1.5, "FD");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.setTextColor(15, 118, 110);
      doc.text("ORGANIZATION:", marginX + 3, currentY + 18);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(30, 41, 59);
      doc.text("Sabi AI Technologies Ltd", marginX + 27, currentY + 18);

      doc.setFont("helvetica", "bold");
      doc.setTextColor(15, 118, 110);
      doc.text("PERIOD:", marginX + 75, currentY + 18);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(30, 41, 59);
      const periodDisplay = isHourlyRange
        ? `Last ${range} (Active Testing Window)`
        : `${startDate} to ${endDate} (${range === "custom" ? "Custom" : `Last ${range}d`})`;
      doc.text(periodDisplay, marginX + 89, currentY + 18);

      doc.setFont("helvetica", "bold");
      doc.setTextColor(15, 118, 110);
      doc.text("GENERATED:", marginX + 142, currentY + 18);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(30, 41, 59);
      doc.text(new Date().toLocaleDateString("en-GB"), marginX + 162, currentY + 18);

      currentY += 25;

      const visualSectionIds = [
        ...(data.testingActivity ? ["analytics-section-testing"] : []),
        "analytics-section-overview",
        "analytics-section-audience",
        "analytics-section-languages-demographics",
        "analytics-section-social"
      ];

      await new Promise(resolve => setTimeout(resolve, 100));

      for (const sectionId of visualSectionIds) {
        const element = document.getElementById(sectionId);
        if (!element) continue;

        const canvas = await html2canvas(element, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: "#ffffff",
          windowWidth: 1280,
          onclone: (clonedDoc) => {
            const svgs = clonedDoc.querySelectorAll("svg");
            svgs.forEach((svg) => {
              svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
            });
          }
        });

        const imgData = canvas.toDataURL("image/png");
        const imgHeightMm = (canvas.height / canvas.width) * printableWidth;

        if (currentY + imgHeightMm > maxPageY) {
          doc.addPage();
          drawHeader(doc);
          currentY = 18;
        }

        doc.addImage(imgData, "PNG", marginX, currentY, printableWidth, imgHeightMm, undefined, "FAST");
        currentY += imgHeightMm + 4;
      }

      if (currentY + 22 > maxPageY) {
        doc.addPage();
        drawHeader(doc);
        currentY = 18;
      }

      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.3);
      doc.roundedRect(marginX, currentY, printableWidth, 18, 1.5, 1.5, "FD");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.setTextColor(15, 118, 110);
      doc.text("TELEMETRY & METHODOLOGY NOTES:", marginX + 3, currentY + 5);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(71, 85, 105);
      doc.text(
        "• Visitor metrics employ pseudonymous daily identifiers and exclude administrative endpoints. Offline visits are synchronized on reconnection.",
        marginX + 3,
        currentY + 9.5
      );
      doc.text(
        "• Language metrics measure distinct visitor-language interaction days across channels (Yoruba, Hausa, Igbo, Nigerian Pidgin, English).",
        marginX + 3,
        currentY + 13.5
      );
      doc.text(
        "• Social-channel linked accounts represent distinct SabiRight user accounts authenticated with WhatsApp or Telegram bot identities.",
        marginX + 3,
        currentY + 17
      );

      // Appendix: Granular Tabular Audit Table
      doc.addPage();
      drawHeader(doc);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.setTextColor(15, 23, 42);
      doc.text("Appendix: Granular Audit Records & Numerical Breakdown", marginX, 23);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text(
        "Complete tabular breakdown of platform telemetry, visitor distributions, languages, and participant demographics.",
        marginX,
        28
      );

      const tableRows = exportRows()
        .slice(2)
        .filter(row => row.length > 0)
        .map(row => [String(row[0] ?? ""), row.slice(1).map(String).join(" | ")]);

      autoTable(doc, {
        head: [["Metric / Dimension", "Value / Aggregated Count"]],
        body: tableRows,
        startY: 32,
        margin: { left: marginX, right: marginX, bottom: bottomMargin },
        theme: "striped",
        headStyles: {
          fillColor: [15, 118, 110],
          textColor: [255, 255, 255],
          fontSize: 8.5,
          fontStyle: "bold",
          cellPadding: 2.5
        },
        bodyStyles: {
          fontSize: 7.5,
          textColor: [30, 41, 59],
          cellPadding: 2
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252]
        },
        columnStyles: {
          0: { cellWidth: 95 },
          1: { cellWidth: 91 }
        },
        didDrawPage: () => {
          drawHeader(doc);
        }
      });

      const totalPages = doc.getNumberOfPages();
      for (let p = 1; p <= totalPages; p++) {
        doc.setPage(p);
        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.3);
        doc.line(marginX, 287, 210 - marginX, 287);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(7);
        doc.setTextColor(148, 163, 184);
        const footerPeriod = isHourlyRange ? `Last ${range}` : `${startDate} to ${endDate}`;
        doc.text(
          `SabiRight Innovation Analytics  •  Period: ${footerPeriod}  •  Sabi AI Technologies Ltd`,
          marginX,
          291.5
        );
        doc.text(
          `Page ${p} of ${totalPages}`,
          210 - marginX,
          291.5,
          { align: "right" }
        );
      }

      const pdfFilename = isHourlyRange
        ? `sabiright-innovation-analytics-past-${range}-testing.pdf`
        : `sabiright-innovation-analytics-${startDate}-to-${endDate}.pdf`;
      doc.save(pdfFilename);
      toast({
        title: "PDF Export Complete",
        description: `Visual analytics report downloaded for ${startDate} to ${endDate}.`
      });
    } catch (exportFailure) {
      console.error("[Innovation Analytics] PDF export failed:", exportFailure);
      const errMsg = exportFailure instanceof Error ? exportFailure.message : "PDF export failed";
      setExportError(errMsg);
      toast({
        title: "PDF Export Failed",
        description: errMsg,
        variant: "destructive"
      });
    } finally {
      setIsExportingPdf(false);
    }
  };

  const totalChannelVisitors = visitorRows.reduce((total, row) => total + row.count, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-xl font-bold">Innovation Analytics</h2>
          <p className="text-sm text-slate-500">
            Channel reach, registered accounts, language usage, and participant demographics.
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <div className="w-40">
            <Select value={range} onValueChange={applyRange}>
              <SelectTrigger aria-label="Reporting period"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="12h">Last 12 hours</SelectItem>
                <SelectItem value="24h">Last 24 hours</SelectItem>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
                <SelectItem value="365">Last year</SelectItem>
                <SelectItem value="all">Last 10 years</SelectItem>
                <SelectItem value="custom">Custom range</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {customRange && (
            <>
              <Input aria-label="Start date" className="w-40" type="date" value={startDate} onChange={event => setStartDate(event.target.value)} />
              <Input aria-label="End date" className="w-40" type="date" value={endDate} onChange={event => setEndDate(event.target.value)} />
            </>
          )}
          <Button variant="outline" onClick={() => void refetch()} disabled={isFetching}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? "animate-spin" : ""}`} /> Refresh
          </Button>
          <Button variant="outline" onClick={exportCsv} disabled={!data}>
            <Download className="mr-2 h-4 w-4" /> CSV
          </Button>
          <Button onClick={() => void exportPdf()} disabled={!data || isExportingPdf}>
            {isExportingPdf ? (
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <FileText className="mr-2 h-4 w-4" />
            )}
            {isExportingPdf ? "Generating PDF…" : "PDF"}
          </Button>
        </div>
      </div>
      {exportError && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">PDF export failed: {exportError}</div>}

      {customRange && startDate > endDate && (
        <div role="alert" className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          The start date must be on or before the end date.
        </div>
      )}
      {error && (
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {(error as Error).message}. Confirm the innovation analytics Supabase migration has been applied.
        </div>
      )}
      {isLoading && <div className="p-8 text-center text-sm text-slate-500">Loading innovation analytics…</div>}
      {data && (
        <div id="analytics-report-container" className="space-y-6">
          {data.testingActivity && (
            <Card id="analytics-section-testing" className="border-teal-100 bg-gradient-to-br from-teal-50/40 via-white to-slate-50/50">
              <CardHeader className="pb-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2">
                    <div className="rounded-lg bg-teal-600/10 p-2 text-teal-700">
                      <Clock className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-base text-slate-900">User Testing Activity & Hours Used</CardTitle>
                      <p className="text-xs text-slate-500">
                        Hours used to get participants testing, active participant counts, and peak testing telemetry.
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="w-fit border-teal-200 bg-teal-50 font-medium text-teal-800">
                    {data.period.hours ? `Filter: Past ${data.period.hours} Hours` : "Recent 24 Hours Activity"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-lg border bg-white p-3 shadow-xs">
                    <p className="text-xs font-medium text-slate-500">Hours Used for Testing</p>
                    <p className="mt-1 text-2xl font-bold text-teal-700">
                      {data.testingActivity.activeTestingHours} <span className="text-sm font-normal text-slate-500">/ {data.testingActivity.windowHours} hrs</span>
                    </p>
                    <p className="mt-1 text-xs text-slate-500">{data.testingActivity.activePercentage}% of window with active testing</p>
                  </div>
                  <div className="rounded-lg border bg-white p-3 shadow-xs">
                    <p className="text-xs font-medium text-slate-500">Active Testing Users</p>
                    <p className="mt-1 text-2xl font-bold text-slate-900">
                      {data.testingActivity.totalTestingUsers.toLocaleString()}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">Distinct testers across all channels</p>
                  </div>
                  <div className="rounded-lg border bg-white p-3 shadow-xs">
                    <p className="text-xs font-medium text-slate-500">Total Test Interactions</p>
                    <p className="mt-1 text-2xl font-bold text-slate-900">
                      {data.testingActivity.totalInteractions.toLocaleString()}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">Inbound events, visits & civic queries</p>
                  </div>
                  <div className="rounded-lg border bg-white p-3 shadow-xs">
                    <p className="text-xs font-medium text-slate-500">Peak Testing Window</p>
                    <p className="mt-1 truncate text-lg font-bold text-slate-900" title={data.testingActivity.peakHour}>
                      {data.testingActivity.peakHour}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">Highest activity hour</p>
                  </div>
                </div>

                <ChartCard title={`Hourly testing activity by channel (${data.testingActivity.windowHours}-hour window)`}>
                  <BarChart data={data.testingActivity.hourly}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="hour" minTickGap={10} />
                    <YAxis allowDecimals={false} />
                    <Tooltip labelFormatter={(_, payload) => payload?.[0]?.payload?.label} />
                    <Legend />
                    {(Object.keys(channelLabels) as Channel[]).map(channel => (
                      <Bar key={channel} dataKey={channel} name={channelLabels[channel]} fill={channelColors[channel]} stackId="hourly-testing" />
                    ))}
                  </BarChart>
                </ChartCard>
              </CardContent>
            </Card>
          )}

          <div id="analytics-section-overview" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <MetricCard title="Registered profiles" value={data.accounts.totalProfiles} description="All profiles, across source channels" icon={<Users className="h-4 w-4 text-blue-600" />} />
            <MetricCard title="Authenticated web users" value={data.accounts.webRegisteredUsers} description="Web-source profiles with an auth account" icon={<Users className="h-4 w-4 text-violet-600" />} />
            <MetricCard title="Linked social users" value={data.accounts.linkedSocialUsers} description="Distinct SabiRight accounts linked to bots" icon={<Users className="h-4 w-4 text-green-600" />} />
            <MetricCard title="Channel visitors" value={totalChannelVisitors} description="Sum of unique visitors per channel; users may use multiple channels" icon={<Activity className="h-4 w-4 text-cyan-600" />} />
            <MetricCard title="Bot events received" value={data.visitors.botEvents} description="WhatsApp and Telegram inbound events in this period" icon={<Activity className="h-4 w-4 text-teal-600" />} />
            <MetricCard title="Civic guidance delivered" value={data.impact.guidanceDelivered} description="Recorded impact-metric entries in this period" icon={<Activity className="h-4 w-4 text-amber-600" />} />
          </div>

          <div id="analytics-section-audience">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Audience by channel</CardTitle>
                <p className="text-sm text-slate-500">
                  Profile source is a registration attribution; bot visitor counts come from inbound message logs for the selected period.
                </p>
                <p className="text-xs text-slate-500">
                  Native-app visits and language interactions are counted separately; existing account records do not distinguish native-app sign-ups from web sign-ups.
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  {visitorRows.map(row => (
                    <div key={row.channel} className="flex items-center justify-between rounded-lg border p-3">
                      <div>
                        <p className="font-medium">{row.label}</p>
                        <p className="text-xs text-slate-500">Unique visitors in period</p>
                      </div>
                      <Badge variant="secondary">{row.count.toLocaleString()}</Badge>
                    </div>
                  ))}
                </div>
                <div className="grid gap-6 lg:grid-cols-2">
                  <ChartCard title="Registered profile source">
                    <BarChart data={accountChartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Bar dataKey="users" name="Profiles" fill="#2563eb" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ChartCard>
                  <ChartCard title="Daily visitors by channel">
                    <BarChart data={data.visitors.daily}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="date" tickFormatter={value => String(value).slice(5)} minTickGap={20} />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Legend />
                      {(Object.keys(channelLabels) as Channel[]).map(channel => (
                        <Bar key={channel} dataKey={channel} name={channelLabels[channel]} fill={channelColors[channel]} stackId="visitors" />
                      ))}
                    </BarChart>
                  </ChartCard>
                </div>
              </CardContent>
            </Card>
          </div>

          <div id="analytics-section-languages-demographics" className="grid gap-6 xl:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Languages used in conversations</CardTitle>
                <p className="text-sm text-slate-500">Distinct visitor-language days, not raw message totals.</p>
              </CardHeader>
              <CardContent>
                {data.languageUsage.length ? (
                  <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data.languageByChannel}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="language" />
                        <YAxis allowDecimals={false} />
                        <Tooltip />
                        <Legend />
                        {(Object.keys(channelLabels) as Channel[]).map(channel => (
                          <Bar key={channel} dataKey={channel} name={channelLabels[channel]} stackId="language" fill={channelColors[channel]} />
                        ))}
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : <EmptyChartMessage>No language-interaction events recorded in this period.</EmptyChartMessage>}
                <p className="mt-3 text-xs text-slate-500">
                  Counts are distinct visitor-language days by channel, not raw messages or a model accuracy score. Preferred profile languages are separate and are not treated as languages tested.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Participant demographics</CardTitle>
                <p className="text-sm text-slate-500">All available profile data, with missing values retained as Unknown.</p>
              </CardHeader>
              <CardContent className="grid gap-6 md:grid-cols-2">
                <DemographicChart title="Gender" rows={data.demographics.gender} />
                <DemographicChart title="Age group" rows={data.demographics.age} />
                <div className="md:col-span-2">
                  <DemographicChart title="Recorded profile state (may include default values)" rows={data.demographics.states.slice(0, 10)} />
                </div>
              </CardContent>
            </Card>
          </div>

          <div id="analytics-section-social">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Social-channel links</CardTitle>
                <p className="text-sm text-slate-500">Linked identities and linked account counts are different measures; one user may link both channels.</p>
              </CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-2">
                {(["whatsapp", "telegram"] as const).map(channel => (
                  <div key={channel} className="rounded-lg border p-4">
                    <p className="font-semibold">{channelLabels[channel]}</p>
                    <p className="mt-2 text-sm">{data.accounts.linkedUsersByChannel[channel].toLocaleString()} linked SabiRight accounts</p>
                    <p className="text-sm text-slate-500">{data.accounts.linkedAccounts[channel].toLocaleString()} linked channel identities</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
          <p id="analytics-section-notes" className="text-xs text-slate-500">
            Visitor counts use pseudonymous daily IDs and exclude admin pages. Visits made while offline cannot be recorded; native-app counts include online visits only.
          </p>
        </div>
      )}
    </div>
  );
}

function MetricCard({ title, value, description, icon }: { title: string; value: number; description: string; icon: React.ReactNode }) {
  return (
    <Card>
      <CardContent className="flex items-start justify-between gap-4 p-5">
        <div>
          <p className="text-sm text-slate-500">{title}</p>
          <p className="mt-1 text-2xl font-bold">{value.toLocaleString()}</p>
          <p className="mt-1 text-xs text-slate-500">{description}</p>
        </div>
        <div className="rounded-lg bg-slate-100 p-2">{icon}</div>
      </CardContent>
    </Card>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-sm font-medium">{title}</p>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">{children}</ResponsiveContainer>
      </div>
    </div>
  );
}

function DemographicChart({ title, rows }: { title: string; rows: Array<{ name: string; value: number }> }) {
  return (
    <div>
      <p className="mb-2 text-sm font-medium">{title}</p>
      {rows.length ? (
        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={rows} layout="vertical" margin={{ left: 8, right: 16 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" allowDecimals={false} />
              <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="value" name="Profiles" fill="#0f766e" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : <EmptyChartMessage>No profile data is available.</EmptyChartMessage>}
    </div>
  );
}

function EmptyChartMessage({ children }: { children: React.ReactNode }) {
  return <div className="flex h-56 items-center justify-center rounded-lg border border-dashed text-center text-sm text-slate-500">{children}</div>;
}

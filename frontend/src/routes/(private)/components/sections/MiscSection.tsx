import { createSignal, createMemo, lazy, For, Suspense } from "solid-js";
import { Button } from "~/components/atoms/Button";
import { Icon } from "~/components/atoms/Icon";
import { Input } from "~/components/atoms/Input";
import { Chip } from "~/components/atoms/Chip";
import { Slider } from "~/components/atoms/Slider";
import { Tabs, TabList, Tab, TabPanel } from "~/components/molecules/Tabs/Tabs";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "~/components/molecules/Accordion/Accordion";
import { Breadcrumbs } from "~/components/molecules/Breadcrumbs/Breadcrumbs";
import { Pagination } from "~/components/molecules/Pagination/Pagination";
import { Dropzone } from "~/components/molecules/Dropzone/Dropzone";
import { SortableList, type SortableItem } from "~/components/molecules/SortableList/SortableList";
const Canvas3D = lazy(() => import("~/components/molecules/Canvas3D/Canvas3D").then(m => ({ default: m.Canvas3D })));
const VideoRecorder = lazy(() => import("~/components/molecules/VideoRecorder/VideoRecorder").then(m => ({ default: m.VideoRecorder })));
import { BarGraph } from "~/components/molecules/Charts/BarGraph";
import { LineGraph } from "~/components/molecules/Charts/LineGraph";
import { ScatterGraph } from "~/components/molecules/Charts/ScatterGraph";
import { HeatmapGraph } from "~/components/molecules/Charts/HeatmapGraph";
import { RadarGraph } from "~/components/molecules/Charts/RadarGraph";
import { ScatterQuadrant } from "~/components/molecules/Charts/ScatterQuadrant";
import { MatrixGraph } from "~/components/molecules/Charts/MatrixGraph";
import { HexbinChart } from "~/components/molecules/Charts/HexbinChart";
import { StackedArea } from "~/components/molecules/Charts/StackedArea";
import { ActivityGrid } from "~/components/molecules/Charts/ActivityGrid";
import { TimelineGraph } from "~/components/molecules/Charts/TimelineGraph";
import { AreaComparison } from "~/components/molecules/Charts/AreaComparison";
import { StepGraph } from "~/components/molecules/Charts/StepGraph";
import { BoxGraph } from "~/components/molecules/Charts/BoxGraph";
import { TreeGraph } from "~/components/molecules/Charts/TreeGraph";
import { BarRace } from "~/components/molecules/Charts/BarRace";
import { GeoPlot } from "~/components/molecules/GeoPlot/GeoPlot";
import { Link } from "~/components/atoms/Link";
import { Select, SelectItem } from "~/components/molecules/Select/Select";

// =============================================================================
// MOCK DATA (hoisted, never re-evaluated)
// =============================================================================

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const pipelineData = months.flatMap((month, i) => [
  { month, monthNum: i, metric: "Closed Deals", value: 12 + Math.floor(i * 3.5 + Math.sin(i * 0.8) * 8 + 3) },
  { month, monthNum: i, metric: "Leads", value: 45 + Math.floor(i * 6 + Math.cos(i * 0.5) * 15 + 5) },
]);

const sectorData = [
  { sector: "Tech", count: 120 },
  { sector: "Finance", count: 90 },
  { sector: "Health", count: 60 },
  { sector: "Retail", count: 40 },
  { sector: "Other", count: 30 },
];

const partnerLocations = [
  { name: "Alpha Co", lon: -71.1167, lat: 42.377, value: 23731, secondary: 8900, rate: 97 },
  { name: "Beta Inc", lon: -71.0942, lat: 42.3601, value: 11934, secondary: 5200, rate: 98 },
  { name: "Gamma LLC", lon: -122.1697, lat: 37.4275, value: 15157, secondary: 6500, rate: 98 },
  { name: "Delta Corp", lon: -72.9223, lat: 41.3163, value: 14567, secondary: 6100, rate: 96 },
  { name: "Epsilon Ltd", lon: -74.6551, lat: 40.3439, value: 8813, secondary: 3400, rate: 96 },
  { name: "Zeta Group", lon: -73.9626, lat: 40.8075, value: 33413, secondary: 12000, rate: 95 },
  { name: "Eta Labs", lon: -78.9382, lat: 36.0014, value: 16780, secondary: 6800, rate: 96 },
  { name: "Theta IO", lon: -79.0469, lat: 35.9049, value: 30092, secondary: 12500, rate: 93 },
  { name: "Iota Sys", lon: -84.3963, lat: 33.7756, value: 36489, secondary: 18000, rate: 96 },
  { name: "Kappa Dev", lon: -122.2585, lat: 37.8719, value: 42327, secondary: 18000, rate: 95 },
  { name: "Lambda Co", lon: -118.4452, lat: 34.0689, value: 44589, secondary: 19000, rate: 94 },
  { name: "Mu Inc", lon: -87.5987, lat: 41.7886, value: 17834, secondary: 7800, rate: 97 },
  { name: "Nu LLC", lon: -87.6753, lat: 42.0565, value: 22603, secondary: 9500, rate: 96 },
  { name: "Xi Corp", lon: -83.7382, lat: 42.278, value: 47907, secondary: 21000, rate: 95 },
  { name: "Omicron Ltd", lon: -97.7431, lat: 30.2849, value: 51832, secondary: 23000, rate: 93 },
  { name: "Pi Group", lon: -82.349, lat: 29.6465, value: 53372, secondary: 21000, rate: 91 },
  { name: "Rho Labs", lon: -83.0125, lat: 40.0067, value: 61369, secondary: 25000, rate: 90 },
  { name: "Sigma IO", lon: -122.3035, lat: 47.6553, value: 48682, secondary: 21000, rate: 92 },
  { name: "Tau Sys", lon: -95.4018, lat: 29.7174, value: 7536, secondary: 3500, rate: 95 },
  { name: "Upsilon Co", lon: -86.8027, lat: 36.1447, value: 13537, secondary: 5800, rate: 95 },
  { name: "Phi Inc", lon: -1.2577, lat: 51.752, value: 24299, secondary: 11000, rate: 98 },
  { name: "Chi LLC", lon: 0.1149, lat: 52.2053, value: 21656, secondary: 10500, rate: 98 },
  { name: "Psi Corp", lon: 8.5476, lat: 47.3763, value: 22000, secondary: 10000, rate: 97 },
  { name: "Omega Ltd", lon: 139.762, lat: 35.7127, value: 28000, secondary: 12000, rate: 96 },
  { name: "Apex Group", lon: 103.7764, lat: 1.2966, value: 30000, secondary: 14500, rate: 96 },
  { name: "Nova Labs", lon: -79.3948, lat: 43.6629, value: 62000, secondary: 25000, rate: 94 },
  { name: "Pulse IO", lon: 144.9612, lat: -37.7964, value: 52000, secondary: 20000, rate: 92 },
  { name: "Vertex Sys", lon: 151.1931, lat: -33.8886, value: 73000, secondary: 28000, rate: 91 },
];

// Skill Growth: 24-week cohort (long format for multi-line)
const skillGrowthData = Array.from({ length: 24 }, (_, i) => {
  const week = i + 1;
  return [
    { week, skill: "Technical", score: 15 + week * 3.2 + Math.sin(week * 0.4) * 8 },
    { week, skill: "Soft Skills", score: 20 + week * 2.1 + Math.cos(week * 0.3) * 5 },
    { week, skill: "Industry", score: 10 + week * 2.8 + Math.sin(week * 0.5) * 6 },
  ];
}).flat();

// Scatter: Revenue vs Performance Score
const scatterData = Array.from({ length: 80 }, () => {
  const segment = Math.random() > 0.6 ? "Tech" : Math.random() > 0.5 ? "Biz" : "Art";
  const base = segment === "Tech" ? 90 : segment === "Biz" ? 75 : 55;
  const score = 2.8 + Math.random() * 1.2;
  return { score, revenue: base + (score - 2.5) * 20 + (Math.random() - 0.5) * 15, segment };
});

// Heatmap: Task completion over a quarter
const heatmapData = Array.from({ length: 91 }, (_, i) => {
  const date = new Date();
  date.setDate(date.getDate() - (90 - i));
  return { date, value: Math.floor(Math.random() * 12) + (date.getDay() === 0 || date.getDay() === 6 ? 0 : Math.floor(Math.random() * 8)) };
});

// Radar: Hard skills
const hardSkills = [
  { key: "Technical", value: 85 }, { key: "Problem Solving", value: 95 },
  { key: "Cloud Infra", value: 78 }, { key: "Security", value: 82 },
  { key: "Data Science", value: 75 }, { key: "Architecture", value: 82 },
];

// Quadrant: Performance validation
const quadrantData = Array.from({ length: 40 }, (_, i) => ({
  name: `Entity ${i + 1}`, velocity: 2 + Math.random() * 8, quality: 3 + Math.random() * 2,
}));

// Matrix: Skill correlation
const skills = ["React", "Python", "SQL", "Design", "Sales"];
const matrixData = skills.flatMap((s1) =>
  skills.map((s2) => ({ skillA: s1, skillB: s2, correlation: s1 === s2 ? 10 : Math.floor(Math.random() * 8) }))
);

// Honeycomb: Regional coverage
const honeycombData = partnerLocations.map((loc) => ({ lon: loc.lon, lat: loc.lat, weight: loc.value / 1000 }));

// Supply chain: Conversion pipeline
const supplyData = months.flatMap((month, i) => [
  { month, i, stage: "Lead", value: 200 + i * 15 },
  { month, i, stage: "Qualified", value: 140 + i * 12 },
  { month, i, stage: "Proposal", value: 90 + i * 10 },
  { month, i, stage: "Closed", value: 40 + i * 8 },
]);

// Rhythm: Work punch card
const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const rhythmData = days.flatMap((day) =>
  Array.from({ length: 24 }, (_, hour) => ({
    day, hour, count: Math.floor(Math.random() * (hour > 8 && hour < 20 ? 12 : 4)),
  }))
);

// Timeline: Project gantt
const timelineData = [
  { name: "Marketing SEO", start: new Date(2025, 0, 5), end: new Date(2025, 1, 15), status: "Active" },
  { name: "Logo Design", start: new Date(2025, 0, 10), end: new Date(2025, 0, 25), status: "Completed" },
  { name: "CRM Integration", start: new Date(2025, 1, 1), end: new Date(2025, 2, 20), status: "Active" },
  { name: "Sales Deck", start: new Date(2025, 0, 20), end: new Date(2025, 1, 10), status: "Active" },
];

// Difference: Skill gap
const gapData = Array.from({ length: 20 }, (_, i) => ({
  i, demand: 50 + Math.sin(i * 0.5) * 30 + Math.random() * 10, supply: 40 + Math.cos(i * 0.5) * 20 + Math.random() * 10,
}));

// Step: Task load
const stepData = Array.from({ length: 30 }, (_, i) => ({ day: i + 1, load: 10 + Math.floor(Math.random() * 5) * 5 }));

// Box: Rating distribution
const boxData = ["Tech", "Marketing", "Sales", "Design"].flatMap((dept) =>
  Array.from({ length: 50 }, () => ({ dept, rating: 3 + Math.random() * 2 }))
);

// Tree: Network hierarchy
const treeData = [
  { id: "Golid/Alpha Co/Marketing/Team A" }, { id: "Golid/Alpha Co/Marketing/Team B" },
  { id: "Golid/Alpha Co/Design/Team C" }, { id: "Golid/Beta Inc/Tech/Team D" },
  { id: "Golid/Beta Inc/Tech/Team E" }, { id: "Golid/Beta Inc/Sales/Team F" },
  { id: "Golid/Gamma LLC/Tech/Team G" },
];

// Race: Organization growth
const orgNames = ["Alpha Co", "Beta Inc", "Gamma LLC", "Delta Corp", "Epsilon Ltd", "Zeta Group", "Eta Labs", "Theta IO", "Iota Sys", "Kappa Dev"];
const raceData: Record<string, unknown>[] = [];
const orgProfiles = orgNames.map((name) => ({
  name, currentValue: 50 + Math.random() * 50, momentum: 0.2 + Math.random() * 0.8,
  volatility: 0.1 + Math.random() * 0.2, surgeWeek: Math.floor(Math.random() * 52),
}));
for (let w = 0; w < 52; w++) {
  const date = new Date(2024, 0, 1 + w * 7);
  const weekStr = date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  orgProfiles.forEach((org) => {
    let growth = (1 + Math.random() * 4) * org.momentum;
    if (w === org.surgeWeek) growth += 15 + Math.random() * 10;
    const month = date.getMonth();
    if (month === 4 || month === 11) growth += Math.random() * 3;
    org.currentValue += growth;
    raceData.push({ date: weekStr, name: org.name, value: Math.floor(org.currentValue) });
  });
}

// Dynamic Dashboard: Analytics with dropdown filter
const orgOptions = [
  { value: "Alpha Co", label: "Alpha Co" },
  { value: "Beta Inc", label: "Beta Inc" },
  { value: "Gamma LLC", label: "Gamma LLC" },
];

const dynamicDashboardData = [
  { org: "Alpha Co", sector: "Tech", count: 45, month: "Jan", value: 12 },
  { org: "Alpha Co", sector: "Design", count: 30, month: "Feb", value: 15 },
  { org: "Alpha Co", sector: "Health", count: 25, month: "Mar", value: 18 },
  { org: "Alpha Co", sector: "Retail", count: 15, month: "Apr", value: 25 },
  { org: "Alpha Co", sector: "Other", count: 10, month: "May", value: 35 },
  { org: "Beta Inc", sector: "Tech", count: 60, month: "Jan", value: 22 },
  { org: "Beta Inc", sector: "Design", count: 15, month: "Feb", value: 25 },
  { org: "Beta Inc", sector: "Health", count: 45, month: "Mar", value: 28 },
  { org: "Beta Inc", sector: "Retail", count: 35, month: "Apr", value: 32 },
  { org: "Beta Inc", sector: "Other", count: 20, month: "May", value: 38 },
  { org: "Gamma LLC", sector: "Tech", count: 80, month: "Jan", value: 35 },
  { org: "Gamma LLC", sector: "Design", count: 10, month: "Feb", value: 32 },
  { org: "Gamma LLC", sector: "Health", count: 15, month: "Mar", value: 40 },
  { org: "Gamma LLC", sector: "Retail", count: 5, month: "Apr", value: 45 },
  { org: "Gamma LLC", sector: "Other", count: 12, month: "May", value: 55 },
];

// =============================================================================
// COMPONENT
// =============================================================================

export function MiscSection() {
  // Tabs
  const [activeTab, setActiveTab] = createSignal("telemetry");

  // Accordion
  const [accordionValue, setAccordionValue] = createSignal<string[]>(["panel-1"]);
  const [singleAccordionValue, setSingleAccordionValue] = createSignal<string | undefined>("panel-2");

  // Pagination
  const [paginationPage, setPaginationPage] = createSignal(1);

  // Slider (accordion demo)
  const [sliderValue, setSliderValue] = createSignal(50);

  // Dynamic dashboard
  const [selectedOrg, setSelectedOrg] = createSignal("Alpha Co");
  const filteredDashboardData = createMemo(() =>
    dynamicDashboardData.filter((d) => d.org === selectedOrg())
  );

  // Sortable list
  const [sortMode, setSortMode] = createSignal<"insert" | "swap">("insert");
  const [sortableItems, setSortableItems] = createSignal<SortableItem[]>([
    { id: 1, title: "Episode I - The Phantom Menace" },
    { id: 2, title: "Episode II - Attack of the Clones" },
    { id: 3, title: "Episode III - Revenge of the Sith" },
    { id: 4, title: "Episode IV - A New Hope" },
    { id: 5, title: "Episode V - The Empire Strikes Back" },
    { id: 6, title: "Episode VI - Return of the Jedi" },
    { id: 7, title: "Episode VII - The Force Awakens" },
    { id: 8, title: "Episode VIII - The Last Jedi" },
    { id: 9, title: "Episode IX - The Rise of Skywalker" },
  ]);

  return (
    <section class="mb-12 space-y-6">
      <h2 class="text-2xl font-semibold mb-6 border-b border-border pb-2 text-foreground">
        Misc
      </h2>

      {/* ================================================================
          1. TABS + DROPZONE (2-column)
          ================================================================ */}
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-x-10 gap-y-6 items-stretch">
        {/* Tabs */}
        <div class="space-y-3 flex flex-col">
          <h3 class="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-70">
            Management Tabs
          </h3>
          <div class="bg-foreground/[0.005] dark:bg-foreground/[0.02] p-8 rounded-2xl border border-foreground/10 shadow-sm flex-grow flex flex-col">
            <Tabs activeTab={activeTab()} onTabChange={setActiveTab}>
              <TabList>
                <Tab name="telemetry">
                  <Icon name="analytics" size={16} />
                  Analytics
                </Tab>
                <Tab name="diagnostics">
                  <Icon name="troubleshoot" size={16} />
                  Pipeline
                </Tab>
                <Tab name="archives" success>
                  <Icon name="inventory_2" size={16} />
                  Archive
                </Tab>
                <Tab name="settings">
                  <Icon name="settings" size={16} />
                  Settings
                </Tab>
                <Tab name="restricted" disabled>
                  <Icon name="lock" size={16} />
                  Admin Only
                </Tab>
              </TabList>

              <TabPanel name="telemetry" class="mt-8 p-6 rounded-xl bg-foreground/[0.01] border border-foreground/[0.03] flex-grow flex items-center justify-center italic text-muted-foreground min-h-[200px]">
                Real-time analytics stream...
              </TabPanel>
              <TabPanel name="diagnostics" class="mt-8 p-6 rounded-xl bg-foreground/[0.01] border border-foreground/[0.03] flex-grow flex items-center justify-center italic text-muted-foreground min-h-[200px]">
                Analyzing active pipeline. All matches validated.
              </TabPanel>
              <TabPanel name="archives" class="mt-8 p-6 rounded-xl bg-foreground/[0.01] border border-foreground/[0.03] flex-grow flex items-center justify-center italic text-muted-foreground min-h-[200px]">
                <span class="text-primary/80">
                  History secured. Accessing verified project archive.
                </span>
              </TabPanel>
              <TabPanel name="settings" class="mt-8 p-6 rounded-xl bg-foreground/[0.01] border border-foreground/[0.03] flex-grow flex items-center justify-center italic text-muted-foreground min-h-[200px]">
                Platform configuration parameters. Restricted access.
              </TabPanel>
              <TabPanel name="restricted" class="mt-8 p-6 rounded-xl bg-foreground/[0.01] border border-foreground/[0.03] flex-grow flex items-center justify-center italic text-muted-foreground min-h-[200px]">
                Admin restricted area. Access request logged.
              </TabPanel>
            </Tabs>
          </div>
        </div>

        {/* Dropzone */}
        <div class="space-y-3 flex flex-col">
          <h3 class="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-70">
            File Uploads
          </h3>
          <div class="bg-foreground/[0.005] dark:bg-foreground/[0.02] p-8 rounded-2xl border border-foreground/10 shadow-sm flex-grow flex flex-col">
            <p class="text-xs text-muted-foreground mb-6 max-w-2xl leading-relaxed">
              Enterprise-grade file intake with drag-and-drop, progress tracking, and status indicators.
            </p>
            <div class="flex-grow flex flex-col justify-center">
              <Dropzone label="Drop files to upload or click to browse" />
            </div>
          </div>
        </div>
      </div>

      {/* ================================================================
          2. EXPANSION PANELS + DRAG AND DROP (2-column)
          ================================================================ */}
      <div class="mt-12">
        <div class="grid grid-cols-1 xl:grid-cols-2 gap-y-12 gap-x-10 items-start">
          {/* Expansion Panels */}
          <div class="space-y-10">
            <div class="space-y-6">
              <h3 class="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-70">
                Expansion Panels
              </h3>

              {/* Multiple Expansion */}
              <div class="space-y-4">
                <span class="text-[10px] font-bold uppercase tracking-widest opacity-40">
                  Multiple Expansion
                </span>
                <Accordion
                  type="multiple"
                  value={accordionValue()}
                  onValueChange={(v) => setAccordionValue(v as string[])}
                >
                  <AccordionItem value="panel-1">
                    <AccordionTrigger
                      title="Expansion Panel Title"
                      subtitle="Expansion Panel Subtitle"
                    />
                    <AccordionContent>
                      This is the primary content of the panel. It can contain any
                      text or components.
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="panel-2">
                    <AccordionTrigger
                      title="Components"
                      subtitle="Hidden toggle icon"
                      showChevron={false}
                    />
                    <AccordionContent>
                      <div class="flex items-end gap-3 max-w-md">
                        <Input
                          label="Username"
                          placeholder="Enter username..."
                          class="flex-1"
                        />
                        <Button variant="neutral">Submit</Button>
                      </div>
                      <p class="mt-4 text-[10px] opacity-50 italic">
                        Your username or email address
                      </p>
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="panel-3">
                    <AccordionTrigger
                      title="Self Aware Panel"
                      subtitle={
                        accordionValue().includes("panel-3")
                          ? "Currently I am open"
                          : "Currently I am closed"
                      }
                    />
                    <AccordionContent>
                      I'm visible because I am open.
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>

              {/* Single Accordion (Non-Collapsible) */}
              <div class="space-y-4">
                <span class="text-[10px] font-bold uppercase tracking-widest opacity-40">
                  Single Accordion (Non-Collapsible)
                </span>
                <Accordion
                  type="single"
                  collapsible={false}
                  value={singleAccordionValue()}
                  onValueChange={(v) =>
                    setSingleAccordionValue(v as string | undefined)
                  }
                >
                  <AccordionItem value="panel-1">
                    <AccordionTrigger
                      title="Accordion Panel Title"
                      subtitle="Part of an accordion"
                    />
                    <AccordionContent>
                      In a single accordion, only one panel can be open at a time.
                      Opening another will close this one.
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="panel-2">
                    <AccordionTrigger
                      title="State Management"
                      subtitle="Managed via signals"
                    />
                    <AccordionContent>
                      The open state is managed by a single string value rather
                      than an array of strings.
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="panel-3">
                    <AccordionTrigger
                      title="High Density"
                      subtitle="Compact engineering view"
                    />
                    <AccordionContent>
                      Perfect for collapsible sidebars or complex configuration
                      menus where vertical space is premium.
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="panel-4">
                    <AccordionTrigger
                      title="Components"
                      subtitle="Contains sliders"
                    />
                    <AccordionContent>
                      <div class="flex flex-col gap-4">
                        You can put any component inside an accordion item. Here's
                        a slider:
                        <Slider
                          value={sliderValue()}
                          onChange={setSliderValue}
                          min={0}
                          max={100}
                          step={1}
                          showValue
                        />
                        <p class="text-xs text-muted-foreground leading-relaxed opacity-70">
                          Slider value: {sliderValue()}
                        </p>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
            </div>
          </div>

          {/* Drag and Drop */}
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <h3 class="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-70">
                Drag and Drop
              </h3>
            </div>
            <div class="bg-foreground/[0.005] dark:bg-foreground/[0.02] p-8 rounded-2xl border border-foreground/10 shadow-sm flex-grow relative">
              <div class="absolute top-6 right-6 flex items-center gap-2">
                <Chip
                  variant="blue"
                  size="xs"
                  clickable
                  active={sortMode() === "insert"}
                  onClick={() => setSortMode("insert")}
                >
                  Insert
                </Chip>
                <Chip
                  variant="destructive"
                  size="xs"
                  clickable
                  active={sortMode() === "swap"}
                  onClick={() => setSortMode("swap")}
                >
                  Swap
                </Chip>
              </div>

              <p class="text-xs text-muted-foreground mb-8 leading-relaxed opacity-70 max-w-[calc(100%-120px)]">
                Reorder items using the drag handles. Changes are persisted via state binding.
              </p>
              <SortableList
                items={sortableItems()}
                onReorder={setSortableItems}
                mode={sortMode()}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ================================================================
          3. BREADCRUMBS (full width)
          ================================================================ */}
      <div class="mt-12 space-y-3">
        <h3 class="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-70">
          Breadcrumb Navigation
        </h3>
        <div class="bg-foreground/[0.005] dark:bg-foreground/[0.02] p-10 rounded-2xl border border-foreground/10 shadow-sm">
          <div class="grid grid-cols-1 xl:grid-cols-2 gap-y-12 gap-x-16">
            <div class="space-y-4">
              <span class="text-[10px] font-bold uppercase tracking-widest opacity-40">
                16px Scale (Iconified)
              </span>
              <Breadcrumbs
                size={16}
                items={[
                  { label: "Platform", href: "#" },
                  { label: "Engineering", href: "#" },
                  { label: "System", href: "#" },
                  { label: "Network" },
                ]}
              />
            </div>
            <div class="space-y-4">
              <span class="text-[10px] font-bold uppercase tracking-widest opacity-40">
                14px Scale (Standard)
              </span>
              <Breadcrumbs
                size={14}
                items={[
                  { label: "Home", href: "#" },
                  { label: "Cloud", href: "#" },
                  { label: "Security", href: "#" },
                  { label: "Logs" },
                ]}
              />
            </div>
            <div class="space-y-4 pt-4 border-t border-foreground/5">
              <span class="text-[10px] font-bold uppercase tracking-widest opacity-40">
                12px Scale (Minimalist)
              </span>
              <Breadcrumbs
                size={12}
                items={[
                  { label: "Database", href: "#" },
                  { label: "Clusters", href: "#" },
                  { label: "Nodes", href: "#" },
                  { label: "Instance-04" },
                ]}
              />
            </div>
            <div class="space-y-4 pt-4 border-t border-foreground/5">
              <span class="text-[10px] font-bold uppercase tracking-widest opacity-40">
                10px Scale (High Density)
              </span>
              <Breadcrumbs
                size={10}
                items={[
                  { label: "Root", href: "#" },
                  { label: "usr", href: "#" },
                  { label: "local", href: "#" },
                  { label: "bin", href: "#" },
                  { label: "system-exec" },
                ]}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ================================================================
          4. STANDALONE PAGINATION (full width)
          ================================================================ */}
      <div class="mt-12 space-y-3">
        <h3 class="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-70">
          Stand-alone Pagination
        </h3>
        <div class="bg-foreground/[0.005] dark:bg-foreground/[0.02] rounded-2xl border border-foreground/10 shadow-sm overflow-hidden flex flex-col">
          <div class="p-8 border-b border-foreground/5">
            <p class="text-xs text-muted-foreground leading-relaxed opacity-70">
              The pagination component can be used independently of tables for
              any long-form content splitting.
            </p>
          </div>
          <div class="p-12 flex items-center justify-center italic text-muted-foreground/40 text-sm bg-background/20">
            Content Area (Page {paginationPage()})
          </div>
          <Pagination
            page={paginationPage()}
            pageSize={10}
            totalItems={124}
            onPageChange={setPaginationPage}
            label="entries"
          />
        </div>
      </div>

      {/* ================================================================
          5. DATA INSIGHTS (2 charts)
          ================================================================ */}
      <div class="mt-12 space-y-3">
        <div class="flex items-center justify-between">
          <h3 class="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-70">
            Data Insights (Observable Plot)
          </h3>
          <Link
            href="https://observablehq.com/plot/what-is-plot"
            target="_blank"
            rel="noopener noreferrer"
            class="text-[10px] font-mono font-bold uppercase tracking-widest transition-colors"
            variant="blue"
          >
            Observable Plot
          </Link>
        </div>

        <div class="bg-foreground/[0.005] dark:bg-foreground/[0.02] p-10 rounded-2xl border border-foreground/10 shadow-sm">
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-x-10 gap-y-6">
            {/* 1. Line: Deals & Leads */}
            <div class="rounded-2xl border border-foreground/10 bg-background/40 shadow-sm p-6 sm:p-10 h-full min-h-[380px]">
              <LineGraph title="Deals & Leads" subtitle="YTD 2025" icon="trending_up"
                data={pipelineData} x="monthNum" y="value" stroke="metric"
                options={{ x: { tickFormat: (d: unknown) => months[d as number] ?? "", ticks: 12 }, color: { legend: false, domain: ["Closed Deals", "Leads"], range: ["#22d3ee", "#a78bfa"] },
                  marks: [{ plotMark: "areaY", data: pipelineData.filter((d: Record<string, unknown>) => d.metric === "Closed Deals"), options: { fill: "#22d3ee", fillOpacity: 0.12 } }] }}
                caption="Pipeline conversion rate trending upward with seasonal peaks." />
            </div>
            {/* 2. Line: Skill Growth Velocity */}
            <div class="rounded-2xl border border-foreground/10 bg-background/40 shadow-sm p-6 sm:p-10 h-full min-h-[380px]">
              <LineGraph title="Skill Growth Velocity" subtitle="24-Week Cohort" icon="school"
                data={skillGrowthData} x="week" y="score" stroke="skill"
                options={{ x: { ticks: 8 }, color: { legend: false, domain: ["Technical", "Soft Skills", "Industry"], range: ["#f472b6", "#34d399", "#fbbf24"] } }}
                caption="Skill acquisition across technical, soft, and industry domains." />
            </div>
            {/* 3. Bar: Hiring by Sector */}
            <div class="rounded-2xl border border-foreground/10 bg-background/40 shadow-sm p-6 sm:p-10 h-full min-h-[380px]">
              <BarGraph title="Hiring by Sector" subtitle="Q1 2025" icon="business_center"
                data={sectorData} x="sector" y="count" color="sector"
                options={{ color: { range: ["#22d3ee", "#34d399", "#a78bfa", "#fbbf24", "#f472b6"] } }}
                caption="Technology and Finance sectors leading growth volume." />
            </div>
            {/* 4. Scatter: Revenue vs Performance */}
            <div class="rounded-2xl border border-foreground/10 bg-background/40 shadow-sm p-6 sm:p-10 h-full min-h-[380px]">
              <ScatterGraph title="Revenue vs Performance" subtitle="n=80 Records" icon="payments"
                data={scatterData} x="score" y="revenue" fill="segment"
                options={{ marginLeft: 55, x: { domain: [2.8, 4.0] }, y: { tickFormat: (d: unknown) => `$${d}k` },
                  color: { legend: false, domain: ["Tech", "Biz", "Art"], range: ["#22d3ee", "#fbbf24", "#f472b6"] },
                  marks: [{ plotMark: "linearRegressionY", options: { stroke: "#94a3b8", strokeOpacity: 0.5 } }] }}
                caption="Positive correlation between performance score and revenue." />
            </div>
            {/* 5. Heatmap: Task Completion */}
            <div class="rounded-2xl border border-foreground/10 bg-background/40 shadow-sm p-6 sm:p-10 h-full min-h-[380px]">
              <HeatmapGraph title="Task Completion Velocity" subtitle="90-Day Trajectory" icon="event_available"
                data={heatmapData} dateKey="date" valueKey="value"
                caption="Daily task completion volume tracking. Most recent activity bottom-right." />
            </div>
            {/* 6. Radar: Competency */}
            <div class="rounded-2xl border border-foreground/10 bg-background/40 shadow-sm p-6 sm:p-10 h-full min-h-[380px]">
              <RadarGraph title="Candidate Competency" subtitle="Radar Profile" icon="radar"
                data={hardSkills} color="#22d3ee"
                caption="Holistic skill assessment across core competency vectors." />
            </div>
            {/* 7. Quadrant: Performance Validation */}
            <div class="rounded-2xl border border-foreground/10 bg-background/40 shadow-sm p-6 sm:p-10 h-full min-h-[380px]">
              <ScatterQuadrant title="Performance Validation" subtitle="Velocity vs Quality" icon="verified"
                data={quadrantData} x="velocity" y="quality" xLabel="Velocity (hrs/project)" yLabel="Quality Rating (1-5)"
                caption="Mapping data points into performance quadrants for analysis." />
            </div>
            {/* 8. Matrix: Skill Correlation */}
            <div class="rounded-2xl border border-foreground/10 bg-background/40 shadow-sm p-6 sm:p-10 h-full min-h-[380px]">
              <MatrixGraph title="Skill Correlation" subtitle="Cross-Domain Proficiency" icon="hub"
                data={matrixData} x="skillA" y="skillB" value="correlation"
                caption="Identifying skill clusters for cross-functional capabilities." />
            </div>
            {/* 9. Honeycomb: Market Saturation */}
            <div class="rounded-2xl border border-foreground/10 bg-background/40 shadow-sm p-6 sm:p-10 h-full min-h-[380px]">
              <HexbinChart title="Market Saturation" subtitle="Regional Coverage" icon="hive"
                data={honeycombData} x="lon" y="lat"
                caption="Hexbin density analysis of regional presence across the partner network." />
            </div>
            {/* 10. Supply Chain: Conversion Pipeline */}
            <div class="rounded-2xl border border-foreground/10 bg-background/40 shadow-sm p-6 sm:p-10 h-full min-h-[380px]">
              <StackedArea title="Conversion Pipeline" subtitle="Stage Funnel" icon="account_tree"
                data={supplyData} x="i" y="value" z="stage"
                caption="Tracking the flow from lead to closed deal." />
            </div>
            {/* 11. Rhythm: Work Punch Card */}
            <div class="rounded-2xl border border-foreground/10 bg-background/40 shadow-sm p-6 sm:p-10 h-full min-h-[380px]">
              <ActivityGrid title="Work Rhythm" subtitle="Punch Card Activity" icon="schedule"
                data={rhythmData} x="hour" y="day" value="count"
                caption="Hourly distribution of task completion across the work week." />
            </div>
            {/* 12. Timeline: Active Projects */}
            <div class="rounded-2xl border border-foreground/10 bg-background/40 shadow-sm p-6 sm:p-10 h-full min-h-[380px]">
              <TimelineGraph title="Active Projects" subtitle="Operational Lifecycle" icon="assignment"
                data={timelineData} x1="start" x2="end" y="name" fill="status"
                caption="Gantt-style tracking of active and completed initiatives." />
            </div>
            {/* 13. Difference: Supply vs Demand */}
            <div class="rounded-2xl border border-foreground/10 bg-background/40 shadow-sm p-6 sm:p-10 h-full min-h-[380px]">
              <AreaComparison title="Market Equilibrium" subtitle="Supply vs Demand" icon="balance"
                data={gapData} x="i" y1="supply" y2="demand"
                caption="Comparing supply (Green) vs demand (Pink)." />
            </div>
            {/* 14. Step: Task Load */}
            <div class="rounded-2xl border border-foreground/10 bg-background/40 shadow-sm p-6 sm:p-10 h-full min-h-[380px]">
              <StepGraph title="System Load" subtitle="Daily Throughput" icon="speed"
                data={stepData} x="day" y="load"
                caption="Incremental tracking of platform throughput and task volume." />
            </div>
            {/* 15. Box: Performance Consistency */}
            <div class="rounded-2xl border border-foreground/10 bg-background/40 shadow-sm p-6 sm:p-10 h-full min-h-[380px]">
              <BoxGraph title="Performance Consistency" subtitle="Rating Variance by Dept" icon="analytics"
                data={boxData} x="dept" y="rating"
                caption="Distribution of performance ratings showing medians and statistical outliers." />
            </div>
            {/* 16. Tree: Network Hierarchy */}
            <div class="rounded-2xl border border-foreground/10 bg-background/40 shadow-sm p-6 sm:p-10 h-full min-h-[450px]">
              <TreeGraph title="Platform Ecosystem" subtitle="Organization Hierarchy" icon="account_tree"
                data={treeData} path="id"
                caption="Structural breakdown of the partner network from organization to team." />
            </div>
            {/* 17. Race: Bar Chart Race (full width) */}
            <div class="col-span-full rounded-2xl border border-foreground/10 bg-background/40 shadow-sm p-6 sm:p-10 min-h-[500px]">
              <BarRace title="Regional Growth Race" subtitle="Cumulative Growth by Organization"
                data={raceData} category="name" value="value" time="date" duration={1200} />
            </div>

            {/* 18. Dynamic Dashboard Demo (full width) */}
            <div class="col-span-full space-y-6 bg-foreground/[0.01] p-8 rounded-3xl border border-foreground/5">
              <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h3 class="text-lg font-bold font-montserrat tracking-tight text-foreground">
                    Analytics Dashboard
                  </h3>
                  <p class="text-xs text-muted-foreground uppercase tracking-widest font-bold opacity-60">
                    Reactive Parameter Injection
                  </p>
                </div>
                <div class="w-64">
                  <Select
                    value={selectedOrg()}
                    onChange={setSelectedOrg}
                    placeholder="Select organization..."
                  >
                    <For each={orgOptions}>{(opt) => (
                      <SelectItem value={opt.value}>{opt.label}</SelectItem>
                    )}</For>
                  </Select>
                </div>
              </div>

              <div class="grid grid-cols-1 lg:grid-cols-2 gap-x-10 gap-y-6">
                <div class="rounded-2xl border border-foreground/10 bg-background/40 shadow-sm p-6 sm:p-10 h-full min-h-[380px]">
                  <BarGraph title="Hiring by Sector" subtitle="Current Quarter" icon="business_center"
                    data={filteredDashboardData()} x="sector" y="count" color="sector"
                    options={{ color: { domain: ["Tech", "Design", "Health", "Retail", "Other"], range: ["#22d3ee", "#34d399", "#a78bfa", "#fbbf24", "#f472b6"] } }} />
                </div>
                <div class="rounded-2xl border border-foreground/10 bg-background/40 shadow-sm p-6 sm:p-10 h-full min-h-[380px]">
                  <LineGraph title="Growth Trajectory" subtitle="Monthly Results" icon="trending_up"
                    data={filteredDashboardData()} x="month" y="value" stroke="org"
                    options={{
                      x: { domain: months.slice(0, 5) },
                      color: { domain: [selectedOrg()], range: ["#22d3ee"] },
                      marks: [{ plotMark: "areaY", data: filteredDashboardData(), options: { fill: "#22d3ee", fillOpacity: 0.1 } }],
                    }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ================================================================
          6. GEOSPATIAL INTELLIGENCE (globe + map)
          ================================================================ */}
      <div class="mt-12 space-y-3">
        <h3 class="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-70">
          Geospatial Intelligence
        </h3>
        <div class="bg-foreground/[0.005] dark:bg-foreground/[0.02] p-10 rounded-2xl border border-foreground/10 shadow-sm">
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-x-10 gap-y-6 h-[400px]">
            {/* Globe View */}
            <div class="flex flex-col h-full rounded-2xl overflow-hidden border border-foreground/10 bg-background/40 shadow-sm relative group">
              <div class="absolute top-6 left-6 z-10">
                <div class="flex items-center gap-3">
                  <div class="h-8 w-8 rounded-lg bg-background/80 backdrop-blur-md border border-foreground/10 flex items-center justify-center shadow-lg">
                    <Icon name="public" size={18} class="text-foreground/70" />
                  </div>
                  <h4 class="text-xs font-bold text-foreground/90 uppercase tracking-wider">
                    Global Map
                  </h4>
                </div>
              </div>
              <div class="flex-1 w-full h-full">
                <GeoPlot
                  data={partnerLocations}
                  mode="globe"
                  class="w-full h-full"
                />
              </div>
            </div>

            {/* Map View */}
            <div class="flex flex-col h-full rounded-2xl overflow-hidden border border-foreground/10 bg-background/40 shadow-sm relative group">
              <div class="absolute top-6 left-6 z-10">
                <div class="flex items-center gap-3">
                  <div class="h-8 w-8 rounded-lg bg-background/80 backdrop-blur-md border border-foreground/10 flex items-center justify-center shadow-lg">
                    <Icon name="map" size={18} class="text-foreground/70" />
                  </div>
                  <h4 class="text-xs font-bold text-foreground/90 uppercase tracking-wider">
                    Standard Map
                  </h4>
                </div>
              </div>
              <div class="flex-1 w-full h-full">
                <GeoPlot
                  data={partnerLocations}
                  mode="map"
                  class="w-full h-full"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ================================================================
          7. 3D VISUALIZATION (full width)
          ================================================================ */}
      <div class="mt-12 space-y-3">
        <h3 class="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-70">
          Network Topology (3D)
        </h3>
        <div class="bg-foreground/[0.005] dark:bg-foreground/[0.02] p-10 rounded-2xl border border-foreground/10 shadow-sm">
          <div class="flex flex-col h-[600px] rounded-2xl overflow-hidden border border-foreground/10 bg-background/40 shadow-sm relative group">
            <div class="absolute top-6 left-6 z-10 pointer-events-none">
              <div class="flex items-center gap-3">
                <div class="h-8 w-8 rounded-lg bg-background/80 backdrop-blur-md border border-foreground/10 flex items-center justify-center shadow-lg">
                  <Icon name="view_in_ar" size={18} class="text-foreground/70" />
                </div>
                <div>
                  <h4 class="text-xs font-bold text-foreground/90 uppercase tracking-wider">
                    3D Topology Visualization
                  </h4>
                  <p class="text-[10px] text-muted-foreground uppercase tracking-widest font-medium">
                    Lazy Loaded Engine
                  </p>
                </div>
              </div>
            </div>
            <Suspense>
              <div class="flex-1 relative">
                <Canvas3D class="!absolute !inset-0 !min-h-0" />
              </div>
            </Suspense>
          </div>
        </div>
      </div>

      {/* ================================================================
          8. VIDEO RECORDER (full width, constrained)
          ================================================================ */}
      <div class="mt-12 space-y-3">
        <h3 class="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-70">
          Multimedia Capture
        </h3>
        <div class="bg-foreground/[0.005] dark:bg-foreground/[0.02] p-10 rounded-2xl border border-foreground/10 shadow-sm">
          <div class="max-w-3xl mx-auto">
            <Suspense>
              <VideoRecorder
                onRecordingComplete={() => {}}
              />
            </Suspense>
          </div>
        </div>
      </div>
    </section>
  );
}

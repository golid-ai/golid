import { For } from "solid-js";
import { Avatar } from "~/components/atoms/Avatar";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "~/components/atoms/Card";
import { Chip } from "~/components/atoms/Chip";
import { Button } from "~/components/atoms/Button";
import { Icon } from "~/components/atoms/Icon";
import { Link } from "~/components/atoms/Link";
import { cn } from "~/lib/utils";

// =============================================================================
// TYPES
// =============================================================================

interface MemberCardData {
  name: string;
  organization: string;
  avatarUrl: string;
  skills: string[];
  competency: { key: string; value: number }[];
  score: number;
  status: "Working" | "Available" | "Pending";
}

// =============================================================================
// MOCK DATA
// =============================================================================

const memberA: MemberCardData = {
  name: "Alex Rivera",
  organization: "Alpha Corp",
  avatarUrl: "https://i.pravatar.cc/150?u=alex",
  skills: ["React", "Python", "Market Research", "SEO"],
  competency: [
    { key: "Technical", value: 85 },
    { key: "Design", value: 60 },
    { key: "Sales", value: 40 },
    { key: "Support", value: 90 },
    { key: "Strategy", value: 75 },
  ],
  score: 98,
  status: "Available",
};

const memberB: MemberCardData = {
  name: "Jordan Smith",
  organization: "Beta Inc",
  avatarUrl: "https://i.pravatar.cc/150?u=jordan",
  skills: ["Salesforce", "CRM", "Copywriting"],
  competency: [
    { key: "Technical", value: 45 },
    { key: "Design", value: 30 },
    { key: "Sales", value: 95 },
    { key: "Support", value: 80 },
    { key: "Strategy", value: 65 },
  ],
  score: 92,
  status: "Working",
};

// =============================================================================
// MEMBER CARD (inline — uses competency bars for data visualization)
// =============================================================================

function MemberCard(props: MemberCardData) {
  const statusColor = () => {
    switch (props.status) {
      case "Working": return "bg-green";
      case "Available": return "bg-blue";
      case "Pending": return "bg-gold";
    }
  };

  return (
    <Card
      static
      liftable
      class="flex flex-col group overflow-hidden border-foreground/[0.03] bg-card"
    >
      <CardHeader class="pb-0 pt-8 px-8 relative bg-foreground/[0.01]">
        {/* Score Badge */}
        <div class="absolute top-8 right-8 flex flex-col items-end gap-1">
          <span class="text-[8px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-50">
            Score
          </span>
          <div class="text-xl font-mono font-bold text-primary tracking-tighter">
            {props.score}%
          </div>
        </div>

        <div class="flex items-center gap-4">
          <div class="relative">
            {/* Avatar */}
            <div class="w-14 h-14 rounded-full border-2 border-primary/10 p-0.5 shadow-xl overflow-hidden bg-muted flex items-center justify-center">
              <img
                src={props.avatarUrl}
                alt={props.name}
                class="w-full h-full rounded-full object-cover"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = "none";
                }}
              />
            </div>
            {/* Status Dot */}
            <div class="absolute -bottom-1 -right-1">
              <div class={cn("w-4 h-4 rounded-full border-2 border-card", statusColor())} />
            </div>
          </div>
          <div class="min-w-0">
            <CardTitle class="text-xl font-montserrat truncate leading-tight">
              {props.name}
            </CardTitle>
            <p class="text-[10px] font-bold text-muted-foreground uppercase tracking-widest truncate opacity-70 mt-0.5">
              {props.organization}
            </p>
          </div>
        </div>
      </CardHeader>

      {/* Competency Bars */}
      <div class="px-8 pt-6 pb-2 space-y-3">
        <span class="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-40">
          Competency
        </span>
        <div class="space-y-2.5">
          <For each={props.competency}>
            {(item) => (
              <div class="flex items-center gap-3">
                <span class="text-[10px] font-bold text-muted-foreground uppercase tracking-wider w-20 truncate opacity-60">
                  {item.key}
                </span>
                <div class="flex-1 h-1.5 bg-foreground/5 rounded-full overflow-hidden">
                  <div
                    class="h-full bg-primary/60 rounded-full transition-all duration-700"
                    style={{ width: `${item.value}%` }}
                  />
                </div>
                <span class="text-[10px] font-mono font-bold text-muted-foreground opacity-50 w-8 text-right">
                  {item.value}
                </span>
              </div>
            )}
          </For>
        </div>
      </div>

      {/* Skills Matrix */}
      <div class="px-8 pb-8 space-y-3 relative z-10 mt-auto">
        <span class="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-40">
          Validated Skills
        </span>
        <div class="flex flex-wrap gap-1.5">
          <For each={props.skills}>
            {(skill) => (
              <Chip variant="neutral" size="xs" class="bg-foreground/[0.03] border-0 hover:bg-foreground/10 transition-colors">
                {skill}
              </Chip>
            )}
          </For>
        </div>
      </div>

      <CardFooter class="p-0 border-t border-foreground/5 overflow-hidden bg-foreground/[0.01]">
        <div class="grid grid-cols-2 w-full h-12">
          <button class="flex items-center justify-center gap-2 hover:bg-primary/5 transition-colors text-[10px] font-black uppercase tracking-widest border-r border-foreground/5 group/item outline-none">
            <Icon name="visibility" class="text-lg opacity-40 group-hover/item:opacity-100 group-hover/item:text-primary transition-all" />
            Full Profile
          </button>
          <button class="flex items-center justify-center gap-2 hover:bg-green/5 transition-colors text-[10px] font-black uppercase tracking-widest text-primary group/item outline-none">
            <Icon name="bolt" class="text-lg group-hover/item:animate-pulse transition-transform" />
            Connect
          </button>
        </div>
      </CardFooter>
    </Card>
  );
}

// =============================================================================
// CARD SECTION
// =============================================================================

export function CardSection() {
  return (
    <section class="mb-12">
      <h2 class="text-2xl font-semibold mb-6 border-b border-border pb-2 text-foreground">
        Cards
      </h2>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 items-stretch">
        {/* Member Cards */}
        <MemberCard {...memberA} />
        <MemberCard {...memberB} />

        {/* High-Density Action Card */}
        <Card static liftable class="flex flex-col group border-foreground/[0.03] overflow-hidden">
          <CardHeader class="pb-4 bg-foreground/[0.01]">
            <div class="flex items-center justify-between mb-3">
              <Chip variant="neutral" size="sm">Platform Activity</Chip>
              <div class="flex items-center gap-1.5">
                <div class="relative flex h-2 w-2">
                  <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-green opacity-75" />
                  <span class="relative inline-flex rounded-full h-2 w-2 bg-green" />
                </div>
                <span class="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
                  Live
                </span>
              </div>
            </div>
            <CardTitle class="text-2xl font-montserrat">System Metrics</CardTitle>
          </CardHeader>
          <CardContent class="flex-1 py-6">
            <p class="text-sm text-muted-foreground leading-relaxed mb-6">
              Real-time tracking of user-organization connections. No anomalies
              detected in the last 24 hours.
            </p>
            <div class="grid grid-cols-2 gap-4 pt-4 border-t border-foreground/[0.03]">
              <div class="space-y-1">
                <span class="text-[10px] font-bold text-foreground uppercase tracking-[0.2em] opacity-50">
                  Success Rate
                </span>
                <div class="text-lg font-mono font-bold text-green leading-none">
                  99.99%
                </div>
              </div>
              <div class="space-y-1 text-right">
                <span class="text-[10px] font-bold text-foreground uppercase tracking-[0.2em] opacity-50">
                  Response
                </span>
                <div class="text-lg font-mono font-bold text-blue leading-none">
                  14m
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter class="pt-4 pb-6 px-6 flex items-center justify-between bg-foreground/[0.01]">
            <Link href="#" class="text-xs font-medium" variant="blue">
              View details
            </Link>
            <Button variant="green" size="sm">
              Acknowledge
            </Button>
          </CardFooter>
        </Card>

        {/* Glassmorphic Data Card */}
        <button
          type="button"
          aria-labelledby="member-discovery-title"
          class="relative rounded-2xl overflow-hidden shadow-elevated group transition-[transform,shadow] hover:shadow-2xl hover:-translate-y-1 focus-visible:shadow-2xl focus-visible:-translate-y-1 bg-card flex flex-col outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 text-left"
        >
          {/* Background Bokeh */}
          <div class="absolute top-0 right-0 w-32 h-32 bg-blue-grad opacity-20 blur-3xl group-hover:scale-150 group-focus-visible:scale-150 transition-transform duration-700" />

          <div class="relative p-8 flex flex-col flex-1">
            <div class="flex items-center gap-3 mb-6">
              <div class="w-10 h-10 rounded-xl glass flex items-center justify-center text-primary shadow-lg border-white/20">
                <Icon name="analytics" class="text-xl" filled />
              </div>
              <h3
                id="member-discovery-title"
                class="text-sm font-bold text-foreground uppercase tracking-[0.2em] opacity-70"
              >
                Member Discovery
              </h3>
            </div>

            <div class="flex-1 space-y-8">
              <div class="flex flex-col">
                <div class="text-5xl font-bold font-montserrat tracking-tighter mb-1">
                  1.2M
                </div>
                <p class="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] opacity-60">
                  Registered Members
                </p>
              </div>

              <div class="p-5 rounded-2xl glass border border-white/10 space-y-4">
                <div class="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest opacity-60">
                  <span>Match Efficiency</span>
                  <Icon name="bolt" class="text-lime animate-pulse" filled />
                </div>
                <div class="h-2 w-full bg-foreground/10 rounded-full overflow-hidden">
                  <div class="h-full bg-lime w-[85%] rounded-full" />
                </div>
                <div class="flex justify-between font-mono text-[10px] text-muted-foreground uppercase tracking-tight">
                  <span>Utilization: 85%</span>
                  <span class="text-lime font-bold">Optimal state</span>
                </div>
              </div>
            </div>
          </div>

          {/* Edge-to-Edge Action Footer */}
          <div class="relative w-full h-14 bg-neutral border-t border-foreground/[0.03] flex items-center justify-center gap-2 group/btn rounded-b-2xl">
            <span class="text-xs font-bold uppercase tracking-widest">
              View Full Profile
            </span>
            <Icon
              name="chevron_right"
              class="text-lg group-hover/btn:translate-x-1 transition-transform"
            />
          </div>
        </button>

        {/* Premium Profile Card */}
        <Card static liftable class="flex flex-col overflow-hidden border-foreground/[0.03]">
          <CardHeader class="flex flex-row items-center gap-5 pb-8 pt-8 px-8 bg-foreground/[0.04] relative">
            {/* Verified Badge */}
            <div class="absolute top-0 right-0 p-4">
              <Icon name="verified" class="text-blue/80 text-2xl" filled />
            </div>

            {/* Avatar */}
            <Avatar src="" alt="AM" fallback="AM" size="lg" class="border-2 border-primary/20 p-0.5 shadow-xl" />
            <div class="space-y-1.5">
              <CardTitle class="text-2xl font-montserrat">Alex Morgan</CardTitle>
              <Chip variant="indigo" size="sm">Premium Architect</Chip>
            </div>
          </CardHeader>
          <CardContent class="flex-1 pt-8 px-8">
            <div class="space-y-6">
              <p class="text-base text-muted-foreground leading-relaxed">
                Lead engineer specializing in high-performance systems and
                architecture.
              </p>
              <div class="flex flex-wrap gap-2.5">
                <Chip variant="neutral" size="sm" class="bg-foreground/[0.03]">
                  SolidJS
                </Chip>
                <Chip variant="neutral" size="sm" class="bg-foreground/[0.03]">
                  Go
                </Chip>
                <Chip variant="neutral" size="sm" class="bg-foreground/[0.03]">
                  Echo
                </Chip>
                <Chip variant="neutral" size="sm" class="bg-foreground/[0.03]">
                  PostgreSQL
                </Chip>
              </div>
            </div>
          </CardContent>
          <CardFooter class="p-0 border-t border-foreground/[0.03] overflow-hidden">
            <div class="grid grid-cols-2 w-full h-14">
              <button class="flex items-center justify-center gap-3 hover:bg-foreground/[0.03] transition-colors text-xs font-bold uppercase tracking-widest border-r border-foreground/[0.03] group/item outline-none focus-visible:bg-foreground/[0.03]">
                <Icon
                  name="mail"
                  class="text-xl opacity-40 group-hover/item:opacity-100 group-hover/item:text-primary transition-all"
                />
                Email
              </button>
              <button class="flex items-center justify-center gap-3 hover:bg-foreground/[0.03] transition-colors text-xs font-bold uppercase tracking-widest text-blue group/item outline-none focus-visible:bg-foreground/[0.03]">
                <Icon
                  name="person"
                  class="text-xl group-hover/item:scale-110 transition-transform"
                />
                Profile
              </button>
            </div>
          </CardFooter>
        </Card>
      </div>
    </section>
  );
}

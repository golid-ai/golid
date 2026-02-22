import { createSignal, For } from "solid-js";
import { Checkbox } from "~/components/atoms/Checkbox";
import { Switch } from "~/components/atoms/Switch";
import { Slider } from "~/components/atoms/Slider";
import { Progress } from "~/components/atoms/Progress";
import { Calendar, type DateRange } from "~/components/atoms/Calendar";
import { RadioGroup, RadioGroupItem } from "~/components/molecules/RadioGroup";
import { ToggleGroup, ToggleGroupItem } from "~/components/molecules/ToggleGroup";

// ============================================================================
// TYPES
// ============================================================================

export interface ControlSectionProps {}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function ControlSection(_props: ControlSectionProps) {
  // Checkbox states
  const [checked1, setChecked1] = createSignal(false);
  const [checked2, setChecked2] = createSignal(true);
  const [checked3, setChecked3] = createSignal(false);

  // Switch states
  const [switch1, setSwitch1] = createSignal(false);
  const [switch2, setSwitch2] = createSignal(true);
  const [switch3, setSwitch3] = createSignal(false);
  const [switchDanger, setSwitchDanger] = createSignal(true);

  // Radio state
  const [radioValue, setRadioValue] = createSignal("option1");
  const [radioSize, setRadioSize] = createSignal("md");

  // Radio options with labels
  const radioOptions = [
    { value: "option1", label: "Full-time position" },
    { value: "option2", label: "Part-time position" },
    { value: "option3", label: "Contract work" },
    { value: "option4", label: "Internship (unavailable)", disabled: true },
  ];

  const selectedLabel = () => radioOptions.find(o => o.value === radioValue())?.label || radioValue();

  // Slider states
  const [sliderValue, setSliderValue] = createSignal(50);
  const [sliderSteps, setSliderSteps] = createSignal(40);
  const [rangeValue, setRangeValue] = createSignal<[number, number]>([20, 80]);

  // Calendar states
  const [singleDate, setSingleDate] = createSignal<Date | null>(new Date());
  const [dateRange, setDateRange] = createSignal<DateRange>({ start: null, end: null });

  // Toggle group states
  const [toggleSingle, setToggleSingle] = createSignal<string | null>("center");
  const [toggleMultiple, setToggleMultiple] = createSignal<string[]>(["bold"]);
  const [toggleDanger, setToggleDanger] = createSignal<string | null>("a");
  const [toggleNoIcon, setToggleNoIcon] = createSignal<string | null>("b");
  const [toggleLg, setToggleLg] = createSignal<string | null>("a");
  const [toggleDefault, setToggleDefault] = createSignal<string | null>("a");
  const [toggleSm, setToggleSm] = createSignal<string | null>("a");
  const [toggleXs, setToggleXs] = createSignal<string | null>("a");


  return (
    <>
      {/* Checkboxes & Switches */}
      <section class="mb-12">
        <h2 class="text-2xl font-semibold mb-6 border-b border-border pb-2 text-foreground">
          Controls
        </h2>
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-x-10 gap-y-6">
          {/* Checkboxes */}
          <div class="space-y-3">
            <h3 class="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-70 mb-3">
              Checkboxes
            </h3>
            <div class="space-y-4 bg-foreground/[0.005] dark:bg-foreground/[0.02] p-8 rounded-2xl border border-foreground/10">
              <label class="flex items-center gap-4 cursor-pointer">
                <Checkbox size="sm" checked={checked1()} onChange={setChecked1} label="Small checkbox" />
                <span class="text-sm text-muted-foreground">Small (20px)</span>
              </label>
              <label class="flex items-center gap-4 cursor-pointer">
                <Checkbox size="md" checked={checked2()} onChange={setChecked2} label="Medium checkbox" />
                <span class="text-sm text-muted-foreground">Medium (24px) - Default</span>
              </label>
              <label class="flex items-center gap-4 cursor-pointer">
                <Checkbox size="lg" checked={checked3()} onChange={setChecked3} label="Large checkbox" />
                <span class="text-sm text-muted-foreground">Large (28px)</span>
              </label>
              <label class="flex items-center gap-4 opacity-50 pt-2 border-t border-foreground/5 cursor-not-allowed">
                <Checkbox checked={false} onChange={() => {}} disabled label="Disabled checkbox" />
                <span class="text-sm text-muted-foreground">Disabled</span>
              </label>
            </div>
          </div>

          {/* Switches */}
          <div class="space-y-3">
            <h3 class="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-70 mb-3">
              Switches
            </h3>
            <div class="space-y-4 bg-foreground/[0.005] dark:bg-foreground/[0.02] p-8 rounded-2xl border border-foreground/10">
              <div class="flex items-center gap-4">
                <Switch size="sm" checked={switch1()} onChange={setSwitch1} label="Small toggle" />
                <span class="text-sm text-muted-foreground">Small</span>
              </div>
              <div class="flex items-center gap-4">
                <Switch size="md" checked={switch2()} onChange={setSwitch2} label="Medium toggle" />
                <span class="text-sm text-muted-foreground">Medium - Default</span>
              </div>
              <div class="flex items-center gap-4">
                <Switch size="lg" checked={switch3()} onChange={setSwitch3} label="Large toggle" />
                <span class="text-sm text-muted-foreground">Large</span>
              </div>
              <div class="flex items-center gap-4 pt-2 border-t border-foreground/5">
                <Switch color="destructive" checked={switchDanger()} onChange={setSwitchDanger} label="Danger color toggle" />
                <span class="text-sm text-muted-foreground">Danger Color</span>
              </div>
            </div>
          </div>
        </div>

        {/* Toggle Groups */}
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-x-10 gap-y-6 mt-6">
          <div class="space-y-3">
            <h3 class="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-70 mb-3">
              Toggle Groups
            </h3>
            <div class="space-y-0 bg-foreground/[0.005] dark:bg-foreground/[0.02] rounded-2xl border border-foreground/10 overflow-hidden">
              {/* Single Selection */}
              <div class="flex items-center justify-between px-8 py-5 border-b border-foreground/5">
                <span class="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground">Single</span>
                <ToggleGroup type="single" value={toggleSingle()} onChange={(v) => setToggleSingle(v as string | null)}>
                  <ToggleGroupItem value="left">Left</ToggleGroupItem>
                  <ToggleGroupItem value="center">Center</ToggleGroupItem>
                  <ToggleGroupItem value="right">Right</ToggleGroupItem>
                </ToggleGroup>
              </div>
              {/* Multiple Selection */}
              <div class="flex items-center justify-between px-8 py-5 border-b border-foreground/5">
                <span class="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground">Multiple</span>
                <ToggleGroup type="multiple" value={toggleMultiple()} onChange={(v) => setToggleMultiple(v as string[])}>
                  <ToggleGroupItem value="bold">Bold</ToggleGroupItem>
                  <ToggleGroupItem value="italic">Italic</ToggleGroupItem>
                  <ToggleGroupItem value="underline">Underline</ToggleGroupItem>
                </ToggleGroup>
              </div>
              {/* Danger Variant */}
              <div class="flex items-center justify-between px-8 py-5 border-b border-foreground/5">
                <span class="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground">Danger</span>
                <ToggleGroup type="single" value={toggleDanger()} onChange={(v) => setToggleDanger(v as string | null)} variant="secondary">
                  <ToggleGroupItem value="a">Delete</ToggleGroupItem>
                  <ToggleGroupItem value="b">Archive</ToggleGroupItem>
                  <ToggleGroupItem value="c">Block</ToggleGroupItem>
                </ToggleGroup>
              </div>
              {/* No Check */}
              <div class="flex items-center justify-between px-8 py-5 border-b border-foreground/5">
                <span class="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground">No Icon</span>
                <ToggleGroup type="single" value={toggleNoIcon()} onChange={(v) => setToggleNoIcon(v as string | null)} variant="default">
                  <ToggleGroupItem value="a" indicator={false}>Day</ToggleGroupItem>
                  <ToggleGroupItem value="b" indicator={false}>Week</ToggleGroupItem>
                  <ToggleGroupItem value="c" indicator={false}>Month</ToggleGroupItem>
                </ToggleGroup>
              </div>
              {/* Disabled */}
              <div class="flex items-center justify-between px-8 py-5">
                <span class="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground">Disabled</span>
                <ToggleGroup type="single" value="a" variant="outline">
                  <ToggleGroupItem value="a" disabled>Locked</ToggleGroupItem>
                  <ToggleGroupItem value="b" disabled>System</ToggleGroupItem>
                  <ToggleGroupItem value="c" disabled>Offline</ToggleGroupItem>
                </ToggleGroup>
              </div>
            </div>
          </div>

          <div class="space-y-3">
            <h3 class="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-70 mb-3">
              Toggle Sizes
            </h3>
            <div class="space-y-0 bg-foreground/[0.005] dark:bg-foreground/[0.02] rounded-2xl border border-foreground/10 overflow-hidden">
              <div class="flex items-center justify-between px-8 py-5 border-b border-foreground/5">
                <span class="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground">Large</span>
                <ToggleGroup type="single" value={toggleLg()} onChange={(v) => setToggleLg(v as string | null)} size="lg">
                  <ToggleGroupItem value="a">Alpha</ToggleGroupItem>
                  <ToggleGroupItem value="b">Beta</ToggleGroupItem>
                  <ToggleGroupItem value="c">Gamma</ToggleGroupItem>
                </ToggleGroup>
              </div>
              <div class="flex items-center justify-between px-8 py-5 border-b border-foreground/5">
                <span class="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground">Default</span>
                <ToggleGroup type="single" value={toggleDefault()} onChange={(v) => setToggleDefault(v as string | null)} size="default">
                  <ToggleGroupItem value="a">Alpha</ToggleGroupItem>
                  <ToggleGroupItem value="b">Beta</ToggleGroupItem>
                  <ToggleGroupItem value="c">Gamma</ToggleGroupItem>
                </ToggleGroup>
              </div>
              <div class="flex items-center justify-between px-8 py-5 border-b border-foreground/5">
                <span class="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground">Small</span>
                <ToggleGroup type="single" value={toggleSm()} onChange={(v) => setToggleSm(v as string | null)} size="sm">
                  <ToggleGroupItem value="a">Alpha</ToggleGroupItem>
                  <ToggleGroupItem value="b">Beta</ToggleGroupItem>
                  <ToggleGroupItem value="c">Gamma</ToggleGroupItem>
                </ToggleGroup>
              </div>
              <div class="flex items-center justify-between px-8 py-5">
                <span class="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground">X-Small</span>
                <ToggleGroup type="single" value={toggleXs()} onChange={(v) => setToggleXs(v as string | null)} size="xs">
                  <ToggleGroupItem value="a">Alpha</ToggleGroupItem>
                  <ToggleGroupItem value="b">Beta</ToggleGroupItem>
                  <ToggleGroupItem value="c">Gamma</ToggleGroupItem>
                </ToggleGroup>
              </div>
            </div>
          </div>
        </div>

        {/* Radio Groups */}
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-x-10 gap-y-6 mt-6">
          <div class="space-y-3">
            <h3 class="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-70 mb-3">
              Radio Group
            </h3>
            <div class="space-y-6 bg-foreground/[0.005] dark:bg-foreground/[0.02] p-8 rounded-2xl border border-foreground/10">
              <RadioGroup value={radioValue()} onChange={setRadioValue} label="Notification preferences" class="space-y-3">
                <For each={radioOptions}>{(option) => (
                  <label
                    class={`flex items-center gap-3 ${option.disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
                  >
                    <RadioGroupItem value={option.value} disabled={option.disabled} />
                    <span class={`text-sm ${option.disabled ? "text-muted-foreground/50" : ""}`}>
                      {option.label}
                    </span>
                  </label>
                )}</For>
              </RadioGroup>
              <p class="text-xs text-muted-foreground/60">
                Selected: <span class="font-medium text-primary">{selectedLabel()}</span>
              </p>
            </div>
          </div>

          <div class="space-y-3">
            <h3 class="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-70 mb-3">
              Radio Sizes
            </h3>
            <div class="space-y-6 bg-foreground/[0.005] dark:bg-foreground/[0.02] p-8 rounded-2xl border border-foreground/10">
              <RadioGroup value={radioSize()} onChange={setRadioSize} label="Radio button sizes" class="space-y-3">
                <label class="flex items-center gap-3 cursor-pointer">
                  <RadioGroupItem value="sm" size="sm" />
                  <span class="text-sm">Small (20px)</span>
                </label>
                <label class="flex items-center gap-3 cursor-pointer">
                  <RadioGroupItem value="md" size="md" />
                  <span class="text-sm">Medium (24px) - Default</span>
                </label>
                <label class="flex items-center gap-3 cursor-pointer">
                  <RadioGroupItem value="lg" size="lg" />
                  <span class="text-sm">Large (28px)</span>
                </label>
              </RadioGroup>
            </div>
          </div>
        </div>

        {/* Sliders */}
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-x-10 gap-y-6 mt-6">
          <div class="space-y-3">
            <h3 class="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-70 mb-3">
              Sliders
            </h3>
            <div class="space-y-8 bg-foreground/[0.005] dark:bg-foreground/[0.02] p-8 rounded-2xl border border-foreground/10">
              <div class="space-y-2">
                <span class="text-sm text-muted-foreground">Basic Slider: {sliderValue()}</span>
                <Slider value={sliderValue()} onChange={setSliderValue} />
              </div>
              <div class="space-y-2">
                <span class="text-sm text-muted-foreground">With Steps & Value</span>
                <Slider
                  value={sliderSteps()}
                  onChange={setSliderSteps}
                  min={0}
                  max={100}
                  step={10}
                  showSteps
                  showValue
                />
              </div>
              <div class="space-y-2">
                <span class="text-sm text-muted-foreground">
                  Range: {rangeValue()[0]} - {rangeValue()[1]}
                </span>
                <Slider
                  value={rangeValue()}
                  onChange={(v) => setRangeValue(v as [number, number])}
                  showValue
                />
              </div>
            </div>
          </div>

          <div class="space-y-3">
            <h3 class="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-70 mb-3">
              Progress Bars
            </h3>
            <div class="space-y-6 bg-foreground/[0.005] dark:bg-foreground/[0.02] p-8 rounded-2xl border border-foreground/10">
              <div class="space-y-2">
                <div class="flex justify-between text-sm text-muted-foreground">
                  <span>Default (synced with slider)</span>
                  <span>{sliderValue()}%</span>
                </div>
                <Progress value={sliderValue()} />
              </div>
              <div class="space-y-2">
                <span class="text-sm text-muted-foreground">Indeterminate</span>
                <Progress value={null} />
              </div>
              <div class="space-y-2">
                <span class="text-sm text-muted-foreground">Buffer Variant</span>
                <Progress value={null} variant="buffer" />
              </div>
              <div class="space-y-2">
                <span class="text-sm text-muted-foreground">Query Variant</span>
                <Progress value={null} variant="query" />
              </div>
            </div>
          </div>
        </div>

        {/* Calendars */}
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-x-10 gap-y-6 mt-6">
          <div class="space-y-3">
            <h3 class="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-70 mb-3">
              Calendar - Single Date
            </h3>
            <div class="bg-foreground/[0.005] dark:bg-foreground/[0.02] p-8 rounded-2xl border border-foreground/10 flex flex-col items-center">
              <div class="rounded-xl border border-foreground/10 dark:border-white/10 bg-background dark:bg-card shadow-lg">
                <Calendar
                  value={singleDate()}
                  mode="single"
                  onSelect={(date) => setSingleDate(date as Date | null)}
                />
              </div>
              <p class="text-xs text-muted-foreground/60 mt-2">
                Selected:{" "}
                <span class="font-medium text-primary">
                  {singleDate()?.toLocaleDateString() || "None"}
                </span>
              </p>
            </div>
          </div>

          <div class="space-y-3">
            <h3 class="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-70 mb-3">
              Calendar - Date Range
            </h3>
            <div class="bg-foreground/[0.005] dark:bg-foreground/[0.02] p-8 rounded-2xl border border-foreground/10 flex flex-col items-center">
              <div class="rounded-xl border border-foreground/10 dark:border-white/10 bg-background dark:bg-card shadow-lg">
                <Calendar
                  value={dateRange()}
                  mode="range"
                  onSelect={(range) => setDateRange(range as DateRange)}
                />
              </div>
              <p class="text-xs text-muted-foreground/60 mt-2">
                Range:{" "}
                <span class="font-medium text-primary">
                  {dateRange().start?.toLocaleDateString() || "..."} → {dateRange().end?.toLocaleDateString() || "..."}
                </span>
              </p>
            </div>
          </div>
        </div>

      </section>
    </>
  );
}

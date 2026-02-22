import { createSignal, For } from "solid-js";
import { Input } from "~/components/atoms/Input";
import { Textarea } from "~/components/atoms/Textarea";
import { PasswordInput } from "~/components/molecules/PasswordInput";
import { NumberInput } from "~/components/molecules/NumberInput/NumberInput";
import { Icon } from "~/components/atoms/Icon";
import { Select, SelectItem } from "~/components/molecules/Select";
import { MultiSelect, MultiSelectItem } from "~/components/molecules/MultiSelect";
import { Combobox, type ComboboxItem } from "~/components/molecules/Combobox";
import { DatePicker } from "~/components/molecules/DatePicker";
import { TimePicker } from "~/components/molecules/TimePicker";

// ============================================================================
// TYPES
// ============================================================================

export interface InputsSectionProps {}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function InputsSection(_props: InputsSectionProps) {
  // Options for demos
  const memberOptions = [
    { value: "user1", label: "Alex Johnson" },
    { value: "user2", label: "Maria Garcia" },
    { value: "user3", label: "David Chen" },
    { value: "user4", label: "Sarah Williams" },
  ];

  const skillOptions = [
    { value: "react", label: "React" },
    { value: "typescript", label: "TypeScript" },
    { value: "node", label: "Node.js" },
    { value: "python", label: "Python" },
    { value: "go", label: "Go" },
    { value: "rust", label: "Rust" },
  ];

  // Combobox items (needs label/value structure)
  const comboboxItems: ComboboxItem[] = memberOptions.map(o => ({ label: o.label, value: o.value }));

  // State for demos
  const [selectedMember, setSelectedMember] = createSignal<string | undefined>();
  const [selectedMemberSm, setSelectedMemberSm] = createSignal<string | undefined>();
  const [multiSelectValues, setMultiSelectValues] = createSignal<string[]>([]);
  const [multiSelectValuesCompact, setMultiSelectValuesCompact] = createSignal<string[]>([]);
  const [comboboxValue, setComboboxValue] = createSignal<string | undefined>();
  const [dateValue, setDateValue] = createSignal<Date | null>(new Date());
  const [dateValueSm, setDateValueSm] = createSignal<Date | null>(null);
  const [timeValue, setTimeValue] = createSignal("09:00");
  const [timeValueSm, setTimeValueSm] = createSignal("14:30");

  // NumberInput demos
  const [numRate, setNumRate] = createSignal("25.00");
  const [numHours, setNumHours] = createSignal("15");
  const [numWeeks, setNumWeeks] = createSignal("");
  const [numError, setNumError] = createSignal("42");

  return (
    <>
      {/* Inputs Section */}
      <section class="mb-12">
        <h2 class="text-2xl font-semibold mb-6 border-b border-border pb-2 text-foreground">
          Inputs
        </h2>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-x-10 gap-y-6 mt-6">
          {/* States Column */}
          <div class="space-y-3">
            <h3 class="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-70 mb-3">
              Input States
            </h3>
            <div class="space-y-6 bg-foreground/[0.005] dark:bg-foreground/[0.02] p-8 rounded-2xl border border-foreground/10">
              <div class="space-y-2">
                <span class="text-[10px] font-bold uppercase tracking-widest opacity-40">Default</span>
                <Input id="input-default" placeholder="Enter business name..." />
              </div>
              <div class="space-y-2">
                <span class="text-[10px] font-bold uppercase tracking-widest text-danger/60">Error State</span>
                <Input id="input-error" placeholder="Invalid profile URL" variant="error" />
              </div>
              <div class="space-y-2 opacity-50">
                <span class="text-[10px] font-bold uppercase tracking-widest opacity-40">Disabled State</span>
                <Input id="input-disabled" placeholder="Locked by administrator" disabled />
              </div>
            </div>
          </div>

          {/* Scales Column */}
          <div class="space-y-3">
            <h3 class="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-70 mb-3">
              Sizes
            </h3>
            <div class="space-y-5 bg-foreground/[0.005] dark:bg-foreground/[0.02] p-8 rounded-2xl border border-foreground/10">
              <div class="space-y-2">
                <span class="text-[10px] font-bold uppercase tracking-widest opacity-40">Large (44px)</span>
                <Input id="input-lg" placeholder="High priority search..." size="lg" />
              </div>
              <div class="space-y-2">
                <span class="text-[10px] font-bold uppercase tracking-widest opacity-40">Default (40px)</span>
                <Input id="input-default-size" placeholder="Standard listing..." size="default" />
              </div>
              <div class="space-y-2">
                <span class="text-[10px] font-bold uppercase tracking-widest opacity-40">Small (36px)</span>
                <Input id="input-sm" placeholder="Filter parameters..." size="sm" />
              </div>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-x-10 gap-y-6 mt-6">
          {/* Floating Labels */}
          <div class="space-y-3">
            <h3 class="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-70 mb-3">
              Floating Labels
            </h3>
            <div class="space-y-6 bg-foreground/[0.005] dark:bg-foreground/[0.02] p-8 rounded-2xl border border-foreground/10">
              <div class="space-y-2">
                <span class="text-[10px] font-bold uppercase tracking-widest opacity-40">Standard Floating</span>
                <Input id="input-floating-1" label="Business Name" floating />
              </div>
              <div class="space-y-2">
                <span class="text-[10px] font-bold uppercase tracking-widest opacity-40">Floating with Icon</span>
                <Input
                  id="input-floating-2"
                  label="Search Database"
                  floating
                  leftIcon={<Icon name="search" size={18} class="text-muted-foreground/60" />}
                />
              </div>
            </div>
          </div>

          {/* Icon Integration */}
          <div class="space-y-3">
            <h3 class="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-70 mb-3">
              Icon Integration
            </h3>
            <div class="space-y-6 bg-foreground/[0.005] dark:bg-foreground/[0.02] p-8 rounded-2xl border border-foreground/10">
              <div class="space-y-2">
                <span class="text-[10px] font-bold uppercase tracking-widest opacity-40">Left Icon</span>
                <Input
                  id="input-left-icon"
                  placeholder="Query dataset..."
                  leftIcon={<Icon name="search" size={18} class="text-muted-foreground/60" />}
                />
              </div>
              <div class="space-y-2">
                <span class="text-[10px] font-bold uppercase tracking-widest opacity-40">Right Icon</span>
                <Input
                  id="input-right-icon"
                  placeholder="Member ID..."
                  rightIcon={<Icon name="verified" size={18} class="text-green/60" filled />}
                />
              </div>
              <div class="space-y-2">
                <span class="text-[10px] font-bold uppercase tracking-widest opacity-40">Password Input</span>
                <PasswordInput id="input-password" placeholder="Enter password..." />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Textarea Section */}
      <section class="mb-12">
        <h2 class="text-2xl font-semibold mb-6 border-b border-border pb-2 text-foreground">
          Textareas
        </h2>
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-x-10 gap-y-8">
          <div class="space-y-3">
            <h3 class="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-70">
              Standard Textarea
            </h3>
            <div class="space-y-6 bg-foreground/[0.005] dark:bg-foreground/[0.02] p-8 rounded-2xl border border-foreground/10">
              <div class="space-y-2">
                <span class="text-[10px] font-bold uppercase tracking-widest opacity-40">Small (Default)</span>
                <Textarea id="sm-textarea" placeholder="Member bio..." size="sm" />
              </div>
              <div class="space-y-2">
                <span class="text-[10px] font-bold uppercase tracking-widest opacity-40">Medium</span>
                <Textarea id="md-textarea" placeholder="Job description..." size="md" />
              </div>
              <div class="space-y-2">
                <span class="text-[10px] font-bold uppercase tracking-widest opacity-40">Large</span>
                <Textarea id="lg-textarea" placeholder="Detailed requirements..." size="lg" />
              </div>
            </div>
          </div>
          <div class="space-y-3">
            <h3 class="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-70">
              Auto-Growing
            </h3>
            <div class="space-y-6 bg-foreground/[0.005] dark:bg-foreground/[0.02] p-8 rounded-2xl border border-foreground/10">
              <div class="space-y-2">
                <span class="text-[10px] font-bold uppercase tracking-widest opacity-40">Auto-Expansion</span>
                <Textarea
                  id="autogrow-textarea"
                  placeholder="Enter member bio... (type to expand)"
                  size="sm"
                  autoGrow
                />
                <p class="text-[10px] leading-none opacity-50">
                  Automatically adjusts height based on content volume.
                </p>
              </div>
              <div class="space-y-2">
                <span class="text-[10px] font-bold uppercase tracking-widest text-danger/60">Error State</span>
                <Textarea
                  id="error-textarea"
                  placeholder="Invalid content..."
                  size="sm"
                  variant="error"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Number Inputs Section */}
      <section class="mb-12">
        <h2 class="text-2xl font-semibold mb-6 border-b border-border pb-2 text-foreground">
          Number Inputs
        </h2>
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-x-10 gap-y-8">
          <div class="space-y-3">
            <h3 class="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-70">
              Prefix & Suffix
            </h3>
            <div class="space-y-6 bg-foreground/[0.005] dark:bg-foreground/[0.02] p-8 rounded-2xl border border-foreground/10">
              <div class="space-y-2">
                <span class="text-[10px] font-bold uppercase tracking-widest opacity-40">Currency (Prefix + Suffix)</span>
                <NumberInput
                  value={numRate()}
                  onInput={setNumRate}
                  label="Hourly Rate"
                  prefix="$"
                  suffix="/hr"
                  allowDecimal
                  size="lg"
                />
              </div>
              <div class="space-y-2">
                <span class="text-[10px] font-bold uppercase tracking-widest opacity-40">Suffix Only</span>
                <NumberInput
                  value={numHours()}
                  onInput={setNumHours}
                  label="Hours per Week"
                  suffix="hrs"
                  size="lg"
                />
              </div>
              <div class="space-y-2">
                <span class="text-[10px] font-bold uppercase tracking-widest opacity-40">With Placeholder</span>
                <NumberInput
                  value={numWeeks()}
                  onInput={setNumWeeks}
                  label="Duration (optional)"
                  placeholder="12"
                  suffix="wks"
                  size="lg"
                />
              </div>
            </div>
          </div>

          <div class="space-y-3">
            <h3 class="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-70">
              Sizes & States
            </h3>
            <div class="space-y-6 bg-foreground/[0.005] dark:bg-foreground/[0.02] p-8 rounded-2xl border border-foreground/10">
              <div class="space-y-2">
                <span class="text-[10px] font-bold uppercase tracking-widest opacity-40">Small</span>
                <NumberInput
                  value="100"
                  label="Quantity"
                  size="sm"
                />
              </div>
              <div class="space-y-2">
                <span class="text-[10px] font-bold uppercase tracking-widest opacity-40">Default</span>
                <NumberInput
                  value="250"
                  label="Budget"
                  prefix="$"
                  allowDecimal
                />
              </div>
              <div class="space-y-2">
                <span class="text-[10px] font-bold uppercase tracking-widest text-danger/60">Error State</span>
                <NumberInput
                  value={numError()}
                  onInput={setNumError}
                  label="Max Entries"
                  error
                  errorMessage="Must be between 1 and 20"
                  size="lg"
                />
              </div>
              <div class="space-y-2 opacity-50">
                <span class="text-[10px] font-bold uppercase tracking-widest opacity-40">Disabled</span>
                <NumberInput
                  value="0"
                  label="Locked Field"
                  disabled
                  size="lg"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Dropdowns & Selectors Section */}
      <section class="mb-12">
        <h2 class="text-2xl font-semibold mb-6 border-b border-border pb-2 text-foreground">
          Dropdowns & Selectors
        </h2>
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-x-10 gap-y-8">
          {/* Single Selection */}
          <div class="space-y-3">
            <h3 class="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-70">
              Single Selection
            </h3>
            <div class="space-y-6 bg-foreground/[0.005] dark:bg-foreground/[0.02] p-8 rounded-2xl border border-foreground/10">
              <div class="space-y-2">
                <span class="text-[10px] font-bold uppercase tracking-widest opacity-40">Standard Select</span>
                <Select
                  value={selectedMember()}
                  onChange={setSelectedMember}
                  placeholder="Pick a member..."
                >
                  <For each={memberOptions}>
                    {(option) => (
                      <SelectItem value={option.value} label={option.label}>
                        {option.label}
                      </SelectItem>
                    )}
                  </For>
                </Select>
              </div>
              <div class="space-y-2">
                <span class="text-[10px] font-bold uppercase tracking-widest opacity-40">Small Variant</span>
                <Select
                  value={selectedMemberSm()}
                  onChange={setSelectedMemberSm}
                  placeholder="Filter by member..."
                  size="sm"
                >
                  <For each={memberOptions}>
                    {(option) => (
                      <SelectItem value={option.value} label={option.label}>
                        {option.label}
                      </SelectItem>
                    )}
                  </For>
                </Select>
              </div>
            </div>
          </div>

          {/* Multi Selection */}
          <div class="space-y-3">
            <h3 class="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-70">
              Multi Selection
            </h3>
            <div class="space-y-6 bg-foreground/[0.005] dark:bg-foreground/[0.02] p-8 rounded-2xl border border-foreground/10">
              <div class="space-y-2">
                <span class="text-[10px] font-bold uppercase tracking-widest opacity-40">Standard Multi-Select</span>
                <MultiSelect
                  value={multiSelectValues()}
                  onChange={setMultiSelectValues}
                  placeholder="Select skills..."
                >
                  <For each={skillOptions}>
                    {(option) => (
                      <MultiSelectItem value={option.value} label={option.label}>
                        {option.label}
                      </MultiSelectItem>
                    )}
                  </For>
                </MultiSelect>
              </div>
              <div class="space-y-2">
                <span class="text-[10px] font-bold uppercase tracking-widest opacity-40">High-Density (Max 2 Chips)</span>
                <MultiSelect
                  value={multiSelectValuesCompact()}
                  onChange={setMultiSelectValuesCompact}
                  placeholder="Profile skill view..."
                  maxChips={2}
                >
                  <For each={skillOptions}>
                    {(option) => (
                      <MultiSelectItem value={option.value} label={option.label}>
                        {option.label}
                      </MultiSelectItem>
                    )}
                  </For>
                </MultiSelect>
              </div>
            </div>
          </div>
        </div>

        {/* DateTime Pickers */}
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-x-10 gap-y-8 mt-6">
          <div class="space-y-3">
            <h3 class="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-70">
              Date Selection
            </h3>
            <div class="space-y-6 bg-foreground/[0.005] dark:bg-foreground/[0.02] p-8 rounded-2xl border border-foreground/10">
              <div class="space-y-2">
                <span class="text-[10px] font-bold uppercase tracking-widest opacity-40">Standard Date Picker</span>
                <DatePicker
                  value={dateValue()}
                  onChange={setDateValue}
                  placeholder="Select start date..."
                />
              </div>
              <div class="space-y-2">
                <span class="text-[10px] font-bold uppercase tracking-widest opacity-40">Small Variant</span>
                <DatePicker
                  value={dateValueSm()}
                  onChange={setDateValueSm}
                  placeholder="Filter by date..."
                  size="sm"
                />
              </div>
            </div>
          </div>

          <div class="space-y-3">
            <h3 class="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-70">
              Time Selection
            </h3>
            <div class="space-y-6 bg-foreground/[0.005] dark:bg-foreground/[0.02] p-8 rounded-2xl border border-foreground/10">
              <div class="space-y-2">
                <span class="text-[10px] font-bold uppercase tracking-widest opacity-40">Standard Time Picker</span>
                <TimePicker
                  value={timeValue()}
                  onChange={setTimeValue}
                />
              </div>
              <div class="space-y-2">
                <span class="text-[10px] font-bold uppercase tracking-widest opacity-40">Small Variant</span>
                <TimePicker
                  value={timeValueSm()}
                  onChange={setTimeValueSm}
                  size="sm"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Searchable Combobox */}
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-x-10 gap-y-8 mt-6">
          <div class="space-y-3">
            <h3 class="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-70">
              Searchable Combobox
            </h3>
            <div class="space-y-6 bg-foreground/[0.005] dark:bg-foreground/[0.02] p-8 rounded-2xl border border-foreground/10">
              <div class="space-y-2">
                <span class="text-[10px] font-bold uppercase tracking-widest opacity-40">Search & Select</span>
                <Combobox
                  items={comboboxItems}
                  value={comboboxValue()}
                  onChange={setComboboxValue}
                  placeholder="Filter items..."
                />
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

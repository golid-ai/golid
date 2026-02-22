// ============================================================================
// GOLID COMPONENT LIBRARY - Barrel Export
// ============================================================================
// Export all components from their respective files.
// Components are organized: atoms → molecules → organisms
// ============================================================================

// =============================================================================
// REAL COMPONENTS (atoms)
// =============================================================================

export {
  Button,
  buttonVariants,
  type ButtonProps,
  type ButtonVariant,
  type ButtonSize,
} from "./atoms/Button";

export { Icon, type IconProps } from "./atoms/Icon";
export { Input, type InputProps, type InputSize, type InputVariant } from "./atoms/Input";
export { Textarea, type TextareaProps, type TextareaSize, type TextareaVariant } from "./atoms/Textarea";
export { Checkbox, type CheckboxProps, type CheckboxSize } from "./atoms/Checkbox";
export { Switch, type SwitchProps, type SwitchSize, type SwitchColor } from "./atoms/Switch";
export { Chip, type ChipProps, type ChipVariant, type ChipSize } from "./atoms/Chip";
export { Calendar, type CalendarProps, type CalendarMode, type DateRange } from "./atoms/Calendar";
export { Slider, type SliderProps } from "./atoms/Slider";
export { Progress, type ProgressProps, type ProgressVariant } from "./atoms/Progress";
export { StarRating, type StarRatingProps } from "./atoms/StarRating/StarRating";
export { Badge, type BadgeProps, type BadgeVariant, type BadgeSize } from "./atoms/Badge";
export { Label, type LabelProps } from "./atoms/Label";
export { Link, type LinkProps, type LinkVariant } from "./atoms/Link";
export { Tooltip, type TooltipProps, type TooltipPosition } from "./atoms/Tooltip";
export { Spinner, type SpinnerProps, type SpinnerSize, type SpinnerVariant, type SpinnerColor } from "./atoms/Spinner";
export { Modal, type ModalProps } from "./atoms/Modal";
export { ComingSoon } from "./atoms/ComingSoon";
export { Avatar, type AvatarProps, type AvatarSize } from "./atoms/Avatar";
export {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
  type CardProps,
  type CardHeaderProps,
  type CardTitleProps,
  type CardContentProps,
  type CardFooterProps,
} from "./atoms/Card";

// =============================================================================
// REAL COMPONENTS (molecules)
// =============================================================================

export { PasswordInput, type PasswordInputProps } from "./molecules/PasswordInput";
export { NumberInput, type NumberInputProps, type NumberInputSize } from "./molecules/NumberInput/NumberInput";
export { Select, SelectItem, type SelectProps, type SelectItemProps, type SelectSize } from "./molecules/Select";
export { RadioGroup, RadioGroupItem, type RadioGroupProps, type RadioGroupItemProps, type RadioGroupItemSize } from "./molecules/RadioGroup";
export { MultiSelect, MultiSelectItem, type MultiSelectProps, type MultiSelectItemProps, type MultiSelectSize } from "./molecules/MultiSelect";
export { Combobox, type ComboboxProps, type ComboboxItem, type ComboboxSize } from "./molecules/Combobox";
export { DatePicker, DateRangePicker, type DatePickerProps, type DatePickerSize, type DateRangePickerProps, type DateRangePickerSize } from "./molecules/DatePicker";
export { TimePicker, type TimePickerProps, type TimePickerSize } from "./molecules/TimePicker";
export { ToggleGroup, ToggleGroupItem, type ToggleGroupProps, type ToggleGroupItemProps, type ToggleGroupType, type ToggleGroupVariant, type ToggleGroupSize } from "./molecules/ToggleGroup";
export { IconBadge, type IconBadgeProps } from "./molecules/IconBadge";
export { Alert, AlertTitle, AlertDescription, type AlertProps, type AlertTitleProps, type AlertDescriptionProps, type AlertVariant } from "./molecules/Alert";
export { Toaster, Toast, type ToastProps } from "./molecules/Toaster";
export { Snackbar, SnackbarManager, type SnackbarProps } from "./molecules/Snackbar";
export { LoadingOverlay } from "./molecules/LoadingOverlay";
export { Widget, type WidgetProps } from "./molecules/Widget";
export { ConfirmModal, InputModal, DestructiveModal, type ConfirmModalProps, type InputModalProps, type DestructiveModalProps } from "./molecules/Modal";
export {
  Menu,
  MenuTrigger,
  MenuContent,
  MenuItem,
  Submenu,
  SubmenuTrigger,
  SubmenuContent,
  MenuSeparator,
  type MenuProps,
  type MenuTriggerProps,
  type MenuContentProps,
  type MenuItemProps,
  type SubmenuProps,
  type SubmenuTriggerProps,
  type SubmenuContentProps,
  type MenuPosition,
} from "./molecules/Menu";
export { Pagination, type PaginationProps } from "./molecules/Pagination/Pagination";
export { Tabs, TabList, Tab, TabPanel, type TabsProps, type TabListProps, type TabProps, type TabPanelProps } from "./molecules/Tabs/Tabs";
export {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
  type AccordionProps,
  type AccordionItemProps,
  type AccordionTriggerProps,
  type AccordionContentProps,
  type AccordionType,
} from "./molecules/Accordion/Accordion";
export { Breadcrumbs, type BreadcrumbsProps, type BreadcrumbItem, type BreadcrumbSize } from "./molecules/Breadcrumbs/Breadcrumbs";
export { Dropzone, type DropzoneProps } from "./molecules/Dropzone/Dropzone";
export { SortableList, type SortableListProps, type SortableItem } from "./molecules/SortableList/SortableList";
export { Canvas3D, type Canvas3DProps } from "./molecules/Canvas3D/Canvas3D";
export { VideoRecorder, type VideoRecorderProps } from "./molecules/VideoRecorder/VideoRecorder";
export { PlotGraph, type PlotGraphProps } from "./molecules/PlotGraph/PlotGraph";
export { BarGraph, type BarGraphProps } from "./molecules/Charts/BarGraph";
export { LineGraph, type LineGraphProps } from "./molecules/Charts/LineGraph";
export { ScatterGraph, type ScatterGraphProps } from "./molecules/Charts/ScatterGraph";
export { HeatmapGraph, type HeatmapGraphProps } from "./molecules/Charts/HeatmapGraph";
export { RadarGraph, type RadarGraphProps, type RadarData } from "./molecules/Charts/RadarGraph";
export { ScatterQuadrant, type ScatterQuadrantProps } from "./molecules/Charts/ScatterQuadrant";
export { MatrixGraph, type MatrixGraphProps } from "./molecules/Charts/MatrixGraph";
export { HexbinChart, type HexbinChartProps } from "./molecules/Charts/HexbinChart";
export { StackedArea, type StackedAreaProps } from "./molecules/Charts/StackedArea";
export { ActivityGrid, type ActivityGridProps } from "./molecules/Charts/ActivityGrid";
export { TimelineGraph, type TimelineGraphProps } from "./molecules/Charts/TimelineGraph";
export { AreaComparison, type AreaComparisonProps } from "./molecules/Charts/AreaComparison";
export { StepGraph, type StepGraphProps } from "./molecules/Charts/StepGraph";
export { BoxGraph, type BoxGraphProps } from "./molecules/Charts/BoxGraph";
export { TreeGraph, type TreeGraphProps } from "./molecules/Charts/TreeGraph";
export { BarRace, type BarRaceProps } from "./molecules/Charts/BarRace";
export { GeoPlot, type GeoPlotProps, type LocationData } from "./molecules/GeoPlot/GeoPlot";

// =============================================================================
// REAL COMPONENTS (atoms — data grids)
// =============================================================================

export { AgGrid, type AgGridProps } from "./atoms/AgGrid/AgGrid";

// =============================================================================
// REAL COMPONENTS (organisms)
// =============================================================================

export { Navbar, type NavbarProps } from "./organisms";


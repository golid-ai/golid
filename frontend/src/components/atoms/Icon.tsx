import { splitProps, type Component, type JSX } from "solid-js";
import { cn } from "~/lib/utils";

// ============================================================================
// TYPES
// ============================================================================

export interface IconProps extends JSX.HTMLAttributes<HTMLSpanElement> {
  /** Material Symbols icon name (e.g., "search", "home", "settings") */
  name: string;
  /** Icon size in pixels (default: 24) */
  size?: number;
  /** Use filled variant (default: false = outlined) */
  filled?: boolean;
  /** Icon weight (100-700, default: 400) */
  weight?: number;
  /** Optical size adjustment (20-48, default: 24) */
  opticalSize?: number;
  /** Icon grade (-25 to 200, default: 0) */
  grade?: number;
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * Icon component using Google Material Symbols (Rounded)
 * 
 * @example
 * <Icon name="search" />
 * <Icon name="home" size={20} filled />
 * <Icon name="settings" class="text-primary" />
 */
export const Icon: Component<IconProps> = (props) => {
  const [local, spanProps] = splitProps(props, [
    "name",
    "size",
    "filled",
    "weight",
    "opticalSize",
    "grade",
    "class",
    "style",
  ]);

  const size = () => local.size ?? 24;
  const filled = () => local.filled ?? false;
  const weight = () => local.weight ?? 400;
  const opticalSize = () => local.opticalSize ?? 24;
  const grade = () => local.grade ?? 0;

  // Build font-variation-settings for fine control
  const variationSettings = () => {
    const settings = [
      `'FILL' ${filled() ? 1 : 0}`,
      `'wght' ${weight()}`,
      `'opsz' ${opticalSize()}`,
      `'GRAD' ${grade()}`,
    ];
    return settings.join(", ");
  };

  return (
    <span
      {...spanProps}
      class={cn("material-symbols-rounded leading-none select-none", local.class)}
      style={{
        "font-size": `${size()}px`,
        "font-variation-settings": variationSettings(),
        ...(typeof local.style === "object" ? local.style : {}),
      }}
      aria-hidden="true"
    >
      {local.name}
    </span>
  );
};

export default Icon;

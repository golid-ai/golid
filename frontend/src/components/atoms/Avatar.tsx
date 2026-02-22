import { splitProps, Show, type Component } from "solid-js";
import { cn } from "~/lib/utils";

// ============================================================================
// TYPES
// ============================================================================

export type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl";

export interface AvatarProps {
  /** Image source URL */
  src?: string;
  /** Alt text for the image */
  alt?: string;
  /** Fallback text (initials) shown when no image */
  fallback?: string;
  /** Size variant */
  size?: AvatarSize;
  /** Additional class */
  class?: string;
}

// ============================================================================
// STYLES
// ============================================================================

const sizeStyles: Record<AvatarSize, { container: string; text: string }> = {
  xs: { container: "w-6 h-6", text: "text-[8px]" },
  sm: { container: "w-8 h-8", text: "text-[10px]" },
  md: { container: "w-10 h-10", text: "text-sm" },
  lg: { container: "w-14 h-14", text: "text-lg" },
  xl: { container: "w-20 h-20", text: "text-xl" },
};

// ============================================================================
// COMPONENT
// ============================================================================

export const Avatar: Component<AvatarProps> = (props) => {
  const [local] = splitProps(props, ["src", "alt", "fallback", "size", "class"]);
  const size = () => local.size ?? "md";
  const s = () => sizeStyles[size()];

  const initials = () => {
    if (local.fallback) return local.fallback;
    if (local.alt) return local.alt.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
    return "?";
  };

  return (
    <div class={cn("relative rounded-full overflow-hidden bg-muted flex items-center justify-center shrink-0", s().container, local.class)}>
      <Show
        when={local.src}
        fallback={
          <span class={cn("font-bold text-muted-foreground select-none", s().text)}>
            {initials()}
          </span>
        }
      >
        <img
          src={local.src}
          alt={local.alt ?? ""}
          class="w-full h-full object-cover"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.display = "none";
            const fallback = e.currentTarget.nextElementSibling as HTMLElement;
            if (fallback) fallback.style.display = "flex";
          }}
        />
        <span class={cn("font-bold text-muted-foreground select-none absolute inset-0 items-center justify-center bg-muted", s().text)} style={{ display: "none" }}>
          {initials()}
        </span>
      </Show>
    </div>
  );
};

export default Avatar;

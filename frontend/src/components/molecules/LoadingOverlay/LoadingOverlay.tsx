import { createSignal, createEffect, onCleanup, Show, type Component } from "solid-js";
import { ui } from "~/lib/stores/ui";

// ============================================================================
// CONSTANTS
// ============================================================================

const GolidMessages = [
  "Warming up the engines...",
  "Validating protocols...",
  "Matching vibes with ROI...",
  "Optimizing the pipeline...",
  "Calculating coffee-to-code ratios...",
  "Crafting seamless experiences...",
  "Rewriting the rules...",
];

// ============================================================================
// COMPONENT
// ============================================================================

export const LoadingOverlay: Component = () => {
  const [currentMessageIndex, setCurrentMessageIndex] = createSignal(0);
  const [dots, setDots] = createSignal("");
  const [isJiggling, setIsJiggling] = createSignal(false);

  createEffect(() => {
    if (ui.subscribeLoading()) {
      // Start at random message if cycling
      if (!ui.loadingMessage) {
        setCurrentMessageIndex(Math.floor(Math.random() * GolidMessages.length));
      }
      setDots("");

      // Master interval: Controls both dots and word switching
      const intervalId = setInterval(() => {
        if (dots().length >= 3) {
          setDots("");
          // Only switch words if we are in cycle mode (no specific message)
          if (!ui.loadingMessage) {
            setCurrentMessageIndex((prev) => (prev + 1) % GolidMessages.length);
          }
        } else {
          setDots((prev) => prev + ".");
        }
      }, 600);

      // Prevent scrolling
      if (typeof document !== "undefined") {
        document.body.style.overflow = "hidden";
      }

      onCleanup(() => {
        clearInterval(intervalId);
        if (typeof document !== "undefined") {
          document.body.style.overflow = "";
        }
      });
    }
  });

  const baseMessage = () => {
    const msg = ui.loadingMessage || GolidMessages[currentMessageIndex()];
    return msg.replace(/\.+$/, "");
  };

  const handleClick = () => {
    // Jiggle animation on click
    setIsJiggling(true);
    setTimeout(() => setIsJiggling(false), 500);
  };

  return (
    <Show when={ui.subscribeLoading()}>
      <div
        class="loading-overlay-container animate-in fade-in duration-200"
        role="button"
        tabindex="0"
        onClick={handleClick}
        onKeyDown={(e) => e.key === "Enter" && handleClick()}
      >
        <div class="logo-centering-box">
          <div class={`loading-overlay ${isJiggling() ? "animate-jiggle" : ""}`}>
            {/* Arc images with rotation animations */}
            <img
              class="loading-arc"
              src="/images/loading-overlay/bigarc.svg"
              alt=""
              draggable={false}
            />
            <img
              class="loading-arc med-arc"
              src="/images/loading-overlay/medarc.svg"
              alt=""
              draggable={false}
            />
            <img
              class="loading-arc small-arc"
              src="/images/loading-overlay/smallarc.svg"
              alt=""
              draggable={false}
            />
            {/* Golid logo text */}
            <div class="loading-logo">uƒ</div>
          </div>
        </div>
        <div class="loading-message">
          {baseMessage()}
          <span class="animated-dots">{dots()}</span>
        </div>
      </div>
    </Show>
  );
};

export default LoadingOverlay;

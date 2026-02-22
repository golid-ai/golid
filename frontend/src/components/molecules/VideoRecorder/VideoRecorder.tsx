import { createSignal, onCleanup, Show, Switch, Match, type Component } from "solid-js";
import { Button } from "~/components/atoms/Button";
import { Icon } from "~/components/atoms/Icon";
import { cn } from "~/lib/utils";

// ============================================================================
// TYPES
// ============================================================================

export interface VideoRecorderProps {
  /** Callback when recording is complete */
  onRecordingComplete?: (blob: Blob) => void;
  /** Max recording duration in seconds (default: 180 = 3 minutes) */
  maxDuration?: number;
  /** Prompt text shown only during recording */
  prompt?: string;
  /** Additional class */
  class?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const VideoRecorder: Component<VideoRecorderProps> = (props) => {
  const [phase, setPhase] = createSignal<"idle" | "preview" | "recording" | "done">("idle");
  const [recordingTime, setRecordingTime] = createSignal(0);
  const [error, setError] = createSignal("");

  const maxDuration = () => props.maxDuration ?? 180;

  let videoRef: HTMLVideoElement | undefined;
  let stream: MediaStream | null = null;
  let mediaRecorder: MediaRecorder | null = null;
  let recordedChunks: Blob[] = [];
  let timerInterval: ReturnType<typeof setInterval> | undefined;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(1, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  async function initCamera() {
    setError("");
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" },
        audio: true,
      });
      if (videoRef) {
        videoRef.srcObject = stream;
      }
      setPhase("preview");
    } catch {
      setError("Camera access denied. Please allow camera and microphone permissions.");
    }
  }

  function stopCamera() {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      stream = null;
    }
  }

  function startRecording() {
    if (!stream) return;

    recordedChunks = [];
    mediaRecorder = new MediaRecorder(stream, {
      mimeType: "video/webm;codecs=vp8,opus",
    });

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) recordedChunks.push(event.data);
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(recordedChunks, { type: "video/webm" });
      stopCamera();
      props.onRecordingComplete?.(blob);
      setPhase("done");
    };

    mediaRecorder.start();
    setPhase("recording");
    setRecordingTime(0);

    timerInterval = setInterval(() => {
      setRecordingTime((t) => {
        const next = t + 1;
        if (next >= maxDuration()) {
          stopRecording();
        }
        return next;
      });
    }, 1000);
  }

  function stopRecording() {
    if (mediaRecorder && phase() === "recording") {
      mediaRecorder.stop();
      if (timerInterval) clearInterval(timerInterval);
    }
  }

  onCleanup(() => {
    stopCamera();
    if (timerInterval) clearInterval(timerInterval);
  });

  const isActive = () => phase() !== "idle";

  return (
    <div class={cn("w-full", props.class)}>
      {/* Hidden video element -- always in DOM so ref is stable */}
      <video
        ref={videoRef}
        autoplay
        muted
        playsinline
        class="hidden"
      />

      {/* Idle state */}
      <Show when={!isActive()}>
        <div
          class="group relative pt-12 pb-12 w-full text-center rounded-lg border border-foreground/10 transition-all duration-300 bg-foreground/[0.02] hover:bg-primary/5 hover:border-foreground/25 cursor-pointer"
          onClick={initCamera}
        >
          <Icon name="videocam" size={48} class="text-muted-foreground/40 group-hover:text-primary transition-colors duration-300" />
          <h2 class="text-xl font-semibold mt-4 text-foreground">Record your video</h2>
          <p class="text-muted-foreground/40 mb-6">Set up your camera to begin</p>
          <Button onClick={(e: MouseEvent) => { e.stopPropagation(); initCamera(); }}>
            Start Camera
          </Button>
        </div>
      </Show>

      {/* Camera active */}
      <Show when={isActive()}>
        <div class="rounded-lg border border-foreground/10 overflow-hidden bg-foreground/[0.02]">
          {/* Video viewport -- mirrors the hidden video element */}
          <div class="relative w-full aspect-video bg-midnight overflow-hidden">
            <video
              autoplay
              muted
              playsinline
              ref={(el) => {
                // Mirror the stream to this visible video element
                if (stream) el.srcObject = stream;
              }}
              class={cn(
                "w-full h-full object-cover",
                phase() === "done" && "hidden"
              )}
            />

            <Switch>
              <Match when={phase() === "recording"}>
                <div class="absolute top-3 left-3 flex items-center gap-2 px-2.5 py-1 rounded-md bg-black/60 backdrop-blur-sm">
                  <div class="w-2 h-2 bg-red rounded-full animate-pulse" />
                  <span class="text-[10px] font-bold text-white uppercase tracking-wider">REC</span>
                </div>
              </Match>
              <Match when={phase() === "preview"}>
                <div class="absolute inset-0 flex items-center justify-center">
                  <button
                    type="button"
                    onClick={startRecording}
                    class="w-16 h-16 rounded-full bg-red flex items-center justify-center shadow-2xl hover:scale-110 transition-transform active:scale-95"
                    aria-label="Start recording"
                  >
                    <div class="w-5 h-5 bg-white rounded-full" />
                  </button>
                </div>
                <div class="absolute bottom-3 left-0 right-0 text-center">
                  <span class="inline-block px-3 py-1 rounded-full bg-black/50 backdrop-blur-sm text-[10px] text-white/80 font-bold uppercase tracking-wider">
                    Tap to start recording
                  </span>
                </div>
              </Match>
              <Match when={phase() === "done"}>
                <div class="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-midnight">
                  <Icon name="check_circle" size={40} class="text-cta-green" />
                  <p class="text-sm text-white font-medium">Recording captured</p>
                </div>
              </Match>
            </Switch>
          </div>

          <Switch>
            <Match when={phase() === "recording"}>
              <Show when={props.prompt}>
                <div class="px-5 py-3 border-t border-foreground/5 bg-foreground/[0.02]">
                  <p class="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-1">Your Prompt</p>
                  <p class="text-sm font-medium text-foreground">{props.prompt}</p>
                </div>
              </Show>
              <div class="flex items-center justify-between px-5 py-4 border-t border-foreground/5">
                <p class="text-2xl font-bold font-montserrat text-foreground tabular-nums">
                  {formatTime(recordingTime())}
                  <span class="text-muted-foreground/30 text-lg ml-1">/ {formatTime(maxDuration())}</span>
                </p>
                <Button variant="destructive" size="sm" onClick={stopRecording} class="px-6">
                  Stop Recording
                </Button>
              </div>
            </Match>
            <Match when={phase() === "preview"}>
              <div class="flex items-center justify-between px-5 py-3 border-t border-foreground/5">
                <span class="text-xs text-muted-foreground">Max {formatTime(maxDuration())}</span>
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={() => { stopCamera(); setPhase("idle"); }}
                  class="text-muted-foreground"
                >
                  <Icon name="videocam_off" size={14} class="mr-1" />
                  Cancel
                </Button>
              </div>
            </Match>
          </Switch>
        </div>
      </Show>

      {/* Error */}
      <Show when={error()}>
        <div class="mt-4 flex items-center gap-2 px-3 py-2.5 rounded-lg bg-red/10 border border-red/20 text-red text-sm">
          <Icon name="error" size={16} />
          {error()}
        </div>
      </Show>
    </div>
  );
};

export default VideoRecorder;

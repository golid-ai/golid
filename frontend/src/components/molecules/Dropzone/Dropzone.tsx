import { createSignal, For, Show, type Component } from "solid-js";
import { Button } from "~/components/atoms/Button";
import { Icon } from "~/components/atoms/Icon";
import { Progress } from "~/components/atoms/Progress";
import { cn } from "~/lib/utils";

// ============================================================================
// TYPES
// ============================================================================

export interface DropzoneProps {
  /** Callback when files are selected (for real upload integration) */
  onFilesSelected?: (files: File[]) => void;
  /** Accepted file types (e.g. ".csv,.xlsx") */
  accept?: string;
  /** Allow multiple files (default: true) */
  multiple?: boolean;
  /** Accessible label for the drop zone */
  label: string;
  /** Additional class */
  class?: string;
}

interface FileEntry {
  file: File;
  status: "pending" | "uploading" | "complete" | "error";
  progress: number;
  error: string | null;
}

// ============================================================================
// HELPERS
// ============================================================================

function getFileIcon(filename: string): string {
  if (filename.endsWith(".csv")) return "csv";
  if (filename.endsWith(".xls") || filename.endsWith(".xlsx")) return "analytics";
  if (filename.endsWith(".pdf")) return "picture_as_pdf";
  if (filename.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) return "image";
  return "description";
}

// ============================================================================
// COMPONENT
// Native drag-and-drop file upload with file list, progress, and status.
// No external dependencies — uses browser Drag and Drop API.
// ============================================================================

export const Dropzone: Component<DropzoneProps> = (props) => {
  const [files, setFiles] = createSignal<FileEntry[]>([]);
  const [isDragOver, setIsDragOver] = createSignal(false);
  let dragCounter = 0;
  let fileInputRef: HTMLInputElement | undefined;

  function addFiles(newFiles: File[]) {
    const entries: FileEntry[] = newFiles.map((file) => ({
      file,
      status: "pending",
      progress: 0,
      error: null,
    }));
    setFiles((prev) => [...prev, ...entries]);
    props.onFilesSelected?.(newFiles);
  }

  function removeFile(fileToRemove: File) {
    setFiles((prev) => prev.filter((f) => f.file !== fileToRemove));
  }

  function handleDragEnter(e: DragEvent) {
    e.preventDefault();
    dragCounter++;
    setIsDragOver(true);
  }

  function handleDragLeave(e: DragEvent) {
    e.preventDefault();
    dragCounter--;
    if (dragCounter === 0) setIsDragOver(false);
  }

  function handleDragOver(e: DragEvent) {
    e.preventDefault();
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault();
    setIsDragOver(false);
    dragCounter = 0;
    if (e.dataTransfer?.files) {
      addFiles(Array.from(e.dataTransfer.files));
    }
  }

  function handleFileSelected(e: Event) {
    const target = e.target as HTMLInputElement;
    if (target.files) {
      addFiles(Array.from(target.files));
      target.value = ""; // Reset to allow re-selecting same file
    }
  }

  // Simulate upload for demo purposes
  async function simulateUpload() {
    const currentFiles = files();
    for (let i = 0; i < currentFiles.length; i++) {
      const entry = currentFiles[i];
      if (entry.status !== "pending") continue;

      setFiles((prev) =>
        prev.map((f) =>
          f.file === entry.file ? { ...f, status: "uploading", progress: 0 } : f
        )
      );

      // Simulate progress
      for (let p = 0; p <= 100; p += 20) {
        await new Promise((r) => setTimeout(r, 150));
        setFiles((prev) =>
          prev.map((f) =>
            f.file === entry.file ? { ...f, progress: Math.min(p, 100) } : f
          )
        );
      }

      // Random success/failure for demo
      const success = Math.random() > 0.15;
      setFiles((prev) =>
        prev.map((f) =>
          f.file === entry.file
            ? {
                ...f,
                status: success ? "complete" : "error",
                progress: 100,
                error: success ? null : "Upload failed",
              }
            : f
        )
      );
    }
  }

  const hasFiles = () => files().length > 0;
  const isUploading = () => files().some((f) => f.status === "uploading");
  const allComplete = () =>
    hasFiles() && files().every((f) => f.status === "complete");

  return (
    <div class={props.class}>
      {/* Drop Zone */}
      <div
        role="button"
        tabindex="0"
        aria-label={props.label}
        class={cn(
          "relative pt-10 pb-10 w-full text-center cursor-pointer rounded-lg border-2 border-dashed transition-all duration-300 bg-foreground/[0.02] hover:bg-primary/5 border-foreground/10",
          "focus-visible:outline-none focus-visible:border-foreground/40 focus-visible:bg-foreground/[0.04]",
          isDragOver() &&
            "border-primary bg-primary/5 shadow-[0_0_20px_rgba(27,157,120,0.1)]"
        )}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => fileInputRef?.click()}
        onKeyDown={(e) =>
          (e.key === "Enter" || e.key === " ") && fileInputRef?.click()
        }
      >
        <div class="pointer-events-none">
          <Icon
            name="upload_file"
            size={48}
            class={cn(
              "transition-colors duration-300 text-muted-foreground/40",
              isDragOver() && "text-primary"
            )}
          />
          <h2 class="text-xl font-semibold mt-4 text-foreground transition-colors duration-300">
            Drop files to upload
          </h2>
          <p class="text-muted-foreground/40 mb-6">or</p>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          multiple={props.multiple ?? true}
          accept={props.accept}
          class="hidden"
          onChange={handleFileSelected}
          disabled={isUploading()}
        />
        <Button
          onClick={(e: MouseEvent) => e.stopPropagation()}
          disabled={isUploading()}
        >
          Browse Files
        </Button>
      </div>

      {/* File List */}
      <Show when={hasFiles()}>
        <div class="w-full mt-8" aria-live="polite" aria-label="Selected files">
          <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <For each={files()}>
              {(entry) => (
                <div class="bg-foreground/[0.03] border border-foreground/10 text-center rounded-lg p-4 flex flex-col items-center justify-center">
                  <div class="relative w-full flex justify-center">
                    <Icon
                      name={getFileIcon(entry.file.name)}
                      size={48}
                      class="text-primary/60"
                    />

                    {/* Status overlay */}
                    <Show when={entry.status === "uploading"}>
                      <div class="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-[2px] rounded-md" />
                    </Show>
                    <Show when={entry.status === "complete"}>
                      <div class="absolute top-1 right-1 flex items-center justify-center bg-primary rounded-full h-6 w-6">
                        <Icon name="check" size={16} class="text-primary-foreground" />
                      </div>
                    </Show>
                    <Show when={entry.status === "error"}>
                      <div class="absolute top-1 right-1 flex items-center justify-center bg-danger rounded-full h-6 w-6">
                        <Icon name="close" size={16} class="text-danger-foreground" />
                      </div>
                    </Show>
                    <Show when={entry.status === "pending"}>
                      <Button
                        variant="ghost"
                        onClick={() => removeFile(entry.file)}
                        class="absolute top-1 right-1 bg-background hover:bg-danger hover:text-danger-foreground transition-colors rounded-full flex items-center justify-center h-6 w-6 group p-0 border border-foreground/10 shadow-sm"
                      >
                        <Icon
                          name="close"
                          size={16}
                          class="text-foreground/60 group-hover:text-inherit transition-colors"
                        />
                      </Button>
                    </Show>
                  </div>

                  <p
                    class="text-xs font-medium text-foreground/80 mt-2 truncate w-full"
                    title={entry.file.name}
                  >
                    {entry.file.name}
                  </p>

                  <Show when={entry.status === "uploading"}>
                    <Progress value={entry.progress} class="w-full h-1 mt-2" />
                  </Show>
                  <Show when={entry.error}>
                    <p class="text-xs text-danger mt-1">{entry.error}</p>
                  </Show>
                </div>
              )}
            </For>
          </div>
          <div class="mt-8 flex justify-end">
            <Button
              onClick={simulateUpload}
              disabled={isUploading() || allComplete()}
              variant="green"
            >
              <Icon name="upload" size={16} class="mr-2" />
              Upload Selected Files
            </Button>
          </div>
        </div>
      </Show>
    </div>
  );
};

export default Dropzone;

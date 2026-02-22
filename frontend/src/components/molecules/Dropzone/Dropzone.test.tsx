import { describe, test, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@solidjs/testing-library";
import { Dropzone } from "./Dropzone";

function createMockFile(name: string, type: string, size = 1024): File {
  const blob = new Blob(["x".repeat(size)], { type });
  return new File([blob], name, { type });
}

describe("Dropzone", () => {
  test("renders drop area with label", () => {
    render(() => <Dropzone label="Upload documents" />);
    expect(screen.getByLabelText("Upload documents")).toBeInTheDocument();
  });

  test("renders instructional text and browse button", () => {
    render(() => <Dropzone label="Upload" />);
    expect(screen.getByText("Drop files to upload")).toBeInTheDocument();
    expect(screen.getByText("Browse Files")).toBeInTheDocument();
  });

  test("fires onFilesSelected when files are dropped", async () => {
    const onFilesSelected = vi.fn();
    render(() => <Dropzone label="Upload" onFilesSelected={onFilesSelected} />);
    const dropArea = screen.getByLabelText("Upload");

    const file = createMockFile("report.csv", "text/csv");
    const dataTransfer = { files: [file] };

    await fireEvent.drop(dropArea, { dataTransfer });
    expect(onFilesSelected).toHaveBeenCalledWith([file]);
  });

  test("displays file name after drop", async () => {
    render(() => <Dropzone label="Upload" />);
    const dropArea = screen.getByLabelText("Upload");

    const file = createMockFile("data.xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    await fireEvent.drop(dropArea, { dataTransfer: { files: [file] } });

    expect(screen.getByText("data.xlsx")).toBeInTheDocument();
  });

  test("shows Upload Selected Files button after files are added", async () => {
    render(() => <Dropzone label="Upload" />);
    const dropArea = screen.getByLabelText("Upload");

    const file = createMockFile("photo.png", "image/png");
    await fireEvent.drop(dropArea, { dataTransfer: { files: [file] } });

    expect(screen.getByText("Upload Selected Files")).toBeInTheDocument();
  });

  test("multiple files can be dropped at once", async () => {
    const onFilesSelected = vi.fn();
    render(() => <Dropzone label="Upload" onFilesSelected={onFilesSelected} />);
    const dropArea = screen.getByLabelText("Upload");

    const files = [
      createMockFile("a.csv", "text/csv"),
      createMockFile("b.csv", "text/csv"),
    ];
    await fireEvent.drop(dropArea, { dataTransfer: { files } });

    expect(onFilesSelected).toHaveBeenCalledWith(files);
    expect(screen.getByText("a.csv")).toBeInTheDocument();
    expect(screen.getByText("b.csv")).toBeInTheDocument();
  });
});

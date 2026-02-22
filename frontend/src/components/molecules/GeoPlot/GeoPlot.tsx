import {
  createSignal,
  createEffect,
  createMemo,
  onMount,
  onCleanup,
  Show,
  For,
  type Component,
} from "solid-js";
import type * as TopoJSON from "topojson-specification";
import * as Plot from "@observablehq/plot";
import * as topojson from "topojson-client";
import { geoAlbersUsa, geoOrthographic } from "d3-geo";
import { Button } from "~/components/atoms/Button";
import { Chip } from "~/components/atoms/Chip";
import { cn } from "~/lib/utils";

import worldData from "world-atlas/countries-110m.json";
import usData from "us-atlas/states-10m.json";

// ============================================================================
// LAZY GEO DATA — deferred to first render so module import doesn't crash in test environments
// ============================================================================

let _geoCache: { land: ReturnType<typeof topojson.feature>; countries: ReturnType<typeof topojson.mesh>; nation: ReturnType<typeof topojson.merge>; stateMesh: ReturnType<typeof topojson.mesh> } | null = null;

function getGeoData() {
  if (!_geoCache) {
    const worldTopo = worldData as unknown as TopoJSON.Topology;
    const usTopo = usData as unknown as TopoJSON.Topology;
    _geoCache = {
      land: topojson.feature(worldTopo, worldTopo.objects.land),
      countries: topojson.mesh(worldTopo, worldTopo.objects.countries as TopoJSON.GeometryObject, (a: TopoJSON.GeometryObject, b: TopoJSON.GeometryObject) => a !== b),
      nation: topojson.merge(usTopo, (usTopo.objects.states as TopoJSON.GeometryCollection).geometries as TopoJSON.Polygon[]),
      stateMesh: topojson.mesh(usTopo, usTopo.objects.states as TopoJSON.GeometryObject, (a: TopoJSON.GeometryObject, b: TopoJSON.GeometryObject) => a !== b),
    };
  }
  return _geoCache;
}

// ============================================================================
// TYPES
// ============================================================================

export interface LocationData {
  name: string;
  lon: number;
  lat: number;
  value: number;
  secondary: number;
  rate: number;
}

export type ClusterPoint = LocationData & { isCluster: boolean; members: LocationData[] };

export interface GeoPlotProps {
  data: LocationData[];
  mode?: "globe" | "map";
  initialRotation?: [number, number];
  class?: string;
  labels?: {
    cluster?: string;
    item?: string;
    value?: string;
  };
}

// ============================================================================
// CLUSTERING
// ============================================================================

const CLUSTER_DISTANCE = 2.5;

function calculateClusters(locs: LocationData[], currentZoom: number) {
  if (currentZoom > 3.5) {
    return locs.map((loc) => ({ ...loc, isCluster: false, members: [] as LocationData[] }));
  }

  const clusterDist = CLUSTER_DISTANCE / Math.pow(currentZoom, 0.8);
  const used = new Set<string>();
  const clusters: ClusterPoint[] = [];

  for (const loc of locs) {
    if (used.has(loc.name)) continue;
    const nearby = locs.filter((other) => {
      if (used.has(other.name) || other.name === loc.name) return false;
      const dist = Math.sqrt(Math.pow(loc.lon - other.lon, 2) + Math.pow(loc.lat - other.lat, 2));
      return dist < clusterDist;
    });

    if (nearby.length > 0) {
      const members = [loc, ...nearby];
      members.forEach((m) => used.add(m.name));
      clusters.push({
        name: `${members.length} Locations`,
        lon: members.reduce((a, m) => a + m.lon, 0) / members.length,
        lat: members.reduce((a, m) => a + m.lat, 0) / members.length,
        value: members.reduce((a, m) => a + m.value, 0),
        secondary: members.reduce((a, m) => a + m.secondary, 0),
        rate: Math.round(members.reduce((a, m) => a + m.rate, 0) / members.length),
        members,
        isCluster: true,
      });
    } else {
      used.add(loc.name);
      clusters.push({ ...loc, isCluster: false, members: [] });
    }
  }
  return clusters;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const GeoPlot: Component<GeoPlotProps> = (props) => {
  const mode = () => props.mode ?? "globe";
  const initRotation = () => props.initialRotation ?? [97, 39];

  // View state
  const [zoom, setZoom] = createSignal(1);
  const [panX, setPanX] = createSignal(0);
  const [panY, setPanY] = createSignal(0);
  const [rotateX, setRotateX] = createSignal(initRotation()[0]);
  const [rotateY, setRotateY] = createSignal(-initRotation()[1]);
  const [isDragging, setIsDragging] = createSignal(false);
  const [containerWidth, setContainerWidth] = createSignal(900);
  const [containerHeight, setContainerHeight] = createSignal(500);

  // Hover state
  const [hoveredPoint, setHoveredPoint] = createSignal<ClusterPoint | null>(null);
  const [tooltipPos, setTooltipPos] = createSignal({ x: 0, y: 0 });
  let isHoveringTooltip = false;
  let closeTimeout: ReturnType<typeof setTimeout> | null = null;

  let containerRef: HTMLDivElement | undefined;
  let renderRef: HTMLDivElement | undefined;
  let hasMoved = false;
  let rafId: number | null = null;
  let pendingDelta = { x: 0, y: 0 };

  // Clustering
  const PROJECTION_RATIO = 1070 / 240;
  const effectiveZoom = createMemo(() =>
    mode() === "globe" ? zoom() / PROJECTION_RATIO : zoom()
  );
  const processedData = createMemo(() => calculateClusters(props.data, effectiveZoom()));

  // Projection
  const projection = createMemo(() => {
    const z = zoom();
    const px = panX();
    const py = panY();
    const rx = rotateX();
    const ry = rotateY();
    const w = containerWidth();
    const h = containerHeight();

    if (mode() === "globe") {
      return geoOrthographic()
        .rotate([rx, ry])
        .scale(240 * z)
        .translate([w / 2, h / 2])
        .clipAngle(90);
    } else {
      return geoAlbersUsa()
        .scale(1070 * z)
        .translate([w / 2 + px, h / 2 + py]);
    }
  });

  // Resize observer (rAF debounced to prevent ResizeObserver loop warnings)
  onMount(() => {
    if (!containerRef) return;
    let resizeRaf: number | null = null;
    const observer = new ResizeObserver((entries) => {
      if (resizeRaf) cancelAnimationFrame(resizeRaf);
      resizeRaf = requestAnimationFrame(() => {
        for (const entry of entries) {
          setContainerWidth(entry.contentRect.width);
          setContainerHeight(entry.contentRect.height);
        }
        resizeRaf = null;
      });
    });
    observer.observe(containerRef);
    onCleanup(() => { observer.disconnect(); if (resizeRaf) cancelAnimationFrame(resizeRaf); });
  });

  // --- INTERACTION HANDLERS ---

  function handleMouseDown() {
    setIsDragging(true);
    hasMoved = false;
    setHoveredPoint(null);
    isHoveringTooltip = false;
  }

  function handleMouseUp(e: MouseEvent) {
    if (hasMoved) {
      setIsDragging(false);
      if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
      pendingDelta = { x: 0, y: 0 };
      return;
    }

    setIsDragging(false);

    // Click-to-zoom on clusters
    const proj = projection();
    if (!containerRef) return;
    const rect = containerRef.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    let clickedPoint: ClusterPoint | null = null;
    let minDistance = 20;

    for (const d of processedData()) {
      const coords = proj([d.lon, d.lat]);
      if (coords) {
        const [x, y] = coords;
        const dist = Math.sqrt(Math.pow(mouseX - x, 2) + Math.pow(mouseY - y, 2));
        if (dist < minDistance) {
          minDistance = dist;
          clickedPoint = d;
        }
      }
    }

    if (clickedPoint?.isCluster) {
      const targetZoom = Math.min(zoom() * 2.5, mode() === "globe" ? 300 : 30);
      if (mode() === "globe") {
        setRotateX(-clickedPoint.lon);
        setRotateY(-clickedPoint.lat);
      } else {
        const coords = proj([clickedPoint.lon, clickedPoint.lat]);
        if (coords) {
          const [cx, cy] = coords;
          const dx = containerWidth() / 2 - cx;
          const dy = containerHeight() / 2 - cy;
          const k = targetZoom / zoom();
          setPanX((p) => k * (p + dx));
          setPanY((p) => k * (p + dy));
        }
      }
      setZoom(targetZoom);
      setHoveredPoint(null);
    }
  }

  function handleMouseMove(e: MouseEvent) {
    if (isHoveringTooltip) return;

    // Drag
    if (isDragging()) {
      if (Math.abs(e.movementX) > 1 || Math.abs(e.movementY) > 1) hasMoved = true;

      pendingDelta.x += e.movementX;
      pendingDelta.y += e.movementY;

      if (!rafId) {
        rafId = requestAnimationFrame(() => {
          if (mode() === "globe") {
            setRotateX((r) => r + (pendingDelta.x * 0.4) / zoom());
            setRotateY((r) => Math.max(-90, Math.min(90, r - (pendingDelta.y * 0.4) / zoom())));
          } else {
            setPanX((p) => p + pendingDelta.x);
            setPanY((p) => p + pendingDelta.y);
          }
          pendingDelta = { x: 0, y: 0 };
          rafId = null;
        });
      }
      return;
    }

    // Hit testing for hover
    const proj = projection();
    if (!containerRef) return;
    const rect = containerRef.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    let found: ClusterPoint | null = null;
    let minDistance = 20;

    for (const d of processedData()) {
      const coords = proj([d.lon, d.lat]);
      if (coords) {
        const [x, y] = coords;
        const dist = Math.sqrt(Math.pow(mouseX - x, 2) + Math.pow(mouseY - y, 2));
        if (dist < minDistance) {
          minDistance = dist;
          found = d;
          setTooltipPos({ x, y });
        }
      }
    }

    if (found) {
      if (closeTimeout) { clearTimeout(closeTimeout); closeTimeout = null; }
      setHoveredPoint(found);
    } else {
      if (!isHoveringTooltip && !closeTimeout) {
        closeTimeout = setTimeout(() => {
          if (!isHoveringTooltip) setHoveredPoint(null);
          closeTimeout = null;
        }, 100);
      }
    }
  }

  function handleWheel(e: WheelEvent) {
    e.preventDefault();
    const direction = e.deltaY > 0 ? -1 : 1;
    const factor = 1 + 0.2 * direction;
    const maxZoom = mode() === "globe" ? 300 : 30;
    const newZoom = Math.max(0.5, Math.min(maxZoom, zoom() * factor));

    if (mode() === "map" && newZoom !== zoom()) {
      const rect = containerRef!.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      const centerX = containerWidth() / 2;
      const centerY = containerHeight() / 2;
      const actualFactor = newZoom / zoom();
      setPanX((p) => (mouseX - centerX) - ((mouseX - centerX) - p) * actualFactor);
      setPanY((p) => (mouseY - centerY) - ((mouseY - centerY) - p) * actualFactor);
    }

    setZoom(newZoom);
  }

  // --- TOUCH HANDLERS (pinch-zoom + drag) ---

  let lastTouchDistance = 0;
  let lastTouchCenter = { x: 0, y: 0 };

  function handleTouchStart(e: TouchEvent) {
    if (e.touches.length === 2) {
      setIsDragging(true);
      lastTouchDistance = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
    } else if (e.touches.length === 1) {
      setIsDragging(true);
      hasMoved = false;
      setHoveredPoint(null);
      lastTouchCenter = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  }

  function handleTouchMove(e: TouchEvent) {
    if (e.cancelable) e.preventDefault();

    if (e.touches.length === 2) {
      // Pinch zoom
      const newDist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      if (lastTouchDistance > 0) {
        const factor = newDist / lastTouchDistance;
        const maxZoom = mode() === "globe" ? 300 : 30;
        const newZoom = Math.max(0.5, Math.min(maxZoom, zoom() * factor));

        if (mode() === "map" && containerRef) {
          const pinchCenterX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
          const pinchCenterY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
          const rect = containerRef.getBoundingClientRect();
          const mx = pinchCenterX - rect.left;
          const my = pinchCenterY - rect.top;
          const cx = containerWidth() / 2;
          const cy = containerHeight() / 2;
          const actualFactor = newZoom / zoom();
          setPanX((p) => (mx - cx) - ((mx - cx) - p) * actualFactor);
          setPanY((p) => (my - cy) - ((my - cy) - p) * actualFactor);
        }
        setZoom(newZoom);
      }
      lastTouchDistance = newDist;
    } else if (e.touches.length === 1 && isDragging()) {
      // Touch drag
      const touch = e.touches[0];
      const movementX = touch.clientX - lastTouchCenter.x;
      const movementY = touch.clientY - lastTouchCenter.y;

      if (Math.abs(movementX) > 1 || Math.abs(movementY) > 1) hasMoved = true;

      if (mode() === "globe") {
        setRotateX((r) => r + (movementX * 0.4) / zoom());
        setRotateY((r) => Math.max(-90, Math.min(90, r - (movementY * 0.4) / zoom())));
      } else {
        setPanX((p) => p + movementX);
        setPanY((p) => p + movementY);
      }

      lastTouchCenter = { x: touch.clientX, y: touch.clientY };
    }
  }

  function handleTouchEnd() {
    setIsDragging(false);
    lastTouchDistance = 0;
  }

  function recenter() {
    setZoom(1);
    setPanX(0);
    setPanY(0);
    setRotateX(initRotation()[0]);
    setRotateY(-initRotation()[1]);
  }

  // --- RENDER ---

  createEffect(() => {
    if (typeof window === "undefined" || !renderRef) return;

    const isGlobe = mode() === "globe";
    const z = zoom();
    const drag = isDragging();
    const proj = projection();
    const data = processedData();
    const w = containerWidth();
    const h = containerHeight();
    const hovered = hoveredPoint();

    const geo = getGeoData();
    const plotOptions: Plot.PlotOptions = {
      width: w,
      height: h,
      margin: 0,
      style: { background: "transparent" },
      projection: () => proj as unknown,
      marks: [
        // Land
        isGlobe
          ? Plot.geo(geo.land, { fill: "currentColor", fillOpacity: 0.05, stroke: "currentColor", strokeOpacity: 0.15, strokeWidth: 0.5, clip: true })
          : Plot.geo(geo.nation, { fill: "currentColor", fillOpacity: 0.03, stroke: null, clip: true }),

        // Borders (hidden during drag)
        ...(drag ? [] : [
          ...(isGlobe ? [Plot.geo(geo.countries, { stroke: "currentColor", strokeOpacity: 0.15, strokeWidth: 0.5, fill: "none", clip: true })] : []),
          Plot.geo(geo.stateMesh, { stroke: "currentColor", strokeOpacity: 0.2, strokeWidth: 0.5, fill: "none", clip: true }),
        ]),

        // Cluster dots
        Plot.dot(data.filter((d: ClusterPoint) => d.isCluster), {
          x: "lon", y: "lat",
          r: (isGlobe ? 10 : 16) * Math.pow(z, 0.15),
          fill: "#34d399", fillOpacity: 0.95,
          stroke: "#ffffff", strokeWidth: 1, strokeOpacity: 1,
        }),

        // Single dots
        Plot.dot(data.filter((d: ClusterPoint) => !d.isCluster), {
          x: "lon", y: "lat",
          r: (isGlobe ? 5 : 8) * Math.pow(z, 0.15),
          fill: "rate" as string, fillOpacity: 0.9,
          stroke: "#ffffff", strokeWidth: 1, strokeOpacity: 1,
        }),

        // Hovered point overlay (1.2x scale)
        ...(hovered ? [Plot.dot([hovered], {
          x: "lon", y: "lat",
          r: ((hovered.isCluster ? (isGlobe ? 10 : 16) : (isGlobe ? 5 : 8)) * Math.pow(z, 0.15)) * 1.2,
          fill: "hsl(var(--active-green-ch))",
          fillOpacity: 1,
          stroke: "#ffffff", strokeWidth: 1, strokeOpacity: 1,
        })] : []),

        // Labels at deep zoom
        Plot.text(data.filter((d: ClusterPoint) => !d.isCluster), {
          filter: () => z > (isGlobe ? 120 : 24),
          x: "lon", y: "lat", text: "name",
          dy: ((isGlobe ? 5 : 8) * Math.pow(z, 0.15)) + 10,
          fontSize: (isGlobe ? 8 : 10) * Math.pow(z, isGlobe ? 0.08 : 0.05),
          fontWeight: 800, fill: "currentColor", opacity: 1,
          stroke: "var(--background)", strokeWidth: 6,
          paintOrder: "stroke", textAnchor: "middle",
        }),

        // Cluster count labels
        Plot.text(data.filter((d: ClusterPoint) => d.isCluster), {
          x: "lon", y: "lat",
          text: (d: ClusterPoint) => `${d.members.length}`,
          fill: "#ffffff",
          fontSize: (isGlobe ? 9 : 14) * Math.pow(z, 0.25),
          fontWeight: 800, textAnchor: "middle", dy: 1,
        }),
      ],
      color: {
        domain: [70, 96],
        range: ["#fbbf24", "#22d3ee", "#34d399"],
        interpolate: "hcl",
      },
    };

    renderRef.innerHTML = "";
    const plot = Plot.plot(plotOptions);
    renderRef.appendChild(plot);

    // Keyboard accessibility: hydrate SVG circles for tab/enter interaction
    const circles = renderRef.querySelectorAll("circle");
    const renderedPoints = [
      ...data.filter((d: ClusterPoint) => d.isCluster),
      ...data.filter((d: ClusterPoint) => !d.isCluster),
    ];

    circles.forEach((circle, i) => {
      const d = renderedPoints[i];
      if (!d) return;

      circle.setAttribute("role", "button");
      circle.setAttribute("tabindex", "0");
      circle.setAttribute("aria-label",
        d.isCluster
          ? `Cluster of ${d.members.length} ${props.labels?.cluster ?? "locations"}`
          : `${d.name}, ${d.value} ${props.labels?.value ?? "value"}`
      );
      (circle as unknown as HTMLElement).style.cursor = "pointer";
      circle.classList.add("focus:outline-none");

      circle.addEventListener("focus", () => {
        setHoveredPoint(d);
        const rect = circle.getBoundingClientRect();
        const cRect = containerRef!.getBoundingClientRect();
        setTooltipPos({
          x: rect.left - cRect.left + rect.width / 2,
          y: rect.top - cRect.top,
        });
      });

      circle.addEventListener("blur", () => {
        setHoveredPoint(null);
      });

      circle.addEventListener("keydown", (e: Event) => {
        const ke = e as KeyboardEvent;
        if (ke.key === "Enter" || ke.key === " ") {
          ke.preventDefault();
          if (d.isCluster) {
            const targetZoom = Math.min(zoom() * 2.5, mode() === "globe" ? 300 : 30);
            if (mode() === "globe") {
              setRotateX(-d.lon);
              setRotateY(-d.lat);
            } else {
              const coords = proj([d.lon, d.lat]);
              if (coords) {
                const [cx, cy] = coords;
                const dx = containerWidth() / 2 - cx;
                const dy = containerHeight() / 2 - cy;
                const k = targetZoom / zoom();
                setPanX((p) => k * (p + dx));
                setPanY((p) => k * (p + dy));
              }
            }
            setZoom(targetZoom);
            setHoveredPoint(null);
          }
        }
      });
    });
  });

  // Tooltip positioning
  const tooltipSide = () => tooltipPos().x > containerWidth() * 0.6 ? "left" : "right";
  const tooltipVert = () => tooltipPos().y > containerHeight() * 0.6 ? "top" : "bottom";
  const tooltipTransform = () => {
    const xTrans = tooltipSide() === "left" ? "-100%" : "0%";
    const yTrans = tooltipVert() === "top" ? "-100%" : "0%";
    const xOff = tooltipSide() === "left" ? -16 : 16;
    const yOff = tooltipVert() === "top" ? -16 : 16;
    return `translate(${xTrans}, ${yTrans}) translate(${xOff}px, ${yOff}px)`;
  };

  return (
    <div
      ref={containerRef}
      class={cn("relative group select-none flex flex-col w-full h-full overflow-hidden touch-none", props.class)}
    >
      {/* Zoom Controls */}
      <div class="absolute bottom-6 right-6 z-20 flex flex-col gap-2">
        <div class="flex items-center bg-background/80 backdrop-blur-md rounded-md shadow-sm">
          <Button variant="ghost" size="xs-icon" onClick={() => {
            const nz = Math.max(0.5, zoom() * 0.8);
            if (mode() === "map") { const f = nz / zoom(); setPanX((p) => p * f); setPanY((p) => p * f); }
            setZoom(nz);
          }}>
            <span class="text-lg leading-none">-</span>
          </Button>
          <span class="text-xs font-mono w-12 text-center font-medium opacity-70">
            {(zoom() * 100).toFixed(0)}%
          </span>
          <Button variant="ghost" size="xs-icon" onClick={() => {
            const max = mode() === "globe" ? 300 : 30;
            const nz = Math.min(max, zoom() * 1.2);
            if (mode() === "map") { const f = nz / zoom(); setPanX((p) => p * f); setPanY((p) => p * f); }
            setZoom(nz);
          }}>
            <span class="text-lg leading-none">+</span>
          </Button>
        </div>
        <Chip variant="neutral" size="xs" clickable active indicator={false} class="w-full justify-center shadow-sm font-medium" onClick={recenter}>
          Recenter
        </Chip>
      </div>

      {/* Render Surface */}
      <div
        class={cn("w-full h-full overflow-hidden", isDragging() ? "cursor-grabbing" : (hoveredPoint()?.isCluster ? "cursor-pointer" : "cursor-grab"))}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => { setIsDragging(false); if (rafId) { cancelAnimationFrame(rafId); rafId = null; } }}
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div ref={renderRef} class="w-full h-full golid-location-render origin-center" />

        {/* Tooltip */}
        <Show when={hoveredPoint()}>
          <div
            role="tooltip"
            class="absolute pointer-events-auto z-50 flex flex-col gap-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-xl rounded-lg px-4 py-3 min-w-[140px] transition-all duration-200 ease-out"
            style={{
              left: `${tooltipPos().x}px`,
              top: `${tooltipPos().y}px`,
              transform: tooltipTransform(),
            }}
            onMouseEnter={() => { isHoveringTooltip = true; if (closeTimeout) { clearTimeout(closeTimeout); closeTimeout = null; } }}
            onMouseLeave={() => { isHoveringTooltip = false; closeTimeout = setTimeout(() => setHoveredPoint(null), 100); }}
            onMouseMove={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <Show when={hoveredPoint()?.isCluster} fallback={
              <>
                <div class="text-[10px] uppercase font-black tracking-widest text-[#214d5e] dark:text-[#22d3ee] mb-0.5">{props.labels?.item ?? "Location"}</div>
                <div class="text-xs font-bold text-slate-900 dark:text-white">{hoveredPoint()?.name}</div>
                <div class="text-[10px] text-slate-500 font-mono mt-1">{hoveredPoint()?.value?.toLocaleString()} {props.labels?.value ?? "value"}</div>
                <div class="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">{hoveredPoint()?.rate}%</div>
              </>
            }>
              <div class="text-[10px] uppercase font-black tracking-widest text-[#214d5e] dark:text-[#22d3ee] mb-0.5">Cluster</div>
              <div class="text-xs font-bold text-slate-900 dark:text-white">{hoveredPoint()?.members?.length} {props.labels?.cluster ?? "Locations"}</div>
              <div class="flex flex-col gap-1 mt-1 border-t border-slate-100 dark:border-slate-800 pt-1.5">
                <For each={hoveredPoint()?.members?.slice(0, 5)}>
                  {(member: LocationData) => (
                    <div class="flex items-center justify-between gap-4 text-[10px]">
                      <span class="text-slate-600 dark:text-slate-300 font-medium truncate max-w-[120px]">{member.name}</span>
                      <span class="text-slate-400 font-mono">{member.rate}%</span>
                    </div>
                  )}
                </For>
                <Show when={(hoveredPoint()?.members?.length ?? 0) > 5}>
                  <div class="text-[9px] text-slate-400 italic pt-0.5">
                    +{hoveredPoint()!.members.length - 5} more...
                  </div>
                </Show>
              </div>
              <div class="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold mt-1 border-t border-slate-100 dark:border-slate-800 pt-1.5">
                {hoveredPoint()?.rate}% avg
              </div>
            </Show>
          </div>
        </Show>
      </div>
    </div>
  );
};

export default GeoPlot;

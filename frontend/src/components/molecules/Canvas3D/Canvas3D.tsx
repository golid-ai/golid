import { batch, createSignal, onMount, onCleanup, Switch, Match, type Component } from "solid-js";
import type { WebGLRenderer, Scene as ThreeScene, PerspectiveCamera, Object3D, Material, Mesh } from "three";
import type { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { Spinner } from "~/components/atoms/Spinner";
import { cn } from "~/lib/utils";

// ============================================================================
// TYPES
// ============================================================================

export interface Canvas3DProps {
  /** Additional class */
  class?: string;
  /** Background color (hex, default: transparent) */
  backgroundColor?: number;
  /** Background alpha (0-1, default: 0 for transparent) */
  backgroundAlpha?: number;
}

// ============================================================================
// COMPONENT
// Three.js scene with lazy-loaded engine and orbit controls.
// Dynamic import keeps initial bundle size low.
// ============================================================================

export const Canvas3D: Component<Canvas3DProps> = (props) => {
  const [loading, setLoading] = createSignal(true);
  const [error, setError] = createSignal<string | null>(null);
  let containerRef: HTMLDivElement | undefined;

  let alive = true;

  // Mutable refs for cleanup — assigned inside async onMount,
  // read by onCleanup which must be registered synchronously.
  let animationId: number | null = null;
  let renderer: WebGLRenderer | null = null;
  let scene: ThreeScene | null = null;
  let camera: PerspectiveCamera | null = null;
  let controls: OrbitControls | null = null;
  let resizeHandler: (() => void) | null = null;

  // Register cleanup synchronously (before any await) so SolidJS
  // tracks ownership correctly. The closure reads the mutable refs
  // which get populated after the dynamic import resolves.
  onCleanup(() => {
    alive = false;
    if (resizeHandler) window.removeEventListener("resize", resizeHandler);
    if (animationId !== null) cancelAnimationFrame(animationId);
    if (controls) controls.dispose();
    if (renderer) {
      renderer.dispose();
      if (scene) {
        scene.traverse((object: Object3D) => {
          const mesh = object as Mesh;
          if (mesh.geometry) mesh.geometry.dispose();
          if (mesh.material) {
            if (Array.isArray(mesh.material)) {
              mesh.material.forEach((m: Material) => m.dispose());
            } else {
              mesh.material.dispose();
            }
          }
        });
      }
    }
  });

  onMount(async () => {
    if (typeof window === "undefined" || !containerRef) return;

    try {
      const [threeModule, controlsModule] = await Promise.all([
        import("three"),
        import("three/examples/jsm/controls/OrbitControls.js"),
      ]);

      if (!alive) return;

      const THREE = threeModule;
      const { OrbitControls } = controlsModule;

      const width = containerRef.clientWidth;
      const height = containerRef.clientHeight;

      // Scene
      scene = new THREE.Scene();
      const alpha = props.backgroundAlpha ?? 0;
      if (alpha < 1) {
        scene.background = null;
      } else {
        scene.background = new THREE.Color(props.backgroundColor ?? 0x000000);
      }

      // Camera
      camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
      camera.position.z = 5;

      // Renderer
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: alpha < 1,
      });
      renderer.setSize(width, height);
      renderer.setPixelRatio(window.devicePixelRatio);
      containerRef.appendChild(renderer.domElement);

      // Lights
      const ambientLight = new THREE.AmbientLight(0x404040, 2);
      scene.add(ambientLight);

      const directionalLight = new THREE.DirectionalLight(0xffffff, 2);
      directionalLight.position.set(5, 5, 5);
      scene.add(directionalLight);

      // Materials — branded gradient faces (no texture files needed)
      const materials = [
        new THREE.MeshStandardMaterial({ color: 0x1b9d78, roughness: 0.2, metalness: 0.5 }),
        new THREE.MeshStandardMaterial({ color: 0x1b9d78, roughness: 0.2, metalness: 0.5 }),
        new THREE.MeshStandardMaterial({ color: 0x22d3ee, roughness: 0.2, metalness: 0.5 }),
        new THREE.MeshStandardMaterial({ color: 0x22d3ee, roughness: 0.2, metalness: 0.5 }),
        new THREE.MeshStandardMaterial({ color: 0xa78bfa, roughness: 0.2, metalness: 0.5 }),
        new THREE.MeshStandardMaterial({ color: 0xa78bfa, roughness: 0.2, metalness: 0.5 }),
      ];

      // Cube
      const geometry = new THREE.BoxGeometry(2.5, 2.5, 2.5);
      const cube = new THREE.Mesh(geometry, materials);
      scene.add(cube);

      // Controls
      controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      controls.autoRotate = true;
      controls.autoRotateSpeed = 4.0;
      controls.enableZoom = false;
      controls.enablePan = false;

      // Animation loop
      const animate = () => {
        animationId = requestAnimationFrame(animate);
        if (controls) controls.update();
        if (renderer && scene && camera) renderer.render(scene, camera);
      };
      animate();
      batch(() => {
        setLoading(false);
      });

      // Resize handler
      resizeHandler = () => {
        if (!containerRef || !camera || !renderer) return;
        const w = containerRef.clientWidth;
        const h = containerRef.clientHeight;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      };
      window.addEventListener("resize", resizeHandler);
    } catch (err) {
      if (!alive) return;
      console.error("Failed to load 3D engine:", err);
      batch(() => {
        setError("Failed to load 3D engine");
        setLoading(false);
      });
    }
  });

  return (
    <div
      ref={containerRef}
      class={cn(
        "relative w-full h-full min-h-[300px] cursor-grab active:cursor-grabbing",
        props.class
      )}
    >
      <div class="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ display: loading() || error() ? undefined : "none" }}>
        <Switch>
          <Match when={loading()}>
            <Spinner size="lg" />
          </Match>
          <Match when={error()}>
            <span class="text-danger text-sm">{error()}</span>
          </Match>
        </Switch>
      </div>
    </div>
  );
};

export default Canvas3D;

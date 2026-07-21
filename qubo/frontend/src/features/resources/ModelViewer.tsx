import { Component, ReactNode, Suspense, useMemo, useEffect, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import type { ThreeEvent } from '@react-three/fiber';
import { Bounds, Html, OrbitControls, useGLTF } from '@react-three/drei';
import { FiAlertCircle, FiLoader, FiMapPin, FiMaximize2, FiMinimize2, FiRotateCcw } from 'react-icons/fi';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import type { ModelAnnotation } from '@/types/resource';

type ViewerProps = {
  modelUrl: string;
  title: string;
  annotations?: ModelAnnotation[];
  isPlacingAnnotation?: boolean;
  selectedAnnotationId?: string | null;
  onPlaceAnnotation?: (position: [number, number, number]) => void;
  onSelectAnnotation?: (annotation: ModelAnnotation) => void;
  onMeaningfulInteraction?: () => void;
};

type ErrorBoundaryProps = {
  children: ReactNode;
};

type ErrorBoundaryState = {
  hasError: boolean;
};

class ModelErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-full flex-col items-center justify-center bg-slate-100 px-6 text-center">
          <FiAlertCircle className="h-8 w-8 text-red-400" />
          <p className="mt-3 text-sm font-bold text-slate-700">This 3D model could not be displayed.</p>
          <p className="mt-1 text-xs leading-5 text-slate-500">Please try again later or ask the educator to check the GLB file.</p>
        </div>
      );
    }
    return this.props.children;
  }
}

type LoadedModelProps = {
  modelUrl: string;
  annotations: ModelAnnotation[];
  selectedAnnotationId?: string | null;
  canPlaceAnnotation: boolean;
  onPlaceAnnotation?: (position: [number, number, number]) => void;
  onSelectAnnotation?: (annotation: ModelAnnotation) => void;
  onMeaningfulInteraction?: () => void;
};

function LoadedModel({
  modelUrl,
  annotations,
  selectedAnnotationId,
  canPlaceAnnotation,
  onPlaceAnnotation,
  onSelectAnnotation,
  onMeaningfulInteraction,
}: LoadedModelProps) {
  const gltf = useGLTF(modelUrl);
  const model = useMemo(() => gltf.scene.clone(), [gltf.scene]);

  const handleModelClick = (event: ThreeEvent<MouseEvent>) => {
    if (!canPlaceAnnotation || !onPlaceAnnotation) return;
    event.stopPropagation();
    const { x, y, z } = event.point;
    onPlaceAnnotation([x, y, z]);
  };

  return (
    <>
      <primitive object={model} onClick={handleModelClick} />
      {annotations.map((annotation, index) => (
        <Html key={annotation.annotation_id} position={annotation.position} center distanceFactor={10} zIndexRange={[10, 0]}>
          <button
            type="button"
            onPointerDown={(event) => event.stopPropagation()}
            onClick={(event) => {
              event.stopPropagation();
              onMeaningfulInteraction?.();
              onSelectAnnotation?.(annotation);
            }}
            className={`flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-extrabold shadow-lg transition ${selectedAnnotationId === annotation.annotation_id ? 'border-white bg-blue-700 text-white ring-4 ring-blue-300/70' : 'border-white bg-primary text-white hover:scale-110 hover:bg-blue-700'}`}
            aria-label={`Read annotation ${index + 1}: ${annotation.title}`}
            title={annotation.title}
          >
            {index + 1}
          </button>
        </Html>
      ))}
    </>
  );
}

export default function ModelViewer({
  modelUrl,
  title,
  annotations = [],
  isPlacingAnnotation = false,
  selectedAnnotationId,
  onPlaceAnnotation,
  onSelectAnnotation,
  onMeaningfulInteraction,
}: ViewerProps) {
  const controlsRef = useRef<OrbitControlsImpl | null>(null);
  const viewerRef = useRef<HTMLDivElement | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement === viewerRef.current);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement === viewerRef.current) {
        await document.exitFullscreen();
      } else {
        await viewerRef.current?.requestFullscreen();
      }
    } catch (error) {
      console.error('Fullscreen mode could not be started:', error);
    }
  };

  return (
    <div ref={viewerRef} className={`relative overflow-hidden bg-slate-100 ${isFullscreen ? 'h-screen w-screen rounded-none' : 'aspect-[4/3] rounded-2xl md:aspect-video'}`}>
      <ModelErrorBoundary key={modelUrl}>
        <Canvas camera={{ position: [3.2, 2.6, 4.2], fov: 42 }} dpr={[1, 2]}>
          <color attach="background" args={['#f1f5f9']} />
          <ambientLight intensity={1.4} />
          <directionalLight position={[5, 6, 4]} intensity={2.2} castShadow />
          <directionalLight position={[-4, 2, -3]} intensity={0.8} />
          <Suspense fallback={<Html center><div className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-bold text-slate-600 shadow-lg"><FiLoader className="animate-spin text-primary" /> Loading model</div></Html>}>
            <Bounds fit clip observe margin={1.25}>
              <LoadedModel
                modelUrl={modelUrl}
                annotations={annotations}
                selectedAnnotationId={selectedAnnotationId}
                canPlaceAnnotation={isPlacingAnnotation}
                onPlaceAnnotation={onPlaceAnnotation}
                onSelectAnnotation={onSelectAnnotation}
              />
            </Bounds>
          </Suspense>
          <OrbitControls ref={controlsRef} makeDefault enablePan={false} onEnd={onMeaningfulInteraction} />
        </Canvas>
      </ModelErrorBoundary>
      <div className="pointer-events-none absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1.5 text-xs font-bold text-slate-600 shadow-sm backdrop-blur">Drag to rotate · Scroll to zoom</div>
      {isPlacingAnnotation && <div className="pointer-events-none absolute bottom-4 left-4 flex items-center gap-2 rounded-xl bg-blue-700 px-3 py-2 text-xs font-bold text-white shadow-lg"><FiMapPin /> Click a location on the model</div>}
      <button onClick={toggleFullscreen} className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-600 shadow-lg transition hover:bg-slate-50" aria-label={isFullscreen ? `Exit fullscreen for ${title}` : `View ${title} in fullscreen`} title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}>
        {isFullscreen ? <FiMinimize2 /> : <FiMaximize2 />}
      </button>
      <button onClick={() => controlsRef.current?.reset()} className="absolute bottom-4 right-4 flex h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-600 shadow-lg transition hover:bg-slate-50" aria-label={`Reset ${title} view`} title="Reset view">
        <FiRotateCcw />
      </button>
    </div>
  );
}

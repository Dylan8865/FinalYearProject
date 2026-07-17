import { Component, ReactNode, Suspense, useEffect, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { Bounds, Center, Html, useGLTF } from '@react-three/drei';
import { FiBox, FiLoader } from 'react-icons/fi';

type ModelThumbnailProps = {
  modelUrl: string;
  title: string;
};

type ModelThumbnailErrorBoundaryProps = {
  children: ReactNode;
};

type ModelThumbnailErrorBoundaryState = {
  hasError: boolean;
};

class ModelThumbnailErrorBoundary extends Component<ModelThumbnailErrorBoundaryProps, ModelThumbnailErrorBoundaryState> {
  state: ModelThumbnailErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ModelThumbnailErrorBoundaryState {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return <ThumbnailFallback label="Preview unavailable" />;
    }
    return this.props.children;
  }
}

function ThumbnailFallback({ label = 'Preparing preview' }: { label?: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 text-primary">
      <div className="flex h-16 w-16 items-center justify-center rounded-3xl border border-blue-100 bg-white/85 shadow-sm"><FiBox className="h-8 w-8" /></div>
      <span className="text-xs font-bold text-slate-500">{label}</span>
    </div>
  );
}

function ThumbnailModel({ modelUrl }: { modelUrl: string }) {
  const gltf = useGLTF(modelUrl);
  return <Center><primitive object={gltf.scene.clone()} /></Center>;
}

export default function ModelThumbnail({ modelUrl, title }: ModelThumbnailProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setShouldRender(true);
        observer.disconnect();
      }
    }, { rootMargin: '160px' });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="h-full w-full" aria-label={`Preview of ${title}`}>
      {shouldRender ? (
        <ModelThumbnailErrorBoundary key={modelUrl}>
          <Canvas className="pointer-events-none" camera={{ position: [3.2, 2.4, 4.2], fov: 42 }} dpr={[1, 1.5]} frameloop="demand">
            <color attach="background" args={['#eff6ff']} />
            <ambientLight intensity={1.8} />
            <directionalLight position={[5, 6, 4]} intensity={2.4} />
            <directionalLight position={[-4, 2, -3]} intensity={1.1} />
            <Suspense fallback={<Html center><div className="flex items-center gap-2 rounded-full bg-white/90 px-3 py-1.5 text-xs font-bold text-slate-500 shadow-sm"><FiLoader className="animate-spin text-primary" /> Loading preview</div></Html>}>
              <Bounds fit clip observe margin={1.3}>
                <ThumbnailModel modelUrl={modelUrl} />
              </Bounds>
            </Suspense>
          </Canvas>
        </ModelThumbnailErrorBoundary>
      ) : <ThumbnailFallback />}
    </div>
  );
}

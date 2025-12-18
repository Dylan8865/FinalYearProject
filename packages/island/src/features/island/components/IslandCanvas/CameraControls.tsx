import { OrbitControls } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import React, {
  forwardRef,
  useImperativeHandle,
  useRef,
  useState,
  useEffect,
} from "react";
import * as THREE from "three";

type OrbitControlsType = React.ElementRef<typeof OrbitControls>;

interface CameraControlsProps {
  isDraggingPlacedItem: boolean;
  defaultPosition?: [number, number, number];
  defaultTarget?: [number, number, number];
  transitionSpeed?: number; // Speed of the smooth transition (0-1, higher is faster)
  onCameraChanged?: (isAtDefault: boolean) => void; // Callback when camera position changes
}

export interface CameraControlsHandle {
  reset: () => void;
}

const CameraControls = forwardRef<CameraControlsHandle, CameraControlsProps>(
  (
    {
      isDraggingPlacedItem,
      defaultPosition = [10, 15, 5],
      defaultTarget = [0, 0, 0],
      transitionSpeed = 0.05,
      onCameraChanged,
    },
    ref
  ) => {
    const controlsRef = useRef<OrbitControlsType>(null);
    const { camera } = useThree();

    // Animation state
    const [isAnimating, setIsAnimating] = useState(false);
    const targetPositionRef = useRef(new THREE.Vector3());
    const targetLookAtRef = useRef(new THREE.Vector3());

    // Track if camera is at default position
    const isAtDefaultRef = useRef(true);
    const defaultPosVec = useRef(new THREE.Vector3(...defaultPosition));
    const defaultTargetVec = useRef(new THREE.Vector3(...defaultTarget));

    // Update default vectors when props change
    useEffect(() => {
      defaultPosVec.current.set(...defaultPosition);
      defaultTargetVec.current.set(...defaultTarget);
    }, [defaultPosition, defaultTarget]);

    useImperativeHandle(
      ref,
      () => ({
        reset: () => {
          // Set target positions for smooth transition
          targetPositionRef.current.set(
            defaultPosition[0],
            defaultPosition[1],
            defaultPosition[2]
          );
          targetLookAtRef.current.set(
            defaultTarget[0],
            defaultTarget[1],
            defaultTarget[2]
          );
          setIsAnimating(true);
        },
      }),
      [defaultPosition, defaultTarget]
    );

    // Smooth camera animation using lerp + check if at default position
    useFrame(() => {
      // Check if camera is at default position (with threshold)
      const positionDistance = camera.position.distanceTo(
        defaultPosVec.current
      );
      const targetDistance = controlsRef.current
        ? controlsRef.current.target.distanceTo(defaultTargetVec.current)
        : 0;

      const isCurrentlyAtDefault =
        positionDistance < 0.5 && targetDistance < 0.5;

      // Only notify if state changed
      if (isCurrentlyAtDefault !== isAtDefaultRef.current) {
        isAtDefaultRef.current = isCurrentlyAtDefault;
        onCameraChanged?.(isCurrentlyAtDefault);
      }

      // Handle animation
      if (!isAnimating) return;

      // Lerp camera position
      camera.position.lerp(targetPositionRef.current, transitionSpeed);

      // Lerp controls target
      if (controlsRef.current) {
        controlsRef.current.target.lerp(
          targetLookAtRef.current,
          transitionSpeed
        );
        controlsRef.current.update();
      }

      // Check if we've reached the animation target (within a small threshold)
      const animPosDistance = camera.position.distanceTo(
        targetPositionRef.current
      );
      const animTargetDistance = controlsRef.current
        ? controlsRef.current.target.distanceTo(targetLookAtRef.current)
        : 0;

      if (animPosDistance < 0.01 && animTargetDistance < 0.01) {
        // Snap to exact position and stop animating
        camera.position.copy(targetPositionRef.current);
        if (controlsRef.current) {
          controlsRef.current.target.copy(targetLookAtRef.current);
          controlsRef.current.update();
        }
        setIsAnimating(false);
      }
    });

    // Cancel animation when user interacts with controls
    const handleControlStart = () => {
      if (isAnimating) {
        setIsAnimating(false);
      }
    };

    return (
      <OrbitControls
        ref={controlsRef}
        enablePan={!isDraggingPlacedItem}
        enableRotate={!isDraggingPlacedItem}
        enableZoom={true}
        enableDamping={true}
        dampingFactor={0.05}
        minDistance={5}
        maxDistance={Infinity}
        mouseButtons={{
          LEFT: 2,
          MIDDLE: 1,
          RIGHT: 0,
        }}
        touches={{
          ONE: THREE.TOUCH.PAN,
          TWO: THREE.TOUCH.DOLLY_ROTATE,
        }}
        onStart={handleControlStart}
      />
    );
  }
);
CameraControls.displayName = "CameraControls";
export default CameraControls;

"use client";

import React, { useEffect, useRef, useCallback } from "react";

// TagCanvas configuration interface
interface TagCanvasOptions {
  interval?: number;
  textFont?: string;
  textColour?: string | null;
  textHeight?: number;
  outlineColour?: string;
  outlineThickness?: number;
  maxSpeed?: number;
  minBrightness?: number;
  depth?: number;
  pulsateTo?: number;
  pulsateTime?: number;
  initial?: [number, number];
  decel?: number;
  reverse?: boolean;
  hideTags?: boolean;
  shadow?: string;
  shadowBlur?: number;
  weight?: boolean;
  weightFrom?: string;
  fadeIn?: number;
  wheelZoom?: boolean;
  pinchZoom?: boolean;
  shuffleTags?: boolean;
  shape?: "sphere" | "hcylinder" | "vcylinder" | "hring" | "vring";
  noSelect?: boolean;
  noMouse?: boolean;
  dragControl?: boolean;
  dragThreshold?: number;
  centreFunc?: (tag: HTMLElement) => [number, number, number];
  splitWidth?: number;
  animTiming?: "Smooth" | "Linear";
  clickToFront?: number;
  frontSelect?: boolean;
  txtOpt?: boolean;
  txtScale?: number;
  freezeActive?: boolean;
  freezeDecel?: boolean;
  activeCursor?: string;
  outlineMethod?: "outline" | "classic" | "block" | "colour" | "size" | "none";
  outlineRadius?: number;
  outlineIncrease?: number;
  bgColour?: string | null;
  bgOutlineThickness?: number;
  bgRadius?: number;
  radiusX?: number;
  radiusY?: number;
  radiusZ?: number;
  stretchX?: number;
  stretchY?: number;
  offsetX?: number;
  offsetY?: number;
  zoom?: number;
  lock?: string | null;
}

// Word data interface
export interface CloudWord3D {
  text: string;
  weight: number;
  link?: string;
  color?: string;
}

interface TagCanvas3DProps {
  words: CloudWord3D[];
  width?: number;
  height?: number;
  options?: TagCanvasOptions;
  onWordClick?: (word: string) => void;
  className?: string;
}

// Declare TagCanvas on window for TypeScript
declare global {
  interface Window {
    TagCanvas?: {
      Start: (canvasId: string, tagsId: string, options?: TagCanvasOptions) => boolean;
      Pause: (canvasId: string) => void;
      Resume: (canvasId: string) => void;
      Reload: (canvasId: string) => void;
      Update: (canvasId: string) => void;
      SetSpeed: (canvasId: string, speed: [number, number]) => void;
      TagToFront: (canvasId: string, options: { id: string; active?: number }) => void;
      RotateTag: (canvasId: string, options: { tag: string; lat: number; lng: number; time: number }) => void;
      Delete: (canvasId: string) => void;
      tc?: Record<string, unknown>;
      [key: string]: unknown;
    };
  }
}

// Default options matching reference image: white text, red on hover, no outlines, spherical
const defaultOptions: TagCanvasOptions = {
  interval: 20,
  textFont: "Arial, sans-serif",
  textColour: "#ffffff", // All text white
  textHeight: 20,
  outlineColour: "#ff0000", // Red for selected/hovered
  outlineThickness: 0, // No outline by default
  maxSpeed: 0.05,
  minBrightness: 0.2,
  depth: 0.9,
  pulsateTo: 0.6,
  pulsateTime: 0.5,
  initial: [0.1, -0.1],
  decel: 0.95,
  reverse: true,
  hideTags: false,
  shadow: "transparent", // No shadow
  shadowBlur: 0,
  weight: true,
  weightFrom: "data-weight",
  fadeIn: 600,
  wheelZoom: false,
  pinchZoom: true,
  shuffleTags: true,
  shape: "sphere", // Spherical/orbit shape
  noSelect: false,
  freezeActive: true,
  activeCursor: "pointer",
  outlineMethod: "colour", // Use color change for hover
  dragControl: true,
  clickToFront: 400,
};

/**
 * TagCanvas3D Component - 3D rotating word cloud using TagCanvas library
 */
export default function TagCanvas3D({
  words,
  width = 600,
  height = 600,
  options = {},
  onWordClick,
  className = "",
}: TagCanvas3DProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const tagsRef = useRef<HTMLDivElement>(null);
  const isInitialized = useRef(false);

  // Generate unique IDs for this instance
  const canvasId = useRef(`tagcanvas-${Math.random().toString(36).substr(2, 9)}`);
  const tagsId = useRef(`tags-${Math.random().toString(36).substr(2, 9)}`);

  // Handle word click
  const handleWordClick = useCallback(
    (word: string) => {
      if (onWordClick) {
        onWordClick(word);
      }
    },
    [onWordClick]
  );

  // Wait for TagCanvas to be available (loaded from layout.tsx)
  useEffect(() => {
    // TagCanvas is loaded in layout.tsx, just wait for it
    if (!window.TagCanvas) {
      console.warn("TagCanvas not loaded yet, waiting...");
    }
  }, []);

  // Initialize TagCanvas
  useEffect(() => {
    const initTagCanvas = () => {
      if (!window.TagCanvas || !canvasRef.current || !tagsRef.current) {
        return false;
      }

      // If already initialized, delete first
      if (isInitialized.current) {
        try {
          window.TagCanvas.Delete(canvasId.current);
        } catch {
          // Ignore errors when deleting
        }
      }

      const mergedOptions: TagCanvasOptions = {
        ...defaultOptions,
        ...options,
      };

      try {
        const success = window.TagCanvas.Start(
          canvasId.current,
          tagsId.current,
          mergedOptions
        );
        isInitialized.current = success;
        return success;
      } catch (e) {
        console.error("TagCanvas error:", e);
        if (containerRef.current) {
          containerRef.current.style.display = "none";
        }
        return false;
      }
    };

    // Wait for TagCanvas to load
    const checkAndInit = () => {
      if (window.TagCanvas) {
        // Small delay to ensure DOM is ready
        setTimeout(initTagCanvas, 100);
      } else {
        // Retry after a short delay
        setTimeout(checkAndInit, 200);
      }
    };

    checkAndInit();

    // Cleanup
    return () => {
      if (window.TagCanvas && isInitialized.current) {
        try {
          window.TagCanvas.Delete(canvasId.current);
        } catch {
          // Ignore cleanup errors
        }
        isInitialized.current = false;
      }
    };
  }, [words, options]);

  // All words should be white (reference image style)
  const getColorForWeight = (weight: number): string => {
    return "#ffffff"; // All white, selection shows in red via outlineColour
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <canvas
        ref={canvasRef}
        id={canvasId.current}
        width={width}
        height={height}
        className="block mx-auto"
        style={{
          maxWidth: "100%",
          height: "auto",
        }}
      />
      {/* Hidden tags container for TagCanvas */}
      <div
        ref={tagsRef}
        id={tagsId.current}
        className="hidden"
        style={{ display: "none" }}
      >
        <ul>
          {words.map((word, index) => (
            <li key={index}>
              <a
                href="#"
                data-weight={word.weight}
                style={{ color: word.color || getColorForWeight(word.weight) }}
                onClick={(e) => {
                  e.preventDefault();
                  handleWordClick(word.text);
                }}
              >
                {word.text}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

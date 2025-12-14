"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";

const ThreeJsBlockGrid = () => {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const gridRef = useRef(null);
  const blocksRef = useRef([]);
  const raycasterRef = useRef(new THREE.Raycaster());
  const mouseRef = useRef(new THREE.Vector2());
  const [blockCount, setBlockCount] = useState(0);
  const [selectedColor, setSelectedColor] = useState("#3b82f6");
  const [gridSize, setGridSize] = useState(10);

  useEffect(() => {
    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a2e);
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(15, 15, 15);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 20, 10);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);

    // Create grid
    const createGrid = (size) => {
      const gridGroup = new THREE.Group();

      // Ground plane (invisible but raycaster can detect it)
      const groundGeometry = new THREE.PlaneGeometry(size * 2, size * 2);
      const groundMaterial = new THREE.MeshBasicMaterial({
        visible: false,
      });
      const ground = new THREE.Mesh(groundGeometry, groundMaterial);
      ground.rotation.x = -Math.PI / 2;
      ground.name = "ground";
      gridGroup.add(ground);

      // Grid helper
      const gridHelper = new THREE.GridHelper(
        size * 2,
        size * 2,
        0x444444,
        0x222222
      );
      gridGroup.add(gridHelper);

      // Grid lines for each cell
      for (let i = -size; i <= size; i++) {
        for (let j = -size; j <= size; j++) {
          const cellGeometry = new THREE.EdgesGeometry(
            new THREE.BoxGeometry(1, 0.01, 1)
          );
          const cellMaterial = new THREE.LineBasicMaterial({
            color: 0x00ff88,
            transparent: true,
            opacity: 0.3,
          });
          const cell = new THREE.LineSegments(cellGeometry, cellMaterial);
          cell.position.set(i, 0, j);
          gridGroup.add(cell);
        }
      }

      return gridGroup;
    };

    const grid = createGrid(gridSize);
    scene.add(grid);
    gridRef.current = grid;

    // Mouse move handler for hover effect
    const onMouseMove = (event) => {
      mouseRef.current.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouseRef.current.y = -(event.clientY / window.innerHeight) * 2 + 1;
    };

    // Click handler to place blocks
    const onClick = (event) => {
      raycasterRef.current.setFromCamera(mouseRef.current, camera);

      const intersects = raycasterRef.current.intersectObjects(
        scene.children,
        true
      );

      if (intersects.length > 0) {
        const intersect = intersects[0];

        // Determine if we hit a block or the ground
        const hitBlock = blocksRef.current.includes(intersect.object);

        let x, y, z;

        if (hitBlock) {
          // We hit an existing block - place on top of it
          x = intersect.object.position.x;
          z = intersect.object.position.z;
          y = intersect.object.position.y + 1; // Stack on top
        } else {
          // We hit the ground - place at ground level
          x = Math.round(intersect.point.x);
          z = Math.round(intersect.point.z);
          y = 0.5; // Ground level
        }

        // Check boundaries
        if (Math.abs(x) <= gridSize && Math.abs(z) <= gridSize) {
          // Check if block already exists at this exact position
          const existingBlock = blocksRef.current.find(
            (block) =>
              block.position.x === x &&
              block.position.y === y &&
              block.position.z === z
          );

          if (!existingBlock) {
            // Create new block
            const geometry = new THREE.BoxGeometry(0.9, 1, 0.9);
            const material = new THREE.MeshStandardMaterial({
              color: new THREE.Color(selectedColor),
              roughness: 0.5,
              metalness: 0.2,
            });
            const block = new THREE.Mesh(geometry, material);

            block.position.set(x, y, z);
            block.castShadow = true;
            block.receiveShadow = true;

            scene.add(block);
            blocksRef.current.push(block);
            setBlockCount(blocksRef.current.length);
          }
        }
      }
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("click", onClick);

    // Handle window resize
    const onWindowResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", onWindowResize);

    // Camera rotation
    let angle = 0;
    const radius = 20;

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);

      // Auto-rotate camera
      angle += 0.003;
      camera.position.x = Math.cos(angle) * radius;
      camera.position.z = Math.sin(angle) * radius;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
    };

    animate();

    // Cleanup
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("click", onClick);
      window.removeEventListener("resize", onWindowResize);
      mountRef.current?.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, [selectedColor, gridSize]);

  const clearAllBlocks = () => {
    blocksRef.current.forEach((block) => {
      sceneRef.current.remove(block);
      block.geometry.dispose();
      block.material.dispose();
    });
    blocksRef.current = [];
    setBlockCount(0);
  };

  const colors = [
    { name: "Blue", value: "#3b82f6" },
    { name: "Red", value: "#ef4444" },
    { name: "Green", value: "#10b981" },
    { name: "Yellow", value: "#f59e0b" },
    { name: "Purple", value: "#8b5cf6" },
    { name: "Pink", value: "#ec4899" },
  ];

  return (
    <div style={{ width: "100%", height: "100vh", position: "relative" }}>
      <div ref={mountRef} style={{ width: "100%", height: "100%" }} />

      {/* Control Panel */}
      <div
        style={{
          position: "absolute",
          top: "20px",
          left: "20px",
          background: "rgba(0, 0, 0, 0.8)",
          padding: "20px",
          borderRadius: "10px",
          color: "white",
          fontFamily: "Arial, sans-serif",
          minWidth: "250px",
        }}
      >
        <h2 style={{ margin: "0 0 15px 0", fontSize: "20px" }}>
          Block Placement Grid
        </h2>

        <div style={{ marginBottom: "15px" }}>
          <p style={{ margin: "0 0 5px 0", fontSize: "14px" }}>
            Blocks Placed: <strong>{blockCount}</strong>
          </p>
        </div>

        <div style={{ marginBottom: "15px" }}>
          <label
            style={{ display: "block", marginBottom: "8px", fontSize: "14px" }}
          >
            Select Color:
          </label>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "8px",
            }}
          >
            {colors.map((color) => (
              <button
                key={color.value}
                onClick={() => setSelectedColor(color.value)}
                style={{
                  width: "100%",
                  padding: "10px",
                  backgroundColor: color.value,
                  border:
                    selectedColor === color.value
                      ? "3px solid white"
                      : "2px solid transparent",
                  borderRadius: "5px",
                  cursor: "pointer",
                  fontSize: "12px",
                  color: "white",
                  fontWeight: "bold",
                  textShadow: "1px 1px 2px black",
                }}
              >
                {color.name}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={clearAllBlocks}
          style={{
            width: "100%",
            padding: "12px",
            backgroundColor: "#dc2626",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: "bold",
            marginBottom: "15px",
          }}
        >
          Clear All Blocks
        </button>

        <div
          style={{
            fontSize: "12px",
            color: "#999",
            borderTop: "1px solid #444",
            paddingTop: "10px",
            marginTop: "10px",
          }}
        >
          <p style={{ margin: "5px 0" }}>
            💡 Click on the grid to place blocks
          </p>
          <p style={{ margin: "5px 0" }}>🎨 Select a color before placing</p>
          <p style={{ margin: "5px 0" }}>🔄 Camera auto-rotates</p>
        </div>
      </div>
    </div>
  );
};

export default ThreeJsBlockGrid;

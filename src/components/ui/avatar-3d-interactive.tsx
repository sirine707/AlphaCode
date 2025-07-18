"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF, OrbitControls, Float } from "@react-three/drei";
import { Suspense, useRef, useState } from "react";
import * as THREE from "three";

interface InteractiveChatAvatarModelProps {
  position?: [number, number, number];
  scale?: number;
  rotation?: [number, number, number];
  enableAnimation?: boolean;
}

function InteractiveChatAvatarModel({
  position = [0, 0, 0],
  scale = 1,
  rotation = [0, 0, 0],
  enableAnimation = true,
}: InteractiveChatAvatarModelProps) {
  try {
    const { scene } = useGLTF("/ChatAvatar.glb");
    const groupRef = useRef<THREE.Group>(null);

    // Clone the scene to avoid issues with multiple instances
    const clonedScene = scene.clone();

    // Subtle rotation animation
    useFrame((state) => {
      if (groupRef.current && enableAnimation) {
        groupRef.current.rotation.y =
          Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
      }
    });

    return (
      <group
        ref={groupRef}
        position={position}
        scale={scale}
        rotation={rotation}
      >
        <primitive object={clonedScene} />
      </group>
    );
  } catch (error) {
    console.warn("Failed to load 3D avatar model:", error);
    return null;
  }
}

interface Avatar3DInteractiveProps {
  className?: string;
  size?: number;
  enableFloating?: boolean;
  enableAnimation?: boolean;
  onHover?: () => void;
  onClick?: () => void;
}

export default function Avatar3DInteractive({
  className = "h-16 w-16",
  size = 16,
  enableFloating = true,
  enableAnimation = true,
  onHover,
  onClick,
}: Avatar3DInteractiveProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className={`${className} border-2 rounded-full overflow-hidden bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 cursor-pointer transition-all duration-300 ${
        isHovered ? "scale-105 shadow-lg" : ""
      }`}
      onMouseEnter={() => {
        setIsHovered(true);
        onHover?.();
      }}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      <Canvas
        camera={{
          position: [0, 0, 3],
          fov: 45,
        }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
        }}
        style={{
          background: "transparent",
        }}
        onCreated={({ gl }) => {
          gl.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        }}
      >
        <Suspense fallback={null}>
          {/* Enhanced lighting setup */}
          <ambientLight intensity={0.6} />
          <directionalLight
            position={[2, 2, 1]}
            intensity={isHovered ? 1.2 : 0.8}
            castShadow={false}
          />
          <pointLight position={[-1, -1, 1]} intensity={0.4} color="#ffffff" />
          <spotLight position={[0, 2, 2]} intensity={0.3} color="#e0e7ff" />

          {/* The 3D Avatar Model with optional floating animation */}
          {enableFloating ? (
            <Float
              speed={2}
              rotationIntensity={0.1}
              floatIntensity={0.2}
              floatingRange={[0, 0.1]}
            >
              <InteractiveChatAvatarModel
                position={[0, -0.3, 0]}
                scale={isHovered ? 1.3 : 1.2}
                enableAnimation={enableAnimation}
              />
            </Float>
          ) : (
            <InteractiveChatAvatarModel
              position={[0, -0.3, 0]}
              scale={isHovered ? 1.3 : 1.2}
              enableAnimation={enableAnimation}
            />
          )}

          {/* Interactive orbit controls */}
          <OrbitControls
            enableZoom={false}
            enablePan={false}
            autoRotate={enableAnimation}
            autoRotateSpeed={0.5}
            maxPolarAngle={Math.PI / 1.8}
            minPolarAngle={Math.PI / 3}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}

// Preload the model for better performance
try {
  useGLTF.preload("/ChatAvatar.glb");
} catch (error) {
  console.warn("Failed to preload 3D avatar model:", error);
}

"use client";

import { Canvas } from "@react-three/fiber";
import { useGLTF, OrbitControls } from "@react-three/drei";
import { Suspense, useRef, useState } from "react";
import * as THREE from "three";
import { UserCircle2 } from "lucide-react";

interface ChatAvatarModelProps {
  position?: [number, number, number];
  scale?: number;
}

function ChatAvatarModel({
  position = [0, 0, 0],
  scale = 1,
}: ChatAvatarModelProps) {
  try {
    const { scene } = useGLTF("/ChatAvatar.glb");
    const groupRef = useRef<THREE.Group>(null);

    // Clone the scene to avoid issues with multiple instances
    const clonedScene = scene.clone();

    return (
      <group ref={groupRef} position={position} scale={scale}>
        <primitive object={clonedScene} />
      </group>
    );
  } catch (error) {
    console.warn("Failed to load 3D avatar model:", error);
    return null;
  }
}

function LoadingFallback() {
  return (
    <div
      className="w-full h-full flex items-center justify-center"
      style={{ background: "transparent" }}
    >
      <UserCircle2 className="h-6 w-6 text-muted-foreground animate-pulse" />
    </div>
  );
}

function ErrorFallback() {
  return (
    <div
      className="h-12 w-12 flex items-center justify-center"
      style={{ background: "transparent" }}
    >
      <UserCircle2 className="h-6 w-6 text-muted-foreground" />
    </div>
  );
}

interface Avatar3DProps {
  className?: string;
  size?: number;
  interactive?: boolean;
}

export default function Avatar3D({
  className = "h-12 w-12",
  size = 12,
  interactive = false,
}: Avatar3DProps) {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return <ErrorFallback />;
  }

  return (
    <div
      className={`${className} overflow-hidden avatar-3d-container`}
      style={{ background: "transparent" }}
    >
      <Canvas
        camera={{
          position: [0, 1.2, 1.5], // Close to face level
          fov: 35, // Narrow field of view to focus on face
        }}
        gl={{
          antialias: true,
          alpha: true,
          premultipliedAlpha: false,
          preserveDrawingBuffer: true,
          powerPreference: "high-performance",
        }}
        style={{
          background: "transparent",
        }}
        onCreated={({ gl }) => {
          gl.setPixelRatio(Math.min(window.devicePixelRatio, 3));
          gl.setClearColor(0x000000, 0); // Completely transparent background
        }}
        onError={() => setHasError(true)}
      >
        <Suspense fallback={<LoadingFallback />}>
          {/* Enhanced lighting setup for better visibility */}
          <ambientLight intensity={0.7} />
          <directionalLight
            position={[2, 2, 1]}
            intensity={1.0}
            castShadow={false}
          />
          <pointLight position={[-1, -1, 1]} intensity={0.5} />
          <spotLight position={[0, 2, 2]} intensity={0.3} angle={0.3} />

          {/* The 3D Avatar Model - face-focused positioning */}
          <ChatAvatarModel position={[0, -0.3, 0]} scale={2.0} />

          {/* Optional orbit controls for interactive mode */}
          {interactive && (
            <OrbitControls
              enableZoom={false}
              enablePan={false}
              autoRotate={false}
              maxPolarAngle={Math.PI / 2}
              minPolarAngle={Math.PI / 3}
            />
          )}
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

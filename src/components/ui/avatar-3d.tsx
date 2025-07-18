"use client";

import { Canvas } from "@react-three/fiber";
import { useGLTF, OrbitControls } from "@react-three/drei";
import { Suspense, useRef, useState } from "react";
import * as THREE from "three";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
    <div className="w-full h-full flex items-center justify-center">
      <UserCircle2 className="h-4 w-4 text-muted-foreground animate-pulse" />
    </div>
  );
}

function ErrorFallback() {
  return (
    <div className="h-8 w-8 flex items-center justify-center">
      <UserCircle2 className="h-4 w-4 text-muted-foreground" />
    </div>
  );
}

interface Avatar3DProps {
  className?: string;
  size?: number;
  interactive?: boolean;
}

export default function Avatar3D({
  className = "h-8 w-8",
  size = 8,
  interactive = false,
}: Avatar3DProps) {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return <ErrorFallback />;
  }

  return (
    <div className={`${className}`}>
      <Canvas
        camera={{
          position: [0, 0, 2],
          fov: 50,
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
        onError={() => setHasError(true)}
      >
        <Suspense fallback={<LoadingFallback />}>
          {/* Lighting setup for the avatar */}
          <ambientLight intensity={0.5} />
          <directionalLight
            position={[1, 1, 1]}
            intensity={0.8}
            castShadow={false}
          />
          <pointLight position={[-1, -1, 1]} intensity={0.3} />

          {/* The 3D Avatar Model */}
          <ChatAvatarModel position={[0, -0.5, 0]} scale={1.2} />

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

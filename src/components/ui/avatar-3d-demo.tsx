"use client";

import { Canvas } from "@react-three/fiber";
import { useGLTF, OrbitControls, Environment } from "@react-three/drei";
import { Suspense, useRef } from "react";

function ChatAvatarModel() {
  const groupRef = useRef();

  const { scene } = useGLTF("/ChatAvatar.glb");

  // Clone and rotate the avatar to face the camera
  const clonedScene = scene.clone();
  clonedScene.rotation.y = Math.PI; // Rotate 180° to face the camera

  return (
    <primitive
      object={clonedScene}
      ref={groupRef}
      scale={2.0}
      position={[0, -0.3, 0]}
    />
  );
}

export default function Avatar3D({ className = "h-64 w-64" }) {
  return (
    <div className={className} style={{ position: "relative" }}>
      <Canvas
        camera={{
          position: [0, 1.2, 1.5], // Close to face level
          fov: 35, // Narrow field of view to focus on face
        }}
        style={{ background: "transparent" }}
        gl={{
          antialias: true,
          alpha: true,
        }}
      >
        {/* Realistic lighting */}
        <ambientLight intensity={0.4} />
        <directionalLight position={[3, 4, 2]} intensity={1.0} />
        <pointLight position={[-2, -1, 2]} intensity={0.6} />

        {/* HDRI Environment for realism */}
        <Environment preset="city" />

        {/* Avatar */}
        <Suspense fallback={null}>
          <ChatAvatarModel />
        </Suspense>

        {/* Optional Orbit Controls */}
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          autoRotate={false}
          maxPolarAngle={Math.PI / 2}
          minPolarAngle={Math.PI / 3}
        />
      </Canvas>
    </div>
  );
}

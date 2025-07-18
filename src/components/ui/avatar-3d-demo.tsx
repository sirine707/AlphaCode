"use client";

import { useState } from "react";
import Avatar3D from "@/components/ui/avatar-3d";
import Avatar3DInteractive from "@/components/ui/avatar-3d-interactive";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function Avatar3DDemo() {
  const [showInteractive, setShowInteractive] = useState(false);

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>3D Avatar Integration</CardTitle>
          <CardDescription>
            Your ChatAvatar.glb model integrated into the application
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Chat-sized avatars */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Chat Message Avatars</h3>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Avatar3D className="h-12 w-12" />
                <span className="text-sm text-muted-foreground">
                  Default (chat size)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Avatar3D className="h-8 w-8" />
                <span className="text-sm text-muted-foreground">Small</span>
              </div>
              <div className="flex items-center gap-2">
                <Avatar3D className="h-16 w-16" />
                <span className="text-sm text-muted-foreground">Large</span>
              </div>
            </div>
          </div>

          {/* Interactive avatar showcase */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Interactive Avatar</h3>
              <Button
                variant="outline"
                onClick={() => setShowInteractive(!showInteractive)}
              >
                {showInteractive ? "Hide" : "Show"} Interactive Demo
              </Button>
            </div>

            {showInteractive && (
              <div className="flex justify-center p-8 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg border">
                <Avatar3DInteractive
                  className="h-32 w-32"
                  enableFloating={true}
                  enableAnimation={true}
                  onHover={() => console.log("Avatar hovered!")}
                  onClick={() => console.log("Avatar clicked!")}
                />
              </div>
            )}
          </div>

          {/* Usage examples */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Usage in Chat</h3>
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Avatar3D className="h-12 w-12" />
                <div className="bg-primary text-primary-foreground rounded-lg px-3 py-2 max-w-xs">
                  <p className="text-sm">
                    Hello! This is how the 3D avatar looks in chat messages.
                  </p>
                  <div className="text-xs opacity-80 mt-1">2:30 PM</div>
                </div>
              </div>
            </div>
          </div>

          {/* Technical info */}
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              <strong>Model:</strong> /public/ChatAvatar.glb
            </p>
            <p>
              <strong>Renderer:</strong> React Three Fiber + Three.js
            </p>
            <p>
              <strong>Features:</strong> Optimized loading, error fallbacks,
              responsive sizing
            </p>
            <p>
              <strong>Performance:</strong> Preloaded model with efficient
              rendering
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

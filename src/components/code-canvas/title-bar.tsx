"use client";

import React from "react";
import { ArrowLeft, ArrowRight, Bot, Rocket, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const menuItems = [
  "File",
  "Edit",
  "Selection",
  "View",
  "Go",
  "Run",
  "Terminal",
  "Help",
];

const AlphaIcon = () => (
  <span
    className="text-primary font-medium text-lg mr-4 select-none"
    aria-hidden="true"
  >
    ALPHA
  </span>
);

interface TitleBarProps {
  onToggleChatPanel?: () => void;
  onToggleAutocompletionPanel?: () => void;
  isAutocompletionEnabled?: boolean;
  onDeployClick?: () => void;
  isDeployPanelVisible?: boolean;
  onToggleTerminal?: () => void;
  isTerminalVisible?: boolean;
}

const TitleBar: React.FC<TitleBarProps> = ({
  onToggleChatPanel,
  onToggleAutocompletionPanel,
  isAutocompletionEnabled,
  onDeployClick,
  isDeployPanelVisible,
  onToggleTerminal,
  isTerminalVisible,
}) => {
  const handleTerminalClick = () => {
    if (onToggleTerminal) {
      onToggleTerminal();
    }
  };
  return (
    <div className="flex h-12 items-center justify-between bg-card px-4 shadow-sm border-b border-border select-none">
      <div className="flex items-center">
        <AlphaIcon />
        <div className="flex items-center space-x-4">
          {menuItems.map((item) => (
            <span
              key={item}
              className={cn(
                "text-sm text-muted-foreground hover:text-foreground cursor-pointer transition-colors",
                item === "Terminal" && isTerminalVisible && "text-primary"
              )}
              onClick={item === "Terminal" ? handleTerminalClick : undefined}
            >
              {item}
            </span>
          ))}
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "h-8 w-8 text-muted-foreground hover:text-foreground",
            isDeployPanelVisible && "bg-primary/20 text-primary"
          )}
          onClick={onDeployClick}
        >
          <Rocket className="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "h-8 w-8 text-muted-foreground hover:text-foreground",
            isAutocompletionEnabled && "bg-primary/20 text-primary"
          )}
          onClick={onToggleAutocompletionPanel}
        >
          <Sparkles className="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
          onClick={onToggleChatPanel}
        >
          <Bot className="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
        >
          <ArrowRight className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
};

export default TitleBar;

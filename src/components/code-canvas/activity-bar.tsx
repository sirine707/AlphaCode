
"use client";

import type React from 'react';
import { useState } from 'react';
import { FileText, GitFork, Puzzle, Settings as SettingsIcon, PanelLeftClose, PanelLeftOpen, Rocket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface ActivityBarProps {
  onToggleExplorer: () => void;
  isExplorerOpen: boolean;
}

const navItems = [
  { name: 'Explorer', icon: FileText, action: 'toggleExplorer' },
  { name: 'Source Control', icon: GitFork },
  { name: 'Extensions', icon: Puzzle },
  { name: 'Deploy', icon: Rocket },
  { name: 'Settings', icon: SettingsIcon },
];

const ActivityBar: React.FC<ActivityBarProps> = ({ onToggleExplorer, isExplorerOpen }) => {
  const [activeIndex, setActiveIndex] = useState(0);

  const handleItemClick = (index: number, action?: string) => {
    setActiveIndex(index);
    if (action === 'toggleExplorer') {
      onToggleExplorer();
    }
    // Add other actions here if needed for Deploy, Source Control, etc.
  };

  return (
    <TooltipProvider delayDuration={0}>
      <div className="flex h-full w-12 flex-col items-center bg-secondary py-4 shadow-lg">
        <div className="flex flex-col space-y-2">
          {navItems.map((item, index) => (
            <Tooltip key={item.name}>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "h-10 w-10 rounded-md text-muted-foreground hover:text-foreground hover:bg-primary/10",
                    activeIndex === index && "text-primary bg-primary/20"
                  )}
                  onClick={() => handleItemClick(index, item.action)}
                  aria-label={item.name}
                >
                  {item.name === 'Explorer' ? (
                    isExplorerOpen ? <PanelLeftClose className="h-5 w-5" /> : <PanelLeftOpen className="h-5 w-5" />
                  ) : (
                    <item.icon className="h-5 w-5" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right" className="bg-card text-foreground border-border shadow-xl">
                <p>{item.name}</p>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
      </div>
    </TooltipProvider>
  );
};

export default ActivityBar;

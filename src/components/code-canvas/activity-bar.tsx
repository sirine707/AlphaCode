
"use client";

import type React from 'react';
import { FileText, GitFork, Puzzle, Settings as SettingsIcon, PanelLeftClose, PanelLeftOpen, Rocket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { ActiveView } from './code-canvas-layout';

interface ActivityBarItem {
  id: ActiveView;
  name: string;
  icon: React.ElementType;
}

const navItems: ActivityBarItem[] = [
  { id: 'explorer', name: 'Explorer', icon: FileText },
  { id: 'source-control', name: 'Source Control', icon: GitFork },
  { id: 'extensions', name: 'Extensions', icon: Puzzle },
  { id: 'deploy', name: 'Deploy', icon: Rocket },
  { id: 'settings', name: 'Settings', icon: SettingsIcon },
];

interface ActivityBarProps {
  activeViewId: ActiveView;
  onViewChange: (viewId: ActiveView) => void;
  isSidePanelOpen: boolean;
}

const ActivityBar: React.FC<ActivityBarProps> = ({ activeViewId, onViewChange, isSidePanelOpen }) => {
  const handleItemClick = (itemId: ActiveView) => {
    onViewChange(itemId);
  };

  const getIconForItem = (item: ActivityBarItem) => {
    if (item.id === 'explorer') {
      return isSidePanelOpen && activeViewId === 'explorer' ? <PanelLeftClose className="h-5 w-5" /> : <PanelLeftOpen className="h-5 w-5" />;
    }
    // Potentially add similar logic for other icons if they also toggle open/close states
    // For deploy panel, if it also has an open/close state distinct from just being active
    if (item.id === 'deploy') {
       return isSidePanelOpen && activeViewId === 'deploy' ? <Rocket className="h-5 w-5 text-primary" /> : <item.icon className="h-5 w-5" />;
    }
    return <item.icon className="h-5 w-5" />;
  };

  return (
    <TooltipProvider delayDuration={0}>
      <div className="flex h-full w-12 flex-col items-center bg-secondary py-4 shadow-lg">
        <div className="flex flex-col space-y-2">
          {navItems.map((item) => (
            <Tooltip key={item.id}>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "h-10 w-10 rounded-md text-muted-foreground hover:text-foreground hover:bg-primary/10",
                    activeViewId === item.id && isSidePanelOpen && "text-primary bg-primary/20",
                    activeViewId === item.id && !isSidePanelOpen && "text-primary" // Highlight if active but panel closed
                  )}
                  onClick={() => handleItemClick(item.id)}
                  aria-label={item.name}
                  aria-pressed={activeViewId === item.id && isSidePanelOpen}
                >
                  {getIconForItem(item)}
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

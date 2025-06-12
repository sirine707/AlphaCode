
"use client";

import React from 'react';
import { ArrowLeft, ArrowRight, Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';

const menuItems = ["File", "Edit", "Selection", "View", "Go", "Run", "Terminal", "Help"];

const AlphaIcon = () => (
  <span
    className="text-primary font-medium text-sm mr-3 select-none"
    aria-hidden="true"
  >
    ALPHA
  </span>
);

const TitleBar: React.FC = () => {
  return (
    <div className="flex h-8 items-center justify-between bg-card px-3 shadow-sm border-b border-border select-none">
      <div className="flex items-center">
        <AlphaIcon />
        <div className="flex items-center space-x-3">
          {menuItems.map((item) => (
            <span key={item} className="text-xs text-muted-foreground hover:text-foreground cursor-default">
              {item}
            </span>
          ))}
        </div>
      </div>
      <div className="flex items-center space-x-1">
        <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-foreground">
          <Bot className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-foreground">
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default TitleBar;

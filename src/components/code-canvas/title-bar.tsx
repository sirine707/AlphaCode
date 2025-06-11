
"use client";

import React from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const menuItems = ["File", "Edit", "Selection", "View", "Go", "Run", "Terminal", "Help"];

const AlphaIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className="h-5 w-5 text-primary mr-3" // Added mr-3 for spacing
    aria-hidden="true"
  >
    <path d="M11.25 4.00002L6 19H8.3125L9.4375 15.5H14.5625L15.6875 19H18L12.75 4.00002H11.25ZM10.1875 13.5L12 7.75002L13.8125 13.5H10.1875Z" />
  </svg>
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

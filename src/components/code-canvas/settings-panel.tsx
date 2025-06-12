
"use client";

import React, { useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

interface SettingsPanelProps {
  isOpen: boolean;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({ isOpen }) => {
  const [theme, setTheme] = useState('dark');
  const [fontSize, setFontSize] = useState('14');
  const [tabSize, setTabSize] = useState('4');
  const [wordWrap, setWordWrap] = useState(false);
  const [autoSave, setAutoSave] = useState(true);
  const [terminalFont, setTerminalFont] = useState('monospace');

  return (
    <div
      className={cn(
        "h-full bg-card shadow-md transition-all duration-300 ease-in-out overflow-hidden border-r border-border",
        isOpen ? "w-96 p-3" : "w-0 p-0"
      )}
    >
      {isOpen && (
        <ScrollArea className="h-full">
          <div className="flex flex-col h-full space-y-4">
            <h2 className="mb-1 px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Settings
            </h2>

            <Card className="shadow-none border-border/50">
              <CardHeader className="p-3">
                <CardTitle className="text-sm font-medium">Appearance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 p-3 pt-0">
                <div className="space-y-1">
                  <Label htmlFor="theme-select" className="text-xs font-medium text-muted-foreground">Theme</Label>
                  <Select value={theme} onValueChange={setTheme}>
                    <SelectTrigger id="theme-select" className="text-xs h-8">
                      <SelectValue placeholder="Select theme" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dark" className="text-xs">Dark (CodeCanvas)</SelectItem>
                      <SelectItem value="light" className="text-xs" disabled>Light (Coming Soon)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="font-size-input" className="text-xs font-medium text-muted-foreground">Font Size (px)</Label>
                  <Input
                    id="font-size-input"
                    type="number"
                    value={fontSize}
                    onChange={(e) => setFontSize(e.target.value)}
                    className="text-xs h-8"
                    placeholder="e.g., 14"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-none border-border/50">
              <CardHeader className="p-3">
                <CardTitle className="text-sm font-medium">Editor</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 p-3 pt-0">
                <div className="space-y-1">
                  <Label htmlFor="tab-size-input" className="text-xs font-medium text-muted-foreground">Tab Size</Label>
                  <Input
                    id="tab-size-input"
                    type="number"
                    value={tabSize}
                    onChange={(e) => setTabSize(e.target.value)}
                    className="text-xs h-8"
                    placeholder="e.g., 4"
                  />
                </div>
                <div className="flex items-center justify-between space-x-2 py-2">
                  <Label htmlFor="word-wrap-switch" className="text-xs font-medium text-muted-foreground cursor-pointer">Word Wrap</Label>
                  <Switch id="word-wrap-switch" checked={wordWrap} onCheckedChange={setWordWrap} />
                </div>
                <div className="flex items-center justify-between space-x-2 py-2">
                  <Label htmlFor="auto-save-switch" className="text-xs font-medium text-muted-foreground cursor-pointer">Auto Save</Label>
                  <Switch id="auto-save-switch" checked={autoSave} onCheckedChange={setAutoSave} />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-none border-border/50">
              <CardHeader className="p-3">
                <CardTitle className="text-sm font-medium">Terminal</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 p-3 pt-0">
                 <div className="space-y-1">
                  <Label htmlFor="terminal-font-select" className="text-xs font-medium text-muted-foreground">Font Family</Label>
                  <Select value={terminalFont} onValueChange={setTerminalFont}>
                    <SelectTrigger id="terminal-font-select" className="text-xs h-8">
                      <SelectValue placeholder="Select font family" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monospace" className="text-xs">Monospace</SelectItem>
                      <SelectItem value="courier" className="text-xs">Courier New</SelectItem>
                       <SelectItem value="source-code-pro" className="text-xs">Source Code Pro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <p className="text-xs text-muted-foreground">More terminal settings (e.g., cursor style, shell path) coming soon.</p>
              </CardContent>
            </Card>

          </div>
        </ScrollArea>
      )}
    </div>
  );
};

export default SettingsPanel;

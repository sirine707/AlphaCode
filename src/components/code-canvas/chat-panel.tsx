
"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { X, Paperclip, Mic, AtSign, Send, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const ChatPanel: React.FC<ChatPanelProps> = ({ isOpen, onClose }) => {
  const [inputValue, setInputValue] = useState('');
  const [selectedModel, setSelectedModel] = useState('Claude Sonnet 3.7');

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className={cn(
        "fixed top-0 right-0 h-full bg-card shadow-xl transition-transform duration-300 ease-in-out flex flex-col border-l border-border z-50",
        isOpen ? "translate-x-0 w-[380px]" : "translate-x-full w-[380px]"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-border">
        <h2 className="text-sm font-semibold uppercase text-muted-foreground">CHAT</h2>
        <div className="flex items-center space-x-1">
          {/* Placeholder for other header icons if needed later */}
          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Message Area */}
      <ScrollArea className="flex-1 p-3">
        {/* Placeholder for chat messages */}
        <div className="text-xs text-muted-foreground text-center py-10">
          Ask Copilot anything...
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="p-3 border-t border-border space-y-2">
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
            <Paperclip className="h-4 w-4" />
            <span className="sr-only">Add Context</span>
          </Button>
          <Input
            type="text"
            placeholder="Ask Copilot"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="flex-1 text-xs h-8 bg-background/50 border-border/70 focus:border-primary"
          />
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
              <Mic className="h-4 w-4" />
              <span className="sr-only">Use Microphone</span>
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
              <AtSign className="h-4 w-4" />
              <span className="sr-only">Mention</span>
            </Button>
          </div>
          <div className="flex items-center space-x-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="text-xs h-7 px-2.5 border-border/70">
                  {selectedModel}
                  <ChevronDown className="h-3 w-3 ml-1.5 opacity-70" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[180px]">
                <DropdownMenuItem onSelect={() => setSelectedModel('Claude Sonnet 3.7')} className="text-xs">
                  Claude Sonnet 3.7
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setSelectedModel('GPT-4 Turbo')} className="text-xs">
                  GPT-4 Turbo
                </DropdownMenuItem>
                 <DropdownMenuItem onSelect={() => setSelectedModel('Gemini Pro')} className="text-xs">
                  Gemini Pro
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button size="icon" className="h-8 w-8 bg-primary hover:bg-primary/90" onClick={() => console.log('Send:', inputValue)} disabled={!inputValue.trim()}>
              <Send className="h-4 w-4" />
              <span className="sr-only">Send Message</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatPanel;

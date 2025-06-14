
"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { X, Paperclip, Mic, AtSign, Send, ChevronDown, Folder, FileText, ChevronRight, UserCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { FileItem } from './file-explorer-panel';
import { initialFiles } from './file-explorer-panel';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface ChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ContextFileTreeItemProps {
  item: FileItem;
  level?: number;
  onToggleExpand: (path: string) => void;
  onSelectItem: (file: FileItem) => void;
  expandedPaths: Set<string>;
}

interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  isLoading?: boolean;
  contextPath?: string | null;
  contextName?: string | null;
  contextType?: 'file' | 'folder' | null;
  timestamp: Date;
}

const ContextFileTreeItem: React.FC<ContextFileTreeItemProps> = ({
  item,
  level = 0,
  onToggleExpand,
  onSelectItem,
  expandedPaths,
}) => {
  const isExpanded = expandedPaths.has(item.path);
  const Icon = item.type === 'folder' ? Folder : FileText;

  const handleChevronClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (item.type === 'folder') {
      onToggleExpand(item.path);
    }
  };

  const handleItemSelect = () => {
    onSelectItem(item);
  };

  return (
    <div className="text-xs">
      <div
        className="flex items-center rounded-md px-1.5 py-1 hover:bg-primary/10"
        style={{ paddingLeft: `${level * 0.75}rem` }}
        role="treeitem"
        aria-expanded={item.type === 'folder' ? isExpanded : undefined}
        aria-label={item.name}
      >
        {item.type === 'folder' ? (
          <button
            onClick={handleChevronClick}
            className="shrink-0 p-0.5 text-muted-foreground hover:text-foreground focus:outline-none rounded-sm"
            aria-label={isExpanded ? `Collapse ${item.name}` : `Expand ${item.name}`}
          >
            {isExpanded ? (
              <ChevronDown className="h-3.5 w-3.5" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5" />
            )}
          </button>
        ) : (
          <div className="w-[calc(0.875rem+0.25rem)] shrink-0"></div>
        )}

        <div
          className="ml-1.5 flex flex-1 items-center space-x-1.5 cursor-pointer"
          onClick={handleItemSelect}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleItemSelect()}
          aria-label={`Select ${item.name} as context`}
        >
          <Icon className={cn("h-3.5 w-3.5 shrink-0", item.type === 'folder' ? 'text-accent' : 'text-muted-foreground')} />
          <span>{item.name}</span>
        </div>
      </div>
      {isExpanded && item.children && (
        <div>
          {item.children.map((child) => (
            <ContextFileTreeItem
              key={child.path}
              item={child}
              level={level + 1}
              onToggleExpand={onToggleExpand}
              onSelectItem={onSelectItem}
              expandedPaths={expandedPaths}
            />
          ))}
        </div>
      )}
    </div>
  );
};


const ChatPanel: React.FC<ChatPanelProps> = ({ isOpen, onClose }) => {
  const [inputValue, setInputValue] = useState('');
  const [selectedModel, setSelectedModel] = useState('Claude Sonnet 3.7');
  const [isContextPopoverOpen, setIsContextPopoverOpen] = useState(false);
  const [expandedContextPaths, setExpandedContextPaths] = useState<Set<string>>(new Set(['/']));
  const [selectedContextItem, setSelectedContextItem] = useState<FileItem | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const handleToggleContextExpand = (path: string) => {
    setExpandedContextPaths(prev => {
      const newPaths = new Set(prev);
      if (newPaths.has(path)) {
        newPaths.delete(path);
      } else {
        newPaths.add(path);
      }
      return newPaths;
    });
  };

  const handleSelectContextItem = (item: FileItem) => {
    setSelectedContextItem(item);
    setIsContextPopoverOpen(false);
  };

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: inputValue,
      sender: 'user',
      contextPath: selectedContextItem?.path,
      contextName: selectedContextItem?.name,
      contextType: selectedContextItem?.type,
      timestamp: new Date(),
    };

    const botLoadingMessage: ChatMessage = {
      id: 'bot-loading-' + Date.now(),
      text: '...', 
      sender: 'bot',
      isLoading: true,
      timestamp: new Date(),
    };

    setMessages(prevMessages => [...prevMessages, userMessage, botLoadingMessage]);
    setInputValue('');
    setSelectedContextItem(null);

    // Simulate bot response
    setTimeout(() => {
      let botReplyText = `Simulated reply to: "${userMessage.text}"`; 

      const lowerCaseText = userMessage.text.toLowerCase();
      const fileModificationKeywords = ['modify', 'change', 'update', 'edit', 'write to', 'add to'];
      const knownFilePatterns = [/\b\w+\.py\b/g, /\b\w+\.js\b/g, /\b\w+\.json\b/g, /\b\w+\.md\b/g, /\b\w+\.txt\b/g, /\b\w+\.tsx\b/g, /\b\w+\.css\b/g];
      
      let detectedFile: string | null = null;
      for (const pattern of knownFilePatterns) {
        const match = userMessage.text.match(pattern); // Match against original case text for accuracy
        if (match && match.length > 0) {
          detectedFile = match[0];
          break;
        }
      }
      
      const isModificationRequest = fileModificationKeywords.some(keyword => lowerCaseText.includes(keyword)) && detectedFile;

      if (isModificationRequest) {
        botReplyText = `Understood. I will ask the file modification agent to process your request for \`${detectedFile}\`.`;
      }

      setMessages(prevMessages => {
        const messagesWithoutLoading = prevMessages.filter(msg => !msg.isLoading);
        const botReply: ChatMessage = {
          id: Date.now().toString() + '-bot',
          text: botReplyText,
          sender: 'bot',
          timestamp: new Date(),
        };
        return [...messagesWithoutLoading, botReply];
      });
    }, 2000 + Math.random() * 1000); 
  };

  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollViewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollViewport) {
        scrollViewport.scrollTop = scrollViewport.scrollHeight;
      }
    }
  }, [messages]);


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
          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Message Area */}
      <ScrollArea className="flex-1 p-3" ref={scrollAreaRef}>
        {messages.length === 0 ? (
          <div className="text-xs text-muted-foreground text-center py-10">
            Ask Copilot anything...
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg) => (
              <div key={msg.id} className={cn(
                "flex",
                (msg.sender === 'bot' && msg.isLoading) ? "justify-start" : 
                (msg.sender === 'user' ? "justify-start" : "justify-end")   
              )}>
                <div className={cn(
                  "flex items-start space-x-2 max-w-[85%]",
                  (msg.sender === 'bot' && !msg.isLoading) && "flex-row-reverse space-x-reverse" 
                )}>
                  <Avatar className="h-6 w-6 shrink-0">
                    {msg.sender === 'user' ? (
                      <UserCircle2 className="h-full w-full text-primary" />
                    ) : (
                      <AvatarImage src="https://placehold.co/32x32.png" alt="Bot Avatar" data-ai-hint="bot avatar" />
                    )}
                    <AvatarFallback>{msg.sender === 'user' ? 'U' : 'B'}</AvatarFallback>
                  </Avatar>
                  <div className={cn(
                    "rounded-lg px-3 py-2 text-xs shadow-sm",
                    (msg.sender === 'bot' && msg.isLoading) ? "bg-muted text-foreground" :
                    (msg.sender === 'user' ? "bg-primary/20 text-foreground" : "bg-muted text-foreground")
                  )}>
                    {msg.isLoading && msg.sender === 'bot' ? (
                      <div className="flex items-center space-x-1 py-1"> 
                        <span className="h-1.5 w-1.5 bg-foreground/70 rounded-full animate-pulse" style={{ animationDelay: '0ms' }}></span>
                        <span className="h-1.5 w-1.5 bg-foreground/70 rounded-full animate-pulse" style={{ animationDelay: '200ms' }}></span>
                        <span className="h-1.5 w-1.5 bg-foreground/70 rounded-full animate-pulse" style={{ animationDelay: '400ms' }}></span>
                      </div>
                    ) : (
                      <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                    )}
                    
                    {!msg.isLoading && msg.contextName && (
                      <div className="mt-1.5 pt-1.5 border-t border-border/50 text-muted-foreground text-[0.65rem] leading-tight">
                        Context: <span className="font-medium text-foreground/80">{msg.contextName}</span> ({msg.contextType})
                      </div>
                    )}
                    {!msg.isLoading && (
                       <p className={cn(
                          "mt-1 text-[0.6rem] text-muted-foreground/70",
                          (msg.sender === 'bot' && !msg.isLoading) ? 'text-left' : 'text-right' 
                       )}>
                        {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Input Area */}
      <div className="p-3 border-t border-border space-y-2">
        <div className="flex items-center space-x-2">
          <Popover open={isContextPopoverOpen} onOpenChange={setIsContextPopoverOpen}>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                <Paperclip className="h-4 w-4" />
                <span className="sr-only">Add Context</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="start">
              <div className="p-2 border-b border-border">
                <h3 className="text-xs font-medium text-foreground">Attach Files or Folders</h3>
              </div>
              <ScrollArea className="h-[250px] p-2">
                {initialFiles.map((item) => (
                  <ContextFileTreeItem
                    key={item.path}
                    item={item}
                    onToggleExpand={handleToggleContextExpand}
                    onSelectItem={handleSelectContextItem}
                    expandedPaths={expandedContextPaths}
                  />
                ))}
              </ScrollArea>
            </PopoverContent>
          </Popover>
          <Input
            type="text"
            placeholder="Ask Copilot"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSendMessage())}
            className="flex-1 text-xs h-8 bg-background/50 border-border/70 focus:border-primary"
          />
        </div>

        {selectedContextItem && (
          <div className="flex items-center justify-between rounded-md bg-background/50 p-1.5 text-xs text-muted-foreground shadow-sm border border-border/50 max-w-xs">
            <div className="flex items-center space-x-1.5 overflow-hidden">
              {selectedContextItem.type === 'folder' ? <Folder className="h-3.5 w-3.5 text-accent shrink-0" /> : <FileText className="h-3.5 w-3.5 shrink-0" />}
              <span className="truncate">
                Context: <span className="font-medium text-foreground">{selectedContextItem.name}</span> ({selectedContextItem.type})
              </span>
            </div>
            <Button variant="ghost" size="icon" className="h-5 w-5 text-muted-foreground hover:text-foreground shrink-0" onClick={() => setSelectedContextItem(null)}>
              <X className="h-3 w-3" />
              <span className="sr-only">Clear context</span>
            </Button>
          </div>
        )}

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
            <Button size="icon" className="h-8 w-8 bg-primary hover:bg-primary/90" onClick={handleSendMessage} disabled={!inputValue.trim()}>
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
    

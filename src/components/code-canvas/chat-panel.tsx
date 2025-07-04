"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import {
  X,
  Paperclip,
  Mic,
  AtSign,
  Send,
  ChevronDown,
  Folder,
  FileText,
  ChevronRight,
  UserCircle2,
} from "lucide-react";
import { detectLanguage } from "@/lib/language-detection";
import { cn } from "@/lib/utils";
import type { FileItem } from "./file-explorer-panel";
import { initialFiles } from "./file-explorer-panel"; // Uses the re-exported initialFilesData
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const models = [
  {
    id: "qwen/qwen-2.5-coder-32b-instruct:free",
    name: "Qwen 2.5 Coder (Free)",
  },
  {
    id: "mistralai/mistral-7b-instruct:free",
    name: "Mistral 7B Instruct (Free)",
  },
  {
    id: "nousresearch/nous-hermes-2-mixtral-8x7b-dpo:free",
    name: "Nous Hermes 2 Mixtral (Free)",
  },
  { id: "google/gemma-7b-it:free", name: "Google Gemma 7B (Free)" },
  {
    id: "meta-llama/llama-3-8b-instruct:free",
    name: "Meta Llama 3 8B Instruct (Free)",
  },
];

const rootFileItem: FileItem = {
  name: "Project Files",
  type: "folder",
  path: "/",
  children: initialFiles, // initialFiles is the array
};

interface ChatPanelProps {}

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
  sender: "user" | "bot";
  isLoading?: boolean;
  contextPath?: string | null;
  contextName?: string | null;
  contextType?: "file" | "folder" | null;
  timestamp: Date;
  explanation?: string; // Add this field to store the explanation
}

const ContextFileTreeItem: React.FC<ContextFileTreeItemProps> = ({
  item,
  level = 0,
  onToggleExpand,
  onSelectItem,
  expandedPaths,
}) => {
  const isExpanded = expandedPaths.has(item.path);
  const Icon = item.type === "folder" ? Folder : FileText;

  const handleChevronClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (item.type === "folder") {
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
        aria-expanded={item.type === "folder" ? isExpanded : undefined}
        aria-label={item.name}
      >
        {item.type === "folder" ? (
          <button
            onClick={handleChevronClick}
            className="shrink-0 p-0.5 text-muted-foreground hover:text-foreground focus:outline-none rounded-sm"
            aria-label={
              isExpanded ? `Collapse ${item.name}` : `Expand ${item.name}`
            }
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
          onKeyDown={(e) =>
            (e.key === "Enter" || e.key === " ") && handleItemSelect()
          }
          aria-label={`Select ${item.name} as context`}
        >
          <Icon
            className={cn(
              "h-3.5 w-3.5 shrink-0",
              item.type === "folder" ? "text-accent" : "text-muted-foreground"
            )}
          />
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

const ChatPanel: React.FC<ChatPanelProps> = () => {
  const [inputValue, setInputValue] = useState("");
  const [selectedModel, setSelectedModel] = useState(models[0].id);
  const [isContextPopoverOpen, setIsContextPopoverOpen] = useState(false);
  const [expandedContextPaths, setExpandedContextPaths] = useState<Set<string>>(
    new Set(["/"])
  );
  const [selectedContextItem, setSelectedContextItem] =
    useState<FileItem | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isContextSelectorOpen, setIsContextSelectorOpen] = useState(false);
  const [selectedContext, setSelectedContext] = useState<FileItem | null>(null);
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(
    new Set(["/"])
  );
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() && !selectedContext) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: input,
      sender: "user",
      contextPath: selectedContext?.path,
      contextName: selectedContext?.name,
      contextType: selectedContext?.type,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);

    // If there's a file context, call the explain API route
    if (selectedContext && selectedContext.type === "file") {
      setIsLoading(true);
      const botLoadingMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: "",
        sender: "bot",
        isLoading: true,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botLoadingMessage]);

      try {
        const response = await fetch("/api/explain", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            filePath: selectedContext.path,
            model: selectedModel,
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        const botMessage: ChatMessage = {
          id: (Date.now() + 2).toString(),
          text: result.explanation,
          sender: "bot",
          timestamp: new Date(),
        };
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === botLoadingMessage.id ? botMessage : msg
          )
        );
      } catch (error) {
        console.error("Failed to explain file:", error);
        const errorMessage: ChatMessage = {
          id: (Date.now() + 2).toString(),
          text: "Sorry, I couldn't explain that file. Please try again.",
          sender: "bot",
          timestamp: new Date(),
        };
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === botLoadingMessage.id ? errorMessage : msg
          )
        );
      } finally {
        setIsLoading(false);
      }
    }

    setInput("");
    setSelectedContext(null);
    setIsContextSelectorOpen(false);
  };

  // Function to handle the explanation when the button is clicked
  const handleExplainFile = async (file: FileItem) => {
    if (file.type !== "file") return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: `Explain the file: ${file.name}`,
      sender: "user",
      contextPath: file.path,
      contextName: file.name,
      contextType: "file",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    const botLoadingMessage: ChatMessage = {
      id: (Date.now() + 1).toString(),
      text: "",
      sender: "bot",
      isLoading: true,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, botLoadingMessage]);

    try {
      const response = await fetch("/api/explain", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ filePath: file.path, model: selectedModel }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      const botMessage: ChatMessage = {
        id: (Date.now() + 2).toString(),
        text: result.explanation,
        sender: "bot",
        timestamp: new Date(),
      };

      setMessages((prev) =>
        prev.map((msg) => (msg.id === botLoadingMessage.id ? botMessage : msg))
      );
    } catch (error) {
      console.error("Failed to explain file:", error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 2).toString(),
        text: "Sorry, I couldn't explain that file. Please try again.",
        sender: "bot",
        timestamp: new Date(),
      };
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === botLoadingMessage.id ? errorMessage : msg
        )
      );
    } finally {
      setIsLoading(false);
      setIsContextSelectorOpen(false); // Close the selector after explaining
    }
  };

  const handleToggleExpand = (path: string) => {
    setExpandedPaths((prev) => {
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

  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollViewport = scrollAreaRef.current.querySelector(
        "[data-radix-scroll-area-viewport]"
      );
      if (scrollViewport) {
        scrollViewport.scrollTop = scrollViewport.scrollHeight;
      }
    }
  }, [messages]);

  const selectedModelName =
    models.find((m) => m.id === selectedModel)?.name || "Select Model";

  return (
    <div
      className={cn(
        "flex h-full flex-col bg-card", // Changed from bg-background
        "w-full md:w-[440px]"
      )}
    >
      <div className="flex items-center justify-between border-b p-2">
        <div className="flex items-center space-x-2">
          <h2 className="text-lg font-semibold">Chat</h2>
        </div>
      </div>
      <ScrollArea className="flex-1" ref={scrollAreaRef}>
        <div className="space-y-6 p-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex items-start gap-3",
                message.sender === "user" ? "justify-end" : ""
              )}
            >
              {message.sender === "bot" && (
                <Avatar className="h-8 w-8 border">
                  <AvatarImage src="/bot-avatar.png" alt="AI Avatar" />
                  <AvatarFallback>AI</AvatarFallback>
                </Avatar>
              )}
              <div
                className={cn(
                  "max-w-xs rounded-lg px-3 py-2 text-sm md:max-w-md",
                  message.sender === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-card text-card-foreground", // Changed from bg-muted
                  message.isLoading && "animate-pulse"
                )}
              >
                {message.contextName && (
                  <div className="mb-2 flex items-center gap-1.5 rounded-md border bg-background/50 p-1.5 text-xs">
                    {message.contextType === "file" ? (
                      <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    ) : (
                      <Folder className="h-3.5 w-3.5 shrink-0 text-accent" />
                    )}
                    <span className="truncate font-mono">
                      {message.contextName}
                    </span>
                  </div>
                )}
                <p className="whitespace-pre-wrap">{message.text}</p>
                <div className="mt-1.5 text-right text-xs text-muted-foreground/80">
                  {new Date(message.timestamp).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
              {message.sender === "user" && (
                <Avatar className="h-8 w-8 border">
                  <AvatarImage src="/user-avatar.png" alt="User Avatar" />
                  <AvatarFallback>U</AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>
      <div className="border-t p-2">
        {selectedContextItem && (
          <div className="mb-2 flex items-center justify-between rounded-md border bg-muted p-1.5 pl-2.5 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium">Context:</span>
              <div className="flex items-center gap-1.5">
                {selectedContextItem.type === "file" ? (
                  <FileText className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Folder className="h-4 w-4 text-accent" />
                )}
                <span className="truncate font-mono text-xs">
                  {selectedContextItem.name}
                </span>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setSelectedContextItem(null)}
            >
              <X className="h-3.5 w-3.5" />
              <span className="sr-only">Remove context</span>
            </Button>
          </div>
        )}
        <div className="relative">
          <Input
            placeholder="Ask a question or type '/' for commands..."
            className="pr-24"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-2">
            <Popover
              open={isContextPopoverOpen}
              onOpenChange={setIsContextPopoverOpen}
            >
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7">
                  <Paperclip className="h-4 w-4" />
                  <span className="sr-only">Attach context</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-1" align="end">
                <ScrollArea className="h-[20rem]">
                  <ContextFileTreeItem
                    item={rootFileItem}
                    onToggleExpand={handleToggleExpand}
                    onSelectItem={handleSelectContextItem}
                    expandedPaths={expandedContextPaths}
                  />
                </ScrollArea>
              </PopoverContent>
            </Popover>
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <Mic className="h-4 w-4" />
              <span className="sr-only">Use microphone</span>
            </Button>
          </div>
        </div>
        <div className="mt-2 flex items-center justify-between">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="h-8 text-xs">
                {selectedModelName}
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {models.map((model) => (
                <DropdownMenuItem
                  key={model.id}
                  onSelect={() => setSelectedModel(model.id)}
                >
                  {model.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button onClick={() => handleSendMessage()} className="h-8">
            Send
            <Send className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatPanel;

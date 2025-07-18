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
import Avatar3D from "@/components/ui/avatar-3d";

const models = [
  {
    id: "deepseek/deepseek-chat-v3-0324:free",
    name: "DeepSeek Chat V3",
  },
  {
    id: "google/gemini-2.0-flash-exp:free",
    name: "Gemini 2.0 Flash",
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
  const [isContextSelectorOpen, setIsContextSelectorOpen] = useState(false);
  const [selectedContext, setSelectedContext] = useState<FileItem | null>(null);
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(
    new Set(["/"])
  );
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputValue.trim() && !selectedContext && !selectedContextItem) return;

    // Use selectedContextItem if available, otherwise fall back to selectedContext
    const contextToUse = selectedContextItem || selectedContext;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: inputValue,
      sender: "user",
      contextPath: contextToUse?.path,
      contextName: contextToUse?.name,
      contextType: contextToUse?.type,
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
      let response;

      // If there's a file context, call the explain API route
      if (contextToUse && contextToUse.type === "file") {
        response = await fetch("/api/explain", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            filePath: contextToUse.path,
            model: selectedModel,
            content: contextToUse.content,
          }),
        });
      } else {
        // For general chat messages, call the chat API route
        response = await fetch("/api/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: inputValue,
            model: selectedModel,
          }),
        });
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      const botMessage: ChatMessage = {
        id: (Date.now() + 2).toString(),
        text: result.explanation || result.response,
        sender: "bot",
        timestamp: new Date(),
      };
      setMessages((prev) =>
        prev.map((msg) => (msg.id === botLoadingMessage.id ? botMessage : msg))
      );
    } catch (error) {
      console.error("Failed to get AI response:", error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 2).toString(),
        text: "Sorry, I couldn't process your request. Please try again.",
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

    setInputValue("");
    setSelectedContext(null);
    setSelectedContextItem(null);
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
        body: JSON.stringify({
          filePath: file.path,
          model: selectedModel,
          content: file.content,
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
        "flex h-full flex-col bg-card overflow-hidden panel-content", // Added panel-content class
        "w-full min-w-0 max-w-full"
      )}
    >
      <div className="flex items-center justify-between border-b p-2 shrink-0">
        {" "}
        {/* Added shrink-0 */}
        <div className="flex items-center space-x-2 min-w-0">
          {" "}
          {/* Added min-w-0 */}
          <h2 className="text-lg font-semibold truncate">Chat</h2>{" "}
          {/* Added truncate */}
        </div>
      </div>
      <ScrollArea className="flex-1 min-h-0" ref={scrollAreaRef}>
        {" "}
        {/* Added min-h-0 */}
        <div className="space-y-6 p-4 min-w-0">
          {" "}
          {/* Added min-w-0 */}
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex items-start gap-3 min-w-0",
                message.sender === "user" ? "justify-end" : ""
              )}
            >
              {message.sender === "bot" && (
                <Avatar className="h-12 w-12 border">
                  <AvatarImage src="/bot-avatar.png" alt="AI Avatar" />
                  <AvatarFallback>AI</AvatarFallback>
                </Avatar>
              )}
              <div
                className={cn(
                  "max-w-[85%] rounded-lg px-3 py-2 text-sm break-words min-w-0 word-wrap overflow-wrap-anywhere", // Added responsive word wrapping
                  message.sender === "user"
                    ? "bg-primary text-primary-foreground ml-auto"
                    : "bg-muted",
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
              {message.sender === "user" && <Avatar3D className="h-12 w-12" />}
            </div>
          ))}
        </div>
      </ScrollArea>
      <div className="border-t p-2 space-y-2 shrink-0 min-w-0">
        {" "}
        {/* Added shrink-0 and min-w-0 */}
        {selectedContextItem && (
          <div className="flex items-center justify-between rounded-md border bg-muted p-1.5 pl-2.5 text-sm min-w-0">
            {" "}
            {/* Added min-w-0 */}
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <span className="text-xs font-medium shrink-0">Context:</span>
              <div className="flex items-center gap-1.5 min-w-0 flex-1">
                {selectedContextItem.type === "file" ? (
                  <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                ) : (
                  <Folder className="h-4 w-4 text-accent shrink-0" />
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
        <div className="relative min-w-0">
          {" "}
          {/* Added min-w-0 */}
          <Input
            placeholder="Ask a question or type '/' for commands..."
            className="pr-16 text-sm min-w-0 w-full" // Added min-w-0 and w-full
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-2 gap-1 shrink-0">
            {" "}
            {/* Added shrink-0 */}
            <Popover
              open={isContextPopoverOpen}
              onOpenChange={setIsContextPopoverOpen}
            >
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6">
                  {" "}
                  {/* Made smaller */}
                  <Paperclip className="h-3.5 w-3.5" />
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
            <Button variant="ghost" size="icon" className="h-6 w-6">
              {" "}
              {/* Made smaller */}
              <Mic className="h-3.5 w-3.5" />
              <span className="sr-only">Use microphone</span>
            </Button>
          </div>
        </div>
        <div className="flex items-center justify-between gap-2 min-w-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="h-7 text-xs truncate max-w-[150px] min-w-0"
              >
                <span className="truncate">{selectedModelName}</span>
                <ChevronDown className="ml-1 h-3 w-3 shrink-0" />
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
          <Button
            onClick={() => handleSendMessage()}
            className="h-7 text-xs shrink-0"
          >
            Send
            <Send className="ml-1 h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatPanel;

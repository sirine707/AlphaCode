"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import {
  Plus,
  Undo2,
  GitCommit,
  GitBranch,
  ArrowUp,
  ArrowDown,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  CheckCircle,
  Circle,
  Minus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface SourceControlPanelProps {
  isOpen: boolean;
}

interface ChangedFile {
  id: string;
  name: string;
  status: "M" | "A" | "D" | "R" | "U"; // Modified, Added, Deleted, Renamed, Untracked
  staged: boolean;
}

const mockInitialFiles: ChangedFile[] = [
  { id: "1", name: "src/app/page.tsx", status: "M", staged: false },
  {
    id: "2",
    name: "src/components/code-canvas/code-canvas-layout.tsx",
    status: "M",
    staged: true,
  },
  { id: "3", name: "public/new-image.png", status: "A", staged: false },
  { id: "4", name: "README.md", status: "R", staged: true },
  { id: "5", name: "src/styles/globals.css", status: "D", staged: false },
  { id: "6", name: "src/utils/helpers.ts", status: "U", staged: false },
];

type SourceControlSectionName =
  | "commit"
  | "changes"
  | "stagedChanges"
  | "branches"
  | "remotes";

const SourceControlPanel: React.FC<SourceControlPanelProps> = ({ isOpen }) => {
  const [commitMessage, setCommitMessage] = useState("");
  const [files, setFiles] = useState<ChangedFile[]>(mockInitialFiles);

  const [openSections, setOpenSections] = useState<
    Record<SourceControlSectionName, boolean>
  >({
    commit: true,
    changes: true,
    stagedChanges: true,
    branches: false,
    remotes: false,
  });

  const toggleSection = (sectionName: SourceControlSectionName) => {
    setOpenSections((prev) => ({ ...prev, [sectionName]: !prev[sectionName] }));
  };

  const unstagedFiles = files.filter((f) => !f.staged);
  const stagedFiles = files.filter((f) => f.staged);

  const handleCommit = () => {
    if (!commitMessage.trim()) {
      // Optionally, show a toast or an error message
      console.error("Commit message cannot be empty.");
      return;
    }
    if (stagedFiles.length === 0) {
      // Optionally, show a toast or an error message
      console.error("No files staged to commit.");
      return;
    }
    console.log("Commit message:", commitMessage);
    console.log(
      "Committing files:",
      stagedFiles.map((f) => f.name)
    );
    setCommitMessage("");
    setFiles(files.filter((f) => !f.staged)); // Remove committed files (which were staged)
  };

  const toggleStageFile = (fileId: string) => {
    setFiles(
      files.map((f) => (f.id === fileId ? { ...f, staged: !f.staged } : f))
    );
  };

  const stageAllChanges = () => {
    setFiles(files.map((f) => ({ ...f, staged: true })));
  };

  const unstageAllChanges = () => {
    setFiles(files.map((f) => ({ ...f, staged: false })));
  };

  const discardChanges = (fileId: string) => {
    setFiles(files.filter((f) => f.id !== fileId));
    // In a real app, this would revert the file changes.
  };

  const getStatusColorAndLetter = (
    status: ChangedFile["status"]
  ): { color: string; letter: string } => {
    switch (status) {
      case "M":
        return { color: "text-yellow-400", letter: "M" };
      case "A":
        return { color: "text-green-400", letter: "A" };
      case "D":
        return { color: "text-red-400", letter: "D" };
      case "R":
        return { color: "text-blue-400", letter: "R" };
      case "U":
        return { color: "text-purple-400", letter: "U" };
      default:
        return { color: "text-foreground", letter: "?" };
    }
  };

  const FileListItem: React.FC<{
    file: ChangedFile;
    onToggleStage: (id: string) => void;
    onDiscard: (id: string) => void;
    isStagedList?: boolean;
  }> = ({ file, onToggleStage, onDiscard, isStagedList }) => {
    const { color, letter } = getStatusColorAndLetter(file.status);
    return (
      <li className="flex items-center justify-between group text-xs py-1 hover:bg-primary/10 px-1.5 rounded-sm min-w-0 w-full">
        <div className="flex items-center overflow-hidden min-w-0 flex-1">
          <span className={cn("w-5 text-center font-mono shrink-0", color)}>
            {letter}
          </span>
          <span className="truncate min-w-0 flex-1" title={file.name}>
            {file.name}
          </span>
        </div>
        <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5"
                  onClick={() => onToggleStage(file.id)}
                >
                  {isStagedList ? (
                    <Minus className="h-3 w-3" />
                  ) : (
                    <Plus className="h-3 w-3" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent
                side="top"
                className="bg-card text-foreground border-border text-xs p-1"
              >
                <p>{isStagedList ? "Unstage Change" : "Stage Change"}</p>
              </TooltipContent>
            </Tooltip>
            {!isStagedList && ( // Discard only for unstaged changes
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5"
                    onClick={() => onDiscard(file.id)}
                  >
                    <Undo2 className="h-3 w-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent
                  side="top"
                  className="bg-card text-foreground border-border text-xs p-1"
                >
                  <p>Discard Changes</p>
                </TooltipContent>
              </Tooltip>
            )}
          </TooltipProvider>
        </div>
      </li>
    );
  };

  return (
    <div
      className={cn(
        "h-full bg-card shadow-md transition-all duration-300 ease-in-out overflow-hidden border-r border-border panel-content",
        isOpen ? "w-full min-w-0 p-3 flex flex-col" : "w-0 p-0" // Added flex flex-col for better layout
      )}
    >
      {isOpen && (
        <ScrollArea className="flex-1 min-h-0 w-full">
          <div className="flex flex-col space-y-3 min-w-0 w-full">
            <Card className="shadow-none border-border/50 w-full">
              <CardHeader
                className="p-3 flex flex-row items-center justify-between cursor-pointer min-w-0"
                onClick={() => toggleSection("commit")}
                role="button"
                tabIndex={0}
                onKeyDown={(e) =>
                  (e.key === "Enter" || e.key === " ") &&
                  toggleSection("commit")
                }
                aria-expanded={openSections.commit}
                aria-controls="commit-content"
              >
                <div className="flex items-center min-w-0 flex-1">
                  <GitCommit className="h-4 w-4 mr-2 text-primary shrink-0" />
                  <CardTitle className="text-sm font-medium truncate">
                    Commit
                  </CardTitle>
                </div>
                <div className="shrink-0">
                  {openSections.commit ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </div>
              </CardHeader>
              {openSections.commit && (
                <CardContent
                  className="space-y-2.5 p-3 pt-0 w-full"
                  id="commit-content"
                >
                  <Textarea
                    placeholder="Commit message (e.g., Fix: Add responsive styles)"
                    value={commitMessage}
                    onChange={(e) => setCommitMessage(e.target.value)}
                    className="text-xs h-20 bg-background/30 border-border/70 font-code leading-relaxed resize-none min-w-0 w-full"
                    aria-label="Commit message"
                  />
                  <Button
                    onClick={handleCommit}
                    size="sm"
                    className="w-full text-xs h-7 min-w-0"
                    disabled={!commitMessage.trim() || stagedFiles.length === 0}
                  >
                    <span className="truncate">Commit to</span>{" "}
                    <span className="font-semibold ml-1 truncate">main</span>
                  </Button>
                  <div className="flex space-x-1.5 mt-1.5 w-full">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 text-xs h-7 min-w-0"
                    >
                      <ArrowUp className="h-3.5 w-3.5 mr-1 shrink-0" />{" "}
                      <span className="truncate">Push</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 text-xs h-7 min-w-0"
                    >
                      <ArrowDown className="h-3.5 w-3.5 mr-1 shrink-0" />{" "}
                      <span className="truncate">Pull</span>
                    </Button>
                    <TooltipProvider delayDuration={300}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="icon"
                            className="text-xs h-7 w-7 shrink-0"
                          >
                            <RefreshCw className="h-3.5 w-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent
                          side="top"
                          className="bg-card text-foreground border-border text-xs p-1"
                        >
                          <p>Fetch/Refresh</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </CardContent>
              )}
            </Card>

            <Card className="shadow-none border-border/50 w-full">
              <CardHeader
                className="p-3 flex flex-row items-center justify-between cursor-pointer min-w-0"
                onClick={() => toggleSection("stagedChanges")}
                role="button"
                tabIndex={0}
                onKeyDown={(e) =>
                  (e.key === "Enter" || e.key === " ") &&
                  toggleSection("stagedChanges")
                }
                aria-expanded={openSections.stagedChanges}
                aria-controls="staged-changes-content"
              >
                <div className="flex items-center min-w-0 flex-1">
                  <CheckCircle className="h-4 w-4 mr-2 text-green-500 shrink-0" />
                  <CardTitle className="text-sm font-medium truncate">
                    Staged Changes ({stagedFiles.length})
                  </CardTitle>
                </div>
                <div className="shrink-0">
                  {openSections.stagedChanges ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </div>
              </CardHeader>
              {openSections.stagedChanges && (
                <CardContent
                  className="p-3 pt-0 w-full"
                  id="staged-changes-content"
                >
                  {stagedFiles.length > 0 ? (
                    <>
                      <ul className="space-y-1 max-h-48 overflow-y-auto mb-2 w-full">
                        {stagedFiles.map((file) => (
                          <FileListItem
                            key={file.id}
                            file={file}
                            onToggleStage={toggleStageFile}
                            onDiscard={discardChanges}
                            isStagedList
                          />
                        ))}
                      </ul>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-xs h-7 min-w-0"
                        onClick={unstageAllChanges}
                      >
                        <span className="truncate">Unstage All Changes</span>
                      </Button>
                    </>
                  ) : (
                    <p className="text-xs text-muted-foreground italic py-2 w-full">
                      No staged changes. Stage files from "Changes" below.
                    </p>
                  )}
                </CardContent>
              )}
            </Card>

            <Card className="shadow-none border-border/50 w-full">
              <CardHeader
                className="p-3 flex flex-row items-center justify-between cursor-pointer min-w-0"
                onClick={() => toggleSection("changes")}
                role="button"
                tabIndex={0}
                onKeyDown={(e) =>
                  (e.key === "Enter" || e.key === " ") &&
                  toggleSection("changes")
                }
                aria-expanded={openSections.changes}
                aria-controls="changes-content"
              >
                <div className="flex items-center min-w-0 flex-1">
                  <Circle className="h-4 w-4 mr-2 text-blue-500 shrink-0" />
                  <CardTitle className="text-sm font-medium truncate">
                    Changes ({unstagedFiles.length})
                  </CardTitle>
                </div>
                <div className="shrink-0">
                  {openSections.changes ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </div>
              </CardHeader>
              {openSections.changes && (
                <CardContent className="p-3 pt-0 w-full" id="changes-content">
                  {unstagedFiles.length > 0 ? (
                    <>
                      <ul className="space-y-1 max-h-48 overflow-y-auto mb-2 w-full">
                        {unstagedFiles.map((file) => (
                          <FileListItem
                            key={file.id}
                            file={file}
                            onToggleStage={toggleStageFile}
                            onDiscard={discardChanges}
                          />
                        ))}
                      </ul>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-xs h-7 min-w-0"
                        onClick={stageAllChanges}
                      >
                        <span className="truncate">Stage All Changes</span>
                      </Button>
                    </>
                  ) : (
                    <p className="text-xs text-muted-foreground italic py-2 w-full">
                      No unstaged changes.
                    </p>
                  )}
                </CardContent>
              )}
            </Card>

            <Card className="shadow-none border-border/50 w-full">
              <CardHeader
                className="p-3 flex flex-row items-center justify-between cursor-pointer min-w-0"
                onClick={() => toggleSection("branches")}
                role="button"
                tabIndex={0}
                onKeyDown={(e) =>
                  (e.key === "Enter" || e.key === " ") &&
                  toggleSection("branches")
                }
                aria-expanded={openSections.branches}
                aria-controls="branches-content"
              >
                <div className="flex items-center min-w-0 flex-1">
                  <GitBranch className="h-4 w-4 mr-2 text-accent shrink-0" />
                  <CardTitle className="text-sm font-medium truncate">
                    Branches
                  </CardTitle>
                </div>
                <div className="shrink-0">
                  {openSections.branches ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </div>
              </CardHeader>
              {openSections.branches && (
                <CardContent className="p-3 pt-0 w-full" id="branches-content">
                  <p className="text-xs text-muted-foreground w-full">
                    Current branch:{" "}
                    <span className="text-foreground font-semibold">main</span>
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-xs h-7 mt-2 min-w-0"
                  >
                    <span className="truncate">Switch/Create Branch</span>
                  </Button>
                  {/* Placeholder for branch list: e.g., main, develop, feature/xyz */}
                  <ul className="mt-2 space-y-1 text-xs w-full">
                    <li className="text-foreground font-semibold truncate">
                      main
                    </li>
                    <li className="text-muted-foreground hover:text-foreground cursor-pointer truncate">
                      develop
                    </li>
                    <li className="text-muted-foreground hover:text-foreground cursor-pointer truncate">
                      feature/new-auth
                    </li>
                  </ul>
                </CardContent>
              )}
            </Card>

            <Card className="shadow-none border-border/50 w-full">
              <CardHeader
                className="p-3 flex flex-row items-center justify-between cursor-pointer min-w-0"
                onClick={() => toggleSection("remotes")}
                role="button"
                tabIndex={0}
                onKeyDown={(e) =>
                  (e.key === "Enter" || e.key === " ") &&
                  toggleSection("remotes")
                }
                aria-expanded={openSections.remotes}
                aria-controls="remotes-content"
              >
                <CardTitle className="text-sm font-medium truncate flex-1 min-w-0">
                  Remotes
                </CardTitle>
                <div className="shrink-0">
                  {openSections.remotes ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </div>
              </CardHeader>
              {openSections.remotes && (
                <CardContent className="p-3 pt-0 w-full" id="remotes-content">
                  <p className="text-xs text-muted-foreground w-full break-all">
                    origin:{" "}
                    <span className="text-foreground">
                      git@github.com:user/repo.git
                    </span>
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-xs h-7 mt-2 min-w-0"
                  >
                    <span className="truncate">Manage Remotes</span>
                  </Button>
                </CardContent>
              )}
            </Card>
          </div>
        </ScrollArea>
      )}
    </div>
  );
};

export default SourceControlPanel;

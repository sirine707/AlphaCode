"use client";

import React, { useState, useCallback, useEffect } from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import ActivityBar from "./activity-bar";
import FileExplorerPanel, {
  type FileItem,
  initialFilesData,
} from "./file-explorer-panel";
import EditorWorkspace from "./editor-workspace";
import TitleBar from "./title-bar";
import DeployPanel from "./deploy-panel";
import SourceControlPanel from "./source-control-panel";
import ExtensionsPanel from "./extensions-panel";
import SettingsPanel from "./settings-panel";
import ChatPanel from "./chat-panel";
import { detectLanguage } from "@/lib/language-detection";
import { File as FileIcon } from "lucide-react";

export type ActiveView =
  | "explorer"
  | "source-control"
  | "extensions"
  | "settings"
  | null;

export type ActiveRightView = "deploy" | "chat" | null;

const CodeCanvasLayout: React.FC = () => {
  const [activeView, setActiveView] = useState<ActiveView>("explorer");
  const [isSidePanelVisible, setIsSidePanelVisible] = useState(true);
  const [activeRightView, setActiveRightView] =
    useState<ActiveRightView>("chat");
  const [isRightPanelVisible, setIsRightPanelVisible] = useState(true);
  const [rightPanelDefaultSize, setRightPanelDefaultSize] = useState(30);
  const [isAutocompletionEnabled, setIsAutocompletionEnabled] = useState(false);
  const [isAutocompleteMode, setIsAutocompleteMode] = useState(false);
  const [activeRightPanel, setActiveRightPanel] = useState<
    "chat" | "deploy" | "settings" | "extensions"
  >("chat");
  const [dockerfileGenerationTrigger, setDockerfileGenerationTrigger] =
    useState(0);

  // Responsive state for screen size
  const [isMediumScreen, setIsMediumScreen] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMediumScreen(window.innerWidth >= 768 && window.innerWidth < 1024);
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  // Adjust default sizes based on screen size
  useEffect(() => {
    if (isMediumScreen) {
      setRightPanelDefaultSize(25); // Smaller right panel on medium screens
      // Auto-hide left panel if both panels are open on medium screens to save space
      if (isSidePanelVisible && isRightPanelVisible) {
        // Keep both panels but make them smaller
      }
    } else {
      setRightPanelDefaultSize(30);
    }
  }, [isMediumScreen, isSidePanelVisible, isRightPanelVisible]);

  const [openFiles, setOpenFiles] = useState<FileItem[]>([]);
  const [activeFilePath, setActiveFilePath] = useState<string | null>(null);

  // State for FileExplorerPanel, lifted up
  const [explorerProjectFiles, setExplorerProjectFiles] =
    useState<FileItem[]>(initialFilesData);
  const [explorerExpandedPaths, setExplorerExpandedPaths] = useState<
    Set<string>
  >(new Set(["/", "/src"])); // Expand root and src folders by default

  const handleViewChange = useCallback(
    (viewId: ActiveView | ActiveRightView) => {
      if (viewId === "deploy" || viewId === "chat") {
        if (activeRightView === viewId && isRightPanelVisible) {
          setIsRightPanelVisible(false);
          setActiveRightView(null);
        } else {
          setActiveRightView(viewId);
          setIsRightPanelVisible(true);
        }
      } else {
        if (activeView === viewId) {
          setIsSidePanelVisible((prev) => !prev);
        } else {
          setActiveView(viewId);
          setIsSidePanelVisible(true);
        }
      }
    },
    [activeView, activeRightView, isRightPanelVisible]
  );

  const handleDeployClick = useCallback(() => {
    // First check if we should toggle the panel closed
    if (activeRightView === "deploy" && isRightPanelVisible) {
      setIsRightPanelVisible(false);
      setActiveRightView(null);
      return;
    }

    // If panel is not open or different panel is open, proceed with deploy logic
    const root = explorerProjectFiles[0];
    let dockerfileExists = false;
    if (root && root.type === "folder" && root.children) {
      dockerfileExists = root.children.some(
        (file) => file.name === "Dockerfile" && file.type === "file"
      );
    }

    if (!dockerfileExists && root) {
      const newDockerfile: FileItem = {
        name: "Dockerfile",
        type: "file",
        path: `${root.path === "/" ? "" : root.path}/Dockerfile`,
        content: "# Dockerfile will be generated here",
        icon: FileIcon,
      };

      const newProjectFiles = explorerProjectFiles.map((file, index) => {
        if (index === 0 && file.type === "folder") {
          return {
            ...file,
            children: [newDockerfile, ...(file.children || [])],
          };
        }
        return file;
      });
      setExplorerProjectFiles(newProjectFiles);
    }

    // Open the deploy panel
    setActiveRightView("deploy");
    setIsRightPanelVisible(true);
    setDockerfileGenerationTrigger((prev) => prev + 1);
  }, [
    explorerProjectFiles,
    activeRightView,
    isRightPanelVisible,
    setExplorerProjectFiles,
  ]);

  const toggleChatPanel = useCallback(() => {
    if (activeRightView === "chat" && isRightPanelVisible) {
      setIsRightPanelVisible(false);
      setActiveRightView(null);
    } else {
      setActiveRightView("chat");
      setIsRightPanelVisible(true);
    }
  }, [activeRightView, isRightPanelVisible]);

  const toggleAutocompletion = useCallback(() => {
    setIsAutocompletionEnabled((prev) => !prev);
  }, []);

  const handleOpenFile = useCallback(
    (file: FileItem) => {
      if (file.type === "file") {
        // If file is not already open, add it to the open files list.
        if (!openFiles.some((f) => f.path === file.path)) {
          setOpenFiles((prev) => [...prev, file]);
        }

        // Set the clicked file as the active file.
        setActiveFilePath(file.path);

        // If explorer is not active, switch to it and ensure side panel is visible
        if (activeView !== "explorer" || !isSidePanelVisible) {
          setActiveView("explorer");
          setIsSidePanelVisible(true);
        }
      }
    },
    [openFiles, activeView, isSidePanelVisible]
  );

  const handleCloseFile = useCallback(
    (filePathToClose: string) => {
      const fileIndex = openFiles.findIndex((f) => f.path === filePathToClose);
      if (fileIndex === -1) return;

      const updatedOpenFiles = openFiles.filter(
        (f) => f.path !== filePathToClose
      );
      setOpenFiles(updatedOpenFiles);

      // If the closed file was the active one, determine the next active file.
      if (activeFilePath === filePathToClose) {
        if (updatedOpenFiles.length === 0) {
          setActiveFilePath(null);
        } else {
          // Try to activate the tab to the right, or to the left if it was the last one.
          const newActiveIndex =
            fileIndex >= updatedOpenFiles.length
              ? updatedOpenFiles.length - 1
              : fileIndex;
          setActiveFilePath(updatedOpenFiles[newActiveIndex]?.path || null);
        }
      }
    },
    [openFiles, activeFilePath]
  );

  const handleSwitchTab = useCallback((filePath: string) => {
    setActiveFilePath(filePath);
  }, []);

  const handleFileContentChange = useCallback(
    (filePath: string, newContent: string) => {
      const updateFiles = (files: FileItem[]): FileItem[] => {
        return files.map((file) => {
          if (file.path === filePath) {
            return { ...file, content: newContent };
          }
          if (file.children) {
            return { ...file, children: updateFiles(file.children) };
          }
          return file;
        });
      };

      setOpenFiles((prev) => updateFiles(prev));
      setExplorerProjectFiles((prev) => updateFiles(prev));
    },
    []
  );

  // Handlers for FileExplorerPanel state
  const handleExplorerProjectFilesChange = useCallback(
    (newFiles: FileItem[]) => {
      setExplorerProjectFiles(newFiles);
    },
    []
  );

  const handleExplorerExpandedPathsChange = useCallback(
    (newPaths: Set<string>) => {
      setExplorerExpandedPaths(newPaths);
    },
    []
  );

  const handleExplorerToggleCollapse = useCallback((path: string) => {
    setExplorerExpandedPaths((prev) => {
      const newPaths = new Set(prev);
      if (newPaths.has(path)) {
        newPaths.delete(path);
      } else {
        newPaths.add(path);
      }
      return newPaths;
    });
  }, []);

  const renderLeftPanel = () => {
    if (!activeView || !isSidePanelVisible) return null;

    const panelProps = { isOpen: isSidePanelVisible };

    switch (activeView) {
      case "explorer":
        return (
          <FileExplorerPanel
            {...panelProps}
            onOpenFile={handleOpenFile}
            projectFiles={explorerProjectFiles}
            expandedPaths={explorerExpandedPaths}
            onProjectFilesChange={handleExplorerProjectFilesChange}
            onExpandedPathsChange={handleExplorerExpandedPathsChange}
            onToggleCollapse={handleExplorerToggleCollapse}
          />
        );
      case "source-control":
        return <SourceControlPanel {...panelProps} />;
      case "extensions":
        return <ExtensionsPanel {...panelProps} />;
      case "settings":
        return <SettingsPanel {...panelProps} />;
      default:
        return null;
    }
  };

  const renderRightPanel = () => {
    if (!activeRightView || !isRightPanelVisible) return null;

    switch (activeRightView) {
      case "chat":
        return <ChatPanel />;
      case "deploy":
        const activeFile = openFiles.find((f) => f.path === activeFilePath);
        return (
          <DeployPanel
            activeFile={activeFile ?? null}
            projectFiles={explorerProjectFiles}
            triggerDockerfileGeneration={dockerfileGenerationTrigger}
          />
        );
      default:
        return null;
    }
  };

  const handleToggleDeployPanel = useCallback(() => {
    if (activeRightView === "deploy" && isRightPanelVisible) {
      setIsRightPanelVisible(false);
      setActiveRightView(null);
    } else {
      setActiveRightView("deploy");
      setIsRightPanelVisible(true);
    }
  }, [activeRightView, isRightPanelVisible]);

  return (
    <div className="h-screen w-full bg-background text-foreground overflow-hidden">
      <PanelGroup direction="vertical">
        <Panel id="title-bar-panel" defaultSize={5} minSize={5} maxSize={5}>
          <TitleBar
            onToggleChatPanel={toggleChatPanel}
            onToggleAutocompletionPanel={toggleAutocompletion}
            isAutocompletionEnabled={isAutocompletionEnabled}
            onDeployClick={handleDeployClick}
            isDeployPanelVisible={
              activeRightView === "deploy" && isRightPanelVisible
            }
          />
        </Panel>
        <Panel defaultSize={95}>
          <div className="flex flex-1 h-full overflow-hidden">
            <ActivityBar
              activeViewId={activeView}
              onViewChange={handleViewChange}
              isSidePanelOpen={isSidePanelVisible}
              activeRightViewId={activeRightView}
            />
            <PanelGroup direction="horizontal" className="flex-1">
              {isSidePanelVisible && (
                <Panel
                  defaultSize={isMediumScreen ? 18 : 20}
                  minSize={isMediumScreen ? 12 : 15}
                  maxSize={isMediumScreen ? 25 : 35}
                  className="bg-card min-w-0 overflow-hidden" // Added overflow constraint classes
                  collapsible={false}
                >
                  <div className="h-full w-full min-w-0 overflow-hidden">
                    {" "}
                    {/* Added wrapper with constraints */}
                    {renderLeftPanel()}
                  </div>
                </Panel>
              )}

              {isSidePanelVisible && (
                <PanelResizeHandle className="w-1.5 bg-border hover:bg-primary transition-colors" />
              )}

              <Panel
                defaultSize={
                  isMediumScreen ? (isSidePanelVisible ? 57 : 75) : 80
                }
              >
                <PanelGroup direction="horizontal">
                  <Panel>
                    <EditorWorkspace
                      openFiles={openFiles}
                      activeFilePath={activeFilePath}
                      onCloseTab={handleCloseFile}
                      onSwitchTab={handleSwitchTab}
                      onFileContentChange={handleFileContentChange}
                      isAutocompletionEnabled={isAutocompletionEnabled}
                    />
                  </Panel>
                  {isRightPanelVisible && (
                    <>
                      <PanelResizeHandle className="w-1.5 bg-border hover:bg-primary transition-colors" />
                      <Panel
                        defaultSize={rightPanelDefaultSize}
                        minSize={isMediumScreen ? 18 : 20}
                        maxSize={isMediumScreen ? 40 : 80}
                        collapsible={false}
                        className="min-w-0 overflow-hidden" // Added overflow constraint classes
                      >
                        <div className="h-full w-full min-w-0 overflow-hidden">
                          {" "}
                          {/* Added wrapper with constraints */}
                          {renderRightPanel()}
                        </div>
                      </Panel>
                    </>
                  )}
                </PanelGroup>
              </Panel>
            </PanelGroup>
          </div>
        </Panel>
      </PanelGroup>
    </div>
  );
};

export default CodeCanvasLayout;

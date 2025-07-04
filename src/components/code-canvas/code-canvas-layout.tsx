"use client";

import React, { useState, useCallback } from "react";
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

  const [openFiles, setOpenFiles] = useState<FileItem[]>([]);
  const [activeFilePath, setActiveFilePath] = useState<string | null>(null);

  // State for FileExplorerPanel, lifted up
  const [explorerProjectFiles, setExplorerProjectFiles] =
    useState<FileItem[]>(initialFilesData);
  const [explorerExpandedPaths, setExplorerExpandedPaths] = useState<
    Set<string>
  >(new Set(initialFilesData[0]?.path ? [initialFilesData[0].path] : ["/"]));

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

    if (activeRightView !== "deploy" || !isRightPanelVisible) {
      setActiveRightView("deploy");
      setIsRightPanelVisible(true);
    }
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
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-background text-foreground font-code">
      <div className="flex-0">
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
      </div>
      <div className="flex flex-1 overflow-hidden">
        <ActivityBar
          activeViewId={activeView}
          onViewChange={handleViewChange}
          isSidePanelOpen={isSidePanelVisible}
          activeRightViewId={activeRightView}
        />
        <PanelGroup direction="horizontal" className="flex-1">
          {isSidePanelVisible && (
            <Panel
              defaultSize={20}
              minSize={15}
              className="bg-card"
              collapsible={false} // This will disable collapse on double click
            >
              {renderLeftPanel()}
            </Panel>
          )}

          {isSidePanelVisible && (
            <PanelResizeHandle className="w-1.5 bg-border hover:bg-primary transition-colors" />
          )}

          <Panel>
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
                    minSize={20}
                    maxSize={80}
                    collapsible={false}
                  >
                    {renderRightPanel()}
                  </Panel>
                </>
              )}
            </PanelGroup>
          </Panel>
        </PanelGroup>
      </div>
    </div>
  );
};

export default CodeCanvasLayout;

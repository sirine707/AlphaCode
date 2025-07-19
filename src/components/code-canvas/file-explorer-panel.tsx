"use client";

import React, { useRef, useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Folder,
  File as FileIcon,
  MoreHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Input } from "@/components/ui/input";

export interface FileItem {
  name: string;
  type: "file" | "folder";
  path: string;
  content?: string;
  children?: FileItem[];
  icon?: React.ElementType;
  isNew?: boolean; // Flag for new items being created
}

interface FileExplorerPanelProps {
  isOpen: boolean;
  onOpenFile: (file: FileItem) => void;
  projectFiles: FileItem[];
  expandedPaths: Set<string>;
  onProjectFilesChange: (files: FileItem[]) => void;
  onExpandedPathsChange: (paths: Set<string>) => void;
  onToggleCollapse: (path: string) => void;
}

const findItem = (path: string, items: FileItem[]): FileItem | null => {
  for (const item of items) {
    if (item.path === path) return item;
    if (item.children) {
      const found = findItem(path, item.children);
      if (found) return found;
    }
  }
  return null;
};

const updateItem = (
  path: string,
  items: FileItem[],
  update: (item: FileItem) => FileItem
): FileItem[] => {
  return items.map((item) => {
    if (item.path === path) {
      return update(item);
    }
    if (item.children) {
      return { ...item, children: updateItem(path, item.children, update) };
    }
    return item;
  });
};

const deleteItem = (path: string, items: FileItem[]): FileItem[] => {
  return items
    .map((item) => {
      if (item.children) {
        return { ...item, children: deleteItem(path, item.children) };
      }
      return item;
    })
    .filter((item) => item.path !== path);
};

const addItemToParent = (
  parentPath: string,
  items: FileItem[],
  newItem: FileItem
): FileItem[] => {
  return items.map((item) => {
    if (item.path === parentPath) {
      return {
        ...item,
        children: [...(item.children || []), newItem],
      };
    }
    if (item.children) {
      return {
        ...item,
        children: addItemToParent(parentPath, item.children, newItem),
      };
    }
    return item;
  });
};

export const initialFilesData: FileItem[] = [];

function buildFileTreeFromBrowserFileList(fileList: FileList): FileItem[] {
  if (!fileList || fileList.length === 0) {
    console.log("No files in fileList");
    return [];
  }

  console.log("Processing", fileList.length, "files");

  // Determine the common root directory name
  const firstFilePathParts = fileList[0].webkitRelativePath
    .split("/")
    .filter((part) => part);

  if (firstFilePathParts.length === 0) {
    console.log("No webkitRelativePath found, using individual files");
    // Handle individual files (not a folder upload)
    const rootDirectory: FileItem = {
      name: "UPLOADED_FILES",
      type: "folder",
      path: "/UPLOADED_FILES",
      children: [],
      icon: Folder,
    };

    Array.from(fileList).forEach((file, index) => {
      const fileName = file.name;
      const extension = fileName.split(".").pop()?.toLowerCase() || "";
      let content = `// Content for ${fileName}\n// File uploaded to system`;

      // Add basic content templates based on file type
      if (extension === "md") {
        content = `# ${fileName.replace(
          ".md",
          ""
        )}\n\nContent from uploaded file.`;
      } else if (["js", "jsx", "ts", "tsx"].includes(extension)) {
        content = `// ${fileName}\n// JavaScript/TypeScript file\n\nexport default function Component() {\n  return null;\n}`;
      } else if (extension === "json") {
        content = `{\n  "name": "${fileName}",\n  "uploaded": true\n}`;
      } else if (["py"].includes(extension)) {
        content = `# ${fileName}\n# Python file\n\ndef main():\n    pass\n\nif __name__ == "__main__":\n    main()`;
      }

      rootDirectory.children?.push({
        name: fileName,
        type: "file",
        path: `/UPLOADED_FILES/${fileName}`,
        content,
        icon: FileIcon,
      });
    });

    return [rootDirectory];
  }

  const projectRootName = firstFilePathParts[0] || "IMPORTED_PROJECT";
  console.log("Project root name:", projectRootName);

  const rootDirectory: FileItem = {
    name: projectRootName,
    type: "folder",
    path: `/${projectRootName}`,
    children: [],
    icon: Folder,
  };

  // Sort files to ensure proper directory creation order
  const sortedFiles = Array.from(fileList).sort((a, b) =>
    a.webkitRelativePath.localeCompare(b.webkitRelativePath)
  );

  console.log(
    "Sorted files:",
    sortedFiles.map((f) => f.webkitRelativePath)
  );

  for (const file of sortedFiles) {
    // Skip empty files or directories
    if (!file.webkitRelativePath) {
      console.log("Skipping file with no webkitRelativePath:", file.name);
      continue;
    }

    const pathParts = file.webkitRelativePath.split("/").filter((part) => part);

    // Skip if no valid path parts
    if (pathParts.length === 0) {
      console.log("Skipping file with no valid path parts:", file.name);
      continue;
    }

    console.log(
      "Processing file:",
      file.webkitRelativePath,
      "Size:",
      file.size
    );

    let currentNode = rootDirectory;
    let currentPath = `/${projectRootName}`;

    // Navigate/create the directory structure
    for (let i = 1; i < pathParts.length; i++) {
      const part = pathParts[i];
      const isLastPart = i === pathParts.length - 1;
      const nodePath = `${currentPath}/${part}`;

      if (isLastPart) {
        // This is a file (last part of path)
        const existingFile = currentNode.children?.find(
          (child) => child.name === part && child.type === "file"
        );

        if (!existingFile) {
          // Determine file type based on extension
          const extension = part.split(".").pop()?.toLowerCase() || "";
          let content = `// Content for ${part}\n// File imported from local system`;

          // Add basic content templates based on file type
          if (extension === "md") {
            content = `# ${part.replace(
              ".md",
              ""
            )}\n\nContent imported from local file.`;
          } else if (["js", "jsx", "ts", "tsx"].includes(extension)) {
            content = `// ${part}\n// JavaScript/TypeScript file imported from local system\n\nexport default function Component() {\n  return null;\n}`;
          } else if (extension === "json") {
            content = `{\n  "name": "${part}",\n  "imported": true\n}`;
          } else if (["py"].includes(extension)) {
            content = `# ${part}\n# Python file imported from local system\n\ndef main():\n    pass\n\nif __name__ == "__main__":\n    main()`;
          } else if (["css", "scss", "sass"].includes(extension)) {
            content = `/* ${part} */\n/* Styles imported from local system */\n\nbody {\n  /* Add your styles here */\n}`;
          } else if (["html", "htm"].includes(extension)) {
            content = `<!DOCTYPE html>\n<html>\n<head>\n  <title>${part}</title>\n</head>\n<body>\n  <!-- Content imported from local system -->\n</body>\n</html>`;
          }

          // Create the file item
          const fileItem: FileItem = {
            name: part,
            type: "file",
            path: nodePath,
            content,
            icon: FileIcon,
          };

          console.log("Adding file:", part, "to path:", nodePath);
          currentNode.children?.push(fileItem);
        }
      } else {
        // This is a directory (not the last part)
        let folderNode = currentNode.children?.find(
          (child) => child.name === part && child.type === "folder"
        );

        if (!folderNode) {
          folderNode = {
            name: part,
            type: "folder",
            path: nodePath,
            children: [],
            icon: Folder,
          };
          console.log("Creating folder:", part, "at path:", nodePath);
          currentNode.children?.push(folderNode);
        }

        currentNode = folderNode;
        currentPath = nodePath;
      }
    }
  }

  // Sort children recursively for better organization
  const sortChildren = (node: FileItem) => {
    if (node.children) {
      // Sort folders first, then files, both alphabetically
      node.children.sort((a, b) => {
        if (a.type !== b.type) {
          return a.type === "folder" ? -1 : 1;
        }
        return a.name.localeCompare(b.name);
      });

      // Recursively sort children
      node.children.forEach(sortChildren);
    }
  };

  sortChildren(rootDirectory);
  console.log("Final project tree:", rootDirectory);
  return [rootDirectory];
}

const FileTreeItem: React.FC<{
  item: FileItem;
  level?: number;
  onOpenFile: (file: FileItem) => void;
  onToggleCollapse: (path: string) => void;
  expandedPaths: Set<string>;
  onNewFile: (parentPath: string) => void;
  onNewFolder: (parentPath: string) => void;
  onDelete: (path: string) => void;
  onRename: (path: string, newName: string) => void;
}> = ({
  item,
  level = 0,
  onOpenFile,
  onToggleCollapse,
  expandedPaths,
  onNewFile,
  onNewFolder,
  onDelete,
  onRename,
}) => {
  const [isRenaming, setIsRenaming] = React.useState(item.isNew || false);
  const [renameValue, setRenameValue] = React.useState(item.name);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const currentIsExpanded = expandedPaths.has(item.path);
  const Icon = item.icon || (item.type === "folder" ? Folder : FileIcon);

  const handleToggle = () => {
    if (item.type === "folder") {
      onToggleCollapse(item.path);
    } else {
      onOpenFile(item);
    }
  };

  const handleRenameSubmit = () => {
    if (renameValue && renameValue !== item.name) {
      onRename(item.path, renameValue);
    } else if (!renameValue && item.isNew) {
      onDelete(item.path);
    }
    setIsRenaming(false);
  };

  React.useEffect(() => {
    if (isRenaming) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isRenaming]);

  const renderContent = () => {
    if (isRenaming) {
      return (
        <div
          className="flex items-center space-x-2"
          style={{ paddingLeft: `${level * 1 + 0.5}rem` }}
        >
          {item.type === "folder" ? (
            currentIsExpanded ? (
              <ChevronDown className="h-4 w-4 shrink-0" />
            ) : (
              <ChevronRight className="h-4 w-4 shrink-0" />
            )
          ) : (
            <div className="w-4 h-4 shrink-0"></div>
          )}
          <Icon
            className={cn(
              "h-4 w-4 shrink-0",
              item.type === "folder" ? "text-accent" : "text-muted-foreground"
            )}
          />
          <Input
            ref={inputRef}
            type="text"
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onBlur={handleRenameSubmit}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleRenameSubmit();
              if (e.key === "Escape") setIsRenaming(false);
            }}
            className="h-6 px-1 text-sm min-w-0 flex-1"
          />
        </div>
      );
    }

    return (
      <div
        className={cn(
          "flex cursor-pointer items-center space-x-2 rounded-md px-2 py-1.5 text-sm hover:bg-primary/10"
        )}
        style={{ paddingLeft: `${level * 1 + 0.5}rem` }}
        onClick={handleToggle}
        role="button"
        tabIndex={0}
        onKeyDown={(e) =>
          (e.key === "Enter" || e.key === " ") && handleToggle()
        }
        aria-label={item.name}
        aria-expanded={item.type === "folder" ? currentIsExpanded : undefined}
      >
        {item.type === "folder" ? (
          currentIsExpanded ? (
            <ChevronDown className="h-4 w-4 shrink-0" />
          ) : (
            <ChevronRight className="h-4 w-4 shrink-0" />
          )
        ) : (
          <div className="w-4 h-4 shrink-0"></div>
        )}
        <Icon
          className={cn(
            "h-4 w-4 shrink-0",
            item.type === "folder" ? "text-accent" : "text-muted-foreground"
          )}
        />
        <span className="truncate min-w-0 flex-1" title={item.name}>
          {item.name}
        </span>{" "}
        {/* Added responsive classes */}
      </div>
    );
  };

  return (
    <div>
      <ContextMenu>
        <ContextMenuTrigger>{renderContent()}</ContextMenuTrigger>
        <ContextMenuContent className="w-48">
          {item.type === "folder" && (
            <>
              <ContextMenuItem onSelect={() => onNewFile(item.path)}>
                New File
              </ContextMenuItem>
              <ContextMenuItem onSelect={() => onNewFolder(item.path)}>
                New Folder
              </ContextMenuItem>
              <ContextMenuSeparator />
            </>
          )}
          <ContextMenuItem onSelect={() => setIsRenaming(true)}>
            Rename
          </ContextMenuItem>
          <ContextMenuItem
            onSelect={() => onDelete(item.path)}
            className="text-red-500 focus:text-red-500"
          >
            Delete
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
      {currentIsExpanded && item.children && (
        <div className="pl-0">
          {item.children.map((child) => (
            <FileTreeItem
              key={child.path}
              item={child}
              level={level + 1}
              onOpenFile={onOpenFile}
              onToggleCollapse={onToggleCollapse}
              expandedPaths={expandedPaths}
              onNewFile={onNewFile}
              onNewFolder={onNewFolder}
              onDelete={onDelete}
              onRename={onRename}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const FileExplorerPanel: React.FC<FileExplorerPanelProps> = ({
  isOpen,
  onOpenFile,
  projectFiles,
  expandedPaths,
  onProjectFilesChange,
  onExpandedPathsChange,
  onToggleCollapse,
}) => {
  const directoryInputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  const handleNewItem = (parentPath: string, type: "file" | "folder") => {
    const parentNode = findItem(parentPath, projectFiles);
    if (!parentNode || parentNode.type !== "folder") return;

    if (!expandedPaths.has(parentPath)) {
      onToggleCollapse(parentPath);
    }

    const tempName = type === "file" ? "new-file" : "new-folder";
    let newPath = `${parentPath === "/" ? "" : parentPath}/${tempName}`;

    let i = 0;
    while (findItem(newPath, projectFiles)) {
      i++;
      newPath = `${parentPath === "/" ? "" : parentPath}/${tempName}-${i}`;
    }

    const newItem: FileItem = {
      name: "",
      type,
      path: newPath,
      icon: type === "file" ? FileIcon : Folder,
      children: type === "folder" ? [] : undefined,
      content: type === "file" ? "" : undefined,
      isNew: true,
    };

    onProjectFilesChange(addItemToParent(parentPath, projectFiles, newItem));
  };

  const handleDeleteItem = (path: string) => {
    if (confirm(`Are you sure you want to delete this item?`)) {
      onProjectFilesChange(deleteItem(path, projectFiles));
    }
  };

  const handleRenameItem = (path: string, newName: string) => {
    const itemToRename = findItem(path, projectFiles);
    if (!itemToRename) return;

    const parentPath = path.substring(0, path.lastIndexOf("/")) || "/";
    const newPath = `${parentPath === "/" ? "" : parentPath}/${newName}`;

    const parentNode = findItem(parentPath, projectFiles);
    if (
      parentNode &&
      parentNode.children?.some(
        (child) => child.path === newPath && child.path !== path
      )
    ) {
      alert(`An item named "${newName}" already exists in this folder.`);
      if (itemToRename.isNew) {
        onProjectFilesChange(deleteItem(path, projectFiles));
      }
      return;
    }

    const updateRecursively = (
      items: FileItem[],
      oldPathPrefix: string,
      newPathPrefix: string
    ): FileItem[] => {
      return items.map((item) => {
        const updatedItem = { ...item };
        if (item.path.startsWith(oldPathPrefix)) {
          updatedItem.path =
            newPathPrefix + item.path.substring(oldPathPrefix.length);
        }
        if (item.children) {
          updatedItem.children = updateRecursively(
            item.children,
            oldPathPrefix,
            newPathPrefix
          );
        }
        return updatedItem;
      });
    };

    onProjectFilesChange(
      updateItem(path, projectFiles, (item) => {
        const oldPath = item.path;
        const updatedItem = {
          ...item,
          name: newName,
          path: newPath,
          isNew: false,
        };
        if (item.children) {
          updatedItem.children = updateRecursively(
            item.children,
            oldPath,
            newPath
          );
        }
        return updatedItem;
      })
    );
  };

  const handleClearProjectView = () => {
    onProjectFilesChange([]);
    onExpandedPathsChange(new Set());
    console.log("Project view cleared from explorer.");
  };

  const handleImportNewProject = () => {
    setImportStatus("Preparing to import... Browser will ask for permission.");
    setIsImporting(true);
    if (directoryInputRef.current) {
      directoryInputRef.current.click();
    }
  };

  const handleDroppedFiles = (droppedFiles: FileList) => {
    if (droppedFiles.length > 0) {
      setImportStatus(`Processing ${droppedFiles.length} dropped files...`);
      setIsImporting(true);

      console.log("Files dropped:", droppedFiles.length);

      setTimeout(() => {
        const newProjectTree = buildFileTreeFromBrowserFileList(droppedFiles);
        onProjectFilesChange(newProjectTree);
        if (newProjectTree.length > 0 && newProjectTree[0]?.path) {
          onExpandedPathsChange(new Set([newProjectTree[0].path]));
        } else {
          onExpandedPathsChange(new Set());
        }

        setImportStatus(
          `Successfully imported ${droppedFiles.length} files via drag & drop!`
        );
        setTimeout(() => {
          setImportStatus(null);
          setIsImporting(false);
        }, 3000);
      }, 100);
    }
  };

  const handleDirectorySelected = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files;
    if (!files || files.length === 0) {
      setImportStatus("Import cancelled or no files selected.");
      setTimeout(() => {
        setImportStatus(null);
        setIsImporting(false);
      }, 2000);
      return;
    }

    console.log("=== DIRECTORY IMPORT STARTED ===");
    console.log("Directory selected. Files found:", files.length);
    setImportStatus(`Processing ${files.length} files...`);

    // Log file details for debugging
    Array.from(files)
      .slice(0, 10)
      .forEach((file, index) => {
        console.log(
          `File ${index}: ${file.webkitRelativePath || file.name}, size: ${
            file.size
          }`
        );
      });
    if (files.length > 10) {
      console.log(`... and ${files.length - 10} more files`);
    }

    try {
      console.log("Building project tree...");
      const newProjectTree = buildFileTreeFromBrowserFileList(files);
      console.log("Built project tree:", newProjectTree);
      console.log("Project tree length:", newProjectTree.length);

      if (newProjectTree.length > 0) {
        console.log("Setting project files...");
        onProjectFilesChange(newProjectTree);

        if (newProjectTree[0]?.path) {
          console.log("Expanding root folder:", newProjectTree[0].path);
          onExpandedPathsChange(new Set([newProjectTree[0].path]));
        }

        setImportStatus(`Successfully imported ${files.length} files!`);
        console.log("=== IMPORT COMPLETED SUCCESSFULLY ===");
      } else {
        console.log("No valid files found to import");
        setImportStatus("No valid files found to import.");
      }
    } catch (error) {
      console.error("Error building file tree:", error);
      setImportStatus("Error occurred during import.");
    }

    setTimeout(() => {
      setImportStatus(null);
      setIsImporting(false);
    }, 3000);

    // Clear the input
    if (directoryInputRef.current) {
      directoryInputRef.current.value = "";
    }
  };

  return (
    <div
      className={cn(
        "h-full bg-card shadow-md transition-all duration-300 ease-in-out overflow-hidden border-r border-border panel-content",
        isOpen ? "w-full min-w-0 p-2" : "w-0 p-0" // Changed from w-64 to w-full min-w-0
      )}
    >
      {isOpen && (
        <div className="flex flex-col h-full min-w-0">
          <div className="mb-3 px-2 flex items-center justify-between min-w-0">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex-grow truncate">
              Explorer
            </h2>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-muted-foreground hover:text-foreground"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onSelect={handleClearProjectView}>
                  Collapse project
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={handleImportNewProject}>
                  <div className="flex flex-col">
                    <span>Import new project</span>
                    <span className="text-xs text-muted-foreground">
                      Browser will ask for permission
                    </span>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <ScrollArea className="flex-1 min-h-0">
            {/* Show import status inside the scroll area */}
            {importStatus && (
              <div className="mx-2 mb-3 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-md">
                <div className="flex items-center text-xs text-blue-700 dark:text-blue-300">
                  {isImporting && (
                    <div className="animate-spin mr-2 h-3 w-3 border border-blue-500 border-t-transparent rounded-full"></div>
                  )}
                  <span>{importStatus}</span>
                </div>
              </div>
            )}

            {projectFiles.length > 0 ? (
              <div className="min-w-0">
                {projectFiles.map((item) => (
                  <FileTreeItem
                    key={item.path}
                    item={item}
                    level={0}
                    onOpenFile={onOpenFile}
                    onToggleCollapse={onToggleCollapse}
                    expandedPaths={expandedPaths}
                    onNewFile={(parentPath) =>
                      handleNewItem(parentPath, "file")
                    }
                    onNewFolder={(parentPath) =>
                      handleNewItem(parentPath, "folder")
                    }
                    onDelete={handleDeleteItem}
                    onRename={handleRenameItem}
                  />
                ))}
              </div>
            ) : !isImporting ? (
              <div className="p-4 text-center text-xs text-muted-foreground space-y-3">
                <div>Project view cleared or no project loaded.</div>

                {/* Drag & Drop Zone */}
                <div
                  className="border-2 border-dashed border-border rounded-lg p-4 hover:border-primary/50 transition-colors cursor-pointer"
                  onDrop={(e) => {
                    e.preventDefault();
                    const files = e.dataTransfer.files;
                    if (files.length > 0) {
                      handleDroppedFiles(files);
                    }
                  }}
                  onDragOver={(e) => e.preventDefault()}
                  onDragEnter={(e) => {
                    e.preventDefault();
                    e.currentTarget.classList.add("border-primary");
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    e.currentTarget.classList.remove("border-primary");
                  }}
                >
                  <div className="text-muted-foreground text-center">
                    📁 Drop project folder or files here
                  </div>
                  <div className="text-xs text-muted-foreground mt-1 text-center">
                    Supports deep folder structures (folder/subfolder/file.js)
                  </div>
                </div>

                <div className="text-center">
                  <span className="text-muted-foreground">or</span>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleImportNewProject}
                  className="w-full"
                >
                  Import Project Folder
                </Button>
              </div>
            ) : null}
          </ScrollArea>
          <input
            type="file"
            ref={directoryInputRef}
            onChange={handleDirectorySelected}
            style={{ display: "none" }}
            multiple
            // @ts-ignore
            webkitdirectory=""
            // @ts-ignore
            directory=""
            aria-hidden="true"
          />
        </div>
      )}
    </div>
  );
};

export { initialFilesData as initialFiles };
export default FileExplorerPanel;

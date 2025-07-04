"use client";

import React, { useRef } from "react";
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

export const initialFilesData: FileItem[] = [
  {
    name: "PROJECT_ROOT",
    type: "folder",
    path: "/",
    icon: Folder,
    children: [
      {
        name: "src",
        type: "folder",
        path: "/src",
        icon: Folder,
        children: [
          {
            name: "app.py",
            type: "file",
            icon: FileIcon,
            path: "/src/app.py",
            content:
              '# Welcome to app.py\n\ndef main():\n    print("Hello from app.py")\n\nif __name__ == "__main__":\n    main()',
          },
          {
            name: "utils.js",
            type: "file",
            icon: FileIcon,
            path: "/src/utils.js",
            content:
              "// JavaScript utility functions\n\nfunction greet(name) {\n  return `Hello, ${name}!`;\n}\n\nmodule.exports = { greet };",
          },
        ],
      },
      {
        name: "tests",
        type: "folder",
        path: "/tests",
        icon: Folder,
        children: [
          {
            name: "test_app.py",
            type: "file",
            icon: FileIcon,
            path: "/tests/test_app.py",
            content:
              '# Tests for app.py\n\nimport unittest\n# from src.app import main # Assuming app.py is structured to allow import\n\nclass TestApp(unittest.TestCase):\n    def test_example(self):\n        self.assertTrue(True)\n\nif __name__ == "__main__":\n    unittest.main()',
          },
        ],
      },
      {
        name: "package.json",
        type: "file",
        icon: FileIcon,
        path: "/package.json",
        content:
          '{\n  "name": "my-project",\n  "version": "1.0.0",\n  "description": "",\n  "main": "index.js",\n  "scripts": {\n    "test": "echo \\"Error: no test specified\\" && exit 1"\n  },\n  "keywords": [],\n  "author": "",\n  "license": "ISC"\n}',
      },
      {
        name: "README.md",
        type: "file",
        icon: FileIcon,
        path: "/README.md",
        content: "# My Project\n\nThis is a sample README file.",
      },
    ],
  },
];

function buildFileTreeFromBrowserFileList(fileList: FileList): FileItem[] {
  if (!fileList || fileList.length === 0) {
    return [];
  }

  const firstFilePathParts = fileList[0].webkitRelativePath.split("/");
  const projectRootName = firstFilePathParts[0] || "IMPORTED_PROJECT";

  const rootDirectory: FileItem = {
    name: projectRootName,
    type: "folder",
    path: `/${projectRootName}`,
    children: [],
    icon: Folder,
  };

  for (let i = 0; i < fileList.length; i++) {
    const file = fileList[i];
    const pathParts = file.webkitRelativePath.split("/");

    let currentChildren = rootDirectory.children!;
    let currentPath = `/${projectRootName}`;

    for (let j = 1; j < pathParts.length; j++) {
      const part = pathParts[j];
      const isLastPart = j === pathParts.length - 1;
      const nodePath = `${currentPath}/${part}`;

      if (isLastPart) {
        if (
          !currentChildren.find(
            (child) => child.name === part && child.type === "file"
          )
        ) {
          currentChildren.push({
            name: part,
            type: "file",
            path: nodePath,
            content: `// Placeholder content for ${part}\n// Actual file content cannot be accessed via this method.`,
            icon: FileIcon,
          });
        }
      } else {
        let folderNode = currentChildren.find(
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
          currentChildren.push(folderNode);
        }
        currentChildren = folderNode.children!;
        currentPath = nodePath;
      }
    }
  }
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
            className="h-6 px-1 text-sm"
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
        <span>{item.name}</span>
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
    if (directoryInputRef.current) {
      directoryInputRef.current.click();
    }
  };

  const handleDirectorySelected = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      console.log("Directory selected. Files found:", files.length);
      const newProjectTree = buildFileTreeFromBrowserFileList(files);
      onProjectFilesChange(newProjectTree);
      if (newProjectTree.length > 0 && newProjectTree[0]?.path) {
        onExpandedPathsChange(new Set([newProjectTree[0].path]));
      } else {
        onExpandedPathsChange(new Set());
      }
    }
    if (directoryInputRef.current) {
      directoryInputRef.current.value = "";
    }
  };

  return (
    <div
      className={cn(
        "h-full bg-card shadow-md transition-all duration-300 ease-in-out overflow-hidden border-r border-border",
        isOpen ? "w-64 p-2" : "w-0 p-0"
      )}
    >
      {isOpen && (
        <div className="flex flex-col h-full">
          <div className="mb-3 px-2 flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex-grow">
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
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onSelect={handleClearProjectView}>
                  collapse project
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={handleImportNewProject}>
                  Import new project
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <ScrollArea className="flex-1">
            {projectFiles.length > 0 ? (
              projectFiles.map((item) => (
                <FileTreeItem
                  key={item.path}
                  item={item}
                  level={0}
                  onOpenFile={onOpenFile}
                  onToggleCollapse={onToggleCollapse}
                  expandedPaths={expandedPaths}
                  onNewFile={(parentPath) => handleNewItem(parentPath, "file")}
                  onNewFolder={(parentPath) =>
                    handleNewItem(parentPath, "folder")
                  }
                  onDelete={handleDeleteItem}
                  onRename={handleRenameItem}
                />
              ))
            ) : (
              <div className="p-4 text-center text-xs text-muted-foreground">
                Project view cleared or no project loaded. <br /> Use "Import
                new project" to load files.
              </div>
            )}
          </ScrollArea>
          <input
            type="file"
            ref={directoryInputRef}
            onChange={handleDirectorySelected}
            style={{ display: "none" }}
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

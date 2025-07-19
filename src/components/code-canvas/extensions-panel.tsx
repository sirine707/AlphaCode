"use client";

import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  Search,
  Download,
  Star,
  Check,
  Settings,
  Trash2,
  ExternalLink,
  Package,
  Users,
  Calendar,
} from "lucide-react";

interface Extension {
  id: string;
  name: string;
  displayName: string;
  publisher: {
    publisherName: string;
    displayName: string;
  };
  versions: Array<{
    version: string;
    lastUpdated: string;
  }>;
  statistics: Array<{
    statisticName: string;
    value: number;
  }>;
  shortDescription: string;
  categories: string[];
  tags: string[];
  installCount?: number;
  rating?: number;
  isInstalled?: boolean;
  isEnabled?: boolean;
}

interface ExtensionsPanelProps {
  isOpen: boolean;
}

// Mock VS Code Marketplace API data
const mockMarketplaceExtensions: Extension[] = [
  {
    id: "ms-python.python",
    name: "python",
    displayName: "Python",
    publisher: {
      publisherName: "ms-python",
      displayName: "Microsoft",
    },
    versions: [
      {
        version: "2024.8.0",
        lastUpdated: "2024-07-15T00:00:00Z",
      },
    ],
    statistics: [
      { statisticName: "install", value: 85234567 },
      { statisticName: "averagerating", value: 4.5 },
    ],
    shortDescription:
      "IntelliSense (Pylance), Linting, Debugging, Jupyter Notebooks, code formatting, refactoring, unit tests, and more.",
    categories: ["Programming Languages", "Debuggers", "Formatters"],
    tags: ["python", "intellisense", "pylance", "jupyter"],
    installCount: 85234567,
    rating: 4.5,
    isInstalled: false,
    isEnabled: false,
  },
  {
    id: "esbenp.prettier-vscode",
    name: "prettier-vscode",
    displayName: "Prettier - Code formatter",
    publisher: {
      publisherName: "esbenp",
      displayName: "Prettier",
    },
    versions: [
      {
        version: "10.4.0",
        lastUpdated: "2024-07-10T00:00:00Z",
      },
    ],
    statistics: [
      { statisticName: "install", value: 38567234 },
      { statisticName: "averagerating", value: 4.3 },
    ],
    shortDescription: "Code formatter using prettier",
    categories: ["Formatters"],
    tags: ["formatter", "prettier", "javascript", "typescript"],
    installCount: 38567234,
    rating: 4.3,
    isInstalled: true,
    isEnabled: true,
  },
  {
    id: "ms-vscode.vscode-eslint",
    name: "vscode-eslint",
    displayName: "ESLint",
    publisher: {
      publisherName: "ms-vscode",
      displayName: "Microsoft",
    },
    versions: [
      {
        version: "3.0.10",
        lastUpdated: "2024-07-12T00:00:00Z",
      },
    ],
    statistics: [
      { statisticName: "install", value: 29876543 },
      { statisticName: "averagerating", value: 4.2 },
    ],
    shortDescription: "Integrates ESLint JavaScript into VS Code.",
    categories: ["Linters"],
    tags: ["eslint", "javascript", "linter"],
    installCount: 29876543,
    rating: 4.2,
    isInstalled: true,
    isEnabled: false,
  },
  {
    id: "ritwickdey.liveserver",
    name: "liveserver",
    displayName: "Live Server",
    publisher: {
      publisherName: "ritwickdey",
      displayName: "Ritwick Dey",
    },
    versions: [
      {
        version: "5.7.9",
        lastUpdated: "2024-06-20T00:00:00Z",
      },
    ],
    statistics: [
      { statisticName: "install", value: 19234567 },
      { statisticName: "averagerating", value: 4.6 },
    ],
    shortDescription:
      "Launch a development local Server with live reload feature for static & dynamic pages.",
    categories: ["Other"],
    tags: ["live", "server", "preview", "browser"],
    installCount: 19234567,
    rating: 4.6,
    isInstalled: false,
    isEnabled: false,
  },
  {
    id: "eamodio.gitlens",
    name: "gitlens",
    displayName: "GitLens — Git supercharged",
    publisher: {
      publisherName: "eamodio",
      displayName: "GitKraken",
    },
    versions: [
      {
        version: "15.0.1",
        lastUpdated: "2024-07-18T00:00:00Z",
      },
    ],
    statistics: [
      { statisticName: "install", value: 15876543 },
      { statisticName: "averagerating", value: 4.7 },
    ],
    shortDescription:
      "Supercharge Git within VS Code — Visualize code authorship at a glance via Git blame annotations and CodeLens.",
    categories: ["Source Control"],
    tags: ["git", "gitlens", "blame", "history"],
    installCount: 15876543,
    rating: 4.7,
    isInstalled: false,
    isEnabled: false,
  },
];

// Fetch extensions from our API (which connects to VS Code Marketplace)
const fetchMarketplaceExtensions = async (
  searchTerm: string = ""
): Promise<Extension[]> => {
  try {
    const params = new URLSearchParams();
    if (searchTerm) params.append("q", searchTerm);
    params.append("pageSize", "20");
    params.append("sortBy", "installs");

    const response = await fetch(`/api/extensions?${params}`);

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    return data.extensions || [];
  } catch (error) {
    console.error("Failed to fetch extensions:", error);

    // Fallback to mock data if API fails
    return mockMarketplaceExtensions.filter(
      (ext) =>
        !searchTerm ||
        ext.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ext.publisher.displayName
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        ext.shortDescription.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ext.tags.some((tag) =>
          tag.toLowerCase().includes(searchTerm.toLowerCase())
        )
    );
  }
};

// Handle extension actions through our API
const handleExtensionAction = async (
  extensionId: string,
  action: string
): Promise<boolean> => {
  try {
    const response = await fetch("/api/extensions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        extensionId,
        action,
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const result = await response.json();
    return result.success;
  } catch (error) {
    console.error(`Failed to ${action} extension:`, error);
    return false;
  }
};

const ExtensionsPanel: React.FC<ExtensionsPanelProps> = ({ isOpen }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [extensions, setExtensions] = useState<Extension[]>(
    mockMarketplaceExtensions
  );
  const [installedExtensions, setInstalledExtensions] = useState<Extension[]>(
    mockMarketplaceExtensions.filter((ext) => ext.isInstalled)
  );
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("marketplace");

  // Fetch extensions when search term changes
  useEffect(() => {
    const searchExtensions = async () => {
      if (activeTab === "marketplace") {
        setLoading(true);
        try {
          const results = await fetchMarketplaceExtensions(searchTerm);
          setExtensions(results);
        } catch (error) {
          console.error("Failed to fetch extensions:", error);
        } finally {
          setLoading(false);
        }
      }
    };

    const timeoutId = setTimeout(searchExtensions, 300);
    return () => clearTimeout(timeoutId);
  }, [searchTerm, activeTab]);

  const handleInstallExtension = async (extension: Extension) => {
    setLoading(true);
    const success = await handleExtensionAction(extension.id, "install");

    if (success) {
      const updatedExtension = {
        ...extension,
        isInstalled: true,
        isEnabled: true,
      };
      setExtensions((prev) =>
        prev.map((ext) => (ext.id === extension.id ? updatedExtension : ext))
      );
      setInstalledExtensions((prev) => [...prev, updatedExtension]);
    }
    setLoading(false);
  };

  const handleUninstallExtension = async (extension: Extension) => {
    setLoading(true);
    const success = await handleExtensionAction(extension.id, "uninstall");

    if (success) {
      const updatedExtension = {
        ...extension,
        isInstalled: false,
        isEnabled: false,
      };
      setExtensions((prev) =>
        prev.map((ext) => (ext.id === extension.id ? updatedExtension : ext))
      );
      setInstalledExtensions((prev) =>
        prev.filter((ext) => ext.id !== extension.id)
      );
    }
    setLoading(false);
  };

  const handleToggleExtension = async (extension: Extension) => {
    const action = extension.isEnabled ? "disable" : "enable";
    const success = await handleExtensionAction(extension.id, action);

    if (success) {
      const updatedExtension = {
        ...extension,
        isEnabled: !extension.isEnabled,
      };
      setExtensions((prev) =>
        prev.map((ext) => (ext.id === extension.id ? updatedExtension : ext))
      );
      setInstalledExtensions((prev) =>
        prev.map((ext) => (ext.id === extension.id ? updatedExtension : ext))
      );
    }
  };

  const formatInstallCount = (count: number) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  const renderExtensionCard = (ext: Extension) => (
    <Card key={ext.id} className="shadow-none border-border/50">
      <CardHeader className="p-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-sm font-medium truncate">
              {ext.displayName}
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              {ext.publisher.displayName} • {ext.versions[0]?.version}
            </p>
            <div className="flex items-center gap-2 mt-1">
              {ext.rating && (
                <div className="flex items-center gap-1">
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  <span className="text-xs">{ext.rating}</span>
                </div>
              )}
              {ext.installCount && (
                <div className="flex items-center gap-1">
                  <Download className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    {formatInstallCount(ext.installCount)}
                  </span>
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-1 ml-2">
            {ext.isInstalled ? (
              <>
                <Button
                  size="sm"
                  variant={ext.isEnabled ? "secondary" : "outline"}
                  onClick={() => handleToggleExtension(ext)}
                  className="h-6 px-2 text-xs"
                >
                  {ext.isEnabled ? "Disable" : "Enable"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleUninstallExtension(ext)}
                  className="h-6 px-2 text-xs text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </>
            ) : (
              <Button
                size="sm"
                onClick={() => handleInstallExtension(ext)}
                disabled={loading}
                className="h-6 px-2 text-xs"
              >
                Install
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-3 pt-0">
        <p className="text-xs text-foreground/80 line-clamp-2 mb-2">
          {ext.shortDescription}
        </p>
        <div className="flex flex-wrap gap-1">
          {ext.categories.slice(0, 2).map((category) => (
            <Badge
              key={category}
              variant="secondary"
              className="text-xs px-1 py-0"
            >
              {category}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div
      className={cn(
        "h-full bg-card shadow-md transition-all duration-300 ease-in-out overflow-hidden border-r border-border panel-content",
        isOpen ? "w-full min-w-0 p-3" : "w-0 p-0"
      )}
    >
      {isOpen && (
        <div className="flex flex-col h-full min-w-0">
          <h2 className="mb-3 px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground truncate">
            Extensions
          </h2>

          <div className="relative mb-3 min-w-0">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search Extensions in Marketplace"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 text-xs h-8 bg-background/30 border-border/70 min-w-0 w-full"
            />
          </div>

          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="flex-1 min-h-0 flex flex-col"
          >
            <TabsList className="grid w-full grid-cols-2 mb-3">
              <TabsTrigger value="marketplace" className="text-xs">
                <Package className="h-3 w-3 mr-1" />
                Marketplace
              </TabsTrigger>
              <TabsTrigger value="installed" className="text-xs">
                <Check className="h-3 w-3 mr-1" />
                Installed ({installedExtensions.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="marketplace" className="flex-1 min-h-0 mt-0">
              <ScrollArea className="h-full">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  </div>
                ) : extensions.length > 0 ? (
                  <div className="space-y-3">
                    {extensions.map(renderExtensionCard)}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Package className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                    <p className="text-xs text-muted-foreground">
                      {searchTerm
                        ? "No extensions found for your search."
                        : "Enter a search term to find extensions."}
                    </p>
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="installed" className="flex-1 min-h-0 mt-0">
              <ScrollArea className="h-full">
                {installedExtensions.length > 0 ? (
                  <div className="space-y-3">
                    {installedExtensions.map(renderExtensionCard)}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Check className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                    <p className="text-xs text-muted-foreground mb-2">
                      No extensions installed yet.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setActiveTab("marketplace")}
                      className="text-xs"
                    >
                      Browse Marketplace
                    </Button>
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
};

export default ExtensionsPanel;

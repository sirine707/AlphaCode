"use client";

import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Search } from "lucide-react";

interface ExtensionsPanelProps {
  isOpen: boolean;
}

const mockExtensions = [
  {
    id: "1",
    name: "Python",
    publisher: "Microsoft",
    version: "v2024.8.0",
    description:
      "IntelliSense (Pylance), Linting, Debugging (multi-threaded, remote), Jupyter Notebooks, code formatting, refactoring, unit tests, and more.",
  },
  {
    id: "2",
    name: "Prettier - Code formatter",
    publisher: "Prettier",
    version: "v10.4.0",
    description: "Code formatter using Prettier.",
  },
  {
    id: "3",
    name: "ESLint",
    publisher: "Microsoft",
    version: "v3.0.10",
    description: "Integrates ESLint JavaScript into VS Code.",
  },
  {
    id: "4",
    name: "Live Server",
    publisher: "Ritwick Dey",
    version: "v5.7.9",
    description:
      "Launch a development local Server with live reload feature for static & dynamic pages.",
  },
  {
    id: "5",
    name: "GitLens — Git supercharged",
    publisher: "GitKraken",
    version: "v15.0.1",
    description:
      "Supercharge Git within VS Code — Visualize code authorship at a glance via Git blame annotations and CodeLens, seamlessly navigate and explore Git repositories, gain valuable insights via powerful comparison commands, and so much more.",
  },
];

const ExtensionsPanel: React.FC<ExtensionsPanelProps> = ({ isOpen }) => {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredExtensions = mockExtensions.filter(
    (ext) =>
      ext.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ext.publisher.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div
      className={cn(
        "h-full bg-card shadow-md transition-all duration-300 ease-in-out overflow-hidden border-r border-border panel-content",
        isOpen ? "w-full min-w-0 p-3" : "w-0 p-0" // Changed from w-72 to w-full min-w-0
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
          <ScrollArea className="flex-1 min-h-0">
            {filteredExtensions.length > 0 ? (
              <div className="space-y-2.5">
                {filteredExtensions.map((ext) => (
                  <Card key={ext.id} className="shadow-none border-border/50">
                    <CardHeader className="p-2.5">
                      <CardTitle className="text-sm font-medium">
                        {ext.name}
                      </CardTitle>
                      <p className="text-xs text-muted-foreground">
                        {ext.publisher} - {ext.version}
                      </p>
                    </CardHeader>
                    <CardContent className="p-2.5 pt-0">
                      <p className="text-xs text-foreground/80 line-clamp-2">
                        {ext.description}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground text-center py-4">
                {searchTerm
                  ? "No extensions found."
                  : "Type to search for extensions."}
              </p>
            )}
          </ScrollArea>
        </div>
      )}
    </div>
  );
};

export default ExtensionsPanel;


"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';
import { Plus, Minus, Undo2, GitCommit, GitBranch, ArrowUp, ArrowDown, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SourceControlPanelProps {
  isOpen: boolean;
}

interface ChangedFile {
  id: string;
  name: string;
  status: 'M' | 'A' | 'D' | 'R' | 'U'; // Modified, Added, Deleted, Renamed, Untracked
}

const mockChangedFiles: ChangedFile[] = [
  { id: '1', name: 'src/app/page.tsx', status: 'M' },
  { id: '2', name: 'src/components/code-canvas/code-canvas-layout.tsx', status: 'M' },
  { id: '3', name: 'public/new-image.png', status: 'A' },
  { id: '4', name: 'README.md', status: 'R' },
];

const SourceControlPanel: React.FC<SourceControlPanelProps> = ({ isOpen }) => {
  const [commitMessage, setCommitMessage] = useState('');
  const [changedFiles, setChangedFiles] = useState<ChangedFile[]>(mockChangedFiles);
  // In a real app, stagedFiles would be a separate state
  // const [stagedFiles, setStagedFiles] = useState<ChangedFile[]>([]);

  const handleCommit = () => {
    console.log('Commit message:', commitMessage);
    console.log('Committing files:', changedFiles); // In a real app, this would be staged files
    setCommitMessage('');
    // Potentially clear staged files and refresh changes
  };

  const getStatusColor = (status: ChangedFile['status']) => {
    switch (status) {
      case 'M': return 'text-yellow-400'; // Modified
      case 'A': return 'text-green-400'; // Added
      case 'D': return 'text-red-400';   // Deleted
      case 'R': return 'text-blue-400';   // Renamed
      case 'U': return 'text-purple-400'; // Untracked (example)
      default: return 'text-foreground';
    }
  };

  return (
    <div
      className={cn(
        "h-full bg-card shadow-md transition-all duration-300 ease-in-out overflow-hidden border-r border-border",
        isOpen ? "w-72 p-3" : "w-0 p-0"
      )}
    >
      {isOpen && (
        <ScrollArea className="h-full">
          <div className="flex flex-col space-y-4">
            <Card className="shadow-none border-border/50">
              <CardHeader className="p-3">
                <CardTitle className="text-sm font-medium flex items-center">
                  <GitCommit className="h-4 w-4 mr-2 text-primary" />
                  Commit
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 p-3 pt-0">
                <Textarea
                  placeholder="Commit message (e.g., Fix: Add responsive styles)"
                  value={commitMessage}
                  onChange={(e) => setCommitMessage(e.target.value)}
                  className="text-xs h-24 bg-background/30 border-border/70 font-code leading-relaxed"
                  aria-label="Commit message"
                />
                <Button onClick={handleCommit} size="sm" className="w-full text-xs h-7">
                  Commit
                </Button>
                 <div className="flex space-x-2 mt-2">
                    <Button variant="outline" size="sm" className="flex-1 text-xs h-7">
                        <ArrowUp className="h-3.5 w-3.5 mr-1.5" /> Push
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1 text-xs h-7">
                        <ArrowDown className="h-3.5 w-3.5 mr-1.5" /> Pull
                    </Button>
                    <Button variant="outline" size="icon" className="text-xs h-7 w-7">
                        <RefreshCw className="h-3.5 w-3.5" />
                         <span className="sr-only">Refresh</span>
                    </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-none border-border/50">
              <CardHeader className="p-3">
                <CardTitle className="text-sm font-medium">Changes ({changedFiles.length})</CardTitle>
              </CardHeader>
              <CardContent className="p-3 pt-0">
                {changedFiles.length > 0 ? (
                  <ul className="space-y-1.5 max-h-60 overflow-y-auto">
                    {changedFiles.map((file) => (
                      <li key={file.id} className="flex items-center justify-between group text-xs py-1 hover:bg-primary/10 px-1.5 rounded-sm">
                        <div className="flex items-center">
                          <span className={cn("w-4 text-center font-mono mr-2", getStatusColor(file.status))}>{file.status}</span>
                          <span>{file.name}</span>
                        </div>
                        <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" className="h-5 w-5">
                            <Plus className="h-3 w-3" titleAccess="Stage Change" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-5 w-5">
                            <Undo2 className="h-3 w-3" titleAccess="Discard Changes" />
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-muted-foreground">No changes detected.</p>
                )}
                 <Button variant="outline" size="sm" className="w-full text-xs h-7 mt-3">Stage All Changes</Button>
              </CardContent>
            </Card>
            
            <Card className="shadow-none border-border/50">
              <CardHeader className="p-3">
                <CardTitle className="text-sm font-medium flex items-center">
                  <GitBranch className="h-4 w-4 mr-2 text-accent" />
                  Branches
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 pt-0">
                <p className="text-xs text-muted-foreground">Current branch: <span className="text-foreground">main</span></p>
                <Button variant="outline" size="sm" className="w-full text-xs h-7 mt-2">Switch/Create Branch</Button>
                {/* Placeholder for branch list */}
              </CardContent>
            </Card>

            <Card className="shadow-none border-border/50">
              <CardHeader className="p-3">
                <CardTitle className="text-sm font-medium">Staged Changes</CardTitle>
              </CardHeader>
              <CardContent className="p-3 pt-0">
                <p className="text-xs text-muted-foreground">No staged changes. Stage files from the "Changes" section.</p>
                 {/* <Button variant="outline" size="sm" className="w-full text-xs h-7 mt-2" disabled>Unstage All Changes</Button> */}
              </CardContent>
            </Card>

            <Card className="shadow-none border-border/50">
              <CardHeader className="p-3">
                <CardTitle className="text-sm font-medium">Remotes</CardTitle>
              </CardHeader>
              <CardContent className="p-3 pt-0">
                <p className="text-xs text-muted-foreground">origin: <span className="text-foreground">git@example.com:user/repo.git</span></p>
                {/* Placeholder for remote management */}
              </CardContent>
            </Card>

          </div>
        </ScrollArea>
      )}
    </div>
  );
};

export default SourceControlPanel;

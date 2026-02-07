"use client";

import * as React from "react"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
  ImperativePanelHandle,
  Separator
} from "@/components/ui/resizable"
import { useProjectStore, BinderNode } from "../store/useProjectStore"
import { Loader2, Cloud, CloudOff, CheckCircle2 } from "lucide-react"
import { Binder } from "./Binder"
import { Inspector } from "./Inspector"
import { Button } from "@/components/ui/button"
import { PanelLeft, PanelRight, GripVerticalIcon, LayoutGrid, FileText, Download } from "lucide-react"
import { CompileDialog } from "./compiler/CompileDialog"
import { TargetDialog } from "./TargetDialog"
import { TargetProgress } from "./TargetProgress"
import { cn } from "@/lib/utils"

export function DashboardShell({
  children,
  viewMode = 'editor',
  onViewModeChange
}: {
  children: React.ReactNode
  viewMode?: 'editor' | 'corkboard'
  onViewModeChange?: (mode: 'editor' | 'corkboard') => void
}) {
  const leftPanelRef = React.useRef<ImperativePanelHandle>(null)
  const rightPanelRef = React.useRef<ImperativePanelHandle>(null)
  const [isLeftCollapsed, setIsLeftCollapsed] = React.useState(false)

  const [isRightCollapsed, setIsRightCollapsed] = React.useState(false)
  const [isCompilerOpen, setIsCompilerOpen] = React.useState(false)
  const [isTargetDialogOpen, setIsTargetDialogOpen] = React.useState(false)
  
  const { loadProject, nodes, addNode, isLoading, saveStatus, content, updateStats } = useProjectStore()
  const hasSeeded = React.useRef(false)

  // Load Request
  React.useEffect(() => {
      loadProject("demo-project")
  }, [loadProject])

  // Calculate Total Word Count
  React.useEffect(() => {
    if (isLoading) return;
    
    // Quick calculate total words
    let total = 0;
    Object.values(content).forEach(html => {
        // Strip HTML tags for word count
        const text = html.replace(/<[^>]*>/g, ' ');
        // Count words
        const words = text.trim().split(/\s+/).filter(w => w.length > 0).length;
        total += words;
    });

    updateStats(total);

  }, [content, isLoading, updateStats]);

  // Auto-Seed Demo Data if Empty
  React.useEffect(() => {
      if (!isLoading && Object.keys(nodes).length === 0 && !hasSeeded.current) {
          hasSeeded.current = true;
          console.log("Seeding Demo Data...");
          
          // Ensure Demo Project & User Exist
          fetch('/api/setup/demo', { method: 'POST' }).then(async () => {
              const demoNodes: BinderNode[] = [
                { id: "manuscript", title: "Manuscript", type: "folder", parentId: null, order: 0, status: 'draft', label: 'chapter', synopsis: 'Main book container', notes: '' },
                { id: "ch1", title: "Chapter 1: The Beginning", type: "file", parentId: "manuscript", order: 0, status: 'revised', label: 'chapter', synopsis: 'Introduction to the world. The protagonist wakes up.', notes: '' },
                { id: "ch2", title: "Chapter 2: The Incident", type: "file", parentId: "manuscript", order: 1, status: 'draft', label: 'chapter', synopsis: 'The catalyst event happens.', notes: '' },
                { id: "ch3", title: "Chapter 3: Resolution", type: "file", parentId: "manuscript", order: 2, status: 'outline', label: 'chapter', synopsis: 'First plot point resolution.', notes: '' },
                { id: "chars", title: "Characters", type: "folder", parentId: null, order: 1, status: 'note', label: 'research', synopsis: '', notes: '', collapsed: true },
                { id: "char1", title: "Protagonist", type: "file", parentId: "chars", order: 0, status: 'note', label: 'character', synopsis: 'Hero of the story.', notes: '' },
                { id: "locs", title: "Locations", type: "folder", parentId: null, order: 2, status: 'note', label: 'research', synopsis: '', notes: '', collapsed: true },
                { id: "trash", title: "Trash", type: "folder", parentId: null, order: 99, status: 'note', label: 'research', synopsis: '', notes: '' },
              ];
    
              const demoContent = {
                  "ch1": "<p>The sky was the color of television, tuned to a dead channel.</p>",
                  "ch2": "<p>It was a dark and stormy night...</p>"
              };
              
              // Seed Nodes
              for (const node of demoNodes) {
                  await addNode(node, "demo-project");
              }
              // Seed Content (Triggering updates)
              // We need to set content *after* nodes are created to avoid race conditions if setContent relies on node existence?
              // `setContent` in store calls `triggerSave`. `triggerSave` calls `PUT /api/documents/:id`.
              // We should wait a bit or just call it.
              useProjectStore.getState().setContent("ch1", demoContent["ch1"]);
              useProjectStore.getState().setContent("ch2", demoContent["ch2"]);
          });
      }
  }, [isLoading, nodes, addNode])

  const toggleLeft = () => {
    const panel = leftPanelRef.current
    if (panel) {
      if (isLeftCollapsed) {
        panel.expand()
      } else {
        panel.collapse()
      }
    }
  }

  const toggleRight = () => {
    const panel = rightPanelRef.current
    if (panel) {
      if (isRightCollapsed) {
          panel.expand()
      } else {
          panel.collapse()
      }
    }
  }

  return (
    <div className="h-screen w-full bg-background overflow-hidden relative font-sans">
        {/* @ts-ignore */}
        <ResizablePanelGroup direction="horizontal" className="h-full items-stretch">
            {/* Left Sidebar: Binder */}
            <ResizablePanel 
                ref={leftPanelRef}
                defaultSize="20" 
                minSize="15" 
                maxSize="40" 
                collapsible={true}
                collapsedSize={0}
                onResize={(size) => {
                    const collapsed = size.asPercentage < 5
                    if (collapsed !== isLeftCollapsed) {
                        setIsLeftCollapsed(collapsed)
                    }
                }}
                className={cn(
                    "transition-[width] duration-300 ease-in-out data-[panel-group-direction=vertical]:h-full overflow-hidden",
                    isLeftCollapsed && "min-w-0" 
                )}
            >
                <div className={cn("h-full w-full", isLeftCollapsed && "invisible")}>
                    <Binder />
                </div>
            </ResizablePanel>
            
            <Separator className={cn(
                "bg-sidebar-border hover:bg-ring/50 transition-colors w-1 relative flex items-center justify-center after:absolute after:inset-y-0 after:left-1/2 after:w-1 after:-translate-x-1/2 focus-visible:ring-1 focus-visible:ring-offset-1 focus-visible:outline-hidden cursor-col-resize z-20",
                isLeftCollapsed && "opacity-0 pointer-events-none w-0"
            )}>
               <div className="bg-border z-10 flex h-4 w-3 items-center justify-center rounded-xs border">
                  <GripVerticalIcon className="size-2.5" />
               </div>
            </Separator>

            {/* Center: Editor Area */}
            <ResizablePanel defaultSize="60" minSize="30">
                <div className="h-full flex flex-col relative bg-background">
                     {/* Toggle Header - Absolute to float over editor if needed, or sticky */}
                     <header className="absolute top-0 left-0 right-0 h-14 z-50 flex items-center justify-between px-4 pointer-events-none">
                        <div className="pointer-events-auto flex items-center gap-2">
                           <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={toggleLeft} 
                                className={cn("h-8 w-8 transition-colors", isLeftCollapsed ? "text-muted-foreground hover:text-foreground" : "text-muted-foreground/30 hover:text-foreground")}
                            >
                               <PanelLeft className="h-4 w-4" />
                           </Button>

                           {/* Save Status Indicator */}
                           <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-background/50 backdrop-blur-sm border border-border/20">
                                {saveStatus === 'saving' && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
                                {saveStatus === 'saved' && <CheckCircle2 className="h-3 w-3 text-green-500" />}
                                {saveStatus === 'error' && <CloudOff className="h-3 w-3 text-red-500" />}
                                {saveStatus === 'idle' && <Cloud className="h-3 w-3 text-muted-foreground/50" />}
                                
                                <span className="text-[10px] uppercase font-mono text-muted-foreground tracking-wider">
                                    {saveStatus === 'idle' ? 'Synced' : saveStatus}
                                </span>
                           </div>
                         </div>
                         
                        {/* Target Progress */}
                        <div className="pointer-events-auto px-2">
                             <TargetProgress 
                                onClick={() => setIsTargetDialogOpen(true)} 
                             />
                        </div>

                        {/* Backup Button */}
                        <div className="pointer-events-auto px-2">
                           <Button 
                               variant="ghost" 
                               size="icon" 
                               className="h-8 w-8 text-muted-foreground/50 hover:text-foreground"
                               onClick={() => {
                                   const projectId = "demo-project"; 
                                   window.open(`/api/projects/${projectId}/backup`, '_blank');
                               }}
                               title="Download Project Backup"
                           >
                               <div className="relative">
                                   <Cloud className="h-4 w-4" />
                                   <span className="absolute -bottom-1 -right-1 text-[8px] font-bold bg-background rounded-full px-0.5 border border-border">↓</span>
                               </div>
                           </Button>
                        </div>

                         {/* Compiler Button */}
                         <div className="pointer-events-auto">
                            <Button 
                                variant="outline" 
                                size="sm" 
                                className="h-8 gap-2 bg-background/50 backdrop-blur-sm shadow-sm border-dashed border-primary/20 hover:border-primary/50 text-xs"
                                onClick={() => setIsCompilerOpen(true)}
                            >
                                <Download className="h-3.5 w-3.5" />
                                <span className="hidden sm:inline">Compile</span>
                            </Button>
                         </div>

                         {/* View Toggle */}
                         <div className="pointer-events-auto flex items-center gap-1 bg-background/80 backdrop-blur-sm border border-border/50 rounded-full p-1 shadow-sm">
                             <Button
                                 variant={viewMode === 'editor' ? "secondary" : "ghost"}
                                 size="sm"
                                 className="h-7 px-3 text-xs gap-1.5"
                                 onClick={() => onViewModeChange?.('editor')}
                             >
                                 <FileText className="h-3.5 w-3.5" />
                                 <span className={cn("hidden sm:inline", viewMode !== 'editor' && "hidden")}>Editor</span>
                             </Button>
                             <Button
                                 variant={viewMode === 'corkboard' ? "secondary" : "ghost"}
                                 size="sm"
                                 className="h-7 px-3 text-xs gap-1.5"
                                 onClick={() => onViewModeChange?.('corkboard')}
                             >
                                 <LayoutGrid className="h-3.5 w-3.5" />
                                 <span className={cn("hidden sm:inline", viewMode !== 'corkboard' && "hidden")}>Corkboard</span>
                             </Button>
                         </div>
                        
                        <div className="pointer-events-auto">
                           <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={toggleRight} 
                                className={cn("h-8 w-8 transition-colors", isRightCollapsed ? "text-muted-foreground hover:text-foreground" : "text-muted-foreground/30 hover:text-foreground")}
                            >
                               <PanelRight className="h-4 w-4" />
                            </Button>
                        </div>
                     </header>
                     
                     <div className="flex-1 overflow-hidden pt-14">
                         {isLoading ? (
                             <div className="flex items-center justify-center h-full text-muted-foreground gap-2">
                                 <Loader2 className="h-6 w-6 animate-spin" />
                                 <span>Loading Manuscript...</span>
                             </div>
                         ) : children}
                     </div>
                </div>
            </ResizablePanel>

            <Separator className={cn(
                "bg-sidebar-border hover:bg-ring/50 transition-colors w-1 relative flex items-center justify-center after:absolute after:inset-y-0 after:left-1/2 after:w-1 after:-translate-x-1/2 focus-visible:ring-1 focus-visible:ring-offset-1 focus-visible:outline-hidden cursor-col-resize z-20",
                isRightCollapsed && "opacity-0 pointer-events-none w-0"
            )}>
               <div className="bg-border z-10 flex h-4 w-3 items-center justify-center rounded-xs border">
                  <GripVerticalIcon className="size-2.5" />
               </div>
            </Separator>

            {/* Right Sidebar: Inspector */}
            <ResizablePanel 
                ref={rightPanelRef}
                defaultSize="20" 
                minSize="15" 
                maxSize="40" 
                collapsible={true}
                collapsedSize={0}
                onResize={(size) => {
                    const collapsed = size.asPercentage < 5
                    if (collapsed !== isRightCollapsed) {
                        setIsRightCollapsed(collapsed)
                    }
                }}
                className={cn(
                    "transition-[width] duration-300 ease-in-out data-[panel-group-direction=vertical]:h-full overflow-hidden",
                    isRightCollapsed && "min-w-0"
                )}
            >
                 <div className={cn("h-full w-full", isRightCollapsed && "invisible")}>
                    <Inspector />
                 </div>
            </ResizablePanel>

        </ResizablePanelGroup>
        
        <CompileDialog open={isCompilerOpen} onOpenChange={setIsCompilerOpen} />
        <TargetDialog open={isTargetDialogOpen} onOpenChange={setIsTargetDialogOpen} />
    </div>
  )
}


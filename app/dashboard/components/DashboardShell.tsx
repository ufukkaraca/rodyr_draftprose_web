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
import { Loader2, Cloud, CloudOff, CheckCircle2, Menu, LogOut, User as UserIcon } from "lucide-react"
import { Binder } from "./Binder"
import { Inspector } from "./Inspector"
import { Button } from "@/components/ui/button"
import { PanelLeft, PanelRight, GripVerticalIcon, LayoutGrid, FileText, Download } from "lucide-react"
import { CompileDialog } from "./compiler/CompileDialog"
import { TargetDialog } from "./TargetDialog"
import { TargetProgress } from "./TargetProgress"
import { cn } from "@/lib/utils"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { authClient } from "@/lib/auth-client"
import { useRouter } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// Simple hook to detect mobile/compact state
function useMediaQuery(query: string) {
  const [value, setValue] = React.useState(false);
  React.useEffect(() => {
    function onChange(event: MediaQueryListEvent) {
      setValue(event.matches);
    }
    const result = window.matchMedia(query);
    result.addEventListener("change", onChange);
    setValue(result.matches);
    return () => result.removeEventListener("change", onChange);
  }, [query]);
  return value;
}

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
  
  // Mobile / Compact State
  const isCompact = useMediaQuery("(max-width: 1024px)")
  const [isLeftSheetOpen, setIsLeftSheetOpen] = React.useState(false)
  const [isRightSheetOpen, setIsRightSheetOpen] = React.useState(false)
  
  const { loadProject, nodes, addNode, isLoading, saveStatus, content, updateStats, focusMode, projectId } = useProjectStore()
  const hasSeeded = React.useRef(false)
  const router = useRouter()
  const { data: session, isPending: isSessionPending } = authClient.useSession()

  // Load Request
  React.useEffect(() => {
      const initProject = async () => {
          if (!session?.user) return;
          if (projectId) return; // Already loaded?

          try {
              // 1. Fetch Projects
              const res = await fetch('/api/projects');
              if (res.ok) {
                  const projects = await res.json();
                  if (projects.length > 0) {
                      // Load most recent
                      loadProject(projects[0].id);
                  } else {
                      // 2. Create Default Project
                      const createRes = await fetch('/api/projects', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ title: "My First Novel", description: "A new beginning." })
                      });
                      if (createRes.ok) {
                          const newProject = await createRes.json();
                          loadProject(newProject.id);
                      }
                  }
              }
          } catch (e) {
              console.error("Failed to init project", e);
          }
      };

      if (session && !isSessionPending && !hasSeeded.current) {
          hasSeeded.current = true;
          initProject();
      }
  }, [session, isSessionPending, loadProject, projectId])

  const toggleLeft = () => {
    console.log("Toggle Left Clicked. Ref:", leftPanelRef.current);
    if (isCompact) {
        setIsLeftSheetOpen(!isLeftSheetOpen)
    } else {
        const panel = leftPanelRef.current
        if (panel) {
          const size = panel.getSize()
          console.log("Left Panel Size:", size);
          if (size.asPercentage < 5) {
            console.log("Expanding Left (Force Resize 20)...");
            panel.resize(20)
          } else {
            console.log("Collapsing Left...");
            panel.collapse()
          }
        } else {
            console.error("Left Panel Ref is null");
        }
    }
  }

  const toggleRight = () => {
    console.log("Toggle Right Clicked. Ref:", rightPanelRef.current);
    if (isCompact) {
        setIsRightSheetOpen(!isRightSheetOpen)
    } else {
        const panel = rightPanelRef.current
        if (panel) {
          const size = panel.getSize()
          console.log("Right Panel Size:", size);
          if (size.asPercentage < 5) {
              console.log("Expanding Right (Force Resize 20)...");
              panel.resize(20)
          } else {
              console.log("Collapsing Right...");
              panel.collapse()
          }
        } else {
            console.error("Right Panel Ref is null");
        }
    }
  }

  const handleSignOut = async () => {
      await authClient.signOut({
          fetchOptions: {
              onSuccess: () => {
                  router.push("/login")
              }
          }
      })
  }

  // Header Content Component to reduce duplication
  const HeaderContent = () => (
     <header className={cn(
         "absolute top-0 left-0 right-0 h-14 z-50 flex items-center justify-between px-4 pointer-events-none transition-opacity duration-300",
         focusMode ? "opacity-0 hover:opacity-100 bg-background/80 backdrop-blur-sm" : ""
     )}>
        <div className="pointer-events-auto flex items-center gap-2">
           {!focusMode && (
               <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={toggleLeft} 
                    className={cn("h-8 w-8 transition-colors", 
                        !isCompact && isLeftCollapsed ? "text-muted-foreground hover:text-foreground" : "text-muted-foreground/30 hover:text-foreground"
                    )}
                >
                   <PanelLeft className="h-4 w-4" />
               </Button>
           )}

           {/* Save Status - Hide on very small screens? */}
           <div className={cn("flex items-center gap-1.5 px-2 py-1 rounded-md bg-background/50 backdrop-blur-sm border border-border/20", isCompact && "hidden sm:flex")}>
                {saveStatus === 'saving' && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
                {saveStatus === 'saved' && <CheckCircle2 className="h-3 w-3 text-green-500" />}
                {saveStatus === 'error' && <CloudOff className="h-3 w-3 text-red-500" />}
                {saveStatus === 'idle' && <Cloud className="h-3 w-3 text-muted-foreground/50" />}
                
                <span className="text-[10px] uppercase font-mono text-muted-foreground tracking-wider">
                    {saveStatus === 'idle' ? 'Synced' : saveStatus}
                </span>
           </div>
         </div>
         
        {/* Center Controls */}
        <div className="pointer-events-auto flex items-center absolute left-1/2 -translate-x-1/2">
             {/* Target Progress */}
             <div className="px-1">
                  <TargetProgress 
                     onClick={() => setIsTargetDialogOpen(true)} 
                  />
             </div>
             
             {/* View Toggle */}
             {!focusMode && (
                 <div className="flex items-center gap-1 bg-background/80 backdrop-blur-sm border border-border/50 rounded-full p-1 shadow-sm mx-2">
                     <Button
                         variant={viewMode === 'editor' ? "secondary" : "ghost"}
                         size="sm"
                         className="h-7 px-2 sm:px-3 text-xs gap-1.5"
                         onClick={() => onViewModeChange?.('editor')}
                     >
                         <FileText className="h-3.5 w-3.5" />
                         <span className={cn("hidden sm:inline", viewMode !== 'editor' && "hidden")}>Editor</span>
                     </Button>
                     <Button
                         variant={viewMode === 'corkboard' ? "secondary" : "ghost"}
                         size="sm"
                         className="h-7 px-2 sm:px-3 text-xs gap-1.5"
                         onClick={() => onViewModeChange?.('corkboard')}
                     >
                         <LayoutGrid className="h-3.5 w-3.5" />
                         <span className={cn("hidden sm:inline", viewMode !== 'corkboard' && "hidden")}>Corkboard</span>
                     </Button>
                 </div>
             )}
        </div>

        <div className="pointer-events-auto flex items-center gap-2">
           {/* Backup Button - Hidden on Mobile */}
           <div className="hidden sm:block">
               <Button 
                   variant="ghost" 
                   size="icon" 
                   className="h-8 w-8 text-muted-foreground/50 hover:text-foreground"
                   onClick={() => {
                       if (projectId) {
                           window.open(`/api/projects/${projectId}/backup`, '_blank');
                       }
                   }}
                   title="Download Project Backup"
               >
                   <div className="relative">
                       <Cloud className="h-4 w-4" />
                       <span className="absolute -bottom-1 -right-1 text-[8px] font-bold bg-background rounded-full px-0.5 border border-border">↓</span>
                   </div>
               </Button>
           </div>

            {/* Compiler Button - Icon only on mobile */}
             <div>
                <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-8 gap-2 bg-background/50 backdrop-blur-sm shadow-sm border-dashed border-primary/20 hover:border-primary/50 text-xs px-2 sm:px-3"
                    onClick={() => {
                        console.log("Compile button clicked");
                        setIsCompilerOpen(true);
                    }}
                >
                    <Download className="h-3.5 w-3.5" />
                    <span className="hidden md:inline">Compile</span>
                </Button>
             </div>
           
           {/* User Profile */}
           <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                        <Avatar className="h-8 w-8">
                            <AvatarImage src={session?.user?.image || ""} alt={session?.user?.name || ""} />
                            <AvatarFallback>{session?.user?.name?.charAt(0) || <UserIcon className="h-4 w-4" />}</AvatarFallback>
                        </Avatar>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                        <div className="flex flex-col space-y-1">
                            <p className="text-sm font-medium leading-none">{session?.user?.name}</p>
                            <p className="text-xs leading-none text-muted-foreground">
                                {session?.user?.email}
                            </p>
                        </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut} className="text-red-600 focus:text-red-500 cursor-pointer">
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Log out</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
           </DropdownMenu>

           {!focusMode && (
               <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={toggleRight} 
                    className={cn("h-8 w-8 transition-colors", 
                        !isCompact && isRightCollapsed ? "text-muted-foreground hover:text-foreground" : "text-muted-foreground/30 hover:text-foreground"
                    )}
                >
                   <PanelRight className="h-4 w-4" />
                </Button>
           )}
        </div>
     </header>
  )

  const MainContent = (
      <div className="h-full flex flex-col relative bg-background w-full">
           {HeaderContent()}
           
           <div className="flex-1 overflow-hidden pt-14 data-[focus=true]:pt-0 transition-all duration-500">
               {isLoading ? (
                   <div className="flex items-center justify-center h-full text-muted-foreground gap-2">
                       <Loader2 className="h-6 w-6 animate-spin" />
                       <span>Loading Manuscript...</span>
                   </div>
               ) : children}
           </div>
      </div>
  )

  return (
    <div className="h-screen w-full bg-background overflow-hidden relative font-sans">
        {isCompact ? (
            // COMPACT MODE (Mobile/Tablet)
            <div className="h-full w-full relative">
                {/* Mobile Sidebars using Sheet */}
                <Sheet open={isLeftSheetOpen} onOpenChange={setIsLeftSheetOpen}>
                    <SheetContent side="left" className="p-0 w-[300px] sm:w-[350px]">
                        <div className="h-full w-full pt-10">
                            <Binder />
                        </div>
                    </SheetContent>
                </Sheet>

                <Sheet open={isRightSheetOpen} onOpenChange={setIsRightSheetOpen}>
                    <SheetContent side="right" className="p-0 w-[300px] sm:w-[350px]">
                        <div className="h-full w-full pt-10">
                            <Inspector />
                        </div>
                    </SheetContent>
                </Sheet>

                {/* Main Content takes full width */}
                {MainContent}
            </div>
        ) : (
            // DESKTOP MODE (Resizable Panels)
            // @ts-ignore
            <ResizablePanelGroup direction="horizontal" className="h-full items-stretch">
                {/* Left Sidebar: Binder */}
                {!focusMode && (
                    <>
                    <ResizablePanel 
                        ref={leftPanelRef}
                        defaultSize={20} 
                        minSize={15} 
                        maxSize={30} 
                        collapsible={true}
                        collapsedSize={0}
                        onResize={(size) => {
                            const collapsed = size.asPercentage < 5
                            if (collapsed !== isLeftCollapsed) {
                                setIsLeftCollapsed(collapsed)
                            }
                        }}
                        className={cn(
                            "data-[panel-group-direction=vertical]:h-full overflow-hidden",
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
                    </>
                )}

                {/* Center: Editor Area */}
                <ResizablePanel defaultSize={focusMode ? 100 : 60} minSize={40}>
                    {MainContent}
                </ResizablePanel>

                {!focusMode && (
                    <>
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
                        defaultSize={20} 
                        minSize={15} 
                        maxSize={35} 
                        collapsible={true}
                        collapsedSize={0}
                        onResize={(size) => {
                            const collapsed = size.asPercentage < 5
                            if (collapsed !== isRightCollapsed) {
                                setIsRightCollapsed(collapsed)
                            }
                        }}
                        className={cn(
                            "data-[panel-group-direction=vertical]:h-full overflow-hidden",
                            isRightCollapsed && "min-w-0"
                        )}
                    >
                         <div className={cn("h-full w-full", isRightCollapsed && "invisible")}>
                            <Inspector />
                         </div>
                    </ResizablePanel>
                    </>
                )}

            </ResizablePanelGroup>
        )}
        
        <CompileDialog open={isCompilerOpen} onOpenChange={setIsCompilerOpen} />
        <TargetDialog open={isTargetDialogOpen} onOpenChange={setIsTargetDialogOpen} />
    </div>
  )
}


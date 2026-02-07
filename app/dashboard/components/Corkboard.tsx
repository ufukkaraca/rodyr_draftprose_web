"use client";

import React from "react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {  LayoutGrid, MoreVertical, FolderOpen } from "lucide-react"
import { useProjectStore, BinderNode } from "@/app/dashboard/store/useProjectStore"

export function Corkboard() {
  const activeNodeId = useProjectStore((state) => state.activeNodeId)
  const nodes = useProjectStore((state) => state.nodes)
  const setActiveNode = useProjectStore((state) => state.setActiveNode)
  const setViewMode = useProjectStore((state) => state.setViewMode)

  const activeNode = activeNodeId ? nodes[activeNodeId] : null

  // Determine which cards to show:
  // 1. If activeNode is a FOLDER, show its children.
  // 2. If activeNode is a FILE, show its siblings? Or just show the folder it belongs to?
  //    Scrivener Logic: Clicking a file in Corkboard usually edits it. Clicking a Folder shows corkboard.
  //    If we are in Corkboard Mode and select a File:
  //    Option A: Show the File's own card (Singular)?
  //    Option B: Show the Parent Folder's contents (Context)?
  //    Let's go with Option B (Context) for "Drilling Up" feeling, OR show children if it has them.
  //    Actually, simpler for MVP: Show "Children of Active Node". If no children (it's a file), show "Empty" or "This is a leaf".
  
  // Correction: If I select "Chapter 1" (File), and it has no children, Corkboard is empty.
  // But usually Chapters are Folders in Scrivener.
  // Let's assume standard behavior: Show Children.
  
  const allNodes = Object.values(nodes);
  
  // Filter for children of the active node
  const children = allNodes
      .filter(node => node.parentId === activeNodeId)
      .sort((a, b) => a.order - b.order);

  // If active node is null, show top-level items (parentId === null)
  const displayNodes = activeNodeId 
      ? children 
      : allNodes.filter(node => node.parentId === null).sort((a, b) => a.order - b.order);
      
  const handleCardClick = (node: BinderNode) => {
      // If clicking a card:
      // 1. Select it.
      // 2. If it's a file, maybe switch to Editor View?
      //    User workflow: Planning -> Clicking card -> Writing.
      //    Yes, auto-switch makes sense for Files.
      
      setActiveNode(node.id)
      
      if (node.type === 'file') {
          setViewMode('editor')
      }
  }

  return (
    <div className="h-full flex flex-col bg-background/50">
        <div className="h-10 flex items-center px-4 border-b border-border/40 gap-2 justify-between">
            <div className="flex items-center gap-2">
                <LayoutGrid className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs font-mono font-medium text-muted-foreground uppercase tracking-wider">
                    {activeNode ? activeNode.title : "Manuscript Root"}
                </span>
            </div>
            {/* Context Info */}
            <span className="text-[10px] text-muted-foreground font-mono">
                {displayNodes.length} Cards
            </span>
        </div>
        
        <ScrollArea className="flex-1 p-8">
            {displayNodes.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground opacity-50 gap-4">
                    <FolderOpen className="h-12 w-12" />
                    <span className="text-sm font-medium">No cards in this folder</span>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {displayNodes.map((node) => (
                        <Card 
                            key={node.id} 
                            onClick={() => handleCardClick(node)}
                            className="h-[240px] flex flex-col hover:shadow-md transition-shadow cursor-pointer group border-muted-foreground/20 bg-card/50"
                        >
                            <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
                                <CardTitle className="text-sm font-semibold truncate leading-tight pr-2">
                                    {node.title}
                                </CardTitle>
                                <MoreVertical className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                            </CardHeader>
                            <CardContent className="px-4 py-2 flex-1">
                                <p className="text-xs text-muted-foreground font-serif leading-relaxed line-clamp-6">
                                    {node.synopsis || "No synopsis..."}
                                </p>
                            </CardContent>
                            <CardFooter className="p-3 pt-0 flex justify-between items-center border-t border-border/30 mt-auto bg-muted/10 h-10">
                                 <Badge variant="outline" className="text-[10px] h-5 font-mono font-normal uppercase opacity-70">
                                    {node.label}
                                 </Badge>
                                 <div className="flex items-center gap-1.5">
                                     <span className={`h-1.5 w-1.5 rounded-full ${
                                         node.status === 'draft' ? 'bg-orange-400' : 
                                         node.status === 'revised' ? 'bg-green-400' : 
                                         node.status === 'done' ? 'bg-blue-400' : 'bg-gray-400'
                                     }`} />
                                     <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{node.status}</span>
                                 </div>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}
        </ScrollArea>
    </div>
  )
}

"use client";

import React from "react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {  LayoutGrid, MoreVertical, FolderOpen } from "lucide-react"
import { useProjectStore, BinderNode } from "@/app/dashboard/store/useProjectStore"

  /* 
     Corkboard Drag-and-Drop Logic 
  */
  import { 
    DndContext, 
    DragOverlay, 
    closestCenter, 
    KeyboardSensor, 
    PointerSensor, 
    useSensor, 
    useSensors,
    DragEndEvent
  } from '@dnd-kit/core';
  import { 
    arrayMove, 
    SortableContext, 
    sortableKeyboardCoordinates, 
    rectSortingStrategy,
    useSortable
  } from '@dnd-kit/sortable';
  import { CSS } from '@dnd-kit/utilities';

  // --- Sortable Card Component ---
  function SortableCard({ node, onClick }: { node: BinderNode, onClick: (node: BinderNode) => void }) {
      const {
          attributes,
          listeners,
          setNodeRef,
          transform,
          transition,
          isDragging
      } = useSortable({ id: node.id });

      const style = {
          transform: CSS.Transform.toString(transform),
          transition,
          zIndex: isDragging ? 50 : 'auto',
          opacity: isDragging ? 0.5 : 1
      };

      return (
          <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
               <Card 
                  onClick={() => onClick(node)}
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
          </div>
      );
  }

export function Corkboard() {
  const activeNodeId = useProjectStore((state) => state.activeNodeId)
  const nodes = useProjectStore((state) => state.nodes)
  const setActiveNode = useProjectStore((state) => state.setActiveNode)
  const setViewMode = useProjectStore((state) => state.setViewMode)
  const moveNode = useProjectStore((state) => state.moveNode)

  const [isStacked, setIsStacked] = React.useState(false)

  const activeNode = activeNodeId ? nodes[activeNodeId] : null

  // Sensors for Drag and Drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
        activationConstraint: {
            distance: 8, // Require 8px movement to start drag, allowing clicks
        },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const allNodes = Object.values(nodes);
  
  // Helper: Normalize parentId
  const normalize = (pid: string | null | undefined) => (!pid || pid === 'root') ? null : pid;

  const activeNormalized = normalize(activeNodeId);

  // Stacked View Logic: Recursive Flatten
  const getFlattenedDescendants = (parentId: string | null): BinderNode[] => {
      const children = allNodes
          .filter(n => normalize(n.parentId) === parentId)
          .sort((a, b) => a.order - b.order);
      
      let results: BinderNode[] = [];
      for (const child of children) {
          results.push(child);
          // Recursively add children if it's a folder
          if (child.type === 'folder') {
              results.push(...getFlattenedDescendants(child.id));
          }
      }
      return results;
  }

  // Filter for children or descendants based on mode
  const displayNodes = React.useMemo(() => {
      if (isStacked && activeNormalized) {
          return getFlattenedDescendants(activeNormalized);
      } else {
          // Standard View (Direct Children)
          return allNodes
            .filter(node => normalize(node.parentId) === activeNormalized)
            .sort((a, b) => a.order - b.order);
      }
  }, [nodes, activeNormalized, isStacked]);
      
  const handleCardClick = (node: BinderNode) => {
      setActiveNode(node.id)
      
      if (node.type === 'file') {
          setViewMode('editor')
      }
  }

  const handleDragEnd = (event: DragEndEvent) => {
      const { active, over } = event;
      
      if (over && active.id !== over.id) {
          const oldIndex = displayNodes.findIndex(node => node.id === active.id);
          const newIndex = displayNodes.findIndex(node => node.id === over.id);
          
          if (oldIndex !== -1 && newIndex !== -1) {
              const newOrder = arrayMove(displayNodes, oldIndex, newIndex);
              
              // Persist specific updates
              newOrder.forEach((node, index) => {
                  if (node.order !== index) {
                      moveNode(node.id, node.parentId, index);
                  }
              });
          }
      }
  };

  return (
    <div className="h-full flex flex-col bg-background/50">
        <div className="h-10 flex items-center px-4 border-b border-border/40 gap-2 justify-between">
            <div className="flex items-center gap-2">
                <LayoutGrid className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs font-mono font-medium text-muted-foreground uppercase tracking-wider">
                    {activeNode ? activeNode.title : "Manuscript Root"}
                </span>
            </div>
            
            <div className="flex items-center gap-4">
                 {/* Stacked Toggle */}
                 <div className="flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground uppercase">Stacked</span>
                    <button 
                        onClick={() => setIsStacked(!isStacked)}
                        className={`h-4 w-8 rounded-full transition-colors relative ${isStacked ? 'bg-primary' : 'bg-muted'}`}
                    >
                        <div className={`absolute top-0.5 h-3 w-3 rounded-full bg-white transition-transform ${isStacked ? 'left-4.5 translate-x-1' : 'left-0.5'}`} />
                    </button>
                 </div>

                {/* Context Info */}
                <span className="text-[10px] text-muted-foreground font-mono">
                    {displayNodes.length} Cards
                </span>
            </div>
        </div>
        
        <ScrollArea className="flex-1 p-8">
            {displayNodes.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground opacity-50 gap-4">
                    <FolderOpen className="h-12 w-12" />
                    <span className="text-sm font-medium">No cards in this folder</span>
                </div>
            ) : (
                // Disable DnD in Stacked Mode
                isStacked ? (
                     <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {displayNodes.map((node) => (
                            // Use pure Card, not Sortable
                           <div key={node.id}>
                                <Card 
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
                           </div>
                        ))}
                    </div>
                ) : (
                    <DndContext 
                        sensors={sensors} 
                        collisionDetection={closestCenter} 
                        onDragEnd={handleDragEnd}
                    >
                        <SortableContext 
                            items={displayNodes.map(n => n.id)} 
                            strategy={rectSortingStrategy}
                        >
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {displayNodes.map((node) => (
                                    <SortableCard 
                                        key={node.id} 
                                        node={node} 
                                        onClick={handleCardClick} 
                                    />
                                ))}
                            </div>
                        </SortableContext>
                    </DndContext>
                )
            )}
        </ScrollArea>
    </div>
  )
}

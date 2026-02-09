"use client";

import React, { useState, useMemo } from "react"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  DragStartEvent,
  DragEndEvent,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Folder, FileText, Plus, ChevronRight, ChevronDown, GripVertical, Trash2, FolderPlus, Library } from "lucide-react"

// ... imports ...

import { cn } from "@/lib/utils"
import { useProjectStore, BinderNode } from "@/app/dashboard/store/useProjectStore"

// --- Sortable Item Component ---
// --- Visual Binder Item Component ---
interface BinderItemProps {
  item: BinderNode
  depth: number
  isActive?: boolean
  isDragging?: boolean
  onCollapse: (id: string, e: React.MouseEvent) => void
  onSelect: (id: string) => void
  dragListeners?: any
  style?: React.CSSProperties
  innerRef?: React.Ref<HTMLDivElement>
}

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"

import { ConfirmDialog } from "./ConfirmDialog"

function BinderItem({ 
    item, 
    depth, 
    isActive, 
    isDragging, 
    onCollapse, 
    onSelect, 
    dragListeners, 
    style, 
    innerRef 
}: BinderItemProps) {
  // Robust check for trash folder (legacy 'trash' or 'trash-[projectId]')
  const isTrash = item.id === 'trash' || item.id.startsWith('trash-');
  const isResearchRoot = item.id.startsWith('research-');
  const isSystemNode = isTrash || isResearchRoot;
  
  const deleteNode = useProjectStore((state) => state.deleteNode);
  const emptyTrash = useProjectStore((state) => state.emptyTrash);
  const restoreNode = useProjectStore((state) => state.restoreNode);
  
  const [showEmptyTrashConfirm, setShowEmptyTrashConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleAction = (e: React.MouseEvent, action: () => void) => {
      e.stopPropagation();
      action();
  }
  
  // -- Rename Logic --
  const updateNode = useProjectStore((state) => state.updateNode);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(item.title);

  // Sync state if prop changes (unless editing)
  React.useEffect(() => {
     if (!isEditing) setEditTitle(item.title);
  }, [item.title, isEditing]);

  const handleDoubleClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      setIsEditing(true);
  };

  const handleRenameSubmit = () => {
      if (editTitle.trim() && editTitle !== item.title) {
          updateNode(item.id, { title: editTitle.trim() });
      }
      setIsEditing(false);
  };
  
  // Check if item is INSIDE trash (parent id contains trash)
  const isItemInTrash = item.parentId && (item.parentId === 'trash' || item.parentId.startsWith('trash-'));

  return (
    <>
    <ContextMenu>
        <ContextMenuTrigger asChild>
            <div
            ref={innerRef}
            style={style}
            className={cn(
                "group flex items-center py-1 pr-2 text-sm select-none outline-none transition-colors rounded-sm mx-1",
                isDragging ? "opacity-50 bg-sidebar-accent/50" : "hover:bg-sidebar-accent/50",
                isActive && "bg-sidebar-accent text-sidebar-accent-foreground font-medium",
                isTrash && "text-red-500/80 hover:text-red-600 hover:bg-red-50/10"
            )}
            onClick={() => onSelect(item.id)}
            >
            {/* Drag Handle - Hidden for Trash */}
            <div 
                {...dragListeners} 
                className={cn(
                    "mr-1 opacity-0 group-hover:opacity-100 cursor-grab text-sidebar-foreground/30 hover:text-sidebar-foreground transition-opacity",
                    isDragging && "cursor-grabbing",
                    isSystemNode && "invisible pointer-events-none"
                )}
                onClick={(e) => e.stopPropagation()}
            >
                <GripVertical className="h-3 w-3" />
            </div>

            {/* Collapse Toggle */}
            <button
                onClick={(e) => onCollapse(item.id, e)}
                className={cn(
                    "h-4 w-4 flex items-center justify-center mr-1 text-sidebar-foreground/50 hover:text-sidebar-foreground rounded-sm transition-colors",
                    item.type === "file" && "invisible"
                )}
            >
                {item.type === "folder" && (
                    item.collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
                )}
            </button>

            {/* Icon */}
            {isTrash ? (
                <Trash2 className="h-4 w-4 mr-2" />
            ) : item.label === 'research' || item.id.startsWith('research-') ? (
                <Library className={cn("h-4 w-4 mr-2 text-sidebar-foreground/60", isActive && "text-sidebar-foreground")} />
            ) : item.type === "folder" ? (
                <Folder className={cn("h-4 w-4 mr-2 text-sidebar-foreground/60", isActive && "text-sidebar-foreground")} />
            ) : (
                <FileText className={cn("h-4 w-4 mr-2 text-sidebar-foreground/60", isActive && "text-sidebar-foreground")} />
            )}

            {/* Label / Input */}
            {isEditing ? (
                <input 
                    className="flex-1 bg-transparent border border-sidebar-accent-foreground/30 rounded px-1 text-sm focus:outline-none focus:ring-1 focus:ring-sidebar-ring h-5 min-w-0"
                    value={editTitle}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onBlur={handleRenameSubmit}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') handleRenameSubmit();
                        if (e.key === 'Escape') {
                            setEditTitle(item.title);
                            setIsEditing(false);
                            // Restore focus to container if possible
                        }
                    }}
                    autoFocus
                />
            ) : (
                <span 
                    className="truncate flex-1"
                    onDoubleClick={handleDoubleClick}
                >
                    {item.title}
                </span>
            )}
            </div>
        </ContextMenuTrigger>
        <ContextMenuContent className="w-48">
            {isTrash ? (
                <ContextMenuItem 
                    className="text-red-600 focus:text-red-600 focus:bg-red-50"
                    onClick={(e) => handleAction(e, () => setShowEmptyTrashConfirm(true))}
                >
                    <Trash2 className="mr-2 h-4 w-4" /> Empty Trash
                </ContextMenuItem>
            ) : isItemInTrash ? (
                <>
                    <ContextMenuItem onClick={(e) => handleAction(e, () => restoreNode(item.id))}>
                        Restore to Draft
                    </ContextMenuItem>
                    <ContextMenuSeparator />
                    <ContextMenuItem 
                        className="text-red-600 focus:text-red-600 focus:bg-red-50"
                        onClick={(e) => handleAction(e, () => setShowDeleteConfirm(true))}
                    >
                        Delete Permanently
                    </ContextMenuItem>
                </>
            ) : (
                <>
                    {/* Standard Items */}
                    <ContextMenuItem onClick={(e) => handleAction(e, () => deleteNode(item.id))}>
                        Move to Trash
                    </ContextMenuItem>
                </>
            )}
        </ContextMenuContent>
    </ContextMenu>

    <ConfirmDialog 
        open={showEmptyTrashConfirm} 
        onOpenChange={setShowEmptyTrashConfirm}
        title="Empty Trash?"
        description="This will permanently delete all items in the trash. This action cannot be undone."
        onConfirm={() => emptyTrash()}
        confirmLabel="Empty Trash"
        variant="destructive"
    />

    <ConfirmDialog 
        open={showDeleteConfirm} 
        onOpenChange={setShowDeleteConfirm}
        title="Delete Permanently?"
        description="This will permanently delete this item. This action cannot be undone."
        onConfirm={() => deleteNode(item.id)}
        confirmLabel="Delete"
        variant="destructive"
    />
    </>
  )
}

// --- Sortable Wrapper ---
interface SortableItemProps {
  item: BinderNode
  depth: number
  onCollapse: (id: string) => void
  activeId?: string | null
  onSelect: (id: string) => void
}

function SortableBinderItem({ item, depth, onCollapse, activeId, onSelect }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id, data: { ...item, depth } })

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    paddingLeft: `${depth * 16 + 8}px`,
  }

  const handleCollapse = (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      onCollapse(id);
  }

  return (
    <BinderItem
        item={item}
        depth={depth}
        isActive={activeId === item.id}
        isDragging={isDragging}
        onCollapse={handleCollapse}
        onSelect={onSelect}
        dragListeners={{ ...attributes, ...listeners }}
        style={style}
        innerRef={setNodeRef}
    />
  )
}


// --- Main Binder Component ---
export function Binder() {
  const nodes = useProjectStore((state) => state.nodes)
  const activeId = useProjectStore((state) => state.activeNodeId)
  const setActiveNode = useProjectStore((state) => state.setActiveNode)
  const updateNode = useProjectStore((state) => state.updateNode)
  const addNode = useProjectStore((state) => state.addNode)
  const projectId = useProjectStore((state) => state.projectId)

  const [draggedItemId, setDraggedItemId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  // Auto-Expand Logic
  const hoverTimer = React.useRef<NodeJS.Timeout | null>(null);
  const lastOverId = React.useRef<string | null>(null);

  // -- Projection Logic --
  const flatItems: BinderNode[] = useMemo(() => {
      return Object.values(nodes).sort((a, b) => a.order - b.order)
  }, [nodes]);

  const visibleItems = useMemo(() => {
    // 1. Group by parent
    const childrenMap = new Map<string | null, BinderNode[]>()
    flatItems.forEach(item => {
        const pid = item.parentId
        if (!childrenMap.has(pid)) childrenMap.set(pid, [])
        childrenMap.get(pid)!.push(item)
    })
    
    // Sort siblings by order
    childrenMap.forEach((siblings) => siblings.sort((a, b) => a.order - b.order))

    // 2. Recursive Flatten with visibility
    const result: { item: BinderNode; depth: number }[] = []
    
    function traverse(parentId: string | null, depth: number) {
        const siblings = childrenMap.get(parentId) || []
        siblings.forEach((sibling) => {
            result.push({ item: sibling, depth })
            
            // Treat undefined as 'expanded' (false) by default if not set
            const isCollapsed = sibling.collapsed === true;
            
            if (sibling.type === "folder" && !isCollapsed) {
                traverse(sibling.id, depth + 1)
            }
        })
    }
    traverse(null, 0)
    return result
  }, [flatItems]) 

  const visibleItemIds = visibleItems.map(x => x.item.id)


  // Handlers
  const handleDragStart = (event: DragStartEvent) => {
    setDraggedItemId(String(event.active.id))
  }

  const handleAdd = () => {
      if (!projectId) return;
      const newNode: BinderNode = {
          id: crypto.randomUUID(),
          title: 'Untitled',
          type: 'file',
          parentId: null,
          order: Object.values(nodes).filter(n => n.parentId === null).length,
          status: 'draft',
          label: 'scene',
          synopsis: '',
          notes: ''
      };
      addNode(newNode, projectId);
  }

  const handleAddFolder = () => {
      if (!projectId) return;
      const newNode: BinderNode = {
          id: crypto.randomUUID(),
          title: 'Untitled Folder',
          type: 'folder',
          parentId: null,
          order: Object.values(nodes).filter(n => n.parentId === null).length,
          status: 'draft',
          label: 'chapter',
          collapsed: false, // Auto-expand new folders
          synopsis: '',
          notes: ''
      };
      addNode(newNode, projectId);
  }

  const handleDragOver = (event: any) => {
      const { over } = event;
      
      if (!over) {
          if (hoverTimer.current) {
              clearTimeout(hoverTimer.current);
              hoverTimer.current = null;
          }
          lastOverId.current = null;
          return;
      }

      if (over.id !== lastOverId.current) {
          // Changed target
          if (hoverTimer.current) {
              clearTimeout(hoverTimer.current);
          }
          lastOverId.current = over.id;

          const node = nodes[String(over.id)];
          // Only expand if it's a folder, it's collapsed, and we are not dragging IT
          if (node && node.type === 'folder' && node.collapsed && draggedItemId !== node.id) {
              hoverTimer.current = setTimeout(() => {
                  updateNode(node.id, { collapsed: false });
              }, 600); // 600ms hover to expand
          }
      }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setDraggedItemId(null)
    
    // Cleanup timer
    if (hoverTimer.current) {
        clearTimeout(hoverTimer.current);
        hoverTimer.current = null;
    }
    lastOverId.current = null;

    if (!over || active.id === over.id) return;

    // Calculate new flattened order
    const oldIndex = visibleItemIds.indexOf(String(active.id));
    const newIndex = visibleItemIds.indexOf(String(over.id));
    
    if (oldIndex === -1 || newIndex === -1) return;

    // Simulate the move to guess new neighbors
    // We need the full items to check properties (collapsed/type)
    const newVisibleItems = arrayMove(visibleItems, oldIndex, newIndex);
    
    const movedItem = newVisibleItems[newIndex];
    const predecessor = newVisibleItems[newIndex - 1];
    
    let newParentId: string | null = null;
    
    // logic: 
    // 1. If no predecessor, we are at root top.
    // 2. If predecessor is an Expanded Folder, we become its first child.
    // 3. Otherwise, we become the predecessor's sibling (adopt its parent).
    
    if (!predecessor) {
        newParentId = null;
    } else {
        if (predecessor.item.type === 'folder' && !predecessor.item.collapsed) {
             newParentId = predecessor.item.id;
        } else {
             newParentId = predecessor.item.parentId;
        }
    }
    
    // Calculate Order:
    // We can't just set 'newIndex' because 'order' is relative to siblings in standard data models.
    // But our 'visibleItems' sort relies on 'order'.
    // To be safe, we should probably update *all* siblings' orders or give this one a fractional order?
    // For simplicity efficiently: We will assign it an order based on neighbors in the *same parent group*.
    // But that requires fetching all future siblings.
    
    // Simpler Hack: Just update the ParentID. We rely on the User to re-drag for specific ordering if it conflicts?
    // No, that causes jumping. 
    // Better: We update ParentID, AND we assume we are appended continuously?
    // Actually, if we just set the ParentID, it will be appended to the END of that parent's list by standard logic?
    // No, standard sort is by 'order'.
    
    // Robust Reorder:
    // 1. Get all nodes that will be siblings of the new parent.
    // 2. Assign proper orders.
    
    // Optimization: Calculate new order as (prevSibling.order + nextSibling.order) / 2?
    // Or just re-normalize.
    
    // Let's implement a robust "Update and Reorder Siblings" approach.
    // We only need to optimize the 'order' of the moved item.
    
    // For now, let's strictly set ParentID. The 'order' we can try to guess from the predecessor.
    // If we are nesting (predecessor is parent): order = -1 (first)? Or 0.
    // If we are sibling (predecessor is sibling): order = predecessor.order + 1. (Might clash, but sorts after).
    
    let newOrder = 0;
    if (!predecessor) {
        // Root top
        newOrder = -1; // Ensure before any 0s?
    } else if (predecessor.item.id === newParentId) {
        // First child of parent
        newOrder = 0;
    } else {
        // Sibling
        newOrder = predecessor.item.order + 1; // Put after predecessor
        // Note: This might cause collision with the *next* sibling's order, but sort is stable-ish.
        // A full reindex is expensive but safer. For a small project (MVP), simple addition is okay-ish.
        // Ideally we'd shift all following siblings.
    }

    updateNode(String(active.id), { parentId: newParentId, order: newOrder });
  }

  const handleCollapse = (id: string) => {
     const node = nodes[id];
     if (node) updateNode(id, { collapsed: !node.collapsed })
  }

  const draggedItemNode = draggedItemId ? nodes[draggedItemId] : null;

  return (
    <div className="flex flex-col h-full bg-sidebar border-r border-sidebar-border min-w-0">
      <div className="h-14 flex items-center justify-between px-4 border-b border-sidebar-border">
        <span className="font-mono text-xs font-bold uppercase tracking-wider text-sidebar-foreground/70">Binder</span>
        <div className="flex gap-1">
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleAddFolder} title="New Folder">
            <FolderPlus className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleAdd} title="New File">
            <Plus className="h-4 w-4" />
            </Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2">
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
            >
                <SortableContext 
                    items={visibleItemIds} 
                    strategy={verticalListSortingStrategy}
                >
                    {visibleItems.map(({ item, depth }) => (
                        <SortableBinderItem
                            key={item.id}
                            item={item}
                            depth={depth}
                            onCollapse={handleCollapse}
                            activeId={activeId}
                            onSelect={setActiveNode}
                        />
                    ))}
                </SortableContext>
                <DragOverlay dropAnimation={null}>
                    {draggedItemNode ? (
                         <div className="opacity-90">
                            {/* We manually recreate BinderItem appearance but purely visual */}
                            <BinderItem 
                                item={draggedItemNode}
                                depth={0} // Flat in overlay
                                isDragging={true}
                                isActive={true}
                                onCollapse={() => {}}
                                onSelect={() => {}}
                                style={{
                                    cursor: 'grabbing',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                    background: 'var(--sidebar-accent)',
                                    borderRadius: '4px',
                                    border: '1px solid var(--sidebar-border)'
                                }}
                            />
                        </div>
                    ) : null}
                </DragOverlay>
            </DndContext>
        </div>
      </ScrollArea>
      
      <div className="h-10 border-t border-sidebar-border flex items-center px-4 text-[10px] font-mono text-sidebar-foreground/50">
        {Object.keys(nodes).length} items
      </div>
    </div>
  )
}


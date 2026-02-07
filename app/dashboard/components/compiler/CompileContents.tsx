
"use client";

import React from "react";
import { BinderNode, useProjectStore } from "../../store/useProjectStore";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ChevronRight, ChevronDown, FileText, Folder } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface CompileContentsProps {
    selectedIds: Set<string>;
    onToggle: (id: string, checked: boolean) => void;
    onToggleAll: (checked: boolean) => void;
}

export function CompileContents({ selectedIds, onToggle, onToggleAll }: CompileContentsProps) {
    const { nodes } = useProjectStore();
    
    // Convert flat nodes to tree
    const tree = React.useMemo(() => {
        type TreeNodeType = BinderNode & { children: TreeNodeType[] };
        const rootNodes: TreeNodeType[] = [];
        const nodeMap = new Map<string, TreeNodeType>();

        // Initialize map
        Object.values(nodes).forEach(node => {
            // @ts-ignore - we know we are building the tree
            nodeMap.set(node.id, { ...node, children: [] });
        });

        // Build hierarchy
        Object.values(nodes).forEach(node => {
            if (node.order === 99) return; // Skip Trash
            
            const mappedNode = nodeMap.get(node.id)!;
            if (node.parentId && nodeMap.has(node.parentId)) {
                nodeMap.get(node.parentId)!.children.push(mappedNode);
            } else {
                rootNodes.push(mappedNode);
            }
        });

        // Sort by order
        const sortNodes = (n: TreeNodeType[]) => {
            n.sort((a, b) => a.order - b.order);
            n.forEach(child => sortNodes(child.children));
        };
        sortNodes(rootNodes);
        
        return rootNodes;
    }, [nodes]);

    return (
        <div className="flex flex-col h-full">
            <div className="flex items-center justify-between pb-4 border-b mb-4">
                 <div className="text-sm font-medium text-muted-foreground">
                    Include in Compile
                 </div>
                 <div className="flex gap-2">
                    <Button variant="ghost" size="xs" onClick={() => onToggleAll(true)} className="text-xs h-6">Check All</Button>
                    <Button variant="ghost" size="xs" onClick={() => onToggleAll(false)} className="text-xs h-6">Uncheck All</Button>
                 </div>
            </div>
            
            <div className="flex-1 overflow-y-auto pr-2">
                {tree.map(node => (
                    <TreeNode 
                        key={node.id} 
                        node={node} 
                        selectedIds={selectedIds} 
                        onToggle={onToggle}
                        level={0}
                    />
                ))}
            </div>
        </div>
    );
}

function TreeNode({ 
    node, 
    selectedIds, 
    onToggle,
    level
}: { 
    node: BinderNode & { children: any[] }, 
    selectedIds: Set<string>, 
    onToggle: (id: string, checked: boolean) => void,
    level: number
}) {
    const isSelected = selectedIds.has(node.id);
    const [expanded, setExpanded] = React.useState(true);
    
    // Auto-select children logic could go here, but keep simple for now
    
    const handleToggle = (checked: boolean) => {
        onToggle(node.id, checked);
        // Optional: Toggle children? For now, manual control.
    };

    return (
        <div className="select-none">
            <div 
                className={cn(
                    "flex items-center gap-2 py-1.5 px-2 rounded-sm hover:bg-muted/50 transition-colors group",
                    isSelected ? "opacity-100" : "opacity-60"
                )}
                style={{ paddingLeft: `${level * 16 + 8}px` }}
            >
                {node.children.length > 0 ? (
                    <button 
                        onClick={() => setExpanded(!expanded)}
                        className="p-0.5 rounded-sm hover:bg-muted text-muted-foreground"
                    >
                        {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </button>
                ) : (
                    <span className="w-4" /> // Spacer
                )}

                <Checkbox 
                    id={`compile-${node.id}`}
                    checked={isSelected}
                    onCheckedChange={(c) => handleToggle(!!c)}
                    className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                />

                <Label 
                    htmlFor={`compile-${node.id}`} 
                    className="flex-1 cursor-pointer flex items-center gap-2 font-normal"
                >
                    {node.type === 'folder' ? (
                        <Folder className={cn("h-4 w-4", isSelected ? "text-blue-500" : "text-muted-foreground")} />
                    ) : (
                        <FileText className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span className={cn(isSelected ? "text-foreground" : "text-muted-foreground")}>
                        {node.title}
                    </span>
                    
                    {node.status && (
                        <span className="text-[10px] uppercase text-muted-foreground border px-1 rounded-sm ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                            {node.status}
                        </span>
                    )}
                </Label>
            </div>

            {expanded && node.children.length > 0 && (
                <div>
                     {node.children.map(child => (
                        <TreeNode 
                            key={child.id} 
                            node={child} 
                            selectedIds={selectedIds} 
                            onToggle={onToggle}
                            level={level + 1}
                        />
                     ))}
                </div>
            )}
        </div>
    )
}

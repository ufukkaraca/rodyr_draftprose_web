
import React from "react";
import { BinderNode } from "@/app/dashboard/store/useProjectStore";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronRight, ChevronDown, FileText, Folder } from "lucide-react";
import { cn } from "@/lib/utils";

interface CompilerContentsProps {
  nodes: Record<string, BinderNode>;
  includedIds: Set<string>;
  onChange: (newSet: Set<string>) => void;
}

export function CompilerContents({ nodes, includedIds, onChange }: CompilerContentsProps) {
    // Build tree
    const rootNodes = Object.values(nodes)
        .filter((n) => !n.parentId)
        .sort((a, b) => a.order - b.order);

    const toggle = (id: string, checked: boolean) => {
        const newSet = new Set(includedIds);
        if (checked) {
            newSet.add(id);
            // Auto-check children? Maybe not for now, simple toggle.
            // Actually, if a folder is unchecked, its children shouldn't be compiled usually.
            // But let's keep it granular for Scrivener power.
        } else {
            newSet.delete(id);
        }
        onChange(newSet);
    };

    const toggleAll = (checked: boolean) => {
        if (checked) {
            onChange(new Set(Object.keys(nodes)));
        } else {
            onChange(new Set());
        }
    };

    return (
        <div className="space-y-4">
             <div className="flex items-center justify-between pb-2 border-b border-border">
                <span className="text-sm font-medium">Include in Compile</span>
                 <div className="flex gap-2">
                    <Button variant="ghost" size="xs" onClick={() => toggleAll(true)}>Check All</Button>
                    <Button variant="ghost" size="xs" onClick={() => toggleAll(false)}>Uncheck All</Button>
                 </div>
             </div>
             
             <div className="space-y-1">
                 {rootNodes.map(node => (
                     <ContentRow 
                        key={node.id} 
                        node={node} 
                        nodes={nodes} 
                        includedIds={includedIds} 
                        onToggle={toggle} 
                     />
                 ))}
             </div>
        </div>
    );
}

function ContentRow({ 
    node, 
    nodes, 
    includedIds, 
    onToggle, 
    level = 0 
}: { 
    node: BinderNode, 
    nodes: Record<string, BinderNode>, 
    includedIds: Set<string>, 
    onToggle: (id: string, val: boolean) => void,
    level?: number
}) {
    const children = Object.values(nodes)
        .filter(n => n.parentId === node.id)
        .sort((a, b) => a.order - b.order);
        
    const hasChildren = children.length > 0;
    const isChecked = includedIds.has(node.id);

    return (
        <div className="">
            <div 
                className={cn(
                    "flex items-center gap-2 py-1 px-2 rounded-md hover:bg-muted/50 text-sm group",
                )}
                style={{ paddingLeft: `${(level * 16) + 8}px` }}
            >
                <Checkbox 
                    checked={isChecked} 
                    onCheckedChange={(checked) => onToggle(node.id, checked as boolean)}
                />
                
                <span className="text-muted-foreground">
                    {node.type === 'folder' ? <Folder className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                </span>
                
                <span className={cn(
                    "truncate flex-1",
                    !isChecked && "text-muted-foreground line-through opacity-50"
                )}>
                    {node.title}
                </span>

                <span className="text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100 uppercase">
                    {node.type}
                </span>
            </div>

            {hasChildren && (
                <div className="border-l border-border/30 ml-4">
                    {children.map(child => (
                        <ContentRow 
                            key={child.id} 
                            node={child} 
                            nodes={nodes} 
                            includedIds={includedIds} 
                            onToggle={onToggle}
                            level={level + 1}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}

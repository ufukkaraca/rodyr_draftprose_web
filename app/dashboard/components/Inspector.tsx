"use client";

import React, { useState } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { FileText, Tag, Image as ImageIcon, Sparkles, BookOpen, Clock, Camera, RotateCcw } from "lucide-react"
import { useProjectStore, BinderNode, Snapshot, NodeStatus, NodeLabel } from "@/app/dashboard/store/useProjectStore"
import { MuseChat } from "./MuseChat"
import { ConfirmDialog } from "./ConfirmDialog"

export function Inspector() {
  const activeNodeId = useProjectStore((state) => state.activeNodeId)
  const nodes = useProjectStore((state) => state.nodes)
  const updateNode = useProjectStore((state) => state.updateNode)
  
  const allSnapshots = useProjectStore((state) => state.snapshots)
  const addSnapshot = useProjectStore((state) => state.addSnapshot)
  const loadSnapshots = useProjectStore((state) => state.loadSnapshots)

  const activeNode = activeNodeId ? nodes[activeNodeId] : null
  const currentSnapshots = activeNodeId ? (allSnapshots[activeNodeId] || []) : []

  const [previewSnapshot, setPreviewSnapshot] = useState<Snapshot | null>(null)
  
  const activeInspectorTab = useProjectStore((state) => state.activeInspectorTab)
  const setActiveInspectorTab = useProjectStore((state) => state.setActiveInspectorTab)
  
  // Use local state if no active node, or sync with store
  // Actually, we want persistence globally, not per node for now (as per issue).

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  React.useEffect(() => {
      if (activeNodeId) {
          loadSnapshots(activeNodeId)
      }
  }, [activeNodeId, loadSnapshots])

  // Handlers
  const handleUpdate = (field: keyof BinderNode, value: string) => {
      if (activeNodeId) {
          updateNode(activeNodeId, { [field]: value })
      }
  }

  const handleTakeSnapshot = () => {
      if (activeNodeId) {
          addSnapshot(activeNodeId, `Snapshot ${currentSnapshots.length + 1}`)
      }
  }

  if (!activeNode) {
      return (
        <div className="flex flex-col h-full bg-sidebar border-l border-sidebar-border min-w-0 items-center justify-center p-4 text-center">
            <span className="text-xs text-muted-foreground font-mono">Select an item to inspect</span>
        </div>
      )
  }

  return (
    <div className="flex flex-col h-full bg-sidebar border-l border-sidebar-border min-w-0">
      {/* Inspector Header */}
      <div className="h-14 flex items-center justify-between px-4 border-b border-sidebar-border bg-sidebar/50 backdrop-blur-sm shrink-0">
        <span className="font-mono text-xs font-bold uppercase tracking-wider text-sidebar-foreground/70">Inspector</span>
      </div>

      <Tabs value={activeInspectorTab} onValueChange={setActiveInspectorTab} className="flex-1 flex flex-col min-h-0">
        <div className="px-2 py-2 border-b border-sidebar-border bg-sidebar shrink-0">
             <TabsList className="w-full grid grid-cols-5 h-9 gap-1 bg-sidebar-accent/30 p-1">
               <TabsTrigger value="general" className="text-[10px] px-0 data-[state=active]:bg-background data-[state=active]:shadow-sm" title="Metadata">
                   <Tag className="h-4 w-4" />
               </TabsTrigger>
               <TabsTrigger value="synopsis" className="text-[10px] px-0 data-[state=active]:bg-background data-[state=active]:shadow-sm" title="Synopsis">
                   <BookOpen className="h-4 w-4" />
               </TabsTrigger>
               <TabsTrigger value="notes" className="text-[10px] px-0 data-[state=active]:bg-background data-[state=active]:shadow-sm" title="Notes">
                   <FileText className="h-4 w-4" />
               </TabsTrigger>
               <TabsTrigger value="snapshots" className="text-[10px] px-0 data-[state=active]:bg-background data-[state=active]:shadow-sm" title="Snapshots">
                   <Camera className="h-4 w-4" />
               </TabsTrigger>
               <TabsTrigger value="muse" className="text-[10px] px-0 data-[state=active]:bg-background data-[state=active]:shadow-sm text-purple-600 data-[state=active]:text-purple-700" title="Muse Assistant">
                   <Sparkles className="h-4 w-4" />
               </TabsTrigger>
             </TabsList>
        </div>

        <div className="flex-1 min-h-0 flex flex-col relative">
            {/* Tab: General (Meta) */}
            <TabsContent value="general" className="absolute inset-0 m-0 overflow-auto">
                <div className="p-4 space-y-6">
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-muted-foreground">
                            <Tag className="h-3 w-3" /> Metadata
                        </div>
                        
                        <div className="grid gap-3">
                            <div className="grid gap-1.5">
                                <Label htmlFor="title" className="text-xs text-muted-foreground">Title</Label>
                                <Input 
                                    id="title" 
                                    className="h-8" 
                                    value={activeNode.title} 
                                    onChange={(e) => handleUpdate("title", e.target.value)}
                                />
                            </div>

                            <div className="grid gap-1.5">
                                <Label htmlFor="status" className="text-xs text-muted-foreground">Status</Label>
                                <Select 
                                    value={activeNode.status} 
                                    onValueChange={(val) => handleUpdate("status", val)}
                                >
                                    <SelectTrigger id="status" className="h-8">
                                        <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="draft">In Draft</SelectItem>
                                        <SelectItem value="revised">Revised</SelectItem>
                                        <SelectItem value="done">Done</SelectItem>
                                        <SelectItem value="outline">Outline</SelectItem>
                                        <SelectItem value="note">Note</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid gap-1.5">
                                <Label htmlFor="label" className="text-xs text-muted-foreground">Label</Label>
                                <Select 
                                    value={activeNode.label} 
                                    onValueChange={(val) => handleUpdate("label", val)}
                                >
                                    <SelectTrigger id="label" className="h-8">
                                        <SelectValue placeholder="Select label" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="chapter">Chapter</SelectItem>
                                        <SelectItem value="scene">Scene</SelectItem>
                                        <SelectItem value="idea">Idea</SelectItem>
                                        <SelectItem value="research">Research</SelectItem>
                                        <SelectItem value="character">Character</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    <Separator />

                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-muted-foreground">
                            <Clock className="h-3 w-3" /> History
                        </div>
                        <div className="text-sm grid gap-2">
                            <div className="flex justify-between border-b pb-2 border-border/50">
                                <span className="text-muted-foreground">ID</span>
                                <span className="font-mono text-[10px]">{activeNode.id}</span>
                            </div>
                        </div>
                    </div>

                    <Separator />



                    <div className="pt-2 flex flex-col gap-2">
                        {(activeNode.parentId && (activeNode.parentId === 'trash' || activeNode.parentId.startsWith('trash-'))) && (
                             <Button 
                                variant="outline" 
                                size="sm" 
                                className="w-full gap-2 border-green-500/20 hover:border-green-500/50 hover:bg-green-50/10 hover:text-green-600"
                                onClick={() => {
                                    useProjectStore.getState().restoreNode(activeNode.id);
                                }}
                            >
                                <RotateCcw className="h-4 w-4" /> Restore
                            </Button>
                        )}
                        <Button 
                            variant="destructive" 
                            size="sm" 
                            className="w-full"
                            onClick={() => {
                                const isTrash = activeNode.parentId && (activeNode.parentId === 'trash' || activeNode.parentId.startsWith('trash-'));
                                if (isTrash) {
                                    setShowDeleteConfirm(true);
                                } else {
                                    useProjectStore.getState().deleteNode(activeNode.id);
                                }
                            }}
                        >
                            {activeNode.parentId && (activeNode.parentId === 'trash' || activeNode.parentId.startsWith('trash-')) ? "Delete Permanently" : "Move to Trash"}
                        </Button>
                    </div>

                    <ConfirmDialog 
                        open={showDeleteConfirm} 
                        onOpenChange={setShowDeleteConfirm}
                        title="Delete Permanently?"
                        description="This will permanently delete this item. This action cannot be undone."
                        onConfirm={() => useProjectStore.getState().deleteNode(activeNode.id)}
                        confirmLabel="Delete"
                        variant="destructive"
                    />
                </div>
            </TabsContent>

            {/* Tab: Synopsis */}
            <TabsContent value="synopsis" className="absolute inset-0 m-0 overflow-auto">
                 <div className="p-4 space-y-3">
                   <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-muted-foreground">
                      <BookOpen className="h-3 w-3" /> Synopsis
                   </div>
                   <div className="space-y-2">
                       <div className="aspect-video bg-muted rounded-md border border-border flex items-center justify-center text-muted-foreground/50 hover:bg-muted/80 transition-colors cursor-pointer group">
                           <ImageIcon className="h-6 w-6 group-hover:scale-110 transition-transform" />
                       </div>
                       <Textarea 
                          className="min-h-[200px] resize-none font-writer text-sm bg-background/50 focus:bg-background transition-colors"
                          placeholder="Write a brief synopsis..."
                          value={activeNode.synopsis}
                          onChange={(e) => handleUpdate("synopsis", e.target.value)}
                       />
                   </div>
                </div>
            </TabsContent>

           {/* Tab: Notes */}
           <TabsContent value="notes" className="absolute inset-0 m-0 flex flex-col p-4">
                <div className="space-y-2 h-full flex flex-col">
                   <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-muted-foreground shrink-0">
                       <FileText className="h-3 w-3" /> Document Notes
                    </div>
                    <Textarea 
                       className="flex-1 resize-none bg-yellow-50/10 border-yellow-500/20 focus:border-yellow-500/50 text-sm font-writer leading-relaxed p-4"
                       placeholder="Jot down ideas, questions, or reminders for this document..."
                       value={activeNode.notes}
                       onChange={(e) => handleUpdate("notes", e.target.value)}
                    />
                </div>
           </TabsContent>

           {/* Tab: Snapshots */}
           <TabsContent value="snapshots" className="absolute inset-0 m-0 overflow-auto">
               <div className="p-4 space-y-4">
                  <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-muted-foreground">
                          <Camera className="h-3 w-3" /> Snapshots
                       </div>
                       <Button size="sm" variant="outline" className="h-7 text-xs" onClick={handleTakeSnapshot}>
                           Take Snapshot
                       </Button>
                  </div>

                   <div className="space-y-1">
                       {currentSnapshots.map((snap) => (
                           <div 
                               key={snap.id}
                               className="p-3 border border-border rounded-md hover:bg-sidebar-accent/50 cursor-pointer transition-colors group"
                               onClick={() => setPreviewSnapshot(snap)}
                            >
                               <div className="flex items-center justify-between mb-1">
                                   <span className="font-medium text-xs">{snap.label}</span>
                                    <span className="text-[10px] text-muted-foreground">
                                        {new Date(snap.date).toLocaleDateString()} {new Date(snap.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                    </span>
                               </div>
                                <div className="text-xs text-muted-foreground truncate opacity-70 group-hover:opacity-100">
                                    {snap.content.substring(0, 50)}...
                                </div>
                           </div>
                       ))}
                   </div>
                </div>
           </TabsContent>
        
            {/* Tab: Muse Chat (Full Height) */}
            <TabsContent value="muse" className="absolute inset-0 m-0 flex flex-col">
                <MuseChat />
            </TabsContent>

        </div>
      </Tabs>
      
      {/* Footer / AI Status */}
      <div className="h-10 border-t border-sidebar-border flex items-center px-4 text-[10px] font-mono text-sidebar-foreground/50 justify-between shrink-0">
        <span className="flex items-center gap-1.5">
            <Sparkles className="h-3 w-3" /> Muse AI Ready
        </span>
      </div>

       {/* Controlled Dialog (Moved out of tabs) */}
       <Dialog open={!!previewSnapshot} onOpenChange={(open) => !open && setPreviewSnapshot(null)}>
           <DialogContent>
               <DialogHeader>
                   <DialogTitle>Snapshot Preview</DialogTitle>
                   <DialogDescription>
                       Compare with current version.
                   </DialogDescription>
               </DialogHeader>
               <div className="grid gap-4 py-4">
                   <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-2">
                           <Label>Snapshot ({previewSnapshot?.date})</Label>
                            <div className="border rounded-md p-2 h-[200px] text-xs font-mono overflow-auto bg-muted/20">
                               <div dangerouslySetInnerHTML={{ __html: previewSnapshot?.content || "" }} />
                            </div>
                       </div>
                   </div>
               </div>
               <DialogFooter>
                   <Button variant="outline" onClick={() => setPreviewSnapshot(null)}>Close</Button>
               </DialogFooter>
           </DialogContent>
       </Dialog>
    </div>
  )
}

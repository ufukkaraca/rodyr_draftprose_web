"use client";

import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { FileText, Settings, Type, List, Download, FileJson, FileType } from "lucide-react";
import { useProjectStore, BinderNode } from "@/app/dashboard/store/useProjectStore";
import { compileProject } from "./CompilerEngine";
import { CompilerContents } from "./CompilerContents";
import { CompilerSeparators } from "./CompilerSeparators";
import { CompilerFormatting } from "./CompilerFormatting";

interface CompilerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export type ExportFormat = "docx" | "pdf" | "md" | "html";

export interface CompileSettings {
  format: ExportFormat;
  includedNodeIds: Set<string>;
  metadata: {
    title: string;
    author: string;
  };
  separators: {
    folderToText: string;
    textToText: string;
  };
  formatting: {
    font: string;
    fontSize: number;
    override: boolean;
  };
}

export function CompilerDialog({ open, onOpenChange }: CompilerDialogProps) {
  const nodes = useProjectStore((state) => state.nodes);
  const content = useProjectStore((state) => state.content);
  
  // Default Settings
  const [settings, setSettings] = useState<CompileSettings>({
    format: "docx",
    includedNodeIds: new Set(),
    metadata: { title: "Untitled Project", author: "Author Name" },
    separators: { folderToText: "page_break", textToText: "empty_line" },
    formatting: { font: "Times New Roman", fontSize: 12, override: true },
  });

  // Initialize Included IDs with all node IDs on first load
  useEffect(() => {
    if (nodes && settings.includedNodeIds.size === 0) {
      setSettings(prev => ({ ...prev, includedNodeIds: new Set(Object.keys(nodes)) }));
    }
  }, [nodes]); // Depend on nodes to re-init if they load late

  const [isCompiling, setIsCompiling] = useState(false);

  const handleCompile = async () => {
    setIsCompiling(true);
    try {
      await compileProject(nodes, content, settings);
      onOpenChange(false); // Close on success? Or keep open?
    } catch (error) {
      console.error("Compilation failed", error);
      // Show error handling (toast?)
    } finally {
      setIsCompiling(false);
    }
  };

  const updateSetting = (key: keyof CompileSettings, value: any) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col p-0 gap-0 overflow-hidden z-[100]">
        <DialogHeader className="px-6 py-4 border-b border-border bg-muted/20 shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Download className="w-5 h-5 text-primary" />
            Manuscript Compiler
          </DialogTitle>
          <DialogDescription>
            Export your project to standard formats.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 flex overflow-hidden">
            <Tabs defaultValue="contents" className="flex-1 flex flex-col">
                <div className="flex-1 flex overflow-hidden">
                    {/* Sidebar */}
                    <div className="w-48 border-r border-border bg-muted/10 shrink-0">
                        <TabsList className="flex flex-col h-auto w-full bg-transparent p-2 gap-1 justify-start">
                            <TabsTrigger value="contents" className="w-full justify-start px-3 py-2 h-auto text-xs data-[state=active]:bg-sidebar-accent">
                                <List className="w-4 h-4 mr-2" /> Contents
                            </TabsTrigger>
                            <TabsTrigger value="separators" className="w-full justify-start px-3 py-2 h-auto text-xs data-[state=active]:bg-sidebar-accent">
                                <Settings className="w-4 h-4 mr-2" /> Separators
                            </TabsTrigger>
                            <TabsTrigger value="formatting" className="w-full justify-start px-3 py-2 h-auto text-xs data-[state=active]:bg-sidebar-accent">
                                <Type className="w-4 h-4 mr-2" /> Formatting
                            </TabsTrigger>
                             <TabsTrigger value="metadata" className="w-full justify-start px-3 py-2 h-auto text-xs data-[state=active]:bg-sidebar-accent">
                                <FileText className="w-4 h-4 mr-2" /> Metadata
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 bg-background flex flex-col overflow-hidden">
                        <ScrollArea className="flex-1 p-6">
                            <TabsContent value="contents" className="m-0 h-full">
                                <CompilerContents 
                                    nodes={nodes} 
                                    includedIds={settings.includedNodeIds}
                                    onChange={(newSet) => updateSetting('includedNodeIds', newSet)}
                                />
                            </TabsContent>
                            <TabsContent value="separators" className="m-0 h-full">
                                <CompilerSeparators 
                                    separators={settings.separators}
                                    onChange={(newSeps) => updateSetting('separators', newSeps)}
                                />
                            </TabsContent>
                             <TabsContent value="formatting" className="m-0 h-full">
                                <CompilerFormatting 
                                    formatting={settings.formatting}
                                    onChange={(newFmt) => updateSetting('formatting', newFmt)}
                                />
                            </TabsContent>
                            <TabsContent value="metadata" className="m-0 h-full space-y-6">
                                <div className="grid gap-4 max-w-md">
                                    <div className="grid gap-2">
                                        <Label>Project Title</Label>
                                        <Input 
                                            value={settings.metadata.title}
                                            onChange={(e) => updateSetting("metadata", { ...settings.metadata, title: e.target.value })}
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Author</Label>
                                        <Input 
                                            value={settings.metadata.author}
                                            onChange={(e) => updateSetting("metadata", { ...settings.metadata, author: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </TabsContent>
                        </ScrollArea>
                    </div>
                </div>
                
                {/* Footer Controls */}
                <div className="p-4 border-t border-border bg-muted/20 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3">
                        <Label>Export Format:</Label>
                        <Select 
                            value={settings.format} 
                            onValueChange={(v: ExportFormat) => updateSetting("format", v)}
                        >
                            <SelectTrigger className="w-32 h-8">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="docx">Word (.docx)</SelectItem>
                                <SelectItem value="pdf">PDF (.pdf)</SelectItem>
                                <SelectItem value="md">Markdown (.md)</SelectItem>
                                <SelectItem value="html">HTML (.html)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex items-center gap-2">
                         <div className="text-xs text-muted-foreground mr-4">
                            {settings.includedNodeIds.size} items selected
                        </div>
                        <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                        <Button onClick={handleCompile} disabled={isCompiling}>
                            {isCompiling ? "Exporting..." : "Compile"}
                        </Button>
                    </div>
                </div>
            </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}

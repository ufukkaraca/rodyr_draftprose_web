import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Download, FileText, Settings, ListChecks, FileType, LayoutTemplate, X } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CompileContents } from "./CompileContents";
import { CompileSettings, CompileFormatting } from "./CompileSettings";
import { CompileSeparators, CompileSeparatorsConfig } from "./CompileSeparators";
import { CompilePreview } from "./CompilePreview";
import { useProjectStore } from "../../store/useProjectStore";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { compileProject } from "./CompileEngine";
import { cn } from "@/lib/utils";

export function CompileDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  console.log("CompileDialog Rendered. Open:", open);
  const { nodes } = useProjectStore();
  
  // State: Tab Selection (Replacing Tabs component for stability)
  const [activeTab, setActiveTab] = useState("formatting");

  // State: Selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  // State: Separators
  const [separators, setSeparators] = useState<CompileSeparatorsConfig>({
      folderSeparator: 'page_break',
      textSeparator: 'custom',
      customTextSeparator: '* * *'
  });
  
  // State: Formatting
  const [format, setFormat] = useState<CompileFormatting>({
      preset: 'manuscript',
      font: 'Courier Prime',
      size: '12',
      lineHeight: '2.0',
      removeComments: true
  });
  
  // State: Export Type
  const [exportFormat, setExportFormat] = useState('docx');
  const [isCompiling, setIsCompiling] = useState(false);

  // Initialize selection when nodes load (Check all by default)
  useEffect(() => {
      if (open && nodes && selectedIds.size === 0) {
          const allIds = new Set(Object.keys(nodes).filter(id => id !== 'trash'));
          setSelectedIds(allIds);
      }
  }, [open, nodes]);

  const toggleNode = (id: string, checked: boolean) => {
      const next = new Set(selectedIds);
      if (checked) next.add(id);
      else next.delete(id);
      setSelectedIds(next);
  };

  const toggleAll = (checked: boolean) => {
      if (checked) {
          const allIds = new Set(Object.keys(nodes).filter(id => id !== 'trash'));
          setSelectedIds(allIds);
      } else {
          setSelectedIds(new Set());
      }
  };

  const handleCompile = async () => {
    setIsCompiling(true);
    try {
        await compileProject(
            selectedIds, 
            format,
            separators,
            exportFormat
        );
        onOpenChange(false);
    } catch (error) {
        console.error("Compilation failed:", error);
    } finally {
        setIsCompiling(false);
    }
  };

  // Helper to render sidebar buttons
  const TabButton = ({ id, icon: Icon, label }: { id: string, icon: any, label: string }) => (
    <Button 
        variant={activeTab === id ? "secondary" : "ghost"} 
        className={cn(
            "w-full justify-start gap-3 px-3 py-2 text-sm font-medium transition-all mb-1",
            activeTab === id ? "bg-background shadow-sm hover:bg-background/80" : "text-muted-foreground hover:bg-muted/50"
        )}
        onClick={() => setActiveTab(id)}
    >
        <Icon className="h-4 w-4" />
        {label}
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[98vw] w-[1400px] min-w-[1000px] h-[90vh] p-0 border-none shadow-2xl bg-background/95 backdrop-blur-xl rounded-xl overflow-hidden flex flex-col">
        
        <div className="flex flex-row h-full w-full overflow-hidden">
            
            {/* COLUMN 1: Sidebar Navigation */}
            <div className="w-[220px] flex-none flex flex-col h-full bg-muted/30 border-r">
                <div className="p-6 pb-2">
                    <h2 className="text-lg font-semibold tracking-tight">Compilation</h2>
                    <p className="text-xs text-muted-foreground">Export your manuscript</p>
                </div>
                
                <div className="flex flex-col p-3 w-full">
                    <p className="text-xs font-semibold text-muted-foreground/50 uppercase tracking-wider mb-2 px-3">Configuration</p>
                    <TabButton id="contents" icon={ListChecks} label="Contents" />
                    <TabButton id="formatting" icon={FileType} label="Formatting" />
                    <TabButton id="separators" icon={LayoutTemplate} label="Separators" />
                    <TabButton id="metadata" icon={FileText} label="Metadata" />
                </div>

                <div className="mt-auto p-4 border-t">
                     <div className="grid gap-2">
                        <Label className="text-xs font-semibold uppercase text-muted-foreground/70">Export Format</Label>
                        <Select value={exportFormat} onValueChange={setExportFormat}>
                            <SelectTrigger className="w-full bg-background">
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
                </div>
            </div>

            {/* COLUMN 2: Configuration Area */}
            <div className="flex-1 min-w-0 bg-background relative flex flex-col h-full overflow-hidden">
                <div className="absolute top-4 right-4 z-10">
                     <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)} className="h-8 w-8 rounded-full hover:bg-muted">
                        <X className="h-4 w-4" />
                     </Button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 relative">
                     {activeTab === 'contents' && (
                        <div className="max-w-3xl mx-auto">
                             <h3 className="text-xl font-semibold mb-6">Select Content</h3>
                             <CompileContents 
                                selectedIds={selectedIds} 
                                onToggle={toggleNode} 
                                onToggleAll={toggleAll} 
                            />
                        </div>
                     )}
                    
                     {activeTab === 'separators' && (
                        <div className="max-w-2xl mx-auto">
                             <h3 className="text-xl font-semibold mb-6">Separators</h3>
                             <CompileSeparators settings={separators} onChange={setSeparators} />
                        </div>
                     )}

                     {activeTab === 'formatting' && (
                        <div className="max-w-2xl mx-auto">
                             <h3 className="text-xl font-semibold mb-6">Formatting</h3>
                             <CompileSettings settings={format} onChange={setFormat} />
                        </div>
                     )}

                     {activeTab === 'metadata' && (
                        <div className="max-w-2xl mx-auto">
                             <h3 className="text-xl font-semibold mb-6">Metadata</h3>
                             <div className="flex items-center justify-center p-12 text-muted-foreground border-2 border-dashed rounded-lg bg-muted/20">
                                Metadata Inputs Coming Soon
                            </div>
                        </div>
                     )}
                </div>

                {/* Footer Action */}
                <div className="p-6 border-t bg-background/50 backdrop-blur sticky bottom-0 flex justify-end z-20">
                    <Button 
                        size="lg" 
                        onClick={handleCompile} 
                        disabled={isCompiling}
                        className="w-full sm:w-auto shadow-lg bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-8"
                    >
                        {isCompiling ? (
                            <span className="flex items-center gap-2">Generating...</span>
                        ) : (
                            <span className="flex items-center gap-2">
                                <Download className="h-4 w-4" />
                                Compile Manuscript
                            </span>
                        )}
                    </Button>
                </div>
            </div>

            {/* COLUMN 3: Live Preview */}
            <div className="w-[300px] flex-none bg-muted/30 border-l relative h-full overflow-hidden hidden lg:block">
                <CompilePreview 
                    selectedIds={selectedIds}
                    format={format}
                    separators={separators}
                />
            </div>

        </div>
      </DialogContent>
    </Dialog>
  );
}

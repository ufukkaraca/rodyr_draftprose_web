
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import { Folders, FileText, Minus, Scissors, Hash } from "lucide-react";

export interface CompileSeparatorsConfig {
    folderSeparator: 'page_break' | 'empty_line' | 'none';
    textSeparator: 'page_break' | 'empty_line' | 'custom' | 'none';
    customTextSeparator: string;
}

interface CompileSeparatorsProps {
    settings: CompileSeparatorsConfig;
    onChange: (settings: CompileSeparatorsConfig) => void;
}

export function CompileSeparators({ settings, onChange }: CompileSeparatorsProps) {

    const update = (key: keyof CompileSeparatorsConfig, value: any) => {
        onChange({ ...settings, [key]: value });
    };

    return (
        <div className="space-y-10 animate-in fade-in-50 duration-500">
            
            {/* Folder Separators */}
            <div className="space-y-4">
                 <div className="flex items-center gap-2 mb-2">
                    <Folders className="w-5 h-5 text-primary" />
                    <Label className="text-base font-semibold">Folder Transitions</Label>
                 </div>
                 <p className="text-sm text-muted-foreground mb-4">
                    How should the compiler handle transitions between folders and their content (e.g., Chapters)?
                 </p>
                 
                 <div className="grid grid-cols-3 gap-4">
                    <SeparatorOption 
                        label="Page Break"
                        icon={<Scissors className="w-5 h-5" />}
                        description="Start on a new page."
                        active={settings.folderSeparator === 'page_break'}
                        onClick={() => update('folderSeparator', 'page_break')}
                    />
                    <SeparatorOption 
                        label="Empty Line"
                        icon={<Minus className="w-5 h-5" />}
                        description="Just some whitespace."
                        active={settings.folderSeparator === 'empty_line'}
                        onClick={() => update('folderSeparator', 'empty_line')}
                    />
                     <SeparatorOption 
                        label="None"
                        icon={<span className="text-xs font-mono">None</span>}
                        description="Run-on text."
                        active={settings.folderSeparator === 'none'}
                        onClick={() => update('folderSeparator', 'none')}
                    />
                 </div>
            </div>

            <div className="h-px bg-border/50" />

            {/* Text Separators */}
            <div className="space-y-4">
                 <div className="flex items-center gap-2 mb-2">
                    <FileText className="w-5 h-5 text-primary" />
                    <Label className="text-base font-semibold">Text Document Transitions</Label>
                 </div>
                 <p className="text-sm text-muted-foreground mb-4">
                    How should the compiler handle transitions between scene files?
                 </p>
                 
                 <div className="grid grid-cols-2 gap-4">
                    <SeparatorOption 
                        label="Page Break"
                        icon={<Scissors className="w-5 h-5" />}
                        description="Start scenes on new pages."
                        active={settings.textSeparator === 'page_break'}
                        onClick={() => update('textSeparator', 'page_break')}
                    />
                    <SeparatorOption 
                        label="Empty Line"
                        icon={<Minus className="w-5 h-5" />}
                        description="Standard scene break."
                        active={settings.textSeparator === 'empty_line'}
                        onClick={() => update('textSeparator', 'empty_line')}
                    />
                    <SeparatorOption 
                        label="Custom Text"
                        icon={<Hash className="w-5 h-5" />}
                        description="Insert custom symbols."
                        active={settings.textSeparator === 'custom'}
                        onClick={() => update('textSeparator', 'custom')}
                    />
                     <SeparatorOption 
                        label="None"
                        icon={<span className="text-xs font-mono">None</span>}
                        description="Continuous text."
                        active={settings.textSeparator === 'none'}
                        onClick={() => update('textSeparator', 'none')}
                    />
                 </div>

                 {settings.textSeparator === 'custom' && (
                     <div className="mt-4 p-4 bg-muted/30 rounded-lg border border-dashed animate-in slide-in-from-top-2">
                        <Label className="mb-2 block">Custom Separator Text</Label>
                        <Input 
                            value={settings.customTextSeparator} 
                            onChange={(e) => update('customTextSeparator', e.target.value)}
                            className="font-mono text-center tracking-widest"
                        />
                     </div>
                 )}
            </div>
        </div>
    );
}

function SeparatorOption({ label, icon, description, active, onClick }: { label: string, icon: React.ReactNode, description: string, active: boolean, onClick: () => void }) {
    return (
        <div 
            onClick={onClick}
            className={cn(
                "cursor-pointer p-4 rounded-xl border-2 transition-all duration-200 hover:bg-muted/30 flex flex-col items-center text-center gap-3",
                active ? "border-primary bg-primary/5 shadow-md" : "border-transparent bg-muted/20 hover:border-border"
            )}
        >
            <div className={cn(
                "h-10 w-10 rounded-full flex items-center justify-center transition-colors",
                active ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground shadow-sm"
            )}>
                {icon}
            </div>
            <div>
                <div className="font-semibold text-sm">{label}</div>
                <div className="text-[10px] text-muted-foreground mt-1">{description}</div>
            </div>
        </div>
    );
}


import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlignJustify, AlignLeft, Info, Type } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CompileFormatting {
    preset: 'manuscript' | 'ebook' | 'proof';
    font: string;
    size: string; // "12"
    lineHeight: string; // "2.0"
    removeComments: boolean;
}

interface CompileSettingsProps {
    settings: CompileFormatting;
    onChange: (settings: CompileFormatting) => void;
}

export function CompileSettings({ settings, onChange }: CompileSettingsProps) {

    const update = (key: keyof CompileFormatting, value: any) => {
        onChange({ ...settings, [key]: value });
    };

    const handlePresetChange = (preset: 'manuscript' | 'ebook' | 'proof') => {
        let newSettings: Partial<CompileFormatting> = { preset };
        if (preset === 'manuscript') {
            newSettings = { ...newSettings, font: 'Courier Prime', size: '12', lineHeight: '2.0' };
        } else if (preset === 'ebook') {
            newSettings = { ...newSettings, font: 'Times New Roman', size: '12', lineHeight: '1.5' };
        } else if (preset === 'proof') {
             newSettings = { ...newSettings, font: 'Inter', size: '10', lineHeight: '1.2' };
        }
        onChange({ ...settings, ...newSettings });
    };

    return (
        <div className="space-y-8 animate-in fade-in-50 duration-500">
            
            {/* Presets Section */}
            <div className="space-y-4">
                <Label className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Presets</Label>
                <div className="grid grid-cols-3 gap-4">
                    <PresetCard 
                         title="Standard Manuscript" 
                         description="Industry standard submission format."
                         active={settings.preset === 'manuscript'}
                         onClick={() => handlePresetChange('manuscript')}
                    />
                    <PresetCard 
                         title="Modern Ebook" 
                         description="Reflowable text optimized for screens."
                         active={settings.preset === 'ebook'}
                         onClick={() => handlePresetChange('ebook')}
                    />
                    <PresetCard 
                         title="Proof Copy" 
                         description="Compact layout for editing."
                         active={settings.preset === 'proof'}
                         onClick={() => handlePresetChange('proof')}
                    />
                </div>
            </div>

            <div className="h-px bg-border/50" />

            {/* Typography Section */}
            <div className="space-y-6">
                <Label className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Typography</Label>
                
                <div className="grid grid-cols-2 gap-6">
                    {/* Font Family */}
                    <div className="space-y-3">
                         <Label>Font Family</Label>
                         <Select value={settings.font} onValueChange={(v) => update('font', v)}>
                            <SelectTrigger className="h-10">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Courier Prime" className="font-mono">Courier Prime</SelectItem>
                                <SelectItem value="Times New Roman" className="font-serif">Times New Roman</SelectItem>
                                <SelectItem value="Inter" className="font-sans">Inter (Sans)</SelectItem>
                                <SelectItem value="Georgia" className="font-serif">Georgia</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Font Size */}
                    <div className="space-y-3">
                        <div className="flex justify-between">
                            <Label>Font Size</Label>
                            <span className="text-xs text-muted-foreground font-mono">{settings.size}pt</span>
                        </div>
                        <Slider 
                            value={[parseInt(settings.size)]} 
                            min={8} 
                            max={24} 
                            step={1} 
                            onValueChange={(vals) => update('size', vals[0].toString())} 
                            className="py-2"
                        />
                         <div className="flex justify-between text-[10px] text-muted-foreground px-1">
                            <span>8pt</span>
                            <span>24pt</span>
                        </div>
                    </div>
                </div>

                {/* Line Height */}
                <div className="space-y-3">
                    <Label>Line Spacing</Label>
                    <div className="flex bg-muted/30 p-1 rounded-lg border">
                         {[
                            { val: '1.0', label: 'Single', icon: AlignJustify },
                            { val: '1.5', label: '1.5', icon: AlignLeft },
                            { val: '2.0', label: 'Double', icon: AlignJustify }
                         ].map(opt => (
                             <button
                                key={opt.val}
                                onClick={() => update('lineHeight', opt.val)}
                                className={cn(
                                    "flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all",
                                    settings.lineHeight === opt.val 
                                        ? "bg-background shadow-sm text-foreground ring-1 ring-border" 
                                        : "text-muted-foreground hover:bg-muted/50"
                                )}
                             >
                                <opt.icon className="w-4 h-4" />
                                {opt.label}
                             </button>
                         ))}
                    </div>
                </div>
            </div>

            <div className="h-px bg-border/50" />

            {/* Options */}
             <div className="space-y-4">
                <Label className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Cleanup</Label>
                <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/10">
                    <div className="space-y-0.5">
                        <Label className="text-base">Remove Comments</Label>
                        <p className="text-sm text-muted-foreground">Strip all comments and inline notes from output.</p>
                    </div>
                    <Switch 
                        checked={settings.removeComments} 
                        onCheckedChange={(c) => update('removeComments', c)}
                    />
                </div>
            </div>

        </div>
    );
}

function PresetCard({ title, description, active, onClick }: { title: string, description: string, active: boolean, onClick: () => void }) {
    return (
        <div 
            onClick={onClick}
            className={cn(
                "cursor-pointer p-4 rounded-xl border-2 transition-all duration-200 hover:bg-muted/30 active:scale-95",
                active ? "border-primary bg-primary/5 shadow-md" : "border-transparent bg-muted/20 hover:border-border"
            )}
        >
            <div className="flex items-start justify-between mb-2">
                 <div className={cn("p-2 rounded-full", active ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground")}>
                    <Type className="w-4 h-4" />
                 </div>
                 {active && <div className="h-2 w-2 rounded-full bg-primary" />}
            </div>
            <h4 className="font-semibold text-sm mb-1">{title}</h4>
            <p className="text-xs text-muted-foreground leading-snug">{description}</p>
        </div>
    );
}


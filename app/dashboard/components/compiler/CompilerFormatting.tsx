
import React from "react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface CompilerFormattingProps {
  formatting: {
    font: string;
    fontSize: number;
    override: boolean;
  };
  onChange: (val: any) => void;
}

export function CompilerFormatting({ formatting, onChange }: CompilerFormattingProps) {
    return (
        <div className="space-y-6 max-w-md">
            <div className="flex items-center justify-between space-x-2 border-b border-border pb-4">
                <div className="space-y-1">
                    <Label className="text-base">Override Formatting</Label>
                    <p className="text-xs text-muted-foreground">
                        Apply specific font settings to the output, ignoring editor styles.
                    </p>
                </div>
                <Switch 
                    checked={formatting.override}
                    onCheckedChange={(c) => onChange({ ...formatting, override: c })}
                />
            </div>

            <div className={`space-y-4 ${!formatting.override ? "opacity-50 pointer-events-none" : ""}`}>
                <div className="grid gap-2">
                    <Label>Font Family</Label>
                    <Select 
                        value={formatting.font}
                        onValueChange={(v) => onChange({ ...formatting, font: v })}
                    >
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                            <SelectItem value="Arial">Arial</SelectItem>
                            <SelectItem value="Courier New">Courier New (Manuscript)</SelectItem>
                            <SelectItem value="Georgia">Georgia</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="grid gap-2">
                    <Label>Font Size (pt)</Label>
                     <Select 
                        value={formatting.fontSize.toString()}
                        onValueChange={(v) => onChange({ ...formatting, fontSize: parseInt(v) })}
                    >
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="10">10pt</SelectItem>
                            <SelectItem value="11">11pt</SelectItem>
                            <SelectItem value="12">12pt (Standard)</SelectItem>
                            <SelectItem value="14">14pt</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
            
             <div className="bg-muted/30 p-4 rounded-md border border-border mt-8">
                 <p className="text-sm font-semibold mb-2">Preview:</p>
                 <div style={{ fontFamily: formatting.font, fontSize: `${formatting.fontSize}pt` }} className="bg-background border p-4 shadow-sm min-h-[100px]">
                    The quick brown fox jumps over the lazy dog.
                    <br/>
                    <br/>
                    Chapter One
                 </div>
             </div>
        </div>
    );
}

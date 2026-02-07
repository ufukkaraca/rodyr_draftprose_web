
import React from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

interface CompilerSeparatorsProps {
  separators: {
    folderToText: string;
    textToText: string;
  };
  onChange: (val: any) => void;
}

export function CompilerSeparators({ separators, onChange }: CompilerSeparatorsProps) {
    return (
        <div className="space-y-6 max-w-md">
            <div className="space-y-4">
                <div className="space-y-1">
                     <Label className="text-base">Folder Separators</Label>
                     <p className="text-xs text-muted-foreground">What happens when a Folder (e.g. Chapter) starts?</p>
                </div>
                
                 <div className="grid gap-2">
                    <Label>Before Folder</Label>
                    <Select 
                        value={separators.folderToText}
                        onValueChange={(v) => onChange({ ...separators, folderToText: v })}
                    >
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="page_break">Page Break</SelectItem>
                            <SelectItem value="empty_line">Empty Line</SelectItem>
                            <SelectItem value="none">Standard Flow</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <Separator />

            <div className="space-y-4">
                <div className="space-y-1">
                     <Label className="text-base">Text Separators</Label>
                     <p className="text-xs text-muted-foreground">Separator between scenes (Text documents).</p>
                </div>
                
                 <div className="grid gap-2">
                    <Label>Between Text Documents</Label>
                    <Select 
                        value={separators.textToText}
                        onValueChange={(v) => onChange({ ...separators, textToText: v })}
                    >
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="empty_line">Empty Line</SelectItem>
                            <SelectItem value="asterism">Asterism (* * *)</SelectItem>
                            <SelectItem value="page_break">Page Break</SelectItem>
                            <SelectItem value="none">No Separator (Continuous)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
        </div>
    );
}

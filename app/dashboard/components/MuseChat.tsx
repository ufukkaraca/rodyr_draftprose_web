
"use client";

import React, { useRef, useEffect, useState, useMemo } from "react";
import { useProjectStore, BinderNode } from "@/app/dashboard/store/useProjectStore";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Send, Sparkles, Bot, User as UserIcon, Mic } from "lucide-react";
import { cn } from "@/lib/utils";

type Message = {
    id: string;
    role: 'user' | 'assistant';
    content: string;
};

type Persona = {
    id: string;
    name: string;
    type: 'muse' | 'character';
    content?: string; // Character sheet content
};

export function MuseChat() {
  const activeNodeId = useProjectStore((state) => state.activeNodeId);
  const nodes = useProjectStore((state) => state.nodes);
  const content = useProjectStore((state) => state.content);

  const activeNode = activeNodeId ? nodes[activeNodeId] : null;
  const activeContent = activeNodeId ? content[activeNodeId] : "";

  // State
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPersonaId, setSelectedPersonaId] = useState<string>("muse");

  const scrollRef = useRef<HTMLDivElement>(null);

  // Derived: Find potential characters (children of "Characters" folder or just all files for now?)
  // For MVP, let's assume any file under the "id: characters" folder is a character.
  // We need to traverse or just look at flat list if we had parentId map.
  // useProjectStore stores flat `nodes`.
  const personas: Persona[] = useMemo(() => {
     const list: Persona[] = [{ id: 'muse', name: 'Muse (Editor)', type: 'muse' }];
     
     // Find "Characters" folder
     // This is a naive check. In a real app we'd verify the folder path.
     // But we know we seeded "characters" folder with id="characters".
     
     Object.values(nodes).forEach(node => {
         if (node.parentId === 'characters' && node.type === 'file') {
             list.push({
                 id: node.id,
                 name: node.title,
                 type: 'character',
                 content: content[node.id] || ""
             });
         }
     });
     
     return list;
  }, [nodes, content]);

  const activePersona = personas.find(p => p.id === selectedPersonaId) || personas[0];

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { id: Date.now().toString(), role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
        const payload = {
            messages: [...messages, userMessage], // Send history
            activeNodeTitle: activeNode?.title || "Untitled",
            projectTitle: "DraftProse Project",
            context: activeContent.slice(0, 5000),
            persona: activePersona
        };

        const response = await fetch("/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        if (!response.body) throw new Error("No response body");

        // Stream handling
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        
        // Add placeholder assistant message
        const assistantId = (Date.now() + 1).toString();
        setMessages(prev => [...prev, { id: assistantId, role: 'assistant', content: '' }]);

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value, { stream: true });
            
            setMessages(prev => prev.map(m => 
                m.id === assistantId ? { ...m, content: m.content + chunk } : m
            ));
        }

    } catch (err) {
        console.error("Chat error:", err);
        setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: "[Error: Unable to reach Muse]" }]);
    } finally {
        setIsLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-full bg-sidebar/50">
      {/* Header */}
      <div className="p-4 border-b border-sidebar-border bg-sidebar shrink-0 space-y-3">
        <div className="flex items-center justify-between">
             <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-500" />
                <span className="font-mono text-xs font-bold uppercase tracking-wider">Muse Assistant</span>
            </div>
            {/* Persona Selector */}
            <Select value={selectedPersonaId} onValueChange={setSelectedPersonaId}>
                <SelectTrigger className="h-6 text-[10px] w-[120px]">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    {personas.map(p => (
                        <SelectItem key={p.id} value={p.id}>
                            {p.name}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
        
        {activeNode && (
           <div className="text-[10px] text-muted-foreground mt-1 truncate flex items-center gap-1">
              <span className="opacity-50">Context:</span> {activeNode.title}
           </div>
        )}
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
            {messages.length === 0 && (
                <div className="text-center text-xs text-muted-foreground mt-10">
                    <p>I am {activePersona.name}.</p>
                    {activePersona.type === 'muse' 
                        ? <p>I can read your current document and help you write.</p>
                        : <p>I am ready for our interview.</p>
                    }
                </div>
            )}
            
            {messages.map(m => (
                <div key={m.id} className={cn("flex gap-3 text-sm", m.role === 'user' ? "justify-end" : "justify-start")}>
                    {m.role === 'assistant' && (
                        <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center shrink-0">
                            <Bot className="w-3.5 h-3.5 text-purple-600" />
                        </div>
                    )}
                    <div className={cn(
                        "rounded-lg p-3 max-w-[85%]",
                        m.role === 'user' 
                            ? "bg-primary text-primary-foreground" 
                            : "bg-muted/50 border border-border"
                    )}>
                        <p className="whitespace-pre-wrap leading-relaxed">{m.content}</p>
                    </div>
                </div>
            ))}
            {isLoading && (
                 <div className="flex gap-3 text-sm justify-start">
                    <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center shrink-0 animate-pulse">
                         <Bot className="w-3.5 h-3.5 text-purple-600" />
                    </div>
                    <div className="bg-muted/50 border border-border rounded-lg p-3">
                        <span className="flex gap-1">
                            <span className="w-1.5 h-1.5 bg-foreground/30 rounded-full animate-bounce" />
                            <span className="w-1.5 h-1.5 bg-foreground/30 rounded-full animate-bounce delay-75" />
                            <span className="w-1.5 h-1.5 bg-foreground/30 rounded-full animate-bounce delay-150" />
                        </span>
                    </div>
                 </div>
            )}
            <div ref={scrollRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-3 border-t border-sidebar-border bg-sidebar shrink-0">
        <form onSubmit={handleSubmit} className="flex gap-2">
            <Input 
                value={input} 
                onChange={(e) => setInput(e.target.value)} 
                placeholder={`Ask ${activePersona.name}...`} 
                className="flex-1 h-9 text-xs"
            />
            <Button type="submit" size="icon" className="h-9 w-9" disabled={isLoading}>
                <Send className="w-3.5 h-3.5" />
            </Button>
        </form>
      </div>
    </div>
  );
}

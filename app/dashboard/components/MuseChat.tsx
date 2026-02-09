"use client";

import React, { useRef, useEffect, useState, useMemo, useCallback } from "react";
import { useProjectStore, BinderNode } from "@/app/dashboard/store/useProjectStore";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Send, Sparkles, Bot, User as UserIcon, Mic } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Loader2, TrendingUp, User, MapPin, Lightbulb } from "lucide-react";

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

type InsightsData = {
    pacing: string;
    tone: string;
    sentiment: string;
    keyEntities: string[];
    suggestions: string[];
};

export function MuseChat() {
  const activeNodeId = useProjectStore((state) => state.activeNodeId);
  const nodes = useProjectStore((state) => state.nodes);
  const content = useProjectStore((state) => state.content);

  const activeNode = activeNodeId ? nodes[activeNodeId] : null;
  const activeContent = activeNodeId ? content[activeNodeId] : "";

  // Chat State
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPersonaId, setSelectedPersonaId] = useState<string>("muse");
  
  // Insights State
  const [insights, setInsights] = useState<InsightsData | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);

  // ... (Personas Logic - Keep as is) ...
  const personas: Persona[] = useMemo(() => {
     const list: Persona[] = [{ id: 'muse', name: 'Muse (Editor)', type: 'muse' }];
     Object.values(nodes).forEach(node => {
         if (node.parentId === 'characters' && node.type === 'file') {
             list.push({ id: node.id, name: node.title, type: 'character', content: content[node.id] || "" });
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
            messages: [...messages, userMessage],
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

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        
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

  // Track active tab to trigger analysis
  const [activeTab, setActiveTab] = useState("chat");

  const handleAnalyze = useCallback(async () => {
      if (!activeContent || isAnalyzing) return;
      
      // If we already have insights for this content/node, don't re-fetch unless forced?
      // For now, let's just fetch if it's null (first entry) or explicit refresh
      if (insights) return;

      setIsAnalyzing(true);
      setInsights(null);

      try {
          const res = await fetch('/api/muse/insights', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ text: activeContent, context: activeNode?.synopsis })
          });
          const data = await res.json();
          if (data.error) throw new Error(data.error);
          setInsights(data);
      } catch (e) {
          console.error(e);
      } finally {
          setIsAnalyzing(false);
      }
  }, [activeContent, activeNode?.synopsis, isAnalyzing, insights]);

  // Clear insights when node changes
  useEffect(() => {
      setInsights(null);
  }, [activeNodeId]);

  // Auto-Analyze when entering tab
  useEffect(() => {
      if (activeTab === 'insights' && !insights && !isAnalyzing && activeContent) {
          handleAnalyze();
      }
  }, [activeTab, insights, isAnalyzing, activeContent, handleAnalyze]);

  return (
    <div className="flex flex-col h-full bg-sidebar/30">
        <Tabs defaultValue="chat" className="flex flex-col h-full" onValueChange={setActiveTab}>
            {/* Header / Tabs List */}
            <div className="p-4 border-b border-sidebar-border bg-sidebar shrink-0 space-y-3">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-purple-500" />
                        <span className="font-mono text-xs font-bold uppercase tracking-wider">Muse Assistant</span>
                    </div>
                    {/* Persona Selector only relevant for Chat currently, but kept here for layout */}
                     <Select value={selectedPersonaId} onValueChange={setSelectedPersonaId}>
                        <SelectTrigger className="h-6 text-[10px] w-[120px]">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {personas.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                
                <TabsList className="w-full grid grid-cols-2 h-8">
                    <TabsTrigger value="chat" className="text-xs">Chat</TabsTrigger>
                    <TabsTrigger value="insights" className="text-xs">Insights</TabsTrigger>
                </TabsList>

                 {activeNode && (
                    <div className="text-[10px] text-muted-foreground mt-1 truncate flex items-center gap-1">
                        <span className="opacity-50">Context:</span> {activeNode.title}
                    </div>
                )}
            </div>

            {/* Content Area */}
            <div className="flex-1 min-h-0 relative">
                <TabsContent value="chat" className="h-full flex flex-col m-0 data-[state=inactive]:hidden">
                      {/* Messages */}
                      <div className="flex-1 min-h-0"> 
                          <ScrollArea className="h-full">
                            <div className="p-4 space-y-4">
                                {messages.length === 0 && (
                                    <div className="text-center text-xs text-muted-foreground mt-10">
                                        <p>I am {activePersona.name}.</p>
                                        {activePersona.type === 'muse' 
                                            ? <p>I can help you brainstorm and draft.</p>
                                            : <p>Interview me about my backstory.</p>
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
                                            "rounded-lg p-3 max-w-[90%]",
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
                      </div>

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
                </TabsContent>

                <TabsContent value="insights" className="h-full flex flex-col m-0 p-4 data-[state=inactive]:hidden overflow-y-auto">
                    {!activeContent ? (
                        <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-4">
                            <Lightbulb className="w-8 h-8 opacity-50" />
                            <p className="text-sm text-center">Open a document to see insights.</p>
                        </div>
                    ) : (isAnalyzing || !insights) ? (
                        <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-4">
                                <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
                                <p className="text-xs">Analyzing literary patterns...</p>
                        </div>
                    ) : null}

                    {insights && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                            {/* Pacing & Tone */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-muted/30 p-3 rounded-lg border border-border/50">
                                    <div className="flex items-center gap-2 mb-1 text-xs text-muted-foreground uppercase tracking-wide">
                                        <TrendingUp className="w-3 h-3" /> Pacing
                                    </div>
                                    <div className="font-semibold">{insights.pacing}</div>
                                </div>
                                <div className="bg-muted/30 p-3 rounded-lg border border-border/50">
                                    <div className="flex items-center gap-2 mb-1 text-xs text-muted-foreground uppercase tracking-wide">
                                        <Sparkles className="w-3 h-3" /> Tone
                                    </div>
                                    <div className="font-semibold text-sm line-clamp-2">{insights.tone}</div>
                                </div>
                            </div>

                            {/* Entities */}
                            <div>
                                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1">
                                    <User className="w-3 h-3" /> Key Entities
                                </h4>
                                <div className="flex flex-wrap gap-1">
                                    {insights.keyEntities?.map(entity => (
                                        <Badge key={entity} variant="outline" className="text-[10px] font-normal">
                                            {entity}
                                        </Badge>
                                    ))}
                                </div>
                            </div>

                            {/* Suggestions */}
                            <div>
                                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1">
                                    <Lightbulb className="w-3 h-3" /> Suggestions
                                </h4>
                                <ul className="space-y-2">
                                    {insights.suggestions?.map((suggestion, i) => (
                                        <li key={i} className="text-xs p-2 bg-yellow-500/10 border border-yellow-500/20 rounded text-yellow-700 dark:text-yellow-400 leading-snug">
                                            {suggestion}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            
                            <Button variant="outline" size="sm" className="w-full text-xs" onClick={() => { setInsights(null); handleAnalyze(); }}>
                                Refresh Analysis
                            </Button>
                        </div>
                    )}
                </TabsContent>
            </div>
        </Tabs>
    </div>
  );
}

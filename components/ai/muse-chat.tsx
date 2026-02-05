
"use client"
import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card"
import { Sparkles, Send } from "lucide-react"

type Role = 'user' | 'assistant'

interface Message {
    id: string
    role: Role
    content: string
}

export function MuseChat() {
  const [messages, setMessages] = React.useState<Message[]>([])
  const [input, setInput] = React.useState("")
  const [isLoading, setIsLoading] = React.useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
        id: Date.now().toString(),
        role: 'user',
        content: input
    }

    setMessages(prev => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    try {
        const response = await fetch("/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                messages: [...messages, userMessage].map(m => ({ 
                    role: m.role, 
                    content: m.content 
                }))
            })
        })

        if (!response.ok) throw new Error("Failed to send message")
        if (!response.body) return

        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        let assistantMessage = ""
        
        // Add placeholder assistant message
        const assistantMsgId = (Date.now() + 1).toString()
        setMessages(prev => [...prev, { id: assistantMsgId, role: 'assistant', content: "" }])

        while (true) {
            const { done, value } = await reader.read()
            if (done) break
            
            const chunk = decoder.decode(value, { stream: true })
            assistantMessage += chunk
            
            setMessages(prev => prev.map(m => 
                m.id === assistantMsgId ? { ...m, content: assistantMessage } : m
            ))
        }

    } catch (error) {
        console.error("Chat error:", error)
    } finally {
        setIsLoading(false)
    }
  }

  return (
    <Card className="h-full flex flex-col border-l border-white/10 rounded-none bg-black/20 backdrop-blur-md w-80 border-t-0 border-b-0 border-r-0 shadow-none">
      <CardHeader className="p-4 border-b border-white/10">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <Sparkles className="h-4 w-4 text-purple-400" />
          MuseChat (Google Native)
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 p-0 overflow-hidden relative">
        <ScrollArea className="h-full p-4">
          {messages.length === 0 && (
             <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 mt-20">
                <Sparkles className="h-8 w-8 mb-2 opacity-50" />
                <p className="text-sm">Ask me anything via Gemini.</p>
             </div>
          )}
          {messages.map(m => (
            <div key={m.id} className={`mb-4 ${m.role === 'user' ? 'text-right' : 'text-left'}`}>
              <div className={`inline-block p-3 rounded-lg text-sm ${
                m.role === 'user' 
                  ? 'bg-purple-600/50 text-white' 
                  : 'bg-white/5 text-gray-200'
              }`}>
                {m.content}
              </div>
            </div>
          ))}
          {isLoading && messages[messages.length - 1]?.role === 'user' && (
              <div className="text-xs text-gray-500 animate-pulse ml-2">Muse is thinking...</div>
          )}
        </ScrollArea>
      </CardContent>
      <CardFooter className="p-4 border-t border-white/10">
        <form onSubmit={handleSubmit} className="flex gap-2 w-full">
          <Input 
            value={input} 
            onChange={(e) => setInput(e.target.value)} 
            placeholder="Ask Muse..." 
            className="bg-white/5 border-white/10 focus-visible:ring-purple-500"
            disabled={isLoading}
          />
          <Button type="submit" size="icon" variant="ghost" className="hover:bg-white/10" disabled={isLoading}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </CardFooter>
    </Card>
  )
}

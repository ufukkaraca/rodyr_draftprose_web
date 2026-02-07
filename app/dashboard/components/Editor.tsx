"use client"

import { useEffect } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Typography from '@tiptap/extension-typography'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useProjectStore } from '@/app/dashboard/store/useProjectStore'

export function Editor() {
  const activeNodeId = useProjectStore((state) => state.activeNodeId)
  const setContent = useProjectStore((state) => state.setContent)
  const nodes = useProjectStore((state) => state.nodes)
  
  // Get content for active node, or empty string
  const content = useProjectStore((state) => 
     activeNodeId ? state.content[activeNodeId] || '' : ''
  )
  const activeNode = activeNodeId ? nodes[activeNodeId] : null

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
         heading: {
             levels: [1, 2, 3]
         }
      }),
      Placeholder.configure({
        placeholder: 'Start writing...',
      }),
      Typography,
    ],
    editorProps: {
        attributes: {
            class: 'prose prose-lg dark:prose-invert max-w-none focus:outline-none min-h-[calc(100vh-200px)] font-writer font-normal leading-relaxed text-foreground',
        }
    },
    // We don't set initial content here because we manage it via useEffect for dynamic updates
    onCreate: ({ editor }) => {
        if (content) {
            editor.commands.setContent(content)
        }
    },
    onUpdate: ({ editor }) => {
        if (activeNodeId) {
            setContent(activeNodeId, editor.getHTML())
        }
    },
    immediatelyRender: false,
  })

  // Sync Content when Active Node Changes
  useEffect(() => {
    if (editor && activeNodeId) {
        // Only update if content is different to avoid cursor jumps?
        // Actually, replacing content usually resets cursor using simple Diff.
        // For MVP, simple setContent is fine, but checking against current HTML prevents loop
        const currentHTML = editor.getHTML();
        if (currentHTML !== content) {
            editor.commands.setContent(content)
        }
    } else if (editor && !activeNodeId) {
        editor.commands.clearContent()
    }
  }, [activeNodeId, content, editor])

  if (!editor) {
    return null
  }

  if (!activeNodeId) {
      return (
          <div className="flex-1 flex items-center justify-center text-muted-foreground font-mono text-sm">
              Select a document to start writing.
          </div>
      )
  }

  return (
    <div className="h-full flex flex-col bg-background relative group">
       {/* Minimal Toolbar (Visible on hover) */}
       <div className='absolute top-4 left-0 right-0 flex justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10'>
           <div className='bg-background/80 backdrop-blur border border-border shadow-sm rounded-full px-4 py-1 flex gap-2 text-xs font-mono text-muted-foreground'>
               <span>H1</span>
               <span>H2</span>
               <span>B</span>
               <span>I</span>
           </div>
       </div>

       {/* Editor Canvas */}
      <ScrollArea className="flex-1 h-full">
        <div className="max-w-2xl mx-auto py-16 px-8 min-h-full">
             {/* Dynamic Title from Metadata */}
             <div className="mb-8 border-b border-border/20 pb-4">
                 <h1 className="text-3xl font-bold font-serif text-foreground/90">
                     {activeNode?.title}
                 </h1>
             </div>
            <EditorContent editor={editor} />
        </div>
      </ScrollArea>
      
      {/* Footer / Word Count */}
      <div className='absolute bottom-4 right-8 text-xs font-mono text-muted-foreground opacity-50 hover:opacity-100 transition-opacity'>
          {editor.storage.characterCount?.words?.() || 0} Words
      </div>
    </div>
  )
}

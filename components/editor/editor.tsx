
"use client"

import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Typography from "@tiptap/extension-typography"
import Placeholder from "@tiptap/extension-placeholder"
import { Toggle } from "@/components/ui/toggle"
import { 
    Bold, 
    Italic, 
    List, 
    ListOrdered, 
    Heading1, 
    Heading2, 
    Quote 
} from "lucide-react"

export function Editor({ content = "", onChange }: { content?: string, onChange?: (html: string) => void }) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Typography,
      Placeholder.configure({
        placeholder: "Start writing...",
      }),
    ],
    content,
    editorProps: {
      attributes: {
        class: "prose prose-invert max-w-none focus:outline-none min-h-[500px] p-4",
      },
    },
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML())
    },
  })

  if (!editor) {
    return null
  }

  return (
    <div className="flex flex-col gap-2 w-full max-w-4xl mx-auto">
      <div className="flex items-center gap-1 border border-white/10 bg-white/5 rounded-md p-1 sticky top-0 z-10 backdrop-blur-md">
        <Toggle
          size="sm"
          pressed={editor.isActive("bold")}
          onPressedChange={() => editor.chain().focus().toggleBold().run()}
          aria-label="Toggle bold"
        >
          <Bold className="h-4 w-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive("italic")}
          onPressedChange={() => editor.chain().focus().toggleItalic().run()}
          aria-label="Toggle italic"
        >
          <Italic className="h-4 w-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive("heading", { level: 1 })}
          onPressedChange={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          aria-label="Toggle heading 1"
        >
          <Heading1 className="h-4 w-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive("heading", { level: 2 })}
          onPressedChange={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          aria-label="Toggle heading 2"
        >
          <Heading2 className="h-4 w-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive("bulletList")}
          onPressedChange={() => editor.chain().focus().toggleBulletList().run()}
          aria-label="Toggle bullet list"
        >
          <List className="h-4 w-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive("orderedList")}
          onPressedChange={() => editor.chain().focus().toggleOrderedList().run()}
          aria-label="Toggle ordered list"
        >
          <ListOrdered className="h-4 w-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive("blockquote")}
          onPressedChange={() => editor.chain().focus().toggleBlockquote().run()}
          aria-label="Toggle quote"
        >
            <Quote className="h-4 w-4" />
        </Toggle>
      </div>
      <div className="border border-white/10 rounded-md min-h-[600px] bg-black/20">
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}

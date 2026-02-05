
import { Editor } from "@/components/editor/editor"
import { MuseChat } from "@/components/ai/muse-chat"

export default function EditorPage() {
  return (
    <div className="flex h-screen overflow-hidden">
        <div className="flex-1 flex flex-col p-8 overflow-hidden">
            <div className="mb-6 flex justify-between items-center">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-300 bg-clip-text text-transparent">
                    Untitled Manuscript
                </h1>
                <span className="text-sm text-gray-400">Saving...</span>
            </div>
            <div className="flex-1 overflow-auto">
                <Editor content="<h2>Chapter 1</h2><p>Start writing here...</p>" />
            </div>
        </div>
        <MuseChat />
    </div>
  )
}

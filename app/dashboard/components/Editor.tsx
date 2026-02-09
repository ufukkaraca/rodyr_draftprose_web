

"use client"

import { useEffect, useRef, useState } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Typography from '@tiptap/extension-typography'
import TextAlign from '@tiptap/extension-text-align'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useProjectStore } from '@/app/dashboard/store/useProjectStore'
import { cn } from '@/lib/utils'
import { Columns, GalleryVerticalEnd, Maximize2, Split, AlignLeft, AlignCenter, AlignRight, AlignJustify, Sparkles } from 'lucide-react'

// --- Single Editor Component ---
interface SingleEditorProps {
    nodeId: string | null;
    isActivePane: boolean;
    onActivate: () => void;
    showFocusToggle?: boolean;
}

import BubbleMenuExtension from '@tiptap/extension-bubble-menu'
import { BubbleMenu } from '@tiptap/react/menus'
import { WarningMark } from './extensions/WarningMark'

// Utility for debouncing
function debounce<T extends (...args: any[]) => void>(func: T, wait: number) {
    let timeout: NodeJS.Timeout;
    return function(...args: Parameters<T>) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
}

    function SingleEditor({ nodeId, isActivePane, onActivate, showFocusToggle }: SingleEditorProps) {
        const setContent = useProjectStore((state) => state.setContent)
        const nodes = useProjectStore((state) => state.nodes)
        const contentMap = useProjectStore((state) => state.content)
        
        // Global Focus Mode (only affects UI when active pane)
        const toggleFocusMode = useProjectStore((state) => state.toggleFocusMode)
        const focusMode = useProjectStore((state) => state.focusMode)
        const content = nodeId ? contentMap[nodeId] || '' : '';
        const node = nodeId ? nodes[nodeId] : null;

        // Fact Check State
        const [factCheckResult, setFactCheckResult] = useState<{ verdict: string, explanation: string } | null>(null);
        const [isChecking, setIsChecking] = useState(false);

        // Proactive Guidance State
        const [isProactiveEnabled, setIsProactiveEnabled] = useState(true);

        const handleFactCheck = async () => { /* ... existing implementation ... */ };

        const editor = useEditor({
            extensions: [
                StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
                Placeholder.configure({ placeholder: 'Start writing...' }),
                Typography,
                TextAlign.configure({ types: ['heading', 'paragraph'] }),
                BubbleMenuExtension.configure({ pluginKey: 'bubbleMenu' }),
                WarningMark,
            ],
            editorProps: {
                attributes: {
                    class: 'prose prose-lg dark:prose-invert max-w-none focus:outline-none min-h-[calc(100vh-200px)] font-writer font-normal leading-relaxed text-foreground',
                }
            },
            onUpdate: ({ editor }) => {
                if (nodeId) setContent(nodeId, editor.getHTML())
            },
            immediatelyRender: false,
        })

        // Proactive Guidance Logic
        useEffect(() => {
            if (!editor || !isActivePane || !nodeId || !isProactiveEnabled) return;

            const runCheck = debounce(async () => {
                const text = editor.getText();
                if (!text || text.length < 50) return;

                try {
                    const res = await fetch('/api/muse/proactive', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ text, context: node?.synopsis })
                    });
                    const data = await res.json();

                    if (data.issues && editor && !editor.isDestroyed) {
                        const { tr } = editor.state;
                        const schema = editor.state.schema;
                        
                        // 1. Clear existing warningMarks
                        editor.state.doc.descendants((node, pos) => {
                            if (node.marks && node.marks.find(m => m.type.name === 'warningMark')) {
                                tr.removeMark(pos, pos + node.nodeSize, schema.marks.warningMark);
                            }
                        });

                        // 2. Add new marks
                        data.issues.forEach((issue: any) => {
                            // Find all occurrences of the quote
                            // Simple substring search for MVP
                            // Logic: Iterate through text nodes to find matches? 
                            // Or use Search logic. 
                            // Simplest: string index matching on editor.getText().
                            // Note: editor.getText() aligns roughly with doc positions but block separators differ (1 vs 2 chars).
                            // A better approximation for MVP:
                            
                            const fullText = editor.getText();
                            let startIndex = fullText.indexOf(issue.quote);
                            
                            // Prevent infinite loops if multiple same quotes, find just first for now
                            if (startIndex !== -1) {
                                // Convert plain text index to Prosemirror position
                                // This is hard without mapping.
                                // Fallback: Just mark current selection for testing?
                                // No, that's bad.
                                
                                // Let's try Tiptap's setTextSelection with index?
                                // editor.chain().setTextSelection({ from: startIndex + 1, to: startIndex + 1 + issue.quote.length }).setWarningMark(...).run()
                                // But we don't want to move cursor.
                                
                                // We will rely on `tr.addMark` using `startIndex + 1` (ProseMirror starts at 1 usually).
                                // This might be off by the number of block nodes before it.
                                // For an MVP, meaningful functionality > perfect precision.
                                // NOTE: This alignment issue is significant.
                                // Alternative: Send `from`/`to` from backend? No, backend doesn't know topology.
                                
                                // Correct way: Scan the document nodes.
                                let pos = 0;
                                editor.state.doc.descendants((node, nodePos) => {
                                    if (node.isText) {
                                        const nodeText = node.text!;
                                        const quoteIndex = nodeText.indexOf(issue.quote);
                                        if (quoteIndex !== -1) {
                                            const from = nodePos + quoteIndex;
                                            const to = from + issue.quote.length;
                                            tr.addMark(from, to, schema.marks.warningMark.create({ 
                                                message: issue.message, 
                                                severity: issue.severity 
                                            }));
                                        }
                                    }
                                });
                            }
                        });

                        if (tr.docChanged || tr.steps.length > 0) {
                             editor.view.dispatch(tr);
                        }
                    }
                } catch (e) {
                    console.error("Proactive check failed", e);
                }
            }, 3000);

            editor.on('update', runCheck);
            return () => { editor.off('update', runCheck); };
        }, [editor, isActivePane, nodeId, isProactiveEnabled, node?.synopsis]);


        // Sync Content
        useEffect(() => {
    // ... existing sync content logic ...
        if (editor && nodeId) {
            const currentHTML = editor.getHTML();
            if (currentHTML !== content) {
                editor.commands.setContent(content)
            }
        } else if (editor && !nodeId) {
            editor.commands.clearContent()
        }
    }, [nodeId, editor]) // content dependency removed to avoid loops

    // Typewriter Scrolling
    useEffect(() => {
        if (!editor || !isActivePane) return;
        const handleSelectionUpdate = () => {
             const { selection } = editor.state;
             const domSelection = editor.view.dom.ownerDocument.getSelection();
             if (!domSelection || domSelection.rangeCount === 0) return;
             const range = domSelection.getRangeAt(0);
             const rect = range.getBoundingClientRect();
             const viewport = editor.view.dom.closest('[data-radix-scroll-area-viewport]');
             if (viewport && rect.top !== 0) {
                 const viewportHeight = viewport.clientHeight;
                 const targetY = viewportHeight * 0.5;
                 const currentY = rect.top - viewport.getBoundingClientRect().top;
                 const diff = currentY - targetY;
                 if (Math.abs(diff) > 24) viewport.scrollBy({ top: diff, behavior: 'smooth' });
             }
        };
        editor.on('selectionUpdate', handleSelectionUpdate);
        return () => { editor.off('selectionUpdate', handleSelectionUpdate); };
    }, [editor, isActivePane]);

    if (!editor) return null;

    if (!nodeId) {
        return (
            <div 
                className={cn("flex-1 flex flex-col items-center justify-center text-muted-foreground font-mono text-sm h-full bg-background/50", isActivePane && "bg-background")}
                onClick={onActivate}
            >
                <div>Select a text to read</div>
            </div>
        )
    }

    return (
        <div 
            className={cn(
                "h-full flex flex-col relative group transition-colors border-2", 
                isActivePane ? "border-primary/20 bg-background z-10" : "border-transparent bg-background/40 hover:bg-background/60",
                focusMode && "border-transparent"
            )}
            onClick={onActivate}
        >
             {/* Toolbar */}
             <div className={cn(
                'absolute top-4 left-0 right-0 flex justify-center opacity-0 transition-opacity duration-300 z-20 pointer-events-none',
                isActivePane && "group-hover:opacity-100 pointer-events-auto",
                focusMode && "opacity-0 hover:opacity-100"
            )}>
                <div className='bg-background/90 backdrop-blur border border-border shadow-md rounded-full px-4 py-1.5 flex gap-2 text-xs font-mono text-muted-foreground items-center'>
                    <button onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className={cn("hover:text-foreground", editor.isActive('heading', { level: 1 }) && "text-foreground font-bold")}>H1</button>
                    <button onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={cn("hover:text-foreground", editor.isActive('heading', { level: 2 }) && "text-foreground font-bold")}>H2</button>
                    <div className="w-px h-3 bg-border mx-1" />
                    <button onClick={() => editor.chain().focus().toggleBold().run()} className={cn("hover:text-foreground", editor.isActive('bold') && "text-foreground font-bold")}>B</button>
                    <button onClick={() => editor.chain().focus().toggleItalic().run()} className={cn("hover:text-foreground", editor.isActive('italic') && "text-foreground font-bold")}>I</button>
                    <button onClick={() => editor.chain().focus().toggleStrike().run()} className={cn("hover:text-foreground", editor.isActive('strike') && "text-foreground font-bold")}>S</button>
                    <div className="w-px h-3 bg-border mx-1" />
                    <button onClick={() => editor.chain().focus().toggleBulletList().run()} className={cn("hover:text-foreground", editor.isActive('bulletList') && "text-foreground font-bold")}>Bullet</button>
                    <button onClick={() => editor.chain().focus().toggleOrderedList().run()} className={cn("hover:text-foreground", editor.isActive('orderedList') && "text-foreground font-bold")}>Number</button>
                    <button onClick={() => editor.chain().focus().toggleBlockquote().run()} className={cn("hover:text-foreground", editor.isActive('blockquote') && "text-foreground font-bold")}>Quote</button>
                    <div className="w-px h-3 bg-border mx-1" />
                    <button onClick={() => editor.chain().focus().setTextAlign('left').run()} className={cn("hover:text-foreground", editor.isActive({ textAlign: 'left' }) && "text-foreground font-bold")}><AlignLeft className="h-3 w-3"/></button>
                    <button onClick={() => editor.chain().focus().setTextAlign('center').run()} className={cn("hover:text-foreground", editor.isActive({ textAlign: 'center' }) && "text-foreground font-bold")}><AlignCenter className="h-3 w-3"/></button>
                    <button onClick={() => editor.chain().focus().setTextAlign('right').run()} className={cn("hover:text-foreground", editor.isActive({ textAlign: 'right' }) && "text-foreground font-bold")}><AlignRight className="h-3 w-3"/></button>
                    <button onClick={() => editor.chain().focus().setTextAlign('justify').run()} className={cn("hover:text-foreground", editor.isActive({ textAlign: 'justify' }) && "text-foreground font-bold")}><AlignJustify className="h-3 w-3"/></button>

                    {showFocusToggle && (
                        <>
                            <div className="w-px h-3 bg-border mx-1" />
                            <button onClick={toggleFocusMode} className={cn("hover:text-foreground flex items-center gap-1", focusMode && "text-primary")}>
                                <Maximize2 className="h-3 w-3"/>
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Bubble Menu */}
            {editor && (
                <BubbleMenu editor={editor}>
                    <div className="bg-background/95 backdrop-blur border border-border shadow-lg rounded-lg overflow-hidden flex flex-col p-1 animate-in fade-in zoom-in-95">
                        <div className="flex items-center gap-1">
                            <button onClick={() => editor.chain().focus().toggleBold().run()} className={cn("p-1 hover:bg-muted rounded", editor.isActive('bold') && "bg-muted font-bold")}>B</button>
                            <button onClick={() => editor.chain().focus().toggleItalic().run()} className={cn("p-1 hover:bg-muted rounded", editor.isActive('italic') && "bg-muted font-bold")}>I</button>
                            <div className="w-px h-4 bg-border mx-1" />
                             <button 
                                onClick={handleFactCheck} 
                                className="p-1 hover:bg-muted rounded flex items-center gap-1 text-xs font-medium text-purple-600 hover:text-purple-700"
                                disabled={isChecking}
                            >
                                <Sparkles className="w-3 h-3" />
                                {isChecking ? "Checking..." : "Fact Check"}
                            </button>
                        </div>

                        {/* Result Popover (Inline) */}
                        {factCheckResult && (
                             <div className="mt-2 p-2 bg-muted/50 rounded text-xs max-w-[250px] border-t border-border">
                                <div className="font-bold mb-1 flex justify-between">
                                    <span>{factCheckResult.verdict}</span>
                                    <button onClick={() => setFactCheckResult(null)} className="text-muted-foreground hover:text-foreground">×</button>
                                </div>
                                <p className="leading-relaxed opacity-90">{factCheckResult.explanation}</p>
                             </div>
                        )}
                    </div>
                </BubbleMenu>
            )}

            <ScrollArea className="flex-1 h-full">
                <div className={cn("mx-auto py-16 px-8 min-h-full transition-all duration-500", focusMode ? "max-w-3xl" : "max-w-2xl")}>
                     {/* Title */}
                     <div className="mb-8 border-b border-border/20 pb-4">
                         <h1 className="text-3xl font-bold font-serif text-foreground/90">{node?.title}</h1>
                     </div>
                    <EditorContent editor={editor} />
                </div>
            </ScrollArea>

            {/* Word Count */}
            <div className='absolute bottom-4 right-8 text-xs font-mono text-muted-foreground opacity-50 hover:opacity-100 transition-opacity bg-background/50 backdrop-blur px-2 rounded pointer-events-none'>
                {editor.storage.characterCount?.words?.() || 0} Words
            </div>
        </div>
    )
}

// --- Main Wrapper ---
export function Editor() {
    const activeNodeId = useProjectStore((state) => state.activeNodeId)
    const secondaryNodeId = useProjectStore((state) => state.secondaryNodeId)
    
    // Split State
    const splitMode = useProjectStore((state) => state.splitMode)
    const setSplitMode = useProjectStore((state) => state.setSplitMode)
    const activePane = useProjectStore((state) => state.activePane)
    const setActivePane = useProjectStore((state) => state.setActivePane)
    
    const focusMode = useProjectStore((state) => state.focusMode)

    // Ensure we handle "active" pane logically
    // If split is closed, force primary
    useEffect(() => {
        if (splitMode === 'none' && activePane !== 'primary') {
            setActivePane('primary');
        }
    }, [splitMode, activePane, setActivePane]);

    return (
        <div className="h-full flex flex-col relative" data-focus={focusMode}>
            {/* Split Controls (Header overlay) - Only visible if not focus mode */}
            {!focusMode && (
                 <div className="absolute top-4 right-8 z-50 flex gap-2">
                     <button
                        onClick={() => setSplitMode(splitMode === 'none' ? 'vertical' : 'none')}
                        className={cn(
                            "bg-background/80 backdrop-blur border border-border shadow-sm rounded-md px-2 py-1.5 text-xs font-mono text-muted-foreground hover:text-foreground transition-all flex items-center gap-2",
                            splitMode !== 'none' && "bg-secondary text-secondary-foreground border-primary/20"
                        )}
                        title="Toggle Split View"
                     >
                         {splitMode === 'none' ? <Columns className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                         <span className="hidden lg:inline">{splitMode === 'none' ? 'Split' : 'Close Split'}</span>
                     </button>
                 </div>
            )}

            {/* Layout */}
            <div className="flex-1 flex overflow-hidden">
                {/* Primary Pane */}
                <div className={cn(
                    "flex-1 h-full min-w-0 transition-all duration-300",
                    splitMode === 'vertical' && "border-r border-border"
                )}>
                    <SingleEditor 
                        nodeId={activeNodeId} 
                        isActivePane={activePane === 'primary' || splitMode === 'none'}
                        onActivate={() => setActivePane('primary')}
                        showFocusToggle={true}
                    />
                </div>

                {/* Secondary Pane */}
                {splitMode !== 'none' && !focusMode && (
                    <div className="flex-1 h-full min-w-0 animate-in slide-in-from-right-10 duration-300">
                        <SingleEditor 
                            nodeId={secondaryNodeId} 
                            isActivePane={activePane === 'secondary'} 
                            onActivate={() => setActivePane('secondary')}
                            showFocusToggle={false}
                        />
                    </div>
                )}
            </div>
        </div>
    )
}

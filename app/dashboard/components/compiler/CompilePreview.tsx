
"use client";

import React, { useEffect, useState } from "react";
import { BinderNode, useProjectStore } from "../../store/useProjectStore";
import { CompileFormatting } from "./CompileSettings";
import { CompileSeparatorsConfig } from "./CompileSeparators";
import { getFlatCompilationList } from "./CompileEngine";

interface CompilePreviewProps {
    selectedIds: Set<string>;
    format: CompileFormatting;
    separators: CompileSeparatorsConfig;
}

export function CompilePreview({ selectedIds, format, separators }: CompilePreviewProps) {
    const { nodes, content } = useProjectStore();
    const [previewHtml, setPreviewHtml] = useState("");

    useEffect(() => {
        // Generate a preview using shared logic
        const generatePreview = () => {
            const flatList = getFlatCompilationList(nodes, selectedIds);
            
            // Limit preview for performance
            const previewNodes = flatList.slice(0, 5); 

            let html = "";
            
            previewNodes.forEach((node, index) => {
                 const nodeContent = content[node.id] || "";
                 
                 // Simulate Separators (Same logic as Engine)
                 if (index > 0) {
                     if (node.type === 'folder' || node.label === 'chapter') {
                         if (separators.folderSeparator === 'page_break') {
                             html += `<div class="preview-page-break"></div>`;
                         } else if (separators.folderSeparator === 'empty_line') {
                             html += `<div class="preview-spacer"></div>`;
                         }
                     } else {
                         // Text/Scene
                         if (separators.textSeparator === 'custom') {
                             html += `<div class="preview-separator">${separators.customTextSeparator}</div>`;
                         } else if (separators.textSeparator === 'page_break') {
                              html += `<div class="preview-page-break"></div>`;
                         } else if (separators.textSeparator === 'empty_line') {
                              html += `<div class="preview-spacer"></div>`;
                         }
                     }
                 }

                 if (node.type === 'folder') {
                      html += `<h1 class="preview-heading">${node.title}</h1>`;
                 } else {
                      html += `<div class="preview-content">${nodeContent}</div>`;
                 }
            });

            if (flatList.length === 0) {
                 setPreviewHtml("<p class='text-muted-foreground italic text-center mt-10'>No content selected.</p>");
            } else {
                 setPreviewHtml(html);
            }
        };

        generatePreview();
    }, [selectedIds, nodes, content, separators]);

    // Calculate styles based on settings
    const styles = {
        fontFamily: format.font,
        fontSize: format.size + "pt",
        lineHeight: format.lineHeight,
        color: 'black' // Preview is always black text on white paper
    };

    return (
        <div className="h-full w-full bg-zinc-100/50 dark:bg-zinc-900/50 p-8 overflow-hidden flex flex-col items-center justify-center relative rounded-r-xl">
             <div className="absolute top-4 right-4 bg-background/80 backdrop-blur px-2 py-1 rounded text-[10px] font-mono text-muted-foreground border shadow-sm">
                Live Preview
             </div>

             {/* The Paper */}
             <div className="w-full max-w-[260px] aspect-[1/1.414] bg-white shadow-2xl rounded-sm overflow-hidden transform transition-all duration-300">
                <div 
                    className="w-full h-full p-[20px] overflow-y-auto hide-scrollbar prose prose-xs max-w-none"
                    style={styles}
                >
                    <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
                </div>
             </div>

             <style jsx global>{`
                .preview-page-break {
                    border-bottom: 1px dashed #ccc;
                    margin: 2em 0;
                    position: relative;
                }
                .preview-page-break::after {
                    content: 'Page Break';
                    position: absolute;
                    right: 0;
                    top: -10px;
                    font-size: 8px;
                    color: #999;
                    background: white;
                    padding-left: 5px;
                }
                .preview-separator {
                    text-align: center;
                    margin: 1.5em 0;
                    font-weight: bold;
                }
                .preview-heading {
                    font-size: 1.5em;
                    font-weight: bold;
                    margin-bottom: 1em;
                    text-align: center;
                }
                .preview-spacer {
                    height: 2em;
                }
                /* Hide scrollbar in preview */
                .hide-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                .hide-scrollbar {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
             `}</style>
        </div>
    );
}

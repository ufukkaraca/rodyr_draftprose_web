
import { BinderNode, useProjectStore } from "../../store/useProjectStore";
import { CompileFormatting } from "./CompileSettings";
import { CompileSeparatorsConfig } from "./CompileSeparators";
import { Document, Packer, Paragraph, TextRun, HeadingLevel, PageBreak, AlignmentType, IParagraphOptions } from "docx";
import TurndownService from "turndown";
import { jsPDF } from "jspdf";

const turndownService = new TurndownService();

// Helper: Flatten tree based on selection
export function getFlatCompilationList(
    nodes: Record<string, BinderNode>, 
    selectedIds: Set<string>
): BinderNode[] {
    const rootNodes = Object.values(nodes)
        .filter(n => n.parentId === null || n.parentId === 'root')
        .sort((a, b) => a.order - b.order);

    const flatList: BinderNode[] = [];

    const traverse = (node: BinderNode) => {
        if (!selectedIds.has(node.id)) return;
        
        flatList.push(node);

        // Find children
        const children = Object.values(nodes)
            .filter(n => n.parentId === node.id)
            .sort((a, b) => a.order - b.order);
        
        children.forEach(traverse);
    };

    rootNodes.forEach(traverse);
    return flatList;
}

// Convert HTML to simple text (for DOCX/PDF)
function extractTextFromHtml(html: string, removeComments: boolean): string {
    let processedHtml = html;
    if (removeComments) {
        // Remove HTML comments
        processedHtml = processedHtml.replace(/<!--[\s\S]*?-->/g, "");
    }

    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = processedHtml;
    return tempDiv.innerText || tempDiv.textContent || "";
}

export async function compileProject(
    selectedIds: Set<string>,
    format: CompileFormatting,
    separators: CompileSeparatorsConfig,
    exportType: string
) {
    const { nodes, content } = useProjectStore.getState();
    const compileList = getFlatCompilationList(nodes, selectedIds);
    const title = "Generated Manuscript"; 

    // --- DOCX EXPORT ---
    if (exportType === 'docx') {
        const doc = new Document({
            sections: [{
                properties: {},
                children: [
                    new Paragraph({
                        text: title,
                        heading: HeadingLevel.TITLE,
                        alignment: AlignmentType.CENTER,
                    }),
                    new Paragraph({ text: "" }), 
                    ...compileList.flatMap((node, index) => {
                        const nodeContent = content[node.id] || "";
                         const text = extractTextFromHtml(nodeContent, format.removeComments);
                        
                        const elements: any[] = [];

                        // Separator Logic (Before Node)
                        if (index > 0) {
                            if (node.type === 'folder' || node.label === 'chapter') {
                                if (separators.folderSeparator === 'page_break') elements.push(new PageBreak());
                            } else {
                                // Text/Scene
                                if (separators.textSeparator === 'page_break') elements.push(new PageBreak());
                                else if (separators.textSeparator === 'custom') {
                                    elements.push(new Paragraph({
                                        text: separators.customTextSeparator,
                                        alignment: AlignmentType.CENTER,
                                        spacing: { before: 200, after: 200 }
                                    }));
                                }
                                // empty_line is handled by spacing
                            }
                        }

                        // Title (if folder)
                        if (node.type === 'folder') {
                            elements.push(new Paragraph({
                                text: node.title,
                                heading: HeadingLevel.HEADING_1,
                                alignment: AlignmentType.CENTER,
                                spacing: { before: 400, after: 400 }
                            }));
                        }

                        // Content
                        if (text.trim()) {
                            elements.push(new Paragraph({
                                children: [
                                    new TextRun({
                                        text: text,
                                        font: format.font,
                                        size: parseInt(format.size) * 2, 
                                    }),
                                ],
                                spacing: { line: parseInt(format.lineHeight) * 240 },
                            }));
                        }

                        return elements;
                    })
                ],
            }],
        });

        const blob = await Packer.toBlob(doc);
        saveBlob(blob, `${title}.docx`);
    }

    // --- MARKDOWN EXPORT ---
    if (exportType === 'md') {
        let md = `# ${title}\n\n`;
        compileList.forEach((node, index) => {
            if (index > 0) {
                if (node.type === 'folder') md += `\n\n---\n\n`; // Page break approx
                else md += `\n\n***\n\n`; // Scene break
            }
            
            const nodeContent = content[node.id] || "";
            const markdown = turndownService.turndown(nodeContent);
            md += `\n# ${node.title}\n\n${markdown}\n`;
        });
        const blob = new Blob([md], { type: "text/markdown" });
        saveBlob(blob, `${title}.md`);
    }

    // --- HTML EXPORT ---
    if (exportType === 'html') {
         let html = `<html><head><style>
            body { font-family: ${format.font}; font-size: ${format.size}pt; line-height: ${format.lineHeight}; max-width: 800px; margin: 40px auto; }
            .scene-sep { text-align: center; margin: 2em 0; }
            h1, h2 { text-align: center; }
         </style></head><body>`;
         html += `<h1>${title}</h1>`;
         
         compileList.forEach((node, index) => {
             const nodeContent = content[node.id] || "";
             
             // Separators
             if (index > 0) {
                 if (node.type === 'folder') {
                     if (separators.folderSeparator === 'page_break') html += `<div style="page-break-before: always;"></div>`;
                 } else {
                     if (separators.textSeparator === 'custom') html += `<div class="scene-sep">${separators.customTextSeparator}</div>`;
                     else if (separators.textSeparator === 'page_break') html += `<div style="page-break-before: always;"></div>`;
                     else html += `<br/><br/>`;
                 }
             }

             if (node.type === 'folder') {
                 html += `<h2>${node.title}</h2>`;
             } else {
                 html += `<div class="scene">${nodeContent}</div>`;
             }
         });
         html += `</body></html>`;
         const blob = new Blob([html], { type: "text/html" });
         saveBlob(blob, `${title}.html`);
    }

    // --- PDF EXPORT ---
    if (exportType === 'pdf') {
        // Simple text-based PDF using jsPDF
        const doc = new jsPDF();
        let y = 20;
        const pageHeight = doc.internal.pageSize.height;
        const margin = 20;
        const lineHeight = parseInt(format.size) * parseFloat(format.lineHeight) * 0.3527; // pt to mm approx

        doc.setFont(format.font === 'Courier Prime' ? 'Courier' : format.font === 'Times New Roman' ? 'Times' : 'Helvetica');
        doc.setFontSize(24);
        doc.text(title, 105, y, { align: 'center' });
        y += 20;

        doc.setFontSize(parseInt(format.size));

        compileList.forEach((node, index) => {
             const nodeContent = content[node.id] || "";
             const text = extractTextFromHtml(nodeContent, format.removeComments);
             
             // Separators & Page Breaks
             if (index > 0) {
                if (node.type === 'folder') {
                    if (separators.folderSeparator === 'page_break') {
                        doc.addPage();
                        y = margin;
                    }
                } else {
                    if (separators.textSeparator === 'page_break') {
                        doc.addPage();
                        y = margin;
                    } else if (separators.textSeparator === 'custom') {
                         y += lineHeight;
                         doc.text(separators.customTextSeparator, 105, y, { align: 'center' });
                         y += lineHeight * 2;
                    } else {
                        y += lineHeight * 2;
                    }
                }
             } else {
                 // First item
                 y += lineHeight;
             }

             // Folder Title
             if (node.type === 'folder') {
                 doc.setFontSize(18);
                 doc.text(node.title, 105, y, { align: 'center' });
                 y += 15;
                 doc.setFontSize(parseInt(format.size));
             }

             // Content Check for Page Break
             const splitText = doc.splitTextToSize(text, 170); // 170mm width
             
             if (y + (splitText.length * lineHeight) > pageHeight - margin) {
                 // Simple overflow handling: just add page if it doesn't fit?
                 // Better: Print line by line
                 splitText.forEach((line: string) => {
                     if (y > pageHeight - margin) {
                         doc.addPage();
                         y = margin;
                     }
                     doc.text(line, margin, y);
                     y += lineHeight;
                 });
             } else {
                 doc.text(splitText, margin, y);
                 y += (splitText.length * lineHeight);
             }
        });

        doc.save(`${title}.pdf`);
    }
}

function saveBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

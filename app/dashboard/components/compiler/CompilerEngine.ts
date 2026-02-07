
import { BinderNode } from "@/app/dashboard/store/useProjectStore";
import { CompileSettings } from "./CompilerDialog";
import { saveAs } from "file-saver";
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from "docx";
import TurndownService from "turndown";

/**
 * The Compiler Engine
 * Takes the project state and settings, produces a downloadable blob.
 */
export async function compileProject(
    nodes: Record<string, BinderNode>,
    content: Record<string, string>,
    settings: CompileSettings
) {
    // 1. Flatten Tree based on order and structure
    const flatList = flattenTree(nodes, settings.includedNodeIds);

    // 2. Generate Content based on format
    if (settings.format === "docx") {
        await compileDocx(flatList, content, settings);
    } else if (settings.format === "md") {
        await compileMarkdown(flatList, content, settings);
    } else if (settings.format === "html") {
        await compileHtml(flatList, content, settings);
    } else {
        alert("Format not implemented yet");
    }
}

/**
 * Recursive tree flattener that respects user selection
 */
function flattenTree(
    nodes: Record<string, BinderNode>,
    includedIds: Set<string>,
    parentId: string | null = null
): BinderNode[] {
    const children = Object.values(nodes)
        .filter(n => n.parentId === parentId)
        .sort((a, b) => a.order - b.order);

    let result: BinderNode[] = [];

    for (const child of children) {
        if (includedIds.has(child.id)) {
            result.push(child);
            // If folder is included, check its children. 
            // (If folder is excluded, children are skipped - standard behavior)
            result = result.concat(flattenTree(nodes, includedIds, child.id));
        }
    }

    return result;
}

// --- DOCX Compiler ---
async function compileDocx(
    flatList: BinderNode[],
    contentMap: Record<string, string>,
    settings: CompileSettings
) {
    const docChildren: any[] = [];
    
    // Title Page
    docChildren.push(
        new Paragraph({
            text: settings.metadata.title,
            heading: HeadingLevel.TITLE,
            alignment: AlignmentType.CENTER,
            spacing: { after: 400, before: 3000 } // approx center page
        }),
        new Paragraph({
            text: `by ${settings.metadata.author}`,
            alignment: AlignmentType.CENTER,
            spacing: { after: 4000 } // Push content to next page approx
        }),
        new Paragraph({
            text: "",
            pageBreakBefore: true
        })
    );

    let previousNode: BinderNode | null = null;
    const turndownService = new TurndownService();

    for (const node of flatList) {
        // Separator Logic
        let pageBreak = false;
        if (node.type === 'folder' && settings.separators.folderToText === 'page_break') {
            pageBreak = true;
        }
        
        // Add Title (Headings)
        // Folders -> Heading 1
        // Files -> Heading 2 (if scene titles enabled? For now assume Files are scenes without titles in output usually, 
        //   but let's output titles as H2 if it's a file, H1 if folder)
        if (node.type === 'folder') {
             docChildren.push(new Paragraph({
                 text: node.title,
                 heading: HeadingLevel.HEADING_1,
                 pageBreakBefore: pageBreak,
                 spacing: { after: 200 }
             }));
        } else {
            // Text Node separator from previous
            if (previousNode && previousNode.type === 'file' && settings.separators.textToText === 'asterism') {
                docChildren.push(new Paragraph({
                    text: "* * *",
                    alignment: AlignmentType.CENTER,
                    spacing: { before: 200, after: 200 }
                }));
            } else if (previousNode && previousNode.type === 'file' && settings.separators.textToText === 'page_break') {
                 docChildren.push(new Paragraph({
                    text: "",
                    pageBreakBefore: true
                }));
            }
             // NOTE: Usually scenes don't have titles in the text unless specified.
             // We'll skip file titles for now to match novel standard, or maybe just bold them?
             // Let's print the title for now to be safe.
             // docChildren.push(new Paragraph({ text: node.title, heading: HeadingLevel.HEADING_2 }));
        }

        // Add Content
        const rawHtml = contentMap[node.id] || "";
        const cleanText = turndownService.turndown(rawHtml); // Quick way to get text, better: html-to-docx parser
        
        // For MVP docx, we just dump text. 
        // Real implementation requires parsing HTML to Docx Paragraphs/Runs.
        // We will just split by newline and make paragraphs.
        const lines = cleanText.split("\n");
        lines.forEach(line => {
            if (line.trim()) {
                docChildren.push(new Paragraph({
                    children: [
                        new TextRun({
                            text: line,
                            font: settings.formatting.override ? settings.formatting.font : undefined,
                            size: settings.formatting.override ? settings.formatting.fontSize * 2 : undefined // docx uses half-points
                        })
                    ],
                    spacing: { after: 120, line: 276 } // 1.2 line spacing approx
                }));
            }
        });

        previousNode = node;
    }

    const doc = new Document({
        sections: [{
            properties: {},
            children: docChildren,
        }],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, `${settings.metadata.title}.docx`);
}


// --- Markdown Compiler ---
async function compileMarkdown(
    flatList: BinderNode[],
    contentMap: Record<string, string>,
    settings: CompileSettings
) {
    const turndownService = new TurndownService();
    let mdOutput = `# ${settings.metadata.title}\nBy ${settings.metadata.author}\n\n`;

    for (const node of flatList) {
        if (node.type === 'folder') {
            mdOutput += `\n\n# ${node.title}\n\n`;
        } else {
             // Separator
             mdOutput += `\n\n* * *\n\n`;
        }
        
        const content = contentMap[node.id] || "";
        const markdown = turndownService.turndown(content);
        mdOutput += markdown;
    }
    
    const blob = new Blob([mdOutput], { type: "text/markdown;charset=utf-8" });
    saveAs(blob, `${settings.metadata.title}.md`);
}

// --- HTML Compiler ---
async function compileHtml(
    flatList: BinderNode[],
    contentMap: Record<string, string>,
    settings: CompileSettings
) {
     let htmlOutput = `
     <html>
     <head>
        <title>${settings.metadata.title}</title>
        <style>
            body { 
                font-family: '${settings.formatting.font}', serif; 
                font-size: ${settings.formatting.fontSize}pt; 
                max-width: 800px; margin: 0 auto; padding: 2rem;
            }
            h1 { page-break-before: always; }
        </style>
     </head>
     <body>
        <div style="text-align:center; margin-bottom: 4rem;">
            <h1>${settings.metadata.title}</h1>
            <h3>By ${settings.metadata.author}</h3>
        </div>
     `;

    for (const node of flatList) {
        const content = contentMap[node.id] || "";
        if (node.type === 'folder') {
            htmlOutput += `<h1>${node.title}</h1>`;
        } else {
            // Separator
             htmlOutput += `<div style="text-align:center; margin: 2rem 0;">* * *</div>`;
        }
        
        htmlOutput += `<div>${content}</div>`;
    }

    htmlOutput += `</body></html>`;
    
    const blob = new Blob([htmlOutput], { type: "text/html;charset=utf-8" });
    saveAs(blob, `${settings.metadata.title}.html`);
}

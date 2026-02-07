
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import JSZip from "jszip";
import TurndownService from "turndown";

const turndownService = new TurndownService();

// Helper to convert HTML to Markdown safely
function htmlToMarkdown(html: string | null): string {
  if (!html) return "";
  try {
    return turndownService.turndown(html);
  } catch (e) {
    console.error("Markdown conversion failed:", e);
    return html || ""; // Fallback to raw ID/Text
  }
}

// Type for the document tree
type DocNode = {
  id: string;
  title: string;
  content: string | null;
  type: string;
  children: DocNode[];
  metadata: any;
};

// Recursive function to build the tree structure in the zip
function buildZipTree(folder: JSZip, nodes: DocNode[]) {
  for (const node of nodes) {
    const safeTitle = node.title.replace(/[\/\\?%*:|"<>]/g, "-") || "Untitled";
    
    if (node.type === "folder") {
      const subFolder = folder.folder(safeTitle);
      if (subFolder && node.children.length > 0) {
        buildZipTree(subFolder, node.children);
      }
    } else {
      // It's a file
      const markdown = htmlToMarkdown(node.content);
      // Add metadata header
      const metaHeader = `---
title: ${node.title}
status: ${node.metadata?.status || 'draft'}
label: ${node.metadata?.label || 'none'}
---

`;
      folder.file(`${safeTitle}.md`, metaHeader + markdown);
    }
  }
}

export async function GET(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const { id } = params;

    if (!id) {
      return new NextResponse("Project ID required", { status: 400 });
    }

    // 1. Fetch Data
    const project = await prisma.project.findUnique({ where: { id } });
    if (!project) return new NextResponse("Project not found", { status: 404 });

    const documents = await prisma.document.findMany({
      where: { projectId: id },
      orderBy: { order: 'asc' }
    });

    const snapshots = await prisma.snapshot.findMany({
      where: { document: { projectId: id } },
      include: { document: { select: { title: true } } }
    });

    // 2. Construct Tree for Manuscript
    const nodeMap = new Map<string, DocNode>();
    const rootNodes: DocNode[] = [];

    // Initialize map
    documents.forEach(doc => {
      nodeMap.set(doc.id, { ...doc, children: [] });
    });

    // Build hierarchy
    documents.forEach(doc => {
      const node = nodeMap.get(doc.id)!;
      if (doc.parentId && nodeMap.has(doc.parentId)) {
        nodeMap.get(doc.parentId)!.children.push(node);
      } else {
        rootNodes.push(node);
      }
    });

    // 3. Create ZIP
    const zip = new JSZip();

    // A. Raw Data (project.json)
    const rawData = {
      version: "1.0",
      timestamp: new Date().toISOString(),
      project,
      documents,
      snapshots
    };
    zip.file("project.json", JSON.stringify(rawData, null, 2));

    // B. Manuscript (Readable)
    const manuscriptFolder = zip.folder("Manuscript");
    if (manuscriptFolder) {
      buildZipTree(manuscriptFolder, rootNodes);
    }

    // C. Snapshots (Readable)
    const snapshotsFolder = zip.folder("Snapshots");
    if (snapshotsFolder) {
      snapshots.forEach(snap => {
        const docTitle = snap.document.title.replace(/[\/\\?%*:|"<>]/g, "-");
        const safeLabel = snap.label.replace(/[\/\\?%*:|"<>]/g, "-");
        const date = new Date(snap.createdAt).toISOString().split('T')[0];
        const filename = `${date}_${docTitle}_${safeLabel}.md`;
        const content = htmlToMarkdown(snap.content);
        snapshotsFolder.file(filename, content);
      });
    }

    // 4. Generate & Return
    const content = await zip.generateAsync({ type: "blob" });
    const arrayBuffer = await content.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const safeTitle = project.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const filename = `draftprose-backup-${safeTitle}-${new Date().toISOString().split('T')[0]}.zip`;

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${filename}"`
      }
    });

  } catch (error) {
    console.error("[BACKUP_ZIP_ERROR]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

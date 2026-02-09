
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"

export async function GET(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  try {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    // Verify ownership
    const project = await prisma.project.findUnique({
        where: { id: params.id },
        select: { userId: true }
    });

    if (!project) {
        return new NextResponse("Project not found", { status: 404 });
    }

    if (project.userId !== session.user.id) {
        return new NextResponse("Forbidden", { status: 403 });
    }
    
    // Fetch all documents for this project
    let documents = await prisma.document.findMany({
      where: {
        projectId: params.id,
      },
      orderBy: {
        order: 'asc',
      },
    })

    // Self-Healing: Check for Trash Folder
    // We look for either the legacy "trash" id (if this project owns it) or "trash-[projectId]"
    const trashFolder = documents.find(d => d.id === 'trash' || d.id === `trash-${params.id}`);

    if (!trashFolder) {
        console.log(`[PROJECT_TREE] Trash missing for ${params.id}, creating...`);
        try {
            const newTrash = await prisma.document.create({
                data: {
                    id: `trash-${params.id}`, // Scoped ID
                    title: "Trash",
                    type: "folder",
                    projectId: params.id,
                    metadata: { system: "trash", collapsed: true },
                    order: 9999
                }
            });
            documents.push(newTrash);
        } catch (e) {
            // Fallback: If creation fails (race condition?), ignore, but log.
            console.error("Failed to seed trash", e);
        }
    }

    return NextResponse.json(documents)
  } catch (error) {
    console.error("[PROJECT_TREE_GET]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}

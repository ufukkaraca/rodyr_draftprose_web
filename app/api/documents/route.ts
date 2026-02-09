
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"

export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json()
    const { id, projectId, title, parentId, type, order, metadata } = body

    if (!projectId || !title) {
      return new NextResponse("Missing required fields", { status: 400 })
    }

    // Verify Project Ownership
    const project = await prisma.project.findUnique({
        where: { id: projectId },
        select: { userId: true }
    });

    if (!project) return new NextResponse("Project not found", { status: 404 });
    if (project.userId !== session.user.id) return new NextResponse("Forbidden", { status: 403 });

    const document = await prisma.document.create({
      data: {
        id: id, // Optional: if undefined, CUID generated
        projectId,
        title,
        parentId,
        type: type || 'file',
        order: order || 0,
        metadata: metadata || {},
        content: '',
      },
    })

    return NextResponse.json(document)
  } catch (error) {
    console.error("[DOCUMENTS_POST]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"

// Helper to verify document ownership via project
async function verifyDocumentAccess(documentId: string, userId: string): Promise<boolean> {
    const doc = await prisma.document.findUnique({
        where: { id: documentId },
        select: { project: { select: { userId: true } } }
    });
    return doc?.project.userId === userId;
}

export async function PUT(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return new NextResponse("Unauthorized", { status: 401 });
    
    // Ownership Check
    const hasAccess = await verifyDocumentAccess(params.id, session.user.id);
    if (!hasAccess) return new NextResponse("Forbidden", { status: 403 });

    const body = await req.json()
    const { title, content, metadata, parentId, order } = body

    // We allow partial updates
    const document = await prisma.document.update({
      where: {
        id: params.id,
      },
      data: {
        title,
        content,
        metadata,
        parentId,
        order,
      },
    })

    return NextResponse.json(document)
  } catch (error) {
    console.error("[DOCUMENT_PUT]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}

export async function DELETE(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return new NextResponse("Unauthorized", { status: 401 });

    // Ownership Check
    const hasAccess = await verifyDocumentAccess(params.id, session.user.id);
    if (!hasAccess) return new NextResponse("Forbidden", { status: 403 });

    // Recursive Delete Function
    const deleteRecursive = async (docId: string) => {
        // Find children
        const children = await prisma.document.findMany({
            where: { parentId: docId }
        });
        
        for (const child of children) {
            await deleteRecursive(child.id);
        }
        
        await prisma.document.delete({
            where: { id: docId }
        });
    };

    await deleteRecursive(params.id);

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[DOCUMENT_DELETE]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}

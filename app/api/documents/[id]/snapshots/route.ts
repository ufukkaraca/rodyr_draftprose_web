import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"

// Reuse/duplicate verification helper (simplest to avoid creating shared util right now, though not DRY)
async function verifyDocumentAccess(documentId: string, userId: string): Promise<boolean> {
    const doc = await prisma.document.findUnique({
        where: { id: documentId },
        select: { project: { select: { userId: true } } }
    });
    return doc?.project.userId === userId;
}

export async function GET(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return new NextResponse("Unauthorized", { status: 401 });

    const hasAccess = await verifyDocumentAccess(params.id, session.user.id);
    if (!hasAccess) return new NextResponse("Forbidden", { status: 403 });

    const snapshots = await prisma.snapshot.findMany({
      where: {
        documentId: params.id
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(snapshots)
  } catch (error) {
    console.error("[SNAPSHOTS_GET]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}

export async function POST(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return new NextResponse("Unauthorized", { status: 401 });

    const hasAccess = await verifyDocumentAccess(params.id, session.user.id);
    if (!hasAccess) return new NextResponse("Forbidden", { status: 403 });

    const body = await req.json()
    const { label, content } = body

    if (!label || content === undefined) {
        return new NextResponse("Missing label or content", { status: 400 })
    }

    const snapshot = await prisma.snapshot.create({
      data: {
        label,
        content,
        documentId: params.id
      }
    })

    return NextResponse.json(snapshot)
  } catch (error) {
    console.error("[SNAPSHOTS_POST]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}

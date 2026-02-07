
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  try {
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

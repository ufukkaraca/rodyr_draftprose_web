
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { id, projectId, title, parentId, type, order, metadata } = body

    if (!projectId || !title) {
      return new NextResponse("Missing required fields", { status: 400 })
    }

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

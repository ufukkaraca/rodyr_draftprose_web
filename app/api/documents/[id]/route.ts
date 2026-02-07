
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function PUT(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  try {
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
    await prisma.document.delete({
      where: {
        id: params.id,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[DOCUMENT_DELETE]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}

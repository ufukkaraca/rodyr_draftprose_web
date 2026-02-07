
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  try {
    // Await params if necessary (Next.js 15+ needs it, but 14 is sync usually. 
    // Wait, params is a promise in newer Next.js versions. 
    // Safest to just access it if it's not a promise, or await if strictly needed.
    // In standard Next 14 app dir, params is built-in object.
    
    // Fetch all documents for this project
    const documents = await prisma.document.findMany({
      where: {
        projectId: params.id,
      },
      orderBy: {
        order: 'asc',
      },
    })

    return NextResponse.json(documents)
  } catch (error) {
    console.error("[PROJECT_TREE_GET]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}

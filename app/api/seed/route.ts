
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  try {
    const { projectId } = await req.json()
    if (!projectId) return new NextResponse("ProjectId required", { status: 400 })

    // 1. Upsert Demo User
    const user = await prisma.user.upsert({
      where: { email: "demo@example.com" },
      update: {},
      create: {
        email: "demo@example.com",
        name: "Demo User",
        emailVerified: true,
      }
    })

    // 2. Upsert Project
    const project = await prisma.project.upsert({
      where: { id: projectId },
      update: {},
      create: {
        id: projectId,
        title: "Demo Project",
        userId: user.id
      }
    })

    // 3. Delete existing documents
    await prisma.document.deleteMany({
      where: { projectId }
    })

    // 4. Seed Documents (Order matters for FK)
    // Create folders first
    await prisma.document.create({
      data: {
        id: "manuscript",
        projectId,
        title: "Manuscript",
        type: "folder",
        parentId: null,
        order: 0,
        metadata: { collapsed: false }
      }
    })

    await prisma.document.create({
      data: {
        id: "characters",
        projectId,
        title: "Characters",
        type: "folder",
        parentId: null,
        order: 1,
        metadata: { collapsed: false }
      }
    })

    // Create children
    await prisma.document.create({
      data: {
        id: "ch1",
        projectId,
        title: "Chapter 1: The Beginning",
        type: "file",
        parentId: "manuscript",
        order: 0,
        content: "<p>It was a dark and stormy night...</p>"
      }
    })

    await prisma.document.create({
      data: {
        id: "char1",
        projectId,
        title: "Protagonist",
        type: "file",
        parentId: "characters",
        order: 0,
        content: "<p>Name: John Doe</p>"
      }
    })

    return NextResponse.json({ success: true, projectId })
  } catch (error) {
    console.error("[SEED_ERROR]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}

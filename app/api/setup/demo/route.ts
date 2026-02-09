
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST() {
  try {
    // 1. Upsert Demo User
    const user = await prisma.user.upsert({
      where: { email: "demo@draftprose.com" },
      update: {},
      create: {
        email: "demo@draftprose.com",
        name: "Demo Writer",
        image: "", // Optional
        emailVerified: true,
      }
    })

    // 2. Upsert Demo Project
    const project = await prisma.project.upsert({
        where: { id: "demo-project" },
        update: {},
        create: {
            id: "demo-project",
            title: "Demo Manuscript",
            userId: user.id
        }
    })

    // 3. Upsert Trash Folder
    await prisma.document.upsert({
        where: { id: "trash-demo-project" },
        update: {},
        create: {
            id: "trash-demo-project",
            title: "Trash",
            type: "folder",
            projectId: project.id,
            metadata: { system: "trash", collapsed: true },
            order: 9999 // Pin to bottom
        }
    })

    return NextResponse.json({ user, project })
  } catch (error) {
    console.error("[SETUP_DEMO]", error)
    return new NextResponse("Internal Error: " + (error as Error).message, { status: 500 })
  }
}

export async function DELETE() {
  try {
    await prisma.user.delete({
      where: { email: "demo@draftprose.com" }
    })
    return NextResponse.json({ success: true })
  } catch (error) {
     // Ignore if not found
     return NextResponse.json({ success: true, note: "User mismatch or already deleted" })
  }
}

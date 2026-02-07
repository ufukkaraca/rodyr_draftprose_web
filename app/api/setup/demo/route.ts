
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
        image: "" // Optional
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

    return NextResponse.json({ user, project })
  } catch (error) {
    console.error("[SETUP_DEMO]", error)
    return new NextResponse("Internal Error: " + (error as Error).message, { status: 500 })
  }
}

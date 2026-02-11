
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST() {
  try {
    // 1. Upsert Demo User
    const user = await prisma.user.upsert({
      where: { email: "demo@draftprose.com" },
      update: {},
      create: {
        id: "demo-user", // Force ID for stability
        email: "demo@draftprose.com",
        name: "Demo Writer",
        image: "", 
        emailVerified: true,
      }
    })

    // 2. Upsert Demo Project
    const project = await prisma.project.upsert({
        where: { id: "demo-project" },
        update: { userId: user.id }, // Ensure ownership
        create: {
            id: "demo-project",
            title: "The Neon Archive",
            description: "A cyberpunk mystery set in 2142.",
            userId: user.id
        }
    })

    // 3. Clear existing documents to prevent "Untitled Folder" pile-up
    await prisma.document.deleteMany({
        where: { projectId: project.id }
    })

    // 4. Create Structure
    const ops = []

    // -- Root Folders --
    const manuscriptId = "demo-manuscript"
    ops.push(prisma.document.create({
        data: {
            id: manuscriptId,
            title: "Manuscript",
            type: "folder",
            projectId: project.id,
            order: 0,
            metadata: { system: "manuscript", expanded: true }
        }
    }))

    const charactersId = "characters" // Fixed ID for MuseChat detection
    ops.push(prisma.document.create({
        data: {
            id: charactersId,
            title: "Characters",
            type: "folder",
            projectId: project.id,
            order: 1,
            metadata: { system: "research", expanded: true, icon: "Users" }
        }
    }))

    const locationsId = "locations" // Fixed ID for consistency
    ops.push(prisma.document.create({
        data: {
            id: locationsId,
            title: "Locations",
            type: "folder",
            projectId: project.id,
            order: 2,
            metadata: { system: "research", expanded: false, icon: "MapPin" }
        }
    }))

    const trashId = "demo-trash"
    ops.push(prisma.document.create({
        data: {
            id: trashId,
            title: "Trash",
            type: "folder",
            projectId: project.id,
            order: 99,
            metadata: { system: "trash", collapsed: true, icon: "Trash" }
        }
    }))

    // -- Chapters & Scenes --
    
    // Chapter 1
    const chap1Id = "demo-chap-1"
    ops.push(prisma.document.create({
        data: {
            id: chap1Id,
            title: "Chapter 1: The Glitch",
            type: "folder",
            projectId: project.id,
            parentId: manuscriptId,
            order: 0,
            metadata: { status: "Done", label: "Part 1" }
        }
    }))

    ops.push(prisma.document.create({
        data: {
            title: "Waking Up",
            type: "file",
            projectId: project.id,
            parentId: chap1Id,
            order: 0,
            content: "<p>The neon alarm clock didn't buzz; it screamed. Kael rolled off the mattress, hitting the cold duracrete floor with a thud. Another day in Sector 7.</p><p>Outside, the hologram ads flickered against the rain. 'Eat at Joe's' – a lie. Joe had been dead for twenty years.</p>",
            metadata: { status: "Done", synopsis: "Kael wakes up and realizes his implant is glitching." }
        }
    }))

    ops.push(prisma.document.create({
        data: {
            title: "The Message",
            type: "file",
            projectId: project.id,
            parentId: chap1Id,
            order: 1,
            content: "<p>His ocular HUD flashed red. <strong>CRITICAL FAILURE</strong>. Below it, a message blinked in a font he hadn't seen since the Old Net:</p><blockquote>Run. They know.</blockquote>",
            metadata: { status: "Draft" }
        }
    }))

    // Chapter 2
    const chap2Id = "demo-chap-2"
    ops.push(prisma.document.create({
        data: {
            id: chap2Id,
            title: "Chapter 2: The Chase",
            type: "folder",
            projectId: project.id,
            parentId: manuscriptId,
            order: 1,
            metadata: { status: "In Progress" }
        }
    }))

    ops.push(prisma.document.create({
        data: {
            title: "Alleyway Ambush",
            type: "file",
            projectId: project.id,
            parentId: chap2Id,
            order: 0,
            content: "<p>Rain slicked the pavement. Kael skidded around the corner, his boots finding little traction on the oily surface. Behind him, the drone's whine grew louder.</p>",
            metadata: { status: "In Progress" }
        }
    }))

    // -- Research Data --
    ops.push(prisma.document.create({
        data: {
            title: "Kael Vex",
            type: "file",
            projectId: project.id,
            parentId: charactersId,
            order: 0,
            content: "<p><strong>Role:</strong> Protagonist</p><p><strong>Age:</strong> 28</p><p><strong>Occupation:</strong> Data Courier</p><p><strong>Notes:</strong> Has a legacy implant from the pre-war era.</p>",
            metadata: { label: "Main" }
        }
    }))

    ops.push(prisma.document.create({
        data: {
            title: "Sector 7",
            type: "file",
            projectId: project.id,
            parentId: locationsId,
            order: 0,
            content: "<p>The slums of Neoproxim. High crime rate, low sunlight. Controlled by the Syndicate.</p>",
            metadata: { label: "Setting" }
        }
    }))

    await prisma.$transaction(ops)

    return NextResponse.json({ success: true, project })
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

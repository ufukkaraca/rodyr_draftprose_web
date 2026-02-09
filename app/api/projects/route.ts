import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function GET(req: Request) {
    try {
        const session = await auth.api.getSession({
            headers: await headers()
        });

        if (!session) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const projects = await prisma.project.findMany({
            where: {
                userId: session.user.id
            },
            orderBy: {
                updatedAt: 'desc'
            }
        });

        return NextResponse.json(projects);
    } catch (error) {
        console.error("[PROJECTS_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await auth.api.getSession({
            headers: await headers()
        });

        if (!session) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const body = await req.json();
        const { title, description } = body;

        if (!title) {
            return new NextResponse("Title is required", { status: 400 });
        }

        const project = await prisma.project.create({
            data: {
                title,
                description,
                userId: session.user.id
            }
        });

        // Seed initial data if needed (e.g. Research folder)
        // Note: useProjectStore handles seeding on first load, but doing it here is cleaner.
        // For now, let's stick to existing pattern or just let store handle it.
        
        return NextResponse.json(project);
    } catch (error) {
        console.error("[PROJECTS_POST]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

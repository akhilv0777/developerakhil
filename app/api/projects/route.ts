// app/api/projects/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Fetch all projects for the frontend
export async function GET() {
  try {
    const projects = await prisma.project.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(projects);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch projects" }, { status: 500 });
  }
}

// Add a new project (Admin only - ideally protected by session check)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, description, imageUrl, demoUrl, githubUrl } = body;

    const newProject = await prisma.project.create({
      data: { title, description, imageUrl, demoUrl, githubUrl }
    });

    return NextResponse.json(newProject);
  } catch (error) {
    return NextResponse.json({ error: "Failed to create project" }, { status: 500 });
  }
}
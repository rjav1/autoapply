import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

// GET /api/applications - List user's applications
export async function GET(request: Request) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get("limit") || "50")
    const offset = parseInt(searchParams.get("offset") || "0")
    const status = searchParams.get("status")

    const where = {
      userId: session.user.id,
      ...(status && { status }),
    }

    const [applications, total] = await Promise.all([
      prisma.application.findMany({
        where,
        orderBy: { appliedAt: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.application.count({ where }),
    ])

    return NextResponse.json({
      applications,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + applications.length < total,
      },
    })
  } catch (error) {
    console.error("Failed to get applications:", error)
    return NextResponse.json(
      { error: "Failed to get applications" },
      { status: 500 }
    )
  }
}

// POST /api/applications - Log a new application
export async function POST(request: Request) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const data = await request.json()

    // Validate required fields
    if (!data.jobUrl || !data.company || !data.title) {
      return NextResponse.json(
        { error: "Missing required fields: jobUrl, company, title" },
        { status: 400 }
      )
    }

    const application = await prisma.application.create({
      data: {
        userId: session.user.id,
        jobUrl: data.jobUrl,
        company: data.company,
        title: data.title,
        status: data.status || "submitted",
        notes: data.notes,
        appliedAt: data.appliedAt ? new Date(data.appliedAt) : new Date(),
      },
    })

    return NextResponse.json({ success: true, application })
  } catch (error) {
    console.error("Failed to create application:", error)
    return NextResponse.json(
      { error: "Failed to create application" },
      { status: 500 }
    )
  }
}

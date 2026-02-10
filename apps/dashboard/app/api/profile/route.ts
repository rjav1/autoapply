import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const profile = await prisma.profile.findUnique({
      where: { userId: session.user.id },
    })

    return NextResponse.json({ profile })
  } catch (error) {
    console.error("Error fetching profile:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const data = await request.json()

    const profile = await prisma.profile.upsert({
      where: { userId: session.user.id },
      update: {
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        linkedin: data.linkedin,
        portfolio: data.portfolio,
        updatedAt: new Date(),
      },
      create: {
        userId: session.user.id,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        linkedin: data.linkedin,
        portfolio: data.portfolio,
      },
    })

    return NextResponse.json({ profile, success: true })
  } catch (error) {
    console.error("Error saving profile:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

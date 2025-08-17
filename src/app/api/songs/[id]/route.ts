import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const song = await db.song.findUnique({
      where: {
        id: params.id
      }
    })

    if (!song) {
      return NextResponse.json(
        { error: "Song not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(song)
  } catch (error) {
    console.error("Error fetching song:", error)
    return NextResponse.json(
      { error: "Failed to fetch song" },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { title, alternateTitles, lyrics } = body

    const existingSong = await db.song.findUnique({
      where: {
        id: params.id
      }
    })

    if (!existingSong) {
      return NextResponse.json(
        { error: "Song not found" },
        { status: 404 }
      )
    }

    const updateData: any = {}
    if (title !== undefined) updateData.title = title
    if (alternateTitles !== undefined) updateData.alternateTitles = JSON.stringify(alternateTitles)
    if (lyrics !== undefined) updateData.lyrics = lyrics

    const song = await db.song.update({
      where: {
        id: params.id
      },
      data: updateData
    })

    return NextResponse.json(song)
  } catch (error) {
    console.error("Error updating song:", error)
    return NextResponse.json(
      { error: "Failed to update song" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const existingSong = await db.song.findUnique({
      where: {
        id: params.id
      }
    })

    if (!existingSong) {
      return NextResponse.json(
        { error: "Song not found" },
        { status: 404 }
      )
    }

    await db.song.delete({
      where: {
        id: params.id
      }
    })

    return NextResponse.json({ message: "Song deleted successfully" })
  } catch (error) {
    console.error("Error deleting song:", error)
    return NextResponse.json(
      { error: "Failed to delete song" },
      { status: 500 }
    )
  }
}
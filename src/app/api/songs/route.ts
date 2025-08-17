import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search")

    if (search) {
      // Search songs by title or alternate titles
      const songs = await db.song.findMany({
        where: {
          OR: [
            {
              title: {
                contains: search,
                mode: "insensitive"
              }
            },
            {
              alternateTitles: {
                contains: search,
                mode: "insensitive"
              }
            }
          ]
        },
        orderBy: {
          title: "asc"
        }
      })

      return NextResponse.json(songs)
    }

    // Get all songs
    const songs = await db.song.findMany({
      orderBy: {
        title: "asc"
      }
    })

    return NextResponse.json(songs)
  } catch (error) {
    console.error("Error fetching songs:", error)
    return NextResponse.json(
      { error: "Failed to fetch songs" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, alternateTitles, lyrics } = body

    if (!title || !lyrics) {
      return NextResponse.json(
        { error: "Title and lyrics are required" },
        { status: 400 }
      )
    }

    const alternateTitlesString = JSON.stringify(alternateTitles || [])

    const song = await db.song.create({
      data: {
        title,
        alternateTitles: alternateTitlesString,
        lyrics
      }
    })

    return NextResponse.json(song, { status: 201 })
  } catch (error) {
    console.error("Error creating song:", error)
    return NextResponse.json(
      { error: "Failed to create song" },
      { status: 500 }
    )
  }
}
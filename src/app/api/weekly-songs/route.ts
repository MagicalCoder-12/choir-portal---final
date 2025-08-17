import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    // Get the current week's songs
    // For simplicity, we'll get the most recent weekly song entry
    const weeklySong = await db.weeklySong.findFirst({
      orderBy: {
        weekStart: "desc"
      },
      include: {
        startingSongRelation: true,
        musicSongRelation: true,
        worshipSongRelation: true
      }
    })

    if (!weeklySong) {
      return NextResponse.json({
        starting: null,
        music: null,
        worship: null
      })
    }

    return NextResponse.json({
      starting: weeklySong.startingSongRelation,
      music: weeklySong.musicSongRelation,
      worship: weeklySong.worshipSongRelation,
      weekStart: weeklySong.weekStart
    })
  } catch (error) {
    console.error("Error fetching weekly songs:", error)
    return NextResponse.json(
      { error: "Failed to fetch weekly songs" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { startingSong, musicSong, worshipSong } = body

    // Allow partial updates - at least one song must be provided
    if (!startingSong && !musicSong && !worshipSong) {
      return NextResponse.json(
        { error: "At least one song must be provided" },
        { status: 400 }
      )
    }

    // Get current week's Sunday
    const today = new Date()
    const sunday = new Date(today)
    const dayOfWeek = sunday.getDay()
    const diff = sunday.getDate() - dayOfWeek
    sunday.setDate(diff)
    sunday.setHours(0, 0, 0, 0)

    // Check if weekly songs already exist for this week
    const existingWeeklySong = await db.weeklySong.findFirst({
      where: {
        weekStart: sunday
      },
      include: {
        startingSongRelation: true,
        musicSongRelation: true,
        worshipSongRelation: true
      }
    })

    let weeklySong
    if (existingWeeklySong) {
      // Update existing weekly song with only the provided songs
      const updateData: any = {}
      if (startingSong) updateData.startingSong = startingSong
      if (musicSong) updateData.musicSong = musicSong
      if (worshipSong) updateData.worshipSong = worshipSong

      weeklySong = await db.weeklySong.update({
        where: {
          id: existingWeeklySong.id
        },
        data: updateData,
        include: {
          startingSongRelation: true,
          musicSongRelation: true,
          worshipSongRelation: true
        }
      })
    } else {
      // For new weekly songs, all three are required
      if (!startingSong || !musicSong || !worshipSong) {
        return NextResponse.json(
          { error: "All three songs are required when creating weekly selections for the first time" },
          { status: 400 }
        )
      }

      // Verify all songs exist
      const [starting, music, worship] = await Promise.all([
        db.song.findUnique({ where: { id: startingSong } }),
        db.song.findUnique({ where: { id: musicSong } }),
        db.song.findUnique({ where: { id: worshipSong } })
      ])

      if (!starting || !music || !worship) {
        return NextResponse.json(
          { error: "One or more songs not found" },
          { status: 404 }
        )
      }

      // Create new weekly song
      weeklySong = await db.weeklySong.create({
        data: {
          weekStart: sunday,
          startingSong,
          musicSong,
          worshipSong
        },
        include: {
          startingSongRelation: true,
          musicSongRelation: true,
          worshipSongRelation: true
        }
      })
    }

    return NextResponse.json({
      starting: weeklySong.startingSongRelation,
      music: weeklySong.musicSongRelation,
      worship: weeklySong.worshipSongRelation,
      weekStart: weeklySong.weekStart
    })
  } catch (error) {
    console.error("Error creating/updating weekly songs:", error)
    return NextResponse.json(
      { error: "Failed to create/update weekly songs" },
      { status: 500 }
    )
  }
}
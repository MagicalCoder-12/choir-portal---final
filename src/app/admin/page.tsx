"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus, Edit, Trash2, Music, Settings, LogOut } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { FontSizeControls, useFontSize } from "@/components/font-size-controls"
import { Song } from "@/app/page"

export default function AdminPanel() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [songs, setSongs] = useState<Song[]>([])
  const [weeklySongs, setWeeklySongs] = useState<{
    starting: Song | null
    music: Song | null
    worship: Song | null
  }>({ starting: null, music: null, worship: null })
  const [loading, setLoading] = useState(true)
  const [editingSong, setEditingSong] = useState<Song | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const { fontSizeClass } = useFontSize()

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin")
    } else if (status === "authenticated" && session?.user?.role !== "admin") {
      router.push("/")
    } else if (status === "authenticated") {
      fetchSongs()
      fetchWeeklySongs()
    }
  }, [status, session, router])

  const fetchSongs = async () => {
    try {
      const response = await fetch("/api/songs")
      if (response.ok) {
        const data = await response.json()
        setSongs(data.map((song: any) => ({
          ...song,
          alternateTitles: JSON.parse(song.alternateTitles)
        })))
      }
    } catch (error) {
      console.error("Error fetching songs:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchWeeklySongs = async () => {
    try {
      const response = await fetch("/api/weekly-songs")
      if (response.ok) {
        const data = await response.json()
        setWeeklySongs(data)
      }
    } catch (error) {
      console.error("Error fetching weekly songs:", error)
    }
  }

  const handleSaveSong = async (songData: Partial<Song>) => {
    try {
      const url = editingSong ? `/api/songs/${editingSong.id}` : "/api/songs"
      const method = editingSong ? "PUT" : "POST"
      
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...songData,
          alternateTitles: songData.alternateTitles || []
        }),
      })

      if (response.ok) {
        await fetchSongs()
        setIsDialogOpen(false)
        setEditingSong(null)
      }
    } catch (error) {
      console.error("Error saving song:", error)
    }
  }

  const handleDeleteSong = async (songId: string) => {
    if (confirm("Are you sure you want to delete this song?")) {
      try {
        const response = await fetch(`/api/songs/${songId}`, {
          method: "DELETE",
        })

        if (response.ok) {
          await fetchSongs()
        }
      } catch (error) {
        console.error("Error deleting song:", error)
      }
    }
  }

  const handleUpdateWeeklySongs = async (type: 'starting' | 'music' | 'worship', songId: string) => {
    try {
      const response = await fetch("/api/weekly-songs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          [type === 'starting' ? 'startingSong' : type === 'music' ? 'musicSong' : 'worshipSong']: songId
        }),
      })

      if (response.ok) {
        await fetchWeeklySongs()
      }
    } catch (error) {
      console.error("Error updating weekly songs:", error)
    }
  }

  const handleSignOut = () => {
    router.push("/")
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950 flex items-center justify-center">
        <div className="text-center">
          <Music className="h-16 w-16 mx-auto mb-4 text-purple-600 animate-pulse" />
          <p className="text-lg text-purple-700">Loading Admin Panel...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Harmony Choir Portal" className="h-10 w-10" />
            <div>
              <h1 className={`text-3xl font-bold text-purple-900 dark:text-purple-100 ${fontSizeClass}`}>
                Admin Panel
              </h1>
              <p className={`text-purple-700 dark:text-purple-300 ${fontSizeClass}`}>
                Manage songs and weekly worship schedule
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <FontSizeControls />
            <ThemeToggle />
            <Button onClick={handleSignOut} variant="outline">
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>

        <Tabs defaultValue="songs" className="w-full max-w-6xl mx-auto">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="songs">Song Management</TabsTrigger>
            <TabsTrigger value="weekly">Weekly Selection</TabsTrigger>
          </TabsList>

          {/* Song Management Tab */}
          <TabsContent value="songs" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className={`text-2xl font-semibold ${fontSizeClass}`}>Songs Database</h2>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => setEditingSong(null)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add New Song
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>
                      {editingSong ? "Edit Song" : "Add New Song"}
                    </DialogTitle>
                    <DialogDescription>
                      {editingSong ? "Update the song details below" : "Create a new song for the database"}
                    </DialogDescription>
                  </DialogHeader>
                  <SongForm
                    song={editingSong}
                    onSave={handleSaveSong}
                    onCancel={() => {
                      setIsDialogOpen(false)
                      setEditingSong(null)
                    }}
                  />
                </DialogContent>
              </Dialog>
            </div>

            <Card>
              <CardContent className="p-0">
                <ScrollArea className="h-96">
                  <div className="space-y-2 p-4">
                    {songs.map((song) => (
                      <div
                        key={song.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
                      >
                        <div className="flex-1">
                          <h3 className={`font-medium ${fontSizeClass}`}>{song.title}</h3>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {song.alternateTitles.map((title, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {title}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingSong(song)
                              setIsDialogOpen(true)
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteSong(song.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Weekly Selection Tab */}
          <TabsContent value="weekly" className="space-y-6">
            <h2 className={`text-2xl font-semibold ${fontSizeClass}`}>Weekly Song Selection</h2>
            
            <div className="grid gap-6 md:grid-cols-3">
              {/* Starting Song */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-green-600">Starting Song</CardTitle>
                  <CardDescription>This week's opening worship song</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {weeklySongs.starting && (
                    <div className="p-3 bg-muted rounded">
                      <p className={`font-medium ${fontSizeClass}`}>{weeklySongs.starting.title}</p>
                    </div>
                  )}
                  <Select
                    value={weeklySongs.starting?.id || ""}
                    onValueChange={(value) => handleUpdateWeeklySongs('starting', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select starting song" />
                    </SelectTrigger>
                    <SelectContent>
                      {songs.map((song) => (
                        <SelectItem key={song.id} value={song.id}>
                          {song.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>

              {/* Music Song */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-blue-600">Music Song</CardTitle>
                  <CardDescription>This week's special music presentation</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {weeklySongs.music && (
                    <div className="p-3 bg-muted rounded">
                      <p className={`font-medium ${fontSizeClass}`}>{weeklySongs.music.title}</p>
                    </div>
                  )}
                  <Select
                    value={weeklySongs.music?.id || ""}
                    onValueChange={(value) => handleUpdateWeeklySongs('music', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select music song" />
                    </SelectTrigger>
                    <SelectContent>
                      {songs.map((song) => (
                        <SelectItem key={song.id} value={song.id}>
                          {song.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>

              {/* Worship Song */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-purple-600">Worship Song</CardTitle>
                  <CardDescription>This week's main worship song</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {weeklySongs.worship && (
                    <div className="p-3 bg-muted rounded">
                      <p className={`font-medium ${fontSizeClass}`}>{weeklySongs.worship.title}</p>
                    </div>
                  )}
                  <Select
                    value={weeklySongs.worship?.id || ""}
                    onValueChange={(value) => handleUpdateWeeklySongs('worship', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select worship song" />
                    </SelectTrigger>
                    <SelectContent>
                      {songs.map((song) => (
                        <SelectItem key={song.id} value={song.id}>
                          {song.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

function SongForm({ 
  song, 
  onSave, 
  onCancel 
}: { 
  song: Song | null
  onSave: (data: Partial<Song>) => void
  onCancel: () => void
}) {
  const [formData, setFormData] = useState({
    title: song?.title || "",
    alternateTitles: song?.alternateTitles.join(", ") || "",
    lyrics: song?.lyrics || ""
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({
      ...formData,
      alternateTitles: formData.alternateTitles.split(",").map(t => t.trim()).filter(t => t)
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Song Title</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="Enter song title"
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="alternateTitles">Alternate Titles (comma-separated)</Label>
        <Input
          id="alternateTitles"
          value={formData.alternateTitles}
          onChange={(e) => setFormData({ ...formData, alternateTitles: e.target.value })}
          placeholder="yudha, yooda, yudha stuti"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="lyrics">Lyrics</Label>
        <ScrollArea className="h-64 w-full rounded-md border">
          <Textarea
            id="lyrics"
            value={formData.lyrics}
            onChange={(e) => setFormData({ ...formData, lyrics: e.target.value })}
            placeholder="Enter song lyrics"
            className="min-h-full border-0 resize-none focus:ring-0"
            required
          />
        </ScrollArea>
      </div>
      
      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          {song ? "Update Song" : "Create Song"}
        </Button>
      </div>
    </form>
  )
}
"use client"

import { useState, useEffect } from "react"
// import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Search, Music, BookOpen, Star, Settings, RefreshCw, ChevronDown, ChevronUp } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { FontSizeControls, useFontSize } from "@/components/font-size-controls"
import { useToast } from "@/hooks/use-toast"
import { Song } from "@/types"

export default function Home() {
  // const { data: session } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedSong, setSelectedSong] = useState<Song | null>(null)
  const [songs, setSongs] = useState<Song[]>([])
  const [weeklySongs, setWeeklySongs] = useState<{
    starting: Song | null
    music: Song | null
    worship: Song | null
  }>({ starting: null, music: null, worship: null })
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [isManualRefresh, setIsManualRefresh] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const [expandedPanels, setExpandedPanels] = useState<{[key: string]: boolean}>({
    starting: false,
    music: false,
    worship: false,
    songLyrics: false
  })
  const { fontSizeClass } = useFontSize()

  useEffect(() => {
    const fetchData = async () => {
      try {
        await Promise.all([
          fetchSongs(),
          fetchWeeklySongs()
        ])
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchData()
    
    // Set up periodic refresh for weekly songs (every 15 seconds)
    const interval = setInterval(() => {
      fetchWeeklySongs()
    }, 15000) // Refresh every 15 seconds
    
    return () => clearInterval(interval)
  }, [])

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
    }
  }

  const fetchWeeklySongs = async () => {
    try {
      // Add cache-busting parameter
      const cacheBuster = new Date().getTime()
      const response = await fetch(`/api/weekly-songs?t=${cacheBuster}`)
      if (response.ok) {
        const data = await response.json()
        setWeeklySongs(data)
        setLastUpdated(new Date())
        if (isManualRefresh) {
          toast({
            title: "Songs updated",
            description: "Weekly song selections have been refreshed",
          })
          setIsManualRefresh(false)
        }
      }
    } catch (error) {
      console.error("Error fetching weekly songs:", error)
      if (isManualRefresh) {
        toast({
          title: "Error",
          description: "Failed to refresh weekly songs",
          variant: "destructive",
        })
        setIsManualRefresh(false)
      }
    }
  }

  const handleRefreshWeeklySongs = () => {
    setIsManualRefresh(true)
    setRefreshKey(prev => prev + 1) // Force re-render
    fetchWeeklySongs()
    toast({
      title: "Refreshing songs...",
      description: "Fetching latest weekly song selections",
    })
  }

  const togglePanel = (panelType: 'starting' | 'music' | 'worship' | 'songLyrics') => {
    setExpandedPanels(prev => ({
      ...prev,
      [panelType]: !prev[panelType]
    }))
  }

  const filteredSongs = songs.filter(song => {
    const query = searchQuery.toLowerCase()
    return song.title.toLowerCase().includes(query) ||
           song.alternateTitles.some(title => title.toLowerCase().includes(query))
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950 flex items-center justify-center">
        <div className="text-center">
          <Music className="h-16 w-16 mx-auto mb-4 text-purple-600 animate-pulse" />
          <p className="text-lg text-purple-700">Loading Harmony Choir Portal...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4">
          <div className="text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-3 mb-4">
              <img src="/logo.png" alt="Harmony Choir Portal" className="h-12 w-12" />
              <h1 className="text-4xl font-bold text-purple-900 dark:text-purple-100">
                Harmony Choir Portal
              </h1>
            </div>
            <p className="text-lg text-purple-700 dark:text-purple-300">
              Your church choir's digital songbook and weekly worship guide
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <FontSizeControls />
            <ThemeToggle />
            {/* {session?.user?.role === "admin" && (
              <Button onClick={() => router.push("/admin")}>
                <Settings className="h-4 w-4 mr-2" />
                Admin
              </Button>
            )} */}
          </div>
        </div>

        <Tabs defaultValue="weekly" className="w-full max-w-6xl mx-auto">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="weekly" className="flex items-center gap-2">
              <Star className="h-4 w-4" />
              Weekly Songs
            </TabsTrigger>
            <TabsTrigger value="database" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Song Database
            </TabsTrigger>
          </TabsList>

          {/* Weekly Songs Tab */}
          <TabsContent value="weekly" className="space-y-6" key={refreshKey}>
            <div className="flex justify-between items-center">
              <div>
                <h2 className={`text-2xl font-semibold ${fontSizeClass}`}>This Week's Songs</h2>
                {lastUpdated && (
                  <p className="text-sm text-muted-foreground">
                    Last updated: {lastUpdated.toLocaleTimeString()}
                  </p>
                )}
              </div>
              <Button onClick={handleRefreshWeeklySongs} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
            
            <div className="grid gap-6 md:grid-cols-3">
              {/* Starting Song */}
              <Card className={`h-full transition-all duration-300 ${expandedPanels.starting ? 'md:col-span-3' : ''}`}>
                <CardHeader 
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => togglePanel('starting')}
                >
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-green-600">
                      <Star className="h-5 w-5" />
                      Starting Song
                    </CardTitle>
                    {expandedPanels.starting ? (
                      <ChevronUp className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                  <CardDescription>
                    This week's opening worship song
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {weeklySongs.starting ? (
                    <div className="space-y-4">
                      <h3 className={`text-lg font-semibold ${fontSizeClass}`}>{weeklySongs.starting.title}</h3>
                      <div className={`${expandedPanels.starting ? 'min-h-[500px] max-h-[80vh]' : 'h-64'} w-full rounded-md border p-4 overflow-auto`}>
                        <pre className={`whitespace-pre-wrap font-sans ${fontSizeClass}`}>
                          {weeklySongs.starting.lyrics}
                        </pre>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center text-muted-foreground py-8">
                      <Music className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p className={fontSizeClass}>No starting song set for this week</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Music Song */}
              <Card className={`h-full transition-all duration-300 ${expandedPanels.music ? 'md:col-span-3' : ''}`}>
                <CardHeader 
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => togglePanel('music')}
                >
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-blue-600">
                      <Music className="h-5 w-5" />
                      Music Song
                    </CardTitle>
                    {expandedPanels.music ? (
                      <ChevronUp className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                  <CardDescription>
                    This week's special music presentation
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {weeklySongs.music ? (
                    <div className="space-y-4">
                      <h3 className={`text-lg font-semibold ${fontSizeClass}`}>{weeklySongs.music.title}</h3>
                      <div className={`${expandedPanels.music ? 'min-h-[500px] max-h-[80vh]' : 'h-64'} w-full rounded-md border p-4 overflow-auto`}>
                        <pre className={`whitespace-pre-wrap font-sans ${fontSizeClass}`}>
                          {weeklySongs.music.lyrics}
                        </pre>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center text-muted-foreground py-8">
                      <Music className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p className={fontSizeClass}>No music song set for this week</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Worship Song */}
              <Card className={`h-full transition-all duration-300 ${expandedPanels.worship ? 'md:col-span-3' : ''}`}>
                <CardHeader 
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => togglePanel('worship')}
                >
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-purple-600">
                      <BookOpen className="h-5 w-5" />
                      Worship Song
                    </CardTitle>
                    {expandedPanels.worship ? (
                      <ChevronUp className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                  <CardDescription>
                    This week's main worship song
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {weeklySongs.worship ? (
                    <div className="space-y-4">
                      <h3 className={`text-lg font-semibold ${fontSizeClass}`}>{weeklySongs.worship.title}</h3>
                      <div className={`${expandedPanels.worship ? 'min-h-[500px] max-h-[80vh]' : 'h-64'} w-full rounded-md border p-4 overflow-auto`}>
                        <pre className={`whitespace-pre-wrap font-sans ${fontSizeClass}`}>
                          {weeklySongs.worship.lyrics}
                        </pre>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center text-muted-foreground py-8">
                      <Music className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p className={fontSizeClass}>No worship song set for this week</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Song Database Tab */}
          <TabsContent value="database" className="space-y-6">
            {/* Search Bar */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search songs by title or alternate names (తెలుగు/English)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Song List */}
            <div className="grid gap-4 lg:grid-cols-2">
              {/* Song Titles List */}
              <Card>
                <CardHeader>
                  <CardTitle>Song Titles</CardTitle>
                  <CardDescription>
                    Click on a song to view its lyrics
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-96 w-full">
                    <div className="space-y-2">
                      {filteredSongs.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">
                          No songs found matching your search
                        </p>
                      ) : (
                        filteredSongs.map((song) => (
                          <Button
                            key={song.id}
                            variant={selectedSong?.id === song.id ? "default" : "ghost"}
                            className="w-full justify-start text-left h-auto p-4"
                            onClick={() => setSelectedSong(song)}
                          >
                            <div className="space-y-1">
                              <div className={`font-medium ${fontSizeClass}`}>{song.title}</div>
                              <div className="flex flex-wrap gap-1">
                                {song.alternateTitles.map((title, index) => (
                                  <Badge key={index} variant="secondary" className="text-xs">
                                    {title}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </Button>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Selected Song Lyrics */}
              <Card className={`${expandedPanels.songLyrics ? 'md:col-span-2' : ''}`}>
                <CardHeader 
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => togglePanel('songLyrics')}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Song Lyrics</CardTitle>
                      <CardDescription>
                        {selectedSong ? selectedSong.title : "Select a song to view lyrics"}
                      </CardDescription>
                    </div>
                    {selectedSong && (
                      expandedPanels.songLyrics ? (
                        <ChevronUp className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      )
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {selectedSong ? (
                    <div className={`${expandedPanels.songLyrics ? 'min-h-[500px] max-h-[80vh]' : 'h-96'} w-full rounded-md border p-4 overflow-auto`}>
                      <pre className={`whitespace-pre-wrap font-sans ${fontSizeClass} leading-relaxed`}>
                        {selectedSong.lyrics}
                      </pre>
                    </div>
                  ) : (
                    <div className="text-center text-muted-foreground py-16">
                      <BookOpen className="h-16 w-16 mx-auto mb-4 opacity-50" />
                      <p className={fontSizeClass}>Select a song from the list to view its lyrics</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

type Song = {
  id: string
  title: string
  alternateTitles: string[]
  lyrics: string
}
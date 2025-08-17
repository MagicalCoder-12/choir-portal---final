import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const db = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 12)
  const admin = await db.user.upsert({
    where: { email: 'admin@harmonychoir.com' },
    update: {},
    create: {
      email: 'admin@harmonychoir.com',
      name: 'Admin User',
      password: adminPassword,
      role: 'admin'
    }
  })

  console.log('Admin user created:', admin.email)

  // Sample songs data
  const songs = [
    {
      title: 'యూదా స్తుతి',
      alternateTitles: JSON.stringify(['yudha', 'yooda', 'yudha stuti']),
      lyrics: `యూదా స్తుతి

యూదా యూదా యూదా
దేవుని స్తుతి
యూదా యూదా యూదా
దేవుని స్తుతి

ప్రతి రోజు ప్రతి క్షణం
దేవుని స్తుతించండి
యూదా యూదా యూదా
దేవుని స్తుతి

ఆయన గొప్ప దేవుడు
ఆయన ప్రేమాశీర్వాదము
యూదా యూదా యూదా
దేవుని స్తుతి`
    },
    {
      title: 'ప్రభువైన దేవుడు',
      alternateTitles: JSON.stringify(['prabhuva', 'lord god', 'prabhu']),
      lyrics: `ప్రభువైన దేవుడు

ప్రభువైన దేవుడు నన్ను కాపాడుతాడు
ప్రతి సందర్భంలో నా వెంట ఉంటాడు
ప్రభువైన దేవుడు నన్ను ప్రేమిస్తాడు
ఎప్పటికీ నా వెంట ఉంటాడు

ఆయన శక్తి నా బలం
ఆయన వాక్యం నా దీపం
ప్రభువైన దేవుడు నన్ను నడిపిస్తాడు
ఎప్పటికీ నా వెంట ఉంటాడు`
    },
    {
      title: 'దేవుని ప్రేమ',
      alternateTitles: JSON.stringify(['devu prema', 'gods love', 'love of god']),
      lyrics: `దేవుని ప్రేమ

దేవుని ప్రేమ అద్భుతమైనది
దేవుని ప్రేమ అనంతమైనది
దేవుని ప్రేమ నిత్యమైనది
దేవుని ప్రేమ సత్యమైనది

ఆ ప్రేమ నా జీవితాన్ని మార్చింది
ఆ ప్రేమ నా హృదయాన్ని ఆకర్షించింది
దేవుని ప్రేమ అద్భుతమైనది
దేవుని ప్రేమ అనంతమైనది`
    },
    {
      title: 'కీర్తనలు పాడుదాం',
      alternateTitles: JSON.stringify(['keerthanalu', 'sing praises', 'worship songs']),
      lyrics: `కీర్తనలు పాడుదాం

కీర్తనలు పాడుదాం దేవునికి
కీర్తనలు పాడుదాం రాజుకి
ఆయనే మన రక్షకుడు
ఆయనే మన ఆశ్రయం

ఆయన దయ ఎంతో గొప్పది
ఆయన కరుణ ఎంతో విశాలమైనది
కీర్తనలు పాడుదాం దేవునికి
కీర్తనలు పాడుదాం రాజుకి`
    },
    {
      title: 'విశ్వాసం వద్దు',
      alternateTitles: JSON.stringify(['vishwasam', 'faith', 'belief']),
      lyrics: `విశ్వాసం వద్దు

విశ్వాసం వద్దు, విశ్వాసం వద్దు
దేవునిపై విశ్వాసం వద్దు
ఆయన ఎప్పుడూ మనతో ఉంటాడు
ఆయన ఎప్పుడూ మనల్ని కాపాడతాడు

కష్టాలలో ఆయనే బలం
సందేహాలలో ఆయనే వెలుగు
విశ్వాసం వద్దు, విశ్వాసం వద్దు
దేవునిపై విశ్వాసం వద్దు`
    }
  ]

  // Create songs
  const createdSongs = []
  for (const song of songs) {
    const createdSong = await db.song.create({
      data: song
    })
    createdSongs.push(createdSong)
  }

  // Create weekly songs entry for the current week
  const today = new Date()
  const sunday = new Date(today)
  const dayOfWeek = sunday.getDay()
  const diff = sunday.getDate() - dayOfWeek
  sunday.setDate(diff)
  sunday.setHours(0, 0, 0, 0)

  // Use the first three songs as weekly selections
  await db.weeklySong.create({
    data: {
      weekStart: sunday,
      startingSong: createdSongs[0].id,
      musicSong: createdSongs[1].id,
      worshipSong: createdSongs[2].id,
      userId: admin.id
    }
  })

  console.log('Database seeded successfully!')
  console.log('Admin login: admin@harmonychoir.com / admin123')
  console.log('Weekly songs created with:')
  console.log(`- Starting: ${createdSongs[0].title}`)
  console.log(`- Music: ${createdSongs[1].title}`)
  console.log(`- Worship: ${createdSongs[2].title}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
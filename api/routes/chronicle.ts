import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { Router, type Request, type Response } from 'express'
import multer from 'multer'
import { v4 } from 'uuid'
import { readDB, writeDB } from '../db.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const UPLOADS_DIR = path.join(__dirname, '..', 'uploads')

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true })
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOADS_DIR)
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname)
    cb(null, `${v4()}${ext}`)
  },
})

const upload = multer({ storage })

const router = Router()

router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const db = readDB()
    const sorted = [...db.chronicleEntries].sort((a: any, b: any) => {
      return new Date(b.date).getTime() - new Date(a.date).getTime()
    })
    res.json({ success: true, data: sorted })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get chronicle entries' })
  }
})

router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, description, date, type, createdBy, mediaUrl } = req.body
    if (!title || !date || !type) {
      res.status(400).json({ success: false, error: '标题、日期和类型不能为空' })
      return
    }
    if (!['photo', 'story', 'event'].includes(type)) {
      res.status(400).json({ success: false, error: '类型必须为照片、故事或事件' })
      return
    }

    const db = readDB()
    const newEntry = {
      id: v4(),
      title,
      description: description || '',
      date,
      type,
      mediaUrl: mediaUrl || null,
      createdBy: createdBy || 'admin',
      createdAt: new Date().toISOString().slice(0, 10),
    }

    db.chronicleEntries.push(newEntry)
    writeDB(db)
    res.status(201).json({ success: true, data: newEntry })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to create chronicle entry' })
  }
})

router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const db = readDB()
    const idx = db.chronicleEntries.findIndex((e: any) => e.id === req.params.id)
    if (idx === -1) {
      res.status(404).json({ success: false, error: 'Chronicle entry not found' })
      return
    }
    const deleted = db.chronicleEntries.splice(idx, 1)[0]
    writeDB(db)
    res.json({ success: true, data: deleted })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to delete chronicle entry' })
  }
})

router.post('/upload', upload.single('file'), async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, error: 'No file uploaded' })
      return
    }
    const urlPath = `/api/uploads/${req.file.filename}`
    res.json({ success: true, data: { url: urlPath, filename: req.file.filename } })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to upload file' })
  }
})

export default router

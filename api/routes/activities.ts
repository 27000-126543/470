import { Router, type Request, type Response } from 'express'
import { v4 } from 'uuid'
import { readDB, writeDB } from '../db.js'

const router = Router()

router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const db = readDB()
    res.json({ success: true, data: db.activities })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get activities' })
  }
})

router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, description, date, location, createdBy } = req.body
    if (!title || !date || !location) {
      res.status(400).json({ success: false, error: '标题、日期和地点不能为空' })
      return
    }

    const db = readDB()
    const newActivity = {
      id: v4(),
      title,
      description: description || '',
      date,
      location,
      createdBy: createdBy || 'admin',
      participants: [],
      status: 'upcoming',
      createdAt: new Date().toISOString().slice(0, 10),
    }

    db.activities.push(newActivity)
    writeDB(db)
    res.status(201).json({ success: true, data: newActivity })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to create activity' })
  }
})

router.post('/:id/join', async (req: Request, res: Response): Promise<void> => {
  try {
    const { memberId } = req.body
    if (!memberId) {
      res.status(400).json({ success: false, error: 'memberId is required' })
      return
    }

    const db = readDB()
    const activity = db.activities.find((a: any) => a.id === req.params.id)
    if (!activity) {
      res.status(404).json({ success: false, error: 'Activity not found' })
      return
    }

    if (!activity.participants.includes(memberId)) {
      activity.participants.push(memberId)
      writeDB(db)
    }

    res.json({ success: true, data: activity })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to join activity' })
  }
})

router.delete('/:id/join', async (req: Request, res: Response): Promise<void> => {
  try {
    const { memberId } = req.body
    if (!memberId) {
      res.status(400).json({ success: false, error: 'memberId is required' })
      return
    }

    const db = readDB()
    const activity = db.activities.find((a: any) => a.id === req.params.id)
    if (!activity) {
      res.status(404).json({ success: false, error: 'Activity not found' })
      return
    }

    activity.participants = activity.participants.filter((p: string) => p !== memberId)
    writeDB(db)
    res.json({ success: true, data: activity })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to leave activity' })
  }
})

router.put('/:id/status', async (req: Request, res: Response): Promise<void> => {
  try {
    const { status } = req.body
    if (!status) {
      res.status(400).json({ success: false, error: 'status is required' })
      return
    }

    const db = readDB()
    const activity = db.activities.find((a: any) => a.id === req.params.id)
    if (!activity) {
      res.status(404).json({ success: false, error: 'Activity not found' })
      return
    }

    activity.status = status
    writeDB(db)
    res.json({ success: true, data: activity })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update activity status' })
  }
})

export default router

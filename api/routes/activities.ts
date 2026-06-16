import { Router, type Request, type Response } from 'express'
import { v4 } from 'uuid'
import { readDB, writeDB } from '../db.js'

const normalizeParticipants = (participants: any[]): any[] => {
  return participants.map((p) => {
    if (typeof p === 'string') {
      return {
        memberId: p,
        bringFamily: false,
        familyCount: 0,
        remark: '',
        phone: '',
      }
    }
    return {
      memberId: p.memberId,
      bringFamily: p.bringFamily || false,
      familyCount: p.familyCount || 0,
      remark: p.remark || '',
      phone: p.phone || '',
    }
  })
}

router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const db = readDB()
    const activities = db.activities.map((a: any) => ({
      ...a,
      participants: normalizeParticipants(a.participants || []),
    }))
    res.json({ success: true, data: activities })
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
    const { memberId, bringFamily, familyCount, remark, phone } = req.body
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

    activity.participants = normalizeParticipants(activity.participants || [])

    const existingIndex = activity.participants.findIndex((p: any) => p.memberId === memberId)
    if (existingIndex >= 0) {
      activity.participants[existingIndex] = {
        memberId,
        bringFamily: bringFamily || false,
        familyCount: familyCount || 0,
        remark: remark || '',
        phone: phone || '',
      }
    } else {
      activity.participants.push({
        memberId,
        bringFamily: bringFamily || false,
        familyCount: familyCount || 0,
        remark: remark || '',
        phone: phone || '',
      })
    }

    writeDB(db)

    const updatedActivity = {
      ...activity,
      participants: normalizeParticipants(activity.participants),
    }
    res.json({ success: true, data: updatedActivity })
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

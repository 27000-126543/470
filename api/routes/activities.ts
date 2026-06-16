import { Router, type Request, type Response } from 'express'
import { v4 } from 'uuid'
import { readDB, writeDB } from '../db.js'

const router = Router()

const normalizeParticipants = (participants: any[]): any[] => {
  return participants.map((p) => {
    if (typeof p === 'string') {
      return {
        memberId: p,
        bringFamily: false,
        familyCount: 0,
        remark: '',
        phone: '',
        groupName: '',
      }
    }
    return {
      memberId: p.memberId,
      bringFamily: p.bringFamily || false,
      familyCount: p.familyCount || 0,
      remark: p.remark || '',
      phone: p.phone || '',
      groupName: p.groupName || '',
    }
  })
}

const normalizeTodos = (todos: any[]): any[] => {
  return (todos || []).map((t) => ({
    id: t.id,
    title: t.title,
    assignee: t.assignee || '',
    dueDate: t.dueDate || '',
    completed: t.completed || false,
    createdAt: t.createdAt || new Date().toISOString().slice(0, 10),
  }))
}

router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const db = readDB()
    const now = new Date()
    const today = now.toISOString().slice(0, 10)
    let needUpdate = false

    const activities = db.activities.map((a: any) => {
      if (a.date < today && a.status !== 'ended') {
        a.status = 'ended'
        needUpdate = true
      } else if (a.date >= today && a.status === 'ended') {
        a.status = 'upcoming'
        needUpdate = true
      }
      return {
        ...a,
        participants: normalizeParticipants(a.participants || []),
        todos: normalizeTodos(a.todos || []),
      }
    })

    if (needUpdate) {
      writeDB(db)
    }

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
      todos: [],
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
    const { memberId, bringFamily, familyCount, remark, phone, groupName } = req.body
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

    const effectiveBringFamily = bringFamily || false
    const effectiveFamilyCount = effectiveBringFamily ? (familyCount || 0) : 0

    const existingIndex = activity.participants.findIndex((p: any) => p.memberId === memberId)
    if (existingIndex >= 0) {
      activity.participants[existingIndex] = {
        memberId,
        bringFamily: effectiveBringFamily,
        familyCount: effectiveFamilyCount,
        remark: remark || '',
        phone: phone || '',
        groupName: groupName || '',
      }
    } else {
      activity.participants.push({
        memberId,
        bringFamily: effectiveBringFamily,
        familyCount: effectiveFamilyCount,
        remark: remark || '',
        phone: phone || '',
        groupName: groupName || '',
      })
    }

    writeDB(db)

    const updatedActivity = {
      ...activity,
      participants: normalizeParticipants(activity.participants),
      todos: normalizeTodos(activity.todos || []),
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

    activity.participants = normalizeParticipants(activity.participants || [])
    activity.participants = activity.participants.filter((p: any) => p.memberId !== memberId)
    writeDB(db)

    const updatedActivity = {
      ...activity,
      participants: normalizeParticipants(activity.participants),
      todos: normalizeTodos(activity.todos || []),
    }
    res.json({ success: true, data: updatedActivity })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to leave activity' })
  }
})

router.post('/:id/todos', async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, assignee, dueDate } = req.body
    if (!title || !title.trim()) {
      res.status(400).json({ success: false, error: '待办标题不能为空' })
      return
    }

    const db = readDB()
    const activity = db.activities.find((a: any) => a.id === req.params.id)
    if (!activity) {
      res.status(404).json({ success: false, error: 'Activity not found' })
      return
    }

    activity.todos = activity.todos || []
    const newTodo = {
      id: v4(),
      title: title.trim(),
      assignee: assignee || '',
      dueDate: dueDate || '',
      completed: false,
      createdAt: new Date().toISOString().slice(0, 10),
    }
    activity.todos.push(newTodo)
    writeDB(db)

    res.json({ success: true, data: newTodo, todos: normalizeTodos(activity.todos) })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to add todo' })
  }
})

router.put('/:id/todos/:todoId', async (req: Request, res: Response): Promise<void> => {
  try {
    const db = readDB()
    const activity = db.activities.find((a: any) => a.id === req.params.id)
    if (!activity) {
      res.status(404).json({ success: false, error: 'Activity not found' })
      return
    }

    activity.todos = activity.todos || []
    const todoIndex = activity.todos.findIndex((t: any) => t.id === req.params.todoId)
    if (todoIndex < 0) {
      res.status(404).json({ success: false, error: 'Todo not found' })
      return
    }

    const { title, assignee, dueDate, completed } = req.body
    if (title !== undefined) activity.todos[todoIndex].title = title
    if (assignee !== undefined) activity.todos[todoIndex].assignee = assignee
    if (dueDate !== undefined) activity.todos[todoIndex].dueDate = dueDate
    if (completed !== undefined) activity.todos[todoIndex].completed = completed

    writeDB(db)
    res.json({ success: true, data: activity.todos[todoIndex], todos: normalizeTodos(activity.todos) })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update todo' })
  }
})

router.delete('/:id/todos/:todoId', async (req: Request, res: Response): Promise<void> => {
  try {
    const db = readDB()
    const activity = db.activities.find((a: any) => a.id === req.params.id)
    if (!activity) {
      res.status(404).json({ success: false, error: 'Activity not found' })
      return
    }

    activity.todos = (activity.todos || []).filter((t: any) => t.id !== req.params.todoId)
    writeDB(db)
    res.json({ success: true, todos: normalizeTodos(activity.todos) })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to delete todo' })
  }
})

router.put('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, description, date, location } = req.body
    if (!title || !date || !location) {
      res.status(400).json({ success: false, error: '标题、日期和地点不能为空' })
      return
    }

    const db = readDB()
    const activity = db.activities.find((a: any) => a.id === req.params.id)
    if (!activity) {
      res.status(404).json({ success: false, error: 'Activity not found' })
      return
    }

    activity.title = title
    activity.description = description || ''
    activity.date = date
    activity.location = location

    const now = new Date()
    const today = now.toISOString().slice(0, 10)
    if (date < today && activity.status !== 'ended') {
      activity.status = 'ended'
    } else if (date >= today && activity.status === 'ended') {
      activity.status = 'upcoming'
    }

    writeDB(db)

    const updatedActivity = {
      ...activity,
      participants: normalizeParticipants(activity.participants || []),
      todos: normalizeTodos(activity.todos || []),
    }
    res.json({ success: true, data: updatedActivity })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update activity' })
  }
})

router.get('/:id/export', async (req: Request, res: Response): Promise<void> => {
  try {
    const db = readDB()
    const activity = db.activities.find((a: any) => a.id === req.params.id)
    if (!activity) {
      res.status(404).json({ success: false, error: 'Activity not found' })
      return
    }

    const participants = normalizeParticipants(activity.participants || [])
    const members = db.members || []
    const getMemberName = (id: string) => members.find((m: any) => m.id === id)?.name || '未知成员'

    const grouped: Record<string, any[]> = {}
    for (const p of participants) {
      const group = p.groupName || '未分组'
      if (!grouped[group]) grouped[group] = []
      grouped[group].push(p)
    }

    const bom = '\uFEFF'
    let csv = bom
    csv += `活动：,${activity.title}\n`
    csv += `日期：,${activity.date}\n`
    csv += `地点：,${activity.location}\n\n`

    let totalMembers = 0
    let totalWithFamily = 0

    for (const [groupName, list] of Object.entries(grouped)) {
      const groupMembers = list.length
      const groupFamilies = list.reduce((s, p) => s + (p.familyCount || 0), 0)
      const groupTotal = groupMembers + groupFamilies
      totalMembers += groupMembers
      totalWithFamily += groupTotal

      csv += `【${groupName}】成员数:${groupMembers} 家属数:${groupFamilies} 合计:${groupTotal}\n`
      csv += '姓名,是否携带家属,家属人数,联系电话,备注\n'
      for (const p of list) {
        csv += `${getMemberName(p.memberId)},${p.bringFamily ? '是' : '否'},${p.bringFamily ? (p.familyCount || 0) : 0},${p.phone || ''},"${(p.remark || '').replace(/"/g, '""')}"\n`
      }
      csv += '\n'
    }

    csv += `总计：,成员 ${totalMembers} 人，含家属共 ${totalWithFamily} 人\n`

    const filename = encodeURIComponent(`${activity.title}-报名名单.csv`)
    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${filename}`)
    res.send(csv)
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to export participants' })
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

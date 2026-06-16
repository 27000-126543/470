import { Router, type Request, type Response } from 'express'
import { v4 } from 'uuid'
import { readDB, writeDB } from '../db.js'

const router = Router()

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/

function isValidDate(dateStr: string): boolean {
  if (!DATE_REGEX.test(dateStr)) return false
  const d = new Date(dateStr)
  return d instanceof Date && !isNaN(d.getTime()) && d.toISOString().slice(0, 10) === dateStr
}

function validateMember(body: any): string | null {
  if (!body.name || !body.name.trim()) return '姓名不能为空'
  if (!body.birthDate) return '出生日期不能为空'
  if (!isValidDate(body.birthDate)) return '出生日期格式无效，请使用YYYY-MM-DD格式'
  if (body.deathDate && !isValidDate(body.deathDate)) return '逝世日期格式无效，请使用YYYY-MM-DD格式'
  if (!body.gender) return '性别不能为空'
  if (!['male', 'female'].includes(body.gender)) return '性别必须为男或女'
  if (!body.relationType) return '关系类型不能为空'
  if (!['parent', 'child', 'spouse', 'sibling'].includes(body.relationType)) return '关系类型必须为父母/子女/配偶/兄弟姐妹'
  if (['child', 'spouse', 'sibling'].includes(body.relationType) && !body.relatedToId) return '选择子女、配偶或兄弟姐妹关系时，必须选择关联成员'
  return null
}

router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const db = readDB()
    res.json({ success: true, data: db.members, familyTrees: db.familyTrees })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get members' })
  }
})

router.get('/tree', async (req: Request, res: Response): Promise<void> => {
  try {
    const db = readDB()
    const members = db.members || []
    const roots = members.filter((m: any) => !m.relatedToId || m.relationType === 'parent')
    const buildTree = (parentId: string): any[] => {
      const children = members.filter((m: any) => m.relatedToId === parentId && m.relationType === 'child')
      const spouses = members.filter((m: any) => m.relatedToId === parentId && m.relationType === 'spouse')
      const siblings = members.filter((m: any) => m.relatedToId === parentId && m.relationType === 'sibling')
      return children.map((child: any) => ({
        ...child,
        spouses: spouses.map((s: any) => ({ ...s })),
        siblings: siblings.map((s: any) => ({ ...s })),
        children: buildTree(child.id),
      }))
    }
    const tree = roots.map((root: any) => {
      const spouses = members.filter((m: any) => m.relatedToId === root.id && m.relationType === 'spouse')
      const children = members.filter((m: any) => m.relatedToId === root.id && m.relationType === 'child')
      return {
        ...root,
        spouses: spouses.map((s: any) => ({ ...s })),
        children: children.map((child: any) => ({
          ...child,
          spouses: members.filter((m: any) => m.relatedToId === child.id && m.relationType === 'spouse').map((s: any) => ({ ...s })),
          children: buildTree(child.id),
        })),
      }
    })
    res.json({ success: true, data: tree })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get tree' })
  }
})

router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const validationError = validateMember(req.body)
    if (validationError) {
      res.status(400).json({ success: false, error: validationError })
      return
    }

    const db = readDB()
    const { name, birthDate, deathDate, gender, relationType, relatedToId, familyTreeId } = req.body

    if (relatedToId && relationType === 'child') {
      const parent = db.members.find((m: any) => m.id === relatedToId)
      if (parent) {
        const parentBirth = new Date(parent.birthDate).getFullYear()
        const childBirth = new Date(birthDate).getFullYear()
        if (childBirth - parentBirth < 15) {
          res.status(400).json({ success: false, error: '父母与子女的年龄差必须至少15岁' })
          return
        }
      }
    }

    const newMember = {
      id: v4(),
      name: name.trim(),
      birthDate,
      deathDate: deathDate || null,
      gender,
      relationType,
      relatedToId: relatedToId || null,
      familyTreeId: familyTreeId || 'default',
      avatar: null,
      createdAt: new Date().toISOString().slice(0, 10),
    }

    db.members.push(newMember)
    writeDB(db)
    res.status(201).json({ success: true, data: newMember })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to create member' })
  }
})

router.put('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const db = readDB()
    const idx = db.members.findIndex((m: any) => m.id === req.params.id)
    if (idx === -1) {
      res.status(404).json({ success: false, error: 'Member not found' })
      return
    }

    if (req.body.birthDate && !isValidDate(req.body.birthDate)) {
      res.status(400).json({ success: false, error: '出生日期格式无效，请使用YYYY-MM-DD格式' })
      return
    }
    if (req.body.deathDate && !isValidDate(req.body.deathDate)) {
      res.status(400).json({ success: false, error: '逝世日期格式无效，请使用YYYY-MM-DD格式' })
      return
    }
    if (req.body.gender && !['male', 'female'].includes(req.body.gender)) {
      res.status(400).json({ success: false, error: '性别必须为男或女' })
      return
    }
    if (req.body.relationType && !['parent', 'child', 'spouse', 'sibling'].includes(req.body.relationType)) {
      res.status(400).json({ success: false, error: '关系类型必须为父母/子女/配偶/兄弟姐妹' })
      return
    }

    const updated = { ...db.members[idx], ...req.body, id: db.members[idx].id }
    db.members[idx] = updated
    writeDB(db)
    res.json({ success: true, data: updated })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update member' })
  }
})

router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const db = readDB()
    const idx = db.members.findIndex((m: any) => m.id === req.params.id)
    if (idx === -1) {
      res.status(404).json({ success: false, error: 'Member not found' })
      return
    }
    const deleted = db.members.splice(idx, 1)[0]
    db.members = db.members.filter((m: any) => m.relatedToId !== req.params.id)
    writeDB(db)
    res.json({ success: true, data: deleted })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to delete member' })
  }
})

export default router

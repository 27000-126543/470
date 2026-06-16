import { Router, type Request, type Response } from 'express'
import { readDB } from '../db.js'

const router = Router()

const GIFT_SUGGESTIONS = [
  '精选茶叶礼盒',
  '健康保健品',
  '定制相册',
  '鲜花束',
  '购物卡',
  '书籍',
]

function formatDateLocal(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function getNextBirthday(birthDate: string, now: Date): Date {
  const [by, bm, bd] = birthDate.split('-').map(Number)
  const currentYear = now.getFullYear()
  let nextBirthday = new Date(currentYear, bm - 1, bd)
  if (nextBirthday < now) {
    nextBirthday = new Date(currentYear + 1, bm - 1, bd)
  }
  return nextBirthday
}

router.get('/birthdays', async (req: Request, res: Response): Promise<void> => {
  try {
    const db = readDB()
    const now = new Date()
    const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

    const upcoming = db.members
      .filter((m: any) => !m.deathDate)
      .map((m: any) => {
        const nextBirthday = getNextBirthday(m.birthDate, now)
        return { ...m, nextBirthday }
      })
      .filter((m: any) => m.nextBirthday >= now && m.nextBirthday <= sevenDaysLater)
      .map((m: any) => {
        const daysUntil = Math.ceil((m.nextBirthday.getTime() - now.getTime()) / (24 * 60 * 60 * 1000))
        const age = m.nextBirthday.getFullYear() - new Date(m.birthDate).getFullYear()
        return {
          memberId: m.id,
          memberName: m.name,
          birthDate: m.birthDate,
          nextBirthday: formatDateLocal(m.nextBirthday),
          daysUntil,
          age,
          giftSuggestions: GIFT_SUGGESTIONS,
        }
      })
      .sort((a: any, b: any) => new Date(a.nextBirthday).getTime() - new Date(b.nextBirthday).getTime())

    res.json({ success: true, data: upcoming })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get birthday reminders' })
  }
})

export default router

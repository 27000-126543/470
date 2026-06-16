import { Router, type Request, type Response } from 'express'
import { readDB, writeDB } from '../db.js'

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
    const persisted = (db.birthdayReminders || []).filter((r: any) => {
      const d = new Date(r.nextBirthday)
      const now = new Date()
      const diff = Math.ceil((d.getTime() - now.getTime()) / (24 * 60 * 60 * 1000))
      return diff >= -1
    })
    db.birthdayReminders = persisted
    writeDB(db)

    const now = new Date()
    const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    const existingIds = new Set(persisted.map((r: any) => r.memberId))

    const newReminders = db.members
      .filter((m: any) => !m.deathDate && !existingIds.has(m.id))
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
          scanDate: formatDateLocal(now),
        }
      })
      .sort((a: any, b: any) => a.daysUntil - b.daysUntil)

    if (newReminders.length > 0) {
      db.birthdayReminders = [...persisted, ...newReminders]
      writeDB(db)
    }

    const allReminders = [...persisted, ...newReminders]
      .filter((r: any) => {
        const d = new Date(r.nextBirthday)
        const diff = Math.ceil((d.getTime() - now.getTime()) / (24 * 60 * 60 * 1000))
        return diff >= -1
      })
      .sort((a: any, b: any) => a.daysUntil - b.daysUntil)

    res.json({ success: true, data: allReminders })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get birthday reminders' })
  }
})

router.post('/birthdays/scan', async (req: Request, res: Response): Promise<void> => {
  try {
    const db = readDB()
    const now = new Date()
    const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

    const reminders = db.members
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
          scanDate: formatDateLocal(now),
        }
      })
      .sort((a: any, b: any) => a.daysUntil - b.daysUntil)

    db.birthdayReminders = reminders
    writeDB(db)

    res.json({ success: true, data: reminders, message: `扫描完成，发现${reminders.length}条生日提醒` })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to scan birthdays' })
  }
})

router.get('/activities', async (req: Request, res: Response): Promise<void> => {
  try {
    const db = readDB()
    const now = new Date()
    const today = formatDateLocal(now)
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)
    const tomorrowStr = formatDateLocal(tomorrow)
    const threeDaysLater = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)
    const threeDaysLaterStr = formatDateLocal(threeDaysLater)

    const activityReminders = db.activities
      .filter((a: any) => a.status !== 'ended')
      .filter((a: any) => {
        const activityDate = a.date
        return activityDate <= threeDaysLaterStr && activityDate >= today
      })
      .map((a: any) => {
        const activityDate = new Date(a.date)
        const diffMs = activityDate.getTime() - now.getTime()
        const daysUntil = Math.ceil(diffMs / (24 * 60 * 60 * 1000))

        let urgency: 'today' | 'tomorrow' | 'soon' = 'soon'
        if (a.date === today) urgency = 'today'
        else if (a.date === tomorrowStr) urgency = 'tomorrow'

        return {
          activityId: a.id,
          title: a.title,
          description: a.description,
          date: a.date,
          location: a.location,
          participantCount: a.participants.length,
          participants: a.participants,
          daysUntil,
          urgency,
          reminderType: 'activity' as const,
        }
      })
      .sort((a: any, b: any) => a.daysUntil - b.daysUntil)

    res.json({ success: true, data: activityReminders })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get activity reminders' })
  }
})

export default router

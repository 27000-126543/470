import { Router, type Request, type Response } from 'express'
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

const getTotalParticipants = (participants: any[]): number => {
  const normalized = normalizeParticipants(participants)
  return normalized.reduce((total, p) => total + 1 + (p.familyCount || 0), 0)
}

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
    const today = formatDateLocal(now)
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()
    const isFirstOfMonth = now.getDate() === 1

    const lastScan = db.lastBirthdayScanDate ? new Date(db.lastBirthdayScanDate) : null
    const hasScannedThisMonth = lastScan && 
      lastScan.getMonth() === currentMonth && 
      lastScan.getFullYear() === currentYear

    if (isFirstOfMonth && !hasScannedThisMonth) {
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
            scanDate: today,
          }
        })
        .sort((a: any, b: any) => a.daysUntil - b.daysUntil)

      db.birthdayReminders = reminders
      db.lastBirthdayScanDate = today
      writeDB(db)
    }

    const persisted = (db.birthdayReminders || []).filter((r: any) => {
      const d = new Date(r.nextBirthday)
      const diff = Math.ceil((d.getTime() - now.getTime()) / (24 * 60 * 60 * 1000))
      return diff >= -1
    })

    if (persisted.length !== (db.birthdayReminders || []).length) {
      db.birthdayReminders = persisted
      writeDB(db)
    }

    const allReminders = [...persisted].sort((a: any, b: any) => a.daysUntil - b.daysUntil)

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
    db.lastBirthdayScanDate = formatDateLocal(now)
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

        const participants = normalizeParticipants(a.participants || [])
        const totalCount = getTotalParticipants(a.participants || [])

        let countdownText = ''
        if (daysUntil === 0) countdownText = '今天'
        else if (daysUntil === 1) countdownText = '明天'
        else countdownText = `${daysUntil}天后`

        return {
          activityId: a.id,
          title: a.title,
          description: a.description,
          date: a.date,
          location: a.location,
          participantCount: participants.length,
          totalCount,
          participants,
          daysUntil,
          urgency,
          countdownText,
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

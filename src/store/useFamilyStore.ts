import { create } from 'zustand';

export interface FamilyMember {
  id: string;
  name: string;
  birthDate: string;
  deathDate?: string | null;
  gender: 'male' | 'female';
  relationType: 'parent' | 'child' | 'spouse' | 'sibling';
  relatedToId?: string | null;
  familyTreeId: string;
  avatar?: string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface FamilyActivity {
  id: string;
  title: string;
  description: string;
  date: string;
  location: string;
  createdBy: string;
  participants: string[];
  status: 'upcoming' | 'ongoing' | 'ended';
  createdAt: string;
}

export interface ChronicleEntry {
  id: string;
  title: string;
  description: string;
  date: string;
  type: 'photo' | 'story' | 'event';
  mediaUrl?: string | null;
  createdBy: string;
  createdAt: string;
}

export interface BirthdayReminder {
  memberId: string;
  memberName: string;
  birthDate: string;
  daysUntil: number;
  giftSuggestions: string[];
}

interface FamilyState {
  members: FamilyMember[];
  activities: FamilyActivity[];
  chronicleEntries: ChronicleEntry[];
  birthdayReminders: BirthdayReminder[];
  selectedMember: FamilyMember | null;
  isMemberFormOpen: boolean;
  isActivityFormOpen: boolean;
  isChronicleFormOpen: boolean;
  editingMember: FamilyMember | null;

  fetchMembers: () => Promise<void>;
  addMember: (data: Partial<FamilyMember>) => Promise<string | null>;
  updateMember: (id: string, data: Partial<FamilyMember>) => Promise<string | null>;
  deleteMember: (id: string) => Promise<void>;
  fetchActivities: () => Promise<void>;
  addActivity: (data: Partial<FamilyActivity>) => Promise<void>;
  joinActivity: (id: string, memberId: string) => Promise<void>;
  leaveActivity: (id: string, memberId: string) => Promise<void>;
  fetchChronicle: () => Promise<void>;
  addChronicleEntry: (data: Partial<ChronicleEntry>) => Promise<void>;
  deleteChronicleEntry: (id: string) => Promise<void>;
  fetchBirthdayReminders: () => Promise<void>;
  setSelectedMember: (member: FamilyMember | null) => void;
  setMemberFormOpen: (open: boolean, member?: FamilyMember | null) => void;
  setActivityFormOpen: (open: boolean) => void;
  setChronicleFormOpen: (open: boolean) => void;
}

const useFamilyStore = create<FamilyState>((set, get) => ({
  members: [],
  activities: [],
  chronicleEntries: [],
  birthdayReminders: [],
  selectedMember: null,
  isMemberFormOpen: false,
  isActivityFormOpen: false,
  isChronicleFormOpen: false,
  editingMember: null,

  fetchMembers: async () => {
    try {
      const res = await fetch('/api/members');
      const data = await res.json();
      if (data.success !== false) {
        set({ members: Array.isArray(data) ? data : data.data || [] });
      }
    } catch {
      console.error('Failed to fetch members');
    }
  },

  addMember: async (data) => {
    try {
      const res = await fetch('/api/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok || result.success === false) {
        return result.error || result.message || '添加成员失败';
      }
      await get().fetchMembers();
      return null;
    } catch {
      return '网络错误，请稍后重试';
    }
  },

  updateMember: async (id, data) => {
    try {
      const res = await fetch(`/api/members/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok || result.success === false) {
        return result.error || result.message || '更新成员失败';
      }
      await get().fetchMembers();
      return null;
    } catch {
      return '网络错误，请稍后重试';
    }
  },

  deleteMember: async (id) => {
    try {
      await fetch(`/api/members/${id}`, { method: 'DELETE' });
      await get().fetchMembers();
      if (get().selectedMember?.id === id) {
        set({ selectedMember: null });
      }
    } catch {
      console.error('Failed to delete member');
    }
  },

  fetchActivities: async () => {
    try {
      const res = await fetch('/api/activities');
      const data = await res.json();
      if (data.success !== false) {
        set({ activities: Array.isArray(data) ? data : data.data || [] });
      }
    } catch {
      console.error('Failed to fetch activities');
    }
  },

  addActivity: async (data) => {
    try {
      await fetch('/api/activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      await get().fetchActivities();
    } catch {
      console.error('Failed to add activity');
    }
  },

  joinActivity: async (id, memberId) => {
    try {
      await fetch(`/api/activities/${id}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId }),
      });
      await get().fetchActivities();
    } catch {
      console.error('Failed to join activity');
    }
  },

  leaveActivity: async (id, memberId) => {
    try {
      await fetch(`/api/activities/${id}/join`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId }),
      });
      await get().fetchActivities();
    } catch {
      console.error('Failed to leave activity');
    }
  },

  fetchChronicle: async () => {
    try {
      const res = await fetch('/api/chronicle');
      const data = await res.json();
      if (data.success !== false) {
        set({ chronicleEntries: Array.isArray(data) ? data : data.data || [] });
      }
    } catch {
      console.error('Failed to fetch chronicle');
    }
  },

  addChronicleEntry: async (data) => {
    try {
      await fetch('/api/chronicle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      await get().fetchChronicle();
    } catch {
      console.error('Failed to add chronicle entry');
    }
  },

  deleteChronicleEntry: async (id) => {
    try {
      await fetch(`/api/chronicle/${id}`, { method: 'DELETE' });
      await get().fetchChronicle();
    } catch {
      console.error('Failed to delete chronicle entry');
    }
  },

  fetchBirthdayReminders: async () => {
    try {
      const res = await fetch('/api/reminders/birthdays');
      const data = await res.json();
      if (data.success !== false) {
        set({ birthdayReminders: Array.isArray(data) ? data : data.data || [] });
      }
    } catch {
      console.error('Failed to fetch birthday reminders');
    }
  },

  setSelectedMember: (member) => set({ selectedMember: member }),

  setMemberFormOpen: (open, member) => set({
    isMemberFormOpen: open,
    editingMember: open ? (member ?? null) : null,
  }),

  setActivityFormOpen: (open) => set({ isActivityFormOpen: open }),

  setChronicleFormOpen: (open) => set({ isChronicleFormOpen: open }),
}));

export default useFamilyStore;

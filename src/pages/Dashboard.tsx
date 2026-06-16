import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, GitBranch, Calendar, UserPlus, Plus, Camera, BookOpen } from 'lucide-react';
import useFamilyStore from '@/store/useFamilyStore';

export default function Dashboard() {
  const navigate = useNavigate();
  const { members, activities, birthdayReminders, fetchMembers, fetchActivities, fetchBirthdayReminders, setMemberFormOpen, setActivityFormOpen, setChronicleFormOpen } = useFamilyStore();

  useEffect(() => {
    fetchMembers();
    fetchActivities();
    fetchBirthdayReminders();
  }, [fetchMembers, fetchActivities, fetchBirthdayReminders]);

  const generations = new Set(members.map((m) => m.relationType)).size;

  const upcomingActivities = activities
    .filter((a) => a.status !== 'ended')
    .slice(0, 4);

  const statusLabel: Record<string, { text: string; cls: string }> = {
    upcoming: { text: '即将开始', cls: 'bg-green-100 text-green-700' },
    ongoing: { text: '进行中', cls: 'bg-orange-100 text-orange-700' },
    ended: { text: '已结束', cls: 'bg-brown-100 text-brown-400' },
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-brown-100 animate-fade-in-up" style={{ animationDelay: '0s' }}>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-gold-400/10 rounded-xl flex items-center justify-center">
              <Users size={20} className="text-gold-500" />
            </div>
            <span className="text-sm text-brown-400">成员总数</span>
          </div>
          <p className="text-3xl font-bold text-gold-400 font-serif">{members.length}</p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-brown-100 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-gold-400/10 rounded-xl flex items-center justify-center">
              <GitBranch size={20} className="text-gold-500" />
            </div>
            <span className="text-sm text-brown-400">家庭代际</span>
          </div>
          <p className="text-3xl font-bold text-gold-400 font-serif">{generations}</p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-brown-100 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-gold-400/10 rounded-xl flex items-center justify-center">
              <Calendar size={20} className="text-gold-500" />
            </div>
            <span className="text-sm text-brown-400">近期活动</span>
          </div>
          <p className="text-3xl font-bold text-gold-400 font-serif">{upcomingActivities.length}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-brown-100 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
          <h3 className="font-serif text-lg font-bold text-brown-700 mb-4">近期活动</h3>
          {upcomingActivities.length === 0 ? (
            <p className="text-brown-300 text-sm py-8 text-center">暂无近期活动</p>
          ) : (
            <div className="space-y-3">
              {upcomingActivities.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3 p-3 rounded-xl bg-brown-50/50 hover:bg-brown-50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-brown-700 text-sm truncate">{activity.title}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${statusLabel[activity.status]?.cls || ''}`}>
                        {statusLabel[activity.status]?.text || activity.status}
                      </span>
                    </div>
                    <p className="text-xs text-brown-400">{activity.date} · {activity.location}</p>
                  </div>
                  <span className="text-xs text-brown-300 whitespace-nowrap">{activity.participants.length}人参与</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-brown-100 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
          <h3 className="font-serif text-lg font-bold text-brown-700 mb-4">生日提醒</h3>
          {birthdayReminders.length === 0 ? (
            <p className="text-brown-300 text-sm py-8 text-center">暂无生日提醒</p>
          ) : (
            <div className="space-y-3">
              {birthdayReminders.map((reminder) => (
                <div key={reminder.memberId} className="p-3 rounded-xl bg-brown-50/50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-brown-700 text-sm">{reminder.memberName}</span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${reminder.daysUntil <= 7 ? 'bg-red-100 text-red-600' : 'bg-gold-400/10 text-gold-500'}`}>
                      {reminder.daysUntil === 0 ? '今天' : `${reminder.daysUntil}天后`}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {reminder.giftSuggestions.map((gift, i) => (
                      <span key={i} className="text-xs px-2 py-0.5 bg-white rounded-full text-brown-500 border border-brown-100">
                        {gift}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-brown-100 animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
        <h3 className="font-serif text-lg font-bold text-brown-700 mb-4">快捷操作</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button
            onClick={() => setMemberFormOpen(true)}
            className="flex flex-col items-center gap-2 p-4 rounded-xl hover:bg-brown-50 transition-colors group"
          >
            <div className="w-12 h-12 bg-gold-400/10 rounded-full flex items-center justify-center group-hover:bg-gold-400/20 transition-colors">
              <UserPlus size={22} className="text-gold-500" />
            </div>
            <span className="text-sm text-brown-600">添加成员</span>
          </button>

          <button
            onClick={() => setActivityFormOpen(true)}
            className="flex flex-col items-center gap-2 p-4 rounded-xl hover:bg-brown-50 transition-colors group"
          >
            <div className="w-12 h-12 bg-gold-400/10 rounded-full flex items-center justify-center group-hover:bg-gold-400/20 transition-colors">
              <Plus size={22} className="text-gold-500" />
            </div>
            <span className="text-sm text-brown-600">发布活动</span>
          </button>

          <button
            onClick={() => setChronicleFormOpen(true)}
            className="flex flex-col items-center gap-2 p-4 rounded-xl hover:bg-brown-50 transition-colors group"
          >
            <div className="w-12 h-12 bg-gold-400/10 rounded-full flex items-center justify-center group-hover:bg-gold-400/20 transition-colors">
              <Camera size={22} className="text-gold-500" />
            </div>
            <span className="text-sm text-brown-600">上传照片</span>
          </button>

          <button
            onClick={() => navigate('/chronicle')}
            className="flex flex-col items-center gap-2 p-4 rounded-xl hover:bg-brown-50 transition-colors group"
          >
            <div className="w-12 h-12 bg-gold-400/10 rounded-full flex items-center justify-center group-hover:bg-gold-400/20 transition-colors">
              <BookOpen size={22} className="text-gold-500" />
            </div>
            <span className="text-sm text-brown-600">查看编年史</span>
          </button>
        </div>
      </div>
    </div>
  );
}

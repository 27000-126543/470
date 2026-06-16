import { useEffect, useState } from 'react';
import { Plus, MapPin, Calendar, Users } from 'lucide-react';
import useFamilyStore from '@/store/useFamilyStore';
import ActivityForm from '@/components/ActivityForm';

type FilterTab = 'all' | 'upcoming' | 'ended';

const statusConfig: Record<string, { text: string; cls: string }> = {
  upcoming: { text: '即将开始', cls: 'bg-green-100 text-green-700' },
  ongoing: { text: '进行中', cls: 'bg-orange-100 text-orange-700' },
  ended: { text: '已结束', cls: 'bg-brown-100 text-brown-400' },
};

const tabs: { key: FilterTab; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'upcoming', label: '即将开始' },
  { key: 'ended', label: '已结束' },
];

export default function Activities() {
  const { activities, members, fetchActivities, fetchMembers, setActivityFormOpen, joinActivity, leaveActivity } = useFamilyStore();
  const [activeTab, setActiveTab] = useState<FilterTab>('all');

  useEffect(() => {
    fetchActivities();
    fetchMembers();
  }, [fetchActivities, fetchMembers]);

  const filteredActivities = activities.filter((a) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'upcoming') return a.status === 'upcoming' || a.status === 'ongoing';
    return a.status === 'ended';
  });

  const currentMemberId = members[0]?.id;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-2xl font-bold text-brown-700">家庭活动</h1>
        <button
          onClick={() => setActivityFormOpen(true)}
          className="w-12 h-12 bg-gold-400 text-white rounded-full shadow-lg hover:bg-gold-500 active:translate-y-0.5 hover:shadow-xl transition-all flex items-center justify-center"
        >
          <Plus size={22} />
        </button>
      </div>

      <div className="flex gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'bg-gold-400 text-white shadow-sm'
                : 'bg-white text-brown-500 border border-brown-100 hover:bg-brown-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {filteredActivities.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 shadow-sm border border-brown-100 text-center">
          <p className="text-brown-300 text-lg font-serif">暂无活动</p>
          <p className="text-brown-200 text-sm mt-1">点击右上角按钮发布新活动</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredActivities.map((activity, index) => {
            const isJoined = currentMemberId && activity.participants.includes(currentMemberId);
            const status = statusConfig[activity.status] || statusConfig.ended;

            return (
              <div
                key={activity.id}
                className="bg-white rounded-2xl p-5 shadow-sm border border-brown-100 hover:shadow-md transition-shadow animate-fade-in-up"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-serif font-bold text-brown-700 text-lg leading-tight">{activity.title}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full whitespace-nowrap ml-2 ${status.cls}`}>
                    {status.text}
                  </span>
                </div>

                {activity.description && (
                  <p className="text-sm text-brown-400 mb-3 line-clamp-2">{activity.description}</p>
                )}

                <div className="space-y-1.5 mb-4">
                  <div className="flex items-center gap-2 text-sm text-brown-500">
                    <Calendar size={14} className="text-brown-300" />
                    <span>{activity.date}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-brown-500">
                    <MapPin size={14} className="text-brown-300" />
                    <span>{activity.location}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-brown-400">
                    <Users size={14} />
                    <span>{activity.participants.length}人参与</span>
                  </div>

                  {activity.status !== 'ended' && currentMemberId && (
                    isJoined ? (
                      <button
                        onClick={() => leaveActivity(activity.id, currentMemberId)}
                        className="px-3 py-1.5 text-xs border border-brown-200 text-brown-400 rounded-lg hover:bg-brown-50 transition-colors"
                      >
                        退出
                      </button>
                    ) : (
                      <button
                        onClick={() => joinActivity(activity.id, currentMemberId)}
                        className="px-3 py-1.5 text-xs bg-gold-400 text-white rounded-lg hover:bg-gold-500 active:translate-y-0.5 transition-all shadow-sm"
                      >
                        参加
                      </button>
                    )
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ActivityForm />
    </div>
  );
}

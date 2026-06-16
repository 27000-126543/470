import { useEffect, useState } from 'react';
import { Plus, MapPin, Calendar, Users, X, ChevronDown, ChevronUp, Phone, UserPlus, FileText } from 'lucide-react';
import useFamilyStore, { type ActivityParticipant } from '@/store/useFamilyStore';
import ActivityForm from '@/components/ActivityForm';

type FilterTab = 'all' | 'upcoming' | 'ended';

interface JoinFormData {
  bringFamily: boolean;
  familyCount: number;
  remark: string;
  phone: string;
}

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
  const { activities, members, activityReminders, fetchActivities, fetchMembers, fetchActivityReminders, setActivityFormOpen, joinActivity, leaveActivity } = useFamilyStore();
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [joiningActivityId, setJoiningActivityId] = useState<string | null>(null);
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [joinFormData, setJoinFormData] = useState<JoinFormData>({
    bringFamily: false,
    familyCount: 0,
    remark: '',
    phone: '',
  });
  const [expandedActivities, setExpandedActivities] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchActivities();
    fetchMembers();
    fetchActivityReminders();
  }, [fetchActivities, fetchMembers, fetchActivityReminders]);

  const getCountdownText = (date: string): string => {
    const now = new Date();
    const activityDate = new Date(date);
    const diffMs = activityDate.getTime() - now.getTime();
    const daysUntil = Math.ceil(diffMs / (24 * 60 * 60 * 1000));
    if (daysUntil < 0) return '已结束';
    if (daysUntil === 0) return '今天';
    if (daysUntil === 1) return '明天';
    return `${daysUntil}天后`;
  };

  const getTotalParticipants = (participants: ActivityParticipant[]): number => {
    return participants.reduce((total, p) => total + 1 + (p.familyCount || 0), 0);
  };

  const getMemberName = (id: string) => members.find((m) => m.id === id)?.name || id;

  const getParticipant = (activityId: string, memberId: string): ActivityParticipant | undefined => {
    const activity = activities.find((a) => a.id === activityId);
    return activity?.participants.find((p) => p.memberId === memberId);
  };

  const handleJoin = async (activityId: string, memberId: string) => {
    await joinActivity(activityId, memberId, joinFormData);
    setEditingMemberId(null);
    setJoinFormData({ bringFamily: false, familyCount: 0, remark: '', phone: '' });
  };

  const handleEdit = (activityId: string, memberId: string) => {
    const participant = getParticipant(activityId, memberId);
    if (participant) {
      setJoinFormData({
        bringFamily: participant.bringFamily,
        familyCount: participant.familyCount,
        remark: participant.remark,
        phone: participant.phone,
      });
    }
    setEditingMemberId(memberId);
  };

  const toggleExpand = (activityId: string) => {
    setExpandedActivities((prev) => {
      const next = new Set(prev);
      if (next.has(activityId)) {
        next.delete(activityId);
      } else {
        next.add(activityId);
      }
      return next;
    });
  };

  const filteredActivities = activities.filter((a) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'upcoming') return a.status === 'upcoming' || a.status === 'ongoing';
    return a.status === 'ended';
  });

  const urgencyColors: Record<string, string> = {
    today: 'bg-red-50 border-red-200 text-red-700',
    tomorrow: 'bg-orange-50 border-orange-200 text-orange-700',
    soon: 'bg-amber-50 border-amber-200 text-amber-700',
  };

  const urgencyBadgeColors: Record<string, string> = {
    today: 'bg-red-500 text-white',
    tomorrow: 'bg-orange-500 text-white',
    soon: 'bg-amber-500 text-white',
  };

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

      {activityReminders.length > 0 && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-brown-100">
          <h2 className="font-serif font-bold text-brown-700 mb-4 flex items-center gap-2">
            <span className="text-xl">🔔</span>
            临近活动提醒
          </h2>
          <div className="space-y-3">
            {activityReminders.map((reminder) => (
              <div
                key={reminder.activityId}
                className={`p-4 rounded-xl border ${urgencyColors[reminder.urgency]} flex items-start justify-between`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold">{reminder.title}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${urgencyBadgeColors[reminder.urgency]}`}>
                      {reminder.countdownText}
                    </span>
                  </div>
                  <div className="text-sm space-y-0.5 opacity-80">
                    <div className="flex items-center gap-1">
                      <Calendar size={12} />
                      <span>{reminder.date}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin size={12} />
                      <span>{reminder.location}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users size={12} />
                      <span>{reminder.participantCount}人报名（含家属共{reminder.totalCount}人）</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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
            const status = statusConfig[activity.status] || statusConfig.ended;
            const totalCount = getTotalParticipants(activity.participants);
            const countdownText = getCountdownText(activity.date);
            const isExpanded = expandedActivities.has(activity.id);
            const isUpcoming = activity.status !== 'ended';
            const daysUntil = Math.ceil((new Date(activity.date).getTime() - new Date().getTime()) / (24 * 60 * 60 * 1000));

            let countdownCls = 'text-brown-400';
            if (isUpcoming) {
              if (daysUntil === 0) countdownCls = 'text-red-600 font-medium';
              else if (daysUntil === 1) countdownCls = 'text-orange-600 font-medium';
              else if (daysUntil <= 3) countdownCls = 'text-amber-600 font-medium';
            }

            return (
              <div
                key={activity.id}
                className="bg-white rounded-2xl p-5 shadow-sm border border-brown-100 hover:shadow-md transition-shadow animate-fade-in-up"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-serif font-bold text-brown-700 text-lg leading-tight">{activity.title}</h3>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full whitespace-nowrap ${countdownCls}`}>
                      {countdownText}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full whitespace-nowrap ${status.cls}`}>
                      {status.text}
                    </span>
                  </div>
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

                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 text-sm text-brown-400">
                    <Users size={14} />
                    <span>{activity.participants.length}人报名（含家属共{totalCount}人）</span>
                  </div>

                  {activity.status !== 'ended' && (
                    <button
                      onClick={() => setJoiningActivityId(activity.id)}
                      className="px-3 py-1.5 text-xs bg-gold-400 text-white rounded-lg hover:bg-gold-500 active:translate-y-0.5 transition-all shadow-sm"
                    >
                      报名
                    </button>
                  )}
                </div>

                {activity.participants.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-brown-50">
                    <button
                      onClick={() => toggleExpand(activity.id)}
                      className="flex items-center gap-1 text-xs text-brown-400 mb-2 hover:text-brown-600 transition-colors"
                    >
                      <span>已报名成员：</span>
                      {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                    </button>
                    <div className="flex flex-wrap gap-1">
                      {activity.participants.map((p) => (
                        <span key={p.memberId} className="text-xs px-2 py-0.5 bg-brown-50 rounded-full text-brown-600 border border-brown-100">
                          {getMemberName(p.memberId)}
                          {p.bringFamily && p.familyCount > 0 && ` (+${p.familyCount}人)`}
                        </span>
                      ))}
                    </div>
                    {isExpanded && (
                      <div className="mt-3 space-y-2">
                        {activity.participants.map((p) => (
                          <div key={p.memberId} className="bg-brown-50 rounded-lg p-3 text-xs">
                            <div className="font-medium text-brown-700 mb-1">{getMemberName(p.memberId)}</div>
                            <div className="space-y-0.5 text-brown-500">
                              {p.bringFamily && (
                                <div className="flex items-center gap-1">
                                  <UserPlus size={12} />
                                  <span>携带家属：{p.familyCount}人</span>
                                </div>
                              )}
                              {p.phone && (
                                <div className="flex items-center gap-1">
                                  <Phone size={12} />
                                  <span>联系电话：{p.phone}</span>
                                </div>
                              )}
                              {p.remark && (
                                <div className="flex items-start gap-1">
                                  <FileText size={12} className="mt-0.5" />
                                  <span>备注：{p.remark}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {joiningActivityId && (
        <>
          <div className="fixed inset-0 bg-black/30 z-40" onClick={() => { setJoiningActivityId(null); setEditingMemberId(null); }} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-fade-in-up" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between px-6 py-4 border-b border-brown-100">
                <h2 className="font-serif text-lg font-bold text-brown-700">
                  {editingMemberId ? '编辑报名信息' : '选择报名成员'}
                </h2>
                <button onClick={() => { setJoiningActivityId(null); setEditingMemberId(null); }} className="p-1 hover:bg-brown-50 rounded-full transition-colors">
                  <X size={20} className="text-brown-400" />
                </button>
              </div>

              {editingMemberId ? (
                <div className="px-6 py-4 space-y-4">
                  <div className="text-sm text-brown-600 font-medium">
                    成员：{getMemberName(editingMemberId)}
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm text-brown-600 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={joinFormData.bringFamily}
                        onChange={(e) => setJoinFormData({ ...joinFormData, bringFamily: e.target.checked })}
                        className="w-4 h-4 text-gold-500 rounded border-brown-300 focus:ring-gold-500"
                      />
                      <span>是否携带家属</span>
                    </label>

                    {joinFormData.bringFamily && (
                      <div className="ml-6">
                        <label className="text-xs text-brown-500 mb-1 block">携带家属人数</label>
                        <input
                          type="number"
                          min="0"
                          value={joinFormData.familyCount}
                          onChange={(e) => setJoinFormData({ ...joinFormData, familyCount: parseInt(e.target.value) || 0 })}
                          className="w-full px-3 py-2 border border-brown-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-transparent"
                        />
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs text-brown-500">联系电话</label>
                    <input
                      type="tel"
                      value={joinFormData.phone}
                      onChange={(e) => setJoinFormData({ ...joinFormData, phone: e.target.value })}
                      placeholder="请输入联系电话"
                      className="w-full px-3 py-2 border border-brown-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-transparent"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs text-brown-500">备注</label>
                    <textarea
                      value={joinFormData.remark}
                      onChange={(e) => setJoinFormData({ ...joinFormData, remark: e.target.value })}
                      placeholder="请输入备注信息（如饮食禁忌、特殊需求等）"
                      rows={3}
                      className="w-full px-3 py-2 border border-brown-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-transparent resize-none"
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setEditingMemberId(null)}
                      className="flex-1 px-4 py-2 border border-brown-200 text-brown-600 rounded-lg hover:bg-brown-50 transition-colors text-sm"
                    >
                      取消
                    </button>
                    <button
                      onClick={() => handleJoin(joiningActivityId, editingMemberId)}
                      className="flex-1 px-4 py-2 bg-gold-400 text-white rounded-lg hover:bg-gold-500 transition-colors text-sm"
                    >
                      保存
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="px-6 py-3 max-h-64 overflow-y-auto">
                    {members
                      .filter((m) => !m.deathDate)
                      .map((member) => {
                        const activity = activities.find((a) => a.id === joiningActivityId);
                        const participant = activity?.participants.find((p) => p.memberId === member.id);
                        const alreadyJoined = !!participant;
                        return (
                          <div key={member.id} className="flex items-center justify-between py-2 border-b border-brown-50 last:border-0">
                            <div className="flex-1">
                              <span className="text-sm text-brown-700">{member.name}</span>
                              {participant?.bringFamily && participant.familyCount > 0 && (
                                <span className="text-xs text-brown-400 ml-2">(+{participant.familyCount}人家属)</span>
                              )}
                            </div>
                            {alreadyJoined ? (
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-green-600">已报名</span>
                                <button
                                  onClick={() => handleEdit(joiningActivityId, member.id)}
                                  className="text-xs px-2 py-1 border border-brown-200 text-brown-500 rounded hover:bg-brown-50 transition-colors"
                                >
                                  编辑
                                </button>
                                <button
                                  onClick={async () => {
                                    await leaveActivity(joiningActivityId, member.id);
                                  }}
                                  className="text-xs px-2 py-1 border border-red-200 text-red-500 rounded hover:bg-red-50 transition-colors"
                                >
                                  退出
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => handleEdit(joiningActivityId, member.id)}
                                className="text-xs px-3 py-1 bg-gold-400 text-white rounded-lg hover:bg-gold-500 transition-colors"
                              >
                                报名
                              </button>
                            )}
                          </div>
                        );
                      })}
                  </div>
                  <div className="px-6 py-3 border-t border-brown-100">
                    <button
                      onClick={() => setJoiningActivityId(null)}
                      className="w-full px-4 py-2 border border-brown-200 text-brown-600 rounded-lg hover:bg-brown-50 transition-colors text-sm"
                    >
                      关闭
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </>
      )}

      <ActivityForm />
    </div>
  );
}

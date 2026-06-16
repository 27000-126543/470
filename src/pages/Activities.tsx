import { useEffect, useState, useMemo } from 'react';
import { Plus, MapPin, Calendar, Users, X, ChevronDown, ChevronUp, Phone, UserPlus, FileText, Edit3, CheckSquare, Square, Download, ListTodo, ClipboardList, Trash2, Group } from 'lucide-react';
import useFamilyStore, { type ActivityParticipant, type ActivityTodo } from '@/store/useFamilyStore';
import ActivityForm from '@/components/ActivityForm';

type FilterTab = 'all' | 'upcoming' | 'ended';

interface JoinFormData {
  bringFamily: boolean;
  familyCount: number;
  remark: string;
  phone: string;
  groupName: string;
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

const DEFAULT_GROUPS = ['未分组', '第一组', '第二组', '第三组', '车辆1号', '车辆2号'];

export default function Activities() {
  const { activities, members, activityReminders, fetchActivities, fetchMembers, fetchActivityReminders, setActivityFormOpen, joinActivity, leaveActivity, addActivityTodo, updateActivityTodo, deleteActivityTodo } = useFamilyStore();
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [joiningActivityId, setJoiningActivityId] = useState<string | null>(null);
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [joinFormData, setJoinFormData] = useState<JoinFormData>({
    bringFamily: false,
    familyCount: 0,
    remark: '',
    phone: '',
    groupName: '',
  });
  const [expandedActivities, setExpandedActivities] = useState<Set<string>>(new Set());
  const [expandedTodos, setExpandedTodos] = useState<Set<string>>(new Set());
  const [newTodoTitle, setNewTodoTitle] = useState<Record<string, string>>({});
  const [newTodoAssignee, setNewTodoAssignee] = useState<Record<string, string>>({});
  const [newTodoDueDate, setNewTodoDueDate] = useState<Record<string, string>>({});

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

  const groupParticipants = (participants: ActivityParticipant[]) => {
    const groups: Record<string, ActivityParticipant[]> = {};
    for (const p of participants) {
      const g = p.groupName || '未分组';
      if (!groups[g]) groups[g] = [];
      groups[g].push(p);
    }
    return groups;
  };

  const getTodoDueHint = (dueDate?: string, activityDate?: string) => {
    if (!dueDate) return '';
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    const diff = Math.ceil((due.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
    if (diff < 0) return '已逾期';
    if (diff === 0) return '今天截止';
    if (diff === 1) return '明天截止';
    return `${diff}天后截止`;
  };

  const handleJoin = async (activityId: string, memberId: string) => {
    await joinActivity(activityId, memberId, joinFormData);
    setEditingMemberId(null);
    setJoinFormData({ bringFamily: false, familyCount: 0, remark: '', phone: '', groupName: '' });
  };

  const handleEdit = (activityId: string, memberId: string) => {
    const participant = getParticipant(activityId, memberId);
    if (participant) {
      setJoinFormData({
        bringFamily: participant.bringFamily,
        familyCount: participant.familyCount,
        remark: participant.remark,
        phone: participant.phone,
        groupName: participant.groupName || '',
      });
    }
    setEditingMemberId(memberId);
  };

  const toggleExpand = (activityId: string) => {
    setExpandedActivities((prev) => {
      const next = new Set(prev);
      if (next.has(activityId)) next.delete(activityId);
      else next.add(activityId);
      return next;
    });
  };

  const toggleTodosExpand = (activityId: string) => {
    setExpandedTodos((prev) => {
      const next = new Set(prev);
      if (next.has(activityId)) next.delete(activityId);
      else next.add(activityId);
      return next;
    });
  };

  const handleAddTodo = async (activityId: string) => {
    const title = newTodoTitle[activityId] || '';
    if (!title.trim()) return;
    await addActivityTodo(activityId, {
      title: title.trim(),
      assignee: newTodoAssignee[activityId] || undefined,
      dueDate: newTodoDueDate[activityId] || undefined,
    });
    setNewTodoTitle({ ...newTodoTitle, [activityId]: '' });
    setNewTodoAssignee({ ...newTodoAssignee, [activityId]: '' });
    setNewTodoDueDate({ ...newTodoDueDate, [activityId]: '' });
  };

  const handleToggleTodo = async (activityId: string, todo: ActivityTodo) => {
    await updateActivityTodo(activityId, todo.id, { completed: !todo.completed });
  };

  const handleExportCSV = (activityId: string) => {
    window.open(`/api/activities/${activityId}/export`, '_blank');
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

  const allGroups = useMemo(() => {
    const s = new Set(DEFAULT_GROUPS);
    activities.forEach((a) => a.participants.forEach((p) => { if (p.groupName) s.add(p.groupName); }));
    return Array.from(s);
  }, [activities]);

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
                    <div className="flex items-center gap-1"><Calendar size={12} /><span>{reminder.date}</span></div>
                    <div className="flex items-center gap-1"><MapPin size={12} /><span>{reminder.location}</span></div>
                    <div className="flex items-center gap-1"><Users size={12} /><span>{reminder.participantCount}人报名（含家属共{reminder.totalCount}人）</span></div>
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
              activeTab === tab.key ? 'bg-gold-400 text-white shadow-sm' : 'bg-white text-brown-500 border border-brown-100 hover:bg-brown-50'
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
            const isTodosExpanded = expandedTodos.has(activity.id);
            const isUpcoming = activity.status !== 'ended';
            const daysUntil = Math.ceil((new Date(activity.date).getTime() - new Date().getTime()) / (24 * 60 * 60 * 1000));
            const todos = activity.todos || [];
            const completedTodos = todos.filter((t) => t.completed).length;
            const grouped = groupParticipants(activity.participants);

            let countdownCls = 'text-brown-400';
            if (isUpcoming) {
              if (daysUntil === 0) countdownCls = 'text-red-600 font-medium';
              else if (daysUntil === 1) countdownCls = 'text-orange-600 font-medium';
              else if (daysUntil <= 3) countdownCls = 'text-amber-600 font-medium';
            }

            return (
              <div key={activity.id} className="bg-white rounded-2xl p-5 shadow-sm border border-brown-100 hover:shadow-md transition-shadow animate-fade-in-up" style={{ animationDelay: `${index * 0.05}s` }}>
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-serif font-bold text-brown-700 text-lg leading-tight pr-2">{activity.title}</h3>
                  <div className="flex items-center gap-2 shrink-0">
                    {isUpcoming && (
                      <button onClick={() => setActivityFormOpen(true, activity)} className="p-1 text-brown-400 hover:text-brown-600 hover:bg-brown-50 rounded-full transition-colors" title="编辑活动">
                        <Edit3 size={16} />
                      </button>
                    )}
                    <span className={`text-xs px-2 py-0.5 rounded-full whitespace-nowrap ${countdownCls}`}>{countdownText}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full whitespace-nowrap ${status.cls}`}>{status.text}</span>
                  </div>
                </div>

                {activity.description && <p className="text-sm text-brown-400 mb-3 line-clamp-2">{activity.description}</p>}

                <div className="space-y-1.5 mb-4">
                  <div className="flex items-center gap-2 text-sm text-brown-500"><Calendar size={14} className="text-brown-300" /><span>{activity.date}</span></div>
                  <div className="flex items-center gap-2 text-sm text-brown-500"><MapPin size={14} className="text-brown-300" /><span>{activity.location}</span></div>
                </div>

                {/* 准备看板区域 */}
                <div className="mb-3 p-3 bg-amber-50/40 border border-amber-100 rounded-xl">
                  <button
                    onClick={() => toggleTodosExpand(activity.id)}
                    className="w-full flex items-center justify-between text-sm text-brown-600"
                  >
                    <div className="flex items-center gap-2">
                      <ListTodo size={15} className="text-amber-500" />
                      <span className="font-medium">准备看板</span>
                      <span className="text-xs text-brown-400">{completedTodos}/{todos.length}完成</span>
                    </div>
                    {isTodosExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>

                  {isTodosExpanded && (
                    <div className="mt-3 space-y-2">
                      {todos.length > 0 && (
                        <div className="space-y-1.5">
                          {todos.map((todo) => {
                            const dueHint = getTodoDueHint(todo.dueDate, activity.date);
                            const isOverdue = todo.dueDate && new Date(todo.dueDate) < new Date() && !todo.completed;
                            return (
                              <div key={todo.id} className={`flex items-start gap-2 p-2 rounded-lg bg-white/70 ${!isUpcoming ? 'opacity-60' : ''}`}>
                                <button
                                  onClick={() => isUpcoming && handleToggleTodo(activity.id, todo)}
                                  disabled={!isUpcoming}
                                  className="mt-0.5 shrink-0"
                                >
                                  {todo.completed ? <CheckSquare size={16} className="text-green-500" /> : <Square size={16} className="text-brown-300" />}
                                </button>
                                <div className="flex-1 min-w-0">
                                  <div className={`text-sm ${todo.completed ? 'line-through text-brown-300' : 'text-brown-700'}`}>{todo.title}</div>
                                  <div className="flex flex-wrap gap-2 mt-1 text-[11px] text-brown-400">
                                    {todo.assignee && <span>负责人：{getMemberName(todo.assignee)}</span>}
                                    {todo.dueDate && <span className={isOverdue ? 'text-red-500' : ''}>{dueHint}（{todo.dueDate}）</span>}
                                  </div>
                                </div>
                                {isUpcoming && (
                                  <button onClick={() => deleteActivityTodo(activity.id, todo.id)} className="shrink-0 text-brown-300 hover:text-red-400 transition-colors">
                                    <Trash2 size={13} />
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {isUpcoming && (
                        <div className="p-2 rounded-lg bg-white/70 border border-amber-200/60">
                          <div className="space-y-2">
                            <input
                              type="text"
                              value={newTodoTitle[activity.id] || ''}
                              onChange={(e) => setNewTodoTitle({ ...newTodoTitle, [activity.id]: e.target.value })}
                              placeholder="新增待办事项..."
                              className="w-full px-2 py-1.5 text-sm border border-brown-200 rounded focus:outline-none focus:ring-1 focus:ring-amber-400 bg-white"
                            />
                            <div className="grid grid-cols-2 gap-2">
                              <select
                                value={newTodoAssignee[activity.id] || ''}
                                onChange={(e) => setNewTodoAssignee({ ...newTodoAssignee, [activity.id]: e.target.value })}
                                className="px-2 py-1.5 text-xs border border-brown-200 rounded focus:outline-none focus:ring-1 focus:ring-amber-400 bg-white text-brown-600"
                              >
                                <option value="">选择负责人（可选）</option>
                                {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                              </select>
                              <input
                                type="date"
                                value={newTodoDueDate[activity.id] || ''}
                                onChange={(e) => setNewTodoDueDate({ ...newTodoDueDate, [activity.id]: e.target.value })}
                                className="px-2 py-1.5 text-xs border border-brown-200 rounded focus:outline-none focus:ring-1 focus:ring-amber-400 bg-white text-brown-600"
                              />
                            </div>
                            <button
                              onClick={() => handleAddTodo(activity.id)}
                              className="w-full py-1.5 text-xs bg-amber-400 text-white rounded hover:bg-amber-500 transition-colors"
                            >
                              添加待办
                            </button>
                          </div>
                        </div>
                      )}
                      {!isUpcoming && todos.length === 0 && <p className="text-xs text-brown-300 text-center py-2">暂无待办事项</p>}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 text-sm text-brown-400">
                    <Users size={14} />
                    <span>{activity.participants.length}人报名（含家属共{totalCount}人）</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {activity.participants.length > 0 && (
                      <button onClick={() => handleExportCSV(activity.id)} className="p-1.5 text-brown-400 hover:text-brown-600 hover:bg-brown-50 rounded-full transition-colors" title="导出报名名单">
                        <Download size={15} />
                      </button>
                    )}
                    {activity.status !== 'ended' && (
                      <button onClick={() => setJoiningActivityId(activity.id)} className="px-3 py-1.5 text-xs bg-gold-400 text-white rounded-lg hover:bg-gold-500 active:translate-y-0.5 transition-all shadow-sm">
                        报名
                      </button>
                    )}
                  </div>
                </div>

                {activity.participants.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-brown-50">
                    <button onClick={() => toggleExpand(activity.id)} className="flex items-center gap-1 text-xs text-brown-400 mb-2 hover:text-brown-600 transition-colors">
                      <span>已报名成员（按分组）：</span>
                      {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                    </button>
                    <div className="flex flex-wrap gap-1 mb-2">
                      {activity.participants.map((p) => (
                        <span key={p.memberId} className="text-xs px-2 py-0.5 bg-brown-50 rounded-full text-brown-600 border border-brown-100">
                          {getMemberName(p.memberId)}{p.bringFamily && p.familyCount > 0 && ` (+${p.familyCount}人)`}
                        </span>
                      ))}
                    </div>
                    {isExpanded && (
                      <div className="mt-3 space-y-3">
                        {Object.entries(grouped).map(([groupName, list]) => {
                          const gMembers = list.length;
                          const gFamilies = list.reduce((s, p) => s + (p.familyCount || 0), 0);
                          return (
                            <div key={groupName} className="bg-brown-50/60 rounded-lg p-3 border border-brown-100">
                              <div className="flex items-center gap-2 mb-2 pb-1 border-b border-brown-100/60">
                                <Group size={13} className="text-gold-500" />
                                <span className="text-xs font-bold text-brown-600">{groupName}</span>
                                <span className="text-[11px] text-brown-400">成员{gMembers}人·家属{gFamilies}人·共{gMembers + gFamilies}人</span>
                              </div>
                              <div className="space-y-2">
                                {list.map((p) => (
                                  <div key={p.memberId} className="bg-white rounded-lg p-2.5 text-xs">
                                    <div className="font-medium text-brown-700 mb-1 flex items-center gap-2">
                                      <span>{getMemberName(p.memberId)}</span>
                                      {p.bringFamily && p.familyCount > 0 && <span className="px-1.5 py-0.5 bg-amber-100 text-amber-600 rounded-full text-[10px]">+{p.familyCount}人家属</span>}
                                    </div>
                                    <div className="space-y-0.5 text-brown-500">
                                      {p.phone && <div className="flex items-center gap-1"><Phone size={11} /><span>{p.phone}</span></div>}
                                      {p.remark && <div className="flex items-start gap-1"><FileText size={11} className="mt-0.5" /><span>备注：{p.remark}</span></div>}
                                    </div>
                                    {isUpcoming && (
                                      <div className="mt-2 pt-2 border-t border-brown-50 flex gap-2">
                                        <button onClick={() => handleEdit(activity.id, p.memberId)} className="text-[11px] px-2 py-0.5 border border-brown-200 text-brown-500 rounded hover:bg-brown-50">编辑</button>
                                        <button onClick={() => leaveActivity(activity.id, p.memberId)} className="text-[11px] px-2 py-0.5 border border-red-200 text-red-400 rounded hover:bg-red-50">退出</button>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })}
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
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto animate-fade-in-up" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between px-6 py-4 border-b border-brown-100 sticky top-0 bg-white">
                <h2 className="font-serif text-lg font-bold text-brown-700">{editingMemberId ? '编辑报名信息' : '选择报名成员'}</h2>
                <button onClick={() => { setJoiningActivityId(null); setEditingMemberId(null); }} className="p-1 hover:bg-brown-50 rounded-full transition-colors">
                  <X size={20} className="text-brown-400" />
                </button>
              </div>

              {editingMemberId ? (
                <div className="px-6 py-4 space-y-4">
                  <div className="text-sm text-brown-600 font-medium">成员：{getMemberName(editingMemberId)}</div>

                  <div className="space-y-2">
                    <label className="text-xs text-brown-500 mb-1 block">分组</label>
                    <select
                      value={joinFormData.groupName}
                      onChange={(e) => setJoinFormData({ ...joinFormData, groupName: e.target.value })}
                      className="w-full px-3 py-2 border border-brown-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-transparent"
                    >
                      <option value="">未分组</option>
                      {allGroups.filter((g) => g !== '未分组').map((g) => <option key={g} value={g}>{g}</option>)}
                      <option value="自定义组">自定义组...</option>
                    </select>
                    {joinFormData.groupName === '自定义组' && (
                      <input
                        type="text"
                        placeholder="请输入分组名称"
                        value={joinFormData.groupName === '自定义组' ? '' : joinFormData.groupName}
                        onChange={(e) => setJoinFormData({ ...joinFormData, groupName: e.target.value })}
                        className="w-full px-3 py-2 border border-brown-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-transparent mt-1"
                      />
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm text-brown-600 cursor-pointer">
                      <input type="checkbox" checked={joinFormData.bringFamily} onChange={(e) => setJoinFormData({ ...joinFormData, bringFamily: e.target.checked })} className="w-4 h-4 text-gold-500 rounded border-brown-300 focus:ring-gold-500" />
                      <span>是否携带家属</span>
                    </label>
                    {joinFormData.bringFamily && (
                      <div className="ml-6">
                        <label className="text-xs text-brown-500 mb-1 block">携带家属人数</label>
                        <input type="number" min="0" value={joinFormData.familyCount} onChange={(e) => setJoinFormData({ ...joinFormData, familyCount: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2 border border-brown-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-transparent" />
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs text-brown-500">联系电话</label>
                    <input type="tel" value={joinFormData.phone} onChange={(e) => setJoinFormData({ ...joinFormData, phone: e.target.value })} placeholder="请输入联系电话" className="w-full px-3 py-2 border border-brown-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-transparent" />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs text-brown-500">备注</label>
                    <textarea value={joinFormData.remark} onChange={(e) => setJoinFormData({ ...joinFormData, remark: e.target.value })} placeholder="请输入备注信息（如饮食禁忌、特殊需求等）" rows={3} className="w-full px-3 py-2 border border-brown-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-transparent resize-none" />
                  </div>

                  <div className="flex gap-3">
                    <button onClick={() => setEditingMemberId(null)} className="flex-1 px-4 py-2 border border-brown-200 text-brown-600 rounded-lg hover:bg-brown-50 transition-colors text-sm">取消</button>
                    <button onClick={() => handleJoin(joiningActivityId, editingMemberId)} className="flex-1 px-4 py-2 bg-gold-400 text-white rounded-lg hover:bg-gold-500 transition-colors text-sm">保存</button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="px-6 py-3 max-h-64 overflow-y-auto">
                    {members.filter((m) => !m.deathDate).map((member) => {
                      const activity = activities.find((a) => a.id === joiningActivityId);
                      const participant = activity?.participants.find((p) => p.memberId === member.id);
                      const alreadyJoined = !!participant;
                      return (
                        <div key={member.id} className="flex items-center justify-between py-2 border-b border-brown-50 last:border-0">
                          <div className="flex-1">
                            <span className="text-sm text-brown-700">{member.name}</span>
                            {participant?.bringFamily && participant.familyCount > 0 && <span className="text-xs text-brown-400 ml-2">(+{participant.familyCount}人家属)</span>}
                            {participant?.groupName && <span className="text-xs text-gold-600 ml-2 bg-gold-100 px-1.5 py-0.5 rounded-full">{participant.groupName}</span>}
                          </div>
                          {alreadyJoined ? (
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-green-600">已报名</span>
                              <button onClick={() => handleEdit(joiningActivityId, member.id)} className="text-xs px-2 py-1 border border-brown-200 text-brown-500 rounded hover:bg-brown-50 transition-colors">编辑</button>
                              <button onClick={async () => await leaveActivity(joiningActivityId, member.id)} className="text-xs px-2 py-1 border border-red-200 text-red-500 rounded hover:bg-red-50 transition-colors">退出</button>
                            </div>
                          ) : (
                            <button onClick={() => handleEdit(joiningActivityId, member.id)} className="text-xs px-3 py-1 bg-gold-400 text-white rounded-lg hover:bg-gold-500 transition-colors">报名</button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <div className="px-6 py-3 border-t border-brown-100">
                    <button onClick={() => setJoiningActivityId(null)} className="w-full px-4 py-2 border border-brown-200 text-brown-600 rounded-lg hover:bg-brown-50 transition-colors text-sm">关闭</button>
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

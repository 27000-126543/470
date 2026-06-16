import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, X, Edit2, Trash2, BookOpen, Calendar, Camera, PartyPopper, ExternalLink } from 'lucide-react';
import useFamilyStore, { type ChronicleEntry } from '@/store/useFamilyStore';
import FamilyTreeCanvas from '@/components/FamilyTreeCanvas';
import MemberForm from '@/components/MemberForm';

const relationLabels: Record<string, string> = {
  parent: '父母',
  child: '子女',
  spouse: '配偶',
  sibling: '兄弟姐妹',
};

const typeIcons: Record<string, { icon: string; label: string }> = {
  photo: { icon: '📷', label: '照片' },
  story: { icon: '📖', label: '故事' },
  event: { icon: '🎉', label: '事件' },
};

export default function FamilyTree() {
  const navigate = useNavigate();
  const { members, chronicleEntries, selectedMember, fetchMembers, fetchChronicle, setSelectedMember, setMemberFormOpen, deleteMember } = useFamilyStore();

  useEffect(() => {
    fetchMembers();
    fetchChronicle();
  }, [fetchMembers, fetchChronicle]);

  const handleMemberClick = (member: typeof members[0]) => {
    setSelectedMember(member);
  };

  const handleEdit = () => {
    if (selectedMember) {
      setMemberFormOpen(true, selectedMember);
    }
  };

  const handleDelete = async () => {
    if (selectedMember && window.confirm(`确定删除 ${selectedMember.name} 吗？`)) {
      await deleteMember(selectedMember.id);
      setSelectedMember(null);
    }
  };

  const memberEntries = useMemo<ChronicleEntry[]>(() => {
    if (!selectedMember) return [];
    return chronicleEntries
      .filter((e) => e.relatedMemberId === selectedMember.id)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 6);
  }, [selectedMember, chronicleEntries]);

  const summary = useMemo(() => {
    if (!selectedMember) return { photo: 0, story: 0, event: 0, total: 0 };
    const entries = chronicleEntries.filter((e) => e.relatedMemberId === selectedMember.id);
    return {
      photo: entries.filter((e) => e.type === 'photo').length,
      story: entries.filter((e) => e.type === 'story').length,
      event: entries.filter((e) => e.type === 'event').length,
      total: entries.length,
    };
  }, [selectedMember, chronicleEntries]);

  const goToChronicle = () => {
    if (selectedMember) {
      navigate(`/chronicle?member=${selectedMember.id}`);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-2xl font-bold text-brown-700">家谱树</h1>
      </div>

      <div className="relative" style={{ height: 'calc(100vh - 180px)' }}>
        <FamilyTreeCanvas members={members} onMemberClick={handleMemberClick} />

        <button
          onClick={() => setMemberFormOpen(true)}
          className="absolute bottom-6 right-6 w-14 h-14 bg-gold-400 text-white rounded-full shadow-lg hover:bg-gold-500 active:translate-y-0.5 hover:shadow-xl transition-all flex items-center justify-center"
        >
          <Plus size={24} />
        </button>
      </div>

      {selectedMember && (
        <>
          <div className="fixed inset-0 bg-black/20 z-40" onClick={() => setSelectedMember(null)} />
          <div className="fixed right-0 top-0 h-full w-80 bg-white shadow-2xl z-50 animate-slide-in-right flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-brown-100">
              <h3 className="font-serif text-lg font-bold text-brown-700">成员详情</h3>
              <button onClick={() => setSelectedMember(null)} className="p-1 hover:bg-brown-50 rounded-full transition-colors">
                <X size={18} className="text-brown-400" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white text-lg font-bold ${selectedMember.gender === 'male' ? 'bg-brown-500' : 'bg-brown-300'}`}>
                  {selectedMember.name.charAt(0)}
                </div>
                <div>
                  <p className="font-serif font-bold text-brown-700 text-lg">{selectedMember.name}</p>
                  <span className={`inline-block text-xs px-2 py-0.5 rounded-full ${selectedMember.gender === 'male' ? 'bg-blue-100 text-blue-600' : 'bg-pink-100 text-pink-600'}`}>
                    {selectedMember.gender === 'male' ? '男' : '女'}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="bg-brown-50 rounded-xl p-3">
                  <p className="text-xs text-brown-400 mb-1">出生日期</p>
                  <p className="text-sm text-brown-700">{selectedMember.birthDate || '未知'}</p>
                </div>

                {selectedMember.deathDate && (
                  <div className="bg-brown-50 rounded-xl p-3">
                    <p className="text-xs text-brown-400 mb-1">逝世日期</p>
                    <p className="text-sm text-brown-700">{selectedMember.deathDate}</p>
                  </div>
                )}

                <div className="bg-brown-50 rounded-xl p-3">
                  <p className="text-xs text-brown-400 mb-1">关系类型</p>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-gold-400/10 text-gold-500">
                    {relationLabels[selectedMember.relationType] || selectedMember.relationType}
                  </span>
                </div>
              </div>

              <div className="bg-gradient-to-br from-amber-50 to-brown-50 rounded-xl p-4 border border-amber-100">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <BookOpen size={15} className="text-gold-500" />
                    <p className="font-medium text-brown-700 text-sm">家族编年史</p>
                  </div>
                  {summary.total > 0 && (
                    <button
                      onClick={goToChronicle}
                      className="flex items-center gap-1 text-[11px] px-2 py-1 bg-gold-400 text-white rounded-lg hover:bg-gold-500 transition-colors"
                    >
                      查看全部
                      <ExternalLink size={10} />
                    </button>
                  )}
                </div>

                {summary.total > 0 ? (
                  <>
                    <div className="grid grid-cols-3 gap-2 mb-3">
                      <div className="text-center bg-white rounded-lg py-2 px-1">
                        <p className="text-[10px] text-brown-400">📷 照片</p>
                        <p className="font-bold text-brown-700 text-sm">{summary.photo}</p>
                      </div>
                      <div className="text-center bg-white rounded-lg py-2 px-1">
                        <p className="text-[10px] text-brown-400">📖 故事</p>
                        <p className="font-bold text-brown-700 text-sm">{summary.story}</p>
                      </div>
                      <div className="text-center bg-white rounded-lg py-2 px-1">
                        <p className="text-[10px] text-brown-400">🎉 事件</p>
                        <p className="font-bold text-brown-700 text-sm">{summary.event}</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="text-[11px] text-brown-400">近期记录（共{summary.total}条）</p>
                      {memberEntries.map((entry) => (
                        <div key={entry.id} className="bg-white rounded-lg p-2.5 text-xs border border-brown-100">
                          <div className="flex items-center gap-1.5 mb-1">
                            <span>{typeIcons[entry.type]?.icon || '📄'}</span>
                            <span className="font-medium text-brown-700 truncate flex-1">{entry.title}</span>
                          </div>
                          <div className="flex items-center gap-2 text-[10px] text-brown-400">
                            <Calendar size={10} />
                            <span>{entry.date}</span>
                            {entry.type === 'photo' && <Camera size={10} className="ml-auto text-blue-400" />}
                            {entry.type === 'event' && <PartyPopper size={10} className="ml-auto text-green-400" />}
                          </div>
                          {entry.description && (
                            <p className="mt-1 text-[10px] text-brown-500 line-clamp-2">{entry.description}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <p className="text-[11px] text-brown-300 text-center py-3">暂无关联的编年史记录</p>
                )}
              </div>
            </div>

            <div className="px-5 py-4 border-t border-brown-100 flex gap-3">
              <button
                onClick={handleEdit}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-brown-200 text-brown-600 rounded-lg hover:bg-brown-50 transition-colors"
              >
                <Edit2 size={16} />
                <span className="text-sm">编辑</span>
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-red-200 text-red-500 rounded-lg hover:bg-red-50 transition-colors"
              >
                <Trash2 size={16} />
                <span className="text-sm">删除</span>
              </button>
            </div>
          </div>
        </>
      )}

      <MemberForm />
    </div>
  );
}

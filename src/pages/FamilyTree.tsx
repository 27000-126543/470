import { useEffect } from 'react';
import { Plus, X, Edit2, Trash2 } from 'lucide-react';
import useFamilyStore from '@/store/useFamilyStore';
import FamilyTreeCanvas from '@/components/FamilyTreeCanvas';
import MemberForm from '@/components/MemberForm';

const relationLabels: Record<string, string> = {
  parent: '父母',
  child: '子女',
  spouse: '配偶',
  sibling: '兄弟姐妹',
};

export default function FamilyTree() {
  const { members, selectedMember, fetchMembers, setSelectedMember, setMemberFormOpen, deleteMember } = useFamilyStore();

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

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

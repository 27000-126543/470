import { useState, type FormEvent } from 'react';
import { X } from 'lucide-react';
import useFamilyStore from '@/store/useFamilyStore';

const relationOptions = [
  { value: 'parent', label: '父母' },
  { value: 'child', label: '子女' },
  { value: 'spouse', label: '配偶' },
  { value: 'sibling', label: '兄弟姐妹' },
];

interface FormErrors {
  name?: string;
  birthDate?: string;
  deathDate?: string;
}

export default function MemberForm() {
  const { isMemberFormOpen, editingMember, members, setMemberFormOpen, addMember, updateMember } = useFamilyStore();
  const isEditing = !!editingMember;

  const [name, setName] = useState(editingMember?.name || '');
  const [gender, setGender] = useState<'male' | 'female'>(editingMember?.gender || 'male');
  const [birthDate, setBirthDate] = useState(editingMember?.birthDate || '');
  const [deathDate, setDeathDate] = useState(editingMember?.deathDate || '');
  const [relationType, setRelationType] = useState<'parent' | 'child' | 'spouse' | 'sibling'>(editingMember?.relationType || 'child');
  const [relatedToId, setRelatedToId] = useState(editingMember?.relatedToId || '');
  const [errors, setErrors] = useState<FormErrors>({});
  const [apiError, setApiError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isValidDate = (d: string) => {
    if (!d) return true;
    const date = new Date(d);
    return !isNaN(date.getTime());
  };

  const validate = (field?: keyof FormErrors) => {
    const newErrors: FormErrors = { ...errors };
    if (!field || field === 'name') {
      newErrors.name = name.trim() ? undefined : '姓名不能为空';
    }
    if (!field || field === 'birthDate') {
      if (!birthDate) newErrors.birthDate = '出生日期不能为空';
      else if (!isValidDate(birthDate)) newErrors.birthDate = '请输入有效的日期';
      else newErrors.birthDate = undefined;
    }
    if (!field || field === 'deathDate') {
      if (deathDate && !isValidDate(deathDate)) newErrors.deathDate = '请输入有效的日期';
      else if (deathDate && birthDate && new Date(deathDate) <= new Date(birthDate)) newErrors.deathDate = '逝世日期必须晚于出生日期';
      else newErrors.deathDate = undefined;
    }
    setErrors(newErrors);
    return !newErrors.name && !newErrors.birthDate && !newErrors.deathDate;
  };

  const handleBlur = (field: keyof FormErrors) => validate(field);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setApiError('');
    if (!validate()) return;

    setSubmitting(true);
    const data = { name: name.trim(), gender, birthDate, deathDate: deathDate || null, relationType, relatedToId: relatedToId || null };

    let error: string | null;
    if (isEditing && editingMember) {
      error = await updateMember(editingMember.id, data);
    } else {
      error = await addMember(data);
    }

    setSubmitting(false);
    if (error) {
      setApiError(error);
    } else {
      setMemberFormOpen(false);
    }
  };

  if (!isMemberFormOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-40" onClick={() => setMemberFormOpen(false)} />
      <div className="fixed right-0 top-0 h-full w-96 bg-white shadow-2xl z-50 animate-slide-in-right flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-brown-100">
          <h2 className="font-serif text-lg font-bold text-brown-700">
            {isEditing ? '编辑成员' : '添加成员'}
          </h2>
          <button onClick={() => setMemberFormOpen(false)} className="p-1 hover:bg-brown-50 rounded-full transition-colors">
            <X size={20} className="text-brown-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
          {apiError && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-2 animate-shake">
              {apiError}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-brown-600 mb-1">姓名 <span className="text-red-400">*</span></label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={() => handleBlur('name')}
              className="w-full px-3 py-2 border border-brown-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent bg-brown-50/50"
              placeholder="请输入姓名"
            />
            {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-brown-600 mb-1">性别</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="gender" value="male" checked={gender === 'male'} onChange={() => setGender('male')} className="accent-gold-500" />
                <span className="text-sm text-brown-700">男</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="gender" value="female" checked={gender === 'female'} onChange={() => setGender('female')} className="accent-gold-500" />
                <span className="text-sm text-brown-700">女</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-brown-600 mb-1">出生日期 <span className="text-red-400">*</span></label>
            <input
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              onBlur={() => handleBlur('birthDate')}
              className="w-full px-3 py-2 border border-brown-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent bg-brown-50/50"
            />
            {errors.birthDate && <p className="text-red-400 text-xs mt-1">{errors.birthDate}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-brown-600 mb-1">逝世日期</label>
            <input
              type="date"
              value={deathDate}
              onChange={(e) => setDeathDate(e.target.value)}
              onBlur={() => handleBlur('deathDate')}
              className="w-full px-3 py-2 border border-brown-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent bg-brown-50/50"
            />
            {errors.deathDate && <p className="text-red-400 text-xs mt-1">{errors.deathDate}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-brown-600 mb-1">关系类型</label>
            <select
              value={relationType}
              onChange={(e) => setRelationType(e.target.value as 'parent' | 'child' | 'spouse' | 'sibling')}
              className="w-full px-3 py-2 border border-brown-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent bg-brown-50/50"
            >
              {relationOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-brown-600 mb-1">关联成员</label>
            <select
              value={relatedToId}
              onChange={(e) => setRelatedToId(e.target.value)}
              className="w-full px-3 py-2 border border-brown-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent bg-brown-50/50"
            >
              <option value="">无</option>
              {members
                .filter((m) => m.id !== editingMember?.id)
                .map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
            </select>
          </div>
        </form>

        <div className="px-6 py-4 border-t border-brown-100 flex gap-3">
          <button
            onClick={() => setMemberFormOpen(false)}
            className="flex-1 px-4 py-2 border border-brown-200 text-brown-600 rounded-lg hover:bg-brown-50 transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSubmit as any}
            disabled={submitting}
            className="flex-1 px-4 py-2 bg-gold-400 text-white rounded-lg hover:bg-gold-500 active:translate-y-0.5 shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? '保存中...' : '保存'}
          </button>
        </div>
      </div>
    </>
  );
}

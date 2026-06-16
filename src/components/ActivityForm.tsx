import { useState, type FormEvent, useEffect } from 'react';
import { X } from 'lucide-react';
import useFamilyStore from '@/store/useFamilyStore';

export default function ActivityForm() {
  const { isActivityFormOpen, setActivityFormOpen, addActivity, updateActivity, editingActivity } = useFamilyStore();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [location, setLocation] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const isEdit = !!editingActivity;

  useEffect(() => {
    if (editingActivity) {
      setTitle(editingActivity.title || '');
      setDescription(editingActivity.description || '');
      setDate(editingActivity.date || '');
      setLocation(editingActivity.location || '');
    } else {
      setTitle('');
      setDescription('');
      setDate('');
      setLocation('');
    }
    setErrors({});
  }, [editingActivity, isActivityFormOpen]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!title.trim()) newErrors.title = '活动标题不能为空';
    if (!date) newErrors.date = '活动日期不能为空';
    if (!location.trim()) newErrors.location = '活动地点不能为空';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    if (isEdit && editingActivity) {
      await updateActivity(editingActivity.id, { title: title.trim(), description, date, location });
    } else {
      await addActivity({ title: title.trim(), description, date, location, status: 'upcoming', participants: [], createdBy: 'admin' });
    }
    setSubmitting(false);
    setTitle('');
    setDescription('');
    setDate('');
    setLocation('');
    setErrors({});
    setActivityFormOpen(false);
  };

  if (!isActivityFormOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-40" onClick={() => setActivityFormOpen(false)} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-fade-in-up" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between px-6 py-4 border-b border-brown-100">
            <h2 className="font-serif text-lg font-bold text-brown-700">{isEdit ? '编辑活动' : '发布活动'}</h2>
            <button onClick={() => setActivityFormOpen(false)} className="p-1 hover:bg-brown-50 rounded-full transition-colors">
              <X size={20} className="text-brown-400" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-brown-600 mb-1">活动标题 <span className="text-red-400">*</span></label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-brown-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent bg-brown-50/50"
                placeholder="请输入活动标题"
              />
              {errors.title && <p className="text-red-400 text-xs mt-1">{errors.title}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-brown-600 mb-1">活动描述</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-brown-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent bg-brown-50/50 resize-none"
                placeholder="请输入活动描述"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-brown-600 mb-1">活动日期 <span className="text-red-400">*</span></label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 border border-brown-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent bg-brown-50/50"
              />
              {errors.date && <p className="text-red-400 text-xs mt-1">{errors.date}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-brown-600 mb-1">活动地点 <span className="text-red-400">*</span></label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-3 py-2 border border-brown-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent bg-brown-50/50"
                placeholder="请输入活动地点"
              />
              {errors.location && <p className="text-red-400 text-xs mt-1">{errors.location}</p>}
            </div>
          </form>

          <div className="px-6 py-4 border-t border-brown-100 flex gap-3">
            <button
              onClick={() => setActivityFormOpen(false)}
              className="flex-1 px-4 py-2 border border-brown-200 text-brown-600 rounded-lg hover:bg-brown-50 transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleSubmit as any}
              disabled={submitting}
              className="flex-1 px-4 py-2 bg-gold-400 text-white rounded-lg hover:bg-gold-500 active:translate-y-0.5 shadow-md hover:shadow-lg transition-all disabled:opacity-50"
            >
              {submitting ? (isEdit ? '保存中...' : '发布中...') : (isEdit ? '保存' : '发布')}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

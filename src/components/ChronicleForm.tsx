import { useState, type FormEvent } from 'react';
import { X } from 'lucide-react';
import useFamilyStore from '@/store/useFamilyStore';

const typeOptions = [
  { value: 'photo', label: '照片' },
  { value: 'story', label: '故事' },
  { value: 'event', label: '事件' },
];

export default function ChronicleForm() {
  const { isChronicleFormOpen, setChronicleFormOpen, addChronicleEntry } = useFamilyStore();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [type, setType] = useState<'photo' | 'story' | 'event'>('story');
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!title.trim()) newErrors.title = '标题不能为空';
    if (!date) newErrors.date = '日期不能为空';
    if (type === 'photo' && !mediaFile) newErrors.mediaFile = '照片类型必须上传图片';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    let mediaUrl: string | null = null;
    if (type === 'photo' && mediaFile) {
      try {
        const formData = new FormData();
        formData.append('file', mediaFile);
        const uploadRes = await fetch('/api/chronicle/upload', { method: 'POST', body: formData });
        const uploadData = await uploadRes.json();
        if (uploadData.success) mediaUrl = uploadData.data.url;
      } catch {}
    }
    await addChronicleEntry({ title: title.trim(), description, date, type, mediaUrl, createdBy: 'admin' });
    setSubmitting(false);
    setTitle('');
    setDescription('');
    setDate('');
    setType('story');
    setMediaFile(null);
    setErrors({});
    setChronicleFormOpen(false);
  };

  if (!isChronicleFormOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-40" onClick={() => setChronicleFormOpen(false)} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-fade-in-up" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between px-6 py-4 border-b border-brown-100">
            <h2 className="font-serif text-lg font-bold text-brown-700">添加记录</h2>
            <button onClick={() => setChronicleFormOpen(false)} className="p-1 hover:bg-brown-50 rounded-full transition-colors">
              <X size={20} className="text-brown-400" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-brown-600 mb-1">标题 <span className="text-red-400">*</span></label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-brown-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent bg-brown-50/50"
                placeholder="请输入标题"
              />
              {errors.title && <p className="text-red-400 text-xs mt-1">{errors.title}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-brown-600 mb-1">描述</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-brown-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent bg-brown-50/50 resize-none"
                placeholder="请输入描述"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-brown-600 mb-1">日期 <span className="text-red-400">*</span></label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 border border-brown-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent bg-brown-50/50"
              />
              {errors.date && <p className="text-red-400 text-xs mt-1">{errors.date}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-brown-600 mb-1">类型</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as 'photo' | 'story' | 'event')}
                className="w-full px-3 py-2 border border-brown-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent bg-brown-50/50"
              >
                {typeOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {type === 'photo' && (
              <div>
                <label className="block text-sm font-medium text-brown-600 mb-1">照片上传 <span className="text-red-400">*</span></label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    setMediaFile(e.target.files?.[0] || null);
                    if (errors.mediaFile) setErrors((prev) => ({ ...prev, mediaFile: '' }));
                  }}
                  className="w-full text-sm text-brown-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-gold-400/10 file:text-gold-500 hover:file:bg-gold-400/20 file:cursor-pointer file:transition-colors"
                />
                {errors.mediaFile && <p className="text-red-400 text-xs mt-1">{errors.mediaFile}</p>}
              </div>
            )}
          </form>

          <div className="px-6 py-4 border-t border-brown-100 flex gap-3">
            <button
              onClick={() => setChronicleFormOpen(false)}
              className="flex-1 px-4 py-2 border border-brown-200 text-brown-600 rounded-lg hover:bg-brown-50 transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleSubmit as any}
              disabled={submitting}
              className="flex-1 px-4 py-2 bg-gold-400 text-white rounded-lg hover:bg-gold-500 active:translate-y-0.5 shadow-md hover:shadow-lg transition-all disabled:opacity-50"
            >
              {submitting ? '保存中...' : '保存'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

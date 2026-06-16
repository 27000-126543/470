import { useEffect, useRef, useCallback, useState, useMemo } from 'react';
import { Plus, FileDown, Camera, BookOpen, PartyPopper, Filter, X } from 'lucide-react';
import useFamilyStore from '@/store/useFamilyStore';
import ChronicleForm from '@/components/ChronicleForm';

const typeIcons: Record<string, { icon: string; color: string; label: string }> = {
  photo: { icon: '📷', color: 'bg-blue-50 text-blue-500', label: '照片' },
  story: { icon: '📖', color: 'bg-amber-50 text-amber-600', label: '故事' },
  event: { icon: '🎉', color: 'bg-green-50 text-green-600', label: '事件' },
};

export default function Chronicle() {
  const { chronicleEntries, members, familyTrees, fetchChronicle, fetchMembers, setChronicleFormOpen, deleteChronicleEntry } = useFamilyStore();
  const timelineRef = useRef<HTMLDivElement>(null);
  const visibleRefs = useRef<Map<string, boolean>>(new Map());
  const [selectedMember, setSelectedMember] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchChronicle();
    fetchMembers();
  }, [fetchChronicle, fetchMembers]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const id = entry.target.getAttribute('data-id');
          if (id) {
            visibleRefs.current.set(id, entry.isIntersecting);
            if (entry.isIntersecting) {
              (entry.target as HTMLElement).classList.add('animate-fade-in-up');
              (entry.target as HTMLElement).classList.remove('opacity-0');
            }
          }
        });
      },
      { threshold: 0.1 }
    );

    const cards = timelineRef.current?.querySelectorAll('[data-id]');
    cards?.forEach((card) => observer.observe(card));

    return () => observer.disconnect();
  }, [chronicleEntries, selectedMember, selectedYear, selectedType]);

  const sortedEntries = useMemo(() => {
    return [...chronicleEntries]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .filter((entry) => {
        if (selectedMember !== 'all' && entry.createdBy !== selectedMember) return false;
        if (selectedYear !== 'all') {
          const entryYear = new Date(entry.date).getFullYear().toString();
          if (entryYear !== selectedYear) return false;
        }
        if (selectedType !== 'all' && entry.type !== selectedType) return false;
        return true;
      });
  }, [chronicleEntries, selectedMember, selectedYear, selectedType]);

  const years = useMemo(() => {
    const yearSet = new Set(chronicleEntries.map((e) => new Date(e.date).getFullYear().toString()));
    return ['all', ...Array.from(yearSet).sort((a, b) => parseInt(b) - parseInt(a))];
  }, [chronicleEntries]);

  const familyName = familyTrees[0]?.name || '我的家族';

  const handleExportPDF = useCallback(async () => {
    if (!timelineRef.current) return;

    const images = timelineRef.current.querySelectorAll('img');
    const imagePromises = Array.from(images).map((img) => {
      if (img.complete) return Promise.resolve();
      return new Promise<void>((resolve) => {
        img.onload = () => resolve();
        img.onerror = () => resolve();
      });
    });
    await Promise.all(imagePromises);

    const html2canvas = (await import('html2canvas')).default;
    const jsPDF = (await import('jspdf')).default;

    const now = new Date();
    const exportTime = now.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });

    const headerHeight = 40;
    const canvas = await html2canvas(timelineRef.current, {
      backgroundColor: '#F5F0EB',
      scale: 2,
      useCORS: true,
      allowTaint: true,
      logging: false,
    });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const contentHeight = (canvas.height * pdfWidth) / canvas.width;

    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text(familyName, pdfWidth / 2, 20, { align: 'center' });

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`导出时间：${exportTime}`, pdfWidth / 2, 28, { align: 'center' });
    pdf.text(`记录数量：${sortedEntries.length}条`, pdfWidth / 2, 34, { align: 'center' });

    if (selectedMember !== 'all' || selectedYear !== 'all' || selectedType !== 'all') {
      const filters: string[] = [];
      if (selectedMember !== 'all') {
        const member = members.find((m) => m.id === selectedMember);
        if (member) filters.push(`成员：${member.name}`);
      }
      if (selectedYear !== 'all') filters.push(`年份：${selectedYear}`);
      if (selectedType !== 'all') filters.push(`类型：${typeIcons[selectedType]?.label || selectedType}`);
      if (filters.length > 0) {
        pdf.text(`筛选条件：${filters.join(' | ')}`, pdfWidth / 2, 40, { align: 'center' });
      }
    }

    const imgY = headerHeight + 5;
    const availableHeight = pdf.internal.pageSize.getHeight() - imgY - 10;
    const scale = availableHeight / contentHeight;
    const scaledHeight = contentHeight * scale;

    pdf.addImage(imgData, 'PNG', 5, imgY, pdfWidth - 10, scaledHeight);

    let heightLeft = scaledHeight;
    let position = 0;

    while (heightLeft > availableHeight + 1) {
      position = heightLeft - scaledHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 5, -position + imgY, pdfWidth - 10, scaledHeight);
      heightLeft -= availableHeight;
    }

    pdf.save(`${familyName}-家族编年史.pdf`);
  }, [sortedEntries.length, familyName, selectedMember, selectedYear, selectedType, members]);

  const getMemberName = (id: string) => members.find((m) => m.id === id)?.name || '未知成员';

  const clearFilters = () => {
    setSelectedMember('all');
    setSelectedYear('all');
    setSelectedType('all');
  };

  const hasActiveFilters = selectedMember !== 'all' || selectedYear !== 'all' || selectedType !== 'all';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-2xl font-bold text-brown-700">家族编年史</h1>
        <div className="flex gap-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors text-sm ${
              showFilters || hasActiveFilters
                ? 'bg-gold-400 text-white border-gold-400'
                : 'border-brown-200 text-brown-600 hover:bg-brown-50'
            }`}
          >
            <Filter size={16} />
            <span>筛选</span>
            {hasActiveFilters && (
              <span className="w-5 h-5 bg-white text-gold-500 rounded-full text-xs flex items-center justify-center font-bold">
                {(selectedMember !== 'all' ? 1 : 0) + (selectedYear !== 'all' ? 1 : 0) + (selectedType !== 'all' ? 1 : 0)}
              </span>
            )}
          </button>
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-2 px-4 py-2 border border-brown-200 text-brown-600 rounded-lg hover:bg-brown-50 transition-colors text-sm"
          >
            <FileDown size={16} />
            <span>导出PDF</span>
          </button>
          <button
            onClick={() => setChronicleFormOpen(true)}
            className="w-12 h-12 bg-gold-400 text-white rounded-full shadow-lg hover:bg-gold-500 active:translate-y-0.5 hover:shadow-xl transition-all flex items-center justify-center"
          >
            <Plus size={22} />
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-brown-100 animate-fade-in-up">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-serif font-bold text-brown-700">筛选条件</h3>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 text-xs text-brown-400 hover:text-brown-600 transition-colors"
              >
                <X size={14} />
                清除筛选
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-brown-500 mb-1 block">按成员</label>
              <select
                value={selectedMember}
                onChange={(e) => setSelectedMember(e.target.value)}
                className="w-full px-3 py-2 border border-brown-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-transparent"
              >
                <option value="all">全部成员</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-brown-500 mb-1 block">按年份</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="w-full px-3 py-2 border border-brown-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-transparent"
              >
                <option value="all">全部年份</option>
                {years.filter((y) => y !== 'all').map((y) => (
                  <option key={y} value={y}>{y}年</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-brown-500 mb-1 block">按类型</label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full px-3 py-2 border border-brown-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-transparent"
              >
                <option value="all">全部类型</option>
                {Object.entries(typeIcons).map(([key, val]) => (
                  <option key={key} value={key}>{val.label}</option>
                ))}
              </select>
            </div>
          </div>
          {hasActiveFilters && (
            <div className="mt-4 pt-4 border-t border-brown-100">
              <p className="text-xs text-brown-400">
                当前筛选结果：共 <span className="font-medium text-brown-600">{sortedEntries.length}</span> 条记录
              </p>
            </div>
          )}
        </div>
      )}

      {sortedEntries.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 shadow-sm border border-brown-100 text-center">
          <p className="text-brown-300 text-lg font-serif">暂无记录</p>
          <p className="text-brown-200 text-sm mt-1">
            {hasActiveFilters ? '当前筛选条件下没有记录，请尝试调整筛选条件' : '点击右上角按钮添加新的记录'}
          </p>
        </div>
      ) : (
        <div ref={timelineRef} className="relative">
          <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-gold-300/50 -translate-x-1/2" />

          {(() => {
            const displayedYears = [...new Set(sortedEntries.map((e) => new Date(e.date).getFullYear()))];
            return displayedYears.map((year) => (
              <div key={year}>
                <div className="flex justify-center my-6">
                  <div className="bg-gold-400 text-white px-4 py-1 rounded-full font-serif font-bold text-sm shadow-sm z-10">
                    {year}
                  </div>
                </div>

                {sortedEntries
                  .filter((e) => new Date(e.date).getFullYear() === year)
                  .map((entry, index) => {
                    const isLeft = index % 2 === 0;
                    const typeInfo = typeIcons[entry.type] || typeIcons.story;

                    return (
                      <div
                        key={entry.id}
                        data-id={entry.id}
                        className={`relative flex items-start mb-6 opacity-0 ${
                          isLeft ? 'flex-row' : 'flex-row-reverse'
                        }`}
                      >
                        <div className={`w-5/12 ${isLeft ? 'pr-8 text-right' : 'pl-8'}`}>
                          <div className="bg-white rounded-2xl p-4 shadow-sm border border-brown-100 hover:shadow-md transition-shadow overflow-hidden">
                            {entry.type === 'photo' && entry.mediaUrl && (
                              <div className="mb-3 rounded-lg overflow-hidden">
                                <img
                                  src={entry.mediaUrl}
                                  alt={entry.title}
                                  className="w-full h-40 object-cover rounded-lg"
                                  crossOrigin="anonymous"
                                />
                              </div>
                            )}
                            <div className={`flex items-center gap-2 mb-2 ${isLeft ? 'justify-end' : ''}`}>
                              <span className="text-lg">{typeInfo.icon}</span>
                              <h3 className="font-serif font-bold text-brown-700 text-sm">{entry.title}</h3>
                            </div>
                            {entry.description && (
                              <p className="text-xs text-brown-400 mb-2 line-clamp-3">{entry.description}</p>
                            )}
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-brown-300">{entry.date}</span>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-brown-300">{getMemberName(entry.createdBy)}</span>
                                <button
                                  onClick={() => deleteChronicleEntry(entry.id)}
                                  className="text-xs text-brown-300 hover:text-red-400 transition-colors"
                                >
                                  删除
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="w-2/12 flex justify-center relative z-10">
                          <div className="w-4 h-4 bg-gold-400 rounded-full border-4 border-brown-50 mt-4 shadow-sm" />
                        </div>

                        <div className="w-5/12" />
                      </div>
                    );
                  })}
              </div>
            ));
          })()}
        </div>
      )}

      <ChronicleForm />
    </div>
  );
}

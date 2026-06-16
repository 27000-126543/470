import { useEffect, useRef, useCallback } from 'react';
import { Plus, FileDown, Camera, BookOpen, PartyPopper } from 'lucide-react';
import useFamilyStore from '@/store/useFamilyStore';
import ChronicleForm from '@/components/ChronicleForm';

const typeIcons: Record<string, { icon: string; color: string }> = {
  photo: { icon: '📷', color: 'bg-blue-50 text-blue-500' },
  story: { icon: '📖', color: 'bg-amber-50 text-amber-600' },
  event: { icon: '🎉', color: 'bg-green-50 text-green-600' },
};

export default function Chronicle() {
  const { chronicleEntries, fetchChronicle, setChronicleFormOpen, deleteChronicleEntry } = useFamilyStore();
  const timelineRef = useRef<HTMLDivElement>(null);
  const visibleRefs = useRef<Map<string, boolean>>(new Map());

  useEffect(() => {
    fetchChronicle();
  }, [fetchChronicle]);

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
  }, [chronicleEntries]);

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
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    let heightLeft = pdfHeight;
    let position = 0;

    pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
    heightLeft -= pdf.internal.pageSize.getHeight();

    while (heightLeft > 0) {
      position = heightLeft - pdfHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
      heightLeft -= pdf.internal.pageSize.getHeight();
    }

    pdf.save('家族编年史.pdf');
  }, []);

  const sortedEntries = [...chronicleEntries].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const years = [...new Set(sortedEntries.map((e) => new Date(e.date).getFullYear()))];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-2xl font-bold text-brown-700">家族编年史</h1>
        <div className="flex gap-3">
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

      {sortedEntries.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 shadow-sm border border-brown-100 text-center">
          <p className="text-brown-300 text-lg font-serif">暂无记录</p>
          <p className="text-brown-200 text-sm mt-1">点击右上角按钮添加新的记录</p>
        </div>
      ) : (
        <div ref={timelineRef} className="relative">
          <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-gold-300/50 -translate-x-1/2" />

          {years.map((year) => (
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
                            <button
                              onClick={() => deleteChronicleEntry(entry.id)}
                              className="text-xs text-brown-300 hover:text-red-400 transition-colors"
                            >
                              删除
                            </button>
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
          ))}
        </div>
      )}

      <ChronicleForm />
    </div>
  );
}

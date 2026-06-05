import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  BarChart3,
  Clock3,
  Mic,
  RefreshCw,
  Sparkles,
  Volume2,
} from 'lucide-react';
import { speechApi, SpeechControlResult } from '@/services/api';
import { formatDisplayConfidencePercent, formatTimestamp, getDisplayConfidencePercent } from '@/utils/helpers';
import { PaginationControls } from '@/components/common/PaginationControls';

const confidenceTone = (confidence: number) => {
  if (confidence >= 0.7) {
    return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200';
  }

  if (confidence >= 0.5) {
    return 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-200';
  }

  return 'bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-200';
};

const predictionLabel = (item: SpeechControlResult) => {
  return Number(item.confidence || 0) < 0.7 ? 'UNKNOWN' : item.predictLabel || 'UNKNOWN';
};

export const SpeechHistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const selectedSpeechInputId = searchParams.get('speechInputId');
  const [items, setItems] = useState<SpeechControlResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const loadHistory = async () => {
    setLoading(true);
    setError(null);

    try {
      const history = await speechApi.getHistory();
      setItems(history);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Không thể tải lịch sử giọng nói');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  useEffect(() => {
    if (!selectedSpeechInputId) return;
    const selectedIndex = items.findIndex((item) => item.id === selectedSpeechInputId);
    if (selectedIndex >= 0) {
      setPage(Math.floor(selectedIndex / pageSize) + 1);
    }
  }, [items, selectedSpeechInputId, pageSize]);

  const averageConfidence = useMemo(() => {
    if (items.length === 0) return 0;
    return items.reduce(
      (sum, item) => sum + getDisplayConfidencePercent(Number(item.confidence || 0), item.rawtext || ''),
      0
    ) / items.length;
  }, [items]);

  const highConfidenceCount = items.filter((item) => Number(item.confidence || 0) >= 0.7).length;
  const totalPages = Math.max(Math.ceil(items.length / pageSize), 1);
  const currentPage = Math.min(page, totalPages);
  const pagedItems = items.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-white">
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-900/90 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="p-2.5 rounded-lg border border-slate-200 text-slate-600 hover:text-slate-950 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800 transition-colors"
                aria-label="Quay lại bảng điều khiển"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>

              <div className="p-3 rounded-xl bg-purple-50 border border-purple-100 text-purple-700 dark:bg-purple-950/40 dark:border-purple-900 dark:text-purple-300">
                <Volume2 className="w-6 h-6" />
              </div>

              <div>
                <p className="text-sm font-medium text-purple-700 dark:text-purple-300">Điều khiển giọng nói</p>
                <h1 className="text-2xl font-bold tracking-tight text-slate-950 dark:text-white">
                  Lịch sử dự đoán giọng nói
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Theo dõi văn bản gốc, nhãn dự đoán và độ tin cậy từ AI service.
                </p>
              </div>
            </div>

            <button
              onClick={loadHistory}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-slate-900 text-white font-medium hover:bg-slate-800 disabled:opacity-50 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Làm mới
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <p className="text-sm text-slate-500 dark:text-slate-400">Tổng lượt dự đoán</p>
            <div className="mt-2 flex items-end justify-between">
              <span className="text-3xl font-bold text-slate-950 dark:text-white">{items.length}</span>
              <Mic className="w-6 h-6 text-slate-400" />
            </div>
          </div>

          <div className="rounded-xl border border-purple-100 bg-purple-50 p-5 shadow-sm dark:border-purple-900 dark:bg-purple-950/30">
            <p className="text-sm text-purple-700 dark:text-purple-300">Confidence trung bình</p>
            <div className="mt-2 flex items-end justify-between">
              <span className="text-3xl font-bold text-purple-900 dark:text-purple-100">
                {averageConfidence.toFixed(2)}%
              </span>
              <BarChart3 className="w-6 h-6 text-purple-600 dark:text-purple-300" />
            </div>
          </div>

          <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-5 shadow-sm dark:border-emerald-900 dark:bg-emerald-950/30">
            <p className="text-sm text-emerald-700 dark:text-emerald-300">Confidence cao</p>
            <div className="mt-2 flex items-end justify-between">
              <span className="text-3xl font-bold text-emerald-900 dark:text-emerald-100">{highConfidenceCount}</span>
              <Sparkles className="w-6 h-6 text-emerald-600 dark:text-emerald-300" />
            </div>
          </div>
        </section>

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
            {error}
          </div>
        )}

        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800">
            <h2 className="text-lg font-bold text-slate-950 dark:text-white">Danh sách lịch sử</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {selectedSpeechInputId
                ? 'Bản ghi được mở từ lịch sử hoạt động đang được làm nổi bật.'
                : 'Sắp xếp theo thời gian mới nhất trước.'}
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px]">
              <thead className="bg-slate-50 dark:bg-slate-950/60">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Thời gian
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Văn bản gốc
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Nhãn dự đoán
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Confidence
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {loading && (
                  <tr>
                    <td colSpan={4} className="px-6 py-10 text-sm text-slate-500 dark:text-slate-400">
                      Đang tải lịch sử giọng nói...
                    </td>
                  </tr>
                )}

                {!loading && !error && items.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-14">
                      <div className="flex flex-col items-center text-center">
                        <Clock3 className="w-10 h-10 text-slate-300 dark:text-slate-600" />
                        <p className="mt-3 font-semibold text-slate-900 dark:text-white">Chưa có lịch sử giọng nói</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          Khi bạn dùng điều khiển giọng nói, kết quả dự đoán sẽ xuất hiện tại đây.
                        </p>
                      </div>
                    </td>
                  </tr>
                )}

                {!loading && !error && pagedItems.map((item) => {
                  const confidence = Number(item.confidence || 0);

                  return (
                    <tr
                      key={item.id}
                      className={`transition-colors ${
                        item.id === selectedSpeechInputId
                          ? 'bg-purple-50 dark:bg-purple-950/30'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                      }`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700 dark:text-slate-200">
                        {item.createdAt ? formatTimestamp(item.createdAt) : 'Chưa có thời gian'}
                      </td>
                      <td className="px-6 py-4">
                        <p className="max-w-md text-sm font-medium text-slate-950 dark:text-white">
                          {item.rawtext || 'Không có văn bản gốc'}
                        </p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-semibold text-slate-800 dark:bg-slate-800 dark:text-slate-100">
                          {predictionLabel(item)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`rounded-full px-3 py-1.5 text-sm font-bold ${confidenceTone(confidence)}`}>
                          {formatDisplayConfidencePercent(confidence, item.rawtext || '')}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {!loading && !error && (
            <PaginationControls
              currentPage={currentPage}
              pageSize={pageSize}
              totalItems={items.length}
              onPageChange={setPage}
              onPageSizeChange={(nextPageSize) => {
                setPageSize(nextPageSize);
                setPage(1);
              }}
            />
          )}
        </section>
      </main>
    </div>
  );
};

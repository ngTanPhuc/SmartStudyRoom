import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Activity, ArrowLeft, Clock, Droplets, RefreshCw, Sun, Thermometer } from 'lucide-react';
import { feedApi } from '@/services/api';
import { FeedName, HistoricalDataPoint } from '@/types';
import { formatTimestamp } from '@/utils/helpers';

type SensorTypeParam = 'temperature' | 'humidity' | 'light';
const PAGE_SIZE = 20;

const SENSOR_CONFIG: Record<SensorTypeParam, {
  label: string;
  feed: FeedName;
  unit: string;
  icon: React.ElementType;
  accent: string;
  soft: string;
}> = {
  temperature: {
    label: 'Nhiệt độ',
    feed: 'bbc-temp',
    unit: '°C',
    icon: Thermometer,
    accent: 'from-blue-600 to-cyan-500',
    soft: 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300',
  },
  humidity: {
    label: 'Độ ẩm',
    feed: 'bbc-humi',
    unit: '%',
    icon: Droplets,
    accent: 'from-emerald-600 to-teal-500',
    soft: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300',
  },
  light: {
    label: 'Ánh sáng',
    feed: 'bbc-lux',
    unit: 'lux',
    icon: Sun,
    accent: 'from-amber-500 to-orange-500',
    soft: 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300',
  },
};

const isValidSensorType = (value: string | undefined): value is SensorTypeParam =>
  value === 'temperature' || value === 'humidity' || value === 'light';

export const SensorDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const { sensorType } = useParams();
  const selectedType: SensorTypeParam = isValidSensorType(sensorType) ? sensorType : 'temperature';
  const config = SENSOR_CONFIG[selectedType];
  const Icon = config.icon;

  const [data, setData] = useState<HistoricalDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      const history = await feedApi.getHistory({ feed: config.feed, limit: 200 });
      setData(history);
      setPage(1);
    } catch (err: any) {
      setData([]);
      setError(err.response?.data?.message || err.message || 'Không thể tải dữ liệu sensor');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedType]);

  const stats = useMemo(() => {
    if (data.length === 0) {
      return { latest: 0, min: 0, max: 0, avg: 0 };
    }

    const values = data.map((item) => item.value);
    const sum = values.reduce((total, value) => total + value, 0);
    return {
      latest: values[0],
      min: Math.min(...values),
      max: Math.max(...values),
      avg: sum / values.length,
    };
  }, [data]);

  const trend = data.slice(0, 24).reverse();
  const trendMax = Math.max(...trend.map((item) => item.value), 1);
  const totalPages = Math.max(Math.ceil(data.length / PAGE_SIZE), 1);
  const currentPage = Math.min(page, totalPages);
  const pagedData = data.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className={`bg-gradient-to-r ${config.accent} text-white`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="p-2 rounded-lg bg-white/15 hover:bg-white/25 transition-colors"
                aria-label="Quay lại dashboard"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="p-3 rounded-xl bg-white/15">
                <Icon className="w-7 h-7" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Dữ liệu {config.label}</h1>
                <p className="text-white/80 text-sm">Theo dõi lịch sử đo từ backend</p>
              </div>
            </div>

            <button
              onClick={fetchData}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/15 hover:bg-white/25 disabled:opacity-50 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Làm mới
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            ['Hiện tại', stats.latest],
            ['Trung bình', stats.avg],
            ['Thấp nhất', stats.min],
            ['Cao nhất', stats.max],
          ].map(([label, value]) => (
            <div key={label as string} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 shadow-sm">
              <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
              <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                {(value as number).toFixed(2)}
                <span className="text-base font-semibold text-gray-500 dark:text-gray-400 ml-1">{config.unit}</span>
              </p>
            </div>
          ))}
        </div>

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm mb-6">
          <div className="flex items-center gap-2 mb-5">
            <Activity className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Xu hướng 24 bản ghi mới nhất</h2>
          </div>
          <div className="h-36 flex items-end gap-2">
            {trend.length === 0 ? (
              <div className="text-sm text-gray-500 dark:text-gray-400">Chưa có dữ liệu xu hướng</div>
            ) : (
              trend.map((item, index) => (
                <div key={`${item.timestamp}-${index}`} className="flex-1 flex flex-col items-center gap-2">
                  <div
                    className={`w-full rounded-t-md bg-gradient-to-t ${config.accent} min-h-[6px]`}
                    style={{ height: `${Math.max((item.value / trendMax) * 100, 6)}%` }}
                    title={`${item.value.toFixed(2)} ${config.unit}`}
                  />
                </div>
              ))
            )}
          </div>
        </div>

        <div className="overflow-hidden bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Bảng dữ liệu</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Hiển thị {PAGE_SIZE} bản ghi mỗi trang
              </p>
            </div>
            <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${config.soft}`}>
              <Clock className="w-4 h-4" />
              {data.length} bản ghi
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">STT</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Thời gian</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Giá trị</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {loading && (
                  <tr>
                    <td colSpan={3} className="px-6 py-8 text-sm text-gray-500 dark:text-gray-400">Đang tải dữ liệu...</td>
                  </tr>
                )}
                {!loading && error && (
                  <tr>
                    <td colSpan={3} className="px-6 py-8 text-sm text-red-600 dark:text-red-400">{error}</td>
                  </tr>
                )}
                {!loading && !error && data.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-6 py-8 text-sm text-gray-500 dark:text-gray-400">Chưa có dữ liệu cho sensor này</td>
                  </tr>
                )}
                {!loading && !error && pagedData.map((item, index) => (
                  <tr key={`${item.timestamp}-${index}`} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      {(currentPage - 1) * PAGE_SIZE + index + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{formatTimestamp(item.timestamp)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 dark:text-gray-100">
                      {item.value.toFixed(2)} {config.unit}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {!loading && !error && data.length > PAGE_SIZE && (
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row items-center justify-between gap-3">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Trang {currentPage}/{totalPages} · Bản ghi {(currentPage - 1) * PAGE_SIZE + 1}
                -{Math.min(currentPage * PAGE_SIZE, data.length)} trong {data.length}
              </p>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm font-medium text-gray-700 dark:text-gray-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Trước
                </button>
                {Array.from({ length: totalPages }, (_, index) => index + 1)
                  .filter((pageNumber) =>
                    pageNumber === 1 ||
                    pageNumber === totalPages ||
                    Math.abs(pageNumber - currentPage) <= 1
                  )
                  .map((pageNumber, index, visiblePages) => (
                    <React.Fragment key={pageNumber}>
                      {index > 0 && pageNumber - visiblePages[index - 1] > 1 && (
                        <span className="px-1 text-gray-400">...</span>
                      )}
                      <button
                        onClick={() => setPage(pageNumber)}
                        className={`min-w-10 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          pageNumber === currentPage
                            ? `bg-gradient-to-r ${config.accent} text-white`
                            : 'border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                      >
                        {pageNumber}
                      </button>
                    </React.Fragment>
                  ))}
                <button
                  onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm font-medium text-gray-700 dark:text-gray-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Sau
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

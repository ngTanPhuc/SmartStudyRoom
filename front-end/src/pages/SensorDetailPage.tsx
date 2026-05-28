import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, BarChart3, Clock, Droplets, Filter, RefreshCw, Sun, Thermometer, Trash2 } from 'lucide-react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
} from 'chart.js';
import { format, subDays, subMonths, subWeeks } from 'date-fns';
import { feedApi } from '@/services/api';
import { FeedName, HistoricalDataPoint } from '@/types';
import { formatTimestamp } from '@/utils/helpers';
import { PaginationControls } from '@/components/common/PaginationControls';

type SensorTypeParam = 'temperature' | 'humidity' | 'light';
type ChartRange = 'day' | 'week' | 'month' | 'all';
type SortOrder = 'desc' | 'asc';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler);

const SENSOR_CONFIG: Record<SensorTypeParam, {
  label: string;
  feed: FeedName;
  unit: string;
  icon: React.ElementType;
  accent: string;
  soft: string;
  chartColor: string;
  chartFill: string;
}> = {
  temperature: {
    label: 'Nhiệt độ',
    feed: 'bbc-temp',
    unit: '°C',
    icon: Thermometer,
    accent: 'from-blue-600 to-cyan-500',
    soft: 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300',
    chartColor: '#2563eb',
    chartFill: 'rgba(37, 99, 235, 0.12)',
  },
  humidity: {
    label: 'Độ ẩm',
    feed: 'bbc-humi',
    unit: '%',
    icon: Droplets,
    accent: 'from-emerald-600 to-teal-500',
    soft: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300',
    chartColor: '#059669',
    chartFill: 'rgba(5, 150, 105, 0.12)',
  },
  light: {
    label: 'Ánh sáng',
    feed: 'bbc-lux',
    unit: 'lux',
    icon: Sun,
    accent: 'from-amber-500 to-orange-500',
    soft: 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300',
    chartColor: '#d97706',
    chartFill: 'rgba(217, 119, 6, 0.12)',
  },
};

const isValidSensorType = (value: string | undefined): value is SensorTypeParam =>
  value === 'temperature' || value === 'humidity' || value === 'light';

const getChartStartDate = (range: ChartRange) => {
  const now = new Date();
  if (range === 'day') return subDays(now, 1);
  if (range === 'week') return subWeeks(now, 1);
  if (range === 'month') return subMonths(now, 1);
  return null;
};

const getChartLabelFormat = (range: ChartRange) => {
  if (range === 'day') return 'HH:mm';
  if (range === 'week') return 'dd/MM HH:mm';
  return 'dd/MM';
};

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
  const [pageSize, setPageSize] = useState(20);
  const [chartRange, setChartRange] = useState<ChartRange>('day');
  const [filterFrom, setFilterFrom] = useState('');
  const [filterTo, setFilterTo] = useState('');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [deleteFrom, setDeleteFrom] = useState('');
  const [deleteTo, setDeleteTo] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteMessage, setDeleteMessage] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      const history = await feedApi.getHistory({ feed: config.feed, limit: 1000 });
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

  useEffect(() => {
    setPage(1);
  }, [filterFrom, filterTo, sortOrder]);

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

  const chartPoints = useMemo(() => {
    const startDate = getChartStartDate(chartRange);
    return [...data]
      .filter((item) => {
        if (!startDate) return true;
        return new Date(item.timestamp) >= startDate;
      })
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }, [data, chartRange]);

  const chartData = useMemo(() => ({
    labels: chartPoints.map((item) => format(new Date(item.timestamp), getChartLabelFormat(chartRange))),
    datasets: [
      {
        label: `${config.label} (${config.unit})`,
        data: chartPoints.map((item) => item.value),
        borderColor: config.chartColor,
        backgroundColor: config.chartFill,
        fill: true,
        tension: 0.35,
        pointRadius: chartPoints.length > 80 ? 0 : 2,
      },
    ],
  }), [chartPoints, chartRange, config]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
      },
    },
    scales: {
      y: {
        beginAtZero: false,
      },
    },
  };

  const filteredData = useMemo(() => {
    const fromDate = filterFrom ? new Date(`${filterFrom}T00:00:00`) : null;
    const toDate = filterTo ? new Date(`${filterTo}T23:59:59.999`) : null;

    return [...data]
      .filter((item) => {
        const timestamp = new Date(item.timestamp);
        if (fromDate && timestamp < fromDate) return false;
        if (toDate && timestamp > toDate) return false;
        return true;
      })
      .sort((a, b) => {
        const diff = new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
        return sortOrder === 'asc' ? diff : -diff;
      });
  }, [data, filterFrom, filterTo, sortOrder]);

  const totalPages = Math.max(Math.ceil(filteredData.length / pageSize), 1);
  const currentPage = Math.min(page, totalPages);
  const pagedData = filteredData.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleDeleteByDateRange = async () => {
    setDeleteMessage(null);
    setDeleteError(null);

    const from = deleteFrom ? new Date(`${deleteFrom}T00:00:00`) : null;
    const to = deleteTo ? new Date(`${deleteTo}T23:59:59.999`) : null;
    if (from && to && from > to) {
      setDeleteError('Mốc từ ngày không được lớn hơn đến ngày');
      return;
    }

    const deleteScope = deleteFrom && deleteTo
      ? `từ ${deleteFrom} đến ${deleteTo}`
      : deleteTo
      ? `từ ${deleteTo} trở về trước`
      : deleteFrom
      ? `từ ${deleteFrom} trở về sau`
      : 'toàn bộ dữ liệu';

    const confirmed = window.confirm(
      `Xóa ${deleteScope} của cảm biến ${config.label.toLowerCase()}? Thao tác này không thể hoàn tác.`
    );
    if (!confirmed) return;

    setDeleting(true);
    try {
      const deletedCount = await feedApi.deleteHistory({
        feed: config.feed,
        from: deleteFrom ? `${deleteFrom}T00:00:00` : undefined,
        to: deleteTo ? `${deleteTo}T23:59:59` : undefined,
      });
      setDeleteMessage(`Đã xóa ${deletedCount} bản ghi dữ liệu ${config.label.toLowerCase()}`);
      setDeleteFrom('');
      setDeleteTo('');
      await fetchData();
    } catch (err: any) {
      setDeleteError(err.response?.data?.message || err.message || 'Không thể xóa dữ liệu cảm biến');
    } finally {
      setDeleting(false);
    }
  };

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
                <p className="text-white/80 text-sm">
                  Theo dõi lịch sử đo từ cảm biến {config.label.toLowerCase()}
                </p>
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
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-5">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Biểu đồ dữ liệu</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Xem dữ liệu theo ngày, tuần, tháng hoặc toàn bộ</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {([
                ['day', 'Ngày'],
                ['week', 'Tuần'],
                ['month', 'Tháng'],
                ['all', 'Tất cả'],
              ] as Array<[ChartRange, string]>).map(([value, label]) => (
                <button
                  key={value}
                  onClick={() => setChartRange(value)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    chartRange === value
                      ? `bg-gradient-to-r ${config.accent} text-white`
                      : 'border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="h-72">
            {chartPoints.length === 0 ? (
              <div className="h-full flex items-center text-sm text-gray-500 dark:text-gray-400">
                Chưa có dữ liệu biểu đồ trong khoảng thời gian này
              </div>
            ) : (
              <Line data={chartData} options={chartOptions} />
            )}
          </div>
        </div>

        <div className="overflow-hidden bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Bảng dữ liệu</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Hiển thị {pageSize} bản ghi mỗi trang
                </p>
              </div>
              <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${config.soft}`}>
                <Clock className="w-4 h-4" />
                {filteredData.length}/{data.length} bản ghi
              </span>
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Từ ngày</label>
                <input
                  type="date"
                  value={filterFrom}
                  onChange={(event) => setFilterFrom(event.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Đến ngày</label>
                <input
                  type="date"
                  value={filterTo}
                  onChange={(event) => setFilterTo(event.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Sắp xếp thời gian</label>
                <select
                  value={sortOrder}
                  onChange={(event) => setSortOrder(event.target.value as SortOrder)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                >
                  <option value="desc">Mới nhất trước</option>
                  <option value="asc">Cũ nhất trước</option>
                </select>
              </div>
            </div>

            {(filterFrom || filterTo) && (
              <button
                type="button"
                onClick={() => {
                  setFilterFrom('');
                  setFilterTo('');
                }}
                className="mt-3 inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <Filter className="w-4 h-4" />
                Xóa bộ lọc ngày
              </button>
            )}
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
                {!loading && !error && filteredData.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-6 py-8 text-sm text-gray-500 dark:text-gray-400">Chưa có dữ liệu phù hợp</td>
                  </tr>
                )}
                {!loading && !error && pagedData.map((item, index) => (
                  <tr key={`${item.timestamp}-${index}`} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      {(currentPage - 1) * pageSize + index + 1}
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

          {!loading && !error && (
            <PaginationControls
              currentPage={currentPage}
              pageSize={pageSize}
              totalItems={filteredData.length}
              onPageChange={setPage}
              onPageSizeChange={(nextPageSize) => {
                setPageSize(nextPageSize);
                setPage(1);
              }}
            />
          )}
        </div>

        <div className="mt-6 bg-white dark:bg-gray-800 border border-red-200 dark:border-red-900/70 rounded-xl p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-300">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Dọn dữ liệu cảm biến</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Xóa dữ liệu theo mốc thời gian để tránh lưu quá nhiều bản ghi.
                </p>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Bỏ trống một mốc để xóa một phía; bỏ trống cả hai để xóa toàn bộ dữ liệu.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-3 w-full lg:max-w-2xl">
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Từ ngày</label>
                <input
                  type="date"
                  value={deleteFrom}
                  onChange={(event) => setDeleteFrom(event.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Đến ngày</label>
                <input
                  type="date"
                  value={deleteTo}
                  onChange={(event) => setDeleteTo(event.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={handleDeleteByDateRange}
                  disabled={deleting}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 disabled:opacity-50 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  {deleting ? 'Đang xóa...' : 'Xóa dữ liệu'}
                </button>
              </div>
            </div>
          </div>

          {(deleteMessage || deleteError) && (
            <div
              className={`mt-4 flex items-start gap-2 rounded-lg border px-3 py-2 text-sm ${
                deleteError
                  ? 'border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300'
                  : 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300'
              }`}
            >
              <AlertTriangle className="w-4 h-4 mt-0.5" />
              <span>{deleteError || deleteMessage}</span>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

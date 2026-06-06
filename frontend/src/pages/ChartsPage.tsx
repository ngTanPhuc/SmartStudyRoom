import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, BarChart3 } from 'lucide-react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { format, subHours } from 'date-fns';
import { adafruitFeedApi } from '@/services/adafruitApi';
import { feedApi } from '@/services/api';
import { useAdafruitProvider } from '@/shared/config/dataProvider';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export const ChartsPage: React.FC = () => {
  const navigate = useNavigate();
  const [timeRange, setTimeRange] = useState<'1h' | '6h' | '24h' | '7d'>('6h');
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState<{
    labels: string[];
    tempData: number[];
    humiData: number[];
    lightData: number[];
  }>({ labels: [], tempData: [], humiData: [], lightData: [] });

  // Fetch real data from Adafruit IO
  useEffect(() => {
    const fetchHistoricalData = async () => {
      setLoading(true);
      try {
        const hoursMap = { '1h': 1, '6h': 6, '24h': 24, '7d': 168 };
        const limit = Math.min(hoursMap[timeRange] * 12, 100); // Max 100 points

        const [tempHistory, humiHistory, lightHistory] = useAdafruitProvider
          ? await Promise.all([
              adafruitFeedApi.getHistory('bbc-temp', limit),
              adafruitFeedApi.getHistory('bbc-humi', limit),
              adafruitFeedApi.getHistory('bbc-lux', limit),
            ])
          : await Promise.all([
              feedApi.getHistory({ feed: 'bbc-temp', limit }),
              feedApi.getHistory({ feed: 'bbc-humi', limit }),
              feedApi.getHistory({ feed: 'bbc-lux', limit }),
            ]);

        const labels = tempHistory.map((item) => format(new Date(item.timestamp), 'HH:mm'));
        const tempData = tempHistory.map((item) => item.value);
        const humiData = humiHistory.map((item) => item.value);
        const lightData = lightHistory.map((item) => item.value);

        setChartData({ labels, tempData, humiData, lightData });
      } catch (error) {
        console.error('Error fetching chart data:', error);
        // Fallback to mock data on error
        const hoursMap = { '1h': 1, '6h': 6, '24h': 24, '7d': 168 };
        setChartData(generateMockData(hoursMap[timeRange]));
      } finally {
        setLoading(false);
      }
    };

    fetchHistoricalData();
  }, [timeRange]);

  // Mock data fallback
  const generateMockData = (hours: number) => {
    const now = new Date();
    const labels: string[] = [];
    const tempData: number[] = [];
    const humiData: number[] = [];
    const lightData: number[] = [];

    for (let i = hours; i >= 0; i--) {
      const time = subHours(now, i);
      labels.push(format(time, 'HH:mm'));
      tempData.push(22 + Math.random() * 6);
      humiData.push(50 + Math.random() * 20);
      lightData.push(300 + Math.random() * 400);
    }

    return { labels, tempData, humiData, lightData };
  };

  const { labels, tempData, humiData, lightData } = chartData;

  const temperatureChartData = {
    labels,
    datasets: [
      {
        label: 'Nhiệt độ (°C)',
        data: tempData,
        borderColor: '#2563eb',
        backgroundColor: 'rgba(37, 99, 235, 0.1)',
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const humidityChartData = {
    labels,
    datasets: [
      {
        label: 'Độ ẩm (%)',
        data: humiData,
        borderColor: '#059669',
        backgroundColor: 'rgba(5, 150, 105, 0.1)',
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const lightChartData = {
    labels,
    datasets: [
      {
        label: 'Ánh sáng (%)',
        data: lightData,
        borderColor: '#d97706',
        backgroundColor: 'rgba(217, 119, 6, 0.1)',
        fill: true,
        tension: 0.4,
      },
    ],
  };

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

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-white">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-900/90 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="p-2.5 rounded-lg border border-slate-200 text-slate-600 hover:text-slate-950 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800 transition-colors"
                aria-label="Quay lại bảng điều khiển"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>

              <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:border-indigo-900 dark:text-indigo-300">
                <BarChart3 className="w-6 h-6" />
              </div>

              <div>
                <p className="text-sm font-medium text-indigo-700 dark:text-indigo-300">Phân tích cảm biến</p>
                <h1 className="text-2xl font-bold tracking-tight text-slate-950 dark:text-white">
                  Biểu đồ dữ liệu
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Quan sát xu hướng nhiệt độ, độ ẩm và ánh sáng theo khoảng thời gian.
                </p>
              </div>
            </div>

            <div className="inline-flex w-full rounded-lg border border-slate-200 bg-slate-100 p-1 dark:border-slate-700 dark:bg-slate-800 lg:w-auto">
              {(['1h', '6h', '24h', '7d'] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`flex-1 rounded-md px-3 py-2 text-sm font-semibold transition-colors lg:flex-none ${
                    timeRange === range
                      ? 'bg-white text-indigo-700 shadow-sm dark:bg-slate-950 dark:text-indigo-300'
                      : 'text-slate-600 hover:text-slate-950 dark:text-slate-300 dark:hover:text-white'
                  }`}
                >
                  {range === '1h' && '1 giờ'}
                  {range === '6h' && '6 giờ'}
                  {range === '24h' && '24 giờ'}
                  {range === '7d' && '7 ngày'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Charts */}
        {loading && (
          <div className="mb-6 rounded-xl bg-white dark:bg-gray-800 shadow-lg p-4 text-sm text-gray-600 dark:text-gray-300">
            Đang tải dữ liệu biểu đồ...
          </div>
        )}

        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Nhiệt độ
            </h2>
            <div className="h-64">
              <Line data={temperatureChartData} options={chartOptions} />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Độ ẩm
            </h2>
            <div className="h-64">
              <Line data={humidityChartData} options={chartOptions} />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Ánh sáng
            </h2>
            <div className="h-64">
              <Line data={lightChartData} options={chartOptions} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

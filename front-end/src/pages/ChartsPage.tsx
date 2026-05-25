import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
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

const USE_ADAFRUIT = import.meta.env.VITE_AIO_USERNAME && import.meta.env.VITE_AIO_KEY;

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

        const [tempHistory, humiHistory, lightHistory] = USE_ADAFRUIT
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
        label: 'Ánh sáng (lux)',
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
              aria-label="Back to dashboard"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Biểu đồ dữ liệu
            </h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Time Range Selector */}
        <div className="mb-6 flex gap-2">
          {(['1h', '6h', '24h', '7d'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                timeRange === range
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              {range === '1h' && '1 giờ'}
              {range === '6h' && '6 giờ'}
              {range === '24h' && '24 giờ'}
              {range === '7d' && '7 ngày'}
            </button>
          ))}
        </div>

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

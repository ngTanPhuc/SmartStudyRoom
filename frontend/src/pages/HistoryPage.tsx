import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowDownUp, Download, ExternalLink, Fan, Filter, History as HistoryIcon, Lightbulb, Power } from 'lucide-react';
import { format } from 'date-fns';
import { HistoryLog } from '@/types';
import { historyApi } from '@/services/api';
import { PaginationControls } from '@/components/common/PaginationControls';

export const HistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<'all' | 'manual' | 'auto' | 'voice'>('all');
  const [deviceFilter, setDeviceFilter] = useState<'all' | 'fan' | 'light'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'success' | 'failed'>('all');
  const [dateSort, setDateSort] = useState<'newest' | 'oldest'>('newest');
  const [logs, setLogs] = useState<HistoryLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      try {
        setLogs(await historyApi.getLogs());
      } catch (error) {
        console.error('Failed to fetch history logs:', error);
        setLogs([]);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, []);

  const filteredLogs = logs
    .filter((log) => {
      if (filter !== 'all' && log.triggeredBy !== filter) return false;
      if (deviceFilter !== 'all' && log.deviceType !== deviceFilter) return false;
      if (statusFilter !== 'all' && log.status !== statusFilter) return false;
      return true;
    })
    .sort((a, b) => {
      const firstTime = new Date(a.timestamp).getTime();
      const secondTime = new Date(b.timestamp).getTime();
      return dateSort === 'newest' ? secondTime - firstTime : firstTime - secondTime;
    });
  const totalPages = Math.max(Math.ceil(filteredLogs.length / pageSize), 1);
  const currentPage = Math.min(page, totalPages);
  const pagedLogs = filteredLogs.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  useEffect(() => {
    setPage(1);
  }, [filter, deviceFilter, statusFilter, dateSort, pageSize]);

  const handleExport = () => {
    const csv = [
      ['Thời gian', 'Thiết bị', 'Hành động', 'Trạng thái', 'Nguồn', 'Chi tiết'].join(','),
      ...filteredLogs.map((log) =>
        [
          format(new Date(log.timestamp), 'dd/MM/yyyy HH:mm:ss'),
          log.device,
          log.action,
          log.status,
          log.triggeredBy,
          log.details || '',
        ].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `history-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  const handleOpenSource = (log: HistoryLog) => {
    if (log.triggeredBy === 'voice' && log.speechInputId) {
      navigate(`/speech-history?speechInputId=${encodeURIComponent(log.speechInputId)}`);
      return;
    }

    if (log.triggeredBy === 'auto' && log.autoRuleId) {
      navigate(`/auto-rules?autoRuleId=${encodeURIComponent(log.autoRuleId)}`);
    }
  };

  const canOpenSource = (log: HistoryLog) => {
    return (log.triggeredBy === 'voice' && !!log.speechInputId)
      || (log.triggeredBy === 'auto' && !!log.autoRuleId);
  };

  const renderDevice = (log: HistoryLog) => {
    const isFan = log.deviceType === 'fan';
    const Icon = isFan ? Fan : Lightbulb;
    const isOn = !log.action.startsWith('Tắt');

    return (
      <div className="flex items-center gap-3">
        <div
          className={`p-2 rounded-lg ${
            isOn
              ? 'bg-gradient-to-br from-yellow-400 to-orange-500 text-white'
              : 'bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
          }`}
        >
          <Icon className={`w-4 h-4 ${isFan && isOn ? 'animate-spin' : isOn ? 'animate-pulse' : ''}`} />
        </div>
        <span className="font-medium text-gray-900 dark:text-gray-100">{log.device}</span>
      </div>
    );
  };

  const renderAction = (log: HistoryLog) => {
    const isOff = log.action.startsWith('Tắt');
    const isSpeedChange = log.action.startsWith('Chỉnh');

    return (
      <span
        className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${
          isOff
            ? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200'
            : isSpeedChange
            ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-200'
            : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200'
        }`}
      >
        <Power className="w-3.5 h-3.5" />
        {log.action}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-white">
      {/* Header */}
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

              <div className="p-3 rounded-xl bg-blue-50 border border-blue-100 text-blue-700 dark:bg-blue-950/40 dark:border-blue-900 dark:text-blue-300">
                <HistoryIcon className="w-6 h-6" />
              </div>

              <div>
                <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Nhật ký hệ thống</p>
                <h1 className="text-2xl font-bold tracking-tight text-slate-950 dark:text-white">
                  Lịch sử hoạt động
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Theo dõi các lệnh điều khiển thủ công, tự động và giọng nói.
                </p>
              </div>
            </div>

            <button
              onClick={handleExport}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-slate-900 text-white font-medium hover:bg-slate-800 disabled:opacity-50 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100 transition-colors"
            >
              <Download className="w-4 h-4" />
              Xuất CSV
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center gap-4 mb-4">
            <Filter className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Bộ lọc</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nguồn kích hoạt
              </label>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="all">Tất cả</option>
                <option value="manual">Thủ công</option>
                <option value="auto">Tự động</option>
                <option value="voice">Giọng nói</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Thiết bị
              </label>
              <select
                value={deviceFilter}
                onChange={(e) => setDeviceFilter(e.target.value as typeof deviceFilter)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="all">Tất cả</option>
                <option value="light">Đèn</option>
                <option value="fan">Quạt</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Trạng thái
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="all">Tất cả</option>
                <option value="success">Thành công</option>
                <option value="failed">Thất bại</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Sắp xếp thời gian
              </label>
              <div className="relative">
                <ArrowDownUp className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <select
                  value={dateSort}
                  onChange={(e) => setDateSort(e.target.value as typeof dateSort)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="newest">Mới nhất trước</option>
                  <option value="oldest">Cũ nhất trước</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* History Table */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Thời gian
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Thiết bị
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Hành động
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Trạng thái
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Nguồn
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Liên kết
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {loading && (
                  <tr>
                    <td className="px-6 py-6 text-sm text-gray-500 dark:text-gray-400" colSpan={6}>
                      Đang tải lịch sử...
                    </td>
                  </tr>
                )}
                {!loading && filteredLogs.length === 0 && (
                  <tr>
                    <td className="px-6 py-6 text-sm text-gray-500 dark:text-gray-400" colSpan={6}>
                      Chưa có lịch sử điều khiển
                    </td>
                  </tr>
                )}
                {pagedLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      {format(new Date(log.timestamp), 'dd/MM/yyyy HH:mm:ss')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {renderDevice(log)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {renderAction(log)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          log.status === 'success'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                        }`}
                      >
                        {log.status === 'success' ? 'Thành công' : 'Thất bại'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          log.triggeredBy === 'manual'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                            : log.triggeredBy === 'auto'
                            ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
                            : 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
                        }`}
                      >
                        {log.triggeredBy === 'manual' && 'Thủ công'}
                        {log.triggeredBy === 'auto' && 'Tự động'}
                        {log.triggeredBy === 'voice' && 'Giọng nói'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      {canOpenSource(log) ? (
                        <button
                          type="button"
                          onClick={() => handleOpenSource(log)}
                          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-300 dark:hover:bg-blue-900/40 transition-colors"
                        >
                          <ExternalLink className="w-4 h-4" />
                          {log.triggeredBy === 'voice' ? 'Speech input' : 'Auto rule'}
                        </button>
                      ) : (
                        <span className="text-sm text-gray-400 dark:text-gray-500">Không có</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!loading && (
            <PaginationControls
              currentPage={currentPage}
              pageSize={pageSize}
              totalItems={filteredLogs.length}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
            />
          )}
        </div>
      </main>
    </div>
  );
};

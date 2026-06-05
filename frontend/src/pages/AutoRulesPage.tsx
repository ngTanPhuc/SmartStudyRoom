import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  CircleOff,
  Lightbulb,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  SlidersHorizontal,
  Trash2,
} from 'lucide-react';
import {
  AutoRulePayload,
  AutoRuleSummary,
  autoRuleApi,
  DeviceSummary,
  deviceApi,
  SensorSummary,
  sensorApi,
} from '@/services/api';
import type { AutoRuleOperator } from '@/services/api';
import {
  DEVICE_CONFIG,
  OPERATOR_LABELS,
  OPERATOR_OPTIONS,
  SENSOR_CONFIG,
  describeDeviceValue,
  emptyForm,
  fanIntensityToSpeed,
  fanSpeedToIntensity,
  formatNumber,
} from '@/features/auto-rules/model';
import { PaginationControls } from '@/components/common/PaginationControls';

export const AutoRulesPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const selectedAutoRuleId = searchParams.get('autoRuleId');
  const [rules, setRules] = useState<AutoRuleSummary[]>([]);
  const [sensors, setSensors] = useState<SensorSummary[]>([]);
  const [devices, setDevices] = useState<DeviceSummary[]>([]);
  const [form, setForm] = useState<AutoRulePayload>(emptyForm);
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const selectedSensor = useMemo(
    () => sensors.find((sensor) => sensor.id === form.sensorId),
    [sensors, form.sensorId]
  );

  const selectedDevice = useMemo(
    () => devices.find((device) => device.id === form.deviceId),
    [devices, form.deviceId]
  );

  const activeRuleCount = rules.filter((rule) => !rule.deletedAt && rule.active).length;
  const activeRuleTotal = rules.filter((rule) => !rule.deletedAt).length;
  const controlledDeviceCount = new Set(
    rules.filter((rule) => !rule.deletedAt).map((rule) => rule.deviceResponse.id)
  ).size;
  const totalPages = Math.max(Math.ceil(rules.length / pageSize), 1);
  const currentPage = Math.min(page, totalPages);
  const pagedRules = rules.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [sensorList, deviceList, ruleList] = await Promise.all([
        sensorApi.getSensors(),
        deviceApi.getDeviceSummaries(),
        autoRuleApi.getRules(),
      ]);
      let nextRules = ruleList;

      if (selectedAutoRuleId && !ruleList.some((rule) => rule.id === selectedAutoRuleId)) {
        try {
          const selectedRule = await autoRuleApi.getRule(selectedAutoRuleId);
          nextRules = [selectedRule, ...ruleList];
        } catch {
          nextRules = ruleList;
        }
      }

      setSensors(sensorList);
      setDevices(deviceList);
      setRules(nextRules);
      setForm((prev) => ({
        ...prev,
        sensorId: prev.sensorId || sensorList[0]?.id || '',
        deviceId: prev.deviceId || deviceList[0]?.id || '',
      }));
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Không thể tải danh sách luật tự động');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!selectedAutoRuleId) return;
    const selectedIndex = rules.findIndex((rule) => rule.id === selectedAutoRuleId);
    if (selectedIndex >= 0) {
      setPage(Math.floor(selectedIndex / pageSize) + 1);
    }
  }, [rules, selectedAutoRuleId, pageSize]);

  const resetForm = () => {
    setEditingRuleId(null);
    setForm({
      ...emptyForm,
      sensorId: sensors[0]?.id || '',
      deviceId: devices[0]?.id || '',
    });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const targetValue = selectedDevice?.deviceType === 'FAN' && form.targetValue > 0
        ? fanSpeedToIntensity(fanIntensityToSpeed(form.targetValue))
        : form.targetValue > 0 ? 100 : 0;

      if (editingRuleId) {
        await autoRuleApi.updateRule(editingRuleId, {
          operator: form.operator,
          thresh: Number(form.thresh),
          targetValue,
        });
      } else {
        await autoRuleApi.createRule({
          ...form,
          thresh: Number(form.thresh),
          targetValue,
        });
      }

      resetForm();
      await loadData();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Không thể lưu luật tự động');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (rule: AutoRuleSummary) => {
    setEditingRuleId(rule.id);
    setForm({
      sensorId: rule.sensorResponse.id,
      deviceId: rule.deviceResponse.id,
      operator: rule.operator,
      thresh: rule.thresh,
      targetValue: rule.targetValue,
    });
  };

  const handleToggle = async (rule: AutoRuleSummary) => {
    setError(null);

    try {
      await autoRuleApi.updateRule(rule.id, { active: !rule.active });
      await loadData();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Không thể cập nhật trạng thái luật');
    }
  };

  const handleDelete = async (ruleId: string) => {
    setError(null);

    try {
      await autoRuleApi.deleteRule(ruleId);
      await loadData();
      if (editingRuleId === ruleId) {
        resetForm();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Không thể xóa luật tự động');
    }
  };

  const setDeviceAction = (action: 'on' | 'off') => {
    if (!selectedDevice || action === 'off') {
      setForm((prev) => ({ ...prev, targetValue: 0 }));
      return;
    }

    setForm((prev) => ({
      ...prev,
      targetValue: selectedDevice.deviceType === 'FAN' ? fanSpeedToIntensity(fanIntensityToSpeed(prev.targetValue)) : 100,
    }));
  };

  const setFanSpeed = (speed: number) => {
    setForm((prev) => ({ ...prev, targetValue: fanSpeedToIntensity(speed) }));
  };

  const handleDeviceChange = (deviceId: string) => {
    const nextDevice = devices.find((device) => device.id === deviceId);

    setForm((prev) => ({
      ...prev,
      deviceId,
      targetValue: nextDevice?.deviceType === 'FAN'
        ? prev.targetValue > 0 ? fanSpeedToIntensity(fanIntensityToSpeed(prev.targetValue)) : 0
        : prev.targetValue > 0 ? 100 : 0,
    }));
  };

  const renderSensorIcon = (sensorType: SensorSummary['sensorType'], className = 'w-5 h-5') => {
    const Icon = SENSOR_CONFIG[sensorType].icon;
    return <Icon className={className} />;
  };

  const renderDeviceIcon = (deviceType: DeviceSummary['deviceType'], className = 'w-5 h-5') => {
    const Icon = DEVICE_CONFIG[deviceType].icon;
    return <Icon className={className} />;
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-white">
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

              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:border-emerald-900 dark:text-emerald-300">
                <SlidersHorizontal className="w-6 h-6" />
              </div>

              <div>
                <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Điều khiển tự động</p>
                <h1 className="text-2xl font-bold tracking-tight text-slate-950 dark:text-white">
                  Luật tự động cho phòng học
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Thiết lập điều kiện cảm biến để hệ thống tự điều khiển thiết bị mỗi 5 giây.
                </p>
              </div>
            </div>

            <button
              onClick={loadData}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-slate-900 text-white font-medium hover:bg-slate-800 disabled:opacity-50 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Làm mới dữ liệu
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <p className="text-sm text-slate-500 dark:text-slate-400">Tổng số luật</p>
            <div className="mt-2 flex items-end justify-between">
              <span className="text-3xl font-bold text-slate-950 dark:text-white">{activeRuleTotal}</span>
              <SlidersHorizontal className="w-6 h-6 text-slate-400" />
            </div>
          </div>

          <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-5 shadow-sm dark:border-emerald-900 dark:bg-emerald-950/30">
            <p className="text-sm text-emerald-700 dark:text-emerald-300">Đang bật</p>
            <div className="mt-2 flex items-end justify-between">
              <span className="text-3xl font-bold text-emerald-900 dark:text-emerald-100">{activeRuleCount}</span>
              <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-300" />
            </div>
          </div>

          <div className="rounded-xl border border-amber-100 bg-amber-50 p-5 shadow-sm dark:border-amber-900 dark:bg-amber-950/30">
            <p className="text-sm text-amber-700 dark:text-amber-300">Thiết bị được điều khiển</p>
            <div className="mt-2 flex items-end justify-between">
              <span className="text-3xl font-bold text-amber-900 dark:text-amber-100">{controlledDeviceCount}</span>
              <Lightbulb className="w-6 h-6 text-amber-600 dark:text-amber-300" />
            </div>
          </div>
        </section>

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-[420px_1fr] gap-6">
          <form
            onSubmit={handleSubmit}
            className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm h-fit dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="flex items-start justify-between gap-3 mb-6">
              <div>
                <h2 className="text-lg font-bold text-slate-950 dark:text-white">
                  {editingRuleId ? 'Cập nhật luật' : 'Tạo luật mới'}
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Chọn cảm biến, điều kiện và trạng thái thiết bị cần áp dụng.
                </p>
              </div>
              <div className="p-2 rounded-lg bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                <Plus className="w-5 h-5" />
              </div>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">
                  Cảm biến theo dõi
                </label>
                <select
                  value={form.sensorId}
                  onChange={(event) => setForm((prev) => ({ ...prev, sensorId: event.target.value }))}
                  disabled={!!editingRuleId}
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  required
                >
                  {sensors.map((sensor) => (
                    <option key={sensor.id} value={sensor.id}>
                      {SENSOR_CONFIG[sensor.sensorType].label}
                    </option>
                  ))}
                </select>
                {selectedSensor && (
                  <div className={`mt-3 flex items-center gap-3 rounded-lg border px-3 py-3 ${SENSOR_CONFIG[selectedSensor.sensorType].softTone}`}>
                    <div className={SENSOR_CONFIG[selectedSensor.sensorType].tone}>
                      {renderSensorIcon(selectedSensor.sensorType)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">
                        {SENSOR_CONFIG[selectedSensor.sensorType].label}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Giá trị hiện tại: {formatNumber(selectedSensor.currentValue)} {SENSOR_CONFIG[selectedSensor.sensorType].unit}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-[140px_1fr] gap-3">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">
                    Điều kiện
                  </label>
                  <select
                    value={form.operator}
                    onChange={(event) => setForm((prev) => ({ ...prev, operator: event.target.value as AutoRuleOperator }))}
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  >
                    {OPERATOR_OPTIONS.map((operator) => (
                      <option key={operator.value} value={operator.value}>
                        {operator.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">
                    Ngưỡng kích hoạt
                  </label>
                  <input
                    type="number"
                    value={form.thresh}
                    onChange={(event) => setForm((prev) => ({ ...prev, thresh: Number(event.target.value) }))}
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">
                  Thiết bị điều khiển
                </label>
                <select
                  value={form.deviceId}
                  onChange={(event) => handleDeviceChange(event.target.value)}
                  disabled={!!editingRuleId}
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  required
                >
                  {devices.map((device) => (
                    <option key={device.id} value={device.id}>
                      {DEVICE_CONFIG[device.deviceType].label}
                    </option>
                  ))}
                </select>
                {selectedDevice && (
                  <div className={`mt-3 flex items-center gap-3 rounded-lg border px-3 py-3 ${DEVICE_CONFIG[selectedDevice.deviceType].softTone}`}>
                    <div className={DEVICE_CONFIG[selectedDevice.deviceType].tone}>
                      {renderDeviceIcon(selectedDevice.deviceType)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">
                        {DEVICE_CONFIG[selectedDevice.deviceType].label}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Trạng thái hiện tại: {describeDeviceValue(selectedDevice.deviceType, selectedDevice.intensityLevel)}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">
                  Trạng thái cần đặt
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setDeviceAction('off')}
                    className={`px-4 py-2.5 rounded-lg border text-sm font-semibold transition-colors ${
                      form.targetValue <= 0
                        ? 'border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-950'
                        : 'border-slate-300 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800'
                    }`}
                  >
                    Tắt
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeviceAction('on')}
                    className={`px-4 py-2.5 rounded-lg border text-sm font-semibold transition-colors ${
                      form.targetValue > 0
                        ? 'border-emerald-600 bg-emerald-600 text-white'
                        : 'border-slate-300 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800'
                    }`}
                  >
                    Bật
                  </button>
                </div>

                {selectedDevice?.deviceType === 'FAN' && form.targetValue > 0 && (
                  <div className="mt-3">
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">
                      Tốc độ quạt
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {[1, 2, 3].map((speed) => (
                        <button
                          key={speed}
                          type="button"
                          onClick={() => setFanSpeed(speed)}
                          className={`px-4 py-2.5 rounded-lg border text-sm font-semibold transition-colors ${
                            fanIntensityToSpeed(form.targetValue) === speed
                              ? 'border-emerald-600 bg-emerald-600 text-white'
                              : 'border-slate-300 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800'
                          }`}
                        >
                          {speed}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                type="submit"
                disabled={saving || loading || sensors.length === 0 || devices.length === 0}
                className="flex-1 inline-flex justify-center items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-700 disabled:opacity-50 transition-colors"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Đang lưu...' : editingRuleId ? 'Cập nhật' : 'Tạo luật'}
              </button>
              {editingRuleId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2.5 rounded-lg border border-slate-300 text-slate-700 font-medium hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 transition-colors"
                >
                  Hủy
                </button>
              )}
            </div>
          </form>

          <section className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden dark:border-slate-800 dark:bg-slate-900">
            <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-950 dark:text-white">Danh sách luật tự động</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {selectedAutoRuleId
                      ? 'Luật được mở từ lịch sử hoạt động đang được làm nổi bật.'
                      : 'Hệ thống chỉ kích hoạt những luật đang bật.'}
                  </p>
                </div>
                <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  {activeRuleCount}/{activeRuleTotal} đang bật
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px]">
                <thead className="bg-slate-50 dark:bg-slate-950/60">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                      Điều kiện
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                      Hành động
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                      Trạng thái
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {loading && (
                    <tr>
                      <td colSpan={4} className="px-6 py-10 text-sm text-slate-500 dark:text-slate-400">
                        Đang tải danh sách luật...
                      </td>
                    </tr>
                  )}

                  {!loading && rules.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-12">
                        <div className="flex flex-col items-center text-center">
                          <CircleOff className="w-10 h-10 text-slate-300 dark:text-slate-600" />
                          <p className="mt-3 font-semibold text-slate-900 dark:text-white">Chưa có luật tự động</p>
                          <p className="text-sm text-slate-500 dark:text-slate-400">
                            Tạo luật đầu tiên để hệ thống tự điều khiển thiết bị.
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}

                  {!loading &&
                    pagedRules.map((rule) => {
                      const sensorConfig = SENSOR_CONFIG[rule.sensorResponse.sensorType];
                      const deviceConfig = DEVICE_CONFIG[rule.deviceResponse.deviceType];
                      const isDeleted = !!rule.deletedAt;

                      return (
                        <tr
                          key={rule.id}
                          className={`transition-colors ${
                            rule.id === selectedAutoRuleId
                              ? 'bg-emerald-50 dark:bg-emerald-950/30'
                              : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                          }`}
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-lg border ${sensorConfig.softTone} ${sensorConfig.tone}`}>
                                {renderSensorIcon(rule.sensorResponse.sensorType, 'w-5 h-5')}
                              </div>
                              <div>
                                <p className="font-semibold text-slate-950 dark:text-white whitespace-nowrap">
                                  {sensorConfig.label} {OPERATOR_LABELS[rule.operator]} {formatNumber(rule.thresh)} {sensorConfig.unit}
                                </p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                  Hiện tại: {formatNumber(rule.sensorResponse.currentValue)} {sensorConfig.unit}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-lg border ${deviceConfig.softTone} ${deviceConfig.tone}`}>
                                {renderDeviceIcon(rule.deviceResponse.deviceType, 'w-5 h-5')}
                              </div>
                              <div>
                                <p className="font-semibold text-slate-950 dark:text-white">
                                  {deviceConfig.label}: {describeDeviceValue(rule.deviceResponse.deviceType, rule.targetValue)}
                                </p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                  Hiện tại: {describeDeviceValue(rule.deviceResponse.deviceType, rule.deviceResponse.intensityLevel)}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="px-6 py-4">
                            {isDeleted ? (
                              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300">
                                <span className="w-2 h-2 rounded-full bg-red-500" />
                                Đã xóa
                              </span>
                            ) : (
                              <button
                                onClick={() => handleToggle(rule)}
                                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold transition-colors ${
                                  rule.active
                                    ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-200 dark:hover:bg-emerald-900'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                                }`}
                              >
                                <span className={`w-2 h-2 rounded-full ${rule.active ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                                {rule.active ? 'Đang bật' : 'Đang tắt'}
                              </button>
                            )}
                          </td>

                          <td className="px-6 py-4">
                            <div className="flex justify-center gap-2">
                              {isDeleted ? (
                                <span className="px-3 py-2 rounded-lg text-sm font-semibold text-slate-500 bg-slate-100 dark:bg-slate-800 dark:text-slate-400">
                                  Lưu trong lịch sử
                                </span>
                              ) : (
                                <>
                                  <button
                                    onClick={() => handleEdit(rule)}
                                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 transition-colors"
                                  >
                                    <Pencil className="w-4 h-4" />
                                    Sửa
                                  </button>
                                  <button
                                    onClick={() => handleDelete(rule.id)}
                                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold text-red-700 bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:text-red-300 dark:hover:bg-red-950/70 transition-colors"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                    Xóa
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
            {!loading && (
              <PaginationControls
                currentPage={currentPage}
                pageSize={pageSize}
                totalItems={rules.length}
                onPageChange={setPage}
                onPageSizeChange={(nextPageSize) => {
                  setPageSize(nextPageSize);
                  setPage(1);
                }}
              />
            )}
          </section>
        </div>

        <section className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
              <SlidersHorizontal className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-950 dark:text-white">Luật tránh đụng độ</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Khi nhiều luật cùng kích hoạt và cùng điều khiển một thiết bị, hệ thống chỉ gửi một lệnh để tránh trạng thái bị ghi đè liên tục.
              </p>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60">
              <p className="text-sm font-semibold text-slate-900 dark:text-white">1. Gom theo thiết bị</p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Các luật đang chờ kích hoạt được nhóm theo đèn hoặc quạt trước khi gửi lệnh xuống gateway.
              </p>
            </div>

            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60">
              <p className="text-sm font-semibold text-slate-900 dark:text-white">2. Chọn một luật thắng</p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Ưu tiên dữ liệu mới nhất; nếu cùng thời điểm thì chiều tăng chọn ngưỡng cao hơn, chiều giảm chọn ngưỡng thấp hơn.
              </p>
            </div>

            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60">
              <p className="text-sm font-semibold text-slate-900 dark:text-white">3. Chỉ gửi một lệnh</p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Mỗi thiết bị chỉ nhận một lệnh trong một lượt quét; nếu vẫn hòa, hệ thống ưu tiên giá trị đặt cao hơn.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

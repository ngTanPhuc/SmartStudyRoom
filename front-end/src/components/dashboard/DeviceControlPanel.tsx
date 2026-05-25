import React, { useState } from 'react';
import { Lightbulb, Fan, Power, Zap } from 'lucide-react';
import { DeviceStatus, DeviceCommandPayload } from '@/types';

interface DeviceControlPanelProps {
  devices: DeviceStatus[];
  onCommand: (deviceId: string, command: DeviceCommandPayload) => Promise<void>;
}

export const DeviceControlPanel: React.FC<DeviceControlPanelProps> = ({ devices, onCommand }) => {
  const [loading, setLoading] = useState<string | null>(null);
  const [ackMessage, setAckMessage] = useState<string | null>(null);

  const handleToggle = async (device: DeviceStatus) => {
    setLoading(device.id);
    setAckMessage(null);

    try {
      const newStatus = device.status === 'on' ? 'off' : 'on';
      await onCommand(device.id, {
        command: newStatus === 'on' ? 'turn_on' : 'turn_off',
      });

      setAckMessage(`✓ ${device.name} đã ${newStatus === 'on' ? 'bật' : 'tắt'}`);
      setTimeout(() => setAckMessage(null), 3000);
    } catch (error) {
      setAckMessage(`✗ Lỗi khi điều khiển ${device.name}`);
    } finally {
      setLoading(null);
    }
  };

  const handleFanSpeed = async (device: DeviceStatus, speed: number) => {
    setLoading(device.id);
    setAckMessage(null);

    try {
      await onCommand(device.id, {
        command: 'fan_speed',
        value: speed,
      });

      setAckMessage(`✓ Đã đặt tốc độ quạt: ${speed}`);
      setTimeout(() => setAckMessage(null), 3000);
    } catch (error) {
      setAckMessage(`✗ Lỗi khi điều khiển quạt`);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 backdrop-blur-sm border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg">
          <Zap className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Điều khiển thiết bị</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Quản lý đèn và quạt</p>
        </div>
      </div>

      {/* ACK Message */}
      {ackMessage && (
        <div
          className={`
            mb-4 p-3 rounded-xl text-sm font-medium
            animate-slide-up
            ${
              ackMessage.startsWith('✓')
                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
            }
          `}
        >
          {ackMessage}
        </div>
      )}

      {/* Devices */}
      <div className="space-y-4">
        {devices.map((device) => (
          <div
            key={device.id}
            className="
              p-5 rounded-xl
              bg-gradient-to-br from-gray-50 to-gray-100
              dark:from-gray-700/50 dark:to-gray-800/50
              border border-gray-200 dark:border-gray-600
              transition-all duration-300
              hover:shadow-lg hover:scale-[1.02]
            "
          >
            <div className="flex items-center justify-between">
              {/* Device info */}
              <div className="flex items-center gap-4">
                <div
                  className={`
                    p-3 rounded-xl transition-all duration-300
                    ${
                      device.status === 'on'
                        ? 'bg-gradient-to-br from-yellow-400 to-orange-500 shadow-glow-orange'
                        : 'bg-gray-300 dark:bg-gray-600'
                    }
                  `}
                >
                  {device.type === 'light' ? (
                    <Lightbulb
                      className={`w-6 h-6 ${
                        device.status === 'on' ? 'text-white animate-pulse' : 'text-gray-500'
                      }`}
                    />
                  ) : (
                    <Fan
                      className={`w-6 h-6 ${
                        device.status === 'on'
                          ? 'text-white animate-spin'
                          : 'text-gray-500'
                      }`}
                    />
                  )}
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white">{device.name}</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {device.status === 'on' ? 'Đang bật' : 'Đang tắt'}
                    {device.type === 'fan' && device.value !== undefined && device.status === 'on'
                      ? ` • Tốc độ ${device.value}`
                      : ''}
                  </p>
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-3">
                {device.type === 'light' && (
                  <button
                    onClick={() => handleToggle(device)}
                    disabled={loading === device.id}
                    className={`
                      relative w-16 h-8 rounded-full transition-all duration-300
                      ${
                        device.status === 'on'
                          ? 'bg-gradient-to-r from-green-400 to-green-600 shadow-glow-green'
                          : 'bg-gray-300 dark:bg-gray-600'
                      }
                      ${loading === device.id ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                      focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2
                    `}
                  >
                    <span
                      className={`
                        absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-md
                        transition-transform duration-300
                        ${device.status === 'on' ? 'translate-x-8' : 'translate-x-0'}
                      `}
                    >
                      {loading === device.id && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
                        </div>
                      )}
                    </span>
                  </button>
                )}

                {device.type === 'fan' && (
                  <div className="flex items-center gap-2">
                    {/* Off button */}
                    <button
                      onClick={() => handleFanSpeed(device, 0)}
                      disabled={loading === device.id}
                      className={`
                        p-2 rounded-lg transition-all duration-200
                        ${
                          device.value === 0 || device.status === 'off'
                            ? 'bg-gradient-to-br from-gray-400 to-gray-600 text-white shadow-lg'
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-600'
                        }
                        ${loading === device.id ? 'opacity-50 cursor-not-allowed' : ''}
                      `}
                    >
                      <Power className="w-4 h-4" />
                    </button>

                    {/* Speed buttons */}
                    {[1, 2, 3].map((speed) => (
                      <button
                        key={speed}
                        onClick={() => handleFanSpeed(device, speed)}
                        disabled={loading === device.id}
                        className={`
                          w-10 h-10 rounded-lg font-bold transition-all duration-200
                          ${
                            device.value === speed && device.status === 'on'
                              ? 'bg-gradient-to-br from-blue-500 to-blue-700 text-white shadow-glow-blue scale-110'
                              : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-600'
                          }
                          ${loading === device.id ? 'opacity-50 cursor-not-allowed' : ''}
                        `}
                      >
                        {speed}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

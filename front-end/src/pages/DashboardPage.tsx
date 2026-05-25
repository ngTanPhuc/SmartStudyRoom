import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Moon, Sun, LogOut, BarChart3, History, Sparkles } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useRealtimeFeed } from '@/hooks/useRealtimeFeed';
import { SensorCard } from '@/components/dashboard/SensorCard';
import { DeviceControlPanel } from '@/components/dashboard/DeviceControlPanel';
import { VoiceControlPanel } from '@/components/dashboard/VoiceControlPanel';
import { deviceApi, speechApi, SpeechControlResult } from '@/services/api';
import { adafruitDeviceApi } from '@/services/adafruitApi';
import { DeviceCommandPayload, DeviceStatus } from '@/types';
import { DEVICE_IDS } from '@/utils/constants';

// Sử dụng Adafruit IO nếu có config
const USE_ADAFRUIT = import.meta.env.VITE_AIO_USERNAME && import.meta.env.VITE_AIO_KEY;

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { data: sensorData, connectionStatus } = useRealtimeFeed();

  // Device states - fetch from Adafruit IO
  const [devices, setDevices] = useState<DeviceStatus[]>([
    {
      id: DEVICE_IDS.LIGHT_1,
      name: 'Đèn chính',
      type: 'light',
      status: 'off',
      lastUpdate: new Date().toISOString(),
    },
    {
      id: DEVICE_IDS.FAN,
      name: 'Quạt trần',
      type: 'fan',
      status: 'off',
      value: 0,
      lastUpdate: new Date().toISOString(),
    },
  ]);

  const fetchBackendDeviceStatus = async () => {
    try {
      const backendDevices = await deviceApi.getDevices();
      setDevices(backendDevices);
    } catch (error) {
      console.error('Failed to fetch backend device status:', error);
    }
  };

  // Fetch device status from backend or Adafruit IO
  const fetchDeviceStatus = async () => {
    if (!USE_ADAFRUIT) {
      await fetchBackendDeviceStatus();
      return;
    }

    try {
      const deviceStatus = await adafruitDeviceApi.getDeviceStatus();
      
      setDevices((prevDevices) =>
        prevDevices.map((device) => {
          if (device.id === DEVICE_IDS.LIGHT_1) {
            const lightValue = deviceStatus['device-light'];
            return {
              ...device,
              status: lightValue === 'ON' || lightValue === '1' ? 'on' : 'off',
              lastUpdate: new Date().toISOString(),
            };
          } else if (device.id === DEVICE_IDS.FAN) {
            const fanValue = deviceStatus['device-fan'];
            let status: 'on' | 'off' = 'off';
            let value = 0;

            if (fanValue === 'OFF' || fanValue === '0') {
              status = 'off';
              value = 0;
            } else if (fanValue === 'SPEED_1' || fanValue === '1') {
              status = 'on';
              value = 1;
            } else if (fanValue === 'SPEED_2' || fanValue === '2') {
              status = 'on';
              value = 2;
            } else if (fanValue === 'SPEED_3' || fanValue === '3') {
              status = 'on';
              value = 3;
            }

            return {
              ...device,
              status,
              value,
              lastUpdate: new Date().toISOString(),
            };
          }
          return device;
        })
      );
    } catch (error) {
      console.error('Failed to fetch device status:', error);
    }
  };

  // Poll device status every 3 seconds
  useEffect(() => {
    fetchDeviceStatus(); // Initial fetch
    const interval = setInterval(fetchDeviceStatus, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleDeviceCommand = async (deviceId: string, command: DeviceCommandPayload) => {
    try {
      // Sử dụng Adafruit IO nếu có config, nếu không dùng custom API
      if (USE_ADAFRUIT) {
        await adafruitDeviceApi.sendCommand(deviceId, command);
        // Fetch lại status ngay sau khi gửi lệnh
        setTimeout(fetchDeviceStatus, 500);
      } else {
        await deviceApi.sendCommand(deviceId, command);
        await fetchBackendDeviceStatus();
      }
    } catch (error) {
      console.error('Failed to send device command:', error);
      throw error;
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      // Force redirect
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout error:', error);
      // Force redirect anyway
      window.location.href = '/login';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 dark:from-gray-900 dark:via-blue-900/10 dark:to-purple-900/10">
      {/* Header */}
      <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md shadow-lg border-b border-gray-200/50 dark:border-gray-700/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Smart Classroom IoT
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Xin chào, <span className="font-semibold">{user?.fullName || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || user?.email}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Connection Status */}
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700/50">
                <div
                  className={`w-2 h-2 rounded-full ${
                    connectionStatus === 'connected'
                      ? 'bg-green-500 animate-pulse'
                      : connectionStatus === 'connecting'
                      ? 'bg-yellow-500 animate-pulse'
                      : 'bg-red-500'
                  }`}
                />
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  {connectionStatus === 'connected' && 'Đã kết nối'}
                  {connectionStatus === 'connecting' && 'Đang kết nối...'}
                  {connectionStatus === 'disconnected' && 'Mất kết nối'}
                  {connectionStatus === 'error' && 'Lỗi'}
                </span>
              </div>

              {/* Navigation Buttons */}
              <button
                onClick={() => navigate('/charts')}
                className="p-2 rounded-lg text-gray-600 hover:text-blue-600 hover:bg-blue-50 dark:text-gray-400 dark:hover:text-blue-400 dark:hover:bg-blue-900/20 transition-all duration-200"
                aria-label="Charts"
              >
                <BarChart3 className="w-5 h-5" />
              </button>

              <button
                onClick={() => navigate('/history')}
                className="p-2 rounded-lg text-gray-600 hover:text-purple-600 hover:bg-purple-50 dark:text-gray-400 dark:hover:text-purple-400 dark:hover:bg-purple-900/20 transition-all duration-200"
                aria-label="History"
              >
                <History className="w-5 h-5" />
              </button>

              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg text-gray-600 hover:text-orange-600 hover:bg-orange-50 dark:text-gray-400 dark:hover:text-orange-400 dark:hover:bg-orange-900/20 transition-all duration-200"
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>

              {/* Logout */}
              <button
                onClick={handleLogout}
                className="p-2 rounded-lg text-gray-600 hover:text-red-600 hover:bg-red-50 dark:text-gray-400 dark:hover:text-red-400 dark:hover:bg-red-900/20 transition-all duration-200"
                aria-label="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Sensor Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {sensorData ? (
            <>
              <SensorCard
                type="temperature"
                value={sensorData.temperature}
                timestamp={sensorData.timestamp}
                trend={[22, 23, 24, 25, 26, 27, 28, sensorData.temperature]}
                onClick={() => navigate('/sensors/temperature')}
              />
              <SensorCard
                type="humidity"
                value={sensorData.humidity}
                timestamp={sensorData.timestamp}
                trend={[55, 57, 59, 60, 61, 62, 63, sensorData.humidity]}
                onClick={() => navigate('/sensors/humidity')}
              />
              <SensorCard
                type="light"
                value={sensorData.light}
                timestamp={sensorData.timestamp}
                trend={[300, 350, 400, 420, 430, 440, 445, sensorData.light]}
                onClick={() => navigate('/sensors/light')}
              />
            </>
          ) : (
            <>
              {/* Loading Skeletons */}
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="rounded-2xl p-6 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 animate-pulse"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-gray-300 dark:bg-gray-600 rounded-xl"></div>
                    <div className="w-16 h-6 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                  </div>
                  <div className="w-20 h-4 bg-gray-300 dark:bg-gray-600 rounded mb-2"></div>
                  <div className="w-32 h-12 bg-gray-300 dark:bg-gray-600 rounded mb-4"></div>
                  <div className="flex gap-1 h-12 mb-3">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((j) => (
                      <div key={j} className="flex-1 bg-gray-300 dark:bg-gray-600 rounded-t"></div>
                    ))}
                  </div>
                  <div className="w-full h-3 bg-gray-300 dark:bg-gray-600 rounded"></div>
                </div>
              ))}
            </>
          )}
        </div>

        {/* Control Panels */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <DeviceControlPanel devices={devices} onCommand={handleDeviceCommand} />
          <VoiceControlPanel
            onCommandConfirmed={async (transcript): Promise<SpeechControlResult> => {
              const result = await speechApi.process(transcript);
              await fetchBackendDeviceStatus();
              return result;
            }}
          />
        </div>
      </main>
    </div>
  );
};

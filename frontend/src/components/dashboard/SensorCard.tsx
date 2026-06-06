import React from 'react';
import { Thermometer, Droplets, Sun } from 'lucide-react';
import { formatRelativeTime, isValueOptimal } from '@/utils/helpers';

interface SensorCardProps {
  type: 'temperature' | 'humidity' | 'light';
  value: number;
  timestamp: string;
  trend?: number[];
  onClick?: () => void;
}

const sensorConfig = {
  temperature: {
    icon: Thermometer,
    label: 'Nhiệt độ',
    unit: '°C',
    gradient: 'from-blue-500 via-blue-400 to-blue-300',
    glowColor: 'shadow-glow-blue',
    iconBg: 'bg-blue-500/20',
    iconColor: 'text-blue-100',
  },
  humidity: {
    icon: Droplets,
    label: 'Độ ẩm',
    unit: '%',
    gradient: 'from-green-500 via-green-400 to-green-300',
    glowColor: 'shadow-glow-green',
    iconBg: 'bg-green-500/20',
    iconColor: 'text-green-100',
  },
  light: {
    icon: Sun,
    label: 'Ánh sáng',
    unit: ' %',
    gradient: 'from-orange-500 via-orange-400 to-orange-300',
    glowColor: 'shadow-glow-orange',
    iconBg: 'bg-orange-500/20',
    iconColor: 'text-orange-100',
  },
};

export const SensorCard: React.FC<SensorCardProps> = ({ type, value, timestamp, trend, onClick }) => {
  const config = sensorConfig[type];
  const Icon = config.icon;
  const isOptimal = isValueOptimal(type, value);

  return (
    <div
      onClick={onClick}
      className={`
        relative overflow-hidden rounded-2xl p-6
        bg-gradient-to-br ${config.gradient}
        ${config.glowColor}
        transform transition-all duration-300
        hover:scale-105 hover:shadow-2xl
        animate-fade-in
        group
        ${onClick ? 'cursor-pointer focus:outline-none focus:ring-4 focus:ring-blue-300' : ''}
      `}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(event) => {
        if (!onClick) return;
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onClick();
        }
      }}
    >
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full -translate-y-16 translate-x-16"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white rounded-full translate-y-12 -translate-x-12"></div>
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className={`p-3 rounded-xl ${config.iconBg} backdrop-blur-sm`}>
            <Icon className={`w-6 h-6 ${config.iconColor}`} />
          </div>
          
          {/* Status badge */}
          <div
            className={`
              px-3 py-1 rounded-full text-xs font-medium
              backdrop-blur-sm
              ${
                isOptimal
                  ? 'bg-white/30 text-white'
                  : 'bg-red-500/30 text-white animate-pulse'
              }
            `}
          >
            {isOptimal ? '✓ Tốt' : '⚠ Cảnh báo'}
          </div>
        </div>

        {/* Label */}
        <div className="text-white/80 text-sm font-medium mb-2">{config.label}</div>

        {/* Value */}
        <div className="flex items-baseline gap-2 mb-4">
          <span className="text-5xl font-bold text-white drop-shadow-lg">
            {value.toFixed(1)}
          </span>
          <span className="text-2xl font-medium text-white/90">{config.unit}</span>
        </div>

        {/* Mini trend chart */}
        {trend && trend.length > 0 && (
          <div className="flex items-end gap-1 h-12 mb-3">
            {trend.map((val, idx) => (
              <div
                key={idx}
                className="flex-1 bg-white/30 rounded-t transition-all duration-300 hover:bg-white/50"
                style={{
                  height: `${(val / Math.max(...trend)) * 100}%`,
                  minHeight: '4px',
                }}
              />
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between text-white/70 text-xs">
          <span>Cập nhật {formatRelativeTime(timestamp)}</span>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            <span>Live</span>
          </div>
        </div>
      </div>

      {/* Shine effect on hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
      </div>
    </div>
  );
};

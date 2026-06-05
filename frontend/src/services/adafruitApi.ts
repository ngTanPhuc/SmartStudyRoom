/**
 * Adafruit IO API Service
 * 
 * Documentation: https://io.adafruit.com/api/docs/
 */

import axios, { AxiosInstance } from 'axios';
import { LatestFeedsResponse, HistoricalDataPoint, DeviceCommandResponse } from '@/types';

const AIO_USERNAME = import.meta.env.VITE_AIO_USERNAME;
const AIO_KEY = import.meta.env.VITE_AIO_KEY;
const BASE_URL = import.meta.env.VITE_ADAFRUIT_BASE_URL || 'https://io.adafruit.com/api/v2';

// Create Adafruit IO axios instance
const adafruitApi: AxiosInstance = axios.create({
  baseURL: `${BASE_URL}/${AIO_USERNAME}`,
  headers: {
    'X-AIO-Key': AIO_KEY,
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

/**
 * Feed API
 */
export const adafruitFeedApi = {
  /**
   * Get latest value from all feeds
   */
  getLatest: async (): Promise<LatestFeedsResponse> => {
    try {
      // Fetch all 3 feeds in parallel
      const [tempRes, humiRes, luxRes] = await Promise.all([
        adafruitApi.get('/feeds/bbc-temp/data/last'),
        adafruitApi.get('/feeds/bbc-humi/data/last'),
        adafruitApi.get('/feeds/bbc-lux/data/last'),
      ]);

      return {
        'bbc-temp': {
          value: parseFloat(tempRes.data.value),
          timestamp: tempRes.data.created_at,
        },
        'bbc-humi': {
          value: parseFloat(humiRes.data.value),
          timestamp: humiRes.data.created_at,
        },
        'bbc-lux': {
          value: parseFloat(luxRes.data.value),
          timestamp: luxRes.data.created_at,
        },
      };
    } catch (error) {
      console.error('Error fetching Adafruit IO feeds:', error);
      throw error;
    }
  },

  /**
   * Get historical data from a feed
   */
  getHistory: async (feedName: string, limit: number = 100): Promise<HistoricalDataPoint[]> => {
    try {
      const response = await adafruitApi.get(`/feeds/${feedName}/data`, {
        params: { limit },
      });

      return response.data.map((item: any) => ({
        timestamp: item.created_at,
        value: parseFloat(item.value),
      })).reverse(); // Reverse to get chronological order
    } catch (error) {
      console.error(`Error fetching history for ${feedName}:`, error);
      throw error;
    }
  },

  /**
   * Send data to a feed
   */
  sendData: async (feedName: string, value: number | string): Promise<void> => {
    try {
      await adafruitApi.post(`/feeds/${feedName}/data`, {
        value: value.toString(),
      });
    } catch (error) {
      console.error(`Error sending data to ${feedName}:`, error);
      throw error;
    }
  },
};

/**
 * Device Control API
 * Sử dụng feeds để điều khiển thiết bị
 */
export const adafruitDeviceApi = {
  /**
   * Get current device status from feeds
   */
  getDeviceStatus: async (): Promise<Record<string, string>> => {
    try {
      const [lightRes, fanRes] = await Promise.all([
        adafruitApi.get('/feeds/device-light/data/last').catch(() => ({ data: { value: '0' } })),
        adafruitApi.get('/feeds/device-fan/data/last').catch(() => ({ data: { value: '0' } })),
      ]);

      return {
        'device-light': lightRes.data.value,
        'device-fan': fanRes.data.value,
      };
    } catch (error) {
      console.error('Error fetching device status:', error);
      return {
        'device-light': '0',
        'device-fan': '0',
      };
    }
  },

  /**
   * Send command to device via feed
   */
  sendCommand: async (deviceId: string, command: any): Promise<DeviceCommandResponse> => {
    try {
      let feedName = '';
      let value: string | number = '';

      // Map device ID to feed name
      if (deviceId === 'light-1' || deviceId === 'light-2') {
        feedName = 'device-light';
        value = command.command === 'turn_on' ? '1' : '0';
      } else if (deviceId === 'fan-1') {
        feedName = 'device-fan';
        value = command.value !== undefined ? command.value.toString() : '0';
      }

      if (!feedName) {
        throw new Error('Unknown device ID');
      }

      // Send to Adafruit IO
      await adafruitFeedApi.sendData(feedName, value);

      return {
        status: 'ok',
        appliedAt: new Date().toISOString(),
        message: 'Command sent to Adafruit IO',
      };
    } catch (error) {
      console.error('Error sending device command:', error);
      return {
        status: 'error',
        message: 'Failed to send command',
      };
    }
  },
};

export default adafruitApi;

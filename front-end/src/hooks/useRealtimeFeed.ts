/**
 * Realtime Feed Hook
 * 
 * Responsibilities:
 * - Establish WebSocket connection for realtime data
 * - Fall back to REST polling if WebSocket unavailable
 * - Provide latest sensor readings with <1s latency
 * - Handle connection status and reconnection logic
 * 
 * Expected Data Format:
 * WebSocket events: { topic: "bbc-temp", value: 28.5, timestamp: "2026-03-02T15:30:00Z" }
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { WSFeedEvent, ConnectionStatus, SensorReading } from '@/types';
import { feedApi } from '@/services/api';
import { adafruitFeedApi } from '@/services/adafruitApi';
import { REFRESH_INTERVALS } from '@/utils/constants';

// Sử dụng Adafruit IO hoặc custom API
const USE_ADAFRUIT = import.meta.env.VITE_AIO_USERNAME && import.meta.env.VITE_AIO_KEY;

interface UseRealtimeFeedReturn {
  data: SensorReading | null;
  connectionStatus: ConnectionStatus;
  error: string | null;
  reconnect: () => void;
}

export const useRealtimeFeed = (): UseRealtimeFeedReturn => {
  const [data, setData] = useState<SensorReading | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('connecting');
  const [error, setError] = useState<string | null>(null);
  
  const wsRef = useRef<WebSocket | null>(null);
  const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /**
   * Fetch data via REST API (fallback method)
   */
  const fetchDataViaREST = useCallback(async () => {
    try {
      // Sử dụng Adafruit IO nếu có config, nếu không dùng custom API
      const latest = USE_ADAFRUIT 
        ? await adafruitFeedApi.getLatest()
        : await feedApi.getLatest();
      
      const reading: SensorReading = {
        temperature: Number(latest['bbc-temp']?.value) || 0,
        humidity: Number(latest['bbc-humi']?.value) || 0,
        light: Number(latest['bbc-lux']?.value) || 0,
        timestamp: latest['bbc-temp']?.timestamp || new Date().toISOString(),
      };
      
      setData(reading);
      setConnectionStatus('connected');
      setError(null);
    } catch (err) {
      console.error('Error fetching data via REST:', err);
      setError('Failed to fetch data');
      setConnectionStatus('error');
    }
  }, []);

  /**
   * Start REST polling
   */
  const startPolling = useCallback(() => {
    console.log('Starting REST polling fallback');
    setConnectionStatus('connected');
    
    // Initial fetch
    fetchDataViaREST();
    
    // Set up polling interval
    pollingIntervalRef.current = setInterval(
      fetchDataViaREST,
      REFRESH_INTERVALS.REALTIME
    );
  }, [fetchDataViaREST]);

  /**
   * Stop REST polling
   */
  const stopPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  }, []);

  /**
   * Connect to WebSocket
   * NOTE: WebSocket disabled when using Adafruit IO (no WS support)
   */
  const connectWebSocket = useCallback(() => {
    const wsUrl = import.meta.env.VITE_WS_URL;
    
    // Nếu dùng Adafruit IO hoặc không có WS_URL, chỉ dùng REST polling
    if (USE_ADAFRUIT || !wsUrl) {
      console.log('📡 Using REST polling (Adafruit IO mode)');
      startPolling();
      return;
    }
    
    // Nếu có WS_URL, thử kết nối WebSocket
    try {
      console.log(`🔌 Attempting WebSocket connection to ${wsUrl}`);
      setConnectionStatus('connecting');
      
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('✅ WebSocket connected');
        setConnectionStatus('connected');
        setError(null);
        stopPolling(); // Stop polling if WebSocket connects
      };

      ws.onmessage = (event) => {
        try {
          const wsEvent: WSFeedEvent = JSON.parse(event.data);
          
          setData((prev) => ({
            temperature: wsEvent.topic === 'bbc-temp' ? Number(wsEvent.value) : prev?.temperature || 0,
            humidity: wsEvent.topic === 'bbc-humi' ? Number(wsEvent.value) : prev?.humidity || 0,
            light: wsEvent.topic === 'bbc-lux' ? Number(wsEvent.value) : prev?.light || 0,
            timestamp: wsEvent.timestamp,
          }));
        } catch (err) {
          console.error('Error parsing WebSocket message:', err);
        }
      };

      ws.onerror = () => {
        // Không log error nữa, chỉ fallback sang REST
        console.log('⚠️  WebSocket unavailable, using REST polling');
        startPolling();
      };

      ws.onclose = () => {
        console.log('🔌 WebSocket closed, using REST polling');
        setConnectionStatus('connected'); // Vẫn connected vì có REST fallback
        startPolling();
      };
    } catch (err) {
      console.log('⚠️  WebSocket not available, using REST polling');
      startPolling(); // Fall back to REST polling
    }
  }, [startPolling, stopPolling]);

  /**
   * Disconnect WebSocket
   */
  const disconnectWebSocket = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    stopPolling();
  }, [stopPolling]);

  /**
   * Manual reconnect function
   */
  const reconnect = useCallback(() => {
    disconnectWebSocket();
    connectWebSocket();
  }, [connectWebSocket, disconnectWebSocket]);

  // Initialize connection on mount
  useEffect(() => {
    connectWebSocket();
    
    return () => {
      disconnectWebSocket();
    };
  }, [connectWebSocket, disconnectWebSocket]);

  return {
    data,
    connectionStatus,
    error,
    reconnect,
  };
};

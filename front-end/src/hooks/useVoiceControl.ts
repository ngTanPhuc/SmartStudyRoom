/**
 * Voice Control Hook
 * 
 * Responsibilities:
 * - Record audio from user's microphone
 * - Display transcript with confidence level
 * - Highlight recognized keywords
 * - Require user confirmation before sending command
 * - Handle STT states: idle/listening/processing/result/error
 * 
 * Note: STT processing happens on server/PC, not on Yolo:Bit
 * Frontend only captures audio and displays results
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { VoiceCommand, DeviceCommandPayload } from '@/types';
import { VOICE_KEYWORDS, ERROR_MESSAGES } from '@/utils/constants';
import { parseVoiceCommand } from '@/utils/helpers';

interface UseVoiceControlReturn {
  voiceCommand: VoiceCommand;
  isListening: boolean;
  startListening: () => void;
  stopListening: () => void;
  confirmCommand: () => Promise<void>;
  cancelCommand: () => void;
  isSupported: boolean;
}

export const useVoiceControl = (
  onCommandConfirmed?: (command: DeviceCommandPayload) => Promise<void>
): UseVoiceControlReturn => {
  const [voiceCommand, setVoiceCommand] = useState<VoiceCommand>({
    transcript: {
      text: '',
      confidence: 0,
      keywords: [],
      timestamp: '',
    },
    status: 'idle',
  });
  
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Check if browser supports Web Speech API
  const isSupported = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;

  /**
   * Parse transcript to extract command
   */
  const parseTranscriptToCommand = useCallback((text: string): DeviceCommandPayload | undefined => {
    const words = parseVoiceCommand(text);
    const keywords: string[] = [];
    
    let command: DeviceCommandPayload | undefined;
    
    // Check for turn on/off
    const hasTurnOn = words.some(w => (VOICE_KEYWORDS.TURN_ON as readonly string[]).includes(w));
    const hasTurnOff = words.some(w => (VOICE_KEYWORDS.TURN_OFF as readonly string[]).includes(w));
    
    // Check for device type
    const hasLight = words.some(w => (VOICE_KEYWORDS.LIGHT as readonly string[]).includes(w));
    const hasFan = words.some(w => (VOICE_KEYWORDS.FAN as readonly string[]).includes(w));
    
    // Extract speed level if mentioned
    const speedMatch = text.match(/(\d+)/);
    const speedLevel = speedMatch ? parseInt(speedMatch[1]) : undefined;
    
    // Build command
    if (hasTurnOn && hasLight) {
      keywords.push('bật', 'đèn');
      command = {
        command: 'turn_on',
        requestedBy: 'voice',
      };
    } else if (hasTurnOff && hasLight) {
      keywords.push('tắt', 'đèn');
      command = {
        command: 'turn_off',
        requestedBy: 'voice',
      };
    } else if (hasFan) {
      keywords.push('quạt');
      
      if (speedLevel !== undefined && speedLevel >= 0 && speedLevel <= 3) {
        keywords.push(`tốc độ ${speedLevel}`);
        command = {
          command: 'fan_speed',
          value: speedLevel,
          requestedBy: 'voice',
        };
      } else if (hasTurnOn) {
        keywords.push('bật');
        command = {
          command: 'turn_on',
          requestedBy: 'voice',
        };
      } else if (hasTurnOff) {
        keywords.push('tắt');
        command = {
          command: 'turn_off',
          requestedBy: 'voice',
        };
      }
    }
    
    // Update keywords in state
    setVoiceCommand(prev => ({
      ...prev,
      transcript: {
        ...prev.transcript,
        keywords,
      },
    }));
    
    return command;
  }, []);

  /**
   * Start listening for voice input
   */
  const startListening = useCallback(() => {
    if (!isSupported) {
      setVoiceCommand({
        transcript: {
          text: '',
          confidence: 0,
          keywords: [],
          timestamp: '',
        },
        status: 'error',
        error: ERROR_MESSAGES.VOICE_NOT_SUPPORTED,
      });
      return;
    }

    try {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.lang = 'vi-VN'; // Vietnamese language "vi-VN" or "en-US"
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        setVoiceCommand({
          transcript: {
            text: '',
            confidence: 0,
            keywords: [],
            timestamp: '',
          },
          status: 'listening',
        });
      };

      recognition.onresult = (event: any) => {
        const result = event.results[0][0];
        const transcript = result.transcript;
        const confidence = result.confidence;
        
        const timestamp = new Date().toISOString();
        
        setVoiceCommand({
          transcript: {
            text: transcript,
            confidence,
            keywords: [], // Will be filled by parseTranscriptToCommand
            timestamp,
          },
          status: 'processing',
        });
        
        // Parse command
        const parsedCommand = parseTranscriptToCommand(transcript);
        
        setVoiceCommand(prev => ({
          ...prev,
          parsedCommand,
          status: parsedCommand ? 'success' : 'error',
          error: parsedCommand ? undefined : 'Không nhận diện được lệnh. Vui lòng thử lại.',
        }));
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setVoiceCommand(prev => ({
          ...prev,
          status: 'error',
          error: `Lỗi nhận diện giọng nói: ${event.error}`,
        }));
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (error) {
      console.error('Error starting speech recognition:', error);
      setVoiceCommand(prev => ({
        ...prev,
        status: 'error',
        error: 'Không thể khởi động nhận diện giọng nói',
      }));
    }
  }, [isSupported, parseTranscriptToCommand]);

  /**
   * Stop listening
   */
  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  }, []);

  /**
   * Confirm and execute command
   */
  const confirmCommand = useCallback(async () => {
    if (!voiceCommand.parsedCommand) return;
    
    try {
      setVoiceCommand(prev => ({ ...prev, status: 'processing' }));
      
      if (onCommandConfirmed) {
        await onCommandConfirmed(voiceCommand.parsedCommand);
      }
      
      setVoiceCommand(prev => ({ ...prev, status: 'success' }));
      
      // Reset after 2 seconds
      setTimeout(() => {
        setVoiceCommand({
          transcript: {
            text: '',
            confidence: 0,
            keywords: [],
            timestamp: '',
          },
          status: 'idle',
        });
      }, 2000);
    } catch (error) {
      console.error('Error executing voice command:', error);
      setVoiceCommand(prev => ({
        ...prev,
        status: 'error',
        error: 'Không thể thực thi lệnh. Vui lòng thử lại.',
      }));
    }
  }, [voiceCommand.parsedCommand, onCommandConfirmed]);

  /**
   * Cancel command
   */
  const cancelCommand = useCallback(() => {
    setVoiceCommand({
      transcript: {
        text: '',
        confidence: 0,
        keywords: [],
        timestamp: '',
      },
      status: 'idle',
    });
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  return {
    voiceCommand,
    isListening,
    startListening,
    stopListening,
    confirmCommand,
    cancelCommand,
    isSupported,
  };
};

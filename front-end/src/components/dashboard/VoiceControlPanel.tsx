import React, { useState } from 'react';
import { History, Mic, MicOff, Volume2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useVoiceControl } from '@/hooks/useVoiceControl';
import { SpeechControlResult } from '@/services/api';
import { formatDisplayConfidencePercent } from '@/utils/helpers';

interface VoiceControlPanelProps {
  onCommandConfirmed: (transcript: string) => Promise<SpeechControlResult>;
}

export const VoiceControlPanel: React.FC<VoiceControlPanelProps> = ({ onCommandConfirmed }) => {
  const navigate = useNavigate();
  const { voiceCommand, isListening, startListening, stopListening } =
    useVoiceControl();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [prediction, setPrediction] = useState<SpeechControlResult | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const submittedTranscriptRef = React.useRef<string | null>(null);

  const transcript = voiceCommand.transcript.text;
  const confidence = voiceCommand.transcript.confidence;
  const keywords = voiceCommand.transcript.keywords;
  const error = voiceCommand.error;
  const displayPredictionLabel = prediction && prediction.confidence < 0.7
    ? 'UNKNOWN'
    : prediction?.predictLabel;

  const handleStartListening = () => {
    startListening();
    setPrediction(null);
    setSubmitError(null);
    submittedTranscriptRef.current = null;
  };

  const handleStopListening = () => {
    stopListening();
  };

  React.useEffect(() => {
    if (!transcript || voiceCommand.status === 'listening' || voiceCommand.status === 'idle') {
      return;
    }

    if (submittedTranscriptRef.current === transcript) {
      return;
    }

    const sendTranscript = async () => {
      submittedTranscriptRef.current = transcript;
      setIsSubmitting(true);
      setSubmitError(null);

      try {
        const result = await onCommandConfirmed(transcript);
        setPrediction(result);
      } catch (error: any) {
        setSubmitError(error.response?.data?.message || error.message || 'Không thể gửi lệnh giọng nói');
      } finally {
        setIsSubmitting(false);
      }
    };

    sendTranscript();
  }, [voiceCommand.status, transcript, onCommandConfirmed]);

  return (
    <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 backdrop-blur-sm border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl shadow-lg">
            <Volume2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Điều khiển giọng nói</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Nói lệnh để điều khiển</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => navigate('/speech-history')}
          className="p-2 rounded-lg text-gray-500 hover:text-purple-600 hover:bg-purple-50 dark:text-gray-400 dark:hover:text-purple-300 dark:hover:bg-purple-900/20 transition-colors"
          aria-label="Xem lịch sử giọng nói"
          title="Lịch sử giọng nói"
        >
          <History className="w-5 h-5" />
        </button>
      </div>

      {/* Microphone Button */}
      <div className="flex flex-col items-center mb-6">
        <button
          onClick={isListening ? handleStopListening : handleStartListening}
          className={`
            relative w-24 h-24 rounded-full
            transition-all duration-300
            focus:outline-none focus:ring-4 focus:ring-offset-2
            ${
              isListening
                ? 'bg-gradient-to-br from-red-500 to-pink-600 shadow-glow-red animate-pulse focus:ring-red-500'
                : 'bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg hover:shadow-glow-blue focus:ring-blue-500'
            }
          `}
        >
          {isListening ? (
            <MicOff className="w-10 h-10 text-white mx-auto" />
          ) : (
            <Mic className="w-10 h-10 text-white mx-auto" />
          )}

          {/* Pulse rings when listening */}
          {isListening && (
            <>
              <span className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-75"></span>
              <span className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-50 animation-delay-150"></span>
            </>
          )}
        </button>

        {/* Status text */}
        <p className="mt-4 text-sm font-medium text-gray-600 dark:text-gray-400">
          {isListening ? (
            <span className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <span className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></span>
              Đang lắng nghe...
            </span>
          ) : (
            'Nhấn để bắt đầu'
          )}
        </p>
      </div>

      {/* Transcript */}
      {transcript && (
        <div className="mb-4 p-4 rounded-xl bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-700 animate-slide-up">
          <div className="flex items-start gap-2 mb-2">
            <Mic className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-1 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Văn bản nhận dạng:</p>
              <p className="text-gray-900 dark:text-white">
                {transcript.split(' ').map((word, idx) => (
                  <span
                    key={idx}
                    className={
                      keywords.includes(word)
                        ? 'font-bold text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/50 px-1 rounded'
                        : ''
                    }
                  >
                    {word}{' '}
                  </span>
                ))}
              </p>
            </div>
          </div>

          {confidence !== undefined && (
            <div className="flex items-center gap-2 mt-3">
              <span className="text-xs text-gray-600 dark:text-gray-400">Độ tin cậy:</span>
              <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${
                    confidence > 0.7
                      ? 'bg-gradient-to-r from-green-500 to-green-600'
                      : confidence > 0.5
                      ? 'bg-gradient-to-r from-yellow-500 to-yellow-600'
                      : 'bg-gradient-to-r from-red-500 to-red-600'
                  }`}
                  style={{ width: `${confidence * 100}%` }}
                ></div>
              </div>
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                {formatDisplayConfidencePercent(confidence, transcript)}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Browser speech errors only */}
      {error && !transcript && (
        <div className="mb-4 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 animate-slide-up">
          <p className="text-sm text-red-700 dark:text-red-300">⚠️ {error}</p>
        </div>
      )}

      {isSubmitting && transcript && (
        <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 animate-slide-up">
          <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
            Đang gửi lệnh xuống backend...
          </p>
        </div>
      )}

      {submitError && (
        <div className="mb-4 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 animate-slide-up">
          <p className="text-sm text-red-700 dark:text-red-300">⚠️ {submitError}</p>
        </div>
      )}

      {prediction && (
        <div className="p-4 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-700 animate-slide-up">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Dự đoán từ AI service
          </p>
          <div className="space-y-1 text-sm text-gray-800 dark:text-gray-100">
            <p>
              Nhãn: <span className="font-bold">{displayPredictionLabel}</span>
            </p>
            <p>
              Độ tin cậy:{' '}
              <span className="font-bold">
                {formatDisplayConfidencePercent(prediction.confidence, prediction.rawtext)}
              </span>
            </p>
            {prediction.device && (
              <p>
                Thiết bị: <span className="font-bold">{prediction.device.deviceType}</span>
                {prediction.targetValue !== undefined && (
                  <>{' -> '}<span className="font-bold">{prediction.targetValue}</span></>
                )}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Quick commands hint */}
      <div className="mt-4 p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600">
        <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">💡 Gợi ý lệnh:</p>
        <div className="flex flex-wrap gap-2">
          {['Bật đèn', 'Tắt đèn', 'Bật quạt', 'Tắt quạt'].map((cmd) => (
            <span
              key={cmd}
              className="px-2 py-1 text-xs rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600"
            >
              "{cmd}"
            </span>
          ))}
        </div>
      </div>

    </div>
  );
};

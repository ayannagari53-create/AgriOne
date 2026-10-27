import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, 
  Mic, 
  MicOff, 
  Send, 
  Sparkles, 
  Volume2, 
  VolumeX, 
  X, 
  CheckCircle2, 
  Cpu, 
  Languages 
} from 'lucide-react';
import { SupportedLanguage } from '../translations';
import { useTranslation } from '../context/LanguageContext';

interface AiAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  language?: SupportedLanguage;
  currentFarm?: any;
  authUser?: any;
}

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  structuredData?: any;
  dataSource?: string;
  intent?: string;
}

export const AiAssistantModal: React.FC<AiAssistantModalProps> = ({
  isOpen,
  onClose,
  currentFarm,
  authUser,
}) => {
  const { language, t } = useTranslation();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputQuery, setInputQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speechActive, setSpeechActive] = useState(false);

  // Initialize or re-localize initial greeting based on language
  useEffect(() => {
    if (messages.length === 0) {
      const greetingMap: Record<SupportedLanguage, string> = {
        en: "Namaste! I am AgriOne AI, your digital agriculture advisor. I am connected directly to your farm's soil moisture telemetry, FAO-56 irrigation calculator, and APMC Mandi feeds. What farming question can I assist you with today?",
        hi: "नमस्ते! मैं एग्रीवन एआई (AgriOne AI) हूँ, आपका डिजिटल कृषि सलाहकार। मैं आपके खेत के मृदा नमी सेंसर, एफएओ-56 सिंचाई कैलकुलेटर और मंडी भावों से जुड़ा हुआ हूँ। आज मैं आपकी क्या सहायता कर सकता हूँ?",
        kn: "ನಮಸ್ಕಾರ! ನಾನು ಅಗ್ರಿವನ್ AI, ನಿಮ್ಮ ಡಿಜಿಟಲ್ ಕೃಷಿ ಸಲಹೆಗಾರ. ನಿಮ್ಮ ತೋಟದ ಮಣ್ಣಿನ ತೇವಾಂಶ, FAO-56 ನೀರಾವರಿ ಲೆಕ್ಕಾಚಾರ ಮತ್ತು ಮಾರುಕಟ್ಟೆ ದರಗಳೊಂದಿಗೆ ನಾನು ಸಂಪರ್ಕ ಹೊಂದಿದ್ದೇನೆ. ಇಂದು ನಿಮಗೆ ಯಾವ ಮಾಹಿತಿ ಬೇಕು?",
        te: "నమస్కారం! నేను అగ్రివన్ AI, మీ డిజిటల్ వ్యవసాయ సలహాదారుని. మీ పొలం నేల తేమ, FAO-56 సాగునీటి గణన మరియు మార్కెట్ ధరలతో నేను అనుసంధానించబడి ఉన్నాను. నేడు నేను మీకు ఎలా సహాయపడగలను?",
        ta: "வணக்கம்! நான் அக்ரிவன் AI, உங்கள் டிஜிட்டல் விவசாய ஆலோசகர். உங்கள் பண்ணையின் மண் ஈரப்பதம், பாசன கணக்கீடு மற்றும் சந்தை விலைகளுடன் நான் இணைக்கப்பட்டுள்ளேன். இன்று உங்களுக்கு என்ன உதவி வேண்டும்?",
        mr: "नमस्कार! मी अ‍ॅग्रीवन AI आहे, तुमचा डिजिटल शेती सल्लागार. मी तुमच्या शेतातील मातीची ओलावा, FAO-56 सिंचन कॅल्क्युलेटर आणि बाजारभावांशी थेट जोडलेला आहे. आज मी तुम्हाला कशी मदत करू शकेन?",
        ml: "നമസ്കാരം! ഞാൻ അഗ്രിവൺ AI, നിങ്ങളുടെ ഡിജിറ്റൽ കാർഷിക ഉപദേശകൻ. നിങ്ങളുടെ കൃഷിയിടത്തിലെ മണ്ണിന്റെ ഈർപ്പം, ജലസേചന കണക്കുകൂട്ടൽ, വിപണി നിരക്കുകൾ എന്നിവയുമായി ഞാൻ ബന്ധിപ്പിച്ചിരിക്കുന്നു. ഇന്ന് എനിക്ക് എങ്ങനെ സഹായിക്കാനാകും?",
      };
      setMessages([
        {
          id: 'm1',
          sender: 'assistant',
          text: greetingMap[language] || greetingMap.en,
          dataSource: t('app_name') + ' Core',
        },
      ]);
    }
  }, [language]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Speech Recognition Setup
  useEffect(() => {
    if (typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;

      // Map language code to BCP 47
      const langMap: Record<SupportedLanguage, string> = {
        en: 'en-IN',
        hi: 'hi-IN',
        kn: 'kn-IN',
        te: 'te-IN',
        ta: 'ta-IN',
        mr: 'mr-IN',
        ml: 'ml-IN',
      };
      rec.lang = langMap[language] || 'en-IN';

      rec.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputQuery(transcript);
        setIsListening(false);
        handleSend(transcript);
      };

      rec.onerror = () => {
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = rec;
    }
  }, [language]);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert(t('ai_speech_unsupported'));
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleSpeak = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      const bcp47Map: Record<SupportedLanguage, string> = {
        en: 'en-IN',
        hi: 'hi-IN',
        kn: 'kn-IN',
        te: 'te-IN',
        ta: 'ta-IN',
        mr: 'mr-IN',
        ml: 'ml-IN',
      };
      const targetLang = bcp47Map[language] || 'en-IN';
      utterance.lang = targetLang;
      try {
        const voices = window.speechSynthesis.getVoices();
        const matchedVoice = voices.find(v => v.lang === targetLang || v.lang.startsWith(targetLang.slice(0, 2)));
        if (matchedVoice) {
          utterance.voice = matchedVoice;
        }
      } catch (e) {
        // Voice lookup fallback
      }
      utterance.onend = () => setSpeechActive(false);
      utterance.onerror = () => setSpeechActive(false);
      setSpeechActive(true);
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleSend = async (queryToSend?: string) => {
    const query = queryToSend || inputQuery;
    if (!query.trim() || loading) return;

    const userMsg: Message = {
      id: `u_${Date.now()}`,
      sender: 'user',
      text: query,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setLoading(true);

    try {
      const res = await fetch('/api/ai/farmer-advisory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          language,
          farmContext: (currentFarm || authUser) ? {
            farmer_name: authUser?.name,
            farm_name: currentFarm?.name,
            location: currentFarm?.location_name,
            latitude: currentFarm?.latitude,
            longitude: currentFarm?.longitude,
            crop: currentFarm?.primary_crop,
            acres: currentFarm?.acreage,
            soil_type: currentFarm?.soil_type,
            irrigation_method: currentFarm?.irrigation_method,
            moisture: 48,
          } : undefined,
        }),
      });
      const data = await res.json();

      const replyText = data.gemini_explanation || data.farmer_summary || 'I evaluated your query using the agricultural rule engine.';

      const assistantMsg: Message = {
        id: `a_${Date.now()}`,
        sender: 'assistant',
        text: replyText,
        structuredData: data.structured_data,
        dataSource: data.data_source || data.ai_provider,
        intent: data.intent,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (e: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          sender: 'assistant',
          text: 'Encountered a connection delay. Please ensure the Python engine is running and try again.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const quickPrompts = [
    t('ai_query_irrigation'),
    t('ai_query_disease'),
    t('ai_query_crop'),
    t('ai_query_mandi'),
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
      <div className="w-full max-w-2xl h-[650px] rounded-3xl bg-[#07190e] border border-emerald-500/40 shadow-2xl flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-emerald-900/60 bg-[#06140b] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-green-700 p-0.5 shadow-md shadow-emerald-500/20">
              <div className="w-full h-full bg-[#07170E] rounded-[10px] flex items-center justify-center">
                <Bot className="w-5 h-5 text-emerald-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white text-base">{t('ai_modal_title')}</h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30">
                  GEMINI 3.8 FLASH + PYTHON RULES
                </span>
              </div>
              <p className="text-xs text-emerald-400/70 font-mono">
                {t('ai_modal_subtitle')}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              if ('speechSynthesis' in window) window.speechSynthesis.cancel();
              onClose();
            }}
            className="p-2 rounded-lg bg-emerald-950/60 text-emerald-400 hover:text-white border border-emerald-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {messages.map((m) => {
            const isUser = m.sender === 'user';
            return (
              <div key={m.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl p-4 space-y-2 text-xs sm:text-sm leading-relaxed ${
                  isUser
                    ? 'bg-emerald-500 text-black font-medium shadow-md shadow-emerald-500/10'
                    : 'bg-[#092214] border border-emerald-700/50 text-emerald-100 shadow-md'
                }`}>
                  <div className="whitespace-pre-line">{m.text}</div>

                  {!isUser && m.dataSource && (
                    <div className="pt-2 border-t border-emerald-900/60 flex items-center justify-between text-[10px] font-mono text-emerald-400">
                      <span>{t('info')}: {m.dataSource}</span>
                      <button
                        onClick={() => handleSpeak(m.text)}
                        className="hover:text-emerald-200 flex items-center gap-1 cursor-pointer"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                        <span>{t('ai_voice_active')}</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {loading && (
            <div className="flex justify-start">
              <div className="p-3.5 rounded-2xl bg-[#092214] border border-emerald-800/60 text-emerald-300 text-xs font-mono flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>{t('ai_thinking')}</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Prompts Bar */}
        <div className="px-4 py-2 bg-[#051109] border-t border-emerald-900/40 flex items-center gap-1.5 overflow-x-auto text-[11px] font-mono">
          <span className="text-emerald-500 shrink-0 font-semibold">{t('filter')}:</span>
          {quickPrompts.map((qp, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(qp)}
              className="shrink-0 px-2.5 py-1 rounded-md bg-[#092214] text-emerald-300/80 hover:text-emerald-200 border border-emerald-800/60 hover:border-emerald-500 transition-colors"
            >
              {qp}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-3 sm:p-4 bg-[#06140b] border-t border-emerald-900/60 flex items-center gap-2">
          {/* Voice Mic Button */}
          <button
            onClick={toggleListening}
            className={`p-3 rounded-xl border transition-all ${
              isListening
                ? 'bg-red-500 text-white animate-pulse border-red-400'
                : 'bg-emerald-950/80 text-emerald-400 border-emerald-800 hover:border-emerald-500'
            }`}
            title={isListening ? t('ai_listening') : t('nav_voice_ai')}
          >
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>

          <input
            type="text"
            placeholder={isListening ? t('ai_listening') : t('ai_input_placeholder')}
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            className="flex-1 bg-[#05120a] border border-emerald-800/80 rounded-xl px-4 py-3 text-xs sm:text-sm text-white placeholder-emerald-600/70 focus:border-emerald-400 outline-none"
          />

          <button
            onClick={() => handleSend()}
            disabled={loading || !inputQuery.trim()}
            className="p-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-black font-bold transition-all shadow-md active:scale-95"
            title={t('ai_btn_send')}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
};

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Play, Pause, RotateCcw, Plus, Minus, Trophy,
  Shield, Timer as TimerIcon, Volume2, Settings,
  AlertTriangle, Zap, Fullscreen, Minimize2, Info, Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from '../contexts/LanguageContext.js';

interface AlarmTone {
  id: 'default' | 'its_time_mate' | 'bugle' | 'end_of_fight';
  name: string;
  description: string;
}

const ALARM_TONES: AlarmTone[] = [
  { id: 'default', name: 'Beep Padrão', description: 'Beep contínuo clássico de tatame.' },
  { id: 'its_time_mate', name: 'Voz Japonesa / MATE!', description: 'Sensei japonês comando de combate "ITS TIME" & "MATE!" com gongo e Taiko (15s).' },
  { id: 'bugle', name: 'Alvorada Militar (Corneta)', description: 'Toque autêntico de corneta militar completo com harmônicos de sopro (15s).' },
  { id: 'end_of_fight', name: 'FIM DA LUTA!', description: 'Gongo triplo pesado e buzzer de alta pressão estendido (15s).' }
];

const FightTimer: React.FC = () => {
  const { t } = useTranslation();
  const [timeLeft, setTimeLeft] = useState(360); // 6:00 default
  const [isRunning, setIsRunning] = useState(false);
  const [isChampionshipMode, setIsChampionshipMode] = useState(false);
  const [restTime, setRestTime] = useState(60);
  const [currentRound, setCurrentRound] = useState(1);
  const [totalRounds, setTotalRounds] = useState(5);
  const [isResting, setIsResting] = useState(false);

  // Score states
  const [athlete1, setAthlete1] = useState({ points: 0, advantages: 0, penalties: 0 });
  const [athlete2, setAthlete2] = useState({ points: 0, advantages: 0, penalties: 0 });
  const [showInfo, setShowInfo] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Custom ringtone states
  const [selectedTone, setSelectedTone] = useState<'default' | 'its_time_mate' | 'bugle' | 'end_of_fight'>(() => {
    const saved = localStorage.getItem('timer_end_tone');
    return (saved as any) || 'default';
  });
  const [isRinging, setIsRinging] = useState(false);
  const [ringingTimeRemaining, setRingingTimeRemaining] = useState(15);
  const activeAlarmRef = useRef<any>(null);
  const testTimeoutRef = useRef<any>(null);
  const [testingTone, setTestingTone] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem('timer_end_tone', selectedTone);
  }, [selectedTone]);

  const playBeep = useCallback((freq: number = 440, duration: number = 200) => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      oscillator.type = 'square';
      oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime);
      gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + duration / 1000);

      oscillator.start();
      oscillator.stop(audioCtx.currentTime + duration / 1000);
    } catch (e) {
      console.error('AudioContext error', e);
    }
  }, []);

  const playAlarmTone = useCallback((toneId: string, durationSec: number = 15) => {
    if (activeAlarmRef.current) {
      activeAlarmRef.current.stop();
    }

    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      let isStopped = false;
      const oscillators: any[] = [];
      const gainNodes: any[] = [];
      const timeouts: any[] = [];
      let intervalId: any = null;

      const playNote = (freq: number, startDelay: number, noteDuration: number, type: 'sine' | 'square' | 'sawtooth' | 'triangle' = 'sine', volume = 0.1) => {
        if (isStopped) return;
        try {
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();

          osc.type = type;
          osc.frequency.setValueAtTime(freq, audioCtx.currentTime + startDelay);
          
          gain.gain.setValueAtTime(0, audioCtx.currentTime + startDelay);
          gain.gain.linearRampToValueAtTime(volume, audioCtx.currentTime + startDelay + 0.05);
          gain.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + startDelay + noteDuration);

          osc.connect(gain);
          gain.connect(audioCtx.destination);

          osc.start(audioCtx.currentTime + startDelay);
          osc.stop(audioCtx.currentTime + startDelay + noteDuration);

          oscillators.push(osc);
          gainNodes.push(gain);
        } catch (e) {
          console.error(e);
        }
      };

      const speakJapaneseVoice = (phrase: string, startDelaySec: number) => {
        if (isStopped) return;
        const tId = setTimeout(() => {
          if (isStopped) return;
          try {
            const synth = window.speechSynthesis;
            if (!synth) return;
            
            synth.cancel(); // Clears any ongoing speech
            const utterance = new SpeechSynthesisUtterance(phrase);
            
            const voices = synth.getVoices();
            let jpVoice = voices.find(v => v.lang.toLowerCase().includes('jp'));
            if (jpVoice) {
              utterance.voice = jpVoice;
              utterance.rate = 0.72; // deep slow commanding flow
              utterance.pitch = 0.82;
            } else {
              const fallback = voices.find(v => v.lang.startsWith('en') || v.lang.startsWith('pt'));
              if (fallback) utterance.voice = fallback;
              utterance.rate = 0.75;
              utterance.pitch = 0.6; // heavy authoritative master pitch
            }
            
            synth.speak(utterance);
          } catch (err) {
            console.error('Speech synthesis error:', err);
          }
        }, startDelaySec * 1000);
        timeouts.push(tId);
      };

      // AUTHENTIC BUGLE BRASS SYNTH FOR "ALVORADA MILITAR"
      const playBugleNote = (freq: number, startDelay: number, noteDuration: number, volume = 0.22) => {
        if (isStopped) return;
        try {
          const oscTriangle = audioCtx.createOscillator();
          const oscSaw = audioCtx.createOscillator();
          const gainNode = audioCtx.createGain();
          const filterNode = audioCtx.createBiquadFilter();

          oscTriangle.type = 'triangle';
          oscTriangle.frequency.setValueAtTime(freq, audioCtx.currentTime + startDelay);
          
          oscSaw.type = 'sawtooth';
          oscSaw.frequency.setValueAtTime(freq, audioCtx.currentTime + startDelay);

          filterNode.type = 'lowpass';
          const filterTime = audioCtx.currentTime + startDelay;
          filterNode.frequency.setValueAtTime(300, filterTime);
          filterNode.frequency.exponentialRampToValueAtTime(freq * 3.5, filterTime + 0.08);
          filterNode.frequency.linearRampToValueAtTime(freq * 1.8, filterTime + noteDuration * 0.4);
          filterNode.frequency.exponentialRampToValueAtTime(300, filterTime + noteDuration);

          gainNode.gain.setValueAtTime(0, filterTime);
          gainNode.gain.linearRampToValueAtTime(volume, filterTime + 0.04);
          gainNode.gain.setValueAtTime(volume * 0.9, filterTime + noteDuration * 0.5);
          gainNode.gain.exponentialRampToValueAtTime(0.00001, filterTime + noteDuration);

          const lfo = audioCtx.createOscillator();
          const lfoGain = audioCtx.createGain();
          lfo.frequency.value = 6.2;
          lfoGain.gain.value = 3.5;
          lfo.connect(lfoGain);
          lfoGain.connect(oscTriangle.frequency);
          lfoGain.connect(oscSaw.frequency);

          const sawGain = audioCtx.createGain();
          sawGain.gain.value = 0.35;
          oscSaw.connect(sawGain);
          sawGain.connect(filterNode);
          
          oscTriangle.connect(filterNode);
          filterNode.connect(gainNode);
          gainNode.connect(audioCtx.destination);

          lfo.start(filterTime);
          oscTriangle.start(filterTime);
          oscSaw.start(filterTime);
          
          lfo.stop(filterTime + noteDuration);
          oscTriangle.stop(filterTime + noteDuration);
          oscSaw.stop(filterTime + noteDuration);

          oscillators.push(oscTriangle, oscSaw, lfo);
          gainNodes.push(gainNode);
        } catch (e) {
          console.error(e);
        }
      };

      // TAIKO DRUM FOR DEEP COMMANDING RYHTHM
      const playTaikoDrum = (delay: number, volume = 0.4) => {
        if (isStopped) return;
        try {
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          const filter = audioCtx.createBiquadFilter();
          
          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(220, audioCtx.currentTime + delay);
          
          osc.type = 'sine';
          osc.frequency.setValueAtTime(130, audioCtx.currentTime + delay);
          osc.frequency.exponentialRampToValueAtTime(42, audioCtx.currentTime + delay + 0.35);
          
          gain.gain.setValueAtTime(0, audioCtx.currentTime + delay);
          gain.gain.linearRampToValueAtTime(volume, audioCtx.currentTime + delay + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + delay + 0.75);
          
          osc.connect(filter);
          filter.connect(gain);
          gain.connect(audioCtx.destination);
          
          osc.start(audioCtx.currentTime + delay);
          osc.stop(audioCtx.currentTime + delay + 0.8);
          
          oscillators.push(osc);
          gainNodes.push(gain);
        } catch (e) {
          console.error(e);
        }
      };

      // DRAMATIC COPPER GONG IMPACT
      const playGong = (delay: number, volume = 0.28) => {
        if (isStopped) return;
        try {
          const osc1 = audioCtx.createOscillator();
          const osc2 = audioCtx.createOscillator();
          const osc3 = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          const filter = audioCtx.createBiquadFilter();

          osc1.type = 'sine';
          osc1.frequency.setValueAtTime(95, audioCtx.currentTime + delay);
          
          osc2.type = 'sawtooth';
          osc2.frequency.setValueAtTime(210, audioCtx.currentTime + delay);
          
          osc3.type = 'sine';
          osc3.frequency.setValueAtTime(380, audioCtx.currentTime + delay);

          filter.type = 'bandpass';
          filter.frequency.setValueAtTime(320, audioCtx.currentTime + delay);
          filter.Q.setValueAtTime(1.2, audioCtx.currentTime + delay);

          gain.gain.setValueAtTime(0, audioCtx.currentTime + delay);
          gain.gain.linearRampToValueAtTime(volume, audioCtx.currentTime + delay + 0.08);
          gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + delay + 2.8);

          osc1.connect(gain);
          osc2.connect(filter);
          filter.connect(gain);
          osc3.connect(gain);
          gain.connect(audioCtx.destination);

          osc1.start(audioCtx.currentTime + delay);
          osc2.start(audioCtx.currentTime + delay);
          osc3.start(audioCtx.currentTime + delay);

          osc1.stop(audioCtx.currentTime + delay + 3.0);
          osc2.stop(audioCtx.currentTime + delay + 3.0);
          osc3.stop(audioCtx.currentTime + delay + 3.0);

          oscillators.push(osc1, osc2, osc3);
          gainNodes.push(gain);
        } catch (e) {
          console.error(e);
        }
      };

      if (toneId === 'its_time_mate') {
        const playSeq = () => {
          // Play majestic oriental gong + repetitive heavy Japanese Taiko drum sequence to drive training/fight intensity
          playGong(0, 0.4);
          playTaikoDrum(0.1, 0.5);
          playTaikoDrum(0.5, 0.35);
          playTaikoDrum(1.0, 0.45);
          playTaikoDrum(1.4, 0.35);
          playTaikoDrum(2.0, 0.5);
          
          playTaikoDrum(3.0, 0.45);
          playTaikoDrum(3.4, 0.35);
          playTaikoDrum(4.0, 0.5);
          
          playTaikoDrum(6.0, 0.45);
          playTaikoDrum(6.4, 0.35);
          playTaikoDrum(7.0, 0.5);

          playTaikoDrum(9.0, 0.45);
          playTaikoDrum(9.4, 0.35);
          playTaikoDrum(10.0, 0.5);

          playTaikoDrum(12.0, 0.45);
          playTaikoDrum(12.4, 0.35);
          playTaikoDrum(13.0, 0.5);

          // Voice of Japanese martial arts master speaking commandingly
          speakJapaneseVoice("It's time! Mate! Mate!", 0.8);
          speakJapaneseVoice("Sore made! Hajime! Oss!", 5.2);
          speakJapaneseVoice("Mate! It's time! Oss!", 10.5);
        };
        playSeq();

      } else if (toneId === 'bugle') {
        const playAlvorada = () => {
          // Phrase 1 (0s - 4.2s)
          playBugleNote(392.00, 0.0, 0.18, 0.18); // G4
          playBugleNote(523.25, 0.2, 0.18, 0.18); // C5
          playBugleNote(659.25, 0.4, 0.18, 0.18); // E5
          playBugleNote(523.25, 0.6, 0.35, 0.18); // C5

          playBugleNote(392.00, 1.0, 0.18, 0.18); // G4
          playBugleNote(523.25, 1.2, 0.18, 0.18); // C5
          playBugleNote(659.25, 1.4, 0.18, 0.18); // E5
          playBugleNote(523.25, 1.6, 0.35, 0.18); // C5

          playBugleNote(392.00, 2.0, 0.15, 0.18); // G4
          playBugleNote(523.25, 2.2, 0.15, 0.18); // C5
          playBugleNote(659.25, 2.4, 0.15, 0.18); // E5
          playBugleNote(783.99, 2.6, 0.5, 0.20);  // G5
          playBugleNote(659.25, 3.2, 0.18, 0.18); // E5
          playBugleNote(523.25, 3.4, 0.18, 0.18); // C5
          playBugleNote(392.00, 3.6, 0.5, 0.18);  // G4

          // Phrase 2 (4.2s - 8.4s)
          playBugleNote(392.00, 4.2, 0.18, 0.18);
          playBugleNote(523.25, 4.4, 0.18, 0.18);
          playBugleNote(659.25, 4.6, 0.18, 0.18);
          playBugleNote(523.25, 4.8, 0.35, 0.18);

          playBugleNote(392.00, 5.2, 0.18, 0.18);
          playBugleNote(523.25, 5.4, 0.18, 0.18);
          playBugleNote(659.25, 5.6, 0.18, 0.18);
          playBugleNote(523.25, 5.8, 0.35, 0.18);

          playBugleNote(392.00, 6.2, 0.15, 0.18);
          playBugleNote(523.25, 6.4, 0.15, 0.18);
          playBugleNote(659.25, 6.6, 0.15, 0.18);
          playBugleNote(783.99, 6.8, 0.5, 0.20);
          playBugleNote(659.25, 7.4, 0.3, 0.18);
          playBugleNote(523.25, 7.8, 0.8, 0.20); // Resolve C5

          // Phrase 3 (High flourish 8.8s - 11.5s)
          playBugleNote(783.99, 8.8, 0.25, 0.18); // G5
          playBugleNote(783.99, 9.1, 0.25, 0.18); // G5
          playBugleNote(783.99, 9.4, 0.5, 0.19);  // G5
          playBugleNote(783.99, 10.0, 0.25, 0.18); // G5
          playBugleNote(659.25, 10.3, 0.25, 0.18); // E5
          playBugleNote(523.25, 10.6, 0.5, 0.19);  // C5

          // Phrase 4 (Resolution ending 11.2s - 15.0s)
          playBugleNote(392.00, 11.2, 0.18, 0.18); // G4
          playBugleNote(523.25, 11.4, 0.18, 0.18); // C5
          playBugleNote(659.25, 11.6, 0.18, 0.18); // E5
          playBugleNote(523.25, 11.8, 0.35, 0.18); // C5
          playBugleNote(659.25, 12.2, 0.3, 0.18);  // E5
          playBugleNote(783.99, 12.6, 0.5, 0.20);  // G5
          playBugleNote(659.25, 13.2, 0.3, 0.18);  // E5
          playBugleNote(523.25, 13.6, 1.2, 0.22);  // Final long resonant C5 note!
        };
        playAlvorada();

      } else if (toneId === 'end_of_fight') {
        const playSeq = () => {
          const doubleGong = (delay: number) => {
            playNote(140.00, delay, 0.5, 'sawtooth', 0.18); // Heavy buzz
            playNote(100.00, delay, 0.5, 'square', 0.12);   // Low rumble
            playNote(620.00, delay, 0.8, 'sine', 0.18);     // Gong ring
            playNote(930.00, delay, 0.8, 'sine', 0.08);     // High overtone
          };
          doubleGong(0);
          doubleGong(0.6);
          doubleGong(1.2);
          doubleGong(3.0);
          doubleGong(3.6);
          doubleGong(6.0);
          doubleGong(6.6);
          doubleGong(9.0);
          doubleGong(9.6);
          doubleGong(12.0);
          doubleGong(12.6);
        };
        playSeq();
      } else {
        const playSeq = () => {
          playNote(880.00, 0, 0.7, 'sine', 0.16);
          playNote(880.00, 1.0, 0.7, 'sine', 0.16);
          playNote(880.00, 2.0, 0.7, 'sine', 0.16);
          playNote(880.00, 3.0, 0.7, 'sine', 0.16);
          playNote(880.00, 4.0, 0.7, 'sine', 0.16);
          playNote(880.00, 5.0, 0.7, 'sine', 0.16);
          playNote(880.00, 6.0, 0.7, 'sine', 0.16);
          playNote(880.00, 7.0, 0.7, 'sine', 0.16);
          playNote(880.00, 8.0, 0.7, 'sine', 0.16);
          playNote(880.00, 9.0, 0.7, 'sine', 0.16);
          playNote(880.00, 10.0, 0.7, 'sine', 0.16);
          playNote(880.00, 11.0, 0.7, 'sine', 0.16);
          playNote(880.00, 12.0, 0.7, 'sine', 0.16);
          playNote(880.00, 13.0, 0.7, 'sine', 0.16);
          playNote(880.00, 14.0, 0.7, 'sine', 0.16);
        };
        playSeq();
      }

      const cleanup = () => {
        isStopped = true;
        if (intervalId) clearInterval(intervalId);
        timeouts.forEach(clearTimeout);
        try {
          if (window.speechSynthesis) {
            window.speechSynthesis.cancel();
          }
        } catch (e) {}
        oscillators.forEach(osc => {
          try { osc.stop(); } catch (e) {}
        });
      };

      const autoStopTimeout = setTimeout(() => {
        cleanup();
      }, durationSec * 1000);

      activeAlarmRef.current = {
        stop: () => {
          clearTimeout(autoStopTimeout);
          cleanup();
        }
      };

    } catch (e) {
      console.error('AudioContext alarm error', e);
    }
  }, []);

  const stopAlarm = useCallback(() => {
    setIsRinging(false);
    setRingingTimeRemaining(0);
    if (activeAlarmRef.current) {
      activeAlarmRef.current.stop();
      activeAlarmRef.current = null;
    }
    setTestingTone(null);
    if (testTimeoutRef.current) {
      clearTimeout(testTimeoutRef.current);
    }
    try {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    } catch (e) {}
  }, []);

  const testTone = (toneId: 'default' | 'its_time_mate' | 'bugle' | 'end_of_fight') => {
    if (testingTone === toneId) {
      stopAlarm();
      return;
    }
    stopAlarm();
    setTestingTone(toneId);
    playAlarmTone(toneId, 15); // Play full 15s preview!
    
    if (testTimeoutRef.current) {
      clearTimeout(testTimeoutRef.current);
    }
    testTimeoutRef.current = setTimeout(() => {
      setTestingTone(null);
    }, 15000);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(err => {
        alert(`Erro ao entrar em tela cheia: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  useEffect(() => {
    let interval: any;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            if (!isResting && currentRound < totalRounds) {
              playBeep(880, 1000);
              setIsResting(true);
              return restTime;
            } else if (isResting) {
              playBeep(1200, 1000);
              setIsResting(false);
              setCurrentRound(c => c + 1);
              return 360; 
            } else {
              // Final end of Fight! Trigger the 15s custom end ring
              setIsRunning(false);
              setIsRinging(true);
              setRingingTimeRemaining(15);
              playAlarmTone(selectedTone, 15);
              return 0;
            }
          }
          if (prev <= 11 && prev > 1) {
            playBeep(440, 100);
          }
          return prev - 1;
        });
      }, 1000);
    } else if (timeLeft === 0 && !isResting) {
      setIsRunning(false);
    }
    return () => clearInterval(interval);
  }, [isRunning, timeLeft, isResting, currentRound, totalRounds, restTime, selectedTone, playBeep, playAlarmTone]);

  useEffect(() => {
    let ringInterval: any;
    if (isRinging && ringingTimeRemaining > 0) {
      ringInterval = setInterval(() => {
        setRingingTimeRemaining(prev => {
          if (prev <= 1) {
            setIsRinging(false);
            if (activeAlarmRef.current) {
              activeAlarmRef.current.stop();
              activeAlarmRef.current = null;
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(ringInterval);
  }, [isRinging, ringingTimeRemaining]);

  useEffect(() => {
    return () => {
      if (activeAlarmRef.current) {
        activeAlarmRef.current.stop();
      }
    };
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(360);
    setAthlete1({ points: 0, advantages: 0, penalties: 0 });
    setAthlete2({ points: 0, advantages: 0, penalties: 0 });
    stopAlarm();
  };

  const updateScore = (athlete: 1 | 2, field: 'points' | 'advantages' | 'penalties', delta: number) => {
    const setter = athlete === 1 ? setAthlete1 : setAthlete2;
    setter(prev => ({
      ...prev,
      [field]: Math.max(0, prev[field] + delta)
    }));
  };

  const matchDurations = [
    { belt: 'Branca', time: '5:00' },
    { belt: 'Azul', time: '6:00' },
    { belt: 'Roxa', time: '7:00' },
    { belt: 'Marrom', time: '8:00' },
    { belt: 'Preta', time: '10:00' },
  ];

  return (
    <div className="space-y-8 pb-20 relative" ref={containerRef}>
      {/* Ringing Overlay Modal */}
      <AnimatePresence>
        {isRinging && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 bg-slate-950/95 flex flex-col items-center justify-center z-50 p-6 backdrop-blur-md"
          >
            <div className="absolute inset-0 bg-rose-500/10 animate-pulse" />
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ repeat: Infinity, duration: 1 }}
              className="relative bg-slate-900 border-4 border-rose-605 rounded-[3rem] p-12 max-w-lg w-full text-center shadow-2xl flex flex-col items-center"
            >
              <span className="text-[11px] font-black tracking-[0.4em] text-rose-500 uppercase mb-4">TEMPORIZADOR ENCERRADO</span>
              
              {selectedTone === 'its_time_mate' && (
                <h2 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter leading-none italic mb-2">
                  ITS TIME MATE!
                </h2>
              )}
              {selectedTone === 'bugle' && (
                <h2 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter leading-none italic mb-2 text-center leading-tight">
                  ALVORADA MILITAR!
                </h2>
              )}
              {selectedTone === 'end_of_fight' && (
                <h2 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter leading-none italic mb-2">
                  FIM DA LUTA!
                </h2>
              )}
              {selectedTone === 'default' && (
                <h2 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter leading-none italic mb-2">
                  TEMPO ESGOTADO!
                </h2>
              )}

              <p className="text-xs text-slate-400 font-medium uppercase mt-2 mb-8 tracking-widest">
                O toque personalizado tocará por <span className="text-rose-500 font-mono font-black">{ringingTimeRemaining}s</span>
              </p>

              <button
                onClick={stopAlarm}
                className="w-full py-4 bg-rose-600 hover:bg-rose-500 hover:scale-[1.02] text-white rounded-2xl font-black uppercase text-xs tracking-widest transition-all shadow-xl shadow-rose-600/30 flex items-center justify-center gap-2 cursor-pointer"
              >
                PARAR SOM / OSS!
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic leading-none">
            {t('timer.proTitle', 'CRONÔMETRO')} <span className="text-blue-600">PRO</span>
          </h1>
          <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-3 italic flex items-center gap-2">
            <Trophy size={12} className="text-blue-500" />
            {t('timer.proSubtitle', 'TEMPORIZADOR OFICIAL DE COMBATES E ROUNDS')}
          </p>
        </div>
        <div className="flex gap-4">
           <button 
             onClick={() => setShowInfo(!showInfo)}
             className="px-4 py-4 rounded-2xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-500 hover:text-blue-600 transition-all flex items-center justify-center cursor-pointer"
           >
              <Info size={20} />
           </button>
           <button 
             onClick={() => setIsChampionshipMode(!isChampionshipMode)}
             className={`px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all flex items-center gap-2 cursor-pointer ${isChampionshipMode ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/20' : 'bg-slate-100 dark:bg-white/5 text-slate-500 hover:text-white'}`}
           >
              <Zap size={14} /> {isChampionshipMode ? t('timer.activeComp', 'CAMPEONATO ATIVO') : t('timer.inactiveComp', 'TREINO COMUM')}
           </button>
        </div>
      </header>

      <AnimatePresence>
        {showInfo && (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="bg-slate-900 border border-white/10 p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden"
          >
             <div className="flex items-center gap-3 mb-6">
                <Clock size={20} className="text-blue-500" />
                <h3 className="text-[10px] font-black uppercase tracking-widest italic">{t('timer.rulesYear', 'REGRAS OFICIAIS IBJJF')} - Tempos de Luta Protegidos</h3>
             </div>
             <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {matchDurations.map((item, idx) => (
                  <div key={idx} className="p-4 bg-white/5 rounded-2xl border border-white/5 text-center">
                    <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">{item.belt}</p>
                    <p className="text-xl font-black">{item.time}</p>
                  </div>
                ))}
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Championship Scoreboard */}
        <AnimatePresence>
          {isChampionshipMode && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="lg:col-span-12 grid grid-cols-1 md:grid-cols-2 gap-8"
            >
              {/* Athlete 1 - Blue */}
              <div className="bg-blue-600 rounded-[3.5rem] p-10 text-white shadow-2xl relative overflow-hidden border-4 border-white/10">
                 <div className="absolute top-0 right-0 p-8 opacity-10">
                    <Shield size={120} />
                 </div>
                 <div className="relative z-10 flex flex-col items-center">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.4em] mb-6">{t('timer.blueAthlete', 'ATLETA AZUL')}</h3>
                    <div className="text-[120px] font-black leading-none tabular-nums italic mb-10 drop-shadow-2xl">
                      {athlete1.points}
                    </div>
                    <div className="flex gap-4 mb-10">
                       <button onClick={() => updateScore(1, 'points', 2)} className="w-14 h-14 bg-white/10 hover:bg-white/20 rounded-2xl flex items-center justify-center font-black transition-all cursor-pointer shadow-md">+2</button>
                       <button onClick={() => updateScore(1, 'points', 3)} className="w-14 h-14 bg-white/10 hover:bg-white/20 rounded-2xl flex items-center justify-center font-black transition-all cursor-pointer shadow-md">+3</button>
                       <button onClick={() => updateScore(1, 'points', 4)} className="w-14 h-14 bg-white/10 hover:bg-white/20 rounded-2xl flex items-center justify-center font-black transition-all cursor-pointer shadow-md">+4</button>
                       <button onClick={() => updateScore(1, 'points', -2)} className="w-14 h-14 bg-white/10 hover:bg-white/20 rounded-2xl flex items-center justify-center font-black transition-all cursor-pointer shadow-md"><Minus size={20} /></button>
                    </div>
                    <div className="grid grid-cols-2 gap-8 w-full border-t border-white/20 pt-10">
                       <div className="text-center">
                          <p className="text-[9px] font-black uppercase tracking-widest text-white/60 mb-2">{t('timer.advantages', 'VANTAGENS')}</p>
                          <div className="flex items-center justify-center gap-4">
                             <button onClick={() => updateScore(1, 'advantages', -1)} className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center cursor-pointer hover:bg-white/20"><Minus size={14} /></button>
                             <span className="text-4xl font-black italic tabular-nums text-amber-400">{athlete1.advantages}</span>
                             <button onClick={() => updateScore(1, 'advantages', 1)} className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center cursor-pointer hover:bg-white/20"><Plus size={14} /></button>
                          </div>
                       </div>
                       <div className="text-center">
                          <p className="text-[9px] font-black uppercase tracking-widest text-white/60 mb-2">{t('timer.penalties', 'PUNIÇÕES')}</p>
                          <div className="flex items-center justify-center gap-4">
                             <button onClick={() => updateScore(1, 'penalties', -1)} className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center cursor-pointer hover:bg-white/20"><Minus size={14} /></button>
                             <span className="text-4xl font-black italic tabular-nums text-rose-400">{athlete1.penalties}</span>
                             <button onClick={() => updateScore(1, 'penalties', 1)} className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center cursor-pointer hover:bg-white/20"><Plus size={14} /></button>
                          </div>
                       </div>
                    </div>
                 </div>
              </div>

              {/* Athlete 2 - White/Red */}
              <div className="bg-slate-950 rounded-[3.5rem] p-10 text-white shadow-2xl relative overflow-hidden border-4 border-white/10">
                 <div className="absolute top-0 right-0 p-8 opacity-10">
                    <Shield size={120} className="text-red-600" />
                 </div>
                 <div className="relative z-10 flex flex-col items-center">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.4em] mb-6">{t('timer.whiteAthlete', 'ATLETA BRANCO/VERMELHO')}</h3>
                    <div className="text-[120px] font-black leading-none tabular-nums italic mb-10 drop-shadow-2xl">
                      {athlete2.points}
                    </div>
                    <div className="flex gap-4 mb-10">
                       <button onClick={() => updateScore(2, 'points', 2)} className="w-14 h-14 bg-white/10 hover:bg-white/20 rounded-2xl flex items-center justify-center font-black transition-all cursor-pointer shadow-md">+2</button>
                       <button onClick={() => updateScore(2, 'points', 3)} className="w-14 h-14 bg-white/10 hover:bg-white/20 rounded-2xl flex items-center justify-center font-black transition-all cursor-pointer shadow-md">+3</button>
                       <button onClick={() => updateScore(2, 'points', 4)} className="w-14 h-14 bg-white/10 hover:bg-white/20 rounded-2xl flex items-center justify-center font-black transition-all cursor-pointer shadow-md">+4</button>
                       <button onClick={() => updateScore(2, 'points', -2)} className="w-14 h-14 bg-white/10 hover:bg-white/20 rounded-2xl flex items-center justify-center font-black transition-all cursor-pointer shadow-md"><Minus size={20} /></button>
                    </div>
                    <div className="grid grid-cols-2 gap-8 w-full border-t border-white/20 pt-10">
                       <div className="text-center">
                          <p className="text-[9px] font-black uppercase tracking-widest text-white/60 mb-2">{t('timer.advantages', 'VANTAGENS')}</p>
                          <div className="flex items-center justify-center gap-4">
                             <button onClick={() => updateScore(2, 'advantages', -1)} className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center cursor-pointer hover:bg-white/20"><Minus size={14} /></button>
                             <span className="text-4xl font-black italic tabular-nums text-amber-400">{athlete2.advantages}</span>
                             <button onClick={() => updateScore(2, 'advantages', 1)} className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center cursor-pointer hover:bg-white/20"><Plus size={14} /></button>
                          </div>
                       </div>
                       <div className="text-center">
                          <p className="text-[9px] font-black uppercase tracking-widest text-white/60 mb-2">{t('timer.penalties', 'PUNIÇÕES')}</p>
                          <div className="flex items-center justify-center gap-4">
                             <button onClick={() => updateScore(2, 'penalties', -1)} className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center cursor-pointer hover:bg-white/20"><Minus size={14} /></button>
                             <span className="text-4xl font-black italic tabular-nums text-rose-400">{athlete2.penalties}</span>
                             <button onClick={() => updateScore(2, 'penalties', 1)} className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center cursor-pointer hover:bg-white/20"><Plus size={14} /></button>
                          </div>
                       </div>
                    </div>
                 </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Timer Display */}
        <div className="lg:col-span-12 gap-8">
           <div className="bg-white dark:bg-slate-900 rounded-[4rem] p-12 md:p-20 border border-slate-200 dark:border-white/5 shadow-2xl relative overflow-hidden flex flex-col items-center">
              <div className="absolute top-0 left-0 w-full h-2 bg-slate-100 dark:bg-white/5 overflow-hidden">
                 <motion.div 
                   initial={{ width: '100%' }}
                   animate={{ width: `${(timeLeft / (isResting ? restTime : 360)) * 105}%` }}
                   className={`h-full transition-colors ${isResting ? 'bg-emerald-500' : timeLeft < 60 ? 'bg-rose-500' : 'bg-blue-600'}`}
                 />
              </div>

              <div className="flex items-center gap-4 mb-6">
                 {Array.from({ length: totalRounds }).map((_, i) => (
                   <div 
                     key={i} 
                     className={`w-3 h-3 rounded-full transition-all ${i + 1 < currentRound ? 'bg-blue-600' : i + 1 === currentRound ? 'bg-blue-600 shadow-[0_0_12px_rgba(59,130,246,0.6)] animate-pulse' : 'bg-slate-200 dark:bg-white/10'}`} 
                   />
                 ))}
              </div>

              <div className="text-center mb-4">
                 <p className={`text-[12px] font-black uppercase tracking-[0.3em] font-mono ${isResting ? 'text-emerald-500' : 'text-slate-400'}`}>
                    {isResting ? 'Intervalo de Descanso' : `Round ${currentRound} de ${totalRounds}`}
                 </p>
              </div>

              <div className={`text-[120px] md:text-[220px] font-black tabular-nums tracking-tighter italic leading-none transition-colors ${isResting ? 'text-emerald-500' : timeLeft < 60 && timeLeft > 0 ? 'text-rose-500' : isRunning ? 'text-blue-600' : 'text-slate-900 dark:text-white'}`}>
                 {formatTime(timeLeft)}
              </div>

               <div className="flex flex-wrap items-center justify-center gap-8 mt-12 w-full">
                  <button 
                    onClick={() => {
                        stopAlarm();
                        setIsRunning(!isRunning);
                    }}
                    className={`w-28 h-28 rounded-[2.5rem] flex items-center justify-center text-white transition-all active:scale-95 shadow-2xl cursor-pointer ${isRunning ? 'bg-slate-800 shadow-slate-900/40' : 'bg-emerald-600 shadow-emerald-700/40'}`}
                  >
                     {isRunning ? <Pause size={48} /> : <Play size={48} className="translate-x-1" />}
                  </button>

                  <div className="flex gap-4">
                    <button 
                       onClick={resetTimer}
                       className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-3xl flex items-center justify-center text-slate-500 hover:text-amber-500 transition-all active:scale-95 shadow-lg cursor-pointer"
                    >
                       <RotateCcw size={32} />
                    </button>

                    <button 
                       onClick={toggleFullscreen}
                       className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-3xl flex items-center justify-center text-slate-500 hover:text-blue-500 transition-all active:scale-95 shadow-lg cursor-pointer"
                    >
                       <Fullscreen size={32} />
                    </button>
                  </div>

                  <div className="flex flex-wrap justify-center gap-2">
                    {[1, 2, 4, 5, 6, 8, 10].map(m => (
                      <button 
                        key={m}
                        onClick={() => { stopAlarm(); setIsRunning(false); setTimeLeft(m * 60); }}
                        className={`px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all cursor-pointer ${timeLeft === m * 60 ? 'bg-slate-900 border-slate-900 text-white' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-white/10 text-slate-400 hover:text-slate-900'}`}
                      >
                         {m} MIN
                      </button>
                    ))}
                 </div>
              </div>

              {/* Dynamic Ringtone Selector settings */}
              <div className="w-full border-t border-slate-100 dark:border-white/5 pt-12 mt-12">
                 <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div className="text-left">
                       <h4 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight italic">
                          Toques Personalizados do Tatame
                       </h4>
                       <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest mt-1">
                          Selecione o sinal sonoro de 15s para o encerramento do temporizador.
                       </p>
                    </div>
                    <div className="flex gap-2">
                       {testingTone && (
                          <span className="px-3.5 py-1.5 bg-rose-500/10 text-rose-500 rounded-lg text-[9px] font-black uppercase tracking-wider animate-pulse flex items-center gap-1">
                             Testando {ALARM_TONES.find(t => t.id === testingTone)?.name}...
                          </span>
                       )}
                    </div>
                 </div>

                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-left">
                    {ALARM_TONES.map(tone => {
                       const isSelected = selectedTone === tone.id;
                       const isThisTesting = testingTone === tone.id;
                       return (
                          <div 
                             key={tone.id}
                             className={`p-5 rounded-3xl border transition-all relative flex flex-col justify-between ${isSelected ? 'bg-blue-600/5 dark:bg-blue-600/10 border-blue-600' : 'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/5 hover:border-slate-350'}`}
                          >
                             <div>
                                <div className="flex items-center justify-between gap-1 mb-2">
                                   <span className={`text-[10px] font-black uppercase tracking-tight ${isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-slate-800 dark:text-slate-200'}`}>
                                      {tone.name}
                                   </span>
                                   {isSelected && (
                                      <span className="text-[8px] font-black uppercase text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 px-1.5 py-0.5 rounded">
                                         Ativo
                                      </span>
                                   )}
                                </div>
                                <p className="text-[9.5px] text-slate-400 leading-tight mb-4">{tone.description}</p>
                             </div>

                             <div className="flex gap-2">
                                <button
                                   type="button"
                                   onClick={() => setSelectedTone(tone.id)}
                                   className={`flex-1 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer ${isSelected ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20 shadow-blue-500/10' : 'bg-white dark:bg-slate-800 text-slate-400 border border-slate-200 dark:border-white/5 hover:text-slate-700'}`}
                                >
                                   Selecionar
                                </button>
                                <button
                                   type="button"
                                   onClick={() => testTone(tone.id)}
                                   className={`px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer ${isThisTesting ? 'bg-rose-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-600'}`}
                                   title="Testar som por 3 segundos"
                                >
                                   Ouvir
                                </button>
                             </div>
                          </div>
                       );
                    })}
                 </div>
              </div>

              <div className="mt-12 flex items-center gap-6">
                 <div className="flex items-center gap-2 px-6 py-2 bg-slate-50 dark:bg-white/5 rounded-full border border-slate-100 dark:border-white/5">
                    <Volume2 size={16} className="text-slate-400" />
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest italic">{t('timer.audioActive', 'ÁUDIO DO TATAME ATIVO')}</span>
                 </div>
                 <div className="flex items-center gap-2 px-6 py-2 bg-slate-50 dark:bg-white/5 rounded-full border border-slate-100 dark:border-white/5">
                    <Settings size={16} className="text-slate-400" />
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest italic">{t('timer.rulesYear', 'CONFORMIDADE REGRAS 2026')}</span>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default FightTimer;


import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Play, 
  Pause, 
  SkipForward, 
  SkipBack, 
  Shuffle, 
  Repeat, 
  ListMusic,
  PlusCircle,
  Flame, 
  Wind,
  Search,
  Volume2,
  VolumeX,
  Music2,
  X,
  Save,
  Disc,
  Sword,
  Zap,
  Radio,
  Headphones,
  Youtube,
  Upload,
  Link as LinkIcon,
  FileAudio
} from 'lucide-react';
import { useTranslation } from '../contexts/LanguageContext';
import { Track } from '../types';

// Tipos estendidos para suportar YouTube e Arquivos Locais
interface EnhancedTrack extends Track {
  type?: 'library' | 'youtube' | 'local';
  youtubeId?: string;
}

const DEFAULT_LIBRARY: EnhancedTrack[] = [
  { id: 'bjj1', title: 'Grito de Guerra (BJJ Anthem)', artist: 'Oss Beats', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', duration: 372, category: 'jiujitsu', type: 'library' },
  { id: 'rock1', title: 'Rolling Thunder', artist: 'Heavy Grapplers', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3', duration: 315, category: 'rock', type: 'library' },
  { id: 'trap1', title: 'Guard Trap', artist: 'Submission Beats', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3', duration: 500, category: 'trap', type: 'library' },
  { id: 'inst1', title: 'Deep Focus Lo-Fi', artist: 'Sensei Chill', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3', duration: 480, category: 'instrumental', type: 'library' },
];

const MusicPlayer: React.FC = () => {
  const { t } = useTranslation();
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedPlaylist, setSelectedPlaylist] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);
  const [youtubeLink, setYoutubeLink] = useState('');
  
  const [tracks, setTracks] = useState<EnhancedTrack[]>(() => {
    try {
      const saved = localStorage.getItem('oss_mat_beats');
      return saved ? JSON.parse(saved) : DEFAULT_LIBRARY;
    } catch (e) {
      return DEFAULT_LIBRARY;
    }
  });

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    localStorage.setItem('oss_mat_beats', JSON.stringify(tracks.filter(t => t.type !== 'local')));
  }, [tracks]);

  const filteredTracks = useMemo(() => {
    return tracks.filter(track => {
      const matchesSearch = track.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            track.artist.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedPlaylist === 'all' || track.category === selectedPlaylist;
      return matchesSearch && matchesCategory;
    });
  }, [selectedPlaylist, searchTerm, tracks]);

  const currentTrack = filteredTracks[currentTrackIndex] || filteredTracks[0];

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  useEffect(() => {
    if (audioRef.current && currentTrack?.type !== 'youtube') {
      audioRef.current.src = currentTrack.url;
      if (isPlaying) {
        audioRef.current.play().catch(() => setIsPlaying(false));
      }
    }
  }, [currentTrack]);

  const togglePlay = () => {
    if (currentTrack?.type === 'youtube') return; // YouTube usa seu próprio controle (Iframe)
    if (!audioRef.current || !currentTrack) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(() => setIsPlaying(false));
    }
    setIsPlaying(!isPlaying);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    // Explicitly casting the file object to 'File' to resolve type errors in line 115-118
    const newTracks: EnhancedTrack[] = Array.from(files).map((file: File) => ({
      id: `local-${Date.now()}-${file.name}`,
      title: file.name.replace(/\.[^/.]+$/, ""),
      artist: 'Arquivo Local',
      url: URL.createObjectURL(file),
      duration: 0,
      category: 'local',
      type: 'local'
    }));

    setTracks(prev => [...newTracks, ...prev]);
    setCurrentTrackIndex(0);
    setIsPlaying(true);
  };

  const handleAddYoutube = () => {
    if (!youtubeLink.includes('youtube.com') && !youtubeLink.includes('youtu.be')) {
      alert('Por favor, insira um link válido do YouTube.');
      return;
    }

    let videoId = '';
    if (youtubeLink.includes('v=')) {
      videoId = youtubeLink.split('v=')[1].split('&')[0];
    } else {
      videoId = youtubeLink.split('/').pop() || '';
    }

    const newTrack: EnhancedTrack = {
      id: `yt-${videoId}`,
      title: `YouTube: ${videoId}`,
      artist: 'YouTube Video',
      url: youtubeLink,
      youtubeId: videoId,
      duration: 0,
      category: 'youtube',
      type: 'youtube'
    };

    setTracks(prev => [newTrack, ...prev]);
    setYoutubeLink('');
    setCurrentTrackIndex(0);
  };

  const handleTimeUpdate = () => {
    if (audioRef.current && !isNaN(audioRef.current.duration) && audioRef.current.duration > 0) {
      const p = (audioRef.current.currentTime / audioRef.current.duration) * 100;
      setProgress(p || 0);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (audioRef.current && !isNaN(audioRef.current.duration)) {
      const time = (parseFloat(e.target.value) / 100) * audioRef.current.duration;
      audioRef.current.currentTime = time;
      setProgress(parseFloat(e.target.value));
    }
  };

  const nextTrack = () => {
    if (filteredTracks.length <= 1) return;
    setCurrentTrackIndex((prev) => (prev + 1) % filteredTracks.length);
  };

  const prevTrack = () => {
    if (filteredTracks.length <= 1) return;
    setCurrentTrackIndex((prev) => (prev - 1 + filteredTracks.length) % filteredTracks.length);
  };

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const categories = [
    { id: 'all', name: t('common.all'), icon: <ListMusic size={18} /> },
    { id: 'jiujitsu', name: 'BJJ', icon: <Sword size={18} /> },
    { id: 'rock', name: 'Rock', icon: <Zap size={18} /> },
    { id: 'trap', name: 'Trap', icon: <Radio size={18} /> },
    { id: 'pop', name: 'Pop', icon: <Headphones size={18} /> },
    { id: 'local', name: 'Celular', icon: <FileAudio size={18} /> },
    { id: 'youtube', name: 'YouTube', icon: <Youtube size={18} /> },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in slide-in-from-bottom-4 duration-500 pb-12 w-full overflow-x-hidden">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black dark:text-white flex items-center gap-3 uppercase tracking-tighter">
            <Music2 className="text-blue-600" size={32} /> {t('music.playlists')}
          </h1>
          <p className="text-slate-500 font-medium italic mt-1">Sua biblioteca de treino personalizada</p>
        </div>
        <div className="flex flex-wrap gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Buscar na playlist..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-6 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-blue-600 dark:text-white font-bold"
            />
          </div>
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 bg-slate-900 dark:bg-slate-800 text-white px-5 py-3 rounded-2xl font-black shadow-xl transition-all active:scale-95 text-xs uppercase tracking-widest hover:bg-slate-700"
          >
            <Upload size={18} /> {t('common.am').length > 0 ? 'Músicas do Celular' : 'Local Files'}
          </button>
          <input type="file" ref={fileInputRef} className="hidden" accept="audio/*" multiple onChange={handleFileUpload} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
             <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Adicionar YouTube</h3>
             <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="Link do vídeo..." 
                  value={youtubeLink}
                  onChange={e => setYoutubeLink(e.target.value)}
                  className="flex-1 px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-1 focus:ring-blue-600 dark:text-white"
                />
                <button onClick={handleAddYoutube} className="p-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors">
                  <LinkIcon size={18} />
                </button>
             </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-1 gap-3">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => { setSelectedPlaylist(cat.id); setCurrentTrackIndex(0); }}
                className={`flex items-center gap-4 p-4 rounded-3xl transition-all duration-300 group ${
                  selectedPlaylist === cat.id 
                  ? 'bg-blue-600 text-white shadow-2xl shadow-blue-600/30' 
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-100 dark:border-slate-800 hover:border-blue-400'
                }`}
              >
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-transform group-hover:rotate-12 ${selectedPlaylist === cat.id ? 'bg-white/20' : 'bg-slate-100 dark:bg-slate-800'}`}>
                  {cat.icon}
                </div>
                <span className="font-bold text-sm truncate uppercase tracking-tight">{cat.name}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="lg:col-span-9 flex flex-col gap-8">
          <div className="bg-slate-900 rounded-[3rem] border border-white/5 shadow-2xl p-8 sm:p-12 flex flex-col items-center justify-center relative overflow-hidden text-white min-h-[450px]">
             <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600 rounded-full blur-[140px] opacity-10 -translate-y-1/2 translate-x-1/2" />
             
             <audio 
              ref={audioRef} 
              onTimeUpdate={handleTimeUpdate} 
              onEnded={nextTrack}
             />

             <div className="w-full flex flex-col items-center gap-8 relative z-10">
               {currentTrack?.type === 'youtube' ? (
                 <div className="w-full aspect-video max-w-2xl rounded-3xl overflow-hidden shadow-2xl border-4 border-white/5">
                   <iframe
                     width="100%"
                     height="100%"
                     src={`https://www.youtube.com/embed/${currentTrack.youtubeId}?autoplay=1`}
                     title="YouTube video player"
                     frameBorder="0"
                     allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                     allowFullScreen
                   ></iframe>
                 </div>
               ) : (
                 <div className="text-center space-y-4 mb-8">
                    <div className="w-32 h-32 bg-blue-600/20 rounded-[3rem] flex items-center justify-center mx-auto mb-6 shadow-inner border border-white/10">
                        <Music2 size={54} className={isPlaying ? 'animate-bounce text-blue-400' : 'text-slate-500'} />
                    </div>
                    <h2 className="text-3xl sm:text-5xl font-black tracking-tighter uppercase truncate max-w-lg mx-auto px-4">
                      {currentTrack?.title || 'Selecione uma faixa'}
                    </h2>
                    <p className="text-blue-400 font-black uppercase tracking-[0.2em] text-sm">
                      {currentTrack?.artist || 'Oss Beats'}
                    </p>
                 </div>
               )}

               <div className="w-full max-w-2xl space-y-8">
                  {currentTrack?.type !== 'youtube' && (
                    <div className="space-y-3">
                      <input 
                        type="range"
                        min="0"
                        max="100"
                        value={isNaN(progress) ? 0 : progress}
                        onChange={handleSeek}
                        className="w-full h-1.5 bg-slate-800 rounded-full appearance-none cursor-pointer accent-blue-500"
                      />
                      <div className="flex justify-between text-[10px] font-black text-slate-500 uppercase tracking-widest">
                        <span>{formatTime(audioRef.current?.currentTime || 0)}</span>
                        <span>{formatTime(audioRef.current?.duration || currentTrack?.duration || 0)}</span>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row items-center justify-between gap-8">
                     <div className="flex items-center gap-6">
                        <button className="text-slate-500 hover:text-blue-400 transition-all"><Shuffle size={20} /></button>
                        <button className="text-slate-500 hover:text-blue-400 transition-all"><Repeat size={20} /></button>
                     </div>

                     <div className="flex items-center gap-8 sm:gap-12">
                       <button onClick={prevTrack} className="text-slate-400 hover:text-white transition-all active:scale-90"><SkipBack size={36} fill="currentColor" /></button>
                       <button 
                          onClick={togglePlay}
                          className="w-20 h-20 rounded-[2.5rem] bg-blue-600 text-white flex items-center justify-center shadow-2xl hover:scale-110 active:scale-90 transition-all border-4 border-white/10"
                       >
                         {isPlaying ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" className="ml-1" />}
                       </button>
                       <button onClick={nextTrack} className="text-slate-400 hover:text-white transition-all active:scale-90"><SkipForward size={36} fill="currentColor" /></button>
                     </div>

                     <div className="flex items-center gap-3 w-32 group">
                        <button onClick={() => setIsMuted(!isMuted)} className="text-slate-500 group-hover:text-blue-400">
                          {isMuted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
                        </button>
                        <input 
                          type="range"
                          min="0"
                          max="1"
                          step="0.1"
                          value={isMuted ? 0 : (isNaN(volume) ? 0.7 : volume)}
                          onChange={(e) => { setVolume(parseFloat(e.target.value)); setIsMuted(false); }}
                          className="w-full h-1 bg-slate-800 rounded-full appearance-none cursor-pointer accent-blue-500"
                        />
                     </div>
                  </div>
               </div>
             </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
               <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Lista de Reprodução ({filteredTracks.length})</h3>
            </div>
            <div className="divide-y divide-slate-50 dark:divide-slate-800 max-h-[400px] overflow-y-auto scrollbar-hide">
              {filteredTracks.map((track, idx) => {
                const isCurrent = currentTrack?.id === track.id;
                return (
                  <button
                    key={track.id}
                    onClick={() => { setCurrentTrackIndex(idx); if(!isPlaying) togglePlay(); }}
                    className={`w-full p-6 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all group ${isCurrent ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                  >
                    <div className="flex items-center gap-5">
                       <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black ${isCurrent ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                          {isCurrent ? <Disc size={18} className="animate-spin-slow" /> : (idx + 1)}
                       </div>
                       <div className="text-left overflow-hidden">
                          <p className={`font-black text-sm uppercase tracking-tight truncate max-w-[200px] sm:max-w-md ${isCurrent ? 'text-blue-600' : 'text-slate-900 dark:text-white'}`}>{track.title}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{track.artist}</p>
                       </div>
                    </div>
                    <div className="flex items-center gap-6">
                       <div className="hidden sm:flex items-center gap-2">
                          {track.type === 'youtube' && <Youtube size={14} className="text-red-500" />}
                          {track.type === 'local' && <FileAudio size={14} className="text-green-500" />}
                          <span className="text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500">
                            {track.category}
                          </span>
                       </div>
                       <span className="text-xs font-black text-slate-400 w-10 text-right">{track.duration > 0 ? formatTime(track.duration) : '--:--'}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MusicPlayer;

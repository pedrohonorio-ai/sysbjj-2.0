import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, Medal, Target, Users, Search, Plus, X, 
  Video, Calendar, MapPin, Star, ThumbsUp, Activity, 
  TrendingUp, Award, Zap, ShieldCheck 
} from 'lucide-react';
import { useData } from '../contexts/DataContext.js';
import { useTranslation } from '../contexts/LanguageContext.js';
import { ResponsiveContainer, BarChart, Bar, Cell, XAxis, YAxis, Tooltip, Legend } from 'recharts';

interface Competition {
  id: string;
  name: string;
  athleteName: string;
  belt: string;
  result: 'Ouro' | 'Prata' | 'Bronze' | 'Participação';
  method: 'Finalização' | 'Pontos' | 'Vantagens' | 'Punição' | 'W.O.' | 'Decisão';
  weightClass: string;
  date: string;
  location: string;
  coachNotes: string;
  videoUrl?: string;
  views?: number;
}

const Competitions: React.FC = () => {
  const { students } = useData();
  const { t } = useTranslation();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterResult, setFilterResult] = useState<string>('all');
  const [isAdding, setIsAdding] = useState(false);

  // Default initial simulated high-end competitions database (signed by CT Pedro Honorio)
  const [competitions, setCompetitions] = useState<Competition[]>([
    {
      id: '1',
      name: 'Campeonato Brasileiro de Jiu-Jitsu CBJJ 2026',
      athleteName: 'Pedro Honorio',
      belt: 'Preta',
      result: 'Ouro',
      method: 'Finalização',
      weightClass: 'Meio-Pesado',
      date: '2026-05-15',
      location: 'São Paulo, SP',
      coachNotes: 'Excelente aplicação de raspagem de gancho seguida de estrangulamento Ezequiel pelas costas. Desempenho impecável.',
      videoUrl: 'https://youtube.example.com/v1',
      views: 124
    },
    {
      id: '2',
      name: 'Rio Winter Open IBJJF 2026',
      athleteName: 'Bruno Ribeiro',
      belt: 'Marrom',
      result: 'Prata',
      method: 'Pontos',
      weightClass: 'Pena',
      date: '2026-04-10',
      location: 'Rio de Janeiro, RJ',
      coachNotes: 'Vitória apertada na semi. Na final, faltou um pouco de controle tático por cima nos minutos finais de combate.',
      videoUrl: 'https://youtube.example.com/v2',
      views: 52
    },
    {
      id: '3',
      name: 'Absolute BJJ Pro Cup 2026',
      athleteName: 'Ana Souza',
      belt: 'Roxa',
      result: 'Bronze',
      method: 'Decisão',
      weightClass: 'Leve',
      date: '2026-03-24',
      location: 'Curitiba, PR',
      coachNotes: 'Excelente guarda borboleta ativa. Perdeu na decisão dividida dos juízes, mas lutou como mestre.',
      videoUrl: 'https://youtube.example.com/v3',
      views: 89
    },
    {
      id: '4',
      name: 'Campeonato Metropolitano FPJJ 2026',
      athleteName: 'Marcos Almeida',
      belt: 'Azul',
      result: 'Ouro',
      method: 'Finalização',
      weightClass: 'Pesadíssimo',
      date: '2026-05-02',
      location: 'São Bernardo, SP',
      coachNotes: 'Finalização rápida por chave de braço partindo do cem quilos. Atleta ouviu perfeitamente as orientações do corner.',
      views: 74
    }
  ]);

  const [newComp, setNewComp] = useState<Omit<Competition, 'id'>>({
    name: '',
    athleteName: '',
    belt: 'Azul',
    result: 'Ouro',
    method: 'Finalização',
    weightClass: 'Médio',
    date: new Date().toISOString().split('T')[0],
    location: '',
    coachNotes: '',
    videoUrl: ''
  });

  const filtered = useMemo(() => {
    return competitions.filter(c => {
      const matchSearch = c.athleteName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          c.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchResult = filterResult === 'all' || c.result === filterResult;
      return matchSearch && matchResult;
    });
  }, [competitions, searchTerm, filterResult]);

  // Medal stats counter
  const medalStats = useMemo(() => {
    let gold = 0, silver = 0, bronze = 0, participation = 0;
    competitions.forEach(c => {
      if (c.result === 'Ouro') gold++;
      else if (c.result === 'Prata') silver++;
      else if (c.result === 'Bronze') bronze++;
      else if (c.result === 'Participação') participation++;
    });
    return { gold, silver, bronze, participation };
  }, [competitions]);

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComp.name || !newComp.athleteName) return;
    const added: Competition = {
      ...newComp,
      id: Date.now().toString(),
      views: 0
    };
    setCompetitions([added, ...competitions]);
    setIsAdding(false);
    setNewComp({
      name: '',
      athleteName: '',
      belt: 'Azul',
      result: 'Ouro',
      method: 'Finalização',
      weightClass: 'Médio',
      date: new Date().toISOString().split('T')[0],
      location: '',
      coachNotes: '',
      videoUrl: ''
    });
  };

  return (
    <div className="space-y-8 pb-20 text-left">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic leading-none">
            Módulo <span className="text-blue-600">Competições</span>
          </h1>
          <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-4 italic flex items-center gap-2">
            <Trophy size={13} className="text-blue-500" />
            Performance Competitiva e Quadro de Medalistas do Dojo
          </p>
        </div>

        <button 
          onClick={() => setIsAdding(true)}
          className="cursor-pointer bg-blue-600 hover:bg-blue-500 text-white font-black text-[9px] uppercase tracking-widest px-5 py-3 rounded-2xl transition-all shadow-md flex items-center gap-2"
        >
          <Plus size={14} /> Registrar Desempenho
        </button>
      </header>

      {/* Stats Board */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-amber-550/10 border border-amber-500/20 rounded-3xl flex items-center gap-4 text-slate-900 dark:text-white bg-white dark:bg-slate-900">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 shrink-0">
            <Medal size={28} />
          </div>
          <div>
            <span className="text-[9px] font-black tracking-widest uppercase text-slate-400">Medalhas de Ouro</span>
            <h3 className="text-2xl font-black text-amber-500">{medalStats.gold}</h3>
          </div>
        </div>

        <div className="p-5 bg-slate-400/10 border border-slate-400/20 rounded-3xl flex items-center gap-4 text-slate-900 dark:text-white bg-white dark:bg-slate-900">
          <div className="w-12 h-12 rounded-2xl bg-slate-450/10 flex items-center justify-center text-slate-400 shrink-0">
            <Medal size={28} />
          </div>
          <div>
            <span className="text-[9px] font-black tracking-widest uppercase text-slate-400">Metal de Prata</span>
            <h3 className="text-2xl font-black text-slate-400">{medalStats.silver}</h3>
          </div>
        </div>

        <div className="p-5 bg-amber-800/10 border border-amber-800/20 rounded-3xl flex items-center gap-4 text-slate-900 dark:text-white bg-white dark:bg-slate-900">
          <div className="w-12 h-12 rounded-2xl bg-amber-700/10 flex items-center justify-center text-amber-700 shrink-0">
            <Medal size={28} />
          </div>
          <div>
            <span className="text-[9px] font-black tracking-widest uppercase text-slate-400">Combat de Bronze</span>
            <h3 className="text-2xl font-black text-amber-700">{medalStats.bronze}</h3>
          </div>
        </div>

        <div className="p-5 bg-blue-500/10 border border-blue-500/20 rounded-3xl flex items-center gap-4 text-slate-900 dark:text-white bg-white dark:bg-slate-900">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500 shrink-0">
            <Target size={28} />
          </div>
          <div>
            <span className="text-[9px] font-black tracking-widest uppercase text-slate-400">Participações</span>
            <h3 className="text-2xl font-black text-blue-500">{medalStats.participation}</h3>
          </div>
        </div>
      </div>

      {/* Filter and search bar */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-3xl">
        <div className="flex items-center gap-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 px-4 py-2.5 rounded-2xl w-full md:w-80">
          <Search size={14} className="text-slate-400" />
          <input 
            type="text" 
            placeholder="Buscar Atleta ou Evento..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="bg-transparent border-none outline-none text-[9px] font-black uppercase tracking-wider w-full text-slate-900 dark:text-white"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[8.5px] font-black uppercase tracking-wider text-slate-405">Filtrar Resultado:</span>
          <div className="flex gap-1 bg-slate-100 dark:bg-white/5 p-1 rounded-2xl">
            {['all', 'Ouro', 'Prata', 'Bronze'].map(res => (
              <button
                key={res}
                onClick={() => setFilterResult(res)}
                className={`text-[8px] font-black px-2.5 py-1.5 rounded-xl transition-all uppercase cursor-pointer ${
                  filterResult === res 
                    ? 'bg-blue-600 text-white shadow-sm' 
                    : 'text-slate-400 hover:text-slate-800'
                }`}
              >
                {res === 'all' ? 'Ver Todos' : res}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Adding dialog */}
      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 border border-slate-205 dark:border-white/5 rounded-3xl p-6 max-w-md w-full text-left space-y-4"
            >
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-white/5 pb-3">
                <h3 className="text-sm font-black uppercase text-slate-900 dark:text-white font-sans flex items-center gap-1.5">
                  <Trophy size={16} className="text-blue-600" />
                  Registrar Resultado de Luta
                </h3>
                <button onClick={() => setIsAdding(false)} className="text-slate-400 hover:text-red-500">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleAddSubmit} className="space-y-4 font-sans">
                <div>
                  <label className="text-[8px] font-black uppercase tracking-widest text-slate-400 block mb-1">Selecione o Atleta</label>
                  <select 
                    value={newComp.athleteName}
                    onChange={e => {
                      const selectedStudent = students.find(s => s.name === e.target.value);
                      setNewComp({ 
                        ...newComp, 
                        athleteName: e.target.value,
                        belt: selectedStudent?.belt || 'Azul'
                      });
                    }}
                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200/40 rounded-xl p-3 text-[10px] font-black uppercase tracking-wider text-slate-900 dark:text-white outline-none"
                    required
                  >
                    <option value="">-- Selecione o Atleta --</option>
                    {students.map(s => <option key={s.id} value={s.name}>{s.name.toUpperCase()} (Faixa {s.belt})</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-[8px] font-black uppercase tracking-widest text-slate-405 block mb-1">Título do Campeonato</label>
                  <input 
                    type="text" 
                    value={newComp.name}
                    onChange={e => setNewComp({ ...newComp, name: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200/40 rounded-xl p-3 text-[10px] text-slate-900 dark:text-white outline-none"
                    placeholder="Ex: Rio Open IBJJF 2026"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[8px] font-black uppercase tracking-widest text-slate-400 block mb-1">Resultado (Medalha)</label>
                    <select 
                      value={newComp.result}
                      onChange={e => setNewComp({ ...newComp, result: e.target.value as any })}
                      className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200/40 rounded-xl p-3 text-[10px] font-black uppercase text-slate-900 dark:text-white outline-none"
                    >
                      <option value="Ouro">Ouro</option>
                      <option value="Prata">Prata</option>
                      <option value="Bronze">Bronze</option>
                      <option value="Participação">Participação</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[8px] font-black uppercase tracking-widest text-slate-400 block mb-1">Método de Luta</label>
                    <select 
                      value={newComp.method}
                      onChange={e => setNewComp({ ...newComp, method: e.target.value as any })}
                      className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200/40 rounded-xl p-3 text-[10px] font-black uppercase text-slate-900 dark:text-white outline-none"
                    >
                      <option value="Finalização">Finalização</option>
                      <option value="Pontos">Pontos</option>
                      <option value="Vantagens">Vantagens</option>
                      <option value="Decisão">Decisão</option>
                      <option value="W.O.">W.O.</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[8px] font-black uppercase tracking-widest text-slate-405 block mb-1">Categoria de Peso</label>
                    <input 
                      type="text" 
                      value={newComp.weightClass}
                      onChange={e => setNewComp({ ...newComp, weightClass: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200/40 rounded-xl p-3 text-[10px] text-slate-900 dark:text-white outline-none"
                      placeholder="Ex: Leve"
                    />
                  </div>
                  <div>
                    <label className="text-[8px] font-black uppercase tracking-widest text-slate-405 block mb-1">Locação (Cidade/Estado)</label>
                    <input 
                      type="text" 
                      value={newComp.location}
                      onChange={e => setNewComp({ ...newComp, location: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200/40 rounded-xl p-3 text-[10px] text-slate-900 dark:text-white outline-none"
                      placeholder="Ex: Rio de Janeiro"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[8px] font-black uppercase tracking-widest text-slate-405 block mb-1">Comentários e Análises do Couch</label>
                  <textarea 
                    value={newComp.coachNotes}
                    onChange={e => setNewComp({ ...newComp, coachNotes: e.target.value })}
                    rows={3}
                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200/40 rounded-xl p-3 text-xs text-slate-600 dark:text-slate-300 outline-none"
                    placeholder="Descreva detalhes técnicos, pontos de carência ou elogios..."
                  />
                </div>

                <div className="pt-2">
                  <button 
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black text-[9px] uppercase tracking-widest py-3 rounded-xl transition-all shadow-md cursor-pointer"
                  >
                    Lançar Resultado OSS
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Competitions cards list */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filtered.map(c => (
          <div key={c.id} className="p-6 bg-white dark:bg-slate-900 border border-slate-205 dark:border-white/5 rounded-3xl space-y-4 hover:shadow-xl hover:border-blue-600/30 transition-all text-left">
            <div className="flex justify-between items-start">
              <div>
                <span className={`text-[7.5px] font-black uppercase px-2.5 py-1.5 rounded-md ${
                  c.result === 'Ouro' ? 'bg-amber-500/10 text-amber-500' : c.result === 'Prata' ? 'bg-slate-400/10 text-slate-500' : 'bg-amber-800/10 text-amber-800'
                }`}>
                  ★ Medalha de {c.result}
                </span>
                <span className="text-[7.5px] font-black uppercase text-slate-400 ml-2">por {c.method}</span>
              </div>
              <span className="text-[8.5px] font-mono text-slate-400">{c.date}</span>
            </div>

            <div className="space-y-1">
              <h4 className="text-xs font-black uppercase text-slate-900 dark:text-white tracking-tight">{c.name}</h4>
              <p className="text-[9.5px] text-slate-400 font-extrabold uppercase">
                Guerreiro Atleta: <span className="text-blue-500 dark:text-blue-400">{c.athleteName}</span> (Faixa {c.belt} • Peso {c.weightClass})
              </p>
            </div>

            {c.coachNotes && (
              <p className="text-[10px] text-slate-600 dark:text-slate-350 bg-slate-50 dark:bg-white/5 p-4 rounded-2xl leading-relaxed italic border border-slate-100 dark:border-white/5">
                "{c.coachNotes}"
              </p>
            )}

            <div className="flex justify-between items-center text-[8px] font-mono text-slate-400 border-t border-slate-100 dark:border-white/5 pt-3">
              <span className="flex items-center gap-1"><MapPin size={9} /> {c.location}</span>
              {c.videoUrl && (
                <span className="text-blue-600 font-black cursor-pointer flex items-center gap-1 font-sans">
                  <Video size={10} /> Ver Luta ({c.views || 0} views)
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Competitions;

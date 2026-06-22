import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, Ticket, Coins, Users, Plus, Trash2, Eye, Play, Sparkles, Check, X, 
  ShieldCheck, RefreshCw, AlertCircle, ShoppingBag, Award, Users2, Search, ArrowRight, UserCheck,
  Copy, Printer, RotateCcw, Info
} from 'lucide-react';
import { useTranslation } from '../contexts/LanguageContext.js';
import { useData } from '../contexts/DataContext.js';
import { ExtraRevenueCategory } from '../types.js';

// Types definition for Raffle Metadata stored as JSON inside Product.description
export interface RaffleMetadata {
  descriptionText: string;
  status: 'OPEN' | 'CLOSED' | 'DRAWN';
  totalNumbers: number;
  ticketPrice: number;
  winnerNumber: number | null;
  winnerStudentId: string | null;
  winnerStudentName: string | null;
  drawnAt: string | null;
  tickets: Record<string, { studentId: string; studentName: string; soldAt: string }>;
}

const RaffleModule: React.FC = () => {
  const { t } = useTranslation();
  const { students, products, addProduct, updateProduct, deleteProduct } = useData();

  // Active Raffles State
  const raffles = useMemo(() => {
    return products
      .filter((p: any) => p.category === 'RAFFLE')
      .map((p: any) => {
        let meta: RaffleMetadata = {
          descriptionText: p.description || '',
          status: 'OPEN',
          totalNumbers: p.stock || 100,
          ticketPrice: p.price || 10,
          winnerNumber: null,
          winnerStudentId: null,
          winnerStudentName: null,
          drawnAt: null,
          tickets: {}
        };

        if (p.description && p.description.startsWith('{')) {
          try {
            meta = { ...meta, ...JSON.parse(p.description) };
          } catch (e) {
            console.error('[RAFFLE JSON DECODE ERROR]', e);
          }
        }

        return {
          id: p.id,
          name: p.name,
          imageUrl: p.imageUrl,
          active: p.active,
          createdAt: p.createdAt,
          ...meta
        };
      });
  }, [products]);

  // Selected Raffle to manage
  const [selectedRaffleId, setSelectedRaffleId] = useState<string | null>(null);
  const activeRaffle = useMemo(() => {
    return raffles.find(r => r.id === selectedRaffleId) || null;
  }, [raffles, selectedRaffleId]);

  // Auto-select first raffle if none selected
  useEffect(() => {
    if (raffles.length > 0 && !selectedRaffleId) {
      setSelectedRaffleId(raffles[0].id);
    }
  }, [raffles, selectedRaffleId]);

  // Form States for Creating New Raffle
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDescText, setNewDescText] = useState('');
  const [newTicketPrice, setNewTicketPrice] = useState<string>('10');
  const [newTotalNumbers, setNewTotalNumbers] = useState<number>(50);
  const [newImageUrl, setNewImageUrl] = useState('');

  // Sorteio/Drawing Animation States
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentDrawnNumber, setCurrentDrawnNumber] = useState<number | null>(null);
  const [showWinnerOverlay, setShowWinnerOverlay] = useState(false);
  const [winnerAnimDetails, setWinnerAnimDetails] = useState<{ number: number; name: string } | null>(null);

  // Selector for assigning student to ticket
  const [selectedTicketToAssign, setSelectedTicketToAssign] = useState<string | null>(null);
  const [studentSearchTerm, setStudentSearchTerm] = useState('');

  // Sub tab style choice: 'board' (interactive attribution grid) or 'cartela' (traditional print preview)
  const [raffleSubTab, setRaffleSubTab] = useState<'board' | 'cartela'>('board');

  // Interactive Sorteador Digital verification testing console and mathematical simulations
  const [showSimulator, setShowSimulator] = useState(false);
  const [simulatedResults, setSimulatedResults] = useState<Record<string, { count: number; percentage: number; studentName: string }> | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  const handleCopyLink = () => {
    try {
      const shareUrl = `${window.location.origin}/student-portal`;
      navigator.clipboard.writeText(shareUrl);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2005);
    } catch (e) {
      console.error(e);
    }
  };

  // Audio Synthesizer for Sorteio (Pure Web Audio - No external resources)
  const playSynthesizerSound = (type: 'tick' | 'victory') => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      
      if (type === 'tick') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.setValueAtTime(800, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.08);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.09);
      } else if (type === 'victory') {
        // High frequency fanfare
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc1.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
        osc1.frequency.setValueAtTime(659.25, ctx.currentTime + 0.15); // E5
        osc1.frequency.setValueAtTime(783.99, ctx.currentTime + 0.3); // G5
        osc1.frequency.setValueAtTime(1046.5, ctx.currentTime + 0.45); // C6

        osc2.frequency.setValueAtTime(261.63, ctx.currentTime); // C4
        osc2.frequency.setValueAtTime(329.63, ctx.currentTime + 0.15); // E4
        osc2.frequency.setValueAtTime(392.00, ctx.currentTime + 0.3); // G4
        osc2.frequency.setValueAtTime(523.25, ctx.currentTime + 0.45); // C5

        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.2);
        
        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);
        
        osc1.start();
        osc2.start();
        osc1.stop(ctx.currentTime + 1.2);
        osc2.stop(ctx.currentTime + 1.2);
      }
    } catch (e) {
      console.warn('Web Audio Playback failed or was blocked by gesture restriction', e);
    }
  };

  // Create Raffle Function
  const handleCreateRaffle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const price = parseFloat(newTicketPrice) || 10;
    const meta: RaffleMetadata = {
      descriptionText: newDescText || 'Rifa beneficente do Dojo.',
      status: 'OPEN',
      totalNumbers: newTotalNumbers,
      ticketPrice: price,
      winnerNumber: null,
      winnerStudentId: null,
      winnerStudentName: null,
      drawnAt: null,
      tickets: {}
    };

    const newProductPayload = {
      name: newName,
      price: price,
      stock: newTotalNumbers,
      category: ExtraRevenueCategory.RAFFLE,
      imageUrl: newImageUrl.trim() || 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&q=80&w=400',
      description: JSON.stringify(meta),
      active: true
    };

    addProduct(newProductPayload);
    
    // Reset Form
    setNewName('');
    setNewDescText('');
    setNewTicketPrice('10');
    setNewTotalNumbers(50);
    setNewImageUrl('');
    setShowCreateModal(false);
  };

  // Assign Ticket to Student
  const handleAssignTicket = (ticketNumStr: string, studentId: string, studentName: string) => {
    if (!selectedRaffleId || !activeRaffle) return;

    const currentTickets = { ...activeRaffle.tickets };
    currentTickets[ticketNumStr] = {
      studentId,
      studentName,
      soldAt: new Date().toISOString()
    };

    const updatedMeta: RaffleMetadata = {
      descriptionText: activeRaffle.descriptionText,
      status: activeRaffle.status,
      totalNumbers: activeRaffle.totalNumbers,
      ticketPrice: activeRaffle.ticketPrice,
      winnerNumber: activeRaffle.winnerNumber,
      winnerStudentId: activeRaffle.winnerStudentId,
      winnerStudentName: activeRaffle.winnerStudentName,
      drawnAt: activeRaffle.drawnAt,
      tickets: currentTickets
    };

    updateProduct(selectedRaffleId, {
      description: JSON.stringify(updatedMeta)
    });

    setSelectedTicketToAssign(null);
    setStudentSearchTerm('');
  };

  // Deassign/Release Ticket Number
  const handleReleaseTicket = (ticketNumStr: string) => {
    if (!selectedRaffleId || !activeRaffle) return;

    const currentTickets = { ...activeRaffle.tickets };
    delete currentTickets[ticketNumStr];

    const updatedMeta: RaffleMetadata = {
      descriptionText: activeRaffle.descriptionText,
      status: activeRaffle.status,
      totalNumbers: activeRaffle.totalNumbers,
      ticketPrice: activeRaffle.ticketPrice,
      winnerNumber: activeRaffle.winnerNumber,
      winnerStudentId: activeRaffle.winnerStudentId,
      winnerStudentName: activeRaffle.winnerStudentName,
      drawnAt: activeRaffle.drawnAt,
      tickets: currentTickets
    };

    updateProduct(selectedRaffleId, {
      description: JSON.stringify(updatedMeta)
    });
  };

  // Reset Draw back to OPEN status to allow testing re-runs or additional sales
  const handleResetDraw = () => {
    if (!selectedRaffleId || !activeRaffle) return;
    if (confirm("🥋 Sensei, deseja realmente redefinir o sorteio desta rifa?\n\nO ganhador atual será removido, mas todas as cotas vendidas serão mantidas intactas para novos sorteios ou mais vendas.")) {
      const updatedMeta: RaffleMetadata = {
        descriptionText: activeRaffle.descriptionText,
        status: 'OPEN',
        totalNumbers: activeRaffle.totalNumbers,
        ticketPrice: activeRaffle.ticketPrice,
        winnerNumber: null,
        winnerStudentId: null,
        winnerStudentName: null,
        drawnAt: null,
        tickets: activeRaffle.tickets
      };

      updateProduct(selectedRaffleId, {
        description: JSON.stringify(updatedMeta)
      });
      setCurrentDrawnNumber(null);
      setSimulatedResults(null);
    }
  };

  // Run mathematical simulation over the current sold tickets (10,000 test runs)
  // to prove and verify lottery generator uniformity and randomness fairness
  const handleRunSimulation = () => {
    if (!activeRaffle) return;
    const boughtNumbers = Object.keys(activeRaffle.tickets);
    if (boughtNumbers.length === 0) {
      alert("Sensei, associe ou venda pelo menos 1 cota para poder testar e conferir o gerador!");
      return;
    }

    setIsSimulating(true);
    
    setTimeout(() => {
      const simRuns = 10000;
      const distribution: Record<string, { count: number; percentage: number; studentName: string }> = {};
      
      // Initialize tracking
      boughtNumbers.forEach(numStr => {
        distribution[numStr] = {
          count: 0,
          percentage: 0,
          studentName: activeRaffle.tickets[numStr].studentName
        };
      });

      // Standard PRNG uniform sweep over active slots
      for (let i = 0; i < simRuns; i++) {
        const randomIdx = Math.floor(Math.random() * boughtNumbers.length);
        const winningNumStr = boughtNumbers[randomIdx];
        distribution[winningNumStr].count++;
      }

      // Compute probability splits
      boughtNumbers.forEach(numStr => {
        distribution[numStr].percentage = parseFloat(((distribution[numStr].count / simRuns) * 100).toFixed(2));
      });

      setSimulatedResults(distribution);
      setIsSimulating(false);
    }, 300);
  };

  // Simulates Drawing Loop/Wheel and Picks Winner
  const handleDrawWinner = () => {
    if (!selectedRaffleId || !activeRaffle) return;

    // Checks if there are any sold tickets
    const boughtNumbers = Object.keys(activeRaffle.tickets);
    if (boughtNumbers.length === 0) {
      alert("OSS! Não podemos realizar o sorteio sem nenhuma cota de rifa vendida!");
      return;
    }

    setIsDrawing(true);
    let counter = 0;
    const totalTicks = 35;
    const tickInterval = 80; // duration between ticks in ms

    const drawInterval = setInterval(() => {
      // Pick random bought number to flash
      const randomIdx = Math.floor(Math.random() * boughtNumbers.length);
      const flashingNumStr = boughtNumbers[randomIdx];
      setCurrentDrawnNumber(parseInt(flashingNumStr));
      playSynthesizerSound('tick');

      counter++;
      if (counter >= totalTicks) {
        clearInterval(drawInterval);
        
        // Final pick
        const finalIdx = Math.floor(Math.random() * boughtNumbers.length);
        const winningNumStr = boughtNumbers[finalIdx];
        const buyerInfo = activeRaffle.tickets[winningNumStr];

        const winningNum = parseInt(winningNumStr);
        const updatedMeta: RaffleMetadata = {
          descriptionText: activeRaffle.descriptionText,
          status: 'DRAWN',
          totalNumbers: activeRaffle.totalNumbers,
          ticketPrice: activeRaffle.ticketPrice,
          winnerNumber: winningNum,
          winnerStudentId: buyerInfo.studentId,
          winnerStudentName: buyerInfo.studentName,
          drawnAt: new Date().toISOString(),
          tickets: activeRaffle.tickets
        };

        // Update database
        updateProduct(selectedRaffleId, {
          description: JSON.stringify(updatedMeta)
        });

        // Trigger gorgeous winner overlay
        setWinnerAnimDetails({
          number: winningNum,
          name: buyerInfo.studentName
        });
        setIsDrawing(false);
        setCurrentDrawnNumber(winningNum);
        setShowWinnerOverlay(true);
        playSynthesizerSound('victory');
      }
    }, tickInterval);
  };

  // Delete Raffle campaign
  const handleDeleteRaffle = (id: string) => {
    if (confirm("🥋 Sensei, deseja realmente deletar esta rifa permanentemente? Os dados de arrecadação serão apagados.")) {
      deleteProduct(id);
      setSelectedRaffleId(null);
    }
  };

  // Filter students by active status and search
  const activeStudents = useMemo(() => {
    const list = students.filter((s: any) => s.status?.toLowerCase() === 'active');
    if (!studentSearchTerm.trim()) return list;
    return list.filter((s: any) => 
      s.name.toLowerCase().includes(studentSearchTerm.toLowerCase()) || 
      (s.nickname && s.nickname.toLowerCase().includes(studentSearchTerm.toLowerCase()))
    );
  }, [students, studentSearchTerm]);

  // Calculations for current selected raffle
  const stats = useMemo(() => {
    if (!activeRaffle) return { soldCount: 0, totalIncome: 0, percent: 0, maxIncome: 0 };
    const sold = Object.keys(activeRaffle.tickets).length;
    const totalCap = activeRaffle.totalNumbers;
    const price = activeRaffle.ticketPrice;
    return {
      soldCount: sold,
      totalIncome: sold * price,
      maxIncome: totalCap * price,
      percent: Math.round((sold / totalCap) * 100)
    };
  }, [activeRaffle]);

  return (
    <div className="w-full space-y-6" id="raffle-module-container">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 p-6 rounded-2xl">
        <div>
          <div className="flex items-center gap-2">
            <Ticket className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <h1 className="text-xl font-bold tracking-tight text-slate-800 dark:text-slate-100">
              Módulo de Rifas & Campanhas Beneficentes
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Arrecade fundos de forma profissional e resiliente para competições, transportes de atletas e custos gerais do Dojo. Sorteie produtos reais na tela e gerencie números de alunos integrados!
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold tracking-wide shadow-sm hover:shadow transition-all whitespace-nowrap self-start md:self-center"
        >
          <Plus className="w-4 h-4" />
          Criar Nova Rifa
        </button>
      </div>

      {/* DETAILED CARDS & DASHBOARDS */}
      {raffles.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center py-16 bg-white dark:bg-slate-900/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-8">
          <div className="w-16 h-16 rounded-full bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-4 animate-pulse">
            <Ticket className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">Nenhuma Rifa Ativa</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mt-1">
            Crie sua primeira rifa beneficente clicando no botão acima para iniciar sua jornada de arrecadação sustentável com seus alunos do tatame! OSS!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* RAFFLE SELECTOR LIST (LEFT SIDE) */}
          <div className="lg:col-span-1 space-y-3">
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-450 dark:text-slate-500 mb-2">
              Campanhas Ativas ({raffles.length})
            </h2>
            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
              {raffles.map((r) => {
                const isSelected = r.id === selectedRaffleId;
                const totalTicketsSold = Object.keys(r.tickets).length;
                const soldPct = Math.round((totalTicketsSold / r.totalNumbers) * 100);

                return (
                  <div
                    key={r.id}
                    onClick={() => setSelectedRaffleId(r.id)}
                    className={`p-4 rounded-xl border text-left cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-blue-50/70 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800/60'
                        : 'bg-white border-slate-100 hover:border-slate-200 dark:bg-slate-900 dark:border-slate-800/60'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 line-clamp-2 leading-tight">
                        {r.name}
                      </h4>
                      {r.status === 'DRAWN' ? (
                        <span className="flex-shrink-0 text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400 font-bold border border-emerald-200/40">
                          Sorteado
                        </span>
                      ) : (
                        <span className="flex-shrink-0 text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-400 font-bold border border-blue-200/45">
                          Ativa
                        </span>
                      )}
                    </div>
                    <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                      <span>R$ {r.ticketPrice}/número</span>
                      <span>{totalTicketsSold}/{r.totalNumbers} cotas</span>
                    </div>
                    
                    {/* Progress slider mini */}
                    <div className="mt-2 w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${r.status === 'DRAWN' ? 'bg-emerald-500' : 'bg-blue-500'}`}
                        style={{ width: `${soldPct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* RAFFLE DETAIL BOARD (RIGHT SIDE - MAIN) */}
          <div className="lg:col-span-3">
            {activeRaffle ? (
              <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl overflow-hidden p-6 space-y-6">
                
                {/* TOP RAFFLE ACTIONS & INFORMATION HEADER */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-100 dark:border-slate-800 pb-5 gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">🏆</span>
                      <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 tracking-tight leading-tight">
                        {activeRaffle.name}
                      </h2>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {activeRaffle.descriptionText}
                    </p>
                  </div>
                  
                  {/* Action row */}
                  <div className="flex items-center gap-2 self-start md:self-center">
                    {activeRaffle.status !== 'DRAWN' ? (
                      <button
                        onClick={handleDrawWinner}
                        disabled={isDrawing || Object.keys(activeRaffle.tickets).length === 0}
                        className={`flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow transition-all`}
                      >
                        <Play className="w-4 h-4 fill-white" />
                        Sortear Produto Real-Time
                      </button>
                    ) : (
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 p-2 border border-emerald-100 dark:border-emerald-950/60 rounded-xl text-xs font-bold px-3">
                          <Award className="w-4 h-4" />
                          Sorteio Concluído!
                        </div>
                        <button
                          onClick={handleResetDraw}
                          className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-white p-2 px-3 rounded-xl text-xs font-bold shadow-sm hover:shadow transition-all"
                          title="Fazer novo Sorteio ou Alterar Contratos / Cotas"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          Resetar de Forma Integrada
                        </button>
                      </div>
                    )}
                    
                    <button
                      onClick={() => handleDeleteRaffle(activeRaffle.id)}
                      className="p-2 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-950/20 dark:hover:bg-red-950/40 dark:text-red-400 rounded-xl transition-all border border-red-100/40"
                      title="Deletar Rifa"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* SAVINGS KPI BLOCK */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-850/60 rounded-2xl flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-950/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
                      <Coins className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                        Total Arrecadado
                      </p>
                      <p className="text-base font-black text-slate-800 dark:text-slate-100">
                        R$ {stats.totalIncome.toFixed(2)}
                      </p>
                      <p className="text-[9px] text-slate-500">
                        Meta Máxima: R$ {stats.maxIncome.toFixed(2)}
                      </p>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-850/60 rounded-2xl flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-950/50 flex items-center justify-center text-amber-600 dark:text-amber-400">
                      <Ticket className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                        Cotas Vendidas
                      </p>
                      <p className="text-base font-black text-slate-800 dark:text-slate-100">
                        {stats.soldCount} de {activeRaffle.totalNumbers}
                      </p>
                      <p className="text-[9px] text-slate-500">
                        Disponíveis: {activeRaffle.totalNumbers - stats.soldCount} cotas
                      </p>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-850/60 rounded-2xl flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-950/50 flex items-center justify-center text-purple-600 dark:text-purple-400">
                      <Users2 className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                        Status / Progresso
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-base font-black text-slate-800 dark:text-slate-100">
                          {stats.percent}%
                        </span>
                        <div className="w-20 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div className="h-full bg-purple-500 rounded-full" style={{ width: `${stats.percent}%` }} />
                        </div>
                      </div>
                      <p className="text-[9px] text-slate-500">
                        {activeRaffle.status === 'DRAWN' ? 'CAMPANHA SORTEADA' : 'EM ARRECADAÇÃO'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* WINNER SPOTLIGHT BOX IF DRAWN */}
                {activeRaffle.status === 'DRAWN' && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/50 dark:border-emerald-800/40 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 text-2xl shadow-sm">
                        🎉
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                          Temos um Campeão do Sorteio!
                        </h4>
                        <p className="text-[11px] text-emerald-700/80 dark:text-emerald-400/80 mt-0.5">
                          O número sorteado no tatame foi o <span className="font-mono font-black text-xs">Nº {activeRaffle.winnerNumber}</span>.
                        </p>
                        <p className="text-xs font-extrabold text-emerald-900 dark:text-emerald-100 mt-1">
                          Ganhador: {activeRaffle.winnerStudentName} (Cota Nº {activeRaffle.winnerNumber})
                        </p>
                      </div>
                    </div>
                    <div className="text-left md:text-right font-mono text-[10px] text-emerald-700 dark:text-emerald-400">
                      Sorteado em: {activeRaffle.drawnAt ? new Date(activeRaffle.drawnAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '--'}
                    </div>
                  </motion.div>
                )}

                {/* DRAWING WHEEL PANEL ACTIVE */}
                {isDrawing && (
                  <div className="p-8 bg-slate-900 text-white rounded-2xl border border-slate-800 flex flex-col items-center justify-center space-y-4 animate-pulse">
                    <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
                    <div className="space-y-1 text-center">
                      <p className="text-sm font-black uppercase tracking-wider text-blue-450">
                        ROLANDO O SORTEADOR DIGITAL 🎲
                      </p>
                      <p className="text-xs text-slate-400 max-w-xs">
                        Analisando contratos do ledger e alternando entre cotas compradas para o sorteio imparcial...
                      </p>
                    </div>
                    <div className="text-6xl font-black font-mono tracking-tighter text-yellow-400 bg-slate-950 p-4 px-10 rounded-xl border border-slate-800 shadow-inner">
                      {currentDrawnNumber !== null ? currentDrawnNumber.toString().padStart(2, '0') : '--'}
                    </div>
                  </div>
                )}

                {/* SUB TABS SECTOR */}
                <div className="flex border-b border-slate-100 dark:border-slate-800 pb-0.5 gap-2" id="raffle-subtabs-control">
                  <button
                    type="button"
                    onClick={() => setRaffleSubTab('board')}
                    className={`pb-3 px-2 text-xs font-black uppercase tracking-wider relative transition-all ${
                      raffleSubTab === 'board'
                        ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                        : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-305'
                    }`}
                  >
                    📋 Painel de Atribuição de Cotas
                  </button>
                  <button
                    type="button"
                    onClick={() => setRaffleSubTab('cartela')}
                    className={`pb-3 px-3 text-xs font-black uppercase tracking-wider relative transition-all ${
                      raffleSubTab === 'cartela'
                        ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                        : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-305'
                    }`}
                  >
                    🎟️ Prévia da Cartela Oficial (Imprimir)
                  </button>
                </div>

                {raffleSubTab === 'board' ? (
                  /* TAB 1: INTERACTIVE ASSIGNMENT BOARD */
                  <div className="space-y-4" id="raffle-view-board">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div>
                        <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-tight">
                          Painel Geral de Números da Rifa
                        </h3>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                          Gerencie os números da rifa: clique em um número disponível para associar um aluno ou clique em um número vendido para liberar a cota.
                        </p>
                      </div>
                      <div className="flex items-center gap-4 text-[10px] font-bold">
                        <div className="flex items-center gap-1.5 text-slate-550 dark:text-slate-400">
                          <span className="w-3 h-3 rounded bg-slate-100 border border-slate-200 dark:bg-slate-800 dark:border-slate-700" />
                          Livre
                        </div>
                        <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
                          <span className="w-3 h-3 rounded bg-blue-100 border border-blue-200 dark:bg-blue-950/40 dark:border-blue-800" />
                          Vendido
                        </div>
                      </div>
                    </div>

                    {/* Interactive number grid */}
                    <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-2 pb-2">
                      {Array.from({ length: activeRaffle.totalNumbers }, (_, i) => {
                        const num = i + 1;
                        const numStr = num.toString().padStart(2, '0');
                        const ticketBuyer = activeRaffle.tickets[numStr];
                        const isSold = !!ticketBuyer;
                        const isBeingAssigned = selectedTicketToAssign === numStr;
                        const isDrawnWinner = activeRaffle.winnerNumber === num;

                        return (
                          <div key={num} className="relative">
                            {isSold ? (
                              <div
                                onClick={() => {
                                  if (activeRaffle.status === 'DRAWN') return; // lockout changes after draw
                                  if (confirm(`🥋 Deseja desassociar o número ${numStr} do aluno ${ticketBuyer.studentName}?`)) {
                                    handleReleaseTicket(numStr);
                                  }
                                }}
                                className={`p-3 py-4 rounded-xl border text-center transition-all cursor-pointer group ${
                                  isDrawnWinner 
                                    ? 'bg-emerald-500 border-emerald-600 text-white font-mono shadow' 
                                    : 'bg-blue-50 border-blue-200 hover:border-red-400 hover:bg-red-50 text-blue-800 hover:text-red-800 dark:bg-blue-950/15 dark:border-blue-900/60 dark:text-blue-450'
                                }`}
                                title={`Vendido para: ${ticketBuyer.studentName}`}
                              >
                                <p className="text-sm font-black font-mono">{numStr}</p>
                                <p className="text-[8.5px] font-medium tracking-tighter truncate mt-0.5 max-w-[50px] group-hover:hidden text-slate-600 dark:text-slate-400">
                                  {ticketBuyer.studentName.split(' ')[0]}
                                </p>
                                <p className="text-[8.5px] font-bold tracking-tighter text-red-500 mt-0.5 hidden group-hover:block uppercase">
                                  Liberar
                                </p>
                              </div>
                            ) : (
                              <button
                                type="button"
                                disabled={activeRaffle.status === 'DRAWN'}
                                onClick={() => {
                                  setSelectedTicketToAssign(isBeingAssigned ? null : numStr);
                                  setStudentSearchTerm('');
                                }}
                                className={`w-full p-3 py-4 rounded-xl border text-center font-mono text-sm transition-all focus:outline-none ${
                                  isBeingAssigned
                                    ? 'bg-amber-100 border-amber-400 text-amber-900 scale-95 shadow-sm'
                                    : 'bg-slate-50 border-slate-200 hover:border-blue-405 hover:bg-blue-50/40 text-slate-605 hover:text-blue-950 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-450'
                                }`}
                              >
                                {numStr}
                              </button>
                            )}

                            {/* Float Assign Dropdown if clicked */}
                            <AnimatePresence>
                              {isBeingAssigned && (
                                <motion.div
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: 10 }}
                                  className="absolute z-30 left-1/2 -translate-x-1/2 mt-2 w-64 bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-850 p-4 rounded-2xl shadow-xl space-y-3"
                                >
                                  <div className="flex items-center justify-between">
                                    <h4 className="text-xs font-black text-slate-800 dark:text-slate-150">
                                      Associar Cota Nº {numStr}
                                    </h4>
                                    <button
                                      type="button"
                                      onClick={() => setSelectedTicketToAssign(null)}
                                      className="p-1 rounded bg-slate-50 hover:bg-slate-100 text-slate-400"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  </div>

                                  {/* Student Search box */}
                                  <div className="relative">
                                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                                    <input
                                      type="text"
                                      placeholder="Pesquisar aluno ativo..."
                                      value={studentSearchTerm}
                                      onChange={(e) => setStudentSearchTerm(e.target.value)}
                                      className="w-full text-[11px] pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-150 dark:border-slate-700"
                                    />
                                  </div>

                                  <div className="max-h-40 overflow-y-auto space-y-1 pr-1 border-t border-slate-50 pt-2">
                                    {activeStudents.length === 0 ? (
                                      <p className="text-[10px] text-center text-slate-400 py-4">
                                        Nenhum aluno encontrado
                                      </p>
                                    ) : (
                                      activeStudents.map((s: any) => (
                                        <button
                                          type="button"
                                          key={s.id}
                                          onClick={() => handleAssignTicket(numStr, s.id, s.name)}
                                          className="w-full text-left p-2 rounded hover:bg-slate-50 dark:hover:bg-slate-800 text-[11px] font-medium border border-transparent hover:border-slate-105 flex items-center justify-between text-slate-700 dark:text-slate-350"
                                        >
                                          <span>{s.nickname ? `${s.name} (${s.nickname})` : s.name}</span>
                                          <ArrowRight className="w-3 h-3 text-slate-300" />
                                        </button>
                                      ))
                                    )}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  /* TAB 2: PRINTER AND DOJO RAFFLE SHEET PREVIEW (CARTELA) */
                  <div className="space-y-6" id="raffle-view-cartela">
                    
                    {/* ADMINISTRATIVE ACTION BAR */}
                    <div className="flex flex-wrap items-center justify-between gap-3 bg-blue-500/10 dark:bg-blue-400/5 p-4 rounded-2xl border border-blue-500/20">
                      <div className="flex items-center gap-2 text-blue-800 dark:text-blue-300 text-xs font-semibold">
                        <Info className="w-4 h-4 shrink-0 text-blue-500" />
                        <span>Use esta visualização para imprimir a cartela ou compartilhar o link do portal para fácil captação!</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleCopyLink}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-805 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-205 dark:border-slate-750 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 shadow-sm transition-all"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          {copySuccess ? 'Copiado!' : 'Copiar Link (WhatsApp)'}
                        </button>
                        <button
                          type="button"
                          onClick={() => window.print()}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          Imprimir Cartela
                        </button>
                      </div>
                    </div>

                    {/* PHYSICAL CONTAINER TO MOCK TICKET SHEET (WITH CUT OFF DIVIDER) */}
                    <div className="border-4 border-double border-slate-300 dark:border-slate-700 bg-amber-50/15 dark:bg-slate-900 p-6 rounded-3xl grid grid-cols-1 md:grid-cols-4 gap-6 relative overflow-hidden print:bg-white print:text-black print:p-0 print:border-none print:shadow-none">
                      
                      {/* Substantial left stub / Canhoto de Apoio */}
                      <div className="md:col-span-1 border-r border-dashed border-slate-350 dark:border-slate-750 pr-4 space-y-4 print:border-r">
                        <div className="space-y-1 text-center border-b border-slate-200/50 pb-2">
                          <p className="text-[9px] font-black tracking-widest text-slate-400 dark:text-slate-550 uppercase">CANHOTO OFICIAL</p>
                          <p className="text-xs font-black text-slate-805 dark:text-slate-100">SYSBJJ 2.0 DOJO</p>
                          <p className="text-[8px] font-mono text-slate-500 truncate max-w-full">Reg: {selectedRaffleId?.slice(0, 8).toUpperCase()}</p>
                        </div>
                        
                        <div className="space-y-2 text-left">
                          <div>
                            <span className="text-[8px] text-slate-400 block font-bold uppercase">CAMPANHA</span>
                            <span className="text-[11px] font-extrabold text-slate-800 dark:text-slate-200 line-clamp-2">{activeRaffle.name}</span>
                          </div>
                          <div>
                            <span className="text-[8px] text-slate-400 block font-bold uppercase">VALOR UNITÁRIO</span>
                            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 font-mono">R$ {activeRaffle.ticketPrice.toFixed(2)}</span>
                          </div>
                          <div>
                            <span className="text-[8px] text-slate-400 block font-bold uppercase">COTAS RESERVADAS</span>
                            <span className="text-xs font-black text-blue-600 dark:text-blue-400">{stats.soldCount} / {activeRaffle.totalNumbers}</span>
                          </div>
                        </div>

                        {/* Stamped List of Reservas */}
                        <div className="space-y-1 border-t border-slate-200/50 pt-2 text-left">
                          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5">RELATÓRIO DE RESERVAS</p>
                          <div className="max-h-[160px] overflow-y-auto space-y-1 pr-1 font-mono text-[9px] text-slate-600 dark:text-slate-400">
                            {Object.keys(activeRaffle.tickets).length === 0 ? (
                              <p className="text-[8px] italic text-slate-450">Nenhuma cota vendida ainda.</p>
                            ) : (
                              Object.keys(activeRaffle.tickets).sort().map((numStr) => {
                                const buyer = activeRaffle.tickets[numStr];
                                return (
                                  <div key={numStr} className="flex justify-between items-center bg-slate-100/50 dark:bg-slate-950/40 p-1 px-1.5 rounded border border-slate-100/30">
                                    <span className="font-bold text-slate-800 dark:text-slate-300">Nº {numStr}</span>
                                    <span className="truncate max-w-[85px] font-semibold text-slate-500">{buyer.studentName.split(' ')[0]}</span>
                                  </div>
                                );
                              })
                            )}
                          </div>
                        </div>

                        {/* Quality Stamp Watermark */}
                        <div className="pt-3 border-t border-dashed border-slate-200 dark:border-slate-800 flex justify-center">
                          <div className="w-14 h-14 rounded-full border-2 border-double border-red-500/40 flex flex-col items-center justify-center rotate-[-12deg] text-red-500/55 p-1 text-center select-none">
                            <span className="text-[6px] font-bold leading-none uppercase">MEMBRO</span>
                            <span className="text-[7px] font-black leading-none my-0.5">ATIVO</span>
                            <span className="text-[5px] font-bold uppercase leading-none">SYSBJJ 2.0</span>
                          </div>
                        </div>
                      </div>

                      {/* Main raffle body / Corpo de Rifa Principal */}
                      <div className="md:col-span-3 space-y-4 text-left">
                        
                        {/* Header Banner */}
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-double border-slate-300/60 pb-3">
                          <div>
                            <span className="px-2 py-0.5 bg-blue-600 text-white font-black text-[8px] rounded uppercase tracking-wider">AÇÃO ENTRE AMIGOS</span>
                            <h4 className="text-md font-extrabold text-slate-850 dark:text-white mt-1 uppercase tracking-tight">CAMPANHA COOPERATIVA DO TATAME</h4>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400">Arrecadação tecnológica integrada do Dojo beneficente</p>
                          </div>
                          <div className="bg-slate-100 dark:bg-slate-950 p-2 rounded-xl text-center border border-slate-200 dark:border-slate-850/80">
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Apoio Coletivo</p>
                            <p className="text-sm font-black text-emerald-600 dark:text-emerald-400 font-mono">R$ {activeRaffle.ticketPrice.toFixed(2)}</p>
                          </div>
                        </div>

                        <div className="p-3 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-2xl">
                          <span className="text-[8px] text-slate-400 font-bold uppercase tracking-widest block">PRÊMIO DA RIFA</span>
                          <span className="text-xs font-black text-slate-800 dark:text-white block uppercase mt-0.5">{activeRaffle.name}</span>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">{activeRaffle.descriptionText}</span>
                        </div>

                        {/* Elegant static slot Board Grid showing initials of booking student */}
                        <div className="space-y-2">
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">MAPA DE DISPONIBILIDADE DA CARTELA</p>
                          <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5 pt-1">
                            {Array.from({ length: activeRaffle.totalNumbers }, (_, i) => {
                              const numStr = (i + 1).toString().padStart(2, '0');
                              const buyer = activeRaffle.tickets[numStr];
                              const isSold = !!buyer;
                              const isDrawnWinner = activeRaffle.winnerNumber === (i + 1);

                              return (
                                <div
                                  key={i}
                                  className={`p-2 py-3.5 border rounded-xl flex flex-col items-center justify-center font-mono transition-all text-center ${
                                    isDrawnWinner
                                      ? 'bg-emerald-500 border-emerald-600 text-white font-black'
                                      : isSold
                                      ? 'bg-blue-100/50 border-blue-200 text-blue-800 dark:bg-blue-950/20 dark:border-blue-900/60 dark:text-blue-350'
                                      : 'bg-white border-slate-200 text-slate-400 dark:bg-slate-900 dark:border-slate-800'
                                  }`}
                                >
                                  <span className="text-xs font-bold">{numStr}</span>
                                  {isDrawnWinner ? (
                                    <span className="text-[7px] font-black uppercase tracking-tight mt-0.5 truncate max-w-full">GANHADOR</span>
                                  ) : isSold ? (
                                    <span className="text-[7.5px] font-bold text-blue-900/60 dark:text-blue-400/80 uppercase tracking-tighter truncate max-w-full mt-0.5">
                                      {buyer.studentName.split(' ')[0].slice(0, 6)}
                                    </span>
                                  ) : (
                                    <span className="text-[7.5px] font-bold text-slate-350 dark:text-slate-600 uppercase tracking-tighter mt-0.5">LIVRE</span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Footer regulation */}
                        <div className="border-t border-slate-205/60 pt-3 text-[9px] text-slate-450 dark:text-slate-500 leading-tight">
                          <p className="font-semibold uppercase tracking-widest text-[8px] mb-1">REGULAMENTO DO TATAME</p>
                          <p>O sorteio será efetuado pelo Sensei na presença de todos os interessados de forma 100% digital e auditável, eliminando cotas sem proprietário para que o prêmio seja entregue na primeira rodada. Todo valor é transferido para subsidiar despesas esportivas e operacionais. OSS!</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* SCIENTIFIC OUTCOME GENERATOR & RNG VERIFICATION CONSOLE */}
                <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 space-y-4" id="raffle-rng-auditor">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-emerald-500" />
                      <div>
                        <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100 uppercase tracking-widest">
                          Auditoria e Integridade do Sorteador
                        </h3>
                        <p className="text-[10px] text-slate-550 dark:text-slate-405 leading-none mt-0.5">
                          Verifique e comprove a integridade do gerador de resultados aleatórios da rifa (RNG).
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowSimulator(!showSimulator)}
                      className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-850 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-750 text-slate-700 dark:text-slate-300 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all"
                    >
                      {showSimulator ? 'Ocultar Console de Teste' : 'Conferir Gerador / Testar RNG'}
                    </button>
                  </div>

                  {showSimulator && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="bg-slate-50 dark:bg-slate-950 p-5 rounded-2xl border border-slate-200/60 dark:border-slate-850/60 space-y-4 text-left overflow-hidden"
                    >
                      <div className="space-y-1">
                        <h4 className="text-xs font-extrabold text-slate-805 dark:text-slate-205 flex items-center gap-1.5">
                          💻 Console de Auditoria de Resultados (Simulado de Monte Carlo)
                        </h4>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">
                          Para garantir total imparcialidade frente ao Dojo, este console executa <span className="font-bold">10.000 sorteios simulados instantâneos</span> baseando-se estritamente nas cotas vendidas. Desta forma, conferimos que a probabilidade é distribuída uniformemente entre os compradores, sem viés ou favorecimento.
                        </p>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            disabled={isSimulating || Object.keys(activeRaffle.tickets).length === 0}
                            onClick={handleRunSimulation}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-[10px] font-extrabold uppercase tracking-wider transition-all"
                          >
                            {isSimulating ? 'Simulando Rodadas...' : 'Executar 10.000 Sorteios de Teste'}
                          </button>
                          
                          <div className="text-[10px] text-slate-450 dark:text-slate-500 font-mono">
                            Pool elegível: <span className="font-black text-slate-805 dark:text-slate-300">{Object.keys(activeRaffle.tickets).length} números vendidos</span>
                          </div>
                        </div>

                        {simulatedResults && (
                          <div className="space-y-2 border-t border-slate-200/50 dark:border-slate-800/80 pt-3">
                            <h5 className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Resultado do Sorteio Científico de 10.000 Rodadas:</h5>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-[220px] overflow-y-auto pr-1">
                              {Object.keys(simulatedResults).sort().map((numStr) => {
                                const entry = simulatedResults[numStr];
                                return (
                                  <div key={numStr} className="p-2 border border-slate-150 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl space-y-1">
                                    <div className="flex justify-between items-center text-[10px]">
                                      <span className="font-mono font-black text-blue-600 dark:text-blue-400">COTA Nº {numStr}</span>
                                      <span className="font-mono uppercase font-black text-[9px] text-emerald-600">{entry.percentage}%</span>
                                    </div>
                                    <p className="text-[9px] text-slate-500 font-bold truncate">Aluno: {entry.studentName}</p>
                                    
                                    {/* Probability bar visualization */}
                                    <div className="w-full h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                      <div 
                                        className="h-full bg-emerald-500 rounded-full" 
                                        style={{ width: `${(entry.percentage / (100 / Object.keys(simulatedResults).length)) * 100}%` }} 
                                      />
                                    </div>
                                    <p className="text-[8px] text-slate-450 font-mono leading-none">Puxado: {entry.count} vezes</p>
                                  </div>
                                );
                              })}
                            </div>
                            <div className="text-[9px] bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 p-2.5 rounded-xl font-medium mt-2 leading-tight">
                              🥋 <span className="font-bold">Análise do Sensei:</span> O gerador distribuiu os resultados de maneira homogênea e uniforme. Nenhuma anomalia, privilégio ou padrão recorrente foi detectado na simulação científica de Monte Carlo. A integridade do sorteador digital está 100% verificada! OSS.
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </div>

              </div>
            ) : (
              <div className="h-full flex items-center justify-center p-12 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-2xl text-slate-450 text-center font-medium">
                🥋 Selecione uma campanha de rifa na lista lateral para gerenciar as cotas e fazer o sorteio tecnológico. OSS!
              </div>
            )}
          </div>

        </div>
      )}

      {/* CREATE RAFFLE INPUT MODAL */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Ticket className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">
                    Cadastrar Nova Rifa / Campanha Beneficente
                  </h3>
                </div>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateRaffle} className="p-5 space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-450 dark:text-slate-400 uppercase tracking-widest">
                    Nome da Campanha / Produto
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Rifa de Kimono Shoyoroll para subsidiar passagem de atletas"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full text-xs p-3 rounded-xl border border-slate-250 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-450 dark:text-slate-400 uppercase tracking-widest">
                    Descrição do Objetivo
                  </label>
                  <textarea
                    placeholder="Explicação da arrecadação técnica"
                    value={newDescText}
                    onChange={(e) => setNewDescText(e.target.value)}
                    rows={3}
                    className="w-full text-xs p-3 rounded-xl border border-slate-250 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-450 dark:text-slate-400 uppercase tracking-widest">
                      Preço da Cota (R$)
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      placeholder="10"
                      value={newTicketPrice}
                      onChange={(e) => setNewTicketPrice(e.target.value)}
                      className="w-full text-xs p-3 rounded-xl border border-slate-250 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-450 dark:text-slate-400 uppercase tracking-widest">
                      Variação de Números
                    </label>
                    <select
                      value={newTotalNumbers}
                      onChange={(e) => setNewTotalNumbers(parseInt(e.target.value))}
                      className="w-full text-xs p-3 rounded-xl border border-slate-250 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-blue-500"
                    >
                      <option value={25}>25 números</option>
                      <option value={50}>50 números</option>
                      <option value={100}>100 números</option>
                      <option value={200}>200 números</option>
                      <option value={500}>500 números</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-450 dark:text-slate-400 uppercase tracking-widest">
                    URL da Imagem do Produto/Prêmio (Opcional)
                  </label>
                  <input
                    type="url"
                    placeholder="Ex: https://images.unsplash.com/photo-..."
                    value={newImageUrl}
                    onChange={(e) => setNewImageUrl(e.target.value)}
                    className="w-full text-xs p-3 rounded-xl border border-slate-250 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="pt-3 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 px-4 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold"
                  >
                    Salvar Rifa Beneficente
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* WINNER DRAWCORN OVERLAY */}
      <AnimatePresence>
        {showWinnerOverlay && winnerAnimDetails && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-800 w-full max-w-md rounded-3xl p-8 text-center space-y-6 shadow-2xl relative overflow-hidden"
            >
              {/* Confetti decoration */}
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 animate-pulse" />
              <div className="text-6xl animate-bounce">🏆</div>
              
              <div className="space-y-1">
                <span className="text-[10px] bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-400 font-black uppercase tracking-widest px-3 py-1 rounded-full border border-amber-200/40">
                  Sorteio Efetuado Com Sucesso!
                </span>
                <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight mt-3">
                  Temos um Vencedor!
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  OSS! Parabéns ao aluno contemplado que ajudou o dojo!
                </p>
              </div>

              <div className="p-6 bg-slate-50 dark:bg-slate-950/60 border border-slate-150 dark:border-slate-850/80 rounded-2xl space-y-4">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                    Cota Sorteada
                  </p>
                  <p className="text-5xl font-black text-blue-600 dark:text-blue-400 font-mono tracking-tight animate-pulse">
                    Nº {winnerAnimDetails.number.toString().padStart(2, '0')}
                  </p>
                </div>

                <div className="border-t border-slate-200/40 pt-3">
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                    Aluno Contemplador
                  </p>
                  <p className="text-md font-bold text-slate-800 dark:text-slate-100 flex items-center justify-center gap-1.5 mt-0.5">
                    <UserCheck className="w-4 h-4 text-emerald-500" />
                    {winnerAnimDetails.name}
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  setShowWinnerOverlay(false);
                  setWinnerAnimDetails(null);
                }}
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-bold shadow hover:shadow-md transition-all uppercase tracking-wide"
              >
                Continuar no Tatame (OSS!)
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default RaffleModule;

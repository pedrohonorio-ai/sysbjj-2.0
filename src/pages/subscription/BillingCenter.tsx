import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  QrCode, 
  Copy, 
  Check, 
  UploadCloud, 
  FileText, 
  DollarSign, 
  CreditCard, 
  ShieldCheck, 
  Clock, 
  AlertCircle, 
  ArrowLeft,
  ChevronRight,
  Info,
  Calendar,
  Sparkles
} from 'lucide-react';
import { useTranslation } from '../../contexts/LanguageContext.js';
import { useData } from '../../contexts/DataContext.js';
import { enterpriseApi } from '../../services/enterpriseApi.js';
import { useNavigate } from 'react-router-dom';

export const BillingCenter: React.FC = () => {
  const { t } = useTranslation();
  const { payments } = useData();
  const navigate = useNavigate();

  // Basic States
  const [copied, setCopied] = useState<boolean>(false);
  const [sub, setSub] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  
  // Proof upload states
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadSuccess, setUploadSuccess] = useState<boolean>(false);
  const [notes, setNotes] = useState<string>('');
  
  // Standard simulated / configured bills
  const [receipts, setReceipts] = useState<any[]>([
    { id: 'inv-02', date: '21/04/2026', desc: 'Assinatura Mensal - BRONZE', amount: 20, status: 'Pago', method: 'PIX', ref: '04/2026' },
    { id: 'inv-01', date: '21/03/2026', desc: 'Assinatura Mensal - BRONZE', amount: 20, status: 'Pago', method: 'PIX', ref: '03/2026' }
  ]);

  // PIX Credentials Configuration loaded dynamically from master admin setup
  const PIX_KEY = sub?.pixKey || "pedro.honorio@gm.rio";
  const PIX_BENEFICIARY = sub?.pixHolder || "SYSBJJ 2.0 Tecnologia Ltda";
  const PIX_CITY = sub?.pixCity || "Rio de Janeiro";

  // Fetch current subscription
  const fetchSubscription = async () => {
    try {
      setLoading(true);
      const res = await enterpriseApi.fetchWithEnterprise('/api/subscription/current', { useCache: false });
      if (res && res.success) {
        setSub(res.plan || res.subscription);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscription();
    
    // Load local uploaded invoices from localStorage if any
    const saved = localStorage.getItem('sysbjj_m_receipts');
    if (saved) {
      try {
        setReceipts(JSON.parse(saved));
      } catch (err) {}
    }
  }, []);

  // Save localized invoices
  const saveLocalReceipts = (newList: any[]) => {
    setReceipts(newList);
    localStorage.setItem('sysbjj_m_receipts', JSON.stringify(newList));
  };

  const handleCopyKey = () => {
    navigator.clipboard.writeText(PIX_KEY);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Drag and Drop files handlers
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  // Confirm standard receipt submit
  const handleUploadProof = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile && !notes.trim()) return;

    setUploading(true);

    setTimeout(() => {
      // Create invoice record
      const price = Number(sub?.monthlyPrice || 0);
      const planName = String(sub?.plan || 'FREE').replaceAll('_', ' ').toUpperCase();
      
      const newInvoice = {
        id: `inv-${Date.now().toString().slice(-4)}`,
        date: new Date().toLocaleDateString('pt-BR'),
        desc: `Assinatura Mensal - ${planName} (Pendente Homologação)`,
        amount: price,
        status: 'Pendente',
        method: 'PIX',
        ref: `${(new Date().getMonth() + 1).toString().padStart(2, '0')}/${new Date().getFullYear()}`,
        notes: notes
      };

      const newList = [newInvoice, ...receipts];
      saveLocalReceipts(newList);

      setUploading(false);
      setUploadSuccess(true);
      setSelectedFile(null);
      setNotes('');

      setTimeout(() => setUploadSuccess(false), 3500);
    }, 1500);
  };

  const activeInvoice = useMemo(() => {
    const price = Number(sub?.monthlyPrice || 0);
    const planName = String(sub?.plan || 'FREE').replaceAll('_', ' ').toUpperCase();
    
    return {
      planName,
      price,
      dueDate: sub?.nextBillingDate ? new Date(sub.nextBillingDate).toLocaleDateString('pt-BR') : '21/06/2026',
      needsPayment: price > 0
    };
  }, [sub]);

  // Generated dynamic payload for PIX copy-and-paste code (EMV standard with CRC16)
  const pixEconCode = useMemo(() => {
    const key = String(PIX_KEY).trim();
    const holder = String(PIX_BENEFICIARY)
      .trim()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9 ]/g, "")
      .slice(0, 25);
    const city = String(PIX_CITY)
      .trim()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9 ]/g, "")
      .slice(0, 15);
    const price = Number(activeInvoice.price || 0);

    const payloadFormat = "000201";
    const initiationMethod = "010211";

    const gui = "0014br.gov.bcb.pix";
    const keySub = `01${String(key.length).padStart(2, '0')}${key}`;
    const merchantAccount = `${gui}${keySub}`;
    const id26 = `26${String(merchantAccount.length).padStart(2, '0')}${merchantAccount}`;

    const id52 = "52040000";
    const id53 = "5303986";

    const amountStr = Number(price).toFixed(2);
    const id54 = `54${String(amountStr.length).padStart(2, '0')}${amountStr}`;

    const id58 = "5802BR";
    const id59 = `59${String(holder.length).padStart(2, '0')}${holder}`;
    const id60 = `60${String(city.length).padStart(2, '0')}${city}`;
    const id62 = "62070503***";

    const rawPayload = `${payloadFormat}${initiationMethod}${id26}${id52}${id53}${id54}${id58}${id59}${id60}${id62}6304`;

    let crc = 0xFFFF;
    for (let i = 0; i < rawPayload.length; i++) {
      crc ^= (rawPayload.charCodeAt(i) << 8);
      for (let j = 0; j < 8; j++) {
        if ((crc & 0x8000) !== 0) {
          crc = ((crc << 1) ^ 0x1021) & 0xFFFF;
        } else {
          crc = (crc << 1) & 0xFFFF;
        }
      }
    }
    const crcStr = crc.toString(16).toUpperCase().padStart(4, '0');

    return `${rawPayload}${crcStr}`;
  }, [PIX_KEY, PIX_BENEFICIARY, PIX_CITY, activeInvoice.price]);

  return (
    <div className="space-y-8 pb-16 animate-in fade-in duration-500">
      
      {/* Header section */}
      <header className="flex flex-col md:flex-row items-center justify-between gap-6 bg-slate-900 border border-slate-800 p-8 rounded-[2.5rem] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-indigo-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="space-y-2 relative z-10 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-1.5 text-[#00E5FF] leading-none">
            <CreditCard size={14} />
            <span className="text-[9px] font-black uppercase tracking-widest">Billing & Invoices Hub</span>
          </div>
          <h1 className="text-3xl font-black text-white italic uppercase tracking-tighter">
            Central de Faturamento & Pagamentos PIX
          </h1>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-wider max-w-2xl">
            OSS! Visualize faturas, faça o upload de comprovantes de mensalidade SaaS e pague via PIX imediatamente.
          </p>
        </div>

        <button
          onClick={() => navigate('/plans')}
          className="px-5 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all self-center border border-slate-700/50 flex items-center gap-2"
        >
          <ArrowLeft size={12} /> Voltar para Planos
        </button>
      </header>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left column: Active invoice and PIX details */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Active invoice card */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-[2rem] relative overflow-hidden flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-[9px] font-black uppercase tracking-widest bg-amber-500/10 border border-amber-500/20 text-amber-500 px-2.5 py-1 rounded">
                  Fatura em Aberto
                </span>
                <span className="text-[11px] font-mono text-slate-400">Ref: {new Date().getMonth() + 1}/{new Date().getFullYear()}</span>
              </div>

              <div className="flex justify-between items-baseline flex-wrap gap-2">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">Assinatura Mensal - Plano {activeInvoice.planName}</h3>
                  <p className="text-3xl font-black text-white tracking-tighter mt-1 italic uppercase">
                    R$ {activeInvoice.price.toFixed(2)}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Vencimento:</p>
                  <p className="text-sm font-black text-white mt-0.5">{activeInvoice.dueDate}</p>
                </div>
              </div>
            </div>

            {activeInvoice.needsPayment ? (
              <div className="mt-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-[10px] text-amber-300 leading-relaxed flex gap-2.5">
                <AlertCircle size={16} className="text-amber-500 shrink-0 mt-0.5 animate-bounce" />
                <div>
                  <strong>🥋 PENDÊNCIA PIX DETECTADA:</strong> Efetue a leitura do QR Code ou utilize o código Copia e Cola para realizar o repasse Pix correspondente ao valor do seu plano. Após o envio, escaneie e anexe o comprovante na lateral direita para validação master do dōjō.
                </div>
              </div>
            ) : (
              <div className="mt-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-[10px] text-emerald-300 leading-relaxed flex gap-2.5">
                <ShieldCheck size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  Plano Basicamente Grátis (FREE) ativo de R$ 0,00. Nenhuma fatura pendente para o ciclo atual! OSS!
                </div>
              </div>
            )}
          </div>

          {/* PIX Copy & Paste Box */}
          {activeInvoice.needsPayment && (
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-[2rem] space-y-4">
              <div className="flex items-center gap-2 text-xs font-black text-slate-200 uppercase tracking-wider">
                <QrCode size={16} className="text-[#00E5FF]" />
                Instruções de Transferência Pix Manual
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Simulated QR Code SVG */}
                <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl flex flex-col items-center justify-center text-center space-y-2">
                  <div className="bg-white p-3 rounded-xl shadow-lg relative overflow-hidden">
                    {/* Generative QR style SVG */}
                    <svg width="140" height="140" viewBox="0 0 100 100" className="text-slate-950">
                      <rect width="100" height="100" fill="white" />
                      {/* Quiet corners */}
                      <path d="M 0 0 h 25 v 25 h -25 z M 5 5 v 15 h 15 v -15 z M 8 8 h 9 v 9 h -9 z" fill="currentColor" />
                      <path d="M 75 0 h 25 v 25 h -25 z M 80 5 v 15 h 15 v -15 z M 83 8 h 9 v 9 h -9 z" fill="currentColor" />
                      <path d="M 0 75 h 25 v 25 h -25 z M 5 80 v 15 h 15 v -15 z M 8 83 h 9 v 9 h -9 z" fill="currentColor" />
                      {/* Random pixels map to emulate PIX dynamic code */}
                      <rect x="35" y="5" width="5" height="10" fill="currentColor" />
                      <rect x="45" y="15" width="10" height="5" fill="currentColor" />
                      <rect x="60" y="5" width="5" height="15" fill="currentColor" />
                      <rect x="35" y="25" width="15" height="5" fill="currentColor" />
                      <rect x="55" y="30" width="25" height="5" fill="currentColor" />
                      <rect x="30" y="45" width="10" height="10" fill="currentColor" />
                      <rect x="45" y="40" width="5" height="15" fill="currentColor" />
                      <rect x="60" y="50" width="20" height="5" fill="currentColor" />
                      <rect x="70" y="35" width="5" height="25" fill="currentColor" />
                      <rect x="10" y="35" width="15" height="5" fill="currentColor" />
                      <rect x="5" y="45" width="5" height="15" fill="currentColor" />
                      <rect x="15" y="55" width="10" height="5" fill="currentColor" />
                      <rect x="85" y="60" width="10" height="15" fill="currentColor" />
                      <rect x="35" y="65" width="25" height="5" fill="currentColor" />
                      <rect x="65" y="70" width="5" height="25" fill="currentColor" />
                      <rect x="35" y="80" width="10" height="10" fill="currentColor" />
                      <rect x="50" y="85" width="15" height="5" fill="currentColor" />
                      <rect x="80" y="80" width="15" height="5" fill="currentColor" />
                      <rect x="85" y="90" width="10" height="5" fill="currentColor" />
                    </svg>
                    {/* Tiny watermark */}
                    <div className="absolute inset-0 m-auto w-10 h-10 bg-slate-900 rounded-lg flex items-center justify-center text-white text-[7px] font-black tracking-tight border border-slate-700 uppercase">
                      BJJ
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Escaneie o QR Code</span>
                </div>

                {/* Account credentials */}
                <div className="space-y-4 flex flex-col justify-between">
                  <div className="space-y-2.5">
                    <div>
                      <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Beneficiário Master:</p>
                      <p className="text-xs font-bold text-white uppercase">{PIX_BENEFICIARY}</p>
                    </div>

                    <div>
                      <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Instituição de Destino:</p>
                      <p className="text-xs font-bold text-white uppercase">PostgreSQL Cloud Banco</p>
                    </div>

                    <div>
                      <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Chave Pix Corrente:</p>
                      <p className="text-xs font-mono font-bold text-white">{PIX_KEY}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <button
                      onClick={handleCopyKey}
                      className="w-full py-2.5 bg-slate-950 hover:bg-slate-900 border border-slate-800 text-white rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-2"
                    >
                      {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} className="text-[#00E5FF]" />}
                      {copied ? 'Chave Pix Copiada!' : 'Copiar Chave Pix'}
                    </button>
                    
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(pixEconCode);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2500);
                      }}
                      className="w-full py-2.5 bg-[#00E5FF]/10 text-[#00E5FF] hover:bg-[#00E5FF]/20 border border-[#00E5FF]/20 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-2"
                    >
                      <Copy size={12} /> Copiar Código Copia/Cola
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Billing historical list */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-[2rem] space-y-4">
            <h3 className="text-xs font-black text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <FileText size={16} className="text-[#00E5FF]" />
              Faturas & Histórico de Cobranças SaaS
            </h3>

            <div className="space-y-2.5">
              {receipts.map((invoice, idx) => (
                <div key={invoice.id || idx} className="p-4 bg-slate-950/50 border border-slate-800/40 rounded-2xl flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl border ${
                      invoice.status === 'Pago' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                    }`}>
                      <FileText size={16} />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white uppercase">{invoice.desc}</h4>
                      <div className="flex items-center gap-3 mt-1 text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                        <span className="flex items-center gap-1"><Calendar size={10} /> {invoice.date}</span>
                        <span>Cod: {invoice.id}</span>
                        <span>Mês: {invoice.ref}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right flex items-center gap-4">
                    <div>
                      <p className="text-xs font-black text-white">R$ {invoice.amount.toFixed(2)}</p>
                      <p className="text-[9px] font-bold text-slate-500 uppercase">{invoice.method}</p>
                    </div>
                    <span className={`text-[8px] font-black uppercase px-2.5 py-0.5 rounded border ${
                      invoice.status === 'Pago' ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400' : 'bg-amber-500/10 border-amber-500/25 text-amber-400'
                    }`}>
                      {invoice.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right column: Attachment file upload tool */}
        <div className="lg:col-span-5">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-[2rem] space-y-6 sticky top-6">
            <div className="space-y-1">
              <h3 className="text-xs font-black text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <UploadCloud size={16} className="text-[#00E5FF]" />
                Comprovar Pagamento Manual Pix
              </h3>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Submeta o recibo Pix correspondente ao seu Dojo</p>
            </div>

            <form onSubmit={handleUploadProof} className="space-y-4">
              {/* Drag and Drop Box */}
              <div
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                  selectedFile 
                    ? 'border-emerald-500/50 bg-emerald-950/10 text-emerald-300' 
                    : 'border-slate-800 hover:border-slate-700 bg-slate-950/20 text-slate-400'
                }`}
              >
                <input
                  type="file"
                  id="receipt-file"
                  accept="image/*,application/pdf"
                  className="hidden"
                  onChange={handleFileChange}
                />
                
                <label htmlFor="receipt-file" className="block cursor-pointer space-y-3">
                  <UploadCloud size={32} className={`mx-auto ${selectedFile ? 'text-emerald-400' : 'text-slate-500'}`} />
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-white">
                      {selectedFile ? 'Arquivo Carregado' : 'Carregar Comprovante Pix'}
                    </p>
                    <p className="text-[9px] text-slate-500 mt-0.5 uppercase tracking-wide leading-relaxed">
                      {selectedFile ? selectedFile.name : 'Clique para navegar ou Arraste o arquivo PDF/Imagem aqui'}
                    </p>
                  </div>
                </label>
              </div>

              {/* Observation box */}
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">Observações do Fechamento (Opcional):</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Sensei, anote observações adicionais aqui..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-indigo-600 font-sans"
                  rows={3}
                />
              </div>

              <button
                type="submit"
                disabled={uploading || (!selectedFile && !notes.trim())}
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:hover:scale-100 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
              >
                {uploading ? (
                  <>
                    <Clock className="animate-spin" size={12} />
                    Processando Comprovante...
                  </>
                ) : (
                  <>
                    Homologar Recibo Pix <Sparkles size={12} />
                  </>
                )}
              </button>
            </form>

            {/* Success Notification Proof */}
            <AnimatePresence>
              {uploadSuccess && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="p-4 bg-emerald-950 border border-emerald-500/30 text-emerald-400 rounded-2xl text-[10px] leading-relaxed flex items-start gap-2.5"
                >
                  <ShieldCheck size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <strong>COMPROVANTE ENVIADO COM SUCESSO!</strong> O ticket foi salvo e enviado para validação pelo Sensei Master <strong>pedro.honorio@gm.rio</strong>. A liberação ocorre no dōjō em instantes após homologação.
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="p-4 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl text-[9px] text-indigo-300 leading-relaxed flex gap-2">
              <Info size={14} className="text-indigo-400 shrink-0" />
              <span>
                <strong>Confirmação Manual:</strong> As faturas SaaS via PIX são compensadas manualmente pelo nosso suporte master integrado ao dōjō do Sensei. Qualquer dúvida entre em contato.
              </span>
            </div>

          </div>
        </div>

      </div>

    </div>
  );
};

export default BillingCenter;

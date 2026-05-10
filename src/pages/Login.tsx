
import React, { useState, useEffect } from 'react';
import { Shield, Lock, User, Key, ArrowRight, Instagram, Mail, Fingerprint, History, ShieldCheck, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from '../contexts/LanguageContext';
import { useProfile } from '../contexts/ProfileContext';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../context/AuthContext';

const Login: React.FC = () => {
  const { t } = useTranslation();
  const { profile } = useProfile();
  const { logAction, addLedgerEntry } = useData();
  const { login, register, loginAnonymous, resetPassword, updatePassword, isRecovering, setStudentAuth, isConfigured } = useAuth();
  const [activeTab, setActiveTab ] = useState<'admin' | 'student'>('admin');
  const [mode, setMode] = useState<'login' | 'register' | 'forgot' | 'update_pass'>('login');
  
  // Form States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [name, setName] = useState('');
  const [studentCodeInput, setStudentCodeInput] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (isRecovering) {
      setMode('update_pass');
    }
  }, [isRecovering]);

  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);
  
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedDate = currentTime.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });

  const formattedTime = currentTime.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (mode === 'login') {
        const { error } = await login(email, password);
        if (error) throw error;
      } else if (mode === 'register') {
        if (!name) throw new Error('Nome é obrigatório');
        if (password.length < 6) {
          setError('A senha deve ter pelo menos 6 caracteres');
          setLoading(false);
          return;
        }
        
        const { data, error } = await register(email, password, name);
        if (error) throw error;
        
        // Blockchain audit registration
        addLedgerEntry({
          type: 'StatusChange',
          amount: 0,
          description: `Novo Nó de Usuário Registrado: ${email}`,
          category: 'Security',
          method: 'Blockchain-Sync'
        });
        
        logAction('Novo Usuário', `Conta criada para ${email}`, 'Security');
      } else if (mode === 'forgot') {
        await resetPassword(email);
        setSuccess('E-mail de recuperação enviado!');
        setTimeout(() => setMode('login'), 3000);
      } else if (mode === 'update_pass') {
        if (newPassword.length < 6) throw new Error('A nova senha deve ter pelo menos 6 caracteres');
        await updatePassword(newPassword);
        setSuccess('Senha Master atualizada com sucesso!');
        setTimeout(() => setMode('login'), 3000);
      }
    } catch (err: any) {
      console.error(err);
      const errorMessage = err.message || '';
      const errorCode = err.code || '';
      
      if (errorMessage.includes('Invalid login credentials') || errorCode === 'invalid_credentials') {
        setError('E-mail ou senha incorretos. Verifique suas credenciais.');
      } else if (errorMessage.includes('User already registered') || errorCode === 'user_already_exists' || (err.status === 400 && errorMessage.toLowerCase().includes('already registered'))) {
        setError('Este e-mail já está cadastrado no sistema. Por favor, faça login.');
        setMode('login');
      } else if (errorMessage.toLowerCase().includes('email not confirmed')) {
        setError('E-mail ainda não confirmado. Verifique sua caixa de entrada.');
      } else if (errorMessage.toLowerCase().includes('email rate limit exceeded')) {
        setError('O limite de e-mails do Supabase foi atingido (Plano Free: 3/hora).');
        setCooldown(60);
      } else if (errorMessage.includes('after 50 seconds') || errorMessage.includes('too many requests')) {
        setError('Acesso bloqueado temporariamente por excesso de tentativas. Aguarde 60 segundos.');
        setCooldown(60);
      } else {
        setError(errorMessage || 'Erro na autenticação');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    setLoading(true);
    setError('');
    try {
      await loginAnonymous();
      // AuthProvider handles navigation via state change
    } catch (err: any) {
      console.error('Guest Login Error:', err);
      setError('Falha ao iniciar acesso como convidado. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleStudentLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (studentCodeInput.length >= 4) {
      setStudentAuth(studentCodeInput);
    } else {
      setError(t('login.studentNotFound'));
      setTimeout(() => setError(''), 3000);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Real-time Clock & Date */}
      <div className="absolute top-8 right-8 z-50 text-right hidden sm:block">
        <div className="text-4xl font-black text-white tracking-tighter font-mono">
          {formattedTime}
        </div>
        <div className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em] mt-1">
          {formattedDate}
        </div>
      </div>

      {/* Background Decor - Blockchain Mesh Theme */}
      <div className="absolute top-0 left-0 w-full h-full opacity-30 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/20 rounded-full blur-[150px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-600/20 rounded-full blur-[150px]" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md z-10"
      >
        <div className="bg-slate-900/40 backdrop-blur-3xl border border-white/10 rounded-[3rem] p-10 shadow-2xl relative overflow-hidden">
          {/* Subtle Blockchain Line */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-50" />
          
          {!isConfigured && activeTab === 'admin' && (
            <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
              <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest text-center leading-relaxed">
                Supabase não configurado. Adicione VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no menu de configurações do AI Studio.
              </p>
            </div>
          )}

          <div className="flex flex-col items-center mb-8">
            <motion.div 
              whileHover={{ rotate: 5, scale: 1.05 }}
              className="relative mb-6"
            >
              {profile.logoUrl ? (
                <img src={profile.logoUrl} alt="Logo" className="w-24 h-24 object-contain shadow-2xl" />
              ) : (
                <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl flex items-center justify-center text-white text-4xl font-black shadow-2xl border border-white/20">
                  {profile.academyName?.[0] || 'S'}
                </div>
              )}
              <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-slate-950 rounded-full flex items-center justify-center border border-white/10 text-blue-500 shadow-lg">
                <Fingerprint size={16} />
              </div>
            </motion.div>
            <h1 className="text-3xl font-black text-white uppercase tracking-tighter italic text-center">
              {profile.academyName}
            </h1>
            <div className="flex items-center gap-2 mt-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.4em]">Integrated OS 2.0</p>
            </div>
          </div>

          <div className="flex bg-slate-950/60 p-1.5 rounded-2xl mb-8 border border-white/5">
            <button 
              onClick={() => { setActiveTab('admin'); setMode('login'); }}
              className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 ${activeTab === 'admin' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
            >
              <Shield size={12} /> Sensei
            </button>
            <button 
              onClick={() => setActiveTab('student')}
              className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 ${activeTab === 'student' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
            >
              <User size={12} /> {t('common.students').split(' ')[0]}
            </button>
          </div>

          <AnimatePresence mode="wait">
            {activeTab === 'admin' ? (
              <motion.form 
                key={mode}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                onSubmit={handleAdminLogin}
                className="space-y-5"
              >
                {mode === 'register' && (
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Nome Completo</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                      <input 
                        type="text" 
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="EX: HELIO GRACIE"
                        className="w-full bg-slate-950/80 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white font-bold text-xs uppercase focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">E-mail Corporativo</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <input 
                      type="email" 
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="seu@email.com"
                      className="w-full bg-slate-950/80 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white font-bold text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    />
                  </div>
                </div>

                {mode !== 'forgot' && (
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Senha de Acesso</label>
                    <div className="relative">
                      <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                      <input 
                        type="password" 
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-slate-950/80 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white font-bold text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      />
                    </div>
                    {mode === 'register' && (
                      <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest ml-2">Mínimo 6 caracteres</p>
                    )}
                  </div>
                )}

                {mode === 'update_pass' && (
                  <div className="space-y-4">
                    <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl">
                      <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest text-center leading-relaxed">
                        Crie sua nova Senha Master para retomar o controle do Dojo.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Nova Senha Master</label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                        <input 
                          type="password" 
                          required
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Mínimo 6 caracteres"
                          className="w-full bg-slate-950/80 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white font-bold text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {error && (
                  <div className="space-y-4">
                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-[10px] font-black uppercase text-center leading-relaxed">
                      {error}
                    </div>
                    {error.includes('limite de e-mails') && (
                      <div className="p-5 bg-amber-500/10 border border-amber-500/20 rounded-2xl space-y-4 shadow-xl">
                        <div className="flex items-center gap-3">
                           <div className="p-2 bg-amber-500/20 rounded-xl">
                             <Shield size={16} className="text-amber-500 animate-pulse" />
                           </div>
                           <h3 className="text-xs font-black text-amber-500 uppercase tracking-widest leading-none">Alerta de Sistema Master</h3>
                        </div>
                        
                        <p className="text-[10px] text-slate-300 font-bold uppercase leading-relaxed tracking-wider">
                          O Supabase limita o envio de e-mails no plano gratuito. Para continuar sua evolução sem interrupções, sugerimos:
                        </p>

                        <div className="space-y-3">
                          <button 
                            type="button"
                            onClick={handleGuestLogin}
                            className="w-full bg-amber-500 hover:bg-amber-400 text-black font-black py-3 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 uppercase text-[10px] tracking-widest"
                          >
                            <Users size={14} /> Entrar Agora como Convidado
                          </button>

                          <div className="p-3 bg-black/40 rounded-xl border border-white/5">
                            <p className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">Instruções para Admin:</p>
                            <ol className="text-[8px] text-slate-400 font-bold space-y-1.5 uppercase list-decimal list-inside">
                              <li>Acesse seu painel Supabase.</li>
                              <li>Vá em <span className="text-white">Authentication</span> &gt; <span className="text-white">Email Templates</span>.</li>
                              <li>Desative <span className="text-white">"Confirm Email"</span> para ignorar validações.</li>
                            </ol>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                {success && <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-500 text-[10px] font-black uppercase text-center">{success}</div>}

                <button 
                  type="submit" 
                  disabled={loading || cooldown > 0}
                  className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-black py-4 rounded-2xl transition-all shadow-xl shadow-blue-600/20 flex items-center justify-center gap-3 group uppercase text-xs tracking-widest"
                >
                  {loading ? 'Processando Bloco...' : cooldown > 0 ? `Aguarde ${cooldown}s` : mode === 'login' ? 'Validar Acesso Master' : mode === 'register' ? 'Gerar Novo Nó' : mode === 'forgot' ? 'Resetar Credenciais' : 'Confirmar Nova Senha Master'}
                  {!loading && cooldown === 0 && <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />}
                </button>

                {mode === 'login' && (
                  <button 
                    type="button"
                    onClick={handleGuestLogin}
                    disabled={loading || cooldown > 0}
                    className="w-full bg-white/5 text-white hover:bg-white/10 disabled:opacity-50 font-black py-4 rounded-2xl transition-all shadow-xl flex items-center justify-center gap-3 group uppercase text-xs tracking-widest border border-white/10"
                  >
                    <Users size={18} className="text-blue-500" />
                    {cooldown > 0 ? `Aguarde (${cooldown}s)` : 'Testar como Convidado'}
                  </button>
                )}

                <div className="flex flex-col gap-3 mt-4">
                  {mode === 'login' && (
                    <>
                      <button type="button" onClick={() => setMode('register')} className="text-[9px] font-black text-slate-500 hover:text-blue-500 uppercase tracking-widest transition-colors">Não tem conta? Criar acesso profissional</button>
                      <button type="button" onClick={() => setMode('forgot')} className="text-[9px] font-black text-slate-500 hover:text-blue-500 uppercase tracking-widest transition-colors italic">Esqueceu a senha?</button>
                    </>
                  )}
                  {mode !== 'login' && (
                    <button type="button" onClick={() => setMode('login')} className="text-[9px] font-black text-slate-500 hover:text-blue-500 uppercase tracking-widest transition-colors">Voltar para o Login</button>
                  )}
                </div>
              </motion.form>
            ) : (
              <motion.form 
                key="student-form"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                onSubmit={handleStudentLogin}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3 block pl-2">
                    {t('login.portalCode')}
                  </label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <input 
                      type="text" 
                      value={studentCodeInput}
                      onChange={(e) => setStudentCodeInput(e.target.value.toUpperCase())}
                      placeholder="OSS-XXXX"
                      className="w-full bg-slate-950 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white font-black uppercase tracking-[0.2em] focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:tracking-normal"
                    />
                  </div>
                  <p className="mt-3 text-[8px] text-slate-500 font-medium leading-relaxed px-2">
                    {t('login.portalCodeInfo')}
                  </p>
                </div>
                {error && <p className="text-red-500 text-[10px] font-bold text-center uppercase tracking-wider">{error}</p>}
                <button type="submit" className="w-full bg-slate-800 hover:bg-slate-700 text-white font-black py-4 rounded-2xl transition-all shadow-xl flex items-center justify-center gap-3 group uppercase text-xs tracking-widest">
                   {t('login.enterPortal')}
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>

        <div className="mt-12">
           <div className="flex flex-col items-center gap-6">
              <div className="grid grid-cols-3 gap-8 opacity-20">
                 <Shield className="text-white" size={24} />
                 <Fingerprint className="text-white" size={24} />
                 <History className="text-white" size={24} />
              </div>
              <div className="text-center space-y-4">
                 <div className="flex items-center justify-center gap-2">
                    <ShieldCheck size={16} className="text-blue-500" />
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Protocolo Blockchain SYBJJ Ativo</span>
                 </div>
                 <div className="space-y-1">
                    <p className="text-[9px] font-bold text-slate-600 uppercase tracking-[0.2em]">© 2026 SYBJJ BY CT Pedro Honorio</p>
                    <a href="https://instagram.com/sistemabjj" target="_blank" rel="noopener noreferrer" className="text-[10px] font-black text-slate-500 hover:text-blue-500 transition-colors uppercase tracking-widest flex items-center justify-center gap-2">
                        <Instagram size={12} /> @SISTEMABJJ
                    </a>
                 </div>
              </div>
           </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;

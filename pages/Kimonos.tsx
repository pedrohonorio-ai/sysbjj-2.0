
import React, { useState, useMemo } from 'react';
import { 
  Shirt, 
  Plus, 
  Search, 
  X, 
  Clock, 
  CheckCircle, 
  Package, 
  Truck, 
  DollarSign, 
  MoreVertical,
  Trash2,
  Calendar
} from 'lucide-react';
import { useTranslation } from '../contexts/LanguageContext';
import { useData } from '../contexts/DataContext';
import { KimonoOrder } from '../types';

const Kimonos: React.FC = () => {
  const { t } = useTranslation();
  const { orders, students, addOrder, updateOrder, deleteOrder } = useData();
  const [isAdding, setIsAdding] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [formData, setFormData] = useState({
    studentId: '',
    size: 'A1',
    color: 'Branco',
    type: 'Kimono' as const,
    price: 350,
    paid: false
  });

  const filteredOrders = useMemo(() => {
    return orders.filter(o => 
      o.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.type.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [orders, searchTerm]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const student = students.find(s => s.id === formData.studentId);
    if (!student) return;

    addOrder({
      studentId: student.id,
      studentName: student.name,
      size: formData.size,
      color: formData.color,
      type: formData.type,
      status: 'Pending',
      date: new Date().toISOString().split('T')[0],
      price: formData.price,
      paid: formData.paid
    });
    setIsAdding(false);
  };

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'Pending': return <Clock size={16} className="text-amber-500" />;
      case 'Ordered': return <Package size={16} className="text-blue-500" />;
      case 'Received': return <Truck size={16} className="text-purple-500" />;
      case 'Delivered': return <CheckCircle size={16} className="text-green-500" />;
      default: return null;
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12 w-full animate-in fade-in duration-700">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter uppercase leading-none">{t('kimonos.title')}</h1>
          <p className="text-slate-500 font-medium italic mt-2">{t('kimonos.subtitle')}</p>
        </div>
        <div className="flex gap-4">
          <div className="relative group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              type="text" 
              placeholder={t('common.search')} 
              className="w-full sm:w-80 pl-14 pr-8 py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl focus:outline-none shadow-xl dark:text-white font-medium" 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
            />
          </div>
          <button 
            onClick={() => setIsAdding(true)} 
            className="p-5 bg-blue-600 text-white rounded-[1.4rem] hover:rotate-6 transition-all shadow-2xl"
          >
            <Plus size={24} />
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-[3rem] border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 dark:bg-slate-900/50">
              <tr>
                <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('kimonos.student')}</th>
                <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('kimonos.type')}</th>
                <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('kimonos.size')} / {t('kimonos.color')}</th>
                <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('common.status')}</th>
                <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50">
              {filteredOrders.map(order => (
                <tr key={order.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-all">
                  <td className="px-10 py-6">
                    <p className="font-black text-slate-900 dark:text-white uppercase tracking-tight">{order.studentName}</p>
                    <p className="text-[10px] text-slate-400 font-bold flex items-center gap-1 mt-1"><Calendar size={10}/> {order.date}</p>
                  </td>
                  <td className="px-10 py-6">
                    <span className="bg-slate-100 dark:bg-slate-900 px-3 py-1 rounded-lg text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest border border-slate-200 dark:border-slate-700">
                      {order.type}
                    </span>
                  </td>
                  <td className="px-10 py-6">
                    <p className="font-bold text-slate-900 dark:text-white">{order.size} • {order.color}</p>
                    <p className={`text-[10px] font-black uppercase tracking-widest mt-1 ${order.paid ? 'text-green-500' : 'text-red-500'}`}>
                      {order.paid ? 'PAGO' : 'PENDENTE'} • R$ {order.price}
                    </p>
                  </td>
                  <td className="px-10 py-6">
                    <select 
                      value={order.status}
                      onChange={(e) => updateOrder(order.id, { status: e.target.value as any })}
                      className="bg-transparent text-xs font-black uppercase tracking-widest dark:text-white outline-none cursor-pointer"
                    >
                      <option value="Pending">{t('kimonos.pending')}</option>
                      <option value="Ordered">{t('kimonos.ordered')}</option>
                      <option value="Received">{t('kimonos.received')}</option>
                      <option value="Delivered">{t('kimonos.delivered')}</option>
                    </select>
                  </td>
                  <td className="px-10 py-6 text-right">
                    <button onClick={() => deleteOrder(order.id)} className="p-2 text-slate-300 hover:text-red-600 transition-colors">
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredOrders.length === 0 && (
                <tr><td colSpan={5} className="py-20 text-center text-slate-400 italic uppercase font-bold tracking-widest">{t('kimonos.noOrders')}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isAdding && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[120] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-10 max-w-xl w-full border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 shadow-2xl">
             <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-black dark:text-white uppercase tracking-tighter">{t('kimonos.newOrder')}</h3>
                <button onClick={() => setIsAdding(false)} className="text-slate-400 hover:text-red-500"><X/></button>
             </div>
             <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('kimonos.student')}</label>
                   <select 
                    required
                    value={formData.studentId}
                    onChange={e => setFormData({...formData, studentId: e.target.value})}
                    className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-blue-600 dark:text-white font-bold appearance-none"
                   >
                     <option value="">Selecione um Guerreiro</option>
                     {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                   </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('kimonos.type')}</label>
                      <select 
                        value={formData.type}
                        onChange={e => setFormData({...formData, type: e.target.value as any})}
                        className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl dark:text-white font-bold"
                      >
                        <option value="Kimono">Kimono</option>
                        <option value="Rash Guard">Rash Guard</option>
                        <option value="Faixa">Faixa</option>
                        <option value="Outros">Outros</option>
                      </select>
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('kimonos.size')}</label>
                      <input type="text" value={formData.size} onChange={e => setFormData({...formData, size: e.target.value})} className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl dark:text-white font-bold" />
                   </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('kimonos.color')}</label>
                      <input type="text" value={formData.color} onChange={e => setFormData({...formData, color: e.target.value})} className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl dark:text-white font-bold" />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('kimonos.price')}</label>
                      <input type="number" value={formData.price} onChange={e => setFormData({...formData, price: parseInt(e.target.value)})} className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl dark:text-white font-bold" />
                   </div>
                </div>
                <button type="submit" className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl">
                   REGISTRAR PEDIDO PPH
                </button>
             </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Kimonos;

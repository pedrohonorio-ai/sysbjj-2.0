
import React, { useState } from 'react';
import { ShoppingBag, TrendingUp, DollarSign, Package, Plus, Star, Zap, ShieldCheck, ArrowUpRight, Search, Filter, ShoppingCart, Tag } from 'lucide-react';
import { useTranslation } from '../contexts/LanguageContext';
import { useData } from '../contexts/DataContext';
import { motion, AnimatePresence } from 'motion/react';
import { ExtraRevenueCategory } from '../types';

const BusinessHub: React.FC = () => {
  const { t } = useTranslation();
  const { products, plans, ledger, addProduct, addPlan, addExtraRevenue, orders, updateOrder, deleteOrder, addOrder, students } = useData();
  const [activeTab, setActiveTab] = useState<'shop' | 'plans' | 'orders' | 'reports'>('shop');
  const [searchTerm, setSearchTerm] = useState('');
  const [showQuickSale, setShowQuickSale] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    monthlyRevenue: ledger.filter(e => e.type === 'ExtraRevenue').reduce((acc, e) => acc + e.amount, 0),
    stockCount: products.reduce((acc, p) => acc + (p.stock || 0), 0),
    pendingOrders: orders.filter(o => o.status === 'Pending' || o.status === 'Ordered').length
  };

  return (
    <div className="space-y-8 pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">Business <span className="text-blue-600">Hub</span></h1>
          <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-2">Gestão Comercial, Loja e Receitas Extras</p>
        </div>
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-white/5 overflow-x-auto no-scrollbar">
           <button 
             onClick={() => setActiveTab('shop')}
             className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'shop' ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-md' : 'text-slate-400'}`}
           >
             Loja
           </button>
           <button 
             onClick={() => setActiveTab('orders')}
             className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'orders' ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-md' : 'text-slate-400'}`}
           >
             Encomendas
           </button>
           <button 
             onClick={() => setActiveTab('plans')}
             className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'plans' ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-md' : 'text-slate-400'}`}
           >
             Planos
           </button>
           <button 
             onClick={() => setActiveTab('reports')}
             className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'reports' ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-md' : 'text-slate-400'}`}
           >
             Relatórios
           </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-8 bg-blue-600 rounded-[2.5rem] text-white shadow-xl shadow-blue-600/20 relative overflow-hidden">
          <div className="absolute -right-4 -bottom-4 opacity-10"><TrendingUp size={120} /></div>
          <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-1">Receita Mensal Loja</p>
          <h2 className="text-3xl font-black italic">R$ {stats.monthlyRevenue.toLocaleString()}</h2>
          <div className="mt-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest bg-white/10 w-fit px-3 py-1 rounded-lg">
             <ArrowUpRight size={14} />
             Volume Saudável
          </div>
        </div>
        <div className="p-8 bg-slate-900 rounded-[2.5rem] text-white shadow-xl shadow-slate-900/20 relative overflow-hidden text-right md:text-left">
          <div className="absolute -left-4 -bottom-4 opacity-10"><Package size={120} /></div>
          <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-1">Itens em Estoque</p>
          <h2 className="text-3xl font-black italic">{stats.stockCount} UND</h2>
          <div className="mt-4 flex md:inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest bg-white/10 px-3 py-1 rounded-lg text-emerald-400">
             <ShieldCheck size={14} />
             Auditoria OK
          </div>
        </div>
        <div className="p-8 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-white/5 shadow-xl relative overflow-hidden group">
          <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity"><Zap size={120} /></div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Encomendas Pendentes</p>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white italic">{stats.pendingOrders}</h2>
          <button 
            onClick={() => setActiveTab('orders')}
            className="mt-4 flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400 group-hover:gap-3 transition-all"
          >
             Gerenciar Pedidos <ArrowUpRight size={14} />
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'shop' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
               <div className="relative flex-1 max-w-md">
                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                 <input 
                   type="text"
                   placeholder="Buscar produtos..."
                   value={searchTerm}
                   onChange={(e) => setSearchTerm(e.target.value)}
                   className="w-full pl-12 pr-6 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-2xl focus:ring-4 focus:ring-blue-500/10 transition-all font-bold text-sm"
                 />
               </div>
               <button 
                 onClick={() => {
                   const name = prompt('Nome do Produto:');
                   const price = parseFloat(prompt('Preço (R$):') || '0');
                   if (name && price) {
                     addProduct({ name, price, category: ExtraRevenueCategory.PRODUCT, stock: 10 });
                   }
                 }}
                 className="px-8 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center gap-3 hover:scale-105 transition-all shadow-xl"
               >
                 <Plus size={18} />
                 Adicionar Produto
               </button>
            </div>

            {filteredProducts.length === 0 ? (
               <div className="py-32 text-center bg-white dark:bg-slate-900 rounded-[3rem] border-2 border-dashed border-slate-200 dark:border-white/5">
                 <ShoppingCart size={48} className="text-slate-200 mx-auto mb-6" />
                 <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Nenhum Produto Cadastrado</h3>
                 <p className="mt-2 text-slate-400 max-w-xs mx-auto text-sm">Comece adicionando kimonos, suplementos ou acessórios para sua loja.</p>
               </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {filteredProducts.map(product => (
                  <motion.div 
                    layout
                    key={product.id} 
                    className="group bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-200 dark:border-white/5 shadow-xl hover:border-blue-500/50 transition-all"
                  >
                    <div className="w-full aspect-square bg-slate-50 dark:bg-white/5 rounded-3xl mb-6 flex items-center justify-center relative overflow-hidden">
                       <Tag size={40} className="text-slate-200 group-hover:scale-110 transition-transform" />
                       <div className={`absolute top-4 right-4 px-3 py-1 text-white text-[8px] font-black uppercase tracking-widest rounded-lg ${product.stock && product.stock > 0 ? 'bg-emerald-500' : 'bg-rose-500'}`}>
                         {product.stock && product.stock > 0 ? `Estoque: ${product.stock}` : 'Esgotado'}
                       </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest">{product.category}</p>
                      <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight truncate">{product.name}</h3>
                      <div className="flex items-center justify-between pt-4">
                        <span className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">R$ {product.price.toLocaleString()}</span>
                        <button 
                          onClick={() => {
                            setSelectedProduct(product);
                            setShowQuickSale(true);
                          }}
                          className="w-10 h-10 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all shadow-lg"
                        >
                          <Plus size={20} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'orders' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
          >
             <div className="flex justify-end">
                <button 
                  onClick={() => {
                    const studentId = prompt('ID do Aluno (ou nome):');
                    if(studentId) {
                       addOrder({
                          studentId,
                          studentName: studentId,
                          type: 'Kimono',
                          size: 'A2',
                          color: 'Branco',
                          status: 'Pending',
                          date: new Date().toISOString().split('T')[0],
                          price: 450,
                          paid: false
                       });
                    }
                  }}
                  className="px-8 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center gap-3 hover:scale-105 transition-all shadow-xl"
                >
                  <Plus size={18} />
                  Nova Encomenda
                </button>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {orders.length === 0 ? (
                  <div className="col-span-full py-32 text-center bg-white dark:bg-slate-900 rounded-[3rem] border-2 border-dashed border-slate-200 dark:border-white/5">
                    <Package size={48} className="text-slate-200 mx-auto mb-6" />
                    <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Sem Encomendas Ativas</h3>
                    <p className="mt-2 text-slate-400 max-w-xs mx-auto text-sm">Gerencie pedidos de kimonos e equipamentos aqui.</p>
                  </div>
                ) : (
                  orders.map(order => (
                    <div key={order.id} className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-white/5 shadow-xl relative overflow-hidden border-l-4 border-l-blue-600">
                       <div className="flex justify-between items-start mb-6">
                          <div>
                             <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">{order.type}</p>
                             <h4 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">{order.studentName}</h4>
                          </div>
                          <span className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest ${
                            order.status === 'Delivered' ? 'bg-emerald-100 text-emerald-600' : 
                            order.status === 'Pending' ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'
                          }`}>
                            {order.status}
                          </span>
                       </div>
                       
                       <div className="grid grid-cols-2 gap-4 mb-8">
                          <div className="p-3 bg-slate-50 dark:bg-white/5 rounded-xl">
                             <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Tamanho</p>
                             <p className="text-sm font-black text-slate-900 dark:text-white">{order.size}</p>
                          </div>
                          <div className="p-3 bg-slate-50 dark:bg-white/5 rounded-xl">
                             <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Cor</p>
                             <p className="text-sm font-black text-slate-900 dark:text-white">{order.color}</p>
                          </div>
                       </div>

                       <div className="flex items-center justify-between pt-6 border-t border-slate-100 dark:border-white/5">
                          <div>
                             <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Valor</p>
                             <p className="text-lg font-black text-slate-900 dark:text-white italic">R$ {order.price.toLocaleString()}</p>
                          </div>
                          <div className="flex gap-2">
                             {order.status === 'Pending' && (
                               <button 
                                 onClick={() => updateOrder(order.id, { status: 'Ordered' })}
                                 className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center shadow-lg"
                               >
                                 <ShoppingCart size={18} />
                               </button>
                             )}
                             {order.status === 'Ordered' && (
                               <button 
                                 onClick={() => updateOrder(order.id, { status: 'Received' })}
                                 className="w-10 h-10 bg-amber-600 text-white rounded-xl flex items-center justify-center shadow-lg"
                               >
                                 <Plus size={18} />
                               </button>
                             )}
                             {order.status === 'Received' && (
                               <button 
                                 onClick={() => {
                                   updateOrder(order.id, { status: 'Delivered', paid: true });
                                   addExtraRevenue({
                                      description: `Entrega: ${order.type} (${order.size})`,
                                      amount: order.price,
                                      date: new Date().toISOString().split('T')[0],
                                      category: ExtraRevenueCategory.PRODUCT,
                                      paid: true,
                                      paymentMethod: 'Faturado',
                                      studentName: order.studentName
                                   });
                                 }}
                                 className="w-10 h-10 bg-emerald-600 text-white rounded-xl flex items-center justify-center shadow-lg"
                               >
                                 <ShieldCheck size={18} />
                               </button>
                             )}
                          </div>
                       </div>
                    </div>
                  ))
                )}
             </div>
          </motion.div>
        )}

        {activeTab === 'plans' && (
           <motion.div
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             exit={{ opacity: 0, y: -20 }}
             className="space-y-8"
           >
             <div className="flex justify-end">
                <button 
                  onClick={() => {
                    const name = prompt('Nome do Plano:');
                    const price = parseFloat(prompt('Mensalidade (R$):') || '0');
                    if(name && price) {
                      addPlan({ name, price, description: 'Plano de acesso às aulas de Jiu-Jitsu', benefits: ['Aulas Ilimitadas', 'Acesso ao Portal'] });
                    }
                  }}
                  className="px-8 py-4 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center gap-3 hover:scale-105 transition-all shadow-xl shadow-blue-600/20"
                >
                  <Plus size={18} />
                  Criar Novo Plano
                </button>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
               {plans.length === 0 ? (
                  <div className="col-span-full py-32 text-center bg-white dark:bg-slate-900 rounded-[3rem] border-2 border-dashed border-slate-200 dark:border-white/5">
                    <Star size={48} className="text-slate-200 mx-auto mb-6" />
                    <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Sem Planos de Aula</h3>
                    <p className="mt-2 text-slate-400 max-w-xs mx-auto text-sm">Configure seus planos de mensalidade (ex: Mensal, Anual, Kids).</p>
                  </div>
               ) : (
                 plans.map((plan, idx) => (
                   <div key={plan.id} className={`p-10 rounded-[3rem] border relative overflow-hidden transition-all group hover:scale-105 ${idx === 1 ? 'bg-slate-900 text-white border-white/10 shadow-2xl scale-110 z-10' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-white/5 shadow-xl'}`}>
                      {idx === 1 && <div className="absolute top-0 right-0 px-6 py-2 bg-blue-600 text-[10px] font-black uppercase tracking-widest rounded-bl-3xl">Mais Popular</div>}
                      
                      <div className="space-y-8">
                        <div>
                          <h3 className="text-2xl font-black uppercase tracking-tighter">{plan.name}</h3>
                          <div className="flex items-baseline gap-2 mt-4">
                            <span className="text-4xl font-black italic">R$ {plan.price.toLocaleString()}</span>
                            <span className="text-[10px] font-black opacity-50 uppercase tracking-widest">/ mês</span>
                          </div>
                        </div>

                        <ul className="space-y-4">
                          {(plan.benefits || ['Aulas Ilimitadas', 'Acesso VIP', 'Suporte Técnico']).map((benefit, bIdx) => (
                            <li key={bIdx} className="flex items-center gap-3">
                               <div className={`w-5 h-5 rounded-full flex items-center justify-center ${idx === 1 ? 'bg-blue-600' : 'bg-blue-100 dark:bg-blue-900/30'}`}>
                                 <Plus size={10} className={idx === 1 ? 'text-white' : 'text-blue-600'} />
                               </div>
                               <span className="text-xs font-bold opacity-80">{benefit}</span>
                            </li>
                          ))}
                        </ul>

                        <button className={`w-full py-5 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all shadow-xl ${idx === 1 ? 'bg-white text-slate-900 hover:bg-blue-600 hover:text-white' : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-blue-600 hover:text-white'}`}>
                          Assinar Agora
                        </button>
                      </div>
                   </div>
                 ))
               )}
             </div>
           </motion.div>
        )}

        {activeTab === 'reports' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
          >
            <div className="p-12 bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-200 dark:border-white/5 shadow-xl">
               <div className="flex items-center justify-between mb-12">
                 <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter flex items-center gap-3">
                   <TrendingUp size={24} className="text-blue-600" />
                   Fluxo de Caixa - Vendas Extras
                 </h2>
                 <div className="flex gap-2">
                    <button className="px-4 py-2 bg-slate-100 dark:bg-white/5 rounded-xl text-[9px] font-black uppercase tracking-widest">Exportar PDF</button>
                    <button className="px-4 py-2 bg-slate-100 dark:bg-white/5 rounded-xl text-[9px] font-black uppercase tracking-widest">Excel</button>
                 </div>
               </div>

               <div className="space-y-4">
                 {ledger.filter(e => e.type === 'ExtraRevenue').length === 0 ? (
                   <p className="text-center py-20 text-slate-400 font-bold uppercase tracking-widest text-[10px]">Nenhuma venda extra registrada recentemente.</p>
                 ) : (
                   ledger.filter(e => e.type === 'ExtraRevenue').map(entry => (
                     <div key={entry.id} className="flex items-center justify-between p-6 bg-slate-50 dark:bg-white/5 rounded-2xl border border-transparent hover:border-blue-500/20 transition-all">
                       <div className="flex items-center gap-6">
                         <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center font-black">
                           {entry.description[0]}
                         </div>
                         <div>
                            <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">{entry.description}</h4>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{new Date(entry.timestamp).toLocaleDateString()}</p>
                         </div>
                       </div>
                       <div className="text-right">
                          <p className="text-lg font-black text-slate-900 dark:text-white italic">R$ {entry.amount.toLocaleString()}</p>
                          <span className="text-[8px] font-black text-emerald-500 uppercase tracking-[0.2em]">Liquidado</span>
                       </div>
                     </div>
                   ))
                 )}
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick Sale Modal */}
      <AnimatePresence>
        {showQuickSale && selectedProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowQuickSale(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-[3rem] shadow-2xl border border-slate-200 dark:border-white/5 p-8 overflow-hidden"
            >
               <div className="absolute top-0 right-0 p-8 opacity-5"><ShoppingCart size={120} /></div>
               
               <header className="mb-8">
                 <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1 italic">Checkout Rápido</p>
                 <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Finalizar <span className="text-blue-600">Venda</span></h2>
               </header>

               <div className="flex items-center gap-6 p-6 bg-slate-50 dark:bg-white/5 rounded-3xl mb-8">
                  <div className="w-20 h-20 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center border border-slate-100 dark:border-white/5">
                     <Tag size={32} className="text-blue-600" />
                  </div>
                  <div>
                     <h4 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">{selectedProduct.name}</h4>
                     <p className="text-2xl font-black text-slate-900 dark:text-white italic mt-1">R$ {selectedProduct.price.toLocaleString()}</p>
                  </div>
               </div>

               <div className="space-y-6">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Selecionar Aluno</label>
                    <select 
                      className="w-full bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 p-4 rounded-2xl font-bold appearance-none outline-none focus:border-blue-500/50"
                      onChange={(e) => {
                        const s = students.find(stu => stu.id === e.target.value);
                        if (s) {
                          addExtraRevenue({
                            description: `Venda: ${selectedProduct.name}`,
                            amount: selectedProduct.price,
                            date: new Date().toISOString().split('T')[0],
                            category: ExtraRevenueCategory.PRODUCT,
                            paid: true,
                            paymentMethod: 'Venda Balcão',
                            studentId: s.id,
                            studentName: s.name
                          });
                          setShowQuickSale(false);
                          alert(`${selectedProduct.name} vendido para ${s.name}!`);
                        }
                      }}
                    >
                      <option value="">Selecione o Comprador...</option>
                      {students.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-4 py-4 px-6 bg-blue-100 dark:bg-blue-900/30 rounded-2xl border border-blue-200 dark:border-blue-800/50">
                     <ShieldCheck size={20} className="text-blue-600 dark:text-blue-400" />
                     <p className="text-[10px] font-black text-blue-800 dark:text-blue-200 uppercase tracking-tight leading-relaxed">
                       A transação será registrada instantaneamente no ledger financeiro da academia.
                     </p>
                  </div>

                  <button 
                    onClick={() => setShowQuickSale(false)}
                    className="w-full py-5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl hover:scale-105 transition-all"
                  >
                    Cancelar Operação
                  </button>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BusinessHub;

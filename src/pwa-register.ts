import { Workbox } from 'workbox-window';

export function registerServiceWorker() {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator && import.meta.env.PROD) {
    const wb = new Workbox('/sw');
    
    wb.addEventListener('installed', (event) => {
      if (event.isUpdate) {
        console.log('🥋 [PWA] Nova versão disponível. Atualize a página.');
        // Mostrar toast de atualização no tatame
        const updateToast = document.createElement('div');
        updateToast.textContent = '🔄 Nova versão disponível! Clique para atualizar.';
        updateToast.style.cssText = 'position:fixed;bottom:20px;right:20px;background:#e94560;color:white;padding:12px 20px;border-radius:8px;cursor:pointer;z-index:9999;box-shadow: 0 4px 12px rgba(0,0,0,0.3);font-family:sans-serif;font-weight:bold;animation: fade-in 0.3s ease;';
        updateToast.onclick = () => location.reload();
        document.body.appendChild(updateToast);
      } else {
        console.log('🥋 [PWA] Service Worker instalado com sucesso!');
      }
    });
    
    wb.addEventListener('waiting', () => {
      console.log('🥋 [PWA] Nova versão aguardando ativação.');
    });
    
    wb.register().catch(err => {
      console.warn('🥋 [PWA] Erro ao registrar Service Worker:', err);
    });
  } else if (import.meta.env.DEV) {
    console.log('🥋 [PWA] Service Worker desativado no ambiente de desenvolvimento.');
  }
}


/**
 * 🥋 SYSBJJ 2.0 - PERFORMANCE GUARDIAN
 * Real-time frontend diagnostics tool to shield SaaS and detect heavy operations.
 * Monitors: Slow response times, API loops, duplicate requests, flood states, infinite retries.
 */

export interface PerformanceWarning {
  id: string;
  type: 'CRITICAL' | 'WARNING' | 'INFO';
  message: string;
  timestamp: number;
  metric?: string;
  value?: string | number;
}

class PerformanceGuardian {
  private static instance: PerformanceGuardian;
  private warnings: PerformanceWarning[] = [];
  private requestLog: Array<{ url: string; timestamp: number; durationMs: number }> = [];
  private renderCounts: Record<string, number> = {};

  private constructor() {
    // Escuta global para garantir monitoramento transparente
    if (typeof window !== 'undefined') {
      (window as any).__PerformanceGuardian = this;
    }
  }

  public static getInstance(): PerformanceGuardian {
    if (!PerformanceGuardian.instance) {
      PerformanceGuardian.instance = new PerformanceGuardian();
    }
    return PerformanceGuardian.instance;
  }

  /**
   * Monitor individual API request performance
   */
  public recordRequest(url: string, durationMs: number, retryCount = 0): void {
    const now = Date.now();
    this.requestLog.push({ url, timestamp: now, durationMs });

    // Clean old logs (older than 3 minutes)
    this.requestLog = this.requestLog.filter(req => now - req.timestamp < 3 * 60 * 1000);

    // 🔴 1. Slow Query / Request Detection (> 500ms)
    if (durationMs > 500) {
      this.addWarning({
        id: `slow-${now}-${Math.random()}`,
        type: 'WARNING',
        message: `Servidor demorou ${durationMs}ms para responder à requisição: ${url.split('?')[0]}.`,
        timestamp: now,
        metric: 'Latência alta',
        value: `${durationMs}ms`
      });
    }

    // 🟠 2. Duplicate fetch detection (same endpoint twice in 2 seconds)
    const recentSameEndpoints = this.requestLog.filter(
      req => req.url === url && now - req.timestamp < 2000
    );
    if (recentSameEndpoints.length >= 2) {
      this.addWarning({
        id: `dup-${now}-${Math.random()}`,
        type: 'WARNING',
        message: `Requisições duplicadas detectadas para o endpoint: ${url.split('?')[0]}. Possível vazamento de re-render.`,
        timestamp: now,
        metric: 'Fetch duplicado',
        value: recentSameEndpoints.length
      });
    }

    // 🔴 3. API loop / flood requests (> 15 requests in 5 seconds)
    const requestsLast5Sec = this.requestLog.filter(req => now - req.timestamp < 5000);
    if (requestsLast5Sec.length > 15) {
      this.addWarning({
        id: `flood-${now}-${Math.random()}`,
        type: 'CRITICAL',
        message: `Inundação de requisições detectada! ${requestsLast5Sec.length} chamadas à API nos últimos 5 segundos.`,
        timestamp: now,
        metric: 'Bloqueador Flood',
        value: `${requestsLast5Sec.length} reqs/5s`
      });
    }

    // 🔴 4. Infinite retries
    if (retryCount > 3) {
      this.addWarning({
        id: `retry-${now}-${Math.random()}`,
        type: 'CRITICAL',
        message: `Loop de retentativas infinito ativado para o endpoint: ${url}. Tentativas: ${retryCount}`,
        timestamp: now,
        metric: 'Loop de Retentativa',
        value: retryCount
      });
    }
  }

  /**
   * Monitor React components re-renders
   */
  public recordRender(componentName: string): void {
    const count = (this.renderCounts[componentName] || 0) + 1;
    this.renderCounts[componentName] = count;

    if (count > 30) {
      this.addWarning({
        id: `render-${componentName}-${Date.now()}`,
        type: 'WARNING',
        message: `Múltiplos re-renders no componente ${componentName} (${count} vezes). Recomenda-se usar React.memo ou estabilizar states.`,
        timestamp: Date.now(),
        metric: 'Render Excessivo',
        value: count
      });
      // Throttle/reset counts occasionally
      this.renderCounts[componentName] = 0;
    }
  }

  private addWarning(warning: PerformanceWarning): void {
    // Avoid double warning for exactly the same message in last 5 seconds
    const exists = this.warnings.some(
      w => w.message === warning.message && Date.now() - w.timestamp < 5000
    );
    if (!exists) {
      this.warnings.unshift(warning);
      // Limit to 40 warnings
      if (this.warnings.length > 40) {
        this.warnings.pop();
      }
    }
  }

  public getWarnings(): PerformanceWarning[] {
    return this.warnings;
  }

  public clearWarnings(): void {
    this.warnings = [];
    this.renderCounts = {};
    this.requestLog = [];
  }
}

export const guardian = PerformanceGuardian.getInstance();


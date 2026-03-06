import { Component, computed, inject } from '@angular/core';
import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import { OperationsLiveService, OperationEvent } from '../../../core/services/operations-live.service';

type AlertSeverity = 'critical' | 'warning' | 'info';

interface Alert {
  id: string;
  severity: AlertSeverity;
  title: string;
  description: string;
  icon: string;
  timestamp: string;
  action?: string;
  actionRoute?: string;
}

@Component({
  selector: 'app-alerts',
  standalone: true,
  imports: [CommonModule, DatePipe, DecimalPipe],
  template: `
    <section class="p-4 md:p-6 space-y-6">
      <header class="bg-surface-light dark:bg-surface-dark rounded-2xl border border-border-light dark:border-border-dark p-5 md:p-6">
        <div class="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <p class="text-xs uppercase tracking-widest text-text-sub-light dark:text-text-sub-dark font-semibold">Intelligence</p>
            <h1 class="text-2xl md:text-3xl font-bold text-text-main-light dark:text-text-main-dark">Alerts & Analytics</h1>
            <p class="mt-1 text-sm text-text-sub-light dark:text-text-sub-dark">
              Actionable insights — low stock warnings, expiry alerts, and yield discrepancies.
            </p>
          </div>
          <div class="flex items-center gap-3">
            @if (criticalCount() > 0) {
              <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                {{ criticalCount() }} Critical
              </span>
            }
            @if (warningCount() > 0) {
              <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                {{ warningCount() }} Warning
              </span>
            }
          </div>
        </div>
      </header>

      <!-- Summary Cards -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="bg-surface-light dark:bg-surface-dark rounded-xl border border-border-light dark:border-border-dark p-4">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <span class="material-icons-round text-red-600 dark:text-red-400">warning</span>
            </div>
            <div>
              <p class="text-xs text-text-sub-light dark:text-text-sub-dark">Low Stock Items</p>
              <p class="text-2xl font-bold text-red-600 dark:text-red-400">{{ lowStockCount() }}</p>
            </div>
          </div>
        </div>
        <div class="bg-surface-light dark:bg-surface-dark rounded-xl border border-border-light dark:border-border-dark p-4">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <span class="material-icons-round text-amber-600 dark:text-amber-400">trending_down</span>
            </div>
            <div>
              <p class="text-xs text-text-sub-light dark:text-text-sub-dark">Yield Discrepancies</p>
              <p class="text-2xl font-bold text-amber-600 dark:text-amber-400">{{ yieldDiscrepancyCount() }}</p>
            </div>
          </div>
        </div>
        <div class="bg-surface-light dark:bg-surface-dark rounded-xl border border-border-light dark:border-border-dark p-4">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <span class="material-icons-round text-green-600 dark:text-green-400">check_circle</span>
            </div>
            <div>
              <p class="text-xs text-text-sub-light dark:text-text-sub-dark">Total Wastage</p>
              <p class="text-2xl font-bold text-text-main-light dark:text-text-main-dark">{{ totalWastage() | number:'1.0-1' }} kg</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Alerts Feed -->
      <div class="bg-surface-light dark:bg-surface-dark rounded-xl border border-border-light dark:border-border-dark overflow-hidden">
        <div class="px-4 py-3 border-b border-border-light dark:border-border-dark">
          <h3 class="font-semibold text-text-main-light dark:text-text-main-dark">Active Alerts</h3>
        </div>
        <div class="divide-y divide-border-light dark:divide-border-dark">
          @if (alerts().length === 0) {
            <div class="px-4 py-12 text-center">
              <span class="material-icons-round text-5xl text-green-300 dark:text-green-700">verified</span>
              <p class="mt-3 font-medium text-text-main-light dark:text-text-main-dark">All clear!</p>
              <p class="text-sm text-text-sub-light dark:text-text-sub-dark">No active alerts — everything is running smoothly.</p>
            </div>
          }
          @for (alert of alerts(); track alert.id) {
            <div class="px-4 py-3 flex items-start gap-3 hover:bg-gray-50 transition-colors">
              <div class="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                   [ngClass]="{
                     'bg-red-100': alert.severity === 'critical',
                     'bg-amber-100': alert.severity === 'warning',
                     'bg-blue-100': alert.severity === 'info'
                   }">
                <span class="material-icons-round text-lg"
                      [ngClass]="{
                        'text-red-600': alert.severity === 'critical',
                        'text-amber-600': alert.severity === 'warning',
                        'text-blue-600': alert.severity === 'info'
                      }">
                  {{ alert.icon }}
                </span>
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2">
                  <span class="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
                        [ngClass]="{
                          'bg-red-100 text-red-700': alert.severity === 'critical',
                          'bg-amber-100 text-amber-700': alert.severity === 'warning',
                          'bg-blue-100 text-blue-700': alert.severity === 'info'
                        }">
                    {{ alert.severity }}
                  </span>
                  <span class="text-[10px] text-text-sub-light dark:text-text-sub-dark">{{ alert.timestamp | date:'medium' }}</span>
                </div>
                <p class="font-medium text-sm text-text-main-light dark:text-text-main-dark mt-1">{{ alert.title }}</p>
                <p class="text-xs text-text-sub-light dark:text-text-sub-dark mt-0.5">{{ alert.description }}</p>
              </div>
            </div>
          }
        </div>
      </div>

      <!-- Yield Discrepancy Table -->
      @if (yieldEvents().length > 0) {
        <div class="bg-surface-light dark:bg-surface-dark rounded-xl border border-border-light dark:border-border-dark overflow-hidden">
          <div class="px-4 py-3 border-b border-border-light dark:border-border-dark">
            <h3 class="font-semibold text-text-main-light dark:text-text-main-dark">Yield Discrepancies (Production)</h3>
            <p class="text-xs text-text-sub-light dark:text-text-sub-dark mt-0.5">Batches where actual output was lower than expected yield.</p>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="bg-gray-50 dark:bg-gray-800/50">
                  <th class="text-left px-4 py-2 text-xs font-semibold text-text-sub-light dark:text-text-sub-dark">Batch</th>
                  <th class="text-left px-4 py-2 text-xs font-semibold text-text-sub-light dark:text-text-sub-dark">Worker</th>
                  <th class="text-right px-4 py-2 text-xs font-semibold text-text-sub-light dark:text-text-sub-dark">Expected</th>
                  <th class="text-right px-4 py-2 text-xs font-semibold text-text-sub-light dark:text-text-sub-dark">Actual</th>
                  <th class="text-right px-4 py-2 text-xs font-semibold text-text-sub-light dark:text-text-sub-dark">Loss</th>
                  <th class="text-left px-4 py-2 text-xs font-semibold text-text-sub-light dark:text-text-sub-dark">Date</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-border-light dark:divide-border-dark">
                @for (ev of yieldEvents(); track ev.id) {
                  <tr class="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td class="px-4 py-2.5 font-medium text-text-main-light dark:text-text-main-dark">{{ ev.batchCode }}</td>
                    <td class="px-4 py-2.5 text-text-sub-light dark:text-text-sub-dark">{{ ev.workerName }}</td>
                    <td class="px-4 py-2.5 text-right text-text-main-light dark:text-text-main-dark">{{ getPayloadNum(ev, 'expectedYieldKg') | number:'1.0-1' }} kg</td>
                    <td class="px-4 py-2.5 text-right text-text-main-light dark:text-text-main-dark">{{ getPayloadNum(ev, 'actualOutputKg') | number:'1.0-1' }} kg</td>
                    <td class="px-4 py-2.5 text-right font-semibold text-red-600 dark:text-red-400">
                      {{ getPayloadNum(ev, 'wastageKg') | number:'1.0-1' }} kg
                    </td>
                    <td class="px-4 py-2.5 text-text-sub-light dark:text-text-sub-dark">{{ ev.createdAt | date:'shortDate' }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }
    </section>
  `,
})
export class AlertsComponent {
  private readonly operations = inject(OperationsLiveService);

  readonly lowStockCount = computed(() => this.operations.lowStockSkus().length);
  readonly totalWastage = computed(() => this.operations.wastageKg());

  readonly yieldEvents = computed(() => {
    return this.operations.events()
      .filter(e => {
        if (e.module !== 'production') return false;
        const expected = this.parseNum(e.payload?.['expectedYieldKg']);
        const actual = this.parseNum(e.payload?.['actualOutputKg']);
        return expected > 0 && actual < expected;
      })
      .slice(0, 20);
  });

  readonly yieldDiscrepancyCount = computed(() => this.yieldEvents().length);

  readonly criticalCount = computed(() => this.alerts().filter(a => a.severity === 'critical').length);
  readonly warningCount = computed(() => this.alerts().filter(a => a.severity === 'warning').length);

  readonly alerts = computed<Alert[]>(() => {
    const alerts: Alert[] = [];
    const now = new Date().toISOString();

    // Low Stock Alerts
    for (const sku of this.operations.lowStockSkus()) {
      const deficit = sku.reorderPoint - sku.availableUnits;
      const severity: AlertSeverity = sku.availableUnits <= sku.reorderPoint * 0.5 ? 'critical' : 'warning';
      alerts.push({
        id: `low-stock-${sku.skuCode}`,
        severity,
        title: `Low Stock: ${sku.skuName}`,
        description: `Only ${sku.availableUnits} units available (reorder point: ${sku.reorderPoint}). Deficit of ${deficit} units.`,
        icon: 'inventory',
        timestamp: now,
        action: 'Schedule Production',
        actionRoute: '../production',
      });
    }

    // Yield Discrepancy Alerts
    for (const ev of this.yieldEvents().slice(0, 5)) {
      const expected = this.parseNum(ev.payload?.['expectedYieldKg']);
      const actual = this.parseNum(ev.payload?.['actualOutputKg']);
      const lossPercent = expected > 0 ? ((expected - actual) / expected * 100).toFixed(1) : '0';
      alerts.push({
        id: `yield-${ev.id}`,
        severity: parseFloat(lossPercent) > 15 ? 'critical' : 'warning',
        title: `Yield Loss: ${lossPercent}% on batch ${ev.batchCode}`,
        description: `Expected ${expected} kg but only got ${actual} kg. Worker: ${ev.workerName}.`,
        icon: 'trending_down',
        timestamp: ev.createdAt,
      });
    }

    // Sort: critical first, then warning, then info
    const severityOrder = { critical: 0, warning: 1, info: 2 };
    alerts.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

    return alerts;
  });

  getPayloadNum(event: OperationEvent, key: string): number {
    return this.parseNum(event.payload?.[key]);
  }

  private parseNum(value: string | number | boolean | null | undefined): number {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const n = Number(value);
      return Number.isFinite(n) ? n : 0;
    }
    return 0;
  }
}

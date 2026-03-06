import { Component, computed, inject } from '@angular/core';
import { CommonModule, DatePipe, TitleCasePipe } from '@angular/common';
import { OperationsLiveService, OperationEvent } from '../../../core/services/operations-live.service';

interface KanbanColumn {
    id: string;
    title: string;
    module: string;
    icon: string;
    color: string;
    bgColor: string;
    events: OperationEvent[];
}

@Component({
    selector: 'app-kanban',
    standalone: true,
    imports: [CommonModule, DatePipe, TitleCasePipe],
    template: `
    <section class="p-4 md:p-6 space-y-6">
      <header class="bg-surface-light dark:bg-surface-dark rounded-2xl border border-border-light dark:border-border-dark p-5 md:p-6">
        <div class="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <p class="text-xs uppercase tracking-widest text-text-sub-light dark:text-text-sub-dark font-semibold">Production Pipeline</p>
            <h1 class="text-2xl md:text-3xl font-bold text-text-main-light dark:text-text-main-dark">Kanban Board</h1>
            <p class="mt-1 text-sm text-text-sub-light dark:text-text-sub-dark">
              Visualize every batch flowing through your production pipeline in real time.
            </p>
          </div>
          <div class="flex items-center gap-3">
            <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
              <span class="w-2 h-2 bg-green-500 rounded-full mr-1.5 animate-pulse"></span>
              Live
            </span>
            <span class="text-sm text-text-sub-light dark:text-text-sub-dark">
              {{ totalEvents() }} total events
            </span>
          </div>
        </div>
      </header>

      <!-- Kanban Columns -->
      <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        @for (column of columns(); track column.id) {
          <div class="bg-surface-light dark:bg-surface-dark rounded-xl border border-border-light dark:border-border-dark flex flex-col">
            <!-- Column Header -->
            <div class="px-4 py-3 border-b border-border-light dark:border-border-dark flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="material-icons-round text-lg" [style.color]="column.color">{{ column.icon }}</span>
                <h3 class="font-semibold text-sm text-text-main-light dark:text-text-main-dark">{{ column.title }}</h3>
              </div>
              <span class="inline-flex items-center justify-center min-w-[24px] h-6 px-1.5 rounded-full text-xs font-bold"
                    [style.backgroundColor]="column.bgColor"
                    [style.color]="column.color">
                {{ column.events.length }}
              </span>
            </div>

            <!-- Column Cards -->
            <div class="flex-1 p-3 space-y-2 max-h-[480px] overflow-y-auto">
              @if (column.events.length === 0) {
                <div class="text-center py-8 text-sm text-text-sub-light dark:text-text-sub-dark">
                  No batches in this stage
                </div>
              }
              @for (event of column.events; track event.id) {
                <div class="p-3 rounded-lg border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark hover:shadow-md transition-shadow cursor-default">
                  <div class="flex items-start justify-between gap-2">
                    <p class="font-medium text-sm text-text-main-light dark:text-text-main-dark line-clamp-1">{{ event.summary }}</p>
                  </div>
                  <div class="mt-2 flex flex-wrap gap-1.5">
                    <span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-gray-100 dark:bg-gray-800 text-text-sub-light dark:text-text-sub-dark">
                      {{ event.batchCode }}
                    </span>
                    <span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
                      {{ event.quantity }} {{ event.unit }}
                    </span>
                  </div>
                  <div class="mt-2 flex items-center justify-between text-[10px] text-text-sub-light dark:text-text-sub-dark">
                    <span>{{ event.workerName }}</span>
                    <span>{{ event.createdAt | date:'shortTime' }}</span>
                  </div>
                </div>
              }
            </div>
          </div>
        }
      </div>

      <!-- Pipeline Summary -->
      <div class="bg-surface-light dark:bg-surface-dark rounded-xl border border-border-light dark:border-border-dark p-4">
        <h3 class="text-sm font-semibold text-text-main-light dark:text-text-main-dark mb-3">Pipeline Flow Summary</h3>
        <div class="flex items-center justify-between gap-2 overflow-x-auto">
          @for (column of columns(); track column.id; let last = $last) {
            <div class="flex-1 min-w-[100px] text-center">
              <div class="text-2xl font-bold" [style.color]="column.color">{{ column.events.length }}</div>
              <div class="text-xs text-text-sub-light dark:text-text-sub-dark mt-0.5">{{ column.title }}</div>
            </div>
            @if (!last) {
              <span class="material-icons-round text-gray-300 dark:text-gray-600 text-xl flex-shrink-0">arrow_forward</span>
            }
          }
        </div>
      </div>
    </section>
  `,
})
export class KanbanComponent {
    private readonly operations = inject(OperationsLiveService);

    readonly totalEvents = computed(() => this.operations.events().length);

    readonly columns = computed<KanbanColumn[]>(() => {
        const events = this.operations.events();

        const grouped = {
            inwarding: events.filter(e => e.module === 'inwarding').slice(0, 20),
            production: events.filter(e => e.module === 'production').slice(0, 20),
            packing: events.filter(e => e.module === 'packing').slice(0, 20),
            dispatch: events.filter(e => e.module === 'dispatch').slice(0, 20),
        };

        return [
            {
                id: 'inwarding',
                title: 'Inwarded',
                module: 'inwarding',
                icon: 'inventory',
                color: '#6366f1',
                bgColor: '#eef2ff',
                events: grouped.inwarding,
            },
            {
                id: 'production',
                title: 'In Production',
                module: 'production',
                icon: 'precision_manufacturing',
                color: '#f59e0b',
                bgColor: '#fffbeb',
                events: grouped.production,
            },
            {
                id: 'packing',
                title: 'Packed',
                module: 'packing',
                icon: 'inventory_2',
                color: '#10b981',
                bgColor: '#ecfdf5',
                events: grouped.packing,
            },
            {
                id: 'dispatch',
                title: 'Dispatched',
                module: 'dispatch',
                icon: 'local_shipping',
                color: '#3b82f6',
                bgColor: '#eff6ff',
                events: grouped.dispatch,
            },
        ];
    });
}

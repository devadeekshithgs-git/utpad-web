import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { SupabaseService } from '../../../core/supabase.service';

interface Batch {
  id: string;
  batch_code: string;
  status: string;
  created_at: string;
  flavor_name: string;
  recipe_name: string;
}

interface KanbanColumn {
  status: string;
  label: string;
  color: string;
  bgColor: string;
  icon: string;
}

@Component({
  selector: 'app-kanban',
  standalone: true,
  imports: [CommonModule, DatePipe],
  template: `
    <div style="padding:24px;">

      <!-- Header -->
      <div style="margin-bottom:24px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;">
        <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;">
          <h1 class="font-display" style="font-size:22px;font-weight:700;color:var(--foreground);margin:0;">Live Kanban</h1>
          <span style="display:flex;align-items:center;gap:5px;padding:4px 10px;background:#dcfce7;border-radius:999px;font-size:12px;font-weight:600;color:#15803d;">
            <span class="live-dot" style="width:6px;height:6px;background:var(--primary);border-radius:50%;display:inline-block;"></span>
            Live
          </span>
          @if (loading()) {
            <span class="text-muted" style="font-size:13px;">Refreshing...</span>
          }
        </div>
        <div style="display:flex;align-items:center;gap:12px;">
          <p class="text-muted" style="font-size:13px;margin:0;">Track batches across every stage of the pipeline.</p>
          <button class="beautiful-button" (click)="refreshBoard()" [disabled]="loading()"
                  style="padding:8px 16px;font-size:13px;">
            <span class="material-icons-round" style="font-size:16px;">refresh</span>
            Refresh Board
          </button>
        </div>
      </div>

      <!-- Kanban Columns -->
      <div class="kanban-grid" style="display:grid;grid-template-columns:repeat(4,1fr);gap:16px;">
        @for (col of columns; track col.status) {
          <div>
            <!-- Column header -->
            <div [style.border-top-color]="col.color"
                 style="background:var(--card);border-radius:10px 10px 0 0;border:1px solid var(--border);border-top:3px solid;padding:12px 16px;display:flex;align-items:center;justify-content:space-between;">
              <div style="display:flex;align-items:center;gap:8px;">
                <span class="material-icons-round" [style.color]="col.color" style="font-size:18px;">{{ col.icon }}</span>
                <span style="font-size:13px;font-weight:700;color:#374151;text-transform:uppercase;letter-spacing:0.5px;">{{ col.label }}</span>
              </div>
              <span [style.background]="col.color + '22'" [style.color]="col.color"
                    style="padding:2px 10px;border-radius:999px;font-size:12px;font-weight:700;">
                {{ getBatches(col.status).length }}
              </span>
            </div>

            <!-- Cards area -->
            <div [style.background]="col.bgColor"
                 style="border:1px solid var(--border);border-top:none;border-radius:0 0 10px 10px;padding:10px;min-height:240px;max-height:520px;overflow-y:auto;display:flex;flex-direction:column;gap:8px;">

              <!-- Empty state -->
              @if (getBatches(col.status).length === 0) {
                <div style="flex:1;display:flex;align-items:center;justify-content:center;padding:40px 0;text-align:center;">
                  <div>
                    <span class="material-icons-round" style="font-size:32px;color:#d1d5db;display:block;margin-bottom:8px;">inbox</span>
                    <p style="font-size:13px;color:#9CA3AF;margin:0;font-weight:500;">No batches here</p>
                  </div>
                </div>
              }

              <!-- Batch cards -->
              @for (batch of getBatches(col.status); track batch.id) {
                <div style="background:var(--card);border-radius:10px;border:1px solid var(--border);padding:14px;box-shadow:0 1px 3px rgba(0,0,0,0.04);transition:box-shadow 0.15s ease;"
                     class="batch-card">
                  <!-- Top row: badge + status -->
                  <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px;margin-bottom:8px;">
                    <span class="font-display" style="font-size:13px;font-weight:700;color:var(--foreground);background:var(--secondary);padding:3px 8px;border-radius:6px;font-family:monospace;letter-spacing:0.3px;">
                      {{ batch.batch_code }}
                    </span>
                    <span [style.background]="col.color + '18'" [style.color]="col.color"
                          style="font-size:10px;font-weight:600;padding:3px 8px;border-radius:6px;white-space:nowrap;text-transform:uppercase;letter-spacing:0.3px;">
                      {{ col.label }}
                    </span>
                  </div>

                  <!-- Flavor name -->
                  <p style="font-size:13px;color:var(--foreground);font-weight:500;margin:0 0 4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
                    {{ batch.flavor_name }}
                  </p>

                  <!-- Recipe info -->
                  @if (batch.recipe_name) {
                    <p style="font-size:12px;color:var(--muted-fg);margin:0 0 6px;display:flex;align-items:center;gap:4px;">
                      <span class="material-icons-round" style="font-size:13px;">receipt_long</span>
                      {{ batch.recipe_name }}
                    </p>
                  }

                  <!-- Date -->
                  <p style="font-size:11px;color:#9CA3AF;margin:0;display:flex;align-items:center;gap:4px;">
                    <span class="material-icons-round" style="font-size:13px;">schedule</span>
                    {{ batch.created_at | date:'MMM d, h:mm a' }}
                  </p>
                </div>
              }
            </div>
          </div>
        }
      </div>
    </div>

    <style>
      .live-dot {
        animation: blink 1.5s infinite;
      }
      @keyframes blink {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.3; }
      }
      .batch-card:hover {
        box-shadow: 0 4px 12px rgba(0,0,0,0.08) !important;
      }
      @media (max-width: 1100px) {
        .kanban-grid { grid-template-columns: repeat(2, 1fr) !important; }
      }
      @media (max-width: 600px) {
        .kanban-grid { grid-template-columns: 1fr !important; }
      }
    </style>
  `,
})
export class KanbanComponent implements OnInit, OnDestroy {
  private readonly supabase = inject(SupabaseService);

  loading = signal(false);
  batches = signal<Batch[]>([]);

  columns: KanbanColumn[] = [
    { status: 'production', label: 'Production', color: '#2563eb', bgColor: '#eff6ff',  icon: 'precision_manufacturing' },
    { status: 'packing',    label: 'Packing',    color: '#d97706', bgColor: '#fffbeb',  icon: 'inventory_2' },
    { status: 'dispatch',   label: 'Dispatch',   color: '#7c3aed', bgColor: '#faf5ff',  icon: 'local_shipping' },
    { status: 'completed',  label: 'Completed',  color: '#16a34a', bgColor: '#f0fdf4',  icon: 'check_circle' },
  ];

  private refreshInterval: ReturnType<typeof setInterval> | null = null;

  async ngOnInit(): Promise<void> {
    await this.loadBatches();
    // Auto-refresh every 30 seconds
    this.refreshInterval = setInterval(() => {
      void this.loadBatches();
    }, 30000);
  }

  ngOnDestroy(): void {
    if (this.refreshInterval !== null) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
  }

  getBatches(status: string): Batch[] {
    return this.batches().filter(b => b.status === status);
  }

  async refreshBoard(): Promise<void> {
    await this.loadBatches();
  }

  private async loadBatches(): Promise<void> {
    this.loading.set(true);
    try {
      const { data, error } = await this.supabase.client
        .from('gg_batches')
        .select('id, batch_code, status, created_at, flavor_id, recipe_id, gg_flavors(name), gg_recipes(name)')
        .order('created_at', { ascending: false })
        .limit(200);

      if (!error && data) {
        this.batches.set(data.map((b: any) => ({
          id: b.id,
          batch_code: b.batch_code,
          status: b.status,
          created_at: b.created_at,
          flavor_name: b.gg_flavors?.name ?? 'Unknown Flavor',
          recipe_name: b.gg_recipes?.name ?? '',
        })));
      }
    } finally {
      this.loading.set(false);
    }
  }
}

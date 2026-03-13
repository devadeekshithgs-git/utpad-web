import { CommonModule, TitleCasePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { SupabaseService } from '../../../core/supabase.service';

interface Ingredient {
  id: string;
  name: string;
  unit: string;
  active: boolean;
  created_at: string;
}

interface Supplier {
  id: string;
  name: string;
  contact: string | null;
  active: boolean;
  created_at: string;
}

const UNITS = ['kg', 'L', 'g', 'ml', 'pcs'];

@Component({
  selector: 'app-ingredients',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TitleCasePipe],
  template: `
    <section class="min-h-full px-6 py-8" style="background:#f1f3f6;">

      <!-- Page Header -->
      <div class="mb-8">
        <p class="text-xs font-bold uppercase tracking-widest mb-1" style="color:#5b6bff;">MASTER DATA</p>
        <h1 class="text-3xl font-bold text-gray-900 leading-tight">Ingredients & Suppliers</h1>
        <p class="text-sm text-gray-500 mt-1">Define the ingredients and vendors used in inwarding. All data syncs to the mobile app.</p>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">

        <!-- ── INGREDIENTS PANEL ──────────────────────────────── -->
        <div class="flex flex-col gap-5">

          <!-- Create Ingredient -->
          <div class="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <div class="flex items-center gap-2 mb-4">
              <div class="w-7 h-7 rounded-full flex items-center justify-center" style="background:#5b6bff;">
                <span class="material-icons-round text-white text-sm">science</span>
              </div>
              <h2 class="font-semibold text-gray-800 text-base">Add Ingredient</h2>
            </div>

            <form [formGroup]="ingredientForm" (ngSubmit)="createIngredient()" class="space-y-3">
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">Name *</label>
                  <input
                    formControlName="name"
                    type="text"
                    placeholder="e.g. Gum Base A"
                    class="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-800 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 placeholder:text-gray-300" />
                  @if (ingredientForm.controls.name.invalid && ingredientForm.controls.name.touched) {
                    <p class="text-xs text-red-500 mt-1">Name is required.</p>
                  }
                </div>
                <div>
                  <label class="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">Unit *</label>
                  <select
                    formControlName="unit"
                    class="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-800 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100">
                    @for (unit of units; track unit) {
                      <option [value]="unit">{{ unit }}</option>
                    }
                  </select>
                </div>
              </div>
              <button
                type="submit"
                [disabled]="ingredientForm.invalid || savingIngredient()"
                class="w-full flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                style="background: linear-gradient(135deg, #5b6bff, #7b3fe4);">
                {{ savingIngredient() ? 'Saving...' : 'Add Ingredient' }}
              </button>
            </form>

            @if (ingredientStatus()) {
              <div
                class="mt-3 rounded-lg border px-4 py-2 text-xs font-medium text-center"
                [class]="ingredientStatusKind() === 'success' ? 'border-green-200 bg-green-50 text-green-700' : 'border-red-200 bg-red-50 text-red-700'">
                {{ ingredientStatus() }}
              </div>
            }
          </div>

          <!-- Ingredients List -->
          <div class="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div class="px-6 py-4 flex items-center justify-between border-b border-gray-100">
              <div class="flex items-center gap-3">
                <h2 class="text-base font-bold text-gray-900">Ingredients</h2>
                <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-100 text-indigo-600">
                  {{ ingredients().length }} TOTAL
                </span>
              </div>
              <button type="button" (click)="loadIngredients()" class="text-xs text-blue-600 hover:underline">Refresh</button>
            </div>

            @if (loadingIngredients()) {
              <div class="px-6 py-8 text-center text-sm text-gray-400">Loading...</div>
            } @else if (ingredients().length === 0) {
              <div class="px-6 py-10 text-center text-sm text-gray-400">No ingredients yet. Add your first one above.</div>
            } @else {
              <div class="divide-y divide-gray-50">
                @for (ing of ingredients(); track ing.id) {
                  <div class="px-6 py-3 flex items-center gap-3 hover:bg-gray-50">
                    <div class="flex-1 min-w-0">
                      <p class="text-sm font-semibold text-gray-900">{{ ing.name }}</p>
                      <p class="text-xs text-gray-400 mt-0.5">Unit: {{ ing.unit }}</p>
                    </div>
                    <span class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase" [class]="ing.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'">
                      {{ ing.active ? 'Active' : 'Inactive' }}
                    </span>
                    <button
                      type="button"
                      (click)="toggleIngredient(ing)"
                      class="text-xs px-2 py-1 rounded-lg border transition"
                      [class]="ing.active ? 'border-red-200 text-red-500 hover:bg-red-50' : 'border-green-200 text-green-600 hover:bg-green-50'">
                      {{ ing.active ? 'Disable' : 'Enable' }}
                    </button>
                  </div>
                }
              </div>
            }
          </div>
        </div>

        <!-- ── SUPPLIERS PANEL ─────────────────────────────────── -->
        <div class="flex flex-col gap-5">

          <!-- Create Supplier -->
          <div class="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <div class="flex items-center gap-2 mb-4">
              <div class="w-7 h-7 rounded-full flex items-center justify-center" style="background:#7b3fe4;">
                <span class="material-icons-round text-white text-sm">local_shipping</span>
              </div>
              <h2 class="font-semibold text-gray-800 text-base">Add Vendor / Supplier</h2>
            </div>

            <form [formGroup]="supplierForm" (ngSubmit)="createSupplier()" class="space-y-3">
              <div>
                <label class="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">Vendor Name *</label>
                <input
                  formControlName="name"
                  type="text"
                  placeholder="e.g. Alpha Ingredients Ltd"
                  class="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-800 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 placeholder:text-gray-300" />
                @if (supplierForm.controls.name.invalid && supplierForm.controls.name.touched) {
                  <p class="text-xs text-red-500 mt-1">Name is required.</p>
                }
              </div>
              <div>
                <label class="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">Contact / Phone (optional)</label>
                <input
                  formControlName="contact"
                  type="text"
                  placeholder="e.g. 9876543210"
                  class="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-800 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 placeholder:text-gray-300" />
              </div>
              <button
                type="submit"
                [disabled]="supplierForm.invalid || savingSupplier()"
                class="w-full flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                style="background: linear-gradient(135deg, #7b3fe4, #5b6bff);">
                {{ savingSupplier() ? 'Saving...' : 'Add Vendor' }}
              </button>
            </form>

            @if (supplierStatus()) {
              <div
                class="mt-3 rounded-lg border px-4 py-2 text-xs font-medium text-center"
                [class]="supplierStatusKind() === 'success' ? 'border-green-200 bg-green-50 text-green-700' : 'border-red-200 bg-red-50 text-red-700'">
                {{ supplierStatus() }}
              </div>
            }
          </div>

          <!-- Suppliers List -->
          <div class="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div class="px-6 py-4 flex items-center justify-between border-b border-gray-100">
              <div class="flex items-center gap-3">
                <h2 class="text-base font-bold text-gray-900">Vendors / Suppliers</h2>
                <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-100 text-purple-600">
                  {{ suppliers().length }} TOTAL
                </span>
              </div>
              <button type="button" (click)="loadSuppliers()" class="text-xs text-blue-600 hover:underline">Refresh</button>
            </div>

            @if (loadingSuppliers()) {
              <div class="px-6 py-8 text-center text-sm text-gray-400">Loading...</div>
            } @else if (suppliers().length === 0) {
              <div class="px-6 py-10 text-center text-sm text-gray-400">No vendors yet. Add your first one above.</div>
            } @else {
              <div class="divide-y divide-gray-50">
                @for (sup of suppliers(); track sup.id) {
                  <div class="px-6 py-3 flex items-center gap-3 hover:bg-gray-50">
                    <div class="flex-1 min-w-0">
                      <p class="text-sm font-semibold text-gray-900">{{ sup.name }}</p>
                      <p class="text-xs text-gray-400 mt-0.5">{{ sup.contact ?? 'No contact' }}</p>
                    </div>
                    <span class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase" [class]="sup.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'">
                      {{ sup.active ? 'Active' : 'Inactive' }}
                    </span>
                    <button
                      type="button"
                      (click)="toggleSupplier(sup)"
                      class="text-xs px-2 py-1 rounded-lg border transition"
                      [class]="sup.active ? 'border-red-200 text-red-500 hover:bg-red-50' : 'border-green-200 text-green-600 hover:bg-green-50'">
                      {{ sup.active ? 'Disable' : 'Enable' }}
                    </button>
                  </div>
                }
              </div>
            }
          </div>
        </div>

      </div>
    </section>
  `,
})
export class IngredientsComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly supabase = inject(SupabaseService);

  readonly units = UNITS;

  readonly ingredients = signal<Ingredient[]>([]);
  readonly suppliers = signal<Supplier[]>([]);
  readonly loadingIngredients = signal(false);
  readonly loadingSuppliers = signal(false);
  readonly savingIngredient = signal(false);
  readonly savingSupplier = signal(false);
  readonly ingredientStatus = signal('');
  readonly ingredientStatusKind = signal<'success' | 'error'>('success');
  readonly supplierStatus = signal('');
  readonly supplierStatusKind = signal<'success' | 'error'>('success');

  readonly ingredientForm = this.fb.nonNullable.group({
    name: ['', Validators.required],
    unit: ['kg', Validators.required],
  });

  readonly supplierForm = this.fb.nonNullable.group({
    name: ['', Validators.required],
    contact: [''],
  });

  ngOnInit(): void {
    void this.loadIngredients();
    void this.loadSuppliers();
  }

  async loadIngredients(): Promise<void> {
    this.loadingIngredients.set(true);
    const { data, error } = await this.supabase.client
      .from('recipe_ingredients')
      .select('id, name, unit, active, created_at')
      .order('name', { ascending: true });
    if (!error && data) this.ingredients.set(data as Ingredient[]);
    this.loadingIngredients.set(false);
  }

  async loadSuppliers(): Promise<void> {
    this.loadingSuppliers.set(true);
    const { data, error } = await this.supabase.client
      .from('suppliers')
      .select('id, name, contact, active, created_at')
      .order('name', { ascending: true });
    if (!error && data) this.suppliers.set(data as Supplier[]);
    this.loadingSuppliers.set(false);
  }

  async createIngredient(): Promise<void> {
    if (this.ingredientForm.invalid) { this.ingredientForm.markAllAsTouched(); return; }
    this.savingIngredient.set(true);
    const { name, unit } = this.ingredientForm.getRawValue();
    const id = `ing-${Date.now()}`;
    const { error } = await this.supabase.client
      .from('recipe_ingredients')
      .insert({ id, name: name.trim(), unit, active: true });
    if (error) {
      this.setIngredientStatus(`Failed: ${error.message}`, 'error');
    } else {
      this.setIngredientStatus(`"${name}" added successfully.`, 'success');
      this.ingredientForm.reset({ name: '', unit: 'kg' });
      await this.loadIngredients();
    }
    this.savingIngredient.set(false);
  }

  async createSupplier(): Promise<void> {
    if (this.supplierForm.invalid) { this.supplierForm.markAllAsTouched(); return; }
    this.savingSupplier.set(true);
    const { name, contact } = this.supplierForm.getRawValue();
    const id = `sup-${Date.now()}`;
    const { error } = await this.supabase.client
      .from('suppliers')
      .insert({ id, name: name.trim(), contact: contact.trim() || null, active: true });
    if (error) {
      this.setSupplierStatus(`Failed: ${error.message}`, 'error');
    } else {
      this.setSupplierStatus(`"${name}" added successfully.`, 'success');
      this.supplierForm.reset({ name: '', contact: '' });
      await this.loadSuppliers();
    }
    this.savingSupplier.set(false);
  }

  async toggleIngredient(ing: Ingredient): Promise<void> {
    await this.supabase.client
      .from('recipe_ingredients')
      .update({ active: !ing.active })
      .eq('id', ing.id);
    await this.loadIngredients();
  }

  async toggleSupplier(sup: Supplier): Promise<void> {
    await this.supabase.client
      .from('suppliers')
      .update({ active: !sup.active })
      .eq('id', sup.id);
    await this.loadSuppliers();
  }

  private setIngredientStatus(message: string, kind: 'success' | 'error'): void {
    this.ingredientStatusKind.set(kind);
    this.ingredientStatus.set(message);
    setTimeout(() => this.ingredientStatus.set(''), 5000);
  }

  private setSupplierStatus(message: string, kind: 'success' | 'error'): void {
    this.supplierStatusKind.set(kind);
    this.supplierStatus.set(message);
    setTimeout(() => this.supplierStatus.set(''), 5000);
  }
}

import { AfterViewInit, Component, HostListener, OnDestroy, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PaymentAllocation, PaymentDraft, PaymentMethod } from '../../core/models';
import { PrototypeStateService } from '../../core/prototype-state.service';

@Component({ selector: 'app-checkout', imports: [FormsModule], templateUrl: './checkout.html' })
export class Checkout implements AfterViewInit, OnDestroy {
  private readonly router = inject(Router);
  readonly state = inject(PrototypeStateService);
  readonly processing = signal(false);
  readonly errorMessage = signal('');
  readonly methods: PaymentMethod[] = ['Efectivo', 'Transferencia', 'Tarjeta', 'Nequi'];
  readonly payments = signal<PaymentDraft[]>(this.state.paymentDraft?.map((payment) => ({ ...payment })) ?? [
    { id: 1, method: 'Efectivo', amount: 0, received: 0, reference: '' },
  ]);
  private confirmationTimer?: number;

  ngAfterViewInit(): void { document.querySelector<HTMLInputElement>('#amount-1')?.focus(); }

  ngOnDestroy(): void {
    if (this.confirmationTimer !== undefined) window.clearTimeout(this.confirmationTimer);
    if (!this.state.completedSale()) this.state.paymentDraft = this.payments().map((payment) => ({ ...payment }));
  }

  @HostListener('document:keydown.escape', ['$event'])
  goBack(event?: Event): void {
    event?.preventDefault();
    if (!this.processing()) void this.router.navigateByUrl('/operacion/ventas/nueva');
  }

  get assigned(): number {
    return this.payments().reduce((sum, payment) => sum + (Number.isFinite(payment.amount) ? payment.amount : 0), 0);
  }
  get remaining(): number { return this.state.total() - this.assigned; }
  get change(): number {
    return this.payments().filter((payment) => payment.method === 'Efectivo').reduce((sum, payment) => sum + Math.max(0, (payment.received || 0) - (payment.amount || 0)), 0);
  }
  get validationMessage(): string {
    const message = this.state.paymentError(this.payments()) ?? '';
    if (message === 'Todavía falta asignar parte del total.' && this.payments().length === 1 && this.payments()[0].method === 'Efectivo') {
      return 'El efectivo no cubre toda la venta. Pulsa “Pago mixto” para agregar otro medio.';
    }
    return message;
  }
  get canConfirm(): boolean { return !this.processing() && !this.validationMessage; }

  methodUsed(method: PaymentMethod, id: number): boolean {
    return this.payments().some((payment) => payment.id !== id && payment.method === method);
  }

  addPayment(): void {
    if (this.processing()) return;
    let current = this.payments();
    const method = this.methods.find((candidate) => !current.some((payment) => payment.method === candidate));
    if (!method) return;

    // Si el cajero escribió primero cuánto recibió en efectivo, ese valor también
    // define cuánto se asigna a ese medio cuando todavía no había un importe.
    current = current.map((payment) => payment.method === 'Efectivo' && payment.amount <= 0 && payment.received > 0
      ? { ...payment, amount: Math.min(payment.received, this.state.total()) }
      : payment);
    const assigned = current.reduce((sum, payment) => sum + (Number.isFinite(payment.amount) ? payment.amount : 0), 0);
    const remaining = this.state.total() - assigned;
    if (assigned <= 0) {
      this.errorMessage.set('Escribe cuánto paga el cliente en el primer medio antes de activar el pago mixto.');
      document.querySelector<HTMLInputElement>(`#received-${current[0]?.id}, #amount-${current[0]?.id}`)?.focus();
      return;
    }
    if (remaining <= 0) {
      this.errorMessage.set('El efectivo ya cubre todo el total. Escribe un valor menor si necesitas combinarlo con otro medio.');
      document.querySelector<HTMLInputElement>(`#amount-${current[0]?.id}`)?.focus();
      return;
    }
    this.payments.set([...current, { id: Math.max(...current.map((payment) => payment.id), 0) + 1, method, amount: remaining, received: 0, reference: '' }]);
    this.errorMessage.set('');
  }

  removePayment(id: number): void {
    if (this.payments().length > 1 && !this.processing()) {
      this.payments.update((items) => {
        const remaining = items.filter((payment) => payment.id !== id);
        if (remaining.length !== 1) return remaining;
        const only = remaining[0];
        const amount = only.method === 'Efectivo' && only.received > 0 ? Math.min(only.received, this.state.total()) : this.state.total();
        return [{ ...only, amount }];
      });
    }
  }
  setMethod(id: number, method: PaymentMethod): void {
    if (this.methodUsed(method, id) || !this.methods.includes(method)) return;
    this.updatePayment(id, (payment) => ({ ...payment, method, received: 0, reference: '' }));
  }
  setAmount(id: number, amount: number): void {
    if (this.processing()) return;
    this.payments.update((items) => this.rebalance(items.map((payment) => payment.id === id ? { ...payment, amount } : payment), id, amount));
    this.errorMessage.set('');
  }
  setReceived(id: number, received: number): void {
    if (this.processing()) return;
    this.payments.update((items) => {
      const payment = items.find((candidate) => candidate.id === id);
      if (!payment) return items;
      const safeReceived = Number.isFinite(received) ? Math.max(0, Math.trunc(received)) : 0;
      // El efectivo entregado es la parte que el cliente está pagando con
      // efectivo. El saldo restante se transfiere automáticamente al otro
      // medio cuando existe un pago mixto.
      const amount = Math.min(safeReceived, this.state.total());
      const updated = items.map((candidate) => candidate.id === id ? { ...candidate, received: safeReceived, amount } : candidate);
      return this.rebalance(updated, id, amount);
    });
    this.errorMessage.set('');
  }
  setReference(id: number, reference: string): void { this.updatePayment(id, (payment) => ({ ...payment, reference })); }
  useExactCash(id: number): void {
    const amount = this.state.total() - this.assigned + (Number.isFinite(this.payments().find((payment) => payment.id === id)?.amount) ? this.payments().find((payment) => payment.id === id)!.amount : 0);
    this.payments.update((items) => this.rebalance(items.map((payment) => payment.id === id ? { ...payment, amount, received: amount } : payment), id, amount));
    this.errorMessage.set('');
  }
  useRemaining(id: number): void {
    const current = this.payments().find((payment) => payment.id === id);
    if (!current) return;
    const amount = Math.max(0, this.remaining + (Number.isFinite(current.amount) ? current.amount : 0));
    this.setAmount(id, amount);
  }

  confirm(): void {
    if (this.processing()) return;
    if (!this.canConfirm) { this.errorMessage.set(this.validationMessage); this.focusInvalidPayment(); return; }
    this.errorMessage.set('');
    const allocations: PaymentAllocation[] = this.payments().map((payment) => ({
      method: payment.method, amount: payment.amount,
      ...(payment.method === 'Efectivo' ? { received: payment.received } : {}),
      ...((payment.method === 'Transferencia' || payment.method === 'Nequi') ? { reference: payment.reference.trim() } : {}),
    }));
    this.processing.set(true);
    try {
      this.state.completeSale(allocations);
      this.confirmationTimer = window.setTimeout(() => { void this.router.navigateByUrl('/operacion/ventas/confirmada'); }, 350);
    } catch (error) {
      this.processing.set(false);
      this.errorMessage.set(error instanceof Error ? error.message : 'La venta no se registró. Revisa los datos e intenta de nuevo.');
    }
  }

  private updatePayment(id: number, updater: (payment: PaymentDraft) => PaymentDraft): void {
    if (!this.processing()) {
      this.payments.update((items) => items.map((payment) => payment.id === id ? updater(payment) : payment));
      this.errorMessage.set('');
    }
  }

  private rebalance(items: PaymentDraft[], id: number, amount: number): PaymentDraft[] {
    if (items.length < 2 || !Number.isFinite(amount)) return items;
    const balancePayment = [...items].reverse().find((payment) => payment.id !== id);
    if (!balancePayment) return items;
    const otherAssigned = items
      .filter((payment) => payment.id !== id && payment.id !== balancePayment.id)
      .reduce((sum, payment) => sum + (Number.isFinite(payment.amount) ? payment.amount : 0), 0);
    const balance = Math.max(0, this.state.total() - amount - otherAssigned);
    return items.map((payment) => payment.id === balancePayment.id ? { ...payment, amount: balance } : payment);
  }

  private focusInvalidPayment(): void {
    for (const payment of this.payments()) {
      let field = '';
      if (payment.method === 'Efectivo' && (!Number.isSafeInteger(payment.received) || payment.received <= 0 || payment.amount <= 0 || payment.received < payment.amount)) field = 'received';
      else if (!Number.isSafeInteger(payment.amount) || payment.amount <= 0) field = 'amount';
      else if ((payment.method === 'Transferencia' || payment.method === 'Nequi') && !payment.reference.trim()) field = 'reference';
      if (field) { document.querySelector<HTMLInputElement>(`#${field}-${payment.id}`)?.focus(); return; }
    }
    document.querySelector<HTMLInputElement>(`#amount-${this.payments().at(-1)?.id}`)?.focus();
  }
}

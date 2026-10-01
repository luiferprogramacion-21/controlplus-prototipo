import { AfterViewInit, Component, HostListener, OnDestroy, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { PrototypeStateService } from '../../core/prototype-state.service';

@Component({
  selector: 'app-sale-success',
  templateUrl: './sale-success.html',
})
export class SaleSuccess implements AfterViewInit, OnDestroy {
  private readonly router = inject(Router);
  readonly state = inject(PrototypeStateService);
  readonly printed = signal(true);
  readonly printError = signal('');
  readonly showDetail = signal(false);
  private printTimer?: number;

  constructor() {
    if (!this.state.completedSale()) void this.router.navigateByUrl('/operacion/ventas/nueva');
  }

  reprint(): void {
    if (!this.printed()) return;
    const sale = this.state.completedSale();
    if (!sale) return;
    const error = this.state.reprintSale(sale.number);
    if (error) { this.printError.set(error); return; }
    this.printError.set('');
    this.printed.set(false);
    this.printTimer = window.setTimeout(() => this.printed.set(true), 500);
  }

  ngAfterViewInit(): void { document.querySelector<HTMLButtonElement>('#new-sale')?.focus(); }
  ngOnDestroy(): void { if (this.printTimer !== undefined) window.clearTimeout(this.printTimer); }

  @HostListener('document:keydown.enter', ['$event'])
  onEnter(event: Event): void {
    if (event.target instanceof HTMLElement && event.target.closest('button, input, select, textarea, a')) return;
    event.preventDefault(); this.newSale();
  }

  newSale(): void {
    this.state.startNewSale();
    void this.router.navigateByUrl('/operacion/ventas/nueva');
  }

  formatDate(date: Date): string {
    return new Intl.DateTimeFormat('es-CO', {
      dateStyle: 'long',
      timeStyle: 'short',
    }).format(date);
  }
}

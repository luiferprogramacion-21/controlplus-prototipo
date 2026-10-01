import { AfterViewInit, Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { PrototypeStateService } from '../../core/prototype-state.service';

@Component({
  selector: 'app-cash-closing',
  imports: [ReactiveFormsModule, RouterLink, DatePipe],
  templateUrl: './cash-closing.html',
})
export class CashClosing implements AfterViewInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  readonly state = inject(PrototypeStateService);
  readonly errorMessage = signal('');
  readonly submitted = signal(false);
  readonly form = this.fb.nonNullable.group({
    countedCash: [0, [Validators.required, Validators.min(0)]],
    reason: [''],
    notes: [''],
  });

  get currentDifference(): number { return this.form.controls.countedCash.value - this.state.cashExpected(); }

  ngAfterViewInit(): void {
    document.querySelector<HTMLInputElement>('#counted-cash')?.focus();
  }

  close(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const reason = this.form.controls.reason.value;
    const difference = this.form.controls.countedCash.value - this.state.cashExpected();
    if (difference !== 0 && !reason) {
      this.errorMessage.set('Selecciona el motivo del descuadre antes de cerrar.');
      document.querySelector<HTMLSelectElement>('#closure-reason')?.focus();
      return;
    }
    const error = this.state.closeCash(this.form.controls.countedCash.value, reason, this.form.controls.notes.value);
    this.errorMessage.set(error ?? '');
    if (error) {
      document.querySelector<HTMLInputElement>('#counted-cash')?.focus();
      return;
    }
    this.submitted.set(true);
  }

  goToOpening(): void { void this.router.navigateByUrl('/operacion/caja/apertura'); }
}

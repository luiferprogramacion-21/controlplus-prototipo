import { AfterViewInit, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { PrototypeStateService } from '../../core/prototype-state.service';

@Component({
  selector: 'app-cash-opening',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './cash-opening.html',
})
export class CashOpening implements AfterViewInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  readonly state = inject(PrototypeStateService);

  readonly operationDate = new Intl.DateTimeFormat('es-CO').format(new Date());
  readonly errorMessage = signal('');
  readonly form = this.fb.nonNullable.group({
    initialAmount: [200000, [Validators.required, Validators.min(0)]],
    notes: [''],
  });

  open(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const error = this.state.openCash(this.form.controls.initialAmount.value, this.form.controls.notes.value);
    this.errorMessage.set(error ?? '');
    if (error) { document.querySelector<HTMLInputElement>('#initial-amount')?.focus(); return; }
    void this.router.navigateByUrl('/operacion/ventas/nueva');
  }

  ngAfterViewInit(): void { document.querySelector<HTMLInputElement>('#initial-amount')?.focus(); }

  cancel(): void {
    this.state.logout();
    void this.router.navigateByUrl('/ingresar');
  }
}

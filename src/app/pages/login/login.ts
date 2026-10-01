import { AfterViewInit, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { PrototypeStateService } from '../../core/prototype-state.service';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule],
  templateUrl: './login.html',
})
export class Login implements AfterViewInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly state = inject(PrototypeStateService);

  readonly showPassword = signal(false);
  readonly submitted = signal(false);
  readonly errorMessage = signal('');
  readonly form = this.fb.nonNullable.group({
    username: ['luifer.admin', Validators.required],
    password: ['demo123', Validators.required],
  });

  submit(): void {
    this.submitted.set(true);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { username, password } = this.form.getRawValue();
    const error = this.state.login(username, password);
    this.errorMessage.set(error ?? '');
    if (error) { document.querySelector<HTMLInputElement>('#username')?.focus(); return; }
    void this.router.navigateByUrl(this.state.cashOpen() ? '/operacion/ventas/nueva' : '/operacion/caja/apertura');
  }

  ngAfterViewInit(): void { document.querySelector<HTMLInputElement>('#username')?.focus(); }

}

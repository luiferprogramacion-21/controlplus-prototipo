import { A11yModule } from '@angular/cdk/a11y';
import { AfterViewInit, Component, ElementRef, HostListener, Injector, ViewChild, afterNextRender, computed, inject, signal } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CustomerRecord, Product } from '../../core/models';
import { PrototypeStateService } from '../../core/prototype-state.service';

@Component({ selector: 'app-pos', imports: [FormsModule, ReactiveFormsModule, A11yModule], templateUrl: './pos.html' })
export class Pos implements AfterViewInit {
  private readonly router = inject(Router);
  readonly state = inject(PrototypeStateService);
  private readonly injector = inject(Injector);
  @ViewChild('productSearch') private productSearch?: ElementRef<HTMLInputElement>;
  readonly search = new FormControl('', { nonNullable: true });
  readonly feedback = signal('');
  readonly feedbackKind = signal<'info' | 'success' | 'error'>('info');
  readonly showDiscount = signal(false);
  readonly showCancel = signal(false);
  readonly showApartado = signal(false);
  readonly showCustomer = signal(false);
  readonly customerFormMode = signal(false);
  readonly customerSearch = signal('');
  readonly customerError = signal('');
  readonly discountScope = signal<'product' | 'sale'>('product');
  readonly discountAmount = signal(0);
  readonly discountReason = signal('');
  readonly discountError = signal('');
  readonly apartadoInitial = signal(0);
  readonly apartadoNotes = signal('');
  readonly apartadoError = signal('');
  readonly customer = this.state.customer;
  readonly customerMatches = computed(() => this.state.searchCustomers(this.customerSearch()));
  readonly selectedCustomer = computed(() => this.state.customers().find((candidate) => candidate.name === this.customer()));
  readonly matches = signal<Product[]>([]);
  readonly openedTime = this.state.openedAt()?.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }) ?? '';
  customerName = '';
  customerDocument = '';
  customerPhone = '';
  customerAddress = '';
  private customerContinuation: 'credit' | 'apartado' | null = null;

  get customerPickerTitle(): string {
    if (this.customerContinuation === 'credit') return 'Cliente para la venta a crédito';
    if (this.customerContinuation === 'apartado') return 'Cliente para el apartado';
    return 'Seleccionar cliente';
  }

  get customerSelectionRequired(): boolean { return this.customerContinuation !== null; }

  ngAfterViewInit(): void { this.productSearch?.nativeElement.focus(); }

  @HostListener('document:keydown', ['$event'])
  handleShortcut(event: KeyboardEvent): void {
    if (this.showDiscount() || this.showCancel() || this.showApartado() || this.showCustomer()) {
      if (event.key === 'Escape') { event.preventDefault(); this.showDiscount.set(false); this.showCancel.set(false); this.showApartado.set(false); this.closeCustomerPicker(); }
      if (event.key.startsWith('F') && /^F\d+$/.test(event.key)) event.preventDefault();
      return;
    }
    const target = event.target instanceof HTMLElement ? event.target : null;
    const editing = !!target?.closest('input, textarea, select, [contenteditable=true]');
    if (event.key === 'Escape' && this.matches().length) { event.preventDefault(); this.matches.set([]); this.productSearch?.nativeElement.focus(); }
    if (event.key === 'Delete' && !editing) { event.preventDefault(); this.removeSelected(); }
    if (event.key === 'F2') { event.preventDefault(); this.productSearch?.nativeElement.focus(); }
    if (event.key === 'F9') { event.preventDefault(); this.goToCheckout(); }
    if (event.key === 'F3') { event.preventDefault(); this.openCustomerPicker(); }
    if (event.key === 'F4') { event.preventDefault(); this.focusQuantity(); }
  }

  toggleCatalog(): void { this.matches.set(this.matches().length ? [] : this.state.products); }
  filterCatalog(value: string): void { this.matches.set(value.trim().length >= 2 ? this.state.searchProducts(value) : []); }

  @HostListener('document:click', ['$event'])
  dismissResults(event: Event): void {
    if (event.target instanceof Element && !event.target.closest('.search-area')) this.matches.set([]);
  }

  scan(): void {
    const value = this.search.value;
    const product = this.state.findProduct(value);
    if (!product) {
      const matches = this.state.searchProducts(value);
      this.matches.set(matches);
      this.feedbackKind.set(matches.length ? 'info' : 'error');
      this.feedback.set(matches.length ? 'Hay varias coincidencias. Elige el producto de la lista.' : value.trim() ? `No encontramos “${value.trim()}”. Revisa el código o el nombre.` : 'Escribe o escanea un producto.');
      return;
    }
    this.add(product);
  }

  add(product: Product): void {
    const error = this.state.addProduct(product);
    if (error) { this.showError(error); return; }
    this.matches.set([]);
    this.search.setValue('');
    this.feedbackKind.set('success');
    const quantity = this.state.cart().find((line) => line.product.id === product.id)?.quantity;
    this.feedback.set(`${product.name} agregado. Cantidad actual: ${quantity}.`);
    this.productSearch?.nativeElement.focus();
    afterNextRender(() => {
      document.querySelector<HTMLElement>(`[data-product-id="${product.id}"]`)?.scrollIntoView?.({ block: 'nearest', inline: 'nearest' });
    }, { injector: this.injector });
  }

  focusQuantity(): void {
    const selected = this.state.selectedProductId();
    if (selected === null) { this.showError('Selecciona primero un producto.'); return; }
    const input = document.querySelector<HTMLInputElement>(`#quantity-${selected}`);
    input?.focus(); input?.select();
  }

  setQuantity(productId: number, quantity: number, event?: Event): void {
    const error = this.state.setQuantity(productId, quantity);
    if (error) {
      this.showError(error);
      if (event?.target instanceof HTMLInputElement) event.target.value = String(this.state.cart().find((line) => line.product.id === productId)?.quantity ?? 1);
    } else { this.feedbackKind.set('success'); this.feedback.set('Cantidad actualizada.'); }
  }

  removeSelected(): void {
    const error = this.state.removeSelected();
    if (error) { this.showError(error); return; }
    this.feedbackKind.set('info'); this.feedback.set('Producto retirado de la venta.');
  }

  openDiscount(scope: 'product' | 'sale'): void {
    if (!this.state.cart().length || (scope === 'product' && this.state.selectedProductId() === null)) { this.showError('Selecciona un producto antes de aplicar el descuento.'); return; }
    const selected = this.state.cart().find((line) => line.product.id === this.state.selectedProductId());
    this.discountScope.set(scope);
    this.discountAmount.set(scope === 'product' ? selected?.discount ?? 0 : this.state.saleDiscount());
    this.discountReason.set(scope === 'product' ? selected?.discountReason ?? '' : '');
    this.discountError.set('');
    this.showDiscount.set(true);
  }

  get discountTarget(): string {
    return this.discountScope() === 'sale' ? 'Todos los productos de la venta' : this.state.cart().find((line) => line.product.id === this.state.selectedProductId())?.product.name ?? '';
  }

  applyDiscount(): void {
    const error = this.discountScope() === 'product'
      ? this.state.applyProductDiscount(this.discountAmount(), this.discountReason())
      : this.state.applyWholeSaleDiscount(this.discountAmount(), this.discountReason());
    if (error) { this.discountError.set(error); document.querySelector<HTMLInputElement>('#discount-amount')?.focus(); return; }
    this.showDiscount.set(false);
    this.feedbackKind.set('success'); this.feedback.set('Descuento actualizado. Revisa el total antes de cobrar.');
  }

  openCustomerPicker(continuation: 'credit' | 'apartado' | null = null): void {
    this.customerContinuation = continuation;
    this.customerSearch.set('');
    this.customerFormMode.set(false);
    this.customerError.set('');
    this.customerName = '';
    this.customerDocument = '';
    this.customerPhone = '';
    this.customerAddress = '';
    this.showCustomer.set(true);
  }

  closeCustomerPicker(): void {
    this.showCustomer.set(false);
    this.customerContinuation = null;
    this.customerError.set('');
  }

  selectCustomer(customer: CustomerRecord): void {
    const continuation = this.customerContinuation;
    this.state.setCustomer(customer.name);
    this.showCustomer.set(false);
    this.customerContinuation = null;
    this.feedbackKind.set('success');
    this.feedback.set(`${customer.name} seleccionado.`);
    if (continuation === 'credit') this.completeCreditSale();
    if (continuation === 'apartado') this.openApartadoForSelectedCustomer();
  }

  selectConsumerFinal(): void {
    this.state.setCustomer('Consumidor final');
    this.closeCustomerPicker();
    this.feedbackKind.set('info');
    this.feedback.set('La venta continuará como consumidor final.');
  }

  createCustomer(): void {
    const error = this.state.registerCustomer(this.customerName, this.customerDocument, this.customerPhone, this.customerAddress);
    if (error) { this.customerError.set(error); return; }
    const customer = this.state.findCustomerByDocument(this.customerDocument)!;
    this.selectCustomer(customer);
  }

  goToCheckout(): void {
    if (this.showDiscount() || this.showCancel() || this.showApartado() || this.showCustomer()) return;
    if (!this.state.cart().length) { this.showError('Agrega al menos un producto antes de cobrar.'); this.productSearch?.nativeElement.focus(); return; }
    void this.router.navigateByUrl('/operacion/ventas/cobro');
  }

  cancelSale(): void {
    this.state.startNewSale(); this.showCancel.set(false);
    this.feedbackKind.set('info'); this.feedback.set('Venta cancelada. Puedes iniciar una nueva venta.');
  }

  startCreditSale(): void {
    if (!this.state.cart().length) { this.showError('Agrega al menos un producto antes de registrar el crédito.'); return; }
    if (this.customer() === 'Consumidor final') { this.openCustomerPicker('credit'); return; }
    this.completeCreditSale();
  }

  private completeCreditSale(): void {
    const error = this.state.registerSaleOnCredit();
    if (error) { this.showError(error); return; }
    void this.router.navigateByUrl('/operacion/ventas/confirmada');
  }

  openApartado(): void {
    if (!this.state.cart().length) { this.showError('Agrega al menos un producto antes de crear el apartado.'); return; }
    if (this.customer() === 'Consumidor final') { this.openCustomerPicker('apartado'); return; }
    this.openApartadoForSelectedCustomer();
  }

  private openApartadoForSelectedCustomer(): void {
    this.apartadoInitial.set(Math.ceil(this.state.total() * this.state.apartadoMinimumPercent() / 100));
    this.apartadoNotes.set('');
    this.apartadoError.set('');
    this.showApartado.set(true);
  }

  submitApartado(): void {
    const error = this.state.registerApartadoFromCart(this.apartadoInitial(), this.apartadoNotes());
    if (error) { this.apartadoError.set(error); return; }
    this.showApartado.set(false);
    this.feedbackKind.set('success');
    this.feedback.set('Apartado creado y abono inicial registrado.');
  }

  lineSubtotal(productId: number): number {
    const line = this.state.cart().find((item) => item.product.id === productId);
    return line ? Math.round(line.product.price * line.quantity - line.discount) : 0;
  }

  private showError(message: string): void { this.feedbackKind.set('error'); this.feedback.set(message); }
}

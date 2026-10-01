import { DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Icon } from '../../layout/icon';
import { CompletedSale, PaymentMethod } from '../../core/models';
import { PrototypeStateService } from '../../core/prototype-state.service';

type OperationsKey = 'creditos' | 'apartados' | 'cambios' | 'historial' | 'turnos' | 'barcodes' | 'impresion' | 'recepciones' | 'movimientos';
type FormMode = 'new' | 'credit-payment' | 'apartado-payment' | 'apartado-cancel' | 'sale-void' | 'movement' | 'print' | 'operator' | 'barcode' | 'receive';

interface OperationsConfig { title: string; subtitle: string; action: string; icon: string; }
interface ReceptionDraftLine {
  productCode: string;
  productName: string;
  requested: number;
  received: number;
  pending: number;
  quantity: number;
  unitCost: number;
  previousSalePrice: number;
  newSalePrice: number;
}

@Component({
  selector: 'app-operations-page',
  imports: [DatePipe, FormsModule, Icon],
  templateUrl: './operations-page.html',
})
export class OperationsPage {
  readonly state = inject(PrototypeStateService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly module = signal<OperationsKey>((this.route.snapshot.data['module'] as OperationsKey | undefined) ?? 'creditos');
  readonly feedback = signal('');
  readonly formError = signal('');
  readonly showForm = signal(false);
  readonly formMode = signal<FormMode>('new');
  readonly config: Record<OperationsKey, OperationsConfig> = {
    creditos: { title: 'Créditos y abonos', subtitle: 'Fiados de clientes y pagos registrados', action: 'Nuevo crédito', icon: 'customers' },
    apartados: { title: 'Apartados', subtitle: 'Reservas con abonos y entrega', action: 'Nuevo apartado', icon: 'catalog' },
    cambios: { title: 'Cambios de productos', subtitle: 'Cambios autorizados dentro del plazo', action: 'Registrar cambio', icon: 'sales' },
    historial: { title: 'Historial de ventas', subtitle: 'Anulaciones y reimpresiones', action: 'Actualizar', icon: 'sales' },
    turnos: { title: 'Operadores y turnos', subtitle: 'Sesiones rápidas con credencial Code 128', action: 'Identificar operador', icon: 'lock' },
    barcodes: { title: 'Códigos de barras', subtitle: 'Generación y consulta de códigos por producto', action: 'Generar código', icon: 'catalog' },
    impresion: { title: 'Impresión', subtitle: 'Recibos, etiquetas y credenciales en cola', action: 'Nuevo trabajo', icon: 'reports' },
    recepciones: { title: 'Recepción de compras', subtitle: 'Recepciones completas y parciales', action: 'Registrar recepción', icon: 'purchases' },
    movimientos: { title: 'Movimientos de caja', subtitle: 'Gastos, ingresos y sangrías', action: 'Nuevo movimiento', icon: 'cash' },
  };

  formCustomer = '';
  formAmount = 0;
  formTotal = 0;
  formCreditId = '';
  formApartadoId = '';
  formPaymentMethod: PaymentMethod = 'Efectivo';
  formReference = '';
  formProductCode = '770001';
  formQuantity = 1;
  formInitialPayment = 0;
  formNotes = '';
  formSaleNumber = '';
  formOriginalProductCode = '';
  formReplacementProductCode = '';
  formOriginalProduct = '';
  formReplacementProduct = 'Camiseta básica de algodón';
  formDifference = 0;
  formDifferenceMode: 'Pago inmediato' | 'Agregar al crédito' | 'Sin diferencia' = 'Sin diferencia';
  formReason = '';
  formMovementType: 'Gasto' | 'Ingreso' | 'Sangría' = 'Gasto';
  formConcept = '';
  formOperatorCode = '';
  formBarcodeTarget: 'Producto' | 'Credencial' = 'Producto';
  formBarcodeUser = '';
  formPrintType: 'Recibo' | 'Etiqueta' | 'Credencial' = 'Recibo';
  formPrintReference = '';
  formCopies = 1;
  formPurchaseId = '';
  formReceiveLines: ReceptionDraftLine[] = [];
  generatedBarcode = signal('');

  constructor() {
    if (this.module() === 'impresion' && this.route.snapshot.queryParamMap.get('reference')) this.openForm('print');
  }

  get current(): OperationsConfig { return this.config[this.module()]; }
  get pendingCreditTotal(): number { return this.state.credits().filter((credit) => credit.status === 'Pendiente').reduce((sum, credit) => sum + credit.total - credit.paid, 0); }
  get activeApartados(): number { return this.state.apartados().filter((item) => item.status === 'Activo').length; }
  get lastSale(): CompletedSale | undefined { return this.state.salesHistory().at(-1); }
  get selectedCredit() { return this.state.credits().find((credit) => credit.id === this.formCreditId); }
  get selectedApartado() { return this.state.apartados().find((item) => item.id === this.formApartadoId); }
  get selectedPurchase() { return this.state.purchaseOrders().find((item) => item.id === this.formPurchaseId); }
  get barcodeBars(): string[] { return this.generatedBarcode().split('').flatMap((char) => Array.from({ length: (char.charCodeAt(0) % 4) + 1 }, () => char)); }
  get changeSale() { return this.state.salesHistory().find((sale) => sale.number === this.formSaleNumber.trim()); }
  get returnedChangeLine() { return this.changeSale?.lines.find((line) => line.product.code === this.formOriginalProductCode || line.product.barcode === this.formOriginalProductCode); }
  get selectedReplacementProduct() { return this.state.findProduct(this.formReplacementProductCode); }
  get calculatedChangeDifference(): number {
    const returnedPrice = this.returnedChangeLine?.product.price ?? 0;
    const replacementPrice = this.selectedReplacementProduct?.price ?? 0;
    return returnedPrice && replacementPrice ? replacementPrice - returnedPrice : 0;
  }
  get changeExplanation(): string {
    const difference = this.calculatedChangeDifference;
    if (!this.returnedChangeLine || !this.selectedReplacementProduct) return 'Escanea primero el producto devuelto de la venta y el producto nuevo.';
    if (difference > 0) return `El producto nuevo cuesta ${this.format(difference)} más; el cliente paga o lo agrega al crédito.`;
    if (difference < 0) return `El producto nuevo cuesta ${this.format(Math.abs(difference))} menos; se reduce el crédito y se devuelve el excedente.`;
    return 'Los dos productos tienen el mismo precio; no hay diferencia.';
  }
  get printReferenceSuggestions(): string[] {
    if (this.formPrintType === 'Recibo') return this.state.salesHistory().map((sale) => sale.number);
    if (this.formPrintType === 'Credencial') return this.state.users.map((user) => user.quickCode).filter((code): code is string => Boolean(code));
    return [...this.state.barcodes().filter((barcode) => barcode.subjectType === 'Producto').map((barcode) => barcode.value), ...this.state.products.map((product) => product.barcode ?? product.code)];
  }
  get suggestedPrintReference(): string {
    if (this.formPrintType === 'Recibo') return this.lastSale?.number ?? '';
    if (this.formPrintType === 'Credencial') return this.state.users.find((user) => user.quickCode)?.quickCode ?? '';
    return this.state.barcodes().filter((barcode) => barcode.subjectType === 'Producto').at(-1)?.value ?? (this.state.products[0]?.barcode ?? this.state.products[0]?.code ?? '');
  }
  format(value: number): string { return this.state.formatCop(value); }

  executeAction(): void {
    if (this.module() === 'historial') { this.feedback.set('Historial actualizado.'); return; }
    if (this.module() === 'recepciones') { this.openForm('receive'); return; }
    if (this.module() === 'barcodes') { this.openForm('barcode'); return; }
    if (this.module() === 'impresion') { this.openForm('print'); return; }
    if (this.module() === 'turnos') { this.openForm('operator'); return; }
    if (this.module() === 'movimientos') { this.openForm('movement'); return; }
    this.openForm('new');
  }

  openForm(mode: FormMode, id = ''): void {
    this.formMode.set(mode); this.formError.set('');
    this.formCustomer = this.state.customers()[0]?.name ?? ''; this.formAmount = 0; this.formTotal = 0; this.formCreditId = id || this.state.credits()[0]?.id || '';
    this.formApartadoId = id || this.state.apartados()[0]?.id || ''; this.formPaymentMethod = 'Efectivo'; this.formReference = '';
    const firstProduct = this.state.products[0];
    this.formProductCode = this.module() === 'apartados' ? String(firstProduct?.id ?? 1) : (firstProduct?.code ?? '770001'); this.formQuantity = 1; this.formInitialPayment = 0; this.formNotes = '';
    this.formSaleNumber = this.lastSale?.number ?? ''; this.formOriginalProductCode = this.lastSale?.lines[0]?.product.code ?? ''; this.formReplacementProductCode = this.state.products[1]?.code ?? '';
    this.formOriginalProduct = this.lastSale?.lines[0]?.product.name ?? ''; this.formReplacementProduct = this.state.products[1]?.name ?? '';
    this.formDifference = this.calculatedChangeDifference; this.formDifferenceMode = 'Sin diferencia'; this.formReason = ''; this.formMovementType = 'Gasto'; this.formConcept = '';
    const queryType = this.route.snapshot.queryParamMap.get('type');
    const requestedPrintType: 'Recibo' | 'Etiqueta' | 'Credencial' = queryType === 'Etiqueta' || queryType === 'Credencial' ? queryType : 'Recibo';
    this.formOperatorCode = ''; this.formPrintType = this.module() === 'impresion' ? requestedPrintType : 'Recibo'; this.formPrintReference = this.module() === 'impresion' ? (this.route.snapshot.queryParamMap.get('reference') ?? '') : (this.lastSale?.number ?? ''); this.formCopies = 1;
    if (this.module() === 'impresion' && !this.formPrintReference) this.formPrintReference = this.suggestedPrintReference;
    this.formBarcodeTarget = 'Producto'; this.formBarcodeUser = this.state.users[0]?.username ?? '';
    this.formPurchaseId = id || (this.state.purchaseOrders().find((item) => item.lines.some((line) => line.received < line.requested))?.id ?? '');
    this.loadReceiveLines(this.formPurchaseId);
    this.generatedBarcode.set(''); this.showForm.set(true);
  }

  closeForm(): void { this.showForm.set(false); this.formError.set(''); }

  submitForm(): void {
    const mode = this.formMode();
    let error: string | null = null;
    if (this.module() === 'creditos' && mode === 'new') error = this.state.registerCredit(this.formCustomer, this.formTotal);
    else if (this.module() === 'creditos' && mode === 'credit-payment') error = this.state.registerCreditPayment(this.formCreditId, this.formAmount, this.formPaymentMethod, this.formReference);
    else if (this.module() === 'apartados' && mode === 'new') error = this.state.registerApartado(this.formCustomer, Number(this.formProductCode), this.formQuantity, this.formInitialPayment, this.formNotes);
    else if (this.module() === 'apartados' && mode === 'apartado-payment') error = this.state.registerApartadoPayment(this.formApartadoId, this.formAmount);
    else if (this.module() === 'apartados' && mode === 'apartado-cancel') error = this.state.cancelApartado(this.formApartadoId, this.formAmount, this.formNotes);
    else if (this.module() === 'cambios') {
      this.resolveChangeProducts();
      this.formDifference = this.calculatedChangeDifference;
      error = this.state.registerChange({ saleNumber: this.formSaleNumber, customer: this.formCustomer, originalProduct: this.formOriginalProduct, replacementProduct: this.formReplacementProduct, originalProductCode: this.formOriginalProductCode, replacementProductCode: this.formReplacementProductCode, difference: this.formDifference, differenceMode: this.formDifferenceMode, reason: this.formReason });
    }
    else if (this.module() === 'historial' && mode === 'sale-void') error = this.state.voidSale(this.formSaleNumber, this.formReason);
    else if (this.module() === 'turnos') error = this.state.identifyOperator(this.formOperatorCode);
    else if (this.module() === 'barcodes') {
      const value = this.formBarcodeTarget === 'Credencial' ? this.state.generateCredentialBarcode(this.formBarcodeUser) : this.state.generateBarcode(this.formProductCode);
      error = value ? null : value;
      if (value) this.generatedBarcode.set(value);
    }
    else if (this.module() === 'impresion') error = this.state.enqueuePrint(this.formPrintType, this.formPrintReference, this.formCopies);
    else if (this.module() === 'recepciones') error = this.state.receivePurchase(this.formPurchaseId, this.formReceiveLines.map((line) => ({ productCode: line.productCode, quantity: line.quantity, unitCost: line.unitCost, newSalePrice: line.newSalePrice })));
    else if (this.module() === 'movimientos') error = this.state.addCashMovement(this.formMovementType, this.formAmount, this.formConcept);
    if (error) { this.formError.set(error); return; }
    if (this.module() === 'barcodes') {
      this.feedback.set(`Código ${this.formBarcodeTarget === 'Credencial' ? 'Code 128' : 'EAN-13'} generado.`);
      this.showForm.set(false);
      const value = this.generatedBarcode();
      if (value) this.router.navigate(['/operacion/impresion'], { queryParams: { type: this.formBarcodeTarget === 'Credencial' ? 'Credencial' : 'Etiqueta', reference: value } });
      return;
    }
    this.feedback.set('Operación registrada correctamente.'); this.showForm.set(false);
  }

  reprint(number: string): void { const error = this.state.reprintSale(number); this.feedback.set(error ?? `Reimpresión de ${number} enviada a la cola.`); }
  sendBarcodeToPrint(type: 'Etiqueta' | 'Credencial', reference: string): void { this.router.navigate(['/operacion/impresion'], { queryParams: { type, reference } }); }
  resolveChangeProducts(): void {
    const returned = this.returnedChangeLine;
    const replacement = this.selectedReplacementProduct;
    this.formOriginalProduct = returned?.product.name ?? '';
    this.formReplacementProduct = replacement?.name ?? '';
    this.formDifference = this.calculatedChangeDifference;
  }
  onChangeSaleNumber(): void {
    const line = this.changeSale?.lines[0];
    if (line) this.formOriginalProductCode = line.product.code;
    this.resolveChangeProducts();
  }
  onChangeOriginalCode(): void { this.resolveChangeProducts(); }
  onChangeReplacementCode(): void { this.resolveChangeProducts(); }
  onPrintTypeChange(): void { this.formPrintReference = this.suggestedPrintReference; }
  void(number: string): void { this.openForm('sale-void', number); }
  creditPayment(id: string): void { this.openForm('credit-payment', id); }
  apartadoPayment(id: string): void { this.openForm('apartado-payment', id); }
  cancelApartado(id: string): void { this.openForm('apartado-cancel', id); }
  deliverApartado(id: string): void { const error = this.state.deliverApartado(id); this.feedback.set(error ?? 'Apartado entregado.'); }
  receivePurchase(id: string): void { this.openForm('receive', id); }
  loadReceiveLines(id: string): void {
    this.formPurchaseId = id;
    const order = this.state.purchaseOrders().find((item) => item.id === id);
    this.formReceiveLines = (order?.lines ?? [])
      .filter((line) => line.received < line.requested)
      .map((line) => {
        const product = this.state.products.find((item) => item.code === line.productCode);
        const previousSalePrice = product?.price ?? 0;
        return { ...line, pending: line.requested - line.received, quantity: 0, unitCost: 0, previousSalePrice, newSalePrice: previousSalePrice };
      });
  }
  receiveAllPending(): void { this.formReceiveLines = this.formReceiveLines.map((line) => ({ ...line, quantity: line.pending })); }
  requestedTotal(id: string): number { return this.state.purchaseOrders().find((item) => item.id === id)?.lines.reduce((sum, line) => sum + line.requested, 0) ?? 0; }
  receivedTotal(id: string): number { return this.state.purchaseOrders().find((item) => item.id === id)?.lines.reduce((sum, line) => sum + line.received, 0) ?? 0; }
  printJob(id: string): void { const error = this.state.completePrint(id); this.feedback.set(error ?? 'Trabajo enviado a impresión.'); }
  endOperator(): void { const error = this.state.endOperatorSession(); this.feedback.set(error ?? 'Sesión de operador finalizada.'); }
  setApartadoMinimum(value: number): void { const error = this.state.setApartadoMinimumPercent(value); this.feedback.set(error ?? `Mínimo actualizado a ${value} %.`); }
}

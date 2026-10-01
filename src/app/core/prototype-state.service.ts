import { computed, Injectable, signal } from '@angular/core';
import { ApartadoRecord, BarcodeRecord, CartLine, CashClosure, CashMovement, CompletedSale, CreditPayment, CreditRecord, CustomerRecord, OperatorSession, PaymentAllocation, PaymentDraft, PaymentMethod, PrintJob, Product, ProductChangeRecord, PrototypeUser, PurchaseOrderLine, PurchaseOrderRecord, PurchaseReceiptLine, PurchaseReceiptRecord } from './models';

@Injectable({ providedIn: 'root' })
export class PrototypeStateService {
  // Todos los precios y la tasa uniforme de IVA son datos de prueba, no un catálogo fiscal.
  readonly products: Product[] = [
    { id: 1, code: '770001', name: 'Camiseta básica de algodón', category: 'Ropa', price: 28500, stock: 24, unit: 'unidad', supplier: 'Comercial Andina' },
    { id: 2, code: '770002', name: 'Lapicero de gel', category: 'Papelería', price: 4800, stock: 38, unit: 'unidad', supplier: 'Distribuciones El Mayorista' },
    { id: 3, code: '770003', name: 'Aretes de argolla', category: 'Bisutería', price: 7200, stock: 11, unit: 'unidad', supplier: 'Accesorios La 14' },
    { id: 4, code: '770004', name: 'Carrito de juguete', category: 'Juguetería', price: 9900, stock: 16, unit: 'unidad', supplier: 'Juguetes del Norte' },
    { id: 5, code: '770005', name: 'Cable dúplex por metro', category: 'Ferretería', price: 6500, stock: 80, unit: 'metro', supplier: 'Ferretería Central' },
    { id: 6, code: '770006', name: 'Zapatos casuales · par', category: 'Calzado', price: 48000, stock: 12, unit: 'unidad', supplier: 'Comercial Andina' },
    { id: 7, code: '770007', name: 'Sartén antiadherente', category: 'Cocina', price: 35000, stock: 14, unit: 'unidad', supplier: 'Hogar y Cocina S.A.S.' },
    { id: 8, code: '770008', name: 'Cuaderno argollado 100 hojas', category: 'Papelería', price: 6500, stock: 40, unit: 'unidad', supplier: 'Distribuciones El Mayorista' },
    { id: 9, code: '770009', name: 'Collar con dije', category: 'Bisutería', price: 12000, stock: 18, unit: 'unidad', supplier: 'Accesorios La 14' },
    { id: 10, code: '770010', name: 'Martillo de uña', category: 'Ferretería', price: 18000, stock: 20, unit: 'unidad', supplier: 'Ferretería Central' },
    { id: 11, code: '770011', name: 'Vestido infantil', category: 'Ropa', price: 38000, stock: 10, unit: 'unidad', supplier: 'Comercial Andina' },
    { id: 12, code: '770012', name: 'Pelota infantil', category: 'Juguetería', price: 8500, stock: 25, unit: 'unidad', supplier: 'Juguetes del Norte' },
    { id: 13, code: '770013', name: 'Taza de cerámica', category: 'Hogar', price: 9900, stock: 30, unit: 'unidad', supplier: 'Hogar y Cocina S.A.S.' },
    { id: 14, code: '770014', name: 'Medias para adulto · par', category: 'Ropa', price: 5500, stock: 36, unit: 'unidad', supplier: 'Comercial Andina' },
    { id: 15, code: '770015', name: 'Paquete de 6 lápices', category: 'Papelería', price: 4800, stock: 28, unit: 'unidad', supplier: 'Distribuciones El Mayorista' },
    { id: 16, code: '770016', name: 'Cinta de satín por metro', category: 'Hogar', price: 1500, stock: 100, unit: 'metro', supplier: 'Hogar y Cocina S.A.S.' },
  ];
  readonly users: PrototypeUser[] = [
    { name: 'Luifer Pérez', username: 'luifer.admin', role: 'Administrador', initials: 'LP', quickCode: 'CP-ADMIN-001', active: true },
    { name: 'María Gómez', username: 'maria.super', role: 'Supervisor', initials: 'MG', quickCode: 'CP-SUP-001', active: true },
    { name: 'Ana Torres', username: 'ana.caja', role: 'Cajero', initials: 'AT', quickCode: 'CP-CAJ-001', active: true },
  ];
  readonly suppliers = [
    'Accesorios La 14',
    'Comercial Andina',
    'Distribuciones El Mayorista',
    'Ferretería Central',
    'Hogar y Cocina S.A.S.',
    'Juguetes del Norte',
  ];
  private readonly _user = signal<PrototypeUser | null>(null);
  private readonly _cashOpen = signal(false);
  private readonly _openingAmount = signal(0);
  private readonly _cashOwner = signal<PrototypeUser | null>(null);
  private readonly _openedAt = signal<Date | null>(null);
  private readonly _cart = signal<CartLine[]>([]);
  private readonly _selectedProductId = signal<number | null>(null);
  private readonly _saleDiscount = signal(0);
  private readonly _customer = signal('Consumidor final');
  private readonly _completedSale = signal<CompletedSale | null>(null);
  private readonly _cashClosure = signal<CashClosure | null>(null);
  private nextSaleNumber = 149;
  private nextClosureNumber = 1;
  private soldQuantities = new Map<number, number>();
  private reservedQuantities = new Map<number, number>();
  private readonly _cashSales = signal(0);
  private readonly _cashIncomes = signal(0);
  private readonly _cashExpenses = signal(0);
  private readonly _customers = signal<CustomerRecord[]>([
    { id: 'CLI-001-000001', name: 'Laura Martínez', document: '52.418.903', phone: '300 555 0182', address: 'Carrera 18 # 12-40', balance: 0, status: 'Activo' },
    { id: 'CLI-001-000002', name: 'Ferretería El Centro', document: '901.224.118-6', phone: '604 555 0104', address: 'Calle 10 # 8-22', balance: 185000, status: 'Con crédito' },
    { id: 'CLI-001-000003', name: 'María Fernanda Ríos', document: '43.219.870', phone: '315 555 0148', address: 'Barrio El Carmen', balance: 92000, status: 'Con crédito' },
  ]);
  private readonly _credits = signal<CreditRecord[]>([
    { id: 'CR-001-000014', customer: 'Ferretería El Centro', total: 185000, paid: 0, createdAt: new Date('2026-09-04T10:20:00'), status: 'Pendiente', payments: [] },
  ]);
  private readonly _apartados = signal<ApartadoRecord[]>([]);
  private readonly _changes = signal<ProductChangeRecord[]>([]);
  private readonly _cashMovements = signal<CashMovement[]>([]);
  private readonly _operatorSessions = signal<OperatorSession[]>([]);
  private readonly _barcodes = signal<BarcodeRecord[]>([]);
  private readonly _printJobs = signal<PrintJob[]>([]);
  private readonly _purchaseOrders = signal<PurchaseOrderRecord[]>([
    {
      id: 'PC-001-000027', supplier: 'Distribuciones El Mayorista', status: 'Pendiente', createdAt: new Date('2026-09-07T09:00:00'),
      lines: [
        { productCode: '770002', productName: 'Lapicero de gel', requested: 40, received: 0 },
        { productCode: '770008', productName: 'Cuaderno argollado 100 hojas', requested: 24, received: 0 },
        { productCode: '770015', productName: 'Paquete de 6 lápices', requested: 30, received: 0 },
      ],
    },
    {
      id: 'PC-001-000028', supplier: 'Comercial Andina', status: 'Parcial', createdAt: new Date('2026-09-07T09:15:00'),
      lines: [
        { productCode: '770011', productName: 'Vestido infantil', requested: 12, received: 5 },
        { productCode: '770014', productName: 'Medias para adulto · par', requested: 24, received: 0 },
      ],
    },
  ]);
  private readonly _purchaseReceipts = signal<PurchaseReceiptRecord[]>([]);
  private readonly _salesHistory = signal<CompletedSale[]>([]);
  private readonly _apartadoMinimumPercent = signal(20);
  private readonly _apartadoDays = signal<number | null>(15);
  private readonly _defaultVatRate = signal<number | null>(19);
  private readonly _changeDays = signal(15);
  private readonly _shiftMode = signal<'INDIVIDUAL' | 'COMPARTIDO'>('INDIVIDUAL');
  private readonly _attempts = new Map<string, number>();
  private saleDiscountReason = '';
  openingNotes = '';
  paymentDraft: PaymentDraft[] | null = null;

  readonly user = this._user.asReadonly();
  readonly cashOpen = this._cashOpen.asReadonly();
  readonly cashOwner = this._cashOwner.asReadonly();
  readonly openedAt = this._openedAt.asReadonly();
  readonly openingAmount = this._openingAmount.asReadonly();
  readonly cart = this._cart.asReadonly();
  readonly selectedProductId = this._selectedProductId.asReadonly();
  readonly saleDiscount = this._saleDiscount.asReadonly();
  readonly customer = this._customer.asReadonly();
  readonly completedSale = this._completedSale.asReadonly();
  readonly cashClosure = this._cashClosure.asReadonly();
  readonly cashSales = this._cashSales.asReadonly();
  readonly cashIncomes = this._cashIncomes.asReadonly();
  readonly cashExpenses = this._cashExpenses.asReadonly();
  readonly customers = this._customers.asReadonly();
  readonly credits = this._credits.asReadonly();
  readonly apartados = this._apartados.asReadonly();
  readonly changes = this._changes.asReadonly();
  readonly cashMovements = this._cashMovements.asReadonly();
  readonly operatorSessions = this._operatorSessions.asReadonly();
  readonly barcodes = this._barcodes.asReadonly();
  readonly printJobs = this._printJobs.asReadonly();
  readonly purchaseOrders = this._purchaseOrders.asReadonly();
  readonly purchaseReceipts = this._purchaseReceipts.asReadonly();
  readonly salesHistory = this._salesHistory.asReadonly();
  readonly apartadoMinimumPercent = this._apartadoMinimumPercent.asReadonly();
  readonly apartadoDays = this._apartadoDays.asReadonly();
  readonly defaultVatRate = this._defaultVatRate.asReadonly();
  readonly changeDays = this._changeDays.asReadonly();
  readonly shiftMode = this._shiftMode.asReadonly();
  readonly subtotal = computed(() => Math.round(this._cart().reduce((sum, line) => sum + line.product.price * line.quantity, 0)));
  readonly lineDiscountTotal = computed(() => this._cart().reduce((sum, line) => sum + line.discount, 0));
  readonly discountTotal = computed(() => this.lineDiscountTotal() + this._saleDiscount());
  readonly total = computed(() => this.subtotal() - this.discountTotal());
  readonly vatIncluded = computed(() => {
    const rate = this._defaultVatRate();
    return rate === null ? 0 : Math.round((this.total() * rate) / (100 + rate));
  });
  readonly unitCount = computed(() => this._cart().reduce((sum, line) => sum + line.quantity, 0));
  readonly cashExpected = computed(() => this._openingAmount() + this._cashSales() + this._cashIncomes() - this._cashExpenses());

  login(username: string, password: string): string | null {
    const user = this.users.find((candidate) => candidate.username === username.trim().toLowerCase());
    if (!user || user.active === false) return 'La cuenta está bloqueada o no existe.';
    if (password !== 'demo123') {
      const attempts = (this._attempts.get(user.username) ?? 0) + 1;
      this._attempts.set(user.username, attempts);
      if (attempts >= 5) { user.active = false; return 'La cuenta fue bloqueada después de cinco intentos. Solicita reactivación a un rol superior.'; }
      return 'Usuario o contraseña incorrectos.';
    }
    this._attempts.delete(user.username);
    if (this._cashOpen() && this._cashOwner()?.username !== user.username) {
      return `El turno individual pertenece a ${this._cashOwner()?.name}. Ingresa con ese usuario para continuar.`;
    }
    this._user.set(user);
    return null;
  }

  reactivateUser(username: string): string | null {
    if (this._user()?.role !== 'Administrador') return 'Solo el administrador puede reactivar cuentas.';
    const user = this.users.find((candidate) => candidate.username === username.trim().toLowerCase());
    if (!user) return 'No se encontró el usuario.';
    user.active = true;
    this._attempts.delete(user.username);
    return null;
  }

  logout(): void {
    // Bloquea la sesión del operador; conserva el turno contable y el carrito en memoria.
    this._user.set(null);
  }

  openCash(amount: number, notes = ''): string | null {
    if (!this._user()) return 'Inicia sesión antes de abrir caja.';
    if (this._cashOpen()) return 'Esta caja ya tiene un turno abierto.';
    if (!Number.isSafeInteger(amount) || amount < 0) return 'Ingresa el fondo inicial en pesos enteros, mayor o igual a cero.';
    this._openingAmount.set(amount);
    this.openingNotes = notes.trim();
    this._cashOwner.set(this._user());
    this._openedAt.set(new Date());
    this._cashOpen.set(true);
    this._cashSales.set(0);
    this._cashIncomes.set(0);
    this._cashExpenses.set(0);
    this._cashClosure.set(null);
    return null;
  }

  closeCash(counted: number, reason = '', notes = ''): string | null {
    if (!this._cashOpen()) return 'No hay una caja abierta para cerrar.';
    if (this._cart().length && !this._completedSale()) return 'Finaliza o cancela la venta pendiente antes de cerrar caja.';
    if (!Number.isSafeInteger(counted) || counted < 0) return 'Ingresa el efectivo contado en pesos enteros, mayor o igual a cero.';
    const difference = counted - this.cashExpected();
    if (difference !== 0 && !reason.trim()) return 'Selecciona el motivo del descuadre.';
    const closure: CashClosure = {
      number: `CIE-001-${String(this.nextClosureNumber++).padStart(6, '0')}`,
      closedAt: new Date(), expected: this.cashExpected(), counted, difference,
      reason: reason.trim(), notes: notes.trim(), operator: this._user()?.name ?? 'Operador',
    };
    this._cashClosure.set(closure);
    this._cashOpen.set(false);
    this.paymentDraft = null;
    return null;
  }

  setApartadoMinimumPercent(value: number): string | null {
    if (this._user()?.role !== 'Administrador') return 'Solo el administrador puede cambiar el porcentaje mínimo del apartado.';
    if (!Number.isSafeInteger(value) || value < 1 || value > 100) return 'El porcentaje debe estar entre 1 y 100.';
    this._apartadoMinimumPercent.set(value);
    return null;
  }

  setApartadoDays(value: number | null): string | null {
    if (this._user()?.role !== 'Administrador') return 'Solo el administrador puede cambiar el plazo del apartado.';
    if (value !== null && (!Number.isSafeInteger(value) || value < 1 || value > 365)) return 'Los días límite deben estar entre 1 y 365 o quedar vacíos.';
    this._apartadoDays.set(value);
    return null;
  }

  setDefaultVatRate(value: number | null): string | null {
    if (this._user()?.role !== 'Administrador') return 'Solo el administrador puede cambiar el IVA predeterminado.';
    if (value !== null && (!Number.isFinite(value) || value < 0 || value > 100)) return 'El IVA debe estar entre 0 y 100 o quedar vacío.';
    this._defaultVatRate.set(value === null ? null : Math.round(value * 100) / 100);
    return null;
  }

  setChangeDays(value: number): string | null {
    if (this._user()?.role !== 'Administrador') return 'Solo el administrador puede cambiar el plazo de cambios.';
    if (!Number.isSafeInteger(value) || value < 1 || value > 365) return 'El plazo debe estar entre 1 y 365 días.';
    this._changeDays.set(value);
    return null;
  }

  setShiftMode(mode: 'INDIVIDUAL' | 'COMPARTIDO'): string | null {
    if (this._user()?.role !== 'Administrador') return 'Solo el administrador puede cambiar el modo de turno.';
    this._shiftMode.set(mode);
    return null;
  }

  registerCredit(customer: string, total: number): string | null {
    if (!customer.trim() || customer.trim() === 'Consumidor final') return 'Selecciona un cliente para registrar un crédito.';
    if (!Number.isSafeInteger(total) || total <= 0) return 'El total del crédito debe ser un valor entero mayor que cero.';
    const id = `CR-001-${String(this._credits().length + 15).padStart(6, '0')}`;
    this._credits.update((items) => [...items, { id, customer: customer.trim(), total, paid: 0, createdAt: new Date(), status: 'Pendiente', payments: [] }]);
    this.refreshCustomerBalance(customer.trim());
    return null;
  }

  registerSaleOnCredit(): string | null {
    if (this._completedSale()) return null;
    if (!this._user() || !this._cashOpen()) return 'Inicia sesión y abre caja para registrar la venta.';
    if (!this._cart().length || this.total() <= 0) return 'Agrega productos antes de registrar el crédito.';
    if (!this._customer().trim() || this._customer() === 'Consumidor final') return 'Selecciona un cliente para registrar una venta a crédito.';
    const sale: CompletedSale = {
      number: `VTA-001-${String(this.nextSaleNumber++).padStart(6, '0')}`,
      createdAt: new Date(), subtotal: this.subtotal(), discount: this.discountTotal(), vatIncluded: this.vatIncluded(), total: this.total(),
      customer: this._customer(), operator: this._user()!.name, payments: [], change: 0,
      itemCount: this._cart().length, unitCount: this.unitCount(), lines: this._cart().map((line) => ({ ...line, product: { ...line.product } })),
      discountReason: this.saleDiscountReason, status: 'Confirmada',
    };
    for (const line of this._cart()) this.soldQuantities.set(line.product.id, (this.soldQuantities.get(line.product.id) ?? 0) + line.quantity);
    const creditId = `CR-001-${String(this._credits().length + 15).padStart(6, '0')}`;
    const credit: CreditRecord = { id: creditId, saleNumber: sale.number, customer: this._customer(), total: sale.total, paid: 0, createdAt: new Date(), status: 'Pendiente', payments: [] };
    this._credits.update((items) => [...items, credit]);
    this.refreshCustomerBalance(credit.customer);
    this._salesHistory.update((items) => [...items, sale]);
    this._completedSale.set(sale);
    this.enqueuePrint('Recibo', sale.number, 1);
    this.paymentDraft = null;
    return null;
  }

  registerCreditPayment(id: string, amount: number, method: PaymentMethod, reference = ''): string | null {
    if (!this._cashOpen()) return 'Abre caja antes de registrar un abono.';
    const credit = this._credits().find((item) => item.id === id);
    if (!credit) return 'No se encontró el crédito.';
    if (credit.status === 'Anulado') return 'No se pueden registrar abonos en un crédito anulado.';
    if (!Number.isSafeInteger(amount) || amount <= 0 || amount > credit.total - credit.paid) return 'El abono supera el saldo pendiente.';
    if ((method === 'Transferencia' || method === 'Nequi') && !reference.trim()) return 'Ingresa la referencia del abono.';
    const payment: CreditPayment = { id: credit.payments.length + 1, amount, method, reference: reference.trim(), date: new Date(), operator: this._user()?.name ?? 'Operador' };
    this._credits.update((items) => items.map((item) => item.id === id ? { ...item, paid: item.paid + amount, status: item.paid + amount >= item.total ? 'Pagado' : 'Pendiente', payments: [...item.payments, payment] } : item));
    this.refreshCustomerBalance(credit.customer);
    if (method === 'Efectivo' && this._cashOpen()) this._cashIncomes.update((value) => value + amount);
    return null;
  }

  registerApartado(customer: string, productId: number, quantity: number, initialPayment: number, notes = ''): string | null {
    if (!customer.trim() || customer.trim() === 'Consumidor final') return 'Selecciona un cliente para crear el apartado.';
    const product = this.products.find((item) => item.id === productId);
    if (!product) return 'Selecciona un producto válido.';
    if (!this.isValidQuantity(product, quantity) || quantity > this.availableStock(product)) return 'La cantidad no está disponible.';
    const total = Math.round(product.price * quantity);
    const minimum = Math.ceil(total * this._apartadoMinimumPercent() / 100);
    if (!Number.isSafeInteger(initialPayment) || initialPayment < minimum || initialPayment > total) return `El abono inicial debe ser al menos ${this.formatCop(minimum)}.`;
    const id = `APT-001-${String(this._apartados().length + 1).padStart(6, '0')}`;
    const days = this._apartadoDays();
    const dueDate = days === null ? null : new Date();
    if (dueDate && days !== null) dueDate.setDate(dueDate.getDate() + days);
    this._apartados.update((items) => [...items, { id, customer: customer.trim(), product: product.name, items: [{ productId: product.id, quantity }], quantity, total, minimumPercent: this._apartadoMinimumPercent(), paid: initialPayment, dueDate, status: 'Activo', refund: 0, notes: notes.trim() }]);
    this.reservedQuantities.set(product.id, (this.reservedQuantities.get(product.id) ?? 0) + quantity);
    if (this._cashOpen()) this._cashIncomes.update((value) => value + initialPayment);
    return null;
  }

  registerApartadoFromCart(initialPayment: number, notes = ''): string | null {
    if (!this._cashOpen()) return 'Abre caja antes de registrar un apartado.';
    if (!this._cart().length || this.total() <= 0) return 'Agrega productos antes de crear el apartado.';
    if (this._customer() === 'Consumidor final') return 'Selecciona un cliente para crear el apartado.';
    const minimum = Math.ceil(this.total() * this._apartadoMinimumPercent() / 100);
    if (!Number.isSafeInteger(initialPayment) || initialPayment < minimum || initialPayment > this.total()) return `El abono inicial debe ser al menos ${this.formatCop(minimum)}.`;
    const days = this._apartadoDays();
    const dueDate = days === null ? null : new Date();
    if (dueDate && days !== null) dueDate.setDate(dueDate.getDate() + days);
    const id = `APT-001-${String(this._apartados().length + 1).padStart(6, '0')}`;
    const product = this._cart().map((line) => `${line.product.name} × ${line.quantity}`).join(', ');
    const reservedItems = this._cart().map((line) => ({ productId: line.product.id, quantity: line.quantity }));
    this._apartados.update((items) => [...items, { id, customer: this._customer(), product, items: reservedItems, quantity: this.unitCount(), total: this.total(), minimumPercent: this._apartadoMinimumPercent(), paid: initialPayment, dueDate, status: 'Activo', refund: 0, notes: notes.trim() }]);
    for (const line of reservedItems) this.reservedQuantities.set(line.productId, (this.reservedQuantities.get(line.productId) ?? 0) + line.quantity);
    this._cashIncomes.update((value) => value + initialPayment);
    this._completedSale.set(null);
    this.startNewSale();
    return null;
  }

  registerApartadoPayment(id: string, amount: number): string | null {
    if (!this._cashOpen()) return 'Abre caja antes de registrar un abono.';
    const apartado = this._apartados().find((item) => item.id === id);
    if (!apartado || apartado.status !== 'Activo') return 'El apartado no está disponible para abonos.';
    if (!Number.isSafeInteger(amount) || amount <= 0 || amount > apartado.total - apartado.paid) return 'El abono supera el saldo pendiente.';
    this._apartados.update((items) => items.map((item) => item.id === id ? { ...item, paid: item.paid + amount, status: item.paid + amount >= item.total ? 'Activo' : item.status } : item));
    if (this._cashOpen()) this._cashIncomes.update((value) => value + amount);
    return null;
  }

  cancelApartado(id: string, refund: number, notes = ''): string | null {
    if (this._user()?.role !== 'Administrador') return 'Solo el administrador puede cancelar un apartado.';
    if (refund > 0 && !this._cashOpen()) return 'Abre caja para registrar una devolución.';
    const apartado = this._apartados().find((item) => item.id === id);
    if (!apartado || apartado.status !== 'Activo') return 'El apartado no está activo.';
    if (!Number.isSafeInteger(refund) || refund < 0 || refund > apartado.paid) return 'La devolución no puede superar lo abonado.';
    this._apartados.update((items) => items.map((item) => item.id === id ? { ...item, status: 'Cancelado', refund, notes: notes.trim() || item.notes } : item));
    for (const line of apartado.items ?? []) this.reservedQuantities.set(line.productId, Math.max(0, (this.reservedQuantities.get(line.productId) ?? 0) - line.quantity));
    if (this._cashOpen() && refund > 0) this._cashExpenses.update((value) => value + refund);
    return null;
  }

  deliverApartado(id: string): string | null {
    const apartado = this._apartados().find((item) => item.id === id);
    if (!apartado || apartado.status !== 'Activo') return 'El apartado no está activo.';
    if (apartado.paid < apartado.total) return 'El apartado todavía tiene saldo pendiente.';
    this._apartados.update((items) => items.map((item) => item.id === id ? { ...item, status: 'Entregado' } : item));
    for (const line of apartado.items ?? []) {
      this.reservedQuantities.set(line.productId, Math.max(0, (this.reservedQuantities.get(line.productId) ?? 0) - line.quantity));
      this.soldQuantities.set(line.productId, (this.soldQuantities.get(line.productId) ?? 0) + line.quantity);
    }
    return null;
  }

  registerChange(data: Omit<ProductChangeRecord, 'id' | 'createdAt' | 'status'>): string | null {
    if (!this._cashOpen()) return 'Abre caja antes de registrar un cambio.';
    if (!data.saleNumber.trim() || !data.originalProduct.trim() || !data.replacementProduct.trim()) return 'Completa la venta y los productos del cambio.';
    if (!['Pago inmediato', 'Agregar al crédito', 'Sin diferencia'].includes(data.differenceMode)) return 'Selecciona cómo se manejará la diferencia.';
    if (data.differenceMode === 'Agregar al crédito' && (!data.customer.trim() || data.customer === 'Consumidor final')) return 'Selecciona el cliente antes de sumar la diferencia a crédito.';
    const sale = this._salesHistory().find((item) => item.number === data.saleNumber.trim());
    if (!sale) return 'No se encontró la venta original.';
    if (sale.status === 'Anulada') return 'No se puede cambiar una venta anulada.';
    const elapsedDays = Math.floor((Date.now() - sale.createdAt.getTime()) / 86_400_000);
    if (elapsedDays > this._changeDays()) return `El cambio supera el plazo de ${this._changeDays()} días.`;
    if (!Number.isSafeInteger(data.difference)) return 'La diferencia debe ser un valor entero en pesos.';
    const replacement = data.replacementProductCode ? this.findProduct(data.replacementProductCode) : this.products.find((product) => product.name === data.replacementProduct.trim());
    if (!replacement) return 'Escanea o selecciona un producto nuevo válido.';
    if (this.availableStock(replacement) < 1) return 'El producto nuevo no tiene existencias disponibles.';
    const returnedLine = sale.lines.find((line) => data.originalProductCode
      ? line.product.code === data.originalProductCode || line.product.barcode === data.originalProductCode
      : line.product.name === data.originalProduct.trim());
    if (!returnedLine) return 'El producto devuelto no pertenece a la venta original. Escanea un producto de esa venta.';
    const returnedProduct = returnedLine.product;
    const pendingCredit = this._credits().find((credit) => credit.saleNumber === sale.number && credit.status === 'Pendiente');
    let refund = 0;
    if (data.difference < 0) {
      const reduction = Math.abs(data.difference);
      const creditBalance = pendingCredit ? pendingCredit.total - pendingCredit.paid : 0;
      const creditReduction = Math.min(reduction, creditBalance);
      if (pendingCredit && creditReduction > 0) {
        this._credits.update((items) => items.map((credit) => credit.id === pendingCredit.id ? { ...credit, total: credit.total - creditReduction, status: credit.total - creditReduction <= credit.paid ? 'Pagado' : 'Pendiente' } : credit));
        this.refreshCustomerBalance(pendingCredit.customer);
      }
      refund = reduction - creditReduction;
      if (refund > 0) this._cashExpenses.update((value) => value + refund);
    }
    const id = `CAM-001-${String(this._changes().length + 1).padStart(6, '0')}`;
    this._changes.update((items) => [...items, {
      ...data,
      originalProduct: returnedProduct.name,
      replacementProduct: replacement.name,
      originalProductCode: returnedProduct.code,
      replacementProductCode: replacement.code,
      id,
      creditId: pendingCredit?.id,
      refund,
      createdAt: new Date(),
      status: 'Completado',
    }]);
    this.soldQuantities.set(returnedProduct.id, Math.max(0, (this.soldQuantities.get(returnedProduct.id) ?? 0) - 1));
    if (replacement) this.soldQuantities.set(replacement.id, (this.soldQuantities.get(replacement.id) ?? 0) + 1);
    if (data.difference > 0 && data.differenceMode === 'Agregar al crédito') {
      if (pendingCredit) {
        this._credits.update((items) => items.map((credit) => credit.id === pendingCredit.id ? { ...credit, total: credit.total + data.difference } : credit));
        this.refreshCustomerBalance(pendingCredit.customer);
      } else {
        this.registerCredit(data.customer, data.difference);
      }
    }
    if (data.difference > 0 && data.differenceMode === 'Pago inmediato' && this._cashOpen()) this._cashIncomes.update((value) => value + data.difference);
    return null;
  }

  addCashMovement(type: CashMovement['type'], amount: number, concept: string): string | null {
    if (this._user()?.role !== 'Administrador') return 'Solo el administrador puede registrar gastos, ingresos y sangrías.';
    if (!this._cashOpen()) return 'Abre caja antes de registrar un movimiento.';
    if (!Number.isSafeInteger(amount) || amount <= 0 || !concept.trim()) return 'Ingresa un valor entero y un concepto.';
    const movement: CashMovement = { id: `MOV-001-${String(this._cashMovements().length + 1).padStart(6, '0')}`, type, amount, concept: concept.trim(), createdAt: new Date(), operator: this._user()?.name ?? 'Administrador' };
    this._cashMovements.update((items) => [...items, movement]);
    if (type === 'Ingreso') this._cashIncomes.update((value) => value + amount); else this._cashExpenses.update((value) => value + amount);
    return null;
  }

  identifyOperator(code: string): string | null {
    if (!this._cashOpen()) return 'Abre caja antes de identificar un operador.';
    if (this._shiftMode() !== 'COMPARTIDO') return 'La terminal está configurada para turno individual.';
    const normalized = code.trim().toUpperCase();
    const user = this.users.find((candidate) => candidate.active !== false && candidate.quickCode?.toUpperCase() === normalized);
    if (!user) return 'No encontramos una credencial de operador activa.';
    this._operatorSessions.update((items) => items.map((session) => session.endedAt ? session : { ...session, endedAt: new Date() }));
    this._user.set(user);
    this._operatorSessions.update((items) => [...items, { id: `SES-${items.length + 1}`, username: user.username, name: user.name, codeLast4: normalized.slice(-4), startedAt: new Date() }]);
    return null;
  }

  endOperatorSession(): string | null {
    const username = this._user()?.username;
    if (!username) return 'No hay un operador identificado.';
    this._operatorSessions.update((items) => items.map((item) => item.username === username && !item.endedAt ? { ...item, endedAt: new Date() } : item));
    this._user.set(null);
    return null;
  }

  generateBarcode(productCode: string): string | null {
    if (this._user()?.role !== 'Administrador') return 'Solo el administrador puede generar códigos.';
    const product = this.products.find((item) => item.code === productCode);
    if (!product) return 'Selecciona un producto.';
    const value = this.toEan13(product.code);
    product.barcode = value;
    this._barcodes.update((items) => [...items, { id: `BAR-${items.length + 1}`, productCode, format: 'EAN-13', value, createdAt: new Date(), subjectType: 'Producto', subjectName: product.name }]);
    return value;
  }

  generateCredentialBarcode(username: string): string | null {
    if (this._user()?.role !== 'Administrador') return 'Solo el administrador puede generar códigos.';
    const user = this.users.find((candidate) => candidate.username === username);
    if (!user?.quickCode) return 'Selecciona un usuario con credencial configurada.';
    const value = user.quickCode;
    this._barcodes.update((items) => [...items, { id: `BAR-${items.length + 1}`, productCode: username, format: 'Code 128', value, createdAt: new Date(), subjectType: 'Credencial', subjectName: user.name }]);
    return value;
  }

  enqueuePrint(type: PrintJob['type'], reference: string, copies = 1): string | null {
    if (!reference.trim() || !Number.isSafeInteger(copies) || copies < 1 || copies > 99) return 'Indica una referencia y un número de copias válido.';
    this._printJobs.update((items) => [...items, { id: `IMP-${items.length + 1}`, type, reference: reference.trim(), copies, status: 'Pendiente', createdAt: new Date() }]);
    return null;
  }

  completePrint(id: string): string | null {
    if (!this._printJobs().some((job) => job.id === id)) return 'No se encontró el trabajo de impresión.';
    this._printJobs.update((items) => items.map((job) => job.id === id ? { ...job, status: 'Impreso' } : job));
    return null;
  }

  reprintSale(number: string): string | null {
    const sale = this._salesHistory().find((item) => item.number === number);
    if (!sale) return 'No se encontró la venta.';
    return this.enqueuePrint('Recibo', number, 1);
  }

  voidSale(number: string, reason: string): string | null {
    if (!['Administrador', 'Supervisor'].includes(this._user()?.role ?? '')) return 'Se requiere autorización de supervisor o administrador.';
    const sale = this._salesHistory().find((item) => item.number === number);
    if (!sale || sale.status === 'Anulada') return 'La venta no está disponible para anular.';
    if (!reason.trim()) return 'Ingresa el motivo de la anulación.';
    this._salesHistory.update((items) => items.map((item) => item.number === number ? { ...item, status: 'Anulada' } : item));
    this._credits.update((items) => items.map((credit) => credit.saleNumber === number ? { ...credit, status: 'Anulado' } : credit));
    for (const credit of this._credits().filter((item) => item.saleNumber === number)) this.refreshCustomerBalance(credit.customer);
    for (const line of sale.lines) this.soldQuantities.set(line.product.id, Math.max(0, (this.soldQuantities.get(line.product.id) ?? 0) - line.quantity));
    this._cashSales.update((value) => Math.max(0, value - sale.payments.filter((payment) => payment.method === 'Efectivo').reduce((sum, payment) => sum + payment.amount, 0)));
    return null;
  }

  registerPurchaseOrder(supplier: string, requestedLines: Array<{ productCode: string; quantity: number }>): string | null {
    if (!['Administrador', 'Supervisor'].includes(this._user()?.role ?? '')) return 'Se requiere permiso de supervisor o administrador para registrar pedidos.';
    const normalizedSupplier = supplier.trim();
    if (!this.suppliers.includes(normalizedSupplier)) return 'Selecciona un proveedor registrado.';
    if (!requestedLines.length) return 'Selecciona al menos un producto para el pedido.';
    const productCodes = new Set<string>();
    const lines: PurchaseOrderLine[] = [];
    for (const requestedLine of requestedLines) {
      const product = this.products.find((item) => item.code === requestedLine.productCode);
      if (!product || product.supplier !== normalizedSupplier) return 'Todos los productos deben pertenecer al proveedor seleccionado.';
      if (productCodes.has(product.code)) return 'No repitas productos dentro del mismo pedido.';
      if (!Number.isSafeInteger(requestedLine.quantity) || requestedLine.quantity <= 0) return 'Las cantidades del pedido deben ser números enteros mayores que cero.';
      productCodes.add(product.code);
      lines.push({ productCode: product.code, productName: product.name, requested: requestedLine.quantity, received: 0 });
    }
    this._purchaseOrders.update((items) => [...items, { id: `PC-001-${String(items.length + 29).padStart(6, '0')}`, supplier: normalizedSupplier, lines, status: 'Pendiente', createdAt: new Date() }]);
    return null;
  }

  receivePurchase(id: string, receivedLines: Array<{ productCode: string; quantity: number; unitCost: number; newSalePrice: number }>): string | null {
    if (!['Administrador', 'Supervisor'].includes(this._user()?.role ?? '')) return 'Se requiere permiso de supervisor o administrador para recibir compras.';
    const order = this._purchaseOrders().find((item) => item.id === id);
    if (!order) return 'No se encontró el pedido.';
    const effectiveLines = receivedLines.filter((line) => line.quantity !== 0);
    if (!effectiveLines.length) return 'Ingresa la cantidad recibida de al menos un producto.';
    const validated: Array<{ orderLine: PurchaseOrderLine; product: Product; quantity: number; unitCost: number; previousSalePrice: number; newSalePrice: number }> = [];
    const productCodes = new Set<string>();
    for (const receivedLine of effectiveLines) {
      const orderLine = order.lines.find((line) => line.productCode === receivedLine.productCode);
      const product = this.products.find((item) => item.code === receivedLine.productCode);
      if (!orderLine || !product || productCodes.has(receivedLine.productCode)) return 'La recepción contiene un producto que no pertenece al pedido.';
      if (!Number.isSafeInteger(receivedLine.quantity) || receivedLine.quantity <= 0 || receivedLine.quantity > orderLine.requested - orderLine.received) {
        return `La cantidad recibida de ${orderLine.productName} supera lo pendiente o no es válida.`;
      }
      if (!Number.isSafeInteger(receivedLine.unitCost) || receivedLine.unitCost <= 0) return `Ingresa el costo unitario recibido de ${orderLine.productName}.`;
      if (!Number.isSafeInteger(receivedLine.newSalePrice) || receivedLine.newSalePrice <= 0) return `Ingresa el nuevo precio de venta de ${orderLine.productName}.`;
      productCodes.add(receivedLine.productCode);
      validated.push({ orderLine, product, quantity: receivedLine.quantity, unitCost: receivedLine.unitCost, previousSalePrice: product.price, newSalePrice: receivedLine.newSalePrice });
    }
    for (const item of validated) {
      item.product.stock += item.quantity;
      item.product.price = item.newSalePrice;
    }
    this._purchaseOrders.update((items) => items.map((item) => {
      if (item.id !== id) return item;
      const lines = item.lines.map((line) => {
        const reception = validated.find((entry) => entry.orderLine.productCode === line.productCode);
        return reception ? { ...line, received: line.received + reception.quantity } : line;
      });
      const status = lines.every((line) => line.received === line.requested) ? 'Recibida' : 'Parcial';
      return { ...item, lines, status };
    }));
    const receiptLines: PurchaseReceiptLine[] = validated.map((item) => ({
      productCode: item.product.code,
      productName: item.product.name,
      quantity: item.quantity,
      unitCost: item.unitCost,
      previousSalePrice: item.previousSalePrice,
      newSalePrice: item.newSalePrice,
    }));
    this._purchaseReceipts.update((items) => [...items, {
      id: `REC-001-${String(items.length + 1).padStart(6, '0')}`,
      orderId: order.id,
      supplier: order.supplier,
      lines: receiptLines,
      createdAt: new Date(),
    }]);
    return null;
  }

  availableStock(product: Product): number {
    const current = this.products.find((candidate) => candidate.id === product.id) ?? product;
    return current.stock - (this.soldQuantities.get(product.id) ?? 0) - (this.reservedQuantities.get(product.id) ?? 0);
  }

  private isValidQuantity(_product: Pick<Product, 'unit'>, quantity: number, allowZero = false): boolean {
    return Number.isSafeInteger(quantity) && (allowZero ? quantity >= 0 : quantity > 0);
  }

  searchProducts(term: string): Product[] {
    const normalized = term.trim().toLocaleLowerCase('es');
    if (!normalized) return [];
    return this.products.filter((product) => product.code.includes(normalized) || product.barcode?.includes(normalized) || product.name.toLocaleLowerCase('es').includes(normalized) || product.category.toLocaleLowerCase('es').includes(normalized));
  }

  findProduct(term: string): Product | undefined {
    const exact = this.products.find((product) => product.code === term.trim());
    if (exact) return exact;
    const barcode = this.products.find((product) => product.barcode === term.trim());
    if (barcode) return barcode;
    const matches = this.searchProducts(term);
    return matches.length === 1 ? matches[0] : undefined;
  }

  registerProduct(data: Omit<Product, 'id'>): string | null {
    if (this._user()?.role !== 'Administrador') return 'Solo el administrador puede crear o editar productos.';
    const code = data.code.trim() || this.generateProductCode();
    if (this.products.some((product) => product.code === code)) return 'Ya existe un producto con ese código.';
    if (!data.name.trim() || !data.category.trim()) return 'El producto debe tener nombre y categoría.';
    if (data.supplier && !this.suppliers.includes(data.supplier)) return 'Selecciona un proveedor registrado o deja el producto sin proveedor.';
    if (!Number.isSafeInteger(data.price) || data.price <= 0 || !this.isValidQuantity(data, data.stock, true)) return 'Precio y existencia deben ser valores enteros válidos.';
    const id = Math.max(...this.products.map((product) => product.id), 0) + 1;
    this.products.push({ ...data, id, code, name: data.name.trim(), category: data.category.trim() });
    return null;
  }

  generateProductCode(): string {
    const numericCodes = this.products.filter((product) => /^770\d{3}$/.test(product.code)).map((product) => Number(product.code));
    let candidate = Math.max(770000, ...numericCodes) + 1;
    while (this.products.some((product) => product.code === String(candidate))) candidate += 1;
    return String(candidate);
  }

  registerUser(user: PrototypeUser): string | null {
    if (this._user()?.role !== 'Administrador') return 'Solo el administrador puede administrar usuarios y roles.';
    if (!user.name.trim() || !user.username.trim()) return 'El usuario debe tener nombre y nombre de acceso.';
    if (this.users.some((candidate) => candidate.username === user.username.trim().toLowerCase())) return 'Ya existe un usuario con ese nombre de acceso.';
    this.users.push({ ...user, name: user.name.trim(), username: user.username.trim().toLowerCase() });
    return null;
  }

  adjustInventory(productId: number, quantity: number): string | null {
    if (this._user()?.role !== 'Administrador') return 'Solo el administrador puede registrar ajustes de inventario.';
    const product = this.products.find((candidate) => candidate.id === productId);
    if (!product) return 'Selecciona un producto válido.';
    if (!Number.isSafeInteger(quantity) || quantity === 0) return 'El ajuste debe ser un entero distinto de cero; usa un valor negativo para retirar existencias.';
    const minimum = (this.soldQuantities.get(product.id) ?? 0) + (this.reservedQuantities.get(product.id) ?? 0);
    if (product.stock + quantity < minimum) return 'El ajuste no puede dejar existencias disponibles por debajo de cero.';
    product.stock += quantity;
    return null;
  }

  addProduct(product: Product): string | null {
    if (this._completedSale()) return 'Inicia una nueva venta para agregar productos.';
    if (this.availableStock(product) < 1) return 'Producto sin existencias disponibles.';
    const existing = this._cart().find((line) => line.product.id === product.id);
    if (existing) {
      const error = this.setQuantity(product.id, existing.quantity + 1);
      if (error) return error;
    } else {
      this._cart.update((lines) => [...lines, { product: { ...product }, quantity: 1, discount: 0 }]);
    }
    this.paymentDraft = null;
    this._selectedProductId.set(product.id);
    return null;
  }

  selectProduct(productId: number): void {
    this._selectedProductId.set(productId);
  }

  setQuantity(productId: number, quantity: number): string | null {
    if (this._completedSale()) return 'Esta venta ya está confirmada.';
    const line = this._cart().find((item) => item.product.id === productId);
    if (!line) return 'Selecciona un producto.';
    if (!this.isValidQuantity(line.product, quantity)) return 'La cantidad debe ser un número entero mayor que cero, incluso para productos vendidos por metro.';
    if (quantity > this.availableStock(line.product)) return `Solo quedan ${this.availableStock(line.product)} disponibles de ${line.product.name}.`;
    if (line.discount >= line.product.price * quantity || this._saleDiscount() >= this.subtotal() + (quantity - line.quantity) * line.product.price) {
      return 'Reduce o retira el descuento antes de reducir la cantidad.';
    }
    this._cart.update((lines) => lines.map((item) => item.product.id === productId ? { ...item, quantity } : item));
    this.paymentDraft = null;
    return null;
  }

  removeSelected(): string | null {
    if (this._completedSale()) return 'Esta venta ya está confirmada.';
    const line = this._cart().find((item) => item.product.id === this._selectedProductId());
    if (!line) return 'Selecciona primero el producto que quieres quitar.';
    const remainingSubtotal = this.subtotal() - line.product.price * line.quantity;
    if (remainingSubtotal > 0 && this._saleDiscount() >= remainingSubtotal) return 'Reduce o retira el descuento total antes de quitar este producto.';
    this._cart.update((lines) => lines.filter((item) => item.product.id !== line.product.id));
    this._selectedProductId.set(this._cart()[0]?.product.id ?? null);
    if (this._cart().length === 0) { this._saleDiscount.set(0); this.saleDiscountReason = ''; }
    this.paymentDraft = null;
    return null;
  }

  applyProductDiscount(amount: number, reason = ''): string | null {
    if (this._completedSale()) return 'Esta venta ya está confirmada.';
    const selected = this._cart().find((line) => line.product.id === this._selectedProductId());
    if (!selected) return 'Selecciona primero un producto.';
    if (!Number.isSafeInteger(amount) || amount < 0 || amount >= selected.product.price * selected.quantity) return 'El descuento debe ser un valor entero menor que el subtotal del producto.';
    this._saleDiscount.set(0);
    this.saleDiscountReason = '';
    this._cart.update((lines) => lines.map((line) => line.product.id === selected.product.id ? { ...line, discount: amount, discountReason: reason.trim() } : line));
    this.paymentDraft = null;
    return null;
  }

  applyWholeSaleDiscount(amount: number, reason = ''): string | null {
    if (this._completedSale()) return 'Esta venta ya está confirmada.';
    if (!Number.isSafeInteger(amount) || amount < 0 || amount >= this.subtotal()) return 'El descuento debe ser un valor entero menor que el subtotal de la venta.';
    this._cart.update((lines) => lines.map((line) => ({ ...line, discount: 0, discountReason: '' })));
    this._saleDiscount.set(amount);
    this.saleDiscountReason = reason.trim();
    this.paymentDraft = null;
    return null;
  }

  registerCustomer(name: string, document: string, phone = '', address = ''): string | null {
    const normalizedName = name.trim();
    const normalizedDocument = document.trim();
    if (!normalizedName || !normalizedDocument) return 'Ingresa el nombre y el número de cédula o NIT.';
    const comparableDocument = this.normalizeDocument(normalizedDocument);
    if (this._customers().some((customer) => this.normalizeDocument(customer.document) === comparableDocument)) return 'Ya existe un cliente con ese número de documento.';
    const customer: CustomerRecord = {
      id: `CLI-001-${String(this._customers().length + 1).padStart(6, '0')}`,
      name: normalizedName,
      document: normalizedDocument,
      phone: phone.trim(),
      address: address.trim(),
      balance: 0,
      status: 'Activo',
    };
    this._customers.update((items) => [...items, customer]);
    return null;
  }

  searchCustomers(term: string): CustomerRecord[] {
    const normalized = term.trim().toLocaleLowerCase('es');
    const documentTerm = this.normalizeDocument(term);
    if (!normalized) return this._customers();
    return this._customers().filter((customer) =>
      customer.name.toLocaleLowerCase('es').includes(normalized)
      || this.normalizeDocument(customer.document).includes(documentTerm)
      || customer.phone.toLocaleLowerCase('es').includes(normalized),
    );
  }

  findCustomerByDocument(document: string): CustomerRecord | undefined {
    const normalized = this.normalizeDocument(document);
    return this._customers().find((customer) => this.normalizeDocument(customer.document) === normalized);
  }

  setCustomer(customer: string): void {
    this._customer.set(customer || 'Consumidor final');
  }

  paymentError(payments: PaymentAllocation[]): string | null {
    if (!payments.length || payments.length > 3) return 'Agrega entre uno y tres medios de pago.';
    const methods = new Set<string>();
    for (const payment of payments) {
      if (!['Efectivo', 'Transferencia', 'Tarjeta', 'Nequi'].includes(payment.method) || methods.has(payment.method)) return 'Usa cada medio una sola vez.';
      methods.add(payment.method);
      if (!Number.isSafeInteger(payment.amount) || payment.amount <= 0) return 'Asigna valores positivos en pesos enteros a cada medio.';
      if (payment.method === 'Efectivo' && (!Number.isSafeInteger(payment.received) || payment.received! < payment.amount)) return 'Revisa el efectivo entregado.';
      if ((payment.method === 'Transferencia' || payment.method === 'Nequi') && !payment.reference?.trim()) return `Ingresa la referencia de ${payment.method.toLowerCase()}.`;
    }
    const assigned = payments.reduce((sum, payment) => sum + payment.amount, 0);
    if (assigned !== this.total()) return assigned < this.total() ? 'Todavía falta asignar parte del total.' : 'Los valores asignados superan el total.';
    return null;
  }

  completeSale(payments: PaymentAllocation[]): CompletedSale {
    const previous = this._completedSale();
    if (previous) return previous;
    if (!this._user() || !this._cashOpen()) throw new Error('Inicia sesión y abre caja para vender.');
    if (!this._cart().length || this.total() <= 0) throw new Error('Agrega productos antes de cobrar.');
    for (const line of this._cart()) {
      if (line.quantity > this.availableStock(line.product)) throw new Error(`La existencia de ${line.product.name} cambió. Revisa la cantidad antes de confirmar.`);
    }
    const error = this.paymentError(payments);
    if (error) throw new Error(error);
    const sale: CompletedSale = {
      number: `VTA-001-${String(this.nextSaleNumber++).padStart(6, '0')}`,
      createdAt: new Date(),
      subtotal: this.subtotal(), discount: this.discountTotal(), vatIncluded: this.vatIncluded(), total: this.total(),
      customer: this._customer(), operator: this._user()!.name,
      payments: payments.map((payment) => ({ ...payment })),
      change: payments.filter((payment) => payment.method === 'Efectivo').reduce((sum, payment) => sum + (payment.received! - payment.amount), 0),
      itemCount: this._cart().length, unitCount: this.unitCount(),
      lines: this._cart().map((line) => ({ ...line, product: { ...line.product } })),
      discountReason: this.saleDiscountReason,
      status: 'Confirmada',
    };
    for (const line of this._cart()) this.soldQuantities.set(line.product.id, (this.soldQuantities.get(line.product.id) ?? 0) + line.quantity);
    this._cashSales.update((value) => value + payments.filter((payment) => payment.method === 'Efectivo').reduce((sum, payment) => sum + payment.amount, 0));
    this._salesHistory.update((items) => [...items, sale]);
    this._completedSale.set(sale);
    this.enqueuePrint('Recibo', sale.number, 1);
    this.paymentDraft = null;
    return sale;
  }

  startNewSale(): void {
    this._cart.set([]);
    this._selectedProductId.set(null);
    this._saleDiscount.set(0);
    this.saleDiscountReason = '';
    this._customer.set('Consumidor final');
    this._completedSale.set(null);
    this.paymentDraft = null;
  }

  formatCop(value: number): string {
    return `$ ${Math.round(Number.isFinite(value) ? value : 0).toLocaleString('es-CO')}`;
  }

  private toEan13(code: string): string {
    const base = `${code.replace(/\D/g, '')}000000000000`.slice(0, 12);
    const checksum = base.split('').reduce((sum, digit, index) => sum + Number(digit) * (index % 2 === 0 ? 1 : 3), 0);
    return `${base}${(10 - (checksum % 10)) % 10}`;
  }

  private normalizeDocument(value: string): string {
    return value.normalize('NFKD').replace(/[^\p{L}\p{N}]/gu, '').toLocaleLowerCase('es');
  }

  private refreshCustomerBalance(customerName: string): void {
    const normalized = customerName.trim().toLocaleLowerCase('es');
    const balance = this._credits().filter((credit) => credit.customer.trim().toLocaleLowerCase('es') === normalized && credit.status === 'Pendiente').reduce((sum, credit) => sum + credit.total - credit.paid, 0);
    this._customers.update((items) => items.map((customer) => customer.name.trim().toLocaleLowerCase('es') === normalized ? { ...customer, balance, status: balance > 0 ? 'Con crédito' : 'Activo' } : customer));
  }
}

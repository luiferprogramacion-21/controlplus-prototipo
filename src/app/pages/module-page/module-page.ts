import { Component, computed, HostListener, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Icon } from '../../layout/icon';
import { PrototypeStateService } from '../../core/prototype-state.service';
import { Product, PrototypeUser, PurchaseOrderRecord, UserRole } from '../../core/models';

type ModuleKey = 'dashboard' | 'catalogo' | 'inventario' | 'clientes' | 'compras' | 'reportes' | 'administracion' | 'configuracion' | 'soporte';

interface ModuleConfig {
  title: string;
  subtitle: string;
  action: string;
  icon: string;
}

interface OrderDraftLine {
  productCode: string;
  productName: string;
  available: number;
  selected: boolean;
  quantity: number;
}

@Component({
  selector: 'app-module-page',
  imports: [FormsModule, RouterLink, Icon],
  templateUrl: './module-page.html',
})
export class ModulePage {
  readonly state = inject(PrototypeStateService);
  private readonly route = inject(ActivatedRoute);
  readonly module = signal<ModuleKey>((this.route.snapshot.data['module'] as ModuleKey | undefined) ?? 'dashboard');
  readonly filter = signal('');
  readonly inventoryFilter = signal<'Todos' | 'Bajo mínimo' | 'Sin existencias'>('Todos');
  readonly feedback = signal('');
  readonly dateFrom = signal('2026-09-01');
  readonly dateTo = signal('2026-09-07');
  readonly showForm = signal(false);
  readonly formError = signal('');
  private readonly catalogRevision = signal(0);
  formName = '';
  formCode = '';
  formBarcodeSource: 'AUTO' | 'EXISTENTE' = 'AUTO';
  formCategory = 'Ropa';
  formUnit: Product['unit'] = 'unidad';
  formPrice = 0;
  formStock = 0;
  formDocument = '';
  formPhone = '';
  formAddress = '';
  formSupplier = '';
  formProductCode = '770001';
  formQuantity = 1;
  formOrderLines: OrderDraftLine[] = [];
  formRole: UserRole = 'Cajero';
  configShiftMode: 'INDIVIDUAL' | 'COMPARTIDO' = 'INDIVIDUAL';
  configApartadoMinimum = 20;
  configApartadoDays: number | null = 15;
  configChangeDays = 15;
  configVatRate: number | null = 19;
  configSaveError = '';

  readonly config: Record<ModuleKey, ModuleConfig> = {
    dashboard: { title: 'Dashboard', subtitle: 'Resumen operativo de Baratísimo', action: 'Actualizar', icon: 'dashboard' },
    catalogo: { title: 'Catálogo', subtitle: 'Productos, categorías y precios', action: 'Nuevo producto', icon: 'catalog' },
    inventario: { title: 'Inventario', subtitle: 'Existencias y movimientos', action: 'Registrar ajuste', icon: 'inventory' },
    clientes: { title: 'Clientes', subtitle: 'Datos de contacto y cartera', action: 'Nuevo cliente', icon: 'customers' },
    compras: { title: 'Compras', subtitle: 'Pedidos a proveedores y recepción', action: 'Nuevo pedido', icon: 'purchases' },
    reportes: { title: 'Reportes', subtitle: 'Indicadores operativos y financieros', action: 'Aplicar filtros', icon: 'reports' },
    administracion: { title: 'Administración', subtitle: 'Usuarios, roles y permisos', action: 'Nuevo usuario', icon: 'settings' },
    configuracion: { title: 'Configuración', subtitle: 'Parámetros de la operación', action: 'Guardar cambios', icon: 'settings' },
    soporte: { title: 'Soporte', subtitle: 'Estado del sistema y respaldos', action: 'Crear respaldo', icon: 'settings' },
  };

  constructor() {
    this.loadConfiguration();
  }

  readonly catalogProducts = computed(() => {
    this.catalogRevision();
    const term = this.filter().trim().toLocaleLowerCase('es');
    if (!term) return this.state.products;
    return this.state.products.filter((product) => [product.code, product.name, product.category]
      .some((value) => value.toLocaleLowerCase('es').includes(term)));
  });

  readonly inventoryProducts = computed(() => {
    this.catalogRevision();
    const filter = this.inventoryFilter();
    return this.state.products.filter((product) => {
      const available = this.state.availableStock(product);
      if (filter === 'Bajo mínimo') return available <= 12;
      if (filter === 'Sin existencias') return available <= 0;
      return true;
    });
  });

  readonly supplierGroups = computed(() => {
    this.catalogRevision();
    const groups = new Map<string, Product[]>();
    for (const product of this.state.products) {
      if (!product.supplier || this.state.availableStock(product) > 12) continue;
      const products = groups.get(product.supplier) ?? [];
      products.push(product);
      groups.set(product.supplier, products);
    }
    return [...groups.entries()].map(([supplier, products]) => ({ supplier, products }));
  });

  get current(): ModuleConfig { return this.config[this.module()]; }
  get dashboardSales(): number { return 17; }
  get dashboardTotal(): number { return 684500; }
  get lowStockCount(): number { return this.state.products.filter((product) => this.state.availableStock(product) <= 12).length; }
  get totalInventoryValue(): number { return this.state.products.reduce((sum, product) => sum + this.state.availableStock(product) * product.price, 0); }
  get filteredCustomers() {
    const term = this.filter().trim().toLocaleLowerCase('es');
    return !term ? this.state.customers() : this.state.searchCustomers(term);
  }
  get filteredPurchases(): PurchaseOrderRecord[] {
    const term = this.filter().trim().toLocaleLowerCase('es');
    const orders = this.state.purchaseOrders();
    return !term ? orders : orders.filter((purchase) => `${purchase.id} ${purchase.supplier} ${purchase.status} ${purchase.lines.map((line) => line.productName).join(' ')}`.toLocaleLowerCase('es').includes(term));
  }

  format(value: number): string { return this.state.formatCop(value); }

  purchaseRequested(order: PurchaseOrderRecord): number {
    return order.lines.reduce((sum, line) => sum + line.requested, 0);
  }

  purchaseReceived(order: PurchaseOrderRecord): number {
    return order.lines.reduce((sum, line) => sum + line.received, 0);
  }

  purchaseProductNames(order: PurchaseOrderRecord): string {
    return order.lines.map((line) => line.productName).join(', ');
  }

  purchaseDate(order: PurchaseOrderRecord): string {
    return new Intl.DateTimeFormat('es-CO').format(order.createdAt);
  }

  loadOrderLines(supplier: string): void {
    this.formSupplier = supplier;
    this.formOrderLines = this.state.products
      .filter((product) => product.supplier === supplier)
      .map((product) => {
        const available = this.state.availableStock(product);
        return {
          productCode: product.code,
          productName: product.name,
          available,
          selected: available <= 12,
          quantity: Math.max(1, 20 - available),
        };
      });
  }

  executeAction(): void {
    if (['catalogo', 'inventario', 'clientes', 'compras', 'administracion'].includes(this.module())) {
      this.openForm();
      return;
    }
    if (this.module() === 'configuracion') {
      this.saveConfiguration();
      return;
    }
    const messages: Record<ModuleKey, string> = {
      dashboard: 'Indicadores actualizados.',
      catalogo: 'Formulario de producto listo para la siguiente etapa.',
      inventario: 'Ajuste de inventario listo para registrar.',
      clientes: 'Formulario de cliente listo para la siguiente etapa.',
      compras: 'Pedido de compra listo para seleccionar productos por proveedor.',
      reportes: `Reporte actualizado del ${this.dateFrom()} al ${this.dateTo()}.`,
      administracion: 'Formulario de usuario listo para asignar permisos.',
      configuracion: 'Configuración preparada para guardar.',
      soporte: 'Respaldo solicitado. Verifica el estado antes de cerrar la ventana.',
    };
    this.feedback.set(messages[this.module()]);
  }

  openForm(preferredSupplier = ''): void {
    this.formError.set('');
    this.formName = '';
    this.formCode = '';
    this.formBarcodeSource = 'AUTO';
    this.formCategory = 'Ropa';
    this.formUnit = 'unidad';
    this.formPrice = 0;
    this.formStock = 0;
    this.formDocument = '';
    this.formPhone = '';
    this.formAddress = '';
    this.formSupplier = preferredSupplier || this.state.suppliers[0] || '';
    this.formProductCode = this.state.products[0]?.code ?? '770001';
    this.formQuantity = 1;
    this.formOrderLines = [];
    this.formRole = 'Cajero';
    if (this.module() === 'compras') this.loadOrderLines(this.formSupplier);
    this.showForm.set(true);
  }

  saveConfiguration(): void {
    this.configSaveError = '';
    const errors = [
      this.state.setShiftMode(this.configShiftMode),
      this.state.setApartadoMinimumPercent(this.configApartadoMinimum),
      this.state.setApartadoDays(this.configApartadoDays),
      this.state.setChangeDays(this.configChangeDays),
      this.state.setDefaultVatRate(this.configVatRate),
    ].filter((error): error is string => Boolean(error));
    if (errors.length) {
      this.configSaveError = errors[0];
      this.feedback.set('No se guardaron todos los parámetros. Revisa el mensaje.');
      return;
    }
    this.feedback.set('Configuración guardada.');
  }

  loadConfiguration(): void {
    this.configShiftMode = this.state.shiftMode();
    this.configApartadoMinimum = this.state.apartadoMinimumPercent();
    this.configApartadoDays = this.state.apartadoDays();
    this.configChangeDays = this.state.changeDays();
    this.configVatRate = this.state.defaultVatRate();
  }

  closeForm(): void { this.showForm.set(false); this.formError.set(''); }

  submitForm(): void {
    const module = this.module();
    if (module === 'catalogo') {
      if (!this.formName.trim() || (this.formBarcodeSource === 'EXISTENTE' && !this.formCode.trim()) || this.formPrice <= 0 || !Number.isSafeInteger(this.formStock) || this.formStock < 0) {
        this.formError.set('Completa nombre, precio y existencia con valores enteros válidos. Si el producto ya trae código, escanéalo.');
        return;
      }
      const code = this.formBarcodeSource === 'AUTO' ? '' : this.formCode;
      const error = this.state.registerProduct({ code, name: this.formName, category: this.formCategory, price: this.formPrice, stock: this.formStock, unit: this.formUnit, supplier: this.formSupplier || undefined });
      if (error) { this.formError.set(error); return; }
      this.catalogRevision.update((value) => value + 1);
      const registered = this.state.products.at(-1)!;
      this.feedback.set(`Producto ${registered.name} registrado con código ${registered.code}.`);
      this.closeForm();
      return;
    }
    if (module === 'inventario') {
      const product = this.state.products.find((candidate) => candidate.code === this.formProductCode);
      if (!product || !Number.isSafeInteger(this.formQuantity) || this.formQuantity === 0) { this.formError.set('Selecciona un producto e ingresa una cantidad distinta de cero.'); return; }
      const error = this.state.adjustInventory(product.id, this.formQuantity);
      if (error) { this.formError.set(error); return; }
      this.catalogRevision.update((value) => value + 1);
      this.feedback.set(`Ajuste aplicado a ${product.name}.`);
      this.closeForm();
      return;
    }
    if (module === 'clientes') {
      const error = this.state.registerCustomer(this.formName, this.formDocument, this.formPhone, this.formAddress);
      if (error) { this.formError.set(error); return; }
      this.feedback.set(`Cliente ${this.formName.trim()} registrado.`);
      this.closeForm();
      return;
    }
    if (module === 'compras') {
      const lines = this.formOrderLines.filter((line) => line.selected).map((line) => ({ productCode: line.productCode, quantity: line.quantity }));
      const orderError = this.state.registerPurchaseOrder(this.formSupplier, lines);
      if (orderError) { this.formError.set(orderError); return; }
      const order = this.state.purchaseOrders().at(-1)!;
      this.feedback.set(`Pedido ${order.id} creado para ${order.supplier} con ${order.lines.length} producto(s).`);
      this.closeForm();
      return;
    }
    if (module === 'administracion') {
      if (!this.formName.trim() || !this.formCode.trim()) { this.formError.set('Ingresa nombre y usuario de acceso.'); return; }
      const user: PrototypeUser = { name: this.formName.trim(), username: this.formCode.trim().toLowerCase(), role: this.formRole, initials: this.formName.trim().split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase() };
      const error = this.state.registerUser(user);
      if (error) { this.formError.set(error); return; }
      this.feedback.set(`Usuario ${user.name} registrado con rol ${user.role}.`);
      this.closeForm();
    }
  }

  clearFeedback(): void { this.feedback.set(''); }

  @HostListener('input', ['$event'])
  syncFormInput(event: Event): void {
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) return;
    const value = target.value;
    switch (target.id) {
      case 'form-product-name': case 'form-customer-name': case 'form-user-name': this.formName = value; break;
      case 'form-product-code': case 'form-user-login': this.formCode = value; break;
      case 'form-product-price': this.formPrice = Number(value); break;
      case 'form-product-stock': this.formStock = Number(value); break;
      case 'form-customer-document': this.formDocument = value; break;
      case 'form-customer-phone': this.formPhone = value; break;
      case 'form-customer-address': this.formAddress = value; break;
      case 'form-purchase-quantity': case 'form-inventory-quantity': this.formQuantity = Number(value); break;
    }
  }
}

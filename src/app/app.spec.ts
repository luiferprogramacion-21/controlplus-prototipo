import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { routes } from './app.routes';
import { PrototypeStateService } from './core/prototype-state.service';

describe('Recorrido navegable mediante formularios y teclado', () => {
  let harness: RouterTestingHarness;
  let state: PrototypeStateService;
  let router: Router;

  beforeEach(async () => {
    TestBed.configureTestingModule({ providers: [provideRouter(routes)] });
    state = TestBed.inject(PrototypeStateService);
    router = TestBed.inject(Router);
    harness = await RouterTestingHarness.create('/ingresar');
  });

  const root = (): HTMLElement => harness.fixture.nativeElement;
  function field(selector: string, value: string, type = 'input'): void {
    const input = root().querySelector<HTMLInputElement>(selector)!;
    expect(input).toBeTruthy();
    input.value = value;
    input.dispatchEvent(new Event(type, { bubbles: true }));
    harness.detectChanges();
  }
  function button(text: string): HTMLButtonElement {
    const match = [...root().querySelectorAll('button')].find((element) => element.textContent?.trim() === text);
    expect(match, `Botón ${text}`).toBeTruthy();
    return match!;
  }
  async function submit(selector: string): Promise<void> {
    const form = root().querySelector<HTMLFormElement>(selector)!;
    expect(form).toBeTruthy();
    const event = new Event('submit', { bubbles: true, cancelable: true });
    form.dispatchEvent(event);
    expect(event.defaultPrevented, 'El formulario debe impedir la recarga nativa').toBe(true);
    await harness.fixture.whenStable();
    harness.detectChanges();
  }
  async function enterPos(): Promise<void> {
    await submit('.login-form');
    expect(router.url).toBe('/operacion/caja/apertura');
    await submit('.opening-form');
    expect(router.url).toBe('/operacion/ventas/nueva');
  }
  async function scan(code: string): Promise<void> { field('#product-search', code); await submit('.scanner'); }

  it('redirige accesos directos sin sesión, sin caja o sin carrito', async () => {
    await harness.navigateByUrl('/operacion/ventas/cobro');
    expect(router.url).toBe('/ingresar');
    state.login('luifer.admin', 'demo123');
    await harness.navigateByUrl('/operacion/ventas/nueva');
    expect(router.url).toBe('/operacion/caja/apertura');
    state.openCash(0);
    await harness.navigateByUrl('/operacion/ventas/cobro');
    expect(router.url).toBe('/operacion/ventas/nueva');
  });

  it('muestra error de acceso y bloquea un fondo inicial negativo', async () => {
    field('#password', 'incorrecta');
    await submit('.login-form');
    expect(router.url).toBe('/ingresar');
    expect(root().textContent).toContain('Usuario o contraseña incorrectos');
    field('#password', 'demo123');
    await submit('.login-form');
    field('#initial-amount', '-1');
    await submit('.opening-form');
    expect(state.cashOpen()).toBe(false);
  });

  it('escanea productos, muestra errores y conserva cliente y carrito al volver del cobro', async () => {
    await enterPos();
    await scan('770001'); await scan('770001');
    await scan('no-existe');
    expect(state.cart()).toHaveLength(1);
    expect(state.cart()[0].quantity).toBe(2);
    expect(root().textContent).toContain('No encontramos');
    root().querySelector<HTMLButtonElement>('#customer-selector')!.click(); harness.detectChanges();
    field('#customer-search-pos', '52418903');
    expect(root().querySelectorAll('.customer-result')).toHaveLength(1);
    root().querySelector<HTMLButtonElement>('.customer-result')!.click(); harness.detectChanges();
    button('Cobrar · F9').click();
    await harness.fixture.whenStable(); harness.detectChanges();
    field('#received-1', '60000');
    button('Volver · Esc').click();
    await harness.fixture.whenStable(); harness.detectChanges();
    expect(root().querySelector('#customer-selector')?.textContent).toContain('Laura Martínez');
    button('Cobrar · F9').click();
    await harness.fixture.whenStable(); harness.detectChanges();
    expect((root().querySelector('#received-1') as HTMLInputElement).value).toBe('60000');
  });

  it('envía el descuento opcional y desactiva atajos del POS dentro del diálogo', async () => {
    await enterPos(); await scan('770001');
    button('Desc. producto').click(); harness.detectChanges();
    field('#discount-amount', '700');
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'F9', bubbles: true, cancelable: true }));
    expect(router.url).toBe('/operacion/ventas/nueva');
    await submit('.discount-sheet__card');
    expect(state.discountTotal()).toBe(700);
    expect(root().querySelector('[role=dialog]')).toBeNull();
    expect(state.cart()[0].discountReason).toBe('');
  });

  it('agregar un medio conserva lo escrito por el cajero y confirma un cobro combinado una sola vez', async () => {
    await enterPos(); await scan('770001');
    button('Cobrar · F9').click(); await harness.fixture.whenStable(); harness.detectChanges();
    expect(root().querySelector('#payment-error')).toBeNull();
    await submit('.checkout-main');
    expect(root().textContent).toContain('Asigna valores positivos en pesos enteros a cada medio.');
    expect(document.activeElement?.id).toBe('received-1');
    expect(state.completedSale()).toBeNull();
    field('#received-1', '10000');
    button('+ Pago mixto').click(); harness.detectChanges();
    expect((root().querySelector('#amount-2') as HTMLInputElement).value).toBe('18500');
    field('#reference-2', '843921');
    expect(button('Confirmar venta · Enter').disabled).toBe(false);
    await submit('.checkout-main');
    await submit('.checkout-main');
    await vi.waitFor(() => expect(router.url).toBe('/operacion/ventas/confirmada'));
    harness.detectChanges();
    expect(state.completedSale()?.change).toBe(0);
    expect(state.availableStock(state.products[0])).toBe(23);
    expect(root().textContent).toContain('Comprobante listo');
    button('Nueva venta · Enter').click(); await harness.fixture.whenStable(); harness.detectChanges();
    expect(router.url).toBe('/operacion/ventas/nueva');
    expect(state.cart()).toHaveLength(0);
  });

  it('recalcula el medio restante cuando cambia el efectivo de un pago mixto', async () => {
    await enterPos(); await scan('770002');
    button('Cobrar · F9').click(); await harness.fixture.whenStable(); harness.detectChanges();
    field('#received-1', '3000');
    button('+ Pago mixto').click(); harness.detectChanges();
    expect((root().querySelector('#amount-2') as HTMLInputElement).value).toBe('1800');
    field('#received-1', '1000');
    expect((root().querySelectorAll('.payment-result strong')[0] as HTMLElement).textContent).toContain('$ 1.000');
    expect((root().querySelector('#amount-2') as HTMLInputElement).value).toBe('3800');
    field('#reference-2', 'TRX-1000');
    await submit('.checkout-main');
    await vi.waitFor(() => expect(router.url).toBe('/operacion/ventas/confirmada'));
    expect(state.completedSale()?.payments[0].amount).toBe(1000);
    expect(state.completedSale()?.payments[1].amount).toBe(3800);
  });

  it('muestra el saldo esperado antes del conteo y conserva la diferencia del cierre', async () => {
    await enterPos();
    await harness.navigateByUrl('/operacion/caja/cierre');
    expect(router.url).toBe('/operacion/caja/cierre');
    expect(root().textContent).toContain('SALDO ESPERADO EN EFECTIVO');
    expect(root().textContent).toContain('$ 200.000');
    field('#counted-cash', '200000');
    await submit('.closing-form');
    expect(state.cashOpen()).toBe(false);
    expect(state.cashClosure()?.expected).toBe(200000);
    expect(root().textContent).toContain('Caja cerrada');
  });

  it('permite crear un producto desde el formulario del catálogo', async () => {
    await enterPos();
    root().querySelector<HTMLButtonElement>('[aria-label="Abrir menú"]')!.click(); harness.detectChanges();
    root().querySelector<HTMLAnchorElement>('a[aria-label="Catálogo"]')!.click();
    await harness.fixture.whenStable(); harness.detectChanges();
    button('Nuevo producto').click(); harness.detectChanges();
    field('#form-product-name', 'Pañuelo estampado');
    field('#form-product-price', '12000');
    field('#form-product-stock', '8');
    await submit('.module-form');
    expect(state.products.some((product) => product.name === 'Pañuelo estampado' && product.code === '770017')).toBe(true);
    expect(root().textContent).toContain('Pañuelo estampado');
  });

  it('crea un cliente con dirección desde el crédito del POS y lo selecciona automáticamente', async () => {
    await enterPos(); await scan('770003');
    button('Registrar crédito').click(); harness.detectChanges();
    expect(root().textContent).toContain('Cliente para la venta a crédito');
    button('+ Nuevo cliente').click(); harness.detectChanges();
    field('#customer-name-pos', 'Carlos Rojas');
    field('#customer-document-pos', '1.091.234.567');
    field('#customer-phone-pos', '310 555 0101');
    field('#customer-address-pos', 'Calle 8 # 4-12');
    await submit('.customer-create-form');
    expect(state.findCustomerByDocument('1091234567')?.address).toBe('Calle 8 # 4-12');
    expect(state.customer()).toBe('Carlos Rojas');
    expect(state.completedSale()).not.toBeNull();
    await vi.waitFor(() => expect(router.url).toBe('/operacion/ventas/confirmada'));
    expect(state.credits().at(-1)?.customer).toBe('Carlos Rojas');
  });

  it('busca el cliente por cédula al iniciar un apartado y continúa con el abono inicial', async () => {
    await enterPos(); await scan('770004');
    button('Crear apartado').click(); harness.detectChanges();
    field('#customer-search-pos', '52418903');
    root().querySelector<HTMLButtonElement>('.customer-result')!.click(); harness.detectChanges();
    expect(root().textContent).toContain('Mínimo inicial (20 %)');
    await submit('.discount-sheet__card');
    expect(state.apartados().at(-1)?.customer).toBe('Laura Martínez');
    expect(state.apartados().at(-1)?.paid).toBe(1980);
  });

  it('permite retirar una unidad mediante un ajuste negativo de inventario', async () => {
    await enterPos();
    await harness.navigateByUrl('/operacion/inventario'); harness.detectChanges();
    const product = state.products[0];
    const before = state.availableStock(product);
    button('Registrar ajuste').click(); harness.detectChanges();
    field('#form-inventory-quantity', '-1');
    await submit('.module-form');
    expect(state.availableStock(product)).toBe(before - 1);
    expect(root().textContent).toContain('Ajuste aplicado');
  });

  it('crea pedidos y recepciones como listas de productos por proveedor', async () => {
    await enterPos();
    await harness.navigateByUrl('/operacion/compras'); harness.detectChanges();
    button('Nuevo pedido').click(); harness.detectChanges();
    const orderChecks = [...root().querySelectorAll<HTMLInputElement>('.order-lines input[type="checkbox"]')];
    expect(orderChecks.length).toBeGreaterThan(1);
    orderChecks.forEach((checkbox) => { if (!checkbox.checked) checkbox.click(); });
    harness.detectChanges();
    await submit('.module-form');
    expect(state.purchaseOrders().at(-1)?.lines.length).toBe(orderChecks.length);
    await harness.navigateByUrl('/operacion/recepciones'); harness.detectChanges();
    button('Registrar recepción').click(); harness.detectChanges();
    expect(root().querySelectorAll('.order-lines tbody tr').length).toBeGreaterThan(1);
    button('Recibir todo lo pendiente').click(); harness.detectChanges();
    [...root().querySelectorAll<HTMLInputElement>('.receipt-cost')].forEach((input, index) => {
      input.value = String(8000 + index * 1000);
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });
    await harness.fixture.whenStable(); harness.detectChanges();
    await submit('.module-form');
    expect(state.purchaseReceipts(), root().querySelector('.field-error')?.textContent ?? 'La recepción no se guardó').toHaveLength(1);
    expect(state.purchaseOrders().find((order) => order.id === state.purchaseReceipts()[0].orderId)?.status).toBe('Recibida');
    expect(state.purchaseReceipts()[0].lines.every((line) => line.unitCost > 0)).toBe(true);
  });

  it('pide confirmar la cancelación y permite regresar sin borrar productos', async () => {
    await enterPos(); await scan('770003');
    button('Cancelar venta').click(); harness.detectChanges();
    button('Continuar venta').click(); harness.detectChanges();
    expect(state.cart()).toHaveLength(1);
    button('Cancelar venta').click(); harness.detectChanges();
    button('Confirmar cancelación').click(); harness.detectChanges();
    expect(state.cart()).toHaveLength(0);
  });

  it('abre el menú bajo demanda, conserva el carrito y lo oculta al navegar', async () => {
    await enterPos(); await scan('770001');
    expect(root().querySelector('#main-navigation')).toBeNull();
    const toggle = root().querySelector<HTMLButtonElement>('[aria-label="Abrir menú"]')!;
    toggle.click(); harness.detectChanges();
    expect(root().querySelector('#main-navigation')).not.toBeNull();
    expect(root().querySelector('.shell-content')?.hasAttribute('inert')).toBe(true);
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    root().querySelector<HTMLAnchorElement>('a[aria-label="Caja"]')!.click();
    await harness.fixture.whenStable(); harness.detectChanges();
    expect(router.url).toBe('/operacion/caja/apertura');
    expect(root().querySelector('#main-navigation')).toBeNull();
    expect(state.cart()).toHaveLength(1);
    expect(root().querySelector('.shell-content')?.hasAttribute('inert')).toBe(false);
  });

  it('Escape cierra el menú sin salir del cobro y los atajos del POS no se ejecutan desde el menú', async () => {
    await enterPos(); await scan('770001');
    root().querySelector<HTMLButtonElement>('[aria-label="Abrir menú"]')!.click(); harness.detectChanges();
    root().querySelector('#main-navigation')!.dispatchEvent(new KeyboardEvent('keydown', { key: 'F9', bubbles: true, cancelable: true }));
    expect(router.url).toBe('/operacion/ventas/nueva');
    root().querySelector<HTMLButtonElement>('[aria-label="Cerrar menú"]')!.click(); harness.detectChanges();
    button('Cobrar · F9').click(); await harness.fixture.whenStable(); harness.detectChanges();
    root().querySelector<HTMLButtonElement>('[aria-label="Abrir menú"]')!.click(); harness.detectChanges();
    root().querySelector('#main-navigation')!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
    await harness.fixture.whenStable(); harness.detectChanges();
    expect(root().querySelector('#main-navigation')).toBeNull();
    expect(router.url).toBe('/operacion/ventas/cobro');
  });

  it('navega a los módulos de gestión y conserva el catálogo de Baratísimo', async () => {
    await enterPos();
    root().querySelector<HTMLButtonElement>('[aria-label="Abrir menú"]')!.click(); harness.detectChanges();
    root().querySelector<HTMLAnchorElement>('a[aria-label="Catálogo"]')!.click();
    await harness.fixture.whenStable(); harness.detectChanges();
    expect(router.url).toBe('/operacion/catalogo');
    expect(root().textContent).toContain('Productos');
    expect(root().textContent).toContain('Camiseta básica de algodón');
    root().querySelector<HTMLButtonElement>('[aria-label="Abrir menú"]')!.click(); harness.detectChanges();
    root().querySelector<HTMLAnchorElement>('a[aria-label="Compras"]')!.click();
    await harness.fixture.whenStable(); harness.detectChanges();
    expect(router.url).toBe('/operacion/compras');
    expect(root().textContent).toContain('Pedidos por proveedor');
    expect(root().textContent).toContain('Distribuciones El Mayorista');
  });

  it('permite buscar el catálogo de Baratísimo y agregar una lista larga sin poner los botones dentro de ella', async () => {
    await enterPos();
    button('Ver productos').click(); harness.detectChanges();
    expect(root().querySelectorAll('.catalog-result').length).toBe(16);
    expect(root().textContent).toContain('Calzado');
    expect(root().textContent).toContain('Papelería');
    for (const product of state.products) await scan(product.code);
    expect(root().querySelectorAll('.cart-table tbody tr').length).toBe(16);
    expect(root().querySelector('.cart-table .cart-actions')).toBeNull();
    expect(root().querySelector('.pos-footer .cart-actions')).not.toBeNull();
    expect(root().textContent).not.toMatch(/Prueba rápida|demostración|Prototipo|Confirmación segura/);
  });
});

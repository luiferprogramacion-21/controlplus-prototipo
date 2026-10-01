import { PrototypeStateService } from './prototype-state.service';

describe('Reglas de la venta de demostración', () => {
  let state: PrototypeStateService;
  beforeEach(() => {
    state = new PrototypeStateService();
    state.login('luifer.admin', 'demo123');
    state.openCash(200000);
  });

  it('rechaza credenciales incorrectas y conserva turno y carrito al bloquear', () => {
    state.addProduct(state.products[0]);
    state.logout();
    expect(state.user()).toBeNull();
    expect(state.cashOpen()).toBe(true);
    expect(state.cart()).toHaveLength(1);
    expect(state.login('luifer.admin', 'incorrecta')).toBeTruthy();
    expect(state.login('otro.admin', 'demo123')).toBeTruthy();
    expect(state.login('ana.caja', 'demo123')).toContain('turno individual');
    expect(state.login('luifer.admin', 'demo123')).toBeNull();
  });

  it('no permite abrir otra vez el mismo turno ni fondos inválidos', () => {
    expect(state.openCash(1000)).toBeTruthy();
    const unopened = new PrototypeStateService();
    unopened.login('ana.caja', 'demo123');
    for (const amount of [-1, NaN, Infinity, 2.5]) expect(unopened.openCash(amount)).toBeTruthy();
    expect(unopened.cashOpen()).toBe(false);
    expect(unopened.openCash(0)).toBeNull();
  });

  it('repetir un código acumula cantidades y rechaza fracciones y exceso de stock', () => {
    const product = state.products[0];
    state.addProduct(product); state.addProduct(product);
    expect(state.cart()).toHaveLength(1);
    expect(state.cart()[0].quantity).toBe(2);
    for (const quantity of [0, -1, 1.25, NaN, product.stock + 1]) expect(state.setQuantity(product.id, quantity)).toBeTruthy();
    expect(state.cart()[0].quantity).toBe(2);
  });

  it('vende los productos por metro únicamente en cantidades enteras', () => {
    const product = state.products.find((item) => item.unit === 'metro')!;
    state.addProduct(product);
    expect(state.setQuantity(product.id, 2)).toBeNull();
    expect(state.cart()[0].quantity).toBe(2);
    expect(state.total()).toBe(product.price * 2);
    expect(state.setQuantity(product.id, 1.25)).toContain('entero');
  });

  it('una búsqueda ambigua pide selección en lugar de añadir el primer resultado', () => {
    expect(state.searchProducts('77000').length).toBeGreaterThan(1);
    expect(state.findProduct('77000')).toBeUndefined();
    expect(state.findProduct('770003')?.name).toBe('Aretes de argolla');
  });

  it('conserva descuentos de otros productos y sustituye el modo al descontar la venta completa', () => {
    state.addProduct(state.products[0]);
    state.applyProductDiscount(700, 'Empaque');
    state.addProduct(state.products[1]);
    state.applyProductDiscount(300);
    expect(state.discountTotal()).toBe(1000);
    expect(state.cart()[0].discountReason).toBe('Empaque');
    state.applyWholeSaleDiscount(500);
    expect(state.lineDiscountTotal()).toBe(0);
    expect(state.total()).toBe(32800);
    state.applyProductDiscount(100);
    expect(state.saleDiscount()).toBe(0);
    expect(state.discountTotal()).toBe(100);
  });

  it('rechaza descuentos inválidos y evita un total negativo al editar el carrito', () => {
    state.addProduct(state.products[0]); state.addProduct(state.products[1]);
    for (const amount of [-100, NaN, 0.5, 33300]) expect(state.applyWholeSaleDiscount(amount)).toBeTruthy();
    state.applyWholeSaleDiscount(30000);
    expect(state.removeSelected()).toBeTruthy();
    expect(state.total()).toBe(3300);
  });

  it('bloquea pagos incompletos, excesivos, duplicados y con importes fraccionarios', () => {
    state.addProduct(state.products[0]);
    expect(state.paymentError([{ method: 'Efectivo', amount: 28500, received: 28000 }])).toBeTruthy();
    expect(state.paymentError([{ method: 'Transferencia', amount: 28500, reference: '' }])).toBeTruthy();
    expect(state.paymentError([{ method: 'Tarjeta', amount: 28501 }])).toBeTruthy();
    expect(state.paymentError([{ method: 'Tarjeta', amount: 28499 }])).toBeTruthy();
    expect(state.paymentError([{ method: 'Tarjeta', amount: 28500.5 }])).toBeTruthy();
    expect(state.paymentError([{ method: 'Tarjeta', amount: 10000 }, { method: 'Tarjeta', amount: 18500 }])).toBeTruthy();
    expect(() => state.completeSale([])).toThrow();
    expect(state.completedSale()).toBeNull();
  });

  it('combina pagos, calcula cambio, impide duplicar y asigna otro consecutivo a la siguiente venta', () => {
    state.addProduct(state.products[0]);
    const allocations = [
      { method: 'Efectivo' as const, amount: 10000, received: 20000 },
      { method: 'Transferencia' as const, amount: 18500, reference: '843921' },
    ];
    const sale = state.completeSale(allocations);
    expect(sale.total).toBe(28500);
    expect(sale.change).toBe(10000);
    expect(state.completeSale(allocations)).toBe(sale);
    expect(state.availableStock(state.products[0])).toBe(23);
    state.startNewSale();
    state.addProduct(state.products[0]);
    const next = state.completeSale([{ method: 'Efectivo', amount: 28500, received: 30000 }]);
    expect(next.number).toBe('VTA-001-000150');
    expect(sale.number).toBe('VTA-001-000149');
    expect(sale.lines[0].quantity).toBe(1);
    expect(state.availableStock(state.products[0])).toBe(22);
  });

  it('calcula el saldo esperado de caja y exige motivo cuando existe descuadre', () => {
    state.addProduct(state.products[0]);
    state.completeSale([{ method: 'Efectivo', amount: 28500, received: 30000 }]);
    state.startNewSale();
    expect(state.cashExpected()).toBe(228500);
    expect(state.closeCash(228000)).toContain('motivo');
    expect(state.cashOpen()).toBe(true);
    expect(state.closeCash(228000, 'Conteo de efectivo', 'Se revisó el cajón')).toBeNull();
    expect(state.cashOpen()).toBe(false);
    expect(state.cashClosure()?.difference).toBe(-500);
  });

  it('registra ventas a crédito y apartados desde el carrito', () => {
    state.setCustomer('Laura Martínez');
    state.addProduct(state.products[0]);
    expect(state.registerSaleOnCredit()).toBeNull();
    expect(state.credits().at(-1)?.saleNumber).toBe(state.salesHistory().at(-1)?.number);
    expect(state.completedSale()?.payments).toHaveLength(0);
    state.startNewSale();
    state.addProduct(state.products[1]);
    state.setCustomer('Laura Martínez');
    expect(state.registerApartadoFromCart(1000)).toBeNull();
    expect(state.apartados().at(-1)?.paid).toBe(1000);
    expect(state.availableStock(state.products[1])).toBe(37);
    expect(state.registerApartadoPayment(state.apartados().at(-1)!.id, 3800)).toBeNull();
    expect(state.apartados().at(-1)?.paid).toBe(4800);
    expect(state.deliverApartado(state.apartados().at(-1)!.id)).toBeNull();
    expect(state.availableStock(state.products[1])).toBe(37);
  });

  it('permite cambio de una venta dentro del plazo y suma la diferencia a crédito', () => {
    state.setCustomer('Laura Martínez');
    state.addProduct(state.products[0]);
    const sale = state.completeSale([{ method: 'Efectivo', amount: 28500, received: 28500 }]);
    state.startNewSale();
    expect(state.registerChange({ saleNumber: sale.number, customer: 'Laura Martínez', originalProduct: state.products[0].name, replacementProduct: state.products[1].name, originalProductCode: state.products[0].code, replacementProductCode: state.products[1].code, difference: 1000, differenceMode: 'Agregar al crédito', reason: '' })).toBeNull();
    expect(state.changes()).toHaveLength(1);
    expect(state.changes().at(-1)?.originalProductCode).toBe(state.products[0].code);
    expect(state.changes().at(-1)?.replacementProductCode).toBe(state.products[1].code);
    expect(state.credits().at(-1)?.total).toBe(1000);
    expect(state.availableStock(state.products[0])).toBe(24);
    expect(state.availableStock(state.products[1])).toBe(37);
  });

  it('gestiona turno compartido, códigos, impresión, recepción parcial y movimientos', () => {
    expect(state.setShiftMode('COMPARTIDO')).toBeNull();
    expect(state.identifyOperator('CP-CAJ-001')).toBeNull();
    expect(state.operatorSessions()).toHaveLength(1);
    state.logout(); state.login('luifer.admin', 'demo123');
    expect(state.generateBarcode('770001')).toMatch(/^770001\d{7}$/);
    expect(state.barcodes().at(-1)?.format).toBe('EAN-13');
    expect(state.generateCredentialBarcode('ana.caja')).toBe('CP-CAJ-001');
    expect(state.barcodes().at(-1)?.format).toBe('Code 128');
    expect(state.enqueuePrint('Etiqueta', '7700010000008', 2)).toBeNull();
    expect(state.printJobs()).toHaveLength(1);
    expect(state.completePrint(state.printJobs()[0].id)).toBeNull();
    expect(state.printJobs()[0].status).toBe('Impreso');
    const order = state.purchaseOrders()[0];
    expect(order.lines.length).toBeGreaterThan(1);
    const firstProduct = state.products.find((product) => product.code === order.lines[0].productCode)!;
    const previousSalePrice = firstProduct.price;
    expect(state.receivePurchase(order.id, [
      { productCode: order.lines[0].productCode, quantity: 5, unitCost: 12000, newSalePrice: previousSalePrice + 500 },
      { productCode: order.lines[1].productCode, quantity: 3, unitCost: 8000, newSalePrice: 15000 },
    ])).toBeNull();
    expect(state.purchaseOrders()[0].status).toBe('Parcial');
    expect(state.purchaseOrders()[0].lines[0].received).toBe(5);
    expect(state.purchaseOrders()[0].lines[1].received).toBe(3);
    expect(state.purchaseReceipts()).toHaveLength(1);
    expect(state.purchaseReceipts()[0].lines[0].previousSalePrice).toBe(previousSalePrice);
    expect(state.purchaseReceipts()[0].lines[0].unitCost).toBe(12000);
    expect(firstProduct.price).toBe(previousSalePrice + 500);
    expect(state.addCashMovement('Gasto', 1000, 'Compra de bolsas')).toBeNull();
    expect(state.cashExpected()).toBe(199000);
  });

  it('registra clientes con dirección y los encuentra aunque la cédula tenga puntos', () => {
    expect(state.registerCustomer('Carlos Rojas', '1.091.234.567', '3105550101', 'Calle 8 # 4-12')).toBeNull();
    expect(state.findCustomerByDocument('1091234567')?.name).toBe('Carlos Rojas');
    expect(state.searchCustomers('1091234567')[0].address).toBe('Calle 8 # 4-12');
    expect(state.registerCustomer('Duplicado', '1091234567')).toContain('Ya existe');
  });

  it('genera el código del producto, acepta código existente y permite retirar inventario con -1', () => {
    const generatedCode = state.generateProductCode();
    expect(state.registerProduct({ code: '', name: 'Hebilla decorativa', category: 'Bisutería', price: 3500, stock: 8, unit: 'unidad', supplier: 'Accesorios La 14' })).toBeNull();
    expect(state.products.at(-1)?.code).toBe(generatedCode);
    expect(state.registerProduct({ code: '8901234567890', name: 'Producto con código de fábrica', category: 'Hogar', price: 9000, stock: 4, unit: 'unidad', supplier: 'Hogar y Cocina S.A.S.' })).toBeNull();
    const product = state.products[0];
    const before = state.availableStock(product);
    expect(state.adjustInventory(product.id, -1)).toBeNull();
    expect(state.availableStock(product)).toBe(before - 1);
    expect(state.adjustInventory(product.id, -0.5)).toContain('entero');
  });

  it('crea un solo pedido con varios productos del mismo proveedor', () => {
    const supplier = 'Comercial Andina';
    const products = state.products.filter((product) => product.supplier === supplier).slice(0, 2);
    expect(state.registerPurchaseOrder(supplier, products.map((product, index) => ({ productCode: product.code, quantity: 5 + index })))).toBeNull();
    const order = state.purchaseOrders().at(-1)!;
    expect(order.supplier).toBe(supplier);
    expect(order.lines).toHaveLength(2);
    expect(new Set(order.lines.map((line) => line.productCode)).size).toBe(2);
  });
});

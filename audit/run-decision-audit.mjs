// Diagnóstico de reglas pendientes. No cambia datos reales ni archivos del proyecto.
// Ejecutar desde el proyecto: node audit/run-decision-audit.mjs
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import '@angular/compiler';

const source = readFileSync(new URL('../src/app/core/prototype-state.service.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext, experimentalDecorators: true },
}).outputText.replace(/from ['"]@angular\/core['"]/g, `from ${JSON.stringify(import.meta.resolve('@angular/core'))}`);
const { PrototypeStateService } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);

function openedState() {
  const state = new PrototypeStateService();
  state.login('luifer.admin', 'demo123');
  state.openCash(200000);
  return state;
}
function creditSale(state) {
  state.setCustomer('Laura Martínez');
  state.addProduct(state.products[1]);
  state.registerSaleOnCredit();
  const sale = state.salesHistory().at(-1);
  const credit = state.credits().at(-1);
  state.startNewSale();
  return { sale, credit };
}
const results = [];
function check(id, rule, run) {
  try {
    const result = run();
    results.push({ id, rule, verdict: result.ok ? 'CUMPLE' : 'INCUMPLE', expected: result.expected, observed: result.observed });
  } catch (error) {
    results.push({ id, rule, verdict: 'ERROR DE DIAGNÓSTICO', observed: String(error) });
    process.exitCode = 1;
  }
}

check('A01', 'El código de etiqueta identifica el producto en el POS', () => {
  const state = openedState();
  const code = state.generateBarcode(state.products[0].code);
  const found = state.findProduct(code);
  return { ok: found?.id === state.products[0].id, expected: state.products[0].code, observed: { generated: code, found: found?.code ?? null } };
});
check('A02', 'Un cambio aumenta el crédito de su venta, no crea otro', () => {
  const state = openedState();
  const { sale, credit } = creditSale(state);
  const count = state.credits().length;
  const error = state.registerChange({ saleNumber: sale.number, customer: sale.customer, originalProduct: sale.lines[0].product.name, replacementProduct: state.products[2].name, difference: 2400, differenceMode: 'Agregar al crédito', reason: '' });
  const current = state.credits().find((item) => item.id === credit.id);
  return { ok: error === null && state.credits().length === count && current.total === credit.total + 2400, expected: { credits: count, originalTotal: credit.total + 2400 }, observed: { error, credits: state.credits().length, originalTotal: current.total, lastCreditSale: state.credits().at(-1).saleNumber ?? null } };
});
check('A03', 'Solo puede devolverse un producto incluido en la venta', () => {
  const state = openedState();
  const { sale } = creditSale(state);
  const error = state.registerChange({ saleNumber: sale.number, customer: sale.customer, originalProduct: state.products[0].name, replacementProduct: state.products[2].name, difference: 0, differenceMode: 'Sin diferencia', reason: '' });
  return { ok: Boolean(error), expected: 'Rechazo antes de cambiar inventario', observed: { error, changes: state.changes().length } };
});
check('A04', 'Un cambio de menor valor puede reducir el crédito pendiente', () => {
  const state = openedState();
  const { sale } = creditSale(state);
  const error = state.registerChange({ saleNumber: sale.number, customer: sale.customer, originalProduct: sale.lines[0].product.name, replacementProduct: state.products[15].name, difference: -3300, differenceMode: 'Agregar al crédito', reason: '' });
  const credit = state.credits().find((item) => item.saleNumber === sale.number);
  return { ok: error === null && credit?.total === 1500, expected: 'Reducir saldo en 3300', observed: { error, creditTotal: credit?.total } };
});
check('A05', 'El saldo del directorio coincide con la cartera del cliente', () => {
  const state = openedState();
  const { sale } = creditSale(state);
  const customer = state.customers().find((item) => item.name === sale.customer);
  return { ok: customer.balance === sale.total, expected: sale.total, observed: customer.balance };
});
check('A06', 'El Supervisor puede crear pedidos con sus permisos iniciales', () => {
  const state = new PrototypeStateService();
  state.login('maria.super', 'demo123');
  const product = state.products[1];
  const error = state.registerPurchaseOrder(product.supplier, [{ productCode: product.code, quantity: 2 }]);
  return { ok: error === null, expected: 'Pedido registrado', observed: error };
});
check('A07', 'El relevo deja una sola sesión de operador activa', () => {
  const state = openedState();
  state.setShiftMode('COMPARTIDO');
  state.identifyOperator('CP-CAJ-001');
  state.identifyOperator('CP-SUP-001');
  const active = state.operatorSessions().filter((session) => !session.endedAt).length;
  return { ok: active === 1, expected: 1, observed: active };
});
check('A08', 'Finalizar sesión bloquea al operador sin cerrar caja', () => {
  const state = openedState();
  state.setShiftMode('COMPARTIDO');
  state.identifyOperator('CP-CAJ-001');
  state.endOperatorSession();
  return { ok: state.user() === null && state.cashOpen(), expected: { user: null, cashOpen: true }, observed: { user: state.user()?.username, cashOpen: state.cashOpen() } };
});
check('A09', 'El total y el detalle de venta coinciden tras actualizar el precio en recepción', () => {
  const state = openedState();
  const order = state.purchaseOrders()[0];
  const product = state.products.find((item) => item.code === order.lines[0].productCode);
  state.addProduct(product);
  const previousTotal = state.total();
  state.receivePurchase(order.id, [{ productCode: product.code, quantity: 1, unitCost: 2000, newSalePrice: 6000 }]);
  const sale = state.completeSale([{ method: 'Efectivo', amount: previousTotal, received: previousTotal }]);
  const lineTotal = sale.lines.reduce((sum, line) => sum + line.product.price * line.quantity - line.discount, 0);
  return { ok: sale.total === lineTotal, expected: 'Total igual a suma de detalles', observed: { total: sale.total, lineTotal } };
});
check('A10', 'La confirmación revalida el inventario disponible', () => {
  const state = openedState();
  const product = state.products[0];
  state.addProduct(product);
  state.adjustInventory(product.id, -product.stock);
  let rejected = false;
  try { state.completeSale([{ method: 'Efectivo', amount: state.total(), received: state.total() }]); } catch { rejected = true; }
  return { ok: rejected && state.availableStock(product) >= 0, expected: 'Venta rechazada sin stock negativo', observed: { rejected, available: state.availableStock(product) } };
});
check('A11', 'Un crédito anulado no acepta nuevos abonos', () => {
  const state = openedState();
  const { sale, credit } = creditSale(state);
  state.voidSale(sale.number, 'Registro equivocado');
  const error = state.registerCreditPayment(credit.id, 100, 'Efectivo');
  return { ok: Boolean(error), expected: 'Abono rechazado', observed: { error, status: state.credits().find((item) => item.id === credit.id).status } };
});
check('A12', 'Repetir confirmación de crédito no duplica la venta', () => {
  const state = openedState();
  state.setCustomer('Laura Martínez');
  state.addProduct(state.products[0]);
  state.registerSaleOnCredit();
  state.registerSaleOnCredit();
  return { ok: state.salesHistory().length === 1, expected: 1, observed: state.salesHistory().length };
});
check('A13', 'Una recepción inválida no modifica ninguna línea', () => {
  const state = openedState();
  const order = state.purchaseOrders()[0];
  const product = state.products.find((item) => item.code === order.lines[0].productCode);
  const before = { stock: product.stock, price: product.price };
  const error = state.receivePurchase(order.id, [{ productCode: product.code, quantity: 1, unitCost: 2000, newSalePrice: 6000 }, { productCode: order.lines[1].productCode, quantity: 1, unitCost: 0, newSalePrice: 8000 }]);
  return { ok: Boolean(error) && product.stock === before.stock && product.price === before.price && state.purchaseReceipts().length === 0, expected: 'Sin cambios parciales', observed: { error, before, after: { stock: product.stock, price: product.price }, receipts: state.purchaseReceipts().length } };
});
check('A14', 'La venta por metro rechaza fracciones', () => {
  const state = openedState();
  const product = state.products.find((item) => item.unit === 'metro');
  state.addProduct(product);
  const error = state.setQuantity(product.id, 1.25);
  return { ok: Boolean(error) && state.cart()[0].quantity === 1, expected: 'Fracción rechazada', observed: { error, quantity: state.cart()[0].quantity } };
});
console.log(JSON.stringify({ diagnostic: 'Auditoría puntual de decisiones; no es una aprobación funcional', results, summary: { checks: results.length, compliant: results.filter((item) => item.verdict === 'CUMPLE').length, gaps: results.filter((item) => item.verdict === 'INCUMPLE').length } }, null, 2));

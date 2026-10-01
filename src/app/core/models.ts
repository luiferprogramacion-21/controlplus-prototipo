export type UserRole = 'Administrador' | 'Supervisor' | 'Cajero';

export interface PrototypeUser {
  name: string;
  username: string;
  role: UserRole;
  initials: string;
  quickCode?: string;
  active?: boolean;
}

export interface Product {
  id: number;
  code: string;
  barcode?: string;
  name: string;
  price: number;
  category: string;
  stock: number;
  unit: 'unidad' | 'metro';
  supplier?: string;
}

export interface CustomerRecord {
  id: string;
  name: string;
  document: string;
  phone: string;
  address: string;
  balance: number;
  status: 'Activo' | 'Con crédito';
}

export interface CartLine {
  product: Product;
  quantity: number;
  discount: number;
  discountReason?: string;
}

export type PaymentMethod = 'Efectivo' | 'Transferencia' | 'Tarjeta' | 'Nequi';

export interface PaymentAllocation {
  method: PaymentMethod;
  amount: number;
  received?: number;
  reference?: string;
}

export interface CompletedSale {
  number: string;
  createdAt: Date;
  subtotal: number;
  discount: number;
  vatIncluded: number;
  total: number;
  customer: string;
  operator: string;
  payments: PaymentAllocation[];
  change: number;
  itemCount: number;
  unitCount: number;
  lines: CartLine[];
  discountReason: string;
  status?: 'Confirmada' | 'Anulada';
}

export interface PaymentDraft {
  id: number;
  method: PaymentMethod;
  amount: number;
  received: number;
  reference: string;
}

export interface CashClosure {
  number: string;
  closedAt: Date;
  expected: number;
  counted: number;
  difference: number;
  reason: string;
  notes: string;
  operator: string;
}

export type RecordStatus = 'Pendiente' | 'Activo' | 'Completado' | 'Anulado' | 'Cancelado';

export interface CreditPayment {
  id: number;
  amount: number;
  method: PaymentMethod;
  reference: string;
  date: Date;
  operator: string;
}

export interface CreditRecord {
  id: string;
  saleNumber?: string;
  customer: string;
  total: number;
  paid: number;
  createdAt: Date;
  status: 'Pendiente' | 'Pagado' | 'Anulado';
  payments: CreditPayment[];
}

export interface ApartadoRecord {
  id: string;
  customer: string;
  product: string;
  items?: Array<{ productId: number; quantity: number }>;
  quantity: number;
  total: number;
  minimumPercent: number;
  paid: number;
  dueDate: Date | null;
  status: 'Activo' | 'Entregado' | 'Cancelado';
  refund: number;
  notes: string;
}

export interface ProductChangeRecord {
  id: string;
  saleNumber: string;
  customer: string;
  originalProduct: string;
  replacementProduct: string;
  originalProductCode?: string;
  replacementProductCode?: string;
  difference: number;
  differenceMode: 'Pago inmediato' | 'Agregar al crédito' | 'Sin diferencia';
  creditId?: string;
  refund?: number;
  reason: string;
  createdAt: Date;
  status: 'Completado' | 'Pendiente de autorización' | 'Anulado';
}

export interface CashMovement {
  id: string;
  type: 'Gasto' | 'Ingreso' | 'Sangría';
  amount: number;
  concept: string;
  createdAt: Date;
  operator: string;
}

export interface OperatorSession {
  id: string;
  username: string;
  name: string;
  codeLast4: string;
  startedAt: Date;
  endedAt?: Date;
}

export interface BarcodeRecord {
  id: string;
  productCode: string;
  format: 'Code 128' | 'EAN-13';
  value: string;
  createdAt: Date;
  subjectType?: 'Producto' | 'Credencial';
  subjectName?: string;
}

export interface PrintJob {
  id: string;
  type: 'Recibo' | 'Etiqueta' | 'Credencial';
  reference: string;
  copies: number;
  status: 'Pendiente' | 'Impreso' | 'Reintentar';
  createdAt: Date;
}

export interface PurchaseOrderLine {
  productCode: string;
  productName: string;
  requested: number;
  received: number;
}

export interface PurchaseOrderRecord {
  id: string;
  supplier: string;
  lines: PurchaseOrderLine[];
  status: 'Pendiente' | 'Parcial' | 'Recibida';
  createdAt: Date;
}

export interface PurchaseReceiptLine {
  productCode: string;
  productName: string;
  quantity: number;
  unitCost: number;
  previousSalePrice: number;
  newSalePrice: number;
}

export interface PurchaseReceiptRecord {
  id: string;
  orderId: string;
  supplier: string;
  lines: PurchaseReceiptLine[];
  createdAt: Date;
}

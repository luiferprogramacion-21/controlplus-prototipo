import { Routes } from '@angular/router';
import { sessionGuard, saleGuard, checkoutGuard, confirmationGuard } from './core/route-guards';
import { AppShell } from './layout/app-shell';
import { CashOpening } from './pages/cash-opening/cash-opening';
import { CashClosing } from './pages/cash-closing/cash-closing';
import { Checkout } from './pages/checkout/checkout';
import { Login } from './pages/login/login';
import { ModulePage } from './pages/module-page/module-page';
import { Pos } from './pages/pos/pos';
import { SaleSuccess } from './pages/sale-success/sale-success';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'ingresar' },
  { path: 'ingresar', component: Login, title: 'Ingresar | ControlPlus' },
  {
    path: 'operacion',
    component: AppShell,
    canActivateChild: [sessionGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'caja/apertura' },
      {
        path: 'caja/apertura',
        component: CashOpening,
        title: 'Apertura de caja | ControlPlus',
      },
      {
        path: 'caja/cierre',
        component: CashClosing,
        title: 'Cierre de caja | ControlPlus',
      },
      {
        path: 'ventas/nueva',
        component: Pos,
        canActivate: [saleGuard],
        title: 'Punto de venta | ControlPlus',
      },
      {
        path: 'ventas/cobro',
        component: Checkout,
        canActivate: [saleGuard, checkoutGuard],
        title: 'Cobro | ControlPlus',
      },
      {
        path: 'ventas/confirmada',
        component: SaleSuccess,
        canActivate: [confirmationGuard],
        title: 'Venta confirmada | ControlPlus',
      },
      { path: 'dashboard', component: ModulePage, data: { module: 'dashboard' }, title: 'Dashboard | ControlPlus' },
      { path: 'catalogo', component: ModulePage, data: { module: 'catalogo' }, title: 'Catálogo | ControlPlus' },
      { path: 'inventario', component: ModulePage, data: { module: 'inventario' }, title: 'Inventario | ControlPlus' },
      { path: 'clientes', component: ModulePage, data: { module: 'clientes' }, title: 'Clientes | ControlPlus' },
      { path: 'compras', component: ModulePage, data: { module: 'compras' }, title: 'Compras | ControlPlus' },
      { path: 'reportes', component: ModulePage, data: { module: 'reportes' }, title: 'Reportes | ControlPlus' },
      { path: 'administracion', component: ModulePage, data: { module: 'administracion' }, title: 'Administración | ControlPlus' },
      { path: 'configuracion', component: ModulePage, data: { module: 'configuracion' }, title: 'Configuración | ControlPlus' },
      { path: 'soporte', component: ModulePage, data: { module: 'soporte' }, title: 'Soporte | ControlPlus' },
      { path: 'creditos', loadComponent: () => import('./pages/operations-page/operations-page').then((m) => m.OperationsPage), data: { module: 'creditos' }, title: 'Créditos y abonos | ControlPlus' },
      { path: 'apartados', loadComponent: () => import('./pages/operations-page/operations-page').then((m) => m.OperationsPage), data: { module: 'apartados' }, title: 'Apartados | ControlPlus' },
      { path: 'cambios', loadComponent: () => import('./pages/operations-page/operations-page').then((m) => m.OperationsPage), data: { module: 'cambios' }, title: 'Cambios de productos | ControlPlus' },
      { path: 'historial', loadComponent: () => import('./pages/operations-page/operations-page').then((m) => m.OperationsPage), data: { module: 'historial' }, title: 'Historial de ventas | ControlPlus' },
      { path: 'turnos', loadComponent: () => import('./pages/operations-page/operations-page').then((m) => m.OperationsPage), data: { module: 'turnos' }, title: 'Operadores y turnos | ControlPlus' },
      { path: 'codigos-barras', loadComponent: () => import('./pages/operations-page/operations-page').then((m) => m.OperationsPage), data: { module: 'barcodes' }, title: 'Códigos de barras | ControlPlus' },
      { path: 'impresion', loadComponent: () => import('./pages/operations-page/operations-page').then((m) => m.OperationsPage), data: { module: 'impresion' }, title: 'Impresión | ControlPlus' },
      { path: 'recepciones', loadComponent: () => import('./pages/operations-page/operations-page').then((m) => m.OperationsPage), data: { module: 'recepciones' }, title: 'Recepción de compras | ControlPlus' },
      { path: 'movimientos', loadComponent: () => import('./pages/operations-page/operations-page').then((m) => m.OperationsPage), data: { module: 'movimientos' }, title: 'Movimientos de caja | ControlPlus' },
    ],
  },
  { path: '**', redirectTo: 'ingresar' },
];

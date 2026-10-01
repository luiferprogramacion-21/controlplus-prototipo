import { Component, inject, signal } from '@angular/core';
import { A11yModule } from '@angular/cdk/a11y';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { Icon } from './icon';
import { filter } from 'rxjs';
import { PrototypeStateService } from '../core/prototype-state.service';

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink, Icon, A11yModule],
  templateUrl: './app-shell.html',
})
export class AppShell {
  readonly state = inject(PrototypeStateService);
  readonly menuOpen = signal(false);
  readonly boundedWorkspace = signal(false);
  private readonly router = inject(Router);

  readonly pageTitle = signal('Caja');
  readonly pageSubtitle = signal('Apertura de turno');
  readonly activeSection = signal<'caja' | 'ventas' | 'dashboard' | 'catalogo' | 'inventario' | 'clientes' | 'compras' | 'reportes' | 'administracion' | 'configuracion' | 'soporte' | 'creditos' | 'apartados' | 'cambios' | 'historial' | 'turnos' | 'barcodes' | 'impresion' | 'recepciones' | 'movimientos'>('caja');
  readonly clock = new Intl.DateTimeFormat('es-CO', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date());

  constructor() {
    this.syncHeader(this.router.url);
    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd), takeUntilDestroyed())
      .subscribe((event) => { this.menuOpen.set(false); this.syncHeader(event.urlAfterRedirects); });
  }

  logout(): void {
    this.state.logout();
    void this.router.navigateByUrl('/ingresar');
  }

  onMenuKeydown(event: KeyboardEvent): void {
    event.stopPropagation();
    if (event.key === 'Escape') { event.preventDefault(); this.menuOpen.set(false); }
  }

  private syncHeader(url: string): void {
    this.boundedWorkspace.set(url.endsWith('/nueva') || url.endsWith('/cobro'));
    if (url.includes('/ventas/')) {
      this.activeSection.set('ventas');
      this.pageTitle.set('Punto de venta');
      this.pageSubtitle.set(url.endsWith('/cobro') ? 'Cobro y confirmación' : url.endsWith('/confirmada') ? 'Resultado de la operación' : 'Terminal CAJA-01 · Venta en curso');
      return;
    }
    if (url.endsWith('/caja/apertura')) { this.setHeader('caja', 'Caja', 'Apertura de turno'); return; }
    if (url.endsWith('/caja/cierre')) { this.setHeader('caja', 'Caja', 'Cierre y conciliación'); return; }
    const modules: Array<{ path: string; section: 'dashboard' | 'catalogo' | 'inventario' | 'clientes' | 'compras' | 'reportes' | 'administracion' | 'configuracion' | 'soporte' | 'creditos' | 'apartados' | 'cambios' | 'historial' | 'turnos' | 'barcodes' | 'impresion' | 'recepciones' | 'movimientos'; title: string; subtitle: string }> = [
      { path: '/dashboard', section: 'dashboard', title: 'Dashboard', subtitle: 'Resumen operativo de Baratísimo' },
      { path: '/catalogo', section: 'catalogo', title: 'Catálogo', subtitle: 'Productos, categorías y precios' },
      { path: '/inventario', section: 'inventario', title: 'Inventario', subtitle: 'Existencias y movimientos' },
      { path: '/clientes', section: 'clientes', title: 'Clientes', subtitle: 'Datos de contacto y cartera' },
      { path: '/compras', section: 'compras', title: 'Compras', subtitle: 'Pedidos a proveedores y recepción' },
      { path: '/reportes', section: 'reportes', title: 'Reportes', subtitle: 'Indicadores operativos y financieros' },
      { path: '/administracion', section: 'administracion', title: 'Administración', subtitle: 'Usuarios, roles y permisos' },
      { path: '/configuracion', section: 'configuracion', title: 'Configuración', subtitle: 'Parámetros de la operación' },
      { path: '/soporte', section: 'soporte', title: 'Soporte', subtitle: 'Estado del sistema y respaldos' },
      { path: '/creditos', section: 'creditos', title: 'Créditos y abonos', subtitle: 'Cartera de clientes y pagos' },
      { path: '/apartados', section: 'apartados', title: 'Apartados', subtitle: 'Reservas, abonos y entregas' },
      { path: '/cambios', section: 'cambios', title: 'Cambios', subtitle: 'Cambios dentro del plazo autorizado' },
      { path: '/historial', section: 'historial', title: 'Historial de ventas', subtitle: 'Anulaciones y reimpresiones' },
      { path: '/turnos', section: 'turnos', title: 'Operadores y turnos', subtitle: 'Sesiones rápidas con credencial' },
      { path: '/codigos-barras', section: 'barcodes', title: 'Códigos de barras', subtitle: 'Generación para productos y etiquetas' },
      { path: '/impresion', section: 'impresion', title: 'Impresión', subtitle: 'Recibos, etiquetas y credenciales' },
      { path: '/recepciones', section: 'recepciones', title: 'Recepción de compras', subtitle: 'Recepciones completas y parciales' },
      { path: '/movimientos', section: 'movimientos', title: 'Movimientos de caja', subtitle: 'Gastos, ingresos y sangrías' },
    ];
    const module = modules.find((candidate) => url.includes(candidate.path));
    if (module) { this.setHeader(module.section, module.title, module.subtitle); return; }
    this.setHeader('caja', 'Caja', 'Apertura de turno');
  }

  private setHeader(section: 'caja' | 'ventas' | 'dashboard' | 'catalogo' | 'inventario' | 'clientes' | 'compras' | 'reportes' | 'administracion' | 'configuracion' | 'soporte' | 'creditos' | 'apartados' | 'cambios' | 'historial' | 'turnos' | 'barcodes' | 'impresion' | 'recepciones' | 'movimientos', title: string, subtitle: string): void {
    this.activeSection.set(section);
    this.pageTitle.set(title);
    this.pageSubtitle.set(subtitle);
  }
}

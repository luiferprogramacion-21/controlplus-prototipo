# ControlPlus — Baratísimo · bloque 2 · revisión 9

Proyecto Angular 22 construido sobre el archivo original y los mockups SVG V2. Este paquete conserva el recorrido de ventas y agrega las vistas operativas de los módulos de gestión. Sigue siendo un prototipo local en memoria; no representa todavía el sistema operativo final.

## Cambios de esta revisión

- Menú lateral oculto al iniciar. Se abre con el botón de menú y se cierra con la X, Escape, al pulsar fuera o al navegar. Mientras está abierto, el foco permanece dentro del menú.
- Carrito con altura limitada por el espacio disponible. Las filas se desplazan dentro de la tabla y sus encabezados permanecen visibles; los controles de cantidad, descuentos, cliente y cobro quedan fuera de esa zona.
- Catálogo con 16 ejemplos relacionados con Baratísimo: ropa, calzado, bisutería, juguetes, papelería, ferretería, hogar y cocina. No son el inventario, los precios ni los códigos reales del establecimiento.
- Búsqueda por nombre, código o categoría y botón `Ver productos`, sin botones de prueba rápida.
- Paleta clara fija de ControlPlus. Angular Material utiliza un tema claro explícito y los controles nativos declaran `color-scheme: only light`. El tema de Chrome o Windows no selecciona otros colores. Se conservan las funciones de accesibilidad del sistema.
- Eliminados los textos de demostración, el aviso de confirmación segura y las instrucciones repetidas de las pantallas. Los datos, credenciales, simulación y límites del prototipo se explican en este README.
- El cobro presenta errores al intentar confirmar una operación incompleta; enfoca el campo que debe corregirse. No muestra un aviso de efectivo insuficiente al abrir la pantalla.
- Pago mixto corregido. El primer medio inicia como efectivo y se escribe cuánto entrega el cliente. Al pulsar `Pago mixto`, ControlPlus calcula el saldo restante para el segundo medio. Si se cambia el efectivo o el monto del otro medio, el saldo se rebalancea automáticamente.
- El cobro ya no queda bloqueado de forma silenciosa al agregar un medio. Si no se ha asignado el primer importe, muestra el motivo y enfoca el campo que debe completarse. `Efectivo exacto` asigna el saldo pendiente de ese medio y calcula el cambio.
- Si el efectivo entregado es menor al total, el sistema lo toma como aporte real y pasa la diferencia al otro medio. Por ejemplo: total `$ 13.700`, efectivo `$ 5.000` y transferencia `$ 8.700`.
- Se agregó `Nequi` como medio con referencia, junto con efectivo, transferencia y tarjeta.
- Se agregaron rutas y vistas navegables para Dashboard, Catálogo, Inventario, Clientes, Compras, Reportes, Administración, Configuración y Soporte. Las tablas usan el catálogo de Baratísimo y datos operativos de prueba, con búsqueda, filtros y acciones visuales.
- El cierre de caja dejó de ser ciego. Antes de contar se muestran el saldo esperado y su desglose entre fondo inicial, ventas en efectivo, ingresos, abonos, gastos y sangrías. La diferencia se calcula mientras se escribe el efectivo contado; si existe descuadre, se exige un motivo seleccionable y la observación queda opcional.
- Los formularios de producto, ajuste de inventario, cliente, pedido de compra y usuario ya guardan datos en la memoria del prototipo. Configuración, reportes y soporte tienen controles de consulta y guardado visual.
- El formulario de cliente incluye dirección opcional. Los clientes viven en un estado común para que el directorio, créditos, apartados y punto de venta consulten la misma información.
- Desde el punto de venta se puede buscar un cliente por nombre o número de cédula/NIT, seleccionarlo o crearlo sin abandonar el carrito. Si se inicia un crédito o apartado sin cliente, el selector se abre automáticamente y continúa la operación después de elegirlo.
- Al crear un producto, ControlPlus genera el código de barras de forma predeterminada. Si el producto ya trae un código del fabricante, se cambia la opción a `El producto ya tiene código` y se escanea o escribe. El proveedor se selecciona de la lista registrada en el sistema y puede quedar sin asignar.
- Todos los productos se manejan en cantidades enteras. Los artículos por medida se venden por metros completos, sin decimales.
- Los ajustes de inventario aceptan cantidades con signo: `-1` retira una unidad o metro y `1` agrega. Nunca permiten que la existencia disponible quede negativa.
- Compras incluye sugerencias agrupadas por el proveedor asignado. Un pedido contiene una lista de varios productos del mismo proveedor; no se crea un pedido diferente por cada producto.
- El pedido de compra contiene únicamente los productos y cantidades solicitadas. El costo no se registra allí porque todavía no es el valor confirmado por el proveedor.
- Se incorporó el bloque operativo pendiente: créditos y abonos, apartados, cambios, historial, operadores de turno, códigos de barras, cola de impresión, recepciones parciales y movimientos de caja.
- El crédito puede originarse desde el carrito cuando se selecciona un cliente. Los abonos aceptan efectivo, transferencia, tarjeta o Nequi; el saldo y el estado se actualizan sin límite de cuotas.
- El apartado puede originarse desde el carrito con el mínimo inicial configurable (20 % por defecto). Incluye abonos, entrega con saldo completo y cancelación administrativa con devolución decidida por el administrador.
- Los cambios validan la venta original, el plazo vigente de 15 días y la existencia del producto nuevo. El cajero escanea el código del producto devuelto y el del producto nuevo; la diferencia se calcula como precio nuevo menos precio histórico devuelto. Una diferencia positiva se paga o se suma al crédito; una negativa reduce el crédito y devuelve el excedente. El motivo es opcional.
- Historial conserva ventas confirmadas y anuladas; reimprimir agrega un trabajo a la cola de recibos y anular requiere supervisor o administrador y motivo.
- Turno compartido permite identificar operadores por credencial Code 128 sin cerrar la caja contable. El modo se cambia desde Configuración; el turno individual continúa como valor inicial.
- Los formatos de código están definidos por su uso y no son configurables: EAN-13 para etiquetas de productos y Code 128 para credenciales de operadores. Desde Códigos, `Imprimir` lleva a un nuevo trabajo de impresión con el código precargado. Impresión permite escanear, escribir o elegir una sugerencia según el tipo de trabajo; un trabajo permanece `Pendiente` hasta pulsar `Imprimir` y luego pasa a `Impreso`.
- Recepciones abre la lista completa del pedido y permite registrar en una operación las cantidades recibidas, el costo unitario real y el nuevo precio de venta de varios productos. Muestra el precio de venta anterior antes del cambio, admite entregas parciales y actualiza inventario y precio solo por lo recibido. Gastos, ingresos y sangrías requieren administrador y afectan el saldo esperado del turno.
- Se retiraron avisos instructivos permanentes de los formularios. La interfaz conserva datos operativos, validaciones y errores necesarios para completar cada tarea.
- La recepción de compras ocupa la ventana disponible: la tabla muestra producto, pendiente, cantidad recibida, costo real, precio anterior y nuevo precio; las acciones quedan fuera del desplazamiento de filas.
- La auditoría puntual de 14 reglas verificó códigos escaneables, cambios con crédito, devoluciones por diferencia negativa, saldos de clientes, permisos iniciales de compras, relevo de operadores, revalidación de existencias, anulaciones y duplicados. Resultado: 14/14 verificaciones aprobadas.
- Configuración permite dejar opcionales el IVA predeterminado y los días límite del apartado, además de cambiar el mínimo inicial, el plazo de cambios y el modo de turno.

El área operativa sigue orientada a escritorio. Su ancho mínimo es 1000 px; la paleta no cambia por el tamaño de ventana ni por el tema del navegador. Con ventanas inferiores, se conserva la disposición de escritorio.

## Actualizar una instalación del bloque 2

Detén `npm start` con `Ctrl + C`. Extrae el nuevo ZIP en `Documentos\ControlPlus` y acepta reemplazar los archivos de `controlplus-prototipo-bloque1`. Las dependencias no cambiaron. En la ventana de **CMD** que ya utilizas, ejecuta:

```cmd
cd /d "%USERPROFILE%\Documents\ControlPlus\controlplus-prototipo-bloque1"
npm.cmd start
```

Actualiza `http://localhost:4200/` en Chrome. Si no hay una carpeta `node_modules`, ejecuta antes `npm.cmd ci`.

## Abrir en Windows con PowerShell

1. Detén el servidor anterior con `Ctrl + C`.
2. Extrae el ZIP en `Documentos\ControlPlus`. El archivo contiene la carpeta `controlplus-prototipo-bloque1`, para conservar aparte tu proyecto inicial.
3. En PowerShell ejecuta:

```powershell
Set-Location "$env:USERPROFILE\Documents\ControlPlus\controlplus-prototipo-bloque1"
npm.cmd ci
npm.cmd start
```

Abre `http://localhost:4200/` en Chrome. Si extraes el ZIP en otra ubicación, utiliza esa ruta en `Set-Location`. No uses `cd /d` ni `%USERPROFILE%` en PowerShell: corresponden a CMD.

Las dependencias se descargan con `npm.cmd ci`. El prototipo no solicita fuentes, iconos ni servicios externos al ejecutarse. Los iconos son SVG locales; la fuente usa Inter si está instalada, con Segoe UI como alternativa en Windows. El proyecto conserva las versiones de Angular y Angular Material del archivo original.

## Recorrido disponible

1. Acceso con cuentas de demostración y errores de validación.
2. Apertura de caja en modo individual, con fondo inicial entero mayor o igual a cero y observaciones opcionales.
3. Venta: búsqueda por código/nombre, selección de resultados ambiguos, cantidades enteras, control de existencias simuladas, cliente opcional y cancelación con confirmación.
4. Descuento en pesos al producto seleccionado o a la venta completa. Cambiar de tipo sustituye los descuentos del otro tipo; el motivo es opcional. Los descuentos de varios productos pueden coexistir.
5. Cobro con efectivo, transferencia, tarjeta o Nequi, hasta un registro por medio. El operador escribe el efectivo entregado y, si falta dinero, pulsa `Pago mixto`; el segundo medio recibe automáticamente el saldo restante. Transferencias y Nequi requieren referencia.
6. Confirmación con número de venta, resumen, detalle de productos/pagos, impresión simulada y nueva venta.
7. Cierre de caja visible, con saldo esperado, desglose, conteo, diferencia y motivo cuando exista descuadre.
8. Módulos de gestión: Dashboard, Catálogo, Inventario, Clientes, Compras, Reportes, Administración, Configuración y Soporte.
9. Operaciones adicionales: Créditos, Apartados, Cambios, Historial, Operadores, Códigos, Impresión, Recepciones y Movimientos. Los formularios modifican el estado en memoria y las acciones verifican los permisos principales.

Bloquear sesión conserva el turno y el carrito en memoria. En este primer bloque, un turno individual se reanuda con su mismo responsable. El cliente y los importes del cobro se conservan al regresar al carrito. Modificar productos, cantidades o descuentos reinicia la asignación del cobro para revisar el nuevo total.

## Cuentas de prueba

La contraseña de las tres cuentas es `demo123`.

| Perfil | Usuario |
|---|---|
| Administrador | `luifer.admin` |
| Supervisor | `maria.super` |
| Cajero | `ana.caja` |

Si deseas iniciar la demostración con otra cuenta cuando ya existe un turno individual, recarga la página. Se reiniciarán todos los datos simulados.

## Venta de prueba

1. Ingresa con la cuenta precargada y abre caja con `$ 200.000`.
2. Escribe `770001` y presiona Enter. Repite el código para aumentar la cantidad.
3. Agrega los aretes `770003`, selecciona su fila y aplica un descuento de `$ 700`, con motivo vacío.
4. Selecciona un cliente si lo deseas y presiona F9.
5. Para combinar pagos, escribe `$ 30.000` en `Efectivo entregado`.
6. Pulsa `Pago mixto`: la transferencia se propone por el saldo restante. Escribe una referencia, por ejemplo `843921`.
7. Revisa el total de `$ 63.500` y el cambio de `$ 20.000`; confirma.
8. Consulta el detalle y comienza una nueva venta.
9. Desde `Caja`, selecciona `Cerrar caja`, revisa el saldo esperado y su desglose, cuenta el efectivo y registra el resultado. Si hay diferencia, selecciona su motivo.

Códigos del catálogo:

| Código | Producto | Categoría |
|---|---|---|
| `770001` | Camiseta básica de algodón | Ropa |
| `770002` | Lapicero de gel | Papelería |
| `770003` | Aretes de argolla | Bisutería |
| `770004` | Carrito de juguete | Juguetería |
| `770005` | Cable dúplex por metro | Ferretería |
| `770006` | Zapatos casuales, par | Calzado |
| `770007` | Sartén antiadherente | Cocina |
| `770008` | Cuaderno argollado 100 hojas | Papelería |
| `770009` | Collar con dije | Bisutería |
| `770010` | Martillo de uña | Ferretería |
| `770011` | Vestido infantil | Ropa |
| `770012` | Pelota infantil | Juguetería |
| `770013` | Taza de cerámica | Hogar |
| `770014` | Medias para adulto, par | Ropa |
| `770015` | Paquete de 6 lápices | Papelería |
| `770016` | Cinta de satín por metro | Hogar |

Las unidades se venden por pieza o por metro completo. Todas las cantidades son enteras: una cinta puede venderse como `1 m`, `2 m` o `3 m`, pero no como `0,5 m` ni `1,25 m`. No hay conversión entre presentaciones. Precios, existencias y tasa uniforme de IVA del 19 % son exclusivamente datos de prueba; no constituyen un catálogo tributario real.

## Teclado

| Tecla | Acción |
|---|---|
| Enter en la búsqueda | Buscar o agregar el código exacto |
| F2 | Enfocar búsqueda |
| F3 | Enfocar cliente |
| F4 | Editar cantidad del producto seleccionado |
| F9 | Abrir cobro |
| Supr fuera de campos de edición | Quitar producto seleccionado |
| Esc | Cerrar diálogo o regresar del cobro |
| Tab / Mayús + Tab | Recorrer controles; dentro de un diálogo, el foco permanece en él |
| Enter sobre la confirmación | Confirmar cobro; el botón se bloquea durante el registro |
| Enter en la pantalla confirmada | Nueva venta; el botón recibe el foco inicial |

## Verificación realizada

```powershell
npm.cmd run build
npm.cmd test -- --watch=false
```

La compilación de producción pasó y las 33 pruebas automatizadas pasaron. Las pruebas usan Angular, RouterTestingHarness, Vitest y JSDOM para comprobar formularios, menú ocultable, navegación, catálogo, generación y captura de códigos, cantidades enteras por pieza y metro, clientes con dirección, búsqueda por cédula, pagos mixtos, descuentos, cierre visible, ajustes negativos, pedidos y recepciones con listas, preservación del carrito, créditos, apartados, cambios, turnos, impresión, movimientos y duplicados. Además, `node audit/run-decision-audit.mjs` ejecuta 14 verificaciones de coherencia entre las decisiones aprobadas y el estado en memoria; en esta revisión las 14 pasan. Ninguna de estas comprobaciones sustituye una prueba visual y operativa en Chrome.

La comprobación visual automatizada en Chrome a 1366 × 768 y zoom 125 % sigue pendiente; la compilación y las pruebas de componentes sí pasan. La revisión manual recomendada incluye abrir cada nueva ruta, confirmar que las tablas se desplazan sin ocultar sus acciones y completar al menos un flujo de cada módulo.

Para revisar la nueva distribución en Chrome: agrega los 16 productos, desplaza la tabla hasta el último, comprueba que Cantidad, Descuentos, Cliente y Cobrar permanecen visibles; abre y cierra el menú y repite al 125 % de zoom. Comprueba también que cambiar Windows/Chrome al tema oscuro conserve los colores de ControlPlus. Los estilos compilados no contienen selección automática `light-dark()`.

## Límites de este bloque

- Los datos existen solo en memoria; recargar, cerrar la pestaña o reiniciar la aplicación los borra.
- El acceso es simulado y sus contraseñas están incluidas deliberadamente. No debe usarse con información real.
- El servidor, la base de datos y la impresión son simulados. No hay conexión a ASP.NET Core, PostgreSQL ni impresora.
- El cálculo de descuentos permite valores enteros desde cero y menores que el subtotal afectado. No implementa todavía porcentajes, límites por rol ni autorización de supervisor.
- La protección contra confirmación repetida solo cubre esta instancia en memoria. La idempotencia y concurrencia definitivas corresponden al backend.
- Los flujos de este bloque funcionan en memoria. Todavía no hay persistencia offline, sincronización, ASP.NET Core, PostgreSQL, auditoría definitiva, UUIDv7, idempotencia del backend ni conexión directa con una impresora física. La cola de impresión representa el contrato que luego consumirá el adaptador de hardware.
- Los tres roles parten de permisos normales y las acciones principales ya validan administrador/supervisor en el estado del prototipo; la matriz granular editable y su auditoría definitiva deben implementarse en el backend.
- La pantalla de Administración todavía no edita permisos granulares ni guarda cambios de roles; sus botones son estados de demostración. La decisión está definida en la base de datos, pero falta implementarla en el prototipo y en la API.
- Soporte muestra el contrato visual de respaldos, restauración y diagnóstico; todavía no crea copias, prueba restauraciones ni conecta una impresora térmica real.
- Reportes y Dashboard todavía contienen indicadores de demostración; deben leer ventas, caja, compras e inventario persistidos antes de considerarse reportes reales.
- El modelo definitivo debe conservar: roles base editables mediante permisos granulares, turno individual por defecto con turno compartido opcional, mínimo de apartado configurable con valor vigente del 20 %, cambios con posibilidad de pagar la diferencia o sumarla al crédito, y cancelación de apartado decidida por el administrador.
- El modelo definitivo de productos debe conservar proveedor asignado opcional, historial de precios/costos, inactivación en vez de borrado, código único y unidad por unidad o metro entero.
- El prototipo aún no implementa persistencia offline, sincronización, ASP.NET Core, PostgreSQL, auditoría definitiva, UUIDv7, idempotencia del backend ni la cola real de impresión. No debe usarse con datos reales.

## Auditoría de decisiones aprobadas

| Decisión | Estado en este prototipo |
|---|---|
| Turno individual por defecto y turno compartido configurable | Implementado en Configuración y en Operadores. La identificación rápida usa Code 128 y conserva un solo turno contable. |
| Tres roles base con permisos granulares editables | Administración muestra los tres roles; las acciones críticas del prototipo validan el rol y la matriz completa queda para el backend. |
| Pago combinado, diferencia pagada o sumada al crédito | Implementado en Cobro y Cambios; el medio restante se recalcula automáticamente. |
| Apartado con mínimo inicial del 20 %, devolución decidida por administrador | Implementado desde el carrito y en Apartados; el porcentaje y el plazo pueden configurarse. |
| Cambios hasta 15 días, motivo opcional y diferencia pagada o agregada al crédito | Implementado con validación de venta, plazo, existencia y crédito pendiente. |
| Pedidos agrupados por el proveedor asignado al producto | Implementado: cada pedido reúne una lista de productos del mismo proveedor y cada recepción procesa esa lista de forma total o parcial. |
| Productos simples, código único y unidad o metro entero | El alta genera el código automáticamente o permite capturar uno existente; categoría, precio, existencia y proveedor registrado se validan. Falta historial persistente e inactivación con auditoría. |
| Cierre visible y motivo de descuadre | Implementado con saldo esperado y desglose visibles, diferencia en vivo, motivo obligatorio cuando hay descuadre, gastos, ingresos y sangrías administrativas. |
| Código de barras para productos y credenciales; etiquetas y recibos térmicos | Generador, navegación hacia impresión y cola con estados `Pendiente`/`Impreso` implementados en el prototipo; el adaptador de impresora física queda para integración. |
| Offline híbrido, sincronización, PostgreSQL y ASP.NET Core | Todavía no conectado; este ZIP es un prototipo Angular con datos en memoria. |
- El lector puede enviar los códigos de prueba como teclado y Enter. Falta validarlo con el equipo físico; tampoco se ha validado la impresión real ni los anuncios con un lector de pantalla.

## Estructura

- `src/app/core`: modelos, estado de prueba, reglas de venta y guardas de navegación.
- `src/app/layout`: navegación, encabezado e iconos SVG.
- `src/app/pages`: acceso, apertura, cierre, punto de venta, cobro, confirmación, gestión y operaciones de crédito, apartado, cambios, historial, turnos, códigos, impresión, recepción y caja.
- `src/styles.scss`: colores y estilos compartidos basados en MK-005 a MK-008.
- `src/app/app.spec.ts`: pruebas del recorrido a través de los formularios.
- `src/app/core/prototype-state.service.spec.ts`: reglas de cantidades, descuentos y cobros.
- `audit/run-decision-audit.mjs`: auditoría reproducible de decisiones funcionales críticas; solo inspecciona estado en memoria.

# Seguridad Firebase - mejoras urgentes para comprobantes obligatorios

> [!NOTE]
> **ESTADO: COMPLETADO (30 Junio 2026)**
> Todos los puntos descritos en este documento (endurecimiento de `storage.rules`, validaciones obligatorias en frontend y backend, generación de nombres de archivo seguros y no predecibles, reglas de stock y control de UID en `firestore.rules`) han sido completamente implementados, probados y desplegados con éxito.

Fecha: 26 Junio 2026

Este documento de instrucciones de la sesión anterior queda archivado para historial técnico.
(Antigravity, OpenCode, Codex, etc.). El foco es endurecer seguridad de Firebase
sin romper el requisito de la cliente: para Yape/Plin y transferencia bancaria,
la subida del comprobante de pago debe ser obligatoria.

## Contexto actual

Archivos principales:

- `storage.rules`
- `firestore.rules`
- `js/store.js`
- `js/services/firebaseService.js`
- `js/views/checkout.js`
- `js/views/admin.js`

El flujo actual valida en `checkout.js` que Yape y Transferencia tengan archivo
antes de enviar la orden. Sin embargo, en `store.js`, si falla la subida del
comprobante, el pedido puede continuar y registrarse sin `voucherUrl`. Eso ya no
debe permitirse para metodos manuales.

Tambien existe una regla temporal en Storage:

```js
match /comprobantes/{allPaths=**} {
  allow read: if true;
  allow write: if true;
}
```

Esta regla fue util para desbloquear compras de invitados, pero es demasiado
abierta para una version previa a produccion.

## Prioridad 1 - Endurecer `storage.rules` para comprobantes

Objetivo:

- Mantener subida de comprobantes para invitados.
- No permitir cualquier archivo, cualquier tamano ni cualquier escritura.
- Permitir solo creacion, no edicion posterior desde cliente.

Propuesta inicial:

```js
match /comprobantes/{allPaths=**} {
  allow read: if true;
  allow create: if request.resource.size < 5 * 1024 * 1024
                && request.resource.contentType.matches('image/.*|application/pdf');
  allow update, delete: if false;
}
```

Notas:

- `read: if true` puede quedarse temporalmente para no romper `getDownloadURL`
  en compras invitadas.
- En una fase posterior, idealmente la lectura de comprobantes deberia pasar por
  backend/serverless o URLs controladas.
- Si la cliente suele subir fotos pesadas desde celular, evaluar 8 MB en lugar
  de 5 MB, pero no dejarlo ilimitado.

## Prioridad 2 - Si falla la subida obligatoria, no crear pedido

Archivo: `js/store.js`

Funcion: `placeOrder(shippingInfo, paymentMethod, voucherFile = null)`

Cambio requerido:

- Para `paymentMethod === "Yape"` o `paymentMethod === "Transferencia"`, el
  pedido solo debe crearse si existe `voucherFile` y la subida devuelve
  `voucherUrl`.
- Si `uploadOrderVoucher` falla o se agota el timeout, retornar `null` antes de
  `firebaseService.createOrder(newOrder)`.
- Mantener el comportamiento separado para `Tarjeta`, porque Izipay no deberia
  requerir comprobante manual.

Pseudoflujo recomendado:

```js
const requiresVoucher = paymentMethod === "Yape" || paymentMethod === "Transferencia";

if (requiresVoucher && !voucherFile) {
  show error;
  return null;
}

if (voucherFile) {
  try {
    voucherUrl = await upload...
  } catch (err) {
    show error;
    if (requiresVoucher) return null;
  }
}

if (requiresVoucher && !voucherUrl) {
  show error;
  return null;
}
```

Mensaje sugerido:

- ES: `No se pudo subir el comprobante. Intenta con una imagen mas ligera o revisa tu conexion.`
- PT: `Nao foi possivel enviar o comprovante. Tente uma imagem mais leve ou verifique sua conexao.`

## Prioridad 3 - Usar rutas de comprobante no predecibles

Archivo: `js/services/firebaseService.js`

Funcion: `uploadOrderVoucher(file, orderId)`

Problema actual:

```js
const storagePath = `comprobantes/${orderId}.${fileExtension}`;
```

`orderId` usa formato tipo `BF-1234`, facil de adivinar y con riesgo de colision.

Propuesta:

```js
const safeExtension = file.name.split('.').pop()?.toLowerCase() || 'bin';
const uniqueId = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
const storagePath = `comprobantes/${orderId}/${uniqueId}.${safeExtension}`;
```

Importante:

- No usar el nombre original del archivo en la ruta.
- Guardar el archivo dentro de una carpeta por pedido ayuda al admin y evita
  pisar comprobantes.

## Prioridad 4 - Validar tipo y tamano en frontend antes de subir

Archivo: `js/views/checkout.js`

Aunque Storage Rules son la seguridad real, validar en frontend mejora UX.

Agregar validacion para:

- Maximo 5 MB u 8 MB.
- Tipos aceptados:
  - `image/jpeg`
  - `image/png`
  - `image/webp`
  - `application/pdf`

Si el archivo no cumple:

- Mostrar toast.
- No activar pantalla de carga.
- No llamar `AppStore.placeOrder(...)`.

Esto debe aplicarse a:

- `#yape-voucher-file`
- `#transfer-voucher-file`

## Prioridad 5 - Validar estructura minima de pedidos en Firestore Rules

Archivo: `firestore.rules`

Regla actual:

```js
allow create: if true;
```

Esto permite checkout invitado, pero tambien permite crear documentos basura.

Endurecimiento minimo recomendado:

```js
allow create: if request.resource.data.keys().hasAll([
                  'id', 'date', 'createdAt', 'total', 'status',
                  'paymentStatus', 'paymentMethod', 'items',
                  'shipping', 'customerId'
                ])
              && request.resource.data.total is number
              && request.resource.data.total > 0
              && request.resource.data.createdAt is number
              && request.resource.data.status == "En preparacion"
              && request.resource.data.paymentStatus == "pending"
              && request.resource.data.items is list
              && request.resource.data.items.size() > 0
              && request.resource.data.paymentMethod in ["Tarjeta", "Yape", "Transferencia"]
              && (
                request.resource.data.paymentMethod == "Tarjeta"
                || (
                  request.resource.data.voucherUrl is string
                  && request.resource.data.voucherUrl.size() > 0
                )
              );
```

Atencion:

- Revisar encoding/acentos exactos del valor de `status`. En codigo puede estar
  como `"En preparacion"` o `"En preparacion"` sin tilde dependiendo del archivo
  real y consola. La regla debe coincidir exactamente con lo que guarda `store.js`.
- Firebase Rules tienen limitaciones de sintaxis; probar con Firebase Emulator o
  despliegue controlado antes de asumir que compila.

## Prioridad 6 - Revisar escritura de imagenes de producto

Archivo: `storage.rules`

Regla actual aproximada:

```js
match /productos/{allPaths=**} {
  allow read: if true;
  allow write: if request.auth != null;
}
```

Riesgo:

- Cualquier usuario autenticado podria subir archivos a `productos/`.

Soluciones posibles:

1. Temporal simple:
   - Mantener uploads de producto solo durante administracion manual y evitar
     crear cuentas cliente falsas.
   - No ideal para produccion.

2. Mejor:
   - Mover subida de imagenes de producto a backend/serverless con validacion
     admin.

3. Alternativa si se usa custom claims:
   - Usar `request.auth.token.admin == true` en Storage Rules.

No bloquear el avance principal por este punto si todavia se esta en desarrollo,
pero no lanzar produccion con escritura de productos abierta a cualquier usuario
autenticado.

## Checklist de prueba despues de cambios

Probar manualmente:

- Yape sin archivo: debe bloquear.
- Transferencia sin archivo: debe bloquear.
- Yape con PDF pequeno: debe crear pedido con `voucherUrl`.
- Transferencia con imagen JPG/PNG/WebP pequena: debe crear pedido con `voucherUrl`.
- Archivo mayor al limite: debe bloquear antes de crear pedido.
- Archivo no permitido: debe bloquear antes de crear pedido.
- Simular error de subida: no debe crear pedido para Yape/Transferencia.
- Tarjeta: no debe pedir comprobante manual.
- Admin: debe poder ver comprobante en detalle del pedido.
- Admin: debe poder eliminar comprobante si esa funcion sigue habilitada.

## Criterio de terminado

Considerar esta tarea lista cuando:

- `storage.rules` ya no tenga `allow write: if true` en `comprobantes`.
- `placeOrder` no permita registrar pedidos manuales sin comprobante subido.
- Los comprobantes usen rutas no predecibles.
- `checkout.js` valide tipo/tamano antes de subir.
- `firestore.rules` impida crear pedidos pagados desde frontend.
- El flujo Yape/Transferencia siga funcionando para clientes invitados.

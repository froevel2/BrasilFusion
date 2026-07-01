# Revision de Estado - 1 Julio 2026

## Contexto de la revision
Se reviso el proyecto considerando que todavia esta en desarrollo. La app ya tiene una base funcional solida: SPA en Vanilla JS, catalogo, carrito, checkout, panel admin, Firebase Auth/Firestore/Storage, reglas de seguridad, comprobantes, cupones, stock transaccional y primera capa serverless para Izipay.

No se hicieron cambios de codigo funcional en esta revision. El objetivo fue dejar una opinion tecnica y prioridades para la siguiente sesion.

## Archivos revisados
- `api/obtener-token.js`
- `api/confirmar-pago.js`
- `serve_dev.js`
- `index.html`
- `firestore.rules`
- `storage.rules`
- `js/store.js`
- `js/services/firebaseService.js`
- `js/views/checkout.js`
- `js/components/header.js`
- `js/utils.js`
- `README.md`

## Verificacion realizada
Se ejecuto una verificacion de sintaxis con Node en archivos criticos:

```powershell
node --check api\obtener-token.js
node --check api\confirmar-pago.js
node --check serve_dev.js
node --check js\store.js
```

Resultado: sin errores de sintaxis.

No hay suite de tests ni scripts de build/test definidos en `package.json`; por eso la revision fue principalmente de arquitectura, seguridad y consistencia.

## Estado tecnico actual
El proyecto esta en una fase buena de preproduccion funcional. Ya no es una maqueta: hay flujo de compra, administracion, persistencia real y una integracion inicial de pagos.

Todavia no debe considerarse listo para produccion con pagos reales. La frontera critica pendiente es hacer que el servidor sea la fuente de verdad para ordenes, montos y confirmacion de pago.

## Puntos positivos
- La estructura de carpetas es entendible y mantenible: `js/views`, `js/components`, `js/services`, `js/store.js`, `api/`.
- Las reglas de Firestore y Storage estan mucho mas endurecidas que al inicio del proyecto.
- El stock se descuenta dentro de una transaccion en `firebaseService.createOrder()`.
- Ya existe autenticacion anonima para invitados.
- Ya existe sanitizacion base con `escapeHTML(str)` en `js/utils.js`.
- Ya existen endpoints serverless iniciales para Izipay:
  - `api/obtener-token.js`
  - `api/confirmar-pago.js`
- `serve_dev.js` permite probar localmente la SPA junto con rutas serverless simuladas.

## Riesgos que conviene cerrar antes de produccion

### 1. Pago simulado activo en checkout
- **Archivo:** `js/views/checkout.js`
- **Referencias:** boton `btn-simulate-card-payment`, texto "Simular Pago Exitoso", llamada a `firebaseService.markOrderAsPaid()`.
- **Riesgo:** util para desarrollo, pero peligroso si queda accesible en produccion.
- **Recomendacion:** condicionar por entorno local o eliminar antes de publicar.

### 2. Credenciales sandbox/fallback en backend
- **Archivos:** `api/obtener-token.js`, `api/confirmar-pago.js`, `index.html`
- **Riesgo:** los endpoints usan valores por defecto de sandbox si no hay variables de entorno.
- **Recomendacion:** en produccion, fallar explicitamente si faltan `IZIPAY_SHOP_ID`, `IZIPAY_PASSWORD`, `IZIPAY_HMAC_SHA256` y la clave publica real del SDK.

### 3. Confirmacion de pago depende de `orderDocId` enviado por el cliente
- **Archivo:** `api/confirmar-pago.js`
- **Riesgo:** aunque se valida HMAC, el documento a actualizar llega desde el navegador.
- **Recomendacion:** crear o reservar la orden desde backend, asociarla al `orderId` de Izipay y actualizar la orden encontrada por esa asociacion, no por un `orderDocId` arbitrario enviado por el cliente.

### 4. Orden creada desde frontend con total local
- **Archivos:** `js/store.js`, `js/views/checkout.js`, `api/obtener-token.js`
- **Riesgo:** `api/obtener-token.js` recalcula el monto para Izipay, pero `AppStore.placeOrder()` todavia crea la orden desde el cliente con total calculado localmente.
- **Recomendacion:** unificar el flujo para que el backend cree/reserve la orden con total verificado, o al menos valide que el total pagado y la orden coincidan antes de marcar como pagado.

### 5. Fallback `anonymous-client`
- **Archivo:** `js/store.js`
- **Riesgo:** si falla Firebase Anonymous Auth, se usa `customerId = "anonymous-client"`, pero las reglas exigen `customerId == request.auth.uid`. En la practica puede fallar el checkout y confundir al usuario.
- **Recomendacion:** eliminar ese fallback. Si falla auth anonima, detener checkout con mensaje claro.

### 6. Sanitizacion XSS incompleta en resultados del buscador
- **Archivo:** `js/components/header.js`
- **Riesgo:** algunos datos de producto (`productName`, `p.image`, `p.id`) entran en `innerHTML` sin escape.
- **Recomendacion:** aplicar `escapeHTML` a esos valores o construir los nodos con `createElement`.

### 7. CORS abierto
- **Archivos:** `api/obtener-token.js`, `api/confirmar-pago.js`, `serve_dev.js`
- **Riesgo:** `Access-Control-Allow-Origin: *` esta bien para desarrollo, pero debe restringirse al dominio real en produccion.
- **Recomendacion:** permitir `localhost` en desarrollo y el dominio final en produccion.

### 8. README con caracteres mojibake
- **Archivo:** `README.md`
- **Riesgo:** documentacion con caracteres corruptos (`FusiÃ³n`, etc.).
- **Recomendacion:** re-guardar como UTF-8 limpio y revisar textos.

## Orden recomendado para la proxima sesion
1. Aislar o eliminar el boton de pago simulado.
2. Hacer obligatorias las variables de entorno de Izipay en backend.
3. Redisenar el flujo de orden/pago para que el backend sea la fuente de verdad.
4. Confirmar pagos por `orderId` asociado y verificado, no por `orderDocId` enviado desde frontend.
5. Eliminar fallback `anonymous-client`.
6. Completar sanitizacion del buscador.
7. Restringir CORS para produccion.
8. Limpiar `README.md`.
9. Agregar scripts basicos en `package.json`, por ejemplo `check`, para repetir `node --check` sobre archivos criticos.

## Nota para el siguiente agente
No conviene frenar el desarrollo visual o comercial, pero antes de activar pagos reales hay que cerrar el bloque de checkout seguro. Las funciones serverless ya existen; la siguiente mejora importante no es "crear Izipay desde cero", sino unir correctamente token, orden, pago confirmado y actualizacion de estado.

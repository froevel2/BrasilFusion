# Prioridad para la Siguiente Sesion: Checkout Seguro antes de Izipay Real

## Contexto
El proyecto esta en etapa de construccion y ya tiene una base funcional solida: catalogo, carrito, checkout, pedidos, panel admin, Firebase, cupones, comprobantes y reglas de seguridad iniciales.

Antes de publicar o activar pagos reales con Izipay, la prioridad tecnica debe ser cerrar el flujo de compra para que el servidor sea la fuente de verdad.

## Lo mas urgente

### 1. Crear backend seguro para Izipay
- **Archivo esperado:** `api/obtener-token.js`
- **Objetivo:** generar el token de pago desde Vercel Serverless sin exponer credenciales en el frontend.
- **Importante:** no aceptar el monto final calculado por el navegador como fuente de verdad.

### 2. Recalcular el total del pedido del lado del servidor
- **Archivos relacionados:** `js/store.js`, `api/obtener-token.js`, `docs/integracion_izipay.md`
- El backend debe recibir productos/cantidades y consultar Firestore para obtener:
  - precios actuales
  - `salePrice` valido si aplica
  - stock disponible
  - cupon activo/configurado
  - costo de envio segun distrito/provincia
  - IGV
- El total enviado a Izipay debe salir de este recalculo, no del cliente.

### 3. Endurecer la actualizacion de stock (ESTADO: COMPLETADO - 30 Junio 2026)
- **Archivo:** `firestore.rules`
- **Cambio realizado:** Se exige `request.auth != null` para actualizar stock. Además, se integró Firebase Anonymous Sign-In para invitados en el checkout, de forma que el cliente tiene un UID real y no se bloquean las compras legítimas de invitados, previniendo sabotaje de stock desde la consola por usuarios no identificados.

### 4. Confirmar pago exitoso de manera confiable
- **Archivos futuros relacionados:** `api/obtener-token.js`, posible endpoint de confirmacion/webhook, `js/services/firebaseService.js`
- No marcar `paymentStatus: "paid"` solo porque el frontend lo indique.
- La confirmacion debe depender de una respuesta valida de Izipay o de un endpoint servidor que verifique la transaccion.

### 5. Terminar limpieza XSS puntual (ESTADO: COMPLETADO - 30 Junio 2026)
- **Archivos revisados:** `js/components/header.js`, `js/views/checkout.js`
- **Cambio realizado:** Se importó `escapeHTML` en ambos archivos y se envolvieron las inyecciones de queryText en el buscador y todas las variables del cliente y artículos mostradas en el recibo de éxito del checkout, eliminando los riesgos de DOM y Stored XSS.

## Orden recomendado de trabajo
1. Revisar `docs/integracion_izipay.md`.
2. Crear `api/obtener-token.js` con variables de entorno de Vercel.
3. Implementar recalculo de total en servidor usando Firestore.
4. Ajustar frontend para pedir token al backend.
5. Asegurar confirmacion de pago y actualizacion de `paymentStatus`.
6. Cerrar regla de stock o mover descuento de stock al backend.
7. Hacer prueba manual completa: carrito, checkout, pago, pedido en admin, stock y comprobantes.

## Nota
No conviene priorizar nuevas funciones visuales antes de cerrar este bloque. Esto es lo que separa la tienda "funcional en construccion" de una tienda lista para cobrar con menor riesgo.

---

## Actualizacion 1 Julio 2026

Ver tambien: `docs/revision_estado_2026-07-01.md`.

### Estado actualizado
Ya existen los endpoints iniciales:

- `api/obtener-token.js`
- `api/confirmar-pago.js`
- `serve_dev.js` para probar localmente rutas API junto con la SPA.

Por lo tanto, la prioridad ya no es crear `api/obtener-token.js` desde cero. La prioridad ahora es endurecer y conectar correctamente el flujo completo:

1. Que el backend sea la fuente de verdad para monto, IGV, envio, cupon, stock y orden.
2. Que las credenciales de Izipay sean obligatorias por variables de entorno en produccion.
3. Que no exista boton o flujo de pago simulado accesible en produccion.
4. Que la confirmacion de pago no dependa de un `orderDocId` enviado por el cliente.
5. Que la orden quede asociada a un `orderId` verificable de Izipay.

### Pendientes concretos detectados
- **Pago simulado:** `js/views/checkout.js` contiene `btn-simulate-card-payment` y una llamada a `firebaseService.markOrderAsPaid()` para pruebas locales. Debe aislarse por entorno o eliminarse antes de publicar.
- **Credenciales sandbox/fallback:** `api/obtener-token.js` y `api/confirmar-pago.js` usan valores por defecto si faltan variables de entorno. En produccion deben fallar explicitamente.
- **Confirmacion por documento enviado desde frontend:** `api/confirmar-pago.js` recibe `orderDocId` del cliente. Es mejor confirmar por `orderId` asociado a Izipay y a una orden creada/reservada por backend.
- **Orden creada desde frontend:** `js/store.js` todavia crea la orden con total local. `api/obtener-token.js` recalcula el pago, pero falta unir orden y pago verificado.
- **Fallback anonimo:** `js/store.js` usa `customerId = "anonymous-client"` si falla auth anonima. Como las reglas exigen `customerId == request.auth.uid`, conviene eliminar el fallback y bloquear checkout con mensaje claro.
- **XSS buscador:** en `js/components/header.js`, los resultados del buscador todavia inyectan `productName`, `p.image` y `p.id` en `innerHTML` sin escape.
- **CORS:** `api/obtener-token.js` y `api/confirmar-pago.js` usan `Access-Control-Allow-Origin: *`; restringir en produccion.

### Orden recomendado actualizado
1. Aislar o eliminar el pago simulado.
2. Hacer obligatorias las variables de entorno de Izipay en produccion.
3. Unificar token, orden y confirmacion para que el backend sea la fuente de verdad.
4. Confirmar pago por `orderId` asociado a la orden, no por `orderDocId` recibido del cliente.
5. Eliminar fallback `anonymous-client`.
6. Completar sanitizacion del buscador.
7. Hacer prueba manual completa: carrito, checkout, pago, pedido en admin, stock y comprobantes.

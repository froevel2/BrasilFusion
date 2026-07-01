# Requerimientos del Cliente: Brasil Fusión

Este documento detalla la información del cliente, las necesidades clave de su negocio, cómo se abordan actualmente en la base de código y los pasos pendientes para lograr una automatización completa.

---

## 📋 Ficha del Cliente

* **Cliente:** Yasmin da Silva
* **Negocio:** **Brasil Fusión** ("Somos una empresa de ventas de alimentos brasileños")
* **Contacto:** `yasmin_lucia@hotmail.com`
* **Teléfono / WhatsApp:** `997732787`
* **Fecha de Creación del Requerimiento:** 16 de Junio de 2026
* **Plazo de Entrega:** Máximo 1 mes (Julio de 2026)

---

## 🎯 Necesidades de Negocio y Soluciones Técnicas

| Requerimiento del Cliente | Implementación en la Base de Código | Estado |
| :--- | :--- | :--- |
| **"Estructura clean y fácil acceso"** | SPA (Single Page Application) basada en hash routes. Configurada en [router.js](file:///c:/Users/user/Desktop/IA/Brazil%20Fusión/js/router.js) y optimizada para dispositivos móviles en [app.css](file:///c:/Users/user/Desktop/IA/Brazil%20Fusión/app.css). | **Completado** |
| **"Informaciones más detalladas como fecha de caducidad"** | Estructurada en los modelos del catálogo en [data.js](file:///c:/Users/user/Desktop/IA/Brazil%20Fusión/js/data.js) (`expiryDate`) y renderizada en la vista de producto ([product.js](file:///c:/Users/user/Desktop/IA/Brazil%20Fusión/js/views/product.js#L125-L129)) como *"Consumir antes de"*. | **Completado** |
| **"Dejar las ventas programadas para el día y hora disponibles"** | Formulario de envío en [checkout.js](file:///c:/Users/user/Desktop/IA/Brazil%20Fusión/js/views/checkout.js#L190-L204) con selector de fecha obligatorio (`type="date"`) y selector de rango de horas cargado dinámicamente desde Firestore (`fetchDeliverySlots`). | **Completado** |
| **"Centralizar información y organizar mejor el negocio"** | Panel de administración completo en [admin.js](file:///c:/Users/user/Desktop/IA/Brazil%20Fusión/js/views/admin.js) que permite filtrar pedidos por fecha de creación, fecha de entrega y estado de pago, además de gestionar productos y cupones. | **Completado** |
| **"Hacer sus compras y pagos en la página (automatizar proceso)"** | Flujo de carrito y checkout listo. Pasarela de pagos integrada para simulación. Falta conectar con pasarela real. | **En Progreso** |

---

## ⚠️ El Problema Principal a Resolver
> *"Dependo de WhatsApp para cerrar las compras y quiero automatizar procesos. Las ventas y atención usamos el Instagram y WhatsApp para cerrar."*

Actualmente, el flujo de ventas depende del contacto humano en WhatsApp para confirmar pagos e importes. La solución ideal requiere que la web actúe como un canal autónomo donde el pago sea validado automáticamente por el sistema.

---

## 🛣️ Hoja de Ruta (Pendientes para la próxima sesión)

Para finalizar el proyecto antes del plazo mensual, se deben ejecutar los siguientes pasos técnicos:

1. **Integración con Izipay (Pasarela de Pagos)**
   * **Función Serverless:** Crear el backend en `api/obtener-token.js` para comunicarse de manera segura con el API de Izipay (evitando exponer credenciales en el cliente).
   * **SDK de Pago:** Cargar el SDK Krypton en el `<head>` de [index.html](file:///c:/Users/user/Desktop/IA/Brazil%20Fusión/index.html).
   * **Formulario Seguro:** Modificar el checkout en [checkout.js](file:///c:/Users/user/Desktop/IA/Brazil%20Fusión/js/views/checkout.js) para embeber el iframe oficial de Izipay.
   * **Validación de Pago:** Vincular la respuesta exitosa para que actualice la base de datos a `paymentStatus: "paid"` dinámicamente usando `firebaseService.markOrderAsPaid()`.

2. **Despliegue y DNS**
   * Configurar repositorio de GitHub y enlazarlo con **Vercel** para hosting continuo y serverless functions gratuitas.
   * Configurar el dominio personalizado del cliente (`perufusionpe.com` o similar) y autorizarlo en la consola de Firebase Authentication.

3. **Prevención de SPAM**
   * Configurar un remitente de correo electrónico verificado (SMTP / dominio propio) en Firebase Auth para que los correos de restablecimiento de contraseña no caigan en la bandeja de correo no deseado.

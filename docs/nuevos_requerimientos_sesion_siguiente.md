# Nuevos Requerimientos y Tareas para la Siguiente Sesión

Este documento consolida los nuevos cambios sugeridos por la cliente (Yasmin da Silva) y los pendientes técnicos acumulados para ser abordados en la próxima sesión de trabajo.

---

## 📌 Nuevos Requerimientos Sugeridos por el Cliente

### 1. 📧 Notificaciones por Correo Instantáneas
* **Objetivo:** Enviar un correo electrónico de confirmación automático tanto al **cliente** como al **administrador** inmediatamente después de que se realice un pedido (especialmente cuando se marque como pagado).
* **Propuesta de Implementación:** 
  * Para evitar tener que pagar el plan de Firebase (Blaze) que requiere el uso de Cloud Functions de Firebase, utilizaremos la misma arquitectura de **Vercel** creada para Izipay.
  * Implementaremos una función serverless en `api/enviar-confirmacion.js` utilizando un proveedor de correos transaccionales gratuito como **Resend** o **SendGrid**.
  * Al completarse la orden en el cliente (o al ser aprobada por Izipay/Admin), el frontend invocará esta API para enviar los correos correspondientes con la plantilla del recibo.

### 2. 📖 Manual / Tutorial de Izipay para la Cliente
* **Objetivo:** Preparar una explicación sencilla para que Yasmin da Silva entienda cómo funciona la pasarela y cómo puede obtener las credenciales necesarias (Sandbox y Producción).
* **Entregable:** Un instructivo en PDF o documento claro que explique cómo ingresar al Back Office de Izipay, ubicar el *Shop ID*, la *clave hash* y la *clave pública*.

---

## ⚙️ Pendientes Técnicos de Integración y Despliegue

A continuación se detallan los pasos de infraestructura necesarios para culminar el proyecto:

### 1. 🚀 Despliegue en Producción (Vercel + GitHub)
* **GitHub:** Crear un repositorio y subir la versión limpia y optimizada de la base de código.
* **Vercel:** Enlazar el repositorio y configurar el despliegue automático ante cualquier commit.
* **Dominio Personalizado:** Comprar y configurar el dominio personalizado del cliente (ej. `brasilfusion.pe` o `perufusionpe.com`) en la configuración del proyecto en Vercel.

### 2. 💳 Pasarela de Pago Izipay (Real)
* **API Key de Producción:** Cambiar las variables de entorno en Vercel (`IZIPAY_SHOP_ID`, `IZIPAY_PASSWORD`) por las de producción provistas por el banco/Izipay.
* **Clave Pública:** Cambiar la clave en [index.html](file:///c:/Users/user/Desktop/IA/Brazil%20Fusión/index.html) por la clave pública de producción.
* **Redirección de Retorno:** Asegurar que tras un pago exitoso se actualice automáticamente el estado en Firestore a `paymentStatus: "paid"`.

### 3. 📧 Configuración de Remitente Personalizado en Firebase Auth
* **Problema Actual:** Los correos de recuperación de contraseña de Firebase por defecto (`noreply@brasilfusion-10ef2.firebaseapp.com`) suelen caer en la bandeja de SPAM/Correo no deseado de los usuarios.
* **Solución:** Configurar los registros DNS (SPF/DKIM) del dominio propio del cliente en el panel de Firebase Auth para usar un correo institucional (ej. `soporte@brasilfusion.pe`) como remitente verificado.

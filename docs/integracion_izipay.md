# Guía de Integración de Izipay (Vercel Serverless + Firebase)

Esta guía documenta la arquitectura y los pasos paso a paso necesarios para integrar la pasarela de pagos **Izipay** (modo formulario incrustado) en la tienda virtual **Brazil Fusión**.

---

## 🗺️ Arquitectura Elegida
* **Frontend:** Alojado en **Vercel** (HTML, Vanilla JS, CSS) con el dominio propio del cliente.
* **Backend de Pago (Seguro):** Una función serverless (`api/obtener-token.js`) ejecutándose gratis en **Vercel**. Esto evita tener que pagar el plan Blaze en Firebase.
* **Base de Datos y Autenticación:** Se mantienen en **Firebase** (Firestore y Auth), conectándose directamente desde el frontend.

---

## 🛠️ Paso 1: Configurar Vercel y GitHub
1. Sube este proyecto actual `Brazil Fusión` a un repositorio en tu cuenta de **GitHub** (privado o público).
2. Inicia sesión en [Vercel.com](https://vercel.com) con tu cuenta de GitHub.
3. Importa el proyecto.
4. Vercel te dará una URL temporal (ej. `brazil-fusion.vercel.app`). Cada cambio que subas a GitHub se actualizará en Vercel automáticamente.

---

## 🔑 Paso 2: Obtener Credenciales de Izipay (Pruebas)
Tu cliente debe solicitar a Izipay las credenciales de **Sandbox (Pruebas)**. Necesitarás:
1. **Shop ID** (Identificador de tienda).
2. **Clave Hash / Contraseña de API** (para el backend).
3. **Clave Pública (Public Key)** (para el frontend).

Una vez las tengas, agrégalas en el panel de control de tu proyecto en Vercel (*Settings -> Environment Variables*):
* `IZIPAY_SHOP_ID` = `[Tu Shop ID de pruebas]`
* `IZIPAY_PASSWORD` = `[Tu Contraseña de API de pruebas]`

---

## 💾 Paso 3: Código de la Función Serverless (Vercel)
Crea un archivo localmente en la ruta `api/obtener-token.js` con el siguiente código:

```javascript
// api/obtener-token.js
export default async function handler(req, res) {
  // Configurar cabeceras CORS para permitir peticiones desde tu local o URL temporal
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método no permitido' });
  }

  const { amount, orderId, email } = req.body;

  const SHOP_ID = process.env.IZIPAY_SHOP_ID || "COLOCA_AQUI_TU_SHOP_ID_DE_PRUEBA";
  const PASSWORD = process.env.IZIPAY_PASSWORD || "COLOCA_AQUI_TU_CONTRASEÑA_DE_API_DE_PRUEBA"; 

  const url = "https://api.micuentaweb.pe/api-payment/v4/Charge/CreatePayment";
  const authHeader = 'Basic ' + Buffer.from(`${SHOP_ID}:${PASSWORD}`).toString('base64');

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        amount: amount, // En céntimos. Ej: S/. 15.00 -> 1500
        currency: "PEN",
        orderId: orderId,
        customer: { email: email }
      })
    });

    const data = await response.json();
    
    if (data.status === "SUCCESS") {
      return res.status(200).json({ formToken: data.answer.formToken });
    } else {
      return res.status(400).json({ error: data.answer || "Error en la API de Izipay" });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Error interno del servidor de pagos" });
  }
}
```

---

## 🌐 Paso 4: Cambios en el Frontend

### A) Modificación en `index.html`
Agrega el SDK Krypton de Izipay en el `<head>` de tu archivo `index.html`:

```html
<!-- Cargar SDK de Izipay -->
<script 
  src="https://static.micuentaweb.pe/static/js/krypton-client/V4.0/stable/kr-payment-form.min.js"
  kr-public-key="COLOCA_AQUI_TU_CLAVE_PUBLICA_IZIPAY_DE_PRUEBA"
  kr-post-url-success="#/orders">
</script>

<!-- Estilos visuales del formulario clásico de Izipay -->
<link rel="stylesheet" href="https://static.micuentaweb.pe/static/js/krypton-client/V4.0/ext/classic-reset.css">
<script src="https://static.micuentaweb.pe/static/js/krypton-client/V4.0/ext/classic.js"></script>
```

### B) Modificación en `js/views/checkout.js`
En el formulario donde el usuario selecciona pago con Tarjeta de Crédito, reemplaza el formulario simulado por el contenedor de Izipay:

1. **En la vista HTML (`checkoutView`):**
   ```html
   <div class="payment-tab-content active" id="pay-card" style="margin-top: 1.5rem;">
     <div id="izipay-loading" class="text-center" style="padding: 1.5rem;">
       Cargando pasarela de pago segura...
     </div>
     
     <!-- Formulario embebido de Izipay (inicialmente oculto) -->
     <div class="kr-embedded" id="izipay-payment-form" style="display: none; margin: 0 auto; max-width: 400px;">
       <div class="kr-pan"></div>
       <div class="kr-expiry"></div>
       <div class="kr-security-code"></div>
       <button class="kr-payment-button"></button>
       <div class="kr-form-error"></div>
     </div>
   </div>
   ```

2. **En la inicialización (`checkoutView.init`):**
   Agrega una función que haga la petición a tu función de Vercel y configure Izipay:
   ```javascript
   async function cargarPasarelaIzipay(finalTotal, emailCliente) {
     const totalCentimos = Math.round(finalTotal * 100);
     const tempOrderId = `BF-${Math.floor(1000 + Math.random() * 9000)}`;

     try {
       const response = await fetch('/api/obtener-token', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({
           amount: totalCentimos,
           orderId: tempOrderId,
           email: emailCliente || 'cliente@example.com'
         })
       });

       const data = await response.json();

       if (data.formToken) {
         document.getElementById('izipay-loading').style.display = 'none';
         document.getElementById('izipay-payment-form').style.display = 'block';

         // Configurar el SDK de Izipay globalmente
         KR.setFormConfig({
           formToken: data.formToken,
           "kr-language": "es-ES"
         });
       } else {
         throw new Error("No se pudo generar el token de pago.");
       }
     } catch (err) {
       console.error(err);
       document.getElementById('izipay-loading').innerHTML = `
         <p class="text-danger">Error al iniciar pasarela de pagos. Por favor intenta de nuevo.</p>
       `;
     }
   }
   ```

---

## 🧪 Paso 5: Testear la compra
1. Guarda y sube todos tus cambios a GitHub (`git commit` y `git push`).
2. Entra a tu URL de Vercel e intenta realizar una compra de prueba.
3. El formulario de Izipay debería cargarse en la sección de tarjeta.
4. Usa los números de tarjeta de prueba de Izipay (que figuran en su documentación) para simular una compra exitosa y una denegada.

---

## 🚀 Paso 6: Lanzar a Producción (Dominio Final)
Una vez que todo funcione bien:
1. Compra tu dominio (`perufusionpe.com`) en Vercel y asígnalo al proyecto.
2. Entra a tu consola de Firebase y agrega el dominio en **Authentication -> Settings -> Authorized domains**.
3. Pídele a tu cliente sus credenciales de **Producción** de Izipay.
4. Reemplaza las variables de entorno de Sandbox en Vercel por las de Producción.
5. Reemplaza la clave pública en tu `index.html` por la clave pública de producción de Izipay.
6. ¡Listo! La página web estará en vivo cobrando con Izipay real.

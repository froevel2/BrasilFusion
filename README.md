# Brasil Fusión 🇧🇷🇵🇪

Tienda online de productos alimenticios brasileños en el Perú. Una aplicación web de página única (SPA) rápida, responsiva y segura, diseñada con **Vanilla JS**, **CSS3 puro** y estructurada para ser desplegada en **Vercel** utilizando **Firebase** para base de datos y **Izipay** como pasarela de pagos integrada de forma segura.

---

## 🚀 Características del Proyecto

* **Catálogo Multilingüe:** Soporte completo en Español y Portugués para fichas de productos, categorías, y filtros interactivos.
* **Precios de Oferta (`salePrice`):** Gestión dinámica de precios regulares tachados y destacados con porcentaje de descuento calculado automáticamente.
* **Checkout Seguro (Backend Verificado):** Recálculo de totales, IGV (18%), costos de delivery, stock y cupones directamente en el servidor antes de invocar la pasarela de pagos.
* **Pasarela Izipay Integrada:** Formulario clásico incrustado (embedded) conectado mediante Vercel Serverless Functions a la API oficial de Izipay con validación de firmas criptográficas HMAC-SHA256.
* **Envíos Especiales (Provincias Shalom):** Selección inteligente de Departamento y Provincia para Shalom ("Pago en destino") con exclusión de domingos y deshabilitación automatizada de rangos de entrega locales.
* **Seguridad de Stock (Firebase Rules):** Autenticación anónima integrada para invitados que previene el sabotaje de stock y restringe la lectura de comprobantes de pago solo a administradores.
* **Panel de Administración Completo:** Control total de inventario (añadir/editar múltiples fotos por producto, stock), categorías (selector de imágenes basado en productos), cupones, y filtros de pedidos por fecha y estado de pago.

---

## 🛠️ Tecnologías Utilizadas

* **Frontend:** HTML5, Javascript ES6 (Vanilla JS), CSS3 (diseño modular con variables de tema claro/oscuro y responsive mobile).
* **Backend:** Vercel Serverless Functions (Node.js).
* **Base de Datos & Auth:** Firebase Firestore, Firebase Storage y Firebase Authentication.
* **Pasarela de Pagos:** Izipay (SDK Krypton V4.0).
* **Iconos:** Lucide Icons.

---

## 💻 Desarrollo Local

Para correr y probar la aplicación web localmente en tu máquina:

1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/froevel2/BrasilFusion.git
   cd BrasilFusion
   ```

2. **Iniciar un servidor local:**
   Puedes usar `npx serve` para levantar el servidor en el puerto de desarrollo configurado (`55112`):
   ```bash
   npx serve -l 55112
   ```
   Abre [http://localhost:55112](http://localhost:55112) en tu navegador.

---

## 📦 Despliegue en Producción (Vercel)

Esta arquitectura está lista para ser desplegada en Vercel con integración continua (CI/CD):

1. **Importar el proyecto en Vercel:** Conecta tu cuenta de GitHub a Vercel e importa el repositorio `BrasilFusion`.
2. **Configurar las Variables de Entorno (Environment Variables):**
   Agrega las siguientes variables en la configuración de tu proyecto en Vercel:
   * `IZIPAY_SHOP_ID`: Identificador de Tienda provisto por Izipay.
   * `IZIPAY_PASSWORD`: Contraseña de API provista por Izipay.
   * `IZIPAY_HMAC_SHA256`: Clave hash HMAC-SHA-256 para validación segura de firmas (Return to shop).
   * `FIREBASE_SERVICE_ACCOUNT`: Archivo JSON de tu cuenta de servicio de Firebase codificado en **Base64** para permitir escrituras seguras en Firestore desde el backend.
3. **Clave Pública en index.html:**
   Actualiza la clave pública del SDK Krypton en el archivo `index.html`:
   ```html
   kr-public-key="TU_CLAVE_PUBLICA_PRODUCCION"
   ```
4. **Autorizar Dominio en Firebase Console:**
   En la consola de Firebase, navega a **Authentication > Settings > Authorized Domains** y agrega tu dominio personalizado (ej. `brasilfusion.pe` o la URL de Vercel) para que funcione el inicio de sesión y la autenticación anónima.

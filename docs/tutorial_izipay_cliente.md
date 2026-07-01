# Guía Rápida para Yasmin: Cómo obtener las credenciales de Izipay (Pruebas / Sandbox)

Esta guía explica paso a paso, de forma muy sencilla y sin tecnicismos, cómo Yasmin puede conseguir los accesos de prueba para que podamos configurar Izipay en la tienda.

---

## 📬 Paso 1: Revisar el correo de bienvenida de Izipay
Al contratar la pasarela de pagos con Izipay, ellos te envían un correo con las credenciales de prueba.
* **Correo donde buscar:** Revisa tu bandeja de entrada en `yasmin_lucia@hotmail.com` (y también en **Correo no deseado / SPAM**).
* **Remitente:** Izipay o **Micuentaweb** (es el socio tecnológico de Izipay).
* **Asunto del correo:** Suele llamarse *"Bienvenido a Izipay - Accesos de integración"* o *"Tus credenciales de prueba / Sandbox"*.

> [!TIP]
> A veces, el **Shop ID**, la **Clave Pública** y la **Contraseña** ya vienen escritos directamente dentro de este correo. Si es así, simplemente cópialos y envíaselos a tu programador. Si no vienen en el texto, sigue con el Paso 2.

---

## 🌐 Paso 2: Entrar al Panel de Pruebas (Back Office)
Si las claves no están en el correo, deberás ingresar a su panel:
1. Haz clic en el enlace del panel que viene en el correo o ingresa a: **[https://secure.micuentaweb.pe/](https://secure.micuentaweb.pe/)**
2. Coloca tu **usuario** (tu correo electrónico) y la **contraseña** temporal que te indicaron en el email.
3. Si te lo pide por seguridad, realiza el cambio de contraseña.

---

## 🔑 Paso 3: Ubicar las Claves en el Panel
Una vez que hayas iniciado sesión:
1. En el menú de la izquierda, haz clic en **Configuración** (o *Paramétrage*).
2. Selecciona la opción **Tienda** (o *Boutique*).
3. Haz clic en la pestaña **Claves de API** (o *Clés d'API*).
4. Verás dos secciones: una que dice "Producción" (estará vacía) y otra que dice **"Test" / "Pruebas"** (esta es la que necesitamos).

Envía a tu programador estos **3 datos exactos**:

1. **Shop ID (Identificador de Tienda):** Un número de 8 dígitos (ejemplo: `87654321`).
2. **Clave Pública (Public Key):** Un texto largo que empieza con `TEST` (ejemplo: `TEST:87654321...`).
3. **Clave Hash / Contraseña de API:** Una contraseña secreta larga de letras y números (ejemplo: `prod_key_...` o `test_key_...`).

---

## ℹ️ ¿Qué pasa si no encuentras el correo o no tienes los accesos?
Si no encuentras el correo de bienvenida o no te permite entrar, no te preocupes:
* **Escribe a tu asesor de Izipay** o llámalos por teléfono diciendo lo siguiente:
  > *"Hola, estoy integrando la pasarela de pagos en mi página web a medida y mi programador me solicita las **credenciales de Sandbox (pruebas) de Micuentaweb**: el Shop ID, la Clave Pública y la Contraseña de la API de pruebas. ¿Podrían reenviármelas por favor?"*
* Izipay te las enviará nuevamente al correo en cuestión de minutos.

import admin from 'firebase-admin';

// Initialize firebase admin
if (!admin.apps.length) {
  let credential;
  
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
      const sa = JSON.parse(
        process.env.FIREBASE_SERVICE_ACCOUNT.startsWith('{')
          ? process.env.FIREBASE_SERVICE_ACCOUNT
          : Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT, 'base64').toString('utf8')
      );
      credential = admin.credential.cert(sa);
    } catch (e) {
      console.error("Error parsing FIREBASE_SERVICE_ACCOUNT environment variable:", e);
    }
  } else if (process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
    credential = admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID || "brasilfusion-10ef2",
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    });
  }

  try {
    const adminConfig = {
      projectId: "brasilfusion-10ef2"
    };
    if (credential) {
      adminConfig.credential = credential;
    }
    admin.initializeApp(adminConfig);
  } catch (err) {
    console.error("Firebase Admin initialization error:", err);
  }
}

// Helper to parse Firestore REST API fields structure to regular JS object
function parseFirestoreRestFields(fields) {
  if (!fields) return {};
  const result = {};
  for (const key of Object.keys(fields)) {
    const valObj = fields[key];
    if (valObj.stringValue !== undefined) {
      result[key] = valObj.stringValue;
    } else if (valObj.doubleValue !== undefined) {
      result[key] = Number(valObj.doubleValue);
    } else if (valObj.integerValue !== undefined) {
      result[key] = Number(valObj.integerValue);
    } else if (valObj.booleanValue !== undefined) {
      result[key] = valObj.booleanValue;
    } else if (valObj.mapValue !== undefined) {
      result[key] = parseFirestoreRestFields(valObj.mapValue.fields);
    } else if (valObj.arrayValue !== undefined) {
      result[key] = (valObj.arrayValue.values || []).map(v => {
        if (v.stringValue !== undefined) return v.stringValue;
        if (v.doubleValue !== undefined) return Number(v.doubleValue);
        if (v.integerValue !== undefined) return Number(v.integerValue);
        if (v.booleanValue !== undefined) return v.booleanValue;
        if (v.mapValue !== undefined) return parseFirestoreRestFields(v.mapValue.fields);
        return null;
      });
    }
  }
  return result;
}

// Robust helper to get a Firestore document with REST API fallback (for zero-env local dev)
async function getFirestoreDocument(collectionName, docId) {
  // 1. Try Firebase Admin SDK first
  try {
    if (admin.apps.length) {
      const db = admin.firestore();
      const docSnap = await db.collection(collectionName).doc(docId).get();
      if (docSnap.exists) {
        return docSnap.data();
      }
      return null;
    }
  } catch (adminErr) {
    console.warn(`Firebase Admin SDK get failed for ${collectionName}/${docId}. Falling back to REST API.`, adminErr.message);
  }

  // 2. Fallback to public Firestore REST API
  try {
    const url = `https://firestore.googleapis.com/v1/projects/brasilfusion-10ef2/databases/(default)/documents/${collectionName}/${docId}`;
    const res = await fetch(url);
    if (!res.ok) {
      if (res.status === 404) return null;
      throw new Error(`REST API returned HTTP ${res.status}`);
    }
    const data = await res.json();
    return parseFirestoreRestFields(data.fields);
  } catch (restErr) {
    console.error(`Failed to retrieve document ${collectionName}/${docId} via REST API fallback:`, restErr);
    throw restErr;
  }
}

function getShippingCost(district, manualProvinceRate = 0, isHomeDelivery = false) {
  if (district === 'Provincia (Shalom)' || district === 'Provincias (Shalom - Pago en destino)') {
    return Number(manualProvinceRate) + (isHomeDelivery ? 10 : 0);
  }
  
  const zones = {
    'Miraflores': 7, 'Surquillo': 7, 'San Isidro': 7, 'Barranco': 7, 'Lince': 7,
    'San Borja': 10, 'La Victoria': 10, 'Jesús María': 10, 'Breña': 10, 'San Luis': 10, 'Magdalena del Mar': 10, 'Santiago de Surco': 10,
    'San Miguel': 13, 'La Molina': 13, 'Chorrillos': 13, 'Pueblo Libre': 13, 'Santa Anita': 13, 'Rímac': 13, 'Cercado de Lima': 13, 'Villa María del Triunfo': 13, 'San Juan de Miraflores': 13,
    'San Martín de Porres': 18, 'Los Olivos': 18, 'Comas': 18, 'Callao': 18
  };
  const cost = zones[district];
  return cost !== undefined ? cost : 7.00;
}

export default async function handler(req, res) {
  // CORS configurations
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método no permitido' });
  }

  try {
    const { items, shippingInfo, couponCode, email } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "El carrito está vacío o no es válido." });
    }

    if (!shippingInfo || !shippingInfo.district) {
      return res.status(400).json({ error: "La información de envío es requerida." });
    }

    // 1. Recalculate subtotal using prices retrieved from Firestore
    let subtotal = 0;
    for (const item of items) {
      const prod = await getFirestoreDocument('productos', item.productId);
      if (!prod) {
        return res.status(400).json({ error: `Producto no encontrado en la base de datos: ${item.productId}` });
      }

      const qty = Number(item.quantity) || 0;
      if (qty <= 0) continue;

      // Validate stock
      const stock = Number(prod.stock) || 0;
      if (stock < qty) {
        const prodName = prod.name?.es || prod.name || item.productId;
        return res.status(400).json({ error: `Stock insuficiente para el producto ${prodName}. Quedan ${stock} unidades.` });
      }

      const price = Number(prod.price) || 0;
      const salePrice = Number(prod.salePrice) || 0;
      const finalUnitPrice = (salePrice > 0 && salePrice < price) ? salePrice : price;

      subtotal += finalUnitPrice * qty;
    }

    // 2. Validate coupon and calculate discount
    let discountPercent = 0;
    if (couponCode) {
      const config = await getFirestoreDocument('configuracion', 'general');
      const coupon = config?.coupon || {};
      if (coupon.active && coupon.code && coupon.code.toUpperCase() === couponCode.toUpperCase()) {
        discountPercent = (Number(coupon.discount) || 0) / 100;
      }
    }

    const discountAmount = subtotal * discountPercent;
    const taxableBase = subtotal - discountAmount;
    const igv = taxableBase * 0.18;

    // 3. Calculate shipping cost
    const manualProvinceRate = Number(shippingInfo.manualProvinceRate) || 0;
    const isHomeDelivery = !!shippingInfo.isHomeDelivery;
    const shippingCost = getShippingCost(shippingInfo.district, manualProvinceRate, isHomeDelivery);

    // 4. Calculate total amount
    const total = taxableBase + igv + shippingCost;
    const amountCentimos = Math.round(total * 100);

    // 5. Generate temporal order ID
    const tempOrderId = `BF-${Math.floor(1000 + Math.random() * 9000)}`;

    // 6. Request formToken from Izipay
    // Default credentials are standard public sandbox creds
    const SHOP_ID = process.env.IZIPAY_SHOP_ID || "80126588";
    const PASSWORD = process.env.IZIPAY_PASSWORD || "testpassword_LhIu6rZ8c0Y1v86XU678FhD786Xy6Z";

    const url = "https://api.micuentaweb.pe/api-payment/V4/Charge/CreatePayment";
    const authHeader = 'Basic ' + Buffer.from(`${SHOP_ID}:${PASSWORD}`).toString('base64');

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        amount: amountCentimos,
        currency: "PEN",
        orderId: tempOrderId,
        customer: { email: email || 'cliente@example.com' }
      })
    });

    const responseText = await response.text();
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error(`Failed to parse Izipay response as JSON. Status: ${response.status}, URL: ${url}, Body: ${responseText}`);
      return res.status(500).json({ error: `La pasarela de pagos devolvió una respuesta inválida (HTTP ${response.status}).` });
    }

    if (data.status === "SUCCESS") {
      return res.status(200).json({ 
        formToken: data.answer.formToken,
        orderId: tempOrderId,
        total: total,
        subtotal: subtotal,
        discount: discountAmount,
        igv: igv,
        shipping: shippingCost
      });
    } else {
      return res.status(400).json({ error: data.answer || "Error al comunicarse con Izipay" });
    }
  } catch (error) {
    console.error("Error inside handler api/obtener-token.js:", error);
    return res.status(500).json({ error: "Error del servidor de pagos al procesar el token." });
  }
}

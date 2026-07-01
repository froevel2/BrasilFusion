import admin from 'firebase-admin';
import crypto from 'crypto';

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

export default async function handler(req, res) {
  // CORS configuration
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
    const { clientAnswer, hash, orderDocId } = req.body;

    if (!clientAnswer || !hash || !orderDocId) {
      return res.status(400).json({ error: "Faltan parámetros requeridos: clientAnswer, hash, y orderDocId." });
    }

    // Retrieve HMAC key (default is standard sandbox key)
    const HMAC_KEY = process.env.IZIPAY_HMAC_SHA256 || "1881775791244439";

    // 1. Calculate HMAC-SHA256 of the raw string clientAnswer (kr-answer)
    // The clientAnswer parameter is sent as a string by Krypton SDK
    const rawAnswer = typeof clientAnswer === 'string' ? clientAnswer : JSON.stringify(clientAnswer);
    const computedHash = crypto.createHmac('sha256', HMAC_KEY).update(rawAnswer).digest('hex');

    // 2. Validate signature
    if (computedHash !== hash) {
      console.error("Signature verification failed. Computed:", computedHash, "Received:", hash);
      return res.status(401).json({ error: "Verificación de firma inválida. La transacción podría estar adulterada." });
    }

    // 3. Parse and check payment status
    const parsedAnswer = typeof clientAnswer === 'string' ? JSON.parse(clientAnswer) : clientAnswer;
    const orderStatus = parsedAnswer.orderStatus; // e.g. "PAID" or "UNPAID"

    if (orderStatus !== "PAID") {
      return res.status(400).json({ 
        error: `El estado del pago es ${orderStatus}. Transacción no completada.`, 
        orderStatus 
      });
    }

    // 4. Update the order in Firestore to mark it as paid
    let dbUpdated = false;
    try {
      if (admin.apps.length) {
        const db = admin.firestore();
        await db.collection('pedidos').doc(orderDocId).update({
          paymentStatus: 'paid'
        });
        dbUpdated = true;
      }
    } catch (dbErr) {
      console.warn("Could not update order status in database. Verify service account permissions.", dbErr.message);
    }

    return res.status(200).json({ 
      success: true, 
      message: "Pago verificado exitosamente.",
      dbUpdated,
      orderId: parsedAnswer.orderId
    });
  } catch (error) {
    console.error("Error inside handler api/confirmar-pago.js:", error);
    return res.status(500).json({ error: "Error del servidor al confirmar el pago." });
  }
}

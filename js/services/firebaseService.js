import { auth, db, storage } from '../firebase-init.js';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  signInAnonymously
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  query, 
  where, 
  orderBy, 
  runTransaction,
  onSnapshot 
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL,
  deleteObject,
  listAll
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js';

import { PRODUCTS, TESTIMONIALS, FAQS } from '../data.js';

class FirebaseService {
  // ==========================================================================
  // AUTHENTICATION SERVICES
  // ==========================================================================
  async loginUser(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Fetch user profile details
      const profile = await this.getUserProfile(user.uid);
      return { user, profile };
    } catch (error) {
      console.error("Firebase Login Error:", error);
      throw error;
    }
  }

  async registerUser(name, email, password) {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Save user profile details in Firestore
      const profileData = {
        uid: user.uid,
        name: name,
        email: email,
        phone: "",
        address: "",
        avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150",
        role: "client",
        createdAt: new Date().toISOString()
      };

      await setDoc(doc(db, "clientes", user.uid), profileData);
      return { user, profile: profileData };
    } catch (error) {
      console.error("Firebase Registration Error:", error);
      throw error;
    }
  }

  async loginWithGoogle() {
    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      const user = userCredential.user;
      
      // Check if profile exists, if not create one with Google details
      let profile = null;
      const adminDoc = await getDoc(doc(db, "administradores", user.uid));
      if (adminDoc.exists()) {
        profile = { ...adminDoc.data(), uid: user.uid, role: "admin" };
      } else {
        const clientDoc = await getDoc(doc(db, "clientes", user.uid));
        if (clientDoc.exists()) {
          profile = { ...clientDoc.data(), uid: user.uid, role: "client" };
        } else {
          // Create new profile with Google details
          profile = {
            uid: user.uid,
            name: user.displayName || user.email?.split('@')[0] || "Cliente",
            email: user.email || "",
            phone: "",
            address: "",
            avatar: user.photoURL || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150",
            role: "client",
            createdAt: new Date().toISOString()
          };
          await setDoc(doc(db, "clientes", user.uid), profile);
        }
      }
      return { user, profile };
    } catch (error) {
      console.error("Firebase Google Login Error:", error);
      throw error;
    }
  }

  async loginAnonymously() {
    try {
      const userCredential = await signInAnonymously(auth);
      return userCredential.user;
    } catch (error) {
      console.error("Firebase Anonymous Login Error:", error);
      throw error;
    }
  }

  async logoutUser() {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Firebase Logout Error:", error);
      throw error;
    }
  }

  observeAuthState(callback) {
    return onAuthStateChanged(auth, async (user) => {
      if (user) {
        const profile = await this.getUserProfile(user.uid);
        callback(user, profile);
      } else {
        callback(null, null);
      }
    });
  }

  async getUserProfile(uid) {
    // 1. Check if user is an Admin
    const adminDoc = await getDoc(doc(db, "administradores", uid));
    if (adminDoc.exists()) {
      return { ...adminDoc.data(), uid, role: "admin" };
    }

    // 2. Check if user is a Client
    const clientDoc = await getDoc(doc(db, "clientes", uid));
    if (clientDoc.exists()) {
      return { ...clientDoc.data(), uid, role: "client" };
    }

    // If document doesn't exist, create a default client profile (fallback)
    const fallbackProfile = {
      uid,
      name: auth.currentUser?.email?.split('@')[0] || "Cliente",
      email: auth.currentUser?.email || "",
      phone: "",
      address: "",
      avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150",
      role: "client",
      createdAt: new Date().toISOString()
    };
    await setDoc(doc(db, "clientes", uid), fallbackProfile);
    return fallbackProfile;
  }

  async updateUserProfile(uid, data) {
    try {
      // Check role
      const profile = await this.getUserProfile(uid);
      const collectionName = profile.role === "admin" ? "administradores" : "clientes";
      
      const docRef = doc(db, collectionName, uid);
      await updateDoc(docRef, data);
      return true;
    } catch (error) {
      console.error("Firebase Update Profile Error:", error);
      throw error;
    }
  }

  // ==========================================================================
  // FIRESTORE DATABASE SERVICES
  // ==========================================================================
  async fetchProducts() {
    try {
      const q = query(collection(db, "productos"));
      const snapshot = await getDocs(q);
      const list = [];
      snapshot.forEach(doc => {
        list.push({ ...doc.data(), id: doc.id });
      });
      return list;
    } catch (error) {
      console.error("Firebase Fetch Products Error:", error);
      throw error;
    }
  }

  async fetchCategories() {
    try {
      const snapshot = await getDocs(collection(db, "categorias"));
      const list = [];
      snapshot.forEach(doc => {
        list.push({ ...doc.data(), id: doc.id });
      });
      return list;
    } catch (error) {
      console.error("Firebase Fetch Categories Error:", error);
      throw error;
    }
  }

  async fetchOrders(uid, role = "client") {
    try {
      let q;
      if (role === "admin") {
        // Admins can see all orders sorted by date
        q = query(collection(db, "pedidos"), orderBy("date", "desc"));
      } else {
        // Clients only see their own orders
        q = query(collection(db, "pedidos"), where("customerId", "==", uid));
      }
      
      const snapshot = await getDocs(q);
      const list = [];
      snapshot.forEach(doc => {
        list.push({ ...doc.data(), docId: doc.id });
      });
      // Sort client-side by exact timestamp (createdAt) descending, falling back to date comparison
      list.sort((a, b) => {
        const timeA = a.createdAt || (a.date ? new Date(a.date).getTime() : 0);
        const timeB = b.createdAt || (b.date ? new Date(b.date).getTime() : 0);
        return timeB - timeA;
      });
      return list;
    } catch (error) {
      console.error("Firebase Fetch Orders Error:", error);
      throw error;
    }
  }

  subscribeToOrders(callback) {
    const q = query(collection(db, "pedidos"), orderBy("date", "desc"));
    return onSnapshot(q, (snapshot) => {
      const list = [];
      snapshot.forEach(doc => {
        list.push({ ...doc.data(), docId: doc.id });
      });
      // Sort client-side by exact timestamp (createdAt) descending, falling back to date comparison
      list.sort((a, b) => {
        const timeA = a.createdAt || (a.date ? new Date(a.date).getTime() : 0);
        const timeB = b.createdAt || (b.date ? new Date(b.date).getTime() : 0);
        return timeB - timeA;
      });
      callback(list);
    }, (error) => {
      console.error("Firebase Subscribe Orders Error:", error);
    });
  }

  async createOrder(orderData) {
    try {
      // Placing order using firestore transaction to atomically update stocks
      const orderRef = doc(collection(db, "pedidos"));
      
      await runTransaction(db, async (transaction) => {
        const productUpdates = [];

        // 1. Perform all READS first
        for (const item of orderData.items) {
          const productRef = doc(db, "productos", item.productId);
          const productSnap = await transaction.get(productRef);
          
          if (!productSnap.exists()) {
            throw new Error(`El producto ${item.productId} no existe.`);
          }
          
          const product = productSnap.data();
          if (product.stock < item.quantity) {
            throw new Error(`Stock insuficiente para ${product.name.es || product.name}. Solo quedan ${product.stock} unidades.`);
          }
          
          productUpdates.push({
            ref: productRef,
            newStock: product.stock - item.quantity
          });
        }
        
        // 2. Perform all WRITES after all reads are completed
        for (const update of productUpdates) {
          transaction.update(update.ref, {
            stock: update.newStock
          });
        }
        
        // 3. Write order document
        transaction.set(orderRef, orderData);
      });

      return { ...orderData, docId: orderRef.id };
    } catch (error) {
      console.error("Firebase Create Order Transaction Error:", error);
      throw error;
    }
  }

  // ==========================================================================
  // STORAGE & SEEDING SERVICES
  // ==========================================================================
  async seedInitialDatabase() {
    try {
      const productsSnap = await getDocs(collection(db, "productos"));
      if (!productsSnap.empty) {
        console.log("Firestore already contains data. Seeding skipped.");
        return false;
      }

      console.log("Firestore is empty. Starting database auto-seeding...");

      // 1. Seed Categories
      const categories = [
        { id: "Alimentos", name: { es: "Alimentos", pt: "Alimentos" }, image: "https://images.unsplash.com/photo-1541518763669-27fef04b14ea?auto=format&fit=crop&q=80&w=600" },
        { id: "Bebidas", name: { es: "Bebidas", pt: "Bebidas" }, image: "assets/images/coffee.png" },
        { id: "Snacks e doces", name: { es: "Snacks e doces", pt: "Snacks e doces" }, image: "assets/images/brigadeiros.png" },
        { id: "Packs", name: { es: "Packs", pt: "Packs" }, image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=600" },
        { id: "Sin Gluten", name: { es: "Sin Gluten", pt: "Sem Glúten" }, image: "assets/images/pao_de_queijo.png" },
        { id: "Novedades", name: { es: "Novedades", pt: "Novidades" }, image: "assets/images/guarana.png" }
      ];

      for (const cat of categories) {
        await setDoc(doc(db, "categorias", cat.id), cat);
      }

      // 2. Upload images to Storage and Seed Products
      for (const prod of PRODUCTS) {
        let finalImageUrl = prod.image;

        // If it's a local asset, upload it to Firebase Storage
        if (prod.image.startsWith("assets/images/")) {
          try {
            console.log(`Uploading ${prod.image} to Storage...`);
            const response = await fetch(prod.image);
            const blob = await response.blob();
            
            const fileExtension = prod.image.split('.').pop();
            const storagePath = `productos/${prod.id}.${fileExtension}`;
            const storageRef = ref(storage, storagePath);
            
            await uploadBytes(storageRef, blob);
            finalImageUrl = await getDownloadURL(storageRef);
            console.log(`Uploaded successfully! URL: ${finalImageUrl}`);
          } catch (storageErr) {
            console.error(`Error uploading image for ${prod.id} to Storage:`, storageErr);
            // Fallback to original path in case of storage permission issues
            finalImageUrl = prod.image;
          }
        }

        const productDoc = {
          price: prod.price,
          stock: prod.stock,
          expiryDate: prod.expiryDate,
          image: finalImageUrl,
          rating: prod.rating,
          reviewsCount: prod.reviewsCount,
          weight: prod.weight || "",
          name: prod.name,
          category: prod.category,
          description: prod.description,
          ingredients: prod.ingredients || { es: "", pt: "" },
          tags: prod.tags
        };

        await setDoc(doc(db, "productos", prod.id), productDoc);
      }

      // 3. Seed Available Hours/Slots
      const slots = [
        { id: "slot-1", label: { es: "9:00 AM - 1:00 PM", pt: "9h00 - 13h00" }, active: true },
        { id: "slot-2", label: { es: "2:00 PM - 6:00 PM", pt: "14h00 - 18h00" }, active: true }
      ];

      for (const slot of slots) {
        await setDoc(doc(db, "horariosDisponibles", slot.id), slot);
      }

      // 4. Seed Configs
      const generalConfig = {
        contactPhone: "+51987654321",
        coupon: { code: "FUSION10", discount: 10, active: false }
      };
      await setDoc(doc(db, "configuracion", "general"), generalConfig);

      // 5. Create a default admin user
      const defaultAdmin = {
        uid: "admin-fallback-uid",
        name: "Administrador Brasil Fusión",
        email: "admin@brasilfusion.pe",
        role: "admin"
      };
      await setDoc(doc(db, "administradores", "admin-fallback-uid"), defaultAdmin);

      console.log("Database seeded successfully!");
      return true;
    } catch (error) {
      console.error("Database Seeding Error:", error);
      return false;
    }
  }

  // ==========================================================================
  // ADMIN DASHBOARD SERVICES
  // ==========================================================================
  async addProduct(prod) {
    try {
      await setDoc(doc(db, "productos", prod.id), prod);
      return true;
    } catch (error) {
      console.error("Firebase Add Product Error:", error);
      throw error;
    }
  }

  async updateProduct(id, prod) {
    try {
      await setDoc(doc(db, "productos", id), prod, { merge: true });
      return true;
    } catch (error) {
      console.error("Firebase Update Product Error:", error);
      throw error;
    }
  }

  async deleteProduct(id) {
    try {
      await deleteDoc(doc(db, "productos", id));
      return true;
    } catch (error) {
      console.error("Firebase Delete Product Error:", error);
      throw error;
    }
  }

  async uploadProductImage(file, id) {
    try {
      const storagePath = `productos/${id}/${file.name}`;
      const storageRef = ref(storage, storagePath);
      await uploadBytes(storageRef, file);
      return await getDownloadURL(storageRef);
    } catch (error) {
      console.error("Firebase Storage Upload Product Image Error:", error);
      throw error;
    }
  }

  async deleteProductImages(id) {
    try {
      const folderRef = ref(storage, `productos/${id}`);
      const result = await listAll(folderRef);
      const deletions = result.items.map(item => deleteObject(item));
      await Promise.allSettled(deletions);
    } catch (error) {
      if (error.code !== 'storage/object-not-found') {
        console.warn("Could not delete old images for", id, error);
      }
    }
  }

  async uploadOrderVoucher(file, orderId) {
    try {
      const safeExtension = file.name.split('.').pop()?.toLowerCase() || 'bin';
      const uniqueId = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const storagePath = `comprobantes/${orderId}/${uniqueId}.${safeExtension}`;
      const storageRef = ref(storage, storagePath);
      await uploadBytes(storageRef, file);
      return await getDownloadURL(storageRef);
    } catch (error) {
      console.error("Firebase Storage Upload Voucher Error:", error);
      throw error;
    }
  }

  async deleteOrderVoucher(orderDocId, voucherUrl) {
    try {
      if (voucherUrl) {
        const storageRef = ref(storage, voucherUrl);
        await deleteObject(storageRef);
      }
      await updateDoc(doc(db, "pedidos", orderDocId), { voucherUrl: "" });
      return true;
    } catch (error) {
      if (error.code !== 'storage/object-not-found') {
        console.error("Firebase Delete Voucher Error:", error);
      }
      await updateDoc(doc(db, "pedidos", orderDocId), { voucherUrl: "" });
      return true;
    }
  }

  async addCategory(cat) {
    try {
      await setDoc(doc(db, "categorias", cat.id), cat);
      return true;
    } catch (error) {
      console.error("Firebase Add Category Error:", error);
      throw error;
    }
  }

  async updateCategory(id, cat) {
    try {
      await setDoc(doc(db, "categorias", id), cat, { merge: true });
      return true;
    } catch (error) {
      console.error("Firebase Update Category Error:", error);
      throw error;
    }
  }

  async deleteCategory(id) {
    try {
      await deleteDoc(doc(db, "categorias", id));
      return true;
    } catch (error) {
      console.error("Firebase Delete Category Error:", error);
      throw error;
    }
  }

  async updateOrderStatus(orderId, status) {
    try {
      const orderRef = doc(db, "pedidos", orderId);
      const updateData = { status };
      
      if (status === "Entregado") {
        const orderSnap = await getDoc(orderRef);
        if (orderSnap.exists()) {
          const orderData = orderSnap.data();
          if (orderData.shipping && 
              (orderData.shipping.deliveryDate === "Por definir (Shalom)" || 
               !orderData.shipping.deliveryDate || 
               orderData.shipping.deliveryDate.includes("Por definir"))) {
            const today = new Date().toISOString().split('T')[0];
            updateData["shipping.deliveryDate"] = `Entregado (${today})`;
            updateData["shipping.timeSlot"] = "Completado";
          }
        }
      }
      
      await updateDoc(orderRef, updateData);
      return true;
    } catch (error) {
      console.error("Firebase Update Order Status Error:", error);
      throw error;
    }
  }

  async markOrderAsPaid(orderDocId) {
    try {
      await updateDoc(doc(db, "pedidos", orderDocId), { paymentStatus: "paid" });
      return true;
    } catch (error) {
      console.error("Firebase Mark Order As Paid Error:", error);
      throw error;
    }
  }

  async fetchAllCustomers() {
    try {
      const snapshot = await getDocs(collection(db, "clientes"));
      const list = [];
      snapshot.forEach(doc => {
        list.push({ ...doc.data(), uid: doc.id });
      });
      return list;
    } catch (error) {
      console.error("Firebase Fetch All Customers Error:", error);
      throw error;
    }
  }

  async fetchAllAdmins() {
    try {
      const snapshot = await getDocs(collection(db, "administradores"));
      const list = [];
      snapshot.forEach(doc => {
        list.push({ ...doc.data(), uid: doc.id });
      });
      return list;
    } catch (error) {
      console.error("Firebase Fetch All Admins Error:", error);
      throw error;
    }
  }

  async addAdmin(uid, name, email) {
    try {
      const adminData = {
        uid,
        name,
        email,
        role: "admin"
      };
      await setDoc(doc(db, "administradores", uid), adminData);
      return true;
    } catch (error) {
      console.error("Firebase Add Admin Error:", error);
      throw error;
    }
  }

  async removeAdmin(uid) {
    try {
      await deleteDoc(doc(db, "administradores", uid));
      return true;
    } catch (error) {
      console.error("Firebase Remove Admin Error:", error);
      throw error;
    }
  }

  async updateGeneralConfig(configData) {
    try {
      await setDoc(doc(db, "configuracion", "general"), configData, { merge: true });
      return true;
    } catch (error) {
      console.error("Firebase Update General Config Error:", error);
      throw error;
    }
  }

  async fetchDeliverySlots() {
    try {
      const snapshot = await getDocs(collection(db, "horariosDisponibles"));
      const list = [];
      snapshot.forEach(doc => {
        list.push({ ...doc.data(), id: doc.id });
      });
      return list;
    } catch (error) {
      console.error("Firebase Fetch Delivery Slots Error:", error);
      throw error;
    }
  }

  async fetchGeneralConfig() {
    try {
      const docSnap = await getDoc(doc(db, "configuracion", "general"));
      if (docSnap.exists()) {
        return docSnap.data();
      }
      return null;
    } catch (error) {
      console.error("Firebase Fetch General Config Error:", error);
      throw error;
    }
  }

  async resetPassword(email) {
    try {
      await sendPasswordResetEmail(auth, email);
      return true;
    } catch (error) {
      console.error("Firebase Password Reset Error:", error);
      throw error;
    }
  }
}

export const firebaseService = new FirebaseService();

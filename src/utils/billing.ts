import { db } from "../firebase";
import { 
  collection, 
  doc, 
  runTransaction, 
  addDoc, 
  getDocs, 
  getDoc,
  updateDoc,
  setDoc,
  query, 
  where, 
  orderBy, 
  serverTimestamp 
} from "firebase/firestore";

// Helper to check if Firebase is online
let firestoreFailed = false;

// Mock database fallbacks using LocalStorage
function getLocalItemJSON<T>(key: string, defaultValue: T): T {
  if (typeof window === "undefined") return defaultValue;
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (e) {
    return defaultValue;
  }
}

function setLocalItemJSON<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {}
}

export interface LedgerTransaction {
  id: string;
  senderId: string;
  senderName: string;
  receiverId: string;
  receiverName: string;
  eventType: "RECHARGE" | "GIFT_SEND" | "CASINO_BET" | "PAYOUT";
  amount: number;
  currency: "coins" | "diamonds";
  giftName?: string;
  timestamp: string | any;
}

export interface GiftConfig {
  id: string;
  name: string;
  nameEn: string;
  coinValue: number;
  category: "Standard" | "Epic" | "Legendary";
  icon: string;
}

export const AVAILABLE_GIFTS: GiftConfig[] = [
  { id: "ole", name: "Olé", nameEn: "Ole", coinValue: 1, category: "Standard", icon: "👏" },
  { id: "mic", name: "Micrófono de Bronce", nameEn: "Bronze Mic", coinValue: 10, category: "Standard", icon: "🎤" },
  { id: "guitarra", name: "Guitarra Eléctrica", nameEn: "Electric Guitar", coinValue: 100, category: "Standard", icon: "🎸" },
  { id: "disco", name: "Disco de Platino", nameEn: "Platinum Record", coinValue: 1000, category: "Epic", icon: "💿" },
  { id: "leon", name: "León de Oro Imperial", nameEn: "Imperial Gold Lion", coinValue: 10000, category: "Legendary", icon: "🦁" }
];

// Broadcast channel to emulate WebSockets for real-time live events in the client
let giftingChannel: BroadcastChannel | null = null;
if (typeof window !== "undefined") {
  giftingChannel = new BroadcastChannel("c8l_live_gifting");
}

/**
 * Executes a simulated HTTP post request to '/api/v1/live/send-gift'
 * Performs an ACID transaction to deduct spectator coins, calculate splitting,
 * credit creator diamonds, write to Ledger, and broadcast WebSocket event.
 */
export async function sendLiveGift(
  senderId: string,
  senderName: string,
  receiverId: string,
  receiverName: string,
  giftId: string
): Promise<{ success: boolean; transactionId: string; newCoins: number }> {
  const gift = AVAILABLE_GIFTS.find(g => g.id === giftId);
  if (!gift) {
    throw new Error("Gift not found");
  }

  // Split calculations (50% creator, 50% agency retention)
  const coinCost = gift.coinValue;
  const creatorDiamonds = Math.floor(coinCost * 0.5);

  const transactionId = "TX_" + Math.random().toString(36).substring(2, 9).toUpperCase();
  const timestamp = new Date().toISOString();

  const newTx: LedgerTransaction = {
    id: transactionId,
    senderId,
    senderName,
    receiverId,
    receiverName,
    eventType: "GIFT_SEND",
    amount: coinCost,
    currency: "coins",
    giftName: gift.name,
    timestamp
  };

  // Log payload in server console simulation
  console.log("📡 [Gifting API Endpoint - POST /api/v1/live/send-gift] Request payload:", {
    senderId,
    receiverId,
    giftId,
    coinCost,
    creatorDiamonds,
    split: "50/50"
  });

  // Execute ACID Transaction in Firestore if available
  if (!firestoreFailed) {
    try {
      await runTransaction(db, async (transaction) => {
        const senderRef = doc(db, "users", senderId);
        const receiverRef = doc(db, "users", receiverId);

        const senderSnap = await transaction.get(senderRef);
        const receiverSnap = await transaction.get(receiverRef);

        if (!senderSnap.exists()) {
          throw new Error("Sender profile does not exist");
        }

        const senderData = senderSnap.data();
        const currentCoins = senderData.c8lCoins ?? 0;

        if (currentCoins < coinCost) {
          // Abort and throw error mapping to 402 Payment Required
          throw new Error("Error 402: Insufficient balance. Payment Required.");
        }

        // Deduct coins from spectator
        const nextCoins = currentCoins - coinCost;
        transaction.update(senderRef, { c8lCoins: nextCoins });

        // Credit diamonds to creator
        let nextDiamonds = 0;
        if (receiverSnap.exists()) {
          const receiverData = receiverSnap.data();
          nextDiamonds = (receiverData.c8lDiamonds ?? 0) + creatorDiamonds;
          transaction.update(receiverRef, { c8lDiamonds: nextDiamonds });
        } else {
          // If receiver document doesn't exist, create it (should normally exist)
          transaction.set(receiverRef, { c8lDiamonds: creatorDiamonds }, { merge: true });
          nextDiamonds = creatorDiamonds;
        }

        // Create transaction in ledger
        const ledgerRef = doc(collection(db, "ledger_transactions"), transactionId);
        transaction.set(ledgerRef, {
          ...newTx,
          timestamp: serverTimestamp()
        });
      });

      // Broadcast simulated WebSocket event to client subscribers
      if (giftingChannel) {
        giftingChannel.postMessage({
          event: "gift_sent",
          giftId,
          giftName: gift.name,
          giftIcon: gift.icon,
          giftCategory: gift.category,
          coinValue: gift.coinValue,
          senderName,
          receiverName,
          timestamp
        });
      }

      // Sync state with LocalStorage for the current session
      const oldCoins = parseInt(localStorage.getItem("c8l_coins") || "0", 10);
      localStorage.setItem("c8l_coins", Math.max(0, oldCoins - coinCost).toString());

      return {
        success: true,
        transactionId,
        newCoins: Math.max(0, oldCoins - coinCost)
      };

    } catch (err: any) {
      console.warn("Firestore transaction failed, falling back to LocalStorage.", err.message);
      if (err.message.includes("Error 402")) {
        throw err; // Forward balance errors directly
      }
      firestoreFailed = true;
    }
  }

  // --- LOCALSTORAGE FALLBACK ACID LOGIC ---
  const oldCoins = parseInt(localStorage.getItem("c8l_coins") || "0", 10);
  if (oldCoins < coinCost) {
    throw new Error("Error 402: Insufficient balance. Payment Required.");
  }

  const nextCoins = oldCoins - coinCost;
  localStorage.setItem("c8l_coins", nextCoins.toString());

  // Update local diamonds if we are the receiver (simulated)
  const oldDiamonds = parseInt(localStorage.getItem("c8l_diamonds") || "0", 10);
  const nextDiamonds = oldDiamonds + creatorDiamonds;
  localStorage.setItem("c8l_diamonds", nextDiamonds.toString());

  // Save transaction to local ledger array
  const ledger = getLocalItemJSON<LedgerTransaction[]>("c8l_mock_ledger", []);
  ledger.unshift(newTx);
  setLocalItemJSON("c8l_mock_ledger", ledger);

  // Sync users list in mock DB
  const mockUsers = getLocalItemJSON<any[]>("c8l_mock_users", []);
  const senderUser = mockUsers.find(u => u.uid === senderId);
  if (senderUser) senderUser.c8lCoins = nextCoins;
  const receiverUser = mockUsers.find(u => u.uid === receiverId);
  if (receiverUser) receiverUser.c8lDiamonds = nextDiamonds;
  setLocalItemJSON("c8l_mock_users", mockUsers);

  // Broadcast WebSockets event
  if (giftingChannel) {
    giftingChannel.postMessage({
      event: "gift_sent",
      giftId,
      giftName: gift.name,
      giftIcon: gift.icon,
      giftCategory: gift.category,
      coinValue: gift.coinValue,
      senderName,
      receiverName,
      timestamp
    });
  }

  return {
    success: true,
    transactionId,
    newCoins: nextCoins
  };
}

/**
 * Recharges coins into the spectator profile (Stripe webhook simulator).
 * Logs transaction with RECHARGE type.
 */
export async function rechargeCoins(
  uid: string,
  userName: string,
  amountSpent: number,
  coinsCredited: number,
  gateway: "PAYONEER" | "PAYPAL" | "VISA_REDSYS" | "SEPA" = "VISA_REDSYS"
): Promise<number> {
  const transactionId = "RC_" + Math.random().toString(36).substring(2, 9).toUpperCase();
  const timestamp = new Date().toISOString();

  let endpoint = "/payments/stripe/visa-mastercard";
  let gatewayName = "Visa Direct / Redsys Card";
  let senderId = "VISA_REDSYS_GATEWAY";

  if (gateway === "PAYONEER") {
    endpoint = "/payments/payoneer/checkout";
    gatewayName = "Payoneer Checkout API";
    senderId = "PAYONEER_B2B";
  } else if (gateway === "PAYPAL") {
    endpoint = "/payments/paypal/express";
    gatewayName = "PayPal REST SDK (v2/checkout/orders)";
    senderId = "PAYPAL_REST_API";
  } else if (gateway === "SEPA") {
    endpoint = "/payments/bank-transfer/sepa";
    gatewayName = "SEPA Instant Direct Transfer";
    senderId = "SEPA_IBAN_WIRE";
  }

  // Log simulation in console mimicking backend webhook routing
  console.log(`📡 [Secure Gateway Route - POST ${endpoint}] Payload received:`, {
    transactionId,
    uid,
    userName,
    amountSpent,
    coinsCredited,
    gatewayName,
    encryption: "SHA-256 / SSL Active",
    timestamp
  });

  const newTx: LedgerTransaction = {
    id: transactionId,
    senderId,
    senderName: gatewayName,
    receiverId: uid,
    receiverName: userName,
    eventType: "RECHARGE",
    amount: coinsCredited,
    currency: "coins",
    giftName: `Recharge €${amountSpent} (${gatewayName})`,
    timestamp
  };

  if (!firestoreFailed) {
    try {
      const userRef = doc(db, "users", uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const nextCoins = (userSnap.data().c8lCoins ?? 0) + coinsCredited;
        await updateDoc(userRef, { c8lCoins: nextCoins });
      }

      await setDoc(doc(collection(db, "ledger_transactions"), transactionId), {
        ...newTx,
        timestamp: serverTimestamp()
      });

      const oldCoins = parseInt(localStorage.getItem("c8l_coins") || "0", 10);
      localStorage.setItem("c8l_coins", (oldCoins + coinsCredited).toString());
      return oldCoins + coinsCredited;

    } catch (e) {
      firestoreFailed = true;
    }
  }

  // Fallback
  const oldCoins = parseInt(localStorage.getItem("c8l_coins") || "0", 10);
  const nextCoins = oldCoins + coinsCredited;
  localStorage.setItem("c8l_coins", nextCoins.toString());

  const ledger = getLocalItemJSON<LedgerTransaction[]>("c8l_mock_ledger", []);
  ledger.unshift(newTx);
  setLocalItemJSON("c8l_mock_ledger", ledger);

  const mockUsers = getLocalItemJSON<any[]>("c8l_mock_users", []);
  const user = mockUsers.find(u => u.uid === uid);
  if (user) user.c8lCoins = nextCoins;
  setLocalItemJSON("c8l_mock_users", mockUsers);

  return nextCoins;
}

/**
 * Deducts diamonds from the creator profile representing a withdrawal (Payout).
 * Logs transaction with PAYOUT type.
 */
export async function requestPayout(
  uid: string,
  userName: string,
  diamondsDebited: number,
  usdValue: number
): Promise<number> {
  // Payout validation threshold: minimum $50 USD (equivalent to 5000 diamonds)
  if (diamondsDebited < 5000) {
    throw new Error("Payout failed: Minimum threshold is 5,000 diamonds ($50.00 USD).");
  }

  const transactionId = "PO_" + Math.random().toString(36).substring(2, 9).toUpperCase();
  const timestamp = new Date().toISOString();

  const newTx: LedgerTransaction = {
    id: transactionId,
    senderId: uid,
    senderName: userName,
    receiverId: "STRIPE_CONNECT",
    receiverName: `Stripe Payout ($${usdValue.toFixed(2)})`,
    eventType: "PAYOUT",
    amount: diamondsDebited,
    currency: "diamonds",
    giftName: "Payout Request",
    timestamp
  };

  if (!firestoreFailed) {
    try {
      const userRef = doc(db, "users", uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const currentD = userSnap.data().c8lDiamonds ?? 0;
        if (currentD < diamondsDebited) {
          throw new Error("Insufficient diamonds for payout");
        }
        await updateDoc(userRef, { c8lDiamonds: currentD - diamondsDebited });
      }

      await setDoc(doc(collection(db, "ledger_transactions"), transactionId), {
        ...newTx,
        timestamp: serverTimestamp()
      });

      const oldDiamonds = parseInt(localStorage.getItem("c8l_diamonds") || "0", 10);
      localStorage.setItem("c8l_diamonds", Math.max(0, oldDiamonds - diamondsDebited).toString());
      return Math.max(0, oldDiamonds - diamondsDebited);

    } catch (e: any) {
      if (e.message.includes("Minimum")) throw e;
      firestoreFailed = true;
    }
  }

  // Fallback
  const oldDiamonds = parseInt(localStorage.getItem("c8l_diamonds") || "0", 10);
  if (oldDiamonds < diamondsDebited) {
    throw new Error("Payout failed: Insufficient diamonds balance.");
  }

  const nextDiamonds = oldDiamonds - diamondsDebited;
  localStorage.setItem("c8l_diamonds", nextDiamonds.toString());

  const ledger = getLocalItemJSON<LedgerTransaction[]>("c8l_mock_ledger", []);
  ledger.unshift(newTx);
  setLocalItemJSON("c8l_mock_ledger", ledger);

  const mockUsers = getLocalItemJSON<any[]>("c8l_mock_users", []);
  const user = mockUsers.find(u => u.uid === uid);
  if (user) user.c8lDiamonds = nextDiamonds;
  setLocalItemJSON("c8l_mock_users", mockUsers);

  return nextDiamonds;
}

/**
 * Fetches all ledger transactions involving the user.
 */
export async function getLedgerTransactions(uid: string): Promise<LedgerTransaction[]> {
  if (!firestoreFailed) {
    try {
      const colRef = collection(db, "ledger_transactions");
      // Read all, filtering client-side for compatibility with indexing
      const snap = await getDocs(colRef);
      const txs: LedgerTransaction[] = [];
      snap.forEach(docSnap => {
        const data = docSnap.data();
        if (data.senderId === uid || data.receiverId === uid) {
          txs.push({
            id: docSnap.id,
            ...data,
            timestamp: data.timestamp?.toDate ? data.timestamp.toDate().toISOString() : data.timestamp
          } as LedgerTransaction);
        }
      });
      return txs.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    } catch (e) {
      firestoreFailed = true;
    }
  }

  // Fallback
  const ledger = getLocalItemJSON<LedgerTransaction[]>("c8l_mock_ledger", []);
  return ledger.filter(t => t.senderId === uid || t.receiverId === uid);
}

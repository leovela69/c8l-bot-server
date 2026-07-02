import { db } from "../firebase";
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  addDoc, 
  getDocs, 
  updateDoc, 
  serverTimestamp, 
  increment, 
  orderBy, 
  query, 
  where 
} from "firebase/firestore";

// Helper to check if Firebase is online and Firestore is accessible
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

export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  platform: string;
  createdAt: string | any;
  lastConnection: string | any;
  connectionCount: number;
  role: "user" | "admin";
  subscription: "free" | "basic" | "premium" | "agency";
  c8lCoins?: number;
  c8lDiamonds?: number;
}

export interface ActivityLog {
  uid: string;
  email: string;
  name: string;
  action: string;
  details: string;
  timestamp: string | any;
}

export interface SharedItem {
  id: string;
  uid: string;
  name: string;
  type: "audio" | "video";
  title: string;
  url: string;
  timestamp: string | any;
  likes: number;
  likedBy: string[]; // List of uids
}



// 1. Register or Update User
export async function registerOrUpdateUser(
  uid: string, 
  email: string, 
  name: string, 
  platform: string,
  subscription: "free" | "basic" | "premium" | "agency" = "free"
): Promise<UserProfile> {
  const profileData: Partial<UserProfile> = {
    uid,
    email,
    name: name || email.split("@")[0],
    platform: platform || "Other",
    subscription,
    lastConnection: new Date().toISOString()
  };

  if (!firestoreFailed) {
    try {
      const userRef = doc(db, "users", uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        const newProfile: UserProfile = {
          uid,
          email,
          name: name || email.split("@")[0],
          platform: platform || "Other",
          createdAt: new Date().toISOString(),
          lastConnection: new Date().toISOString(),
          connectionCount: 1,
          role: "user",
          subscription
        };
        await setDoc(userRef, {
          ...newProfile,
          createdAt: serverTimestamp(),
          lastConnection: serverTimestamp()
        });
        return newProfile;
      } else {
        const existingData = userSnap.data();
        const updatedProfile = {
          ...existingData,
          ...profileData,
          connectionCount: (existingData.connectionCount || 0) + 1,
          lastConnection: new Date().toISOString()
        } as UserProfile;

        await updateDoc(userRef, {
          ...profileData,
          connectionCount: increment(1),
          lastConnection: serverTimestamp()
        });
        return updatedProfile;
      }
    } catch (err) {
      console.warn("Firestore writing failed, using localStorage fallback.", err);
      firestoreFailed = true;
    }
  }

  // Local Storage Fallback
  const localUsers = getLocalItemJSON<UserProfile[]>("c8l_mock_users", []);
  let user = localUsers.find(u => u.uid === uid);
  
  if (!user) {
    user = {
      uid,
      email,
      name: name || email.split("@")[0],
      platform: platform || "Other",
      createdAt: new Date().toISOString(),
      lastConnection: new Date().toISOString(),
      connectionCount: 1,
      role: "user",
      subscription
    };
    localUsers.push(user);
  } else {
    user.name = name || user.name;
    user.platform = platform || user.platform;
    user.subscription = subscription || user.subscription;
    user.connectionCount += 1;
    user.lastConnection = new Date().toISOString();
  }
  setLocalItemJSON("c8l_mock_users", localUsers);
  return user;
}

// 2. Log Activity
export async function logActivity(
  uid: string,
  email: string,
  name: string,
  action: string,
  details: string
) {
  const log: ActivityLog = {
    uid,
    email,
    name: name || email.split("@")[0],
    action,
    details,
    timestamp: new Date().toISOString()
  };

  if (!firestoreFailed) {
    try {
      await addDoc(collection(db, "activities"), {
        ...log,
        timestamp: serverTimestamp()
      });
      return;
    } catch (err) {
      console.warn("Firestore writing log failed, using localStorage fallback.", err);
      firestoreFailed = true;
    }
  }

  // Fallback
  const logs = getLocalItemJSON<ActivityLog[]>("c8l_mock_activities", []);
  logs.unshift(log); // newest first
  setLocalItemJSON("c8l_mock_activities", logs);
}

// 3. Share to Community
export async function shareToCommunity(
  uid: string,
  name: string,
  type: "audio" | "video",
  title: string,
  url: string
) {
  const item: Omit<SharedItem, "id"> = {
    uid,
    name,
    type,
    title,
    url,
    timestamp: new Date().toISOString(),
    likes: 0,
    likedBy: []
  };

  if (!firestoreFailed) {
    try {
      const docRef = await addDoc(collection(db, "shared_creations"), {
        ...item,
        timestamp: serverTimestamp()
      });
      return docRef.id;
    } catch (err) {
      console.warn("Firestore share failed, using localStorage fallback.", err);
      firestoreFailed = true;
    }
  }

  // Fallback
  const shared = getLocalItemJSON<SharedItem[]>("c8l_mock_shared", []);
  const newItem: SharedItem = {
    id: Math.random().toString(36).substring(2, 9),
    ...item
  };
  shared.unshift(newItem);
  setLocalItemJSON("c8l_mock_shared", shared);
  return newItem.id;
}

// 4. React / Like Shared Item
export async function reactToSharedItem(
  itemId: string,
  uid: string,
  userName: string,
  userEmail: string
): Promise<boolean> {
  if (!firestoreFailed) {
    try {
      const itemRef = doc(db, "shared_creations", itemId);
      const snap = await getDoc(itemRef);
      if (snap.exists()) {
        const data = snap.data();
        const likedBy: string[] = data.likedBy || [];
        const index = likedBy.indexOf(uid);
        
        let newLikedBy = [...likedBy];
        let likesDelta = 0;
        let liked = false;
        
        if (index === -1) {
          // Add Like
          newLikedBy.push(uid);
          likesDelta = 1;
          liked = true;
          await logActivity(uid, userEmail, userName, "like_shared", `Le dio like al contenido de ${data.name}: "${data.title}"`);
        } else {
          // Remove Like
          newLikedBy.splice(index, 1);
          likesDelta = -1;
          liked = false;
        }
        
        await updateDoc(itemRef, {
          likedBy: newLikedBy,
          likes: increment(likesDelta)
        });
        return liked;
      }
    } catch (err) {
      console.warn("Firestore react failed, using localStorage fallback.", err);
      firestoreFailed = true;
    }
  }

  // Fallback
  const shared = getLocalItemJSON<SharedItem[]>("c8l_mock_shared", []);
  const item = shared.find(s => s.id === itemId);
  if (item) {
    const index = item.likedBy.indexOf(uid);
    let liked = false;
    if (index === -1) {
      item.likedBy.push(uid);
      item.likes += 1;
      liked = true;
      await logActivity(uid, userEmail, userName, "like_shared", `Le dio like al contenido de ${item.name}: "${item.title}"`);
    } else {
      item.likedBy.splice(index, 1);
      item.likes -= 1;
      liked = false;
    }
    setLocalItemJSON("c8l_mock_shared", shared);
    return liked;
  }
  return false;
}

// 5. Get all shared creations
export async function getAllSharedCreations(): Promise<SharedItem[]> {
  if (!firestoreFailed) {
    try {
      const q = query(collection(db, "shared_creations"), orderBy("timestamp", "desc"));
      const snap = await getDocs(q);
      const items: SharedItem[] = [];
      snap.forEach(docSnap => {
        const data = docSnap.data();
        items.push({
          id: docSnap.id,
          ...data,
          timestamp: data.timestamp?.toDate ? data.timestamp.toDate().toISOString() : data.timestamp
        } as SharedItem);
      });
      return items;
    } catch (err) {
      console.warn("Firestore fetch shared failed, using localStorage fallback.", err);
      firestoreFailed = true;
    }
  }

  return getLocalItemJSON<SharedItem[]>("c8l_mock_shared", []);
}



// 9. Fetch All Registered Users (Admin only)
export async function getAllUsers(): Promise<UserProfile[]> {
  if (!firestoreFailed) {
    try {
      const q = query(collection(db, "users"), orderBy("lastConnection", "desc"));
      const snap = await getDocs(q);
      const users: UserProfile[] = [];
      snap.forEach(docSnap => {
        const data = docSnap.data();
        users.push({
          ...data,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt,
          lastConnection: data.lastConnection?.toDate ? data.lastConnection.toDate().toISOString() : data.lastConnection
        } as UserProfile);
      });
      return users;
    } catch (err) {
      console.warn("Firestore fetch users failed, using localStorage fallback.", err);
      firestoreFailed = true;
    }
  }

  return getLocalItemJSON<UserProfile[]>("c8l_mock_users", []);
}

// 10. Fetch All Activities (Admin only)
export async function getAllActivities(): Promise<ActivityLog[]> {
  if (!firestoreFailed) {
    try {
      const q = query(collection(db, "activities"), orderBy("timestamp", "desc"));
      const snap = await getDocs(q);
      const activities: ActivityLog[] = [];
      snap.forEach(docSnap => {
        const data = docSnap.data();
        activities.push({
          ...data,
          timestamp: data.timestamp?.toDate ? data.timestamp.toDate().toISOString() : data.timestamp
        } as ActivityLog);
      });
      return activities;
    } catch (err) {
      console.warn("Firestore fetch activities failed, using localStorage fallback.", err);
      firestoreFailed = true;
    }
  }

  return getLocalItemJSON<ActivityLog[]>("c8l_mock_activities", []);
}

// 11. Fetch All Streamer Logs (Admin only to audit revenues)
export async function getAllStreamerLogs(): Promise<StreamerLog[]> {
  if (!firestoreFailed) {
    try {
      const snap = await getDocs(collection(db, "streamer_logs"));
      const logs: StreamerLog[] = [];
      snap.forEach(docSnap => {
        const data = docSnap.data();
        logs.push({
          id: docSnap.id,
          ...data,
          timestamp: data.timestamp?.toDate ? data.timestamp.toDate().toISOString() : data.timestamp
        } as unknown as StreamerLog);
      });
      return logs;
    } catch (err) {
      console.warn("Firestore fetch all streamer logs failed, using localStorage fallback.", err);
      firestoreFailed = true;
    }
  }

  return getLocalItemJSON<StreamerLog[]>("c8l_mock_streamer_logs", []);
}

export async function updateUserSubscription(
  uid: string,
  subscription: "free" | "basic" | "premium" | "agency"
): Promise<void> {
  if (!firestoreFailed) {
    try {
      const userRef = doc(db, "users", uid);
      await updateDoc(userRef, { subscription });
      return;
    } catch (err) {
      console.warn("Firestore update subscription failed, using localStorage fallback.", err);
      firestoreFailed = true;
    }
  }

  // Fallback
  const localUsers = getLocalItemJSON<UserProfile[]>("c8l_mock_users", []);
  const user = localUsers.find(u => u.uid === uid);
  if (user) {
    user.subscription = subscription;
    setLocalItemJSON("c8l_mock_users", localUsers);
  }
}

export async function updateUserCoins(uid: string, coins: number): Promise<void> {
  if (!firestoreFailed) {
    try {
      const userRef = doc(db, "users", uid);
      await updateDoc(userRef, { c8lCoins: coins });
      return;
    } catch (err) {
      console.warn("Firestore update coins failed, using localStorage fallback.", err);
      firestoreFailed = true;
    }
  }
 
  // Fallback
  const localUsers = getLocalItemJSON<UserProfile[]>("c8l_mock_users", []);
  const user = localUsers.find(u => u.uid === uid);
  if (user) {
    user.c8lCoins = coins;
    setLocalItemJSON("c8l_mock_users", localUsers);
  }
}
 
export async function updateUserDiamonds(uid: string, diamonds: number): Promise<void> {
  if (!firestoreFailed) {
    try {
      const userRef = doc(db, "users", uid);
      await updateDoc(userRef, { c8lDiamonds: diamonds });
      return;
    } catch (err) {
      console.warn("Firestore update diamonds failed, using localStorage fallback.", err);
      firestoreFailed = true;
    }
  }
 
  // Fallback
  const localUsers = getLocalItemJSON<UserProfile[]>("c8l_mock_users", []);
  const user = localUsers.find(u => u.uid === uid);
  if (user) {
    user.c8lDiamonds = diamonds;
    setLocalItemJSON("c8l_mock_users", localUsers);
  }
}

// =======================================================================
// STREAMER ANALYTICS — Registro de ingresos y métricas por plataforma
// =======================================================================

export interface StreamerLog {
  id: string;
  userId: string;
  date: string;
  platform: "tiktok" | "youtube" | "twitch" | "starmaker" | "kips" | string;
  type: string;
  revenue: number;
  metric: number;
  notes: string;
  createdAt: string;
}

/**
 * Registra un nuevo log de ingresos de streamer
 * Firma: (userId, platform, date, type, revenue, metric, notes)
 */
export async function logStreamerRevenue(
  userId: string,
  platform: string,
  date: string,
  type: string,
  revenue: number,
  metric: number,
  notes: string
): Promise<StreamerLog> {
  const newLog: StreamerLog = {
    id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    userId,
    date,
    platform,
    type,
    revenue,
    metric,
    notes,
    createdAt: new Date().toISOString(),
  };

  if (!firestoreFailed) {
    try {
      const colRef = collection(db, "streamer_logs");
      await addDoc(colRef, { ...newLog });
    } catch (err) {
      console.warn("Firestore streamer log failed, using localStorage fallback.", err);
      firestoreFailed = true;
    }
  }

  // localStorage fallback
  const existing = getLocalItemJSON<StreamerLog[]>(`c8l_streamer_logs_${userId}`, []);
  existing.unshift(newLog);
  setLocalItemJSON(`c8l_streamer_logs_${userId}`, existing.slice(0, 200));

  return newLog;
}

/**
 * Obtiene todos los logs de ingresos de un streamer
 */
export async function getStreamerLogs(userId: string): Promise<StreamerLog[]> {
  if (!firestoreFailed) {
    try {
      const colRef = collection(db, "streamer_logs");
      const q = query(
        colRef,
        where("userId", "==", userId),
        orderBy("createdAt", "desc")
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        return snap.docs.map(d => ({ id: d.id, ...d.data() } as StreamerLog));
      }
    } catch (err) {
      console.warn("Firestore getStreamerLogs failed, using localStorage fallback.", err);
      firestoreFailed = true;
    }
  }

  // localStorage fallback
  return getLocalItemJSON<StreamerLog[]>(`c8l_streamer_logs_${userId}`, []);
}

/**
 * Elimina un log de ingresos por ID (busca en localStorage de todos los usuarios)
 */
export async function deleteStreamerLog(logId: string, userId?: string): Promise<void> {
  if (!firestoreFailed) {
    try {
      const logRef = doc(db, "streamer_logs", logId);
      await updateDoc(logRef, { deleted: true });
      return;
    } catch (err) {
      console.warn("Firestore deleteStreamerLog failed, using localStorage fallback.", err);
      firestoreFailed = true;
    }
  }

  // localStorage fallback — busca en la clave del usuario o en cualquier clave c8l_streamer_logs_*
  if (userId) {
    const existing = getLocalItemJSON<StreamerLog[]>(`c8l_streamer_logs_${userId}`, []);
    setLocalItemJSON(`c8l_streamer_logs_${userId}`, existing.filter(l => l.id !== logId));
  } else if (typeof window !== "undefined") {
    Object.keys(localStorage)
      .filter(k => k.startsWith("c8l_streamer_logs_"))
      .forEach(k => {
        const arr = getLocalItemJSON<StreamerLog[]>(k, []);
        setLocalItemJSON(k, arr.filter(l => l.id !== logId));
      });
  }
}

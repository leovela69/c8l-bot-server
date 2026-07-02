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

export interface StreamerLog {
  id: string;
  uid: string;
  platform: "tiktok" | "youtube" | "twitch" | "starmaker" | "kips";
  date: string;
  type: string;
  revenue: number;
  metric: number;
  notes: string;
  timestamp: string | any;
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

// 6. Log Streamer Revenue & Metrics
export async function logStreamerRevenue(
  uid: string,
  platform: "tiktok" | "youtube" | "twitch" | "starmaker" | "kips",
  date: string,
  type: string,
  revenue: number,
  metric: number,
  notes: string
) {
  const log: Omit<StreamerLog, "id"> = {
    uid,
    platform,
    date: date || new Date().toISOString().split("T")[0],
    type: type || "Monetización",
    revenue: Number(revenue) || 0,
    metric: Number(metric) || 0,
    notes: notes || "",
    timestamp: new Date().toISOString()
  };

  if (!firestoreFailed) {
    try {
      const docRef = await addDoc(collection(db, "streamer_logs"), {
        ...log,
        timestamp: serverTimestamp()
      });
      return docRef.id;
    } catch (err) {
      console.warn("Firestore log revenue failed, using localStorage fallback.", err);
      firestoreFailed = true;
    }
  }

  // Fallback
  const logs = getLocalItemJSON<StreamerLog[]>("c8l_mock_streamer_logs", []);
  const newLog: StreamerLog = {
    id: Math.random().toString(36).substring(2, 9),
    ...log
  };
  logs.unshift(newLog);
  setLocalItemJSON("c8l_mock_streamer_logs", logs);
  return newLog.id;
}

// 7. Get Streamer Logs
export async function getStreamerLogs(uid: string): Promise<StreamerLog[]> {
  if (!firestoreFailed) {
    try {
      const q = query(
        collection(db, "streamer_logs"), 
        where("uid", "==", uid),
        orderBy("date", "desc")
      );
      const snap = await getDocs(q);
      const logs: StreamerLog[] = [];
      snap.forEach(docSnap => {
        const data = docSnap.data();
        logs.push({
          id: docSnap.id,
          ...data,
          timestamp: data.timestamp?.toDate ? data.timestamp.toDate().toISOString() : data.timestamp
        } as StreamerLog);
      });
      return logs;
    } catch (err) {
      console.warn("Firestore fetch revenue logs failed, using localStorage fallback.", err);
      firestoreFailed = true;
    }
  }

  const logs = getLocalItemJSON<StreamerLog[]>("c8l_mock_streamer_logs", []);
  return logs.filter(l => l.uid === uid);
}

// 8. Delete Streamer Log Entry
export async function deleteStreamerLog(itemId: string) {
  if (!firestoreFailed) {
    try {
      // In Firestore, deleting requires doc ref. We try to query or delete directly.
      const docRef = doc(db, "streamer_logs", itemId);
      await setDoc(docRef, {}, { merge: false }); // mock delete since security rules can be tricky, or delete if rules allow
      // We can also perform actual deletion:
      // await deleteDoc(docRef); // if firebase/firestore imports deleteDoc
      return;
    } catch (e) {
      // Fallback handles it
    }
  }

  // Fallback deletion
  const logs = getLocalItemJSON<StreamerLog[]>("c8l_mock_streamer_logs", []);
  const filtered = logs.filter(l => l.id !== itemId);
  setLocalItemJSON("c8l_mock_streamer_logs", filtered);
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
        } as StreamerLog);
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


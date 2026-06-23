import { initializeApp, getApps } from 'firebase/app'
import { getFirestore, collection, addDoc, getDocs, query, orderBy, limit, Timestamp } from 'firebase/firestore'

// Firebase Config — gen-lang-client-0744582882
// NOTA: Estas keys son publicas (Firebase las expone en el frontend)
// La seguridad se maneja con Firestore Rules, no con las keys
const firebaseConfig = {
  apiKey: "AIzaSyDummy-REEMPLAZAR-CON-KEY-REAL",
  authDomain: "gen-lang-client-0744582882.firebaseapp.com",
  projectId: "gen-lang-client-0744582882",
  storageBucket: "gen-lang-client-0744582882.firebasestorage.app",
  messagingSenderId: "744582882",
  appId: "1:744582882:web:placeholder"
}

// Inicializar Firebase (evitar duplicados)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
const db = getFirestore(app)

// ===== TIPOS =====
export interface TVPost {
  id?: string
  title: string
  description: string
  type: 'video' | 'music' | 'live' | 'tutorial' | 'gaming'
  emoji: string
  author: string
  authorBadge?: 'oficial' | 'verificado' | 'usuario'
  videoUrl?: string
  thumbnailUrl?: string
  likes: number
  views: number
  createdAt: Timestamp | Date
}

// ===== FUNCIONES DE TV =====

/** Publicar contenido en C8L TV */
export async function publishToTV(post: Omit<TVPost, 'id' | 'likes' | 'views' | 'createdAt'>): Promise<string> {
  const docRef = await addDoc(collection(db, 'tv_posts'), {
    ...post,
    likes: 0,
    views: 0,
    createdAt: Timestamp.now()
  })
  return docRef.id
}

/** Obtener posts del feed de TV */
export async function getTVFeed(maxPosts: number = 20): Promise<TVPost[]> {
  const q = query(
    collection(db, 'tv_posts'),
    orderBy('createdAt', 'desc'),
    limit(maxPosts)
  )
  const snapshot = await getDocs(q)
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TVPost))
}

export { app, db, collection, addDoc, getDocs, query, orderBy, limit, Timestamp }

"use client";
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { translations, TranslationKey, Language } from "../data/translations";
import { auth } from "../firebase";
import { 
  onAuthStateChanged, 
  signOut, 
  User, 
  signInWithPopup, 
  signInWithRedirect,
  GoogleAuthProvider 
} from "firebase/auth";

import { registerOrUpdateUser, logActivity, updateUserCoins, updateUserDiamonds } from "../utils/analytics";

export interface Toast {
  id: string;
  message: string;
  type: "info" | "success" | "error";
}

interface AppContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey) => string;
  credits: number;
  addCredits: (amount: number) => void;
  deductCredits: (amount: number) => boolean;
  user: User | null;
  loading: boolean;
  toasts: Toast[];
  showNotification: (message: string, type?: "info" | "success" | "error") => void;
  dismissToast: (id: string) => void;
  logout: () => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  loginWithMockUser: () => void;
  subscribeToPlan: (planName: "basic" | "premium" | "agency") => void;
  c8lCoins: number;
  setC8lCoins: React.Dispatch<React.SetStateAction<number>>;
  addCCoins: (amount: number) => void;
  deductCCoins: (amount: number) => boolean;
  c8lDiamonds: number;
  setC8lDiamonds: React.Dispatch<React.SetStateAction<number>>;
  addCDiamonds: (amount: number) => void;
  deductCDiamonds: (amount: number) => boolean;
  deviceFormat: "pc" | "tablet" | "phone" | "unset";
  setDeviceFormat: (format: "pc" | "tablet" | "phone" | "unset") => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("es");
  const [credits, setCredits] = useState<number>(0);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [deviceFormat, setDeviceFormatState] = useState<"pc" | "tablet" | "phone" | "unset">("unset");

  // Load device format from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedFormat = localStorage.getItem("c8l_device_format") as "pc" | "tablet" | "phone" | "unset";
      if (["pc", "tablet", "phone", "unset"].includes(savedFormat)) {
        setDeviceFormatState(savedFormat);
      }
    }
  }, []);

  const setDeviceFormat = useCallback((format: "pc" | "tablet" | "phone" | "unset") => {
    setDeviceFormatState(format);
    if (typeof window !== "undefined") {
      localStorage.setItem("c8l_device_format", format);
    }
  }, []);

  // 0. Auto login / restore mock session on client-side mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const wasLoggedReal = localStorage.getItem("c8l_logged");
      const wasLoggedMock = localStorage.getItem("c8l_logged_mock");
      
      if ((wasLoggedReal !== "true" && wasLoggedMock !== "false") || wasLoggedMock === "true") {
        const mockUser = {
          uid: "leo_vela39_uid",
          email: "leo_vela39@c8l-agency.com",
          displayName: "Leo Vela",
          emailVerified: true,
          isAnonymous: false,
          metadata: {},
          providerData: [],
          refreshToken: "",
          tenantId: null,
          delete: async () => {},
          getIdToken: async () => "mock-token",
          getIdTokenResult: async () => ({ token: "mock-token", claims: {}, authTime: "", expirationTime: "", signInProvider: "", signInSecondFactor: "" }),
          reload: async () => {},
          toJSON: () => ({})
        } as unknown as User;
        
        localStorage.setItem("c8l_logged_mock", "true");
        localStorage.setItem("c8l_logged", "true");
        localStorage.setItem("c8l_subscription", "agency");
        localStorage.setItem("c8l_credits", "9999");
        setCredits(9999);
        setUser(mockUser);
        setLoading(false);
      }
    }
  }, []);

  // 1. Language Loader
  useEffect(() => {
    const savedLang = localStorage.getItem("c8l_lang") as Language;
    if (savedLang === "es" || savedLang === "en") {
      setLanguageState(savedLang);
    }
  }, []);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("c8l_lang", lang);
  }, []);

  // Translation function
  const t = useCallback((key: TranslationKey): string => {
    return translations[language][key] || key;
  }, [language]);

  // 2. Toast management
  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showNotification = useCallback((message: string, type: "info" | "success" | "error" = "info") => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    
    // Auto dismiss after 4 seconds
    setTimeout(() => {
      dismissToast(id);
    }, 4000);
  }, [dismissToast]);

  // 3. Credit System Loader
  useEffect(() => {
    let savedCredits = localStorage.getItem("c8l_credits");
    if (savedCredits === null) {
      localStorage.setItem("c8l_credits", "10");
      setCredits(10);
    } else {
      setCredits(parseInt(savedCredits, 10));
    }
  }, []);

  const addCredits = useCallback((amount: number) => {
    const currentCredits = parseInt(localStorage.getItem("c8l_credits") || "0", 10);
    const newVal = currentCredits + amount;
    localStorage.setItem("c8l_credits", newVal.toString());
    setCredits(newVal);
  }, []);

  const deductCredits = useCallback((amount: number): boolean => {
    const currentCredits = parseInt(localStorage.getItem("c8l_credits") || "0", 10);
    if (currentCredits >= amount) {
      const newVal = currentCredits - amount;
      localStorage.setItem("c8l_credits", newVal.toString());
      setCredits(newVal);
      return true;
    }
    return false;
  }, []);

  const [c8lCoins, setC8lCoins] = useState<number>(0);
  const [c8lDiamonds, setC8lDiamonds] = useState<number>(0);
 
  // C8L Coins & Diamonds Loader
  useEffect(() => {
    let savedCoins = localStorage.getItem("c8l_coins");
    if (savedCoins === null) {
      localStorage.setItem("c8l_coins", "500"); // Start with 500 free C8L Coins
      setC8lCoins(500);
    } else {
      setC8lCoins(parseInt(savedCoins, 10));
    }
 
    let savedDiamonds = localStorage.getItem("c8l_diamonds");
    if (savedDiamonds === null) {
      localStorage.setItem("c8l_diamonds", "0");
      setC8lDiamonds(0);
    } else {
      setC8lDiamonds(parseInt(savedDiamonds, 10));
    }
  }, []);
 
  const addCCoins = useCallback((amount: number) => {
    const currentCoins = parseInt(localStorage.getItem("c8l_coins") || "0", 10);
    const newVal = currentCoins + amount;
    localStorage.setItem("c8l_coins", newVal.toString());
    setC8lCoins(newVal);
    if (user) {
      updateUserCoins(user.uid, newVal).catch(err => console.error("Sync coins failed:", err));
    }
  }, [user]);
 
  const deductCCoins = useCallback((amount: number): boolean => {
    const currentCoins = parseInt(localStorage.getItem("c8l_coins") || "0", 10);
    if (currentCoins >= amount) {
      const newVal = currentCoins - amount;
      localStorage.setItem("c8l_coins", newVal.toString());
      setC8lCoins(newVal);
      if (user) {
        updateUserCoins(user.uid, newVal).catch(err => console.error("Sync coins failed:", err));
      }
      return true;
    }
    return false;
  }, [user]);
 
  const addCDiamonds = useCallback((amount: number) => {
    const currentDiamonds = parseInt(localStorage.getItem("c8l_diamonds") || "0", 10);
    const newVal = currentDiamonds + amount;
    localStorage.setItem("c8l_diamonds", newVal.toString());
    setC8lDiamonds(newVal);
    if (user) {
      updateUserDiamonds(user.uid, newVal).catch(err => console.error("Sync diamonds failed:", err));
    }
  }, [user]);
 
  const deductCDiamonds = useCallback((amount: number): boolean => {
    const currentDiamonds = parseInt(localStorage.getItem("c8l_diamonds") || "0", 10);
    if (currentDiamonds >= amount) {
      const newVal = currentDiamonds - amount;
      localStorage.setItem("c8l_diamonds", newVal.toString());
      setC8lDiamonds(newVal);
      if (user) {
        updateUserDiamonds(user.uid, newVal).catch(err => console.error("Sync diamonds failed:", err));
      }
      return true;
    }
    return false;
  }, [user]);

  // 3.5. Safety timeout fallback for Firebase Auth loading gate
  useEffect(() => {
    const timer = setTimeout(() => {
      if (loading) {
        console.warn("Firebase Auth timed out. Releasing loading gate.");
        setLoading(false);
      }
    }, 2500);
    return () => clearTimeout(timer);
  }, [loading]);

  // 4. Firebase Authentication state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setLoading(false);
        localStorage.setItem("c8l_logged", "true");
        
        // Centralized connection logging with session storage gating
        if (typeof window !== "undefined") {
          const sessionTracked = sessionStorage.getItem("c8l_session_tracked");
          if (!sessionTracked) {
            sessionStorage.setItem("c8l_session_tracked", "true");
            const email = currentUser.email || "";
            const displayName = currentUser.displayName || email.split("@")[0];
            const activeSub = (localStorage.getItem("c8l_subscription") as any) || "free";
            
            const isSignup = sessionStorage.getItem("c8l_is_signup") === "true";
            if (isSignup) {
              sessionStorage.removeItem("c8l_is_signup");
            }
            
            registerOrUpdateUser(currentUser.uid, email, displayName, "Web", activeSub)
              .then((profile) => {
                if (profile) {
                  if (profile.subscription) {
                    localStorage.setItem("c8l_subscription", profile.subscription);
                    if (profile.subscription === "agency") {
                      localStorage.setItem("c8l_credits", "9999");
                      setCredits(9999);
                    } else if (profile.subscription === "premium") {
                      const c = parseInt(localStorage.getItem("c8l_credits") || "0", 10);
                      if (c < 1000) {
                        localStorage.setItem("c8l_credits", "1000");
                        setCredits(1000);
                      }
                    } else if (profile.subscription === "basic") {
                      const c = parseInt(localStorage.getItem("c8l_credits") || "0", 10);
                      if (c < 100) {
                        localStorage.setItem("c8l_credits", "100");
                        setCredits(100);
                      }
                    }
                  }
                  
                  // Load coin & diamond balances from profile if available, otherwise initialize database
                  if (profile.c8lCoins !== undefined) {
                    localStorage.setItem("c8l_coins", profile.c8lCoins.toString());
                    setC8lCoins(profile.c8lCoins);
                  } else {
                    const localC = parseInt(localStorage.getItem("c8l_coins") || "500", 10);
                    updateUserCoins(currentUser.uid, localC).catch(err => console.error("Initial coins sync failed:", err));
                  }
 
                  if (profile.c8lDiamonds !== undefined) {
                    localStorage.setItem("c8l_diamonds", profile.c8lDiamonds.toString());
                    setC8lDiamonds(profile.c8lDiamonds);
                  } else {
                    const localD = parseInt(localStorage.getItem("c8l_diamonds") || "0", 10);
                    updateUserDiamonds(currentUser.uid, localD).catch(err => console.error("Initial diamonds sync failed:", err));
                  }
                }
              })
              .catch(err => console.error("Error in connection logging:", err));

            logActivity(
              currentUser.uid, 
              email, 
              displayName, 
              isSignup ? "signup" : "login", 
              isSignup ? "Registro de cuenta de usuario con éxito." : "Conexión de usuario registrada (nueva sesión)"
            );
          }
        }

        // Dynamic credit loader based on active subscription
        const currentSub = localStorage.getItem("c8l_subscription");
        if (currentSub && currentSub !== "free") {
          if (currentSub === "agency") {
            localStorage.setItem("c8l_credits", "9999");
            setCredits(9999);
          } else if (currentSub === "premium") {
            const currentCredits = parseInt(localStorage.getItem("c8l_credits") || "0", 10);
            if (currentCredits < 1000) {
              localStorage.setItem("c8l_credits", "1000");
              setCredits(1000);
            }
          } else if (currentSub === "basic") {
            const currentCredits = parseInt(localStorage.getItem("c8l_credits") || "0", 10);
            if (currentCredits < 100) {
              localStorage.setItem("c8l_credits", "100");
              setCredits(100);
            }
          }
        }
      } else {
        const wasLoggedMock = localStorage.getItem("c8l_logged_mock");
        if (wasLoggedMock !== "false") {
          const mockUser = {
            uid: "leo_vela39_uid",
            email: "leo_vela39@c8l-agency.com",
            displayName: "Leo Vela",
            emailVerified: true,
            isAnonymous: false,
            metadata: {},
            providerData: [],
            refreshToken: "",
            tenantId: null,
            delete: async () => {},
            getIdToken: async () => "mock-token",
            getIdTokenResult: async () => ({ token: "mock-token", claims: {}, authTime: "", expirationTime: "", signInProvider: "", signInSecondFactor: "" }),
            reload: async () => {},
            toJSON: () => ({})
          } as unknown as User;
          
          localStorage.setItem("c8l_logged_mock", "true");
          localStorage.setItem("c8l_logged", "true");
          localStorage.setItem("c8l_subscription", "agency");
          localStorage.setItem("c8l_credits", "9999");
          setUser(mockUser);
          setLoading(false);
        } else {
          setUser(null);
          setLoading(false);
          localStorage.removeItem("c8l_logged");
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // 5. Auth operations
  const loginWithGoogle = useCallback(async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      showNotification(
        language === "es" ? "Sesión iniciada con Google correctamente." : "Successfully logged in with Google.",
        "success"
      );
    } catch (error: any) {
      console.error(error);
      if (error.code === "auth/popup-blocked" || error.code === "auth/cancelled-popup-request" || error.code === "auth/popup-closed-by-user") {
        showNotification(
          language === "es" 
            ? "Popup bloqueado o cerrado. Intentando método de redirección..." 
            : "Popup blocked or closed. Attempting redirect sign-in method...",
          "info"
        );
        try {
          await signInWithRedirect(auth, provider);
          return;
        } catch (redirectError: any) {
          console.error(redirectError);
        }
      }
      showNotification(
        language === "es" 
          ? "Error al iniciar sesión con Google. Sugerencia: usa 'Acceso Rápido VIP'." 
          : "Error signing in with Google. Tip: use 'Quick VIP Access'.",
        "error"
      );
    }
  }, [language, showNotification]);

  const loginWithMockUser = useCallback(() => {
    const mockUser = {
      uid: "leo_vela39_uid",
      email: "leo_vela39@c8l-agency.com",
      displayName: "Leo Vela",
      emailVerified: true,
      isAnonymous: false,
      metadata: {},
      providerData: [],
      refreshToken: "",
      tenantId: null,
      delete: async () => {},
      getIdToken: async () => "mock-token",
      getIdTokenResult: async () => ({ token: "mock-token", claims: {}, authTime: "", expirationTime: "", signInProvider: "", signInSecondFactor: "" }),
      reload: async () => {},
      toJSON: () => ({})
    } as unknown as User;

    if (typeof window !== "undefined") {
      localStorage.setItem("c8l_logged_mock", "true");
      localStorage.setItem("c8l_logged", "true");
      localStorage.setItem("c8l_subscription", "agency");
      localStorage.setItem("c8l_credits", "9999");
    }
    setCredits(9999);
    setUser(mockUser);
    setLoading(false);

    showNotification(
      language === "es" ? "Sesión iniciada en modo VIP de prueba." : "Logged in as VIP Test Session.",
      "success"
    );
  }, [language, showNotification]);

  const logout = useCallback(async () => {
    try {
      localStorage.setItem("c8l_logged_mock", "false");
      localStorage.setItem("c8l_logged", "false");
      localStorage.setItem("c8l_subscription", "free");
      localStorage.setItem("c8l_credits", "10");
      setCredits(10);
      await signOut(auth);
      setUser(null);
      showNotification(
        language === "es" ? "Sesión cerrada correctamente." : "Logged out successfully.",
        "success"
      );
    } catch (error: any) {
      console.error(error);
      showNotification(
        language === "es" ? "Error al cerrar sesión." : "Error signing out.",
        "error"
      );
    }
  }, [language, showNotification]);

  // 6. Subscriptions
  const subscribeToPlan = useCallback((planName: "basic" | "premium" | "agency") => {
    localStorage.setItem("c8l_subscription", planName);
    localStorage.setItem("c8l_logged", "true");

    let planText = "";
    let creditsToSet = 10;

    if (planName === "basic") {
      planText = language === "es" ? "Básico" : "Basic";
      creditsToSet = 100;
    } else if (planName === "premium") {
      planText = language === "es" ? "Premium" : "Premium";
      creditsToSet = 1000;
    } else if (planName === "agency") {
      planText = language === "es" ? "Agencia" : "Agency";
      creditsToSet = 9999;
    }

    localStorage.setItem("c8l_credits", creditsToSet.toString());
    setCredits(creditsToSet);

    showNotification(
      language === "es"
        ? `¡Gracias! Suscripción al plan ${planText} realizada con éxito.`
        : `Thank you! Subscription to ${planText} plan completed successfully.`,
      "success"
    );
  }, [language, showNotification]);

  return (
    <AppContext.Provider
      value={{
        language,
        setLanguage,
        t,
        credits,
        addCredits,
        deductCredits,
        user,
        loading,
        toasts,
        showNotification,
        dismissToast,
        logout,
        loginWithGoogle,
        loginWithMockUser,
        subscribeToPlan,
        c8lCoins,
        setC8lCoins,
        addCCoins,
        deductCCoins,
        c8lDiamonds,
        setC8lDiamonds,
        addCDiamonds,
        deductCDiamonds,
        deviceFormat,
        setDeviceFormat
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}

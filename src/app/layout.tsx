import type { Metadata, Viewport } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import "./streamer/profile-services/profile-services.css";
import Header from "../components/layout/Header";
import DeviceSimulator from "../components/layout/DeviceSimulator";
import Footer from "../components/layout/Footer";
import AIAgentWidget from "../components/ui/AIAgentWidget";
import PremiumEffects from "../components/ui/PremiumEffects";
import { AppProvider } from "../context/AppContext";
import GlobalToasts from "../components/ui/GlobalToasts";
import FloatingLogoBall from "../components/ui/FloatingLogoBall";
import { AgeGateWrapper } from "../components/security/AgeGateWrapper";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#f59e0b",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: "C.8.L. Agency",
  description: "The Quantum Leap in Content Creation. Corazones Locos Family.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "C8L Agency",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${outfit.variable} antialiased min-h-screen flex flex-col relative`}>
        <AppProvider>
          <AgeGateWrapper>
            <PremiumEffects />
            <DeviceSimulator>
              <Header />
              <main className="flex-grow w-full z-10 relative">
                {children}
              </main>
              <Footer />
            </DeviceSimulator>
            <AIAgentWidget />
            <GlobalToasts />
            <FloatingLogoBall />
          </AgeGateWrapper>
        </AppProvider>
      </body>
    </html>
  );
}


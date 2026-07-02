"use client";
import { FaInstagram, FaTwitter, FaTwitch, FaYoutube } from "react-icons/fa";
import { useApp } from "../../context/AppContext";
import { usePathname } from "next/navigation";

export default function Footer() {
  const { t } = useApp();
  const pathname = usePathname();

  if (pathname === "/streamer/profile-services" || pathname === "/studio") {
    return null;
  }

  return (
    <footer className="border-t border-[var(--color-panel-border)] bg-black/60 backdrop-blur-md pt-16 pb-8 mt-20">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          <div className="col-span-1 md:col-span-2">
            <h3 className="font-heading font-bold text-2xl text-[var(--color-gold)] mb-4">C.8.L. AGENCY</h3>
            <p className="text-zinc-400 max-w-md">
              {t("footer-tagline")}
            </p>
          </div>
          <div>
            <h4 className="font-bold text-white mb-4 uppercase tracking-widest text-sm">{t("footer-nav-title")}</h4>
            <ul className="space-y-2 text-zinc-400">
              <li><a href="#mission" className="hover:text-[var(--color-neon-blue)] transition">{t("footer-nav-mission")}</a></li>
              <li><a href="#intelligence" className="hover:text-[var(--color-neon-blue)] transition">{t("footer-nav-bi")}</a></li>
              <li><a href="#dashboard" className="hover:text-[var(--color-neon-blue)] transition">{t("footer-nav-dash")}</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-white mb-4 uppercase tracking-widest text-sm">{t("footer-connect-title")}</h4>
            <div className="flex gap-4">
              <a href="#" className="text-zinc-400 hover:text-[var(--color-gold)] transition text-xl"><FaTwitch /></a>
              <a href="#" className="text-zinc-400 hover:text-[var(--color-gold)] transition text-xl"><FaYoutube /></a>
              <a href="#" className="text-zinc-400 hover:text-[var(--color-gold)] transition text-xl"><FaTwitter /></a>
              <a href="#" className="text-zinc-400 hover:text-[var(--color-gold)] transition text-xl"><FaInstagram /></a>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center text-xs text-zinc-500">
          <p>&copy; {new Date().getFullYear()} C.8.L. Agency (Corazones Locos Family). {t("footer-rights")}</p>
          <div className="mt-4 md:mt-0 space-x-4">
            <a href="#" className="hover:text-white transition">{t("footer-privacy")}</a>
            <a href="#" className="hover:text-white transition">{t("footer-terms")}</a>
            <a href="#" className="hover:text-white transition">{t("footer-cookies")}</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

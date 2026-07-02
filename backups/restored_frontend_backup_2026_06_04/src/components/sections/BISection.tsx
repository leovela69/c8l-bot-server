"use client";
import { motion } from "framer-motion";
import { useApp } from "../../context/AppContext";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export default function BISection() {
  const { t, language } = useApp();

  const lineData = {
    labels: ['Q1', 'Q2', 'Q3', 'Q4'],
    datasets: [
      {
        label: t("bi-chart-growth-axis"),
        data: [1.2, 2.5, 4.8, 8.4],
        borderColor: '#D4AF37',
        backgroundColor: 'rgba(212, 175, 55, 0.2)',
        tension: 0.4,
      },
    ],
  };

  const barData = {
    labels: [
      language === 'es' ? 'Competidor A' : 'Competitor A',
      language === 'es' ? 'Competidor B' : 'Competitor B',
      'C.8.L. Agency'
    ],
    datasets: [
      {
        label: t("bi-chart-pos-axis"),
        data: [45, 60, 95],
        backgroundColor: ['#334155', '#475569', '#00F3FF'],
        borderWidth: 0,
        borderRadius: 4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { labels: { color: '#ededed' } },
    },
    scales: {
      x: { grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#a1a1aa' } },
      y: { grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#a1a1aa' } },
    },
  };

  const sponsors = [
    { name: "Brand 1", logo: "B1" },
    { name: "Brand 2", logo: "B2" },
    { name: "Brand 3", logo: "B3" },
    { name: "Brand 4", logo: "B4" },
  ];

  return (
    <section id="intelligence" className="py-24 relative bg-black text-white">
      <div className="container mx-auto px-6 max-w-6xl">
        <div className="mb-20">
          <h2 className="text-3xl md:text-4xl font-heading font-black uppercase mb-4">
            <span className="text-[var(--color-neon-blue)]">{t("bi-title-1")}</span> {t("bi-title-2")}
          </h2>
          <p className="text-zinc-400 max-w-2xl">
            {t("bi-desc")}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-24">
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="glass-panel p-6 rounded-2xl"
          >
            <h3 className="text-lg font-bold uppercase text-[var(--color-gold)] mb-6">{t("bi-chart-growth")}</h3>
            <Line data={lineData} options={chartOptions} />
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="glass-panel p-6 rounded-2xl"
          >
            <h3 className="text-lg font-bold uppercase text-[var(--color-neon-blue)] mb-6">{t("bi-chart-pos")}</h3>
            <Bar data={barData} options={chartOptions} />
          </motion.div>
        </div>

        {/* Sponsors */}
        <div>
          <h3 className="text-center font-heading font-bold text-xl uppercase tracking-widest text-[var(--color-gold)] mb-10">
            {t("bi-sponsors")}
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {sponsors.map((brand, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="h-24 glass-panel border border-[var(--color-gold)]/20 rounded-xl flex items-center justify-center grayscale hover:grayscale-0 hover:border-[var(--color-gold)] transition-all cursor-pointer box-glow-gold hover:scale-105"
              >
                <span className="font-heading font-black text-2xl tracking-tighter opacity-50">{brand.logo}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

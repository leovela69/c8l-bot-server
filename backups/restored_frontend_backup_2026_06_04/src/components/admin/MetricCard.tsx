// components/admin/MetricCard.tsx
import { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  trend?: { value: number; isPositive: boolean };
  color?: string;
}

export function MetricCard({ title, value, icon, trend, color = '#D4AF37' }: MetricCardProps) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      className="bg-gray-900 border border-gray-800 rounded-lg p-4"
    >
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-2xl font-black text-white mt-1">{value}</p>
          {trend && (
            <p className={`text-xs mt-1 ${trend.isPositive ? 'text-green-500' : 'text-red-500'}`}>
              {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}% desde ayer
            </p>
          )}
        </div>
        <div className="p-2 rounded-lg" style={{ backgroundColor: `${color}20` }}>
          {icon}
        </div>
      </div>
    </motion.div>
  );
}
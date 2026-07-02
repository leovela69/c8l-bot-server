// components/insights/MarketInsights.tsx
import { useEffect, useState } from 'react';
import { Newspaper, TrendingUp, TrendingDown, Minus, AlertCircle } from 'lucide-react';

interface EconomicNews {
  id: string;
  title: string;
  sentiment_score: number;
  source: string;
  impact_level: 'high' | 'medium' | 'low';
}

interface AIPrediction {
  id: string;
  predicted_value: number;
  confidence: number;
  target_date: string;
}

export function MarketInsights() {
    const [news, setNews] = useState<EconomicNews[]>([]);
    const [predictions, setPredictions] = useState<AIPrediction[]>([]);

    useEffect(() => {
        fetchEconomicNews();
        fetchPredictions();
    }, []);

    const fetchEconomicNews = async () => {
        const res = await fetch('/api/economic-news');
        const data = await res.json();
        setNews(data);
    };

    const fetchPredictions = async () => {
        const res = await fetch('/api/predictions');
        const data = await res.json();
        setPredictions(data);
    };

    const SentimentIcon = ({ score }: { score: number }) => {
        if (score > 0.2) return <TrendingUp size={16} className="text-green-500" />;
        if (score < -0.2) return <TrendingDown size={16} className="text-red-500" />;
        return <Minus size={16} className="text-yellow-500" />;
    };

    return (
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 w-full max-w-sm shadow-xl">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-bold text-lg flex items-center gap-2">
                    <Newspaper size={18} /> Market Insights
                </h3>
                <span className="text-xs text-gray-500">Actualizado hace 5 min</span>
            </div>

            {/* Sección de Noticias */}
            <div className="mb-4">
                <h4 className="text-[#D4AF37] font-semibold text-sm mb-2">📰 Noticias Relevantes</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                    {news.map((item) => (
                        <div key={item.id} className="text-xs p-2 bg-black/30 rounded-lg border-l-2 border-[#D4AF37]">
                            <div className="flex justify-between items-start gap-2">
                                <span className="text-gray-300 font-medium line-clamp-2">{item.title}</span>
                                <SentimentIcon score={item.sentiment_score} />
                            </div>
                            <div className="flex justify-between mt-1">
                                <span className="text-gray-500 text-[10px]">{item.source}</span>
                                <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                                    item.impact_level === 'high' ? 'bg-red-900/50 text-red-300' :
                                    item.impact_level === 'medium' ? 'bg-yellow-900/50 text-yellow-300' :
                                    'bg-blue-900/50 text-blue-300'
                                }`}>{item.impact_level}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Sección de Predicciones */}
            <div>
                <h4 className="text-[#00F3FF] font-semibold text-sm mb-2 flex items-center gap-2">
                    <AlertCircle size={14} /> Predicciones IA
                </h4>
                <div className="space-y-2">
                    {predictions.map((pred) => (
                        <div key={pred.id} className="bg-gradient-to-r from-black/50 to-transparent p-2 rounded-lg">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-300">Demanda de BID</span>
                                <span className={`font-mono font-bold ${
                                    pred.predicted_value > 1.05 ? 'text-green-400' :
                                    pred.predicted_value < 0.95 ? 'text-red-400' : 'text-yellow-400'
                                }`}>
                                    {pred.predicted_value > 1 ? '+' : ''}{((pred.predicted_value - 1) * 100).toFixed(1)}%
                                </span>
                            </div>
                            <div className="w-full bg-gray-700 rounded-full h-1.5 mt-1">
                                <div className="bg-[#D4AF37] h-1.5 rounded-full" style={{ width: `${pred.confidence * 100}%` }} />
                            </div>
                            <div className="flex justify-between text-[10px] text-gray-500 mt-1">
                                <span>Confianza: {(pred.confidence * 100).toFixed(0)}%</span>
                                <span>Válido hasta: {new Date(pred.target_date).toLocaleDateString()}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
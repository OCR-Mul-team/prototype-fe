import React from 'react';
import { PredictionResult } from '../types';
import { TrendingUp, TrendingDown, Minus, Car, Info } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface ResultViewProps {
  prediction: PredictionResult;
  onRestart: () => void;
}

const ResultView: React.FC<ResultViewProps> = ({ prediction, onRestart }) => {
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' }).format(val);
  };

  const chartData = [
    { name: '최소', price: prediction.minPrice },
    { name: '예상', price: (prediction.minPrice + prediction.maxPrice) / 2 },
    { name: '최대', price: prediction.maxPrice },
  ];

  const getTrendIcon = () => {
    switch (prediction.marketTrend) {
      case 'rising': return <TrendingUp className="w-6 h-6 text-red-500" />;
      case 'falling': return <TrendingDown className="w-6 h-6 text-blue-500" />;
      default: return <Minus className="w-6 h-6 text-gray-500" />;
    }
  };

  const getTrendText = () => {
    switch (prediction.marketTrend) {
      case 'rising': return '시세 상승세';
      case 'falling': return '시세 하락세';
      default: return '보합세';
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in zoom-in duration-500">
      
      {/* Header Result */}
      <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-8 text-white text-center">
          <h2 className="text-2xl font-light opacity-90 mb-2">AI 예상 판매가</h2>
          <div className="text-4xl md:text-5xl font-bold tracking-tight">
            {formatCurrency(prediction.minPrice)} ~ {formatCurrency(prediction.maxPrice)}
          </div>
        </div>
        
        <div className="p-8">
           <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                 <div className="p-3 bg-gray-50 rounded-full">
                    <Car className="w-6 h-6 text-gray-700" />
                 </div>
                 <div>
                    <h3 className="font-semibold text-gray-900">차량 가치 분석</h3>
                    <p className="text-sm text-gray-500">현재 시장 데이터 기반</p>
                 </div>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-full border border-gray-100">
                 {getTrendIcon()}
                 <span className="text-sm font-medium text-gray-700">{getTrendText()}</span>
              </div>
           </div>

           <div className="h-64 w-full mb-6">
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                 <XAxis dataKey="name" tick={{fill: '#6b7280'}} axisLine={false} tickLine={false} />
                 <YAxis hide />
                 <Tooltip 
                    cursor={{fill: 'transparent'}}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    formatter={(value: number) => [formatCurrency(value), '가격']}
                 />
                 <Bar dataKey="price" radius={[8, 8, 0, 0]} barSize={60}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 1 ? '#4f46e5' : '#cbd5e1'} />
                    ))}
                 </Bar>
               </BarChart>
             </ResponsiveContainer>
           </div>

           <div className="bg-gray-50 rounded-xl p-6">
              <h4 className="flex items-center gap-2 font-semibold text-gray-800 mb-3">
                 <Info className="w-4 h-4 text-blue-500" /> AI 분석 리포트
              </h4>
              <p className="text-gray-600 leading-relaxed text-sm">
                 {prediction.reasoning}
              </p>
           </div>
        </div>
      </div>

      <div className="text-center">
        <button 
          onClick={onRestart}
          className="text-gray-500 hover:text-gray-900 font-medium transition-colors"
        >
          처음부터 다시하기
        </button>
      </div>
    </div>
  );
};

export default ResultView;

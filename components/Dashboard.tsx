import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { LatinWord } from '../types';

interface DashboardProps {
  words: LatinWord[];
}

const COLORS = ['#e5e7eb', '#fde047', '#93c5fd', '#86efac']; // Gray, Yellow, Blue, Green
const NAMES = ['Nieuw', 'Leren', 'Review', 'Meester'];

const Dashboard: React.FC<DashboardProps> = ({ words }) => {
  const stats = [0, 0, 0, 0];
  words.forEach(w => {
    stats[w.srs.level]++;
  });

  const pieData = stats.map((val, idx) => ({ name: NAMES[idx], value: val }));

  return (
    <div className="space-y-6 pb-20">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-roman-100">
        <h2 className="text-xl font-serif text-roman-800 mb-4">Jouw Voortgang</h2>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex justify-center gap-4 text-xs text-roman-600 mt-2">
            {pieData.map((entry, index) => (
                <div key={index} className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index]}}></div>
                    <span>{entry.name}: {entry.value}</span>
                </div>
            ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
          <div className="bg-roman-50 p-4 rounded-xl border border-roman-200 text-center">
              <div className="text-3xl font-serif text-roman-800 font-bold">{words.length}</div>
              <div className="text-xs text-roman-500 uppercase tracking-wider">Totaal Woorden</div>
          </div>
          <div className="bg-green-50 p-4 rounded-xl border border-green-200 text-center">
              <div className="text-3xl font-serif text-green-700 font-bold">{stats[3]}</div>
              <div className="text-xs text-green-600 uppercase tracking-wider">Meester</div>
          </div>
      </div>
    </div>
  );
};

export default Dashboard;
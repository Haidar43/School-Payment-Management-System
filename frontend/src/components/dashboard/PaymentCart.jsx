import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts';

const PaymentChart = ({ paid, partial, unpaid, total }) => {
  const data = [
    { name: 'Paid', value: paid, color: '#15803D' },
    { name: 'Partial', value: partial, color: '#B45309' },
    { name: 'Unpaid', value: unpaid, color: '#B42318' },
  ];

  const totalStudents = paid + partial + unpaid;

  if (totalStudents === 0) {
    return (
      <div className="text-center py-8 text-text-secondary">
        <p>No student data available</p>
      </div>
    );
  }

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={2}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value) => [`${value} students`, '']}
            contentStyle={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #E4E7EC',
              borderRadius: '8px',
              padding: '8px 12px',
            }}
          />
          <Legend
            verticalAlign="bottom"
            height={36}
            formatter={(value) => <span className="text-sm text-text-secondary">{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PaymentChart;
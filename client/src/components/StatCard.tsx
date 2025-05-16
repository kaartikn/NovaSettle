import { ReactNode } from 'react';

interface StatCardProps {
  title: string;
  value: string;
  change?: {
    value: string;
    isPositive: boolean;
  };
  icon: ReactNode;
  iconColor: string;
}

export default function StatCard({ title, value, change, icon, iconColor }: StatCardProps) {
  const bgColorClass = `bg-${iconColor}-500 bg-opacity-10`;
  
  return (
    <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-gray-500 text-sm">{title}</h3>
          <p className="text-2xl font-bold mt-1">{value}</p>
          {change && (
            <p className={`text-sm ${change.isPositive ? 'text-green-500' : 'text-red-500'} mt-1`}>
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="inline">
                {change.isPositive ? (
                  <polyline points="18 15 12 9 6 15" />
                ) : (
                  <polyline points="6 9 12 15 18 9" />
                )}
              </svg>
              <span>{change.value}</span>
            </p>
          )}
        </div>
        <div className={`${bgColorClass} p-2 rounded-lg`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

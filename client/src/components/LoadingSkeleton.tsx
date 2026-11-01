import React from 'react';

export const LoadingSkeleton: React.FC = () => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm animate-pulse">
          <div className="h-48 bg-slate-200 w-full" />
          <div className="p-5 space-y-3">
            <div className="h-4 bg-slate-200 rounded w-1/3" />
            <div className="h-6 bg-slate-200 rounded w-3/4" />
            <div className="h-4 bg-slate-200 rounded w-full" />
            <div className="h-4 bg-slate-200 rounded w-5/6" />
            <div className="pt-4 flex justify-between items-center border-t border-slate-100">
              <div className="h-8 bg-slate-200 rounded w-24" />
              <div className="h-8 bg-slate-200 rounded w-28" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

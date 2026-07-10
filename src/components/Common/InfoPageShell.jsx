import React from 'react';

const InfoPageShell = ({ title, subtitle, children, wide = false }) => (
  <div className={`mx-auto ${wide ? 'max-w-4xl' : 'max-w-3xl'}`}>
    <header className="mb-8 text-center">
      <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 m-0">{title}</h1>
      {subtitle && (
        <p className="mt-3 text-sm sm:text-base text-slate-600 m-0 max-w-2xl mx-auto">
          {subtitle}
        </p>
      )}
    </header>
    <div className="rounded-xl bg-white border border-slate-200 p-5 sm:p-8 shadow-sm">
      {children}
    </div>
  </div>
);

export default InfoPageShell;

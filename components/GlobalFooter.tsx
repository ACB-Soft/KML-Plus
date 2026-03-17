import React from 'react';
import { FULL_BRAND } from '../version';

interface Props {
  noPadding?: boolean;
}

const GlobalFooter: React.FC<Props> = ({ noPadding = false }) => (
  <footer className={`pt-4 pb-6 md:pt-6 md:pb-8 flex flex-col items-center mt-auto shrink-0 bg-transparent relative z-[100] ${noPadding ? '' : 'px-8'}`}>
    <p className="text-[10px] md:text-[11px] font-black text-slate-400 uppercase tracking-[0.5em] text-center w-full">
      {FULL_BRAND}
    </p>
  </footer>
);

export default GlobalFooter;

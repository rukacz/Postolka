import React from "react";

/**
 * DangerousGoodsFlag
 * Stylized red/white diamond resembling official DG warning labels.
 * Usage: <DangerousGoodsFlag />
 */
export default function DangerousGoodsFlag() {
  return (
    <div
      className="w-8 h-8 relative rotate-45 overflow-hidden"
      title="Dangerous Goods"
    >
      {/* Red bottom triangle */}
      <div 
        className="absolute inset-0 bg-red-600 z-0"
        style={{ clipPath: 'polygon(0 100%, 50% 50%, 100% 100%, 0% 100%)' }}
      ></div>
      {/* White top triangle */}
      <div 
        className="absolute inset-0 bg-white z-10"
        style={{ clipPath: 'polygon(0 0, 100% 0, 50% 50%, 0 0)' }}
      ></div>
      {/* SVG Flame icon centered */}
      <div className="absolute inset-0 flex items-center justify-center z-20">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="black"
          className="-rotate-45 w-4 h-4"
        >
          <path d="M12 2C11.5 3.5 10 4 10 6c0 1 .5 2 1 2s1-1 2-1 1.5 1 1.5 2.5c0 .9-.3 1.6-.8 2.1C14 12.2 15 13 15 14.5c0 1.4-1 2.5-3 2.5s-3-1.1-3-2.5c0-.6.2-1.2.6-1.6C9 12.6 8 11.4 8 10c0-2 1.5-3 2-4 .2-.5 0-1.5 0-1.5S12 2 12 2z" />
        </svg>
      </div>
    </div>
  );
}
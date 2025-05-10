import React from 'react';
import Logo from "../img/logo.png";

const Header = () => {
  return (
    <header className="px-4 py-3 bg-gray">
      <div className="flex flex-col items-start">
        {/* Логотип и GalfDesign */}
        <div className="flex items-center gap-3 mb-2">
          <img src={Logo} alt="Logo" className="w-12 h-13" />
          <span className="text-3xl font-semibold text-gray-500">GalfDesign</span>
        </div>

        {/* Горизонтальные линии и блок с текстом */}
        <div className="relative w-full">
          <div className="h-[2px] bg-gray-400 w-full mb-1" />

          <div className="flex items-center text-sm text-gray-500 space-x-4 pl-1 py-2 ">
            <span className="lowercase">напольное<br />отопление</span>

            <div className="h-8 w-[2px] bg-gray-400" />
            <span className="text-center">радиаторное<br />отопление</span>

            <div className="h-8 w-[2px] bg-gray-400" />
            <span className="text-center">водоснабжение</span>

            <div className="h-8 w-[2px] bg-gray-400" />
            <span className="text-center">котельная</span>
          </div>

          <div className="h-[1px] bg-gray-400 w-full mt-1" />
        </div>
      </div>
    </header>
  );
};

export default Header;

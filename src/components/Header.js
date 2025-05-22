import React, { useState } from 'react';
import Logo from '../img/logo.png';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { toggleAuthModal, setAuthMode, logout } from '../store/slices/authSlice';

const Header = () => {
  const { user } = useSelector(state => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const navItems = [
    { label: 'Напольное отопление', path: '/' },
    { label: 'Радиаторное отопление', path: '/radiator' },
    { label: 'Водоснабжение', path: '/watersupplies' },
    { label: 'Котельная', path: '/boiler' },
  ];
  const [activeIndex, setActiveIndex] = useState(0);

  const handlePrev = () => {
    setActiveIndex((prev) => (prev - 1 + navItems.length) % navItems.length);
  };
  const handleNext = () => {
    setActiveIndex((prev) => (prev + 1) % navItems.length);
  };

  return (
    <header className="px-4 py-3 bg-gray w-full flex justify-center">
      <div className="flex flex-col w-full max-w-[1200px] px-4">

        {/* Верхняя часть: логотип + кнопки */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between items-center gap-4 mb-3">
          <img src={Logo} alt="Logo" className="w-15 h-12" />

          <div className="flex flex-wrap gap-2 items-center justify-center">
            {user ? (
              <>
                <span className="text-sm text-gray-700 leading-none pt-[2px]">
                  {user.user_metadata?.username || user.email}
                </span>
                <button
                  onClick={() => navigate('/projects')}
                  className="text-sm px-3 py-1 rounded border border-gray-500 text-gray-600 hover:bg-gray-200 transition"
                >
                  Проекты
                </button>
                <button
                  onClick={() => dispatch(logout())}
                  className="text-sm px-3 py-1 rounded border border-gray-500 text-gray-600 hover:bg-gray-200 transition"
                >
                  Выйти
                </button>
              </>
            ) : (
              <>
                <button
                  className="text-sm px-4 py-1 rounded border border-gray-500 text-gray-600 hover:bg-gray-200 transition"
                  onClick={() => {
                    dispatch(setAuthMode('register'));
                    dispatch(toggleAuthModal(true));
                  }}
                >
                  Регистрация
                </button>
                <button
                  className="text-sm px-4 py-1 rounded border border-gray-500 text-gray-600 hover:bg-gray-200 transition"
                  onClick={() => {
                    dispatch(setAuthMode('login'));
                    dispatch(toggleAuthModal(true));
                  }}
                >
                  Войти
                </button>
              </>
            )}
          </div>
        </div>

        {/* DESKTOP nav */}
        <div className="relative w-full hidden sm:flex flex-col">
          <hr className="h-[1.5px] w-full bg-gray-400" />

          <div className="flex items-center text-sm text-gray-500 space-x-4 pl-2 py-2">
            <span className="cursor-pointer" onClick={() => navigate("/")}>Напольное отопление</span>
            <div className="w-px h-9 bg-gray-400" />
            <span>Радиаторное отопление</span>
            <div className="w-px h-9 bg-gray-400" />
            <span className='cursor-pointer' onClick={() => navigate("/watersupplies")}>Водоснабжение</span>
            <div className="w-px h-9 bg-gray-400" />
            <span>Котельная</span>
          </div>

          <hr className="h-[1.5px] w-full bg-gray-400" />
        </div>

        <div className="sm:hidden w-full">
          <hr className="h-[1.5px] w-full bg-gray-400" />

          <div className="flex items-center justify-center py-3 gap-4">

            <button onClick={handlePrev} className="w-6 h-6">
              <div className="w-full h-full border-t-2 border-r-2 border-gray-500 transform rotate-[-135deg] scale-75" />
            </button>

            <span
              onClick={() => navigate(navItems[activeIndex].path)}
              className="text-sm text-gray-700 font-medium cursor-pointer text-center"
            >
              {navItems[activeIndex].label}
            </span>

            <button onClick={handleNext} className="w-6 h-6">
              <div className="w-full h-full border-t-2 border-r-2 border-gray-500 transform rotate-[45deg] scale-75" />
            </button>
          </div>

          <hr className="h-[1.5px] w-full bg-gray-400" />
        </div>

      </div>
    </header>
  );
};

export default Header;

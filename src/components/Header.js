import React from 'react';
import Logo from "../img/logo.png";

import { useDispatch, useSelector } from 'react-redux';
import { toggleAuthModal, setAuthMode, logout } from '../store/slices/authSlice';


const Header = () => {
  const { user } = useSelector(state => state.auth);
  const dispatch = useDispatch();
  return (
    <header className="px-4 py-3 bg-gray">
      <div className="flex flex-col items-start w-full">

        <div className="flex items-center justify-between w-full mb-2">
          <div className="flex items-center gap-3">
            <img src={Logo} alt="Logo" className="w-15 h-12" />
          </div>

          <div className="flex gap-2">
            {user ? (
              <>
                <span className="text-sm text-gray-700">
                  {user.user_metadata?.username || user.email}
                </span>
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

        <div className="relative w-full">
          <div className="h-[1.5px] bg-gray-400 w-full mb-1" />

          <div className="flex items-center text-sm text-gray-500 space-x-4 pl-[40px] py-2">
            <span className="lowercase">напольное<br />отопление</span>

            <div className="h-8 w-[2px] bg-gray-400" />
            <span className="text-center">радиаторное<br />отопление</span>

            <div className="h-8 w-[2px] bg-gray-400" />
            <span className="text-center">водоснабжение</span>

            <div className="h-8 w-[2px] bg-gray-400" />
            <span className="text-center">котельная</span>
          </div>

          <div className="h-[1.5px] bg-gray-400 w-full mt-1" />
        </div>
      </div>
    </header>
  );
};

export default Header;

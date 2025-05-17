import React from 'react';
import Logo from "../img/logo.png";
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { toggleAuthModal, setAuthMode, logout } from '../store/slices/authSlice';

const Header = () => {
  const { user } = useSelector(state => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  return (
    <header className="px-4 py-3 bg-gray w-full flex justify-center">
        <div className="flex flex-col items-start w-full max-w-[1200px] px-4">

        <div className="flex items-center justify-between w-full mb-2">
          <div className="flex items-center gap-3">
            <img src={Logo} alt="Logo" className="w-15 h-12" />
          </div>
          <div className="flex gap-2 items-center">
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

        <div className="relative w-full">
          <hr className="h-[1.5px] w-full bg-gray-400" />

          <div className="flex items-center text-sm text-gray-500 space-x-4 pl-5 py-2">
            <span className="cursor-pointer" onClick={() => navigate("/")}>Напольное отопление</span>

            <div className="w-px h-9 bg-gray-400" />
            <span className="text-center">Радиаторное отопление</span>

            <div className="w-px h-9 bg-gray-400" />
            <span className="text-center">Водоснабжение</span>

            <div className="w-px h-9 bg-gray-400" />
            <span className="text-center">Котельная</span>
          </div>

          <hr className="h-[1.5px] w-full bg-gray-400" />
        </div>

      </div>
    </header>
  );
};

export default Header;

import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toggleAuthModal, setAwaitingConfirmation } from '../store/slices/authSlice';
import { supabase } from '../supabase';

const AuthModal = () => {
  const dispatch = useDispatch();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const { isAuthModalOpen, mode } = useSelector((state) => state.auth);

  if (!isAuthModalOpen) return null;

  const handleClose = () => dispatch(toggleAuthModal(false));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    try {
      if (mode === 'register') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { username },
          },
        });

        if (error) throw error;

        dispatch(setAwaitingConfirmation(true));
        dispatch(toggleAuthModal(false));
        alert('Письмо с подтверждением отправлено!');
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });

        if (error) throw error;

        // Не делай setUser здесь — юзер придёт через onAuthStateChange
        dispatch(toggleAuthModal(false));
      }
    } catch (err) {
      setErrorMsg(err.message || 'Произошла ошибка. Попробуйте снова.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 px-4">
      <div className="bg-white border border-black rounded-xl w-full max-w-sm p-6">
        <h2 className="text-xl font-semibold mb-4 text-center">
          {mode === 'login' ? 'Вход' : 'Регистрация'}
        </h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="email"
            placeholder="Email"
            className="border px-3 py-2 rounded text-sm"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Пароль"
            className="border px-3 py-2 rounded text-sm"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {mode === 'register' && (
            <input
              type="text"
              placeholder="Имя пользователя"
              className="border px-3 py-2 rounded text-sm"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          )}
          {errorMsg && <p className="text-red-500 text-sm">{errorMsg}</p>}
          <button
            type="submit"
            className="bg-gray-800 text-white rounded py-2 hover:bg-gray-700 transition"
          >
            {mode === 'login' ? 'Войти' : 'Зарегистрироваться'}
          </button>
        </form>
        <button
          onClick={handleClose}
          className="mt-4 text-sm text-gray-500 underline w-full text-center"
        >
          Закрыть
        </button>
      </div>
    </div>
  );
};

export default AuthModal;

import React from 'react';
import { useSelector } from 'react-redux';

const AwaitingConfirmationModal = () => {
  const isOpen = useSelector(state => state.auth.isAwaitingConfirmation);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 px-4">
      <div className="bg-white border border-black rounded-xl w-full max-w-sm p-6 text-center">
        <h2 className="text-xl font-semibold mb-4">Подтвердите почту</h2>
        <p className="text-sm text-gray-700">
          Мы отправили вам письмо. Перейдите по ссылке, чтобы подтвердить аккаунт.
        </p>
      </div>
    </div>
  );
};

export default AwaitingConfirmationModal;

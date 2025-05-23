import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { generateRadiatorPDF } from '../utils/generateRadiatorPDF';
import { uploadPdfToFirebase } from '../utils/uploadPdfToFirebase';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../firebase';
import { supabase } from '../supabase';
import papkaImg from '../img/papka.jpg';

import {
  ResponsiveContainer,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
} from 'recharts';

// Гидравлический расчет с учетом сопротивления радиатора
function calcHydraulic({ power, supplyLength, innerDiameter, deltaT }) {
  if (!power || !supplyLength || !innerDiameter || !deltaT) return { flow: 0, velocity: 0, resistance: 0, regime: "" };
  const rho = 1000; // кг/м3 (вода)
  const mu = 0.001; // Па*с (вода)
  const pi = Math.PI;
  const N = Number(power); // Вт
  const L = Number(supplyLength); // м
  const D = Number(innerDiameter) / 1000; // мм → м
  const DT = Number(deltaT);

  // 1. Расход (м³/ч), затем в м³/с
  let Qm3h = N / (1.16 * DT * 1000); // м³/ч
  let Q = Qm3h / 3600; // м³/с

  // 2. Площадь и скорость
  const S = pi * D * D / 4;
  const v = Q / S;

  // 3. Число Рейнольдса
  const Re = rho * v * D / mu;

  // 4. λ (Блазиус или ламинарный)
  let lambda = 0.03;
  let regime = "—";
  if (Re > 2300) {
    lambda = 0.3164 / Math.pow(Re, 0.25);
    regime = `Турбулентный (Re=${Math.round(Re)})`;
  } else if (Re > 0) {
    lambda = 64 / Re;
    regime = `Ламинарный (Re=${Math.round(Re)})`;
  }

  // 5. Потери давления по трубе (ΔP, Па)
  const dP_truba = lambda * (L / D) * (rho * v * v / 2); // Па

  // 6. Сопротивление радиатора
  const K = 0.0082; // Па / (кг/ч)^2
  // Q (м³/ч) → q (кг/ч), 1 м³ воды = 1000 кг
  const q = Qm3h * 1000; // кг/ч
  const dP_rad = K * q * q; // Па

  // 7. Итоговое сопротивление (Па), переводим в кПа
  const dP_total = dP_truba + dP_rad;
  const resistance = dP_total / 1000; // кПа

  // 8. Переводим расход в л/мин
  const flowLmin = Q * 60 * 1000;

  return { flow: flowLmin, velocity: v, resistance, regime };
}

const TempDeltaCard = ({ value, onChange }) => {
  const allowed = [5, 10, 15, 20, 25, 30];
  const min = 5;
  const max = 30;
  const step = 5;
  const handleMinus = () => { if (value > min) onChange(value - step); };
  const handlePlus = () => { if (value < max) onChange(value + step); };
  const handleInput = e => {
    let val = parseInt(e.target.value, 10);
    if (isNaN(val)) return;
    if (val < min) val = min;
    if (val > max) val = max;
    val = Math.round(val / step) * step;
    if (!allowed.includes(val)) val = allowed[0];
    onChange(val);
  };
  return (
    <div className="bg-white shadow rounded-xl p-2 w-full max-w-[220px] mb-4">
      <div className="text-sm font-semibold text-center mb-2">ΔT (°C)</div>
      <div className="flex items-center justify-center gap-1">
        <button onClick={handleMinus} disabled={value <= min} className="px-2 py-1 text-sm bg-gray-200 rounded">-</button>
        <input
          type="number"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={handleInput}
          className="border border-gray-300 rounded-md p-1 text-sm w-20 text-center"
          list="delta-t-steps"
        />
        <datalist id="delta-t-steps">
          {allowed.map(n => <option key={n} value={n} />)}
        </datalist>
        <button onClick={handlePlus} disabled={value >= max} className="px-2 py-1 text-sm bg-gray-200 rounded">+</button>
      </div>
    </div>
  );
};

const LoopCard = ({ index, data, updateData, removeData }) => {
  const minPower = 200;
  const maxPower = 3000;
  const adjustValue = (field, delta) => {
    const newValue = Math.max(0, (parseInt(data[field], 10) || 0) + delta);
    updateData(index, { ...data, [field]: newValue });
  };
  const handleChange = (field, value) => updateData(index, { ...data, [field]: value });
  return (
    <div className="bg-white shadow rounded-xl p-2 w-full max-w-[220px] relative">
      <div className="absolute top-2 left-2 w-6 h-6 rounded-full border border-gray-300 text-center text-sm font-bold text-gray-700 leading-6">{index + 1}</div>
      <button
        onClick={() => removeData(index)}
        className="absolute top-2 right-2 w-6 h-6 rounded-full border border-gray-300 text-gray-700 font-bold flex items-center justify-center bg-transparent hover:bg-gray-100"
      >−</button>
      <div className="flex flex-col items-center gap-2 mb-1">
        <input
          type="text"
          placeholder="Название"
          value={data.name}
          onChange={e => handleChange('name', e.target.value)}
          className="border border-gray-300 rounded-md p-1 text-sm w-36 text-center"
        />
        <input
          type="number"
          min={minPower}
          max={maxPower}
          step={100}
          value={data.power === undefined ? '' : data.power}
          onChange={e => handleChange('power', e.target.value === '' ? undefined : parseInt(e.target.value, 10))}
          className="border border-gray-300 rounded-md p-1 text-sm w-36 text-center font-semibold"
          placeholder="Мощность (Вт)"
          style={{ textAlign: "center" }}
        />
        <div className="flex items-center gap-1">
          <button onClick={() => adjustValue('supplyLength', -10)} className="px-2 py-1 text-sm bg-gray-200 rounded">-</button>
          <input
            type="number"
            placeholder="Подводящие (м)"
            value={data.supplyLength}
            onChange={e => handleChange('supplyLength', e.target.value)}
            className="border border-gray-300 rounded-md p-1 text-sm w-20 text-center"
          />
          <button onClick={() => adjustValue('supplyLength', 10)} className="px-2 py-1 text-sm bg-gray-200 rounded">+</button>
        </div>
        <input
          type="number"
          placeholder="Диаметр (мм)"
          value={data.innerDiameter}
          onChange={e => handleChange('innerDiameter', e.target.value)}
          className="border border-gray-300 rounded-md p-1 text-sm w-36 text-center"
        />
      </div>
    </div>
  );
};

const ResultCard = ({ index, name, power, flow, resistance, velocity, regime }) => (
  <div className="bg-gray-100 shadow-inner rounded-xl p-2 w-full max-w-[220px] border-transparent">
    <div className="text-sm text-gray-800 font-medium text-center mb-1">{name || `Радиатор ${index + 1}`}</div>
    <div className="text-xs text-gray-600 text-center">Мощность: <b>{power > 0 ? Math.round(power) : "—"}</b> Вт</div>
    <div className="text-xs text-gray-600 text-center">Расход: <b>{flow > 0 ? flow.toFixed(2) : "—"}</b> л/мин</div>
    <div className="text-xs text-gray-600 text-center">Сопротивление: <b>{resistance > 0 ? resistance.toFixed(2) : "—"}</b> кПа</div>
    <div className="text-xs text-gray-600 text-center">Скорость: <b>{velocity > 0 ? velocity.toFixed(2) : "—"}</b> м/с</div>
    <div className="text-[10px] text-gray-500 text-center">{regime}</div>
  </div>
);

const FlowRateChartCard = ({ data }) => {
  const chartData = data.map((item, index) => ({
    name: item.name || `Радиатор ${index + 1}`,
    flow: item.flow || 0
  }));
  return (
    <div className="p-4 w-full max-w-[440px] h-[260px]">
      <div className="text-sm font-semibold text-center mb-2">График расходов (л/мин)</div>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={chartData}>
          <CartesianGrid stroke="#999" strokeWidth={1.5} strokeDasharray="3 3" />
          <XAxis dataKey="name" fontSize={12} stroke="#666" strokeWidth={2} />
          <YAxis stroke="#666" strokeWidth={2} />
          <Tooltip />
          <Bar dataKey="flow" fill="#999" radius={[6, 6, 0, 0]} barSize={30} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

const LoopCardListThree = () => {
    const [cards, setCards] = useState([{ power: undefined, name: "", supplyLength: 15, innerDiameter: 12 }]);
    const [deltaT, setDeltaT] = useState(15);
    const [showSaveModal, setShowSaveModal] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);
    const [shareUrl, setShareUrl] = useState(null);
    const [shareRef, setShareRef] = useState(null);
    const [userFolders, setUserFolders] = useState([]);
    const user = useSelector(state => state.auth.user);
  
    const addCard = () => setCards(prev => [...prev, { power: undefined, name: "", supplyLength: 15, innerDiameter: 12 }]);
    const updateCard = (index, data) => setCards(cards.map((c, i) => i === index ? data : c));
    const removeCard = index => setCards(cards.filter((_, i) => i !== index));
  
    useEffect(() => {
      const fetchFolders = async () => {
        if (!user) return;
        const { data, error } = await supabase.from('projects').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
        if (!error) setUserFolders(data);
      };
      fetchFolders();
    }, [user]);
  
    const results = cards.map((c) => calcHydraulic({
      power: Number(c.power),
      supplyLength: Number(c.supplyLength),
      innerDiameter: Number(c.innerDiameter),
      deltaT: Number(deltaT)
    }));
  
    const handleDownload = async () => {
      const doc = await generateRadiatorPDF({ cards, results });
      doc.save(`radiator-report-${Date.now()}.pdf`);
    };
  
    const handleSaveToFolder = async (projectId) => {
      try {
        const pdfBlob = await generateRadiatorPDF({ cards, results, asBlob: true });
        const file = new File([pdfBlob], `radiator-report-${Date.now()}.pdf`, { type: 'application/pdf' });
        const downloadUrl = await uploadPdfToFirebase(user.id, projectId, file);
        alert('PDF успешно загружен!');
        setShowSaveModal(false);
      } catch (err) {
        console.error('Ошибка при сохранении PDF:', err);
      }
    };
  
    const handlePrepareShare = async () => {
      try {
        const blob = await generateRadiatorPDF({ cards, results, asBlob: true });
        const path = `${user.id}/temp/radiator-report-${Date.now()}.pdf`;
        const storageRef = ref(storage, path);
        await uploadBytes(storageRef, blob);
        const url = await getDownloadURL(storageRef);
        setShareUrl(url);
        setShareRef(storageRef);
        setShowShareModal(true);
      } catch (err) {
        alert('Не удалось подготовить PDF.');
      }
    };
  
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap justify-center sm:justify-start gap-4 items-start mb-4">
          <FlowRateChartCard data={results} />
        </div>
  
        <div className="flex flex-wrap justify-center sm:justify-start gap-4 items-start mb-1">
          <TempDeltaCard value={deltaT} onChange={setDeltaT} />
        </div>

        <div className="flex gap-4 w-full justify-center sm:justify-start">
          <button onClick={handleDownload} className="bg-gray-100 text-gray-800 font-semibold text-sm rounded-xl px-3 py-3 min-h-[70px] w-full max-w-[220px] flex items-center justify-center transition duration-200 hover:bg-gray-200 shadow">
            Скачать отчет PDF
          </button>
          <button onClick={() => { if (!user) return alert('Чтобы сохранить PDF, войдите в аккаунт.'); setShowSaveModal(true); }} className="bg-gray-100 text-gray-800 font-semibold text-sm rounded-xl px-3 py-3 min-h-[70px] w-full max-w-[220px] flex items-center justify-center transition duration-200 hover:bg-gray-200 shadow">
            Сохранить
          </button>
        </div>
        <div className="w-full flex justify-center sm:justify-start mt-4">
          <button onClick={handlePrepareShare} className="bg-gray-100 text-gray-800 font-semibold text-sm rounded-xl px-3 min-h-[70px] w-full max-w-[460px] flex items-center justify-center transition duration-200 hover:bg-gray-200 shadow">
            Подготовить PDF для отправки
          </button>
        </div>
  
        <div className="flex flex-wrap justify-center sm:justify-start gap-3 mb-6 mt-5">
          {cards.map((card, index) => (
            <LoopCard key={index} index={index} data={card} updateData={updateCard} removeData={removeCard} />
          ))}
          <button onClick={addCard} className="bg-white shadow rounded-xl p-2 w-full max-w-[220px] h-[170px] flex items-center justify-center text-4xl text-green-600 hover:bg-green-50">+</button>
        </div>
  
        <div className="flex flex-wrap justify-center sm:justify-start gap-3 mb-6">
          {results.map((res, index) => (
            <ResultCard
              key={index}
              index={index}
              name={cards[index].name}
              power={res.power}
              flow={res.flow}
              resistance={res.resistance}
              velocity={res.velocity}
              regime={res.regime}
            />
          ))}
        </div>
  
        {showSaveModal && (
          <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 px-4">
            <div className="bg-white border border-black rounded-xl p-4 w-full max-w-md max-h-[400px] overflow-y-auto">
              <h2 className="text-lg font-semibold text-center mb-4">Выберите папку</h2>
              <div className="flex flex-col gap-3">
                {userFolders.map((folder, index) => (
                  <div key={index} onClick={() => handleSaveToFolder(folder.id)} className="flex items-center gap-3 cursor-pointer hover:bg-gray-100 px-2 py-1 rounded">
                    <img src={papkaImg} alt="Папка" className="w-8 h-8 object-contain" />
                    <span className="text-sm text-gray-700">{folder.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
  
        {showShareModal && (
          <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 px-4">
            <div className="bg-white border border-black rounded-xl p-4 w-full max-w-md text-center shadow-xl">
              <h2 className="text-lg font-semibold mb-4 text-gray">PDF готов к отправке</h2>
              <button onClick={async () => {
                try {
                  if (navigator.share) {
                    await navigator.share({ title: 'PDF отчет (радиаторы)', text: 'Ссылка на скачивание файла:', url: shareUrl });
                    if (shareRef) await deleteObject(shareRef);
                    setShareUrl(null);
                    setShareRef(null);
                    setShowShareModal(false);
                  } else {
                    alert('Функция "Поделиться" недоступна.');
                  }
                } catch (err) {
                  alert('Не удалось расшарить PDF.');
                }
              }} className="bg-gray-200 text-black font-semibold text-sm rounded-xl px-4 py-2 mb-3">
                Поделиться PDF
              </button>
              <div>
                <button onClick={() => setShowShareModal(false)} className="text-gray-500 underline text-sm hover:text-gray-700">
                  Закрыть
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };
  
  export default LoopCardListThree;
  
  export {FlowRateChartCard}
  
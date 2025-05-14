import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import papkaImg from '../img/papka.jpg';
import { supabase } from '../supabase';
import { uploadPdfToFirebase } from '../utils/uploadPdfToFirebase';
import { generatePDF } from '../utils/pdfGenerator';
import {
    ResponsiveContainer,
    CartesianGrid,
    XAxis,
    YAxis,
    Tooltip,
    BarChart,
    Bar,
    LineChart,
    Line,
    ReferenceDot
} from 'recharts';

const TempDeltaCard = ({ value, onChange }) => (
    <div className="bg-white shadow rounded-xl p-2 w-full max-w-[220px] mb-4">
        <div className="text-sm font-semibold text-center mb-2">ΔT (°C)</div>
        <div className="flex items-center justify-center gap-1">
            <button onClick={() => onChange(Math.max(2, value - 1))} className="px-2 py-1 text-sm bg-gray-200 rounded">-</button>
            <input
                type="number"
                min={2}
                max={15}
                value={value}
                onChange={e => {
                    const newVal = parseInt(e.target.value, 10);
                    onChange(Math.max(2, Math.min(15, isNaN(newVal) ? value : newVal)));
                }}
                className="border border-gray-300 rounded-md p-1 text-sm w-20 text-center"
            />
            <button onClick={() => onChange(Math.min(15, value + 1))} className="px-2 py-1 text-sm bg-gray-200 rounded">+</button>
        </div>
    </div>
);

const LoopCard = ({ index, data, updateData, removeData }) => {
    const adjustValue = (field, delta) => {
        const newValue = Math.max(0, (parseInt(data[field], 10) || 0) + delta);
        updateData(index, { ...data, [field]: newValue });
    };

    const handleChange = (field, value) => updateData(index, { ...data, [field]: value });

    return (
        <div className="bg-white shadow rounded-xl p-2 w-full max-w-[220px] relative">
            <div className="absolute top-2 left-2 w-6 h-6 rounded-full border border-gray-300 text-center text-sm font-bold text-gray-700 leading-6">
                {index + 1}
            </div>
            <button
                onClick={() => removeData(index)}
                className="absolute top-2 right-2 w-6 h-6 rounded-full border border-gray-300 text-gray-700 font-bold flex items-center justify-center bg-transparent hover:bg-gray-100"
            >
                −
            </button>
            <div className="flex flex-col items-center gap-2 mb-1">
                <input
                    type="text"
                    placeholder="Название"
                    value={data.name}
                    onChange={e => handleChange('name', e.target.value)}
                    className="border border-gray-300 rounded-md p-1 text-sm w-36 text-center"
                />
                <div className="flex items-center gap-1">
                    <button onClick={() => adjustValue('totalLength', -10)} className="px-2 py-1 text-sm bg-gray-200 rounded">-</button>
                    <input
                        type="number"
                        placeholder="Общ. длина (м)"
                        value={data.totalLength}
                        onChange={e => handleChange('totalLength', e.target.value)}
                        className="border border-gray-300 rounded-md p-1 text-sm w-20 text-center"
                    />
                    <button onClick={() => adjustValue('totalLength', 10)} className="px-2 py-1 text-sm bg-gray-200 rounded">+</button>
                </div>
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
                <select
                    value={data.pipeStep}
                    onChange={e => handleChange('pipeStep', parseInt(e.target.value, 10))}
                    className="border border-gray-300 rounded-md p-1 text-sm w-36 text-center"
                >
                    {[100, 150, 200, 250, 300].map(step => (
                        <option key={step} value={step}>{step} мм</option>
                    ))}
                </select>
            </div>
        </div>
    );
};

const ResultCard = ({ index, name, power, flowRate, resistance, regime }) => {
    const isOutOfRange = resistance < 7.5 || resistance > 20;
    const borderClass = isOutOfRange ? 'border-red-400 border-2' : 'border-transparent';

    return (
        <div className={`bg-gray-100 shadow-inner rounded-xl p-2 w-full max-w-[220px] ${borderClass}`}>
            <div className="text-sm text-gray-800 font-medium text-center mb-1">{name || `Петля ${index + 1}`}</div>
            <div className="text-xs text-gray-600 text-center">Мощность: <b>{power}</b> Вт</div>
            <div className="text-xs text-gray-600 text-center">Расход: <b>{flowRate.toFixed(2)}</b> л/мин</div>
            <div className="text-xs text-gray-600 text-center">Сопротивление: <b>{resistance.toFixed(2)}</b> кПа</div>
            <div className="text-[10px] text-gray-500 text-center">Режим: {regime}</div>
        </div>
    );
};

const FlowRateChartCard = ({ data }) => {
    const chartData = data.map((item, index) => ({
        name: item.name || `Петля ${index + 1}`,
        flow: item.flowRate
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

const PumpCurveSmallCard = ({ curve, operatingPoint }) => (
    <div className="p-4 w-full max-w-[220px] mb-4 flex flex-col items-center h-[260px]">
        <div className="text-sm font-semibold text-center mb-2">Кривая насоса 25-60</div>
        <div className="w-full flex justify-start -ml-12">
            <ResponsiveContainer width="100%" height={180}>
                <LineChart data={curve.data}>
                    <CartesianGrid stroke="#ccc" strokeDasharray="5 5" />
                    <XAxis type="number" dataKey="flow" name="м³/ч" fontSize={10} stroke="#666" />
                    <YAxis type="number" dataKey="head" name="м" fontSize={10} stroke="#666" />
                    <Tooltip formatter={value => value.toFixed(2)} />
                    <Line type="monotone" dataKey="head" stroke="#999" strokeWidth={3} dot={false} />
                    <ReferenceDot x={operatingPoint.flow} y={operatingPoint.head} r={5} fill="red" />
                </LineChart>
            </ResponsiveContainer>
        </div>
    </div>
);

const LoopCardList = () => {
    const [showSaveModal, setShowSaveModal] = useState(false);
    const [userFolders, setUserFolders] = useState([]);
    const [projectName, setProjectName] = useState('');
    const [cards, setCards] = useState([
        { name: "", totalLength: 70, supplyLength: 15, innerDiameter: 12, pipeStep: 150 }
    ]);
    const [deltaT, setDeltaT] = useState(5);
    const user = useSelector((state) => state.auth.user);
    const addCard = () => setCards(prev => [
        ...prev,
        { name: "", totalLength: 70, supplyLength: 15, innerDiameter: 12, pipeStep: 150 }
    ]);
    const updateCard = (index, data) => setCards(cards.map((c, i) => i === index ? data : c));
    const removeCard = index => setCards(cards.filter((_, i) => i !== index));

    useEffect(() => {
        const fetchFolders = async () => {
            if (!user) return;
            const { data, error } = await supabase
                .from('projects')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });
            if (!error) setUserFolders(data);
        };
        fetchFolders();
    }, [user]);

    const results = cards.map((c) => {
        const totalLength = parseFloat(c.totalLength) || 0;
        const supplyLength = parseFloat(c.supplyLength) || 0;
        const diameter = parseFloat(c.innerDiameter) || 1;
        const usefulLength = Math.max(0, totalLength - supplyLength);

        let wattsPerMeter;
        switch (c.pipeStep) {
            case 100: wattsPerMeter = 8; break;
            case 150: wattsPerMeter = 9; break;
            case 200: wattsPerMeter = 10; break;
            case 250: wattsPerMeter = 11; break;
            case 300: wattsPerMeter = 12; break;
            default: wattsPerMeter = 9;
        }

        let deltaCoef = 1;
        if (deltaT >= 10) deltaCoef = 0.8;
        else if (deltaT > 5) deltaCoef = 1 - (deltaT - 5) * 0.06;

        const power = Math.round(usefulLength * wattsPerMeter * deltaCoef);
        const flowRate = deltaT > 0 ? power / (1.16 * deltaT * 60) : 0;

        const Q_m3s = flowRate / 1000 / 60;
        const d_m = diameter / 1000;
        const A = Math.PI * (d_m / 2) ** 2;
        const rho = 1000, g = 9.81, nu = 1e-6, mu = 0.001;

        if (d_m <= 0 || A === 0 || Q_m3s <= 0) {
            return { power, flowRate, resistance: Infinity, regime: 'ошибка' };
        }

        const v = Q_m3s / A;
        const Re = v * d_m / nu;
        let deltaPUseful, deltaPSupply, resistance, regime;

        if (Re < 2300) {
            const baseDeltaP = (128 * mu * Q_m3s) / (Math.PI * Math.pow(d_m, 4));
            deltaPUseful = baseDeltaP * usefulLength * 1.4;
            deltaPSupply = baseDeltaP * supplyLength * 1.2;
            resistance = (deltaPUseful + deltaPSupply) / 1000 + 7;
            regime = `Ламинарный (Re = ${Math.round(Re)})`;
        } else {
            const lambda = 0.03;
            const hfPerMeter = (lambda * Math.pow(v, 2)) / (2 * g * d_m);
            deltaPUseful = rho * g * hfPerMeter * usefulLength * 1.4;
            deltaPSupply = rho * g * hfPerMeter * supplyLength * 1.2;
            resistance = (deltaPUseful + deltaPSupply) / 1000 + 7;
            regime = `Турбулентный (Re = ${Math.round(Re)})`;
        }

        return { power, flowRate, resistance, regime };
    });

    const totalFlow = (results.reduce((sum, r) => sum + r.flowRate, 0) / 1000) * 60;
    const maxHead = results.length ? Math.max(...results.map(r => r.resistance)) / 9.81 : 0;

    const grundfosCurve = {
        name: 'Grundfos UPS 25-60',
        data: [
            { flow: 0, head: 6 },
            { flow: 1, head: 5.5 },
            { flow: 2, head: 5 },
            { flow: 3, head: 4 },
            { flow: 4, head: 2.5 },
            { flow: 5, head: 1 },
            { flow: 6, head: 0 }
        ]
    };

    const handleSaveToFolder = async (projectId) => {
        try {
            const firstNamedCard = cards.find(c => c.name?.trim());
            const fileName = `${firstNamedCard?.name || projectName || 'calc'}.pdf`;
    
            const pdfBlob = await generatePDF({
                deltaT,
                totalFlow,
                maxHead,
                cards,
                results,
                projectName,
                asBlob: true,
            });
    
            const file = new File([pdfBlob], fileName, { type: 'application/pdf' });
    
            const downloadUrl = await uploadPdfToFirebase(user.id, projectId, file);
            console.log('✅ Загружено! Ссылка:', downloadUrl);
    
            alert('PDF успешно загружен!');
            setShowSaveModal(false);
        } catch (err) {
            console.error('❌ Ошибка при загрузке PDF:', err);
        }
    };
    
    return (
        <div className="max-w-10xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-wrap justify-center sm:justify-start gap-4 items-start mb-4">
                <PumpCurveSmallCard curve={grundfosCurve} operatingPoint={{ flow: totalFlow, head: maxHead }} />
                <FlowRateChartCard data={results} />
            </div>

            <div className="flex flex-wrap justify-center sm:justify-start gap-4 items-start mb-1 ml-8">
                <TempDeltaCard value={deltaT} onChange={setDeltaT} />
                <div className="bg-white shadow rounded-xl p-2 w-full max-w-[220px]">
                    <div className="text-sm font-semibold text-center mb-2">Название</div>
                    <input
                        type="text"
                        placeholder="Введите название"
                        value={projectName}
                        onChange={e => setProjectName(e.target.value)}
                        className="border border-gray-300 rounded-md p-1 text-sm w-full text-center"
                    />
                </div>
                <div className="bg-white shadow rounded-xl py-2 w-full max-w-[220px]">
                    <div className="text-sm font-semibold text-center mb-2">{projectName || 'Общие итоги'}</div>
                    <div className="text-xs text-gray-700 text-center">Суммарный расход: <b>{totalFlow.toFixed(3)}</b> м³/ч</div>
                    <div className="text-xs text-gray-700 text-center">Макс. сопротивление: <b>{maxHead.toFixed(2)}</b> м вод. ст.</div>
                </div>

                <button
                    onClick={() =>
                        generatePDF({
                            deltaT,
                            totalFlow,
                            maxHead,
                            cards,
                            results,
                            projectName,
                        })
                    }
                    className="bg-white border border-gray-400 text-gray-700 font-semibold text-sm rounded-xl px-4 py-3 w-full max-w-[220px] min-h-[75px] flex items-center justify-center transition duration-200 hover:border-blue-500 hover:bg-blue-100 hover:text-blue-600 shadow"
                >
                    Отчет PDF
                </button>

                <button
                    onClick={() => setShowSaveModal(true)}
                    className="bg-white border text-gray-700 font-semibold text-sm rounded-xl px-4 py-3 w-full max-w-[220px] min-h-[75px] flex items-center justify-center transition duration-200 shadow"
                >
                    Сохранить
                </button>

            </div>


            <div className="flex flex-wrap justify-center sm:justify-start gap-4 mb-6 ml-8">
                {cards.map((card, index) => (
                    <LoopCard key={index} index={index} data={card} updateData={updateCard} removeData={removeCard} />
                ))}
                <button
                    onClick={addCard}
                    className="bg-white shadow rounded-xl p-2 w-full max-w-[220px] h-[170px] flex items-center justify-center text-4xl text-green-600 hover:bg-green-50"
                >
                    +
                </button>
            </div>

            <div className="flex flex-wrap justify-center sm:justify-start gap-4 ml-8">
                {results.map((res, index) => (
                    <ResultCard
                        key={index}
                        index={index}
                        name={cards[index].name}
                        power={res.power}
                        flowRate={res.flowRate}
                        resistance={res.resistance}
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
                                <div
                                    key={index}
                                    onClick={() => handleSaveToFolder(folder.id)}
                                    className="flex items-center gap-3 cursor-pointer hover:bg-gray-100 px-2 py-1 rounded"
                                >
                                    <img src={papkaImg} alt="Папка" className="w-8 h-8 object-contain" />
                                    <span className="text-sm text-gray-700">{folder.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LoopCardList;

export { FlowRateChartCard };
export { PumpCurveSmallCard };
import React, { useState, useEffect } from "react";
import { Combobox } from "@headlessui/react";
import { useSelector } from 'react-redux';
import { generateWaterPDF } from '../utils/generateWaterPDF';
import { uploadPdfToFirebase } from '../utils/uploadPdfToFirebase';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../firebase';
import { supabase } from '../supabase';
import papkaImg from '../img/papka.jpg';

const fixtures = [
    "унитаз", "стиральная машина", "посудомоечная машина", "мойка",
    "раковина", "душ", "ванна", "гиг.душ", "биде"
];

const rooms = ["кухня", "с/у 1 эт", "с/у 2 эт"];

const getBorderColor = (mode) => {
    switch (mode) {
        case "ХВС": return "border-blue-500";
        case "ГВС": return "border-red-500";
        case "РГВС": return "border-yellow-400";
        default: return "border-transparent";
    }
};

function ComboInput({ value, onChange, options, placeholder }) {
    const [query, setQuery] = useState("");
    const filtered = query === "" ? options : options.filter((item) =>
        item.toLowerCase().includes(query.toLowerCase())
    );

    return (
        <Combobox value={value} onChange={onChange}>
            <div className="relative w-36">
                <Combobox.Input
                    className="border border-gray-300 rounded-md p-1 text-sm w-36 text-center"
                    placeholder={placeholder}
                    displayValue={(item) => item}
                    onChange={(event) => {
                        setQuery(event.target.value);
                        onChange(event.target.value);
                    }}
                />
                <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2 text-gray-500">▼</Combobox.Button>
                <Combobox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                    {filtered.length === 0 && query !== "" ? (
                        <Combobox.Option value={query} className="cursor-default select-none py-2 pl-4 pr-4 text-gray-700">
                            Добавить: {query}
                        </Combobox.Option>
                    ) : (
                        filtered.map((item) => (
                            <Combobox.Option key={item} value={item} className={({ active }) => `cursor-pointer select-none py-2 pl-4 pr-4 ${active ? "bg-blue-100 text-blue-900" : "text-gray-900"}`}>
                                {item}
                            </Combobox.Option>
                        ))
                    )}
                </Combobox.Options>
            </div>
        </Combobox>
    );
}

const LoopCard = ({ index, data, updateData, removeData }) => {
    const handleChange = (field, value) => updateData(index, { ...data, [field]: value });
    return (
        <div className="bg-white shadow rounded-xl p-2 w-full max-w-[220px] relative">
            <div className="absolute top-2 left-2 w-6 h-6 rounded-full border border-gray-300 text-center text-sm font-bold text-gray-700 leading-6">{index + 1}</div>
            <button onClick={() => removeData(index)} className="absolute top-2 right-2 w-6 h-6 rounded-full border border-gray-300 text-gray-700 font-bold flex items-center justify-center bg-transparent hover:bg-gray-100">−</button>
            <div className="flex flex-col items-center gap-2 mb-1">
                <ComboInput value={data.name} onChange={v => handleChange('name', v)} options={fixtures} placeholder="Название" />
                <ComboInput value={data.room} onChange={v => handleChange('room', v)} options={rooms} placeholder="Помещение" />
                <select value={data.mode || "ХВС"} onChange={e => handleChange('mode', e.target.value)} className="border border-gray-300 rounded-md p-1 text-sm w-36 text-center">
                    <option value="ХВС">ХВС</option>
                    <option value="ГВС">ГВС</option>
                    <option value="РГВС">РГВС</option>
                </select>
            </div>
        </div>
    );
};

const ResultCard = ({ index, name, room, mode }) => {
    const borderColor = getBorderColor(mode);
    return (
        <div className={`bg-gray-100 shadow-inner rounded-xl p-2 w-full max-w-[220px] border-2 ${borderColor} flex flex-col items-center`}>
            <div className="text-lg text-gray-800 font-semibold text-center mb-3">{name || `Прибор ${index + 1}`}</div>
            <div className="text-base text-gray-800 text-center mb-3 font-semibold">{room || "—"}</div>
            <div className="text-base text-gray-800 text-center mb-1 font-semibold">{mode}</div>
        </div>
    );
};

const LoopCardListTwo = () => {
    const [cards, setCards] = useState([{ mode: "ХВС", name: "", room: "" }]);
    const [userFolders, setUserFolders] = useState([]);
    const [showSaveModal, setShowSaveModal] = useState(false);
    const [shareUrl, setShareUrl] = useState(null);
    const [shareRef, setShareRef] = useState(null);
    const [showShareModal, setShowShareModal] = useState(false);
    const user = useSelector(state => state.auth.user);

    const addCard = () => {
        setCards(prev => [...prev, { ...prev[prev.length - 1] }]);
    };

    const updateCard = (index, data) => setCards(cards.map((c, i) => i === index ? data : c));
    const removeCard = index => setCards(cards.filter((_, i) => i !== index));

    const results = cards.map((c) => ({ name: c.name, room: c.room, mode: c.mode }));

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

    const handleDownload = async () => {
        const doc = await generateWaterPDF({ cards });
        doc.save(`water-report-${Date.now()}.pdf`);
    };

    const handleSaveToFolder = async (projectId) => {
        try {
            const firstNamedCard = cards.find(c => c.name?.trim());
            const fileName = `${firstNamedCard?.name || 'water-report'}.pdf`;
            const blob = await generateWaterPDF({ cards, asBlob: true });
            const file = new File([blob], fileName, { type: 'application/pdf' });
            await uploadPdfToFirebase(user.id, projectId, file);
            alert('PDF успешно загружен!');
            setShowSaveModal(false);
        } catch (err) {
            console.error('❌ Ошибка при загрузке PDF:', err);
        }
    };

    const handlePrepareShare = async () => {
        try {
            const blob = await generateWaterPDF({ cards, asBlob: true });
            const fileName = `share-${Date.now()}.pdf`;
            const path = `${user.id}/temp/${fileName}`;
            const storageRef = ref(storage, path);
            await uploadBytes(storageRef, blob);
            const url = await getDownloadURL(storageRef);
            setShareUrl(url);
            setShareRef(storageRef);
            setShowShareModal(true);
        } catch (err) {
            console.error('Ошибка подготовки PDF:', err);
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex flex-col gap-4 w-full items-center sm:items-start">
                
                <div className="flex gap-4 w-full justify-center sm:justify-start">
                    <button
                        onClick={handleDownload}
                        className="bg-gray-100 text-gray-800 font-semibold text-sm rounded-xl px-3 py-3 min-h-[70px] w-full max-w-[220px] flex items-center justify-center transition duration-200 hover:bg-gray-200 shadow"
                    >
                        Скачать отчет PDF
                    </button>

                    <button
                        onClick={() => {
                            if (!user) {
                                alert('Чтобы сохранить PDF, войдите в аккаунт.');
                                return;
                            }
                            setShowSaveModal(true);
                        }}
                        className="bg-gray-100 text-gray-800 font-semibold text-sm rounded-xl px-3 py-3 min-h-[70px] w-full max-w-[220px] flex items-center justify-center transition duration-200 hover:bg-gray-200 shadow"
                    >
                        Сохранить
                    </button>
                </div>

                <div className="w-full flex justify-center sm:justify-start">
                    <button
                        onClick={handlePrepareShare}
                        className="bg-gray-100 text-gray-800 font-semibold text-sm rounded-xl px-3 min-h-[70px] w-full max-w-[455px] flex items-center justify-center transition duration-200 hover:bg-gray-200 shadow"
                    >
                        Подготовить PDF для отправки
                    </button>
                </div>
            </div>

            <div className="flex flex-wrap justify-center sm:justify-start gap-3 mb-6 mt-6 ">
                {cards.map((card, index) => (
                    <LoopCard key={index} index={index} data={card} updateData={updateCard} removeData={removeCard} />
                ))}
                <button onClick={addCard} className="bg-white shadow rounded-xl p-2 w-full max-w-[220px] h-[170px] flex items-center justify-center text-4xl text-green-600 hover:bg-green-50">+</button>
            </div>

            <div className="flex flex-wrap justify-center sm:justify-start gap-3 mb-6">
                {results.map((res, index) => (
                    <ResultCard key={index} index={index} name={res.name} room={res.room} mode={res.mode} />
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

            {showShareModal && (
                <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 px-4">
                    <div className="bg-white border border-black rounded-xl p-4 w-full max-w-md text-center shadow-xl">
                        <h2 className="text-lg font-semibold mb-4 text-gray">PDF готов к отправке</h2>
                        <button
                            onClick={async () => {
                                try {
                                    if (navigator.share) {
                                        await navigator.share({
                                            title: 'PDF отчет',
                                            text: 'Ссылка на файл:',
                                            url: shareUrl,
                                        });
                                        if (shareRef) await deleteObject(shareRef);
                                        setShareUrl(null);
                                        setShareRef(null);
                                        setShowShareModal(false);
                                    } else {
                                        alert('Функция "Поделиться" недоступна.');
                                    }
                                } catch (err) {
                                    console.error('Ошибка при отправке PDF:', err);
                                    alert('Не удалось расшарить PDF.');
                                }
                            }}
                            className="bg-gray-200 text-black font-semibold text-sm rounded-xl px-4 py-2 mb-3"
                        >
                            Поделиться PDF
                        </button>
                        <button
                            onClick={() => setShowShareModal(false)}
                            className="text-gray-500 underline text-sm hover:text-gray-700"
                        >
                            Закрыть
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LoopCardListTwo;
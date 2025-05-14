import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { useSelector } from 'react-redux';
import papkaImg from '../img/papka.jpg';
import { useNavigate } from 'react-router-dom';
import { ref, listAll, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase'; // твой firebase.js

const AddProjectCard = () => {
    const [activeProjectId, setActiveProjectId] = useState(null);
    const [pdfList, setPdfList] = useState([]);
    const navigate = useNavigate();
    const [projects, setProjects] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({
        name: '',
        surname: '',
        address: '',
        phone: '',
    });

    const user = useSelector((state) => state.auth.user);

    const handleChange = (key, value) => {
        setForm((prev) => ({ ...prev, [key]: value }));
    };

    const handleAddProject = async () => {
        if (!user) return;

        const { data, error } = await supabase.from('projects').insert([{
            user_id: user.id,
            name: form.name,
            surname: form.surname,
            address: form.address,
            phone: form.phone,
        }]);

        console.log('add project result:', { data, error });

        if (!error) {
            setProjects((prev) => [...prev, { ...form, id: data?.[0]?.id || Math.random() }]);
            setForm({ name: '', surname: '', address: '', phone: '' });
            setShowForm(false);
        } else {
            alert('Ошибка: ' + error.message);
        }
    };

    useEffect(() => {
        const fetchProjects = async () => {
            if (!user) return;
            const { data, error } = await supabase
                .from('projects')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (!error) {
                setProjects(data);
            } else {
                console.error('Ошибка загрузки проектов:', error.message);
            }
        };

        fetchProjects();
    }, [user]);

    const fetchProjectPDF = async (projectId) => {
        try {
            const listRef = ref(storage, `${user.id}/${projectId}`);
            const result = await listAll(listRef);

            if (result.items.length > 0) {
                const pdfRef = result.items[0];
                const url = await getDownloadURL(pdfRef);
                setPdfUrl(url);
            } else {
                setPdfUrl(null);
            }
        } catch (err) {
            console.error('Ошибка загрузки PDF из Firebase:', err);
            setPdfUrl(null);
        }
    };

    return (
        <div className="mt-6 flex gap-6 flex-col">
            <div
                onClick={() => setShowForm(true)}
                className="w-40 h-40 bg-white border border-black rounded-[5px] flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition"
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-12 w-12 text-black mb-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="1"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                <p className="text-center text-sm font-medium text-gray-600">
                    Добавить<br />проект
                </p>
            </div>

            {showForm && (
                <div className="bg-white border border-black rounded-[5px] p-4 w-full max-w-md flex flex-col gap-4">
                    {[
                        { label: 'Название', key: 'name' },
                        { label: 'Фамилия', key: 'surname' },
                        { label: 'Адрес', key: 'address' },
                        { label: 'Телефон', key: 'phone' },
                    ].map(({ label, key }) => (
                        <div key={key} className="flex flex-col">
                            <label className="text-sm text-black-600 mt-2">{label}</label>
                            <input
                                type="text"
                                value={form[key]}
                                onChange={(e) => handleChange(key, e.target.value)}
                                className="bg-white outline-none border-0 border-b border-black text-sm h-8"
                            />
                        </div>
                    ))}

                    <div className="flex justify-end">
                        <button
                            onClick={handleAddProject}
                            className="text-sm px-4 py-1 rounded border border-black text-gray-700 bg-white hover:bg-gray-100 transition"
                        >
                            Добавить
                        </button>
                    </div>
                </div>
            )}

            {projects.map((proj) => (
                <div key={proj.id} className="flex flex-col gap-1">
                    <div
                        className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition"
                        onClick={async () => {
                            setActiveProjectId(proj.id);
                            try {
                                const listRef = ref(storage, `${user.id}/${proj.id}`);
                                const result = await listAll(listRef);

                                const urls = await Promise.all(
                                    result.items.map(async (fileRef) => {
                                        const url = await getDownloadURL(fileRef);
                                        return { name: fileRef.name, url };
                                    })
                                );

                                setPdfList(urls);
                            } catch (err) {
                                console.error('Ошибка загрузки PDF из Firebase:', err);
                                setPdfList([]);
                            }
                        }}
                    >
                        <img src={papkaImg} alt="Папка" className="w-8 h-8 object-contain" />
                        <span className="text-sm text-gray-600">{proj.name}</span>
                    </div>

                    {activeProjectId === proj.id && pdfList.length > 0 && (
                        <div className="ml-10 flex flex-col gap-1 mt-1">
                            {pdfList.map((pdf, idx) => (
                                <a
                                    key={idx}
                                    href={pdf.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-blue-600 underline text-sm"
                                >
                                    {pdf.name}
                                </a>
                            ))}
                        </div>
                    )}
                </div>
            ))}

        </div>
    );

};

export default AddProjectCard;

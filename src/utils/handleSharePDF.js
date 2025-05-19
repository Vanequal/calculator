import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../firebase';
import { generatePDF } from './pdfGenerator';

const handleSharePDF = async ({ deltaT, totalFlow, maxHead, cards, results, projectName, user }) => {
  try {
    const { blob, filename } = await generatePDF({
      deltaT,
      totalFlow,
      maxHead,
      cards,
      results,
      projectName,
      asBlob: true,
    });

    const path = `${user.id}/temp/${filename}`;
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, blob);

    const url = await getDownloadURL(storageRef);

    if (navigator.share) {
      await navigator.share({
        title: 'PDF отчет из GaldDesign',
        text: 'Ссылка на скачивание файла:',
        url,
      });
      await deleteObject(storageRef);
    } else {
      alert('Функция "Поделиться" недоступна на этом устройстве.');
    }
  } catch (err) {
    console.error('Ошибка при генерации или отправке PDF:', err);
    alert('Не удалось сгенерировать и отправить PDF.');
  }
};

export default handleSharePDF;
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase';
import { generatePDF } from './pdfGenerator';

const handleSharePDF = async () => {
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

  return { url, storageRef };
};

export default handleSharePDF;
import { jsPDF } from 'jspdf';
import '../utils/DejaVuSans';

export const generateWaterPDF = async ({ cards, asBlob = false }) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    putOnlyUsedFonts: true,
  });

  const getBorderColor = (mode) => {
    switch (mode) {
      case "ХВС": return [66, 133, 244]; // Синий
      case "ГВС": return [255, 193, 7];  // Желтый
      case "РГВС": return [244, 67, 54]; // Красный
      default: return [180, 180, 180];
    }
  };

  doc.setFont('DejaVuSans', 'normal');
  doc.setFontSize(18);
  doc.text('Калькулятор водоснабжения', 10, 20);

  const now = new Date();
  const dateStr = `Дата: ${now.toLocaleDateString()} | Время: ${now.toLocaleTimeString()}`;
  doc.setFontSize(10);
  doc.text(dateStr, 10, 28);

  doc.setDrawColor(180);
  doc.line(10, 32, 200, 32);

  const startY = 38;
  const rowHeight = 8;
  const colWidths = [10, 60, 60, 40];
  const headers = ['#', 'Название', 'Помещение', 'Режим'];
  const startX = 10;

  let y = startY;
  let x = startX;

  doc.setFontSize(10);
  headers.forEach((text, i) => {
    doc.rect(x, y, colWidths[i], rowHeight);
    doc.text(text, x + 2, y + 6);
    x += colWidths[i];
  });

  y += rowHeight;

  cards.forEach((card, index) => {
    const row = [
      String(index + 1),
      card.name || '—',
      card.room || '—',
      card.mode || '—'
    ];

    x = startX;
    row.forEach((text, i) => {
      doc.rect(x, y, colWidths[i], rowHeight);
      doc.text(String(text), x + 2, y + 6);
      x += colWidths[i];
    });

    y += rowHeight;

    if (y + rowHeight > doc.internal.pageSize.getHeight() - 60) {
      doc.addPage();
      y = startY;
    }
  });

  doc.line(10, y + 4, 200, y + 4);
  y += 10;

  const cardWidth = 90;
  const cardHeight = 35;
  const cardGapX = 10;
  const cardGapY = 10;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  for (let i = 0; i < cards.length; i += 2) {
    const leftCard = cards[i];
    const rightCard = cards[i + 1];

    const cardX1 = (pageWidth / 2) - cardWidth - (cardGapX / 2);
    const cardX2 = (pageWidth / 2) + (cardGapX / 2);

    if (y + cardHeight > pageHeight - 20) {
      doc.addPage();
      y = startY;
    }

    const drawCard = (card, x) => {
      const borderColor = getBorderColor(card.mode);
      doc.setDrawColor(...borderColor);
      doc.setFillColor(243, 244, 246);
      doc.roundedRect(x, y, cardWidth, cardHeight, 4, 4, 'FD');
      doc.setTextColor(0);
      doc.setFontSize(9);
      doc.text(card.name || `Прибор`, x + cardWidth / 2, y + 8, { align: 'center' });
      doc.setFontSize(8);
      doc.text(card.room || '—', x + cardWidth / 2, y + 16, { align: 'center' });
      doc.text(card.mode || '—', x + cardWidth / 2, y + 24, { align: 'center' });
    };

    drawCard(leftCard, cardX1);
    if (rightCard) drawCard(rightCard, cardX2);

    y += cardHeight + cardGapY;
  }

  doc.setFontSize(10);
  doc.setTextColor(0);
  doc.text('Сформировано на loop-calculator', 10, doc.internal.pageSize.getHeight() - 10);

  if (asBlob) {
    return doc.output('blob');
  } else {
    return doc;
  }
};
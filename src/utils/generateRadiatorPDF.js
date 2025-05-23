import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import '../utils/DejaVuSans';
import { renderChartToImage } from './renderChartToImage';
import { FlowRateChartCard } from '../components/LoopCardListThree';
import React from 'react';

export const generateRadiatorPDF = async ({ cards, results, asBlob = false }) => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', putOnlyUsedFonts: true });
  doc.setFont('DejaVuSans', 'normal');

  doc.setFontSize(18);
  doc.text('Калькулятор радиаторного отопления', 10, 20);

  const now = new Date();
  const dateStr = `Дата: ${now.toLocaleDateString()} | Время: ${now.toLocaleTimeString()}`;
  doc.setFontSize(10);
  doc.text(dateStr, 10, 28);

  doc.setDrawColor(180);
  doc.line(10, 32, 200, 32);

  const startY = 38;
  const rowHeight = 8;
  const colWidths = [10, 33, 15, 15, 15, 20, 20, 17, 40];
  const headers = ['#', 'Название', 'Вт', 'мм', 'м', 'л/мин', 'кПа', 'м/с', 'Режим'];
  let y = startY;
  let x = 10;

  doc.setFontSize(9);
  headers.forEach((text, i) => {
    doc.rect(x, y, colWidths[i], rowHeight);
    doc.text(text, x + 2, y + 6);
    x += colWidths[i];
  });

  y += rowHeight;

  cards.forEach((card, index) => {
    const r = results[index];
    const row = [
      String(index + 1),
      card.name || `Радиатор ${index + 1}`,
      r.power || '-',
      card.innerDiameter || '-',
      card.supplyLength || '-',
      r.flow?.toFixed(2) || '-',
      r.resistance?.toFixed(2) || '-',
      r.velocity?.toFixed(2) || '-',
      r.regime || '—'
    ];
    x = 10;
    row.forEach((text, i) => {
      doc.rect(x, y, colWidths[i], rowHeight);
      doc.text(String(text), x + 2, y + 6);
      x += colWidths[i];
    });
    y += rowHeight;

    if (y + rowHeight + 45 > doc.internal.pageSize.getHeight()) {
      doc.addPage();
      y = 20;
    }
  });

  const chartElement = React.createElement(FlowRateChartCard, { data: results });
  const chartImg = await renderChartToImage(chartElement, 700, 350);

  if (y + 110 > doc.internal.pageSize.getHeight()) {
    doc.addPage();
    y = 20;
  }


  y += 5;
  if (chartImg && chartImg.length > 1000) {
    doc.addImage({
      imageData: chartImg,
      format: 'PNG',
      x: 7,
      y: y,
      width: 195,
      height: 100
    });
    y += 105;
  } else {
    doc.setFontSize(10);
    doc.text('Не удалось отобразить график.', 105, y + 10, { align: 'center' });
    y += 20;
  }

  // Карточки
  const cardWidth = 90;
  const cardHeight = 35;
  const gap = 10;
  const startX = 10;

  for (let i = 0; i < results.length; i++) {
    const isLeft = i % 2 === 0;
    const x = isLeft ? startX : startX + cardWidth + gap;
    const r = results[i];
    const name = cards[i].name || `Радиатор ${i + 1}`;

    if ((!isLeft && y + cardHeight > 280) || (isLeft && y + cardHeight > 280)) {
      doc.addPage();
      y = 20;
    }

    doc.setDrawColor(200);
    doc.setFillColor(243, 244, 246);
    doc.roundedRect(x, y, cardWidth, cardHeight, 5, 5, 'FD');

    const cx = x + cardWidth / 2;
    doc.setFontSize(9);
    doc.setTextColor(0);
    doc.text(name, cx, y + 7, { align: 'center' });
    doc.setFontSize(8);
    doc.text(`Мощность: ${r.power || '—'} Вт`, cx, y + 13, { align: 'center' });
    doc.text(`Расход: ${r.flow?.toFixed(2) || '—'} л/мин`, cx, y + 18, { align: 'center' });
    doc.text(`Сопр.: ${r.resistance?.toFixed(2) || '—'} кПа`, cx, y + 23, { align: 'center' });
    doc.text(`Скорость: ${r.velocity?.toFixed(2) || '—'} м/с`, cx, y + 28, { align: 'center' });
    doc.setFontSize(7);
    doc.setTextColor(100);
    doc.text(`${r.regime || '—'}`, cx, y + 33, { align: 'center' });

    if (!isLeft) y += cardHeight + 5;
  }

  doc.setFontSize(10);
  doc.setTextColor(0);
  doc.text('Сформировано на loop-calculator', 10, 290);

  if (asBlob) {
    return doc.output('blob');
  } else {
    return doc;
  }
};

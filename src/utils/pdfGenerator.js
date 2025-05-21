import { jsPDF } from 'jspdf';
import '../utils/DejaVuSans';
import { renderChartToImage } from './renderChartToImage';
import React from 'react';
import { FlowRateChartCard } from '../components/LoopCardList';
import { PumpCurveSmallCard } from '../components/LoopCardList';

const drawLoopTable = (doc, { cards, results }, startY) => {
  doc.setFont('DejaVuSans', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);

  const columns = [
    { title: "Петля", width: 26 },
    { title: "Длина", width: 14 },
    { title: "Подвод.", width: 18 },
    { title: "Ø", width: 10 },
    { title: "Шаг", width: 14 },
    { title: "Вт", width: 20 },
    { title: "л/мин", width: 20 },
    { title: "кПа", width: 20 },
    { title: "Режим", width: 55 }
  ];

  const rowHeight = 8;
  const tableX = 5;
  let y = startY;

  doc.setFont('DejaVuSans', 'normal');
  columns.reduce((x, col) => {
    doc.rect(x, y, col.width, rowHeight);
    doc.text(col.title, x + 2, y + 6);
    return x + col.width;
  }, tableX);

  y += rowHeight;
  doc.setFont('DejaVuSans', 'normal');

  cards.forEach((card, i) => {
    const r = results[i];
    const row = [
      card.name || `Петля ${i + 1}`,
      `${card.totalLength}`,
      `${card.supplyLength}`,
      `${card.innerDiameter}`,
      `${card.pipeStep}`,
      `${r.power}`,
      r.flowRate.toFixed(2),
      r.resistance.toFixed(2),
      r.regime
    ];

    let x = tableX;

    if (y + rowHeight > doc.internal.pageSize.getHeight() - 20) {
      doc.addPage();
      y = 10;
    }

    row.forEach((cell, idx) => {
      const col = columns[idx];
      doc.rect(x, y, col.width, rowHeight);

      const isNumeric = !isNaN(cell) && idx !== 0 && idx !== 8;
      const isRed = isNumeric && Number(cell) < 0;
      doc.setTextColor(isRed ? 255 : 0, 0, 0);

      doc.setFont('DejaVuSans', 'normal');

      const textX = isNumeric
        ? x + col.width - doc.getTextWidth(cell) - 2
        : x + 2;

      doc.text(String(cell), textX, y + 6);
      x += col.width;
    });

    y += rowHeight;
  });

  doc.setTextColor(0, 0, 0);
  return y;
};

export const generatePDF = async ({ deltaT, totalFlow, maxHead, cards, results, projectName, asBlob = false }) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    putOnlyUsedFonts: true,
  });

  doc.setFont('DejaVuSans', 'normal');
  doc.setFontSize(16);

  const line = (y) => {
    doc.setDrawColor(200);
    doc.line(5, y, 200, y);
  };

  let y = 10;
  const next = (dy = 7) => (y += dy);

  doc.text('КАЛЬКУЛЯТОР НАПОЛЬНОГО ОТОПЛЕНИЯ', 10, next());
  doc.setFontSize(10);

  if (projectName) {
    doc.setFontSize(14);
    doc.text(`Название проекта: ${projectName}`, 10, next());
  }

  const now = new Date();
  doc.text(`Дата: ${now.toLocaleDateString()} | Время: ${now.toLocaleTimeString()}`, 10, next());
  next(); line(next());

  doc.text(`ΔT: ${deltaT} °C`, 10, next());
  doc.text(`Суммарный расход: ${totalFlow.toFixed(3)} м³/ч`, 10, next());
  doc.text(`Макс. сопротивление: ${maxHead.toFixed(2)} м вод. ст.`, 10, next());

  next(); line(next());
  y = drawLoopTable(doc, { cards, results }, next(5));

  next(); line(next());
  doc.setFontSize(12);
  doc.text('Результаты по петлям', doc.internal.pageSize.getWidth() / 2, next(), { align: 'center' });
  doc.setFontSize(10);

  y += 5;

  const cardHeight = 35;
  const cardWidth = 90;
  const cardGapY = 5;
  const cardLeftX = 10;
  const cardGapX = 10;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  results.forEach((res, i) => {
    const isLeft = i % 2 === 0;
    const cardX = isLeft ? cardLeftX : cardLeftX + cardWidth + cardGapX;

    if (isLeft && y + cardHeight > pageHeight - 20) {
      doc.addPage();
      y = 10;
    } else if (!isLeft && y + cardHeight > pageHeight - 20) {
      doc.addPage();
      y = 10;
    }

    const name = cards[i].name || `Петля ${i + 1}`;
    const { power, flowRate, resistance, regime } = res;
    const isOutOfRange = resistance < 7.5 || resistance > 20;

    doc.setDrawColor(180);
    doc.setFillColor(243, 244, 246);
    doc.roundedRect(cardX, y, cardWidth, cardHeight, 7, 7, 'FD');

    if (isOutOfRange) {
      doc.setDrawColor(255, 0, 0);
      doc.setLineWidth(0.8);
      doc.roundedRect(cardX, y, cardWidth, cardHeight, 7, 7);
    }

    doc.setTextColor(0, 0, 0);
    const centerX = cardX + cardWidth / 2;

    doc.setFontSize(9);
    doc.setFont('DejaVuSans', 'normal');
    doc.text(name, centerX, y + 7, { align: 'center' });

    doc.setFontSize(8);
    doc.text(`Мощность: ${power} Вт`, centerX, y + 13, { align: 'center' });
    doc.text(`Расход: ${flowRate.toFixed(2)} л/мин`, centerX, y + 18, { align: 'center' });
    doc.text(`Сопротивление: ${resistance.toFixed(2)} кПа`, centerX, y + 23, { align: 'center' });

    doc.setFontSize(7);
    doc.setTextColor(100);
    doc.text(`Режим: ${regime}`, centerX, y + 28, { align: 'center' });

    if (!isLeft) {
      y += cardHeight + cardGapY;
    }
  });


  doc.addPage();
  y = 10;

  try {
    const grundfosCurve = {
      name: 'Grundfos UPS 25-60',
      data: [
        { flow: 0, head: 6 },
        { flow: 1, head: 5.5 },
        { flow: 2, head: 5 },
        { flow: 3, head: 4 },
        { flow: 4, head: 2.5 },
        { flow: 5, head: 1 },
        { flow: 6, head: 0 },
      ],
    };

    const pumpChartElement = React.createElement(PumpCurveSmallCard, {
      curve: grundfosCurve,
      operatingPoint: { flow: totalFlow, head: maxHead },
    });

    const flowChartElement = React.createElement(FlowRateChartCard, { data: results });

    const pumpChartImg = await renderChartToImage(pumpChartElement, 700, 350);
    const flowChartImg = await renderChartToImage(flowChartElement, 700, 350);

    const chartWidth = 195;
    const chartHeight = 100;
    const chartGap = 10;
    const chartStartY = y + 15;
    const chartX = (pageWidth - chartWidth) / 2;

    doc.setFontSize(12);
    doc.text('Кривая насоса', pageWidth / 2, chartStartY - 5, { align: 'center' });
    doc.setFontSize(10);

    if (pumpChartImg && pumpChartImg.length > 1000) {
      doc.addImage({
        imageData: pumpChartImg,
        format: 'PNG',
        x: chartX,
        y: chartStartY,
        width: chartWidth,
        height: chartHeight,
        compression: 'NONE',
      });
    } else {
      doc.text('Не удалось сгенерировать кривую насоса', pageWidth / 2, chartStartY + 10, { align: 'center' });
    }

    const secondChartY = chartStartY + chartHeight + chartGap;
    doc.setFontSize(12);
    doc.text('График расходов', pageWidth / 2, secondChartY - 5, { align: 'center' });
    doc.setFontSize(10);

    if (flowChartImg && flowChartImg.length > 1000) {
      doc.addImage({
        imageData: flowChartImg,
        format: 'PNG',
        x: chartX,
        y: secondChartY,
        width: chartWidth,
        height: chartHeight,
        compression: 'NONE',
      });
    } else {
      doc.text('Не удалось сгенерировать график расходов', pageWidth / 2, secondChartY + 10, { align: 'center' });
    }
  } catch (error) {
    doc.text('Ошибка при добавлении графиков: ' + error.message, 10, y + 15);
  }

  doc.setFontSize(10);
  doc.setFont('DejaVuSans', 'normal');
  doc.text('Сформировано на loop-calculator', 10, doc.internal.pageSize.getHeight() - 10);
  if (asBlob) {
    const blob = doc.output('blob');
    return {
      blob,
      filename: `report-${Date.now()}.pdf`,
    };
  } else {
    return doc; 
  }
  
  
};
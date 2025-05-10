import React from 'react';
import ReactDOM from 'react-dom';
import html2canvas from 'html2canvas';

export const renderChartToImage = async (ChartComponent, width = 600, height = 300) => {
  const container = document.createElement('div');
  container.style.width = `${width}px`;
  container.style.height = `${height}px`;
  container.style.position = 'absolute';
  container.style.top = '-10000px';
  container.style.left = '-10000px';
  container.style.background = 'white';
  container.style.zIndex = '-1';
  container.style.display = 'flex';
  container.style.justifyContent = 'center';
  container.style.alignItems = 'center';
  container.style.padding = '0';
  container.style.margin = '0';
  container.style.overflow = 'hidden';
  

  document.body.appendChild(container);

  return new Promise((resolve) => {
    ReactDOM.render(ChartComponent, container);

    setTimeout(async () => {
      try {
        const canvas = await html2canvas(container, {
          logging: false,
          useCORS: true,
          scale: 2,
        });

        const dataURL = canvas.toDataURL('image/png');
        document.body.removeChild(container);
        resolve(dataURL);
      } catch (error) {
        console.error('Ошибка при создании изображения графика:', error);
        document.body.removeChild(container);
        resolve(null);
      }
    }, 500); 
  });
};

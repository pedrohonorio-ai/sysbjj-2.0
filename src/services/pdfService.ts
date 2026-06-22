
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

export interface ReceiptData {
  id: string;
  date: string;
  studentName: string;
  description: string;
  amount: number;
  paymentMethod: string;
  academyName: string;
  professorName: string;
}

export const generateReceiptPdf = (data: ReceiptData) => {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(22);
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text(data.academyName.toUpperCase(), 105, 20, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139); // slate-500
  doc.text('COMPROVANTE DE PAGAMENTO / RECEIPT', 105, 28, { align: 'center' });
  
  // Divider
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.line(20, 35, 190, 35);
  
  // Body
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  
  const startY = 45;
  const lineHeight = 10;
  
  doc.setFont('helvetica', 'bold');
  doc.text('ID Transação:', 20, startY);
  doc.setFont('helvetica', 'normal');
  doc.text(data.id, 60, startY);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Data:', 20, startY + lineHeight);
  doc.setFont('helvetica', 'normal');
  doc.text(data.date, 60, startY + lineHeight);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Aluno:', 20, startY + lineHeight * 2);
  doc.setFont('helvetica', 'normal');
  doc.text(data.studentName, 60, startY + lineHeight * 2);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Descrição:', 20, startY + lineHeight * 3);
  doc.setFont('helvetica', 'normal');
  doc.text(data.description, 60, startY + lineHeight * 3);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Valor:', 20, startY + lineHeight * 4);
  doc.setFont('helvetica', 'normal');
  doc.text(`R$ ${data.amount.toFixed(2)}`, 60, startY + lineHeight * 4);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Método:', 20, startY + lineHeight * 5);
  doc.setFont('helvetica', 'normal');
  doc.text(data.paymentMethod, 60, startY + lineHeight * 5);
  
  // Footer
  doc.setDrawColor(226, 232, 240);
  doc.line(20, 110, 190, 110);
  
  doc.setFontSize(10);
  doc.text('Assinado digitalmente pelo Sistema SYSBJJ 2.0', 105, 120, { align: 'center' });
  doc.text(`Professor Responsável: ${data.professorName}`, 105, 126, { align: 'center' });
  
  // Integrity Hash (Simulated)
  const hash = btoa(`${data.id}-${data.amount}-${data.date}`).slice(0, 32);
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text(`Hash de Integridade: ${hash}`, 105, 135, { align: 'center' });
  
  doc.save(`recibo_${data.id}.pdf`);
};

export const generateFinancialReportPdf = (title: string, data: any[], academyName: string) => {
  const doc = new jsPDF();
  
  doc.setFontSize(20);
  doc.text(academyName.toUpperCase(), 105, 15, { align: 'center' });
  doc.setFontSize(14);
  doc.text(title, 105, 25, { align: 'center' });
  
  const headers = [['Data', 'Descrição', 'Aluno', 'Valor', 'Status']];
  const body = data.map(item => [
    item.date,
    item.description || item.name,
    item.studentName || item.name,
    `R$ ${item.amount.toFixed(2)}`,
    item.paid || item.status === 'Confirmed' ? 'Pago' : 'Pendente'
  ]);
  
  (doc as any).autoTable({
    head: headers,
    body: body,
    startY: 35,
    theme: 'grid',
    headStyles: { fillStyle: [15, 23, 42] }
  });
  
  doc.save(`relatorio_financeiro_${new Date().toISOString().split('T')[0]}.pdf`);
};

export interface RaffleDocData {
  id: string;
  name: string;
  descriptionText: string;
  ticketPrice: number;
  totalNumbers: number;
  winnerNumber: number | null;
  winnerStudentName: string | null;
  tickets: Record<string, { studentId: string; studentName: string; soldAt: string; phone?: string }>;
  academyName: string;
}

export const generateRafflePdf = (data: RaffleDocData) => {
  const doc = new jsPDF();
  
  // Left border / stub cut line
  doc.setDrawColor(186, 203, 222);
  doc.setLineDashPattern([2, 2], 0);
  doc.line(55, 10, 55, 287);
  doc.setLineDashPattern([], 0); // Reset dash

  // Draw Left Stub Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('CANHOTO OFICIAL', 32.5, 15, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text(data.academyName.toUpperCase(), 32.5, 21, { align: 'center' });
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text(`ID: ${data.id.slice(0, 8).toUpperCase()}`, 32.5, 26, { align: 'center' });

  // Divider line inside stub
  doc.setDrawColor(226, 232, 240);
  doc.line(10, 30, 50, 30);

  // Stub information
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  
  doc.text('CAMPANHA:', 10, 35);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  const splitCampanha = doc.splitTextToSize(data.name, 40);
  doc.text(splitCampanha, 10, 39);

  const campanhaHeight = splitCampanha.length * 4;
  let nextY = 39 + campanhaHeight + 2;

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 116, 139);
  doc.text('VALOR UNITÁRIO:', 10, nextY);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(16, 185, 129); // emerald-500
  doc.text(`R$ ${data.ticketPrice.toFixed(2)}`, 10, nextY + 4);

  nextY += 9;

  const soldCount = Object.keys(data.tickets).length;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 116, 139);
  doc.text('COTAS ADQUIRIDAS:', 10, nextY);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(29, 78, 216); // blue-700
  doc.text(`${soldCount} / ${data.totalNumbers}`, 10, nextY + 4);

  nextY += 9;

  doc.setDrawColor(226, 232, 240);
  doc.line(10, nextY, 50, nextY);

  nextY += 5;

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 116, 139);
  doc.text('RELAÇÃO DE COMPRADORES:', 10, nextY);
  
  nextY += 5;

  // Render text list of buyers inside left stub (limit length to fit the page)
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(71, 85, 105);

  const sortedNumbers = Object.keys(data.tickets).sort((a,b) => parseInt(a) - parseInt(b));
  let itemsRendered = 0;
  
  if (sortedNumbers.length === 0) {
    doc.text('Rifa livre (sem reservas).', 10, nextY);
  } else {
    for (let i = 0; i < sortedNumbers.length; i++) {
      if (nextY > 260) {
        doc.setFont('helvetica', 'bold');
        doc.text(`+ ${sortedNumbers.length - itemsRendered} reservas...`, 10, nextY);
        break;
      }
      const numStr = sortedNumbers[i];
      const buyer = data.tickets[numStr];
      const isExternal = buyer.studentId === 'external';
      const label = isExternal ? '👤' : '🥋';
      
      let textLine = `Nº ${numStr}: ${buyer.studentName.split(' ')[0]} ${label}`;
      if (buyer.phone) {
        textLine += ` (${buyer.phone})`;
      }
      
      const splitTextLine = doc.splitTextToSize(textLine, 40);
      doc.text(splitTextLine, 10, nextY);
      nextY += (splitTextLine.length * 3.5);
      itemsRendered++;
    }
  }

  // Draw seal on left stub
  doc.setDrawColor(239, 68, 68); // Red
  doc.setTextColor(239, 68, 68);
  doc.rect(13, 271, 34, 14, 'S');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6);
  doc.text('VALIDADO COMPROVANTE', 30, 275, { align: 'center' });
  doc.setFontSize(8);
  doc.text('SYSBJJ 2.0', 30, 281, { align: 'center' });
  doc.setFontSize(5);
  doc.text('Controle Interno Oficial', 30, 284, { align: 'center' });

  // ——————————————————————————————————————————————————
  // MAIN RAFFLE PORTION (RIGHT COLUMN)
  // ——————————————————————————————————————————————————
  const startR = 60; // Right panel left margin
  const widthR = 140; // Right panel width

  // Category Tag
  doc.setFillColor(37, 99, 235); // Blue-600
  doc.rect(startR, 12, 38, 5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(255, 255, 255);
  doc.text('CAMPANHA COOPERATIVA DO TATAME', startR + 19, 15.5, { align: 'center' });

  // Value Tag / Price Badge on Right Top
  doc.setFillColor(240, 253, 250); // teal-50
  doc.rect(startR + 105, 12, 35, 15, 'F');
  doc.setDrawColor(153, 246, 228); // teal-200
  doc.rect(startR + 105, 12, 35, 15, 'S');
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(13, 148, 136); // teal-600
  doc.text('VALOR UNITÁRIO', startR + 122.5, 17, { align: 'center' });
  doc.setFontSize(11);
  doc.text(`R$ ${data.ticketPrice.toFixed(2)}`, startR + 122.5, 23, { align: 'center' });

  // Main Title (Name of Raffle prize)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42); // slate-900
  const splitTitle = doc.splitTextToSize(data.name.toUpperCase(), 100);
  doc.text(splitTitle, startR, 24);

  let rightY = 24 + (splitTitle.length * 5.5) + 2;

  // Description block
  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(226, 232, 240); // slate-200
  const descRawText = data.descriptionText || 'Arrecadação de auxílio esportivo coletivo.';
  const splitDesc = doc.splitTextToSize(descRawText, 136);
  const descBoxHeight = (splitDesc.length * 4) + 6;
  
  doc.rect(startR, rightY, 140, descBoxHeight, 'F');
  doc.rect(startR, rightY, 140, descBoxHeight, 'S');
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139); // slate-500
  doc.text(splitDesc, startR + 3, rightY + 4.5);

  rightY += descBoxHeight + 6;

  // Winner info if drawn
  if (data.winnerNumber !== null) {
    doc.setFillColor(209, 250, 229); // emerald-100
    doc.setDrawColor(16, 185, 129);  // emerald-500
    doc.rect(startR, rightY, 140, 11, 'F');
    doc.rect(startR, rightY, 140, 11, 'S');
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(6, 95, 70); // emerald-800
    const winnerLabel = `🎉 NÚMERO CONTEMPLADO: Nº ${data.winnerNumber.toString().padStart(2, '0')} - GANHADOR: ${data.winnerStudentName || 'Sem identificação'}`;
    doc.text(winnerLabel, startR + 4, rightY + 7);
    rightY += 16;
  }

  // Grid title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text('MAPA DE DISPONIBILIDADE DA CARTELA', startR, rightY);
  
  rightY += 4;

  // Draw the actual grid. Set up size parameters
  const total = data.totalNumbers;
  const cols = total <= 25 ? 5 : 10;
  const cellWidth = cols === 5 ? 26 : 12.5;
  const cellHeight = 9.5;
  const gap = 1.6;

  doc.setFontSize(7.5);

  for (let i = 0; i < total; i++) {
    const row = Math.floor(i / cols);
    const col = i % cols;
    const xCell = startR + col * (cellWidth + gap);
    const yCell = rightY + row * (cellHeight + gap);

    const numStr = (i + 1).toString().padStart(2, '0');
    const buyer = data.tickets[numStr];
    const isSold = !!buyer;
    const isWinner = data.winnerNumber === (i + 1);

    if (isWinner) {
      doc.setFillColor(16, 185, 129); // emerald-500
      doc.setDrawColor(4, 120, 87);
      doc.rect(xCell, yCell, cellWidth, cellHeight, 'F');
      doc.rect(xCell, yCell, cellWidth, cellHeight, 'S');
      
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.text(numStr, xCell + (cellWidth / 2), yCell + 4, { align: 'center' });
      doc.setFontSize(5.5);
      doc.text('GANHOU!', xCell + (cellWidth / 2), yCell + 7.5, { align: 'center' });
    } else if (isSold) {
      const isExternal = buyer.studentId === 'external';
      if (isExternal) {
        doc.setFillColor(240, 253, 250); // teal-50
        doc.setDrawColor(153, 246, 228); // teal-200
        doc.rect(xCell, yCell, cellWidth, cellHeight, 'F');
        doc.rect(xCell, yCell, cellWidth, cellHeight, 'S');
        doc.setTextColor(15, 118, 110); // teal-700
      } else {
        doc.setFillColor(239, 246, 255); // blue-50
        doc.setDrawColor(191, 219, 254); // blue-200
        doc.rect(xCell, yCell, cellWidth, cellHeight, 'F');
        doc.rect(xCell, yCell, cellWidth, cellHeight, 'S');
        doc.setTextColor(29, 78, 216); // blue-700
      }
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.text(numStr, xCell + (cellWidth / 2), yCell + 4, { align: 'center' });
      
      // First name
      const firstName = buyer.studentName.split(' ')[0].slice(0, 7);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(5.5);
      doc.text(firstName.toUpperCase(), xCell + (cellWidth / 2), yCell + 7.5, { align: 'center' });
    } else {
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(226, 232, 240); // slate-200
      doc.rect(xCell, yCell, cellWidth, cellHeight, 'F');
      doc.rect(xCell, yCell, cellWidth, cellHeight, 'S');
      
      doc.setTextColor(148, 163, 184); // slate-400
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.text(numStr, xCell + (cellWidth / 2), yCell + 4, { align: 'center' });
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(5.5);
      doc.text('LIVRE', xCell + (cellWidth / 2), yCell + 7.5, { align: 'center' });
    }
  }

  // Draw Bottom Regulation
  const totalRows = Math.ceil(total / cols);
  const bottomRegulationY = rightY + (totalRows * (cellHeight + gap)) + 12;

  doc.setDrawColor(226, 232, 240);
  doc.line(startR, bottomRegulationY - 4, startR + widthR, bottomRegulationY - 4);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(71, 85, 105); // slate-600
  doc.text('REGULAMENTO OFICIAL DO TATAME', startR, bottomRegulationY);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(115, 115, 115); // neutro-400
  const regulationText = 'O sorteio será efetuado pelo Sensei de forma 100% digital e transparente, eliminando cotas sem proprietário para que o prêmio seja entregue com integridade. Todo o valor arrecadado é transferido integralmente para financiar despesas de viagem de atletas, taxas de competição ou melhorias operacionais no dojo. OSS!';
  const splitRegulation = doc.splitTextToSize(regulationText, 140);
  doc.text(splitRegulation, startR, bottomRegulationY + 3.5);

  // Clean Footer
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6);
  doc.setTextColor(148, 163, 184);
  doc.text('DOCUMENTO ADQUIRIDO VIA INFRAESTRUTURA DIGITAL DO DOJO SYSBJJ 2.0', startR + 70, 285, { align: 'center' });

  // Save the document
  const fileNameNormalized = data.name.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 20);
  doc.save(`cartela_rifa_${fileNameNormalized}.pdf`);
};


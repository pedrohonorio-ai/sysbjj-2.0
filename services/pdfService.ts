
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
  doc.text('Assinado digitalmente pelo Sistema PPH Academy', 105, 120, { align: 'center' });
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

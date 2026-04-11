import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

export function exportToPDF(timetable, viewMode = 'class') {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(`Smart Timetable - ${timetable.name}`, 14, 15);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`${timetable.department || ''} | ${timetable.semester || ''} | ${timetable.academicYear || ''}`, 14, 22);
  doc.text(`View: ${viewMode.charAt(0).toUpperCase() + viewMode.slice(1)}-wise`, 14, 28);

  const days = timetable.workingDays || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const slots = timetable.timeSlots || [];

  const head = [['Time / Day', ...days]];
  const body = slots.map(slot => {
    const row = [slot];
    days.forEach(day => {
      const assignment = timetable.slots?.find(s => s.day === day && s.timeSlot === slot);
      if (!assignment) { row.push('Free'); return; }
      if (assignment.isBreak) { row.push('BREAK'); return; }
      const subName = assignment.subject?.name || '-';
      const facName = assignment.faculty?.name || '';
      const room = assignment.classroom?.roomNumber || '';
      row.push(`${subName}\n${facName}\n${room}`);
    });
    return row;
  });

  autoTable(doc, {
    head,
    body,
    startY: 34,
    styles: { fontSize: 7, cellPadding: 2, valign: 'middle', halign: 'center' },
    headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: { 0: { fillColor: [241, 245, 249], fontStyle: 'bold', halign: 'center' } },
    didParseCell: (data) => {
      if (data.cell.raw === 'BREAK') {
        data.cell.styles.fillColor = [254, 243, 199];
        data.cell.styles.textColor = [146, 64, 14];
        data.cell.styles.fontStyle = 'bold';
      }
    }
  });

  doc.save(`timetable_${timetable.name.replace(/\s+/g, '_')}.pdf`);
}

export function exportToExcel(timetable) {
  const days = timetable.workingDays || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const slots = timetable.timeSlots || [];

  const wsData = [
    [`Timetable: ${timetable.name}`],
    [`Department: ${timetable.department || 'N/A'} | Semester: ${timetable.semester || 'N/A'}`],
    [],
    ['Time / Day', ...days],
  ];

  slots.forEach(slot => {
    const row = [slot];
    days.forEach(day => {
      const assignment = timetable.slots?.find(s => s.day === day && s.timeSlot === slot);
      if (!assignment) { row.push('Free'); return; }
      if (assignment.isBreak) { row.push('LUNCH BREAK'); return; }
      const parts = [
        assignment.subject?.name || '-',
        assignment.faculty?.name || '',
        assignment.classroom?.roomNumber || ''
      ].filter(Boolean);
      row.push(parts.join(' | '));
    });
    wsData.push(row);
  });

  const ws = XLSX.utils.aoa_to_sheet(wsData);
  ws['!cols'] = [{ wch: 22 }, ...days.map(() => ({ wch: 28 }))];

  // Faculty view sheet
  const facultyData = [['Faculty', 'Day', 'Time Slot', 'Subject', 'Room']];
  timetable.slots?.filter(s => !s.isBreak && s.faculty).forEach(s => {
    facultyData.push([
      s.faculty?.name || '',
      s.day,
      s.timeSlot,
      s.subject?.name || '',
      s.classroom?.roomNumber || ''
    ]);
  });
  const ws2 = XLSX.utils.aoa_to_sheet(facultyData);
  ws2['!cols'] = [{ wch: 24 }, { wch: 14 }, { wch: 22 }, { wch: 24 }, { wch: 10 }];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Timetable');
  XLSX.utils.book_append_sheet(wb, ws2, 'Faculty View');
  XLSX.writeFile(wb, `timetable_${timetable.name.replace(/\s+/g, '_')}.xlsx`);
}

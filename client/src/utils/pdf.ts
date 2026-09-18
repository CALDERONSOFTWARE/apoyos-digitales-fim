import jsPDF from 'jspdf';
import QRCode from 'qrcode';
import type { Submission } from '../types';

async function buildReceipt(sub: Submission) {
  const doc = new jsPDF();
  let y = 18;

  doc.setFontSize(15);
  doc.text('Facultad de Ingeniería Mochis', 20, y);

  y += 8;

  doc.setFontSize(12);
  doc.text('COMPROBANTE DE REGISTRO', 20, y);

  y += 10;

  const rows = [
    ['Folio', sub.folio],
    ['Formulario', sub.forms?.title ?? ''],
    [
      'Usuario',
      sub.profiles?.full_name ??
        sub.profiles?.email ??
        ''
    ],
    [
      'Fecha',
      new Date(sub.submitted_at).toLocaleString('es-MX')
    ],
    ['Estado', sub.status],
    ['Validación', sub.validation_status],
    [
      'Generado',
      new Date().toLocaleString('es-MX')
    ]
  ];

  for (const [r, v] of rows) {
    doc.setFont('helvetica', 'bold');
    doc.text(`${r}:`, 20, y);

    doc.setFont('helvetica', 'normal');
    doc.text(String(v ?? ''), 55, y);

    y += 7;
  }

  y += 4;

  doc.setFont('helvetica', 'bold');
  doc.text('Resumen de respuestas', 20, y);

  y += 7;

  doc.setFont('helvetica', 'normal');

  for (const a of sub.submission_answers ?? []) {
    const label =
      a.form_fields?.label ?? a.field_id;

    if (
      a.form_fields?.type === 'signature' &&
      a.value?.preview
    ) {
      try {
        const blob = await fetch(
          a.value.preview
        ).then(r => r.blob());

        const data = await new Promise<string>(
          (resolve, reject) => {
            const fr = new FileReader();

            fr.onload = () =>
              resolve(String(fr.result));

            fr.onerror = reject;

            fr.readAsDataURL(blob);
          }
        );

        if (y + 38 > 270) {
          doc.addPage();
          y = 20;
        }

        doc.text(`${label}:`, 20, y);

        doc.addImage(
          data,
          'PNG',
          55,
          y - 5,
          55,
          24
        );

        y += 30;

        continue;
      } catch {
        // Si no se puede cargar la firma,
        // el comprobante continúa generándose.
      }
    }

    const raw =
      typeof a.value === 'object'
        ? JSON.stringify(a.value)
        : String(a.value ?? '');

    const lines = doc.splitTextToSize(
      `${label}: ${raw}`,
      170
    );

    if (y + lines.length * 6 > 270) {
      doc.addPage();
      y = 20;
    }

    doc.text(lines, 20, y);

    y += lines.length * 6 + 2;
  }

  const qr = await QRCode.toDataURL(
    String(sub.folio ?? '')
  );

  doc.addImage(
    qr,
    'PNG',
    155,
    15,
    35,
    35
  );

  doc.rect(
    135,
    250,
    55,
    22
  );

  doc.setFontSize(8);

  doc.text(
    'Espacio para sello institucional',
    140,
    262
  );

  return doc;
}

export async function downloadReceipt(
  sub: Submission
) {
  const doc = await buildReceipt(sub);

  doc.save(`${sub.folio}.pdf`);
}

export async function previewReceipt(
  sub: Submission
) {
  const doc = await buildReceipt(sub);

  window.open(
    doc.output('bloburl'),
    '_blank',
    'noopener,noreferrer'
  );
}

export async function printReceipt(
  sub: Submission
) {
  const doc = await buildReceipt(sub);

  const url = doc.output('bloburl');

  const w = window.open(
    url,
    '_blank'
  );

  if (w) {
    w.addEventListener(
      'load',
      () => w.print()
    );
  }
}
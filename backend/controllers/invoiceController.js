import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import Request from '../models/Request.js';

export const downloadInvoice = async (req, res) => {
  try {
    const { requestId } = req.query;
    console.log('[INVOICE] Download requested for requestId:', requestId);

    if (!requestId) {
      console.error('[INVOICE] No requestId provided');
      return res.status(400).send('Missing requestId');
    }

    const request = await Request.findById(requestId)
      .populate('service')
      .populate('user')
      .populate({
        path: 'comments.author', // If you want author details in comments
        select: 'name email'
      });

    if (!request) {
      console.error('[INVOICE] Request not found for id:', requestId);
      return res.status(404).send('Request not found');
    }
    console.log('[INVOICE] Found request:', JSON.stringify({
      id: request._id,
      user: request.user?.email,
      service: request.service?.title,
      details: request.details,
      formSchema: request.service?.formSchema
    }, null, 2));

    // Headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=invoice-${requestId}.pdf`
    );

    const doc = new PDFDocument({ margin: 0, size: 'A4' });
    doc.pipe(res);

    // ================= HEADER (HERO STYLE) =================
    doc.rect(0, 0, doc.page.width, 140).fill('#1e3a8a');
    doc.rect(0, 0, doc.page.width, 140).fillOpacity(0.2).fill('#3b82f6').fillOpacity(1);

    const logoPath = path.resolve('backend/assets/logo.png');
    if (fs.existsSync(logoPath)) {
      doc.image(logoPath, 40, 40, { width: 40 });
    }

    doc.fillColor('#ffffff').fontSize(18).text('TaxEasePro', 90, 45);

    doc
      .fontSize(10)
      .fillColor('#c7d2fe')
      .text('Simplify Your Taxes & Business Compliance', 90, 65);

    doc
      .fontSize(20)
      .fillColor('#ffffff')
      .text('INVOICE', 400, 50);

    // ================= MAIN CARD =================
    const cardTop = 120;
    doc.roundedRect(30, cardTop, 535, 650, 12).fill('#ffffff');

    // ================= INVOICE INFO =================
    // Generate request code as in frontend
    const reqCode = `REQ-${String(request._id).slice(-6).toUpperCase()}`;
    doc
      .fillColor('#1e293b')
      .fontSize(10)
      .text(
        `Invoice #: ${reqCode}`,
        50,
        cardTop + 20
      );

    doc.text(
      `Date: ${request.createdAt ? new Date(request.createdAt).toLocaleString() : '-'}`,
      400,
      cardTop + 20
    );

    // ================= CLIENT & SERVICE =================
    const sectionY = cardTop + 50;

    // Left Card (Client)
    doc.roundedRect(50, sectionY, 220, 100, 10).fill('#f8fafc');
    doc.fillColor('#1e293b').font('Helvetica-Bold')
      .text('Billed To', 60, sectionY + 10);
    doc.font('Helvetica').fillColor('#334155')
      .text(request.user?.name || '-', 60, sectionY + 30)
      .text(request.user?.email || '-');
    // Phone is in details, fallback to user.phone
    const clientPhone = request.details?.phone || request.user?.phone || '-';
    doc.text(clientPhone);

    // Right Card (Service)
    doc.roundedRect(300, sectionY, 220, 100, 10).fill('#f8fafc');
    doc.fillColor('#1e293b').font('Helvetica-Bold')
      .text('Service Details', 310, sectionY + 10);
    doc.font('Helvetica').fillColor('#334155')
      .text(`Title: ${request.service?.title || '-'}`, 310, sectionY + 30)
      .text(`Category: ${request.service?.category || '-'}`)
      .text(`Amount: ₹${Number(request.service?.price || 0).toLocaleString('en-IN')}`)
      .text(`Details: ${request.service?.details || '-'}`);

    // ================= PAYMENT =================
    const paymentY = sectionY + 140;
    doc.roundedRect(50, paymentY, 470, 80, 10).fill('#eff6ff');
    doc.fillColor('#1e40af').font('Helvetica-Bold')
      .text('Payment Info', 60, paymentY + 10);
    doc.font('Helvetica').fillColor('#1e293b')
      .text(`Method: ${request.payment?.method ? request.payment.method.toUpperCase() : '-'}`, 60, paymentY + 35)
      .text(
        `Paid On: ${request.payment?.paidAt ? new Date(request.payment.paidAt).toLocaleString() : '-'}`,
        250,
        paymentY + 35
      );

    // ================= STATUS =================
    const statusY = paymentY + 110;
    doc.roundedRect(50, statusY, 120, 30, 15).fill('#22c55e');
    doc.fillColor('#ffffff')
      .fontSize(10)
      .text((request.status || 'pending').toUpperCase(), 65, statusY + 9);


    // ================= DETAILS SECTION =================
    let infoY = statusY + 60;
    doc.fillColor('#1e293b').font('Helvetica-Bold')
      .text('Details', 50, infoY);

    doc.moveDown(0.5).font('Helvetica').fillColor('#475569');

    // --- DYNAMIC FORM FIELDS (from request.details & service.formSchema) ---
    const formSchema = request.service?.formSchema;
    const details = request.details || {};
    let fieldY = infoY + 20;
    if (formSchema && Array.isArray(formSchema.fields)) {
      formSchema.fields.forEach((field, idx) => {
        const value = details[field.name];
        let displayValue = value;
        if (field.type === 'file' && value && typeof value === 'string') {
          displayValue = '[File Uploaded]';
        }
        if (displayValue === undefined || displayValue === null || displayValue === '') return;
        doc.font('Helvetica-Bold').fillColor('#1e293b').text(`${field.label}:`, 60, fieldY);
        doc.font('Helvetica').fillColor('#475569').text(`${displayValue}`, 200, fieldY);
        fieldY += 18;
      });
    } else {
      // fallback: print all details
      Object.entries(details).forEach(([key, value], idx) => {
        if (value === undefined || value === null || value === '') return;
        doc.font('Helvetica-Bold').fillColor('#1e293b').text(`${key}:`, 60, fieldY);
        doc.font('Helvetica').fillColor('#475569').text(`${value}`, 200, fieldY);
        fieldY += 18;
      });
    }

    // Comments
    if (request.comments?.length) {
      doc.moveDown(0.5);
      doc.font('Helvetica-Bold').fillColor('#1e293b').text('Comments:', 50);
      doc.font('Helvetica').fillColor('#475569');
      request.comments.forEach((c, i) => {
        doc.text(
          `${i + 1}. ${c.text}\n   By: ${c.author?.name || 'User'} | ${c.author?.email || ''} | ${c.createdAt ? new Date(c.createdAt).toLocaleString() : '-'}`
        );
      });
    }

    // Timeline
    if (request.statusTimeline?.length) {
      doc.moveDown(0.5);
      doc.font('Helvetica-Bold').fillColor('#1e293b').text('Timeline:', 50);
      doc.font('Helvetica').fillColor('#475569');
      request.statusTimeline.forEach((t, i) => {
        doc.text(
          `${i + 1}. ${t.status} | ${t.createdAt ? new Date(t.createdAt).toLocaleDateString() : '-'}${t.by ? ' | By: ' + t.by : ''}${t.note ? ' | Note: ' + t.note : ''}`
        );
      });
    }

    // ================= DOCUMENT PAGES =================
    const requestedDocuments = Array.isArray(request.documents) ? request.documents : [];
    const normalizeDocEntry = (docEntry) => {
      if (!docEntry) return null;
      if (typeof docEntry === 'string') {
        const url = docEntry.trim();
        return {
          url,
          name: url ? url.split('/').pop() || 'Document' : 'Document',
        };
      }
      if (typeof docEntry === 'object' && docEntry !== null) {
        const url = String(docEntry.url || '').trim();
        const name = String(docEntry.name || '').trim()
          || (url ? url.split('/').pop() : '')
          || 'Document';
        return { url, name };
      }
      return null;
    };

    for (const documentEntry of requestedDocuments) {
      const documentItem = normalizeDocEntry(documentEntry);
      if (!documentItem || (!documentItem.url && !documentItem.name)) {
        continue;
      }

      const docUrl = documentItem.url;
      const docName = documentItem.name || 'Document';
      const isImage = docUrl && /\.(jpe?g|png|gif|webp|bmp|tiff)$/i.test(docUrl.split('?')[0]);

      doc.addPage({ size: 'A4', margin: 50 });
      doc.fillColor('#1e293b').font('Helvetica-Bold').fontSize(16).text(`Document: ${docName}`, 50, 60);
      doc.moveDown(1);

      if (docUrl && isImage) {
        try {
          const response = await fetch(docUrl);
          if (response.ok) {
            const buffer = Buffer.from(await response.arrayBuffer());
            doc.image(buffer, {
              fit: [500, 700],
              align: 'center',
              valign: 'center',
            });
          } else {
            doc.fillColor('#475569').font('Helvetica').fontSize(12)
              .text('Unable to fetch document image. Please download it from the link below.', {
                width: 500,
              });
            doc.moveDown(1);
            doc.fillColor('#2563eb').text(docUrl, {
              link: docUrl,
              underline: true,
            });
          }
        } catch (error) {
          doc.fillColor('#475569').font('Helvetica').fontSize(12)
            .text('Could not embed this document. Please use the download link below.', {
              width: 500,
            });
          doc.moveDown(1);
          doc.fillColor('#2563eb').text(docUrl, {
            link: docUrl,
            underline: true,
          });
        }
      } else if (docUrl) {
        doc.font('Helvetica').fillColor('#475569').fontSize(12)
          .text('This document cannot be embedded directly in the invoice PDF.', {
            width: 500,
          });
        doc.moveDown(1);
        doc.fillColor('#2563eb').text(docUrl, {
          link: docUrl,
          underline: true,
        });
      } else {
        doc.font('Helvetica').fillColor('#475569').fontSize(12)
          .text('This document does not have an accessible URL. Please contact support or the admin to obtain it.', {
            width: 500,
          });
      }
    }

    // ================= FOOTER =================
    const footerY = doc.page.height - 80;
    doc.rect(0, footerY, doc.page.width, 80).fill('#0f172a');
    doc.fillColor('#cbd5f5')
      .fontSize(10)
      .text('© 2026 TaxEasePro. All rights reserved.', 40, footerY + 25);
    doc.text('www.taxeasepro.in', 400, footerY + 25);

    doc.end();
  } catch (err) {
    console.error('[INVOICE] Error generating invoice:', err && err.stack ? err.stack : err);
    res.status(500).send('Failed to generate invoice');
  }
};
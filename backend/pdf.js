const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

class PDFGenerator {
  generatePrescription(prescriptionData) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50 });
        const filename = `prescription_${prescriptionData.id}.pdf`;
        const filePath = path.join(__dirname, '../temp', filename);
        
        const stream = fs.createWriteStream(filePath);
        doc.pipe(stream);

        // Header
        doc.fontSize(20)
           .text('PRESCRIPTION', { align: 'center' })
           .moveDown();

        // Hospital info
        doc.fontSize(10)
           .text('City Hospital', { align: 'center' })
           .text('123 Healthcare Ave, City, State', { align: 'center' })
           .text('Phone: (555) 123-4567', { align: 'center' })
           .moveDown();

        // Patient info
        doc.fontSize(12)
           .text(`Patient: ${prescriptionData.patientName}`)
           .text(`Date of Birth: ${prescriptionData.dob}`)
           .text(`Medical Record #: ${prescriptionData.mrn}`)
           .moveDown();

        // Doctor info
        doc.text(`Prescribed by: Dr. ${prescriptionData.doctorName}`)
           .text(`Specialty: ${prescriptionData.specialty}`)
           .text(`Date: ${new Date().toLocaleDateString()}`)
           .moveDown();

        // Medications
        doc.fontSize(14)
           .text('Medications:', { underline: true })
           .moveDown(0.5);

        prescriptionData.medications.forEach((med, index) => {
          doc.fontSize(11)
             .text(`${index + 1}. ${med.name} - ${med.dosage}`)
             .text(`   Frequency: ${med.frequency}`)
             .text(`   Duration: ${med.duration}`)
             .text(`   Instructions: ${med.instructions}`)
             .moveDown(0.5);
        });

        // Footer
        doc.moveDown(2)
           .fontSize(10)
           .text('This prescription is valid for 30 days from the date of issue.')
           .text('Please contact the pharmacy for refills.', { align: 'center' });

        doc.end();

        stream.on('finish', () => {
          resolve(filePath);
        });

        stream.on('error', (error) => {
          reject(error);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  generateInvoice(invoiceData) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50 });
        const filename = `invoice_${invoiceData.id}.pdf`;
        const filePath = path.join(__dirname, '../temp', filename);
        
        const stream = fs.createWriteStream(filePath);
        doc.pipe(stream);

        // Header
        doc.fontSize(20)
           .text('INVOICE', { align: 'center' })
           .moveDown();

        // Invoice details
        doc.fontSize(10)
           .text(`Invoice #: ${invoiceData.id}`)
           .text(`Date: ${new Date().toLocaleDateString()}`)
           .text(`Due Date: ${new Date(Date.now() + 30*24*60*60*1000).toLocaleDateString()}`)
           .moveDown();

        // Bill to
        doc.text('Bill To:')
           .text(invoiceData.patientName)
           .text(invoiceData.address)
           .text(invoiceData.phone)
           .moveDown();

        // Items
        doc.fontSize(12)
           .text('Services:', { underline: true })
           .moveDown(0.5);

        let total = 0;
        invoiceData.items.forEach((item, index) => {
          const subtotal = item.quantity * item.price;
          total += subtotal;
          doc.fontSize(10)
             .text(`${index + 1}. ${item.description}`)
             .text(`   Quantity: ${item.quantity} x $${item.price} = $${subtotal}`)
             .moveDown(0.3);
        });

        // Total
        doc.moveDown()
           .fontSize(14)
           .text(`Total Amount: $${total.toFixed(2)}`, { align: 'right' });

        doc.end();

        stream.on('finish', () => {
          resolve(filePath);
        });

        stream.on('error', (error) => {
          reject(error);
        });
      } catch (error) {
        reject(error);
      }
    });
  }
}

module.exports = new PDFGenerator();

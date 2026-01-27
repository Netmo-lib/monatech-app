// ============================================================================
// MONA-TECH PDF RECEIPT GENERATOR
// ============================================================================
// Requires: jsPDF library (include this in your HTML)
// <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
// ============================================================================

window.MonaTechReceipt = {
    // Generate receipt number
    generateReceiptNumber: function() {
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        return `RCP-${year}${month}${day}-${random}`;
    },

    // Format currency
    formatCurrency: function(amount, currency = 'LRD') {
        const formatted = parseFloat(amount).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        return currency === 'USD' ? `$${formatted}` : `${formatted} ${currency}`;
    },

    // Generate PDF receipt
    generatePDF: function(transaction) {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        // Page settings
        const pageWidth = doc.internal.pageSize.width;
        const pageHeight = doc.internal.pageSize.height;
        const margin = 20;
        let yPos = 20;

        // Colors
        const primaryBlue = [43, 62, 130];
        const primaryRed = [230, 57, 70];

        // ================================================================
        // HEADER - Company Logo and Info
        // ================================================================
        
        // Company name
        doc.setFontSize(24);
        doc.setTextColor(...primaryBlue);
        doc.setFont(undefined, 'bold');
        doc.text('MONA-TECH PRINTS SERVICE', pageWidth / 2, yPos, { align: 'center' });
        yPos += 8;

        // Tagline
        doc.setFontSize(10);
        doc.setTextColor(...primaryRed);
        doc.setFont(undefined, 'normal');
        doc.text('Digital - Printing - IT Services', pageWidth / 2, yPos, { align: 'center' });
        yPos += 12;

        // Contact information
        doc.setFontSize(9);
        doc.setTextColor(80, 80, 80);
        doc.text('Tubman Blvd, Opposite Fire 4 Fire Church', pageWidth / 2, yPos, { align: 'center' });
        yPos += 5;
        doc.text('Vamuma Junction, Monrovia, Liberia', pageWidth / 2, yPos, { align: 'center' });
        yPos += 5;
        doc.text('Tel: +231-887-302-665 / 770-476-513', pageWidth / 2, yPos, { align: 'center' });
        yPos += 10;

        // Divider line
        doc.setDrawColor(...primaryBlue);
        doc.setLineWidth(0.5);
        doc.line(margin, yPos, pageWidth - margin, yPos);
        yPos += 10;

        // ================================================================
        // RECEIPT HEADER
        // ================================================================
        
        doc.setFontSize(16);
        doc.setTextColor(...primaryRed);
        doc.setFont(undefined, 'bold');
        doc.text('RECEIPT', pageWidth / 2, yPos, { align: 'center' });
        yPos += 10;

        // Receipt details
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        doc.setFont(undefined, 'normal');
        
        const receiptNum = transaction.receiptNumber || this.generateReceiptNumber();
        const date = transaction.date || new Date().toLocaleDateString();
        const time = new Date().toLocaleTimeString();

        doc.text(`Receipt #: ${receiptNum}`, margin, yPos);
        doc.text(`Date: ${date}`, pageWidth - margin, yPos, { align: 'right' });
        yPos += 6;

        doc.text(`Time: ${time}`, margin, yPos);
        if (transaction.createdByName) {
            doc.text(`Cashier: ${transaction.createdByName}`, pageWidth - margin, yPos, { align: 'right' });
        }
        yPos += 6;

        if (transaction.customer) {
            doc.text(`Customer: ${transaction.customer}`, margin, yPos);
        }
        yPos += 10;

        // Divider line
        doc.setDrawColor(200, 200, 200);
        doc.line(margin, yPos, pageWidth - margin, yPos);
        yPos += 8;

        // ================================================================
        // ITEMS TABLE
        // ================================================================
        
        doc.setFont(undefined, 'bold');
        doc.text('Item', margin, yPos);
        doc.text('Qty', pageWidth / 2 - 20, yPos);
        doc.text('Price', pageWidth / 2 + 20, yPos);
        doc.text('Total', pageWidth - margin, yPos, { align: 'right' });
        yPos += 2;

        // Line under headers
        doc.setLineWidth(0.3);
        doc.line(margin, yPos, pageWidth - margin, yPos);
        yPos += 6;

        // Item details
        doc.setFont(undefined, 'normal');
        doc.text(transaction.item || 'Item', margin, yPos);
        yPos += 6;

        if (transaction.size) {
            doc.setFontSize(9);
            doc.setTextColor(100, 100, 100);
            doc.text(`Size: ${transaction.size}`, margin + 5, yPos);
            yPos += 6;
        }

        // Quantity, price, total
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        const itemYPos = yPos - 6;
        doc.text(transaction.qty.toString(), pageWidth / 2 - 20, itemYPos);
        doc.text(this.formatCurrency(transaction.price, transaction.currency), pageWidth / 2 + 20, itemYPos);
        doc.text(this.formatCurrency(transaction.total, transaction.currency), pageWidth - margin, itemYPos, { align: 'right' });

        yPos += 10;

        // Divider line
        doc.setLineWidth(0.3);
        doc.line(margin, yPos, pageWidth - margin, yPos);
        yPos += 8;

        // ================================================================
        // TOTALS
        // ================================================================
        
        doc.setFont(undefined, 'bold');
        doc.setFontSize(12);

        // Subtotal
        doc.text('SUBTOTAL:', pageWidth - margin - 60, yPos);
        doc.text(this.formatCurrency(transaction.total, transaction.currency), pageWidth - margin, yPos, { align: 'right' });
        yPos += 8;

        // Tax (if applicable)
        if (transaction.tax && transaction.tax > 0) {
            doc.setFont(undefined, 'normal');
            doc.setFontSize(10);
            doc.text(`Tax (${transaction.taxRate || 0}%):`, pageWidth - margin - 60, yPos);
            doc.text(this.formatCurrency(transaction.tax, transaction.currency), pageWidth - margin, yPos, { align: 'right' });
            yPos += 8;
        }

        // Total
        doc.setDrawColor(...primaryBlue);
        doc.setLineWidth(0.5);
        doc.line(pageWidth - margin - 70, yPos - 2, pageWidth - margin, yPos - 2);
        yPos += 5;

        doc.setFont(undefined, 'bold');
        doc.setFontSize(14);
        doc.setTextColor(...primaryRed);
        doc.text('TOTAL:', pageWidth - margin - 60, yPos);
        doc.text(this.formatCurrency(transaction.total + (transaction.tax || 0), transaction.currency), pageWidth - margin, yPos, { align: 'right' });
        yPos += 12;

        // Payment information
        if (transaction.payment) {
            doc.setFont(undefined, 'normal');
            doc.setFontSize(10);
            doc.setTextColor(0, 0, 0);
            doc.text(`Payment Method: ${transaction.payment}`, margin, yPos);
            yPos += 8;
        }

        // ================================================================
        // FOOTER
        // ================================================================
        
        yPos = pageHeight - 40;

        // Thank you message
        doc.setFont(undefined, 'bold');
        doc.setFontSize(12);
        doc.setTextColor(...primaryBlue);
        doc.text('Thank you for your business!', pageWidth / 2, yPos, { align: 'center' });
        yPos += 8;

        // Footer note
        doc.setFont(undefined, 'normal');
        doc.setFontSize(9);
        doc.setTextColor(100, 100, 100);
        doc.text('Please keep this receipt for your records', pageWidth / 2, yPos, { align: 'center' });
        yPos += 5;
        doc.text('For inquiries, contact us at the numbers above', pageWidth / 2, yPos, { align: 'center' });

        // Page border
        doc.setDrawColor(...primaryBlue);
        doc.setLineWidth(1);
        doc.rect(10, 10, pageWidth - 20, pageHeight - 20);

        return doc;
    },

    // Download receipt as PDF
    download: function(transaction) {
        const doc = this.generatePDF(transaction);
        const receiptNum = transaction.receiptNumber || this.generateReceiptNumber();
        doc.save(`Receipt_${receiptNum}.pdf`);
        
        // Log activity
        if (window.MonaTechAuth) {
            MonaTechAuth.logActivity('RECEIPT_DOWNLOAD', `Downloaded receipt for transaction #${transaction.id}`);
        }
    },

    // Print receipt
    print: function(transaction) {
        const doc = this.generatePDF(transaction);
        doc.autoPrint();
        window.open(doc.output('bloburl'), '_blank');
        
        // Log activity
        if (window.MonaTechAuth) {
            MonaTechAuth.logActivity('RECEIPT_PRINT', `Printed receipt for transaction #${transaction.id}`);
        }
    },

    // Email receipt (placeholder - requires backend)
    email: function(transaction, emailAddress) {
        alert(`Email functionality requires a backend server.\n\nTo send receipt to: ${emailAddress}\n\nFor now, please download the PDF and email it manually.`);
        this.download(transaction);
    },

    // View receipt in modal
    viewInModal: function(transaction) {
        const doc = this.generatePDF(transaction);
        const pdfData = doc.output('datauristring');
        
        // Create modal
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.8);
            z-index: 10000;
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 20px;
        `;

        modal.innerHTML = `
            <div style="background: white; border-radius: 10px; padding: 20px; max-width: 90%; max-height: 90%; overflow: auto;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <h2 style="color: #2B3E82;">Receipt Preview</h2>
                    <button onclick="this.closest('div').parentElement.remove()" style="background: #E63946; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; font-size: 16px;">
                        ✕ Close
                    </button>
                </div>
                <iframe src="${pdfData}" style="width: 100%; height: 600px; border: 1px solid #ddd;"></iframe>
                <div style="margin-top: 20px; display: flex; gap: 10px; justify-content: center;">
                    <button onclick="MonaTechReceipt.download(${JSON.stringify(transaction).replace(/"/g, '&quot;')})" 
                            style="background: #2B3E82; color: white; border: none; padding: 12px 24px; border-radius: 5px; cursor: pointer; font-weight: 600;">
                        📥 Download PDF
                    </button>
                    <button onclick="MonaTechReceipt.print(${JSON.stringify(transaction).replace(/"/g, '&quot;')})" 
                            style="background: #28A745; color: white; border: none; padding: 12px 24px; border-radius: 5px; cursor: pointer; font-weight: 600;">
                        🖨️ Print
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
    }
};

console.log('✅ MonaTech Receipt Generator Loaded');
console.log('📝 Usage: MonaTechReceipt.download(transaction)');
console.log('📝 Usage: MonaTechReceipt.print(transaction)');
console.log('📝 Usage: MonaTechReceipt.viewInModal(transaction)');

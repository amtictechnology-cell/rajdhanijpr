const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');
const logger = require('./logger');

// Ensure upload directory exists for invoices
const invoicesDir = path.join(__dirname, '../../uploads/invoices');
if (!fs.existsSync(invoicesDir)) {
    fs.mkdirSync(invoicesDir, { recursive: true });
}

/**
 * Generates an HTML layout for the invoice
 */
const getInvoiceHtml = (bill) => {
    const customer = bill.customer || { name: 'Customer', mobileNo: '', email: '', billingAddress: '', gstNo: '', location1: '', location2: '' };
    const items = bill.items || [];
    const dateStr = new Date(bill.billDate).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });

    const itemsRows = items.map((item, index) => `
        <tr>
            <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: center;">${index + 1}</td>
            <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-weight: 500; color: #1a202c;">${item.itemDescription}</td>
            <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: center; color: #4a5568;">${item.width} x ${item.height}</td>
            <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: center; color: #4a5568;">${item.quantity}</td>
            <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: right; color: #4a5568;">₹${item.rate.toFixed(2)}</td>
            <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 600; color: #2d3748;">₹${item.amount.toFixed(2)}</td>
        </tr>
    `).join('');

    const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
    const transportCharge = bill.transportCharge || 0;
    const totalAmount = bill.totalAmount || (subtotal + transportCharge);

    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <title>Invoice</title>
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
            body {
                font-family: 'Inter', sans-serif;
                margin: 0;
                padding: 0;
                color: #2d3748;
                background-color: #ffffff;
                -webkit-print-color-adjust: exact;
            }
            .invoice-container {
                max-width: 800px;
                margin: 0 auto;
                padding: 30px;
                background-color: #ffffff;
            }
            .header-table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 30px;
            }
            .logo-title {
                font-size: 28px;
                font-weight: 700;
                color: #1a365d;
                letter-spacing: -0.5px;
                margin: 0;
            }
            .tagline {
                font-size: 12px;
                color: #718096;
                margin: 2px 0 0 0;
            }
            .invoice-title {
                font-size: 32px;
                font-weight: 700;
                color: #718096;
                text-align: right;
                text-transform: uppercase;
                margin: 0;
            }
            .details-table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 30px;
            }
            .bill-to-section {
                width: 60%;
                vertical-align: top;
            }
            .meta-section {
                width: 40%;
                vertical-align: top;
                text-align: right;
            }
            .section-heading {
                font-size: 11px;
                font-weight: 700;
                text-transform: uppercase;
                color: #a0aec0;
                margin-bottom: 8px;
                letter-spacing: 0.5px;
            }
            .company-details {
                font-size: 13px;
                color: #4a5568;
                line-height: 1.5;
            }
            .customer-details {
                font-size: 14px;
                color: #2d3748;
                line-height: 1.5;
            }
            .meta-value {
                font-size: 14px;
                color: #2d3748;
                margin-bottom: 6px;
            }
            .meta-value strong {
                color: #1a365d;
            }
            .items-table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 30px;
            }
            .items-table th {
                background-color: #f7fafc;
                color: #4a5568;
                font-size: 11px;
                font-weight: 700;
                text-transform: uppercase;
                padding: 12px 10px;
                border-bottom: 2px solid #edf2f7;
                letter-spacing: 0.5px;
            }
            .summary-table {
                width: 45%;
                margin-left: auto;
                border-collapse: collapse;
            }
            .summary-table td {
                padding: 8px 10px;
                font-size: 14px;
                color: #4a5568;
            }
            .summary-table .total-row td {
                font-size: 18px;
                font-weight: 700;
                color: #1a365d;
                border-top: 2px solid #e2e8f0;
                padding-top: 12px;
            }
            .footer {
                margin-top: 50px;
                text-align: center;
                border-top: 1px solid #edf2f7;
                padding-top: 20px;
                font-size: 12px;
                color: #a0aec0;
            }
        </style>
    </head>
    <body>
        <div class="invoice-container">
            <!-- Header Block -->
            <table class="header-table">
                <tr>
                    <td>
                        <h1 class="logo-title">RAJDHANI PRINTERS</h1>
                        <p class="tagline">Quality Printing & Publishing Services</p>
                    </td>
                    <td>
                        <h2 class="invoice-title">Invoice</h2>
                    </td>
                </tr>
            </table>

            <!-- Details Block -->
            <table class="details-table">
                <tr>
                    <td class="bill-to-section">
                        <div class="section-heading">Bill To</div>
                        <div class="customer-details">
                            <strong style="font-size: 16px; color: #1a202c;">${customer.name}</strong><br>
                            ${customer.billingAddress ? '<strong>Address:</strong> ' + customer.billingAddress + '<br>' : ''}
                            <strong>Phone:</strong> ${customer.mobileNo}<br>
                            <strong>Email:</strong> ${customer.email || 'N/A'}<br>
                            ${customer.gstNo ? '<strong>GSTIN:</strong> ' + customer.gstNo + '<br>' : ''}
                            ${customer.location1 ? '<strong>Location 1:</strong> <a href="' + customer.location1 + '" target="_blank">Open Map Link</a><br>' : ''}
                            ${customer.location2 ? '<strong>Location 2:</strong> <a href="' + customer.location2 + '" target="_blank">Open Location Link</a><br>' : ''}
                        </div>
                    </td>
                    <td class="meta-section">
                        <div class="section-heading">Invoice Details</div>
                        <div class="meta-value">Invoice No: <strong>#${bill._id.toString().slice(-6).toUpperCase()}</strong></div>
                        <div class="meta-value">Date: <strong>${dateStr}</strong></div>
                        <div class="meta-value">Payment Method: <strong>${bill.paymentMethod}</strong></div>
                    </td>
                </tr>
            </table>

            <!-- Items Block -->
            <table class="items-table">
                <thead>
                    <tr>
                        <th style="width: 5%; text-align: center;">#</th>
                        <th style="width: 45%; text-align: left;">Item & Description</th>
                        <th style="width: 15%; text-align: center;">Size (W x H)</th>
                        <th style="width: 10%; text-align: center;">Qty</th>
                        <th style="width: 12%; text-align: right;">Rate</th>
                        <th style="width: 13%; text-align: right;">Amount</th>
                    </tr>
                </thead>
                <tbody>
                    ${itemsRows}
                </tbody>
            </table>

            <!-- Summary Block -->
            <table class="summary-table">
                <tr>
                    <td style="text-align: left;">Sub Total:</td>
                    <td style="text-align: right; font-weight: 500;">₹${subtotal.toFixed(2)}</td>
                </tr>
                <tr>
                    <td style="text-align: left;">Transport Charge:</td>
                    <td style="text-align: right; font-weight: 500;">₹${transportCharge.toFixed(2)}</td>
                </tr>
                <tr class="total-row">
                    <td style="text-align: left;">Total:</td>
                    <td style="text-align: right;">₹${totalAmount.toFixed(2)}</td>
                </tr>
            </table>

            <!-- Footer -->
            <div class="footer">
                <p>Thank you for choosing Rajdhani Printers!</p>
                <p style="font-size: 10px; margin-top: 5px;">This is a computer-generated invoice and does not require a signature.</p>
            </div>
        </div>
    </body>
    </html>
    `;
};

/**
 * Generates and saves a PDF invoice using Puppeteer
 * @param {Object} bill - Mongoose Bill document populated with Customer
 * @returns {Promise<string>} - The relative path of the generated PDF file
 */
const generateInvoicePdf = async (bill) => {
    let browser;
    try {
        const htmlContent = getInvoiceHtml(bill);
        const fileName = `invoice-${bill._id}.pdf`;
        const relativePath = `uploads/invoices/${fileName}`;
        const outputPath = path.join(__dirname, '../../', relativePath);

        logger.info(`Launching Puppeteer to generate invoice PDF for Bill ID: ${bill._id}`);
        
        browser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        const page = await browser.newPage();
        await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
        
        await page.pdf({
            path: outputPath,
            format: 'A4',
            printBackground: true,
            margin: {
                top: '0mm',
                right: '0mm',
                bottom: '0mm',
                left: '0mm'
            }
        });

        logger.info(`Invoice PDF generated successfully at: ${outputPath}`);
        return relativePath;
    } catch (error) {
        logger.error(`Failed to generate PDF for Bill ID ${bill._id}: ${error.message}`);
        throw error;
    } finally {
        if (browser) {
            await browser.close();
        }
    }
};

module.exports = {
    generateInvoicePdf
};

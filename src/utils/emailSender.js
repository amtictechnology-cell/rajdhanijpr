const nodemailer = require('nodemailer');
const path = require('path');
const logger = require('./logger');

// Setup Nodemailer transporter pointing to Brevo SMTP
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp-relay.brevo.com',
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false, // Use TLS (true for 465, false for other ports)
    auth: {
        user: process.env.SMTP_USER || 'ae31e0001@smtp-brevo.com',
        pass: process.env.SMTP_PASS || '7hFOPBzdafCqx1k3'
    }
});

/**
 * Sends an email with the attached PDF invoice
 * @param {string} customerEmail - Target recipient email address
 * @param {string} customerName - Name of the customer
 * @param {string} billId - MongoDB ID of the bill
 * @param {string} pdfRelativePath - Relative path of the generated PDF file on disk
 * @returns {Promise<Object>} - Nodemailer send message info
 */
const sendInvoiceEmail = async (customerEmail, customerName, billId, pdfRelativePath) => {
    try {
        const absolutePdfPath = path.join(__dirname, '../../', pdfRelativePath);
        const invoiceNumber = billId.toString().slice(-6).toUpperCase();

        logger.info(`Preparing invoice email dispatch to: ${customerEmail} (Invoice: #${invoiceNumber})`);

        const mailOptions = {
            from: `"${process.env.SMTP_FROM_NAME || 'Rajdhani Printers'}" <${process.env.SMTP_FROM || 'rajdhaniprintersjpr@gmail.com'}>`,
            to: customerEmail,
            subject: `Invoice #${invoiceNumber} from Rajdhani Printers`,
            text: `Dear ${customerName},\n\nThank you for doing business with us! Please find attached your digital invoice #${invoiceNumber}.\n\nBest Regards,\nRajdhani Printers`,
            html: `
                <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px;">
                    <h2 style="color: #1a365d; border-bottom: 2px solid #edf2f7; padding-bottom: 10px; margin-top: 0;">Rajdhani Printers</h2>
                    <p>Dear <strong>${customerName}</strong>,</p>
                    <p>Thank you for choosing Rajdhani Printers! We appreciate your business.</p>
                    <p>Please find attached the invoice **#${invoiceNumber}** for your recent printing services.</p>
                    <p style="background-color: #f7fafc; padding: 15px; border-radius: 5px; border-left: 4px solid #1a365d; font-size: 14px; margin: 20px 0;">
                        <strong>Invoice Number:</strong> #${invoiceNumber}<br>
                        <strong>Sender:</strong> Rajdhani Printers, Jaipur
                    </p>
                    <p>If you have any questions or queries regarding this invoice, please feel free to contact us.</p>
                    <br>
                    <p style="font-size: 13px; color: #718096; border-top: 1px solid #edf2f7; padding-top: 15px; margin-bottom: 0;">
                        Best Regards,<br>
                        <strong>Rajdhani Printers</strong><br>
                        Email: rajdhaniprintersjpr@gmail.com
                    </p>
                </div>
            `,
            attachments: [
                {
                    filename: `Invoice-${invoiceNumber}.pdf`,
                    path: absolutePdfPath
                }
            ]
        };

        const info = await transporter.sendMail(mailOptions);
        logger.info(`Invoice email sent successfully to ${customerEmail}. MessageId: ${info.messageId}`);
        return info;
    } catch (error) {
        logger.error(`Failed to send invoice email to ${customerEmail}: ${error.message}`);
        throw error;
    }
};

module.exports = {
    sendInvoiceEmail
};

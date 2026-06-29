const Bill = require('../models/Bill');
const Transaction = require('../models/Transaction');
const Customer = require('../models/Customer');
const logger = require('../utils/logger');

// Helper to calculate financial summary for a single customer
function calculateCustomerFinancials(cust, customerBills, customerTransactions) {
    // Sort transactions and bills chronologically
    const sortedTxs = [...customerTransactions].sort((a, b) => new Date(a.date) - new Date(b.date));
    const sortedBills = [...customerBills].sort((a, b) => new Date(a.billDate) - new Date(b.billDate));

    // Calculate ledger totals
    let totalGave = 0; // advanced/paid to customer (increases what customer owes us)
    let totalTook = 0; // received from customer (reduces what customer owes us)
    sortedTxs.forEach(t => {
        if (t.type === 'gave') {
            totalGave += t.amount;
        } else if (t.type === 'took') {
            totalTook += t.amount;
        }
    });

    let netCashReceived = totalTook - totalGave;

    let totalDirectCash = 0;
    let totalDirectUpi = 0;
    let totalBilled = 0;

    const billsDetails = [];
    const ledgerDependentBills = [];

    sortedBills.forEach(bill => {
        totalBilled += bill.totalAmount;
        if (bill.paymentMethod === 'Cash') {
            totalDirectCash += bill.totalAmount;
            billsDetails.push({
                billId: bill._id,
                billDate: bill.billDate,
                totalAmount: bill.totalAmount,
                paymentMethod: bill.paymentMethod,
                paidAmount: bill.totalAmount,
                pendingAmount: 0
            });
        } else if (bill.paymentMethod === 'UPI') {
            totalDirectUpi += bill.totalAmount;
            billsDetails.push({
                billId: bill._id,
                billDate: bill.billDate,
                totalAmount: bill.totalAmount,
                paymentMethod: bill.paymentMethod,
                paidAmount: bill.totalAmount,
                pendingAmount: 0
            });
        } else {
            // 'Pending' or 'Settled'
            ledgerDependentBills.push(bill);
        }
    });

    let remainingCash = netCashReceived;
    let totalLedgerCovered = 0;
    let totalPendingAmount = 0;

    ledgerDependentBills.forEach(bill => {
        let paidAmount = 0;
        let pendingAmount = bill.totalAmount;

        if (remainingCash >= bill.totalAmount) {
            paidAmount = bill.totalAmount;
            pendingAmount = 0;
            remainingCash -= bill.totalAmount;
        } else if (remainingCash > 0) {
            paidAmount = remainingCash;
            pendingAmount = bill.totalAmount - remainingCash;
            remainingCash = 0;
        }

        totalLedgerCovered += paidAmount;
        totalPendingAmount += pendingAmount;

        billsDetails.push({
            billId: bill._id,
            billDate: bill.billDate,
            totalAmount: bill.totalAmount,
            paymentMethod: bill.paymentMethod,
            paidAmount: paidAmount,
            pendingAmount: pendingAmount
        });
    });

    // Total direct paid + manual/ledger payments covered
    const totalPaid = totalDirectCash + totalDirectUpi + totalLedgerCovered;

    // Sort billsDetails descending by date for displaying newest first
    billsDetails.sort((a, b) => new Date(b.billDate) - new Date(a.billDate));

    return {
        customer: {
            id: cust._id,
            name: cust.name,
            mobileNo: cust.mobileNo,
            email: cust.email,
            billingAddress: cust.billingAddress
        },
        totalBillsCount: customerBills.length,
        totalBilled,
        totalPaid,
        totalPendingAmount,
        paymentSplit: {
            directCash: totalDirectCash,
            directUpi: totalDirectUpi,
            ledgerTook: totalTook,
            ledgerGave: totalGave,
            netLedgerPaid: totalTook - totalGave,
            remainingCredit: remainingCash
        },
        bills: billsDetails
    };
}

// GET - Get summary list of all customers and their outstanding dues
exports.getCustomerSummaries = async (req, res) => {
    try {
        const customers = await Customer.find({});
        const bills = await Bill.find({});
        const transactions = await Transaction.find({});

        // Group bills by customer ID
        const billsByCust = {};
        bills.forEach(bill => {
            if (!bill.customer) return;
            const cid = bill.customer.toString();
            if (!billsByCust[cid]) billsByCust[cid] = [];
            billsByCust[cid].push(bill);
        });

        // Group transactions by customer ID
        const txsByCust = {};
        transactions.forEach(t => {
            if (!t.customer) return;
            const cid = t.customer.toString();
            if (!txsByCust[cid]) txsByCust[cid] = [];
            txsByCust[cid].push(t);
        });

        const summaries = [];
        let totalGlobalBilled = 0;
        let totalGlobalPaid = 0;
        let totalGlobalPending = 0;
        let totalGlobalDirectCash = 0;
        let totalGlobalDirectUpi = 0;
        let totalGlobalLedgerTook = 0;
        let totalGlobalLedgerGave = 0;

        customers.forEach(cust => {
            const cid = cust._id.toString();
            const custBills = billsByCust[cid] || [];
            const custTxs = txsByCust[cid] || [];

            const detail = calculateCustomerFinancials(cust, custBills, custTxs);

            summaries.push({
                customer: detail.customer,
                totalBillsCount: detail.totalBillsCount,
                totalBilled: detail.totalBilled,
                totalPaid: detail.totalPaid,
                totalPendingAmount: detail.totalPendingAmount
            });

            totalGlobalBilled += detail.totalBilled;
            totalGlobalPaid += detail.totalPaid;
            totalGlobalPending += detail.totalPendingAmount;
            totalGlobalDirectCash += detail.paymentSplit.directCash;
            totalGlobalDirectUpi += detail.paymentSplit.directUpi;
            totalGlobalLedgerTook += detail.paymentSplit.ledgerTook;
            totalGlobalLedgerGave += detail.paymentSplit.ledgerGave;
        });

        // Sort customer summaries by pending amount descending
        summaries.sort((a, b) => b.totalPendingAmount - a.totalPendingAmount);

        return res.status(200).json({
            success: true,
            globalSummary: {
                totalCustomers: customers.length,
                totalBilled: totalGlobalBilled,
                totalPaid: totalGlobalPaid,
                totalPending: totalGlobalPending,
                paymentSplit: {
                    directCash: totalGlobalDirectCash,
                    directUpi: totalGlobalDirectUpi,
                    ledgerTook: totalGlobalLedgerTook,
                    ledgerGave: totalGlobalLedgerGave,
                    netLedgerPaid: totalGlobalLedgerTook - totalGlobalLedgerGave
                }
            },
            customers: summaries
        });

    } catch (error) {
        logger.error(`Error in getCustomerSummaries: ${error.message}`);
        return res.status(500).json({
            success: false,
            message: 'Server error while calculating customer summaries',
            error: error.message
        });
    }
};

// GET - Get detailed financial summary for a specific customer
exports.getCustomerSummaryById = async (req, res) => {
    try {
        const { customerId } = req.params;

        const customer = await Customer.findById(customerId);
        if (!customer) {
            return res.status(404).json({
                success: false,
                message: 'Customer not found'
            });
        }

        const bills = await Bill.find({ customer: customerId });
        const transactions = await Transaction.find({ customer: customerId });

        const detail = calculateCustomerFinancials(customer, bills, transactions);

        return res.status(200).json({
            success: true,
            summary: detail
        });

    } catch (error) {
        logger.error(`Error in getCustomerSummaryById: ${error.message}`);
        return res.status(500).json({
            success: false,
            message: 'Server error while fetching customer summary details',
            error: error.message
        });
    }
};

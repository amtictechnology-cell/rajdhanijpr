const Bill = require('../models/Bill');
const Transaction = require('../models/Transaction');
const Customer = require('../models/Customer');
const logger = require('../utils/logger');

// Helper to calculate financial summaries with optional date range
function calculatePeriodFinancials(cust, allBills, allTxs, startDate, endDate) {
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;
    if (end) end.setHours(23, 59, 59, 999); // cover the whole end day

    // 1. Split data into before range (opening) and within range (period)
    let openingPendingBilled = 0;
    let openingGave = 0;
    let openingTook = 0;

    let periodBilledTotal = 0;
    let periodGave = 0;
    let periodTook = 0;
    let periodDirectCash = 0;
    let periodDirectUpi = 0;
    let periodPendingBilled = 0;

    const periodTimeline = [];

    // Process Bills
    allBills.forEach(bill => {
        const bDate = new Date(bill.billDate);
        if (start && bDate < start) {
            // Opening balance part
            if (bill.paymentMethod === 'Pending' || bill.paymentMethod === 'Settled') {
                openingPendingBilled += bill.totalAmount;
            }
        } else if ((!start || bDate >= start) && (!end || bDate <= end)) {
            // Period part
            periodBilledTotal += bill.totalAmount;
            if (bill.paymentMethod === 'Cash') {
                periodDirectCash += bill.totalAmount;
            } else if (bill.paymentMethod === 'UPI') {
                periodDirectUpi += bill.totalAmount;
            } else {
                // Pending or Settled
                periodPendingBilled += bill.totalAmount;
            }

            periodTimeline.push({
                id: bill._id,
                type: 'bill',
                date: bill.billDate,
                amount: bill.totalAmount,
                description: `Bill Generated`,
                paymentMethod: bill.paymentMethod
            });
        }
    });

    // Process Transactions
    allTxs.forEach(t => {
        const tDate = new Date(t.date);
        if (start && tDate < start) {
            // Opening balance part
            if (t.type === 'gave') {
                openingGave += t.amount;
            } else if (t.type === 'took') {
                openingTook += t.amount;
            }
        } else if ((!start || tDate >= start) && (!end || tDate <= end)) {
            // Period part
            if (t.type === 'gave') {
                periodGave += t.amount;
            } else if (t.type === 'took') {
                periodTook += t.amount;
            }

            periodTimeline.push({
                id: t._id,
                type: t.type, // 'gave' or 'took'
                date: t.date,
                amount: t.amount,
                description: t.type === 'took' ? 'Received Payment' : 'Manual Gave Entry'
            });
        }
    });

    // Sort timeline descending by date (newest first)
    periodTimeline.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Calculate balances
    const openingBalance = (openingPendingBilled + openingGave) - openingTook;
    const closingBalance = openingBalance + (periodPendingBilled + periodGave) - periodTook;

    // Total customer has paid in this period: direct cash + direct UPI + manual took
    const periodPaid = periodDirectCash + periodDirectUpi + periodTook;

    return {
        customer: {
            id: cust._id,
            name: cust.name,
            mobileNo: cust.mobileNo,
            email: cust.email,
            billingAddress: cust.billingAddress
        },
        openingBalance,
        periodBilledTotal,
        periodPaid,
        periodPendingBilled,
        periodGave,
        periodTook,
        closingBalance,
        paymentSplit: {
            directCash: periodDirectCash,
            directUpi: periodDirectUpi,
            ledgerTook: periodTook,
            ledgerGave: periodGave
        },
        timeline: periodTimeline
    };
}

// GET - Get summary list of all customers with optional date filtering
exports.getCustomerSummaries = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

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
        let globalOpeningBalance = 0;
        let globalPeriodBilled = 0;
        let globalPeriodPaid = 0;
        let globalClosingBalance = 0;

        customers.forEach(cust => {
            const cid = cust._id.toString();
            const custBills = billsByCust[cid] || [];
            const custTxs = txsByCust[cid] || [];

            const financial = calculatePeriodFinancials(cust, custBills, custTxs, startDate, endDate);

            summaries.push({
                customer: financial.customer,
                openingBalance: financial.openingBalance,
                periodBilledTotal: financial.periodBilledTotal,
                periodPaid: financial.periodPaid,
                periodPendingBilled: financial.periodPendingBilled,
                periodGave: financial.periodGave,
                periodTook: financial.periodTook,
                closingBalance: financial.closingBalance,
                lastActivityDate: financial.timeline.length > 0 ? financial.timeline[0].date : null
            });

            globalOpeningBalance += financial.openingBalance;
            globalPeriodBilled += financial.periodBilledTotal;
            globalPeriodPaid += financial.periodPaid;
            globalClosingBalance += financial.closingBalance;
        });

        // Sort by closingBalance descending (highest outstanding dues first)
        summaries.sort((a, b) => b.closingBalance - a.closingBalance);

        return res.status(200).json({
            success: true,
            globalSummary: {
                totalCustomers: customers.length,
                openingBalance: globalOpeningBalance,
                periodBilled: globalPeriodBilled,
                periodPaid: globalPeriodPaid,
                closingBalance: globalClosingBalance
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

// GET - Get detailed chronological ledger timeline for a specific customer
exports.getCustomerSummaryById = async (req, res) => {
    try {
        const { customerId } = req.params;
        const { startDate, endDate } = req.query;

        const customer = await Customer.findById(customerId);
        if (!customer) {
            return res.status(404).json({
                success: false,
                message: 'Customer not found'
            });
        }

        const bills = await Bill.find({ customer: customerId });
        const transactions = await Transaction.find({ customer: customerId });

        const financial = calculatePeriodFinancials(customer, bills, transactions, startDate, endDate);

        return res.status(200).json({
            success: true,
            summary: financial
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

const Invoice = require('../models/Invoice');
const Payment = require('../models/Payment');
const Patient = require('../models/Patient');
const { generatePDF } = require('../services/pdf');

exports.createInvoice = async (req, res) => {
  try {
    const invoiceData = req.body;
    
    // Generate invoice number
    const count = await Invoice.countDocuments();
    invoiceData.invoiceNumber = `INV-${String(count + 1).padStart(6, '0')}`;

    const invoice = new Invoice(invoiceData);
    await invoice.save();

    // Update patient's billing history
    await Patient.findByIdAndUpdate(invoiceData.patient, {
      $push: { invoices: invoice._id },
    });

    res.status(201).json({
      success: true,
      data: invoice,
      message: 'Invoice created successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating invoice',
      error: error.message,
    });
  }
};

exports.getInvoices = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const { patient, status, dateFrom, dateTo, minAmount, maxAmount } = req.query;

    const query = {};
    if (patient) query.patient = patient;
    if (status) query.status = status;
    if (dateFrom || dateTo) {
      query.date = {};
      if (dateFrom) query.date.$gte = new Date(dateFrom);
      if (dateTo) query.date.$lte = new Date(dateTo);
    }
    if (minAmount || maxAmount) {
      query.totalAmount = {};
      if (minAmount) query.totalAmount.$gte = parseFloat(minAmount);
      if (maxAmount) query.totalAmount.$lte = parseFloat(maxAmount);
    }

    const invoices = await Invoice.find(query)
      .populate('patient', 'patientId user')
      .populate({
        path: 'patient',
        populate: {
          path: 'user',
          select: 'firstName lastName email phone',
        },
      })
      .populate('items.service')
      .populate('createdBy', 'firstName lastName')
      .skip(skip)
      .limit(limit)
      .sort({ date: -1 });

    const total = await Invoice.countDocuments(query);

    res.json({
      success: true,
      data: invoices,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching invoices',
      error: error.message,
    });
  }
};

exports.processPayment = async (req, res) => {
  try {
    const { invoiceId, amount, method, transactionId, notes } = req.body;

    const invoice = await Invoice.findById(invoiceId);
    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found',
      });
    }

    if (invoice.status === 'paid') {
      return res.status(400).json({
        success: false,
        message: 'Invoice already paid',
      });
    }

    // Calculate remaining balance
    const paidAmount = invoice.payments.reduce((sum, p) => sum + p.amount, 0);
    const remainingBalance = invoice.totalAmount - paidAmount;

    if (amount > remainingBalance) {
      return res.status(400).json({
        success: false,
        message: `Payment amount exceeds remaining balance of ${remainingBalance}`,
      });
    }

    // Create payment record
    const payment = new Payment({
      invoice: invoice._id,
      patient: invoice.patient,
      amount,
      method,
      transactionId,
      notes,
      processedBy: req.user._id,
    });
    await payment.save();

    // Update invoice
    invoice.payments.push(payment._id);
    
    // Check if invoice is fully paid
    const newPaidAmount = paidAmount + amount;
    if (newPaidAmount >= invoice.totalAmount) {
      invoice.status = 'paid';
      invoice.paidDate = new Date();
    } else if (newPaidAmount > 0) {
      invoice.status = 'partially_paid';
    }

    await invoice.save();

    // Generate receipt
    const receipt = await generatePDF('receipt', {
      invoice,
      payment,
      patient: await Patient.findById(invoice.patient).populate('user'),
    });

    res.json({
      success: true,
      data: {
        payment,
        invoice,
        receipt,
      },
      message: 'Payment processed successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error processing payment',
      error: error.message,
    });
  }
};

exports.getFinancialSummary = async (req, res) => {
  try {
    const { period = 'monthly', year = new Date().getFullYear() } = req.query;

    let dateFilter = {};
    if (period === 'daily') {
      const today = new Date();
      dateFilter = {
        date: {
          $gte: new Date(today.setHours(0, 0, 0, 0)),
          $lte: new Date(today.setHours(23, 59, 59, 999)),
        },
      };
    } else if (period === 'monthly') {
      dateFilter = {
        date: {
          $gte: new Date(year, 0, 1),
          $lte: new Date(year, 11, 31),
        },
      };
    }

    // Aggregate revenue
    const revenueData = await Invoice.aggregate([
      { $match: { ...dateFilter, status: { $in: ['paid', 'partially_paid'] } } },
      {
        $group: {
          _id: {
            month: { $month: '$date' },
            year: { $year: '$date' },
          },
          totalRevenue: { $sum: '$totalAmount' },
          totalPaid: { $sum: '$paidAmount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    // Aggregate by payment method
    const paymentMethods = await Payment.aggregate([
      { $match: { date: dateFilter.date } },
      {
        $group: {
          _id: '$method',
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
    ]);

    // Get pending invoices
    const pendingInvoices = await Invoice.aggregate([
      { $match: { ...dateFilter, status: 'pending' } },
      {
        $group: {
          _id: null,
          total: { $sum: '$totalAmount' },
          count: { $sum: 1 },
        },
      },
    ]);

    // Get overdue invoices (30+ days)
    const overdueThreshold = new Date();
    overdueThreshold.setDate(overdueThreshold.getDate() - 30);
    const overdueInvoices = await Invoice.aggregate([
      {
        $match: {
          date: { $lte: overdueThreshold },
          status: { $in: ['pending', 'partially_paid'] },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$totalAmount' },
          count: { $sum: 1 },
        },
      },
    ]);

    res.json({
      success: true,
      data: {
        revenueData,
        paymentMethods,
        pendingInvoices: pendingInvoices[0] || { total: 0, count: 0 },
        overdueInvoices: overdueInvoices[0] || { total: 0, count: 0 },
        summary: {
          totalRevenue: revenueData.reduce((sum, d) => sum + d.totalRevenue, 0),
          totalPaid: revenueData.reduce((sum, d) => sum + d.totalPaid, 0),
          totalInvoices: revenueData.reduce((sum, d) => sum + d.count, 0),
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching financial summary',
      error: error.message,
    });
  }
};

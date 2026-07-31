const LaboratoryRequest = require('../models/LaboratoryRequest');
const Patient = require('../models/Patient');
const { generateQRCode } = require('../services/qr');
const { generatePDF } = require('../services/pdf');

exports.createLaboratoryRequest = async (req, res) => {
  try {
    const requestData = req.body;
    
    // Generate QR code for sample tracking
    const qrData = JSON.stringify({
      patientId: requestData.patient,
      tests: requestData.tests.map(t => t.name),
      date: new Date().toISOString(),
    });
    const qrCode = await generateQRCode(qrData);
    requestData.qrCode = qrCode;

    const request = new LaboratoryRequest({
      ...requestData,
      createdBy: req.user._id,
    });
    await request.save();

    res.status(201).json({
      success: true,
      data: request,
      message: 'Laboratory request created successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating laboratory request',
      error: error.message,
    });
  }
};

exports.getLaboratoryRequests = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const { status, patient, doctor, dateFrom, dateTo, priority } = req.query;

    const query = {};
    if (status) query.status = status;
    if (patient) query.patient = patient;
    if (doctor) query.doctor = doctor;
    if (priority) query.priority = priority;
    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
      if (dateTo) query.createdAt.$lte = new Date(dateTo);
    }

    const requests = await LaboratoryRequest.find(query)
      .populate('patient', 'patientId user')
      .populate({
        path: 'patient',
        populate: {
          path: 'user',
          select: 'firstName lastName email phone',
        },
      })
      .populate('doctor', 'specialization user')
      .populate({
        path: 'doctor',
        populate: {
          path: 'user',
          select: 'firstName lastName',
        },
      })
      .populate('sampleCollectedBy', 'firstName lastName')
      .populate('sampleReceivedBy', 'firstName lastName')
      .populate('verifiedBy', 'firstName lastName')
      .populate('createdBy', 'firstName lastName')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await LaboratoryRequest.countDocuments(query);

    res.json({
      success: true,
      data: requests,
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
      message: 'Error fetching laboratory requests',
      error: error.message,
    });
  }
};

exports.updateLabResults = async (req, res) => {
  try {
    const { id } = req.params;
    const { results, notes } = req.body;

    const request = await LaboratoryRequest.findById(id);
    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Laboratory request not found',
      });
    }

    // Validate results match requested tests
    if (results.length !== request.tests.length) {
      return res.status(400).json({
        success: false,
        message: 'Number of results does not match requested tests',
      });
    }

    // Update results
    request.results = results.map((result, index) => ({
      test: request.tests[index].name,
      ...result,
      performedBy: req.user._id,
      date: new Date(),
    }));

    request.status = 'completed';
    request.notes = notes || request.notes;
    await request.save();

    // Generate report
    const report = await generatePDF('laboratoryReport', {
      request,
      patient: await Patient.findById(request.patient).populate('user'),
    });

    res.json({
      success: true,
      data: {
        request,
        report,
      },
      message: 'Laboratory results updated successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating laboratory results',
      error: error.message,
    });
  }
};

exports.verifyLabResults = async (req, res) => {
  try {
    const { id } = req.params;
    
    const request = await LaboratoryRequest.findById(id);
    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Laboratory request not found',
      });
    }

    if (request.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Cannot verify incomplete results',
      });
    }

    request.verifiedBy = req.user._id;
    request.verifiedDate = new Date();
    request.status = 'verified';
    await request.save();

    // Send notification to doctor
    await NotificationService.sendEmail(
      request.doctor.email,
      'Laboratory Results Verified',
      `Laboratory results for patient ${request.patient.patientId} have been verified and are ready for review.`
    );

    res.json({
      success: true,
      data: request,
      message: 'Laboratory results verified successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error verifying laboratory results',
      error: error.message,
    });
  }
};

exports.getLabStatistics = async (req, res) => {
  try {
    const { period = 'monthly' } = req.query;
    
    let dateFilter = {};
    if (period === 'today') {
      const today = new Date();
      dateFilter = {
        createdAt: {
          $gte: new Date(today.setHours(0, 0, 0, 0)),
          $lte: new Date(today.setHours(23, 59, 59, 999)),
        },
      };
    } else if (period === 'weekly') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      dateFilter = {
        createdAt: { $gte: weekAgo },
      };
    }

    const stats = await LaboratoryRequest.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    const testStats = await LaboratoryRequest.aggregate([
      { $match: dateFilter },
      { $unwind: '$tests' },
      {
        $group: {
          _id: '$tests.name',
          count: { $sum: 1 },
          abnormal: {
            $sum: {
              $cond: [{ $eq: ['$results.abnormal', true] }, 1, 0],
            },
          },
        },
      },
      { $sort: { count: -1 } },
    ]);

    res.json({
      success: true,
      data: {
        statusStats: stats,
        testStats,
        total: stats.reduce((sum, s) => sum + s.count, 0),
        period,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching laboratory statistics',
      error: error.message,
    });
  }
};

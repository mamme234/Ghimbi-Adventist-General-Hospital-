const Medicine = require('../models/Medicine');
const Supplier = require('../models/Supplier');
const Prescription = require('../models/Prescription');
const { generateBarcode } = require('../services/barcode');

exports.createMedicine = async (req, res) => {
  try {
    const medicineData = req.body;
    
    // Generate barcode
    const barcode = await generateBarcode();
    medicineData.barcode = barcode;

    const medicine = new Medicine(medicineData);
    await medicine.save();

    res.status(201).json({
      success: true,
      data: medicine,
      message: 'Medicine added successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating medicine',
      error: error.message,
    });
  }
};

exports.getMedicines = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const { category, search, lowStock, expiryDate } = req.query;

    const query = {};
    if (category) query.category = category;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { genericName: { $regex: search, $options: 'i' } },
        { barcode: { $regex: search, $options: 'i' } },
      ];
    }
    if (lowStock === 'true') {
      query.$expr = { $lte: ['$quantity', '$reorderLevel'] };
    }
    if (expiryDate) {
      query.expiryDate = { $lte: new Date(expiryDate) };
    }

    const medicines = await Medicine.find(query)
      .populate('supplier', 'name contact')
      .skip(skip)
      .limit(limit)
      .sort({ name: 1 });

    const total = await Medicine.countDocuments(query);

    res.json({
      success: true,
      data: medicines,
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
      message: 'Error fetching medicines',
      error: error.message,
    });
  }
};

exports.updateMedicineStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity, operation } = req.body;

    const medicine = await Medicine.findById(id);
    if (!medicine) {
      return res.status(404).json({
        success: false,
        message: 'Medicine not found',
      });
    }

    // Update stock
    if (operation === 'add') {
      medicine.quantity += quantity;
    } else if (operation === 'remove') {
      if (medicine.quantity < quantity) {
        return res.status(400).json({
          success: false,
          message: 'Insufficient stock',
        });
      }
      medicine.quantity -= quantity;
    }

    // Check if stock is low
    if (medicine.quantity <= medicine.reorderLevel) {
      // Trigger reorder notification
      await this.triggerReorderNotification(medicine);
    }

    await medicine.save();

    res.json({
      success: true,
      data: medicine,
      message: 'Stock updated successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating stock',
      error: error.message,
    });
  }
};

exports.dispensePrescription = async (req, res) => {
  try {
    const { prescriptionId, items } = req.body;

    const prescription = await Prescription.findById(prescriptionId)
      .populate('patient')
      .populate('doctor');

    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: 'Prescription not found',
      });
    }

    if (prescription.status === 'dispensed') {
      return res.status(400).json({
        success: false,
        message: 'Prescription already dispensed',
      });
    }

    // Process each medication
    const dispensedItems = [];
    for (const item of items) {
      const medicine = await Medicine.findById(item.medicineId);
      if (!medicine) {
        return res.status(404).json({
          success: false,
          message: `Medicine not found: ${item.medicineId}`,
        });
      }

      if (medicine.quantity < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${medicine.name}`,
        });
      }

      // Update stock
      medicine.quantity -= item.quantity;
      await medicine.save();

      dispensedItems.push({
        medicine: medicine._id,
        quantity: item.quantity,
        batchNumber: item.batchNumber,
        expiryDate: item.expiryDate,
      });
    }

    // Update prescription
    prescription.status = 'dispensed';
    prescription.dispensedItems = dispensedItems;
    prescription.dispensedBy = req.user._id;
    prescription.dispensedDate = new Date();
    await prescription.save();

    res.json({
      success: true,
      data: prescription,
      message: 'Prescription dispensed successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error dispensing prescription',
      error: error.message,
    });
  }
};

exports.getLowStockMedicines = async (req, res) => {
  try {
    const medicines = await Medicine.find({
      $expr: { $lte: ['$quantity', '$reorderLevel'] },
    })
      .populate('supplier', 'name contact email')
      .sort({ quantity: 1 });

    res.json({
      success: true,
      data: medicines,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching low stock medicines',
      error: error.message,
    });
  }
};

exports.getExpiringMedicines = async (req, res) => {
  try {
    const daysThreshold = parseInt(req.query.days) || 30;
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() + daysThreshold);

    const medicines = await Medicine.find({
      expiryDate: {
        $lte: thresholdDate,
        $gte: new Date(),
      },
    })
      .populate('supplier', 'name contact')
      .sort({ expiryDate: 1 });

    res.json({
      success: true,
      data: medicines,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching expiring medicines',
      error: error.message,
    });
  }
};

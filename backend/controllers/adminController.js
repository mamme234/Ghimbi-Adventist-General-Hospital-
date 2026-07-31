const User = require('../models/User');
const SystemLog = require('../models/SystemLog');
const Department = require('../models/Department');
const HospitalBranch = require('../models/HospitalBranch');
const BackupService = require('../services/backup');

exports.getSystemStats = async (req, res) => {
  try {
    const [totalUsers, totalPatients, totalDoctors, totalAppointments, totalDepartments, totalBranches] = await Promise.all([
      User.countDocuments(),
      Patient.countDocuments(),
      Doctor.countDocuments(),
      Appointment.countDocuments(),
      Department.countDocuments(),
      HospitalBranch.countDocuments(),
    ]);

    const recentActivity = await SystemLog.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('user', 'firstName lastName email');

    res.json({
      success: true,
      data: {
        users: totalUsers,
        patients: totalPatients,
        doctors: totalDoctors,
        appointments: totalAppointments,
        departments: totalDepartments,
        branches: totalBranches,
        recentActivity,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching system stats',
      error: error.message,
    });
  }
};

exports.manageUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const updates = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Prevent self-modification restrictions
    if (userId === req.user._id.toString() && (updates.role || updates.isActive === false)) {
      return res.status(403).json({
        success: false,
        message: 'Cannot modify your own role or deactivate yourself',
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updates,
      { new: true, runValidators: true }
    ).select('-password -refreshToken');

    // Log the action
    await SystemLog.create({
      user: req.user._id,
      action: 'update_user',
      target: userId,
      details: updates,
      ip: req.ip,
    });

    res.json({
      success: true,
      data: updatedUser,
      message: 'User updated successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error managing user',
      error: error.message,
    });
  }
};

exports.manageDepartment = async (req, res) => {
  try {
    const { departmentId } = req.params;
    const updates = req.body;

    const department = await Department.findById(departmentId);
    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found',
      });
    }

    const updatedDepartment = await Department.findByIdAndUpdate(
      departmentId,
      updates,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      data: updatedDepartment,
      message: 'Department updated successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error managing department',
      error: error.message,
    });
  }
};

exports.getAuditLogs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const { action, user, dateFrom, dateTo, target } = req.query;

    const query = {};
    if (action) query.action = action;
    if (user) query.user = user;
    if (target) query.target = target;
    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
      if (dateTo) query.createdAt.$lte = new Date(dateTo);
    }

    const logs = await SystemLog.find(query)
      .populate('user', 'firstName lastName email role')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await SystemLog.countDocuments(query);

    res.json({
      success: true,
      data: logs,
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
      message: 'Error fetching audit logs',
      error: error.message,
    });
  }
};

exports.createBackup = async (req, res) => {
  try {
    const backupPath = await BackupService.createBackup();
    
    res.json({
      success: true,
      data: {
        backupPath,
        timestamp: new Date(),
      },
      message: 'Backup created successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating backup',
      error: error.message,
    });
  }
};

exports.restoreBackup = async (req, res) => {
  try {
    const { backupFile } = req.body;
    
    if (!backupFile) {
      return res.status(400).json({
        success: false,
        message: 'Backup file name is required',
      });
    }

    await BackupService.restoreBackup(backupFile);
    
    res.json({
      success: true,
      message: 'Backup restored successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error restoring backup',
      error: error.message,
    });
  }
};

const Appointment = require('../models/Appointment');
const Patient = require('../models/Patient');
const Invoice = require('../models/Invoice');
const Prescription = require('../models/Prescription');
const mongoose = require('mongoose');

class AnalyticsService {
  async getDashboardStats(startDate, endDate) {
    try {
      const [appointments, patients, revenue, prescriptions] = await Promise.all([
        this.getAppointmentStats(startDate, endDate),
        this.getPatientStats(startDate, endDate),
        this.getRevenueStats(startDate, endDate),
        this.getPrescriptionStats(startDate, endDate),
      ]);

      return {
        appointments,
        patients,
        revenue,
        prescriptions,
      };
    } catch (error) {
      throw error;
    }
  }

  async getAppointmentStats(startDate, endDate) {
    const pipeline = [
      {
        $match: {
          date: {
            $gte: new Date(startDate),
            $lte: new Date(endDate),
          },
        },
      },
      {
        $group: {
          _id: {
            status: '$status',
            type: '$type',
          },
          count: { $sum: 1 },
        },
      },
    ];

    const stats = await Appointment.aggregate(pipeline);
    
    // Format stats
    const formattedStats = {
      total: 0,
      byStatus: {},
      byType: {},
    };

    stats.forEach(stat => {
      const { status, type } = stat._id;
      formattedStats.total += stat.count;
      formattedStats.byStatus[status] = (formattedStats.byStatus[status] || 0) + stat.count;
      formattedStats.byType[type] = (formattedStats.byType[type] || 0) + stat.count;
    });

    return formattedStats;
  }

  async getPatientStats(startDate, endDate) {
    const pipeline = [
      {
        $match: {
          createdAt: {
            $gte: new Date(startDate),
            $lte: new Date(endDate),
          },
        },
      },
      {
        $group: {
          _id: {
            gender: '$gender',
            bloodGroup: '$bloodGroup',
          },
          count: { $sum: 1 },
        },
      },
    ];

    const stats = await Patient.aggregate(pipeline);
    
    const formattedStats = {
      total: 0,
      byGender: {},
      byBloodGroup: {},
    };

    stats.forEach(stat => {
      const { gender, bloodGroup } = stat._id;
      formattedStats.total += stat.count;
      if (gender) {
        formattedStats.byGender[gender] = (formattedStats.byGender[gender] || 0) + stat.count;
      }
      if (bloodGroup) {
        formattedStats.byBloodGroup[bloodGroup] = (formattedStats.byBloodGroup[bloodGroup] || 0) + stat.count;
      }
    });

    return formattedStats;
  }

  async getRevenueStats(startDate, endDate) {
    const pipeline = [
      {
        $match: {
          date: {
            $gte: new Date(startDate),
            $lte: new Date(endDate),
          },
          status: 'paid',
        },
      },
      {
        $group: {
          _id: {
            type: '$type',
            department: '$department',
          },
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
    ];

    const stats = await Invoice.aggregate(pipeline);
    
    const formattedStats = {
      total: 0,
      byType: {},
      byDepartment: {},
    };

    stats.forEach(stat => {
      const { type, department } = stat._id;
      formattedStats.total += stat.total;
      formattedStats.byType[type] = (formattedStats.byType[type] || 0) + stat.total;
      formattedStats.byDepartment[department] = (formattedStats.byDepartment[department] || 0) + stat.total;
    });

    return formattedStats;
  }

  async getPrescriptionStats(startDate, endDate) {
    const pipeline = [
      {
        $match: {
          createdAt: {
            $gte: new Date(startDate),
            $lte: new Date(endDate),
          },
        },
      },
      {
        $unwind: '$medications',
      },
      {
        $group: {
          _id: '$medications.medicine',
          totalPrescribed: { $sum: '$medications.quantity' },
          count: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: 'medicines',
          localField: '_id',
          foreignField: '_id',
          as: 'medicine',
        },
      },
      {
        $sort: { totalPrescribed: -1 },
      },
      {
        $limit: 10,
      },
    ];

    const stats = await Prescription.aggregate(pipeline);
    return stats;
  }

  async getDiseaseTrends(startDate, endDate) {
    const pipeline = [
      {
        $match: {
          date: {
            $gte: new Date(startDate),
            $lte: new Date(endDate),
          },
        },
      },
      {
        $group: {
          _id: '$diagnosis',
          count: { $sum: 1 },
        },
      },
      {
        $sort: { count: -1 },
      },
      {
        $limit: 20,
      },
    ];

    const stats = await Appointment.aggregate(pipeline);
    return stats;
  }

  async getFinancialSummary(year) {
    const startDate = new Date(`${year}-01-01`);
    const endDate = new Date(`${year}-12-31`);

    const pipeline = [
      {
        $match: {
          date: {
            $gte: startDate,
            $lte: endDate,
          },
        },
      },
      {
        $group: {
          _id: {
            month: { $month: '$date' },
            status: '$status',
          },
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
    ];

    const stats = await Invoice.aggregate(pipeline);
    
    // Format monthly data
    const monthlyData = {};
    for (let i = 1; i <= 12; i++) {
      monthlyData[i] = {
        month: i,
        paid: 0,
        pending: 0,
        overdue: 0,
        total: 0,
      };
    }

    stats.forEach(stat => {
      const { month, status } = stat._id;
      if (monthlyData[month]) {
        monthlyData[month][status] = (monthlyData[month][status] || 0) + stat.total;
        monthlyData[month].total += stat.total;
      }
    });

    return Object.values(monthlyData);
  }
}

module.exports = new AnalyticsService();

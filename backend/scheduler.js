const cron = require('node-cron');
const Appointment = require('../models/Appointment');
const Medicine = require('../models/Medicine');
const Patient = require('../models/Patient');
const NotificationService = require('../services/notification');
const BackupService = require('../services/backup');

class Scheduler {
  constructor() {
    this.initSchedulers();
  }

  initSchedulers() {
    // Appointment reminders - run every hour
    cron.schedule('0 * * * *', () => {
      this.sendAppointmentReminders();
    });

    // Daily backup - run at 2 AM
    cron.schedule('0 2 * * *', () => {
      this.performDailyBackup();
    });

    // Medicine expiry check - run daily at 8 AM
    cron.schedule('0 8 * * *', () => {
      this.checkMedicineExpiry();
    });

    // Generate daily reports - run at 11 PM
    cron.schedule('0 23 * * *', () => {
      this.generateDailyReports();
    });

    // Clean up old logs - run weekly on Sunday at 3 AM
    cron.schedule('0 3 * * 0', () => {
      this.cleanupLogs();
    });

    // Send patient reminders for upcoming appointments
    cron.schedule('30 8 * * *', () => {
      this.sendDailyAppointmentReminders();
    });

    console.log('✅ Scheduler initialized');
  }

  async sendAppointmentReminders() {
    try {
      const now = new Date();
      const reminderTime = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      
      const appointments = await Appointment.find({
        date: {
          $gte: new Date(reminderTime.setHours(0, 0, 0, 0)),
          $lt: new Date(reminderTime.setHours(23, 59, 59, 999)),
        },
        status: 'scheduled',
        reminderSent: { $ne: true },
      }).populate('patient').populate('doctor');

      for (const appointment of appointments) {
        await NotificationService.sendAppointmentReminder(appointment);
        appointment.reminderSent = true;
        await appointment.save();
      }

      console.log(`📧 Sent ${appointments.length} appointment reminders`);
    } catch (error) {
      console.error('Error sending appointment reminders:', error);
    }
  }

  async sendDailyAppointmentReminders() {
    try {
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const appointments = await Appointment.find({
        date: {
          $gte: new Date(tomorrow.setHours(0, 0, 0, 0)),
          $lt: new Date(tomorrow.setHours(23, 59, 59, 999)),
        },
        status: 'scheduled',
        dailyReminderSent: { $ne: true },
      }).populate('patient').populate('doctor');

      for (const appointment of appointments) {
        await NotificationService.sendAppointmentReminder(appointment);
        appointment.dailyReminderSent = true;
        await appointment.save();
      }

      console.log(`📧 Sent ${appointments.length} daily appointment reminders`);
    } catch (error) {
      console.error('Error sending daily appointment reminders:', error);
    }
  }

  async checkMedicineExpiry() {
    try {
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

      const expiringMedicines = await Medicine.find({
        expiryDate: {
          $lte: thirtyDaysFromNow,
          $gte: new Date(),
        },
        expiryNotificationSent: { $ne: true },
      }).populate('supplier');

      for (const medicine of expiringMedicines) {
        await NotificationService.sendEmail(
          process.env.PHARMACY_EMAIL,
          'Medicine Expiry Alert',
          `
            <h2>Medicine Expiry Alert</h2>
            <p><strong>Medicine:</strong> ${medicine.name}</p>
            <p><strong>Batch:</strong> ${medicine.batchNumber}</p>
            <p><strong>Expiry Date:</strong> ${medicine.expiryDate.toLocaleDateString()}</p>
            <p><strong>Quantity:</strong> ${medicine.quantity}</p>
            <p><strong>Supplier:</strong> ${medicine.supplier?.name || 'N/A'}</p>
            <p><strong>Location:</strong> ${medicine.location}</p>
          `
        );

        medicine.expiryNotificationSent = true;
        await medicine.save();
      }

      console.log(`⚠️ Checked medicine expiry for ${expiringMedicines.length} medicines`);
    } catch (error) {
      console.error('Error checking medicine expiry:', error);
    }
  }

  async performDailyBackup() {
    try {
      const backupPath = await BackupService.createBackup();
      console.log(`💾 Daily backup completed: ${backupPath}`);
    } catch (error) {
      console.error('Error performing daily backup:', error);
    }
  }

  async generateDailyReports() {
    try {
      const today = new Date();
      const startDate = new Date(today);
      startDate.setHours(0, 0, 0, 0);

      const [newPatients, appointments, prescriptions, revenue] = await Promise.all([
        Patient.countDocuments({ createdAt: { $gte: startDate } }),
        Appointment.countDocuments({ createdAt: { $gte: startDate } }),
        Prescription.countDocuments({ createdAt: { $gte: startDate } }),
        Invoice.aggregate([
          { $match: { date: { $gte: startDate } } },
          { $group: { _id: null, total: { $sum: '$totalAmount' } } },
        ]),
      ]);

      // Send daily report to admin
      await NotificationService.sendEmail(
        process.env.ADMIN_EMAIL,
        'Daily Hospital Report',
        `
          <h2>Daily Report - ${today.toLocaleDateString()}</h2>
          <ul>
            <li>New Patients: ${newPatients}</li>
            <li>Appointments: ${appointments}</li>
            <li>Prescriptions: ${prescriptions}</li>
            <li>Revenue: $${revenue[0]?.total || 0}</li>
          </ul>
        `
      );

      console.log('📊 Daily report generated and sent');
    } catch (error) {
      console.error('Error generating daily reports:', error);
    }
  }

  async cleanupLogs() {
    try {
      const Log = require('../models/Log');
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const result = await Log.deleteMany({
        createdAt: { $lt: thirtyDaysAgo },
      });

      console.log(`🧹 Cleaned up ${result.deletedCount} old logs`);
    } catch (error) {
      console.error('Error cleaning up logs:', error);
    }
  }
}

module.exports = new Scheduler();

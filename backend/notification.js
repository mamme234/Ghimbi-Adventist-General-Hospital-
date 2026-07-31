const twilio = require('twilio');
const nodemailer = require('nodemailer');
const config = require('../config');

class NotificationService {
  constructor() {
    this.emailTransporter = nodemailer.createTransport(config.email);
    this.smsClient = twilio(config.sms.accountSid, config.sms.authToken);
  }

  async sendEmail(to, subject, html, attachments = []) {
    try {
      const mailOptions = {
        from: config.email.from,
        to,
        subject,
        html,
        attachments,
      };
      const info = await this.emailTransporter.sendMail(mailOptions);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('Email sending failed:', error);
      return { success: false, error: error.message };
    }
  }

  async sendSMS(to, message) {
    try {
      const response = await this.smsClient.messages.create({
        body: message,
        to,
        from: config.sms.sender,
      });
      return { success: true, sid: response.sid };
    } catch (error) {
      console.error('SMS sending failed:', error);
      return { success: false, error: error.message };
    }
  }

  async sendAppointmentReminder(appointment) {
    const patient = await Patient.findById(appointment.patient).populate('user');
    const doctor = await Doctor.findById(appointment.doctor).populate('user');
    
    const message = `Dear ${patient.user.firstName}, this is a reminder for your appointment with Dr. ${doctor.user.lastName} on ${appointment.date.toLocaleDateString()} at ${appointment.time}. Please arrive 15 minutes early.`;
    
    await this.sendSMS(patient.user.phone, message);
    await this.sendEmail(
      patient.user.email,
      'Appointment Reminder',
      `<p>${message}</p>`
    );
  }

  async sendPrescriptionNotification(prescription) {
    // Implementation
  }

  async sendLabResultNotification(result) {
    // Implementation
  }
}

module.exports = new NotificationService();

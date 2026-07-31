exports.welcomeEmail = (user) => `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa; border-radius: 10px;">
    <div style="text-align: center; padding: 20px; background-color: #007bff; border-radius: 10px 10px 0 0;">
      <h1 style="color: white; margin: 0;">Welcome to HospitalMS</h1>
    </div>
    <div style="padding: 30px; background-color: white; border-radius: 0 0 10px 10px;">
      <h2>Hello ${user.firstName} ${user.lastName},</h2>
      <p>Welcome to our Hospital Management System. We're excited to have you on board!</p>
      <p>Your account has been created with the following details:</p>
      <ul style="list-style: none; padding: 0;">
        <li><strong>Email:</strong> ${user.email}</li>
        <li><strong>Role:</strong> ${user.role}</li>
      </ul>
      <p>To get started, please verify your email by clicking the button below:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${process.env.FRONTEND_URL}/verify-email/${user.verificationToken}" 
           style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
          Verify Email
        </a>
      </div>
      <p style="color: #6c757d; font-size: 14px;">If you didn't create this account, please ignore this email.</p>
    </div>
    <div style="text-align: center; padding: 20px; color: #6c757d; font-size: 12px;">
      <p>&copy; ${new Date().getFullYear()} HospitalMS. All rights reserved.</p>
    </div>
  </div>
`;

exports.appointmentConfirmation = (appointment) => `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa; border-radius: 10px;">
    <div style="text-align: center; padding: 20px; background-color: #28a745; border-radius: 10px 10px 0 0;">
      <h1 style="color: white; margin: 0;">Appointment Confirmed</h1>
    </div>
    <div style="padding: 30px; background-color: white; border-radius: 0 0 10px 10px;">
      <h2>Dear ${appointment.patient.user.firstName},</h2>
      <p>Your appointment has been confirmed with the following details:</p>
      <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p><strong>Doctor:</strong> Dr. ${appointment.doctor.user.lastName}</p>
        <p><strong>Specialization:</strong> ${appointment.doctor.specialization}</p>
        <p><strong>Date:</strong> ${new Date(appointment.date).toLocaleDateString()}</p>
        <p><strong>Time:</strong> ${appointment.time}</p>
        <p><strong>Department:</strong> ${appointment.department.name}</p>
        <p><strong>Location:</strong> ${appointment.department.location || 'Main Hospital'}</p>
      </div>
      <p><strong>Important:</strong> Please arrive 15 minutes before your appointment time.</p>
      <p>If you need to reschedule or cancel, please contact us at least 24 hours in advance.</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${process.env.FRONTEND_URL}/appointments/${appointment._id}" 
           style="background-color: #28a745; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
          View Appointment
        </a>
      </div>
    </div>
  </div>
`;

exports.labResultAvailable = (result) => `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background-color: #17a2b8; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
      <h1 style="color: white; margin: 0;">Laboratory Results Ready</h1>
    </div>
    <div style="background-color: white; padding: 30px; border-radius: 0 0 10px 10px;">
      <h2>Your test results are now available</h2>
      <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px;">
        <p><strong>Patient ID:</strong> ${result.patient.patientId}</p>
        <p><strong>Test Name:</strong> ${result.tests[0].name}</p>
        <p><strong>Date:</strong> ${new Date(result.createdAt).toLocaleDateString()}</p>
      </div>
      <div style="text-align: center; margin: 20px 0;">
        <a href="${process.env.FRONTEND_URL}/patient/lab-results/${result._id}" 
           style="background-color: #17a2b8; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
          View Results
        </a>
      </div>
      <p style="color: #6c757d; font-size: 14px;">Please discuss your results with your doctor.</p>
    </div>
  </div>
`;

exports.passwordReset = (user, resetToken) => `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background-color: #ffc107; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
      <h1 style="color: #333; margin: 0;">Password Reset</h1>
    </div>
    <div style="background-color: white; padding: 30px; border-radius: 0 0 10px 10px;">
      <h2>Hello ${user.firstName},</h2>
      <p>We received a request to reset your password. Click the button below to proceed:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${process.env.FRONTEND_URL}/reset-password/${resetToken}" 
           style="background-color: #ffc107; color: #333; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
          Reset Password
        </a>
      </div>
      <p>This link will expire in 1 hour for security reasons.</p>
      <p style="color: #6c757d; font-size: 14px;">If you didn't request this, please ignore this email.</p>
    </div>
  </div>
`;

exports.invoiceEmail = (invoice) => `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background-color: #007bff; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
      <h1 style="color: white; margin: 0;">Invoice #${invoice.invoiceNumber}</h1>
    </div>
    <div style="background-color: white; padding: 30px; border-radius: 0 0 10px 10px;">
      <h2>Dear ${invoice.patient.user.firstName},</h2>
      <p>Please find your invoice details below:</p>
      <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p><strong>Invoice Number:</strong> ${invoice.invoiceNumber}</p>
        <p><strong>Date:</strong> ${new Date(invoice.date).toLocaleDateString()}</p>
        <p><strong>Due Date:</strong> ${new Date(invoice.dueDate).toLocaleDateString()}</p>
        <p><strong>Total Amount:</strong> $${invoice.totalAmount.toFixed(2)}</p>
        <p><strong>Status:</strong> ${invoice.status}</p>
      </div>
      <div style="text-align: center; margin: 20px 0;">
        <a href="${process.env.FRONTEND_URL}/patient/invoices/${invoice._id}" 
           style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
          View Invoice
        </a>
      </div>
      <p style="color: #6c757d; font-size: 14px;">Please make payment before the due date to avoid late fees.</p>
    </div>
  </div>
`;

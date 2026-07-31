const Payment = require('../models/Payment');
const Invoice = require('../models/Invoice');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handleStripeWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.rawBody, sig, endpointSecret);
  } catch (err) {
    console.log(`Webhook signature verification failed.`, err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object;
        await handleSuccessfulPayment(paymentIntent);
        break;

      case 'payment_intent.payment_failed':
        const failedPayment = event.data.object;
        await handleFailedPayment(failedPayment);
        break;

      case 'charge.refunded':
        const refund = event.data.object;
        await handleRefund(refund);
        break;

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
};

async function handleSuccessfulPayment(paymentIntent) {
  const { metadata, id } = paymentIntent;
  
  // Find invoice
  const invoice = await Invoice.findOne({ invoiceNumber: metadata.invoiceNumber });
  if (!invoice) {
    throw new Error('Invoice not found');
  }

  // Create payment record
  const payment = new Payment({
    invoice: invoice._id,
    patient: invoice.patient,
    amount: paymentIntent.amount / 100,
    method: 'card',
    transactionId: id,
    status: 'completed',
    processedBy: metadata.userId,
    metadata: {
      cardType: paymentIntent.payment_method_types[0],
      transactionReference: id,
    },
  });
  await payment.save();

  // Update invoice
  invoice.payments.push(payment._id);
  invoice.paidAmount += payment.amount;
  
  if (invoice.paidAmount >= invoice.totalAmount) {
    invoice.status = 'paid';
    invoice.paidDate = new Date();
  } else {
    invoice.status = 'partially_paid';
  }
  
  await invoice.save();

  // Send notification
  await NotificationService.sendEmail(
    invoice.patient.email,
    'Payment Confirmation',
    `Your payment of $${payment.amount} has been processed successfully.`
  );
}

async function handleFailedPayment(paymentIntent) {
  // Log failed payment
  console.error('Payment failed:', paymentIntent.id);
  
  // Notify admin
  await NotificationService.sendEmail(
    process.env.ADMIN_EMAIL,
    'Payment Failed Alert',
    `Payment failed for invoice ${paymentIntent.metadata.invoiceNumber}`
  );
}

async function handleRefund(refund) {
  // Handle refund logic
  console.log('Refund processed:', refund.id);
}

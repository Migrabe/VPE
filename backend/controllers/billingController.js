const Stripe = require("stripe");
const User = require("../models/User");

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error(
    "FATAL: STRIPE_SECRET_KEY environment variable is not set. Server cannot start safely.",
  );
}

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

exports.createCheckoutSession = async (req, res) => {
  try {
    const userId = req.user.id;
    const userEmail = req.user.email;

    // Ensure FRONTEND_URL is set in .env or default it
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment", // or 'subscription' depending on the plan
      customer_email: userEmail,
      client_reference_id: userId,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "Pro Subscription",
              description: "Access to Pro and Video generation features",
            },
            unit_amount: 1000, // 10.00 USD
          },
          quantity: 1,
        },
      ],
      success_url: `${frontendUrl}/pro?success=true`,
      cancel_url: `${frontendUrl}/pro?canceled=true`,
    });

    res.json({ checkoutUrl: session.url });
  } catch (error) {
    console.error("Error creating stripe checkout session:", error);
    res.status(500).json({ error: "Failed to create checkout session" });
  }
};

exports.handleStripeWebhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error(`Webhook Error: ${err.message}`);
    return res.status(400).send("Webhook Error");
  }

  // Handle the event
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const userId = session.client_reference_id;

    if (userId) {
      try {
        // Update user to Pro status
        await User.findByIdAndUpdate(userId, { isPro: true });
        console.log(`User ${userId} upgraded to Pro`);
      } catch (dbError) {
        console.error("Error updating user status:", dbError);
      }
    }
  }

  res.json({ received: true });
};

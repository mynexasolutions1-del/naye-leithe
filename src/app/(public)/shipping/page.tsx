import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shipping Policy — Naye Leithe",
};

export default function ShippingPolicyPage() {
  return (
    <div className="legal-page">
      <section className="legal-hero">
        <h1>Shipping Policy</h1>
        <p>Everything you need to know about how we get your order to your door.</p>
      </section>

      <section className="legal-content">
        <h2>Processing Time</h2>
        <p>
          Orders are processed within 1–2 business days of payment confirmation.
          During sale periods or festive seasons, processing may take slightly
          longer — we&apos;ll always keep you updated by email.
        </p>

        <h2>Delivery Timelines</h2>
        <p>Once shipped, delivery typically takes:</p>
        <ul>
          <li><strong>Metro cities:</strong> 3–5 business days</li>
          <li><strong>Other cities &amp; towns:</strong> 5–7 business days</li>
          <li><strong>Remote / rural areas:</strong> 7–10 business days</li>
        </ul>
        <p>
          Exact shipping charges and any free-shipping threshold are shown at
          checkout before you place your order.
        </p>

        <h2>Order Tracking</h2>
        <p>
          Once your order ships, you&apos;ll receive a confirmation with tracking
          details. You can also track the status of any order anytime from{" "}
          <a href="/profile">My Orders</a> in your account.
        </p>

        <h2>Shipping Partners</h2>
        <p>
          We work with trusted national courier partners to make sure your
          order reaches you safely and on time, no matter where in India you
          are.
        </p>

        <h2>Delays</h2>
        <p>
          Occasionally, deliveries may be delayed due to weather, regional
          logistics disruptions, or courier constraints beyond our control.
          If your order is significantly delayed, please reach out to us and
          we&apos;ll look into it right away.
        </p>

        <h2>Need Help?</h2>
        <p>
          For any shipping questions, write to us at{" "}
          <a href="mailto:support@nayeleithe.com">support@nayeleithe.com</a>{" "}
          or call <a href="tel:+919876543210">+91 98765 43210</a> (Mon–Sat, 10am–7pm).
        </p>
      </section>
    </div>
  );
}

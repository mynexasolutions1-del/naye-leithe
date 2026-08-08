import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Refund & Cancellation Policy — Naye Leithe",
};

export default function RefundPolicyPage() {
  return (
    <div className="legal-page">
      <section className="legal-hero">
        <h1>Refund &amp; Cancellation Policy</h1>
        <p>Our promise to make returns, cancellations, and refunds simple and fair.</p>
      </section>

      <section className="legal-content">
        <h2>Order Cancellation</h2>
        <p>
          You can cancel an order directly from{" "}
          <a href="/profile">My Orders</a> as long as it hasn&apos;t already
          been shipped. Once an order is out for delivery, it can no longer
          be cancelled — you&apos;re welcome to return it instead once
          received.
        </p>

        <h2>Returns</h2>
        <p>
          We accept returns within <strong>7 days</strong> of delivery for
          most items, provided they are unused, unwashed, and returned with
          original tags and packaging intact.
        </p>
        <ul>
          <li>Innerwear, jewellery, and made-to-order/customised pieces are not eligible for return.</li>
          <li>Sale and clearance items are final sale unless received damaged or defective.</li>
          <li>A pickup will be arranged from your delivery address wherever serviceable; otherwise you may need to self-ship.</li>
        </ul>

        <h2>Damaged or Incorrect Items</h2>
        <p>
          If you receive a damaged, defective, or incorrect item, please
          contact us within 48 hours of delivery with photos of the product
          and packaging — we&apos;ll arrange a free replacement or full
          refund, no questions asked.
        </p>

        <h2>Refunds</h2>
        <p>
          Once your return is received and inspected, refunds are processed
          within 5–7 business days to your original payment method. For Cash
          on Delivery orders, refunds are issued directly to your bank
          account via UPI or bank transfer.
        </p>

        <h2>How to Request a Return or Refund</h2>
        <p>
          Go to <a href="/profile">My Orders</a>, select the order, and
          choose &ldquo;Request Return&rdquo;. Alternatively, email{" "}
          <a href="mailto:support@nayeleithe.com">support@nayeleithe.com</a>{" "}
          with your order number and we&apos;ll take it from there.
        </p>
      </section>
    </div>
  );
}

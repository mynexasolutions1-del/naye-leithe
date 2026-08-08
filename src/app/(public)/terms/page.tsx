import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms & Conditions — Naye Leithe",
};

export default function TermsPage() {
  return (
    <div className="legal-page">
      <section className="legal-hero">
        <h1>Terms &amp; Conditions</h1>
        <p>The terms that govern your use of the Naye Leithe website and services.</p>
      </section>

      <section className="legal-content">
        <h2>1. About Us</h2>
        <p>
          Naye Leithe is an online destination for authentic ethnic and
          contemporary fashion. By accessing or using our website, you agree
          to be bound by these Terms &amp; Conditions.
        </p>

        <h2>2. Your Account</h2>
        <p>
          You&apos;re responsible for maintaining the confidentiality of your
          account and password, and for all activity under your account.
          Please notify us immediately of any unauthorised use.
        </p>

        <h2>3. Products &amp; Pricing</h2>
        <p>
          We make every effort to display product colours and details as
          accurately as possible; slight variations may occur due to
          screen/lighting differences and the handcrafted nature of some
          pieces. Prices are listed in Indian Rupees (₹) and are subject to
          change without prior notice.
        </p>

        <h2>4. Orders &amp; Payment</h2>
        <p>
          By placing an order, you confirm that the information provided is
          accurate. We accept Cash on Delivery and secure online payments.
          We reserve the right to cancel any order due to stock unavailability,
          pricing errors, or suspected fraudulent activity.
        </p>

        <h2>5. Shipping &amp; Returns</h2>
        <p>
          Shipping timelines and charges are detailed in our{" "}
          <a href="/shipping">Shipping Policy</a>. Returns, cancellations, and
          refunds are governed by our{" "}
          <a href="/refund">Refund &amp; Cancellation Policy</a>.
        </p>

        <h2>6. Intellectual Property</h2>
        <p>
          All content on this site — including images, designs, logos, and
          text — is the property of Naye Leithe and may not be reproduced or
          used without our written permission.
        </p>

        <h2>7. Limitation of Liability</h2>
        <p>
          Naye Leithe is not liable for any indirect or consequential loss
          arising from the use of our website or products, to the maximum
          extent permitted by law.
        </p>

        <h2>8. Changes to These Terms</h2>
        <p>
          We may update these terms from time to time. Continued use of the
          website after changes are posted constitutes your acceptance of
          the revised terms.
        </p>

        <h2>9. Contact Us</h2>
        <p>
          For any questions about these terms, write to us at{" "}
          <a href="mailto:support@nayeleithe.com">support@nayeleithe.com</a>.
        </p>
      </section>
    </div>
  );
}

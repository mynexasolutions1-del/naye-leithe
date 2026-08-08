import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — Naye Leithe",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="legal-page">
      <section className="legal-hero">
        <h1>Privacy Policy</h1>
        <p>How we collect, use, and protect your information.</p>
      </section>

      <section className="legal-content">
        <h2>Information We Collect</h2>
        <p>When you use Naye Leithe, we collect information such as:</p>
        <ul>
          <li>Your name, email address, phone number, and shipping/billing addresses</li>
          <li>Order and payment history (payments are processed securely by our payment partners — we never store your card details)</li>
          <li>Account details like your wishlist and saved addresses</li>
          <li>Basic usage data to help us improve the shopping experience</li>
        </ul>

        <h2>How We Use Your Information</h2>
        <p>We use your information to:</p>
        <ul>
          <li>Process and deliver your orders</li>
          <li>Send order updates, shipping notifications, and support responses</li>
          <li>Personalise your shopping experience and recommendations</li>
          <li>Improve our website, products, and customer service</li>
          <li>Send occasional promotional updates — only if you&apos;ve opted in, and you can unsubscribe anytime</li>
        </ul>

        <h2>How We Protect Your Data</h2>
        <p>
          Your data is stored securely and access is restricted to authorised
          personnel only. All payments are handled through PCI-compliant
          payment gateways — Naye Leithe never sees or stores your full card
          or bank details.
        </p>

        <h2>Sharing Your Information</h2>
        <p>
          We do not sell your personal information. We only share it with
          trusted third parties strictly to fulfil your order — such as
          courier partners for delivery and payment gateways for processing
          transactions.
        </p>

        <h2>Cookies</h2>
        <p>
          We use cookies to keep you signed in, remember your cart and
          wishlist, and understand how our site is used. You can disable
          cookies in your browser, though some features may not work as
          expected.
        </p>

        <h2>Your Rights</h2>
        <p>
          You can access, update, or delete your account information anytime
          from your <a href="/profile">Profile</a>, or by emailing us and
          we&apos;ll assist directly.
        </p>

        <h2>Contact Us</h2>
        <p>
          Questions about this policy? Reach us at{" "}
          <a href="mailto:support@nayeleithe.com">support@nayeleithe.com</a>.
        </p>
      </section>
    </div>
  );
}

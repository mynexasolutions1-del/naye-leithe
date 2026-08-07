import type { Metadata } from "next";
import ContactForm from "./ContactForm";

export const metadata: Metadata = {
  title: "Contact Us – Naye Leithe",
};

export default function ContactPage() {
  return (
    <>
      <style>{`
        .contact-page {
          padding: 80px 48px;
          max-width: 1200px;
          margin: 0 auto;
        }
        .contact-header {
          text-align: center;
          margin-bottom: 60px;
        }
        .contact-header h1 {
          font-family: 'Playfair Display', serif;
          font-size: 42px;
          color: var(--crimson);
          margin-bottom: 16px;
        }
        .contact-header p {
          color: var(--muted);
          font-size: 18px;
        }
        .contact-container {
          display: grid;
          grid-template-columns: 1fr 1.5fr;
          gap: 80px;
        }
        .contact-info {
          display: flex;
          flex-direction: column;
          gap: 40px;
        }
        .info-item {
          display: flex;
          gap: 20px;
        }
        .info-item i {
          font-size: 24px;
          color: var(--crimson);
          margin-top: 5px;
        }
        .info-item h3 {
          font-family: 'Playfair Display', serif;
          font-size: 20px;
          margin-bottom: 8px;
        }
        .info-item p {
          color: var(--muted);
          line-height: 1.6;
        }
        .contact-form-wrapper {
          background: var(--cream);
          padding: 40px;
          border-radius: 20px;
          border: 1px solid var(--sand);
        }
        .contact-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .contact-form .form-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .contact-form .form-group label {
          font-weight: 600;
          font-size: 14px;
          color: var(--text);
        }
        .contact-form .form-group input,
        .contact-form .form-group textarea {
          padding: 12px 16px;
          border: 1px solid var(--sand);
          border-radius: 8px;
          outline: none;
          font-size: 15px;
          font-family: inherit;
          background: #fff;
          transition: border-color 0.2s;
        }
        .contact-form .form-group input:focus,
        .contact-form .form-group textarea:focus {
          border-color: var(--crimson);
        }
        .contact-form .btn-primary {
          align-self: center;
          width: fit-content;
          padding: 12px 40px;
        }
        @media (max-width: 768px) {
          .contact-page { padding: 30px 20px; }
          .contact-container { grid-template-columns: 1fr; gap: 40px; }
          .contact-header h1 { font-size: 32px; }
          .info-item h3 { font-size: 17px; }
          .info-item p { font-size: 14px; }
          .contact-header p { font-size: 15px; }
          .contact-form-wrapper { padding: 24px; }
        }
      `}</style>

      <div className="contact-page">
        <div className="contact-header">
          <h1>Contact Us</h1>
          <p>We&apos;d love to hear from you. Reach out for any queries, collaborations, or just to say hi!</p>
        </div>

        <div className="contact-container">
          {/* Info */}
          <div className="contact-info">
            <div className="info-item">
              <i className="fas fa-map-marker-alt" />
              <div>
                <h3>Our Address</h3>
                <p>
                  Naye Leithe Fashion House<br />
                  123 Silk Road, Handloom District<br />
                  Varanasi, Uttar Pradesh 221001<br />
                  India
                </p>
              </div>
            </div>

            <div className="info-item">
              <i className="fas fa-phone" />
              <div>
                <h3>Phone</h3>
                <p>+91 98765 43210</p>
                <p>Mon – Sat, 10am – 7pm</p>
              </div>
            </div>

            <div className="info-item">
              <i className="fas fa-envelope" />
              <div>
                <h3>Email</h3>
                <p>support@nayeleithe.com</p>
                <p>We usually reply within 24 hours.</p>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="contact-form-wrapper">
            <ContactForm />
          </div>
        </div>
      </div>
    </>
  );
}

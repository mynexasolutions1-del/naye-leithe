"use client";
import { useState } from "react";
import { submitContactMessageAction } from "@/actions/contact";

export default function ContactForm() {
  const [fields, setFields] = useState({ name: "", email: "", message: "" });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFields((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const result = await submitContactMessageAction(fields.name, fields.email, fields.message);
    setLoading(false);
    if (result.success) {
      setSubmitted(true);
    } else {
      setError(result.message);
    }
  };

  if (submitted) {
    return (
      <div style={{ textAlign: "center", padding: "3rem 1rem" }}>
        <div style={{ fontSize: 56, marginBottom: "1rem" }}>✅</div>
        <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.6rem", marginBottom: "0.75rem", color: "var(--text)" }}>
          Message Sent!
        </h3>
        <p style={{ color: "var(--muted)", fontSize: "1rem", lineHeight: 1.6 }}>
          Thank you for reaching out. We&apos;ll get back to you within 24 hours.
        </p>
      </div>
    );
  }

  return (
    <form className="contact-form" onSubmit={handleSubmit}>
      <div className="form-group">
        <label htmlFor="name">Full Name</label>
        <input
          id="name"
          type="text"
          name="name"
          placeholder="Your name"
          value={fields.name}
          onChange={handleChange}
          required
        />
      </div>
      <div className="form-group">
        <label htmlFor="email">Email Address</label>
        <input
          id="email"
          type="email"
          name="email"
          placeholder="email@example.com"
          value={fields.email}
          onChange={handleChange}
          required
        />
      </div>
      <div className="form-group">
        <label htmlFor="message">Message</label>
        <textarea
          id="message"
          name="message"
          rows={5}
          placeholder="How can we help you?"
          value={fields.message}
          onChange={handleChange}
          required
        />
      </div>
      {error && (
        <p style={{ color: "#c0392b", fontSize: "0.9rem", margin: 0 }}>{error}</p>
      )}
      <button type="submit" className="btn-primary" disabled={loading}>
        {loading ? "Sending…" : "Send Message"}
      </button>
    </form>
  );
}

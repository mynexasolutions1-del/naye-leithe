"use client";
import { useState } from "react";

export default function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "ok" | "err">("idle");

  const handleSubscribe = () => {
    if (email.trim() && email.includes("@")) {
      setStatus("ok");
      setEmail("");
    } else {
      setStatus("err");
    }
  };

  if (status === "ok") {
    return (
      <p style={{ color: "rgba(255,255,255,0.95)", fontSize: 16, marginTop: 8 }}>
        ✓ Thank you for joining the Naye Leithe Circle!
      </p>
    );
  }

  return (
    <>
      <div className="nl-form">
        <input
          type="email"
          placeholder="Enter your email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubscribe()}
          style={{ backgroundColor: "#ffffff" }}
        />
        {/* No type attr — matches Flask's plain <button> */}
        <button onClick={handleSubscribe} style={{ backgroundColor: "var(--charcoal,#1c1c1c)", color: "#fff" }}>
          Subscribe
        </button>
      </div>
      {status === "err" && (
        <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, marginTop: 8 }}>
          Please enter a valid email address.
        </p>
      )}
    </>
  );
}

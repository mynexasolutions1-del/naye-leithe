"use client";

import { useState } from "react";
import { Truck, CreditCard, HandCoins, Globe, Percent, Info, Save, Megaphone } from "lucide-react";
import { updateConfigAction } from "@/actions/admin";

interface Props {
  cfg: Record<string, string>;
}

/* ── Toggle switch — visual only; the actual submitted value is the
   hidden input alongside it, so unchecked state still posts "false" ── */
function ToggleSwitch({
  name,
  checked,
  onChange,
}: {
  name: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <>
      <input type="hidden" name={name} value={checked ? "true" : "false"} />
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        className={`toggle-switch${checked ? " on" : ""}`}
        onClick={() => onChange(!checked)}
      >
        <span className="toggle-knob" />
      </button>
    </>
  );
}

export default function SettingsClient({ cfg }: Props) {
  const [shippingEnabled, setShippingEnabled] = useState(cfg.shipping_enabled === "true");
  const [codEnabled,      setCodEnabled]      = useState(cfg.payment_method_cod === "true");
  const [onlineEnabled,   setOnlineEnabled]   = useState(cfg.payment_method_online === "true");
  const [partialEnabled,  setPartialEnabled]  = useState(cfg.partial_payment_enabled === "true");

  return (
    <form action={updateConfigAction}>
      <div className="settings-grid-2col">
        {/* LEFT column */}
        <div>
          {/* Announcement bar text — kept from the previous settings page;
              still read by the storefront's announcement bar. */}
          <div className="settings-section-card">
            <div className="settings-section-header">
              <div className="settings-section-title">
                <span className="icon-box"><Megaphone size={17} /></span>
                Announcement Bar
              </div>
            </div>
            <div className="admin-form-group" style={{ marginBottom: 0 }}>
              <label className="admin-label">Announcement Text</label>
              <input
                type="text"
                name="config_announcement_text"
                defaultValue={cfg.announcement_text ?? ""}
                className="admin-input"
                placeholder="Free shipping on orders above ₹999"
              />
            </div>
          </div>

          {/* Shipping Configuration */}
          <div className="settings-section-card">
            <div className="settings-section-header">
              <div className="settings-section-title">
                <span className="icon-box"><Truck size={17} /></span>
                Shipping Configuration
              </div>
              <ToggleSwitch name="config_shipping_enabled" checked={shippingEnabled} onChange={setShippingEnabled} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
              <div className="admin-form-group" style={{ marginBottom: 0 }}>
                <label className="admin-label">Standard Shipping Charges</label>
                <div className="input-with-prefix">
                  <span className="prefix">₹</span>
                  <input type="number" name="config_shipping_charges" defaultValue={cfg.shipping_charges ?? ""} placeholder="99" />
                </div>
              </div>
              <div className="admin-form-group" style={{ marginBottom: 0 }}>
                <label className="admin-label">Free Shipping Above</label>
                <div className="input-with-prefix">
                  <span className="prefix">₹</span>
                  <input type="number" name="config_free_shipping_above" defaultValue={cfg.free_shipping_above ?? ""} placeholder="999" />
                </div>
              </div>
            </div>
          </div>

          {/* Payment Methods */}
          <div className="settings-section-card">
            <div className="settings-section-header">
              <div className="settings-section-title">
                <span className="icon-box"><CreditCard size={17} /></span>
                Payment Methods
              </div>
            </div>

            {/* COD */}
            <div className="payment-method-row">
              <span className="icon-box"><HandCoins size={18} /></span>
              <div className="payment-method-info">
                <h4>Cash on Delivery (COD)</h4>
                <p>Allow customers to pay at their doorstep.</p>
              </div>
              <div className="payment-method-toggle">
                <ToggleSwitch name="config_payment_method_cod" checked={codEnabled} onChange={setCodEnabled} />
              </div>
            </div>

            {/* Razorpay */}
            <div className="payment-method-row">
              <span className="icon-box"><Globe size={18} /></span>
              <div className="payment-method-info">
                <h4>Online Payment (Razorpay)</h4>
                <p>Accept secure online payments via Razorpay.</p>
                {onlineEnabled && (
                  <div className="payment-method-details">
                    <div className="admin-form-group" style={{ marginBottom: 0 }}>
                      <label className="admin-label">Razorpay Key ID</label>
                      <input type="text" name="config_razorpay_key_id" defaultValue={cfg.razorpay_key_id ?? ""} className="admin-input" placeholder="rzp_live_…" />
                    </div>
                    <div className="admin-form-group" style={{ marginBottom: 0 }}>
                      <label className="admin-label">Razorpay Key Secret</label>
                      <input type="password" name="config_razorpay_key_secret" defaultValue={cfg.razorpay_key_secret ?? ""} className="admin-input" />
                    </div>
                  </div>
                )}
              </div>
              <div className="payment-method-toggle">
                <ToggleSwitch name="config_payment_method_online" checked={onlineEnabled} onChange={setOnlineEnabled} />
              </div>
            </div>

            {/* Partial Payment */}
            <div className="payment-method-row">
              <span className="icon-box"><Percent size={18} /></span>
              <div className="payment-method-info">
                <h4>Partial Payment</h4>
                <p>Pay a percentage online and the rest via COD.</p>
                {partialEnabled && (
                  <div className="payment-method-details" style={{ gridTemplateColumns: "1fr" }}>
                    <div className="admin-form-group" style={{ marginBottom: 0 }}>
                      <label className="admin-label">How much should customers pay upfront?</label>
                      <div className="input-with-prefix" style={{ maxWidth: 160 }}>
                        <input
                          type="number"
                          name="config_partial_payment_percentage"
                          defaultValue={cfg.partial_payment_percentage ?? "50"}
                          min={1}
                          max={99}
                          placeholder="50"
                        />
                        <span className="prefix" style={{ borderRight: "none", borderLeft: "1px solid #e2e8f0" }}>%</span>
                      </div>
                      <p className="form-hint">The rest is collected as Cash on Delivery.</p>
                    </div>
                  </div>
                )}
              </div>
              <div className="payment-method-toggle">
                <ToggleSwitch name="config_partial_payment_enabled" checked={partialEnabled} onChange={setPartialEnabled} />
              </div>
            </div>
          </div>

          <div className="settings-save-bar">
            <button type="submit" className="btn btn-primary">
              <Save size={16} />
              Save All Configurations
            </button>
          </div>
        </div>

        {/* RIGHT column — Requirements */}
        <div className="requirements-card">
          <h3><Info size={16} /> Requirements</h3>
          <ul>
            <li><strong>COD:</strong> No external keys required.</li>
            <li><strong>Razorpay:</strong> You MUST enter both Key ID and Secret to accept online payments.</li>
            <li><strong>Partial Payment:</strong> This option will only be available to customers if BOTH COD and Online payments are enabled above.</li>
          </ul>
        </div>
      </div>
    </form>
  );
}

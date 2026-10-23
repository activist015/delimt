import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useFlutterwave, closePaymentModal } from "flutterwave-react-v3";
import { getFoundingCount } from "./referral";
import { supabase } from "./supabase";
import { Arrow, MarketingHeader, MarketingFooter, useMarketingPage } from "./marketing";
import "./marketing.css";
import "./pricing.css";

const FOUNDING_LIMIT = 50;

// The existing founding-member checkout is retained here. Website redesigns
// do not change payment verification, subscription logic, or entitlements.
export default function Pricing() {
  useMarketingPage("Delimt · Pricing");
  const [foundingCount, setFoundingCount] = useState(0);
  const [payEmail, setPayEmail] = useState("");
  const [payError, setPayError] = useState("");
  const [paySuccess, setPaySuccess] = useState(false);
  useEffect(() => { getFoundingCount().then(setFoundingCount); }, []);
  const spotsLeft = Math.max(0, FOUNDING_LIMIT - foundingCount);
  const paymentConfigured = Boolean(import.meta.env.VITE_FLW_PUBLIC_KEY);

  const handleFlutterPayment = useFlutterwave({
    public_key: import.meta.env.VITE_FLW_PUBLIC_KEY,
    tx_ref: `delimt-${Date.now()}`,
    amount: 49,
    currency: "USD",
    payment_options: "card",
    customer: { email: payEmail, name: "delimt Founding Member" },
    customizations: {
      title: "delimt Founding Member",
      description: "Lifetime access — 50 spots only",
      logo: "https://delimt.com/favicon.svg",
    },
  });

  const handleFoundingPay = (event) => {
    event.preventDefault();
    if (!payEmail.includes("@")) { setPayError("Enter a valid email"); return; }
    setPayError("");
    handleFlutterPayment({
      callback: async (response) => {
        closePaymentModal();
        if (response.status === "successful") {
          await supabase.from("waitlist").insert({
            email: payEmail,
            referral_code: payEmail.split("@")[0] + Math.random().toString(36).slice(2, 6),
            tier: "founding",
            position: 0,
          }).catch(() => {});
          await fetch("/api/send-email", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ to: payEmail, type: "founding" }),
          });
          setPaySuccess(true);
          setFoundingCount((count) => count + 1);
        }
      },
      onClose: () => {},
    });
  };

  return <div className="mk-page">
    <a className="mk-skip" href="#pricing-main">Skip to pricing</a>
    <MarketingHeader page="pricing" />
    <main className="mk-pricing mk-container" id="pricing-main">
      <div className="mk-pricing-intro"><p className="mk-eyebrow">PRICING</p><h1>A place to start.<br />Room to grow.</h1><p>Start with Delimt, or help shape what comes next.</p></div>
      <div className="mk-plans">
        <section className="mk-plan" aria-labelledby="free-title"><span className="mk-plan-label">START HERE</span><h2 id="free-title">Free</h2><p className="mk-plan-price">$0<span> / month</span></p><ul>{["3 interventions/day", "2 habits", "Basic AI pushback", "Streaks & history"].map(item => <li key={item}>{item}</li>)}</ul><Link className="mk-button" to="/download">Get started free <Arrow /></Link></section>
        <section className="mk-plan" aria-labelledby="pro-title"><span className="mk-plan-label">COMING SOON</span><h2 id="pro-title">Pro</h2><p className="mk-plan-price">$9<span> / month</span></p><ul>{["Unlimited interventions", "Unlimited habits", "Deep psychology profile", "Chrome Extension (soon)", "Priority support"].map(item => <li key={item}>{item}</li>)}</ul><p className="mk-plan-note">Coming soon</p></section>
        <section className="mk-plan mk-plan-founding" aria-labelledby="founding-title"><span className="mk-plan-label">{spotsLeft} SPOTS LEFT</span><h2 id="founding-title">Founding Member</h2><p className="mk-plan-price">$49<span> once</span></p><ul>{["Everything in Pro, forever", "Lifetime access", "Shape the product", "Founding badge", "30-day refund guarantee"].map(item => <li key={item}>{item}</li>)}</ul>
          {paySuccess ? <p className="mk-payment-success" role="status">You're a Founding Member. Check your email.</p> : spotsLeft > 0 ? <form onSubmit={handleFoundingPay} className="mk-payment-form"><label htmlFor="founding-email">Your email</label><input id="founding-email" type="email" autoComplete="email" required placeholder="you@example.com" value={payEmail} onChange={event => { setPayEmail(event.target.value); setPayError(""); }} aria-describedby={payError ? "founding-error" : undefined} />{payError && <p id="founding-error" role="alert">{payError}</p>}<button type="submit" className="mk-button" disabled={!paymentConfigured}>Claim your spot <Arrow /></button>{!paymentConfigured && <p className="mk-plan-note">Checkout is unavailable here. <a href="mailto:hello@delimt.com">Contact us.</a></p>}</form> : <p className="mk-plan-note">All spots claimed</p>}
        </section>
      </div>
      <p className="mk-pricing-help">Questions about a plan? <a href="mailto:hello@delimt.com">Talk to us.</a> <Link to="/terms">Read the terms.</Link></p>
    </main>
    <MarketingFooter />
  </div>;
}

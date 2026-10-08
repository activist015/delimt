export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { to, type } = req.body;

  const templates = {
    welcome: {
      subject: "you just joined something different",
      html: `
        <div style="background:#080808;color:#e8e8e0;font-family:'Courier New',monospace;max-width:560px;margin:0 auto;padding:40px 32px;">
          <div style="color:#FF3333;font-size:11px;letter-spacing:4px;margin-bottom:32px;">⚡ DELIMT</div>
          <h1 style="font-size:28px;font-weight:900;margin-bottom:24px;line-height:1.2;">
            You just joined<br/>
            <span style="color:#FF3333;">something different.</span>
          </h1>
          <p style="color:#888;line-height:1.8;margin-bottom:20px;">Here's the honest reason delimt exists.</p>
          <p style="color:#888;line-height:1.8;margin-bottom:20px;">
            I kept downloading screen time apps. They'd block Instagram for 10 minutes.
            I'd just override them. Every single time.
          </p>
          <p style="color:#888;line-height:1.8;margin-bottom:20px;">
            The problem was never access. It was that nothing ever
            <span style="color:#e8e8e0;font-weight:700;">argued back.</span>
          </p>
          <p style="color:#888;line-height:1.8;margin-bottom:32px;">
            delimt is that argument. Personalised, relentless, built around
            your specific psychology — not a generic timer you dismiss in 2 seconds.
          </p>
          <div style="border-left:3px solid #FF3333;padding-left:20px;margin-bottom:32px;">
            <p style="color:#e8e8e0;font-style:italic;line-height:1.8;margin:0;">
              "An AI that fights you for your own good."
            </p>
          </div>
          <p style="color:#888;line-height:1.8;margin-bottom:8px;">We're launching soon. You're early. That matters.</p>
          <p style="color:#888;line-height:1.8;">Next email in 3 days: how delimt actually works.</p>
          <div style="border-top:1px solid #1a1a1a;padding-top:24px;margin-top:40px;">
            <a href="https://delimt.com" style="color:#FF3333;font-size:12px;letter-spacing:2px;text-decoration:none;">delimt.com</a>
            <p style="color:#333;font-size:11px;margin-top:8px;">You joined the delimt waitlist.</p>
          </div>
        </div>
      `,
    },
    founding: {
      subject: "you're one of 50. here's what that means.",
      html: `
        <div style="background:#080808;color:#e8e8e0;font-family:'Courier New',monospace;max-width:560px;margin:0 auto;padding:40px 32px;">
          <div style="color:#FF3333;font-size:11px;letter-spacing:4px;margin-bottom:32px;">⚡ DELIMT · FOUNDING MEMBER</div>
          <h1 style="font-size:28px;font-weight:900;margin-bottom:24px;line-height:1.2;">
            You're one of 50.<br/>
            <span style="color:#FF3333;">Here's what that means.</span>
          </h1>
          <p style="color:#888;line-height:1.8;margin-bottom:24px;">
            You didn't just join a waitlist. You bet on an idea before it exists.
            That's a different thing entirely.
          </p>
          <div style="background:#0f0505;border:1px solid #FF333355;border-radius:8px;padding:24px;margin-bottom:32px;">
            <div style="font-size:11px;letter-spacing:3px;color:#FF3333;margin-bottom:16px;">WHAT YOU GET</div>
            <div style="display:flex;flex-direction:column;gap:10px;">
              ${[
                "Lifetime access — never pay again",
                "First access the day we launch",
                "Direct line to shape what gets built",
                "Founding Member badge in the app",
                "30-day refund guarantee — no questions asked",
              ].map(p => `
                <div style="display:flex;gap:10px;">
                  <span style="color:#FF3333;">✓</span>
                  <span style="color:#e8e8e0;font-size:14px;">${p}</span>
                </div>
              `).join("")}
            </div>
          </div>
          <p style="color:#888;line-height:1.8;">
            Reply with the one habit you most want delimt to destroy.
            We read every response.
          </p>
          <div style="border-top:1px solid #1a1a1a;padding-top:24px;margin-top:40px;">
            <a href="https://delimt.com" style="color:#FF3333;font-size:12px;letter-spacing:2px;text-decoration:none;">delimt.com</a>
          </div>
        </div>
      `,
    },
    appWelcome: {
  subject: "you're in. let's fight your first habit",
  html: `
    <div style="background:#080808;color:#e8e8e0;font-family:'Courier New',monospace;max-width:560px;margin:0 auto;padding:40px 32px;">
      <div style="color:#FF3333;font-size:11px;letter-spacing:4px;margin-bottom:32px;">⚡ DELIMT</div>
      <h1 style="font-size:28px;font-weight:900;margin-bottom:24px;line-height:1.2;">
        You're in.<br/>
        <span style="color:#FF3333;">Now let's fight something.</span>
      </h1>
      <p style="color:#888;line-height:1.8;margin-bottom:20px;">
        Your account is live. Here's how to get the most out of delimt from day one.
      </p>
      <div style="background:#0f0f0f;border:1px solid #222;border-radius:8px;padding:24px;margin-bottom:32px;">
        <div style="font-size:11px;letter-spacing:3px;color:#FF3333;margin-bottom:16px;">QUICK START</div>
        <div style="display:flex;flex-direction:column;gap:12px;">
          <div style="color:#e8e8e0;font-size:14px;">1. Add your first habit from the dashboard</div>
          <div style="color:#e8e8e0;font-size:14px;">2. Be honest about WHY you want to stop</div>
          <div style="color:#e8e8e0;font-size:14px;">3. Tap "I need help" the moment the urge hits</div>
          <div style="color:#e8e8e0;font-size:14px;">4. Argue back. That's the point.</div>
        </div>
      </div>
      <p style="color:#888;line-height:1.8;margin-bottom:8px;">
        Install delimt on your home screen for the full experience —
        open delimt.com on your phone and tap "Add to Home Screen."
      </p>
      <p style="color:#888;line-height:1.8;">
        Questions or feedback? Just reply. We read everything.
      </p>
      <div style="border-top:1px solid #1a1a1a;padding-top:24px;margin-top:40px;">
        <a href="https://delimt.com/app" style="color:#FF3333;font-size:12px;letter-spacing:2px;text-decoration:none;">Open delimt →</a>
      </div>
    </div>
  `,
},
    howItWorks: {
  subject: "here's how delimt actually works",
  html: `
    <div style="background:#080808;color:#e8e8e0;font-family:'Courier New',monospace;max-width:560px;margin:0 auto;padding:40px 32px;">
      <div style="color:#FF3333;font-size:11px;letter-spacing:4px;margin-bottom:32px;">⚡ DELIMT · DAY 3</div>
      <h1 style="font-size:28px;font-weight:900;margin-bottom:24px;line-height:1.2;">
        Most apps assume<br/>
        <span style="color:#FF3333;">willpower is the problem.</span>
      </h1>
      <p style="color:#888;line-height:1.8;margin-bottom:20px;">It's not.</p>
      <p style="color:#888;line-height:1.8;margin-bottom:20px;">
        It's the moment — that 1am scroll, that checkout button,
        that text you almost sent at midnight.
      </p>
      <p style="color:#888;line-height:1.8;margin-bottom:32px;">
        delimt intercepts that exact moment with an argument
        built specifically around YOU.
      </p>
      <div style="display:flex;flex-direction:column;gap:24px;margin-bottom:32px;">
        <div style="display:flex;gap:16px;">
          <div style="color:#FF3333;font-size:11px;min-width:28px;padding-top:2px;">01</div>
          <div>
            <div style="font-weight:700;margin-bottom:6px;color:#e8e8e0;">Tell delimt your weakness</div>
            <div style="color:#666;font-size:14px;line-height:1.7;">Your habit, your usual excuses, your real reason to stop.</div>
          </div>
        </div>
        <div style="display:flex;gap:16px;">
          <div style="color:#FF3333;font-size:11px;min-width:28px;padding-top:2px;">02</div>
          <div>
            <div style="font-weight:700;margin-bottom:6px;color:#e8e8e0;">Hit your trigger moment</div>
            <div style="color:#666;font-size:14px;line-height:1.7;">Open Instagram at 1am? Hovering on checkout? delimt intercepts you instantly.</div>
          </div>
        </div>
        <div style="display:flex;gap:16px;">
          <div style="color:#FF3333;font-size:11px;min-width:28px;padding-top:2px;">03</div>
          <div>
            <div style="font-weight:700;margin-bottom:6px;color:#e8e8e0;">The AI argues back</div>
            <div style="color:#666;font-size:14px;line-height:1.7;">A personalised argument using your own psychology against your bad habits.</div>
          </div>
        </div>
      </div>
      <p style="color:#888;line-height:1.8;">
        One more email in 4 days — we'll ask you one question that shapes the product.
      </p>
      <div style="border-top:1px solid #1a1a1a;padding-top:24px;margin-top:40px;">
        <a href="https://delimt.com" style="color:#FF3333;font-size:12px;letter-spacing:2px;text-decoration:none;">delimt.com</a>
        <p style="color:#333;font-size:11px;margin-top:8px;">You're on the delimt waitlist. <a href="#" style="color:#444;">Unsubscribe</a></p>
      </div>
    </div>
  `,
},
shapeIt: {
  subject: "help us build this",
  html: `
    <div style="background:#080808;color:#e8e8e0;font-family:'Courier New',monospace;max-width:560px;margin:0 auto;padding:40px 32px;">
      <div style="color:#FF3333;font-size:11px;letter-spacing:4px;margin-bottom:32px;">⚡ DELIMT · DAY 7</div>
      <h1 style="font-size:28px;font-weight:900;margin-bottom:24px;line-height:1.2;">
        One question.<br/>
        <span style="color:#FF3333;">Answer it honestly.</span>
      </h1>
      <p style="color:#888;line-height:1.8;margin-bottom:32px;">
        Before we launch, we want to know:
      </p>
      <div style="background:#0f0f0f;border:1px solid #222;border-radius:8px;padding:32px;margin-bottom:32px;text-align:center;">
        <p style="font-size:18px;font-weight:700;color:#e8e8e0;line-height:1.6;margin:0;">
          What is the one habit you most want<br/>
          <span style="color:#FF3333;">delimt to fight for you?</span>
        </p>
      </div>
      <p style="color:#888;line-height:1.8;margin-bottom:16px;">Just hit reply. One sentence is enough.</p>
      <p style="color:#888;line-height:1.8;">We read every response. Your answer directly shapes what we build first.</p>
      <div style="border-top:1px solid #1a1a1a;padding-top:24px;margin-top:40px;">
        <a href="https://delimt.com" style="color:#FF3333;font-size:12px;letter-spacing:2px;text-decoration:none;">delimt.com</a>
        <p style="color:#333;font-size:11px;margin-top:8px;">You're on the delimt waitlist. <a href="#" style="color:#444;">Unsubscribe</a></p>
      </div>
    </div>
  `,
},
v1Launch: {
  subject: "delimt V1 is live — you're first in.",
  html: `
    <div style="background:#080808;color:#e8e8e0;font-family:'Courier New',monospace;max-width:560px;margin:0 auto;padding:40px 32px;">
      <div style="color:#FF3333;font-size:11px;letter-spacing:4px;margin-bottom:32px;">⚡ DELIMT · V1 LIVE</div>

      <h1 style="font-size:28px;font-weight:900;margin-bottom:24px;line-height:1.2;">
        You waited.<br/>
        <span style="color:#FF3333;">It's ready.</span>
      </h1>

      <p style="color:#888;line-height:1.8;margin-bottom:20px;">
        delimt V1 is live. You're one of the first people to ever use it —
        and that means your feedback matters more than anyone else's.
      </p>

      <p style="color:#888;line-height:1.8;margin-bottom:32px;">
        Here's what V1 can do right now:
      </p>

      <div style="background:#0f0f0f;border:1px solid #222;border-radius:8px;padding:24px;margin-bottom:32px;">
        <div style="font-size:11px;letter-spacing:3px;color:#FF3333;margin-bottom:16px;">WHAT'S LIVE</div>
        <div style="display:flex;flex-direction:column;gap:10px;">
          ${[
            "Add habits with your personal psychology profile",
            "AI interventions that argue back using your own words",
            "Streak tracking — resisted or gave in",
            "Intervention history and success rate",
            "Installs on your phone like a native app (PWA)",
          ].map(p => `
            <div style="display:flex;gap:10px;align-items:flex-start;">
              <span style="color:#FF3333;margin-top:2px;">✓</span>
              <span style="color:#e8e8e0;font-size:14px;line-height:1.6;">${p}</span>
            </div>
          `).join("")}
        </div>
      </div>

      <div style="background:#0a0f0a;border:1px solid #1a3a1a;border-radius:8px;padding:24px;margin-bottom:32px;">
        <div style="font-size:11px;letter-spacing:3px;color:#4CAF50;margin-bottom:16px;">HOW TO INSTALL ON YOUR PHONE</div>
        <div style="color:#888;font-size:13px;line-height:1.9;">
          <strong style="color:#e8e8e0;">Android:</strong> Open delimt.com in Chrome → three-dot menu → Add to Home Screen<br/>
          <strong style="color:#e8e8e0;">iPhone:</strong> Open delimt.com in Safari → Share button → Add to Home Screen
        </div>
      </div>

      <p style="color:#888;line-height:1.8;margin-bottom:24px;">
        This is V1. It's intentionally focused. The Chrome Extension,
        push notifications, and mobile app are coming — but the core
        intervention loop is live and working right now.
      </p>

      <p style="color:#888;line-height:1.8;margin-bottom:32px;">
        <strong style="color:#e8e8e0;">One ask:</strong> Use it for 3 days and reply to this email
        with your honest reaction. What worked? What felt off?
        What do you wish it did? Every reply shapes V2.
      </p>

      <a href="https://delimt.com/auth"
        style="display:block;text-align:center;padding:16px 32px;background:#FF3333;color:#fff;text-decoration:none;border-radius:8px;font-weight:700;font-size:14px;letter-spacing:1px;margin-bottom:24px;">
        Start using delimt →
      </a>

      <p style="color:#555;font-size:12px;text-align:center;line-height:1.6;">
        You joined the delimt waitlist — this is what you've been waiting for.
      </p>

      <div style="border-top:1px solid #1a1a1a;padding-top:24px;margin-top:32px;">
        <a href="https://delimt.com" style="color:#FF3333;font-size:12px;letter-spacing:2px;text-decoration:none;">delimt.com</a>
        <p style="color:#333;font-size:11px;margin-top:8px;">
          You're receiving this because you joined the delimt waitlist.
        </p>
      </div>
    </div>
  `,
},
  };

  const template = templates[type];
  if (!template) return res.status(400).json({ error: "Invalid email type" });

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization" : `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "delimt <hello@delimt.com>",
        to: [to],
        subject: template.subject,
        html: template.html,
      }),
    });
    const data = await response.json();
    if (!response.ok) {
      console.error("Resend error:", data);
      return res.status(500).json({ error: data });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("Handler error:", err);
    return res.status(500).json({ error: err.message });
  }
}
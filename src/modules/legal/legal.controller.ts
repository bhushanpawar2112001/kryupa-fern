import { Controller, Get, Header } from '@nestjs/common';

const APP_NAME = 'Kryupa';
const APP_EMAIL = 'contact@kryupa.app';
const APP_WEBSITE = 'https://api.aawashyak.com';
const LAST_UPDATED = 'September 18, 2026';

const HTML_SHELL = (title: string, body: string) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>${title} — ${APP_NAME}</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;
         background:#f7faf8;color:#0f2419;line-height:1.7;font-size:16px}
    .wrap{max-width:780px;margin:0 auto;padding:48px 24px 80px}
    header{border-bottom:2px solid #2d7a4f;padding-bottom:24px;margin-bottom:36px}
    .logo{display:flex;align-items:center;gap:10px;margin-bottom:12px}
    .logo span.leaf{font-size:28px}
    .logo span.name{font-size:22px;font-weight:700;color:#2d7a4f;letter-spacing:2px}
    h1{font-size:28px;font-weight:700;color:#0f2419;margin-bottom:6px}
    .meta{font-size:13px;color:#4a6553}
    h2{font-size:18px;font-weight:600;color:#0f2419;margin:32px 0 10px}
    p{margin-bottom:14px;color:#2a3d2f}
    ul{margin:8px 0 14px 20px}
    ul li{margin-bottom:6px}
    a{color:#2d7a4f;text-decoration:none}
    a:hover{text-decoration:underline}
    .badge{display:inline-block;background:#eaf5ee;color:#2d7a4f;border:1px solid #b7dfc8;
           border-radius:20px;padding:4px 14px;font-size:13px;font-weight:600;margin-bottom:16px}
    footer{border-top:1px solid #dde7e2;margin-top:48px;padding-top:20px;
           font-size:13px;color:#8faf99;text-align:center}
  </style>
</head>
<body>
<div class="wrap">
  <header>
    <div class="logo"><span class="leaf">🌿</span><span class="name">kryupa</span></div>
    <h1>${title}</h1>
    <div class="meta">Last updated: ${LAST_UPDATED}</div>
  </header>
  ${body}
  <footer>
    &copy; ${new Date().getFullYear()} ${APP_NAME} &mdash;
    <a href="${APP_WEBSITE}/privacy">Privacy Policy</a> &middot;
    <a href="${APP_WEBSITE}/terms">Terms of Service</a> &middot;
    <a href="mailto:${APP_EMAIL}">${APP_EMAIL}</a>
  </footer>
</div>
</body>
</html>`;

@Controller()
export class LegalController {
  // ── Privacy Policy ────────────────────────────────────────────────────────
  @Get('privacy')
  @Header('Content-Type', 'text/html; charset=utf-8')
  @Header('Cache-Control', 'public, max-age=86400')
  privacy(): string {
    return HTML_SHELL(
      'Privacy Policy',
      `
      <span class="badge">Required by Google Play &amp; Apple App Store</span>

      <p>${APP_NAME} ("we", "us", or "our") operates the Kryupa mobile application (the "App").
      This page informs you of our policies regarding the collection, use, and disclosure of
      personal data when you use our App.</p>

      <h2>1. Information We Collect</h2>
      <p>We collect the following categories of information:</p>
      <ul>
        <li><strong>Account information:</strong> email address, display name, and profile photo
            obtained via Google Sign-In or email magic link (Firebase Authentication).</li>
        <li><strong>Health profile data:</strong> dietary preferences, allergies, medical
            conditions, and medications that you voluntarily enter to personalise product
            scores. This data is stored on our servers and is never sold.</li>
        <li><strong>Scan history &amp; favourites:</strong> barcodes you scan and products you
            save, used to power your personal history and favourites lists.</li>
        <li><strong>Device information:</strong> a stable device identifier used for guest
            sessions and crash reporting only.</li>
        <li><strong>Usage data:</strong> anonymous analytics about which features are used,
            to help us improve the App. No personally identifiable information is included.</li>
      </ul>

      <h2>2. How We Use Your Information</h2>
      <ul>
        <li>To provide and personalise the App's health scoring features.</li>
        <li>To maintain your scan history, favourites, and health profile.</li>
        <li>To authenticate you securely via Firebase.</li>
        <li>To improve the App based on aggregate, anonymous usage patterns.</li>
        <li>To respond to support requests sent to our email.</li>
      </ul>

      <h2>3. Data Sharing</h2>
      <p>We do <strong>not</strong> sell, trade, or rent your personal information. We share
      data only with:</p>
      <ul>
        <li><strong>Firebase (Google LLC)</strong> — for authentication and crash analytics.</li>
        <li><strong>MongoDB Atlas (MongoDB, Inc.)</strong> — for secure cloud database storage.</li>
        <li><strong>Open Food Facts</strong> — public barcode data is queried from this
            open-source database; no personal data is sent.</li>
      </ul>

      <h2>4. Data Retention</h2>
      <p>We retain your account and health profile data for as long as your account is active.
      You may delete your account and all associated data at any time from the Profile screen
      or by emailing <a href="mailto:${APP_EMAIL}">${APP_EMAIL}</a>.</p>

      <h2>5. Security</h2>
      <p>We use industry-standard security measures including JWT authentication, bcrypt
      password hashing, TLS/HTTPS for all data in transit, and encrypted storage for
      sensitive credentials. No method of transmission over the internet is 100% secure,
      and we cannot guarantee absolute security.</p>

      <h2>6. Children's Privacy</h2>
      <p>Our App is not directed to children under the age of 13. We do not knowingly collect
      personal information from children. If you believe your child has provided us with
      personal data, please contact us immediately.</p>

      <h2>7. Third-Party Links</h2>
      <p>The App may display links to third-party websites (e.g., Open Food Facts product
      pages). We are not responsible for the privacy practices of those sites.</p>

      <h2>8. Your Rights</h2>
      <p>Depending on your location, you may have the right to access, correct, or delete
      your personal data. To exercise any of these rights, email
      <a href="mailto:${APP_EMAIL}">${APP_EMAIL}</a>.</p>

      <h2>9. Changes to This Policy</h2>
      <p>We may update this Privacy Policy from time to time. We will notify you of any
      significant changes by updating the "Last updated" date above. Continued use of the
      App after changes constitutes acceptance of the updated policy.</p>

      <h2>10. Contact Us</h2>
      <p>If you have questions about this Privacy Policy, please contact us at:<br/>
      <a href="mailto:${APP_EMAIL}">${APP_EMAIL}</a></p>
      `,
    );
  }

  // ── Terms of Service ──────────────────────────────────────────────────────
  @Get('terms')
  @Header('Content-Type', 'text/html; charset=utf-8')
  @Header('Cache-Control', 'public, max-age=86400')
  terms(): string {
    return HTML_SHELL(
      'Terms of Service',
      `
      <p>By downloading or using the ${APP_NAME} App, you agree to be bound by these Terms of
      Service. Please read them carefully.</p>

      <h2>1. Acceptance of Terms</h2>
      <p>These Terms govern your access to and use of the Kryupa mobile application and
      related services. If you do not agree to these Terms, do not use the App.</p>

      <h2>2. Description of Service</h2>
      <p>Kryupa provides health scores and ingredient analysis for consumer products by
      combining data from public databases (Open Food Facts) and our own scoring engine.
      Scores are for <strong>informational purposes only</strong> and do not constitute
      medical, nutritional, or professional advice.</p>

      <h2>3. User Accounts</h2>
      <ul>
        <li>You are responsible for maintaining the confidentiality of your account.</li>
        <li>You must provide accurate information when creating an account.</li>
        <li>You may not use another person's account without permission.</li>
        <li>You may delete your account at any time from the Profile screen.</li>
      </ul>

      <h2>4. Acceptable Use</h2>
      <p>You agree not to:</p>
      <ul>
        <li>Use the App for any unlawful purpose.</li>
        <li>Attempt to reverse-engineer, hack, or disrupt the App or its servers.</li>
        <li>Submit false or misleading product data.</li>
        <li>Use automated tools to scrape or excessively query our API.</li>
      </ul>

      <h2>5. Disclaimer of Warranties</h2>
      <p>The App is provided "as is" without warranty of any kind. We do not warrant that
      product scores are accurate, complete, or suitable for your specific health needs.
      Always consult a qualified healthcare professional before making dietary or health
      decisions.</p>

      <h2>6. Limitation of Liability</h2>
      <p>To the maximum extent permitted by law, ${APP_NAME} shall not be liable for any
      indirect, incidental, special, or consequential damages arising from your use of
      the App.</p>

      <h2>7. Intellectual Property</h2>
      <p>All content, branding, and code in the App is the property of ${APP_NAME} and
      may not be reproduced without permission. Product data sourced from Open Food Facts
      is licensed under the Open Database License (ODbL).</p>

      <h2>8. Changes to Terms</h2>
      <p>We reserve the right to modify these Terms at any time. Continued use of the App
      after changes are posted constitutes acceptance of the new Terms.</p>

      <h2>9. Governing Law</h2>
      <p>These Terms are governed by the laws of India. Any disputes shall be resolved in
      the courts of Pune, Maharashtra.</p>

      <h2>10. Contact</h2>
      <p>For questions about these Terms, contact us at:
      <a href="mailto:${APP_EMAIL}">${APP_EMAIL}</a></p>
      `,
    );
  }
}

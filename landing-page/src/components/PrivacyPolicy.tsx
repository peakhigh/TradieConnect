import React from 'react';

const PrivacyPolicy = () => {
  return (
    <div className="legal-content">
      <h2>Privacy Policy</h2>
      <p>Effective Date: 01-Jan-2026</p>

      <h3>Introduction</h3>
      <p>
        At TradieConnect, we respect your privacy and are committed to
        protecting it. This Privacy Policy explains how we collect, use, and
        protect your personal information when you use our web and mobile app.
      </p>

      <h3>Information Collection</h3>
      <p>We collect the following types of information:</p>
      <ul>
        <li>
          <strong>Account Information</strong> — name, email, phone number, and
          whether you join as a customer or a tradie.
        </li>
        <li>
          <strong>Job &amp; Quote Data</strong> — service requests you post,
          quotes you submit, and messages exchanged through the platform.
        </li>
        <li>
          <strong>Payment Data</strong> — wallet balance and transaction history
          for credit purchases and unlocks (card details are handled by our
          payment provider, not stored by us).
        </li>
        <li>
          <strong>Device &amp; Analytics Data</strong> — device type, operating
          system, and anonymised performance and crash logs.
        </li>
      </ul>

      <h3>Information Use</h3>
      <p>We use your information to:</p>
      <ul>
        <li>Match customers with relevant local tradies</li>
        <li>Process credit purchases, unlocks and quotes</li>
        <li>Send job notifications and account updates</li>
        <li>Improve our marketplace and platform performance</li>
      </ul>

      <h3>Data Sharing</h3>
      <p>
        Contact details (such as address and phone number) are shared between a
        customer and a tradie only after a quote has been accepted. We do not
        sell your personal information.
      </p>

      <h3>User Rights</h3>
      <p>You have the right to access, correct, or request deletion of your information.</p>

      <h3>Contact Us</h3>
      <p>If you have any questions, please contact us at hello@tradieconnect.app.</p>
    </div>
  );
};

export default PrivacyPolicy;

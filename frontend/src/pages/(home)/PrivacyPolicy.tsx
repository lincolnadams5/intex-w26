export default function Privacy() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <h1 className="mb-2">Privacy Policy</h1>
      <p className="text-[var(--color-on-surface-variant)] mb-8">
        Pag-asa Sanctuary is committed to protecting your personal data. This
        privacy policy explains how we collect, use, and safeguard your
        information when you use our website.
      </p>

      <div className="flex flex-col gap-4">

        {/* DATA COLLECTION */}
        <div className="bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] rounded-[var(--radius-lg)] p-6">
          <h2 className="text-xl mb-4">What data do we collect?</h2>
          <ul className="list-disc ml-5 flex flex-col gap-1 text-[var(--color-on-surface-variant)] text-sm">
            <li>Name and contact information (email)</li>
            <li>Donation details (amount, date, campaign)</li>
            <li>Account login information</li>
            <li>Basic website usage data (cookies, browser info)</li>
          </ul>
        </div>

        {/* HOW WE COLLECT */}
        <div className="bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] rounded-[var(--radius-lg)] p-6">
          <h2 className="text-xl mb-4">How do we collect your data?</h2>
          <ul className="list-disc ml-5 flex flex-col gap-1 text-[var(--color-on-surface-variant)] text-sm">
            <li>When you register or log in</li>
            <li>When you make a donation</li>
            <li>When you interact with our website</li>
            <li>Through cookies and browser tracking</li>
          </ul>
        </div>

        {/* HOW WE USE */}
        <div className="bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] rounded-[var(--radius-lg)] p-6">
          <h2 className="text-xl mb-4">How will we use your data?</h2>
          <ul className="list-disc ml-5 flex flex-col gap-1 text-[var(--color-on-surface-variant)] text-sm">
            <li>Process donations and manage accounts</li>
            <li>Improve our platform and services</li>
            <li>Communicate updates (if opted in)</li>
            <li>Ensure platform security and prevent fraud</li>
          </ul>
        </div>

        {/* STORAGE */}
        <div className="bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] rounded-[var(--radius-lg)] p-6">
          <h2 className="text-xl mb-4">How do we store your data?</h2>
          <p className="text-[var(--color-on-surface-variant)] text-sm">
            Your data is securely stored in protected databases. We take reasonable
            security measures to prevent unauthorized access. Data is retained only
            as long as necessary for operational and legal purposes.
          </p>
        </div>

        {/* MARKETING */}
        <div className="bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] rounded-[var(--radius-lg)] p-6">
          <h2 className="text-xl mb-4">Marketing</h2>
          <p className="text-[var(--color-on-surface-variant)] text-sm">
            We may send you updates about our programs and impact if you opt in. You
            can unsubscribe at any time.
          </p>
        </div>

        {/* RIGHTS */}
        <div className="bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] rounded-[var(--radius-lg)] p-6">
          <h2 className="text-xl mb-4">Your data protection rights</h2>
          <ul className="list-disc ml-5 flex flex-col gap-1 text-[var(--color-on-surface-variant)] text-sm">
            <li>Request access to your personal data</li>
            <li>Request correction of inaccurate data</li>
            <li>Request deletion of your data</li>
            <li>Request restriction of processing</li>
            <li>Object to data processing</li>
          </ul>
        </div>

        {/* COOKIES */}
        <div className="bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] rounded-[var(--radius-lg)] p-6">
          <h2 className="text-xl mb-4">Cookies</h2>
          <p className="text-[var(--color-on-surface-variant)] text-sm mb-4">
            Cookies are small text files stored on your device to improve your
            experience. We use cookies to keep you logged in and understand how users
            interact with our platform.
          </p>
          <p className="text-sm font-semibold text-[var(--color-on-surface)] mb-2">Types of cookies we use:</p>
          <ul className="list-disc ml-5 flex flex-col gap-1 text-[var(--color-on-surface-variant)] text-sm">
            <li>Essential cookies (login/session)</li>
            <li>Analytics cookies (usage tracking)</li>
          </ul>
        </div>

        {/* OTHER SITES */}
        <div className="bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] rounded-[var(--radius-lg)] p-6">
          <h2 className="text-xl mb-4">Privacy policies of other websites</h2>
          <p className="text-[var(--color-on-surface-variant)] text-sm">
            Our website may contain links to other websites. Our privacy policy
            applies only to our website.
          </p>
        </div>

        {/* CHANGES */}
        <div className="bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] rounded-[var(--radius-lg)] p-6">
          <h2 className="text-xl mb-4">Changes to our privacy policy</h2>
          <p className="text-[var(--color-on-surface-variant)] text-sm">
            We regularly review and update this policy. This page will reflect the
            latest version.
          </p>
        </div>

        {/* CONTACT */}
        <div className="bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] rounded-[var(--radius-lg)] p-6">
          <h2 className="text-xl mb-4">Contact us</h2>
          <p className="text-[var(--color-on-surface-variant)] text-sm">
            If you have questions about this privacy policy, contact us at:{" "}
            <a href="mailto:support@pagasa.org" className="text-[var(--color-primary)] font-medium">
              support@pagasa.org
            </a>
          </p>
        </div>

      </div>
    </div>
  );
}

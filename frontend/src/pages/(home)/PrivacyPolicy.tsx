export default function Privacy() {
    return (
      <div className="max-w-4xl mx-auto px-6 py-10">
        <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>

        <p className="mb-4">
          Pag-asa Sanctuary is committed to protecting your personal data. This
          privacy policy explains how we collect, use, and safeguard your
          information when you use our website.
        </p>

        {/* DATA COLLECTION */}
        <h2 className="text-xl font-semibold mt-6 mb-2">What data do we collect?</h2>
        <ul className="list-disc ml-6 mb-4">
          <li>Name and contact information (email)</li>
          <li>Donation details (amount, date, campaign)</li>
          <li>Account login information</li>
          <li>Basic website usage data (cookies, browser info)</li>
        </ul>

        {/* HOW WE COLLECT */}
        <h2 className="text-xl font-semibold mt-6 mb-2">How do we collect your data?</h2>
        <ul className="list-disc ml-6 mb-4">
          <li>When you register or log in</li>
          <li>When you make a donation</li>
          <li>When you interact with our website</li>
          <li>Through cookies and browser tracking</li>
        </ul>

        {/* HOW WE USE */}
        <h2 className="text-xl font-semibold mt-6 mb-2">How will we use your data?</h2>
        <ul className="list-disc ml-6 mb-4">
          <li>Process donations and manage accounts</li>
          <li>Improve our platform and services</li>
          <li>Communicate updates (if opted in)</li>
          <li>Ensure platform security and prevent fraud</li>
        </ul>

        {/* STORAGE */}
        <h2 className="text-xl font-semibold mt-6 mb-2">How do we store your data?</h2>
        <p className="mb-4">
          Your data is securely stored in protected databases. We take reasonable
          security measures to prevent unauthorized access. Data is retained only
          as long as necessary for operational and legal purposes.
        </p>

        {/* MARKETING */}
        <h2 className="text-xl font-semibold mt-6 mb-2">Marketing</h2>
        <p className="mb-4">
          We may send you updates about our programs and impact if you opt in. You
          can unsubscribe at any time.
        </p>

        {/* RIGHTS */}
        <h2 className="text-xl font-semibold mt-6 mb-2">Your data protection rights</h2>
        <ul className="list-disc ml-6 mb-4">
          <li>Request access to your personal data</li>
          <li>Request correction of inaccurate data</li>
          <li>Request deletion of your data</li>
          <li>Request restriction of processing</li>
          <li>Object to data processing</li>
        </ul>

        {/* COOKIES */}
        <h2 className="text-xl font-semibold mt-6 mb-2">Cookies</h2>
        <p className="mb-4">
          Cookies are small text files stored on your device to improve your
          experience. We use cookies to keep you logged in and understand how users
          interact with our platform.
        </p>

        <h3 className="font-semibold mt-4">Types of cookies we use:</h3>
        <ul className="list-disc ml-6 mb-4">
          <li>Essential cookies (login/session)</li>
          <li>Analytics cookies (usage tracking)</li>
        </ul>

        {/* OTHER SITES */}
        <h2 className="text-xl font-semibold mt-6 mb-2">
          Privacy policies of other websites
        </h2>
        <p className="mb-4">
          Our website may contain links to other websites. Our privacy policy
          applies only to our website.
        </p>

        {/* CHANGES */}
        <h2 className="text-xl font-semibold mt-6 mb-2">
          Changes to our privacy policy
        </h2>
        <p className="mb-4">
          We regularly review and update this policy. This page will reflect the
          latest version.
        </p>

        {/* CONTACT */}
        <h2 className="text-xl font-semibold mt-6 mb-2">Contact us</h2>
        <p className="mb-4">
          If you have questions about this privacy policy, contact us at:
          <br />
          <strong>support@pagasa.org</strong>
        </p>
      </div>
    );
  }

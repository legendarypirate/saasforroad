import React from 'react';
import Head from 'next/head';

export default function SupportPage() {
  return (
    <>
      <Head>
        <title>Support | Vlemjiin zam</title>
        <meta name="description" content="Contact support for Vlemjiin zam mobile app." />
      </Head>
      <main style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto' }}>
        <h1>Support</h1>
        <p>If you have any questions or need help with our service, feel free to reach out:</p>
        <ul>
          <li>
            📧 Email us at:{''} 
            <a href="mailto:support@vlemjiinzam.mn" style={{ color: '#0070f3' }}>
               support@vlemjiinzam.mn
            </a>
          </li>
          <li>📞 Phone: +976 9414-7878</li>
         
        </ul>
        <p>We typically respond within 24 hours.</p>
      </main>
    </>
  );
}

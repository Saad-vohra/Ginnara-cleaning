import type { Metadata } from "next";
import { PageHero, Prose } from "@/components/pages/PageHero";
import { LegalNav } from "@/components/pages/ContentPages";

export const metadata: Metadata = { title: "Privacy policy" };

export default function PrivacyPage() {
  return (
    <>
      <PageHero crumb="Privacy" title="Privacy policy" intro="How this demo handles your information. Sample content for a frontend prototype." />
      <section className="py-12 lg:py-16">
        <div className="container-site">
          <LegalNav active="privacy" />
          <Prose>
            <h2>Where your data lives</h2>
            <p>
              <strong>This prototype has no server or database.</strong> Everything you enter — accounts, bookings, addresses, messages — is saved in your own browser using localStorage. Nothing is transmitted to Ginnara or any third party.
            </p>
            <h2>What we store</h2>
            <ul>
              <li>Account details you create (name, email, phone, demo password).</li>
              <li>Bookings, saved addresses and preferences.</li>
              <li>Contact form and newsletter submissions, visible only in the demo admin on this device.</li>
            </ul>
            <h2 id="cookies" className="scroll-mt-28">Cookie management policy</h2>
            <p>When you first visit, we ask for your consent. <strong>Necessary</strong> cookies keep you signed in and remember your booking in progress. <strong>Preferences</strong>, <strong>statistics</strong> and <strong>marketing</strong> cookies are only used if you accept them, and you can change your choice any time with “Cookie settings” in the footer.</p>
            <p>Contact us at info@ginnaracleaning.com or +44 7346 739006 with any questions about your data.</p>
            <h2>Images</h2>
            <p>Photography is loaded from the Unsplash image CDN. Uploaded profile photos stay in your browser.</p>
            <h2>Deleting your data</h2>
            <p>You can delete your account from Account → Settings, use “Reset demo data” in the admin settings, or clear your browser&apos;s site data at any time.</p>
            <h2>Security notice</h2>
            <p>Demo sign-in is not secure authentication. Do not enter real passwords or personal information you wouldn&apos;t want stored in plain text on this device.</p>
          </Prose>
        </div>
      </section>
    </>
  );
}

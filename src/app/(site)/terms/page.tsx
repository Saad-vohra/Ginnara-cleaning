import type { Metadata } from "next";
import { PageHero, Prose } from "@/components/pages/PageHero";
import { LegalNav } from "@/components/pages/ContentPages";

export const metadata: Metadata = { title: "Terms of service" };

export default function TermsPage() {
  return (
    <>
      <PageHero crumb="Terms" title="Terms of service" intro="Last updated 1 November 2026. These sample terms are provided for this frontend demo only and are not a legal agreement." />
      <section className="py-12 lg:py-16">
        <div className="container-site">
          <LegalNav active="terms" />
          <Prose>
            <h2>1. About this demo</h2>
            <p>Ginnara is a frontend prototype of a home-cleaning marketplace. No real bookings, payments or background checks take place, and all data you enter is stored only in your browser&apos;s local storage.</p>
            <h2>2. Bookings</h2>
            <p>When you book a clean you request a service from an independent professional. Bookings are confirmed once a professional accepts them. Prices shown include our service and insurance fee.</p>
            <h2>3. Cancellations</h2>
            <ul>
              <li>Cancel more than 24 hours before the start time: free, with a full refund.</li>
              <li>Cancel between 24 and 4 hours before the start time: 50% of the booking value is refunded.</li>
              <li>Cancel less than 4 hours before the start time: no refund.</li>
              <li>You can reschedule free of charge up to 24 hours before the start time. After that, the booking can only be cancelled under the terms above.</li>
              <li>If your professional cancels, you&apos;ll be offered a replacement or a full refund.</li>
            </ul>
            <h2>4. Satisfaction guarantee</h2>
            <p>If you&apos;re not happy with your clean, contact us within 48 hours and we&apos;ll arrange for a professional to return and put it right at no cost.</p>
            <h2>5. Discount codes</h2>
            <p>Codes are single-use per booking, can carry a minimum spend and cannot be exchanged for cash.</p>
            <h2>6. Professionals</h2>
            <p>Professionals using Ginnara are self-employed. They are responsible for the quality of their work and must follow our community standards.</p>
            <h2>7. Liability</h2>
            <p>Each booking is covered by public liability insurance up to £5 million (illustrative). Nothing in these terms limits liability that cannot be limited by law.</p>
            <h2>8. Contact</h2>
            <p>Questions? Visit the Help centre or the Contact page.</p>
          </Prose>
        </div>
      </section>
    </>
  );
}

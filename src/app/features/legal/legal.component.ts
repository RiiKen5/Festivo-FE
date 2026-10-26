import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';

// Business details shown on the legal and contact pages.
// TODO(owner): replace every bracketed value before going live.
// As on the Udyam Registration Certificate
const BUSINESS = {
  legalName: 'Paathly',
  registration: 'Udyam Registration No. UDYAM-KR-02-0136814',
  address: 'No. 3, Sai Brindavan, Poojar Estate 1st Cross Road, Block 3, Bengaluru, Karnataka 560098, India',
  supportEmail: 'admin@paathly.in',
  supportPhone: '+91 63620 75832',
  grievanceOfficer: 'Grievance Officer',
  lastUpdated: '26 October 2026'
};

type Page = 'terms' | 'privacy' | 'refunds' | 'contact';

@Component({
  selector: 'app-legal',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `

    <main class="legal-page">
      <article class="legal">
        <nav class="legal-nav">
          <a routerLink="/terms" routerLinkActive="active">Terms</a>
          <a routerLink="/privacy" routerLinkActive="active">Privacy</a>
          <a routerLink="/refund-policy" routerLinkActive="active">Cancellations &amp; Refunds</a>
          <a routerLink="/contact" routerLinkActive="active">Contact</a>
        </nav>

        @switch (page) {
          @case ('terms') {
            <h1>Terms of Service</h1>
            <p class="updated">Last updated {{ b.lastUpdated }}</p>

            <p>Festivo is operated by {{ b.legalName }} ({{ b.registration }}), {{ b.address }} ("Festivo", "we"). By creating an account or using Festivo you agree to these terms.</p>

            <h2>1. What Festivo does</h2>
            <p>Festivo is a marketplace where organizers plan events, book independent service providers ("vendors") such as bakers, decorators and photographers, and sell or share event tickets. Vendors are independent businesses, not Festivo employees. Each vendor is responsible for the services they provide.</p>
            <p>Festivo is an intermediary: it connects organizers, vendors and guests and collects payments on their behalf. It is not a party to the agreement between an organizer and a vendor, and does not provide the services itself.</p>

            <h2>2. Accounts</h2>
            <p>You must give accurate information, keep your password private, and be at least 18 years old to book services, sell tickets or receive payouts. You are responsible for activity on your account. We may suspend accounts that break these terms or harm other users.</p>

            <h2>3. Bookings between organizers and vendors</h2>
            <ul>
              <li>An organizer sends a booking request; the vendor confirms it at their final price (their quote).</li>
              <li>Organizers pay online through Festivo. We hold the payment and release it to the vendor after the booking is completed. If the organizer doesn't mark it complete, it completes automatically 3 days after the event date.</li>
              <li>Vendors may also record cash or direct payments they receive. Festivo does not hold or guarantee those payments.</li>
              <li><strong>Arrival code.</strong> When a vendor accepts, the organizer gets a 4-digit code on their booking page. The vendor enters it when they arrive, which records that they came.</li>
              <li><strong>Reporting a problem.</strong> If a vendor doesn't arrive, or doesn't deliver what was agreed, the organizer can use "Report a problem" on the booking any time until it is completed (up to 3 days after the event). A no-show can be reported from the day of the event. Reporting freezes the vendor's payout.</li>
              <li><strong>Vendor reply.</strong> The vendor has 24 hours to reply with their side and evidence, such as photos. If they don't reply in time and did not enter the arrival code, the organizer is refunded in full automatically for what they paid online.</li>
              <li><strong>Festivo's decision.</strong> If the vendor replies, or entered the arrival code, Festivo reviews the booking, messages and evidence and decides: a full refund, a partial refund, or payment to the vendor. We tell both sides why.</li>
              <li><strong>No-shows.</strong> A verified no-show is shown on the vendor's profile and lowers their listings in search. Festivo may also deduct a penalty from the vendor's next payout, or suspend the account.</li>
              <li>Cancellations and refunds follow our <a routerLink="/refund-policy">Cancellation &amp; Refund Policy</a>.</li>
            </ul>

            <h2>4. Fees</h2>
            <p>Festivo charges vendors a commission of 15% on bookings paid online, and event organizers a fee of 5% on tickets sold. Fees are deducted before payout. An organizer may choose to add the ticket fee to the price guests pay instead; the full price is shown before payment. Organizers and attendees pay the listed price; we do not add hidden charges.</p>

            <h2>5. Payouts</h2>
            <p>Vendors and organizers must add UPI or bank details to receive payouts. Payouts are usually sent within 7 working days of becoming due. We may hold, freeze or reverse a payout while a reported problem or suspected fraud is open, and until it is settled.</p>

            <h2>6. Events and tickets</h2>
            <p>Organizers are responsible for their events, including venue permissions, safety and any applicable licences. A ticket admits the number of people it was bought for. Guests can buy tickets without an account by giving their name and mobile number; the ticket is kept in the browser they bought it on, so they should save their check-in code. Private events are only visible to people with the organizer's invite link.</p>

            <h2>7. Content and reviews</h2>
            <p>You own what you post, and give Festivo permission to display it on the platform. Reviews can only be left for completed bookings and must be honest. We remove content that is unlawful, abusive, misleading or that infringes others' rights.</p>

            <h2>8. Prohibited use</h2>
            <p>Do not use Festivo to take bookings or payments off-platform to avoid fees after meeting through Festivo, to post false listings, to harass others, or for anything unlawful.</p>

            <h2>9. Liability</h2>
            <p>Festivo provides the marketplace "as is". To the extent the law allows, our liability for any claim is limited to the fees we earned on the booking or ticket concerned. Nothing in these terms limits rights you have under the Consumer Protection Act, 2019.</p>

            <h2>10. Disputes and governing law</h2>
            <p>Contact us first at {{ b.supportEmail }} and we will try to resolve the issue. These terms are governed by the laws of India, and courts in Bengaluru, Karnataka have jurisdiction.</p>

            <h2>11. Changes</h2>
            <p>We may update these terms. We will notify you of significant changes; continuing to use Festivo means you accept them.</p>
          }

          @case ('privacy') {
            <h1>Privacy Policy</h1>
            <p class="updated">Last updated {{ b.lastUpdated }}</p>

            <p>This policy explains what personal data {{ b.legalName }} collects through Festivo and how we use it, in line with the Digital Personal Data Protection Act, 2023.</p>

            <h2>What we collect</h2>
            <ul>
              <li><strong>Account details:</strong> name, email, phone, city, profile photo and password (stored hashed).</li>
              <li><strong>Activity:</strong> events you create or RSVP to, bookings, messages, reviews and notifications.</li>
              <li><strong>Payments:</strong> payments are processed by Razorpay. We store payment references and amounts, never your card or UPI PIN.</li>
              <li><strong>Payout details:</strong> UPI ID or bank account, for vendors and organizers who receive money.</li>
              <li><strong>Technical data:</strong> IP address and basic logs, to keep the service secure.</li>
              <li><strong>RSVPs without an account:</strong> the name you give, how many people you're bringing and, if you choose, your mobile number. Only the event's organizers see them; they are never shared with vendors or anyone else. Your browser keeps a private code so you can change your answer.</li>
              <li><strong>How you found us:</strong> the link or website that first brought you to Festivo (for example a campaign tag or a shared link) and the first page you visited, saved in your browser and with your account when you sign up. We also use Google Analytics, which sets cookies, to see which pages and features are used; it receives your account ID but not your name, email or phone number. You can block it with your browser's cookie or tracker settings.</li>
            </ul>

            <h2>How we use it</h2>
            <p>To run the marketplace (bookings, tickets, messaging, payouts), to send account and booking emails, to prevent fraud and abuse, and to improve Festivo. We do not sell your personal data.</p>

            <h2>Who we share it with</h2>
            <ul>
              <li>Other users, as needed for a booking or event (for example, a vendor sees the organizer's name and contact details on a booking).</li>
              <li>Service providers who help us run Festivo: Razorpay (payments), Google (analytics and sign-in), our hosting and database providers, and our email provider.</li>
              <li>Authorities, when required by law.</li>
            </ul>

            <h2>How long we keep it</h2>
            <p>We keep account data while your account is active. Payment and payout records are kept for as long as tax and accounting laws require (generally 8 years).</p>

            <h2>Your rights</h2>
            <p>You can view and update your details on your profile, and ask us to correct or delete your data, by emailing {{ b.supportEmail }}. Some records (such as payments) may need to be kept by law.</p>

            <h2>Grievance officer</h2>
            <p>{{ b.grievanceOfficer }}, {{ b.legalName }}, {{ b.address }}. Email: {{ b.supportEmail }}.</p>
          }

          @case ('refunds') {
            <h1>Cancellation &amp; Refund Policy</h1>
            <p class="updated">Last updated {{ b.lastUpdated }}</p>

            <h2>Vendor bookings</h2>
            <p>These rules apply to amounts paid online through Festivo:</p>
            <table>
              <thead><tr><th>Who cancels</th><th>When</th><th>Refund to organizer</th></tr></thead>
              <tbody>
                <tr><td>Vendor</td><td>Any time</td><td>100%</td></tr>
                <tr><td>Organizer</td><td>7 or more days before the event</td><td>100%</td></tr>
                <tr><td>Organizer</td><td>2 to 7 days before the event</td><td>50%</td></tr>
                <tr><td>Organizer</td><td>Less than 48 hours before the event</td><td>No refund</td></tr>
              </tbody>
            </table>
            <p>When an organizer cancels a whole event, its vendor bookings are cancelled under the organizer rows above.</p>

            <h2>Event tickets</h2>
            <ul>
              <li>If the organizer cancels the event, every ticket is refunded in full.</li>
              <li>If you cancel your ticket 48 hours or more before the event, you get a full refund. Within 48 hours, tickets are non-refundable.</li>
            </ul>

            <h2>How refunds are paid</h2>
            <p>Refunds are issued automatically to the original payment method through Razorpay when the cancellation is made. Banks usually credit them within 5–7 working days.</p>

            <h2>Problems with a service</h2>
            <p>If a vendor didn't arrive, or didn't deliver what was agreed, use <strong>Report a problem</strong> on the booking before it is completed (within 3 days of the event). The vendor's payout is frozen and they have 24 hours to reply. If they don't reply, and didn't enter your arrival code, you are refunded in full for what you paid online, automatically. Otherwise Festivo reviews both sides and decides on a full refund, a partial refund or payment to the vendor. You can also email {{ b.supportEmail }}.</p>
            <p>Cash or direct payments made to the vendor outside Festivo can't be refunded by Festivo.</p>
          }

          @case ('contact') {
            <h1>Contact Us</h1>
            <p>We're here to help with bookings, payments, payouts and your account.</p>
            <dl class="contact">
              <dt>Email</dt><dd><a [href]="'mailto:' + b.supportEmail">{{ b.supportEmail }}</a></dd>
              <dt>Phone</dt><dd>{{ b.supportPhone }} (Mon–Sat, 10am–7pm IST)</dd>
              <dt>Business</dt><dd>{{ b.legalName }} · {{ b.registration }}</dd>
              <dt>Address</dt><dd>{{ b.address }}</dd>
            </dl>
            <p>For a booking or payment issue, include the booking link so we can help faster.</p>
          }
        }
      </article>
    </main>
  `,
  styles: [`
    @use '../../../styles/variables' as *;

    .legal-page {
      background: $bg-secondary;
      min-height: calc(100vh - #{$navbar-height});
      padding: $spacing-8 $spacing-4;
    }

    .legal {
      max-width: 760px;
      margin: 0 auto;
      background: $bg-primary;
      border-radius: $radius-lg;
      box-shadow: $shadow-sm;
      padding: $spacing-8;
      line-height: $line-height-relaxed;
      color: $text-primary;

      h1 { font-size: $font-size-3xl; margin: $spacing-4 0 $spacing-1; }
      h2 { font-size: $font-size-lg; margin: $spacing-6 0 $spacing-2; }
      ul { padding-left: $spacing-6; }
      li { margin-bottom: $spacing-1; }
      a { color: $primary-700; text-decoration: underline; text-underline-offset: 2px; }
    }

    .legal-nav {
      display: flex;
      flex-wrap: wrap;
      gap: $spacing-4;
      font-size: $font-size-sm;
      border-bottom: 1px solid $border-light;
      padding-bottom: $spacing-3;

      a { color: $text-secondary; text-decoration: none; }
      a.active { color: $primary-600; font-weight: $font-weight-semibold; }
    }

    .updated {
      color: $text-secondary;
      font-size: $font-size-sm;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      font-size: $font-size-sm;
      margin: $spacing-3 0;

      th, td {
        text-align: left;
        padding: $spacing-2;
        border-bottom: 1px solid $border-light;
      }
    }

    .contact {
      display: grid;
      grid-template-columns: 100px 1fr;
      gap: $spacing-2 $spacing-4;

      dt { color: $text-secondary; }
      dd { margin: 0; }
    }

    @media (max-width: 600px) {
      .legal { padding: $spacing-5 $spacing-4; }
    }
  `]
})
export class LegalComponent {
  page: Page = inject(ActivatedRoute).snapshot.data['page'];
  b = BUSINESS;
}

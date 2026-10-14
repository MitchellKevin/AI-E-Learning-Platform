import type { Metadata } from "next";
import { getPlans } from "@/lib/data/marketing";
import {
  getBillingDetails,
  getInvoices,
  getOrgUsers,
  getPaymentMethod,
  getSubscription,
  seatUsage,
} from "@/lib/data/admin-org";
import { SubscriptionAdmin } from "@/components/admin/org/billing/subscription-admin";
import { PaymentMethod } from "@/components/admin/org/billing/payment-method";
import { BillingDetailsForm } from "@/components/admin/org/billing/billing-details-form";
import { Invoices } from "@/components/admin/org/billing/invoices";
import { AdminPage } from "@/components/admin/org/admin-page";

export const metadata: Metadata = { title: "Abonnement · Beheer · AI Academy" };

// De naar-rato-berekening hangt af van vandaag.
export const dynamic = "force-dynamic";

export default async function SubscriptionPage() {
  const [subscription, plans, users, paymentMethod, billingDetails, invoices] = await Promise.all([
    getSubscription(),
    getPlans(),
    getOrgUsers(),
    getPaymentMethod(),
    getBillingDetails(),
    getInvoices(),
  ]);
  const usage = seatUsage(users, subscription.seats);

  return (
    <AdminPage>
      <SubscriptionAdmin
        initial={subscription}
        plans={plans}
        seatsUsed={usage.active + usage.invited}
        today={new Date().toISOString()}
        payment={<PaymentMethod initial={paymentMethod} />}
      >
        <BillingDetailsForm initial={billingDetails} />
        <Invoices invoices={invoices} />
      </SubscriptionAdmin>
    </AdminPage>
  );
}

import PaymentCallbackClient from "./payment-callback-client";

type PaymentCallbackPageProps = {
  searchParams: Promise<{
    reference?: string;
    trxref?: string;
  }>;
};

export default async function PaymentCallbackPage({
  searchParams,
}: PaymentCallbackPageProps) {
  const params = await searchParams;
  const reference = params.reference ?? params.trxref ?? "";

  return <PaymentCallbackClient reference={reference} />;
}

"use client";

import { useState } from "react";
import { useFormState } from "react-dom";
import { t, type Locale } from "@/lib/i18n/dictionaries";
import { placeOrder } from "@/lib/actions/checkout";
import { TextField } from "@/components/ui/text-field";
import { Button } from "@/components/ui/button";

interface AddressOption {
  id: string;
  label: string;
  address_line: string;
}

interface BankDetails {
  bank_name?: string;
  account_name?: string;
  account_number?: string;
  instructions?: string;
}

export function CheckoutForm({
  locale,
  cartId,
  addresses,
  defaultPhone,
  bankDetails,
}: {
  locale: Locale;
  cartId: string;
  addresses: AddressOption[];
  defaultPhone: string;
  bankDetails?: BankDetails | null;
}) {
  const strings = t(locale);
  const [state, formAction] = useFormState(placeOrder, {});
  const [paymentMethod, setPaymentMethod] = useState("cash");

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <input type="hidden" name="cartId" value={cartId} />

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-sm font-semibold text-ink-700">{strings.checkout.deliveryMethod}</legend>
        {[
          { value: "door_delivery", label: strings.checkout.doorDelivery },
          { value: "pickup", label: strings.checkout.pickup },
          { value: "scheduled", label: strings.checkout.scheduled },
        ].map((option, i) => (
          <label
            key={option.value}
            className="flex min-h-touch items-center gap-2 rounded-2xl border border-sand-200 px-3 py-2 has-[:checked]:border-ocean-500"
          >
            <input type="radio" name="deliveryMethod" value={option.value} defaultChecked={i === 0} className="h-5 w-5" />
            <span className="text-ink-900">{option.label}</span>
          </label>
        ))}
      </fieldset>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-sm font-semibold text-ink-700">{strings.checkout.address}</legend>
        {addresses.length === 0 ? (
          <p className="text-sm text-coral-600">{strings.checkout.addAddress}</p>
        ) : (
          addresses.map((address, i) => (
            <label
              key={address.id}
              className="flex min-h-touch items-center gap-2 rounded-2xl border border-sand-200 px-3 py-2 has-[:checked]:border-ocean-500"
            >
              <input
                type="radio"
                name="deliveryAddressId"
                value={address.id}
                defaultChecked={i === 0}
                className="h-5 w-5"
              />
              <span className="flex flex-col text-sm">
                <span className="font-medium capitalize text-ink-900">{address.label}</span>
                <span className="text-ink-500">{address.address_line}</span>
              </span>
            </label>
          ))
        )}
      </fieldset>

      <TextField
        name="contactPhone"
        type="tel"
        label={strings.checkout.contactPhone}
        defaultValue={defaultPhone}
        required
      />

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-sm font-semibold text-ink-700">{strings.checkout.paymentMethod}</legend>
        {[
          { value: "cash", label: strings.checkout.cash },
          { value: "wallet", label: strings.checkout.wallet },
          { value: "bank_transfer", label: "Bank transfer" },
        ].map((option, i) => (
          <label
            key={option.value}
            className="flex min-h-touch items-center gap-2 rounded-2xl border border-sand-200 px-3 py-2 has-[:checked]:border-ocean-500"
          >
            <input
              type="radio"
              name="paymentMethod"
              value={option.value}
              defaultChecked={i === 0}
              onChange={() => setPaymentMethod(option.value)}
              className="h-5 w-5"
            />
            <span className="text-ink-900">{option.label}</span>
          </label>
        ))}
      </fieldset>

      {paymentMethod === "bank_transfer" && bankDetails && (
        <div className="flex flex-col gap-1 rounded-2xl bg-ocean-50 p-4 text-sm text-ink-700">
          <p className="font-semibold text-ink-900">Transfer to:</p>
          {bankDetails.bank_name && <p>Bank: {bankDetails.bank_name}</p>}
          {bankDetails.account_name && <p>Account name: {bankDetails.account_name}</p>}
          {bankDetails.account_number && <p className="ltr-number">Account number: {bankDetails.account_number}</p>}
          {bankDetails.instructions && <p className="mt-1 text-ink-500">{bankDetails.instructions}</p>}
          <p className="mt-2 text-ink-500">
            After placing this order, upload your transfer slip on the order page. Staff will verify it before
            preparation begins.
          </p>
        </div>
      )}

      <TextField name="couponCode" label={strings.checkout.couponCode} placeholder="SAVE10" />

      {state.error && (
        <p role="alert" className="text-sm text-coral-600">
          {state.error}
        </p>
      )}

      <Button type="submit" disabled={addresses.length === 0}>
        {strings.checkout.placeOrder}
      </Button>
    </form>
  );
}

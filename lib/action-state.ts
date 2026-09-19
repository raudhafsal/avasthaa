// Shared shape across every action-state interface in this app
// (ActionState, CartActionState, PaymentActionState, ...) — they all
// happen to be exactly this, so one constant works for every
// useFormState call site without narrowing TS's inference to `{}`.
export const emptyActionState: {
  error?: string;
  success?: boolean;
  fieldErrors?: Record<string, string>;
} = {};

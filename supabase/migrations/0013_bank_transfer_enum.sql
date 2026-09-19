-- Avas Thaa — 0013: bank transfer payment method
-- Split into its own migration: Postgres disallows using a freshly
-- added enum value in the same transaction that added it.
alter type payment_method add value 'bank_transfer';

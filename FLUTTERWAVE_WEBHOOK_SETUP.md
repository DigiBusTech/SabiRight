# Flutterwave Webhook Setup Guide

## Overview

The Flutterwave payment integration now includes secure webhook verification and comprehensive payment processing. This guide explains how to configure and test the webhook system.

---

## What Was Implemented

### 1. Admin Dashboard Configuration

**New Field Added: Webhook Hash**

The admin dashboard now has **4 fields** for Flutterwave configuration:

| Field | Purpose | Required |
|-------|---------|----------|
| **Public Key** | Used for frontend checkout modal | ✅ Yes |
| **Secret Key** | Used for backend API verification | ✅ Yes |
| **Encryption Key** | Used for encrypting sensitive data | ✅ Yes |
| **Webhook Hash** | Used for webhook signature verification | ✅ Yes (for webhooks) |

**Location:** Admin Dashboard → Payment Methods tab → Flutterwave section

### 2. Backend Webhook Security

**Webhook Endpoint:** `POST /api/payments/flutterwave/webhook`

**Security Features Implemented:**

1. **Signature Verification**
   - Verifies `verif-hash` header from Flutterwave
   - Compares against stored `webhookHash` (not secret key)
   - Rejects requests with invalid or missing signatures

2. **Amount Verification**
   - Compares paid amount with expected amount
   - Prevents fraudulent transactions
   - Returns 400 error if amounts don't match

3. **Idempotency Check**
   - Prevents duplicate processing of same payment
   - Checks if payment status is already `completed`
   - Returns success without reprocessing

4. **Comprehensive Logging**
   - Logs all webhook events
   - Logs verification steps
   - Logs payment processing actions
   - Logs errors with context

### 3. Verification Endpoint

**Verify Endpoint:** `POST /api/payments/flutterwave/verify`

This endpoint is called from the frontend after payment completion and includes the same security features:
- Amount verification
- Idempotency check
- Comprehensive logging

---

## Configuration Steps

### Step 1: Get Your Flutterwave Credentials

1. Login to [Flutterwave Dashboard](https://dashboard.flutterwave.com/)
2. Go to **Settings** → **API Keys**
3. Copy the following:
   - **Public Key** (starts with `FLWPUBK-`)
   - **Secret Key** (starts with `FLWSECK-`)
   - **Encryption Key** (24-character string)

### Step 2: Configure in Admin Dashboard

1. Navigate to **Admin Dashboard** → **Payment Methods** tab
2. Find the **Flutterwave** section
3. Enter the credentials:
   ```
   Public Key: FLWPUBK-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx-X
   Secret Key: FLWSECK-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx-X
   Encryption Key: xxxxxxxxxxxxxxxxxxxxxxxx
   Webhook Hash: [See Step 3]
   ```
4. Toggle the **Active** switch to enable Flutterwave

### Step 3: Set Up Webhook in Flutterwave Dashboard

1. Go to [Flutterwave Dashboard](https://dashboard.flutterwave.com/)
2. Navigate to **Settings** → **Webhooks**
3. Set the webhook URL:
   ```
   Production: https://your-domain.com/api/payments/flutterwave/webhook
   Testing: https://5000-i2t3yh4wkk52scmqsm3ia-7ca9a968.us2.manus.computer/api/payments/flutterwave/webhook
   ```
4. **Important:** Flutterwave will generate a **Secret Hash** for webhook verification
5. Copy this **Secret Hash** and paste it into the **Webhook Hash** field in your admin dashboard

**Note:** The Webhook Hash is different from the Secret Key. It's specifically for webhook signature verification.

---

## How It Works

### Payment Flow

```
1. User selects Flutterwave → Clicks "Proceed to Payment"
   ↓
2. Frontend calls /api/payments/initiate
   ↓
3. Backend creates payment record (status: pending)
   ↓
4. Frontend opens Flutterwave modal with public key
   ↓
5. User completes payment in Flutterwave modal
   ↓
6. Two verification paths happen:

   Path A (Webhook - Automatic):
   - Flutterwave sends webhook to /api/payments/flutterwave/webhook
   - Backend verifies signature using webhookHash
   - Backend verifies amount matches
   - Backend updates payment status to completed
   - Backend processes (wallet top-up, credits, subscription)

   Path B (Frontend Verification - Backup):
   - Frontend callback receives payment status
   - Frontend calls /api/payments/flutterwave/verify
   - Backend calls Flutterwave API to verify transaction
   - Backend verifies amount matches
   - Backend updates payment status to completed (if not already)
   - Backend processes (wallet top-up, credits, subscription)
```

### Webhook Security Flow

```
1. Flutterwave sends webhook request
   ↓
2. Backend checks verif-hash header
   ↓
3. Backend compares with stored webhookHash
   ↓
4. If invalid → Return 401 Unauthorized
   ↓
5. If valid → Continue processing
   ↓
6. Find payment by tx_ref
   ↓
7. Check if already completed (idempotency)
   ↓
8. Verify amount matches expected amount
   ↓
9. Update payment status to completed
   ↓
10. Process based on type (wallet/credits/subscription)
```

---

## Testing the Webhook

### Option 1: Make a Real Test Payment

1. Configure Flutterwave with test credentials
2. Set webhook URL in Flutterwave dashboard
3. Make a small test payment (e.g., NGN 100)
4. Check server logs for webhook events:
   ```bash
   tail -f /tmp/DigiZen-AI/server.log | grep -i flutterwave
   ```

### Option 2: Use Flutterwave Webhook Simulator

1. Go to Flutterwave Dashboard → Settings → Webhooks
2. Click "Test Webhook"
3. Flutterwave will send a test event to your webhook URL
4. Check server logs to verify it was received and processed

### Option 3: Manual Testing with cURL

```bash
curl -X POST https://your-domain.com/api/payments/flutterwave/webhook \
  -H "Content-Type: application/json" \
  -H "verif-hash: YOUR_WEBHOOK_HASH" \
  -d '{
    "event": "charge.completed",
    "data": {
      "status": "successful",
      "tx_ref": "FLW-WALLET_TOPUP-1234567890",
      "amount": 1000,
      "customer": {
        "email": "user@example.com"
      },
      "meta": {
        "userId": "test-user-id",
        "type": "wallet_topup"
      }
    }
  }'
```

---

## Monitoring and Debugging

### Check Server Logs

```bash
# View all logs
tail -f /tmp/DigiZen-AI/server.log

# Filter for Flutterwave events
tail -f /tmp/DigiZen-AI/server.log | grep -i flutterwave

# Filter for webhook events
tail -f /tmp/DigiZen-AI/server.log | grep -i webhook
```

### Expected Log Messages

**Successful Webhook:**
```
Flutterwave webhook signature verified successfully
Processing payment: { paymentId: '...', userId: '...', amount: 1000, type: 'wallet_topup' }
Wallet topped up: { userId: '...', amount: 1000 }
```

**Invalid Signature:**
```
Invalid webhook signature: { received: '...', expected: '...' }
```

**Amount Mismatch:**
```
Amount mismatch: { paymentId: '...', expected: 1000, received: 500 }
```

**Already Processed:**
```
Payment already processed: payment-id-here
```

---

## Troubleshooting

### Issue: "Flutterwave webhook not configured"

**Cause:** Webhook Hash is not set in admin dashboard

**Solution:**
1. Get the Secret Hash from Flutterwave Dashboard → Settings → Webhooks
2. Enter it in Admin Dashboard → Payment Methods → Flutterwave → Webhook Hash field

### Issue: "Invalid webhook signature"

**Cause:** The webhook hash in admin dashboard doesn't match Flutterwave's secret hash

**Solution:**
1. Verify you copied the correct Secret Hash from Flutterwave dashboard
2. Make sure there are no extra spaces or characters
3. Re-enter the hash in admin dashboard

### Issue: "Amount mismatch"

**Cause:** The amount paid doesn't match the expected amount

**Solution:**
1. Check if the payment amount was modified
2. Check server logs for expected vs received amounts
3. This is a security feature - investigate why amounts don't match

### Issue: "Payment not found"

**Cause:** The payment record doesn't exist in database

**Solution:**
1. Check if `/api/payments/initiate` was called successfully
2. Check if the `tx_ref` in webhook matches the payment reference
3. Check database for payment records

---

## Security Best Practices

1. **Never expose your Secret Key or Webhook Hash** in frontend code
2. **Always verify webhook signatures** before processing payments
3. **Always verify amounts** to prevent fraudulent transactions
4. **Implement idempotency** to prevent duplicate processing
5. **Log all webhook events** for audit and debugging
6. **Use HTTPS** for webhook URLs in production
7. **Monitor webhook failures** and set up alerts

---

## Database Schema

The `paymentMethods` collection stores Flutterwave configuration:

```javascript
{
  id: "xRAziJaVClfKgUCCzmer",
  name: "Flutterwave",
  type: "flutterwave",
  active: true,
  publicKey: "FLWPUBK-...",
  secretKey: "FLWSECK-...",
  encryptionKey: "...",
  webhookHash: "...",  // NEW FIELD
  createdAt: "2026-01-25T13:59:14.432Z"
}
```

---

## API Endpoints Summary

| Endpoint | Method | Purpose | Authentication |
|----------|--------|---------|----------------|
| `/api/payments/initiate` | POST | Create payment record | User Auth |
| `/api/payments/flutterwave/webhook` | POST | Receive webhook from Flutterwave | Webhook Signature |
| `/api/payments/flutterwave/verify` | POST | Manual verification from frontend | User Auth |
| `/api/admin/payment-methods` | GET | Get all payment methods | Admin Auth |
| `/api/admin/payment-methods/:id` | PUT | Update payment method | Admin Auth |

---

## Next Steps

1. ✅ Configure Flutterwave credentials in admin dashboard
2. ✅ Set webhook URL in Flutterwave dashboard
3. ✅ Copy webhook hash to admin dashboard
4. ✅ Make a test payment
5. ✅ Verify webhook is received and processed
6. ✅ Monitor server logs for any issues

---

## Support

If you encounter any issues:

1. Check server logs for error messages
2. Verify all credentials are correct
3. Test webhook with Flutterwave's webhook simulator
4. Check that webhook URL is accessible from internet

For Flutterwave-specific issues, refer to:
- [Flutterwave Documentation](https://developer.flutterwave.com/docs)
- [Flutterwave Webhooks Guide](https://developer.flutterwave.com/docs/integration-guides/webhooks/)

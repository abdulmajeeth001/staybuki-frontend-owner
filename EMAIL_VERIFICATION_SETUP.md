# Email Verification Setup Guide

## Overview
The system now validates email deliverability using third-party services to ensure tenants have real, active email addresses.

## Supported Providers
Choose ONE of the following providers:

### 1. **ZeroBounce** (Recommended)
- Free tier: 100 validations/month
- Paid: Starting at $16/month for 2,000 credits
- Website: https://www.zerobounce.net
- Signup: https://www.zerobounce.net/members/signup/

### 2. **NeverBounce**
- Free tier: 1,000 validations (one-time)
- Paid: Starting at $8 for 1,000 credits
- Website: https://neverbounce.com
- Signup: https://app.neverbounce.com/register

### 3. **Kickbox**
- Free tier: 100 validations/month
- Paid: Starting at $10 for 1,000 credits
- Website: https://kickbox.com
- Signup: https://kickbox.com/signup

## Setup Instructions

### Step 1: Choose and Sign Up for a Provider
1. Visit one of the provider websites above
2. Create an account
3. Get your API key from the dashboard

### Step 2: Add API Key to Replit
1. In your Replit project, go to the "Secrets" tab (Tools → Secrets)
2. Click "New Secret"
3. Add the appropriate secret based on your provider:
   - **For ZeroBounce**: 
     - Key: `ZEROBOUNCE_API_KEY`
     - Value: Your ZeroBounce API key
   - **For NeverBounce**:
     - Key: `NEVERBOUNCE_API_KEY`
     - Value: Your NeverBounce API key
   - **For Kickbox**:
     - Key: `KICKBOX_API_KEY`
     - Value: Your Kickbox API key

### Step 3: Restart Application
After adding the secret, restart your application for changes to take effect.

## How It Works

### With Email Verification Enabled (API key configured):
1. **Bulk Upload**: Each email is verified before tenant creation
   - ✅ **Valid**: Tenant created, email sent normally
   - ❌ **Invalid**: Tenant NOT created, error shown in upload results
   - ⚠️ **Risky**: Tenant created with warning (catch-all domains, uncertain deliverability)

2. **Single Tenant Creation**: Email verified on form submission
   - Invalid emails are rejected before saving

### Without Email Verification (No API key):
- Falls back to basic format validation only
- Checks email structure (has @ and domain)
- Does NOT verify if email actually exists

## Upload Results
After enabling verification, bulk upload results will show:
- **Emails verified**: How many passed verification
- **Email failures**: How many failed to send
- **Warnings**: Risky emails that were allowed but flagged
- **Errors**: Invalid emails that were rejected

## Cost Considerations
- **ZeroBounce**: ~$0.016 per verification (1,000 credits)
- **NeverBounce**: ~$0.008 per verification (1,000 credits)
- **Kickbox**: ~$0.01 per verification (1,000 credits)

For a PG with 50 new tenants/month:
- Monthly cost: $0.40 - $0.80
- Prevents invalid tenant records and failed communications

## Testing
To test the verification:
1. Upload a CSV with mix of valid and invalid emails
2. Check results for verification status
3. Invalid emails will be rejected with reason
4. Risky emails will show warnings

## Troubleshooting
- **"No API key configured" message**: Add the secret in Replit Secrets tab
- **Verification always shows "basic-validation"**: API key not loaded, restart application
- **All emails marked invalid**: Check API key is correct and has remaining credits

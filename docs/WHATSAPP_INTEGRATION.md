# WhatsApp Integration for StayBuki

## Overview

This document outlines the options and requirements for adding WhatsApp messaging capabilities to StayBuki's notification system.

## Current Status

**Email Notifications:** ✅ Implemented
- Welcome emails for newly onboarded tenants
- Welcome emails for owners creating new PGs
- OTP verification emails
- Password reset emails

**WhatsApp Notifications:** ❌ Not Implemented

## WhatsApp Integration Options

### Option 1: Twilio WhatsApp API (Recommended)

**Pros:**
- Well-documented and reliable
- Good developer experience
- Replit integration available for managing API keys
- Supports message templates
- Pay-as-you-go pricing

**Cons:**
- Requires business verification
- Template messages must be pre-approved by WhatsApp
- Cannot send free-form messages (only templates)
- Cost per message (varies by country)

**Requirements:**
1. Twilio account with WhatsApp enabled
2. Business verification with Facebook/Meta
3. Pre-approved message templates
4. Twilio Account SID and Auth Token (managed via Replit secrets)
5. WhatsApp-enabled phone number from Twilio

**Implementation Steps:**
1. Search for Twilio integration in Replit integrations
2. Set up Twilio account and enable WhatsApp
3. Submit business profile for verification
4. Create and submit message templates for approval:
   - Tenant welcome message template
   - Owner welcome message template
   - OTP verification template
   - Payment reminder template
5. Install Twilio SDK: `npm install twilio`
6. Create `server/whatsapp.ts` service similar to `server/email.ts`
7. Update notification routes to support both email and WhatsApp

### Option 2: Meta WhatsApp Cloud API

**Pros:**
- Direct integration with Meta/Facebook
- No intermediary service fees
- More control over messaging

**Cons:**
- More complex setup and authentication
- Requires Facebook Business Manager
- More technical documentation to navigate
- Manual webhook configuration

**Requirements:**
1. Facebook Business Manager account
2. WhatsApp Business Account
3. App registration in Meta Developer Portal
4. Webhook setup for receiving messages
5. Business verification
6. Message template approval

### Option 3: Other WhatsApp Business APIs

Other providers like MessageBird, Vonage, or Infobip offer similar services but with varying pricing and features.

## Recommended Message Templates

### 1. Tenant Welcome Message

```
Hello {{tenant_name}},

Welcome to StayBuki! Your onboarding has been approved.

*Room Details:*
PG: {{pg_name}}
Room: {{room_number}}
Rent: ₹{{monthly_rent}}

For complete details, log in to your StayBuki account.

- StayBuki Team
```

### 2. Owner PG Welcome Message

```
Hello {{owner_name}},

Welcome to StayBuki! Your PG "{{pg_name}}" has been successfully set up.

Total Rooms: {{total_rooms}}

Start adding rooms and onboarding tenants through your dashboard.

- StayBuki Team
```

### 3. OTP Verification Message

```
Your StayBuki verification code is: {{otp}}

This code expires in {{expiry_minutes}} minutes. Do not share with anyone.

- StayBuki Team
```

## Implementation Priority

**Recommendation:** Start with email notifications (already implemented) and add WhatsApp as an optional enhancement in a future phase.

**Rationale:**
1. Email is universally accessible and doesn't require additional business verification
2. WhatsApp integration adds complexity and ongoing costs
3. Template approval process can take several days to weeks
4. Many users already expect email notifications

## Cost Considerations

**Email:** Minimal cost (using Gmail SMTP)
- Current implementation: Free using configured Gmail account
- Alternative: SendGrid/Resend for higher volume ($0.001-0.005 per email)

**WhatsApp (via Twilio):**
- Conversation-based pricing model
- Business-initiated conversations: ~$0.005-0.05 per conversation (varies by country)
- User-initiated conversations: Free for 24 hours
- Template message approval required

## Next Steps (If Implementing WhatsApp)

1. **Business Verification:**
   - Register business with Meta/Facebook
   - Complete verification process (can take 1-2 weeks)

2. **Template Creation:**
   - Design message templates following WhatsApp guidelines
   - Submit for approval (approval time: 1-7 days)

3. **Integration:**
   - Choose provider (Twilio recommended)
   - Set up Replit integration for secrets management
   - Implement WhatsApp service module
   - Add fallback logic (send email if WhatsApp fails)

4. **Testing:**
   - Test with sandbox/test numbers
   - Verify template rendering
   - Test error handling

5. **Deployment:**
   - Configure production credentials
   - Monitor delivery rates
   - Track costs

## Configuration Example (Twilio)

If implementing with Twilio, the configuration would look like:

```typescript
// server/whatsapp.ts
import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const whatsappNumber = process.env.TWILIO_WHATSAPP_NUMBER;

const client = twilio(accountSid, authToken);

export async function sendWhatsAppMessage(
  to: string,
  templateName: string,
  variables: Record<string, string>
): Promise<boolean> {
  try {
    await client.messages.create({
      from: `whatsapp:${whatsappNumber}`,
      to: `whatsapp:${to}`,
      body: renderTemplate(templateName, variables)
    });
    return true;
  } catch (error) {
    console.error('WhatsApp send failed:', error);
    return false;
  }
}
```

## Conclusion

While WhatsApp integration is technically feasible and would provide a good user experience, it requires:
- Business verification and setup time
- Message template approval process
- Ongoing per-message costs
- More complex error handling and fallback logic

**Current Recommendation:** Continue with email notifications (already working) and revisit WhatsApp integration once the application has a larger user base and the business verification/template approval processes can be completed.

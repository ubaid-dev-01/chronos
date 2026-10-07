# Chronos Security Audit Checklist

## Authentication
- [ ] All API endpoints require Bearer token
- [ ] Clerk webhook signature verification
- [ ] Stripe webhook signature verification
- [ ] Token expiration and refresh working
- [ ] Rate limiting on auth endpoints (10/15min)

## Authorization
- [ ] RBAC enforced on all protected routes
- [ ] Users can only access own org's data
- [ ] Members cannot access admin endpoints
- [ ] Seat limit enforcement on invites

## Data Protection
- [ ] Screenshots encrypted at rest (S3 AES-256)
- [ ] HTTPS everywhere (TLS 1.3)
- [ ] No raw screenshots leave desktop agent
- [ ] Presigned URLs for screenshot access (1h expiry)
- [ ] PII blurred before upload

## Input Validation
- [ ] Zod validation on all request bodies
- [ ] File upload size limits (10MB)
- [ ] NoSQL injection prevention
- [ ] XSS prevention (sanitized outputs)

## Infrastructure
- [ ] MongoDB Atlas IP whitelist (production IPs only)
- [ ] Redis AUTH enabled
- [ ] S3 bucket policy (no public access)
- [ ] Environment variables in AWS SSM (not env files)
- [ ] Snyk CI gate (blocks high/critical CVEs)

## Agent Security
- [ ] Auth tokens stored in OS keychain (not plaintext)
- [ ] CSP policy restricts network access
- [ ] Binary code-signed (Windows/macOS)
- [ ] Auto-update signature verification

## Compliance
- [ ] GDPR consent flows for EU users
- [ ] Data export capability (user request)
- [ ] Data deletion capability (right to erasure)
- [ ] Audit log captures all admin actions
- [ ] Privacy policy and ToS on website

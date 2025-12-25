# Track Specification: Production-Ready Security and Monitoring Enhancements

## Overview

This track focuses on implementing critical security and monitoring improvements to transform the Sistema de Administración Edificio 205 from a functional application into a production-ready, enterprise-grade system. The enhancements address known vulnerabilities documented in the tech stack and establish robust monitoring capabilities for the 20-user production environment.

## Business Context

### Current State
- ✅ Operational system serving 20 active users
- ✅ Running on AWS EC2 with PM2 process management
- ✅ Basic authentication with JWT and bcrypt
- ⚠️ HTTP-only communication (unencrypted traffic)
- ⚠️ No rate limiting (vulnerable to abuse)
- ⚠️ Manual backup process
- ⚠️ Basic console logging only

### Problem Statement

The current system has several critical gaps that expose it to security risks and operational challenges:

1. **Security Vulnerabilities:**
   - All traffic transmitted over HTTP (passwords, tokens, financial data exposed)
   - No protection against brute force attacks or DDoS
   - JWT secrets stored in environment variables without rotation strategy
   - Missing security headers (CSP, HSTS, etc.)

2. **Operational Risks:**
   - Manual backup process prone to human error
   - No automated backup verification
   - Limited visibility into system health and errors
   - Difficult to debug production issues with console.log statements
   - No proactive monitoring or alerting

3. **Compliance and Trust:**
   - Financial data transmitted without encryption
   - No audit trail for security events
   - Difficult to demonstrate security posture to stakeholders

### Success Criteria

This track will be considered successful when:

1. **Security Metrics:**
   - 100% of traffic encrypted with HTTPS (A+ SSL Labs rating)
   - Rate limiting active on all authentication endpoints (max 5 attempts/15min)
   - All security headers properly configured (verified with securityheaders.com)
   - Zero critical vulnerabilities in npm audit

2. **Operational Metrics:**
   - Automated daily backups with 100% success rate
   - Backup verification automated (integrity checks)
   - Structured logs capturing all critical events
   - Health check endpoint responding < 100ms
   - 99.9% uptime maintained

3. **Monitoring Metrics:**
   - All errors logged with full context (stack traces, user info, request data)
   - Log retention: 30 days minimum
   - Ability to search and filter logs by severity, user, endpoint
   - Health status visible via dedicated endpoint

## Technical Requirements

### 1. HTTPS Implementation with SSL/TLS

**Objective:** Encrypt all communication between clients and server using industry-standard TLS 1.3.

**Requirements:**

- **SSL Certificate:**
  - Obtain free SSL certificate from Let's Encrypt
  - Configure automatic renewal (certbot with cron job)
  - Certificate valid for primary domain and www subdomain
  - Support for TLS 1.2 and 1.3 (disable older versions)

- **Nginx Configuration:**
  - Configure SSL termination at Nginx level
  - Redirect all HTTP traffic to HTTPS (301 permanent redirect)
  - Enable HTTP/2 for improved performance
  - Configure strong cipher suites (Mozilla Modern compatibility)
  - Enable OCSP stapling for certificate validation
  - Set appropriate SSL session cache and timeout

- **Security Headers:**
  - `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload`
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `X-XSS-Protection: 1; mode=block`
  - `Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'`
  - `Referrer-Policy: strict-origin-when-cross-origin`

- **Application Updates:**
  - Update CORS configuration to require HTTPS origin
  - Update frontend API base URL to use HTTPS
  - Update cookie settings to include `Secure` and `SameSite` flags
  - Test all endpoints over HTTPS

**Acceptance Criteria:**
- [ ] SSL certificate installed and valid
- [ ] All HTTP requests redirect to HTTPS
- [ ] SSL Labs test shows A+ rating
- [ ] securityheaders.com shows A rating
- [ ] No mixed content warnings in browser console
- [ ] All API calls work correctly over HTTPS

### 2. Rate Limiting Implementation

**Objective:** Protect the system from brute force attacks, credential stuffing, and DDoS attempts.

**Requirements:**

- **Library Selection:**
  - Use `express-rate-limit` package (industry standard)
  - Configure Redis store for distributed rate limiting (future-proof)
  - Fallback to memory store for single-instance deployment

- **Rate Limit Policies:**

  **Authentication Endpoints (Strict):**
  - `/api/auth/login`: 5 attempts per 15 minutes per IP
  - `/api/auth/register`: 3 attempts per hour per IP
  - `/api/auth/reset-password`: 3 attempts per hour per IP
  
  **API Endpoints (Moderate):**
  - General API routes: 100 requests per 15 minutes per IP
  - File upload endpoints: 10 uploads per hour per user
  
  **Public Endpoints (Lenient):**
  - Health check: No limit
  - Static assets: 1000 requests per 15 minutes per IP

- **Response Handling:**
  - Return `429 Too Many Requests` status code
  - Include `Retry-After` header with seconds until reset
  - Standardized error response: `{ ok: false, msg: 'Too many requests, please try again later' }`
  - Log rate limit violations for security monitoring

- **Configuration:**
  - Store rate limit windows in Redis (or memory as fallback)
  - Make limits configurable via environment variables
  - Whitelist internal IPs (health checks, monitoring)
  - Implement sliding window algorithm for fairness

**Acceptance Criteria:**
- [ ] Rate limiting active on all authentication endpoints
- [ ] Appropriate limits set for different endpoint categories
- [ ] 429 responses returned when limits exceeded
- [ ] Rate limit headers included in responses
- [ ] Rate limit violations logged
- [ ] Configuration via environment variables working

### 3. Automated Backup System

**Objective:** Ensure data integrity and recoverability through automated, verified backups.

**Requirements:**

- **Backup Strategy:**
  - **Frequency:** Daily backups at 2:00 AM local time
  - **Retention Policy:**
    - Daily backups: Keep last 7 days
    - Weekly backups: Keep last 4 weeks (every Sunday)
    - Monthly backups: Keep last 12 months (first of month)
  - **Backup Contents:**
    - `data.json` (primary database)
    - `uploads/` directory (user-uploaded files)
    - Configuration files (`.env`, `ecosystem.config.js`)
    - Nginx configuration

- **Backup Script (`scripts/backup/automated-backup.sh`):**
  - Create timestamped backup directory
  - Copy all required files
  - Compress backup into `.tar.gz` archive
  - Calculate and store SHA-256 checksum
  - Upload to remote storage (S3 or similar)
  - Clean up old backups per retention policy
  - Log all operations with timestamps
  - Send notification on failure

- **Backup Verification:**
  - Automated integrity check after each backup
  - Verify checksum matches
  - Test archive extraction
  - Validate JSON structure of `data.json`
  - Log verification results
  - Alert on verification failure

- **Restoration Procedure:**
  - Document step-by-step restoration process
  - Create restoration script (`scripts/backup/restore-backup.sh`)
  - Test restoration monthly (automated test)
  - Measure and document RTO (Recovery Time Objective)
  - Measure and document RPO (Recovery Point Objective)

- **Monitoring:**
  - Track backup success/failure rate
  - Monitor backup size trends
  - Alert on backup failures
  - Dashboard showing last successful backup time

**Acceptance Criteria:**
- [ ] Automated backup script created and tested
- [ ] Cron job configured for daily execution
- [ ] Retention policy implemented and working
- [ ] Backup verification automated
- [ ] Restoration script created and tested
- [ ] Documentation complete
- [ ] Remote storage configured
- [ ] Monitoring and alerting active

### 4. Structured Logging with Winston

**Objective:** Replace console.log statements with structured, searchable, production-grade logging.

**Requirements:**

- **Winston Configuration:**
  - Install `winston` and `winston-daily-rotate-file`
  - Configure multiple log levels: error, warn, info, debug
  - Separate log files by level
  - Daily log rotation with compression
  - Retention: 30 days for all levels

- **Log Format:**
  ```json
  {
    "timestamp": "2025-12-25T08:30:00.000Z",
    "level": "info",
    "message": "User login successful",
    "userId": "user123",
    "email": "user@example.com",
    "ip": "192.168.1.1",
    "endpoint": "/api/auth/login",
    "method": "POST",
    "statusCode": 200,
    "responseTime": 145,
    "userAgent": "Mozilla/5.0...",
    "requestId": "req-abc123"
  }
  ```

- **Log Levels and Usage:**
  - **ERROR:** Application errors, exceptions, failed operations
  - **WARN:** Deprecated features, rate limit hits, unusual behavior
  - **INFO:** User actions, API requests, system events
  - **DEBUG:** Detailed debugging information (dev only)

- **Log Transports:**
  - **Console:** Colorized output for development
  - **File (error.log):** All error-level logs
  - **File (combined.log):** All logs (info and above)
  - **File (access.log):** HTTP request logs
  - **Daily Rotate:** Automatic rotation and compression

- **Integration Points:**
  - Replace all `console.log` with appropriate logger calls
  - Add request logging middleware (log all API calls)
  - Log authentication events (login, logout, failed attempts)
  - Log authorization failures
  - Log database operations (create, update, delete)
  - Log rate limit violations
  - Log backup operations
  - Log system startup and shutdown

- **Sensitive Data Handling:**
  - Never log passwords or tokens
  - Mask sensitive fields (email → e***@example.com)
  - Sanitize request bodies before logging
  - Implement log scrubbing for PII

**Acceptance Criteria:**
- [ ] Winston installed and configured
- [ ] All console.log replaced with logger calls
- [ ] Log rotation working correctly
- [ ] Separate log files by level
- [ ] Request logging middleware active
- [ ] Sensitive data properly masked
- [ ] Log format consistent and parseable
- [ ] Documentation for log analysis

### 5. Health Check Endpoint

**Objective:** Provide a reliable endpoint for monitoring system health and status.

**Requirements:**

- **Endpoint Specification:**
  - **URL:** `GET /api/health`
  - **Authentication:** None (public endpoint)
  - **Rate Limit:** Exempt from rate limiting

- **Health Checks:**
  - **Application Status:** Server running and responding
  - **Database Status:** Can read/write to data.json
  - **Disk Space:** Available disk space > 10%
  - **Memory Usage:** Available memory > 20%
  - **Uptime:** Time since last restart
  - **Dependencies:** All required npm packages present

- **Response Format:**
  ```json
  {
    "ok": true,
    "status": "healthy",
    "timestamp": "2025-12-25T08:30:00.000Z",
    "uptime": 86400,
    "checks": {
      "database": {
        "status": "healthy",
        "responseTime": 5
      },
      "disk": {
        "status": "healthy",
        "available": "45%",
        "total": "20GB",
        "used": "11GB"
      },
      "memory": {
        "status": "healthy",
        "available": "60%",
        "total": "2GB",
        "used": "800MB"
      }
    },
    "version": "2.0.0",
    "environment": "production"
  }
  ```

- **Status Codes:**
  - `200 OK`: All checks passed (healthy)
  - `503 Service Unavailable`: One or more checks failed (unhealthy)

- **Monitoring Integration:**
  - Configure external monitoring service (UptimeRobot, Pingdom, etc.)
  - Check endpoint every 5 minutes
  - Alert on 3 consecutive failures
  - Track uptime percentage
  - Monitor response time trends

**Acceptance Criteria:**
- [ ] Health check endpoint implemented
- [ ] All health checks working correctly
- [ ] Response format matches specification
- [ ] Appropriate status codes returned
- [ ] External monitoring configured
- [ ] Alerting set up for failures
- [ ] Documentation complete

### 6. Environment Configuration

**Objective:** Properly configure production environment variables and secrets management.

**Requirements:**

- **Environment Variables:**
  - `NODE_ENV=production` (enable production optimizations)
  - `PORT=3000` (application port)
  - `JWT_SECRET` (strong, randomly generated, 64+ characters)
  - `JWT_EXPIRATION=24h` (token expiration time)
  - `FRONTEND_URL` (HTTPS URL for CORS)
  - `LOG_LEVEL=info` (production log level)
  - `RATE_LIMIT_WINDOW=15` (minutes)
  - `RATE_LIMIT_MAX_REQUESTS=100`
  - `BACKUP_RETENTION_DAYS=7`
  - `BACKUP_S3_BUCKET` (if using S3)
  - `BACKUP_S3_REGION`

- **Secrets Management:**
  - Store `.env` file outside web root
  - Restrict file permissions (600 - owner read/write only)
  - Never commit `.env` to version control
  - Document all required variables in `.env.example`
  - Implement JWT secret rotation strategy
  - Use AWS Secrets Manager or similar for sensitive data (future)

- **Configuration Validation:**
  - Validate all required environment variables on startup
  - Fail fast if critical variables missing
  - Log configuration errors clearly
  - Provide helpful error messages

**Acceptance Criteria:**
- [ ] All environment variables documented
- [ ] `.env.example` file created
- [ ] Production `.env` configured correctly
- [ ] File permissions set appropriately
- [ ] Configuration validation implemented
- [ ] JWT secret rotated and secured
- [ ] Documentation complete

## Non-Functional Requirements

### Performance
- Health check endpoint must respond in < 100ms
- Rate limiting overhead < 10ms per request
- Logging overhead < 5ms per request
- Backup process must complete in < 5 minutes
- No degradation in API response times

### Security
- All passwords and tokens encrypted in transit (HTTPS)
- No sensitive data in logs
- Rate limiting prevents brute force attacks
- Security headers prevent common attacks (XSS, clickjacking)
- Regular security audits (npm audit)

### Reliability
- Automated backups with 99.9% success rate
- Backup verification catches corruption
- System recoverable within 1 hour (RTO)
- Data loss limited to last 24 hours (RPO)
- Health checks detect issues within 5 minutes

### Maintainability
- All configuration via environment variables
- Clear documentation for all new features
- Structured logs easy to search and analyze
- Backup/restore procedures documented and tested
- Code follows existing project standards (BLACKBOX.md)

## Testing Requirements

### Unit Tests
- Rate limiting middleware tests
- Health check endpoint tests
- Logger configuration tests
- Backup script tests (mocked file operations)

### Integration Tests
- HTTPS redirect tests
- Rate limiting across multiple requests
- Health check with actual system checks
- Backup and restore full cycle
- Logging integration with application

### Security Tests
- SSL/TLS configuration validation
- Security headers verification
- Rate limiting bypass attempts
- Sensitive data in logs check
- npm audit for vulnerabilities

### Performance Tests
- Health check response time
- Rate limiting overhead measurement
- Logging performance impact
- Backup duration tracking

## Dependencies

### New NPM Packages
- `express-rate-limit` (^7.1.5) - Rate limiting
- `winston` (^3.11.0) - Structured logging
- `winston-daily-rotate-file` (^4.7.1) - Log rotation

### System Dependencies
- `certbot` - SSL certificate management
- `cron` - Scheduled backup execution
- `tar` - Backup compression
- `sha256sum` - Checksum calculation

### External Services
- Let's Encrypt - Free SSL certificates
- AWS S3 (optional) - Remote backup storage
- UptimeRobot (optional) - External monitoring

## Migration and Rollout Strategy

### Phase 1: Development and Testing (Days 1-2)
1. Set up development environment with self-signed certificates
2. Implement rate limiting with tests
3. Implement Winston logging
4. Create backup scripts
5. Implement health check endpoint
6. Run full test suite

### Phase 2: Staging Deployment (Day 3)
1. Deploy to staging environment
2. Obtain Let's Encrypt certificate for staging domain
3. Configure Nginx with SSL
4. Test all features in staging
5. Perform security audit
6. Load testing

### Phase 3: Production Deployment (Day 4)
1. Schedule maintenance window (low traffic period)
2. Create full backup of current system
3. Obtain production SSL certificate
4. Deploy new code to production
5. Update Nginx configuration
6. Restart services
7. Verify all functionality
8. Monitor for 24 hours

### Phase 4: Monitoring and Optimization (Day 5)
1. Configure external monitoring
2. Set up alerting
3. Review logs for issues
4. Optimize performance if needed
5. Document lessons learned
6. Train team on new features

### Rollback Plan
If critical issues arise:
1. Revert Nginx configuration to HTTP
2. Rollback application code to previous version
3. Restore from backup if data corruption
4. Investigate issues in staging
5. Fix and redeploy

## Documentation Requirements

### User Documentation
- No user-facing changes (transparent to users)
- Update system status page with security improvements

### Technical Documentation
- SSL certificate renewal procedure
- Backup and restore procedures
- Log analysis guide
- Rate limiting configuration guide
- Health check monitoring setup
- Troubleshooting guide

### Operational Documentation
- Deployment checklist
- Monitoring and alerting setup
- Incident response procedures
- Security audit procedures

## Success Metrics

### Security Metrics
- SSL Labs rating: A+
- Security Headers rating: A
- npm audit: 0 critical vulnerabilities
- Rate limit effectiveness: 100% of attacks blocked

### Operational Metrics
- Backup success rate: 99.9%
- System uptime: 99.9%
- Mean time to detect issues: < 5 minutes
- Mean time to recovery: < 1 hour

### Performance Metrics
- API response time: No degradation
- Health check response: < 100ms
- Log write performance: < 5ms overhead
- Backup duration: < 5 minutes

## Risks and Mitigations

### Risk: SSL Certificate Renewal Failure
**Impact:** High - Site becomes inaccessible  
**Probability:** Low  
**Mitigation:**
- Configure automatic renewal with certbot
- Set up monitoring for certificate expiration
- Alert 30 days before expiration
- Document manual renewal procedure

### Risk: Rate Limiting Too Aggressive
**Impact:** Medium - Legitimate users blocked  
**Probability:** Medium  
**Mitigation:**
- Start with lenient limits
- Monitor rate limit hits
- Adjust based on real usage patterns
- Implement whitelist for known good IPs

### Risk: Backup Storage Full
**Impact:** High - Backups fail  
**Probability:** Low  
**Mitigation:**
- Monitor disk space
- Alert at 80% capacity
- Implement retention policy
- Use remote storage (S3)

### Risk: Logging Performance Impact
**Impact:** Low - Slight performance degradation  
**Probability:** Medium  
**Mitigation:**
- Use async logging
- Implement log sampling for high-volume endpoints
- Monitor performance metrics
- Adjust log levels if needed

## Conclusion

This track transforms the Sistema de Administración Edificio 205 from a functional application into a production-ready, enterprise-grade system. By implementing HTTPS, rate limiting, automated backups, structured logging, and health monitoring, we address critical security vulnerabilities and operational risks while maintaining the system's excellent performance and user experience.

The enhancements are transparent to end users but provide significant value to administrators and operators through improved security, reliability, and observability. The phased rollout strategy minimizes risk while the comprehensive testing ensures quality.

Upon completion, the system will meet industry best practices for security and operations, providing a solid foundation for future growth and scaling.

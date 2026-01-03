# Security Policy

## 🔐 Security Overview

KisanSetu takes security seriously. This document outlines our security practices and how to report security vulnerabilities.

## 🚨 Demo Credentials Notice

**⚠️ IMPORTANT: The current authentication system uses demo credentials for hackathon demonstration purposes only.**

### Demo Login Credentials

The following credentials are hardcoded for demonstration and should **NEVER** be used in production:

#### Farmers
- Username: `farmer1` | Password: `farmer123`
- Username: `farmer2` | Password: `farmer123`

#### FPOs
- Username: `fpo1` | Password: `fpo123`
- Username: `fpo2` | Password: `fpo123`

#### Processors
- Username: `processor1` | Password: `processor123`
- Username: `processor2` | Password: `processor123`

#### Retailers
- Username: `retailer1` | Password: `retailer123`
- Username: `retailer2` | Password: `retailer123`

#### Government
- Username: `admin1` | Password: `admin123`
- Username: `admin2` | Password: `admin123`

### Production Security Requirements

Before deploying to production, you MUST:

1. **Replace Demo Authentication**
   - Implement proper user registration
   - Use secure password hashing (bcrypt, Argon2)
   - Integrate with Supabase Auth or similar service
   - Remove hardcoded credentials from `services/authService.ts`

2. **Environment Variables**
   - Never commit API keys to version control
   - Use environment variables for all sensitive data
   - Rotate API keys regularly
   - Use different keys for development/staging/production

3. **Database Security**
   - Enable Row Level Security (RLS) on all tables
   - Implement proper user roles and permissions
   - Use parameterized queries to prevent SQL injection
   - Enable audit logging

## 🛡️ Security Features

### Current Security Measures

1. **Environment Variable Protection**
   - All API keys use environment variables
   - `.env` files are gitignored
   - Example configuration provided in `.env.example`

2. **Database Security**
   - Supabase Row Level Security (RLS) enabled
   - Real-time subscriptions with proper authentication
   - Secure connection strings

3. **Input Validation**
   - Client-side input validation
   - XSS prevention through React's built-in protection
   - Input sanitization for user data

4. **API Security**
   - Rate limiting through service providers
   - Secure HTTPS connections
   - API key rotation support

### Recommended Production Enhancements

1. **Authentication & Authorization**
   ```typescript
   // Replace demo auth with Supabase Auth
   import { createClient } from '@supabase/supabase-js'
   
   const supabase = createClient(url, key, {
     auth: {
       autoRefreshToken: true,
       persistSession: true
     }
   })
   ```

2. **Password Security**
   ```typescript
   // Use proper password hashing
   import bcrypt from 'bcrypt'
   
   const hashPassword = async (password: string) => {
     return await bcrypt.hash(password, 12)
   }
   ```

3. **Session Management**
   - Implement secure session handling
   - Use JWT tokens with proper expiration
   - Implement refresh token rotation

4. **Data Encryption**
   - Encrypt sensitive data at rest
   - Use HTTPS for all communications
   - Implement field-level encryption for PII

## 🔍 Security Checklist

### Before Production Deployment

- [ ] Remove all hardcoded credentials
- [ ] Implement proper authentication system
- [ ] Enable database Row Level Security
- [ ] Set up proper environment variables
- [ ] Implement input validation and sanitization
- [ ] Enable HTTPS and security headers
- [ ] Set up monitoring and logging
- [ ] Conduct security testing
- [ ] Implement rate limiting
- [ ] Set up backup and recovery procedures

### API Key Management

- [ ] Use environment variables for all API keys
- [ ] Implement API key rotation
- [ ] Monitor API key usage
- [ ] Set up alerts for unusual activity
- [ ] Use different keys for different environments

### Database Security

- [ ] Enable Row Level Security (RLS)
- [ ] Implement proper user roles
- [ ] Use parameterized queries
- [ ] Enable audit logging
- [ ] Regular security updates
- [ ] Backup encryption

## 🚨 Reporting Security Vulnerabilities

If you discover a security vulnerability, please report it responsibly:

### How to Report

1. **Email**: Send details to [security@kisansetu.com] (if available)
2. **GitHub**: Create a private security advisory
3. **Direct Contact**: Contact the development team directly

### What to Include

- Description of the vulnerability
- Steps to reproduce the issue
- Potential impact assessment
- Suggested fix (if available)

### Response Timeline

- **Acknowledgment**: Within 24 hours
- **Initial Assessment**: Within 72 hours
- **Fix Development**: Within 1-2 weeks
- **Disclosure**: After fix is deployed

## 🔒 Security Best Practices

### For Developers

1. **Code Security**
   - Never commit secrets to version control
   - Use secure coding practices
   - Implement proper error handling
   - Regular dependency updates

2. **Testing**
   - Include security tests in CI/CD
   - Regular penetration testing
   - Automated vulnerability scanning
   - Code review for security issues

3. **Deployment**
   - Use secure deployment pipelines
   - Implement proper access controls
   - Monitor for security events
   - Regular security audits

### For Users

1. **Account Security**
   - Use strong, unique passwords
   - Enable two-factor authentication (when available)
   - Regular password updates
   - Monitor account activity

2. **Data Protection**
   - Be cautious with sensitive information
   - Use secure networks
   - Keep software updated
   - Report suspicious activity

## 📚 Security Resources

### Documentation
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Supabase Security](https://supabase.com/docs/guides/auth/row-level-security)
- [React Security](https://reactjs.org/docs/dom-elements.html#dangerouslysetinnerhtml)

### Tools
- [npm audit](https://docs.npmjs.com/cli/v8/commands/npm-audit)
- [Snyk](https://snyk.io/)
- [OWASP ZAP](https://www.zaproxy.org/)

## 📞 Contact

For security-related questions or concerns:
- **Security Team**: [security@kisansetu.com]
- **Development Team**: [dev@kisansetu.com]
- **GitHub Issues**: For non-sensitive security discussions

---

**Remember**: Security is everyone's responsibility. Help us keep KisanSetu secure for all users! 🛡️
# Contributing to KisanSetu

Thank you for your interest in contributing to KisanSetu! This document provides guidelines and information for contributors.

## 🚀 Getting Started

### Prerequisites
- Node.js 18 or higher
- npm or yarn
- Git
- A Supabase account (for database features)
- Google Gemini API key (for AI features)

### Development Setup

1. **Fork and clone the repository**
   ```bash
   git clone https://github.com/your-username/SIH-2025-Grandfinale.git
   cd SIH-2025-Grandfinale
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your actual values
   ```

4. **Set up the database**
   - Create a Supabase project
   - Run the SQL schema from `supabase-schema.sql`
   - Enable real-time replication for all tables

5. **Start development server**
   ```bash
   npm run dev
   ```

## 📋 Development Guidelines

### Code Style
- Use TypeScript for all new code
- Follow existing naming conventions
- Use meaningful variable and function names
- Add comments for complex logic
- Ensure code is properly formatted

### Component Structure
```
components/
├── ComponentName.tsx          # Main component
├── ComponentName.module.css   # Styles (if needed)
└── __tests__/
    └── ComponentName.test.tsx # Tests
```

### Commit Messages
Use conventional commit format:
```
type(scope): description

Examples:
feat(farmer): add crop recommendation feature
fix(bidding): resolve real-time update issue
docs(readme): update installation instructions
style(ui): improve mobile responsiveness
```

### Branch Naming
- `feature/feature-name` for new features
- `fix/bug-description` for bug fixes
- `docs/documentation-update` for documentation
- `refactor/component-name` for refactoring

## 🧪 Testing

### Running Tests
```bash
npm test                    # Run all tests
npm run test:watch         # Run tests in watch mode
npm run test:coverage      # Run tests with coverage
```

### Testing Guidelines
- Write tests for new features
- Test real-time functionality with multiple browser sessions
- Test multilingual features (English/Odia)
- Test mobile responsiveness
- Test with and without API keys

### Real-time Testing
1. Open the app in multiple browsers
2. Login with different roles
3. Test bidding flow: Farmer → FPO → Processor
4. Verify instant updates across all sessions

## 🌐 Internationalization (i18n)

### Adding New Languages
1. Create language files in `src/locales/`
2. Update the language selector component
3. Test all UI elements in the new language
4. Update voice assistant to support the new language

### Translation Guidelines
- Keep translations contextually appropriate
- Consider cultural nuances
- Test with native speakers when possible
- Maintain consistency in terminology

## 🔧 API Integration

### Adding New APIs
1. Create service files in `src/services/`
2. Add proper error handling
3. Include TypeScript types
4. Add fallback mechanisms
5. Document API usage

### Environment Variables
- Add new variables to `.env.example`
- Document their purpose in README
- Use proper prefixes (`VITE_` for frontend)
- Never commit actual API keys

## 📱 Mobile Development

### Responsive Design
- Test on multiple screen sizes
- Use Tailwind CSS responsive utilities
- Ensure touch-friendly interfaces
- Test on actual mobile devices

### Performance
- Optimize images and assets
- Use lazy loading for heavy components
- Minimize bundle size
- Test on slower networks

## 🔐 Security Guidelines

### Data Protection
- Never log sensitive information
- Use environment variables for secrets
- Implement proper input validation
- Follow OWASP security guidelines

### Database Security
- Use Row Level Security (RLS) policies
- Validate all user inputs
- Use parameterized queries
- Implement proper authentication

## 🚀 Deployment

### Vercel Deployment
1. Connect your fork to Vercel
2. Add environment variables
3. Deploy and test
4. Verify real-time features work

### Environment Setup
- Development: Use `.env.local`
- Production: Use Vercel environment variables
- Test all features after deployment

## 🐛 Bug Reports

### Before Reporting
1. Check existing issues
2. Test on latest version
3. Try to reproduce the bug
4. Check browser console for errors

### Bug Report Template
```markdown
**Bug Description**
A clear description of the bug

**Steps to Reproduce**
1. Go to '...'
2. Click on '...'
3. See error

**Expected Behavior**
What should happen

**Screenshots**
If applicable

**Environment**
- Browser: [e.g., Chrome 91]
- Device: [e.g., iPhone 12]
- OS: [e.g., iOS 14]
```

## ✨ Feature Requests

### Feature Request Template
```markdown
**Feature Description**
Clear description of the feature

**Problem Statement**
What problem does this solve?

**Proposed Solution**
How should this work?

**Alternatives Considered**
Other solutions you've considered

**Additional Context**
Any other relevant information
```

## 📚 Documentation

### Code Documentation
- Document all public functions
- Include usage examples
- Explain complex algorithms
- Keep documentation up to date

### README Updates
- Update installation instructions
- Add new feature descriptions
- Include screenshots/GIFs
- Update API documentation

## 🤝 Pull Request Process

### Before Submitting
1. Test your changes thoroughly
2. Update documentation if needed
3. Add tests for new features
4. Ensure all tests pass
5. Check for TypeScript errors

### PR Template
```markdown
**Description**
Brief description of changes

**Type of Change**
- [ ] Bug fix
- [ ] New feature
- [ ] Documentation update
- [ ] Refactoring

**Testing**
- [ ] Tested locally
- [ ] Added/updated tests
- [ ] Tested real-time features
- [ ] Tested mobile responsiveness

**Screenshots**
If applicable

**Checklist**
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No breaking changes
```

### Review Process
1. Automated checks must pass
2. Code review by maintainers
3. Testing on staging environment
4. Approval and merge

## 🏷️ Release Process

### Version Numbering
We follow [Semantic Versioning](https://semver.org/):
- MAJOR: Breaking changes
- MINOR: New features
- PATCH: Bug fixes

### Release Checklist
- [ ] All tests pass
- [ ] Documentation updated
- [ ] Version number bumped
- [ ] Changelog updated
- [ ] Tagged release created

## 📞 Getting Help

### Community Support
- GitHub Discussions for questions
- GitHub Issues for bugs
- Email for security issues

### Development Help
- Check existing documentation
- Look at similar implementations
- Ask in GitHub Discussions
- Contact maintainers

## 🙏 Recognition

Contributors will be recognized in:
- README.md contributors section
- Release notes
- Project documentation

Thank you for contributing to KisanSetu! Together, we're building technology that empowers farmers and transforms agriculture. 🌾
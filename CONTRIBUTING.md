# Contributing to AI Avatar System

Thank you for your interest in contributing to the AI Avatar System! This document provides guidelines and information for contributors.

## 🎯 Ways to Contribute

### 1. Documentation Improvements
- Fix typos or grammatical errors
- Add missing setup steps
- Improve code examples
- Add troubleshooting sections
- Translate documentation to other languages

### 2. Code Contributions
- Bug fixes
- New features
- Performance optimizations
- Security improvements
- Test coverage improvements

### 3. Analysis Tools
- Support for analyzing new avatar websites
- Additional tech stack detection
- Performance analysis features
- Security scanning capabilities

### 4. Example Implementations
- Alternative frontend frameworks (Vue, Angular, Svelte)
- Different backend technologies (Python, Go, Rust)
- Mobile app examples (React Native, Flutter)
- Different 3D libraries integration

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Git
- GitHub account

### Setup Development Environment

1. **Fork the repository**
   ```bash
   # Click "Fork" on GitHub, then clone your fork
   git clone https://github.com/YOUR_USERNAME/ai-avatar-system.git
   cd ai-avatar-system
   ```

2. **Add upstream remote**
   ```bash
   git remote add upstream https://github.com/ORIGINAL_OWNER/ai-avatar-system.git
   ```

3. **Install dependencies**
   ```bash
   npm install
   ```

4. **Create a branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

## 📝 Contribution Guidelines

### Code Style

#### JavaScript/Node.js
- Use **ES6+** syntax
- **2 spaces** for indentation
- **Semicolons** required
- **camelCase** for variables and functions
- **PascalCase** for classes and components

Example:
```javascript
const avatarService = {
  async generateResponse(message) {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: message }],
      });
      return response.choices[0].message.content;
    } catch (error) {
      console.error('OpenAI API error:', error);
      throw error;
    }
  }
};
```

#### React/JSX
- Use **functional components** with hooks
- **Props destructuring** in function parameters
- **Descriptive component names**

Example:
```jsx
const AvatarControls = ({ onExpressionChange, currentExpression, isLoading }) => {
  const handleExpressionSelect = (expression) => {
    if (!isLoading) {
      onExpressionChange(expression);
    }
  };

  return (
    <div className="avatar-controls">
      {/* Component content */}
    </div>
  );
};
```

### Documentation Style

#### Markdown Guidelines
- Use **clear, descriptive headings**
- Include **code examples** for all features
- Add **step-by-step instructions**
- Include **screenshots** where helpful
- Use **emoji sparingly** for visual hierarchy

#### Code Comments
- **Document complex logic**
- **Explain non-obvious decisions**
- **Include examples** in function documentation

Example:
```javascript
/**
 * Converts facial expression data to Three.js morph targets
 * @param {Object} expression - Facial expression data from AI response
 * @param {string} expression.type - Expression type (smile, sad, angry, etc.)
 * @param {number} expression.intensity - Expression intensity (0-1)
 * @returns {Object} Three.js compatible morph target data
 */
const convertToMorphTargets = (expression) => {
  // Implementation details...
};
```

### Commit Messages

Use **conventional commits** format:

```
type(scope): description

[optional body]

[optional footer]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**
```bash
git commit -m "feat(avatar): add lip-sync animation support"
git commit -m "fix(polly): handle network timeout errors"
git commit -m "docs(setup): add troubleshooting section for AWS"
```

## 🧪 Testing

### Running Tests
```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests for specific component
npm test -- --grep "Avatar"
```

### Writing Tests

#### Unit Tests
```javascript
describe('Avatar Expression Converter', () => {
  test('should convert smile expression correctly', () => {
    const input = { type: 'smile', intensity: 0.8 };
    const result = convertToMorphTargets(input);
    
    expect(result.mouthSmileLeft).toBe(0.176); // 0.22 * 0.8
    expect(result.mouthSmileRight).toBe(0.176);
  });
});
```

#### Integration Tests
```javascript
describe('Chat API Integration', () => {
  test('should return valid response with audio', async () => {
    const response = await request(app)
      .post('/chat')
      .send({ message: 'Hello' })
      .expect(200);
    
    expect(response.body.messages).toBeDefined();
    expect(response.body.messages[0].audio).toBeDefined();
  });
});
```

## 🔍 Code Review Process

### Before Submitting PR

1. **Run tests locally**
   ```bash
   npm test
   npm run lint
   ```

2. **Update documentation** if needed

3. **Test your changes** thoroughly

4. **Rebase on latest main**
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

### PR Requirements

- **Clear description** of changes
- **Link to related issues**
- **Screenshots** for UI changes
- **Tests pass** in CI
- **Documentation updated**

### PR Template
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Documentation update
- [ ] Performance improvement

## Testing
- [ ] Tests pass locally
- [ ] Added new tests if needed
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No breaking changes (or clearly documented)
```

## 🐛 Reporting Issues

### Bug Reports

Use the bug report template:

```markdown
**Bug Description**
Clear description of the bug

**Steps to Reproduce**
1. Go to '...'
2. Click on '....'
3. See error

**Expected Behavior**
What should happen

**Actual Behavior**
What actually happens

**Environment**
- OS: [e.g. macOS 12.0]
- Browser: [e.g. Chrome 96]
- Node.js: [e.g. 18.0.0]

**Additional Context**
Any other relevant information
```

### Feature Requests

Use the feature request template:

```markdown
**Feature Description**
Clear description of the proposed feature

**Use Case**
Why is this feature needed?

**Proposed Solution**
How should this feature work?

**Alternatives Considered**
What other approaches were considered?

**Additional Context**
Any other relevant information
```

## 📚 Resources

### Learning Resources
- [Three.js Documentation](https://threejs.org/docs/)
- [React Three Fiber](https://docs.pmnd.rs/react-three-fiber)
- [OpenAI API Reference](https://platform.openai.com/docs/api-reference)
- [AWS Polly Documentation](https://docs.aws.amazon.com/polly/)

### Development Tools
- [Visual Studio Code](https://code.visualstudio.com/)
- [Node.js](https://nodejs.org/)
- [Postman](https://www.postman.com/) for API testing
- [GitHub Desktop](https://desktop.github.com/)

## 🎉 Recognition

Contributors will be:
- **Listed in CONTRIBUTORS.md**
- **Mentioned in release notes**
- **Tagged in social media** (with permission)

### Hall of Fame
Outstanding contributors may be invited to:
- **Maintain specific modules**
- **Review pull requests**
- **Guide project direction**

## 📞 Getting Help

- **GitHub Discussions** for questions
- **Issues** for bugs and feature requests
- **Discord/Slack** (if available)
- **Email maintainers** for sensitive issues

## 🤝 Code of Conduct

### Our Pledge
We pledge to make participation in our community a harassment-free experience for everyone.

### Standards
- **Be respectful** and inclusive
- **Accept constructive criticism** gracefully
- **Focus on community benefit**
- **Show empathy** towards others

### Enforcement
Unacceptable behavior may result in:
1. **Warning**
2. **Temporary ban**
3. **Permanent ban**

Report issues to project maintainers.

---

Thank you for contributing to the AI Avatar System! 🚀
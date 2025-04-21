# Contributing Guidelines

## Communication Rules

1. **GitHub-First Approach**
   - All code changes must be made through GitHub
   - Use feature branches for new development
   - Create pull requests for code review
   - Reference issue numbers in commits and PRs

2. **Layout Changes**
   - Do not make any layout changes unless explicitly requested
   - All UI/UX modifications require prior approval
   - Keep existing layout structure unless specifically directed to change it

3. **Code Organization**
   - Keep files small and focused
   - Use TypeScript for type safety
   - Follow the established directory structure
   - Document complex logic with comments

4. **Development Workflow**
   - Create feature branches from `main`
   - Use meaningful commit messages
   - Keep PRs focused and small
   - Request reviews before merging

5. **Code Style**
   - Use TypeScript strict mode
   - Follow ESLint rules
   - Use Prettier for formatting
   - Document public APIs

6. **Testing**
   - Write tests for new features
   - Ensure all tests pass before merging
   - Include both unit and integration tests

7. **Documentation**
   - Update README.md for new features
   - Document API changes
   - Include JSDoc comments for functions
   - Keep documentation up to date

8. **Error Handling**
   - Use proper error types
   - Include error messages
   - Log errors appropriately
   - Handle edge cases

9. **Performance**
   - Optimize API calls
   - Use proper caching
   - Monitor bundle size
   - Profile when necessary

## Directory Structure

```
fantasyfootball/
├── components/     # React components
├── contexts/      # React contexts
├── pages/         # Next.js pages
├── services/      # API services
├── types/         # TypeScript types
└── utils/         # Utility functions
```

## Getting Started

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## Commit Message Format

```
type(scope): description

[optional body]

[optional footer]
```

Types:
- feat: New feature
- fix: Bug fix
- docs: Documentation
- style: Formatting
- refactor: Code restructuring
- test: Adding tests
- chore: Maintenance

## Pull Request Process

1. Update documentation
2. Add tests if needed
3. Ensure all tests pass
4. Request review
5. Address feedback
6. Merge when approved

## Questions?

Open an issue for:
- Bug reports
- Feature requests
- Questions
- Documentation updates

## Development Environment

### Prerequisites
- Node.js installed (for TypeScript compilation only)
- Git for version control
- A code editor with TypeScript support (VS Code recommended)

### Important Notes
- DO NOT use npm or yarn for package management
- All dependencies are managed through the GitHub repository
- Type definitions and packages should be committed directly to the repository
- If you need to add new dependencies, commit them directly to the repository

### Setup
1. Clone the repository
2. Open the project in your code editor
3. Ensure TypeScript compilation is working
4. Start developing! 
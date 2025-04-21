# Contributing to Fantasy Football App

## Development Workflow

This project is deployed through Netlify, which handles all dependency installation and build processes. Local development should focus on code changes rather than dependency management.

### Important Notes

1. **Dependencies**
   - Do not run `npm` or `yarn` commands locally
   - All dependencies are managed through `package.json`
   - Netlify handles installation during deployment
   - To add new dependencies:
     - Add them to `package.json`
     - Commit the change
     - Netlify will install them during the next deployment

2. **Type Declarations**
   - `.ts` files contain implementation code
   - `.d.ts` files contain type declarations only
   - Type declarations should be in the `types/` directory
   - Implementation files should be in their respective feature directories

3. **Build Process**
   - Builds are handled by Netlify
   - Build configuration is in `netlify.toml`
   - Environment variables are managed in Netlify dashboard

4. **Development Best Practices**
   - Always include proper type declarations
   - Use debug flags for development
   - Keep contexts small and focused
   - Document complex logic
   - Test changes locally before pushing

5. **File Structure**
   ```
   ├── components/     # React components
   ├── contexts/      # React contexts
   ├── pages/         # Next.js pages
   ├── services/      # API services
   ├── types/         # Type declarations (.d.ts files)
   ├── utils/         # Utility functions
   └── public/        # Static assets
   ```

6. **Debugging**
   - Use the debug section in development
   - Log important state changes
   - Check Netlify deploy logs for build issues

7. **Common Issues**
   - Missing type declarations
   - Incorrect import paths
   - Missing dependencies in package.json
   - Environment variables not set in Netlify

### Getting Started

1. Clone the repository
2. Create a new branch for your changes
3. Make your changes
4. Push your changes
5. Create a pull request
6. Wait for Netlify to deploy your changes

### Deployment

- All deployments are handled by Netlify
- Pushing to main triggers a production deployment
- Pull requests create preview deployments
- Check Netlify dashboard for build status and logs

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

## ⚠️ IMPORTANT WARNING ⚠️

**DO NOT RUN NPM COMMANDS OR ATTEMPT TO INSTALL PACKAGES.** The development environment is already set up and configured. Any attempts to run npm commands or install packages will be rejected.

**ALWAYS CHECK THIS FILE BEFORE MAKING ANY UPDATES** to ensure compliance with project guidelines and avoid unnecessary package installation attempts.

## Communication Rules

1. **Be Clear and Concise**
   - Use clear, descriptive commit messages
   - Keep pull request descriptions focused and informative
   - Document complex logic or decisions in code comments

2. **Be Respectful**
   - Use professional language
   - Respect different opinions and approaches
   - Provide constructive feedback

3. **Be Collaborative**
   - Share knowledge and insights
   - Help others understand your changes
   - Be open to suggestions and improvements

4. **Code Review Guidelines**
   - Review code for functionality, readability, and maintainability
   - Suggest improvements when appropriate
   - Approve only when satisfied with the changes

5. **Issue Management**
   - Use clear, descriptive issue titles
   - Provide detailed information about bugs or feature requests
   - Update issues with progress and resolution

6. **Documentation**
   - Keep documentation up-to-date with code changes
   - Document new features and significant changes
   - Include examples for complex functionality

7. **Testing**
   - Write tests for new features
   - Ensure existing tests pass before submitting changes
   - Document test coverage and edge cases

8. **Version Control**
   - Use feature branches for new work
   - Keep commits focused and atomic
   - Follow the project's branching strategy

9. **Security**
   - Report security vulnerabilities privately
   - Follow security best practices
   - Protect sensitive information

10. **Project Structure**
    - Follow the established project structure
    - Place files in appropriate directories
    - Maintain consistent naming conventions

Remember: These guidelines are designed to maintain code quality and foster a positive development environment. Always refer to this document before making any changes or attempting to modify the development environment. 
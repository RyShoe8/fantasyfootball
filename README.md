# Fantasy Football App

A Next.js application for managing fantasy football leagues using the Sleeper API.

## Features

- User authentication with Sleeper API
- League management
- Roster tracking
- Player statistics
- Draft management

## Getting Started

### Prerequisites

- Node.js 18 or later
- Git

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/yourusername/fantasyfootball.git
   cd fantasyfootball
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Run the development server
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Deployment to Netlify

This project is configured for easy deployment to Netlify:

1. Push your code to GitHub
2. Connect your GitHub repository to Netlify
3. Netlify will automatically detect the Next.js configuration and build settings
4. The `netlify.toml` file contains all necessary configuration

### Environment Variables

If you need to set up environment variables in Netlify:

1. Go to Site settings > Build & deploy > Environment
2. Add any required environment variables

## Project Structure

```
fantasyfootball/
├── components/     # React components
├── contexts/      # React contexts
├── pages/         # Next.js pages
├── services/      # API services
├── types/         # TypeScript types
└── utils/         # Utility functions
```

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the MIT License - see the LICENSE file for details. 
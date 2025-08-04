# AMA Farcaster MiniApp 🎤

An Ask Me Anything (AMA) platform built as a Farcaster MiniApp. Users can create AMA sessions, ask questions, tip creators, and interact with the Farcaster community.

This is a [NextJS](https://nextjs.org/) + TypeScript + React app with MongoDB backend integration.

## Features

- **Create AMA Sessions**: Host your own Ask Me Anything sessions
- **Ask Questions**: Submit questions to any live AMA session
- **Tip Creators**: Support session hosts with USDC tips
- **Social Integration**: Share sessions and questions in Farcaster feeds
- **User Profiles**: Leverage Farcaster usernames and profile pictures
- **Automatic Session Management**: Sessions auto-expire after 1 week with archival
- **Best Friends Algorithm**: Discover users you interact with most

## Architecture

- **Frontend**: Next.js with Farcaster MiniApp SDK integration
- **Backend**: MongoDB with Mongoose ODM
- **Authentication**: Farcaster-native authentication (FID-based)
- **Payments**: USDC tipping with transaction validation

## Getting Started

### Prerequisites
- Node.js 22.11.0 or higher
- MongoDB (local or Atlas)
- Git

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd ama
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
# Edit .env.local with your MongoDB URI and other settings
```

4. Start the development server:
```bash
npm run dev
```

### Environment Variables
Create a `.env.local` file with:
```env
MONGODB_URI=mongodb://localhost:27017/ama-app
NEYNAR_API_KEY=your_neynar_api_key_here
NEXTAUTH_SECRET=your_secret_here
NEXTAUTH_URL=http://localhost:3000
```

## Database Models

### Core Models
- **User**: Farcaster users with FID, username, and profile pictures
- **Session**: AMA sessions with creator, title, description, and auto-expiry
- **Question**: Q&A pairs linked to sessions with optional answers
- **Tip**: USDC tips with transaction validation
- **ArchivedSessionStats**: Historical data for ended sessions

See [BACKEND_README.md](./BACKEND_README.md) for detailed API documentation.

## MiniApp Integration

This app integrates with Farcaster through:
- **Embeds**: Sessions can be shared as rich cards in casts
- **Authentication**: Uses Farcaster FID-based auth
- **Social Discovery**: Viral sharing through Farcaster feeds
- **Notifications**: Push notifications for session activity

## Deploying to Production

### Vercel Deployment
```bash
npm run deploy:vercel
```

### Manual Deployment
1. Build the project:
```bash
npm run build
```

2. Set up your production environment variables
3. Deploy to your preferred hosting platform

## Development

### Database Setup
1. Install MongoDB locally or use MongoDB Atlas
2. Set `MONGODB_URI` in your `.env.local`
3. The app will auto-connect when API routes are called

### Testing
```bash
npm run test        # Run tests
npm run test:watch  # Watch mode
```

### Linting
```bash
npm run lint        # Check for issues
npm run lint:fix    # Auto-fix issues
```

### Recommended: Using `npm link` for Local Development

To iterate on the CLI and test changes in a generated app without publishing to npm:

1. In your installer/template repo (this repo), run:
   ```bash
   npm link
   ```
   This makes your local version globally available as a symlinked package.


1. Now, when you run:
   ```bash
   npx @neynar/create-farcaster-mini-app
   ```
   ...it will use your local changes (including any edits to `init.js` or other files) instead of the published npm version.

### Alternative: Running the Script Directly

You can also run the script directly for quick iteration:

```bash
## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built with [Neynar](https://neynar.com) Farcaster MiniApp framework
- Powered by [Farcaster](https://farcaster.xyz) protocol
- Database powered by [MongoDB](https://mongodb.com)

## Links

- [Farcaster MiniApps Documentation](https://miniapps.farcaster.xyz/docs)
- [Neynar Developer Documentation](https://docs.neynar.com)
- [Backend API Documentation](./BACKEND_README.md)


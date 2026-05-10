# Toolmetry Bot

Advanced Discord Bot with Dashboard featuring Tickets, Moderation, YouTube Notifications, Leveling, and Premium Payments.

## Features

- **Ticket System**: Create support tickets with transcripts and ratings
- **Moderation**: Warn, kick, ban, timeout users with auto-moderation
- **YouTube Notifications**: Get notified when channels upload new videos
- **Leveling System**: XP and levels with role rewards
- **Embed Builder**: Create and send beautiful Discord embeds
- **Welcome/Leave Messages**: Customizable welcome and leave messages
- **Premium System**: QR code payments with admin approval
- **Custom Branding**: Premium users can customize bot name and avatar per server
- **Admin Panel**: Full user management, payment approval, and broadcast system

## Installation

```bash
# Install dependencies
npm install

# Install client dependencies
cd client && npm install && cd ..

# Setup environment
cp .env.example .env
# Edit .env with your credentials

# Start development
npm run dev

# Or start production
npm start
```

## Environment Variables

```env
# Discord Bot
DISCORD_TOKEN=your_bot_token
DISCORD_CLIENT_ID=your_client_id
DISCORD_CLIENT_SECRET=your_client_secret

# Database
MONGODB_URI=your_mongodb_uri

# JWT Secret
JWT_SECRET=your_jwt_secret

# Server
PORT=5000
CLIENT_URL=http://localhost:3000
DISCORD_REDIRECT_URI=http://localhost:3000/auth/callback

# Payment (UPI)
UPI_ID=yourupi@upi
```

## Slash Commands

- `/ticket <subject>` - Create a support ticket
- `/ticket-panel` - Send ticket panel (Admin)
- `/warn <user> [reason]` - Warn a user
- `/ban <user> [reason] [duration]` - Ban a user
- `/kick <user> [reason]` - Kick a user
- `/role <add/remove/all> <user/role>` - Manage roles
- `/rank [user]` - Check user rank
- `/roll [sides] [dice]` - Roll dice
- `/purge <amount> [user] [contains]` - Delete messages
- `/help` - Show help

## Dashboard Features

- Discord OAuth2 login
- Server management
- Ticket management
- Moderation logs
- Embed builder with preview
- YouTube notification setup
- Premium subscription with QR payments
- Admin panel for user/payment management

## Production Deployment

1. Set up environment variables
2. Build client: `npm run build`
3. Start server: `npm start`
4. Set up MongoDB
5. Configure Discord OAuth2 redirect URI

## License

MIT sd

# Green - AI-Powered Web3 Terminal

A sophisticated web application combining AI capabilities with Web3 functionality, featuring a terminal-style interface for cryptocurrency analysis and trading.

## Features

### Web3 Integration
- Phantom Wallet connection for Solana
- Token-gated access system
- Balance verification
- Secure session management

### AI & Data Features
- OpenAI GPT-4 integration
- DALL-E image generation
- Real-time cryptocurrency data
- Global weather information
- Worldwide time zones
- TradingView charts

### Terminal Commands
```bash
# AI Commands
/imagine <prompt>    # Generate images using DALL-E
/meme <prompt>      # Create memes with AI

# Market Data
/ca <address>       # Get token information
/ticker <symbol>    # Look up token by symbol
/dex latest         # Show recent Solana pairs
/dex trending       # Display trending tokens
/dex boosted        # View most boosted tokens
/gecko              # Top 50 by market cap
/gecko trending     # Trending on CoinGecko
/chart <pair>       # Display TradingView chart

# Utility Commands
/weather            # Local weather
/weather <city>     # City-specific weather
/time               # Current local time
/time <location>    # Time in specific location
/reboot             # Reboot terminal
/help               # Show commands
/docs               # Show documentation
```

## Technology Stack

- **Frontend**: Next.js 14, React, TypeScript
- **Blockchain**: Solana Web3.js
- **AI**: OpenAI API (GPT-4, DALL-E)
- **Data**: DexScreener, CoinGecko, TradingView
- **Authentication**: Cryptographic signatures
- **Styling**: Custom CSS with terminal aesthetics

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/green.git
cd green
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

Required environment variables:
```env
# Authentication
SESSION_SECRET=your_session_secret

# APIs
OPENAI_API_KEY=your_openai_key
OPENWEATHER_API_KEY=your_weather_key

# Optional Token Gating
TOKEN_ADDRESS=solana_token_address
TOKEN_AMOUNT=minimum_token_amount
```

4. Run the development server:
```bash
npm run dev
```

## Environment Setup

### Required Variables
- `SESSION_SECRET`: For session encryption
- `OPENAI_API_KEY`: OpenAI API access
- `OPENWEATHER_API_KEY`: Weather data access

### Optional Variables
- `TOKEN_ADDRESS`: Solana token address for gating
- `TOKEN_AMOUNT`: Minimum token requirement
- `SYSTEM_PROMPT`: Custom AI system prompt

## Development

### Project Structure
```
green/
├── src/
│   ├── app/
│   │   ├── api/         # API routes
│   │   ├── components/  # React components
│   │   └── utils/       # Utility functions
│   ├── hooks/           # Custom React hooks
│   ├── types/           # TypeScript definitions
│   └── services/        # External service integrations
├── public/              # Static assets
└── styles/             # Global styles
```

### API Routes
- `/api/session/*` - Session management
- `/api/openai` - AI interactions
- `/api/market/*` - Cryptocurrency data
- `/api/weather` - Weather information

## Security Features

- Encrypted session management
- Secure cookie handling
- Signature verification
- Token balance validation
- Rate limiting
- Error handling

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- OpenAI for AI capabilities
- DexScreener for market data
- CoinGecko for cryptocurrency information
- OpenWeather for weather data
- TradingView for charts

## Support

For support, please open an issue in the repository or contact the maintainers.

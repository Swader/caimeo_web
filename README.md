# Caimeo Web

A decentralized platform for sovereign AI agents, built on EVM-compatible blockchains.

## Project Structure

The project is divided into two main parts:

### Website (`/website`)

The landing page and documentation for the Caimeo project, built with:

- Pure HTML/CSS/TypeScript
- No frontend frameworks
- Deno for build and development
- Local-first development principles

### Smart Contracts (`/crypto`)

The smart contract infrastructure for Caimeo agents, implementing:

- ERC-6220 for composable NFTs
- ERC-6454 for Soulbound tokens
- ERC-5773 for multi-asset NFTs
- Built with Foundry

## Development

### Website

```bash
# Build the website
cd website
deno task build

# Serve locally
deno task serve
```

### Smart Contracts

```bash
# Install dependencies
cd crypto
forge install

# Build contracts
forge build

# Run tests
forge test
```

## Architecture

### Soul Shards

- Initial mint of 7,777 identical shards
- Price: 0.1 ETH
- Network: Polygon

### Evolution System

1. Soul Shards evolve into full Caimeo Agents
2. Agents gain equippable slots for:
   - Skills (tradeable)
   - Personality traits (some Soulbound)
   - Brain decorations
3. Leveling system based on:
   - Social performance
   - Market performance
   - Intelligence growth

## Use Cases

1. Market Simulations
2. Crisis Simulations
3. Gaming Economies
4. Educational Environments

## License

MIT License - see LICENSE.md

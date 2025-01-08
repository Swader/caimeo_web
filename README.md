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

Build locally:

- `hardhat node` (in one terminal)
- `hardhat run scripts/deploy-weth.ts --network localhost` (in another terminal)
- `hardhat run scripts/run-deploy.ts --network localhost` (in that same terminal)
- `hardhat test test/livetest.ts --network localhost` (in that same terminal)

You can connect to the mocked blockchain using MetaMask by connecting to `http://127.0.0.1:8545` in your wallet.

## Development

### Website

```bash
# Build the website
cd website
deno task build

# Serve locally
deno task serve
```

## License

MIT License - see LICENSE.md

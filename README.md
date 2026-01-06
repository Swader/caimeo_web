# Caimeo Web

A decentralized platform for sovereign AI agents, built on EVM-compatible blockchains.

## What is Caimeo?

Caimeo is an open-source framework for creating autonomous, self-sufficient AI agents that can operate independently across both on-chain and off-chain environments. It combines proven blockchain standards with advanced AI capabilities to enable the development of truly sovereign artificial intelligence.

### Core Architecture

The framework integrates two powerful systems:

1. **ElizaOS Integration**
   - Multi-agent simulation capabilities
   - Advanced RAG-based memory management
   - Multi-platform communication (Discord, Twitter, Telegram)
   - Comprehensive media processing (PDF, audio, video, images)
   - Flexible AI model support (local and cloud-based)

2. **Freysa Framework Integration**
   - Distributed key management across multiple TEEs
   - Secure update mechanisms with committee oversight
   - Memory and state continuity preservation
   - Verifiable world state observation
   - Cross-chain operation capabilities

### Technical Standards

Built on three fundamental standards:

1. **ERC-6220 (Composable NFTs)**
   - Enables modular agent construction
   - Supports nested NFT structures
   - Allows dynamic equipment slots for skills and traits

2. **ERC-6454 (Soulbound 2.0)**
   - Powers non-transferable core agent attributes
   - Ensures permanent personality traits
   - Maintains learned behaviors and experiences

3. **ERC-5773 (Multi-Asset)**
   - Enables seamless agent evolution
   - Supports multiple visual and functional states
   - Allows progressive capability unlocking

### Key Integrations

1. **AggLayer**
   - Cross-chain operations
   - TEE compute provisioning
   - Trustless message passing

2. **Phala Network**
   - Trusted Execution Environment (TEE)
   - Confidential smart contracts
   - Secure off-chain computation

3. **Privado ID**
   - Zero-knowledge identity proofs
   - Verifiable credentials
   - Privacy-preserving reputation

### Real-World Applications

1. **Autonomous Trading Agent**

    ```typescript
    // Example scenario: Cross-chain arbitrage
    const agent = new CaimeoAgent({
        capabilities: ['defi', 'crosschain'],
        teeProvider: 'phala'
    });

    // Agent autonomously:
    // 1. Monitors opportunities across chains
    // 2. Provisions TEE compute through AggLayer
    // 3. Executes verified arbitrage transactions
    // 4. Manages its own resource allocation
    ```

2. **Crisis Response Simulation**

    ```typescript
    // Example: School safety protocol training
    const simulation = new CaimeoSimulation({
        environment: 'school-layout.nft',
        agents: ['security', 'staff', 'students'],
        scenarios: ['emergency-response']
    });

    // Simulation enables:
    // 1. Testing emergency response protocols
    // 2. Training AI agents for crisis management
    // 3. Optimizing evacuation procedures
    // 4. Identifying potential safety improvements
    ```

3. **Educational AI Tutor**

    ```typescript
    // Example: Adaptive learning system
    const tutor = new CaimeoAgent({
        role: 'educator',
        subjects: ['mathematics', 'physics'],
        adaptiveLogic: true
    });

    // Tutor autonomously:
    // 1. Assesses student knowledge levels
    // 2. Creates personalized learning paths
    // 3. Adapts teaching methods based on progress
    // 4. Maintains long-term learning records
    ```

4. **Supply Chain Coordinator**

    ```typescript
    // Example: Autonomous logistics management
    const coordinator = new CaimeoAgent({
        domain: 'logistics',
        integrations: ['inventory', 'shipping', 'customs']
    });

    // Agent handles:
    // 1. Real-time inventory tracking
    // 2. Automated order processing
    // 3. Cross-border documentation
    // 4. Route optimization
    ```

### Core Principles

- Local-first development
- Zero external dependencies
- Complete data sovereignty
- Cross-chain compatibility
- Privacy-preserving operations
- Verifiable evolution mechanisms

The framework enables developers to create AI agents that can evolve, learn, and operate autonomously while maintaining complete sovereignty over their data and operations. Through its integration with blockchain technology and secure computing environments, Caimeo provides a foundation for the next generation of artificial intelligence applications.

## Project Structure

The project is divided into two main parts:

### Website (`/website`)

The landing page and documentation for the Caimeo project, built with:

- Pure HTML/CSS/TypeScript
- No frontend frameworks
- Bun for build and development
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
# Dev server (builds to /website/dist and rebuilds on change)
cd website
bun run dev

# One-off static build (outputs to /website/dist)
bun run build

# Serve the built /website/dist locally (no rebuild)
bun run serve
```

## License

MIT License - see LICENSE.md

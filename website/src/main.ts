import { ethers } from "./ethers.umd.min.js";

// Environment-specific constants
const IS_LOCAL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const RPC_URL = IS_LOCAL ? 'http://127.0.0.1:8545' : 'https://polygon.llamarpc.com';

// WETH Configuration
const WETH_ADDRESS = IS_LOCAL 
  ? "0x5FbDB2315678afecb367f032d93F642f64180aa3"  // Local WETH
  : "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619"; // Polygon WETH

const WETH_ABI = [
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)"
];

// SoulShard Configuration
const CONTRACT_ADDRESS = IS_LOCAL
  ? "0xa5ccC3adcf29fdC16715E01d5BC32ecD32302b9a"  // Local SoulShard
  : "0x49720558e787A05599af05f8090d7927237142DC"; // Polygon SoulShard

const MAX_SUPPLY = 7777;
const MAX_WETH_APPROVAL = "7"; // 7 WETH max approval amount

// Contract ABI
const CONTRACT_ABI = [
    {
      "inputs": [],
      "name": "totalSupply",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "totalSupply_",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "pricePerMint",
      "outputs": [{"internalType": "uint256","name": "","type": "uint256"}],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {"internalType": "address","name": "to","type": "address"},
        {"internalType": "uint256","name": "numToMint","type": "uint256"}
      ],
      "name": "mint",
      "outputs": [{"internalType": "uint256","name": "","type": "uint256"}],
      "stateMutability": "nonpayable",
      "type": "function"
    }
];

// UI Update Configuration
const PROGRESS_UPDATE_INTERVAL = 30000; // 30 seconds

// Global state
let userAddress: string | null = null;

declare global {
    interface Window {
        ethereum: any;
    }
}

// Smooth scroll handling
document.querySelectorAll('a[href^="#"]').forEach((anchor: Element) => {
    anchor.addEventListener('click', function(this: HTMLAnchorElement, e: Event) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href')!);
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth'
            });
        }
    });
});

// Intersection Observer for fade-in animations
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
        }
    });
}, {
    threshold: 0.1
});

// Observe all sections
document.querySelectorAll('section').forEach((section) => {
    observer.observe(section);
});

// Handle mint button click
const mintButton = document.querySelector('a[href="#mint"]');
if (mintButton) {
    mintButton.addEventListener('click', async (e) => {
        e.preventDefault();
        // TODO: Implement minting functionality when smart contract is ready
        alert('Minting functionality coming soon!');
    });
}

// Add this function to handle wallet connection
async function connectWallet(): Promise<string | null> {
    try {
        if (!window.ethereum) {
            alert('Please install MetaMask to mint Soul Shards!');
            return null;
        }

        const provider = new ethers.providers.Web3Provider(window.ethereum);
        
        // Request account access
        const accounts = await provider.send("eth_requestAccounts", []);
        
        if (accounts.length > 0) {
            userAddress = accounts[0];
            console.log('Connected wallet:', userAddress);
            return userAddress;
        }
        
        return null;
    } catch (error) {
        console.error('Error connecting wallet:', error);
        return null;
    }
}

// Update the handleMint function
async function handleMint() {
    try {
        if (!userAddress) {
            const address = await connectWallet();
            if (!address) {
                console.log('Failed to connect wallet');
                return;
            }
        }

        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const mintAmount = Number((document.getElementById('mint-amount') as HTMLSelectElement).value);
        
        // Initialize contracts
        const wethContract = new ethers.Contract(WETH_ADDRESS, WETH_ABI, signer);
        const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
        
        // Calculate total cost for this mint
        const pricePerMint = await contract.pricePerMint();
        const totalCost = pricePerMint.mul(mintAmount);
        
        // Check current allowance
        const allowance = await wethContract.allowance(userAddress, CONTRACT_ADDRESS);
        
        // Only request approval if current allowance is less than needed
        if (allowance.lt(totalCost)) {
            console.log('Requesting WETH approval...');
            // Request approval for max amount (7 WETH) to save gas on future mints
            const maxApproval = ethers.utils.parseEther(MAX_WETH_APPROVAL);
            const approveTx = await wethContract.approve(CONTRACT_ADDRESS, maxApproval);
            await approveTx.wait();
            console.log('WETH approved');
        } else {
            console.log('Sufficient WETH already approved');
        }

        console.log(`Minting ${mintAmount} Soul Shard(s) for ${ethers.utils.formatEther(totalCost)} WETH`);

        // Execute mint
        const mintTx = await contract.mint(userAddress, mintAmount);
        const receipt = await mintTx.wait();
        
        console.log('Mint successful!', receipt);
        
        // Update the progress bar
        updateMintProgress();

    } catch (error) {
        console.error('Error during minting:', error);
        if (error.code === 4001) {
            console.log('User rejected the transaction');
        } else if (error.code === -32603) {
            console.log('Internal JSON-RPC error. Check if you have enough WETH balance');
        }
    }
}

// Update the mint button event listener
document.addEventListener('DOMContentLoaded', () => {
    const mintButton = document.getElementById('mint-button');
    if (mintButton) {
        mintButton.addEventListener('click', handleMint);
    }

    // Check if already connected
    if (window.ethereum) {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        provider.send("eth_accounts", [])
            .then(accounts => {
                if (accounts.length > 0) {
                    userAddress = accounts[0];
                    console.log('Already connected:', userAddress);
                }
            })
            .catch(console.error);

        // Listen for account changes
        window.ethereum.on('accountsChanged', (accounts: string[]) => {
            if (accounts.length > 0) {
                userAddress = accounts[0];
                console.log('Account changed:', userAddress);
            } else {
                userAddress = null;
                console.log('Disconnected from wallet');
            }
        });
    }
});

async function updateMintProgress() {
    try {
        // Create Web3 instance
        const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
        const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);

        // Get total supply
        const totalSupply = await contract.totalSupply();
        const minted = Number(totalSupply);

        // Update progress bar and count
        const progressBar = document.getElementById('mint-progress');
        const mintedCount = document.getElementById('minted-count');

        if (progressBar && mintedCount) {
            const percentage = (minted / MAX_SUPPLY) * 100;
            progressBar.style.width = `${percentage}%`;
            mintedCount.textContent = minted.toString();
        }
    } catch (error) {
        console.error('Error updating mint progress:', error);
    }
}

// Update progress every 30 seconds
setInterval(updateMintProgress, PROGRESS_UPDATE_INTERVAL);

// Initial update
updateMintProgress(); 
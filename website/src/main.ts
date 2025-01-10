import { ethers } from "./ethers.umd.min.js";

// Environment-specific constants
const IS_LOCAL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const POLYGON_RPC_URLS = [
    'https://polygon.llamarpc.com',
    'https://polygon.rpc.subquery.network/public',
    'https://polygon.drpc.org',
    'https://polygon.meowrpc.com',
    'https://polygon-rpc.com', 
    'https://1rpc.io/matic'
];
const RPC_URL = IS_LOCAL ? 'http://127.0.0.1:8545' : POLYGON_RPC_URLS[Math.floor(Math.random() * POLYGON_RPC_URLS.length)];

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
  : "0xa5b2596Dcf404D8c23621F0F4189570a2Ce5B2ab"; // Polygon SoulShard

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
const PROGRESS_UPDATE_INTERVAL = 300000; // 5 minutes

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

// Add these helper functions at the top
function setMintButtonLoading(isLoading: boolean) {
    const mintButton = document.getElementById('mint-button');
    if (mintButton) {
        if (isLoading) {
            mintButton.classList.add('loading');
            mintButton.textContent = 'Processing...';
            mintButton.setAttribute('disabled', 'true');
        } else {
            mintButton.classList.remove('loading');
            mintButton.textContent = 'Mint Soul Shard';
            mintButton.removeAttribute('disabled');
        }
    }
}

function showTransactionStatus(message: string, isError = false) {
    const statusDiv = document.createElement('div');
    statusDiv.className = `transaction-status ${isError ? 'error' : 'success'}`;
    statusDiv.textContent = message;
    
    // Remove any existing status messages
    document.querySelectorAll('.transaction-status').forEach(el => el.remove());
    
    // Add new status message
    const mintControls = document.querySelector('.mint-controls');
    if (mintControls) {
        mintControls.appendChild(statusDiv);
        // Remove after 5 seconds
        setTimeout(() => statusDiv.remove(), 5000);
    }
}

// Update the handleMint function
async function handleMint() {
    setMintButtonLoading(true);
    try {
        if (!userAddress) {
            const address = await connectWallet();
            if (!address) {
                showTransactionStatus('Failed to connect wallet', true);
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
            showTransactionStatus('Requesting WETH approval...');
            // Request approval for max amount (7 WETH) to save gas on future mints
            const maxApproval = ethers.utils.parseEther(MAX_WETH_APPROVAL);
            const approveTx = await wethContract.approve(CONTRACT_ADDRESS, maxApproval);
            showTransactionStatus('Confirming WETH approval...');
            await approveTx.wait();
            showTransactionStatus('WETH approved!');
        }

        showTransactionStatus(`Minting ${mintAmount} Soul Shard(s)...`);
        const mintTx = await contract.mint(userAddress, mintAmount);
        showTransactionStatus('Confirming transaction...');
        await mintTx.wait();
        
        showTransactionStatus('Mint successful!');
        updateMintProgress();

    } catch (error) {
        console.error('Error during minting:', error);
        if (error.code === 4001) {
            showTransactionStatus('Transaction cancelled', true);
        } else if (error.code === -32603) {
            showTransactionStatus('Insufficient WETH balance', true);
        } else {
            showTransactionStatus('Transaction failed', true);
        }
    } finally {
        setMintButtonLoading(false);
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

// Mobile menu handling
document.addEventListener('DOMContentLoaded', () => {
    const menuToggle = document.querySelector('.menu-toggle');
    const navLinks = document.querySelector('.nav-links');
    
    // Create and append overlay
    const overlay = document.createElement('div');
    overlay.className = 'menu-overlay';
    document.body.appendChild(overlay);
    
    menuToggle?.addEventListener('click', () => {
        menuToggle.classList.toggle('active');
        navLinks?.classList.toggle('active');
        overlay.classList.toggle('active');
        document.body.style.overflow = navLinks?.classList.contains('active') ? 'hidden' : '';
    });

    // Close menu when clicking overlay
    overlay.addEventListener('click', () => {
        menuToggle?.classList.remove('active');
        navLinks?.classList.remove('active');
        overlay.classList.remove('active');
        document.body.style.overflow = '';
    });

    // Close menu when clicking a link
    navLinks?.addEventListener('click', () => {
        menuToggle?.classList.remove('active');
        navLinks.classList.remove('active');
        overlay.classList.remove('active');
        document.body.style.overflow = '';
    });
}); 
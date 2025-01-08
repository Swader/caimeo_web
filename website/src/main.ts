import { ethers } from "./ethers.umd.min.js";

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

// Contract ABI for totalSupply function
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
    }
  ];

const CONTRACT_ADDRESS = "0xa5ccC3adcf29fdC16715E01d5BC32ecD32302b9a"; // To be updated after deployment
const MAX_SUPPLY = 7777;

async function updateMintProgress() {
    try {
        const rpcUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
            ? 'http://127.0.0.1:8545'
            : 'https://polygon.llamarpc.com';

        // Create Web3 instance
        const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
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
setInterval(updateMintProgress, 30000);

// Initial update
updateMintProgress(); 
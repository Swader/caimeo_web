import { ethers } from "hardhat";

export async function main() {
    // Get user address from env
    const userAddress = process.env.USER_ADDRESS;
    if (!userAddress) {
        throw new Error("USER_ADDRESS not set in .env");
    }

    console.log("Deploying TestWETH...");
    const TestWETH = await ethers.getContractFactory("TestWETH");
    const weth = await TestWETH.deploy();
    await weth.waitForDeployment();
    const wethAddress = await weth.getAddress();
    console.log("TestWETH deployed to:", wethAddress);

    // Mint initial supply
    const mintAmount = ethers.parseUnits("1000", 18); // 1000 WETH
    console.log("Minting", ethers.formatUnits(mintAmount, 18), "WETH to", userAddress);
    await weth.mint(userAddress, mintAmount);
    console.log("Minting complete");

    console.log("\n=== Deployment Summary ===");
    console.log("WETH Address:", wethAddress);
    console.log("User Address:", userAddress);
    console.log("Initial Supply:", "1000 WETH");
    console.log("\nAdd this to your .env file:");
    console.log(`LOCAL_WETH_ADDRESS="${wethAddress}"`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
}); 
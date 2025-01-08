import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract } from "ethers";
import { SoulShard } from "../typechain-types";
import { describe, it, before } from "mocha";
import process from "node:process";

describe("Minting Tests", function () {
    let soulShard: SoulShard;
    let weth: Contract;
    let signerAddress: string;

    before(async function () {
        // Get the signer from private key
        const privateKey = process.env.PRIVATE_KEY;
        if (!privateKey) {
            throw new Error("PRIVATE_KEY not set in .env");
        }
        const signer = new ethers.Wallet(privateKey, ethers.provider);
        signerAddress = await signer.getAddress();

        // Get the WETH address from env (set by deployment test)
        const wethAddress = process.env.LOCAL_WETH_ADDRESS;
        if (!wethAddress) {
            throw new Error("LOCAL_WETH_ADDRESS not set. Please run deployment tests first.");
        }

        // Get contract instances
        const TestWETH = await ethers.getContractFactory("TestWETH");
        weth = TestWETH.attach(wethAddress);

        // Get SoulShard instance
        const soulShardAddress = process.env.SOULSHARDS_ADDRESS;
        if (!soulShardAddress) {
            throw new Error("SOULSHARDS_ADDRESS not set. Please run deployment tests first.");
        }
        const soulShardFactory = await ethers.getContractFactory("SoulShard");
        soulShard = soulShardFactory.attach(soulShardAddress) as SoulShard;

        // Approve WETH spending - enough for many mints
        console.log("Approving WETH spending...");
        const approveAmount = ethers.parseUnits("777", 18); // 777 WETH
        const approveTx = await weth.connect(signer).approve(soulShardAddress, approveAmount);
        await approveTx.wait();
        console.log("WETH approved for spending");

        // Verify approval
        const allowance = await weth.allowance(signerAddress, soulShardAddress);
        console.log("WETH allowance:", ethers.formatUnits(allowance, 18), "WETH");
        if (allowance < ethers.parseUnits("1", 18)) {
            throw new Error("WETH approval failed");
        }
    });

    describe("Minting", function () {
        it("should start with zero supply", async function () {
            expect(await soulShard.totalSupply()).to.equal(0n);
            expect(await soulShard.balanceOf(signerAddress)).to.equal(0n);
        });

        it("should successfully mint first NFT", async function () {
            // Get signer with private key
            const signer = new ethers.Wallet(process.env.PRIVATE_KEY!, ethers.provider);
            
            // Get initial balances
            const initialWethBalance = await weth.balanceOf(signerAddress);
            const mintPrice = await soulShard.pricePerMint();
            
            // Mint one NFT
            const tx = await soulShard.connect(signer).mint(signerAddress, 1);
            await tx.wait();

            // Check results
            expect(await soulShard.totalSupply()).to.equal(1n);
            expect(await soulShard.balanceOf(signerAddress)).to.equal(1n);
            expect(await soulShard.ownerOf(1)).to.equal(signerAddress);
            
            // Check WETH was spent
            const finalWethBalance = await weth.balanceOf(signerAddress);
            expect(finalWethBalance).to.equal(initialWethBalance - mintPrice);
        });

        it("should successfully batch mint 5 NFTs", async function () {
            // Get signer with private key
            const signer = new ethers.Wallet(process.env.PRIVATE_KEY!, ethers.provider);
            
            // Get initial balances
            const initialWethBalance = await weth.balanceOf(signerAddress);
            const mintPrice = await soulShard.pricePerMint();
            const numToMint = 5n;
            
            // Mint 5 NFTs
            const tx = await soulShard.connect(signer).mint(signerAddress, numToMint);
            await tx.wait();

            // Check results
            expect(await soulShard.totalSupply()).to.equal(6n); // 1 from before + 5 new
            expect(await soulShard.balanceOf(signerAddress)).to.equal(6n);
            
            // Check each NFT ownership
            for (let i = 2; i < 7; i++) {
                expect(await soulShard.ownerOf(i)).to.equal(signerAddress);
            }
            
            // Check WETH was spent (5 * mint price)
            const finalWethBalance = await weth.balanceOf(signerAddress);
            expect(finalWethBalance).to.equal(initialWethBalance - (mintPrice * numToMint));
        });

        it("should have correct WETH balance after all mints", async function () {
            const mintPrice = await soulShard.pricePerMint();
            const totalMinted = 6n; // 1 from first mint + 5 from batch mint
            const expectedSpent = mintPrice * totalMinted;
            const initialBalance = ethers.parseUnits("1000", 18);
            const expectedBalance = initialBalance - expectedSpent;
            
            const actualBalance = await weth.balanceOf(signerAddress);
            expect(actualBalance).to.equal(expectedBalance);
        });
    });
}); 
import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract } from "ethers";
import { SoulShard } from "../typechain-types";
import { describe, it, before } from "mocha";
import process from "node:process";

describe("Live Tests", function () {
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

    });

    describe("Contract State", function() {
        it("should have correct owner", async function() {
            const owner = await soulShard.owner();
            console.log("\nContract Owner:", owner);
            expect(owner.toLowerCase()).to.equal(process.env.USER_ADDRESS?.toLowerCase());
        });

        it("should have correct name and symbol", async function() {
            const name = await soulShard.name();
            const symbol = await soulShard.symbol();
            console.log("\nName:", name);
            console.log("Symbol:", symbol);
            expect(name).to.equal("SoulShard");
            expect(symbol).to.equal("SSHARD");
        });

        it("should have correct max supply", async function() {
            const maxSupply = await soulShard.maxSupply();
            console.log("\nMax Supply:", maxSupply.toString());
            expect(maxSupply).to.equal(7777n);
        });

        it("should have correct mint price", async function() {
            const price = await soulShard.pricePerMint();
            console.log("\nMint Price:", ethers.formatEther(price), "WETH");
            expect(price).to.equal(ethers.parseUnits("0.07", 18));
        });

        it("should use correct WETH contract", async function() {
            const erc20Address = await soulShard.erc20TokenAddress();
            const wethAddress = process.env.LOCAL_WETH_ADDRESS;
            console.log("\nERC20 Token Address:", erc20Address);
            console.log("Expected WETH Address:", wethAddress);
            expect(erc20Address.toLowerCase()).to.equal(wethAddress?.toLowerCase());
        });

        it("should show current total supply", async function() {
            const totalSupply = await soulShard.totalSupply();
            console.log("\nCurrent Total Supply:", totalSupply.toString());
            expect(totalSupply).to.be.lte(7777n);
        });
    });

    describe("User Balances", function() {
        it("should show correct ETH balance", async function() {
            const userAddress = process.env.USER_ADDRESS;
            if (!userAddress) throw new Error("USER_ADDRESS not set");
            
            const balance = await ethers.provider.getBalance(userAddress);
            console.log("\nUser ETH Balance:", ethers.formatEther(balance), "ETH");
            expect(balance).to.be.gt(ethers.parseEther("9.0")); // Should have at least 9 ETH from deployment
        });

        it("should show correct WETH balance", async function() {
            const userAddress = process.env.USER_ADDRESS;
            if (!userAddress) throw new Error("USER_ADDRESS not set");
            
            const balance = await weth.balanceOf(userAddress);
            const symbol = await weth.symbol();
            console.log("\nUser WETH Balance:", ethers.formatEther(balance), symbol);
            expect(balance).to.be.gte(ethers.parseUnits("1000", 18)); // Should have at least 1000 WETH from deployment
        });

        it("should show NFT balance", async function() {
            const userAddress = process.env.USER_ADDRESS;
            if (!userAddress) throw new Error("USER_ADDRESS not set");
            
            const balance = await soulShard.balanceOf(userAddress);
            console.log("\nUser NFT Balance:", balance.toString(), "SoulShards");
        });
    });

    describe("Withdrawal Functionality", function() {
        it("should show correct contract WETH balance", async function() {
            const balance = await weth.balanceOf(soulShard.target);
            console.log("\nContract WETH Balance:", ethers.formatEther(balance), "WETH");
        });

        it("should allow owner to withdraw if balance exists", async function() {
            const contractBalance = await weth.balanceOf(soulShard.target);
            if (contractBalance > 0n) {
                const ownerAddress = process.env.USER_ADDRESS!;
                const initialOwnerBalance = await weth.balanceOf(ownerAddress);
                
                // Withdraw all WETH
                const signer = new ethers.Wallet(process.env.PRIVATE_KEY!, ethers.provider);
                const tx = await soulShard.connect(signer).withdrawRaisedERC20(
                    weth.target,
                    ownerAddress,
                    contractBalance
                );
                await tx.wait();
                
                // Verify withdrawal
                const finalOwnerBalance = await weth.balanceOf(ownerAddress);
                const finalContractBalance = await weth.balanceOf(soulShard.target);
                
                console.log("\nWithdrawal Results:");
                console.log("Amount Withdrawn:", ethers.formatEther(contractBalance), "WETH");
                console.log("Owner Balance Change:", 
                    ethers.formatEther(finalOwnerBalance - initialOwnerBalance), "WETH");
                console.log("Final Contract Balance:", 
                    ethers.formatEther(finalContractBalance), "WETH");
                
                expect(finalContractBalance).to.equal(0n);
                expect(finalOwnerBalance).to.equal(initialOwnerBalance + contractBalance);
            } else {
                console.log("\nNo WETH balance to withdraw");
            }
        });

        it("should prevent non-owner withdrawal attempts", async function() {
            // Create a random wallet to act as non-owner
            const nonOwner = ethers.Wallet.createRandom().connect(ethers.provider);
            
            await expect(
                soulShard.connect(nonOwner).withdrawRaisedERC20(
                    weth.target,
                    nonOwner.address,
                    ethers.parseUnits("0.01", 18)
                )
            ).to.be.reverted;
            
            console.log("\nNon-owner withdrawal correctly prevented");
        });
    });
}); 
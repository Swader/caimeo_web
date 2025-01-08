import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract } from "ethers";
import { SoulShard } from "../typechain-types";
import { deploySoulShard } from "../scripts/deploy-methods";

describe("Deployment Tests", function () {
    let soulShard: SoulShard;
    let weth: Contract;
    let userAddress: string;
    let owner: string;
    let privateKeySigner: string;

    async function deployTestWETH(userAddress: string): Promise<Contract> {
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

        // Set the env variable for the SoulShard deployment
        process.env.LOCAL_WETH_ADDRESS = wethAddress;
        
        return weth;
    }

    before(async function () {
        userAddress = process.env.USER_ADDRESS || "";
        expect(userAddress, "USER_ADDRESS not set in .env").to.not.equal("");

        // Get the private key signer address
        const privateKey = process.env.PRIVATE_KEY;
        if (!privateKey) {
            throw new Error("PRIVATE_KEY not set in .env");
        }
        const pkSigner = new ethers.Wallet(privateKey, ethers.provider);
        privateKeySigner = await pkSigner.getAddress();

        // Deploy WETH first
        weth = await deployTestWETH(userAddress);
        
        // Deploy SoulShard (which will use the WETH address from env)
        soulShard = await deploySoulShard();
        owner = (await ethers.getSigners())[0].address;

        // Set the SoulShard address in env for other tests
        const soulShardAddress = await soulShard.getAddress();
        process.env.SOULSHARDS_ADDRESS = soulShardAddress;
        console.log("Environment variables set:");
        console.log("- LOCAL_WETH_ADDRESS:", process.env.LOCAL_WETH_ADDRESS);
        console.log("- SOULSHARDS_ADDRESS:", process.env.SOULSHARDS_ADDRESS);

        // Fund both accounts with ETH
        const deployer = (await ethers.getSigners())[0];
        const fundAmount = ethers.parseEther("10.0");
        
        console.log("Funding accounts with ETH:");
        console.log("- USER_ADDRESS:", userAddress);
        console.log("- PRIVATE_KEY signer:", privateKeySigner);
        
        await deployer.sendTransaction({
            to: userAddress,
            value: fundAmount
        });
        await deployer.sendTransaction({
            to: privateKeySigner,
            value: fundAmount
        });

        // Also mint WETH to private key signer
        await weth.mint(privateKeySigner, ethers.parseUnits("1000", 18));
    });

    describe("SoulShard Contract", function () {
        it("should have correct max supply", async function () {
            expect(await soulShard.maxSupply()).to.equal(7777n);
        });

        it("should have correct owner", async function () {
            expect(await soulShard.owner()).to.equal(owner);
        });

        it("should have correct mint price", async function () {
            expect(await soulShard.pricePerMint()).to.equal(ethers.parseUnits("0.07", 18));
        });

        it("should have correct WETH address", async function () {
            expect(await soulShard.erc20TokenAddress()).to.equal(await weth.getAddress());
        });
    });

    describe("User Balances", function () {
        it("should have ETH balance", async function () {
            const balance = await ethers.provider.getBalance(userAddress);
            expect(balance).to.be.gt(ethers.parseEther("9.0")); // Should have received 10 ETH minus gas costs
        });

        it("should have WETH balance", async function () {
            const balance = await weth.balanceOf(userAddress);
            expect(balance).to.equal(ethers.parseUnits("1000", 18)); // Should have received 1000 WETH
        });

        it("private key signer should have ETH balance", async function () {
            const balance = await ethers.provider.getBalance(privateKeySigner);
            expect(balance).to.be.gt(ethers.parseEther("9.0")); // Should have received 10 ETH minus gas costs
        });

        it("private key signer should have WETH balance", async function () {
            const balance = await weth.balanceOf(privateKeySigner);
            expect(balance).to.equal(ethers.parseUnits("1000", 18)); // Should have received 1000 WETH
        });
    });

    describe("WETH Contract", function () {
        it("should allow minting", async function () {
            const mintAmount = ethers.parseUnits("1", 18);
            await weth.mint(userAddress, mintAmount);
            const balance = await weth.balanceOf(userAddress);
            expect(balance).to.equal(ethers.parseUnits("1001", 18)); // Previous 1000 + 1 new
        });
    });
}); 
// Deploy all HackMoney 2026 integration contracts
const { ethers } = require("hardhat");
require("dotenv").config();

async function main() {
    console.log("🐴 POWER.HORSE - HackMoney 2026 Full Deployment\n");
    console.log("=".repeat(60));
    console.log("");
    
    const [deployer] = await ethers.getSigners();
    console.log("Deployer:", deployer.address);
    console.log("Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH");
    console.log("");
    
    const deployment = {
        network: "sepolia",
        timestamp: new Date().toISOString(),
        deployer: deployer.address
    };
    
    // Contract addresses
    const BONDING_CURVE = process.env.BONDING_CURVE;
    const FACTORY = process.env.FACTORY;
    const USDT = process.env.USDT;
    const LIFI_DIAMOND = process.env.LIFI_DIAMOND || "0x1231DEB6f5749EF6cE6943a275A1D3E7486F4EaE";
    
    console.log("Using existing contracts:");
    console.log("  Bonding Curve:", BONDING_CURVE);
    console.log("  Factory:", FACTORY);
    console.log("  USDT:", USDT);
    console.log("  LI.FI Diamond:", LIFI_DIAMOND);
    console.log("");
    console.log("=".repeat(60));
    console.log("");
    
    // Deploy Yellow Adapter
    console.log("1️⃣  Deploying YellowBondingCurveAdapter...");
    const YellowAdapter = await ethers.getContractFactory("YellowBondingCurveAdapter");
    const yellowAdapter = await YellowAdapter.deploy(
        deployer.address,
        BONDING_CURVE,
        FACTORY,
        deployer.address // Use deployer as relayer for now
    );
    await yellowAdapter.waitForDeployment();
    deployment.yellowAdapter = await yellowAdapter.getAddress();
    console.log("   ✅ Deployed:", deployment.yellowAdapter);
    console.log("");
    
    // Deploy Horse Agent
    console.log("2️⃣  Deploying HorsePortfolioAgent...");
    const Agent = await ethers.getContractFactory("HorsePortfolioAgent");
    const agent = await Agent.deploy(
        deployer.address,
        BONDING_CURVE,
        FACTORY,
        USDT,
        deployer.address // Use deployer as oracle for now
    );
    await agent.waitForDeployment();
    deployment.horseAgent = await agent.getAddress();
    console.log("   ✅ Deployed:", deployment.horseAgent);
    console.log("");
    
    // Deploy LI.FI Depositor
    console.log("3️⃣  Deploying CrossChainVaultDepositor...");
    const Depositor = await ethers.getContractFactory("CrossChainVaultDepositor");
    const depositor = await Depositor.deploy(
        deployer.address,
        BONDING_CURVE,
        FACTORY,
        LIFI_DIAMOND,
        USDT
    );
    await depositor.waitForDeployment();
    deployment.lifiDepositor = await depositor.getAddress();
    console.log("   ✅ Deployed:", deployment.lifiDepositor);
    console.log("");
    
    // Save deployment
    const fs = require("fs");
    const filename = `deployment-hackmoney-${Date.now()}.json`;
    fs.writeFileSync(filename, JSON.stringify(deployment, null, 2));
    
    console.log("=".repeat(60));
    console.log("");
    console.log("🎉 All contracts deployed successfully!");
    console.log("");
    console.log("📝 Deployment saved to:", filename);
    console.log("");
    console.log("📋 Contract Addresses:");
    console.log("  Yellow Adapter:", deployment.yellowAdapter);
    console.log("  Horse Agent:", deployment.horseAgent);
    console.log("  LI.FI Depositor:", deployment.lifiDepositor);
    console.log("");
    console.log("Next steps:");
    console.log("1. Update .env with new addresses");
    console.log("2. Verify contracts on Etherscan");
    console.log("3. Submit to HackMoney 2026!");
    console.log("");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });

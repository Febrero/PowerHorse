// Deploy CrossChainVaultDepositor
const { ethers } = require("hardhat");
require("dotenv").config();

async function main() {
    console.log("🐴 POWER.HORSE - Deploying LI.FI Cross-Chain Depositor\n");
    
    const [deployer] = await ethers.getSigners();
    console.log("Deployer address:", deployer.address);
    console.log("Deployer balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH\n");
    
    // Contract addresses from .env
    const BONDING_CURVE = process.env.BONDING_CURVE;
    const FACTORY = process.env.FACTORY;
    const LIFI_DIAMOND = process.env.LIFI_DIAMOND || "0x1231DEB6f5749EF6cE6943a275A1D3E7486F4EaE"; // Sepolia
    const USDT = process.env.USDT;
    
    console.log("Using existing contracts:");
    console.log("  Bonding Curve:", BONDING_CURVE);
    console.log("  Factory:", FACTORY);
    console.log("  LI.FI Diamond:", LIFI_DIAMOND);
    console.log("  USDT:", USDT);
    console.log("");
    
    // Deploy depositor
    console.log("Deploying CrossChainVaultDepositor...");
    const Depositor = await ethers.getContractFactory("CrossChainVaultDepositor");
    const depositor = await Depositor.deploy(
        deployer.address,     // initialOwner
        BONDING_CURVE,        // bondingCurve
        FACTORY,              // factory
        LIFI_DIAMOND,         // lifiDiamond
        USDT                  // usdt
    );
    
    await depositor.waitForDeployment();
    const depositorAddress = await depositor.getAddress();
    
    console.log("✅ CrossChainVaultDepositor deployed to:", depositorAddress);
    console.log("");
    
    // Save deployment info
    const deployment = {
        network: "sepolia",
        timestamp: new Date().toISOString(),
        lifiDepositor: depositorAddress,
        bondingCurve: BONDING_CURVE,
        factory: FACTORY,
        lifiDiamond: LIFI_DIAMOND,
        usdt: USDT
    };
    
    const fs = require("fs");
    fs.writeFileSync(
        `deployment-lifi-${Date.now()}.json`,
        JSON.stringify(deployment, null, 2)
    );
    
    console.log("📝 Deployment info saved");
    console.log("");
    console.log("Next steps:");
    console.log("1. Verify contract on Etherscan:");
    console.log(`   npx hardhat verify --network sepolia ${depositorAddress} ${deployer.address} ${BONDING_CURVE} ${FACTORY} ${LIFI_DIAMOND} ${USDT}`);
    console.log("");
    console.log("2. Add to .env:");
    console.log(`   LIFI_DEPOSITOR=${depositorAddress}`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });

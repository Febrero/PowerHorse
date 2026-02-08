// Deploy HorsePortfolioAgent
const { ethers } = require("hardhat");
require("dotenv").config();

async function main() {
    console.log("🐴 POWER.HORSE - Deploying AI Portfolio Agent\n");
    
    const [deployer] = await ethers.getSigners();
    console.log("Deployer address:", deployer.address);
    console.log("Deployer balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH\n");
    
    // Contract addresses from .env
    const BONDING_CURVE = process.env.BONDING_CURVE;
    const FACTORY = process.env.FACTORY;
    const USDT = process.env.USDT;
    const STORK_ORACLE = process.env.STORK_ORACLE_URL || deployer.address; // Use deployer if no oracle
    
    console.log("Using existing contracts:");
    console.log("  Bonding Curve:", BONDING_CURVE);
    console.log("  Factory:", FACTORY);
    console.log("  USDT:", USDT);
    console.log("  Stork Oracle:", STORK_ORACLE);
    console.log("");
    
    // Deploy agent
    console.log("Deploying HorsePortfolioAgent...");
    const Agent = await ethers.getContractFactory("HorsePortfolioAgent");
    const agent = await Agent.deploy(
        deployer.address,     // initialOwner
        BONDING_CURVE,        // bondingCurve
        FACTORY,              // factory
        USDT,                 // usdt
        STORK_ORACLE          // storkOracle
    );
    
    await agent.waitForDeployment();
    const agentAddress = await agent.getAddress();
    
    console.log("✅ HorsePortfolioAgent deployed to:", agentAddress);
    console.log("");
    
    // Save deployment info
    const deployment = {
        network: "sepolia",
        timestamp: new Date().toISOString(),
        horseAgent: agentAddress,
        bondingCurve: BONDING_CURVE,
        factory: FACTORY,
        usdt: USDT,
        storkOracle: STORK_ORACLE
    };
    
    const fs = require("fs");
    fs.writeFileSync(
        `deployment-agent-${Date.now()}.json`,
        JSON.stringify(deployment, null, 2)
    );
    
    console.log("📝 Deployment info saved");
    console.log("");
    console.log("Next steps:");
    console.log("1. Verify contract on Etherscan:");
    console.log(`   npx hardhat verify --network sepolia ${agentAddress} ${deployer.address} ${BONDING_CURVE} ${FACTORY} ${USDT} ${STORK_ORACLE}`);
    console.log("");
    console.log("2. Add to .env:");
    console.log(`   HORSE_AGENT_ARC=${agentAddress}`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });

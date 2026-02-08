// Deploy YellowBondingCurveAdapter
const { ethers } = require("hardhat");
require("dotenv").config();

async function main() {
    console.log("🐴 POWER.HORSE - Deploying Yellow Network Adapter\n");
    
    const [deployer] = await ethers.getSigners();
    console.log("Deployer address:", deployer.address);
    console.log("Deployer balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH\n");
    
    // Contract addresses from .env
    const BONDING_CURVE = process.env.BONDING_CURVE;
    const FACTORY = process.env.FACTORY;
    const YELLOW_RELAYER = process.env.YELLOW_RELAYER_URL || deployer.address; // Use deployer if no relayer
    
    console.log("Using existing contracts:");
    console.log("  Bonding Curve:", BONDING_CURVE);
    console.log("  Factory:", FACTORY);
    console.log("  Yellow Relayer:", YELLOW_RELAYER);
    console.log("");
    
    // Deploy adapter
    console.log("Deploying YellowBondingCurveAdapter...");
    const YellowAdapter = await ethers.getContractFactory("YellowBondingCurveAdapter");
    const adapter = await YellowAdapter.deploy(
        deployer.address,     // initialOwner
        BONDING_CURVE,        // bondingCurve
        FACTORY,              // factory
        YELLOW_RELAYER        // yellowRelayer
    );
    
    await adapter.waitForDeployment();
    const adapterAddress = await adapter.getAddress();
    
    console.log("✅ YellowBondingCurveAdapter deployed to:", adapterAddress);
    console.log("");
    
    // Save deployment info
    const deployment = {
        network: "sepolia",
        timestamp: new Date().toISOString(),
        yellowAdapter: adapterAddress,
        bondingCurve: BONDING_CURVE,
        factory: FACTORY,
        yellowRelayer: YELLOW_RELAYER
    };
    
    const fs = require("fs");
    fs.writeFileSync(
        `deployment-yellow-${Date.now()}.json`,
        JSON.stringify(deployment, null, 2)
    );
    
    console.log("📝 Deployment info saved");
    console.log("");
    console.log("Next steps:");
    console.log("1. Verify contract on Etherscan:");
    console.log(`   npx hardhat verify --network sepolia ${adapterAddress} ${deployer.address} ${BONDING_CURVE} ${FACTORY} ${YELLOW_RELAYER}`);
    console.log("");
    console.log("2. Add to .env:");
    console.log(`   YELLOW_ADAPTER=${adapterAddress}`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });

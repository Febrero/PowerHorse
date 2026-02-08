// Configure YellowBondingCurveAdapter after deployment
const { ethers } = require("hardhat");
require("dotenv").config();

async function main() {
    console.log("🔧 Configuring YellowBondingCurveAdapter...\n");
    console.log("=".repeat(60));
    
    const [deployer] = await ethers.getSigners();
    console.log("Deployer:", deployer.address);
    console.log("");
    
    // Get deployed contract address
    const YELLOW_ADAPTER = process.env.YELLOW_ADAPTER;
    if (!YELLOW_ADAPTER) {
        console.error("❌ ERROR: YELLOW_ADAPTER not found in .env");
        console.log("Please add: YELLOW_ADAPTER=0xYourDeployedAddress");
        process.exit(1);
    }
    
    console.log("Yellow Adapter Address:", YELLOW_ADAPTER);
    console.log("");
    
    // Connect to contract
    const adapter = await ethers.getContractAt("YellowBondingCurveAdapter", YELLOW_ADAPTER);
    
    // Check current relayer
    const currentRelayer = await adapter.yellowRelayer();
    console.log("Current Relayer:", currentRelayer);
    console.log("");
    
    // Option 1: Update relayer to a specific address
    const NEW_RELAYER = process.env.YELLOW_RELAYER_ADDRESS || deployer.address;
    
    if (currentRelayer.toLowerCase() !== NEW_RELAYER.toLowerCase()) {
        console.log("📝 Updating relayer to:", NEW_RELAYER);
        const tx = await adapter.updateRelayer(NEW_RELAYER);
        console.log("Transaction hash:", tx.hash);
        await tx.wait();
        console.log("✅ Relayer updated successfully!");
    } else {
        console.log("✅ Relayer already set correctly");
    }
    
    console.log("");
    console.log("=".repeat(60));
    console.log("");
    console.log("✅ Yellow Adapter Configuration Complete!");
    console.log("");
    console.log("Current Settings:");
    console.log("  Relayer:", await adapter.yellowRelayer());
    console.log("  Bonding Curve:", await adapter.bondingCurve());
    console.log("  Factory:", await adapter.factory());
    console.log("");
    console.log("💡 Next Steps:");
    console.log("1. Test opening a session");
    console.log("2. Set up Yellow Network relayer infrastructure");
    console.log("3. Configure monitoring for sessions");
    console.log("");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });

// Redeploy HorsePortfolioAgent with fixed share estimation
const { ethers } = require("hardhat");
require("dotenv").config();

async function main() {
    console.log("🔄 Redeploying HorsePortfolioAgent with Fix...\n");
    console.log("=".repeat(60));
    
    const [deployer] = await ethers.getSigners();
    console.log("Deployer:", deployer.address);
    console.log("Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH");
    console.log("");
    
    // Get existing addresses
    const BONDING_CURVE = process.env.BONDING_CURVE;
    const FACTORY = process.env.FACTORY;
    const USDT = process.env.USDT;
    
    console.log("Using existing contracts:");
    console.log("  Bonding Curve:", BONDING_CURVE);
    console.log("  Factory:", FACTORY);
    console.log("  USDT:", USDT);
    console.log("");
    
    // Deploy new HorsePortfolioAgent
    console.log("Deploying HorsePortfolioAgent (with fixed share estimation)...");
    const HorsePortfolioAgent = await ethers.getContractFactory("HorsePortfolioAgent");
    const agent = await HorsePortfolioAgent.deploy(
        deployer.address,  // initialOwner (must be first!)
        BONDING_CURVE,
        FACTORY,
        USDT,
        deployer.address   // Stork oracle (you for testing)
    );
    await agent.waitForDeployment();
    
    const agentAddress = await agent.getAddress();
    console.log("✅ HorsePortfolioAgent deployed:", agentAddress);
    console.log("");
    
    console.log("=".repeat(60));
    console.log("");
    console.log("✅ Redeployment Complete!");
    console.log("");
    console.log("📝 IMPORTANT: Update your .env file:");
    console.log("");
    console.log("HORSE_AGENT_ARC=" + agentAddress);
    console.log("");
    console.log("💡 Next Steps:");
    console.log("");
    console.log("1. Update .env with the new address above");
    console.log("");
    console.log("2. Configure the agent:");
    console.log("   npm run config:agent");
    console.log("");
    console.log("3. Test the investment:");
    console.log("   npm run test:agent");
    console.log("");
    console.log("✨ The share estimation is now fixed!");
    console.log("   It will iteratively find the right amount you can afford.");
    console.log("");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });

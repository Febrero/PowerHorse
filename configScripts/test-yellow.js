// Test YellowBondingCurveAdapter
const { ethers } = require("hardhat");
require("dotenv").config();

async function main() {
    console.log("🧪 Testing YellowBondingCurveAdapter...\n");
    console.log("=".repeat(60));
    
    const [deployer] = await ethers.getSigners();
    console.log("Tester:", deployer.address);
    console.log("Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH");
    console.log("");
    
    // Get contract addresses
    const YELLOW_ADAPTER = process.env.YELLOW_ADAPTER;
    const FACTORY = process.env.FACTORY;
    
    if (!YELLOW_ADAPTER || !FACTORY) {
        console.error("❌ Missing contract addresses in .env");
        process.exit(1);
    }
    
    // Connect to contracts
    const adapter = await ethers.getContractAt("YellowBondingCurveAdapter", YELLOW_ADAPTER);
    const factory = await ethers.getContractAt("IHorseSharesFactory", FACTORY);
    
    console.log("Yellow Adapter:", YELLOW_ADAPTER);
    console.log("Factory:", FACTORY);
    console.log("");
    
    // Get a horse to test with
    console.log("📋 Finding a tokenized horse...");
    
    // Try horse ID 1 (you can change this)
    const TEST_HORSE_ID = 1;
    const isRegistered = await factory.isRegistered(TEST_HORSE_ID);
    
    if (!isRegistered) {
        console.error("❌ Horse ID", TEST_HORSE_ID, "not registered");
        console.log("Please tokenize a horse first or change TEST_HORSE_ID");
        process.exit(1);
    }
    
    const [shareToken, vault] = await factory.getHorseContracts(TEST_HORSE_ID);
    console.log("Horse ID:", TEST_HORSE_ID);
    console.log("Share Token:", shareToken);
    console.log("Vault:", vault);
    console.log("");
    
    // Test 1: Open a session
    console.log("Test 1: Opening Trading Session");
    console.log("-".repeat(60));
    
    const sessionAmount = ethers.parseEther("0.01"); // 0.01 ETH
    console.log("Session Amount:", ethers.formatEther(sessionAmount), "ETH");
    
    try {
        const tx1 = await adapter.openSession(
            shareToken,
            ethers.ZeroAddress, // ETH payment
            sessionAmount,
            { value: sessionAmount }
        );
        console.log("Transaction hash:", tx1.hash);
        await tx1.wait();
        console.log("✅ Session opened successfully!");
        console.log("");
        
        // Check session
        const session = await adapter.getSession(deployer.address, shareToken);
        console.log("Session Details:");
        console.log("  User:", session.user);
        console.log("  Locked Amount:", ethers.formatEther(session.lockedAmount), "ETH");
        console.log("  Expiry:", new Date(Number(session.expiry) * 1000).toLocaleString());
        console.log("  Active:", session.active);
        console.log("");
        
        // Test 2: Check session status
        console.log("Test 2: Checking Session Status");
        console.log("-".repeat(60));
        
        const isExpired = await adapter.isSessionExpired(deployer.address, shareToken);
        console.log("Session Expired:", isExpired);
        console.log("");
        
        // Test 3: Cancel session (for testing)
        console.log("Test 3: Cancelling Session");
        console.log("-".repeat(60));
        
        const balanceBefore = await ethers.provider.getBalance(deployer.address);
        const tx2 = await adapter.cancelSession(shareToken);
        console.log("Transaction hash:", tx2.hash);
        const receipt = await tx2.wait();
        const balanceAfter = await ethers.provider.getBalance(deployer.address);
        
        console.log("✅ Session cancelled!");
        console.log("Gas used:", receipt.gasUsed.toString());
        console.log("Refunded:", ethers.formatEther(balanceAfter - balanceBefore + receipt.gasUsed * receipt.gasPrice), "ETH (minus gas)");
        console.log("");
        
        // Verify session is closed
        const sessionAfter = await adapter.getSession(deployer.address, shareToken);
        console.log("Session Active After Cancel:", sessionAfter.active);
        console.log("");
        
    } catch (error) {
        console.error("❌ Test failed:", error.message);
        console.log("");
        console.log("Common issues:");
        console.log("- Horse already graduated");
        console.log("- Session already active");
        console.log("- Insufficient ETH balance");
        console.log("");
    }
    
    console.log("=".repeat(60));
    console.log("");
    console.log("✅ Yellow Adapter Tests Complete!");
    console.log("");
    console.log("💡 To test full flow:");
    console.log("1. Open session");
    console.log("2. Relayer records off-chain purchases");
    console.log("3. Settle session to execute on-chain");
    console.log("");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });

// Test CrossChainVaultDepositor
const { ethers } = require("hardhat");
require("dotenv").config();

async function main() {
    console.log("🧪 Testing CrossChainVaultDepositor...\n");
    console.log("=".repeat(60));
    
    const [deployer] = await ethers.getSigners();
    console.log("Tester:", deployer.address);
    console.log("");
    
    // Get contract addresses
    const LIFI_DEPOSITOR = process.env.LIFI_DEPOSITOR;
    const USDT = process.env.USDT;
    const FACTORY = process.env.FACTORY;
    
    if (!LIFI_DEPOSITOR || !USDT || !FACTORY) {
        console.error("❌ Missing contract addresses in .env");
        process.exit(1);
    }
    
    // Connect to contracts
    const depositor = await ethers.getContractAt("CrossChainVaultDepositor", LIFI_DEPOSITOR);
    const usdt = await ethers.getContractAt("IERC20", USDT);
    const factory = await ethers.getContractAt("IHorseSharesFactory", FACTORY);
    
    console.log("LI.FI Depositor:", LIFI_DEPOSITOR);
    console.log("USDT:", USDT);
    console.log("Factory:", FACTORY);
    console.log("");
    
    // Check USDT balance
    const usdtBalance = await usdt.balanceOf(deployer.address);
    console.log("USDT Balance:", ethers.formatUnits(usdtBalance, 6), "USDT");
    
    if (usdtBalance < 1000n * 10n**6n) {
        console.warn("⚠️  WARNING: Low USDT balance. You need at least 1000 USDT to test.");
        console.log("You can get testnet USDT or deploy a mock USDT contract.");
        console.log("");
    }
    console.log("");
    
    // Test 1: Create deposit intent
    console.log("Test 1: Creating Deposit Intent");
    console.log("-".repeat(60));
    
    const TEST_HORSE_ID = 1;
    const isRegistered = await factory.isRegistered(TEST_HORSE_ID);
    
    if (!isRegistered) {
        console.error("❌ Horse ID", TEST_HORSE_ID, "not registered");
        process.exit(1);
    }
    
    const depositAmount = 1000n * 10n**6n; // 1000 USDT
    const minShares = 1_000_000n * 10n**18n; // 1M shares minimum
    const deadline = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
    
    console.log("Horse ID:", TEST_HORSE_ID);
    console.log("Deposit Amount:", ethers.formatUnits(depositAmount, 6), "USDT");
    console.log("Min Shares:", ethers.formatEther(minShares));
    console.log("Deadline:", new Date(deadline * 1000).toLocaleString());
    console.log("");
    
    if (usdtBalance >= depositAmount) {
        try {
            // Approve USDT
            console.log("Approving USDT...");
            const tx1 = await usdt.approve(LIFI_DEPOSITOR, depositAmount);
            await tx1.wait();
            console.log("✅ USDT approved");
            console.log("");
            
            // Create intent
            console.log("Creating deposit intent...");
            const tx2 = await depositor.createDepositIntent(
                TEST_HORSE_ID,
                depositAmount,
                minShares,
                deadline
            );
            console.log("Transaction hash:", tx2.hash);
            const receipt = await tx2.wait();
            console.log("✅ Intent created!");
            console.log("");
            
            // Extract intent ID from event
            const event = receipt.logs.find(log => {
                try {
                    const parsed = depositor.interface.parseLog(log);
                    return parsed.name === "DepositIntentCreated";
                } catch {
                    return false;
                }
            });
            
            if (event) {
                const parsed = depositor.interface.parseLog(event);
                const intentId = parsed.args.intentId;
                console.log("Intent ID:", intentId);
                console.log("");
                
                // Test 2: Get intent details
                console.log("Test 2: Getting Intent Details");
                console.log("-".repeat(60));
                
                const intent = await depositor.getDepositIntent(intentId);
                console.log("Intent Details:");
                console.log("  User:", intent.user);
                console.log("  Horse ID:", intent.horseId.toString());
                console.log("  USDT Amount:", ethers.formatUnits(intent.usdtAmount, 6), "USDT");
                console.log("  Min Shares:", ethers.formatEther(intent.minShares));
                console.log("  Deadline:", new Date(Number(intent.deadline) * 1000).toLocaleString());
                console.log("  Completed:", intent.completed);
                console.log("");
                
                // Test 3: Check if expired
                const isExpired = await depositor.isIntentExpired(intentId);
                console.log("Intent Expired:", isExpired);
                console.log("");
                
                // Test 4: Execute intent (as owner, simulating LI.FI)
                console.log("Test 3: Executing Intent (simulating LI.FI)");
                console.log("-".repeat(60));
                
                try {
                    console.log("Executing cross-chain deposit...");
                    const tx3 = await depositor.executeCrossChainDeposit(intentId);
                    console.log("Transaction hash:", tx3.hash);
                    const receipt3 = await tx3.wait();
                    console.log("✅ Intent executed!");
                    console.log("Gas used:", receipt3.gasUsed.toString());
                    console.log("");
                    
                    // Check intent after execution
                    const intentAfter = await depositor.getDepositIntent(intentId);
                    console.log("Intent Completed:", intentAfter.completed);
                    console.log("");
                    
                } catch (error) {
                    console.error("❌ Execution failed:", error.message);
                    console.log("");
                    console.log("Common issues:");
                    console.log("- Insufficient USDT in contract");
                    console.log("- Horse already graduated");
                    console.log("- Slippage too high");
                    console.log("- Intent already completed");
                    console.log("");
                    
                    // Try to cancel intent instead
                    console.log("Attempting to cancel intent...");
                    try {
                        // Can't cancel until expired or as owner
                        const tx4 = await depositor.cancelDepositIntent(intentId);
                        await tx4.wait();
                        console.log("✅ Intent cancelled (as owner)");
                    } catch (cancelError) {
                        console.log("❌ Cannot cancel:", cancelError.message);
                    }
                }
                
            } else {
                console.log("⚠️  Could not extract intent ID from transaction");
            }
            
        } catch (error) {
            console.error("❌ Test failed:", error.message);
            console.log("");
        }
    } else {
        console.log("⏭️  Skipping tests (insufficient USDT)");
        console.log("");
    }
    
    // Test 5: Estimate shares
    console.log("Test 4: Estimating Shares");
    console.log("-".repeat(60));
    
    const estimateAmount = 1000n * 10n**6n;
    try {
        const estimatedShares = await depositor.estimateShares(TEST_HORSE_ID, estimateAmount);
        console.log("For", ethers.formatUnits(estimateAmount, 6), "USDT:");
        console.log("Estimated Shares:", ethers.formatEther(estimatedShares));
        console.log("");
        console.log("⚠️  This is a rough estimate, actual shares may vary");
    } catch (error) {
        console.log("Could not estimate shares:", error.message);
    }
    console.log("");
    
    console.log("=".repeat(60));
    console.log("");
    console.log("✅ CrossChain Depositor Tests Complete!");
    console.log("");
    console.log("💡 To test full cross-chain flow:");
    console.log("1. User creates intent on source chain");
    console.log("2. LI.FI bridges USDT to Sepolia");
    console.log("3. LI.FI calls executeCrossChainDeposit");
    console.log("4. Shares are purchased and sent to user");
    console.log("");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });

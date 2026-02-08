# 🎯 Quick Reference - Post-Deployment Scripts

## 📥 Files You Downloaded

### Configuration Scripts
- `post-deploy.js` - Configure all contracts at once
- `config-yellow.js` - Configure Yellow Adapter
- `config-agent.js` - Configure Portfolio Agent

### Testing Scripts
- `test-yellow.js` - Test Yellow Adapter
- `test-agent.js` - Test Portfolio Agent  
- `test-lifi.js` - Test CrossChain Depositor

### Configuration Files
- `package.json` - Updated with all script commands
- `SCRIPTS_GUIDE.md` - Complete documentation

---

## ⚡ Quick Commands

### After Deployment

```bash
# 1. Add deployed addresses to .env
YELLOW_ADAPTER=0xYourAddress
HORSE_AGENT_ARC=0xYourAddress
LIFI_DEPOSITOR=0xYourAddress

# 2. Configure everything
npm run config

# 3. Test everything
npm run test:yellow
npm run test:agent
npm run test:lifi
```

---

## 🔧 Individual Commands

| What You Want | Command |
|---------------|---------|
| Configure Yellow Adapter | `npm run config:yellow` |
| Configure Portfolio Agent | `npm run config:agent` |
| Test Yellow Adapter | `npm run test:yellow` |
| Test Portfolio Agent | `npm run test:agent` |
| Test CrossChain Depositor | `npm run test:lifi` |
| Configure All | `npm run config` |

---

## 📋 What Each Script Does

### `npm run config`
✅ Sets Yellow Network relayer  
✅ Configures AI strategy (5 horses, 10k USDT max)  
✅ Sets Stork oracle  
✅ Activates Portfolio Agent  
✅ Verifies CrossChain Depositor  

### `npm run config:yellow`
Updates Yellow Network relayer address

### `npm run config:agent`  
Sets investment strategy:
- 5 horse portfolio
- 10,000 USDT max per horse
- 60/100 min performance score
- 5% rebalance threshold

### `npm run test:yellow`
Tests:
- Opening trading session
- Checking session status
- Cancelling session
- Refund handling

### `npm run test:agent`
Tests:
- Updating oracle data
- Executing investments
- Checking portfolio

### `npm run test:lifi`
Tests:
- Creating deposit intents
- Executing cross-chain deposits
- Share estimation

---

## ⚠️ Requirements

### For Configuration
- ✅ Deployed contract addresses in .env
- ✅ Deployer wallet with ETH

### For Testing
- ✅ At least 0.01 ETH (Yellow tests)
- ✅ At least 1000 USDT (Agent & LI.FI tests)
- ✅ A tokenized horse (Horse ID 1)

---

## 🚨 Common Errors

**"Contract address not found"**  
→ Add addresses to .env from deployment JSON

**"Horse ID 1 not registered"**  
→ Tokenize a horse or change TEST_HORSE_ID in script

**"Insufficient USDT"**  
→ Get testnet USDT or deploy mock USDT

**"Strategy not active"**  
→ Run `npm run config:agent`

---

## 📖 Need More Help?

Read the complete guide:
- `SCRIPTS_GUIDE.md` - Full documentation with examples

---

**Pro Tip:** Run `npm run config` once after deployment, then use individual test scripts as needed! 🚀

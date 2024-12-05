const { ethers } = require("hardhat");
const { deploy, getETHBalance, smallNum } = require("hardhat-libutils");

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Deploying with wallet ", deployer.address);
    let beforeBal = await getETHBalance(deployer.address);
    await deploy("FlashToken", "FlashToken", "ERC20***", "FT***", 18);
    let afterBal = await getETHBalance(deployer.address);
    let usedGas = BigInt(beforeBal) - BigInt(afterBal);
    console.log("used gas fee: ", smallNum(usedGas));
    console.log("Deployed Successfully!");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });

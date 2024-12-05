const { ethers } = require("hardhat");
const { expect } = require("chai");
const {
    deploy,
    bigNum,
    smallNum,
    spendTime,
    day,
} = require("hardhat-libutils");

describe("FlashToken Test", function () {
    before(async function () {
        [this.deployer, this.account_1] = await ethers.getSigners();
        this.FlashToken = await deploy(
            "FlashToken",
            "FlashToken",
            "FlashToken",
            "FT",
            18
        );
    });

    it("Check Initialized", async function () {
        console.log("Initialized Successfully!");
        const contractBalance = await this.FlashToken.balanceOf(
            this.FlashToken.address
        );
        expect(smallNum(contractBalance)).to.be.equal(50000000);
    });

    it("Mint tokens", async function () {
        let amount = bigNum(20);
        await this.FlashToken.mintTokens(
            this.account_1.address,
            BigInt(amount)
        );

        expect(
            smallNum(await this.FlashToken.balanceOf(this.account_1.address))
        ).to.be.equal(smallNum(amount));
    });

    it("After expiration time, check balance", async function () {
        const beforeBalance = await this.FlashToken.balanceOf(
            this.account_1.address
        );
        expect(smallNum(beforeBalance)).to.be.greaterThan(0);
        await spendTime(Number(11) * Number(day));
        const afterBalance = await this.FlashToken.balanceOf(
            this.account_1.address
        );
        expect(afterBalance).to.be.equal(0);
    });

    it("Check tokens again", async function () {
        let balance = await this.FlashToken.balanceOf(this.account_1.address);
        expect(balance).to.be.equal(0);

        let amount0 = bigNum(10);
        let amount1 = bigNum(20);
        await this.FlashToken.mintTokens(
            this.deployer.address,
            BigInt(amount0) + BigInt(amount1)
        );
        await this.FlashToken.transfer(this.account_1.address, BigInt(amount0));
        balance = await this.FlashToken.balanceOf(this.account_1.address);
        expect(smallNum(balance)).to.be.equal(smallNum(amount0));

        await spendTime(Number(5) * Number(day));
        balance = await this.FlashToken.balanceOf(this.account_1.address);
        expect(smallNum(balance)).to.be.equal(smallNum(amount0));
        await this.FlashToken.transfer(this.account_1.address, BigInt(amount1));
        balance = await this.FlashToken.balanceOf(this.account_1.address);
        expect(smallNum(balance)).to.be.equal(
            smallNum(BigInt(amount0) + BigInt(amount1))
        );

        await spendTime(Number(6) * Number(day));
        balance = await this.FlashToken.balanceOf(this.account_1.address);
        expect(smallNum(balance)).to.be.equal(smallNum(amount1));
    });
});

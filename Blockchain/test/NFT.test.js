const { expect } = require('chai')
const { ethers } = require('hardhat')

//to emit events use chai with solidity
const chai = require('chai')
const { solidity } = require('ethereum-waffle')
chai.use(solidity)



describe('TradePlace', function () {

    let nft;
    let TradePlace;
    let owner;
    let otherAccount;
    beforeEach(async function () {
        [owner, otherAccount] = await ethers.getSigners();
        const nft_contract = await ethers.getContractFactory("NFT");
        nft = await nft_contract.deploy();
        const TradePlace_contract = await ethers.getContractFactory('Tradeplace');
        TradePlace = await TradePlace_contract.deploy();
    });

    describe('deployment test', function () {
        it('token name', async function () {
            let name = 'NFT';
            let symbol = 'NFT';
            expect(await nft.name()).to.equal(name);
            expect(await nft.symbol()).to.equal(symbol);
        });
    });

    describe('Minting NFT', function () {
        it('mint NFT', async function () {
            let uri = 'test.com';
            await nft.safeMint(uri);
            expect(await nft.tokenURI(0)).to.equal(uri);
            expect(Number(await nft.balanceOf(owner.address))).to.equal(1);
        })
    });

    describe('Selling NFT', function () {
        beforeEach(async function () {
            await nft.safeMint('test.com');
            await nft.setApprovalForAll(TradePlace.address, true);
        });

        it('list an item for sale', async function () {
            await expect(TradePlace.sellNFT(nft.address, 0, 2))
                .to.emit(TradePlace, "Listed").withArgs(
                    owner.address,
                    TradePlace.address,
                    2,
                    0,
                    1,

                );
            expect(Number(await TradePlace.Itemcount())).to.equal(1);
            expect(await nft.ownerOf(0)).to.equal(TradePlace.address);
        });

        it('should be failed, if price is not greater than zero', async function () {
            await expect(TradePlace.sellNFT(nft.address, 0, 0)).to.revertedWith(
                "Price must be greater than zero!"
            );
        })
    });

    describe("buyig NFT", function () {
        beforeEach(async function () {
            await nft.safeMint('test.com');
            await nft.setApprovalForAll(TradePlace.address, true);
            await TradePlace.sellNFT(nft.address, 0, 2);
        })
        it("should update when the item is sold", async function () {
            const item = await TradePlace.Items(1);
            let value = 2;
            await expect(TradePlace.connect(otherAccount).buyNFT(nft.address, 1, { value: value })).to.emit(
                TradePlace, "buyed"
            ).withArgs(
                item.seller,
                otherAccount.address,
                value,
                item.tokenID,
                1
            );

            expect(item.sold).to.equal(false);
            expect(await nft.ownerOf(0)).to.equal(otherAccount.address);
        });

        it('should reverted if the item is solded, if wrong itemid and if the the price is less', async function () {
            const value_in_eth = ethers.utils.parseEther('3');
            //for invalid amount
            await expect(TradePlace.connect(otherAccount).buyNFT(nft.address, 1, { value: 1 })).to.revertedWith(
                "Invalid Amount!!"
            );
            //for invalid item number
            await expect(TradePlace.connect(otherAccount).buyNFT(nft.address, 2, { value: value_in_eth })).to.revertedWith(
                "Item does not exists"
            );
            //if the item is solded
            await TradePlace.buyNFT(nft.address, 1, { value: 2 });
            //buying after selling.....
            expect(await TradePlace.connect(otherAccount).buyNFT(nft.address, 1, { value: value_in_eth })).to.revertedWith(
                "Item is already sold"
            );

        })

    })

});
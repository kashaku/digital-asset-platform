import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.connect();

describe("FixedPriceMarket", function () {
  const testURI = "ipfs://QmTestHash";
  const royaltyBps = 500; // 5%
  const listPrice = ethers.parseEther("1.0");

  async function deployFixture() {
    const [owner, creator, buyer, other] = await ethers.getSigners();

    const nftContract = await ethers.deployContract("DigitalAssetNFT");
    const marketContract = await ethers.deployContract("FixedPriceMarket", [
      await nftContract.getAddress(),
    ]);

    return { nftContract, marketContract, owner, creator, buyer, other };
  }

  // ============ 部署测试 ============

  describe("部署", function () {
    it("应该关联正确的 NFT 合约地址", async function () {
      const { nftContract, marketContract } = await deployFixture();
      expect(await marketContract.nftContract()).to.equal(await nftContract.getAddress());
    });

    it("应该关联正确的版税合约地址（与 NFT 同一合约）", async function () {
      const { nftContract, marketContract } = await deployFixture();
      expect(await marketContract.royaltyContract()).to.equal(await nftContract.getAddress());
    });
  });

  // ============ 上架测试 ============

  describe("上架 (listForSale)", function () {
    it("owner 授权后应该成功上架", async function () {
      const { nftContract, marketContract, creator } = await deployFixture();

      await nftContract.connect(creator).mintAsset(creator.address, testURI, royaltyBps);
      await nftContract.connect(creator).approve(await marketContract.getAddress(), 0);
      await marketContract.connect(creator).listForSale(0, listPrice);

      const listing = await marketContract.listings(0);
      expect(listing.price).to.equal(listPrice);
      expect(listing.seller).to.equal(creator.address);
    });

    it("非 owner 不能上架", async function () {
      const { nftContract, marketContract, creator, other } = await deployFixture();

      await nftContract.connect(creator).mintAsset(creator.address, testURI, royaltyBps);
      await nftContract.connect(creator).approve(await marketContract.getAddress(), 0);

      await expect(
        marketContract.connect(other).listForSale(0, listPrice)
      ).to.be.revertedWith("Not the owner");
    });

    it("价格为 0 应该失败", async function () {
      const { nftContract, marketContract, creator } = await deployFixture();

      await nftContract.connect(creator).mintAsset(creator.address, testURI, royaltyBps);
      await nftContract.connect(creator).approve(await marketContract.getAddress(), 0);

      await expect(
        marketContract.connect(creator).listForSale(0, 0)
      ).to.be.revertedWith("Price must be greater than 0");
    });

    it("未授权合约时应该失败", async function () {
      const { nftContract, marketContract, creator } = await deployFixture();

      await nftContract.connect(creator).mintAsset(creator.address, testURI, royaltyBps);

      await expect(
        marketContract.connect(creator).listForSale(0, listPrice)
      ).to.be.revertedWith("Contract not approved for transfer");
    });

    it("应该触发 AssetListed 事件", async function () {
      const { nftContract, marketContract, creator } = await deployFixture();

      await nftContract.connect(creator).mintAsset(creator.address, testURI, royaltyBps);
      await nftContract.connect(creator).approve(await marketContract.getAddress(), 0);

      await expect(marketContract.connect(creator).listForSale(0, listPrice))
        .to.emit(marketContract, "AssetListed")
        .withArgs(0n, listPrice, creator.address);
    });
  });

  // ============ 取消上架测试 ============

  describe("取消上架 (cancelListing)", function () {
    it("卖家应该可以取消上架", async function () {
      const { nftContract, marketContract, creator } = await deployFixture();

      await nftContract.connect(creator).mintAsset(creator.address, testURI, royaltyBps);
      await nftContract.connect(creator).approve(await marketContract.getAddress(), 0);
      await marketContract.connect(creator).listForSale(0, listPrice);

      await marketContract.connect(creator).cancelListing(0);

      const listing = await marketContract.listings(0);
      expect(listing.price).to.equal(0n);
      expect(listing.seller).to.equal(ethers.ZeroAddress);
    });

    it("非卖家不能取消上架", async function () {
      const { nftContract, marketContract, creator, other } = await deployFixture();

      await nftContract.connect(creator).mintAsset(creator.address, testURI, royaltyBps);
      await nftContract.connect(creator).approve(await marketContract.getAddress(), 0);
      await marketContract.connect(creator).listForSale(0, listPrice);

      await expect(
        marketContract.connect(other).cancelListing(0)
      ).to.be.revertedWith("Not the seller");
    });

    it("未上架的资产不能取消", async function () {
      const { nftContract, marketContract, creator } = await deployFixture();

      await nftContract.connect(creator).mintAsset(creator.address, testURI, royaltyBps);

      await expect(
        marketContract.connect(creator).cancelListing(0)
      ).to.be.revertedWith("Not listed");
    });

    it("应该触发 ListingCancelled 事件", async function () {
      const { nftContract, marketContract, creator } = await deployFixture();

      await nftContract.connect(creator).mintAsset(creator.address, testURI, royaltyBps);
      await nftContract.connect(creator).approve(await marketContract.getAddress(), 0);
      await marketContract.connect(creator).listForSale(0, listPrice);

      await expect(marketContract.connect(creator).cancelListing(0))
        .to.emit(marketContract, "ListingCancelled")
        .withArgs(0n);
    });
  });

  // ============ 购买测试 ============

  describe("购买 (buyAsset)", function () {
    it("应该成功购买并转移所有权", async function () {
      const { nftContract, marketContract, creator, buyer } = await deployFixture();

      await nftContract.connect(creator).mintAsset(creator.address, testURI, royaltyBps);
      await nftContract.connect(creator).approve(await marketContract.getAddress(), 0);
      await marketContract.connect(creator).listForSale(0, listPrice);

      await marketContract.connect(buyer).buyAsset(0, { value: listPrice });

      expect(await nftContract.ownerOf(0)).to.equal(buyer.address);
    });

    it("应该正确分配版税", async function () {
      const { nftContract, marketContract, creator, buyer, other } = await deployFixture();

      await nftContract.connect(creator).mintAsset(creator.address, testURI, royaltyBps);
      await nftContract.connect(creator).transferFrom(creator.address, other.address, 0);

      await nftContract.connect(other).approve(await marketContract.getAddress(), 0);
      await marketContract.connect(other).listForSale(0, listPrice);

      const creatorBalanceBefore = await ethers.provider.getBalance(creator.address);
      const sellerBalanceBefore = await ethers.provider.getBalance(other.address);

      await marketContract.connect(buyer).buyAsset(0, { value: listPrice });

      const creatorBalanceAfter = await ethers.provider.getBalance(creator.address);
      const sellerBalanceAfter = await ethers.provider.getBalance(other.address);

      const expectedRoyalty = listPrice * 500n / 10000n;
      const expectedSellerProceeds = listPrice - expectedRoyalty;

      expect(creatorBalanceAfter - creatorBalanceBefore).to.equal(expectedRoyalty);
      expect(sellerBalanceAfter - sellerBalanceBefore).to.equal(expectedSellerProceeds);
    });

    it("支付不足应该失败", async function () {
      const { nftContract, marketContract, creator, buyer } = await deployFixture();

      await nftContract.connect(creator).mintAsset(creator.address, testURI, royaltyBps);
      await nftContract.connect(creator).approve(await marketContract.getAddress(), 0);
      await marketContract.connect(creator).listForSale(0, listPrice);

      await expect(
        marketContract.connect(buyer).buyAsset(0, { value: ethers.parseEther("0.5") })
      ).to.be.revertedWith("Insufficient payment");
    });

    it("不能购买自己的资产", async function () {
      const { nftContract, marketContract, creator } = await deployFixture();

      await nftContract.connect(creator).mintAsset(creator.address, testURI, royaltyBps);
      await nftContract.connect(creator).approve(await marketContract.getAddress(), 0);
      await marketContract.connect(creator).listForSale(0, listPrice);

      await expect(
        marketContract.connect(creator).buyAsset(0, { value: listPrice })
      ).to.be.revertedWith("Cannot buy own asset");
    });

    it("未上架的资产不能购买", async function () {
      const { nftContract, marketContract, creator, buyer } = await deployFixture();

      await nftContract.connect(creator).mintAsset(creator.address, testURI, royaltyBps);

      await expect(
        marketContract.connect(buyer).buyAsset(0, { value: listPrice })
      ).to.be.revertedWith("Not listed for sale");
    });

    it("应该触发 AssetSold 事件", async function () {
      const { nftContract, marketContract, creator, buyer } = await deployFixture();

      await nftContract.connect(creator).mintAsset(creator.address, testURI, royaltyBps);
      await nftContract.connect(creator).approve(await marketContract.getAddress(), 0);
      await marketContract.connect(creator).listForSale(0, listPrice);

      await expect(marketContract.connect(buyer).buyAsset(0, { value: listPrice }))
        .to.emit(marketContract, "AssetSold")
        .withArgs(0n, listPrice, creator.address, buyer.address);
    });

    it("购买后上架信息应被清除", async function () {
      const { nftContract, marketContract, creator, buyer } = await deployFixture();

      await nftContract.connect(creator).mintAsset(creator.address, testURI, royaltyBps);
      await nftContract.connect(creator).approve(await marketContract.getAddress(), 0);
      await marketContract.connect(creator).listForSale(0, listPrice);
      await marketContract.connect(buyer).buyAsset(0, { value: listPrice });

      const listing = await marketContract.listings(0);
      expect(listing.price).to.equal(0n);
      expect(listing.seller).to.equal(ethers.ZeroAddress);
    });

    it("多付的金额应该退还", async function () {
      const { nftContract, marketContract, creator, buyer } = await deployFixture();

      await nftContract.connect(creator).mintAsset(creator.address, testURI, royaltyBps);
      await nftContract.connect(creator).approve(await marketContract.getAddress(), 0);
      await marketContract.connect(creator).listForSale(0, listPrice);

      const overpayAmount = ethers.parseEther("1.5");
      const buyerBalanceBefore = await ethers.provider.getBalance(buyer.address);

      const tx = await marketContract.connect(buyer).buyAsset(0, { value: overpayAmount });
      const receipt = await tx.wait();
      const gasCost = receipt.gasUsed * receipt.gasPrice;

      const buyerBalanceAfter = await ethers.provider.getBalance(buyer.address);

      expect(buyerBalanceAfter - buyerBalanceBefore).to.equal(-listPrice - gasCost);
    });
  });
});

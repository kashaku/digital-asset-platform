import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.connect();

describe("OfferMarket", function () {
  const testURI = "ipfs://QmTestHash";
  const royaltyBps = 500;
  const offerPrice = ethers.parseEther("100"); // ERC-20 以 wei 为单位

  async function deployFixture() {
    const [owner, creator, buyer, other] = await ethers.getSigners();

    const nftContract = await ethers.deployContract("DigitalAssetNFT");
    // 部署一个模拟 ERC-20 代币作为支付代币
    const tokenContract = await ethers.deployContract("MockERC20", ["TestToken", "TST"]);
    const marketContract = await ethers.deployContract("OfferMarket", [
      await nftContract.getAddress(),
      await tokenContract.getAddress(),
    ]);

    return { nftContract, tokenContract, marketContract, owner, creator, buyer, other };
  }

  // ============ 部署测试 ============

  describe("部署", function () {
    it("应该关联正确的 NFT 合约地址", async function () {
      const { nftContract, marketContract } = await deployFixture();
      expect(await marketContract.nftContract()).to.equal(await nftContract.getAddress());
    });

    it("应该关联正确的版税合约地址", async function () {
      const { nftContract, marketContract } = await deployFixture();
      expect(await marketContract.royaltyContract()).to.equal(await nftContract.getAddress());
    });

    it("应该关联正确的代币合约地址", async function () {
      const { tokenContract, marketContract } = await deployFixture();
      expect(await marketContract.tokenContract()).to.equal(await tokenContract.getAddress());
    });
  });

  // ============ 出价测试 ============

  describe("出价 (makeOffer)", function () {
    it("应该成功创建出价", async function () {
      const { nftContract, marketContract, creator, buyer } = await deployFixture();

      await nftContract.connect(creator).mintAsset(creator.address, testURI, royaltyBps);

      const expiresAt = Math.floor(Date.now() / 1000) + 86400; // 1 天后
      await marketContract.connect(buyer).makeOffer(0, offerPrice, expiresAt);

      const offer = await marketContract.offers(0, buyer.address);
      expect(offer.price).to.equal(offerPrice);
      expect(offer.expiresAt).to.equal(expiresAt);
    });

    it("价格为 0 应该失败", async function () {
      const { nftContract, marketContract, creator, buyer } = await deployFixture();

      await nftContract.connect(creator).mintAsset(creator.address, testURI, royaltyBps);

      const expiresAt = Math.floor(Date.now() / 1000) + 86400;
      await expect(
        marketContract.connect(buyer).makeOffer(0, 0, expiresAt)
      ).to.be.revertedWith("Price must be greater than 0");
    });

    it("过期时间在过去应该失败", async function () {
      const { nftContract, marketContract, creator, buyer } = await deployFixture();

      await nftContract.connect(creator).mintAsset(creator.address, testURI, royaltyBps);

      const pastExpiry = Math.floor(Date.now() / 1000) - 86400;
      await expect(
        marketContract.connect(buyer).makeOffer(0, offerPrice, pastExpiry)
      ).to.be.revertedWith("Expiration must be in the future");
    });

    it("应该触发 OfferMade 事件", async function () {
      const { nftContract, marketContract, creator, buyer } = await deployFixture();

      await nftContract.connect(creator).mintAsset(creator.address, testURI, royaltyBps);

      const expiresAt = Math.floor(Date.now() / 1000) + 86400;
      await expect(marketContract.connect(buyer).makeOffer(0, offerPrice, expiresAt))
        .to.emit(marketContract, "OfferMade")
        .withArgs(0n, buyer.address, offerPrice, expiresAt);
    });
  });

  // ============ 取消出价测试 ============

  describe("取消出价 (cancelOffer)", function () {
    it("应该成功取消出价", async function () {
      const { nftContract, marketContract, creator, buyer } = await deployFixture();

      await nftContract.connect(creator).mintAsset(creator.address, testURI, royaltyBps);

      const expiresAt = Math.floor(Date.now() / 1000) + 86400;
      await marketContract.connect(buyer).makeOffer(0, offerPrice, expiresAt);
      await marketContract.connect(buyer).cancelOffer(0);

      const offer = await marketContract.offers(0, buyer.address);
      expect(offer.price).to.equal(0n);
    });

    it("没有活跃出价时取消失败", async function () {
      const { nftContract, marketContract, creator, buyer } = await deployFixture();

      await nftContract.connect(creator).mintAsset(creator.address, testURI, royaltyBps);

      await expect(
        marketContract.connect(buyer).cancelOffer(0)
      ).to.be.revertedWith("No active offer");
    });

    it("应该触发 OfferCancelled 事件", async function () {
      const { nftContract, marketContract, creator, buyer } = await deployFixture();

      await nftContract.connect(creator).mintAsset(creator.address, testURI, royaltyBps);

      const expiresAt = Math.floor(Date.now() / 1000) + 86400;
      await marketContract.connect(buyer).makeOffer(0, offerPrice, expiresAt);

      await expect(marketContract.connect(buyer).cancelOffer(0))
        .to.emit(marketContract, "OfferCancelled")
        .withArgs(0n, buyer.address);
    });
  });

  // ============ 接受出价测试 ============

  describe("接受出价 (acceptOffer)", function () {
    async function setupAcceptOffer() {
      const base = await deployFixture();
      const { nftContract, tokenContract, marketContract, creator, buyer } = base;

      const marketAddress = await marketContract.getAddress();

      // creator 铸造 NFT
      await nftContract.connect(creator).mintAsset(creator.address, testURI, royaltyBps);
      await nftContract.connect(creator).approve(marketAddress, 0);

      // buyer 获取 ERC-20 代币并授权市场合约
      await tokenContract.mint(buyer.address, offerPrice);
      await tokenContract.connect(buyer).approve(marketAddress, offerPrice);

      const expiresAt = Math.floor(Date.now() / 1000) + 86400;
      await marketContract.connect(buyer).makeOffer(0, offerPrice, expiresAt);

      return base;
    }

    it("应该成功接受出价并转移 NFT 与代币", async function () {
      const { nftContract, tokenContract, marketContract, creator, buyer } =
        await setupAcceptOffer();

      await marketContract.connect(creator).acceptOffer(0, buyer.address);

      // NFT 转移给 buyer
      expect(await nftContract.ownerOf(0)).to.equal(buyer.address);

      // 出价已清除
      const offer = await marketContract.offers(0, buyer.address);
      expect(offer.price).to.equal(0n);

      // buyer 的 ERC-20 已扣款
      expect(await tokenContract.balanceOf(buyer.address)).to.equal(0n);

      // creator 既是卖家也是版税收款人，收到全部 offerPrice
      expect(await tokenContract.balanceOf(creator.address)).to.equal(offerPrice);
    });

    it("卖家不是创作者时应正确拆分版税与货款", async function () {
      const { nftContract, tokenContract, marketContract, creator, buyer, other: seller } =
        await deployFixture();

      const marketAddress = await marketContract.getAddress();

      // creator 铸造 NFT 后转给 seller
      await nftContract.connect(creator).mintAsset(creator.address, testURI, royaltyBps);
      await nftContract.connect(creator).transferFrom(creator.address, seller.address, 0);

      // seller 授权市场转移 NFT
      await nftContract.connect(seller).approve(marketAddress, 0);

      // buyer 准备 ERC-20
      await tokenContract.mint(buyer.address, offerPrice);
      await tokenContract.connect(buyer).approve(marketAddress, offerPrice);

      const expiresAt = Math.floor(Date.now() / 1000) + 86400;
      await marketContract.connect(buyer).makeOffer(0, offerPrice, expiresAt);

      // seller 接受出价
      await marketContract.connect(seller).acceptOffer(0, buyer.address);

      // NFT 归 buyer
      expect(await nftContract.ownerOf(0)).to.equal(buyer.address);

      // buyer 扣款
      expect(await tokenContract.balanceOf(buyer.address)).to.equal(0n);

      const royaltyAmount = (offerPrice * BigInt(royaltyBps)) / 10000n;

      // creator 仅收到版税
      expect(await tokenContract.balanceOf(creator.address)).to.equal(royaltyAmount);

      // seller 收到扣除版税后的货款
      expect(await tokenContract.balanceOf(seller.address)).to.equal(
        offerPrice - royaltyAmount,
      );
    });

    it("过期出价无法接受", async function () {
      const { nftContract, tokenContract, marketContract, creator, buyer } =
        await deployFixture();

      await nftContract.connect(creator).mintAsset(creator.address, testURI, royaltyBps);

      await tokenContract.mint(buyer.address, offerPrice);
      await tokenContract.connect(buyer).approve(
        await marketContract.getAddress(),
        offerPrice,
      );

      // 出价 60 秒后过期（留余量防止 EDR 挖矿时时间戳变化）
      const latestBlock = await ethers.provider.getBlock("latest")
      const expiresAt = latestBlock!.timestamp + 60;
      await marketContract.connect(buyer).makeOffer(0, offerPrice, expiresAt);

      // 快进到过期后
      await ethers.provider.send("evm_increaseTime", [120]);
      await ethers.provider.send("evm_mine", []);

      await expect(
        marketContract.connect(creator).acceptOffer(0, buyer.address),
      ).to.be.revertedWith("Offer expired");
    });

    it("非 NFT 所有者无法接受出价", async function () {
      const { marketContract, buyer, other } = await setupAcceptOffer();

      await expect(
        marketContract.connect(other).acceptOffer(0, buyer.address),
      ).to.be.revertedWith("Not the owner");
    });

    it("应该触发 OfferAccepted 事件", async function () {
      const { marketContract, creator, buyer } = await setupAcceptOffer();

      await expect(
        marketContract.connect(creator).acceptOffer(0, buyer.address),
      )
        .to.emit(marketContract, "OfferAccepted")
        .withArgs(0n, buyer.address, offerPrice, creator.address);
    });
  });
});

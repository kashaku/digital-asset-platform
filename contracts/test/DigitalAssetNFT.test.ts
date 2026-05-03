import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.connect();

describe("DigitalAssetNFT", function () {
  // 辅助函数：部署合约并返回常用对象
  async function deployFixture() {
    const [owner, creator, buyer, other] = await ethers.getSigners();
    const contract = await ethers.deployContract("DigitalAssetNFT");
    return { contract, owner, creator, buyer, other };
  }

  // ============ 部署测试 ============

  describe("部署", function () {
    it("应该设置正确的名称和符号", async function () {
      const { contract } = await deployFixture();
      expect(await contract.name()).to.equal("DigitalAssetNFT");
      expect(await contract.symbol()).to.equal("DANFT");
    });

    it("应该将部署者设为合约 owner", async function () {
      const { contract, owner } = await deployFixture();
      expect(await contract.owner()).to.equal(owner.address);
    });

    it("初始铸造数量应为 0", async function () {
      const { contract } = await deployFixture();
      expect(await contract.totalMinted()).to.equal(0n);
    });
  });

  // ============ 铸造测试 ============

  describe("铸造 (mintAsset)", function () {
    const testURI = "ipfs://QmTestHash123456789";
    const royaltyBps = 500; // 5%

    it("应该成功铸造 NFT 并设置正确的 tokenURI", async function () {
      const { contract, creator } = await deployFixture();

      await contract.connect(creator).mintAsset(creator.address, testURI, royaltyBps);

      expect(await contract.ownerOf(0)).to.equal(creator.address);
      expect(await contract.tokenURI(0)).to.equal(testURI);
    });

    it("应该递增 tokenId", async function () {
      const { contract, creator } = await deployFixture();

      await contract.connect(creator).mintAsset(creator.address, testURI, royaltyBps);
      await contract.connect(creator).mintAsset(creator.address, "ipfs://QmSecond", royaltyBps);

      expect(await contract.totalMinted()).to.equal(2n);
      expect(await contract.ownerOf(0)).to.equal(creator.address);
      expect(await contract.ownerOf(1)).to.equal(creator.address);
    });

    it("应该正确设置版税信息 (ERC-2981)", async function () {
      const { contract, creator } = await deployFixture();

      await contract.connect(creator).mintAsset(creator.address, testURI, royaltyBps);

      const salePrice = ethers.parseEther("1.0");
      const [receiver, amount] = await contract.royaltyInfo(0, salePrice);

      expect(receiver).to.equal(creator.address);
      // 5% 版税 = 0.05 ETH
      expect(amount).to.equal(salePrice * 500n / 10000n);
    });

    it("应该记录原始创作者", async function () {
      const { contract, creator, buyer } = await deployFixture();

      // creator 铸造并发送给 buyer
      await contract.connect(creator).mintAsset(buyer.address, testURI, royaltyBps);

      expect(await contract.creators(0)).to.equal(creator.address);
      expect(await contract.ownerOf(0)).to.equal(buyer.address);
    });

    it("版税超过 10% 应该失败", async function () {
      const { contract, creator } = await deployFixture();

      await expect(
        contract.connect(creator).mintAsset(creator.address, testURI, 1001)
      ).to.be.revertedWith("Royalty too high (max 10%)");
    });

    it("应该触发 AssetMinted 事件", async function () {
      const { contract, creator } = await deployFixture();

      await expect(contract.connect(creator).mintAsset(creator.address, testURI, royaltyBps))
        .to.emit(contract, "AssetMinted")
        .withArgs(0n, creator.address, testURI);
    });
  });

  // ============ 上架测试 ============

  describe("上架 (listForSale)", function () {
    const testURI = "ipfs://QmTestHash";
    const royaltyBps = 500;
    const listPrice = ethers.parseEther("1.0");

    it("owner 授权后应该成功上架", async function () {
      const { contract, creator } = await deployFixture();

      await contract.connect(creator).mintAsset(creator.address, testURI, royaltyBps);
      // 授权合约转移
      await contract.connect(creator).approve(await contract.getAddress(), 0);
      await contract.connect(creator).listForSale(0, listPrice);

      const [price, seller] = await contract.getListing(0);
      expect(price).to.equal(listPrice);
      expect(seller).to.equal(creator.address);
    });

    it("非 owner 不能上架", async function () {
      const { contract, creator, other } = await deployFixture();

      await contract.connect(creator).mintAsset(creator.address, testURI, royaltyBps);
      await contract.connect(creator).approve(await contract.getAddress(), 0);

      await expect(
        contract.connect(other).listForSale(0, listPrice)
      ).to.be.revertedWith("Not the owner");
    });

    it("价格为 0 应该失败", async function () {
      const { contract, creator } = await deployFixture();

      await contract.connect(creator).mintAsset(creator.address, testURI, royaltyBps);
      await contract.connect(creator).approve(await contract.getAddress(), 0);

      await expect(
        contract.connect(creator).listForSale(0, 0)
      ).to.be.revertedWith("Price must be greater than 0");
    });

    it("未授权合约时应该失败", async function () {
      const { contract, creator } = await deployFixture();

      await contract.connect(creator).mintAsset(creator.address, testURI, royaltyBps);

      await expect(
        contract.connect(creator).listForSale(0, listPrice)
      ).to.be.revertedWith("Contract not approved for transfer");
    });

    it("应该触发 AssetListed 事件", async function () {
      const { contract, creator } = await deployFixture();

      await contract.connect(creator).mintAsset(creator.address, testURI, royaltyBps);
      await contract.connect(creator).approve(await contract.getAddress(), 0);

      await expect(contract.connect(creator).listForSale(0, listPrice))
        .to.emit(contract, "AssetListed")
        .withArgs(0n, listPrice, creator.address);
    });
  });

  // ============ 取消上架测试 ============

  describe("取消上架 (cancelListing)", function () {
    const testURI = "ipfs://QmTestHash";
    const royaltyBps = 500;
    const listPrice = ethers.parseEther("1.0");

    it("卖家应该可以取消上架", async function () {
      const { contract, creator } = await deployFixture();

      await contract.connect(creator).mintAsset(creator.address, testURI, royaltyBps);
      await contract.connect(creator).approve(await contract.getAddress(), 0);
      await contract.connect(creator).listForSale(0, listPrice);

      await contract.connect(creator).cancelListing(0);

      const [price, seller] = await contract.getListing(0);
      expect(price).to.equal(0n);
      expect(seller).to.equal(ethers.ZeroAddress);
    });

    it("非卖家不能取消上架", async function () {
      const { contract, creator, other } = await deployFixture();

      await contract.connect(creator).mintAsset(creator.address, testURI, royaltyBps);
      await contract.connect(creator).approve(await contract.getAddress(), 0);
      await contract.connect(creator).listForSale(0, listPrice);

      await expect(
        contract.connect(other).cancelListing(0)
      ).to.be.revertedWith("Not the seller");
    });

    it("未上架的资产不能取消", async function () {
      const { contract, creator } = await deployFixture();

      await contract.connect(creator).mintAsset(creator.address, testURI, royaltyBps);

      await expect(
        contract.connect(creator).cancelListing(0)
      ).to.be.revertedWith("Not listed");
    });

    it("应该触发 ListingCancelled 事件", async function () {
      const { contract, creator } = await deployFixture();

      await contract.connect(creator).mintAsset(creator.address, testURI, royaltyBps);
      await contract.connect(creator).approve(await contract.getAddress(), 0);
      await contract.connect(creator).listForSale(0, listPrice);

      await expect(contract.connect(creator).cancelListing(0))
        .to.emit(contract, "ListingCancelled")
        .withArgs(0n);
    });
  });

  // ============ 购买测试 ============

  describe("购买 (buyAsset)", function () {
    const testURI = "ipfs://QmTestHash";
    const royaltyBps = 500; // 5%
    const listPrice = ethers.parseEther("1.0");

    it("应该成功购买并转移所有权", async function () {
      const { contract, creator, buyer } = await deployFixture();

      await contract.connect(creator).mintAsset(creator.address, testURI, royaltyBps);
      await contract.connect(creator).approve(await contract.getAddress(), 0);
      await contract.connect(creator).listForSale(0, listPrice);

      await contract.connect(buyer).buyAsset(0, { value: listPrice });

      expect(await contract.ownerOf(0)).to.equal(buyer.address);
    });

    it("应该正确分配版税", async function () {
      const { contract, creator, buyer, other } = await deployFixture();

      // creator 铸造并转移给 other，然后 other 上架出售
      await contract.connect(creator).mintAsset(creator.address, testURI, royaltyBps);
      await contract.connect(creator).transferFrom(creator.address, other.address, 0);

      // other 上架
      await contract.connect(other).approve(await contract.getAddress(), 0);
      await contract.connect(other).listForSale(0, listPrice);

      // 记录购买前的余额
      const creatorBalanceBefore = await ethers.provider.getBalance(creator.address);
      const sellerBalanceBefore = await ethers.provider.getBalance(other.address);

      // buyer 购买
      await contract.connect(buyer).buyAsset(0, { value: listPrice });

      const creatorBalanceAfter = await ethers.provider.getBalance(creator.address);
      const sellerBalanceAfter = await ethers.provider.getBalance(other.address);

      // 版税 = 1 ETH * 5% = 0.05 ETH
      const expectedRoyalty = listPrice * 500n / 10000n;
      const expectedSellerProceeds = listPrice - expectedRoyalty;

      expect(creatorBalanceAfter - creatorBalanceBefore).to.equal(expectedRoyalty);
      expect(sellerBalanceAfter - sellerBalanceBefore).to.equal(expectedSellerProceeds);
    });

    it("支付不足应该失败", async function () {
      const { contract, creator, buyer } = await deployFixture();

      await contract.connect(creator).mintAsset(creator.address, testURI, royaltyBps);
      await contract.connect(creator).approve(await contract.getAddress(), 0);
      await contract.connect(creator).listForSale(0, listPrice);

      await expect(
        contract.connect(buyer).buyAsset(0, { value: ethers.parseEther("0.5") })
      ).to.be.revertedWith("Insufficient payment");
    });

    it("不能购买自己的资产", async function () {
      const { contract, creator } = await deployFixture();

      await contract.connect(creator).mintAsset(creator.address, testURI, royaltyBps);
      await contract.connect(creator).approve(await contract.getAddress(), 0);
      await contract.connect(creator).listForSale(0, listPrice);

      await expect(
        contract.connect(creator).buyAsset(0, { value: listPrice })
      ).to.be.revertedWith("Cannot buy own asset");
    });

    it("未上架的资产不能购买", async function () {
      const { contract, creator, buyer } = await deployFixture();

      await contract.connect(creator).mintAsset(creator.address, testURI, royaltyBps);

      await expect(
        contract.connect(buyer).buyAsset(0, { value: listPrice })
      ).to.be.revertedWith("Not listed for sale");
    });

    it("应该触发 AssetSold 事件", async function () {
      const { contract, creator, buyer } = await deployFixture();

      await contract.connect(creator).mintAsset(creator.address, testURI, royaltyBps);
      await contract.connect(creator).approve(await contract.getAddress(), 0);
      await contract.connect(creator).listForSale(0, listPrice);

      await expect(contract.connect(buyer).buyAsset(0, { value: listPrice }))
        .to.emit(contract, "AssetSold")
        .withArgs(0n, listPrice, creator.address, buyer.address);
    });

    it("购买后上架信息应被清除", async function () {
      const { contract, creator, buyer } = await deployFixture();

      await contract.connect(creator).mintAsset(creator.address, testURI, royaltyBps);
      await contract.connect(creator).approve(await contract.getAddress(), 0);
      await contract.connect(creator).listForSale(0, listPrice);
      await contract.connect(buyer).buyAsset(0, { value: listPrice });

      const [price, seller] = await contract.getListing(0);
      expect(price).to.equal(0n);
      expect(seller).to.equal(ethers.ZeroAddress);
    });
  });

  // ============ 接口支持测试 ============

  describe("接口支持 (supportsInterface)", function () {
    it("应该支持 ERC-721 接口", async function () {
      const { contract } = await deployFixture();
      // ERC-721 interfaceId = 0x80ac58cd
      expect(await contract.supportsInterface("0x80ac58cd")).to.be.true;
    });

    it("应该支持 ERC-2981 接口", async function () {
      const { contract } = await deployFixture();
      // ERC-2981 interfaceId = 0x2a55205a
      expect(await contract.supportsInterface("0x2a55205a")).to.be.true;
    });

    it("应该支持 ERC-165 接口", async function () {
      const { contract } = await deployFixture();
      // ERC-165 interfaceId = 0x01ffc9a7
      expect(await contract.supportsInterface("0x01ffc9a7")).to.be.true;
    });
  });
});

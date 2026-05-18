import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.connect();

describe("DigitalAssetNFT", function () {
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
      expect(amount).to.equal(salePrice * 500n / 10000n);
    });

    it("应该记录原始创作者", async function () {
      const { contract, creator, buyer } = await deployFixture();

      await contract.connect(creator).mintAsset(buyer.address, testURI, royaltyBps);

      expect(await contract.creators(0)).to.equal(creator.address);
      expect(await contract.ownerOf(0)).to.equal(buyer.address);
    });

    it("URI 为空应该失败", async function () {
      const { contract, creator } = await deployFixture();

      await expect(
        contract.connect(creator).mintAsset(creator.address, "", royaltyBps)
      ).to.be.revertedWith("URI cannot be empty");
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

  // ============ 接口支持测试 ============

  describe("接口支持 (supportsInterface)", function () {
    it("应该支持 ERC-721 接口", async function () {
      const { contract } = await deployFixture();
      expect(await contract.supportsInterface("0x80ac58cd")).to.be.true;
    });

    it("应该支持 ERC-2981 接口", async function () {
      const { contract } = await deployFixture();
      expect(await contract.supportsInterface("0x2a55205a")).to.be.true;
    });

    it("应该支持 ERC-165 接口", async function () {
      const { contract } = await deployFixture();
      expect(await contract.supportsInterface("0x01ffc9a7")).to.be.true;
    });
  });
});

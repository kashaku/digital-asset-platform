// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/common/ERC2981.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title DigitalAssetNFT
 * @dev 基于 ERC-721 标准的数字资产确权与流通合约。
 *      集成 ERC-2981 版税标准，支持创作者在每次二级市场交易中获得版税。
 *      内置简易交易市场功能：上架、下架、购买。
 */
contract DigitalAssetNFT is ERC721URIStorage, ERC2981, Ownable {

    // ============ 状态变量 ============

    /// @dev 用于生成自增 tokenId 的计数器
    uint256 private _nextTokenId;

    /// @dev 上架信息结构体
    struct Listing {
        uint256 price;   // 上架价格（单位: wei）
        address seller;  // 卖家地址
    }

    /// @dev tokenId => 上架信息的映射
    mapping(uint256 => Listing) public listings;

    /// @dev tokenId => 原始创作者地址的映射
    mapping(uint256 => address) public creators;

    // ============ 事件 ============

    /// @dev 当新资产铸造时触发
    event AssetMinted(uint256 indexed tokenId, address indexed creator, string tokenURI);

    /// @dev 当资产上架出售时触发
    event AssetListed(uint256 indexed tokenId, uint256 price, address indexed seller);

    /// @dev 当资产被购买时触发
    event AssetSold(uint256 indexed tokenId, uint256 price, address indexed seller, address indexed buyer);

    /// @dev 当上架被取消时触发
    event ListingCancelled(uint256 indexed tokenId);

    // ============ 构造函数 ============

    /**
     * @dev 初始化合约，设置 NFT 名称和符号。
     *      部署者成为合约管理员 (owner)。
     */
    constructor() ERC721("DigitalAssetNFT", "DANFT") Ownable(msg.sender) {}

    // ============ 铸造功能 ============

    /**
     * @notice 铸造一个新的数字资产 NFT。
     * @param to         接收者地址
     * @param uri        资产元数据的 IPFS URI (例如 ipfs://Qm...)
     * @param royaltyBps 版税比例，以基点表示 (100 = 1%, 最大 10000 = 100%)
     * @return tokenId   新铸造的 tokenId
     */
    function mintAsset(
        address to,
        string calldata uri,
        uint96 royaltyBps
    ) external returns (uint256) {
        require(royaltyBps <= 1000, "Royalty too high (max 10%)");

        uint256 tokenId = _nextTokenId;
        _nextTokenId++;

        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);

        // 设置版税信息：版税接收者为铸造者 (msg.sender)
        _setTokenRoyalty(tokenId, msg.sender, royaltyBps);

        // 记录原始创作者
        creators[tokenId] = msg.sender;

        emit AssetMinted(tokenId, msg.sender, uri);

        return tokenId;
    }

    // ============ 市场功能 ============

    /**
     * @notice 将自己拥有的 NFT 上架出售。
     * @param tokenId 要上架的 tokenId
     * @param price   出售价格（单位: wei），必须大于 0
     */
    function listForSale(uint256 tokenId, uint256 price) external {
        require(ownerOf(tokenId) == msg.sender, "Not the owner");
        require(price > 0, "Price must be greater than 0");

        // 确保合约已获得转移授权
        require(
            getApproved(tokenId) == address(this) || isApprovedForAll(msg.sender, address(this)),
            "Contract not approved for transfer"
        );

        listings[tokenId] = Listing({
            price: price,
            seller: msg.sender
        });

        emit AssetListed(tokenId, price, msg.sender);
    }

    /**
     * @notice 取消 NFT 的上架出售。
     * @param tokenId 要下架的 tokenId
     */
    function cancelListing(uint256 tokenId) external {
        Listing memory listing = listings[tokenId];
        require(listing.price > 0, "Not listed");
        require(listing.seller == msg.sender, "Not the seller");

        delete listings[tokenId];

        emit ListingCancelled(tokenId);
    }

    /**
     * @notice 购买已上架的 NFT。
     *         自动按 ERC-2981 标准分配版税给原始创作者，余额转给卖家。
     * @param tokenId 要购买的 tokenId
     */
    function buyAsset(uint256 tokenId) external payable {
        Listing memory listing = listings[tokenId];
        require(listing.price > 0, "Not listed for sale");
        require(msg.value >= listing.price, "Insufficient payment");
        require(listing.seller != msg.sender, "Cannot buy own asset");

        // 清除上架信息（防止重入）
        delete listings[tokenId];

        // 查询版税信息
        (address royaltyReceiver, uint256 royaltyAmount) = royaltyInfo(tokenId, listing.price);

        // 计算卖家实际收入
        uint256 sellerProceeds = listing.price - royaltyAmount;

        // 转移 NFT 所有权
        _transfer(listing.seller, msg.sender, tokenId);

        // 分配资金：版税 -> 创作者，余额 -> 卖家
        if (royaltyAmount > 0 && royaltyReceiver != address(0)) {
            (bool royaltyPaid, ) = payable(royaltyReceiver).call{value: royaltyAmount}("");
            require(royaltyPaid, "Royalty payment failed");
        }

        (bool sellerPaid, ) = payable(listing.seller).call{value: sellerProceeds}("");
        require(sellerPaid, "Seller payment failed");

        // 退还多余支付
        if (msg.value > listing.price) {
            (bool refunded, ) = payable(msg.sender).call{value: msg.value - listing.price}("");
            require(refunded, "Refund failed");
        }

        emit AssetSold(tokenId, listing.price, listing.seller, msg.sender);
    }

    // ============ 查询功能 ============

    /**
     * @notice 获取 NFT 的上架信息。
     * @param tokenId 要查询的 tokenId
     * @return price  上架价格
     * @return seller 卖家地址
     */
    function getListing(uint256 tokenId) external view returns (uint256 price, address seller) {
        Listing memory listing = listings[tokenId];
        return (listing.price, listing.seller);
    }

    /**
     * @notice 获取当前已铸造的 NFT 总数。
     * @return 已铸造的 NFT 总数
     */
    function totalMinted() external view returns (uint256) {
        return _nextTokenId;
    }

    // ============ 接口支持 ============

    /**
     * @dev 重写 supportsInterface，声明同时支持 ERC-721 和 ERC-2981。
     */
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721URIStorage, ERC2981)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}

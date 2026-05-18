// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/common/ERC2981.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title DigitalAssetNFT
 * @dev 基于 ERC-721 标准的数字资产确权合约。
 *      集成 ERC-2981 版税标准，支持创作者在每次二级市场交易中获得版税。
 */
contract DigitalAssetNFT is ERC721URIStorage, ERC2981, Ownable {

    // ============ 状态变量 ============

    /// @dev 用于生成自增 tokenId 的计数器
    uint256 private _nextTokenId;

    /// @dev tokenId => 原始创作者地址的映射
    mapping(uint256 => address) public creators;

    // ============ 事件 ============

    /// @dev 当新资产铸造时触发
    event AssetMinted(uint256 indexed tokenId, address indexed creator, string tokenURI);

    // ============ 构造函数 ============

    constructor() ERC721("DigitalAssetNFT", "DANFT") Ownable(msg.sender) {}

    // ============ 铸造功能 ============

    /**
     * @notice 铸造一个新的数字资产 NFT。
     * @param to         接收者地址
     * @param uri        资产元数据的 IPFS URI (例如 ipfs://Qm...)
     * @param royaltyBps 版税比例，以基点表示 (100 = 1%, 最大 1000 = 10%)
     * @return tokenId   新铸造的 tokenId
     */
    function mintAsset(
        address to,
        string calldata uri,
        uint96 royaltyBps
    ) external returns (uint256 tokenId) {
        require(bytes(uri).length > 0, "URI cannot be empty");
        require(royaltyBps <= 1000, "Royalty too high (max 10%)");

        tokenId = _nextTokenId;
        _nextTokenId++;

        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);

        _setTokenRoyalty(tokenId, msg.sender, royaltyBps);
        creators[tokenId] = msg.sender;

        emit AssetMinted(tokenId, msg.sender, uri);
    }

    // ============ 查询功能 ============

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

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/common/ERC2981.sol";

/**
 * @title FixedPriceMarket
 * @dev 一口价交易市场合约。卖家以固定价格上架 NFT，买家按标价购买。
 *      通过 IERC721 + IERC2981 接口与 NFT 合约解耦交互。
 */
contract FixedPriceMarket {

    // ============ 状态变量 ============

    IERC2981 public immutable royaltyContract;
    IERC721 public immutable nftContract;

    struct Listing {
        uint256 price;
        address seller;
    }

    mapping(uint256 => Listing) public listings;

    // ============ 事件 ============

    event AssetListed(uint256 indexed tokenId, uint256 price, address indexed seller);
    event AssetSold(uint256 indexed tokenId, uint256 price, address indexed seller, address indexed buyer);
    event ListingCancelled(uint256 indexed tokenId);

    // ============ 构造函数 ============

    constructor(address danftAddress) {
        require(danftAddress != address(0), "Invalid DANFT address");
        nftContract = IERC721(danftAddress);
        royaltyContract = IERC2981(danftAddress);
    }

    // ============ 一口价交易 ============

    function listForSale(uint256 tokenId, uint256 price) external {
        require(price > 0, "Price must be greater than 0");
        require(nftContract.ownerOf(tokenId) == msg.sender, "Not the owner");

        require(
            nftContract.getApproved(tokenId) == address(this) ||
                nftContract.isApprovedForAll(msg.sender, address(this)),
            "Contract not approved for transfer"
        );

        listings[tokenId] = Listing({
            price: price,
            seller: msg.sender
        });

        emit AssetListed(tokenId, price, msg.sender);
    }

    function cancelListing(uint256 tokenId) external {
        Listing storage listing = listings[tokenId];
        require(listing.price > 0, "Not listed");
        require(listing.seller == msg.sender, "Not the seller");

        delete listings[tokenId];

        emit ListingCancelled(tokenId);
    }

    function buyAsset(uint256 tokenId) external payable {
        Listing storage listing = listings[tokenId];
        require(listing.price > 0, "Not listed for sale");
        require(msg.value >= listing.price, "Insufficient payment");
        require(listing.seller != msg.sender, "Cannot buy own asset");

        address seller = listing.seller;
        uint256 price = listing.price;

        delete listings[tokenId];

        (address royaltyReceiver, uint256 royaltyAmount) = royaltyContract.royaltyInfo(tokenId, price);

        uint256 sellerProceeds = price - royaltyAmount;

        nftContract.transferFrom(seller, msg.sender, tokenId);

        if (royaltyAmount > 0 && royaltyReceiver != address(0)) {
            (bool royaltyPaid, ) = payable(royaltyReceiver).call{value: royaltyAmount}("");
            require(royaltyPaid, "Royalty payment failed");
        }

        (bool sellerPaid, ) = payable(seller).call{value: sellerProceeds}("");
        require(sellerPaid, "Seller payment failed");

        if (msg.value > price) {
            (bool refunded, ) = payable(msg.sender).call{value: msg.value - price}("");
            require(refunded, "Refund failed");
        }

        emit AssetSold(tokenId, price, seller, msg.sender);
    }
}

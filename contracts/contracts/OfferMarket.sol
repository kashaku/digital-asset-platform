// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/common/ERC2981.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title OfferMarket
 * @dev 竞价市场合约。买家以 ERC-20 代币出价，卖家可选择接受。
 *      通过 IERC721 + IERC2981 + IERC20 接口与外部合约解耦交互。
 */
contract OfferMarket {

    // ============ 状态变量 ============

    IERC2981 public immutable royaltyContract;
    IERC721 public immutable nftContract;
    IERC20 public immutable tokenContract;

    struct Offer {
        uint256 price;
        uint256 expiresAt;
    }

    mapping(uint256 => mapping(address => Offer)) public offers;

    // ============ 事件 ============

    event OfferMade(uint256 indexed tokenId, address indexed buyer, uint256 price, uint256 expiresAt);
    event OfferAccepted(uint256 indexed tokenId, address indexed buyer, uint256 price, address indexed seller);
    event OfferCancelled(uint256 indexed tokenId, address indexed buyer);

    // ============ 构造函数 ============

    constructor(address danftAddress, address tokenAddress) {
        require(danftAddress != address(0), "Invalid DANFT address");
        nftContract = IERC721(danftAddress);
        royaltyContract = IERC2981(danftAddress);
        require(tokenAddress != address(0), "Invalid token address");
        tokenContract = IERC20(tokenAddress);
    }

    // ============ 竞价交易 ============

    function makeOffer(uint256 tokenId, uint256 price, uint256 expiresAt) external {
        require(price > 0, "Price must be greater than 0");
        require(expiresAt > block.timestamp, "Expiration must be in the future");

        offers[tokenId][msg.sender] = Offer({
            price: price,
            expiresAt: expiresAt
        });

        emit OfferMade(tokenId, msg.sender, price, expiresAt);
    }

    function acceptOffer(uint256 tokenId, address buyer) external {
        Offer storage offer = offers[tokenId][buyer];
        require(offer.expiresAt > block.timestamp, "Offer expired");
        require(nftContract.ownerOf(tokenId) == msg.sender, "Not the owner");

        uint256 price = offer.price;
        delete offers[tokenId][buyer];

        (address royaltyReceiver, uint256 royaltyAmount) = royaltyContract.royaltyInfo(tokenId, price);

        uint256 sellerProceeds = price - royaltyAmount;

        nftContract.transferFrom(msg.sender, buyer, tokenId);

        tokenContract.transferFrom(buyer, royaltyReceiver, royaltyAmount);
        tokenContract.transferFrom(buyer, msg.sender, sellerProceeds);

        emit OfferAccepted(tokenId, buyer, price, msg.sender);
    }

    function cancelOffer(uint256 tokenId) external {
        Offer storage offer = offers[tokenId][msg.sender];
        require(offer.price > 0, "No active offer");

        delete offers[tokenId][msg.sender];

        emit OfferCancelled(tokenId, msg.sender);
    }
}

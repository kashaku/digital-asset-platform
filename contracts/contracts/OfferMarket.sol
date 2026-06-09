// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/common/ERC2981.sol";

/**
 * @title OfferMarket
 * @dev Escrowed ETH offer market. Buyers lock ETH when making offers; NFT owners
 * can accept an offer and settle the trade immediately.
 */
contract OfferMarket {
    IERC2981 public immutable royaltyContract;
    IERC721 public immutable nftContract;

    struct Offer {
        uint256 price;
        uint256 expiresAt;
        address seller;
    }

    mapping(uint256 => mapping(address => Offer)) public offers;
    mapping(uint256 => address[]) private offerBuyers;
    mapping(uint256 => mapping(address => bool)) private hasOffer;

    event OfferMade(uint256 indexed tokenId, address indexed buyer, uint256 price, uint256 expiresAt);
    event OfferAccepted(uint256 indexed tokenId, address indexed buyer, uint256 price, address indexed seller);
    event OfferCancelled(uint256 indexed tokenId, address indexed buyer);

    constructor(address danftAddress) {
        require(danftAddress != address(0), "Invalid DANFT address");
        nftContract = IERC721(danftAddress);
        royaltyContract = IERC2981(danftAddress);
    }

    function makeOffer(uint256 tokenId, uint256 price, uint256 expiresAt) external payable {
        address seller = nftContract.ownerOf(tokenId);

        require(price > 0, "Price must be greater than 0");
        require(msg.value == price, "ETH value must equal price");
        require(expiresAt > block.timestamp, "Expiration must be in the future");
        require(seller != msg.sender, "Cannot offer on own asset");

        Offer storage existingOffer = offers[tokenId][msg.sender];
        uint256 refundAmount = existingOffer.price;

        offers[tokenId][msg.sender] = Offer({
            price: price,
            expiresAt: expiresAt,
            seller: seller
        });

        if (!hasOffer[tokenId][msg.sender]) {
            hasOffer[tokenId][msg.sender] = true;
            offerBuyers[tokenId].push(msg.sender);
        }

        if (refundAmount > 0) {
            (bool refunded, ) = payable(msg.sender).call{value: refundAmount}("");
            require(refunded, "Offer refund failed");
        }

        emit OfferMade(tokenId, msg.sender, price, expiresAt);
    }

    function acceptOffer(uint256 tokenId, address buyer) external {
        Offer storage offer = offers[tokenId][buyer];
        require(offer.price > 0, "No active offer");
        require(offer.expiresAt > block.timestamp, "Offer expired");
        require(nftContract.ownerOf(tokenId) == msg.sender, "Not the owner");
        require(offer.seller == msg.sender, "Offer seller changed");

        uint256 price = offer.price;
        _clearOffer(tokenId, buyer);

        (address royaltyReceiver, uint256 royaltyAmount) = royaltyContract.royaltyInfo(tokenId, price);
        uint256 sellerProceeds = price - royaltyAmount;

        nftContract.transferFrom(msg.sender, buyer, tokenId);

        if (royaltyAmount > 0 && royaltyReceiver != address(0)) {
            (bool royaltyPaid, ) = payable(royaltyReceiver).call{value: royaltyAmount}("");
            require(royaltyPaid, "Royalty payment failed");
        } else {
            sellerProceeds = price;
        }

        (bool sellerPaid, ) = payable(msg.sender).call{value: sellerProceeds}("");
        require(sellerPaid, "Seller payment failed");

        emit OfferAccepted(tokenId, buyer, price, msg.sender);
    }

    function cancelOffer(uint256 tokenId) external {
        Offer storage offer = offers[tokenId][msg.sender];
        require(offer.price > 0, "No active offer");

        uint256 refundAmount = offer.price;
        _clearOffer(tokenId, msg.sender);

        (bool refunded, ) = payable(msg.sender).call{value: refundAmount}("");
        require(refunded, "Offer refund failed");

        emit OfferCancelled(tokenId, msg.sender);
    }

    function cancelStaleOffers(uint256 tokenId) external {
        address currentOwner = nftContract.ownerOf(tokenId);
        address[] memory buyers = offerBuyers[tokenId];

        for (uint256 i = 0; i < buyers.length; i++) {
            address buyer = buyers[i];
            Offer storage offer = offers[tokenId][buyer];

            if (offer.price > 0 && offer.seller != currentOwner) {
                uint256 refundAmount = offer.price;
                _clearOffer(tokenId, buyer);

                (bool refunded, ) = payable(buyer).call{value: refundAmount}("");
                require(refunded, "Offer refund failed");

                emit OfferCancelled(tokenId, buyer);
            }
        }
    }

    function _clearOffer(uint256 tokenId, address buyer) private {
        delete offers[tokenId][buyer];
        hasOffer[tokenId][buyer] = false;
    }
}

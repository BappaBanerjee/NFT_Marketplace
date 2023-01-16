// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol";

contract Tradeplace is ERC721Holder {
    uint256 public Itemcount;
    struct Item_details {
        address payable seller;
        uint256 price;
        uint256 item_number;
        uint256 tokenID;
        bool sold;
    }
    mapping(uint256 => Item_details) public Items;

    event Listed(
        address from,
        address to,
        uint256 price,
        uint256 tokenID,
        uint256 item_number
    );

    event buyed(
        address seller,
        address buyer,
        uint256 price,
        uint256 tokenID,
        uint256 item_number
    );

    function sellNFT(
        IERC721 _contract,
        uint256 _tokenID,
        uint256 _price
    ) public {
        //price of the product must be greater than 0
        require(_price > 0, "Price must be greater than zero!");
        Itemcount++;
        _contract.safeTransferFrom(msg.sender, address(this), _tokenID);

        Items[Itemcount] = Item_details(
            payable(msg.sender),
            _price,
            Itemcount,
            _tokenID,
            false
        );

        emit Listed(msg.sender, address(this), _price, _tokenID, Itemcount);
    }

    function buyNFT(IERC721 _contract, uint256 _itemNumber) public payable {
        Item_details storage item = Items[_itemNumber];
        require(
            _itemNumber > 0 && _itemNumber < Itemcount,
            "Item does not exists"
        );
        //check if the item is already sold or not
        require(item.sold == false, "Item is already sold");
        //check if the amount send is equal to the price of the item
        require(msg.value == item.price, "Invalid Amount!!");
        //tranfer the nft to the buyer account
        _contract.safeTransferFrom(address(this), msg.sender, item.tokenID);
        //mark the item as sold
        item.sold = true;
        //emit the buyed event
        emit buyed(
            item.seller,
            msg.sender,
            msg.value,
            item.tokenID,
            _itemNumber
        );
    }
}

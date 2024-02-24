// SPDX-License-Identifier: CC-BY-NC-4.0

pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Pausable.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Burnable.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Supply.sol";

/// @custom:security-contact security@hiddenstate.xyz
contract DCReward is ERC1155, AccessControl, ERC1155Pausable, ERC1155Burnable, ERC1155Supply {
    string public name;
    string public symbol;
    string public contractURI;
    bytes32 public constant URI_SETTER_ROLE = keccak256("URI_SETTER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    mapping(uint256 => string) public metadataUris;

    constructor(address defaultAdmin, address uriSetter, address pauser, address minter, string memory baseUri) ERC1155(baseUri) {
        _grantRole(DEFAULT_ADMIN_ROLE, defaultAdmin);
        _grantRole(URI_SETTER_ROLE, uriSetter);
        _grantRole(PAUSER_ROLE, pauser);
        _grantRole(MINTER_ROLE, minter);
    }

    function setContractURI(string memory newContractUri) public onlyRole(URI_SETTER_ROLE){
        contractURI = newContractUri;
    }
    function setNameSymbol(string memory name_, string memory symbol_) public onlyRole(URI_SETTER_ROLE) {
        name = name_;
        symbol = symbol_;
    }

    function pause() public onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() public onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    function mint(address account, uint256 id, uint256 amount, bytes memory data) public onlyRole(MINTER_ROLE) {
        _mint(account, id, amount, data);
    }

    function mintBatch(address to, uint256[] memory ids, uint256[] memory amounts, bytes memory data) public onlyRole(MINTER_ROLE) {
        _mintBatch(to, ids, amounts, data);
    }

    // The following functions are overrides required by Solidity.

    function _update(address from, address to, uint256[] memory ids, uint256[] memory values) internal override(ERC1155, ERC1155Pausable, ERC1155Supply) {
        super._update(from, to, ids, values);
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC1155, AccessControl) returns (bool){
        return super.supportsInterface(interfaceId) || interfaceId == this.name.selector || interfaceId == this.symbol.selector;
    }

    function setBaseURI(string memory newBaseUri) public onlyRole(URI_SETTER_ROLE) {
        super._setURI(newBaseUri);
    }

    function uri(uint256 id) public override view returns (string memory) {
        if (bytes(metadataUris[id]).length == 0) {
            return string(abi.encodePacked(super.uri(id), uint2str(id), ".json"));
        }
        return metadataUris[id];
    }

    function setSpecialURI(uint256 id, string memory uri_) public onlyRole(URI_SETTER_ROLE)  {
        metadataUris[id] = uri_;
    }


    function uint2str(uint256 _i) internal pure returns (string memory _uintAsString) {
        if (_i == 0) {
            return "0";
        }
        uint j = _i;
        uint len;
        while (j != 0) {
            len++;
            j /= 10;
        }
        bytes memory bstr = new bytes(len);
        uint k = len;
        while (_i != 0) {
            k = k - 1;
            uint8 temp = (48 + uint8(_i - _i / 10 * 10));
            bytes1 b1 = bytes1(temp);
            bstr[k] = b1;
            _i /= 10;
        }
        return string(bstr);
    }
}

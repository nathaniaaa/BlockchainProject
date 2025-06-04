// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract KaretKontrak {
    address public owner;
    mapping(string => uint256) public hargaPerKualitas; // "A", "B", "C"

    event TransaksiDibuat(address petani, uint256 berat, uint256 harga);

    modifier onlyOwner() {
        require(msg.sender == owner, "Hanya owner");
        _;
    }

    constructor() {
        owner = msg.sender;
        hargaPerKualitas["A"] = 0.01 ether; // Harga default
        hargaPerKualitas["B"] = 0.007 ether;
        hargaPerKualitas["C"] = 0.005 ether;
    }

    function buatTransaksi(address _petani, uint256 _berat, string calldata _kualitas) external payable onlyOwner {
        uint256 hargaTotal = (_berat * hargaPerKualitas[_kualitas]) / 1000; // gram -> kg
        payable(_petani).transfer(hargaTotal);
        emit TransaksiDibuat(_petani, _berat, hargaTotal);
    }
}
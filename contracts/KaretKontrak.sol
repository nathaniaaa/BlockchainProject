// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract KaretKontrak {
    address public owner;
    mapping(string => uint256) public hargaPerKualitas; // A, B, C

    event TransaksiDibuat(address petani, uint256 beratKg, uint256 harga);
    event HargaDiupdate(string kualitas, uint256 hargaBaru);

    modifier onlyOwner() {
        require(msg.sender == owner, "Hanya owner");
        _;
    }

    constructor() {
        owner = msg.sender;
        // Harga default (akan diupdate oleh oracle)
        hargaPerKualitas["A"] = 0.01 ether;
        hargaPerKualitas["B"] = 0.007 ether;
        hargaPerKualitas["C"] = 0.005 ether;
    }

    // Fungsi untuk mengupdate harga per kualitas
    function updateHarga(string calldata _kualitas, uint256 _harga) external onlyOwner {
        require(_harga > 0, "Harga harus lebih dari 0");
        hargaPerKualitas[_kualitas] = _harga;
        emit HargaDiupdate(_kualitas, _harga);
    }

    // Fungsi untuk membuat transaksi pembelian karet
    // _petani: alamat petani yang menjual karet
    // _beratKg: berat karet dalam kilogram
    // _kualitas: kualitas karet (A, B, C)
    // Mengirim ETH ke petani sesuai dengan harga yang ditentukan
    function buatTransaksi(
        address _petani, 
        uint256 _beratKg,  
        string calldata _kualitas
    ) external payable onlyOwner {
        uint256 hargaSatuan = hargaPerKualitas[_kualitas];
        require(hargaSatuan > 0, "Kualitas tidak valid");

        uint256 hargaTotal = (_beratKg * hargaSatuan) / 1 ether;
        require(msg.value >= hargaTotal, "ETH tidak cukup");

        (bool success, ) = payable(_petani).call{value: hargaTotal}("");
        require(success, "Transfer gagal");
        
        emit TransaksiDibuat(_petani, _beratKg, hargaTotal);
    }
}
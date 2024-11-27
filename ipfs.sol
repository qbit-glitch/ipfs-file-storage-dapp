// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract IPFSStorage {
    // Struct to store file information
    struct FileInfo {
        string ipfsHash;
        address owner;
        uint256 timestamp;
    }

    // Mapping to store files per user
    mapping(address => FileInfo[]) private userFiles;

    // Event to log file upload
    event FileUploaded(address indexed uploader, string ipfsHash, uint256 timestamp);

    // Store the IPFS hash with the uploader's address
    function uploadFile(string memory _ipfsHash) public {
        FileInfo memory newFile = FileInfo({
            ipfsHash: _ipfsHash,
            owner: msg.sender,
            timestamp: block.timestamp
        });

        userFiles[msg.sender].push(newFile);
        emit FileUploaded(msg.sender, _ipfsHash, block.timestamp);
    }

    // Retrieve files for the calling user
    function getUserFiles() public view returns (FileInfo[] memory) {
        return userFiles[msg.sender];
    }

    // Optional: Retrieve a specific file by index
    function getUserFileByIndex(uint256 _index) public view returns (FileInfo memory) {
        require(_index < userFiles[msg.sender].length, "File index out of bounds");
        return userFiles[msg.sender][_index];
    }
}
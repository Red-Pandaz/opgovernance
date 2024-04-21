// utils/helpers.js

// Function to search for a match from either of the arrays
function searchMatch(object1, array2, array3) {
    const resultArray = [];
    
    // Extract array1's properties
    const array1 = Object.values(object1);
    
    // Loop through array1
    for (let obj1 of array1) {
        let matchedObj;
        // Check if obj1.proposalId exists in array2
        matchedObj = array2.find(obj => obj.proposalId === obj1.proposalId);
        // If no match found in array2, check in array3
        if (!matchedObj) {
            matchedObj = array3.find(obj => obj.proposalId === obj1.proposalId);
        }
        // If a match is found, push obj1 and the matching object to resultArray
        if (matchedObj) {
            resultArray.push({ obj1, matchedObj });
        }
    }
    
    return resultArray;
}

module.exports = {
    searchMatch
};
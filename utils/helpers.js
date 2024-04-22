// utils/helpers.js

// Function to search for a match from either of the arrays
function searchMatch(object1, array2, array3) {
    for(let item of array2){
        console.log(item.proposalId)
    }
    let resultArray = [];
    if (!object1 || !object1.proposalId) {
        console.error('Invalid input: object1 must have a valid proposalId property');
        return resultArray;
    }
    

    // Check if either array2 or array3 is empty or undefined
    if ((!array2 || array2.length === 0) && (!array3 || array3.length === 0)) {
        console.error('Invalid input: both array2 and array3 are empty or undefined');
        return resultArray;
    }
    
    // Check if obj1.proposalId exists in array2
    if (array2 && array2.length > 0) {
        const matchedObj = array2.find(obj => obj.proposalId === object1.proposalId);
        console.log(matchedObj)
        if (matchedObj) {
            resultArray.push({ obj1: object1, matchedObj });
            console.log(resultArray)
            return resultArray;
        }
    }
    
    // Check if obj1.proposalId exists in array3
    if (array3 && array3.length > 0) {
        const matchedObj = array3.find(obj => obj.proposalId === object1.proposalId);
        if (matchedObj) {
            resultArray.push({ obj1: object1, matchedObj });
            console.log(resultArray)
            return resultArray;
        }
    }
  
    return resultArray;
}    


function formatProposalId(proposalId){

}
function formatAddress(address){

}

module.exports = {
    searchMatch
};
function searchMatch(object1, array2, array3) {
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
        const indexInArray2 = array2.findIndex(obj => obj.proposalId === object1.proposalId);
        if (indexInArray2 !== -1) {
            resultArray.push({ obj1: object1, matchedObj: array2[indexInArray2], source: 'openProposals', index: indexInArray2 });
        }
    }
    
    // Check if obj1.proposalId exists in array3
    if (array3 && array3.length > 0) {
        const indexInArray3 = array3.findIndex(obj => obj.proposalId === object1.proposalId);
        if (indexInArray3 !== -1) {
            resultArray.push({ obj1: object1, matchedObj: array3[indexInArray3], source: 'newProposals', index: indexInArray3 });
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
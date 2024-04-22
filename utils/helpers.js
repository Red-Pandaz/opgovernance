// utils/helpers.js

// Function to search for a match from either of the arrays
function searchMatch(object1, array2, array3) {
    let resultArray = [];
    
    // Check if object1 has a proposalId property
    if (!object1 || !object1.proposalId) {
        console.error('Invalid input: object1 must have a valid proposalId property');
        return resultArray;
    }

    // Check if array2 is empty or undefined
    if (!array2 || array2.length === 0) {
        console.error('Invalid input: array2 is empty or undefined');
        return resultArray;
    }

    // Check if array3 is empty or undefined
    if (!array3 || array3.length === 0) {
        console.error('Invalid input: array3 is empty or undefined');
        return resultArray;
    }

    // Loop through array2
    for (let obj2 of array2) {
        // Check if obj2 has a proposalId property
        if (!obj2 || !obj2.proposalId) {
            console.error('Invalid object in array2: must have a valid proposalId property');
            continue; // Skip this object and proceed to the next one
        }
        
        // Check if obj2's proposalId matches object1's proposalId
        if (obj2.proposalId === object1.proposalId) {
            resultArray.push({ object1, obj2 });
            break; // Break out of the loop since a match is found
        }
    }

    // If no match found in array2, check in array3
    if (resultArray.length === 0) {
        for (let obj3 of array3) {
            // Check if obj3 has a proposalId property
            if (!obj3 || !obj3.proposalId) {
                console.error('Invalid object in array3: must have a valid proposalId property');
                continue; // Skip this object and proceed to the next one
            }

            // Check if obj3's proposalId matches object1's proposalId
            if (obj3.proposalId === object1.proposalId) {
                resultArray.push({ object1, obj3 });
                break; // Break out of the loop since a match is found
            }
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
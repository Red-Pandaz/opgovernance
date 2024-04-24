// EVENTUALLY: Add periodic vote results updating
// EVENTUALLY: logic for quorum, proposaltype, etc.

const ethers = require('ethers');
const dotenv = require("dotenv").config();
const { updateTimestamp, getLastTimestamp, getOpenProposals, updateProposalDatabases } = require('./database/database.js');
const { retryApiCall, accessSecret } = require('./utils/apiutils.js');
const { sendCasts } = require('./farcaster/farcaster.js');
const { getExpiredProposals, getCanceledProposals, getNewVotes, findNewProposals, getProposalUpdates } = require('./functions/gov-functions.js')

exports.main = async (req, res) =>{
    try{
    const INFURA_API = await retryApiCall(() => accessSecret('INFURA_API'));
    const provider = new ethers.providers.JsonRpcProvider(`https://optimism-mainnet.infura.io/v3/${INFURA_API}`);
    let currentBlock = await retryApiCall(() => provider.getBlockWithTransactions('latest'))
    // let currentBlock = await getBlockWithRetry(provider)
    let currentTimestamp = Date.now();
    let [lastBlock, lastTimestamp] = await getLastTimestamp()
    let fromBlock = lastBlock + 1;
    let toBlock = currentBlock.number;
    let cronTime = 180000;
    let voteMinimum = 500000
    let castsToSend = [];
    let openProposals =[]
    let closedProposals = []
    let sentCastArray


    // Making sure that block ranges are accessed and ready to use 
    if(!currentBlock){
        console.log("Current block could not be aquired from provider.");
        return;
    }
    if(!lastBlock){
            console.log("Last block could not be acquired from database")
            return;
        }
    // Checking cron time vs the time elapsed since last timestamp. 
    // If too much time has elapsed it does nothing but try to update and return
    if((currentTimestamp - lastTimestamp) > (cronTime * 3.75)){
        console.log("Too much time in between timestamps, program risks recasting");
        updateTimestamp(currentBlock.number, []);
        return;
        }
    openProposals = await getOpenProposals()

    // openPrososals = JSON.parse(require ('./proposals.json')).toString()
    // console.log(openProposals)
    let newProposals = await findNewProposals(castsToSend, fromBlock, toBlock)
    await getNewVotes(castsToSend, openProposals, newProposals, fromBlock, toBlock, voteMinimum)
    if(openProposals || newProposals){
        await getProposalUpdates(castsToSend,  openProposals, newProposals, fromBlock, toBlock)
        await getExpiredProposals(castsToSend, openProposals, closedProposals, toBlock)
        await getCanceledProposals(castsToSend, closedProposals, openProposals, newProposals, fromBlock, toBlock) 
    }
 
    if ((newProposals && newProposals.length > 0) || (closedProposals && closedProposals.length > 0)) {
        await updateProposalDatabases(newProposals, closedProposals);
    }
  
    if(castsToSend){
        sentCastArray = await sendCasts(castsToSend);
    }
   
    await updateTimestamp(currentBlock.number, sentCastArray);
}catch(err){
    console.log(err)
    return
    }
    console.log("Cloud Function executed");
    res.status(200).send("Cloud Function executed successfully");
    return
}


// // Define a function to be executed by setTimeout for testing
// async function runLoopFrom(blockNumber) {
//     const INFURA_API = await retryApiCall(() => accessSecret('INFURA_API'));
//     const provider = new ethers.providers.JsonRpcProvider(`https://optimism-mainnet.infura.io/v3/${INFURA_API}`);
//     let currentBlock = await retryApiCall(() => provider.getBlockWithTransactions('latest'))
//     // Ensure blockNumber is within the desired range
//     if (blockNumber <= currentBlock.number) {
//         console.log("executing main from block :" + (blockNumber + 50000))
//         // Execute main function with the current block number
//         main(blockNumber);
        
//         // Increment blockNumber for the next iteration
//         blockNumber += 50000;
        
//         // Schedule the next iteration after a delay
//         setTimeout(async () => {
//             // Call runLoopFrom recursively with the updated blockNumber
//             await runLoopFrom(blockNumber);
//         }, 120000); 
//     }
// }

// // Start the loop from the specified block number
// runLoopFrom(118599210);

// Get header in vote casts
// make sure datbase retrievals and updates are working
// Cast out final results of proposal after expiration block
// Scan for other updates (expiration, quorum, proposaltype)




const ethers = require('ethers');
const dotenv = require("dotenv").config();
const { updateTimestamp, getLastTimestamp, getOpenProposals, updateProposalDatabases } = require('./database/database.js');
const { retryApiCall, accessSecret } = require('./utils/apiutils.js');
const { sendCasts } = require('./farcaster/farcaster.js');
const { getExpiredProposals, getCanceledProposals, getNewVotes } = require('./test.js')
const { findNewProposals } = require('./proposallistener.js')

async function main(startBlock){
    try{
    const INFURA_API = await retryApiCall(() => accessSecret('INFURA_API'));
    const provider = new ethers.providers.JsonRpcProvider(`https://optimism-mainnet.infura.io/v3/${INFURA_API}`);
    let currentBlock = await retryApiCall(() => provider.getBlockWithTransactions('latest'))
    // let currentBlock = await getBlockWithRetry(provider)
    let currentTimestamp = Date.now();
    let [lastBlock, lastTimestamp] = await getLastTimestamp()
    // let fromBlock = lastBlock + 1;
    // let fromBlock = currentBlock.number - 1000000
    // let toBlock = currentBlock.number;
    let fromBlock = startBlock
    let toBlock = startBlock + 49999
    let cronTime = 180000;
    let voteMinimum = 500000
    let castsToSend = [];
    let openProposals =[]
    let closedProposals = []
    let sentCasts 
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
    // if((currentTimestamp - lastTimestamp) > (cronTime * 3.75)){
    //     console.log("Too much time in between timestamps, program risks recasting");
    //     updateTimestamp(currentBlock.number, []);
    //     return;
    //     }
    openProposals = await getOpenProposals()
    // openPrososals = JSON.parse(require ('./proposals.json')).toString()
    // console.log(openProposals)
    let newProposals = await findNewProposals(castsToSend, fromBlock, toBlock)
    if(openProposals || newProposals){
        await getExpiredProposals(castsToSend, openProposals, closedProposals, fromBlock, toBlock)
        await getCanceledProposals(castsToSend, closedProposals, openProposals, newProposals, fromBlock, toBlock)
        
    }
    await getNewVotes(castsToSend, openProposals, newProposals, fromBlock, toBlock, voteMinimum)
    if(newProposals || closedProposals){
        await updateProposalDatabases(newProposals, closedProposals)
    }
    if(castsToSend){
        sentCastArray = await sendCasts(castsToSend);
    }
   
    await updateTimestamp(currentBlock.number, sentCastArray);
    return
}catch(err){
        console.log("main function error: " + err)
    }

    return;
}



// main() 

// Define a function to be executed by setTimeout
async function runLoopFrom(blockNumber) {
    const INFURA_API = await retryApiCall(() => accessSecret('INFURA_API'));
    const provider = new ethers.providers.JsonRpcProvider(`https://optimism-mainnet.infura.io/v3/${INFURA_API}`);
    let currentBlock = await retryApiCall(() => provider.getBlockWithTransactions('latest'))
    // Ensure blockNumber is within the desired range
    if (blockNumber <= currentBlock.number) {
        console.log("executing main from block :" + blockNumber)
        // Execute main function with the current block number
        main(blockNumber);
        
        // Increment blockNumber for the next iteration
        blockNumber += 50000;
        
        // Schedule the next iteration after a delay
        setTimeout(async () => {
            // Call runLoopFrom recursively with the updated blockNumber
            await runLoopFrom(blockNumber);
        }, 120000); // Delay of 300 seconds (5 minutes)
    }
}

// Start the loop from the specified block number
runLoopFrom(99582724);

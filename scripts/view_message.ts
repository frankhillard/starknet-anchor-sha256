import { RpcProvider, Contract, Account, ec, json, constants } from "starknet";
import * as dotenv from "dotenv";
import path from "path";
import fs from "fs";

// Read environment variables from .env file
dotenv.config({ path: path.join(__dirname, "..", ".env") });

// initialize provider and account
// const provider = new Provider({ sequencer: { network: constants.NetworkName.SN_GOERLI } })
const provider = new RpcProvider({ nodeUrl: constants.NetworkName.SN_GOERLI })
const privateKey = process.env.ACCOUNT_PRIVKEY;
const accountAddress = process.env.ACCOUNT_ADDRESS;
const account = new Account(provider, accountAddress, privateKey);

// Get the anchoring address from argument, fallback to saved address
const get_arg_max = async () => {
    const args = process.argv.slice(2);
    const max = args[0];

    return Number(max);
};

const get_all_messages = async () => {
    try {
        const MAX = await get_arg_max();
        const ANCHORING_ADDRESS = (await import("../deployments/anchoring")).default; 
        // read abi of Test contract
        const { abi: anchoringAbi } = await provider.getClassAt(ANCHORING_ADDRESS);
        if (anchoringAbi === undefined) { throw new Error("no abi.") };
        const anchoringContract = new Contract(anchoringAbi, ANCHORING_ADDRESS, provider);
        // Connect account with the contract
        anchoringContract.connect(account);

        // Get all anchored hashes
        let valuesResponse = await anchoringContract.call("get_anchored_values");
        for (let i = 0; i < MAX; i++) {
            if (valuesResponse[i] !== undefined) {
                const part_0 = valuesResponse[i]['0'].toString(16);
                const part_1 = valuesResponse[i]['1'].toString(16);
                console.log(`anchored hash #${i+1}: 0x${part_0}${part_1}`);
            }
        }

    } catch (e) {
        // Aborted while using ledger
        if (e.statusText === "CONDITIONS_OF_USE_NOT_SATISFIED") {
            console.log("Aborted.");
        } else {
            console.log(e);
        }
    }
};

get_all_messages();
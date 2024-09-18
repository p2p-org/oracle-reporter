import { withdrawErc4337 } from "./withdrawErc4337"
import {StandardMerkleTree} from "@openzeppelin/merkle-tree";
import {logger} from "./helpers/logger";
import {withdrawTx} from "./withdrawTx";
import {getUse4337} from "./helpers/getUse4337";
import {getDatedJsonFilePath} from "./helpers/getDatedJsonFilePath";
import fs from "fs";
import {getIsContract} from "./helpers/getIsContract";
import {deployFeeDistributor} from "./deployFeeDistributor";
import { FeeDistributorToWithdraw } from "./models/FeeDistributorToWithdraw"

export async function withdrawAll(feeDistributors: FeeDistributorToWithdraw[], tree: StandardMerkleTree<any[]>) {
    logger.info('withdrawAll started')

    if (!process.env.MIN_BALANCE_TO_WITHDRAW_IN_GWEI) {
        throw new Error('MIN_BALANCE_TO_WITHDRAW_IN_GWEI not set in ENV')
    }

    const txHashesForFdAddresses: {address: string, hash: string}[] = []

    for (const fd of feeDistributors) {
        try {
            if (fd.fdAddress.toLowerCase() === '0xa136329Bb4c0Af09C5Ad20449E4eb8b60fE65F19'.toLowerCase()) {
                throw new Error('Corrupted address 0xa136329Bb4c0Af09C5Ad20449E4eb8b60fE65F19')
            }

            const isDeployed = await getIsContract(fd.fdAddress)

            if (!isDeployed) {
                if (!fd.identityParams) {
                    throw new Error('No identityParams for ' + fd.fdAddress)
                }
                const deployHash = await deployFeeDistributor(fd)
                txHashesForFdAddresses.push({address: fd.fdAddress, hash: deployHash})
            }

            let withdrawHash = ''
            const use4337 = getUse4337()
            if (use4337) {
                withdrawHash = await withdrawErc4337(fd.fdAddress, tree)
            } else {
                withdrawHash = await withdrawTx(fd.fdAddress, tree)
            }
            txHashesForFdAddresses.push({address: fd.fdAddress, hash: withdrawHash})

        } catch (error) {
            logger.error(error)
        }
    }

    const filePath = getDatedJsonFilePath('tx-hashes-for-fd-addresses')
    logger.info('Saving tx-hashes-for-fd-addresses to ' + filePath)
    fs.writeFileSync(filePath, JSON.stringify(txHashesForFdAddresses))
    logger.info('tx-hashes-for-fd-addresses saved')

    logger.info('withdrawAll finished')

    return txHashesForFdAddresses
}

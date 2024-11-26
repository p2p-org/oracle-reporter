import {StandardMerkleTree} from "@openzeppelin/merkle-tree";
import fs from "fs";
import {withdrawAll} from "./withdrawAll";
import {logger} from "./helpers/logger";
import {setInitialNonce} from "./helpers/nonce";
import * as path from "path";

export async function reTryWithdrawWithExistingTree() {
    logger.info('reTryWithdrawWithExistingTree started')

    await setInitialNonce()

    console.log(path.dirname(process.argv[1]))

    // @ts-ignore
    const fds = JSON.parse(fs.readFileSync(path.dirname(process.argv[1]) + '/reports/fee-distributors-with-legacy-already-split-amounts2024-10-15T08:21:55.910Z.json'))

    const merkleTreeFilePath = './reports/merkle-tree2024-10-15T08:21:55.910Z.json'

    // @ts-ignore
    const tree = StandardMerkleTree.load(JSON.parse(fs.readFileSync(merkleTreeFilePath)));

    // @ts-ignore
    const feeDistributorsAddresses: string[] = tree.values.map(v => v.value[0])

    logger.info(feeDistributorsAddresses.length + ' feeDistributorsAddresses found in the tree file')

    await withdrawAll(fds, tree)

    logger.info('reTryWithdrawWithExistingTree finished')
}

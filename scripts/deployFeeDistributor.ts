import {ContractTransaction} from "ethers";
import {getNonce, incrementNonce} from "./helpers/nonce";
import { getMatchingFactory } from "./helpers/getMatchingFactory"
import { FeeDistributorInput } from "./models/FeeDistributorInput"

export async function deployFeeDistributor(fd: FeeDistributorInput) {
    const params = fd.identityParams
    if (!params) {
      throw new Error('No identityParams')
    }

    const {factory, referenceFd} = await getMatchingFactory(fd)

    const tx: ContractTransaction = await factory.createFeeDistributor(
        referenceFd,
        params.clientConfig,
        params.referrerConfig, {
            gasLimit: 300000,
            maxFeePerGas: process.env.MAX_FEE_PER_GAS,
            maxPriorityFeePerGas: process.env.MAX_PIORITY_FEE_PER_GAS,
            nonce: getNonce()
        }
    )

    incrementNonce()

    return tx.hash
}

import {ethers} from "ethers";
import { FeeDistributorInput } from "./FeeDistributorInput"

export interface FeeDistributorToWithdraw extends FeeDistributorInput {
    amount: number
    balance: ethers.BigNumber
    newClientBasisPoints: number | null
}

import {FeeDistributorIdentityParams} from "./FeeDistributorIdentityParams";
import { Period } from "./Period"

export interface FeeDistributorInput {
    fdAddress: string
    identityParams: FeeDistributorIdentityParams | null

    periods: Period[]
}

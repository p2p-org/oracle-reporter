import { getFeeDistributorFactoryContractSigned } from "./getFeeDistributorFactoryContract"
import { getFeeDistributorFactoryContractSigned_3_1 } from "./getFeeDistributorFactoryContract_3_1"
import { getFeeDistributorFactoryContractSigned_3_1_SSV } from "./getFeeDistributorFactoryContract_3_1_SSV"
import { FeeDistributorInput } from "../models/FeeDistributorInput"

export async function getMatchingFactory(fd: FeeDistributorInput) {
  if (!process.env.REFERENCE_FEE_DISTRIBUTOR) {
    throw new Error("No REFERENCE_FEE_DISTRIBUTOR in ENV")
  }
  if (!process.env.REFERENCE_FEE_DISTRIBUTOR_3_1) {
    throw new Error("No REFERENCE_FEE_DISTRIBUTOR_3_1 in ENV")
  }
  if (!process.env.REFERENCE_FEE_DISTRIBUTORY_3_1_SSV) {
    throw new Error("No REFERENCE_FEE_DISTRIBUTORY_3_1_SSV in ENV")
  }

  const params = fd.identityParams
  if (!params) {
    throw new Error('No identityParams')
  }

  const factory = getFeeDistributorFactoryContractSigned()
  const feeDistributorAddress: string = await factory.predictFeeDistributorAddress(
    process.env.REFERENCE_FEE_DISTRIBUTOR,
    params.clientConfig,
    params.referrerConfig
  )
  if (feeDistributorAddress.toLowerCase() === fd.fdAddress.toLowerCase()) {
    return {factory, referenceFd: process.env.REFERENCE_FEE_DISTRIBUTOR}
  }

  const factory_3_1 = getFeeDistributorFactoryContractSigned_3_1()
  const feeDistributorAddress_3_1: string = await factory_3_1.predictFeeDistributorAddress(
    process.env.REFERENCE_FEE_DISTRIBUTOR_3_1,
    params.clientConfig,
    params.referrerConfig
  )
  if (feeDistributorAddress_3_1.toLowerCase() === fd.fdAddress.toLowerCase()) {
    return {factory: factory_3_1, referenceFd: process.env.REFERENCE_FEE_DISTRIBUTOR_3_1}
  }

  const factory_3_1_SSV = getFeeDistributorFactoryContractSigned_3_1_SSV()
  const feeDistributorAddress_3_1_SSV: string = await factory_3_1_SSV.predictFeeDistributorAddress(
    process.env.REFERENCE_FEE_DISTRIBUTORY_3_1_SSV,
    params.clientConfig,
    params.referrerConfig
  )
  if (feeDistributorAddress_3_1_SSV.toLowerCase() === fd.fdAddress.toLowerCase()) {
    return {factory: factory_3_1_SSV, referenceFd: process.env.REFERENCE_FEE_DISTRIBUTORY_3_1_SSV}
  }

  throw new Error('No factory matched')
}

type MinEthersFactory<C, ARGS> = {
  deploy(...a: ARGS[]): Promise<C>;
};

export type GetContractTypeFromFactory<F> = F extends MinEthersFactory<infer C, any> ? C : never;
type GetARGsTypeFromFactory<F> = F extends MinEthersFactory<any, any> ? Parameters<F["deploy"]> : never;

type Initializable = { initialize(...a: any[]): Promise<any> };

// returns initialize method arguments type if contract has `initialize` method
// otherwise returns constructor arguments type
export type GetDeployArgsType<T> = GetContractTypeFromFactory<T> extends Initializable
  ? Parameters<GetContractTypeFromFactory<T>["initialize"]>
  : GetARGsTypeFromFactory<T>;

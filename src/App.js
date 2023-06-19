import logo from './logo.svg';
import './App.css';
import { web3Accounts, web3Enable, web3FromAddress , web3ListRpcProviders, web3UseRpcProvider} from '@polkadot/extension-dapp';

import { Keyring } from '@polkadot/keyring';
import { useState } from 'react';
import ABI from './Abi/lottery.json'

import { ApiPromise } from '@polkadot/api';
import { WsProvider } from '@polkadot/rpc-provider';
import { options } from '@astar-network/astar-api';
import { Abi, ContractPromise } from '@polkadot/api-contract'
import BN from "bn.js";

function App() {
  const [getwallet,setwallet]= useState("")
  const address = process.env.CONTRACT_ADDRESS || 'bZ2uiFGTLcYyP8F88XzXa13xu5Mmp13VLiaW1gGn7rzxktc'


  const connectWallet= async()=>{
    const allInjected = await web3Enable('subwallet-js');
    console.log("SubWalletExtension",allInjected[0]);

    const allAccounts = await web3Accounts();
    console.log("SubWallet wallet",allAccounts[0].address);
    if (allAccounts.length > 0) {
      setwallet(allAccounts[0]);
    }

// finds an injector for an address
// const injector = await web3FromAddress(allAccounts[0].address);

// const provider = new WsProvider('wss://rpc.astar.network');//('wss://shiden.api.onfinality.io/public-ws')//('wss://localhost:9944');
// const api = new ApiPromise(options({ provider }));

//       // sets the signer for the address on the @polkadot/api
//       api.setSigner(allInjected[0].signer);

    // const SubWalletExtension = window.injectedWeb3['polkadot-js'];
    // console.log("SubWalletExtension",SubWalletExtension);
    // const extension = await SubWalletExtension.enable();
    // console.log("SubWalletExtension==>",extension);
    // const SubWalletaddr = await extension.accounts().get();
    // console.log("SubWalletaddr==>",SubWalletaddr);
  }

  const contractCall =async()=>{
    const provider = new WsProvider('wss://astar.public.blastapi.io');//('wss://shiden.api.onfinality.io/public-ws')//('wss://localhost:9944');
    const api = new ApiPromise(options({ provider }));
    // initialise via static create
   
    console.log("herein the contract call")
    await api.isReady;
    ///////////////////////////////////////////
    // // query and display account data
    // const data = await api.query.system.account("5En7yhgG9E8vCrnyZMdxc7ToJdYqRyeCzfgjNXoAS8rkG16r")//('5F98oWfz2r5rcRVnP9VCndg33DAAsky3iuoBSpaPUbgN9AJn');
    // console.log("hereRPCCall1==>",data.toHuman())

    //contract call
    console.log("herein the contract call2  ")

    const abi = new Abi(ABI, api.registry.getChainProperties())
    // Initialise the contract class
    const contract = new ContractPromise(api, abi, address)
    
    const gasLimit =
    api.registry.createType(
      'WeightV2',
      api.consts.system.blockWeights['maxBlock']
    )

    //1 call  ............. get
    const { gasRequired, result, output } = await contract.query.getPlayers(
      getwallet.address, // account.address,
      {
        gasLimit: gasLimit,
        // value: new BN('1000000000000000000') // Value sent to method. In this example 1 ASTAR
      }
    )

    console.log("resulttttt",result?.toHuman())
    console.log('gasRequired', gasRequired.toString())
    console.log('output', output?.toHuman())

    //2 call ............ get
    // const { gasRequired, result } = await contract.query.getPlayers(//.pickWinner(
    //   getwallet.address,//account.address,
    //   {
    //     gasLimit,
    //   }
    // )
    // console.log("resulttttt",result?.toHuman())
    // console.log('gasRequired', gasRequired.toString())
    await sendTranscation();
  }

//sending  transaction.......
  const sendTranscation = async()=>{
    const provider = new WsProvider('wss://astar.public.blastapi.io');//('wss://shiden.api.onfinality.io/public-ws')//('wss://localhost:9944');
    const api = new ApiPromise(options({ provider }));
    // initialise via static create
    const allInjected = await web3Enable('subwallet-js');
   
    console.log("inside sendTranscation");
    await api.isReady;

    //setsigner
    api.setSigner(allInjected[0].signer);
    //abi
    const abi = new Abi(ABI, api.registry.getChainProperties())
    // Initialise the contract class
    const contract = new ContractPromise(api, abi, address)
    //gas
    const gasLimit =
    api.registry.createType(
      'WeightV2',
      api.consts.system.blockWeights['maxBlock']
    )
        
        //3 call ............ on blockchain gas
        const { gasRequired, result } = await contract.query.pickWinner(
          getwallet.address,
          {
            gasLimit,
          }
        )
        console.log("resulttttt", result?.toHuman())
        console.log('gasRequired', gasRequired.toString())
        //onchain........
        await contract.tx
        .pickWinner({
          // gasRequired is returned in the dry run step
          gasLimit: gasRequired,  
          // value: new BN('1000000000000000000')
        })
        .signAndSend(getwallet.address, (res) => {
          if (res.status.isInBlock) {
            console.log('in a block')
          }
          if (res.status.isFinalized) {
            console.log('finalized')
          }
        })
  }



  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
      <button onClick={connectWallet}>click me</button>
      <button onClick={contractCall}>scCall</button>
      </header>
    </div>
  );
}

export default App;

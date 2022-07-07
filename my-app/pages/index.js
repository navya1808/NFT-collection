import Head from "next/head";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import styles from "../styles/Home.module.css";
import { Contract, providers, utils} from "ethers";
import Web3Modal from "web3modal";
import { NFT_CONTRACT_ABI, NFT_CONTRACT_ADDRESS } from "../constants";

export default function Home() {
  const [presaleStarted, setPresaleStarted] = useState(false);
  const [walletConected, setWalletConnected] = useState(false);
  const [presaleEnded, setPresaleEnded] = useState(false);
  const [loading , setLoading] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [numTokensMinted , setNumTokensMinted] = useState("");
  const web3ModalRef = useRef();
  
  const getNumMintedTokens = async()=>{
    try{
       const provider = await getProviderOrSigner();
       const nftContract = new Contract(
        NFT_CONTRACT_ADDRESS ,
        NFT_CONTRACT_ABI ,
        provider
       );

       const numTokenIds =await nftContract.tokenIds();
       setNumTokensMinted(numTokenIds.toString());
    }catch(err){
       console.log(err);
    }
  }
  const presaleMint = async () => {
    setLoading(true);
    try{
      const signer = await getProviderOrSigner(true);
      const nftContract = new Contract(
        NFT_CONTRACT_ADDRESS,
        NFT_CONTRACT_ABI,
        signer
      );
  
      const txn = await nftContract.presaleMint({
        value: utils.parseEther("0.01"),
      });
  
      await txn.wait();
      window.alert("You successfully minted a cryptodevs");
    }catch(err){
      console.log(err);
    }
    setLoading(false);
  };

  const publicMint = async () => {
    setLoading(true);
    try{
      const signer = await getProviderOrSigner(true);
      const nftContract = new Contract(
        NFT_CONTRACT_ADDRESS,
        NFT_CONTRACT_ABI,
        signer
      );
  
      const txn = await nftContract.mint({
        value: utils.parseEther("0.01"),
      });
  
      await txn.wait();
      window.alert("You successfully minted a cryptodevs");
    }catch(err){
      console.log(err);
    }
    setLoading(false);
  };

  const getOwner = async () => {
    try {
      const signer = await getProviderOrSigner(true);
      const nftContract = new Contract(
        NFT_CONTRACT_ADDRESS,
        NFT_CONTRACT_ABI,
        signer
      );

      const owner = await nftContract.owner();
      const userAddress = await signer.getAddress();

      if (owner.toLowerCase() === userAddress.toLowerCase()) {
        setIsOwner(true);
      }
    } catch (err) {
      console.log(err);
    }
  };
  const startPresale = async () => {
    setLoading(true);
    try {
      const signer = await getProviderOrSigner(true);
      const nftContract = new Contract(
        NFT_CONTRACT_ADDRESS,
        NFT_CONTRACT_ABI,
        signer
      );
      const txn = await nftContract.startPresale();
      await txn.wait();

      setPresaleStarted(true);
    } catch (err) {
      console.log(err);
    }
    setLoading(false);
  };

  const checkIfPresaleStarted = async () => {
    try {
      const provider = await getProviderOrSigner();

      const nftContract = new Contract(
        NFT_CONTRACT_ADDRESS,
        NFT_CONTRACT_ABI,
        provider
      );
      const isPresaleStarted = await nftContract.presaleStarted();
      setPresaleStarted(isPresaleStarted);
    } catch (err) {
      console.log(err);
    }
  };

  const checkIfPresaleEnded = async () => {
    try {
      const provider = await getProviderOrSigner();
      const nftContract = new Contract(
        NFT_CONTRACT_ADDRESS,
        NFT_CONTRACT_ABI,
        provider
      );

      const presaleEndTime = await nftContract.presaleEnded();
      const currentTimeInSeconds = Date.now() / 1000;
      const hasPresaleEnded = presaleEndTime.lt(
        Math.floor(currentTimeInSeconds)
      );
      setPresaleEnded(hasPresaleEnded);

      return isPresaleStarted;
    } catch (err) {
      console.log(err);
      return false;
    }
  };

  const connectWallet = async () => {
    try {
      await getProviderOrSigner();
      setWalletConnected(true);
    } catch (er) {
      console.log(er);
    }
  };

  const getProviderOrSigner = async (needSigner = false) => {
    const provider = await web3ModalRef.current.connect();
    const web3Provider = new providers.Web3Provider(provider);

    const { chainId } = await web3Provider.getNetwork();
    if (chainId != 4) {
      window.alert("pleasae switch to rinkeby network");
      throw new Error("Incorrect network");
    }

    if (needSigner) {
      const signer = web3Provider.getSigner();
      return signer;
    }
    return web3Provider;
  };

  const onPageLoad = async () => {
    await connectWallet();
    await getOwner();
    const presaleStarted = await checkIfPresaleStarted();
    if (presaleStarted) {
      await checkIfPresaleStarted();
    }

    await getNumMintedTokens();

    setInterval(async() => {
      await getNumMintedTokens()
    } , 5000);

    setInterval(async()=>{
       const presaleStarted = await checkIfPresaleStarted();
       if(presaleStarted){
        await checkIfPresaleEnded();
       }
    } , 5000)
  };

  function renderBody() {
    if (!walletConected) {
      return (
        <button onClick={connectWallet} className={styles.button}>
          Connect Wallet
        </button>
      );
    }
    
    if(loading){
      return (
        <span className={styles.description}>
          loading...
        </span>
      )
    }
    if (isOwner && !presaleStarted) {
      //render a button to start the presale
      return (
        <button onClick={startPresale} className={styles.button}>
          start presale
        </button>
      );
    }

    if (!presaleStarted) {
      //just say that presale hasnt started yet
      return (
        <span className={styles.decription}>
          Presale has not started yet. Come back later!
        </span>
      );
    }

    if (presaleStarted && !presaleEnded) {
      //allow user to mint the presale
      //they should be in a whitelist
      return (
        <div>
          <span className={styles.decription}>
            Presale has started! if your address is whitelisted, you can mint a
            crypto dev
          </span>
          <button onClick={presaleMint} className={styles.button}>
            presale mint
          </button>
        </div>
      );
    }

    if (presaleEnded) {
      //allow user to take part in public sale
      return (
        <div>
          <span className={styles.decription}>
            Presale has ended. You can mint a CryptoDev in public sale, if any
            remain.
          </span>
          <button onClick={publicMint} className={styles.button}>
            public mint
          </button>
        </div>
      );
    }
  }
  useEffect(() => {
    if (!walletConected) {
      web3ModalRef.current = new Web3Modal({
        network: "rinkeby",
        providerOptions: {},
        disableInjectedProvider: false,
      });
    }
    onPageLoad();
  }, [walletConected]);

  return (
    <div>
      <Head>
        <title>Crypto Devs</title>
        <meta name="description" content="Whitelist-Dapp" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className={styles.main}>
        <div>
          <h1 className={styles.title}>Welcome to Crypto Devs!</h1>
          <div className={styles.description}>
            Its an NFT collection for developers in Crypto.
          </div>
          <div className={styles.description}>
            {numTokensMinted}/20 have been minted
          </div>
          <div>{renderBody()}</div>
        </div>
        <div>
          <img className={styles.image} src="../../public/cryptodevs/0.svg" />
        </div>
      </div>

      <footer className={styles.footer}>
        Made with &#10084; by Crypto Devs
      </footer>
    </div>
  );
}

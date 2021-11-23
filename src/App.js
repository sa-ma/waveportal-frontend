import React, { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { abi } from './utils/WavePortal.json';
import './App.css';

const contractAddress = '0xeDC70110062E7c10f118133599675183C466E087';
const contractABI = abi;

export default function App() {
    const [currentAccount, setCurrentAccount] = useState();
    const [allWaves, setAllWaves] = useState([]);
    const [waveMessage, setWaveMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const checkIfWalletIsConnected = async () => {
        try {
            const { ethereum } = window;
            if (!ethereum) {
                console.log('Metamask not found');
                return;
            }
            console.log('Ethereum present', ethereum);

            /*
             * Check if we're authorized to access the user's wallet
             */
            const accounts = await ethereum.request({ method: 'eth_accounts' });

            if (accounts.length !== 0) {
                const account = accounts[0];
                console.log('Found an authorized account:', account);
                setCurrentAccount(account);
            } else {
                console.log('No authorized account found');
            }
        } catch (error) {
            console.log(error);
        }
    };

    /**
     * Implement your connectWallet method here
     */
    const connectWallet = async () => {
        try {
            setError('');
            setLoading(true);
            const { ethereum } = window;

            if (!ethereum) {
                alert('Get MetaMask!');
                return;
            }

            const accounts = await ethereum.request({ method: 'eth_requestAccounts' });

            console.log('Connected', accounts[0]);
            setCurrentAccount(accounts[0]);
        } catch (error) {
            console.log(error);
            setError('Error connecting wallet');
        } finally {
            setLoading(false);
        }
    };

    const getAllWaves = async () => {
        try {
            setLoading(true);
            setError('');
            const { ethereum } = window;
            if (ethereum) {
                const provider = new ethers.providers.Web3Provider(ethereum);
                const signer = provider.getSigner();
                const wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);

                const waves = await wavePortalContract.getAllWaves();

                let wavesCleaned = [];
                waves.forEach((wave) => {
                    wavesCleaned.push({
                        address: wave.waver,
                        timestamp: new Date(wave.timestamp * 1000),
                        message: wave.message,
                    });
                });

                setAllWaves(wavesCleaned);
            } else {
                console.log("Ethereum object doesn't exist!");
            }
        } catch (error) {
            console.log(error);
            setError('Error getting waves');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        checkIfWalletIsConnected();
        getAllWaves();
    }, []);

    useEffect(() => {
        let wavePortalContract;

        const onNewWave = (from, timestamp, message) => {
            console.log('NewWave', from, timestamp, message);
            setAllWaves((prevState) => [
                ...prevState,
                {
                    address: from,
                    timestamp: new Date(timestamp * 1000),
                    message: message,
                },
            ]);
        };

        if (window.ethereum) {
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const signer = provider.getSigner();

            wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);
            wavePortalContract.on('NewWave', onNewWave);
        }

        return () => {
            if (wavePortalContract) {
                wavePortalContract.off('NewWave', onNewWave);
            }
        };
    }, []);

    const wave = async (event) => {
        event.preventDefault();
        try {
            const { ethereum } = window;
            setLoading(true);
            setError('');

            if (ethereum) {
                const provider = new ethers.providers.Web3Provider(ethereum);
                const signer = provider.getSigner();
                const wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);

                let count = await wavePortalContract.getTotalWaves();
                console.log('Retrieved total wave count...', count.toNumber());

                const waveTxn = await wavePortalContract.wave(waveMessage, { gasLimit: 300000 });
                console.log('Mining...', waveTxn.hash);

                await waveTxn.wait();
                console.log('Mined -- ', waveTxn.hash);

                getAllWaves();
            } else {
                console.log("Ethereum object doesn't exist!");
            }
        } catch (error) {
            console.log(error);
            setError('Error sending wave');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className='mainContainer'>
            <div className='dataContainer'>
                <div className='header'>
                    <span role='img' aria-label='hello'>
                        👋
                    </span>{' '}
                    Hey there!
                </div>

                <div className='bio'>
                    I am Sama and this is my first Web3 project.{' '}
                    {!loading && !currentAccount && 'Connect your Ethereum wallet to wave at me!'}
                </div>
                <form onSubmit={wave}>
                    <label htmlFor='message'>
                        <span className='sr-only'>Enter message:</span>
                        <input
                            onChange={(event) => setWaveMessage(event.target.value)}
                            required
                            id='message'
                            type='text'
                            placeholder='Say something nice 🥺'
                        />
                    </label>

                    <button disabled={loading} className='waveButton' type='submit'>
                        <span>Wave at Me</span>{' '}
                        <span role='img' aria-label='hello'>
                            👋
                        </span>
                    </button>
                </form>
                <p className='loading'>{loading && 'Please wait. Processing wave...'}</p>
                <p className='error'>{!loading && error && `${error}. Please try again.`}</p>

                {!currentAccount && (
                    <button onClick={connectWallet} className='waveButton'>
                        Connect Metamask
                    </button>
                )}
                <h3>Total Waves: {allWaves.length}</h3>
                {allWaves && (
                    <ul className='wave-list'>
                        {allWaves.map((wave, index) => (
                            <li key={`${index}-${wave.address}`}>
                                <p>{wave.message}</p>
                                <p className='small'>{wave.address}</p>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}

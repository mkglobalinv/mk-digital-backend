import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, CheckCircle, XCircle, Clock3, Loader2 } from 'lucide-react';
import API from '../api';
import './AirtimeToCash.css';

const NETWORK_LABELS = { MTN: 'MTN', AIRTEL: 'Airtel', GLO: 'Glo', '9MOBILE': '9mobile' };

// Parses a provider balance string like "₦5,000.00" into a plain number for the
// insufficient-balance warning below. Returns null if it can't be parsed --
// the warning is then simply not shown, never guessed.
function parseBalance(balanceStr) {
    if (!balanceStr) return null;
    const num = Number(String(balanceStr).replace(/[^0-9.]/g, ''));
    return Number.isFinite(num) ? num : null;
}

// Steps: form -> otp -> availability -> transfer -> result
export default function AirtimeToCash() {
    const navigate = useNavigate();
    const [step, setStep] = useState('form');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const [config, setConfig] = useState(null);
    const [network, setNetwork] = useState('');
    const [phone, setPhone] = useState('');
    const [amount, setAmount] = useState('');
    const [bankName, setBankName] = useState('');
    const [accountNumber, setAccountNumber] = useState('');

    const [quote, setQuote] = useState(null);
    const [quoteLoading, setQuoteLoading] = useState(false);

    const [tx, setTx] = useState(null);
    const [otp, setOtp] = useState('');
    const [transferPin, setTransferPin] = useState('');

    useEffect(() => {
        API.get('/api/airtime-to-cash/config')
            .then((res) => setConfig(res.data.data))
            .catch(() => setError('Unable to load Airtime-to-Cash right now.'));
    }, []);

    // The backend is the ONLY source of truth for the payout figure -- this effect
    // just displays whatever it returns, it never computes the number itself.
    const fetchQuote = useCallback(async (net, amt) => {
        if (!net || !amt || Number(amt) <= 0) {
            setQuote(null);
            return;
        }
        try {
            setQuoteLoading(true);
            const res = await API.post('/api/airtime-to-cash/quote', { network: net, amount: Number(amt) });
            setQuote(res.data.data);
            setError('');
        } catch (err) {
            setQuote(null);
            setError(err.response?.data?.message || 'Unable to calculate a quote for this amount.');
        } finally {
            setQuoteLoading(false);
        }
    }, []);

    useEffect(() => {
        const t = setTimeout(() => fetchQuote(network, amount), 400);
        return () => clearTimeout(t);
    }, [network, amount, fetchQuote]);

    const enabledNetworks = config?.networks || {};

    const submitDetails = async (e) => {
        e.preventDefault();
        if (!network || !phone || !amount || !bankName || !accountNumber) {
            setError('Please fill in every field.');
            return;
        }
        if (!quote) {
            setError('Please wait for the quote to finish calculating.');
            return;
        }
        try {
            setLoading(true);
            setError('');
            const res = await API.post('/api/airtime-to-cash/otp', { network, phone, amount: Number(amount), bankName, accountNumber });
            setTx(res.data.data);
            if (res.data.data.status === 'OTP_REQUIRED') {
                setStep('otp');
            } else {
                setError(res.data.data.failureReason || 'Could not start this transaction.');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const submitOtp = async (e) => {
        e.preventDefault();
        if (!otp) return;
        try {
            setLoading(true);
            setError('');
            const res = await API.post('/api/airtime-to-cash/verify-otp', { reference: tx.reference, otp });
            setOtp('');
            if (res.data.data.status === 'OTP_VERIFIED') {
                setTx(res.data.data);
                setStep('availability');
                checkAvailability(res.data.data.reference);
            } else {
                setError(res.data.data.failureReason || 'Invalid OTP. Please try again.');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Could not verify OTP.');
        } finally {
            setLoading(false);
        }
    };

    const checkAvailability = async (reference) => {
        try {
            setLoading(true);
            setError('');
            const res = await API.post('/api/airtime-to-cash/check-availability', { reference });
            setTx(res.data.data);
            if (res.data.data.status === 'READY_FOR_TRANSFER') {
                setStep('transfer');
            } else {
                setError(res.data.data.failureReason || 'This recipient is not available right now.');
                setStep('form');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Could not check availability.');
            setStep('form');
        } finally {
            setLoading(false);
        }
    };

    const submitTransfer = async (e) => {
        e.preventDefault();
        if (!transferPin) return;
        try {
            setLoading(true);
            setError('');
            const res = await API.post('/api/airtime-to-cash/transfer', { reference: tx.reference, transferPin });
            setTx(res.data.data);
            setStep('result');
        } catch (err) {
            setError(err.response?.data?.message || 'Transfer failed. Please try again.');
        } finally {
            setLoading(false);
            // Cleared on both success and failure/exception -- the PIN must never
            // remain sitting in component state after the request settles, whatever
            // the outcome.
            setTransferPin('');
        }
    };

    // Clears the PIN whenever the transfer step is left/reset, on top of the
    // unconditional clear in submitTransfer's finally block above (defense in
    // depth -- covers navigating away or resetting before a submit ever happens).
    const clearTransferPin = () => setTransferPin('');

    const stepIndex = { form: 0, otp: 1, availability: 2, transfer: 2, result: 3 }[step];

    return (
        <div className="a2c-page">
            <button className="a2c-back" onClick={() => { clearTransferPin(); navigate(-1); }}><ChevronLeft size={18} /> Back</button>
            <h1>Airtime to Cash</h1>
            <p className="subtitle">Convert your airtime into cash, credited straight to your wallet.</p>

            <div className="a2c-steps">
                {[0, 1, 2, 3].map((i) => <div key={i} className={`dot ${i <= stepIndex ? 'active' : ''}`} />)}
            </div>

            {error && <div className="a2c-error">{error}</div>}

            {tx?.providerAirtimeSnapshot?.balance && (step === 'availability' || step === 'transfer') && (() => {
                const balanceValue = parseBalance(tx.providerAirtimeSnapshot.balance);
                const insufficient = balanceValue !== null && Number(amount) > balanceValue;
                return (
                    <div className={`a2c-sim-balance${insufficient ? ' low' : ''}`}>
                        <span>Your {NETWORK_LABELS[network] || network} SIM balance</span>
                        <strong>{tx.providerAirtimeSnapshot.balance}</strong>
                        {insufficient && <p>This is less than the ₦{amount} you're trying to convert -- the transfer will likely fail. Recharge this SIM first.</p>}
                    </div>
                );
            })()}

            <div className="a2c-panel">
                {step === 'form' && (
                    <form onSubmit={submitDetails}>
                        {!config && !error && (
                            <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 8 }}>Loading available networks...</p>
                        )}
                        <div className="a2c-network-picker">
                            {Object.keys(NETWORK_LABELS).map((net) => (
                                <button
                                    type="button"
                                    key={net}
                                    className={network === net ? 'selected' : ''}
                                    // Stay disabled until config has actually loaded -- a network must
                                    // never be briefly selectable before we know it's really enabled.
                                    // The backend re-validates regardless, but the UI shouldn't offer a
                                    // choice it doesn't yet know is valid.
                                    disabled={!config || !enabledNetworks[net]}
                                    onClick={() => setNetwork(net)}
                                >
                                    {NETWORK_LABELS[net]}
                                </button>
                            ))}
                        </div>

                        <div className="a2c-field">
                            <label>Phone Number (sending the airtime)</label>
                            <input type="tel" placeholder="080XXXXXXXX" value={phone} onChange={(e) => setPhone(e.target.value)} />
                        </div>

                        <div className="a2c-field">
                            <label>Airtime Amount (₦)</label>
                            <input type="number" placeholder="10000" value={amount} onChange={(e) => setAmount(e.target.value)} />
                        </div>

                        {quoteLoading && <p style={{ fontSize: 13, color: '#6b7280' }}>Calculating...</p>}
                        {quote && !quoteLoading && (
                            <div className="a2c-quote-box">
                                <div>Cash You'll Receive</div>
                                <div className="payout">₦{quote.payoutAmount.toLocaleString()}</div>
                                <div className="row"><span>Conversion Rate</span><span>{quote.conversionPercentage}%</span></div>
                                {quote.fixedFee > 0 && <div className="row"><span>Fee</span><span>₦{quote.fixedFee}</span></div>}
                            </div>
                        )}

                        <div className="a2c-field">
                            <label>Bank Name</label>
                            <input value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="e.g. GTBank" />
                        </div>
                        <div className="a2c-field">
                            <label>Account Number</label>
                            <input value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} placeholder="0123456789" />
                        </div>

                        <button className="a2c-btn" type="submit" disabled={loading || !quote}>
                            {loading ? 'Please wait...' : 'Continue'}
                        </button>
                    </form>
                )}

                {step === 'otp' && (
                    <form onSubmit={submitOtp}>
                        <p style={{ fontSize: 14, marginBottom: 16 }}>Enter the OTP sent to <strong>{phone}</strong>.</p>
                        <div className="a2c-field">
                            <input className="a2c-otp-input" maxLength={6} value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} placeholder="------" />
                        </div>
                        <button className="a2c-btn" type="submit" disabled={loading || !otp}>
                            {loading ? 'Verifying...' : 'Verify OTP'}
                        </button>
                    </form>
                )}

                {step === 'availability' && (
                    <div style={{ textAlign: 'center', padding: '24px 0' }}>
                        <Loader2 className="spin" size={32} />
                        <p style={{ marginTop: 12, color: '#6b7280' }}>Checking availability...</p>
                    </div>
                )}

                {step === 'transfer' && quote && (
                    <form onSubmit={submitTransfer}>
                        <div className="a2c-quote-box">
                            <div>You will receive</div>
                            <div className="payout">₦{tx.customerPayoutAmount?.toLocaleString?.() ?? quote.payoutAmount.toLocaleString()}</div>
                        </div>
                        <div className="a2c-field">
                            <label>Airtime Transfer PIN</label>
                            <input type="password" inputMode="numeric" maxLength={6} value={transferPin} onChange={(e) => setTransferPin(e.target.value.replace(/\D/g, ''))} placeholder="Your network's transfer PIN" />
                        </div>
                        <button className="a2c-btn" type="submit" disabled={loading || !transferPin}>
                            {loading ? 'Processing...' : 'Confirm Transfer'}
                        </button>
                    </form>
                )}

                {step === 'result' && tx && (
                    <div className="a2c-result">
                        {tx.status === 'SUCCESS' && (
                            <>
                                <div className="icon success"><CheckCircle size={32} /></div>
                                <h2>₦{tx.customerPayoutAmount} Credited!</h2>
                                <p style={{ color: '#6b7280' }}>Your wallet has been credited. You can withdraw it to your bank anytime from your wallet page.</p>
                                <button className="a2c-btn" onClick={() => navigate('/wallet')}>Go to Wallet</button>
                            </>
                        )}
                        {tx.status === 'MANUAL_REVIEW' && (
                            <>
                                <div className="icon review"><Clock3 size={32} /></div>
                                <h2>Processing</h2>
                                <p style={{ color: '#6b7280' }}>We're confirming this transaction with the network. You'll be notified as soon as it's credited — no need to try again.</p>
                                <button className="a2c-btn secondary" onClick={() => navigate('/transactions')}>View Transactions</button>
                            </>
                        )}
                        {tx.status === 'FAILED' && (
                            <>
                                <div className="icon failed"><XCircle size={32} /></div>
                                <h2>Transfer Failed</h2>
                                <p style={{ color: '#6b7280' }}>{tx.failureReason || 'Please try again.'}</p>
                                <button className="a2c-btn" onClick={() => { clearTransferPin(); setStep('form'); setTx(null); setError(''); }}>Try Again</button>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

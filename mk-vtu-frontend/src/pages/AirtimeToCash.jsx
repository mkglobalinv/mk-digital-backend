import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, CheckCircle, XCircle, Clock3, Loader2, Eye, EyeOff, Check } from 'lucide-react';
import API from '../api';
import './AirtimeToCash.css';

const NETWORK_STYLES = {
    MTN: { label: 'MTN', bg: '#FFCB05', color: '#1a1a1a' },
    AIRTEL: { label: 'airtel', bg: '#ED1C24', color: '#ffffff' },
    GLO: { label: 'glo', bg: '#00A651', color: '#ffffff' },
    '9MOBILE': { label: '9mobile', bg: '#00A99D', color: '#ffffff' }
};
// Parses a provider balance string like "₦5,000.00" into a plain number for the
// insufficient-balance warning below. Returns null if it can't be parsed --
// the warning is then simply not shown, never guessed.
function parseBalance(balanceStr) {
    if (!balanceStr) return null;
    const num = Number(String(balanceStr).replace(/[^0-9.]/g, ''));
    return Number.isFinite(num) ? num : null;
}

// Steps: form -> otp -> checking -> confirm. A separate `result` (not a step) drives
// the outcome as a modal overlaid on top of `confirm`, rather than replacing the
// screen -- once a transfer settles, the underlying network/phone/PIN screen stays
// visible behind the modal.
export default function AirtimeToCash() {
    const navigate = useNavigate();
    const [step, setStep] = useState('form');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const [config, setConfig] = useState(null);
    const [recentNumbers, setRecentNumbers] = useState({ myNumber: null, recent: [] });
    const [network, setNetwork] = useState('');
    const [phone, setPhone] = useState('');
    const [amount, setAmount] = useState('');

    const [quote, setQuote] = useState(null);
    const [quoteLoading, setQuoteLoading] = useState(false);

    const [tx, setTx] = useState(null);
    const [otp, setOtp] = useState('');
    const [transferPin, setTransferPin] = useState('');
    const [showPin, setShowPin] = useState(false);
    const [showPinHelp, setShowPinHelp] = useState(false);
    const [result, setResult] = useState(null); // set only once a transfer settles -- drives the modal

    useEffect(() => {
        API.get('/api/airtime-to-cash/config')
            .then((res) => setConfig(res.data.data))
            .catch(() => setError('Unable to load Airtime-to-Cash right now.'));
        API.get('/api/airtime-to-cash/recent-numbers')
            .then((res) => setRecentNumbers(res.data.data))
            .catch(() => {});
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

    const resetToStart = () => {
        setStep('form');
        setTx(null);
        setResult(null);
        setError('');
        setOtp('');
        setTransferPin('');
        setShowPin(false);
        setAmount('');
    };

    const submitDetails = async (e) => {
        e.preventDefault();
        if (!network || !phone || !amount) {
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
            const res = await API.post('/api/airtime-to-cash/otp', { network, phone, amount: Number(amount) });
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
                setStep('checking');
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
                setStep('confirm');
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
            setResult(res.data.data);
        } catch (err) {
            setError(err.response?.data?.message || 'Transfer failed. Please try again.');
        } finally {
            setLoading(false);
            // Cleared on both success and failure/exception -- the PIN must never
            // remain sitting in component state after the request settles, whatever
            // the outcome.
            setTransferPin('');
            setShowPin(false);
        }
    };

    // Clears the PIN whenever the transfer step is left/reset, on top of the
    // unconditional clear in submitTransfer's finally block above (defense in
    // depth -- covers navigating away or resetting before a submit ever happens).
    const clearTransferPin = () => { setTransferPin(''); setShowPin(false); };

    const stepIndex = { form: 0, otp: 1, checking: 2, confirm: 2 }[step];
    const balanceValue = parseBalance(tx?.providerAirtimeSnapshot?.balance);
    const insufficientBalance = balanceValue !== null && Number(amount) > balanceValue;

    return (
        <div className="a2c-page">
            <button className="a2c-back" onClick={() => { clearTransferPin(); navigate(-1); }}><ChevronLeft size={18} /> Back</button>
            <h1>Airtime to Cash</h1>
            <p className="subtitle">Convert your airtime into cash, credited straight to your wallet.</p>

            <div className="a2c-steps">
                {[0, 1, 2, 3].map((i) => <div key={i} className={`dot ${i <= stepIndex ? 'active' : ''}`} />)}
            </div>

            {error && <div className="a2c-error">{error}</div>}

            <div className={`a2c-panel${result ? ' dimmed' : ''}`}>
                {step === 'form' && (
                    <form onSubmit={submitDetails}>
                        {!config && !error && (
                            <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 8 }}>Loading available networks...</p>
                        )}
                        <label className="a2c-section-label">Select Network Provider</label>
                        <div className="a2c-network-picker">
                            {Object.keys(NETWORK_STYLES).map((net) => {
                                const style = NETWORK_STYLES[net];
                                const selected = network === net;
                                return (
                                    <button
                                        type="button"
                                        key={net}
                                        className={`a2c-network-tile${selected ? ' selected' : ''}`}
                                        style={{ background: style.bg, color: style.color }}
                                        // Stay disabled until config has actually loaded -- a network must
                                        // never be briefly selectable before we know it's really enabled.
                                        // The backend re-validates regardless, but the UI shouldn't offer a
                                        // choice it doesn't yet know is valid.
                                        disabled={!config || !enabledNetworks[net]}
                                        onClick={() => setNetwork(net)}
                                    >
                                        {selected && <span className="a2c-network-check"><Check size={12} /></span>}
                                        {style.label}
                                    </button>
                                );
                            })}
                        </div>

                        {(recentNumbers.myNumber || recentNumbers.recent.length > 0) && (
                            <>
                                <label className="a2c-section-label">Recently Used</label>
                                <div className="a2c-recent-numbers">
                                    {recentNumbers.myNumber && (
                                        <button type="button" className="a2c-recent-chip" onClick={() => setPhone(recentNumbers.myNumber)}>
                                            <span className="avatar">☺</span>
                                            My Number
                                        </button>
                                    )}
                                    {recentNumbers.recent.map((num) => (
                                        <button type="button" key={num} className="a2c-recent-chip" onClick={() => setPhone(num)}>
                                            <span className="avatar">☺</span>
                                            {num}
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}

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
                            <p className="a2c-inline-hint">You will receive <strong>₦{quote.payoutAmount.toLocaleString()}</strong> ({quote.conversionPercentage}% rate{quote.fixedFee > 0 ? ` + ₦${quote.fixedFee} fee` : ''})</p>
                        )}

                        <button className="a2c-btn" type="submit" disabled={loading || !quote}>
                            {loading ? 'Please wait...' : 'Continue'}
                        </button>
                    </form>
                )}

                {step === 'otp' && (
                    <form onSubmit={submitOtp} className="a2c-otp-step">
                        <p className="a2c-otp-sub">Enter the OTP sent to <strong>{phone}</strong>.</p>
                        <div className="a2c-field">
                            <input className="a2c-otp-input" maxLength={6} value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} placeholder="------" autoFocus />
                        </div>
                        <button className="a2c-btn" type="submit" disabled={loading || !otp}>
                            {loading ? 'Verifying...' : 'Verify OTP'}
                        </button>
                    </form>
                )}

                {step === 'checking' && (
                    <div style={{ textAlign: 'center', padding: '24px 0' }}>
                        <Loader2 className="spin" size={32} />
                        <p style={{ marginTop: 12, color: '#6b7280' }}>Checking availability...</p>
                    </div>
                )}

                {step === 'confirm' && (
                    <form onSubmit={submitTransfer}>
                        <div className="a2c-balance-card">
                            <div className="a2c-balance-network" style={{ background: NETWORK_STYLES[network]?.bg, color: NETWORK_STYLES[network]?.color }}>
                                {NETWORK_STYLES[network]?.label}
                            </div>
                            <div className="a2c-balance-info">
                                <div className="phone">{phone}</div>
                                {tx?.providerAirtimeSnapshot?.balance && (
                                    <div className={`balance${insufficientBalance ? ' low' : ''}`}>Balance: <strong>{tx.providerAirtimeSnapshot.balance}</strong></div>
                                )}
                            </div>
                            <button type="button" className="a2c-change-btn" onClick={resetToStart}>Change</button>
                        </div>
                        {insufficientBalance && (
                            <p className="a2c-error" style={{ marginTop: -4 }}>This SIM's balance is less than the ₦{amount} you're converting -- the transfer will likely fail. Recharge this SIM first.</p>
                        )}

                        <p className="a2c-inline-hint">
                            Converting ₦{Number(amount).toLocaleString()} → You will receive <strong>₦{(tx?.customerPayoutAmount ?? quote?.payoutAmount ?? 0).toLocaleString()}</strong>
                        </p>

                        <div className="a2c-field">
                            <label>Airtime Transfer PIN</label>
                            <div className="a2c-pin-wrap">
                                <input
                                    type={showPin ? 'text' : 'password'}
                                    inputMode="numeric"
                                    maxLength={6}
                                    value={transferPin}
                                    onChange={(e) => setTransferPin(e.target.value.replace(/\D/g, ''))}
                                    placeholder="Your network's transfer PIN"
                                />
                                <button type="button" className="a2c-pin-toggle" onClick={() => setShowPin((s) => !s)} aria-label={showPin ? 'Hide PIN' : 'Show PIN'}>
                                    {showPin ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                            <button type="button" className="a2c-pin-help-link" onClick={() => setShowPinHelp((s) => !s)}>What is Transfer PIN?</button>
                            {showPinHelp && (
                                <p className="a2c-pin-help-text">This is the airtime transfer/share PIN set with your network for sending airtime to another number -- it's separate from your 9jaSub PIN.</p>
                            )}
                        </div>

                        <button className="a2c-btn" type="submit" disabled={loading || !transferPin}>
                            {loading ? 'Processing...' : 'Confirm Transfer'}
                        </button>
                    </form>
                )}
            </div>

            {result && (
                <div className="a2c-modal-backdrop">
                    <div className="a2c-modal">
                        {result.status === 'SUCCESS' && (
                            <>
                                <div className="icon success"><CheckCircle size={32} /></div>
                                <h2>Transaction Successful</h2>
                                <p style={{ color: '#6b7280' }}>Wallet successfully funded with ₦{result.customerPayoutAmount}</p>
                                <p className="a2c-modal-question">Do you want to perform another transaction?</p>
                                <div className="a2c-modal-actions">
                                    <button className="a2c-btn secondary" onClick={() => navigate('/wallet')}>No, I'm done</button>
                                    <button className="a2c-btn" onClick={resetToStart}>Yes, Continue</button>
                                </div>
                            </>
                        )}
                        {result.status === 'MANUAL_REVIEW' && (
                            <>
                                <div className="icon review"><Clock3 size={32} /></div>
                                <h2>Processing</h2>
                                <p style={{ color: '#6b7280' }}>We're confirming this transaction with the network. You'll be notified as soon as it's credited — no need to try again.</p>
                                <button className="a2c-btn secondary" onClick={() => navigate('/transactions')}>View Transactions</button>
                            </>
                        )}
                        {result.status === 'FAILED' && (
                            <>
                                <div className="icon failed"><XCircle size={32} /></div>
                                <h2>Transfer Failed</h2>
                                <p style={{ color: '#6b7280' }}>{result.failureReason || 'Please try again.'}</p>
                                <button className="a2c-btn" onClick={resetToStart}>Try Again</button>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

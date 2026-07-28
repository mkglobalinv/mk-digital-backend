import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Zap, Loader2, ShieldAlert, CheckCircle, Share2, Download, Copy, Lock, Fingerprint, ShieldCheck, X } from 'lucide-react';
import API from '../api';
import { isBiometricAvailable, authenticateBiometric } from '../services/biometricService';
import { isActiveReseller, isPremiumReseller, checkBannerVisibility } from '../utils/bannerHelper';
import { useTransactionBanner } from '../context/TransactionBannerContext';
import './Purchase.css';
import logo from '../assets/9jasub.jpg';

const Purchase = ({ token, user, refreshUser, siteInfo }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { startProcessing, updateStatus, clearBanner } = useTransactionBanner();
  
  const [banners, setBanners] = useState([]);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const [activeTab, setActiveTab] = useState('airtime'); 
  const [network, setNetwork] = useState('');
  const [phone, setPhone] = useState('');
  const [amount, setAmount] = useState('');
  const [dataPlan, setDataPlan] = useState('');
  const [dataPlanNetworkId, setDataPlanNetworkId] = useState(''); 
  const [fetchingPlans, setFetchingPlans] = useState(false);
  const [dataCategory, setDataCategory] = useState('all'); // 'all', 'SME', 'Corporate', 'Gifting', 'Direct'
  const [dataPlans, setDataPlans] = useState([]);
  const [airtimeOption, setAirtimeOption] = useState('smart'); // kept for airtime
  const [dataOption, setDataOption] = useState('smart');
  const [publicCategories, setPublicCategories] = useState([]);

  
  // Cable state
  const [cableId, setCableId] = useState('');
  const [packageId, setPackageId] = useState('');
  const [smartcard, setSmartCard] = useState('');
  const [cablePlans, setCablePlans] = useState([]);
  const [fetchingCablePlans, setFetchingCablePlans] = useState(false);
  
  // Electricity state
  const [discoId, setDiscoId] = useState('');
  const [meterType, setMeterType] = useState('01'); // 01 Prepaid default
  const [meterNumber, setMeterNumber] = useState('');
  
  // EPIN state
  const [epinValue, setEpinValue] = useState('100');
  const [quantity, setQuantity] = useState('1');
  
  // Education state
  const [examType, setEexamType] = useState('waecdirect');

  // International state
  const [isInternational, setIsInternational] = useState(false);
  const [countryCode, setCountryCode] = useState('NG');
  const [operators, setOperators] = useState([]);
  const [operatorId, setOperatorId] = useState('');
  const [fetchingOperators, setFetchingOperators] = useState(false);

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null); 
  const [resultToken, setResultToken] = useState(null);

  const [showPinModal, setShowPinModal] = useState(false);
  const [transactionPin, setTransactionPin] = useState('');
  const [receiptData, setReceiptData] = useState(null);
  const [biometricSupported, setBiometricSupported] = useState(false);
  const [biometricLoading, setBiometricLoading] = useState(false);

  useEffect(() => {
    isBiometricAvailable().then(supported => setBiometricSupported(supported));
  }, []);

  useEffect(() => {
    const isResellerCustomer = !!siteInfo;
    const url = isResellerCustomer 
      ? '/api/content?activeOnly=true&platform=global' 
      : '/api/content?activeOnly=true';
      
    API.get(url)
      .then(res => {
        const data = res.data || [];
        setBanners(data.filter(c => c.type === 'banner'));
      })
      .catch(() => {});
      
    // Fetch public data categories control
    API.get('/api/data-categories/public')
      .then(res => {
        setPublicCategories(res.data.data || []);
      })
      .catch(err => console.error("Error fetching data categories", err));
  }, [siteInfo]);

  const visibleBanners = banners.filter(banner => checkBannerVisibility(banner, user));

  useEffect(() => {
    if (visibleBanners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentBannerIndex(prev => (prev + 1) % visibleBanners.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [visibleBanners.length]);

  const handleLinkClick = (banner) => {
    if (!banner.link) return;
    const url = banner.link;
    if (url.startsWith('http://') || url.startsWith('https://')) {
      window.open(url, '_blank', 'noopener,noreferrer');
    } else {
      navigate(url.startsWith('/') ? url : '/' + url);
    }
  };

  useEffect(() => {
    if (location.state?.defaultTab) {
      setActiveTab(location.state.defaultTab);
    }
    if (location.state?.autofill) {
      const af = location.state.autofill;
      if (af.network) setNetwork(af.network);
      if (af.phone) setPhone(af.phone);
      if (af.amount) setAmount(af.amount);
      if (af.dataPlan) setDataPlan(af.dataPlan);
    }
  }, [location]);

  useEffect(() => {
    // Auto-detect network based on phone number prefix (Nigeria ONLY)
    if (!isInternational && activeTab !== 'cable' && activeTab !== 'electricity' && activeTab !== 'education' && phone.length >= 4) {
        const prefix = phone.substring(0, 4);
        const mtnPrefixes = ['0803','0806','0810','0813','0814','0816','0903','0906','0913','0916','0703','0706'];
        const airtelPrefixes = ['0802','0808','0812','0902','0907','0901','0912','0701','0708'];
        const gloPrefixes = ['0805','0807','0811','0815','0905','0915','0705'];
        const mobile9Prefixes = ['0809','0817','0818','0908','0909'];

        if (mtnPrefixes.includes(prefix)) setNetwork('MTN');
        else if (airtelPrefixes.includes(prefix)) setNetwork('AIRTEL');
        else if (gloPrefixes.includes(prefix)) setNetwork('GLO');
        else if (mobile9Prefixes.includes(prefix)) setNetwork('9MOBILE');
    }
  }, [phone, activeTab, isInternational]);

  // Fetch Operators for International
  useEffect(() => {
    if (isInternational && countryCode && (activeTab === 'airtime' || activeTab === 'data')) {
      setOperators([]);
      setOperatorId('');
      fetchOperators();
    }
  }, [countryCode, activeTab, isInternational]);


  // Fetch Data Plans
  useEffect(() => {
    if (!isInternational && activeTab === 'data' && network) {
      setDataPlan(''); // Reset plan selection on network change
      setDataCategory('all'); // Reset category selection on network change
      setAmount('');
      fetchDataPlans();
    }
  }, [network, activeTab, isInternational]);

  // Re-filter plans when category changes (no extra fetch needed)
  useEffect(() => {
    setDataPlan('');
    setAmount('');
  }, [dataCategory]);

  useEffect(() => {
    if (activeTab === 'cable' && cablePlans.length === 0) {
      setFetchingCablePlans(true);
      API.get('/api/vtu/cable/plans')
        .then(res => {
            if (res.data && res.data.plans) {
                setCablePlans(res.data.plans);
            }
        })
        .catch(err => console.error("Error fetching cable plans:", err))
        .finally(() => setFetchingCablePlans(false));
    }
  }, [activeTab]);

  const fetchDataPlans = async () => {
    if (!network) return;

    setFetchingPlans(true);
    console.log(`[Data] Fetching plans for ${network}...`);
    try {
      const res = await API.get(`/api/vtu/data-plans/${network}`);
      const plans = res.data || [];
      console.log(`[Data] Received ${plans.length} plans`);
      setDataPlans(plans);

      // Auto-reset selection if current selection not in new list
      if (dataPlan && !plans.find(p => String(p.plan_code) === String(dataPlan))) {
        setDataPlan('');
        setAmount('');
      }
    } catch (err) {
      console.error("[Data] Error fetching plans:", err);
      setDataPlans([]);
    } finally {
      setFetchingPlans(false);
    }
  };


  const handlePlanChange = (val) => {
    const planCode = typeof val === 'string' || typeof val === 'number' ? val : val.target.value;
    console.log(`[Data] Plan Selected: ${planCode}`);

    const selected = dataPlans.find(p => String(p.plan_code) === String(planCode));
    if (selected) {
      // Check maintenance status
      const catName = selected.category || 'Direct';
      const compositeName = `${network} ${catName}`;
      // Find the specific category control for this plan's provider
      const catConfig = publicCategories.find(c => 
        c.category_name.toLowerCase() === compositeName.toLowerCase() && 
        c.provider_name.toLowerCase() === (selected.provider || '').toLowerCase()
      );
      if (catConfig && catConfig.status === 'MAINTENANCE') {
        const msg = catConfig.maintenance_message || "This category is currently under maintenance. Please try another.";
        setStatus({ type: 'failed', msg });
        setDataPlan('');
        setAmount('');
        return;
      }
      
      setDataPlan(planCode);
      console.log(`[Data] Auto-filling amount: ${selected.price}`);
      setAmount(selected.price);
      setDataPlanNetworkId(selected.network_id || '');
      
      // Auto-trigger confirmation if phone is present
      if (phone && phone.length >= 10 && network) {
        setShowPinModal(true);
        setTransactionPin('');
      }
    } else {
      setAmount('');
      setDataPlanNetworkId('');
    }
  };


  const fetchOperators = async () => {
    setFetchingOperators(true);
    try {
      // We'll need a backend endpoint to proxy this since Reloadly keys are on backend
      const res = await API.get(`/api/reloadly/operators/${countryCode}`, { headers: { Authorization: token } });
      setOperators(res.data);
      if (res.data.length > 0) setOperatorId(res.data[0].operatorId);
    } catch (err) {
      console.error("Error fetching operators:", err);
    } finally {
      setFetchingOperators(false);
    }
  };

  const networks = [
    { id: 'MTN', class: 'net-mtn', label: 'MTN' },
    { id: 'GLO', class: 'net-glo', label: 'GLO' },
    { id: 'AIRTEL', class: 'net-airtel', label: 'AIRTEL' },
    { id: '9MOBILE', class: 'net-9mobile', label: '9MOBILE' },
  ];

  const initiatePurchase = async (e) => {
    e.preventDefault();
    
    if (isInternational) {
        setLoading(true);
        try {
            await API.post('/api/international/track', { 
                serviceType: activeTab, 
                country: countryCode 
            }, { headers: { Authorization: token } });
            setStatus({ type: 'success', msg: "International services are coming soon. Stay tuned!" });
        } catch (err) {
            setStatus({ type: 'success', msg: "International services are coming soon. Stay tuned!" });
        } finally {
            setLoading(false);
        }
        return;
    }

    setStatus(null);
    setResultToken(null);
    setReceiptData(null);
    clearBanner();
    setShowPinModal(true);
    setTransactionPin('');
  };


  const confirmPurchase = async (bioData = null) => {
    if (!bioData && (!transactionPin || transactionPin.length !== 4)) return alert("Enter a valid 4-digit PIN");
    setShowPinModal(false);
    setLoading(true);
    startProcessing(`Processing ${activeTab} purchase... Please wait.`);

    try {
      let res;
      let rData = { type: activeTab, date: new Date().toLocaleString() };
      const commonPayload = { transactionPin, biometricData: bioData };

      if (activeTab === 'airtime') {
        if (!isInternational && (!network || !amount || !phone)) throw new Error("Missing airtime details");
        if (isInternational && (!countryCode || !operatorId || !amount || !phone)) throw new Error("Missing international airtime details");
        
        res = await API.post('/api/retail/purchase/buy-airtime', { 
            ...commonPayload,
            network, 
            phone, 
            amount: Number(amount), 
            countryCode: isInternational ? countryCode : 'NG',
            operatorId: isInternational ? operatorId : null,
            option: 'smart' // Force smart (Peyflex) for airtime
        }, { headers: { Authorization: token } });
        rData.desc = isInternational ? `Intl Airtime to ${phone}` : `${network} Airtime to ${phone}`;
        rData.amount = amount;
      } 
      else if (activeTab === 'data') {
        if (!isInternational && (!network || !dataPlan || !phone)) throw new Error("Missing data details");
        if (isInternational && (!countryCode || !operatorId || !amount || !phone)) throw new Error("Missing international data details");

        console.log(`[Data] Initiating purchase: ${network} | ${dataPlan} | ${phone} | Category: ${dataCategory}`);
        const dataPayload = { 
            ...commonPayload,
            network, 
            phone, 
            plan_code: dataPlan, 
            plan_id: dataPlan, 
            service: "data",
            network_id: dataPlanNetworkId,
            countryCode: isInternational ? countryCode : 'NG',
            operatorId: isInternational ? operatorId : null,
            category: dataCategory,
            option: dataOption // Backend uses smart (Peyflex) or value (ClubKonnect)
        };

        dataPayload.amount = Number(amount);

        res = await API.post('/api/vtu/data/purchase', dataPayload, { headers: { Authorization: token } });
        rData.desc = isInternational ? `Intl Data to ${phone}` : `${network} ${dataPlan} Data to ${phone}`;
        rData.amount = amount || 0;
      }
      else if (activeTab === 'cable') {
        if (!cableId || !packageId || !smartcard || !phone || !amount) throw new Error("Missing cable details");
        res = await API.post('/api/retail/purchase/buy-cable', { ...commonPayload, cableId, packageId, smartcard, phone, amount: Number(amount) }, { headers: { Authorization: token } }); 
        rData.desc = `Cable TV ${cableId} (${smartcard})`;
        rData.amount = amount;
      }
      else if (activeTab === 'electricity') {
        if (!discoId || !meterNumber || !amount || !phone) throw new Error("Missing electricity details");
        res = await API.post('/api/retail/purchase/buy-electricity', { ...commonPayload, discoId, meterType, meterNumber, phone, amount: Number(amount) }, { headers: { Authorization: token } });
        rData.desc = `Electricity ${discoId} (${meterNumber})`;
        rData.amount = amount;
        if (res.data.token) {
            setResultToken(`Meter Token: ${res.data.token}`);
            rData.token = res.data.token;
        }
      }
      else if (activeTab === 'epin') {
        if (!network || !epinValue || !quantity) throw new Error("Missing EPIN details");
        const totalAmount = Number(epinValue) * Number(quantity);
        res = await API.post('/api/retail/purchase/buy-epin', { ...commonPayload, network, amount: totalAmount, quantity: Number(quantity) }, { headers: { Authorization: token } });
        rData.desc = `${network} EPIN (Qty: ${quantity})`;
        rData.amount = totalAmount;
        if (res.data.token) {
            setResultToken(`EPINs: ${res.data.token}`);
            rData.token = res.data.token;
        }
      }
      else if (activeTab === 'education') {
        if (!examType || !phone) throw new Error("Missing education details");
        res = await API.post('/api/retail/purchase/buy-education', { ...commonPayload, examType, phone, amount: 2000 }, { headers: { Authorization: token } }); 
        rData.desc = `Education PIN ${examType}`;
        rData.amount = 2000;
        if (res.data.token) {
            setResultToken(`PIN/Serial: ${res.data.token}`);
            rData.token = res.data.token;
        }
      }

      setReceiptData({ 
          ...rData, 
          reference: res.data.reference || `TXN-${Date.now()}`,
          status: res.data.status // Pass status to receipt
      });
      
      if (res.data.status === 'pending') {
          updateStatus('success', res.data.message || 'Transaction is being processed. Please check history for status.');
      } else {
          updateStatus('success', res.data.message || 'Transaction successful!');
      }
      
      // Refresh user balance immediately without full reload
      if (typeof refreshUser === 'function') refreshUser();
      
    } catch (err) {
      updateStatus('failed', err.response?.data?.message || err.message || 'Something went wrong, please try again');
    } finally {
      setLoading(false);
    }
  };

  const handleShareWhatsApp = () => {
      if (!receiptData) return;
      const text = `*9JASUB RECEIPT*%0A*Transaction:* ${receiptData.desc}%0A*Amount:* ₦${receiptData.amount}%0A*Date:* ${receiptData.date}%0A*Status:* SUCCESS%0A${receiptData.token ? `*Token/PIN:* ${receiptData.token}%0A` : ''}%0AThank you for using 9JASUB!`;
      window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const renderActiveForm = () => {
    switch (activeTab) {
      case 'airtime':
      case 'data':
        return (
          <>
            {(activeTab === 'airtime' || activeTab === 'data') && (
              <div className="purchase-input-group" style={{ marginBottom: '15px' }}>
                <div style={{ display: 'flex', background: 'rgba(0,0,0,0.05)', borderRadius: '10px', padding: '4px' }}>
                  <button 
                    type="button"
                    onClick={() => { setIsInternational(false); setCountryCode('NG'); }}
                    style={{ flex: 1, padding: '8px', border: 'none', borderRadius: '8px', background: !isInternational ? '#fff' : 'transparent', fontWeight: 'bold', cursor: 'pointer' }}
                  >
                    Local (Nigeria)
                  </button>
                  <button 
                    type="button"
                    onClick={() => setIsInternational(true)}
                    style={{ flex: 1, padding: '8px', border: 'none', borderRadius: '8px', background: isInternational ? '#fff' : 'transparent', fontWeight: 'bold', cursor: 'pointer' }}
                  >
                    International
                  </button>
                </div>
              </div>
            )}

            {!isInternational ? (
              <>
                <div className="purchase-input-group">
                  <label>Select Network Provider</label>
                  <div className="network-grid">
                    {networks.map(net => (
                      <div key={net.id} className={`network-item ${net.class} ${network === net.id ? 'selected' : ''}`} onClick={() => setNetwork(net.id)}>
                        {net.label}
                      </div>
                    ))}
                  </div>
                </div>

                {/* OPay-style Category Chips for Data */}
                {activeTab === 'data' && network && (
                  <>
                  <div className="purchase-input-group">
                    <label style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Routing Option</label>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button
                        type="button"
                        onClick={() => setDataOption('smart')}
                        style={{ flex: 1, padding: '10px', borderRadius: '10px', border: dataOption === 'smart' ? '2px solid var(--primary)' : '1px solid #ddd', background: dataOption === 'smart' ? 'rgba(var(--primary-rgb), 0.1)' : '#fff', fontWeight: 'bold', cursor: 'pointer', color: dataOption === 'smart' ? 'var(--primary)' : '#666' }}
                      >
                        Smart Option
                      </button>
                      <button
                        type="button"
                        onClick={() => setDataOption('value')}
                        style={{ flex: 1, padding: '10px', borderRadius: '10px', border: dataOption === 'value' ? '2px solid var(--primary)' : '1px solid #ddd', background: dataOption === 'value' ? 'rgba(var(--primary-rgb), 0.1)' : '#fff', fontWeight: 'bold', cursor: 'pointer', color: dataOption === 'value' ? 'var(--primary)' : '#666' }}
                      >
                        Value Option
                      </button>
                    </div>
                  </div>
                  <div className="purchase-input-group">
                    <label style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Data Category</label>
                    <div className="data-category-chips">
                      {['all', ...new Set(dataPlans
                        .filter(p => dataOption === 'smart' ? (p.provider === 'peyflex' || p.provider === 'connectbridge') : p.provider === 'clubkonnect')
                        .map(p => p.category || 'Direct')
                      )]
                      .filter(catId => {
                        // Hide DISABLED/HIDDEN categories
                        if (catId === 'all') return true;
                        const compositeName = `${network} ${catId}`;
                        // We check if ANY provider matching the current dataOption has this category as ACTIVE/VISIBLE
                        const matchingProviders = dataOption === 'smart' ? ['peyflex', 'connectbridge'] : ['clubkonnect'];
                        const configs = publicCategories.filter(c => 
                          c.category_name.toLowerCase() === compositeName.toLowerCase() && 
                          matchingProviders.includes(c.provider_name.toLowerCase())
                        );
                        
                        // If all configs for this category in the selected providers are HIDDEN, hide the chip
                        if (configs.length > 0 && configs.every(c => c.visibility === 'HIDDEN' || c.status === 'DISABLED')) return false;
                        return true;
                      })
                      .map(catId => {
                        const isAll = catId === 'all';
                        const label = isAll ? 'All Plans' : catId;
                        const cls = isAll ? 'chip-all' : 'chip-direct';
                        
                        // Check if maintenance
                        const compositeName = `${network} ${catId}`;
                        const matchingProviders = dataOption === 'smart' ? ['peyflex', 'connectbridge'] : ['clubkonnect'];
                        const configs = publicCategories.filter(c => 
                          c.category_name.toLowerCase() === compositeName.toLowerCase() && 
                          matchingProviders.includes(c.provider_name.toLowerCase())
                        );
                        
                        // If all available configs are maintenance, mark the chip as maintenance
                        const isMaintenance = configs.length > 0 && configs.every(c => c.status === 'MAINTENANCE');
                        
                        // Use the first available maintenance message
                        const maintenanceMessage = isMaintenance ? configs[0].maintenance_message : null;
                        
                        return (
                          <button
                            key={catId}
                            type="button"
                            className={`category-chip ${cls} ${dataCategory.toLowerCase() === catId.toLowerCase() ? 'active' : ''} ${isMaintenance ? 'maintenance-chip' : ''}`}
                            onClick={() => { 
                              if (isMaintenance) {
                                alert(maintenanceMessage || "This category is currently under maintenance.");
                              }
                              setDataCategory(catId); 
                              setDataPlan(''); 
                              setAmount(''); 
                            }}
                          >
                            {label} {isMaintenance && <ShieldAlert size={12} style={{marginLeft: 4, display: 'inline'}} />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  </>
                )}
              </>
            ) : (

              <>
                <div className="purchase-input-group">
                  <label>Select Country</label>
                  <select className="purchase-input" value={countryCode} onChange={(e) => setCountryCode(e.target.value)} required>
                    <option value="NG">Nigeria (+234)</option>
                    <option value="GH">Ghana (+233)</option>
                    <option value="KE">Kenya (+254)</option>
                    <option value="ZA">South Africa (+27)</option>
                    <option value="US">USA (+1)</option>
                    <option value="GB">UK (+44)</option>
                    <option value="CA">Canada (+1)</option>
                    <option value="BJ">Benin (+229)</option>
                    <option value="CI">Ivory Coast (+225)</option>
                    <option value="CM">Cameroon (+237)</option>
                  </select>
                </div>
                <div className="purchase-input-group">
                  <label>Select Operator {fetchingOperators && <img src={logo} alt="Loading" className="btn-logo-loader" style={{ display: 'inline', width: '16px', height: '16px' }} />}</label>
                  <select className="purchase-input" value={operatorId} onChange={(e) => setOperatorId(e.target.value)} required disabled={fetchingOperators}>
                    {fetchingOperators ? (
                      <option value="">Loading operators...</option>
                    ) : operators.length > 0 ? (
                      <>
                        <option value="" disabled>Choose Operator...</option>
                        {operators.map(op => (
                          <option key={op.operatorId} value={op.operatorId}>{op.name}</option>
                        ))}
                      </>
                    ) : (
                      <option value="">No operators available for this country</option>
                    )}
                  </select>
                </div>

              </>
            )}

            <div className="purchase-input-group">
              <label>Phone Number</label>
              <input type="tel" className="purchase-input" placeholder={isInternational ? "Phone with country code" : "e.g. 08012345678"} value={phone} onChange={(e) => setPhone(e.target.value)} required />
            </div>

            <div className="purchase-input-group">
               <label>Amount {isInternational ? '(USD/Local Equivalent)' : '(₦)'}</label>
               <input 
                type="number" 
                className="purchase-input" 
                placeholder="Enter amount" 
                value={amount} 
                onChange={(e) => setAmount(e.target.value)} 
                required 
                readOnly={activeTab === 'data' && !isInternational}
                style={activeTab === 'data' && !isInternational ? { background: '#f5f5f5', cursor: 'not-allowed' } : {}}
               />
               {!isInternational && (activeTab === 'airtime' || activeTab === 'electricity') && (
                 <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginTop: '10px' }}>
                    {[100, 200, 500, 1000, 2000, 5000].slice(0, activeTab === 'airtime' ? 4 : 6).map(amt => (
                      <button 
                        key={amt}
                        type="button"
                        onClick={() => {
                          setAmount(amt);
                          if (phone && (activeTab === 'airtime' ? network : (discoId && meterNumber))) {
                            setShowPinModal(true);
                            setTransactionPin('');
                          }
                        }}
                        style={{ padding: '8px', borderRadius: '8px', border: '1px solid var(--border-color)', background: amount == amt ? 'var(--primary)' : 'rgba(0,0,0,0.03)', color: amount == amt ? '#fff' : 'inherit', fontSize: '13.2px', fontWeight: 'bold', cursor: 'pointer' }}
                      >
                        ₦{amt}
                      </button>
                    ))}
                 </div>
               )}
             </div>

             {activeTab === 'data' && !isInternational && (
               <div className="purchase-input-group">
                 <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                   Select Data Plan
                   {fetchingPlans && <Loader2 className="animate-spin" size={14} />}
                 </label>
                 {fetchingPlans ? (
                   <div className="plan-loading-shimmer">
                     {[...Array(6)].map((_, i) => <div key={i} className="shimmer-card" />)}
                   </div>
                 ) : (
                     <div className="data-plans-grid">
                       {dataPlans
                          .filter(p => {
                            // Hide DISABLED categories from the list
                            const catName = p.category || 'Direct';
                            const compositeName = `${network} ${catName}`;
                            const config = publicCategories.find(c => 
                              c.category_name.toLowerCase() === compositeName.toLowerCase() &&
                              c.provider_name.toLowerCase() === (p.provider || '').toLowerCase()
                            );
                            if (config && config.visibility === 'HIDDEN') return false;
                            if (config && config.status === 'DISABLED') return false;
                            return true;
                          })
                          .filter(p => dataCategory === 'all' || (p.category && p.category.toLowerCase() === dataCategory.toLowerCase()))
                          .filter(p => dataOption === 'smart' ? (p.provider === 'peyflex' || p.provider === 'connectbridge') : p.provider === 'clubkonnect')
                          .map(plan => {
                         const sizeLabel = plan.plan_size || (plan.name || '').match(/(\d+(?:\.\d+)?\s*(?:MB|GB|TB))/i)?.[0] || plan.name;
                         
                         const compositeName = `${network} ${plan.category || 'Direct'}`;
                         const config = publicCategories.find(c => 
                           c.category_name.toLowerCase() === compositeName.toLowerCase() &&
                           c.provider_name.toLowerCase() === (plan.provider || '').toLowerCase()
                         );
                         const isMaintenance = config && config.status === 'MAINTENANCE';

                         return (
                           <div
                             key={plan.plan_code}
                             className={`data-plan-card ${String(dataPlan) === String(plan.plan_code) ? 'selected' : ''} ${isMaintenance ? 'disabled-card' : ''}`}
                             onClick={() => !isMaintenance && handlePlanChange(plan.plan_code)}
                             style={isMaintenance ? { opacity: 0.6, cursor: 'not-allowed' } : {}}
                           >
                             {/* TOP: Data size */}
                             <div className="plan-size-badge">{sizeLabel}</div>
                             {/* Validity badge - top right */}
                             {plan.validity && <div className="plan-validity-badge">{plan.validity}</div>}
                             {/* CENTER: Price */}
                             <div className="plan-price">₦{Number(plan.price).toLocaleString()}</div>
                             {/* BOTTOM: Category label */}
                             <div className="plan-category-label">
                               {plan.category || plan.provider || network}
                               {isMaintenance && <span style={{display: 'block', fontSize: '10px', color: 'var(--warning)', marginTop: 4}}><ShieldAlert size={10} style={{display:'inline'}}/> Maintenance</span>}
                             </div>
                           </div>
                         );
                       })}
                     </div>
                 )}
                 {!fetchingPlans && (dataCategory === 'all' ? dataPlans : dataPlans.filter(p => p.category === dataCategory)).length === 0 && network && (
                   <div style={{ textAlign: 'center', padding: '28px 20px', color: '#888', fontSize: '14px' }}>
                     {dataPlans.length === 0
                       ? 'No plans available for this network. Try syncing from admin.'
                       : `No ${dataCategory} plans available for ${network}.`}
                   </div>
                 )}
               </div>
             )}
          </>
        );


      case 'epin':
        return (
          <>
            <div className="purchase-input-group">
              <label>Select Network Provider</label>
              <div className="network-grid">
                {networks.map(net => (
                  <div key={net.id} className={`network-item ${net.class} ${network === net.id ? 'selected' : ''}`} onClick={() => setNetwork(net.id)}>
                    {net.label}
                  </div>
                ))}
              </div>
            </div>
            <div className="purchase-input-group">
              <label>Value (₦)</label>
              <select className="purchase-input" value={epinValue} onChange={(e) => setEpinValue(e.target.value)} required>
                <option value="100">₦100</option>
                <option value="200">₦200</option>
                <option value="500">₦500</option>
              </select>
            </div>
            <div className="purchase-input-group">
              <label>Quantity</label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input type="number" className="purchase-input" max="100" min="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} required />
                <button 
                  type="button" 
                  onClick={() => {
                    if (network && epinValue && quantity) {
                      setShowPinModal(true);
                      setTransactionPin('');
                    }
                  }}
                  style={{ padding: '0 20px', borderRadius: '12px', border: 'none', background: 'var(--primary)', color: '#fff', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  Buy
                </button>
              </div>
            </div>
          </>
        );
      
      case 'cable':
        const providerMap = { '01': 'dstv', '02': 'gotv', '03': 'startimes' };
        const selectedProviderString = providerMap[cableId];
        const availableCablePlans = cablePlans.filter(p => p.provider === selectedProviderString);

        return (
          <>
            <div className="purchase-input-group">
              <label>Provider</label>
              <select className="purchase-input" value={cableId} onChange={(e) => {
                  setCableId(e.target.value);
                  setPackageId('');
                  setAmount('');
              }} required>
                <option value="" disabled>Select Provider...</option>
                <option value="01">DStv</option>
                <option value="02">GOtv</option>
                <option value="03">StarTimes</option>
              </select>
            </div>
            <div className="purchase-input-group">
              <label>Package {fetchingCablePlans && <Loader2 className="animate-spin" size={14} style={{ display: 'inline', marginLeft: 6 }} />}</label>
              <select className="purchase-input" value={packageId} onChange={(e) => {
                  setPackageId(e.target.value);
                  const selectedPlan = availableCablePlans.find(p => p.plan_id === e.target.value);
                  if (selectedPlan) {
                      setAmount(selectedPlan.price);
                  }
              }} required disabled={!cableId || fetchingCablePlans}>
                  <option value="" disabled>{fetchingCablePlans ? 'Loading plans...' : 'Select Package...'}</option>
                  {availableCablePlans.map(plan => (
                      <option key={plan.plan_id} value={plan.plan_id}>
                          {plan.name} - ₦{plan.price.toLocaleString()}
                      </option>
                  ))}
              </select>
            </div>
            <div className="purchase-input-group">
              <label>SmartCard Number</label>
              <input type="text" className="purchase-input" value={smartcard} onChange={(e) => setSmartCard(e.target.value)} required />
            </div>
            <div className="purchase-input-group">
              <label>Phone Number</label>
              <input type="tel" className="purchase-input" value={phone} onChange={(e) => setPhone(e.target.value)} required />
            </div>
            <div className="purchase-input-group">
              <label>Amount (₦)</label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input type="number" className="purchase-input" value={amount} onChange={(e) => setAmount(e.target.value)} required readOnly style={{ background: '#f5f5f5', cursor: 'not-allowed' }} />
                <button 
                  type="button" 
                  onClick={() => {
                    if (cableId && packageId && smartcard && phone && amount) {
                      setShowPinModal(true);
                      setTransactionPin('');
                    } else {
                      alert("Please fill in all cable details");
                    }
                  }}
                  style={{ padding: '0 20px', borderRadius: '12px', border: 'none', background: 'var(--primary)', color: '#fff', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  Confirm
                </button>
              </div>
            </div>
          </>
        );

      case 'electricity':
        return (
          <>
            <div className="purchase-input-group">
              <label>Disco Provider</label>
              <select className="purchase-input" value={discoId} onChange={(e) => setDiscoId(e.target.value)} required>
                <option value="03">Ikeja Electric (IKEDC)</option>
                <option value="02">Eko Electric (EKEDC)</option>
                <option value="01">Abuja Electric (AEDC)</option>
                <option value="04">Kano Electric (KEDCO)</option>
                <option value="05">Port Harcourt Electric (PHED)</option>
                <option value="06">Ibadan Electric (IBEDC)</option>
              </select>
            </div>
            <div className="purchase-input-group">
              <label>Meter Type</label>
              <select className="purchase-input" value={meterType} onChange={(e) => setMeterType(e.target.value)} required>
                <option value="01">Prepaid</option>
                <option value="02">Postpaid</option>
              </select>
            </div>
            <div className="purchase-input-group">
              <label>Meter Number</label>
              <input type="text" className="purchase-input" value={meterNumber} onChange={(e) => setMeterNumber(e.target.value)} required />
            </div>
             <div className="purchase-input-group">
              <label>Phone Number</label>
              <input type="tel" className="purchase-input" value={phone} onChange={(e) => setPhone(e.target.value)} required />
            </div>
            <div className="purchase-input-group">
              <label>Amount (₦)</label>
              <input type="number" className="purchase-input" value={amount} onChange={(e) => setAmount(e.target.value)} required />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginTop: '10px' }}>
                {[500, 1000, 2000, 5000, 10000, 20000].map(amt => (
                  <button 
                    key={amt}
                    type="button"
                    onClick={() => {
                      setAmount(amt);
                      if (discoId && meterNumber && phone) {
                        setShowPinModal(true);
                        setTransactionPin('');
                      }
                    }}
                    style={{ padding: '8px', borderRadius: '8px', border: '1px solid var(--border-color)', background: amount == amt ? 'var(--primary)' : 'rgba(0,0,0,0.03)', color: amount == amt ? '#fff' : 'inherit', fontSize: '12.1px', fontWeight: 'bold', cursor: 'pointer' }}
                  >
                    ₦{amt.toLocaleString()}
                  </button>
                ))}
              </div>
            </div>
          </>
        );

      case 'education':
        return (
          <>
            <div className="purchase-input-group">
              <label>Exam Type</label>
              <select className="purchase-input" value={examType} onChange={(e) => {
                const val = e.target.value;
                setEexamType(val);
                if (phone && phone.length >= 10) {
                  setShowPinModal(true);
                  setTransactionPin('');
                }
              }} required>
                <option value="waecdirect">WAEC Result Checker</option>
                <option value="waec-registration">WAEC Registration</option>
                <option value="jamb">JAMB UTME</option>
                <option value="de">JAMB Direct Entry</option>
              </select>
            </div>
            <div className="purchase-input-group">
              <label>Phone Number (Receives PIN)</label>
              <input type="tel" className="purchase-input" value={phone} onChange={(e) => setPhone(e.target.value)} required />
            </div>
          </>
        );
      
      default: return null;
    }
  };

  return (
    <div className="page-container">
      <div className="internal-header" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', position: 'sticky', top: 0, zIndex: 100, background: 'var(--bg-card)', borderBottom: '1px solid var(--border-color)' }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: 'var(--text-dark)', cursor: 'pointer' }}>
           <ChevronLeft size={28} />
        </button>
        <h2 style={{ fontSize: '22.0px', textTransform: 'capitalize' }}>
          Purchase {activeTab}
        </h2>
      </div>

      <div className="purchase-container">
        <div className="modern-tabs-scroll" style={{ display: 'flex', overflowX: 'auto', gap: '10px', padding: '10px 0', marginBottom: '10px', msOverflowStyle: 'none', scrollbarWidth: 'none' }}>
           {['airtime', 'data', 'cable', 'electricity', 'epin', 'education'].map(tab => (
             <button 
               key={tab}
               className={`purchase-tab ${activeTab === tab ? 'active' : ''}`}
               style={{ flex: '0 0 auto', padding: '8px 16px', borderRadius: '20px', border: 'none', whiteSpace: 'nowrap' }}
               onClick={() => { setActiveTab(tab); setStatus(null); setResultToken(null); }}
             >
               {tab.toUpperCase()}
             </button>
           ))}
        </div>

        {isActiveReseller(user) ? (
          <div className="reseller-mini-banner" onClick={() => navigate('/reseller')} style={{
              background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
              borderRadius: '12px', padding: '10px 16px', marginBottom: '20px',
              color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
          }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ background: 'rgba(255,255,255,0.2)', padding: '6px', borderRadius: '8px' }}><ShieldCheck size={14} /></div>
                 <div>
                  <h4 style={{ margin: 0, fontSize: '14.3px', fontWeight: 800 }}>Reseller Business Console</h4>
                  <p style={{ margin: 0, fontSize: '11.0px', opacity: 0.9 }}>
                    {isPremiumReseller(user)
                      ? "Premium Mode Active • Adjust customer pricing overrides"
                      : "Basic Reseller Console • Review sales analytics & metrics"}
                  </p>
                </div>
             </div>
             <ChevronRight size={16} />
          </div>
        ) : (siteInfo) ? (
          visibleBanners.length > 0 && (
            <div className="fintech-banner-slider">
              {visibleBanners.map((banner, index) => (
                <div 
                  key={banner._id}
                  className={`fintech-banner-item ${index === currentBannerIndex ? 'active' : ''}`}
                  style={{ 
                    backgroundImage: `linear-gradient(rgba(0,0,0,0.2), rgba(0,0,0,0.7)), url(${banner.image})`,
                    cursor: banner.link ? 'pointer' : 'default'
                  }}
                  onClick={() => banner.link && handleLinkClick(banner)}
                >
                  <div className="banner-content">
                    <h5>{banner.title}</h5>
                    <p>{banner.message}</p>
                  </div>
                </div>
              ))}
              
              {visibleBanners.length > 1 && (
                <div className="slider-dots">
                  {visibleBanners.map((_, idx) => (
                    <div 
                      key={idx} 
                      className={`slider-dot ${idx === currentBannerIndex ? 'active' : ''}`}
                      onClick={() => setCurrentBannerIndex(idx)}
                    ></div>
                  ))}
                </div>
              )}
            </div>
          )
        ) : (
          <div className="reseller-mini-banner" onClick={() => navigate('/reseller/onboarding')} style={{
              background: 'linear-gradient(135deg, #3B82F6 0%, #10B981 100%)',
              borderRadius: '12px', padding: '10px 16px', marginBottom: '20px',
              color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
          }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ background: 'rgba(255,255,255,0.2)', padding: '6px', borderRadius: '8px' }}><Zap size={14} /></div>
                 <div>
                  <h4 style={{ margin: 0, fontSize: '14.3px', fontWeight: 800 }}>Start Your Brand for FREE</h4>
                  <p style={{ margin: 0, fontSize: '11.0px', opacity: 0.9 }}>7-Day Free Trial • Fully Branded Website</p>
                </div>
             </div>
             <ChevronRight size={16} />
          </div>
        )}

        {status && !receiptData && (
          <div className={`purchase-alert ${status.type} glass-panel`} style={{ marginBottom: '20px', padding: '15px', borderRadius: '12px' }}>
            {status.msg}
          </div>
        )}

        {resultToken && !receiptData && (
           <div className="purchase-alert success glass-panel animate-scale-in" style={{ marginBottom: '20px', padding: '15px', borderRadius: '12px', backgroundColor: '#e6fffa', border: '1px solid #38b2ac', color: '#2c7a7b', wordBreak: 'break-all' }}>
             <strong>Transaction Token/PIN:</strong><br/>
             <span style={{ fontSize: '19.8px', fontWeight: 'bold' }}>{resultToken}</span>
           </div>
        )}

        {receiptData && (
          <div className="global-receipt-modal-overlay animate-fade-in" style={{
              position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
              background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(5px)',
              zIndex: 50001, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px'
          }}>
            <div className="purchase-alert success glass-panel animate-scale-in" style={{ 
                width: '100%', maxWidth: '320px',
                padding: '20px', 
                borderRadius: '20px', 
                backgroundColor: 'var(--card-bg)', 
                border: receiptData.status === 'pending' ? '1px solid rgba(59,130,246,0.3)' : '1px solid rgba(16,185,129,0.3)', 
                boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
                color: 'var(--text-color)',
                position: 'relative'
            }}>
                <button onClick={() => { setReceiptData(null); clearBanner(); }} style={{ position: 'absolute', top: '12px', right: '12px', background: 'transparent', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                    <X size={18} />
                </button>
                <div style={{ textAlign: 'center', marginBottom: '16px', marginTop: '4px' }}>
                    {receiptData.status === 'pending' ? (
                        <>
                            <div className="spinner" style={{ margin: '0 auto 10px', width: '40px', height: '40px', border: '3px solid rgba(59, 130, 246, 0.1)', borderTop: '3px solid #3B82F6', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                            <h3 style={{ margin: 0, color: '#3B82F6', fontSize: '18px', fontWeight: '700' }}>Processing...</h3>
                        </>
                    ) : (
                        <>
                            <div style={{ background: 'rgba(16, 185, 129, 0.1)', width: '50px', height: '50px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
                                <CheckCircle size={28} color="#10B981" />
                            </div>
                            <h3 style={{ margin: 0, color: '#10B981', fontSize: '18px', fontWeight: '700' }}>Success</h3>
                        </>
                    )}
                </div>
                <div style={{ background: 'rgba(0,0,0,0.02)', padding: '12px', borderRadius: '12px', fontSize: '13px', lineHeight: '1.5' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '6px', marginBottom: '6px' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Status</span>
                        <strong style={{ color: receiptData.status === 'pending' ? '#3B82F6' : '#10B981', textTransform: 'capitalize' }}>
                            {receiptData.status || 'Success'}
                        </strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '6px', marginBottom: '6px' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Amount</span>
                        <strong>₦{receiptData.amount.toLocaleString()}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '6px', marginBottom: '6px' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Desc</span>
                        <strong style={{ textAlign: 'right', maxWidth: '160px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{receiptData.desc}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: receiptData.token ? '1px solid var(--border-color)' : 'none', paddingBottom: receiptData.token ? '6px' : '0', marginBottom: receiptData.token ? '6px' : '0' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Date</span>
                        <strong>{receiptData.date}</strong>
                    </div>
                    {receiptData.token && (
                        <div style={{ marginTop: '8px', background: 'rgba(217, 119, 6, 0.1)', padding: '8px', borderRadius: '8px', textAlign: 'center', wordBreak: 'break-all', border: '1px dashed #d97706' }}>
                            <strong style={{ color: '#d97706', fontSize: '14px' }}>{receiptData.token}</strong>
                        </div>
                    )}
                </div>
                <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                    <button onClick={handleShareWhatsApp} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '10px', background: '#25D366', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}>
                        <Share2 size={16} /> Share
                    </button>
                    <button onClick={() => window.print()} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '10px', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}>
                        <Download size={16} /> Save
                    </button>
                </div>
            </div>
          </div>
        )}

        {!receiptData && (
        <form className="purchase-form-card glass-panel" onSubmit={initiatePurchase} style={{ padding: '20px', borderRadius: '16px' }}>
           {renderActiveForm()}

           <div className="purchase-summary" style={{ marginTop: '20px', padding: '15px', background: 'rgba(0,0,0,0.03)', borderRadius: '10px' }}>
              <span className="summary-label">Total Estimate:</span>
              <span className="summary-value" style={{ fontWeight: 'bold', fontSize: '19.8px' }}>
                {activeTab === 'airtime' || activeTab === 'electricity' || activeTab === 'cable'
                  ? (amount ? `₦${Number(amount).toLocaleString()}` : '₦0')
                  : activeTab === 'epin'
                  ? `₦${(Number(epinValue)*Number(quantity)).toLocaleString()}`
                  : 'Requires Validation'
                }
              </span>
           </div>

           <button 
            type="submit" 
            className="btn-primary" 
            disabled={loading || (activeTab === 'data' && !dataPlan && !isInternational)} 
            style={{ height: '56px', fontSize: '18px', width: '100%', marginTop: '20px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', opacity: (loading || (activeTab === 'data' && !dataPlan && !isInternational)) ? 0.7 : 1, transition: 'all 0.3s' }}
           >
              {loading ? <><Loader2 className="animate-spin" size={20} /> <span>Processing...</span></> : <span>Pay Securely</span>}
           </button>
        </form>
        )}
      </div>

      {/* PIN Confirmation Modal */}
      {showPinModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', backdropFilter: 'blur(4px)' }}>
              <div style={{ background: 'var(--bg-card)', padding: '24px', borderRadius: '24px', width: '100%', maxWidth: '400px', boxShadow: '0 20px 40px rgba(0,0,0,0.4)', border: '1px solid var(--border-color)' }}>
                  <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                      <div style={{ background: 'rgba(59, 130, 246, 0.1)', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', color: '#3B82F6' }}>
                          <Lock size={32} />
                      </div>
                      <h3 style={{ margin: 0, fontSize: '22.0px', fontWeight: '800' }}>Confirm Payment</h3>
                      
                      {/* Transaction Summary in Modal */}
                      <div style={{ marginTop: '15px', padding: '12px', background: 'rgba(0,0,0,0.03)', borderRadius: '12px', textAlign: 'left', fontSize: '15.4px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                              <span style={{ color: '#888' }}>Product:</span>
                              <span style={{ fontWeight: 'bold' }}>{activeTab === 'data' ? `${network} DATA` : activeTab === 'airtime' ? `${network} AIRTIME` : activeTab.toUpperCase()}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                              <span style={{ color: '#888' }}>Recipient:</span>
                              <span style={{ fontWeight: 'bold' }}>{phone || meterNumber || smartcard || 'N/A'}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span style={{ color: '#888' }}>Amount:</span>
                              <span style={{ fontWeight: 'bold', color: '#10B981', fontSize: '17.6px' }}>₦{Number(amount || (Number(epinValue)*Number(quantity))).toLocaleString()}</span>
                          </div>
                      </div>
                  </div>
                  
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', fontSize: '13.2px', color: '#888', textAlign: 'center', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>Enter 4-Digit Transaction PIN</label>
                    <input 
                        type="password" 
                        placeholder="••••" 
                        style={{ width: '100%', textAlign: 'center', letterSpacing: '12px', fontSize: '30.8px', padding: '16px', borderRadius: '16px', border: '1px solid var(--border-color)', background: 'var(--input-bg)', color: 'var(--text-color)', outline: 'none', transition: 'border-color 0.2s' }}
                        maxLength={4}
                        value={transactionPin}
                        onChange={e => setTransactionPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                        autoFocus
                    />
                  </div>

                  {biometricSupported && user?.biometricEnabled && (
                    <button 
                        type="button"
                        className="biometric-auth-btn"
                        disabled={biometricLoading}
                        onClick={async () => {
                            setBiometricLoading(true);
                            try {
                                const challengeRes = await API.get(`/api/biometric/login-challenge?email=${user.email}`);
                                const bioData = await authenticateBiometric(challengeRes.data);
                                await confirmPurchase(bioData);
                            } catch (err) {
                                console.error(err);
                                alert("Biometric verification failed: " + (err.message || "Try using your PIN"));
                            } finally {
                                setBiometricLoading(false);
                            }
                        }}
                        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', padding: '16px', borderRadius: '16px', border: '2px solid #3B82F6', background: 'transparent', color: '#3B82F6', fontWeight: '800', cursor: 'pointer', marginBottom: '16px', transition: 'all 0.2s' }}
                    >
                        {biometricLoading ? <Loader2 className="animate-spin" size={24} /> : <Fingerprint size={24} />}
                        <span>Authorize with Biometrics</span>
                    </button>
                  )}
                  
                  <div style={{ display: 'flex', gap: '12px' }}>
                      <button 
                        type="button"
                        onClick={() => setShowPinModal(false)} 
                        style={{ flex: 1, padding: '16px', borderRadius: '16px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-color)', cursor: 'pointer', fontWeight: 'bold' }}
                      >
                        Reselect
                      </button>
                      <button 
                        type="button"
                        onClick={() => confirmPurchase()} 
                        disabled={transactionPin.length !== 4} 
                        style={{ flex: 1.5, padding: '16px', borderRadius: '16px', border: 'none', background: '#3B82F6', color: '#fff', cursor: 'pointer', fontWeight: 'bold', fontSize: '17.6px', opacity: transactionPin.length === 4 ? 1 : 0.5, boxShadow: transactionPin.length === 4 ? '0 4px 12px rgba(59, 130, 246, 0.3)' : 'none' }}
                      >
                        Complete Pay
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default Purchase;

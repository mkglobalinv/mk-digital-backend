import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, CheckCircle, AlertTriangle,
  Loader2, ShieldCheck, Download
} from 'lucide-react';
import API from '../../api';

/**
 * IdentityPurchase
 *
 * Routing convention: /identity/:serviceId  (retail)
 *                    /reseller/identity/:serviceId  (reseller — same component)
 *
 * On mount, fetches the service plan from:
 *   GET /api/retail/identity/service/:serviceId
 *
 * DataPlan MongoDB is the single source of truth for:
 *   - plan_name
 *   - selling_price
 *   - api_plan_id
 *   - status / provider
 *
 * Nothing is hardcoded.
 */
const IdentityPurchase = ({ user }) => {
  const { serviceId } = useParams();
  const navigate     = useNavigate();

  const [service, setService]   = useState(null);
  const [loadingPlan, setLoadingPlan] = useState(true);
  const [planError, setPlanError]     = useState(null);

  const [params, setParams]   = useState({});
  const [loading, setLoading] = useState(false);
  const [result, setResult]   = useState(null);
  const [error, setError]     = useState(null);

  /* ── 1. Load service from DB on mount ─────────────────────────── */
  useEffect(() => {
    if (!serviceId) {
      setPlanError('No service selected.');
      setLoadingPlan(false);
      return;
    }

    let cancelled = false;
    setLoadingPlan(true);
    setPlanError(null);

    API.get(`/api/retail/identity/service/${serviceId}`)
      .then(res => {
        if (cancelled) return;
        if (res.data?.status === 'success') {
          setService(res.data.data);
        } else {
          setPlanError(res.data?.message || 'Service not found');
        }
      })
      .catch(err => {
        if (cancelled) return;
        setPlanError(err.response?.data?.message || 'Failed to load service. Please try again.');
      })
      .finally(() => {
        if (!cancelled) setLoadingPlan(false);
      });

    return () => { cancelled = true; };
  }, [serviceId]);

  /* ── 2. Input handler ─────────────────────────────────────────── */
  const handleChange = (e) => {
    let value = e.target.value;
    if (['nin', 'bvn', 'phone'].includes(e.target.name)) {
      value = value.replace(/\D/g, '');
    }
    setParams(prev => ({ ...prev, [e.target.name]: value }));
  };

  /* ── 3. Submit purchase ──────────────────────────────────────── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await API.post('/api/retail/identity/purchase', {
        serviceId: service.api_plan_id,
        params: { ...params, consent: true }
      });
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Transaction failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /* ── 4. Dynamic input fields (keyed by api_plan_id from DB) ──── */
  const renderInputs = () => {
    if (!service) return null;
    switch (service.api_plan_id) {
      case 'nin-verify':
        return (
          <div className="input-group">
            <label>National Identity Number (NIN)</label>
            <input name="nin" placeholder="Enter 11-digit NIN" required
              onChange={handleChange} value={params.nin || ''} maxLength="11" />
          </div>
        );
      case 'bvn-verify':
        return (
          <div className="input-group">
            <label>Bank Verification Number (BVN)</label>
            <input name="bvn" placeholder="Enter 11-digit BVN" required
              onChange={handleChange} value={params.bvn || ''} maxLength="11" />
          </div>
        );
      case 'nin-phone':
      case 'bvn-phone':
        return (
          <div className="input-group">
            <label>Phone Number</label>
            <input name="phone" placeholder="Enter linked phone number" required
              onChange={handleChange} value={params.phone || ''} maxLength="11" />
          </div>
        );
      case 'nin-tracking':
        return (
          <div className="input-group">
            <label>NIMC Tracking ID</label>
            <input name="tracking_id" placeholder="Enter Tracking ID" required onChange={handleChange} value={params.tracking_id || ''} />
          </div>
        );
      case 'nin-demographics':
        return (
          <>
            <div className="input-group">
              <label>First Name</label>
              <input name="firstname" placeholder="Enter first name" required onChange={handleChange} />
            </div>
            <div className="input-group">
              <label>Last Name</label>
              <input name="lastname" placeholder="Enter last name" required onChange={handleChange} />
            </div>
            <div className="input-group">
              <label>Gender</label>
              <select name="gender" required onChange={handleChange}>
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>
            <div className="input-group">
              <label>Date of Birth</label>
              <input name="dob" type="date" required onChange={handleChange} />
            </div>
          </>
        );
      case 'nin-modification':
        return (
          <>
            <div className="input-group">
              <label>Existing NIN</label>
              <input name="nin" placeholder="Enter 11-digit NIN" required
                onChange={handleChange} value={params.nin || ''} maxLength="11" />
            </div>
            <div className="input-group">
              <label>Modification Type</label>
              <select name="service_type" required onChange={handleChange}>
                <option value="">Select Modification</option>
                <option value="nin_name_modification">Name Modification</option>
                <option value="nin_dob_modification">Date of Birth Modification</option>
                <option value="nin_phone_modification">Phone Number Modification</option>
                <option value="nin_address_modification">Address Modification</option>
              </select>
            </div>
            <div className="input-group">
              <label>NIMC Tracking ID (Optional)</label>
              <input name="tracking_id" placeholder="If already submitted via NIMC"
                onChange={handleChange} />
            </div>
            <div className="input-group">
              <label>New Value / Details</label>
              <textarea name="details" placeholder="Provide the new details to apply"
                required onChange={handleChange}
                style={{ resize: 'vertical', minHeight: '80px' }} />
            </div>
          </>
        );
      default:
        return <div style={{ color: '#ef4444' }}>Service input form not configured.</div>;
    }
  };

  /* helper: robust field accessor supporting multiple key variants */
  const getField = (obj, keys = []) => {
    if (!obj) return null;
    for (const k of keys) {
      if (obj[k] !== undefined && obj[k] !== null && String(obj[k]).trim() !== '') return obj[k];
    }
    return null;
  };

  /* ── 5. Loading / error states ────────────────────────────────── */
  if (loadingPlan) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', minHeight: '60vh', gap: '16px',
        fontFamily: 'Inter, sans-serif', color: 'var(--text-gray)' }}>
        <Loader2 size={36} className="animate-spin" color="#6366f1" />
        <span style={{ fontWeight: 600 }}>Loading service details…</span>
      </div>
    );
  }

  if (planError || !service) {
    return (
      <div style={{ padding: '40px 20px', textAlign: 'center', fontFamily: 'Inter, sans-serif' }}>
        <AlertTriangle size={48} color="#ef4444" style={{ margin: '0 auto 16px' }} />
        <h3 style={{ color: 'var(--text-dark)', marginBottom: '8px' }}>Service Unavailable</h3>
        <p style={{ color: 'var(--text-gray)', marginBottom: '24px' }}>{planError}</p>
        <button onClick={() => navigate(-1)} style={backBtnStyle}>Go Back</button>
      </div>
    );
  }

  /* ── 6. Main render ───────────────────────────────────────────── */
  return (
    <div style={{ padding: '0 0 40px 0', minHeight: '100vh',
      background: 'var(--bg-color)', fontFamily: 'Inter, sans-serif' }}>

      {/* Header */}
      <div style={{
        background: 'var(--bg-card, #ffffff)', padding: '24px',
        borderBottom: '1px solid var(--border-color, #e2e8f0)',
        display: 'flex', alignItems: 'center', gap: '16px',
        position: 'sticky', top: 0, zIndex: 10,
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
      }}>
        <div onClick={() => navigate(-1)}
          style={{ background: 'rgba(99,102,241,0.1)', padding: '10px',
            borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
          <ArrowLeft size={20} color="#6366f1" />
        </div>
        <div>
          <h2 style={{ margin: '0 0 4px', fontSize: '20px', fontWeight: '700',
            color: 'var(--text-dark)' }}>{service.plan_name}</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px',
            fontSize: '13px', color: 'var(--text-gray)' }}>
            <ShieldCheck size={14} color="#10b981" /> Verified Service Provider
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '600px', margin: '32px auto', padding: '0 20px' }}>
        {result ? (
          /* ── Success state ── */
          <div className="animate-fade-in" style={{ background: 'var(--bg-card, #ffffff)',
            borderRadius: '24px', overflow: 'hidden',
            border: '1px solid var(--border-color)',
            boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}>
            <div style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              padding: '32px 24px', textAlign: 'center', color: 'white' }}>
              <div style={{ background: 'rgba(255,255,255,0.2)', width: '80px', height: '80px',
                borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 16px', backdropFilter: 'blur(10px)' }}>
                <CheckCircle size={40} color="white" />
              </div>
              <h3 style={{ margin: '0 0 8px', fontSize: '24px', fontWeight: '800' }}>
                Verification Successful
              </h3>
              <p style={{ margin: 0, opacity: 0.9 }}>Report generated securely</p>
            </div>

            <div style={{ padding: '24px' }}>
              <div style={{ background: 'var(--bg-color)', borderRadius: '16px',
                border: '1px solid var(--border-color)', padding: '24px', marginBottom: '24px' }}>

                {(() => {
                  const providerResponse = result.data || {};
                  // Billsplash nested payloads can vary — normalize robustly
                  // Common shapes observed:
                  // 1) { status, reportID, message, data: { status, data: { ...fields } } }
                  // 2) { status, data: { ...fields } }
                  // 3) { ...fields } (flat)
                  const level1 = providerResponse?.data || providerResponse;
                  const level2 = level1?.data || level1;
                  const idData = level2?.data || level2;
                  const reportID = providerResponse?.reportID || level1?.reportID || idData?.reportID;

                  const safeRender = (label, value) => {
                    if (!value || value === 'null' || value === 'undefined') return null;
                    return (
                      <div style={{ marginBottom: '12px' }}>
                        <div style={{ fontSize: '12px', color: 'var(--text-gray)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</div>
                        <div style={{ fontSize: '15px', color: 'var(--text-dark)', fontWeight: '500' }}>{value}</div>
                      </div>
                    );
                  };

                  let imgSrc = getField(idData, ['base64Image','photo','photo_base64']);
                  if (imgSrc && !imgSrc.startsWith('data:image')) {
                    imgSrc = `data:image/jpeg;base64,${imgSrc}`;
                  }

                  // Map field keys with fallbacks for different provider shapes
                  const firstName = getField(idData, ['firstName','firstname','first_name','givenName','given_name']);
                  const middleName = getField(idData, ['middleName','middlename','middle_name']);
                  const lastName = getField(idData, ['lastName','lastname','last_name','surname']);
                  const fullName = [firstName, middleName, lastName].filter(Boolean).join(' ');

                  const dob = getField(idData, ['dateOfBirth','dob','birthDate','birth_date']);
                  const gender = getField(idData, ['gender','sex']);
                  const maritalStatus = getField(idData, ['maritalStatus','marital_status']);
                  const nationality = getField(idData, ['nationality','country']);

                  const ninVal = getField(idData, ['nin','NIN','ninNumber','nin_number']);
                  const bvnVal = getField(idData, ['bvn','BVN','bvnNumber','bvn_number']);
                  const idNumberLabel = ninVal ? 'NIN' : (bvnVal ? 'BVN' : null);
                  const idNumberValue = ninVal ? `***${String(ninVal).slice(-4)}` : (bvnVal ? `***${String(bvnVal).slice(-4)}` : null);

                  const stateOfOrigin = getField(idData, ['stateOfOrigin','state_of_origin','state_origin','state']);
                  const lgaOfOrigin = getField(idData, ['lgaOfOrigin','lga_of_origin','lga_origin','lga']);
                  const stateOfResidence = getField(idData, ['stateOfResidence','state_of_residence','residence_state']);
                  const lgaOfResidence = getField(idData, ['lgaOfResidence','lga_of_residence','residence_lga']);
                  const address = getField(idData, ['residentialAddress','address','residential_address','residentialAddress1']);

                  const phone1 = getField(idData, ['phoneNumber1','phone1','phone','mobile']);
                  const phone2 = getField(idData, ['phoneNumber2','phone2','alt_phone']);

                  const registrationDate = getField(idData, ['registrationDate','enrollmentDate','registeredAt','registration_date']);
                  const watchListed = getField(idData, ['watchListed','watch_listed','watchlisted']);
                  const enrollmentBank = getField(idData, ['enrollmentBank','bank']);
                  const enrollmentBranch = getField(idData, ['enrollmentBranch','branch']);

                  return (
                    <div style={{ textAlign: 'left' }}>
                      {reportID && (
                        <div style={{ display: 'inline-block', background: 'rgba(16,185,129,0.1)', color: '#10b981', padding: '6px 12px', borderRadius: '8px', fontSize: '13px', fontWeight: '600' }}>
                          Report ID: {reportID}
                        </div>
                      )}

                      {imgSrc && (
                        <div style={{ marginBottom: '32px', textAlign: 'center' }}>
                          <img src={imgSrc} alt="Verified Person" style={{ width: '140px', height: '140px', borderRadius: '16px', objectFit: 'cover', border: '4px solid #fff', boxShadow: '0 4px 10px rgba(0,0,0,0.06)' }} />
                          <div style={{ marginTop: '12px', fontSize: '13px', color: 'var(--text-gray)', fontWeight: '600', letterSpacing: '1px' }}>PROFILE PHOTO</div>
                        </div>
                      )}

                      {/* PERSONAL INFO */}
                      <div style={{ marginBottom: '24px' }}>
                        <h4 style={{ margin: '0 0 16px 0', fontSize: '14px', color: '#6366f1', borderBottom: '1px solid rgba(99,102,241,0.2)', paddingBottom: '8px' }}>PERSONAL INFORMATION</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                          {safeRender('Full Name', fullName)}
                          {safeRender(idNumberLabel, idNumberValue)}
                          {safeRender('Date of Birth', dob)}
                          {safeRender('Gender', gender)}
                          {safeRender('Marital Status', maritalStatus)}
                          {safeRender('Nationality', nationality)}
                          {safeRender('Phone 1', phone1)}
                          {safeRender('Phone 2', phone2)}
                        </div>
                      </div>

                      {/* LOCATION INFO */}
                      <div style={{ marginBottom: '24px' }}>
                        <h4 style={{ margin: '0 0 16px 0', fontSize: '14px', color: '#6366f1', borderBottom: '1px solid rgba(99,102,241,0.2)', paddingBottom: '8px' }}>LOCATION</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                          {safeRender('State of Origin', stateOfOrigin)}
                          {safeRender('LGA of Origin', lgaOfOrigin)}
                          {safeRender('State of Residence', stateOfResidence)}
                          {safeRender('LGA of Residence', lgaOfResidence)}
                        </div>
                        <div style={{ marginTop: '12px' }}>
                          {safeRender('Address', address)}
                        </div>
                      </div>

                      {/* VERIFICATION DETAILS */}
                      <div>
                        <h4 style={{ margin: '0 0 16px 0', fontSize: '14px', color: '#6366f1', borderBottom: '1px solid rgba(99,102,241,0.2)', paddingBottom: '8px' }}>VERIFICATION DETAILS</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                          {safeRender('Registration Date', registrationDate)}
                          {safeRender('Watchlist Status', watchListed)}
                          {safeRender('Enrollment Bank', enrollmentBank)}
                          {safeRender('Enrollment Branch', enrollmentBranch)}
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button onClick={() => navigate(-1)}
                  style={{ flex: 1, padding: '16px', borderRadius: '16px',
                    background: 'var(--border-color)', color: 'var(--text-dark)',
                    border: 'none', fontWeight: '600', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  Done
                </button>
                <button onClick={() => alert('Download coming soon')}
                  style={{ flex: 1, padding: '16px', borderRadius: '16px',
                    background: '#3b82f6', color: 'white', border: 'none',
                    fontWeight: '600', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    boxShadow: '0 4px 14px rgba(59,130,246,0.3)' }}>
                  <Download size={18} /> Save PDF
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* ── Form state ── */
          <div style={{ background: 'var(--bg-card, #ffffff)', padding: '32px',
            borderRadius: '24px', border: '1px solid var(--border-color)',
            boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)' }}>

            {/* Price from DB */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              marginBottom: '32px', paddingBottom: '20px',
              borderBottom: '1px dashed var(--border-color)' }}>
              <span style={{ color: 'var(--text-gray)', fontSize: '15px' }}>Service Charge</span>
              <span style={{ fontWeight: '800', fontSize: '24px', color: 'var(--text-dark)' }}>
                ₦{service.selling_price?.toLocaleString()}
              </span>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px',
                marginBottom: '24px' }}>
                {renderInputs()}
              </div>

              {/* Consent notice */}
              <div style={{ background: 'rgba(99,102,241,0.05)', padding: '12px 16px',
                borderRadius: '12px', marginBottom: '24px',
                border: '1px solid rgba(99,102,241,0.1)' }}>
                <label style={{ display: 'flex', alignItems: 'flex-start',
                  gap: '12px', cursor: 'pointer', margin: 0 }}>
                  <input type="checkbox" checked readOnly
                    style={{ marginTop: '4px', accentColor: '#6366f1' }} />
                  <span style={{ fontSize: '12px', color: 'var(--text-gray)', lineHeight: '1.5' }}>
                    By proceeding, I provide my consent to retrieve personal identity information
                    in accordance with NIMC/CBN guidelines.
                  </span>
                </label>
              </div>

              {error && (
                <div className="animate-shake"
                  style={{ background: '#fef2f2', color: '#ef4444',
                    padding: '16px', borderRadius: '12px', marginBottom: '24px',
                    display: 'flex', alignItems: 'center', gap: '12px',
                    border: '1px solid #fecaca', fontSize: '14px', fontWeight: '500' }}>
                  <AlertTriangle size={20} /> {error}
                </div>
              )}

              <button type="submit" disabled={loading}
                style={{ width: '100%', padding: '18px', borderRadius: '16px',
                  background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                  color: '#fff', fontSize: '16px', fontWeight: '700',
                  border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                  boxShadow: '0 10px 15px -3px rgba(99,102,241,0.3)',
                  transition: 'all 0.2s', opacity: loading ? 0.7 : 1 }}>
                {loading
                  ? <><Loader2 size={20} className="animate-spin" /> Processing Securely…</>
                  : `Pay ₦${service.selling_price?.toLocaleString()}`
                }
              </button>
            </form>
          </div>
        )}
      </div>

      <style>{`
        .input-group { display: flex; flex-direction: column; gap: 8px; }
        .input-group label { font-size: 13px; font-weight: 600;
          color: var(--text-dark); margin-left: 4px; }
        .input-group input, .input-group select, .input-group textarea {
          padding: 16px; border-radius: 16px;
          border: 1px solid var(--border-color, #e2e8f0);
          background: var(--bg-color, #f8fafc);
          font-size: 15px; color: var(--text-dark);
          outline: none; transition: all 0.2s;
          box-sizing: border-box; width: 100%; font-family: inherit;
        }
        .input-group input:focus, .input-group select:focus,
        .input-group textarea:focus {
          border-color: #6366f1;
          background: var(--bg-card, #ffffff);
          box-shadow: 0 0 0 4px rgba(99,102,241,0.1);
        }
        .animate-shake {
          animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
        }
        @keyframes shake {
          10%, 90% { transform: translate3d(-1px, 0, 0); }
          20%, 80% { transform: translate3d(2px, 0, 0); }
          30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
          40%, 60% { transform: translate3d(4px, 0, 0); }
        }
      `}</style>
    </div>
  );
};

const backBtnStyle = {
  padding: '12px 24px', borderRadius: '12px',
  background: '#3b82f6', color: 'white',
  border: 'none', fontWeight: '600', cursor: 'pointer'
};

export default IdentityPurchase;

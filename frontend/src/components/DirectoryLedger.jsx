import React, { useState, useEffect } from 'react';
import { BookOpen, DollarSign, Search, Trash2, Plus, Phone, Tag, MapPin, Activity } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || '';

const DirectoryLedger = () => {
  const [contacts, setContacts] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [tab, setTab] = useState('contacts'); // 'contacts' or 'ledger'
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Contact Form States
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Agency'); // 'Plumber', 'Agency', 'Town/Ooru', 'Other'
  const [countryCode, setCountryCode] = useState('+91');
  const [phone, setPhone] = useState('');
  const [details, setDetails] = useState('');
  const [amount, setAmount] = useState('');
  const [formError, setFormError] = useState('');

  const handlePhoneChange = (e) => {
    const val = e.target.value.replace(/\D/g, '');
    if (val.length <= 10) {
      setPhone(val);
    }
  };

  // Ledger Form States
  const [ledgerType, setLedgerType] = useState('Purchase'); // 'Sale', 'Purchase', 'Agency Payment', 'General Expense'
  const [ledgerDesc, setLedgerDesc] = useState('');
  const [ledgerAmount, setLedgerAmount] = useState('');
  const [ledgerAgency, setLedgerAgency] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash'); // 'Cash', 'UPI / GPay', 'Card', 'Net Banking'

  const fetchContacts = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/directory`);
      if (response.ok) {
        const data = await response.json();
        setContacts(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/pharmacy-ledger`);
      if (response.ok) {
        const data = await response.json();
        setExpenses(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
    fetchExpenses();
  }, []);

  const handleAddContact = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!name || !phone) {
      setFormError('Name and Phone are required.');
      return;
    }

    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      setFormError('Phone number must be exactly 10 digits.');
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/api/directory`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          category,
          phone: `${countryCode} ${cleanPhone}`,
          details,
          amount: parseFloat(amount) || 0
        })
      });

      if (response.ok) {
        setName('');
        setPhone('');
        setCountryCode('+91');
        setDetails('');
        setAmount('');
        fetchContacts();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteContact = async (id) => {
    if (!window.confirm('Are you sure you want to delete this contact?')) return;
    try {
      const response = await fetch(`${API_BASE}/api/directory/${id}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        fetchContacts();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddLedger = async (e) => {
    e.preventDefault();
    if (!ledgerDesc || !ledgerAmount) return;

    try {
      const response = await fetch(`${API_BASE}/api/pharmacy-ledger`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: new Date().toLocaleDateString(),
          type: ledgerType,
          description: ledgerDesc,
          amount: parseFloat(ledgerAmount),
          agencyName: ledgerAgency,
          paymentMethod: paymentMethod
        })
      });

      if (response.ok) {
        setLedgerDesc('');
        setLedgerAmount('');
        setLedgerAgency('');
        setPaymentMethod('Cash');
        fetchExpenses();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredContacts = contacts.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.category.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.phone.includes(searchQuery)
  );

  const filteredExpenses = expenses.filter(exp => 
    exp.description.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (exp.agencyName && exp.agencyName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const totalExpenseSum = expenses.reduce((sum, item) => sum + item.amount, 0);

  return (
    <div className="fade-in">
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon primary">
            <BookOpen size={24} />
          </div>
          <div>
            <div className="stat-value">{contacts.length}</div>
            <div className="stat-label">Contacts Registered</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon success">
            <DollarSign size={24} />
          </div>
          <div>
            <div className="stat-value">₹ {totalExpenseSum.toFixed(2)}</div>
            <div className="stat-label">Total Outflow Ledger</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
        <button 
          className={`btn ${tab === 'contacts' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => { setTab('contacts'); setSearchQuery(''); }}
        >
          📁 Phone Book / Directory
        </button>
        <button 
          className={`btn ${tab === 'ledger' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => { setTab('ledger'); setSearchQuery(''); }}
        >
          🪙 Pharmacy & Expense Ledger
        </button>
      </div>

      {tab === 'contacts' && (
        <div className="grid-2">
          <div className="card">
            <h3 style={{ marginBottom: '1rem', fontSize: '1.25rem' }}>Utility & Agency Contacts</h3>
            
            <div style={{ marginBottom: '1rem', position: 'relative' }}>
              <Search style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-muted)' }} size={18} />
              <input 
                type="text" 
                className="form-input" 
                style={{ paddingLeft: '2.5rem' }} 
                placeholder="Search directory (e.g. Plumber, Agency)..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '2rem' }}>Loading directory...</div>
            ) : filteredContacts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No directory entries match.</div>
            ) : (
              <div className="table-container" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Name / Contact</th>
                      <th>Category</th>
                      <th>Amount / Balance</th>
                      <th>Notes</th>
                      <th style={{ textAlign: 'right' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredContacts.map(c => (
                      <tr key={c.id}>
                        <td>
                          <div style={{ fontWeight: 600 }}>{c.name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                            <Phone size={10} /> {c.phone}
                          </div>
                        </td>
                        <td>
                          <span className="badge badge-active" style={{ fontSize: '0.75rem' }}>{c.category}</span>
                        </td>
                        <td style={{ fontWeight: 700, color: 'var(--accent)' }}>
                          ₹ {c.amount ? c.amount.toFixed(2) : '0.00'}
                        </td>
                        <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{c.details || '--'}</td>
                        <td style={{ textAlign: 'right' }}>
                          <button className="btn-logout" onClick={() => handleDeleteContact(c.id)} title="Delete Contact">
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="card">
            <h3 style={{ marginBottom: '1.5rem', fontSize: '1.25rem' }}>Create New Directory Entry</h3>
            {formError && <div style={{ color: 'var(--danger)', fontSize: '0.85rem', marginBottom: '1rem' }}>{formError}</div>}
            
            <form onSubmit={handleAddContact}>
              <div className="form-group">
                <label className="form-label">Contact Name</label>
                <input type="text" className="form-input" placeholder="e.g. Kumar Plumber, Sri Balaji Meds" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>

              <div className="form-group">
                <label className="form-label">Category</label>
                <select className="form-input" value={category} onChange={(e) => setCategory(e.target.value)}>
                  <option value="Plumber">Plumber / Utility</option>
                  <option value="Agency">Meds Supply Agency</option>
                  <option value="Town/Ooru">Town / Ooru Directory</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <select 
                    className="form-input" 
                    style={{ width: '80px', flexShrink: 0, fontWeight: 600, fontSize: '0.85rem', padding: '0.4rem 0.25rem' }}
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                  >
                    <option value="+91">🇮🇳 +91</option>
                    <option value="+1">🇺🇸 +1</option>
                    <option value="+44">🇬🇧 +44</option>
                    <option value="+971">🇦🇪 +971</option>
                    <option value="+966">🇸🇦 +966</option>
                    <option value="+65">🇸🇬 +65</option>
                    <option value="+61">🇦🇺 +61</option>
                    <option value="+94">🇱🇰 +94</option>
                  </select>
                  <input 
                    type="tel" 
                    className="form-input" 
                    placeholder="10-digit number" 
                    value={phone} 
                    onChange={handlePhoneChange} 
                    maxLength={10}
                    pattern="[0-9]{10}"
                    required 
                  />
                </div>
                {phone && phone.length > 0 && phone.length < 10 && (
                  <span style={{ fontSize: '0.75rem', color: '#ef4444', marginTop: '0.25rem', display: 'block' }}>
                    Must be exactly 10 digits ({phone.length}/10)
                  </span>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Amount / Balance Owed (Optional)</label>
                <input type="number" className="form-input" placeholder="₹ Amount" value={amount} onChange={(e) => setAmount(e.target.value)} />
              </div>

              <div className="form-group">
                <label className="form-label">Description / Place Details</label>
                <textarea className="form-input" rows="2" placeholder="e.g. Kollidam local branch" value={details} onChange={(e) => setDetails(e.target.value)} />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1.5rem' }}>
                Save Contact
              </button>
            </form>
          </div>
        </div>
      )}

      {tab === 'ledger' && (
        <div className="grid-2">
          <div className="card">
            <h3 style={{ marginBottom: '1rem', fontSize: '1.25rem' }}>Ledger & Outflow Transactions</h3>
            
            <div style={{ marginBottom: '1rem', position: 'relative' }}>
              <Search style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-muted)' }} size={18} />
              <input 
                type="text" 
                className="form-input" 
                style={{ paddingLeft: '2.5rem' }} 
                placeholder="Search ledger (e.g. purchase, supplier name)..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '2rem' }}>Loading ledger...</div>
            ) : filteredExpenses.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No expenses recorded.</div>
            ) : (
              <div className="table-container" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Type</th>
                      <th>Description</th>
                      <th>Agency / Recipient</th>
                      <th>Payment Method</th>
                      <th>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredExpenses.slice().reverse().map(exp => (
                      <tr key={exp.id}>
                        <td style={{ fontSize: '0.85rem' }}>{exp.date}</td>
                        <td>
                          <span className="badge badge-pending" style={{ fontSize: '0.7rem' }}>{exp.type}</span>
                        </td>
                        <td style={{ fontWeight: 600 }}>{exp.description}</td>
                        <td>{exp.agencyName || '--'}</td>
                        <td>
                          <span className="badge" style={{
                            fontSize: '0.75rem',
                            background: exp.paymentMethod === 'UPI / GPay' ? 'rgba(59, 130, 246, 0.12)' : exp.paymentMethod === 'Card' ? 'rgba(168, 85, 247, 0.12)' : exp.paymentMethod === 'Net Banking' ? 'rgba(245, 158, 11, 0.12)' : 'rgba(16, 185, 129, 0.12)',
                            color: exp.paymentMethod === 'UPI / GPay' ? '#2563eb' : exp.paymentMethod === 'Card' ? '#7e22ce' : exp.paymentMethod === 'Net Banking' ? '#b45309' : '#047857',
                            border: '1px solid rgba(0,0,0,0.08)'
                          }}>
                            {exp.paymentMethod || 'Cash'}
                          </span>
                        </td>
                        <td style={{ fontWeight: 700, color: 'var(--danger)' }}>₹ {exp.amount.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="card">
            <h3 style={{ marginBottom: '1.5rem', fontSize: '1.25rem' }}>Record Ledger Transaction</h3>
            
            <form onSubmit={handleAddLedger}>
              <div className="form-group">
                <label className="form-label">Transaction Type</label>
                <select className="form-input" value={ledgerType} onChange={(e) => setLedgerType(e.target.value)}>
                  <option value="Purchase">Meds Purchase</option>
                  <option value="Agency Payment">Agency Payment / Payout</option>
                  <option value="General Expense">Hospital General Expense</option>
                  <option value="Sale">Other Sales Ref</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <input type="text" className="form-input" placeholder="e.g. Batch #405 Purchase, Plumbing works" value={ledgerDesc} onChange={(e) => setLedgerDesc(e.target.value)} required />
              </div>

              <div className="form-group">
                <label className="form-label">Agency / Vendor Name (Optional)</label>
                <input type="text" className="form-input" placeholder="e.g. Sri Krishna Agency" value={ledgerAgency} onChange={(e) => setLedgerAgency(e.target.value)} />
              </div>

              <div className="form-group">
                <label className="form-label">Payment Method (Cash / UPI / Card)</label>
                <select className="form-input" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                  <option value="Cash">Cash</option>
                  <option value="UPI / GPay">UPI / GPay</option>
                  <option value="Card">Card / POS</option>
                  <option value="Net Banking">Net Banking / NEFT</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Amount (₹)</label>
                <input type="number" className="form-input" placeholder="Amount in ₹" value={ledgerAmount} onChange={(e) => setLedgerAmount(e.target.value)} required />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1.5rem' }}>
                Log Transaction
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DirectoryLedger;

// Ported from Oatmeal Farm Network (src/AccountTeamMembers.jsx). Logic is unchanged;
// only the router package, i18n hook, component paths and API base differ.
import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router';
import { useTranslation } from '../lib/i18n';
import AccountLayout from '../components/AccountLayout';
import { useAccount } from '../lib/AccountContext';

const API_URL = import.meta.env.VITE_LIVESTOCK_API_URL || '';
// Over The Fence / Cassia are Oatmeal Farm Network integrations with no
// counterpart on the LOA backend. Both call sites are inside try/catch, so
// leaving this unset simply makes them inert. Set VITE_OTF_API_URL to enable.
const OTF_API = import.meta.env.VITE_OTF_API_URL || '';

async function syncOTFCommunity(businessId) {
  try {
    const token    = localStorage.getItem('access_token') || '';
    const peopleId = localStorage.getItem('people_id') || '0';
    await fetch(`${OTF_API}/api/admin/mill/communities/sync-business/${businessId}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'x-people-id': peopleId },
    });
  } catch { /* non-blocking */ }
}

const ACCESS_LEVELS = [
  { id: 1, label: 'View only' },
  { id: 2, label: 'Editor' },
  { id: 3, label: 'Admin / Owner' },
];

function authHeaders() {
  const token = localStorage.getItem('access_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function AccountTeamMembers() {
  const { t } = useTranslation();
  const [params] = useSearchParams();
  const BusinessID = parseInt(params.get('BusinessID') || '0', 10);
  const PeopleID = parseInt(localStorage.getItem('people_id') || localStorage.getItem('PeopleID') || '0', 10);
  const { Business, LoadBusiness } = useAccount();

  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [savedMessage, setSavedMessage] = useState(null);

  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({
    Email: '',
    PeopleFirstName: '',
    PeopleLastName: '',
    AccessLevelID: 2,
    Role: 'Staff',
  });
  const [addBusy, setAddBusy] = useState(false);

  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ AccessLevelID: 1, Role: '', PeopleFirstName: '', PeopleLastName: '', PeopleEmail: '' });
  const [editBusy, setEditBusy] = useState(false);

  useEffect(() => {
    if (BusinessID) LoadBusiness(BusinessID);
  }, [BusinessID]);

  const loadMembers = async () => {
    if (!BusinessID) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/auth/business-members?BusinessID=${BusinessID}`, {
        headers: authHeaders(),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.detail || t('team_members.err_load'));
      }
      setMembers(await res.json());
    } catch (e) {
      setError(e.message || t('team_members.err_load'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadMembers(); }, [BusinessID]);

  const flash = (msg) => {
    setSavedMessage(msg);
    setTimeout(() => setSavedMessage(null), 3000);
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!addForm.Email.trim()) return;
    setAddBusy(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/auth/business-members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ BusinessID, ...addForm }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.detail || t('team_members.err_add'));
      }
      setAddForm({ Email: '', PeopleFirstName: '', PeopleLastName: '', AccessLevelID: 2, Role: 'Staff' });
      setShowAdd(false);
      flash(t('team_members.flash_added'));
      syncOTFCommunity(BusinessID);
      await loadMembers();
    } catch (e) {
      setError(e.message || t('team_members.err_add'));
    } finally {
      setAddBusy(false);
    }
  };

  const startEdit = (m) => {
    setEditingId(m.BusinessAccessID);
    setEditForm({
      AccessLevelID: m.AccessLevelID || 1,
      Role: m.Role || '',
      PeopleFirstName: m.PeopleFirstName || '',
      PeopleLastName: m.PeopleLastName || '',
      PeopleEmail: m.PeopleEmail || '',
    });
  };

  const handleSaveEdit = async (id) => {
    setEditBusy(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/auth/business-members/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify(editForm),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.detail || t('team_members.err_update'));
      }
      setEditingId(null);
      flash(t('team_members.flash_updated'));
      await loadMembers();
    } catch (e) {
      setError(e.message || t('team_members.err_update'));
    } finally {
      setEditBusy(false);
    }
  };

  const handleDelete = async (m, hard = false) => {
    if (m.PeopleID === PeopleID) {
      setError(t('team_members.err_cant_remove_self'));
      return;
    }
    const name = `${m.PeopleFirstName || ''} ${m.PeopleLastName || ''}`.trim() || m.PeopleEmail;
    const confirmMsg = hard
      ? t('team_members.confirm_delete_hard', { name })
      : t('team_members.confirm_remove', { name });
    if (!window.confirm(confirmMsg)) return;
    setError(null);
    try {
      const url = `${API_URL}/auth/business-members/${m.BusinessAccessID}${hard ? '?hard=true' : ''}`;
      const res = await fetch(url, { method: 'DELETE', headers: authHeaders() });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.detail || t('team_members.err_remove'));
      }
      flash(hard ? t('team_members.flash_deleted') : t('team_members.flash_removed'));
      await loadMembers();
    } catch (e) {
      setError(e.message || t('team_members.err_remove'));
    }
  };

  const handleReactivate = async (m) => {
    setError(null);
    try {
      const res = await fetch(`${API_URL}/auth/business-members/${m.BusinessAccessID}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ Active: 1 }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.detail || t('team_members.err_reactivate'));
      }
      flash(t('team_members.flash_reactivated'));
      await loadMembers();
    } catch (e) {
      setError(e.message || t('team_members.err_reactivate'));
    }
  };

  const accessLabel = (id) => {
    const lvl = ACCESS_LEVELS.find(a => a.id === id);
    if (!lvl) return `Level ${id ?? '?'}`;
    return t('team_members.access_' + lvl.id, { defaultValue: lvl.label });
  };

  return (
    <AccountLayout
      pageTitle={t('team_members.page_title')}
      breadcrumbs={[
        { label: t('nav.dashboard'), to: '/dashboard' },
        { label: t('team_members.page_title') },
      ]}
    >
      <div className="bg-white rounded-2xl shadow border border-gray-200 p-6 max-w-5xl mx-auto">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('team_members.heading')}</h1>
            <p className="text-sm text-gray-500 mt-1">
              {t('team_members.subheading', { name: Business?.BusinessName || t('team_members.this_business') })}
            </p>
          </div>
          {!showAdd && (
            <button
              type="button"
              onClick={() => setShowAdd(true)}
              className="bg-[#3D6B34] hover:bg-[#2f5427] text-white rounded-lg px-4 py-2 text-sm font-semibold whitespace-nowrap"
            >
              {t('team_members.btn_add_user')}
            </button>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-300 text-red-700 rounded px-3 py-2 text-sm mb-4">
            {error}
          </div>
        )}
        {savedMessage && (
          <div className="bg-green-50 border border-green-300 text-green-700 rounded px-3 py-2 text-sm mb-4">
            {savedMessage}
          </div>
        )}

        {showAdd && (
          <form
            onSubmit={handleAdd}
            className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-6"
          >
            <h2 className="text-sm font-semibold text-gray-700 mb-3">{t('team_members.form_title')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-gray-600 mb-1">{t('team_members.label_email')}</label>
                <input
                  type="email"
                  required
                  value={addForm.Email}
                  onChange={e => setAddForm(f => ({ ...f, Email: e.target.value }))}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                  placeholder="user@example.com"
                />
                <p className="text-[11px] text-gray-500 mt-1">
                  {t('team_members.email_hint')}
                </p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">{t('team_members.label_first_name')}</label>
                <input
                  type="text"
                  value={addForm.PeopleFirstName}
                  onChange={e => setAddForm(f => ({ ...f, PeopleFirstName: e.target.value }))}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">{t('team_members.label_last_name')}</label>
                <input
                  type="text"
                  value={addForm.PeopleLastName}
                  onChange={e => setAddForm(f => ({ ...f, PeopleLastName: e.target.value }))}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">{t('team_members.label_access')}</label>
                <select
                  value={addForm.AccessLevelID}
                  onChange={e => setAddForm(f => ({ ...f, AccessLevelID: parseInt(e.target.value, 10) }))}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                >
                  {ACCESS_LEVELS.map(a => (
                    <option key={a.id} value={a.id}>{t('team_members.access_' + a.id, { defaultValue: a.label })}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">{t('team_members.label_role')}</label>
                <input
                  type="text"
                  value={addForm.Role}
                  onChange={e => setAddForm(f => ({ ...f, Role: e.target.value }))}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                  placeholder={t('team_members.placeholder_role')}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button
                type="button"
                onClick={() => setShowAdd(false)}
                className="border border-gray-300 rounded px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                {t('team_members.btn_cancel')}
              </button>
              <button
                type="submit"
                disabled={addBusy || !addForm.Email.trim()}
                className="bg-[#3D6B34] hover:bg-[#2f5427] text-white rounded px-4 py-2 text-sm font-semibold disabled:opacity-50"
              >
                {addBusy ? t('team_members.btn_adding') : t('team_members.btn_add_user')}
              </button>
            </div>
          </form>
        )}

        {loading ? (
          <p className="text-gray-500 text-sm">{t('team_members.loading')}</p>
        ) : members.length === 0 ? (
          <p className="text-gray-500 text-sm italic">{t('team_members.no_members')}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-gray-500 border-b border-gray-200">
                  <th className="py-2 pr-3">{t('team_members.th_name')}</th>
                  <th className="py-2 pr-3">{t('team_members.th_email')}</th>
                  <th className="py-2 pr-3">{t('team_members.th_access')}</th>
                  <th className="py-2 pr-3">{t('team_members.th_role')}</th>
                  <th className="py-2 pr-3">{t('team_members.th_status')}</th>
                  <th className="py-2 pr-3 text-right">{t('team_members.th_actions')}</th>
                </tr>
              </thead>
              <tbody>
                {members.map(m => {
                  const isEditing = editingId === m.BusinessAccessID;
                  const isSelf = m.PeopleID === PeopleID;
                  const isActive = Number(m.Active) === 1;
                  const fullName = `${m.PeopleFirstName || ''} ${m.PeopleLastName || ''}`.trim() || '—';
                  return (
                    <tr key={m.BusinessAccessID} className="border-b border-gray-100">
                      <td className="py-2 pr-3 text-gray-800">
                        {isEditing ? (
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={editForm.PeopleFirstName}
                              onChange={e => setEditForm(f => ({ ...f, PeopleFirstName: e.target.value }))}
                              placeholder={t('team_members.label_first_name')}
                              className="border border-gray-300 rounded px-2 py-1 text-xs w-24"
                            />
                            <input
                              type="text"
                              value={editForm.PeopleLastName}
                              onChange={e => setEditForm(f => ({ ...f, PeopleLastName: e.target.value }))}
                              placeholder={t('team_members.label_last_name')}
                              className="border border-gray-300 rounded px-2 py-1 text-xs w-24"
                            />
                          </div>
                        ) : (
                          <>
                            {fullName}
                            {isSelf && <span className="ml-2 text-[10px] uppercase tracking-wide text-gray-400">{t('team_members.you')}</span>}
                          </>
                        )}
                      </td>
                      <td className="py-2 pr-3 text-gray-600">
                        {isEditing ? (
                          <input
                            type="email"
                            value={editForm.PeopleEmail}
                            onChange={e => setEditForm(f => ({ ...f, PeopleEmail: e.target.value }))}
                            placeholder={t('team_members.label_email')}
                            className="border border-gray-300 rounded px-2 py-1 text-xs w-48"
                          />
                        ) : (
                          m.PeopleEmail || '—'
                        )}
                      </td>
                      <td className="py-2 pr-3">
                        {isEditing ? (
                          <select
                            value={editForm.AccessLevelID}
                            onChange={e => setEditForm(f => ({ ...f, AccessLevelID: parseInt(e.target.value, 10) }))}
                            className="border border-gray-300 rounded px-2 py-1 text-xs"
                          >
                            {ACCESS_LEVELS.map(a => (
                              <option key={a.id} value={a.id}>{t('team_members.access_' + a.id, { defaultValue: a.label })}</option>
                            ))}
                          </select>
                        ) : (
                          accessLabel(m.AccessLevelID)
                        )}
                      </td>
                      <td className="py-2 pr-3">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editForm.Role}
                            onChange={e => setEditForm(f => ({ ...f, Role: e.target.value }))}
                            className="border border-gray-300 rounded px-2 py-1 text-xs w-32"
                          />
                        ) : (
                          m.Role || '—'
                        )}
                      </td>
                      <td className="py-2 pr-3">
                        {isActive ? (
                          <span className="text-green-700 text-xs font-semibold">{t('team_members.status_active')}</span>
                        ) : (
                          <span className="text-gray-400 text-xs">{t('team_members.status_revoked')}</span>
                        )}
                      </td>
                      <td className="py-2 pr-3">
                        <div className="flex justify-end gap-2">
                          {isEditing ? (
                            <>
                              <button
                                type="button"
                                onClick={() => setEditingId(null)}
                                className="text-xs border border-gray-300 rounded px-3 py-1 text-gray-700 hover:bg-gray-50"
                              >
                                {t('team_members.btn_cancel')}
                              </button>
                              <button
                                type="button"
                                disabled={editBusy}
                                onClick={() => handleSaveEdit(m.BusinessAccessID)}
                                className="text-xs bg-[#3D6B34] hover:bg-[#2f5427] text-white rounded px-3 py-1 font-semibold disabled:opacity-50"
                              >
                                {editBusy ? t('team_members.btn_saving') : t('team_members.btn_save')}
                              </button>
                            </>
                          ) : isActive ? (
                            <>
                              <button
                                type="button"
                                onClick={() => startEdit(m)}
                                className="text-xs border border-gray-300 rounded px-3 py-1 text-gray-700 hover:bg-gray-50"
                              >
                                {t('team_members.btn_edit')}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDelete(m)}
                                disabled={isSelf}
                                title={isSelf ? t('team_members.err_cant_remove_self') : ''}
                                className="text-xs border border-red-300 rounded px-3 py-1 text-red-700 hover:bg-red-50 disabled:opacity-40 disabled:cursor-not-allowed"
                              >
                                {t('team_members.btn_remove')}
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() => handleReactivate(m)}
                                className="text-xs bg-[#3D6B34] hover:bg-[#2f5427] text-white rounded px-3 py-1 font-semibold"
                              >
                                {t('team_members.btn_reactivate')}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDelete(m, true)}
                                disabled={isSelf}
                                title={isSelf ? t('team_members.title_cant_delete_self') : t('team_members.title_delete_forever')}
                                className="text-xs border border-red-300 rounded px-3 py-1 text-red-700 hover:bg-red-50 disabled:opacity-40 disabled:cursor-not-allowed"
                              >
                                {t('team_members.btn_delete_forever')}
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-6">
          <Link
            to="/dashboard"
            className="text-sm text-[#3D6B34] hover:underline"
          >
            {t('team_members.back_to_dashboard')}
          </Link>
        </div>
      </div>
    </AccountLayout>
  );
}

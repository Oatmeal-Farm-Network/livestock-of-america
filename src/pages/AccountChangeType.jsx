// Ported from Oatmeal Farm Network (src/AccountChangeType.jsx). Page logic is unchanged;
// only the router package, the i18n hook, component paths, the API base env
// var and the people-id accessor differ. The LOA backend already serves the
// same endpoints this calls.
import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router';
import { useTranslation } from '../lib/i18n';
import AccountLayout from '../components/AccountLayout';
import { useAccount } from '../lib/AccountContext';
import { getPeopleId } from '../lib/auth';

export default function AccountChangeType() {
  const { t } = useTranslation();
  const [SearchParams] = useSearchParams();
  const BusinessID = SearchParams.get('BusinessID');
  const PeopleID = getPeopleId();
  const { Business, LoadBusiness } = useAccount();

  const [BusinessTypes, setBusinessTypes] = useState([]);
  const [SelectedTypeID, setSelectedTypeID] = useState('');
  const [Success, setSuccess] = useState(false);
  const [Loading, setLoading] = useState(true);

  useEffect(() => {
    LoadBusiness(BusinessID);

    fetch(`${import.meta.env.VITE_LIVESTOCK_API_URL}/auth/business-types`)
      .then(Res => Res.json())
      .then(Data => {
        setBusinessTypes(Data);
        setLoading(false);
      });
  }, [BusinessID]);

  useEffect(() => {
    if (Business) setSelectedTypeID(Business.BusinessTypeID);
  }, [Business]);

  const HandleSubmit = async (e) => {
  e.preventDefault();
  const Response = await fetch(
    `${import.meta.env.VITE_LIVESTOCK_API_URL}/auth/change-business-type?BusinessID=${BusinessID}&BusinessTypeID=${SelectedTypeID}`,
    { method: 'PUT' }
  );
  if (Response.ok) {
    setSuccess(true);
    LoadBusiness(BusinessID, true); // force reload so sidebar updates
  }
};

  if (!Business || Loading) return <div className="p-8 text-gray-500">{t('change_type.loading')}</div>;

  return (
    <AccountLayout Business={Business} BusinessID={BusinessID} PeopleID={PeopleID} pageTitle={t('change_type.page_title')} breadcrumbs={[{ label: t('nav.dashboard'), to: '/dashboard' }, { label: t('change_type.breadcrumb_settings') }, { label: t('change_type.page_title') }]}>

      <div className="bg-white rounded-2xl shadow border border-gray-200 p-6 mx-w-full" >
        <h1 className="text-2xl font-bold text-gray-900 mb-6">{t('change_type.heading')}</h1>

        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-6">
          <h2 className="text-lg font-bold text-gray-800">{Business?.BusinessName}</h2>
          <p className="text-gray-500 text-sm mt-1">{Business?.BusinessType} {t('change_type.account_label')}</p>
        </div>

        {Success && (
          <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 mb-6 text-sm font-medium">
            {t('change_type.success')}
          </div>
        )}

        <form onSubmit={HandleSubmit}>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            {t('change_type.label_type')}
          </label>
          <div className="flex gap-3">
            <select
              value={SelectedTypeID}
              onChange={(e) => setSelectedTypeID(e.target.value)}
              required
              className="flex-grow border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#819360] focus:ring-2 focus:ring-[#819360]/20"
            >
              <option value="">{t('change_type.select_type')}</option>
              {BusinessTypes.map(T => (
                <option key={T.BusinessTypeID} value={T.BusinessTypeID}>
                  {T.BusinessType}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="regsubmit2"
            >
              {t('change_type.btn_change')}
            </button>
          </div>
        </form>

        <div className="mt-6">
          <Link
            to={`/account?BusinessID=${BusinessID}`}
            className="text-sm text-[#3D6B34] hover:underline"
          >
            {t('change_type.back_link')}
          </Link>
        </div>
      </div>

    </AccountLayout>
  );
}
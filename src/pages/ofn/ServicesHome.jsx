// Ported from Oatmeal Farm Network (src/ServicesHome.jsx). Mechanical adaptations
// only: router package, i18n hook, component paths, API base env var,
// people-id accessor.
import React, { useEffect, useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router';
import { useTranslation } from '../../lib/i18n';
import AccountLayout from '../../components/AccountLayout';
import { useAccount } from '../../lib/AccountContext';
import { getPeopleId } from '../../lib/auth';

const apiBase = import.meta.env.VITE_LIVESTOCK_API_URL || '';

export default function ServicesHome() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const BusinessID = searchParams.get('BusinessID');
  const PeopleID = getPeopleId();
  const { Business, LoadBusiness } = useAccount();

  const [Services, setServices] = useState([]);
  const [Loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (!BusinessID) return;
    LoadBusiness(BusinessID);

    fetch(`${apiBase}/api/services?BusinessID=${BusinessID}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` },
    })
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(data => {
        setServices(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching services:', err);
        setHasError(true);
        setLoading(false);
      });
  }, [BusinessID]);

  if (!Business || Loading) return <div className="p-8 text-gray-500">{t('services_home.loading')}</div>;
  if (hasError) return <div className="p-8 text-red-600">{t('services_home.error')}</div>;

  return (
    <AccountLayout Business={Business} BusinessID={BusinessID} PeopleID={PeopleID}
      pageTitle={t('services_home.page_title')}
      breadcrumbs={[
        { label: t('services_home.breadcrumb_dashboard'), to: '/dashboard' },
        { label: t('services_home.breadcrumb_services') },
        { label: t('services_home.page_title') },
      ]}>
      <div className="bg-white rounded-2xl shadow border border-gray-200 p-6">

        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-green-700">{t('services_home.heading')}</h2>
          <Link to={`/services/add?BusinessID=${BusinessID}`} className="regsubmit2">
            {t('services_home.btn_add')}
          </Link>
        </div>

        {Services.length === 0 ? (
          <p className="text-gray-500 text-sm">
            {t('services_home.empty')}{' '}
            <Link to={`/services/add?BusinessID=${BusinessID}`} className="text-[#3D6B34] hover:underline">
              {t('services_home.empty_cta')}
            </Link>
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-gray-300">
                  <th className="text-left py-3 px-2 text-gray-600 font-semibold">{t('services_home.th_service')}</th>
                  <th className="text-left py-3 px-2 text-gray-600 font-semibold hidden md:table-cell">{t('services_home.th_available')}</th>
                  <th className="text-left py-3 px-2 text-gray-600 font-semibold hidden md:table-cell">{t('services_home.th_price')}</th>
                  <th className="text-right py-3 px-2 text-gray-600 font-semibold">{t('services_home.th_options')}</th>
                </tr>
              </thead>
              <tbody>
                {Services.map(Service => (
                  <React.Fragment key={Service.ServicesID}>
                    <tr className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-2">
                        <span
                          onClick={() => navigate(`/services/edit?BusinessID=${BusinessID}&ServicesID=${Service.ServicesID}`)}
                          className="cursor-pointer text-[#5a3e2b] underline hover:text-[#3a2010]"
                        >
                          {Service.ServiceTitle}
                        </span>
                      </td>
                      <td className="py-3 px-2 hidden md:table-cell text-gray-600">
                        {Service.ServiceAvailable || '—'}
                      </td>
                      <td className="py-3 px-2 hidden md:table-cell text-gray-600">
                        {Service.ServicePrice
                          ? `$${parseFloat(Service.ServicePrice).toLocaleString()}`
                          : Service.ServiceContactForPrice === 'Yes'
                          ? t('services_home.contact_for_price')
                          : '—'}
                      </td>
                      <td className="py-3 px-2 text-right">
                        <div className="flex justify-end gap-3 items-center">
                          <button
                            onClick={() => navigate(`/services/edit?BusinessID=${BusinessID}&ServicesID=${Service.ServicesID}`)}
                            className="text-[#5a3e2b] hover:underline text-xs font-medium"
                          >
                            {t('services_home.btn_edit')}
                          </button>
                          <span className="text-gray-300">|</span>
                          <Link
                            to={`/services/photos?BusinessID=${BusinessID}&ServicesID=${Service.ServicesID}`}
                            className="text-[#3D6B34] hover:underline text-xs"
                          >
                            {t('services_home.btn_photos')}
                          </Link>
                          <span className="text-gray-300">|</span>
                          <Link
                            to={`/services/delete?BusinessID=${BusinessID}&ServicesID=${Service.ServicesID}`}
                            className="text-red-500 hover:underline text-xs"
                          >
                            {t('services_home.btn_delete')}
                          </Link>
                        </div>
                      </td>
                    </tr>
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AccountLayout>
  );
}

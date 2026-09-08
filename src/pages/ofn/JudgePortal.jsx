// Ported from Oatmeal Farm Network (src/JudgePortal.jsx). Mechanical adaptations
// only: router package, i18n hook, component paths, API base env var,
// people-id accessor.
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import { useTranslation } from '../../lib/i18n';

const API = import.meta.env.VITE_LIVESTOCK_API_URL || '';
const inp = "border border-gray-300 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:border-[#819360]";

export default function JudgePortal() {
  const { t } = useTranslation();
  const { accessCode } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [activeCat, setActiveCat] = useState(null);
  const [activeEntry, setActiveEntry] = useState(null);
  const [scores, setScores] = useState({}); // entryId:criterionId -> { Points, Comment }
  const [savingKey, setSavingKey] = useState(null);
  const [savedKey, setSavedKey] = useState(null);

  const load = () => {
    setLoading(true);
    fetch(`${API}/api/events/competition/judge/${accessCode}`)
      .then(r => {
        if (!r.ok) throw new Error(t('judge_portal.err_invalid_code'));
        return r.json();
      })
      .then(d => {
        setData(d);
        const flat = {};
        (d.Categories || []).forEach(cat => {
          Object.entries(cat.MyScores || {}).forEach(([k, v]) => {
            flat[k] = { Points: v.Points, Comment: v.Comment || '' };
          });
        });
        setScores(flat);
        if (d.Categories && d.Categories.length) {
          setActiveCat(d.Categories[0].CategoryID);
          if (d.Categories[0].Entries?.length) {
            setActiveEntry(d.Categories[0].Entries[0].EntryID);
          }
        }
      })
      .catch(ex => setErr(ex.message))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, [accessCode]);

  const saveScore = async (entryId, criterion) => {
    const key = `${entryId}:${criterion.CriterionID}`;
    const s = scores[key] || {};
    setSavingKey(key);
    try {
      await fetch(`${API}/api/events/competition/entries/${entryId}/scores`, {
        method: 'POST', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          JudgeID: data.Judge.JudgeID,
          CriterionID: criterion.CriterionID,
          Points: Number(s.Points) || 0,
          Comment: s.Comment || '',
        }),
      });
      setSavedKey(key);
      setTimeout(() => setSavedKey(k => k === key ? null : k), 1500);
    } finally {
      setSavingKey(null);
    }
  };

  if (loading) return <div className="min-h-screen bg-[#FAF7EE] flex items-center justify-center text-sm text-gray-500">{t('judge_portal.loading')}</div>;
  if (err) return (
    <div className="min-h-screen bg-[#FAF7EE] flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow p-6 max-w-md text-center">
        <div className="text-lg font-semibold text-red-600 mb-2">{err}</div>
        <p className="text-sm text-gray-600">{t('judge_portal.err_revoked')}</p>
      </div>
    </div>
  );
  if (!data) return null;

  const cat = data.Categories.find(c => c.CategoryID === activeCat) || data.Categories[0];
  const entry = cat?.Entries.find(e => e.EntryID === activeEntry) || cat?.Entries[0];

  return (
    <div className="min-h-screen bg-[#FAF7EE]">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-baseline justify-between">
          <div>
            <div className="text-xs text-gray-500">{data.Event.EventName}</div>
            <div className="font-semibold text-[#3D6B34]">{t('judge_portal.judge_label', { name: data.Judge.JudgeName })}</div>
          </div>
          {data.Judge.Credentials && (
            <div className="text-xs text-gray-400">{data.Judge.Credentials}</div>
          )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-4">
        {data.Categories.length === 0 && (
          <div className="bg-white rounded-xl shadow p-6 text-sm text-gray-600">
            {t('judge_portal.no_categories')}
          </div>
        )}

        {data.Categories.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-1 space-y-3">
              <div>
                <div className="text-xs uppercase text-gray-500 mb-2">{t('judge_portal.categories_heading')}</div>
                <div className="space-y-1">
                  {data.Categories.map(c => (
                    <button key={c.CategoryID}
                      onClick={() => { setActiveCat(c.CategoryID); setActiveEntry(c.Entries[0]?.EntryID || null); }}
                      className={`block w-full text-left px-3 py-2 rounded-lg text-sm ${c.CategoryID === activeCat
                        ? 'bg-[#3D6B34] text-white'
                        : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'}`}>
                      {c.CategoryName}
                      <div className={`text-xs mt-0.5 ${c.CategoryID === activeCat ? 'text-white/80' : 'text-gray-500'}`}>
                        {c.Entries.length} {c.Entries.length === 1 ? t('judge_portal.entry_singular') : t('judge_portal.entry_plural')}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {cat && (
                <div>
                  <div className="text-xs uppercase text-gray-500 mb-2">{t('judge_portal.entries_heading')}</div>
                  <div className="space-y-1">
                    {cat.Entries.map(e => {
                      const scoredCount = (cat.Criteria || []).filter(cr =>
                        scores[`${e.EntryID}:${cr.CriterionID}`]?.Points > 0
                      ).length;
                      const done = scoredCount === cat.Criteria.length && cat.Criteria.length > 0;
                      return (
                        <button key={e.EntryID}
                          onClick={() => setActiveEntry(e.EntryID)}
                          className={`block w-full text-left px-3 py-2 rounded-lg text-sm ${e.EntryID === activeEntry
                            ? 'bg-white border border-[#3D6B34] text-[#3D6B34]'
                            : 'bg-white border border-gray-200 text-gray-700 hover:border-gray-300'}`}>
                          <div className="flex items-center justify-between">
                            <span className="font-medium truncate">
                              {e.EntryNumber ? `#${e.EntryNumber} — ` : ''}{e.EntrantName}
                            </span>
                            {done && <span className="text-xs text-green-600">✓</span>}
                          </div>
                          {e.EntryTitle && (
                            <div className="text-xs text-gray-500 truncate">{e.EntryTitle}</div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="md:col-span-3">
              {entry ? (
                <div className="bg-white rounded-xl shadow p-5">
                  <div className="mb-4 pb-3 border-b border-gray-100">
                    <div className="text-xs text-gray-500">{t('judge_portal.entry_label', { n: entry.EntryNumber || entry.EntryID })}</div>
                    <div className="text-lg font-semibold text-gray-800">{entry.EntrantName}</div>
                    {entry.EntryTitle && <div className="text-sm text-gray-600">{entry.EntryTitle}</div>}
                    {entry.EntryNotes && (
                      <div className="text-xs text-gray-500 mt-2 whitespace-pre-line">{entry.EntryNotes}</div>
                    )}
                    {entry.PhotoURL && (
                      <img src={entry.PhotoURL} alt="" className="mt-3 max-h-48 rounded-lg" />
                    )}
                  </div>

                  <div className="space-y-4">
                    {cat.Criteria.length === 0 && (
                      <div className="text-sm text-gray-500">{t('judge_portal.no_criteria')}</div>
                    )}
                    {cat.Criteria.map(cr => {
                      const key = `${entry.EntryID}:${cr.CriterionID}`;
                      const s = scores[key] || {};
                      return (
                        <div key={cr.CriterionID} className="border border-gray-200 rounded-lg p-3">
                          <div className="flex items-baseline justify-between mb-2">
                            <div>
                              <div className="font-medium text-sm">{cr.CriterionName}</div>
                              {cr.Description && <div className="text-xs text-gray-500">{cr.Description}</div>}
                            </div>
                            <div className="text-xs text-gray-500 shrink-0 ml-3">{t('judge_portal.criterion_info', { max: cr.MaxPoints, weight: cr.Weight })}</div>
                          </div>
                          <div className="flex gap-2 items-start">
                            <input type="number" step="0.01" min="0" max={cr.MaxPoints}
                              className={inp + ' max-w-[110px]'} placeholder={t('judge_portal.placeholder_points')}
                              value={s.Points ?? ''}
                              onChange={e => setScores(x => ({ ...x, [key]: { ...(x[key] || {}), Points: e.target.value } }))}
                              onBlur={() => saveScore(entry.EntryID, cr)} />
                            <textarea rows={1} className={inp} placeholder={t('judge_portal.placeholder_comment')}
                              value={s.Comment || ''}
                              onChange={e => setScores(x => ({ ...x, [key]: { ...(x[key] || {}), Comment: e.target.value } }))}
                              onBlur={() => saveScore(entry.EntryID, cr)} />
                            <div className="text-xs text-gray-400 w-12 pt-2 text-right">
                              {savingKey === key ? '…' : savedKey === key ? '✓' : ''}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-xl shadow p-5 text-sm text-gray-500">
                  {t('judge_portal.hint_select_entry')}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Ported from Oatmeal Farm Network (src/AudioSettings.jsx). Mechanical adaptations
// only: router package, i18n hook, component paths, API base env var,
// people-id accessor.
import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router';
import { useTranslation } from '../../lib/i18n';
import AccountLayout from '../../components/AccountLayout';
import { useAccount } from '../../lib/AccountContext';
import { getPeopleId } from '../../lib/auth';

const STORAGE_MIC  = 'lavendir_mic_device_id';
const STORAGE_SPK  = 'lavendir_spk_device_id';
const STORAGE_TTS  = 'lavendir_tts_voice';

function DeviceSelect({ label, value, onChange, options, placeholder, deviceFallbackLabel }) {
  return (
    <div className="mb-5">
      <label className="block text-sm font-semibold text-gray-700 mb-1">{label}</label>
      <select
        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 bg-white"
        value={value}
        onChange={e => onChange(e.target.value)}
      >
        <option value="">{placeholder}</option>
        {options.map(d => (
          <option key={d.deviceId} value={d.deviceId}>
            {d.label || deviceFallbackLabel(d.deviceId)}
          </option>
        ))}
      </select>
    </div>
  );
}

export default function AudioSettings() {
  const { t } = useTranslation();
  const [searchParams]  = useSearchParams();
  const BusinessID      = searchParams.get('BusinessID');
  const PeopleID        = getPeopleId();
  const { Business, LoadBusiness } = useAccount();
  useEffect(() => { LoadBusiness(BusinessID); }, [BusinessID]);

  const [mics,    setMics]    = useState([]);
  const [spks,    setSpks]    = useState([]);
  const [voices,  setVoices]  = useState([]);
  const [selMic,  setSelMic]  = useState(localStorage.getItem(STORAGE_MIC)  || '');
  const [selSpk,  setSelSpk]  = useState(localStorage.getItem(STORAGE_SPK)  || '');
  const [selVoice,setSelVoice]= useState(localStorage.getItem(STORAGE_TTS)  || '');
  const [micLevel, setMicLevel] = useState(0);
  const [testingMic, setTestingMic] = useState(false);
  const [testingSpk, setTestingSpk] = useState(false);
  const [permError,  setPermError]  = useState('');
  const [saved, setSaved] = useState(false);

  const animRef  = useRef(null);
  const streamRef = useRef(null);
  const analyserRef = useRef(null);

  // Load available devices
  useEffect(() => {
    async function loadDevices() {
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true }).then(s => s.getTracks().forEach(t => t.stop()));
        const devices = await navigator.mediaDevices.enumerateDevices();
        setMics(devices.filter(d => d.kind === 'audioinput'));
        setSpks(devices.filter(d => d.kind === 'audiooutput'));
        setPermError('');
      } catch (e) {
        setPermError(t('audio_settings.perm_error_mic'));
      }
    }
    loadDevices();

    const loadVoices = () => {
      const v = window.speechSynthesis?.getVoices() || [];
      const enVoices = v.filter(v => v.lang.startsWith('en'));
      setVoices(enVoices);
      if (!localStorage.getItem(STORAGE_TTS) && enVoices.length) {
        const google = enVoices.find(v => v.name.includes('Google US English'));
        setSelVoice(google?.name || enVoices[0]?.name || '');
      }
    };
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    return () => { window.speechSynthesis.onvoiceschanged = null; };
  }, []);

  const startMicTest = async () => {
    setTestingMic(true);
    setMicLevel(0);
    try {
      const constraints = { audio: selMic ? { deviceId: { exact: selMic } } : true };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      const ctx = new AudioContext();
      const src = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      src.connect(analyser);
      analyserRef.current = analyser;

      const data = new Uint8Array(analyser.frequencyBinCount);
      const tick = () => {
        analyser.getByteFrequencyData(data);
        const avg = data.reduce((a, b) => a + b, 0) / data.length;
        setMicLevel(Math.min(100, avg * 2.5));
        animRef.current = requestAnimationFrame(tick);
      };
      tick();
    } catch (e) {
      setPermError(t('audio_settings.perm_error_access', { msg: e.message }));
      setTestingMic(false);
    }
  };

  const stopMicTest = () => {
    cancelAnimationFrame(animRef.current);
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    setMicLevel(0);
    setTestingMic(false);
  };

  const testSpeaker = async () => {
    setTestingSpk(true);
    try {
      const utt = new SpeechSynthesisUtterance(t('audio_settings.test_utterance'));
      if (selVoice) {
        const voice = window.speechSynthesis.getVoices().find(v => v.name === selVoice);
        if (voice) utt.voice = voice;
      }
      utt.lang  = 'en-US';
      utt.rate  = 1.0;
      utt.pitch = 1.0;
      utt.onend = () => setTestingSpk(false);
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utt);
    } catch { setTestingSpk(false); }
  };

  const save = () => {
    localStorage.setItem(STORAGE_MIC,  selMic);
    localStorage.setItem(STORAGE_SPK,  selSpk);
    localStorage.setItem(STORAGE_TTS,  selVoice);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const deviceFallbackLabel = (id) => t('audio_settings.device_label_fallback', { id: id.slice(0, 8) });

  return (
    <AccountLayout Business={Business} BusinessID={BusinessID} PeopleID={PeopleID}
      pageTitle={t('audio_settings.page_title')}
      breadcrumbs={[
        { label: t('audio_settings.crumb_dashboard'), to: '/dashboard' },
        { label: t('audio_settings.crumb_settings') },
        { label: t('audio_settings.crumb_audio') },
      ]}>
      <div style={{ maxWidth: 680, margin: '0 auto' }}>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">{t('audio_settings.heading')}</h1>
          <p className="text-sm text-gray-500">{t('audio_settings.desc')}</p>
        </div>

        {permError && (
          <div className="mb-5 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
            {permError}
          </div>
        )}

        {/* Microphone */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-5">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7C5CBF" strokeWidth="2">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/>
            </svg>
            <h2 className="font-bold text-gray-800">{t('audio_settings.section_mic')}</h2>
          </div>

          <DeviceSelect
            label={t('audio_settings.lbl_select_mic')}
            value={selMic}
            onChange={setSelMic}
            options={mics}
            placeholder={t('audio_settings.placeholder_system_default')}
            deviceFallbackLabel={deviceFallbackLabel}
          />

          <div className="mb-4">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-gray-500">{t('audio_settings.lbl_input_level')}</span>
              {testingMic && <span className="text-xs text-purple-600 animate-pulse">{t('audio_settings.recording_indicator')}</span>}
            </div>
            <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-75"
                style={{
                  width: `${micLevel}%`,
                  background: micLevel > 70 ? '#EF4444' : micLevel > 40 ? '#F59E0B' : '#7C5CBF'
                }}
              />
            </div>
          </div>

          <button
            onClick={testingMic ? stopMicTest : startMicTest}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors border ${
              testingMic
                ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100'
                : 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100'
            }`}
          >
            {testingMic ? t('audio_settings.btn_stop_test') : t('audio_settings.btn_test_mic')}
          </button>
          <p className="text-xs text-gray-400 mt-2">{t('audio_settings.mic_tip')}</p>
        </div>

        {/* Speaker / TTS Voice */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-5">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7C5CBF" strokeWidth="2">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>
            </svg>
            <h2 className="font-bold text-gray-800">{t('audio_settings.section_speaker')}</h2>
          </div>

          {spks.length > 0 && (
            <DeviceSelect
              label={t('audio_settings.lbl_output_device')}
              value={selSpk}
              onChange={setSelSpk}
              options={spks}
              placeholder={t('audio_settings.placeholder_system_default')}
              deviceFallbackLabel={deviceFallbackLabel}
            />
          )}

          <div className="mb-5">
            <label className="block text-sm font-semibold text-gray-700 mb-1">{t('audio_settings.lbl_lavendir_voice')}</label>
            <select
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 bg-white"
              value={selVoice}
              onChange={e => setSelVoice(e.target.value)}
            >
              <option value="">{t('audio_settings.opt_browser_default')}</option>
              {voices.map(v => (
                <option key={v.name} value={v.name}>
                  {v.name} {v.name.includes('Google') ? '⭐' : ''}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-400 mt-1">{t('audio_settings.voice_tip')}</p>
          </div>

          <button
            onClick={testSpeaker}
            disabled={testingSpk}
            className="px-4 py-2 rounded-xl text-sm font-semibold bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 transition-colors disabled:opacity-50"
          >
            {testingSpk ? t('audio_settings.btn_playing') : t('audio_settings.btn_test_speaker')}
          </button>
        </div>

        {/* Tips */}
        <div className="bg-purple-50 border border-purple-100 rounded-xl p-4 mb-6">
          <p className="text-sm font-semibold text-purple-800 mb-2">{t('audio_settings.tips_heading')}</p>
          <ul className="text-xs text-purple-700 space-y-1 list-disc list-inside">
            <li dangerouslySetInnerHTML={{ __html: t('audio_settings.tip_1') }} />
            <li dangerouslySetInnerHTML={{ __html: t('audio_settings.tip_2') }} />
            <li>{t('audio_settings.tip_3')}</li>
            <li>{t('audio_settings.tip_4')}</li>
            <li>{t('audio_settings.tip_5')}</li>
          </ul>
        </div>

        {/* Save */}
        <div className="flex justify-end items-center gap-3">
          <button onClick={save} className="regsubmit2 px-8 py-2.5 text-sm">
            {t('audio_settings.btn_save')}
          </button>
          {saved && (
            <span className="text-sm text-green-600 font-medium animate-pulse">{t('audio_settings.saved')}</span>
          )}
        </div>
      </div>
    </AccountLayout>
  );
}

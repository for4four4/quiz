import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { api, ApiError, type IntegrationInfo } from '../api';
import { Button, Field, Icon, icons, inputCls, Spinner, useToast } from '../ui';

const segmentOptions = [
  { id: 'hot', label: '🔥 Горячие' },
  { id: 'warm', label: '🌤 Тёплые' },
  { id: 'cold', label: '❄️ Холодные' },
];

interface ChannelDef {
  type: string;
  name: string;
  tagline: string;
  brand: string;             // цвет бренда
  badge: ReactNode;          // иконка/значок канала
  secretKey: string;         // ключ секрета в config (bot_token / access_token)
  secretLabel: string;
  secretPlaceholder: string;
  idKey: string;             // ключ адресата (chat_id / peer_id)
  idLabel: string;
  idPlaceholder: string;
  steps: ReactNode[];
}

const channels: ChannelDef[] = [
  {
    type: 'telegram', name: 'Telegram-бот', tagline: 'Мгновенное уведомление в чат, как только приходит подходящий лид.',
    brand: '#229ED9', badge: <span className="grid h-12 w-12 place-items-center rounded-[14px] bg-[#e8f3fc] text-[#229ED9]"><Icon path={icons.send} size={24} /></span>,
    secretKey: 'bot_token', secretLabel: 'Токен бота', secretPlaceholder: '123456:ABC-DEF…',
    idKey: 'chat_id', idLabel: 'Chat ID', idPlaceholder: 'напр. 123456789 или -1001234567890',
    steps: [
      <>Создайте бота у <b>@BotFather</b> командой <code className="rounded bg-white px-1.5 py-0.5 font-mono text-[12px]">/newbot</code> — получите токен.</>,
      <>Напишите своему боту любое сообщение (или добавьте его в группу).</>,
      <>Узнайте <b>chat_id</b> у бота <b>@userinfobot</b> и вставьте значения ниже.</>,
    ],
  },
  {
    type: 'vk', name: 'ВКонтакте', tagline: 'Сообщение от вашего сообщества — лид приходит в личку или беседу.',
    brand: '#0077FF', badge: <span className="grid h-12 w-12 place-items-center rounded-[14px] bg-[#e7f0ff] text-[15px] font-black text-[#0077FF]">VK</span>,
    secretKey: 'access_token', secretLabel: 'Токен сообщества', secretPlaceholder: 'vk1.a.…',
    idKey: 'peer_id', idLabel: 'Peer ID (получатель)', idPlaceholder: 'ваш id или id беседы (2000000001)',
    steps: [
      <>В сообществе: <b>Управление → Работа с API</b> → создайте ключ доступа с правами «Сообщения».</>,
      <>Включите сообщения сообщества и добавьте получателя (себя или беседу).</>,
      <>Укажите <b>peer_id</b> — ваш VK id или id беседы (2000000000 + номер).</>,
    ],
  },
  {
    type: 'max', name: 'MAX', tagline: 'Уведомление в мессенджер MAX через бота — по аналогии с Telegram.',
    brand: '#6E4BF6', badge: <span className="grid h-12 w-12 place-items-center rounded-[14px] text-[13px] font-black text-white" style={{ background: 'linear-gradient(135deg,#6E4BF6,#B44BF6)' }}>MAX</span>,
    secretKey: 'access_token', secretLabel: 'Токен бота', secretPlaceholder: 'токен от @MasterBot',
    idKey: 'chat_id', idLabel: 'Chat ID', idPlaceholder: 'id чата с ботом',
    steps: [
      <>Создайте бота у <b>@MasterBot</b> в MAX и получите токен доступа.</>,
      <>Напишите боту любое сообщение, чтобы открыть чат.</>,
      <>Укажите <b>chat_id</b> чата с ботом и вставьте токен ниже.</>,
    ],
  },
];

function MessengerCard({ def, existing, onChange }: { def: ChannelDef; existing: IntegrationInfo | null; onChange: () => void }) {
  const [secret, setSecret] = useState('');
  const [addr, setAddr] = useState('');
  const [segments, setSegments] = useState<string[]>(['hot']);
  const [enabled, setEnabled] = useState(true);
  const [busy, setBusy] = useState<'save' | 'test' | null>(null);
  const toast = useToast();

  useEffect(() => {
    if (existing) {
      setAddr(String(existing.config[def.idKey] ?? ''));
      setSegments(existing.config.notify_segments ?? ['hot']);
      setEnabled(existing.enabled);
    }
  }, [existing, def.idKey]);

  const hasSecret = existing?.config.has_secret || secret.length > 0;
  const toggleSeg = (id: string) => {
    const next = segments.includes(id) ? segments.filter((s) => s !== id) : [...segments, id];
    if (next.length) setSegments(next);
  };
  const payload = () => ({ [def.secretKey]: secret || undefined, [def.idKey]: addr.trim(), notify_segments: segments, enabled });

  const guard = () => {
    if (!addr.trim()) { toast(`Укажите ${def.idLabel.toLowerCase()}`, 'err'); return false; }
    if (!hasSecret) { toast(`Вставьте ${def.secretLabel.toLowerCase()}`, 'err'); return false; }
    return true;
  };

  const save = async () => {
    if (!guard()) return;
    setBusy('save');
    try { await api.saveIntegration(def.type, payload()); setSecret(''); onChange(); toast('Интеграция сохранена'); }
    catch (err) { toast(err instanceof ApiError ? err.message : 'Не удалось сохранить', 'err'); }
    finally { setBusy(null); }
  };
  const test = async () => {
    if (!guard()) return;
    setBusy('test');
    try { await api.testIntegration(def.type, payload()); toast('Тестовое сообщение отправлено — проверьте чат'); }
    catch (err) { toast(err instanceof ApiError ? err.message : 'Не удалось отправить', 'err'); }
    finally { setBusy(null); }
  };
  const remove = async () => {
    setBusy('save');
    try { await api.deleteIntegration(def.type); setSecret(''); setAddr(''); setSegments(['hot']); setEnabled(true); onChange(); toast('Интеграция отключена'); }
    catch { toast('Не удалось отключить', 'err'); }
    finally { setBusy(null); }
  };

  return (
    <div className="anim-rise rounded-[16px] border border-line bg-surface p-6">
      <div className="mb-5 flex items-start gap-4">
        {def.badge}
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-extrabold">{def.name}</h2>
            {existing && (
              <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${enabled ? 'bg-[oklch(0.95_0.04_150)] text-success' : 'bg-line-2 text-muted'}`}>
                {enabled ? 'подключён' : 'выключен'}
              </span>
            )}
          </div>
          <p className="mt-0.5 text-sm text-muted">{def.tagline}</p>
        </div>
      </div>

      <ol className="mb-5 space-y-1.5 rounded-[12px] bg-canvas p-4 text-[13px] text-ink-2">
        {def.steps.map((s, i) => <li key={i}>{i + 1}. {s}</li>)}
      </ol>

      <div className="flex flex-col gap-4">
        <Field label={def.secretLabel} hint={existing?.config.has_secret ? 'Сохранён. Оставьте пустым, чтобы не менять.' : undefined}>
          <input className={inputCls} type="password" autoComplete="off"
            placeholder={existing?.config.has_secret ? '•••••••••• (сохранён)' : def.secretPlaceholder}
            value={secret} onChange={(e) => setSecret(e.target.value)} />
        </Field>
        <Field label={def.idLabel}>
          <input className={inputCls} placeholder={def.idPlaceholder} value={addr} onChange={(e) => setAddr(e.target.value)} />
        </Field>
        <div>
          <span className="mb-1.5 block text-[13px] font-bold text-ink">Уведомлять о сегментах</span>
          <div className="flex flex-wrap gap-2">
            {segmentOptions.map((s) => (
              <button key={s.id} onClick={() => toggleSeg(s.id)}
                className={`cursor-pointer rounded-full border px-4 py-1.5 text-sm font-bold transition-all ${
                  segments.includes(s.id) ? 'border-primary bg-primary-tint text-primary' : 'border-line text-muted hover:border-faint'}`}>
                {s.label}
              </button>
            ))}
          </div>
        </div>
        <label className="flex cursor-pointer select-none items-center gap-2.5 text-sm font-bold text-ink-2">
          <input type="checkbox" className="h-4 w-4 cursor-pointer accent-[oklch(0.53_0.2_274)]" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
          Уведомления включены
        </label>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-line-2 pt-5">
        {existing ? <button onClick={remove} className="text-sm font-bold text-muted hover:text-danger">Отключить</button> : <span />}
        <div className="flex gap-3">
          <Button variant="secondary" disabled={busy !== null} onClick={test}>{busy === 'test' ? <Spinner /> : 'Проверить'}</Button>
          <Button disabled={busy !== null} onClick={save}>{busy === 'save' ? <Spinner /> : 'Сохранить'}</Button>
        </div>
      </div>
    </div>
  );
}

export function IntegrationsPage() {
  const [loaded, setLoaded] = useState(false);
  const [list, setList] = useState<IntegrationInfo[]>([]);

  const reload = () => api.integrations().then(setList).catch(() => {}).finally(() => setLoaded(true));
  useEffect(() => { reload(); }, []);

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <h1 className="text-[28px] font-extrabold tracking-tight">Интеграции</h1>
        <p className="mt-1 text-[15px] text-muted">Получайте лиды туда, где вам удобно с ними работать</p>
      </div>

      {!loaded && <div className="flex justify-center py-24 text-primary"><Spinner className="h-8 w-8" /></div>}

      {loaded && (
        <div className="flex flex-col gap-4">
          {channels.map((def) => (
            <MessengerCard key={def.type} def={def} existing={list.find((i) => i.type === def.type) ?? null} onChange={reload} />
          ))}
          <div className="grid gap-3 sm:grid-cols-3">
            {['amoCRM', 'Битрикс24', 'Webhook'].map((name) => (
              <div key={name} className="flex items-center justify-between rounded-[14px] border border-dashed border-line bg-surface/50 px-4 py-3">
                <span className="text-sm font-bold text-ink-2">{name}</span>
                <span className="rounded-full bg-line-2 px-2 py-0.5 text-[11px] font-bold text-muted">скоро</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

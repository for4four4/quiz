import { useEffect, useState } from 'react';
import { api, ApiError, type IntegrationInfo } from '../api';
import { Button, Field, Icon, icons, inputCls, Spinner, useToast } from '../ui';

const segmentOptions: { id: string; label: string }[] = [
  { id: 'hot', label: '🔥 Горячие' },
  { id: 'warm', label: '🌤 Тёплые' },
  { id: 'cold', label: '❄️ Холодные' },
];

export function IntegrationsPage() {
  const [loaded, setLoaded] = useState(false);
  const [existing, setExisting] = useState<IntegrationInfo | null>(null);
  const [token, setToken] = useState('');
  const [chatId, setChatId] = useState('');
  const [segments, setSegments] = useState<string[]>(['hot']);
  const [enabled, setEnabled] = useState(true);
  const [busy, setBusy] = useState<'save' | 'test' | null>(null);
  const toast = useToast();

  useEffect(() => {
    api.integrations().then((list) => {
      const tg = list.find((i) => i.type === 'telegram') ?? null;
      setExisting(tg);
      if (tg) {
        setChatId(tg.config.chat_id ?? '');
        setSegments(tg.config.notify_segments ?? ['hot']);
        setEnabled(tg.enabled);
      }
    }).catch(() => {}).finally(() => setLoaded(true));
  }, []);

  const hasToken = existing?.config.has_token || token.length > 0;

  const toggleSeg = (id: string) => {
    const next = segments.includes(id) ? segments.filter((s) => s !== id) : [...segments, id];
    if (next.length) setSegments(next);
  };

  const save = async () => {
    if (!chatId.trim()) return toast('Укажите chat_id', 'err');
    if (!hasToken) return toast('Вставьте токен бота', 'err');
    setBusy('save');
    try {
      await api.saveTelegram({ bot_token: token || undefined, chat_id: chatId.trim(), notify_segments: segments, enabled });
      setToken('');
      setExisting({ type: 'telegram', enabled, config: { chat_id: chatId.trim(), notify_segments: segments, has_token: true } });
      toast('Интеграция сохранена');
    } catch (err) {
      toast(err instanceof ApiError ? err.message : 'Не удалось сохранить', 'err');
    } finally { setBusy(null); }
  };

  const test = async () => {
    if (!chatId.trim()) return toast('Укажите chat_id', 'err');
    if (!hasToken) return toast('Вставьте токен бота', 'err');
    setBusy('test');
    try {
      await api.testTelegram({ bot_token: token || undefined, chat_id: chatId.trim() });
      toast('Тестовое сообщение отправлено — проверьте чат');
    } catch (err) {
      toast(err instanceof ApiError ? err.message : 'Не удалось отправить', 'err');
    } finally { setBusy(null); }
  };

  const remove = async () => {
    setBusy('save');
    try {
      await api.deleteTelegram();
      setExisting(null); setToken(''); setChatId(''); setSegments(['hot']); setEnabled(true);
      toast('Интеграция отключена');
    } catch { toast('Не удалось отключить', 'err'); }
    finally { setBusy(null); }
  };

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <h1 className="text-[28px] font-extrabold tracking-tight">Интеграции</h1>
        <p className="mt-1 text-[15px] text-muted">Получайте лиды туда, где вам удобно с ними работать</p>
      </div>

      {!loaded && <div className="flex justify-center py-24 text-primary"><Spinner className="h-8 w-8" /></div>}

      {loaded && (
        <div className="anim-rise rounded-[16px] border border-line bg-surface p-6">
          <div className="mb-5 flex items-start gap-4">
            <span className="grid h-12 w-12 flex-none place-items-center rounded-[14px] bg-[#e8f3fc] text-[#229ED9]">
              <Icon path={icons.send} size={24} />
            </span>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-extrabold">Telegram-бот</h2>
                {existing && (
                  <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${enabled ? 'bg-[oklch(0.95_0.04_150)] text-success' : 'bg-line-2 text-muted'}`}>
                    {enabled ? 'подключён' : 'выключен'}
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-sm text-muted">Мгновенное уведомление в чат, как только приходит подходящий лид.</p>
            </div>
          </div>

          {/* Инструкция */}
          <ol className="mb-5 space-y-1.5 rounded-[12px] bg-canvas p-4 text-[13px] text-ink-2">
            <li>1. Создайте бота у <b>@BotFather</b> командой <code className="rounded bg-white px-1.5 py-0.5 font-mono text-[12px]">/newbot</code> — получите токен.</li>
            <li>2. Напишите своему боту любое сообщение (или добавьте его в группу).</li>
            <li>3. Узнайте <b>chat_id</b> у бота <b>@userinfobot</b> и вставьте значения ниже.</li>
          </ol>

          <div className="flex flex-col gap-4">
            <Field label="Токен бота" hint={existing?.config.has_token ? 'Токен сохранён. Оставьте пустым, чтобы не менять.' : undefined}>
              <input className={inputCls} type="password" autoComplete="off"
                placeholder={existing?.config.has_token ? '•••••••••• (сохранён)' : '123456:ABC-DEF…'}
                value={token} onChange={(e) => setToken(e.target.value)} />
            </Field>
            <Field label="Chat ID">
              <input className={inputCls} placeholder="напр. 123456789 или -1001234567890"
                value={chatId} onChange={(e) => setChatId(e.target.value)} />
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
              <input type="checkbox" className="h-4 w-4 cursor-pointer accent-[oklch(0.53_0.2_274)]"
                checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
              Уведомления включены
            </label>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-line-2 pt-5">
            {existing
              ? <button onClick={remove} className="text-sm font-bold text-muted hover:text-danger">Отключить</button>
              : <span />}
            <div className="flex gap-3">
              <Button variant="secondary" disabled={busy !== null} onClick={test}>
                {busy === 'test' ? <Spinner /> : 'Проверить'}
              </Button>
              <Button disabled={busy !== null} onClick={save}>
                {busy === 'save' ? <Spinner /> : 'Сохранить'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Скоро */}
      {loaded && (
        <div className="anim-rise-1 mt-4 grid gap-3 sm:grid-cols-3">
          {['amoCRM', 'Битрикс24', 'Webhook'].map((name) => (
            <div key={name} className="flex items-center justify-between rounded-[14px] border border-dashed border-line bg-surface/50 px-4 py-3">
              <span className="text-sm font-bold text-ink-2">{name}</span>
              <span className="rounded-full bg-line-2 px-2 py-0.5 text-[11px] font-bold text-muted">скоро</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

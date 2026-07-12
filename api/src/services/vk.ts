/**
 * Отправка сообщений через VK — сообщество отвечает по messages.send.
 * Нужен токен сообщества (Управление → Работа с API → ключ доступа с правами
 * «Сообщения») и peer_id получателя.
 */
export interface VkConfig {
  access_token: string;
  peer_id: string;
  notify_segments?: string[];
}

export async function sendVkMessage(cfg: VkConfig, text: string): Promise<unknown> {
  const params = new URLSearchParams({
    access_token: cfg.access_token,
    v: '5.199',
    peer_id: cfg.peer_id,
    message: text,
    random_id: String(Date.now() % 2_000_000_000), // VK требует random_id для дедупликации
  });
  const res = await fetch('https://api.vk.com/method/messages.send', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: params,
  });
  const data = (await res.json().catch(() => ({}))) as { error?: { error_msg?: string } };
  if (data.error) throw new Error(data.error.error_msg || 'VK API вернул ошибку');
  return data;
}

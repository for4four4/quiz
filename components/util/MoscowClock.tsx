"use client";

import { useEffect, useState } from "react";

function moscowTime() {
  try {
    return new Intl.DateTimeFormat("ru-RU", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Europe/Moscow",
    }).format(new Date());
  } catch {
    return "--:--";
  }
}

/** Live Moscow clock used in the nav bar. */
export function MoscowClock() {
  const [time, setTime] = useState<string>("--:--");

  useEffect(() => {
    setTime(moscowTime());
    const t = setInterval(() => setTime(moscowTime()), 15000);
    return () => clearInterval(t);
  }, []);

  return <span>{time} в Москве</span>;
}

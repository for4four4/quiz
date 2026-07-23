/*!
 * Квалифай — виджет квиза для встраивания.
 * Использование:
 *   <script src="https://qvalify.ru/embed.js"
 *           data-quiz="kitchen-calc"
 *           data-selector="#quiz-block"></script>
 * Без data-selector — плавающая кнопка (её вид и показ настраиваются в редакторе).
 */
(function () {
  "use strict";
  var script = document.currentScript;
  if (!script) return;
  var slug = script.getAttribute("data-quiz");
  if (!slug) return;
  var selector = script.getAttribute("data-selector");
  var origin = new URL(script.src).origin;
  var source = selector ? "встроенный блок" : "плавающая кнопка";
  var session = Math.random().toString(36).slice(2) + Date.now().toString(36);
  var tracked = {};

  var ANIM = { none: "", fade: "qvAFade", slideL: "qvASlideL", slideUp: "qvASlideUp", zoom: "qvAZoom", flip: "qvAFlip" };
  var DEF = {
    slideAnim: "slideUp", openAnim: "zoom",
    button: { text: "Пройти квиз", sub: "Займёт 1 минуту", showSub: true, bg: "#28559c", bgImages: [], bgSlide: true, bgSlideSec: 3, color: "#ffffff", width: 220, height: 56, radius: 28, icon: true, position: 8, fullscreen: false },
    display: { mode: "popup", trigger: "click", delaySec: 15, pageUrl: "/", dim: 45, popupBg: "transparent", popupImages: [], position: "center", progressOn: true, progressStyle: "line", progressColor: "#28559c" }
  };

  function injectKeyframes() {
    if (document.getElementById("qv-kf")) return;
    var st = document.createElement("style");
    st.id = "qv-kf";
    st.textContent =
      "@keyframes qvAFade{from{opacity:0}to{opacity:1}}" +
      "@keyframes qvASlideL{from{opacity:0;transform:translateX(60px)}to{opacity:1;transform:none}}" +
      "@keyframes qvASlideUp{from{opacity:0;transform:translateY(40px)}to{opacity:1;transform:none}}" +
      "@keyframes qvAZoom{from{opacity:0;transform:scale(.82)}to{opacity:1;transform:scale(1)}}" +
      "@keyframes qvAFlip{from{opacity:0;transform:perspective(700px) rotateY(28deg)}to{opacity:1;transform:none}}";
    document.head.appendChild(st);
  }

  function merge(base, over) {
    var out = {}, k;
    for (k in base) out[k] = base[k];
    if (over) for (k in over) if (over[k] != null) out[k] = over[k];
    return out;
  }
  function readSettings(quiz) {
    var s = (quiz.design && quiz.design.settings) || {};
    return {
      slideAnim: s.slideAnim || DEF.slideAnim,
      openAnim: s.openAnim || DEF.openAnim,
      button: merge(DEF.button, s.button),
      display: merge(DEF.display, s.display),
      thanks: merge({ emoji: "✅", title: "Заявка отправлена!", text: "Мы свяжемся с вами в ближайшее время", redirectUrl: "", redirectSec: 3 }, s.thanks),
      discount: merge({ enabled: false, text: "Скидка сгорает через", minutes: 15, bg: "#0F1F3C", color: "#ffffff" }, s.discount)
    };
  }

  // Тающая скидка: плашка с обратным отсчётом. Дедлайн — в localStorage на посетителя.
  function makeDiscountBar(d) {
    var bar = el("div", "display:flex;align-items:center;gap:10px;justify-content:center;max-width:420px;margin:0 auto 12px;background:" + d.bg + ";color:" + d.color + ";border-radius:12px;padding:10px 16px;font-size:14px;font-weight:600;box-shadow:0 8px 24px rgba(15,31,60,.18);font-family:-apple-system,Segoe UI,Arial,sans-serif;");
    bar.appendChild(el("span", null, d.text));
    var timer = el("span", "font-variant-numeric:tabular-nums;background:rgba(255,255,255,.18);border-radius:8px;padding:4px 9px;letter-spacing:.5px;");
    bar.appendChild(timer);
    var key = "qv_disc_" + slug, deadline = 0;
    try { var saved = Number(localStorage.getItem(key)); if (saved && saved > Date.now()) deadline = saved; } catch (e) { /* ignore */ }
    if (!deadline) { deadline = Date.now() + d.minutes * 60000; try { localStorage.setItem(key, String(deadline)); } catch (e) { /* ignore */ } }
    function tick() {
      var left = Math.max(0, Math.round((deadline - Date.now()) / 1000));
      var mm = String(Math.floor(left / 60)); while (mm.length < 2) mm = "0" + mm;
      var ss = String(left % 60); while (ss.length < 2) ss = "0" + ss;
      timer.textContent = mm + ":" + ss;
    }
    tick(); setInterval(tick, 1000);
    return bar;
  }

  function api(path, opts) { return fetch(origin + path, opts).then(function (r) { return r.json(); }); }

  function track(type, stepIdx) {
    var key = type === "step" ? "step" + stepIdx : type;
    if (tracked[key]) return;
    tracked[key] = 1;
    try {
      fetch(origin + "/api/public/event", {
        method: "POST", headers: { "content-type": "application/json" }, keepalive: true,
        body: JSON.stringify({ slug: slug, type: type, step: stepIdx, source: source, session: session })
      }).catch(function () {});
    } catch (e) { /* ignore */ }
  }

  function el(tag, style, text) {
    var e = document.createElement(tag);
    if (style) e.setAttribute("style", style);
    if (text != null) e.textContent = text;
    return e;
  }

  // Скрытые поля: UTM-метки, рекламные id, реферер
  function collectUtm() {
    var out = {};
    try {
      var p = new URLSearchParams(location.search);
      ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "gclid", "yclid", "fbclid"].forEach(function (k) {
        var v = p.get(k); if (v) out[k] = v.slice(0, 200);
      });
      if (document.referrer) out.referrer = document.referrer.slice(0, 300);
      out.page = location.href.slice(0, 300);
    } catch (e) { /* ignore */ }
    return out;
  }

  function render(container, quiz, cfg) {
    var steps = Array.isArray(quiz.steps) ? quiz.steps : [];
    var idx = 0, answers = [];
    var accent = cfg.button.bg, prColor = cfg.display.progressColor || accent;
    var slideKf = ANIM[cfg.slideAnim] || "";

    if (cfg.discount && cfg.discount.enabled) container.appendChild(makeDiscountBar(cfg.discount));
    var card = el("div", "font-family:-apple-system,Segoe UI,Arial,sans-serif;max-width:420px;margin:0 auto;background:#fff;border-radius:20px;box-shadow:0 12px 40px rgba(17,24,39,.12);padding:28px;box-sizing:border-box;");
    container.appendChild(card);
    track("open");

    function step() {
      card.innerHTML = "";
      if (idx < steps.length) track("step", idx); else track("contact");

      if (cfg.display.progressOn) {
        var bar = el("div", "height:5px;background:#eceef2;border-radius:999px;overflow:hidden;margin-bottom:18px;");
        var fill = el("div", "height:100%;background:" + prColor + ";border-radius:999px;width:" + Math.round((idx / (steps.length + 1)) * 100) + "%;");
        bar.appendChild(fill); card.appendChild(bar);
      }

      var wrap = el("div", slideKf ? "animation:" + slideKf + " .42s cubic-bezier(.2,.8,.3,1);" : "");
      card.appendChild(wrap);

      if (idx < steps.length) {
        var s = steps[idx];
        wrap.appendChild(el("div", "font-size:17px;font-weight:600;letter-spacing:-.01em;color:#111827;", s.question || "Вопрос"));
        var opts = el("div", "display:flex;flex-direction:column;gap:8px;margin-top:16px;");
        (s.options || []).forEach(function (opt) {
          var b = el("button", "text-align:left;border:1px solid #e5e7eb;border-radius:12px;padding:12px 14px;font-size:14px;background:#fff;cursor:pointer;font-family:inherit;", opt);
          b.onmouseover = function () { b.style.borderColor = accent; };
          b.onmouseout = function () { b.style.borderColor = "#e5e7eb"; };
          b.onclick = function () { answers.push({ q: s.question, a: opt }); idx++; step(); };
          opts.appendChild(b);
        });
        wrap.appendChild(opts);
      } else {
        wrap.appendChild(el("div", "font-size:17px;font-weight:600;color:#111827;", "Оставьте контакты"));
        var name = el("input", "width:100%;box-sizing:border-box;border:1px solid #e5e7eb;border-radius:12px;padding:12px 14px;font-size:14px;margin-top:14px;font-family:inherit;");
        name.placeholder = "Ваше имя";
        var phone = el("input", "width:100%;box-sizing:border-box;border:1px solid #e5e7eb;border-radius:12px;padding:12px 14px;font-size:14px;margin-top:10px;font-family:inherit;");
        phone.placeholder = "+7 (___) ___-__-__"; phone.type = "tel";
        // Согласие на обработку ПДн (152-ФЗ) — обязательно перед отправкой
        var agreeWrap = el("label", "display:flex;gap:8px;align-items:flex-start;margin-top:12px;font-size:11.5px;color:#6b7280;line-height:1.45;cursor:pointer;");
        var agree = el("input", "width:15px;height:15px;margin-top:1px;accent-color:" + accent + ";flex-shrink:0;cursor:pointer;");
        agree.type = "checkbox";
        var agreeTxt = el("span", null, "Согласен на обработку персональных данных и с ");
        var agreeLink = el("a", "color:" + accent + ";", "политикой конфиденциальности");
        agreeLink.href = origin + "/dokumenty#policy"; agreeLink.target = "_blank"; agreeLink.rel = "noreferrer";
        agreeTxt.appendChild(agreeLink);
        agreeWrap.appendChild(agree); agreeWrap.appendChild(agreeTxt);
        var send = el("button", "width:100%;background:" + accent + ";color:#fff;border:none;border-radius:12px;padding:13px 0;font-size:15px;font-weight:500;margin-top:14px;cursor:pointer;font-family:inherit;", "Получить результат");
        send.onclick = function () {
          if (!phone.value.trim()) { phone.style.borderColor = "#e0342f"; return; }
          if (!agree.checked) { agreeWrap.style.color = "#e0342f"; return; }
          send.disabled = true; send.textContent = "Отправляем…";
          api("/api/public/lead", {
            method: "POST", headers: { "content-type": "application/json" },
            body: JSON.stringify({ slug: slug, name: name.value, phone: phone.value, answers: answers, source: source, finished: true, utm: collectUtm() })
          }).then(function () {
            card.innerHTML = "";
            card.appendChild(el("div", "text-align:center;font-size:34px;padding-top:16px;", cfg.thanks.emoji));
            card.appendChild(el("div", "text-align:center;font-size:17px;font-weight:600;color:#111827;padding:8px 0 4px;", cfg.thanks.title));
            card.appendChild(el("div", "text-align:center;font-size:13px;color:#6b7280;padding-bottom:16px;", cfg.thanks.text));
            if (cfg.thanks.redirectUrl && /^https?:\/\//.test(cfg.thanks.redirectUrl)) {
              setTimeout(function () { window.location.href = cfg.thanks.redirectUrl; }, Math.max(0, cfg.thanks.redirectSec || 0) * 1000);
            }
          }).catch(function () { send.disabled = false; send.textContent = "Получить результат"; });
        };
        wrap.appendChild(name); wrap.appendChild(phone); wrap.appendChild(agreeWrap); wrap.appendChild(send);
      }
    }
    step();
  }

  function posAlign(p) {
    if (p === "br") return "align-items:flex-end;justify-content:flex-end;";
    if (p === "bl") return "align-items:flex-end;justify-content:flex-start;";
    if (p === "tr") return "align-items:flex-start;justify-content:flex-end;";
    if (p === "tl") return "align-items:flex-start;justify-content:flex-start;";
    return "align-items:center;justify-content:center;";
  }

  function openPopup(quiz, cfg) {
    var dim = (cfg.display.dim / 100).toFixed(2);
    var imgs = cfg.display.popupImages || [];
    var baseBg = imgs.length ? "#000" : (cfg.display.popupBg && cfg.display.popupBg !== "transparent" ? cfg.display.popupBg : "rgba(15,23,42," + dim + ")");
    var overlay = el("div", "position:fixed;inset:0;z-index:99999;background:" + baseBg + ";display:flex;padding:24px;box-sizing:border-box;" + posAlign(cfg.display.position));
    overlay.onclick = function (e) { if (e.target === overlay || e.target === dimLayer || e.target === imgEl) document.body.removeChild(overlay); };

    var imgEl = null, dimLayer = null;
    if (imgs.length) {
      imgEl = el("img", "position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:-2;");
      imgEl.src = imgs[0]; overlay.appendChild(imgEl);
      dimLayer = el("div", "position:absolute;inset:0;background:rgba(15,23,42," + dim + ");z-index:-1;"); overlay.appendChild(dimLayer);
      if (imgs.length > 1) { var k = 0; setInterval(function () { k = (k + 1) % imgs.length; imgEl.src = imgs[k]; }, 3500); }
    }
    var openKf = ANIM[cfg.openAnim] || "";
    var box = el("div", "width:100%;max-width:440px;position:relative;" + (openKf ? "animation:" + openKf + " .55s cubic-bezier(.2,.8,.3,1);" : ""));
    overlay.appendChild(box);
    document.body.appendChild(overlay);
    render(box, quiz, cfg);
  }

  function btnImages(b) {
    if (b.bgImages && b.bgImages.length) return b.bgImages;
    return b.bgImage ? [b.bgImage] : [];
  }
  function buttonStyle(b) {
    var base = "position:fixed;z-index:99998;border:none;cursor:pointer;overflow:hidden;font-family:-apple-system,Segoe UI,Arial,sans-serif;color:" + b.color + ";background:" + b.bg + ";box-shadow:0 8px 28px rgba(40,85,156,.4);display:flex;align-items:center;justify-content:center;gap:10px;";
    if (b.fullscreen) return base + "left:0;right:0;bottom:0;height:" + b.height + "px;border-radius:0;";
    var row = Math.floor(b.position / 3), col = b.position % 3;
    var v = row === 0 ? "top:20px;" : row === 1 ? "top:50%;transform:translateY(-50%);" : "bottom:20px;";
    var h = col === 0 ? "left:20px;" : col === 1 ? "left:50%;" + (row === 1 ? "" : "transform:translateX(-50%);") : "right:20px;";
    if (col === 1 && row === 1) v = "top:50%;left:50%;transform:translate(-50%,-50%);";
    return base + v + h + "width:" + b.width + "px;height:" + b.height + "px;border-radius:" + b.radius + "px;padding:0 20px;box-sizing:border-box;";
  }
  // Фон-слайдер кнопки: несколько картинок с авто-пролистыванием.
  function makeBtnBg(imgs, b) {
    var wrap = el("div", "position:absolute;inset:0;z-index:0;overflow:hidden;");
    var els = imgs.map(function (src, k) {
      return el("div", "position:absolute;inset:0;background:url(" + src + ") center/cover;opacity:" + (k === 0 ? 1 : 0) + ";transition:opacity .6s ease;");
    });
    els.forEach(function (e) { wrap.appendChild(e); });
    if ((b.bgSlide == null || b.bgSlide) && imgs.length > 1) {
      var i = 0;
      setInterval(function () { els[i].style.opacity = 0; i = (i + 1) % imgs.length; els[i].style.opacity = 1; }, Math.max(1, b.bgSlideSec || 3) * 1000);
    }
    return wrap;
  }

  function makeButton(quiz, cfg) {
    var b = cfg.button;
    var btn = el("button", buttonStyle(b));
    var imgs = btnImages(b);
    if (imgs.length) btn.appendChild(makeBtnBg(imgs, b));
    var shadow = imgs.length ? "text-shadow:0 1px 4px rgba(0,0,0,.45);" : "";
    if (b.icon) {
      var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.setAttribute("width", "17"); svg.setAttribute("height", "17"); svg.setAttribute("viewBox", "0 0 20 20");
      svg.setAttribute("style", "position:relative;z-index:1;");
      svg.innerHTML = '<rect x="2" y="3" width="16" height="3.2" rx="1.6" fill="currentColor" opacity="0.5"/><rect x="2" y="8.4" width="16" height="3.2" rx="1.6" fill="currentColor" opacity="0.75"/><rect x="2" y="13.8" width="9" height="3.2" rx="1.6" fill="currentColor"/>';
      btn.appendChild(svg);
    }
    var lbl = el("span", "min-width:0;text-align:left;position:relative;z-index:1;" + shadow);
    lbl.appendChild(el("span", "display:block;font-size:14px;font-weight:600;white-space:nowrap;", b.text));
    if (b.showSub) lbl.appendChild(el("span", "display:block;font-size:11px;opacity:.85;white-space:nowrap;", b.sub));
    btn.appendChild(lbl);
    btn.onclick = function () { openPopup(quiz, cfg); };
    document.body.appendChild(btn);
  }

  function mount(quiz) {
    injectKeyframes();
    var cfg = readSettings(quiz);
    if (selector || cfg.display.mode === "embedded") {
      var target = selector ? document.querySelector(selector) : null;
      if (target) { render(target, quiz, cfg); return; }
    }
    makeButton(quiz, cfg);
    // Авто-показ попапа: по времени или на нужной странице
    if (cfg.display.trigger === "time") {
      setTimeout(function () { openPopup(quiz, cfg); }, Math.max(1, cfg.display.delaySec) * 1000);
    } else if (cfg.display.trigger === "page" && cfg.display.pageUrl && location.pathname.indexOf(cfg.display.pageUrl) === 0) {
      openPopup(quiz, cfg);
    }
  }

  api("/api/public/quiz/" + encodeURIComponent(slug)).then(function (data) {
    if (data && data.quiz) mount(data.quiz);
  }).catch(function () {});
})();

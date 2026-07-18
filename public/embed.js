/*!
 * Квалифай — виджет квиза для встраивания.
 * Использование:
 *   <script src="https://qvalify.ru/embed.js"
 *           data-quiz="kitchen-calc"
 *           data-selector="#quiz-block"></script>
 * Без data-selector рендерится плавающая кнопка в правом нижнем углу.
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

  function api(path, opts) {
    return fetch(origin + path, opts).then(function (r) { return r.json(); });
  }

  function el(tag, style, text) {
    var e = document.createElement(tag);
    if (style) e.setAttribute("style", style);
    if (text != null) e.textContent = text;
    return e;
  }

  function render(container, quiz) {
    var steps = Array.isArray(quiz.steps) ? quiz.steps : [];
    var idx = 0;
    var answers = [];

    var card = el("div", "font-family:-apple-system,Segoe UI,Arial,sans-serif;max-width:420px;margin:0 auto;background:#fff;border-radius:20px;box-shadow:0 12px 40px rgba(17,24,39,.12);padding:28px;box-sizing:border-box;");
    container.appendChild(card);

    function step() {
      card.innerHTML = "";
      var bar = el("div", "height:5px;background:#eceef2;border-radius:999px;overflow:hidden;margin-bottom:18px;");
      var fill = el("div", "height:100%;background:#28559c;border-radius:999px;width:" + Math.round(((idx) / (steps.length + 1)) * 100) + "%;");
      bar.appendChild(fill); card.appendChild(bar);

      if (idx < steps.length) {
        var s = steps[idx];
        card.appendChild(el("div", "font-size:17px;font-weight:600;letter-spacing:-.01em;color:#111827;", s.question || "Вопрос"));
        var opts = el("div", "display:flex;flex-direction:column;gap:8px;margin-top:16px;");
        (s.options || []).forEach(function (opt) {
          var b = el("button", "text-align:left;border:1px solid #e5e7eb;border-radius:12px;padding:12px 14px;font-size:14px;background:#fff;cursor:pointer;font-family:inherit;", opt);
          b.onmouseover = function () { b.style.borderColor = "#28559c"; };
          b.onmouseout = function () { b.style.borderColor = "#e5e7eb"; };
          b.onclick = function () { answers.push({ q: s.question, a: opt }); idx++; step(); };
          opts.appendChild(b);
        });
        card.appendChild(opts);
      } else {
        card.appendChild(el("div", "font-size:17px;font-weight:600;color:#111827;", "Оставьте контакты"));
        var name = el("input", "width:100%;box-sizing:border-box;border:1px solid #e5e7eb;border-radius:12px;padding:12px 14px;font-size:14px;margin-top:14px;font-family:inherit;");
        name.placeholder = "Ваше имя";
        var phone = el("input", "width:100%;box-sizing:border-box;border:1px solid #e5e7eb;border-radius:12px;padding:12px 14px;font-size:14px;margin-top:10px;font-family:inherit;");
        phone.placeholder = "+7 (___) ___-__-__";
        phone.type = "tel";
        var send = el("button", "width:100%;background:#28559c;color:#fff;border:none;border-radius:12px;padding:13px 0;font-size:15px;font-weight:500;margin-top:14px;cursor:pointer;font-family:inherit;", "Получить результат");
        send.onclick = function () {
          if (!phone.value.trim()) { phone.style.borderColor = "#e0342f"; return; }
          send.disabled = true; send.textContent = "Отправляем…";
          api("/api/public/lead", {
            method: "POST", headers: { "content-type": "application/json" },
            body: JSON.stringify({ slug: slug, name: name.value, phone: phone.value, answers: answers, source: source, finished: true })
          }).then(function () {
            card.innerHTML = "";
            card.appendChild(el("div", "text-align:center;font-size:17px;font-weight:600;color:#166534;padding:24px 0;", "Заявка отправлена!"));
            card.appendChild(el("div", "text-align:center;font-size:13px;color:#6b7280;", "Мы свяжемся с вами в ближайшее время"));
          }).catch(function () { send.disabled = false; send.textContent = "Получить результат"; });
        };
        card.appendChild(name); card.appendChild(phone); card.appendChild(send);
      }
    }
    step();
  }

  function mount(quiz) {
    if (selector) {
      var target = document.querySelector(selector);
      if (target) render(target, quiz);
      return;
    }
    // Floating button + modal
    var btn = el("button", "position:fixed;right:20px;bottom:20px;z-index:99998;background:#28559c;color:#fff;border:none;border-radius:9999px;padding:14px 22px;font-size:14px;font-weight:600;box-shadow:0 8px 28px rgba(40,85,156,.4);cursor:pointer;font-family:-apple-system,Segoe UI,Arial,sans-serif;", "Пройти квиз");
    btn.onclick = function () {
      var overlay = el("div", "position:fixed;inset:0;z-index:99999;background:rgba(15,23,42,.5);display:flex;align-items:center;justify-content:center;padding:20px;");
      overlay.onclick = function (e) { if (e.target === overlay) document.body.removeChild(overlay); };
      var box = el("div", "width:100%;max-width:440px;");
      overlay.appendChild(box);
      document.body.appendChild(overlay);
      render(box, quiz);
    };
    document.body.appendChild(btn);
  }

  api("/api/public/quiz/" + encodeURIComponent(slug)).then(function (data) {
    if (data && data.quiz) mount(data.quiz);
  }).catch(function () {});
})();

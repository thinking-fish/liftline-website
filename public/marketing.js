/* global React, ReactDOM */

/* Mount live LiftLine kiosk screens into device frames, scaled to fit.
   The screen components come from liftline-screens.jsx, which is Babel-
   transformed and therefore runs AFTER this script — so we wait for them. */
(function () {
  function fit(scaleEl, screenEl) {
    const s = screenEl.clientWidth / 1080;
    scaleEl.style.transform = "scale(" + s + ")";
  }

  function mountAll() {
    const MAP = {
      news: window.NewsScreen,
      weather: window.WeatherScreen,
      tube: window.TubeScreen,
      dep: window.DeparturesScreen,
      estate: window.NoticeManager,
      maint: window.NoticeMaintenance,
      wifi: window.WifiScreen,
      safety: window.NoticeSafety,
    };

    const frames = document.querySelectorAll("[data-ll-screen]");
    let pending = 0;

    frames.forEach(function (screenEl) {
      if (screenEl.dataset.mounted) return;
      const Comp = MAP[screenEl.getAttribute("data-ll-screen")];
      if (!Comp) { pending++; return; }   // component not ready yet
      screenEl.dataset.mounted = "1";

      const scaleEl = document.createElement("div");
      scaleEl.className = "device__scale";
      screenEl.appendChild(scaleEl);

      ReactDOM.createRoot(scaleEl).render(React.createElement(Comp));

      fit(scaleEl, screenEl);
      new ResizeObserver(function () { fit(scaleEl, screenEl); }).observe(screenEl);
    });

    return pending === 0 && frames.length > 0;
  }

  // The screen components come from a Babel-transformed module that runs AFTER
  // this script, and in-browser Babel can take several seconds. Poll on a slow
  // interval until every frame is mounted (mountAll guards each frame, so it is
  // safe to call repeatedly), then stop.
  const poll = setInterval(function () {
    if (window.React && window.ReactDOM && mountAll()) {
      clearInterval(poll);
    }
  }, 100);
  // give up only after a very generous window (Babel never takes this long)
  setTimeout(function () { clearInterval(poll); }, 60000);

  // Reveal-on-scroll
  function initReveal() {
    const io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
        });
      },
      { threshold: 0.12 }
    );
    document.querySelectorAll(".reveal").forEach(function (el) { io.observe(el); });
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initReveal);
  } else {
    initReveal();
  }

  /* ── Enquiry modal ───────────────────────────────────────── */
  function initModal() {
    const modal = document.getElementById("enquiry");
    if (!modal) return;
    const form = document.getElementById("enq-form");
    const success = document.getElementById("enq-success");
    let lastFocus = null;

    function open(e) {
      if (e) e.preventDefault();
      lastFocus = document.activeElement;
      modal.hidden = false;
      document.body.style.overflow = "hidden";
      const first = modal.querySelector("input, textarea");
      if (first) setTimeout(function () { first.focus(); }, 60);
    }
    function close() {
      modal.hidden = true;
      document.body.style.overflow = "";
      // reset back to the form for next time
      if (form) { form.hidden = false; form.reset(); }
      if (success) success.hidden = true;
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }

    document.querySelectorAll("[data-enquiry]").forEach(function (btn) {
      btn.addEventListener("click", open);
    });
    modal.querySelectorAll("[data-close]").forEach(function (el) {
      el.addEventListener("click", close);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !modal.hidden) close();
    });

    if (form) {
      form.addEventListener("submit", async function (e) {
        e.preventDefault();
        if (!form.reportValidity()) return;

        // POST to the Worker's /contact endpoint, which forwards the
        // enquiry to Claudia's Telegram bot. The Worker tolerates a
        // Telegram outage and still returns 200, so a network error
        // here is the only realistic failure mode.
        const fd = new FormData(form);
        const payload = {
          name: fd.get("name"),
          email: fd.get("email"),
          phone: fd.get("phone") || "",
          // Backend expects `message`; the form field is "details".
          message: fd.get("details") || "(no details supplied)",
        };

        const submitBtn = form.querySelector(".enq__submit");
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.textContent = "Sending…";
        }

        let ok = false;
        try {
          const res = await fetch("/contact", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
          ok = res.ok;
        } catch (_) {
          ok = false;
        }

        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = "Send enquiry";
        }

        if (ok) {
          form.hidden = true;
          if (success) success.hidden = false;
        } else {
          let err = form.querySelector(".enq__err");
          if (!err) {
            err = document.createElement("p");
            err.className = "enq__err";
            err.style.cssText =
              "color:#b94a48;font:14px/1.4 Manrope,sans-serif;margin:0 0 12px;";
            form.prepend(err);
          }
          err.textContent =
            "Sorry — couldn't send that just now. Please email hello@liftline.co.uk.";
        }
      });
    }
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initModal);
  } else {
    initModal();
  }
})();

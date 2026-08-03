(() => {
  "use strict";

  // ---- Decorative snowfall --------------------------------------------------

  const sky = document.getElementById("sky");
  const flakeCount = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 22;
  for (let i = 0; i < flakeCount; i++) {
    const flake = document.createElement("div");
    flake.className = "flake";
    flake.style.left = Math.random() * 100 + "%";
    flake.style.setProperty("--drift-x", (Math.random() * 60 - 30) + "px");
    flake.style.width = flake.style.height = (3 + Math.random() * 4) + "px";
    flake.style.animationDuration = (9 + Math.random() * 8) + "s";
    flake.style.animationDelay = (Math.random() * -14) + "s";
    sky.appendChild(flake);
  }

  const state = {
    name: "Léo",
    answers: {},
    stepIndex: 0,
    timerSeconds: 0,
    timerHandle: null,
  };

  // ---- Conversation script -------------------------------------------------

  const STEPS = [
    {
      id: "greeting",
      say: (name) => `Ho ho ho ! Bonjour, ici le Père Noël ! Est-ce que je parle bien à ${name} ?`,
      choices: ["Oui, c'est moi !", "Coucou Père Noël !"],
      allowCustom: false,
    },
    {
      id: "sage",
      say: (name) => `Quelle joie de t'entendre, ${name} ! Dis-moi, est-ce que tu as été bien sage cette année ?`,
      choices: ["Oui, très sage !", "Un tout petit peu..."],
      allowCustom: false,
      react: (answer) =>
        /petit/i.test(answer)
          ? "Ce n'est pas grave du tout, il reste encore quelques jours pour faire de gros efforts !"
          : "Je le savais ! Mes lutins me l'avaient déjà dit.",
    },
    {
      id: "order",
      say: (name) =>
        `Alors ${name}, mon petit renne m'a chuchoté à l'oreille que tu avais une commande à me passer... Qu'est-ce que tu as commandé pour Noël ?`,
      choices: ["Un doudou 🧸", "Une voiture 🚗", "Une poupée 🎎", "Un vélo 🚲", "Des bonbons 🍬", "Un ballon ⚽"],
      allowCustom: true,
      react: (answer) => `Oh là là, ${answer} ! Quelle excellente idée, je note ça tout de suite dans mon grand livre magique !`,
    },
    {
      id: "extra",
      say: () => "Est-ce qu'il y a autre chose que tu voudrais me dire, ou une petite surprise en plus ?",
      choices: ["Non, c'est tout !", "Un jeu 🧩", "Des livres 📚", "Un déguisement 🦸"],
      allowCustom: true,
      react: (answer) =>
        /^non/i.test(answer) ? "Très bien, j'ai tout noté dans mon grand livre !" : `Parfait, ${answer}, c'est noté aussi !`,
    },
    {
      id: "closing",
      say: (name) =>
        `Je dois retourner préparer les cadeaux avec mes lutins, ils m'attendent ! Sois bien sage, fais de gros bisous à papa et à maman de ma part. Joyeux Noël, ${name} ! Ho ho ho !`,
      end: true,
    },
  ];

  // ---- DOM references ------------------------------------------------------

  const screens = {
    setup: document.getElementById("screen-setup"),
    incoming: document.getElementById("screen-incoming"),
    call: document.getElementById("screen-call"),
    summary: document.getElementById("screen-summary"),
  };

  const childNameInput = document.getElementById("childName");
  const btnStartCall = document.getElementById("btnStartCall");
  const btnAnswer = document.getElementById("btnAnswer");
  const btnDecline = document.getElementById("btnDecline");
  const captionText = document.getElementById("captionText");
  const answerZone = document.getElementById("answerZone");
  const santaAvatar = document.getElementById("santaAvatar");
  const callTimer = document.getElementById("callTimer");
  const btnReplay = document.getElementById("btnReplay");
  const btnHangup = document.getElementById("btnHangup");
  const summaryList = document.getElementById("summaryList");
  const btnNewCall = document.getElementById("btnNewCall");

  function showScreen(name) {
    Object.values(screens).forEach((el) => el.classList.add("hidden"));
    screens[name].classList.remove("hidden");
  }

  // ---- Speech synthesis -----------------------------------------------------

  let santaVoice = null;

  function pickVoice() {
    const voices = window.speechSynthesis ? window.speechSynthesis.getVoices() : [];
    santaVoice = voices.find((v) => v.lang && v.lang.toLowerCase().startsWith("fr")) || voices[0] || null;
  }

  if (window.speechSynthesis) {
    pickVoice();
    window.speechSynthesis.onvoiceschanged = pickVoice;
  }

  function speak(text, onEnd) {
    captionText.textContent = text;

    if (!window.speechSynthesis) {
      if (onEnd) setTimeout(onEnd, 1200);
      return;
    }

    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "fr-FR";
    utter.pitch = 0.7;
    utter.rate = 0.9;
    if (santaVoice) utter.voice = santaVoice;

    santaAvatar.classList.add("speaking");
    utter.onend = () => {
      santaAvatar.classList.remove("speaking");
      if (onEnd) onEnd();
    };
    utter.onerror = () => {
      santaAvatar.classList.remove("speaking");
      if (onEnd) onEnd();
    };
    window.speechSynthesis.speak(utter);
  }

  let lastSpokenText = "";

  function speakStep(step) {
    lastSpokenText = step.say(state.name);
    speak(lastSpokenText, () => renderAnswerZone(step));
  }

  btnReplay.addEventListener("click", () => {
    if (lastSpokenText) speak(lastSpokenText);
  });

  // ---- Call timer -------------------------------------------------------

  function startTimer() {
    state.timerSeconds = 0;
    callTimer.textContent = "00:00";
    state.timerHandle = setInterval(() => {
      state.timerSeconds += 1;
      const mm = String(Math.floor(state.timerSeconds / 60)).padStart(2, "0");
      const ss = String(state.timerSeconds % 60).padStart(2, "0");
      callTimer.textContent = `${mm}:${ss}`;
    }, 1000);
  }

  function stopTimer() {
    if (state.timerHandle) clearInterval(state.timerHandle);
    state.timerHandle = null;
  }

  // ---- Answer rendering ---------------------------------------------------

  function renderAnswerZone(step) {
    answerZone.innerHTML = "";

    if (step.end) {
      const btn = document.createElement("button");
      btn.className = "btn btn-primary";
      btn.textContent = "🎄 Raccrocher";
      btn.addEventListener("click", endCall);
      answerZone.appendChild(btn);
      return;
    }

    (step.choices || []).forEach((choice) => {
      const btn = document.createElement("button");
      btn.className = "answer-btn";
      btn.textContent = choice;
      btn.addEventListener("click", () => handleAnswer(step, choice));
      answerZone.appendChild(btn);
    });

    if (step.allowCustom) {
      const wrap = document.createElement("div");
      wrap.className = "custom-answer";

      const input = document.createElement("input");
      input.type = "text";
      input.placeholder = "Autre réponse…";

      const send = document.createElement("button");
      send.textContent = "Envoyer";
      send.addEventListener("click", () => {
        const val = input.value.trim();
        if (val) handleAnswer(step, val);
      });
      input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") send.click();
      });

      wrap.appendChild(input);
      wrap.appendChild(send);
      answerZone.appendChild(wrap);
    }
  }

  function handleAnswer(step, answer) {
    state.answers[step.id] = answer;
    answerZone.innerHTML = "";

    const reaction = step.react ? step.react(answer) : null;
    const advance = () => {
      state.stepIndex += 1;
      runStep();
    };

    if (reaction) {
      speak(reaction, advance);
    } else {
      advance();
    }
  }

  function runStep() {
    const step = STEPS[state.stepIndex];
    if (!step) return endCall();
    speakStep(step);
  }

  // ---- Call flow ----------------------------------------------------------

  btnStartCall.addEventListener("click", () => {
    state.name = childNameInput.value.trim() || "Léo";
    showScreen("incoming");
  });

  btnDecline.addEventListener("click", () => showScreen("setup"));

  btnAnswer.addEventListener("click", () => {
    showScreen("call");
    state.stepIndex = 0;
    state.answers = {};
    startTimer();
    runStep();
  });

  function endCall() {
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    stopTimer();
    renderSummary();
    showScreen("summary");
  }

  btnHangup.addEventListener("click", endCall);

  function renderSummary() {
    const labels = {
      greeting: "A répondu à l'appel",
      sage: "A été sage ?",
      order: "A commandé au Père Noël",
      extra: "Autre chose demandée",
    };
    summaryList.innerHTML = "";
    Object.entries(state.answers).forEach(([key, value]) => {
      const li = document.createElement("li");
      const label = labels[key] || key;
      li.innerHTML = `<strong>${label}</strong><span>${value}</span>`;
      summaryList.appendChild(li);
    });
    if (!Object.keys(state.answers).length) {
      const li = document.createElement("li");
      li.innerHTML = "<strong>Appel</strong><span>Terminé avant la fin de la conversation.</span>";
      summaryList.appendChild(li);
    }
  }

  btnNewCall.addEventListener("click", () => showScreen("setup"));
})();

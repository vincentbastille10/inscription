(() => {
  const GOOGLE_APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbze_x40PZ3y1YK8jUq2qlXUFhgklDcgGOMNBQsN_9psaz9MH5FFand-UNPvvSGeMWZY/exec";
  const MAX_PER_COURSE = 30;

  // Tarifs 2026-2027 : prix annuel fixé par la durée hebdomadaire du cours (site officiel /tarifs)
  const PRICE_BY_DURATION = {
    "45 min": 300,
    "1 h": 360,
    "1 h 15": 375,
    "1 h 30": 390
  };
  const ADULTE = [16,17,18,30]; // valeurs sélectionnables dans AGES (16-18 puis "Adulte")

  const COURSES = [
    {id:"classique-gs", title:"ÉVEIL À LA DANSE - GS", category:"Classique", ages:[5], duration:"45 min", price:PRICE_BY_DURATION["45 min"], schedule:"Mercredi 9h15-10h", level:"Grande section", taken:18},
    {id:"classique-cp", title:"DANSE CLASSIQUE - CP", category:"Classique", ages:[6], duration:"1 h", price:PRICE_BY_DURATION["1 h"], schedule:"Mercredi 10h15-11h15", level:"CP", taken:21},
    {id:"classique-ce1-ce2", title:"DANSE CLASSIQUE - CE1 / CE2", category:"Classique", ages:[7,8], duration:"1 h", price:PRICE_BY_DURATION["1 h"], schedule:"Mercredi 11h15-12h15", level:"CE1 / CE2", taken:26},
    {id:"classique-3", title:"DANSE CLASSIQUE 3", category:"Classique", ages:[9,10,11], duration:"1 h 15", price:PRICE_BY_DURATION["1 h 15"], schedule:"Mercredi 13h45-15h", level:"Enfants", taken:24},
    {id:"classique-4", title:"DANSE CLASSIQUE 4", category:"Classique", ages:[11,12,13], duration:"1 h 15", price:PRICE_BY_DURATION["1 h 15"], schedule:"Mercredi 15h-16h15", level:"Pré-ados", taken:28},
    {id:"classique-5", title:"DANSE CLASSIQUE 5", category:"Classique", ages:[13,14,15,16,17,18], duration:"1 h 30", price:PRICE_BY_DURATION["1 h 30"], schedule:"Mercredi 16h30-18h", level:"Ados", taken:20},
    {id:"classique-avance-pointes", title:"CLASSIQUE AVANCÉ POINTES", category:"Classique", ages:[11,12,13,14,15,16,17,18], duration:"1 h 30", price:PRICE_BY_DURATION["1 h 30"], schedule:"Mardi 18h15-19h45", level:"Avancé pointes", taken:0},
    {id:"soul-enfants", title:"DANSE SOUL JAZZ ENFANTS", category:"Soul Jazz", ages:[9,10,11,12], duration:"1 h", price:PRICE_BY_DURATION["1 h"], schedule:"Jeudi 17h15-18h15", level:"Enfants", taken:23},
    {id:"soul-ados-1", title:"DANSE SOUL JAZZ ADOS - NIVEAU 1", category:"Soul Jazz", ages:[12,13,14,15,16,17,18], duration:"1 h 15", price:PRICE_BY_DURATION["1 h 15"], schedule:"Mercredi 18h-19h15", level:"Ados niveau 1", taken:28},
    {id:"soul-ados-2", title:"DANSE SOUL JAZZ ADOS - NIVEAU 2", category:"Soul Jazz", ages:[13,14,15,16,17,18], duration:"1 h 15", price:PRICE_BY_DURATION["1 h 15"], schedule:"Jeudi 18h15-19h30", level:"Ados niveau 2", taken:25},
    {id:"soul-adultes-mardi", title:"DANSE SOUL JAZZ ADULTES", category:"Soul Jazz", ages:ADULTE, duration:"1 h 30", price:PRICE_BY_DURATION["1 h 30"], schedule:"Mardi 19h45-21h15", level:"Adultes", taken:0},
    {id:"soul-adultes-jeudi", title:"DANSE SOUL JAZZ ADULTES", category:"Soul Jazz", ages:ADULTE, duration:"1 h 30", price:PRICE_BY_DURATION["1 h 30"], schedule:"Jeudi 19h30-21h", level:"Adultes", taken:0},
    {id:"street-1", title:"STREET 1", category:"Street", ages:[8,9,10,11], duration:"1 h", price:PRICE_BY_DURATION["1 h"], schedule:"Lundi 17h15-18h15", level:"8-11 ans", taken:0},
    {id:"street-2", title:"STREET 2", category:"Street", ages:[11,12,13,14], duration:"1 h", price:PRICE_BY_DURATION["1 h"], schedule:"Lundi 18h15-19h15", level:"11-14 ans", taken:0},
    {id:"street-3", title:"STREET 3", category:"Street", ages:[15,16,17,18,30], duration:"1 h", price:PRICE_BY_DURATION["1 h"], schedule:"Lundi 19h15-20h15", level:"15 ans et plus", taken:0},
    {id:"street-4", title:"STREET 4", category:"Street", ages:[15,16,17,18,30], duration:"1 h", price:PRICE_BY_DURATION["1 h"], schedule:"Lundi 20h15-21h15", level:"15 ans et plus - cours avancé", taken:0},
    {id:"street-ados", title:"STREET DÉBUTANT ADOS", category:"Street", ages:[13,14,15,16,17,18], duration:"1 h", price:PRICE_BY_DURATION["1 h"], schedule:"Samedi 12h-13h", level:"13-18 ans", taken:22},
    {id:"street-adultes", title:"STREET DÉBUTANT ADULTES", category:"Street", ages:ADULTE, duration:"1 h", price:PRICE_BY_DURATION["1 h"], schedule:"Mercredi 20h45-21h45", level:"Adultes", taken:27},
    {id:"street-jazz-adultes", title:"STREET JAZZ ADULTES", category:"Street", ages:ADULTE, duration:"1 h", price:PRICE_BY_DURATION["1 h"], schedule:"Vendredi 20h-21h", level:"Adultes", taken:0},
    {id:"barre-terre", title:"SWEET BARRE À TERRE", category:"Adultes", ages:ADULTE, duration:"1 h", price:PRICE_BY_DURATION["1 h"], schedule:"Mercredi 19h30-20h30", level:"Ados / adultes", taken:19},
    {id:"technique", title:"COURS TECHNIQUE", category:"Technique", ages:[12,13,14,15,16,17,18], duration:"1 h 30", price:PRICE_BY_DURATION["1 h 30"], schedule:"Vendredi 18h30-20h", level:"À partir de 12 ans", taken:17},
    // Kpop est offert (0€) mais conditionné à la prise d'au moins un cours Street
    {id:"kpop-enfants", title:"KPOP - COURS ENFANTS", category:"Kpop", ages:[6,7,8,9,10,11], duration:"1 h 30", price:0, requiresStreet:true, schedule:"Samedi 13h-15h", level:"6-11 ans", taken:0},
    {id:"kpop-ados", title:"KPOP - ADOS", category:"Kpop", ages:[11,12,13,14,15,16,17,18], duration:"1 h 30", price:0, requiresStreet:true, schedule:"Samedi 15h-16h30", level:"11 ans et plus", taken:0}
  ];

  const AGES = [{label:"2-4 ans (éveil à l'émotion)",value:2},5,6,7,8,9,10,11,12,13,14,15,16,17,18,{label:"Adulte",value:30}];
  const REDIRECT_AGES = [2,3,4];
  const RESPIRATION_URL = "https://respiration-zen.fr/";
  const state = { age:null, selected:new Map(), availability:{} };
  const $ = id => document.getElementById(id);
  const bot = $("botBody");
  const grid = $("courseGrid");
  const kpopModal = $("kpopModal");
  $("kpopModalClose").onclick = () => kpopModal.classList.remove("show");
  kpopModal.onclick = e => { if(e.target === kpopModal) kpopModal.classList.remove("show"); };

  const euro = n => `${Number(n || 0).toLocaleString("fr-FR")}€`;
  const remaining = c => state.availability[c.id]?.remaining ?? Math.max(0, MAX_PER_COURSE - Number(c.taken || 0));
  const compatible = () => state.age ? COURSES.filter(c => c.ages.includes(Number(state.age))) : [];

  function botMsg(html){
    const el = document.createElement("div");
    el.className = "bubble bot-msg";
    el.innerHTML = html;
    bot.appendChild(el);
    bot.scrollTop = bot.scrollHeight;
  }

  function userMsg(txt){
    const el = document.createElement("div");
    el.className = "bubble user-msg";
    el.textContent = txt;
    bot.appendChild(el);
    bot.scrollTop = bot.scrollHeight;
  }

  function ageChoices(){
    const wrap = document.createElement("div");
    wrap.className = "choices";
    AGES.forEach(a => {
      const label = typeof a === "object" ? a.label : `${a} ans`;
      const value = typeof a === "object" ? a.value : a;
      const b = document.createElement("button");
      b.type = "button";
      b.className = "choice";
      b.textContent = label;
      b.onclick = () => chooseAge(value, label);
      wrap.appendChild(b);
    });
    bot.appendChild(wrap);
  }

  function chooseAge(age, label){
    state.age = Number(age);
    state.selected.clear();
    userMsg(label);

    if(REDIRECT_AGES.includes(Number(age))){
      showEveilRedirect();
      updateTotals();
      return;
    }

    botMsg(`Parfait. Voici les cours compatibles avec <b>${label}</b>. Cliquez sur une ou plusieurs cases.`);
    renderCourses();
    updateTotals();
    setTimeout(() => $("cours").scrollIntoView({behavior:"smooth"}), 120);
  }

  function showEveilRedirect(){
    botMsg(`Pour l'<b>éveil à l'émotion (2-4 ans)</b>, l'inscription se fait directement chez notre partenaire <b>Respiration Zen</b> 🌸. Aucune inscription ni coordonnée à saisir ici : je vous redirige vers leur site.`);

    const wrap = document.createElement("div");
    wrap.className = "choices";
    const btn = document.createElement("a");
    btn.className = "choice";
    btn.href = RESPIRATION_URL;
    btn.target = "_blank";
    btn.rel = "noopener";
    btn.textContent = "S'inscrire sur respiration-zen.fr →";
    wrap.appendChild(btn);
    bot.appendChild(wrap);
    bot.scrollTop = bot.scrollHeight;

    // Zone cours : on affiche le renvoi, pas de cartes ni de panier
    $("courseTitle").textContent = "Éveil à l'émotion — 2 à 4 ans";
    $("courseIntro").textContent = "Inscription gérée par notre partenaire Respiration Zen.";
    grid.innerHTML = `<div class="empty">Pour les <b>2 à 4 ans (éveil à l'émotion)</b>, l'inscription se fait directement sur <a href="${RESPIRATION_URL}" target="_blank" rel="noopener">respiration-zen.fr</a>. Aucune inscription ni coordonnée n'est demandée ici.</div>`;

    // On s'assure qu'aucun formulaire / panier ne s'affiche
    $("formWrap").classList.remove("show");
    setTimeout(() => $("cours").scrollIntoView({behavior:"smooth"}), 120);
  }

  function renderCourses(){
    // Section 2-4 ans : le renvoi vers Respiration Zen est géré ailleurs, ne pas écraser.
    if(REDIRECT_AGES.includes(Number(state.age))) return;
    grid.innerHTML = "";
    if(!state.age){
      grid.innerHTML = '<div class="empty">Choisissez l’âge dans le bot pour afficher les cours possibles.</div>';
      return;
    }
    const list = compatible();
    $("courseTitle").textContent = `Cours compatibles - ${state.age === 30 ? "Adulte" : state.age + " ans"}`;
    $("courseIntro").textContent = `${list.length} cours proposés. Cliquez pour ajouter ou retirer.`;
    if(!list.length){
      grid.innerHTML = '<div class="empty">Aucun cours configuré pour cet âge.</div>';
      return;
    }
    list.forEach(c => {
      const sel = state.selected.has(c.id);
      const card = document.createElement("article");
      card.className = `course ${sel ? "selected" : ""}`;
      const requiresNote = c.requiresStreet ? `<p>Gratuit à condition de choisir aussi un cours Street</p>` : "";
      card.innerHTML = `<div class="meta"><span class="tag">${c.category}</span><span class="tag">${c.duration}</span></div><h4>${c.title}</h4><p><b>${c.schedule}</b></p><p>${c.level}</p>${requiresNote}<div class="bottom"><span class="price">${euro(c.price)}</span><span class="state">${sel ? "Ajouté" : "Ajouter"}</span></div>`;
      card.onclick = () => toggle(c);
      grid.appendChild(card);
    });
  }

  const hasStreetSelected = () => [...state.selected.values()].some(x => x.category === "Street");

  function toggle(c){
    if(state.selected.has(c.id)){
      state.selected.delete(c.id);
      botMsg(`J’ai retiré <b>${c.title}</b>.`);
      if(c.category === "Street" && !hasStreetSelected()){
        const droppedKpop = [...state.selected.values()].filter(x => x.requiresStreet);
        droppedKpop.forEach(k => state.selected.delete(k.id));
        if(droppedKpop.length){
          botMsg(`Le Kpop étant gratuit uniquement avec un cours Street, j’ai aussi retiré <b>${droppedKpop.map(k => k.title).join(", ")}</b>.`);
        }
      }
    }else{
      if(c.requiresStreet && !hasStreetSelected()){
        kpopModal.classList.add("show");
        return;
      }
      state.selected.set(c.id, c);
      botMsg(`J’ai ajouté <b>${c.title}</b>. Prix du cours : <b>${euro(c.price)}</b>.`);
    }
    renderCourses();
    updateTotals();
  }

  function total(){
    return [...state.selected.values()].reduce((s, c) => s + Number(c.price || 0), 0);
  }

  function updateTotals(){
    const count = state.selected.size;
    const t = total();
    $("totalAmount").textContent = euro(t);
    $("formTotal").textContent = euro(t);
    $("hiddenAge").value = state.age || "";
    $("hiddenCourses").value = JSON.stringify([...state.selected.values()]);
    $("hiddenTotal").value = String(t);

    if(!count){
      $("totalBtn").disabled = true;
      $("totalBtn").textContent = "Choisir un cours pour continuer";
      $("selectionSummary").textContent = "Aucun cours sélectionné";
      $("formWrap").classList.remove("show");
    }else{
      $("totalBtn").disabled = false;
      $("totalBtn").textContent = `Total ${euro(t)} - continuer`;
      $("selectionSummary").textContent = `${count} cours sélectionné${count > 1 ? "s" : ""}`;
    }
  }

  $("totalBtn").onclick = () => {
    if(!state.selected.size) return;
    $("formWrap").classList.add("show");
    botMsg(`Très bien. Total indicatif : <b>${euro(total())}</b>. Vous pouvez remplir le formulaire.`);
    $("formWrap").scrollIntoView({behavior:"smooth"});
  };

  async function loadAvailability(){
    if(!GOOGLE_APPS_SCRIPT_URL) return;
    const cb = "danceAvailability" + Date.now();
    window[cb] = data => {
      state.availability = data.courses || {};
      delete window[cb];
      renderCourses();
    };
    const script = document.createElement("script");
    script.src = GOOGLE_APPS_SCRIPT_URL + "?callback=" + cb;
    document.body.appendChild(script);
  }

  $("registrationForm").onsubmit = e => {
    e.preventDefault();
    if(!state.selected.size){
      alert("Choisissez au moins un cours.");
      return;
    }
    const data = Object.fromEntries(new FormData(e.currentTarget).entries());
    const payload = {
      createdAt: new Date().toISOString(),
      age: state.age,
      parentName: data.parentName,
      childName: data.childName,
      birthDate: data.birthDate,
      phone: data.phone,
      email: data.email,
      address: data.address,
      message: data.message,
      selectedCourses: [...state.selected.values()].map(c => ({...c, remaining: remaining(c)})),
      total: total(),
      disclaimer: "Cette pré-inscription ne garantit pas votre adhésion à l'école de danse."
    };

    // Envoi vers Google Apps Script : remplit la Google Sheet ET envoie l'email à Delphine
    if(GOOGLE_APPS_SCRIPT_URL){
      const formData = new FormData();
      formData.append("payload", JSON.stringify(payload));
      fetch(GOOGLE_APPS_SCRIPT_URL, { method:"POST", mode:"no-cors", body: formData });
    }

    $("successMsg").classList.add("show");
    botMsg("Merci. La pré-inscription est prête. Delphine pourra valider l’adhésion et revenir vers vous.");
    e.currentTarget.reset();
  };

  botMsg("Bonjour, je vous aide à choisir les bons cours pour une pré-inscription.");
  botMsg("Quel âge a la personne à inscrire ? Cliquez sur une case.");
  ageChoices();
  renderCourses();
  loadAvailability();
})();

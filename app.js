(() => {
  const GOOGLE_APPS_SCRIPT_URL = ""; // coller ici l’URL Web App Google Apps Script
  const MAX_PER_COURSE = 30;

  const COURSES = [
    {id:"classique-gs", title:"ÉVEIL À LA DANSE - GS", category:"Classique", ages:[5], price:350, duration:"45 min", schedule:"Samedi 9h15-10h", level:"Grande section", taken:18},
    {id:"classique-cp", title:"DANSE CLASSIQUE - CP", category:"Classique", ages:[6], price:350, duration:"1 h", schedule:"Samedi 10h15-11h15", level:"CP", taken:21},
    {id:"classique-ce1-ce2", title:"DANSE CLASSIQUE - CE1 / CE2", category:"Classique", ages:[7,8], price:350, duration:"1 h", schedule:"Samedi 11h15-12h15", level:"CE1 / CE2", taken:26},
    {id:"classique-3", title:"DANSE CLASSIQUE 3", category:"Classique", ages:[9,10,11], price:350, duration:"1 h 15", schedule:"Samedi 13h45-15h", level:"Enfants", taken:24},
    {id:"classique-4", title:"DANSE CLASSIQUE 4", category:"Classique", ages:[11,12,13], price:350, duration:"1 h 15", schedule:"Samedi 15h-16h15", level:"Pré-ados", taken:28},
    {id:"classique-5", title:"DANSE CLASSIQUE 5", category:"Classique", ages:[13,14,15,16,17,18], price:350, duration:"1 h 30", schedule:"Mercredi 16h30-18h", level:"Ados", taken:20},
    {id:"soul-enfants", title:"DANSE SOUL JAZZ ENFANTS", category:"Soul Jazz", ages:[9,10,11,12], price:300, duration:"1 h", schedule:"Jeudi 18h15 ou selon groupe", level:"Enfants", taken:23},
    {id:"soul-ados-1", title:"DANSE SOUL JAZZ ADOS - NIVEAU 1", category:"Soul Jazz", ages:[12,13,14,15,16,17,18], price:300, duration:"1 h 15", schedule:"Mercredi 18h-19h15", level:"Ados niveau 1", taken:28},
    {id:"soul-ados-2", title:"DANSE SOUL JAZZ ADOS - NIVEAU 2", category:"Soul Jazz", ages:[13,14,15,16,17,18], price:300, duration:"1 h 15", schedule:"Jeudi - horaire à confirmer", level:"Ados niveau 2", taken:25},
    {id:"street-ados", title:"STREET DÉBUTANT ADOS", category:"Street", ages:[13,14,15,16,17,18], price:350, duration:"1 h", schedule:"Samedi 12h-13h", level:"13-18 ans", taken:22},
    {id:"street-adultes", title:"STREET DÉBUTANT ADULTES", category:"Street", ages:[18,19,20,21,22,23,24,25,26,27,28,29,30,40,50,60], price:350, duration:"1 h", schedule:"Mercredi 20h45-21h45", level:"Adultes", taken:27},
    {id:"barre-terre", title:"SWEET BARRE À TERRE", category:"Adultes", ages:[16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,40,50,60], price:300, duration:"1 h", schedule:"Mardi 19h30-20h30", level:"Ados / adultes", taken:19},
    {id:"technique", title:"COURS TECHNIQUE", category:"Technique", ages:[12,13,14,15,16,17,18], price:180, duration:"1 h 15", schedule:"Vendredi 18h30-19h45", level:"À partir de 12 ans", taken:17},
    {id:"concours-cnd", title:"PRÉPARATION AUX CONCOURS CND", category:"Technique", ages:[12,13,14,15,16,17,18], price:180, duration:"Cours supplémentaire", schedule:"Classique et Jazz - à confirmer", level:"Concours", taken:14}
  ];

  const AGES = [5,6,7,8,9,10,11,12,13,14,15,16,17,18,{label:"Adulte",value:30}];
  const state = { age:null, selected:new Map(), availability:{} };
  const $ = id => document.getElementById(id);
  const bot = $("botBody");
  const grid = $("courseGrid");

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
    botMsg(`Parfait. Voici les cours compatibles avec <b>${label}</b>. Cliquez sur une ou plusieurs cases.`);
    renderCourses();
    updateTotals();
    setTimeout(() => $("cours").scrollIntoView({behavior:"smooth"}), 120);
  }

  function renderCourses(){
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
      const r = remaining(c);
      const sel = state.selected.has(c.id);
      const full = r <= 0;
      const urgent = r > 0 && r <= 3;
      const card = document.createElement("article");
      card.className = `course ${sel ? "selected" : ""} ${full ? "disabled" : ""}`;
      card.innerHTML = `<div class="meta"><span class="tag">${c.category}</span><span class="tag">${c.duration}</span><span class="tag ${urgent ? "hot" : "ok"}">${full ? "Liste d’attente" : urgent ? "Plus que " + r + " places" : r + " places restantes"}</span></div><h4>${c.title}</h4><p><b>${c.schedule}</b></p><p>${c.level}</p><div class="bottom"><span class="price">${euro(c.price)}</span><span class="state">${sel ? "Ajouté" : full ? "Complet" : "Ajouter"}</span></div>`;
      if(!full) card.onclick = () => toggle(c);
      grid.appendChild(card);
    });
  }

  function toggle(c){
    if(state.selected.has(c.id)){
      state.selected.delete(c.id);
      botMsg(`J’ai retiré <b>${c.title}</b>.`);
    }else{
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

    if(GOOGLE_APPS_SCRIPT_URL){
      const formData = new FormData();
      formData.append("payload", JSON.stringify(payload));
      fetch(GOOGLE_APPS_SCRIPT_URL, { method:"POST", mode:"no-cors", body: formData });
    }else{
      const local = JSON.parse(localStorage.getItem("preinscriptions-danse-demo") || "[]");
      local.push(payload);
      localStorage.setItem("preinscriptions-danse-demo", JSON.stringify(local));
      console.log(payload);
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

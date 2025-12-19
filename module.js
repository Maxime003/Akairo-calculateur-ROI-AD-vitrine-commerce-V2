document.addEventListener('DOMContentLoaded', function() {
  const btnCalculate = document.querySelector('.btn-calculate');
  if (btnCalculate) {
    btnCalculate.addEventListener('click', calculerROI);
  }
});

function calculerROI() {
  console.log('--- Démarrage du calcul ---');

  // 1. Récupération des valeurs (Avec sécurités)
  const getVal = (id) => parseFloat(document.getElementById(id)?.value) || 0;
  
  const trafic = getVal('trafic');
  const ventes = getVal('ventes');
  const panier = getVal('panier');
  const investissement = getVal('investissement');
  const coutsMensuels = getVal('couts_mensuels');

  // Récupération sécurisée du taux (Si le champ n'existe pas, on prend 33% par défaut)
  let tauxHausseInput = 33;
  const elTaux = document.getElementById('taux_hausse_trafic');
  if (elTaux) {
    tauxHausseInput = parseFloat(elTaux.value) || 33;
  }

  if (trafic <= 0 || ventes <= 0 || panier <= 0) {
    alert('Veuillez renseigner les champs Trafic, Ventes et Panier avec des valeurs positives.');
    return;
  }

  // === 2. LOGIQUE DE CALCUL ===
  
  // Situation AVANT
  const tauxConversion = ventes / trafic;
  const caAvant = ventes * panier;

  // Situation APRÈS
  const multiplicateurTrafic = 1 + (tauxHausseInput / 100);
  const traficApres = trafic * multiplicateurTrafic; 
  const ventesApres = traficApres * tauxConversion;
  const panierApres = panier * 1.295; // Panier fixe à +29.5%
  const caApres = ventesApres * panierApres;
  
  // Calculs Financiers
  const gainMensuel = caApres - caAvant;
  const gainAnnuelCA = gainMensuel * 12;
  const coutInaction = gainMensuel * 6;
  const tresorerieNetteMensuelle = gainMensuel - coutsMensuels;
  const coutsAnnuels = coutsMensuels * 12;
  const beneficeNetAn1 = gainAnnuelCA - coutsAnnuels - investissement;
  const pourcentHausseCA = ((caApres - caAvant) / caAvant) * 100;

  let roiAn1 = 0;
  if (investissement > 0) {
    roiAn1 = (beneficeNetAn1 / investissement) * 100;
  }
  
  let pointMort = 0;
  if (tresorerieNetteMensuelle > 0) {
    pointMort = investissement / tresorerieNetteMensuelle;
  }

  // === 3. AFFICHAGE (Avec vérification d'existence des éléments) ===
  
  // Fonction helper pour afficher du texte sans faire planter le script
  const setText = (id, text) => {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  };
  
  const setHtml = (id, html) => {
      const el = document.getElementById(id);
      if (el) el.innerHTML = html;
  }

  // Mises à jour des résultats
  setText('trafic_avant', formatNumber(trafic) + ' visit.');
  setText('ventes_avant', formatNumber(ventes) + ' ventes');
  setText('panier_avant', formatEuro(panier));
  setText('ca_avant', formatEuro(caAvant));

  setText('trafic_apres', formatNumber(Math.round(traficApres)) + ' visit.');
  setText('ventes_apres', formatNumber(Math.round(ventesApres)) + ' ventes');
  setText('panier_apres', formatEuro(panierApres));
  setText('ca_apres', formatEuro(caApres));

  // Badges dynamiques
  const txtBadgeTrafic = '+' + tauxHausseInput + '%';
  const txtBadgeCA = '+' + pourcentHausseCA.toFixed(1) + '%';
  setText('badge_trafic', txtBadgeTrafic);
  setText('badge_ventes', txtBadgeTrafic);
  setText('badge_ca', txtBadgeCA);

  // Cartes Financières (ROI, Benefice, etc.)
  setText('res_invest', formatEuro(investissement));
  setText('res_ca_1an', formatEuro(gainAnnuelCA));
  
  // Bénéfice avec couleur
  const elBenefice = document.getElementById('res_benefice');
  if (elBenefice) {
    const signe = beneficeNetAn1 > 0 ? '+' : '';
    elBenefice.textContent = signe + formatEuro(beneficeNetAn1);
    elBenefice.style.color = beneficeNetAn1 >= 0 ? '#DE0B19' : '#1A1A1A'; 
  }
  
  // ROI avec couleur
  const elROI = document.getElementById('res_roi');
  if (elROI) {
    elROI.textContent = formatPourcent(roiAn1);
    elROI.style.color = roiAn1 >= 0 ? '#DE0B19' : '#1A1A1A';
  }

  // Bannières
  setText('gain_mensuel', formatEuro(gainMensuel));
  setText('gain_annuel', formatEuro(gainAnnuelCA));
  setText('cout_inaction', formatEuro(coutInaction));

  // Affichage final
  const resultsSection = document.getElementById('results');
  if (resultsSection) {
    resultsSection.style.display = 'block';
    setTimeout(() => resultsSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 100);
  }

  // === 4. TRACKING & TRANSFERT ===
  if (typeof window._hsq !== 'undefined') {
    window._hsq.push(['trackCustomBehavioralEvent', {
      name: 'calculateur_roi_utilise',
      properties: { trafic: trafic, gain_mensuel: gainMensuel, roi_12mois: roiAn1 }
    }]);
  }

  // Remplissage des champs cachés (HubSpot form)
  const donnees = {
    'trafic_visiteurs_mensuel': trafic,
    'gain_mensuel_estime': Math.round(gainMensuel),
    'roi_previsionnel_12_mois': Math.round(roiAn1),
    'budget_investissement_estime': investissement
  };

  for (const [key, val] of Object.entries(donnees)) {
    const input = document.querySelector(`input[name="${key}"]`);
    if (input) {
      input.value = val;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }
}

// === FONCTIONS UTILITAIRES (En dehors de la fonction principale) ===
function formatEuro(value) { return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value); }
function formatNumber(value) { return new Intl.NumberFormat('fr-FR').format(value); }
function formatPourcent(value) { return (value >= 0 ? '+' : '') + value.toFixed(0) + '%'; }

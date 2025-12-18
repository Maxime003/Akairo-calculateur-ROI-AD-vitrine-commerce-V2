// Attendre que le DOM soit chargé
document.addEventListener('DOMContentLoaded', function() {
  const btnCalculate = document.querySelector('.btn-calculate');
  if (btnCalculate) {
    btnCalculate.addEventListener('click', calculerROI);
  }
});

// Fonction principale de calcul ROI
function calculerROI() {
  console.log('Fonction calculerROI appelée');

  // 1. Récupération des valeurs
  const trafic = parseFloat(document.getElementById('trafic').value) || 0;
  const ventes = parseFloat(document.getElementById('ventes').value) || 0;
  const panier = parseFloat(document.getElementById('panier').value) || 0;
  const investissement = parseFloat(document.getElementById('investissement').value) || 0;
  const coutsMensuels = parseFloat(document.getElementById('couts_mensuels').value) || 0;
  
  // NOUVEAU : Récupération du taux variable (par défaut 33 si vide)
  const tauxHausseInput = parseFloat(document.getElementById('taux_hausse_trafic').value) || 33;

  if (trafic <= 0 || ventes <= 0 || panier <= 0) {
    alert('Veuillez renseigner tous les champs avec des valeurs positives.');
    return;
  }

  // === 2. LOGIQUE DE CALCUL DYNAMIQUE ===
  
  // Situation AVANT
  const tauxConversion = ventes / trafic;
  const caAvant = ventes * panier;

  // Situation APRÈS
  // On transforme le taux (ex: 33) en multiplicateur (ex: 1.33)
  const multiplicateurTrafic = 1 + (tauxHausseInput / 100);
  
  const traficApres = trafic * multiplicateurTrafic; 
  const ventesApres = traficApres * tauxConversion;
  
  // Le panier reste fixe à +29.5% (selon votre modèle)
  const panierApres = panier * 1.295; 
  
  const caApres = ventesApres * panierApres;
  
  // Calcul du % d'augmentation global du CA pour le badge
  // Formule : ((Nouveau CA - Ancien CA) / Ancien CA) * 100
  const pourcentHausseCA = ((caApres - caAvant) / caAvant) * 100;

  // Gains et Trésorerie
  const gainMensuel = caApres - caAvant;
  const gainAnnuelCA = gainMensuel * 12;
  const coutInaction = gainMensuel * 6;
  const tresorerieNetteMensuelle = gainMensuel - coutsMensuels;
  const coutsAnnuels = coutsMensuels * 12;
  const beneficeNetAn1 = gainAnnuelCA - coutsAnnuels - investissement;

  let roiAn1 = 0;
  if (investissement > 0) {
    roiAn1 = (beneficeNetAn1 / investissement) * 100;
  }
  
  let pointMort = 0;
  if (tresorerieNetteMensuelle > 0) {
    pointMort = investissement / tresorerieNetteMensuelle;
  }

  // === 3. AFFICHAGE ET MISE À JOUR DES BADGES ===
  
  // Mise à jour des badges dynamiques
  const txtBadgeTrafic = '+' + tauxHausseInput + '%';
  const txtBadgeCA = '+' + pourcentHausseCA.toFixed(1) + '%';
  
  if(document.getElementById('badge_trafic')) document.getElementById('badge_trafic').textContent = txtBadgeTrafic;
  if(document.getElementById('badge_ventes')) document.getElementById('badge_ventes').textContent = txtBadgeTrafic; // Ventes suivent le trafic
  if(document.getElementById('badge_ca')) document.getElementById('badge_ca').textContent = txtBadgeCA;

  // Reste de l'affichage (inchangé)
  // ... (Copiez ici le reste de vos affichages : cartes, tableaux, bannières...)
  document.getElementById('res_invest').textContent = formatEuro(investissement);
  document.getElementById('res_ca_1an').textContent = formatEuro(gainAnnuelCA);
  
  const elBenefice = document.getElementById('res_benefice');
  if (elBenefice) {
    const signe = beneficeNetAn1 > 0 ? '+' : '';
    elBenefice.textContent = signe + formatEuro(beneficeNetAn1);
    elBenefice.style.color = beneficeNetAn1 >= 0 ? '#DE0B19' : '#1A1A1A'; 
  }
  
  const elROI = document.getElementById('res_roi');
  if (elROI) {
    elROI.textContent = formatPourcent(roiAn1);
    elROI.style.color = roiAn1 >= 0 ? '#DE0B19' : '#1A1A1A';
  }

  document.getElementById('trafic_avant').textContent = formatNumber(trafic) + ' visit.';
  document.getElementById('ventes_avant').textContent = formatNumber(ventes) + ' ventes';
  document.getElementById('panier_avant').textContent = formatEuro(panier);
  document.getElementById('ca_avant').textContent = formatEuro(caAvant);

  document.getElementById('trafic_apres').textContent = formatNumber(Math.round(traficApres)) + ' visit.';
  document.getElementById('ventes_apres').textContent = formatNumber(Math.round(ventesApres)) + ' ventes';
  document.getElementById('panier_apres').textContent = formatEuro(panierApres);
  document.getElementById('ca_apres').textContent = formatEuro(caApres);

  document.getElementById('gain_mensuel').textContent = formatEuro(gainMensuel);
  const elGainAnnuel = document.getElementById('gain_annuel');
  if (elGainAnnuel) elGainAnnuel.textContent = formatEuro(gainAnnuelCA);
  
  const elCoutInaction = document.getElementById('cout_inaction');
  if (elCoutInaction) elCoutInaction.textContent = formatEuro(coutInaction);

  const resultsSection = document.getElementById('results');
  resultsSection.style.display = 'block';
  setTimeout(function() {
    resultsSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, 100);
}
// Gardez les fonctions utilitaires formatEuro, etc.

  // Tracking HubSpot
  if (typeof window._hsq !== 'undefined') {
    window._hsq.push(['trackCustomBehavioralEvent', {
      name: 'calculateur_roi_utilise',
      properties: {
        trafic: trafic,
        gain_mensuel: gainMensuel,
        roi_12mois: roiAn1
      }
    }]);
  }

  // Transfert Formulaire
  const donneesATransferer = {
    'trafic_visiteurs_mensuel': trafic,
    'gain_mensuel_estime': Math.round(gainMensuel),
    'roi_previsionnel_12_mois': Math.round(roiAn1),
    'budget_investissement_estime': investissement
  };

  for (const [nomInterne, valeur] of Object.entries(donneesATransferer)) {
    const champ = document.querySelector(`input[name="${nomInterne}"]`);
    if (champ) {
      champ.value = valeur;
      champ.dispatchEvent(new Event('input', { bubbles: true }));
      champ.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }


// Fonctions utilitaires
function formatEuro(value) { return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value); }
function formatNumber(value) { return new Intl.NumberFormat('fr-FR').format(value); }
function formatPourcent(value) { return (value >= 0 ? '+' : '') + value.toFixed(0) + '%'; }

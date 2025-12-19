// Variable globale pour stocker l'instance du graphique (et pouvoir le détruire/recréer)
let roiChartInstance = null;

// Attendre que le DOM soit chargé
document.addEventListener('DOMContentLoaded', function() {
  const btnCalculate = document.querySelector('.btn-calculate');
  if (btnCalculate) {
    btnCalculate.addEventListener('click', calculerROI);
  }
});

// === FONCTION PRINCIPALE ===
function calculerROI() {
  console.log('--- Démarrage du calcul ---');

  // 1. Récupération des valeurs (Fonction helper pour éviter les crashs)
  const getVal = (id) => parseFloat(document.getElementById(id)?.value) || 0;
  
  const trafic = getVal('trafic');
  const ventes = getVal('ventes');
  const panier = getVal('panier');
  const investissement = getVal('investissement');
  const coutsMensuels = getVal('couts_mensuels');

  // Récupération sécurisée du taux de simulation (Défaut 33%)
  let tauxHausseInput = 33;
  const elTaux = document.getElementById('taux_hausse_trafic');
  if (elTaux) {
    tauxHausseInput = parseFloat(elTaux.value) || 33;
  }

  // Validation basique
  if (trafic <= 0 || ventes <= 0 || panier <= 0) {
    alert('Veuillez renseigner les champs Trafic, Ventes et Panier avec des valeurs positives.');
    return;
  }

  // === 2. LOGIQUE DE CALCUL ===
  
  // Situation AVANT (Actuel)
  const tauxConversion = ventes / trafic;
  const caAvant = ventes * panier; // CA Mensuel Avant

  // Situation APRÈS (Projection)
  const multiplicateurTrafic = 1 + (tauxHausseInput / 100);
  const traficApres = trafic * multiplicateurTrafic; 
  const ventesApres = traficApres * tauxConversion;
  const panierApres = panier * 1.295; // Hypothèse fixe : +29.5% de panier
  const caApres = ventesApres * panierApres; // CA Mensuel Après
  
  // Indicateurs Financiers
  const gainMensuel = caApres - caAvant;
  const gainAnnuelCA = gainMensuel * 12;
  const coutInaction = gainMensuel * 6;
  const tresorerieNetteMensuelle = gainMensuel - coutsMensuels;
  const coutsAnnuels = coutsMensuels * 12;
  
  // Bénéfice Net Année 1 (Gain CA 12 mois - Coûts 12 mois - Investissement départ)
  const beneficeNetAn1 = gainAnnuelCA - coutsAnnuels - investissement;
  
  // Pourcentage de hausse globale du CA (pour le badge)
  const pourcentHausseCA = ((caApres - caAvant) / caAvant) * 100;

  // Calcul du ROI (%)
  let roiAn1 = 0;
  if (investissement > 0) {
    roiAn1 = (beneficeNetAn1 / investissement) * 100;
  }

  // === 3. AFFICHAGE DES RÉSULTATS ===
  
  // Helpers pour injecter le texte sans erreur
  const setText = (id, text) => { const el = document.getElementById(id); if (el) el.textContent = text; };
  
  // Tableau Comparatif
  setText('trafic_avant', formatNumber(trafic) + ' visit.');
  setText('ventes_avant', formatNumber(ventes) + ' ventes');
  setText('panier_avant', formatEuro(panier));
  setText('ca_avant', formatEuro(caAvant));

  setText('trafic_apres', formatNumber(Math.round(traficApres)) + ' visit.');
  setText('ventes_apres', formatNumber(Math.round(ventesApres)) + ' ventes');
  setText('panier_apres', formatEuro(panierApres));
  setText('ca_apres', formatEuro(caApres));

  // Mise à jour des badges dynamiques
  const txtBadgeTrafic = '+' + tauxHausseInput + '%';
  const txtBadgeCA = '+' + pourcentHausseCA.toFixed(1) + '%';
  setText('badge_trafic', txtBadgeTrafic);
  setText('badge_ventes', txtBadgeTrafic);
  setText('badge_ca', txtBadgeCA);

  // Cartes Financières (ROI, Benefice, etc.)
  setText('res_invest', formatEuro(investissement));
  setText('res_ca_1an', formatEuro(gainAnnuelCA));
  
  // Bénéfice (avec couleur)
  const elBenefice = document.getElementById('res_benefice');
  if (elBenefice) {
    const signe = beneficeNetAn1 > 0 ? '+' : '';
    elBenefice.textContent = signe + formatEuro(beneficeNetAn1);
    elBenefice.style.color = beneficeNetAn1 >= 0 ? '#DE0B19' : '#1A1A1A'; 
  }
  
  // ROI (avec couleur)
  const elROI = document.getElementById('res_roi');
  if (elROI) {
    elROI.textContent = formatPourcent(roiAn1);
    elROI.style.color = roiAn1 >= 0 ? '#DE0B19' : '#1A1A1A';
  }

  // Bannières & Alertes
  setText('gain_mensuel', formatEuro(gainMensuel));
  setText('gain_annuel', formatEuro(gainAnnuelCA));
  setText('cout_inaction', formatEuro(coutInaction));

  // === 4. GÉNÉRATION DU GRAPHIQUE (Chart.js) ===
  // On passe les CA mensuels, la fonction s'occupe de projeter sur 3 ans
  updateChart(caAvant, caApres);

  // === 5. FINALISATION ===
  const resultsSection = document.getElementById('results');
  if (resultsSection) {
    resultsSection.style.display = 'block';
    // Petit délai pour laisser le temps au graphique de s'initialiser avant de scroller
    setTimeout(() => {
      resultsSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 150);
  }

  // Tracking HubSpot
  if (typeof window._hsq !== 'undefined') {
    window._hsq.push(['trackCustomBehavioralEvent', {
      name: 'calculateur_roi_utilise',
      properties: { trafic: trafic, gain_mensuel: gainMensuel, roi_12mois: roiAn1 }
    }]);
  }

  // Transfert Formulaire
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

// === FONCTION DE GESTION DU GRAPHIQUE ===
function updateChart(caAvantMensuel, caApresMensuel) {
  // Vérifier si le canvas existe dans le HTML
  const canvas = document.getElementById('roiChart');
  if (!canvas) return; // Si pas de canvas, on ne fait rien (évite les erreurs)

  const ctx = canvas.getContext('2d');
  
  // Calculs : On projette le CA cumulé sur 3 ans
  const caAvantAn = caAvantMensuel * 12;
  const caApresAn = caApresMensuel * 12;

  // Données [Départ, An1, An2, An3]
  // On commence à 0 pour que les courbes partent du même point
  const dataSans = [0, caAvantAn, caAvantAn * 2, caAvantAn * 3];
  const dataAvec = [0, caApresAn, caApresAn * 2, caApresAn * 3];

  // Si un graphique existe déjà, on le détruit proprement
  if (roiChartInstance) {
    roiChartInstance.destroy();
  }

  // Création du nouveau graphique
  roiChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: ['Départ', 'Année 1', 'Année 2', 'Année 3'],
      datasets: [
        {
          label: 'Situation Actuelle (Cumulée)',
          data: dataSans,
          borderColor: '#999999', // Gris
          backgroundColor: 'rgba(0,0,0,0)', // Pas de fond
          borderWidth: 2,
          pointRadius: 3,
          tension: 0, // Ligne droite
          borderDash: [5, 5] // Pointillés pour montrer que c'est le "passé/stagnant"
        },
        {
          label: 'Avec Écran AKAIRO (Cumulée)',
          data: dataAvec,
          borderColor: '#DE0B19', // Rouge Akairo
          backgroundColor: 'rgba(222, 11, 25, 0.1)', // Zone de profit rouge pâle
          borderWidth: 3,
          pointRadius: 5,
          pointBackgroundColor: '#FFF',
          pointBorderColor: '#DE0B19',
          pointBorderWidth: 2,
          tension: 0.3, // Légèrement courbé
          fill: '-1' // Remplit l'espace entre cette courbe et la précédente (Zone de profit)
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: { usePointStyle: true, boxWidth: 8, padding: 20 }
        },
        tooltip: {
          mode: 'index',
          intersect: false,
          callbacks: {
            label: function(context) {
              let label = context.dataset.label || '';
              if (label) { label = label.replace(' (Cumulée)', ''); label += ': '; }
              if (context.parsed.y !== null) {
                label += new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(context.parsed.y);
              }
              return label;
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: { color: '#f0f0f0' },
          ticks: {
            callback: function(value) {
              return value >= 1000 ? (value/1000) + ' k€' : value + ' €';
            }
          }
        },
        x: {
          grid: { display: false }
        }
      }
    }
  });
}

// === FONCTIONS UTILITAIRES ===
function formatEuro(value) { return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value); }
function formatNumber(value) { return new Intl.NumberFormat('fr-FR').format(value); }
function formatPourcent(value) { return (value >= 0 ? '+' : '') + value.toFixed(0) + '%'; }

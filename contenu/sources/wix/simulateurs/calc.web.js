/**
 * backend/calc.web.js — Compensatory Allowance Simulator (Grenoble prior)
 *
 * Public API:
 *   simulatePrestationLite({
 *     yearsMarried, yourIncome, partnerIncome, yourAge, partnerAge, childrenCount,
 *     // Optionnels :
 *     softener?, separationYears?, effectiveYears?,
 *     // Santé (nouveau - deux côtés) :
 *     beneficiaryHealthLevel?,   // "H0"|"H1"|"H2"|"H3" (ou none/modere/notable/severe)
 *     beneficiaryHealthBonusN?,  // nombre (prioritaire sur beneficiaryHealthLevel)
 *     payerHealthLevel?,         // "H0"|"H1"|"H2"|"H3"
 *     // Scénarios :
 *     scenarioProfile?,          // "default"|"tight"|"wide"
 *     debug?
 *   })
 *
 * @version 2.5.2-grenoble-prior
 */

import { Permissions, webMethod } from "wix-web-module";

const VERSION = "2.5.2-grenoble-prior";

const DEFAULT_WEIGHTS = {
  durationYearsToNYears: 0.12,
  age_toNYears_max: 1.00,
  ageGap_toNYears_max: 0.40,
  children_toNYears_perChild: 0.30, // (inchangé vs avant 2.6.0)
};

const DEFAULT_CRITERIA = {
  disparitySoftener: 0.90,
  maxNYears: 5,
};

const SCENARIO_PROFILES = {
  default: { prudent: 0.75, median: 1.00, high: 1.30 },
  tight:   { prudent: 0.85, median: 1.00, high: 1.20 },
  wide:    { prudent: 0.70, median: 1.00, high: 1.35 },
};

// — Utils
const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));
function safeNum(v){ if(typeof v==="number")return v; if(v==null)return NaN; const s=String(v).replace(/\s+/g,"").trim(); if(s==="")return NaN; const n=Number(s); return Number.isFinite(n)?n:NaN; }

// Durée : 0–30 → 1:1 ; >30 → +20% (kink empirique)
function saturateDurationYears(years){ const y=Math.max(0,Math.round(safeNum(years))); if(!Number.isFinite(y))return 0; return y<=30?y:30+1.2*(y-30); }

// Âge : cloche centrée ~55 (40–70)
function ageContributionHump(oldestAge,weightMax){ const a=safeNum(oldestAge); if(!Number.isFinite(a))return 0; const t=clamp(1-Math.abs(a-55)/15,0,1); return t*weightMax; }

// Écart d’âge : 0→20 ; amplifié avec l’âge (45→65 : ×1→×2)
function ageGapContribution(yourAge,partnerAge,weightMax){
  const a=safeNum(yourAge), b=safeNum(partnerAge);
  if(!Number.isFinite(a)||!Number.isFinite(b)) return 0;
  const gap=Math.abs(a-b), gap01=clamp(gap/20,0,1);
  const oldest=Math.max(a,b), amp=1+clamp((oldest-45)/20,0,1);
  return gap01*weightMax*amp;
}

// Enfants : 1er=100%, 2e=50%, 3e=25%, puis ~0 (modèle historique)
function childrenContributionConcave(kids, baseWeight){
  const k=Math.max(0,Math.round(safeNum(kids)));
  const factors=[0,1.0,0.5,0.25];
  let sum=0; for(let i=1;i<=k;i++) sum += (factors[i] ?? 0);
  return sum*baseWeight;
}

// Santé — mapping texte → bonus N (bénéficiaire)
function mapBeneficiaryHealthToBonusN(level){
  if(!level) return 0;
  const s=String(level).toLowerCase().trim();
  if(["h0","none","aucun","sans","neant","néant"].includes(s)) return 0.0;
  if(["h1","modere","modéré","moderate","moyen","light"].includes(s)) return 0.6;
  if(["h2","notable","important","significatif"].includes(s)) return 1.5;
  if(["h3","severe","sévère","grave","major"].includes(s)) return 3.0;
  return 0.0;
}

// Santé — mapping texte → multiplicateur D (payeur)
function mapPayerHealthToDisparityFactor(level){
  if(!level) return 1.00;
  const s=String(level).toLowerCase().trim();
  if(["h0","none","aucun","sans","neant","néant"].includes(s)) return 1.00;
  if(["h1","modere","modéré","moderate","moyen","light"].includes(s)) return 0.97;
  if(["h2","notable","important","significatif"].includes(s)) return 0.90;
  if(["h3","severe","sévère","grave","major"].includes(s)) return 0.82;
  return 1.00;
}

// — Core
function computeGrenoblePrior(params, W=DEFAULT_WEIGHTS, C=DEFAULT_CRITERIA, wantDebug=false){
  const {
    yearsMarried, yourIncome, partnerIncome, yourAge, partnerAge, childrenCount,
    softener, separationYears, effectiveYears,
    beneficiaryHealthLevel, beneficiaryHealthBonusN,
    payerHealthLevel,
    scenarioProfile
  } = params || {};

  // Inputs de base
  const years = Math.max(0, Math.round(safeNum(yearsMarried)));
  const kids  = Math.max(0, Math.round(safeNum(childrenCount)));
  const incYou = Math.max(0, safeNum(yourIncome));
  const incPar = Math.max(0, safeNum(partnerIncome));
  const ageYou = safeNum(yourAge);
  const agePar = safeNum(partnerAge);

  // Années utiles
  const sepY = Math.max(0, Math.round(safeNum(separationYears)));
  const effY = safeNum(effectiveYears);
  let yearsEffective = years, yearsEffectiveSource = "yearsMarried";
  if(Number.isFinite(effY) && effY>=0){ yearsEffective=Math.round(effY); yearsEffectiveSource="effectiveYears"; }
  else if(Number.isFinite(sepY) && sepY>0){ yearsEffective=Math.max(0, years - sepY); yearsEffectiveSource="yearsMarried - separationYears"; }

  // Softener (clamp silencieux)
  let softenerUsed = C.disparitySoftener, softenerSource="default";
  const sNum = safeNum(softener);
  if(Number.isFinite(sNum)){
    const sClamped = clamp(sNum, 0.80, 1.05);
    softenerUsed = sClamped;
    softenerSource = (sNum===sClamped) ? "override" : "override_clamped";
  }

  // Disparité brute
  const rawDelta = Math.max(0, incPar - incYou);

  // Santé payeur → multiplicateur sur D
  const payerMult = mapPayerHealthToDisparityFactor(payerHealthLevel);

  // Disparité effective & annuel
  const disparity = rawDelta * softenerUsed * payerMult;
  const annual    = disparity * 12;

  // N_base (durée + âge + gap + enfants historique)
  const nFromDuration = saturateDurationYears(yearsEffective) * W.durationYearsToNYears;
  const nFromAge      = ageContributionHump(Math.max(ageYou, agePar), W.age_toNYears_max);
  const nFromAgeGap   = ageGapContribution(ageYou, agePar, W.ageGap_toNYears_max);
  const nFromChildren = childrenContributionConcave(kids, W.children_toNYears_perChild);
  const N_base = nFromDuration + nFromAge + nFromAgeGap + nFromChildren;

  // Santé bénéficiaire → bonus N
  let bonusHealth = 0;
  const hb = safeNum(beneficiaryHealthBonusN);
  if(Number.isFinite(hb)) bonusHealth = clamp(hb, 0, 4);
  else bonusHealth = mapBeneficiaryHealthToBonusN(beneficiaryHealthLevel);

  const N = clamp(N_base + bonusHealth, 0, C.maxNYears);

  // Scénarios (profils)
  const profKey = (scenarioProfile ?? "default").toString().toLowerCase();
  const prof = SCENARIO_PROFILES[profKey] || SCENARIO_PROFILES.default;

  const capitalRef = N * annual;
  const sPrudent = prof.prudent * capitalRef;
  const sMedian  = prof.median  * capitalRef;
  const sHigh    = prof.high    * capitalRef;

  // “Rente plausible” : info debug (santé bénéficiaire élevée + âge élevé)
  const renteCandidate = (bonusHealth >= 3.0) && Number.isFinite(Math.max(ageYou, agePar)) && Math.max(ageYou, agePar) >= 58;

  const data = {
    monthlyDisparity: disparity,
    annualReference: annual,
    baseNYears: N,
    scenarios: { prudent: sPrudent, median: sMedian, haut: sHigh },
    ...(renteCandidate ? { renteCandidate: true } : {})
  };

  const debug = wantDebug ? {
    version: VERSION,
    inputs: { yearsMarried: years, yourIncome: incYou, partnerIncome: incPar, yourAge: ageYou, partnerAge: agePar, childrenCount: kids },
    weights: { ...W }, criteria: { ...C },
    timeline: { yearsMarriedInput: years, separationYears: Number.isFinite(sepY)?sepY:undefined, yearsEffective, yearsEffectiveSource },
    contributions: { nFromDuration, nFromAge, nFromAgeGap, nFromChildren, bonusHealth },
    disparity: { rawDelta, softenerUsed, softenerSource, payerMult, annualized: annual },
    totals: { N_base, N, capitalRef },
    scenariosProfile: { key: profKey, multipliers: { ...prof } },
    scenariosRaw: { prudent: sPrudent, median: sMedian, high: sHigh }
  } : undefined;

  return { ok:true, data, ...(wantDebug?{debug}:{}) };
}

// — Public API
export const simulatePrestationLite = webMethod(Permissions.Anyone, (params)=>{
  const {
    yearsMarried, yourIncome, partnerIncome, yourAge, partnerAge, childrenCount,
    softener, separationYears, effectiveYears,
    beneficiaryHealthLevel, beneficiaryHealthBonusN, payerHealthLevel,
    scenarioProfile, debug: wantDebug
  } = params || {};

  const errors = [];
  const years = safeNum(yearsMarried), incYou=safeNum(yourIncome), incPar=safeNum(partnerIncome),
        ageYou=safeNum(yourAge), agePar=safeNum(partnerAge), kids=safeNum(childrenCount);

  if(!Number.isFinite(incYou)||incYou<0) errors.push(`Votre revenu mensuel doit être un nombre positif.`);
  if(!Number.isFinite(incPar)||incPar<0) errors.push(`Le revenu mensuel de votre conjoint doit être un nombre positif.`);
  if(!Number.isFinite(years)||years<0||years>80) errors.push(`Les années de mariage doivent être comprises entre 0 et 80.`);
  if(!Number.isFinite(ageYou)||ageYou<16||ageYou>100) errors.push(`Votre âge doit être compris entre 16 et 100 ans.`);
  if(!Number.isFinite(agePar)||agePar<16||agePar>100) errors.push(`L’âge de votre conjoint doit être compris entre 16 et 100 ans.`);
  if(!Number.isFinite(kids)||kids<0||kids>20) errors.push(`Le nombre d’enfants doit être compris entre 0 et 20.`);

  const sepY = safeNum(separationYears), effY = safeNum(effectiveYears);
  if(Number.isFinite(sepY) && sepY<0) errors.push(`Les années de séparation doivent être ≥ 0.`);
  if(Number.isFinite(effY) && effY<0) errors.push(`Les années utiles doivent être ≥ 0.`);

  if(errors.length) return { ok:false, error: errors.join(" ") };

  return computeGrenoblePrior(
    {
      yearsMarried, yourIncome, partnerIncome, yourAge, partnerAge, childrenCount,
      softener, separationYears, effectiveYears,
      beneficiaryHealthLevel, beneficiaryHealthBonusN, payerHealthLevel,
      scenarioProfile
    },
    DEFAULT_WEIGHTS, DEFAULT_CRITERIA, !!(params && params.debug)
  );
});

export const getCalculationModel = webMethod(Permissions.Admin, ()=>({
  version: VERSION,
  weights: { ...DEFAULT_WEIGHTS },
  criteria: { ...DEFAULT_CRITERIA },
  scenarioProfiles: { ...SCENARIO_PROFILES },
}));

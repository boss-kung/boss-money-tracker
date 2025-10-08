export function calcCashback(tx, rule, sumInCycle){
  if(!rule) return 0;
  const amt = tx.amount; let cb = 0;
  if(rule.type==='cashback'){
    if(amt >= (rule.minSpend||0)){
      cb = amt * (rule.percent||0)/100;
      if(rule.capPerSlip) cb = Math.min(cb, rule.capPerSlip);
    }
  }else if(rule.type==='step'){
    const rounds = Math.floor(amt / (rule.stepSpend||1));
    cb = rounds * (rule.stepCash||0);
  }
  if(rule.capPerCycle!=null){
    const remain = Math.max(0, rule.capPerCycle - (sumInCycle||0));
    cb = Math.min(cb, remain);
  }
  return Math.max(0, Math.round(cb*100)/100);
}
export function calcPoints(tx, rule){
  if(!rule) return 0;
  const amt = tx.amount;
  if(rule.type==='points'){
    return Math.floor(amt / (rule.perBaht||1)) * (rule.rate||1);
  }
  if(rule.type==='points-tier'){
    let left = amt, points = 0;
    for(const t of rule.tiers){
      if(t.upto){
        const use = Math.min(left, t.upto);
        points += Math.floor(use/(rule.perBaht||1)) * (t.rate||0);
        left -= use;
      }else if(t.above){
        const use = Math.max(0,left - (t.above||0));
        points += Math.floor(use/(rule.perBaht||1)) * (t.rate||0);
        left -= use;
      }
      if(left<=0) break;
    }
    return points|0;
  }
  return 0;
}

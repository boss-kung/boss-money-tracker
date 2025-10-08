import { useStore } from "./store";
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxsHPD2b5K88hpEOzAl1pV9LjoTa_77oThlg2nqXcqaKRPXlmKLmQm8t6_df-f15Bvu/exec";
export async function syncPull(){
  try{
    const url = SCRIPT_URL + "?entity=Transactions";
    const res = await fetch(url);
    const json = await res.json();
    if(json.ok && Array.isArray(json.rows)){
      useStore.setState({ transactions: json.rows.map(n=>({
        id: n.id || Date.now()+Math.random(),
        note: n.note || '',
        amount: Number(n.amount)||0,
        type: n.type || 'expense',
        date: n.date || new Date().toISOString(),
        cashback: Number(n.cashback)||0,
        points: Number(n.points)||0,
      })) });
      return true;
    }
  }catch(e){ console.error(e); }
  return false;
}
export function addRecurring(baseTx, months){
  const list=[]; const now=new Date();
  for(let i=0;i<months;i++){
    const d=new Date(now); d.setMonth(now.getMonth()+i);
    list.push({ ...baseTx, id: Date.now()+i, date:d.toISOString(), recurring:true });
  }
  const txs=[...useStore.getState().transactions, ...list];
  useStore.setState({ transactions: txs });
  return months;
}
export function addInstallment(baseTx, months){
  const per = Number(baseTx.amount)/months;
  const list=[]; const now=new Date();
  for(let i=0;i<months;i++){
    const d=new Date(now); d.setMonth(now.getMonth()+i);
    list.push({ id:Date.now()+i, note:`${baseTx.note} (งวด ${i+1}/${months})`, amount:Number(per.toFixed(2)), type:baseTx.type, date:d.toISOString(), installment:true });
  }
  const txs=[...useStore.getState().transactions, ...list];
  useStore.setState({ transactions: txs });
  return months;
}

import create from "zustand";
export const useStore = create((set, get) => ({
  tab: 'dashboard',
  setTab: (t)=>set({tab:t}),
  wallets: [{ id:'w1', name:'กระเป๋าหลัก', type:'บัญชี', currency:'THB', balance: 0 }],
  categories: [{ id:'c1', name:'อาหาร', type:'Expense', emoji:'🍜' },{ id:'c2', name:'เงินเดือน', type:'Income', emoji:'💼' }],
  shops: [{ id:'s1', name:'Shopee', emoji:'🛍️' },{ id:'s2', name:'KFC', emoji:'🍗' }],
  transactions: [],
  perks: {
    'creditA': { type:'cashback', percent:5, minSpend:500, capPerSlip:50, capPerCycle:1000, cycleStart:11, cycleEnd:10 },
    'creditB': { type:'cashback', percent:1, minSpend:0, capPerSlip:Infinity, capPerCycle:200, cycleStart:1, cycleEnd:31 },
    'creditC': { type:'step', stepSpend:300, stepCash:15, capPerCycle:600, cycleStart:11, cycleEnd:10 },
    'pointsX': { type:'points', perBaht:25, rate:1 },
    'pointsZ': { type:'points-tier', perBaht:25, tiers:[{upto:20000, rate:5},{above:20000, rate:2}] }
  },
  markets: { usdThb: 37, gold: 35000, btc: 2500000, eth:150000, bnb:20000 },
  addTx: (t)=>set(s=>({transactions:[...s.transactions, t]})),
  delTx: (id)=>set(s=>({transactions:s.transactions.filter(x=>x.id!==id)})),
  addWallet:(w)=>set(s=>({wallets:[...s.wallets,w]})),
  delWallet:(id)=>set(s=>({wallets:s.wallets.filter(w=>w.id!==id)})),
  addCategory:(c)=>set(s=>({categories:[...s.categories,c]})),
  delCategory:(id)=>set(s=>({categories:s.categories.filter(c=>c.id!==id)})),
  addShop:(c)=>set(s=>({shops:[...s.shops,c]})),
  delShop:(id)=>set(s=>({shops:s.shops.filter(c=>c.id!==id)})),
  updateMarket: async ()=>{
    try{
      const usd = await fetch("https://api.exchangerate.host/latest?base=USD&symbols=THB").then(r=>r.json());
      const gold = 35000 + Math.random()*500;
      const btc = 2500000 + Math.random()*100000;
      const eth = 150000 + Math.random()*5000;
      const bnb = 20000 + Math.random()*1000;
      set({ markets:{ usdThb: usd?.rates?.THB ?? get().markets.usdThb, gold, btc, eth, bnb } });
    }catch(e){ console.error(e); }
  },
}));

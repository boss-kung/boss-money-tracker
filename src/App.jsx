import React, { useMemo, useState } from "react";
import { PieChart, Pie, Cell, Tooltip } from "recharts";
import { useStore } from "./features/store";
import { calcCashback, calcPoints } from "./features/perks";
import { syncPull, addRecurring, addInstallment } from "./features/sync";

function Section({title, children}){ return <div className="card"><div className="font-semibold mb-2">{title}</div>{children}</div> }

export default function App(){
  const { tab, setTab, transactions, wallets, categories, shops, markets,
          addTx, delTx, addWallet, delWallet, addCategory, delCategory, addShop, delShop, updateMarket } = useStore();

  const [openAdd, setOpenAdd] = useState(false);
  const [toast, setToast] = useState(null);
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0,10),
    type: 'expense',
    wallet: wallets[0]?.id || '',
    to_wallet: '',
    category: categories[0]?.id || '',
    shop: shops[0]?.id || '',
    amount: '',
    note: '',
    usePerk: true,
    cardKey: 'creditA',
    months: 3,
  });

  const income = useMemo(()=>transactions.filter(t=>t.type==='income').reduce((a,b)=>a+b.amount,0),[transactions]);
  const expense= useMemo(()=>transactions.filter(t=>t.type==='expense').reduce((a,b)=>a+b.amount,0),[transactions]);
  const pie = [{name:'รายรับ', value:income},{name:'รายจ่าย', value:expense}];

  const submit = ()=>{
    if(!form.amount) return;
    const tx = {
      id: Date.now(),
      date: form.date,
      type: form.type,
      wallet: form.wallet,
      to_wallet: form.type==='transfer' ? form.to_wallet : '',
      category: form.category,
      shop: form.shop,
      amount: Number(form.amount),
      note: form.note,
    };
    if(form.usePerk && form.type==='expense'){
      const st = useStore.getState();
      const rule = st.perks[form.cardKey];
      const sumInCycle = st.transactions.reduce((a,b)=>a+(b.cashback||0),0);
      tx.cashback = calcCashback(tx, rule, sumInCycle);
      tx.points   = calcPoints(tx, rule);
    }
    addTx(tx);
    setOpenAdd(false);
    setToast("บันทึกสำเร็จ ✓"); setTimeout(()=>setToast(null),1600);
  };

  const COLORS = ["#10B981", "#EF4444"];

  return (
    <div className="pb-28">
      {toast && <div className="toast">{toast}</div>}
      <div className="p-4 space-y-4">
        {tab==='dashboard' && (
          <>
            <Section title="ภาพรวมเดือนนี้ (THB)">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="card bg-gray-800"><div className="text-xs opacity-70">รายรับ</div><div className="text-2xl text-green-400">{income.toLocaleString()}</div></div>
                <div className="card bg-gray-800"><div className="text-xs opacity-70">รายจ่าย</div><div className="text-2xl text-red-400">{expense.toLocaleString()}</div></div>
              </div>
              <div className="flex justify-center mt-3">
                <PieChart width={280} height={200}>
                  <Pie data={pie} cx={140} cy={100} innerRadius={50} outerRadius={80} dataKey="value">
                    <Cell fill="#10B981"/><Cell fill="#EF4444"/>
                  </Pie>
                  <Tooltip/>
                </PieChart>
              </div>
            </Section>

            <Section title="ตลาด (Refresh อัปเดต)">
              <button onClick={updateMarket} className="btn-ghost mb-2">Refresh</button>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>USD/THB: <b>{markets.usdThb?.toFixed(2)}</b></div>
                <div>ทอง (เดโม่): <b>{Math.round(markets.gold)}฿</b></div>
                <div>BTC: <b>{markets.btc?.toLocaleString()}฿</b></div>
                <div>ETH: <b>{markets.eth?.toLocaleString()}฿</b></div>
                <div>BNB: <b>{markets.bnb?.toLocaleString()}฿</b></div>
              </div>
            </Section>

            <Section title="รายการล่าสุด">
              {transactions.slice(-10).reverse().map(t=>(
                <div key={t.id} className="flex items-center justify-between py-2 border-b border-gray-700">
                  <div>
                    <div className="text-sm">{t.note || '-'}</div>
                    <div className="text-xs opacity-70">{t.date?.slice(0,10)} {t.cashback?`• เงินคืน ${t.cashback}฿`:''} {t.points?`• ${t.points} คะแนน`:''}</div>
                  </div>
                  <div className={t.type==='income'?'text-green-400':'text-red-400'}>{t.amount.toLocaleString()}</div>
                </div>
              ))}
            </Section>
          </>
        )}

        {tab==='wallets' && (
          <>
            <Section title="กระเป๋าเงิน">
              <div className="grid grid-cols-2 gap-3">
                {wallets.map(w=>(
                  <div key={w.id} className="card">
                    <div className="font-semibold">{w.name}</div>
                    <div className="text-xs opacity-70">{w.type} • {w.currency}</div>
                    <div className="mt-2 text-xl">{(w.balance||0).toLocaleString()}</div>
                    <button className="btn-ghost mt-2 text-red-300" onClick={()=>delWallet(w.id)}>ลบ</button>
                  </div>
                ))}
                <button className="card btn-ghost" onClick={()=>addWallet({id: 'w'+Date.now(), name:'กระเป๋าใหม่', type:'บัญชี', currency:'THB', balance:0})}>+ เพิ่มกระเป๋า</button>
              </div>
            </Section>

            <Section title="สิทธิประโยชน์บัตรเครดิต">
              <div className="text-sm opacity-80">ตอนเพิ่มรายการ เลือก "ใช้สิทธิ์บัตร" เพื่อให้ระบบคำนวณเงินคืน/คะแนนอัตโนมัติ (ไม่หักวงเงินจริง)</div>
            </Section>
          </>
        )}

        {tab==='transactions' && (
          <Section title="รายการเดินบัญชี">
            <table>
              <thead><tr><th className="text-left">วันที่</th><th className="text-left">ประเภท</th><th className="text-left">หมายเหตุ</th><th className="text-right">จำนวน</th><th></th></tr></thead>
              <tbody>
                {transactions.map(t=>(
                  <tr key={t.id}>
                    <td>{t.date?.slice(0,10)}</td>
                    <td>{t.type}</td>
                    <td className="truncate">{t.note}</td>
                    <td className="text-right">{t.amount.toLocaleString()}</td>
                    <td className="text-right"><button className="text-gray-300 hover:text-red-400" onClick={()=>delTx(t.id)}>ลบ</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>
        )}

        {tab==='settings' && (
          <>
            <Section title="ซิงก์กับ Google Sheets">
              <div className="text-sm mb-2 opacity-80">เชื่อมกับสคริปต์ที่ตั้งไว้แล้ว</div>
              <button className="btn-ghost" onClick={async()=>{const ok = await syncPull(); setToast(ok?'Sync สำเร็จ ✓':'Sync ล้มเหลว ❌'); setTimeout(()=>setToast(null),1600);}}>Sync Now</button>
            </Section>

            <Section title="หมวดหมู่ / ร้านค้า (มีอีโมจิ)">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="font-semibold mb-1">หมวดหมู่</div>
                  {categories.map(c=>(
                    <div key={c.id} className="flex items-center justify-between py-1">
                      <div>{c.emoji} {c.name}</div>
                      <button className="text-sm text-red-300" onClick={()=>delCategory(c.id)}>ลบ</button>
                    </div>
                  ))}
                  <button className="btn-ghost mt-2" onClick={()=>addCategory({id:'c'+Date.now(), name:'ใหม่', type:'Expense', emoji:'✨'})}>+ เพิ่ม</button>
                </div>
                <div>
                  <div className="font-semibold mb-1">ร้านค้า/แพลตฟอร์ม</div>
                  {shops.map(s=>(
                    <div key={s.id} className="flex items-center justify-between py-1">
                      <div>{s.emoji} {s.name}</div>
                      <button className="text-sm text-red-300" onClick={()=>delShop(s.id)}>ลบ</button>
                    </div>
                  ))}
                  <button className="btn-ghost mt-2" onClick={()=>addShop({id:'s'+Date.now(), name:'ร้านใหม่', emoji:'🛒'})}>+ เพิ่ม</button>
                </div>
              </div>
            </Section>
          </>
        )}
      </div>

      <button className="fab" onClick={()=>setOpenAdd(true)}>＋</button>

      <div className="navbar flex justify-around py-2">
        <button onClick={()=>setTab('dashboard')} className={tab==='dashboard'?'text-white':'text-gray-400'}>Dashboard</button>
        <button onClick={()=>setTab('wallets')} className={tab==='wallets'?'text-white':'text-gray-400'}>Wallet</button>
        <button onClick={()=>setTab('transactions')} className={tab==='transactions'?'text-white':'text-gray-400'}>Transaction</button>
        <button onClick={()=>setTab('settings')} className={tab==='settings'?'text-white':'text-gray-400'}>Setting</button>
      </div>

      {openAdd && (
        <div className="drawer" onClick={()=>setOpenAdd(false)}>
          <div className="drawer-panel" onClick={(e)=>e.stopPropagation()}>
            <div className="h-1.5 w-10 bg-gray-600 rounded-full mx-auto mb-3"></div>
            <div className="font-semibold mb-2">เพิ่มรายการ</div>
            <div className="grid grid-cols-2 gap-2">
              <input type="date" value={form.date} onChange={e=>setForm({...form, date:e.target.value})}/>
              <select value={form.type} onChange={e=>setForm({...form, type:e.target.value})}>
                <option value="income">รายรับ</option>
                <option value="expense">รายจ่าย</option>
                <option value="transfer">โอนย้าย</option>
              </select>
              <select value={form.wallet} onChange={e=>setForm({...form, wallet:e.target.value})}>
                {wallets.map(w=><option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
              {form.type==='transfer' ? (
                <select value={form.to_wallet} onChange={e=>setForm({...form, to_wallet:e.target.value})}>
                  <option value="">ไปกระเป๋า...</option>
                  {wallets.filter(w=>w.id!==form.wallet).map(w=><option key={w.id} value={w.id}>{w.name}</option>)}
                </select>
              ):(
                <select value={form.category} onChange={e=>setForm({...form, category:e.target.value})}>
                  {categories.map(c=><option key={c.id} value={c.id}>{c.emoji} {c.name}</option>)}
                </select>
              )}
              <select value={form.shop} onChange={e=>setForm({...form, shop:e.target.value})}>
                {shops.map(s=><option key={s.id} value={s.id}>{s.emoji} {s.name}</option>)}
              </select>
              <input type="number" placeholder="จำนวนเงิน" value={form.amount} onChange={e=>setForm({...form, amount:e.target.value})}/>
              <input placeholder="บันทึก/โน้ต" value={form.note} onChange={e=>setForm({...form, note:e.target.value})}/>
            </div>

            {form.type==='expense' && (
              <div className="mt-3 p-3 rounded-xl bg-gray-800">
                <div className="flex items-center justify-between">
                  <div className="font-semibold">สิทธิ์บัตรเครดิต</div>
                  <label className="text-sm">
                    <input type="checkbox" checked={form.usePerk} onChange={e=>setForm({...form, usePerk:e.target.checked})}/> ใช้คำนวณ
                  </label>
                </div>
                <select className="mt-2" value={form.cardKey} onChange={e=>setForm({...form, cardKey:e.target.value})}>
                  <option value="creditA">บัตร A (5% min 500 / cap 50 ต่อสลิป / 1000 ต่อรอบ)</option>
                  <option value="creditB">บัตร B (1% ไม่มีขั้นต่ำ / cap 200 ต่อรอบ)</option>
                  <option value="creditC">บัตร C (ทุกๆ 300 คืน 15 / cap 600 ต่อรอบ)</option>
                  <option value="pointsX">บัตร X (25฿ = 1 คะแนน)</option>
                  <option value="pointsZ">บัตร Z (25฿ = 5 คะแนนช่วงแรก, จากนั้น 2)</option>
                </select>
                <div className="text-xs opacity-80 mt-1">* เงินคืน/คะแนน “บันทึกไว้ดูสิทธิ์” ไม่หักวงเงิน</div>
              </div>
            )}

            <div className="mt-3 grid grid-cols-3 gap-2">
              <input type="number" value={form.months} onChange={e=>setForm({...form, months: Number(e.target.value||1)})} />
              <button className="btn-ghost" onClick={()=>{ const n=addRecurring({id:Date.now(),note:form.note,amount:Number(form.amount||0),type:form.type}, form.months); setToast(`สร้างรายการประจำ ${n} รายการ ✓`); setTimeout(()=>setToast(null),1600); }}>Recurring</button>
              <button className="btn-ghost" onClick={()=>{ const n=addInstallment({id:Date.now(),note:form.note,amount:Number(form.amount||0),type:'expense'}, form.months); setToast(`สร้างผ่อนชำระ ${n} งวด ✓`); setTimeout(()=>setToast(null),1600); }}>Installment</button>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <button className="btn" onClick={submit}>บันทึก</button>
              <button className="btn-ghost" onClick={()=>setOpenAdd(false)}>ยกเลิก</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

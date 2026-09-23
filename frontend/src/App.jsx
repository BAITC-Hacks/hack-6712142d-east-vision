import React, { useState } from 'react';
import { categories, districts, initiatives } from './data';

export function Icon({ name = 'grid', size = 20, ...props }) {
  const paths = {
    grid: <><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></>,
    map: <><path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3Z"/><path d="M9 3v15M15 6v15"/></>,
    chart: <><path d="M4 3v17h17M8 15v-4m5 4V7m5 8V4"/></>,
    arrow: <path d="M5 12h14m-6-6 6 6-6 6"/>,
    plus: <path d="M12 5v14M5 12h14"/>,
    check: <path d="m5 12 4 4L19 6"/>,
    close: <path d="m6 6 12 12M18 6 6 18"/>,
    bus: <><rect x="5" y="3" width="14" height="16" rx="3"/><path d="M5 11h14M8 19v2m8-2v2M8 15h1m6 0h1"/></>,
    leaf: <><path d="M20 3c-9-1-17 5-15 12s15 7 15-12Z"/><path d="M3 21 15 9"/></>,
    people: <><circle cx="9" cy="7" r="3"/><path d="M3 21v-3a6 6 0 0 1 12 0v3M16 4a3 3 0 0 1 0 6m2 4a5 5 0 0 1 3 5v2"/></>,
    shield: <><path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6Z"/><path d="m8 12 3 3 5-6"/></>,
    bolt: <path d="m13 2-9 12h7l-1 8 10-13h-7Z"/>,
    clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
    pin: <><path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z"/><circle cx="12" cy="10" r="2"/></>,
    info: <><circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10v1"/></>,
    spark: <><path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5Z"/></>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>{paths[name] || paths.grid}</svg>;
}

function CityMap({ active, onSelect }) {
  const shapes = [
    { name:'Сарыарка', path:'M78 85 218 43 296 95 269 180 165 207 69 153Z', x:178,y:126 },
    { name:'Байконур', path:'M307 93 405 44 514 93 502 181 410 209 284 179Z', x:398,y:130 },
    { name:'Алматы', path:'M523 104 607 166 569 286 469 298 418 223 511 191Z', x:523,y:228 },
    { name:'Есиль', path:'M184 220 275 194 401 230 450 306 361 373 247 334 194 287Z', x:321,y:278 },
    { name:'Нура', path:'M64 172 158 220 173 293 235 343 172 388 66 325 31 251Z', x:116,y:286 },
  ];
  return <svg className="city-map" viewBox="0 0 650 420" role="group" aria-label="Условная схема пяти районов Астаны">
    <defs><pattern id="dots" width="18" height="18" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r=".85" fill="#cbd2dc"/></pattern><pattern id="blocks" width="28" height="28" patternTransform="rotate(-18)" patternUnits="userSpaceOnUse"><path d="M0 0h28v28" fill="none" stroke="white" strokeWidth="1.7"/></pattern></defs>
    <rect width="650" height="420" fill="url(#dots)"/>
    <path d="M-30 160C130 90 89 262 228 209S373 184 398 283 522 350 680 331" fill="none" stroke="#cce2ff" strokeWidth="22"/>
    {shapes.map(s => <g key={s.name} className={`map-region ${active === s.name ? 'active' : ''}`} role="button" tabIndex="0" aria-label={`Район ${s.name}`} aria-pressed={active===s.name} onClick={()=>onSelect(s.name)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();onSelect(s.name);}}}>
      <path className="region-fill" d={s.path}/><path d={s.path} fill="url(#blocks)" opacity=".65" pointerEvents="none"/>
      <text x={s.x} y={s.y} textAnchor="middle" className="map-name">{s.name}</text><text x={s.x} y={s.y+22} textAnchor="middle" className="map-score">{districts.find(d=>d.name===s.name).score.toFixed(1)}</text>
    </g>)}
    <text x="418" y="365" className="river-label" transform="rotate(-12 418 365)">Е С И Л Ь</text>
    <g transform="translate(596 28)" stroke="#7c899b" fill="none"><path d="m0 24 7-20 7 20-7-5Z"/><text x="7" y="-3" textAnchor="middle" stroke="none" fill="#7c899b" fontSize="10">С</text></g>
  </svg>;
}

export default function App() {
  const [page, setPage] = useState('overview');
  const [category, setCategory] = useState('all');
  const [activeDistrict, setActiveDistrict] = useState('Нура');
  const [decisions, setDecisions] = useState([]);
  const [notice, setNotice] = useState('');
  const [showHelp, setShowHelp] = useState(false);
  const [review, setReview] = useState(false);
  const district = districts.find(d=>d.name===activeDistrict);
  const used = decisions.reduce((sum,d)=>sum+initiatives.find(i=>i.id===d.id).cost,0);
  const chosen = decisions.map(d=>({...initiatives.find(i=>i.id===d.id), district:d.district}));
  const visible = initiatives.filter(i=>category==='all'||i.category===category);
  function add(item) {
    setNotice('');
    if(decisions.some(d=>d.id===item.id)){setDecisions(decisions.filter(d=>d.id!==item.id));setReview(false);return;}
    if(decisions.length>=5) return setNotice('В сценарии уже пять решений. Уберите одно, чтобы выбрать другое.');
    if(used+item.cost>100) return setNotice('На эту инициативу не хватает бюджета. Измените состав сценария.');
    if(chosen.filter(d=>d.category===item.category).length>=2) return setNotice('Можно выбрать не более двух инициатив одного направления.');
    const target=item.type==='district'?activeDistrict:null;
    if(chosen.some(d=>([d.id,item.id].includes('M1')&&[d.id,item.id].includes('M3')) || ([['M4','M7'],['M5','M13']].some(pair=>pair.includes(d.id)&&pair.includes(item.id))&&d.district===target))) return setNotice('Эта инициатива конфликтует с уже выбранной. Измените район или состав сценария.');
    setDecisions([...decisions,{id:item.id,district:target}]);setReview(false);
  }
  function navigate(next){setPage(next);setNotice('');setReview(false);}
  return <div className="app-shell">
    <aside className="sidebar">
      <a className="brand" href="#" onClick={e=>{e.preventDefault();navigate('overview');}}><span className="brand-mark">a<span>ı</span></span><span>akim<span className="brand-dot">.</span><small>ГОРОД НАЧИНАЕТСЯ С ВАС</small></span></a>
      <div className="workspace-label">ВАШЕ РАБОЧЕЕ ПРОСТРАНСТВО</div>
      <nav aria-label="Основная навигация">{[['overview','grid','Обзор города'],['initiatives','bolt','Инициативы'],['districts','map','Районы'],['scenario','chart','Мой сценарий']].map(([id,icon,label])=><button key={id} className={`nav-item ${page===id?'selected':''}`} onClick={()=>navigate(id)}><Icon name={icon}/>{label}{id==='scenario'&&<span className="nav-count">{decisions.length}</span>}</button>)}</nav>
      <div className="sidebar-note"><span className="tiny-label">ВАША МИССИЯ</span><h3>Пять решений.<br/>Один город.</h3><p>Найдите баланс между потребностями районов и возможностями города.</p><div className="mission-dots">{[0,1,2,3,4].map(n=><span key={n} className={n<decisions.length?'filled':''}/>)}</div><span>{decisions.length} из 5 решений принято</span></div>
      <button className="help-button" onClick={()=>setShowHelp(true)}><Icon name="info"/>Как устроен симулятор <span>↗</span></button>
      <div className="profile"><span className="avatar">АК</span><div><strong>Аким города</strong><small>Демонстрационный режим</small></div><span className="online-dot"/></div>
    </aside>
    <div className="main-shell">
      <header className="topbar"><div className="breadcrumb">Рабочее пространство <span>/</span> <strong>Астана</strong></div><div className="topbar-right"><span className="demo-tag"><span/>Песочница</span><span className="edition">HACKALEM 2026</span></div></header>
      <main>
        <section className="page-heading"><div><div className="eyebrow"><span/> ГОРОД В ВАШИХ РУКАХ</div><h1>{page==='overview'?'Большие перемены.':page==='initiatives'?'Решения, которые меняют.':page==='districts'?'Каждый район важен.':'Ваш план для города.'}<span>{page==='overview'?'Начните с пяти решений.':page==='initiatives'?'Выберите свои приоритеты.':page==='districts'?'Посмотрите внимательнее.':'От идеи — к переменам.'}</span></h1><p>Распределяйте ресурсы. Развивайте районы. Создавайте Астану для людей.</p></div><button className="subtle-button" onClick={()=>setShowHelp(true)}><Icon name="clock" size={16}/>Горизонт: 2 года<Icon name="info" size={15}/></button></section>
        <div className="dashboard-layout"><div className="content-column">
          {(page==='overview'||page==='districts')&&<section className="map-panel panel"><div className="section-header"><div><h2>Пульс города <span className="small-pill">5 районов</span></h2><p>У каждого района — свои точки роста</p></div><span className="live-label"><span/>Исходные данные</span></div><div className="map-content"><CityMap active={activeDistrict} onSelect={setActiveDistrict}/><div className="map-legend"><span><i className="legend-dot"/>Выбранный район</span><span>Условная схема · не географическая карта</span></div></div><div className="district-strip"><div className="district-icon"><Icon name="pin"/></div><div className="district-copy"><strong>{district.name}<span>{district.population}% жителей города</span></strong><p>{district.description}</p></div><div className="district-score"><strong>{district.score.toFixed(1)}</strong><span>индекс района</span></div></div></section>}
          {page==='districts'&&<section className="panel district-detail"><div className="section-header"><div><h2>Показатели района {district.name}</h2><p>Средние значения по направлениям · шкала 0–100</p></div></div>{categories.slice(1).map((c,i)=><div className="indicator-row" key={c.id}><span><Icon name={c.icon}/>{c.name}</span><div className="indicator-track"><span style={{width:`${district.values[i]}%`}}/></div><strong>{district.values[i]}</strong></div>)}</section>}
          {(page==='overview'||page==='initiatives')&&<section className="initiatives-section"><div className="section-header initiative-header"><div><div className="eyebrow muted">ОТ ВОЗМОЖНОСТЕЙ К ДЕЙСТВИЯМ</div><h2>Какой будет ваша Астана?</h2></div><span className="catalog-count">14 инициатив</span></div><div className="category-tabs" role="group" aria-label="Направление инициатив">{categories.map(c=><button key={c.id} onClick={()=>setCategory(c.id)} className={category===c.id?'active':''}><Icon name={c.icon} size={16}/>{c.name}</button>)}</div><div className="catalog-toolbar"><span>Каждое решение меняет город</span><label><Icon name="pin" size={15}/><select aria-label="Район для новых инициатив" value={activeDistrict} onChange={e=>setActiveDistrict(e.target.value)}>{districts.map(d=><option key={d.name}>{d.name}</option>)}</select></label></div><div className="initiative-grid">{visible.map(item=>{const cat=categories.find(c=>c.id===item.category);const selected=decisions.some(d=>d.id===item.id);return <article className={`initiative-card ${selected?'is-selected':''}`} key={item.id}><div className="card-top"><span className={`category-icon ${item.category}`}><Icon name={cat.icon} size={22}/></span><span className="card-category">{cat.name}</span><span className="initiative-id">{item.id}</span></div><h3>{item.name}</h3><p>{item.description}</p><div className="effect-label"><Icon name="chart" size={14}/>{item.effect}<span title="Полный эффект до учёта лага">*</span></div><div className="card-meta"><span><Icon name="pin" size={13}/>{item.type==='city'?'Весь город':chosen.find(d=>d.id===item.id)?.district||activeDistrict}</span><span><Icon name="clock" size={13}/>{item.lag} кв.</span></div><div className="card-bottom"><div><strong>{item.cost}</strong><span> ед. бюджета</span></div><button className={selected?'add-button added':'add-button'} onClick={()=>add(item)} aria-label={`${selected?'Убрать':'Добавить'}: ${item.name}`}><Icon name={selected?'check':'plus'} size={17}/>{selected?'В сценарии':'Добавить'}</button></div></article>;})}</div><p className="catalog-footnote">* Показан полный эффект мероприятия. Итоговое влияние зависит от срока реализации и сочетания решений.</p></section>}
          {page==='scenario'&&<section className="panel scenario-page"><div className="section-header"><div><h2>Сценарий развития</h2><p>Ваши приоритеты на ближайшие восемь кварталов</p></div><span className="small-pill">{decisions.length} / 5</span></div>{chosen.length?chosen.map((item,i)=><div className="scenario-row" key={item.id}><span className="row-number">0{i+1}</span><div><h3>{item.name}</h3><p>{item.district||'Весь город'} · Начало эффекта через {item.lag} кв.</p></div><strong>{item.cost} ед.</strong><button className="icon-button" aria-label={`Убрать: ${item.name}`} onClick={()=>add(item)}><Icon name="close" size={16}/></button></div>):<div className="empty-scenario"><Icon name="map" size={40}/><h3>Будущее города начинается с выбора</h3><p>Добавьте инициативы, чтобы собрать свой первый сценарий.</p><button className="primary-button" onClick={()=>navigate('initiatives')}>Выбрать инициативы <Icon name="arrow" size={17}/></button></div>}{chosen.length>0&&<button className="text-button" onClick={()=>navigate('initiatives')}>Продолжить выбор <Icon name="arrow" size={16}/></button>}</section>}
        </div>
        <aside className="right-column"><section className="score-card"><div className="score-header"><span>КАЧЕСТВО ЖИЗНИ</span><Icon name="chart" size={20}/></div><div className="score-value">52<span>,56</span><small>/ 100</small></div><div className="score-track"><span/></div><p>Astana Quality of Life Score</p><div className="score-footer"><span className="dark-dot"/>Отправная точка вашего сценария</div><div className="score-orbit orbit-one"/><div className="score-orbit orbit-two"/></section>
          <section className="panel budget-panel"><div className="section-header"><h2>Бюджет города</h2><Icon name="bolt" size={18}/></div><div className="budget-value">{100-used}<span>/ 100 ед.</span></div><p className="budget-caption">доступно для ваших решений</p><div className="budget-track"><span style={{width:`${used}%`}}/></div><div className="budget-labels"><span><i/>Распределено</span><strong>{used} ед.</strong></div><div className="budget-divider"/><div className="plan-heading"><h3>Ваши решения</h3><span>{decisions.length} из 5</span></div><div className="decision-slots">{Array.from({length:5},(_,i)=>chosen[i]?<div className="decision-slot occupied" key={i}><span className="slot-number"><Icon name="check" size={13}/></span><div><strong>{chosen[i].name}</strong><small>{chosen[i].district||'Весь город'} · {chosen[i].cost} ед.</small></div><button className="icon-button" onClick={()=>add(chosen[i])} aria-label={`Удалить решение ${i+1}`}><Icon name="close" size={14}/></button></div>:<div className="decision-slot" key={i}><span className="slot-number">0{i+1}</span><span>Место для перемен</span><span className="slot-plus">+</span></div>)}</div><button className="primary-button" disabled={decisions.length!==5} onClick={()=>{setReview(true);setPage('scenario');}}>Посмотреть сценарий<Icon name="arrow" size={17}/></button><p className="button-hint">{decisions.length===5?'Пять решений — ваш план готов к просмотру':'Выберите ровно 5 инициатив'}</p>{decisions.length>0&&<button className="reset-button" onClick={()=>{setDecisions([]);setReview(false);setNotice('');}}>Сбросить сценарий</button>}</section>
          <section className="insight-card"><span className="insight-icon"><Icon name="spark" size={20}/></span><div><h3>Начните с тех, кому нужнее</h3><p>В Нуре не хватает школ и поликлиник. Поддержка слабого района влияет на качество жизни всего города.</p><button onClick={()=>{navigate('initiatives');setCategory('social');setActiveDistrict('Нура');}}>Посмотреть решения <Icon name="arrow" size={15}/></button></div></section>
        </aside></div>
        {review&&<div className="review-message" role="status"><Icon name="check"/><div><strong>Сценарий собран: 5 решений на {used} единиц</strong><p>Это предпросмотр интерфейса. Расчёт итогового индекса и AI-анализ появятся после подключения сервера.</p></div><button className="icon-button" aria-label="Закрыть уведомление" onClick={()=>setReview(false)}><Icon name="close"/></button></div>}
        <footer className="page-footer"><span>akim. <span>Маленькие решения. Большое будущее.</span></span><span>Синтетические данные · Демонстрация интерфейса</span></footer>
      </main>
    </div>
    {notice&&<div className="toast" role="alert"><Icon name="info"/><span>{notice}</span><button className="icon-button" aria-label="Закрыть" onClick={()=>setNotice('')}><Icon name="close" size={18}/></button></div>}
    {showHelp&&<div className="modal-backdrop" onClick={()=>setShowHelp(false)}><section className="help-modal" role="dialog" aria-modal="true" aria-labelledby="help-title" onClick={e=>e.stopPropagation()} onKeyDown={e=>{if(e.key==='Escape')setShowHelp(false);}}><button autoFocus className="modal-close icon-button" aria-label="Закрыть правила" onClick={()=>setShowHelp(false)}><Icon name="close"/></button><span className="category-icon"><Icon name="map" size={26}/></span><h2 id="help-title">Вы — аким на пять решений</h2><p>У вас 100 условных единиц и пять районов с разными потребностями. Соберите план развития города на два года.</p><ol><li>Изучите показатели и выберите район.</li><li>Добавьте ровно 5 инициатив — до двух из одного направления.</li><li>Сохраните бюджет в пределах 100 единиц и учитывайте несовместимость мер.</li><li>Откройте предпросмотр своего сценария.</li></ol><div className="help-note">Сейчас доступен визуальный прототип на демонстрационных данных. Итоговый расчёт и AI-анализ будут подключены при интеграции с backend.</div><button className="primary-button" onClick={()=>setShowHelp(false)}>Перейти к городу <Icon name="arrow" size={17}/></button></section></div>}
  </div>;
}

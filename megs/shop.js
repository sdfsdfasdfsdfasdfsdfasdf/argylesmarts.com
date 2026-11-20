// MEGS shop layout: random packs first, then this week's items and stadiums, with bundles at the bottom.
// The pieces are the same ones the shop always had; this only puts them in a clearer order and tidies the cards.
(function(){
"use strict";
var MG = window.MG;
function waitUi(f){ if (MG.ui && MG.ui.VIEW && MG.ui.VIEW.shop && MG.bank) f(); else setTimeout(function(){ waitUi(f); }, 0); }
waitUi(function(){
  var U = MG.ui, VIEW = U.VIEW, ic = U.ic;
  var shop1 = VIEW.shop;
  VIEW.shop = function(){
    var t = document.createElement("template"); t.innerHTML = shop1.apply(this, arguments);
    var secs = [].slice.call(t.content.children);
    function h3(e){ var h = e.querySelector("h3"); return h ? h.textContent : ""; }
    function take(fn){ for (var i = 0; i < secs.length; i++) if (fn(secs[i])) return secs.splice(i, 1)[0]; return null; }
    var kinds = take(function(e){ return /What do you want/.test(h3(e)); }), daily = take(function(e){ return e.classList.contains("daily"); }),
      packs = take(function(e){ return e.classList.contains("packs"); }), cel = take(function(e){ return /Celestial items/.test(h3(e)); }),
      week = take(function(e){ return /This week/.test(h3(e)); }), stad = take(function(e){ return /Stadiums this week/.test(h3(e)); }),
      bund = take(function(e){ return /Bundles/.test(h3(e)); });
    // item cards: the long "You get..." line moves into the tooltip so the grid stays tidy
    [].forEach.call(t.content.querySelectorAll(".shopi .get, .pack .get"), function(g){ var p = g.parentNode; if (p.classList.contains("shopi")) p.title = g.textContent; g.remove(); });
    var out = '<div class="shopv">';
    if (daily) { daily.classList.add("shD"); daily.insertAdjacentHTML("afterbegin", '<div class="shDi">' + ic("gift") + '</div>'); out += daily.outerHTML; }
    if (packs) {
      var row = kinds && kinds.querySelector(".row"), note = kinds && kinds.querySelector("p.mute"), cn = cel && cel.querySelector("p.mute");
      out += '<section class="panel shP"><div class="shH"><h3>Random packs <small>one random item every pull</small></h3>' + (row ? '<div class="shK"><span>Pick what is inside</span>' + row.outerHTML + '</div>' : "") + '</div>' +
        packs.outerHTML + '<div class="shN">' + (note ? '<p class="mute">' + note.innerHTML + '</p>' : "") + (cn ? '<p class="mute">' + cn.innerHTML + '</p>' : "") + '</div></section>';
    }
    if (week) out += week.outerHTML;
    if (stad) out += stad.outerHTML;
    secs.forEach(function(e){ out += e.outerHTML; });
    if (bund) out += bund.outerHTML;
    return out + '</div>';
  };
  var st = document.createElement("style");
  st.textContent = [
    ".shopv{display:flex;flex-direction:column;gap:.8rem}.shopv>section{margin:0}",
    ".shD{display:flex;align-items:center;gap:1rem;background:linear-gradient(100deg,rgba(255,210,59,.18),rgba(20,22,58,.9) 55%);border-color:rgba(255,210,59,.45)}.shD>div:nth-child(2){flex:1}.shD h3{margin:0;color:#ffd23b}",
    ".shDi{width:52px;height:52px;flex:none;display:grid;place-items:center;border-radius:14px;background:linear-gradient(135deg,#ffe066,#ff9f1c);color:#2a1a00}.shDi .ic{width:30px;height:30px}",
    ".shH{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:.6rem;margin-bottom:.7rem}.shH h3{margin:0;font-size:1rem;color:#fff;letter-spacing:.08em}",
    ".shK{display:flex;align-items:center;gap:.5rem;flex-wrap:wrap}.shK>span{font-size:.75rem;color:#a9b0d6;text-transform:uppercase;letter-spacing:.08em}.shK .row{margin:0;gap:.3rem}.shK .chip{padding:.25rem .65rem;font-size:.8rem}",
    ".shP .cols.packs{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:.6rem;margin:0}",
    ".shP .pack{margin:0;display:flex;flex-direction:column;align-items:center;text-align:center;gap:.35rem;padding:.9rem .7rem;border-radius:18px;background:linear-gradient(180deg,rgba(255,255,255,.06),rgba(10,12,32,.85))}",
    ".shP .pack h2{margin:.1rem 0 0;font-size:1.15rem}.shP .pack>p{margin:0;font-size:.82rem;line-height:1.3}.shP .pack>p.mute{font-size:.72rem;opacity:.8;margin-top:auto}.shP .pack .odds{justify-content:center;margin:.2rem 0}",
    ".shP .pack .btn.big{width:100%;margin-top:.3rem}",
    ".shN{display:flex;flex-direction:column;gap:.2rem;margin-top:.6rem}.shN p{margin:0;font-size:.78rem}",
    ".shopv .shopi>.it,.shopv .shopi>button.it{width:100%;max-width:100%;min-width:0}@media(max-width:520px){.shopv .items.wk{grid-template-columns:repeat(2,minmax(0,1fr))!important}}",
    ".shopv .items.wk{display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:.6rem}.shopv .shopi{display:flex;flex-direction:column;align-items:center;gap:.25rem}.shopv .shopi .ty{margin-top:.1rem}"
  ].join("\n");
  document.head.appendChild(st);
});
})();

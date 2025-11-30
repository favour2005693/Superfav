/* --- Simple local 'backend' (localStorage) --- */
    const DB = {
      usersKey: 'ecom_users_v1',
      productsKey: 'ecom_products_v1',
      ordersKey: 'ecom_orders_v1',
      cartKey: 'ecom_cart_v1',
      currentUserKey: 'ecom_current_v1'
    };

    // bootstrap sample data
    function dbInit(){
      if(!localStorage.getItem(DB.usersKey)){
        const users = [
          {username:'admin',password:'admin123',role:'admin'},
          {username:'buyer',password:'buyer123',role:'customer'}
        ];
        localStorage.setItem(DB.usersKey, JSON.stringify(users));
      }
      if(!localStorage.getItem(DB.productsKey)){
        const sample = [
          {id:1,title:'Sleek Sneakers',price:50,desc:'Comfortable everyday sneakers',img:'https://picsum.photos/400?random=11'},
          {id:2,title:'Studio Headphones',price:80,desc:'Crisp audio for creators',img:'https://picsum.photos/400?random=12'},
          {id:3,title:'Smart Watch',price:120,desc:'Track health & notifications',img:'https://picsum.photos/400?random=13'}
        ];
        localStorage.setItem(DB.productsKey, JSON.stringify(sample));
      }
      if(!localStorage.getItem(DB.ordersKey)) localStorage.setItem(DB.ordersKey, JSON.stringify([]));
      if(!localStorage.getItem(DB.cartKey)) localStorage.setItem(DB.cartKey, JSON.stringify([]));
    }

    /* --- Auth --- */
    function signinUI(){
      renderContent(`
        <h3>Sign in / Sign up</h3>
        <div style="display:grid;gap:8px;max-width:420px">
          <input id="u_name" placeholder="username">
          <input id="u_pass" placeholder="password" type="password">
          <div style="display:flex;gap:8px">
            <button class="btn" onclick="signin()">Sign in</button>
            <button class="ghost" onclick="signup()">Create account</button>
          </div>
          <div class="small muted">Demo: admin/admin123 or buyer/buyer123</div>
        </div>
      `);
    }

    function signup(){
      const u=document.getElementById('u_name').value.trim();
      const p=document.getElementById('u_pass').value.trim();
      if(!u||!p){alert('enter credentials');return}
      const users=JSON.parse(localStorage.getItem(DB.usersKey)||'[]');
      if(users.find(x=>x.username===u)){alert('user exists');return}
      users.push({username:u,password:p,role:'customer'});
      localStorage.setItem(DB.usersKey,JSON.stringify(users));
      alert('created — you can sign in now');
    }

    function signin(){
      const u=document.getElementById('u_name').value.trim();
      const p=document.getElementById('u_pass').value.trim();
      const users=JSON.parse(localStorage.getItem(DB.usersKey)||'[]');
      const found=users.find(x=>x.username===u && x.password===p);
      if(!found){alert('invalid credentials');return}
      localStorage.setItem(DB.currentUserKey,JSON.stringify(found));
      updateUserBadge();
      showSection('shop');
    }

    function signout(){
      localStorage.removeItem(DB.currentUserKey);
      updateUserBadge();
      showSection('shop');
    }

    function currentUser(){
      return JSON.parse(localStorage.getItem(DB.currentUserKey)||'null');
    }

    function updateUserBadge(){
      const u=currentUser();
      const el=document.getElementById('userBadge');
      const btn=document.getElementById('signBtn');
      if(u){el.innerText = u.username + (u.role==='admin'?' • admin':''); btn.innerText='Sign out'; btn.onclick=()=>{signout()}}
      else{el.innerText='Not signed in'; btn.innerText='Sign in'; btn.onclick=signinUI}
    }

    /* --- Product rendering & cart --- */
    function getProducts(){return JSON.parse(localStorage.getItem(DB.productsKey)||'[]')}
    function saveProducts(p){localStorage.setItem(DB.productsKey,JSON.stringify(p))}

    function renderShop(){
      const products=getProducts();
      let html = `<h3>Shop</h3><div class="products-grid">`;
      products.forEach(prod=>{
        html += `
          <div class="product">
            <img src="${prod.img}" alt="${prod.title}">
            <div class="product-body">
              <div style="display:flex;justify-content:space-between;align-items:center">
                <strong>${prod.title}</strong>
                <div>$${prod.price}</div>
              </div>
              <div class="small">${prod.desc}</div>
              <div style="margin-top:8px;display:flex;gap:8px">
                <button class="btn" onclick="addToCart(${prod.id})">Add to cart</button>
                <button class="ghost" onclick="quickView(${prod.id})">View</button>
              </div>
            </div>
          </div>
        `;
      });
      html += `</div>`;
      renderContent(html);
    }

    function addToCart(id){
      const cart = JSON.parse(localStorage.getItem(DB.cartKey)||'[]');
      const prod = getProducts().find(p=>p.id===id);
      if(!prod) return;
      const existing = cart.find(c=>c.id===id);
      if(existing) existing.qty++;
      else cart.push({id:prod.id,title:prod.title,price:prod.price,qty:1});
      localStorage.setItem(DB.cartKey,JSON.stringify(cart));
      renderCart();
      showCart(true);
    }

    function renderCart(){
      const cart = JSON.parse(localStorage.getItem(DB.cartKey)||'[]');
      const list = document.getElementById('cartList');
      list.innerHTML = '';
      let total = 0;
      cart.forEach(i=>{
        const el = document.createElement('div'); el.className='cart-item';
        el.innerHTML = `<div>${i.title} x${i.qty}</div><div>$${i.price*i.qty}</div>`;
        list.appendChild(el);
        total += i.price*i.qty;
      });
      document.getElementById('cartTotal').innerText = '$'+total.toFixed(2);
      if(cart.length===0) list.innerHTML='<div class="small muted">Cart is empty</div>';
    }

    function showCart(show=true){
      const el=document.getElementById('cart'); el.style.display = show ? 'block' : 'none';
    }

    function checkout(){
      const user = currentUser();
      if(!user){if(!confirm('You are not signed in. Continue as guest?')) return}
      const cart = JSON.parse(localStorage.getItem(DB.cartKey)||'[]');
      if(cart.length===0){alert('cart empty');return}
      // fake payment flow
      const order = {id:Date.now(),user:user?user.username:'guest',items:cart,total:cart.reduce((s,i)=>s+i.price*i.qty,0),ts:new Date().toISOString()};
      const orders = JSON.parse(localStorage.getItem(DB.ordersKey)||'[]'); orders.unshift(order); localStorage.setItem(DB.ordersKey,JSON.stringify(orders));
      localStorage.setItem(DB.cartKey,JSON.stringify([])); renderCart(); showCart(false); alert('Payment simulated — order placed.');
      showSection('orders');
    }

    function quickView(id){
      const p=getProducts().find(x=>x.id===id);
      if(!p) return;
      renderContent(`
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
          <img src="${p.img}" style="width:100%;height:300px;object-fit:cover;border-radius:8px">
          <div>
            <h3>${p.title}</h3>
            <p class="small">${p.desc}</p>
            <div style="margin-top:12px">Price: <strong>$${p.price}</strong></div>
            <div style="margin-top:12px;display:flex;gap:8px"><button class="btn" onclick="addToCart(${p.id})">Add to cart</button></div>
          </div>
        </div>
      `);
    }

    /* --- Orders & Profile --- */
    function renderOrders(){
      const orders = JSON.parse(localStorage.getItem(DB.ordersKey)||'[]');
      const u=currentUser();
      let html = '<h3>Orders</h3>';
      const list = (u && u.role==='admin') ? orders : orders.filter(o=>u && o.user===u.username);
      if(list.length===0) html += '<div class="small muted">No orders yet</div>';
      list.forEach(o=>{
        html += `<div style="margin:8px 0;padding:8px;border-radius:8px;background:#f8fafc"><div><strong>Order ${o.id}</strong> • ${o.ts}</div><div class="small">User: ${o.user}</div><div style="margin-top:8px">${o.items.map(it=>`<div>${it.title} x${it.qty} — $${it.price*it.qty}</div>`).join('')}</div><div style="margin-top:8px"><strong>Total: $${o.total}</strong></div></div>`;
      });
      renderContent(html);
    }

    function renderProfile(){
      const u=currentUser();
      if(!u) return signinUI();
      renderContent(`<h3>Profile</h3><div><div><strong>${u.username}</strong> • ${u.role}</div><div style="margin-top:8px"><button class="ghost" onclick="signout()">Sign out</button></div></div>`);
    }

    /* --- Admin --- */
    function toggleAdmin(){
      const u=currentUser();
      if(!u || u.role!=='admin'){if(!confirm('Admin tools require admin account. Sign in as admin?')) return; signinUI(); return}
      renderAdmin();
    }

    function renderAdmin(){
      const products=getProducts();
      let html = `<h3>Admin • Manage Products</h3><div class="admin-tools">
        <div style="display:grid;gap:8px;grid-template-columns:1fr 80px"><input id="p_title" placeholder="title"><input id="p_price" placeholder="price" type="number"></div>
        <input id="p_img" placeholder="image url">
        <textarea id="p_desc" placeholder="short description"></textarea>
        <div style="display:flex;gap:8px"><button class="btn" onclick="adminAdd()">Add product</button><button class="ghost" onclick="showSection(\'shop\')">Back</button></div>
      </div><hr>`;
      products.forEach(p=>{
        html += `<div style="display:flex;justify-content:space-between;align-items:center;margin-top:8px;padding:8px;border-radius:8px;background:#fff"><div><strong>${p.title}</strong><div class="small">$${p.price}</div></div><div style="display:flex;gap:8px"><button class="ghost" onclick="adminEdit(${p.id})">Edit</button><button class="ghost" onclick="adminDelete(${p.id})">Delete</button></div></div>`;
      });
      renderContent(html);
    }

    function adminAdd(){
      const t=document.getElementById('p_title').value.trim();
      const pr=parseFloat(document.getElementById('p_price').value)||0;
      const img=document.getElementById('p_img').value.trim()||'https://picsum.photos/400?random='+Math.floor(Math.random()*100);
      const desc=document.getElementById('p_desc').value.trim();
      if(!t){alert('title?');return}
      const products=getProducts();
      const id = products.length?Math.max(...products.map(p=>p.id))+1:1;
      products.push({id,title:t,price:pr,desc,img});
      saveProducts(products); renderShop(); alert('added');
    }

    function adminDelete(id){
      if(!confirm('delete?')) return; const products = getProducts().filter(p=>p.id!==id); saveProducts(products); renderShop();
    }

    function adminEdit(id){
      const p=getProducts().find(x=>x.id===id);
      if(!p) return;
      renderContent(`<h3>Edit</h3><div style="display:grid;gap:8px"><input id="e_title" value="${p.title}"><input id="e_price" value="${p.price}" type="number"><input id="e_img" value="${p.img}"><textarea id="e_desc">${p.desc}</textarea><div style="display:flex;gap:8px"><button class="btn" onclick="adminSave(${p.id})">Save</button><button class="ghost" onclick="renderAdmin()">Cancel</button></div></div>`);
    }
    function adminSave(id){
      const products=getProducts(); const i=products.find(p=>p.id===id); if(!i) return; i.title=document.getElementById('e_title').value; i.price=parseFloat(document.getElementById('e_price').value)||0; i.img=document.getElementById('e_img').value; i.desc=document.getElementById('e_desc').value; saveProducts(products); renderAdmin(); alert('saved');
    }

    /* --- routing helpers --- */
    function renderContent(html){document.getElementById('contentArea').innerHTML = html}
    function showSection(name){ if(name==='shop') renderShop(); else if(name==='orders') renderOrders(); else if(name==='profile') renderProfile(); else if(name==='admin') renderAdmin(); }

    /* initial render */
    dbInit(); updateUserBadge(); renderShop(); renderCart(); showCart(false);

    /* expose small helpers to global for inline handlers */
    window.showSection = function(name){ if(name==='shop') renderShop(); else if(name==='orders') renderOrders(); else if(name==='profile') renderProfile(); else if(name==='admin') renderAdmin(); }
    window.signinUI = signinUI; window.addToCart = addToCart; window.quickView=quickView; window.toggleAdmin=toggleAdmin; window.checkout=checkout; window.adminAdd=adminAdd; window.adminDelete=adminDelete; window.adminEdit=adminEdit; window.adminSave=adminSave; window.signup=signup; window.signin=signin;

    /* small UX touches */
    document.addEventListener('DOMContentLoaded',()=>{
      const signBtn=document.getElementById('signBtn'); signBtn.addEventListener('keydown',e=>{if(e.key==='Enter') signinUI()});
    });

    // register a tiny service-worker using blob so PWA-like behavior works when served from file:// or simple hosting
    try{
      const swCode = `self.addEventListener('install',e=>self.skipWaiting());self.addEventListener('fetch',e=>{});`;
      const blob = new Blob([swCode],{type:'text/javascript'});
      const swUrl = URL.createObjectURL(blob);
      navigator.serviceWorker && navigator.serviceWorker.register(swUrl).catch(()=>{});
    }catch(e){}

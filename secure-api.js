// SecureApiService (browser port) for AcoomH business site
// Uses sessionStorage (not localStorage) to avoid persistent storage across tabs
(function(){
  const API_CONFIG = {
    BASE_URL: 'https://api.acoomh.ro',
    TIMEOUT: 30000
  };

  const memoryStore = {};
  const S = (function(){
    try { if (window.sessionStorage) return window.sessionStorage; } catch {}
    // Fallback in-memory store (lost on navigation)
    return {
      getItem: (k) => memoryStore[k] ?? null,
      setItem: (k, v) => { memoryStore[k] = String(v); },
      removeItem: (k) => { delete memoryStore[k]; },
      key: (i) => Object.keys(memoryStore)[i] ?? null,
      get length() { return Object.keys(memoryStore).length; }
    };
  })();

  // Persistent storage (localStorage) for keeping users logged-in between visits
  const P = (function(){
    try { if (window.localStorage) return window.localStorage; } catch {}
    // No persistent storage available; degrade to same in-memory store
    return {
      getItem: (k) => memoryStore[`p_${k}`] ?? null,
      setItem: (k, v) => { memoryStore[`p_${k}`] = String(v); },
      removeItem: (k) => { delete memoryStore[`p_${k}`]; },
      key: (i) => Object.keys(memoryStore)[i] ?? null,
      get length() { return Object.keys(memoryStore).length; }
    };
  })();

  const Storage = {
    get(key){ try { return S.getItem(key); } catch { return null; } },
    set(key,val){ try { S.setItem(key,val); } catch{} },
    remove(key){ try { S.removeItem(key); } catch{} },
    multiSet(pairs){ try { pairs.forEach(([k,v])=>S.setItem(k,v)); } catch{} },
    multiRemove(keys){ try { keys.forEach(k=>S.removeItem(k)); } catch{} },
    getAllKeys(){
      try {
        const keys = [];
        for (let i=0; i < S.length; i++) { const k = S.key(i); if (k) keys.push(k); }
        return keys;
      } catch { return []; }
    }
  };

  const Persist = {
    get(key){ try { return P.getItem(key); } catch { return null; } },
    set(key,val){ try { P.setItem(key,val); } catch{} },
    remove(key){ try { P.removeItem(key); } catch{} },
    multiSet(pairs){ try { pairs.forEach(([k,v])=>P.setItem(k,v)); } catch{} },
    multiRemove(keys){ try { keys.forEach(k=>P.removeItem(k)); } catch{} },
    getAllKeys(){
      try {
        const keys = [];
        for (let i=0; i < P.length; i++) { const k = P.key(i); if (k) keys.push(k); }
        return keys;
      } catch { return []; }
    }
  };

  function fetchWithTimeout(resource, options={}){
    const { timeout = API_CONFIG.TIMEOUT, ...rest } = options;
    const controller = new AbortController();
    const id = setTimeout(()=>controller.abort(), timeout);
    return fetch(resource, { ...rest, signal: controller.signal }).finally(()=>clearTimeout(id));
  }

  const SecureStorageService = {
    async storeTokens(accessToken, refreshToken){
      // Session-scoped
      Storage.multiSet([
        ['access_token', accessToken],
        ['refresh_token', refreshToken],
        ['token_stored_at', String(Date.now())]
      ]);
      // Persist across sessions
      Persist.multiSet([
        ['access_token', accessToken],
        ['refresh_token', refreshToken],
        ['token_stored_at', String(Date.now())]
      ]);
    },
    async getAccessToken(){ return Storage.get('access_token') || Persist.get('access_token'); },
    async getRefreshToken(){ return Storage.get('refresh_token') || Persist.get('refresh_token'); },
    async clearTokens(){
      Storage.multiRemove(['access_token','refresh_token','token_stored_at','company','user','loggedIn']);
      Persist.multiRemove(['access_token','refresh_token','token_stored_at','company','user','loggedIn']);
    },
    async areTokensExpired(){
      const ts = Storage.get('token_stored_at') || Persist.get('token_stored_at'); if(!ts) return true; return (Date.now()-parseInt(ts,10)) > 15*60*1000; },
    async rehydrateSessionFromPersist(){
      try{
        const a = Persist.get('access_token'); const r = Persist.get('refresh_token'); const t = Persist.get('token_stored_at');
        if(a && r){ Storage.multiSet([['access_token',a],['refresh_token',r]]); if(t) Storage.set('token_stored_at', t); }
        const c = Persist.get('company'); const u = Persist.get('user'); const li = Persist.get('loggedIn');
        if(c) Storage.set('company', c); if(u) Storage.set('user', u); if(li) Storage.set('loggedIn', li);
        return !!(a && r);
      }catch{ return false; }
    }
  };

  const SecureApiService = {
    accessToken: null,
    refreshToken: null,
    isRefreshing: false,
    refreshPromise: null,

    async initialize(){
      this.accessToken = await SecureStorageService.getAccessToken();
      this.refreshToken = await SecureStorageService.getRefreshToken();
      if(!this.accessToken || !this.refreshToken){
        const ok = await SecureStorageService.rehydrateSessionFromPersist();
        if(ok){
          this.accessToken = await SecureStorageService.getAccessToken();
          this.refreshToken = await SecureStorageService.getRefreshToken();
        }
      }
    },

    async makeSecureRequest(endpoint, options={}){
      let url = `${API_CONFIG.BASE_URL}${endpoint}`;
      if(!this.accessToken) await this.initialize();
      const hdrs = options.headers ? { ...options.headers } : {};
      if (!hdrs['Accept']) hdrs['Accept'] = 'application/json';
      let body = options.body;
      const isForm = (typeof FormData !== 'undefined') && (body instanceof FormData);
      if(body && !isForm && !hdrs['Content-Type']) hdrs['Content-Type']='application/json';
      if(body && hdrs['Content-Type']==='application/json' && typeof body!=='string'){ body = JSON.stringify(body); }
      if(this.accessToken) hdrs['Authorization'] = `Bearer ${this.accessToken}`;

      let response = await fetchWithTimeout(url, { ...options, headers: hdrs, body });
      if(response.status === 401 && this.refreshToken){
        const refreshed = await this.refreshAccessToken();
        if(refreshed){
          const access = await SecureStorageService.getAccessToken();
          if(access){ hdrs['Authorization'] = `Bearer ${access}`; response = await fetchWithTimeout(url, { ...options, headers: hdrs, body }); }
        }
      }
      const ok = response.ok;
      let data, error;
      try { const txt = await response.text(); if(txt) data = JSON.parse(txt); } catch(e){ error = `Failed to parse response: ${e}`; }
      if(!ok && !error){ error = `HTTP ${response.status}: ${response.statusText}`; }
      return { data, error, status: response.status, success: ok };
    },

    async refreshAccessToken(){
      if(this.isRefreshing && this.refreshPromise){ try{ await this.refreshPromise; return !!this.accessToken; } catch { return false; } }
      if(!this.refreshToken) return false;
      this.isRefreshing = true;
      this.refreshPromise = (async ()=>{
        try{
          const res = await fetchWithTimeout(`${API_CONFIG.BASE_URL}/auth/refresh`, { method:'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify({ refreshToken: this.refreshToken })});
          if(!res.ok) return null;
          const data = await res.json();
          this.accessToken = data.accessToken; this.refreshToken = data.refreshToken;
          await SecureStorageService.storeTokens(this.accessToken, this.refreshToken);
          return this.accessToken;
        }catch{ return null; }
      })();
      try { const r = await this.refreshPromise; return !!r; } finally { this.isRefreshing=false; this.refreshPromise=null; }
    },

    async login({ username, password }){
      const resp = await this.makeSecureRequest('/auth/company-login', { method:'POST', body:{ Email: username, Password: password } });
      if(resp.success && resp.data){
        const { accessToken, refreshToken } = resp.data;
        if(accessToken && refreshToken){ await SecureStorageService.storeTokens(accessToken, refreshToken); this.accessToken=accessToken; this.refreshToken=refreshToken; }
        // Store identity snapshot in session for navigation continuity
        const userData = resp.data.company ? { type:'Company', ...resp.data.company } : (resp.data.user ? { type:'User', ...resp.data.user } : null);
        if(userData){
          const key = userData.type==='Company'?'company':'user';
          const val = JSON.stringify(userData);
          Storage.set(key, val); Storage.set('loggedIn','true');
          Persist.set(key, val); Persist.set('loggedIn','true');
        }
      }
      return resp;
    },

    async register(payload){
      return this.makeSecureRequest('/auth/company-register', { method:'POST', body: payload });
    },

    async registerWithFile(formData){
      // Do not set Content-Type, let browser set boundary
      return this.makeSecureRequest('/auth/company-register', { method:'POST', body: formData });
    },

    async logout(){
      try { if(this.refreshToken){ await this.makeSecureRequest('/auth/logout', { method:'POST', body:{ refreshToken: this.refreshToken } }); } } catch{}
      this.accessToken=null; this.refreshToken=null; await SecureStorageService.clearTokens();
    },

    async isAuthenticated(){
      await this.initialize(); if(!this.accessToken || !this.refreshToken) return false;
      const expired = await SecureStorageService.areTokensExpired();
      if(expired){ const refreshed = await this.refreshAccessToken(); if(!refreshed) return false; this.accessToken = await SecureStorageService.getAccessToken(); this.refreshToken = await SecureStorageService.getRefreshToken(); }
      return !!this.accessToken;
    },

    get(endpoint){ return this.makeSecureRequest(endpoint, { method:'GET' }); },
    post(endpoint, data){ const opts = { method:'POST' }; if(data){ if(data instanceof FormData){ opts.body = data; } else { opts.body = data; opts.headers = { 'Content-Type':'application/json' }; } } return this.makeSecureRequest(endpoint, opts); },
    put(endpoint, data){ const opts = { method:'PUT' }; if(data){ if(data instanceof FormData){ opts.body = data; } else { opts.body = data; opts.headers = { 'Content-Type':'application/json' }; } } return this.makeSecureRequest(endpoint, opts); },
    delete(endpoint){ return this.makeSecureRequest(endpoint, { method:'DELETE' }); },
    getProfile(){ return this.get('/auth/company-me'); }
  };

  window.SecureApiService = SecureApiService;
})();

var b$ = Object.defineProperty;
var Qf = (e) => {
  throw TypeError(e);
};
var S$ = (e, t, r) => t in e ? b$(e, t, { enumerable: !0, configurable: !0, writable: !0, value: r }) : e[t] = r;
var Zn = (e, t, r) => S$(e, typeof t != "symbol" ? t + "" : t, r), Oc = (e, t, r) => t.has(e) || Qf("Cannot " + r);
var se = (e, t, r) => (Oc(e, t, "read from private field"), r ? r.call(e) : t.get(e)), or = (e, t, r) => t.has(e) ? Qf("Cannot add the same private member more than once") : t instanceof WeakSet ? t.add(e) : t.set(e, r), It = (e, t, r, n) => (Oc(e, t, "write to private field"), n ? n.call(e, r) : t.set(e, r), r), Sr = (e, t, r) => (Oc(e, t, "access private method"), r);
import Ir, { Notification as _a, app as Qr, BrowserWindow as ry, ipcMain as ze, safeStorage as ts, dialog as P$ } from "electron";
import { fileURLToPath as T$ } from "node:url";
import he from "node:path";
import * as Ue from "fs";
import mn from "fs";
import * as Ye from "path";
import Re from "path";
import Uo, { spawn as Zf } from "child_process";
import Oe from "node:process";
import { promisify as rt, isDeepStrictEqual as eh } from "node:util";
import ae from "node:fs";
import Sn from "node:crypto";
import th from "node:assert";
import ny from "node:os";
import "node:events";
import "node:stream";
import N$ from "constants";
import zs from "stream";
import ou from "util";
import iy from "assert";
import sy from "events";
import Ks from "crypto";
import ay from "tty";
import Mo from "os";
import yn from "url";
import oy from "zlib";
import O$ from "http";
class cy {
  static generateFiles(t, r) {
    try {
      const n = Ye.join(r.builderPath, "scripts");
      Ue.existsSync(n) || Ue.mkdirSync(n, { recursive: !0 });
      for (const o of t.depotProfiles) {
        const c = `"DepotBuild"
{
  "DepotID" "${o.DepotID}"
  "ContentRoot" "${o.ContentRoot.replace(/\\/g, "\\\\")}"
  "FileMapping"
  {
    "LocalPath" "*"
    "DepotPath" "."
    "recursive" "1"
  }
}
`, u = Ye.join(n, `depot_${o.DepotID}.vdf`);
        Ue.writeFileSync(u, c, "utf8");
      }
      const i = t.depotProfiles.map((o) => `"${o.DepotID}" "depot_${o.DepotID}.vdf"`).join(`
    `), s = `"AppBuild"
{
  "AppID" "${t.appID}"
  "Desc" "${t.description}"
  "BuildOutput" "${Ye.join(r.builderPath, "output").replace(/\\/g, "\\\\")}"
  "ContentRoot" "${Ye.join(r.builderPath, "content").replace(/\\/g, "\\\\")}"
  "Depots"
  {
    ${i}
  }
}
`, a = Ye.join(n, `app_${t.appID}.vdf`);
      return Ue.writeFileSync(a, s, "utf8"), a;
    } catch (n) {
      return console.error("VDF Generation Error:", n), null;
    }
  }
}
class di {
  static async runBuild(t, r, n, i) {
    if (this.process) {
      t.webContents.send("build-log", "⚠️ Build already in progress");
      return;
    }
    const s = await this.validateSetup(n);
    if (!s.valid) {
      t.webContents.send("build-log", `❌ Error: ${s.message}`);
      return;
    }
    const a = s.path;
    if (t.webContents.send("build-log", "🔄 Updating SteamCMD..."), !await this.updateSteamCmd(t, a)) {
      t.webContents.send("build-log", "❌ SteamCMD update failed. Aborting build.");
      return;
    }
    t.webContents.send("build-log", `✅ SteamCMD is up to date!
`), t.webContents.send("build-log", `🚀 Starting build for ${r.appName}...`), t.webContents.send("build-log", `   SteamCMD: ${a}`);
    const c = [
      "+login",
      n.loginName,
      i,
      "+run_app_build",
      Ye.join(n.builderPath, "scripts", `app_${r.appID}.vdf`),
      "+quit"
    ], u = {
      ...process.env,
      PYTHONUNBUFFERED: "1",
      TERM: "dumb",
      FORCE_COLOR: "0",
      NO_COLOR: "1"
    }, l = Ye.join(n.builderPath, "builder", "logs"), d = Ye.join(l, "console_log.txt");
    let h = 0;
    try {
      Ue.existsSync(d) && (h = Ue.statSync(d).size);
    } catch {
    }
    let p = null;
    const $ = (T, R) => {
      try {
        if (!Ue.existsSync(T))
          return { content: "", newPos: R };
        const F = Ue.statSync(T);
        if (F.size <= R)
          return { content: "", newPos: R };
        const H = Ue.openSync(T, "r"), G = Buffer.alloc(F.size - R);
        return Ue.readSync(H, G, 0, G.length, R), Ue.closeSync(H), { content: G.toString("utf8"), newPos: F.size };
      } catch {
        return { content: "", newPos: R };
      }
    };
    let _ = "", v = "";
    p = setInterval(() => {
      const T = $(d, h);
      if (T.content) {
        h = T.newPos;
        const R = T.content.split(`
`), F = [];
        for (const G of R) {
          const ie = G.trim();
          if (!ie || ie === "." || ie === ".." || ie === "...")
            continue;
          let C = ie.replace(/^\[[\d\-\s:]+\]\s*/, "");
          if (!C || C === "." || C === v)
            continue;
          v = C;
          const J = C.match(/(\d+\.?\d*\s*[KMGT]?B.*\(\d+%\))/);
          if (J) {
            const V = J[1];
            V !== _ && (_ = V, F.push(`   📥 ${V}`));
            continue;
          }
          if (/^\.+$/.test(C))
            continue;
          let j = C;
          if (/OK$/.test(j) || j.includes("...OK")) {
            if (j = `✅ ${j.replace(/\.\.\.OK$/, "").replace(/OK$/, "").trim()}`, j === "✅") continue;
          } else j.includes("Loading") || j.includes("Logging") ? j = `⏳ ${j}` : j.includes("Successfully finished") || j.includes("success") ? j = `🎉 ${j}` : j.includes("Uploading") ? j = `📤 ${j}` : j.includes("Building") || j.includes("Scanning") ? j = `🔨 ${j}` : j.includes("Waiting for confirmation") ? j = `⏳ ${j}` : j.includes("Steam Guard") || j.includes("mobile authenticator") || j.includes("confirm the login") ? j = `🔐 ${j}` : j.includes("Error") || j.includes("ERROR") || j.includes("Failed") ? j = `❌ ${j}` : j.includes("Unloading") && (j = `🔄 ${j}`);
          F.push(j);
        }
        F.length > 0 && t.webContents.send("build-log", F.join(`
`));
        const H = T.content.toLowerCase();
        !m && (H.includes("steam mobile app") || H.includes("confirm the login") || H.includes("mobile authenticator") || H.includes("waiting for confirmation")) && (m = !0, _a.isSupported() && new _a({
          title: "Steam Mobile Confirmation Required",
          body: "Please confirm the login in your Steam Mobile app.",
          icon: void 0
        }).show());
      }
    }, 200), this.process = Zf(a, c, {
      env: u,
      windowsHide: !0
    });
    let m = !1;
    const E = setTimeout(() => {
      !m && this.process && (m = !0, t.webContents.send("build-log", `
📱 If Steam requires authentication, please check your Steam Mobile app or email for a confirmation code.`), _a.isSupported() && new _a({
        title: "Steam Authentication",
        body: "Check your Steam Mobile app or email if login confirmation is required.",
        icon: void 0
      }).show());
    }, 5e3);
    this.process.on("close", (T) => {
      clearTimeout(E), p && clearInterval(p), this.process = null, t.webContents.send("build-complete", T), T === 0 ? t.webContents.send("build-log", "✅ Build Completed Successfully!") : t.webContents.send("build-log", `❌ Build failed with exit code ${T}`);
    });
  }
  static updateSteamCmd(t, r) {
    return new Promise((n) => {
      const i = Zf(r, ["+quit"]);
      let s = !1, a = !1;
      const o = setTimeout(() => {
        if (!a) {
          a = !0, t.webContents.send("build-log", "   ⚠️ SteamCMD update timed out (30s). Proceeding anyway...");
          try {
            i.kill();
          } catch {
          }
          n(!0);
        }
      }, 3e4);
      i.stdout.on("data", (c) => {
        const u = c.toString();
        (u.includes("Update") || u.includes("download") || u.includes("Steam") || u.includes("Loading") || u.includes("%")) && t.webContents.send("build-log", `   ${u.trim()}`);
      }), i.stderr.on("data", (c) => {
        t.webContents.send("build-log", `   ⚠️ ${c.toString().trim()}`), s = !0;
      }), i.on("close", (c) => {
        a || (a = !0, clearTimeout(o), c === 0 && !s ? n(!0) : c === 7 ? (t.webContents.send("build-log", "   SteamCMD updated itself (exit code 7)."), n(!0)) : n(c === 0));
      }), i.on("error", (c) => {
        a || (a = !0, clearTimeout(o), t.webContents.send("build-log", `   ❌ Failed to run SteamCMD: ${c.message}`), n(!1));
      });
    });
  }
  static stopBuild() {
    this.process && (this.process.kill(), this.process = null);
  }
  static writeInput(t) {
    this.process && this.process.stdin.write(t + `
`);
  }
  static async validateSetup(t) {
    const r = process.platform === "win32" ? "steamcmd.exe" : "steamcmd.sh";
    let n = Ye.join(t.builderPath, r);
    if (!Ue.existsSync(n)) {
      const a = [
        Ye.join(t.builderPath, "builder_osx", r),
        Ye.join(t.builderPath, "builder_linux", r),
        Ye.join(t.builderPath, "builder", r)
      ];
      for (const o of a)
        if (Ue.existsSync(o)) {
          n = o;
          break;
        }
    }
    if (!Ue.existsSync(n))
      return { valid: !1, message: `Could not find ${r} in ${t.builderPath} (or inside builder/ folders)` };
    const i = Ye.join(t.builderPath, "scripts"), s = Ye.join(t.builderPath, "content");
    return Ue.existsSync(i) ? Ue.existsSync(s) ? { valid: !0, message: "SteamCMD and folders found!", path: n } : { valid: !1, message: `Missing 'content' folder in ${t.builderPath}` } : { valid: !1, message: `Missing 'scripts' folder in ${t.builderPath}` };
  }
  static async testRun(t, r, n) {
    var s;
    const i = (a) => {
      try {
        t.webContents.send("build-log", a);
      } catch (o) {
        console.error("Failed to send build-log:", o);
      }
    };
    try {
      if (i(`🧪 Starting Local Test Build...
`), i("📋 Validating Profile Configuration:"), i(`   Profile Name: ${r.appName}`), i(`   App ID: ${r.appID ? `✅ ${r.appID}` : "❌ MISSING"}`), !r.appID) {
        i(`
❌ Error: App ID is required
`);
        return;
      }
      if (i(`   Description: ${r.description || "(none)"}`), i(`   Depots Count: ${((s = r == null ? void 0 : r.depotProfiles) == null ? void 0 : s.length) || 0}
`), !r.depotProfiles || r.depotProfiles.length === 0)
        i(`⚠️ Warning: No depots configured
`);
      else {
        i("📦 Validating Depots:");
        let c = !1;
        for (const [u, l] of r.depotProfiles.entries()) {
          i(`   Depot #${u + 1}:`), i(`      Name: ${l.DepotName || "⚠️ (unnamed)"}`), i(`      Depot ID: ${l.DepotID ? `✅ ${l.DepotID}` : "❌ MISSING"}`);
          const d = l.ContentRoot;
          if (i(`      Content Root: ${d || "❌ MISSING"}`), (!l.DepotID || !d) && (c = !0), d)
            try {
              Ue.existsSync(d) ? i("      Path Status: ✅ Exists") : (i("      Path Status: ❌ Path not found"), c = !0);
            } catch {
              i("      Path Status: ⚠️ Error checking path");
            }
          i("");
        }
        if (c) {
          i(`❌ Depot validation failed. Please fix the errors above.
`);
          return;
        }
      }
      i("⚙️ Validating Steam Configuration:");
      const a = await this.validateSetup(n);
      if (a.valid)
        i(`   SteamCMD: ✅ Found at ${a.path}`);
      else {
        i(`   SteamCMD: ❌ ${a.message}`), i(`
❌ Steam Configuration Invalid
`);
        return;
      }
      i(`   Username: ${n.loginName ? `✅ ${n.loginName}` : "❌ MISSING"}`), i(`   Password: ${n.password ? "✅ Set" : "❌ NOT SET (Required for Deploy)"}
`), i("📝 Generating VDF Files...");
      const o = await cy.generateFiles(r, n);
      if (o) {
        i("✅ VDF files generated successfully!"), i(`   Main VDF: ${o}`);
        const c = Ye.dirname(o);
        i(`   Files created in: ${c}`), i(`      • ${Ye.basename(o)}`);
        for (const u of r.depotProfiles)
          i(`      • depot_${u.DepotID}.vdf`);
        if (i(`
📄 Preview of ${Ye.basename(o)}:`), i("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"), Ue.existsSync(o)) {
          const u = Ue.readFileSync(o, "utf-8");
          i(u);
        } else
          i("(Could not read generated file)");
        i(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`), i("✅ Test Build Completed Successfully!"), i(`
💡 Everything looks good! You can now:`), i("   1. Review the generated VDF files above"), i("   2. Click 'Deploy to Steam' to upload your build"), i("   3. Make changes to your profile if needed");
      } else
        i("❌ Failed to generate VDF files");
    } catch (a) {
      console.error("Test Run Error:", a), i(`
❌ Critical Error: ${a.message}`);
    }
  }
}
Zn(di, "process", null);
const Bn = (e) => {
  const t = typeof e;
  return e !== null && (t === "object" || t === "function");
}, ly = /* @__PURE__ */ new Set([
  "__proto__",
  "prototype",
  "constructor"
]), uy = 1e6, A$ = (e) => e >= "0" && e <= "9";
function dy(e) {
  if (e === "0")
    return !0;
  if (/^[1-9]\d*$/.test(e)) {
    const t = Number.parseInt(e, 10);
    return t <= Number.MAX_SAFE_INTEGER && t <= uy;
  }
  return !1;
}
function Ac(e, t) {
  return ly.has(e) ? !1 : (e && dy(e) ? t.push(Number.parseInt(e, 10)) : t.push(e), !0);
}
function C$(e) {
  if (typeof e != "string")
    throw new TypeError(`Expected a string, got ${typeof e}`);
  const t = [];
  let r = "", n = "start", i = !1, s = 0;
  for (const a of e) {
    if (s++, i) {
      r += a, i = !1;
      continue;
    }
    if (a === "\\") {
      if (n === "index")
        throw new Error(`Invalid character '${a}' in an index at position ${s}`);
      if (n === "indexEnd")
        throw new Error(`Invalid character '${a}' after an index at position ${s}`);
      i = !0, n = n === "start" ? "property" : n;
      continue;
    }
    switch (a) {
      case ".": {
        if (n === "index")
          throw new Error(`Invalid character '${a}' in an index at position ${s}`);
        if (n === "indexEnd") {
          n = "property";
          break;
        }
        if (!Ac(r, t))
          return [];
        r = "", n = "property";
        break;
      }
      case "[": {
        if (n === "index")
          throw new Error(`Invalid character '${a}' in an index at position ${s}`);
        if (n === "indexEnd") {
          n = "index";
          break;
        }
        if (n === "property" || n === "start") {
          if ((r || n === "property") && !Ac(r, t))
            return [];
          r = "";
        }
        n = "index";
        break;
      }
      case "]": {
        if (n === "index") {
          if (r === "")
            r = (t.pop() || "") + "[]", n = "property";
          else {
            const o = Number.parseInt(r, 10);
            !Number.isNaN(o) && Number.isFinite(o) && o >= 0 && o <= Number.MAX_SAFE_INTEGER && o <= uy && r === String(o) ? t.push(o) : t.push(r), r = "", n = "indexEnd";
          }
          break;
        }
        if (n === "indexEnd")
          throw new Error(`Invalid character '${a}' after an index at position ${s}`);
        r += a;
        break;
      }
      default: {
        if (n === "index" && !A$(a))
          throw new Error(`Invalid character '${a}' in an index at position ${s}`);
        if (n === "indexEnd")
          throw new Error(`Invalid character '${a}' after an index at position ${s}`);
        n === "start" && (n = "property"), r += a;
      }
    }
  }
  switch (i && (r += "\\"), n) {
    case "property": {
      if (!Ac(r, t))
        return [];
      break;
    }
    case "index":
      throw new Error("Index was not closed");
    case "start": {
      t.push("");
      break;
    }
  }
  return t;
}
function xo(e) {
  if (typeof e == "string")
    return C$(e);
  if (Array.isArray(e)) {
    const t = [];
    for (const [r, n] of e.entries()) {
      if (typeof n != "string" && typeof n != "number")
        throw new TypeError(`Expected a string or number for path segment at index ${r}, got ${typeof n}`);
      if (typeof n == "number" && !Number.isFinite(n))
        throw new TypeError(`Path segment at index ${r} must be a finite number, got ${n}`);
      if (ly.has(n))
        return [];
      typeof n == "string" && dy(n) ? t.push(Number.parseInt(n, 10)) : t.push(n);
    }
    return t;
  }
  return [];
}
function rh(e, t, r) {
  if (!Bn(e) || typeof t != "string" && !Array.isArray(t))
    return r === void 0 ? e : r;
  const n = xo(t);
  if (n.length === 0)
    return r;
  for (let i = 0; i < n.length; i++) {
    const s = n[i];
    if (e = e[s], e == null) {
      if (i !== n.length - 1)
        return r;
      break;
    }
  }
  return e === void 0 ? r : e;
}
function va(e, t, r) {
  if (!Bn(e) || typeof t != "string" && !Array.isArray(t))
    return e;
  const n = e, i = xo(t);
  if (i.length === 0)
    return e;
  for (let s = 0; s < i.length; s++) {
    const a = i[s];
    if (s === i.length - 1)
      e[a] = r;
    else if (!Bn(e[a])) {
      const c = typeof i[s + 1] == "number";
      e[a] = c ? [] : {};
    }
    e = e[a];
  }
  return n;
}
function R$(e, t) {
  if (!Bn(e) || typeof t != "string" && !Array.isArray(t))
    return !1;
  const r = xo(t);
  if (r.length === 0)
    return !1;
  for (let n = 0; n < r.length; n++) {
    const i = r[n];
    if (n === r.length - 1)
      return Object.hasOwn(e, i) ? (delete e[i], !0) : !1;
    if (e = e[i], !Bn(e))
      return !1;
  }
}
function Cc(e, t) {
  if (!Bn(e) || typeof t != "string" && !Array.isArray(t))
    return !1;
  const r = xo(t);
  if (r.length === 0)
    return !1;
  for (const n of r) {
    if (!Bn(e) || !(n in e))
      return !1;
    e = e[n];
  }
  return !0;
}
const Zr = ny.homedir(), cu = ny.tmpdir(), { env: mi } = Oe, I$ = (e) => {
  const t = he.join(Zr, "Library");
  return {
    data: he.join(t, "Application Support", e),
    config: he.join(t, "Preferences", e),
    cache: he.join(t, "Caches", e),
    log: he.join(t, "Logs", e),
    temp: he.join(cu, e)
  };
}, D$ = (e) => {
  const t = mi.APPDATA || he.join(Zr, "AppData", "Roaming"), r = mi.LOCALAPPDATA || he.join(Zr, "AppData", "Local");
  return {
    // Data/config/cache/log are invented by me as Windows isn't opinionated about this
    data: he.join(r, e, "Data"),
    config: he.join(t, e, "Config"),
    cache: he.join(r, e, "Cache"),
    log: he.join(r, e, "Log"),
    temp: he.join(cu, e)
  };
}, k$ = (e) => {
  const t = he.basename(Zr);
  return {
    data: he.join(mi.XDG_DATA_HOME || he.join(Zr, ".local", "share"), e),
    config: he.join(mi.XDG_CONFIG_HOME || he.join(Zr, ".config"), e),
    cache: he.join(mi.XDG_CACHE_HOME || he.join(Zr, ".cache"), e),
    // https://wiki.debian.org/XDGBaseDirectorySpecification#state
    log: he.join(mi.XDG_STATE_HOME || he.join(Zr, ".local", "state"), e),
    temp: he.join(cu, t, e)
  };
};
function F$(e, { suffix: t = "nodejs" } = {}) {
  if (typeof e != "string")
    throw new TypeError(`Expected a string, got ${typeof e}`);
  return t && (e += `-${t}`), Oe.platform === "darwin" ? I$(e) : Oe.platform === "win32" ? D$(e) : k$(e);
}
const xr = (e, t) => {
  const { onError: r } = t;
  return function(...i) {
    return e.apply(void 0, i).catch(r);
  };
}, Pr = (e, t) => {
  const { onError: r } = t;
  return function(...i) {
    try {
      return e.apply(void 0, i);
    } catch (s) {
      return r(s);
    }
  };
}, j$ = 250, Vr = (e, t) => {
  const { isRetriable: r } = t;
  return function(i) {
    const { timeout: s } = i, a = i.interval ?? j$, o = Date.now() + s;
    return function c(...u) {
      return e.apply(void 0, u).catch((l) => {
        if (!r(l) || Date.now() >= o)
          throw l;
        const d = Math.round(a * Math.random());
        return d > 0 ? new Promise((p) => setTimeout(p, d)).then(() => c.apply(void 0, u)) : c.apply(void 0, u);
      });
    };
  };
}, qr = (e, t) => {
  const { isRetriable: r } = t;
  return function(i) {
    const { timeout: s } = i, a = Date.now() + s;
    return function(...c) {
      for (; ; )
        try {
          return e.apply(void 0, c);
        } catch (u) {
          if (!r(u) || Date.now() >= a)
            throw u;
          continue;
        }
    };
  };
}, yi = {
  /* API */
  isChangeErrorOk: (e) => {
    if (!yi.isNodeError(e))
      return !1;
    const { code: t } = e;
    return t === "ENOSYS" || !L$ && (t === "EINVAL" || t === "EPERM");
  },
  isNodeError: (e) => e instanceof Error,
  isRetriableError: (e) => {
    if (!yi.isNodeError(e))
      return !1;
    const { code: t } = e;
    return t === "EMFILE" || t === "ENFILE" || t === "EAGAIN" || t === "EBUSY" || t === "EACCESS" || t === "EACCES" || t === "EACCS" || t === "EPERM";
  },
  onChangeError: (e) => {
    if (!yi.isNodeError(e))
      throw e;
    if (!yi.isChangeErrorOk(e))
      throw e;
  }
}, $a = {
  onError: yi.onChangeError
}, Dt = {
  onError: () => {
  }
}, L$ = Oe.getuid ? !Oe.getuid() : !1, nt = {
  isRetriable: yi.isRetriableError
}, at = {
  attempt: {
    /* ASYNC */
    chmod: xr(rt(ae.chmod), $a),
    chown: xr(rt(ae.chown), $a),
    close: xr(rt(ae.close), Dt),
    fsync: xr(rt(ae.fsync), Dt),
    mkdir: xr(rt(ae.mkdir), Dt),
    realpath: xr(rt(ae.realpath), Dt),
    stat: xr(rt(ae.stat), Dt),
    unlink: xr(rt(ae.unlink), Dt),
    /* SYNC */
    chmodSync: Pr(ae.chmodSync, $a),
    chownSync: Pr(ae.chownSync, $a),
    closeSync: Pr(ae.closeSync, Dt),
    existsSync: Pr(ae.existsSync, Dt),
    fsyncSync: Pr(ae.fsync, Dt),
    mkdirSync: Pr(ae.mkdirSync, Dt),
    realpathSync: Pr(ae.realpathSync, Dt),
    statSync: Pr(ae.statSync, Dt),
    unlinkSync: Pr(ae.unlinkSync, Dt)
  },
  retry: {
    /* ASYNC */
    close: Vr(rt(ae.close), nt),
    fsync: Vr(rt(ae.fsync), nt),
    open: Vr(rt(ae.open), nt),
    readFile: Vr(rt(ae.readFile), nt),
    rename: Vr(rt(ae.rename), nt),
    stat: Vr(rt(ae.stat), nt),
    write: Vr(rt(ae.write), nt),
    writeFile: Vr(rt(ae.writeFile), nt),
    /* SYNC */
    closeSync: qr(ae.closeSync, nt),
    fsyncSync: qr(ae.fsyncSync, nt),
    openSync: qr(ae.openSync, nt),
    readFileSync: qr(ae.readFileSync, nt),
    renameSync: qr(ae.renameSync, nt),
    statSync: qr(ae.statSync, nt),
    writeSync: qr(ae.writeSync, nt),
    writeFileSync: qr(ae.writeFileSync, nt)
  }
}, U$ = "utf8", nh = 438, M$ = 511, x$ = {}, V$ = Oe.geteuid ? Oe.geteuid() : -1, q$ = Oe.getegid ? Oe.getegid() : -1, B$ = 1e3, H$ = !!Oe.getuid;
Oe.getuid && Oe.getuid();
const ih = 128, G$ = (e) => e instanceof Error && "code" in e, sh = (e) => typeof e == "string", Rc = (e) => e === void 0, z$ = Oe.platform === "linux", fy = Oe.platform === "win32", lu = ["SIGHUP", "SIGINT", "SIGTERM"];
fy || lu.push("SIGALRM", "SIGABRT", "SIGVTALRM", "SIGXCPU", "SIGXFSZ", "SIGUSR2", "SIGTRAP", "SIGSYS", "SIGQUIT", "SIGIOT");
z$ && lu.push("SIGIO", "SIGPOLL", "SIGPWR", "SIGSTKFLT");
class K$ {
  /* CONSTRUCTOR */
  constructor() {
    this.callbacks = /* @__PURE__ */ new Set(), this.exited = !1, this.exit = (t) => {
      if (!this.exited) {
        this.exited = !0;
        for (const r of this.callbacks)
          r();
        t && (fy && t !== "SIGINT" && t !== "SIGTERM" && t !== "SIGKILL" ? Oe.kill(Oe.pid, "SIGTERM") : Oe.kill(Oe.pid, t));
      }
    }, this.hook = () => {
      Oe.once("exit", () => this.exit());
      for (const t of lu)
        try {
          Oe.once(t, () => this.exit(t));
        } catch {
        }
    }, this.register = (t) => (this.callbacks.add(t), () => {
      this.callbacks.delete(t);
    }), this.hook();
  }
}
const W$ = new K$(), Y$ = W$.register, ot = {
  /* VARIABLES */
  store: {},
  // filePath => purge
  /* API */
  create: (e) => {
    const t = `000000${Math.floor(Math.random() * 16777215).toString(16)}`.slice(-6), i = `.tmp-${Date.now().toString().slice(-10)}${t}`;
    return `${e}${i}`;
  },
  get: (e, t, r = !0) => {
    const n = ot.truncate(t(e));
    return n in ot.store ? ot.get(e, t, r) : (ot.store[n] = r, [n, () => delete ot.store[n]]);
  },
  purge: (e) => {
    ot.store[e] && (delete ot.store[e], at.attempt.unlink(e));
  },
  purgeSync: (e) => {
    ot.store[e] && (delete ot.store[e], at.attempt.unlinkSync(e));
  },
  purgeSyncAll: () => {
    for (const e in ot.store)
      ot.purgeSync(e);
  },
  truncate: (e) => {
    const t = he.basename(e);
    if (t.length <= ih)
      return e;
    const r = /^(\.?)(.*?)((?:\.[^.]+)?(?:\.tmp-\d{10}[a-f0-9]{6})?)$/.exec(t);
    if (!r)
      return e;
    const n = t.length - ih;
    return `${e.slice(0, -t.length)}${r[1]}${r[2].slice(0, -n)}${r[3]}`;
  }
};
Y$(ot.purgeSyncAll);
function hy(e, t, r = x$) {
  if (sh(r))
    return hy(e, t, { encoding: r });
  const i = { timeout: r.timeout ?? B$ };
  let s = null, a = null, o = null;
  try {
    const c = at.attempt.realpathSync(e), u = !!c;
    e = c || e, [a, s] = ot.get(e, r.tmpCreate || ot.create, r.tmpPurge !== !1);
    const l = H$ && Rc(r.chown), d = Rc(r.mode);
    if (u && (l || d)) {
      const h = at.attempt.statSync(e);
      h && (r = { ...r }, l && (r.chown = { uid: h.uid, gid: h.gid }), d && (r.mode = h.mode));
    }
    if (!u) {
      const h = he.dirname(e);
      at.attempt.mkdirSync(h, {
        mode: M$,
        recursive: !0
      });
    }
    o = at.retry.openSync(i)(a, "w", r.mode || nh), r.tmpCreated && r.tmpCreated(a), sh(t) ? at.retry.writeSync(i)(o, t, 0, r.encoding || U$) : Rc(t) || at.retry.writeSync(i)(o, t, 0, t.length, 0), r.fsync !== !1 && (r.fsyncWait !== !1 ? at.retry.fsyncSync(i)(o) : at.attempt.fsync(o)), at.retry.closeSync(i)(o), o = null, r.chown && (r.chown.uid !== V$ || r.chown.gid !== q$) && at.attempt.chownSync(a, r.chown.uid, r.chown.gid), r.mode && r.mode !== nh && at.attempt.chmodSync(a, r.mode);
    try {
      at.retry.renameSync(i)(a, e);
    } catch (h) {
      if (!G$(h) || h.code !== "ENAMETOOLONG")
        throw h;
      at.retry.renameSync(i)(a, ot.truncate(e));
    }
    s(), a = null;
  } finally {
    o && at.attempt.closeSync(o), a && ot.purge(a);
  }
}
var mt = typeof globalThis < "u" ? globalThis : typeof window < "u" ? window : typeof global < "u" ? global : typeof self < "u" ? self : {};
function py(e) {
  return e && e.__esModule && Object.prototype.hasOwnProperty.call(e, "default") ? e.default : e;
}
var Nl = { exports: {} }, my = {}, tr = {}, Ci = {}, Ws = {}, oe = {}, As = {};
(function(e) {
  Object.defineProperty(e, "__esModule", { value: !0 }), e.regexpCode = e.getEsmExportName = e.getProperty = e.safeStringify = e.stringify = e.strConcat = e.addCodeArg = e.str = e._ = e.nil = e._Code = e.Name = e.IDENTIFIER = e._CodeOrName = void 0;
  class t {
  }
  e._CodeOrName = t, e.IDENTIFIER = /^[a-z$_][a-z$_0-9]*$/i;
  class r extends t {
    constructor(E) {
      if (super(), !e.IDENTIFIER.test(E))
        throw new Error("CodeGen: name must be a valid identifier");
      this.str = E;
    }
    toString() {
      return this.str;
    }
    emptyStr() {
      return !1;
    }
    get names() {
      return { [this.str]: 1 };
    }
  }
  e.Name = r;
  class n extends t {
    constructor(E) {
      super(), this._items = typeof E == "string" ? [E] : E;
    }
    toString() {
      return this.str;
    }
    emptyStr() {
      if (this._items.length > 1)
        return !1;
      const E = this._items[0];
      return E === "" || E === '""';
    }
    get str() {
      var E;
      return (E = this._str) !== null && E !== void 0 ? E : this._str = this._items.reduce((T, R) => `${T}${R}`, "");
    }
    get names() {
      var E;
      return (E = this._names) !== null && E !== void 0 ? E : this._names = this._items.reduce((T, R) => (R instanceof r && (T[R.str] = (T[R.str] || 0) + 1), T), {});
    }
  }
  e._Code = n, e.nil = new n("");
  function i(m, ...E) {
    const T = [m[0]];
    let R = 0;
    for (; R < E.length; )
      o(T, E[R]), T.push(m[++R]);
    return new n(T);
  }
  e._ = i;
  const s = new n("+");
  function a(m, ...E) {
    const T = [p(m[0])];
    let R = 0;
    for (; R < E.length; )
      T.push(s), o(T, E[R]), T.push(s, p(m[++R]));
    return c(T), new n(T);
  }
  e.str = a;
  function o(m, E) {
    E instanceof n ? m.push(...E._items) : E instanceof r ? m.push(E) : m.push(d(E));
  }
  e.addCodeArg = o;
  function c(m) {
    let E = 1;
    for (; E < m.length - 1; ) {
      if (m[E] === s) {
        const T = u(m[E - 1], m[E + 1]);
        if (T !== void 0) {
          m.splice(E - 1, 3, T);
          continue;
        }
        m[E++] = "+";
      }
      E++;
    }
  }
  function u(m, E) {
    if (E === '""')
      return m;
    if (m === '""')
      return E;
    if (typeof m == "string")
      return E instanceof r || m[m.length - 1] !== '"' ? void 0 : typeof E != "string" ? `${m.slice(0, -1)}${E}"` : E[0] === '"' ? m.slice(0, -1) + E.slice(1) : void 0;
    if (typeof E == "string" && E[0] === '"' && !(m instanceof r))
      return `"${m}${E.slice(1)}`;
  }
  function l(m, E) {
    return E.emptyStr() ? m : m.emptyStr() ? E : a`${m}${E}`;
  }
  e.strConcat = l;
  function d(m) {
    return typeof m == "number" || typeof m == "boolean" || m === null ? m : p(Array.isArray(m) ? m.join(",") : m);
  }
  function h(m) {
    return new n(p(m));
  }
  e.stringify = h;
  function p(m) {
    return JSON.stringify(m).replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");
  }
  e.safeStringify = p;
  function $(m) {
    return typeof m == "string" && e.IDENTIFIER.test(m) ? new n(`.${m}`) : i`[${m}]`;
  }
  e.getProperty = $;
  function _(m) {
    if (typeof m == "string" && e.IDENTIFIER.test(m))
      return new n(`${m}`);
    throw new Error(`CodeGen: invalid export name: ${m}, use explicit $id name mapping`);
  }
  e.getEsmExportName = _;
  function v(m) {
    return new n(m.toString());
  }
  e.regexpCode = v;
})(As);
var Ol = {};
(function(e) {
  Object.defineProperty(e, "__esModule", { value: !0 }), e.ValueScope = e.ValueScopeName = e.Scope = e.varKinds = e.UsedValueState = void 0;
  const t = As;
  class r extends Error {
    constructor(u) {
      super(`CodeGen: "code" for ${u} not defined`), this.value = u.value;
    }
  }
  var n;
  (function(c) {
    c[c.Started = 0] = "Started", c[c.Completed = 1] = "Completed";
  })(n || (e.UsedValueState = n = {})), e.varKinds = {
    const: new t.Name("const"),
    let: new t.Name("let"),
    var: new t.Name("var")
  };
  class i {
    constructor({ prefixes: u, parent: l } = {}) {
      this._names = {}, this._prefixes = u, this._parent = l;
    }
    toName(u) {
      return u instanceof t.Name ? u : this.name(u);
    }
    name(u) {
      return new t.Name(this._newName(u));
    }
    _newName(u) {
      const l = this._names[u] || this._nameGroup(u);
      return `${u}${l.index++}`;
    }
    _nameGroup(u) {
      var l, d;
      if (!((d = (l = this._parent) === null || l === void 0 ? void 0 : l._prefixes) === null || d === void 0) && d.has(u) || this._prefixes && !this._prefixes.has(u))
        throw new Error(`CodeGen: prefix "${u}" is not allowed in this scope`);
      return this._names[u] = { prefix: u, index: 0 };
    }
  }
  e.Scope = i;
  class s extends t.Name {
    constructor(u, l) {
      super(l), this.prefix = u;
    }
    setValue(u, { property: l, itemIndex: d }) {
      this.value = u, this.scopePath = (0, t._)`.${new t.Name(l)}[${d}]`;
    }
  }
  e.ValueScopeName = s;
  const a = (0, t._)`\n`;
  class o extends i {
    constructor(u) {
      super(u), this._values = {}, this._scope = u.scope, this.opts = { ...u, _n: u.lines ? a : t.nil };
    }
    get() {
      return this._scope;
    }
    name(u) {
      return new s(u, this._newName(u));
    }
    value(u, l) {
      var d;
      if (l.ref === void 0)
        throw new Error("CodeGen: ref must be passed in value");
      const h = this.toName(u), { prefix: p } = h, $ = (d = l.key) !== null && d !== void 0 ? d : l.ref;
      let _ = this._values[p];
      if (_) {
        const E = _.get($);
        if (E)
          return E;
      } else
        _ = this._values[p] = /* @__PURE__ */ new Map();
      _.set($, h);
      const v = this._scope[p] || (this._scope[p] = []), m = v.length;
      return v[m] = l.ref, h.setValue(l, { property: p, itemIndex: m }), h;
    }
    getValue(u, l) {
      const d = this._values[u];
      if (d)
        return d.get(l);
    }
    scopeRefs(u, l = this._values) {
      return this._reduceValues(l, (d) => {
        if (d.scopePath === void 0)
          throw new Error(`CodeGen: name "${d}" has no value`);
        return (0, t._)`${u}${d.scopePath}`;
      });
    }
    scopeCode(u = this._values, l, d) {
      return this._reduceValues(u, (h) => {
        if (h.value === void 0)
          throw new Error(`CodeGen: name "${h}" has no value`);
        return h.value.code;
      }, l, d);
    }
    _reduceValues(u, l, d = {}, h) {
      let p = t.nil;
      for (const $ in u) {
        const _ = u[$];
        if (!_)
          continue;
        const v = d[$] = d[$] || /* @__PURE__ */ new Map();
        _.forEach((m) => {
          if (v.has(m))
            return;
          v.set(m, n.Started);
          let E = l(m);
          if (E) {
            const T = this.opts.es5 ? e.varKinds.var : e.varKinds.const;
            p = (0, t._)`${p}${T} ${m} = ${E};${this.opts._n}`;
          } else if (E = h == null ? void 0 : h(m))
            p = (0, t._)`${p}${E}${this.opts._n}`;
          else
            throw new r(m);
          v.set(m, n.Completed);
        });
      }
      return p;
    }
  }
  e.ValueScope = o;
})(Ol);
(function(e) {
  Object.defineProperty(e, "__esModule", { value: !0 }), e.or = e.and = e.not = e.CodeGen = e.operators = e.varKinds = e.ValueScopeName = e.ValueScope = e.Scope = e.Name = e.regexpCode = e.stringify = e.getProperty = e.nil = e.strConcat = e.str = e._ = void 0;
  const t = As, r = Ol;
  var n = As;
  Object.defineProperty(e, "_", { enumerable: !0, get: function() {
    return n._;
  } }), Object.defineProperty(e, "str", { enumerable: !0, get: function() {
    return n.str;
  } }), Object.defineProperty(e, "strConcat", { enumerable: !0, get: function() {
    return n.strConcat;
  } }), Object.defineProperty(e, "nil", { enumerable: !0, get: function() {
    return n.nil;
  } }), Object.defineProperty(e, "getProperty", { enumerable: !0, get: function() {
    return n.getProperty;
  } }), Object.defineProperty(e, "stringify", { enumerable: !0, get: function() {
    return n.stringify;
  } }), Object.defineProperty(e, "regexpCode", { enumerable: !0, get: function() {
    return n.regexpCode;
  } }), Object.defineProperty(e, "Name", { enumerable: !0, get: function() {
    return n.Name;
  } });
  var i = Ol;
  Object.defineProperty(e, "Scope", { enumerable: !0, get: function() {
    return i.Scope;
  } }), Object.defineProperty(e, "ValueScope", { enumerable: !0, get: function() {
    return i.ValueScope;
  } }), Object.defineProperty(e, "ValueScopeName", { enumerable: !0, get: function() {
    return i.ValueScopeName;
  } }), Object.defineProperty(e, "varKinds", { enumerable: !0, get: function() {
    return i.varKinds;
  } }), e.operators = {
    GT: new t._Code(">"),
    GTE: new t._Code(">="),
    LT: new t._Code("<"),
    LTE: new t._Code("<="),
    EQ: new t._Code("==="),
    NEQ: new t._Code("!=="),
    NOT: new t._Code("!"),
    OR: new t._Code("||"),
    AND: new t._Code("&&"),
    ADD: new t._Code("+")
  };
  class s {
    optimizeNodes() {
      return this;
    }
    optimizeNames(f, g) {
      return this;
    }
  }
  class a extends s {
    constructor(f, g, N) {
      super(), this.varKind = f, this.name = g, this.rhs = N;
    }
    render({ es5: f, _n: g }) {
      const N = f ? r.varKinds.var : this.varKind, w = this.rhs === void 0 ? "" : ` = ${this.rhs}`;
      return `${N} ${this.name}${w};` + g;
    }
    optimizeNames(f, g) {
      if (f[this.name.str])
        return this.rhs && (this.rhs = L(this.rhs, f, g)), this;
    }
    get names() {
      return this.rhs instanceof t._CodeOrName ? this.rhs.names : {};
    }
  }
  class o extends s {
    constructor(f, g, N) {
      super(), this.lhs = f, this.rhs = g, this.sideEffects = N;
    }
    render({ _n: f }) {
      return `${this.lhs} = ${this.rhs};` + f;
    }
    optimizeNames(f, g) {
      if (!(this.lhs instanceof t.Name && !f[this.lhs.str] && !this.sideEffects))
        return this.rhs = L(this.rhs, f, g), this;
    }
    get names() {
      const f = this.lhs instanceof t.Name ? {} : { ...this.lhs.names };
      return Q(f, this.rhs);
    }
  }
  class c extends o {
    constructor(f, g, N, w) {
      super(f, N, w), this.op = g;
    }
    render({ _n: f }) {
      return `${this.lhs} ${this.op}= ${this.rhs};` + f;
    }
  }
  class u extends s {
    constructor(f) {
      super(), this.label = f, this.names = {};
    }
    render({ _n: f }) {
      return `${this.label}:` + f;
    }
  }
  class l extends s {
    constructor(f) {
      super(), this.label = f, this.names = {};
    }
    render({ _n: f }) {
      return `break${this.label ? ` ${this.label}` : ""};` + f;
    }
  }
  class d extends s {
    constructor(f) {
      super(), this.error = f;
    }
    render({ _n: f }) {
      return `throw ${this.error};` + f;
    }
    get names() {
      return this.error.names;
    }
  }
  class h extends s {
    constructor(f) {
      super(), this.code = f;
    }
    render({ _n: f }) {
      return `${this.code};` + f;
    }
    optimizeNodes() {
      return `${this.code}` ? this : void 0;
    }
    optimizeNames(f, g) {
      return this.code = L(this.code, f, g), this;
    }
    get names() {
      return this.code instanceof t._CodeOrName ? this.code.names : {};
    }
  }
  class p extends s {
    constructor(f = []) {
      super(), this.nodes = f;
    }
    render(f) {
      return this.nodes.reduce((g, N) => g + N.render(f), "");
    }
    optimizeNodes() {
      const { nodes: f } = this;
      let g = f.length;
      for (; g--; ) {
        const N = f[g].optimizeNodes();
        Array.isArray(N) ? f.splice(g, 1, ...N) : N ? f[g] = N : f.splice(g, 1);
      }
      return f.length > 0 ? this : void 0;
    }
    optimizeNames(f, g) {
      const { nodes: N } = this;
      let w = N.length;
      for (; w--; ) {
        const y = N[w];
        y.optimizeNames(f, g) || (U(f, y.names), N.splice(w, 1));
      }
      return N.length > 0 ? this : void 0;
    }
    get names() {
      return this.nodes.reduce((f, g) => V(f, g.names), {});
    }
  }
  class $ extends p {
    render(f) {
      return "{" + f._n + super.render(f) + "}" + f._n;
    }
  }
  class _ extends p {
  }
  class v extends $ {
  }
  v.kind = "else";
  class m extends $ {
    constructor(f, g) {
      super(g), this.condition = f;
    }
    render(f) {
      let g = `if(${this.condition})` + super.render(f);
      return this.else && (g += "else " + this.else.render(f)), g;
    }
    optimizeNodes() {
      super.optimizeNodes();
      const f = this.condition;
      if (f === !0)
        return this.nodes;
      let g = this.else;
      if (g) {
        const N = g.optimizeNodes();
        g = this.else = Array.isArray(N) ? new v(N) : N;
      }
      if (g)
        return f === !1 ? g instanceof m ? g : g.nodes : this.nodes.length ? this : new m(B(f), g instanceof m ? [g] : g.nodes);
      if (!(f === !1 || !this.nodes.length))
        return this;
    }
    optimizeNames(f, g) {
      var N;
      if (this.else = (N = this.else) === null || N === void 0 ? void 0 : N.optimizeNames(f, g), !!(super.optimizeNames(f, g) || this.else))
        return this.condition = L(this.condition, f, g), this;
    }
    get names() {
      const f = super.names;
      return Q(f, this.condition), this.else && V(f, this.else.names), f;
    }
  }
  m.kind = "if";
  class E extends $ {
  }
  E.kind = "for";
  class T extends E {
    constructor(f) {
      super(), this.iteration = f;
    }
    render(f) {
      return `for(${this.iteration})` + super.render(f);
    }
    optimizeNames(f, g) {
      if (super.optimizeNames(f, g))
        return this.iteration = L(this.iteration, f, g), this;
    }
    get names() {
      return V(super.names, this.iteration.names);
    }
  }
  class R extends E {
    constructor(f, g, N, w) {
      super(), this.varKind = f, this.name = g, this.from = N, this.to = w;
    }
    render(f) {
      const g = f.es5 ? r.varKinds.var : this.varKind, { name: N, from: w, to: y } = this;
      return `for(${g} ${N}=${w}; ${N}<${y}; ${N}++)` + super.render(f);
    }
    get names() {
      const f = Q(super.names, this.from);
      return Q(f, this.to);
    }
  }
  class F extends E {
    constructor(f, g, N, w) {
      super(), this.loop = f, this.varKind = g, this.name = N, this.iterable = w;
    }
    render(f) {
      return `for(${this.varKind} ${this.name} ${this.loop} ${this.iterable})` + super.render(f);
    }
    optimizeNames(f, g) {
      if (super.optimizeNames(f, g))
        return this.iterable = L(this.iterable, f, g), this;
    }
    get names() {
      return V(super.names, this.iterable.names);
    }
  }
  class H extends $ {
    constructor(f, g, N) {
      super(), this.name = f, this.args = g, this.async = N;
    }
    render(f) {
      return `${this.async ? "async " : ""}function ${this.name}(${this.args})` + super.render(f);
    }
  }
  H.kind = "func";
  class G extends p {
    render(f) {
      return "return " + super.render(f);
    }
  }
  G.kind = "return";
  class ie extends $ {
    render(f) {
      let g = "try" + super.render(f);
      return this.catch && (g += this.catch.render(f)), this.finally && (g += this.finally.render(f)), g;
    }
    optimizeNodes() {
      var f, g;
      return super.optimizeNodes(), (f = this.catch) === null || f === void 0 || f.optimizeNodes(), (g = this.finally) === null || g === void 0 || g.optimizeNodes(), this;
    }
    optimizeNames(f, g) {
      var N, w;
      return super.optimizeNames(f, g), (N = this.catch) === null || N === void 0 || N.optimizeNames(f, g), (w = this.finally) === null || w === void 0 || w.optimizeNames(f, g), this;
    }
    get names() {
      const f = super.names;
      return this.catch && V(f, this.catch.names), this.finally && V(f, this.finally.names), f;
    }
  }
  class C extends $ {
    constructor(f) {
      super(), this.error = f;
    }
    render(f) {
      return `catch(${this.error})` + super.render(f);
    }
  }
  C.kind = "catch";
  class J extends $ {
    render(f) {
      return "finally" + super.render(f);
    }
  }
  J.kind = "finally";
  class j {
    constructor(f, g = {}) {
      this._values = {}, this._blockStarts = [], this._constants = {}, this.opts = { ...g, _n: g.lines ? `
` : "" }, this._extScope = f, this._scope = new r.Scope({ parent: f }), this._nodes = [new _()];
    }
    toString() {
      return this._root.render(this.opts);
    }
    // returns unique name in the internal scope
    name(f) {
      return this._scope.name(f);
    }
    // reserves unique name in the external scope
    scopeName(f) {
      return this._extScope.name(f);
    }
    // reserves unique name in the external scope and assigns value to it
    scopeValue(f, g) {
      const N = this._extScope.value(f, g);
      return (this._values[N.prefix] || (this._values[N.prefix] = /* @__PURE__ */ new Set())).add(N), N;
    }
    getScopeValue(f, g) {
      return this._extScope.getValue(f, g);
    }
    // return code that assigns values in the external scope to the names that are used internally
    // (same names that were returned by gen.scopeName or gen.scopeValue)
    scopeRefs(f) {
      return this._extScope.scopeRefs(f, this._values);
    }
    scopeCode() {
      return this._extScope.scopeCode(this._values);
    }
    _def(f, g, N, w) {
      const y = this._scope.toName(g);
      return N !== void 0 && w && (this._constants[y.str] = N), this._leafNode(new a(f, y, N)), y;
    }
    // `const` declaration (`var` in es5 mode)
    const(f, g, N) {
      return this._def(r.varKinds.const, f, g, N);
    }
    // `let` declaration with optional assignment (`var` in es5 mode)
    let(f, g, N) {
      return this._def(r.varKinds.let, f, g, N);
    }
    // `var` declaration with optional assignment
    var(f, g, N) {
      return this._def(r.varKinds.var, f, g, N);
    }
    // assignment code
    assign(f, g, N) {
      return this._leafNode(new o(f, g, N));
    }
    // `+=` code
    add(f, g) {
      return this._leafNode(new c(f, e.operators.ADD, g));
    }
    // appends passed SafeExpr to code or executes Block
    code(f) {
      return typeof f == "function" ? f() : f !== t.nil && this._leafNode(new h(f)), this;
    }
    // returns code for object literal for the passed argument list of key-value pairs
    object(...f) {
      const g = ["{"];
      for (const [N, w] of f)
        g.length > 1 && g.push(","), g.push(N), (N !== w || this.opts.es5) && (g.push(":"), (0, t.addCodeArg)(g, w));
      return g.push("}"), new t._Code(g);
    }
    // `if` clause (or statement if `thenBody` and, optionally, `elseBody` are passed)
    if(f, g, N) {
      if (this._blockNode(new m(f)), g && N)
        this.code(g).else().code(N).endIf();
      else if (g)
        this.code(g).endIf();
      else if (N)
        throw new Error('CodeGen: "else" body without "then" body');
      return this;
    }
    // `else if` clause - invalid without `if` or after `else` clauses
    elseIf(f) {
      return this._elseNode(new m(f));
    }
    // `else` clause - only valid after `if` or `else if` clauses
    else() {
      return this._elseNode(new v());
    }
    // end `if` statement (needed if gen.if was used only with condition)
    endIf() {
      return this._endBlockNode(m, v);
    }
    _for(f, g) {
      return this._blockNode(f), g && this.code(g).endFor(), this;
    }
    // a generic `for` clause (or statement if `forBody` is passed)
    for(f, g) {
      return this._for(new T(f), g);
    }
    // `for` statement for a range of values
    forRange(f, g, N, w, y = this.opts.es5 ? r.varKinds.var : r.varKinds.let) {
      const k = this._scope.toName(f);
      return this._for(new R(y, k, g, N), () => w(k));
    }
    // `for-of` statement (in es5 mode replace with a normal for loop)
    forOf(f, g, N, w = r.varKinds.const) {
      const y = this._scope.toName(f);
      if (this.opts.es5) {
        const k = g instanceof t.Name ? g : this.var("_arr", g);
        return this.forRange("_i", 0, (0, t._)`${k}.length`, (A) => {
          this.var(y, (0, t._)`${k}[${A}]`), N(y);
        });
      }
      return this._for(new F("of", w, y, g), () => N(y));
    }
    // `for-in` statement.
    // With option `ownProperties` replaced with a `for-of` loop for object keys
    forIn(f, g, N, w = this.opts.es5 ? r.varKinds.var : r.varKinds.const) {
      if (this.opts.ownProperties)
        return this.forOf(f, (0, t._)`Object.keys(${g})`, N);
      const y = this._scope.toName(f);
      return this._for(new F("in", w, y, g), () => N(y));
    }
    // end `for` loop
    endFor() {
      return this._endBlockNode(E);
    }
    // `label` statement
    label(f) {
      return this._leafNode(new u(f));
    }
    // `break` statement
    break(f) {
      return this._leafNode(new l(f));
    }
    // `return` statement
    return(f) {
      const g = new G();
      if (this._blockNode(g), this.code(f), g.nodes.length !== 1)
        throw new Error('CodeGen: "return" should have one node');
      return this._endBlockNode(G);
    }
    // `try` statement
    try(f, g, N) {
      if (!g && !N)
        throw new Error('CodeGen: "try" without "catch" and "finally"');
      const w = new ie();
      if (this._blockNode(w), this.code(f), g) {
        const y = this.name("e");
        this._currNode = w.catch = new C(y), g(y);
      }
      return N && (this._currNode = w.finally = new J(), this.code(N)), this._endBlockNode(C, J);
    }
    // `throw` statement
    throw(f) {
      return this._leafNode(new d(f));
    }
    // start self-balancing block
    block(f, g) {
      return this._blockStarts.push(this._nodes.length), f && this.code(f).endBlock(g), this;
    }
    // end the current self-balancing block
    endBlock(f) {
      const g = this._blockStarts.pop();
      if (g === void 0)
        throw new Error("CodeGen: not in self-balancing block");
      const N = this._nodes.length - g;
      if (N < 0 || f !== void 0 && N !== f)
        throw new Error(`CodeGen: wrong number of nodes: ${N} vs ${f} expected`);
      return this._nodes.length = g, this;
    }
    // `function` heading (or definition if funcBody is passed)
    func(f, g = t.nil, N, w) {
      return this._blockNode(new H(f, g, N)), w && this.code(w).endFunc(), this;
    }
    // end function definition
    endFunc() {
      return this._endBlockNode(H);
    }
    optimize(f = 1) {
      for (; f-- > 0; )
        this._root.optimizeNodes(), this._root.optimizeNames(this._root.names, this._constants);
    }
    _leafNode(f) {
      return this._currNode.nodes.push(f), this;
    }
    _blockNode(f) {
      this._currNode.nodes.push(f), this._nodes.push(f);
    }
    _endBlockNode(f, g) {
      const N = this._currNode;
      if (N instanceof f || g && N instanceof g)
        return this._nodes.pop(), this;
      throw new Error(`CodeGen: not in block "${g ? `${f.kind}/${g.kind}` : f.kind}"`);
    }
    _elseNode(f) {
      const g = this._currNode;
      if (!(g instanceof m))
        throw new Error('CodeGen: "else" without "if"');
      return this._currNode = g.else = f, this;
    }
    get _root() {
      return this._nodes[0];
    }
    get _currNode() {
      const f = this._nodes;
      return f[f.length - 1];
    }
    set _currNode(f) {
      const g = this._nodes;
      g[g.length - 1] = f;
    }
  }
  e.CodeGen = j;
  function V(S, f) {
    for (const g in f)
      S[g] = (S[g] || 0) + (f[g] || 0);
    return S;
  }
  function Q(S, f) {
    return f instanceof t._CodeOrName ? V(S, f.names) : S;
  }
  function L(S, f, g) {
    if (S instanceof t.Name)
      return N(S);
    if (!w(S))
      return S;
    return new t._Code(S._items.reduce((y, k) => (k instanceof t.Name && (k = N(k)), k instanceof t._Code ? y.push(...k._items) : y.push(k), y), []));
    function N(y) {
      const k = g[y.str];
      return k === void 0 || f[y.str] !== 1 ? y : (delete f[y.str], k);
    }
    function w(y) {
      return y instanceof t._Code && y._items.some((k) => k instanceof t.Name && f[k.str] === 1 && g[k.str] !== void 0);
    }
  }
  function U(S, f) {
    for (const g in f)
      S[g] = (S[g] || 0) - (f[g] || 0);
  }
  function B(S) {
    return typeof S == "boolean" || typeof S == "number" || S === null ? !S : (0, t._)`!${O(S)}`;
  }
  e.not = B;
  const M = b(e.operators.AND);
  function z(...S) {
    return S.reduce(M);
  }
  e.and = z;
  const q = b(e.operators.OR);
  function I(...S) {
    return S.reduce(q);
  }
  e.or = I;
  function b(S) {
    return (f, g) => f === t.nil ? g : g === t.nil ? f : (0, t._)`${O(f)} ${S} ${O(g)}`;
  }
  function O(S) {
    return S instanceof t.Name ? S : (0, t._)`(${S})`;
  }
})(oe);
var K = {};
Object.defineProperty(K, "__esModule", { value: !0 });
K.checkStrictMode = K.getErrorPath = K.Type = K.useFunc = K.setEvaluated = K.evaluatedPropsToName = K.mergeEvaluated = K.eachItem = K.unescapeJsonPointer = K.escapeJsonPointer = K.escapeFragment = K.unescapeFragment = K.schemaRefOrVal = K.schemaHasRulesButRef = K.schemaHasRules = K.checkUnknownRules = K.alwaysValidSchema = K.toHash = void 0;
const ve = oe, X$ = As;
function J$(e) {
  const t = {};
  for (const r of e)
    t[r] = !0;
  return t;
}
K.toHash = J$;
function Q$(e, t) {
  return typeof t == "boolean" ? t : Object.keys(t).length === 0 ? !0 : (yy(e, t), !gy(t, e.self.RULES.all));
}
K.alwaysValidSchema = Q$;
function yy(e, t = e.schema) {
  const { opts: r, self: n } = e;
  if (!r.strictSchema || typeof t == "boolean")
    return;
  const i = n.RULES.keywords;
  for (const s in t)
    i[s] || $y(e, `unknown keyword: "${s}"`);
}
K.checkUnknownRules = yy;
function gy(e, t) {
  if (typeof e == "boolean")
    return !e;
  for (const r in e)
    if (t[r])
      return !0;
  return !1;
}
K.schemaHasRules = gy;
function Z$(e, t) {
  if (typeof e == "boolean")
    return !e;
  for (const r in e)
    if (r !== "$ref" && t.all[r])
      return !0;
  return !1;
}
K.schemaHasRulesButRef = Z$;
function ew({ topSchemaRef: e, schemaPath: t }, r, n, i) {
  if (!i) {
    if (typeof r == "number" || typeof r == "boolean")
      return r;
    if (typeof r == "string")
      return (0, ve._)`${r}`;
  }
  return (0, ve._)`${e}${t}${(0, ve.getProperty)(n)}`;
}
K.schemaRefOrVal = ew;
function tw(e) {
  return _y(decodeURIComponent(e));
}
K.unescapeFragment = tw;
function rw(e) {
  return encodeURIComponent(uu(e));
}
K.escapeFragment = rw;
function uu(e) {
  return typeof e == "number" ? `${e}` : e.replace(/~/g, "~0").replace(/\//g, "~1");
}
K.escapeJsonPointer = uu;
function _y(e) {
  return e.replace(/~1/g, "/").replace(/~0/g, "~");
}
K.unescapeJsonPointer = _y;
function nw(e, t) {
  if (Array.isArray(e))
    for (const r of e)
      t(r);
  else
    t(e);
}
K.eachItem = nw;
function ah({ mergeNames: e, mergeToName: t, mergeValues: r, resultToName: n }) {
  return (i, s, a, o) => {
    const c = a === void 0 ? s : a instanceof ve.Name ? (s instanceof ve.Name ? e(i, s, a) : t(i, s, a), a) : s instanceof ve.Name ? (t(i, a, s), s) : r(s, a);
    return o === ve.Name && !(c instanceof ve.Name) ? n(i, c) : c;
  };
}
K.mergeEvaluated = {
  props: ah({
    mergeNames: (e, t, r) => e.if((0, ve._)`${r} !== true && ${t} !== undefined`, () => {
      e.if((0, ve._)`${t} === true`, () => e.assign(r, !0), () => e.assign(r, (0, ve._)`${r} || {}`).code((0, ve._)`Object.assign(${r}, ${t})`));
    }),
    mergeToName: (e, t, r) => e.if((0, ve._)`${r} !== true`, () => {
      t === !0 ? e.assign(r, !0) : (e.assign(r, (0, ve._)`${r} || {}`), du(e, r, t));
    }),
    mergeValues: (e, t) => e === !0 ? !0 : { ...e, ...t },
    resultToName: vy
  }),
  items: ah({
    mergeNames: (e, t, r) => e.if((0, ve._)`${r} !== true && ${t} !== undefined`, () => e.assign(r, (0, ve._)`${t} === true ? true : ${r} > ${t} ? ${r} : ${t}`)),
    mergeToName: (e, t, r) => e.if((0, ve._)`${r} !== true`, () => e.assign(r, t === !0 ? !0 : (0, ve._)`${r} > ${t} ? ${r} : ${t}`)),
    mergeValues: (e, t) => e === !0 ? !0 : Math.max(e, t),
    resultToName: (e, t) => e.var("items", t)
  })
};
function vy(e, t) {
  if (t === !0)
    return e.var("props", !0);
  const r = e.var("props", (0, ve._)`{}`);
  return t !== void 0 && du(e, r, t), r;
}
K.evaluatedPropsToName = vy;
function du(e, t, r) {
  Object.keys(r).forEach((n) => e.assign((0, ve._)`${t}${(0, ve.getProperty)(n)}`, !0));
}
K.setEvaluated = du;
const oh = {};
function iw(e, t) {
  return e.scopeValue("func", {
    ref: t,
    code: oh[t.code] || (oh[t.code] = new X$._Code(t.code))
  });
}
K.useFunc = iw;
var Al;
(function(e) {
  e[e.Num = 0] = "Num", e[e.Str = 1] = "Str";
})(Al || (K.Type = Al = {}));
function sw(e, t, r) {
  if (e instanceof ve.Name) {
    const n = t === Al.Num;
    return r ? n ? (0, ve._)`"[" + ${e} + "]"` : (0, ve._)`"['" + ${e} + "']"` : n ? (0, ve._)`"/" + ${e}` : (0, ve._)`"/" + ${e}.replace(/~/g, "~0").replace(/\\//g, "~1")`;
  }
  return r ? (0, ve.getProperty)(e).toString() : "/" + uu(e);
}
K.getErrorPath = sw;
function $y(e, t, r = e.opts.strictSchema) {
  if (r) {
    if (t = `strict mode: ${t}`, r === !0)
      throw new Error(t);
    e.self.logger.warn(t);
  }
}
K.checkStrictMode = $y;
var kt = {};
Object.defineProperty(kt, "__esModule", { value: !0 });
const it = oe, aw = {
  // validation function arguments
  data: new it.Name("data"),
  // data passed to validation function
  // args passed from referencing schema
  valCxt: new it.Name("valCxt"),
  // validation/data context - should not be used directly, it is destructured to the names below
  instancePath: new it.Name("instancePath"),
  parentData: new it.Name("parentData"),
  parentDataProperty: new it.Name("parentDataProperty"),
  rootData: new it.Name("rootData"),
  // root data - same as the data passed to the first/top validation function
  dynamicAnchors: new it.Name("dynamicAnchors"),
  // used to support recursiveRef and dynamicRef
  // function scoped variables
  vErrors: new it.Name("vErrors"),
  // null or array of validation errors
  errors: new it.Name("errors"),
  // counter of validation errors
  this: new it.Name("this"),
  // "globals"
  self: new it.Name("self"),
  scope: new it.Name("scope"),
  // JTD serialize/parse name for JSON string and position
  json: new it.Name("json"),
  jsonPos: new it.Name("jsonPos"),
  jsonLen: new it.Name("jsonLen"),
  jsonPart: new it.Name("jsonPart")
};
kt.default = aw;
(function(e) {
  Object.defineProperty(e, "__esModule", { value: !0 }), e.extendErrors = e.resetErrorsCount = e.reportExtraError = e.reportError = e.keyword$DataError = e.keywordError = void 0;
  const t = oe, r = K, n = kt;
  e.keywordError = {
    message: ({ keyword: v }) => (0, t.str)`must pass "${v}" keyword validation`
  }, e.keyword$DataError = {
    message: ({ keyword: v, schemaType: m }) => m ? (0, t.str)`"${v}" keyword must be ${m} ($data)` : (0, t.str)`"${v}" keyword is invalid ($data)`
  };
  function i(v, m = e.keywordError, E, T) {
    const { it: R } = v, { gen: F, compositeRule: H, allErrors: G } = R, ie = d(v, m, E);
    T ?? (H || G) ? c(F, ie) : u(R, (0, t._)`[${ie}]`);
  }
  e.reportError = i;
  function s(v, m = e.keywordError, E) {
    const { it: T } = v, { gen: R, compositeRule: F, allErrors: H } = T, G = d(v, m, E);
    c(R, G), F || H || u(T, n.default.vErrors);
  }
  e.reportExtraError = s;
  function a(v, m) {
    v.assign(n.default.errors, m), v.if((0, t._)`${n.default.vErrors} !== null`, () => v.if(m, () => v.assign((0, t._)`${n.default.vErrors}.length`, m), () => v.assign(n.default.vErrors, null)));
  }
  e.resetErrorsCount = a;
  function o({ gen: v, keyword: m, schemaValue: E, data: T, errsCount: R, it: F }) {
    if (R === void 0)
      throw new Error("ajv implementation error");
    const H = v.name("err");
    v.forRange("i", R, n.default.errors, (G) => {
      v.const(H, (0, t._)`${n.default.vErrors}[${G}]`), v.if((0, t._)`${H}.instancePath === undefined`, () => v.assign((0, t._)`${H}.instancePath`, (0, t.strConcat)(n.default.instancePath, F.errorPath))), v.assign((0, t._)`${H}.schemaPath`, (0, t.str)`${F.errSchemaPath}/${m}`), F.opts.verbose && (v.assign((0, t._)`${H}.schema`, E), v.assign((0, t._)`${H}.data`, T));
    });
  }
  e.extendErrors = o;
  function c(v, m) {
    const E = v.const("err", m);
    v.if((0, t._)`${n.default.vErrors} === null`, () => v.assign(n.default.vErrors, (0, t._)`[${E}]`), (0, t._)`${n.default.vErrors}.push(${E})`), v.code((0, t._)`${n.default.errors}++`);
  }
  function u(v, m) {
    const { gen: E, validateName: T, schemaEnv: R } = v;
    R.$async ? E.throw((0, t._)`new ${v.ValidationError}(${m})`) : (E.assign((0, t._)`${T}.errors`, m), E.return(!1));
  }
  const l = {
    keyword: new t.Name("keyword"),
    schemaPath: new t.Name("schemaPath"),
    // also used in JTD errors
    params: new t.Name("params"),
    propertyName: new t.Name("propertyName"),
    message: new t.Name("message"),
    schema: new t.Name("schema"),
    parentSchema: new t.Name("parentSchema")
  };
  function d(v, m, E) {
    const { createErrors: T } = v.it;
    return T === !1 ? (0, t._)`{}` : h(v, m, E);
  }
  function h(v, m, E = {}) {
    const { gen: T, it: R } = v, F = [
      p(R, E),
      $(v, E)
    ];
    return _(v, m, F), T.object(...F);
  }
  function p({ errorPath: v }, { instancePath: m }) {
    const E = m ? (0, t.str)`${v}${(0, r.getErrorPath)(m, r.Type.Str)}` : v;
    return [n.default.instancePath, (0, t.strConcat)(n.default.instancePath, E)];
  }
  function $({ keyword: v, it: { errSchemaPath: m } }, { schemaPath: E, parentSchema: T }) {
    let R = T ? m : (0, t.str)`${m}/${v}`;
    return E && (R = (0, t.str)`${R}${(0, r.getErrorPath)(E, r.Type.Str)}`), [l.schemaPath, R];
  }
  function _(v, { params: m, message: E }, T) {
    const { keyword: R, data: F, schemaValue: H, it: G } = v, { opts: ie, propertyName: C, topSchemaRef: J, schemaPath: j } = G;
    T.push([l.keyword, R], [l.params, typeof m == "function" ? m(v) : m || (0, t._)`{}`]), ie.messages && T.push([l.message, typeof E == "function" ? E(v) : E]), ie.verbose && T.push([l.schema, H], [l.parentSchema, (0, t._)`${J}${j}`], [n.default.data, F]), C && T.push([l.propertyName, C]);
  }
})(Ws);
Object.defineProperty(Ci, "__esModule", { value: !0 });
Ci.boolOrEmptySchema = Ci.topBoolOrEmptySchema = void 0;
const ow = Ws, cw = oe, lw = kt, uw = {
  message: "boolean schema is false"
};
function dw(e) {
  const { gen: t, schema: r, validateName: n } = e;
  r === !1 ? wy(e, !1) : typeof r == "object" && r.$async === !0 ? t.return(lw.default.data) : (t.assign((0, cw._)`${n}.errors`, null), t.return(!0));
}
Ci.topBoolOrEmptySchema = dw;
function fw(e, t) {
  const { gen: r, schema: n } = e;
  n === !1 ? (r.var(t, !1), wy(e)) : r.var(t, !0);
}
Ci.boolOrEmptySchema = fw;
function wy(e, t) {
  const { gen: r, data: n } = e, i = {
    gen: r,
    keyword: "false schema",
    data: n,
    schema: !1,
    schemaCode: !1,
    schemaValue: !1,
    params: {},
    it: e
  };
  (0, ow.reportError)(i, uw, void 0, t);
}
var Me = {}, Hn = {};
Object.defineProperty(Hn, "__esModule", { value: !0 });
Hn.getRules = Hn.isJSONType = void 0;
const hw = ["string", "number", "integer", "boolean", "null", "object", "array"], pw = new Set(hw);
function mw(e) {
  return typeof e == "string" && pw.has(e);
}
Hn.isJSONType = mw;
function yw() {
  const e = {
    number: { type: "number", rules: [] },
    string: { type: "string", rules: [] },
    array: { type: "array", rules: [] },
    object: { type: "object", rules: [] }
  };
  return {
    types: { ...e, integer: !0, boolean: !0, null: !0 },
    rules: [{ rules: [] }, e.number, e.string, e.array, e.object],
    post: { rules: [] },
    all: {},
    keywords: {}
  };
}
Hn.getRules = yw;
var Or = {};
Object.defineProperty(Or, "__esModule", { value: !0 });
Or.shouldUseRule = Or.shouldUseGroup = Or.schemaHasRulesForType = void 0;
function gw({ schema: e, self: t }, r) {
  const n = t.RULES.types[r];
  return n && n !== !0 && Ey(e, n);
}
Or.schemaHasRulesForType = gw;
function Ey(e, t) {
  return t.rules.some((r) => by(e, r));
}
Or.shouldUseGroup = Ey;
function by(e, t) {
  var r;
  return e[t.keyword] !== void 0 || ((r = t.definition.implements) === null || r === void 0 ? void 0 : r.some((n) => e[n] !== void 0));
}
Or.shouldUseRule = by;
Object.defineProperty(Me, "__esModule", { value: !0 });
Me.reportTypeError = Me.checkDataTypes = Me.checkDataType = Me.coerceAndCheckDataType = Me.getJSONTypes = Me.getSchemaTypes = Me.DataType = void 0;
const _w = Hn, vw = Or, $w = Ws, le = oe, Sy = K;
var bi;
(function(e) {
  e[e.Correct = 0] = "Correct", e[e.Wrong = 1] = "Wrong";
})(bi || (Me.DataType = bi = {}));
function ww(e) {
  const t = Py(e.type);
  if (t.includes("null")) {
    if (e.nullable === !1)
      throw new Error("type: null contradicts nullable: false");
  } else {
    if (!t.length && e.nullable !== void 0)
      throw new Error('"nullable" cannot be used without "type"');
    e.nullable === !0 && t.push("null");
  }
  return t;
}
Me.getSchemaTypes = ww;
function Py(e) {
  const t = Array.isArray(e) ? e : e ? [e] : [];
  if (t.every(_w.isJSONType))
    return t;
  throw new Error("type must be JSONType or JSONType[]: " + t.join(","));
}
Me.getJSONTypes = Py;
function Ew(e, t) {
  const { gen: r, data: n, opts: i } = e, s = bw(t, i.coerceTypes), a = t.length > 0 && !(s.length === 0 && t.length === 1 && (0, vw.schemaHasRulesForType)(e, t[0]));
  if (a) {
    const o = fu(t, n, i.strictNumbers, bi.Wrong);
    r.if(o, () => {
      s.length ? Sw(e, t, s) : hu(e);
    });
  }
  return a;
}
Me.coerceAndCheckDataType = Ew;
const Ty = /* @__PURE__ */ new Set(["string", "number", "integer", "boolean", "null"]);
function bw(e, t) {
  return t ? e.filter((r) => Ty.has(r) || t === "array" && r === "array") : [];
}
function Sw(e, t, r) {
  const { gen: n, data: i, opts: s } = e, a = n.let("dataType", (0, le._)`typeof ${i}`), o = n.let("coerced", (0, le._)`undefined`);
  s.coerceTypes === "array" && n.if((0, le._)`${a} == 'object' && Array.isArray(${i}) && ${i}.length == 1`, () => n.assign(i, (0, le._)`${i}[0]`).assign(a, (0, le._)`typeof ${i}`).if(fu(t, i, s.strictNumbers), () => n.assign(o, i))), n.if((0, le._)`${o} !== undefined`);
  for (const u of r)
    (Ty.has(u) || u === "array" && s.coerceTypes === "array") && c(u);
  n.else(), hu(e), n.endIf(), n.if((0, le._)`${o} !== undefined`, () => {
    n.assign(i, o), Pw(e, o);
  });
  function c(u) {
    switch (u) {
      case "string":
        n.elseIf((0, le._)`${a} == "number" || ${a} == "boolean"`).assign(o, (0, le._)`"" + ${i}`).elseIf((0, le._)`${i} === null`).assign(o, (0, le._)`""`);
        return;
      case "number":
        n.elseIf((0, le._)`${a} == "boolean" || ${i} === null
              || (${a} == "string" && ${i} && ${i} == +${i})`).assign(o, (0, le._)`+${i}`);
        return;
      case "integer":
        n.elseIf((0, le._)`${a} === "boolean" || ${i} === null
              || (${a} === "string" && ${i} && ${i} == +${i} && !(${i} % 1))`).assign(o, (0, le._)`+${i}`);
        return;
      case "boolean":
        n.elseIf((0, le._)`${i} === "false" || ${i} === 0 || ${i} === null`).assign(o, !1).elseIf((0, le._)`${i} === "true" || ${i} === 1`).assign(o, !0);
        return;
      case "null":
        n.elseIf((0, le._)`${i} === "" || ${i} === 0 || ${i} === false`), n.assign(o, null);
        return;
      case "array":
        n.elseIf((0, le._)`${a} === "string" || ${a} === "number"
              || ${a} === "boolean" || ${i} === null`).assign(o, (0, le._)`[${i}]`);
    }
  }
}
function Pw({ gen: e, parentData: t, parentDataProperty: r }, n) {
  e.if((0, le._)`${t} !== undefined`, () => e.assign((0, le._)`${t}[${r}]`, n));
}
function Cl(e, t, r, n = bi.Correct) {
  const i = n === bi.Correct ? le.operators.EQ : le.operators.NEQ;
  let s;
  switch (e) {
    case "null":
      return (0, le._)`${t} ${i} null`;
    case "array":
      s = (0, le._)`Array.isArray(${t})`;
      break;
    case "object":
      s = (0, le._)`${t} && typeof ${t} == "object" && !Array.isArray(${t})`;
      break;
    case "integer":
      s = a((0, le._)`!(${t} % 1) && !isNaN(${t})`);
      break;
    case "number":
      s = a();
      break;
    default:
      return (0, le._)`typeof ${t} ${i} ${e}`;
  }
  return n === bi.Correct ? s : (0, le.not)(s);
  function a(o = le.nil) {
    return (0, le.and)((0, le._)`typeof ${t} == "number"`, o, r ? (0, le._)`isFinite(${t})` : le.nil);
  }
}
Me.checkDataType = Cl;
function fu(e, t, r, n) {
  if (e.length === 1)
    return Cl(e[0], t, r, n);
  let i;
  const s = (0, Sy.toHash)(e);
  if (s.array && s.object) {
    const a = (0, le._)`typeof ${t} != "object"`;
    i = s.null ? a : (0, le._)`!${t} || ${a}`, delete s.null, delete s.array, delete s.object;
  } else
    i = le.nil;
  s.number && delete s.integer;
  for (const a in s)
    i = (0, le.and)(i, Cl(a, t, r, n));
  return i;
}
Me.checkDataTypes = fu;
const Tw = {
  message: ({ schema: e }) => `must be ${e}`,
  params: ({ schema: e, schemaValue: t }) => typeof e == "string" ? (0, le._)`{type: ${e}}` : (0, le._)`{type: ${t}}`
};
function hu(e) {
  const t = Nw(e);
  (0, $w.reportError)(t, Tw);
}
Me.reportTypeError = hu;
function Nw(e) {
  const { gen: t, data: r, schema: n } = e, i = (0, Sy.schemaRefOrVal)(e, n, "type");
  return {
    gen: t,
    keyword: "type",
    data: r,
    schema: n.type,
    schemaCode: i,
    schemaValue: i,
    parentSchema: n,
    params: {},
    it: e
  };
}
var Vo = {};
Object.defineProperty(Vo, "__esModule", { value: !0 });
Vo.assignDefaults = void 0;
const ei = oe, Ow = K;
function Aw(e, t) {
  const { properties: r, items: n } = e.schema;
  if (t === "object" && r)
    for (const i in r)
      ch(e, i, r[i].default);
  else t === "array" && Array.isArray(n) && n.forEach((i, s) => ch(e, s, i.default));
}
Vo.assignDefaults = Aw;
function ch(e, t, r) {
  const { gen: n, compositeRule: i, data: s, opts: a } = e;
  if (r === void 0)
    return;
  const o = (0, ei._)`${s}${(0, ei.getProperty)(t)}`;
  if (i) {
    (0, Ow.checkStrictMode)(e, `default is ignored for: ${o}`);
    return;
  }
  let c = (0, ei._)`${o} === undefined`;
  a.useDefaults === "empty" && (c = (0, ei._)`${c} || ${o} === null || ${o} === ""`), n.if(c, (0, ei._)`${o} = ${(0, ei.stringify)(r)}`);
}
var fr = {}, pe = {};
Object.defineProperty(pe, "__esModule", { value: !0 });
pe.validateUnion = pe.validateArray = pe.usePattern = pe.callValidateCode = pe.schemaProperties = pe.allSchemaProperties = pe.noPropertyInData = pe.propertyInData = pe.isOwnProperty = pe.hasPropFunc = pe.reportMissingProp = pe.checkMissingProp = pe.checkReportMissingProp = void 0;
const Pe = oe, pu = K, Br = kt, Cw = K;
function Rw(e, t) {
  const { gen: r, data: n, it: i } = e;
  r.if(yu(r, n, t, i.opts.ownProperties), () => {
    e.setParams({ missingProperty: (0, Pe._)`${t}` }, !0), e.error();
  });
}
pe.checkReportMissingProp = Rw;
function Iw({ gen: e, data: t, it: { opts: r } }, n, i) {
  return (0, Pe.or)(...n.map((s) => (0, Pe.and)(yu(e, t, s, r.ownProperties), (0, Pe._)`${i} = ${s}`)));
}
pe.checkMissingProp = Iw;
function Dw(e, t) {
  e.setParams({ missingProperty: t }, !0), e.error();
}
pe.reportMissingProp = Dw;
function Ny(e) {
  return e.scopeValue("func", {
    // eslint-disable-next-line @typescript-eslint/unbound-method
    ref: Object.prototype.hasOwnProperty,
    code: (0, Pe._)`Object.prototype.hasOwnProperty`
  });
}
pe.hasPropFunc = Ny;
function mu(e, t, r) {
  return (0, Pe._)`${Ny(e)}.call(${t}, ${r})`;
}
pe.isOwnProperty = mu;
function kw(e, t, r, n) {
  const i = (0, Pe._)`${t}${(0, Pe.getProperty)(r)} !== undefined`;
  return n ? (0, Pe._)`${i} && ${mu(e, t, r)}` : i;
}
pe.propertyInData = kw;
function yu(e, t, r, n) {
  const i = (0, Pe._)`${t}${(0, Pe.getProperty)(r)} === undefined`;
  return n ? (0, Pe.or)(i, (0, Pe.not)(mu(e, t, r))) : i;
}
pe.noPropertyInData = yu;
function Oy(e) {
  return e ? Object.keys(e).filter((t) => t !== "__proto__") : [];
}
pe.allSchemaProperties = Oy;
function Fw(e, t) {
  return Oy(t).filter((r) => !(0, pu.alwaysValidSchema)(e, t[r]));
}
pe.schemaProperties = Fw;
function jw({ schemaCode: e, data: t, it: { gen: r, topSchemaRef: n, schemaPath: i, errorPath: s }, it: a }, o, c, u) {
  const l = u ? (0, Pe._)`${e}, ${t}, ${n}${i}` : t, d = [
    [Br.default.instancePath, (0, Pe.strConcat)(Br.default.instancePath, s)],
    [Br.default.parentData, a.parentData],
    [Br.default.parentDataProperty, a.parentDataProperty],
    [Br.default.rootData, Br.default.rootData]
  ];
  a.opts.dynamicRef && d.push([Br.default.dynamicAnchors, Br.default.dynamicAnchors]);
  const h = (0, Pe._)`${l}, ${r.object(...d)}`;
  return c !== Pe.nil ? (0, Pe._)`${o}.call(${c}, ${h})` : (0, Pe._)`${o}(${h})`;
}
pe.callValidateCode = jw;
const Lw = (0, Pe._)`new RegExp`;
function Uw({ gen: e, it: { opts: t } }, r) {
  const n = t.unicodeRegExp ? "u" : "", { regExp: i } = t.code, s = i(r, n);
  return e.scopeValue("pattern", {
    key: s.toString(),
    ref: s,
    code: (0, Pe._)`${i.code === "new RegExp" ? Lw : (0, Cw.useFunc)(e, i)}(${r}, ${n})`
  });
}
pe.usePattern = Uw;
function Mw(e) {
  const { gen: t, data: r, keyword: n, it: i } = e, s = t.name("valid");
  if (i.allErrors) {
    const o = t.let("valid", !0);
    return a(() => t.assign(o, !1)), o;
  }
  return t.var(s, !0), a(() => t.break()), s;
  function a(o) {
    const c = t.const("len", (0, Pe._)`${r}.length`);
    t.forRange("i", 0, c, (u) => {
      e.subschema({
        keyword: n,
        dataProp: u,
        dataPropType: pu.Type.Num
      }, s), t.if((0, Pe.not)(s), o);
    });
  }
}
pe.validateArray = Mw;
function xw(e) {
  const { gen: t, schema: r, keyword: n, it: i } = e;
  if (!Array.isArray(r))
    throw new Error("ajv implementation error");
  if (r.some((c) => (0, pu.alwaysValidSchema)(i, c)) && !i.opts.unevaluated)
    return;
  const a = t.let("valid", !1), o = t.name("_valid");
  t.block(() => r.forEach((c, u) => {
    const l = e.subschema({
      keyword: n,
      schemaProp: u,
      compositeRule: !0
    }, o);
    t.assign(a, (0, Pe._)`${a} || ${o}`), e.mergeValidEvaluated(l, o) || t.if((0, Pe.not)(a));
  })), e.result(a, () => e.reset(), () => e.error(!0));
}
pe.validateUnion = xw;
Object.defineProperty(fr, "__esModule", { value: !0 });
fr.validateKeywordUsage = fr.validSchemaType = fr.funcKeywordCode = fr.macroKeywordCode = void 0;
const ft = oe, Cn = kt, Vw = pe, qw = Ws;
function Bw(e, t) {
  const { gen: r, keyword: n, schema: i, parentSchema: s, it: a } = e, o = t.macro.call(a.self, i, s, a), c = Ay(r, n, o);
  a.opts.validateSchema !== !1 && a.self.validateSchema(o, !0);
  const u = r.name("valid");
  e.subschema({
    schema: o,
    schemaPath: ft.nil,
    errSchemaPath: `${a.errSchemaPath}/${n}`,
    topSchemaRef: c,
    compositeRule: !0
  }, u), e.pass(u, () => e.error(!0));
}
fr.macroKeywordCode = Bw;
function Hw(e, t) {
  var r;
  const { gen: n, keyword: i, schema: s, parentSchema: a, $data: o, it: c } = e;
  zw(c, t);
  const u = !o && t.compile ? t.compile.call(c.self, s, a, c) : t.validate, l = Ay(n, i, u), d = n.let("valid");
  e.block$data(d, h), e.ok((r = t.valid) !== null && r !== void 0 ? r : d);
  function h() {
    if (t.errors === !1)
      _(), t.modifying && lh(e), v(() => e.error());
    else {
      const m = t.async ? p() : $();
      t.modifying && lh(e), v(() => Gw(e, m));
    }
  }
  function p() {
    const m = n.let("ruleErrs", null);
    return n.try(() => _((0, ft._)`await `), (E) => n.assign(d, !1).if((0, ft._)`${E} instanceof ${c.ValidationError}`, () => n.assign(m, (0, ft._)`${E}.errors`), () => n.throw(E))), m;
  }
  function $() {
    const m = (0, ft._)`${l}.errors`;
    return n.assign(m, null), _(ft.nil), m;
  }
  function _(m = t.async ? (0, ft._)`await ` : ft.nil) {
    const E = c.opts.passContext ? Cn.default.this : Cn.default.self, T = !("compile" in t && !o || t.schema === !1);
    n.assign(d, (0, ft._)`${m}${(0, Vw.callValidateCode)(e, l, E, T)}`, t.modifying);
  }
  function v(m) {
    var E;
    n.if((0, ft.not)((E = t.valid) !== null && E !== void 0 ? E : d), m);
  }
}
fr.funcKeywordCode = Hw;
function lh(e) {
  const { gen: t, data: r, it: n } = e;
  t.if(n.parentData, () => t.assign(r, (0, ft._)`${n.parentData}[${n.parentDataProperty}]`));
}
function Gw(e, t) {
  const { gen: r } = e;
  r.if((0, ft._)`Array.isArray(${t})`, () => {
    r.assign(Cn.default.vErrors, (0, ft._)`${Cn.default.vErrors} === null ? ${t} : ${Cn.default.vErrors}.concat(${t})`).assign(Cn.default.errors, (0, ft._)`${Cn.default.vErrors}.length`), (0, qw.extendErrors)(e);
  }, () => e.error());
}
function zw({ schemaEnv: e }, t) {
  if (t.async && !e.$async)
    throw new Error("async keyword in sync schema");
}
function Ay(e, t, r) {
  if (r === void 0)
    throw new Error(`keyword "${t}" failed to compile`);
  return e.scopeValue("keyword", typeof r == "function" ? { ref: r } : { ref: r, code: (0, ft.stringify)(r) });
}
function Kw(e, t, r = !1) {
  return !t.length || t.some((n) => n === "array" ? Array.isArray(e) : n === "object" ? e && typeof e == "object" && !Array.isArray(e) : typeof e == n || r && typeof e > "u");
}
fr.validSchemaType = Kw;
function Ww({ schema: e, opts: t, self: r, errSchemaPath: n }, i, s) {
  if (Array.isArray(i.keyword) ? !i.keyword.includes(s) : i.keyword !== s)
    throw new Error("ajv implementation error");
  const a = i.dependencies;
  if (a != null && a.some((o) => !Object.prototype.hasOwnProperty.call(e, o)))
    throw new Error(`parent schema must have dependencies of ${s}: ${a.join(",")}`);
  if (i.validateSchema && !i.validateSchema(e[s])) {
    const c = `keyword "${s}" value is invalid at path "${n}": ` + r.errorsText(i.validateSchema.errors);
    if (t.validateSchema === "log")
      r.logger.error(c);
    else
      throw new Error(c);
  }
}
fr.validateKeywordUsage = Ww;
var on = {};
Object.defineProperty(on, "__esModule", { value: !0 });
on.extendSubschemaMode = on.extendSubschemaData = on.getSubschema = void 0;
const ur = oe, Cy = K;
function Yw(e, { keyword: t, schemaProp: r, schema: n, schemaPath: i, errSchemaPath: s, topSchemaRef: a }) {
  if (t !== void 0 && n !== void 0)
    throw new Error('both "keyword" and "schema" passed, only one allowed');
  if (t !== void 0) {
    const o = e.schema[t];
    return r === void 0 ? {
      schema: o,
      schemaPath: (0, ur._)`${e.schemaPath}${(0, ur.getProperty)(t)}`,
      errSchemaPath: `${e.errSchemaPath}/${t}`
    } : {
      schema: o[r],
      schemaPath: (0, ur._)`${e.schemaPath}${(0, ur.getProperty)(t)}${(0, ur.getProperty)(r)}`,
      errSchemaPath: `${e.errSchemaPath}/${t}/${(0, Cy.escapeFragment)(r)}`
    };
  }
  if (n !== void 0) {
    if (i === void 0 || s === void 0 || a === void 0)
      throw new Error('"schemaPath", "errSchemaPath" and "topSchemaRef" are required with "schema"');
    return {
      schema: n,
      schemaPath: i,
      topSchemaRef: a,
      errSchemaPath: s
    };
  }
  throw new Error('either "keyword" or "schema" must be passed');
}
on.getSubschema = Yw;
function Xw(e, t, { dataProp: r, dataPropType: n, data: i, dataTypes: s, propertyName: a }) {
  if (i !== void 0 && r !== void 0)
    throw new Error('both "data" and "dataProp" passed, only one allowed');
  const { gen: o } = t;
  if (r !== void 0) {
    const { errorPath: u, dataPathArr: l, opts: d } = t, h = o.let("data", (0, ur._)`${t.data}${(0, ur.getProperty)(r)}`, !0);
    c(h), e.errorPath = (0, ur.str)`${u}${(0, Cy.getErrorPath)(r, n, d.jsPropertySyntax)}`, e.parentDataProperty = (0, ur._)`${r}`, e.dataPathArr = [...l, e.parentDataProperty];
  }
  if (i !== void 0) {
    const u = i instanceof ur.Name ? i : o.let("data", i, !0);
    c(u), a !== void 0 && (e.propertyName = a);
  }
  s && (e.dataTypes = s);
  function c(u) {
    e.data = u, e.dataLevel = t.dataLevel + 1, e.dataTypes = [], t.definedProperties = /* @__PURE__ */ new Set(), e.parentData = t.data, e.dataNames = [...t.dataNames, u];
  }
}
on.extendSubschemaData = Xw;
function Jw(e, { jtdDiscriminator: t, jtdMetadata: r, compositeRule: n, createErrors: i, allErrors: s }) {
  n !== void 0 && (e.compositeRule = n), i !== void 0 && (e.createErrors = i), s !== void 0 && (e.allErrors = s), e.jtdDiscriminator = t, e.jtdMetadata = r;
}
on.extendSubschemaMode = Jw;
var Xe = {}, qo = function e(t, r) {
  if (t === r) return !0;
  if (t && r && typeof t == "object" && typeof r == "object") {
    if (t.constructor !== r.constructor) return !1;
    var n, i, s;
    if (Array.isArray(t)) {
      if (n = t.length, n != r.length) return !1;
      for (i = n; i-- !== 0; )
        if (!e(t[i], r[i])) return !1;
      return !0;
    }
    if (t.constructor === RegExp) return t.source === r.source && t.flags === r.flags;
    if (t.valueOf !== Object.prototype.valueOf) return t.valueOf() === r.valueOf();
    if (t.toString !== Object.prototype.toString) return t.toString() === r.toString();
    if (s = Object.keys(t), n = s.length, n !== Object.keys(r).length) return !1;
    for (i = n; i-- !== 0; )
      if (!Object.prototype.hasOwnProperty.call(r, s[i])) return !1;
    for (i = n; i-- !== 0; ) {
      var a = s[i];
      if (!e(t[a], r[a])) return !1;
    }
    return !0;
  }
  return t !== t && r !== r;
}, Ry = { exports: {} }, rn = Ry.exports = function(e, t, r) {
  typeof t == "function" && (r = t, t = {}), r = t.cb || r;
  var n = typeof r == "function" ? r : r.pre || function() {
  }, i = r.post || function() {
  };
  Za(t, n, i, e, "", e);
};
rn.keywords = {
  additionalItems: !0,
  items: !0,
  contains: !0,
  additionalProperties: !0,
  propertyNames: !0,
  not: !0,
  if: !0,
  then: !0,
  else: !0
};
rn.arrayKeywords = {
  items: !0,
  allOf: !0,
  anyOf: !0,
  oneOf: !0
};
rn.propsKeywords = {
  $defs: !0,
  definitions: !0,
  properties: !0,
  patternProperties: !0,
  dependencies: !0
};
rn.skipKeywords = {
  default: !0,
  enum: !0,
  const: !0,
  required: !0,
  maximum: !0,
  minimum: !0,
  exclusiveMaximum: !0,
  exclusiveMinimum: !0,
  multipleOf: !0,
  maxLength: !0,
  minLength: !0,
  pattern: !0,
  format: !0,
  maxItems: !0,
  minItems: !0,
  uniqueItems: !0,
  maxProperties: !0,
  minProperties: !0
};
function Za(e, t, r, n, i, s, a, o, c, u) {
  if (n && typeof n == "object" && !Array.isArray(n)) {
    t(n, i, s, a, o, c, u);
    for (var l in n) {
      var d = n[l];
      if (Array.isArray(d)) {
        if (l in rn.arrayKeywords)
          for (var h = 0; h < d.length; h++)
            Za(e, t, r, d[h], i + "/" + l + "/" + h, s, i, l, n, h);
      } else if (l in rn.propsKeywords) {
        if (d && typeof d == "object")
          for (var p in d)
            Za(e, t, r, d[p], i + "/" + l + "/" + Qw(p), s, i, l, n, p);
      } else (l in rn.keywords || e.allKeys && !(l in rn.skipKeywords)) && Za(e, t, r, d, i + "/" + l, s, i, l, n);
    }
    r(n, i, s, a, o, c, u);
  }
}
function Qw(e) {
  return e.replace(/~/g, "~0").replace(/\//g, "~1");
}
var Zw = Ry.exports;
Object.defineProperty(Xe, "__esModule", { value: !0 });
Xe.getSchemaRefs = Xe.resolveUrl = Xe.normalizeId = Xe._getFullPath = Xe.getFullPath = Xe.inlineRef = void 0;
const eE = K, tE = qo, rE = Zw, nE = /* @__PURE__ */ new Set([
  "type",
  "format",
  "pattern",
  "maxLength",
  "minLength",
  "maxProperties",
  "minProperties",
  "maxItems",
  "minItems",
  "maximum",
  "minimum",
  "uniqueItems",
  "multipleOf",
  "required",
  "enum",
  "const"
]);
function iE(e, t = !0) {
  return typeof e == "boolean" ? !0 : t === !0 ? !Rl(e) : t ? Iy(e) <= t : !1;
}
Xe.inlineRef = iE;
const sE = /* @__PURE__ */ new Set([
  "$ref",
  "$recursiveRef",
  "$recursiveAnchor",
  "$dynamicRef",
  "$dynamicAnchor"
]);
function Rl(e) {
  for (const t in e) {
    if (sE.has(t))
      return !0;
    const r = e[t];
    if (Array.isArray(r) && r.some(Rl) || typeof r == "object" && Rl(r))
      return !0;
  }
  return !1;
}
function Iy(e) {
  let t = 0;
  for (const r in e) {
    if (r === "$ref")
      return 1 / 0;
    if (t++, !nE.has(r) && (typeof e[r] == "object" && (0, eE.eachItem)(e[r], (n) => t += Iy(n)), t === 1 / 0))
      return 1 / 0;
  }
  return t;
}
function Dy(e, t = "", r) {
  r !== !1 && (t = Si(t));
  const n = e.parse(t);
  return ky(e, n);
}
Xe.getFullPath = Dy;
function ky(e, t) {
  return e.serialize(t).split("#")[0] + "#";
}
Xe._getFullPath = ky;
const aE = /#\/?$/;
function Si(e) {
  return e ? e.replace(aE, "") : "";
}
Xe.normalizeId = Si;
function oE(e, t, r) {
  return r = Si(r), e.resolve(t, r);
}
Xe.resolveUrl = oE;
const cE = /^[a-z_][-a-z0-9._]*$/i;
function lE(e, t) {
  if (typeof e == "boolean")
    return {};
  const { schemaId: r, uriResolver: n } = this.opts, i = Si(e[r] || t), s = { "": i }, a = Dy(n, i, !1), o = {}, c = /* @__PURE__ */ new Set();
  return rE(e, { allKeys: !0 }, (d, h, p, $) => {
    if ($ === void 0)
      return;
    const _ = a + h;
    let v = s[$];
    typeof d[r] == "string" && (v = m.call(this, d[r])), E.call(this, d.$anchor), E.call(this, d.$dynamicAnchor), s[h] = v;
    function m(T) {
      const R = this.opts.uriResolver.resolve;
      if (T = Si(v ? R(v, T) : T), c.has(T))
        throw l(T);
      c.add(T);
      let F = this.refs[T];
      return typeof F == "string" && (F = this.refs[F]), typeof F == "object" ? u(d, F.schema, T) : T !== Si(_) && (T[0] === "#" ? (u(d, o[T], T), o[T] = d) : this.refs[T] = _), T;
    }
    function E(T) {
      if (typeof T == "string") {
        if (!cE.test(T))
          throw new Error(`invalid anchor "${T}"`);
        m.call(this, `#${T}`);
      }
    }
  }), o;
  function u(d, h, p) {
    if (h !== void 0 && !tE(d, h))
      throw l(p);
  }
  function l(d) {
    return new Error(`reference "${d}" resolves to more than one schema`);
  }
}
Xe.getSchemaRefs = lE;
Object.defineProperty(tr, "__esModule", { value: !0 });
tr.getData = tr.KeywordCxt = tr.validateFunctionCode = void 0;
const Fy = Ci, uh = Me, gu = Or, po = Me, uE = Vo, ms = fr, Ic = on, Z = oe, re = kt, dE = Xe, Ar = K, rs = Ws;
function fE(e) {
  if (Uy(e) && (My(e), Ly(e))) {
    mE(e);
    return;
  }
  jy(e, () => (0, Fy.topBoolOrEmptySchema)(e));
}
tr.validateFunctionCode = fE;
function jy({ gen: e, validateName: t, schema: r, schemaEnv: n, opts: i }, s) {
  i.code.es5 ? e.func(t, (0, Z._)`${re.default.data}, ${re.default.valCxt}`, n.$async, () => {
    e.code((0, Z._)`"use strict"; ${dh(r, i)}`), pE(e, i), e.code(s);
  }) : e.func(t, (0, Z._)`${re.default.data}, ${hE(i)}`, n.$async, () => e.code(dh(r, i)).code(s));
}
function hE(e) {
  return (0, Z._)`{${re.default.instancePath}="", ${re.default.parentData}, ${re.default.parentDataProperty}, ${re.default.rootData}=${re.default.data}${e.dynamicRef ? (0, Z._)`, ${re.default.dynamicAnchors}={}` : Z.nil}}={}`;
}
function pE(e, t) {
  e.if(re.default.valCxt, () => {
    e.var(re.default.instancePath, (0, Z._)`${re.default.valCxt}.${re.default.instancePath}`), e.var(re.default.parentData, (0, Z._)`${re.default.valCxt}.${re.default.parentData}`), e.var(re.default.parentDataProperty, (0, Z._)`${re.default.valCxt}.${re.default.parentDataProperty}`), e.var(re.default.rootData, (0, Z._)`${re.default.valCxt}.${re.default.rootData}`), t.dynamicRef && e.var(re.default.dynamicAnchors, (0, Z._)`${re.default.valCxt}.${re.default.dynamicAnchors}`);
  }, () => {
    e.var(re.default.instancePath, (0, Z._)`""`), e.var(re.default.parentData, (0, Z._)`undefined`), e.var(re.default.parentDataProperty, (0, Z._)`undefined`), e.var(re.default.rootData, re.default.data), t.dynamicRef && e.var(re.default.dynamicAnchors, (0, Z._)`{}`);
  });
}
function mE(e) {
  const { schema: t, opts: r, gen: n } = e;
  jy(e, () => {
    r.$comment && t.$comment && Vy(e), $E(e), n.let(re.default.vErrors, null), n.let(re.default.errors, 0), r.unevaluated && yE(e), xy(e), bE(e);
  });
}
function yE(e) {
  const { gen: t, validateName: r } = e;
  e.evaluated = t.const("evaluated", (0, Z._)`${r}.evaluated`), t.if((0, Z._)`${e.evaluated}.dynamicProps`, () => t.assign((0, Z._)`${e.evaluated}.props`, (0, Z._)`undefined`)), t.if((0, Z._)`${e.evaluated}.dynamicItems`, () => t.assign((0, Z._)`${e.evaluated}.items`, (0, Z._)`undefined`));
}
function dh(e, t) {
  const r = typeof e == "object" && e[t.schemaId];
  return r && (t.code.source || t.code.process) ? (0, Z._)`/*# sourceURL=${r} */` : Z.nil;
}
function gE(e, t) {
  if (Uy(e) && (My(e), Ly(e))) {
    _E(e, t);
    return;
  }
  (0, Fy.boolOrEmptySchema)(e, t);
}
function Ly({ schema: e, self: t }) {
  if (typeof e == "boolean")
    return !e;
  for (const r in e)
    if (t.RULES.all[r])
      return !0;
  return !1;
}
function Uy(e) {
  return typeof e.schema != "boolean";
}
function _E(e, t) {
  const { schema: r, gen: n, opts: i } = e;
  i.$comment && r.$comment && Vy(e), wE(e), EE(e);
  const s = n.const("_errs", re.default.errors);
  xy(e, s), n.var(t, (0, Z._)`${s} === ${re.default.errors}`);
}
function My(e) {
  (0, Ar.checkUnknownRules)(e), vE(e);
}
function xy(e, t) {
  if (e.opts.jtd)
    return fh(e, [], !1, t);
  const r = (0, uh.getSchemaTypes)(e.schema), n = (0, uh.coerceAndCheckDataType)(e, r);
  fh(e, r, !n, t);
}
function vE(e) {
  const { schema: t, errSchemaPath: r, opts: n, self: i } = e;
  t.$ref && n.ignoreKeywordsWithRef && (0, Ar.schemaHasRulesButRef)(t, i.RULES) && i.logger.warn(`$ref: keywords ignored in schema at path "${r}"`);
}
function $E(e) {
  const { schema: t, opts: r } = e;
  t.default !== void 0 && r.useDefaults && r.strictSchema && (0, Ar.checkStrictMode)(e, "default is ignored in the schema root");
}
function wE(e) {
  const t = e.schema[e.opts.schemaId];
  t && (e.baseId = (0, dE.resolveUrl)(e.opts.uriResolver, e.baseId, t));
}
function EE(e) {
  if (e.schema.$async && !e.schemaEnv.$async)
    throw new Error("async schema in sync schema");
}
function Vy({ gen: e, schemaEnv: t, schema: r, errSchemaPath: n, opts: i }) {
  const s = r.$comment;
  if (i.$comment === !0)
    e.code((0, Z._)`${re.default.self}.logger.log(${s})`);
  else if (typeof i.$comment == "function") {
    const a = (0, Z.str)`${n}/$comment`, o = e.scopeValue("root", { ref: t.root });
    e.code((0, Z._)`${re.default.self}.opts.$comment(${s}, ${a}, ${o}.schema)`);
  }
}
function bE(e) {
  const { gen: t, schemaEnv: r, validateName: n, ValidationError: i, opts: s } = e;
  r.$async ? t.if((0, Z._)`${re.default.errors} === 0`, () => t.return(re.default.data), () => t.throw((0, Z._)`new ${i}(${re.default.vErrors})`)) : (t.assign((0, Z._)`${n}.errors`, re.default.vErrors), s.unevaluated && SE(e), t.return((0, Z._)`${re.default.errors} === 0`));
}
function SE({ gen: e, evaluated: t, props: r, items: n }) {
  r instanceof Z.Name && e.assign((0, Z._)`${t}.props`, r), n instanceof Z.Name && e.assign((0, Z._)`${t}.items`, n);
}
function fh(e, t, r, n) {
  const { gen: i, schema: s, data: a, allErrors: o, opts: c, self: u } = e, { RULES: l } = u;
  if (s.$ref && (c.ignoreKeywordsWithRef || !(0, Ar.schemaHasRulesButRef)(s, l))) {
    i.block(() => Hy(e, "$ref", l.all.$ref.definition));
    return;
  }
  c.jtd || PE(e, t), i.block(() => {
    for (const h of l.rules)
      d(h);
    d(l.post);
  });
  function d(h) {
    (0, gu.shouldUseGroup)(s, h) && (h.type ? (i.if((0, po.checkDataType)(h.type, a, c.strictNumbers)), hh(e, h), t.length === 1 && t[0] === h.type && r && (i.else(), (0, po.reportTypeError)(e)), i.endIf()) : hh(e, h), o || i.if((0, Z._)`${re.default.errors} === ${n || 0}`));
  }
}
function hh(e, t) {
  const { gen: r, schema: n, opts: { useDefaults: i } } = e;
  i && (0, uE.assignDefaults)(e, t.type), r.block(() => {
    for (const s of t.rules)
      (0, gu.shouldUseRule)(n, s) && Hy(e, s.keyword, s.definition, t.type);
  });
}
function PE(e, t) {
  e.schemaEnv.meta || !e.opts.strictTypes || (TE(e, t), e.opts.allowUnionTypes || NE(e, t), OE(e, e.dataTypes));
}
function TE(e, t) {
  if (t.length) {
    if (!e.dataTypes.length) {
      e.dataTypes = t;
      return;
    }
    t.forEach((r) => {
      qy(e.dataTypes, r) || _u(e, `type "${r}" not allowed by context "${e.dataTypes.join(",")}"`);
    }), CE(e, t);
  }
}
function NE(e, t) {
  t.length > 1 && !(t.length === 2 && t.includes("null")) && _u(e, "use allowUnionTypes to allow union type keyword");
}
function OE(e, t) {
  const r = e.self.RULES.all;
  for (const n in r) {
    const i = r[n];
    if (typeof i == "object" && (0, gu.shouldUseRule)(e.schema, i)) {
      const { type: s } = i.definition;
      s.length && !s.some((a) => AE(t, a)) && _u(e, `missing type "${s.join(",")}" for keyword "${n}"`);
    }
  }
}
function AE(e, t) {
  return e.includes(t) || t === "number" && e.includes("integer");
}
function qy(e, t) {
  return e.includes(t) || t === "integer" && e.includes("number");
}
function CE(e, t) {
  const r = [];
  for (const n of e.dataTypes)
    qy(t, n) ? r.push(n) : t.includes("integer") && n === "number" && r.push("integer");
  e.dataTypes = r;
}
function _u(e, t) {
  const r = e.schemaEnv.baseId + e.errSchemaPath;
  t += ` at "${r}" (strictTypes)`, (0, Ar.checkStrictMode)(e, t, e.opts.strictTypes);
}
let By = class {
  constructor(t, r, n) {
    if ((0, ms.validateKeywordUsage)(t, r, n), this.gen = t.gen, this.allErrors = t.allErrors, this.keyword = n, this.data = t.data, this.schema = t.schema[n], this.$data = r.$data && t.opts.$data && this.schema && this.schema.$data, this.schemaValue = (0, Ar.schemaRefOrVal)(t, this.schema, n, this.$data), this.schemaType = r.schemaType, this.parentSchema = t.schema, this.params = {}, this.it = t, this.def = r, this.$data)
      this.schemaCode = t.gen.const("vSchema", Gy(this.$data, t));
    else if (this.schemaCode = this.schemaValue, !(0, ms.validSchemaType)(this.schema, r.schemaType, r.allowUndefined))
      throw new Error(`${n} value must be ${JSON.stringify(r.schemaType)}`);
    ("code" in r ? r.trackErrors : r.errors !== !1) && (this.errsCount = t.gen.const("_errs", re.default.errors));
  }
  result(t, r, n) {
    this.failResult((0, Z.not)(t), r, n);
  }
  failResult(t, r, n) {
    this.gen.if(t), n ? n() : this.error(), r ? (this.gen.else(), r(), this.allErrors && this.gen.endIf()) : this.allErrors ? this.gen.endIf() : this.gen.else();
  }
  pass(t, r) {
    this.failResult((0, Z.not)(t), void 0, r);
  }
  fail(t) {
    if (t === void 0) {
      this.error(), this.allErrors || this.gen.if(!1);
      return;
    }
    this.gen.if(t), this.error(), this.allErrors ? this.gen.endIf() : this.gen.else();
  }
  fail$data(t) {
    if (!this.$data)
      return this.fail(t);
    const { schemaCode: r } = this;
    this.fail((0, Z._)`${r} !== undefined && (${(0, Z.or)(this.invalid$data(), t)})`);
  }
  error(t, r, n) {
    if (r) {
      this.setParams(r), this._error(t, n), this.setParams({});
      return;
    }
    this._error(t, n);
  }
  _error(t, r) {
    (t ? rs.reportExtraError : rs.reportError)(this, this.def.error, r);
  }
  $dataError() {
    (0, rs.reportError)(this, this.def.$dataError || rs.keyword$DataError);
  }
  reset() {
    if (this.errsCount === void 0)
      throw new Error('add "trackErrors" to keyword definition');
    (0, rs.resetErrorsCount)(this.gen, this.errsCount);
  }
  ok(t) {
    this.allErrors || this.gen.if(t);
  }
  setParams(t, r) {
    r ? Object.assign(this.params, t) : this.params = t;
  }
  block$data(t, r, n = Z.nil) {
    this.gen.block(() => {
      this.check$data(t, n), r();
    });
  }
  check$data(t = Z.nil, r = Z.nil) {
    if (!this.$data)
      return;
    const { gen: n, schemaCode: i, schemaType: s, def: a } = this;
    n.if((0, Z.or)((0, Z._)`${i} === undefined`, r)), t !== Z.nil && n.assign(t, !0), (s.length || a.validateSchema) && (n.elseIf(this.invalid$data()), this.$dataError(), t !== Z.nil && n.assign(t, !1)), n.else();
  }
  invalid$data() {
    const { gen: t, schemaCode: r, schemaType: n, def: i, it: s } = this;
    return (0, Z.or)(a(), o());
    function a() {
      if (n.length) {
        if (!(r instanceof Z.Name))
          throw new Error("ajv implementation error");
        const c = Array.isArray(n) ? n : [n];
        return (0, Z._)`${(0, po.checkDataTypes)(c, r, s.opts.strictNumbers, po.DataType.Wrong)}`;
      }
      return Z.nil;
    }
    function o() {
      if (i.validateSchema) {
        const c = t.scopeValue("validate$data", { ref: i.validateSchema });
        return (0, Z._)`!${c}(${r})`;
      }
      return Z.nil;
    }
  }
  subschema(t, r) {
    const n = (0, Ic.getSubschema)(this.it, t);
    (0, Ic.extendSubschemaData)(n, this.it, t), (0, Ic.extendSubschemaMode)(n, t);
    const i = { ...this.it, ...n, items: void 0, props: void 0 };
    return gE(i, r), i;
  }
  mergeEvaluated(t, r) {
    const { it: n, gen: i } = this;
    n.opts.unevaluated && (n.props !== !0 && t.props !== void 0 && (n.props = Ar.mergeEvaluated.props(i, t.props, n.props, r)), n.items !== !0 && t.items !== void 0 && (n.items = Ar.mergeEvaluated.items(i, t.items, n.items, r)));
  }
  mergeValidEvaluated(t, r) {
    const { it: n, gen: i } = this;
    if (n.opts.unevaluated && (n.props !== !0 || n.items !== !0))
      return i.if(r, () => this.mergeEvaluated(t, Z.Name)), !0;
  }
};
tr.KeywordCxt = By;
function Hy(e, t, r, n) {
  const i = new By(e, r, t);
  "code" in r ? r.code(i, n) : i.$data && r.validate ? (0, ms.funcKeywordCode)(i, r) : "macro" in r ? (0, ms.macroKeywordCode)(i, r) : (r.compile || r.validate) && (0, ms.funcKeywordCode)(i, r);
}
const RE = /^\/(?:[^~]|~0|~1)*$/, IE = /^([0-9]+)(#|\/(?:[^~]|~0|~1)*)?$/;
function Gy(e, { dataLevel: t, dataNames: r, dataPathArr: n }) {
  let i, s;
  if (e === "")
    return re.default.rootData;
  if (e[0] === "/") {
    if (!RE.test(e))
      throw new Error(`Invalid JSON-pointer: ${e}`);
    i = e, s = re.default.rootData;
  } else {
    const u = IE.exec(e);
    if (!u)
      throw new Error(`Invalid JSON-pointer: ${e}`);
    const l = +u[1];
    if (i = u[2], i === "#") {
      if (l >= t)
        throw new Error(c("property/index", l));
      return n[t - l];
    }
    if (l > t)
      throw new Error(c("data", l));
    if (s = r[t - l], !i)
      return s;
  }
  let a = s;
  const o = i.split("/");
  for (const u of o)
    u && (s = (0, Z._)`${s}${(0, Z.getProperty)((0, Ar.unescapeJsonPointer)(u))}`, a = (0, Z._)`${a} && ${s}`);
  return a;
  function c(u, l) {
    return `Cannot access ${u} ${l} levels up, current level is ${t}`;
  }
}
tr.getData = Gy;
var Ys = {};
Object.defineProperty(Ys, "__esModule", { value: !0 });
let DE = class extends Error {
  constructor(t) {
    super("validation failed"), this.errors = t, this.ajv = this.validation = !0;
  }
};
Ys.default = DE;
var Ui = {};
Object.defineProperty(Ui, "__esModule", { value: !0 });
const Dc = Xe;
let kE = class extends Error {
  constructor(t, r, n, i) {
    super(i || `can't resolve reference ${n} from id ${r}`), this.missingRef = (0, Dc.resolveUrl)(t, r, n), this.missingSchema = (0, Dc.normalizeId)((0, Dc.getFullPath)(t, this.missingRef));
  }
};
Ui.default = kE;
var pt = {};
Object.defineProperty(pt, "__esModule", { value: !0 });
pt.resolveSchema = pt.getCompilingSchema = pt.resolveRef = pt.compileSchema = pt.SchemaEnv = void 0;
const Gt = oe, FE = Ys, Pn = kt, Zt = Xe, ph = K, jE = tr;
let Bo = class {
  constructor(t) {
    var r;
    this.refs = {}, this.dynamicAnchors = {};
    let n;
    typeof t.schema == "object" && (n = t.schema), this.schema = t.schema, this.schemaId = t.schemaId, this.root = t.root || this, this.baseId = (r = t.baseId) !== null && r !== void 0 ? r : (0, Zt.normalizeId)(n == null ? void 0 : n[t.schemaId || "$id"]), this.schemaPath = t.schemaPath, this.localRefs = t.localRefs, this.meta = t.meta, this.$async = n == null ? void 0 : n.$async, this.refs = {};
  }
};
pt.SchemaEnv = Bo;
function vu(e) {
  const t = zy.call(this, e);
  if (t)
    return t;
  const r = (0, Zt.getFullPath)(this.opts.uriResolver, e.root.baseId), { es5: n, lines: i } = this.opts.code, { ownProperties: s } = this.opts, a = new Gt.CodeGen(this.scope, { es5: n, lines: i, ownProperties: s });
  let o;
  e.$async && (o = a.scopeValue("Error", {
    ref: FE.default,
    code: (0, Gt._)`require("ajv/dist/runtime/validation_error").default`
  }));
  const c = a.scopeName("validate");
  e.validateName = c;
  const u = {
    gen: a,
    allErrors: this.opts.allErrors,
    data: Pn.default.data,
    parentData: Pn.default.parentData,
    parentDataProperty: Pn.default.parentDataProperty,
    dataNames: [Pn.default.data],
    dataPathArr: [Gt.nil],
    // TODO can its length be used as dataLevel if nil is removed?
    dataLevel: 0,
    dataTypes: [],
    definedProperties: /* @__PURE__ */ new Set(),
    topSchemaRef: a.scopeValue("schema", this.opts.code.source === !0 ? { ref: e.schema, code: (0, Gt.stringify)(e.schema) } : { ref: e.schema }),
    validateName: c,
    ValidationError: o,
    schema: e.schema,
    schemaEnv: e,
    rootId: r,
    baseId: e.baseId || r,
    schemaPath: Gt.nil,
    errSchemaPath: e.schemaPath || (this.opts.jtd ? "" : "#"),
    errorPath: (0, Gt._)`""`,
    opts: this.opts,
    self: this
  };
  let l;
  try {
    this._compilations.add(e), (0, jE.validateFunctionCode)(u), a.optimize(this.opts.code.optimize);
    const d = a.toString();
    l = `${a.scopeRefs(Pn.default.scope)}return ${d}`, this.opts.code.process && (l = this.opts.code.process(l, e));
    const p = new Function(`${Pn.default.self}`, `${Pn.default.scope}`, l)(this, this.scope.get());
    if (this.scope.value(c, { ref: p }), p.errors = null, p.schema = e.schema, p.schemaEnv = e, e.$async && (p.$async = !0), this.opts.code.source === !0 && (p.source = { validateName: c, validateCode: d, scopeValues: a._values }), this.opts.unevaluated) {
      const { props: $, items: _ } = u;
      p.evaluated = {
        props: $ instanceof Gt.Name ? void 0 : $,
        items: _ instanceof Gt.Name ? void 0 : _,
        dynamicProps: $ instanceof Gt.Name,
        dynamicItems: _ instanceof Gt.Name
      }, p.source && (p.source.evaluated = (0, Gt.stringify)(p.evaluated));
    }
    return e.validate = p, e;
  } catch (d) {
    throw delete e.validate, delete e.validateName, l && this.logger.error("Error compiling schema, function code:", l), d;
  } finally {
    this._compilations.delete(e);
  }
}
pt.compileSchema = vu;
function LE(e, t, r) {
  var n;
  r = (0, Zt.resolveUrl)(this.opts.uriResolver, t, r);
  const i = e.refs[r];
  if (i)
    return i;
  let s = xE.call(this, e, r);
  if (s === void 0) {
    const a = (n = e.localRefs) === null || n === void 0 ? void 0 : n[r], { schemaId: o } = this.opts;
    a && (s = new Bo({ schema: a, schemaId: o, root: e, baseId: t }));
  }
  if (s !== void 0)
    return e.refs[r] = UE.call(this, s);
}
pt.resolveRef = LE;
function UE(e) {
  return (0, Zt.inlineRef)(e.schema, this.opts.inlineRefs) ? e.schema : e.validate ? e : vu.call(this, e);
}
function zy(e) {
  for (const t of this._compilations)
    if (ME(t, e))
      return t;
}
pt.getCompilingSchema = zy;
function ME(e, t) {
  return e.schema === t.schema && e.root === t.root && e.baseId === t.baseId;
}
function xE(e, t) {
  let r;
  for (; typeof (r = this.refs[t]) == "string"; )
    t = r;
  return r || this.schemas[t] || Ho.call(this, e, t);
}
function Ho(e, t) {
  const r = this.opts.uriResolver.parse(t), n = (0, Zt._getFullPath)(this.opts.uriResolver, r);
  let i = (0, Zt.getFullPath)(this.opts.uriResolver, e.baseId, void 0);
  if (Object.keys(e.schema).length > 0 && n === i)
    return kc.call(this, r, e);
  const s = (0, Zt.normalizeId)(n), a = this.refs[s] || this.schemas[s];
  if (typeof a == "string") {
    const o = Ho.call(this, e, a);
    return typeof (o == null ? void 0 : o.schema) != "object" ? void 0 : kc.call(this, r, o);
  }
  if (typeof (a == null ? void 0 : a.schema) == "object") {
    if (a.validate || vu.call(this, a), s === (0, Zt.normalizeId)(t)) {
      const { schema: o } = a, { schemaId: c } = this.opts, u = o[c];
      return u && (i = (0, Zt.resolveUrl)(this.opts.uriResolver, i, u)), new Bo({ schema: o, schemaId: c, root: e, baseId: i });
    }
    return kc.call(this, r, a);
  }
}
pt.resolveSchema = Ho;
const VE = /* @__PURE__ */ new Set([
  "properties",
  "patternProperties",
  "enum",
  "dependencies",
  "definitions"
]);
function kc(e, { baseId: t, schema: r, root: n }) {
  var i;
  if (((i = e.fragment) === null || i === void 0 ? void 0 : i[0]) !== "/")
    return;
  for (const o of e.fragment.slice(1).split("/")) {
    if (typeof r == "boolean")
      return;
    const c = r[(0, ph.unescapeFragment)(o)];
    if (c === void 0)
      return;
    r = c;
    const u = typeof r == "object" && r[this.opts.schemaId];
    !VE.has(o) && u && (t = (0, Zt.resolveUrl)(this.opts.uriResolver, t, u));
  }
  let s;
  if (typeof r != "boolean" && r.$ref && !(0, ph.schemaHasRulesButRef)(r, this.RULES)) {
    const o = (0, Zt.resolveUrl)(this.opts.uriResolver, t, r.$ref);
    s = Ho.call(this, n, o);
  }
  const { schemaId: a } = this.opts;
  if (s = s || new Bo({ schema: r, schemaId: a, root: n, baseId: t }), s.schema !== s.root.schema)
    return s;
}
const qE = "https://raw.githubusercontent.com/ajv-validator/ajv/master/lib/refs/data.json#", BE = "Meta-schema for $data reference (JSON AnySchema extension proposal)", HE = "object", GE = [
  "$data"
], zE = {
  $data: {
    type: "string",
    anyOf: [
      {
        format: "relative-json-pointer"
      },
      {
        format: "json-pointer"
      }
    ]
  }
}, KE = !1, WE = {
  $id: qE,
  description: BE,
  type: HE,
  required: GE,
  properties: zE,
  additionalProperties: KE
};
var $u = {}, Go = { exports: {} };
const YE = RegExp.prototype.test.bind(/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/iu), Ky = RegExp.prototype.test.bind(/^(?:(?:25[0-5]|2[0-4]\d|1\d{2}|[1-9]\d|\d)\.){3}(?:25[0-5]|2[0-4]\d|1\d{2}|[1-9]\d|\d)$/u);
function Wy(e) {
  let t = "", r = 0, n = 0;
  for (n = 0; n < e.length; n++)
    if (r = e[n].charCodeAt(0), r !== 48) {
      if (!(r >= 48 && r <= 57 || r >= 65 && r <= 70 || r >= 97 && r <= 102))
        return "";
      t += e[n];
      break;
    }
  for (n += 1; n < e.length; n++) {
    if (r = e[n].charCodeAt(0), !(r >= 48 && r <= 57 || r >= 65 && r <= 70 || r >= 97 && r <= 102))
      return "";
    t += e[n];
  }
  return t;
}
const XE = RegExp.prototype.test.bind(/[^!"$&'()*+,\-.;=_`a-z{}~]/u);
function mh(e) {
  return e.length = 0, !0;
}
function JE(e, t, r) {
  if (e.length) {
    const n = Wy(e);
    if (n !== "")
      t.push(n);
    else
      return r.error = !0, !1;
    e.length = 0;
  }
  return !0;
}
function QE(e) {
  let t = 0;
  const r = { error: !1, address: "", zone: "" }, n = [], i = [];
  let s = !1, a = !1, o = JE;
  for (let c = 0; c < e.length; c++) {
    const u = e[c];
    if (!(u === "[" || u === "]"))
      if (u === ":") {
        if (s === !0 && (a = !0), !o(i, n, r))
          break;
        if (++t > 7) {
          r.error = !0;
          break;
        }
        c > 0 && e[c - 1] === ":" && (s = !0), n.push(":");
        continue;
      } else if (u === "%") {
        if (!o(i, n, r))
          break;
        o = mh;
      } else {
        i.push(u);
        continue;
      }
  }
  return i.length && (o === mh ? r.zone = i.join("") : a ? n.push(i.join("")) : n.push(Wy(i))), r.address = n.join(""), r;
}
function Yy(e) {
  if (ZE(e, ":") < 2)
    return { host: e, isIPV6: !1 };
  const t = QE(e);
  if (t.error)
    return { host: e, isIPV6: !1 };
  {
    let r = t.address, n = t.address;
    return t.zone && (r += "%" + t.zone, n += "%25" + t.zone), { host: r, isIPV6: !0, escapedHost: n };
  }
}
function ZE(e, t) {
  let r = 0;
  for (let n = 0; n < e.length; n++)
    e[n] === t && r++;
  return r;
}
function eb(e) {
  let t = e;
  const r = [];
  let n = -1, i = 0;
  for (; i = t.length; ) {
    if (i === 1) {
      if (t === ".")
        break;
      if (t === "/") {
        r.push("/");
        break;
      } else {
        r.push(t);
        break;
      }
    } else if (i === 2) {
      if (t[0] === ".") {
        if (t[1] === ".")
          break;
        if (t[1] === "/") {
          t = t.slice(2);
          continue;
        }
      } else if (t[0] === "/" && (t[1] === "." || t[1] === "/")) {
        r.push("/");
        break;
      }
    } else if (i === 3 && t === "/..") {
      r.length !== 0 && r.pop(), r.push("/");
      break;
    }
    if (t[0] === ".") {
      if (t[1] === ".") {
        if (t[2] === "/") {
          t = t.slice(3);
          continue;
        }
      } else if (t[1] === "/") {
        t = t.slice(2);
        continue;
      }
    } else if (t[0] === "/" && t[1] === ".") {
      if (t[2] === "/") {
        t = t.slice(2);
        continue;
      } else if (t[2] === "." && t[3] === "/") {
        t = t.slice(3), r.length !== 0 && r.pop();
        continue;
      }
    }
    if ((n = t.indexOf("/", 1)) === -1) {
      r.push(t);
      break;
    } else
      r.push(t.slice(0, n)), t = t.slice(n);
  }
  return r.join("");
}
function tb(e, t) {
  const r = t !== !0 ? escape : unescape;
  return e.scheme !== void 0 && (e.scheme = r(e.scheme)), e.userinfo !== void 0 && (e.userinfo = r(e.userinfo)), e.host !== void 0 && (e.host = r(e.host)), e.path !== void 0 && (e.path = r(e.path)), e.query !== void 0 && (e.query = r(e.query)), e.fragment !== void 0 && (e.fragment = r(e.fragment)), e;
}
function rb(e) {
  const t = [];
  if (e.userinfo !== void 0 && (t.push(e.userinfo), t.push("@")), e.host !== void 0) {
    let r = unescape(e.host);
    if (!Ky(r)) {
      const n = Yy(r);
      n.isIPV6 === !0 ? r = `[${n.escapedHost}]` : r = e.host;
    }
    t.push(r);
  }
  return (typeof e.port == "number" || typeof e.port == "string") && (t.push(":"), t.push(String(e.port))), t.length ? t.join("") : void 0;
}
var Xy = {
  nonSimpleDomain: XE,
  recomposeAuthority: rb,
  normalizeComponentEncoding: tb,
  removeDotSegments: eb,
  isIPv4: Ky,
  isUUID: YE,
  normalizeIPv6: Yy
};
const { isUUID: nb } = Xy, ib = /([\da-z][\d\-a-z]{0,31}):((?:[\w!$'()*+,\-.:;=@]|%[\da-f]{2})+)/iu;
function Jy(e) {
  return e.secure === !0 ? !0 : e.secure === !1 ? !1 : e.scheme ? e.scheme.length === 3 && (e.scheme[0] === "w" || e.scheme[0] === "W") && (e.scheme[1] === "s" || e.scheme[1] === "S") && (e.scheme[2] === "s" || e.scheme[2] === "S") : !1;
}
function Qy(e) {
  return e.host || (e.error = e.error || "HTTP URIs must have a host."), e;
}
function Zy(e) {
  const t = String(e.scheme).toLowerCase() === "https";
  return (e.port === (t ? 443 : 80) || e.port === "") && (e.port = void 0), e.path || (e.path = "/"), e;
}
function sb(e) {
  return e.secure = Jy(e), e.resourceName = (e.path || "/") + (e.query ? "?" + e.query : ""), e.path = void 0, e.query = void 0, e;
}
function ab(e) {
  if ((e.port === (Jy(e) ? 443 : 80) || e.port === "") && (e.port = void 0), typeof e.secure == "boolean" && (e.scheme = e.secure ? "wss" : "ws", e.secure = void 0), e.resourceName) {
    const [t, r] = e.resourceName.split("?");
    e.path = t && t !== "/" ? t : void 0, e.query = r, e.resourceName = void 0;
  }
  return e.fragment = void 0, e;
}
function ob(e, t) {
  if (!e.path)
    return e.error = "URN can not be parsed", e;
  const r = e.path.match(ib);
  if (r) {
    const n = t.scheme || e.scheme || "urn";
    e.nid = r[1].toLowerCase(), e.nss = r[2];
    const i = `${n}:${t.nid || e.nid}`, s = wu(i);
    e.path = void 0, s && (e = s.parse(e, t));
  } else
    e.error = e.error || "URN can not be parsed.";
  return e;
}
function cb(e, t) {
  if (e.nid === void 0)
    throw new Error("URN without nid cannot be serialized");
  const r = t.scheme || e.scheme || "urn", n = e.nid.toLowerCase(), i = `${r}:${t.nid || n}`, s = wu(i);
  s && (e = s.serialize(e, t));
  const a = e, o = e.nss;
  return a.path = `${n || t.nid}:${o}`, t.skipEscape = !0, a;
}
function lb(e, t) {
  const r = e;
  return r.uuid = r.nss, r.nss = void 0, !t.tolerant && (!r.uuid || !nb(r.uuid)) && (r.error = r.error || "UUID is not valid."), r;
}
function ub(e) {
  const t = e;
  return t.nss = (e.uuid || "").toLowerCase(), t;
}
const eg = (
  /** @type {SchemeHandler} */
  {
    scheme: "http",
    domainHost: !0,
    parse: Qy,
    serialize: Zy
  }
), db = (
  /** @type {SchemeHandler} */
  {
    scheme: "https",
    domainHost: eg.domainHost,
    parse: Qy,
    serialize: Zy
  }
), eo = (
  /** @type {SchemeHandler} */
  {
    scheme: "ws",
    domainHost: !0,
    parse: sb,
    serialize: ab
  }
), fb = (
  /** @type {SchemeHandler} */
  {
    scheme: "wss",
    domainHost: eo.domainHost,
    parse: eo.parse,
    serialize: eo.serialize
  }
), hb = (
  /** @type {SchemeHandler} */
  {
    scheme: "urn",
    parse: ob,
    serialize: cb,
    skipNormalize: !0
  }
), pb = (
  /** @type {SchemeHandler} */
  {
    scheme: "urn:uuid",
    parse: lb,
    serialize: ub,
    skipNormalize: !0
  }
), mo = (
  /** @type {Record<SchemeName, SchemeHandler>} */
  {
    http: eg,
    https: db,
    ws: eo,
    wss: fb,
    urn: hb,
    "urn:uuid": pb
  }
);
Object.setPrototypeOf(mo, null);
function wu(e) {
  return e && (mo[
    /** @type {SchemeName} */
    e
  ] || mo[
    /** @type {SchemeName} */
    e.toLowerCase()
  ]) || void 0;
}
var mb = {
  SCHEMES: mo,
  getSchemeHandler: wu
};
const { normalizeIPv6: yb, removeDotSegments: us, recomposeAuthority: gb, normalizeComponentEncoding: wa, isIPv4: _b, nonSimpleDomain: vb } = Xy, { SCHEMES: $b, getSchemeHandler: tg } = mb;
function wb(e, t) {
  return typeof e == "string" ? e = /** @type {T} */
  hr(Dr(e, t), t) : typeof e == "object" && (e = /** @type {T} */
  Dr(hr(e, t), t)), e;
}
function Eb(e, t, r) {
  const n = r ? Object.assign({ scheme: "null" }, r) : { scheme: "null" }, i = rg(Dr(e, n), Dr(t, n), n, !0);
  return n.skipEscape = !0, hr(i, n);
}
function rg(e, t, r, n) {
  const i = {};
  return n || (e = Dr(hr(e, r), r), t = Dr(hr(t, r), r)), r = r || {}, !r.tolerant && t.scheme ? (i.scheme = t.scheme, i.userinfo = t.userinfo, i.host = t.host, i.port = t.port, i.path = us(t.path || ""), i.query = t.query) : (t.userinfo !== void 0 || t.host !== void 0 || t.port !== void 0 ? (i.userinfo = t.userinfo, i.host = t.host, i.port = t.port, i.path = us(t.path || ""), i.query = t.query) : (t.path ? (t.path[0] === "/" ? i.path = us(t.path) : ((e.userinfo !== void 0 || e.host !== void 0 || e.port !== void 0) && !e.path ? i.path = "/" + t.path : e.path ? i.path = e.path.slice(0, e.path.lastIndexOf("/") + 1) + t.path : i.path = t.path, i.path = us(i.path)), i.query = t.query) : (i.path = e.path, t.query !== void 0 ? i.query = t.query : i.query = e.query), i.userinfo = e.userinfo, i.host = e.host, i.port = e.port), i.scheme = e.scheme), i.fragment = t.fragment, i;
}
function bb(e, t, r) {
  return typeof e == "string" ? (e = unescape(e), e = hr(wa(Dr(e, r), !0), { ...r, skipEscape: !0 })) : typeof e == "object" && (e = hr(wa(e, !0), { ...r, skipEscape: !0 })), typeof t == "string" ? (t = unescape(t), t = hr(wa(Dr(t, r), !0), { ...r, skipEscape: !0 })) : typeof t == "object" && (t = hr(wa(t, !0), { ...r, skipEscape: !0 })), e.toLowerCase() === t.toLowerCase();
}
function hr(e, t) {
  const r = {
    host: e.host,
    scheme: e.scheme,
    userinfo: e.userinfo,
    port: e.port,
    path: e.path,
    query: e.query,
    nid: e.nid,
    nss: e.nss,
    uuid: e.uuid,
    fragment: e.fragment,
    reference: e.reference,
    resourceName: e.resourceName,
    secure: e.secure,
    error: ""
  }, n = Object.assign({}, t), i = [], s = tg(n.scheme || r.scheme);
  s && s.serialize && s.serialize(r, n), r.path !== void 0 && (n.skipEscape ? r.path = unescape(r.path) : (r.path = escape(r.path), r.scheme !== void 0 && (r.path = r.path.split("%3A").join(":")))), n.reference !== "suffix" && r.scheme && i.push(r.scheme, ":");
  const a = gb(r);
  if (a !== void 0 && (n.reference !== "suffix" && i.push("//"), i.push(a), r.path && r.path[0] !== "/" && i.push("/")), r.path !== void 0) {
    let o = r.path;
    !n.absolutePath && (!s || !s.absolutePath) && (o = us(o)), a === void 0 && o[0] === "/" && o[1] === "/" && (o = "/%2F" + o.slice(2)), i.push(o);
  }
  return r.query !== void 0 && i.push("?", r.query), r.fragment !== void 0 && i.push("#", r.fragment), i.join("");
}
const Sb = /^(?:([^#/:?]+):)?(?:\/\/((?:([^#/?@]*)@)?(\[[^#/?\]]+\]|[^#/:?]*)(?::(\d*))?))?([^#?]*)(?:\?([^#]*))?(?:#((?:.|[\n\r])*))?/u;
function Dr(e, t) {
  const r = Object.assign({}, t), n = {
    scheme: void 0,
    userinfo: void 0,
    host: "",
    port: void 0,
    path: "",
    query: void 0,
    fragment: void 0
  };
  let i = !1;
  r.reference === "suffix" && (r.scheme ? e = r.scheme + ":" + e : e = "//" + e);
  const s = e.match(Sb);
  if (s) {
    if (n.scheme = s[1], n.userinfo = s[3], n.host = s[4], n.port = parseInt(s[5], 10), n.path = s[6] || "", n.query = s[7], n.fragment = s[8], isNaN(n.port) && (n.port = s[5]), n.host)
      if (_b(n.host) === !1) {
        const c = yb(n.host);
        n.host = c.host.toLowerCase(), i = c.isIPV6;
      } else
        i = !0;
    n.scheme === void 0 && n.userinfo === void 0 && n.host === void 0 && n.port === void 0 && n.query === void 0 && !n.path ? n.reference = "same-document" : n.scheme === void 0 ? n.reference = "relative" : n.fragment === void 0 ? n.reference = "absolute" : n.reference = "uri", r.reference && r.reference !== "suffix" && r.reference !== n.reference && (n.error = n.error || "URI is not a " + r.reference + " reference.");
    const a = tg(r.scheme || n.scheme);
    if (!r.unicodeSupport && (!a || !a.unicodeSupport) && n.host && (r.domainHost || a && a.domainHost) && i === !1 && vb(n.host))
      try {
        n.host = URL.domainToASCII(n.host.toLowerCase());
      } catch (o) {
        n.error = n.error || "Host's domain name can not be converted to ASCII: " + o;
      }
    (!a || a && !a.skipNormalize) && (e.indexOf("%") !== -1 && (n.scheme !== void 0 && (n.scheme = unescape(n.scheme)), n.host !== void 0 && (n.host = unescape(n.host))), n.path && (n.path = escape(unescape(n.path))), n.fragment && (n.fragment = encodeURI(decodeURIComponent(n.fragment)))), a && a.parse && a.parse(n, r);
  } else
    n.error = n.error || "URI can not be parsed.";
  return n;
}
const Eu = {
  SCHEMES: $b,
  normalize: wb,
  resolve: Eb,
  resolveComponent: rg,
  equal: bb,
  serialize: hr,
  parse: Dr
};
Go.exports = Eu;
Go.exports.default = Eu;
Go.exports.fastUri = Eu;
var ng = Go.exports;
Object.defineProperty($u, "__esModule", { value: !0 });
const ig = ng;
ig.code = 'require("ajv/dist/runtime/uri").default';
$u.default = ig;
(function(e) {
  Object.defineProperty(e, "__esModule", { value: !0 }), e.CodeGen = e.Name = e.nil = e.stringify = e.str = e._ = e.KeywordCxt = void 0;
  var t = tr;
  Object.defineProperty(e, "KeywordCxt", { enumerable: !0, get: function() {
    return t.KeywordCxt;
  } });
  var r = oe;
  Object.defineProperty(e, "_", { enumerable: !0, get: function() {
    return r._;
  } }), Object.defineProperty(e, "str", { enumerable: !0, get: function() {
    return r.str;
  } }), Object.defineProperty(e, "stringify", { enumerable: !0, get: function() {
    return r.stringify;
  } }), Object.defineProperty(e, "nil", { enumerable: !0, get: function() {
    return r.nil;
  } }), Object.defineProperty(e, "Name", { enumerable: !0, get: function() {
    return r.Name;
  } }), Object.defineProperty(e, "CodeGen", { enumerable: !0, get: function() {
    return r.CodeGen;
  } });
  const n = Ys, i = Ui, s = Hn, a = pt, o = oe, c = Xe, u = Me, l = K, d = WE, h = $u, p = (I, b) => new RegExp(I, b);
  p.code = "new RegExp";
  const $ = ["removeAdditional", "useDefaults", "coerceTypes"], _ = /* @__PURE__ */ new Set([
    "validate",
    "serialize",
    "parse",
    "wrapper",
    "root",
    "schema",
    "keyword",
    "pattern",
    "formats",
    "validate$data",
    "func",
    "obj",
    "Error"
  ]), v = {
    errorDataPath: "",
    format: "`validateFormats: false` can be used instead.",
    nullable: '"nullable" keyword is supported by default.',
    jsonPointers: "Deprecated jsPropertySyntax can be used instead.",
    extendRefs: "Deprecated ignoreKeywordsWithRef can be used instead.",
    missingRefs: "Pass empty schema with $id that should be ignored to ajv.addSchema.",
    processCode: "Use option `code: {process: (code, schemaEnv: object) => string}`",
    sourceCode: "Use option `code: {source: true}`",
    strictDefaults: "It is default now, see option `strict`.",
    strictKeywords: "It is default now, see option `strict`.",
    uniqueItems: '"uniqueItems" keyword is always validated.',
    unknownFormats: "Disable strict mode or pass `true` to `ajv.addFormat` (or `formats` option).",
    cache: "Map is used as cache, schema object as key.",
    serialize: "Map is used as cache, schema object as key.",
    ajvErrors: "It is default now."
  }, m = {
    ignoreKeywordsWithRef: "",
    jsPropertySyntax: "",
    unicode: '"minLength"/"maxLength" account for unicode characters by default.'
  }, E = 200;
  function T(I) {
    var b, O, S, f, g, N, w, y, k, A, W, fe, ge, be, Ne, et, _e, Le, Bt, Ft, At, jt, _r, vr, $r;
    const Ct = I.strict, Lt = (b = I.code) === null || b === void 0 ? void 0 : b.optimize, wr = Lt === !0 || Lt === void 0 ? 1 : Lt || 0, jr = (S = (O = I.code) === null || O === void 0 ? void 0 : O.regExp) !== null && S !== void 0 ? S : p, Et = (f = I.uriResolver) !== null && f !== void 0 ? f : h.default;
    return {
      strictSchema: (N = (g = I.strictSchema) !== null && g !== void 0 ? g : Ct) !== null && N !== void 0 ? N : !0,
      strictNumbers: (y = (w = I.strictNumbers) !== null && w !== void 0 ? w : Ct) !== null && y !== void 0 ? y : !0,
      strictTypes: (A = (k = I.strictTypes) !== null && k !== void 0 ? k : Ct) !== null && A !== void 0 ? A : "log",
      strictTuples: (fe = (W = I.strictTuples) !== null && W !== void 0 ? W : Ct) !== null && fe !== void 0 ? fe : "log",
      strictRequired: (be = (ge = I.strictRequired) !== null && ge !== void 0 ? ge : Ct) !== null && be !== void 0 ? be : !1,
      code: I.code ? { ...I.code, optimize: wr, regExp: jr } : { optimize: wr, regExp: jr },
      loopRequired: (Ne = I.loopRequired) !== null && Ne !== void 0 ? Ne : E,
      loopEnum: (et = I.loopEnum) !== null && et !== void 0 ? et : E,
      meta: (_e = I.meta) !== null && _e !== void 0 ? _e : !0,
      messages: (Le = I.messages) !== null && Le !== void 0 ? Le : !0,
      inlineRefs: (Bt = I.inlineRefs) !== null && Bt !== void 0 ? Bt : !0,
      schemaId: (Ft = I.schemaId) !== null && Ft !== void 0 ? Ft : "$id",
      addUsedSchema: (At = I.addUsedSchema) !== null && At !== void 0 ? At : !0,
      validateSchema: (jt = I.validateSchema) !== null && jt !== void 0 ? jt : !0,
      validateFormats: (_r = I.validateFormats) !== null && _r !== void 0 ? _r : !0,
      unicodeRegExp: (vr = I.unicodeRegExp) !== null && vr !== void 0 ? vr : !0,
      int32range: ($r = I.int32range) !== null && $r !== void 0 ? $r : !0,
      uriResolver: Et
    };
  }
  class R {
    constructor(b = {}) {
      this.schemas = {}, this.refs = {}, this.formats = {}, this._compilations = /* @__PURE__ */ new Set(), this._loading = {}, this._cache = /* @__PURE__ */ new Map(), b = this.opts = { ...b, ...T(b) };
      const { es5: O, lines: S } = this.opts.code;
      this.scope = new o.ValueScope({ scope: {}, prefixes: _, es5: O, lines: S }), this.logger = V(b.logger);
      const f = b.validateFormats;
      b.validateFormats = !1, this.RULES = (0, s.getRules)(), F.call(this, v, b, "NOT SUPPORTED"), F.call(this, m, b, "DEPRECATED", "warn"), this._metaOpts = J.call(this), b.formats && ie.call(this), this._addVocabularies(), this._addDefaultMetaSchema(), b.keywords && C.call(this, b.keywords), typeof b.meta == "object" && this.addMetaSchema(b.meta), G.call(this), b.validateFormats = f;
    }
    _addVocabularies() {
      this.addKeyword("$async");
    }
    _addDefaultMetaSchema() {
      const { $data: b, meta: O, schemaId: S } = this.opts;
      let f = d;
      S === "id" && (f = { ...d }, f.id = f.$id, delete f.$id), O && b && this.addMetaSchema(f, f[S], !1);
    }
    defaultMeta() {
      const { meta: b, schemaId: O } = this.opts;
      return this.opts.defaultMeta = typeof b == "object" ? b[O] || b : void 0;
    }
    validate(b, O) {
      let S;
      if (typeof b == "string") {
        if (S = this.getSchema(b), !S)
          throw new Error(`no schema with key or ref "${b}"`);
      } else
        S = this.compile(b);
      const f = S(O);
      return "$async" in S || (this.errors = S.errors), f;
    }
    compile(b, O) {
      const S = this._addSchema(b, O);
      return S.validate || this._compileSchemaEnv(S);
    }
    compileAsync(b, O) {
      if (typeof this.opts.loadSchema != "function")
        throw new Error("options.loadSchema should be a function");
      const { loadSchema: S } = this.opts;
      return f.call(this, b, O);
      async function f(A, W) {
        await g.call(this, A.$schema);
        const fe = this._addSchema(A, W);
        return fe.validate || N.call(this, fe);
      }
      async function g(A) {
        A && !this.getSchema(A) && await f.call(this, { $ref: A }, !0);
      }
      async function N(A) {
        try {
          return this._compileSchemaEnv(A);
        } catch (W) {
          if (!(W instanceof i.default))
            throw W;
          return w.call(this, W), await y.call(this, W.missingSchema), N.call(this, A);
        }
      }
      function w({ missingSchema: A, missingRef: W }) {
        if (this.refs[A])
          throw new Error(`AnySchema ${A} is loaded but ${W} cannot be resolved`);
      }
      async function y(A) {
        const W = await k.call(this, A);
        this.refs[A] || await g.call(this, W.$schema), this.refs[A] || this.addSchema(W, A, O);
      }
      async function k(A) {
        const W = this._loading[A];
        if (W)
          return W;
        try {
          return await (this._loading[A] = S(A));
        } finally {
          delete this._loading[A];
        }
      }
    }
    // Adds schema to the instance
    addSchema(b, O, S, f = this.opts.validateSchema) {
      if (Array.isArray(b)) {
        for (const N of b)
          this.addSchema(N, void 0, S, f);
        return this;
      }
      let g;
      if (typeof b == "object") {
        const { schemaId: N } = this.opts;
        if (g = b[N], g !== void 0 && typeof g != "string")
          throw new Error(`schema ${N} must be string`);
      }
      return O = (0, c.normalizeId)(O || g), this._checkUnique(O), this.schemas[O] = this._addSchema(b, S, O, f, !0), this;
    }
    // Add schema that will be used to validate other schemas
    // options in META_IGNORE_OPTIONS are alway set to false
    addMetaSchema(b, O, S = this.opts.validateSchema) {
      return this.addSchema(b, O, !0, S), this;
    }
    //  Validate schema against its meta-schema
    validateSchema(b, O) {
      if (typeof b == "boolean")
        return !0;
      let S;
      if (S = b.$schema, S !== void 0 && typeof S != "string")
        throw new Error("$schema must be a string");
      if (S = S || this.opts.defaultMeta || this.defaultMeta(), !S)
        return this.logger.warn("meta-schema not available"), this.errors = null, !0;
      const f = this.validate(S, b);
      if (!f && O) {
        const g = "schema is invalid: " + this.errorsText();
        if (this.opts.validateSchema === "log")
          this.logger.error(g);
        else
          throw new Error(g);
      }
      return f;
    }
    // Get compiled schema by `key` or `ref`.
    // (`key` that was passed to `addSchema` or full schema reference - `schema.$id` or resolved id)
    getSchema(b) {
      let O;
      for (; typeof (O = H.call(this, b)) == "string"; )
        b = O;
      if (O === void 0) {
        const { schemaId: S } = this.opts, f = new a.SchemaEnv({ schema: {}, schemaId: S });
        if (O = a.resolveSchema.call(this, f, b), !O)
          return;
        this.refs[b] = O;
      }
      return O.validate || this._compileSchemaEnv(O);
    }
    // Remove cached schema(s).
    // If no parameter is passed all schemas but meta-schemas are removed.
    // If RegExp is passed all schemas with key/id matching pattern but meta-schemas are removed.
    // Even if schema is referenced by other schemas it still can be removed as other schemas have local references.
    removeSchema(b) {
      if (b instanceof RegExp)
        return this._removeAllSchemas(this.schemas, b), this._removeAllSchemas(this.refs, b), this;
      switch (typeof b) {
        case "undefined":
          return this._removeAllSchemas(this.schemas), this._removeAllSchemas(this.refs), this._cache.clear(), this;
        case "string": {
          const O = H.call(this, b);
          return typeof O == "object" && this._cache.delete(O.schema), delete this.schemas[b], delete this.refs[b], this;
        }
        case "object": {
          const O = b;
          this._cache.delete(O);
          let S = b[this.opts.schemaId];
          return S && (S = (0, c.normalizeId)(S), delete this.schemas[S], delete this.refs[S]), this;
        }
        default:
          throw new Error("ajv.removeSchema: invalid parameter");
      }
    }
    // add "vocabulary" - a collection of keywords
    addVocabulary(b) {
      for (const O of b)
        this.addKeyword(O);
      return this;
    }
    addKeyword(b, O) {
      let S;
      if (typeof b == "string")
        S = b, typeof O == "object" && (this.logger.warn("these parameters are deprecated, see docs for addKeyword"), O.keyword = S);
      else if (typeof b == "object" && O === void 0) {
        if (O = b, S = O.keyword, Array.isArray(S) && !S.length)
          throw new Error("addKeywords: keyword must be string or non-empty array");
      } else
        throw new Error("invalid addKeywords parameters");
      if (L.call(this, S, O), !O)
        return (0, l.eachItem)(S, (g) => U.call(this, g)), this;
      M.call(this, O);
      const f = {
        ...O,
        type: (0, u.getJSONTypes)(O.type),
        schemaType: (0, u.getJSONTypes)(O.schemaType)
      };
      return (0, l.eachItem)(S, f.type.length === 0 ? (g) => U.call(this, g, f) : (g) => f.type.forEach((N) => U.call(this, g, f, N))), this;
    }
    getKeyword(b) {
      const O = this.RULES.all[b];
      return typeof O == "object" ? O.definition : !!O;
    }
    // Remove keyword
    removeKeyword(b) {
      const { RULES: O } = this;
      delete O.keywords[b], delete O.all[b];
      for (const S of O.rules) {
        const f = S.rules.findIndex((g) => g.keyword === b);
        f >= 0 && S.rules.splice(f, 1);
      }
      return this;
    }
    // Add format
    addFormat(b, O) {
      return typeof O == "string" && (O = new RegExp(O)), this.formats[b] = O, this;
    }
    errorsText(b = this.errors, { separator: O = ", ", dataVar: S = "data" } = {}) {
      return !b || b.length === 0 ? "No errors" : b.map((f) => `${S}${f.instancePath} ${f.message}`).reduce((f, g) => f + O + g);
    }
    $dataMetaSchema(b, O) {
      const S = this.RULES.all;
      b = JSON.parse(JSON.stringify(b));
      for (const f of O) {
        const g = f.split("/").slice(1);
        let N = b;
        for (const w of g)
          N = N[w];
        for (const w in S) {
          const y = S[w];
          if (typeof y != "object")
            continue;
          const { $data: k } = y.definition, A = N[w];
          k && A && (N[w] = q(A));
        }
      }
      return b;
    }
    _removeAllSchemas(b, O) {
      for (const S in b) {
        const f = b[S];
        (!O || O.test(S)) && (typeof f == "string" ? delete b[S] : f && !f.meta && (this._cache.delete(f.schema), delete b[S]));
      }
    }
    _addSchema(b, O, S, f = this.opts.validateSchema, g = this.opts.addUsedSchema) {
      let N;
      const { schemaId: w } = this.opts;
      if (typeof b == "object")
        N = b[w];
      else {
        if (this.opts.jtd)
          throw new Error("schema must be object");
        if (typeof b != "boolean")
          throw new Error("schema must be object or boolean");
      }
      let y = this._cache.get(b);
      if (y !== void 0)
        return y;
      S = (0, c.normalizeId)(N || S);
      const k = c.getSchemaRefs.call(this, b, S);
      return y = new a.SchemaEnv({ schema: b, schemaId: w, meta: O, baseId: S, localRefs: k }), this._cache.set(y.schema, y), g && !S.startsWith("#") && (S && this._checkUnique(S), this.refs[S] = y), f && this.validateSchema(b, !0), y;
    }
    _checkUnique(b) {
      if (this.schemas[b] || this.refs[b])
        throw new Error(`schema with key or id "${b}" already exists`);
    }
    _compileSchemaEnv(b) {
      if (b.meta ? this._compileMetaSchema(b) : a.compileSchema.call(this, b), !b.validate)
        throw new Error("ajv implementation error");
      return b.validate;
    }
    _compileMetaSchema(b) {
      const O = this.opts;
      this.opts = this._metaOpts;
      try {
        a.compileSchema.call(this, b);
      } finally {
        this.opts = O;
      }
    }
  }
  R.ValidationError = n.default, R.MissingRefError = i.default, e.default = R;
  function F(I, b, O, S = "error") {
    for (const f in I) {
      const g = f;
      g in b && this.logger[S](`${O}: option ${f}. ${I[g]}`);
    }
  }
  function H(I) {
    return I = (0, c.normalizeId)(I), this.schemas[I] || this.refs[I];
  }
  function G() {
    const I = this.opts.schemas;
    if (I)
      if (Array.isArray(I))
        this.addSchema(I);
      else
        for (const b in I)
          this.addSchema(I[b], b);
  }
  function ie() {
    for (const I in this.opts.formats) {
      const b = this.opts.formats[I];
      b && this.addFormat(I, b);
    }
  }
  function C(I) {
    if (Array.isArray(I)) {
      this.addVocabulary(I);
      return;
    }
    this.logger.warn("keywords option as map is deprecated, pass array");
    for (const b in I) {
      const O = I[b];
      O.keyword || (O.keyword = b), this.addKeyword(O);
    }
  }
  function J() {
    const I = { ...this.opts };
    for (const b of $)
      delete I[b];
    return I;
  }
  const j = { log() {
  }, warn() {
  }, error() {
  } };
  function V(I) {
    if (I === !1)
      return j;
    if (I === void 0)
      return console;
    if (I.log && I.warn && I.error)
      return I;
    throw new Error("logger must implement log, warn and error methods");
  }
  const Q = /^[a-z_$][a-z0-9_$:-]*$/i;
  function L(I, b) {
    const { RULES: O } = this;
    if ((0, l.eachItem)(I, (S) => {
      if (O.keywords[S])
        throw new Error(`Keyword ${S} is already defined`);
      if (!Q.test(S))
        throw new Error(`Keyword ${S} has invalid name`);
    }), !!b && b.$data && !("code" in b || "validate" in b))
      throw new Error('$data keyword must have "code" or "validate" function');
  }
  function U(I, b, O) {
    var S;
    const f = b == null ? void 0 : b.post;
    if (O && f)
      throw new Error('keyword with "post" flag cannot have "type"');
    const { RULES: g } = this;
    let N = f ? g.post : g.rules.find(({ type: y }) => y === O);
    if (N || (N = { type: O, rules: [] }, g.rules.push(N)), g.keywords[I] = !0, !b)
      return;
    const w = {
      keyword: I,
      definition: {
        ...b,
        type: (0, u.getJSONTypes)(b.type),
        schemaType: (0, u.getJSONTypes)(b.schemaType)
      }
    };
    b.before ? B.call(this, N, w, b.before) : N.rules.push(w), g.all[I] = w, (S = b.implements) === null || S === void 0 || S.forEach((y) => this.addKeyword(y));
  }
  function B(I, b, O) {
    const S = I.rules.findIndex((f) => f.keyword === O);
    S >= 0 ? I.rules.splice(S, 0, b) : (I.rules.push(b), this.logger.warn(`rule ${O} is not defined`));
  }
  function M(I) {
    let { metaSchema: b } = I;
    b !== void 0 && (I.$data && this.opts.$data && (b = q(b)), I.validateSchema = this.compile(b, !0));
  }
  const z = {
    $ref: "https://raw.githubusercontent.com/ajv-validator/ajv/master/lib/refs/data.json#"
  };
  function q(I) {
    return { anyOf: [I, z] };
  }
})(my);
var bu = {}, Su = {}, Pu = {};
Object.defineProperty(Pu, "__esModule", { value: !0 });
const Pb = {
  keyword: "id",
  code() {
    throw new Error('NOT SUPPORTED: keyword "id", use "$id" for schema ID');
  }
};
Pu.default = Pb;
var kr = {};
Object.defineProperty(kr, "__esModule", { value: !0 });
kr.callRef = kr.getValidate = void 0;
const Tb = Ui, yh = pe, St = oe, ti = kt, gh = pt, Ea = K, Nb = {
  keyword: "$ref",
  schemaType: "string",
  code(e) {
    const { gen: t, schema: r, it: n } = e, { baseId: i, schemaEnv: s, validateName: a, opts: o, self: c } = n, { root: u } = s;
    if ((r === "#" || r === "#/") && i === u.baseId)
      return d();
    const l = gh.resolveRef.call(c, u, i, r);
    if (l === void 0)
      throw new Tb.default(n.opts.uriResolver, i, r);
    if (l instanceof gh.SchemaEnv)
      return h(l);
    return p(l);
    function d() {
      if (s === u)
        return to(e, a, s, s.$async);
      const $ = t.scopeValue("root", { ref: u });
      return to(e, (0, St._)`${$}.validate`, u, u.$async);
    }
    function h($) {
      const _ = sg(e, $);
      to(e, _, $, $.$async);
    }
    function p($) {
      const _ = t.scopeValue("schema", o.code.source === !0 ? { ref: $, code: (0, St.stringify)($) } : { ref: $ }), v = t.name("valid"), m = e.subschema({
        schema: $,
        dataTypes: [],
        schemaPath: St.nil,
        topSchemaRef: _,
        errSchemaPath: r
      }, v);
      e.mergeEvaluated(m), e.ok(v);
    }
  }
};
function sg(e, t) {
  const { gen: r } = e;
  return t.validate ? r.scopeValue("validate", { ref: t.validate }) : (0, St._)`${r.scopeValue("wrapper", { ref: t })}.validate`;
}
kr.getValidate = sg;
function to(e, t, r, n) {
  const { gen: i, it: s } = e, { allErrors: a, schemaEnv: o, opts: c } = s, u = c.passContext ? ti.default.this : St.nil;
  n ? l() : d();
  function l() {
    if (!o.$async)
      throw new Error("async schema referenced by sync schema");
    const $ = i.let("valid");
    i.try(() => {
      i.code((0, St._)`await ${(0, yh.callValidateCode)(e, t, u)}`), p(t), a || i.assign($, !0);
    }, (_) => {
      i.if((0, St._)`!(${_} instanceof ${s.ValidationError})`, () => i.throw(_)), h(_), a || i.assign($, !1);
    }), e.ok($);
  }
  function d() {
    e.result((0, yh.callValidateCode)(e, t, u), () => p(t), () => h(t));
  }
  function h($) {
    const _ = (0, St._)`${$}.errors`;
    i.assign(ti.default.vErrors, (0, St._)`${ti.default.vErrors} === null ? ${_} : ${ti.default.vErrors}.concat(${_})`), i.assign(ti.default.errors, (0, St._)`${ti.default.vErrors}.length`);
  }
  function p($) {
    var _;
    if (!s.opts.unevaluated)
      return;
    const v = (_ = r == null ? void 0 : r.validate) === null || _ === void 0 ? void 0 : _.evaluated;
    if (s.props !== !0)
      if (v && !v.dynamicProps)
        v.props !== void 0 && (s.props = Ea.mergeEvaluated.props(i, v.props, s.props));
      else {
        const m = i.var("props", (0, St._)`${$}.evaluated.props`);
        s.props = Ea.mergeEvaluated.props(i, m, s.props, St.Name);
      }
    if (s.items !== !0)
      if (v && !v.dynamicItems)
        v.items !== void 0 && (s.items = Ea.mergeEvaluated.items(i, v.items, s.items));
      else {
        const m = i.var("items", (0, St._)`${$}.evaluated.items`);
        s.items = Ea.mergeEvaluated.items(i, m, s.items, St.Name);
      }
  }
}
kr.callRef = to;
kr.default = Nb;
Object.defineProperty(Su, "__esModule", { value: !0 });
const Ob = Pu, Ab = kr, Cb = [
  "$schema",
  "$id",
  "$defs",
  "$vocabulary",
  { keyword: "$comment" },
  "definitions",
  Ob.default,
  Ab.default
];
Su.default = Cb;
var Tu = {}, Nu = {};
Object.defineProperty(Nu, "__esModule", { value: !0 });
const yo = oe, Hr = yo.operators, go = {
  maximum: { okStr: "<=", ok: Hr.LTE, fail: Hr.GT },
  minimum: { okStr: ">=", ok: Hr.GTE, fail: Hr.LT },
  exclusiveMaximum: { okStr: "<", ok: Hr.LT, fail: Hr.GTE },
  exclusiveMinimum: { okStr: ">", ok: Hr.GT, fail: Hr.LTE }
}, Rb = {
  message: ({ keyword: e, schemaCode: t }) => (0, yo.str)`must be ${go[e].okStr} ${t}`,
  params: ({ keyword: e, schemaCode: t }) => (0, yo._)`{comparison: ${go[e].okStr}, limit: ${t}}`
}, Ib = {
  keyword: Object.keys(go),
  type: "number",
  schemaType: "number",
  $data: !0,
  error: Rb,
  code(e) {
    const { keyword: t, data: r, schemaCode: n } = e;
    e.fail$data((0, yo._)`${r} ${go[t].fail} ${n} || isNaN(${r})`);
  }
};
Nu.default = Ib;
var Ou = {};
Object.defineProperty(Ou, "__esModule", { value: !0 });
const ys = oe, Db = {
  message: ({ schemaCode: e }) => (0, ys.str)`must be multiple of ${e}`,
  params: ({ schemaCode: e }) => (0, ys._)`{multipleOf: ${e}}`
}, kb = {
  keyword: "multipleOf",
  type: "number",
  schemaType: "number",
  $data: !0,
  error: Db,
  code(e) {
    const { gen: t, data: r, schemaCode: n, it: i } = e, s = i.opts.multipleOfPrecision, a = t.let("res"), o = s ? (0, ys._)`Math.abs(Math.round(${a}) - ${a}) > 1e-${s}` : (0, ys._)`${a} !== parseInt(${a})`;
    e.fail$data((0, ys._)`(${n} === 0 || (${a} = ${r}/${n}, ${o}))`);
  }
};
Ou.default = kb;
var Au = {}, Cu = {};
Object.defineProperty(Cu, "__esModule", { value: !0 });
function ag(e) {
  const t = e.length;
  let r = 0, n = 0, i;
  for (; n < t; )
    r++, i = e.charCodeAt(n++), i >= 55296 && i <= 56319 && n < t && (i = e.charCodeAt(n), (i & 64512) === 56320 && n++);
  return r;
}
Cu.default = ag;
ag.code = 'require("ajv/dist/runtime/ucs2length").default';
Object.defineProperty(Au, "__esModule", { value: !0 });
const Rn = oe, Fb = K, jb = Cu, Lb = {
  message({ keyword: e, schemaCode: t }) {
    const r = e === "maxLength" ? "more" : "fewer";
    return (0, Rn.str)`must NOT have ${r} than ${t} characters`;
  },
  params: ({ schemaCode: e }) => (0, Rn._)`{limit: ${e}}`
}, Ub = {
  keyword: ["maxLength", "minLength"],
  type: "string",
  schemaType: "number",
  $data: !0,
  error: Lb,
  code(e) {
    const { keyword: t, data: r, schemaCode: n, it: i } = e, s = t === "maxLength" ? Rn.operators.GT : Rn.operators.LT, a = i.opts.unicode === !1 ? (0, Rn._)`${r}.length` : (0, Rn._)`${(0, Fb.useFunc)(e.gen, jb.default)}(${r})`;
    e.fail$data((0, Rn._)`${a} ${s} ${n}`);
  }
};
Au.default = Ub;
var Ru = {};
Object.defineProperty(Ru, "__esModule", { value: !0 });
const Mb = pe, _o = oe, xb = {
  message: ({ schemaCode: e }) => (0, _o.str)`must match pattern "${e}"`,
  params: ({ schemaCode: e }) => (0, _o._)`{pattern: ${e}}`
}, Vb = {
  keyword: "pattern",
  type: "string",
  schemaType: "string",
  $data: !0,
  error: xb,
  code(e) {
    const { data: t, $data: r, schema: n, schemaCode: i, it: s } = e, a = s.opts.unicodeRegExp ? "u" : "", o = r ? (0, _o._)`(new RegExp(${i}, ${a}))` : (0, Mb.usePattern)(e, n);
    e.fail$data((0, _o._)`!${o}.test(${t})`);
  }
};
Ru.default = Vb;
var Iu = {};
Object.defineProperty(Iu, "__esModule", { value: !0 });
const gs = oe, qb = {
  message({ keyword: e, schemaCode: t }) {
    const r = e === "maxProperties" ? "more" : "fewer";
    return (0, gs.str)`must NOT have ${r} than ${t} properties`;
  },
  params: ({ schemaCode: e }) => (0, gs._)`{limit: ${e}}`
}, Bb = {
  keyword: ["maxProperties", "minProperties"],
  type: "object",
  schemaType: "number",
  $data: !0,
  error: qb,
  code(e) {
    const { keyword: t, data: r, schemaCode: n } = e, i = t === "maxProperties" ? gs.operators.GT : gs.operators.LT;
    e.fail$data((0, gs._)`Object.keys(${r}).length ${i} ${n}`);
  }
};
Iu.default = Bb;
var Du = {};
Object.defineProperty(Du, "__esModule", { value: !0 });
const ns = pe, _s = oe, Hb = K, Gb = {
  message: ({ params: { missingProperty: e } }) => (0, _s.str)`must have required property '${e}'`,
  params: ({ params: { missingProperty: e } }) => (0, _s._)`{missingProperty: ${e}}`
}, zb = {
  keyword: "required",
  type: "object",
  schemaType: "array",
  $data: !0,
  error: Gb,
  code(e) {
    const { gen: t, schema: r, schemaCode: n, data: i, $data: s, it: a } = e, { opts: o } = a;
    if (!s && r.length === 0)
      return;
    const c = r.length >= o.loopRequired;
    if (a.allErrors ? u() : l(), o.strictRequired) {
      const p = e.parentSchema.properties, { definedProperties: $ } = e.it;
      for (const _ of r)
        if ((p == null ? void 0 : p[_]) === void 0 && !$.has(_)) {
          const v = a.schemaEnv.baseId + a.errSchemaPath, m = `required property "${_}" is not defined at "${v}" (strictRequired)`;
          (0, Hb.checkStrictMode)(a, m, a.opts.strictRequired);
        }
    }
    function u() {
      if (c || s)
        e.block$data(_s.nil, d);
      else
        for (const p of r)
          (0, ns.checkReportMissingProp)(e, p);
    }
    function l() {
      const p = t.let("missing");
      if (c || s) {
        const $ = t.let("valid", !0);
        e.block$data($, () => h(p, $)), e.ok($);
      } else
        t.if((0, ns.checkMissingProp)(e, r, p)), (0, ns.reportMissingProp)(e, p), t.else();
    }
    function d() {
      t.forOf("prop", n, (p) => {
        e.setParams({ missingProperty: p }), t.if((0, ns.noPropertyInData)(t, i, p, o.ownProperties), () => e.error());
      });
    }
    function h(p, $) {
      e.setParams({ missingProperty: p }), t.forOf(p, n, () => {
        t.assign($, (0, ns.propertyInData)(t, i, p, o.ownProperties)), t.if((0, _s.not)($), () => {
          e.error(), t.break();
        });
      }, _s.nil);
    }
  }
};
Du.default = zb;
var ku = {};
Object.defineProperty(ku, "__esModule", { value: !0 });
const vs = oe, Kb = {
  message({ keyword: e, schemaCode: t }) {
    const r = e === "maxItems" ? "more" : "fewer";
    return (0, vs.str)`must NOT have ${r} than ${t} items`;
  },
  params: ({ schemaCode: e }) => (0, vs._)`{limit: ${e}}`
}, Wb = {
  keyword: ["maxItems", "minItems"],
  type: "array",
  schemaType: "number",
  $data: !0,
  error: Kb,
  code(e) {
    const { keyword: t, data: r, schemaCode: n } = e, i = t === "maxItems" ? vs.operators.GT : vs.operators.LT;
    e.fail$data((0, vs._)`${r}.length ${i} ${n}`);
  }
};
ku.default = Wb;
var Fu = {}, Xs = {};
Object.defineProperty(Xs, "__esModule", { value: !0 });
const og = qo;
og.code = 'require("ajv/dist/runtime/equal").default';
Xs.default = og;
Object.defineProperty(Fu, "__esModule", { value: !0 });
const Fc = Me, Ke = oe, Yb = K, Xb = Xs, Jb = {
  message: ({ params: { i: e, j: t } }) => (0, Ke.str)`must NOT have duplicate items (items ## ${t} and ${e} are identical)`,
  params: ({ params: { i: e, j: t } }) => (0, Ke._)`{i: ${e}, j: ${t}}`
}, Qb = {
  keyword: "uniqueItems",
  type: "array",
  schemaType: "boolean",
  $data: !0,
  error: Jb,
  code(e) {
    const { gen: t, data: r, $data: n, schema: i, parentSchema: s, schemaCode: a, it: o } = e;
    if (!n && !i)
      return;
    const c = t.let("valid"), u = s.items ? (0, Fc.getSchemaTypes)(s.items) : [];
    e.block$data(c, l, (0, Ke._)`${a} === false`), e.ok(c);
    function l() {
      const $ = t.let("i", (0, Ke._)`${r}.length`), _ = t.let("j");
      e.setParams({ i: $, j: _ }), t.assign(c, !0), t.if((0, Ke._)`${$} > 1`, () => (d() ? h : p)($, _));
    }
    function d() {
      return u.length > 0 && !u.some(($) => $ === "object" || $ === "array");
    }
    function h($, _) {
      const v = t.name("item"), m = (0, Fc.checkDataTypes)(u, v, o.opts.strictNumbers, Fc.DataType.Wrong), E = t.const("indices", (0, Ke._)`{}`);
      t.for((0, Ke._)`;${$}--;`, () => {
        t.let(v, (0, Ke._)`${r}[${$}]`), t.if(m, (0, Ke._)`continue`), u.length > 1 && t.if((0, Ke._)`typeof ${v} == "string"`, (0, Ke._)`${v} += "_"`), t.if((0, Ke._)`typeof ${E}[${v}] == "number"`, () => {
          t.assign(_, (0, Ke._)`${E}[${v}]`), e.error(), t.assign(c, !1).break();
        }).code((0, Ke._)`${E}[${v}] = ${$}`);
      });
    }
    function p($, _) {
      const v = (0, Yb.useFunc)(t, Xb.default), m = t.name("outer");
      t.label(m).for((0, Ke._)`;${$}--;`, () => t.for((0, Ke._)`${_} = ${$}; ${_}--;`, () => t.if((0, Ke._)`${v}(${r}[${$}], ${r}[${_}])`, () => {
        e.error(), t.assign(c, !1).break(m);
      })));
    }
  }
};
Fu.default = Qb;
var ju = {};
Object.defineProperty(ju, "__esModule", { value: !0 });
const Il = oe, Zb = K, eS = Xs, tS = {
  message: "must be equal to constant",
  params: ({ schemaCode: e }) => (0, Il._)`{allowedValue: ${e}}`
}, rS = {
  keyword: "const",
  $data: !0,
  error: tS,
  code(e) {
    const { gen: t, data: r, $data: n, schemaCode: i, schema: s } = e;
    n || s && typeof s == "object" ? e.fail$data((0, Il._)`!${(0, Zb.useFunc)(t, eS.default)}(${r}, ${i})`) : e.fail((0, Il._)`${s} !== ${r}`);
  }
};
ju.default = rS;
var Lu = {};
Object.defineProperty(Lu, "__esModule", { value: !0 });
const ds = oe, nS = K, iS = Xs, sS = {
  message: "must be equal to one of the allowed values",
  params: ({ schemaCode: e }) => (0, ds._)`{allowedValues: ${e}}`
}, aS = {
  keyword: "enum",
  schemaType: "array",
  $data: !0,
  error: sS,
  code(e) {
    const { gen: t, data: r, $data: n, schema: i, schemaCode: s, it: a } = e;
    if (!n && i.length === 0)
      throw new Error("enum must have non-empty array");
    const o = i.length >= a.opts.loopEnum;
    let c;
    const u = () => c ?? (c = (0, nS.useFunc)(t, iS.default));
    let l;
    if (o || n)
      l = t.let("valid"), e.block$data(l, d);
    else {
      if (!Array.isArray(i))
        throw new Error("ajv implementation error");
      const p = t.const("vSchema", s);
      l = (0, ds.or)(...i.map(($, _) => h(p, _)));
    }
    e.pass(l);
    function d() {
      t.assign(l, !1), t.forOf("v", s, (p) => t.if((0, ds._)`${u()}(${r}, ${p})`, () => t.assign(l, !0).break()));
    }
    function h(p, $) {
      const _ = i[$];
      return typeof _ == "object" && _ !== null ? (0, ds._)`${u()}(${r}, ${p}[${$}])` : (0, ds._)`${r} === ${_}`;
    }
  }
};
Lu.default = aS;
Object.defineProperty(Tu, "__esModule", { value: !0 });
const oS = Nu, cS = Ou, lS = Au, uS = Ru, dS = Iu, fS = Du, hS = ku, pS = Fu, mS = ju, yS = Lu, gS = [
  // number
  oS.default,
  cS.default,
  // string
  lS.default,
  uS.default,
  // object
  dS.default,
  fS.default,
  // array
  hS.default,
  pS.default,
  // any
  { keyword: "type", schemaType: ["string", "array"] },
  { keyword: "nullable", schemaType: "boolean" },
  mS.default,
  yS.default
];
Tu.default = gS;
var Uu = {}, Mi = {};
Object.defineProperty(Mi, "__esModule", { value: !0 });
Mi.validateAdditionalItems = void 0;
const In = oe, Dl = K, _S = {
  message: ({ params: { len: e } }) => (0, In.str)`must NOT have more than ${e} items`,
  params: ({ params: { len: e } }) => (0, In._)`{limit: ${e}}`
}, vS = {
  keyword: "additionalItems",
  type: "array",
  schemaType: ["boolean", "object"],
  before: "uniqueItems",
  error: _S,
  code(e) {
    const { parentSchema: t, it: r } = e, { items: n } = t;
    if (!Array.isArray(n)) {
      (0, Dl.checkStrictMode)(r, '"additionalItems" is ignored when "items" is not an array of schemas');
      return;
    }
    cg(e, n);
  }
};
function cg(e, t) {
  const { gen: r, schema: n, data: i, keyword: s, it: a } = e;
  a.items = !0;
  const o = r.const("len", (0, In._)`${i}.length`);
  if (n === !1)
    e.setParams({ len: t.length }), e.pass((0, In._)`${o} <= ${t.length}`);
  else if (typeof n == "object" && !(0, Dl.alwaysValidSchema)(a, n)) {
    const u = r.var("valid", (0, In._)`${o} <= ${t.length}`);
    r.if((0, In.not)(u), () => c(u)), e.ok(u);
  }
  function c(u) {
    r.forRange("i", t.length, o, (l) => {
      e.subschema({ keyword: s, dataProp: l, dataPropType: Dl.Type.Num }, u), a.allErrors || r.if((0, In.not)(u), () => r.break());
    });
  }
}
Mi.validateAdditionalItems = cg;
Mi.default = vS;
var Mu = {}, xi = {};
Object.defineProperty(xi, "__esModule", { value: !0 });
xi.validateTuple = void 0;
const _h = oe, ro = K, $S = pe, wS = {
  keyword: "items",
  type: "array",
  schemaType: ["object", "array", "boolean"],
  before: "uniqueItems",
  code(e) {
    const { schema: t, it: r } = e;
    if (Array.isArray(t))
      return lg(e, "additionalItems", t);
    r.items = !0, !(0, ro.alwaysValidSchema)(r, t) && e.ok((0, $S.validateArray)(e));
  }
};
function lg(e, t, r = e.schema) {
  const { gen: n, parentSchema: i, data: s, keyword: a, it: o } = e;
  l(i), o.opts.unevaluated && r.length && o.items !== !0 && (o.items = ro.mergeEvaluated.items(n, r.length, o.items));
  const c = n.name("valid"), u = n.const("len", (0, _h._)`${s}.length`);
  r.forEach((d, h) => {
    (0, ro.alwaysValidSchema)(o, d) || (n.if((0, _h._)`${u} > ${h}`, () => e.subschema({
      keyword: a,
      schemaProp: h,
      dataProp: h
    }, c)), e.ok(c));
  });
  function l(d) {
    const { opts: h, errSchemaPath: p } = o, $ = r.length, _ = $ === d.minItems && ($ === d.maxItems || d[t] === !1);
    if (h.strictTuples && !_) {
      const v = `"${a}" is ${$}-tuple, but minItems or maxItems/${t} are not specified or different at path "${p}"`;
      (0, ro.checkStrictMode)(o, v, h.strictTuples);
    }
  }
}
xi.validateTuple = lg;
xi.default = wS;
Object.defineProperty(Mu, "__esModule", { value: !0 });
const ES = xi, bS = {
  keyword: "prefixItems",
  type: "array",
  schemaType: ["array"],
  before: "uniqueItems",
  code: (e) => (0, ES.validateTuple)(e, "items")
};
Mu.default = bS;
var xu = {};
Object.defineProperty(xu, "__esModule", { value: !0 });
const vh = oe, SS = K, PS = pe, TS = Mi, NS = {
  message: ({ params: { len: e } }) => (0, vh.str)`must NOT have more than ${e} items`,
  params: ({ params: { len: e } }) => (0, vh._)`{limit: ${e}}`
}, OS = {
  keyword: "items",
  type: "array",
  schemaType: ["object", "boolean"],
  before: "uniqueItems",
  error: NS,
  code(e) {
    const { schema: t, parentSchema: r, it: n } = e, { prefixItems: i } = r;
    n.items = !0, !(0, SS.alwaysValidSchema)(n, t) && (i ? (0, TS.validateAdditionalItems)(e, i) : e.ok((0, PS.validateArray)(e)));
  }
};
xu.default = OS;
var Vu = {};
Object.defineProperty(Vu, "__esModule", { value: !0 });
const Vt = oe, ba = K, AS = {
  message: ({ params: { min: e, max: t } }) => t === void 0 ? (0, Vt.str)`must contain at least ${e} valid item(s)` : (0, Vt.str)`must contain at least ${e} and no more than ${t} valid item(s)`,
  params: ({ params: { min: e, max: t } }) => t === void 0 ? (0, Vt._)`{minContains: ${e}}` : (0, Vt._)`{minContains: ${e}, maxContains: ${t}}`
}, CS = {
  keyword: "contains",
  type: "array",
  schemaType: ["object", "boolean"],
  before: "uniqueItems",
  trackErrors: !0,
  error: AS,
  code(e) {
    const { gen: t, schema: r, parentSchema: n, data: i, it: s } = e;
    let a, o;
    const { minContains: c, maxContains: u } = n;
    s.opts.next ? (a = c === void 0 ? 1 : c, o = u) : a = 1;
    const l = t.const("len", (0, Vt._)`${i}.length`);
    if (e.setParams({ min: a, max: o }), o === void 0 && a === 0) {
      (0, ba.checkStrictMode)(s, '"minContains" == 0 without "maxContains": "contains" keyword ignored');
      return;
    }
    if (o !== void 0 && a > o) {
      (0, ba.checkStrictMode)(s, '"minContains" > "maxContains" is always invalid'), e.fail();
      return;
    }
    if ((0, ba.alwaysValidSchema)(s, r)) {
      let _ = (0, Vt._)`${l} >= ${a}`;
      o !== void 0 && (_ = (0, Vt._)`${_} && ${l} <= ${o}`), e.pass(_);
      return;
    }
    s.items = !0;
    const d = t.name("valid");
    o === void 0 && a === 1 ? p(d, () => t.if(d, () => t.break())) : a === 0 ? (t.let(d, !0), o !== void 0 && t.if((0, Vt._)`${i}.length > 0`, h)) : (t.let(d, !1), h()), e.result(d, () => e.reset());
    function h() {
      const _ = t.name("_valid"), v = t.let("count", 0);
      p(_, () => t.if(_, () => $(v)));
    }
    function p(_, v) {
      t.forRange("i", 0, l, (m) => {
        e.subschema({
          keyword: "contains",
          dataProp: m,
          dataPropType: ba.Type.Num,
          compositeRule: !0
        }, _), v();
      });
    }
    function $(_) {
      t.code((0, Vt._)`${_}++`), o === void 0 ? t.if((0, Vt._)`${_} >= ${a}`, () => t.assign(d, !0).break()) : (t.if((0, Vt._)`${_} > ${o}`, () => t.assign(d, !1).break()), a === 1 ? t.assign(d, !0) : t.if((0, Vt._)`${_} >= ${a}`, () => t.assign(d, !0)));
    }
  }
};
Vu.default = CS;
var zo = {};
(function(e) {
  Object.defineProperty(e, "__esModule", { value: !0 }), e.validateSchemaDeps = e.validatePropertyDeps = e.error = void 0;
  const t = oe, r = K, n = pe;
  e.error = {
    message: ({ params: { property: c, depsCount: u, deps: l } }) => {
      const d = u === 1 ? "property" : "properties";
      return (0, t.str)`must have ${d} ${l} when property ${c} is present`;
    },
    params: ({ params: { property: c, depsCount: u, deps: l, missingProperty: d } }) => (0, t._)`{property: ${c},
    missingProperty: ${d},
    depsCount: ${u},
    deps: ${l}}`
    // TODO change to reference
  };
  const i = {
    keyword: "dependencies",
    type: "object",
    schemaType: "object",
    error: e.error,
    code(c) {
      const [u, l] = s(c);
      a(c, u), o(c, l);
    }
  };
  function s({ schema: c }) {
    const u = {}, l = {};
    for (const d in c) {
      if (d === "__proto__")
        continue;
      const h = Array.isArray(c[d]) ? u : l;
      h[d] = c[d];
    }
    return [u, l];
  }
  function a(c, u = c.schema) {
    const { gen: l, data: d, it: h } = c;
    if (Object.keys(u).length === 0)
      return;
    const p = l.let("missing");
    for (const $ in u) {
      const _ = u[$];
      if (_.length === 0)
        continue;
      const v = (0, n.propertyInData)(l, d, $, h.opts.ownProperties);
      c.setParams({
        property: $,
        depsCount: _.length,
        deps: _.join(", ")
      }), h.allErrors ? l.if(v, () => {
        for (const m of _)
          (0, n.checkReportMissingProp)(c, m);
      }) : (l.if((0, t._)`${v} && (${(0, n.checkMissingProp)(c, _, p)})`), (0, n.reportMissingProp)(c, p), l.else());
    }
  }
  e.validatePropertyDeps = a;
  function o(c, u = c.schema) {
    const { gen: l, data: d, keyword: h, it: p } = c, $ = l.name("valid");
    for (const _ in u)
      (0, r.alwaysValidSchema)(p, u[_]) || (l.if(
        (0, n.propertyInData)(l, d, _, p.opts.ownProperties),
        () => {
          const v = c.subschema({ keyword: h, schemaProp: _ }, $);
          c.mergeValidEvaluated(v, $);
        },
        () => l.var($, !0)
        // TODO var
      ), c.ok($));
  }
  e.validateSchemaDeps = o, e.default = i;
})(zo);
var qu = {};
Object.defineProperty(qu, "__esModule", { value: !0 });
const ug = oe, RS = K, IS = {
  message: "property name must be valid",
  params: ({ params: e }) => (0, ug._)`{propertyName: ${e.propertyName}}`
}, DS = {
  keyword: "propertyNames",
  type: "object",
  schemaType: ["object", "boolean"],
  error: IS,
  code(e) {
    const { gen: t, schema: r, data: n, it: i } = e;
    if ((0, RS.alwaysValidSchema)(i, r))
      return;
    const s = t.name("valid");
    t.forIn("key", n, (a) => {
      e.setParams({ propertyName: a }), e.subschema({
        keyword: "propertyNames",
        data: a,
        dataTypes: ["string"],
        propertyName: a,
        compositeRule: !0
      }, s), t.if((0, ug.not)(s), () => {
        e.error(!0), i.allErrors || t.break();
      });
    }), e.ok(s);
  }
};
qu.default = DS;
var Ko = {};
Object.defineProperty(Ko, "__esModule", { value: !0 });
const Sa = pe, Yt = oe, kS = kt, Pa = K, FS = {
  message: "must NOT have additional properties",
  params: ({ params: e }) => (0, Yt._)`{additionalProperty: ${e.additionalProperty}}`
}, jS = {
  keyword: "additionalProperties",
  type: ["object"],
  schemaType: ["boolean", "object"],
  allowUndefined: !0,
  trackErrors: !0,
  error: FS,
  code(e) {
    const { gen: t, schema: r, parentSchema: n, data: i, errsCount: s, it: a } = e;
    if (!s)
      throw new Error("ajv implementation error");
    const { allErrors: o, opts: c } = a;
    if (a.props = !0, c.removeAdditional !== "all" && (0, Pa.alwaysValidSchema)(a, r))
      return;
    const u = (0, Sa.allSchemaProperties)(n.properties), l = (0, Sa.allSchemaProperties)(n.patternProperties);
    d(), e.ok((0, Yt._)`${s} === ${kS.default.errors}`);
    function d() {
      t.forIn("key", i, (v) => {
        !u.length && !l.length ? $(v) : t.if(h(v), () => $(v));
      });
    }
    function h(v) {
      let m;
      if (u.length > 8) {
        const E = (0, Pa.schemaRefOrVal)(a, n.properties, "properties");
        m = (0, Sa.isOwnProperty)(t, E, v);
      } else u.length ? m = (0, Yt.or)(...u.map((E) => (0, Yt._)`${v} === ${E}`)) : m = Yt.nil;
      return l.length && (m = (0, Yt.or)(m, ...l.map((E) => (0, Yt._)`${(0, Sa.usePattern)(e, E)}.test(${v})`))), (0, Yt.not)(m);
    }
    function p(v) {
      t.code((0, Yt._)`delete ${i}[${v}]`);
    }
    function $(v) {
      if (c.removeAdditional === "all" || c.removeAdditional && r === !1) {
        p(v);
        return;
      }
      if (r === !1) {
        e.setParams({ additionalProperty: v }), e.error(), o || t.break();
        return;
      }
      if (typeof r == "object" && !(0, Pa.alwaysValidSchema)(a, r)) {
        const m = t.name("valid");
        c.removeAdditional === "failing" ? (_(v, m, !1), t.if((0, Yt.not)(m), () => {
          e.reset(), p(v);
        })) : (_(v, m), o || t.if((0, Yt.not)(m), () => t.break()));
      }
    }
    function _(v, m, E) {
      const T = {
        keyword: "additionalProperties",
        dataProp: v,
        dataPropType: Pa.Type.Str
      };
      E === !1 && Object.assign(T, {
        compositeRule: !0,
        createErrors: !1,
        allErrors: !1
      }), e.subschema(T, m);
    }
  }
};
Ko.default = jS;
var Bu = {};
Object.defineProperty(Bu, "__esModule", { value: !0 });
const LS = tr, $h = pe, jc = K, wh = Ko, US = {
  keyword: "properties",
  type: "object",
  schemaType: "object",
  code(e) {
    const { gen: t, schema: r, parentSchema: n, data: i, it: s } = e;
    s.opts.removeAdditional === "all" && n.additionalProperties === void 0 && wh.default.code(new LS.KeywordCxt(s, wh.default, "additionalProperties"));
    const a = (0, $h.allSchemaProperties)(r);
    for (const d of a)
      s.definedProperties.add(d);
    s.opts.unevaluated && a.length && s.props !== !0 && (s.props = jc.mergeEvaluated.props(t, (0, jc.toHash)(a), s.props));
    const o = a.filter((d) => !(0, jc.alwaysValidSchema)(s, r[d]));
    if (o.length === 0)
      return;
    const c = t.name("valid");
    for (const d of o)
      u(d) ? l(d) : (t.if((0, $h.propertyInData)(t, i, d, s.opts.ownProperties)), l(d), s.allErrors || t.else().var(c, !0), t.endIf()), e.it.definedProperties.add(d), e.ok(c);
    function u(d) {
      return s.opts.useDefaults && !s.compositeRule && r[d].default !== void 0;
    }
    function l(d) {
      e.subschema({
        keyword: "properties",
        schemaProp: d,
        dataProp: d
      }, c);
    }
  }
};
Bu.default = US;
var Hu = {};
Object.defineProperty(Hu, "__esModule", { value: !0 });
const Eh = pe, Ta = oe, bh = K, Sh = K, MS = {
  keyword: "patternProperties",
  type: "object",
  schemaType: "object",
  code(e) {
    const { gen: t, schema: r, data: n, parentSchema: i, it: s } = e, { opts: a } = s, o = (0, Eh.allSchemaProperties)(r), c = o.filter((_) => (0, bh.alwaysValidSchema)(s, r[_]));
    if (o.length === 0 || c.length === o.length && (!s.opts.unevaluated || s.props === !0))
      return;
    const u = a.strictSchema && !a.allowMatchingProperties && i.properties, l = t.name("valid");
    s.props !== !0 && !(s.props instanceof Ta.Name) && (s.props = (0, Sh.evaluatedPropsToName)(t, s.props));
    const { props: d } = s;
    h();
    function h() {
      for (const _ of o)
        u && p(_), s.allErrors ? $(_) : (t.var(l, !0), $(_), t.if(l));
    }
    function p(_) {
      for (const v in u)
        new RegExp(_).test(v) && (0, bh.checkStrictMode)(s, `property ${v} matches pattern ${_} (use allowMatchingProperties)`);
    }
    function $(_) {
      t.forIn("key", n, (v) => {
        t.if((0, Ta._)`${(0, Eh.usePattern)(e, _)}.test(${v})`, () => {
          const m = c.includes(_);
          m || e.subschema({
            keyword: "patternProperties",
            schemaProp: _,
            dataProp: v,
            dataPropType: Sh.Type.Str
          }, l), s.opts.unevaluated && d !== !0 ? t.assign((0, Ta._)`${d}[${v}]`, !0) : !m && !s.allErrors && t.if((0, Ta.not)(l), () => t.break());
        });
      });
    }
  }
};
Hu.default = MS;
var Gu = {};
Object.defineProperty(Gu, "__esModule", { value: !0 });
const xS = K, VS = {
  keyword: "not",
  schemaType: ["object", "boolean"],
  trackErrors: !0,
  code(e) {
    const { gen: t, schema: r, it: n } = e;
    if ((0, xS.alwaysValidSchema)(n, r)) {
      e.fail();
      return;
    }
    const i = t.name("valid");
    e.subschema({
      keyword: "not",
      compositeRule: !0,
      createErrors: !1,
      allErrors: !1
    }, i), e.failResult(i, () => e.reset(), () => e.error());
  },
  error: { message: "must NOT be valid" }
};
Gu.default = VS;
var zu = {};
Object.defineProperty(zu, "__esModule", { value: !0 });
const qS = pe, BS = {
  keyword: "anyOf",
  schemaType: "array",
  trackErrors: !0,
  code: qS.validateUnion,
  error: { message: "must match a schema in anyOf" }
};
zu.default = BS;
var Ku = {};
Object.defineProperty(Ku, "__esModule", { value: !0 });
const no = oe, HS = K, GS = {
  message: "must match exactly one schema in oneOf",
  params: ({ params: e }) => (0, no._)`{passingSchemas: ${e.passing}}`
}, zS = {
  keyword: "oneOf",
  schemaType: "array",
  trackErrors: !0,
  error: GS,
  code(e) {
    const { gen: t, schema: r, parentSchema: n, it: i } = e;
    if (!Array.isArray(r))
      throw new Error("ajv implementation error");
    if (i.opts.discriminator && n.discriminator)
      return;
    const s = r, a = t.let("valid", !1), o = t.let("passing", null), c = t.name("_valid");
    e.setParams({ passing: o }), t.block(u), e.result(a, () => e.reset(), () => e.error(!0));
    function u() {
      s.forEach((l, d) => {
        let h;
        (0, HS.alwaysValidSchema)(i, l) ? t.var(c, !0) : h = e.subschema({
          keyword: "oneOf",
          schemaProp: d,
          compositeRule: !0
        }, c), d > 0 && t.if((0, no._)`${c} && ${a}`).assign(a, !1).assign(o, (0, no._)`[${o}, ${d}]`).else(), t.if(c, () => {
          t.assign(a, !0), t.assign(o, d), h && e.mergeEvaluated(h, no.Name);
        });
      });
    }
  }
};
Ku.default = zS;
var Wu = {};
Object.defineProperty(Wu, "__esModule", { value: !0 });
const KS = K, WS = {
  keyword: "allOf",
  schemaType: "array",
  code(e) {
    const { gen: t, schema: r, it: n } = e;
    if (!Array.isArray(r))
      throw new Error("ajv implementation error");
    const i = t.name("valid");
    r.forEach((s, a) => {
      if ((0, KS.alwaysValidSchema)(n, s))
        return;
      const o = e.subschema({ keyword: "allOf", schemaProp: a }, i);
      e.ok(i), e.mergeEvaluated(o);
    });
  }
};
Wu.default = WS;
var Yu = {};
Object.defineProperty(Yu, "__esModule", { value: !0 });
const vo = oe, dg = K, YS = {
  message: ({ params: e }) => (0, vo.str)`must match "${e.ifClause}" schema`,
  params: ({ params: e }) => (0, vo._)`{failingKeyword: ${e.ifClause}}`
}, XS = {
  keyword: "if",
  schemaType: ["object", "boolean"],
  trackErrors: !0,
  error: YS,
  code(e) {
    const { gen: t, parentSchema: r, it: n } = e;
    r.then === void 0 && r.else === void 0 && (0, dg.checkStrictMode)(n, '"if" without "then" and "else" is ignored');
    const i = Ph(n, "then"), s = Ph(n, "else");
    if (!i && !s)
      return;
    const a = t.let("valid", !0), o = t.name("_valid");
    if (c(), e.reset(), i && s) {
      const l = t.let("ifClause");
      e.setParams({ ifClause: l }), t.if(o, u("then", l), u("else", l));
    } else i ? t.if(o, u("then")) : t.if((0, vo.not)(o), u("else"));
    e.pass(a, () => e.error(!0));
    function c() {
      const l = e.subschema({
        keyword: "if",
        compositeRule: !0,
        createErrors: !1,
        allErrors: !1
      }, o);
      e.mergeEvaluated(l);
    }
    function u(l, d) {
      return () => {
        const h = e.subschema({ keyword: l }, o);
        t.assign(a, o), e.mergeValidEvaluated(h, a), d ? t.assign(d, (0, vo._)`${l}`) : e.setParams({ ifClause: l });
      };
    }
  }
};
function Ph(e, t) {
  const r = e.schema[t];
  return r !== void 0 && !(0, dg.alwaysValidSchema)(e, r);
}
Yu.default = XS;
var Xu = {};
Object.defineProperty(Xu, "__esModule", { value: !0 });
const JS = K, QS = {
  keyword: ["then", "else"],
  schemaType: ["object", "boolean"],
  code({ keyword: e, parentSchema: t, it: r }) {
    t.if === void 0 && (0, JS.checkStrictMode)(r, `"${e}" without "if" is ignored`);
  }
};
Xu.default = QS;
Object.defineProperty(Uu, "__esModule", { value: !0 });
const ZS = Mi, eP = Mu, tP = xi, rP = xu, nP = Vu, iP = zo, sP = qu, aP = Ko, oP = Bu, cP = Hu, lP = Gu, uP = zu, dP = Ku, fP = Wu, hP = Yu, pP = Xu;
function mP(e = !1) {
  const t = [
    // any
    lP.default,
    uP.default,
    dP.default,
    fP.default,
    hP.default,
    pP.default,
    // object
    sP.default,
    aP.default,
    iP.default,
    oP.default,
    cP.default
  ];
  return e ? t.push(eP.default, rP.default) : t.push(ZS.default, tP.default), t.push(nP.default), t;
}
Uu.default = mP;
var Ju = {}, Vi = {};
Object.defineProperty(Vi, "__esModule", { value: !0 });
Vi.dynamicAnchor = void 0;
const Lc = oe, yP = kt, Th = pt, gP = kr, _P = {
  keyword: "$dynamicAnchor",
  schemaType: "string",
  code: (e) => fg(e, e.schema)
};
function fg(e, t) {
  const { gen: r, it: n } = e;
  n.schemaEnv.root.dynamicAnchors[t] = !0;
  const i = (0, Lc._)`${yP.default.dynamicAnchors}${(0, Lc.getProperty)(t)}`, s = n.errSchemaPath === "#" ? n.validateName : vP(e);
  r.if((0, Lc._)`!${i}`, () => r.assign(i, s));
}
Vi.dynamicAnchor = fg;
function vP(e) {
  const { schemaEnv: t, schema: r, self: n } = e.it, { root: i, baseId: s, localRefs: a, meta: o } = t.root, { schemaId: c } = n.opts, u = new Th.SchemaEnv({ schema: r, schemaId: c, root: i, baseId: s, localRefs: a, meta: o });
  return Th.compileSchema.call(n, u), (0, gP.getValidate)(e, u);
}
Vi.default = _P;
var qi = {};
Object.defineProperty(qi, "__esModule", { value: !0 });
qi.dynamicRef = void 0;
const Nh = oe, $P = kt, Oh = kr, wP = {
  keyword: "$dynamicRef",
  schemaType: "string",
  code: (e) => hg(e, e.schema)
};
function hg(e, t) {
  const { gen: r, keyword: n, it: i } = e;
  if (t[0] !== "#")
    throw new Error(`"${n}" only supports hash fragment reference`);
  const s = t.slice(1);
  if (i.allErrors)
    a();
  else {
    const c = r.let("valid", !1);
    a(c), e.ok(c);
  }
  function a(c) {
    if (i.schemaEnv.root.dynamicAnchors[s]) {
      const u = r.let("_v", (0, Nh._)`${$P.default.dynamicAnchors}${(0, Nh.getProperty)(s)}`);
      r.if(u, o(u, c), o(i.validateName, c));
    } else
      o(i.validateName, c)();
  }
  function o(c, u) {
    return u ? () => r.block(() => {
      (0, Oh.callRef)(e, c), r.let(u, !0);
    }) : () => (0, Oh.callRef)(e, c);
  }
}
qi.dynamicRef = hg;
qi.default = wP;
var Qu = {};
Object.defineProperty(Qu, "__esModule", { value: !0 });
const EP = Vi, bP = K, SP = {
  keyword: "$recursiveAnchor",
  schemaType: "boolean",
  code(e) {
    e.schema ? (0, EP.dynamicAnchor)(e, "") : (0, bP.checkStrictMode)(e.it, "$recursiveAnchor: false is ignored");
  }
};
Qu.default = SP;
var Zu = {};
Object.defineProperty(Zu, "__esModule", { value: !0 });
const PP = qi, TP = {
  keyword: "$recursiveRef",
  schemaType: "string",
  code: (e) => (0, PP.dynamicRef)(e, e.schema)
};
Zu.default = TP;
Object.defineProperty(Ju, "__esModule", { value: !0 });
const NP = Vi, OP = qi, AP = Qu, CP = Zu, RP = [NP.default, OP.default, AP.default, CP.default];
Ju.default = RP;
var ed = {}, td = {};
Object.defineProperty(td, "__esModule", { value: !0 });
const Ah = zo, IP = {
  keyword: "dependentRequired",
  type: "object",
  schemaType: "object",
  error: Ah.error,
  code: (e) => (0, Ah.validatePropertyDeps)(e)
};
td.default = IP;
var rd = {};
Object.defineProperty(rd, "__esModule", { value: !0 });
const DP = zo, kP = {
  keyword: "dependentSchemas",
  type: "object",
  schemaType: "object",
  code: (e) => (0, DP.validateSchemaDeps)(e)
};
rd.default = kP;
var nd = {};
Object.defineProperty(nd, "__esModule", { value: !0 });
const FP = K, jP = {
  keyword: ["maxContains", "minContains"],
  type: "array",
  schemaType: "number",
  code({ keyword: e, parentSchema: t, it: r }) {
    t.contains === void 0 && (0, FP.checkStrictMode)(r, `"${e}" without "contains" is ignored`);
  }
};
nd.default = jP;
Object.defineProperty(ed, "__esModule", { value: !0 });
const LP = td, UP = rd, MP = nd, xP = [LP.default, UP.default, MP.default];
ed.default = xP;
var id = {}, sd = {};
Object.defineProperty(sd, "__esModule", { value: !0 });
const Yr = oe, Ch = K, VP = kt, qP = {
  message: "must NOT have unevaluated properties",
  params: ({ params: e }) => (0, Yr._)`{unevaluatedProperty: ${e.unevaluatedProperty}}`
}, BP = {
  keyword: "unevaluatedProperties",
  type: "object",
  schemaType: ["boolean", "object"],
  trackErrors: !0,
  error: qP,
  code(e) {
    const { gen: t, schema: r, data: n, errsCount: i, it: s } = e;
    if (!i)
      throw new Error("ajv implementation error");
    const { allErrors: a, props: o } = s;
    o instanceof Yr.Name ? t.if((0, Yr._)`${o} !== true`, () => t.forIn("key", n, (d) => t.if(u(o, d), () => c(d)))) : o !== !0 && t.forIn("key", n, (d) => o === void 0 ? c(d) : t.if(l(o, d), () => c(d))), s.props = !0, e.ok((0, Yr._)`${i} === ${VP.default.errors}`);
    function c(d) {
      if (r === !1) {
        e.setParams({ unevaluatedProperty: d }), e.error(), a || t.break();
        return;
      }
      if (!(0, Ch.alwaysValidSchema)(s, r)) {
        const h = t.name("valid");
        e.subschema({
          keyword: "unevaluatedProperties",
          dataProp: d,
          dataPropType: Ch.Type.Str
        }, h), a || t.if((0, Yr.not)(h), () => t.break());
      }
    }
    function u(d, h) {
      return (0, Yr._)`!${d} || !${d}[${h}]`;
    }
    function l(d, h) {
      const p = [];
      for (const $ in d)
        d[$] === !0 && p.push((0, Yr._)`${h} !== ${$}`);
      return (0, Yr.and)(...p);
    }
  }
};
sd.default = BP;
var ad = {};
Object.defineProperty(ad, "__esModule", { value: !0 });
const Dn = oe, Rh = K, HP = {
  message: ({ params: { len: e } }) => (0, Dn.str)`must NOT have more than ${e} items`,
  params: ({ params: { len: e } }) => (0, Dn._)`{limit: ${e}}`
}, GP = {
  keyword: "unevaluatedItems",
  type: "array",
  schemaType: ["boolean", "object"],
  error: HP,
  code(e) {
    const { gen: t, schema: r, data: n, it: i } = e, s = i.items || 0;
    if (s === !0)
      return;
    const a = t.const("len", (0, Dn._)`${n}.length`);
    if (r === !1)
      e.setParams({ len: s }), e.fail((0, Dn._)`${a} > ${s}`);
    else if (typeof r == "object" && !(0, Rh.alwaysValidSchema)(i, r)) {
      const c = t.var("valid", (0, Dn._)`${a} <= ${s}`);
      t.if((0, Dn.not)(c), () => o(c, s)), e.ok(c);
    }
    i.items = !0;
    function o(c, u) {
      t.forRange("i", u, a, (l) => {
        e.subschema({ keyword: "unevaluatedItems", dataProp: l, dataPropType: Rh.Type.Num }, c), i.allErrors || t.if((0, Dn.not)(c), () => t.break());
      });
    }
  }
};
ad.default = GP;
Object.defineProperty(id, "__esModule", { value: !0 });
const zP = sd, KP = ad, WP = [zP.default, KP.default];
id.default = WP;
var od = {}, cd = {};
Object.defineProperty(cd, "__esModule", { value: !0 });
const De = oe, YP = {
  message: ({ schemaCode: e }) => (0, De.str)`must match format "${e}"`,
  params: ({ schemaCode: e }) => (0, De._)`{format: ${e}}`
}, XP = {
  keyword: "format",
  type: ["number", "string"],
  schemaType: "string",
  $data: !0,
  error: YP,
  code(e, t) {
    const { gen: r, data: n, $data: i, schema: s, schemaCode: a, it: o } = e, { opts: c, errSchemaPath: u, schemaEnv: l, self: d } = o;
    if (!c.validateFormats)
      return;
    i ? h() : p();
    function h() {
      const $ = r.scopeValue("formats", {
        ref: d.formats,
        code: c.code.formats
      }), _ = r.const("fDef", (0, De._)`${$}[${a}]`), v = r.let("fType"), m = r.let("format");
      r.if((0, De._)`typeof ${_} == "object" && !(${_} instanceof RegExp)`, () => r.assign(v, (0, De._)`${_}.type || "string"`).assign(m, (0, De._)`${_}.validate`), () => r.assign(v, (0, De._)`"string"`).assign(m, _)), e.fail$data((0, De.or)(E(), T()));
      function E() {
        return c.strictSchema === !1 ? De.nil : (0, De._)`${a} && !${m}`;
      }
      function T() {
        const R = l.$async ? (0, De._)`(${_}.async ? await ${m}(${n}) : ${m}(${n}))` : (0, De._)`${m}(${n})`, F = (0, De._)`(typeof ${m} == "function" ? ${R} : ${m}.test(${n}))`;
        return (0, De._)`${m} && ${m} !== true && ${v} === ${t} && !${F}`;
      }
    }
    function p() {
      const $ = d.formats[s];
      if (!$) {
        E();
        return;
      }
      if ($ === !0)
        return;
      const [_, v, m] = T($);
      _ === t && e.pass(R());
      function E() {
        if (c.strictSchema === !1) {
          d.logger.warn(F());
          return;
        }
        throw new Error(F());
        function F() {
          return `unknown format "${s}" ignored in schema at path "${u}"`;
        }
      }
      function T(F) {
        const H = F instanceof RegExp ? (0, De.regexpCode)(F) : c.code.formats ? (0, De._)`${c.code.formats}${(0, De.getProperty)(s)}` : void 0, G = r.scopeValue("formats", { key: s, ref: F, code: H });
        return typeof F == "object" && !(F instanceof RegExp) ? [F.type || "string", F.validate, (0, De._)`${G}.validate`] : ["string", F, G];
      }
      function R() {
        if (typeof $ == "object" && !($ instanceof RegExp) && $.async) {
          if (!l.$async)
            throw new Error("async format in sync schema");
          return (0, De._)`await ${m}(${n})`;
        }
        return typeof v == "function" ? (0, De._)`${m}(${n})` : (0, De._)`${m}.test(${n})`;
      }
    }
  }
};
cd.default = XP;
Object.defineProperty(od, "__esModule", { value: !0 });
const JP = cd, QP = [JP.default];
od.default = QP;
var Ri = {};
Object.defineProperty(Ri, "__esModule", { value: !0 });
Ri.contentVocabulary = Ri.metadataVocabulary = void 0;
Ri.metadataVocabulary = [
  "title",
  "description",
  "default",
  "deprecated",
  "readOnly",
  "writeOnly",
  "examples"
];
Ri.contentVocabulary = [
  "contentMediaType",
  "contentEncoding",
  "contentSchema"
];
Object.defineProperty(bu, "__esModule", { value: !0 });
const ZP = Su, e1 = Tu, t1 = Uu, r1 = Ju, n1 = ed, i1 = id, s1 = od, Ih = Ri, a1 = [
  r1.default,
  ZP.default,
  e1.default,
  (0, t1.default)(!0),
  s1.default,
  Ih.metadataVocabulary,
  Ih.contentVocabulary,
  n1.default,
  i1.default
];
bu.default = a1;
var ld = {}, Wo = {};
Object.defineProperty(Wo, "__esModule", { value: !0 });
Wo.DiscrError = void 0;
var Dh;
(function(e) {
  e.Tag = "tag", e.Mapping = "mapping";
})(Dh || (Wo.DiscrError = Dh = {}));
Object.defineProperty(ld, "__esModule", { value: !0 });
const fi = oe, kl = Wo, kh = pt, o1 = Ui, c1 = K, l1 = {
  message: ({ params: { discrError: e, tagName: t } }) => e === kl.DiscrError.Tag ? `tag "${t}" must be string` : `value of tag "${t}" must be in oneOf`,
  params: ({ params: { discrError: e, tag: t, tagName: r } }) => (0, fi._)`{error: ${e}, tag: ${r}, tagValue: ${t}}`
}, u1 = {
  keyword: "discriminator",
  type: "object",
  schemaType: "object",
  error: l1,
  code(e) {
    const { gen: t, data: r, schema: n, parentSchema: i, it: s } = e, { oneOf: a } = i;
    if (!s.opts.discriminator)
      throw new Error("discriminator: requires discriminator option");
    const o = n.propertyName;
    if (typeof o != "string")
      throw new Error("discriminator: requires propertyName");
    if (n.mapping)
      throw new Error("discriminator: mapping is not supported");
    if (!a)
      throw new Error("discriminator: requires oneOf keyword");
    const c = t.let("valid", !1), u = t.const("tag", (0, fi._)`${r}${(0, fi.getProperty)(o)}`);
    t.if((0, fi._)`typeof ${u} == "string"`, () => l(), () => e.error(!1, { discrError: kl.DiscrError.Tag, tag: u, tagName: o })), e.ok(c);
    function l() {
      const p = h();
      t.if(!1);
      for (const $ in p)
        t.elseIf((0, fi._)`${u} === ${$}`), t.assign(c, d(p[$]));
      t.else(), e.error(!1, { discrError: kl.DiscrError.Mapping, tag: u, tagName: o }), t.endIf();
    }
    function d(p) {
      const $ = t.name("valid"), _ = e.subschema({ keyword: "oneOf", schemaProp: p }, $);
      return e.mergeEvaluated(_, fi.Name), $;
    }
    function h() {
      var p;
      const $ = {}, _ = m(i);
      let v = !0;
      for (let R = 0; R < a.length; R++) {
        let F = a[R];
        if (F != null && F.$ref && !(0, c1.schemaHasRulesButRef)(F, s.self.RULES)) {
          const G = F.$ref;
          if (F = kh.resolveRef.call(s.self, s.schemaEnv.root, s.baseId, G), F instanceof kh.SchemaEnv && (F = F.schema), F === void 0)
            throw new o1.default(s.opts.uriResolver, s.baseId, G);
        }
        const H = (p = F == null ? void 0 : F.properties) === null || p === void 0 ? void 0 : p[o];
        if (typeof H != "object")
          throw new Error(`discriminator: oneOf subschemas (or referenced schemas) must have "properties/${o}"`);
        v = v && (_ || m(F)), E(H, R);
      }
      if (!v)
        throw new Error(`discriminator: "${o}" must be required`);
      return $;
      function m({ required: R }) {
        return Array.isArray(R) && R.includes(o);
      }
      function E(R, F) {
        if (R.const)
          T(R.const, F);
        else if (R.enum)
          for (const H of R.enum)
            T(H, F);
        else
          throw new Error(`discriminator: "properties/${o}" must have "const" or "enum"`);
      }
      function T(R, F) {
        if (typeof R != "string" || R in $)
          throw new Error(`discriminator: "${o}" values must be unique strings`);
        $[R] = F;
      }
    }
  }
};
ld.default = u1;
var ud = {};
const d1 = "https://json-schema.org/draft/2020-12/schema", f1 = "https://json-schema.org/draft/2020-12/schema", h1 = {
  "https://json-schema.org/draft/2020-12/vocab/core": !0,
  "https://json-schema.org/draft/2020-12/vocab/applicator": !0,
  "https://json-schema.org/draft/2020-12/vocab/unevaluated": !0,
  "https://json-schema.org/draft/2020-12/vocab/validation": !0,
  "https://json-schema.org/draft/2020-12/vocab/meta-data": !0,
  "https://json-schema.org/draft/2020-12/vocab/format-annotation": !0,
  "https://json-schema.org/draft/2020-12/vocab/content": !0
}, p1 = "meta", m1 = "Core and Validation specifications meta-schema", y1 = [
  {
    $ref: "meta/core"
  },
  {
    $ref: "meta/applicator"
  },
  {
    $ref: "meta/unevaluated"
  },
  {
    $ref: "meta/validation"
  },
  {
    $ref: "meta/meta-data"
  },
  {
    $ref: "meta/format-annotation"
  },
  {
    $ref: "meta/content"
  }
], g1 = [
  "object",
  "boolean"
], _1 = "This meta-schema also defines keywords that have appeared in previous drafts in order to prevent incompatible extensions as they remain in common use.", v1 = {
  definitions: {
    $comment: '"definitions" has been replaced by "$defs".',
    type: "object",
    additionalProperties: {
      $dynamicRef: "#meta"
    },
    deprecated: !0,
    default: {}
  },
  dependencies: {
    $comment: '"dependencies" has been split and replaced by "dependentSchemas" and "dependentRequired" in order to serve their differing semantics.',
    type: "object",
    additionalProperties: {
      anyOf: [
        {
          $dynamicRef: "#meta"
        },
        {
          $ref: "meta/validation#/$defs/stringArray"
        }
      ]
    },
    deprecated: !0,
    default: {}
  },
  $recursiveAnchor: {
    $comment: '"$recursiveAnchor" has been replaced by "$dynamicAnchor".',
    $ref: "meta/core#/$defs/anchorString",
    deprecated: !0
  },
  $recursiveRef: {
    $comment: '"$recursiveRef" has been replaced by "$dynamicRef".',
    $ref: "meta/core#/$defs/uriReferenceString",
    deprecated: !0
  }
}, $1 = {
  $schema: d1,
  $id: f1,
  $vocabulary: h1,
  $dynamicAnchor: p1,
  title: m1,
  allOf: y1,
  type: g1,
  $comment: _1,
  properties: v1
}, w1 = "https://json-schema.org/draft/2020-12/schema", E1 = "https://json-schema.org/draft/2020-12/meta/applicator", b1 = {
  "https://json-schema.org/draft/2020-12/vocab/applicator": !0
}, S1 = "meta", P1 = "Applicator vocabulary meta-schema", T1 = [
  "object",
  "boolean"
], N1 = {
  prefixItems: {
    $ref: "#/$defs/schemaArray"
  },
  items: {
    $dynamicRef: "#meta"
  },
  contains: {
    $dynamicRef: "#meta"
  },
  additionalProperties: {
    $dynamicRef: "#meta"
  },
  properties: {
    type: "object",
    additionalProperties: {
      $dynamicRef: "#meta"
    },
    default: {}
  },
  patternProperties: {
    type: "object",
    additionalProperties: {
      $dynamicRef: "#meta"
    },
    propertyNames: {
      format: "regex"
    },
    default: {}
  },
  dependentSchemas: {
    type: "object",
    additionalProperties: {
      $dynamicRef: "#meta"
    },
    default: {}
  },
  propertyNames: {
    $dynamicRef: "#meta"
  },
  if: {
    $dynamicRef: "#meta"
  },
  then: {
    $dynamicRef: "#meta"
  },
  else: {
    $dynamicRef: "#meta"
  },
  allOf: {
    $ref: "#/$defs/schemaArray"
  },
  anyOf: {
    $ref: "#/$defs/schemaArray"
  },
  oneOf: {
    $ref: "#/$defs/schemaArray"
  },
  not: {
    $dynamicRef: "#meta"
  }
}, O1 = {
  schemaArray: {
    type: "array",
    minItems: 1,
    items: {
      $dynamicRef: "#meta"
    }
  }
}, A1 = {
  $schema: w1,
  $id: E1,
  $vocabulary: b1,
  $dynamicAnchor: S1,
  title: P1,
  type: T1,
  properties: N1,
  $defs: O1
}, C1 = "https://json-schema.org/draft/2020-12/schema", R1 = "https://json-schema.org/draft/2020-12/meta/unevaluated", I1 = {
  "https://json-schema.org/draft/2020-12/vocab/unevaluated": !0
}, D1 = "meta", k1 = "Unevaluated applicator vocabulary meta-schema", F1 = [
  "object",
  "boolean"
], j1 = {
  unevaluatedItems: {
    $dynamicRef: "#meta"
  },
  unevaluatedProperties: {
    $dynamicRef: "#meta"
  }
}, L1 = {
  $schema: C1,
  $id: R1,
  $vocabulary: I1,
  $dynamicAnchor: D1,
  title: k1,
  type: F1,
  properties: j1
}, U1 = "https://json-schema.org/draft/2020-12/schema", M1 = "https://json-schema.org/draft/2020-12/meta/content", x1 = {
  "https://json-schema.org/draft/2020-12/vocab/content": !0
}, V1 = "meta", q1 = "Content vocabulary meta-schema", B1 = [
  "object",
  "boolean"
], H1 = {
  contentEncoding: {
    type: "string"
  },
  contentMediaType: {
    type: "string"
  },
  contentSchema: {
    $dynamicRef: "#meta"
  }
}, G1 = {
  $schema: U1,
  $id: M1,
  $vocabulary: x1,
  $dynamicAnchor: V1,
  title: q1,
  type: B1,
  properties: H1
}, z1 = "https://json-schema.org/draft/2020-12/schema", K1 = "https://json-schema.org/draft/2020-12/meta/core", W1 = {
  "https://json-schema.org/draft/2020-12/vocab/core": !0
}, Y1 = "meta", X1 = "Core vocabulary meta-schema", J1 = [
  "object",
  "boolean"
], Q1 = {
  $id: {
    $ref: "#/$defs/uriReferenceString",
    $comment: "Non-empty fragments not allowed.",
    pattern: "^[^#]*#?$"
  },
  $schema: {
    $ref: "#/$defs/uriString"
  },
  $ref: {
    $ref: "#/$defs/uriReferenceString"
  },
  $anchor: {
    $ref: "#/$defs/anchorString"
  },
  $dynamicRef: {
    $ref: "#/$defs/uriReferenceString"
  },
  $dynamicAnchor: {
    $ref: "#/$defs/anchorString"
  },
  $vocabulary: {
    type: "object",
    propertyNames: {
      $ref: "#/$defs/uriString"
    },
    additionalProperties: {
      type: "boolean"
    }
  },
  $comment: {
    type: "string"
  },
  $defs: {
    type: "object",
    additionalProperties: {
      $dynamicRef: "#meta"
    }
  }
}, Z1 = {
  anchorString: {
    type: "string",
    pattern: "^[A-Za-z_][-A-Za-z0-9._]*$"
  },
  uriString: {
    type: "string",
    format: "uri"
  },
  uriReferenceString: {
    type: "string",
    format: "uri-reference"
  }
}, eT = {
  $schema: z1,
  $id: K1,
  $vocabulary: W1,
  $dynamicAnchor: Y1,
  title: X1,
  type: J1,
  properties: Q1,
  $defs: Z1
}, tT = "https://json-schema.org/draft/2020-12/schema", rT = "https://json-schema.org/draft/2020-12/meta/format-annotation", nT = {
  "https://json-schema.org/draft/2020-12/vocab/format-annotation": !0
}, iT = "meta", sT = "Format vocabulary meta-schema for annotation results", aT = [
  "object",
  "boolean"
], oT = {
  format: {
    type: "string"
  }
}, cT = {
  $schema: tT,
  $id: rT,
  $vocabulary: nT,
  $dynamicAnchor: iT,
  title: sT,
  type: aT,
  properties: oT
}, lT = "https://json-schema.org/draft/2020-12/schema", uT = "https://json-schema.org/draft/2020-12/meta/meta-data", dT = {
  "https://json-schema.org/draft/2020-12/vocab/meta-data": !0
}, fT = "meta", hT = "Meta-data vocabulary meta-schema", pT = [
  "object",
  "boolean"
], mT = {
  title: {
    type: "string"
  },
  description: {
    type: "string"
  },
  default: !0,
  deprecated: {
    type: "boolean",
    default: !1
  },
  readOnly: {
    type: "boolean",
    default: !1
  },
  writeOnly: {
    type: "boolean",
    default: !1
  },
  examples: {
    type: "array",
    items: !0
  }
}, yT = {
  $schema: lT,
  $id: uT,
  $vocabulary: dT,
  $dynamicAnchor: fT,
  title: hT,
  type: pT,
  properties: mT
}, gT = "https://json-schema.org/draft/2020-12/schema", _T = "https://json-schema.org/draft/2020-12/meta/validation", vT = {
  "https://json-schema.org/draft/2020-12/vocab/validation": !0
}, $T = "meta", wT = "Validation vocabulary meta-schema", ET = [
  "object",
  "boolean"
], bT = {
  type: {
    anyOf: [
      {
        $ref: "#/$defs/simpleTypes"
      },
      {
        type: "array",
        items: {
          $ref: "#/$defs/simpleTypes"
        },
        minItems: 1,
        uniqueItems: !0
      }
    ]
  },
  const: !0,
  enum: {
    type: "array",
    items: !0
  },
  multipleOf: {
    type: "number",
    exclusiveMinimum: 0
  },
  maximum: {
    type: "number"
  },
  exclusiveMaximum: {
    type: "number"
  },
  minimum: {
    type: "number"
  },
  exclusiveMinimum: {
    type: "number"
  },
  maxLength: {
    $ref: "#/$defs/nonNegativeInteger"
  },
  minLength: {
    $ref: "#/$defs/nonNegativeIntegerDefault0"
  },
  pattern: {
    type: "string",
    format: "regex"
  },
  maxItems: {
    $ref: "#/$defs/nonNegativeInteger"
  },
  minItems: {
    $ref: "#/$defs/nonNegativeIntegerDefault0"
  },
  uniqueItems: {
    type: "boolean",
    default: !1
  },
  maxContains: {
    $ref: "#/$defs/nonNegativeInteger"
  },
  minContains: {
    $ref: "#/$defs/nonNegativeInteger",
    default: 1
  },
  maxProperties: {
    $ref: "#/$defs/nonNegativeInteger"
  },
  minProperties: {
    $ref: "#/$defs/nonNegativeIntegerDefault0"
  },
  required: {
    $ref: "#/$defs/stringArray"
  },
  dependentRequired: {
    type: "object",
    additionalProperties: {
      $ref: "#/$defs/stringArray"
    }
  }
}, ST = {
  nonNegativeInteger: {
    type: "integer",
    minimum: 0
  },
  nonNegativeIntegerDefault0: {
    $ref: "#/$defs/nonNegativeInteger",
    default: 0
  },
  simpleTypes: {
    enum: [
      "array",
      "boolean",
      "integer",
      "null",
      "number",
      "object",
      "string"
    ]
  },
  stringArray: {
    type: "array",
    items: {
      type: "string"
    },
    uniqueItems: !0,
    default: []
  }
}, PT = {
  $schema: gT,
  $id: _T,
  $vocabulary: vT,
  $dynamicAnchor: $T,
  title: wT,
  type: ET,
  properties: bT,
  $defs: ST
};
Object.defineProperty(ud, "__esModule", { value: !0 });
const TT = $1, NT = A1, OT = L1, AT = G1, CT = eT, RT = cT, IT = yT, DT = PT, kT = ["/properties"];
function FT(e) {
  return [
    TT,
    NT,
    OT,
    AT,
    CT,
    t(this, RT),
    IT,
    t(this, DT)
  ].forEach((r) => this.addMetaSchema(r, void 0, !1)), this;
  function t(r, n) {
    return e ? r.$dataMetaSchema(n, kT) : n;
  }
}
ud.default = FT;
(function(e, t) {
  Object.defineProperty(t, "__esModule", { value: !0 }), t.MissingRefError = t.ValidationError = t.CodeGen = t.Name = t.nil = t.stringify = t.str = t._ = t.KeywordCxt = t.Ajv2020 = void 0;
  const r = my, n = bu, i = ld, s = ud, a = "https://json-schema.org/draft/2020-12/schema";
  class o extends r.default {
    constructor(p = {}) {
      super({
        ...p,
        dynamicRef: !0,
        next: !0,
        unevaluated: !0
      });
    }
    _addVocabularies() {
      super._addVocabularies(), n.default.forEach((p) => this.addVocabulary(p)), this.opts.discriminator && this.addKeyword(i.default);
    }
    _addDefaultMetaSchema() {
      super._addDefaultMetaSchema();
      const { $data: p, meta: $ } = this.opts;
      $ && (s.default.call(this, p), this.refs["http://json-schema.org/schema"] = a);
    }
    defaultMeta() {
      return this.opts.defaultMeta = super.defaultMeta() || (this.getSchema(a) ? a : void 0);
    }
  }
  t.Ajv2020 = o, e.exports = t = o, e.exports.Ajv2020 = o, Object.defineProperty(t, "__esModule", { value: !0 }), t.default = o;
  var c = tr;
  Object.defineProperty(t, "KeywordCxt", { enumerable: !0, get: function() {
    return c.KeywordCxt;
  } });
  var u = oe;
  Object.defineProperty(t, "_", { enumerable: !0, get: function() {
    return u._;
  } }), Object.defineProperty(t, "str", { enumerable: !0, get: function() {
    return u.str;
  } }), Object.defineProperty(t, "stringify", { enumerable: !0, get: function() {
    return u.stringify;
  } }), Object.defineProperty(t, "nil", { enumerable: !0, get: function() {
    return u.nil;
  } }), Object.defineProperty(t, "Name", { enumerable: !0, get: function() {
    return u.Name;
  } }), Object.defineProperty(t, "CodeGen", { enumerable: !0, get: function() {
    return u.CodeGen;
  } });
  var l = Ys;
  Object.defineProperty(t, "ValidationError", { enumerable: !0, get: function() {
    return l.default;
  } });
  var d = Ui;
  Object.defineProperty(t, "MissingRefError", { enumerable: !0, get: function() {
    return d.default;
  } });
})(Nl, Nl.exports);
var jT = Nl.exports, Fl = { exports: {} }, pg = {};
(function(e) {
  Object.defineProperty(e, "__esModule", { value: !0 }), e.formatNames = e.fastFormats = e.fullFormats = void 0;
  function t(j, V) {
    return { validate: j, compare: V };
  }
  e.fullFormats = {
    // date: http://tools.ietf.org/html/rfc3339#section-5.6
    date: t(s, a),
    // date-time: http://tools.ietf.org/html/rfc3339#section-5.6
    time: t(c(!0), u),
    "date-time": t(h(!0), p),
    "iso-time": t(c(), l),
    "iso-date-time": t(h(), $),
    // duration: https://tools.ietf.org/html/rfc3339#appendix-A
    duration: /^P(?!$)((\d+Y)?(\d+M)?(\d+D)?(T(?=\d)(\d+H)?(\d+M)?(\d+S)?)?|(\d+W)?)$/,
    uri: m,
    "uri-reference": /^(?:[a-z][a-z0-9+\-.]*:)?(?:\/?\/(?:(?:[a-z0-9\-._~!$&'()*+,;=:]|%[0-9a-f]{2})*@)?(?:\[(?:(?:(?:(?:[0-9a-f]{1,4}:){6}|::(?:[0-9a-f]{1,4}:){5}|(?:[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){4}|(?:(?:[0-9a-f]{1,4}:){0,1}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){3}|(?:(?:[0-9a-f]{1,4}:){0,2}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){2}|(?:(?:[0-9a-f]{1,4}:){0,3}[0-9a-f]{1,4})?::[0-9a-f]{1,4}:|(?:(?:[0-9a-f]{1,4}:){0,4}[0-9a-f]{1,4})?::)(?:[0-9a-f]{1,4}:[0-9a-f]{1,4}|(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?))|(?:(?:[0-9a-f]{1,4}:){0,5}[0-9a-f]{1,4})?::[0-9a-f]{1,4}|(?:(?:[0-9a-f]{1,4}:){0,6}[0-9a-f]{1,4})?::)|[Vv][0-9a-f]+\.[a-z0-9\-._~!$&'()*+,;=:]+)\]|(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)|(?:[a-z0-9\-._~!$&'"()*+,;=]|%[0-9a-f]{2})*)(?::\d*)?(?:\/(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})*)*|\/(?:(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})+(?:\/(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})*)*)?|(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})+(?:\/(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})*)*)?(?:\?(?:[a-z0-9\-._~!$&'"()*+,;=:@/?]|%[0-9a-f]{2})*)?(?:#(?:[a-z0-9\-._~!$&'"()*+,;=:@/?]|%[0-9a-f]{2})*)?$/i,
    // uri-template: https://tools.ietf.org/html/rfc6570
    "uri-template": /^(?:(?:[^\x00-\x20"'<>%\\^`{|}]|%[0-9a-f]{2})|\{[+#./;?&=,!@|]?(?:[a-z0-9_]|%[0-9a-f]{2})+(?::[1-9][0-9]{0,3}|\*)?(?:,(?:[a-z0-9_]|%[0-9a-f]{2})+(?::[1-9][0-9]{0,3}|\*)?)*\})*$/i,
    // For the source: https://gist.github.com/dperini/729294
    // For test cases: https://mathiasbynens.be/demo/url-regex
    url: /^(?:https?|ftp):\/\/(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z0-9\u{00a1}-\u{ffff}]+-)*[a-z0-9\u{00a1}-\u{ffff}]+)(?:\.(?:[a-z0-9\u{00a1}-\u{ffff}]+-)*[a-z0-9\u{00a1}-\u{ffff}]+)*(?:\.(?:[a-z\u{00a1}-\u{ffff}]{2,})))(?::\d{2,5})?(?:\/[^\s]*)?$/iu,
    email: /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i,
    hostname: /^(?=.{1,253}\.?$)[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[-0-9a-z]{0,61}[0-9a-z])?)*\.?$/i,
    // optimized https://www.safaribooksonline.com/library/view/regular-expressions-cookbook/9780596802837/ch07s16.html
    ipv4: /^(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.){3}(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)$/,
    ipv6: /^((([0-9a-f]{1,4}:){7}([0-9a-f]{1,4}|:))|(([0-9a-f]{1,4}:){6}(:[0-9a-f]{1,4}|((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9a-f]{1,4}:){5}(((:[0-9a-f]{1,4}){1,2})|:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9a-f]{1,4}:){4}(((:[0-9a-f]{1,4}){1,3})|((:[0-9a-f]{1,4})?:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9a-f]{1,4}:){3}(((:[0-9a-f]{1,4}){1,4})|((:[0-9a-f]{1,4}){0,2}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9a-f]{1,4}:){2}(((:[0-9a-f]{1,4}){1,5})|((:[0-9a-f]{1,4}){0,3}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9a-f]{1,4}:){1}(((:[0-9a-f]{1,4}){1,6})|((:[0-9a-f]{1,4}){0,4}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(:(((:[0-9a-f]{1,4}){1,7})|((:[0-9a-f]{1,4}){0,5}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:)))$/i,
    regex: J,
    // uuid: http://tools.ietf.org/html/rfc4122
    uuid: /^(?:urn:uuid:)?[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i,
    // JSON-pointer: https://tools.ietf.org/html/rfc6901
    // uri fragment: https://tools.ietf.org/html/rfc3986#appendix-A
    "json-pointer": /^(?:\/(?:[^~/]|~0|~1)*)*$/,
    "json-pointer-uri-fragment": /^#(?:\/(?:[a-z0-9_\-.!$&'()*+,;:=@]|%[0-9a-f]{2}|~0|~1)*)*$/i,
    // relative JSON-pointer: http://tools.ietf.org/html/draft-luff-relative-json-pointer-00
    "relative-json-pointer": /^(?:0|[1-9][0-9]*)(?:#|(?:\/(?:[^~/]|~0|~1)*)*)$/,
    // the following formats are used by the openapi specification: https://spec.openapis.org/oas/v3.0.0#data-types
    // byte: https://github.com/miguelmota/is-base64
    byte: T,
    // signed 32 bit integer
    int32: { type: "number", validate: H },
    // signed 64 bit integer
    int64: { type: "number", validate: G },
    // C-type float
    float: { type: "number", validate: ie },
    // C-type double
    double: { type: "number", validate: ie },
    // hint to the UI to hide input strings
    password: !0,
    // unchecked string payload
    binary: !0
  }, e.fastFormats = {
    ...e.fullFormats,
    date: t(/^\d\d\d\d-[0-1]\d-[0-3]\d$/, a),
    time: t(/^(?:[0-2]\d:[0-5]\d:[0-5]\d|23:59:60)(?:\.\d+)?(?:z|[+-]\d\d(?::?\d\d)?)$/i, u),
    "date-time": t(/^\d\d\d\d-[0-1]\d-[0-3]\dt(?:[0-2]\d:[0-5]\d:[0-5]\d|23:59:60)(?:\.\d+)?(?:z|[+-]\d\d(?::?\d\d)?)$/i, p),
    "iso-time": t(/^(?:[0-2]\d:[0-5]\d:[0-5]\d|23:59:60)(?:\.\d+)?(?:z|[+-]\d\d(?::?\d\d)?)?$/i, l),
    "iso-date-time": t(/^\d\d\d\d-[0-1]\d-[0-3]\d[t\s](?:[0-2]\d:[0-5]\d:[0-5]\d|23:59:60)(?:\.\d+)?(?:z|[+-]\d\d(?::?\d\d)?)?$/i, $),
    // uri: https://github.com/mafintosh/is-my-json-valid/blob/master/formats.js
    uri: /^(?:[a-z][a-z0-9+\-.]*:)(?:\/?\/)?[^\s]*$/i,
    "uri-reference": /^(?:(?:[a-z][a-z0-9+\-.]*:)?\/?\/)?(?:[^\\\s#][^\s#]*)?(?:#[^\\\s]*)?$/i,
    // email (sources from jsen validator):
    // http://stackoverflow.com/questions/201323/using-a-regular-expression-to-validate-an-email-address#answer-8829363
    // http://www.w3.org/TR/html5/forms.html#valid-e-mail-address (search for 'wilful violation')
    email: /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)*$/i
  }, e.formatNames = Object.keys(e.fullFormats);
  function r(j) {
    return j % 4 === 0 && (j % 100 !== 0 || j % 400 === 0);
  }
  const n = /^(\d\d\d\d)-(\d\d)-(\d\d)$/, i = [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  function s(j) {
    const V = n.exec(j);
    if (!V)
      return !1;
    const Q = +V[1], L = +V[2], U = +V[3];
    return L >= 1 && L <= 12 && U >= 1 && U <= (L === 2 && r(Q) ? 29 : i[L]);
  }
  function a(j, V) {
    if (j && V)
      return j > V ? 1 : j < V ? -1 : 0;
  }
  const o = /^(\d\d):(\d\d):(\d\d(?:\.\d+)?)(z|([+-])(\d\d)(?::?(\d\d))?)?$/i;
  function c(j) {
    return function(Q) {
      const L = o.exec(Q);
      if (!L)
        return !1;
      const U = +L[1], B = +L[2], M = +L[3], z = L[4], q = L[5] === "-" ? -1 : 1, I = +(L[6] || 0), b = +(L[7] || 0);
      if (I > 23 || b > 59 || j && !z)
        return !1;
      if (U <= 23 && B <= 59 && M < 60)
        return !0;
      const O = B - b * q, S = U - I * q - (O < 0 ? 1 : 0);
      return (S === 23 || S === -1) && (O === 59 || O === -1) && M < 61;
    };
  }
  function u(j, V) {
    if (!(j && V))
      return;
    const Q = (/* @__PURE__ */ new Date("2020-01-01T" + j)).valueOf(), L = (/* @__PURE__ */ new Date("2020-01-01T" + V)).valueOf();
    if (Q && L)
      return Q - L;
  }
  function l(j, V) {
    if (!(j && V))
      return;
    const Q = o.exec(j), L = o.exec(V);
    if (Q && L)
      return j = Q[1] + Q[2] + Q[3], V = L[1] + L[2] + L[3], j > V ? 1 : j < V ? -1 : 0;
  }
  const d = /t|\s/i;
  function h(j) {
    const V = c(j);
    return function(L) {
      const U = L.split(d);
      return U.length === 2 && s(U[0]) && V(U[1]);
    };
  }
  function p(j, V) {
    if (!(j && V))
      return;
    const Q = new Date(j).valueOf(), L = new Date(V).valueOf();
    if (Q && L)
      return Q - L;
  }
  function $(j, V) {
    if (!(j && V))
      return;
    const [Q, L] = j.split(d), [U, B] = V.split(d), M = a(Q, U);
    if (M !== void 0)
      return M || u(L, B);
  }
  const _ = /\/|:/, v = /^(?:[a-z][a-z0-9+\-.]*:)(?:\/?\/(?:(?:[a-z0-9\-._~!$&'()*+,;=:]|%[0-9a-f]{2})*@)?(?:\[(?:(?:(?:(?:[0-9a-f]{1,4}:){6}|::(?:[0-9a-f]{1,4}:){5}|(?:[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){4}|(?:(?:[0-9a-f]{1,4}:){0,1}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){3}|(?:(?:[0-9a-f]{1,4}:){0,2}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){2}|(?:(?:[0-9a-f]{1,4}:){0,3}[0-9a-f]{1,4})?::[0-9a-f]{1,4}:|(?:(?:[0-9a-f]{1,4}:){0,4}[0-9a-f]{1,4})?::)(?:[0-9a-f]{1,4}:[0-9a-f]{1,4}|(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?))|(?:(?:[0-9a-f]{1,4}:){0,5}[0-9a-f]{1,4})?::[0-9a-f]{1,4}|(?:(?:[0-9a-f]{1,4}:){0,6}[0-9a-f]{1,4})?::)|[Vv][0-9a-f]+\.[a-z0-9\-._~!$&'()*+,;=:]+)\]|(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)|(?:[a-z0-9\-._~!$&'()*+,;=]|%[0-9a-f]{2})*)(?::\d*)?(?:\/(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})*)*|\/(?:(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})+(?:\/(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})*)*)?|(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})+(?:\/(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})*)*)(?:\?(?:[a-z0-9\-._~!$&'()*+,;=:@/?]|%[0-9a-f]{2})*)?(?:#(?:[a-z0-9\-._~!$&'()*+,;=:@/?]|%[0-9a-f]{2})*)?$/i;
  function m(j) {
    return _.test(j) && v.test(j);
  }
  const E = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/gm;
  function T(j) {
    return E.lastIndex = 0, E.test(j);
  }
  const R = -2147483648, F = 2 ** 31 - 1;
  function H(j) {
    return Number.isInteger(j) && j <= F && j >= R;
  }
  function G(j) {
    return Number.isInteger(j);
  }
  function ie() {
    return !0;
  }
  const C = /[^\\]\\Z/;
  function J(j) {
    if (C.test(j))
      return !1;
    try {
      return new RegExp(j), !0;
    } catch {
      return !1;
    }
  }
})(pg);
var mg = {}, jl = { exports: {} }, yg = {}, rr = {}, Ii = {}, Js = {}, de = {}, Cs = {};
(function(e) {
  Object.defineProperty(e, "__esModule", { value: !0 }), e.regexpCode = e.getEsmExportName = e.getProperty = e.safeStringify = e.stringify = e.strConcat = e.addCodeArg = e.str = e._ = e.nil = e._Code = e.Name = e.IDENTIFIER = e._CodeOrName = void 0;
  class t {
  }
  e._CodeOrName = t, e.IDENTIFIER = /^[a-z$_][a-z$_0-9]*$/i;
  class r extends t {
    constructor(E) {
      if (super(), !e.IDENTIFIER.test(E))
        throw new Error("CodeGen: name must be a valid identifier");
      this.str = E;
    }
    toString() {
      return this.str;
    }
    emptyStr() {
      return !1;
    }
    get names() {
      return { [this.str]: 1 };
    }
  }
  e.Name = r;
  class n extends t {
    constructor(E) {
      super(), this._items = typeof E == "string" ? [E] : E;
    }
    toString() {
      return this.str;
    }
    emptyStr() {
      if (this._items.length > 1)
        return !1;
      const E = this._items[0];
      return E === "" || E === '""';
    }
    get str() {
      var E;
      return (E = this._str) !== null && E !== void 0 ? E : this._str = this._items.reduce((T, R) => `${T}${R}`, "");
    }
    get names() {
      var E;
      return (E = this._names) !== null && E !== void 0 ? E : this._names = this._items.reduce((T, R) => (R instanceof r && (T[R.str] = (T[R.str] || 0) + 1), T), {});
    }
  }
  e._Code = n, e.nil = new n("");
  function i(m, ...E) {
    const T = [m[0]];
    let R = 0;
    for (; R < E.length; )
      o(T, E[R]), T.push(m[++R]);
    return new n(T);
  }
  e._ = i;
  const s = new n("+");
  function a(m, ...E) {
    const T = [p(m[0])];
    let R = 0;
    for (; R < E.length; )
      T.push(s), o(T, E[R]), T.push(s, p(m[++R]));
    return c(T), new n(T);
  }
  e.str = a;
  function o(m, E) {
    E instanceof n ? m.push(...E._items) : E instanceof r ? m.push(E) : m.push(d(E));
  }
  e.addCodeArg = o;
  function c(m) {
    let E = 1;
    for (; E < m.length - 1; ) {
      if (m[E] === s) {
        const T = u(m[E - 1], m[E + 1]);
        if (T !== void 0) {
          m.splice(E - 1, 3, T);
          continue;
        }
        m[E++] = "+";
      }
      E++;
    }
  }
  function u(m, E) {
    if (E === '""')
      return m;
    if (m === '""')
      return E;
    if (typeof m == "string")
      return E instanceof r || m[m.length - 1] !== '"' ? void 0 : typeof E != "string" ? `${m.slice(0, -1)}${E}"` : E[0] === '"' ? m.slice(0, -1) + E.slice(1) : void 0;
    if (typeof E == "string" && E[0] === '"' && !(m instanceof r))
      return `"${m}${E.slice(1)}`;
  }
  function l(m, E) {
    return E.emptyStr() ? m : m.emptyStr() ? E : a`${m}${E}`;
  }
  e.strConcat = l;
  function d(m) {
    return typeof m == "number" || typeof m == "boolean" || m === null ? m : p(Array.isArray(m) ? m.join(",") : m);
  }
  function h(m) {
    return new n(p(m));
  }
  e.stringify = h;
  function p(m) {
    return JSON.stringify(m).replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");
  }
  e.safeStringify = p;
  function $(m) {
    return typeof m == "string" && e.IDENTIFIER.test(m) ? new n(`.${m}`) : i`[${m}]`;
  }
  e.getProperty = $;
  function _(m) {
    if (typeof m == "string" && e.IDENTIFIER.test(m))
      return new n(`${m}`);
    throw new Error(`CodeGen: invalid export name: ${m}, use explicit $id name mapping`);
  }
  e.getEsmExportName = _;
  function v(m) {
    return new n(m.toString());
  }
  e.regexpCode = v;
})(Cs);
var Ll = {};
(function(e) {
  Object.defineProperty(e, "__esModule", { value: !0 }), e.ValueScope = e.ValueScopeName = e.Scope = e.varKinds = e.UsedValueState = void 0;
  const t = Cs;
  class r extends Error {
    constructor(u) {
      super(`CodeGen: "code" for ${u} not defined`), this.value = u.value;
    }
  }
  var n;
  (function(c) {
    c[c.Started = 0] = "Started", c[c.Completed = 1] = "Completed";
  })(n || (e.UsedValueState = n = {})), e.varKinds = {
    const: new t.Name("const"),
    let: new t.Name("let"),
    var: new t.Name("var")
  };
  class i {
    constructor({ prefixes: u, parent: l } = {}) {
      this._names = {}, this._prefixes = u, this._parent = l;
    }
    toName(u) {
      return u instanceof t.Name ? u : this.name(u);
    }
    name(u) {
      return new t.Name(this._newName(u));
    }
    _newName(u) {
      const l = this._names[u] || this._nameGroup(u);
      return `${u}${l.index++}`;
    }
    _nameGroup(u) {
      var l, d;
      if (!((d = (l = this._parent) === null || l === void 0 ? void 0 : l._prefixes) === null || d === void 0) && d.has(u) || this._prefixes && !this._prefixes.has(u))
        throw new Error(`CodeGen: prefix "${u}" is not allowed in this scope`);
      return this._names[u] = { prefix: u, index: 0 };
    }
  }
  e.Scope = i;
  class s extends t.Name {
    constructor(u, l) {
      super(l), this.prefix = u;
    }
    setValue(u, { property: l, itemIndex: d }) {
      this.value = u, this.scopePath = (0, t._)`.${new t.Name(l)}[${d}]`;
    }
  }
  e.ValueScopeName = s;
  const a = (0, t._)`\n`;
  class o extends i {
    constructor(u) {
      super(u), this._values = {}, this._scope = u.scope, this.opts = { ...u, _n: u.lines ? a : t.nil };
    }
    get() {
      return this._scope;
    }
    name(u) {
      return new s(u, this._newName(u));
    }
    value(u, l) {
      var d;
      if (l.ref === void 0)
        throw new Error("CodeGen: ref must be passed in value");
      const h = this.toName(u), { prefix: p } = h, $ = (d = l.key) !== null && d !== void 0 ? d : l.ref;
      let _ = this._values[p];
      if (_) {
        const E = _.get($);
        if (E)
          return E;
      } else
        _ = this._values[p] = /* @__PURE__ */ new Map();
      _.set($, h);
      const v = this._scope[p] || (this._scope[p] = []), m = v.length;
      return v[m] = l.ref, h.setValue(l, { property: p, itemIndex: m }), h;
    }
    getValue(u, l) {
      const d = this._values[u];
      if (d)
        return d.get(l);
    }
    scopeRefs(u, l = this._values) {
      return this._reduceValues(l, (d) => {
        if (d.scopePath === void 0)
          throw new Error(`CodeGen: name "${d}" has no value`);
        return (0, t._)`${u}${d.scopePath}`;
      });
    }
    scopeCode(u = this._values, l, d) {
      return this._reduceValues(u, (h) => {
        if (h.value === void 0)
          throw new Error(`CodeGen: name "${h}" has no value`);
        return h.value.code;
      }, l, d);
    }
    _reduceValues(u, l, d = {}, h) {
      let p = t.nil;
      for (const $ in u) {
        const _ = u[$];
        if (!_)
          continue;
        const v = d[$] = d[$] || /* @__PURE__ */ new Map();
        _.forEach((m) => {
          if (v.has(m))
            return;
          v.set(m, n.Started);
          let E = l(m);
          if (E) {
            const T = this.opts.es5 ? e.varKinds.var : e.varKinds.const;
            p = (0, t._)`${p}${T} ${m} = ${E};${this.opts._n}`;
          } else if (E = h == null ? void 0 : h(m))
            p = (0, t._)`${p}${E}${this.opts._n}`;
          else
            throw new r(m);
          v.set(m, n.Completed);
        });
      }
      return p;
    }
  }
  e.ValueScope = o;
})(Ll);
(function(e) {
  Object.defineProperty(e, "__esModule", { value: !0 }), e.or = e.and = e.not = e.CodeGen = e.operators = e.varKinds = e.ValueScopeName = e.ValueScope = e.Scope = e.Name = e.regexpCode = e.stringify = e.getProperty = e.nil = e.strConcat = e.str = e._ = void 0;
  const t = Cs, r = Ll;
  var n = Cs;
  Object.defineProperty(e, "_", { enumerable: !0, get: function() {
    return n._;
  } }), Object.defineProperty(e, "str", { enumerable: !0, get: function() {
    return n.str;
  } }), Object.defineProperty(e, "strConcat", { enumerable: !0, get: function() {
    return n.strConcat;
  } }), Object.defineProperty(e, "nil", { enumerable: !0, get: function() {
    return n.nil;
  } }), Object.defineProperty(e, "getProperty", { enumerable: !0, get: function() {
    return n.getProperty;
  } }), Object.defineProperty(e, "stringify", { enumerable: !0, get: function() {
    return n.stringify;
  } }), Object.defineProperty(e, "regexpCode", { enumerable: !0, get: function() {
    return n.regexpCode;
  } }), Object.defineProperty(e, "Name", { enumerable: !0, get: function() {
    return n.Name;
  } });
  var i = Ll;
  Object.defineProperty(e, "Scope", { enumerable: !0, get: function() {
    return i.Scope;
  } }), Object.defineProperty(e, "ValueScope", { enumerable: !0, get: function() {
    return i.ValueScope;
  } }), Object.defineProperty(e, "ValueScopeName", { enumerable: !0, get: function() {
    return i.ValueScopeName;
  } }), Object.defineProperty(e, "varKinds", { enumerable: !0, get: function() {
    return i.varKinds;
  } }), e.operators = {
    GT: new t._Code(">"),
    GTE: new t._Code(">="),
    LT: new t._Code("<"),
    LTE: new t._Code("<="),
    EQ: new t._Code("==="),
    NEQ: new t._Code("!=="),
    NOT: new t._Code("!"),
    OR: new t._Code("||"),
    AND: new t._Code("&&"),
    ADD: new t._Code("+")
  };
  class s {
    optimizeNodes() {
      return this;
    }
    optimizeNames(f, g) {
      return this;
    }
  }
  class a extends s {
    constructor(f, g, N) {
      super(), this.varKind = f, this.name = g, this.rhs = N;
    }
    render({ es5: f, _n: g }) {
      const N = f ? r.varKinds.var : this.varKind, w = this.rhs === void 0 ? "" : ` = ${this.rhs}`;
      return `${N} ${this.name}${w};` + g;
    }
    optimizeNames(f, g) {
      if (f[this.name.str])
        return this.rhs && (this.rhs = L(this.rhs, f, g)), this;
    }
    get names() {
      return this.rhs instanceof t._CodeOrName ? this.rhs.names : {};
    }
  }
  class o extends s {
    constructor(f, g, N) {
      super(), this.lhs = f, this.rhs = g, this.sideEffects = N;
    }
    render({ _n: f }) {
      return `${this.lhs} = ${this.rhs};` + f;
    }
    optimizeNames(f, g) {
      if (!(this.lhs instanceof t.Name && !f[this.lhs.str] && !this.sideEffects))
        return this.rhs = L(this.rhs, f, g), this;
    }
    get names() {
      const f = this.lhs instanceof t.Name ? {} : { ...this.lhs.names };
      return Q(f, this.rhs);
    }
  }
  class c extends o {
    constructor(f, g, N, w) {
      super(f, N, w), this.op = g;
    }
    render({ _n: f }) {
      return `${this.lhs} ${this.op}= ${this.rhs};` + f;
    }
  }
  class u extends s {
    constructor(f) {
      super(), this.label = f, this.names = {};
    }
    render({ _n: f }) {
      return `${this.label}:` + f;
    }
  }
  class l extends s {
    constructor(f) {
      super(), this.label = f, this.names = {};
    }
    render({ _n: f }) {
      return `break${this.label ? ` ${this.label}` : ""};` + f;
    }
  }
  class d extends s {
    constructor(f) {
      super(), this.error = f;
    }
    render({ _n: f }) {
      return `throw ${this.error};` + f;
    }
    get names() {
      return this.error.names;
    }
  }
  class h extends s {
    constructor(f) {
      super(), this.code = f;
    }
    render({ _n: f }) {
      return `${this.code};` + f;
    }
    optimizeNodes() {
      return `${this.code}` ? this : void 0;
    }
    optimizeNames(f, g) {
      return this.code = L(this.code, f, g), this;
    }
    get names() {
      return this.code instanceof t._CodeOrName ? this.code.names : {};
    }
  }
  class p extends s {
    constructor(f = []) {
      super(), this.nodes = f;
    }
    render(f) {
      return this.nodes.reduce((g, N) => g + N.render(f), "");
    }
    optimizeNodes() {
      const { nodes: f } = this;
      let g = f.length;
      for (; g--; ) {
        const N = f[g].optimizeNodes();
        Array.isArray(N) ? f.splice(g, 1, ...N) : N ? f[g] = N : f.splice(g, 1);
      }
      return f.length > 0 ? this : void 0;
    }
    optimizeNames(f, g) {
      const { nodes: N } = this;
      let w = N.length;
      for (; w--; ) {
        const y = N[w];
        y.optimizeNames(f, g) || (U(f, y.names), N.splice(w, 1));
      }
      return N.length > 0 ? this : void 0;
    }
    get names() {
      return this.nodes.reduce((f, g) => V(f, g.names), {});
    }
  }
  class $ extends p {
    render(f) {
      return "{" + f._n + super.render(f) + "}" + f._n;
    }
  }
  class _ extends p {
  }
  class v extends $ {
  }
  v.kind = "else";
  class m extends $ {
    constructor(f, g) {
      super(g), this.condition = f;
    }
    render(f) {
      let g = `if(${this.condition})` + super.render(f);
      return this.else && (g += "else " + this.else.render(f)), g;
    }
    optimizeNodes() {
      super.optimizeNodes();
      const f = this.condition;
      if (f === !0)
        return this.nodes;
      let g = this.else;
      if (g) {
        const N = g.optimizeNodes();
        g = this.else = Array.isArray(N) ? new v(N) : N;
      }
      if (g)
        return f === !1 ? g instanceof m ? g : g.nodes : this.nodes.length ? this : new m(B(f), g instanceof m ? [g] : g.nodes);
      if (!(f === !1 || !this.nodes.length))
        return this;
    }
    optimizeNames(f, g) {
      var N;
      if (this.else = (N = this.else) === null || N === void 0 ? void 0 : N.optimizeNames(f, g), !!(super.optimizeNames(f, g) || this.else))
        return this.condition = L(this.condition, f, g), this;
    }
    get names() {
      const f = super.names;
      return Q(f, this.condition), this.else && V(f, this.else.names), f;
    }
  }
  m.kind = "if";
  class E extends $ {
  }
  E.kind = "for";
  class T extends E {
    constructor(f) {
      super(), this.iteration = f;
    }
    render(f) {
      return `for(${this.iteration})` + super.render(f);
    }
    optimizeNames(f, g) {
      if (super.optimizeNames(f, g))
        return this.iteration = L(this.iteration, f, g), this;
    }
    get names() {
      return V(super.names, this.iteration.names);
    }
  }
  class R extends E {
    constructor(f, g, N, w) {
      super(), this.varKind = f, this.name = g, this.from = N, this.to = w;
    }
    render(f) {
      const g = f.es5 ? r.varKinds.var : this.varKind, { name: N, from: w, to: y } = this;
      return `for(${g} ${N}=${w}; ${N}<${y}; ${N}++)` + super.render(f);
    }
    get names() {
      const f = Q(super.names, this.from);
      return Q(f, this.to);
    }
  }
  class F extends E {
    constructor(f, g, N, w) {
      super(), this.loop = f, this.varKind = g, this.name = N, this.iterable = w;
    }
    render(f) {
      return `for(${this.varKind} ${this.name} ${this.loop} ${this.iterable})` + super.render(f);
    }
    optimizeNames(f, g) {
      if (super.optimizeNames(f, g))
        return this.iterable = L(this.iterable, f, g), this;
    }
    get names() {
      return V(super.names, this.iterable.names);
    }
  }
  class H extends $ {
    constructor(f, g, N) {
      super(), this.name = f, this.args = g, this.async = N;
    }
    render(f) {
      return `${this.async ? "async " : ""}function ${this.name}(${this.args})` + super.render(f);
    }
  }
  H.kind = "func";
  class G extends p {
    render(f) {
      return "return " + super.render(f);
    }
  }
  G.kind = "return";
  class ie extends $ {
    render(f) {
      let g = "try" + super.render(f);
      return this.catch && (g += this.catch.render(f)), this.finally && (g += this.finally.render(f)), g;
    }
    optimizeNodes() {
      var f, g;
      return super.optimizeNodes(), (f = this.catch) === null || f === void 0 || f.optimizeNodes(), (g = this.finally) === null || g === void 0 || g.optimizeNodes(), this;
    }
    optimizeNames(f, g) {
      var N, w;
      return super.optimizeNames(f, g), (N = this.catch) === null || N === void 0 || N.optimizeNames(f, g), (w = this.finally) === null || w === void 0 || w.optimizeNames(f, g), this;
    }
    get names() {
      const f = super.names;
      return this.catch && V(f, this.catch.names), this.finally && V(f, this.finally.names), f;
    }
  }
  class C extends $ {
    constructor(f) {
      super(), this.error = f;
    }
    render(f) {
      return `catch(${this.error})` + super.render(f);
    }
  }
  C.kind = "catch";
  class J extends $ {
    render(f) {
      return "finally" + super.render(f);
    }
  }
  J.kind = "finally";
  class j {
    constructor(f, g = {}) {
      this._values = {}, this._blockStarts = [], this._constants = {}, this.opts = { ...g, _n: g.lines ? `
` : "" }, this._extScope = f, this._scope = new r.Scope({ parent: f }), this._nodes = [new _()];
    }
    toString() {
      return this._root.render(this.opts);
    }
    // returns unique name in the internal scope
    name(f) {
      return this._scope.name(f);
    }
    // reserves unique name in the external scope
    scopeName(f) {
      return this._extScope.name(f);
    }
    // reserves unique name in the external scope and assigns value to it
    scopeValue(f, g) {
      const N = this._extScope.value(f, g);
      return (this._values[N.prefix] || (this._values[N.prefix] = /* @__PURE__ */ new Set())).add(N), N;
    }
    getScopeValue(f, g) {
      return this._extScope.getValue(f, g);
    }
    // return code that assigns values in the external scope to the names that are used internally
    // (same names that were returned by gen.scopeName or gen.scopeValue)
    scopeRefs(f) {
      return this._extScope.scopeRefs(f, this._values);
    }
    scopeCode() {
      return this._extScope.scopeCode(this._values);
    }
    _def(f, g, N, w) {
      const y = this._scope.toName(g);
      return N !== void 0 && w && (this._constants[y.str] = N), this._leafNode(new a(f, y, N)), y;
    }
    // `const` declaration (`var` in es5 mode)
    const(f, g, N) {
      return this._def(r.varKinds.const, f, g, N);
    }
    // `let` declaration with optional assignment (`var` in es5 mode)
    let(f, g, N) {
      return this._def(r.varKinds.let, f, g, N);
    }
    // `var` declaration with optional assignment
    var(f, g, N) {
      return this._def(r.varKinds.var, f, g, N);
    }
    // assignment code
    assign(f, g, N) {
      return this._leafNode(new o(f, g, N));
    }
    // `+=` code
    add(f, g) {
      return this._leafNode(new c(f, e.operators.ADD, g));
    }
    // appends passed SafeExpr to code or executes Block
    code(f) {
      return typeof f == "function" ? f() : f !== t.nil && this._leafNode(new h(f)), this;
    }
    // returns code for object literal for the passed argument list of key-value pairs
    object(...f) {
      const g = ["{"];
      for (const [N, w] of f)
        g.length > 1 && g.push(","), g.push(N), (N !== w || this.opts.es5) && (g.push(":"), (0, t.addCodeArg)(g, w));
      return g.push("}"), new t._Code(g);
    }
    // `if` clause (or statement if `thenBody` and, optionally, `elseBody` are passed)
    if(f, g, N) {
      if (this._blockNode(new m(f)), g && N)
        this.code(g).else().code(N).endIf();
      else if (g)
        this.code(g).endIf();
      else if (N)
        throw new Error('CodeGen: "else" body without "then" body');
      return this;
    }
    // `else if` clause - invalid without `if` or after `else` clauses
    elseIf(f) {
      return this._elseNode(new m(f));
    }
    // `else` clause - only valid after `if` or `else if` clauses
    else() {
      return this._elseNode(new v());
    }
    // end `if` statement (needed if gen.if was used only with condition)
    endIf() {
      return this._endBlockNode(m, v);
    }
    _for(f, g) {
      return this._blockNode(f), g && this.code(g).endFor(), this;
    }
    // a generic `for` clause (or statement if `forBody` is passed)
    for(f, g) {
      return this._for(new T(f), g);
    }
    // `for` statement for a range of values
    forRange(f, g, N, w, y = this.opts.es5 ? r.varKinds.var : r.varKinds.let) {
      const k = this._scope.toName(f);
      return this._for(new R(y, k, g, N), () => w(k));
    }
    // `for-of` statement (in es5 mode replace with a normal for loop)
    forOf(f, g, N, w = r.varKinds.const) {
      const y = this._scope.toName(f);
      if (this.opts.es5) {
        const k = g instanceof t.Name ? g : this.var("_arr", g);
        return this.forRange("_i", 0, (0, t._)`${k}.length`, (A) => {
          this.var(y, (0, t._)`${k}[${A}]`), N(y);
        });
      }
      return this._for(new F("of", w, y, g), () => N(y));
    }
    // `for-in` statement.
    // With option `ownProperties` replaced with a `for-of` loop for object keys
    forIn(f, g, N, w = this.opts.es5 ? r.varKinds.var : r.varKinds.const) {
      if (this.opts.ownProperties)
        return this.forOf(f, (0, t._)`Object.keys(${g})`, N);
      const y = this._scope.toName(f);
      return this._for(new F("in", w, y, g), () => N(y));
    }
    // end `for` loop
    endFor() {
      return this._endBlockNode(E);
    }
    // `label` statement
    label(f) {
      return this._leafNode(new u(f));
    }
    // `break` statement
    break(f) {
      return this._leafNode(new l(f));
    }
    // `return` statement
    return(f) {
      const g = new G();
      if (this._blockNode(g), this.code(f), g.nodes.length !== 1)
        throw new Error('CodeGen: "return" should have one node');
      return this._endBlockNode(G);
    }
    // `try` statement
    try(f, g, N) {
      if (!g && !N)
        throw new Error('CodeGen: "try" without "catch" and "finally"');
      const w = new ie();
      if (this._blockNode(w), this.code(f), g) {
        const y = this.name("e");
        this._currNode = w.catch = new C(y), g(y);
      }
      return N && (this._currNode = w.finally = new J(), this.code(N)), this._endBlockNode(C, J);
    }
    // `throw` statement
    throw(f) {
      return this._leafNode(new d(f));
    }
    // start self-balancing block
    block(f, g) {
      return this._blockStarts.push(this._nodes.length), f && this.code(f).endBlock(g), this;
    }
    // end the current self-balancing block
    endBlock(f) {
      const g = this._blockStarts.pop();
      if (g === void 0)
        throw new Error("CodeGen: not in self-balancing block");
      const N = this._nodes.length - g;
      if (N < 0 || f !== void 0 && N !== f)
        throw new Error(`CodeGen: wrong number of nodes: ${N} vs ${f} expected`);
      return this._nodes.length = g, this;
    }
    // `function` heading (or definition if funcBody is passed)
    func(f, g = t.nil, N, w) {
      return this._blockNode(new H(f, g, N)), w && this.code(w).endFunc(), this;
    }
    // end function definition
    endFunc() {
      return this._endBlockNode(H);
    }
    optimize(f = 1) {
      for (; f-- > 0; )
        this._root.optimizeNodes(), this._root.optimizeNames(this._root.names, this._constants);
    }
    _leafNode(f) {
      return this._currNode.nodes.push(f), this;
    }
    _blockNode(f) {
      this._currNode.nodes.push(f), this._nodes.push(f);
    }
    _endBlockNode(f, g) {
      const N = this._currNode;
      if (N instanceof f || g && N instanceof g)
        return this._nodes.pop(), this;
      throw new Error(`CodeGen: not in block "${g ? `${f.kind}/${g.kind}` : f.kind}"`);
    }
    _elseNode(f) {
      const g = this._currNode;
      if (!(g instanceof m))
        throw new Error('CodeGen: "else" without "if"');
      return this._currNode = g.else = f, this;
    }
    get _root() {
      return this._nodes[0];
    }
    get _currNode() {
      const f = this._nodes;
      return f[f.length - 1];
    }
    set _currNode(f) {
      const g = this._nodes;
      g[g.length - 1] = f;
    }
  }
  e.CodeGen = j;
  function V(S, f) {
    for (const g in f)
      S[g] = (S[g] || 0) + (f[g] || 0);
    return S;
  }
  function Q(S, f) {
    return f instanceof t._CodeOrName ? V(S, f.names) : S;
  }
  function L(S, f, g) {
    if (S instanceof t.Name)
      return N(S);
    if (!w(S))
      return S;
    return new t._Code(S._items.reduce((y, k) => (k instanceof t.Name && (k = N(k)), k instanceof t._Code ? y.push(...k._items) : y.push(k), y), []));
    function N(y) {
      const k = g[y.str];
      return k === void 0 || f[y.str] !== 1 ? y : (delete f[y.str], k);
    }
    function w(y) {
      return y instanceof t._Code && y._items.some((k) => k instanceof t.Name && f[k.str] === 1 && g[k.str] !== void 0);
    }
  }
  function U(S, f) {
    for (const g in f)
      S[g] = (S[g] || 0) - (f[g] || 0);
  }
  function B(S) {
    return typeof S == "boolean" || typeof S == "number" || S === null ? !S : (0, t._)`!${O(S)}`;
  }
  e.not = B;
  const M = b(e.operators.AND);
  function z(...S) {
    return S.reduce(M);
  }
  e.and = z;
  const q = b(e.operators.OR);
  function I(...S) {
    return S.reduce(q);
  }
  e.or = I;
  function b(S) {
    return (f, g) => f === t.nil ? g : g === t.nil ? f : (0, t._)`${O(f)} ${S} ${O(g)}`;
  }
  function O(S) {
    return S instanceof t.Name ? S : (0, t._)`(${S})`;
  }
})(de);
var Y = {};
Object.defineProperty(Y, "__esModule", { value: !0 });
Y.checkStrictMode = Y.getErrorPath = Y.Type = Y.useFunc = Y.setEvaluated = Y.evaluatedPropsToName = Y.mergeEvaluated = Y.eachItem = Y.unescapeJsonPointer = Y.escapeJsonPointer = Y.escapeFragment = Y.unescapeFragment = Y.schemaRefOrVal = Y.schemaHasRulesButRef = Y.schemaHasRules = Y.checkUnknownRules = Y.alwaysValidSchema = Y.toHash = void 0;
const $e = de, LT = Cs;
function UT(e) {
  const t = {};
  for (const r of e)
    t[r] = !0;
  return t;
}
Y.toHash = UT;
function MT(e, t) {
  return typeof t == "boolean" ? t : Object.keys(t).length === 0 ? !0 : (gg(e, t), !_g(t, e.self.RULES.all));
}
Y.alwaysValidSchema = MT;
function gg(e, t = e.schema) {
  const { opts: r, self: n } = e;
  if (!r.strictSchema || typeof t == "boolean")
    return;
  const i = n.RULES.keywords;
  for (const s in t)
    i[s] || wg(e, `unknown keyword: "${s}"`);
}
Y.checkUnknownRules = gg;
function _g(e, t) {
  if (typeof e == "boolean")
    return !e;
  for (const r in e)
    if (t[r])
      return !0;
  return !1;
}
Y.schemaHasRules = _g;
function xT(e, t) {
  if (typeof e == "boolean")
    return !e;
  for (const r in e)
    if (r !== "$ref" && t.all[r])
      return !0;
  return !1;
}
Y.schemaHasRulesButRef = xT;
function VT({ topSchemaRef: e, schemaPath: t }, r, n, i) {
  if (!i) {
    if (typeof r == "number" || typeof r == "boolean")
      return r;
    if (typeof r == "string")
      return (0, $e._)`${r}`;
  }
  return (0, $e._)`${e}${t}${(0, $e.getProperty)(n)}`;
}
Y.schemaRefOrVal = VT;
function qT(e) {
  return vg(decodeURIComponent(e));
}
Y.unescapeFragment = qT;
function BT(e) {
  return encodeURIComponent(dd(e));
}
Y.escapeFragment = BT;
function dd(e) {
  return typeof e == "number" ? `${e}` : e.replace(/~/g, "~0").replace(/\//g, "~1");
}
Y.escapeJsonPointer = dd;
function vg(e) {
  return e.replace(/~1/g, "/").replace(/~0/g, "~");
}
Y.unescapeJsonPointer = vg;
function HT(e, t) {
  if (Array.isArray(e))
    for (const r of e)
      t(r);
  else
    t(e);
}
Y.eachItem = HT;
function Fh({ mergeNames: e, mergeToName: t, mergeValues: r, resultToName: n }) {
  return (i, s, a, o) => {
    const c = a === void 0 ? s : a instanceof $e.Name ? (s instanceof $e.Name ? e(i, s, a) : t(i, s, a), a) : s instanceof $e.Name ? (t(i, a, s), s) : r(s, a);
    return o === $e.Name && !(c instanceof $e.Name) ? n(i, c) : c;
  };
}
Y.mergeEvaluated = {
  props: Fh({
    mergeNames: (e, t, r) => e.if((0, $e._)`${r} !== true && ${t} !== undefined`, () => {
      e.if((0, $e._)`${t} === true`, () => e.assign(r, !0), () => e.assign(r, (0, $e._)`${r} || {}`).code((0, $e._)`Object.assign(${r}, ${t})`));
    }),
    mergeToName: (e, t, r) => e.if((0, $e._)`${r} !== true`, () => {
      t === !0 ? e.assign(r, !0) : (e.assign(r, (0, $e._)`${r} || {}`), fd(e, r, t));
    }),
    mergeValues: (e, t) => e === !0 ? !0 : { ...e, ...t },
    resultToName: $g
  }),
  items: Fh({
    mergeNames: (e, t, r) => e.if((0, $e._)`${r} !== true && ${t} !== undefined`, () => e.assign(r, (0, $e._)`${t} === true ? true : ${r} > ${t} ? ${r} : ${t}`)),
    mergeToName: (e, t, r) => e.if((0, $e._)`${r} !== true`, () => e.assign(r, t === !0 ? !0 : (0, $e._)`${r} > ${t} ? ${r} : ${t}`)),
    mergeValues: (e, t) => e === !0 ? !0 : Math.max(e, t),
    resultToName: (e, t) => e.var("items", t)
  })
};
function $g(e, t) {
  if (t === !0)
    return e.var("props", !0);
  const r = e.var("props", (0, $e._)`{}`);
  return t !== void 0 && fd(e, r, t), r;
}
Y.evaluatedPropsToName = $g;
function fd(e, t, r) {
  Object.keys(r).forEach((n) => e.assign((0, $e._)`${t}${(0, $e.getProperty)(n)}`, !0));
}
Y.setEvaluated = fd;
const jh = {};
function GT(e, t) {
  return e.scopeValue("func", {
    ref: t,
    code: jh[t.code] || (jh[t.code] = new LT._Code(t.code))
  });
}
Y.useFunc = GT;
var Ul;
(function(e) {
  e[e.Num = 0] = "Num", e[e.Str = 1] = "Str";
})(Ul || (Y.Type = Ul = {}));
function zT(e, t, r) {
  if (e instanceof $e.Name) {
    const n = t === Ul.Num;
    return r ? n ? (0, $e._)`"[" + ${e} + "]"` : (0, $e._)`"['" + ${e} + "']"` : n ? (0, $e._)`"/" + ${e}` : (0, $e._)`"/" + ${e}.replace(/~/g, "~0").replace(/\\//g, "~1")`;
  }
  return r ? (0, $e.getProperty)(e).toString() : "/" + dd(e);
}
Y.getErrorPath = zT;
function wg(e, t, r = e.opts.strictSchema) {
  if (r) {
    if (t = `strict mode: ${t}`, r === !0)
      throw new Error(t);
    e.self.logger.warn(t);
  }
}
Y.checkStrictMode = wg;
var yr = {};
Object.defineProperty(yr, "__esModule", { value: !0 });
const st = de, KT = {
  // validation function arguments
  data: new st.Name("data"),
  // data passed to validation function
  // args passed from referencing schema
  valCxt: new st.Name("valCxt"),
  // validation/data context - should not be used directly, it is destructured to the names below
  instancePath: new st.Name("instancePath"),
  parentData: new st.Name("parentData"),
  parentDataProperty: new st.Name("parentDataProperty"),
  rootData: new st.Name("rootData"),
  // root data - same as the data passed to the first/top validation function
  dynamicAnchors: new st.Name("dynamicAnchors"),
  // used to support recursiveRef and dynamicRef
  // function scoped variables
  vErrors: new st.Name("vErrors"),
  // null or array of validation errors
  errors: new st.Name("errors"),
  // counter of validation errors
  this: new st.Name("this"),
  // "globals"
  self: new st.Name("self"),
  scope: new st.Name("scope"),
  // JTD serialize/parse name for JSON string and position
  json: new st.Name("json"),
  jsonPos: new st.Name("jsonPos"),
  jsonLen: new st.Name("jsonLen"),
  jsonPart: new st.Name("jsonPart")
};
yr.default = KT;
(function(e) {
  Object.defineProperty(e, "__esModule", { value: !0 }), e.extendErrors = e.resetErrorsCount = e.reportExtraError = e.reportError = e.keyword$DataError = e.keywordError = void 0;
  const t = de, r = Y, n = yr;
  e.keywordError = {
    message: ({ keyword: v }) => (0, t.str)`must pass "${v}" keyword validation`
  }, e.keyword$DataError = {
    message: ({ keyword: v, schemaType: m }) => m ? (0, t.str)`"${v}" keyword must be ${m} ($data)` : (0, t.str)`"${v}" keyword is invalid ($data)`
  };
  function i(v, m = e.keywordError, E, T) {
    const { it: R } = v, { gen: F, compositeRule: H, allErrors: G } = R, ie = d(v, m, E);
    T ?? (H || G) ? c(F, ie) : u(R, (0, t._)`[${ie}]`);
  }
  e.reportError = i;
  function s(v, m = e.keywordError, E) {
    const { it: T } = v, { gen: R, compositeRule: F, allErrors: H } = T, G = d(v, m, E);
    c(R, G), F || H || u(T, n.default.vErrors);
  }
  e.reportExtraError = s;
  function a(v, m) {
    v.assign(n.default.errors, m), v.if((0, t._)`${n.default.vErrors} !== null`, () => v.if(m, () => v.assign((0, t._)`${n.default.vErrors}.length`, m), () => v.assign(n.default.vErrors, null)));
  }
  e.resetErrorsCount = a;
  function o({ gen: v, keyword: m, schemaValue: E, data: T, errsCount: R, it: F }) {
    if (R === void 0)
      throw new Error("ajv implementation error");
    const H = v.name("err");
    v.forRange("i", R, n.default.errors, (G) => {
      v.const(H, (0, t._)`${n.default.vErrors}[${G}]`), v.if((0, t._)`${H}.instancePath === undefined`, () => v.assign((0, t._)`${H}.instancePath`, (0, t.strConcat)(n.default.instancePath, F.errorPath))), v.assign((0, t._)`${H}.schemaPath`, (0, t.str)`${F.errSchemaPath}/${m}`), F.opts.verbose && (v.assign((0, t._)`${H}.schema`, E), v.assign((0, t._)`${H}.data`, T));
    });
  }
  e.extendErrors = o;
  function c(v, m) {
    const E = v.const("err", m);
    v.if((0, t._)`${n.default.vErrors} === null`, () => v.assign(n.default.vErrors, (0, t._)`[${E}]`), (0, t._)`${n.default.vErrors}.push(${E})`), v.code((0, t._)`${n.default.errors}++`);
  }
  function u(v, m) {
    const { gen: E, validateName: T, schemaEnv: R } = v;
    R.$async ? E.throw((0, t._)`new ${v.ValidationError}(${m})`) : (E.assign((0, t._)`${T}.errors`, m), E.return(!1));
  }
  const l = {
    keyword: new t.Name("keyword"),
    schemaPath: new t.Name("schemaPath"),
    // also used in JTD errors
    params: new t.Name("params"),
    propertyName: new t.Name("propertyName"),
    message: new t.Name("message"),
    schema: new t.Name("schema"),
    parentSchema: new t.Name("parentSchema")
  };
  function d(v, m, E) {
    const { createErrors: T } = v.it;
    return T === !1 ? (0, t._)`{}` : h(v, m, E);
  }
  function h(v, m, E = {}) {
    const { gen: T, it: R } = v, F = [
      p(R, E),
      $(v, E)
    ];
    return _(v, m, F), T.object(...F);
  }
  function p({ errorPath: v }, { instancePath: m }) {
    const E = m ? (0, t.str)`${v}${(0, r.getErrorPath)(m, r.Type.Str)}` : v;
    return [n.default.instancePath, (0, t.strConcat)(n.default.instancePath, E)];
  }
  function $({ keyword: v, it: { errSchemaPath: m } }, { schemaPath: E, parentSchema: T }) {
    let R = T ? m : (0, t.str)`${m}/${v}`;
    return E && (R = (0, t.str)`${R}${(0, r.getErrorPath)(E, r.Type.Str)}`), [l.schemaPath, R];
  }
  function _(v, { params: m, message: E }, T) {
    const { keyword: R, data: F, schemaValue: H, it: G } = v, { opts: ie, propertyName: C, topSchemaRef: J, schemaPath: j } = G;
    T.push([l.keyword, R], [l.params, typeof m == "function" ? m(v) : m || (0, t._)`{}`]), ie.messages && T.push([l.message, typeof E == "function" ? E(v) : E]), ie.verbose && T.push([l.schema, H], [l.parentSchema, (0, t._)`${J}${j}`], [n.default.data, F]), C && T.push([l.propertyName, C]);
  }
})(Js);
Object.defineProperty(Ii, "__esModule", { value: !0 });
Ii.boolOrEmptySchema = Ii.topBoolOrEmptySchema = void 0;
const WT = Js, YT = de, XT = yr, JT = {
  message: "boolean schema is false"
};
function QT(e) {
  const { gen: t, schema: r, validateName: n } = e;
  r === !1 ? Eg(e, !1) : typeof r == "object" && r.$async === !0 ? t.return(XT.default.data) : (t.assign((0, YT._)`${n}.errors`, null), t.return(!0));
}
Ii.topBoolOrEmptySchema = QT;
function ZT(e, t) {
  const { gen: r, schema: n } = e;
  n === !1 ? (r.var(t, !1), Eg(e)) : r.var(t, !0);
}
Ii.boolOrEmptySchema = ZT;
function Eg(e, t) {
  const { gen: r, data: n } = e, i = {
    gen: r,
    keyword: "false schema",
    data: n,
    schema: !1,
    schemaCode: !1,
    schemaValue: !1,
    params: {},
    it: e
  };
  (0, WT.reportError)(i, JT, void 0, t);
}
var xe = {}, Gn = {};
Object.defineProperty(Gn, "__esModule", { value: !0 });
Gn.getRules = Gn.isJSONType = void 0;
const eN = ["string", "number", "integer", "boolean", "null", "object", "array"], tN = new Set(eN);
function rN(e) {
  return typeof e == "string" && tN.has(e);
}
Gn.isJSONType = rN;
function nN() {
  const e = {
    number: { type: "number", rules: [] },
    string: { type: "string", rules: [] },
    array: { type: "array", rules: [] },
    object: { type: "object", rules: [] }
  };
  return {
    types: { ...e, integer: !0, boolean: !0, null: !0 },
    rules: [{ rules: [] }, e.number, e.string, e.array, e.object],
    post: { rules: [] },
    all: {},
    keywords: {}
  };
}
Gn.getRules = nN;
var Cr = {};
Object.defineProperty(Cr, "__esModule", { value: !0 });
Cr.shouldUseRule = Cr.shouldUseGroup = Cr.schemaHasRulesForType = void 0;
function iN({ schema: e, self: t }, r) {
  const n = t.RULES.types[r];
  return n && n !== !0 && bg(e, n);
}
Cr.schemaHasRulesForType = iN;
function bg(e, t) {
  return t.rules.some((r) => Sg(e, r));
}
Cr.shouldUseGroup = bg;
function Sg(e, t) {
  var r;
  return e[t.keyword] !== void 0 || ((r = t.definition.implements) === null || r === void 0 ? void 0 : r.some((n) => e[n] !== void 0));
}
Cr.shouldUseRule = Sg;
Object.defineProperty(xe, "__esModule", { value: !0 });
xe.reportTypeError = xe.checkDataTypes = xe.checkDataType = xe.coerceAndCheckDataType = xe.getJSONTypes = xe.getSchemaTypes = xe.DataType = void 0;
const sN = Gn, aN = Cr, oN = Js, ue = de, Pg = Y;
var Pi;
(function(e) {
  e[e.Correct = 0] = "Correct", e[e.Wrong = 1] = "Wrong";
})(Pi || (xe.DataType = Pi = {}));
function cN(e) {
  const t = Tg(e.type);
  if (t.includes("null")) {
    if (e.nullable === !1)
      throw new Error("type: null contradicts nullable: false");
  } else {
    if (!t.length && e.nullable !== void 0)
      throw new Error('"nullable" cannot be used without "type"');
    e.nullable === !0 && t.push("null");
  }
  return t;
}
xe.getSchemaTypes = cN;
function Tg(e) {
  const t = Array.isArray(e) ? e : e ? [e] : [];
  if (t.every(sN.isJSONType))
    return t;
  throw new Error("type must be JSONType or JSONType[]: " + t.join(","));
}
xe.getJSONTypes = Tg;
function lN(e, t) {
  const { gen: r, data: n, opts: i } = e, s = uN(t, i.coerceTypes), a = t.length > 0 && !(s.length === 0 && t.length === 1 && (0, aN.schemaHasRulesForType)(e, t[0]));
  if (a) {
    const o = hd(t, n, i.strictNumbers, Pi.Wrong);
    r.if(o, () => {
      s.length ? dN(e, t, s) : pd(e);
    });
  }
  return a;
}
xe.coerceAndCheckDataType = lN;
const Ng = /* @__PURE__ */ new Set(["string", "number", "integer", "boolean", "null"]);
function uN(e, t) {
  return t ? e.filter((r) => Ng.has(r) || t === "array" && r === "array") : [];
}
function dN(e, t, r) {
  const { gen: n, data: i, opts: s } = e, a = n.let("dataType", (0, ue._)`typeof ${i}`), o = n.let("coerced", (0, ue._)`undefined`);
  s.coerceTypes === "array" && n.if((0, ue._)`${a} == 'object' && Array.isArray(${i}) && ${i}.length == 1`, () => n.assign(i, (0, ue._)`${i}[0]`).assign(a, (0, ue._)`typeof ${i}`).if(hd(t, i, s.strictNumbers), () => n.assign(o, i))), n.if((0, ue._)`${o} !== undefined`);
  for (const u of r)
    (Ng.has(u) || u === "array" && s.coerceTypes === "array") && c(u);
  n.else(), pd(e), n.endIf(), n.if((0, ue._)`${o} !== undefined`, () => {
    n.assign(i, o), fN(e, o);
  });
  function c(u) {
    switch (u) {
      case "string":
        n.elseIf((0, ue._)`${a} == "number" || ${a} == "boolean"`).assign(o, (0, ue._)`"" + ${i}`).elseIf((0, ue._)`${i} === null`).assign(o, (0, ue._)`""`);
        return;
      case "number":
        n.elseIf((0, ue._)`${a} == "boolean" || ${i} === null
              || (${a} == "string" && ${i} && ${i} == +${i})`).assign(o, (0, ue._)`+${i}`);
        return;
      case "integer":
        n.elseIf((0, ue._)`${a} === "boolean" || ${i} === null
              || (${a} === "string" && ${i} && ${i} == +${i} && !(${i} % 1))`).assign(o, (0, ue._)`+${i}`);
        return;
      case "boolean":
        n.elseIf((0, ue._)`${i} === "false" || ${i} === 0 || ${i} === null`).assign(o, !1).elseIf((0, ue._)`${i} === "true" || ${i} === 1`).assign(o, !0);
        return;
      case "null":
        n.elseIf((0, ue._)`${i} === "" || ${i} === 0 || ${i} === false`), n.assign(o, null);
        return;
      case "array":
        n.elseIf((0, ue._)`${a} === "string" || ${a} === "number"
              || ${a} === "boolean" || ${i} === null`).assign(o, (0, ue._)`[${i}]`);
    }
  }
}
function fN({ gen: e, parentData: t, parentDataProperty: r }, n) {
  e.if((0, ue._)`${t} !== undefined`, () => e.assign((0, ue._)`${t}[${r}]`, n));
}
function Ml(e, t, r, n = Pi.Correct) {
  const i = n === Pi.Correct ? ue.operators.EQ : ue.operators.NEQ;
  let s;
  switch (e) {
    case "null":
      return (0, ue._)`${t} ${i} null`;
    case "array":
      s = (0, ue._)`Array.isArray(${t})`;
      break;
    case "object":
      s = (0, ue._)`${t} && typeof ${t} == "object" && !Array.isArray(${t})`;
      break;
    case "integer":
      s = a((0, ue._)`!(${t} % 1) && !isNaN(${t})`);
      break;
    case "number":
      s = a();
      break;
    default:
      return (0, ue._)`typeof ${t} ${i} ${e}`;
  }
  return n === Pi.Correct ? s : (0, ue.not)(s);
  function a(o = ue.nil) {
    return (0, ue.and)((0, ue._)`typeof ${t} == "number"`, o, r ? (0, ue._)`isFinite(${t})` : ue.nil);
  }
}
xe.checkDataType = Ml;
function hd(e, t, r, n) {
  if (e.length === 1)
    return Ml(e[0], t, r, n);
  let i;
  const s = (0, Pg.toHash)(e);
  if (s.array && s.object) {
    const a = (0, ue._)`typeof ${t} != "object"`;
    i = s.null ? a : (0, ue._)`!${t} || ${a}`, delete s.null, delete s.array, delete s.object;
  } else
    i = ue.nil;
  s.number && delete s.integer;
  for (const a in s)
    i = (0, ue.and)(i, Ml(a, t, r, n));
  return i;
}
xe.checkDataTypes = hd;
const hN = {
  message: ({ schema: e }) => `must be ${e}`,
  params: ({ schema: e, schemaValue: t }) => typeof e == "string" ? (0, ue._)`{type: ${e}}` : (0, ue._)`{type: ${t}}`
};
function pd(e) {
  const t = pN(e);
  (0, oN.reportError)(t, hN);
}
xe.reportTypeError = pd;
function pN(e) {
  const { gen: t, data: r, schema: n } = e, i = (0, Pg.schemaRefOrVal)(e, n, "type");
  return {
    gen: t,
    keyword: "type",
    data: r,
    schema: n.type,
    schemaCode: i,
    schemaValue: i,
    parentSchema: n,
    params: {},
    it: e
  };
}
var Yo = {};
Object.defineProperty(Yo, "__esModule", { value: !0 });
Yo.assignDefaults = void 0;
const ri = de, mN = Y;
function yN(e, t) {
  const { properties: r, items: n } = e.schema;
  if (t === "object" && r)
    for (const i in r)
      Lh(e, i, r[i].default);
  else t === "array" && Array.isArray(n) && n.forEach((i, s) => Lh(e, s, i.default));
}
Yo.assignDefaults = yN;
function Lh(e, t, r) {
  const { gen: n, compositeRule: i, data: s, opts: a } = e;
  if (r === void 0)
    return;
  const o = (0, ri._)`${s}${(0, ri.getProperty)(t)}`;
  if (i) {
    (0, mN.checkStrictMode)(e, `default is ignored for: ${o}`);
    return;
  }
  let c = (0, ri._)`${o} === undefined`;
  a.useDefaults === "empty" && (c = (0, ri._)`${c} || ${o} === null || ${o} === ""`), n.if(c, (0, ri._)`${o} = ${(0, ri.stringify)(r)}`);
}
var pr = {}, me = {};
Object.defineProperty(me, "__esModule", { value: !0 });
me.validateUnion = me.validateArray = me.usePattern = me.callValidateCode = me.schemaProperties = me.allSchemaProperties = me.noPropertyInData = me.propertyInData = me.isOwnProperty = me.hasPropFunc = me.reportMissingProp = me.checkMissingProp = me.checkReportMissingProp = void 0;
const Te = de, md = Y, Gr = yr, gN = Y;
function _N(e, t) {
  const { gen: r, data: n, it: i } = e;
  r.if(gd(r, n, t, i.opts.ownProperties), () => {
    e.setParams({ missingProperty: (0, Te._)`${t}` }, !0), e.error();
  });
}
me.checkReportMissingProp = _N;
function vN({ gen: e, data: t, it: { opts: r } }, n, i) {
  return (0, Te.or)(...n.map((s) => (0, Te.and)(gd(e, t, s, r.ownProperties), (0, Te._)`${i} = ${s}`)));
}
me.checkMissingProp = vN;
function $N(e, t) {
  e.setParams({ missingProperty: t }, !0), e.error();
}
me.reportMissingProp = $N;
function Og(e) {
  return e.scopeValue("func", {
    // eslint-disable-next-line @typescript-eslint/unbound-method
    ref: Object.prototype.hasOwnProperty,
    code: (0, Te._)`Object.prototype.hasOwnProperty`
  });
}
me.hasPropFunc = Og;
function yd(e, t, r) {
  return (0, Te._)`${Og(e)}.call(${t}, ${r})`;
}
me.isOwnProperty = yd;
function wN(e, t, r, n) {
  const i = (0, Te._)`${t}${(0, Te.getProperty)(r)} !== undefined`;
  return n ? (0, Te._)`${i} && ${yd(e, t, r)}` : i;
}
me.propertyInData = wN;
function gd(e, t, r, n) {
  const i = (0, Te._)`${t}${(0, Te.getProperty)(r)} === undefined`;
  return n ? (0, Te.or)(i, (0, Te.not)(yd(e, t, r))) : i;
}
me.noPropertyInData = gd;
function Ag(e) {
  return e ? Object.keys(e).filter((t) => t !== "__proto__") : [];
}
me.allSchemaProperties = Ag;
function EN(e, t) {
  return Ag(t).filter((r) => !(0, md.alwaysValidSchema)(e, t[r]));
}
me.schemaProperties = EN;
function bN({ schemaCode: e, data: t, it: { gen: r, topSchemaRef: n, schemaPath: i, errorPath: s }, it: a }, o, c, u) {
  const l = u ? (0, Te._)`${e}, ${t}, ${n}${i}` : t, d = [
    [Gr.default.instancePath, (0, Te.strConcat)(Gr.default.instancePath, s)],
    [Gr.default.parentData, a.parentData],
    [Gr.default.parentDataProperty, a.parentDataProperty],
    [Gr.default.rootData, Gr.default.rootData]
  ];
  a.opts.dynamicRef && d.push([Gr.default.dynamicAnchors, Gr.default.dynamicAnchors]);
  const h = (0, Te._)`${l}, ${r.object(...d)}`;
  return c !== Te.nil ? (0, Te._)`${o}.call(${c}, ${h})` : (0, Te._)`${o}(${h})`;
}
me.callValidateCode = bN;
const SN = (0, Te._)`new RegExp`;
function PN({ gen: e, it: { opts: t } }, r) {
  const n = t.unicodeRegExp ? "u" : "", { regExp: i } = t.code, s = i(r, n);
  return e.scopeValue("pattern", {
    key: s.toString(),
    ref: s,
    code: (0, Te._)`${i.code === "new RegExp" ? SN : (0, gN.useFunc)(e, i)}(${r}, ${n})`
  });
}
me.usePattern = PN;
function TN(e) {
  const { gen: t, data: r, keyword: n, it: i } = e, s = t.name("valid");
  if (i.allErrors) {
    const o = t.let("valid", !0);
    return a(() => t.assign(o, !1)), o;
  }
  return t.var(s, !0), a(() => t.break()), s;
  function a(o) {
    const c = t.const("len", (0, Te._)`${r}.length`);
    t.forRange("i", 0, c, (u) => {
      e.subschema({
        keyword: n,
        dataProp: u,
        dataPropType: md.Type.Num
      }, s), t.if((0, Te.not)(s), o);
    });
  }
}
me.validateArray = TN;
function NN(e) {
  const { gen: t, schema: r, keyword: n, it: i } = e;
  if (!Array.isArray(r))
    throw new Error("ajv implementation error");
  if (r.some((c) => (0, md.alwaysValidSchema)(i, c)) && !i.opts.unevaluated)
    return;
  const a = t.let("valid", !1), o = t.name("_valid");
  t.block(() => r.forEach((c, u) => {
    const l = e.subschema({
      keyword: n,
      schemaProp: u,
      compositeRule: !0
    }, o);
    t.assign(a, (0, Te._)`${a} || ${o}`), e.mergeValidEvaluated(l, o) || t.if((0, Te.not)(a));
  })), e.result(a, () => e.reset(), () => e.error(!0));
}
me.validateUnion = NN;
Object.defineProperty(pr, "__esModule", { value: !0 });
pr.validateKeywordUsage = pr.validSchemaType = pr.funcKeywordCode = pr.macroKeywordCode = void 0;
const ht = de, kn = yr, ON = me, AN = Js;
function CN(e, t) {
  const { gen: r, keyword: n, schema: i, parentSchema: s, it: a } = e, o = t.macro.call(a.self, i, s, a), c = Cg(r, n, o);
  a.opts.validateSchema !== !1 && a.self.validateSchema(o, !0);
  const u = r.name("valid");
  e.subschema({
    schema: o,
    schemaPath: ht.nil,
    errSchemaPath: `${a.errSchemaPath}/${n}`,
    topSchemaRef: c,
    compositeRule: !0
  }, u), e.pass(u, () => e.error(!0));
}
pr.macroKeywordCode = CN;
function RN(e, t) {
  var r;
  const { gen: n, keyword: i, schema: s, parentSchema: a, $data: o, it: c } = e;
  DN(c, t);
  const u = !o && t.compile ? t.compile.call(c.self, s, a, c) : t.validate, l = Cg(n, i, u), d = n.let("valid");
  e.block$data(d, h), e.ok((r = t.valid) !== null && r !== void 0 ? r : d);
  function h() {
    if (t.errors === !1)
      _(), t.modifying && Uh(e), v(() => e.error());
    else {
      const m = t.async ? p() : $();
      t.modifying && Uh(e), v(() => IN(e, m));
    }
  }
  function p() {
    const m = n.let("ruleErrs", null);
    return n.try(() => _((0, ht._)`await `), (E) => n.assign(d, !1).if((0, ht._)`${E} instanceof ${c.ValidationError}`, () => n.assign(m, (0, ht._)`${E}.errors`), () => n.throw(E))), m;
  }
  function $() {
    const m = (0, ht._)`${l}.errors`;
    return n.assign(m, null), _(ht.nil), m;
  }
  function _(m = t.async ? (0, ht._)`await ` : ht.nil) {
    const E = c.opts.passContext ? kn.default.this : kn.default.self, T = !("compile" in t && !o || t.schema === !1);
    n.assign(d, (0, ht._)`${m}${(0, ON.callValidateCode)(e, l, E, T)}`, t.modifying);
  }
  function v(m) {
    var E;
    n.if((0, ht.not)((E = t.valid) !== null && E !== void 0 ? E : d), m);
  }
}
pr.funcKeywordCode = RN;
function Uh(e) {
  const { gen: t, data: r, it: n } = e;
  t.if(n.parentData, () => t.assign(r, (0, ht._)`${n.parentData}[${n.parentDataProperty}]`));
}
function IN(e, t) {
  const { gen: r } = e;
  r.if((0, ht._)`Array.isArray(${t})`, () => {
    r.assign(kn.default.vErrors, (0, ht._)`${kn.default.vErrors} === null ? ${t} : ${kn.default.vErrors}.concat(${t})`).assign(kn.default.errors, (0, ht._)`${kn.default.vErrors}.length`), (0, AN.extendErrors)(e);
  }, () => e.error());
}
function DN({ schemaEnv: e }, t) {
  if (t.async && !e.$async)
    throw new Error("async keyword in sync schema");
}
function Cg(e, t, r) {
  if (r === void 0)
    throw new Error(`keyword "${t}" failed to compile`);
  return e.scopeValue("keyword", typeof r == "function" ? { ref: r } : { ref: r, code: (0, ht.stringify)(r) });
}
function kN(e, t, r = !1) {
  return !t.length || t.some((n) => n === "array" ? Array.isArray(e) : n === "object" ? e && typeof e == "object" && !Array.isArray(e) : typeof e == n || r && typeof e > "u");
}
pr.validSchemaType = kN;
function FN({ schema: e, opts: t, self: r, errSchemaPath: n }, i, s) {
  if (Array.isArray(i.keyword) ? !i.keyword.includes(s) : i.keyword !== s)
    throw new Error("ajv implementation error");
  const a = i.dependencies;
  if (a != null && a.some((o) => !Object.prototype.hasOwnProperty.call(e, o)))
    throw new Error(`parent schema must have dependencies of ${s}: ${a.join(",")}`);
  if (i.validateSchema && !i.validateSchema(e[s])) {
    const c = `keyword "${s}" value is invalid at path "${n}": ` + r.errorsText(i.validateSchema.errors);
    if (t.validateSchema === "log")
      r.logger.error(c);
    else
      throw new Error(c);
  }
}
pr.validateKeywordUsage = FN;
var cn = {};
Object.defineProperty(cn, "__esModule", { value: !0 });
cn.extendSubschemaMode = cn.extendSubschemaData = cn.getSubschema = void 0;
const dr = de, Rg = Y;
function jN(e, { keyword: t, schemaProp: r, schema: n, schemaPath: i, errSchemaPath: s, topSchemaRef: a }) {
  if (t !== void 0 && n !== void 0)
    throw new Error('both "keyword" and "schema" passed, only one allowed');
  if (t !== void 0) {
    const o = e.schema[t];
    return r === void 0 ? {
      schema: o,
      schemaPath: (0, dr._)`${e.schemaPath}${(0, dr.getProperty)(t)}`,
      errSchemaPath: `${e.errSchemaPath}/${t}`
    } : {
      schema: o[r],
      schemaPath: (0, dr._)`${e.schemaPath}${(0, dr.getProperty)(t)}${(0, dr.getProperty)(r)}`,
      errSchemaPath: `${e.errSchemaPath}/${t}/${(0, Rg.escapeFragment)(r)}`
    };
  }
  if (n !== void 0) {
    if (i === void 0 || s === void 0 || a === void 0)
      throw new Error('"schemaPath", "errSchemaPath" and "topSchemaRef" are required with "schema"');
    return {
      schema: n,
      schemaPath: i,
      topSchemaRef: a,
      errSchemaPath: s
    };
  }
  throw new Error('either "keyword" or "schema" must be passed');
}
cn.getSubschema = jN;
function LN(e, t, { dataProp: r, dataPropType: n, data: i, dataTypes: s, propertyName: a }) {
  if (i !== void 0 && r !== void 0)
    throw new Error('both "data" and "dataProp" passed, only one allowed');
  const { gen: o } = t;
  if (r !== void 0) {
    const { errorPath: u, dataPathArr: l, opts: d } = t, h = o.let("data", (0, dr._)`${t.data}${(0, dr.getProperty)(r)}`, !0);
    c(h), e.errorPath = (0, dr.str)`${u}${(0, Rg.getErrorPath)(r, n, d.jsPropertySyntax)}`, e.parentDataProperty = (0, dr._)`${r}`, e.dataPathArr = [...l, e.parentDataProperty];
  }
  if (i !== void 0) {
    const u = i instanceof dr.Name ? i : o.let("data", i, !0);
    c(u), a !== void 0 && (e.propertyName = a);
  }
  s && (e.dataTypes = s);
  function c(u) {
    e.data = u, e.dataLevel = t.dataLevel + 1, e.dataTypes = [], t.definedProperties = /* @__PURE__ */ new Set(), e.parentData = t.data, e.dataNames = [...t.dataNames, u];
  }
}
cn.extendSubschemaData = LN;
function UN(e, { jtdDiscriminator: t, jtdMetadata: r, compositeRule: n, createErrors: i, allErrors: s }) {
  n !== void 0 && (e.compositeRule = n), i !== void 0 && (e.createErrors = i), s !== void 0 && (e.allErrors = s), e.jtdDiscriminator = t, e.jtdMetadata = r;
}
cn.extendSubschemaMode = UN;
var Je = {}, Ig = { exports: {} }, nn = Ig.exports = function(e, t, r) {
  typeof t == "function" && (r = t, t = {}), r = t.cb || r;
  var n = typeof r == "function" ? r : r.pre || function() {
  }, i = r.post || function() {
  };
  io(t, n, i, e, "", e);
};
nn.keywords = {
  additionalItems: !0,
  items: !0,
  contains: !0,
  additionalProperties: !0,
  propertyNames: !0,
  not: !0,
  if: !0,
  then: !0,
  else: !0
};
nn.arrayKeywords = {
  items: !0,
  allOf: !0,
  anyOf: !0,
  oneOf: !0
};
nn.propsKeywords = {
  $defs: !0,
  definitions: !0,
  properties: !0,
  patternProperties: !0,
  dependencies: !0
};
nn.skipKeywords = {
  default: !0,
  enum: !0,
  const: !0,
  required: !0,
  maximum: !0,
  minimum: !0,
  exclusiveMaximum: !0,
  exclusiveMinimum: !0,
  multipleOf: !0,
  maxLength: !0,
  minLength: !0,
  pattern: !0,
  format: !0,
  maxItems: !0,
  minItems: !0,
  uniqueItems: !0,
  maxProperties: !0,
  minProperties: !0
};
function io(e, t, r, n, i, s, a, o, c, u) {
  if (n && typeof n == "object" && !Array.isArray(n)) {
    t(n, i, s, a, o, c, u);
    for (var l in n) {
      var d = n[l];
      if (Array.isArray(d)) {
        if (l in nn.arrayKeywords)
          for (var h = 0; h < d.length; h++)
            io(e, t, r, d[h], i + "/" + l + "/" + h, s, i, l, n, h);
      } else if (l in nn.propsKeywords) {
        if (d && typeof d == "object")
          for (var p in d)
            io(e, t, r, d[p], i + "/" + l + "/" + MN(p), s, i, l, n, p);
      } else (l in nn.keywords || e.allKeys && !(l in nn.skipKeywords)) && io(e, t, r, d, i + "/" + l, s, i, l, n);
    }
    r(n, i, s, a, o, c, u);
  }
}
function MN(e) {
  return e.replace(/~/g, "~0").replace(/\//g, "~1");
}
var xN = Ig.exports;
Object.defineProperty(Je, "__esModule", { value: !0 });
Je.getSchemaRefs = Je.resolveUrl = Je.normalizeId = Je._getFullPath = Je.getFullPath = Je.inlineRef = void 0;
const VN = Y, qN = qo, BN = xN, HN = /* @__PURE__ */ new Set([
  "type",
  "format",
  "pattern",
  "maxLength",
  "minLength",
  "maxProperties",
  "minProperties",
  "maxItems",
  "minItems",
  "maximum",
  "minimum",
  "uniqueItems",
  "multipleOf",
  "required",
  "enum",
  "const"
]);
function GN(e, t = !0) {
  return typeof e == "boolean" ? !0 : t === !0 ? !xl(e) : t ? Dg(e) <= t : !1;
}
Je.inlineRef = GN;
const zN = /* @__PURE__ */ new Set([
  "$ref",
  "$recursiveRef",
  "$recursiveAnchor",
  "$dynamicRef",
  "$dynamicAnchor"
]);
function xl(e) {
  for (const t in e) {
    if (zN.has(t))
      return !0;
    const r = e[t];
    if (Array.isArray(r) && r.some(xl) || typeof r == "object" && xl(r))
      return !0;
  }
  return !1;
}
function Dg(e) {
  let t = 0;
  for (const r in e) {
    if (r === "$ref")
      return 1 / 0;
    if (t++, !HN.has(r) && (typeof e[r] == "object" && (0, VN.eachItem)(e[r], (n) => t += Dg(n)), t === 1 / 0))
      return 1 / 0;
  }
  return t;
}
function kg(e, t = "", r) {
  r !== !1 && (t = Ti(t));
  const n = e.parse(t);
  return Fg(e, n);
}
Je.getFullPath = kg;
function Fg(e, t) {
  return e.serialize(t).split("#")[0] + "#";
}
Je._getFullPath = Fg;
const KN = /#\/?$/;
function Ti(e) {
  return e ? e.replace(KN, "") : "";
}
Je.normalizeId = Ti;
function WN(e, t, r) {
  return r = Ti(r), e.resolve(t, r);
}
Je.resolveUrl = WN;
const YN = /^[a-z_][-a-z0-9._]*$/i;
function XN(e, t) {
  if (typeof e == "boolean")
    return {};
  const { schemaId: r, uriResolver: n } = this.opts, i = Ti(e[r] || t), s = { "": i }, a = kg(n, i, !1), o = {}, c = /* @__PURE__ */ new Set();
  return BN(e, { allKeys: !0 }, (d, h, p, $) => {
    if ($ === void 0)
      return;
    const _ = a + h;
    let v = s[$];
    typeof d[r] == "string" && (v = m.call(this, d[r])), E.call(this, d.$anchor), E.call(this, d.$dynamicAnchor), s[h] = v;
    function m(T) {
      const R = this.opts.uriResolver.resolve;
      if (T = Ti(v ? R(v, T) : T), c.has(T))
        throw l(T);
      c.add(T);
      let F = this.refs[T];
      return typeof F == "string" && (F = this.refs[F]), typeof F == "object" ? u(d, F.schema, T) : T !== Ti(_) && (T[0] === "#" ? (u(d, o[T], T), o[T] = d) : this.refs[T] = _), T;
    }
    function E(T) {
      if (typeof T == "string") {
        if (!YN.test(T))
          throw new Error(`invalid anchor "${T}"`);
        m.call(this, `#${T}`);
      }
    }
  }), o;
  function u(d, h, p) {
    if (h !== void 0 && !qN(d, h))
      throw l(p);
  }
  function l(d) {
    return new Error(`reference "${d}" resolves to more than one schema`);
  }
}
Je.getSchemaRefs = XN;
Object.defineProperty(rr, "__esModule", { value: !0 });
rr.getData = rr.KeywordCxt = rr.validateFunctionCode = void 0;
const jg = Ii, Mh = xe, _d = Cr, $o = xe, JN = Yo, $s = pr, Uc = cn, ee = de, ne = yr, QN = Je, Rr = Y, is = Js;
function ZN(e) {
  if (Mg(e) && (xg(e), Ug(e))) {
    rO(e);
    return;
  }
  Lg(e, () => (0, jg.topBoolOrEmptySchema)(e));
}
rr.validateFunctionCode = ZN;
function Lg({ gen: e, validateName: t, schema: r, schemaEnv: n, opts: i }, s) {
  i.code.es5 ? e.func(t, (0, ee._)`${ne.default.data}, ${ne.default.valCxt}`, n.$async, () => {
    e.code((0, ee._)`"use strict"; ${xh(r, i)}`), tO(e, i), e.code(s);
  }) : e.func(t, (0, ee._)`${ne.default.data}, ${eO(i)}`, n.$async, () => e.code(xh(r, i)).code(s));
}
function eO(e) {
  return (0, ee._)`{${ne.default.instancePath}="", ${ne.default.parentData}, ${ne.default.parentDataProperty}, ${ne.default.rootData}=${ne.default.data}${e.dynamicRef ? (0, ee._)`, ${ne.default.dynamicAnchors}={}` : ee.nil}}={}`;
}
function tO(e, t) {
  e.if(ne.default.valCxt, () => {
    e.var(ne.default.instancePath, (0, ee._)`${ne.default.valCxt}.${ne.default.instancePath}`), e.var(ne.default.parentData, (0, ee._)`${ne.default.valCxt}.${ne.default.parentData}`), e.var(ne.default.parentDataProperty, (0, ee._)`${ne.default.valCxt}.${ne.default.parentDataProperty}`), e.var(ne.default.rootData, (0, ee._)`${ne.default.valCxt}.${ne.default.rootData}`), t.dynamicRef && e.var(ne.default.dynamicAnchors, (0, ee._)`${ne.default.valCxt}.${ne.default.dynamicAnchors}`);
  }, () => {
    e.var(ne.default.instancePath, (0, ee._)`""`), e.var(ne.default.parentData, (0, ee._)`undefined`), e.var(ne.default.parentDataProperty, (0, ee._)`undefined`), e.var(ne.default.rootData, ne.default.data), t.dynamicRef && e.var(ne.default.dynamicAnchors, (0, ee._)`{}`);
  });
}
function rO(e) {
  const { schema: t, opts: r, gen: n } = e;
  Lg(e, () => {
    r.$comment && t.$comment && qg(e), oO(e), n.let(ne.default.vErrors, null), n.let(ne.default.errors, 0), r.unevaluated && nO(e), Vg(e), uO(e);
  });
}
function nO(e) {
  const { gen: t, validateName: r } = e;
  e.evaluated = t.const("evaluated", (0, ee._)`${r}.evaluated`), t.if((0, ee._)`${e.evaluated}.dynamicProps`, () => t.assign((0, ee._)`${e.evaluated}.props`, (0, ee._)`undefined`)), t.if((0, ee._)`${e.evaluated}.dynamicItems`, () => t.assign((0, ee._)`${e.evaluated}.items`, (0, ee._)`undefined`));
}
function xh(e, t) {
  const r = typeof e == "object" && e[t.schemaId];
  return r && (t.code.source || t.code.process) ? (0, ee._)`/*# sourceURL=${r} */` : ee.nil;
}
function iO(e, t) {
  if (Mg(e) && (xg(e), Ug(e))) {
    sO(e, t);
    return;
  }
  (0, jg.boolOrEmptySchema)(e, t);
}
function Ug({ schema: e, self: t }) {
  if (typeof e == "boolean")
    return !e;
  for (const r in e)
    if (t.RULES.all[r])
      return !0;
  return !1;
}
function Mg(e) {
  return typeof e.schema != "boolean";
}
function sO(e, t) {
  const { schema: r, gen: n, opts: i } = e;
  i.$comment && r.$comment && qg(e), cO(e), lO(e);
  const s = n.const("_errs", ne.default.errors);
  Vg(e, s), n.var(t, (0, ee._)`${s} === ${ne.default.errors}`);
}
function xg(e) {
  (0, Rr.checkUnknownRules)(e), aO(e);
}
function Vg(e, t) {
  if (e.opts.jtd)
    return Vh(e, [], !1, t);
  const r = (0, Mh.getSchemaTypes)(e.schema), n = (0, Mh.coerceAndCheckDataType)(e, r);
  Vh(e, r, !n, t);
}
function aO(e) {
  const { schema: t, errSchemaPath: r, opts: n, self: i } = e;
  t.$ref && n.ignoreKeywordsWithRef && (0, Rr.schemaHasRulesButRef)(t, i.RULES) && i.logger.warn(`$ref: keywords ignored in schema at path "${r}"`);
}
function oO(e) {
  const { schema: t, opts: r } = e;
  t.default !== void 0 && r.useDefaults && r.strictSchema && (0, Rr.checkStrictMode)(e, "default is ignored in the schema root");
}
function cO(e) {
  const t = e.schema[e.opts.schemaId];
  t && (e.baseId = (0, QN.resolveUrl)(e.opts.uriResolver, e.baseId, t));
}
function lO(e) {
  if (e.schema.$async && !e.schemaEnv.$async)
    throw new Error("async schema in sync schema");
}
function qg({ gen: e, schemaEnv: t, schema: r, errSchemaPath: n, opts: i }) {
  const s = r.$comment;
  if (i.$comment === !0)
    e.code((0, ee._)`${ne.default.self}.logger.log(${s})`);
  else if (typeof i.$comment == "function") {
    const a = (0, ee.str)`${n}/$comment`, o = e.scopeValue("root", { ref: t.root });
    e.code((0, ee._)`${ne.default.self}.opts.$comment(${s}, ${a}, ${o}.schema)`);
  }
}
function uO(e) {
  const { gen: t, schemaEnv: r, validateName: n, ValidationError: i, opts: s } = e;
  r.$async ? t.if((0, ee._)`${ne.default.errors} === 0`, () => t.return(ne.default.data), () => t.throw((0, ee._)`new ${i}(${ne.default.vErrors})`)) : (t.assign((0, ee._)`${n}.errors`, ne.default.vErrors), s.unevaluated && dO(e), t.return((0, ee._)`${ne.default.errors} === 0`));
}
function dO({ gen: e, evaluated: t, props: r, items: n }) {
  r instanceof ee.Name && e.assign((0, ee._)`${t}.props`, r), n instanceof ee.Name && e.assign((0, ee._)`${t}.items`, n);
}
function Vh(e, t, r, n) {
  const { gen: i, schema: s, data: a, allErrors: o, opts: c, self: u } = e, { RULES: l } = u;
  if (s.$ref && (c.ignoreKeywordsWithRef || !(0, Rr.schemaHasRulesButRef)(s, l))) {
    i.block(() => Gg(e, "$ref", l.all.$ref.definition));
    return;
  }
  c.jtd || fO(e, t), i.block(() => {
    for (const h of l.rules)
      d(h);
    d(l.post);
  });
  function d(h) {
    (0, _d.shouldUseGroup)(s, h) && (h.type ? (i.if((0, $o.checkDataType)(h.type, a, c.strictNumbers)), qh(e, h), t.length === 1 && t[0] === h.type && r && (i.else(), (0, $o.reportTypeError)(e)), i.endIf()) : qh(e, h), o || i.if((0, ee._)`${ne.default.errors} === ${n || 0}`));
  }
}
function qh(e, t) {
  const { gen: r, schema: n, opts: { useDefaults: i } } = e;
  i && (0, JN.assignDefaults)(e, t.type), r.block(() => {
    for (const s of t.rules)
      (0, _d.shouldUseRule)(n, s) && Gg(e, s.keyword, s.definition, t.type);
  });
}
function fO(e, t) {
  e.schemaEnv.meta || !e.opts.strictTypes || (hO(e, t), e.opts.allowUnionTypes || pO(e, t), mO(e, e.dataTypes));
}
function hO(e, t) {
  if (t.length) {
    if (!e.dataTypes.length) {
      e.dataTypes = t;
      return;
    }
    t.forEach((r) => {
      Bg(e.dataTypes, r) || vd(e, `type "${r}" not allowed by context "${e.dataTypes.join(",")}"`);
    }), gO(e, t);
  }
}
function pO(e, t) {
  t.length > 1 && !(t.length === 2 && t.includes("null")) && vd(e, "use allowUnionTypes to allow union type keyword");
}
function mO(e, t) {
  const r = e.self.RULES.all;
  for (const n in r) {
    const i = r[n];
    if (typeof i == "object" && (0, _d.shouldUseRule)(e.schema, i)) {
      const { type: s } = i.definition;
      s.length && !s.some((a) => yO(t, a)) && vd(e, `missing type "${s.join(",")}" for keyword "${n}"`);
    }
  }
}
function yO(e, t) {
  return e.includes(t) || t === "number" && e.includes("integer");
}
function Bg(e, t) {
  return e.includes(t) || t === "integer" && e.includes("number");
}
function gO(e, t) {
  const r = [];
  for (const n of e.dataTypes)
    Bg(t, n) ? r.push(n) : t.includes("integer") && n === "number" && r.push("integer");
  e.dataTypes = r;
}
function vd(e, t) {
  const r = e.schemaEnv.baseId + e.errSchemaPath;
  t += ` at "${r}" (strictTypes)`, (0, Rr.checkStrictMode)(e, t, e.opts.strictTypes);
}
class Hg {
  constructor(t, r, n) {
    if ((0, $s.validateKeywordUsage)(t, r, n), this.gen = t.gen, this.allErrors = t.allErrors, this.keyword = n, this.data = t.data, this.schema = t.schema[n], this.$data = r.$data && t.opts.$data && this.schema && this.schema.$data, this.schemaValue = (0, Rr.schemaRefOrVal)(t, this.schema, n, this.$data), this.schemaType = r.schemaType, this.parentSchema = t.schema, this.params = {}, this.it = t, this.def = r, this.$data)
      this.schemaCode = t.gen.const("vSchema", zg(this.$data, t));
    else if (this.schemaCode = this.schemaValue, !(0, $s.validSchemaType)(this.schema, r.schemaType, r.allowUndefined))
      throw new Error(`${n} value must be ${JSON.stringify(r.schemaType)}`);
    ("code" in r ? r.trackErrors : r.errors !== !1) && (this.errsCount = t.gen.const("_errs", ne.default.errors));
  }
  result(t, r, n) {
    this.failResult((0, ee.not)(t), r, n);
  }
  failResult(t, r, n) {
    this.gen.if(t), n ? n() : this.error(), r ? (this.gen.else(), r(), this.allErrors && this.gen.endIf()) : this.allErrors ? this.gen.endIf() : this.gen.else();
  }
  pass(t, r) {
    this.failResult((0, ee.not)(t), void 0, r);
  }
  fail(t) {
    if (t === void 0) {
      this.error(), this.allErrors || this.gen.if(!1);
      return;
    }
    this.gen.if(t), this.error(), this.allErrors ? this.gen.endIf() : this.gen.else();
  }
  fail$data(t) {
    if (!this.$data)
      return this.fail(t);
    const { schemaCode: r } = this;
    this.fail((0, ee._)`${r} !== undefined && (${(0, ee.or)(this.invalid$data(), t)})`);
  }
  error(t, r, n) {
    if (r) {
      this.setParams(r), this._error(t, n), this.setParams({});
      return;
    }
    this._error(t, n);
  }
  _error(t, r) {
    (t ? is.reportExtraError : is.reportError)(this, this.def.error, r);
  }
  $dataError() {
    (0, is.reportError)(this, this.def.$dataError || is.keyword$DataError);
  }
  reset() {
    if (this.errsCount === void 0)
      throw new Error('add "trackErrors" to keyword definition');
    (0, is.resetErrorsCount)(this.gen, this.errsCount);
  }
  ok(t) {
    this.allErrors || this.gen.if(t);
  }
  setParams(t, r) {
    r ? Object.assign(this.params, t) : this.params = t;
  }
  block$data(t, r, n = ee.nil) {
    this.gen.block(() => {
      this.check$data(t, n), r();
    });
  }
  check$data(t = ee.nil, r = ee.nil) {
    if (!this.$data)
      return;
    const { gen: n, schemaCode: i, schemaType: s, def: a } = this;
    n.if((0, ee.or)((0, ee._)`${i} === undefined`, r)), t !== ee.nil && n.assign(t, !0), (s.length || a.validateSchema) && (n.elseIf(this.invalid$data()), this.$dataError(), t !== ee.nil && n.assign(t, !1)), n.else();
  }
  invalid$data() {
    const { gen: t, schemaCode: r, schemaType: n, def: i, it: s } = this;
    return (0, ee.or)(a(), o());
    function a() {
      if (n.length) {
        if (!(r instanceof ee.Name))
          throw new Error("ajv implementation error");
        const c = Array.isArray(n) ? n : [n];
        return (0, ee._)`${(0, $o.checkDataTypes)(c, r, s.opts.strictNumbers, $o.DataType.Wrong)}`;
      }
      return ee.nil;
    }
    function o() {
      if (i.validateSchema) {
        const c = t.scopeValue("validate$data", { ref: i.validateSchema });
        return (0, ee._)`!${c}(${r})`;
      }
      return ee.nil;
    }
  }
  subschema(t, r) {
    const n = (0, Uc.getSubschema)(this.it, t);
    (0, Uc.extendSubschemaData)(n, this.it, t), (0, Uc.extendSubschemaMode)(n, t);
    const i = { ...this.it, ...n, items: void 0, props: void 0 };
    return iO(i, r), i;
  }
  mergeEvaluated(t, r) {
    const { it: n, gen: i } = this;
    n.opts.unevaluated && (n.props !== !0 && t.props !== void 0 && (n.props = Rr.mergeEvaluated.props(i, t.props, n.props, r)), n.items !== !0 && t.items !== void 0 && (n.items = Rr.mergeEvaluated.items(i, t.items, n.items, r)));
  }
  mergeValidEvaluated(t, r) {
    const { it: n, gen: i } = this;
    if (n.opts.unevaluated && (n.props !== !0 || n.items !== !0))
      return i.if(r, () => this.mergeEvaluated(t, ee.Name)), !0;
  }
}
rr.KeywordCxt = Hg;
function Gg(e, t, r, n) {
  const i = new Hg(e, r, t);
  "code" in r ? r.code(i, n) : i.$data && r.validate ? (0, $s.funcKeywordCode)(i, r) : "macro" in r ? (0, $s.macroKeywordCode)(i, r) : (r.compile || r.validate) && (0, $s.funcKeywordCode)(i, r);
}
const _O = /^\/(?:[^~]|~0|~1)*$/, vO = /^([0-9]+)(#|\/(?:[^~]|~0|~1)*)?$/;
function zg(e, { dataLevel: t, dataNames: r, dataPathArr: n }) {
  let i, s;
  if (e === "")
    return ne.default.rootData;
  if (e[0] === "/") {
    if (!_O.test(e))
      throw new Error(`Invalid JSON-pointer: ${e}`);
    i = e, s = ne.default.rootData;
  } else {
    const u = vO.exec(e);
    if (!u)
      throw new Error(`Invalid JSON-pointer: ${e}`);
    const l = +u[1];
    if (i = u[2], i === "#") {
      if (l >= t)
        throw new Error(c("property/index", l));
      return n[t - l];
    }
    if (l > t)
      throw new Error(c("data", l));
    if (s = r[t - l], !i)
      return s;
  }
  let a = s;
  const o = i.split("/");
  for (const u of o)
    u && (s = (0, ee._)`${s}${(0, ee.getProperty)((0, Rr.unescapeJsonPointer)(u))}`, a = (0, ee._)`${a} && ${s}`);
  return a;
  function c(u, l) {
    return `Cannot access ${u} ${l} levels up, current level is ${t}`;
  }
}
rr.getData = zg;
var Qs = {};
Object.defineProperty(Qs, "__esModule", { value: !0 });
class $O extends Error {
  constructor(t) {
    super("validation failed"), this.errors = t, this.ajv = this.validation = !0;
  }
}
Qs.default = $O;
var Bi = {};
Object.defineProperty(Bi, "__esModule", { value: !0 });
const Mc = Je;
class wO extends Error {
  constructor(t, r, n, i) {
    super(i || `can't resolve reference ${n} from id ${r}`), this.missingRef = (0, Mc.resolveUrl)(t, r, n), this.missingSchema = (0, Mc.normalizeId)((0, Mc.getFullPath)(t, this.missingRef));
  }
}
Bi.default = wO;
var Tt = {};
Object.defineProperty(Tt, "__esModule", { value: !0 });
Tt.resolveSchema = Tt.getCompilingSchema = Tt.resolveRef = Tt.compileSchema = Tt.SchemaEnv = void 0;
const zt = de, EO = Qs, Tn = yr, er = Je, Bh = Y, bO = rr;
class Xo {
  constructor(t) {
    var r;
    this.refs = {}, this.dynamicAnchors = {};
    let n;
    typeof t.schema == "object" && (n = t.schema), this.schema = t.schema, this.schemaId = t.schemaId, this.root = t.root || this, this.baseId = (r = t.baseId) !== null && r !== void 0 ? r : (0, er.normalizeId)(n == null ? void 0 : n[t.schemaId || "$id"]), this.schemaPath = t.schemaPath, this.localRefs = t.localRefs, this.meta = t.meta, this.$async = n == null ? void 0 : n.$async, this.refs = {};
  }
}
Tt.SchemaEnv = Xo;
function $d(e) {
  const t = Kg.call(this, e);
  if (t)
    return t;
  const r = (0, er.getFullPath)(this.opts.uriResolver, e.root.baseId), { es5: n, lines: i } = this.opts.code, { ownProperties: s } = this.opts, a = new zt.CodeGen(this.scope, { es5: n, lines: i, ownProperties: s });
  let o;
  e.$async && (o = a.scopeValue("Error", {
    ref: EO.default,
    code: (0, zt._)`require("ajv/dist/runtime/validation_error").default`
  }));
  const c = a.scopeName("validate");
  e.validateName = c;
  const u = {
    gen: a,
    allErrors: this.opts.allErrors,
    data: Tn.default.data,
    parentData: Tn.default.parentData,
    parentDataProperty: Tn.default.parentDataProperty,
    dataNames: [Tn.default.data],
    dataPathArr: [zt.nil],
    // TODO can its length be used as dataLevel if nil is removed?
    dataLevel: 0,
    dataTypes: [],
    definedProperties: /* @__PURE__ */ new Set(),
    topSchemaRef: a.scopeValue("schema", this.opts.code.source === !0 ? { ref: e.schema, code: (0, zt.stringify)(e.schema) } : { ref: e.schema }),
    validateName: c,
    ValidationError: o,
    schema: e.schema,
    schemaEnv: e,
    rootId: r,
    baseId: e.baseId || r,
    schemaPath: zt.nil,
    errSchemaPath: e.schemaPath || (this.opts.jtd ? "" : "#"),
    errorPath: (0, zt._)`""`,
    opts: this.opts,
    self: this
  };
  let l;
  try {
    this._compilations.add(e), (0, bO.validateFunctionCode)(u), a.optimize(this.opts.code.optimize);
    const d = a.toString();
    l = `${a.scopeRefs(Tn.default.scope)}return ${d}`, this.opts.code.process && (l = this.opts.code.process(l, e));
    const p = new Function(`${Tn.default.self}`, `${Tn.default.scope}`, l)(this, this.scope.get());
    if (this.scope.value(c, { ref: p }), p.errors = null, p.schema = e.schema, p.schemaEnv = e, e.$async && (p.$async = !0), this.opts.code.source === !0 && (p.source = { validateName: c, validateCode: d, scopeValues: a._values }), this.opts.unevaluated) {
      const { props: $, items: _ } = u;
      p.evaluated = {
        props: $ instanceof zt.Name ? void 0 : $,
        items: _ instanceof zt.Name ? void 0 : _,
        dynamicProps: $ instanceof zt.Name,
        dynamicItems: _ instanceof zt.Name
      }, p.source && (p.source.evaluated = (0, zt.stringify)(p.evaluated));
    }
    return e.validate = p, e;
  } catch (d) {
    throw delete e.validate, delete e.validateName, l && this.logger.error("Error compiling schema, function code:", l), d;
  } finally {
    this._compilations.delete(e);
  }
}
Tt.compileSchema = $d;
function SO(e, t, r) {
  var n;
  r = (0, er.resolveUrl)(this.opts.uriResolver, t, r);
  const i = e.refs[r];
  if (i)
    return i;
  let s = NO.call(this, e, r);
  if (s === void 0) {
    const a = (n = e.localRefs) === null || n === void 0 ? void 0 : n[r], { schemaId: o } = this.opts;
    a && (s = new Xo({ schema: a, schemaId: o, root: e, baseId: t }));
  }
  if (s !== void 0)
    return e.refs[r] = PO.call(this, s);
}
Tt.resolveRef = SO;
function PO(e) {
  return (0, er.inlineRef)(e.schema, this.opts.inlineRefs) ? e.schema : e.validate ? e : $d.call(this, e);
}
function Kg(e) {
  for (const t of this._compilations)
    if (TO(t, e))
      return t;
}
Tt.getCompilingSchema = Kg;
function TO(e, t) {
  return e.schema === t.schema && e.root === t.root && e.baseId === t.baseId;
}
function NO(e, t) {
  let r;
  for (; typeof (r = this.refs[t]) == "string"; )
    t = r;
  return r || this.schemas[t] || Jo.call(this, e, t);
}
function Jo(e, t) {
  const r = this.opts.uriResolver.parse(t), n = (0, er._getFullPath)(this.opts.uriResolver, r);
  let i = (0, er.getFullPath)(this.opts.uriResolver, e.baseId, void 0);
  if (Object.keys(e.schema).length > 0 && n === i)
    return xc.call(this, r, e);
  const s = (0, er.normalizeId)(n), a = this.refs[s] || this.schemas[s];
  if (typeof a == "string") {
    const o = Jo.call(this, e, a);
    return typeof (o == null ? void 0 : o.schema) != "object" ? void 0 : xc.call(this, r, o);
  }
  if (typeof (a == null ? void 0 : a.schema) == "object") {
    if (a.validate || $d.call(this, a), s === (0, er.normalizeId)(t)) {
      const { schema: o } = a, { schemaId: c } = this.opts, u = o[c];
      return u && (i = (0, er.resolveUrl)(this.opts.uriResolver, i, u)), new Xo({ schema: o, schemaId: c, root: e, baseId: i });
    }
    return xc.call(this, r, a);
  }
}
Tt.resolveSchema = Jo;
const OO = /* @__PURE__ */ new Set([
  "properties",
  "patternProperties",
  "enum",
  "dependencies",
  "definitions"
]);
function xc(e, { baseId: t, schema: r, root: n }) {
  var i;
  if (((i = e.fragment) === null || i === void 0 ? void 0 : i[0]) !== "/")
    return;
  for (const o of e.fragment.slice(1).split("/")) {
    if (typeof r == "boolean")
      return;
    const c = r[(0, Bh.unescapeFragment)(o)];
    if (c === void 0)
      return;
    r = c;
    const u = typeof r == "object" && r[this.opts.schemaId];
    !OO.has(o) && u && (t = (0, er.resolveUrl)(this.opts.uriResolver, t, u));
  }
  let s;
  if (typeof r != "boolean" && r.$ref && !(0, Bh.schemaHasRulesButRef)(r, this.RULES)) {
    const o = (0, er.resolveUrl)(this.opts.uriResolver, t, r.$ref);
    s = Jo.call(this, n, o);
  }
  const { schemaId: a } = this.opts;
  if (s = s || new Xo({ schema: r, schemaId: a, root: n, baseId: t }), s.schema !== s.root.schema)
    return s;
}
const AO = "https://raw.githubusercontent.com/ajv-validator/ajv/master/lib/refs/data.json#", CO = "Meta-schema for $data reference (JSON AnySchema extension proposal)", RO = "object", IO = [
  "$data"
], DO = {
  $data: {
    type: "string",
    anyOf: [
      {
        format: "relative-json-pointer"
      },
      {
        format: "json-pointer"
      }
    ]
  }
}, kO = !1, FO = {
  $id: AO,
  description: CO,
  type: RO,
  required: IO,
  properties: DO,
  additionalProperties: kO
};
var wd = {};
Object.defineProperty(wd, "__esModule", { value: !0 });
const Wg = ng;
Wg.code = 'require("ajv/dist/runtime/uri").default';
wd.default = Wg;
(function(e) {
  Object.defineProperty(e, "__esModule", { value: !0 }), e.CodeGen = e.Name = e.nil = e.stringify = e.str = e._ = e.KeywordCxt = void 0;
  var t = rr;
  Object.defineProperty(e, "KeywordCxt", { enumerable: !0, get: function() {
    return t.KeywordCxt;
  } });
  var r = de;
  Object.defineProperty(e, "_", { enumerable: !0, get: function() {
    return r._;
  } }), Object.defineProperty(e, "str", { enumerable: !0, get: function() {
    return r.str;
  } }), Object.defineProperty(e, "stringify", { enumerable: !0, get: function() {
    return r.stringify;
  } }), Object.defineProperty(e, "nil", { enumerable: !0, get: function() {
    return r.nil;
  } }), Object.defineProperty(e, "Name", { enumerable: !0, get: function() {
    return r.Name;
  } }), Object.defineProperty(e, "CodeGen", { enumerable: !0, get: function() {
    return r.CodeGen;
  } });
  const n = Qs, i = Bi, s = Gn, a = Tt, o = de, c = Je, u = xe, l = Y, d = FO, h = wd, p = (I, b) => new RegExp(I, b);
  p.code = "new RegExp";
  const $ = ["removeAdditional", "useDefaults", "coerceTypes"], _ = /* @__PURE__ */ new Set([
    "validate",
    "serialize",
    "parse",
    "wrapper",
    "root",
    "schema",
    "keyword",
    "pattern",
    "formats",
    "validate$data",
    "func",
    "obj",
    "Error"
  ]), v = {
    errorDataPath: "",
    format: "`validateFormats: false` can be used instead.",
    nullable: '"nullable" keyword is supported by default.',
    jsonPointers: "Deprecated jsPropertySyntax can be used instead.",
    extendRefs: "Deprecated ignoreKeywordsWithRef can be used instead.",
    missingRefs: "Pass empty schema with $id that should be ignored to ajv.addSchema.",
    processCode: "Use option `code: {process: (code, schemaEnv: object) => string}`",
    sourceCode: "Use option `code: {source: true}`",
    strictDefaults: "It is default now, see option `strict`.",
    strictKeywords: "It is default now, see option `strict`.",
    uniqueItems: '"uniqueItems" keyword is always validated.',
    unknownFormats: "Disable strict mode or pass `true` to `ajv.addFormat` (or `formats` option).",
    cache: "Map is used as cache, schema object as key.",
    serialize: "Map is used as cache, schema object as key.",
    ajvErrors: "It is default now."
  }, m = {
    ignoreKeywordsWithRef: "",
    jsPropertySyntax: "",
    unicode: '"minLength"/"maxLength" account for unicode characters by default.'
  }, E = 200;
  function T(I) {
    var b, O, S, f, g, N, w, y, k, A, W, fe, ge, be, Ne, et, _e, Le, Bt, Ft, At, jt, _r, vr, $r;
    const Ct = I.strict, Lt = (b = I.code) === null || b === void 0 ? void 0 : b.optimize, wr = Lt === !0 || Lt === void 0 ? 1 : Lt || 0, jr = (S = (O = I.code) === null || O === void 0 ? void 0 : O.regExp) !== null && S !== void 0 ? S : p, Et = (f = I.uriResolver) !== null && f !== void 0 ? f : h.default;
    return {
      strictSchema: (N = (g = I.strictSchema) !== null && g !== void 0 ? g : Ct) !== null && N !== void 0 ? N : !0,
      strictNumbers: (y = (w = I.strictNumbers) !== null && w !== void 0 ? w : Ct) !== null && y !== void 0 ? y : !0,
      strictTypes: (A = (k = I.strictTypes) !== null && k !== void 0 ? k : Ct) !== null && A !== void 0 ? A : "log",
      strictTuples: (fe = (W = I.strictTuples) !== null && W !== void 0 ? W : Ct) !== null && fe !== void 0 ? fe : "log",
      strictRequired: (be = (ge = I.strictRequired) !== null && ge !== void 0 ? ge : Ct) !== null && be !== void 0 ? be : !1,
      code: I.code ? { ...I.code, optimize: wr, regExp: jr } : { optimize: wr, regExp: jr },
      loopRequired: (Ne = I.loopRequired) !== null && Ne !== void 0 ? Ne : E,
      loopEnum: (et = I.loopEnum) !== null && et !== void 0 ? et : E,
      meta: (_e = I.meta) !== null && _e !== void 0 ? _e : !0,
      messages: (Le = I.messages) !== null && Le !== void 0 ? Le : !0,
      inlineRefs: (Bt = I.inlineRefs) !== null && Bt !== void 0 ? Bt : !0,
      schemaId: (Ft = I.schemaId) !== null && Ft !== void 0 ? Ft : "$id",
      addUsedSchema: (At = I.addUsedSchema) !== null && At !== void 0 ? At : !0,
      validateSchema: (jt = I.validateSchema) !== null && jt !== void 0 ? jt : !0,
      validateFormats: (_r = I.validateFormats) !== null && _r !== void 0 ? _r : !0,
      unicodeRegExp: (vr = I.unicodeRegExp) !== null && vr !== void 0 ? vr : !0,
      int32range: ($r = I.int32range) !== null && $r !== void 0 ? $r : !0,
      uriResolver: Et
    };
  }
  class R {
    constructor(b = {}) {
      this.schemas = {}, this.refs = {}, this.formats = {}, this._compilations = /* @__PURE__ */ new Set(), this._loading = {}, this._cache = /* @__PURE__ */ new Map(), b = this.opts = { ...b, ...T(b) };
      const { es5: O, lines: S } = this.opts.code;
      this.scope = new o.ValueScope({ scope: {}, prefixes: _, es5: O, lines: S }), this.logger = V(b.logger);
      const f = b.validateFormats;
      b.validateFormats = !1, this.RULES = (0, s.getRules)(), F.call(this, v, b, "NOT SUPPORTED"), F.call(this, m, b, "DEPRECATED", "warn"), this._metaOpts = J.call(this), b.formats && ie.call(this), this._addVocabularies(), this._addDefaultMetaSchema(), b.keywords && C.call(this, b.keywords), typeof b.meta == "object" && this.addMetaSchema(b.meta), G.call(this), b.validateFormats = f;
    }
    _addVocabularies() {
      this.addKeyword("$async");
    }
    _addDefaultMetaSchema() {
      const { $data: b, meta: O, schemaId: S } = this.opts;
      let f = d;
      S === "id" && (f = { ...d }, f.id = f.$id, delete f.$id), O && b && this.addMetaSchema(f, f[S], !1);
    }
    defaultMeta() {
      const { meta: b, schemaId: O } = this.opts;
      return this.opts.defaultMeta = typeof b == "object" ? b[O] || b : void 0;
    }
    validate(b, O) {
      let S;
      if (typeof b == "string") {
        if (S = this.getSchema(b), !S)
          throw new Error(`no schema with key or ref "${b}"`);
      } else
        S = this.compile(b);
      const f = S(O);
      return "$async" in S || (this.errors = S.errors), f;
    }
    compile(b, O) {
      const S = this._addSchema(b, O);
      return S.validate || this._compileSchemaEnv(S);
    }
    compileAsync(b, O) {
      if (typeof this.opts.loadSchema != "function")
        throw new Error("options.loadSchema should be a function");
      const { loadSchema: S } = this.opts;
      return f.call(this, b, O);
      async function f(A, W) {
        await g.call(this, A.$schema);
        const fe = this._addSchema(A, W);
        return fe.validate || N.call(this, fe);
      }
      async function g(A) {
        A && !this.getSchema(A) && await f.call(this, { $ref: A }, !0);
      }
      async function N(A) {
        try {
          return this._compileSchemaEnv(A);
        } catch (W) {
          if (!(W instanceof i.default))
            throw W;
          return w.call(this, W), await y.call(this, W.missingSchema), N.call(this, A);
        }
      }
      function w({ missingSchema: A, missingRef: W }) {
        if (this.refs[A])
          throw new Error(`AnySchema ${A} is loaded but ${W} cannot be resolved`);
      }
      async function y(A) {
        const W = await k.call(this, A);
        this.refs[A] || await g.call(this, W.$schema), this.refs[A] || this.addSchema(W, A, O);
      }
      async function k(A) {
        const W = this._loading[A];
        if (W)
          return W;
        try {
          return await (this._loading[A] = S(A));
        } finally {
          delete this._loading[A];
        }
      }
    }
    // Adds schema to the instance
    addSchema(b, O, S, f = this.opts.validateSchema) {
      if (Array.isArray(b)) {
        for (const N of b)
          this.addSchema(N, void 0, S, f);
        return this;
      }
      let g;
      if (typeof b == "object") {
        const { schemaId: N } = this.opts;
        if (g = b[N], g !== void 0 && typeof g != "string")
          throw new Error(`schema ${N} must be string`);
      }
      return O = (0, c.normalizeId)(O || g), this._checkUnique(O), this.schemas[O] = this._addSchema(b, S, O, f, !0), this;
    }
    // Add schema that will be used to validate other schemas
    // options in META_IGNORE_OPTIONS are alway set to false
    addMetaSchema(b, O, S = this.opts.validateSchema) {
      return this.addSchema(b, O, !0, S), this;
    }
    //  Validate schema against its meta-schema
    validateSchema(b, O) {
      if (typeof b == "boolean")
        return !0;
      let S;
      if (S = b.$schema, S !== void 0 && typeof S != "string")
        throw new Error("$schema must be a string");
      if (S = S || this.opts.defaultMeta || this.defaultMeta(), !S)
        return this.logger.warn("meta-schema not available"), this.errors = null, !0;
      const f = this.validate(S, b);
      if (!f && O) {
        const g = "schema is invalid: " + this.errorsText();
        if (this.opts.validateSchema === "log")
          this.logger.error(g);
        else
          throw new Error(g);
      }
      return f;
    }
    // Get compiled schema by `key` or `ref`.
    // (`key` that was passed to `addSchema` or full schema reference - `schema.$id` or resolved id)
    getSchema(b) {
      let O;
      for (; typeof (O = H.call(this, b)) == "string"; )
        b = O;
      if (O === void 0) {
        const { schemaId: S } = this.opts, f = new a.SchemaEnv({ schema: {}, schemaId: S });
        if (O = a.resolveSchema.call(this, f, b), !O)
          return;
        this.refs[b] = O;
      }
      return O.validate || this._compileSchemaEnv(O);
    }
    // Remove cached schema(s).
    // If no parameter is passed all schemas but meta-schemas are removed.
    // If RegExp is passed all schemas with key/id matching pattern but meta-schemas are removed.
    // Even if schema is referenced by other schemas it still can be removed as other schemas have local references.
    removeSchema(b) {
      if (b instanceof RegExp)
        return this._removeAllSchemas(this.schemas, b), this._removeAllSchemas(this.refs, b), this;
      switch (typeof b) {
        case "undefined":
          return this._removeAllSchemas(this.schemas), this._removeAllSchemas(this.refs), this._cache.clear(), this;
        case "string": {
          const O = H.call(this, b);
          return typeof O == "object" && this._cache.delete(O.schema), delete this.schemas[b], delete this.refs[b], this;
        }
        case "object": {
          const O = b;
          this._cache.delete(O);
          let S = b[this.opts.schemaId];
          return S && (S = (0, c.normalizeId)(S), delete this.schemas[S], delete this.refs[S]), this;
        }
        default:
          throw new Error("ajv.removeSchema: invalid parameter");
      }
    }
    // add "vocabulary" - a collection of keywords
    addVocabulary(b) {
      for (const O of b)
        this.addKeyword(O);
      return this;
    }
    addKeyword(b, O) {
      let S;
      if (typeof b == "string")
        S = b, typeof O == "object" && (this.logger.warn("these parameters are deprecated, see docs for addKeyword"), O.keyword = S);
      else if (typeof b == "object" && O === void 0) {
        if (O = b, S = O.keyword, Array.isArray(S) && !S.length)
          throw new Error("addKeywords: keyword must be string or non-empty array");
      } else
        throw new Error("invalid addKeywords parameters");
      if (L.call(this, S, O), !O)
        return (0, l.eachItem)(S, (g) => U.call(this, g)), this;
      M.call(this, O);
      const f = {
        ...O,
        type: (0, u.getJSONTypes)(O.type),
        schemaType: (0, u.getJSONTypes)(O.schemaType)
      };
      return (0, l.eachItem)(S, f.type.length === 0 ? (g) => U.call(this, g, f) : (g) => f.type.forEach((N) => U.call(this, g, f, N))), this;
    }
    getKeyword(b) {
      const O = this.RULES.all[b];
      return typeof O == "object" ? O.definition : !!O;
    }
    // Remove keyword
    removeKeyword(b) {
      const { RULES: O } = this;
      delete O.keywords[b], delete O.all[b];
      for (const S of O.rules) {
        const f = S.rules.findIndex((g) => g.keyword === b);
        f >= 0 && S.rules.splice(f, 1);
      }
      return this;
    }
    // Add format
    addFormat(b, O) {
      return typeof O == "string" && (O = new RegExp(O)), this.formats[b] = O, this;
    }
    errorsText(b = this.errors, { separator: O = ", ", dataVar: S = "data" } = {}) {
      return !b || b.length === 0 ? "No errors" : b.map((f) => `${S}${f.instancePath} ${f.message}`).reduce((f, g) => f + O + g);
    }
    $dataMetaSchema(b, O) {
      const S = this.RULES.all;
      b = JSON.parse(JSON.stringify(b));
      for (const f of O) {
        const g = f.split("/").slice(1);
        let N = b;
        for (const w of g)
          N = N[w];
        for (const w in S) {
          const y = S[w];
          if (typeof y != "object")
            continue;
          const { $data: k } = y.definition, A = N[w];
          k && A && (N[w] = q(A));
        }
      }
      return b;
    }
    _removeAllSchemas(b, O) {
      for (const S in b) {
        const f = b[S];
        (!O || O.test(S)) && (typeof f == "string" ? delete b[S] : f && !f.meta && (this._cache.delete(f.schema), delete b[S]));
      }
    }
    _addSchema(b, O, S, f = this.opts.validateSchema, g = this.opts.addUsedSchema) {
      let N;
      const { schemaId: w } = this.opts;
      if (typeof b == "object")
        N = b[w];
      else {
        if (this.opts.jtd)
          throw new Error("schema must be object");
        if (typeof b != "boolean")
          throw new Error("schema must be object or boolean");
      }
      let y = this._cache.get(b);
      if (y !== void 0)
        return y;
      S = (0, c.normalizeId)(N || S);
      const k = c.getSchemaRefs.call(this, b, S);
      return y = new a.SchemaEnv({ schema: b, schemaId: w, meta: O, baseId: S, localRefs: k }), this._cache.set(y.schema, y), g && !S.startsWith("#") && (S && this._checkUnique(S), this.refs[S] = y), f && this.validateSchema(b, !0), y;
    }
    _checkUnique(b) {
      if (this.schemas[b] || this.refs[b])
        throw new Error(`schema with key or id "${b}" already exists`);
    }
    _compileSchemaEnv(b) {
      if (b.meta ? this._compileMetaSchema(b) : a.compileSchema.call(this, b), !b.validate)
        throw new Error("ajv implementation error");
      return b.validate;
    }
    _compileMetaSchema(b) {
      const O = this.opts;
      this.opts = this._metaOpts;
      try {
        a.compileSchema.call(this, b);
      } finally {
        this.opts = O;
      }
    }
  }
  R.ValidationError = n.default, R.MissingRefError = i.default, e.default = R;
  function F(I, b, O, S = "error") {
    for (const f in I) {
      const g = f;
      g in b && this.logger[S](`${O}: option ${f}. ${I[g]}`);
    }
  }
  function H(I) {
    return I = (0, c.normalizeId)(I), this.schemas[I] || this.refs[I];
  }
  function G() {
    const I = this.opts.schemas;
    if (I)
      if (Array.isArray(I))
        this.addSchema(I);
      else
        for (const b in I)
          this.addSchema(I[b], b);
  }
  function ie() {
    for (const I in this.opts.formats) {
      const b = this.opts.formats[I];
      b && this.addFormat(I, b);
    }
  }
  function C(I) {
    if (Array.isArray(I)) {
      this.addVocabulary(I);
      return;
    }
    this.logger.warn("keywords option as map is deprecated, pass array");
    for (const b in I) {
      const O = I[b];
      O.keyword || (O.keyword = b), this.addKeyword(O);
    }
  }
  function J() {
    const I = { ...this.opts };
    for (const b of $)
      delete I[b];
    return I;
  }
  const j = { log() {
  }, warn() {
  }, error() {
  } };
  function V(I) {
    if (I === !1)
      return j;
    if (I === void 0)
      return console;
    if (I.log && I.warn && I.error)
      return I;
    throw new Error("logger must implement log, warn and error methods");
  }
  const Q = /^[a-z_$][a-z0-9_$:-]*$/i;
  function L(I, b) {
    const { RULES: O } = this;
    if ((0, l.eachItem)(I, (S) => {
      if (O.keywords[S])
        throw new Error(`Keyword ${S} is already defined`);
      if (!Q.test(S))
        throw new Error(`Keyword ${S} has invalid name`);
    }), !!b && b.$data && !("code" in b || "validate" in b))
      throw new Error('$data keyword must have "code" or "validate" function');
  }
  function U(I, b, O) {
    var S;
    const f = b == null ? void 0 : b.post;
    if (O && f)
      throw new Error('keyword with "post" flag cannot have "type"');
    const { RULES: g } = this;
    let N = f ? g.post : g.rules.find(({ type: y }) => y === O);
    if (N || (N = { type: O, rules: [] }, g.rules.push(N)), g.keywords[I] = !0, !b)
      return;
    const w = {
      keyword: I,
      definition: {
        ...b,
        type: (0, u.getJSONTypes)(b.type),
        schemaType: (0, u.getJSONTypes)(b.schemaType)
      }
    };
    b.before ? B.call(this, N, w, b.before) : N.rules.push(w), g.all[I] = w, (S = b.implements) === null || S === void 0 || S.forEach((y) => this.addKeyword(y));
  }
  function B(I, b, O) {
    const S = I.rules.findIndex((f) => f.keyword === O);
    S >= 0 ? I.rules.splice(S, 0, b) : (I.rules.push(b), this.logger.warn(`rule ${O} is not defined`));
  }
  function M(I) {
    let { metaSchema: b } = I;
    b !== void 0 && (I.$data && this.opts.$data && (b = q(b)), I.validateSchema = this.compile(b, !0));
  }
  const z = {
    $ref: "https://raw.githubusercontent.com/ajv-validator/ajv/master/lib/refs/data.json#"
  };
  function q(I) {
    return { anyOf: [I, z] };
  }
})(yg);
var Ed = {}, bd = {}, Sd = {};
Object.defineProperty(Sd, "__esModule", { value: !0 });
const jO = {
  keyword: "id",
  code() {
    throw new Error('NOT SUPPORTED: keyword "id", use "$id" for schema ID');
  }
};
Sd.default = jO;
var zn = {};
Object.defineProperty(zn, "__esModule", { value: !0 });
zn.callRef = zn.getValidate = void 0;
const LO = Bi, Hh = me, Pt = de, ni = yr, Gh = Tt, Na = Y, UO = {
  keyword: "$ref",
  schemaType: "string",
  code(e) {
    const { gen: t, schema: r, it: n } = e, { baseId: i, schemaEnv: s, validateName: a, opts: o, self: c } = n, { root: u } = s;
    if ((r === "#" || r === "#/") && i === u.baseId)
      return d();
    const l = Gh.resolveRef.call(c, u, i, r);
    if (l === void 0)
      throw new LO.default(n.opts.uriResolver, i, r);
    if (l instanceof Gh.SchemaEnv)
      return h(l);
    return p(l);
    function d() {
      if (s === u)
        return so(e, a, s, s.$async);
      const $ = t.scopeValue("root", { ref: u });
      return so(e, (0, Pt._)`${$}.validate`, u, u.$async);
    }
    function h($) {
      const _ = Yg(e, $);
      so(e, _, $, $.$async);
    }
    function p($) {
      const _ = t.scopeValue("schema", o.code.source === !0 ? { ref: $, code: (0, Pt.stringify)($) } : { ref: $ }), v = t.name("valid"), m = e.subschema({
        schema: $,
        dataTypes: [],
        schemaPath: Pt.nil,
        topSchemaRef: _,
        errSchemaPath: r
      }, v);
      e.mergeEvaluated(m), e.ok(v);
    }
  }
};
function Yg(e, t) {
  const { gen: r } = e;
  return t.validate ? r.scopeValue("validate", { ref: t.validate }) : (0, Pt._)`${r.scopeValue("wrapper", { ref: t })}.validate`;
}
zn.getValidate = Yg;
function so(e, t, r, n) {
  const { gen: i, it: s } = e, { allErrors: a, schemaEnv: o, opts: c } = s, u = c.passContext ? ni.default.this : Pt.nil;
  n ? l() : d();
  function l() {
    if (!o.$async)
      throw new Error("async schema referenced by sync schema");
    const $ = i.let("valid");
    i.try(() => {
      i.code((0, Pt._)`await ${(0, Hh.callValidateCode)(e, t, u)}`), p(t), a || i.assign($, !0);
    }, (_) => {
      i.if((0, Pt._)`!(${_} instanceof ${s.ValidationError})`, () => i.throw(_)), h(_), a || i.assign($, !1);
    }), e.ok($);
  }
  function d() {
    e.result((0, Hh.callValidateCode)(e, t, u), () => p(t), () => h(t));
  }
  function h($) {
    const _ = (0, Pt._)`${$}.errors`;
    i.assign(ni.default.vErrors, (0, Pt._)`${ni.default.vErrors} === null ? ${_} : ${ni.default.vErrors}.concat(${_})`), i.assign(ni.default.errors, (0, Pt._)`${ni.default.vErrors}.length`);
  }
  function p($) {
    var _;
    if (!s.opts.unevaluated)
      return;
    const v = (_ = r == null ? void 0 : r.validate) === null || _ === void 0 ? void 0 : _.evaluated;
    if (s.props !== !0)
      if (v && !v.dynamicProps)
        v.props !== void 0 && (s.props = Na.mergeEvaluated.props(i, v.props, s.props));
      else {
        const m = i.var("props", (0, Pt._)`${$}.evaluated.props`);
        s.props = Na.mergeEvaluated.props(i, m, s.props, Pt.Name);
      }
    if (s.items !== !0)
      if (v && !v.dynamicItems)
        v.items !== void 0 && (s.items = Na.mergeEvaluated.items(i, v.items, s.items));
      else {
        const m = i.var("items", (0, Pt._)`${$}.evaluated.items`);
        s.items = Na.mergeEvaluated.items(i, m, s.items, Pt.Name);
      }
  }
}
zn.callRef = so;
zn.default = UO;
Object.defineProperty(bd, "__esModule", { value: !0 });
const MO = Sd, xO = zn, VO = [
  "$schema",
  "$id",
  "$defs",
  "$vocabulary",
  { keyword: "$comment" },
  "definitions",
  MO.default,
  xO.default
];
bd.default = VO;
var Pd = {}, Td = {};
Object.defineProperty(Td, "__esModule", { value: !0 });
const wo = de, zr = wo.operators, Eo = {
  maximum: { okStr: "<=", ok: zr.LTE, fail: zr.GT },
  minimum: { okStr: ">=", ok: zr.GTE, fail: zr.LT },
  exclusiveMaximum: { okStr: "<", ok: zr.LT, fail: zr.GTE },
  exclusiveMinimum: { okStr: ">", ok: zr.GT, fail: zr.LTE }
}, qO = {
  message: ({ keyword: e, schemaCode: t }) => (0, wo.str)`must be ${Eo[e].okStr} ${t}`,
  params: ({ keyword: e, schemaCode: t }) => (0, wo._)`{comparison: ${Eo[e].okStr}, limit: ${t}}`
}, BO = {
  keyword: Object.keys(Eo),
  type: "number",
  schemaType: "number",
  $data: !0,
  error: qO,
  code(e) {
    const { keyword: t, data: r, schemaCode: n } = e;
    e.fail$data((0, wo._)`${r} ${Eo[t].fail} ${n} || isNaN(${r})`);
  }
};
Td.default = BO;
var Nd = {};
Object.defineProperty(Nd, "__esModule", { value: !0 });
const ws = de, HO = {
  message: ({ schemaCode: e }) => (0, ws.str)`must be multiple of ${e}`,
  params: ({ schemaCode: e }) => (0, ws._)`{multipleOf: ${e}}`
}, GO = {
  keyword: "multipleOf",
  type: "number",
  schemaType: "number",
  $data: !0,
  error: HO,
  code(e) {
    const { gen: t, data: r, schemaCode: n, it: i } = e, s = i.opts.multipleOfPrecision, a = t.let("res"), o = s ? (0, ws._)`Math.abs(Math.round(${a}) - ${a}) > 1e-${s}` : (0, ws._)`${a} !== parseInt(${a})`;
    e.fail$data((0, ws._)`(${n} === 0 || (${a} = ${r}/${n}, ${o}))`);
  }
};
Nd.default = GO;
var Od = {}, Ad = {};
Object.defineProperty(Ad, "__esModule", { value: !0 });
function Xg(e) {
  const t = e.length;
  let r = 0, n = 0, i;
  for (; n < t; )
    r++, i = e.charCodeAt(n++), i >= 55296 && i <= 56319 && n < t && (i = e.charCodeAt(n), (i & 64512) === 56320 && n++);
  return r;
}
Ad.default = Xg;
Xg.code = 'require("ajv/dist/runtime/ucs2length").default';
Object.defineProperty(Od, "__esModule", { value: !0 });
const Fn = de, zO = Y, KO = Ad, WO = {
  message({ keyword: e, schemaCode: t }) {
    const r = e === "maxLength" ? "more" : "fewer";
    return (0, Fn.str)`must NOT have ${r} than ${t} characters`;
  },
  params: ({ schemaCode: e }) => (0, Fn._)`{limit: ${e}}`
}, YO = {
  keyword: ["maxLength", "minLength"],
  type: "string",
  schemaType: "number",
  $data: !0,
  error: WO,
  code(e) {
    const { keyword: t, data: r, schemaCode: n, it: i } = e, s = t === "maxLength" ? Fn.operators.GT : Fn.operators.LT, a = i.opts.unicode === !1 ? (0, Fn._)`${r}.length` : (0, Fn._)`${(0, zO.useFunc)(e.gen, KO.default)}(${r})`;
    e.fail$data((0, Fn._)`${a} ${s} ${n}`);
  }
};
Od.default = YO;
var Cd = {};
Object.defineProperty(Cd, "__esModule", { value: !0 });
const XO = me, bo = de, JO = {
  message: ({ schemaCode: e }) => (0, bo.str)`must match pattern "${e}"`,
  params: ({ schemaCode: e }) => (0, bo._)`{pattern: ${e}}`
}, QO = {
  keyword: "pattern",
  type: "string",
  schemaType: "string",
  $data: !0,
  error: JO,
  code(e) {
    const { data: t, $data: r, schema: n, schemaCode: i, it: s } = e, a = s.opts.unicodeRegExp ? "u" : "", o = r ? (0, bo._)`(new RegExp(${i}, ${a}))` : (0, XO.usePattern)(e, n);
    e.fail$data((0, bo._)`!${o}.test(${t})`);
  }
};
Cd.default = QO;
var Rd = {};
Object.defineProperty(Rd, "__esModule", { value: !0 });
const Es = de, ZO = {
  message({ keyword: e, schemaCode: t }) {
    const r = e === "maxProperties" ? "more" : "fewer";
    return (0, Es.str)`must NOT have ${r} than ${t} properties`;
  },
  params: ({ schemaCode: e }) => (0, Es._)`{limit: ${e}}`
}, eA = {
  keyword: ["maxProperties", "minProperties"],
  type: "object",
  schemaType: "number",
  $data: !0,
  error: ZO,
  code(e) {
    const { keyword: t, data: r, schemaCode: n } = e, i = t === "maxProperties" ? Es.operators.GT : Es.operators.LT;
    e.fail$data((0, Es._)`Object.keys(${r}).length ${i} ${n}`);
  }
};
Rd.default = eA;
var Id = {};
Object.defineProperty(Id, "__esModule", { value: !0 });
const ss = me, bs = de, tA = Y, rA = {
  message: ({ params: { missingProperty: e } }) => (0, bs.str)`must have required property '${e}'`,
  params: ({ params: { missingProperty: e } }) => (0, bs._)`{missingProperty: ${e}}`
}, nA = {
  keyword: "required",
  type: "object",
  schemaType: "array",
  $data: !0,
  error: rA,
  code(e) {
    const { gen: t, schema: r, schemaCode: n, data: i, $data: s, it: a } = e, { opts: o } = a;
    if (!s && r.length === 0)
      return;
    const c = r.length >= o.loopRequired;
    if (a.allErrors ? u() : l(), o.strictRequired) {
      const p = e.parentSchema.properties, { definedProperties: $ } = e.it;
      for (const _ of r)
        if ((p == null ? void 0 : p[_]) === void 0 && !$.has(_)) {
          const v = a.schemaEnv.baseId + a.errSchemaPath, m = `required property "${_}" is not defined at "${v}" (strictRequired)`;
          (0, tA.checkStrictMode)(a, m, a.opts.strictRequired);
        }
    }
    function u() {
      if (c || s)
        e.block$data(bs.nil, d);
      else
        for (const p of r)
          (0, ss.checkReportMissingProp)(e, p);
    }
    function l() {
      const p = t.let("missing");
      if (c || s) {
        const $ = t.let("valid", !0);
        e.block$data($, () => h(p, $)), e.ok($);
      } else
        t.if((0, ss.checkMissingProp)(e, r, p)), (0, ss.reportMissingProp)(e, p), t.else();
    }
    function d() {
      t.forOf("prop", n, (p) => {
        e.setParams({ missingProperty: p }), t.if((0, ss.noPropertyInData)(t, i, p, o.ownProperties), () => e.error());
      });
    }
    function h(p, $) {
      e.setParams({ missingProperty: p }), t.forOf(p, n, () => {
        t.assign($, (0, ss.propertyInData)(t, i, p, o.ownProperties)), t.if((0, bs.not)($), () => {
          e.error(), t.break();
        });
      }, bs.nil);
    }
  }
};
Id.default = nA;
var Dd = {};
Object.defineProperty(Dd, "__esModule", { value: !0 });
const Ss = de, iA = {
  message({ keyword: e, schemaCode: t }) {
    const r = e === "maxItems" ? "more" : "fewer";
    return (0, Ss.str)`must NOT have ${r} than ${t} items`;
  },
  params: ({ schemaCode: e }) => (0, Ss._)`{limit: ${e}}`
}, sA = {
  keyword: ["maxItems", "minItems"],
  type: "array",
  schemaType: "number",
  $data: !0,
  error: iA,
  code(e) {
    const { keyword: t, data: r, schemaCode: n } = e, i = t === "maxItems" ? Ss.operators.GT : Ss.operators.LT;
    e.fail$data((0, Ss._)`${r}.length ${i} ${n}`);
  }
};
Dd.default = sA;
var kd = {}, Zs = {};
Object.defineProperty(Zs, "__esModule", { value: !0 });
const Jg = qo;
Jg.code = 'require("ajv/dist/runtime/equal").default';
Zs.default = Jg;
Object.defineProperty(kd, "__esModule", { value: !0 });
const Vc = xe, We = de, aA = Y, oA = Zs, cA = {
  message: ({ params: { i: e, j: t } }) => (0, We.str)`must NOT have duplicate items (items ## ${t} and ${e} are identical)`,
  params: ({ params: { i: e, j: t } }) => (0, We._)`{i: ${e}, j: ${t}}`
}, lA = {
  keyword: "uniqueItems",
  type: "array",
  schemaType: "boolean",
  $data: !0,
  error: cA,
  code(e) {
    const { gen: t, data: r, $data: n, schema: i, parentSchema: s, schemaCode: a, it: o } = e;
    if (!n && !i)
      return;
    const c = t.let("valid"), u = s.items ? (0, Vc.getSchemaTypes)(s.items) : [];
    e.block$data(c, l, (0, We._)`${a} === false`), e.ok(c);
    function l() {
      const $ = t.let("i", (0, We._)`${r}.length`), _ = t.let("j");
      e.setParams({ i: $, j: _ }), t.assign(c, !0), t.if((0, We._)`${$} > 1`, () => (d() ? h : p)($, _));
    }
    function d() {
      return u.length > 0 && !u.some(($) => $ === "object" || $ === "array");
    }
    function h($, _) {
      const v = t.name("item"), m = (0, Vc.checkDataTypes)(u, v, o.opts.strictNumbers, Vc.DataType.Wrong), E = t.const("indices", (0, We._)`{}`);
      t.for((0, We._)`;${$}--;`, () => {
        t.let(v, (0, We._)`${r}[${$}]`), t.if(m, (0, We._)`continue`), u.length > 1 && t.if((0, We._)`typeof ${v} == "string"`, (0, We._)`${v} += "_"`), t.if((0, We._)`typeof ${E}[${v}] == "number"`, () => {
          t.assign(_, (0, We._)`${E}[${v}]`), e.error(), t.assign(c, !1).break();
        }).code((0, We._)`${E}[${v}] = ${$}`);
      });
    }
    function p($, _) {
      const v = (0, aA.useFunc)(t, oA.default), m = t.name("outer");
      t.label(m).for((0, We._)`;${$}--;`, () => t.for((0, We._)`${_} = ${$}; ${_}--;`, () => t.if((0, We._)`${v}(${r}[${$}], ${r}[${_}])`, () => {
        e.error(), t.assign(c, !1).break(m);
      })));
    }
  }
};
kd.default = lA;
var Fd = {};
Object.defineProperty(Fd, "__esModule", { value: !0 });
const Vl = de, uA = Y, dA = Zs, fA = {
  message: "must be equal to constant",
  params: ({ schemaCode: e }) => (0, Vl._)`{allowedValue: ${e}}`
}, hA = {
  keyword: "const",
  $data: !0,
  error: fA,
  code(e) {
    const { gen: t, data: r, $data: n, schemaCode: i, schema: s } = e;
    n || s && typeof s == "object" ? e.fail$data((0, Vl._)`!${(0, uA.useFunc)(t, dA.default)}(${r}, ${i})`) : e.fail((0, Vl._)`${s} !== ${r}`);
  }
};
Fd.default = hA;
var jd = {};
Object.defineProperty(jd, "__esModule", { value: !0 });
const fs = de, pA = Y, mA = Zs, yA = {
  message: "must be equal to one of the allowed values",
  params: ({ schemaCode: e }) => (0, fs._)`{allowedValues: ${e}}`
}, gA = {
  keyword: "enum",
  schemaType: "array",
  $data: !0,
  error: yA,
  code(e) {
    const { gen: t, data: r, $data: n, schema: i, schemaCode: s, it: a } = e;
    if (!n && i.length === 0)
      throw new Error("enum must have non-empty array");
    const o = i.length >= a.opts.loopEnum;
    let c;
    const u = () => c ?? (c = (0, pA.useFunc)(t, mA.default));
    let l;
    if (o || n)
      l = t.let("valid"), e.block$data(l, d);
    else {
      if (!Array.isArray(i))
        throw new Error("ajv implementation error");
      const p = t.const("vSchema", s);
      l = (0, fs.or)(...i.map(($, _) => h(p, _)));
    }
    e.pass(l);
    function d() {
      t.assign(l, !1), t.forOf("v", s, (p) => t.if((0, fs._)`${u()}(${r}, ${p})`, () => t.assign(l, !0).break()));
    }
    function h(p, $) {
      const _ = i[$];
      return typeof _ == "object" && _ !== null ? (0, fs._)`${u()}(${r}, ${p}[${$}])` : (0, fs._)`${r} === ${_}`;
    }
  }
};
jd.default = gA;
Object.defineProperty(Pd, "__esModule", { value: !0 });
const _A = Td, vA = Nd, $A = Od, wA = Cd, EA = Rd, bA = Id, SA = Dd, PA = kd, TA = Fd, NA = jd, OA = [
  // number
  _A.default,
  vA.default,
  // string
  $A.default,
  wA.default,
  // object
  EA.default,
  bA.default,
  // array
  SA.default,
  PA.default,
  // any
  { keyword: "type", schemaType: ["string", "array"] },
  { keyword: "nullable", schemaType: "boolean" },
  TA.default,
  NA.default
];
Pd.default = OA;
var Ld = {}, Hi = {};
Object.defineProperty(Hi, "__esModule", { value: !0 });
Hi.validateAdditionalItems = void 0;
const jn = de, ql = Y, AA = {
  message: ({ params: { len: e } }) => (0, jn.str)`must NOT have more than ${e} items`,
  params: ({ params: { len: e } }) => (0, jn._)`{limit: ${e}}`
}, CA = {
  keyword: "additionalItems",
  type: "array",
  schemaType: ["boolean", "object"],
  before: "uniqueItems",
  error: AA,
  code(e) {
    const { parentSchema: t, it: r } = e, { items: n } = t;
    if (!Array.isArray(n)) {
      (0, ql.checkStrictMode)(r, '"additionalItems" is ignored when "items" is not an array of schemas');
      return;
    }
    Qg(e, n);
  }
};
function Qg(e, t) {
  const { gen: r, schema: n, data: i, keyword: s, it: a } = e;
  a.items = !0;
  const o = r.const("len", (0, jn._)`${i}.length`);
  if (n === !1)
    e.setParams({ len: t.length }), e.pass((0, jn._)`${o} <= ${t.length}`);
  else if (typeof n == "object" && !(0, ql.alwaysValidSchema)(a, n)) {
    const u = r.var("valid", (0, jn._)`${o} <= ${t.length}`);
    r.if((0, jn.not)(u), () => c(u)), e.ok(u);
  }
  function c(u) {
    r.forRange("i", t.length, o, (l) => {
      e.subschema({ keyword: s, dataProp: l, dataPropType: ql.Type.Num }, u), a.allErrors || r.if((0, jn.not)(u), () => r.break());
    });
  }
}
Hi.validateAdditionalItems = Qg;
Hi.default = CA;
var Ud = {}, Gi = {};
Object.defineProperty(Gi, "__esModule", { value: !0 });
Gi.validateTuple = void 0;
const zh = de, ao = Y, RA = me, IA = {
  keyword: "items",
  type: "array",
  schemaType: ["object", "array", "boolean"],
  before: "uniqueItems",
  code(e) {
    const { schema: t, it: r } = e;
    if (Array.isArray(t))
      return Zg(e, "additionalItems", t);
    r.items = !0, !(0, ao.alwaysValidSchema)(r, t) && e.ok((0, RA.validateArray)(e));
  }
};
function Zg(e, t, r = e.schema) {
  const { gen: n, parentSchema: i, data: s, keyword: a, it: o } = e;
  l(i), o.opts.unevaluated && r.length && o.items !== !0 && (o.items = ao.mergeEvaluated.items(n, r.length, o.items));
  const c = n.name("valid"), u = n.const("len", (0, zh._)`${s}.length`);
  r.forEach((d, h) => {
    (0, ao.alwaysValidSchema)(o, d) || (n.if((0, zh._)`${u} > ${h}`, () => e.subschema({
      keyword: a,
      schemaProp: h,
      dataProp: h
    }, c)), e.ok(c));
  });
  function l(d) {
    const { opts: h, errSchemaPath: p } = o, $ = r.length, _ = $ === d.minItems && ($ === d.maxItems || d[t] === !1);
    if (h.strictTuples && !_) {
      const v = `"${a}" is ${$}-tuple, but minItems or maxItems/${t} are not specified or different at path "${p}"`;
      (0, ao.checkStrictMode)(o, v, h.strictTuples);
    }
  }
}
Gi.validateTuple = Zg;
Gi.default = IA;
Object.defineProperty(Ud, "__esModule", { value: !0 });
const DA = Gi, kA = {
  keyword: "prefixItems",
  type: "array",
  schemaType: ["array"],
  before: "uniqueItems",
  code: (e) => (0, DA.validateTuple)(e, "items")
};
Ud.default = kA;
var Md = {};
Object.defineProperty(Md, "__esModule", { value: !0 });
const Kh = de, FA = Y, jA = me, LA = Hi, UA = {
  message: ({ params: { len: e } }) => (0, Kh.str)`must NOT have more than ${e} items`,
  params: ({ params: { len: e } }) => (0, Kh._)`{limit: ${e}}`
}, MA = {
  keyword: "items",
  type: "array",
  schemaType: ["object", "boolean"],
  before: "uniqueItems",
  error: UA,
  code(e) {
    const { schema: t, parentSchema: r, it: n } = e, { prefixItems: i } = r;
    n.items = !0, !(0, FA.alwaysValidSchema)(n, t) && (i ? (0, LA.validateAdditionalItems)(e, i) : e.ok((0, jA.validateArray)(e)));
  }
};
Md.default = MA;
var xd = {};
Object.defineProperty(xd, "__esModule", { value: !0 });
const qt = de, Oa = Y, xA = {
  message: ({ params: { min: e, max: t } }) => t === void 0 ? (0, qt.str)`must contain at least ${e} valid item(s)` : (0, qt.str)`must contain at least ${e} and no more than ${t} valid item(s)`,
  params: ({ params: { min: e, max: t } }) => t === void 0 ? (0, qt._)`{minContains: ${e}}` : (0, qt._)`{minContains: ${e}, maxContains: ${t}}`
}, VA = {
  keyword: "contains",
  type: "array",
  schemaType: ["object", "boolean"],
  before: "uniqueItems",
  trackErrors: !0,
  error: xA,
  code(e) {
    const { gen: t, schema: r, parentSchema: n, data: i, it: s } = e;
    let a, o;
    const { minContains: c, maxContains: u } = n;
    s.opts.next ? (a = c === void 0 ? 1 : c, o = u) : a = 1;
    const l = t.const("len", (0, qt._)`${i}.length`);
    if (e.setParams({ min: a, max: o }), o === void 0 && a === 0) {
      (0, Oa.checkStrictMode)(s, '"minContains" == 0 without "maxContains": "contains" keyword ignored');
      return;
    }
    if (o !== void 0 && a > o) {
      (0, Oa.checkStrictMode)(s, '"minContains" > "maxContains" is always invalid'), e.fail();
      return;
    }
    if ((0, Oa.alwaysValidSchema)(s, r)) {
      let _ = (0, qt._)`${l} >= ${a}`;
      o !== void 0 && (_ = (0, qt._)`${_} && ${l} <= ${o}`), e.pass(_);
      return;
    }
    s.items = !0;
    const d = t.name("valid");
    o === void 0 && a === 1 ? p(d, () => t.if(d, () => t.break())) : a === 0 ? (t.let(d, !0), o !== void 0 && t.if((0, qt._)`${i}.length > 0`, h)) : (t.let(d, !1), h()), e.result(d, () => e.reset());
    function h() {
      const _ = t.name("_valid"), v = t.let("count", 0);
      p(_, () => t.if(_, () => $(v)));
    }
    function p(_, v) {
      t.forRange("i", 0, l, (m) => {
        e.subschema({
          keyword: "contains",
          dataProp: m,
          dataPropType: Oa.Type.Num,
          compositeRule: !0
        }, _), v();
      });
    }
    function $(_) {
      t.code((0, qt._)`${_}++`), o === void 0 ? t.if((0, qt._)`${_} >= ${a}`, () => t.assign(d, !0).break()) : (t.if((0, qt._)`${_} > ${o}`, () => t.assign(d, !1).break()), a === 1 ? t.assign(d, !0) : t.if((0, qt._)`${_} >= ${a}`, () => t.assign(d, !0)));
    }
  }
};
xd.default = VA;
var e0 = {};
(function(e) {
  Object.defineProperty(e, "__esModule", { value: !0 }), e.validateSchemaDeps = e.validatePropertyDeps = e.error = void 0;
  const t = de, r = Y, n = me;
  e.error = {
    message: ({ params: { property: c, depsCount: u, deps: l } }) => {
      const d = u === 1 ? "property" : "properties";
      return (0, t.str)`must have ${d} ${l} when property ${c} is present`;
    },
    params: ({ params: { property: c, depsCount: u, deps: l, missingProperty: d } }) => (0, t._)`{property: ${c},
    missingProperty: ${d},
    depsCount: ${u},
    deps: ${l}}`
    // TODO change to reference
  };
  const i = {
    keyword: "dependencies",
    type: "object",
    schemaType: "object",
    error: e.error,
    code(c) {
      const [u, l] = s(c);
      a(c, u), o(c, l);
    }
  };
  function s({ schema: c }) {
    const u = {}, l = {};
    for (const d in c) {
      if (d === "__proto__")
        continue;
      const h = Array.isArray(c[d]) ? u : l;
      h[d] = c[d];
    }
    return [u, l];
  }
  function a(c, u = c.schema) {
    const { gen: l, data: d, it: h } = c;
    if (Object.keys(u).length === 0)
      return;
    const p = l.let("missing");
    for (const $ in u) {
      const _ = u[$];
      if (_.length === 0)
        continue;
      const v = (0, n.propertyInData)(l, d, $, h.opts.ownProperties);
      c.setParams({
        property: $,
        depsCount: _.length,
        deps: _.join(", ")
      }), h.allErrors ? l.if(v, () => {
        for (const m of _)
          (0, n.checkReportMissingProp)(c, m);
      }) : (l.if((0, t._)`${v} && (${(0, n.checkMissingProp)(c, _, p)})`), (0, n.reportMissingProp)(c, p), l.else());
    }
  }
  e.validatePropertyDeps = a;
  function o(c, u = c.schema) {
    const { gen: l, data: d, keyword: h, it: p } = c, $ = l.name("valid");
    for (const _ in u)
      (0, r.alwaysValidSchema)(p, u[_]) || (l.if(
        (0, n.propertyInData)(l, d, _, p.opts.ownProperties),
        () => {
          const v = c.subschema({ keyword: h, schemaProp: _ }, $);
          c.mergeValidEvaluated(v, $);
        },
        () => l.var($, !0)
        // TODO var
      ), c.ok($));
  }
  e.validateSchemaDeps = o, e.default = i;
})(e0);
var Vd = {};
Object.defineProperty(Vd, "__esModule", { value: !0 });
const t0 = de, qA = Y, BA = {
  message: "property name must be valid",
  params: ({ params: e }) => (0, t0._)`{propertyName: ${e.propertyName}}`
}, HA = {
  keyword: "propertyNames",
  type: "object",
  schemaType: ["object", "boolean"],
  error: BA,
  code(e) {
    const { gen: t, schema: r, data: n, it: i } = e;
    if ((0, qA.alwaysValidSchema)(i, r))
      return;
    const s = t.name("valid");
    t.forIn("key", n, (a) => {
      e.setParams({ propertyName: a }), e.subschema({
        keyword: "propertyNames",
        data: a,
        dataTypes: ["string"],
        propertyName: a,
        compositeRule: !0
      }, s), t.if((0, t0.not)(s), () => {
        e.error(!0), i.allErrors || t.break();
      });
    }), e.ok(s);
  }
};
Vd.default = HA;
var Qo = {};
Object.defineProperty(Qo, "__esModule", { value: !0 });
const Aa = me, Xt = de, GA = yr, Ca = Y, zA = {
  message: "must NOT have additional properties",
  params: ({ params: e }) => (0, Xt._)`{additionalProperty: ${e.additionalProperty}}`
}, KA = {
  keyword: "additionalProperties",
  type: ["object"],
  schemaType: ["boolean", "object"],
  allowUndefined: !0,
  trackErrors: !0,
  error: zA,
  code(e) {
    const { gen: t, schema: r, parentSchema: n, data: i, errsCount: s, it: a } = e;
    if (!s)
      throw new Error("ajv implementation error");
    const { allErrors: o, opts: c } = a;
    if (a.props = !0, c.removeAdditional !== "all" && (0, Ca.alwaysValidSchema)(a, r))
      return;
    const u = (0, Aa.allSchemaProperties)(n.properties), l = (0, Aa.allSchemaProperties)(n.patternProperties);
    d(), e.ok((0, Xt._)`${s} === ${GA.default.errors}`);
    function d() {
      t.forIn("key", i, (v) => {
        !u.length && !l.length ? $(v) : t.if(h(v), () => $(v));
      });
    }
    function h(v) {
      let m;
      if (u.length > 8) {
        const E = (0, Ca.schemaRefOrVal)(a, n.properties, "properties");
        m = (0, Aa.isOwnProperty)(t, E, v);
      } else u.length ? m = (0, Xt.or)(...u.map((E) => (0, Xt._)`${v} === ${E}`)) : m = Xt.nil;
      return l.length && (m = (0, Xt.or)(m, ...l.map((E) => (0, Xt._)`${(0, Aa.usePattern)(e, E)}.test(${v})`))), (0, Xt.not)(m);
    }
    function p(v) {
      t.code((0, Xt._)`delete ${i}[${v}]`);
    }
    function $(v) {
      if (c.removeAdditional === "all" || c.removeAdditional && r === !1) {
        p(v);
        return;
      }
      if (r === !1) {
        e.setParams({ additionalProperty: v }), e.error(), o || t.break();
        return;
      }
      if (typeof r == "object" && !(0, Ca.alwaysValidSchema)(a, r)) {
        const m = t.name("valid");
        c.removeAdditional === "failing" ? (_(v, m, !1), t.if((0, Xt.not)(m), () => {
          e.reset(), p(v);
        })) : (_(v, m), o || t.if((0, Xt.not)(m), () => t.break()));
      }
    }
    function _(v, m, E) {
      const T = {
        keyword: "additionalProperties",
        dataProp: v,
        dataPropType: Ca.Type.Str
      };
      E === !1 && Object.assign(T, {
        compositeRule: !0,
        createErrors: !1,
        allErrors: !1
      }), e.subschema(T, m);
    }
  }
};
Qo.default = KA;
var qd = {};
Object.defineProperty(qd, "__esModule", { value: !0 });
const WA = rr, Wh = me, qc = Y, Yh = Qo, YA = {
  keyword: "properties",
  type: "object",
  schemaType: "object",
  code(e) {
    const { gen: t, schema: r, parentSchema: n, data: i, it: s } = e;
    s.opts.removeAdditional === "all" && n.additionalProperties === void 0 && Yh.default.code(new WA.KeywordCxt(s, Yh.default, "additionalProperties"));
    const a = (0, Wh.allSchemaProperties)(r);
    for (const d of a)
      s.definedProperties.add(d);
    s.opts.unevaluated && a.length && s.props !== !0 && (s.props = qc.mergeEvaluated.props(t, (0, qc.toHash)(a), s.props));
    const o = a.filter((d) => !(0, qc.alwaysValidSchema)(s, r[d]));
    if (o.length === 0)
      return;
    const c = t.name("valid");
    for (const d of o)
      u(d) ? l(d) : (t.if((0, Wh.propertyInData)(t, i, d, s.opts.ownProperties)), l(d), s.allErrors || t.else().var(c, !0), t.endIf()), e.it.definedProperties.add(d), e.ok(c);
    function u(d) {
      return s.opts.useDefaults && !s.compositeRule && r[d].default !== void 0;
    }
    function l(d) {
      e.subschema({
        keyword: "properties",
        schemaProp: d,
        dataProp: d
      }, c);
    }
  }
};
qd.default = YA;
var Bd = {};
Object.defineProperty(Bd, "__esModule", { value: !0 });
const Xh = me, Ra = de, Jh = Y, Qh = Y, XA = {
  keyword: "patternProperties",
  type: "object",
  schemaType: "object",
  code(e) {
    const { gen: t, schema: r, data: n, parentSchema: i, it: s } = e, { opts: a } = s, o = (0, Xh.allSchemaProperties)(r), c = o.filter((_) => (0, Jh.alwaysValidSchema)(s, r[_]));
    if (o.length === 0 || c.length === o.length && (!s.opts.unevaluated || s.props === !0))
      return;
    const u = a.strictSchema && !a.allowMatchingProperties && i.properties, l = t.name("valid");
    s.props !== !0 && !(s.props instanceof Ra.Name) && (s.props = (0, Qh.evaluatedPropsToName)(t, s.props));
    const { props: d } = s;
    h();
    function h() {
      for (const _ of o)
        u && p(_), s.allErrors ? $(_) : (t.var(l, !0), $(_), t.if(l));
    }
    function p(_) {
      for (const v in u)
        new RegExp(_).test(v) && (0, Jh.checkStrictMode)(s, `property ${v} matches pattern ${_} (use allowMatchingProperties)`);
    }
    function $(_) {
      t.forIn("key", n, (v) => {
        t.if((0, Ra._)`${(0, Xh.usePattern)(e, _)}.test(${v})`, () => {
          const m = c.includes(_);
          m || e.subschema({
            keyword: "patternProperties",
            schemaProp: _,
            dataProp: v,
            dataPropType: Qh.Type.Str
          }, l), s.opts.unevaluated && d !== !0 ? t.assign((0, Ra._)`${d}[${v}]`, !0) : !m && !s.allErrors && t.if((0, Ra.not)(l), () => t.break());
        });
      });
    }
  }
};
Bd.default = XA;
var Hd = {};
Object.defineProperty(Hd, "__esModule", { value: !0 });
const JA = Y, QA = {
  keyword: "not",
  schemaType: ["object", "boolean"],
  trackErrors: !0,
  code(e) {
    const { gen: t, schema: r, it: n } = e;
    if ((0, JA.alwaysValidSchema)(n, r)) {
      e.fail();
      return;
    }
    const i = t.name("valid");
    e.subschema({
      keyword: "not",
      compositeRule: !0,
      createErrors: !1,
      allErrors: !1
    }, i), e.failResult(i, () => e.reset(), () => e.error());
  },
  error: { message: "must NOT be valid" }
};
Hd.default = QA;
var Gd = {};
Object.defineProperty(Gd, "__esModule", { value: !0 });
const ZA = me, eC = {
  keyword: "anyOf",
  schemaType: "array",
  trackErrors: !0,
  code: ZA.validateUnion,
  error: { message: "must match a schema in anyOf" }
};
Gd.default = eC;
var zd = {};
Object.defineProperty(zd, "__esModule", { value: !0 });
const oo = de, tC = Y, rC = {
  message: "must match exactly one schema in oneOf",
  params: ({ params: e }) => (0, oo._)`{passingSchemas: ${e.passing}}`
}, nC = {
  keyword: "oneOf",
  schemaType: "array",
  trackErrors: !0,
  error: rC,
  code(e) {
    const { gen: t, schema: r, parentSchema: n, it: i } = e;
    if (!Array.isArray(r))
      throw new Error("ajv implementation error");
    if (i.opts.discriminator && n.discriminator)
      return;
    const s = r, a = t.let("valid", !1), o = t.let("passing", null), c = t.name("_valid");
    e.setParams({ passing: o }), t.block(u), e.result(a, () => e.reset(), () => e.error(!0));
    function u() {
      s.forEach((l, d) => {
        let h;
        (0, tC.alwaysValidSchema)(i, l) ? t.var(c, !0) : h = e.subschema({
          keyword: "oneOf",
          schemaProp: d,
          compositeRule: !0
        }, c), d > 0 && t.if((0, oo._)`${c} && ${a}`).assign(a, !1).assign(o, (0, oo._)`[${o}, ${d}]`).else(), t.if(c, () => {
          t.assign(a, !0), t.assign(o, d), h && e.mergeEvaluated(h, oo.Name);
        });
      });
    }
  }
};
zd.default = nC;
var Kd = {};
Object.defineProperty(Kd, "__esModule", { value: !0 });
const iC = Y, sC = {
  keyword: "allOf",
  schemaType: "array",
  code(e) {
    const { gen: t, schema: r, it: n } = e;
    if (!Array.isArray(r))
      throw new Error("ajv implementation error");
    const i = t.name("valid");
    r.forEach((s, a) => {
      if ((0, iC.alwaysValidSchema)(n, s))
        return;
      const o = e.subschema({ keyword: "allOf", schemaProp: a }, i);
      e.ok(i), e.mergeEvaluated(o);
    });
  }
};
Kd.default = sC;
var Wd = {};
Object.defineProperty(Wd, "__esModule", { value: !0 });
const So = de, r0 = Y, aC = {
  message: ({ params: e }) => (0, So.str)`must match "${e.ifClause}" schema`,
  params: ({ params: e }) => (0, So._)`{failingKeyword: ${e.ifClause}}`
}, oC = {
  keyword: "if",
  schemaType: ["object", "boolean"],
  trackErrors: !0,
  error: aC,
  code(e) {
    const { gen: t, parentSchema: r, it: n } = e;
    r.then === void 0 && r.else === void 0 && (0, r0.checkStrictMode)(n, '"if" without "then" and "else" is ignored');
    const i = Zh(n, "then"), s = Zh(n, "else");
    if (!i && !s)
      return;
    const a = t.let("valid", !0), o = t.name("_valid");
    if (c(), e.reset(), i && s) {
      const l = t.let("ifClause");
      e.setParams({ ifClause: l }), t.if(o, u("then", l), u("else", l));
    } else i ? t.if(o, u("then")) : t.if((0, So.not)(o), u("else"));
    e.pass(a, () => e.error(!0));
    function c() {
      const l = e.subschema({
        keyword: "if",
        compositeRule: !0,
        createErrors: !1,
        allErrors: !1
      }, o);
      e.mergeEvaluated(l);
    }
    function u(l, d) {
      return () => {
        const h = e.subschema({ keyword: l }, o);
        t.assign(a, o), e.mergeValidEvaluated(h, a), d ? t.assign(d, (0, So._)`${l}`) : e.setParams({ ifClause: l });
      };
    }
  }
};
function Zh(e, t) {
  const r = e.schema[t];
  return r !== void 0 && !(0, r0.alwaysValidSchema)(e, r);
}
Wd.default = oC;
var Yd = {};
Object.defineProperty(Yd, "__esModule", { value: !0 });
const cC = Y, lC = {
  keyword: ["then", "else"],
  schemaType: ["object", "boolean"],
  code({ keyword: e, parentSchema: t, it: r }) {
    t.if === void 0 && (0, cC.checkStrictMode)(r, `"${e}" without "if" is ignored`);
  }
};
Yd.default = lC;
Object.defineProperty(Ld, "__esModule", { value: !0 });
const uC = Hi, dC = Ud, fC = Gi, hC = Md, pC = xd, mC = e0, yC = Vd, gC = Qo, _C = qd, vC = Bd, $C = Hd, wC = Gd, EC = zd, bC = Kd, SC = Wd, PC = Yd;
function TC(e = !1) {
  const t = [
    // any
    $C.default,
    wC.default,
    EC.default,
    bC.default,
    SC.default,
    PC.default,
    // object
    yC.default,
    gC.default,
    mC.default,
    _C.default,
    vC.default
  ];
  return e ? t.push(dC.default, hC.default) : t.push(uC.default, fC.default), t.push(pC.default), t;
}
Ld.default = TC;
var Xd = {}, Jd = {};
Object.defineProperty(Jd, "__esModule", { value: !0 });
const ke = de, NC = {
  message: ({ schemaCode: e }) => (0, ke.str)`must match format "${e}"`,
  params: ({ schemaCode: e }) => (0, ke._)`{format: ${e}}`
}, OC = {
  keyword: "format",
  type: ["number", "string"],
  schemaType: "string",
  $data: !0,
  error: NC,
  code(e, t) {
    const { gen: r, data: n, $data: i, schema: s, schemaCode: a, it: o } = e, { opts: c, errSchemaPath: u, schemaEnv: l, self: d } = o;
    if (!c.validateFormats)
      return;
    i ? h() : p();
    function h() {
      const $ = r.scopeValue("formats", {
        ref: d.formats,
        code: c.code.formats
      }), _ = r.const("fDef", (0, ke._)`${$}[${a}]`), v = r.let("fType"), m = r.let("format");
      r.if((0, ke._)`typeof ${_} == "object" && !(${_} instanceof RegExp)`, () => r.assign(v, (0, ke._)`${_}.type || "string"`).assign(m, (0, ke._)`${_}.validate`), () => r.assign(v, (0, ke._)`"string"`).assign(m, _)), e.fail$data((0, ke.or)(E(), T()));
      function E() {
        return c.strictSchema === !1 ? ke.nil : (0, ke._)`${a} && !${m}`;
      }
      function T() {
        const R = l.$async ? (0, ke._)`(${_}.async ? await ${m}(${n}) : ${m}(${n}))` : (0, ke._)`${m}(${n})`, F = (0, ke._)`(typeof ${m} == "function" ? ${R} : ${m}.test(${n}))`;
        return (0, ke._)`${m} && ${m} !== true && ${v} === ${t} && !${F}`;
      }
    }
    function p() {
      const $ = d.formats[s];
      if (!$) {
        E();
        return;
      }
      if ($ === !0)
        return;
      const [_, v, m] = T($);
      _ === t && e.pass(R());
      function E() {
        if (c.strictSchema === !1) {
          d.logger.warn(F());
          return;
        }
        throw new Error(F());
        function F() {
          return `unknown format "${s}" ignored in schema at path "${u}"`;
        }
      }
      function T(F) {
        const H = F instanceof RegExp ? (0, ke.regexpCode)(F) : c.code.formats ? (0, ke._)`${c.code.formats}${(0, ke.getProperty)(s)}` : void 0, G = r.scopeValue("formats", { key: s, ref: F, code: H });
        return typeof F == "object" && !(F instanceof RegExp) ? [F.type || "string", F.validate, (0, ke._)`${G}.validate`] : ["string", F, G];
      }
      function R() {
        if (typeof $ == "object" && !($ instanceof RegExp) && $.async) {
          if (!l.$async)
            throw new Error("async format in sync schema");
          return (0, ke._)`await ${m}(${n})`;
        }
        return typeof v == "function" ? (0, ke._)`${m}(${n})` : (0, ke._)`${m}.test(${n})`;
      }
    }
  }
};
Jd.default = OC;
Object.defineProperty(Xd, "__esModule", { value: !0 });
const AC = Jd, CC = [AC.default];
Xd.default = CC;
var Di = {};
Object.defineProperty(Di, "__esModule", { value: !0 });
Di.contentVocabulary = Di.metadataVocabulary = void 0;
Di.metadataVocabulary = [
  "title",
  "description",
  "default",
  "deprecated",
  "readOnly",
  "writeOnly",
  "examples"
];
Di.contentVocabulary = [
  "contentMediaType",
  "contentEncoding",
  "contentSchema"
];
Object.defineProperty(Ed, "__esModule", { value: !0 });
const RC = bd, IC = Pd, DC = Ld, kC = Xd, ep = Di, FC = [
  RC.default,
  IC.default,
  (0, DC.default)(),
  kC.default,
  ep.metadataVocabulary,
  ep.contentVocabulary
];
Ed.default = FC;
var Qd = {}, Zo = {};
Object.defineProperty(Zo, "__esModule", { value: !0 });
Zo.DiscrError = void 0;
var tp;
(function(e) {
  e.Tag = "tag", e.Mapping = "mapping";
})(tp || (Zo.DiscrError = tp = {}));
Object.defineProperty(Qd, "__esModule", { value: !0 });
const hi = de, Bl = Zo, rp = Tt, jC = Bi, LC = Y, UC = {
  message: ({ params: { discrError: e, tagName: t } }) => e === Bl.DiscrError.Tag ? `tag "${t}" must be string` : `value of tag "${t}" must be in oneOf`,
  params: ({ params: { discrError: e, tag: t, tagName: r } }) => (0, hi._)`{error: ${e}, tag: ${r}, tagValue: ${t}}`
}, MC = {
  keyword: "discriminator",
  type: "object",
  schemaType: "object",
  error: UC,
  code(e) {
    const { gen: t, data: r, schema: n, parentSchema: i, it: s } = e, { oneOf: a } = i;
    if (!s.opts.discriminator)
      throw new Error("discriminator: requires discriminator option");
    const o = n.propertyName;
    if (typeof o != "string")
      throw new Error("discriminator: requires propertyName");
    if (n.mapping)
      throw new Error("discriminator: mapping is not supported");
    if (!a)
      throw new Error("discriminator: requires oneOf keyword");
    const c = t.let("valid", !1), u = t.const("tag", (0, hi._)`${r}${(0, hi.getProperty)(o)}`);
    t.if((0, hi._)`typeof ${u} == "string"`, () => l(), () => e.error(!1, { discrError: Bl.DiscrError.Tag, tag: u, tagName: o })), e.ok(c);
    function l() {
      const p = h();
      t.if(!1);
      for (const $ in p)
        t.elseIf((0, hi._)`${u} === ${$}`), t.assign(c, d(p[$]));
      t.else(), e.error(!1, { discrError: Bl.DiscrError.Mapping, tag: u, tagName: o }), t.endIf();
    }
    function d(p) {
      const $ = t.name("valid"), _ = e.subschema({ keyword: "oneOf", schemaProp: p }, $);
      return e.mergeEvaluated(_, hi.Name), $;
    }
    function h() {
      var p;
      const $ = {}, _ = m(i);
      let v = !0;
      for (let R = 0; R < a.length; R++) {
        let F = a[R];
        if (F != null && F.$ref && !(0, LC.schemaHasRulesButRef)(F, s.self.RULES)) {
          const G = F.$ref;
          if (F = rp.resolveRef.call(s.self, s.schemaEnv.root, s.baseId, G), F instanceof rp.SchemaEnv && (F = F.schema), F === void 0)
            throw new jC.default(s.opts.uriResolver, s.baseId, G);
        }
        const H = (p = F == null ? void 0 : F.properties) === null || p === void 0 ? void 0 : p[o];
        if (typeof H != "object")
          throw new Error(`discriminator: oneOf subschemas (or referenced schemas) must have "properties/${o}"`);
        v = v && (_ || m(F)), E(H, R);
      }
      if (!v)
        throw new Error(`discriminator: "${o}" must be required`);
      return $;
      function m({ required: R }) {
        return Array.isArray(R) && R.includes(o);
      }
      function E(R, F) {
        if (R.const)
          T(R.const, F);
        else if (R.enum)
          for (const H of R.enum)
            T(H, F);
        else
          throw new Error(`discriminator: "properties/${o}" must have "const" or "enum"`);
      }
      function T(R, F) {
        if (typeof R != "string" || R in $)
          throw new Error(`discriminator: "${o}" values must be unique strings`);
        $[R] = F;
      }
    }
  }
};
Qd.default = MC;
const xC = "http://json-schema.org/draft-07/schema#", VC = "http://json-schema.org/draft-07/schema#", qC = "Core schema meta-schema", BC = {
  schemaArray: {
    type: "array",
    minItems: 1,
    items: {
      $ref: "#"
    }
  },
  nonNegativeInteger: {
    type: "integer",
    minimum: 0
  },
  nonNegativeIntegerDefault0: {
    allOf: [
      {
        $ref: "#/definitions/nonNegativeInteger"
      },
      {
        default: 0
      }
    ]
  },
  simpleTypes: {
    enum: [
      "array",
      "boolean",
      "integer",
      "null",
      "number",
      "object",
      "string"
    ]
  },
  stringArray: {
    type: "array",
    items: {
      type: "string"
    },
    uniqueItems: !0,
    default: []
  }
}, HC = [
  "object",
  "boolean"
], GC = {
  $id: {
    type: "string",
    format: "uri-reference"
  },
  $schema: {
    type: "string",
    format: "uri"
  },
  $ref: {
    type: "string",
    format: "uri-reference"
  },
  $comment: {
    type: "string"
  },
  title: {
    type: "string"
  },
  description: {
    type: "string"
  },
  default: !0,
  readOnly: {
    type: "boolean",
    default: !1
  },
  examples: {
    type: "array",
    items: !0
  },
  multipleOf: {
    type: "number",
    exclusiveMinimum: 0
  },
  maximum: {
    type: "number"
  },
  exclusiveMaximum: {
    type: "number"
  },
  minimum: {
    type: "number"
  },
  exclusiveMinimum: {
    type: "number"
  },
  maxLength: {
    $ref: "#/definitions/nonNegativeInteger"
  },
  minLength: {
    $ref: "#/definitions/nonNegativeIntegerDefault0"
  },
  pattern: {
    type: "string",
    format: "regex"
  },
  additionalItems: {
    $ref: "#"
  },
  items: {
    anyOf: [
      {
        $ref: "#"
      },
      {
        $ref: "#/definitions/schemaArray"
      }
    ],
    default: !0
  },
  maxItems: {
    $ref: "#/definitions/nonNegativeInteger"
  },
  minItems: {
    $ref: "#/definitions/nonNegativeIntegerDefault0"
  },
  uniqueItems: {
    type: "boolean",
    default: !1
  },
  contains: {
    $ref: "#"
  },
  maxProperties: {
    $ref: "#/definitions/nonNegativeInteger"
  },
  minProperties: {
    $ref: "#/definitions/nonNegativeIntegerDefault0"
  },
  required: {
    $ref: "#/definitions/stringArray"
  },
  additionalProperties: {
    $ref: "#"
  },
  definitions: {
    type: "object",
    additionalProperties: {
      $ref: "#"
    },
    default: {}
  },
  properties: {
    type: "object",
    additionalProperties: {
      $ref: "#"
    },
    default: {}
  },
  patternProperties: {
    type: "object",
    additionalProperties: {
      $ref: "#"
    },
    propertyNames: {
      format: "regex"
    },
    default: {}
  },
  dependencies: {
    type: "object",
    additionalProperties: {
      anyOf: [
        {
          $ref: "#"
        },
        {
          $ref: "#/definitions/stringArray"
        }
      ]
    }
  },
  propertyNames: {
    $ref: "#"
  },
  const: !0,
  enum: {
    type: "array",
    items: !0,
    minItems: 1,
    uniqueItems: !0
  },
  type: {
    anyOf: [
      {
        $ref: "#/definitions/simpleTypes"
      },
      {
        type: "array",
        items: {
          $ref: "#/definitions/simpleTypes"
        },
        minItems: 1,
        uniqueItems: !0
      }
    ]
  },
  format: {
    type: "string"
  },
  contentMediaType: {
    type: "string"
  },
  contentEncoding: {
    type: "string"
  },
  if: {
    $ref: "#"
  },
  then: {
    $ref: "#"
  },
  else: {
    $ref: "#"
  },
  allOf: {
    $ref: "#/definitions/schemaArray"
  },
  anyOf: {
    $ref: "#/definitions/schemaArray"
  },
  oneOf: {
    $ref: "#/definitions/schemaArray"
  },
  not: {
    $ref: "#"
  }
}, zC = {
  $schema: xC,
  $id: VC,
  title: qC,
  definitions: BC,
  type: HC,
  properties: GC,
  default: !0
};
(function(e, t) {
  Object.defineProperty(t, "__esModule", { value: !0 }), t.MissingRefError = t.ValidationError = t.CodeGen = t.Name = t.nil = t.stringify = t.str = t._ = t.KeywordCxt = t.Ajv = void 0;
  const r = yg, n = Ed, i = Qd, s = zC, a = ["/properties"], o = "http://json-schema.org/draft-07/schema";
  class c extends r.default {
    _addVocabularies() {
      super._addVocabularies(), n.default.forEach(($) => this.addVocabulary($)), this.opts.discriminator && this.addKeyword(i.default);
    }
    _addDefaultMetaSchema() {
      if (super._addDefaultMetaSchema(), !this.opts.meta)
        return;
      const $ = this.opts.$data ? this.$dataMetaSchema(s, a) : s;
      this.addMetaSchema($, o, !1), this.refs["http://json-schema.org/schema"] = o;
    }
    defaultMeta() {
      return this.opts.defaultMeta = super.defaultMeta() || (this.getSchema(o) ? o : void 0);
    }
  }
  t.Ajv = c, e.exports = t = c, e.exports.Ajv = c, Object.defineProperty(t, "__esModule", { value: !0 }), t.default = c;
  var u = rr;
  Object.defineProperty(t, "KeywordCxt", { enumerable: !0, get: function() {
    return u.KeywordCxt;
  } });
  var l = de;
  Object.defineProperty(t, "_", { enumerable: !0, get: function() {
    return l._;
  } }), Object.defineProperty(t, "str", { enumerable: !0, get: function() {
    return l.str;
  } }), Object.defineProperty(t, "stringify", { enumerable: !0, get: function() {
    return l.stringify;
  } }), Object.defineProperty(t, "nil", { enumerable: !0, get: function() {
    return l.nil;
  } }), Object.defineProperty(t, "Name", { enumerable: !0, get: function() {
    return l.Name;
  } }), Object.defineProperty(t, "CodeGen", { enumerable: !0, get: function() {
    return l.CodeGen;
  } });
  var d = Qs;
  Object.defineProperty(t, "ValidationError", { enumerable: !0, get: function() {
    return d.default;
  } });
  var h = Bi;
  Object.defineProperty(t, "MissingRefError", { enumerable: !0, get: function() {
    return h.default;
  } });
})(jl, jl.exports);
var KC = jl.exports;
(function(e) {
  Object.defineProperty(e, "__esModule", { value: !0 }), e.formatLimitDefinition = void 0;
  const t = KC, r = de, n = r.operators, i = {
    formatMaximum: { okStr: "<=", ok: n.LTE, fail: n.GT },
    formatMinimum: { okStr: ">=", ok: n.GTE, fail: n.LT },
    formatExclusiveMaximum: { okStr: "<", ok: n.LT, fail: n.GTE },
    formatExclusiveMinimum: { okStr: ">", ok: n.GT, fail: n.LTE }
  }, s = {
    message: ({ keyword: o, schemaCode: c }) => (0, r.str)`should be ${i[o].okStr} ${c}`,
    params: ({ keyword: o, schemaCode: c }) => (0, r._)`{comparison: ${i[o].okStr}, limit: ${c}}`
  };
  e.formatLimitDefinition = {
    keyword: Object.keys(i),
    type: "string",
    schemaType: "string",
    $data: !0,
    error: s,
    code(o) {
      const { gen: c, data: u, schemaCode: l, keyword: d, it: h } = o, { opts: p, self: $ } = h;
      if (!p.validateFormats)
        return;
      const _ = new t.KeywordCxt(h, $.RULES.all.format.definition, "format");
      _.$data ? v() : m();
      function v() {
        const T = c.scopeValue("formats", {
          ref: $.formats,
          code: p.code.formats
        }), R = c.const("fmt", (0, r._)`${T}[${_.schemaCode}]`);
        o.fail$data((0, r.or)((0, r._)`typeof ${R} != "object"`, (0, r._)`${R} instanceof RegExp`, (0, r._)`typeof ${R}.compare != "function"`, E(R)));
      }
      function m() {
        const T = _.schema, R = $.formats[T];
        if (!R || R === !0)
          return;
        if (typeof R != "object" || R instanceof RegExp || typeof R.compare != "function")
          throw new Error(`"${d}": format "${T}" does not define "compare" function`);
        const F = c.scopeValue("formats", {
          key: T,
          ref: R,
          code: p.code.formats ? (0, r._)`${p.code.formats}${(0, r.getProperty)(T)}` : void 0
        });
        o.fail$data(E(F));
      }
      function E(T) {
        return (0, r._)`${T}.compare(${u}, ${l}) ${i[d].fail} 0`;
      }
    },
    dependencies: ["format"]
  };
  const a = (o) => (o.addKeyword(e.formatLimitDefinition), o);
  e.default = a;
})(mg);
(function(e, t) {
  Object.defineProperty(t, "__esModule", { value: !0 });
  const r = pg, n = mg, i = de, s = new i.Name("fullFormats"), a = new i.Name("fastFormats"), o = (u, l = { keywords: !0 }) => {
    if (Array.isArray(l))
      return c(u, l, r.fullFormats, s), u;
    const [d, h] = l.mode === "fast" ? [r.fastFormats, a] : [r.fullFormats, s], p = l.formats || r.formatNames;
    return c(u, p, d, h), l.keywords && (0, n.default)(u), u;
  };
  o.get = (u, l = "full") => {
    const h = (l === "fast" ? r.fastFormats : r.fullFormats)[u];
    if (!h)
      throw new Error(`Unknown format "${u}"`);
    return h;
  };
  function c(u, l, d, h) {
    var p, $;
    (p = ($ = u.opts.code).formats) !== null && p !== void 0 || ($.formats = (0, i._)`require("ajv-formats/dist/formats").${h}`);
    for (const _ of l)
      u.addFormat(_, d[_]);
  }
  e.exports = t = o, Object.defineProperty(t, "__esModule", { value: !0 }), t.default = o;
})(Fl, Fl.exports);
var WC = Fl.exports;
const YC = /* @__PURE__ */ py(WC), XC = (e, t, r, n) => {
  if (r === "length" || r === "prototype" || r === "arguments" || r === "caller")
    return;
  const i = Object.getOwnPropertyDescriptor(e, r), s = Object.getOwnPropertyDescriptor(t, r);
  !JC(i, s) && n || Object.defineProperty(e, r, s);
}, JC = function(e, t) {
  return e === void 0 || e.configurable || e.writable === t.writable && e.enumerable === t.enumerable && e.configurable === t.configurable && (e.writable || e.value === t.value);
}, QC = (e, t) => {
  const r = Object.getPrototypeOf(t);
  r !== Object.getPrototypeOf(e) && Object.setPrototypeOf(e, r);
}, ZC = (e, t) => `/* Wrapped ${e}*/
${t}`, eR = Object.getOwnPropertyDescriptor(Function.prototype, "toString"), tR = Object.getOwnPropertyDescriptor(Function.prototype.toString, "name"), rR = (e, t, r) => {
  const n = r === "" ? "" : `with ${r.trim()}() `, i = ZC.bind(null, n, t.toString());
  Object.defineProperty(i, "name", tR);
  const { writable: s, enumerable: a, configurable: o } = eR;
  Object.defineProperty(e, "toString", { value: i, writable: s, enumerable: a, configurable: o });
};
function nR(e, t, { ignoreNonConfigurable: r = !1 } = {}) {
  const { name: n } = e;
  for (const i of Reflect.ownKeys(t))
    XC(e, t, i, r);
  return QC(e, t), rR(e, t, n), e;
}
const np = (e, t = {}) => {
  if (typeof e != "function")
    throw new TypeError(`Expected the first argument to be a function, got \`${typeof e}\``);
  const {
    wait: r = 0,
    maxWait: n = Number.POSITIVE_INFINITY,
    before: i = !1,
    after: s = !0
  } = t;
  if (r < 0 || n < 0)
    throw new RangeError("`wait` and `maxWait` must not be negative.");
  if (!i && !s)
    throw new Error("Both `before` and `after` are false, function wouldn't be called.");
  let a, o, c;
  const u = function(...l) {
    const d = this, h = () => {
      a = void 0, o && (clearTimeout(o), o = void 0), s && (c = e.apply(d, l));
    }, p = () => {
      o = void 0, a && (clearTimeout(a), a = void 0), s && (c = e.apply(d, l));
    }, $ = i && !a;
    return clearTimeout(a), a = setTimeout(h, r), n > 0 && n !== Number.POSITIVE_INFINITY && !o && (o = setTimeout(p, n)), $ && (c = e.apply(d, l)), c;
  };
  return nR(u, e), u.cancel = () => {
    a && (clearTimeout(a), a = void 0), o && (clearTimeout(o), o = void 0);
  }, u;
};
var Hl = { exports: {} };
const iR = "2.0.0", n0 = 256, sR = Number.MAX_SAFE_INTEGER || /* istanbul ignore next */
9007199254740991, aR = 16, oR = n0 - 6, cR = [
  "major",
  "premajor",
  "minor",
  "preminor",
  "patch",
  "prepatch",
  "prerelease"
];
var ec = {
  MAX_LENGTH: n0,
  MAX_SAFE_COMPONENT_LENGTH: aR,
  MAX_SAFE_BUILD_LENGTH: oR,
  MAX_SAFE_INTEGER: sR,
  RELEASE_TYPES: cR,
  SEMVER_SPEC_VERSION: iR,
  FLAG_INCLUDE_PRERELEASE: 1,
  FLAG_LOOSE: 2
};
const lR = typeof process == "object" && process.env && process.env.NODE_DEBUG && /\bsemver\b/i.test(process.env.NODE_DEBUG) ? (...e) => console.error("SEMVER", ...e) : () => {
};
var tc = lR;
(function(e, t) {
  const {
    MAX_SAFE_COMPONENT_LENGTH: r,
    MAX_SAFE_BUILD_LENGTH: n,
    MAX_LENGTH: i
  } = ec, s = tc;
  t = e.exports = {};
  const a = t.re = [], o = t.safeRe = [], c = t.src = [], u = t.safeSrc = [], l = t.t = {};
  let d = 0;
  const h = "[a-zA-Z0-9-]", p = [
    ["\\s", 1],
    ["\\d", i],
    [h, n]
  ], $ = (v) => {
    for (const [m, E] of p)
      v = v.split(`${m}*`).join(`${m}{0,${E}}`).split(`${m}+`).join(`${m}{1,${E}}`);
    return v;
  }, _ = (v, m, E) => {
    const T = $(m), R = d++;
    s(v, R, m), l[v] = R, c[R] = m, u[R] = T, a[R] = new RegExp(m, E ? "g" : void 0), o[R] = new RegExp(T, E ? "g" : void 0);
  };
  _("NUMERICIDENTIFIER", "0|[1-9]\\d*"), _("NUMERICIDENTIFIERLOOSE", "\\d+"), _("NONNUMERICIDENTIFIER", `\\d*[a-zA-Z-]${h}*`), _("MAINVERSION", `(${c[l.NUMERICIDENTIFIER]})\\.(${c[l.NUMERICIDENTIFIER]})\\.(${c[l.NUMERICIDENTIFIER]})`), _("MAINVERSIONLOOSE", `(${c[l.NUMERICIDENTIFIERLOOSE]})\\.(${c[l.NUMERICIDENTIFIERLOOSE]})\\.(${c[l.NUMERICIDENTIFIERLOOSE]})`), _("PRERELEASEIDENTIFIER", `(?:${c[l.NONNUMERICIDENTIFIER]}|${c[l.NUMERICIDENTIFIER]})`), _("PRERELEASEIDENTIFIERLOOSE", `(?:${c[l.NONNUMERICIDENTIFIER]}|${c[l.NUMERICIDENTIFIERLOOSE]})`), _("PRERELEASE", `(?:-(${c[l.PRERELEASEIDENTIFIER]}(?:\\.${c[l.PRERELEASEIDENTIFIER]})*))`), _("PRERELEASELOOSE", `(?:-?(${c[l.PRERELEASEIDENTIFIERLOOSE]}(?:\\.${c[l.PRERELEASEIDENTIFIERLOOSE]})*))`), _("BUILDIDENTIFIER", `${h}+`), _("BUILD", `(?:\\+(${c[l.BUILDIDENTIFIER]}(?:\\.${c[l.BUILDIDENTIFIER]})*))`), _("FULLPLAIN", `v?${c[l.MAINVERSION]}${c[l.PRERELEASE]}?${c[l.BUILD]}?`), _("FULL", `^${c[l.FULLPLAIN]}$`), _("LOOSEPLAIN", `[v=\\s]*${c[l.MAINVERSIONLOOSE]}${c[l.PRERELEASELOOSE]}?${c[l.BUILD]}?`), _("LOOSE", `^${c[l.LOOSEPLAIN]}$`), _("GTLT", "((?:<|>)?=?)"), _("XRANGEIDENTIFIERLOOSE", `${c[l.NUMERICIDENTIFIERLOOSE]}|x|X|\\*`), _("XRANGEIDENTIFIER", `${c[l.NUMERICIDENTIFIER]}|x|X|\\*`), _("XRANGEPLAIN", `[v=\\s]*(${c[l.XRANGEIDENTIFIER]})(?:\\.(${c[l.XRANGEIDENTIFIER]})(?:\\.(${c[l.XRANGEIDENTIFIER]})(?:${c[l.PRERELEASE]})?${c[l.BUILD]}?)?)?`), _("XRANGEPLAINLOOSE", `[v=\\s]*(${c[l.XRANGEIDENTIFIERLOOSE]})(?:\\.(${c[l.XRANGEIDENTIFIERLOOSE]})(?:\\.(${c[l.XRANGEIDENTIFIERLOOSE]})(?:${c[l.PRERELEASELOOSE]})?${c[l.BUILD]}?)?)?`), _("XRANGE", `^${c[l.GTLT]}\\s*${c[l.XRANGEPLAIN]}$`), _("XRANGELOOSE", `^${c[l.GTLT]}\\s*${c[l.XRANGEPLAINLOOSE]}$`), _("COERCEPLAIN", `(^|[^\\d])(\\d{1,${r}})(?:\\.(\\d{1,${r}}))?(?:\\.(\\d{1,${r}}))?`), _("COERCE", `${c[l.COERCEPLAIN]}(?:$|[^\\d])`), _("COERCEFULL", c[l.COERCEPLAIN] + `(?:${c[l.PRERELEASE]})?(?:${c[l.BUILD]})?(?:$|[^\\d])`), _("COERCERTL", c[l.COERCE], !0), _("COERCERTLFULL", c[l.COERCEFULL], !0), _("LONETILDE", "(?:~>?)"), _("TILDETRIM", `(\\s*)${c[l.LONETILDE]}\\s+`, !0), t.tildeTrimReplace = "$1~", _("TILDE", `^${c[l.LONETILDE]}${c[l.XRANGEPLAIN]}$`), _("TILDELOOSE", `^${c[l.LONETILDE]}${c[l.XRANGEPLAINLOOSE]}$`), _("LONECARET", "(?:\\^)"), _("CARETTRIM", `(\\s*)${c[l.LONECARET]}\\s+`, !0), t.caretTrimReplace = "$1^", _("CARET", `^${c[l.LONECARET]}${c[l.XRANGEPLAIN]}$`), _("CARETLOOSE", `^${c[l.LONECARET]}${c[l.XRANGEPLAINLOOSE]}$`), _("COMPARATORLOOSE", `^${c[l.GTLT]}\\s*(${c[l.LOOSEPLAIN]})$|^$`), _("COMPARATOR", `^${c[l.GTLT]}\\s*(${c[l.FULLPLAIN]})$|^$`), _("COMPARATORTRIM", `(\\s*)${c[l.GTLT]}\\s*(${c[l.LOOSEPLAIN]}|${c[l.XRANGEPLAIN]})`, !0), t.comparatorTrimReplace = "$1$2$3", _("HYPHENRANGE", `^\\s*(${c[l.XRANGEPLAIN]})\\s+-\\s+(${c[l.XRANGEPLAIN]})\\s*$`), _("HYPHENRANGELOOSE", `^\\s*(${c[l.XRANGEPLAINLOOSE]})\\s+-\\s+(${c[l.XRANGEPLAINLOOSE]})\\s*$`), _("STAR", "(<|>)?=?\\s*\\*"), _("GTE0", "^\\s*>=\\s*0\\.0\\.0\\s*$"), _("GTE0PRE", "^\\s*>=\\s*0\\.0\\.0-0\\s*$");
})(Hl, Hl.exports);
var ea = Hl.exports;
const uR = Object.freeze({ loose: !0 }), dR = Object.freeze({}), fR = (e) => e ? typeof e != "object" ? uR : e : dR;
var Zd = fR;
const ip = /^[0-9]+$/, i0 = (e, t) => {
  if (typeof e == "number" && typeof t == "number")
    return e === t ? 0 : e < t ? -1 : 1;
  const r = ip.test(e), n = ip.test(t);
  return r && n && (e = +e, t = +t), e === t ? 0 : r && !n ? -1 : n && !r ? 1 : e < t ? -1 : 1;
}, hR = (e, t) => i0(t, e);
var s0 = {
  compareIdentifiers: i0,
  rcompareIdentifiers: hR
};
const Ia = tc, { MAX_LENGTH: sp, MAX_SAFE_INTEGER: Da } = ec, { safeRe: ka, t: Fa } = ea, pR = Zd, { compareIdentifiers: Bc } = s0;
let mR = class cr {
  constructor(t, r) {
    if (r = pR(r), t instanceof cr) {
      if (t.loose === !!r.loose && t.includePrerelease === !!r.includePrerelease)
        return t;
      t = t.version;
    } else if (typeof t != "string")
      throw new TypeError(`Invalid version. Must be a string. Got type "${typeof t}".`);
    if (t.length > sp)
      throw new TypeError(
        `version is longer than ${sp} characters`
      );
    Ia("SemVer", t, r), this.options = r, this.loose = !!r.loose, this.includePrerelease = !!r.includePrerelease;
    const n = t.trim().match(r.loose ? ka[Fa.LOOSE] : ka[Fa.FULL]);
    if (!n)
      throw new TypeError(`Invalid Version: ${t}`);
    if (this.raw = t, this.major = +n[1], this.minor = +n[2], this.patch = +n[3], this.major > Da || this.major < 0)
      throw new TypeError("Invalid major version");
    if (this.minor > Da || this.minor < 0)
      throw new TypeError("Invalid minor version");
    if (this.patch > Da || this.patch < 0)
      throw new TypeError("Invalid patch version");
    n[4] ? this.prerelease = n[4].split(".").map((i) => {
      if (/^[0-9]+$/.test(i)) {
        const s = +i;
        if (s >= 0 && s < Da)
          return s;
      }
      return i;
    }) : this.prerelease = [], this.build = n[5] ? n[5].split(".") : [], this.format();
  }
  format() {
    return this.version = `${this.major}.${this.minor}.${this.patch}`, this.prerelease.length && (this.version += `-${this.prerelease.join(".")}`), this.version;
  }
  toString() {
    return this.version;
  }
  compare(t) {
    if (Ia("SemVer.compare", this.version, this.options, t), !(t instanceof cr)) {
      if (typeof t == "string" && t === this.version)
        return 0;
      t = new cr(t, this.options);
    }
    return t.version === this.version ? 0 : this.compareMain(t) || this.comparePre(t);
  }
  compareMain(t) {
    return t instanceof cr || (t = new cr(t, this.options)), this.major < t.major ? -1 : this.major > t.major ? 1 : this.minor < t.minor ? -1 : this.minor > t.minor ? 1 : this.patch < t.patch ? -1 : this.patch > t.patch ? 1 : 0;
  }
  comparePre(t) {
    if (t instanceof cr || (t = new cr(t, this.options)), this.prerelease.length && !t.prerelease.length)
      return -1;
    if (!this.prerelease.length && t.prerelease.length)
      return 1;
    if (!this.prerelease.length && !t.prerelease.length)
      return 0;
    let r = 0;
    do {
      const n = this.prerelease[r], i = t.prerelease[r];
      if (Ia("prerelease compare", r, n, i), n === void 0 && i === void 0)
        return 0;
      if (i === void 0)
        return 1;
      if (n === void 0)
        return -1;
      if (n === i)
        continue;
      return Bc(n, i);
    } while (++r);
  }
  compareBuild(t) {
    t instanceof cr || (t = new cr(t, this.options));
    let r = 0;
    do {
      const n = this.build[r], i = t.build[r];
      if (Ia("build compare", r, n, i), n === void 0 && i === void 0)
        return 0;
      if (i === void 0)
        return 1;
      if (n === void 0)
        return -1;
      if (n === i)
        continue;
      return Bc(n, i);
    } while (++r);
  }
  // preminor will bump the version up to the next minor release, and immediately
  // down to pre-release. premajor and prepatch work the same way.
  inc(t, r, n) {
    if (t.startsWith("pre")) {
      if (!r && n === !1)
        throw new Error("invalid increment argument: identifier is empty");
      if (r) {
        const i = `-${r}`.match(this.options.loose ? ka[Fa.PRERELEASELOOSE] : ka[Fa.PRERELEASE]);
        if (!i || i[1] !== r)
          throw new Error(`invalid identifier: ${r}`);
      }
    }
    switch (t) {
      case "premajor":
        this.prerelease.length = 0, this.patch = 0, this.minor = 0, this.major++, this.inc("pre", r, n);
        break;
      case "preminor":
        this.prerelease.length = 0, this.patch = 0, this.minor++, this.inc("pre", r, n);
        break;
      case "prepatch":
        this.prerelease.length = 0, this.inc("patch", r, n), this.inc("pre", r, n);
        break;
      case "prerelease":
        this.prerelease.length === 0 && this.inc("patch", r, n), this.inc("pre", r, n);
        break;
      case "release":
        if (this.prerelease.length === 0)
          throw new Error(`version ${this.raw} is not a prerelease`);
        this.prerelease.length = 0;
        break;
      case "major":
        (this.minor !== 0 || this.patch !== 0 || this.prerelease.length === 0) && this.major++, this.minor = 0, this.patch = 0, this.prerelease = [];
        break;
      case "minor":
        (this.patch !== 0 || this.prerelease.length === 0) && this.minor++, this.patch = 0, this.prerelease = [];
        break;
      case "patch":
        this.prerelease.length === 0 && this.patch++, this.prerelease = [];
        break;
      case "pre": {
        const i = Number(n) ? 1 : 0;
        if (this.prerelease.length === 0)
          this.prerelease = [i];
        else {
          let s = this.prerelease.length;
          for (; --s >= 0; )
            typeof this.prerelease[s] == "number" && (this.prerelease[s]++, s = -2);
          if (s === -1) {
            if (r === this.prerelease.join(".") && n === !1)
              throw new Error("invalid increment argument: identifier already exists");
            this.prerelease.push(i);
          }
        }
        if (r) {
          let s = [r, i];
          n === !1 && (s = [r]), Bc(this.prerelease[0], r) === 0 ? isNaN(this.prerelease[1]) && (this.prerelease = s) : this.prerelease = s;
        }
        break;
      }
      default:
        throw new Error(`invalid increment argument: ${t}`);
    }
    return this.raw = this.format(), this.build.length && (this.raw += `+${this.build.join(".")}`), this;
  }
};
var _t = mR;
const ap = _t, yR = (e, t, r = !1) => {
  if (e instanceof ap)
    return e;
  try {
    return new ap(e, t);
  } catch (n) {
    if (!r)
      return null;
    throw n;
  }
};
var zi = yR;
const gR = zi, _R = (e, t) => {
  const r = gR(e, t);
  return r ? r.version : null;
};
var vR = _R;
const $R = zi, wR = (e, t) => {
  const r = $R(e.trim().replace(/^[=v]+/, ""), t);
  return r ? r.version : null;
};
var ER = wR;
const op = _t, bR = (e, t, r, n, i) => {
  typeof r == "string" && (i = n, n = r, r = void 0);
  try {
    return new op(
      e instanceof op ? e.version : e,
      r
    ).inc(t, n, i).version;
  } catch {
    return null;
  }
};
var SR = bR;
const cp = zi, PR = (e, t) => {
  const r = cp(e, null, !0), n = cp(t, null, !0), i = r.compare(n);
  if (i === 0)
    return null;
  const s = i > 0, a = s ? r : n, o = s ? n : r, c = !!a.prerelease.length;
  if (!!o.prerelease.length && !c) {
    if (!o.patch && !o.minor)
      return "major";
    if (o.compareMain(a) === 0)
      return o.minor && !o.patch ? "minor" : "patch";
  }
  const l = c ? "pre" : "";
  return r.major !== n.major ? l + "major" : r.minor !== n.minor ? l + "minor" : r.patch !== n.patch ? l + "patch" : "prerelease";
};
var TR = PR;
const NR = _t, OR = (e, t) => new NR(e, t).major;
var AR = OR;
const CR = _t, RR = (e, t) => new CR(e, t).minor;
var IR = RR;
const DR = _t, kR = (e, t) => new DR(e, t).patch;
var FR = kR;
const jR = zi, LR = (e, t) => {
  const r = jR(e, t);
  return r && r.prerelease.length ? r.prerelease : null;
};
var UR = LR;
const lp = _t, MR = (e, t, r) => new lp(e, r).compare(new lp(t, r));
var nr = MR;
const xR = nr, VR = (e, t, r) => xR(t, e, r);
var qR = VR;
const BR = nr, HR = (e, t) => BR(e, t, !0);
var GR = HR;
const up = _t, zR = (e, t, r) => {
  const n = new up(e, r), i = new up(t, r);
  return n.compare(i) || n.compareBuild(i);
};
var ef = zR;
const KR = ef, WR = (e, t) => e.sort((r, n) => KR(r, n, t));
var YR = WR;
const XR = ef, JR = (e, t) => e.sort((r, n) => XR(n, r, t));
var QR = JR;
const ZR = nr, eI = (e, t, r) => ZR(e, t, r) > 0;
var rc = eI;
const tI = nr, rI = (e, t, r) => tI(e, t, r) < 0;
var tf = rI;
const nI = nr, iI = (e, t, r) => nI(e, t, r) === 0;
var a0 = iI;
const sI = nr, aI = (e, t, r) => sI(e, t, r) !== 0;
var o0 = aI;
const oI = nr, cI = (e, t, r) => oI(e, t, r) >= 0;
var rf = cI;
const lI = nr, uI = (e, t, r) => lI(e, t, r) <= 0;
var nf = uI;
const dI = a0, fI = o0, hI = rc, pI = rf, mI = tf, yI = nf, gI = (e, t, r, n) => {
  switch (t) {
    case "===":
      return typeof e == "object" && (e = e.version), typeof r == "object" && (r = r.version), e === r;
    case "!==":
      return typeof e == "object" && (e = e.version), typeof r == "object" && (r = r.version), e !== r;
    case "":
    case "=":
    case "==":
      return dI(e, r, n);
    case "!=":
      return fI(e, r, n);
    case ">":
      return hI(e, r, n);
    case ">=":
      return pI(e, r, n);
    case "<":
      return mI(e, r, n);
    case "<=":
      return yI(e, r, n);
    default:
      throw new TypeError(`Invalid operator: ${t}`);
  }
};
var c0 = gI;
const _I = _t, vI = zi, { safeRe: ja, t: La } = ea, $I = (e, t) => {
  if (e instanceof _I)
    return e;
  if (typeof e == "number" && (e = String(e)), typeof e != "string")
    return null;
  t = t || {};
  let r = null;
  if (!t.rtl)
    r = e.match(t.includePrerelease ? ja[La.COERCEFULL] : ja[La.COERCE]);
  else {
    const c = t.includePrerelease ? ja[La.COERCERTLFULL] : ja[La.COERCERTL];
    let u;
    for (; (u = c.exec(e)) && (!r || r.index + r[0].length !== e.length); )
      (!r || u.index + u[0].length !== r.index + r[0].length) && (r = u), c.lastIndex = u.index + u[1].length + u[2].length;
    c.lastIndex = -1;
  }
  if (r === null)
    return null;
  const n = r[2], i = r[3] || "0", s = r[4] || "0", a = t.includePrerelease && r[5] ? `-${r[5]}` : "", o = t.includePrerelease && r[6] ? `+${r[6]}` : "";
  return vI(`${n}.${i}.${s}${a}${o}`, t);
};
var wI = $I;
class EI {
  constructor() {
    this.max = 1e3, this.map = /* @__PURE__ */ new Map();
  }
  get(t) {
    const r = this.map.get(t);
    if (r !== void 0)
      return this.map.delete(t), this.map.set(t, r), r;
  }
  delete(t) {
    return this.map.delete(t);
  }
  set(t, r) {
    if (!this.delete(t) && r !== void 0) {
      if (this.map.size >= this.max) {
        const i = this.map.keys().next().value;
        this.delete(i);
      }
      this.map.set(t, r);
    }
    return this;
  }
}
var bI = EI, Hc, dp;
function ir() {
  if (dp) return Hc;
  dp = 1;
  const e = /\s+/g;
  class t {
    constructor(U, B) {
      if (B = i(B), U instanceof t)
        return U.loose === !!B.loose && U.includePrerelease === !!B.includePrerelease ? U : new t(U.raw, B);
      if (U instanceof s)
        return this.raw = U.value, this.set = [[U]], this.formatted = void 0, this;
      if (this.options = B, this.loose = !!B.loose, this.includePrerelease = !!B.includePrerelease, this.raw = U.trim().replace(e, " "), this.set = this.raw.split("||").map((M) => this.parseRange(M.trim())).filter((M) => M.length), !this.set.length)
        throw new TypeError(`Invalid SemVer Range: ${this.raw}`);
      if (this.set.length > 1) {
        const M = this.set[0];
        if (this.set = this.set.filter((z) => !_(z[0])), this.set.length === 0)
          this.set = [M];
        else if (this.set.length > 1) {
          for (const z of this.set)
            if (z.length === 1 && v(z[0])) {
              this.set = [z];
              break;
            }
        }
      }
      this.formatted = void 0;
    }
    get range() {
      if (this.formatted === void 0) {
        this.formatted = "";
        for (let U = 0; U < this.set.length; U++) {
          U > 0 && (this.formatted += "||");
          const B = this.set[U];
          for (let M = 0; M < B.length; M++)
            M > 0 && (this.formatted += " "), this.formatted += B[M].toString().trim();
        }
      }
      return this.formatted;
    }
    format() {
      return this.range;
    }
    toString() {
      return this.range;
    }
    parseRange(U) {
      const M = ((this.options.includePrerelease && p) | (this.options.loose && $)) + ":" + U, z = n.get(M);
      if (z)
        return z;
      const q = this.options.loose, I = q ? c[u.HYPHENRANGELOOSE] : c[u.HYPHENRANGE];
      U = U.replace(I, V(this.options.includePrerelease)), a("hyphen replace", U), U = U.replace(c[u.COMPARATORTRIM], l), a("comparator trim", U), U = U.replace(c[u.TILDETRIM], d), a("tilde trim", U), U = U.replace(c[u.CARETTRIM], h), a("caret trim", U);
      let b = U.split(" ").map((g) => E(g, this.options)).join(" ").split(/\s+/).map((g) => j(g, this.options));
      q && (b = b.filter((g) => (a("loose invalid filter", g, this.options), !!g.match(c[u.COMPARATORLOOSE])))), a("range list", b);
      const O = /* @__PURE__ */ new Map(), S = b.map((g) => new s(g, this.options));
      for (const g of S) {
        if (_(g))
          return [g];
        O.set(g.value, g);
      }
      O.size > 1 && O.has("") && O.delete("");
      const f = [...O.values()];
      return n.set(M, f), f;
    }
    intersects(U, B) {
      if (!(U instanceof t))
        throw new TypeError("a Range is required");
      return this.set.some((M) => m(M, B) && U.set.some((z) => m(z, B) && M.every((q) => z.every((I) => q.intersects(I, B)))));
    }
    // if ANY of the sets match ALL of its comparators, then pass
    test(U) {
      if (!U)
        return !1;
      if (typeof U == "string")
        try {
          U = new o(U, this.options);
        } catch {
          return !1;
        }
      for (let B = 0; B < this.set.length; B++)
        if (Q(this.set[B], U, this.options))
          return !0;
      return !1;
    }
  }
  Hc = t;
  const r = bI, n = new r(), i = Zd, s = nc(), a = tc, o = _t, {
    safeRe: c,
    t: u,
    comparatorTrimReplace: l,
    tildeTrimReplace: d,
    caretTrimReplace: h
  } = ea, { FLAG_INCLUDE_PRERELEASE: p, FLAG_LOOSE: $ } = ec, _ = (L) => L.value === "<0.0.0-0", v = (L) => L.value === "", m = (L, U) => {
    let B = !0;
    const M = L.slice();
    let z = M.pop();
    for (; B && M.length; )
      B = M.every((q) => z.intersects(q, U)), z = M.pop();
    return B;
  }, E = (L, U) => (L = L.replace(c[u.BUILD], ""), a("comp", L, U), L = H(L, U), a("caret", L), L = R(L, U), a("tildes", L), L = ie(L, U), a("xrange", L), L = J(L, U), a("stars", L), L), T = (L) => !L || L.toLowerCase() === "x" || L === "*", R = (L, U) => L.trim().split(/\s+/).map((B) => F(B, U)).join(" "), F = (L, U) => {
    const B = U.loose ? c[u.TILDELOOSE] : c[u.TILDE];
    return L.replace(B, (M, z, q, I, b) => {
      a("tilde", L, M, z, q, I, b);
      let O;
      return T(z) ? O = "" : T(q) ? O = `>=${z}.0.0 <${+z + 1}.0.0-0` : T(I) ? O = `>=${z}.${q}.0 <${z}.${+q + 1}.0-0` : b ? (a("replaceTilde pr", b), O = `>=${z}.${q}.${I}-${b} <${z}.${+q + 1}.0-0`) : O = `>=${z}.${q}.${I} <${z}.${+q + 1}.0-0`, a("tilde return", O), O;
    });
  }, H = (L, U) => L.trim().split(/\s+/).map((B) => G(B, U)).join(" "), G = (L, U) => {
    a("caret", L, U);
    const B = U.loose ? c[u.CARETLOOSE] : c[u.CARET], M = U.includePrerelease ? "-0" : "";
    return L.replace(B, (z, q, I, b, O) => {
      a("caret", L, z, q, I, b, O);
      let S;
      return T(q) ? S = "" : T(I) ? S = `>=${q}.0.0${M} <${+q + 1}.0.0-0` : T(b) ? q === "0" ? S = `>=${q}.${I}.0${M} <${q}.${+I + 1}.0-0` : S = `>=${q}.${I}.0${M} <${+q + 1}.0.0-0` : O ? (a("replaceCaret pr", O), q === "0" ? I === "0" ? S = `>=${q}.${I}.${b}-${O} <${q}.${I}.${+b + 1}-0` : S = `>=${q}.${I}.${b}-${O} <${q}.${+I + 1}.0-0` : S = `>=${q}.${I}.${b}-${O} <${+q + 1}.0.0-0`) : (a("no pr"), q === "0" ? I === "0" ? S = `>=${q}.${I}.${b}${M} <${q}.${I}.${+b + 1}-0` : S = `>=${q}.${I}.${b}${M} <${q}.${+I + 1}.0-0` : S = `>=${q}.${I}.${b} <${+q + 1}.0.0-0`), a("caret return", S), S;
    });
  }, ie = (L, U) => (a("replaceXRanges", L, U), L.split(/\s+/).map((B) => C(B, U)).join(" ")), C = (L, U) => {
    L = L.trim();
    const B = U.loose ? c[u.XRANGELOOSE] : c[u.XRANGE];
    return L.replace(B, (M, z, q, I, b, O) => {
      a("xRange", L, M, z, q, I, b, O);
      const S = T(q), f = S || T(I), g = f || T(b), N = g;
      return z === "=" && N && (z = ""), O = U.includePrerelease ? "-0" : "", S ? z === ">" || z === "<" ? M = "<0.0.0-0" : M = "*" : z && N ? (f && (I = 0), b = 0, z === ">" ? (z = ">=", f ? (q = +q + 1, I = 0, b = 0) : (I = +I + 1, b = 0)) : z === "<=" && (z = "<", f ? q = +q + 1 : I = +I + 1), z === "<" && (O = "-0"), M = `${z + q}.${I}.${b}${O}`) : f ? M = `>=${q}.0.0${O} <${+q + 1}.0.0-0` : g && (M = `>=${q}.${I}.0${O} <${q}.${+I + 1}.0-0`), a("xRange return", M), M;
    });
  }, J = (L, U) => (a("replaceStars", L, U), L.trim().replace(c[u.STAR], "")), j = (L, U) => (a("replaceGTE0", L, U), L.trim().replace(c[U.includePrerelease ? u.GTE0PRE : u.GTE0], "")), V = (L) => (U, B, M, z, q, I, b, O, S, f, g, N) => (T(M) ? B = "" : T(z) ? B = `>=${M}.0.0${L ? "-0" : ""}` : T(q) ? B = `>=${M}.${z}.0${L ? "-0" : ""}` : I ? B = `>=${B}` : B = `>=${B}${L ? "-0" : ""}`, T(S) ? O = "" : T(f) ? O = `<${+S + 1}.0.0-0` : T(g) ? O = `<${S}.${+f + 1}.0-0` : N ? O = `<=${S}.${f}.${g}-${N}` : L ? O = `<${S}.${f}.${+g + 1}-0` : O = `<=${O}`, `${B} ${O}`.trim()), Q = (L, U, B) => {
    for (let M = 0; M < L.length; M++)
      if (!L[M].test(U))
        return !1;
    if (U.prerelease.length && !B.includePrerelease) {
      for (let M = 0; M < L.length; M++)
        if (a(L[M].semver), L[M].semver !== s.ANY && L[M].semver.prerelease.length > 0) {
          const z = L[M].semver;
          if (z.major === U.major && z.minor === U.minor && z.patch === U.patch)
            return !0;
        }
      return !1;
    }
    return !0;
  };
  return Hc;
}
var Gc, fp;
function nc() {
  if (fp) return Gc;
  fp = 1;
  const e = Symbol("SemVer ANY");
  class t {
    static get ANY() {
      return e;
    }
    constructor(l, d) {
      if (d = r(d), l instanceof t) {
        if (l.loose === !!d.loose)
          return l;
        l = l.value;
      }
      l = l.trim().split(/\s+/).join(" "), a("comparator", l, d), this.options = d, this.loose = !!d.loose, this.parse(l), this.semver === e ? this.value = "" : this.value = this.operator + this.semver.version, a("comp", this);
    }
    parse(l) {
      const d = this.options.loose ? n[i.COMPARATORLOOSE] : n[i.COMPARATOR], h = l.match(d);
      if (!h)
        throw new TypeError(`Invalid comparator: ${l}`);
      this.operator = h[1] !== void 0 ? h[1] : "", this.operator === "=" && (this.operator = ""), h[2] ? this.semver = new o(h[2], this.options.loose) : this.semver = e;
    }
    toString() {
      return this.value;
    }
    test(l) {
      if (a("Comparator.test", l, this.options.loose), this.semver === e || l === e)
        return !0;
      if (typeof l == "string")
        try {
          l = new o(l, this.options);
        } catch {
          return !1;
        }
      return s(l, this.operator, this.semver, this.options);
    }
    intersects(l, d) {
      if (!(l instanceof t))
        throw new TypeError("a Comparator is required");
      return this.operator === "" ? this.value === "" ? !0 : new c(l.value, d).test(this.value) : l.operator === "" ? l.value === "" ? !0 : new c(this.value, d).test(l.semver) : (d = r(d), d.includePrerelease && (this.value === "<0.0.0-0" || l.value === "<0.0.0-0") || !d.includePrerelease && (this.value.startsWith("<0.0.0") || l.value.startsWith("<0.0.0")) ? !1 : !!(this.operator.startsWith(">") && l.operator.startsWith(">") || this.operator.startsWith("<") && l.operator.startsWith("<") || this.semver.version === l.semver.version && this.operator.includes("=") && l.operator.includes("=") || s(this.semver, "<", l.semver, d) && this.operator.startsWith(">") && l.operator.startsWith("<") || s(this.semver, ">", l.semver, d) && this.operator.startsWith("<") && l.operator.startsWith(">")));
    }
  }
  Gc = t;
  const r = Zd, { safeRe: n, t: i } = ea, s = c0, a = tc, o = _t, c = ir();
  return Gc;
}
const SI = ir(), PI = (e, t, r) => {
  try {
    t = new SI(t, r);
  } catch {
    return !1;
  }
  return t.test(e);
};
var ic = PI;
const TI = ir(), NI = (e, t) => new TI(e, t).set.map((r) => r.map((n) => n.value).join(" ").trim().split(" "));
var OI = NI;
const AI = _t, CI = ir(), RI = (e, t, r) => {
  let n = null, i = null, s = null;
  try {
    s = new CI(t, r);
  } catch {
    return null;
  }
  return e.forEach((a) => {
    s.test(a) && (!n || i.compare(a) === -1) && (n = a, i = new AI(n, r));
  }), n;
};
var II = RI;
const DI = _t, kI = ir(), FI = (e, t, r) => {
  let n = null, i = null, s = null;
  try {
    s = new kI(t, r);
  } catch {
    return null;
  }
  return e.forEach((a) => {
    s.test(a) && (!n || i.compare(a) === 1) && (n = a, i = new DI(n, r));
  }), n;
};
var jI = FI;
const zc = _t, LI = ir(), hp = rc, UI = (e, t) => {
  e = new LI(e, t);
  let r = new zc("0.0.0");
  if (e.test(r) || (r = new zc("0.0.0-0"), e.test(r)))
    return r;
  r = null;
  for (let n = 0; n < e.set.length; ++n) {
    const i = e.set[n];
    let s = null;
    i.forEach((a) => {
      const o = new zc(a.semver.version);
      switch (a.operator) {
        case ">":
          o.prerelease.length === 0 ? o.patch++ : o.prerelease.push(0), o.raw = o.format();
        case "":
        case ">=":
          (!s || hp(o, s)) && (s = o);
          break;
        case "<":
        case "<=":
          break;
        default:
          throw new Error(`Unexpected operation: ${a.operator}`);
      }
    }), s && (!r || hp(r, s)) && (r = s);
  }
  return r && e.test(r) ? r : null;
};
var MI = UI;
const xI = ir(), VI = (e, t) => {
  try {
    return new xI(e, t).range || "*";
  } catch {
    return null;
  }
};
var qI = VI;
const BI = _t, l0 = nc(), { ANY: HI } = l0, GI = ir(), zI = ic, pp = rc, mp = tf, KI = nf, WI = rf, YI = (e, t, r, n) => {
  e = new BI(e, n), t = new GI(t, n);
  let i, s, a, o, c;
  switch (r) {
    case ">":
      i = pp, s = KI, a = mp, o = ">", c = ">=";
      break;
    case "<":
      i = mp, s = WI, a = pp, o = "<", c = "<=";
      break;
    default:
      throw new TypeError('Must provide a hilo val of "<" or ">"');
  }
  if (zI(e, t, n))
    return !1;
  for (let u = 0; u < t.set.length; ++u) {
    const l = t.set[u];
    let d = null, h = null;
    if (l.forEach((p) => {
      p.semver === HI && (p = new l0(">=0.0.0")), d = d || p, h = h || p, i(p.semver, d.semver, n) ? d = p : a(p.semver, h.semver, n) && (h = p);
    }), d.operator === o || d.operator === c || (!h.operator || h.operator === o) && s(e, h.semver))
      return !1;
    if (h.operator === c && a(e, h.semver))
      return !1;
  }
  return !0;
};
var sf = YI;
const XI = sf, JI = (e, t, r) => XI(e, t, ">", r);
var QI = JI;
const ZI = sf, eD = (e, t, r) => ZI(e, t, "<", r);
var tD = eD;
const yp = ir(), rD = (e, t, r) => (e = new yp(e, r), t = new yp(t, r), e.intersects(t, r));
var nD = rD;
const iD = ic, sD = nr;
var aD = (e, t, r) => {
  const n = [];
  let i = null, s = null;
  const a = e.sort((l, d) => sD(l, d, r));
  for (const l of a)
    iD(l, t, r) ? (s = l, i || (i = l)) : (s && n.push([i, s]), s = null, i = null);
  i && n.push([i, null]);
  const o = [];
  for (const [l, d] of n)
    l === d ? o.push(l) : !d && l === a[0] ? o.push("*") : d ? l === a[0] ? o.push(`<=${d}`) : o.push(`${l} - ${d}`) : o.push(`>=${l}`);
  const c = o.join(" || "), u = typeof t.raw == "string" ? t.raw : String(t);
  return c.length < u.length ? c : t;
};
const gp = ir(), af = nc(), { ANY: Kc } = af, as = ic, of = nr, oD = (e, t, r = {}) => {
  if (e === t)
    return !0;
  e = new gp(e, r), t = new gp(t, r);
  let n = !1;
  e: for (const i of e.set) {
    for (const s of t.set) {
      const a = lD(i, s, r);
      if (n = n || a !== null, a)
        continue e;
    }
    if (n)
      return !1;
  }
  return !0;
}, cD = [new af(">=0.0.0-0")], _p = [new af(">=0.0.0")], lD = (e, t, r) => {
  if (e === t)
    return !0;
  if (e.length === 1 && e[0].semver === Kc) {
    if (t.length === 1 && t[0].semver === Kc)
      return !0;
    r.includePrerelease ? e = cD : e = _p;
  }
  if (t.length === 1 && t[0].semver === Kc) {
    if (r.includePrerelease)
      return !0;
    t = _p;
  }
  const n = /* @__PURE__ */ new Set();
  let i, s;
  for (const p of e)
    p.operator === ">" || p.operator === ">=" ? i = vp(i, p, r) : p.operator === "<" || p.operator === "<=" ? s = $p(s, p, r) : n.add(p.semver);
  if (n.size > 1)
    return null;
  let a;
  if (i && s) {
    if (a = of(i.semver, s.semver, r), a > 0)
      return null;
    if (a === 0 && (i.operator !== ">=" || s.operator !== "<="))
      return null;
  }
  for (const p of n) {
    if (i && !as(p, String(i), r) || s && !as(p, String(s), r))
      return null;
    for (const $ of t)
      if (!as(p, String($), r))
        return !1;
    return !0;
  }
  let o, c, u, l, d = s && !r.includePrerelease && s.semver.prerelease.length ? s.semver : !1, h = i && !r.includePrerelease && i.semver.prerelease.length ? i.semver : !1;
  d && d.prerelease.length === 1 && s.operator === "<" && d.prerelease[0] === 0 && (d = !1);
  for (const p of t) {
    if (l = l || p.operator === ">" || p.operator === ">=", u = u || p.operator === "<" || p.operator === "<=", i) {
      if (h && p.semver.prerelease && p.semver.prerelease.length && p.semver.major === h.major && p.semver.minor === h.minor && p.semver.patch === h.patch && (h = !1), p.operator === ">" || p.operator === ">=") {
        if (o = vp(i, p, r), o === p && o !== i)
          return !1;
      } else if (i.operator === ">=" && !as(i.semver, String(p), r))
        return !1;
    }
    if (s) {
      if (d && p.semver.prerelease && p.semver.prerelease.length && p.semver.major === d.major && p.semver.minor === d.minor && p.semver.patch === d.patch && (d = !1), p.operator === "<" || p.operator === "<=") {
        if (c = $p(s, p, r), c === p && c !== s)
          return !1;
      } else if (s.operator === "<=" && !as(s.semver, String(p), r))
        return !1;
    }
    if (!p.operator && (s || i) && a !== 0)
      return !1;
  }
  return !(i && u && !s && a !== 0 || s && l && !i && a !== 0 || h || d);
}, vp = (e, t, r) => {
  if (!e)
    return t;
  const n = of(e.semver, t.semver, r);
  return n > 0 ? e : n < 0 || t.operator === ">" && e.operator === ">=" ? t : e;
}, $p = (e, t, r) => {
  if (!e)
    return t;
  const n = of(e.semver, t.semver, r);
  return n < 0 ? e : n > 0 || t.operator === "<" && e.operator === "<=" ? t : e;
};
var uD = oD;
const Wc = ea, wp = ec, dD = _t, Ep = s0, fD = zi, hD = vR, pD = ER, mD = SR, yD = TR, gD = AR, _D = IR, vD = FR, $D = UR, wD = nr, ED = qR, bD = GR, SD = ef, PD = YR, TD = QR, ND = rc, OD = tf, AD = a0, CD = o0, RD = rf, ID = nf, DD = c0, kD = wI, FD = nc(), jD = ir(), LD = ic, UD = OI, MD = II, xD = jI, VD = MI, qD = qI, BD = sf, HD = QI, GD = tD, zD = nD, KD = aD, WD = uD;
var cf = {
  parse: fD,
  valid: hD,
  clean: pD,
  inc: mD,
  diff: yD,
  major: gD,
  minor: _D,
  patch: vD,
  prerelease: $D,
  compare: wD,
  rcompare: ED,
  compareLoose: bD,
  compareBuild: SD,
  sort: PD,
  rsort: TD,
  gt: ND,
  lt: OD,
  eq: AD,
  neq: CD,
  gte: RD,
  lte: ID,
  cmp: DD,
  coerce: kD,
  Comparator: FD,
  Range: jD,
  satisfies: LD,
  toComparators: UD,
  maxSatisfying: MD,
  minSatisfying: xD,
  minVersion: VD,
  validRange: qD,
  outside: BD,
  gtr: HD,
  ltr: GD,
  intersects: zD,
  simplifyRange: KD,
  subset: WD,
  SemVer: dD,
  re: Wc.re,
  src: Wc.src,
  tokens: Wc.t,
  SEMVER_SPEC_VERSION: wp.SEMVER_SPEC_VERSION,
  RELEASE_TYPES: wp.RELEASE_TYPES,
  compareIdentifiers: Ep.compareIdentifiers,
  rcompareIdentifiers: Ep.rcompareIdentifiers
};
const ii = /* @__PURE__ */ py(cf), YD = Object.prototype.toString, XD = "[object Uint8Array]", JD = "[object ArrayBuffer]";
function u0(e, t, r) {
  return e ? e.constructor === t ? !0 : YD.call(e) === r : !1;
}
function d0(e) {
  return u0(e, Uint8Array, XD);
}
function QD(e) {
  return u0(e, ArrayBuffer, JD);
}
function ZD(e) {
  return d0(e) || QD(e);
}
function ek(e) {
  if (!d0(e))
    throw new TypeError(`Expected \`Uint8Array\`, got \`${typeof e}\``);
}
function tk(e) {
  if (!ZD(e))
    throw new TypeError(`Expected \`Uint8Array\` or \`ArrayBuffer\`, got \`${typeof e}\``);
}
function Yc(e, t) {
  if (e.length === 0)
    return new Uint8Array(0);
  t ?? (t = e.reduce((i, s) => i + s.length, 0));
  const r = new Uint8Array(t);
  let n = 0;
  for (const i of e)
    ek(i), r.set(i, n), n += i.length;
  return r;
}
const Ua = {
  utf8: new globalThis.TextDecoder("utf8")
};
function Ma(e, t = "utf8") {
  return tk(e), Ua[t] ?? (Ua[t] = new globalThis.TextDecoder(t)), Ua[t].decode(e);
}
function rk(e) {
  if (typeof e != "string")
    throw new TypeError(`Expected \`string\`, got \`${typeof e}\``);
}
const nk = new globalThis.TextEncoder();
function xa(e) {
  return rk(e), nk.encode(e);
}
Array.from({ length: 256 }, (e, t) => t.toString(16).padStart(2, "0"));
const Xc = "aes-256-cbc", Kr = () => /* @__PURE__ */ Object.create(null), bp = (e) => e !== void 0, Jc = (e, t) => {
  const r = /* @__PURE__ */ new Set([
    "undefined",
    "symbol",
    "function"
  ]), n = typeof t;
  if (r.has(n))
    throw new TypeError(`Setting a value of type \`${n}\` for key \`${e}\` is not allowed as it's not supported by JSON`);
}, Xr = "__internal__", Qc = `${Xr}.migrations.version`;
var tn, Jt, bt, xt, Mn, xn, Ai, lr, He, f0, h0, p0, m0, y0, g0, _0, v0;
class ik {
  constructor(t = {}) {
    or(this, He);
    Zn(this, "path");
    Zn(this, "events");
    or(this, tn);
    or(this, Jt);
    or(this, bt);
    or(this, xt, {});
    or(this, Mn, !1);
    or(this, xn);
    or(this, Ai);
    or(this, lr);
    Zn(this, "_deserialize", (t) => JSON.parse(t));
    Zn(this, "_serialize", (t) => JSON.stringify(t, void 0, "	"));
    const r = Sr(this, He, f0).call(this, t);
    It(this, bt, r), Sr(this, He, h0).call(this, r), Sr(this, He, m0).call(this, r), Sr(this, He, y0).call(this, r), this.events = new EventTarget(), It(this, Jt, r.encryptionKey), this.path = Sr(this, He, g0).call(this, r), Sr(this, He, _0).call(this, r), r.watch && this._watch();
  }
  get(t, r) {
    if (se(this, bt).accessPropertiesByDotNotation)
      return this._get(t, r);
    const { store: n } = this;
    return t in n ? n[t] : r;
  }
  set(t, r) {
    if (typeof t != "string" && typeof t != "object")
      throw new TypeError(`Expected \`key\` to be of type \`string\` or \`object\`, got ${typeof t}`);
    if (typeof t != "object" && r === void 0)
      throw new TypeError("Use `delete()` to clear values");
    if (this._containsReservedKey(t))
      throw new TypeError(`Please don't use the ${Xr} key, as it's used to manage this module internal operations.`);
    const { store: n } = this, i = (s, a) => {
      if (Jc(s, a), se(this, bt).accessPropertiesByDotNotation)
        va(n, s, a);
      else {
        if (s === "__proto__" || s === "constructor" || s === "prototype")
          return;
        n[s] = a;
      }
    };
    if (typeof t == "object") {
      const s = t;
      for (const [a, o] of Object.entries(s))
        i(a, o);
    } else
      i(t, r);
    this.store = n;
  }
  has(t) {
    return se(this, bt).accessPropertiesByDotNotation ? Cc(this.store, t) : t in this.store;
  }
  appendToArray(t, r) {
    Jc(t, r);
    const n = se(this, bt).accessPropertiesByDotNotation ? this._get(t, []) : t in this.store ? this.store[t] : [];
    if (!Array.isArray(n))
      throw new TypeError(`The key \`${t}\` is already set to a non-array value`);
    this.set(t, [...n, r]);
  }
  /**
      Reset items to their default values, as defined by the `defaults` or `schema` option.
  
      @see `clear()` to reset all items.
  
      @param keys - The keys of the items to reset.
      */
  reset(...t) {
    for (const r of t)
      bp(se(this, xt)[r]) && this.set(r, se(this, xt)[r]);
  }
  delete(t) {
    const { store: r } = this;
    se(this, bt).accessPropertiesByDotNotation ? R$(r, t) : delete r[t], this.store = r;
  }
  /**
      Delete all items.
  
      This resets known items to their default values, if defined by the `defaults` or `schema` option.
      */
  clear() {
    const t = Kr();
    for (const r of Object.keys(se(this, xt)))
      bp(se(this, xt)[r]) && (Jc(r, se(this, xt)[r]), se(this, bt).accessPropertiesByDotNotation ? va(t, r, se(this, xt)[r]) : t[r] = se(this, xt)[r]);
    this.store = t;
  }
  onDidChange(t, r) {
    if (typeof t != "string")
      throw new TypeError(`Expected \`key\` to be of type \`string\`, got ${typeof t}`);
    if (typeof r != "function")
      throw new TypeError(`Expected \`callback\` to be of type \`function\`, got ${typeof r}`);
    return this._handleValueChange(() => this.get(t), r);
  }
  /**
      Watches the whole config object, calling `callback` on any changes.
  
      @param callback - A callback function that is called on any changes. When a `key` is first set `oldValue` will be `undefined`, and when a key is deleted `newValue` will be `undefined`.
      @returns A function, that when called, will unsubscribe.
      */
  onDidAnyChange(t) {
    if (typeof t != "function")
      throw new TypeError(`Expected \`callback\` to be of type \`function\`, got ${typeof t}`);
    return this._handleStoreChange(t);
  }
  get size() {
    return Object.keys(this.store).filter((r) => !this._isReservedKeyPath(r)).length;
  }
  /**
      Get all the config as an object or replace the current config with an object.
  
      @example
      ```
      console.log(config.store);
      //=> {name: 'John', age: 30}
      ```
  
      @example
      ```
      config.store = {
          hello: 'world'
      };
      ```
      */
  get store() {
    var t;
    try {
      const r = ae.readFileSync(this.path, se(this, Jt) ? null : "utf8"), n = this._decryptData(r), i = this._deserialize(n);
      return se(this, Mn) || this._validate(i), Object.assign(Kr(), i);
    } catch (r) {
      if ((r == null ? void 0 : r.code) === "ENOENT")
        return this._ensureDirectory(), Kr();
      if (se(this, bt).clearInvalidConfig) {
        const n = r;
        if (n.name === "SyntaxError" || (t = n.message) != null && t.startsWith("Config schema violation:"))
          return Kr();
      }
      throw r;
    }
  }
  set store(t) {
    if (this._ensureDirectory(), !Cc(t, Xr))
      try {
        const r = ae.readFileSync(this.path, se(this, Jt) ? null : "utf8"), n = this._decryptData(r), i = this._deserialize(n);
        Cc(i, Xr) && va(t, Xr, rh(i, Xr));
      } catch {
      }
    se(this, Mn) || this._validate(t), this._write(t), this.events.dispatchEvent(new Event("change"));
  }
  *[Symbol.iterator]() {
    for (const [t, r] of Object.entries(this.store))
      this._isReservedKeyPath(t) || (yield [t, r]);
  }
  /**
  Close the file watcher if one exists. This is useful in tests to prevent the process from hanging.
  */
  _closeWatcher() {
    se(this, xn) && (se(this, xn).close(), It(this, xn, void 0)), se(this, Ai) && (ae.unwatchFile(this.path), It(this, Ai, !1)), It(this, lr, void 0);
  }
  _decryptData(t) {
    if (!se(this, Jt))
      return typeof t == "string" ? t : Ma(t);
    try {
      const r = t.slice(0, 16), n = Sn.pbkdf2Sync(se(this, Jt), r, 1e4, 32, "sha512"), i = Sn.createDecipheriv(Xc, n, r), s = t.slice(17), a = typeof s == "string" ? xa(s) : s;
      return Ma(Yc([i.update(a), i.final()]));
    } catch {
      try {
        const r = t.slice(0, 16), n = Sn.pbkdf2Sync(se(this, Jt), r.toString(), 1e4, 32, "sha512"), i = Sn.createDecipheriv(Xc, n, r), s = t.slice(17), a = typeof s == "string" ? xa(s) : s;
        return Ma(Yc([i.update(a), i.final()]));
      } catch {
      }
    }
    return typeof t == "string" ? t : Ma(t);
  }
  _handleStoreChange(t) {
    let r = this.store;
    const n = () => {
      const i = r, s = this.store;
      eh(s, i) || (r = s, t.call(this, s, i));
    };
    return this.events.addEventListener("change", n), () => {
      this.events.removeEventListener("change", n);
    };
  }
  _handleValueChange(t, r) {
    let n = t();
    const i = () => {
      const s = n, a = t();
      eh(a, s) || (n = a, r.call(this, a, s));
    };
    return this.events.addEventListener("change", i), () => {
      this.events.removeEventListener("change", i);
    };
  }
  _validate(t) {
    if (!se(this, tn) || se(this, tn).call(this, t) || !se(this, tn).errors)
      return;
    const n = se(this, tn).errors.map(({ instancePath: i, message: s = "" }) => `\`${i.slice(1)}\` ${s}`);
    throw new Error("Config schema violation: " + n.join("; "));
  }
  _ensureDirectory() {
    ae.mkdirSync(he.dirname(this.path), { recursive: !0 });
  }
  _write(t) {
    let r = this._serialize(t);
    if (se(this, Jt)) {
      const n = Sn.randomBytes(16), i = Sn.pbkdf2Sync(se(this, Jt), n, 1e4, 32, "sha512"), s = Sn.createCipheriv(Xc, i, n);
      r = Yc([n, xa(":"), s.update(xa(r)), s.final()]);
    }
    if (Oe.env.SNAP)
      ae.writeFileSync(this.path, r, { mode: se(this, bt).configFileMode });
    else
      try {
        hy(this.path, r, { mode: se(this, bt).configFileMode });
      } catch (n) {
        if ((n == null ? void 0 : n.code) === "EXDEV") {
          ae.writeFileSync(this.path, r, { mode: se(this, bt).configFileMode });
          return;
        }
        throw n;
      }
  }
  _watch() {
    if (this._ensureDirectory(), ae.existsSync(this.path) || this._write(Kr()), Oe.platform === "win32" || Oe.platform === "darwin") {
      se(this, lr) ?? It(this, lr, np(() => {
        this.events.dispatchEvent(new Event("change"));
      }, { wait: 100 }));
      const t = he.dirname(this.path), r = he.basename(this.path);
      It(this, xn, ae.watch(t, { persistent: !1, encoding: "utf8" }, (n, i) => {
        i && i !== r || typeof se(this, lr) == "function" && se(this, lr).call(this);
      }));
    } else
      se(this, lr) ?? It(this, lr, np(() => {
        this.events.dispatchEvent(new Event("change"));
      }, { wait: 1e3 })), ae.watchFile(this.path, { persistent: !1 }, (t, r) => {
        typeof se(this, lr) == "function" && se(this, lr).call(this);
      }), It(this, Ai, !0);
  }
  _migrate(t, r, n) {
    let i = this._get(Qc, "0.0.0");
    const s = Object.keys(t).filter((o) => this._shouldPerformMigration(o, i, r));
    let a = structuredClone(this.store);
    for (const o of s)
      try {
        n && n(this, {
          fromVersion: i,
          toVersion: o,
          finalVersion: r,
          versions: s
        });
        const c = t[o];
        c == null || c(this), this._set(Qc, o), i = o, a = structuredClone(this.store);
      } catch (c) {
        this.store = a;
        try {
          this._write(a);
        } catch {
        }
        const u = c instanceof Error ? c.message : String(c);
        throw new Error(`Something went wrong during the migration! Changes applied to the store until this failed migration will be restored. ${u}`);
      }
    (this._isVersionInRangeFormat(i) || !ii.eq(i, r)) && this._set(Qc, r);
  }
  _containsReservedKey(t) {
    return typeof t == "string" ? this._isReservedKeyPath(t) : !t || typeof t != "object" ? !1 : this._objectContainsReservedKey(t);
  }
  _objectContainsReservedKey(t) {
    if (!t || typeof t != "object")
      return !1;
    for (const [r, n] of Object.entries(t))
      if (this._isReservedKeyPath(r) || this._objectContainsReservedKey(n))
        return !0;
    return !1;
  }
  _isReservedKeyPath(t) {
    return t === Xr || t.startsWith(`${Xr}.`);
  }
  _isVersionInRangeFormat(t) {
    return ii.clean(t) === null;
  }
  _shouldPerformMigration(t, r, n) {
    return this._isVersionInRangeFormat(t) ? r !== "0.0.0" && ii.satisfies(r, t) ? !1 : ii.satisfies(n, t) : !(ii.lte(t, r) || ii.gt(t, n));
  }
  _get(t, r) {
    return rh(this.store, t, r);
  }
  _set(t, r) {
    const { store: n } = this;
    va(n, t, r), this.store = n;
  }
}
tn = new WeakMap(), Jt = new WeakMap(), bt = new WeakMap(), xt = new WeakMap(), Mn = new WeakMap(), xn = new WeakMap(), Ai = new WeakMap(), lr = new WeakMap(), He = new WeakSet(), f0 = function(t) {
  const r = {
    configName: "config",
    fileExtension: "json",
    projectSuffix: "nodejs",
    clearInvalidConfig: !1,
    accessPropertiesByDotNotation: !0,
    configFileMode: 438,
    ...t
  };
  if (!r.cwd) {
    if (!r.projectName)
      throw new Error("Please specify the `projectName` option.");
    r.cwd = F$(r.projectName, { suffix: r.projectSuffix }).config;
  }
  return typeof r.fileExtension == "string" && (r.fileExtension = r.fileExtension.replace(/^\.+/, "")), r;
}, h0 = function(t) {
  if (!(t.schema ?? t.ajvOptions ?? t.rootSchema))
    return;
  if (t.schema && typeof t.schema != "object")
    throw new TypeError("The `schema` option must be an object.");
  const r = YC.default, n = new jT.Ajv2020({
    allErrors: !0,
    useDefaults: !0,
    ...t.ajvOptions
  });
  r(n);
  const i = {
    ...t.rootSchema,
    type: "object",
    properties: t.schema
  };
  It(this, tn, n.compile(i)), Sr(this, He, p0).call(this, t.schema);
}, p0 = function(t) {
  const r = Object.entries(t ?? {});
  for (const [n, i] of r) {
    if (!i || typeof i != "object" || !Object.hasOwn(i, "default"))
      continue;
    const { default: s } = i;
    s !== void 0 && (se(this, xt)[n] = s);
  }
}, m0 = function(t) {
  t.defaults && Object.assign(se(this, xt), t.defaults);
}, y0 = function(t) {
  t.serialize && (this._serialize = t.serialize), t.deserialize && (this._deserialize = t.deserialize);
}, g0 = function(t) {
  const r = typeof t.fileExtension == "string" ? t.fileExtension : void 0, n = r ? `.${r}` : "";
  return he.resolve(t.cwd, `${t.configName ?? "config"}${n}`);
}, _0 = function(t) {
  if (t.migrations) {
    Sr(this, He, v0).call(this, t), this._validate(this.store);
    return;
  }
  const r = this.store, n = Object.assign(Kr(), t.defaults ?? {}, r);
  this._validate(n);
  try {
    th.deepEqual(r, n);
  } catch {
    this.store = n;
  }
}, v0 = function(t) {
  const { migrations: r, projectVersion: n } = t;
  if (r) {
    if (!n)
      throw new Error("Please specify the `projectVersion` option.");
    It(this, Mn, !0);
    try {
      const i = this.store, s = Object.assign(Kr(), t.defaults ?? {}, i);
      try {
        th.deepEqual(i, s);
      } catch {
        this._write(s);
      }
      this._migrate(r, n, t.beforeEachMigration);
    } finally {
      It(this, Mn, !1);
    }
  }
};
const { app: co, ipcMain: Gl, shell: sk } = Ir;
let Sp = !1;
const Pp = () => {
  if (!Gl || !co)
    throw new Error("Electron Store: You need to call `.initRenderer()` from the main process.");
  const e = {
    defaultCwd: co.getPath("userData"),
    appVersion: co.getVersion()
  };
  return Sp || (Gl.on("electron-store-get-data", (t) => {
    t.returnValue = e;
  }), Sp = !0), e;
};
class ak extends ik {
  constructor(t) {
    let r, n;
    if (Oe.type === "renderer") {
      const i = Ir.ipcRenderer.sendSync("electron-store-get-data");
      if (!i)
        throw new Error("Electron Store: You need to call `.initRenderer()` from the main process.");
      ({ defaultCwd: r, appVersion: n } = i);
    } else Gl && co && ({ defaultCwd: r, appVersion: n } = Pp());
    t = {
      name: "config",
      ...t
    }, t.projectVersion || (t.projectVersion = n), t.cwd ? t.cwd = he.isAbsolute(t.cwd) ? t.cwd : he.join(r, t.cwd) : t.cwd = r, t.configName = t.name, delete t.name, super(t);
  }
  static initRenderer() {
    Pp();
  }
  async openInEditor() {
    const t = await sk.openPath(this.path);
    if (t)
      throw new Error(t);
  }
}
var Tr = {}, Wn = {}, vt = {};
vt.fromCallback = function(e) {
  return Object.defineProperty(function(...t) {
    if (typeof t[t.length - 1] == "function") e.apply(this, t);
    else
      return new Promise((r, n) => {
        t.push((i, s) => i != null ? n(i) : r(s)), e.apply(this, t);
      });
  }, "name", { value: e.name });
};
vt.fromPromise = function(e) {
  return Object.defineProperty(function(...t) {
    const r = t[t.length - 1];
    if (typeof r != "function") return e.apply(this, t);
    t.pop(), e.apply(this, t).then((n) => r(null, n), r);
  }, "name", { value: e.name });
};
var Wr = N$, ok = process.cwd, lo = null, ck = process.env.GRACEFUL_FS_PLATFORM || process.platform;
process.cwd = function() {
  return lo || (lo = ok.call(process)), lo;
};
try {
  process.cwd();
} catch {
}
if (typeof process.chdir == "function") {
  var Tp = process.chdir;
  process.chdir = function(e) {
    lo = null, Tp.call(process, e);
  }, Object.setPrototypeOf && Object.setPrototypeOf(process.chdir, Tp);
}
var lk = uk;
function uk(e) {
  Wr.hasOwnProperty("O_SYMLINK") && process.version.match(/^v0\.6\.[0-2]|^v0\.5\./) && t(e), e.lutimes || r(e), e.chown = s(e.chown), e.fchown = s(e.fchown), e.lchown = s(e.lchown), e.chmod = n(e.chmod), e.fchmod = n(e.fchmod), e.lchmod = n(e.lchmod), e.chownSync = a(e.chownSync), e.fchownSync = a(e.fchownSync), e.lchownSync = a(e.lchownSync), e.chmodSync = i(e.chmodSync), e.fchmodSync = i(e.fchmodSync), e.lchmodSync = i(e.lchmodSync), e.stat = o(e.stat), e.fstat = o(e.fstat), e.lstat = o(e.lstat), e.statSync = c(e.statSync), e.fstatSync = c(e.fstatSync), e.lstatSync = c(e.lstatSync), e.chmod && !e.lchmod && (e.lchmod = function(l, d, h) {
    h && process.nextTick(h);
  }, e.lchmodSync = function() {
  }), e.chown && !e.lchown && (e.lchown = function(l, d, h, p) {
    p && process.nextTick(p);
  }, e.lchownSync = function() {
  }), ck === "win32" && (e.rename = typeof e.rename != "function" ? e.rename : function(l) {
    function d(h, p, $) {
      var _ = Date.now(), v = 0;
      l(h, p, function m(E) {
        if (E && (E.code === "EACCES" || E.code === "EPERM" || E.code === "EBUSY") && Date.now() - _ < 6e4) {
          setTimeout(function() {
            e.stat(p, function(T, R) {
              T && T.code === "ENOENT" ? l(h, p, m) : $(E);
            });
          }, v), v < 100 && (v += 10);
          return;
        }
        $ && $(E);
      });
    }
    return Object.setPrototypeOf && Object.setPrototypeOf(d, l), d;
  }(e.rename)), e.read = typeof e.read != "function" ? e.read : function(l) {
    function d(h, p, $, _, v, m) {
      var E;
      if (m && typeof m == "function") {
        var T = 0;
        E = function(R, F, H) {
          if (R && R.code === "EAGAIN" && T < 10)
            return T++, l.call(e, h, p, $, _, v, E);
          m.apply(this, arguments);
        };
      }
      return l.call(e, h, p, $, _, v, E);
    }
    return Object.setPrototypeOf && Object.setPrototypeOf(d, l), d;
  }(e.read), e.readSync = typeof e.readSync != "function" ? e.readSync : /* @__PURE__ */ function(l) {
    return function(d, h, p, $, _) {
      for (var v = 0; ; )
        try {
          return l.call(e, d, h, p, $, _);
        } catch (m) {
          if (m.code === "EAGAIN" && v < 10) {
            v++;
            continue;
          }
          throw m;
        }
    };
  }(e.readSync);
  function t(l) {
    l.lchmod = function(d, h, p) {
      l.open(
        d,
        Wr.O_WRONLY | Wr.O_SYMLINK,
        h,
        function($, _) {
          if ($) {
            p && p($);
            return;
          }
          l.fchmod(_, h, function(v) {
            l.close(_, function(m) {
              p && p(v || m);
            });
          });
        }
      );
    }, l.lchmodSync = function(d, h) {
      var p = l.openSync(d, Wr.O_WRONLY | Wr.O_SYMLINK, h), $ = !0, _;
      try {
        _ = l.fchmodSync(p, h), $ = !1;
      } finally {
        if ($)
          try {
            l.closeSync(p);
          } catch {
          }
        else
          l.closeSync(p);
      }
      return _;
    };
  }
  function r(l) {
    Wr.hasOwnProperty("O_SYMLINK") && l.futimes ? (l.lutimes = function(d, h, p, $) {
      l.open(d, Wr.O_SYMLINK, function(_, v) {
        if (_) {
          $ && $(_);
          return;
        }
        l.futimes(v, h, p, function(m) {
          l.close(v, function(E) {
            $ && $(m || E);
          });
        });
      });
    }, l.lutimesSync = function(d, h, p) {
      var $ = l.openSync(d, Wr.O_SYMLINK), _, v = !0;
      try {
        _ = l.futimesSync($, h, p), v = !1;
      } finally {
        if (v)
          try {
            l.closeSync($);
          } catch {
          }
        else
          l.closeSync($);
      }
      return _;
    }) : l.futimes && (l.lutimes = function(d, h, p, $) {
      $ && process.nextTick($);
    }, l.lutimesSync = function() {
    });
  }
  function n(l) {
    return l && function(d, h, p) {
      return l.call(e, d, h, function($) {
        u($) && ($ = null), p && p.apply(this, arguments);
      });
    };
  }
  function i(l) {
    return l && function(d, h) {
      try {
        return l.call(e, d, h);
      } catch (p) {
        if (!u(p)) throw p;
      }
    };
  }
  function s(l) {
    return l && function(d, h, p, $) {
      return l.call(e, d, h, p, function(_) {
        u(_) && (_ = null), $ && $.apply(this, arguments);
      });
    };
  }
  function a(l) {
    return l && function(d, h, p) {
      try {
        return l.call(e, d, h, p);
      } catch ($) {
        if (!u($)) throw $;
      }
    };
  }
  function o(l) {
    return l && function(d, h, p) {
      typeof h == "function" && (p = h, h = null);
      function $(_, v) {
        v && (v.uid < 0 && (v.uid += 4294967296), v.gid < 0 && (v.gid += 4294967296)), p && p.apply(this, arguments);
      }
      return h ? l.call(e, d, h, $) : l.call(e, d, $);
    };
  }
  function c(l) {
    return l && function(d, h) {
      var p = h ? l.call(e, d, h) : l.call(e, d);
      return p && (p.uid < 0 && (p.uid += 4294967296), p.gid < 0 && (p.gid += 4294967296)), p;
    };
  }
  function u(l) {
    if (!l || l.code === "ENOSYS")
      return !0;
    var d = !process.getuid || process.getuid() !== 0;
    return !!(d && (l.code === "EINVAL" || l.code === "EPERM"));
  }
}
var Np = zs.Stream, dk = fk;
function fk(e) {
  return {
    ReadStream: t,
    WriteStream: r
  };
  function t(n, i) {
    if (!(this instanceof t)) return new t(n, i);
    Np.call(this);
    var s = this;
    this.path = n, this.fd = null, this.readable = !0, this.paused = !1, this.flags = "r", this.mode = 438, this.bufferSize = 64 * 1024, i = i || {};
    for (var a = Object.keys(i), o = 0, c = a.length; o < c; o++) {
      var u = a[o];
      this[u] = i[u];
    }
    if (this.encoding && this.setEncoding(this.encoding), this.start !== void 0) {
      if (typeof this.start != "number")
        throw TypeError("start must be a Number");
      if (this.end === void 0)
        this.end = 1 / 0;
      else if (typeof this.end != "number")
        throw TypeError("end must be a Number");
      if (this.start > this.end)
        throw new Error("start must be <= end");
      this.pos = this.start;
    }
    if (this.fd !== null) {
      process.nextTick(function() {
        s._read();
      });
      return;
    }
    e.open(this.path, this.flags, this.mode, function(l, d) {
      if (l) {
        s.emit("error", l), s.readable = !1;
        return;
      }
      s.fd = d, s.emit("open", d), s._read();
    });
  }
  function r(n, i) {
    if (!(this instanceof r)) return new r(n, i);
    Np.call(this), this.path = n, this.fd = null, this.writable = !0, this.flags = "w", this.encoding = "binary", this.mode = 438, this.bytesWritten = 0, i = i || {};
    for (var s = Object.keys(i), a = 0, o = s.length; a < o; a++) {
      var c = s[a];
      this[c] = i[c];
    }
    if (this.start !== void 0) {
      if (typeof this.start != "number")
        throw TypeError("start must be a Number");
      if (this.start < 0)
        throw new Error("start must be >= zero");
      this.pos = this.start;
    }
    this.busy = !1, this._queue = [], this.fd === null && (this._open = e.open, this._queue.push([this._open, this.path, this.flags, this.mode, void 0]), this.flush());
  }
}
var hk = mk, pk = Object.getPrototypeOf || function(e) {
  return e.__proto__;
};
function mk(e) {
  if (e === null || typeof e != "object")
    return e;
  if (e instanceof Object)
    var t = { __proto__: pk(e) };
  else
    var t = /* @__PURE__ */ Object.create(null);
  return Object.getOwnPropertyNames(e).forEach(function(r) {
    Object.defineProperty(t, r, Object.getOwnPropertyDescriptor(e, r));
  }), t;
}
var Ce = mn, yk = lk, gk = dk, _k = hk, Va = ou, Qe, Po;
typeof Symbol == "function" && typeof Symbol.for == "function" ? (Qe = Symbol.for("graceful-fs.queue"), Po = Symbol.for("graceful-fs.previous")) : (Qe = "___graceful-fs.queue", Po = "___graceful-fs.previous");
function vk() {
}
function $0(e, t) {
  Object.defineProperty(e, Qe, {
    get: function() {
      return t;
    }
  });
}
var Vn = vk;
Va.debuglog ? Vn = Va.debuglog("gfs4") : /\bgfs4\b/i.test(process.env.NODE_DEBUG || "") && (Vn = function() {
  var e = Va.format.apply(Va, arguments);
  e = "GFS4: " + e.split(/\n/).join(`
GFS4: `), console.error(e);
});
if (!Ce[Qe]) {
  var $k = mt[Qe] || [];
  $0(Ce, $k), Ce.close = function(e) {
    function t(r, n) {
      return e.call(Ce, r, function(i) {
        i || Op(), typeof n == "function" && n.apply(this, arguments);
      });
    }
    return Object.defineProperty(t, Po, {
      value: e
    }), t;
  }(Ce.close), Ce.closeSync = function(e) {
    function t(r) {
      e.apply(Ce, arguments), Op();
    }
    return Object.defineProperty(t, Po, {
      value: e
    }), t;
  }(Ce.closeSync), /\bgfs4\b/i.test(process.env.NODE_DEBUG || "") && process.on("exit", function() {
    Vn(Ce[Qe]), iy.equal(Ce[Qe].length, 0);
  });
}
mt[Qe] || $0(mt, Ce[Qe]);
var $t = lf(_k(Ce));
process.env.TEST_GRACEFUL_FS_GLOBAL_PATCH && !Ce.__patched && ($t = lf(Ce), Ce.__patched = !0);
function lf(e) {
  yk(e), e.gracefulify = lf, e.createReadStream = F, e.createWriteStream = H;
  var t = e.readFile;
  e.readFile = r;
  function r(C, J, j) {
    return typeof J == "function" && (j = J, J = null), V(C, J, j);
    function V(Q, L, U, B) {
      return t(Q, L, function(M) {
        M && (M.code === "EMFILE" || M.code === "ENFILE") ? si([V, [Q, L, U], M, B || Date.now(), Date.now()]) : typeof U == "function" && U.apply(this, arguments);
      });
    }
  }
  var n = e.writeFile;
  e.writeFile = i;
  function i(C, J, j, V) {
    return typeof j == "function" && (V = j, j = null), Q(C, J, j, V);
    function Q(L, U, B, M, z) {
      return n(L, U, B, function(q) {
        q && (q.code === "EMFILE" || q.code === "ENFILE") ? si([Q, [L, U, B, M], q, z || Date.now(), Date.now()]) : typeof M == "function" && M.apply(this, arguments);
      });
    }
  }
  var s = e.appendFile;
  s && (e.appendFile = a);
  function a(C, J, j, V) {
    return typeof j == "function" && (V = j, j = null), Q(C, J, j, V);
    function Q(L, U, B, M, z) {
      return s(L, U, B, function(q) {
        q && (q.code === "EMFILE" || q.code === "ENFILE") ? si([Q, [L, U, B, M], q, z || Date.now(), Date.now()]) : typeof M == "function" && M.apply(this, arguments);
      });
    }
  }
  var o = e.copyFile;
  o && (e.copyFile = c);
  function c(C, J, j, V) {
    return typeof j == "function" && (V = j, j = 0), Q(C, J, j, V);
    function Q(L, U, B, M, z) {
      return o(L, U, B, function(q) {
        q && (q.code === "EMFILE" || q.code === "ENFILE") ? si([Q, [L, U, B, M], q, z || Date.now(), Date.now()]) : typeof M == "function" && M.apply(this, arguments);
      });
    }
  }
  var u = e.readdir;
  e.readdir = d;
  var l = /^v[0-5]\./;
  function d(C, J, j) {
    typeof J == "function" && (j = J, J = null);
    var V = l.test(process.version) ? function(U, B, M, z) {
      return u(U, Q(
        U,
        B,
        M,
        z
      ));
    } : function(U, B, M, z) {
      return u(U, B, Q(
        U,
        B,
        M,
        z
      ));
    };
    return V(C, J, j);
    function Q(L, U, B, M) {
      return function(z, q) {
        z && (z.code === "EMFILE" || z.code === "ENFILE") ? si([
          V,
          [L, U, B],
          z,
          M || Date.now(),
          Date.now()
        ]) : (q && q.sort && q.sort(), typeof B == "function" && B.call(this, z, q));
      };
    }
  }
  if (process.version.substr(0, 4) === "v0.8") {
    var h = gk(e);
    m = h.ReadStream, T = h.WriteStream;
  }
  var p = e.ReadStream;
  p && (m.prototype = Object.create(p.prototype), m.prototype.open = E);
  var $ = e.WriteStream;
  $ && (T.prototype = Object.create($.prototype), T.prototype.open = R), Object.defineProperty(e, "ReadStream", {
    get: function() {
      return m;
    },
    set: function(C) {
      m = C;
    },
    enumerable: !0,
    configurable: !0
  }), Object.defineProperty(e, "WriteStream", {
    get: function() {
      return T;
    },
    set: function(C) {
      T = C;
    },
    enumerable: !0,
    configurable: !0
  });
  var _ = m;
  Object.defineProperty(e, "FileReadStream", {
    get: function() {
      return _;
    },
    set: function(C) {
      _ = C;
    },
    enumerable: !0,
    configurable: !0
  });
  var v = T;
  Object.defineProperty(e, "FileWriteStream", {
    get: function() {
      return v;
    },
    set: function(C) {
      v = C;
    },
    enumerable: !0,
    configurable: !0
  });
  function m(C, J) {
    return this instanceof m ? (p.apply(this, arguments), this) : m.apply(Object.create(m.prototype), arguments);
  }
  function E() {
    var C = this;
    ie(C.path, C.flags, C.mode, function(J, j) {
      J ? (C.autoClose && C.destroy(), C.emit("error", J)) : (C.fd = j, C.emit("open", j), C.read());
    });
  }
  function T(C, J) {
    return this instanceof T ? ($.apply(this, arguments), this) : T.apply(Object.create(T.prototype), arguments);
  }
  function R() {
    var C = this;
    ie(C.path, C.flags, C.mode, function(J, j) {
      J ? (C.destroy(), C.emit("error", J)) : (C.fd = j, C.emit("open", j));
    });
  }
  function F(C, J) {
    return new e.ReadStream(C, J);
  }
  function H(C, J) {
    return new e.WriteStream(C, J);
  }
  var G = e.open;
  e.open = ie;
  function ie(C, J, j, V) {
    return typeof j == "function" && (V = j, j = null), Q(C, J, j, V);
    function Q(L, U, B, M, z) {
      return G(L, U, B, function(q, I) {
        q && (q.code === "EMFILE" || q.code === "ENFILE") ? si([Q, [L, U, B, M], q, z || Date.now(), Date.now()]) : typeof M == "function" && M.apply(this, arguments);
      });
    }
  }
  return e;
}
function si(e) {
  Vn("ENQUEUE", e[0].name, e[1]), Ce[Qe].push(e), uf();
}
var qa;
function Op() {
  for (var e = Date.now(), t = 0; t < Ce[Qe].length; ++t)
    Ce[Qe][t].length > 2 && (Ce[Qe][t][3] = e, Ce[Qe][t][4] = e);
  uf();
}
function uf() {
  if (clearTimeout(qa), qa = void 0, Ce[Qe].length !== 0) {
    var e = Ce[Qe].shift(), t = e[0], r = e[1], n = e[2], i = e[3], s = e[4];
    if (i === void 0)
      Vn("RETRY", t.name, r), t.apply(null, r);
    else if (Date.now() - i >= 6e4) {
      Vn("TIMEOUT", t.name, r);
      var a = r.pop();
      typeof a == "function" && a.call(null, n);
    } else {
      var o = Date.now() - s, c = Math.max(s - i, 1), u = Math.min(c * 1.2, 100);
      o >= u ? (Vn("RETRY", t.name, r), t.apply(null, r.concat([i]))) : Ce[Qe].push(e);
    }
    qa === void 0 && (qa = setTimeout(uf, 0));
  }
}
(function(e) {
  const t = vt.fromCallback, r = $t, n = [
    "access",
    "appendFile",
    "chmod",
    "chown",
    "close",
    "copyFile",
    "fchmod",
    "fchown",
    "fdatasync",
    "fstat",
    "fsync",
    "ftruncate",
    "futimes",
    "lchmod",
    "lchown",
    "link",
    "lstat",
    "mkdir",
    "mkdtemp",
    "open",
    "opendir",
    "readdir",
    "readFile",
    "readlink",
    "realpath",
    "rename",
    "rm",
    "rmdir",
    "stat",
    "symlink",
    "truncate",
    "unlink",
    "utimes",
    "writeFile"
  ].filter((i) => typeof r[i] == "function");
  Object.assign(e, r), n.forEach((i) => {
    e[i] = t(r[i]);
  }), e.exists = function(i, s) {
    return typeof s == "function" ? r.exists(i, s) : new Promise((a) => r.exists(i, a));
  }, e.read = function(i, s, a, o, c, u) {
    return typeof u == "function" ? r.read(i, s, a, o, c, u) : new Promise((l, d) => {
      r.read(i, s, a, o, c, (h, p, $) => {
        if (h) return d(h);
        l({ bytesRead: p, buffer: $ });
      });
    });
  }, e.write = function(i, s, ...a) {
    return typeof a[a.length - 1] == "function" ? r.write(i, s, ...a) : new Promise((o, c) => {
      r.write(i, s, ...a, (u, l, d) => {
        if (u) return c(u);
        o({ bytesWritten: l, buffer: d });
      });
    });
  }, typeof r.writev == "function" && (e.writev = function(i, s, ...a) {
    return typeof a[a.length - 1] == "function" ? r.writev(i, s, ...a) : new Promise((o, c) => {
      r.writev(i, s, ...a, (u, l, d) => {
        if (u) return c(u);
        o({ bytesWritten: l, buffers: d });
      });
    });
  }), typeof r.realpath.native == "function" ? e.realpath.native = t(r.realpath.native) : process.emitWarning(
    "fs.realpath.native is not a function. Is fs being monkey-patched?",
    "Warning",
    "fs-extra-WARN0003"
  );
})(Wn);
var df = {}, w0 = {};
const wk = Re;
w0.checkPath = function(t) {
  if (process.platform === "win32" && /[<>:"|?*]/.test(t.replace(wk.parse(t).root, ""))) {
    const n = new Error(`Path contains invalid characters: ${t}`);
    throw n.code = "EINVAL", n;
  }
};
const E0 = Wn, { checkPath: b0 } = w0, S0 = (e) => {
  const t = { mode: 511 };
  return typeof e == "number" ? e : { ...t, ...e }.mode;
};
df.makeDir = async (e, t) => (b0(e), E0.mkdir(e, {
  mode: S0(t),
  recursive: !0
}));
df.makeDirSync = (e, t) => (b0(e), E0.mkdirSync(e, {
  mode: S0(t),
  recursive: !0
}));
const Ek = vt.fromPromise, { makeDir: bk, makeDirSync: Zc } = df, el = Ek(bk);
var gr = {
  mkdirs: el,
  mkdirsSync: Zc,
  // alias
  mkdirp: el,
  mkdirpSync: Zc,
  ensureDir: el,
  ensureDirSync: Zc
};
const Sk = vt.fromPromise, P0 = Wn;
function Pk(e) {
  return P0.access(e).then(() => !0).catch(() => !1);
}
var Yn = {
  pathExists: Sk(Pk),
  pathExistsSync: P0.existsSync
};
const Ni = $t;
function Tk(e, t, r, n) {
  Ni.open(e, "r+", (i, s) => {
    if (i) return n(i);
    Ni.futimes(s, t, r, (a) => {
      Ni.close(s, (o) => {
        n && n(a || o);
      });
    });
  });
}
function Nk(e, t, r) {
  const n = Ni.openSync(e, "r+");
  return Ni.futimesSync(n, t, r), Ni.closeSync(n);
}
var T0 = {
  utimesMillis: Tk,
  utimesMillisSync: Nk
};
const ki = Wn, Be = Re, Ok = ou;
function Ak(e, t, r) {
  const n = r.dereference ? (i) => ki.stat(i, { bigint: !0 }) : (i) => ki.lstat(i, { bigint: !0 });
  return Promise.all([
    n(e),
    n(t).catch((i) => {
      if (i.code === "ENOENT") return null;
      throw i;
    })
  ]).then(([i, s]) => ({ srcStat: i, destStat: s }));
}
function Ck(e, t, r) {
  let n;
  const i = r.dereference ? (a) => ki.statSync(a, { bigint: !0 }) : (a) => ki.lstatSync(a, { bigint: !0 }), s = i(e);
  try {
    n = i(t);
  } catch (a) {
    if (a.code === "ENOENT") return { srcStat: s, destStat: null };
    throw a;
  }
  return { srcStat: s, destStat: n };
}
function Rk(e, t, r, n, i) {
  Ok.callbackify(Ak)(e, t, n, (s, a) => {
    if (s) return i(s);
    const { srcStat: o, destStat: c } = a;
    if (c) {
      if (ta(o, c)) {
        const u = Be.basename(e), l = Be.basename(t);
        return r === "move" && u !== l && u.toLowerCase() === l.toLowerCase() ? i(null, { srcStat: o, destStat: c, isChangingCase: !0 }) : i(new Error("Source and destination must not be the same."));
      }
      if (o.isDirectory() && !c.isDirectory())
        return i(new Error(`Cannot overwrite non-directory '${t}' with directory '${e}'.`));
      if (!o.isDirectory() && c.isDirectory())
        return i(new Error(`Cannot overwrite directory '${t}' with non-directory '${e}'.`));
    }
    return o.isDirectory() && ff(e, t) ? i(new Error(sc(e, t, r))) : i(null, { srcStat: o, destStat: c });
  });
}
function Ik(e, t, r, n) {
  const { srcStat: i, destStat: s } = Ck(e, t, n);
  if (s) {
    if (ta(i, s)) {
      const a = Be.basename(e), o = Be.basename(t);
      if (r === "move" && a !== o && a.toLowerCase() === o.toLowerCase())
        return { srcStat: i, destStat: s, isChangingCase: !0 };
      throw new Error("Source and destination must not be the same.");
    }
    if (i.isDirectory() && !s.isDirectory())
      throw new Error(`Cannot overwrite non-directory '${t}' with directory '${e}'.`);
    if (!i.isDirectory() && s.isDirectory())
      throw new Error(`Cannot overwrite directory '${t}' with non-directory '${e}'.`);
  }
  if (i.isDirectory() && ff(e, t))
    throw new Error(sc(e, t, r));
  return { srcStat: i, destStat: s };
}
function N0(e, t, r, n, i) {
  const s = Be.resolve(Be.dirname(e)), a = Be.resolve(Be.dirname(r));
  if (a === s || a === Be.parse(a).root) return i();
  ki.stat(a, { bigint: !0 }, (o, c) => o ? o.code === "ENOENT" ? i() : i(o) : ta(t, c) ? i(new Error(sc(e, r, n))) : N0(e, t, a, n, i));
}
function O0(e, t, r, n) {
  const i = Be.resolve(Be.dirname(e)), s = Be.resolve(Be.dirname(r));
  if (s === i || s === Be.parse(s).root) return;
  let a;
  try {
    a = ki.statSync(s, { bigint: !0 });
  } catch (o) {
    if (o.code === "ENOENT") return;
    throw o;
  }
  if (ta(t, a))
    throw new Error(sc(e, r, n));
  return O0(e, t, s, n);
}
function ta(e, t) {
  return t.ino && t.dev && t.ino === e.ino && t.dev === e.dev;
}
function ff(e, t) {
  const r = Be.resolve(e).split(Be.sep).filter((i) => i), n = Be.resolve(t).split(Be.sep).filter((i) => i);
  return r.reduce((i, s, a) => i && n[a] === s, !0);
}
function sc(e, t, r) {
  return `Cannot ${r} '${e}' to a subdirectory of itself, '${t}'.`;
}
var Ki = {
  checkPaths: Rk,
  checkPathsSync: Ik,
  checkParentPaths: N0,
  checkParentPathsSync: O0,
  isSrcSubdir: ff,
  areIdentical: ta
};
const Nt = $t, Rs = Re, Dk = gr.mkdirs, kk = Yn.pathExists, Fk = T0.utimesMillis, Is = Ki;
function jk(e, t, r, n) {
  typeof r == "function" && !n ? (n = r, r = {}) : typeof r == "function" && (r = { filter: r }), n = n || function() {
  }, r = r || {}, r.clobber = "clobber" in r ? !!r.clobber : !0, r.overwrite = "overwrite" in r ? !!r.overwrite : r.clobber, r.preserveTimestamps && process.arch === "ia32" && process.emitWarning(
    `Using the preserveTimestamps option in 32-bit node is not recommended;

	see https://github.com/jprichardson/node-fs-extra/issues/269`,
    "Warning",
    "fs-extra-WARN0001"
  ), Is.checkPaths(e, t, "copy", r, (i, s) => {
    if (i) return n(i);
    const { srcStat: a, destStat: o } = s;
    Is.checkParentPaths(e, a, t, "copy", (c) => c ? n(c) : r.filter ? A0(Ap, o, e, t, r, n) : Ap(o, e, t, r, n));
  });
}
function Ap(e, t, r, n, i) {
  const s = Rs.dirname(r);
  kk(s, (a, o) => {
    if (a) return i(a);
    if (o) return To(e, t, r, n, i);
    Dk(s, (c) => c ? i(c) : To(e, t, r, n, i));
  });
}
function A0(e, t, r, n, i, s) {
  Promise.resolve(i.filter(r, n)).then((a) => a ? e(t, r, n, i, s) : s(), (a) => s(a));
}
function Lk(e, t, r, n, i) {
  return n.filter ? A0(To, e, t, r, n, i) : To(e, t, r, n, i);
}
function To(e, t, r, n, i) {
  (n.dereference ? Nt.stat : Nt.lstat)(t, (a, o) => a ? i(a) : o.isDirectory() ? Hk(o, e, t, r, n, i) : o.isFile() || o.isCharacterDevice() || o.isBlockDevice() ? Uk(o, e, t, r, n, i) : o.isSymbolicLink() ? Kk(e, t, r, n, i) : o.isSocket() ? i(new Error(`Cannot copy a socket file: ${t}`)) : o.isFIFO() ? i(new Error(`Cannot copy a FIFO pipe: ${t}`)) : i(new Error(`Unknown file: ${t}`)));
}
function Uk(e, t, r, n, i, s) {
  return t ? Mk(e, r, n, i, s) : C0(e, r, n, i, s);
}
function Mk(e, t, r, n, i) {
  if (n.overwrite)
    Nt.unlink(r, (s) => s ? i(s) : C0(e, t, r, n, i));
  else return n.errorOnExist ? i(new Error(`'${r}' already exists`)) : i();
}
function C0(e, t, r, n, i) {
  Nt.copyFile(t, r, (s) => s ? i(s) : n.preserveTimestamps ? xk(e.mode, t, r, i) : ac(r, e.mode, i));
}
function xk(e, t, r, n) {
  return Vk(e) ? qk(r, e, (i) => i ? n(i) : Cp(e, t, r, n)) : Cp(e, t, r, n);
}
function Vk(e) {
  return (e & 128) === 0;
}
function qk(e, t, r) {
  return ac(e, t | 128, r);
}
function Cp(e, t, r, n) {
  Bk(t, r, (i) => i ? n(i) : ac(r, e, n));
}
function ac(e, t, r) {
  return Nt.chmod(e, t, r);
}
function Bk(e, t, r) {
  Nt.stat(e, (n, i) => n ? r(n) : Fk(t, i.atime, i.mtime, r));
}
function Hk(e, t, r, n, i, s) {
  return t ? R0(r, n, i, s) : Gk(e.mode, r, n, i, s);
}
function Gk(e, t, r, n, i) {
  Nt.mkdir(r, (s) => {
    if (s) return i(s);
    R0(t, r, n, (a) => a ? i(a) : ac(r, e, i));
  });
}
function R0(e, t, r, n) {
  Nt.readdir(e, (i, s) => i ? n(i) : I0(s, e, t, r, n));
}
function I0(e, t, r, n, i) {
  const s = e.pop();
  return s ? zk(e, s, t, r, n, i) : i();
}
function zk(e, t, r, n, i, s) {
  const a = Rs.join(r, t), o = Rs.join(n, t);
  Is.checkPaths(a, o, "copy", i, (c, u) => {
    if (c) return s(c);
    const { destStat: l } = u;
    Lk(l, a, o, i, (d) => d ? s(d) : I0(e, r, n, i, s));
  });
}
function Kk(e, t, r, n, i) {
  Nt.readlink(t, (s, a) => {
    if (s) return i(s);
    if (n.dereference && (a = Rs.resolve(process.cwd(), a)), e)
      Nt.readlink(r, (o, c) => o ? o.code === "EINVAL" || o.code === "UNKNOWN" ? Nt.symlink(a, r, i) : i(o) : (n.dereference && (c = Rs.resolve(process.cwd(), c)), Is.isSrcSubdir(a, c) ? i(new Error(`Cannot copy '${a}' to a subdirectory of itself, '${c}'.`)) : e.isDirectory() && Is.isSrcSubdir(c, a) ? i(new Error(`Cannot overwrite '${c}' with '${a}'.`)) : Wk(a, r, i)));
    else
      return Nt.symlink(a, r, i);
  });
}
function Wk(e, t, r) {
  Nt.unlink(t, (n) => n ? r(n) : Nt.symlink(e, t, r));
}
var Yk = jk;
const ct = $t, Ds = Re, Xk = gr.mkdirsSync, Jk = T0.utimesMillisSync, ks = Ki;
function Qk(e, t, r) {
  typeof r == "function" && (r = { filter: r }), r = r || {}, r.clobber = "clobber" in r ? !!r.clobber : !0, r.overwrite = "overwrite" in r ? !!r.overwrite : r.clobber, r.preserveTimestamps && process.arch === "ia32" && process.emitWarning(
    `Using the preserveTimestamps option in 32-bit node is not recommended;

	see https://github.com/jprichardson/node-fs-extra/issues/269`,
    "Warning",
    "fs-extra-WARN0002"
  );
  const { srcStat: n, destStat: i } = ks.checkPathsSync(e, t, "copy", r);
  return ks.checkParentPathsSync(e, n, t, "copy"), Zk(i, e, t, r);
}
function Zk(e, t, r, n) {
  if (n.filter && !n.filter(t, r)) return;
  const i = Ds.dirname(r);
  return ct.existsSync(i) || Xk(i), D0(e, t, r, n);
}
function eF(e, t, r, n) {
  if (!(n.filter && !n.filter(t, r)))
    return D0(e, t, r, n);
}
function D0(e, t, r, n) {
  const s = (n.dereference ? ct.statSync : ct.lstatSync)(t);
  if (s.isDirectory()) return oF(s, e, t, r, n);
  if (s.isFile() || s.isCharacterDevice() || s.isBlockDevice()) return tF(s, e, t, r, n);
  if (s.isSymbolicLink()) return uF(e, t, r, n);
  throw s.isSocket() ? new Error(`Cannot copy a socket file: ${t}`) : s.isFIFO() ? new Error(`Cannot copy a FIFO pipe: ${t}`) : new Error(`Unknown file: ${t}`);
}
function tF(e, t, r, n, i) {
  return t ? rF(e, r, n, i) : k0(e, r, n, i);
}
function rF(e, t, r, n) {
  if (n.overwrite)
    return ct.unlinkSync(r), k0(e, t, r, n);
  if (n.errorOnExist)
    throw new Error(`'${r}' already exists`);
}
function k0(e, t, r, n) {
  return ct.copyFileSync(t, r), n.preserveTimestamps && nF(e.mode, t, r), hf(r, e.mode);
}
function nF(e, t, r) {
  return iF(e) && sF(r, e), aF(t, r);
}
function iF(e) {
  return (e & 128) === 0;
}
function sF(e, t) {
  return hf(e, t | 128);
}
function hf(e, t) {
  return ct.chmodSync(e, t);
}
function aF(e, t) {
  const r = ct.statSync(e);
  return Jk(t, r.atime, r.mtime);
}
function oF(e, t, r, n, i) {
  return t ? F0(r, n, i) : cF(e.mode, r, n, i);
}
function cF(e, t, r, n) {
  return ct.mkdirSync(r), F0(t, r, n), hf(r, e);
}
function F0(e, t, r) {
  ct.readdirSync(e).forEach((n) => lF(n, e, t, r));
}
function lF(e, t, r, n) {
  const i = Ds.join(t, e), s = Ds.join(r, e), { destStat: a } = ks.checkPathsSync(i, s, "copy", n);
  return eF(a, i, s, n);
}
function uF(e, t, r, n) {
  let i = ct.readlinkSync(t);
  if (n.dereference && (i = Ds.resolve(process.cwd(), i)), e) {
    let s;
    try {
      s = ct.readlinkSync(r);
    } catch (a) {
      if (a.code === "EINVAL" || a.code === "UNKNOWN") return ct.symlinkSync(i, r);
      throw a;
    }
    if (n.dereference && (s = Ds.resolve(process.cwd(), s)), ks.isSrcSubdir(i, s))
      throw new Error(`Cannot copy '${i}' to a subdirectory of itself, '${s}'.`);
    if (ct.statSync(r).isDirectory() && ks.isSrcSubdir(s, i))
      throw new Error(`Cannot overwrite '${s}' with '${i}'.`);
    return dF(i, r);
  } else
    return ct.symlinkSync(i, r);
}
function dF(e, t) {
  return ct.unlinkSync(t), ct.symlinkSync(e, t);
}
var fF = Qk;
const hF = vt.fromCallback;
var pf = {
  copy: hF(Yk),
  copySync: fF
};
const Rp = $t, j0 = Re, we = iy, Fs = process.platform === "win32";
function L0(e) {
  [
    "unlink",
    "chmod",
    "stat",
    "lstat",
    "rmdir",
    "readdir"
  ].forEach((r) => {
    e[r] = e[r] || Rp[r], r = r + "Sync", e[r] = e[r] || Rp[r];
  }), e.maxBusyTries = e.maxBusyTries || 3;
}
function mf(e, t, r) {
  let n = 0;
  typeof t == "function" && (r = t, t = {}), we(e, "rimraf: missing path"), we.strictEqual(typeof e, "string", "rimraf: path should be a string"), we.strictEqual(typeof r, "function", "rimraf: callback function required"), we(t, "rimraf: invalid options argument provided"), we.strictEqual(typeof t, "object", "rimraf: options should be object"), L0(t), Ip(e, t, function i(s) {
    if (s) {
      if ((s.code === "EBUSY" || s.code === "ENOTEMPTY" || s.code === "EPERM") && n < t.maxBusyTries) {
        n++;
        const a = n * 100;
        return setTimeout(() => Ip(e, t, i), a);
      }
      s.code === "ENOENT" && (s = null);
    }
    r(s);
  });
}
function Ip(e, t, r) {
  we(e), we(t), we(typeof r == "function"), t.lstat(e, (n, i) => {
    if (n && n.code === "ENOENT")
      return r(null);
    if (n && n.code === "EPERM" && Fs)
      return Dp(e, t, n, r);
    if (i && i.isDirectory())
      return uo(e, t, n, r);
    t.unlink(e, (s) => {
      if (s) {
        if (s.code === "ENOENT")
          return r(null);
        if (s.code === "EPERM")
          return Fs ? Dp(e, t, s, r) : uo(e, t, s, r);
        if (s.code === "EISDIR")
          return uo(e, t, s, r);
      }
      return r(s);
    });
  });
}
function Dp(e, t, r, n) {
  we(e), we(t), we(typeof n == "function"), t.chmod(e, 438, (i) => {
    i ? n(i.code === "ENOENT" ? null : r) : t.stat(e, (s, a) => {
      s ? n(s.code === "ENOENT" ? null : r) : a.isDirectory() ? uo(e, t, r, n) : t.unlink(e, n);
    });
  });
}
function kp(e, t, r) {
  let n;
  we(e), we(t);
  try {
    t.chmodSync(e, 438);
  } catch (i) {
    if (i.code === "ENOENT")
      return;
    throw r;
  }
  try {
    n = t.statSync(e);
  } catch (i) {
    if (i.code === "ENOENT")
      return;
    throw r;
  }
  n.isDirectory() ? fo(e, t, r) : t.unlinkSync(e);
}
function uo(e, t, r, n) {
  we(e), we(t), we(typeof n == "function"), t.rmdir(e, (i) => {
    i && (i.code === "ENOTEMPTY" || i.code === "EEXIST" || i.code === "EPERM") ? pF(e, t, n) : i && i.code === "ENOTDIR" ? n(r) : n(i);
  });
}
function pF(e, t, r) {
  we(e), we(t), we(typeof r == "function"), t.readdir(e, (n, i) => {
    if (n) return r(n);
    let s = i.length, a;
    if (s === 0) return t.rmdir(e, r);
    i.forEach((o) => {
      mf(j0.join(e, o), t, (c) => {
        if (!a) {
          if (c) return r(a = c);
          --s === 0 && t.rmdir(e, r);
        }
      });
    });
  });
}
function U0(e, t) {
  let r;
  t = t || {}, L0(t), we(e, "rimraf: missing path"), we.strictEqual(typeof e, "string", "rimraf: path should be a string"), we(t, "rimraf: missing options"), we.strictEqual(typeof t, "object", "rimraf: options should be object");
  try {
    r = t.lstatSync(e);
  } catch (n) {
    if (n.code === "ENOENT")
      return;
    n.code === "EPERM" && Fs && kp(e, t, n);
  }
  try {
    r && r.isDirectory() ? fo(e, t, null) : t.unlinkSync(e);
  } catch (n) {
    if (n.code === "ENOENT")
      return;
    if (n.code === "EPERM")
      return Fs ? kp(e, t, n) : fo(e, t, n);
    if (n.code !== "EISDIR")
      throw n;
    fo(e, t, n);
  }
}
function fo(e, t, r) {
  we(e), we(t);
  try {
    t.rmdirSync(e);
  } catch (n) {
    if (n.code === "ENOTDIR")
      throw r;
    if (n.code === "ENOTEMPTY" || n.code === "EEXIST" || n.code === "EPERM")
      mF(e, t);
    else if (n.code !== "ENOENT")
      throw n;
  }
}
function mF(e, t) {
  if (we(e), we(t), t.readdirSync(e).forEach((r) => U0(j0.join(e, r), t)), Fs) {
    const r = Date.now();
    do
      try {
        return t.rmdirSync(e, t);
      } catch {
      }
    while (Date.now() - r < 500);
  } else
    return t.rmdirSync(e, t);
}
var yF = mf;
mf.sync = U0;
const No = $t, gF = vt.fromCallback, M0 = yF;
function _F(e, t) {
  if (No.rm) return No.rm(e, { recursive: !0, force: !0 }, t);
  M0(e, t);
}
function vF(e) {
  if (No.rmSync) return No.rmSync(e, { recursive: !0, force: !0 });
  M0.sync(e);
}
var oc = {
  remove: gF(_F),
  removeSync: vF
};
const $F = vt.fromPromise, x0 = Wn, V0 = Re, q0 = gr, B0 = oc, Fp = $F(async function(t) {
  let r;
  try {
    r = await x0.readdir(t);
  } catch {
    return q0.mkdirs(t);
  }
  return Promise.all(r.map((n) => B0.remove(V0.join(t, n))));
});
function jp(e) {
  let t;
  try {
    t = x0.readdirSync(e);
  } catch {
    return q0.mkdirsSync(e);
  }
  t.forEach((r) => {
    r = V0.join(e, r), B0.removeSync(r);
  });
}
var wF = {
  emptyDirSync: jp,
  emptydirSync: jp,
  emptyDir: Fp,
  emptydir: Fp
};
const EF = vt.fromCallback, H0 = Re, sn = $t, G0 = gr;
function bF(e, t) {
  function r() {
    sn.writeFile(e, "", (n) => {
      if (n) return t(n);
      t();
    });
  }
  sn.stat(e, (n, i) => {
    if (!n && i.isFile()) return t();
    const s = H0.dirname(e);
    sn.stat(s, (a, o) => {
      if (a)
        return a.code === "ENOENT" ? G0.mkdirs(s, (c) => {
          if (c) return t(c);
          r();
        }) : t(a);
      o.isDirectory() ? r() : sn.readdir(s, (c) => {
        if (c) return t(c);
      });
    });
  });
}
function SF(e) {
  let t;
  try {
    t = sn.statSync(e);
  } catch {
  }
  if (t && t.isFile()) return;
  const r = H0.dirname(e);
  try {
    sn.statSync(r).isDirectory() || sn.readdirSync(r);
  } catch (n) {
    if (n && n.code === "ENOENT") G0.mkdirsSync(r);
    else throw n;
  }
  sn.writeFileSync(e, "");
}
var PF = {
  createFile: EF(bF),
  createFileSync: SF
};
const TF = vt.fromCallback, z0 = Re, en = $t, K0 = gr, NF = Yn.pathExists, { areIdentical: W0 } = Ki;
function OF(e, t, r) {
  function n(i, s) {
    en.link(i, s, (a) => {
      if (a) return r(a);
      r(null);
    });
  }
  en.lstat(t, (i, s) => {
    en.lstat(e, (a, o) => {
      if (a)
        return a.message = a.message.replace("lstat", "ensureLink"), r(a);
      if (s && W0(o, s)) return r(null);
      const c = z0.dirname(t);
      NF(c, (u, l) => {
        if (u) return r(u);
        if (l) return n(e, t);
        K0.mkdirs(c, (d) => {
          if (d) return r(d);
          n(e, t);
        });
      });
    });
  });
}
function AF(e, t) {
  let r;
  try {
    r = en.lstatSync(t);
  } catch {
  }
  try {
    const s = en.lstatSync(e);
    if (r && W0(s, r)) return;
  } catch (s) {
    throw s.message = s.message.replace("lstat", "ensureLink"), s;
  }
  const n = z0.dirname(t);
  return en.existsSync(n) || K0.mkdirsSync(n), en.linkSync(e, t);
}
var CF = {
  createLink: TF(OF),
  createLinkSync: AF
};
const an = Re, Ps = $t, RF = Yn.pathExists;
function IF(e, t, r) {
  if (an.isAbsolute(e))
    return Ps.lstat(e, (n) => n ? (n.message = n.message.replace("lstat", "ensureSymlink"), r(n)) : r(null, {
      toCwd: e,
      toDst: e
    }));
  {
    const n = an.dirname(t), i = an.join(n, e);
    return RF(i, (s, a) => s ? r(s) : a ? r(null, {
      toCwd: i,
      toDst: e
    }) : Ps.lstat(e, (o) => o ? (o.message = o.message.replace("lstat", "ensureSymlink"), r(o)) : r(null, {
      toCwd: e,
      toDst: an.relative(n, e)
    })));
  }
}
function DF(e, t) {
  let r;
  if (an.isAbsolute(e)) {
    if (r = Ps.existsSync(e), !r) throw new Error("absolute srcpath does not exist");
    return {
      toCwd: e,
      toDst: e
    };
  } else {
    const n = an.dirname(t), i = an.join(n, e);
    if (r = Ps.existsSync(i), r)
      return {
        toCwd: i,
        toDst: e
      };
    if (r = Ps.existsSync(e), !r) throw new Error("relative srcpath does not exist");
    return {
      toCwd: e,
      toDst: an.relative(n, e)
    };
  }
}
var kF = {
  symlinkPaths: IF,
  symlinkPathsSync: DF
};
const Y0 = $t;
function FF(e, t, r) {
  if (r = typeof t == "function" ? t : r, t = typeof t == "function" ? !1 : t, t) return r(null, t);
  Y0.lstat(e, (n, i) => {
    if (n) return r(null, "file");
    t = i && i.isDirectory() ? "dir" : "file", r(null, t);
  });
}
function jF(e, t) {
  let r;
  if (t) return t;
  try {
    r = Y0.lstatSync(e);
  } catch {
    return "file";
  }
  return r && r.isDirectory() ? "dir" : "file";
}
var LF = {
  symlinkType: FF,
  symlinkTypeSync: jF
};
const UF = vt.fromCallback, X0 = Re, Qt = Wn, J0 = gr, MF = J0.mkdirs, xF = J0.mkdirsSync, Q0 = kF, VF = Q0.symlinkPaths, qF = Q0.symlinkPathsSync, Z0 = LF, BF = Z0.symlinkType, HF = Z0.symlinkTypeSync, GF = Yn.pathExists, { areIdentical: e_ } = Ki;
function zF(e, t, r, n) {
  n = typeof r == "function" ? r : n, r = typeof r == "function" ? !1 : r, Qt.lstat(t, (i, s) => {
    !i && s.isSymbolicLink() ? Promise.all([
      Qt.stat(e),
      Qt.stat(t)
    ]).then(([a, o]) => {
      if (e_(a, o)) return n(null);
      Lp(e, t, r, n);
    }) : Lp(e, t, r, n);
  });
}
function Lp(e, t, r, n) {
  VF(e, t, (i, s) => {
    if (i) return n(i);
    e = s.toDst, BF(s.toCwd, r, (a, o) => {
      if (a) return n(a);
      const c = X0.dirname(t);
      GF(c, (u, l) => {
        if (u) return n(u);
        if (l) return Qt.symlink(e, t, o, n);
        MF(c, (d) => {
          if (d) return n(d);
          Qt.symlink(e, t, o, n);
        });
      });
    });
  });
}
function KF(e, t, r) {
  let n;
  try {
    n = Qt.lstatSync(t);
  } catch {
  }
  if (n && n.isSymbolicLink()) {
    const o = Qt.statSync(e), c = Qt.statSync(t);
    if (e_(o, c)) return;
  }
  const i = qF(e, t);
  e = i.toDst, r = HF(i.toCwd, r);
  const s = X0.dirname(t);
  return Qt.existsSync(s) || xF(s), Qt.symlinkSync(e, t, r);
}
var WF = {
  createSymlink: UF(zF),
  createSymlinkSync: KF
};
const { createFile: Up, createFileSync: Mp } = PF, { createLink: xp, createLinkSync: Vp } = CF, { createSymlink: qp, createSymlinkSync: Bp } = WF;
var YF = {
  // file
  createFile: Up,
  createFileSync: Mp,
  ensureFile: Up,
  ensureFileSync: Mp,
  // link
  createLink: xp,
  createLinkSync: Vp,
  ensureLink: xp,
  ensureLinkSync: Vp,
  // symlink
  createSymlink: qp,
  createSymlinkSync: Bp,
  ensureSymlink: qp,
  ensureSymlinkSync: Bp
};
function XF(e, { EOL: t = `
`, finalEOL: r = !0, replacer: n = null, spaces: i } = {}) {
  const s = r ? t : "";
  return JSON.stringify(e, n, i).replace(/\n/g, t) + s;
}
function JF(e) {
  return Buffer.isBuffer(e) && (e = e.toString("utf8")), e.replace(/^\uFEFF/, "");
}
var yf = { stringify: XF, stripBom: JF };
let Fi;
try {
  Fi = $t;
} catch {
  Fi = mn;
}
const cc = vt, { stringify: t_, stripBom: r_ } = yf;
async function QF(e, t = {}) {
  typeof t == "string" && (t = { encoding: t });
  const r = t.fs || Fi, n = "throws" in t ? t.throws : !0;
  let i = await cc.fromCallback(r.readFile)(e, t);
  i = r_(i);
  let s;
  try {
    s = JSON.parse(i, t ? t.reviver : null);
  } catch (a) {
    if (n)
      throw a.message = `${e}: ${a.message}`, a;
    return null;
  }
  return s;
}
const ZF = cc.fromPromise(QF);
function ej(e, t = {}) {
  typeof t == "string" && (t = { encoding: t });
  const r = t.fs || Fi, n = "throws" in t ? t.throws : !0;
  try {
    let i = r.readFileSync(e, t);
    return i = r_(i), JSON.parse(i, t.reviver);
  } catch (i) {
    if (n)
      throw i.message = `${e}: ${i.message}`, i;
    return null;
  }
}
async function tj(e, t, r = {}) {
  const n = r.fs || Fi, i = t_(t, r);
  await cc.fromCallback(n.writeFile)(e, i, r);
}
const rj = cc.fromPromise(tj);
function nj(e, t, r = {}) {
  const n = r.fs || Fi, i = t_(t, r);
  return n.writeFileSync(e, i, r);
}
var ij = {
  readFile: ZF,
  readFileSync: ej,
  writeFile: rj,
  writeFileSync: nj
};
const Ba = ij;
var sj = {
  // jsonfile exports
  readJson: Ba.readFile,
  readJsonSync: Ba.readFileSync,
  writeJson: Ba.writeFile,
  writeJsonSync: Ba.writeFileSync
};
const aj = vt.fromCallback, Ts = $t, n_ = Re, i_ = gr, oj = Yn.pathExists;
function cj(e, t, r, n) {
  typeof r == "function" && (n = r, r = "utf8");
  const i = n_.dirname(e);
  oj(i, (s, a) => {
    if (s) return n(s);
    if (a) return Ts.writeFile(e, t, r, n);
    i_.mkdirs(i, (o) => {
      if (o) return n(o);
      Ts.writeFile(e, t, r, n);
    });
  });
}
function lj(e, ...t) {
  const r = n_.dirname(e);
  if (Ts.existsSync(r))
    return Ts.writeFileSync(e, ...t);
  i_.mkdirsSync(r), Ts.writeFileSync(e, ...t);
}
var gf = {
  outputFile: aj(cj),
  outputFileSync: lj
};
const { stringify: uj } = yf, { outputFile: dj } = gf;
async function fj(e, t, r = {}) {
  const n = uj(t, r);
  await dj(e, n, r);
}
var hj = fj;
const { stringify: pj } = yf, { outputFileSync: mj } = gf;
function yj(e, t, r) {
  const n = pj(t, r);
  mj(e, n, r);
}
var gj = yj;
const _j = vt.fromPromise, gt = sj;
gt.outputJson = _j(hj);
gt.outputJsonSync = gj;
gt.outputJSON = gt.outputJson;
gt.outputJSONSync = gt.outputJsonSync;
gt.writeJSON = gt.writeJson;
gt.writeJSONSync = gt.writeJsonSync;
gt.readJSON = gt.readJson;
gt.readJSONSync = gt.readJsonSync;
var vj = gt;
const $j = $t, zl = Re, wj = pf.copy, s_ = oc.remove, Ej = gr.mkdirp, bj = Yn.pathExists, Hp = Ki;
function Sj(e, t, r, n) {
  typeof r == "function" && (n = r, r = {}), r = r || {};
  const i = r.overwrite || r.clobber || !1;
  Hp.checkPaths(e, t, "move", r, (s, a) => {
    if (s) return n(s);
    const { srcStat: o, isChangingCase: c = !1 } = a;
    Hp.checkParentPaths(e, o, t, "move", (u) => {
      if (u) return n(u);
      if (Pj(t)) return Gp(e, t, i, c, n);
      Ej(zl.dirname(t), (l) => l ? n(l) : Gp(e, t, i, c, n));
    });
  });
}
function Pj(e) {
  const t = zl.dirname(e);
  return zl.parse(t).root === t;
}
function Gp(e, t, r, n, i) {
  if (n) return tl(e, t, r, i);
  if (r)
    return s_(t, (s) => s ? i(s) : tl(e, t, r, i));
  bj(t, (s, a) => s ? i(s) : a ? i(new Error("dest already exists.")) : tl(e, t, r, i));
}
function tl(e, t, r, n) {
  $j.rename(e, t, (i) => i ? i.code !== "EXDEV" ? n(i) : Tj(e, t, r, n) : n());
}
function Tj(e, t, r, n) {
  wj(e, t, {
    overwrite: r,
    errorOnExist: !0
  }, (s) => s ? n(s) : s_(e, n));
}
var Nj = Sj;
const a_ = $t, Kl = Re, Oj = pf.copySync, o_ = oc.removeSync, Aj = gr.mkdirpSync, zp = Ki;
function Cj(e, t, r) {
  r = r || {};
  const n = r.overwrite || r.clobber || !1, { srcStat: i, isChangingCase: s = !1 } = zp.checkPathsSync(e, t, "move", r);
  return zp.checkParentPathsSync(e, i, t, "move"), Rj(t) || Aj(Kl.dirname(t)), Ij(e, t, n, s);
}
function Rj(e) {
  const t = Kl.dirname(e);
  return Kl.parse(t).root === t;
}
function Ij(e, t, r, n) {
  if (n) return rl(e, t, r);
  if (r)
    return o_(t), rl(e, t, r);
  if (a_.existsSync(t)) throw new Error("dest already exists.");
  return rl(e, t, r);
}
function rl(e, t, r) {
  try {
    a_.renameSync(e, t);
  } catch (n) {
    if (n.code !== "EXDEV") throw n;
    return Dj(e, t, r);
  }
}
function Dj(e, t, r) {
  return Oj(e, t, {
    overwrite: r,
    errorOnExist: !0
  }), o_(e);
}
var kj = Cj;
const Fj = vt.fromCallback;
var jj = {
  move: Fj(Nj),
  moveSync: kj
}, gn = {
  // Export promiseified graceful-fs:
  ...Wn,
  // Export extra methods:
  ...pf,
  ...wF,
  ...YF,
  ...vj,
  ...gr,
  ...jj,
  ...gf,
  ...Yn,
  ...oc
}, Xn = {}, un = {}, Ve = {}, dn = {};
Object.defineProperty(dn, "__esModule", { value: !0 });
dn.CancellationError = dn.CancellationToken = void 0;
const Lj = sy;
class Uj extends Lj.EventEmitter {
  get cancelled() {
    return this._cancelled || this._parent != null && this._parent.cancelled;
  }
  set parent(t) {
    this.removeParentCancelHandler(), this._parent = t, this.parentCancelHandler = () => this.cancel(), this._parent.onCancel(this.parentCancelHandler);
  }
  // babel cannot compile ... correctly for super calls
  constructor(t) {
    super(), this.parentCancelHandler = null, this._parent = null, this._cancelled = !1, t != null && (this.parent = t);
  }
  cancel() {
    this._cancelled = !0, this.emit("cancel");
  }
  onCancel(t) {
    this.cancelled ? t() : this.once("cancel", t);
  }
  createPromise(t) {
    if (this.cancelled)
      return Promise.reject(new Wl());
    const r = () => {
      if (n != null)
        try {
          this.removeListener("cancel", n), n = null;
        } catch {
        }
    };
    let n = null;
    return new Promise((i, s) => {
      let a = null;
      if (n = () => {
        try {
          a != null && (a(), a = null);
        } finally {
          s(new Wl());
        }
      }, this.cancelled) {
        n();
        return;
      }
      this.onCancel(n), t(i, s, (o) => {
        a = o;
      });
    }).then((i) => (r(), i)).catch((i) => {
      throw r(), i;
    });
  }
  removeParentCancelHandler() {
    const t = this._parent;
    t != null && this.parentCancelHandler != null && (t.removeListener("cancel", this.parentCancelHandler), this.parentCancelHandler = null);
  }
  dispose() {
    try {
      this.removeParentCancelHandler();
    } finally {
      this.removeAllListeners(), this._parent = null;
    }
  }
}
dn.CancellationToken = Uj;
class Wl extends Error {
  constructor() {
    super("cancelled");
  }
}
dn.CancellationError = Wl;
var Wi = {};
Object.defineProperty(Wi, "__esModule", { value: !0 });
Wi.newError = Mj;
function Mj(e, t) {
  const r = new Error(e);
  return r.code = t, r;
}
var yt = {}, Yl = { exports: {} }, Ha = { exports: {} }, nl, Kp;
function xj() {
  if (Kp) return nl;
  Kp = 1;
  var e = 1e3, t = e * 60, r = t * 60, n = r * 24, i = n * 7, s = n * 365.25;
  nl = function(l, d) {
    d = d || {};
    var h = typeof l;
    if (h === "string" && l.length > 0)
      return a(l);
    if (h === "number" && isFinite(l))
      return d.long ? c(l) : o(l);
    throw new Error(
      "val is not a non-empty string or a valid number. val=" + JSON.stringify(l)
    );
  };
  function a(l) {
    if (l = String(l), !(l.length > 100)) {
      var d = /^(-?(?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)?$/i.exec(
        l
      );
      if (d) {
        var h = parseFloat(d[1]), p = (d[2] || "ms").toLowerCase();
        switch (p) {
          case "years":
          case "year":
          case "yrs":
          case "yr":
          case "y":
            return h * s;
          case "weeks":
          case "week":
          case "w":
            return h * i;
          case "days":
          case "day":
          case "d":
            return h * n;
          case "hours":
          case "hour":
          case "hrs":
          case "hr":
          case "h":
            return h * r;
          case "minutes":
          case "minute":
          case "mins":
          case "min":
          case "m":
            return h * t;
          case "seconds":
          case "second":
          case "secs":
          case "sec":
          case "s":
            return h * e;
          case "milliseconds":
          case "millisecond":
          case "msecs":
          case "msec":
          case "ms":
            return h;
          default:
            return;
        }
      }
    }
  }
  function o(l) {
    var d = Math.abs(l);
    return d >= n ? Math.round(l / n) + "d" : d >= r ? Math.round(l / r) + "h" : d >= t ? Math.round(l / t) + "m" : d >= e ? Math.round(l / e) + "s" : l + "ms";
  }
  function c(l) {
    var d = Math.abs(l);
    return d >= n ? u(l, d, n, "day") : d >= r ? u(l, d, r, "hour") : d >= t ? u(l, d, t, "minute") : d >= e ? u(l, d, e, "second") : l + " ms";
  }
  function u(l, d, h, p) {
    var $ = d >= h * 1.5;
    return Math.round(l / h) + " " + p + ($ ? "s" : "");
  }
  return nl;
}
var il, Wp;
function c_() {
  if (Wp) return il;
  Wp = 1;
  function e(t) {
    n.debug = n, n.default = n, n.coerce = u, n.disable = o, n.enable = s, n.enabled = c, n.humanize = xj(), n.destroy = l, Object.keys(t).forEach((d) => {
      n[d] = t[d];
    }), n.names = [], n.skips = [], n.formatters = {};
    function r(d) {
      let h = 0;
      for (let p = 0; p < d.length; p++)
        h = (h << 5) - h + d.charCodeAt(p), h |= 0;
      return n.colors[Math.abs(h) % n.colors.length];
    }
    n.selectColor = r;
    function n(d) {
      let h, p = null, $, _;
      function v(...m) {
        if (!v.enabled)
          return;
        const E = v, T = Number(/* @__PURE__ */ new Date()), R = T - (h || T);
        E.diff = R, E.prev = h, E.curr = T, h = T, m[0] = n.coerce(m[0]), typeof m[0] != "string" && m.unshift("%O");
        let F = 0;
        m[0] = m[0].replace(/%([a-zA-Z%])/g, (G, ie) => {
          if (G === "%%")
            return "%";
          F++;
          const C = n.formatters[ie];
          if (typeof C == "function") {
            const J = m[F];
            G = C.call(E, J), m.splice(F, 1), F--;
          }
          return G;
        }), n.formatArgs.call(E, m), (E.log || n.log).apply(E, m);
      }
      return v.namespace = d, v.useColors = n.useColors(), v.color = n.selectColor(d), v.extend = i, v.destroy = n.destroy, Object.defineProperty(v, "enabled", {
        enumerable: !0,
        configurable: !1,
        get: () => p !== null ? p : ($ !== n.namespaces && ($ = n.namespaces, _ = n.enabled(d)), _),
        set: (m) => {
          p = m;
        }
      }), typeof n.init == "function" && n.init(v), v;
    }
    function i(d, h) {
      const p = n(this.namespace + (typeof h > "u" ? ":" : h) + d);
      return p.log = this.log, p;
    }
    function s(d) {
      n.save(d), n.namespaces = d, n.names = [], n.skips = [];
      const h = (typeof d == "string" ? d : "").trim().replace(/\s+/g, ",").split(",").filter(Boolean);
      for (const p of h)
        p[0] === "-" ? n.skips.push(p.slice(1)) : n.names.push(p);
    }
    function a(d, h) {
      let p = 0, $ = 0, _ = -1, v = 0;
      for (; p < d.length; )
        if ($ < h.length && (h[$] === d[p] || h[$] === "*"))
          h[$] === "*" ? (_ = $, v = p, $++) : (p++, $++);
        else if (_ !== -1)
          $ = _ + 1, v++, p = v;
        else
          return !1;
      for (; $ < h.length && h[$] === "*"; )
        $++;
      return $ === h.length;
    }
    function o() {
      const d = [
        ...n.names,
        ...n.skips.map((h) => "-" + h)
      ].join(",");
      return n.enable(""), d;
    }
    function c(d) {
      for (const h of n.skips)
        if (a(d, h))
          return !1;
      for (const h of n.names)
        if (a(d, h))
          return !0;
      return !1;
    }
    function u(d) {
      return d instanceof Error ? d.stack || d.message : d;
    }
    function l() {
      console.warn("Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.");
    }
    return n.enable(n.load()), n;
  }
  return il = e, il;
}
var Yp;
function Vj() {
  return Yp || (Yp = 1, function(e, t) {
    t.formatArgs = n, t.save = i, t.load = s, t.useColors = r, t.storage = a(), t.destroy = /* @__PURE__ */ (() => {
      let c = !1;
      return () => {
        c || (c = !0, console.warn("Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`."));
      };
    })(), t.colors = [
      "#0000CC",
      "#0000FF",
      "#0033CC",
      "#0033FF",
      "#0066CC",
      "#0066FF",
      "#0099CC",
      "#0099FF",
      "#00CC00",
      "#00CC33",
      "#00CC66",
      "#00CC99",
      "#00CCCC",
      "#00CCFF",
      "#3300CC",
      "#3300FF",
      "#3333CC",
      "#3333FF",
      "#3366CC",
      "#3366FF",
      "#3399CC",
      "#3399FF",
      "#33CC00",
      "#33CC33",
      "#33CC66",
      "#33CC99",
      "#33CCCC",
      "#33CCFF",
      "#6600CC",
      "#6600FF",
      "#6633CC",
      "#6633FF",
      "#66CC00",
      "#66CC33",
      "#9900CC",
      "#9900FF",
      "#9933CC",
      "#9933FF",
      "#99CC00",
      "#99CC33",
      "#CC0000",
      "#CC0033",
      "#CC0066",
      "#CC0099",
      "#CC00CC",
      "#CC00FF",
      "#CC3300",
      "#CC3333",
      "#CC3366",
      "#CC3399",
      "#CC33CC",
      "#CC33FF",
      "#CC6600",
      "#CC6633",
      "#CC9900",
      "#CC9933",
      "#CCCC00",
      "#CCCC33",
      "#FF0000",
      "#FF0033",
      "#FF0066",
      "#FF0099",
      "#FF00CC",
      "#FF00FF",
      "#FF3300",
      "#FF3333",
      "#FF3366",
      "#FF3399",
      "#FF33CC",
      "#FF33FF",
      "#FF6600",
      "#FF6633",
      "#FF9900",
      "#FF9933",
      "#FFCC00",
      "#FFCC33"
    ];
    function r() {
      if (typeof window < "u" && window.process && (window.process.type === "renderer" || window.process.__nwjs))
        return !0;
      if (typeof navigator < "u" && navigator.userAgent && navigator.userAgent.toLowerCase().match(/(edge|trident)\/(\d+)/))
        return !1;
      let c;
      return typeof document < "u" && document.documentElement && document.documentElement.style && document.documentElement.style.WebkitAppearance || // Is firebug? http://stackoverflow.com/a/398120/376773
      typeof window < "u" && window.console && (window.console.firebug || window.console.exception && window.console.table) || // Is firefox >= v31?
      // https://developer.mozilla.org/en-US/docs/Tools/Web_Console#Styling_messages
      typeof navigator < "u" && navigator.userAgent && (c = navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/)) && parseInt(c[1], 10) >= 31 || // Double check webkit in userAgent just in case we are in a worker
      typeof navigator < "u" && navigator.userAgent && navigator.userAgent.toLowerCase().match(/applewebkit\/(\d+)/);
    }
    function n(c) {
      if (c[0] = (this.useColors ? "%c" : "") + this.namespace + (this.useColors ? " %c" : " ") + c[0] + (this.useColors ? "%c " : " ") + "+" + e.exports.humanize(this.diff), !this.useColors)
        return;
      const u = "color: " + this.color;
      c.splice(1, 0, u, "color: inherit");
      let l = 0, d = 0;
      c[0].replace(/%[a-zA-Z%]/g, (h) => {
        h !== "%%" && (l++, h === "%c" && (d = l));
      }), c.splice(d, 0, u);
    }
    t.log = console.debug || console.log || (() => {
    });
    function i(c) {
      try {
        c ? t.storage.setItem("debug", c) : t.storage.removeItem("debug");
      } catch {
      }
    }
    function s() {
      let c;
      try {
        c = t.storage.getItem("debug") || t.storage.getItem("DEBUG");
      } catch {
      }
      return !c && typeof process < "u" && "env" in process && (c = process.env.DEBUG), c;
    }
    function a() {
      try {
        return localStorage;
      } catch {
      }
    }
    e.exports = c_()(t);
    const { formatters: o } = e.exports;
    o.j = function(c) {
      try {
        return JSON.stringify(c);
      } catch (u) {
        return "[UnexpectedJSONParseError]: " + u.message;
      }
    };
  }(Ha, Ha.exports)), Ha.exports;
}
var Ga = { exports: {} }, sl, Xp;
function qj() {
  return Xp || (Xp = 1, sl = (e, t = process.argv) => {
    const r = e.startsWith("-") ? "" : e.length === 1 ? "-" : "--", n = t.indexOf(r + e), i = t.indexOf("--");
    return n !== -1 && (i === -1 || n < i);
  }), sl;
}
var al, Jp;
function Bj() {
  if (Jp) return al;
  Jp = 1;
  const e = Mo, t = ay, r = qj(), { env: n } = process;
  let i;
  r("no-color") || r("no-colors") || r("color=false") || r("color=never") ? i = 0 : (r("color") || r("colors") || r("color=true") || r("color=always")) && (i = 1), "FORCE_COLOR" in n && (n.FORCE_COLOR === "true" ? i = 1 : n.FORCE_COLOR === "false" ? i = 0 : i = n.FORCE_COLOR.length === 0 ? 1 : Math.min(parseInt(n.FORCE_COLOR, 10), 3));
  function s(c) {
    return c === 0 ? !1 : {
      level: c,
      hasBasic: !0,
      has256: c >= 2,
      has16m: c >= 3
    };
  }
  function a(c, u) {
    if (i === 0)
      return 0;
    if (r("color=16m") || r("color=full") || r("color=truecolor"))
      return 3;
    if (r("color=256"))
      return 2;
    if (c && !u && i === void 0)
      return 0;
    const l = i || 0;
    if (n.TERM === "dumb")
      return l;
    if (process.platform === "win32") {
      const d = e.release().split(".");
      return Number(d[0]) >= 10 && Number(d[2]) >= 10586 ? Number(d[2]) >= 14931 ? 3 : 2 : 1;
    }
    if ("CI" in n)
      return ["TRAVIS", "CIRCLECI", "APPVEYOR", "GITLAB_CI", "GITHUB_ACTIONS", "BUILDKITE"].some((d) => d in n) || n.CI_NAME === "codeship" ? 1 : l;
    if ("TEAMCITY_VERSION" in n)
      return /^(9\.(0*[1-9]\d*)\.|\d{2,}\.)/.test(n.TEAMCITY_VERSION) ? 1 : 0;
    if (n.COLORTERM === "truecolor")
      return 3;
    if ("TERM_PROGRAM" in n) {
      const d = parseInt((n.TERM_PROGRAM_VERSION || "").split(".")[0], 10);
      switch (n.TERM_PROGRAM) {
        case "iTerm.app":
          return d >= 3 ? 3 : 2;
        case "Apple_Terminal":
          return 2;
      }
    }
    return /-256(color)?$/i.test(n.TERM) ? 2 : /^screen|^xterm|^vt100|^vt220|^rxvt|color|ansi|cygwin|linux/i.test(n.TERM) || "COLORTERM" in n ? 1 : l;
  }
  function o(c) {
    const u = a(c, c && c.isTTY);
    return s(u);
  }
  return al = {
    supportsColor: o,
    stdout: s(a(!0, t.isatty(1))),
    stderr: s(a(!0, t.isatty(2)))
  }, al;
}
var Qp;
function Hj() {
  return Qp || (Qp = 1, function(e, t) {
    const r = ay, n = ou;
    t.init = l, t.log = o, t.formatArgs = s, t.save = c, t.load = u, t.useColors = i, t.destroy = n.deprecate(
      () => {
      },
      "Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`."
    ), t.colors = [6, 2, 3, 4, 5, 1];
    try {
      const h = Bj();
      h && (h.stderr || h).level >= 2 && (t.colors = [
        20,
        21,
        26,
        27,
        32,
        33,
        38,
        39,
        40,
        41,
        42,
        43,
        44,
        45,
        56,
        57,
        62,
        63,
        68,
        69,
        74,
        75,
        76,
        77,
        78,
        79,
        80,
        81,
        92,
        93,
        98,
        99,
        112,
        113,
        128,
        129,
        134,
        135,
        148,
        149,
        160,
        161,
        162,
        163,
        164,
        165,
        166,
        167,
        168,
        169,
        170,
        171,
        172,
        173,
        178,
        179,
        184,
        185,
        196,
        197,
        198,
        199,
        200,
        201,
        202,
        203,
        204,
        205,
        206,
        207,
        208,
        209,
        214,
        215,
        220,
        221
      ]);
    } catch {
    }
    t.inspectOpts = Object.keys(process.env).filter((h) => /^debug_/i.test(h)).reduce((h, p) => {
      const $ = p.substring(6).toLowerCase().replace(/_([a-z])/g, (v, m) => m.toUpperCase());
      let _ = process.env[p];
      return /^(yes|on|true|enabled)$/i.test(_) ? _ = !0 : /^(no|off|false|disabled)$/i.test(_) ? _ = !1 : _ === "null" ? _ = null : _ = Number(_), h[$] = _, h;
    }, {});
    function i() {
      return "colors" in t.inspectOpts ? !!t.inspectOpts.colors : r.isatty(process.stderr.fd);
    }
    function s(h) {
      const { namespace: p, useColors: $ } = this;
      if ($) {
        const _ = this.color, v = "\x1B[3" + (_ < 8 ? _ : "8;5;" + _), m = `  ${v};1m${p} \x1B[0m`;
        h[0] = m + h[0].split(`
`).join(`
` + m), h.push(v + "m+" + e.exports.humanize(this.diff) + "\x1B[0m");
      } else
        h[0] = a() + p + " " + h[0];
    }
    function a() {
      return t.inspectOpts.hideDate ? "" : (/* @__PURE__ */ new Date()).toISOString() + " ";
    }
    function o(...h) {
      return process.stderr.write(n.formatWithOptions(t.inspectOpts, ...h) + `
`);
    }
    function c(h) {
      h ? process.env.DEBUG = h : delete process.env.DEBUG;
    }
    function u() {
      return process.env.DEBUG;
    }
    function l(h) {
      h.inspectOpts = {};
      const p = Object.keys(t.inspectOpts);
      for (let $ = 0; $ < p.length; $++)
        h.inspectOpts[p[$]] = t.inspectOpts[p[$]];
    }
    e.exports = c_()(t);
    const { formatters: d } = e.exports;
    d.o = function(h) {
      return this.inspectOpts.colors = this.useColors, n.inspect(h, this.inspectOpts).split(`
`).map((p) => p.trim()).join(" ");
    }, d.O = function(h) {
      return this.inspectOpts.colors = this.useColors, n.inspect(h, this.inspectOpts);
    };
  }(Ga, Ga.exports)), Ga.exports;
}
typeof process > "u" || process.type === "renderer" || process.browser === !0 || process.__nwjs ? Yl.exports = Vj() : Yl.exports = Hj();
var Gj = Yl.exports, ra = {};
Object.defineProperty(ra, "__esModule", { value: !0 });
ra.ProgressCallbackTransform = void 0;
const zj = zs;
class Kj extends zj.Transform {
  constructor(t, r, n) {
    super(), this.total = t, this.cancellationToken = r, this.onProgress = n, this.start = Date.now(), this.transferred = 0, this.delta = 0, this.nextUpdate = this.start + 1e3;
  }
  _transform(t, r, n) {
    if (this.cancellationToken.cancelled) {
      n(new Error("cancelled"), null);
      return;
    }
    this.transferred += t.length, this.delta += t.length;
    const i = Date.now();
    i >= this.nextUpdate && this.transferred !== this.total && (this.nextUpdate = i + 1e3, this.onProgress({
      total: this.total,
      delta: this.delta,
      transferred: this.transferred,
      percent: this.transferred / this.total * 100,
      bytesPerSecond: Math.round(this.transferred / ((i - this.start) / 1e3))
    }), this.delta = 0), n(null, t);
  }
  _flush(t) {
    if (this.cancellationToken.cancelled) {
      t(new Error("cancelled"));
      return;
    }
    this.onProgress({
      total: this.total,
      delta: this.delta,
      transferred: this.total,
      percent: 100,
      bytesPerSecond: Math.round(this.transferred / ((Date.now() - this.start) / 1e3))
    }), this.delta = 0, t(null);
  }
}
ra.ProgressCallbackTransform = Kj;
Object.defineProperty(yt, "__esModule", { value: !0 });
yt.DigestTransform = yt.HttpExecutor = yt.HttpError = void 0;
yt.createHttpError = Jl;
yt.parseJson = tL;
yt.configureRequestOptionsFromUrl = u_;
yt.configureRequestUrl = vf;
yt.safeGetHeader = Oi;
yt.configureRequestOptions = Oo;
yt.safeStringifyJson = Ao;
const Wj = Ks, Yj = Gj, Xj = mn, Jj = zs, Xl = yn, Qj = dn, Zp = Wi, Zj = ra, Nn = (0, Yj.default)("electron-builder");
function Jl(e, t = null) {
  return new _f(e.statusCode || -1, `${e.statusCode} ${e.statusMessage}` + (t == null ? "" : `
` + JSON.stringify(t, null, "  ")) + `
Headers: ` + Ao(e.headers), t);
}
const eL = /* @__PURE__ */ new Map([
  [429, "Too many requests"],
  [400, "Bad request"],
  [403, "Forbidden"],
  [404, "Not found"],
  [405, "Method not allowed"],
  [406, "Not acceptable"],
  [408, "Request timeout"],
  [413, "Request entity too large"],
  [500, "Internal server error"],
  [502, "Bad gateway"],
  [503, "Service unavailable"],
  [504, "Gateway timeout"],
  [505, "HTTP version not supported"]
]);
class _f extends Error {
  constructor(t, r = `HTTP error: ${eL.get(t) || t}`, n = null) {
    super(r), this.statusCode = t, this.description = n, this.name = "HttpError", this.code = `HTTP_ERROR_${t}`;
  }
  isServerError() {
    return this.statusCode >= 500 && this.statusCode <= 599;
  }
}
yt.HttpError = _f;
function tL(e) {
  return e.then((t) => t == null || t.length === 0 ? null : JSON.parse(t));
}
class gi {
  constructor() {
    this.maxRedirects = 10;
  }
  request(t, r = new Qj.CancellationToken(), n) {
    Oo(t);
    const i = n == null ? void 0 : JSON.stringify(n), s = i ? Buffer.from(i) : void 0;
    if (s != null) {
      Nn(i);
      const { headers: a, ...o } = t;
      t = {
        method: "post",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": s.length,
          ...a
        },
        ...o
      };
    }
    return this.doApiRequest(t, r, (a) => a.end(s));
  }
  doApiRequest(t, r, n, i = 0) {
    return Nn.enabled && Nn(`Request: ${Ao(t)}`), r.createPromise((s, a, o) => {
      const c = this.createRequest(t, (u) => {
        try {
          this.handleResponse(u, t, r, s, a, i, n);
        } catch (l) {
          a(l);
        }
      });
      this.addErrorAndTimeoutHandlers(c, a, t.timeout), this.addRedirectHandlers(c, t, a, i, (u) => {
        this.doApiRequest(u, r, n, i).then(s).catch(a);
      }), n(c, a), o(() => c.abort());
    });
  }
  // noinspection JSUnusedLocalSymbols
  // eslint-disable-next-line
  addRedirectHandlers(t, r, n, i, s) {
  }
  addErrorAndTimeoutHandlers(t, r, n = 60 * 1e3) {
    this.addTimeOutHandler(t, r, n), t.on("error", r), t.on("aborted", () => {
      r(new Error("Request has been aborted by the server"));
    });
  }
  handleResponse(t, r, n, i, s, a, o) {
    var c;
    if (Nn.enabled && Nn(`Response: ${t.statusCode} ${t.statusMessage}, request options: ${Ao(r)}`), t.statusCode === 404) {
      s(Jl(t, `method: ${r.method || "GET"} url: ${r.protocol || "https:"}//${r.hostname}${r.port ? `:${r.port}` : ""}${r.path}

Please double check that your authentication token is correct. Due to security reasons, actual status maybe not reported, but 404.
`));
      return;
    } else if (t.statusCode === 204) {
      i();
      return;
    }
    const u = (c = t.statusCode) !== null && c !== void 0 ? c : 0, l = u >= 300 && u < 400, d = Oi(t, "location");
    if (l && d != null) {
      if (a > this.maxRedirects) {
        s(this.createMaxRedirectError());
        return;
      }
      this.doApiRequest(gi.prepareRedirectUrlOptions(d, r), n, o, a).then(i).catch(s);
      return;
    }
    t.setEncoding("utf8");
    let h = "";
    t.on("error", s), t.on("data", (p) => h += p), t.on("end", () => {
      try {
        if (t.statusCode != null && t.statusCode >= 400) {
          const p = Oi(t, "content-type"), $ = p != null && (Array.isArray(p) ? p.find((_) => _.includes("json")) != null : p.includes("json"));
          s(Jl(t, `method: ${r.method || "GET"} url: ${r.protocol || "https:"}//${r.hostname}${r.port ? `:${r.port}` : ""}${r.path}

          Data:
          ${$ ? JSON.stringify(JSON.parse(h)) : h}
          `));
        } else
          i(h.length === 0 ? null : h);
      } catch (p) {
        s(p);
      }
    });
  }
  async downloadToBuffer(t, r) {
    return await r.cancellationToken.createPromise((n, i, s) => {
      const a = [], o = {
        headers: r.headers || void 0,
        // because PrivateGitHubProvider requires HttpExecutor.prepareRedirectUrlOptions logic, so, we need to redirect manually
        redirect: "manual"
      };
      vf(t, o), Oo(o), this.doDownload(o, {
        destination: null,
        options: r,
        onCancel: s,
        callback: (c) => {
          c == null ? n(Buffer.concat(a)) : i(c);
        },
        responseHandler: (c, u) => {
          let l = 0;
          c.on("data", (d) => {
            if (l += d.length, l > 524288e3) {
              u(new Error("Maximum allowed size is 500 MB"));
              return;
            }
            a.push(d);
          }), c.on("end", () => {
            u(null);
          });
        }
      }, 0);
    });
  }
  doDownload(t, r, n) {
    const i = this.createRequest(t, (s) => {
      if (s.statusCode >= 400) {
        r.callback(new Error(`Cannot download "${t.protocol || "https:"}//${t.hostname}${t.path}", status ${s.statusCode}: ${s.statusMessage}`));
        return;
      }
      s.on("error", r.callback);
      const a = Oi(s, "location");
      if (a != null) {
        n < this.maxRedirects ? this.doDownload(gi.prepareRedirectUrlOptions(a, t), r, n++) : r.callback(this.createMaxRedirectError());
        return;
      }
      r.responseHandler == null ? nL(r, s) : r.responseHandler(s, r.callback);
    });
    this.addErrorAndTimeoutHandlers(i, r.callback, t.timeout), this.addRedirectHandlers(i, t, r.callback, n, (s) => {
      this.doDownload(s, r, n++);
    }), i.end();
  }
  createMaxRedirectError() {
    return new Error(`Too many redirects (> ${this.maxRedirects})`);
  }
  addTimeOutHandler(t, r, n) {
    t.on("socket", (i) => {
      i.setTimeout(n, () => {
        t.abort(), r(new Error("Request timed out"));
      });
    });
  }
  static prepareRedirectUrlOptions(t, r) {
    const n = u_(t, { ...r }), i = n.headers;
    if (i != null && i.authorization) {
      const s = gi.reconstructOriginalUrl(r), a = l_(t, r);
      gi.isCrossOriginRedirect(s, a) && (Nn.enabled && Nn(`Given the cross-origin redirect (from ${s.host} to ${a.host}), the Authorization header will be stripped out.`), delete i.authorization);
    }
    return n;
  }
  static reconstructOriginalUrl(t) {
    const r = t.protocol || "https:";
    if (!t.hostname)
      throw new Error("Missing hostname in request options");
    const n = t.hostname, i = t.port ? `:${t.port}` : "", s = t.path || "/";
    return new Xl.URL(`${r}//${n}${i}${s}`);
  }
  static isCrossOriginRedirect(t, r) {
    if (t.hostname.toLowerCase() !== r.hostname.toLowerCase())
      return !0;
    if (t.protocol === "http:" && // This can be replaced with `!originalUrl.port`, but for the sake of clarity.
    ["80", ""].includes(t.port) && r.protocol === "https:" && // This can be replaced with `!redirectUrl.port`, but for the sake of clarity.
    ["443", ""].includes(r.port))
      return !1;
    if (t.protocol !== r.protocol)
      return !0;
    const n = t.port, i = r.port;
    return n !== i;
  }
  static retryOnServerError(t, r = 3) {
    for (let n = 0; ; n++)
      try {
        return t();
      } catch (i) {
        if (n < r && (i instanceof _f && i.isServerError() || i.code === "EPIPE"))
          continue;
        throw i;
      }
  }
}
yt.HttpExecutor = gi;
function l_(e, t) {
  try {
    return new Xl.URL(e);
  } catch {
    const r = t.hostname, n = t.protocol || "https:", i = t.port ? `:${t.port}` : "", s = `${n}//${r}${i}`;
    return new Xl.URL(e, s);
  }
}
function u_(e, t) {
  const r = Oo(t), n = l_(e, t);
  return vf(n, r), r;
}
function vf(e, t) {
  t.protocol = e.protocol, t.hostname = e.hostname, e.port ? t.port = e.port : t.port && delete t.port, t.path = e.pathname + e.search;
}
class Ql extends Jj.Transform {
  // noinspection JSUnusedGlobalSymbols
  get actual() {
    return this._actual;
  }
  constructor(t, r = "sha512", n = "base64") {
    super(), this.expected = t, this.algorithm = r, this.encoding = n, this._actual = null, this.isValidateOnEnd = !0, this.digester = (0, Wj.createHash)(r);
  }
  // noinspection JSUnusedGlobalSymbols
  _transform(t, r, n) {
    this.digester.update(t), n(null, t);
  }
  // noinspection JSUnusedGlobalSymbols
  _flush(t) {
    if (this._actual = this.digester.digest(this.encoding), this.isValidateOnEnd)
      try {
        this.validate();
      } catch (r) {
        t(r);
        return;
      }
    t(null);
  }
  validate() {
    if (this._actual == null)
      throw (0, Zp.newError)("Not finished yet", "ERR_STREAM_NOT_FINISHED");
    if (this._actual !== this.expected)
      throw (0, Zp.newError)(`${this.algorithm} checksum mismatch, expected ${this.expected}, got ${this._actual}`, "ERR_CHECKSUM_MISMATCH");
    return null;
  }
}
yt.DigestTransform = Ql;
function rL(e, t, r) {
  return e != null && t != null && e !== t ? (r(new Error(`checksum mismatch: expected ${t} but got ${e} (X-Checksum-Sha2 header)`)), !1) : !0;
}
function Oi(e, t) {
  const r = e.headers[t];
  return r == null ? null : Array.isArray(r) ? r.length === 0 ? null : r[r.length - 1] : r;
}
function nL(e, t) {
  if (!rL(Oi(t, "X-Checksum-Sha2"), e.options.sha2, e.callback))
    return;
  const r = [];
  if (e.options.onProgress != null) {
    const a = Oi(t, "content-length");
    a != null && r.push(new Zj.ProgressCallbackTransform(parseInt(a, 10), e.options.cancellationToken, e.options.onProgress));
  }
  const n = e.options.sha512;
  n != null ? r.push(new Ql(n, "sha512", n.length === 128 && !n.includes("+") && !n.includes("Z") && !n.includes("=") ? "hex" : "base64")) : e.options.sha2 != null && r.push(new Ql(e.options.sha2, "sha256", "hex"));
  const i = (0, Xj.createWriteStream)(e.destination);
  r.push(i);
  let s = t;
  for (const a of r)
    a.on("error", (o) => {
      i.close(), e.options.cancellationToken.cancelled || e.callback(o);
    }), s = s.pipe(a);
  i.on("finish", () => {
    i.close(e.callback);
  });
}
function Oo(e, t, r) {
  r != null && (e.method = r), e.headers = { ...e.headers };
  const n = e.headers;
  return t != null && (n.authorization = t.startsWith("Basic") || t.startsWith("Bearer") ? t : `token ${t}`), n["User-Agent"] == null && (n["User-Agent"] = "electron-builder"), (r == null || r === "GET" || n["Cache-Control"] == null) && (n["Cache-Control"] = "no-cache"), e.protocol == null && process.versions.electron != null && (e.protocol = "https:"), e;
}
function Ao(e, t) {
  return JSON.stringify(e, (r, n) => r.endsWith("Authorization") || r.endsWith("authorization") || r.endsWith("Password") || r.endsWith("PASSWORD") || r.endsWith("Token") || r.includes("password") || r.includes("token") || t != null && t.has(r) ? "<stripped sensitive data>" : n, 2);
}
var lc = {};
Object.defineProperty(lc, "__esModule", { value: !0 });
lc.MemoLazy = void 0;
class iL {
  constructor(t, r) {
    this.selector = t, this.creator = r, this.selected = void 0, this._value = void 0;
  }
  get hasValue() {
    return this._value !== void 0;
  }
  get value() {
    const t = this.selector();
    if (this._value !== void 0 && d_(this.selected, t))
      return this._value;
    this.selected = t;
    const r = this.creator(t);
    return this.value = r, r;
  }
  set value(t) {
    this._value = t;
  }
}
lc.MemoLazy = iL;
function d_(e, t) {
  if (typeof e == "object" && e !== null && (typeof t == "object" && t !== null)) {
    const i = Object.keys(e), s = Object.keys(t);
    return i.length === s.length && i.every((a) => d_(e[a], t[a]));
  }
  return e === t;
}
var na = {};
Object.defineProperty(na, "__esModule", { value: !0 });
na.githubUrl = sL;
na.githubTagPrefix = aL;
na.getS3LikeProviderBaseUrl = oL;
function sL(e, t = "github.com") {
  return `${e.protocol || "https"}://${e.host || t}`;
}
function aL(e) {
  var t;
  return e.tagNamePrefix ? e.tagNamePrefix : !((t = e.vPrefixedTagName) !== null && t !== void 0) || t ? "v" : "";
}
function oL(e) {
  const t = e.provider;
  if (t === "s3")
    return cL(e);
  if (t === "spaces")
    return lL(e);
  throw new Error(`Not supported provider: ${t}`);
}
function cL(e) {
  let t;
  if (e.accelerate == !0)
    t = `https://${e.bucket}.s3-accelerate.amazonaws.com`;
  else if (e.endpoint != null)
    t = `${e.endpoint}/${e.bucket}`;
  else if (e.bucket.includes(".")) {
    if (e.region == null)
      throw new Error(`Bucket name "${e.bucket}" includes a dot, but S3 region is missing`);
    e.region === "us-east-1" ? t = `https://s3.amazonaws.com/${e.bucket}` : t = `https://s3-${e.region}.amazonaws.com/${e.bucket}`;
  } else e.region === "cn-north-1" ? t = `https://${e.bucket}.s3.${e.region}.amazonaws.com.cn` : t = `https://${e.bucket}.s3.amazonaws.com`;
  return f_(t, e.path);
}
function f_(e, t) {
  return t != null && t.length > 0 && (t.startsWith("/") || (e += "/"), e += t), e;
}
function lL(e) {
  if (e.name == null)
    throw new Error("name is missing");
  if (e.region == null)
    throw new Error("region is missing");
  return f_(`https://${e.name}.${e.region}.digitaloceanspaces.com`, e.path);
}
var $f = {};
Object.defineProperty($f, "__esModule", { value: !0 });
$f.retry = h_;
const uL = dn;
async function h_(e, t) {
  var r;
  const { retries: n, interval: i, backoff: s = 0, attempt: a = 0, shouldRetry: o, cancellationToken: c = new uL.CancellationToken() } = t;
  try {
    return await e();
  } catch (u) {
    if (await Promise.resolve((r = o == null ? void 0 : o(u)) !== null && r !== void 0 ? r : !0) && n > 0 && !c.cancelled)
      return await new Promise((l) => setTimeout(l, i + s * a)), await h_(e, { ...t, retries: n - 1, attempt: a + 1 });
    throw u;
  }
}
var wf = {};
Object.defineProperty(wf, "__esModule", { value: !0 });
wf.parseDn = dL;
function dL(e) {
  let t = !1, r = null, n = "", i = 0;
  e = e.trim();
  const s = /* @__PURE__ */ new Map();
  for (let a = 0; a <= e.length; a++) {
    if (a === e.length) {
      r !== null && s.set(r, n);
      break;
    }
    const o = e[a];
    if (t) {
      if (o === '"') {
        t = !1;
        continue;
      }
    } else {
      if (o === '"') {
        t = !0;
        continue;
      }
      if (o === "\\") {
        a++;
        const c = parseInt(e.slice(a, a + 2), 16);
        Number.isNaN(c) ? n += e[a] : (a++, n += String.fromCharCode(c));
        continue;
      }
      if (r === null && o === "=") {
        r = n, n = "";
        continue;
      }
      if (o === "," || o === ";" || o === "+") {
        r !== null && s.set(r, n), r = null, n = "";
        continue;
      }
    }
    if (o === " " && !t) {
      if (n.length === 0)
        continue;
      if (a > i) {
        let c = a;
        for (; e[c] === " "; )
          c++;
        i = c;
      }
      if (i >= e.length || e[i] === "," || e[i] === ";" || r === null && e[i] === "=" || r !== null && e[i] === "+") {
        a = i - 1;
        continue;
      }
    }
    n += o;
  }
  return s;
}
var ji = {};
Object.defineProperty(ji, "__esModule", { value: !0 });
ji.nil = ji.UUID = void 0;
const p_ = Ks, m_ = Wi, fL = "options.name must be either a string or a Buffer", em = (0, p_.randomBytes)(16);
em[0] = em[0] | 1;
const ho = {}, ye = [];
for (let e = 0; e < 256; e++) {
  const t = (e + 256).toString(16).substr(1);
  ho[t] = e, ye[e] = t;
}
class Kn {
  constructor(t) {
    this.ascii = null, this.binary = null;
    const r = Kn.check(t);
    if (!r)
      throw new Error("not a UUID");
    this.version = r.version, r.format === "ascii" ? this.ascii = t : this.binary = t;
  }
  static v5(t, r) {
    return hL(t, "sha1", 80, r);
  }
  toString() {
    return this.ascii == null && (this.ascii = pL(this.binary)), this.ascii;
  }
  inspect() {
    return `UUID v${this.version} ${this.toString()}`;
  }
  static check(t, r = 0) {
    if (typeof t == "string")
      return t = t.toLowerCase(), /^[a-f0-9]{8}(-[a-f0-9]{4}){3}-([a-f0-9]{12})$/.test(t) ? t === "00000000-0000-0000-0000-000000000000" ? { version: void 0, variant: "nil", format: "ascii" } : {
        version: (ho[t[14] + t[15]] & 240) >> 4,
        variant: tm((ho[t[19] + t[20]] & 224) >> 5),
        format: "ascii"
      } : !1;
    if (Buffer.isBuffer(t)) {
      if (t.length < r + 16)
        return !1;
      let n = 0;
      for (; n < 16 && t[r + n] === 0; n++)
        ;
      return n === 16 ? { version: void 0, variant: "nil", format: "binary" } : {
        version: (t[r + 6] & 240) >> 4,
        variant: tm((t[r + 8] & 224) >> 5),
        format: "binary"
      };
    }
    throw (0, m_.newError)("Unknown type of uuid", "ERR_UNKNOWN_UUID_TYPE");
  }
  // read stringified uuid into a Buffer
  static parse(t) {
    const r = Buffer.allocUnsafe(16);
    let n = 0;
    for (let i = 0; i < 16; i++)
      r[i] = ho[t[n++] + t[n++]], (i === 3 || i === 5 || i === 7 || i === 9) && (n += 1);
    return r;
  }
}
ji.UUID = Kn;
Kn.OID = Kn.parse("6ba7b812-9dad-11d1-80b4-00c04fd430c8");
function tm(e) {
  switch (e) {
    case 0:
    case 1:
    case 3:
      return "ncs";
    case 4:
    case 5:
      return "rfc4122";
    case 6:
      return "microsoft";
    default:
      return "future";
  }
}
var Ns;
(function(e) {
  e[e.ASCII = 0] = "ASCII", e[e.BINARY = 1] = "BINARY", e[e.OBJECT = 2] = "OBJECT";
})(Ns || (Ns = {}));
function hL(e, t, r, n, i = Ns.ASCII) {
  const s = (0, p_.createHash)(t);
  if (typeof e != "string" && !Buffer.isBuffer(e))
    throw (0, m_.newError)(fL, "ERR_INVALID_UUID_NAME");
  s.update(n), s.update(e);
  const o = s.digest();
  let c;
  switch (i) {
    case Ns.BINARY:
      o[6] = o[6] & 15 | r, o[8] = o[8] & 63 | 128, c = o;
      break;
    case Ns.OBJECT:
      o[6] = o[6] & 15 | r, o[8] = o[8] & 63 | 128, c = new Kn(o);
      break;
    default:
      c = ye[o[0]] + ye[o[1]] + ye[o[2]] + ye[o[3]] + "-" + ye[o[4]] + ye[o[5]] + "-" + ye[o[6] & 15 | r] + ye[o[7]] + "-" + ye[o[8] & 63 | 128] + ye[o[9]] + "-" + ye[o[10]] + ye[o[11]] + ye[o[12]] + ye[o[13]] + ye[o[14]] + ye[o[15]];
      break;
  }
  return c;
}
function pL(e) {
  return ye[e[0]] + ye[e[1]] + ye[e[2]] + ye[e[3]] + "-" + ye[e[4]] + ye[e[5]] + "-" + ye[e[6]] + ye[e[7]] + "-" + ye[e[8]] + ye[e[9]] + "-" + ye[e[10]] + ye[e[11]] + ye[e[12]] + ye[e[13]] + ye[e[14]] + ye[e[15]];
}
ji.nil = new Kn("00000000-0000-0000-0000-000000000000");
var ia = {}, y_ = {};
(function(e) {
  (function(t) {
    t.parser = function(w, y) {
      return new n(w, y);
    }, t.SAXParser = n, t.SAXStream = l, t.createStream = u, t.MAX_BUFFER_LENGTH = 64 * 1024;
    var r = [
      "comment",
      "sgmlDecl",
      "textNode",
      "tagName",
      "doctype",
      "procInstName",
      "procInstBody",
      "entity",
      "attribName",
      "attribValue",
      "cdata",
      "script"
    ];
    t.EVENTS = [
      "text",
      "processinginstruction",
      "sgmldeclaration",
      "doctype",
      "comment",
      "opentagstart",
      "attribute",
      "opentag",
      "closetag",
      "opencdata",
      "cdata",
      "closecdata",
      "error",
      "end",
      "ready",
      "script",
      "opennamespace",
      "closenamespace"
    ];
    function n(w, y) {
      if (!(this instanceof n))
        return new n(w, y);
      var k = this;
      s(k), k.q = k.c = "", k.bufferCheckPosition = t.MAX_BUFFER_LENGTH, k.opt = y || {}, k.opt.lowercase = k.opt.lowercase || k.opt.lowercasetags, k.looseCase = k.opt.lowercase ? "toLowerCase" : "toUpperCase", k.tags = [], k.closed = k.closedRoot = k.sawRoot = !1, k.tag = k.error = null, k.strict = !!w, k.noscript = !!(w || k.opt.noscript), k.state = C.BEGIN, k.strictEntities = k.opt.strictEntities, k.ENTITIES = k.strictEntities ? Object.create(t.XML_ENTITIES) : Object.create(t.ENTITIES), k.attribList = [], k.opt.xmlns && (k.ns = Object.create(_)), k.opt.unquotedAttributeValues === void 0 && (k.opt.unquotedAttributeValues = !w), k.trackPosition = k.opt.position !== !1, k.trackPosition && (k.position = k.line = k.column = 0), j(k, "onready");
    }
    Object.create || (Object.create = function(w) {
      function y() {
      }
      y.prototype = w;
      var k = new y();
      return k;
    }), Object.keys || (Object.keys = function(w) {
      var y = [];
      for (var k in w) w.hasOwnProperty(k) && y.push(k);
      return y;
    });
    function i(w) {
      for (var y = Math.max(t.MAX_BUFFER_LENGTH, 10), k = 0, A = 0, W = r.length; A < W; A++) {
        var fe = w[r[A]].length;
        if (fe > y)
          switch (r[A]) {
            case "textNode":
              Q(w);
              break;
            case "cdata":
              V(w, "oncdata", w.cdata), w.cdata = "";
              break;
            case "script":
              V(w, "onscript", w.script), w.script = "";
              break;
            default:
              U(w, "Max buffer length exceeded: " + r[A]);
          }
        k = Math.max(k, fe);
      }
      var ge = t.MAX_BUFFER_LENGTH - k;
      w.bufferCheckPosition = ge + w.position;
    }
    function s(w) {
      for (var y = 0, k = r.length; y < k; y++)
        w[r[y]] = "";
    }
    function a(w) {
      Q(w), w.cdata !== "" && (V(w, "oncdata", w.cdata), w.cdata = ""), w.script !== "" && (V(w, "onscript", w.script), w.script = "");
    }
    n.prototype = {
      end: function() {
        B(this);
      },
      write: N,
      resume: function() {
        return this.error = null, this;
      },
      close: function() {
        return this.write(null);
      },
      flush: function() {
        a(this);
      }
    };
    var o;
    try {
      o = require("stream").Stream;
    } catch {
      o = function() {
      };
    }
    o || (o = function() {
    });
    var c = t.EVENTS.filter(function(w) {
      return w !== "error" && w !== "end";
    });
    function u(w, y) {
      return new l(w, y);
    }
    function l(w, y) {
      if (!(this instanceof l))
        return new l(w, y);
      o.apply(this), this._parser = new n(w, y), this.writable = !0, this.readable = !0;
      var k = this;
      this._parser.onend = function() {
        k.emit("end");
      }, this._parser.onerror = function(A) {
        k.emit("error", A), k._parser.error = null;
      }, this._decoder = null, c.forEach(function(A) {
        Object.defineProperty(k, "on" + A, {
          get: function() {
            return k._parser["on" + A];
          },
          set: function(W) {
            if (!W)
              return k.removeAllListeners(A), k._parser["on" + A] = W, W;
            k.on(A, W);
          },
          enumerable: !0,
          configurable: !1
        });
      });
    }
    l.prototype = Object.create(o.prototype, {
      constructor: {
        value: l
      }
    }), l.prototype.write = function(w) {
      return typeof Buffer == "function" && typeof Buffer.isBuffer == "function" && Buffer.isBuffer(w) && (this._decoder || (this._decoder = new TextDecoder("utf8")), w = this._decoder.decode(w, { stream: !0 })), this._parser.write(w.toString()), this.emit("data", w), !0;
    }, l.prototype.end = function(w) {
      if (w && w.length && this.write(w), this._decoder) {
        var y = this._decoder.decode();
        y && (this._parser.write(y), this.emit("data", y));
      }
      return this._parser.end(), !0;
    }, l.prototype.on = function(w, y) {
      var k = this;
      return !k._parser["on" + w] && c.indexOf(w) !== -1 && (k._parser["on" + w] = function() {
        var A = arguments.length === 1 ? [arguments[0]] : Array.apply(null, arguments);
        A.splice(0, 0, w), k.emit.apply(k, A);
      }), o.prototype.on.call(k, w, y);
    };
    var d = "[CDATA[", h = "DOCTYPE", p = "http://www.w3.org/XML/1998/namespace", $ = "http://www.w3.org/2000/xmlns/", _ = { xml: p, xmlns: $ }, v = /[:_A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD]/, m = /[:_A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\u00B7\u0300-\u036F\u203F-\u2040.\d-]/, E = /[#:_A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD]/, T = /[#:_A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\u00B7\u0300-\u036F\u203F-\u2040.\d-]/;
    function R(w) {
      return w === " " || w === `
` || w === "\r" || w === "	";
    }
    function F(w) {
      return w === '"' || w === "'";
    }
    function H(w) {
      return w === ">" || R(w);
    }
    function G(w, y) {
      return w.test(y);
    }
    function ie(w, y) {
      return !G(w, y);
    }
    var C = 0;
    t.STATE = {
      BEGIN: C++,
      // leading byte order mark or whitespace
      BEGIN_WHITESPACE: C++,
      // leading whitespace
      TEXT: C++,
      // general stuff
      TEXT_ENTITY: C++,
      // &amp and such.
      OPEN_WAKA: C++,
      // <
      SGML_DECL: C++,
      // <!BLARG
      SGML_DECL_QUOTED: C++,
      // <!BLARG foo "bar
      DOCTYPE: C++,
      // <!DOCTYPE
      DOCTYPE_QUOTED: C++,
      // <!DOCTYPE "//blah
      DOCTYPE_DTD: C++,
      // <!DOCTYPE "//blah" [ ...
      DOCTYPE_DTD_QUOTED: C++,
      // <!DOCTYPE "//blah" [ "foo
      COMMENT_STARTING: C++,
      // <!-
      COMMENT: C++,
      // <!--
      COMMENT_ENDING: C++,
      // <!-- blah -
      COMMENT_ENDED: C++,
      // <!-- blah --
      CDATA: C++,
      // <![CDATA[ something
      CDATA_ENDING: C++,
      // ]
      CDATA_ENDING_2: C++,
      // ]]
      PROC_INST: C++,
      // <?hi
      PROC_INST_BODY: C++,
      // <?hi there
      PROC_INST_ENDING: C++,
      // <?hi "there" ?
      OPEN_TAG: C++,
      // <strong
      OPEN_TAG_SLASH: C++,
      // <strong /
      ATTRIB: C++,
      // <a
      ATTRIB_NAME: C++,
      // <a foo
      ATTRIB_NAME_SAW_WHITE: C++,
      // <a foo _
      ATTRIB_VALUE: C++,
      // <a foo=
      ATTRIB_VALUE_QUOTED: C++,
      // <a foo="bar
      ATTRIB_VALUE_CLOSED: C++,
      // <a foo="bar"
      ATTRIB_VALUE_UNQUOTED: C++,
      // <a foo=bar
      ATTRIB_VALUE_ENTITY_Q: C++,
      // <foo bar="&quot;"
      ATTRIB_VALUE_ENTITY_U: C++,
      // <foo bar=&quot
      CLOSE_TAG: C++,
      // </a
      CLOSE_TAG_SAW_WHITE: C++,
      // </a   >
      SCRIPT: C++,
      // <script> ...
      SCRIPT_ENDING: C++
      // <script> ... <
    }, t.XML_ENTITIES = {
      amp: "&",
      gt: ">",
      lt: "<",
      quot: '"',
      apos: "'"
    }, t.ENTITIES = {
      amp: "&",
      gt: ">",
      lt: "<",
      quot: '"',
      apos: "'",
      AElig: 198,
      Aacute: 193,
      Acirc: 194,
      Agrave: 192,
      Aring: 197,
      Atilde: 195,
      Auml: 196,
      Ccedil: 199,
      ETH: 208,
      Eacute: 201,
      Ecirc: 202,
      Egrave: 200,
      Euml: 203,
      Iacute: 205,
      Icirc: 206,
      Igrave: 204,
      Iuml: 207,
      Ntilde: 209,
      Oacute: 211,
      Ocirc: 212,
      Ograve: 210,
      Oslash: 216,
      Otilde: 213,
      Ouml: 214,
      THORN: 222,
      Uacute: 218,
      Ucirc: 219,
      Ugrave: 217,
      Uuml: 220,
      Yacute: 221,
      aacute: 225,
      acirc: 226,
      aelig: 230,
      agrave: 224,
      aring: 229,
      atilde: 227,
      auml: 228,
      ccedil: 231,
      eacute: 233,
      ecirc: 234,
      egrave: 232,
      eth: 240,
      euml: 235,
      iacute: 237,
      icirc: 238,
      igrave: 236,
      iuml: 239,
      ntilde: 241,
      oacute: 243,
      ocirc: 244,
      ograve: 242,
      oslash: 248,
      otilde: 245,
      ouml: 246,
      szlig: 223,
      thorn: 254,
      uacute: 250,
      ucirc: 251,
      ugrave: 249,
      uuml: 252,
      yacute: 253,
      yuml: 255,
      copy: 169,
      reg: 174,
      nbsp: 160,
      iexcl: 161,
      cent: 162,
      pound: 163,
      curren: 164,
      yen: 165,
      brvbar: 166,
      sect: 167,
      uml: 168,
      ordf: 170,
      laquo: 171,
      not: 172,
      shy: 173,
      macr: 175,
      deg: 176,
      plusmn: 177,
      sup1: 185,
      sup2: 178,
      sup3: 179,
      acute: 180,
      micro: 181,
      para: 182,
      middot: 183,
      cedil: 184,
      ordm: 186,
      raquo: 187,
      frac14: 188,
      frac12: 189,
      frac34: 190,
      iquest: 191,
      times: 215,
      divide: 247,
      OElig: 338,
      oelig: 339,
      Scaron: 352,
      scaron: 353,
      Yuml: 376,
      fnof: 402,
      circ: 710,
      tilde: 732,
      Alpha: 913,
      Beta: 914,
      Gamma: 915,
      Delta: 916,
      Epsilon: 917,
      Zeta: 918,
      Eta: 919,
      Theta: 920,
      Iota: 921,
      Kappa: 922,
      Lambda: 923,
      Mu: 924,
      Nu: 925,
      Xi: 926,
      Omicron: 927,
      Pi: 928,
      Rho: 929,
      Sigma: 931,
      Tau: 932,
      Upsilon: 933,
      Phi: 934,
      Chi: 935,
      Psi: 936,
      Omega: 937,
      alpha: 945,
      beta: 946,
      gamma: 947,
      delta: 948,
      epsilon: 949,
      zeta: 950,
      eta: 951,
      theta: 952,
      iota: 953,
      kappa: 954,
      lambda: 955,
      mu: 956,
      nu: 957,
      xi: 958,
      omicron: 959,
      pi: 960,
      rho: 961,
      sigmaf: 962,
      sigma: 963,
      tau: 964,
      upsilon: 965,
      phi: 966,
      chi: 967,
      psi: 968,
      omega: 969,
      thetasym: 977,
      upsih: 978,
      piv: 982,
      ensp: 8194,
      emsp: 8195,
      thinsp: 8201,
      zwnj: 8204,
      zwj: 8205,
      lrm: 8206,
      rlm: 8207,
      ndash: 8211,
      mdash: 8212,
      lsquo: 8216,
      rsquo: 8217,
      sbquo: 8218,
      ldquo: 8220,
      rdquo: 8221,
      bdquo: 8222,
      dagger: 8224,
      Dagger: 8225,
      bull: 8226,
      hellip: 8230,
      permil: 8240,
      prime: 8242,
      Prime: 8243,
      lsaquo: 8249,
      rsaquo: 8250,
      oline: 8254,
      frasl: 8260,
      euro: 8364,
      image: 8465,
      weierp: 8472,
      real: 8476,
      trade: 8482,
      alefsym: 8501,
      larr: 8592,
      uarr: 8593,
      rarr: 8594,
      darr: 8595,
      harr: 8596,
      crarr: 8629,
      lArr: 8656,
      uArr: 8657,
      rArr: 8658,
      dArr: 8659,
      hArr: 8660,
      forall: 8704,
      part: 8706,
      exist: 8707,
      empty: 8709,
      nabla: 8711,
      isin: 8712,
      notin: 8713,
      ni: 8715,
      prod: 8719,
      sum: 8721,
      minus: 8722,
      lowast: 8727,
      radic: 8730,
      prop: 8733,
      infin: 8734,
      ang: 8736,
      and: 8743,
      or: 8744,
      cap: 8745,
      cup: 8746,
      int: 8747,
      there4: 8756,
      sim: 8764,
      cong: 8773,
      asymp: 8776,
      ne: 8800,
      equiv: 8801,
      le: 8804,
      ge: 8805,
      sub: 8834,
      sup: 8835,
      nsub: 8836,
      sube: 8838,
      supe: 8839,
      oplus: 8853,
      otimes: 8855,
      perp: 8869,
      sdot: 8901,
      lceil: 8968,
      rceil: 8969,
      lfloor: 8970,
      rfloor: 8971,
      lang: 9001,
      rang: 9002,
      loz: 9674,
      spades: 9824,
      clubs: 9827,
      hearts: 9829,
      diams: 9830
    }, Object.keys(t.ENTITIES).forEach(function(w) {
      var y = t.ENTITIES[w], k = typeof y == "number" ? String.fromCharCode(y) : y;
      t.ENTITIES[w] = k;
    });
    for (var J in t.STATE)
      t.STATE[t.STATE[J]] = J;
    C = t.STATE;
    function j(w, y, k) {
      w[y] && w[y](k);
    }
    function V(w, y, k) {
      w.textNode && Q(w), j(w, y, k);
    }
    function Q(w) {
      w.textNode = L(w.opt, w.textNode), w.textNode && j(w, "ontext", w.textNode), w.textNode = "";
    }
    function L(w, y) {
      return w.trim && (y = y.trim()), w.normalize && (y = y.replace(/\s+/g, " ")), y;
    }
    function U(w, y) {
      return Q(w), w.trackPosition && (y += `
Line: ` + w.line + `
Column: ` + w.column + `
Char: ` + w.c), y = new Error(y), w.error = y, j(w, "onerror", y), w;
    }
    function B(w) {
      return w.sawRoot && !w.closedRoot && M(w, "Unclosed root tag"), w.state !== C.BEGIN && w.state !== C.BEGIN_WHITESPACE && w.state !== C.TEXT && U(w, "Unexpected end"), Q(w), w.c = "", w.closed = !0, j(w, "onend"), n.call(w, w.strict, w.opt), w;
    }
    function M(w, y) {
      if (typeof w != "object" || !(w instanceof n))
        throw new Error("bad call to strictFail");
      w.strict && U(w, y);
    }
    function z(w) {
      w.strict || (w.tagName = w.tagName[w.looseCase]());
      var y = w.tags[w.tags.length - 1] || w, k = w.tag = { name: w.tagName, attributes: {} };
      w.opt.xmlns && (k.ns = y.ns), w.attribList.length = 0, V(w, "onopentagstart", k);
    }
    function q(w, y) {
      var k = w.indexOf(":"), A = k < 0 ? ["", w] : w.split(":"), W = A[0], fe = A[1];
      return y && w === "xmlns" && (W = "xmlns", fe = ""), { prefix: W, local: fe };
    }
    function I(w) {
      if (w.strict || (w.attribName = w.attribName[w.looseCase]()), w.attribList.indexOf(w.attribName) !== -1 || w.tag.attributes.hasOwnProperty(w.attribName)) {
        w.attribName = w.attribValue = "";
        return;
      }
      if (w.opt.xmlns) {
        var y = q(w.attribName, !0), k = y.prefix, A = y.local;
        if (k === "xmlns")
          if (A === "xml" && w.attribValue !== p)
            M(
              w,
              "xml: prefix must be bound to " + p + `
Actual: ` + w.attribValue
            );
          else if (A === "xmlns" && w.attribValue !== $)
            M(
              w,
              "xmlns: prefix must be bound to " + $ + `
Actual: ` + w.attribValue
            );
          else {
            var W = w.tag, fe = w.tags[w.tags.length - 1] || w;
            W.ns === fe.ns && (W.ns = Object.create(fe.ns)), W.ns[A] = w.attribValue;
          }
        w.attribList.push([w.attribName, w.attribValue]);
      } else
        w.tag.attributes[w.attribName] = w.attribValue, V(w, "onattribute", {
          name: w.attribName,
          value: w.attribValue
        });
      w.attribName = w.attribValue = "";
    }
    function b(w, y) {
      if (w.opt.xmlns) {
        var k = w.tag, A = q(w.tagName);
        k.prefix = A.prefix, k.local = A.local, k.uri = k.ns[A.prefix] || "", k.prefix && !k.uri && (M(
          w,
          "Unbound namespace prefix: " + JSON.stringify(w.tagName)
        ), k.uri = A.prefix);
        var W = w.tags[w.tags.length - 1] || w;
        k.ns && W.ns !== k.ns && Object.keys(k.ns).forEach(function(jt) {
          V(w, "onopennamespace", {
            prefix: jt,
            uri: k.ns[jt]
          });
        });
        for (var fe = 0, ge = w.attribList.length; fe < ge; fe++) {
          var be = w.attribList[fe], Ne = be[0], et = be[1], _e = q(Ne, !0), Le = _e.prefix, Bt = _e.local, Ft = Le === "" ? "" : k.ns[Le] || "", At = {
            name: Ne,
            value: et,
            prefix: Le,
            local: Bt,
            uri: Ft
          };
          Le && Le !== "xmlns" && !Ft && (M(
            w,
            "Unbound namespace prefix: " + JSON.stringify(Le)
          ), At.uri = Le), w.tag.attributes[Ne] = At, V(w, "onattribute", At);
        }
        w.attribList.length = 0;
      }
      w.tag.isSelfClosing = !!y, w.sawRoot = !0, w.tags.push(w.tag), V(w, "onopentag", w.tag), y || (!w.noscript && w.tagName.toLowerCase() === "script" ? w.state = C.SCRIPT : w.state = C.TEXT, w.tag = null, w.tagName = ""), w.attribName = w.attribValue = "", w.attribList.length = 0;
    }
    function O(w) {
      if (!w.tagName) {
        M(w, "Weird empty close tag."), w.textNode += "</>", w.state = C.TEXT;
        return;
      }
      if (w.script) {
        if (w.tagName !== "script") {
          w.script += "</" + w.tagName + ">", w.tagName = "", w.state = C.SCRIPT;
          return;
        }
        V(w, "onscript", w.script), w.script = "";
      }
      var y = w.tags.length, k = w.tagName;
      w.strict || (k = k[w.looseCase]());
      for (var A = k; y--; ) {
        var W = w.tags[y];
        if (W.name !== A)
          M(w, "Unexpected close tag");
        else
          break;
      }
      if (y < 0) {
        M(w, "Unmatched closing tag: " + w.tagName), w.textNode += "</" + w.tagName + ">", w.state = C.TEXT;
        return;
      }
      w.tagName = k;
      for (var fe = w.tags.length; fe-- > y; ) {
        var ge = w.tag = w.tags.pop();
        w.tagName = w.tag.name, V(w, "onclosetag", w.tagName);
        var be = {};
        for (var Ne in ge.ns)
          be[Ne] = ge.ns[Ne];
        var et = w.tags[w.tags.length - 1] || w;
        w.opt.xmlns && ge.ns !== et.ns && Object.keys(ge.ns).forEach(function(_e) {
          var Le = ge.ns[_e];
          V(w, "onclosenamespace", { prefix: _e, uri: Le });
        });
      }
      y === 0 && (w.closedRoot = !0), w.tagName = w.attribValue = w.attribName = "", w.attribList.length = 0, w.state = C.TEXT;
    }
    function S(w) {
      var y = w.entity, k = y.toLowerCase(), A, W = "";
      return w.ENTITIES[y] ? w.ENTITIES[y] : w.ENTITIES[k] ? w.ENTITIES[k] : (y = k, y.charAt(0) === "#" && (y.charAt(1) === "x" ? (y = y.slice(2), A = parseInt(y, 16), W = A.toString(16)) : (y = y.slice(1), A = parseInt(y, 10), W = A.toString(10))), y = y.replace(/^0+/, ""), isNaN(A) || W.toLowerCase() !== y || A < 0 || A > 1114111 ? (M(w, "Invalid character entity"), "&" + w.entity + ";") : String.fromCodePoint(A));
    }
    function f(w, y) {
      y === "<" ? (w.state = C.OPEN_WAKA, w.startTagPosition = w.position) : R(y) || (M(w, "Non-whitespace before first tag."), w.textNode = y, w.state = C.TEXT);
    }
    function g(w, y) {
      var k = "";
      return y < w.length && (k = w.charAt(y)), k;
    }
    function N(w) {
      var y = this;
      if (this.error)
        throw this.error;
      if (y.closed)
        return U(
          y,
          "Cannot write after close. Assign an onready handler."
        );
      if (w === null)
        return B(y);
      typeof w == "object" && (w = w.toString());
      for (var k = 0, A = ""; A = g(w, k++), y.c = A, !!A; )
        switch (y.trackPosition && (y.position++, A === `
` ? (y.line++, y.column = 0) : y.column++), y.state) {
          case C.BEGIN:
            if (y.state = C.BEGIN_WHITESPACE, A === "\uFEFF")
              continue;
            f(y, A);
            continue;
          case C.BEGIN_WHITESPACE:
            f(y, A);
            continue;
          case C.TEXT:
            if (y.sawRoot && !y.closedRoot) {
              for (var fe = k - 1; A && A !== "<" && A !== "&"; )
                A = g(w, k++), A && y.trackPosition && (y.position++, A === `
` ? (y.line++, y.column = 0) : y.column++);
              y.textNode += w.substring(fe, k - 1);
            }
            A === "<" && !(y.sawRoot && y.closedRoot && !y.strict) ? (y.state = C.OPEN_WAKA, y.startTagPosition = y.position) : (!R(A) && (!y.sawRoot || y.closedRoot) && M(y, "Text data outside of root node."), A === "&" ? y.state = C.TEXT_ENTITY : y.textNode += A);
            continue;
          case C.SCRIPT:
            A === "<" ? y.state = C.SCRIPT_ENDING : y.script += A;
            continue;
          case C.SCRIPT_ENDING:
            A === "/" ? y.state = C.CLOSE_TAG : (y.script += "<" + A, y.state = C.SCRIPT);
            continue;
          case C.OPEN_WAKA:
            if (A === "!")
              y.state = C.SGML_DECL, y.sgmlDecl = "";
            else if (!R(A)) if (G(v, A))
              y.state = C.OPEN_TAG, y.tagName = A;
            else if (A === "/")
              y.state = C.CLOSE_TAG, y.tagName = "";
            else if (A === "?")
              y.state = C.PROC_INST, y.procInstName = y.procInstBody = "";
            else {
              if (M(y, "Unencoded <"), y.startTagPosition + 1 < y.position) {
                var W = y.position - y.startTagPosition;
                A = new Array(W).join(" ") + A;
              }
              y.textNode += "<" + A, y.state = C.TEXT;
            }
            continue;
          case C.SGML_DECL:
            if (y.sgmlDecl + A === "--") {
              y.state = C.COMMENT, y.comment = "", y.sgmlDecl = "";
              continue;
            }
            y.doctype && y.doctype !== !0 && y.sgmlDecl ? (y.state = C.DOCTYPE_DTD, y.doctype += "<!" + y.sgmlDecl + A, y.sgmlDecl = "") : (y.sgmlDecl + A).toUpperCase() === d ? (V(y, "onopencdata"), y.state = C.CDATA, y.sgmlDecl = "", y.cdata = "") : (y.sgmlDecl + A).toUpperCase() === h ? (y.state = C.DOCTYPE, (y.doctype || y.sawRoot) && M(
              y,
              "Inappropriately located doctype declaration"
            ), y.doctype = "", y.sgmlDecl = "") : A === ">" ? (V(y, "onsgmldeclaration", y.sgmlDecl), y.sgmlDecl = "", y.state = C.TEXT) : (F(A) && (y.state = C.SGML_DECL_QUOTED), y.sgmlDecl += A);
            continue;
          case C.SGML_DECL_QUOTED:
            A === y.q && (y.state = C.SGML_DECL, y.q = ""), y.sgmlDecl += A;
            continue;
          case C.DOCTYPE:
            A === ">" ? (y.state = C.TEXT, V(y, "ondoctype", y.doctype), y.doctype = !0) : (y.doctype += A, A === "[" ? y.state = C.DOCTYPE_DTD : F(A) && (y.state = C.DOCTYPE_QUOTED, y.q = A));
            continue;
          case C.DOCTYPE_QUOTED:
            y.doctype += A, A === y.q && (y.q = "", y.state = C.DOCTYPE);
            continue;
          case C.DOCTYPE_DTD:
            A === "]" ? (y.doctype += A, y.state = C.DOCTYPE) : A === "<" ? (y.state = C.OPEN_WAKA, y.startTagPosition = y.position) : F(A) ? (y.doctype += A, y.state = C.DOCTYPE_DTD_QUOTED, y.q = A) : y.doctype += A;
            continue;
          case C.DOCTYPE_DTD_QUOTED:
            y.doctype += A, A === y.q && (y.state = C.DOCTYPE_DTD, y.q = "");
            continue;
          case C.COMMENT:
            A === "-" ? y.state = C.COMMENT_ENDING : y.comment += A;
            continue;
          case C.COMMENT_ENDING:
            A === "-" ? (y.state = C.COMMENT_ENDED, y.comment = L(y.opt, y.comment), y.comment && V(y, "oncomment", y.comment), y.comment = "") : (y.comment += "-" + A, y.state = C.COMMENT);
            continue;
          case C.COMMENT_ENDED:
            A !== ">" ? (M(y, "Malformed comment"), y.comment += "--" + A, y.state = C.COMMENT) : y.doctype && y.doctype !== !0 ? y.state = C.DOCTYPE_DTD : y.state = C.TEXT;
            continue;
          case C.CDATA:
            for (var fe = k - 1; A && A !== "]"; )
              A = g(w, k++), A && y.trackPosition && (y.position++, A === `
` ? (y.line++, y.column = 0) : y.column++);
            y.cdata += w.substring(fe, k - 1), A === "]" && (y.state = C.CDATA_ENDING);
            continue;
          case C.CDATA_ENDING:
            A === "]" ? y.state = C.CDATA_ENDING_2 : (y.cdata += "]" + A, y.state = C.CDATA);
            continue;
          case C.CDATA_ENDING_2:
            A === ">" ? (y.cdata && V(y, "oncdata", y.cdata), V(y, "onclosecdata"), y.cdata = "", y.state = C.TEXT) : A === "]" ? y.cdata += "]" : (y.cdata += "]]" + A, y.state = C.CDATA);
            continue;
          case C.PROC_INST:
            A === "?" ? y.state = C.PROC_INST_ENDING : R(A) ? y.state = C.PROC_INST_BODY : y.procInstName += A;
            continue;
          case C.PROC_INST_BODY:
            if (!y.procInstBody && R(A))
              continue;
            A === "?" ? y.state = C.PROC_INST_ENDING : y.procInstBody += A;
            continue;
          case C.PROC_INST_ENDING:
            A === ">" ? (V(y, "onprocessinginstruction", {
              name: y.procInstName,
              body: y.procInstBody
            }), y.procInstName = y.procInstBody = "", y.state = C.TEXT) : (y.procInstBody += "?" + A, y.state = C.PROC_INST_BODY);
            continue;
          case C.OPEN_TAG:
            G(m, A) ? y.tagName += A : (z(y), A === ">" ? b(y) : A === "/" ? y.state = C.OPEN_TAG_SLASH : (R(A) || M(y, "Invalid character in tag name"), y.state = C.ATTRIB));
            continue;
          case C.OPEN_TAG_SLASH:
            A === ">" ? (b(y, !0), O(y)) : (M(
              y,
              "Forward-slash in opening tag not followed by >"
            ), y.state = C.ATTRIB);
            continue;
          case C.ATTRIB:
            if (R(A))
              continue;
            A === ">" ? b(y) : A === "/" ? y.state = C.OPEN_TAG_SLASH : G(v, A) ? (y.attribName = A, y.attribValue = "", y.state = C.ATTRIB_NAME) : M(y, "Invalid attribute name");
            continue;
          case C.ATTRIB_NAME:
            A === "=" ? y.state = C.ATTRIB_VALUE : A === ">" ? (M(y, "Attribute without value"), y.attribValue = y.attribName, I(y), b(y)) : R(A) ? y.state = C.ATTRIB_NAME_SAW_WHITE : G(m, A) ? y.attribName += A : M(y, "Invalid attribute name");
            continue;
          case C.ATTRIB_NAME_SAW_WHITE:
            if (A === "=")
              y.state = C.ATTRIB_VALUE;
            else {
              if (R(A))
                continue;
              M(y, "Attribute without value"), y.tag.attributes[y.attribName] = "", y.attribValue = "", V(y, "onattribute", {
                name: y.attribName,
                value: ""
              }), y.attribName = "", A === ">" ? b(y) : G(v, A) ? (y.attribName = A, y.state = C.ATTRIB_NAME) : (M(y, "Invalid attribute name"), y.state = C.ATTRIB);
            }
            continue;
          case C.ATTRIB_VALUE:
            if (R(A))
              continue;
            F(A) ? (y.q = A, y.state = C.ATTRIB_VALUE_QUOTED) : (y.opt.unquotedAttributeValues || U(y, "Unquoted attribute value"), y.state = C.ATTRIB_VALUE_UNQUOTED, y.attribValue = A);
            continue;
          case C.ATTRIB_VALUE_QUOTED:
            if (A !== y.q) {
              A === "&" ? y.state = C.ATTRIB_VALUE_ENTITY_Q : y.attribValue += A;
              continue;
            }
            I(y), y.q = "", y.state = C.ATTRIB_VALUE_CLOSED;
            continue;
          case C.ATTRIB_VALUE_CLOSED:
            R(A) ? y.state = C.ATTRIB : A === ">" ? b(y) : A === "/" ? y.state = C.OPEN_TAG_SLASH : G(v, A) ? (M(y, "No whitespace between attributes"), y.attribName = A, y.attribValue = "", y.state = C.ATTRIB_NAME) : M(y, "Invalid attribute name");
            continue;
          case C.ATTRIB_VALUE_UNQUOTED:
            if (!H(A)) {
              A === "&" ? y.state = C.ATTRIB_VALUE_ENTITY_U : y.attribValue += A;
              continue;
            }
            I(y), A === ">" ? b(y) : y.state = C.ATTRIB;
            continue;
          case C.CLOSE_TAG:
            if (y.tagName)
              A === ">" ? O(y) : G(m, A) ? y.tagName += A : y.script ? (y.script += "</" + y.tagName + A, y.tagName = "", y.state = C.SCRIPT) : (R(A) || M(y, "Invalid tagname in closing tag"), y.state = C.CLOSE_TAG_SAW_WHITE);
            else {
              if (R(A))
                continue;
              ie(v, A) ? y.script ? (y.script += "</" + A, y.state = C.SCRIPT) : M(y, "Invalid tagname in closing tag.") : y.tagName = A;
            }
            continue;
          case C.CLOSE_TAG_SAW_WHITE:
            if (R(A))
              continue;
            A === ">" ? O(y) : M(y, "Invalid characters in closing tag");
            continue;
          case C.TEXT_ENTITY:
          case C.ATTRIB_VALUE_ENTITY_Q:
          case C.ATTRIB_VALUE_ENTITY_U:
            var ge, be;
            switch (y.state) {
              case C.TEXT_ENTITY:
                ge = C.TEXT, be = "textNode";
                break;
              case C.ATTRIB_VALUE_ENTITY_Q:
                ge = C.ATTRIB_VALUE_QUOTED, be = "attribValue";
                break;
              case C.ATTRIB_VALUE_ENTITY_U:
                ge = C.ATTRIB_VALUE_UNQUOTED, be = "attribValue";
                break;
            }
            if (A === ";") {
              var Ne = S(y);
              y.opt.unparsedEntities && !Object.values(t.XML_ENTITIES).includes(Ne) ? (y.entity = "", y.state = ge, y.write(Ne)) : (y[be] += Ne, y.entity = "", y.state = ge);
            } else G(y.entity.length ? T : E, A) ? y.entity += A : (M(y, "Invalid character in entity name"), y[be] += "&" + y.entity + A, y.entity = "", y.state = ge);
            continue;
          default:
            throw new Error(y, "Unknown state: " + y.state);
        }
      return y.position >= y.bufferCheckPosition && i(y), y;
    }
    /*! http://mths.be/fromcodepoint v0.1.0 by @mathias */
    String.fromCodePoint || function() {
      var w = String.fromCharCode, y = Math.floor, k = function() {
        var A = 16384, W = [], fe, ge, be = -1, Ne = arguments.length;
        if (!Ne)
          return "";
        for (var et = ""; ++be < Ne; ) {
          var _e = Number(arguments[be]);
          if (!isFinite(_e) || // `NaN`, `+Infinity`, or `-Infinity`
          _e < 0 || // not a valid Unicode code point
          _e > 1114111 || // not a valid Unicode code point
          y(_e) !== _e)
            throw RangeError("Invalid code point: " + _e);
          _e <= 65535 ? W.push(_e) : (_e -= 65536, fe = (_e >> 10) + 55296, ge = _e % 1024 + 56320, W.push(fe, ge)), (be + 1 === Ne || W.length > A) && (et += w.apply(null, W), W.length = 0);
        }
        return et;
      };
      Object.defineProperty ? Object.defineProperty(String, "fromCodePoint", {
        value: k,
        configurable: !0,
        writable: !0
      }) : String.fromCodePoint = k;
    }();
  })(e);
})(y_);
Object.defineProperty(ia, "__esModule", { value: !0 });
ia.XElement = void 0;
ia.parseXml = _L;
const mL = y_, za = Wi;
class g_ {
  constructor(t) {
    if (this.name = t, this.value = "", this.attributes = null, this.isCData = !1, this.elements = null, !t)
      throw (0, za.newError)("Element name cannot be empty", "ERR_XML_ELEMENT_NAME_EMPTY");
    if (!gL(t))
      throw (0, za.newError)(`Invalid element name: ${t}`, "ERR_XML_ELEMENT_INVALID_NAME");
  }
  attribute(t) {
    const r = this.attributes === null ? null : this.attributes[t];
    if (r == null)
      throw (0, za.newError)(`No attribute "${t}"`, "ERR_XML_MISSED_ATTRIBUTE");
    return r;
  }
  removeAttribute(t) {
    this.attributes !== null && delete this.attributes[t];
  }
  element(t, r = !1, n = null) {
    const i = this.elementOrNull(t, r);
    if (i === null)
      throw (0, za.newError)(n || `No element "${t}"`, "ERR_XML_MISSED_ELEMENT");
    return i;
  }
  elementOrNull(t, r = !1) {
    if (this.elements === null)
      return null;
    for (const n of this.elements)
      if (rm(n, t, r))
        return n;
    return null;
  }
  getElements(t, r = !1) {
    return this.elements === null ? [] : this.elements.filter((n) => rm(n, t, r));
  }
  elementValueOrEmpty(t, r = !1) {
    const n = this.elementOrNull(t, r);
    return n === null ? "" : n.value;
  }
}
ia.XElement = g_;
const yL = new RegExp(/^[A-Za-z_][:A-Za-z0-9_-]*$/i);
function gL(e) {
  return yL.test(e);
}
function rm(e, t, r) {
  const n = e.name;
  return n === t || r === !0 && n.length === t.length && n.toLowerCase() === t.toLowerCase();
}
function _L(e) {
  let t = null;
  const r = mL.parser(!0, {}), n = [];
  return r.onopentag = (i) => {
    const s = new g_(i.name);
    if (s.attributes = i.attributes, t === null)
      t = s;
    else {
      const a = n[n.length - 1];
      a.elements == null && (a.elements = []), a.elements.push(s);
    }
    n.push(s);
  }, r.onclosetag = () => {
    n.pop();
  }, r.ontext = (i) => {
    n.length > 0 && (n[n.length - 1].value = i);
  }, r.oncdata = (i) => {
    const s = n[n.length - 1];
    s.value = i, s.isCData = !0;
  }, r.onerror = (i) => {
    throw i;
  }, r.write(e), t;
}
(function(e) {
  Object.defineProperty(e, "__esModule", { value: !0 }), e.CURRENT_APP_PACKAGE_FILE_NAME = e.CURRENT_APP_INSTALLER_FILE_NAME = e.XElement = e.parseXml = e.UUID = e.parseDn = e.retry = e.githubTagPrefix = e.githubUrl = e.getS3LikeProviderBaseUrl = e.ProgressCallbackTransform = e.MemoLazy = e.safeStringifyJson = e.safeGetHeader = e.parseJson = e.HttpExecutor = e.HttpError = e.DigestTransform = e.createHttpError = e.configureRequestUrl = e.configureRequestOptionsFromUrl = e.configureRequestOptions = e.newError = e.CancellationToken = e.CancellationError = void 0, e.asArray = d;
  var t = dn;
  Object.defineProperty(e, "CancellationError", { enumerable: !0, get: function() {
    return t.CancellationError;
  } }), Object.defineProperty(e, "CancellationToken", { enumerable: !0, get: function() {
    return t.CancellationToken;
  } });
  var r = Wi;
  Object.defineProperty(e, "newError", { enumerable: !0, get: function() {
    return r.newError;
  } });
  var n = yt;
  Object.defineProperty(e, "configureRequestOptions", { enumerable: !0, get: function() {
    return n.configureRequestOptions;
  } }), Object.defineProperty(e, "configureRequestOptionsFromUrl", { enumerable: !0, get: function() {
    return n.configureRequestOptionsFromUrl;
  } }), Object.defineProperty(e, "configureRequestUrl", { enumerable: !0, get: function() {
    return n.configureRequestUrl;
  } }), Object.defineProperty(e, "createHttpError", { enumerable: !0, get: function() {
    return n.createHttpError;
  } }), Object.defineProperty(e, "DigestTransform", { enumerable: !0, get: function() {
    return n.DigestTransform;
  } }), Object.defineProperty(e, "HttpError", { enumerable: !0, get: function() {
    return n.HttpError;
  } }), Object.defineProperty(e, "HttpExecutor", { enumerable: !0, get: function() {
    return n.HttpExecutor;
  } }), Object.defineProperty(e, "parseJson", { enumerable: !0, get: function() {
    return n.parseJson;
  } }), Object.defineProperty(e, "safeGetHeader", { enumerable: !0, get: function() {
    return n.safeGetHeader;
  } }), Object.defineProperty(e, "safeStringifyJson", { enumerable: !0, get: function() {
    return n.safeStringifyJson;
  } });
  var i = lc;
  Object.defineProperty(e, "MemoLazy", { enumerable: !0, get: function() {
    return i.MemoLazy;
  } });
  var s = ra;
  Object.defineProperty(e, "ProgressCallbackTransform", { enumerable: !0, get: function() {
    return s.ProgressCallbackTransform;
  } });
  var a = na;
  Object.defineProperty(e, "getS3LikeProviderBaseUrl", { enumerable: !0, get: function() {
    return a.getS3LikeProviderBaseUrl;
  } }), Object.defineProperty(e, "githubUrl", { enumerable: !0, get: function() {
    return a.githubUrl;
  } }), Object.defineProperty(e, "githubTagPrefix", { enumerable: !0, get: function() {
    return a.githubTagPrefix;
  } });
  var o = $f;
  Object.defineProperty(e, "retry", { enumerable: !0, get: function() {
    return o.retry;
  } });
  var c = wf;
  Object.defineProperty(e, "parseDn", { enumerable: !0, get: function() {
    return c.parseDn;
  } });
  var u = ji;
  Object.defineProperty(e, "UUID", { enumerable: !0, get: function() {
    return u.UUID;
  } });
  var l = ia;
  Object.defineProperty(e, "parseXml", { enumerable: !0, get: function() {
    return l.parseXml;
  } }), Object.defineProperty(e, "XElement", { enumerable: !0, get: function() {
    return l.XElement;
  } }), e.CURRENT_APP_INSTALLER_FILE_NAME = "installer.exe", e.CURRENT_APP_PACKAGE_FILE_NAME = "package.7z";
  function d(h) {
    return h == null ? [] : Array.isArray(h) ? h : [h];
  }
})(Ve);
var Ze = {}, Ef = {}, sr = {};
function __(e) {
  return typeof e > "u" || e === null;
}
function vL(e) {
  return typeof e == "object" && e !== null;
}
function $L(e) {
  return Array.isArray(e) ? e : __(e) ? [] : [e];
}
function wL(e, t) {
  var r, n, i, s;
  if (t)
    for (s = Object.keys(t), r = 0, n = s.length; r < n; r += 1)
      i = s[r], e[i] = t[i];
  return e;
}
function EL(e, t) {
  var r = "", n;
  for (n = 0; n < t; n += 1)
    r += e;
  return r;
}
function bL(e) {
  return e === 0 && Number.NEGATIVE_INFINITY === 1 / e;
}
sr.isNothing = __;
sr.isObject = vL;
sr.toArray = $L;
sr.repeat = EL;
sr.isNegativeZero = bL;
sr.extend = wL;
function v_(e, t) {
  var r = "", n = e.reason || "(unknown reason)";
  return e.mark ? (e.mark.name && (r += 'in "' + e.mark.name + '" '), r += "(" + (e.mark.line + 1) + ":" + (e.mark.column + 1) + ")", !t && e.mark.snippet && (r += `

` + e.mark.snippet), n + " " + r) : n;
}
function js(e, t) {
  Error.call(this), this.name = "YAMLException", this.reason = e, this.mark = t, this.message = v_(this, !1), Error.captureStackTrace ? Error.captureStackTrace(this, this.constructor) : this.stack = new Error().stack || "";
}
js.prototype = Object.create(Error.prototype);
js.prototype.constructor = js;
js.prototype.toString = function(t) {
  return this.name + ": " + v_(this, t);
};
var sa = js, hs = sr;
function ol(e, t, r, n, i) {
  var s = "", a = "", o = Math.floor(i / 2) - 1;
  return n - t > o && (s = " ... ", t = n - o + s.length), r - n > o && (a = " ...", r = n + o - a.length), {
    str: s + e.slice(t, r).replace(/\t/g, "→") + a,
    pos: n - t + s.length
    // relative position
  };
}
function cl(e, t) {
  return hs.repeat(" ", t - e.length) + e;
}
function SL(e, t) {
  if (t = Object.create(t || null), !e.buffer) return null;
  t.maxLength || (t.maxLength = 79), typeof t.indent != "number" && (t.indent = 1), typeof t.linesBefore != "number" && (t.linesBefore = 3), typeof t.linesAfter != "number" && (t.linesAfter = 2);
  for (var r = /\r?\n|\r|\0/g, n = [0], i = [], s, a = -1; s = r.exec(e.buffer); )
    i.push(s.index), n.push(s.index + s[0].length), e.position <= s.index && a < 0 && (a = n.length - 2);
  a < 0 && (a = n.length - 1);
  var o = "", c, u, l = Math.min(e.line + t.linesAfter, i.length).toString().length, d = t.maxLength - (t.indent + l + 3);
  for (c = 1; c <= t.linesBefore && !(a - c < 0); c++)
    u = ol(
      e.buffer,
      n[a - c],
      i[a - c],
      e.position - (n[a] - n[a - c]),
      d
    ), o = hs.repeat(" ", t.indent) + cl((e.line - c + 1).toString(), l) + " | " + u.str + `
` + o;
  for (u = ol(e.buffer, n[a], i[a], e.position, d), o += hs.repeat(" ", t.indent) + cl((e.line + 1).toString(), l) + " | " + u.str + `
`, o += hs.repeat("-", t.indent + l + 3 + u.pos) + `^
`, c = 1; c <= t.linesAfter && !(a + c >= i.length); c++)
    u = ol(
      e.buffer,
      n[a + c],
      i[a + c],
      e.position - (n[a] - n[a + c]),
      d
    ), o += hs.repeat(" ", t.indent) + cl((e.line + c + 1).toString(), l) + " | " + u.str + `
`;
  return o.replace(/\n$/, "");
}
var PL = SL, nm = sa, TL = [
  "kind",
  "multi",
  "resolve",
  "construct",
  "instanceOf",
  "predicate",
  "represent",
  "representName",
  "defaultStyle",
  "styleAliases"
], NL = [
  "scalar",
  "sequence",
  "mapping"
];
function OL(e) {
  var t = {};
  return e !== null && Object.keys(e).forEach(function(r) {
    e[r].forEach(function(n) {
      t[String(n)] = r;
    });
  }), t;
}
function AL(e, t) {
  if (t = t || {}, Object.keys(t).forEach(function(r) {
    if (TL.indexOf(r) === -1)
      throw new nm('Unknown option "' + r + '" is met in definition of "' + e + '" YAML type.');
  }), this.options = t, this.tag = e, this.kind = t.kind || null, this.resolve = t.resolve || function() {
    return !0;
  }, this.construct = t.construct || function(r) {
    return r;
  }, this.instanceOf = t.instanceOf || null, this.predicate = t.predicate || null, this.represent = t.represent || null, this.representName = t.representName || null, this.defaultStyle = t.defaultStyle || null, this.multi = t.multi || !1, this.styleAliases = OL(t.styleAliases || null), NL.indexOf(this.kind) === -1)
    throw new nm('Unknown kind "' + this.kind + '" is specified for "' + e + '" YAML type.');
}
var wt = AL, os = sa, ll = wt;
function im(e, t) {
  var r = [];
  return e[t].forEach(function(n) {
    var i = r.length;
    r.forEach(function(s, a) {
      s.tag === n.tag && s.kind === n.kind && s.multi === n.multi && (i = a);
    }), r[i] = n;
  }), r;
}
function CL() {
  var e = {
    scalar: {},
    sequence: {},
    mapping: {},
    fallback: {},
    multi: {
      scalar: [],
      sequence: [],
      mapping: [],
      fallback: []
    }
  }, t, r;
  function n(i) {
    i.multi ? (e.multi[i.kind].push(i), e.multi.fallback.push(i)) : e[i.kind][i.tag] = e.fallback[i.tag] = i;
  }
  for (t = 0, r = arguments.length; t < r; t += 1)
    arguments[t].forEach(n);
  return e;
}
function Zl(e) {
  return this.extend(e);
}
Zl.prototype.extend = function(t) {
  var r = [], n = [];
  if (t instanceof ll)
    n.push(t);
  else if (Array.isArray(t))
    n = n.concat(t);
  else if (t && (Array.isArray(t.implicit) || Array.isArray(t.explicit)))
    t.implicit && (r = r.concat(t.implicit)), t.explicit && (n = n.concat(t.explicit));
  else
    throw new os("Schema.extend argument should be a Type, [ Type ], or a schema definition ({ implicit: [...], explicit: [...] })");
  r.forEach(function(s) {
    if (!(s instanceof ll))
      throw new os("Specified list of YAML types (or a single Type object) contains a non-Type object.");
    if (s.loadKind && s.loadKind !== "scalar")
      throw new os("There is a non-scalar type in the implicit list of a schema. Implicit resolving of such types is not supported.");
    if (s.multi)
      throw new os("There is a multi type in the implicit list of a schema. Multi tags can only be listed as explicit.");
  }), n.forEach(function(s) {
    if (!(s instanceof ll))
      throw new os("Specified list of YAML types (or a single Type object) contains a non-Type object.");
  });
  var i = Object.create(Zl.prototype);
  return i.implicit = (this.implicit || []).concat(r), i.explicit = (this.explicit || []).concat(n), i.compiledImplicit = im(i, "implicit"), i.compiledExplicit = im(i, "explicit"), i.compiledTypeMap = CL(i.compiledImplicit, i.compiledExplicit), i;
};
var $_ = Zl, RL = wt, w_ = new RL("tag:yaml.org,2002:str", {
  kind: "scalar",
  construct: function(e) {
    return e !== null ? e : "";
  }
}), IL = wt, E_ = new IL("tag:yaml.org,2002:seq", {
  kind: "sequence",
  construct: function(e) {
    return e !== null ? e : [];
  }
}), DL = wt, b_ = new DL("tag:yaml.org,2002:map", {
  kind: "mapping",
  construct: function(e) {
    return e !== null ? e : {};
  }
}), kL = $_, S_ = new kL({
  explicit: [
    w_,
    E_,
    b_
  ]
}), FL = wt;
function jL(e) {
  if (e === null) return !0;
  var t = e.length;
  return t === 1 && e === "~" || t === 4 && (e === "null" || e === "Null" || e === "NULL");
}
function LL() {
  return null;
}
function UL(e) {
  return e === null;
}
var P_ = new FL("tag:yaml.org,2002:null", {
  kind: "scalar",
  resolve: jL,
  construct: LL,
  predicate: UL,
  represent: {
    canonical: function() {
      return "~";
    },
    lowercase: function() {
      return "null";
    },
    uppercase: function() {
      return "NULL";
    },
    camelcase: function() {
      return "Null";
    },
    empty: function() {
      return "";
    }
  },
  defaultStyle: "lowercase"
}), ML = wt;
function xL(e) {
  if (e === null) return !1;
  var t = e.length;
  return t === 4 && (e === "true" || e === "True" || e === "TRUE") || t === 5 && (e === "false" || e === "False" || e === "FALSE");
}
function VL(e) {
  return e === "true" || e === "True" || e === "TRUE";
}
function qL(e) {
  return Object.prototype.toString.call(e) === "[object Boolean]";
}
var T_ = new ML("tag:yaml.org,2002:bool", {
  kind: "scalar",
  resolve: xL,
  construct: VL,
  predicate: qL,
  represent: {
    lowercase: function(e) {
      return e ? "true" : "false";
    },
    uppercase: function(e) {
      return e ? "TRUE" : "FALSE";
    },
    camelcase: function(e) {
      return e ? "True" : "False";
    }
  },
  defaultStyle: "lowercase"
}), BL = sr, HL = wt;
function GL(e) {
  return 48 <= e && e <= 57 || 65 <= e && e <= 70 || 97 <= e && e <= 102;
}
function zL(e) {
  return 48 <= e && e <= 55;
}
function KL(e) {
  return 48 <= e && e <= 57;
}
function WL(e) {
  if (e === null) return !1;
  var t = e.length, r = 0, n = !1, i;
  if (!t) return !1;
  if (i = e[r], (i === "-" || i === "+") && (i = e[++r]), i === "0") {
    if (r + 1 === t) return !0;
    if (i = e[++r], i === "b") {
      for (r++; r < t; r++)
        if (i = e[r], i !== "_") {
          if (i !== "0" && i !== "1") return !1;
          n = !0;
        }
      return n && i !== "_";
    }
    if (i === "x") {
      for (r++; r < t; r++)
        if (i = e[r], i !== "_") {
          if (!GL(e.charCodeAt(r))) return !1;
          n = !0;
        }
      return n && i !== "_";
    }
    if (i === "o") {
      for (r++; r < t; r++)
        if (i = e[r], i !== "_") {
          if (!zL(e.charCodeAt(r))) return !1;
          n = !0;
        }
      return n && i !== "_";
    }
  }
  if (i === "_") return !1;
  for (; r < t; r++)
    if (i = e[r], i !== "_") {
      if (!KL(e.charCodeAt(r)))
        return !1;
      n = !0;
    }
  return !(!n || i === "_");
}
function YL(e) {
  var t = e, r = 1, n;
  if (t.indexOf("_") !== -1 && (t = t.replace(/_/g, "")), n = t[0], (n === "-" || n === "+") && (n === "-" && (r = -1), t = t.slice(1), n = t[0]), t === "0") return 0;
  if (n === "0") {
    if (t[1] === "b") return r * parseInt(t.slice(2), 2);
    if (t[1] === "x") return r * parseInt(t.slice(2), 16);
    if (t[1] === "o") return r * parseInt(t.slice(2), 8);
  }
  return r * parseInt(t, 10);
}
function XL(e) {
  return Object.prototype.toString.call(e) === "[object Number]" && e % 1 === 0 && !BL.isNegativeZero(e);
}
var N_ = new HL("tag:yaml.org,2002:int", {
  kind: "scalar",
  resolve: WL,
  construct: YL,
  predicate: XL,
  represent: {
    binary: function(e) {
      return e >= 0 ? "0b" + e.toString(2) : "-0b" + e.toString(2).slice(1);
    },
    octal: function(e) {
      return e >= 0 ? "0o" + e.toString(8) : "-0o" + e.toString(8).slice(1);
    },
    decimal: function(e) {
      return e.toString(10);
    },
    /* eslint-disable max-len */
    hexadecimal: function(e) {
      return e >= 0 ? "0x" + e.toString(16).toUpperCase() : "-0x" + e.toString(16).toUpperCase().slice(1);
    }
  },
  defaultStyle: "decimal",
  styleAliases: {
    binary: [2, "bin"],
    octal: [8, "oct"],
    decimal: [10, "dec"],
    hexadecimal: [16, "hex"]
  }
}), O_ = sr, JL = wt, QL = new RegExp(
  // 2.5e4, 2.5 and integers
  "^(?:[-+]?(?:[0-9][0-9_]*)(?:\\.[0-9_]*)?(?:[eE][-+]?[0-9]+)?|\\.[0-9_]+(?:[eE][-+]?[0-9]+)?|[-+]?\\.(?:inf|Inf|INF)|\\.(?:nan|NaN|NAN))$"
);
function ZL(e) {
  return !(e === null || !QL.test(e) || // Quick hack to not allow integers end with `_`
  // Probably should update regexp & check speed
  e[e.length - 1] === "_");
}
function eU(e) {
  var t, r;
  return t = e.replace(/_/g, "").toLowerCase(), r = t[0] === "-" ? -1 : 1, "+-".indexOf(t[0]) >= 0 && (t = t.slice(1)), t === ".inf" ? r === 1 ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY : t === ".nan" ? NaN : r * parseFloat(t, 10);
}
var tU = /^[-+]?[0-9]+e/;
function rU(e, t) {
  var r;
  if (isNaN(e))
    switch (t) {
      case "lowercase":
        return ".nan";
      case "uppercase":
        return ".NAN";
      case "camelcase":
        return ".NaN";
    }
  else if (Number.POSITIVE_INFINITY === e)
    switch (t) {
      case "lowercase":
        return ".inf";
      case "uppercase":
        return ".INF";
      case "camelcase":
        return ".Inf";
    }
  else if (Number.NEGATIVE_INFINITY === e)
    switch (t) {
      case "lowercase":
        return "-.inf";
      case "uppercase":
        return "-.INF";
      case "camelcase":
        return "-.Inf";
    }
  else if (O_.isNegativeZero(e))
    return "-0.0";
  return r = e.toString(10), tU.test(r) ? r.replace("e", ".e") : r;
}
function nU(e) {
  return Object.prototype.toString.call(e) === "[object Number]" && (e % 1 !== 0 || O_.isNegativeZero(e));
}
var A_ = new JL("tag:yaml.org,2002:float", {
  kind: "scalar",
  resolve: ZL,
  construct: eU,
  predicate: nU,
  represent: rU,
  defaultStyle: "lowercase"
}), C_ = S_.extend({
  implicit: [
    P_,
    T_,
    N_,
    A_
  ]
}), R_ = C_, iU = wt, I_ = new RegExp(
  "^([0-9][0-9][0-9][0-9])-([0-9][0-9])-([0-9][0-9])$"
), D_ = new RegExp(
  "^([0-9][0-9][0-9][0-9])-([0-9][0-9]?)-([0-9][0-9]?)(?:[Tt]|[ \\t]+)([0-9][0-9]?):([0-9][0-9]):([0-9][0-9])(?:\\.([0-9]*))?(?:[ \\t]*(Z|([-+])([0-9][0-9]?)(?::([0-9][0-9]))?))?$"
);
function sU(e) {
  return e === null ? !1 : I_.exec(e) !== null || D_.exec(e) !== null;
}
function aU(e) {
  var t, r, n, i, s, a, o, c = 0, u = null, l, d, h;
  if (t = I_.exec(e), t === null && (t = D_.exec(e)), t === null) throw new Error("Date resolve error");
  if (r = +t[1], n = +t[2] - 1, i = +t[3], !t[4])
    return new Date(Date.UTC(r, n, i));
  if (s = +t[4], a = +t[5], o = +t[6], t[7]) {
    for (c = t[7].slice(0, 3); c.length < 3; )
      c += "0";
    c = +c;
  }
  return t[9] && (l = +t[10], d = +(t[11] || 0), u = (l * 60 + d) * 6e4, t[9] === "-" && (u = -u)), h = new Date(Date.UTC(r, n, i, s, a, o, c)), u && h.setTime(h.getTime() - u), h;
}
function oU(e) {
  return e.toISOString();
}
var k_ = new iU("tag:yaml.org,2002:timestamp", {
  kind: "scalar",
  resolve: sU,
  construct: aU,
  instanceOf: Date,
  represent: oU
}), cU = wt;
function lU(e) {
  return e === "<<" || e === null;
}
var F_ = new cU("tag:yaml.org,2002:merge", {
  kind: "scalar",
  resolve: lU
}), uU = wt, bf = `ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=
\r`;
function dU(e) {
  if (e === null) return !1;
  var t, r, n = 0, i = e.length, s = bf;
  for (r = 0; r < i; r++)
    if (t = s.indexOf(e.charAt(r)), !(t > 64)) {
      if (t < 0) return !1;
      n += 6;
    }
  return n % 8 === 0;
}
function fU(e) {
  var t, r, n = e.replace(/[\r\n=]/g, ""), i = n.length, s = bf, a = 0, o = [];
  for (t = 0; t < i; t++)
    t % 4 === 0 && t && (o.push(a >> 16 & 255), o.push(a >> 8 & 255), o.push(a & 255)), a = a << 6 | s.indexOf(n.charAt(t));
  return r = i % 4 * 6, r === 0 ? (o.push(a >> 16 & 255), o.push(a >> 8 & 255), o.push(a & 255)) : r === 18 ? (o.push(a >> 10 & 255), o.push(a >> 2 & 255)) : r === 12 && o.push(a >> 4 & 255), new Uint8Array(o);
}
function hU(e) {
  var t = "", r = 0, n, i, s = e.length, a = bf;
  for (n = 0; n < s; n++)
    n % 3 === 0 && n && (t += a[r >> 18 & 63], t += a[r >> 12 & 63], t += a[r >> 6 & 63], t += a[r & 63]), r = (r << 8) + e[n];
  return i = s % 3, i === 0 ? (t += a[r >> 18 & 63], t += a[r >> 12 & 63], t += a[r >> 6 & 63], t += a[r & 63]) : i === 2 ? (t += a[r >> 10 & 63], t += a[r >> 4 & 63], t += a[r << 2 & 63], t += a[64]) : i === 1 && (t += a[r >> 2 & 63], t += a[r << 4 & 63], t += a[64], t += a[64]), t;
}
function pU(e) {
  return Object.prototype.toString.call(e) === "[object Uint8Array]";
}
var j_ = new uU("tag:yaml.org,2002:binary", {
  kind: "scalar",
  resolve: dU,
  construct: fU,
  predicate: pU,
  represent: hU
}), mU = wt, yU = Object.prototype.hasOwnProperty, gU = Object.prototype.toString;
function _U(e) {
  if (e === null) return !0;
  var t = [], r, n, i, s, a, o = e;
  for (r = 0, n = o.length; r < n; r += 1) {
    if (i = o[r], a = !1, gU.call(i) !== "[object Object]") return !1;
    for (s in i)
      if (yU.call(i, s))
        if (!a) a = !0;
        else return !1;
    if (!a) return !1;
    if (t.indexOf(s) === -1) t.push(s);
    else return !1;
  }
  return !0;
}
function vU(e) {
  return e !== null ? e : [];
}
var L_ = new mU("tag:yaml.org,2002:omap", {
  kind: "sequence",
  resolve: _U,
  construct: vU
}), $U = wt, wU = Object.prototype.toString;
function EU(e) {
  if (e === null) return !0;
  var t, r, n, i, s, a = e;
  for (s = new Array(a.length), t = 0, r = a.length; t < r; t += 1) {
    if (n = a[t], wU.call(n) !== "[object Object]" || (i = Object.keys(n), i.length !== 1)) return !1;
    s[t] = [i[0], n[i[0]]];
  }
  return !0;
}
function bU(e) {
  if (e === null) return [];
  var t, r, n, i, s, a = e;
  for (s = new Array(a.length), t = 0, r = a.length; t < r; t += 1)
    n = a[t], i = Object.keys(n), s[t] = [i[0], n[i[0]]];
  return s;
}
var U_ = new $U("tag:yaml.org,2002:pairs", {
  kind: "sequence",
  resolve: EU,
  construct: bU
}), SU = wt, PU = Object.prototype.hasOwnProperty;
function TU(e) {
  if (e === null) return !0;
  var t, r = e;
  for (t in r)
    if (PU.call(r, t) && r[t] !== null)
      return !1;
  return !0;
}
function NU(e) {
  return e !== null ? e : {};
}
var M_ = new SU("tag:yaml.org,2002:set", {
  kind: "mapping",
  resolve: TU,
  construct: NU
}), Sf = R_.extend({
  implicit: [
    k_,
    F_
  ],
  explicit: [
    j_,
    L_,
    U_,
    M_
  ]
}), Ln = sr, x_ = sa, OU = PL, AU = Sf, fn = Object.prototype.hasOwnProperty, Co = 1, V_ = 2, q_ = 3, Ro = 4, ul = 1, CU = 2, sm = 3, RU = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x84\x86-\x9F\uFFFE\uFFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF]/, IU = /[\x85\u2028\u2029]/, DU = /[,\[\]\{\}]/, B_ = /^(?:!|!!|![a-z\-]+!)$/i, H_ = /^(?:!|[^,\[\]\{\}])(?:%[0-9a-f]{2}|[0-9a-z\-#;\/\?:@&=\+\$,_\.!~\*'\(\)\[\]])*$/i;
function am(e) {
  return Object.prototype.toString.call(e);
}
function mr(e) {
  return e === 10 || e === 13;
}
function qn(e) {
  return e === 9 || e === 32;
}
function Ot(e) {
  return e === 9 || e === 32 || e === 10 || e === 13;
}
function _i(e) {
  return e === 44 || e === 91 || e === 93 || e === 123 || e === 125;
}
function kU(e) {
  var t;
  return 48 <= e && e <= 57 ? e - 48 : (t = e | 32, 97 <= t && t <= 102 ? t - 97 + 10 : -1);
}
function FU(e) {
  return e === 120 ? 2 : e === 117 ? 4 : e === 85 ? 8 : 0;
}
function jU(e) {
  return 48 <= e && e <= 57 ? e - 48 : -1;
}
function om(e) {
  return e === 48 ? "\0" : e === 97 ? "\x07" : e === 98 ? "\b" : e === 116 || e === 9 ? "	" : e === 110 ? `
` : e === 118 ? "\v" : e === 102 ? "\f" : e === 114 ? "\r" : e === 101 ? "\x1B" : e === 32 ? " " : e === 34 ? '"' : e === 47 ? "/" : e === 92 ? "\\" : e === 78 ? "" : e === 95 ? " " : e === 76 ? "\u2028" : e === 80 ? "\u2029" : "";
}
function LU(e) {
  return e <= 65535 ? String.fromCharCode(e) : String.fromCharCode(
    (e - 65536 >> 10) + 55296,
    (e - 65536 & 1023) + 56320
  );
}
function G_(e, t, r) {
  t === "__proto__" ? Object.defineProperty(e, t, {
    configurable: !0,
    enumerable: !0,
    writable: !0,
    value: r
  }) : e[t] = r;
}
var z_ = new Array(256), K_ = new Array(256);
for (var ai = 0; ai < 256; ai++)
  z_[ai] = om(ai) ? 1 : 0, K_[ai] = om(ai);
function UU(e, t) {
  this.input = e, this.filename = t.filename || null, this.schema = t.schema || AU, this.onWarning = t.onWarning || null, this.legacy = t.legacy || !1, this.json = t.json || !1, this.listener = t.listener || null, this.implicitTypes = this.schema.compiledImplicit, this.typeMap = this.schema.compiledTypeMap, this.length = e.length, this.position = 0, this.line = 0, this.lineStart = 0, this.lineIndent = 0, this.firstTabInLine = -1, this.documents = [];
}
function W_(e, t) {
  var r = {
    name: e.filename,
    buffer: e.input.slice(0, -1),
    // omit trailing \0
    position: e.position,
    line: e.line,
    column: e.position - e.lineStart
  };
  return r.snippet = OU(r), new x_(t, r);
}
function te(e, t) {
  throw W_(e, t);
}
function Io(e, t) {
  e.onWarning && e.onWarning.call(null, W_(e, t));
}
var cm = {
  YAML: function(t, r, n) {
    var i, s, a;
    t.version !== null && te(t, "duplication of %YAML directive"), n.length !== 1 && te(t, "YAML directive accepts exactly one argument"), i = /^([0-9]+)\.([0-9]+)$/.exec(n[0]), i === null && te(t, "ill-formed argument of the YAML directive"), s = parseInt(i[1], 10), a = parseInt(i[2], 10), s !== 1 && te(t, "unacceptable YAML version of the document"), t.version = n[0], t.checkLineBreaks = a < 2, a !== 1 && a !== 2 && Io(t, "unsupported YAML version of the document");
  },
  TAG: function(t, r, n) {
    var i, s;
    n.length !== 2 && te(t, "TAG directive accepts exactly two arguments"), i = n[0], s = n[1], B_.test(i) || te(t, "ill-formed tag handle (first argument) of the TAG directive"), fn.call(t.tagMap, i) && te(t, 'there is a previously declared suffix for "' + i + '" tag handle'), H_.test(s) || te(t, "ill-formed tag prefix (second argument) of the TAG directive");
    try {
      s = decodeURIComponent(s);
    } catch {
      te(t, "tag prefix is malformed: " + s);
    }
    t.tagMap[i] = s;
  }
};
function ln(e, t, r, n) {
  var i, s, a, o;
  if (t < r) {
    if (o = e.input.slice(t, r), n)
      for (i = 0, s = o.length; i < s; i += 1)
        a = o.charCodeAt(i), a === 9 || 32 <= a && a <= 1114111 || te(e, "expected valid JSON character");
    else RU.test(o) && te(e, "the stream contains non-printable characters");
    e.result += o;
  }
}
function lm(e, t, r, n) {
  var i, s, a, o;
  for (Ln.isObject(r) || te(e, "cannot merge mappings; the provided source object is unacceptable"), i = Object.keys(r), a = 0, o = i.length; a < o; a += 1)
    s = i[a], fn.call(t, s) || (G_(t, s, r[s]), n[s] = !0);
}
function vi(e, t, r, n, i, s, a, o, c) {
  var u, l;
  if (Array.isArray(i))
    for (i = Array.prototype.slice.call(i), u = 0, l = i.length; u < l; u += 1)
      Array.isArray(i[u]) && te(e, "nested arrays are not supported inside keys"), typeof i == "object" && am(i[u]) === "[object Object]" && (i[u] = "[object Object]");
  if (typeof i == "object" && am(i) === "[object Object]" && (i = "[object Object]"), i = String(i), t === null && (t = {}), n === "tag:yaml.org,2002:merge")
    if (Array.isArray(s))
      for (u = 0, l = s.length; u < l; u += 1)
        lm(e, t, s[u], r);
    else
      lm(e, t, s, r);
  else
    !e.json && !fn.call(r, i) && fn.call(t, i) && (e.line = a || e.line, e.lineStart = o || e.lineStart, e.position = c || e.position, te(e, "duplicated mapping key")), G_(t, i, s), delete r[i];
  return t;
}
function Pf(e) {
  var t;
  t = e.input.charCodeAt(e.position), t === 10 ? e.position++ : t === 13 ? (e.position++, e.input.charCodeAt(e.position) === 10 && e.position++) : te(e, "a line break is expected"), e.line += 1, e.lineStart = e.position, e.firstTabInLine = -1;
}
function Fe(e, t, r) {
  for (var n = 0, i = e.input.charCodeAt(e.position); i !== 0; ) {
    for (; qn(i); )
      i === 9 && e.firstTabInLine === -1 && (e.firstTabInLine = e.position), i = e.input.charCodeAt(++e.position);
    if (t && i === 35)
      do
        i = e.input.charCodeAt(++e.position);
      while (i !== 10 && i !== 13 && i !== 0);
    if (mr(i))
      for (Pf(e), i = e.input.charCodeAt(e.position), n++, e.lineIndent = 0; i === 32; )
        e.lineIndent++, i = e.input.charCodeAt(++e.position);
    else
      break;
  }
  return r !== -1 && n !== 0 && e.lineIndent < r && Io(e, "deficient indentation"), n;
}
function uc(e) {
  var t = e.position, r;
  return r = e.input.charCodeAt(t), !!((r === 45 || r === 46) && r === e.input.charCodeAt(t + 1) && r === e.input.charCodeAt(t + 2) && (t += 3, r = e.input.charCodeAt(t), r === 0 || Ot(r)));
}
function Tf(e, t) {
  t === 1 ? e.result += " " : t > 1 && (e.result += Ln.repeat(`
`, t - 1));
}
function MU(e, t, r) {
  var n, i, s, a, o, c, u, l, d = e.kind, h = e.result, p;
  if (p = e.input.charCodeAt(e.position), Ot(p) || _i(p) || p === 35 || p === 38 || p === 42 || p === 33 || p === 124 || p === 62 || p === 39 || p === 34 || p === 37 || p === 64 || p === 96 || (p === 63 || p === 45) && (i = e.input.charCodeAt(e.position + 1), Ot(i) || r && _i(i)))
    return !1;
  for (e.kind = "scalar", e.result = "", s = a = e.position, o = !1; p !== 0; ) {
    if (p === 58) {
      if (i = e.input.charCodeAt(e.position + 1), Ot(i) || r && _i(i))
        break;
    } else if (p === 35) {
      if (n = e.input.charCodeAt(e.position - 1), Ot(n))
        break;
    } else {
      if (e.position === e.lineStart && uc(e) || r && _i(p))
        break;
      if (mr(p))
        if (c = e.line, u = e.lineStart, l = e.lineIndent, Fe(e, !1, -1), e.lineIndent >= t) {
          o = !0, p = e.input.charCodeAt(e.position);
          continue;
        } else {
          e.position = a, e.line = c, e.lineStart = u, e.lineIndent = l;
          break;
        }
    }
    o && (ln(e, s, a, !1), Tf(e, e.line - c), s = a = e.position, o = !1), qn(p) || (a = e.position + 1), p = e.input.charCodeAt(++e.position);
  }
  return ln(e, s, a, !1), e.result ? !0 : (e.kind = d, e.result = h, !1);
}
function xU(e, t) {
  var r, n, i;
  if (r = e.input.charCodeAt(e.position), r !== 39)
    return !1;
  for (e.kind = "scalar", e.result = "", e.position++, n = i = e.position; (r = e.input.charCodeAt(e.position)) !== 0; )
    if (r === 39)
      if (ln(e, n, e.position, !0), r = e.input.charCodeAt(++e.position), r === 39)
        n = e.position, e.position++, i = e.position;
      else
        return !0;
    else mr(r) ? (ln(e, n, i, !0), Tf(e, Fe(e, !1, t)), n = i = e.position) : e.position === e.lineStart && uc(e) ? te(e, "unexpected end of the document within a single quoted scalar") : (e.position++, i = e.position);
  te(e, "unexpected end of the stream within a single quoted scalar");
}
function VU(e, t) {
  var r, n, i, s, a, o;
  if (o = e.input.charCodeAt(e.position), o !== 34)
    return !1;
  for (e.kind = "scalar", e.result = "", e.position++, r = n = e.position; (o = e.input.charCodeAt(e.position)) !== 0; ) {
    if (o === 34)
      return ln(e, r, e.position, !0), e.position++, !0;
    if (o === 92) {
      if (ln(e, r, e.position, !0), o = e.input.charCodeAt(++e.position), mr(o))
        Fe(e, !1, t);
      else if (o < 256 && z_[o])
        e.result += K_[o], e.position++;
      else if ((a = FU(o)) > 0) {
        for (i = a, s = 0; i > 0; i--)
          o = e.input.charCodeAt(++e.position), (a = kU(o)) >= 0 ? s = (s << 4) + a : te(e, "expected hexadecimal character");
        e.result += LU(s), e.position++;
      } else
        te(e, "unknown escape sequence");
      r = n = e.position;
    } else mr(o) ? (ln(e, r, n, !0), Tf(e, Fe(e, !1, t)), r = n = e.position) : e.position === e.lineStart && uc(e) ? te(e, "unexpected end of the document within a double quoted scalar") : (e.position++, n = e.position);
  }
  te(e, "unexpected end of the stream within a double quoted scalar");
}
function qU(e, t) {
  var r = !0, n, i, s, a = e.tag, o, c = e.anchor, u, l, d, h, p, $ = /* @__PURE__ */ Object.create(null), _, v, m, E;
  if (E = e.input.charCodeAt(e.position), E === 91)
    l = 93, p = !1, o = [];
  else if (E === 123)
    l = 125, p = !0, o = {};
  else
    return !1;
  for (e.anchor !== null && (e.anchorMap[e.anchor] = o), E = e.input.charCodeAt(++e.position); E !== 0; ) {
    if (Fe(e, !0, t), E = e.input.charCodeAt(e.position), E === l)
      return e.position++, e.tag = a, e.anchor = c, e.kind = p ? "mapping" : "sequence", e.result = o, !0;
    r ? E === 44 && te(e, "expected the node content, but found ','") : te(e, "missed comma between flow collection entries"), v = _ = m = null, d = h = !1, E === 63 && (u = e.input.charCodeAt(e.position + 1), Ot(u) && (d = h = !0, e.position++, Fe(e, !0, t))), n = e.line, i = e.lineStart, s = e.position, Li(e, t, Co, !1, !0), v = e.tag, _ = e.result, Fe(e, !0, t), E = e.input.charCodeAt(e.position), (h || e.line === n) && E === 58 && (d = !0, E = e.input.charCodeAt(++e.position), Fe(e, !0, t), Li(e, t, Co, !1, !0), m = e.result), p ? vi(e, o, $, v, _, m, n, i, s) : d ? o.push(vi(e, null, $, v, _, m, n, i, s)) : o.push(_), Fe(e, !0, t), E = e.input.charCodeAt(e.position), E === 44 ? (r = !0, E = e.input.charCodeAt(++e.position)) : r = !1;
  }
  te(e, "unexpected end of the stream within a flow collection");
}
function BU(e, t) {
  var r, n, i = ul, s = !1, a = !1, o = t, c = 0, u = !1, l, d;
  if (d = e.input.charCodeAt(e.position), d === 124)
    n = !1;
  else if (d === 62)
    n = !0;
  else
    return !1;
  for (e.kind = "scalar", e.result = ""; d !== 0; )
    if (d = e.input.charCodeAt(++e.position), d === 43 || d === 45)
      ul === i ? i = d === 43 ? sm : CU : te(e, "repeat of a chomping mode identifier");
    else if ((l = jU(d)) >= 0)
      l === 0 ? te(e, "bad explicit indentation width of a block scalar; it cannot be less than one") : a ? te(e, "repeat of an indentation width identifier") : (o = t + l - 1, a = !0);
    else
      break;
  if (qn(d)) {
    do
      d = e.input.charCodeAt(++e.position);
    while (qn(d));
    if (d === 35)
      do
        d = e.input.charCodeAt(++e.position);
      while (!mr(d) && d !== 0);
  }
  for (; d !== 0; ) {
    for (Pf(e), e.lineIndent = 0, d = e.input.charCodeAt(e.position); (!a || e.lineIndent < o) && d === 32; )
      e.lineIndent++, d = e.input.charCodeAt(++e.position);
    if (!a && e.lineIndent > o && (o = e.lineIndent), mr(d)) {
      c++;
      continue;
    }
    if (e.lineIndent < o) {
      i === sm ? e.result += Ln.repeat(`
`, s ? 1 + c : c) : i === ul && s && (e.result += `
`);
      break;
    }
    for (n ? qn(d) ? (u = !0, e.result += Ln.repeat(`
`, s ? 1 + c : c)) : u ? (u = !1, e.result += Ln.repeat(`
`, c + 1)) : c === 0 ? s && (e.result += " ") : e.result += Ln.repeat(`
`, c) : e.result += Ln.repeat(`
`, s ? 1 + c : c), s = !0, a = !0, c = 0, r = e.position; !mr(d) && d !== 0; )
      d = e.input.charCodeAt(++e.position);
    ln(e, r, e.position, !1);
  }
  return !0;
}
function um(e, t) {
  var r, n = e.tag, i = e.anchor, s = [], a, o = !1, c;
  if (e.firstTabInLine !== -1) return !1;
  for (e.anchor !== null && (e.anchorMap[e.anchor] = s), c = e.input.charCodeAt(e.position); c !== 0 && (e.firstTabInLine !== -1 && (e.position = e.firstTabInLine, te(e, "tab characters must not be used in indentation")), !(c !== 45 || (a = e.input.charCodeAt(e.position + 1), !Ot(a)))); ) {
    if (o = !0, e.position++, Fe(e, !0, -1) && e.lineIndent <= t) {
      s.push(null), c = e.input.charCodeAt(e.position);
      continue;
    }
    if (r = e.line, Li(e, t, q_, !1, !0), s.push(e.result), Fe(e, !0, -1), c = e.input.charCodeAt(e.position), (e.line === r || e.lineIndent > t) && c !== 0)
      te(e, "bad indentation of a sequence entry");
    else if (e.lineIndent < t)
      break;
  }
  return o ? (e.tag = n, e.anchor = i, e.kind = "sequence", e.result = s, !0) : !1;
}
function HU(e, t, r) {
  var n, i, s, a, o, c, u = e.tag, l = e.anchor, d = {}, h = /* @__PURE__ */ Object.create(null), p = null, $ = null, _ = null, v = !1, m = !1, E;
  if (e.firstTabInLine !== -1) return !1;
  for (e.anchor !== null && (e.anchorMap[e.anchor] = d), E = e.input.charCodeAt(e.position); E !== 0; ) {
    if (!v && e.firstTabInLine !== -1 && (e.position = e.firstTabInLine, te(e, "tab characters must not be used in indentation")), n = e.input.charCodeAt(e.position + 1), s = e.line, (E === 63 || E === 58) && Ot(n))
      E === 63 ? (v && (vi(e, d, h, p, $, null, a, o, c), p = $ = _ = null), m = !0, v = !0, i = !0) : v ? (v = !1, i = !0) : te(e, "incomplete explicit mapping pair; a key node is missed; or followed by a non-tabulated empty line"), e.position += 1, E = n;
    else {
      if (a = e.line, o = e.lineStart, c = e.position, !Li(e, r, V_, !1, !0))
        break;
      if (e.line === s) {
        for (E = e.input.charCodeAt(e.position); qn(E); )
          E = e.input.charCodeAt(++e.position);
        if (E === 58)
          E = e.input.charCodeAt(++e.position), Ot(E) || te(e, "a whitespace character is expected after the key-value separator within a block mapping"), v && (vi(e, d, h, p, $, null, a, o, c), p = $ = _ = null), m = !0, v = !1, i = !1, p = e.tag, $ = e.result;
        else if (m)
          te(e, "can not read an implicit mapping pair; a colon is missed");
        else
          return e.tag = u, e.anchor = l, !0;
      } else if (m)
        te(e, "can not read a block mapping entry; a multiline key may not be an implicit key");
      else
        return e.tag = u, e.anchor = l, !0;
    }
    if ((e.line === s || e.lineIndent > t) && (v && (a = e.line, o = e.lineStart, c = e.position), Li(e, t, Ro, !0, i) && (v ? $ = e.result : _ = e.result), v || (vi(e, d, h, p, $, _, a, o, c), p = $ = _ = null), Fe(e, !0, -1), E = e.input.charCodeAt(e.position)), (e.line === s || e.lineIndent > t) && E !== 0)
      te(e, "bad indentation of a mapping entry");
    else if (e.lineIndent < t)
      break;
  }
  return v && vi(e, d, h, p, $, null, a, o, c), m && (e.tag = u, e.anchor = l, e.kind = "mapping", e.result = d), m;
}
function GU(e) {
  var t, r = !1, n = !1, i, s, a;
  if (a = e.input.charCodeAt(e.position), a !== 33) return !1;
  if (e.tag !== null && te(e, "duplication of a tag property"), a = e.input.charCodeAt(++e.position), a === 60 ? (r = !0, a = e.input.charCodeAt(++e.position)) : a === 33 ? (n = !0, i = "!!", a = e.input.charCodeAt(++e.position)) : i = "!", t = e.position, r) {
    do
      a = e.input.charCodeAt(++e.position);
    while (a !== 0 && a !== 62);
    e.position < e.length ? (s = e.input.slice(t, e.position), a = e.input.charCodeAt(++e.position)) : te(e, "unexpected end of the stream within a verbatim tag");
  } else {
    for (; a !== 0 && !Ot(a); )
      a === 33 && (n ? te(e, "tag suffix cannot contain exclamation marks") : (i = e.input.slice(t - 1, e.position + 1), B_.test(i) || te(e, "named tag handle cannot contain such characters"), n = !0, t = e.position + 1)), a = e.input.charCodeAt(++e.position);
    s = e.input.slice(t, e.position), DU.test(s) && te(e, "tag suffix cannot contain flow indicator characters");
  }
  s && !H_.test(s) && te(e, "tag name cannot contain such characters: " + s);
  try {
    s = decodeURIComponent(s);
  } catch {
    te(e, "tag name is malformed: " + s);
  }
  return r ? e.tag = s : fn.call(e.tagMap, i) ? e.tag = e.tagMap[i] + s : i === "!" ? e.tag = "!" + s : i === "!!" ? e.tag = "tag:yaml.org,2002:" + s : te(e, 'undeclared tag handle "' + i + '"'), !0;
}
function zU(e) {
  var t, r;
  if (r = e.input.charCodeAt(e.position), r !== 38) return !1;
  for (e.anchor !== null && te(e, "duplication of an anchor property"), r = e.input.charCodeAt(++e.position), t = e.position; r !== 0 && !Ot(r) && !_i(r); )
    r = e.input.charCodeAt(++e.position);
  return e.position === t && te(e, "name of an anchor node must contain at least one character"), e.anchor = e.input.slice(t, e.position), !0;
}
function KU(e) {
  var t, r, n;
  if (n = e.input.charCodeAt(e.position), n !== 42) return !1;
  for (n = e.input.charCodeAt(++e.position), t = e.position; n !== 0 && !Ot(n) && !_i(n); )
    n = e.input.charCodeAt(++e.position);
  return e.position === t && te(e, "name of an alias node must contain at least one character"), r = e.input.slice(t, e.position), fn.call(e.anchorMap, r) || te(e, 'unidentified alias "' + r + '"'), e.result = e.anchorMap[r], Fe(e, !0, -1), !0;
}
function Li(e, t, r, n, i) {
  var s, a, o, c = 1, u = !1, l = !1, d, h, p, $, _, v;
  if (e.listener !== null && e.listener("open", e), e.tag = null, e.anchor = null, e.kind = null, e.result = null, s = a = o = Ro === r || q_ === r, n && Fe(e, !0, -1) && (u = !0, e.lineIndent > t ? c = 1 : e.lineIndent === t ? c = 0 : e.lineIndent < t && (c = -1)), c === 1)
    for (; GU(e) || zU(e); )
      Fe(e, !0, -1) ? (u = !0, o = s, e.lineIndent > t ? c = 1 : e.lineIndent === t ? c = 0 : e.lineIndent < t && (c = -1)) : o = !1;
  if (o && (o = u || i), (c === 1 || Ro === r) && (Co === r || V_ === r ? _ = t : _ = t + 1, v = e.position - e.lineStart, c === 1 ? o && (um(e, v) || HU(e, v, _)) || qU(e, _) ? l = !0 : (a && BU(e, _) || xU(e, _) || VU(e, _) ? l = !0 : KU(e) ? (l = !0, (e.tag !== null || e.anchor !== null) && te(e, "alias node should not have any properties")) : MU(e, _, Co === r) && (l = !0, e.tag === null && (e.tag = "?")), e.anchor !== null && (e.anchorMap[e.anchor] = e.result)) : c === 0 && (l = o && um(e, v))), e.tag === null)
    e.anchor !== null && (e.anchorMap[e.anchor] = e.result);
  else if (e.tag === "?") {
    for (e.result !== null && e.kind !== "scalar" && te(e, 'unacceptable node kind for !<?> tag; it should be "scalar", not "' + e.kind + '"'), d = 0, h = e.implicitTypes.length; d < h; d += 1)
      if ($ = e.implicitTypes[d], $.resolve(e.result)) {
        e.result = $.construct(e.result), e.tag = $.tag, e.anchor !== null && (e.anchorMap[e.anchor] = e.result);
        break;
      }
  } else if (e.tag !== "!") {
    if (fn.call(e.typeMap[e.kind || "fallback"], e.tag))
      $ = e.typeMap[e.kind || "fallback"][e.tag];
    else
      for ($ = null, p = e.typeMap.multi[e.kind || "fallback"], d = 0, h = p.length; d < h; d += 1)
        if (e.tag.slice(0, p[d].tag.length) === p[d].tag) {
          $ = p[d];
          break;
        }
    $ || te(e, "unknown tag !<" + e.tag + ">"), e.result !== null && $.kind !== e.kind && te(e, "unacceptable node kind for !<" + e.tag + '> tag; it should be "' + $.kind + '", not "' + e.kind + '"'), $.resolve(e.result, e.tag) ? (e.result = $.construct(e.result, e.tag), e.anchor !== null && (e.anchorMap[e.anchor] = e.result)) : te(e, "cannot resolve a node with !<" + e.tag + "> explicit tag");
  }
  return e.listener !== null && e.listener("close", e), e.tag !== null || e.anchor !== null || l;
}
function WU(e) {
  var t = e.position, r, n, i, s = !1, a;
  for (e.version = null, e.checkLineBreaks = e.legacy, e.tagMap = /* @__PURE__ */ Object.create(null), e.anchorMap = /* @__PURE__ */ Object.create(null); (a = e.input.charCodeAt(e.position)) !== 0 && (Fe(e, !0, -1), a = e.input.charCodeAt(e.position), !(e.lineIndent > 0 || a !== 37)); ) {
    for (s = !0, a = e.input.charCodeAt(++e.position), r = e.position; a !== 0 && !Ot(a); )
      a = e.input.charCodeAt(++e.position);
    for (n = e.input.slice(r, e.position), i = [], n.length < 1 && te(e, "directive name must not be less than one character in length"); a !== 0; ) {
      for (; qn(a); )
        a = e.input.charCodeAt(++e.position);
      if (a === 35) {
        do
          a = e.input.charCodeAt(++e.position);
        while (a !== 0 && !mr(a));
        break;
      }
      if (mr(a)) break;
      for (r = e.position; a !== 0 && !Ot(a); )
        a = e.input.charCodeAt(++e.position);
      i.push(e.input.slice(r, e.position));
    }
    a !== 0 && Pf(e), fn.call(cm, n) ? cm[n](e, n, i) : Io(e, 'unknown document directive "' + n + '"');
  }
  if (Fe(e, !0, -1), e.lineIndent === 0 && e.input.charCodeAt(e.position) === 45 && e.input.charCodeAt(e.position + 1) === 45 && e.input.charCodeAt(e.position + 2) === 45 ? (e.position += 3, Fe(e, !0, -1)) : s && te(e, "directives end mark is expected"), Li(e, e.lineIndent - 1, Ro, !1, !0), Fe(e, !0, -1), e.checkLineBreaks && IU.test(e.input.slice(t, e.position)) && Io(e, "non-ASCII line breaks are interpreted as content"), e.documents.push(e.result), e.position === e.lineStart && uc(e)) {
    e.input.charCodeAt(e.position) === 46 && (e.position += 3, Fe(e, !0, -1));
    return;
  }
  if (e.position < e.length - 1)
    te(e, "end of the stream or a document separator is expected");
  else
    return;
}
function Y_(e, t) {
  e = String(e), t = t || {}, e.length !== 0 && (e.charCodeAt(e.length - 1) !== 10 && e.charCodeAt(e.length - 1) !== 13 && (e += `
`), e.charCodeAt(0) === 65279 && (e = e.slice(1)));
  var r = new UU(e, t), n = e.indexOf("\0");
  for (n !== -1 && (r.position = n, te(r, "null byte is not allowed in input")), r.input += "\0"; r.input.charCodeAt(r.position) === 32; )
    r.lineIndent += 1, r.position += 1;
  for (; r.position < r.length - 1; )
    WU(r);
  return r.documents;
}
function YU(e, t, r) {
  t !== null && typeof t == "object" && typeof r > "u" && (r = t, t = null);
  var n = Y_(e, r);
  if (typeof t != "function")
    return n;
  for (var i = 0, s = n.length; i < s; i += 1)
    t(n[i]);
}
function XU(e, t) {
  var r = Y_(e, t);
  if (r.length !== 0) {
    if (r.length === 1)
      return r[0];
    throw new x_("expected a single document in the stream, but found more");
  }
}
Ef.loadAll = YU;
Ef.load = XU;
var X_ = {}, dc = sr, aa = sa, JU = Sf, J_ = Object.prototype.toString, Q_ = Object.prototype.hasOwnProperty, Nf = 65279, QU = 9, Ls = 10, ZU = 13, eM = 32, tM = 33, rM = 34, eu = 35, nM = 37, iM = 38, sM = 39, aM = 42, Z_ = 44, oM = 45, Do = 58, cM = 61, lM = 62, uM = 63, dM = 64, ev = 91, tv = 93, fM = 96, rv = 123, hM = 124, nv = 125, lt = {};
lt[0] = "\\0";
lt[7] = "\\a";
lt[8] = "\\b";
lt[9] = "\\t";
lt[10] = "\\n";
lt[11] = "\\v";
lt[12] = "\\f";
lt[13] = "\\r";
lt[27] = "\\e";
lt[34] = '\\"';
lt[92] = "\\\\";
lt[133] = "\\N";
lt[160] = "\\_";
lt[8232] = "\\L";
lt[8233] = "\\P";
var pM = [
  "y",
  "Y",
  "yes",
  "Yes",
  "YES",
  "on",
  "On",
  "ON",
  "n",
  "N",
  "no",
  "No",
  "NO",
  "off",
  "Off",
  "OFF"
], mM = /^[-+]?[0-9_]+(?::[0-9_]+)+(?:\.[0-9_]*)?$/;
function yM(e, t) {
  var r, n, i, s, a, o, c;
  if (t === null) return {};
  for (r = {}, n = Object.keys(t), i = 0, s = n.length; i < s; i += 1)
    a = n[i], o = String(t[a]), a.slice(0, 2) === "!!" && (a = "tag:yaml.org,2002:" + a.slice(2)), c = e.compiledTypeMap.fallback[a], c && Q_.call(c.styleAliases, o) && (o = c.styleAliases[o]), r[a] = o;
  return r;
}
function gM(e) {
  var t, r, n;
  if (t = e.toString(16).toUpperCase(), e <= 255)
    r = "x", n = 2;
  else if (e <= 65535)
    r = "u", n = 4;
  else if (e <= 4294967295)
    r = "U", n = 8;
  else
    throw new aa("code point within a string may not be greater than 0xFFFFFFFF");
  return "\\" + r + dc.repeat("0", n - t.length) + t;
}
var _M = 1, Us = 2;
function vM(e) {
  this.schema = e.schema || JU, this.indent = Math.max(1, e.indent || 2), this.noArrayIndent = e.noArrayIndent || !1, this.skipInvalid = e.skipInvalid || !1, this.flowLevel = dc.isNothing(e.flowLevel) ? -1 : e.flowLevel, this.styleMap = yM(this.schema, e.styles || null), this.sortKeys = e.sortKeys || !1, this.lineWidth = e.lineWidth || 80, this.noRefs = e.noRefs || !1, this.noCompatMode = e.noCompatMode || !1, this.condenseFlow = e.condenseFlow || !1, this.quotingType = e.quotingType === '"' ? Us : _M, this.forceQuotes = e.forceQuotes || !1, this.replacer = typeof e.replacer == "function" ? e.replacer : null, this.implicitTypes = this.schema.compiledImplicit, this.explicitTypes = this.schema.compiledExplicit, this.tag = null, this.result = "", this.duplicates = [], this.usedDuplicates = null;
}
function dm(e, t) {
  for (var r = dc.repeat(" ", t), n = 0, i = -1, s = "", a, o = e.length; n < o; )
    i = e.indexOf(`
`, n), i === -1 ? (a = e.slice(n), n = o) : (a = e.slice(n, i + 1), n = i + 1), a.length && a !== `
` && (s += r), s += a;
  return s;
}
function tu(e, t) {
  return `
` + dc.repeat(" ", e.indent * t);
}
function $M(e, t) {
  var r, n, i;
  for (r = 0, n = e.implicitTypes.length; r < n; r += 1)
    if (i = e.implicitTypes[r], i.resolve(t))
      return !0;
  return !1;
}
function ko(e) {
  return e === eM || e === QU;
}
function Ms(e) {
  return 32 <= e && e <= 126 || 161 <= e && e <= 55295 && e !== 8232 && e !== 8233 || 57344 <= e && e <= 65533 && e !== Nf || 65536 <= e && e <= 1114111;
}
function fm(e) {
  return Ms(e) && e !== Nf && e !== ZU && e !== Ls;
}
function hm(e, t, r) {
  var n = fm(e), i = n && !ko(e);
  return (
    // ns-plain-safe
    (r ? (
      // c = flow-in
      n
    ) : n && e !== Z_ && e !== ev && e !== tv && e !== rv && e !== nv) && e !== eu && !(t === Do && !i) || fm(t) && !ko(t) && e === eu || t === Do && i
  );
}
function wM(e) {
  return Ms(e) && e !== Nf && !ko(e) && e !== oM && e !== uM && e !== Do && e !== Z_ && e !== ev && e !== tv && e !== rv && e !== nv && e !== eu && e !== iM && e !== aM && e !== tM && e !== hM && e !== cM && e !== lM && e !== sM && e !== rM && e !== nM && e !== dM && e !== fM;
}
function EM(e) {
  return !ko(e) && e !== Do;
}
function ps(e, t) {
  var r = e.charCodeAt(t), n;
  return r >= 55296 && r <= 56319 && t + 1 < e.length && (n = e.charCodeAt(t + 1), n >= 56320 && n <= 57343) ? (r - 55296) * 1024 + n - 56320 + 65536 : r;
}
function iv(e) {
  var t = /^\n* /;
  return t.test(e);
}
var sv = 1, ru = 2, av = 3, ov = 4, pi = 5;
function bM(e, t, r, n, i, s, a, o) {
  var c, u = 0, l = null, d = !1, h = !1, p = n !== -1, $ = -1, _ = wM(ps(e, 0)) && EM(ps(e, e.length - 1));
  if (t || a)
    for (c = 0; c < e.length; u >= 65536 ? c += 2 : c++) {
      if (u = ps(e, c), !Ms(u))
        return pi;
      _ = _ && hm(u, l, o), l = u;
    }
  else {
    for (c = 0; c < e.length; u >= 65536 ? c += 2 : c++) {
      if (u = ps(e, c), u === Ls)
        d = !0, p && (h = h || // Foldable line = too long, and not more-indented.
        c - $ - 1 > n && e[$ + 1] !== " ", $ = c);
      else if (!Ms(u))
        return pi;
      _ = _ && hm(u, l, o), l = u;
    }
    h = h || p && c - $ - 1 > n && e[$ + 1] !== " ";
  }
  return !d && !h ? _ && !a && !i(e) ? sv : s === Us ? pi : ru : r > 9 && iv(e) ? pi : a ? s === Us ? pi : ru : h ? ov : av;
}
function SM(e, t, r, n, i) {
  e.dump = function() {
    if (t.length === 0)
      return e.quotingType === Us ? '""' : "''";
    if (!e.noCompatMode && (pM.indexOf(t) !== -1 || mM.test(t)))
      return e.quotingType === Us ? '"' + t + '"' : "'" + t + "'";
    var s = e.indent * Math.max(1, r), a = e.lineWidth === -1 ? -1 : Math.max(Math.min(e.lineWidth, 40), e.lineWidth - s), o = n || e.flowLevel > -1 && r >= e.flowLevel;
    function c(u) {
      return $M(e, u);
    }
    switch (bM(
      t,
      o,
      e.indent,
      a,
      c,
      e.quotingType,
      e.forceQuotes && !n,
      i
    )) {
      case sv:
        return t;
      case ru:
        return "'" + t.replace(/'/g, "''") + "'";
      case av:
        return "|" + pm(t, e.indent) + mm(dm(t, s));
      case ov:
        return ">" + pm(t, e.indent) + mm(dm(PM(t, a), s));
      case pi:
        return '"' + TM(t) + '"';
      default:
        throw new aa("impossible error: invalid scalar style");
    }
  }();
}
function pm(e, t) {
  var r = iv(e) ? String(t) : "", n = e[e.length - 1] === `
`, i = n && (e[e.length - 2] === `
` || e === `
`), s = i ? "+" : n ? "" : "-";
  return r + s + `
`;
}
function mm(e) {
  return e[e.length - 1] === `
` ? e.slice(0, -1) : e;
}
function PM(e, t) {
  for (var r = /(\n+)([^\n]*)/g, n = function() {
    var u = e.indexOf(`
`);
    return u = u !== -1 ? u : e.length, r.lastIndex = u, ym(e.slice(0, u), t);
  }(), i = e[0] === `
` || e[0] === " ", s, a; a = r.exec(e); ) {
    var o = a[1], c = a[2];
    s = c[0] === " ", n += o + (!i && !s && c !== "" ? `
` : "") + ym(c, t), i = s;
  }
  return n;
}
function ym(e, t) {
  if (e === "" || e[0] === " ") return e;
  for (var r = / [^ ]/g, n, i = 0, s, a = 0, o = 0, c = ""; n = r.exec(e); )
    o = n.index, o - i > t && (s = a > i ? a : o, c += `
` + e.slice(i, s), i = s + 1), a = o;
  return c += `
`, e.length - i > t && a > i ? c += e.slice(i, a) + `
` + e.slice(a + 1) : c += e.slice(i), c.slice(1);
}
function TM(e) {
  for (var t = "", r = 0, n, i = 0; i < e.length; r >= 65536 ? i += 2 : i++)
    r = ps(e, i), n = lt[r], !n && Ms(r) ? (t += e[i], r >= 65536 && (t += e[i + 1])) : t += n || gM(r);
  return t;
}
function NM(e, t, r) {
  var n = "", i = e.tag, s, a, o;
  for (s = 0, a = r.length; s < a; s += 1)
    o = r[s], e.replacer && (o = e.replacer.call(r, String(s), o)), (Fr(e, t, o, !1, !1) || typeof o > "u" && Fr(e, t, null, !1, !1)) && (n !== "" && (n += "," + (e.condenseFlow ? "" : " ")), n += e.dump);
  e.tag = i, e.dump = "[" + n + "]";
}
function gm(e, t, r, n) {
  var i = "", s = e.tag, a, o, c;
  for (a = 0, o = r.length; a < o; a += 1)
    c = r[a], e.replacer && (c = e.replacer.call(r, String(a), c)), (Fr(e, t + 1, c, !0, !0, !1, !0) || typeof c > "u" && Fr(e, t + 1, null, !0, !0, !1, !0)) && ((!n || i !== "") && (i += tu(e, t)), e.dump && Ls === e.dump.charCodeAt(0) ? i += "-" : i += "- ", i += e.dump);
  e.tag = s, e.dump = i || "[]";
}
function OM(e, t, r) {
  var n = "", i = e.tag, s = Object.keys(r), a, o, c, u, l;
  for (a = 0, o = s.length; a < o; a += 1)
    l = "", n !== "" && (l += ", "), e.condenseFlow && (l += '"'), c = s[a], u = r[c], e.replacer && (u = e.replacer.call(r, c, u)), Fr(e, t, c, !1, !1) && (e.dump.length > 1024 && (l += "? "), l += e.dump + (e.condenseFlow ? '"' : "") + ":" + (e.condenseFlow ? "" : " "), Fr(e, t, u, !1, !1) && (l += e.dump, n += l));
  e.tag = i, e.dump = "{" + n + "}";
}
function AM(e, t, r, n) {
  var i = "", s = e.tag, a = Object.keys(r), o, c, u, l, d, h;
  if (e.sortKeys === !0)
    a.sort();
  else if (typeof e.sortKeys == "function")
    a.sort(e.sortKeys);
  else if (e.sortKeys)
    throw new aa("sortKeys must be a boolean or a function");
  for (o = 0, c = a.length; o < c; o += 1)
    h = "", (!n || i !== "") && (h += tu(e, t)), u = a[o], l = r[u], e.replacer && (l = e.replacer.call(r, u, l)), Fr(e, t + 1, u, !0, !0, !0) && (d = e.tag !== null && e.tag !== "?" || e.dump && e.dump.length > 1024, d && (e.dump && Ls === e.dump.charCodeAt(0) ? h += "?" : h += "? "), h += e.dump, d && (h += tu(e, t)), Fr(e, t + 1, l, !0, d) && (e.dump && Ls === e.dump.charCodeAt(0) ? h += ":" : h += ": ", h += e.dump, i += h));
  e.tag = s, e.dump = i || "{}";
}
function _m(e, t, r) {
  var n, i, s, a, o, c;
  for (i = r ? e.explicitTypes : e.implicitTypes, s = 0, a = i.length; s < a; s += 1)
    if (o = i[s], (o.instanceOf || o.predicate) && (!o.instanceOf || typeof t == "object" && t instanceof o.instanceOf) && (!o.predicate || o.predicate(t))) {
      if (r ? o.multi && o.representName ? e.tag = o.representName(t) : e.tag = o.tag : e.tag = "?", o.represent) {
        if (c = e.styleMap[o.tag] || o.defaultStyle, J_.call(o.represent) === "[object Function]")
          n = o.represent(t, c);
        else if (Q_.call(o.represent, c))
          n = o.represent[c](t, c);
        else
          throw new aa("!<" + o.tag + '> tag resolver accepts not "' + c + '" style');
        e.dump = n;
      }
      return !0;
    }
  return !1;
}
function Fr(e, t, r, n, i, s, a) {
  e.tag = null, e.dump = r, _m(e, r, !1) || _m(e, r, !0);
  var o = J_.call(e.dump), c = n, u;
  n && (n = e.flowLevel < 0 || e.flowLevel > t);
  var l = o === "[object Object]" || o === "[object Array]", d, h;
  if (l && (d = e.duplicates.indexOf(r), h = d !== -1), (e.tag !== null && e.tag !== "?" || h || e.indent !== 2 && t > 0) && (i = !1), h && e.usedDuplicates[d])
    e.dump = "*ref_" + d;
  else {
    if (l && h && !e.usedDuplicates[d] && (e.usedDuplicates[d] = !0), o === "[object Object]")
      n && Object.keys(e.dump).length !== 0 ? (AM(e, t, e.dump, i), h && (e.dump = "&ref_" + d + e.dump)) : (OM(e, t, e.dump), h && (e.dump = "&ref_" + d + " " + e.dump));
    else if (o === "[object Array]")
      n && e.dump.length !== 0 ? (e.noArrayIndent && !a && t > 0 ? gm(e, t - 1, e.dump, i) : gm(e, t, e.dump, i), h && (e.dump = "&ref_" + d + e.dump)) : (NM(e, t, e.dump), h && (e.dump = "&ref_" + d + " " + e.dump));
    else if (o === "[object String]")
      e.tag !== "?" && SM(e, e.dump, t, s, c);
    else {
      if (o === "[object Undefined]")
        return !1;
      if (e.skipInvalid) return !1;
      throw new aa("unacceptable kind of an object to dump " + o);
    }
    e.tag !== null && e.tag !== "?" && (u = encodeURI(
      e.tag[0] === "!" ? e.tag.slice(1) : e.tag
    ).replace(/!/g, "%21"), e.tag[0] === "!" ? u = "!" + u : u.slice(0, 18) === "tag:yaml.org,2002:" ? u = "!!" + u.slice(18) : u = "!<" + u + ">", e.dump = u + " " + e.dump);
  }
  return !0;
}
function CM(e, t) {
  var r = [], n = [], i, s;
  for (nu(e, r, n), i = 0, s = n.length; i < s; i += 1)
    t.duplicates.push(r[n[i]]);
  t.usedDuplicates = new Array(s);
}
function nu(e, t, r) {
  var n, i, s;
  if (e !== null && typeof e == "object")
    if (i = t.indexOf(e), i !== -1)
      r.indexOf(i) === -1 && r.push(i);
    else if (t.push(e), Array.isArray(e))
      for (i = 0, s = e.length; i < s; i += 1)
        nu(e[i], t, r);
    else
      for (n = Object.keys(e), i = 0, s = n.length; i < s; i += 1)
        nu(e[n[i]], t, r);
}
function RM(e, t) {
  t = t || {};
  var r = new vM(t);
  r.noRefs || CM(e, r);
  var n = e;
  return r.replacer && (n = r.replacer.call({ "": n }, "", n)), Fr(r, 0, n, !0, !0) ? r.dump + `
` : "";
}
X_.dump = RM;
var cv = Ef, IM = X_;
function Of(e, t) {
  return function() {
    throw new Error("Function yaml." + e + " is removed in js-yaml 4. Use yaml." + t + " instead, which is now safe by default.");
  };
}
Ze.Type = wt;
Ze.Schema = $_;
Ze.FAILSAFE_SCHEMA = S_;
Ze.JSON_SCHEMA = C_;
Ze.CORE_SCHEMA = R_;
Ze.DEFAULT_SCHEMA = Sf;
Ze.load = cv.load;
Ze.loadAll = cv.loadAll;
Ze.dump = IM.dump;
Ze.YAMLException = sa;
Ze.types = {
  binary: j_,
  float: A_,
  map: b_,
  null: P_,
  pairs: U_,
  set: M_,
  timestamp: k_,
  bool: T_,
  int: N_,
  merge: F_,
  omap: L_,
  seq: E_,
  str: w_
};
Ze.safeLoad = Of("safeLoad", "load");
Ze.safeLoadAll = Of("safeLoadAll", "loadAll");
Ze.safeDump = Of("safeDump", "dump");
var fc = {};
Object.defineProperty(fc, "__esModule", { value: !0 });
fc.Lazy = void 0;
class DM {
  constructor(t) {
    this._value = null, this.creator = t;
  }
  get hasValue() {
    return this.creator == null;
  }
  get value() {
    if (this.creator == null)
      return this._value;
    const t = this.creator();
    return this.value = t, t;
  }
  set value(t) {
    this._value = t, this.creator = null;
  }
}
fc.Lazy = DM;
var oa = {}, Fo = { exports: {} };
Fo.exports;
(function(e, t) {
  var r = 200, n = "__lodash_hash_undefined__", i = 1, s = 2, a = 9007199254740991, o = "[object Arguments]", c = "[object Array]", u = "[object AsyncFunction]", l = "[object Boolean]", d = "[object Date]", h = "[object Error]", p = "[object Function]", $ = "[object GeneratorFunction]", _ = "[object Map]", v = "[object Number]", m = "[object Null]", E = "[object Object]", T = "[object Promise]", R = "[object Proxy]", F = "[object RegExp]", H = "[object Set]", G = "[object String]", ie = "[object Symbol]", C = "[object Undefined]", J = "[object WeakMap]", j = "[object ArrayBuffer]", V = "[object DataView]", Q = "[object Float32Array]", L = "[object Float64Array]", U = "[object Int8Array]", B = "[object Int16Array]", M = "[object Int32Array]", z = "[object Uint8Array]", q = "[object Uint8ClampedArray]", I = "[object Uint16Array]", b = "[object Uint32Array]", O = /[\\^$.*+?()[\]{}|]/g, S = /^\[object .+?Constructor\]$/, f = /^(?:0|[1-9]\d*)$/, g = {};
  g[Q] = g[L] = g[U] = g[B] = g[M] = g[z] = g[q] = g[I] = g[b] = !0, g[o] = g[c] = g[j] = g[l] = g[V] = g[d] = g[h] = g[p] = g[_] = g[v] = g[E] = g[F] = g[H] = g[G] = g[J] = !1;
  var N = typeof mt == "object" && mt && mt.Object === Object && mt, w = typeof self == "object" && self && self.Object === Object && self, y = N || w || Function("return this")(), k = t && !t.nodeType && t, A = k && !0 && e && !e.nodeType && e, W = A && A.exports === k, fe = W && N.process, ge = function() {
    try {
      return fe && fe.binding && fe.binding("util");
    } catch {
    }
  }(), be = ge && ge.isTypedArray;
  function Ne(P, D) {
    for (var x = -1, X = P == null ? 0 : P.length, Se = 0, ce = []; ++x < X; ) {
      var Ie = P[x];
      D(Ie, x, P) && (ce[Se++] = Ie);
    }
    return ce;
  }
  function et(P, D) {
    for (var x = -1, X = D.length, Se = P.length; ++x < X; )
      P[Se + x] = D[x];
    return P;
  }
  function _e(P, D) {
    for (var x = -1, X = P == null ? 0 : P.length; ++x < X; )
      if (D(P[x], x, P))
        return !0;
    return !1;
  }
  function Le(P, D) {
    for (var x = -1, X = Array(P); ++x < P; )
      X[x] = D(x);
    return X;
  }
  function Bt(P) {
    return function(D) {
      return P(D);
    };
  }
  function Ft(P, D) {
    return P.has(D);
  }
  function At(P, D) {
    return P == null ? void 0 : P[D];
  }
  function jt(P) {
    var D = -1, x = Array(P.size);
    return P.forEach(function(X, Se) {
      x[++D] = [Se, X];
    }), x;
  }
  function _r(P, D) {
    return function(x) {
      return P(D(x));
    };
  }
  function vr(P) {
    var D = -1, x = Array(P.size);
    return P.forEach(function(X) {
      x[++D] = X;
    }), x;
  }
  var $r = Array.prototype, Ct = Function.prototype, Lt = Object.prototype, wr = y["__core-js_shared__"], jr = Ct.toString, Et = Lt.hasOwnProperty, Ff = function() {
    var P = /[^.]+$/.exec(wr && wr.keys && wr.keys.IE_PROTO || "");
    return P ? "Symbol(src)_1." + P : "";
  }(), jf = Lt.toString, Pv = RegExp(
    "^" + jr.call(Et).replace(O, "\\$&").replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, "$1.*?") + "$"
  ), Lf = W ? y.Buffer : void 0, da = y.Symbol, Uf = y.Uint8Array, Mf = Lt.propertyIsEnumerable, Tv = $r.splice, vn = da ? da.toStringTag : void 0, xf = Object.getOwnPropertySymbols, Nv = Lf ? Lf.isBuffer : void 0, Ov = _r(Object.keys, Object), Ec = Qn(y, "DataView"), Ji = Qn(y, "Map"), bc = Qn(y, "Promise"), Sc = Qn(y, "Set"), Pc = Qn(y, "WeakMap"), Qi = Qn(Object, "create"), Av = En(Ec), Cv = En(Ji), Rv = En(bc), Iv = En(Sc), Dv = En(Pc), Vf = da ? da.prototype : void 0, Tc = Vf ? Vf.valueOf : void 0;
  function $n(P) {
    var D = -1, x = P == null ? 0 : P.length;
    for (this.clear(); ++D < x; ) {
      var X = P[D];
      this.set(X[0], X[1]);
    }
  }
  function kv() {
    this.__data__ = Qi ? Qi(null) : {}, this.size = 0;
  }
  function Fv(P) {
    var D = this.has(P) && delete this.__data__[P];
    return this.size -= D ? 1 : 0, D;
  }
  function jv(P) {
    var D = this.__data__;
    if (Qi) {
      var x = D[P];
      return x === n ? void 0 : x;
    }
    return Et.call(D, P) ? D[P] : void 0;
  }
  function Lv(P) {
    var D = this.__data__;
    return Qi ? D[P] !== void 0 : Et.call(D, P);
  }
  function Uv(P, D) {
    var x = this.__data__;
    return this.size += this.has(P) ? 0 : 1, x[P] = Qi && D === void 0 ? n : D, this;
  }
  $n.prototype.clear = kv, $n.prototype.delete = Fv, $n.prototype.get = jv, $n.prototype.has = Lv, $n.prototype.set = Uv;
  function Er(P) {
    var D = -1, x = P == null ? 0 : P.length;
    for (this.clear(); ++D < x; ) {
      var X = P[D];
      this.set(X[0], X[1]);
    }
  }
  function Mv() {
    this.__data__ = [], this.size = 0;
  }
  function xv(P) {
    var D = this.__data__, x = ha(D, P);
    if (x < 0)
      return !1;
    var X = D.length - 1;
    return x == X ? D.pop() : Tv.call(D, x, 1), --this.size, !0;
  }
  function Vv(P) {
    var D = this.__data__, x = ha(D, P);
    return x < 0 ? void 0 : D[x][1];
  }
  function qv(P) {
    return ha(this.__data__, P) > -1;
  }
  function Bv(P, D) {
    var x = this.__data__, X = ha(x, P);
    return X < 0 ? (++this.size, x.push([P, D])) : x[X][1] = D, this;
  }
  Er.prototype.clear = Mv, Er.prototype.delete = xv, Er.prototype.get = Vv, Er.prototype.has = qv, Er.prototype.set = Bv;
  function wn(P) {
    var D = -1, x = P == null ? 0 : P.length;
    for (this.clear(); ++D < x; ) {
      var X = P[D];
      this.set(X[0], X[1]);
    }
  }
  function Hv() {
    this.size = 0, this.__data__ = {
      hash: new $n(),
      map: new (Ji || Er)(),
      string: new $n()
    };
  }
  function Gv(P) {
    var D = pa(this, P).delete(P);
    return this.size -= D ? 1 : 0, D;
  }
  function zv(P) {
    return pa(this, P).get(P);
  }
  function Kv(P) {
    return pa(this, P).has(P);
  }
  function Wv(P, D) {
    var x = pa(this, P), X = x.size;
    return x.set(P, D), this.size += x.size == X ? 0 : 1, this;
  }
  wn.prototype.clear = Hv, wn.prototype.delete = Gv, wn.prototype.get = zv, wn.prototype.has = Kv, wn.prototype.set = Wv;
  function fa(P) {
    var D = -1, x = P == null ? 0 : P.length;
    for (this.__data__ = new wn(); ++D < x; )
      this.add(P[D]);
  }
  function Yv(P) {
    return this.__data__.set(P, n), this;
  }
  function Xv(P) {
    return this.__data__.has(P);
  }
  fa.prototype.add = fa.prototype.push = Yv, fa.prototype.has = Xv;
  function Lr(P) {
    var D = this.__data__ = new Er(P);
    this.size = D.size;
  }
  function Jv() {
    this.__data__ = new Er(), this.size = 0;
  }
  function Qv(P) {
    var D = this.__data__, x = D.delete(P);
    return this.size = D.size, x;
  }
  function Zv(P) {
    return this.__data__.get(P);
  }
  function e$(P) {
    return this.__data__.has(P);
  }
  function t$(P, D) {
    var x = this.__data__;
    if (x instanceof Er) {
      var X = x.__data__;
      if (!Ji || X.length < r - 1)
        return X.push([P, D]), this.size = ++x.size, this;
      x = this.__data__ = new wn(X);
    }
    return x.set(P, D), this.size = x.size, this;
  }
  Lr.prototype.clear = Jv, Lr.prototype.delete = Qv, Lr.prototype.get = Zv, Lr.prototype.has = e$, Lr.prototype.set = t$;
  function r$(P, D) {
    var x = ma(P), X = !x && g$(P), Se = !x && !X && Nc(P), ce = !x && !X && !Se && Xf(P), Ie = x || X || Se || ce, qe = Ie ? Le(P.length, String) : [], Ge = qe.length;
    for (var Ae in P)
      Et.call(P, Ae) && !(Ie && // Safari 9 has enumerable `arguments.length` in strict mode.
      (Ae == "length" || // Node.js 0.10 has enumerable non-index properties on buffers.
      Se && (Ae == "offset" || Ae == "parent") || // PhantomJS 2 has enumerable non-index properties on typed arrays.
      ce && (Ae == "buffer" || Ae == "byteLength" || Ae == "byteOffset") || // Skip index properties.
      f$(Ae, Ge))) && qe.push(Ae);
    return qe;
  }
  function ha(P, D) {
    for (var x = P.length; x--; )
      if (zf(P[x][0], D))
        return x;
    return -1;
  }
  function n$(P, D, x) {
    var X = D(P);
    return ma(P) ? X : et(X, x(P));
  }
  function Zi(P) {
    return P == null ? P === void 0 ? C : m : vn && vn in Object(P) ? u$(P) : y$(P);
  }
  function qf(P) {
    return es(P) && Zi(P) == o;
  }
  function Bf(P, D, x, X, Se) {
    return P === D ? !0 : P == null || D == null || !es(P) && !es(D) ? P !== P && D !== D : i$(P, D, x, X, Bf, Se);
  }
  function i$(P, D, x, X, Se, ce) {
    var Ie = ma(P), qe = ma(D), Ge = Ie ? c : Ur(P), Ae = qe ? c : Ur(D);
    Ge = Ge == o ? E : Ge, Ae = Ae == o ? E : Ae;
    var Rt = Ge == E, Ht = Ae == E, tt = Ge == Ae;
    if (tt && Nc(P)) {
      if (!Nc(D))
        return !1;
      Ie = !0, Rt = !1;
    }
    if (tt && !Rt)
      return ce || (ce = new Lr()), Ie || Xf(P) ? Hf(P, D, x, X, Se, ce) : c$(P, D, Ge, x, X, Se, ce);
    if (!(x & i)) {
      var Ut = Rt && Et.call(P, "__wrapped__"), Mt = Ht && Et.call(D, "__wrapped__");
      if (Ut || Mt) {
        var Mr = Ut ? P.value() : P, br = Mt ? D.value() : D;
        return ce || (ce = new Lr()), Se(Mr, br, x, X, ce);
      }
    }
    return tt ? (ce || (ce = new Lr()), l$(P, D, x, X, Se, ce)) : !1;
  }
  function s$(P) {
    if (!Yf(P) || p$(P))
      return !1;
    var D = Kf(P) ? Pv : S;
    return D.test(En(P));
  }
  function a$(P) {
    return es(P) && Wf(P.length) && !!g[Zi(P)];
  }
  function o$(P) {
    if (!m$(P))
      return Ov(P);
    var D = [];
    for (var x in Object(P))
      Et.call(P, x) && x != "constructor" && D.push(x);
    return D;
  }
  function Hf(P, D, x, X, Se, ce) {
    var Ie = x & i, qe = P.length, Ge = D.length;
    if (qe != Ge && !(Ie && Ge > qe))
      return !1;
    var Ae = ce.get(P);
    if (Ae && ce.get(D))
      return Ae == D;
    var Rt = -1, Ht = !0, tt = x & s ? new fa() : void 0;
    for (ce.set(P, D), ce.set(D, P); ++Rt < qe; ) {
      var Ut = P[Rt], Mt = D[Rt];
      if (X)
        var Mr = Ie ? X(Mt, Ut, Rt, D, P, ce) : X(Ut, Mt, Rt, P, D, ce);
      if (Mr !== void 0) {
        if (Mr)
          continue;
        Ht = !1;
        break;
      }
      if (tt) {
        if (!_e(D, function(br, bn) {
          if (!Ft(tt, bn) && (Ut === br || Se(Ut, br, x, X, ce)))
            return tt.push(bn);
        })) {
          Ht = !1;
          break;
        }
      } else if (!(Ut === Mt || Se(Ut, Mt, x, X, ce))) {
        Ht = !1;
        break;
      }
    }
    return ce.delete(P), ce.delete(D), Ht;
  }
  function c$(P, D, x, X, Se, ce, Ie) {
    switch (x) {
      case V:
        if (P.byteLength != D.byteLength || P.byteOffset != D.byteOffset)
          return !1;
        P = P.buffer, D = D.buffer;
      case j:
        return !(P.byteLength != D.byteLength || !ce(new Uf(P), new Uf(D)));
      case l:
      case d:
      case v:
        return zf(+P, +D);
      case h:
        return P.name == D.name && P.message == D.message;
      case F:
      case G:
        return P == D + "";
      case _:
        var qe = jt;
      case H:
        var Ge = X & i;
        if (qe || (qe = vr), P.size != D.size && !Ge)
          return !1;
        var Ae = Ie.get(P);
        if (Ae)
          return Ae == D;
        X |= s, Ie.set(P, D);
        var Rt = Hf(qe(P), qe(D), X, Se, ce, Ie);
        return Ie.delete(P), Rt;
      case ie:
        if (Tc)
          return Tc.call(P) == Tc.call(D);
    }
    return !1;
  }
  function l$(P, D, x, X, Se, ce) {
    var Ie = x & i, qe = Gf(P), Ge = qe.length, Ae = Gf(D), Rt = Ae.length;
    if (Ge != Rt && !Ie)
      return !1;
    for (var Ht = Ge; Ht--; ) {
      var tt = qe[Ht];
      if (!(Ie ? tt in D : Et.call(D, tt)))
        return !1;
    }
    var Ut = ce.get(P);
    if (Ut && ce.get(D))
      return Ut == D;
    var Mt = !0;
    ce.set(P, D), ce.set(D, P);
    for (var Mr = Ie; ++Ht < Ge; ) {
      tt = qe[Ht];
      var br = P[tt], bn = D[tt];
      if (X)
        var Jf = Ie ? X(bn, br, tt, D, P, ce) : X(br, bn, tt, P, D, ce);
      if (!(Jf === void 0 ? br === bn || Se(br, bn, x, X, ce) : Jf)) {
        Mt = !1;
        break;
      }
      Mr || (Mr = tt == "constructor");
    }
    if (Mt && !Mr) {
      var ya = P.constructor, ga = D.constructor;
      ya != ga && "constructor" in P && "constructor" in D && !(typeof ya == "function" && ya instanceof ya && typeof ga == "function" && ga instanceof ga) && (Mt = !1);
    }
    return ce.delete(P), ce.delete(D), Mt;
  }
  function Gf(P) {
    return n$(P, $$, d$);
  }
  function pa(P, D) {
    var x = P.__data__;
    return h$(D) ? x[typeof D == "string" ? "string" : "hash"] : x.map;
  }
  function Qn(P, D) {
    var x = At(P, D);
    return s$(x) ? x : void 0;
  }
  function u$(P) {
    var D = Et.call(P, vn), x = P[vn];
    try {
      P[vn] = void 0;
      var X = !0;
    } catch {
    }
    var Se = jf.call(P);
    return X && (D ? P[vn] = x : delete P[vn]), Se;
  }
  var d$ = xf ? function(P) {
    return P == null ? [] : (P = Object(P), Ne(xf(P), function(D) {
      return Mf.call(P, D);
    }));
  } : w$, Ur = Zi;
  (Ec && Ur(new Ec(new ArrayBuffer(1))) != V || Ji && Ur(new Ji()) != _ || bc && Ur(bc.resolve()) != T || Sc && Ur(new Sc()) != H || Pc && Ur(new Pc()) != J) && (Ur = function(P) {
    var D = Zi(P), x = D == E ? P.constructor : void 0, X = x ? En(x) : "";
    if (X)
      switch (X) {
        case Av:
          return V;
        case Cv:
          return _;
        case Rv:
          return T;
        case Iv:
          return H;
        case Dv:
          return J;
      }
    return D;
  });
  function f$(P, D) {
    return D = D ?? a, !!D && (typeof P == "number" || f.test(P)) && P > -1 && P % 1 == 0 && P < D;
  }
  function h$(P) {
    var D = typeof P;
    return D == "string" || D == "number" || D == "symbol" || D == "boolean" ? P !== "__proto__" : P === null;
  }
  function p$(P) {
    return !!Ff && Ff in P;
  }
  function m$(P) {
    var D = P && P.constructor, x = typeof D == "function" && D.prototype || Lt;
    return P === x;
  }
  function y$(P) {
    return jf.call(P);
  }
  function En(P) {
    if (P != null) {
      try {
        return jr.call(P);
      } catch {
      }
      try {
        return P + "";
      } catch {
      }
    }
    return "";
  }
  function zf(P, D) {
    return P === D || P !== P && D !== D;
  }
  var g$ = qf(/* @__PURE__ */ function() {
    return arguments;
  }()) ? qf : function(P) {
    return es(P) && Et.call(P, "callee") && !Mf.call(P, "callee");
  }, ma = Array.isArray;
  function _$(P) {
    return P != null && Wf(P.length) && !Kf(P);
  }
  var Nc = Nv || E$;
  function v$(P, D) {
    return Bf(P, D);
  }
  function Kf(P) {
    if (!Yf(P))
      return !1;
    var D = Zi(P);
    return D == p || D == $ || D == u || D == R;
  }
  function Wf(P) {
    return typeof P == "number" && P > -1 && P % 1 == 0 && P <= a;
  }
  function Yf(P) {
    var D = typeof P;
    return P != null && (D == "object" || D == "function");
  }
  function es(P) {
    return P != null && typeof P == "object";
  }
  var Xf = be ? Bt(be) : a$;
  function $$(P) {
    return _$(P) ? r$(P) : o$(P);
  }
  function w$() {
    return [];
  }
  function E$() {
    return !1;
  }
  e.exports = v$;
})(Fo, Fo.exports);
var kM = Fo.exports;
Object.defineProperty(oa, "__esModule", { value: !0 });
oa.DownloadedUpdateHelper = void 0;
oa.createTempUpdateFile = MM;
const FM = Ks, jM = mn, vm = kM, On = gn, Os = Re;
class LM {
  constructor(t) {
    this.cacheDir = t, this._file = null, this._packageFile = null, this.versionInfo = null, this.fileInfo = null, this._downloadedFileInfo = null;
  }
  get downloadedFileInfo() {
    return this._downloadedFileInfo;
  }
  get file() {
    return this._file;
  }
  get packageFile() {
    return this._packageFile;
  }
  get cacheDirForPendingUpdate() {
    return Os.join(this.cacheDir, "pending");
  }
  async validateDownloadedPath(t, r, n, i) {
    if (this.versionInfo != null && this.file === t && this.fileInfo != null)
      return vm(this.versionInfo, r) && vm(this.fileInfo.info, n.info) && await (0, On.pathExists)(t) ? t : null;
    const s = await this.getValidCachedUpdateFile(n, i);
    return s === null ? null : (i.info(`Update has already been downloaded to ${t}).`), this._file = s, s);
  }
  async setDownloadedFile(t, r, n, i, s, a) {
    this._file = t, this._packageFile = r, this.versionInfo = n, this.fileInfo = i, this._downloadedFileInfo = {
      fileName: s,
      sha512: i.info.sha512,
      isAdminRightsRequired: i.info.isAdminRightsRequired === !0
    }, a && await (0, On.outputJson)(this.getUpdateInfoFile(), this._downloadedFileInfo);
  }
  async clear() {
    this._file = null, this._packageFile = null, this.versionInfo = null, this.fileInfo = null, await this.cleanCacheDirForPendingUpdate();
  }
  async cleanCacheDirForPendingUpdate() {
    try {
      await (0, On.emptyDir)(this.cacheDirForPendingUpdate);
    } catch {
    }
  }
  /**
   * Returns "update-info.json" which is created in the update cache directory's "pending" subfolder after the first update is downloaded.  If the update file does not exist then the cache is cleared and recreated.  If the update file exists then its properties are validated.
   * @param fileInfo
   * @param logger
   */
  async getValidCachedUpdateFile(t, r) {
    const n = this.getUpdateInfoFile();
    if (!await (0, On.pathExists)(n))
      return null;
    let s;
    try {
      s = await (0, On.readJson)(n);
    } catch (u) {
      let l = "No cached update info available";
      return u.code !== "ENOENT" && (await this.cleanCacheDirForPendingUpdate(), l += ` (error on read: ${u.message})`), r.info(l), null;
    }
    if (!((s == null ? void 0 : s.fileName) !== null))
      return r.warn("Cached update info is corrupted: no fileName, directory for cached update will be cleaned"), await this.cleanCacheDirForPendingUpdate(), null;
    if (t.info.sha512 !== s.sha512)
      return r.info(`Cached update sha512 checksum doesn't match the latest available update. New update must be downloaded. Cached: ${s.sha512}, expected: ${t.info.sha512}. Directory for cached update will be cleaned`), await this.cleanCacheDirForPendingUpdate(), null;
    const o = Os.join(this.cacheDirForPendingUpdate, s.fileName);
    if (!await (0, On.pathExists)(o))
      return r.info("Cached update file doesn't exist"), null;
    const c = await UM(o);
    return t.info.sha512 !== c ? (r.warn(`Sha512 checksum doesn't match the latest available update. New update must be downloaded. Cached: ${c}, expected: ${t.info.sha512}`), await this.cleanCacheDirForPendingUpdate(), null) : (this._downloadedFileInfo = s, o);
  }
  getUpdateInfoFile() {
    return Os.join(this.cacheDirForPendingUpdate, "update-info.json");
  }
}
oa.DownloadedUpdateHelper = LM;
function UM(e, t = "sha512", r = "base64", n) {
  return new Promise((i, s) => {
    const a = (0, FM.createHash)(t);
    a.on("error", s).setEncoding(r), (0, jM.createReadStream)(e, {
      ...n,
      highWaterMark: 1024 * 1024
      /* better to use more memory but hash faster */
    }).on("error", s).on("end", () => {
      a.end(), i(a.read());
    }).pipe(a, { end: !1 });
  });
}
async function MM(e, t, r) {
  let n = 0, i = Os.join(t, e);
  for (let s = 0; s < 3; s++)
    try {
      return await (0, On.unlink)(i), i;
    } catch (a) {
      if (a.code === "ENOENT")
        return i;
      r.warn(`Error on remove temp update file: ${a}`), i = Os.join(t, `${n++}-${e}`);
    }
  return i;
}
var hc = {}, Af = {};
Object.defineProperty(Af, "__esModule", { value: !0 });
Af.getAppCacheDir = VM;
const dl = Re, xM = Mo;
function VM() {
  const e = (0, xM.homedir)();
  let t;
  return process.platform === "win32" ? t = process.env.LOCALAPPDATA || dl.join(e, "AppData", "Local") : process.platform === "darwin" ? t = dl.join(e, "Library", "Caches") : t = process.env.XDG_CACHE_HOME || dl.join(e, ".cache"), t;
}
Object.defineProperty(hc, "__esModule", { value: !0 });
hc.ElectronAppAdapter = void 0;
const $m = Re, qM = Af;
class BM {
  constructor(t = Ir.app) {
    this.app = t;
  }
  whenReady() {
    return this.app.whenReady();
  }
  get version() {
    return this.app.getVersion();
  }
  get name() {
    return this.app.getName();
  }
  get isPackaged() {
    return this.app.isPackaged === !0;
  }
  get appUpdateConfigPath() {
    return this.isPackaged ? $m.join(process.resourcesPath, "app-update.yml") : $m.join(this.app.getAppPath(), "dev-app-update.yml");
  }
  get userDataPath() {
    return this.app.getPath("userData");
  }
  get baseCachePath() {
    return (0, qM.getAppCacheDir)();
  }
  quit() {
    this.app.quit();
  }
  relaunch() {
    this.app.relaunch();
  }
  onQuit(t) {
    this.app.once("quit", (r, n) => t(n));
  }
}
hc.ElectronAppAdapter = BM;
var lv = {};
(function(e) {
  Object.defineProperty(e, "__esModule", { value: !0 }), e.ElectronHttpExecutor = e.NET_SESSION_NAME = void 0, e.getNetSession = r;
  const t = Ve;
  e.NET_SESSION_NAME = "electron-updater";
  function r() {
    return Ir.session.fromPartition(e.NET_SESSION_NAME, {
      cache: !1
    });
  }
  class n extends t.HttpExecutor {
    constructor(s) {
      super(), this.proxyLoginCallback = s, this.cachedSession = null;
    }
    async download(s, a, o) {
      return await o.cancellationToken.createPromise((c, u, l) => {
        const d = {
          headers: o.headers || void 0,
          redirect: "manual"
        };
        (0, t.configureRequestUrl)(s, d), (0, t.configureRequestOptions)(d), this.doDownload(d, {
          destination: a,
          options: o,
          onCancel: l,
          callback: (h) => {
            h == null ? c(a) : u(h);
          },
          responseHandler: null
        }, 0);
      });
    }
    createRequest(s, a) {
      s.headers && s.headers.Host && (s.host = s.headers.Host, delete s.headers.Host), this.cachedSession == null && (this.cachedSession = r());
      const o = Ir.net.request({
        ...s,
        session: this.cachedSession
      });
      return o.on("response", a), this.proxyLoginCallback != null && o.on("login", this.proxyLoginCallback), o;
    }
    addRedirectHandlers(s, a, o, c, u) {
      s.on("redirect", (l, d, h) => {
        s.abort(), c > this.maxRedirects ? o(this.createMaxRedirectError()) : u(t.HttpExecutor.prepareRedirectUrlOptions(h, a));
      });
    }
  }
  e.ElectronHttpExecutor = n;
})(lv);
var ca = {}, ar = {};
Object.defineProperty(ar, "__esModule", { value: !0 });
ar.newBaseUrl = HM;
ar.newUrlFromBase = GM;
ar.getChannelFilename = zM;
const uv = yn;
function HM(e) {
  const t = new uv.URL(e);
  return t.pathname.endsWith("/") || (t.pathname += "/"), t;
}
function GM(e, t, r = !1) {
  const n = new uv.URL(e, t), i = t.search;
  return i != null && i.length !== 0 ? n.search = i : r && (n.search = `noCache=${Date.now().toString(32)}`), n;
}
function zM(e) {
  return `${e}.yml`;
}
var je = {}, KM = "[object Symbol]", dv = /[\\^$.*+?()[\]{}|]/g, WM = RegExp(dv.source), YM = typeof mt == "object" && mt && mt.Object === Object && mt, XM = typeof self == "object" && self && self.Object === Object && self, JM = YM || XM || Function("return this")(), QM = Object.prototype, ZM = QM.toString, wm = JM.Symbol, Em = wm ? wm.prototype : void 0, bm = Em ? Em.toString : void 0;
function e2(e) {
  if (typeof e == "string")
    return e;
  if (r2(e))
    return bm ? bm.call(e) : "";
  var t = e + "";
  return t == "0" && 1 / e == -1 / 0 ? "-0" : t;
}
function t2(e) {
  return !!e && typeof e == "object";
}
function r2(e) {
  return typeof e == "symbol" || t2(e) && ZM.call(e) == KM;
}
function n2(e) {
  return e == null ? "" : e2(e);
}
function i2(e) {
  return e = n2(e), e && WM.test(e) ? e.replace(dv, "\\$&") : e;
}
var fv = i2;
Object.defineProperty(je, "__esModule", { value: !0 });
je.Provider = void 0;
je.findFile = l2;
je.parseUpdateInfo = u2;
je.getFileList = hv;
je.resolveFiles = d2;
const hn = Ve, s2 = Ze, a2 = yn, jo = ar, o2 = fv;
class c2 {
  constructor(t) {
    this.runtimeOptions = t, this.requestHeaders = null, this.executor = t.executor;
  }
  // By default, the blockmap file is in the same directory as the main file
  // But some providers may have a different blockmap file, so we need to override this method
  getBlockMapFiles(t, r, n, i = null) {
    const s = (0, jo.newUrlFromBase)(`${t.pathname}.blockmap`, t);
    return [(0, jo.newUrlFromBase)(`${t.pathname.replace(new RegExp(o2(n), "g"), r)}.blockmap`, i ? new a2.URL(i) : t), s];
  }
  get isUseMultipleRangeRequest() {
    return this.runtimeOptions.isUseMultipleRangeRequest !== !1;
  }
  getChannelFilePrefix() {
    if (this.runtimeOptions.platform === "linux") {
      const t = process.env.TEST_UPDATER_ARCH || process.arch;
      return "-linux" + (t === "x64" ? "" : `-${t}`);
    } else
      return this.runtimeOptions.platform === "darwin" ? "-mac" : "";
  }
  // due to historical reasons for windows we use channel name without platform specifier
  getDefaultChannelName() {
    return this.getCustomChannelName("latest");
  }
  getCustomChannelName(t) {
    return `${t}${this.getChannelFilePrefix()}`;
  }
  get fileExtraDownloadHeaders() {
    return null;
  }
  setRequestHeaders(t) {
    this.requestHeaders = t;
  }
  /**
   * Method to perform API request only to resolve update info, but not to download update.
   */
  httpRequest(t, r, n) {
    return this.executor.request(this.createRequestOptions(t, r), n);
  }
  createRequestOptions(t, r) {
    const n = {};
    return this.requestHeaders == null ? r != null && (n.headers = r) : n.headers = r == null ? this.requestHeaders : { ...this.requestHeaders, ...r }, (0, hn.configureRequestUrl)(t, n), n;
  }
}
je.Provider = c2;
function l2(e, t, r) {
  var n;
  if (e.length === 0)
    throw (0, hn.newError)("No files provided", "ERR_UPDATER_NO_FILES_PROVIDED");
  const i = e.filter((a) => a.url.pathname.toLowerCase().endsWith(`.${t.toLowerCase()}`)), s = (n = i.find((a) => [a.url.pathname, a.info.url].some((o) => o.includes(process.arch)))) !== null && n !== void 0 ? n : i.shift();
  return s || (r == null ? e[0] : e.find((a) => !r.some((o) => a.url.pathname.toLowerCase().endsWith(`.${o.toLowerCase()}`))));
}
function u2(e, t, r) {
  if (e == null)
    throw (0, hn.newError)(`Cannot parse update info from ${t} in the latest release artifacts (${r}): rawData: null`, "ERR_UPDATER_INVALID_UPDATE_INFO");
  let n;
  try {
    n = (0, s2.load)(e);
  } catch (i) {
    throw (0, hn.newError)(`Cannot parse update info from ${t} in the latest release artifacts (${r}): ${i.stack || i.message}, rawData: ${e}`, "ERR_UPDATER_INVALID_UPDATE_INFO");
  }
  return n;
}
function hv(e) {
  const t = e.files;
  if (t != null && t.length > 0)
    return t;
  if (e.path != null)
    return [
      {
        url: e.path,
        sha2: e.sha2,
        sha512: e.sha512
      }
    ];
  throw (0, hn.newError)(`No files provided: ${(0, hn.safeStringifyJson)(e)}`, "ERR_UPDATER_NO_FILES_PROVIDED");
}
function d2(e, t, r = (n) => n) {
  const i = hv(e).map((o) => {
    if (o.sha2 == null && o.sha512 == null)
      throw (0, hn.newError)(`Update info doesn't contain nor sha256 neither sha512 checksum: ${(0, hn.safeStringifyJson)(o)}`, "ERR_UPDATER_NO_CHECKSUM");
    return {
      url: (0, jo.newUrlFromBase)(r(o.url), t),
      info: o
    };
  }), s = e.packages, a = s == null ? null : s[process.arch] || s.ia32;
  return a != null && (i[0].packageInfo = {
    ...a,
    path: (0, jo.newUrlFromBase)(r(a.path), t).href
  }), i;
}
Object.defineProperty(ca, "__esModule", { value: !0 });
ca.GenericProvider = void 0;
const Sm = Ve, fl = ar, hl = je;
class f2 extends hl.Provider {
  constructor(t, r, n) {
    super(n), this.configuration = t, this.updater = r, this.baseUrl = (0, fl.newBaseUrl)(this.configuration.url);
  }
  get channel() {
    const t = this.updater.channel || this.configuration.channel;
    return t == null ? this.getDefaultChannelName() : this.getCustomChannelName(t);
  }
  async getLatestVersion() {
    const t = (0, fl.getChannelFilename)(this.channel), r = (0, fl.newUrlFromBase)(t, this.baseUrl, this.updater.isAddNoCacheQuery);
    for (let n = 0; ; n++)
      try {
        return (0, hl.parseUpdateInfo)(await this.httpRequest(r), t, r);
      } catch (i) {
        if (i instanceof Sm.HttpError && i.statusCode === 404)
          throw (0, Sm.newError)(`Cannot find channel "${t}" update info: ${i.stack || i.message}`, "ERR_UPDATER_CHANNEL_FILE_NOT_FOUND");
        if (i.code === "ECONNREFUSED" && n < 3) {
          await new Promise((s, a) => {
            try {
              setTimeout(s, 1e3 * n);
            } catch (o) {
              a(o);
            }
          });
          continue;
        }
        throw i;
      }
  }
  resolveFiles(t) {
    return (0, hl.resolveFiles)(t, this.baseUrl);
  }
}
ca.GenericProvider = f2;
var pc = {}, mc = {};
Object.defineProperty(mc, "__esModule", { value: !0 });
mc.BitbucketProvider = void 0;
const Pm = Ve, pl = ar, ml = je;
class h2 extends ml.Provider {
  constructor(t, r, n) {
    super({
      ...n,
      isUseMultipleRangeRequest: !1
    }), this.configuration = t, this.updater = r;
    const { owner: i, slug: s } = t;
    this.baseUrl = (0, pl.newBaseUrl)(`https://api.bitbucket.org/2.0/repositories/${i}/${s}/downloads`);
  }
  get channel() {
    return this.updater.channel || this.configuration.channel || "latest";
  }
  async getLatestVersion() {
    const t = new Pm.CancellationToken(), r = (0, pl.getChannelFilename)(this.getCustomChannelName(this.channel)), n = (0, pl.newUrlFromBase)(r, this.baseUrl, this.updater.isAddNoCacheQuery);
    try {
      const i = await this.httpRequest(n, void 0, t);
      return (0, ml.parseUpdateInfo)(i, r, n);
    } catch (i) {
      throw (0, Pm.newError)(`Unable to find latest version on ${this.toString()}, please ensure release exists: ${i.stack || i.message}`, "ERR_UPDATER_LATEST_VERSION_NOT_FOUND");
    }
  }
  resolveFiles(t) {
    return (0, ml.resolveFiles)(t, this.baseUrl);
  }
  toString() {
    const { owner: t, slug: r } = this.configuration;
    return `Bitbucket (owner: ${t}, slug: ${r}, channel: ${this.channel})`;
  }
}
mc.BitbucketProvider = h2;
var pn = {};
Object.defineProperty(pn, "__esModule", { value: !0 });
pn.GitHubProvider = pn.BaseGitHubProvider = void 0;
pn.computeReleaseNotes = mv;
const Nr = Ve, $i = cf, p2 = yn, wi = ar, iu = je, yl = /\/tag\/([^/]+)$/;
class pv extends iu.Provider {
  constructor(t, r, n) {
    super({
      ...n,
      /* because GitHib uses S3 */
      isUseMultipleRangeRequest: !1
    }), this.options = t, this.baseUrl = (0, wi.newBaseUrl)((0, Nr.githubUrl)(t, r));
    const i = r === "github.com" ? "api.github.com" : r;
    this.baseApiUrl = (0, wi.newBaseUrl)((0, Nr.githubUrl)(t, i));
  }
  computeGithubBasePath(t) {
    const r = this.options.host;
    return r && !["github.com", "api.github.com"].includes(r) ? `/api/v3${t}` : t;
  }
}
pn.BaseGitHubProvider = pv;
class m2 extends pv {
  constructor(t, r, n) {
    super(t, "github.com", n), this.options = t, this.updater = r;
  }
  get channel() {
    const t = this.updater.channel || this.options.channel;
    return t == null ? this.getDefaultChannelName() : this.getCustomChannelName(t);
  }
  async getLatestVersion() {
    var t, r, n, i, s;
    const a = new Nr.CancellationToken(), o = await this.httpRequest((0, wi.newUrlFromBase)(`${this.basePath}.atom`, this.baseUrl), {
      accept: "application/xml, application/atom+xml, text/xml, */*"
    }, a), c = (0, Nr.parseXml)(o);
    let u = c.element("entry", !1, "No published versions on GitHub"), l = null;
    try {
      if (this.updater.allowPrerelease) {
        const v = ((t = this.updater) === null || t === void 0 ? void 0 : t.channel) || ((r = $i.prerelease(this.updater.currentVersion)) === null || r === void 0 ? void 0 : r[0]) || null;
        if (v === null)
          l = yl.exec(u.element("link").attribute("href"))[1];
        else
          for (const m of c.getElements("entry")) {
            const E = yl.exec(m.element("link").attribute("href"));
            if (E === null)
              continue;
            const T = E[1], R = ((n = $i.prerelease(T)) === null || n === void 0 ? void 0 : n[0]) || null, F = !v || ["alpha", "beta"].includes(v), H = R !== null && !["alpha", "beta"].includes(String(R));
            if (F && !H && !(v === "beta" && R === "alpha")) {
              l = T;
              break;
            }
            if (R && R === v) {
              l = T;
              break;
            }
          }
      } else {
        l = await this.getLatestTagName(a);
        for (const v of c.getElements("entry"))
          if (yl.exec(v.element("link").attribute("href"))[1] === l) {
            u = v;
            break;
          }
      }
    } catch (v) {
      throw (0, Nr.newError)(`Cannot parse releases feed: ${v.stack || v.message},
XML:
${o}`, "ERR_UPDATER_INVALID_RELEASE_FEED");
    }
    if (l == null)
      throw (0, Nr.newError)("No published versions on GitHub", "ERR_UPDATER_NO_PUBLISHED_VERSIONS");
    let d, h = "", p = "";
    const $ = async (v) => {
      h = (0, wi.getChannelFilename)(v), p = (0, wi.newUrlFromBase)(this.getBaseDownloadPath(String(l), h), this.baseUrl);
      const m = this.createRequestOptions(p);
      try {
        return await this.executor.request(m, a);
      } catch (E) {
        throw E instanceof Nr.HttpError && E.statusCode === 404 ? (0, Nr.newError)(`Cannot find ${h} in the latest release artifacts (${p}): ${E.stack || E.message}`, "ERR_UPDATER_CHANNEL_FILE_NOT_FOUND") : E;
      }
    };
    try {
      let v = this.channel;
      this.updater.allowPrerelease && (!((i = $i.prerelease(l)) === null || i === void 0) && i[0]) && (v = this.getCustomChannelName(String((s = $i.prerelease(l)) === null || s === void 0 ? void 0 : s[0]))), d = await $(v);
    } catch (v) {
      if (this.updater.allowPrerelease)
        d = await $(this.getDefaultChannelName());
      else
        throw v;
    }
    const _ = (0, iu.parseUpdateInfo)(d, h, p);
    return _.releaseName == null && (_.releaseName = u.elementValueOrEmpty("title")), _.releaseNotes == null && (_.releaseNotes = mv(this.updater.currentVersion, this.updater.fullChangelog, c, u)), {
      tag: l,
      ..._
    };
  }
  async getLatestTagName(t) {
    const r = this.options, n = r.host == null || r.host === "github.com" ? (0, wi.newUrlFromBase)(`${this.basePath}/latest`, this.baseUrl) : new p2.URL(`${this.computeGithubBasePath(`/repos/${r.owner}/${r.repo}/releases`)}/latest`, this.baseApiUrl);
    try {
      const i = await this.httpRequest(n, { Accept: "application/json" }, t);
      return i == null ? null : JSON.parse(i).tag_name;
    } catch (i) {
      throw (0, Nr.newError)(`Unable to find latest version on GitHub (${n}), please ensure a production release exists: ${i.stack || i.message}`, "ERR_UPDATER_LATEST_VERSION_NOT_FOUND");
    }
  }
  get basePath() {
    return `/${this.options.owner}/${this.options.repo}/releases`;
  }
  resolveFiles(t) {
    return (0, iu.resolveFiles)(t, this.baseUrl, (r) => this.getBaseDownloadPath(t.tag, r.replace(/ /g, "-")));
  }
  getBaseDownloadPath(t, r) {
    return `${this.basePath}/download/${t}/${r}`;
  }
}
pn.GitHubProvider = m2;
function Tm(e) {
  const t = e.elementValueOrEmpty("content");
  return t === "No content." ? "" : t;
}
function mv(e, t, r, n) {
  if (!t)
    return Tm(n);
  const i = [];
  for (const s of r.getElements("entry")) {
    const a = /\/tag\/v?([^/]+)$/.exec(s.element("link").attribute("href"))[1];
    $i.lt(e, a) && i.push({
      version: a,
      note: Tm(s)
    });
  }
  return i.sort((s, a) => $i.rcompare(s.version, a.version));
}
var yc = {};
Object.defineProperty(yc, "__esModule", { value: !0 });
yc.GitLabProvider = void 0;
const ut = Ve, gl = yn, y2 = fv, Ka = ar, _l = je;
class g2 extends _l.Provider {
  /**
   * Normalizes filenames by replacing spaces and underscores with dashes.
   *
   * This is a workaround to handle filename formatting differences between tools:
   * - electron-builder formats filenames like "test file.txt" as "test-file.txt"
   * - GitLab may provide asset URLs using underscores, such as "test_file.txt"
   *
   * Because of this mismatch, we can't reliably extract the correct filename from
   * the asset path without normalization. This function ensures consistent matching
   * across different filename formats by converting all spaces and underscores to dashes.
   *
   * @param filename The filename to normalize
   * @returns The normalized filename with spaces and underscores replaced by dashes
   */
  normalizeFilename(t) {
    return t.replace(/ |_/g, "-");
  }
  constructor(t, r, n) {
    super({
      ...n,
      // GitLab might not support multiple range requests efficiently
      isUseMultipleRangeRequest: !1
    }), this.options = t, this.updater = r, this.cachedLatestVersion = null;
    const s = t.host || "gitlab.com";
    this.baseApiUrl = (0, Ka.newBaseUrl)(`https://${s}/api/v4`);
  }
  get channel() {
    const t = this.updater.channel || this.options.channel;
    return t == null ? this.getDefaultChannelName() : this.getCustomChannelName(t);
  }
  async getLatestVersion() {
    const t = new ut.CancellationToken(), r = (0, Ka.newUrlFromBase)(`projects/${this.options.projectId}/releases/permalink/latest`, this.baseApiUrl);
    let n;
    try {
      const h = { "Content-Type": "application/json", ...this.setAuthHeaderForToken(this.options.token || null) }, p = await this.httpRequest(r, h, t);
      if (!p)
        throw (0, ut.newError)("No latest release found", "ERR_UPDATER_NO_PUBLISHED_VERSIONS");
      n = JSON.parse(p);
    } catch (h) {
      throw (0, ut.newError)(`Unable to find latest release on GitLab (${r}): ${h.stack || h.message}`, "ERR_UPDATER_LATEST_VERSION_NOT_FOUND");
    }
    const i = n.tag_name;
    let s = null, a = "", o = null;
    const c = async (h) => {
      a = (0, Ka.getChannelFilename)(h);
      const p = n.assets.links.find((_) => _.name === a);
      if (!p)
        throw (0, ut.newError)(`Cannot find ${a} in the latest release assets`, "ERR_UPDATER_CHANNEL_FILE_NOT_FOUND");
      o = new gl.URL(p.direct_asset_url);
      const $ = this.options.token ? { "PRIVATE-TOKEN": this.options.token } : void 0;
      try {
        const _ = await this.httpRequest(o, $, t);
        if (!_)
          throw (0, ut.newError)(`Empty response from ${o}`, "ERR_UPDATER_CHANNEL_FILE_NOT_FOUND");
        return _;
      } catch (_) {
        throw _ instanceof ut.HttpError && _.statusCode === 404 ? (0, ut.newError)(`Cannot find ${a} in the latest release artifacts (${o}): ${_.stack || _.message}`, "ERR_UPDATER_CHANNEL_FILE_NOT_FOUND") : _;
      }
    };
    try {
      s = await c(this.channel);
    } catch (h) {
      if (this.channel !== this.getDefaultChannelName())
        s = await c(this.getDefaultChannelName());
      else
        throw h;
    }
    if (!s)
      throw (0, ut.newError)(`Unable to parse channel data from ${a}`, "ERR_UPDATER_INVALID_UPDATE_INFO");
    const u = (0, _l.parseUpdateInfo)(s, a, o);
    u.releaseName == null && (u.releaseName = n.name), u.releaseNotes == null && (u.releaseNotes = n.description || null);
    const l = /* @__PURE__ */ new Map();
    for (const h of n.assets.links)
      l.set(this.normalizeFilename(h.name), h.direct_asset_url);
    const d = {
      tag: i,
      assets: l,
      ...u
    };
    return this.cachedLatestVersion = d, d;
  }
  /**
   * Utility function to convert GitlabReleaseAsset to Map<string, string>
   * Maps asset names to their download URLs
   */
  convertAssetsToMap(t) {
    const r = /* @__PURE__ */ new Map();
    for (const n of t.links)
      r.set(this.normalizeFilename(n.name), n.direct_asset_url);
    return r;
  }
  /**
   * Find blockmap file URL in assets map for a specific filename
   */
  findBlockMapInAssets(t, r) {
    const n = [`${r}.blockmap`, `${this.normalizeFilename(r)}.blockmap`];
    for (const i of n) {
      const s = t.get(i);
      if (s)
        return new gl.URL(s);
    }
    return null;
  }
  async fetchReleaseInfoByVersion(t) {
    const r = new ut.CancellationToken(), n = [`v${t}`, t];
    for (const i of n) {
      const s = (0, Ka.newUrlFromBase)(`projects/${this.options.projectId}/releases/${encodeURIComponent(i)}`, this.baseApiUrl);
      try {
        const a = { "Content-Type": "application/json", ...this.setAuthHeaderForToken(this.options.token || null) }, o = await this.httpRequest(s, a, r);
        if (o)
          return JSON.parse(o);
      } catch (a) {
        if (a instanceof ut.HttpError && a.statusCode === 404)
          continue;
        throw (0, ut.newError)(`Unable to find release ${i} on GitLab (${s}): ${a.stack || a.message}`, "ERR_UPDATER_RELEASE_NOT_FOUND");
      }
    }
    throw (0, ut.newError)(`Unable to find release with version ${t} (tried: ${n.join(", ")}) on GitLab`, "ERR_UPDATER_RELEASE_NOT_FOUND");
  }
  setAuthHeaderForToken(t) {
    const r = {};
    return t != null && (t.startsWith("Bearer") ? r.authorization = t : r["PRIVATE-TOKEN"] = t), r;
  }
  /**
   * Get version info for blockmap files, using cache when possible
   */
  async getVersionInfoForBlockMap(t) {
    if (this.cachedLatestVersion && this.cachedLatestVersion.version === t)
      return this.cachedLatestVersion.assets;
    const r = await this.fetchReleaseInfoByVersion(t);
    return r && r.assets ? this.convertAssetsToMap(r.assets) : null;
  }
  /**
   * Find blockmap URLs from version assets
   */
  async findBlockMapUrlsFromAssets(t, r, n) {
    let i = null, s = null;
    const a = await this.getVersionInfoForBlockMap(r);
    a && (i = this.findBlockMapInAssets(a, n));
    const o = await this.getVersionInfoForBlockMap(t);
    if (o) {
      const c = n.replace(new RegExp(y2(r), "g"), t);
      s = this.findBlockMapInAssets(o, c);
    }
    return [s, i];
  }
  async getBlockMapFiles(t, r, n, i = null) {
    if (this.options.uploadTarget === "project_upload") {
      const s = t.pathname.split("/").pop() || "", [a, o] = await this.findBlockMapUrlsFromAssets(r, n, s);
      if (!o)
        throw (0, ut.newError)(`Cannot find blockmap file for ${n} in GitLab assets`, "ERR_UPDATER_BLOCKMAP_FILE_NOT_FOUND");
      if (!a)
        throw (0, ut.newError)(`Cannot find blockmap file for ${r} in GitLab assets`, "ERR_UPDATER_BLOCKMAP_FILE_NOT_FOUND");
      return [a, o];
    } else
      return super.getBlockMapFiles(t, r, n, i);
  }
  resolveFiles(t) {
    return (0, _l.getFileList)(t).map((r) => {
      const i = [
        r.url,
        // Original filename
        this.normalizeFilename(r.url)
        // Normalized filename (spaces/underscores → dashes)
      ].find((a) => t.assets.has(a)), s = i ? t.assets.get(i) : void 0;
      if (!s)
        throw (0, ut.newError)(`Cannot find asset "${r.url}" in GitLab release assets. Available assets: ${Array.from(t.assets.keys()).join(", ")}`, "ERR_UPDATER_ASSET_NOT_FOUND");
      return {
        url: new gl.URL(s),
        info: r
      };
    });
  }
  toString() {
    return `GitLab (projectId: ${this.options.projectId}, channel: ${this.channel})`;
  }
}
yc.GitLabProvider = g2;
var gc = {};
Object.defineProperty(gc, "__esModule", { value: !0 });
gc.KeygenProvider = void 0;
const Nm = Ve, vl = ar, $l = je;
class _2 extends $l.Provider {
  constructor(t, r, n) {
    super({
      ...n,
      isUseMultipleRangeRequest: !1
    }), this.configuration = t, this.updater = r, this.defaultHostname = "api.keygen.sh";
    const i = this.configuration.host || this.defaultHostname;
    this.baseUrl = (0, vl.newBaseUrl)(`https://${i}/v1/accounts/${this.configuration.account}/artifacts?product=${this.configuration.product}`);
  }
  get channel() {
    return this.updater.channel || this.configuration.channel || "stable";
  }
  async getLatestVersion() {
    const t = new Nm.CancellationToken(), r = (0, vl.getChannelFilename)(this.getCustomChannelName(this.channel)), n = (0, vl.newUrlFromBase)(r, this.baseUrl, this.updater.isAddNoCacheQuery);
    try {
      const i = await this.httpRequest(n, {
        Accept: "application/vnd.api+json",
        "Keygen-Version": "1.1"
      }, t);
      return (0, $l.parseUpdateInfo)(i, r, n);
    } catch (i) {
      throw (0, Nm.newError)(`Unable to find latest version on ${this.toString()}, please ensure release exists: ${i.stack || i.message}`, "ERR_UPDATER_LATEST_VERSION_NOT_FOUND");
    }
  }
  resolveFiles(t) {
    return (0, $l.resolveFiles)(t, this.baseUrl);
  }
  toString() {
    const { account: t, product: r, platform: n } = this.configuration;
    return `Keygen (account: ${t}, product: ${r}, platform: ${n}, channel: ${this.channel})`;
  }
}
gc.KeygenProvider = _2;
var _c = {};
Object.defineProperty(_c, "__esModule", { value: !0 });
_c.PrivateGitHubProvider = void 0;
const oi = Ve, v2 = Ze, $2 = Re, Om = yn, Am = ar, w2 = pn, E2 = je;
class b2 extends w2.BaseGitHubProvider {
  constructor(t, r, n, i) {
    super(t, "api.github.com", i), this.updater = r, this.token = n;
  }
  createRequestOptions(t, r) {
    const n = super.createRequestOptions(t, r);
    return n.redirect = "manual", n;
  }
  async getLatestVersion() {
    const t = new oi.CancellationToken(), r = (0, Am.getChannelFilename)(this.getDefaultChannelName()), n = await this.getLatestVersionInfo(t), i = n.assets.find((o) => o.name === r);
    if (i == null)
      throw (0, oi.newError)(`Cannot find ${r} in the release ${n.html_url || n.name}`, "ERR_UPDATER_CHANNEL_FILE_NOT_FOUND");
    const s = new Om.URL(i.url);
    let a;
    try {
      a = (0, v2.load)(await this.httpRequest(s, this.configureHeaders("application/octet-stream"), t));
    } catch (o) {
      throw o instanceof oi.HttpError && o.statusCode === 404 ? (0, oi.newError)(`Cannot find ${r} in the latest release artifacts (${s}): ${o.stack || o.message}`, "ERR_UPDATER_CHANNEL_FILE_NOT_FOUND") : o;
    }
    return a.assets = n.assets, a;
  }
  get fileExtraDownloadHeaders() {
    return this.configureHeaders("application/octet-stream");
  }
  configureHeaders(t) {
    return {
      accept: t,
      authorization: `token ${this.token}`
    };
  }
  async getLatestVersionInfo(t) {
    const r = this.updater.allowPrerelease;
    let n = this.basePath;
    r || (n = `${n}/latest`);
    const i = (0, Am.newUrlFromBase)(n, this.baseUrl);
    try {
      const s = JSON.parse(await this.httpRequest(i, this.configureHeaders("application/vnd.github.v3+json"), t));
      return r ? s.find((a) => a.prerelease) || s[0] : s;
    } catch (s) {
      throw (0, oi.newError)(`Unable to find latest version on GitHub (${i}), please ensure a production release exists: ${s.stack || s.message}`, "ERR_UPDATER_LATEST_VERSION_NOT_FOUND");
    }
  }
  get basePath() {
    return this.computeGithubBasePath(`/repos/${this.options.owner}/${this.options.repo}/releases`);
  }
  resolveFiles(t) {
    return (0, E2.getFileList)(t).map((r) => {
      const n = $2.posix.basename(r.url).replace(/ /g, "-"), i = t.assets.find((s) => s != null && s.name === n);
      if (i == null)
        throw (0, oi.newError)(`Cannot find asset "${n}" in: ${JSON.stringify(t.assets, null, 2)}`, "ERR_UPDATER_ASSET_NOT_FOUND");
      return {
        url: new Om.URL(i.url),
        info: r
      };
    });
  }
}
_c.PrivateGitHubProvider = b2;
Object.defineProperty(pc, "__esModule", { value: !0 });
pc.isUrlProbablySupportMultiRangeRequests = yv;
pc.createClient = A2;
const Wa = Ve, S2 = mc, Cm = ca, P2 = pn, T2 = yc, N2 = gc, O2 = _c;
function yv(e) {
  return !e.includes("s3.amazonaws.com");
}
function A2(e, t, r) {
  if (typeof e == "string")
    throw (0, Wa.newError)("Please pass PublishConfiguration object", "ERR_UPDATER_INVALID_PROVIDER_CONFIGURATION");
  const n = e.provider;
  switch (n) {
    case "github": {
      const i = e, s = (i.private ? process.env.GH_TOKEN || process.env.GITHUB_TOKEN : null) || i.token;
      return s == null ? new P2.GitHubProvider(i, t, r) : new O2.PrivateGitHubProvider(i, t, s, r);
    }
    case "bitbucket":
      return new S2.BitbucketProvider(e, t, r);
    case "gitlab":
      return new T2.GitLabProvider(e, t, r);
    case "keygen":
      return new N2.KeygenProvider(e, t, r);
    case "s3":
    case "spaces":
      return new Cm.GenericProvider({
        provider: "generic",
        url: (0, Wa.getS3LikeProviderBaseUrl)(e),
        channel: e.channel || null
      }, t, {
        ...r,
        // https://github.com/minio/minio/issues/5285#issuecomment-350428955
        isUseMultipleRangeRequest: !1
      });
    case "generic": {
      const i = e;
      return new Cm.GenericProvider(i, t, {
        ...r,
        isUseMultipleRangeRequest: i.useMultipleRangeRequest !== !1 && yv(i.url)
      });
    }
    case "custom": {
      const i = e, s = i.updateProvider;
      if (!s)
        throw (0, Wa.newError)("Custom provider not specified", "ERR_UPDATER_INVALID_PROVIDER_CONFIGURATION");
      return new s(i, t, r);
    }
    default:
      throw (0, Wa.newError)(`Unsupported provider: ${n}`, "ERR_UPDATER_UNSUPPORTED_PROVIDER");
  }
}
var vc = {}, la = {}, Yi = {}, Jn = {};
Object.defineProperty(Jn, "__esModule", { value: !0 });
Jn.OperationKind = void 0;
Jn.computeOperations = C2;
var Un;
(function(e) {
  e[e.COPY = 0] = "COPY", e[e.DOWNLOAD = 1] = "DOWNLOAD";
})(Un || (Jn.OperationKind = Un = {}));
function C2(e, t, r) {
  const n = Im(e.files), i = Im(t.files);
  let s = null;
  const a = t.files[0], o = [], c = a.name, u = n.get(c);
  if (u == null)
    throw new Error(`no file ${c} in old blockmap`);
  const l = i.get(c);
  let d = 0;
  const { checksumToOffset: h, checksumToOldSize: p } = I2(n.get(c), u.offset, r);
  let $ = a.offset;
  for (let _ = 0; _ < l.checksums.length; $ += l.sizes[_], _++) {
    const v = l.sizes[_], m = l.checksums[_];
    let E = h.get(m);
    E != null && p.get(m) !== v && (r.warn(`Checksum ("${m}") matches, but size differs (old: ${p.get(m)}, new: ${v})`), E = void 0), E === void 0 ? (d++, s != null && s.kind === Un.DOWNLOAD && s.end === $ ? s.end += v : (s = {
      kind: Un.DOWNLOAD,
      start: $,
      end: $ + v
      // oldBlocks: null,
    }, Rm(s, o, m, _))) : s != null && s.kind === Un.COPY && s.end === E ? s.end += v : (s = {
      kind: Un.COPY,
      start: E,
      end: E + v
      // oldBlocks: [checksum]
    }, Rm(s, o, m, _));
  }
  return d > 0 && r.info(`File${a.name === "file" ? "" : " " + a.name} has ${d} changed blocks`), o;
}
const R2 = process.env.DIFFERENTIAL_DOWNLOAD_PLAN_BUILDER_VALIDATE_RANGES === "true";
function Rm(e, t, r, n) {
  if (R2 && t.length !== 0) {
    const i = t[t.length - 1];
    if (i.kind === e.kind && e.start < i.end && e.start > i.start) {
      const s = [i.start, i.end, e.start, e.end].reduce((a, o) => a < o ? a : o);
      throw new Error(`operation (block index: ${n}, checksum: ${r}, kind: ${Un[e.kind]}) overlaps previous operation (checksum: ${r}):
abs: ${i.start} until ${i.end} and ${e.start} until ${e.end}
rel: ${i.start - s} until ${i.end - s} and ${e.start - s} until ${e.end - s}`);
    }
  }
  t.push(e);
}
function I2(e, t, r) {
  const n = /* @__PURE__ */ new Map(), i = /* @__PURE__ */ new Map();
  let s = t;
  for (let a = 0; a < e.checksums.length; a++) {
    const o = e.checksums[a], c = e.sizes[a], u = i.get(o);
    if (u === void 0)
      n.set(o, s), i.set(o, c);
    else if (r.debug != null) {
      const l = u === c ? "(same size)" : `(size: ${u}, this size: ${c})`;
      r.debug(`${o} duplicated in blockmap ${l}, it doesn't lead to broken differential downloader, just corresponding block will be skipped)`);
    }
    s += c;
  }
  return { checksumToOffset: n, checksumToOldSize: i };
}
function Im(e) {
  const t = /* @__PURE__ */ new Map();
  for (const r of e)
    t.set(r.name, r);
  return t;
}
Object.defineProperty(Yi, "__esModule", { value: !0 });
Yi.DataSplitter = void 0;
Yi.copyData = gv;
const Ya = Ve, D2 = mn, k2 = zs, F2 = Jn, Dm = Buffer.from(`\r
\r
`);
var Jr;
(function(e) {
  e[e.INIT = 0] = "INIT", e[e.HEADER = 1] = "HEADER", e[e.BODY = 2] = "BODY";
})(Jr || (Jr = {}));
function gv(e, t, r, n, i) {
  const s = (0, D2.createReadStream)("", {
    fd: r,
    autoClose: !1,
    start: e.start,
    // end is inclusive
    end: e.end - 1
  });
  s.on("error", n), s.once("end", i), s.pipe(t, {
    end: !1
  });
}
class j2 extends k2.Writable {
  constructor(t, r, n, i, s, a) {
    super(), this.out = t, this.options = r, this.partIndexToTaskIndex = n, this.partIndexToLength = s, this.finishHandler = a, this.partIndex = -1, this.headerListBuffer = null, this.readState = Jr.INIT, this.ignoreByteCount = 0, this.remainingPartDataCount = 0, this.actualPartLength = 0, this.boundaryLength = i.length + 4, this.ignoreByteCount = this.boundaryLength - 2;
  }
  get isFinished() {
    return this.partIndex === this.partIndexToLength.length;
  }
  // noinspection JSUnusedGlobalSymbols
  _write(t, r, n) {
    if (this.isFinished) {
      console.error(`Trailing ignored data: ${t.length} bytes`);
      return;
    }
    this.handleData(t).then(n).catch(n);
  }
  async handleData(t) {
    let r = 0;
    if (this.ignoreByteCount !== 0 && this.remainingPartDataCount !== 0)
      throw (0, Ya.newError)("Internal error", "ERR_DATA_SPLITTER_BYTE_COUNT_MISMATCH");
    if (this.ignoreByteCount > 0) {
      const n = Math.min(this.ignoreByteCount, t.length);
      this.ignoreByteCount -= n, r = n;
    } else if (this.remainingPartDataCount > 0) {
      const n = Math.min(this.remainingPartDataCount, t.length);
      this.remainingPartDataCount -= n, await this.processPartData(t, 0, n), r = n;
    }
    if (r !== t.length) {
      if (this.readState === Jr.HEADER) {
        const n = this.searchHeaderListEnd(t, r);
        if (n === -1)
          return;
        r = n, this.readState = Jr.BODY, this.headerListBuffer = null;
      }
      for (; ; ) {
        if (this.readState === Jr.BODY)
          this.readState = Jr.INIT;
        else {
          this.partIndex++;
          let a = this.partIndexToTaskIndex.get(this.partIndex);
          if (a == null)
            if (this.isFinished)
              a = this.options.end;
            else
              throw (0, Ya.newError)("taskIndex is null", "ERR_DATA_SPLITTER_TASK_INDEX_IS_NULL");
          const o = this.partIndex === 0 ? this.options.start : this.partIndexToTaskIndex.get(this.partIndex - 1) + 1;
          if (o < a)
            await this.copyExistingData(o, a);
          else if (o > a)
            throw (0, Ya.newError)("prevTaskIndex must be < taskIndex", "ERR_DATA_SPLITTER_TASK_INDEX_ASSERT_FAILED");
          if (this.isFinished) {
            this.onPartEnd(), this.finishHandler();
            return;
          }
          if (r = this.searchHeaderListEnd(t, r), r === -1) {
            this.readState = Jr.HEADER;
            return;
          }
        }
        const n = this.partIndexToLength[this.partIndex], i = r + n, s = Math.min(i, t.length);
        if (await this.processPartStarted(t, r, s), this.remainingPartDataCount = n - (s - r), this.remainingPartDataCount > 0)
          return;
        if (r = i + this.boundaryLength, r >= t.length) {
          this.ignoreByteCount = this.boundaryLength - (t.length - i);
          return;
        }
      }
    }
  }
  copyExistingData(t, r) {
    return new Promise((n, i) => {
      const s = () => {
        if (t === r) {
          n();
          return;
        }
        const a = this.options.tasks[t];
        if (a.kind !== F2.OperationKind.COPY) {
          i(new Error("Task kind must be COPY"));
          return;
        }
        gv(a, this.out, this.options.oldFileFd, i, () => {
          t++, s();
        });
      };
      s();
    });
  }
  searchHeaderListEnd(t, r) {
    const n = t.indexOf(Dm, r);
    if (n !== -1)
      return n + Dm.length;
    const i = r === 0 ? t : t.slice(r);
    return this.headerListBuffer == null ? this.headerListBuffer = i : this.headerListBuffer = Buffer.concat([this.headerListBuffer, i]), -1;
  }
  onPartEnd() {
    const t = this.partIndexToLength[this.partIndex - 1];
    if (this.actualPartLength !== t)
      throw (0, Ya.newError)(`Expected length: ${t} differs from actual: ${this.actualPartLength}`, "ERR_DATA_SPLITTER_LENGTH_MISMATCH");
    this.actualPartLength = 0;
  }
  processPartStarted(t, r, n) {
    return this.partIndex !== 0 && this.onPartEnd(), this.processPartData(t, r, n);
  }
  processPartData(t, r, n) {
    this.actualPartLength += n - r;
    const i = this.out;
    return i.write(r === 0 && t.length === n ? t : t.slice(r, n)) ? Promise.resolve() : new Promise((s, a) => {
      i.on("error", a), i.once("drain", () => {
        i.removeListener("error", a), s();
      });
    });
  }
}
Yi.DataSplitter = j2;
var $c = {};
Object.defineProperty($c, "__esModule", { value: !0 });
$c.executeTasksUsingMultipleRangeRequests = L2;
$c.checkIsRangesSupported = au;
const su = Ve, km = Yi, Fm = Jn;
function L2(e, t, r, n, i) {
  const s = (a) => {
    if (a >= t.length) {
      e.fileMetadataBuffer != null && r.write(e.fileMetadataBuffer), r.end();
      return;
    }
    const o = a + 1e3;
    U2(e, {
      tasks: t,
      start: a,
      end: Math.min(t.length, o),
      oldFileFd: n
    }, r, () => s(o), i);
  };
  return s;
}
function U2(e, t, r, n, i) {
  let s = "bytes=", a = 0;
  const o = /* @__PURE__ */ new Map(), c = [];
  for (let d = t.start; d < t.end; d++) {
    const h = t.tasks[d];
    h.kind === Fm.OperationKind.DOWNLOAD && (s += `${h.start}-${h.end - 1}, `, o.set(a, d), a++, c.push(h.end - h.start));
  }
  if (a <= 1) {
    const d = (h) => {
      if (h >= t.end) {
        n();
        return;
      }
      const p = t.tasks[h++];
      if (p.kind === Fm.OperationKind.COPY)
        (0, km.copyData)(p, r, t.oldFileFd, i, () => d(h));
      else {
        const $ = e.createRequestOptions();
        $.headers.Range = `bytes=${p.start}-${p.end - 1}`;
        const _ = e.httpExecutor.createRequest($, (v) => {
          v.on("error", i), au(v, i) && (v.pipe(r, {
            end: !1
          }), v.once("end", () => d(h)));
        });
        e.httpExecutor.addErrorAndTimeoutHandlers(_, i), _.end();
      }
    };
    d(t.start);
    return;
  }
  const u = e.createRequestOptions();
  u.headers.Range = s.substring(0, s.length - 2);
  const l = e.httpExecutor.createRequest(u, (d) => {
    if (!au(d, i))
      return;
    const h = (0, su.safeGetHeader)(d, "content-type"), p = /^multipart\/.+?\s*;\s*boundary=(?:"([^"]+)"|([^\s";]+))\s*$/i.exec(h);
    if (p == null) {
      i(new Error(`Content-Type "multipart/byteranges" is expected, but got "${h}"`));
      return;
    }
    const $ = new km.DataSplitter(r, t, o, p[1] || p[2], c, n);
    $.on("error", i), d.pipe($), d.on("end", () => {
      setTimeout(() => {
        l.abort(), i(new Error("Response ends without calling any handlers"));
      }, 1e4);
    });
  });
  e.httpExecutor.addErrorAndTimeoutHandlers(l, i), l.end();
}
function au(e, t) {
  if (e.statusCode >= 400)
    return t((0, su.createHttpError)(e)), !1;
  if (e.statusCode !== 206) {
    const r = (0, su.safeGetHeader)(e, "accept-ranges");
    if (r == null || r === "none")
      return t(new Error(`Server doesn't support Accept-Ranges (response code ${e.statusCode})`)), !1;
  }
  return !0;
}
var wc = {};
Object.defineProperty(wc, "__esModule", { value: !0 });
wc.ProgressDifferentialDownloadCallbackTransform = void 0;
const M2 = zs;
var Ei;
(function(e) {
  e[e.COPY = 0] = "COPY", e[e.DOWNLOAD = 1] = "DOWNLOAD";
})(Ei || (Ei = {}));
class x2 extends M2.Transform {
  constructor(t, r, n) {
    super(), this.progressDifferentialDownloadInfo = t, this.cancellationToken = r, this.onProgress = n, this.start = Date.now(), this.transferred = 0, this.delta = 0, this.expectedBytes = 0, this.index = 0, this.operationType = Ei.COPY, this.nextUpdate = this.start + 1e3;
  }
  _transform(t, r, n) {
    if (this.cancellationToken.cancelled) {
      n(new Error("cancelled"), null);
      return;
    }
    if (this.operationType == Ei.COPY) {
      n(null, t);
      return;
    }
    this.transferred += t.length, this.delta += t.length;
    const i = Date.now();
    i >= this.nextUpdate && this.transferred !== this.expectedBytes && this.transferred !== this.progressDifferentialDownloadInfo.grandTotal && (this.nextUpdate = i + 1e3, this.onProgress({
      total: this.progressDifferentialDownloadInfo.grandTotal,
      delta: this.delta,
      transferred: this.transferred,
      percent: this.transferred / this.progressDifferentialDownloadInfo.grandTotal * 100,
      bytesPerSecond: Math.round(this.transferred / ((i - this.start) / 1e3))
    }), this.delta = 0), n(null, t);
  }
  beginFileCopy() {
    this.operationType = Ei.COPY;
  }
  beginRangeDownload() {
    this.operationType = Ei.DOWNLOAD, this.expectedBytes += this.progressDifferentialDownloadInfo.expectedByteCounts[this.index++];
  }
  endRangeDownload() {
    this.transferred !== this.progressDifferentialDownloadInfo.grandTotal && this.onProgress({
      total: this.progressDifferentialDownloadInfo.grandTotal,
      delta: this.delta,
      transferred: this.transferred,
      percent: this.transferred / this.progressDifferentialDownloadInfo.grandTotal * 100,
      bytesPerSecond: Math.round(this.transferred / ((Date.now() - this.start) / 1e3))
    });
  }
  // Called when we are 100% done with the connection/download
  _flush(t) {
    if (this.cancellationToken.cancelled) {
      t(new Error("cancelled"));
      return;
    }
    this.onProgress({
      total: this.progressDifferentialDownloadInfo.grandTotal,
      delta: this.delta,
      transferred: this.transferred,
      percent: 100,
      bytesPerSecond: Math.round(this.transferred / ((Date.now() - this.start) / 1e3))
    }), this.delta = 0, this.transferred = 0, t(null);
  }
}
wc.ProgressDifferentialDownloadCallbackTransform = x2;
Object.defineProperty(la, "__esModule", { value: !0 });
la.DifferentialDownloader = void 0;
const cs = Ve, wl = gn, V2 = mn, q2 = Yi, B2 = yn, Xa = Jn, jm = $c, H2 = wc;
class G2 {
  // noinspection TypeScriptAbstractClassConstructorCanBeMadeProtected
  constructor(t, r, n) {
    this.blockAwareFileInfo = t, this.httpExecutor = r, this.options = n, this.fileMetadataBuffer = null, this.logger = n.logger;
  }
  createRequestOptions() {
    const t = {
      headers: {
        ...this.options.requestHeaders,
        accept: "*/*"
      }
    };
    return (0, cs.configureRequestUrl)(this.options.newUrl, t), (0, cs.configureRequestOptions)(t), t;
  }
  doDownload(t, r) {
    if (t.version !== r.version)
      throw new Error(`version is different (${t.version} - ${r.version}), full download is required`);
    const n = this.logger, i = (0, Xa.computeOperations)(t, r, n);
    n.debug != null && n.debug(JSON.stringify(i, null, 2));
    let s = 0, a = 0;
    for (const c of i) {
      const u = c.end - c.start;
      c.kind === Xa.OperationKind.DOWNLOAD ? s += u : a += u;
    }
    const o = this.blockAwareFileInfo.size;
    if (s + a + (this.fileMetadataBuffer == null ? 0 : this.fileMetadataBuffer.length) !== o)
      throw new Error(`Internal error, size mismatch: downloadSize: ${s}, copySize: ${a}, newSize: ${o}`);
    return n.info(`Full: ${Lm(o)}, To download: ${Lm(s)} (${Math.round(s / (o / 100))}%)`), this.downloadFile(i);
  }
  downloadFile(t) {
    const r = [], n = () => Promise.all(r.map((i) => (0, wl.close)(i.descriptor).catch((s) => {
      this.logger.error(`cannot close file "${i.path}": ${s}`);
    })));
    return this.doDownloadFile(t, r).then(n).catch((i) => n().catch((s) => {
      try {
        this.logger.error(`cannot close files: ${s}`);
      } catch (a) {
        try {
          console.error(a);
        } catch {
        }
      }
      throw i;
    }).then(() => {
      throw i;
    }));
  }
  async doDownloadFile(t, r) {
    const n = await (0, wl.open)(this.options.oldFile, "r");
    r.push({ descriptor: n, path: this.options.oldFile });
    const i = await (0, wl.open)(this.options.newFile, "w");
    r.push({ descriptor: i, path: this.options.newFile });
    const s = (0, V2.createWriteStream)(this.options.newFile, { fd: i });
    await new Promise((a, o) => {
      const c = [];
      let u;
      if (!this.options.isUseMultipleRangeRequest && this.options.onProgress) {
        const m = [];
        let E = 0;
        for (const R of t)
          R.kind === Xa.OperationKind.DOWNLOAD && (m.push(R.end - R.start), E += R.end - R.start);
        const T = {
          expectedByteCounts: m,
          grandTotal: E
        };
        u = new H2.ProgressDifferentialDownloadCallbackTransform(T, this.options.cancellationToken, this.options.onProgress), c.push(u);
      }
      const l = new cs.DigestTransform(this.blockAwareFileInfo.sha512);
      l.isValidateOnEnd = !1, c.push(l), s.on("finish", () => {
        s.close(() => {
          r.splice(1, 1);
          try {
            l.validate();
          } catch (m) {
            o(m);
            return;
          }
          a(void 0);
        });
      }), c.push(s);
      let d = null;
      for (const m of c)
        m.on("error", o), d == null ? d = m : d = d.pipe(m);
      const h = c[0];
      let p;
      if (this.options.isUseMultipleRangeRequest) {
        p = (0, jm.executeTasksUsingMultipleRangeRequests)(this, t, h, n, o), p(0);
        return;
      }
      let $ = 0, _ = null;
      this.logger.info(`Differential download: ${this.options.newUrl}`);
      const v = this.createRequestOptions();
      v.redirect = "manual", p = (m) => {
        var E, T;
        if (m >= t.length) {
          this.fileMetadataBuffer != null && h.write(this.fileMetadataBuffer), h.end();
          return;
        }
        const R = t[m++];
        if (R.kind === Xa.OperationKind.COPY) {
          u && u.beginFileCopy(), (0, q2.copyData)(R, h, n, o, () => p(m));
          return;
        }
        const F = `bytes=${R.start}-${R.end - 1}`;
        v.headers.range = F, (T = (E = this.logger) === null || E === void 0 ? void 0 : E.debug) === null || T === void 0 || T.call(E, `download range: ${F}`), u && u.beginRangeDownload();
        const H = this.httpExecutor.createRequest(v, (G) => {
          G.on("error", o), G.on("aborted", () => {
            o(new Error("response has been aborted by the server"));
          }), G.statusCode >= 400 && o((0, cs.createHttpError)(G)), G.pipe(h, {
            end: !1
          }), G.once("end", () => {
            u && u.endRangeDownload(), ++$ === 100 ? ($ = 0, setTimeout(() => p(m), 1e3)) : p(m);
          });
        });
        H.on("redirect", (G, ie, C) => {
          this.logger.info(`Redirect to ${z2(C)}`), _ = C, (0, cs.configureRequestUrl)(new B2.URL(_), v), H.followRedirect();
        }), this.httpExecutor.addErrorAndTimeoutHandlers(H, o), H.end();
      }, p(0);
    });
  }
  async readRemoteBytes(t, r) {
    const n = Buffer.allocUnsafe(r + 1 - t), i = this.createRequestOptions();
    i.headers.range = `bytes=${t}-${r}`;
    let s = 0;
    if (await this.request(i, (a) => {
      a.copy(n, s), s += a.length;
    }), s !== n.length)
      throw new Error(`Received data length ${s} is not equal to expected ${n.length}`);
    return n;
  }
  request(t, r) {
    return new Promise((n, i) => {
      const s = this.httpExecutor.createRequest(t, (a) => {
        (0, jm.checkIsRangesSupported)(a, i) && (a.on("error", i), a.on("aborted", () => {
          i(new Error("response has been aborted by the server"));
        }), a.on("data", r), a.on("end", () => n()));
      });
      this.httpExecutor.addErrorAndTimeoutHandlers(s, i), s.end();
    });
  }
}
la.DifferentialDownloader = G2;
function Lm(e, t = " KB") {
  return new Intl.NumberFormat("en").format((e / 1024).toFixed(2)) + t;
}
function z2(e) {
  const t = e.indexOf("?");
  return t < 0 ? e : e.substring(0, t);
}
Object.defineProperty(vc, "__esModule", { value: !0 });
vc.GenericDifferentialDownloader = void 0;
const K2 = la;
class W2 extends K2.DifferentialDownloader {
  download(t, r) {
    return this.doDownload(t, r);
  }
}
vc.GenericDifferentialDownloader = W2;
var _n = {};
(function(e) {
  Object.defineProperty(e, "__esModule", { value: !0 }), e.UpdaterSignal = e.UPDATE_DOWNLOADED = e.DOWNLOAD_PROGRESS = e.CancellationToken = void 0, e.addHandler = n;
  const t = Ve;
  Object.defineProperty(e, "CancellationToken", { enumerable: !0, get: function() {
    return t.CancellationToken;
  } }), e.DOWNLOAD_PROGRESS = "download-progress", e.UPDATE_DOWNLOADED = "update-downloaded";
  class r {
    constructor(s) {
      this.emitter = s;
    }
    /**
     * Emitted when an authenticating proxy is [asking for user credentials](https://github.com/electron/electron/blob/master/docs/api/client-request.md#event-login).
     */
    login(s) {
      n(this.emitter, "login", s);
    }
    progress(s) {
      n(this.emitter, e.DOWNLOAD_PROGRESS, s);
    }
    updateDownloaded(s) {
      n(this.emitter, e.UPDATE_DOWNLOADED, s);
    }
    updateCancelled(s) {
      n(this.emitter, "update-cancelled", s);
    }
  }
  e.UpdaterSignal = r;
  function n(i, s, a) {
    i.on(s, a);
  }
})(_n);
Object.defineProperty(un, "__esModule", { value: !0 });
un.NoOpLogger = un.AppUpdater = void 0;
const dt = Ve, Y2 = Ks, X2 = Mo, J2 = sy, Kt = gn, Q2 = Ze, El = fc, Wt = Re, An = cf, Um = oa, Z2 = hc, Mm = lv, ex = ca, bl = pc, Sl = oy, tx = vc, ci = _n;
class Cf extends J2.EventEmitter {
  /**
   * Get the update channel. Doesn't return `channel` from the update configuration, only if was previously set.
   */
  get channel() {
    return this._channel;
  }
  /**
   * Set the update channel. Overrides `channel` in the update configuration.
   *
   * `allowDowngrade` will be automatically set to `true`. If this behavior is not suitable for you, simple set `allowDowngrade` explicitly after.
   */
  set channel(t) {
    if (this._channel != null) {
      if (typeof t != "string")
        throw (0, dt.newError)(`Channel must be a string, but got: ${t}`, "ERR_UPDATER_INVALID_CHANNEL");
      if (t.length === 0)
        throw (0, dt.newError)("Channel must be not an empty string", "ERR_UPDATER_INVALID_CHANNEL");
    }
    this._channel = t, this.allowDowngrade = !0;
  }
  /**
   *  Shortcut for explicitly adding auth tokens to request headers
   */
  addAuthHeader(t) {
    this.requestHeaders = Object.assign({}, this.requestHeaders, {
      authorization: t
    });
  }
  // noinspection JSMethodCanBeStatic,JSUnusedGlobalSymbols
  get netSession() {
    return (0, Mm.getNetSession)();
  }
  /**
   * The logger. You can pass [electron-log](https://github.com/megahertz/electron-log), [winston](https://github.com/winstonjs/winston) or another logger with the following interface: `{ info(), warn(), error() }`.
   * Set it to `null` if you would like to disable a logging feature.
   */
  get logger() {
    return this._logger;
  }
  set logger(t) {
    this._logger = t ?? new _v();
  }
  // noinspection JSUnusedGlobalSymbols
  /**
   * test only
   * @private
   */
  set updateConfigPath(t) {
    this.clientPromise = null, this._appUpdateConfigPath = t, this.configOnDisk = new El.Lazy(() => this.loadUpdateConfig());
  }
  /**
   * Allows developer to override default logic for determining if an update is supported.
   * The default logic compares the `UpdateInfo` minimum system version against the `os.release()` with `semver` package
   */
  get isUpdateSupported() {
    return this._isUpdateSupported;
  }
  set isUpdateSupported(t) {
    t && (this._isUpdateSupported = t);
  }
  /**
   * Allows developer to override default logic for determining if the user is below the rollout threshold.
   * The default logic compares the staging percentage with numerical representation of user ID.
   * An override can define custom logic, or bypass it if needed.
   */
  get isUserWithinRollout() {
    return this._isUserWithinRollout;
  }
  set isUserWithinRollout(t) {
    t && (this._isUserWithinRollout = t);
  }
  constructor(t, r) {
    super(), this.autoDownload = !0, this.autoInstallOnAppQuit = !0, this.autoRunAppAfterInstall = !0, this.allowPrerelease = !1, this.fullChangelog = !1, this.allowDowngrade = !1, this.disableWebInstaller = !1, this.disableDifferentialDownload = !1, this.forceDevUpdateConfig = !1, this.previousBlockmapBaseUrlOverride = null, this._channel = null, this.downloadedUpdateHelper = null, this.requestHeaders = null, this._logger = console, this.signals = new ci.UpdaterSignal(this), this._appUpdateConfigPath = null, this._isUpdateSupported = (s) => this.checkIfUpdateSupported(s), this._isUserWithinRollout = (s) => this.isStagingMatch(s), this.clientPromise = null, this.stagingUserIdPromise = new El.Lazy(() => this.getOrCreateStagingUserId()), this.configOnDisk = new El.Lazy(() => this.loadUpdateConfig()), this.checkForUpdatesPromise = null, this.downloadPromise = null, this.updateInfoAndProvider = null, this._testOnlyOptions = null, this.on("error", (s) => {
      this._logger.error(`Error: ${s.stack || s.message}`);
    }), r == null ? (this.app = new Z2.ElectronAppAdapter(), this.httpExecutor = new Mm.ElectronHttpExecutor((s, a) => this.emit("login", s, a))) : (this.app = r, this.httpExecutor = null);
    const n = this.app.version, i = (0, An.parse)(n);
    if (i == null)
      throw (0, dt.newError)(`App version is not a valid semver version: "${n}"`, "ERR_UPDATER_INVALID_VERSION");
    this.currentVersion = i, this.allowPrerelease = rx(i), t != null && (this.setFeedURL(t), typeof t != "string" && t.requestHeaders && (this.requestHeaders = t.requestHeaders));
  }
  //noinspection JSMethodCanBeStatic,JSUnusedGlobalSymbols
  getFeedURL() {
    return "Deprecated. Do not use it.";
  }
  /**
   * Configure update provider. If value is `string`, [GenericServerOptions](./publish.md#genericserveroptions) will be set with value as `url`.
   * @param options If you want to override configuration in the `app-update.yml`.
   */
  setFeedURL(t) {
    const r = this.createProviderRuntimeOptions();
    let n;
    typeof t == "string" ? n = new ex.GenericProvider({ provider: "generic", url: t }, this, {
      ...r,
      isUseMultipleRangeRequest: (0, bl.isUrlProbablySupportMultiRangeRequests)(t)
    }) : n = (0, bl.createClient)(t, this, r), this.clientPromise = Promise.resolve(n);
  }
  /**
   * Asks the server whether there is an update.
   * @returns null if the updater is disabled, otherwise info about the latest version
   */
  checkForUpdates() {
    if (!this.isUpdaterActive())
      return Promise.resolve(null);
    let t = this.checkForUpdatesPromise;
    if (t != null)
      return this._logger.info("Checking for update (already in progress)"), t;
    const r = () => this.checkForUpdatesPromise = null;
    return this._logger.info("Checking for update"), t = this.doCheckForUpdates().then((n) => (r(), n)).catch((n) => {
      throw r(), this.emit("error", n, `Cannot check for updates: ${(n.stack || n).toString()}`), n;
    }), this.checkForUpdatesPromise = t, t;
  }
  isUpdaterActive() {
    return this.app.isPackaged || this.forceDevUpdateConfig ? !0 : (this._logger.info("Skip checkForUpdates because application is not packed and dev update config is not forced"), !1);
  }
  // noinspection JSUnusedGlobalSymbols
  checkForUpdatesAndNotify(t) {
    return this.checkForUpdates().then((r) => r != null && r.downloadPromise ? (r.downloadPromise.then(() => {
      const n = Cf.formatDownloadNotification(r.updateInfo.version, this.app.name, t);
      new Ir.Notification(n).show();
    }), r) : (this._logger.debug != null && this._logger.debug("checkForUpdatesAndNotify called, downloadPromise is null"), r));
  }
  static formatDownloadNotification(t, r, n) {
    return n == null && (n = {
      title: "A new update is ready to install",
      body: "{appName} version {version} has been downloaded and will be automatically installed on exit"
    }), n = {
      title: n.title.replace("{appName}", r).replace("{version}", t),
      body: n.body.replace("{appName}", r).replace("{version}", t)
    }, n;
  }
  async isStagingMatch(t) {
    const r = t.stagingPercentage;
    let n = r;
    if (n == null)
      return !0;
    if (n = parseInt(n, 10), isNaN(n))
      return this._logger.warn(`Staging percentage is NaN: ${r}`), !0;
    n = n / 100;
    const i = await this.stagingUserIdPromise.value, a = dt.UUID.parse(i).readUInt32BE(12) / 4294967295;
    return this._logger.info(`Staging percentage: ${n}, percentage: ${a}, user id: ${i}`), a < n;
  }
  computeFinalHeaders(t) {
    return this.requestHeaders != null && Object.assign(t, this.requestHeaders), t;
  }
  async isUpdateAvailable(t) {
    const r = (0, An.parse)(t.version);
    if (r == null)
      throw (0, dt.newError)(`This file could not be downloaded, or the latest version (from update server) does not have a valid semver version: "${t.version}"`, "ERR_UPDATER_INVALID_VERSION");
    const n = this.currentVersion;
    if ((0, An.eq)(r, n) || !await Promise.resolve(this.isUpdateSupported(t)) || !await Promise.resolve(this.isUserWithinRollout(t)))
      return !1;
    const s = (0, An.gt)(r, n), a = (0, An.lt)(r, n);
    return s ? !0 : this.allowDowngrade && a;
  }
  checkIfUpdateSupported(t) {
    const r = t == null ? void 0 : t.minimumSystemVersion, n = (0, X2.release)();
    if (r)
      try {
        if ((0, An.lt)(n, r))
          return this._logger.info(`Current OS version ${n} is less than the minimum OS version required ${r} for version ${n}`), !1;
      } catch (i) {
        this._logger.warn(`Failed to compare current OS version(${n}) with minimum OS version(${r}): ${(i.message || i).toString()}`);
      }
    return !0;
  }
  async getUpdateInfoAndProvider() {
    await this.app.whenReady(), this.clientPromise == null && (this.clientPromise = this.configOnDisk.value.then((n) => (0, bl.createClient)(n, this, this.createProviderRuntimeOptions())));
    const t = await this.clientPromise, r = await this.stagingUserIdPromise.value;
    return t.setRequestHeaders(this.computeFinalHeaders({ "x-user-staging-id": r })), {
      info: await t.getLatestVersion(),
      provider: t
    };
  }
  createProviderRuntimeOptions() {
    return {
      isUseMultipleRangeRequest: !0,
      platform: this._testOnlyOptions == null ? process.platform : this._testOnlyOptions.platform,
      executor: this.httpExecutor
    };
  }
  async doCheckForUpdates() {
    this.emit("checking-for-update");
    const t = await this.getUpdateInfoAndProvider(), r = t.info;
    if (!await this.isUpdateAvailable(r))
      return this._logger.info(`Update for version ${this.currentVersion.format()} is not available (latest version: ${r.version}, downgrade is ${this.allowDowngrade ? "allowed" : "disallowed"}).`), this.emit("update-not-available", r), {
        isUpdateAvailable: !1,
        versionInfo: r,
        updateInfo: r
      };
    this.updateInfoAndProvider = t, this.onUpdateAvailable(r);
    const n = new dt.CancellationToken();
    return {
      isUpdateAvailable: !0,
      versionInfo: r,
      updateInfo: r,
      cancellationToken: n,
      downloadPromise: this.autoDownload ? this.downloadUpdate(n) : null
    };
  }
  onUpdateAvailable(t) {
    this._logger.info(`Found version ${t.version} (url: ${(0, dt.asArray)(t.files).map((r) => r.url).join(", ")})`), this.emit("update-available", t);
  }
  /**
   * Start downloading update manually. You can use this method if `autoDownload` option is set to `false`.
   * @returns {Promise<Array<string>>} Paths to downloaded files.
   */
  downloadUpdate(t = new dt.CancellationToken()) {
    const r = this.updateInfoAndProvider;
    if (r == null) {
      const i = new Error("Please check update first");
      return this.dispatchError(i), Promise.reject(i);
    }
    if (this.downloadPromise != null)
      return this._logger.info("Downloading update (already in progress)"), this.downloadPromise;
    this._logger.info(`Downloading update from ${(0, dt.asArray)(r.info.files).map((i) => i.url).join(", ")}`);
    const n = (i) => {
      if (!(i instanceof dt.CancellationError))
        try {
          this.dispatchError(i);
        } catch (s) {
          this._logger.warn(`Cannot dispatch error event: ${s.stack || s}`);
        }
      return i;
    };
    return this.downloadPromise = this.doDownloadUpdate({
      updateInfoAndProvider: r,
      requestHeaders: this.computeRequestHeaders(r.provider),
      cancellationToken: t,
      disableWebInstaller: this.disableWebInstaller,
      disableDifferentialDownload: this.disableDifferentialDownload
    }).catch((i) => {
      throw n(i);
    }).finally(() => {
      this.downloadPromise = null;
    }), this.downloadPromise;
  }
  dispatchError(t) {
    this.emit("error", t, (t.stack || t).toString());
  }
  dispatchUpdateDownloaded(t) {
    this.emit(ci.UPDATE_DOWNLOADED, t);
  }
  async loadUpdateConfig() {
    return this._appUpdateConfigPath == null && (this._appUpdateConfigPath = this.app.appUpdateConfigPath), (0, Q2.load)(await (0, Kt.readFile)(this._appUpdateConfigPath, "utf-8"));
  }
  computeRequestHeaders(t) {
    const r = t.fileExtraDownloadHeaders;
    if (r != null) {
      const n = this.requestHeaders;
      return n == null ? r : {
        ...r,
        ...n
      };
    }
    return this.computeFinalHeaders({ accept: "*/*" });
  }
  async getOrCreateStagingUserId() {
    const t = Wt.join(this.app.userDataPath, ".updaterId");
    try {
      const n = await (0, Kt.readFile)(t, "utf-8");
      if (dt.UUID.check(n))
        return n;
      this._logger.warn(`Staging user id file exists, but content was invalid: ${n}`);
    } catch (n) {
      n.code !== "ENOENT" && this._logger.warn(`Couldn't read staging user ID, creating a blank one: ${n}`);
    }
    const r = dt.UUID.v5((0, Y2.randomBytes)(4096), dt.UUID.OID);
    this._logger.info(`Generated new staging user ID: ${r}`);
    try {
      await (0, Kt.outputFile)(t, r);
    } catch (n) {
      this._logger.warn(`Couldn't write out staging user ID: ${n}`);
    }
    return r;
  }
  /** @internal */
  get isAddNoCacheQuery() {
    const t = this.requestHeaders;
    if (t == null)
      return !0;
    for (const r of Object.keys(t)) {
      const n = r.toLowerCase();
      if (n === "authorization" || n === "private-token")
        return !1;
    }
    return !0;
  }
  async getOrCreateDownloadHelper() {
    let t = this.downloadedUpdateHelper;
    if (t == null) {
      const r = (await this.configOnDisk.value).updaterCacheDirName, n = this._logger;
      r == null && n.error("updaterCacheDirName is not specified in app-update.yml Was app build using at least electron-builder 20.34.0?");
      const i = Wt.join(this.app.baseCachePath, r || this.app.name);
      n.debug != null && n.debug(`updater cache dir: ${i}`), t = new Um.DownloadedUpdateHelper(i), this.downloadedUpdateHelper = t;
    }
    return t;
  }
  async executeDownload(t) {
    const r = t.fileInfo, n = {
      headers: t.downloadUpdateOptions.requestHeaders,
      cancellationToken: t.downloadUpdateOptions.cancellationToken,
      sha2: r.info.sha2,
      sha512: r.info.sha512
    };
    this.listenerCount(ci.DOWNLOAD_PROGRESS) > 0 && (n.onProgress = (E) => this.emit(ci.DOWNLOAD_PROGRESS, E));
    const i = t.downloadUpdateOptions.updateInfoAndProvider.info, s = i.version, a = r.packageInfo;
    function o() {
      const E = decodeURIComponent(t.fileInfo.url.pathname);
      return E.toLowerCase().endsWith(`.${t.fileExtension.toLowerCase()}`) ? Wt.basename(E) : t.fileInfo.info.url;
    }
    const c = await this.getOrCreateDownloadHelper(), u = c.cacheDirForPendingUpdate;
    await (0, Kt.mkdir)(u, { recursive: !0 });
    const l = o();
    let d = Wt.join(u, l);
    const h = a == null ? null : Wt.join(u, `package-${s}${Wt.extname(a.path) || ".7z"}`), p = async (E) => {
      await c.setDownloadedFile(d, h, i, r, l, E), await t.done({
        ...i,
        downloadedFile: d
      });
      const T = Wt.join(u, "current.blockmap");
      return await (0, Kt.pathExists)(T) && await (0, Kt.copyFile)(T, Wt.join(c.cacheDir, "current.blockmap")), h == null ? [d] : [d, h];
    }, $ = this._logger, _ = await c.validateDownloadedPath(d, i, r, $);
    if (_ != null)
      return d = _, await p(!1);
    const v = async () => (await c.clear().catch(() => {
    }), await (0, Kt.unlink)(d).catch(() => {
    })), m = await (0, Um.createTempUpdateFile)(`temp-${l}`, u, $);
    try {
      await t.task(m, n, h, v), await (0, dt.retry)(() => (0, Kt.rename)(m, d), {
        retries: 60,
        interval: 500,
        shouldRetry: (E) => E instanceof Error && /^EBUSY:/.test(E.message) ? !0 : ($.warn(`Cannot rename temp file to final file: ${E.message || E.stack}`), !1)
      });
    } catch (E) {
      throw await v(), E instanceof dt.CancellationError && ($.info("cancelled"), this.emit("update-cancelled", i)), E;
    }
    return $.info(`New version ${s} has been downloaded to ${d}`), await p(!0);
  }
  async differentialDownloadInstaller(t, r, n, i, s) {
    try {
      if (this._testOnlyOptions != null && !this._testOnlyOptions.isUseDifferentialDownload)
        return !0;
      const a = r.updateInfoAndProvider.provider, o = await a.getBlockMapFiles(t.url, this.app.version, r.updateInfoAndProvider.info.version, this.previousBlockmapBaseUrlOverride);
      this._logger.info(`Download block maps (old: "${o[0]}", new: ${o[1]})`);
      const c = async ($) => {
        const _ = await this.httpExecutor.downloadToBuffer($, {
          headers: r.requestHeaders,
          cancellationToken: r.cancellationToken
        });
        if (_ == null || _.length === 0)
          throw new Error(`Blockmap "${$.href}" is empty`);
        try {
          return JSON.parse((0, Sl.gunzipSync)(_).toString());
        } catch (v) {
          throw new Error(`Cannot parse blockmap "${$.href}", error: ${v}`);
        }
      }, u = {
        newUrl: t.url,
        oldFile: Wt.join(this.downloadedUpdateHelper.cacheDir, s),
        logger: this._logger,
        newFile: n,
        isUseMultipleRangeRequest: a.isUseMultipleRangeRequest,
        requestHeaders: r.requestHeaders,
        cancellationToken: r.cancellationToken
      };
      this.listenerCount(ci.DOWNLOAD_PROGRESS) > 0 && (u.onProgress = ($) => this.emit(ci.DOWNLOAD_PROGRESS, $));
      const l = async ($, _) => {
        const v = Wt.join(_, "current.blockmap");
        await (0, Kt.outputFile)(v, (0, Sl.gzipSync)(JSON.stringify($)));
      }, d = async ($) => {
        const _ = Wt.join($, "current.blockmap");
        try {
          if (await (0, Kt.pathExists)(_))
            return JSON.parse((0, Sl.gunzipSync)(await (0, Kt.readFile)(_)).toString());
        } catch (v) {
          this._logger.warn(`Cannot parse blockmap "${_}", error: ${v}`);
        }
        return null;
      }, h = await c(o[1]);
      await l(h, this.downloadedUpdateHelper.cacheDirForPendingUpdate);
      let p = await d(this.downloadedUpdateHelper.cacheDir);
      return p == null && (p = await c(o[0])), await new tx.GenericDifferentialDownloader(t.info, this.httpExecutor, u).download(p, h), !1;
    } catch (a) {
      if (this._logger.error(`Cannot download differentially, fallback to full download: ${a.stack || a}`), this._testOnlyOptions != null)
        throw a;
      return !0;
    }
  }
}
un.AppUpdater = Cf;
function rx(e) {
  const t = (0, An.prerelease)(e);
  return t != null && t.length > 0;
}
class _v {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  info(t) {
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  warn(t) {
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  error(t) {
  }
}
un.NoOpLogger = _v;
Object.defineProperty(Xn, "__esModule", { value: !0 });
Xn.BaseUpdater = void 0;
const xm = Uo, nx = un;
class ix extends nx.AppUpdater {
  constructor(t, r) {
    super(t, r), this.quitAndInstallCalled = !1, this.quitHandlerAdded = !1;
  }
  quitAndInstall(t = !1, r = !1) {
    this._logger.info("Install on explicit quitAndInstall"), this.install(t, t ? r : this.autoRunAppAfterInstall) ? setImmediate(() => {
      Ir.autoUpdater.emit("before-quit-for-update"), this.app.quit();
    }) : this.quitAndInstallCalled = !1;
  }
  executeDownload(t) {
    return super.executeDownload({
      ...t,
      done: (r) => (this.dispatchUpdateDownloaded(r), this.addQuitHandler(), Promise.resolve())
    });
  }
  get installerPath() {
    return this.downloadedUpdateHelper == null ? null : this.downloadedUpdateHelper.file;
  }
  // must be sync (because quit even handler is not async)
  install(t = !1, r = !1) {
    if (this.quitAndInstallCalled)
      return this._logger.warn("install call ignored: quitAndInstallCalled is set to true"), !1;
    const n = this.downloadedUpdateHelper, i = this.installerPath, s = n == null ? null : n.downloadedFileInfo;
    if (i == null || s == null)
      return this.dispatchError(new Error("No update filepath provided, can't quit and install")), !1;
    this.quitAndInstallCalled = !0;
    try {
      return this._logger.info(`Install: isSilent: ${t}, isForceRunAfter: ${r}`), this.doInstall({
        isSilent: t,
        isForceRunAfter: r,
        isAdminRightsRequired: s.isAdminRightsRequired
      });
    } catch (a) {
      return this.dispatchError(a), !1;
    }
  }
  addQuitHandler() {
    this.quitHandlerAdded || !this.autoInstallOnAppQuit || (this.quitHandlerAdded = !0, this.app.onQuit((t) => {
      if (this.quitAndInstallCalled) {
        this._logger.info("Update installer has already been triggered. Quitting application.");
        return;
      }
      if (!this.autoInstallOnAppQuit) {
        this._logger.info("Update will not be installed on quit because autoInstallOnAppQuit is set to false.");
        return;
      }
      if (t !== 0) {
        this._logger.info(`Update will be not installed on quit because application is quitting with exit code ${t}`);
        return;
      }
      this._logger.info("Auto install update on quit"), this.install(!0, !1);
    }));
  }
  spawnSyncLog(t, r = [], n = {}) {
    this._logger.info(`Executing: ${t} with args: ${r}`);
    const i = (0, xm.spawnSync)(t, r, {
      env: { ...process.env, ...n },
      encoding: "utf-8",
      shell: !0
    }), { error: s, status: a, stdout: o, stderr: c } = i;
    if (s != null)
      throw this._logger.error(c), s;
    if (a != null && a !== 0)
      throw this._logger.error(c), new Error(`Command ${t} exited with code ${a}`);
    return o.trim();
  }
  /**
   * This handles both node 8 and node 10 way of emitting error when spawning a process
   *   - node 8: Throws the error
   *   - node 10: Emit the error(Need to listen with on)
   */
  // https://github.com/electron-userland/electron-builder/issues/1129
  // Node 8 sends errors: https://nodejs.org/dist/latest-v8.x/docs/api/errors.html#errors_common_system_errors
  async spawnLog(t, r = [], n = void 0, i = "ignore") {
    return this._logger.info(`Executing: ${t} with args: ${r}`), new Promise((s, a) => {
      try {
        const o = { stdio: i, env: n, detached: !0 }, c = (0, xm.spawn)(t, r, o);
        c.on("error", (u) => {
          a(u);
        }), c.unref(), c.pid !== void 0 && s(!0);
      } catch (o) {
        a(o);
      }
    });
  }
}
Xn.BaseUpdater = ix;
var xs = {}, ua = {};
Object.defineProperty(ua, "__esModule", { value: !0 });
ua.FileWithEmbeddedBlockMapDifferentialDownloader = void 0;
const li = gn, sx = la, ax = oy;
class ox extends sx.DifferentialDownloader {
  async download() {
    const t = this.blockAwareFileInfo, r = t.size, n = r - (t.blockMapSize + 4);
    this.fileMetadataBuffer = await this.readRemoteBytes(n, r - 1);
    const i = vv(this.fileMetadataBuffer.slice(0, this.fileMetadataBuffer.length - 4));
    await this.doDownload(await cx(this.options.oldFile), i);
  }
}
ua.FileWithEmbeddedBlockMapDifferentialDownloader = ox;
function vv(e) {
  return JSON.parse((0, ax.inflateRawSync)(e).toString());
}
async function cx(e) {
  const t = await (0, li.open)(e, "r");
  try {
    const r = (await (0, li.fstat)(t)).size, n = Buffer.allocUnsafe(4);
    await (0, li.read)(t, n, 0, n.length, r - n.length);
    const i = Buffer.allocUnsafe(n.readUInt32BE(0));
    return await (0, li.read)(t, i, 0, i.length, r - n.length - i.length), await (0, li.close)(t), vv(i);
  } catch (r) {
    throw await (0, li.close)(t), r;
  }
}
Object.defineProperty(xs, "__esModule", { value: !0 });
xs.AppImageUpdater = void 0;
const Vm = Ve, qm = Uo, lx = gn, ux = mn, ls = Re, dx = Xn, fx = ua, hx = je, Bm = _n;
class px extends dx.BaseUpdater {
  constructor(t, r) {
    super(t, r);
  }
  isUpdaterActive() {
    return process.env.APPIMAGE == null && !this.forceDevUpdateConfig ? (process.env.SNAP == null ? this._logger.warn("APPIMAGE env is not defined, current application is not an AppImage") : this._logger.info("SNAP env is defined, updater is disabled"), !1) : super.isUpdaterActive();
  }
  /*** @private */
  doDownloadUpdate(t) {
    const r = t.updateInfoAndProvider.provider, n = (0, hx.findFile)(r.resolveFiles(t.updateInfoAndProvider.info), "AppImage", ["rpm", "deb", "pacman"]);
    return this.executeDownload({
      fileExtension: "AppImage",
      fileInfo: n,
      downloadUpdateOptions: t,
      task: async (i, s) => {
        const a = process.env.APPIMAGE;
        if (a == null)
          throw (0, Vm.newError)("APPIMAGE env is not defined", "ERR_UPDATER_OLD_FILE_NOT_FOUND");
        (t.disableDifferentialDownload || await this.downloadDifferential(n, a, i, r, t)) && await this.httpExecutor.download(n.url, i, s), await (0, lx.chmod)(i, 493);
      }
    });
  }
  async downloadDifferential(t, r, n, i, s) {
    try {
      const a = {
        newUrl: t.url,
        oldFile: r,
        logger: this._logger,
        newFile: n,
        isUseMultipleRangeRequest: i.isUseMultipleRangeRequest,
        requestHeaders: s.requestHeaders,
        cancellationToken: s.cancellationToken
      };
      return this.listenerCount(Bm.DOWNLOAD_PROGRESS) > 0 && (a.onProgress = (o) => this.emit(Bm.DOWNLOAD_PROGRESS, o)), await new fx.FileWithEmbeddedBlockMapDifferentialDownloader(t.info, this.httpExecutor, a).download(), !1;
    } catch (a) {
      return this._logger.error(`Cannot download differentially, fallback to full download: ${a.stack || a}`), process.platform === "linux";
    }
  }
  doInstall(t) {
    const r = process.env.APPIMAGE;
    if (r == null)
      throw (0, Vm.newError)("APPIMAGE env is not defined", "ERR_UPDATER_OLD_FILE_NOT_FOUND");
    (0, ux.unlinkSync)(r);
    let n;
    const i = ls.basename(r), s = this.installerPath;
    if (s == null)
      return this.dispatchError(new Error("No update filepath provided, can't quit and install")), !1;
    ls.basename(s) === i || !/\d+\.\d+\.\d+/.test(i) ? n = r : n = ls.join(ls.dirname(r), ls.basename(s)), (0, qm.execFileSync)("mv", ["-f", s, n]), n !== r && this.emit("appimage-filename-updated", n);
    const a = {
      ...process.env,
      APPIMAGE_SILENT_INSTALL: "true"
    };
    return t.isForceRunAfter ? this.spawnLog(n, [], a) : (a.APPIMAGE_EXIT_AFTER_INSTALL = "true", (0, qm.execFileSync)(n, [], { env: a })), !0;
  }
}
xs.AppImageUpdater = px;
var Vs = {}, Xi = {};
Object.defineProperty(Xi, "__esModule", { value: !0 });
Xi.LinuxUpdater = void 0;
const mx = Xn;
class yx extends mx.BaseUpdater {
  constructor(t, r) {
    super(t, r);
  }
  /**
   * Returns true if the current process is running as root.
   */
  isRunningAsRoot() {
    var t;
    return ((t = process.getuid) === null || t === void 0 ? void 0 : t.call(process)) === 0;
  }
  /**
   * Sanitizies the installer path for using with command line tools.
   */
  get installerPath() {
    var t, r;
    return (r = (t = super.installerPath) === null || t === void 0 ? void 0 : t.replace(/\\/g, "\\\\").replace(/ /g, "\\ ")) !== null && r !== void 0 ? r : null;
  }
  runCommandWithSudoIfNeeded(t) {
    if (this.isRunningAsRoot())
      return this._logger.info("Running as root, no need to use sudo"), this.spawnSyncLog(t[0], t.slice(1));
    const { name: r } = this.app, n = `"${r} would like to update"`, i = this.sudoWithArgs(n);
    this._logger.info(`Running as non-root user, using sudo to install: ${i}`);
    let s = '"';
    return (/pkexec/i.test(i[0]) || i[0] === "sudo") && (s = ""), this.spawnSyncLog(i[0], [...i.length > 1 ? i.slice(1) : [], `${s}/bin/bash`, "-c", `'${t.join(" ")}'${s}`]);
  }
  sudoWithArgs(t) {
    const r = this.determineSudoCommand(), n = [r];
    return /kdesudo/i.test(r) ? (n.push("--comment", t), n.push("-c")) : /gksudo/i.test(r) ? n.push("--message", t) : /pkexec/i.test(r) && n.push("--disable-internal-agent"), n;
  }
  hasCommand(t) {
    try {
      return this.spawnSyncLog("command", ["-v", t]), !0;
    } catch {
      return !1;
    }
  }
  determineSudoCommand() {
    const t = ["gksudo", "kdesudo", "pkexec", "beesu"];
    for (const r of t)
      if (this.hasCommand(r))
        return r;
    return "sudo";
  }
  /**
   * Detects the package manager to use based on the available commands.
   * Allows overriding the default behavior by setting the ELECTRON_BUILDER_LINUX_PACKAGE_MANAGER environment variable.
   * If the environment variable is set, it will be used directly. (This is useful for testing each package manager logic path.)
   * Otherwise, it checks for the presence of the specified package manager commands in the order provided.
   * @param pms - An array of package manager commands to check for, in priority order.
   * @returns The detected package manager command or "unknown" if none are found.
   */
  detectPackageManager(t) {
    var r;
    const n = (r = process.env.ELECTRON_BUILDER_LINUX_PACKAGE_MANAGER) === null || r === void 0 ? void 0 : r.trim();
    if (n)
      return n;
    for (const i of t)
      if (this.hasCommand(i))
        return i;
    return this._logger.warn(`No package manager found in the list: ${t.join(", ")}. Defaulting to the first one: ${t[0]}`), t[0];
  }
}
Xi.LinuxUpdater = yx;
Object.defineProperty(Vs, "__esModule", { value: !0 });
Vs.DebUpdater = void 0;
const gx = je, Hm = _n, _x = Xi;
class Rf extends _x.LinuxUpdater {
  constructor(t, r) {
    super(t, r);
  }
  /*** @private */
  doDownloadUpdate(t) {
    const r = t.updateInfoAndProvider.provider, n = (0, gx.findFile)(r.resolveFiles(t.updateInfoAndProvider.info), "deb", ["AppImage", "rpm", "pacman"]);
    return this.executeDownload({
      fileExtension: "deb",
      fileInfo: n,
      downloadUpdateOptions: t,
      task: async (i, s) => {
        this.listenerCount(Hm.DOWNLOAD_PROGRESS) > 0 && (s.onProgress = (a) => this.emit(Hm.DOWNLOAD_PROGRESS, a)), await this.httpExecutor.download(n.url, i, s);
      }
    });
  }
  doInstall(t) {
    const r = this.installerPath;
    if (r == null)
      return this.dispatchError(new Error("No update filepath provided, can't quit and install")), !1;
    if (!this.hasCommand("dpkg") && !this.hasCommand("apt"))
      return this.dispatchError(new Error("Neither dpkg nor apt command found. Cannot install .deb package.")), !1;
    const n = ["dpkg", "apt"], i = this.detectPackageManager(n);
    try {
      Rf.installWithCommandRunner(i, r, this.runCommandWithSudoIfNeeded.bind(this), this._logger);
    } catch (s) {
      return this.dispatchError(s), !1;
    }
    return t.isForceRunAfter && this.app.relaunch(), !0;
  }
  static installWithCommandRunner(t, r, n, i) {
    var s;
    if (t === "dpkg")
      try {
        n(["dpkg", "-i", r]);
      } catch (a) {
        i.warn((s = a.message) !== null && s !== void 0 ? s : a), i.warn("dpkg installation failed, trying to fix broken dependencies with apt-get"), n(["apt-get", "install", "-f", "-y"]);
      }
    else if (t === "apt")
      i.warn("Using apt to install a local .deb. This may fail for unsigned packages unless properly configured."), n([
        "apt",
        "install",
        "-y",
        "--allow-unauthenticated",
        // needed for unsigned .debs
        "--allow-downgrades",
        // allow lower version installs
        "--allow-change-held-packages",
        r
      ]);
    else
      throw new Error(`Package manager ${t} not supported`);
  }
}
Vs.DebUpdater = Rf;
var qs = {};
Object.defineProperty(qs, "__esModule", { value: !0 });
qs.PacmanUpdater = void 0;
const Gm = _n, vx = je, $x = Xi;
class If extends $x.LinuxUpdater {
  constructor(t, r) {
    super(t, r);
  }
  /*** @private */
  doDownloadUpdate(t) {
    const r = t.updateInfoAndProvider.provider, n = (0, vx.findFile)(r.resolveFiles(t.updateInfoAndProvider.info), "pacman", ["AppImage", "deb", "rpm"]);
    return this.executeDownload({
      fileExtension: "pacman",
      fileInfo: n,
      downloadUpdateOptions: t,
      task: async (i, s) => {
        this.listenerCount(Gm.DOWNLOAD_PROGRESS) > 0 && (s.onProgress = (a) => this.emit(Gm.DOWNLOAD_PROGRESS, a)), await this.httpExecutor.download(n.url, i, s);
      }
    });
  }
  doInstall(t) {
    const r = this.installerPath;
    if (r == null)
      return this.dispatchError(new Error("No update filepath provided, can't quit and install")), !1;
    try {
      If.installWithCommandRunner(r, this.runCommandWithSudoIfNeeded.bind(this), this._logger);
    } catch (n) {
      return this.dispatchError(n), !1;
    }
    return t.isForceRunAfter && this.app.relaunch(), !0;
  }
  static installWithCommandRunner(t, r, n) {
    var i;
    try {
      r(["pacman", "-U", "--noconfirm", t]);
    } catch (s) {
      n.warn((i = s.message) !== null && i !== void 0 ? i : s), n.warn("pacman installation failed, attempting to update package database and retry");
      try {
        r(["pacman", "-Sy", "--noconfirm"]), r(["pacman", "-U", "--noconfirm", t]);
      } catch (a) {
        throw n.error("Retry after pacman -Sy failed"), a;
      }
    }
  }
}
qs.PacmanUpdater = If;
var Bs = {};
Object.defineProperty(Bs, "__esModule", { value: !0 });
Bs.RpmUpdater = void 0;
const zm = _n, wx = je, Ex = Xi;
class Df extends Ex.LinuxUpdater {
  constructor(t, r) {
    super(t, r);
  }
  /*** @private */
  doDownloadUpdate(t) {
    const r = t.updateInfoAndProvider.provider, n = (0, wx.findFile)(r.resolveFiles(t.updateInfoAndProvider.info), "rpm", ["AppImage", "deb", "pacman"]);
    return this.executeDownload({
      fileExtension: "rpm",
      fileInfo: n,
      downloadUpdateOptions: t,
      task: async (i, s) => {
        this.listenerCount(zm.DOWNLOAD_PROGRESS) > 0 && (s.onProgress = (a) => this.emit(zm.DOWNLOAD_PROGRESS, a)), await this.httpExecutor.download(n.url, i, s);
      }
    });
  }
  doInstall(t) {
    const r = this.installerPath;
    if (r == null)
      return this.dispatchError(new Error("No update filepath provided, can't quit and install")), !1;
    const n = ["zypper", "dnf", "yum", "rpm"], i = this.detectPackageManager(n);
    try {
      Df.installWithCommandRunner(i, r, this.runCommandWithSudoIfNeeded.bind(this), this._logger);
    } catch (s) {
      return this.dispatchError(s), !1;
    }
    return t.isForceRunAfter && this.app.relaunch(), !0;
  }
  static installWithCommandRunner(t, r, n, i) {
    if (t === "zypper")
      return n(["zypper", "--non-interactive", "--no-refresh", "install", "--allow-unsigned-rpm", "-f", r]);
    if (t === "dnf")
      return n(["dnf", "install", "--nogpgcheck", "-y", r]);
    if (t === "yum")
      return n(["yum", "install", "--nogpgcheck", "-y", r]);
    if (t === "rpm")
      return i.warn("Installing with rpm only (no dependency resolution)."), n(["rpm", "-Uvh", "--replacepkgs", "--replacefiles", "--nodeps", r]);
    throw new Error(`Package manager ${t} not supported`);
  }
}
Bs.RpmUpdater = Df;
var Hs = {};
Object.defineProperty(Hs, "__esModule", { value: !0 });
Hs.MacUpdater = void 0;
const Km = Ve, Pl = gn, bx = mn, Wm = Re, Sx = O$, Px = un, Tx = je, Ym = Uo, Xm = Ks;
class Nx extends Px.AppUpdater {
  constructor(t, r) {
    super(t, r), this.nativeUpdater = Ir.autoUpdater, this.squirrelDownloadedUpdate = !1, this.nativeUpdater.on("error", (n) => {
      this._logger.warn(n), this.emit("error", n);
    }), this.nativeUpdater.on("update-downloaded", () => {
      this.squirrelDownloadedUpdate = !0, this.debug("nativeUpdater.update-downloaded");
    });
  }
  debug(t) {
    this._logger.debug != null && this._logger.debug(t);
  }
  closeServerIfExists() {
    this.server && (this.debug("Closing proxy server"), this.server.close((t) => {
      t && this.debug("proxy server wasn't already open, probably attempted closing again as a safety check before quit");
    }));
  }
  async doDownloadUpdate(t) {
    let r = t.updateInfoAndProvider.provider.resolveFiles(t.updateInfoAndProvider.info);
    const n = this._logger, i = "sysctl.proc_translated";
    let s = !1;
    try {
      this.debug("Checking for macOS Rosetta environment"), s = (0, Ym.execFileSync)("sysctl", [i], { encoding: "utf8" }).includes(`${i}: 1`), n.info(`Checked for macOS Rosetta environment (isRosetta=${s})`);
    } catch (d) {
      n.warn(`sysctl shell command to check for macOS Rosetta environment failed: ${d}`);
    }
    let a = !1;
    try {
      this.debug("Checking for arm64 in uname");
      const h = (0, Ym.execFileSync)("uname", ["-a"], { encoding: "utf8" }).includes("ARM");
      n.info(`Checked 'uname -a': arm64=${h}`), a = a || h;
    } catch (d) {
      n.warn(`uname shell command to check for arm64 failed: ${d}`);
    }
    a = a || process.arch === "arm64" || s;
    const o = (d) => {
      var h;
      return d.url.pathname.includes("arm64") || ((h = d.info.url) === null || h === void 0 ? void 0 : h.includes("arm64"));
    };
    a && r.some(o) ? r = r.filter((d) => a === o(d)) : r = r.filter((d) => !o(d));
    const c = (0, Tx.findFile)(r, "zip", ["pkg", "dmg"]);
    if (c == null)
      throw (0, Km.newError)(`ZIP file not provided: ${(0, Km.safeStringifyJson)(r)}`, "ERR_UPDATER_ZIP_FILE_NOT_FOUND");
    const u = t.updateInfoAndProvider.provider, l = "update.zip";
    return this.executeDownload({
      fileExtension: "zip",
      fileInfo: c,
      downloadUpdateOptions: t,
      task: async (d, h) => {
        const p = Wm.join(this.downloadedUpdateHelper.cacheDir, l), $ = () => (0, Pl.pathExistsSync)(p) ? !t.disableDifferentialDownload : (n.info("Unable to locate previous update.zip for differential download (is this first install?), falling back to full download"), !1);
        let _ = !0;
        $() && (_ = await this.differentialDownloadInstaller(c, t, d, u, l)), _ && await this.httpExecutor.download(c.url, d, h);
      },
      done: async (d) => {
        if (!t.disableDifferentialDownload)
          try {
            const h = Wm.join(this.downloadedUpdateHelper.cacheDir, l);
            await (0, Pl.copyFile)(d.downloadedFile, h);
          } catch (h) {
            this._logger.warn(`Unable to copy file for caching for future differential downloads: ${h.message}`);
          }
        return this.updateDownloaded(c, d);
      }
    });
  }
  async updateDownloaded(t, r) {
    var n;
    const i = r.downloadedFile, s = (n = t.info.size) !== null && n !== void 0 ? n : (await (0, Pl.stat)(i)).size, a = this._logger, o = `fileToProxy=${t.url.href}`;
    this.closeServerIfExists(), this.debug(`Creating proxy server for native Squirrel.Mac (${o})`), this.server = (0, Sx.createServer)(), this.debug(`Proxy server for native Squirrel.Mac is created (${o})`), this.server.on("close", () => {
      a.info(`Proxy server for native Squirrel.Mac is closed (${o})`);
    });
    const c = (u) => {
      const l = u.address();
      return typeof l == "string" ? l : `http://127.0.0.1:${l == null ? void 0 : l.port}`;
    };
    return await new Promise((u, l) => {
      const d = (0, Xm.randomBytes)(64).toString("base64").replace(/\//g, "_").replace(/\+/g, "-"), h = Buffer.from(`autoupdater:${d}`, "ascii"), p = `/${(0, Xm.randomBytes)(64).toString("hex")}.zip`;
      this.server.on("request", ($, _) => {
        const v = $.url;
        if (a.info(`${v} requested`), v === "/") {
          if (!$.headers.authorization || $.headers.authorization.indexOf("Basic ") === -1) {
            _.statusCode = 401, _.statusMessage = "Invalid Authentication Credentials", _.end(), a.warn("No authenthication info");
            return;
          }
          const T = $.headers.authorization.split(" ")[1], R = Buffer.from(T, "base64").toString("ascii"), [F, H] = R.split(":");
          if (F !== "autoupdater" || H !== d) {
            _.statusCode = 401, _.statusMessage = "Invalid Authentication Credentials", _.end(), a.warn("Invalid authenthication credentials");
            return;
          }
          const G = Buffer.from(`{ "url": "${c(this.server)}${p}" }`);
          _.writeHead(200, { "Content-Type": "application/json", "Content-Length": G.length }), _.end(G);
          return;
        }
        if (!v.startsWith(p)) {
          a.warn(`${v} requested, but not supported`), _.writeHead(404), _.end();
          return;
        }
        a.info(`${p} requested by Squirrel.Mac, pipe ${i}`);
        let m = !1;
        _.on("finish", () => {
          m || (this.nativeUpdater.removeListener("error", l), u([]));
        });
        const E = (0, bx.createReadStream)(i);
        E.on("error", (T) => {
          try {
            _.end();
          } catch (R) {
            a.warn(`cannot end response: ${R}`);
          }
          m = !0, this.nativeUpdater.removeListener("error", l), l(new Error(`Cannot pipe "${i}": ${T}`));
        }), _.writeHead(200, {
          "Content-Type": "application/zip",
          "Content-Length": s
        }), E.pipe(_);
      }), this.debug(`Proxy server for native Squirrel.Mac is starting to listen (${o})`), this.server.listen(0, "127.0.0.1", () => {
        this.debug(`Proxy server for native Squirrel.Mac is listening (address=${c(this.server)}, ${o})`), this.nativeUpdater.setFeedURL({
          url: c(this.server),
          headers: {
            "Cache-Control": "no-cache",
            Authorization: `Basic ${h.toString("base64")}`
          }
        }), this.dispatchUpdateDownloaded(r), this.autoInstallOnAppQuit ? (this.nativeUpdater.once("error", l), this.nativeUpdater.checkForUpdates()) : u([]);
      });
    });
  }
  handleUpdateDownloaded() {
    this.autoRunAppAfterInstall ? this.nativeUpdater.quitAndInstall() : this.app.quit(), this.closeServerIfExists();
  }
  quitAndInstall() {
    this.squirrelDownloadedUpdate ? this.handleUpdateDownloaded() : (this.nativeUpdater.on("update-downloaded", () => this.handleUpdateDownloaded()), this.autoInstallOnAppQuit || this.nativeUpdater.checkForUpdates());
  }
}
Hs.MacUpdater = Nx;
var Gs = {}, kf = {};
Object.defineProperty(kf, "__esModule", { value: !0 });
kf.verifySignature = Ax;
const Jm = Ve, $v = Uo, Ox = Mo, Qm = Re;
function wv(e, t) {
  return ['set "PSModulePath=" & chcp 65001 >NUL & powershell.exe', ["-NoProfile", "-NonInteractive", "-InputFormat", "None", "-Command", e], {
    shell: !0,
    timeout: t
  }];
}
function Ax(e, t, r) {
  return new Promise((n, i) => {
    const s = t.replace(/'/g, "''");
    r.info(`Verifying signature ${s}`), (0, $v.execFile)(...wv(`"Get-AuthenticodeSignature -LiteralPath '${s}' | ConvertTo-Json -Compress"`, 20 * 1e3), (a, o, c) => {
      var u;
      try {
        if (a != null || c) {
          Tl(r, a, c, i), n(null);
          return;
        }
        const l = Cx(o);
        if (l.Status === 0) {
          try {
            const $ = Qm.normalize(l.Path), _ = Qm.normalize(t);
            if (r.info(`LiteralPath: ${$}. Update Path: ${_}`), $ !== _) {
              Tl(r, new Error(`LiteralPath of ${$} is different than ${_}`), c, i), n(null);
              return;
            }
          } catch ($) {
            r.warn(`Unable to verify LiteralPath of update asset due to missing data.Path. Skipping this step of validation. Message: ${(u = $.message) !== null && u !== void 0 ? u : $.stack}`);
          }
          const h = (0, Jm.parseDn)(l.SignerCertificate.Subject);
          let p = !1;
          for (const $ of e) {
            const _ = (0, Jm.parseDn)($);
            if (_.size ? p = Array.from(_.keys()).every((m) => _.get(m) === h.get(m)) : $ === h.get("CN") && (r.warn(`Signature validated using only CN ${$}. Please add your full Distinguished Name (DN) to publisherNames configuration`), p = !0), p) {
              n(null);
              return;
            }
          }
        }
        const d = `publisherNames: ${e.join(" | ")}, raw info: ` + JSON.stringify(l, (h, p) => h === "RawData" ? void 0 : p, 2);
        r.warn(`Sign verification failed, installer signed with incorrect certificate: ${d}`), n(d);
      } catch (l) {
        Tl(r, l, null, i), n(null);
        return;
      }
    });
  });
}
function Cx(e) {
  const t = JSON.parse(e);
  delete t.PrivateKey, delete t.IsOSBinary, delete t.SignatureType;
  const r = t.SignerCertificate;
  return r != null && (delete r.Archived, delete r.Extensions, delete r.Handle, delete r.HasPrivateKey, delete r.SubjectName), t;
}
function Tl(e, t, r, n) {
  if (Rx()) {
    e.warn(`Cannot execute Get-AuthenticodeSignature: ${t || r}. Ignoring signature validation due to unsupported powershell version. Please upgrade to powershell 3 or higher.`);
    return;
  }
  try {
    (0, $v.execFileSync)(...wv("ConvertTo-Json test", 10 * 1e3));
  } catch (i) {
    e.warn(`Cannot execute ConvertTo-Json: ${i.message}. Ignoring signature validation due to unsupported powershell version. Please upgrade to powershell 3 or higher.`);
    return;
  }
  t != null && n(t), r && n(new Error(`Cannot execute Get-AuthenticodeSignature, stderr: ${r}. Failing signature validation due to unknown stderr.`));
}
function Rx() {
  const e = Ox.release();
  return e.startsWith("6.") && !e.startsWith("6.3");
}
Object.defineProperty(Gs, "__esModule", { value: !0 });
Gs.NsisUpdater = void 0;
const Ja = Ve, Zm = Re, Ix = Xn, Dx = ua, ey = _n, kx = je, Fx = gn, jx = kf, ty = yn;
class Lx extends Ix.BaseUpdater {
  constructor(t, r) {
    super(t, r), this._verifyUpdateCodeSignature = (n, i) => (0, jx.verifySignature)(n, i, this._logger);
  }
  /**
   * The verifyUpdateCodeSignature. You can pass [win-verify-signature](https://github.com/beyondkmp/win-verify-trust) or another custom verify function: ` (publisherName: string[], path: string) => Promise<string | null>`.
   * The default verify function uses [windowsExecutableCodeSignatureVerifier](https://github.com/electron-userland/electron-builder/blob/master/packages/electron-updater/src/windowsExecutableCodeSignatureVerifier.ts)
   */
  get verifyUpdateCodeSignature() {
    return this._verifyUpdateCodeSignature;
  }
  set verifyUpdateCodeSignature(t) {
    t && (this._verifyUpdateCodeSignature = t);
  }
  /*** @private */
  doDownloadUpdate(t) {
    const r = t.updateInfoAndProvider.provider, n = (0, kx.findFile)(r.resolveFiles(t.updateInfoAndProvider.info), "exe");
    return this.executeDownload({
      fileExtension: "exe",
      downloadUpdateOptions: t,
      fileInfo: n,
      task: async (i, s, a, o) => {
        const c = n.packageInfo, u = c != null && a != null;
        if (u && t.disableWebInstaller)
          throw (0, Ja.newError)(`Unable to download new version ${t.updateInfoAndProvider.info.version}. Web Installers are disabled`, "ERR_UPDATER_WEB_INSTALLER_DISABLED");
        !u && !t.disableWebInstaller && this._logger.warn("disableWebInstaller is set to false, you should set it to true if you do not plan on using a web installer. This will default to true in a future version."), (u || t.disableDifferentialDownload || await this.differentialDownloadInstaller(n, t, i, r, Ja.CURRENT_APP_INSTALLER_FILE_NAME)) && await this.httpExecutor.download(n.url, i, s);
        const l = await this.verifySignature(i);
        if (l != null)
          throw await o(), (0, Ja.newError)(`New version ${t.updateInfoAndProvider.info.version} is not signed by the application owner: ${l}`, "ERR_UPDATER_INVALID_SIGNATURE");
        if (u && await this.differentialDownloadWebPackage(t, c, a, r))
          try {
            await this.httpExecutor.download(new ty.URL(c.path), a, {
              headers: t.requestHeaders,
              cancellationToken: t.cancellationToken,
              sha512: c.sha512
            });
          } catch (d) {
            try {
              await (0, Fx.unlink)(a);
            } catch {
            }
            throw d;
          }
      }
    });
  }
  // $certificateInfo = (Get-AuthenticodeSignature 'xxx\yyy.exe'
  // | where {$_.Status.Equals([System.Management.Automation.SignatureStatus]::Valid) -and $_.SignerCertificate.Subject.Contains("CN=siemens.com")})
  // | Out-String ; if ($certificateInfo) { exit 0 } else { exit 1 }
  async verifySignature(t) {
    let r;
    try {
      if (r = (await this.configOnDisk.value).publisherName, r == null)
        return null;
    } catch (n) {
      if (n.code === "ENOENT")
        return null;
      throw n;
    }
    return await this._verifyUpdateCodeSignature(Array.isArray(r) ? r : [r], t);
  }
  doInstall(t) {
    const r = this.installerPath;
    if (r == null)
      return this.dispatchError(new Error("No update filepath provided, can't quit and install")), !1;
    const n = ["--updated"];
    t.isSilent && n.push("/S"), t.isForceRunAfter && n.push("--force-run"), this.installDirectory && n.push(`/D=${this.installDirectory}`);
    const i = this.downloadedUpdateHelper == null ? null : this.downloadedUpdateHelper.packageFile;
    i != null && n.push(`--package-file=${i}`);
    const s = () => {
      this.spawnLog(Zm.join(process.resourcesPath, "elevate.exe"), [r].concat(n)).catch((a) => this.dispatchError(a));
    };
    return t.isAdminRightsRequired ? (this._logger.info("isAdminRightsRequired is set to true, run installer using elevate.exe"), s(), !0) : (this.spawnLog(r, n).catch((a) => {
      const o = a.code;
      this._logger.info(`Cannot run installer: error code: ${o}, error message: "${a.message}", will be executed again using elevate if EACCES, and will try to use electron.shell.openItem if ENOENT`), o === "UNKNOWN" || o === "EACCES" ? s() : o === "ENOENT" ? Ir.shell.openPath(r).catch((c) => this.dispatchError(c)) : this.dispatchError(a);
    }), !0);
  }
  async differentialDownloadWebPackage(t, r, n, i) {
    if (r.blockMapSize == null)
      return !0;
    try {
      const s = {
        newUrl: new ty.URL(r.path),
        oldFile: Zm.join(this.downloadedUpdateHelper.cacheDir, Ja.CURRENT_APP_PACKAGE_FILE_NAME),
        logger: this._logger,
        newFile: n,
        requestHeaders: this.requestHeaders,
        isUseMultipleRangeRequest: i.isUseMultipleRangeRequest,
        cancellationToken: t.cancellationToken
      };
      this.listenerCount(ey.DOWNLOAD_PROGRESS) > 0 && (s.onProgress = (a) => this.emit(ey.DOWNLOAD_PROGRESS, a)), await new Dx.FileWithEmbeddedBlockMapDifferentialDownloader(r, this.httpExecutor, s).download();
    } catch (s) {
      return this._logger.error(`Cannot download differentially, fallback to full download: ${s.stack || s}`), process.platform === "win32";
    }
    return !1;
  }
}
Gs.NsisUpdater = Lx;
(function(e) {
  var t = mt && mt.__createBinding || (Object.create ? function(v, m, E, T) {
    T === void 0 && (T = E);
    var R = Object.getOwnPropertyDescriptor(m, E);
    (!R || ("get" in R ? !m.__esModule : R.writable || R.configurable)) && (R = { enumerable: !0, get: function() {
      return m[E];
    } }), Object.defineProperty(v, T, R);
  } : function(v, m, E, T) {
    T === void 0 && (T = E), v[T] = m[E];
  }), r = mt && mt.__exportStar || function(v, m) {
    for (var E in v) E !== "default" && !Object.prototype.hasOwnProperty.call(m, E) && t(m, v, E);
  };
  Object.defineProperty(e, "__esModule", { value: !0 }), e.NsisUpdater = e.MacUpdater = e.RpmUpdater = e.PacmanUpdater = e.DebUpdater = e.AppImageUpdater = e.Provider = e.NoOpLogger = e.AppUpdater = e.BaseUpdater = void 0;
  const n = gn, i = Re;
  var s = Xn;
  Object.defineProperty(e, "BaseUpdater", { enumerable: !0, get: function() {
    return s.BaseUpdater;
  } });
  var a = un;
  Object.defineProperty(e, "AppUpdater", { enumerable: !0, get: function() {
    return a.AppUpdater;
  } }), Object.defineProperty(e, "NoOpLogger", { enumerable: !0, get: function() {
    return a.NoOpLogger;
  } });
  var o = je;
  Object.defineProperty(e, "Provider", { enumerable: !0, get: function() {
    return o.Provider;
  } });
  var c = xs;
  Object.defineProperty(e, "AppImageUpdater", { enumerable: !0, get: function() {
    return c.AppImageUpdater;
  } });
  var u = Vs;
  Object.defineProperty(e, "DebUpdater", { enumerable: !0, get: function() {
    return u.DebUpdater;
  } });
  var l = qs;
  Object.defineProperty(e, "PacmanUpdater", { enumerable: !0, get: function() {
    return l.PacmanUpdater;
  } });
  var d = Bs;
  Object.defineProperty(e, "RpmUpdater", { enumerable: !0, get: function() {
    return d.RpmUpdater;
  } });
  var h = Hs;
  Object.defineProperty(e, "MacUpdater", { enumerable: !0, get: function() {
    return h.MacUpdater;
  } });
  var p = Gs;
  Object.defineProperty(e, "NsisUpdater", { enumerable: !0, get: function() {
    return p.NsisUpdater;
  } }), r(_n, e);
  let $;
  function _() {
    if (process.platform === "win32")
      $ = new Gs.NsisUpdater();
    else if (process.platform === "darwin")
      $ = new Hs.MacUpdater();
    else {
      $ = new xs.AppImageUpdater();
      try {
        const v = i.join(process.resourcesPath, "package-type");
        if (!(0, n.existsSync)(v))
          return $;
        console.info("Checking for beta autoupdate feature for deb/rpm distributions");
        const m = (0, n.readFileSync)(v).toString().trim();
        switch (console.info("Found package-type:", m), m) {
          case "deb":
            $ = new Vs.DebUpdater();
            break;
          case "rpm":
            $ = new Bs.RpmUpdater();
            break;
          case "pacman":
            $ = new qs.PacmanUpdater();
            break;
          default:
            break;
        }
      } catch (v) {
        console.warn("Unable to detect 'package-type' for autoUpdater (rpm/deb/pacman support). If you'd like to expand support, please consider contributing to electron-builder", v.message);
      }
    }
    return $;
  }
  Object.defineProperty(e, "autoUpdater", {
    enumerable: !0,
    get: () => $ || _()
  });
})(Tr);
const Ev = he.dirname(T$(import.meta.url));
process.env.APP_ROOT = he.join(Ev, "..");
const Lo = process.env.VITE_DEV_SERVER_URL, p3 = he.join(process.env.APP_ROOT, "dist-electron"), bv = he.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = Lo ? he.join(process.env.APP_ROOT, "public") : bv;
let Ee;
const ui = new ak(), Qa = "secure_steam_password";
function Sv() {
  Ee = new ry({
    title: "MacPipeGUI Multi",
    width: 1165,
    height: 720,
    minWidth: 800,
    minHeight: 600,
    resizable: !1,
    icon: he.join(process.env.VITE_PUBLIC, "app-icon.png"),
    autoHideMenuBar: !0,
    // Hides the default menu bar
    webPreferences: {
      preload: he.join(Ev, "preload.mjs"),
      nodeIntegration: !1,
      contextIsolation: !0
    }
  }), Ee.setMenuBarVisibility(!1), Ee.webContents.on("did-finish-load", () => {
    Ee == null || Ee.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
  }), Lo ? Ee.loadURL(Lo) : Ee.loadFile(he.join(bv, "index.html"));
}
Qr.on("window-all-closed", () => {
  process.platform !== "darwin" && (Qr.quit(), Ee = null);
});
Qr.on("activate", () => {
  ry.getAllWindows().length === 0 && Sv();
});
Qr.whenReady().then(() => {
  if (Sv(), ze.handle("get-store", (e, t) => ui.get(t)), ze.handle("set-store", (e, t, r) => {
    ui.set(t, r);
  }), ze.handle("save-secure-password", (e, t) => {
    try {
      if (!ts.isEncryptionAvailable())
        return ui.set(Qa, Buffer.from(t).toString("base64")), { success: !0, encrypted: !1 };
      const r = ts.encryptString(t);
      return ui.set(Qa, r.toString("base64")), { success: !0, encrypted: !0 };
    } catch (r) {
      return console.error("Failed to save password:", r), { success: !1, error: String(r) };
    }
  }), ze.handle("get-secure-password", () => {
    try {
      const e = ui.get(Qa);
      if (!e) return { success: !0, password: "" };
      const t = Buffer.from(e, "base64");
      return ts.isEncryptionAvailable() ? { success: !0, password: ts.decryptString(t), encrypted: !0 } : { success: !0, password: t.toString("utf8"), encrypted: !1 };
    } catch (e) {
      return console.error("Failed to get password:", e), { success: !1, password: "", error: String(e) };
    }
  }), ze.handle("clear-secure-password", () => {
    try {
      return ui.delete(Qa), { success: !0 };
    } catch (e) {
      return { success: !1, error: String(e) };
    }
  }), ze.handle("is-encryption-available", () => ts.isEncryptionAvailable()), ze.handle("select-directory", async () => {
    const e = await P$.showOpenDialog(Ee, {
      properties: ["openDirectory"]
    });
    return e.canceled ? null : e.filePaths[0];
  }), ze.handle("generate-vdf", async (e, t, r) => cy.generateFiles(t, r)), ze.on("run-build", (e, t, r, n) => {
    Ee && di.runBuild(Ee, t, r, n);
  }), ze.on("stop-build", () => {
    di.stopBuild();
  }), ze.on("steam-guard-code", (e, t) => {
    di.writeInput(t);
  }), ze.on("test-run", (e, t, r) => {
    Ee && di.testRun(Ee, t, r);
  }), ze.handle("validate-config", async (e, t) => di.validateSetup(t)), ze.handle("get-app-version", () => Qr.getVersion()), ze.handle("check-for-updates", async () => {
    var e, t;
    try {
      const r = await Tr.autoUpdater.checkForUpdates();
      return {
        success: !0,
        updateAvailable: ((e = r == null ? void 0 : r.updateInfo) == null ? void 0 : e.version) !== Qr.getVersion(),
        currentVersion: Qr.getVersion(),
        latestVersion: ((t = r == null ? void 0 : r.updateInfo) == null ? void 0 : t.version) || Qr.getVersion()
      };
    } catch (r) {
      return { success: !1, error: String(r) };
    }
  }), ze.handle("download-update", async () => {
    try {
      return await Tr.autoUpdater.downloadUpdate(), { success: !0 };
    } catch (e) {
      return { success: !1, error: String(e) };
    }
  }), ze.handle("install-update", () => {
    Tr.autoUpdater.quitAndInstall();
  }), Tr.autoUpdater.on("update-available", (e) => {
    Ee == null || Ee.webContents.send("update-available", e);
  }), Tr.autoUpdater.on("update-downloaded", (e) => {
    Ee == null || Ee.webContents.send("update-downloaded", e);
  }), Tr.autoUpdater.on("error", (e) => {
    Ee == null || Ee.webContents.send("update-error", e.message);
  }), Tr.autoUpdater.on("download-progress", (e) => {
    Ee == null || Ee.webContents.send("update-progress", e);
  }), !Lo)
    try {
      Tr.autoUpdater.checkForUpdatesAndNotify();
    } catch (e) {
      console.error("Failed to check for updates:", e);
    }
});
export {
  p3 as MAIN_DIST,
  bv as RENDERER_DIST,
  Lo as VITE_DEV_SERVER_URL
};

import { createRequire } from "module"; const require = createRequire(import.meta.url);
var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// node_modules/hono/dist/compose.js
var compose;
var init_compose = __esm({
  "node_modules/hono/dist/compose.js"() {
    compose = (middleware, onError, onNotFound) => {
      return (context, next) => {
        let index = -1;
        return dispatch(0);
        async function dispatch(i) {
          if (i <= index) {
            throw new Error("next() called multiple times");
          }
          index = i;
          let res;
          let isError = false;
          let handler2;
          if (middleware[i]) {
            handler2 = middleware[i][0][0];
            context.req.routeIndex = i;
          } else {
            handler2 = i === middleware.length && next || void 0;
          }
          if (handler2) {
            try {
              res = await handler2(context, () => dispatch(i + 1));
            } catch (err) {
              if (err instanceof Error && onError) {
                context.error = err;
                res = await onError(err, context);
                isError = true;
              } else {
                throw err;
              }
            }
          } else {
            if (context.finalized === false && onNotFound) {
              res = await onNotFound(context);
            }
          }
          if (res && (context.finalized === false || isError)) {
            context.res = res;
          }
          return context;
        }
      };
    };
  }
});

// node_modules/hono/dist/http-exception.js
var init_http_exception = __esm({
  "node_modules/hono/dist/http-exception.js"() {
  }
});

// node_modules/hono/dist/request/constants.js
var GET_MATCH_RESULT;
var init_constants = __esm({
  "node_modules/hono/dist/request/constants.js"() {
    GET_MATCH_RESULT = /* @__PURE__ */ Symbol();
  }
});

// node_modules/hono/dist/utils/body.js
async function parseFormData(request, options) {
  const formData = await request.formData();
  if (formData) {
    return convertFormDataToBodyData(formData, options);
  }
  return {};
}
function convertFormDataToBodyData(formData, options) {
  const form = /* @__PURE__ */ Object.create(null);
  formData.forEach((value, key) => {
    const shouldParseAllValues = options.all || key.endsWith("[]");
    if (!shouldParseAllValues) {
      form[key] = value;
    } else {
      handleParsingAllValues(form, key, value);
    }
  });
  if (options.dot) {
    Object.entries(form).forEach(([key, value]) => {
      const shouldParseDotValues = key.includes(".");
      if (shouldParseDotValues) {
        handleParsingNestedValues(form, key, value);
        delete form[key];
      }
    });
  }
  return form;
}
var parseBody, handleParsingAllValues, handleParsingNestedValues;
var init_body = __esm({
  "node_modules/hono/dist/utils/body.js"() {
    init_request();
    parseBody = async (request, options = /* @__PURE__ */ Object.create(null)) => {
      const { all = false, dot = false } = options;
      const headers = request instanceof HonoRequest ? request.raw.headers : request.headers;
      const contentType = headers.get("Content-Type");
      if (contentType?.startsWith("multipart/form-data") || contentType?.startsWith("application/x-www-form-urlencoded")) {
        return parseFormData(request, { all, dot });
      }
      return {};
    };
    handleParsingAllValues = (form, key, value) => {
      if (form[key] !== void 0) {
        if (Array.isArray(form[key])) {
          ;
          form[key].push(value);
        } else {
          form[key] = [form[key], value];
        }
      } else {
        if (!key.endsWith("[]")) {
          form[key] = value;
        } else {
          form[key] = [value];
        }
      }
    };
    handleParsingNestedValues = (form, key, value) => {
      if (/(?:^|\.)__proto__\./.test(key)) {
        return;
      }
      let nestedForm = form;
      const keys = key.split(".");
      keys.forEach((key2, index) => {
        if (index === keys.length - 1) {
          nestedForm[key2] = value;
        } else {
          if (!nestedForm[key2] || typeof nestedForm[key2] !== "object" || Array.isArray(nestedForm[key2]) || nestedForm[key2] instanceof File) {
            nestedForm[key2] = /* @__PURE__ */ Object.create(null);
          }
          nestedForm = nestedForm[key2];
        }
      });
    };
  }
});

// node_modules/hono/dist/utils/url.js
var splitPath, splitRoutingPath, extractGroupsFromPath, replaceGroupMarks, patternCache, getPattern, tryDecode, tryDecodeURI, getPath, getPathNoStrict, mergePath, checkOptionalParameter, _decodeURI, _getQueryParam, getQueryParam, getQueryParams, decodeURIComponent_;
var init_url = __esm({
  "node_modules/hono/dist/utils/url.js"() {
    splitPath = (path) => {
      const paths = path.split("/");
      if (paths[0] === "") {
        paths.shift();
      }
      return paths;
    };
    splitRoutingPath = (routePath) => {
      const { groups, path } = extractGroupsFromPath(routePath);
      const paths = splitPath(path);
      return replaceGroupMarks(paths, groups);
    };
    extractGroupsFromPath = (path) => {
      const groups = [];
      path = path.replace(/\{[^}]+\}/g, (match2, index) => {
        const mark = `@${index}`;
        groups.push([mark, match2]);
        return mark;
      });
      return { groups, path };
    };
    replaceGroupMarks = (paths, groups) => {
      for (let i = groups.length - 1; i >= 0; i--) {
        const [mark] = groups[i];
        for (let j = paths.length - 1; j >= 0; j--) {
          if (paths[j].includes(mark)) {
            paths[j] = paths[j].replace(mark, groups[i][1]);
            break;
          }
        }
      }
      return paths;
    };
    patternCache = {};
    getPattern = (label, next) => {
      if (label === "*") {
        return "*";
      }
      const match2 = label.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);
      if (match2) {
        const cacheKey = `${label}#${next}`;
        if (!patternCache[cacheKey]) {
          if (match2[2]) {
            patternCache[cacheKey] = next && next[0] !== ":" && next[0] !== "*" ? [cacheKey, match2[1], new RegExp(`^${match2[2]}(?=/${next})`)] : [label, match2[1], new RegExp(`^${match2[2]}$`)];
          } else {
            patternCache[cacheKey] = [label, match2[1], true];
          }
        }
        return patternCache[cacheKey];
      }
      return null;
    };
    tryDecode = (str, decoder) => {
      try {
        return decoder(str);
      } catch {
        return str.replace(/(?:%[0-9A-Fa-f]{2})+/g, (match2) => {
          try {
            return decoder(match2);
          } catch {
            return match2;
          }
        });
      }
    };
    tryDecodeURI = (str) => tryDecode(str, decodeURI);
    getPath = (request) => {
      const url2 = request.url;
      const start = url2.indexOf("/", url2.indexOf(":") + 4);
      let i = start;
      for (; i < url2.length; i++) {
        const charCode = url2.charCodeAt(i);
        if (charCode === 37) {
          const queryIndex = url2.indexOf("?", i);
          const hashIndex = url2.indexOf("#", i);
          const end = queryIndex === -1 ? hashIndex === -1 ? void 0 : hashIndex : hashIndex === -1 ? queryIndex : Math.min(queryIndex, hashIndex);
          const path = url2.slice(start, end);
          return tryDecodeURI(path.includes("%25") ? path.replace(/%25/g, "%2525") : path);
        } else if (charCode === 63 || charCode === 35) {
          break;
        }
      }
      return url2.slice(start, i);
    };
    getPathNoStrict = (request) => {
      const result = getPath(request);
      return result.length > 1 && result.at(-1) === "/" ? result.slice(0, -1) : result;
    };
    mergePath = (base, sub, ...rest) => {
      if (rest.length) {
        sub = mergePath(sub, ...rest);
      }
      return `${base?.[0] === "/" ? "" : "/"}${base}${sub === "/" ? "" : `${base?.at(-1) === "/" ? "" : "/"}${sub?.[0] === "/" ? sub.slice(1) : sub}`}`;
    };
    checkOptionalParameter = (path) => {
      if (path.charCodeAt(path.length - 1) !== 63 || !path.includes(":")) {
        return null;
      }
      const segments = path.split("/");
      const results = [];
      let basePath = "";
      segments.forEach((segment) => {
        if (segment !== "" && !/\:/.test(segment)) {
          basePath += "/" + segment;
        } else if (/\:/.test(segment)) {
          if (/\?/.test(segment)) {
            if (results.length === 0 && basePath === "") {
              results.push("/");
            } else {
              results.push(basePath);
            }
            const optionalSegment = segment.replace("?", "");
            basePath += "/" + optionalSegment;
            results.push(basePath);
          } else {
            basePath += "/" + segment;
          }
        }
      });
      return results.filter((v, i, a) => a.indexOf(v) === i);
    };
    _decodeURI = (value) => {
      if (!/[%+]/.test(value)) {
        return value;
      }
      if (value.indexOf("+") !== -1) {
        value = value.replace(/\+/g, " ");
      }
      return value.indexOf("%") !== -1 ? tryDecode(value, decodeURIComponent_) : value;
    };
    _getQueryParam = (url2, key, multiple) => {
      let encoded;
      if (!multiple && key && !/[%+]/.test(key)) {
        let keyIndex2 = url2.indexOf("?", 8);
        if (keyIndex2 === -1) {
          return void 0;
        }
        if (!url2.startsWith(key, keyIndex2 + 1)) {
          keyIndex2 = url2.indexOf(`&${key}`, keyIndex2 + 1);
        }
        while (keyIndex2 !== -1) {
          const trailingKeyCode = url2.charCodeAt(keyIndex2 + key.length + 1);
          if (trailingKeyCode === 61) {
            const valueIndex = keyIndex2 + key.length + 2;
            const endIndex = url2.indexOf("&", valueIndex);
            return _decodeURI(url2.slice(valueIndex, endIndex === -1 ? void 0 : endIndex));
          } else if (trailingKeyCode == 38 || isNaN(trailingKeyCode)) {
            return "";
          }
          keyIndex2 = url2.indexOf(`&${key}`, keyIndex2 + 1);
        }
        encoded = /[%+]/.test(url2);
        if (!encoded) {
          return void 0;
        }
      }
      const results = {};
      encoded ??= /[%+]/.test(url2);
      let keyIndex = url2.indexOf("?", 8);
      while (keyIndex !== -1) {
        const nextKeyIndex = url2.indexOf("&", keyIndex + 1);
        let valueIndex = url2.indexOf("=", keyIndex);
        if (valueIndex > nextKeyIndex && nextKeyIndex !== -1) {
          valueIndex = -1;
        }
        let name = url2.slice(
          keyIndex + 1,
          valueIndex === -1 ? nextKeyIndex === -1 ? void 0 : nextKeyIndex : valueIndex
        );
        if (encoded) {
          name = _decodeURI(name);
        }
        keyIndex = nextKeyIndex;
        if (name === "") {
          continue;
        }
        let value;
        if (valueIndex === -1) {
          value = "";
        } else {
          value = url2.slice(valueIndex + 1, nextKeyIndex === -1 ? void 0 : nextKeyIndex);
          if (encoded) {
            value = _decodeURI(value);
          }
        }
        if (multiple) {
          if (!(results[name] && Array.isArray(results[name]))) {
            results[name] = [];
          }
          ;
          results[name].push(value);
        } else {
          results[name] ??= value;
        }
      }
      return key ? results[key] : results;
    };
    getQueryParam = _getQueryParam;
    getQueryParams = (url2, key) => {
      return _getQueryParam(url2, key, true);
    };
    decodeURIComponent_ = decodeURIComponent;
  }
});

// node_modules/hono/dist/request.js
var tryDecodeURIComponent, HonoRequest;
var init_request = __esm({
  "node_modules/hono/dist/request.js"() {
    init_http_exception();
    init_constants();
    init_body();
    init_url();
    tryDecodeURIComponent = (str) => tryDecode(str, decodeURIComponent_);
    HonoRequest = class {
      /**
       * `.raw` can get the raw Request object.
       *
       * @see {@link https://hono.dev/docs/api/request#raw}
       *
       * @example
       * ```ts
       * // For Cloudflare Workers
       * app.post('/', async (c) => {
       *   const metadata = c.req.raw.cf?.hostMetadata?
       *   ...
       * })
       * ```
       */
      raw;
      #validatedData;
      // Short name of validatedData
      #matchResult;
      routeIndex = 0;
      /**
       * `.path` can get the pathname of the request.
       *
       * @see {@link https://hono.dev/docs/api/request#path}
       *
       * @example
       * ```ts
       * app.get('/about/me', (c) => {
       *   const pathname = c.req.path // `/about/me`
       * })
       * ```
       */
      path;
      bodyCache = {};
      constructor(request, path = "/", matchResult = [[]]) {
        this.raw = request;
        this.path = path;
        this.#matchResult = matchResult;
        this.#validatedData = {};
      }
      param(key) {
        return key ? this.#getDecodedParam(key) : this.#getAllDecodedParams();
      }
      #getDecodedParam(key) {
        const paramKey = this.#matchResult[0][this.routeIndex][1][key];
        const param = this.#getParamValue(paramKey);
        return param && /\%/.test(param) ? tryDecodeURIComponent(param) : param;
      }
      #getAllDecodedParams() {
        const decoded = {};
        const keys = Object.keys(this.#matchResult[0][this.routeIndex][1]);
        for (const key of keys) {
          const value = this.#getParamValue(this.#matchResult[0][this.routeIndex][1][key]);
          if (value !== void 0) {
            decoded[key] = /\%/.test(value) ? tryDecodeURIComponent(value) : value;
          }
        }
        return decoded;
      }
      #getParamValue(paramKey) {
        return this.#matchResult[1] ? this.#matchResult[1][paramKey] : paramKey;
      }
      query(key) {
        return getQueryParam(this.url, key);
      }
      queries(key) {
        return getQueryParams(this.url, key);
      }
      header(name) {
        if (name) {
          return this.raw.headers.get(name) ?? void 0;
        }
        const headerData = {};
        this.raw.headers.forEach((value, key) => {
          headerData[key] = value;
        });
        return headerData;
      }
      async parseBody(options) {
        return parseBody(this, options);
      }
      #cachedBody = (key) => {
        const { bodyCache, raw: raw2 } = this;
        const cachedBody = bodyCache[key];
        if (cachedBody) {
          return cachedBody;
        }
        const anyCachedKey = Object.keys(bodyCache)[0];
        if (anyCachedKey) {
          return bodyCache[anyCachedKey].then((body) => {
            if (anyCachedKey === "json") {
              body = JSON.stringify(body);
            }
            return new Response(body)[key]();
          });
        }
        return bodyCache[key] = raw2[key]();
      };
      /**
       * `.json()` can parse Request body of type `application/json`
       *
       * @see {@link https://hono.dev/docs/api/request#json}
       *
       * @example
       * ```ts
       * app.post('/entry', async (c) => {
       *   const body = await c.req.json()
       * })
       * ```
       */
      json() {
        return this.#cachedBody("text").then((text) => JSON.parse(text));
      }
      /**
       * `.text()` can parse Request body of type `text/plain`
       *
       * @see {@link https://hono.dev/docs/api/request#text}
       *
       * @example
       * ```ts
       * app.post('/entry', async (c) => {
       *   const body = await c.req.text()
       * })
       * ```
       */
      text() {
        return this.#cachedBody("text");
      }
      /**
       * `.arrayBuffer()` parse Request body as an `ArrayBuffer`
       *
       * @see {@link https://hono.dev/docs/api/request#arraybuffer}
       *
       * @example
       * ```ts
       * app.post('/entry', async (c) => {
       *   const body = await c.req.arrayBuffer()
       * })
       * ```
       */
      arrayBuffer() {
        return this.#cachedBody("arrayBuffer");
      }
      /**
       * `.bytes()` parses the request body as a `Uint8Array`.
       *
       * @see {@link https://hono.dev/docs/api/request#bytes}
       *
       * @example
       * ```ts
       * app.post('/entry', async (c) => {
       *   const body = await c.req.bytes()
       * })
       * ```
       */
      bytes() {
        return this.#cachedBody("arrayBuffer").then((buffer) => new Uint8Array(buffer));
      }
      /**
       * Parses the request body as a `Blob`.
       * @example
       * ```ts
       * app.post('/entry', async (c) => {
       *   const body = await c.req.blob();
       * });
       * ```
       * @see https://hono.dev/docs/api/request#blob
       */
      blob() {
        return this.#cachedBody("blob");
      }
      /**
       * Parses the request body as `FormData`.
       * @example
       * ```ts
       * app.post('/entry', async (c) => {
       *   const body = await c.req.formData();
       * });
       * ```
       * @see https://hono.dev/docs/api/request#formdata
       */
      formData() {
        return this.#cachedBody("formData");
      }
      /**
       * Adds validated data to the request.
       *
       * @param target - The target of the validation.
       * @param data - The validated data to add.
       */
      addValidatedData(target, data) {
        this.#validatedData[target] = data;
      }
      valid(target) {
        return this.#validatedData[target];
      }
      /**
       * `.url()` can get the request url strings.
       *
       * @see {@link https://hono.dev/docs/api/request#url}
       *
       * @example
       * ```ts
       * app.get('/about/me', (c) => {
       *   const url = c.req.url // `http://localhost:8787/about/me`
       *   ...
       * })
       * ```
       */
      get url() {
        return this.raw.url;
      }
      /**
       * `.method()` can get the method name of the request.
       *
       * @see {@link https://hono.dev/docs/api/request#method}
       *
       * @example
       * ```ts
       * app.get('/about/me', (c) => {
       *   const method = c.req.method // `GET`
       * })
       * ```
       */
      get method() {
        return this.raw.method;
      }
      get [GET_MATCH_RESULT]() {
        return this.#matchResult;
      }
      /**
       * `.matchedRoutes()` can return a matched route in the handler
       *
       * @deprecated
       *
       * Use matchedRoutes helper defined in "hono/route" instead.
       *
       * @see {@link https://hono.dev/docs/api/request#matchedroutes}
       *
       * @example
       * ```ts
       * app.use('*', async function logger(c, next) {
       *   await next()
       *   c.req.matchedRoutes.forEach(({ handler, method, path }, i) => {
       *     const name = handler.name || (handler.length < 2 ? '[handler]' : '[middleware]')
       *     console.log(
       *       method,
       *       ' ',
       *       path,
       *       ' '.repeat(Math.max(10 - path.length, 0)),
       *       name,
       *       i === c.req.routeIndex ? '<- respond from here' : ''
       *     )
       *   })
       * })
       * ```
       */
      get matchedRoutes() {
        return this.#matchResult[0].map(([[, route]]) => route);
      }
      /**
       * `routePath()` can retrieve the path registered within the handler
       *
       * @deprecated
       *
       * Use routePath helper defined in "hono/route" instead.
       *
       * @see {@link https://hono.dev/docs/api/request#routepath}
       *
       * @example
       * ```ts
       * app.get('/posts/:id', (c) => {
       *   return c.json({ path: c.req.routePath })
       * })
       * ```
       */
      get routePath() {
        return this.#matchResult[0].map(([[, route]]) => route)[this.routeIndex].path;
      }
    };
  }
});

// node_modules/hono/dist/utils/html.js
var HtmlEscapedCallbackPhase, raw, resolveCallback;
var init_html = __esm({
  "node_modules/hono/dist/utils/html.js"() {
    HtmlEscapedCallbackPhase = {
      Stringify: 1,
      BeforeStream: 2,
      Stream: 3
    };
    raw = (value, callbacks) => {
      const escapedString = new String(value);
      escapedString.isEscaped = true;
      escapedString.callbacks = callbacks;
      return escapedString;
    };
    resolveCallback = async (str, phase, preserveCallbacks, context, buffer) => {
      if (typeof str === "object" && !(str instanceof String)) {
        if (!(str instanceof Promise)) {
          str = str.toString();
        }
        if (str instanceof Promise) {
          str = await str;
        }
      }
      const callbacks = str.callbacks;
      if (!callbacks?.length) {
        return Promise.resolve(str);
      }
      if (buffer) {
        buffer[0] += str;
      } else {
        buffer = [str];
      }
      const resStr = Promise.all(callbacks.map((c) => c({ phase, buffer, context }))).then(
        (res) => Promise.all(
          res.filter(Boolean).map((str2) => resolveCallback(str2, phase, false, context, buffer))
        ).then(() => buffer[0])
      );
      if (preserveCallbacks) {
        return raw(await resStr, callbacks);
      } else {
        return resStr;
      }
    };
  }
});

// node_modules/hono/dist/context.js
var TEXT_PLAIN, setDefaultContentType, createResponseInstance, Context;
var init_context = __esm({
  "node_modules/hono/dist/context.js"() {
    init_request();
    init_html();
    TEXT_PLAIN = "text/plain; charset=UTF-8";
    setDefaultContentType = (contentType, headers) => {
      return {
        "Content-Type": contentType,
        ...headers
      };
    };
    createResponseInstance = (body, init) => new Response(body, init);
    Context = class {
      #rawRequest;
      #req;
      /**
       * `.env` can get bindings (environment variables, secrets, KV namespaces, D1 database, R2 bucket etc.) in Cloudflare Workers.
       *
       * @see {@link https://hono.dev/docs/api/context#env}
       *
       * @example
       * ```ts
       * // Environment object for Cloudflare Workers
       * app.get('*', async c => {
       *   const counter = c.env.COUNTER
       * })
       * ```
       */
      env = {};
      #var;
      finalized = false;
      /**
       * `.error` can get the error object from the middleware if the Handler throws an error.
       *
       * @see {@link https://hono.dev/docs/api/context#error}
       *
       * @example
       * ```ts
       * app.use('*', async (c, next) => {
       *   await next()
       *   if (c.error) {
       *     // do something...
       *   }
       * })
       * ```
       */
      error;
      #status;
      #executionCtx;
      #res;
      #layout;
      #renderer;
      #notFoundHandler;
      #preparedHeaders;
      #matchResult;
      #path;
      /**
       * Creates an instance of the Context class.
       *
       * @param req - The Request object.
       * @param options - Optional configuration options for the context.
       */
      constructor(req, options) {
        this.#rawRequest = req;
        if (options) {
          this.#executionCtx = options.executionCtx;
          this.env = options.env;
          this.#notFoundHandler = options.notFoundHandler;
          this.#path = options.path;
          this.#matchResult = options.matchResult;
        }
      }
      /**
       * `.req` is the instance of {@link HonoRequest}.
       */
      get req() {
        this.#req ??= new HonoRequest(this.#rawRequest, this.#path, this.#matchResult);
        return this.#req;
      }
      /**
       * @see {@link https://hono.dev/docs/api/context#event}
       * The FetchEvent associated with the current request.
       *
       * @throws Will throw an error if the context does not have a FetchEvent.
       */
      get event() {
        if (this.#executionCtx && "respondWith" in this.#executionCtx) {
          return this.#executionCtx;
        } else {
          throw Error("This context has no FetchEvent");
        }
      }
      /**
       * @see {@link https://hono.dev/docs/api/context#executionctx}
       * The ExecutionContext associated with the current request.
       *
       * @throws Will throw an error if the context does not have an ExecutionContext.
       */
      get executionCtx() {
        if (this.#executionCtx) {
          return this.#executionCtx;
        } else {
          throw Error("This context has no ExecutionContext");
        }
      }
      /**
       * @see {@link https://hono.dev/docs/api/context#res}
       * The Response object for the current request.
       */
      get res() {
        return this.#res ||= createResponseInstance(null, {
          headers: this.#preparedHeaders ??= new Headers()
        });
      }
      /**
       * Sets the Response object for the current request.
       *
       * @param _res - The Response object to set.
       */
      set res(_res) {
        if (this.#res && _res) {
          _res = createResponseInstance(_res.body, _res);
          for (const [k, v] of this.#res.headers.entries()) {
            if (k === "content-type") {
              continue;
            }
            if (k === "set-cookie") {
              const cookies = this.#res.headers.getSetCookie();
              _res.headers.delete("set-cookie");
              for (const cookie of cookies) {
                _res.headers.append("set-cookie", cookie);
              }
            } else {
              _res.headers.set(k, v);
            }
          }
        }
        this.#res = _res;
        this.finalized = true;
      }
      /**
       * `.render()` can create a response within a layout.
       *
       * @see {@link https://hono.dev/docs/api/context#render-setrenderer}
       *
       * @example
       * ```ts
       * app.get('/', (c) => {
       *   return c.render('Hello!')
       * })
       * ```
       */
      render = (...args) => {
        this.#renderer ??= (content) => this.html(content);
        return this.#renderer(...args);
      };
      /**
       * Sets the layout for the response.
       *
       * @param layout - The layout to set.
       * @returns The layout function.
       */
      setLayout = (layout) => this.#layout = layout;
      /**
       * Gets the current layout for the response.
       *
       * @returns The current layout function.
       */
      getLayout = () => this.#layout;
      /**
       * `.setRenderer()` can set the layout in the custom middleware.
       *
       * @see {@link https://hono.dev/docs/api/context#render-setrenderer}
       *
       * @example
       * ```tsx
       * app.use('*', async (c, next) => {
       *   c.setRenderer((content) => {
       *     return c.html(
       *       <html>
       *         <body>
       *           <p>{content}</p>
       *         </body>
       *       </html>
       *     )
       *   })
       *   await next()
       * })
       * ```
       */
      setRenderer = (renderer) => {
        this.#renderer = renderer;
      };
      /**
       * `.header()` can set headers.
       *
       * @see {@link https://hono.dev/docs/api/context#header}
       *
       * @example
       * ```ts
       * app.get('/welcome', (c) => {
       *   // Set headers
       *   c.header('X-Message', 'Hello!')
       *   c.header('Content-Type', 'text/plain')
       *
       *   return c.body('Thank you for coming')
       * })
       * ```
       */
      header = (name, value, options) => {
        if (this.finalized) {
          this.#res = createResponseInstance(this.#res.body, this.#res);
        }
        const headers = this.#res ? this.#res.headers : this.#preparedHeaders ??= new Headers();
        if (value === void 0) {
          headers.delete(name);
        } else if (options?.append) {
          headers.append(name, value);
        } else {
          headers.set(name, value);
        }
      };
      status = (status) => {
        this.#status = status;
      };
      /**
       * `.set()` can set the value specified by the key.
       *
       * @see {@link https://hono.dev/docs/api/context#set-get}
       *
       * @example
       * ```ts
       * app.use('*', async (c, next) => {
       *   c.set('message', 'Hono is hot!!')
       *   await next()
       * })
       * ```
       */
      set = (key, value) => {
        this.#var ??= /* @__PURE__ */ new Map();
        this.#var.set(key, value);
      };
      /**
       * `.get()` can use the value specified by the key.
       *
       * @see {@link https://hono.dev/docs/api/context#set-get}
       *
       * @example
       * ```ts
       * app.get('/', (c) => {
       *   const message = c.get('message')
       *   return c.text(`The message is "${message}"`)
       * })
       * ```
       */
      get = (key) => {
        return this.#var ? this.#var.get(key) : void 0;
      };
      /**
       * `.var` can access the value of a variable.
       *
       * @see {@link https://hono.dev/docs/api/context#var}
       *
       * @example
       * ```ts
       * const result = c.var.client.oneMethod()
       * ```
       */
      // c.var.propName is a read-only
      get var() {
        if (!this.#var) {
          return {};
        }
        return Object.fromEntries(this.#var);
      }
      #newResponse(data, arg, headers) {
        const responseHeaders = this.#res ? new Headers(this.#res.headers) : this.#preparedHeaders ?? new Headers();
        if (typeof arg === "object" && "headers" in arg) {
          const argHeaders = arg.headers instanceof Headers ? arg.headers : new Headers(arg.headers);
          for (const [key, value] of argHeaders) {
            if (key.toLowerCase() === "set-cookie") {
              responseHeaders.append(key, value);
            } else {
              responseHeaders.set(key, value);
            }
          }
        }
        if (headers) {
          for (const [k, v] of Object.entries(headers)) {
            if (typeof v === "string") {
              responseHeaders.set(k, v);
            } else {
              responseHeaders.delete(k);
              for (const v2 of v) {
                responseHeaders.append(k, v2);
              }
            }
          }
        }
        const status = typeof arg === "number" ? arg : arg?.status ?? this.#status;
        return createResponseInstance(data, { status, headers: responseHeaders });
      }
      newResponse = (...args) => this.#newResponse(...args);
      /**
       * `.body()` can return the HTTP response.
       * You can set headers with `.header()` and set HTTP status code with `.status`.
       * This can also be set in `.text()`, `.json()` and so on.
       *
       * @see {@link https://hono.dev/docs/api/context#body}
       *
       * @example
       * ```ts
       * app.get('/welcome', (c) => {
       *   // Set headers
       *   c.header('X-Message', 'Hello!')
       *   c.header('Content-Type', 'text/plain')
       *   // Set HTTP status code
       *   c.status(201)
       *
       *   // Return the response body
       *   return c.body('Thank you for coming')
       * })
       * ```
       */
      body = (data, arg, headers) => this.#newResponse(data, arg, headers);
      /**
       * `.text()` can render text as `Content-Type:text/plain`.
       *
       * @see {@link https://hono.dev/docs/api/context#text}
       *
       * @example
       * ```ts
       * app.get('/say', (c) => {
       *   return c.text('Hello!')
       * })
       * ```
       */
      text = (text, arg, headers) => {
        return !this.#preparedHeaders && !this.#status && !arg && !headers && !this.finalized ? new Response(text) : this.#newResponse(
          text,
          arg,
          setDefaultContentType(TEXT_PLAIN, headers)
        );
      };
      /**
       * `.json()` can render JSON as `Content-Type:application/json`.
       *
       * @see {@link https://hono.dev/docs/api/context#json}
       *
       * @example
       * ```ts
       * app.get('/api', (c) => {
       *   return c.json({ message: 'Hello!' })
       * })
       * ```
       */
      json = (object, arg, headers) => {
        return this.#newResponse(
          JSON.stringify(object),
          arg,
          setDefaultContentType("application/json", headers)
        );
      };
      html = (html, arg, headers) => {
        const res = (html2) => this.#newResponse(html2, arg, setDefaultContentType("text/html; charset=UTF-8", headers));
        return typeof html === "object" ? resolveCallback(html, HtmlEscapedCallbackPhase.Stringify, false, {}).then(res) : res(html);
      };
      /**
       * `.redirect()` can Redirect, default status code is 302.
       *
       * @see {@link https://hono.dev/docs/api/context#redirect}
       *
       * @example
       * ```ts
       * app.get('/redirect', (c) => {
       *   return c.redirect('/')
       * })
       * app.get('/redirect-permanently', (c) => {
       *   return c.redirect('/', 301)
       * })
       * ```
       */
      redirect = (location, status) => {
        const locationString = String(location);
        this.header(
          "Location",
          // Multibyes should be encoded
          // eslint-disable-next-line no-control-regex
          !/[^\x00-\xFF]/.test(locationString) ? locationString : encodeURI(locationString)
        );
        return this.newResponse(null, status ?? 302);
      };
      /**
       * `.notFound()` can return the Not Found Response.
       *
       * @see {@link https://hono.dev/docs/api/context#notfound}
       *
       * @example
       * ```ts
       * app.get('/notfound', (c) => {
       *   return c.notFound()
       * })
       * ```
       */
      notFound = () => {
        this.#notFoundHandler ??= () => createResponseInstance();
        return this.#notFoundHandler(this);
      };
    };
  }
});

// node_modules/hono/dist/router.js
var METHOD_NAME_ALL, METHOD_NAME_ALL_LOWERCASE, METHODS, MESSAGE_MATCHER_IS_ALREADY_BUILT, UnsupportedPathError;
var init_router = __esm({
  "node_modules/hono/dist/router.js"() {
    METHOD_NAME_ALL = "ALL";
    METHOD_NAME_ALL_LOWERCASE = "all";
    METHODS = ["get", "post", "put", "delete", "options", "patch"];
    MESSAGE_MATCHER_IS_ALREADY_BUILT = "Can not add a route since the matcher is already built.";
    UnsupportedPathError = class extends Error {
    };
  }
});

// node_modules/hono/dist/utils/constants.js
var COMPOSED_HANDLER;
var init_constants2 = __esm({
  "node_modules/hono/dist/utils/constants.js"() {
    COMPOSED_HANDLER = "__COMPOSED_HANDLER";
  }
});

// node_modules/hono/dist/hono-base.js
var notFoundHandler, errorHandler, Hono;
var init_hono_base = __esm({
  "node_modules/hono/dist/hono-base.js"() {
    init_compose();
    init_context();
    init_router();
    init_constants2();
    init_url();
    notFoundHandler = (c) => {
      return c.text("404 Not Found", 404);
    };
    errorHandler = (err, c) => {
      if ("getResponse" in err) {
        const res = err.getResponse();
        return c.newResponse(res.body, res);
      }
      console.error(err);
      return c.text("Internal Server Error", 500);
    };
    Hono = class _Hono {
      get;
      post;
      put;
      delete;
      options;
      patch;
      all;
      on;
      use;
      /*
        This class is like an abstract class and does not have a router.
        To use it, inherit the class and implement router in the constructor.
      */
      router;
      getPath;
      // Cannot use `#` because it requires visibility at JavaScript runtime.
      _basePath = "/";
      #path = "/";
      routes = [];
      constructor(options = {}) {
        const allMethods = [...METHODS, METHOD_NAME_ALL_LOWERCASE];
        allMethods.forEach((method) => {
          this[method] = (args1, ...args) => {
            if (typeof args1 === "string") {
              this.#path = args1;
            } else {
              this.#addRoute(method, this.#path, args1);
            }
            args.forEach((handler2) => {
              this.#addRoute(method, this.#path, handler2);
            });
            return this;
          };
        });
        this.on = (method, path, ...handlers) => {
          for (const p of [path].flat()) {
            this.#path = p;
            for (const m of [method].flat()) {
              handlers.map((handler2) => {
                this.#addRoute(m.toUpperCase(), this.#path, handler2);
              });
            }
          }
          return this;
        };
        this.use = (arg1, ...handlers) => {
          if (typeof arg1 === "string") {
            this.#path = arg1;
          } else {
            this.#path = "*";
            handlers.unshift(arg1);
          }
          handlers.forEach((handler2) => {
            this.#addRoute(METHOD_NAME_ALL, this.#path, handler2);
          });
          return this;
        };
        const { strict, ...optionsWithoutStrict } = options;
        Object.assign(this, optionsWithoutStrict);
        this.getPath = strict ?? true ? options.getPath ?? getPath : getPathNoStrict;
      }
      #clone() {
        const clone = new _Hono({
          router: this.router,
          getPath: this.getPath
        });
        clone.errorHandler = this.errorHandler;
        clone.#notFoundHandler = this.#notFoundHandler;
        clone.routes = this.routes;
        return clone;
      }
      #notFoundHandler = notFoundHandler;
      // Cannot use `#` because it requires visibility at JavaScript runtime.
      errorHandler = errorHandler;
      /**
       * `.route()` allows grouping other Hono instance in routes.
       *
       * @see {@link https://hono.dev/docs/api/routing#grouping}
       *
       * @param {string} path - base Path
       * @param {Hono} app - other Hono instance
       * @returns {Hono} routed Hono instance
       *
       * @example
       * ```ts
       * const app = new Hono()
       * const app2 = new Hono()
       *
       * app2.get("/user", (c) => c.text("user"))
       * app.route("/api", app2) // GET /api/user
       * ```
       */
      route(path, app2) {
        const subApp = this.basePath(path);
        app2.routes.map((r) => {
          let handler2;
          if (app2.errorHandler === errorHandler) {
            handler2 = r.handler;
          } else {
            handler2 = async (c, next) => (await compose([], app2.errorHandler)(c, () => r.handler(c, next))).res;
            handler2[COMPOSED_HANDLER] = r.handler;
          }
          subApp.#addRoute(r.method, r.path, handler2, r.basePath);
        });
        return this;
      }
      /**
       * `.basePath()` allows base paths to be specified.
       *
       * @see {@link https://hono.dev/docs/api/routing#base-path}
       *
       * @param {string} path - base Path
       * @returns {Hono} changed Hono instance
       *
       * @example
       * ```ts
       * const api = new Hono().basePath('/api')
       * ```
       */
      basePath(path) {
        const subApp = this.#clone();
        subApp._basePath = mergePath(this._basePath, path);
        return subApp;
      }
      /**
       * `.onError()` handles an error and returns a customized Response.
       *
       * @see {@link https://hono.dev/docs/api/hono#error-handling}
       *
       * @param {ErrorHandler} handler - request Handler for error
       * @returns {Hono} changed Hono instance
       *
       * @example
       * ```ts
       * app.onError((err, c) => {
       *   console.error(`${err}`)
       *   return c.text('Custom Error Message', 500)
       * })
       * ```
       */
      onError = (handler2) => {
        this.errorHandler = handler2;
        return this;
      };
      /**
       * `.notFound()` allows you to customize a Not Found Response.
       *
       * @see {@link https://hono.dev/docs/api/hono#not-found}
       *
       * @param {NotFoundHandler} handler - request handler for not-found
       * @returns {Hono} changed Hono instance
       *
       * @example
       * ```ts
       * app.notFound((c) => {
       *   return c.text('Custom 404 Message', 404)
       * })
       * ```
       */
      notFound = (handler2) => {
        this.#notFoundHandler = handler2;
        return this;
      };
      /**
       * `.mount()` allows you to mount applications built with other frameworks into your Hono application.
       *
       * @see {@link https://hono.dev/docs/api/hono#mount}
       *
       * @param {string} path - base Path
       * @param {Function} applicationHandler - other Request Handler
       * @param {MountOptions} [options] - options of `.mount()`
       * @returns {Hono} mounted Hono instance
       *
       * @example
       * ```ts
       * import { Router as IttyRouter } from 'itty-router'
       * import { Hono } from 'hono'
       * // Create itty-router application
       * const ittyRouter = IttyRouter()
       * // GET /itty-router/hello
       * ittyRouter.get('/hello', () => new Response('Hello from itty-router'))
       *
       * const app = new Hono()
       * app.mount('/itty-router', ittyRouter.handle)
       * ```
       *
       * @example
       * ```ts
       * const app = new Hono()
       * // Send the request to another application without modification.
       * app.mount('/app', anotherApp, {
       *   replaceRequest: (req) => req,
       * })
       * ```
       */
      mount(path, applicationHandler, options) {
        let replaceRequest;
        let optionHandler;
        if (options) {
          if (typeof options === "function") {
            optionHandler = options;
          } else {
            optionHandler = options.optionHandler;
            if (options.replaceRequest === false) {
              replaceRequest = (request) => request;
            } else {
              replaceRequest = options.replaceRequest;
            }
          }
        }
        const getOptions = optionHandler ? (c) => {
          const options2 = optionHandler(c);
          return Array.isArray(options2) ? options2 : [options2];
        } : (c) => {
          let executionContext = void 0;
          try {
            executionContext = c.executionCtx;
          } catch {
          }
          return [c.env, executionContext];
        };
        replaceRequest ||= (() => {
          const mergedPath = mergePath(this._basePath, path);
          const pathPrefixLength = mergedPath === "/" ? 0 : mergedPath.length;
          return (request) => {
            const url2 = new URL(request.url);
            url2.pathname = this.getPath(request).slice(pathPrefixLength) || "/";
            return new Request(url2, request);
          };
        })();
        const handler2 = async (c, next) => {
          const res = await applicationHandler(replaceRequest(c.req.raw), ...getOptions(c));
          if (res) {
            return res;
          }
          await next();
        };
        this.#addRoute(METHOD_NAME_ALL, mergePath(path, "*"), handler2);
        return this;
      }
      #addRoute(method, path, handler2, baseRoutePath) {
        method = method.toUpperCase();
        path = mergePath(this._basePath, path);
        const r = {
          basePath: baseRoutePath !== void 0 ? mergePath(this._basePath, baseRoutePath) : this._basePath,
          path,
          method,
          handler: handler2
        };
        this.router.add(method, path, [handler2, r]);
        this.routes.push(r);
      }
      #handleError(err, c) {
        if (err instanceof Error) {
          return this.errorHandler(err, c);
        }
        throw err;
      }
      #dispatch(request, executionCtx, env, method) {
        if (method === "HEAD") {
          return (async () => new Response(null, await this.#dispatch(request, executionCtx, env, "GET")))();
        }
        const path = this.getPath(request, { env });
        const matchResult = this.router.match(method, path);
        const c = new Context(request, {
          path,
          matchResult,
          env,
          executionCtx,
          notFoundHandler: this.#notFoundHandler
        });
        if (matchResult[0].length === 1) {
          let res;
          try {
            res = matchResult[0][0][0][0](c, async () => {
              c.res = await this.#notFoundHandler(c);
            });
          } catch (err) {
            return this.#handleError(err, c);
          }
          return res instanceof Promise ? res.then(
            (resolved) => resolved || (c.finalized ? c.res : this.#notFoundHandler(c))
          ).catch((err) => this.#handleError(err, c)) : res ?? this.#notFoundHandler(c);
        }
        const composed = compose(matchResult[0], this.errorHandler, this.#notFoundHandler);
        return (async () => {
          try {
            const context = await composed(c);
            if (!context.finalized) {
              throw new Error(
                "Context is not finalized. Did you forget to return a Response object or `await next()`?"
              );
            }
            return context.res;
          } catch (err) {
            return this.#handleError(err, c);
          }
        })();
      }
      /**
       * `.fetch()` will be entry point of your app.
       *
       * @see {@link https://hono.dev/docs/api/hono#fetch}
       *
       * @param {Request} request - request Object of request
       * @param {Env} Env - env Object
       * @param {ExecutionContext} - context of execution
       * @returns {Response | Promise<Response>} response of request
       *
       */
      fetch = (request, ...rest) => {
        return this.#dispatch(request, rest[1], rest[0], request.method);
      };
      /**
       * `.request()` is a useful method for testing.
       * You can pass a URL or pathname to send a GET request.
       * app will return a Response object.
       * ```ts
       * test('GET /hello is ok', async () => {
       *   const res = await app.request('/hello')
       *   expect(res.status).toBe(200)
       * })
       * ```
       * @see https://hono.dev/docs/api/hono#request
       */
      request = (input, requestInit, Env, executionCtx) => {
        if (input instanceof Request) {
          return this.fetch(requestInit ? new Request(input, requestInit) : input, Env, executionCtx);
        }
        input = input.toString();
        return this.fetch(
          new Request(
            /^https?:\/\//.test(input) ? input : `http://localhost${mergePath("/", input)}`,
            requestInit
          ),
          Env,
          executionCtx
        );
      };
      /**
       * `.fire()` automatically adds a global fetch event listener.
       * This can be useful for environments that adhere to the Service Worker API, such as non-ES module Cloudflare Workers.
       * @deprecated
       * Use `fire` from `hono/service-worker` instead.
       * ```ts
       * import { Hono } from 'hono'
       * import { fire } from 'hono/service-worker'
       *
       * const app = new Hono()
       * // ...
       * fire(app)
       * ```
       * @see https://hono.dev/docs/api/hono#fire
       * @see https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API
       * @see https://developers.cloudflare.com/workers/reference/migrate-to-module-workers/
       */
      fire = () => {
        addEventListener("fetch", (event) => {
          event.respondWith(this.#dispatch(event.request, event, void 0, event.request.method));
        });
      };
    };
  }
});

// node_modules/hono/dist/router/reg-exp-router/matcher.js
function match(method, path) {
  const matchers = this.buildAllMatchers();
  const match2 = ((method2, path2) => {
    const matcher = matchers[method2] || matchers[METHOD_NAME_ALL];
    const staticMatch = matcher[2][path2];
    if (staticMatch) {
      return staticMatch;
    }
    const match3 = path2.match(matcher[0]);
    if (!match3) {
      return [[], emptyParam];
    }
    const index = match3.indexOf("", 1);
    return [matcher[1][index], match3];
  });
  this.match = match2;
  return match2(method, path);
}
var emptyParam;
var init_matcher = __esm({
  "node_modules/hono/dist/router/reg-exp-router/matcher.js"() {
    init_router();
    emptyParam = [];
  }
});

// node_modules/hono/dist/router/reg-exp-router/node.js
function compareKey(a, b) {
  if (a.length === 1) {
    return b.length === 1 ? a < b ? -1 : 1 : -1;
  }
  if (b.length === 1) {
    return 1;
  }
  if (a === ONLY_WILDCARD_REG_EXP_STR || a === TAIL_WILDCARD_REG_EXP_STR) {
    return 1;
  } else if (b === ONLY_WILDCARD_REG_EXP_STR || b === TAIL_WILDCARD_REG_EXP_STR) {
    return -1;
  }
  if (a === LABEL_REG_EXP_STR) {
    return 1;
  } else if (b === LABEL_REG_EXP_STR) {
    return -1;
  }
  return a.length === b.length ? a < b ? -1 : 1 : b.length - a.length;
}
var LABEL_REG_EXP_STR, ONLY_WILDCARD_REG_EXP_STR, TAIL_WILDCARD_REG_EXP_STR, PATH_ERROR, regExpMetaChars, Node;
var init_node = __esm({
  "node_modules/hono/dist/router/reg-exp-router/node.js"() {
    LABEL_REG_EXP_STR = "[^/]+";
    ONLY_WILDCARD_REG_EXP_STR = ".*";
    TAIL_WILDCARD_REG_EXP_STR = "(?:|/.*)";
    PATH_ERROR = /* @__PURE__ */ Symbol();
    regExpMetaChars = new Set(".\\+*[^]$()");
    Node = class _Node {
      #index;
      #varIndex;
      #children = /* @__PURE__ */ Object.create(null);
      insert(tokens, index, paramMap, context, pathErrorCheckOnly) {
        if (tokens.length === 0) {
          if (this.#index !== void 0) {
            throw PATH_ERROR;
          }
          if (pathErrorCheckOnly) {
            return;
          }
          this.#index = index;
          return;
        }
        const [token, ...restTokens] = tokens;
        const pattern = token === "*" ? restTokens.length === 0 ? ["", "", ONLY_WILDCARD_REG_EXP_STR] : ["", "", LABEL_REG_EXP_STR] : token === "/*" ? ["", "", TAIL_WILDCARD_REG_EXP_STR] : token.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);
        let node;
        if (pattern) {
          const name = pattern[1];
          let regexpStr = pattern[2] || LABEL_REG_EXP_STR;
          if (name && pattern[2]) {
            if (regexpStr === ".*") {
              throw PATH_ERROR;
            }
            regexpStr = regexpStr.replace(/^\((?!\?:)(?=[^)]+\)$)/, "(?:");
            if (/\((?!\?:)/.test(regexpStr)) {
              throw PATH_ERROR;
            }
          }
          node = this.#children[regexpStr];
          if (!node) {
            if (Object.keys(this.#children).some(
              (k) => k !== ONLY_WILDCARD_REG_EXP_STR && k !== TAIL_WILDCARD_REG_EXP_STR
            )) {
              throw PATH_ERROR;
            }
            if (pathErrorCheckOnly) {
              return;
            }
            node = this.#children[regexpStr] = new _Node();
            if (name !== "") {
              node.#varIndex = context.varIndex++;
            }
          }
          if (!pathErrorCheckOnly && name !== "") {
            paramMap.push([name, node.#varIndex]);
          }
        } else {
          node = this.#children[token];
          if (!node) {
            if (Object.keys(this.#children).some(
              (k) => k.length > 1 && k !== ONLY_WILDCARD_REG_EXP_STR && k !== TAIL_WILDCARD_REG_EXP_STR
            )) {
              throw PATH_ERROR;
            }
            if (pathErrorCheckOnly) {
              return;
            }
            node = this.#children[token] = new _Node();
          }
        }
        node.insert(restTokens, index, paramMap, context, pathErrorCheckOnly);
      }
      buildRegExpStr() {
        const childKeys = Object.keys(this.#children).sort(compareKey);
        const strList = childKeys.map((k) => {
          const c = this.#children[k];
          return (typeof c.#varIndex === "number" ? `(${k})@${c.#varIndex}` : regExpMetaChars.has(k) ? `\\${k}` : k) + c.buildRegExpStr();
        });
        if (typeof this.#index === "number") {
          strList.unshift(`#${this.#index}`);
        }
        if (strList.length === 0) {
          return "";
        }
        if (strList.length === 1) {
          return strList[0];
        }
        return "(?:" + strList.join("|") + ")";
      }
    };
  }
});

// node_modules/hono/dist/router/reg-exp-router/trie.js
var Trie;
var init_trie = __esm({
  "node_modules/hono/dist/router/reg-exp-router/trie.js"() {
    init_node();
    Trie = class {
      #context = { varIndex: 0 };
      #root = new Node();
      insert(path, index, pathErrorCheckOnly) {
        const paramAssoc = [];
        const groups = [];
        for (let i = 0; ; ) {
          let replaced = false;
          path = path.replace(/\{[^}]+\}/g, (m) => {
            const mark = `@\\${i}`;
            groups[i] = [mark, m];
            i++;
            replaced = true;
            return mark;
          });
          if (!replaced) {
            break;
          }
        }
        const tokens = path.match(/(?::[^\/]+)|(?:\/\*$)|./g) || [];
        for (let i = groups.length - 1; i >= 0; i--) {
          const [mark] = groups[i];
          for (let j = tokens.length - 1; j >= 0; j--) {
            if (tokens[j].indexOf(mark) !== -1) {
              tokens[j] = tokens[j].replace(mark, groups[i][1]);
              break;
            }
          }
        }
        this.#root.insert(tokens, index, paramAssoc, this.#context, pathErrorCheckOnly);
        return paramAssoc;
      }
      buildRegExp() {
        let regexp = this.#root.buildRegExpStr();
        if (regexp === "") {
          return [/^$/, [], []];
        }
        let captureIndex = 0;
        const indexReplacementMap = [];
        const paramReplacementMap = [];
        regexp = regexp.replace(/#(\d+)|@(\d+)|\.\*\$/g, (_, handlerIndex, paramIndex) => {
          if (handlerIndex !== void 0) {
            indexReplacementMap[++captureIndex] = Number(handlerIndex);
            return "$()";
          }
          if (paramIndex !== void 0) {
            paramReplacementMap[Number(paramIndex)] = ++captureIndex;
            return "";
          }
          return "";
        });
        return [new RegExp(`^${regexp}`), indexReplacementMap, paramReplacementMap];
      }
    };
  }
});

// node_modules/hono/dist/router/reg-exp-router/router.js
function buildWildcardRegExp(path) {
  return wildcardRegExpCache[path] ??= new RegExp(
    path === "*" ? "" : `^${path.replace(
      /\/\*$|([.\\+*[^\]$()])/g,
      (_, metaChar) => metaChar ? `\\${metaChar}` : "(?:|/.*)"
    )}$`
  );
}
function clearWildcardRegExpCache() {
  wildcardRegExpCache = /* @__PURE__ */ Object.create(null);
}
function buildMatcherFromPreprocessedRoutes(routes) {
  const trie = new Trie();
  const handlerData = [];
  if (routes.length === 0) {
    return nullMatcher;
  }
  const routesWithStaticPathFlag = routes.map(
    (route) => [!/\*|\/:/.test(route[0]), ...route]
  ).sort(
    ([isStaticA, pathA], [isStaticB, pathB]) => isStaticA ? 1 : isStaticB ? -1 : pathA.length - pathB.length
  );
  const staticMap = /* @__PURE__ */ Object.create(null);
  for (let i = 0, j = -1, len = routesWithStaticPathFlag.length; i < len; i++) {
    const [pathErrorCheckOnly, path, handlers] = routesWithStaticPathFlag[i];
    if (pathErrorCheckOnly) {
      staticMap[path] = [handlers.map(([h]) => [h, /* @__PURE__ */ Object.create(null)]), emptyParam];
    } else {
      j++;
    }
    let paramAssoc;
    try {
      paramAssoc = trie.insert(path, j, pathErrorCheckOnly);
    } catch (e) {
      throw e === PATH_ERROR ? new UnsupportedPathError(path) : e;
    }
    if (pathErrorCheckOnly) {
      continue;
    }
    handlerData[j] = handlers.map(([h, paramCount]) => {
      const paramIndexMap = /* @__PURE__ */ Object.create(null);
      paramCount -= 1;
      for (; paramCount >= 0; paramCount--) {
        const [key, value] = paramAssoc[paramCount];
        paramIndexMap[key] = value;
      }
      return [h, paramIndexMap];
    });
  }
  const [regexp, indexReplacementMap, paramReplacementMap] = trie.buildRegExp();
  for (let i = 0, len = handlerData.length; i < len; i++) {
    for (let j = 0, len2 = handlerData[i].length; j < len2; j++) {
      const map = handlerData[i][j]?.[1];
      if (!map) {
        continue;
      }
      const keys = Object.keys(map);
      for (let k = 0, len3 = keys.length; k < len3; k++) {
        map[keys[k]] = paramReplacementMap[map[keys[k]]];
      }
    }
  }
  const handlerMap = [];
  for (const i in indexReplacementMap) {
    handlerMap[i] = handlerData[indexReplacementMap[i]];
  }
  return [regexp, handlerMap, staticMap];
}
function findMiddleware(middleware, path) {
  if (!middleware) {
    return void 0;
  }
  for (const k of Object.keys(middleware).sort((a, b) => b.length - a.length)) {
    if (buildWildcardRegExp(k).test(path)) {
      return [...middleware[k]];
    }
  }
  return void 0;
}
var nullMatcher, wildcardRegExpCache, RegExpRouter;
var init_router2 = __esm({
  "node_modules/hono/dist/router/reg-exp-router/router.js"() {
    init_router();
    init_url();
    init_matcher();
    init_node();
    init_trie();
    nullMatcher = [/^$/, [], /* @__PURE__ */ Object.create(null)];
    wildcardRegExpCache = /* @__PURE__ */ Object.create(null);
    RegExpRouter = class {
      name = "RegExpRouter";
      #middleware;
      #routes;
      constructor() {
        this.#middleware = { [METHOD_NAME_ALL]: /* @__PURE__ */ Object.create(null) };
        this.#routes = { [METHOD_NAME_ALL]: /* @__PURE__ */ Object.create(null) };
      }
      add(method, path, handler2) {
        const middleware = this.#middleware;
        const routes = this.#routes;
        if (!middleware || !routes) {
          throw new Error(MESSAGE_MATCHER_IS_ALREADY_BUILT);
        }
        if (!middleware[method]) {
          ;
          [middleware, routes].forEach((handlerMap) => {
            handlerMap[method] = /* @__PURE__ */ Object.create(null);
            Object.keys(handlerMap[METHOD_NAME_ALL]).forEach((p) => {
              handlerMap[method][p] = [...handlerMap[METHOD_NAME_ALL][p]];
            });
          });
        }
        if (path === "/*") {
          path = "*";
        }
        const paramCount = (path.match(/\/:/g) || []).length;
        if (/\*$/.test(path)) {
          const re = buildWildcardRegExp(path);
          if (method === METHOD_NAME_ALL) {
            Object.keys(middleware).forEach((m) => {
              middleware[m][path] ||= findMiddleware(middleware[m], path) || findMiddleware(middleware[METHOD_NAME_ALL], path) || [];
            });
          } else {
            middleware[method][path] ||= findMiddleware(middleware[method], path) || findMiddleware(middleware[METHOD_NAME_ALL], path) || [];
          }
          Object.keys(middleware).forEach((m) => {
            if (method === METHOD_NAME_ALL || method === m) {
              Object.keys(middleware[m]).forEach((p) => {
                re.test(p) && middleware[m][p].push([handler2, paramCount]);
              });
            }
          });
          Object.keys(routes).forEach((m) => {
            if (method === METHOD_NAME_ALL || method === m) {
              Object.keys(routes[m]).forEach(
                (p) => re.test(p) && routes[m][p].push([handler2, paramCount])
              );
            }
          });
          return;
        }
        const paths = checkOptionalParameter(path) || [path];
        for (let i = 0, len = paths.length; i < len; i++) {
          const path2 = paths[i];
          Object.keys(routes).forEach((m) => {
            if (method === METHOD_NAME_ALL || method === m) {
              routes[m][path2] ||= [
                ...findMiddleware(middleware[m], path2) || findMiddleware(middleware[METHOD_NAME_ALL], path2) || []
              ];
              routes[m][path2].push([handler2, paramCount - len + i + 1]);
            }
          });
        }
      }
      match = match;
      buildAllMatchers() {
        const matchers = /* @__PURE__ */ Object.create(null);
        Object.keys(this.#routes).concat(Object.keys(this.#middleware)).forEach((method) => {
          matchers[method] ||= this.#buildMatcher(method);
        });
        this.#middleware = this.#routes = void 0;
        clearWildcardRegExpCache();
        return matchers;
      }
      #buildMatcher(method) {
        const routes = [];
        let hasOwnRoute = method === METHOD_NAME_ALL;
        [this.#middleware, this.#routes].forEach((r) => {
          const ownRoute = r[method] ? Object.keys(r[method]).map((path) => [path, r[method][path]]) : [];
          if (ownRoute.length !== 0) {
            hasOwnRoute ||= true;
            routes.push(...ownRoute);
          } else if (method !== METHOD_NAME_ALL) {
            routes.push(
              ...Object.keys(r[METHOD_NAME_ALL]).map((path) => [path, r[METHOD_NAME_ALL][path]])
            );
          }
        });
        if (!hasOwnRoute) {
          return null;
        } else {
          return buildMatcherFromPreprocessedRoutes(routes);
        }
      }
    };
  }
});

// node_modules/hono/dist/router/reg-exp-router/prepared-router.js
var init_prepared_router = __esm({
  "node_modules/hono/dist/router/reg-exp-router/prepared-router.js"() {
    init_router();
    init_matcher();
    init_router2();
  }
});

// node_modules/hono/dist/router/reg-exp-router/index.js
var init_reg_exp_router = __esm({
  "node_modules/hono/dist/router/reg-exp-router/index.js"() {
    init_router2();
    init_prepared_router();
  }
});

// node_modules/hono/dist/router/smart-router/router.js
var SmartRouter;
var init_router3 = __esm({
  "node_modules/hono/dist/router/smart-router/router.js"() {
    init_router();
    SmartRouter = class {
      name = "SmartRouter";
      #routers = [];
      #routes = [];
      constructor(init) {
        this.#routers = init.routers;
      }
      add(method, path, handler2) {
        if (!this.#routes) {
          throw new Error(MESSAGE_MATCHER_IS_ALREADY_BUILT);
        }
        this.#routes.push([method, path, handler2]);
      }
      match(method, path) {
        if (!this.#routes) {
          throw new Error("Fatal error");
        }
        const routers = this.#routers;
        const routes = this.#routes;
        const len = routers.length;
        let i = 0;
        let res;
        for (; i < len; i++) {
          const router = routers[i];
          try {
            for (let i2 = 0, len2 = routes.length; i2 < len2; i2++) {
              router.add(...routes[i2]);
            }
            res = router.match(method, path);
          } catch (e) {
            if (e instanceof UnsupportedPathError) {
              continue;
            }
            throw e;
          }
          this.match = router.match.bind(router);
          this.#routers = [router];
          this.#routes = void 0;
          break;
        }
        if (i === len) {
          throw new Error("Fatal error");
        }
        this.name = `SmartRouter + ${this.activeRouter.name}`;
        return res;
      }
      get activeRouter() {
        if (this.#routes || this.#routers.length !== 1) {
          throw new Error("No active router has been determined yet.");
        }
        return this.#routers[0];
      }
    };
  }
});

// node_modules/hono/dist/router/smart-router/index.js
var init_smart_router = __esm({
  "node_modules/hono/dist/router/smart-router/index.js"() {
    init_router3();
  }
});

// node_modules/hono/dist/router/trie-router/node.js
var emptyParams, hasChildren, Node2;
var init_node2 = __esm({
  "node_modules/hono/dist/router/trie-router/node.js"() {
    init_router();
    init_url();
    emptyParams = /* @__PURE__ */ Object.create(null);
    hasChildren = (children) => {
      for (const _ in children) {
        return true;
      }
      return false;
    };
    Node2 = class _Node2 {
      #methods;
      #children;
      #patterns;
      #order = 0;
      #params = emptyParams;
      constructor(method, handler2, children) {
        this.#children = children || /* @__PURE__ */ Object.create(null);
        this.#methods = [];
        if (method && handler2) {
          const m = /* @__PURE__ */ Object.create(null);
          m[method] = { handler: handler2, possibleKeys: [], score: 0 };
          this.#methods = [m];
        }
        this.#patterns = [];
      }
      insert(method, path, handler2) {
        this.#order = ++this.#order;
        let curNode = this;
        const parts = splitRoutingPath(path);
        const possibleKeys = [];
        for (let i = 0, len = parts.length; i < len; i++) {
          const p = parts[i];
          const nextP = parts[i + 1];
          const pattern = getPattern(p, nextP);
          const key = Array.isArray(pattern) ? pattern[0] : p;
          if (key in curNode.#children) {
            curNode = curNode.#children[key];
            if (pattern) {
              possibleKeys.push(pattern[1]);
            }
            continue;
          }
          curNode.#children[key] = new _Node2();
          if (pattern) {
            curNode.#patterns.push(pattern);
            possibleKeys.push(pattern[1]);
          }
          curNode = curNode.#children[key];
        }
        curNode.#methods.push({
          [method]: {
            handler: handler2,
            possibleKeys: possibleKeys.filter((v, i, a) => a.indexOf(v) === i),
            score: this.#order
          }
        });
        return curNode;
      }
      #pushHandlerSets(handlerSets, node, method, nodeParams, params) {
        for (let i = 0, len = node.#methods.length; i < len; i++) {
          const m = node.#methods[i];
          const handlerSet = m[method] || m[METHOD_NAME_ALL];
          const processedSet = {};
          if (handlerSet !== void 0) {
            handlerSet.params = /* @__PURE__ */ Object.create(null);
            handlerSets.push(handlerSet);
            if (nodeParams !== emptyParams || params && params !== emptyParams) {
              for (let i2 = 0, len2 = handlerSet.possibleKeys.length; i2 < len2; i2++) {
                const key = handlerSet.possibleKeys[i2];
                const processed = processedSet[handlerSet.score];
                handlerSet.params[key] = params?.[key] && !processed ? params[key] : nodeParams[key] ?? params?.[key];
                processedSet[handlerSet.score] = true;
              }
            }
          }
        }
      }
      search(method, path) {
        const handlerSets = [];
        this.#params = emptyParams;
        const curNode = this;
        let curNodes = [curNode];
        const parts = splitPath(path);
        const curNodesQueue = [];
        const len = parts.length;
        let partOffsets = null;
        for (let i = 0; i < len; i++) {
          const part = parts[i];
          const isLast = i === len - 1;
          const tempNodes = [];
          for (let j = 0, len2 = curNodes.length; j < len2; j++) {
            const node = curNodes[j];
            const nextNode = node.#children[part];
            if (nextNode) {
              nextNode.#params = node.#params;
              if (isLast) {
                if (nextNode.#children["*"]) {
                  this.#pushHandlerSets(handlerSets, nextNode.#children["*"], method, node.#params);
                }
                this.#pushHandlerSets(handlerSets, nextNode, method, node.#params);
              } else {
                tempNodes.push(nextNode);
              }
            }
            for (let k = 0, len3 = node.#patterns.length; k < len3; k++) {
              const pattern = node.#patterns[k];
              const params = node.#params === emptyParams ? {} : { ...node.#params };
              if (pattern === "*") {
                const astNode = node.#children["*"];
                if (astNode) {
                  this.#pushHandlerSets(handlerSets, astNode, method, node.#params);
                  astNode.#params = params;
                  tempNodes.push(astNode);
                }
                continue;
              }
              const [key, name, matcher] = pattern;
              if (!part && !(matcher instanceof RegExp)) {
                continue;
              }
              const child = node.#children[key];
              if (matcher instanceof RegExp) {
                if (partOffsets === null) {
                  partOffsets = new Array(len);
                  let offset = path[0] === "/" ? 1 : 0;
                  for (let p = 0; p < len; p++) {
                    partOffsets[p] = offset;
                    offset += parts[p].length + 1;
                  }
                }
                const restPathString = path.substring(partOffsets[i]);
                const m = matcher.exec(restPathString);
                if (m) {
                  params[name] = m[0];
                  this.#pushHandlerSets(handlerSets, child, method, node.#params, params);
                  if (hasChildren(child.#children)) {
                    child.#params = params;
                    const componentCount = m[0].match(/\//)?.length ?? 0;
                    const targetCurNodes = curNodesQueue[componentCount] ||= [];
                    targetCurNodes.push(child);
                  }
                  continue;
                }
              }
              if (matcher === true || matcher.test(part)) {
                params[name] = part;
                if (isLast) {
                  this.#pushHandlerSets(handlerSets, child, method, params, node.#params);
                  if (child.#children["*"]) {
                    this.#pushHandlerSets(
                      handlerSets,
                      child.#children["*"],
                      method,
                      params,
                      node.#params
                    );
                  }
                } else {
                  child.#params = params;
                  tempNodes.push(child);
                }
              }
            }
          }
          const shifted = curNodesQueue.shift();
          curNodes = shifted ? tempNodes.concat(shifted) : tempNodes;
        }
        if (handlerSets.length > 1) {
          handlerSets.sort((a, b) => {
            return a.score - b.score;
          });
        }
        return [handlerSets.map(({ handler: handler2, params }) => [handler2, params])];
      }
    };
  }
});

// node_modules/hono/dist/router/trie-router/router.js
var TrieRouter;
var init_router4 = __esm({
  "node_modules/hono/dist/router/trie-router/router.js"() {
    init_url();
    init_node2();
    TrieRouter = class {
      name = "TrieRouter";
      #node;
      constructor() {
        this.#node = new Node2();
      }
      add(method, path, handler2) {
        const results = checkOptionalParameter(path);
        if (results) {
          for (let i = 0, len = results.length; i < len; i++) {
            this.#node.insert(method, results[i], handler2);
          }
          return;
        }
        this.#node.insert(method, path, handler2);
      }
      match(method, path) {
        return this.#node.search(method, path);
      }
    };
  }
});

// node_modules/hono/dist/router/trie-router/index.js
var init_trie_router = __esm({
  "node_modules/hono/dist/router/trie-router/index.js"() {
    init_router4();
  }
});

// node_modules/hono/dist/hono.js
var Hono2;
var init_hono = __esm({
  "node_modules/hono/dist/hono.js"() {
    init_hono_base();
    init_reg_exp_router();
    init_smart_router();
    init_trie_router();
    Hono2 = class extends Hono {
      /**
       * Creates an instance of the Hono class.
       *
       * @param options - Optional configuration options for the Hono instance.
       */
      constructor(options = {}) {
        super(options);
        this.router = options.router ?? new SmartRouter({
          routers: [new RegExpRouter(), new TrieRouter()]
        });
      }
    };
  }
});

// node_modules/hono/dist/index.js
var init_dist = __esm({
  "node_modules/hono/dist/index.js"() {
    init_hono();
  }
});

// node_modules/hono/dist/middleware/cors/index.js
var cors;
var init_cors = __esm({
  "node_modules/hono/dist/middleware/cors/index.js"() {
    cors = (options) => {
      const opts = {
        origin: "*",
        allowMethods: ["GET", "HEAD", "PUT", "POST", "DELETE", "PATCH"],
        allowHeaders: [],
        exposeHeaders: [],
        ...options
      };
      const findAllowOrigin = ((optsOrigin) => {
        if (typeof optsOrigin === "string") {
          if (optsOrigin === "*") {
            if (opts.credentials) {
              return (origin) => origin || null;
            }
            return () => optsOrigin;
          } else {
            return (origin) => optsOrigin === origin ? origin : null;
          }
        } else if (typeof optsOrigin === "function") {
          return optsOrigin;
        } else {
          return (origin) => optsOrigin.includes(origin) ? origin : null;
        }
      })(opts.origin);
      const findAllowMethods = ((optsAllowMethods) => {
        if (typeof optsAllowMethods === "function") {
          return optsAllowMethods;
        } else if (Array.isArray(optsAllowMethods)) {
          return () => optsAllowMethods;
        } else {
          return () => [];
        }
      })(opts.allowMethods);
      return async function cors2(c, next) {
        function set(key, value) {
          c.res.headers.set(key, value);
        }
        const allowOrigin = await findAllowOrigin(c.req.header("origin") || "", c);
        if (allowOrigin) {
          set("Access-Control-Allow-Origin", allowOrigin);
        }
        if (opts.credentials) {
          set("Access-Control-Allow-Credentials", "true");
        }
        if (opts.exposeHeaders?.length) {
          set("Access-Control-Expose-Headers", opts.exposeHeaders.join(","));
        }
        if (c.req.method === "OPTIONS") {
          if (opts.origin !== "*" || opts.credentials) {
            set("Vary", "Origin");
          }
          if (opts.maxAge != null) {
            set("Access-Control-Max-Age", opts.maxAge.toString());
          }
          const allowMethods = await findAllowMethods(c.req.header("origin") || "", c);
          if (allowMethods.length) {
            set("Access-Control-Allow-Methods", allowMethods.join(","));
          }
          let headers = opts.allowHeaders;
          if (!headers?.length) {
            const requestHeaders = c.req.header("Access-Control-Request-Headers");
            if (requestHeaders) {
              headers = requestHeaders.split(/\s*,\s*/);
            }
          }
          if (headers?.length) {
            set("Access-Control-Allow-Headers", headers.join(","));
            c.res.headers.append("Vary", "Access-Control-Request-Headers");
          }
          c.res.headers.delete("Content-Length");
          c.res.headers.delete("Content-Type");
          return new Response(null, {
            headers: c.res.headers,
            status: 204,
            statusText: "No Content"
          });
        }
        await next();
        if (opts.origin !== "*" || opts.credentials) {
          c.header("Vary", "Origin", { append: true });
        }
      };
    };
  }
});

// api/_lib/fx.ts
function synthetic() {
  const t = (Date.now() - startedAt) / 1e3;
  const j = (amp) => Math.sin(t / 37) * amp + (Math.random() - 0.5) * amp * 0.25;
  return {
    base: "USD",
    asOf: (/* @__PURE__ */ new Date()).toISOString(),
    rates: {
      USD: 1,
      VND: Math.round(25400 + j(120)),
      EUR: Number((0.92 + j(4e-3)).toFixed(4)),
      JPY: Number((156.4 + j(0.8)).toFixed(3)),
      SGD: Number((1.34 + j(0.01)).toFixed(4)),
      GBP: Number((0.79 + j(4e-3)).toFixed(4)),
      CNY: Number((7.24 + j(0.02)).toFixed(4)),
      KRW: Number((1370 + j(5)).toFixed(2)),
      THB: Number((35.8 + j(0.15)).toFixed(3))
    },
    source: "synthetic"
  };
}
async function withTimeout(p, ms) {
  return new Promise((resolve2, reject) => {
    const timer = setTimeout(() => reject(new Error("timeout")), ms);
    p.then((v) => {
      clearTimeout(timer);
      resolve2(v);
    }, (e) => {
      clearTimeout(timer);
      reject(e);
    });
  });
}
async function fetchPrimary() {
  try {
    const r = await withTimeout(
      fetch("https://open.er-api.com/v6/latest/USD", { headers: { Accept: "application/json" } }),
      FETCH_TIMEOUT_MS
    );
    if (!r.ok) return null;
    const j = await r.json();
    if (j.result !== "success" || !j.rates) return null;
    return j.rates;
  } catch {
    return null;
  }
}
async function fetchFallback() {
  try {
    const r = await withTimeout(
      fetch("https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json"),
      FETCH_TIMEOUT_MS
    );
    if (!r.ok) return null;
    const j = await r.json();
    if (!j.usd) return null;
    const upper = {};
    for (const [k, v] of Object.entries(j.usd)) upper[k.toUpperCase()] = v;
    return upper;
  } catch {
    return null;
  }
}
async function refreshRates() {
  const primary = await fetchPrimary();
  const raw2 = primary || await fetchFallback();
  if (!raw2) return;
  const rates = { USD: 1 };
  for (const code of SUPPORTED) {
    const v = Number(raw2[code]);
    if (Number.isFinite(v) && v > 0) {
      rates[code] = code === "VND" || code === "KRW" ? Math.round(v) : Number(v.toFixed(6));
    }
  }
  if (!rates.VND) return;
  cache = {
    base: "USD",
    asOf: (/* @__PURE__ */ new Date()).toISOString(),
    rates,
    source: primary ? "open.er-api.com" : "jsdelivr-fawazahmed0"
  };
  cacheTs = Date.now();
}
function maybeRefresh() {
  if (Date.now() - cacheTs < TTL_MS) return;
  if (inflight) return;
  inflight = refreshRates().finally(() => {
    inflight = null;
  });
}
function getRates() {
  maybeRefresh();
  return cache;
}
function convert(amount, from, to) {
  const { rates } = getRates();
  const f = rates[from.toUpperCase()];
  const t = rates[to.toUpperCase()];
  if (!f || !t) throw new Error(`Unsupported currency pair ${from}/${to}`);
  const usd = amount / f;
  const result = usd * t;
  const rate = t / f;
  return {
    rate: Number(rate.toFixed(6)),
    result: to.toUpperCase() === "VND" ? Math.round(result) : Number(result.toFixed(2)),
    formatted: formatCurrency(result, to.toUpperCase())
  };
}
function usdToVnd(usd) {
  return Math.round(usd * getRates().rates.VND);
}
function vndToUsd(vnd) {
  return Number((vnd / getRates().rates.VND).toFixed(2));
}
function formatCurrency(amount, currency) {
  switch (currency.toUpperCase()) {
    case "VND":
      return `${Math.round(amount).toLocaleString("vi-VN")} \u20AB`;
    case "EUR":
      return `\u20AC${amount.toFixed(2)}`;
    case "JPY":
      return `\xA5${Math.round(amount).toLocaleString("ja-JP")}`;
    case "SGD":
      return `S$${amount.toFixed(2)}`;
    case "GBP":
      return `\xA3${amount.toFixed(2)}`;
    case "CNY":
      return `\xA5${amount.toFixed(2)}`;
    case "KRW":
      return `\u20A9${Math.round(amount).toLocaleString("ko-KR")}`;
    case "THB":
      return `\u0E3F${amount.toFixed(2)}`;
    default:
      return `$${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
}
var startedAt, TTL_MS, FETCH_TIMEOUT_MS, SUPPORTED, cache, cacheTs, inflight;
var init_fx = __esm({
  "api/_lib/fx.ts"() {
    startedAt = Date.now();
    TTL_MS = 10 * 60 * 1e3;
    FETCH_TIMEOUT_MS = 4e3;
    SUPPORTED = ["VND", "EUR", "JPY", "SGD", "GBP", "CNY", "KRW", "THB"];
    cache = synthetic();
    cacheTs = 0;
    inflight = null;
    maybeRefresh();
  }
});

// api/_lib/routes/fx.ts
var fxRouter;
var init_fx2 = __esm({
  "api/_lib/routes/fx.ts"() {
    init_dist();
    init_fx();
    fxRouter = new Hono2();
    fxRouter.get("/rates", (c) => c.json(getRates()));
    fxRouter.post("/convert", async (c) => {
      const body = await c.req.json().catch(() => null);
      if (!body || typeof body.amount !== "number" || !body.from || !body.to) {
        return c.json({ error: "Invalid body. Required: { amount, from, to }" }, 400);
      }
      try {
        const r = convert(body.amount, body.from, body.to);
        return c.json({ amount: body.amount, from: body.from, to: body.to, ...r });
      } catch (e) {
        return c.json({ error: e.message }, 400);
      }
    });
  }
});

// api/_lib/ai/altdata.ts
function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
function pseudoRandom(seed) {
  let s = seed;
  return () => {
    s = s * 1664525 + 1013904223 >>> 0;
    return s / 4294967295;
  };
}
function themesFor(base) {
  return SENTIMENT_THEMES[base] || ["retail interest", "developer activity", "macro liquidity"];
}
function getSentiment(symbol) {
  const base = symbol.replace("USDT", "").toUpperCase();
  const rnd = pseudoRandom(hash(base) + Math.floor(Date.now() / (15 * 60 * 1e3)));
  const raw2 = (rnd() * 2 - 1) * 0.85;
  const score = Number(raw2.toFixed(3));
  const label = score > 0.55 ? "Euphoric" : score > 0.2 ? "Bullish" : score < -0.4 ? "Bearish" : "Neutral";
  const mentions = Math.floor(800 + rnd() * 28e3);
  const themes = themesFor(base).slice(0, 3);
  return {
    symbol,
    score,
    label,
    mentions24h: mentions,
    sources: {
      twitter: Number((0.4 + rnd() * 0.6).toFixed(2)),
      reddit: Number((0.3 + rnd() * 0.6).toFixed(2)),
      news: Number((0.2 + rnd() * 0.6).toFixed(2))
    },
    topThemes: themes,
    aiSummary: `Last 24h: ${mentions.toLocaleString()} social mentions for ${base}. Sentiment is ${label.toLowerCase()} (${(score * 100).toFixed(0)}/100). Key drivers: ${themes.join(", ")}.`,
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
}
function getFearGreedSynthetic() {
  const rnd = pseudoRandom(Math.floor(Date.now() / (30 * 60 * 1e3)));
  const value = Math.round(20 + rnd() * 70);
  const delta = Math.round((rnd() - 0.5) * 12);
  const classification = value < 25 ? "Extreme Fear" : value < 45 ? "Fear" : value < 55 ? "Neutral" : value < 75 ? "Greed" : "Extreme Greed";
  const history = Array.from({ length: 14 }, (_, i) => {
    const r = pseudoRandom(hash(`fg-${i}`) + Math.floor(Date.now() / (24 * 3600 * 1e3)));
    return {
      date: new Date(Date.now() - (13 - i) * 24 * 3600 * 1e3).toISOString().slice(0, 10),
      value: Math.round(20 + r() * 70)
    };
  });
  return { value, classification, delta24h: delta, history, source: "synthetic" };
}
async function getFearGreed() {
  const now = Date.now();
  if (fgCache && now - fgCache.ts < FG_CACHE_TTL_MS) return fgCache.data;
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 4500);
    const res = await fetch("https://api.alternative.me/fng/?limit=15", { signal: ctrl.signal });
    clearTimeout(timer);
    if (!res.ok) throw new Error(`http ${res.status}`);
    const json = await res.json();
    const data = json.data || [];
    if (!data.length) throw new Error("empty payload");
    const today = data[0];
    const yesterday = data[1] || today;
    const history = data.slice(0, 14).map((r) => ({
      date: new Date(Number(r.timestamp) * 1e3).toISOString().slice(0, 10),
      value: Number(r.value)
    })).reverse();
    const result = {
      value: Number(today.value),
      classification: today.value_classification,
      delta24h: Number(today.value) - Number(yesterday.value),
      history,
      source: "alternative.me"
    };
    fgCache = { data: result, ts: now };
    return result;
  } catch {
    return getFearGreedSynthetic();
  }
}
function momentumFromDelta(delta) {
  if (delta > 0.3) return "Spike";
  if (delta > 0.05) return "Rising";
  if (delta < -0.2) return "Cooling";
  return "Stable";
}
function getSocialPulseSynthetic() {
  return PULSE_SYMBOLS.map((sym) => {
    const s = getSentiment(sym);
    const delta = Number(((Math.random() - 0.5) * 0.8).toFixed(2));
    return {
      symbol: sym,
      mentions24h: s.mentions24h,
      sentiment: s.score,
      delta,
      momentum: momentumFromDelta(delta),
      source: "synthetic"
    };
  }).sort((a, b) => b.mentions24h - a.mentions24h);
}
async function loadCoinGecko() {
  const now = Date.now();
  if (cgCache && now - cgCache.ts < CG_CACHE_TTL_MS) return cgCache.data;
  const fetchOne = async (sym, id) => {
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 4500);
      const url2 = `https://api.coingecko.com/api/v3/coins/${id}?localization=false&tickers=false&market_data=true&community_data=true&developer_data=false&sparkline=false`;
      const res = await fetch(url2, {
        signal: ctrl.signal,
        headers: { "accept": "application/json" }
      });
      clearTimeout(timer);
      if (!res.ok) throw new Error(`http ${res.status}`);
      const json = await res.json();
      const up = Number(json.sentiment_votes_up_percentage || 0);
      const down = Number(json.sentiment_votes_down_percentage || 0);
      const sentiment = up + down > 0 ? (up - down) / 100 : 0;
      const cd = json.community_data || {};
      const posts = Number(cd.reddit_average_posts_48h || 0);
      const comments = Number(cd.reddit_average_comments_48h || 0);
      const twitter = Number(cd.twitter_followers || 0);
      const mentions24h = Math.round((posts + comments) * 18 + twitter / 4e3 + 800);
      const priceChange = Number(json.market_data?.price_change_percentage_24h || 0);
      const delta = Math.max(-1, Math.min(1, priceChange / 20));
      return [sym, {
        sentiment: Number(sentiment.toFixed(3)),
        mentions24h,
        delta: Number(delta.toFixed(2))
      }];
    } catch {
      return null;
    }
  };
  const results = await Promise.all(
    Object.entries(COINGECKO_ID_MAP).map(([sym, id]) => fetchOne(sym, id))
  );
  const map = /* @__PURE__ */ new Map();
  for (const r of results) {
    if (r) map.set(r[0], r[1]);
  }
  if (map.size > 0) cgCache = { data: map, ts: now };
  return map;
}
async function getSocialPulse() {
  const cg = await loadCoinGecko();
  if (cg.size === 0) return getSocialPulseSynthetic();
  return PULSE_SYMBOLS.map((sym) => {
    const real = cg.get(sym);
    if (real) {
      return {
        symbol: sym,
        mentions24h: real.mentions24h,
        sentiment: real.sentiment,
        delta: real.delta,
        momentum: momentumFromDelta(real.delta),
        source: "coingecko"
      };
    }
    const s = getSentiment(sym);
    const delta = Number(((Math.random() - 0.5) * 0.5).toFixed(2));
    return {
      symbol: sym,
      mentions24h: s.mentions24h,
      sentiment: s.score,
      delta,
      momentum: momentumFromDelta(delta),
      source: "synthetic"
    };
  }).sort((a, b) => b.mentions24h - a.mentions24h);
}
function signalFromSentiment(sentiment, change24h) {
  const blended = sentiment * 0.6 + change24h / 10 * 0.4;
  if (blended > 0.35) return "BUY";
  if (blended < -0.35) return "SELL";
  if (Math.abs(blended) < 0.08) return "NEUTRAL";
  return "HOLD";
}
var SENTIMENT_THEMES, FG_CACHE_TTL_MS, fgCache, PULSE_SYMBOLS, COINGECKO_ID_MAP, CG_CACHE_TTL_MS, cgCache;
var init_altdata = __esm({
  "api/_lib/ai/altdata.ts"() {
    SENTIMENT_THEMES = {
      BTC: ["ETF inflows", "halving narrative", "institutional buying", "macro hedge"],
      ETH: ["L2 adoption", "restaking", "fee burn", "staking yield"],
      SOL: ["memecoin volume", "DePIN growth", "mobile wallet UX"],
      BNB: ["exchange flow", "BNB Chain TVL", "ecosystem grants"],
      XRP: ["SEC clarity", "cross-border rails", "banking partnerships"],
      DOGE: ["Elon mention", "retail FOMO", "pump risk"],
      SHIB: ["burn rate", "community hype"]
    };
    FG_CACHE_TTL_MS = 30 * 60 * 1e3;
    fgCache = null;
    PULSE_SYMBOLS = [
      "BTCUSDT",
      "ETHUSDT",
      "SOLUSDT",
      "BNBUSDT",
      "XRPUSDT",
      "DOGEUSDT",
      "ADAUSDT",
      "AVAXUSDT",
      "LINKUSDT",
      "DOTUSDT",
      "SHIBUSDT",
      "NEARUSDT",
      "WIFUSDT",
      "PEPEUSDT",
      "TIAUSDT",
      "INJUSDT",
      "ARBUSDT",
      "OPUSDT"
    ];
    COINGECKO_ID_MAP = {
      BTCUSDT: "bitcoin",
      ETHUSDT: "ethereum",
      SOLUSDT: "solana",
      BNBUSDT: "binancecoin",
      XRPUSDT: "ripple",
      DOGEUSDT: "dogecoin",
      ADAUSDT: "cardano",
      AVAXUSDT: "avalanche-2",
      LINKUSDT: "chainlink",
      DOTUSDT: "polkadot",
      SHIBUSDT: "shiba-inu",
      NEARUSDT: "near",
      WIFUSDT: "dogwifcoin",
      PEPEUSDT: "pepe",
      TIAUSDT: "celestia",
      INJUSDT: "injective-protocol",
      ARBUSDT: "arbitrum",
      OPUSDT: "optimism"
    };
    CG_CACHE_TTL_MS = 15 * 60 * 1e3;
    cgCache = null;
  }
});

// api/_lib/ai/sources/cryptoNewsRss.ts
function decodeEntities(s) {
  return s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").replace(/<[^>]+>/g, "").replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n))).replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16))).replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
}
function extract(block, tag) {
  const m = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i"));
  return m ? m[1].trim() : "";
}
function tagFor(title) {
  for (const r of TAG_RULES) if (r.re.test(title)) return { tag: r.tag, tagColor: r.tagColor };
  return { tag: "NEWS", tagColor: "slate" };
}
function parseFeed(xml, source) {
  const items = xml.match(/<item[\s\S]*?<\/item>/gi) || [];
  const out = [];
  for (const block of items) {
    const title = decodeEntities(extract(block, "title"));
    const link = decodeEntities(extract(block, "link") || extract(block, "guid"));
    const pub = extract(block, "pubDate");
    if (!title || !link) continue;
    const ts = pub ? Math.floor(new Date(pub).getTime() / 1e3) : 0;
    const { tag, tagColor } = tagFor(title);
    out.push({ id: link, title, source, url: link, publishedAt: ts || 0, tag, tagColor });
  }
  return out;
}
async function fetchFeed(feed) {
  const res = await fetch(feed.url, {
    headers: { "User-Agent": "CoinWiseAI/1.0", Accept: "application/rss+xml, application/xml, text/xml" }
  });
  if (!res.ok) throw new Error(`${feed.source}_${res.status}`);
  const xml = await res.text();
  return parseFeed(xml, feed.source);
}
async function fetchLatestNews(limit = 8) {
  if (CACHE && Date.now() - CACHE.ts < TTL_MS2) return CACHE.data.slice(0, limit);
  const results = await Promise.allSettled(FEEDS.map(fetchFeed));
  const merged = [];
  for (const r of results) if (r.status === "fulfilled") merged.push(...r.value);
  const seen = /* @__PURE__ */ new Set();
  const deduped = [];
  for (const n of merged) {
    const key = n.url.toLowerCase();
    const tkey = n.title.toLowerCase().slice(0, 60);
    if (seen.has(key) || seen.has(tkey)) continue;
    seen.add(key);
    seen.add(tkey);
    deduped.push(n);
  }
  deduped.sort((a, b) => b.publishedAt - a.publishedAt);
  if (deduped.length) CACHE = { ts: Date.now(), data: deduped };
  return deduped.slice(0, limit);
}
var FEEDS, TTL_MS2, CACHE, TAG_RULES;
var init_cryptoNewsRss = __esm({
  "api/_lib/ai/sources/cryptoNewsRss.ts"() {
    FEEDS = [
      { source: "Cointelegraph", url: "https://cointelegraph.com/rss" },
      { source: "Decrypt", url: "https://decrypt.co/feed" },
      { source: "CryptoSlate", url: "https://cryptoslate.com/feed/" },
      { source: "Bitcoinist", url: "https://bitcoinist.com/feed/" }
    ];
    TTL_MS2 = 5 * 60 * 1e3;
    CACHE = null;
    TAG_RULES = [
      { tag: "BTC", tagColor: "amber", re: /\bbitcoin\b|\bbtc\b/i },
      { tag: "ETH", tagColor: "blue", re: /\bethereum\b|\bether\b|\beth\b/i },
      { tag: "SOL", tagColor: "cyan", re: /\bsolana\b|\bsol\b/i },
      { tag: "XRP", tagColor: "sky", re: /\bxrp\b|\bripple\b/i },
      { tag: "BNB", tagColor: "orange", re: /\bbinance\b|\bbnb\b/i },
      { tag: "DOGE", tagColor: "yellow", re: /\bdogecoin\b|\bdoge\b/i },
      { tag: "DEFI", tagColor: "violet", re: /\bdefi\b|\baave\b|\buniswap\b|\bdex\b|\blending\b|\bstaking\b|\byield\b/i },
      { tag: "NFT", tagColor: "pink", re: /\bnft\b/i },
      { tag: "MACRO", tagColor: "emerald", re: /\bfed\b|\bfomc\b|\bsec\b|\betf\b|\bregulat|\binflation\b|\brate cut\b|\binterest rate\b|\bgovernment\b|\blawsuit\b/i }
    ];
  }
});

// api/_lib/routes/market.ts
var marketRouter, BINANCE;
var init_market = __esm({
  "api/_lib/routes/market.ts"() {
    init_dist();
    init_fx();
    init_altdata();
    init_cryptoNewsRss();
    marketRouter = new Hono2();
    BINANCE = "https://api.binance.com/api/v3";
    marketRouter.get("/prices", async (c) => {
      const symbolsRaw = c.req.query("symbols") || "";
      const symbols = symbolsRaw ? symbolsRaw.split(",").map((s) => s.trim().toUpperCase()) : [];
      try {
        const res = await fetch(`${BINANCE}/ticker/24hr`);
        const all = await res.json();
        const set = new Set(symbols);
        const filtered = symbols.length ? all.filter((d) => set.has(d.symbol)) : all.slice(0, 100);
        const out = filtered.map((d) => {
          const price = Number(d.lastPrice);
          const change = Number(d.priceChangePercent);
          const sentiment = getSentiment(d.symbol).score;
          return {
            symbol: d.symbol,
            price,
            priceVnd: usdToVnd(price),
            change24h: change,
            high24h: Number(d.highPrice),
            low24h: Number(d.lowPrice),
            aiSignal: signalFromSentiment(sentiment, change)
          };
        });
        return c.json(out);
      } catch (e) {
        return c.json({ error: "binance_proxy_failed", detail: e.message }, 502);
      }
    });
    marketRouter.get("/:symbol/sentiment", (c) => c.json(getSentiment(c.req.param("symbol"))));
    marketRouter.get("/fear-greed", async (c) => c.json(await getFearGreed()));
    marketRouter.get("/social-pulse", async (c) => c.json(await getSocialPulse()));
    marketRouter.get("/news", async (c) => {
      const limit = Math.min(20, Math.max(1, Number(c.req.query("limit")) || 8));
      try {
        const items = await fetchLatestNews(limit);
        if (!items.length) return c.json({ items: [], source: "rss", degraded: true });
        return c.json({ items, source: "rss", degraded: false, fetchedAt: (/* @__PURE__ */ new Date()).toISOString() });
      } catch (e) {
        return c.json({ items: [], source: "rss", degraded: true, error: e.message }, 200);
      }
    });
  }
});

// api/_lib/state.ts
function getAccount(accountId) {
  let acc = store.get(accountId);
  if (!acc) {
    acc = {
      accountId,
      cashUsd: 1e6,
      // starts with $1M paper capital
      positions: [],
      transactions: [],
      createdAt: Date.now()
    };
    store.set(accountId, acc);
  }
  return acc;
}
function shortId(prefix = "tx") {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}
function deriveAccountNo(accountId) {
  let h = 0;
  for (let i = 0; i < accountId.length; i++) h = h * 31 + accountId.charCodeAt(i) >>> 0;
  return (1e10 + h % 9e9).toString();
}
function bankPathKey(accountId) {
  return accountId.replace(/[.#$/\[\]]/g, "_");
}
function bankFirebaseUrl(accountId) {
  return `${FIREBASE_DB_URL}/banks/${encodeURIComponent(bankPathKey(accountId))}.json`;
}
async function loadBankFromFirebase(accountId) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 4500);
  let res;
  try {
    res = await fetch(bankFirebaseUrl(accountId), { signal: ctrl.signal });
  } finally {
    clearTimeout(timer);
  }
  if (!res.ok) {
    throw new Error(`Bank storage unreachable (HTTP ${res.status})`);
  }
  const data = await res.json();
  if (!data || typeof data !== "object") return null;
  if (!Array.isArray(data.transactions)) data.transactions = [];
  return data;
}
async function saveBankToFirebase(acc) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 4500);
  let res;
  try {
    res = await fetch(bankFirebaseUrl(acc.accountId), {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(acc),
      signal: ctrl.signal
    });
  } finally {
    clearTimeout(timer);
  }
  if (!res.ok) {
    throw new Error(`Failed to persist bank account (HTTP ${res.status})`);
  }
}
async function getBankAccount(accountId, holder) {
  const remote = await loadBankFromFirebase(accountId);
  if (remote) {
    if (holder && remote.holder === "CoinWise User") {
      remote.holder = holder;
      await saveBankToFirebase(remote).catch(() => {
      });
    }
    return remote;
  }
  const acc = {
    accountId,
    holder: holder || "CoinWise User",
    bankAccountNo: deriveAccountNo(accountId),
    balanceVnd: SEED_BALANCE_VND,
    transactions: [],
    openedAt: Date.now()
  };
  await saveBankToFirebase(acc);
  return acc;
}
function recordBankTxn(acc, type, amountVnd, note) {
  const txn = {
    id: shortId("bank"),
    ref: shortId(type.toLowerCase()).toUpperCase(),
    type,
    amountVnd,
    balanceAfterVnd: acc.balanceVnd,
    note,
    timestamp: Date.now()
  };
  acc.transactions.push(txn);
  return txn;
}
var store, SEED_BALANCE_VND, FIREBASE_DB_URL;
var init_state = __esm({
  "api/_lib/state.ts"() {
    store = /* @__PURE__ */ new Map();
    SEED_BALANCE_VND = 5e7;
    FIREBASE_DB_URL = "https://gen-lang-client-0742583847-default-rtdb.asia-southeast1.firebasedatabase.app";
  }
});

// api/_lib/ai/sources/reddit.ts
async function fetchJson(url2, attempt = 0) {
  const target = attempt === 0 ? url2 : url2.replace("www.reddit.com", "old.reddit.com");
  const res = await fetch(target, {
    headers: {
      "User-Agent": USER_AGENT,
      "Accept": "application/json, text/plain, */*",
      "Accept-Language": "en-US,en;q=0.9",
      "Cache-Control": "no-cache"
    }
  });
  if (!res.ok) {
    if ((res.status === 403 || res.status === 429) && attempt === 0) {
      return fetchJson(url2, attempt + 1);
    }
    throw new Error(`Reddit ${res.status} on ${target}`);
  }
  return res.json();
}
function parseChildren(json) {
  const children = json?.data?.children || [];
  return children.filter((c) => c?.kind === "t3" && c?.data).map((c) => ({
    id: c.data.id,
    title: c.data.title || "",
    selftext: c.data.selftext || "",
    subreddit: c.data.subreddit || "",
    author: c.data.author || "",
    ups: Number(c.data.ups) || 0,
    numComments: Number(c.data.num_comments) || 0,
    createdUtc: Number(c.data.created_utc) || 0,
    url: c.data.permalink ? `https://reddit.com${c.data.permalink}` : c.data.url || "",
    flair: c.data.link_flair_text || void 0
  }));
}
async function fetchSubredditHot(subreddit, limit = 50) {
  const key = `sub:${subreddit}:${limit}`;
  const hit = CACHE2.get(key);
  if (hit && Date.now() - hit.ts < TTL_MS3) return hit.data;
  const url2 = `https://www.reddit.com/r/${encodeURIComponent(subreddit)}/hot.json?limit=${limit}&t=day`;
  const json = await fetchJson(url2);
  const posts = parseChildren(json);
  CACHE2.set(key, { ts: Date.now(), data: posts });
  return posts;
}
async function collectCorpusForSymbol(symbol) {
  const base = symbol.replace(/USDT$|USD$/i, "").toUpperCase();
  const sources = [];
  const errors = [];
  const all = [];
  for (const sub of PER_COIN_SUBS[base] || []) {
    try {
      const posts2 = await fetchSubredditHot(sub, 40);
      all.push(...posts2);
      sources.push(`r/${sub} (n=${posts2.length})`);
    } catch (e) {
      errors.push(`r/${sub}: ${e.message}`);
    }
  }
  try {
    const general = await fetchSubredditHot("CryptoCurrency", 100);
    const re = new RegExp(`\\b${base}\\b|\\$${base}\\b`, "i");
    const matched = general.filter((p) => re.test(p.title) || re.test(p.selftext));
    all.push(...matched);
    sources.push(`r/CryptoCurrency filtered=${matched.length}/${general.length}`);
  } catch (e) {
    errors.push(`r/CryptoCurrency: ${e.message}`);
  }
  const dedup = /* @__PURE__ */ new Map();
  for (const p of all) dedup.set(p.id, p);
  const posts = Array.from(dedup.values()).sort((a, b) => b.ups - a.ups);
  return { posts, sources, errors };
}
async function pingReddit() {
  const t0 = Date.now();
  try {
    const posts = await fetchSubredditHot("CryptoCurrency", 5);
    return { ok: posts.length > 0, latencyMs: Date.now() - t0, sample: posts.length };
  } catch (e) {
    return { ok: false, latencyMs: Date.now() - t0, error: e.message };
  }
}
var CACHE2, TTL_MS3, USER_AGENT, PER_COIN_SUBS;
var init_reddit = __esm({
  "api/_lib/ai/sources/reddit.ts"() {
    CACHE2 = /* @__PURE__ */ new Map();
    TTL_MS3 = 5 * 60 * 1e3;
    USER_AGENT = "web:coinwise-ai:v1.0.0 (by /u/coinwise_dev)";
    PER_COIN_SUBS = {
      BTC: ["Bitcoin", "BitcoinMarkets"],
      ETH: ["ethereum", "ethfinance"],
      SOL: ["solana"],
      BNB: ["binance"],
      XRP: ["XRP", "Ripple"],
      DOGE: ["dogecoin"],
      ADA: ["cardano"],
      AVAX: ["Avax"],
      LINK: ["Chainlink"],
      DOT: ["dot"],
      SHIB: ["SHIBArmy"],
      NEAR: ["nearprotocol"],
      ARB: ["arbitrum"],
      OP: ["optimism"]
    };
  }
});

// api/_lib/ai/sources/hackerNews.ts
async function fetchSearch(query, page = 0) {
  const key = `hn:${query}:${page}`;
  const hit = CACHE3.get(key);
  if (hit && Date.now() - hit.ts < TTL_MS4) return hit.data;
  const url2 = new URL("https://hn.algolia.com/api/v1/search");
  url2.searchParams.set("query", query);
  url2.searchParams.set("tags", "story");
  url2.searchParams.set("hitsPerPage", "50");
  url2.searchParams.set("page", String(page));
  const cutoff = Math.floor(Date.now() / 1e3) - 365 * 24 * 3600;
  url2.searchParams.set("numericFilters", `created_at_i>${cutoff}`);
  const finalUrl = page === 0 ? url2.toString() : url2.toString().replace("/v1/search?", "/v1/search_by_date?");
  const res = await fetch(finalUrl, {
    headers: { "User-Agent": USER_AGENT2, "Accept": "application/json" }
  });
  if (!res.ok) throw new Error(`hn_algolia_${res.status}`);
  const json = await res.json();
  const hits = (json.hits || []).filter((h) => h.title).map((h) => ({
    id: String(h.objectID),
    title: String(h.title),
    author: String(h.author || "anon"),
    points: Number(h.points) || 0,
    numComments: Number(h.num_comments) || 0,
    createdUtc: Number(h.created_at_i) || 0,
    url: String(h.url || ""),
    hnUrl: `https://news.ycombinator.com/item?id=${h.objectID}`,
    platform: "HN"
  }));
  CACHE3.set(key, { ts: Date.now(), data: hits });
  return hits;
}
async function collectHnForSymbol(symbol) {
  const base = symbol.replace(/USDT$|USD$/i, "").toUpperCase();
  const queries = COIN_QUERIES[base] || [base.toLowerCase()];
  const sources = [];
  const errors = [];
  const all = [];
  for (const q of queries) {
    try {
      const [hot, recent] = await Promise.all([fetchSearch(q, 0), fetchSearch(q, 1)]);
      all.push(...hot, ...recent);
      sources.push(`hn.algolia "${q}" (n=${hot.length}+${recent.length})`);
    } catch (e) {
      errors.push(`hn:${q}: ${e.message}`);
    }
  }
  const dedup = /* @__PURE__ */ new Map();
  for (const h of all) dedup.set(h.id, h);
  const nowSec = Date.now() / 1e3;
  const score = (h) => (h.points + 1) * Math.pow(0.5, Math.max(0, (nowSec - h.createdUtc) / 86400) / 180);
  const posts = Array.from(dedup.values()).sort((a, b) => score(b) - score(a));
  return { posts, sources, errors };
}
async function pingHackerNews() {
  const t0 = Date.now();
  try {
    const hits = await fetchSearch("bitcoin", 0);
    return { ok: hits.length > 0, latencyMs: Date.now() - t0, sample: hits.length };
  } catch (e) {
    return { ok: false, latencyMs: Date.now() - t0, error: e.message };
  }
}
var CACHE3, TTL_MS4, USER_AGENT2, COIN_QUERIES;
var init_hackerNews = __esm({
  "api/_lib/ai/sources/hackerNews.ts"() {
    CACHE3 = /* @__PURE__ */ new Map();
    TTL_MS4 = 10 * 60 * 1e3;
    USER_AGENT2 = "CoinWiseAI/1.0";
    COIN_QUERIES = {
      BTC: ["bitcoin", "BTC"],
      ETH: ["ethereum", "ETH"],
      SOL: ["solana"],
      BNB: ["binance", "BNB"],
      XRP: ["ripple", "XRP"],
      DOGE: ["dogecoin"],
      ADA: ["cardano"],
      AVAX: ["avalanche crypto"],
      LINK: ["chainlink"],
      DOT: ["polkadot"],
      SHIB: ["shiba inu"],
      NEAR: ["near protocol"],
      ARB: ["arbitrum"],
      OP: ["optimism crypto"]
    };
  }
});

// api/_lib/ai/sources/stocktwits.ts
async function collectStockTwits(symbol) {
  const base = symbol.replace(/USDT$|USD$/i, "").toUpperCase();
  const ticker = ST_SYMBOLS[base] || `${base}.X`;
  const cacheKey = `st:${ticker}`;
  const hit = CACHE4.get(cacheKey);
  if (hit && Date.now() - hit.ts < TTL_MS5) {
    return { posts: hit.data, sources: [`stocktwits ${ticker} (n=${hit.data.length})`], errors: [] };
  }
  try {
    const url2 = `https://api.stocktwits.com/api/2/streams/symbol/${encodeURIComponent(ticker)}.json`;
    const res = await fetch(url2, {
      headers: { "User-Agent": USER_AGENT3, "Accept": "application/json" }
    });
    if (!res.ok) throw new Error(`stocktwits_${res.status}`);
    const json = await res.json();
    const messages = json.messages || [];
    const posts = messages.filter((m) => m.body).map((m) => {
      const username = m.user?.username || "anon";
      const tag = m.entities?.sentiment?.basic;
      const body = tag ? `${tag}. ${m.body}` : m.body;
      return {
        id: `st:${m.id}`,
        title: body,
        author: username,
        points: Number(m.likes?.total) || 0,
        numComments: 0,
        createdUtc: m.created_at ? Math.floor(new Date(m.created_at).getTime() / 1e3) : 0,
        url: `https://stocktwits.com/${username}/message/${m.id}`,
        hnUrl: `https://stocktwits.com/symbol/${ticker}`,
        platform: "StockTwits"
      };
    });
    CACHE4.set(cacheKey, { ts: Date.now(), data: posts });
    return { posts, sources: [`stocktwits ${ticker} (n=${posts.length})`], errors: [] };
  } catch (e) {
    return { posts: [], sources: [], errors: [`stocktwits:${ticker}: ${e.message}`] };
  }
}
var ST_SYMBOLS, CACHE4, TTL_MS5, USER_AGENT3;
var init_stocktwits = __esm({
  "api/_lib/ai/sources/stocktwits.ts"() {
    ST_SYMBOLS = {
      BTC: "BTC.X",
      ETH: "ETH.X",
      SOL: "SOL.X",
      BNB: "BNB.X",
      XRP: "XRP.X",
      DOGE: "DOGE.X",
      ADA: "ADA.X",
      AVAX: "AVAX.X",
      LINK: "LINK.X",
      DOT: "DOT.X",
      SHIB: "SHIB.X",
      NEAR: "NEAR.X",
      ARB: "ARB.X",
      OP: "OP.X",
      PEPE: "PEPE.X",
      INJ: "INJ.X",
      TIA: "TIA.X",
      WIF: "WIF.X"
    };
    CACHE4 = /* @__PURE__ */ new Map();
    TTL_MS5 = 10 * 60 * 1e3;
    USER_AGENT3 = "Mozilla/5.0 (compatible; CoinWiseAI/1.0; +https://coinwise.ai)";
  }
});

// api/_lib/ai/mentionHistory.ts
function coinKey(coin) {
  return coin.replace(/[.#$/\[\]]/g, "_").toUpperCase();
}
function url(coin) {
  return `${FIREBASE_DB_URL2}/${PATH}/${encodeURIComponent(coinKey(coin))}.json`;
}
async function load(coin) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 3e3);
  try {
    const res = await fetch(url(coin), { signal: ctrl.signal });
    if (!res.ok) return [];
    const data = await res.json();
    if (!Array.isArray(data)) return [];
    return data.filter((s) => s && typeof s.ts === "number" && typeof s.count === "number").sort((a, b) => a.ts - b.ts);
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
}
async function save(coin, arr) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 3e3);
  try {
    await fetch(url(coin), {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(arr),
      signal: ctrl.signal
    });
  } catch {
  } finally {
    clearTimeout(timer);
  }
}
function stats(baseline, current) {
  if (baseline.length < 3) return { z: 0, mean: current, std: 0, n: baseline.length };
  const mean = baseline.reduce((s, v) => s + v, 0) / baseline.length;
  const variance = baseline.reduce((s, v) => s + (v - mean) ** 2, 0) / baseline.length;
  const std = Math.sqrt(variance);
  const z = std > 0 ? (current - mean) / std : 0;
  return { z: Number(z.toFixed(2)), mean: Math.round(mean), std: Math.round(std), n: baseline.length };
}
async function recordAndScore(coin, current, nowMs) {
  const hist = await load(coin);
  const baseline = hist.filter((s2) => nowMs - s2.ts >= MIN_GAP_MS).map((s2) => s2.count);
  const s = stats(baseline, current);
  let next = hist.slice();
  if (next.length && nowMs - next[next.length - 1].ts < MIN_GAP_MS) {
    next[next.length - 1] = { ts: nowMs, count: current };
  } else {
    next.push({ ts: nowMs, count: current });
  }
  if (next.length > HISTORY_MAX) next = next.slice(next.length - HISTORY_MAX);
  await save(coin, next);
  return { ...s, spike: s.z > 1.5 && s.n >= 5 };
}
var FIREBASE_DB_URL2, PATH, HISTORY_MAX, MIN_GAP_MS;
var init_mentionHistory = __esm({
  "api/_lib/ai/mentionHistory.ts"() {
    FIREBASE_DB_URL2 = "https://gen-lang-client-0742583847-default-rtdb.asia-southeast1.firebasedatabase.app";
    PATH = "banks/__altdata_mentions";
    HISTORY_MAX = 24;
    MIN_GAP_MS = 30 * 60 * 1e3;
  }
});

// api/_lib/ai/sources/fearGreed.ts
async function fetchFearGreedReal(limit = 30) {
  const cappedLimit = Math.min(Math.max(limit, 1), 365);
  if (CACHE5 && Date.now() - CACHE5.ts < TTL_MS6 && CACHE5.limit >= cappedLimit) {
    if (CACHE5.limit === cappedLimit) return CACHE5.data;
    const trimmed = CACHE5.data.history.slice(-cappedLimit);
    const cur = trimmed[trimmed.length - 1];
    const yesterday = trimmed[trimmed.length - 2];
    const lastWeek = trimmed[trimmed.length - 8] || trimmed[0];
    return {
      ...CACHE5.data,
      current: cur,
      delta24h: yesterday ? cur.value - yesterday.value : 0,
      delta7d: lastWeek ? cur.value - lastWeek.value : 0,
      history: trimmed
    };
  }
  try {
    const url2 = `https://api.alternative.me/fng/?limit=${cappedLimit}&format=json`;
    const res = await fetch(url2, { headers: { "User-Agent": USER_AGENT4 } });
    if (!res.ok) throw new Error(`alternative.me responded ${res.status}`);
    const json = await res.json();
    if (!json?.data?.length) throw new Error("empty payload");
    const points = json.data.map((d) => ({
      date: new Date(Number(d.timestamp) * 1e3).toISOString().slice(0, 10),
      value: Number(d.value),
      classification: d.value_classification
    })).reverse();
    const current = points[points.length - 1];
    const yesterday = points[points.length - 2];
    const lastWeek = points[points.length - 8] || points[0];
    const data = {
      ok: true,
      source: "alternative.me",
      fetchedAt: (/* @__PURE__ */ new Date()).toISOString(),
      current,
      delta24h: yesterday ? current.value - yesterday.value : 0,
      delta7d: lastWeek ? current.value - lastWeek.value : 0,
      history: points
    };
    CACHE5 = { ts: Date.now(), limit: cappedLimit, data };
    return data;
  } catch (e) {
    return { ok: false, error: e.message, fetchedAt: (/* @__PURE__ */ new Date()).toISOString() };
  }
}
async function pingFearGreed() {
  const t0 = Date.now();
  const r = await fetchFearGreedReal(30);
  if (r.ok === true) return { ok: true, latencyMs: Date.now() - t0, value: r.current.value };
  const err = "error" in r ? r.error : "unknown";
  return { ok: false, latencyMs: Date.now() - t0, error: err };
}
var CACHE5, TTL_MS6, USER_AGENT4;
var init_fearGreed = __esm({
  "api/_lib/ai/sources/fearGreed.ts"() {
    CACHE5 = null;
    TTL_MS6 = 30 * 60 * 1e3;
    USER_AGENT4 = "CoinWiseAI/1.0 (Vietnam fintech assignment)";
  }
});

// api/_lib/ai/sources/coingecko.ts
async function fetchCoinGecko(symbol) {
  const base = symbol.replace(/USDT$|USD$/i, "").toUpperCase();
  const coinId = COIN_IDS[base];
  if (!coinId) {
    return { ok: false, coinId: base, error: "unknown_coin_id", fetchedAt: (/* @__PURE__ */ new Date()).toISOString() };
  }
  const hit = CACHE6.get(coinId);
  if (hit && Date.now() - hit.ts < TTL_MS7) return hit.data;
  try {
    const url2 = `https://api.coingecko.com/api/v3/coins/${coinId}?localization=false&tickers=false&market_data=false&community_data=true&developer_data=true&sparkline=false`;
    const res = await fetch(url2, { headers: { "User-Agent": USER_AGENT5, "Accept": "application/json" } });
    if (!res.ok) throw new Error(`coingecko_${res.status}`);
    const json = await res.json();
    const data = {
      ok: true,
      source: "coingecko",
      coinId,
      fetchedAt: (/* @__PURE__ */ new Date()).toISOString(),
      voteUpPct: Number(json.sentiment_votes_up_percentage) || 0,
      voteDownPct: Number(json.sentiment_votes_down_percentage) || 0,
      redditSubscribers: Number(json.community_data?.reddit_subscribers) || 0,
      redditPosts48h: Number(json.community_data?.reddit_average_posts_48h) || 0,
      twitterFollowers: Number(json.community_data?.twitter_followers) || 0,
      developerScore: Number(json.developer_score) || 0,
      communityScore: Number(json.community_score) || 0,
      alexaRank: json.public_interest_stats?.alexa_rank ?? null
    };
    CACHE6.set(coinId, { ts: Date.now(), data });
    return data;
  } catch (e) {
    return { ok: false, coinId, error: e.message, fetchedAt: (/* @__PURE__ */ new Date()).toISOString() };
  }
}
async function pingCoinGecko() {
  const t0 = Date.now();
  try {
    const res = await fetch("https://api.coingecko.com/api/v3/ping", {
      headers: { "User-Agent": USER_AGENT5 }
    });
    if (res.status === 429) return { ok: true, latencyMs: Date.now() - t0, rateLimited: true };
    if (res.ok) return { ok: true, latencyMs: Date.now() - t0 };
    return { ok: false, latencyMs: Date.now() - t0, error: `coingecko_${res.status}` };
  } catch (e) {
    return { ok: false, latencyMs: Date.now() - t0, error: e.message };
  }
}
var COIN_IDS, CACHE6, TTL_MS7, USER_AGENT5;
var init_coingecko = __esm({
  "api/_lib/ai/sources/coingecko.ts"() {
    COIN_IDS = {
      BTC: "bitcoin",
      ETH: "ethereum",
      SOL: "solana",
      BNB: "binancecoin",
      XRP: "ripple",
      DOGE: "dogecoin",
      ADA: "cardano",
      AVAX: "avalanche-2",
      LINK: "chainlink",
      DOT: "polkadot",
      SHIB: "shiba-inu",
      NEAR: "near",
      WIF: "dogwifcoin",
      PEPE: "pepe",
      TIA: "celestia",
      INJ: "injective-protocol",
      ARB: "arbitrum",
      OP: "optimism"
    };
    CACHE6 = /* @__PURE__ */ new Map();
    TTL_MS7 = 10 * 60 * 1e3;
    USER_AGENT5 = "CoinWiseAI/1.0 (Vietnam fintech assignment)";
  }
});

// api/_lib/ai/nlp/lexicon.ts
function tokenize(text) {
  if (!text) return [];
  const cleaned = text.toLowerCase().replace(/https?:\/\/\S+/g, " ").replace(/[*_`>#~]/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
  const tokens = cleaned.match(/[a-zA-Z']+(?:-[a-zA-Z']+)*|🚀|💎/g) || [];
  return tokens;
}
var LEXICON, NEGATIONS, NEGATION_WINDOW, NEGATION_DAMP, BOOSTERS;
var init_lexicon = __esm({
  "api/_lib/ai/nlp/lexicon.ts"() {
    LEXICON = {
      // ─── Strongly bullish (+3 to +4) ───
      moon: 3.5,
      mooning: 3.5,
      mooned: 3,
      moonshot: 3,
      ath: 3,
      "all-time-high": 3,
      breakout: 2.8,
      breakouts: 2.8,
      rally: 2.5,
      rallying: 2.5,
      rallied: 2.5,
      surge: 2.8,
      surging: 2.8,
      surged: 2.8,
      pump: 2.5,
      pumping: 2,
      pumped: 2,
      // careful — pump can mean manipulation
      bullish: 3,
      bull: 2.5,
      bulls: 2,
      "bull-run": 3.5,
      parabolic: 3.5,
      vertical: 2.5,
      exploding: 3,
      explode: 2.8,
      rocket: 3,
      rockets: 2.5,
      "\u{1F680}": 3,
      diamond: 1.5,
      "diamond-hands": 2.5,
      "\u{1F48E}": 1.5,
      green: 1.5,
      greens: 1.5,
      "in-the-green": 2,
      gain: 2,
      gains: 2,
      gained: 1.8,
      gaining: 1.8,
      profit: 2,
      profits: 2,
      profitable: 2,
      win: 1.5,
      winning: 1.8,
      wins: 1.5,
      winner: 2,
      buy: 1.5,
      buying: 1.5,
      accumulate: 2,
      accumulating: 2,
      accumulation: 2,
      long: 1,
      longs: 1,
      longing: 1.5,
      adoption: 2,
      adopting: 1.8,
      mainstream: 1.5,
      approved: 1.8,
      approval: 1.8,
      listed: 1.5,
      listing: 1.5,
      partnership: 1.8,
      partnerships: 1.8,
      upgrade: 1.5,
      upgraded: 1.5,
      innovation: 1.5,
      milestone: 1.8,
      launch: 1,
      launched: 1.2,
      // ─── Mildly positive (+1 to +2) ───
      hodl: 1.5,
      holding: 1,
      hold: 0.8,
      stable: 1,
      steady: 1,
      recovery: 1.8,
      recovering: 1.5,
      recover: 1.5,
      bounce: 1.5,
      bouncing: 1.5,
      bounced: 1.5,
      rebound: 2,
      support: 1,
      supports: 1,
      supported: 1,
      good: 1.5,
      great: 2.5,
      excellent: 2.8,
      amazing: 2.8,
      awesome: 2.5,
      optimistic: 2,
      hopeful: 1.5,
      confident: 1.8,
      strong: 1.5,
      outperform: 2,
      outperforming: 2,
      beat: 1.5,
      upside: 1.5,
      // General (non-crypto) positive words — comments aren't always domain text.
      love: 2.5,
      loved: 2,
      loving: 2,
      like: 1,
      likes: 1,
      liked: 1,
      nice: 1.5,
      cool: 1.2,
      happy: 1.8,
      glad: 1.5,
      best: 2,
      better: 1.2,
      perfect: 2.5,
      wonderful: 2.5,
      fantastic: 2.6,
      brilliant: 2.4,
      beautiful: 2,
      won: 1.5,
      gem: 2,
      solid: 1.5,
      promising: 1.8,
      recommend: 1.5,
      impressive: 2,
      agree: 1,
      fun: 1.5,
      // ─── Strongly bearish (-3 to -4) ───
      crash: -3.5,
      crashing: -3.5,
      crashed: -3.5,
      crashes: -3,
      dump: -2.8,
      dumping: -2.8,
      dumped: -2.8,
      dumps: -2.5,
      rug: -3.5,
      rugged: -3.5,
      "rug-pull": -4,
      rugpull: -4,
      scam: -3.5,
      scams: -3,
      scammer: -3.5,
      scammers: -3.5,
      scammed: -3,
      fraud: -3.5,
      fraudulent: -3.5,
      rekt: -3,
      liquidated: -2.5,
      liquidation: -2.5,
      liquidations: -2.5,
      bearish: -3,
      bear: -2.5,
      bears: -2,
      "bear-market": -3,
      capitulation: -3,
      capitulate: -2.8,
      bloodbath: -3.5,
      bloodbaths: -3.5,
      hack: -3,
      hacked: -3,
      hackers: -2.5,
      exploit: -2.8,
      exploited: -3,
      ban: -2.5,
      banned: -2.5,
      banning: -2,
      illegal: -2.5,
      collapse: -3,
      collapsing: -3,
      collapsed: -3,
      bankrupt: -3.5,
      bankruptcy: -3.5,
      insolvent: -3,
      fud: -2,
      ponzi: -3.5,
      shitcoin: -2.5,
      worthless: -3.5,
      dead: -2,
      dying: -2.5,
      // Note: 'bubble' is bearish in crypto context (warning of correction)
      bubble: -2,
      overvalued: -2,
      overbought: -1.5,
      // ─── Mildly negative (-1 to -2) ───
      down: -1,
      downtrend: -2,
      decline: -1.8,
      declining: -1.8,
      declined: -1.5,
      drop: -1.8,
      dropping: -1.5,
      dropped: -1.5,
      drops: -1.5,
      fall: -1.5,
      falling: -1.5,
      fell: -1.5,
      falls: -1.2,
      loss: -2,
      losses: -2,
      losing: -1.8,
      lose: -1.8,
      lost: -1.8,
      sell: -1.5,
      selling: -1.5,
      sold: -1,
      sells: -1,
      short: -1,
      shorts: -1,
      shorting: -1.5,
      red: -1.5,
      reds: -1.5,
      "in-the-red": -2,
      weak: -1.5,
      weakness: -1.8,
      struggle: -1.5,
      struggling: -1.5,
      concern: -1.5,
      concerns: -1.5,
      concerned: -1.5,
      worried: -1.8,
      worry: -1.5,
      fear: -2,
      scared: -1.8,
      panic: -2.5,
      panicking: -2.5,
      panicked: -2.5,
      bad: -1.8,
      terrible: -2.8,
      awful: -2.5,
      horrible: -2.8,
      pessimistic: -2,
      doom: -2.5,
      doomed: -2.5,
      // General (non-crypto) negative words + profanity — casual comments need them
      // or the NB model collapses to its prior and mislabels them positive.
      shit: -2.2,
      shitty: -2.5,
      crap: -2,
      crappy: -2.2,
      garbage: -2.8,
      trash: -2.8,
      fuck: -2.5,
      fucked: -2.8,
      fuckin: -1.5,
      wtf: -1.5,
      damn: -1.2,
      hate: -2.6,
      hated: -2.4,
      hates: -2.4,
      suck: -2,
      sucks: -2.2,
      sucked: -2,
      stupid: -2.2,
      dumb: -2,
      idiot: -2.5,
      idiots: -2.5,
      joke: -1.5,
      nonsense: -2,
      ugly: -1.8,
      worst: -3,
      pathetic: -2.5,
      useless: -2.5,
      disaster: -2.8,
      disappointing: -2.2,
      disappointed: -2,
      annoying: -1.8,
      angry: -2,
      mad: -1.5,
      boring: -1.2,
      lame: -1.8,
      fake: -2,
      liar: -2.5,
      lies: -2,
      lying: -2,
      risk: -0.8,
      risky: -1.5,
      dangerous: -1.8,
      uncertain: -1,
      uncertainty: -1.2,
      reject: -1.5,
      rejected: -1.5,
      rejection: -1.5,
      resistance: -0.5,
      // technical: resistance level slows price
      correction: -1.5,
      corrections: -1.5,
      pullback: -1,
      // ─── Regulatory / negative news ───
      sec: -0.5,
      sue: -1.5,
      sued: -1.5,
      lawsuit: -2,
      lawsuits: -2,
      investigation: -1.5,
      fine: -1.5,
      fines: -1.5,
      fined: -1.5,
      // ─── Generic finance / news verbs (expanded for distant-supervision labeling) ───
      // Positive finance verbs
      soar: 3,
      soars: 3,
      soared: 2.8,
      soaring: 2.8,
      skyrocket: 3,
      skyrockets: 3,
      skyrocketed: 3,
      jumps: 1.8,
      jumped: 1.8,
      jumping: 1.5,
      rises: 1.5,
      rising: 1.5,
      rose: 1.2,
      climbs: 1.5,
      climbing: 1.5,
      climbed: 1.2,
      boom: 2.5,
      booming: 2.5,
      boomed: 2,
      thrives: 2,
      thriving: 2,
      flourishing: 2.2,
      successful: 1.8,
      success: 1.5,
      succeeds: 1.8,
      record: 1,
      milestones: 1.8,
      achievement: 1.8,
      achieved: 1.5,
      beats: 1.5,
      launches: 1.2,
      launching: 1,
      passes: 0.8,
      passed: 0.8,
      expand: 1,
      expanding: 1,
      expansion: 1.2,
      revolutionary: 2,
      innovative: 1.8,
      breakthrough: 2.5,
      legalized: 2,
      legalize: 1.5,
      legitimate: 1.5,
      raises: 1,
      raised: 1,
      funded: 1,
      funding: 0.5,
      beating: 1.5,
      outperformed: 2,
      // Negative finance verbs
      plunge: -3,
      plunges: -3,
      plunged: -3,
      plunging: -3,
      plummet: -3,
      plummets: -3,
      plummeted: -3,
      plummeting: -3,
      tumbles: -2.5,
      tumbled: -2.5,
      tumbling: -2.5,
      sinks: -2.5,
      sank: -2.5,
      sinking: -2.5,
      slips: -1.5,
      slipped: -1.5,
      slipping: -1.5,
      slumps: -2.5,
      slumped: -2.5,
      tanks: -2.5,
      tanked: -2.5,
      tanking: -2.5,
      freezes: -2,
      frozen: -2,
      freezing: -1.8,
      halt: -2,
      halts: -2,
      halted: -2,
      halting: -2,
      shuts: -1.8,
      "shut-down": -2,
      shutdown: -2,
      shutting: -1.8,
      outage: -2,
      outages: -2,
      downtime: -1.8,
      controversy: -1.8,
      controversial: -1.5,
      controversies: -1.8,
      problem: -1.5,
      problems: -1.5,
      problematic: -1.8,
      issue: -1,
      issues: -1,
      warning: -1.5,
      warned: -1.5,
      warns: -1.5,
      warnings: -1.5,
      threat: -2,
      threats: -2,
      threatening: -2,
      threatened: -1.8,
      delays: -1.5,
      delayed: -1.5,
      delaying: -1.5,
      delay: -1.2,
      suspends: -2,
      suspended: -2,
      suspension: -2,
      cancels: -1.8,
      cancelled: -1.8,
      canceled: -1.8,
      closes: -0.8,
      closed: -0.8,
      closing: -0.8,
      layoffs: -2.5,
      fired: -1.8,
      firing: -1.5,
      terminated: -1.8,
      failure: -2.5,
      failed: -2,
      failing: -2,
      fails: -2,
      fallen: -1.5,
      shocks: -2,
      shocked: -1.8,
      shocking: -2,
      blow: -1.5,
      blows: -1.5,
      hurt: -1.8,
      hurting: -1.8,
      steal: -2.5,
      stolen: -2.5,
      stealing: -2.5,
      theft: -2.8,
      thefts: -2.8,
      blackmail: -3,
      ransom: -2.5,
      ransomware: -3,
      unprecedented: 0.5,
      sweeping: 0,
      emergency: -1.8,
      crisis: -2.5,
      urgent: -1.5,
      arrested: -2.2,
      arrest: -2,
      charges: -1.5,
      charged: -1.5,
      guilty: -2.2,
      convicted: -2.5,
      prison: -2.5,
      jailed: -2.5,
      seized: -2,
      seize: -1.8,
      raid: -2,
      raided: -2
    };
    NEGATIONS = /* @__PURE__ */ new Set([
      "not",
      "no",
      "never",
      "none",
      "nobody",
      "nothing",
      "neither",
      "nor",
      "n't",
      "cannot",
      "cant",
      "can't",
      "wont",
      "won't",
      "shouldn't",
      "shouldnt",
      "wouldn't",
      "wouldnt",
      "isn't",
      "isnt",
      "aren't",
      "arent",
      "ain't",
      "aint",
      "doesn't",
      "doesnt",
      "don't",
      "dont",
      "didn't",
      "didnt",
      "without"
    ]);
    NEGATION_WINDOW = 3;
    NEGATION_DAMP = 0.74;
    BOOSTERS = {
      absolutely: 1.3,
      completely: 1.25,
      extremely: 1.3,
      fully: 1.2,
      hugely: 1.3,
      incredibly: 1.3,
      really: 1.25,
      very: 1.25,
      super: 1.3,
      totally: 1.25,
      utterly: 1.3,
      massively: 1.3,
      fucking: 1.4,
      fkn: 1.3,
      somewhat: 0.85,
      kind: 0.85,
      slightly: 0.8,
      sort: 0.85,
      little: 0.85,
      marginally: 0.8,
      barely: 0.7,
      hardly: 0.7,
      scarcely: 0.7
    };
  }
});

// api/_lib/ai/nlp/vader.ts
function isAllCaps(raw2) {
  return raw2.length >= 3 && raw2 === raw2.toUpperCase() && /[A-Z]/.test(raw2);
}
function classify(compound) {
  if (compound >= 0.5) return "Euphoric";
  if (compound >= 0.05) return "Bullish";
  if (compound > -0.05) return "Neutral";
  if (compound > -0.5) return "Bearish";
  return "Capitulation";
}
function analyzeText(text) {
  if (!text) {
    return { compound: 0, posValence: 0, negValence: 0, neuTokens: 0, matchedTerms: [], label: "Neutral" };
  }
  const tokens = tokenize(text);
  const rawWords = text.split(/\s+/);
  const capsCount = rawWords.filter(isAllCaps).length;
  const isLoudDoc = capsCount >= 2 && capsCount / Math.max(1, rawWords.length) > 0.15;
  const exclCount = Math.min(4, (text.match(/!/g) || []).length);
  const exclBoostTotal = exclCount * EXCL_BOOST;
  const isQuestion = /\?\s*$/.test(text);
  let posV = 0;
  let negV = 0;
  let neutralTokens = 0;
  const matched = [];
  for (let i = 0; i < tokens.length; i++) {
    const tok = tokens[i];
    let valence = LEXICON[tok];
    if (valence === void 0) {
      neutralTokens++;
      continue;
    }
    for (let j = 1; j <= 2 && i - j >= 0; j++) {
      const prev = tokens[i - j];
      const booster = BOOSTERS[prev];
      if (booster !== void 0) {
        const factor = j === 1 ? booster : 1 + (booster - 1) * 0.5;
        valence = valence > 0 ? valence * factor : valence * factor;
      }
    }
    let negated = false;
    for (let j = 1; j <= NEGATION_WINDOW && i - j >= 0; j++) {
      if (NEGATIONS.has(tokens[i - j])) {
        negated = true;
        break;
      }
    }
    if (negated) {
      valence = -valence * NEGATION_DAMP;
    }
    if (isLoudDoc) {
      valence += valence > 0 ? ALL_CAPS_INCR : -ALL_CAPS_INCR;
    }
    if (exclBoostTotal > 0) {
      valence += valence > 0 ? exclBoostTotal / Math.max(1, tokens.length) * tokens.length / 4 : -exclBoostTotal / Math.max(1, tokens.length) * tokens.length / 4;
    }
    if (isQuestion) valence *= 1 - QUESTION_DAMP;
    matched.push({ token: tok, valence: Number(valence.toFixed(3)) });
    if (valence >= 0) posV += valence;
    else negV += -valence;
  }
  const sumScore = posV - negV;
  const compound = Number((sumScore / Math.sqrt(sumScore * sumScore + ALPHA)).toFixed(4));
  return {
    compound,
    posValence: Number(posV.toFixed(3)),
    negValence: Number(negV.toFixed(3)),
    neuTokens: neutralTokens,
    matchedTerms: matched.slice(0, 12),
    label: classify(compound)
  };
}
function aggregateCorpus(docs) {
  const perDoc = docs.map((d, idx) => ({
    idx,
    weight: Math.max(1, d.weight ?? 1),
    sentiment: analyzeText(d.text)
  }));
  const matched = perDoc.filter((d) => d.sentiment.matchedTerms.length > 0);
  if (matched.length === 0) {
    return {
      corpus: {
        docCount: docs.length,
        matchedDocCount: 0,
        weightedCompound: 0,
        meanCompound: 0,
        posShare: 0,
        negShare: 0,
        neuShare: 1,
        label: "Neutral"
      },
      perDoc
    };
  }
  const wSum = matched.reduce((s, d) => s + d.weight, 0);
  const weightedCompound = matched.reduce((s, d) => s + d.sentiment.compound * d.weight, 0) / wSum;
  const meanCompound = matched.reduce((s, d) => s + d.sentiment.compound, 0) / matched.length;
  const posDocs = matched.filter((d) => d.sentiment.compound >= 0.05).length;
  const negDocs = matched.filter((d) => d.sentiment.compound <= -0.05).length;
  const neuDocs = matched.length - posDocs - negDocs;
  return {
    corpus: {
      docCount: docs.length,
      matchedDocCount: matched.length,
      weightedCompound: Number(weightedCompound.toFixed(4)),
      meanCompound: Number(meanCompound.toFixed(4)),
      posShare: Number((posDocs / matched.length).toFixed(3)),
      negShare: Number((negDocs / matched.length).toFixed(3)),
      neuShare: Number((neuDocs / matched.length).toFixed(3)),
      label: classify(weightedCompound)
    },
    perDoc
  };
}
var ALPHA, EXCL_BOOST, QUESTION_DAMP, ALL_CAPS_INCR;
var init_vader = __esm({
  "api/_lib/ai/nlp/vader.ts"() {
    init_lexicon();
    ALPHA = 15;
    EXCL_BOOST = 0.292;
    QUESTION_DAMP = 0.18;
    ALL_CAPS_INCR = 0.733;
  }
});

// api/_lib/ai/nlp/model.ts
var MODEL;
var init_model = __esm({
  "api/_lib/ai/nlp/model.ts"() {
    MODEL = { "version": "2.0.0", "algorithm": "logistic-regression", "smoothingAlpha": 0, "classes": ["positive", "negative", "neutral"], "classDocCount": { "positive": 1328, "negative": 1328, "neutral": 1328 }, "classTokenCount": { "positive": 0, "negative": 0, "neutral": 0 }, "logPrior": { "positive": -0.7269, "negative": -0.3151, "neutral": 1.0421 }, "logLikelihood": { "$aave": { "positive": 0.0401, "negative": -0.2539, "neutral": 0.2137 }, "$aave buy": { "positive": 0.0427, "negative": -0.0206, "neutral": -0.0221 }, "$ada": { "positive": 0.3471, "negative": -0.1939, "neutral": -0.1532 }, "$ada going": { "positive": 0.2158, "negative": -0.2054, "neutral": -0.0104 }, "$ada huge": { "positive": -0.1229, "negative": 0.2387, "neutral": -0.1158 }, "$aero": { "positive": -0.0728, "negative": 0.3692, "neutral": -0.2964 }, "$aioz": { "positive": -0.1225, "negative": 0.4638, "neutral": -0.3414 }, "$akt": { "positive": 0.3201, "negative": -0.1102, "neutral": -0.2099 }, "$algo": { "positive": 0.3404, "negative": 0.1549, "neutral": -0.4953 }, "$algo $btc": { "positive": 0.1111, "negative": -0.0574, "neutral": -0.0537 }, "$algo $fil": { "positive": 0.0699, "negative": -0.0157, "neutral": -0.0542 }, "$algo $hbar": { "positive": 0.1147, "negative": -0.0399, "neutral": -0.0747 }, "$algo $xrp": { "positive": 0.0901, "negative": -0.0219, "neutral": -0.0682 }, "$algo nice": { "positive": 0.0404, "negative": -0.0205, "neutral": -0.02 }, "$amp": { "positive": -0.0934, "negative": -0.0487, "neutral": 0.1421 }, "$apt": { "positive": 0.8206, "negative": -0.6695, "neutral": -0.1512 }, "$apt here": { "positive": 0.1767, "negative": -0.0215, "neutral": -0.1552 }, "$apt nice": { "positive": 0.0543, "negative": -0.0336, "neutral": -0.0207 }, "$apt target": { "positive": 0.0231, "negative": -0.2635, "neutral": 0.2403 }, "$arb": { "positive": 0.1503, "negative": 0.0604, "neutral": -0.2107 }, "$arb $op": { "positive": -24e-4, "negative": 0.1267, "neutral": -0.1243 }, "$atom": { "positive": 0.3161, "negative": -0.1386, "neutral": -0.1775 }, "$atom re": { "positive": -0.2307, "negative": -0.0518, "neutral": 0.2826 }, "$avax": { "positive": 0.4074, "negative": -0.3234, "neutral": -0.0839 }, "$avax fuckamoley": { "positive": -0.0153, "negative": 0.0385, "neutral": -0.0232 }, "$avax fucking": { "positive": -0.039, "negative": 0.0917, "neutral": -0.0527 }, "$avax just": { "positive": -0.057, "negative": -0.1191, "neutral": 0.176 }, "$avax trending": { "positive": 0.3306, "negative": -0.0276, "neutral": -0.303 }, "$avt": { "positive": 0.7137, "negative": -0.2839, "neutral": -0.4298 }, "$bch": { "positive": 0.2663, "negative": 0.0214, "neutral": -0.2878 }, "$bch $spermwha": { "positive": 0.2559, "negative": -0.0815, "neutral": -0.1744 }, "$bch nice": { "positive": 0.0965, "negative": -0.0309, "neutral": -0.0656 }, "$bch time": { "positive": -0.4253, "negative": 0.2993, "neutral": 0.126 }, "$bera": { "positive": 0.1101, "negative": -0.1334, "neutral": 0.0234 }, "$bmnr": { "positive": -0.0879, "negative": 0.3461, "neutral": -0.2582 }, "$bnb": { "positive": 0.3162, "negative": -0.4699, "neutral": 0.1537 }, "$bnb $btc": { "positive": 0.0547, "negative": -0.0211, "neutral": -0.0336 }, "$bnb $hbar": { "positive": 0.0202, "negative": -0.0104, "neutral": -98e-4 }, "$bnb $uni": { "positive": -0.0441, "negative": 0.195, "neutral": -0.1509 }, "$bnb nice": { "positive": 0.071, "negative": -0.0183, "neutral": -0.0527 }, "$bonk": { "positive": 0.083, "negative": -78e-4, "neutral": -0.0752 }, "$btc": { "positive": 0.2659, "negative": 0.2505, "neutral": -0.5164 }, "$btc $bnb": { "positive": 0.1466, "negative": 0.093, "neutral": -0.2397 }, "$btc $doge": { "positive": -0.1022, "negative": 0.2143, "neutral": -0.112 }, "$btc $etc": { "positive": -0.0674, "negative": 0.0343, "neutral": 0.0331 }, "$btc $eth": { "positive": -0.2116, "negative": 0.1851, "neutral": 0.0265 }, "$btc $mstr": { "positive": 0.0499, "negative": -0.05, "neutral": 1e-4 }, "$btc $qqq": { "positive": -0.0855, "negative": -0.2013, "neutral": 0.2868 }, "$btc $sol": { "positive": 0.4413, "negative": -0.1675, "neutral": -0.2739 }, "$btc $tia": { "positive": -0.0629, "negative": -0.0445, "neutral": 0.1074 }, "$btc $xrp": { "positive": -0.3169, "negative": -0.2128, "neutral": 0.5297 }, "$btc all": { "positive": -0.1331, "negative": -0.1067, "neutral": 0.2397 }, "$btc breaking": { "positive": 0.0325, "negative": -0.0168, "neutral": -0.0157 }, "$btc buy": { "positive": -0.0452, "negative": -0.049, "neutral": 0.0942 }, "$btc crashes": { "positive": -0.0262, "negative": 0.0495, "neutral": -0.0233 }, "$btc dominance": { "positive": 0.0347, "negative": -0.1407, "neutral": 0.106 }, "$btc getting": { "positive": -0.0136, "negative": 0.0238, "neutral": -0.0102 }, "$btc here": { "positive": 22e-4, "negative": -0.0759, "neutral": 0.0737 }, "$btc just": { "positive": 62e-4, "negative": -0.1877, "neutral": 0.1814 }, "$btc like": { "positive": 0.055, "negative": -0.0319, "neutral": -0.0231 }, "$btc looks": { "positive": 0.1172, "negative": -0.063, "neutral": -0.0542 }, "$btc momentum": { "positive": 0.0237, "negative": -0.0105, "neutral": -0.0132 }, "$btc news": { "positive": -0.0327, "negative": -0.0241, "neutral": 0.0568 }, "$btc next": { "positive": -0.125, "negative": -0.063, "neutral": 0.188 }, "$btc support": { "positive": -0.0149, "negative": 0.0216, "neutral": -67e-4 }, "$btc trading": { "positive": -0.049, "negative": -0.0347, "neutral": 0.0837 }, "$btc volume": { "positive": -0.0424, "negative": 0.101, "neutral": -0.0587 }, "$chip": { "positive": 0.1699, "negative": -0.0548, "neutral": -0.1151 }, "$cock": { "positive": 0.7128, "negative": -0.1869, "neutral": -0.5259 }, "$coin": { "positive": 0.5493, "negative": -0.0934, "neutral": -0.4558 }, "$comp": { "positive": 0.0872, "negative": 0.1959, "neutral": -0.283 }, "$cro": { "positive": 0.2224, "negative": -0.0852, "neutral": -0.1372 }, "$cro $bnb": { "positive": 0.0391, "negative": -0.0244, "neutral": -0.0147 }, "$ctx": { "positive": -0.0626, "negative": -0.0732, "neutral": 0.1358 }, "$cxai": { "positive": 0.3023, "negative": 0.0423, "neutral": -0.3446 }, "$darth": { "positive": -0.3753, "negative": -0.1471, "neutral": 0.5224 }, "$darth fourth": { "positive": -0.1788, "negative": -0.1118, "neutral": 0.2906 }, "$dash": { "positive": 0.1057, "negative": -0.0135, "neutral": -0.0922 }, "$dog": { "positive": 0.0219, "negative": -9e-3, "neutral": -0.013 }, "$doge": { "positive": 0.4999, "negative": -0.19, "neutral": -0.3099 }, "$doge $shib": { "positive": -0.1898, "negative": -0.0754, "neutral": 0.2653 }, "$doge just": { "positive": -0.0566, "negative": 0.3176, "neutral": -0.261 }, "$doge love": { "positive": 0.055, "negative": -0.0204, "neutral": -0.0346 }, "$dot": { "positive": 0.5463, "negative": 0.2537, "neutral": -0.8 }, "$dot trending": { "positive": 0.0297, "negative": -0.0122, "neutral": -0.0175 }, "$dot wow": { "positive": -0.0309, "negative": 0.0484, "neutral": -0.0175 }, "$ena": { "positive": 0.3621, "negative": -0.1254, "neutral": -0.2368 }, "$epic": { "positive": 0.1007, "negative": -0.0174, "neutral": -0.0833 }, "$etc": { "positive": 0.3946, "negative": -0.3467, "neutral": -0.0479 }, "$etc $btc": { "positive": 0.2096, "negative": -0.0929, "neutral": -0.1168 }, "$etc $eth": { "positive": -0.1241, "negative": -0.0709, "neutral": 0.195 }, "$etc nice": { "positive": 0.0703, "negative": -0.0212, "neutral": -0.0491 }, "$eth": { "positive": 0.1909, "negative": -0.0534, "neutral": -0.1375 }, "$eth $ada": { "positive": -0.1575, "negative": 0.2493, "neutral": -0.0918 }, "$eth $bch": { "positive": -0.2987, "negative": -0.1787, "neutral": 0.4774 }, "$eth $btc": { "positive": 0.1168, "negative": 0.1507, "neutral": -0.2675 }, "$eth $dog": { "positive": 0.0219, "negative": -9e-3, "neutral": -0.013 }, "$eth $doge": { "positive": 0.169, "negative": -0.1367, "neutral": -0.0323 }, "$eth $etc": { "positive": 0.1768, "negative": -0.0595, "neutral": -0.1173 }, "$eth $hood": { "positive": -0.3087, "negative": -0.1844, "neutral": 0.4931 }, "$eth $sol": { "positive": 0.0389, "negative": 0.2434, "neutral": -0.2824 }, "$eth $tia": { "positive": 0.2331, "negative": -0.0447, "neutral": -0.1884 }, "$eth $uni": { "positive": 0.3079, "negative": -0.0672, "neutral": -0.2407 }, "$eth $xrp": { "positive": 0.0204, "negative": 0.0939, "neutral": -0.1143 }, "$eth buy": { "positive": -0.0663, "negative": 0.0104, "neutral": 0.0559 }, "$eth chart": { "positive": -73e-4, "negative": 0.0249, "neutral": -0.0176 }, "$eth crashes": { "positive": -0.0498, "negative": 0.1082, "neutral": -0.0584 }, "$eth getting": { "positive": -0.0231, "negative": 0.0393, "neutral": -0.0162 }, "$eth here": { "positive": -59e-4, "negative": -0.0463, "neutral": 0.0522 }, "$eth hits": { "positive": -0.1967, "negative": -0.1368, "neutral": 0.3335 }, "$eth momentum": { "positive": 0.033, "negative": -0.01, "neutral": -0.023 }, "$eth news": { "positive": -0.0408, "negative": -0.0228, "neutral": 0.0636 }, "$eth trading": { "positive": -0.0397, "negative": -0.0235, "neutral": 0.0632 }, "$eth volume": { "positive": 0.0203, "negative": 59e-4, "neutral": -0.0262 }, "$fartcoin": { "positive": 0.0539, "negative": -85e-4, "neutral": -0.0454 }, "$fet": { "positive": 0.0238, "negative": -0.0425, "neutral": 0.0186 }, "$fet $render": { "positive": -0.251, "negative": 0.0128, "neutral": 0.2382 }, "$fida": { "positive": 0.0446, "negative": -0.1124, "neutral": 0.0678 }, "$fil": { "positive": 0.7759, "negative": -0.576, "neutral": -0.1999 }, "$fil nice": { "positive": 0.024, "negative": -63e-4, "neutral": -0.0176 }, "$fil scooped": { "positive": -0.2383, "negative": 0.2569, "neutral": -0.0186 }, "$fil storage": { "positive": 0.0568, "negative": -0.0105, "neutral": -0.0463 }, "$ftm": { "positive": 0.3362, "negative": -0.1876, "neutral": -0.1485 }, "$glnk": { "positive": 0.3354, "negative": -0.0955, "neutral": -0.2399 }, "$grass": { "positive": 0.0753, "negative": -0.0429, "neutral": -0.0324 }, "$grt": { "positive": 0.0558, "negative": -0.0928, "neutral": 0.037 }, "$gwei": { "positive": -0.179, "negative": -0.0803, "neutral": 0.2593 }, "$hbar": { "positive": 0.1402, "negative": 0.025, "neutral": -0.1652 }, "$hbar $avax": { "positive": 0.0882, "negative": -0.0454, "neutral": -0.0429 }, "$hnt": { "positive": 0.2134, "negative": -0.1758, "neutral": -0.0376 }, "$hnt $algo": { "positive": -0.1192, "negative": -0.0338, "neutral": 0.153 }, "$hood": { "positive": -0.1471, "negative": -0.216, "neutral": 0.3631 }, "$hype": { "positive": 0.1428, "negative": -0.2387, "neutral": 0.0959 }, "$icp": { "positive": 0.1346, "negative": -0.3033, "neutral": 0.1687 }, "$inj": { "positive": 0.5394, "negative": -0.3568, "neutral": -0.1826 }, "$inj $nonja": { "positive": -0.103, "negative": -0.1472, "neutral": 0.2503 }, "$inj goes": { "positive": 41e-4, "negative": -0.0735, "neutral": 0.0694 }, "$inj literally": { "positive": 0.0496, "negative": -97e-4, "neutral": -0.0398 }, "$inj moves": { "positive": -0.1713, "negative": -67e-4, "neutral": 0.178 }, "$inj nice": { "positive": 0.0843, "negative": -0.0232, "neutral": -0.0611 }, "$inj pumping": { "positive": 0.1242, "negative": -0.0101, "neutral": -0.1141 }, "$iren": { "positive": 0.1422, "negative": -8e-3, "neutral": -0.1342 }, "$jasmy": { "positive": 0.1559, "negative": -0.0361, "neutral": -0.1198 }, "$jup": { "positive": 0.0529, "negative": -0.0178, "neutral": -0.0351 }, "$jyai": { "positive": 0.377, "negative": 0.0819, "neutral": -0.4589 }, "$kaio": { "positive": 0.0566, "negative": -0.0354, "neutral": -0.0213 }, "$kta": { "positive": 0.065, "negative": 0.2287, "neutral": -0.2937 }, "$link": { "positive": 0.3199, "negative": -0.2002, "neutral": -0.1198 }, "$link $xrp": { "positive": 0.2171, "negative": -0.098, "neutral": -0.1191 }, "$ltc": { "positive": 0.6967, "negative": -0.6273, "neutral": -0.0695 }, "$ltc new": { "positive": 0.1091, "negative": -0.0935, "neutral": -0.0155 }, "$ltc ready": { "positive": 0.1512, "negative": -0.0221, "neutral": -0.1291 }, "$lunc": { "positive": 0.1749, "negative": -0.0929, "neutral": -0.082 }, "$lunc wluna": { "positive": 0.031, "negative": -0.0137, "neutral": -0.0173 }, "$matic": { "positive": 0.041, "negative": -0.1071, "neutral": 0.0661 }, "$maulcoin": { "positive": 0.3845, "negative": -0.2244, "neutral": -0.1601 }, "$mram": { "positive": 0.0731, "negative": -0.0308, "neutral": -0.0423 }, "$mstr": { "positive": 0.1402, "negative": 0.0472, "neutral": -0.1874 }, "$muln": { "positive": 0.2787, "negative": -0.0628, "neutral": -0.216 }, "$near": { "positive": 0.7368, "negative": -0.6978, "neutral": -0.0389 }, "$near one": { "positive": 0.0872, "negative": -0.0299, "neutral": -0.0574 }, "$near trending": { "positive": 0.2445, "negative": -0.0118, "neutral": -0.2327 }, "$nonja": { "positive": 0.4715, "negative": -0.6164, "neutral": 0.145 }, "$nonja $inj": { "positive": 0.0377, "negative": -0.1156, "neutral": 0.0779 }, "$nonja moves": { "positive": -0.1463, "negative": -93e-4, "neutral": 0.1555 }, "$nonja one": { "positive": 0.0547, "negative": -0.0573, "neutral": 26e-4 }, "$nonja pumping": { "positive": 0.0434, "negative": -52e-4, "neutral": -0.0382 }, "$nonja starting": { "positive": 0.0588, "negative": -0.0233, "neutral": -0.0355 }, "$nvda": { "positive": -64e-4, "negative": 0.1241, "neutral": -0.1177 }, "$ondo": { "positive": 0.3431, "negative": -0.1051, "neutral": -0.238 }, "$ondo $near": { "positive": 0.1796, "negative": -0.159, "neutral": -0.0206 }, "$op": { "positive": 0.591, "negative": -0.2881, "neutral": -0.303 }, "$op $arb": { "positive": 0.2471, "negative": -0.0496, "neutral": -0.1974 }, "$op $hnt": { "positive": -0.1192, "negative": -0.0338, "neutral": 0.153 }, "$papl": { "positive": 0.0858, "negative": -0.0153, "neutral": -0.0705 }, "$paw": { "positive": 0.3743, "negative": -0.2012, "neutral": -0.173 }, "$pengu": { "positive": 0.2734, "negative": -0.0756, "neutral": -0.1978 }, "$pepe": { "positive": 0.3425, "negative": -0.3373, "neutral": -52e-4 }, "$pepe $btc": { "positive": -0.1348, "negative": -0.0503, "neutral": 0.1851 }, "$pepe ayyy": { "positive": -0.1047, "negative": -0.0383, "neutral": 0.143 }, "$pepe cd": { "positive": 0.0861, "negative": -0.0314, "neutral": -0.0546 }, "$pepe make": { "positive": 0.0671, "negative": -0.0199, "neutral": -0.0472 }, "$pol": { "positive": 0.143, "negative": -0.1385, "neutral": -45e-4 }, "$pol $matic": { "positive": 0.143, "negative": -0.1385, "neutral": -45e-4 }, "$prime": { "positive": -0.1732, "negative": -0.1093, "neutral": 0.2824 }, "$pump": { "positive": 0.7918, "negative": -0.1644, "neutral": -0.6273 }, "$pypl": { "positive": 0.4594, "negative": -0.1388, "neutral": -0.3206 }, "$qqq": { "positive": -0.0914, "negative": -0.133, "neutral": 0.2244 }, "$qqq $spy": { "positive": -0.1297, "negative": -0.036, "neutral": 0.1656 }, "$rari": { "positive": 0.0946, "negative": -0.0454, "neutral": -0.0492 }, "$rave": { "positive": -0.0253, "negative": -0.3259, "neutral": 0.3513 }, "$render": { "positive": 0.8814, "negative": -0.4503, "neutral": -0.4311 }, "$render great": { "positive": 0.0448, "negative": -85e-4, "neutral": -0.0362 }, "$retire": { "positive": 0.2377, "negative": -0.0631, "neutral": -0.1745 }, "$rls": { "positive": 0.2416, "negative": 0.0505, "neutral": -0.2921 }, "$roam": { "positive": 0.3029, "negative": -0.1081, "neutral": -0.1948 }, "$rose": { "positive": 0.253, "negative": -0.0754, "neutral": -0.1776 }, "$shib": { "positive": 0.1324, "negative": 0.0168, "neutral": -0.1493 }, "$shib $pepe": { "positive": -66e-4, "negative": -0.0739, "neutral": 0.0805 }, "$shib $uni": { "positive": 0.0394, "negative": -0.0152, "neutral": -0.0243 }, "$shib gm": { "positive": 0.035, "negative": -0.0146, "neutral": -0.0205 }, "$shib long": { "positive": 0.055, "negative": -0.0211, "neutral": -0.0339 }, "$sol": { "positive": 0.4062, "negative": -0.0358, "neutral": -0.3704 }, "$sol $bnb": { "positive": 0.1122, "negative": -0.0663, "neutral": -0.0459 }, "$sol $btc": { "positive": -0.205, "negative": 0.256, "neutral": -0.051 }, "$sol $tia": { "positive": 0.1777, "negative": -0.0888, "neutral": -0.0889 }, "$sol $updog": { "positive": -0.1531, "negative": 0.1556, "neutral": -24e-4 }, "$sol $xrp": { "positive": 0.0888, "negative": 0.049, "neutral": -0.1378 }, "$sol all": { "positive": -0.0763, "negative": 0.0815, "neutral": -52e-4 }, "$sol breaking": { "positive": 0.0354, "negative": -0.017, "neutral": -0.0184 }, "$sol buy": { "positive": -0.1096, "negative": 0.0403, "neutral": 0.0693 }, "$sol chart": { "positive": -0.0292, "negative": 0.0567, "neutral": -0.0275 }, "$sol getting": { "positive": -95e-4, "negative": 0.0253, "neutral": -0.0158 }, "$sol news": { "positive": -0.0672, "negative": -0.0304, "neutral": 0.0976 }, "$sol sol": { "positive": -0.0582, "negative": 0.1224, "neutral": -0.0643 }, "$sol trading": { "positive": -0.0494, "negative": -0.0239, "neutral": 0.0734 }, "$sol updog": { "positive": -0.2215, "negative": -0.0391, "neutral": 0.2606 }, "$spermwha": { "positive": 0.2594, "negative": -0.0839, "neutral": -0.1755 }, "$spermwha le": { "positive": 0.2594, "negative": -0.0839, "neutral": -0.1755 }, "$spy": { "positive": -0.3507, "negative": 0.2987, "neutral": 0.052 }, "$spy $qqq": { "positive": 0.0502, "negative": -0.1612, "neutral": 0.111 }, "$strk": { "positive": 0.1321, "negative": 0.2196, "neutral": -0.3517 }, "$sui": { "positive": 0.5032, "negative": -0.039, "neutral": -0.4642 }, "$sui $sui": { "positive": -0.2724, "negative": -0.1453, "neutral": 0.4177 }, "$sui just": { "positive": -0.1435, "negative": 0.3272, "neutral": -0.1837 }, "$sui love": { "positive": 0.1143, "negative": -0.0637, "neutral": -0.0506 }, "$sui sui": { "positive": -0.0971, "negative": 0.244, "neutral": -0.1469 }, "$sui trending": { "positive": 86e-4, "negative": 0.0415, "neutral": -0.0502 }, "$tao": { "positive": 0.1048, "negative": -0.1322, "neutral": 0.0274 }, "$tao $render": { "positive": 0.1159, "negative": -0.0265, "neutral": -0.0894 }, "$tel": { "positive": 0.1975, "negative": -0.0348, "neutral": -0.1627 }, "$tia": { "positive": 0.3205, "negative": -0.352, "neutral": 0.0315 }, "$tia $atom": { "positive": 0.0894, "negative": -0.023, "neutral": -0.0663 }, "$tia $op": { "positive": -0.1192, "negative": -0.0338, "neutral": 0.153 }, "$tia celestia": { "positive": 0.0876, "negative": -0.0661, "neutral": -0.0215 }, "$toshi": { "positive": 0.0135, "negative": -0.157, "neutral": 0.1435 }, "$troll": { "positive": 0.0369, "negative": -0.0956, "neutral": 0.0587 }, "$trx": { "positive": 0.136, "negative": -0.0262, "neutral": -0.1098 }, "$trx $usdt": { "positive": 0.136, "negative": -0.0262, "neutral": -0.1098 }, "$tsla": { "positive": 0.2539, "negative": 0.114, "neutral": -0.3679 }, "$uni": { "positive": 0.1219, "negative": -0.3236, "neutral": 0.2017 }, "$uni $btc": { "positive": 0.0913, "negative": -0.1822, "neutral": 0.0909 }, "$uni $pepe": { "positive": 0.0861, "negative": -0.0314, "neutral": -0.0546 }, "$updog": { "positive": 1.3082, "negative": -0.674, "neutral": -0.6342 }, "$updog $avax": { "positive": 0.0358, "negative": -75e-4, "neutral": -0.0283 }, "$updog $bnb": { "positive": -0.3352, "negative": -0.0182, "neutral": 0.3534 }, "$updog $etc": { "positive": -0.3351, "negative": -0.0401, "neutral": 0.3752 }, "$updog congrats": { "positive": 0.0844, "negative": -0.0974, "neutral": 0.0131 }, "$updog let": { "positive": 0.3116, "negative": -0.0225, "neutral": -0.2892 }, "$usdt": { "positive": 0.1293, "negative": -45e-4, "neutral": -0.1249 }, "$veil": { "positive": -0.1531, "negative": -0.0895, "neutral": 0.2427 }, "$wif": { "positive": 0.5404, "negative": -0.0847, "neutral": -0.4556 }, "$wif another": { "positive": -0.0356, "negative": 0.0656, "neutral": -0.03 }, "$wif down": { "positive": -0.0418, "negative": 0.0847, "neutral": -0.0429 }, "$wif fuck": { "positive": -0.1028, "negative": 0.2618, "neutral": -0.159 }, "$wif here": { "positive": 0.2038, "negative": -0.1555, "neutral": -0.0482 }, "$wif ing": { "positive": -0.0529, "negative": 0.1259, "neutral": -0.073 }, "$wif nice": { "positive": 0.035, "negative": -0.0138, "neutral": -0.0212 }, "$wif trending": { "positive": -0.4081, "negative": -0.0203, "neutral": 0.4285 }, "$wif yep": { "positive": -0.0544, "negative": 0.1711, "neutral": -0.1167 }, "$wld": { "positive": 0.147, "negative": -14e-4, "neutral": -0.1455 }, "$wlfi": { "positive": 0.1005, "negative": -0.0669, "neutral": -0.0336 }, "$xdc": { "positive": -0.03, "negative": 0.0628, "neutral": -0.0328 }, "$xlm": { "positive": 0.4613, "negative": -0.2414, "neutral": -0.2199 }, "$xlm $hbar": { "positive": -0.1491, "negative": 0.161, "neutral": -0.0119 }, "$xlm $xrp": { "positive": -0.1113, "negative": -0.0816, "neutral": 0.1929 }, "$xlm back": { "positive": -0.0444, "negative": -0.1164, "neutral": 0.1608 }, "$xlm here": { "positive": -0.1107, "negative": 0.1894, "neutral": -0.0788 }, "$xlm how": { "positive": 0.3815, "negative": -0.3024, "neutral": -0.079 }, "$xlm well": { "positive": 0.249, "negative": -0.0869, "neutral": -0.1621 }, "$xrp": { "positive": 0.1954, "negative": -0.3237, "neutral": 0.1284 }, "$xrp $ada": { "positive": -74e-4, "negative": 0.1839, "neutral": -0.1765 }, "$xrp $algo": { "positive": 0.2098, "negative": -0.0769, "neutral": -0.1329 }, "$xrp $btc": { "positive": 0.1264, "negative": -0.0351, "neutral": -0.0913 }, "$xrp $fil": { "positive": 0.0901, "negative": -0.0219, "neutral": -0.0682 }, "$xrp $sol": { "positive": 0.0745, "negative": 0.0889, "neutral": -0.1635 }, "$xrp $xlm": { "positive": 0.2815, "negative": -55e-4, "neutral": -0.2761 }, "$xrp god": { "positive": 0.1346, "negative": -0.035, "neutral": -0.0996 }, "$xtz": { "positive": -0.0189, "negative": 0.0931, "neutral": -0.0742 }, "$yfi": { "positive": 0.0317, "negative": -0.0715, "neutral": 0.0398 }, "$zbcn": { "positive": 0.1189, "negative": -0.0489, "neutral": -0.07 }, "$zec": { "positive": 0.1281, "negative": -0.5435, "neutral": 0.4153 }, "$zec $atom": { "positive": 0.2911, "negative": -0.048, "neutral": -0.2432 }, "$zk": { "positive": 0.2751, "negative": 74e-4, "neutral": -0.2826 }, "'cz'": { "positive": -0.0153, "negative": 0.1092, "neutral": -0.0939 }, "'s": { "positive": -0.0285, "negative": -0.0369, "neutral": 0.0655 }, "aave": { "positive": 0.1941, "negative": 0.0138, "neutral": -0.2078 }, "aax": { "positive": -0.0516, "negative": -0.0241, "neutral": 0.0757 }, "aax crypto": { "positive": -0.0323, "negative": -0.2114, "neutral": 0.2437 }, "aax suspends": { "positive": -0.0106, "negative": 0.0677, "neutral": -0.0571 }, "absolute": { "positive": 0.1616, "negative": -0.011, "neutral": -0.1506 }, "absolutely": { "positive": -0.117, "negative": 0.3641, "neutral": -0.2472 }, "absolutely trash": { "positive": -0.0357, "negative": 0.1971, "neutral": -0.1613 }, "abuse": { "positive": -0.0506, "negative": -0.0801, "neutral": 0.1307 }, "academic": { "positive": -0.0797, "negative": -0.1224, "neutral": 0.2021 }, "accelerate": { "positive": -0.1131, "negative": 0.1857, "neutral": -0.0726 }, "accelerates": { "positive": 0.0568, "negative": 0.0553, "neutral": -0.1121 }, "accept": { "positive": 0.3046, "negative": -0.2749, "neutral": -0.0297 }, "accept bitcoin": { "positive": 0.3621, "negative": -0.2893, "neutral": -0.0728 }, "accepting": { "positive": -0.115, "negative": -0.1632, "neutral": 0.2782 }, "accepting bitcoin": { "positive": -0.115, "negative": -0.1632, "neutral": 0.2782 }, "accepts": { "positive": -0.1553, "negative": -0.167, "neutral": 0.3224 }, "accepts bitcoin": { "positive": -0.1553, "negative": -0.167, "neutral": 0.3224 }, "access": { "positive": -0.0609, "negative": -0.0365, "neutral": 0.0974 }, "according": { "positive": -0.0341, "negative": 0.0315, "neutral": 25e-4 }, "account": { "positive": -0.0224, "negative": 0.0879, "neutral": -0.0655 }, "account hacked": { "positive": -0.1376, "negative": 0.2482, "neutral": -0.1106 }, "accounting": { "positive": -0.0863, "negative": -0.116, "neutral": 0.2022 }, "accounts": { "positive": -0.226, "negative": 0.1299, "neutral": 0.0961 }, "accumulate": { "positive": 0.7456, "negative": -0.1571, "neutral": -0.5885 }, "accumulated": { "positive": 0.4127, "negative": -0.0958, "neutral": -0.3169 }, "accumulating": { "positive": 1.5525, "negative": -0.5908, "neutral": -0.9617 }, "accumulating $btc": { "positive": 0.0237, "negative": -0.0105, "neutral": -0.0132 }, "accumulating $eth": { "positive": 0.0319, "negative": -0.0115, "neutral": -0.0204 }, "accumulating altcoins": { "positive": 0.0463, "negative": -0.0127, "neutral": -0.0336 }, "accumulating avax": { "positive": 0.0325, "negative": -72e-4, "neutral": -0.0254 }, "accumulating btc": { "positive": 0.0277, "negative": -75e-4, "neutral": -0.0202 }, "accumulating doge": { "positive": 0.0586, "negative": -0.0136, "neutral": -0.045 }, "accumulating eth": { "positive": 0.0304, "negative": -0.0106, "neutral": -0.0198 }, "accumulating market": { "positive": 0.0227, "negative": -76e-4, "neutral": -0.0151 }, "accumulating ripple": { "positive": 0.048, "negative": -0.0102, "neutral": -0.0378 }, "accumulating solana": { "positive": 0.0416, "negative": -0.0119, "neutral": -0.0298 }, "accumulating xrp": { "positive": 0.042, "negative": -92e-4, "neutral": -0.0329 }, "accumulation": { "positive": 1.0956, "negative": -0.4527, "neutral": -0.643 }, "accumulation phase": { "positive": 0.2353, "negative": -0.0474, "neutral": -0.1879 }, "accurate": { "positive": -0.1103, "negative": -0.2737, "neutral": 0.384 }, "accused": { "positive": -0.0484, "negative": 0.1435, "neutral": -0.0951 }, "acquire": { "positive": -0.0629, "negative": -0.1584, "neutral": 0.2213 }, "acquire rival": { "positive": -65e-4, "negative": -0.1467, "neutral": 0.1532 }, "acquires": { "positive": -0.1051, "negative": -0.4115, "neutral": 0.5166 }, "acquisition": { "positive": -0.0394, "negative": -0.1382, "neutral": 0.1777 }, "across": { "positive": -0.1757, "negative": 0.1195, "neutral": 0.0562 }, "act": { "positive": -0.1864, "negative": -0.1335, "neutral": 0.3198 }, "action": { "positive": -0.0967, "negative": 0.3521, "neutral": -0.2554 }, "active": { "positive": 0.298, "negative": 0.075, "neutral": -0.3729 }, "activity": { "positive": 0.6335, "negative": -0.2046, "neutral": -0.429 }, "actor": { "positive": -0.0287, "negative": 0.088, "neutral": -0.0592 }, "actual": { "positive": -0.1378, "negative": 0.2251, "neutral": -0.0873 }, "actual fuck": { "positive": -0.1378, "negative": 0.2251, "neutral": -0.0873 }, "actually": { "positive": 0.277, "negative": -0.2585, "neutral": -0.0186 }, "ad": { "positive": -0.1363, "negative": -0.0466, "neutral": 0.183 }, "ada": { "positive": -0.0363, "negative": -0.0118, "neutral": 0.0481 }, "ada all": { "positive": -0.0408, "negative": 0.0578, "neutral": -0.0169 }, "ada breaking": { "positive": 0.0518, "negative": -0.0257, "neutral": -0.0262 }, "ada buy": { "positive": -0.0469, "negative": 0.0891, "neutral": -0.0422 }, "ada crashes": { "positive": -0.0215, "negative": 0.046, "neutral": -0.0245 }, "ada getting": { "positive": -0.0269, "negative": 0.0723, "neutral": -0.0455 }, "ada news": { "positive": -0.0261, "negative": -0.0181, "neutral": 0.0441 }, "ada trading": { "positive": -0.0145, "negative": -0.0107, "neutral": 0.0252 }, "ada trend": { "positive": -0.0114, "negative": 0.0488, "neutral": -0.0374 }, "ada volume": { "positive": -78e-4, "negative": 0.0204, "neutral": -0.0126 }, "ada weak": { "positive": -0.0154, "negative": 0.0206, "neutral": -52e-4 }, "add": { "positive": 0.0538, "negative": -0.087, "neutral": 0.0332 }, "added": { "positive": -0.4295, "negative": 83e-4, "neutral": 0.4212 }, "added more": { "positive": 0.1391, "negative": 0.0705, "neutral": -0.2096 }, "adding": { "positive": 0.378, "negative": -0.1078, "neutral": -0.2702 }, "addresses": { "positive": -0.1171, "negative": 0.0264, "neutral": 0.0907 }, "adds": { "positive": 0.0177, "negative": -0.1603, "neutral": 0.1425 }, "administration": { "positive": -0.0133, "negative": -0.1712, "neutral": 0.1845 }, "admits": { "positive": 0.1092, "negative": -0.122, "neutral": 0.0128 }, "admits stablecoin": { "positive": 0.115, "negative": -0.1404, "neutral": 0.0254 }, "adopt": { "positive": -0.3017, "negative": 0.0201, "neutral": 0.2816 }, "adoption": { "positive": 2.1135, "negative": -0.8564, "neutral": -1.2571 }, "adoption hit": { "positive": 0.0905, "negative": -0.0296, "neutral": -0.0609 }, "adoption metrics": { "positive": 0.0731, "negative": -0.0462, "neutral": -0.0269 }, "ads": { "positive": -0.0538, "negative": -0.0714, "neutral": 0.1252 }, "advertising": { "positive": -0.0339, "negative": -0.0951, "neutral": 0.129 }, "advice": { "positive": -0.0712, "negative": 0.4831, "neutral": -0.4118 }, "advisor": { "positive": -0.2049, "negative": -0.139, "neutral": 0.344 }, "af": { "positive": 0.0976, "negative": -0.0403, "neutral": -0.0573 }, "af cd": { "positive": 0.0861, "negative": -0.0314, "neutral": -0.0546 }, "affected": { "positive": -0.1709, "negative": -0.0411, "neutral": 0.212 }, "afford": { "positive": 0.0223, "negative": -0.0127, "neutral": -97e-4 }, "afkcdbxdsaymexo": { "positive": -0.0801, "negative": -0.0587, "neutral": 0.1388 }, "afkcdbxdsaymexo vsfvprv": { "positive": -0.0801, "negative": -0.0587, "neutral": 0.1388 }, "africa": { "positive": 0.3047, "negative": -0.248, "neutral": -0.0567 }, "african": { "positive": -0.1714, "negative": 0.0109, "neutral": 0.1604 }, "ag": { "positive": -0.0314, "negative": -0.0105, "neutral": 0.0418 }, "again": { "positive": 0.0747, "negative": -0.143, "neutral": 0.0684 }, "age": { "positive": -0.0533, "negative": -0.2355, "neutral": 0.2888 }, "agent": { "positive": -0.0143, "negative": -0.1276, "neutral": 0.1419 }, "agentic": { "positive": 0.2403, "negative": -0.1602, "neutral": -0.0801 }, "agents": { "positive": -0.1672, "negative": -0.1459, "neutral": 0.3131 }, "aggregator": { "positive": 0.3218, "negative": -0.0485, "neutral": -0.2733 }, "ago": { "positive": 0.0382, "negative": 0.157, "neutral": -0.1953 }, "agree": { "positive": 0.0711, "negative": -0.0156, "neutral": -0.0555 }, "agreed": { "positive": 0.0349, "negative": 0.2165, "neutral": -0.2513 }, "agrees": { "positive": 0.1612, "negative": -0.1285, "neutral": -0.0327 }, "ahead": { "positive": -0.0148, "negative": -0.1248, "neutral": 0.1396 }, "ai": { "positive": -0.0454, "negative": 0.0481, "neutral": -27e-4 }, "ai agent": { "positive": 0.0368, "negative": -0.0937, "neutral": 0.0569 }, "ai agentic": { "positive": 0.3118, "negative": -0.1034, "neutral": -0.2084 }, "ai agents": { "positive": 0.0753, "negative": -81e-4, "neutral": -0.0672 }, "ai chatbots": { "positive": -0.0914, "negative": -0.0972, "neutral": 0.1886 }, "ai generated": { "positive": -0.1518, "negative": 0.1951, "neutral": -0.0433 }, "ai infrastructure": { "positive": 0.0412, "negative": -0.0214, "neutral": -0.0198 }, "ai powered": { "positive": -0.0791, "negative": -0.0434, "neutral": 0.1225 }, "ai runtime": { "positive": -0.058, "negative": -0.0651, "neutral": 0.1232 }, "ai stocks": { "positive": -0.093, "negative": 0.1622, "neutral": -0.0692 }, "aih": { "positive": 0.2497, "negative": -0.0442, "neutral": -0.2055 }, "aih mn": { "positive": 0.2497, "negative": -0.0442, "neutral": -0.2055 }, "aim": { "positive": 0.2222, "negative": -0.0597, "neutral": -0.1626 }, "aims": { "positive": -0.1385, "negative": 0.0719, "neutral": 0.0666 }, "ain't": { "positive": -0.1086, "negative": 0.2728, "neutral": -0.1642 }, "air": { "positive": -0.0989, "negative": -0.0877, "neutral": 0.1866 }, "alert": { "positive": 0.0394, "negative": 8e-3, "neutral": -0.0474 }, "alert multiple": { "positive": 0.0537, "negative": -0.0413, "neutral": -0.0125 }, "alert top": { "positive": 0.031, "negative": -0.0137, "neutral": -0.0173 }, "algorithm": { "positive": 0.0488, "negative": -0.2364, "neutral": 0.1877 }, "algorithms": { "positive": -0.0279, "negative": -0.0777, "neutral": 0.1056 }, "alive": { "positive": -0.1075, "negative": -0.1052, "neutral": 0.2127 }, "all": { "positive": -0.2981, "negative": 0.5114, "neutral": -0.2132 }, "all afford": { "positive": 0.0223, "negative": -0.0127, "neutral": -97e-4 }, "all chart": { "positive": -0.1273, "negative": 0.1677, "neutral": -0.0403 }, "all crypto": { "positive": -0.1491, "negative": 0.1967, "neutral": -0.0476 }, "all day": { "positive": 0.0243, "negative": 0.0428, "neutral": -0.067 }, "all digital": { "positive": -0.102, "negative": 0.0178, "neutral": 0.0843 }, "all fundamentals": { "positive": -0.1516, "negative": 0.1931, "neutral": -0.0415 }, "all looks": { "positive": -0.342, "negative": 0.3561, "neutral": -0.0142 }, "all money": { "positive": -0.1192, "negative": 0.2382, "neutral": -0.119 }, "all need": { "positive": -0.1339, "negative": 0.1808, "neutral": -0.0468 }, "all over": { "positive": 0.3907, "negative": -0.0795, "neutral": -0.3112 }, "all roads": { "positive": -0.0891, "negative": -0.011, "neutral": 0.1002 }, "all shit": { "positive": -0.0521, "negative": 0.055, "neutral": -29e-4 }, "all support": { "positive": -0.101, "negative": 0.1117, "neutral": -0.0106 }, "all think": { "positive": -0.3605, "negative": -0.4351, "neutral": 0.7956 }, "all time": { "positive": 0.0746, "negative": -0.2053, "neutral": 0.1307 }, "all trend": { "positive": -0.1092, "negative": 0.1737, "neutral": -0.0646 }, "all volume": { "positive": -0.0824, "negative": 0.1115, "neutral": -0.0291 }, "all week": { "positive": 0.1424, "negative": -0.1076, "neutral": -0.0348 }, "allegations": { "positive": -0.0228, "negative": 0.2207, "neutral": -0.1979 }, "alleged": { "positive": -0.0634, "negative": 0.2395, "neutral": -0.1761 }, "allegedly": { "positive": -0.0823, "negative": -0.1383, "neutral": 0.2206 }, "allow": { "positive": -0.1384, "negative": -0.1456, "neutral": 0.284 }, "allowed": { "positive": -0.0893, "negative": 0.3017, "neutral": -0.2123 }, "allows": { "positive": -0.0924, "negative": 0.063, "neutral": 0.0293 }, "alloy": { "positive": -0.0877, "negative": 0.0674, "neutral": 0.0202 }, "almost": { "positive": 0.241, "negative": 0.0972, "neutral": -0.3382 }, "almost every": { "positive": -0.082, "negative": 0.2525, "neutral": -0.1705 }, "along": { "positive": -0.1767, "negative": 0.2116, "neutral": -0.0349 }, "alpha": { "positive": -0.0746, "negative": 0.1319, "neutral": -0.0573 }, "already": { "positive": 0.1416, "negative": -0.1388, "neutral": -28e-4 }, "already ing": { "positive": -0.026, "negative": 0.0417, "neutral": -0.0157 }, "alright": { "positive": 0.1717, "negative": -0.031, "neutral": -0.1407 }, "also": { "positive": 0.2141, "negative": -0.1855, "neutral": -0.0286 }, "alt": { "positive": 0.624, "negative": -0.1453, "neutral": -0.4788 }, "alt coin": { "positive": 0.4008, "negative": -0.1558, "neutral": -0.245 }, "alt coins": { "positive": 0.0378, "negative": -0.0315, "neutral": -63e-4 }, "alt season": { "positive": 0.169, "negative": 1e-4, "neutral": -0.1691 }, "altcoin": { "positive": -0.3543, "negative": -0.1387, "neutral": 0.493 }, "altcoin exchange": { "positive": -0.1164, "negative": 0.1578, "neutral": -0.0414 }, "altcoins": { "positive": -0.0704, "negative": 0.1173, "neutral": -0.0468 }, "altcoins all": { "positive": -0.0612, "negative": 0.0787, "neutral": -0.0175 }, "altcoins buy": { "positive": -0.0646, "negative": 0.0357, "neutral": 0.0288 }, "altcoins chart": { "positive": -51e-4, "negative": 0.0228, "neutral": -0.0177 }, "altcoins crashes": { "positive": -0.03, "negative": 0.1287, "neutral": -0.0987 }, "altcoins getting": { "positive": -0.0115, "negative": 0.0415, "neutral": -0.03 }, "altcoins here": { "positive": 0.0463, "negative": -0.0127, "neutral": -0.0336 }, "altcoins news": { "positive": -0.0208, "negative": -0.0181, "neutral": 0.0389 }, "altcoins surges": { "positive": 0.0247, "negative": -87e-4, "neutral": -0.016 }, "altcoins trading": { "positive": -0.0153, "negative": -0.0132, "neutral": 0.0284 }, "altering": { "positive": -0.4188, "negative": -0.0319, "neutral": 0.4507 }, "altering data": { "positive": -0.0936, "negative": -0.1073, "neutral": 0.2009 }, "alternative": { "positive": -0.1228, "negative": -0.1671, "neutral": 0.2899 }, "alts": { "positive": -0.1776, "negative": -0.117, "neutral": 0.2946 }, "altseason": { "positive": -0.0139, "negative": -0.0757, "neutral": 0.0896 }, "always": { "positive": 0.1964, "negative": 0.2053, "neutral": -0.4016 }, "am": { "positive": 0.5813, "negative": -0.5468, "neutral": -0.0345 }, "am building": { "positive": 0.0296, "negative": -92e-4, "neutral": -0.0204 }, "ama": { "positive": -0.1728, "negative": -0.132, "neutral": 0.3048 }, "ama scheduled": { "positive": -0.1199, "negative": -0.0911, "neutral": 0.2109 }, "amazing": { "positive": 1.0224, "negative": -0.475, "neutral": -0.5474 }, "amazon": { "positive": -0.0511, "negative": -0.0364, "neutral": 0.0875 }, "america": { "positive": -0.2181, "negative": 0.1958, "neutral": 0.0223 }, "american": { "positive": -0.2483, "negative": -0.0397, "neutral": 0.288 }, "americans": { "positive": -0.0516, "negative": 0.2976, "neutral": -0.246 }, "amid": { "positive": -0.0732, "negative": -0.1633, "neutral": 0.2365 }, "amid crypto": { "positive": 0.1164, "negative": 0.0271, "neutral": -0.1435 }, "amnesia": { "positive": -0.0976, "negative": 0.0496, "neutral": 0.048 }, "amount": { "positive": -0.1341, "negative": 0.0366, "neutral": 0.0975 }, "analysis": { "positive": 0.3309, "negative": -0.1766, "neutral": -0.1543 }, "analysts": { "positive": 0.2454, "negative": 0.0358, "neutral": -0.2812 }, "analyzing": { "positive": -0.0446, "negative": -0.119, "neutral": 0.1636 }, "anarchist": { "positive": -0.0965, "negative": -0.1726, "neutral": 0.2691 }, "anatomy": { "positive": -0.1139, "negative": -0.1378, "neutral": 0.2517 }, "android": { "positive": -0.1198, "negative": -0.0632, "neutral": 0.1829 }, "angel": { "positive": 0.361, "negative": -0.1118, "neutral": -0.2492 }, "announced": { "positive": 0.1117, "negative": -55e-4, "neutral": -0.1062 }, "announced crackdown": { "positive": -0.0369, "negative": 0.2884, "neutral": -0.2515 }, "announcement": { "positive": 0.4865, "negative": -0.1878, "neutral": -0.2987 }, "announces": { "positive": 0.3031, "negative": -0.1094, "neutral": -0.1937 }, "announces pipe": { "positive": 0.0412, "negative": -0.0214, "neutral": -0.0198 }, "annoying": { "positive": -0.2668, "negative": 0.8537, "neutral": -0.5869 }, "another": { "positive": 0.1466, "negative": 0.6741, "neutral": -0.8208 }, "another day": { "positive": -0.0943, "negative": 0.186, "neutral": -0.0917 }, "another dump": { "positive": -0.1107, "negative": 0.1894, "neutral": -0.0788 }, "another shit": { "positive": 0.1849, "negative": -0.156, "neutral": -0.0289 }, "another weekend": { "positive": -0.0279, "negative": 0.0404, "neutral": -0.0125 }, "any": { "positive": -0.0891, "negative": -77e-4, "neutral": 0.0968 }, "any update": { "positive": -0.1769, "negative": -0.214, "neutral": 0.3909 }, "anymore": { "positive": 0.0351, "negative": 0.041, "neutral": -0.0762 }, "anyone": { "positive": -0.2552, "negative": 0.4929, "neutral": -0.2377 }, "anyone still": { "positive": -0.2149, "negative": 0.2764, "neutral": -0.0616 }, "aomst": { "positive": 0.0951, "negative": -0.0725, "neutral": -0.0226 }, "aomst pxyakyuvwwzt": { "positive": 0.0951, "negative": -0.0725, "neutral": -0.0226 }, "apecoin": { "positive": -0.0565, "negative": -0.0775, "neutral": 0.134 }, "api": { "positive": -0.0992, "negative": -0.0212, "neutral": 0.1204 }, "apis": { "positive": -0.0918, "negative": -0.1782, "neutral": 0.27 }, "app": { "positive": -0.1653, "negative": -0.2299, "neutral": 0.3952 }, "appears": { "positive": -0.1256, "negative": 0.0334, "neutral": 0.0923 }, "appetite": { "positive": 0.079, "negative": -0.1083, "neutral": 0.0293 }, "apple": { "positive": -0.1908, "negative": -53e-4, "neutral": 0.1961 }, "approval": { "positive": 0.9459, "negative": -0.4439, "neutral": -0.502 }, "approval landed": { "positive": 0.1033, "negative": -0.0321, "neutral": -0.0712 }, "approves": { "positive": 0.0615, "negative": -0.0939, "neutral": 0.0324 }, "apps": { "positive": -0.1891, "negative": -0.2337, "neutral": 0.4227 }, "april": { "positive": -0.0403, "negative": -0.1122, "neutral": 0.1525 }, "aptos": { "positive": 0.026, "negative": -0.1011, "neutral": 0.0751 }, "ar": { "positive": -0.0209, "negative": -0.0424, "neutral": 0.0633 }, "arb": { "positive": -0.0829, "negative": -0.092, "neutral": 0.1749 }, "arbitrage": { "positive": 0.2932, "negative": -0.2425, "neutral": -0.0508 }, "arbitrum": { "positive": 0.1056, "negative": -0.1695, "neutral": 0.0639 }, "architecture": { "positive": -0.2807, "negative": -0.0326, "neutral": 0.3132 }, "area": { "positive": 0.097, "negative": -0.0763, "neutral": -0.0207 }, "aren": { "positive": 12e-4, "negative": 0.0775, "neutral": -0.0787 }, "around": { "positive": -0.0857, "negative": -0.3562, "neutral": 0.4419 }, "around even": { "positive": -0.0121, "negative": 0.0264, "neutral": -0.0143 }, "around right": { "positive": -0.5201, "negative": -0.3913, "neutral": 0.9114 }, "arrest": { "positive": -0.0215, "negative": 0.3416, "neutral": -0.3201 }, "arrested": { "positive": -0.225, "negative": 1.1657, "neutral": -0.9408 }, "arrested allegedly": { "positive": -0.0321, "negative": 0.1528, "neutral": -0.1208 }, "arrive": { "positive": 0.1167, "negative": 0.1065, "neutral": -0.2232 }, "arrogant": { "positive": -0.1134, "negative": 0.298, "neutral": -0.1846 }, "art": { "positive": 0.0348, "negative": -0.1179, "neutral": 0.083 }, "artificial": { "positive": 0.0982, "negative": -0.029, "neutral": -0.0693 }, "artificial intelligence": { "positive": 0.0982, "negative": -0.029, "neutral": -0.0693 }, "asia": { "positive": -0.0938, "negative": 0.1864, "neutral": -0.0926 }, "asic": { "positive": -0.1121, "negative": -0.1286, "neutral": 0.2407 }, "asics": { "positive": 0.0344, "negative": -0.1177, "neutral": 0.0833 }, "ask": { "positive": -0.2946, "negative": 0.1658, "neutral": 0.1288 }, "ask hn": { "positive": -0.3136, "negative": 0.0494, "neutral": 0.2643 }, "asked": { "positive": -0.0274, "negative": 0.1338, "neutral": -0.1064 }, "asks": { "positive": 0.0549, "negative": 0.0259, "neutral": -0.0808 }, "ass": { "positive": -0.1404, "negative": 0.2488, "neutral": -0.1084 }, "asset": { "positive": 0.181, "negative": 0.1328, "neutral": -0.3139 }, "assets": { "positive": 0.462, "negative": 0.1586, "neutral": -0.6206 }, "assets blockchain": { "positive": -0.0675, "negative": -0.182, "neutral": 0.2495 }, "assistant": { "positive": -0.0419, "negative": -0.0424, "neutral": 0.0843 }, "asteroid's": { "positive": -0.0477, "negative": -0.0864, "neutral": 0.1342 }, "ath": { "positive": 1.1854, "negative": -0.3339, "neutral": -0.8515 }, "atl": { "positive": -0.1419, "negative": 0.2736, "neutral": -0.1317 }, "atm": { "positive": -0.0256, "negative": 0.0619, "neutral": -0.0363 }, "atms": { "positive": -0.0819, "negative": 0.274, "neutral": -0.1921 }, "atom": { "positive": 0.0226, "negative": -0.1228, "neutral": 0.1001 }, "attack": { "positive": -0.3705, "negative": 0.0261, "neutral": 0.3444 }, "attacker": { "positive": -0.0439, "negative": 0.2706, "neutral": -0.2267 }, "attackers": { "positive": -0.0261, "negative": 0.103, "neutral": -0.0769 }, "attacks": { "positive": -0.1041, "negative": -0.0994, "neutral": 0.2035 }, "attempt": { "positive": -0.0842, "negative": 0.1278, "neutral": -0.0436 }, "attention": { "positive": -0.033, "negative": 0.0391, "neutral": -61e-4 }, "attention matter": { "positive": -0.0379, "negative": 0.0413, "neutral": -34e-4 }, "audit": { "positive": -0.0625, "negative": 0.1555, "neutral": -0.0929 }, "audit failed": { "positive": -0.0373, "negative": 0.1922, "neutral": -0.1549 }, "auditor": { "positive": -0.0329, "negative": 0.1903, "neutral": -0.1574 }, "auto": { "positive": -0.0716, "negative": -0.1417, "neutral": 0.2132 }, "automated": { "positive": -0.0177, "negative": -0.0809, "neutral": 0.0986 }, "autonomous": { "positive": -0.1501, "negative": -0.0924, "neutral": 0.2425 }, "available": { "positive": -0.2604, "negative": -0.2188, "neutral": 0.4792 }, "avalanche": { "positive": 0.0787, "negative": -0.0255, "neutral": -0.0532 }, "avax": { "positive": -0.0508, "negative": 0.0258, "neutral": 0.025 }, "avax all": { "positive": -0.0597, "negative": 0.0739, "neutral": -0.0142 }, "avax breaking": { "positive": 0.0307, "negative": -0.0208, "neutral": -99e-4 }, "avax fundamentals": { "positive": 55e-4, "negative": 0.0148, "neutral": -0.0203 }, "avax getting": { "positive": -0.0158, "negative": 0.0498, "neutral": -0.034 }, "avax here": { "positive": 6e-3, "negative": -0.0398, "neutral": 0.0338 }, "avax news": { "positive": -0.018, "negative": -0.0152, "neutral": 0.0332 }, "avax trading": { "positive": -0.0192, "negative": -0.015, "neutral": 0.0342 }, "average": { "positive": 0.1283, "negative": 0.0365, "neutral": -0.1648 }, "avg": { "positive": 0.2813, "negative": -0.2108, "neutral": -0.0705 }, "aware": { "positive": -0.0313, "negative": -0.055, "neutral": 0.0863 }, "away": { "positive": 0.0613, "negative": -0.0576, "neutral": -37e-4 }, "awesome": { "positive": 0.5398, "negative": -0.1089, "neutral": -0.4309 }, "aws": { "positive": -0.1655, "negative": 0.0783, "neutral": 0.0872 }, "ayyy": { "positive": 0.0954, "negative": -0.1059, "neutral": 0.0105 }, "ayyy trending": { "positive": -0.0216, "negative": -0.0904, "neutral": 0.112 }, "ba": { "positive": 0.0761, "negative": -0.0319, "neutral": -0.0442 }, "ba cbedd": { "positive": 0.0761, "negative": -0.0319, "neutral": -0.0442 }, "babies": { "positive": -0.085, "negative": -0.2228, "neutral": 0.3078 }, "baby": { "positive": 0.1347, "negative": -0.213, "neutral": 0.0783 }, "back": { "positive": -0.1619, "negative": -0.076, "neutral": 0.2379 }, "back down": { "positive": -0.0599, "negative": 0.0891, "neutral": -0.0293 }, "back off": { "positive": -0.1331, "negative": -0.1476, "neutral": 0.2807 }, "back over": { "positive": 0.0966, "negative": -0.1525, "neutral": 0.0558 }, "back rich": { "positive": 0.076, "negative": -0.0148, "neutral": -0.0612 }, "back soon": { "positive": -0.0417, "negative": -0.0576, "neutral": 0.0993 }, "back up": { "positive": -0.0302, "negative": -0.1494, "neutral": 0.1796 }, "backdoored": { "positive": -0.0466, "negative": 0.1354, "neutral": -0.0888 }, "backed": { "positive": -0.2548, "negative": -0.4158, "neutral": 0.6706 }, "backed crypto": { "positive": 0.1121, "negative": -0.1314, "neutral": 0.0193 }, "backs": { "positive": -0.187, "negative": -0.0996, "neutral": 0.2865 }, "bad": { "positive": -0.1089, "negative": 0.8724, "neutral": -0.7635 }, "bag": { "positive": 0.1648, "negative": 0.2254, "neutral": -0.3902 }, "bags": { "positive": -18e-4, "negative": 0.0585, "neutral": -0.0567 }, "ban": { "positive": -0.5242, "negative": 2.2429, "neutral": -1.7187 }, "ban all": { "positive": -0.0144, "negative": 0.0771, "neutral": -0.0627 }, "ban bitcoin": { "positive": -0.0688, "negative": 0.3457, "neutral": -0.2769 }, "ban crypto": { "positive": -0.0698, "negative": 0.1564, "neutral": -0.0866 }, "ban cryptocurrencies": { "positive": -0.0446, "negative": 0.1436, "neutral": -0.099 }, "ban cryptocurrency": { "positive": -0.0503, "negative": 0.1864, "neutral": -0.1361 }, "ban penalising": { "positive": -0.0106, "negative": 0.0641, "neutral": -0.0535 }, "bandwidth": { "positive": 0.0753, "negative": -0.0429, "neutral": -0.0324 }, "bank": { "positive": -0.1003, "negative": 0.1887, "neutral": -0.0883 }, "banking": { "positive": -0.3878, "negative": -0.0491, "neutral": 0.4369 }, "bankman": { "positive": -0.148, "negative": 0.1436, "neutral": 44e-4 }, "bankman fried": { "positive": -0.148, "negative": 0.1436, "neutral": 44e-4 }, "bankruptcy": { "positive": -0.2815, "negative": 1.0374, "neutral": -0.7559 }, "banks": { "positive": 0.2999, "negative": -0.3039, "neutral": 39e-4 }, "banned": { "positive": -0.2004, "negative": 0.9902, "neutral": -0.7898 }, "banning": { "positive": -0.1448, "negative": 0.8827, "neutral": -0.738 }, "banning politics": { "positive": -0.056, "negative": 0.3008, "neutral": -0.2448 }, "bans": { "positive": -0.0614, "negative": 0.0435, "neutral": 0.018 }, "bans cryptocurrency": { "positive": -0.0473, "negative": -0.0853, "neutral": 0.1325 }, "barely": { "positive": 0.0836, "negative": -0.042, "neutral": -0.0416 }, "base": { "positive": -0.0827, "negative": 0.3449, "neutral": -0.2623 }, "based": { "positive": -0.1992, "negative": 0.0984, "neutral": 0.1009 }, "basic": { "positive": -0.1328, "negative": 0.0535, "neutral": 0.0792 }, "basically": { "positive": -0.049, "negative": 0.1387, "neutral": -0.0897 }, "battle": { "positive": -0.0858, "negative": -0.1057, "neutral": 0.1915 }, "bch": { "positive": 79e-4, "negative": 0.1599, "neutral": -0.1678 }, "beanstalk": { "positive": -0.1574, "negative": 0.4589, "neutral": -0.3015 }, "bear": { "positive": -1.1179, "negative": 1.7086, "neutral": -0.5906 }, "bear cycle": { "positive": -0.1891, "negative": 0.3582, "neutral": -0.1691 }, "bear flag": { "positive": -0.0827, "negative": 0.1788, "neutral": -0.096 }, "bear market": { "positive": -0.0923, "negative": 0.7104, "neutral": -0.6181 }, "bearing": { "positive": 0.0716, "negative": -0.1122, "neutral": 0.0406 }, "bearish": { "positive": -0.5439, "negative": 1.4748, "neutral": -0.9308 }, "bearish $btc": { "positive": -0.0629, "negative": 0.1001, "neutral": -0.0372 }, "bearish $eth": { "positive": -0.056, "negative": 0.0844, "neutral": -0.0284 }, "bearish $sol": { "positive": -0.0222, "negative": 0.0398, "neutral": -0.0176 }, "bearish ada": { "positive": -0.01, "negative": 0.0347, "neutral": -0.0247 }, "bearish bnb": { "positive": -0.011, "negative": 0.0208, "neutral": -99e-4 }, "bearish cardano": { "positive": -0.0242, "negative": 0.0329, "neutral": -87e-4 }, "bearish market": { "positive": -0.0208, "negative": 0.0838, "neutral": -0.063 }, "bearish sol": { "positive": -0.0149, "negative": 0.0283, "neutral": -0.0135 }, "bearish solana": { "positive": -0.0295, "negative": 0.0396, "neutral": -0.0102 }, "bearish xrp": { "positive": -0.0179, "negative": 0.0269, "neutral": -9e-3 }, "bears": { "positive": -0.4873, "negative": 1.3369, "neutral": -0.8495 }, "beat": { "positive": 0.4655, "negative": -0.1272, "neutral": -0.3384 }, "beats": { "positive": 0.4637, "negative": -0.1197, "neutral": -0.3441 }, "beautiful": { "positive": 1.2908, "negative": -0.3439, "neutral": -0.947 }, "became": { "positive": -0.1308, "negative": -0.0251, "neutral": 0.1559 }, "because": { "positive": 0.1344, "negative": 0.1281, "neutral": -0.2625 }, "because going": { "positive": -0.0722, "negative": -0.0506, "neutral": 0.1228 }, "become": { "positive": -0.1271, "negative": -0.2264, "neutral": 0.3535 }, "becomes": { "positive": 0.3489, "negative": -0.2677, "neutral": -0.0812 }, "begin": { "positive": 0.16, "negative": 0.035, "neutral": -0.195 }, "beginner": { "positive": -0.1503, "negative": -0.2578, "neutral": 0.4081 }, "begins": { "positive": -0.0279, "negative": 0.2606, "neutral": -0.2327 }, "behavior": { "positive": 2e-4, "negative": -0.1635, "neutral": 0.1632 }, "behind": { "positive": 0.0817, "negative": -0.0102, "neutral": -0.0716 }, "behind earlier": { "positive": -0.0126, "negative": 0.0426, "neutral": -0.03 }, "believe": { "positive": 0.156, "negative": -0.1379, "neutral": -0.0181 }, "benchmarks": { "positive": 0.0751, "negative": -0.139, "neutral": 0.0639 }, "bend": { "positive": -0.1284, "negative": 0.4311, "neutral": -0.3026 }, "best": { "positive": 2.5838, "negative": -0.8459, "neutral": -1.7378 }, "best altcoins": { "positive": 0.1758, "negative": -0.0867, "neutral": -0.0892 }, "best community": { "positive": 0.1217, "negative": -0.0361, "neutral": -0.0855 }, "best crypto": { "positive": 0.2002, "negative": -0.0336, "neutral": -0.1666 }, "best cryptocurrency": { "positive": 0.2274, "negative": -0.1538, "neutral": -0.0736 }, "best month": { "positive": 0.0376, "negative": -0.0287, "neutral": -89e-4 }, "best performing": { "positive": 0.2669, "negative": -0.0803, "neutral": -0.1865 }, "bet": { "positive": 0.4402, "negative": 0.0877, "neutral": -0.5279 }, "beta": { "positive": -0.039, "negative": -0.0503, "neutral": 0.0893 }, "bets": { "positive": 0.3795, "negative": -0.306, "neutral": -0.0734 }, "better": { "positive": 0.9538, "negative": 0.034, "neutral": -0.9878 }, "better know": { "positive": 0.1387, "negative": -0.0273, "neutral": -0.1114 }, "better start": { "positive": 0.0206, "negative": -0.0179, "neutral": -27e-4 }, "better than": { "positive": 0.0739, "negative": 0.0667, "neutral": -0.1406 }, "betterment": { "positive": -0.0389, "negative": -0.0412, "neutral": 0.0802 }, "beware": { "positive": -0.1608, "negative": -0.1419, "neutral": 0.3027 }, "beyond": { "positive": -0.19, "negative": 0.124, "neutral": 0.066 }, "bid": { "positive": 0.2156, "negative": -0.2666, "neutral": 0.051 }, "big": { "positive": 0.0425, "negative": 0.2482, "neutral": -0.2907 }, "big bitcoin": { "positive": 0.1612, "negative": -0.0283, "neutral": -0.1329 }, "big time": { "positive": 0.0899, "negative": -0.0104, "neutral": -0.0795 }, "bigger": { "positive": 0.082, "negative": 0.1159, "neutral": -0.1979 }, "bigger than": { "positive": -0.0496, "negative": 0.141, "neutral": -0.0914 }, "biggest": { "positive": 0.1655, "negative": -0.1425, "neutral": -0.0231 }, "biggest ponzi": { "positive": -0.0381, "negative": 0.1281, "neutral": -0.0899 }, "biggest stablecoin": { "positive": -0.0408, "negative": -0.21, "neutral": 0.2509 }, "bill": { "positive": 0.0841, "negative": 0.2138, "neutral": -0.2979 }, "bill incoming": { "positive": 0.0537, "negative": -0.0413, "neutral": -0.0125 }, "bill per": { "positive": -0.0447, "negative": -0.1158, "neutral": 0.1605 }, "billion": { "positive": 0.49, "negative": -0.1024, "neutral": -0.3876 }, "billion dollar": { "positive": 0.072, "negative": -0.1139, "neutral": 0.0419 }, "billions": { "positive": 0.134, "negative": 0.2992, "neutral": -0.4332 }, "binance": { "positive": -0.8552, "negative": 0.7546, "neutral": 0.1006 }, "binance admits": { "positive": 0.2023, "negative": -0.0735, "neutral": -0.1289 }, "binance ceo": { "positive": -0.0278, "negative": 0.122, "neutral": -0.0942 }, "binance chain": { "positive": -0.0234, "negative": 0.1604, "neutral": -0.137 }, "binance coinbase": { "positive": -0.0308, "negative": 0.2133, "neutral": -0.1824 }, "binance cz": { "positive": 0.1825, "negative": -0.2611, "neutral": 0.0785 }, "binance founder": { "positive": -0.0869, "negative": 0.0829, "neutral": 4e-3 }, "binance halts": { "positive": -0.0178, "negative": 0.1538, "neutral": -0.1361 }, "binance lawsuit": { "positive": -76e-4, "negative": 0.024, "neutral": -0.0163 }, "binance says": { "positive": -0.0933, "negative": -0.3492, "neutral": 0.4425 }, "binance smart": { "positive": -0.0247, "negative": 0.0816, "neutral": -0.0569 }, "binance temporarily": { "positive": -0.029, "negative": 0.1867, "neutral": -0.1577 }, "binance's": { "positive": -0.1939, "negative": 0.2451, "neutral": -0.0512 }, "bingo": { "positive": -0.155, "negative": 0.2843, "neutral": -0.1294 }, "bit": { "positive": -0.1172, "negative": -0.1177, "neutral": 0.235 }, "bitcoin": { "positive": 0.1333, "negative": 2e-4, "neutral": -0.1335 }, "bitcoin all": { "positive": -0.0505, "negative": 0.0617, "neutral": -0.0112 }, "bitcoin altcoin": { "positive": 0.1413, "negative": -0.0558, "neutral": -0.0854 }, "bitcoin atm": { "positive": -0.0256, "negative": 0.0619, "neutral": -0.0363 }, "bitcoin best": { "positive": 0.084, "negative": -0.0538, "neutral": -0.0303 }, "bitcoin bitcoin": { "positive": -0.0379, "negative": 0.0413, "neutral": -34e-4 }, "bitcoin blockchain": { "positive": -0.1232, "negative": -0.325, "neutral": 0.4482 }, "bitcoin boom": { "positive": 0.3159, "negative": -0.1398, "neutral": -0.1761 }, "bitcoin breaking": { "positive": 0.0176, "negative": 0.0134, "neutral": -0.031 }, "bitcoin btc": { "positive": 0.2923, "negative": -0.0815, "neutral": -0.2107 }, "bitcoin bubble": { "positive": -0.0706, "negative": 0.2605, "neutral": -0.19 }, "bitcoin buy": { "positive": 0.1741, "negative": -0.0542, "neutral": -0.1199 }, "bitcoin cash": { "positive": 0.1606, "negative": -0.1188, "neutral": -0.0418 }, "bitcoin ceo": { "positive": -0.0455, "negative": 0.1562, "neutral": -0.1107 }, "bitcoin coming": { "positive": 0.0526, "negative": -0.1413, "neutral": 0.0887 }, "bitcoin crashed": { "positive": -0.1678, "negative": 0.2399, "neutral": -0.0721 }, "bitcoin crashes": { "positive": -0.0202, "negative": 0.0942, "neutral": -0.074 }, "bitcoin depot": { "positive": -0.0539, "negative": 0.1224, "neutral": -0.0685 }, "bitcoin etf": { "positive": 0.1995, "negative": -0.0594, "neutral": -0.1401 }, "bitcoin ethereum": { "positive": -0.0479, "negative": 0.1658, "neutral": -0.118 }, "bitcoin failed": { "positive": -0.0472, "negative": 0.1296, "neutral": -0.0825 }, "bitcoin futures": { "positive": -0.055, "negative": -0.1366, "neutral": 0.1916 }, "bitcoin here": { "positive": -0.0125, "negative": -0.042, "neutral": 0.0545 }, "bitcoin it's": { "positive": -0.0214, "negative": 0.0541, "neutral": -0.0327 }, "bitcoin mine": { "positive": -0.2056, "negative": 0.1158, "neutral": 0.0898 }, "bitcoin miner": { "positive": -0.0607, "negative": 0.2104, "neutral": -0.1497 }, "bitcoin miners": { "positive": -0.1034, "negative": 0.0549, "neutral": 0.0484 }, "bitcoin mining": { "positive": 0.0411, "negative": -0.0677, "neutral": 0.0266 }, "bitcoin mixing": { "positive": -0.0503, "negative": 0.0132, "neutral": 0.037 }, "bitcoin news": { "positive": -0.0488, "negative": -0.031, "neutral": 0.0798 }, "bitcoin only": { "positive": -0.0379, "negative": 0.0413, "neutral": -34e-4 }, "bitcoin other": { "positive": -0.0568, "negative": 0.1964, "neutral": -0.1395 }, "bitcoin payments": { "positive": -0.1199, "negative": -0.1284, "neutral": 0.2483 }, "bitcoin price": { "positive": -0.2307, "negative": 0.3744, "neutral": -0.1437 }, "bitcoin rallies": { "positive": 0.3812, "negative": -0.1814, "neutral": -0.1998 }, "bitcoin stolen": { "positive": -0.0216, "negative": 0.1074, "neutral": -0.0858 }, "bitcoin surges": { "positive": 0.0573, "negative": -0.023, "neutral": -0.0343 }, "bitcoin trading": { "positive": -0.0372, "negative": -0.0246, "neutral": 0.0618 }, "bitcoin tumbles": { "positive": -0.0506, "negative": 0.2941, "neutral": -0.2435 }, "bitcoin using": { "positive": -0.0725, "negative": 0.2263, "neutral": -0.1538 }, "bitcoin volume": { "positive": -0.1674, "negative": 0.0964, "neutral": 0.071 }, "bitcoin's": { "positive": 0.0522, "negative": -0.2766, "neutral": 0.2245 }, "bitcoins": { "positive": -0.2894, "negative": 0.3364, "neutral": -0.047 }, "bitcoins stolen": { "positive": -0.0457, "negative": 0.2123, "neutral": -0.1666 }, "bitfinex": { "positive": -0.0549, "negative": 0.0389, "neutral": 0.0159 }, "bithumb": { "positive": -0.0443, "negative": -0.0439, "neutral": 0.0882 }, "bitmart": { "positive": -93e-4, "negative": 0.0291, "neutral": -0.0198 }, "bittrex": { "positive": -0.0468, "negative": 0.0516, "neutral": -48e-4 }, "bitzlato": { "positive": -0.015, "negative": 0.2921, "neutral": -0.2771 }, "black": { "positive": 0.3837, "negative": -0.2411, "neutral": -0.1426 }, "black rock": { "positive": 0.2881, "negative": -0.2043, "neutral": -0.0838 }, "blackrock": { "positive": 0.3593, "negative": -0.3006, "neutral": -0.0587 }, "blame": { "positive": -0.0357, "negative": -0.0437, "neutral": 0.0794 }, "bleed": { "positive": -0.0162, "negative": 0.0627, "neutral": -0.0465 }, "block": { "positive": -0.2679, "negative": -0.1204, "neutral": 0.3884 }, "block chain": { "positive": -0.1897, "negative": -0.1931, "neutral": 0.3828 }, "blockchain": { "positive": -0.5624, "negative": 0.122, "neutral": 0.4405 }, "blockchain based": { "positive": -0.0576, "negative": -0.0196, "neutral": 0.0771 }, "blockchain bridge": { "positive": -0.0199, "negative": 0.1151, "neutral": -0.0953 }, "blockchain cryptocurrency": { "positive": -0.0316, "negative": 0.4808, "neutral": -0.4492 }, "blockchain implementation": { "positive": -0.0262, "negative": -0.0723, "neutral": 0.0984 }, "blockchain technology": { "positive": 0.0653, "negative": -0.1232, "neutral": 0.0579 }, "blockchain voting": { "positive": -0.0794, "negative": 0.1822, "neutral": -0.1028 }, "blockchains": { "positive": -0.0592, "negative": -0.059, "neutral": 0.1183 }, "blockchains stablecoins": { "positive": -0.0633, "negative": 0.0457, "neutral": 0.0176 }, "blocks": { "positive": -0.0401, "negative": -0.2416, "neutral": 0.2817 }, "blockscale": { "positive": -0.1115, "negative": 0.207, "neutral": -0.0955 }, "blockscale chips": { "positive": -0.0545, "negative": 0.316, "neutral": -0.2615 }, "blog": { "positive": -0.1201, "negative": 0.2755, "neutral": -0.1554 }, "bloomberg": { "positive": -0.0509, "negative": 0.1592, "neutral": -0.1082 }, "blow": { "positive": -0.0485, "negative": 0.1461, "neutral": -0.0975 }, "blow global": { "positive": -0.0485, "negative": 0.1461, "neutral": -0.0975 }, "bnb": { "positive": -0.1879, "negative": 0.1648, "neutral": 0.0231 }, "bnb all": { "positive": -0.0652, "negative": 0.082, "neutral": -0.0169 }, "bnb buy": { "positive": -0.0536, "negative": 0.028, "neutral": 0.0256 }, "bnb crashes": { "positive": -0.0108, "negative": 0.0309, "neutral": -0.0202 }, "bnb here": { "positive": -59e-4, "negative": -0.0449, "neutral": 0.0507 }, "bnb news": { "positive": -0.0215, "negative": -0.0199, "neutral": 0.0414 }, "bnb trading": { "positive": -0.021, "negative": -0.0213, "neutral": 0.0422 }, "bnb volume": { "positive": 0.0356, "negative": -0.0113, "neutral": -0.0243 }, "board": { "positive": 0.5159, "negative": -0.1183, "neutral": -0.3976 }, "boat": { "positive": 0.0702, "negative": -0.0387, "neutral": -0.0315 }, "body": { "positive": -0.0324, "negative": 0.1843, "neutral": -0.1518 }, "bonanza": { "positive": -0.0769, "negative": -0.3438, "neutral": 0.4206 }, "bond": { "positive": -0.1434, "negative": -0.1838, "neutral": 0.3272 }, "bonds": { "positive": -0.0214, "negative": 0.1192, "neutral": -0.0978 }, "book": { "positive": -89e-4, "negative": -0.0579, "neutral": 0.0668 }, "books": { "positive": 0.0583, "negative": -0.0711, "neutral": 0.0129 }, "boom": { "positive": 1.8918, "negative": -0.6586, "neutral": -1.2332 }, "booming": { "positive": 1.1694, "negative": -0.3563, "neutral": -0.813 }, "border": { "positive": 0.2905, "negative": -0.1014, "neutral": -0.1891 }, "border payments": { "positive": 0.2905, "negative": -0.1014, "neutral": -0.1891 }, "born": { "positive": 0.2248, "negative": -0.214, "neutral": -0.0108 }, "boss": { "positive": -0.1159, "negative": -0.0625, "neutral": 0.1784 }, "bot": { "positive": 0.0462, "negative": 0.0667, "neutral": -0.113 }, "both": { "positive": 0.2762, "negative": -0.0517, "neutral": -0.2245 }, "bottom": { "positive": 0.3529, "negative": -0.2631, "neutral": -0.0898 }, "bottoms": { "positive": 0.024, "negative": -0.0196, "neutral": -45e-4 }, "bought": { "positive": -0.3535, "negative": 0.0869, "neutral": 0.2666 }, "bought more": { "positive": -0.1798, "negative": -0.0138, "neutral": 0.1936 }, "bounce": { "positive": 0.675, "negative": -0.3388, "neutral": -0.3362 }, "bounce back": { "positive": 0.0697, "negative": -77e-4, "neutral": -0.0621 }, "bounce taking": { "positive": 0.076, "negative": -0.0148, "neutral": -0.0612 }, "bouncing": { "positive": 0.2283, "negative": 0.0323, "neutral": -0.2606 }, "bound": { "positive": -0.0452, "negative": -0.0842, "neutral": 0.1294 }, "bounty": { "positive": -0.0442, "negative": 0.0357, "neutral": 85e-4 }, "box": { "positive": 0.0572, "negative": -0.1289, "neutral": 0.0718 }, "boy": { "positive": -0.12, "negative": 0.3527, "neutral": -0.2327 }, "brazil": { "positive": -0.1643, "negative": -52e-4, "neutral": 0.1695 }, "breach": { "positive": -0.1827, "negative": -0.0265, "neutral": 0.2093 }, "break": { "positive": 0.2536, "negative": -0.0726, "neutral": -0.181 }, "break ath": { "positive": 0.1484, "negative": -0.0687, "neutral": -0.0797 }, "break even": { "positive": 0.2076, "negative": -0.084, "neutral": -0.1236 }, "breaking": { "positive": 0.4491, "negative": -0.1842, "neutral": -0.2649 }, "breaking out": { "positive": 0.5248, "negative": -0.3323, "neutral": -0.1925 }, "breakout": { "positive": 0.7424, "negative": -0.3145, "neutral": -0.4279 }, "breaks": { "positive": -0.3502, "negative": 0.2316, "neutral": 0.1186 }, "breaks out": { "positive": -0.1288, "negative": -0.0968, "neutral": 0.2256 }, "breaks peg": { "positive": -0.0913, "negative": -0.0144, "neutral": 0.1057 }, "breakthrough": { "positive": 0.9467, "negative": -0.244, "neutral": -0.7027 }, "bridge": { "positive": -0.0513, "negative": 0.1557, "neutral": -0.1044 }, "bridges": { "positive": -0.0598, "negative": -0.0746, "neutral": 0.1345 }, "briefly": { "positive": 0.049, "negative": 0.197, "neutral": -0.246 }, "bright": { "positive": -0.0741, "negative": -0.1517, "neutral": 0.2257 }, "bring": { "positive": -0.1623, "negative": -0.0859, "neutral": 0.2481 }, "bringing": { "positive": -0.0766, "negative": -0.0774, "neutral": 0.154 }, "bro": { "positive": -0.1078, "negative": 0.0369, "neutral": 0.0709 }, "broken": { "positive": -0.3857, "negative": 0.7308, "neutral": -0.3451 }, "broker": { "positive": 0.0447, "negative": -0.057, "neutral": 0.0123 }, "bros": { "positive": -0.0721, "negative": 0.1656, "neutral": -0.0935 }, "brothers": { "positive": 0.0126, "negative": 0.1766, "neutral": -0.1892 }, "brothers arrested": { "positive": -0.0198, "negative": 0.1199, "neutral": -0.1001 }, "browser": { "positive": 0.3678, "negative": -0.2706, "neutral": -0.0972 }, "browser extension": { "positive": 0.4057, "negative": -0.158, "neutral": -0.2477 }, "bs": { "positive": -0.0296, "negative": -0.1626, "neutral": 0.1921 }, "btc": { "positive": 0.0896, "negative": -0.1531, "neutral": 0.0635 }, "btc breaking": { "positive": 0.0568, "negative": -0.0275, "neutral": -0.0293 }, "btc buy": { "positive": -0.0714, "negative": 0.1266, "neutral": -0.0552 }, "btc consolidating": { "positive": 0.0565, "negative": -0.0294, "neutral": -0.0271 }, "btc crashes": { "positive": -0.0486, "negative": 0.1243, "neutral": -0.0757 }, "btc goes": { "positive": -0.123, "negative": 0.0182, "neutral": 0.1049 }, "btc here": { "positive": -15e-4, "negative": -0.0344, "neutral": 0.0358 }, "btc lost": { "positive": -0.076, "negative": 0.1181, "neutral": -0.042 }, "btc news": { "positive": -0.0337, "negative": -0.0198, "neutral": 0.0535 }, "btc trading": { "positive": -0.0308, "negative": -0.0186, "neutral": 0.0494 }, "btc weak": { "positive": -0.0188, "negative": 0.024, "neutral": -52e-4 }, "bubble": { "positive": -0.4174, "negative": 1.6128, "neutral": -1.1953 }, "bucks": { "positive": -0.0512, "negative": -0.1581, "neutral": 0.2093 }, "buddy": { "positive": 0.6746, "negative": -0.2338, "neutral": -0.4408 }, "bug": { "positive": -0.1907, "negative": 0.0955, "neutral": 0.0952 }, "build": { "positive": 0.0757, "negative": -0.5126, "neutral": 0.4369 }, "build crypto": { "positive": -0.089, "negative": -0.0703, "neutral": 0.1593 }, "building": { "positive": 0.4214, "negative": -0.9073, "neutral": 0.4858 }, "building best": { "positive": 0.1181, "negative": -47e-4, "neutral": -0.1134 }, "building crypto": { "positive": 0.0283, "negative": -0.2411, "neutral": 0.2128 }, "buildout": { "positive": 0.0412, "negative": -0.0214, "neutral": -0.0198 }, "buildout near": { "positive": 0.0412, "negative": -0.0214, "neutral": -0.0198 }, "builds": { "positive": 0.0556, "negative": -0.1098, "neutral": 0.0543 }, "built": { "positive": -0.1799, "negative": -0.3162, "neutral": 0.4961 }, "built ai": { "positive": -0.1203, "negative": 0.1865, "neutral": -0.0662 }, "built crypto": { "positive": -0.0485, "negative": -0.0539, "neutral": 0.1024 }, "built ethereum": { "positive": -0.048, "negative": -0.0646, "neutral": 0.1126 }, "bull": { "positive": 1.3238, "negative": -0.3123, "neutral": -1.0115 }, "bull cycle": { "positive": 0.1008, "negative": -0.0395, "neutral": -0.0613 }, "bull market": { "positive": 0.6838, "negative": -0.2759, "neutral": -0.4079 }, "bull run": { "positive": 0.4055, "negative": -0.4397, "neutral": 0.0342 }, "bull trap": { "positive": -0.423, "negative": 0.5233, "neutral": -0.1003 }, "bulletproof": { "positive": -0.0795, "negative": -0.0453, "neutral": 0.1247 }, "bullish": { "positive": 2.0142, "negative": -0.4639, "neutral": -1.5503 }, "bullish $btc": { "positive": -0.0422, "negative": 0.0554, "neutral": -0.0132 }, "bullish $eth": { "positive": 0.0714, "negative": -0.0545, "neutral": -0.0169 }, "bullish $sol": { "positive": -0.0618, "negative": 0.0718, "neutral": -0.0101 }, "bullish ada": { "positive": -0.0167, "negative": 0.0412, "neutral": -0.0244 }, "bullish altcoins": { "positive": -0.0125, "negative": 0.0493, "neutral": -0.0367 }, "bullish avax": { "positive": -0.048, "negative": 0.0654, "neutral": -0.0175 }, "bullish bitcoin": { "positive": 0.1834, "negative": -0.0663, "neutral": -0.1171 }, "bullish bnb": { "positive": -0.0506, "negative": 0.071, "neutral": -0.0204 }, "bullish cardano": { "positive": -0.0124, "negative": 0.0363, "neutral": -0.0238 }, "bullish case": { "positive": 0.1495, "negative": -0.0868, "neutral": -0.0626 }, "bullish crypto": { "positive": 0.4952, "negative": -0.3835, "neutral": -0.1117 }, "bullish doge": { "positive": -63e-4, "negative": 0.0251, "neutral": -0.0188 }, "bullish eth": { "positive": -0.037, "negative": 0.0446, "neutral": -76e-4 }, "bullish ethereum": { "positive": -7e-3, "negative": 0.0393, "neutral": -0.0323 }, "bullish ripple": { "positive": -0.0779, "negative": 0.096, "neutral": -0.0181 }, "bullish sol": { "positive": -33e-4, "negative": 0.0274, "neutral": -0.0241 }, "bullish solana": { "positive": -0.014, "negative": 0.0532, "neutral": -0.0393 }, "bullish xrp": { "positive": 5e-4, "negative": 0.0331, "neutral": -0.0335 }, "bulls": { "positive": 1.2725, "negative": -0.5921, "neutral": -0.6804 }, "bulls followers": { "positive": 0.0358, "negative": -0.0162, "neutral": -0.0196 }, "burnshot": { "positive": -0.0268, "negative": -0.0201, "neutral": 0.0468 }, "burnshot zero": { "positive": -0.0268, "negative": -0.0201, "neutral": 0.0468 }, "business": { "positive": 0.1955, "negative": -7e-4, "neutral": -0.1948 }, "buy": { "positive": 1.6704, "negative": -0.6401, "neutral": -1.0303 }, "buy $btc": { "positive": 0.0659, "negative": -0.0281, "neutral": -0.0378 }, "buy $nonja": { "positive": 0.2311, "negative": -77e-4, "neutral": -0.2233 }, "buy ai": { "positive": -0.093, "negative": 0.1622, "neutral": -0.0692 }, "buy all": { "positive": 0.0223, "negative": -0.0127, "neutral": -97e-4 }, "buy bitcoin": { "positive": -0.028, "negative": 0.0463, "neutral": -0.0183 }, "buy buy": { "positive": 0.0311, "negative": -0.0219, "neutral": -92e-4 }, "buy dip": { "positive": 0.0923, "negative": -0.0156, "neutral": -0.0767 }, "buy gold": { "positive": -0.159, "negative": 0.3037, "neutral": -0.1447 }, "buy hold": { "positive": 0.303, "negative": -0.13, "neutral": -0.173 }, "buy memecoins": { "positive": -0.1337, "negative": 0.2499, "neutral": -0.1162 }, "buy more": { "positive": 0.0362, "negative": -66e-4, "neutral": -0.0295 }, "buy now": { "positive": 0.0981, "negative": -0.0489, "neutral": -0.0492 }, "buy nvidia": { "positive": -0.0631, "negative": 0.1029, "neutral": -0.0398 }, "buy other": { "positive": -0.0916, "negative": 0.1284, "neutral": -0.0368 }, "buy right": { "positive": 0.134, "negative": -0.027, "neutral": -0.1071 }, "buy sell": { "positive": -0.6558, "negative": -0.4368, "neutral": 1.0926 }, "buy tech": { "positive": -0.0655, "negative": 0.1178, "neutral": -0.0523 }, "buy wait": { "positive": -1.0695, "negative": -0.2418, "neutral": 1.3114 }, "buyers": { "positive": 0.1287, "negative": -0.0203, "neutral": -0.1084 }, "buying": { "positive": 1.6903, "negative": -0.4353, "neutral": -1.2551 }, "buying accelerates": { "positive": 0.1137, "negative": -0.0589, "neutral": -0.0548 }, "buying dip": { "positive": 0.3051, "negative": -0.1419, "neutral": -0.1632 }, "buying holding": { "positive": 0.0316, "negative": -0.0135, "neutral": -0.0181 }, "buying more": { "positive": 0.2192, "negative": -0.0318, "neutral": -0.1874 }, "buys": { "positive": 0.1745, "negative": -0.1934, "neutral": 0.0188 }, "bvnk": { "positive": 0.1383, "negative": -0.0755, "neutral": -0.0628 }, "bybit": { "positive": -0.1092, "negative": -3e-4, "neutral": 0.1095 }, "bybit hack": { "positive": -0.0398, "negative": 0.0791, "neutral": -0.0393 }, "bybit says": { "positive": -85e-4, "negative": 0.0634, "neutral": -0.0549 }, "bye": { "positive": -0.1222, "negative": 0.2732, "neutral": -0.1509 }, "bytes": { "positive": -0.0607, "negative": -0.1295, "neutral": 0.1902 }, "ca": { "positive": 0.0957, "negative": -0.0383, "neutral": -0.0574 }, "ca xc": { "positive": 0.0761, "negative": -0.0319, "neutral": -0.0442 }, "call": { "positive": -0.3976, "negative": 0.0584, "neutral": 0.3392 }, "called": { "positive": -0.1487, "negative": -0.0599, "neutral": 0.2086 }, "calls": { "positive": -0.0495, "negative": 0.1307, "neutral": -0.0812 }, "calls ban": { "positive": -0.0275, "negative": 0.1502, "neutral": -0.1227 }, "camera": { "positive": -0.026, "negative": -0.0255, "neutral": 0.0515 }, "campaign": { "positive": -0.0844, "negative": 0.2316, "neutral": -0.1472 }, "can't": { "positive": 0.3055, "negative": 0.1159, "neutral": -0.4214 }, "canada": { "positive": -0.1304, "negative": -0.051, "neutral": 0.1814 }, "candle": { "positive": 0.2486, "negative": -0.0368, "neutral": -0.2118 }, "candles": { "positive": -0.1399, "negative": 0.2385, "neutral": -0.0987 }, "cannot": { "positive": -0.051, "negative": -0.0754, "neutral": 0.1264 }, "cant": { "positive": 0.1094, "negative": -42e-4, "neutral": -0.1051 }, "cap": { "positive": 0.309, "negative": -0.2825, "neutral": -0.0264 }, "cap barely": { "positive": 0.036, "negative": -0.0114, "neutral": -0.0246 }, "cap still": { "positive": -0.0521, "negative": 0.1205, "neutral": -0.0684 }, "capitulation": { "positive": -0.4436, "negative": 0.8682, "neutral": -0.4246 }, "capitulation continues": { "positive": -0.2131, "negative": 0.3984, "neutral": -0.1853 }, "car": { "positive": 0.0221, "negative": -0.0775, "neutral": 0.0554 }, "card": { "positive": 0.0402, "negative": 0.0963, "neutral": -0.1365 }, "cardano": { "positive": -0.0423, "negative": 0.0682, "neutral": -0.0259 }, "cardano all": { "positive": -0.0526, "negative": 0.0635, "neutral": -0.0109 }, "cardano buy": { "positive": -0.0507, "negative": 84e-4, "neutral": 0.0423 }, "cardano crashes": { "positive": -0.0242, "negative": 0.0662, "neutral": -0.0421 }, "cardano getting": { "positive": -95e-4, "negative": 0.0364, "neutral": -0.0269 }, "cardano momentum": { "positive": 0.0334, "negative": -9e-3, "neutral": -0.0244 }, "cardano news": { "positive": -0.0171, "negative": -0.0144, "neutral": 0.0315 }, "cardano trading": { "positive": -0.0203, "negative": -0.0164, "neutral": 0.0368 }, "cardano volume": { "positive": 0.0495, "negative": -0.0183, "neutral": -0.0312 }, "cascade": { "positive": -0.1048, "negative": 0.1802, "neutral": -0.0754 }, "case": { "positive": 0.0218, "negative": 0.2975, "neutral": -0.3193 }, "cases": { "positive": -0.1214, "negative": -0.1022, "neutral": 0.2236 }, "cash": { "positive": -0.1111, "negative": -0.1872, "neutral": 0.2983 }, "cat": { "positive": 0.2622, "negative": -0.2309, "neutral": -0.0312 }, "cat bounce": { "positive": 0.2622, "negative": -0.2309, "neutral": -0.0312 }, "catalyst": { "positive": -0.0541, "negative": -0.2825, "neutral": 0.3367 }, "catalysts": { "positive": 0.1482, "negative": -0.0769, "neutral": -0.0712 }, "catalysts incoming": { "positive": 0.0537, "negative": -0.0413, "neutral": -0.0125 }, "catch": { "positive": -0.2303, "negative": 0.0598, "neutral": 0.1705 }, "cats": { "positive": 0.4838, "negative": -0.1546, "neutral": -0.3293 }, "cause": { "positive": 0.1557, "negative": 0.2108, "neutral": -0.3665 }, "caused": { "positive": 0.0565, "negative": -0.1657, "neutral": 0.1092 }, "causes": { "positive": -0.1261, "negative": 0.1846, "neutral": -0.0584 }, "cbedd": { "positive": 0.0761, "negative": -0.0319, "neutral": -0.0442 }, "cbedd cfcb": { "positive": 0.0761, "negative": -0.0319, "neutral": -0.0442 }, "cd": { "positive": 0.2335, "negative": -0.1048, "neutral": -0.1288 }, "cd cd": { "positive": 0.0861, "negative": -0.0314, "neutral": -0.0546 }, "cd ec": { "positive": 0.0861, "negative": -0.0314, "neutral": -0.0546 }, "celestia": { "positive": 0.2751, "negative": -0.0967, "neutral": -0.1784 }, "celestia $tia": { "positive": 0.1325, "negative": -0.025, "neutral": -0.1075 }, "celsius": { "positive": -0.2643, "negative": 0.2564, "neutral": 78e-4 }, "cent": { "positive": -0.1012, "negative": -0.0111, "neutral": 0.1122 }, "center": { "positive": -0.0619, "negative": 0.2598, "neutral": -0.1979 }, "central": { "positive": 0.2873, "negative": -0.342, "neutral": 0.0547 }, "central bank": { "positive": 0.1725, "negative": -0.1924, "neutral": 0.02 }, "central banks": { "positive": 0.1841, "negative": -0.0901, "neutral": -0.0941 }, "centralized": { "positive": -0.0898, "negative": -0.1214, "neutral": 0.2112 }, "cents": { "positive": -0.4269, "negative": 0.0386, "neutral": 0.3883 }, "cents lol": { "positive": -0.1112, "negative": 0.2002, "neutral": -0.089 }, "ceo": { "positive": -0.3975, "negative": 0.5517, "neutral": -0.1542 }, "ceo collapsed": { "positive": -72e-4, "negative": 0.1045, "neutral": -0.0973 }, "ceo says": { "positive": -0.0464, "negative": -0.0753, "neutral": 0.1218 }, "certain": { "positive": 0.1235, "negative": -0.1003, "neutral": -0.0231 }, "cfcb": { "positive": 0.0761, "negative": -0.0319, "neutral": -0.0442 }, "cftc": { "positive": -0.1009, "negative": 0.1698, "neutral": -0.0689 }, "chain": { "positive": 0.0931, "negative": -0.01, "neutral": -0.0831 }, "chain attack": { "positive": -0.0624, "negative": -0.1116, "neutral": 0.174 }, "chain bridge": { "positive": -0.0251, "negative": 0.047, "neutral": -0.0219 }, "chain data": { "positive": 0.2677, "negative": 0.0915, "neutral": -0.3592 }, "chainlink": { "positive": -0.1358, "negative": -0.0407, "neutral": 0.1764 }, "chains": { "positive": 0.078, "negative": -0.0249, "neutral": -0.0531 }, "challenge": { "positive": -0.1025, "negative": -0.2083, "neutral": 0.3108 }, "chance": { "positive": 0.323, "negative": -0.1167, "neutral": -0.2063 }, "change": { "positive": -0.39, "negative": -0.0572, "neutral": 0.4472 }, "change name": { "positive": -0.1278, "negative": 0.1252, "neutral": 26e-4 }, "changed": { "positive": 1e-3, "negative": -0.0923, "neutral": 0.0914 }, "changes": { "positive": -0.157, "negative": -0.2457, "neutral": 0.4026 }, "changing": { "positive": 0.0451, "negative": -0.0233, "neutral": -0.0218 }, "changpeng": { "positive": -0.0963, "negative": 0.0832, "neutral": 0.0131 }, "changpeng zhao": { "positive": -0.0963, "negative": 0.0832, "neutral": 0.0131 }, "chaos": { "positive": 24e-4, "negative": 0.0345, "neutral": -0.0369 }, "charged": { "positive": 0.1434, "negative": 0.0574, "neutral": -0.2008 }, "charges": { "positive": -0.1354, "negative": 0.6096, "neutral": -0.4742 }, "charges binance": { "positive": -92e-4, "negative": 0.0507, "neutral": -0.0415 }, "charles": { "positive": -0.0268, "negative": -0.0911, "neutral": 0.1179 }, "chart": { "positive": 0.3468, "negative": 0.1668, "neutral": -0.5136 }, "chart looks": { "positive": 0.2396, "negative": -0.1436, "neutral": -0.096 }, "chart shows": { "positive": -0.2339, "negative": 0.1837, "neutral": 0.0502 }, "chart ugly": { "positive": -0.2886, "negative": 0.5924, "neutral": -0.3038 }, "chartered": { "positive": 0.2304, "negative": -0.0779, "neutral": -0.1525 }, "charts": { "positive": 0.0268, "negative": -0.1048, "neutral": 0.078 }, "chasing": { "positive": 0.2903, "negative": 0.0139, "neutral": -0.3042 }, "chat": { "positive": -0.0705, "negative": -0.1137, "neutral": 0.1842 }, "chatbots": { "positive": -0.0914, "negative": -0.0972, "neutral": 0.1886 }, "chatgpt": { "positive": -0.0291, "negative": 0.0766, "neutral": -0.0474 }, "cheap": { "positive": -0.0196, "negative": -0.0897, "neutral": 0.1093 }, "cheaper": { "positive": 0.1161, "negative": -0.0373, "neutral": -0.0788 }, "cheapies": { "positive": -0.2287, "negative": -0.079, "neutral": 0.3077 }, "check": { "positive": -0.1885, "negative": -44e-4, "neutral": 0.1928 }, "check out": { "positive": -0.0309, "negative": 0.1243, "neutral": -0.0934 }, "checking": { "positive": -0.0345, "negative": -0.0719, "neutral": 0.1064 }, "checks": { "positive": -0.0332, "negative": 0.1484, "neutral": -0.1151 }, "chief": { "positive": -0.1576, "negative": -0.1681, "neutral": 0.3257 }, "child": { "positive": -0.1336, "negative": -0.3559, "neutral": 0.4895 }, "child abuse": { "positive": -0.0506, "negative": -0.0801, "neutral": 0.1307 }, "china": { "positive": -0.4071, "negative": 0.1755, "neutral": 0.2317 }, "china bitcoin": { "positive": -0.081, "negative": 52e-4, "neutral": 0.0757 }, "china steps": { "positive": -0.078, "negative": 0.0968, "neutral": -0.0188 }, "china wants": { "positive": -0.0367, "negative": 0.0436, "neutral": -69e-4 }, "chinese": { "positive": -0.0786, "negative": 0.2203, "neutral": -0.1417 }, "chinese bitcoin": { "positive": -0.0467, "negative": 0.2444, "neutral": -0.1977 }, "chip": { "positive": 0.395, "negative": -0.0776, "neutral": -0.3174 }, "chips": { "positive": -0.2814, "negative": -0.0438, "neutral": 0.3252 }, "choose": { "positive": -0.0176, "negative": -0.0258, "neutral": 0.0435 }, "christ": { "positive": -0.1377, "negative": 0.0109, "neutral": 0.1268 }, "ci": { "positive": -0.0528, "negative": 0.078, "neutral": -0.0252 }, "circle": { "positive": 0.0644, "negative": -0.334, "neutral": 0.2696 }, "citing": { "positive": -0.064, "negative": -43e-4, "neutral": 0.0683 }, "city": { "positive": -0.0821, "negative": -0.0875, "neutral": 0.1697 }, "cla": { "positive": -0.0801, "negative": -0.0587, "neutral": 0.1388 }, "cla afkcdbxdsaymexo": { "positive": -0.0801, "negative": -0.0587, "neutral": 0.1388 }, "claim": { "positive": 0.0216, "negative": 0.1188, "neutral": -0.1405 }, "claiming": { "positive": -0.0418, "negative": 0.0543, "neutral": -0.0125 }, "claims": { "positive": -0.0461, "negative": -0.187, "neutral": 0.2331 }, "clarity": { "positive": 0.4899, "negative": 0.0198, "neutral": -0.5097 }, "clarity act": { "positive": -0.1267, "negative": -0.0245, "neutral": 0.1512 }, "clarity bill": { "positive": 0.0537, "negative": -0.0413, "neutral": -0.0125 }, "classic": { "positive": 0.3371, "negative": 0.2297, "neutral": -0.5668 }, "claude": { "positive": -0.1143, "negative": -0.2353, "neutral": 0.3495 }, "clear": { "positive": 0.3872, "negative": -0.2666, "neutral": -0.1206 }, "clear direction": { "positive": -0.1312, "negative": -0.171, "neutral": 0.3022 }, "clear move": { "positive": -0.2519, "negative": -0.2, "neutral": 0.452 }, "clear winner": { "positive": 0.2098, "negative": -0.0506, "neutral": -0.1592 }, "cli": { "positive": -0.2073, "negative": -0.1972, "neutral": 0.4044 }, "cli tool": { "positive": -0.057, "negative": -0.0556, "neutral": 0.1126 }, "clickhouse": { "positive": -0.1874, "negative": -0.2649, "neutral": 0.4523 }, "client": { "positive": -0.0431, "negative": -0.1605, "neutral": 0.2036 }, "clients": { "positive": 0.2222, "negative": 0.0284, "neutral": -0.2506 }, "climate": { "positive": -0.0555, "negative": 0.0307, "neutral": 0.0248 }, "climbing": { "positive": 0.4212, "negative": -0.0706, "neutral": -0.3507 }, "clone": { "positive": -0.0284, "negative": -0.0251, "neutral": 0.0535 }, "close": { "positive": 0.0906, "negative": -0.1906, "neutral": 0.0999 }, "closed": { "positive": -0.1714, "negative": 0.4252, "neutral": -0.2538 }, "closer": { "positive": -0.0196, "negative": 0.1543, "neutral": -0.1347 }, "cloud": { "positive": -0.0264, "negative": -0.0348, "neutral": 0.0612 }, "cloudflare": { "positive": -0.1322, "negative": -0.0424, "neutral": 0.1746 }, "clown": { "positive": -0.1396, "negative": -0.0178, "neutral": 0.1574 }, "cmon": { "positive": 0.0722, "negative": 0.1758, "neutral": -0.248 }, "cmon bulls": { "positive": 0.3356, "negative": -0.0755, "neutral": -0.26 }, "co": { "positive": -0.1389, "negative": -0.0323, "neutral": 0.1713 }, "co founder": { "positive": -0.0629, "negative": 0.1058, "neutral": -0.0429 }, "code": { "positive": -0.3033, "negative": -0.28, "neutral": 0.5833 }, "codebase": { "positive": -0.0721, "negative": 0.2146, "neutral": -0.1425 }, "codebases": { "positive": -0.1049, "negative": -0.0602, "neutral": 0.1651 }, "codex": { "positive": -0.1442, "negative": 0.1857, "neutral": -0.0415 }, "coding": { "positive": -0.0491, "negative": -0.154, "neutral": 0.2031 }, "coin": { "positive": -0.0343, "negative": 0.181, "neutral": -0.1467 }, "coin scam": { "positive": -0.0428, "negative": 0.1002, "neutral": -0.0574 }, "coin sell": { "positive": -0.0379, "negative": 0.0413, "neutral": -34e-4 }, "coinbase": { "positive": -0.2343, "negative": 0.0837, "neutral": 0.1505 }, "coinbase account": { "positive": -0.0744, "negative": -0.111, "neutral": 0.1854 }, "coinbase acquires": { "positive": -0.0688, "negative": -0.0878, "neutral": 0.1566 }, "coinbase ceo": { "positive": -0.0469, "negative": 0.1363, "neutral": -0.0894 }, "coinbase chief": { "positive": -0.0381, "negative": -0.116, "neutral": 0.1541 }, "coinbase hacked": { "positive": -0.0941, "negative": 0.3162, "neutral": -0.2221 }, "coinbase mission": { "positive": -0.0743, "negative": -0.1099, "neutral": 0.1842 }, "coinbase says": { "positive": -0.0274, "negative": 0.1668, "neutral": -0.1394 }, "coinbase stock": { "positive": -0.1438, "negative": 0.4277, "neutral": -0.2839 }, "coinbase sued": { "positive": -0.0729, "negative": 0.1814, "neutral": -0.1085 }, "coinbase support": { "positive": 0.1751, "negative": 0.0685, "neutral": -0.2436 }, "coinbase yc": { "positive": 0.1838, "negative": -0.1295, "neutral": -0.0543 }, "coindcx": { "positive": -97e-4, "negative": 0.0437, "neutral": -0.034 }, "coins": { "positive": 0.1238, "negative": 0.3557, "neutral": -0.4794 }, "coins compounded": { "positive": 0.0537, "negative": -0.0413, "neutral": -0.0125 }, "coins instead": { "positive": -0.0916, "negative": 0.1284, "neutral": -0.0368 }, "collapse": { "positive": -0.2975, "negative": 1.6181, "neutral": -1.3205 }, "collapsed": { "positive": -0.3256, "negative": 1.1091, "neutral": -0.7835 }, "collapsed crypto": { "positive": -72e-4, "negative": 0.1045, "neutral": -0.0973 }, "collapsed stablecoin": { "positive": -0.1086, "negative": 0.3414, "neutral": -0.2328 }, "collapsing": { "positive": -0.2271, "negative": 0.5133, "neutral": -0.2862 }, "collateral": { "positive": -0.0822, "negative": 0.1476, "neutral": -0.0654 }, "collateral damage": { "positive": -0.0435, "negative": 0.0821, "neutral": -0.0386 }, "colleagues": { "positive": -0.0126, "negative": 0.0426, "neutral": -0.03 }, "colleagues say": { "positive": -0.0126, "negative": 0.0426, "neutral": -0.03 }, "collectibles": { "positive": 0.0266, "negative": 0.1512, "neutral": -0.1778 }, "com": { "positive": 0.0878, "negative": -0.2575, "neutral": 0.1697 }, "come": { "positive": 0.7501, "negative": -0.4695, "neutral": -0.2806 }, "come join": { "positive": 0.1847, "negative": -0.0401, "neutral": -0.1447 }, "comeback": { "positive": -0.1109, "negative": 0.3338, "neutral": -0.2229 }, "comes": { "positive": -0.2645, "negative": 0.182, "neutral": 0.0825 }, "comes another": { "positive": -0.1184, "negative": 0.2154, "neutral": -0.0971 }, "coming": { "positive": -0.251, "negative": 0.1214, "neutral": 0.1296 }, "coming next": { "positive": 0.091, "negative": 0.0294, "neutral": -0.1204 }, "coming off": { "positive": -0.0551, "negative": 0.0279, "neutral": 0.0272 }, "coming soon": { "positive": 0.1527, "negative": -0.1333, "neutral": -0.0194 }, "comment": { "positive": -0.1501, "negative": -0.1678, "neutral": 0.3179 }, "comments": { "positive": -55e-4, "negative": -0.0269, "neutral": 0.0325 }, "comming": { "positive": -0.0305, "negative": -0.0414, "neutral": 0.0719 }, "communities": { "positive": -0.0847, "negative": -0.0665, "neutral": 0.1512 }, "community": { "positive": 0.066, "negative": -0.1728, "neutral": 0.1069 }, "companies": { "positive": -0.3361, "negative": 0.2178, "neutral": 0.1183 }, "company": { "positive": 0.3068, "negative": -0.0486, "neutral": -0.2582 }, "compiler": { "positive": -0.0333, "negative": -0.0241, "neutral": 0.0573 }, "complete": { "positive": -0.1412, "negative": 0.2195, "neutral": -0.0783 }, "completed": { "positive": 0.182, "negative": -0.014, "neutral": -0.168 }, "completely": { "positive": -0.092, "negative": 0.1534, "neutral": -0.0614 }, "compound": { "positive": 0.031, "negative": -0.0137, "neutral": -0.0173 }, "compound gains": { "positive": 0.031, "negative": -0.0137, "neutral": -0.0173 }, "compounded": { "positive": 0.0537, "negative": -0.0413, "neutral": -0.0125 }, "compounded gains": { "positive": 0.0537, "negative": -0.0413, "neutral": -0.0125 }, "compromised": { "positive": -0.1782, "negative": 0.3992, "neutral": -0.221 }, "compute": { "positive": -0.214, "negative": -0.2385, "neutral": 0.4526 }, "computer": { "positive": -0.1083, "negative": -0.1147, "neutral": 0.2229 }, "computing": { "positive": -0.2143, "negative": -0.0905, "neutral": 0.3048 }, "concerns": { "positive": 0.2842, "negative": 0.2604, "neutral": -0.5447 }, "conditions": { "positive": -0.1502, "negative": -37e-4, "neutral": 0.1539 }, "conference": { "positive": 0.1795, "negative": 72e-4, "neutral": -0.1867 }, "conference happening": { "positive": -0.2127, "negative": -0.1289, "neutral": 0.3416 }, "confidence": { "positive": 0.4061, "negative": -0.064, "neutral": -0.342 }, "confident": { "positive": 0.1118, "negative": -0.0399, "neutral": -0.0719 }, "confirmed": { "positive": 0.1539, "negative": 0.018, "neutral": -0.1719 }, "confirms": { "positive": -0.1734, "negative": 0.1417, "neutral": 0.0316 }, "confirms hack": { "positive": -0.013, "negative": 0.0498, "neutral": -0.0367 }, "congrats": { "positive": 0.2516, "negative": -0.1833, "neutral": -0.0684 }, "congrats $dot": { "positive": 0.0211, "negative": -92e-4, "neutral": -0.012 }, "congrats $wif": { "positive": -0.4081, "negative": -0.0203, "neutral": 0.4285 }, "congress": { "positive": 0.1749, "negative": -0.0781, "neutral": -0.0968 }, "consensus": { "positive": -0.0298, "negative": -0.1773, "neutral": 0.2071 }, "consensys": { "positive": -0.0911, "negative": 0.0135, "neutral": 0.0776 }, "conservative": { "positive": -0.0879, "negative": -0.1373, "neutral": 0.2252 }, "consider": { "positive": 0.0143, "negative": 0.0513, "neutral": -0.0656 }, "considered": { "positive": -0.1543, "negative": 0.1219, "neutral": 0.0324 }, "consolidating": { "positive": -0.18, "negative": -0.2208, "neutral": 0.4008 }, "consolidating waiting": { "positive": -0.2519, "negative": -0.2, "neutral": 0.452 }, "consolidation": { "positive": -0.1113, "negative": -0.2364, "neutral": 0.3477 }, "conspiracy": { "positive": -0.0231, "negative": -0.0905, "neutral": 0.1136 }, "conspiracy launder": { "positive": -0.0136, "negative": -0.1079, "neutral": 0.1215 }, "content": { "positive": -0.2248, "negative": -0.0118, "neutral": 0.2366 }, "context": { "positive": -0.0917, "negative": 0.1383, "neutral": -0.0466 }, "continue": { "positive": 0.0846, "negative": -0.252, "neutral": 0.1674 }, "continues": { "positive": 0.3804, "negative": 0.2395, "neutral": -0.6199 }, "contract": { "positive": -0.1479, "negative": 0.2083, "neutral": -0.0604 }, "contracts": { "positive": -0.2096, "negative": 0.3427, "neutral": -0.1331 }, "control": { "positive": 0.2616, "negative": -0.1435, "neutral": -0.1182 }, "controlled": { "positive": -0.0574, "negative": -0.2112, "neutral": 0.2686 }, "controls": { "positive": -0.093, "negative": 0.4747, "neutral": -0.3817 }, "convicted": { "positive": -0.1128, "negative": 0.7339, "neutral": -0.6211 }, "convicted binance": { "positive": -0.025, "negative": 0.3515, "neutral": -0.3264 }, "conviction": { "positive": 0.4373, "negative": -0.1023, "neutral": -0.335 }, "cooked": { "positive": -0.1236, "negative": -0.1079, "neutral": 0.2315 }, "cool": { "positive": 0.3624, "negative": -0.0911, "neutral": -0.2713 }, "cools": { "positive": -79e-4, "negative": 0.0639, "neutral": -0.056 }, "copy": { "positive": -0.0332, "negative": -0.0858, "neutral": 0.119 }, "core": { "positive": -0.0899, "negative": 0.1195, "neutral": -0.0296 }, "corporate": { "positive": 0.2692, "negative": 0.1197, "neutral": -0.3889 }, "corporation": { "positive": 0.0396, "negative": -0.1051, "neutral": 0.0655 }, "cosmos": { "positive": 0.4652, "negative": -0.0333, "neutral": -0.4318 }, "cosmos sdk": { "positive": 0.3061, "negative": -0.0194, "neutral": -0.2867 }, "cost": { "positive": -0.0543, "negative": 0.039, "neutral": 0.0153 }, "costs": { "positive": 0.7113, "negative": -0.3105, "neutral": -0.4008 }, "couldn't": { "positive": -0.0315, "negative": 0.1045, "neutral": -0.073 }, "count": { "positive": 0.3474, "negative": -0.0769, "neutral": -0.2705 }, "country": { "positive": -0.0473, "negative": 0.1905, "neutral": -0.1431 }, "couple": { "positive": -0.0668, "negative": -0.0777, "neutral": 0.1444 }, "course": { "positive": -0.0538, "negative": 3e-3, "neutral": 0.0508 }, "course crypto": { "positive": -0.0533, "negative": 0.2339, "neutral": -0.1806 }, "court": { "positive": -0.094, "negative": -86e-4, "neutral": 0.1026 }, "covid": { "positive": 0.0725, "negative": -0.0976, "neutral": 0.0252 }, "cpu": { "positive": 0.087, "negative": -0.1478, "neutral": 0.0608 }, "crackdown": { "positive": -0.3326, "negative": 0.1668, "neutral": 0.1658 }, "crap": { "positive": -0.0777, "negative": 0.3625, "neutral": -0.2848 }, "crash": { "positive": -0.6246, "negative": 1.7885, "neutral": -1.1639 }, "crashed": { "positive": -0.4444, "negative": 0.9654, "neutral": -0.5211 }, "crashed all": { "positive": -0.164, "negative": 0.1913, "neutral": -0.0273 }, "crashes": { "positive": -0.5641, "negative": 1.5835, "neutral": -1.0194 }, "crashes hack": { "positive": -0.0152, "negative": 0.0292, "neutral": -0.014 }, "crashes liquidity": { "positive": -0.1193, "negative": 0.2851, "neutral": -0.1658 }, "crashes major": { "positive": -0.0292, "negative": 0.0412, "neutral": -0.012 }, "crashes regulators": { "positive": -0.0369, "negative": 0.2884, "neutral": -0.2515 }, "crashes sec": { "positive": -0.0202, "negative": 0.0375, "neutral": -0.0174 }, "crashes stablecoin": { "positive": -0.0841, "negative": 0.2083, "neutral": -0.1242 }, "crashes whale": { "positive": -0.0882, "negative": 0.241, "neutral": -0.1528 }, "crashing": { "positive": -0.1962, "negative": 0.4867, "neutral": -0.2906 }, "crazy": { "positive": -0.2796, "negative": 0.1751, "neutral": 0.1045 }, "create": { "positive": -0.1874, "negative": 0.011, "neutral": 0.1765 }, "created": { "positive": 0.0638, "negative": -0.1292, "neutral": 0.0653 }, "creating": { "positive": 0.05, "negative": -0.2164, "neutral": 0.1664 }, "creative": { "positive": -0.0269, "negative": 0.2695, "neutral": -0.2426 }, "creator": { "positive": -0.1631, "negative": -0.204, "neutral": 0.3671 }, "credit": { "positive": -0.1186, "negative": -0.0439, "neutral": 0.1624 }, "crime": { "positive": -0.0476, "negative": -0.0257, "neutral": 0.0733 }, "criminal": { "positive": 0.4379, "negative": -0.3366, "neutral": -0.1013 }, "crisis": { "positive": -0.4992, "negative": 0.9956, "neutral": -0.4964 }, "critical": { "positive": -0.5054, "negative": 0.6093, "neutral": -0.1039 }, "cross": { "positive": 0.2159, "negative": -0.1566, "neutral": -0.0592 }, "cross border": { "positive": 0.2905, "negative": -0.1014, "neutral": -0.1891 }, "cross chain": { "positive": -0.0251, "negative": 0.047, "neutral": -0.0219 }, "cross platform": { "positive": -0.0228, "negative": -0.0398, "neutral": 0.0626 }, "crossed": { "positive": 0.1811, "negative": -0.0539, "neutral": -0.1272 }, "crowd": { "positive": 0.4055, "negative": -0.1052, "neutral": -0.3004 }, "crying": { "positive": 0.1876, "negative": -0.5135, "neutral": 0.3259 }, "cryo": { "positive": -0.0771, "negative": -0.1464, "neutral": 0.2235 }, "crypto": { "positive": -0.0667, "negative": 0.2649, "neutral": -0.1982 }, "crypto adoption": { "positive": 0.1293, "negative": -0.0475, "neutral": -0.0818 }, "crypto anarchist": { "positive": -0.0965, "negative": -0.1726, "neutral": 0.2691 }, "crypto bank": { "positive": -0.0996, "negative": 19e-4, "neutral": 0.0977 }, "crypto bear": { "positive": -0.0648, "negative": 0.2452, "neutral": -0.1804 }, "crypto breaking": { "positive": 0.0542, "negative": -0.0379, "neutral": -0.0163 }, "crypto bros": { "positive": -0.0721, "negative": 0.1656, "neutral": -0.0935 }, "crypto bull": { "positive": 0.3555, "negative": -0.3684, "neutral": 0.0129 }, "crypto buy": { "positive": -0.0589, "negative": 89e-4, "neutral": 0.05 }, "crypto chart": { "positive": 0.2339, "negative": -0.0928, "neutral": -0.1411 }, "crypto coin": { "positive": -0.0944, "negative": 0.191, "neutral": -0.0966 }, "crypto crackdown": { "positive": -0.0276, "negative": -0.3541, "neutral": 0.3817 }, "crypto crash": { "positive": -0.0529, "negative": 0.2113, "neutral": -0.1584 }, "crypto currencies": { "positive": -0.1432, "negative": -66e-4, "neutral": 0.1498 }, "crypto currency": { "positive": -0.1665, "negative": 0.0238, "neutral": 0.1427 }, "crypto custody": { "positive": 0.1627, "negative": -0.2541, "neutral": 0.0913 }, "crypto exchange": { "positive": -0.5899, "negative": 0.3283, "neutral": 0.2616 }, "crypto exchanges": { "positive": -0.1635, "negative": 0.3613, "neutral": -0.1978 }, "crypto firm": { "positive": 0.1312, "negative": -0.0222, "neutral": -0.109 }, "crypto firms": { "positive": -0.0459, "negative": 0.1499, "neutral": -0.104 }, "crypto getting": { "positive": -0.0665, "negative": -0.0593, "neutral": 0.1258 }, "crypto giant": { "positive": -51e-4, "negative": 0.0533, "neutral": -0.0481 }, "crypto hack": { "positive": -0.1454, "negative": 0.3478, "neutral": -0.2023 }, "crypto hacked": { "positive": -0.0752, "negative": 0.1315, "neutral": -0.0564 }, "crypto hacker": { "positive": -0.0713, "negative": -0.0695, "neutral": 0.1408 }, "crypto hackers": { "positive": -0.0584, "negative": 0.1633, "neutral": -0.1048 }, "crypto hacking": { "positive": -0.1761, "negative": -0.1589, "neutral": 0.335 }, "crypto hacks": { "positive": -0.1062, "negative": 0.107, "neutral": -9e-4 }, "crypto here": { "positive": -0.0228, "negative": -0.053, "neutral": 0.0758 }, "crypto how": { "positive": -0.0423, "negative": -0.1092, "neutral": 0.1514 }, "crypto industry": { "positive": 0.3375, "negative": 0.0937, "neutral": -0.4312 }, "crypto investors": { "positive": -0.0323, "negative": 0.0799, "neutral": -0.0476 }, "crypto lender": { "positive": -0.0408, "negative": -0.0152, "neutral": 0.056 }, "crypto market": { "positive": -0.0303, "negative": 44e-4, "neutral": 0.0259 }, "crypto markets": { "positive": 0.0965, "negative": 0.0594, "neutral": -0.1559 }, "crypto mining": { "positive": 0.071, "negative": 0.3232, "neutral": -0.3942 }, "crypto news": { "positive": 0.2173, "negative": -0.0865, "neutral": -0.1308 }, "crypto payments": { "positive": -0.0636, "negative": 0.2884, "neutral": -0.2248 }, "crypto prediction": { "positive": -0.0388, "negative": -0.1132, "neutral": 0.1519 }, "crypto price": { "positive": -0.1554, "negative": 0.0485, "neutral": 0.1069 }, "crypto prices": { "positive": -0.0787, "negative": 0.2277, "neutral": -0.1489 }, "crypto rally": { "positive": 0.293, "negative": -0.1452, "neutral": -0.1479 }, "crypto regulation": { "positive": -0.1723, "negative": -0.1299, "neutral": 0.3022 }, "crypto regulations": { "positive": -0.0749, "negative": -0.1519, "neutral": 0.2268 }, "crypto scam": { "positive": -0.0903, "negative": 0.2546, "neutral": -0.1643 }, "crypto scams": { "positive": -0.1085, "negative": 0.2583, "neutral": -0.1498 }, "crypto selloff": { "positive": -0.0216, "negative": -0.1452, "neutral": 0.1667 }, "crypto so": { "positive": -0.0126, "negative": 0.0504, "neutral": -0.0378 }, "crypto stablecoins": { "positive": 0.1254, "negative": 0.1206, "neutral": -0.246 }, "crypto startup": { "positive": -0.0402, "negative": 0.0924, "neutral": -0.0522 }, "crypto stolen": { "positive": -0.0143, "negative": 0.1259, "neutral": -0.1116 }, "crypto summer": { "positive": 0.173, "negative": -0.2477, "neutral": 0.0747 }, "crypto theft": { "positive": -0.0652, "negative": 0.1422, "neutral": -0.077 }, "crypto token": { "positive": -0.0677, "negative": -0.0784, "neutral": 0.1461 }, "crypto tokens": { "positive": 0.0305, "negative": 0.015, "neutral": -0.0456 }, "crypto trading": { "positive": -0.182, "negative": 0.04, "neutral": 0.142 }, "crypto treasury": { "positive": -0.1729, "negative": 0.1921, "neutral": -0.0193 }, "crypto venture": { "positive": -0.0505, "negative": -0.208, "neutral": 0.2585 }, "crypto wallet": { "positive": 0.0591, "negative": 0.1124, "neutral": -0.1715 }, "crypto winter": { "positive": 0.0367, "negative": 0.304, "neutral": -0.3407 }, "crypto withdrawals": { "positive": -92e-4, "negative": 0.0699, "neutral": -0.0607 }, "crypto without": { "positive": 0.0301, "negative": -0.0872, "neutral": 0.057 }, "crypto's": { "positive": -0.0625, "negative": 0.1972, "neutral": -0.1347 }, "cryptocurrencies": { "positive": -0.3937, "negative": -0.0748, "neutral": 0.4685 }, "cryptocurrencies $xrp": { "positive": 0.1264, "negative": -0.0351, "neutral": -0.0913 }, "cryptocurrency": { "positive": -0.415, "negative": 0.4375, "neutral": -0.0225 }, "cryptocurrency ban": { "positive": -0.018, "negative": 0.1041, "neutral": -0.0861 }, "cryptocurrency company": { "positive": -0.0344, "negative": -0.0551, "neutral": 0.0895 }, "cryptocurrency exchange": { "positive": 0.3347, "negative": -0.1678, "neutral": -0.1669 }, "cryptocurrency investment": { "positive": -0.0272, "negative": 0.0403, "neutral": -0.0131 }, "cryptocurrency market": { "positive": -0.0571, "negative": -0.2384, "neutral": 0.2955 }, "cryptocurrency mining": { "positive": -0.1527, "negative": -0.1919, "neutral": 0.3446 }, "cryptocurrency pump": { "positive": 0.0691, "negative": -0.0589, "neutral": -0.0101 }, "cryptocurrency scam": { "positive": -0.0332, "negative": 0.1321, "neutral": -0.0988 }, "cryptocurrency trading": { "positive": -0.0698, "negative": 0.2773, "neutral": -0.2075 }, "cryptocurrency transactions": { "positive": -0.0306, "negative": -0.0143, "neutral": 0.0449 }, "cryptographic": { "positive": -0.1765, "negative": -0.1167, "neutral": 0.2932 }, "cryptographically": { "positive": -0.0827, "negative": -0.1233, "neutral": 0.206 }, "cryptography": { "positive": -0.2715, "negative": -0.1513, "neutral": 0.4228 }, "cryptokitties": { "positive": 0.3516, "negative": 0.1306, "neutral": -0.4822 }, "cryptos": { "positive": -0.1133, "negative": 0.412, "neutral": -0.2987 }, "currencies": { "positive": -0.2099, "negative": -0.1325, "neutral": 0.3424 }, "currency": { "positive": 0.3618, "negative": -0.2447, "neutral": -0.1171 }, "current": { "positive": -0.3498, "negative": 0.0188, "neutral": 0.331 }, "currently": { "positive": 0.2576, "negative": -0.1539, "neutral": -0.1038 }, "curve": { "positive": -0.0911, "negative": -0.1221, "neutral": 0.2132 }, "custody": { "positive": 0.4548, "negative": -0.3016, "neutral": -0.1532 }, "custom": { "positive": -0.1762, "negative": -0.1052, "neutral": 0.2814 }, "customer": { "positive": -83e-4, "negative": 0.0296, "neutral": -0.0214 }, "customers": { "positive": -0.1527, "negative": 0.2088, "neutral": -0.0561 }, "cut": { "positive": 0.0379, "negative": 0.11, "neutral": -0.1479 }, "cuts": { "positive": -0.0506, "negative": 0.0475, "neutral": 3e-3 }, "cuts staff": { "positive": -0.0552, "negative": -0.1882, "neutral": 0.2434 }, "cuts workforce": { "positive": -0.061, "negative": 0.1654, "neutral": -0.1044 }, "cycle": { "positive": 0.7381, "negative": -66e-4, "neutral": -0.7315 }, "cz": { "positive": 0.1, "negative": -0.4399, "neutral": 0.3399 }, "cz binance": { "positive": -0.0386, "negative": 0.0292, "neutral": 94e-4 }, "da": { "positive": 0.0761, "negative": -0.0319, "neutral": -0.0442 }, "da db": { "positive": 0.0761, "negative": -0.0319, "neutral": -0.0442 }, "daily": { "positive": -0.1873, "negative": -0.1089, "neutral": 0.2963 }, "damage": { "positive": -0.0435, "negative": 0.0821, "neutral": -0.0386 }, "dangerous": { "positive": -0.0916, "negative": 0.5986, "neutral": -0.507 }, "dao": { "positive": 0.22, "negative": -0.0942, "neutral": -0.1258 }, "dao attacker": { "positive": -0.1273, "negative": 0.1087, "neutral": 0.0186 }, "dao hack": { "positive": -0.0445, "negative": 0.187, "neutral": -0.1426 }, "dao raised": { "positive": 0.4558, "negative": -0.1905, "neutral": -0.2652 }, "daos": { "positive": -0.2504, "negative": -0.3659, "neutral": 0.6163 }, "dapp": { "positive": -0.1065, "negative": -0.1217, "neutral": 0.2282 }, "dark": { "positive": -0.1794, "negative": 0.0827, "neutral": 0.0967 }, "darkside": { "positive": -0.0558, "negative": 0.229, "neutral": -0.1732 }, "dashboard": { "positive": -0.1621, "negative": -0.1025, "neutral": 0.2645 }, "data": { "positive": 0.0207, "negative": -0.2102, "neutral": 0.1895 }, "data breach": { "positive": -0.0621, "negative": 0.1191, "neutral": -0.0569 }, "data center": { "positive": -0.0619, "negative": 0.2598, "neutral": -0.1979 }, "database": { "positive": -0.0583, "negative": 0.3465, "neutral": -0.2882 }, "datadog": { "positive": -0.0447, "negative": -0.1158, "neutral": 0.1605 }, "date": { "positive": -0.0684, "negative": -47e-4, "neutral": 0.0731 }, "day": { "positive": 6e-3, "negative": -0.0215, "neutral": 0.0156 }, "day another": { "positive": -0.0807, "negative": 0.1485, "neutral": -0.0678 }, "day nothing": { "positive": 0.1871, "negative": -0.0871, "neutral": -0.1 }, "day trading": { "positive": 62e-4, "negative": -0.033, "neutral": 0.0268 }, "day week": { "positive": -0.0178, "negative": 0.022, "neutral": -43e-4 }, "days": { "positive": -0.1925, "negative": 0.2433, "neutral": -0.0508 }, "db": { "positive": 0.0409, "negative": -0.0573, "neutral": 0.0164 }, "db ed": { "positive": 0.0761, "negative": -0.0319, "neutral": -0.0442 }, "dca": { "positive": 0.4029, "negative": -0.2233, "neutral": -0.1796 }, "dea": { "positive": -0.0506, "negative": 0.0826, "neutral": -0.032 }, "dead": { "positive": -0.4923, "negative": 1.9083, "neutral": -1.416 }, "dead cat": { "positive": 0.2622, "negative": -0.2309, "neutral": -0.0312 }, "dead man's": { "positive": -0.074, "negative": 0.3322, "neutral": -0.2582 }, "dead money": { "positive": -0.2149, "negative": 0.2764, "neutral": -0.0616 }, "deal": { "positive": 3e-4, "negative": -0.1008, "neutral": 0.1005 }, "dealing": { "positive": -0.0157, "negative": -0.138, "neutral": 0.1537 }, "deals": { "positive": -0.1137, "negative": -0.1002, "neutral": 0.2139 }, "dear": { "positive": 0.1429, "negative": -0.057, "neutral": -0.0859 }, "dear life": { "positive": 0.119, "negative": -0.0111, "neutral": -0.1079 }, "dear sophie": { "positive": 0.0239, "negative": -0.0459, "neutral": 0.022 }, "death": { "positive": -0.0506, "negative": 0.3991, "neutral": -0.3484 }, "debate": { "positive": -0.1593, "negative": -0.1692, "neutral": 0.3285 }, "debt": { "positive": -0.0329, "negative": -0.1013, "neutral": 0.1342 }, "debut": { "positive": 0.1805, "negative": -0.0543, "neutral": -0.1262 }, "decade": { "positive": -0.1053, "negative": -0.0415, "neutral": 0.1468 }, "decades": { "positive": -0.0516, "negative": 0.1561, "neutral": -0.1045 }, "decent": { "positive": 0.1178, "negative": -0.0117, "neutral": -0.1061 }, "decentralization": { "positive": 0.3416, "negative": -0.1259, "neutral": -0.2158 }, "decentralized": { "positive": 0.0577, "negative": -0.539, "neutral": 0.4813 }, "decentralized exchange": { "positive": 0.2371, "negative": -0.1881, "neutral": -0.049 }, "decentralized finance": { "positive": 0.2043, "negative": 18e-4, "neutral": -0.2061 }, "declares": { "positive": -0.1327, "negative": 0.5626, "neutral": -0.43 }, "deep": { "positive": 0.2893, "negative": -0.1776, "neutral": -0.1117 }, "defense": { "positive": -0.0946, "negative": 0.1669, "neutral": -0.0723 }, "defi": { "positive": -0.0556, "negative": 0.3172, "neutral": -0.2616 }, "defi exploit": { "positive": -0.0352, "negative": 0.0936, "neutral": -0.0583 }, "defi hack": { "positive": -0.027, "negative": 0.1065, "neutral": -0.0795 }, "defi protocol": { "positive": -0.1079, "negative": 0.2013, "neutral": -0.0933 }, "defichain": { "positive": 0.0938, "negative": -0.1276, "neutral": 0.0339 }, "defies": { "positive": -0.0463, "negative": -0.066, "neutral": 0.1123 }, "define": { "positive": -0.1327, "negative": -0.1519, "neutral": 0.2845 }, "defined": { "positive": -0.109, "negative": -0.2078, "neutral": 0.3168 }, "defines": { "positive": 0.0463, "negative": -0.1189, "neutral": 0.0726 }, "defining": { "positive": 0.0272, "negative": -0.1602, "neutral": 0.133 }, "definitely": { "positive": 0.066, "negative": -0.0765, "neutral": 0.0105 }, "definition": { "positive": -0.0817, "negative": -0.2185, "neutral": 0.3002 }, "degen": { "positive": 0.1738, "negative": 0.0148, "neutral": -0.1885 }, "delisted": { "positive": -0.2139, "negative": 0.131, "neutral": 0.0829 }, "deliver": { "positive": -0.0903, "negative": 0.2624, "neutral": -0.1721 }, "deliver malware": { "positive": -0.0332, "negative": 0.1067, "neutral": -0.0734 }, "delivering": { "positive": 0.1681, "negative": -0.0348, "neutral": -0.1334 }, "demand": { "positive": 59e-4, "negative": 0.0469, "neutral": -0.0528 }, "department": { "positive": 0.1082, "negative": 79e-4, "neutral": -0.1161 }, "depends": { "positive": -0.0323, "negative": -0.0891, "neutral": 0.1215 }, "depin": { "positive": 0.1232, "negative": -0.0483, "neutral": -0.0748 }, "deposits": { "positive": -0.0611, "negative": 0.4036, "neutral": -0.3426 }, "deposits withdrawals": { "positive": -0.0112, "negative": 0.0591, "neutral": -0.0479 }, "depot": { "positive": -0.0539, "negative": 0.1224, "neutral": -0.0685 }, "depot files": { "positive": -0.0413, "negative": 0.1012, "neutral": -0.0599 }, "derivatives": { "positive": -0.0464, "negative": 0.2426, "neutral": -0.1962 }, "design": { "positive": 0.2059, "negative": -0.4347, "neutral": 0.2289 }, "designed": { "positive": 0.1899, "negative": -0.1128, "neutral": -0.0771 }, "designer": { "positive": -0.1049, "negative": -0.2344, "neutral": 0.3393 }, "desperate": { "positive": -0.1309, "negative": -0.0138, "neutral": 0.1448 }, "despite": { "positive": 0.0178, "negative": 0.0282, "neutral": -0.046 }, "detect": { "positive": -0.0344, "negative": 0.1907, "neutral": -0.1563 }, "detecting": { "positive": 0.0624, "negative": 0.0998, "neutral": -0.1621 }, "detecting cryptocurrency": { "positive": 0.0624, "negative": 0.0998, "neutral": -0.1621 }, "deterministic": { "positive": -0.2293, "negative": -0.2314, "neutral": 0.4608 }, "dev": { "positive": -0.0272, "negative": -0.0574, "neutral": 0.0846 }, "developer": { "positive": -0.2184, "negative": 0.1985, "neutral": 0.0199 }, "developer update": { "positive": -0.0801, "negative": -0.0679, "neutral": 0.148 }, "developers": { "positive": -0.2364, "negative": -96e-4, "neutral": 0.2461 }, "developers release": { "positive": -0.043, "negative": -0.0652, "neutral": 0.1082 }, "development": { "positive": 0.0554, "negative": -0.1528, "neutral": 0.0973 }, "developments": { "positive": -0.0589, "negative": -0.0402, "neutral": 0.0991 }, "devices": { "positive": -0.0383, "negative": 0.1404, "neutral": -0.1021 }, "devs": { "positive": -0.1683, "negative": 0.1202, "neutral": 0.0481 }, "dex": { "positive": -0.0106, "negative": -0.0188, "neutral": 0.0294 }, "dfi": { "positive": 0.0938, "negative": -0.1276, "neutral": 0.0339 }, "dfi defichain": { "positive": 0.0938, "negative": -0.1276, "neutral": 0.0339 }, "didn": { "positive": 0.165, "negative": -0.0222, "neutral": -0.1428 }, "didn't": { "positive": -0.0348, "negative": 0.0725, "neutral": -0.0377 }, "die": { "positive": -0.3495, "negative": 0.4245, "neutral": -0.075 }, "dies": { "positive": -0.0675, "negative": 0.0295, "neutral": 0.038 }, "difference": { "positive": -0.1296, "negative": -0.2471, "neutral": 0.3767 }, "different": { "positive": 0.1678, "negative": -0.0596, "neutral": -0.1081 }, "different crypto": { "positive": 0.0884, "negative": 0.0259, "neutral": -0.1144 }, "difficulty": { "positive": -0.2181, "negative": 0.0546, "neutral": 0.1634 }, "difficulty drops": { "positive": -0.0443, "negative": 0.2855, "neutral": -0.2412 }, "digital": { "positive": 0.1071, "negative": -0.2097, "neutral": 0.1026 }, "digital asset": { "positive": -0.119, "negative": 0.0187, "neutral": 0.1003 }, "digital assets": { "positive": 0.6152, "negative": -0.1948, "neutral": -0.4203 }, "digital currency": { "positive": -0.0499, "negative": -0.0574, "neutral": 0.1073 }, "digital dogshit": { "positive": -0.0737, "negative": 0.2717, "neutral": -0.198 }, "digital gold": { "positive": 0.1092, "negative": -0.0302, "neutral": -0.079 }, "digital silver": { "positive": -0.1658, "negative": -0.0309, "neutral": 0.1967 }, "digits": { "positive": 25e-4, "negative": -0.0531, "neutral": 0.0506 }, "dilution": { "positive": 92e-4, "negative": 0.0637, "neutral": -0.0729 }, "dip": { "positive": 0.3666, "negative": -0.5112, "neutral": 0.1446 }, "dip cardano": { "positive": 0.0297, "negative": -0.0131, "neutral": -0.0167 }, "dip ripple": { "positive": 0.0253, "negative": -99e-4, "neutral": -0.0154 }, "dip solana": { "positive": 0.0222, "negative": -91e-4, "neutral": -0.013 }, "dip xrp": { "positive": 0.0323, "negative": -0.0132, "neutral": -0.0192 }, "direction": { "positive": -0.1667, "negative": -0.1798, "neutral": 0.3465 }, "direction yet": { "positive": -0.1312, "negative": -0.171, "neutral": 0.3022 }, "dirty": { "positive": -0.1861, "negative": 0.1024, "neutral": 0.0837 }, "disables": { "positive": -0.0516, "negative": -0.3503, "neutral": 0.4019 }, "disaster": { "positive": -0.2308, "negative": 1.1134, "neutral": -0.8826 }, "disclosure": { "positive": -0.1381, "negative": -0.2814, "neutral": 0.4194 }, "discord": { "positive": -0.039, "negative": -0.1156, "neutral": 0.1546 }, "discount": { "positive": 0.0184, "negative": 0.1267, "neutral": -0.145 }, "discovery": { "positive": 0.0165, "negative": -0.1092, "neutral": 0.0926 }, "discussion": { "positive": 43e-4, "negative": -0.172, "neutral": 0.1677 }, "dismiss": { "positive": -0.0269, "negative": 0.1393, "neutral": -0.1124 }, "distributed": { "positive": -0.122, "negative": 0.2215, "neutral": -0.0995 }, "dive": { "positive": -0.1753, "negative": 0.0393, "neutral": 0.136 }, "divergence": { "positive": 0.0821, "negative": 0.1154, "neutral": -0.1975 }, "divergence daily": { "positive": 0.0126, "negative": 0.1799, "neutral": -0.1925 }, "dm": { "positive": -0.0216, "negative": 0.0274, "neutral": -58e-4 }, "documentation": { "positive": -0.1411, "negative": -0.1712, "neutral": 0.3123 }, "doesn": { "positive": -0.0501, "negative": 0.1803, "neutral": -0.1302 }, "doesn't": { "positive": -0.1516, "negative": 0.1328, "neutral": 0.0188 }, "dog": { "positive": 0.1247, "negative": 0.1265, "neutral": -0.2512 }, "dog shit": { "positive": -0.1204, "negative": 0.2207, "neutral": -0.1003 }, "doge": { "positive": -0.1204, "negative": -0.0349, "neutral": 0.1553 }, "doge all": { "positive": -0.0425, "negative": 0.0475, "neutral": -51e-4 }, "doge breaking": { "positive": 0.0764, "negative": -0.0288, "neutral": -0.0476 }, "doge buy": { "positive": -0.0588, "negative": 0.0504, "neutral": 83e-4 }, "doge here": { "positive": 0.0586, "negative": -0.0136, "neutral": -0.045 }, "doge news": { "positive": -0.0176, "negative": -0.0144, "neutral": 0.032 }, "doge surges": { "positive": 0.0219, "negative": -66e-4, "neutral": -0.0153 }, "doge trading": { "positive": -0.0237, "negative": -0.019, "neutral": 0.0427 }, "doge volume": { "positive": 0.0263, "negative": -0.0125, "neutral": -0.0138 }, "dogecoin": { "positive": -52e-4, "negative": -0.2534, "neutral": 0.2586 }, "dogshit": { "positive": -0.0737, "negative": 0.2717, "neutral": -0.198 }, "doing": { "positive": 0.0389, "negative": -0.2027, "neutral": 0.1639 }, "doj": { "positive": -0.1255, "negative": 0.3456, "neutral": -0.2201 }, "doj seizes": { "positive": -0.036, "negative": 0.1561, "neutral": -0.1201 }, "dollar": { "positive": -0.3265, "negative": -0.1281, "neutral": 0.4546 }, "dollars": { "positive": -0.1196, "negative": 0.1596, "neutral": -0.04 }, "domain": { "positive": -0.0977, "negative": -0.0171, "neutral": 0.1148 }, "dominance": { "positive": -0.0143, "negative": -0.2302, "neutral": 0.2445 }, "don": { "positive": 0.0573, "negative": 0.0595, "neutral": -0.1167 }, "don fade": { "positive": 0.0925, "negative": -0.0115, "neutral": -0.081 }, "don sleep": { "positive": -0.1161, "negative": -0.0535, "neutral": 0.1696 }, "don think": { "positive": 0.0588, "negative": -0.0288, "neutral": -0.03 }, "don't": { "positive": 0.2391, "negative": 0.1608, "neutral": -0.3998 }, "don't know": { "positive": -0.0124, "negative": 0.0326, "neutral": -0.0201 }, "donations": { "positive": -0.0322, "negative": -0.1882, "neutral": 0.2204 }, "done": { "positive": 17e-4, "negative": -0.0447, "neutral": 0.043 }, "dont": { "positive": 0.2047, "negative": -0.07, "neutral": -0.1347 }, "doom": { "positive": -0.1015, "negative": 0.5561, "neutral": -0.4546 }, "doomed": { "positive": -0.2082, "negative": 1.0994, "neutral": -0.8912 }, "doomed fail": { "positive": -0.0884, "negative": 0.4, "neutral": -0.3117 }, "door": { "positive": -0.1079, "negative": 0.061, "neutral": 0.0469 }, "dosent": { "positive": 0.0206, "negative": -0.0104, "neutral": -0.0103 }, "dosent feel": { "positive": 0.0206, "negative": -0.0104, "neutral": -0.0103 }, "dot": { "positive": -0.0508, "negative": 0.2532, "neutral": -0.2024 }, "dots": { "positive": 0.3572, "negative": -0.1134, "neutral": -0.2438 }, "double": { "positive": -0.0548, "negative": 0.1985, "neutral": -0.1436 }, "doubled": { "positive": 0.2575, "negative": -0.2038, "neutral": -0.0537 }, "down": { "positive": -0.367, "negative": 1.4649, "neutral": -1.098 }, "down due": { "positive": -0.0215, "negative": 0.0413, "neutral": -0.0199 }, "down goes": { "positive": -0.0496, "negative": 0.0948, "neutral": -0.0452 }, "down not": { "positive": -0.0498, "negative": 0.1931, "neutral": -0.1433 }, "download": { "positive": 0.0358, "negative": 0.072, "neutral": -0.1078 }, "downtrend": { "positive": -0.1772, "negative": 0.5478, "neutral": -0.3706 }, "dprk": { "positive": -0.0263, "negative": 0.0801, "neutral": -0.0537 }, "drain": { "positive": -0.0283, "negative": 0.1096, "neutral": -0.0814 }, "drained": { "positive": -0.2205, "negative": 0.5659, "neutral": -0.3455 }, "drained funds": { "positive": -0.0152, "negative": 0.0292, "neutral": -0.014 }, "drains": { "positive": 0.0598, "negative": 0.107, "neutral": -0.1669 }, "dream": { "positive": 0.0418, "negative": -0.0823, "neutral": 0.0406 }, "dried": { "positive": -0.1864, "negative": 0.4028, "neutral": -0.2164 }, "dried up": { "positive": -0.1864, "negative": 0.4028, "neutral": -0.2164 }, "driven": { "positive": -0.0928, "negative": -84e-4, "neutral": 0.1012 }, "drop": { "positive": -0.1646, "negative": 0.5971, "neutral": -0.4326 }, "dropped": { "positive": 0.2082, "negative": -0.063, "neutral": -0.1452 }, "dropped sharply": { "positive": 0.2082, "negative": -0.063, "neutral": -0.1452 }, "drops": { "positive": -0.1112, "negative": 0.5668, "neutral": -0.4555 }, "drug": { "positive": -0.1783, "negative": 0.1425, "neutral": 0.0358 }, "duck": { "positive": 0.1475, "negative": -0.0878, "neutral": -0.0597 }, "dude": { "positive": -0.1506, "negative": 0.2132, "neutral": -0.0626 }, "due": { "positive": -0.0662, "negative": 0.0346, "neutral": 0.0316 }, "dumb": { "positive": -0.1815, "negative": 0.6045, "neutral": -0.423 }, "dump": { "positive": -0.5266, "negative": 1.3849, "neutral": -0.8584 }, "dump shit": { "positive": -0.0433, "negative": 0.0533, "neutral": -0.01 }, "dumped": { "positive": -0.177, "negative": 0.7374, "neutral": -0.5604 }, "dumped millions": { "positive": -0.0882, "negative": 0.241, "neutral": -0.1528 }, "dumping": { "positive": -0.3525, "negative": 1.0977, "neutral": -0.7452 }, "dumping $sol": { "positive": -0.0434, "negative": 0.0692, "neutral": -0.0257 }, "dumping ada": { "positive": -0.0469, "negative": 0.0891, "neutral": -0.0422 }, "dumping altcoins": { "positive": -0.0302, "negative": 0.0624, "neutral": -0.0321 }, "dumping bnb": { "positive": -0.0253, "negative": 0.0547, "neutral": -0.0294 }, "dumping btc": { "positive": 0.1638, "negative": -0.0442, "neutral": -0.1195 }, "dumping buy": { "positive": -0.1337, "negative": 0.1745, "neutral": -0.0408 }, "dumping crypto": { "positive": -0.0236, "negative": 0.044, "neutral": -0.0204 }, "dumping doge": { "positive": -0.0313, "negative": 0.0701, "neutral": -0.0388 }, "dumping ing": { "positive": -0.0703, "negative": 0.1802, "neutral": -0.11 }, "dumping link": { "positive": -0.0423, "negative": 0.0832, "neutral": -0.041 }, "dumping ripple": { "positive": -0.0686, "negative": 0.1143, "neutral": -0.0457 }, "dumping sol": { "positive": -0.028, "negative": 0.0559, "neutral": -0.0279 }, "dumping xrp": { "positive": -0.0219, "negative": 0.0415, "neutral": -0.0196 }, "dumps": { "positive": -0.2288, "negative": 1.0885, "neutral": -0.8597 }, "dust": { "positive": -0.0925, "negative": -0.1665, "neutral": 0.2589 }, "dying": { "positive": -0.2119, "negative": 0.8033, "neutral": -0.5915 }, "each": { "positive": 0.0711, "negative": 15e-4, "neutral": -0.0727 }, "earlier": { "positive": -0.1037, "negative": 0.1497, "neutral": -0.046 }, "earlier failed": { "positive": -0.0126, "negative": 0.0426, "neutral": -0.03 }, "early": { "positive": 0.4588, "negative": 0.0909, "neutral": -0.5497 }, "earn": { "positive": -0.0595, "negative": -0.1096, "neutral": 0.1691 }, "earnings": { "positive": -0.0693, "negative": -0.1763, "neutral": 0.2456 }, "earnings call": { "positive": -0.0509, "negative": -0.151, "neutral": 0.2019 }, "ease": { "positive": -0.1131, "negative": -0.2171, "neutral": 0.3302 }, "easiest": { "positive": -0.0393, "negative": -0.0226, "neutral": 0.0619 }, "easily": { "positive": -0.1786, "negative": -0.0531, "neutral": 0.2317 }, "easy": { "positive": 0.1897, "negative": 41e-4, "neutral": -0.1938 }, "easy money": { "positive": -0.0493, "negative": 0.0945, "neutral": -0.0452 }, "ec": { "positive": 0.0861, "negative": -0.0314, "neutral": -0.0546 }, "ec af": { "positive": 0.0861, "negative": -0.0314, "neutral": -0.0546 }, "eco": { "positive": 0.0239, "negative": -54e-4, "neutral": -0.0185 }, "economic": { "positive": -0.3475, "negative": -11e-4, "neutral": 0.3486 }, "economics": { "positive": 2e-3, "negative": 0.0417, "neutral": -0.0436 }, "economy": { "positive": -0.0253, "negative": 0.1815, "neutral": -0.1562 }, "ecosystem": { "positive": -0.0328, "negative": -0.116, "neutral": 0.1488 }, "ed": { "positive": 0.1281, "negative": -0.0397, "neutral": -0.0884 }, "ed ba": { "positive": 0.0761, "negative": -0.0319, "neutral": -0.0442 }, "educational": { "positive": -0.0829, "negative": -0.1995, "neutral": 0.2824 }, "efficient": { "positive": 0.1607, "negative": -0.1656, "neutral": 49e-4 }, "eggs": { "positive": -0.0213, "negative": -0.1352, "neutral": 0.1565 }, "eiejem": { "positive": 0.2497, "negative": -0.0442, "neutral": -0.2055 }, "eiejem rggtracxfrge": { "positive": 0.2497, "negative": -0.0442, "neutral": -0.2055 }, "el": { "positive": -0.1386, "negative": 0.2071, "neutral": -0.0685 }, "el salvador": { "positive": -0.1386, "negative": 0.2071, "neutral": -0.0685 }, "elon": { "positive": -0.0947, "negative": 0.1729, "neutral": -0.0782 }, "em": { "positive": -0.0496, "negative": 0.3737, "neutral": -0.3241 }, "emails": { "positive": -0.0441, "negative": -0.0494, "neutral": 0.0935 }, "emergency": { "positive": -0.0588, "negative": 0.1765, "neutral": -0.1177 }, "emissions": { "positive": -0.2683, "negative": -0.1762, "neutral": 0.4445 }, "employees": { "positive": -0.1258, "negative": -0.1963, "neutral": 0.3221 }, "emulator": { "positive": -0.1103, "negative": 0.2437, "neutral": -0.1334 }, "encouraging": { "positive": -0.116, "negative": 0.0881, "neutral": 0.0279 }, "encrypted": { "positive": -0.0999, "negative": 0.0316, "neutral": 0.0683 }, "encryption": { "positive": -0.0282, "negative": -0.0817, "neutral": 0.11 }, "end": { "positive": -0.0642, "negative": -0.3004, "neutral": 0.3646 }, "end encrypted": { "positive": -0.0225, "negative": -0.0271, "neutral": 0.0496 }, "end end": { "positive": -0.0247, "negative": -0.0306, "neutral": 0.0553 }, "ending": { "positive": 0.2237, "negative": -0.1404, "neutral": -0.0833 }, "ends": { "positive": -0.0652, "negative": -0.1459, "neutral": 0.2112 }, "energy": { "positive": 0.0684, "negative": -0.5084, "neutral": 0.44 }, "engine": { "positive": 91e-4, "negative": -0.1634, "neutral": 0.1544 }, "engineer": { "positive": -0.0287, "negative": 0.1256, "neutral": -0.097 }, "engineer pleads": { "positive": -0.0287, "negative": 0.1256, "neutral": -0.097 }, "enjoy": { "positive": -0.0175, "negative": 0.2074, "neutral": -0.1899 }, "enough": { "positive": -0.0902, "negative": -0.2039, "neutral": 0.2942 }, "enough hold": { "positive": 0.0717, "negative": -0.0619, "neutral": -98e-4 }, "enterprise": { "positive": 0.072, "negative": -0.0418, "neutral": -0.0302 }, "entire": { "positive": -0.0706, "negative": 0.2606, "neutral": -0.1899 }, "entire defi": { "positive": -0.0699, "negative": 0.1623, "neutral": -0.0924 }, "entry": { "positive": 0.5197, "negative": -0.0993, "neutral": -0.4204 }, "entry point": { "positive": 0.343, "negative": -0.0698, "neutral": -0.2732 }, "environment": { "positive": -0.1426, "negative": 0.3589, "neutral": -0.2163 }, "environmental": { "positive": -0.0265, "negative": 0.1899, "neutral": -0.1634 }, "environmental impact": { "positive": -0.1411, "negative": 0.0401, "neutral": 0.1009 }, "era": { "positive": 0.2723, "negative": -0.1263, "neutral": -0.1461 }, "established": { "positive": -0.1939, "negative": -0.0817, "neutral": 0.2756 }, "etf": { "positive": 0.4026, "negative": -0.3791, "neutral": -0.0234 }, "etf approval": { "positive": 0.1616, "negative": -0.0576, "neutral": -0.104 }, "etf inflows": { "positive": 0.2678, "negative": -0.0906, "neutral": -0.1772 }, "etfs": { "positive": 0.2624, "negative": 0.0557, "neutral": -0.318 }, "eth": { "positive": 0.132, "negative": 0.0108, "neutral": -0.1428 }, "eth all": { "positive": -0.0491, "negative": 0.053, "neutral": -4e-3 }, "eth breaking": { "positive": 0.0612, "negative": -0.0307, "neutral": -0.0305 }, "eth crashes": { "positive": -0.0319, "negative": 0.0712, "neutral": -0.0393 }, "eth fees": { "positive": 0.0686, "negative": -78e-4, "neutral": -0.0607 }, "eth fundamentals": { "positive": -0.0118, "negative": 0.0358, "neutral": -0.0239 }, "eth getting": { "positive": -0.0199, "negative": 0.0324, "neutral": -0.0126 }, "eth here": { "positive": -58e-4, "negative": -0.048, "neutral": 0.0538 }, "eth news": { "positive": -0.0257, "negative": -0.0153, "neutral": 0.041 }, "eth trading": { "positive": -0.0383, "negative": -0.0252, "neutral": 0.0635 }, "ether": { "positive": 0.1159, "negative": 0.1717, "neutral": -0.2876 }, "ethereum": { "positive": -0.0722, "negative": -0.2057, "neutral": 0.2779 }, "ethereum all": { "positive": -0.0412, "negative": 0.0579, "neutral": -0.0167 }, "ethereum based": { "positive": -0.1278, "negative": 0.1049, "neutral": 0.0229 }, "ethereum blockchain": { "positive": -0.0484, "negative": 0.0309, "neutral": 0.0175 }, "ethereum breaking": { "positive": 0.0737, "negative": -0.0292, "neutral": -0.0445 }, "ethereum buy": { "positive": -0.0457, "negative": 0.0333, "neutral": 0.0125 }, "ethereum chart": { "positive": 43e-4, "negative": 0.0273, "neutral": -0.0316 }, "ethereum classic": { "positive": 0.1422, "negative": -0.023, "neutral": -0.1193 }, "ethereum co": { "positive": -0.068, "negative": -0.0233, "neutral": 0.0912 }, "ethereum community": { "positive": -0.0975, "negative": 0.1929, "neutral": -0.0955 }, "ethereum contracts": { "positive": -0.0557, "negative": 0.1293, "neutral": -0.0736 }, "ethereum crashes": { "positive": -0.0211, "negative": 0.0578, "neutral": -0.0366 }, "ethereum devs": { "positive": -0.1023, "negative": -0.1241, "neutral": 0.2265 }, "ethereum etf": { "positive": 0.0355, "negative": -97e-4, "neutral": -0.0258 }, "ethereum fundamentals": { "positive": -7e-4, "negative": 0.0226, "neutral": -0.0219 }, "ethereum getting": { "positive": -0.0143, "negative": 0.0439, "neutral": -0.0296 }, "ethereum network": { "positive": -0.0322, "negative": 0.0277, "neutral": 45e-4 }, "ethereum news": { "positive": -0.0131, "negative": -94e-4, "neutral": 0.0225 }, "ethereum price": { "positive": 0.0928, "negative": -0.1194, "neutral": 0.0266 }, "ethereum trading": { "positive": -0.019, "negative": -0.0127, "neutral": 0.0317 }, "ethereum's": { "positive": -0.1926, "negative": 0.0384, "neutral": 0.1542 }, "eu": { "positive": -0.0784, "negative": -0.0682, "neutral": 0.1466 }, "euro": { "positive": -0.1662, "negative": 0.0418, "neutral": 0.1244 }, "europe": { "positive": -0.0227, "negative": -0.3023, "neutral": 0.325 }, "even": { "positive": 0.1929, "negative": -0.1632, "neutral": -0.0297 }, "even more": { "positive": -0.0717, "negative": 0.2336, "neutral": -0.1618 }, "event": { "positive": 0.2251, "negative": -0.1144, "neutral": -0.1108 }, "ever": { "positive": 0.3689, "negative": -0.1229, "neutral": -0.246 }, "ever created": { "positive": -0.0657, "negative": 0.0292, "neutral": 0.0365 }, "ever seen": { "positive": -0.0467, "negative": 0.1253, "neutral": -0.0787 }, "every": { "positive": -0.1326, "negative": 0.3522, "neutral": -0.2195 }, "every coin": { "positive": -0.12, "negative": 0.1218, "neutral": -17e-4 }, "every day": { "positive": -0.0752, "negative": 0.183, "neutral": -0.1077 }, "every other": { "positive": -0.082, "negative": 0.2525, "neutral": -0.1705 }, "every time": { "positive": -0.0434, "negative": 0.1957, "neutral": -0.1523 }, "every week": { "positive": -0.0385, "negative": -0.0732, "neutral": 0.1117 }, "everybody": { "positive": 0.0817, "negative": -0.1094, "neutral": 0.0277 }, "everyone": { "positive": -0.2692, "negative": -0.0329, "neutral": 0.3022 }, "everyone dumping": { "positive": -0.4722, "negative": 0.8904, "neutral": -0.4182 }, "everything": { "positive": 0.3267, "negative": -0.0731, "neutral": -0.2536 }, "everywhere": { "positive": 0.1121, "negative": -0.1975, "neutral": 0.0854 }, "evil": { "positive": 0.0939, "negative": -0.2718, "neutral": 0.178 }, "evolution": { "positive": -0.0994, "negative": 0.3249, "neutral": -0.2255 }, "ex": { "positive": -0.0919, "negative": 0.0542, "neutral": 0.0377 }, "ex terra": { "positive": -0.0126, "negative": 0.0426, "neutral": -0.03 }, "exactly": { "positive": 0.4879, "negative": 0.0984, "neutral": -0.5863 }, "exch": { "positive": -0.0125, "negative": 0.0766, "neutral": -0.0641 }, "exchange": { "positive": -0.3113, "negative": 0.2177, "neutral": 0.0937 }, "exchange aax": { "positive": -0.0192, "negative": 0.1873, "neutral": -0.168 }, "exchange announces": { "positive": 0.4004, "negative": 0.0409, "neutral": -0.4413 }, "exchange backed": { "positive": -0.0222, "negative": 0.0394, "neutral": -0.0172 }, "exchange binance": { "positive": -0.0578, "negative": -0.4943, "neutral": 0.5521 }, "exchange bittrex": { "positive": -0.0305, "negative": -59e-4, "neutral": 0.0364 }, "exchange bitzlato": { "positive": -0.015, "negative": 0.2921, "neutral": -0.2771 }, "exchange bybit": { "positive": -85e-4, "negative": 0.0634, "neutral": -0.0549 }, "exchange coinbase": { "positive": -0.0289, "negative": -0.1364, "neutral": 0.1653 }, "exchange coindcx": { "positive": -97e-4, "negative": 0.0437, "neutral": -0.034 }, "exchange collapse": { "positive": -0.0179, "negative": 0.1855, "neutral": -0.1677 }, "exchange ftx": { "positive": -0.0277, "negative": 0.0974, "neutral": -0.0696 }, "exchange got": { "positive": -0.0292, "negative": 0.0412, "neutral": -0.012 }, "exchange hacked": { "positive": -0.0312, "negative": 0.1115, "neutral": -0.0803 }, "exchange kraken": { "positive": -0.0323, "negative": 0.1649, "neutral": -0.1326 }, "exchange listings": { "positive": 0.2098, "negative": -0.0978, "neutral": -0.1119 }, "exchange nobitex": { "positive": -0.0102, "negative": 0.053, "neutral": -0.0428 }, "exchange suspends": { "positive": -0.0173, "negative": 0.0882, "neutral": -0.0709 }, "exchange wazirx": { "positive": -0.0287, "negative": 0.0725, "neutral": -0.0438 }, "exchanges": { "positive": -0.083, "negative": 0.2705, "neutral": -0.1875 }, "exchanges volume": { "positive": -72e-4, "negative": 0.0812, "neutral": -0.0739 }, "execs": { "positive": -0.0396, "negative": 0.2309, "neutral": -0.1913 }, "executives": { "positive": -0.0594, "negative": 0.4083, "neutral": -0.3488 }, "executives arrested": { "positive": -0.0264, "negative": 0.1401, "neutral": -0.1137 }, "exit": { "positive": -0.1726, "negative": 0.0919, "neutral": 0.0807 }, "exit scam": { "positive": -0.0189, "negative": 0.0854, "neutral": -0.0665 }, "expect": { "positive": 0.0585, "negative": 0.1577, "neutral": -0.2162 }, "expected": { "positive": 19e-4, "negative": 0.2007, "neutral": -0.2026 }, "expected range": { "positive": 0.1034, "negative": -0.0993, "neutral": -42e-4 }, "expects": { "positive": -0.1417, "negative": -0.0329, "neutral": 0.1746 }, "experiment": { "positive": 0.4811, "negative": -0.2327, "neutral": -0.2484 }, "expert": { "positive": -0.0427, "negative": 0.1885, "neutral": -0.1458 }, "experts": { "positive": -0.1425, "negative": 0.1461, "neutral": -36e-4 }, "explained": { "positive": 0.2094, "negative": -0.2466, "neutral": 0.0372 }, "explode": { "positive": 1.153, "negative": -0.3547, "neutral": -0.7983 }, "exploding": { "positive": 1.2439, "negative": -0.4498, "neutral": -0.7941 }, "exploit": { "positive": -0.4879, "negative": 1.5212, "neutral": -1.0333 }, "exploit drains": { "positive": -0.0494, "negative": 0.0922, "neutral": -0.0428 }, "exploit polygon": { "positive": -0.0352, "negative": 0.0936, "neutral": -0.0583 }, "exploited": { "positive": -0.1809, "negative": 0.7857, "neutral": -0.6048 }, "exploiting": { "positive": -0.0277, "negative": 0.1206, "neutral": -0.093 }, "exposes": { "positive": -0.092, "negative": 0.0598, "neutral": 0.0322 }, "extension": { "positive": 0.367, "negative": -0.2005, "neutral": -0.1664 }, "eye": { "positive": 0.0449, "negative": -0.1716, "neutral": 0.1266 }, "eyes": { "positive": -52e-4, "negative": 0.1281, "neutral": -0.1229 }, "fa": { "positive": 0.0765, "negative": 45e-4, "neutral": -0.081 }, "face": { "positive": -0.2796, "negative": 0.0856, "neutral": 0.194 }, "facebook": { "positive": 0.1137, "negative": -0.1759, "neutral": 0.0622 }, "facebook's": { "positive": -0.058, "negative": 0.0177, "neutral": 0.0402 }, "facebook's libra": { "positive": -0.058, "negative": 0.0177, "neutral": 0.0402 }, "faces": { "positive": -0.2344, "negative": 0.0979, "neutral": 0.1365 }, "faces lawsuit": { "positive": -0.0207, "negative": 0.1775, "neutral": -0.1568 }, "facts": { "positive": -0.161, "negative": 0.0462, "neutral": 0.1148 }, "fade": { "positive": 21e-4, "negative": 0.2516, "neutral": -0.2537 }, "fades": { "positive": -0.0255, "negative": 0.126, "neutral": -0.1005 }, "fail": { "positive": -0.0884, "negative": 0.4, "neutral": -0.3117 }, "failed": { "positive": -0.4901, "negative": 1.3584, "neutral": -0.8683 }, "failed crypto": { "positive": -76e-4, "negative": 0.0923, "neutral": -0.0847 }, "failed stablecoin": { "positive": -0.0126, "negative": 0.0426, "neutral": -0.03 }, "failing": { "positive": -0.1392, "negative": 0.7262, "neutral": -0.5871 }, "fails": { "positive": -0.2016, "negative": 1.2076, "neutral": -1.006 }, "failure": { "positive": -0.3173, "negative": 0.9443, "neutral": -0.627 }, "failures": { "positive": -0.0551, "negative": 0.1577, "neutral": -0.1026 }, "fair": { "positive": -0.0417, "negative": 0.0172, "neutral": 0.0245 }, "fake": { "positive": -0.529, "negative": 1.8111, "neutral": -1.2822 }, "fake tesla": { "positive": -0.0232, "negative": 0.1306, "neutral": -0.1074 }, "fall": { "positive": -0.4858, "negative": 0.451, "neutral": 0.0348 }, "falling": { "positive": -0.3741, "negative": 0.5921, "neutral": -0.218 }, "falling wedge": { "positive": -0.1492, "negative": 0.2626, "neutral": -0.1134 }, "falls": { "positive": -0.1644, "negative": 0.3785, "neutral": -0.2141 }, "fam": { "positive": 0.0946, "negative": -0.019, "neutral": -0.0756 }, "families": { "positive": 0.2661, "negative": 0.116, "neutral": -0.382 }, "family": { "positive": -0.0727, "negative": 0.0366, "neutral": 0.0361 }, "fan": { "positive": -0.0273, "negative": 0.0708, "neutral": -0.0435 }, "faq": { "positive": -0.0655, "negative": -0.0956, "neutral": 0.1611 }, "far": { "positive": -0.1004, "negative": -0.1698, "neutral": 0.2702 }, "farm": { "positive": -0.164, "negative": 0.1913, "neutral": -0.0273 }, "farm aih": { "positive": -0.164, "negative": 0.1913, "neutral": -0.0273 }, "fashion": { "positive": -0.0358, "negative": 0.085, "neutral": -0.0493 }, "fast": { "positive": 0.3297, "negative": -0.3012, "neutral": -0.0286 }, "faster": { "positive": 0.3145, "negative": -0.0838, "neutral": -0.2307 }, "faster than": { "positive": 0.137, "negative": -0.0339, "neutral": -0.1031 }, "favorite": { "positive": 0.0843, "negative": -0.2528, "neutral": 0.1685 }, "favorite staking": { "positive": 0.0537, "negative": -0.0413, "neutral": -0.0125 }, "favorites": { "positive": 0.1794, "negative": -0.0844, "neutral": -0.095 }, "fbi": { "positive": -0.1064, "negative": 0.2473, "neutral": -0.1409 }, "fbnsx": { "positive": 0.2497, "negative": -0.0442, "neutral": -0.2055 }, "fbnsx eiejem": { "positive": 0.2497, "negative": -0.0442, "neutral": -0.2055 }, "fear": { "positive": -0.5088, "negative": 0.9474, "neutral": -0.4386 }, "fears": { "positive": -0.0267, "negative": 0.1533, "neutral": -0.1267 }, "feature": { "positive": -0.0187, "negative": -0.051, "neutral": 0.0697 }, "features": { "positive": -0.1394, "negative": -0.1883, "neutral": 0.3278 }, "fed": { "positive": 0.0777, "negative": 0.2604, "neutral": -0.3381 }, "federal": { "positive": -0.015, "negative": 0.0276, "neutral": -0.0126 }, "feds": { "positive": -0.1047, "negative": 0.0192, "neutral": 0.0855 }, "feds seized": { "positive": -0.0596, "negative": 0.2277, "neutral": -0.1681 }, "fee": { "positive": 0.7161, "negative": -0.1716, "neutral": -0.5445 }, "feedback": { "positive": 0.0918, "negative": -0.1147, "neutral": 0.0229 }, "feel": { "positive": 0.2029, "negative": 0.2413, "neutral": -0.4442 }, "feel good": { "positive": 0.3166, "negative": -0.0444, "neutral": -0.2722 }, "feel like": { "positive": 0.0878, "negative": -0.0509, "neutral": -0.0369 }, "feels": { "positive": 0.2353, "negative": -0.0716, "neutral": -0.1637 }, "feels good": { "positive": 0.0654, "negative": -0.021, "neutral": -0.0444 }, "fees": { "positive": 0.845, "negative": -0.5491, "neutral": -0.2958 }, "fees dropped": { "positive": 0.2082, "negative": -0.063, "neutral": -0.1452 }, "few": { "positive": 0.1351, "negative": -0.1253, "neutral": -99e-4 }, "few months": { "positive": 0.045, "negative": -59e-4, "neutral": -0.0391 }, "fiat": { "positive": 0.2415, "negative": -0.4174, "neutral": 0.176 }, "fidelity": { "positive": -0.0411, "negative": -0.1909, "neutral": 0.232 }, "figures": { "positive": -0.0141, "negative": -0.0874, "neutral": 0.1015 }, "fil": { "positive": -0.1318, "negative": -0.1636, "neutral": 0.2954 }, "file": { "positive": -0.1993, "negative": -0.1736, "neutral": 0.3729 }, "file coin": { "positive": 0.0591, "negative": -0.0235, "neutral": -0.0356 }, "filed": { "positive": -0.0216, "negative": 0.0438, "neutral": -0.0223 }, "filed lawsuit": { "positive": -0.0202, "negative": 0.0375, "neutral": -0.0174 }, "files": { "positive": -0.0605, "negative": 0.3037, "neutral": -0.2432 }, "files bankruptcy": { "positive": -0.105, "negative": 0.4713, "neutral": -0.3663 }, "files charges": { "positive": -92e-4, "negative": 0.0507, "neutral": -0.0415 }, "filing": { "positive": -0.0994, "negative": 0.0532, "neutral": 0.0462 }, "filings": { "positive": 0.0812, "negative": 0.0558, "neutral": -0.137 }, "filling": { "positive": -0.0502, "negative": -0.1592, "neutral": 0.2094 }, "final": { "positive": -0.0952, "negative": 0.2007, "neutral": -0.1055 }, "finally": { "positive": 0.7777, "negative": -0.1316, "neutral": -0.6462 }, "finance": { "positive": -0.0382, "negative": 0.2209, "neutral": -0.1826 }, "finance app": { "positive": -0.0331, "negative": -0.0348, "neutral": 0.0678 }, "finance bitcoin": { "positive": 0.1069, "negative": -0.0856, "neutral": -0.0213 }, "finances": { "positive": -0.1306, "negative": 0.094, "neutral": 0.0366 }, "financial": { "positive": -0.3989, "negative": 0.2378, "neutral": 0.1611 }, "financial advice": { "positive": -0.0532, "negative": 0.177, "neutral": -0.1238 }, "financial crisis": { "positive": -0.0419, "negative": 0.313, "neutral": -0.2712 }, "financial system": { "positive": -0.0363, "negative": 0.0497, "neutral": -0.0134 }, "find": { "positive": 0.0931, "negative": 0.1691, "neutral": -0.2622 }, "finds": { "positive": 93e-4, "negative": 0.2073, "neutral": -0.2166 }, "fine": { "positive": 0.0372, "negative": 0.0568, "neutral": -0.0941 }, "fines": { "positive": -0.2761, "negative": 0.4709, "neutral": -0.1948 }, "fintech": { "positive": 0.6297, "negative": -0.2468, "neutral": -0.3829 }, "fire": { "positive": -0.1434, "negative": -0.0106, "neutral": 0.154 }, "firm": { "positive": 0.2752, "negative": 0.1855, "neutral": -0.4608 }, "firm soar": { "positive": 0.1355, "negative": -0.0867, "neutral": -0.0488 }, "firms": { "positive": -0.0459, "negative": 0.1499, "neutral": -0.104 }, "first": { "positive": 0.0969, "negative": -0.4767, "neutral": 0.3799 }, "first bitcoin": { "positive": -0.1701, "negative": -0.0947, "neutral": 0.2648 }, "first crypto": { "positive": -0.0642, "negative": -0.1084, "neutral": 0.1726 }, "first day": { "positive": 0.0315, "negative": 0.2489, "neutral": -0.2804 }, "first ever": { "positive": 0.0883, "negative": -0.0847, "neutral": -35e-4 }, "first impressions": { "positive": -0.0612, "negative": -0.0566, "neutral": 0.1178 }, "first quarter": { "positive": -0.0838, "negative": 0.0109, "neutral": 0.0729 }, "first time": { "positive": 0.1927, "negative": -0.0595, "neutral": -0.1332 }, "five": { "positive": -0.0104, "negative": 0.1576, "neutral": -0.1471 }, "fix": { "positive": -0.1819, "negative": -0.0577, "neutral": 0.2396 }, "flag": { "positive": -0.1098, "negative": 0.2304, "neutral": -0.1206 }, "flash": { "positive": -0.0769, "negative": 0.1945, "neutral": -0.1176 }, "flash crash": { "positive": -87e-4, "negative": 0.0378, "neutral": -0.029 }, "flat": { "positive": -0.0191, "negative": 0.0654, "neutral": -0.0463 }, "flat never": { "positive": -56e-4, "negative": 0.0219, "neutral": -0.0162 }, "floods": { "positive": -0.0736, "negative": -0.0387, "neutral": 0.1123 }, "floor": { "positive": -0.0856, "negative": -45e-4, "neutral": 0.0901 }, "flush": { "positive": -0.2504, "negative": 0.2122, "neutral": 0.0382 }, "fly": { "positive": -0.0231, "negative": -0.3425, "neutral": 0.3656 }, "fly price": { "positive": 0.1264, "negative": -0.0351, "neutral": -0.0913 }, "focus": { "positive": 0.3663, "negative": -0.0716, "neutral": -0.2947 }, "focused": { "positive": -0.1005, "negative": -0.1229, "neutral": 0.2233 }, "focused company": { "positive": -0.0743, "negative": -0.1099, "neutral": 0.1842 }, "folks": { "positive": -0.0768, "negative": 0.3039, "neutral": -0.2271 }, "follow": { "positive": 0.0887, "negative": -0.0803, "neutral": -84e-4 }, "followers": { "positive": 0.0358, "negative": -0.0162, "neutral": -0.0196 }, "followers friends": { "positive": 0.0358, "negative": -0.0162, "neutral": -0.0196 }, "following": { "positive": 87e-4, "negative": 0.2881, "neutral": -0.2969 }, "follows": { "positive": -0.0528, "negative": 0.1204, "neutral": -0.0676 }, "fomo": { "positive": 0.0949, "negative": -0.0245, "neutral": -0.0704 }, "forbes": { "positive": -0.0362, "negative": -0.1769, "neutral": 0.2132 }, "force": { "positive": -0.095, "negative": -0.1447, "neutral": 0.2397 }, "forced": { "positive": -0.1007, "negative": 0.4871, "neutral": -0.3864 }, "forget": { "positive": 0.0389, "negative": -91e-4, "neutral": -0.0298 }, "forgotten": { "positive": -0.2106, "negative": -0.1314, "neutral": 0.342 }, "fork": { "positive": -0.3618, "negative": 0.2531, "neutral": 0.1088 }, "format": { "positive": 0.1726, "negative": -0.0998, "neutral": -0.0728 }, "former": { "positive": -0.0834, "negative": 0.2158, "neutral": -0.1324 }, "forming": { "positive": -0.0869, "negative": 0.1839, "neutral": -0.097 }, "forms": { "positive": 0.355, "negative": -17e-4, "neutral": -0.3533 }, "found": { "positive": 0.0115, "negative": 0.3508, "neutral": -0.3623 }, "foundation": { "positive": 0.0999, "negative": -0.2453, "neutral": 0.1455 }, "foundation announces": { "positive": 0.0412, "negative": -0.0214, "neutral": -0.0198 }, "founder": { "positive": -0.2854, "negative": 0.3505, "neutral": -0.0651 }, "founder changpeng": { "positive": -0.0356, "negative": 78e-4, "neutral": 0.0278 }, "founder hobnobs": { "positive": -0.0221, "negative": -0.1224, "neutral": 0.1445 }, "founder's": { "positive": -0.0264, "negative": -1e-4, "neutral": 0.0264 }, "founders": { "positive": 0.117, "negative": -0.0611, "neutral": -0.0559 }, "four": { "positive": -92e-4, "negative": 0.1922, "neutral": -0.183 }, "four months": { "positive": -0.012, "negative": 0.0753, "neutral": -0.0633 }, "fourth": { "positive": -0.2135, "negative": -0.1468, "neutral": 0.3604 }, "framework": { "positive": -0.0559, "negative": -0.0316, "neutral": 0.0876 }, "fraud": { "positive": -0.372, "negative": 1.4637, "neutral": -1.0917 }, "fraudulent": { "positive": -0.0694, "negative": 0.6441, "neutral": -0.5747 }, "free": { "positive": -0.2054, "negative": 0.1033, "neutral": 0.1021 }, "free service": { "positive": -0.0615, "negative": -0.139, "neutral": 0.2005 }, "freedom": { "positive": 0.1465, "negative": -0.1547, "neutral": 81e-4 }, "freezes": { "positive": -0.1761, "negative": 0.722, "neutral": -0.5459 }, "friday": { "positive": 0.1389, "negative": 0.0544, "neutral": -0.1933 }, "fried": { "positive": -0.148, "negative": 0.1436, "neutral": 44e-4 }, "friends": { "positive": 0.0358, "negative": -0.0162, "neutral": -0.0196 }, "front": { "positive": -0.1649, "negative": -0.1757, "neutral": 0.3406 }, "frozen": { "positive": -0.1034, "negative": 0.5665, "neutral": -0.4631 }, "frozen out": { "positive": -0.0409, "negative": 0.1789, "neutral": -0.1379 }, "ftx": { "positive": -0.3114, "negative": 0.3698, "neutral": -0.0584 }, "ftx collapse": { "positive": -0.0235, "negative": 0.1637, "neutral": -0.1402 }, "ftx files": { "positive": -99e-4, "negative": 0.0862, "neutral": -0.0763 }, "fuck": { "positive": -0.7438, "negative": 1.9648, "neutral": -1.2211 }, "fuckamoley": { "positive": -0.0153, "negative": 0.0385, "neutral": -0.0232 }, "fucked": { "positive": -0.1125, "negative": 0.4904, "neutral": -0.3779 }, "fuckin": { "positive": 0.1315, "negative": -0.0145, "neutral": -0.117 }, "fucking": { "positive": -0.1307, "negative": 0.4039, "neutral": -0.2731 }, "fucking piece": { "positive": -0.039, "negative": 0.0917, "neutral": -0.0527 }, "fud": { "positive": 0.1925, "negative": -0.0114, "neutral": -0.1811 }, "fueled": { "positive": 0.3095, "negative": -0.1342, "neutral": -0.1753 }, "full": { "positive": 0.1676, "negative": 0.0735, "neutral": -0.2411 }, "fully": { "positive": 0.1119, "negative": -0.1884, "neutral": 0.0765 }, "fun": { "positive": 0.5525, "negative": -0.1999, "neutral": -0.3526 }, "fund": { "positive": -0.1978, "negative": 0.2189, "neutral": -0.0211 }, "fundamentals": { "positive": 0.4065, "negative": 0.1658, "neutral": -0.5723 }, "fundamentals strong": { "positive": 0.4678, "negative": -0.2219, "neutral": -0.2459 }, "fundamentals weak": { "positive": -0.261, "negative": 0.4898, "neutral": -0.2287 }, "funded": { "positive": 0.2006, "negative": 0.0785, "neutral": -0.2791 }, "funding": { "positive": -0.0999, "negative": 0.1975, "neutral": -0.0975 }, "funds": { "positive": 0.0556, "negative": 0.6563, "neutral": -0.7119 }, "funds lying": { "positive": -72e-4, "negative": 0.0272, "neutral": -0.0199 }, "further": { "positive": -0.0177, "negative": -0.0707, "neutral": 0.0883 }, "future": { "positive": 0.2652, "negative": -0.0607, "neutral": -0.2046 }, "future blockchain": { "positive": 0.0653, "negative": -0.1232, "neutral": 0.0579 }, "future finance": { "positive": -0.0675, "negative": 0.2596, "neutral": -0.1921 }, "futures": { "positive": 0.4083, "negative": -0.1814, "neutral": -0.2268 }, "gain": { "positive": 1.2962, "negative": -0.4554, "neutral": -0.8408 }, "gains": { "positive": 1.1628, "negative": -0.1584, "neutral": -1.0043 }, "gains clarity": { "positive": 0.0745, "negative": -0.0479, "neutral": -0.0266 }, "gambling": { "positive": 0.179, "negative": -0.2146, "neutral": 0.0356 }, "game": { "positive": -0.1038, "negative": -0.1298, "neutral": 0.2335 }, "games": { "positive": 0.163, "negative": -0.0985, "neutral": -0.0645 }, "gaming": { "positive": -0.0874, "negative": -0.1392, "neutral": 0.2266 }, "gap": { "positive": -0.0434, "negative": -0.0398, "neutral": 0.0832 }, "garbage": { "positive": -0.7528, "negative": 1.5527, "neutral": -0.7999 }, "garbage never": { "positive": -0.0233, "negative": 0.1905, "neutral": -0.1672 }, "garbage piece": { "positive": -0.0605, "negative": 0.0774, "neutral": -0.0169 }, "gas": { "positive": -0.2733, "negative": -0.0901, "neutral": 0.3634 }, "gas fees": { "positive": -0.2733, "negative": -0.0901, "neutral": 0.3634 }, "gave": { "positive": 0.0528, "negative": -0.0824, "neutral": 0.0297 }, "gd": { "positive": -0.0197, "negative": 0.0235, "neutral": -38e-4 }, "gd dm": { "positive": -0.0197, "negative": 0.0235, "neutral": -38e-4 }, "gem": { "positive": 0.8625, "negative": -0.1195, "neutral": -0.7429 }, "gemini": { "positive": -0.1274, "negative": 0.3601, "neutral": -0.2327 }, "gen": { "positive": -0.1666, "negative": -0.1982, "neutral": 0.3649 }, "generated": { "positive": -0.1518, "negative": 0.1951, "neutral": -0.0433 }, "generation": { "positive": -0.1157, "negative": -0.1466, "neutral": 0.2623 }, "generations": { "positive": -0.1181, "negative": -0.1109, "neutral": 0.229 }, "genesis": { "positive": -0.0648, "negative": 0.0602, "neutral": 46e-4 }, "gensyn": { "positive": 0.0499, "negative": -0.0149, "neutral": -0.035 }, "get": { "positive": -8e-3, "negative": -0.0641, "neutral": 0.0721 }, "get off": { "positive": -0.1709, "negative": 0.4965, "neutral": -0.3256 }, "get paid": { "positive": -0.1194, "negative": -0.1733, "neutral": 0.2926 }, "get power": { "positive": 0.1264, "negative": -0.0351, "neutral": -0.0913 }, "get ready": { "positive": -0.2196, "negative": 0.1321, "neutral": 0.0875 }, "get started": { "positive": 0.0409, "negative": -0.0157, "neutral": -0.0252 }, "gets": { "positive": 0.2085, "negative": -0.0989, "neutral": -0.1096 }, "getting": { "positive": -0.3093, "negative": 0.1826, "neutral": 0.1267 }, "getting closer": { "positive": -0.0196, "negative": 0.1543, "neutral": -0.1347 }, "getting rekt": { "positive": -0.2294, "negative": 0.5759, "neutral": -0.3465 }, "getting started": { "positive": -0.1238, "negative": -0.2655, "neutral": 0.3893 }, "getting trending": { "positive": -0.2175, "negative": -0.0282, "neutral": 0.2457 }, "giant": { "positive": -0.2811, "negative": 0.2455, "neutral": 0.0356 }, "giant binance": { "positive": -51e-4, "negative": 0.0533, "neutral": -0.0481 }, "gift": { "positive": -0.2252, "negative": -0.0424, "neutral": 0.2676 }, "gig": { "positive": 0.2135, "negative": -0.2687, "neutral": 0.0552 }, "git": { "positive": -0.1189, "negative": -0.0733, "neutral": 0.1921 }, "github": { "positive": 0.1108, "negative": -0.0722, "neutral": -0.0386 }, "github repo": { "positive": -0.0206, "negative": 0.0888, "neutral": -0.0682 }, "give": { "positive": 0.1811, "negative": -0.2262, "neutral": 0.0451 }, "giveaway": { "positive": -0.1135, "negative": 0.0999, "neutral": 0.0137 }, "gives": { "positive": 0.0242, "negative": -0.2229, "neutral": 0.1987 }, "giving": { "positive": 0.036, "negative": -0.065, "neutral": 0.029 }, "giving out": { "positive": -0.0811, "negative": -0.048, "neutral": 0.1292 }, "glad": { "positive": 0.3821, "negative": -0.1075, "neutral": -0.2746 }, "global": { "positive": -84e-4, "negative": 0.0273, "neutral": -0.019 }, "global bitcoin": { "positive": -0.0485, "negative": 0.1461, "neutral": -0.0975 }, "global payment": { "positive": 0.3289, "negative": -0.1792, "neutral": -0.1498 }, "glta": { "positive": 0.2413, "negative": -0.0328, "neutral": -0.2085 }, "gm": { "positive": 0.0608, "negative": -0.0332, "neutral": -0.0276 }, "go": { "positive": 0.4467, "negative": -0.2024, "neutral": -0.2442 }, "go $updog": { "positive": 0.1417, "negative": -89e-4, "neutral": -0.1327 }, "go back": { "positive": -0.0313, "negative": 0.1526, "neutral": -0.1212 }, "go up": { "positive": 0.025, "negative": 0.0391, "neutral": -0.0641 }, "goal": { "positive": -0.1238, "negative": 0.1617, "neutral": -0.038 }, "god": { "positive": 0.3232, "negative": -0.0919, "neutral": -0.2313 }, "god great": { "positive": 0.0456, "negative": -0.0174, "neutral": -0.0282 }, "gods": { "positive": 0.0503, "negative": -0.0185, "neutral": -0.0318 }, "goes": { "positive": 0.1281, "negative": -0.0766, "neutral": -0.0515 }, "goes back": { "positive": -0.1545, "negative": 0.1083, "neutral": 0.0461 }, "goes ing": { "positive": -0.0167, "negative": 0.0396, "neutral": -0.0229 }, "goes parabolic": { "positive": 0.4219, "negative": -0.1214, "neutral": -0.3006 }, "goes up": { "positive": -0.0454, "negative": -0.1404, "neutral": 0.1858 }, "going": { "positive": 0.2007, "negative": -0.2909, "neutral": 0.0902 }, "going back": { "positive": 0.3556, "negative": -0.142, "neutral": -0.2136 }, "going down": { "positive": 0.0117, "negative": 0.0518, "neutral": -0.0635 }, "going moon": { "positive": 0.1663, "negative": -0.0656, "neutral": -0.1007 }, "going zero": { "positive": -0.0523, "negative": 0.2124, "neutral": -0.16 }, "gold": { "positive": 0.022, "negative": -0.0331, "neutral": 0.0111 }, "gold instead": { "positive": -0.159, "negative": 0.3037, "neutral": -0.1447 }, "goldman": { "positive": -0.0506, "negative": 0.0744, "neutral": -0.0239 }, "gone": { "positive": 0.1913, "negative": 27e-4, "neutral": -0.1939 }, "gonna": { "positive": 0.1267, "negative": 0.0855, "neutral": -0.2122 }, "good": { "positive": 1.862, "negative": -0.4128, "neutral": -1.4492 }, "good day": { "positive": 0.082, "negative": 0.0323, "neutral": -0.1143 }, "good job": { "positive": -0.0527, "negative": 0.0698, "neutral": -0.0172 }, "good luck": { "positive": -0.067, "negative": 0.0824, "neutral": -0.0154 }, "good man": { "positive": 0.0861, "negative": -0.0314, "neutral": -0.0546 }, "good morning": { "positive": 0.2713, "negative": -0.1122, "neutral": -0.1591 }, "google": { "positive": -0.1842, "negative": -0.016, "neutral": 0.2002 }, "google cloud": { "positive": -0.1323, "negative": 0.099, "neutral": 0.0333 }, "got": { "positive": 0.3581, "negative": 0.3691, "neutral": -0.7272 }, "got hacked": { "positive": -0.1276, "negative": 0.1907, "neutral": -0.0631 }, "gotta": { "positive": 0.0968, "negative": -0.0226, "neutral": -0.0742 }, "gotta love": { "positive": 0.0968, "negative": -0.0226, "neutral": -0.0742 }, "gov": { "positive": 36e-4, "negative": -0.0727, "neutral": 0.0692 }, "gov't": { "positive": -0.0518, "negative": 0.2783, "neutral": -0.2264 }, "government": { "positive": -0.0984, "negative": 0.3561, "neutral": -0.2576 }, "gox": { "positive": -0.0583, "negative": 0.0822, "neutral": -0.0239 }, "gox crypto": { "positive": -75e-4, "negative": 0.078, "neutral": -0.0705 }, "gpu": { "positive": -0.1002, "negative": -0.1225, "neutral": 0.2228 }, "grabbed": { "positive": -0.0801, "negative": -0.14, "neutral": 0.2201 }, "graph": { "positive": -0.1869, "negative": 0.2152, "neutral": -0.0283 }, "graphics": { "positive": -0.0574, "negative": -0.1318, "neutral": 0.1893 }, "grayscale": { "positive": -0.0964, "negative": -0.0857, "neutral": 0.1821 }, "great": { "positive": 2.3388, "negative": -0.9917, "neutral": -1.3471 }, "great again": { "positive": 0.0671, "negative": -0.0199, "neutral": -0.0472 }, "great news": { "positive": 0.1866, "negative": -0.0238, "neutral": -0.1629 }, "great see": { "positive": 0.042, "negative": -0.0132, "neutral": -0.0289 }, "great seeing": { "positive": 0.0339, "negative": -58e-4, "neutral": -0.0281 }, "great such": { "positive": 0.0456, "negative": -0.0174, "neutral": -0.0282 }, "great time": { "positive": 0.0943, "negative": -0.0403, "neutral": -0.0539 }, "great utility": { "positive": 0.2519, "negative": -0.0234, "neutral": -0.2285 }, "great week": { "positive": 0.0492, "negative": -0.0198, "neutral": -0.0294 }, "great weekend": { "positive": 0.0528, "negative": -0.0243, "neutral": -0.0285 }, "greatest": { "positive": 0.2288, "negative": -0.1035, "neutral": -0.1253 }, "green": { "positive": 1.4481, "negative": -0.5143, "neutral": -0.9339 }, "green candle": { "positive": 0.0394, "negative": -86e-4, "neutral": -0.0308 }, "green green": { "positive": 0.0349, "negative": -0.0136, "neutral": -0.0213 }, "grok": { "positive": 0.1905, "negative": -0.0647, "neutral": -0.1258 }, "group": { "positive": -0.2509, "negative": 0.0428, "neutral": 0.2081 }, "growing": { "positive": 0.2793, "negative": -0.2113, "neutral": -0.068 }, "growing $updog": { "positive": 0.1858, "negative": -0.018, "neutral": -0.1678 }, "grows": { "positive": 0.5508, "negative": -0.219, "neutral": -0.3318 }, "growth": { "positive": 0.2334, "negative": -0.3069, "neutral": 0.0736 }, "guaranteed": { "positive": 0.162, "negative": -0.0286, "neutral": -0.1334 }, "guide": { "positive": -0.0344, "negative": -0.2328, "neutral": 0.2672 }, "guilty": { "positive": -0.1757, "negative": 0.5709, "neutral": -0.3952 }, "guilty hacking": { "positive": -0.0287, "negative": 0.1256, "neutral": -0.097 }, "guy": { "positive": -0.0939, "negative": 0.3529, "neutral": -0.259 }, "guys": { "positive": -0.0855, "negative": 0.1971, "neutral": -0.1116 }, "hack": { "positive": -0.6387, "negative": 2.3383, "neutral": -1.6996 }, "hack drained": { "positive": -0.0152, "negative": 0.0292, "neutral": -0.014 }, "hacked": { "positive": -0.0225, "negative": 1.6744, "neutral": -1.6519 }, "hacked crypto": { "positive": -0.0308, "negative": 0.0637, "neutral": -0.0329 }, "hacked over": { "positive": -0.0102, "negative": 0.053, "neutral": -0.0428 }, "hacker": { "positive": -0.1841, "negative": 0.4627, "neutral": -0.2785 }, "hacker behind": { "positive": 0.1355, "negative": -0.0867, "neutral": -0.0488 }, "hacker news": { "positive": -0.1053, "negative": 0.0818, "neutral": 0.0234 }, "hackers": { "positive": -0.4702, "negative": 2.0197, "neutral": -1.5496 }, "hackers behind": { "positive": -0.0251, "negative": 0.0963, "neutral": -0.0712 }, "hackers drain": { "positive": -0.0243, "negative": 0.104, "neutral": -0.0797 }, "hackers steal": { "positive": -0.0126, "negative": 0.0471, "neutral": -0.0345 }, "hackers stole": { "positive": -0.01, "negative": 0.0212, "neutral": -0.0112 }, "hackers use": { "positive": -98e-4, "negative": 0.0495, "neutral": -0.0397 }, "hacking": { "positive": -0.2048, "negative": -0.0333, "neutral": 0.2381 }, "hacking crypto": { "positive": -0.0287, "negative": 0.1256, "neutral": -0.097 }, "hacks": { "positive": -0.2083, "negative": 0.0337, "neutral": 0.1746 }, "half": { "positive": -0.1175, "negative": 0.4996, "neutral": -0.3821 }, "halt": { "positive": -0.2696, "negative": 0.9922, "neutral": -0.7226 }, "halted": { "positive": -0.1339, "negative": 0.4897, "neutral": -0.3558 }, "halts": { "positive": -0.1561, "negative": 1.0126, "neutral": -0.8565 }, "halts all": { "positive": -0.012, "negative": 0.0743, "neutral": -0.0623 }, "halts deposits": { "positive": -0.0112, "negative": 0.0591, "neutral": -0.0479 }, "halts withdrawals": { "positive": -0.0234, "negative": 0.1387, "neutral": -0.1153 }, "halving": { "positive": 0.5081, "negative": -0.2196, "neutral": -0.2885 }, "hand": { "positive": 0.2016, "negative": -0.2262, "neutral": 0.0246 }, "hands": { "positive": 0.3769, "negative": 0.12, "neutral": -0.4968 }, "hands shaken": { "positive": -0.1478, "negative": 0.1972, "neutral": -0.0494 }, "happen": { "positive": 0.1407, "negative": -0.0521, "neutral": -0.0886 }, "happened": { "positive": 0.084, "negative": -0.18, "neutral": 0.0959 }, "happening": { "positive": -0.0692, "negative": -0.1472, "neutral": 0.2165 }, "happy": { "positive": 0.5966, "negative": -0.1522, "neutral": -0.4444 }, "hard": { "positive": -62e-4, "negative": -0.018, "neutral": 0.0242 }, "hard fork": { "positive": -0.063, "negative": -0.0669, "neutral": 0.1299 }, "hard way": { "positive": -0.1217, "negative": 0.0699, "neutral": 0.0518 }, "harder": { "positive": 0.2141, "negative": -0.0618, "neutral": -0.1522 }, "hardware": { "positive": -0.2296, "negative": -0.1042, "neutral": 0.3338 }, "hardware wallets": { "positive": -0.0837, "negative": 0.1222, "neutral": -0.0384 }, "hashrate": { "positive": 0.1547, "negative": -0.1194, "neutral": -0.0353 }, "hasn": { "positive": -0.0262, "negative": 0.1908, "neutral": -0.1646 }, "hate": { "positive": -0.3915, "negative": 1.2105, "neutral": -0.819 }, "haters": { "positive": -0.1749, "negative": 0.0792, "neutral": 0.0957 }, "hates": { "positive": -0.1477, "negative": 0.4488, "neutral": -0.3011 }, "haven": { "positive": 0.1646, "negative": -0.0784, "neutral": -0.0861 }, "hayes": { "positive": 0.1338, "negative": -0.0272, "neutral": -0.1065 }, "head": { "positive": -0.0771, "negative": -0.213, "neutral": 0.29 }, "headed": { "positive": -0.0753, "negative": 0.0232, "neutral": 0.0521 }, "healthy": { "positive": 0.6949, "negative": -0.1435, "neutral": -0.5514 }, "heap": { "positive": -0.137, "negative": -0.1146, "neutral": 0.2516 }, "heating": { "positive": -0.0752, "negative": -0.1367, "neutral": 0.2119 }, "heating up": { "positive": -0.0752, "negative": -0.1367, "neutral": 0.2119 }, "heats": { "positive": -0.1768, "negative": -0.149, "neutral": 0.3258 }, "heavy": { "positive": -0.0403, "negative": 0.0884, "neutral": -0.0481 }, "hedge": { "positive": 0.1054, "negative": 0.1189, "neutral": -0.2243 }, "hedge fund": { "positive": -0.0447, "negative": 0.1984, "neutral": -0.1537 }, "heist": { "positive": -0.0367, "negative": 0.0921, "neutral": -0.0554 }, "held": { "positive": 0.6312, "negative": -0.1578, "neutral": -0.4734 }, "held perfectly": { "positive": 0.3311, "negative": -0.1968, "neutral": -0.1344 }, "hell": { "positive": 0.2346, "negative": -0.0456, "neutral": -0.1889 }, "help": { "positive": -0.4572, "negative": 0.0342, "neutral": 0.4231 }, "helped": { "positive": 0.1355, "negative": -0.0867, "neutral": -0.0488 }, "helped crypto": { "positive": 0.1355, "negative": -0.0867, "neutral": -0.0488 }, "helping": { "positive": 16e-4, "negative": 0.028, "neutral": -0.0296 }, "helps": { "positive": -0.0839, "negative": 0.1972, "neutral": -0.1133 }, "here": { "positive": 0.2734, "negative": -0.5666, "neutral": 0.2931 }, "here chart": { "positive": 0.0338, "negative": -0.0193, "neutral": -0.0145 }, "here comes": { "positive": -0.3564, "negative": 0.3233, "neutral": 0.0331 }, "here don": { "positive": 66e-4, "negative": 0.0981, "neutral": -0.1047 }, "here even": { "positive": 0.1724, "negative": -0.0337, "neutral": -0.1386 }, "here fundamentals": { "positive": 0.1066, "negative": -0.0325, "neutral": -0.0741 }, "here gain": { "positive": 0.1767, "negative": -0.0215, "neutral": -0.1552 }, "here great": { "positive": 0.192, "negative": -0.0302, "neutral": -0.1619 }, "here momentum": { "positive": 0.1332, "negative": -0.0175, "neutral": -0.1157 }, "here see": { "positive": 0.0428, "negative": -0.0194, "neutral": -0.0234 }, "here smart": { "positive": 0.0409, "negative": -0.0231, "neutral": -0.0178 }, "here so": { "positive": -0.0196, "negative": -0.0472, "neutral": 0.0668 }, "here support": { "positive": 0.0479, "negative": -0.0197, "neutral": -0.0282 }, "here volume": { "positive": 0.1602, "negative": -0.0414, "neutral": -0.1188 }, "here's": { "positive": -0.0709, "negative": -0.1913, "neutral": 0.2622 }, "hey": { "positive": 0.2457, "negative": -0.0421, "neutral": -0.2036 }, "hgp": { "positive": -0.0801, "negative": -0.0587, "neutral": 0.1388 }, "hid": { "positive": -0.0512, "negative": -0.1628, "neutral": 0.214 }, "hidden": { "positive": -0.021, "negative": -0.0681, "neutral": 0.0891 }, "hide": { "positive": -0.1196, "negative": -0.0349, "neutral": 0.1545 }, "high": { "positive": 0.7881, "negative": -0.1987, "neutral": -0.5894 }, "high adoption": { "positive": 0.0313, "negative": -0.0101, "neutral": -0.0212 }, "high etf": { "positive": 0.0791, "negative": -0.0386, "neutral": -0.0405 }, "high fees": { "positive": 0.0684, "negative": -0.0219, "neutral": -0.0465 }, "high institutional": { "positive": 0.0282, "negative": -0.0142, "neutral": -0.014 }, "high major": { "positive": 0.0542, "negative": -0.0208, "neutral": -0.0334 }, "high network": { "positive": 0.0603, "negative": -0.0209, "neutral": -0.0395 }, "high watch": { "positive": 0.103, "negative": -0.0631, "neutral": -0.0399 }, "higher": { "positive": 0.524, "negative": -0.2288, "neutral": -0.2953 }, "higher $updog": { "positive": 0.2579, "negative": -0.0547, "neutral": -0.2032 }, "highly": { "positive": -0.0559, "negative": -0.0722, "neutral": 0.1281 }, "highs": { "positive": -0.2114, "negative": -0.1273, "neutral": 0.3387 }, "hilarious": { "positive": -0.1279, "negative": 0.1465, "neutral": -0.0186 }, "historically": { "positive": -0.0247, "negative": 0.1596, "neutral": -0.1349 }, "history": { "positive": -0.1434, "negative": 0.4323, "neutral": -0.2889 }, "hit": { "positive": -0.3275, "negative": 0.307, "neutral": 0.0205 }, "hit crypto": { "positive": -0.0187, "negative": 0.162, "neutral": -0.1433 }, "hit new": { "positive": -0.0358, "negative": -0.0582, "neutral": 0.094 }, "hit record": { "positive": 0.1581, "negative": 0.0219, "neutral": -0.18 }, "hits": { "positive": -0.0703, "negative": 0.0711, "neutral": -8e-4 }, "hn": { "positive": -0.252, "negative": -0.4172, "neutral": 0.6692 }, "hn ai": { "positive": -0.0653, "negative": -0.1198, "neutral": 0.1851 }, "hn am": { "positive": 0.0415, "negative": -0.0292, "neutral": -0.0123 }, "hn bitcoin": { "positive": -0.1223, "negative": -0.0627, "neutral": 0.185 }, "hn built": { "positive": -0.166, "negative": -0.0963, "neutral": 0.2622 }, "hn burnshot": { "positive": -0.0268, "negative": -0.0201, "neutral": 0.0468 }, "hn create": { "positive": -0.0612, "negative": 0.2537, "neutral": -0.1924 }, "hn created": { "positive": -0.0634, "negative": -0.105, "neutral": 0.1684 }, "hn crypto": { "positive": -0.1285, "negative": -0.1487, "neutral": 0.2772 }, "hn dao": { "positive": -0.032, "negative": -0.0313, "neutral": 0.0633 }, "hn decentralized": { "positive": -0.0241, "negative": -0.0138, "neutral": 0.0378 }, "hn financial": { "positive": -0.0181, "negative": 0.2553, "neutral": -0.2373 }, "hn free": { "positive": -0.0355, "negative": 0.3253, "neutral": -0.2898 }, "hn how": { "positive": 0.1785, "negative": -0.2373, "neutral": 0.0588 }, "hn made": { "positive": 0.06, "negative": -0.0413, "neutral": -0.0187 }, "hn new": { "positive": -0.069, "negative": 0.1961, "neutral": -0.1271 }, "hn open": { "positive": -0.0204, "negative": -0.0389, "neutral": 0.0593 }, "hn what's": { "positive": -0.0193, "negative": 0.0391, "neutral": -0.0199 }, "hn why": { "positive": -0.0522, "negative": -0.1406, "neutral": 0.1927 }, "hobnobs": { "positive": -0.0221, "negative": -0.1224, "neutral": 0.1445 }, "hobnobs trump": { "positive": -0.0221, "negative": -0.1224, "neutral": 0.1445 }, "hodlers": { "positive": -0.1246, "negative": 0.273, "neutral": -0.1484 }, "hold": { "positive": 0.4047, "negative": 0.0692, "neutral": -0.4739 }, "holders": { "positive": 0.0379, "negative": -0.0762, "neutral": 0.0383 }, "holding": { "positive": 0.6239, "negative": -0.4687, "neutral": -0.1552 }, "holding ada": { "positive": -0.0367, "negative": 0.012, "neutral": 0.0247 }, "holding altcoins": { "positive": -0.0352, "negative": 58e-4, "neutral": 0.0294 }, "holding avax": { "positive": -0.0358, "negative": 0.0101, "neutral": 0.0257 }, "holding bnb": { "positive": -0.0292, "negative": 34e-4, "neutral": 0.0258 }, "holding btc": { "positive": -0.0431, "negative": 0.0183, "neutral": 0.0248 }, "holding dear": { "positive": 0.119, "negative": -0.0111, "neutral": -0.1079 }, "holding doge": { "positive": -0.032, "negative": 0.0121, "neutral": 0.02 }, "holding link": { "positive": -0.0351, "negative": 85e-4, "neutral": 0.0266 }, "holding long": { "positive": 0.0779, "negative": -0.0331, "neutral": -0.0448 }, "holding market": { "positive": -0.0392, "negative": 22e-4, "neutral": 0.037 }, "holding ripple": { "positive": -0.0319, "negative": 7e-3, "neutral": 0.0249 }, "holding solana": { "positive": -0.031, "negative": 0.0128, "neutral": 0.0183 }, "holding strong": { "positive": 0.0651, "negative": -0.0164, "neutral": -0.0488 }, "holding up": { "positive": 0.1011, "negative": -0.1182, "neutral": 0.0171 }, "holds": { "positive": -0.0325, "negative": -0.1089, "neutral": 0.1414 }, "holy": { "positive": -0.1136, "negative": 0.2489, "neutral": -0.1353 }, "holy shittamoley": { "positive": -0.0221, "negative": 0.0502, "neutral": -0.0281 }, "home": { "positive": -0.0741, "negative": 0.1089, "neutral": -0.0348 }, "homepage": { "positive": -0.1014, "negative": 0.2315, "neutral": -0.1301 }, "hong": { "positive": -0.08, "negative": -98e-4, "neutral": 0.0898 }, "hong kong": { "positive": -0.08, "negative": -98e-4, "neutral": 0.0898 }, "hope": { "positive": 0.0692, "negative": -0.0284, "neutral": -0.0408 }, "hopeful": { "positive": 0.1231, "negative": -0.0662, "neutral": -0.057 }, "hopefully": { "positive": 0.0841, "negative": 0.1622, "neutral": -0.2463 }, "hopes": { "positive": -0.1101, "negative": 0.4575, "neutral": -0.3473 }, "hophn": { "positive": 0.2497, "negative": -0.0442, "neutral": -0.2055 }, "hophn fbnsx": { "positive": 0.2497, "negative": -0.0442, "neutral": -0.2055 }, "hoping": { "positive": 0.2066, "negative": -0.0732, "neutral": -0.1334 }, "hopium": { "positive": 0.1435, "negative": -0.0486, "neutral": -0.0949 }, "horizon": { "positive": 0.2916, "negative": -0.0614, "neutral": -0.2302 }, "hoskinson": { "positive": 78e-4, "negative": 0.035, "neutral": -0.0428 }, "hosting": { "positive": -0.0493, "negative": -0.0298, "neutral": 0.0791 }, "hot": { "positive": -0.0217, "negative": 0.1894, "neutral": -0.1677 }, "hour": { "positive": -0.0609, "negative": 0.2796, "neutral": -0.2187 }, "hours": { "positive": -0.2007, "negative": 0.4212, "neutral": -0.2205 }, "house": { "positive": -0.2336, "negative": -0.0575, "neutral": 0.2911 }, "how": { "positive": -0.2902, "negative": -0.035, "neutral": 0.3252 }, "how bitcoin": { "positive": -0.0508, "negative": -0.0962, "neutral": 0.147 }, "how build": { "positive": -0.0979, "negative": -0.1063, "neutral": 0.2042 }, "how create": { "positive": 0.0578, "negative": -0.1358, "neutral": 0.078 }, "how crypto": { "positive": -0.0641, "negative": 0.3012, "neutral": -0.2372 }, "how get": { "positive": -0.0442, "negative": -0.057, "neutral": 0.1012 }, "how long": { "positive": 0.1158, "negative": -0.0406, "neutral": -0.0752 }, "how make": { "positive": 0.1398, "negative": -0.1317, "neutral": -82e-4 }, "http": { "positive": -0.0601, "negative": -0.0695, "neutral": 0.1295 }, "hub": { "positive": -0.2065, "negative": 0.0982, "neutral": 0.1083 }, "huge": { "positive": 0.1144, "negative": 0.0439, "neutral": -0.1582 }, "huge news": { "positive": 0.0623, "negative": -0.1557, "neutral": 0.0934 }, "human": { "positive": 0.0117, "negative": 0.0828, "neutral": -0.0945 }, "humans": { "positive": -0.0366, "negative": 0.0797, "neutral": -0.0432 }, "hunting": { "positive": -0.1149, "negative": -0.0818, "neutral": 0.1967 }, "hurry": { "positive": 0.2671, "negative": -0.1174, "neutral": -0.1497 }, "hurry up": { "positive": 0.1894, "negative": -0.0998, "neutral": -0.0896 }, "hype": { "positive": -0.1152, "negative": -0.0187, "neutral": 0.134 }, "hyperliquid": { "positive": -0.1205, "negative": -0.13, "neutral": 0.2505 }, "i'm": { "positive": -0.0849, "negative": -0.1964, "neutral": 0.2813 }, "i'm going": { "positive": -0.0316, "negative": 0.0748, "neutral": -0.0432 }, "i've": { "positive": 0.0917, "negative": 0.0755, "neutral": -0.1671 }, "ico": { "positive": -0.2512, "negative": 0.0213, "neutral": 0.2299 }, "icos": { "positive": 0.2933, "negative": -0.3109, "neutral": 0.0176 }, "icp": { "positive": 0.2047, "negative": -0.0549, "neutral": -0.1498 }, "id": { "positive": -0.0887, "negative": -0.1794, "neutral": 0.268 }, "idea": { "positive": 0.0134, "negative": 0.3108, "neutral": -0.3242 }, "ideas": { "positive": 0.1142, "negative": -0.1292, "neutral": 0.0149 }, "identity": { "positive": -0.039, "negative": -0.063, "neutral": 0.102 }, "idiot": { "positive": -0.013, "negative": 0.1416, "neutral": -0.1286 }, "ignore": { "positive": -0.1007, "negative": 0.2137, "neutral": -0.113 }, "ill": { "positive": -0.1649, "negative": -0.1778, "neutral": 0.3427 }, "illegal": { "positive": -0.2496, "negative": 0.9757, "neutral": -0.7261 }, "illicit": { "positive": -0.0624, "negative": -0.131, "neutral": 0.1934 }, "im": { "positive": 0.2137, "negative": 0.1885, "neutral": -0.4022 }, "image": { "positive": -0.0342, "negative": -0.0295, "neutral": 0.0636 }, "imagine": { "positive": -0.1106, "negative": 0.0955, "neutral": 0.0151 }, "imagine buying": { "positive": -0.2477, "negative": 0.3089, "neutral": -0.0611 }, "imminent": { "positive": 31e-4, "negative": 0.0888, "neutral": -0.0919 }, "immutability": { "positive": -0.1287, "negative": -0.1701, "neutral": 0.2988 }, "imo": { "positive": 0.1312, "negative": 0.162, "neutral": -0.2932 }, "impact": { "positive": -0.2214, "negative": 0.3204, "neutral": -0.099 }, "implementation": { "positive": -0.1356, "negative": -0.121, "neutral": 0.2566 }, "important": { "positive": -0.1125, "negative": -0.3194, "neutral": 0.4319 }, "impressions": { "positive": -0.0612, "negative": -0.0566, "neutral": 0.1178 }, "impressive": { "positive": 0.0929, "negative": -0.012, "neutral": -0.0809 }, "incident": { "positive": -0.0844, "negative": 0.3188, "neutral": -0.2345 }, "incoming": { "positive": -0.3239, "negative": 0.0562, "neutral": 0.2677 }, "incoming stated": { "positive": 0.0537, "negative": -0.0413, "neutral": -0.0125 }, "increased": { "positive": 0.0234, "negative": -0.126, "neutral": 0.1026 }, "increasingly": { "positive": -0.088, "negative": 0.1716, "neutral": -0.0836 }, "incredible": { "positive": -0.0652, "negative": 0.3568, "neutral": -0.2916 }, "indefinitely": { "positive": -0.0596, "negative": 69e-4, "neutral": 0.0527 }, "index": { "positive": 0.0124, "negative": -0.1092, "neutral": 0.0968 }, "indexer": { "positive": 0.3909, "negative": -0.093, "neutral": -0.2979 }, "india": { "positive": -0.1609, "negative": 0.1888, "neutral": -0.028 }, "india propose": { "positive": -0.0106, "negative": 0.0641, "neutral": -0.0535 }, "indian": { "positive": -0.0384, "negative": 0.1162, "neutral": -0.0778 }, "indian crypto": { "positive": -0.0261, "negative": 0.2129, "neutral": -0.1869 }, "indicator": { "positive": 0.0417, "negative": -0.0283, "neutral": -0.0134 }, "industry": { "positive": -0.0452, "negative": -0.0205, "neutral": 0.0657 }, "infamous": { "positive": 0.1355, "negative": -0.0867, "neutral": -0.0488 }, "infamous hacker": { "positive": 0.1355, "negative": -0.0867, "neutral": -0.0488 }, "inflation": { "positive": -0.1479, "negative": 0.1495, "neutral": -15e-4 }, "inflows": { "positive": 0.078, "negative": -0.1767, "neutral": 0.0987 }, "inflows hit": { "positive": 0.2058, "negative": -0.0846, "neutral": -0.1213 }, "information": { "positive": -0.0274, "negative": 0.1668, "neutral": -0.1394 }, "information stolen": { "positive": -0.0274, "negative": 0.1668, "neutral": -0.1394 }, "infra": { "positive": 0.0753, "negative": -0.0429, "neutral": -0.0324 }, "infrastructure": { "positive": 0.179, "negative": -0.104, "neutral": -0.075 }, "ing": { "positive": -0.3503, "negative": 0.3928, "neutral": -0.0425 }, "ing cent": { "positive": -0.0899, "negative": -0.0765, "neutral": 0.1664 }, "ing dumping": { "positive": -0.0703, "negative": 0.1802, "neutral": -0.11 }, "ing figures": { "positive": 0.1166, "negative": 0.0345, "neutral": -0.1511 }, "ing garbage": { "positive": -0.1162, "negative": 0.2054, "neutral": -0.0892 }, "ing typical": { "positive": -0.0331, "negative": 0.0722, "neutral": -0.0391 }, "inj": { "positive": 0.0611, "negative": -0.0333, "neutral": -0.0278 }, "injective": { "positive": 0.2169, "negative": -0.0516, "neutral": -0.1653 }, "input": { "positive": -0.0738, "negative": -0.111, "neutral": 0.1848 }, "insane": { "positive": 53e-4, "negative": -0.0491, "neutral": 0.0437 }, "inside": { "positive": -0.0562, "negative": 0.0696, "neutral": -0.0135 }, "insider": { "positive": -0.1061, "negative": -0.1664, "neutral": 0.2725 }, "insider trading": { "positive": -0.0808, "negative": -0.1188, "neutral": 0.1997 }, "insolvent": { "positive": -0.1017, "negative": 0.4496, "neutral": -0.3479 }, "install": { "positive": -0.0586, "negative": -0.0613, "neutral": 0.1198 }, "instant": { "positive": 0.1537, "negative": -0.0806, "neutral": -0.0731 }, "instead": { "positive": -0.7796, "negative": 0.8995, "neutral": -0.12 }, "instead ada": { "positive": -0.0154, "negative": 0.0206, "neutral": -52e-4 }, "instead btc": { "positive": -0.0188, "negative": 0.024, "neutral": -52e-4 }, "institutional": { "positive": 0.307, "negative": -0.1997, "neutral": -0.1073 }, "institutional adoption": { "positive": 0.1499, "negative": -0.0481, "neutral": -0.1018 }, "institutional buying": { "positive": 0.1137, "negative": -0.0589, "neutral": -0.0548 }, "institutions": { "positive": 0.069, "negative": -0.0434, "neutral": -0.0256 }, "intel": { "positive": 0.2459, "negative": -0.0868, "neutral": -0.1591 }, "intel vets": { "positive": 0.1355, "negative": -0.0867, "neutral": -0.0488 }, "intel's": { "positive": -0.0732, "negative": 88e-4, "neutral": 0.0644 }, "intel's bitcoin": { "positive": -0.0732, "negative": 88e-4, "neutral": 0.0644 }, "intelligence": { "positive": 0.0878, "negative": -75e-4, "neutral": -0.0803 }, "interactive": { "positive": -0.0493, "negative": -0.0818, "neutral": 0.1311 }, "interest": { "positive": 0.28, "negative": -0.0749, "neutral": -0.2051 }, "interested": { "positive": 0.0433, "negative": -0.025, "neutral": -0.0183 }, "interesting": { "positive": -0.4314, "negative": -0.2882, "neutral": 0.7196 }, "internet": { "positive": 0.1076, "negative": 0.1011, "neutral": -0.2086 }, "internet shutdown": { "positive": -0.0912, "negative": 0.2438, "neutral": -0.1527 }, "interview": { "positive": -0.0349, "negative": 0.0437, "neutral": -88e-4 }, "intro": { "positive": 0.1213, "negative": -0.0883, "neutral": -0.033 }, "invest": { "positive": -0.1272, "negative": -0.4563, "neutral": 0.5835 }, "invest crypto": { "positive": -0.0674, "negative": -0.1981, "neutral": 0.2655 }, "invested": { "positive": 0.0149, "negative": 0.0757, "neutral": -0.0906 }, "investigation": { "positive": -0.1044, "negative": 0.371, "neutral": -0.2666 }, "investment": { "positive": 0.2735, "negative": 0.1811, "neutral": -0.4547 }, "investment launch": { "positive": 0.0412, "negative": -0.0214, "neutral": -0.0198 }, "investment scam": { "positive": -0.0342, "negative": 0.0478, "neutral": -0.0137 }, "investments": { "positive": 0.0716, "negative": -0.0591, "neutral": -0.0125 }, "investor": { "positive": 0.0693, "negative": 0.2904, "neutral": -0.3597 }, "investors": { "positive": -0.0928, "negative": 0.1178, "neutral": -0.025 }, "investors wiped": { "positive": -0.1444, "negative": 0.3689, "neutral": -0.2245 }, "io": { "positive": -0.0865, "negative": -0.0748, "neutral": 0.1613 }, "ios": { "positive": -0.0214, "negative": 0.107, "neutral": -0.0856 }, "iota": { "positive": -0.0918, "negative": 0.3077, "neutral": -0.2159 }, "iphone": { "positive": -0.094, "negative": -0.074, "neutral": 0.168 }, "ipo": { "positive": 0.3349, "negative": -0.2442, "neutral": -0.0907 }, "iran": { "positive": -0.076, "negative": 0.3138, "neutral": -0.2378 }, "iran's": { "positive": -0.102, "negative": 0.1668, "neutral": -0.0648 }, "iran's crypto": { "positive": -0.0723, "negative": 0.1678, "neutral": -0.0955 }, "iran's largest": { "positive": -5e-3, "negative": 0.0685, "neutral": -0.0634 }, "iranian": { "positive": -0.0664, "negative": 0.1502, "neutral": -0.0838 }, "iranian crypto": { "positive": -0.0664, "negative": 0.1502, "neutral": -0.0838 }, "irs": { "positive": -0.2156, "negative": -0.1634, "neutral": 0.3791 }, "isn't": { "positive": -0.0307, "negative": 0.256, "neutral": -0.2254 }, "israel": { "positive": -84e-4, "negative": 0.0841, "neutral": -0.0757 }, "issuer": { "positive": 0.177, "negative": 76e-4, "neutral": -0.1847 }, "issues": { "positive": -0.1437, "negative": 0.6146, "neutral": -0.4709 }, "issues warning": { "positive": -61e-4, "negative": 0.0752, "neutral": -0.0691 }, "issuing": { "positive": -0.1309, "negative": 0.0925, "neutral": 0.0385 }, "it's": { "positive": 0.2398, "negative": 0.1033, "neutral": -0.3431 }, "it's not": { "positive": 0.0655, "negative": -0.1268, "neutral": 0.0613 }, "it's time": { "positive": -0.2903, "negative": 0.0295, "neutral": 0.2608 }, "itself": { "positive": -0.0331, "negative": 0.222, "neutral": -0.1889 }, "jack": { "positive": -0.0898, "negative": -0.1031, "neutral": 0.1929 }, "jackct": { "positive": 0.0787, "negative": -0.014, "neutral": -0.0647 }, "jail": { "positive": -0.0307, "negative": -0.052, "neutral": 0.0828 }, "jailed": { "positive": -0.1374, "negative": 0.3733, "neutral": -0.2359 }, "jam": { "positive": -0.1361, "negative": 0.339, "neutral": -0.2028 }, "jan": { "positive": 0.0457, "negative": -0.036, "neutral": -98e-4 }, "january": { "positive": -0.2345, "negative": -0.1137, "neutral": 0.3482 }, "japan": { "positive": -6e-4, "negative": -0.0477, "neutral": 0.0483 }, "javascript": { "positive": -0.0509, "negative": -0.1008, "neutral": 0.1517 }, "jersey": { "positive": -0.0669, "negative": -0.0842, "neutral": 0.1512 }, "jito": { "positive": -0.0611, "negative": -0.0768, "neutral": 0.1378 }, "jk": { "positive": 0.7114, "negative": -0.3057, "neutral": -0.4057 }, "job": { "positive": -0.2513, "negative": 0.4808, "neutral": -0.2296 }, "join": { "positive": 0.188, "negative": -0.1777, "neutral": -0.0103 }, "joke": { "positive": -0.2089, "negative": 0.4022, "neutral": -0.1932 }, "jp": { "positive": -0.1357, "negative": -0.0858, "neutral": 0.2215 }, "jp morgan": { "positive": -0.1357, "negative": -0.0858, "neutral": 0.2215 }, "jpmorgan": { "positive": -0.0559, "negative": 0.3318, "neutral": -0.2759 }, "js": { "positive": -0.0999, "negative": 0.0682, "neutral": 0.0317 }, "js library": { "positive": -0.0769, "negative": 0.0907, "neutral": -0.0137 }, "judge": { "positive": 0.0746, "negative": 0.0282, "neutral": -0.1028 }, "jump": { "positive": 0.2001, "negative": -0.245, "neutral": 0.0449 }, "jumps": { "positive": 0.4833, "negative": -0.159, "neutral": -0.3243 }, "june": { "positive": 0.0801, "negative": -0.0187, "neutral": -0.0614 }, "junk": { "positive": -0.2507, "negative": 0.1458, "neutral": 0.1049 }, "just another": { "positive": 0.1322, "negative": -0.0503, "neutral": -0.0819 }, "just bought": { "positive": 0.0145, "negative": 0.2069, "neutral": -0.2214 }, "just buy": { "positive": 0.1347, "negative": -0.0379, "neutral": -0.0968 }, "just failed": { "positive": -0.259, "negative": 0.3572, "neutral": -0.0982 }, "just got": { "positive": 0.1058, "negative": -0.0318, "neutral": -0.074 }, "just great": { "positive": 0.2536, "negative": -0.0385, "neutral": -0.2151 }, "just hoping": { "positive": 0.1837, "negative": -0.0662, "neutral": -0.1175 }, "just keep": { "positive": 92e-4, "negative": 0.1013, "neutral": -0.1105 }, "just like": { "positive": 0.2005, "negative": -0.09, "neutral": -0.1105 }, "just need": { "positive": -0.0292, "negative": -0.0846, "neutral": 0.1138 }, "just needs": { "positive": 0.0562, "negative": -0.0152, "neutral": -0.041 }, "just pump": { "positive": 0.2844, "negative": -0.2067, "neutral": -0.0777 }, "just thought": { "positive": -0.1178, "negative": 0.1435, "neutral": -0.0256 }, "just went": { "positive": -0.1313, "negative": -0.1013, "neutral": 0.2326 }, "just worst": { "positive": -0.1219, "negative": 0.2421, "neutral": -0.1202 }, "justice": { "positive": 0.0846, "negative": 0.1234, "neutral": -0.2081 }, "kalshi": { "positive": -0.0266, "negative": 91e-4, "neutral": 0.0174 }, "kazakhstan": { "positive": -0.1119, "negative": 0.3099, "neutral": -0.198 }, "kazakhstan internet": { "positive": -0.0912, "negative": 0.2438, "neutral": -0.1527 }, "keep": { "positive": -0.0401, "negative": -0.1852, "neutral": 0.2253 }, "keep accumulating": { "positive": 0.0718, "negative": -0.0151, "neutral": -0.0568 }, "keep buying": { "positive": 0.0511, "negative": -0.0191, "neutral": -0.032 }, "keep eye": { "positive": 0.0449, "negative": -0.1716, "neutral": 0.1266 }, "keeping": { "positive": 0.0291, "negative": 0.0658, "neutral": -0.0949 }, "keeps": { "positive": 0.0992, "negative": -0.1399, "neutral": 0.0407 }, "keeps growing": { "positive": -0.0103, "negative": -0.0187, "neutral": 0.0289 }, "kentucky": { "positive": -0.1157, "negative": -0.1951, "neutral": 0.3108 }, "key": { "positive": -0.1903, "negative": -0.016, "neutral": 0.2062 }, "key levels": { "positive": -0.2967, "negative": -0.1911, "neutral": 0.4878 }, "key support": { "positive": -1e-4, "negative": 0.0656, "neutral": -0.0655 }, "keys": { "positive": -0.1192, "negative": 0.2852, "neutral": -0.166 }, "kicking": { "positive": -0.1529, "negative": 0.2379, "neutral": -0.085 }, "kicks": { "positive": 0.0236, "negative": -0.0165, "neutral": -72e-4 }, "kicks gone": { "positive": 0.0208, "negative": -0.0148, "neutral": -6e-3 }, "kill": { "positive": 48e-4, "negative": -0.021, "neutral": 0.0162 }, "king": { "positive": -0.2069, "negative": -0.0544, "neutral": 0.2612 }, "know": { "positive": -0.0942, "negative": -0.092, "neutral": 0.1862 }, "knowing": { "positive": 0.1067, "negative": -0.1582, "neutral": 0.0516 }, "knowledge": { "positive": -0.0617, "negative": 0.0483, "neutral": 0.0135 }, "knowledge proofs": { "positive": 33e-4, "negative": -0.0444, "neutral": 0.0412 }, "known": { "positive": -0.0884, "negative": 0.0487, "neutral": 0.0398 }, "knows": { "positive": 81e-4, "negative": 0.0162, "neutral": -0.0243 }, "kodak": { "positive": 0.1938, "negative": -0.2443, "neutral": 0.0505 }, "kodakcoin": { "positive": 0.1938, "negative": -0.2443, "neutral": 0.0505 }, "kong": { "positive": -0.08, "negative": -98e-4, "neutral": 0.0898 }, "kong crypto": { "positive": -0.08, "negative": -98e-4, "neutral": 0.0898 }, "korea": { "positive": 0.044, "negative": 0.0649, "neutral": -0.109 }, "korea's": { "positive": -0.0249, "negative": 0.092, "neutral": -0.0672 }, "korea's crypto": { "positive": -0.01, "negative": 0.0218, "neutral": -0.0118 }, "korean": { "positive": -0.0622, "negative": 0.3219, "neutral": -0.2597 }, "korean crypto": { "positive": -0.0161, "negative": 0.1809, "neutral": -0.1648 }, "korean hackers": { "positive": -0.0253, "negative": 0.0853, "neutral": -0.06 }, "kraken": { "positive": -0.0693, "negative": -0.0242, "neutral": 0.0935 }, "kraken crypto": { "positive": -0.0283, "negative": -0.2796, "neutral": 0.3079 }, "kwon": { "positive": -0.1585, "negative": 0.3317, "neutral": -0.1732 }, "kwon behind": { "positive": -0.0126, "negative": 0.0426, "neutral": -0.03 }, "kyc": { "positive": -0.0425, "negative": 87e-4, "neutral": 0.0337 }, "lab": { "positive": -0.169, "negative": -0.1339, "neutral": 0.3029 }, "labs": { "positive": 0.1468, "negative": 0.1223, "neutral": -0.2691 }, "lady": { "positive": -0.0145, "negative": 0.0627, "neutral": -0.0482 }, "lago": { "positive": -0.0221, "negative": -0.1224, "neutral": 0.1445 }, "lambo": { "positive": -0.0812, "negative": -0.0808, "neutral": 0.162 }, "land": { "positive": -0.091, "negative": -0.232, "neutral": 0.323 }, "landed": { "positive": 0.0724, "negative": 0.0214, "neutral": -0.0939 }, "language": { "positive": -0.0948, "negative": -0.1063, "neutral": 0.2011 }, "laptop": { "positive": 0.0516, "negative": 0.2348, "neutral": -0.2864 }, "large": { "positive": 0.0177, "negative": -0.2981, "neutral": 0.2804 }, "large codebases": { "positive": -0.0948, "negative": -0.0275, "neutral": 0.1223 }, "larger": { "positive": -0.0503, "negative": -0.1759, "neutral": 0.2262 }, "largest": { "positive": -0.2089, "negative": 0.0769, "neutral": 0.132 }, "largest bitcoin": { "positive": -0.0387, "negative": 0.2651, "neutral": -0.2264 }, "largest crypto": { "positive": -0.0148, "negative": -0.1583, "neutral": 0.1732 }, "largest defi": { "positive": -0.0177, "negative": 0.0795, "neutral": -0.0617 }, "last": { "positive": 0.4673, "negative": -0.3818, "neutral": -0.0856 }, "last time": { "positive": 0.0721, "negative": -0.0288, "neutral": -0.0433 }, "last week": { "positive": 0.1241, "negative": -0.0489, "neutral": -0.0752 }, "last year": { "positive": 0.4288, "negative": -0.189, "neutral": -0.2397 }, "late": { "positive": -0.1387, "negative": 0.1934, "neutral": -0.0547 }, "lately": { "positive": 0.0424, "negative": -0.0179, "neutral": -0.0245 }, "later": { "positive": -0.1016, "negative": 0.1819, "neutral": -0.0803 }, "latest": { "positive": -0.2481, "negative": -0.0698, "neutral": 0.3179 }, "launch": { "positive": 1.1108, "negative": -0.353, "neutral": -0.7578 }, "launch sovereignai": { "positive": 0.0412, "negative": -0.0214, "neutral": -0.0198 }, "launched": { "positive": 0.1751, "negative": -0.0789, "neutral": -0.0962 }, "launches": { "positive": 0.2211, "negative": -0.0278, "neutral": -0.1934 }, "launching": { "positive": 0.5206, "negative": -0.2101, "neutral": -0.3105 }, "launder": { "positive": -0.0285, "negative": -0.0535, "neutral": 0.082 }, "launder stolen": { "positive": -73e-4, "negative": 0.0241, "neutral": -0.0168 }, "laundering": { "positive": -0.0604, "negative": 0.2261, "neutral": -0.1658 }, "laureate": { "positive": -0.101, "negative": 0.0525, "neutral": 0.0485 }, "law": { "positive": -0.0804, "negative": -0.0243, "neutral": 0.1047 }, "laws": { "positive": -0.1032, "negative": -0.0904, "neutral": 0.1936 }, "lawsuit": { "positive": -0.3655, "negative": 1.3977, "neutral": -1.0322 }, "lawsuit dao": { "positive": -0.0729, "negative": 0.1962, "neutral": -0.1232 }, "lawsuit over": { "positive": -0.0207, "negative": 0.1775, "neutral": -0.1568 }, "layer": { "positive": 0.2817, "negative": -0.4421, "neutral": 0.1604 }, "layoffs": { "positive": -0.2254, "negative": 1.1029, "neutral": -0.8775 }, "lays": { "positive": -0.1009, "negative": 0.2298, "neutral": -0.1288 }, "lays off": { "positive": -0.0368, "negative": -0.1318, "neutral": 0.1686 }, "le": { "positive": 0.2594, "negative": -0.0839, "neutral": -0.1755 }, "lead": { "positive": -0.0749, "negative": 0.0215, "neutral": 0.0534 }, "leak": { "positive": -0.0649, "negative": -0.1018, "neutral": 0.1666 }, "learn": { "positive": -0.0975, "negative": -0.1919, "neutral": 0.2895 }, "learned": { "positive": 0.0421, "negative": 0.0528, "neutral": -0.0949 }, "learning": { "positive": -0.2555, "negative": -17e-4, "neutral": 0.2572 }, "least": { "positive": 1e-4, "negative": -0.138, "neutral": 0.1378 }, "leave": { "positive": -0.1951, "negative": 0.4351, "neutral": -0.24 }, "leaves": { "positive": 0.0585, "negative": 0.1097, "neutral": -0.1682 }, "leaving": { "positive": 0.0751, "negative": 0.0865, "neutral": -0.1615 }, "ledger": { "positive": 0.1313, "negative": 0.1515, "neutral": -0.2829 }, "lee": { "positive": -0.0554, "negative": 0.1054, "neutral": -0.05 }, "left": { "positive": -0.3965, "negative": 0.7877, "neutral": -0.3912 }, "left behind": { "positive": 0.026, "negative": -55e-4, "neutral": -0.0205 }, "leftist": { "positive": -0.0417, "negative": 0.2342, "neutral": -0.1925 }, "leftists": { "positive": -0.0774, "negative": -0.2551, "neutral": 0.3325 }, "leg": { "positive": -0.1013, "negative": -0.3845, "neutral": 0.4858 }, "leg up": { "positive": 0.3139, "negative": -0.1992, "neutral": -0.1147 }, "legal": { "positive": -0.1431, "negative": -0.1409, "neutral": 0.284 }, "legit": { "positive": 4e-3, "negative": 0.1605, "neutral": -0.1645 }, "lender": { "positive": -0.0882, "negative": 0.1512, "neutral": -0.063 }, "lender genesis": { "positive": -0.0366, "negative": -0.0283, "neutral": 0.0649 }, "lending": { "positive": -0.0531, "negative": 0.137, "neutral": -0.0838 }, "less": { "positive": 0.0507, "negative": -0.2426, "neutral": 0.1919 }, "less than": { "positive": -0.0691, "negative": -0.1162, "neutral": 0.1853 }, "lesson": { "positive": -0.0667, "negative": -0.0451, "neutral": 0.1118 }, "lessons": { "positive": 0.2302, "negative": -0.0118, "neutral": -0.2184 }, "lessons learned": { "positive": 0.0337, "negative": 0.0572, "neutral": -0.0909 }, "let": { "positive": 0.2577, "negative": -0.0273, "neutral": -0.2305 }, "let get": { "positive": 0.2384, "negative": 0.0442, "neutral": -0.2826 }, "let go": { "positive": -0.1658, "negative": -0.1522, "neutral": 0.318 }, "let's": { "positive": -0.4945, "negative": 0.3637, "neutral": 0.1309 }, "lets": { "positive": 0.295, "negative": 0.099, "neutral": -0.394 }, "lets go": { "positive": 0.0986, "negative": -0.0312, "neutral": -0.0674 }, "level": { "positive": -0.07, "negative": 0.1251, "neutral": -0.0551 }, "levels": { "positive": -0.2434, "negative": -0.1154, "neutral": 0.3588 }, "leverage": { "positive": -0.0859, "negative": 0.3644, "neutral": -0.2785 }, "leveraged": { "positive": 0.1819, "negative": -0.4178, "neutral": 0.2359 }, "lfg": { "positive": 0.746, "negative": -0.2941, "neutral": -0.4519 }, "libra": { "positive": -0.0907, "negative": -0.0856, "neutral": 0.1763 }, "libra cryptocurrency": { "positive": -0.0667, "negative": -0.2153, "neutral": 0.282 }, "libraries": { "positive": -0.09, "negative": -0.0366, "neutral": 0.1266 }, "library": { "positive": -0.2127, "negative": -0.0694, "neutral": 0.2821 }, "library backdoored": { "positive": -0.0466, "negative": 0.1354, "neutral": -0.0888 }, "licence": { "positive": -0.141, "negative": -0.3795, "neutral": 0.5205 }, "lies": { "positive": -0.0839, "negative": 0.556, "neutral": -0.4722 }, "life": { "positive": 0.2186, "negative": 55e-4, "neutral": -0.2241 }, "life savings": { "positive": -0.0212, "negative": 0.0451, "neutral": -0.0239 }, "lifts": { "positive": 0.2649, "negative": -0.1151, "neutral": -0.1498 }, "light": { "positive": -0.0513, "negative": 37e-4, "neutral": 0.0475 }, "lightning": { "positive": -0.0795, "negative": 0.1674, "neutral": -0.0879 }, "lightweight": { "positive": -0.0376, "negative": -0.0739, "neutral": 0.1116 }, "like": { "positive": 1.0169, "negative": -0.2797, "neutral": -0.7372 }, "like bull": { "positive": -0.663, "negative": 0.7388, "neutral": -0.0758 }, "like buying": { "positive": 0.0414, "negative": -0.0237, "neutral": -0.0178 }, "like most": { "positive": 0.1937, "negative": -0.1646, "neutral": -0.029 }, "like need": { "positive": -0.0293, "negative": 0.0595, "neutral": -0.0303 }, "like nice": { "positive": 0.0488, "negative": -0.0272, "neutral": -0.0216 }, "likely": { "positive": -0.0714, "negative": 0.604, "neutral": -0.5325 }, "line": { "positive": -0.203, "negative": -0.0739, "neutral": 0.2769 }, "link": { "positive": -0.0665, "negative": 0.0458, "neutral": 0.0207 }, "link breaking": { "positive": 0.0519, "negative": -0.0187, "neutral": -0.0332 }, "link buy": { "positive": -0.0748, "negative": 0.0585, "neutral": 0.0163 }, "link chart": { "positive": -14e-4, "negative": 0.0215, "neutral": -0.0201 }, "link crashes": { "positive": -0.0157, "negative": 0.0398, "neutral": -0.0241 }, "link fundamentals": { "positive": 0.0112, "negative": 0.0106, "neutral": -0.0218 }, "link getting": { "positive": -78e-4, "negative": 0.0243, "neutral": -0.0166 }, "link here": { "positive": -0.0125, "negative": -0.0394, "neutral": 0.0518 }, "link momentum": { "positive": 0.0456, "negative": -0.0131, "neutral": -0.0325 }, "link news": { "positive": -0.0245, "negative": -0.0207, "neutral": 0.0453 }, "link trading": { "positive": -0.0192, "negative": -0.0156, "neutral": 0.0348 }, "linked": { "positive": -0.1973, "negative": -0.0396, "neutral": 0.2369 }, "links": { "positive": -0.0441, "negative": -0.0339, "neutral": 0.078 }, "linux": { "positive": -0.2358, "negative": 0.1466, "neutral": 0.0892 }, "liquid": { "positive": 0.1502, "negative": -0.0617, "neutral": -0.0885 }, "liquidated": { "positive": -0.2351, "negative": 0.7242, "neutral": -0.489 }, "liquidation": { "positive": -0.3672, "negative": 1.4633, "neutral": -1.0961 }, "liquidation cascade": { "positive": -0.1048, "negative": 0.1802, "neutral": -0.0754 }, "liquidations": { "positive": -0.2558, "negative": 0.8753, "neutral": -0.6195 }, "liquidity": { "positive": 0.3256, "negative": 0.0614, "neutral": -0.387 }, "liquidity dried": { "positive": -0.1193, "negative": 0.2851, "neutral": -0.1658 }, "list": { "positive": -0.1368, "negative": -0.1228, "neutral": 0.2596 }, "listed": { "positive": 0.0869, "negative": -0.0502, "neutral": -0.0367 }, "listen": { "positive": 0.0117, "negative": 0.0644, "neutral": -0.076 }, "listings": { "positive": 0.2098, "negative": -0.0978, "neutral": -0.1119 }, "litepaper": { "positive": -0.1192, "negative": -0.0338, "neutral": 0.153 }, "literally": { "positive": -76e-4, "negative": -0.1909, "neutral": 0.1985 }, "little": { "positive": -0.3527, "negative": 0.1097, "neutral": 0.243 }, "live": { "positive": 0.0505, "negative": -0.1652, "neutral": 0.1147 }, "live crypto": { "positive": -0.013, "negative": -0.0102, "neutral": 0.0232 }, "ll": { "positive": -0.102, "negative": 0.3043, "neutral": -0.2023 }, "ll just": { "positive": 0.0569, "negative": -0.0244, "neutral": -0.0325 }, "llm": { "positive": -0.0737, "negative": -0.1544, "neutral": 0.2281 }, "llms": { "positive": 66e-4, "negative": -0.1368, "neutral": 0.1301 }, "lmfao": { "positive": -0.1889, "negative": 0.2603, "neutral": -0.0714 }, "load": { "positive": -0.0957, "negative": -0.1949, "neutral": 0.2906 }, "load up": { "positive": 0.0263, "negative": -0.1513, "neutral": 0.125 }, "loaded": { "positive": 0.1082, "negative": -0.1297, "neutral": 0.0215 }, "loading": { "positive": 1.0906, "negative": -0.3779, "neutral": -0.7127 }, "loading up": { "positive": 0.9017, "negative": -0.3425, "neutral": -0.5591 }, "loan": { "positive": -0.0785, "negative": 0.1963, "neutral": -0.1178 }, "local": { "positive": -0.0783, "negative": -0.1511, "neutral": 0.2293 }, "local ai": { "positive": -0.0147, "negative": -0.0336, "neutral": 0.0483 }, "locally": { "positive": -0.0425, "negative": -0.0703, "neutral": 0.1129 }, "lock": { "positive": 0.1345, "negative": -0.1414, "neutral": 69e-4 }, "locked": { "positive": 0.1037, "negative": 0.1409, "neutral": -0.2446 }, "login": { "positive": -0.0302, "negative": 0.2131, "neutral": -0.1829 }, "logs": { "positive": -0.0646, "negative": 0.0183, "neutral": 0.0462 }, "lol": { "positive": -0.3889, "negative": 0.4659, "neutral": -0.0771 }, "long": { "positive": 1.4292, "negative": -0.3967, "neutral": -1.0324 }, "long $btc": { "positive": 0.0504, "negative": -0.0295, "neutral": -0.021 }, "long $eth": { "positive": 0.0509, "negative": -0.0223, "neutral": -0.0285 }, "long ada": { "positive": 0.0211, "negative": -0.014, "neutral": -7e-3 }, "long avax": { "positive": 0.0326, "negative": -0.0211, "neutral": -0.0115 }, "long bitcoin": { "positive": 0.0455, "negative": -0.0349, "neutral": -0.0106 }, "long bnb": { "positive": 0.0719, "negative": -0.0291, "neutral": -0.0428 }, "long bulls": { "positive": 0.0358, "negative": -0.0162, "neutral": -0.0196 }, "long cardano": { "positive": 0.0565, "negative": -0.0225, "neutral": -0.034 }, "long crypto": { "positive": 0.0807, "negative": -0.0303, "neutral": -0.0504 }, "long link": { "positive": 0.0694, "negative": -0.0349, "neutral": -0.0344 }, "long market": { "positive": 0.0333, "negative": -0.0148, "neutral": -0.0185 }, "long ripple": { "positive": 0.0507, "negative": -0.0239, "neutral": -0.0268 }, "long sol": { "positive": 0.0487, "negative": -0.0272, "neutral": -0.0215 }, "long solana": { "positive": 0.0214, "negative": -0.0135, "neutral": -79e-4 }, "long strong": { "positive": 0.0867, "negative": -0.0337, "neutral": -0.053 }, "long term": { "positive": 58e-4, "negative": 0.3202, "neutral": -0.326 }, "long time": { "positive": 0.0701, "negative": -0.0238, "neutral": -0.0464 }, "long xrp": { "positive": 0.1015, "negative": -0.0461, "neutral": -0.0554 }, "longer": { "positive": 0.0668, "negative": -0.0252, "neutral": -0.0416 }, "longs": { "positive": 0.2382, "negative": -0.2081, "neutral": -0.0301 }, "look": { "positive": 0.074, "negative": -0.1265, "neutral": 0.0525 }, "looking": { "positive": 0.2138, "negative": -0.2966, "neutral": 0.0827 }, "looking good": { "positive": 0.1385, "negative": -0.042, "neutral": -0.0965 }, "looks": { "positive": 0.1986, "negative": 0.1704, "neutral": -0.369 }, "looks bullish": { "positive": 0.2893, "negative": -0.2115, "neutral": -0.0778 }, "looks good": { "positive": 0.1947, "negative": -0.0867, "neutral": -0.1079 }, "looks like": { "positive": -0.3122, "negative": 0.4998, "neutral": -0.1876 }, "lose": { "positive": -0.1211, "negative": 0.4568, "neutral": -0.3357 }, "loser": { "positive": -0.1117, "negative": 0.3938, "neutral": -0.2821 }, "losers": { "positive": -0.474, "negative": 0.7016, "neutral": -0.2276 }, "loses": { "positive": 0.0239, "negative": 0.0934, "neutral": -0.1172 }, "loses exploit": { "positive": -0.0893, "negative": 0.3022, "neutral": -0.2129 }, "losing": { "positive": -0.1912, "negative": 0.4642, "neutral": -0.273 }, "loss": { "positive": -0.6355, "negative": 1.4728, "neutral": -0.8373 }, "loss crypto": { "positive": -0.0438, "negative": 0.1427, "neutral": -0.099 }, "losses": { "positive": -0.3327, "negative": 1.2043, "neutral": -0.8716 }, "lost": { "positive": -0.1918, "negative": 0.5792, "neutral": -0.3874 }, "lost crypto": { "positive": -0.0111, "negative": 0.0304, "neutral": -0.0193 }, "lot": { "positive": 0.3124, "negative": 0.0451, "neutral": -0.3575 }, "lots": { "positive": -0.2249, "negative": 0.2935, "neutral": -0.0686 }, "love": { "positive": 2.5196, "negative": -0.9335, "neutral": -1.5861 }, "love back": { "positive": 0.0728, "negative": -95e-4, "neutral": -0.0633 }, "love sui": { "positive": 0.1143, "negative": -0.0637, "neutral": -0.0506 }, "low": { "positive": 0.1651, "negative": -0.1952, "neutral": 0.0301 }, "lower": { "positive": 0.0982, "negative": 0.1086, "neutral": -0.2067 }, "lows": { "positive": -0.0456, "negative": 0.034, "neutral": 0.0116 }, "ltc": { "positive": 0.1493, "negative": -0.027, "neutral": -0.1223 }, "luck": { "positive": -0.1687, "negative": 0.1288, "neutral": 0.0399 }, "lummis": { "positive": -0.1069, "negative": 0.0664, "neutral": 0.0405 }, "luna": { "positive": 0.0554, "negative": 0.0742, "neutral": -0.1296 }, "luna ust": { "positive": 0.1011, "negative": -0.0689, "neutral": -0.0321 }, "lying": { "positive": -0.1918, "negative": 0.877, "neutral": -0.6852 }, "lying regulators": { "positive": -72e-4, "negative": 0.0272, "neutral": -0.0199 }, "mac": { "positive": -0.1307, "negative": -0.1178, "neutral": 0.2485 }, "machine": { "positive": -0.1349, "negative": 0.0172, "neutral": 0.1177 }, "macos": { "positive": -0.0546, "negative": 0.0288, "neutral": 0.0258 }, "macro": { "positive": -0.1622, "negative": 0.1583, "neutral": 39e-4 }, "made": { "positive": -0.0137, "negative": -0.1201, "neutral": 0.1338 }, "mainnet": { "positive": 0.131, "negative": -0.1793, "neutral": 0.0484 }, "mainnet stats": { "positive": -0.1158, "negative": -0.0814, "neutral": 0.1972 }, "maintain": { "positive": -0.1661, "negative": 0.0394, "neutral": 0.1267 }, "major": { "positive": 0.4195, "negative": -0.0841, "neutral": -0.3354 }, "major exchange": { "positive": -0.0292, "negative": 0.0412, "neutral": -0.012 }, "major partnership": { "positive": 0.2213, "negative": -0.0992, "neutral": -0.122 }, "make": { "positive": 0.6442, "negative": -0.2637, "neutral": -0.3805 }, "make money": { "positive": -99e-4, "negative": -0.1151, "neutral": 0.125 }, "maker": { "positive": 0.0771, "negative": -0.1402, "neutral": 0.0631 }, "makes": { "positive": 0.056, "negative": -0.175, "neutral": 0.119 }, "makes ai": { "positive": -0.0521, "negative": -0.0605, "neutral": 0.1126 }, "making": { "positive": -0.0153, "negative": -0.3519, "neutral": 0.3672 }, "making crypto": { "positive": -0.0711, "negative": -0.1376, "neutral": 0.2087 }, "malicious": { "positive": -0.1338, "negative": 0.0161, "neutral": 0.1177 }, "malware": { "positive": -0.1339, "negative": 0.3606, "neutral": -0.2267 }, "man": { "positive": -0.4555, "negative": 0.1868, "neutral": 0.2687 }, "man $eth": { "positive": 0.0861, "negative": -0.0314, "neutral": -0.0546 }, "man's": { "positive": -0.074, "negative": 0.3322, "neutral": -0.2582 }, "man's switch": { "positive": -0.074, "negative": 0.3322, "neutral": -0.2582 }, "manager": { "positive": -0.0556, "negative": 0.0705, "neutral": -0.0149 }, "managing": { "positive": 0.0429, "negative": -0.0662, "neutral": 0.0233 }, "mango": { "positive": -0.0308, "negative": 0.1975, "neutral": -0.1667 }, "manipulation": { "positive": -0.1431, "negative": 0.0505, "neutral": 0.0926 }, "many": { "positive": 0.0368, "negative": 0.2787, "neutral": -0.3155 }, "many people": { "positive": -0.0547, "negative": 0.0858, "neutral": -0.0311 }, "many times": { "positive": -0.0379, "negative": 0.0413, "neutral": -34e-4 }, "map": { "positive": -0.0449, "negative": 0.2578, "neutral": -0.2128 }, "mar": { "positive": -0.0221, "negative": -0.1224, "neutral": 0.1445 }, "mar lago": { "positive": -0.0221, "negative": -0.1224, "neutral": 0.1445 }, "march": { "positive": -0.1002, "negative": 0.0351, "neutral": 0.0651 }, "margin": { "positive": -0.1458, "negative": -0.0695, "neutral": 0.2153 }, "margin trading": { "positive": -0.0394, "negative": 0.0984, "neutral": -0.059 }, "mark": { "positive": 0.1, "negative": -0.0208, "neutral": -0.0792 }, "market": { "positive": 57e-4, "negative": 0.1908, "neutral": -0.1965 }, "market breaking": { "positive": 0.0588, "negative": -0.0415, "neutral": -0.0174 }, "market buy": { "positive": -0.0554, "negative": -97e-4, "neutral": 0.0651 }, "market cap": { "positive": 0.1124, "negative": -0.2545, "neutral": 0.1422 }, "market collapse": { "positive": -0.0857, "negative": 0.1294, "neutral": -0.0437 }, "market conditions": { "positive": -0.0969, "negative": -0.0829, "neutral": 0.1798 }, "market crashes": { "positive": -0.0235, "negative": 0.0526, "neutral": -0.0291 }, "market getting": { "positive": -91e-4, "negative": 0.0301, "neutral": -0.0211 }, "market here": { "positive": 0.0227, "negative": -76e-4, "neutral": -0.0151 }, "market manipulation": { "positive": -51e-4, "negative": 0.0277, "neutral": -0.0226 }, "market news": { "positive": -0.0224, "negative": -0.0172, "neutral": 0.0397 }, "market sentiment": { "positive": -0.2191, "negative": 0.4381, "neutral": -0.2191 }, "market share": { "positive": 0.192, "negative": -0.1267, "neutral": -0.0653 }, "market still": { "positive": -0.0581, "negative": 0.0375, "neutral": 0.0206 }, "market structure": { "positive": 0.2525, "negative": -0.1058, "neutral": -0.1467 }, "market trading": { "positive": -0.0405, "negative": -0.035, "neutral": 0.0754 }, "marketcap": { "positive": -0.0534, "negative": 0.0897, "neutral": -0.0363 }, "marketing": { "positive": -45e-4, "negative": -0.072, "neutral": 0.0765 }, "marketplace": { "positive": 0.6896, "negative": -0.1517, "neutral": -0.5379 }, "markets": { "positive": -0.318, "negative": 0.0132, "neutral": 0.3048 }, "markets crashed": { "positive": -0.164, "negative": 0.1913, "neutral": -0.0273 }, "mass": { "positive": -0.0975, "negative": 0.1962, "neutral": -0.0988 }, "massive": { "positive": -0.2148, "negative": 0.3695, "neutral": -0.1546 }, "massively": { "positive": -0.0771, "negative": -0.1321, "neutral": 0.2092 }, "mastercard": { "positive": 0.1022, "negative": -0.1064, "neutral": 42e-4 }, "math": { "positive": -0.3211, "negative": -0.0217, "neutral": 0.3428 }, "matic": { "positive": 0.0543, "negative": -0.0282, "neutral": -0.0261 }, "matic $lunc": { "positive": 0.031, "negative": -0.0137, "neutral": -0.0173 }, "matter": { "positive": -0.0535, "negative": -0.0193, "neutral": 0.0728 }, "mc": { "positive": 0.1507, "negative": -0.053, "neutral": -0.0977 }, "mcap": { "positive": -0.0556, "negative": -0.0281, "neutral": 0.0837 }, "md": { "positive": 0.0685, "negative": -0.129, "neutral": 0.0605 }, "mean": { "positive": -0.1673, "negative": 0.2004, "neutral": -0.033 }, "means": { "positive": 0.0774, "negative": 0.0133, "neutral": -0.0907 }, "mechanisms": { "positive": -0.1026, "negative": -0.1257, "neutral": 0.2283 }, "media": { "positive": 0.2518, "negative": 0.2672, "neutral": -0.519 }, "meets": { "positive": -0.0616, "negative": -0.1637, "neutral": 0.2253 }, "melt": { "positive": -0.0237, "negative": -0.2135, "neutral": 0.2372 }, "melt faces": { "positive": -0.0237, "negative": -0.2135, "neutral": 0.2372 }, "meme": { "positive": -0.1306, "negative": -0.0144, "neutral": 0.145 }, "meme coin": { "positive": -0.1182, "negative": -0.1334, "neutral": 0.2517 }, "meme coins": { "positive": 73e-4, "negative": 0.2731, "neutral": -0.2804 }, "memecoin": { "positive": -0.1375, "negative": -0.0347, "neutral": 0.1722 }, "memecoins": { "positive": -0.1337, "negative": 0.2499, "neutral": -0.1162 }, "memecoins instead": { "positive": -0.1337, "negative": 0.2499, "neutral": -0.1162 }, "memes": { "positive": 0.1304, "negative": 0.012, "neutral": -0.1424 }, "memory": { "positive": -0.0807, "negative": -0.1403, "neutral": 0.221 }, "men": { "positive": -0.065, "negative": 0.0113, "neutral": 0.0536 }, "menu": { "positive": -0.079, "negative": 0.1182, "neutral": -0.0392 }, "metrics": { "positive": 0.1338, "negative": -0.0853, "neutral": -0.0486 }, "michael": { "positive": 0.018, "negative": 0.0514, "neutral": -0.0694 }, "michael saylor": { "positive": 0.018, "negative": 0.0514, "neutral": -0.0694 }, "microsoft": { "positive": -0.0704, "negative": -0.0631, "neutral": 0.1335 }, "million": { "positive": 0.4566, "negative": 0.022, "neutral": -0.4786 }, "million coins": { "positive": 0.0445, "negative": -0.0278, "neutral": -0.0167 }, "million dollars": { "positive": -0.0289, "negative": 0.0579, "neutral": -0.029 }, "million market": { "positive": 0.0262, "negative": -0.0182, "neutral": -8e-3 }, "millionaires": { "positive": 0.0894, "negative": -0.0233, "neutral": -0.0661 }, "millions": { "positive": -0.2916, "negative": 0.0379, "neutral": 0.2537 }, "millions crypto": { "positive": -0.0299, "negative": 0.1881, "neutral": -0.1582 }, "mind": { "positive": 0.2481, "negative": -0.1799, "neutral": -0.0682 }, "mine": { "positive": -0.0703, "negative": -0.0826, "neutral": 0.1529 }, "mine bitcoin": { "positive": 0.0467, "negative": -0.2323, "neutral": 0.1856 }, "mined": { "positive": -0.1006, "negative": -0.0877, "neutral": 0.1883 }, "miner": { "positive": -0.0928, "negative": 0.4413, "neutral": -0.3484 }, "miners": { "positive": -0.4266, "negative": 0.0336, "neutral": 0.393 }, "miners traders": { "positive": -0.0106, "negative": 0.0641, "neutral": -0.0535 }, "mini": { "positive": -0.0651, "negative": -0.1148, "neutral": 0.1799 }, "minimum": { "positive": 0.4922, "negative": -0.2444, "neutral": -0.2478 }, "mining": { "positive": -0.1137, "negative": -0.1766, "neutral": 0.2903 }, "mining bitcoin": { "positive": -0.2385, "negative": -0.0129, "neutral": 0.2514 }, "mining blockscale": { "positive": -0.0732, "negative": 88e-4, "neutral": 0.0644 }, "mining boom": { "positive": 0.425, "negative": -0.1335, "neutral": -0.2916 }, "mining companies": { "positive": -0.0328, "negative": 0.3244, "neutral": -0.2916 }, "mining energy": { "positive": -0.0415, "negative": -0.0322, "neutral": 0.0737 }, "mining hub": { "positive": -0.029, "negative": 0.1342, "neutral": -0.1052 }, "mining operation": { "positive": -0.0608, "negative": 0.0319, "neutral": 0.0289 }, "mining pools": { "positive": -0.1296, "negative": 0.1474, "neutral": -0.0178 }, "mining power": { "positive": -0.1181, "negative": -0.0848, "neutral": 0.2029 }, "minnesota": { "positive": -0.0266, "negative": 91e-4, "neutral": 0.0174 }, "mint": { "positive": -0.1622, "negative": -88e-4, "neutral": 0.171 }, "minute": { "positive": -0.0753, "negative": -0.146, "neutral": 0.2213 }, "minutes": { "positive": -0.1871, "negative": 0.1886, "neutral": -15e-4 }, "misery": { "positive": -0.0329, "negative": 0.0552, "neutral": -0.0223 }, "misery trash": { "positive": -0.0329, "negative": 0.0552, "neutral": -0.0223 }, "mishandling": { "positive": -72e-4, "negative": 0.0272, "neutral": -0.0199 }, "mishandling funds": { "positive": -72e-4, "negative": 0.0272, "neutral": -0.0199 }, "misleading": { "positive": -0.104, "negative": 0.1834, "neutral": -0.0794 }, "miss": { "positive": 0.4993, "negative": -0.2482, "neutral": -0.2512 }, "miss out": { "positive": 0.0857, "negative": -0.0372, "neutral": -0.0485 }, "missing": { "positive": -0.1444, "negative": -0.1442, "neutral": 0.2886 }, "mission": { "positive": -0.162, "negative": -0.2101, "neutral": 0.3721 }, "mission focused": { "positive": -0.0743, "negative": -0.1099, "neutral": 0.1842 }, "mistake": { "positive": -0.071, "negative": 0.367, "neutral": -0.296 }, "mit": { "positive": -0.2539, "negative": 0.1101, "neutral": 0.1437 }, "mix": { "positive": -0.1011, "negative": -0.0905, "neutral": 0.1917 }, "mixing": { "positive": -0.0503, "negative": 0.0132, "neutral": 0.037 }, "mln": { "positive": -0.1348, "negative": -0.0503, "neutral": 0.1851 }, "mms": { "positive": 0.1857, "negative": -0.1323, "neutral": -0.0533 }, "mn": { "positive": 0.2497, "negative": -0.0442, "neutral": -0.2055 }, "mn hophn": { "positive": 0.2497, "negative": -0.0442, "neutral": -0.2055 }, "mobile": { "positive": 0.0156, "negative": -0.0435, "neutral": 0.0279 }, "mode": { "positive": 0.2178, "negative": -0.1526, "neutral": -0.0652 }, "model": { "positive": -0.272, "negative": -0.0135, "neutral": 0.2855 }, "models": { "positive": -0.0952, "negative": -0.1193, "neutral": 0.2145 }, "modular": { "positive": 0.1359, "negative": -0.0258, "neutral": -0.1102 }, "moment": { "positive": 0.2189, "negative": -0.0581, "neutral": -0.1608 }, "momentum": { "positive": 0.9958, "negative": -0.1811, "neutral": -0.8147 }, "momentum building": { "positive": 0.7655, "negative": -0.2003, "neutral": -0.5652 }, "monero": { "positive": 0.0231, "negative": -0.2457, "neutral": 0.2226 }, "money": { "positive": 0.2073, "negative": 0.5277, "neutral": -0.735 }, "money accumulating": { "positive": 0.3178, "negative": -0.2356, "neutral": -0.0822 }, "money gone": { "positive": -0.1192, "negative": 0.2382, "neutral": -0.119 }, "money laundering": { "positive": -0.0456, "negative": 0.152, "neutral": -0.1065 }, "money printing": { "positive": 0.3704, "negative": -0.1729, "neutral": -0.1975 }, "money'": { "positive": -0.147, "negative": 0.0994, "neutral": 0.0476 }, "moneygram": { "positive": -0.1376, "negative": -0.1201, "neutral": 0.2576 }, "monitor": { "positive": 0.0533, "negative": -0.1967, "neutral": 0.1434 }, "month": { "positive": 1e-4, "negative": 0.2634, "neutral": -0.2635 }, "month month": { "positive": -0.0666, "negative": 0.1514, "neutral": -0.0848 }, "month years": { "positive": -0.0148, "negative": 0.0414, "neutral": -0.0266 }, "months": { "positive": 0.2583, "negative": -0.0449, "neutral": -0.2134 }, "months prison": { "positive": -0.0175, "negative": 0.1255, "neutral": -0.108 }, "moon": { "positive": 2.038, "negative": -0.4931, "neutral": -1.5449 }, "moon shot": { "positive": 0.1472, "negative": -0.0624, "neutral": -0.0848 }, "moratorium": { "positive": -0.1191, "negative": -0.1983, "neutral": 0.3174 }, "more": { "positive": 0.13, "negative": -0.3913, "neutral": 0.2613 }, "more bullish": { "positive": 0.1013, "negative": -0.054, "neutral": -0.0472 }, "more here": { "positive": 0.2066, "negative": -0.0279, "neutral": -0.1788 }, "more money": { "positive": 0.0477, "negative": -0.0237, "neutral": -0.024 }, "more people": { "positive": 0.1261, "negative": -0.0255, "neutral": -0.1007 }, "more than": { "positive": -0.1214, "negative": -0.1392, "neutral": 0.2605 }, "more tokens": { "positive": -0.0282, "negative": -0.0449, "neutral": 0.0731 }, "morgan": { "positive": 0.0999, "negative": -0.2496, "neutral": 0.1497 }, "morgan stanley": { "positive": 0.1544, "negative": -0.1323, "neutral": -0.0221 }, "morning": { "positive": 0.0811, "negative": 15e-4, "neutral": -0.0826 }, "most": { "positive": 0.3108, "negative": -17e-4, "neutral": -0.3092 }, "most bullish": { "positive": 0.1793, "negative": -0.1491, "neutral": -0.0302 }, "most likely": { "positive": -0.1479, "negative": 0.1704, "neutral": -0.0225 }, "mounting": { "positive": -0.06, "negative": -0.1151, "neutral": 0.1751 }, "mouth": { "positive": -0.3797, "negative": -0.4271, "neutral": 0.8068 }, "move": { "positive": 0.0986, "negative": -0.2396, "neutral": 0.141 }, "moved": { "positive": -0.0268, "negative": 0.1319, "neutral": -0.105 }, "movement": { "positive": -0.1, "negative": 0.2143, "neutral": -0.1144 }, "moves": { "positive": 0.1208, "negative": -0.2143, "neutral": 0.0935 }, "moves $nonja": { "positive": -0.1713, "negative": -67e-4, "neutral": 0.178 }, "movie": { "positive": 0.1336, "negative": -0.0278, "neutral": -0.1058 }, "moving": { "positive": 0.0374, "negative": -0.0433, "neutral": 6e-3 }, "moving up": { "positive": -0.1698, "negative": -0.1524, "neutral": 0.3222 }, "mt": { "positive": -0.0583, "negative": 0.0822, "neutral": -0.0239 }, "mt gox": { "positive": -0.0583, "negative": 0.0822, "neutral": -0.0239 }, "much": { "positive": 0.2588, "negative": -0.2333, "neutral": -0.0254 }, "multi": { "positive": 0.2206, "negative": -0.163, "neutral": -0.0576 }, "multiple": { "positive": 0.0446, "negative": 0.0591, "neutral": -0.1037 }, "multiple catalysts": { "positive": 0.0537, "negative": -0.0413, "neutral": -0.0125 }, "music": { "positive": -0.1137, "negative": -0.1437, "neutral": 0.2574 }, "musk": { "positive": 0.0454, "negative": 0.0607, "neutral": -0.1061 }, "nails": { "positive": -0.0368, "negative": 0.0154, "neutral": 0.0214 }, "name": { "positive": -0.0844, "negative": 0.1029, "neutral": -0.0185 }, "nancy": { "positive": -0.0857, "negative": 0.0745, "neutral": 0.0113 }, "narrative": { "positive": 0.158, "negative": -0.0462, "neutral": -0.1118 }, "narratives": { "positive": -0.0447, "negative": 0.0832, "neutral": -0.0385 }, "nasa": { "positive": -0.0836, "negative": -0.0936, "neutral": 0.1771 }, "national": { "positive": -82e-4, "negative": -0.0181, "neutral": 0.0264 }, "native": { "positive": -0.0549, "negative": -0.3202, "neutral": 0.375 }, "native blockchain": { "positive": -0.0309, "negative": -0.044, "neutral": 0.0749 }, "nd": { "positive": -65e-4, "negative": -0.0229, "neutral": 0.0294 }, "ndt": { "positive": 0.0951, "negative": -0.0725, "neutral": -0.0226 }, "ndt yzv": { "positive": 0.0951, "negative": -0.0725, "neutral": -0.0226 }, "near": { "positive": -85e-4, "negative": 0.2223, "neutral": -0.2138 }, "near foundation": { "positive": 0.0412, "negative": -0.0214, "neutral": -0.0198 }, "near powered": { "positive": 0.0412, "negative": -0.0214, "neutral": -0.0198 }, "nearly": { "positive": -0.181, "negative": 0.392, "neutral": -0.2111 }, "nears": { "positive": 0.0606, "negative": -0.0296, "neutral": -0.031 }, "necessary": { "positive": -0.0173, "negative": -0.0623, "neutral": 0.0797 }, "need": { "positive": -0.3043, "negative": 0.1848, "neutral": 0.1195 }, "need farm": { "positive": -0.164, "negative": 0.1913, "neutral": -0.0273 }, "needed": { "positive": 0.1117, "negative": -0.1497, "neutral": 0.038 }, "needs": { "positive": 0.2103, "negative": -0.1599, "neutral": -0.0504 }, "negative": { "positive": -0.132, "negative": 0.2059, "neutral": -0.074 }, "nervous": { "positive": -0.0794, "negative": -0.0779, "neutral": 0.1573 }, "net": { "positive": -0.0656, "negative": 0.3328, "neutral": -0.2671 }, "net domain": { "positive": -0.0977, "negative": -0.0171, "neutral": 0.1148 }, "network": { "positive": -0.2038, "negative": 0.2102, "neutral": -63e-4 }, "network upgrade": { "positive": 0.2446, "negative": -0.0819, "neutral": -0.1626 }, "networks": { "positive": -0.0448, "negative": -3e-4, "neutral": 0.0452 }, "neural": { "positive": -0.1264, "negative": -0.1319, "neutral": 0.2583 }, "never": { "positive": -0.7031, "negative": 0.3366, "neutral": 0.3665 }, "new": { "positive": 0.2174, "negative": -0.3074, "neutral": 0.09 }, "new all": { "positive": 0.2074, "negative": -0.1184, "neutral": -0.089 }, "new ath": { "positive": 0.1851, "negative": -0.0321, "neutral": -0.153 }, "new crypto": { "positive": -0.1997, "negative": -0.2172, "neutral": 0.4169 }, "new era": { "positive": 0.0939, "negative": -0.0231, "neutral": -0.0708 }, "new highs": { "positive": 0.0905, "negative": -0.0296, "neutral": -0.0609 }, "new jersey": { "positive": -0.0669, "negative": -0.0842, "neutral": 0.1512 }, "new lows": { "positive": -0.105, "negative": 0.0243, "neutral": 0.0807 }, "new study": { "positive": -0.2509, "negative": -0.1462, "neutral": 0.3971 }, "new york": { "positive": -0.1256, "negative": -0.1199, "neutral": 0.2455 }, "news": { "positive": 0.2348, "negative": -0.1425, "neutral": -0.0923 }, "news today": { "positive": -0.5414, "negative": -0.4314, "neutral": 0.9728 }, "next": { "positive": 0.6005, "negative": -0.2983, "neutral": -0.3021 }, "next bch": { "positive": 0.0795, "negative": -0.0229, "neutral": -0.0566 }, "next bull": { "positive": 0.1743, "negative": -0.0714, "neutral": -0.1028 }, "next crypto": { "positive": -0.212, "negative": -0.1625, "neutral": 0.3745 }, "next few": { "positive": 0.0687, "negative": -0.0166, "neutral": -0.0522 }, "next financial": { "positive": -0.0419, "negative": 0.313, "neutral": -0.2712 }, "next gen": { "positive": 0.0899, "negative": -0.0248, "neutral": -0.0651 }, "next leg": { "positive": 0.3139, "negative": -0.1992, "neutral": -0.1147 }, "next level": { "positive": -0.1774, "negative": -0.0672, "neutral": 0.2446 }, "next week": { "positive": -0.1076, "negative": 0.0307, "neutral": 0.0769 }, "next year": { "positive": 0.3488, "negative": -0.1181, "neutral": -0.2307 }, "nft": { "positive": 0.0298, "negative": -0.1513, "neutral": 0.1215 }, "nft sales": { "positive": 0.0473, "negative": 0.1942, "neutral": -0.2415 }, "nfts": { "positive": -0.0796, "negative": 0.3436, "neutral": -0.264 }, "nice": { "positive": 1.4033, "negative": -0.5161, "neutral": -0.8872 }, "nice bounce": { "positive": 0.1718, "negative": -0.0266, "neutral": -0.1452 }, "nice run": { "positive": 0.2902, "negative": -0.074, "neutral": -0.2161 }, "nice see": { "positive": 0.2279, "negative": -0.0865, "neutral": -0.1414 }, "nicehash": { "positive": -0.041, "negative": 0.1549, "neutral": -0.114 }, "nix": { "positive": -0.0672, "negative": 0.0312, "neutral": 0.036 }, "no": { "positive": -0.8668, "negative": 0.4869, "neutral": 0.3799 }, "no clear": { "positive": -0.1312, "negative": -0.171, "neutral": 0.3022 }, "no crypto": { "positive": -0.0106, "negative": -0.1471, "neutral": 0.1576 }, "no login": { "positive": -0.0302, "negative": 0.2131, "neutral": -0.1829 }, "no longer": { "positive": -0.021, "negative": -25e-4, "neutral": 0.0235 }, "no more": { "positive": 0.1665, "negative": 0.0935, "neutral": -0.26 }, "no one": { "positive": 0.0329, "negative": 0.0208, "neutral": -0.0536 }, "no use": { "positive": -0.0577, "negative": -0.1619, "neutral": 0.2196 }, "nobel": { "positive": -0.101, "negative": 0.0525, "neutral": 0.0485 }, "nobel laureate": { "positive": -0.101, "negative": 0.0525, "neutral": 0.0485 }, "nobitex": { "positive": -0.0102, "negative": 0.053, "neutral": -0.0428 }, "nobitex hacked": { "positive": -0.0102, "negative": 0.053, "neutral": -0.0428 }, "nobody": { "positive": -0.4958, "negative": 0.155, "neutral": 0.3408 }, "node": { "positive": 12e-4, "negative": -0.0989, "neutral": 0.0977 }, "nodes": { "positive": -0.1107, "negative": -0.1039, "neutral": 0.2146 }, "noise": { "positive": 0.1786, "negative": -0.0327, "neutral": -0.1459 }, "nomina": { "positive": 0.0741, "negative": -0.0212, "neutral": -0.0529 }, "non": { "positive": -0.0807, "negative": -0.1365, "neutral": 0.2173 }, "nonja": { "positive": 0.0347, "negative": -38e-4, "neutral": -0.0309 }, "nonsense": { "positive": -0.1005, "negative": 0.5343, "neutral": -0.4338 }, "nope": { "positive": -0.063, "negative": 0.0778, "neutral": -0.0147 }, "north": { "positive": -0.192, "negative": 0.5842, "neutral": -0.3922 }, "north american": { "positive": 0.039, "negative": 0.0328, "neutral": -0.0718 }, "north korea": { "positive": -0.0753, "negative": 0.2812, "neutral": -0.2059 }, "north korea's": { "positive": -0.01, "negative": 0.0218, "neutral": -0.0118 }, "north korean": { "positive": -0.0461, "negative": 0.141, "neutral": -0.0949 }, "not": { "positive": -0.3941, "negative": 0.1182, "neutral": 0.2758 }, "not accept": { "positive": -0.0331, "negative": -0.06, "neutral": 0.0931 }, "not all": { "positive": 74e-4, "negative": -0.2266, "neutral": 0.2191 }, "not bullish": { "positive": -0.8606, "negative": 1.0803, "neutral": -0.2198 }, "not even": { "positive": 0.0948, "negative": 0.0524, "neutral": -0.1472 }, "not financial": { "positive": 52e-4, "negative": 0.0966, "neutral": -0.1019 }, "not just": { "positive": 0.0724, "negative": -0.0635, "neutral": -88e-4 }, "not long": { "positive": -0.3241, "negative": 0.345, "neutral": -0.0209 }, "not next": { "positive": 0.0816, "negative": -0.1499, "neutral": 0.0683 }, "not public": { "positive": -0.0851, "negative": -0.0273, "neutral": 0.1123 }, "not scam": { "positive": 0.4251, "negative": -0.3165, "neutral": -0.1086 }, "not short": { "positive": 0.1331, "negative": -0.1265, "neutral": -67e-4 }, "not too": { "positive": 0.0116, "negative": 0.1358, "neutral": -0.1474 }, "not used": { "positive": -0.1195, "negative": 0.1334, "neutral": -0.0139 }, "notes": { "positive": -0.1307, "negative": -0.0653, "neutral": 0.196 }, "nothing": { "positive": 0.161, "negative": -0.1781, "neutral": 0.0172 }, "nothing ing": { "positive": -0.0168, "negative": 0.0566, "neutral": -0.0398 }, "notice": { "positive": 0.1126, "negative": 0.0343, "neutral": -0.1469 }, "notification": { "positive": 0.0876, "negative": -97e-4, "neutral": -0.0779 }, "notifications": { "positive": 0.1204, "negative": -0.086, "neutral": -0.0344 }, "now": { "positive": 0.0271, "negative": 0.0595, "neutral": -0.0866 }, "now accepts": { "positive": -0.0889, "negative": -0.1055, "neutral": 0.1944 }, "now lol": { "positive": -0.1367, "negative": 0.2719, "neutral": -0.1352 }, "now time": { "positive": 0.0253, "negative": -0.0137, "neutral": -0.0117 }, "npm": { "positive": -0.0782, "negative": 0.2103, "neutral": -0.132 }, "nsa": { "positive": -0.0791, "negative": 0.2079, "neutral": -0.1288 }, "nuclear": { "positive": -0.0964, "negative": 0.2996, "neutral": -0.2032 }, "number": { "positive": 53e-4, "negative": -0.0238, "neutral": 0.0185 }, "nvidia": { "positive": -0.1453, "negative": 0.1688, "neutral": -0.0235 }, "nvidia instead": { "positive": -0.0631, "negative": 0.1029, "neutral": -0.0398 }, "nyt": { "positive": 0.0432, "negative": 0.0862, "neutral": -0.1294 }, "oceanpal": { "positive": 0.0412, "negative": -0.0214, "neutral": -0.0198 }, "oceanpal partnership": { "positive": 0.0412, "negative": -0.0214, "neutral": -0.0198 }, "october": { "positive": -94e-4, "negative": -0.1314, "neutral": 0.1407 }, "off": { "positive": -0.0461, "negative": -0.2513, "neutral": 0.2974 }, "off apecoin": { "positive": -0.0565, "negative": -0.0775, "neutral": 0.134 }, "offering": { "positive": 0.1239, "negative": 0.0317, "neutral": -0.1556 }, "offers": { "positive": -0.1934, "negative": -0.253, "neutral": 0.4464 }, "office": { "positive": -0.0645, "negative": 0.0603, "neutral": 42e-4 }, "officer": { "positive": -0.0381, "negative": -0.116, "neutral": 0.1541 }, "official": { "positive": 0.281, "negative": -0.0559, "neutral": -0.2251 }, "officials": { "positive": 0.0625, "negative": -0.0508, "neutral": -0.0118 }, "offline": { "positive": -0.1224, "negative": 0.0753, "neutral": 0.0471 }, "often": { "positive": 0.0187, "negative": -0.0913, "neutral": 0.0726 }, "oh": { "positive": 0.0901, "negative": -0.071, "neutral": -0.0191 }, "oh god": { "positive": 0.0265, "negative": -0.0159, "neutral": -0.0106 }, "okay": { "positive": 0.0382, "negative": -0.1104, "neutral": 0.0721 }, "old": { "positive": -0.2, "negative": 0.2184, "neutral": -0.0184 }, "omg": { "positive": -0.0617, "negative": 0.1792, "neutral": -0.1175 }, "once": { "positive": 0.0438, "negative": 0.2361, "neutral": -0.2799 }, "one": { "positive": -0.3038, "negative": 0.5565, "neutral": -0.2527 }, "one best": { "positive": 0.1487, "negative": -0.0924, "neutral": -0.0563 }, "one ever": { "positive": 0.0247, "negative": -0.0103, "neutral": -0.0145 }, "one ing": { "positive": -0.0327, "negative": 0.1186, "neutral": -0.0859 }, "one largest": { "positive": -0.0387, "negative": 0.2651, "neutral": -0.2264 }, "one memes": { "positive": 0.2335, "negative": -0.0518, "neutral": -0.1817 }, "one more": { "positive": -0.2707, "negative": -0.1393, "neutral": 0.41 }, "one thing": { "positive": -0.1204, "negative": -0.2745, "neutral": 0.3949 }, "one time": { "positive": -0.0107, "negative": -0.059, "neutral": 0.0697 }, "online": { "positive": -0.1483, "negative": 0.1385, "neutral": 98e-4 }, "only": { "positive": 0.1069, "negative": -0.2178, "neutral": 0.111 }, "only million": { "positive": 0.0301, "negative": -0.0172, "neutral": -0.0129 }, "only thank": { "positive": -0.0379, "negative": 0.0413, "neutral": -34e-4 }, "only way": { "positive": -0.1107, "negative": -0.028, "neutral": 0.1387 }, "open": { "positive": -0.4344, "negative": -0.3842, "neutral": 0.8186 }, "open source": { "positive": -0.0829, "negative": -0.0388, "neutral": 0.1217 }, "openai": { "positive": 0.273, "negative": 0.2187, "neutral": -0.4917 }, "opening": { "positive": -0.1364, "negative": 0.0752, "neutral": 0.0612 }, "opens": { "positive": 0.2004, "negative": 0.2105, "neutral": -0.4109 }, "operating": { "positive": -0.0307, "negative": -51e-4, "neutral": 0.0357 }, "operation": { "positive": -0.0608, "negative": 0.0319, "neutral": 0.0289 }, "operations": { "positive": -0.0557, "negative": 0.0566, "neutral": -1e-3 }, "opportunity": { "positive": 0.0623, "negative": -0.2682, "neutral": 0.2059 }, "optimism": { "positive": 0.2564, "negative": 0.1141, "neutral": -0.3705 }, "optimistic": { "positive": 0.7495, "negative": -0.1626, "neutral": -0.5869 }, "option": { "positive": 0.0402, "negative": -0.0517, "neutral": 0.0115 }, "options": { "positive": -0.0878, "negative": -0.1245, "neutral": 0.2123 }, "orange": { "positive": -0.1576, "negative": -0.1514, "neutral": 0.309 }, "order": { "positive": -0.1495, "negative": 0.0199, "neutral": 0.1296 }, "order book": { "positive": -89e-4, "negative": -0.0579, "neutral": 0.0668 }, "order books": { "positive": -0.0394, "negative": 0.0338, "neutral": 56e-4 }, "ordered": { "positive": -0.096, "negative": -0.1945, "neutral": 0.2905 }, "orderly": { "positive": -0.0367, "negative": 0.0436, "neutral": -69e-4 }, "orderly exit": { "positive": -0.0367, "negative": 0.0436, "neutral": -69e-4 }, "orders": { "positive": -0.1224, "negative": 0.0995, "neutral": 0.0229 }, "original": { "positive": -0.0814, "negative": -0.1683, "neutral": 0.2496 }, "orm": { "positive": -0.0408, "negative": 0.0896, "neutral": -0.0488 }, "os": { "positive": -0.1444, "negative": 0.3172, "neutral": -0.1729 }, "other": { "positive": 0.0929, "negative": 0.28, "neutral": -0.3729 }, "other coins": { "positive": -0.0916, "negative": 0.1284, "neutral": -0.0368 }, "other cryptocurrencies": { "positive": -0.0479, "negative": 0.1769, "neutral": -0.129 }, "other cryptocurrency": { "positive": -0.082, "negative": 0.2525, "neutral": -0.1705 }, "others": { "positive": -0.0702, "negative": 0.1042, "neutral": -0.034 }, "out": { "positive": 0.0923, "negative": 0.2279, "neutral": -0.3202 }, "out chart": { "positive": 0.0904, "negative": -0.0699, "neutral": -0.0205 }, "out crypto": { "positive": -0.0405, "negative": 0.1556, "neutral": -0.1151 }, "out fundamentals": { "positive": 0.1687, "negative": -0.0843, "neutral": -0.0844 }, "out get": { "positive": -0.3487, "negative": -0.157, "neutral": 0.5057 }, "out momentum": { "positive": 0.2521, "negative": -0.0658, "neutral": -0.1863 }, "out smart": { "positive": 0.1086, "negative": -0.0862, "neutral": -0.0223 }, "out support": { "positive": 0.123, "negative": -0.0776, "neutral": -0.0454 }, "out there": { "positive": 0.063, "negative": -0.0392, "neutral": -0.0238 }, "out volume": { "positive": 0.251, "negative": -0.1047, "neutral": -0.1463 }, "outage": { "positive": -0.2101, "negative": 0.9098, "neutral": -0.6997 }, "outflows": { "positive": -0.0951, "negative": 0.3191, "neutral": -0.224 }, "outlook": { "positive": 0.3234, "negative": -0.1427, "neutral": -0.1808 }, "outperform": { "positive": 0.7319, "negative": -0.1721, "neutral": -0.5598 }, "over": { "positive": -0.0584, "negative": 0.1225, "neutral": -0.0641 }, "over alleged": { "positive": -0.0297, "negative": 0.0938, "neutral": -0.064 }, "over bitcoin": { "positive": -0.0299, "negative": -0.0459, "neutral": 0.0757 }, "over crypto": { "positive": -0.0227, "negative": 0.0663, "neutral": -0.0436 }, "over here": { "positive": 0.1528, "negative": -0.0274, "neutral": -0.1253 }, "over past": { "positive": 0.1871, "negative": -0.2302, "neutral": 0.0431 }, "over people": { "positive": -0.1621, "negative": -0.2871, "neutral": 0.4492 }, "overnight": { "positive": -0.0146, "negative": 0.0426, "neutral": -0.0281 }, "overseas": { "positive": -0.0319, "negative": 0.1131, "neutral": -0.0812 }, "oversold": { "positive": -0.0249, "negative": -0.0987, "neutral": 0.1236 }, "overtakes": { "positive": -0.0884, "negative": 0.0739, "neutral": 0.0144 }, "overtakes china": { "positive": -0.0884, "negative": 0.0739, "neutral": 0.0144 }, "own": { "positive": -0.0217, "negative": -0.21, "neutral": 0.2317 }, "own crypto": { "positive": -0.1005, "negative": -0.0632, "neutral": 0.1637 }, "owned": { "positive": -0.011, "negative": 0.049, "neutral": -0.038 }, "owner": { "positive": -0.0702, "negative": -0.0438, "neutral": 0.114 }, "owns": { "positive": -0.1689, "negative": -0.1876, "neutral": 0.3565 }, "ozempic": { "positive": -0.1048, "negative": -0.0489, "neutral": 0.1537 }, "packages": { "positive": -0.0288, "negative": 0.1564, "neutral": -0.1276 }, "packed": { "positive": 0.1579, "negative": -0.0337, "neutral": -0.1242 }, "page": { "positive": -0.0148, "negative": 0.0384, "neutral": -0.0236 }, "paid": { "positive": -0.2383, "negative": 0.2758, "neutral": -0.0374 }, "pain": { "positive": 0.0662, "negative": -0.0238, "neutral": -0.0423 }, "paint": { "positive": -0.1396, "negative": 0.2153, "neutral": -0.0758 }, "paint net": { "positive": -0.1396, "negative": 0.2153, "neutral": -0.0758 }, "palantir": { "positive": 0.1013, "negative": -0.2064, "neutral": 0.1051 }, "pamp": { "positive": -0.0948, "negative": 0.0544, "neutral": 0.0404 }, "panic": { "positive": -0.2774, "negative": 0.7827, "neutral": -0.5053 }, "panicking": { "positive": -0.2166, "negative": 0.4452, "neutral": -0.2286 }, "paper": { "positive": 0.4025, "negative": -0.3598, "neutral": -0.0427 }, "parabolic": { "positive": 0.8877, "negative": -0.3251, "neutral": -0.5626 }, "pardon": { "positive": 0.0652, "negative": -0.1058, "neutral": 0.0406 }, "pardons": { "positive": -0.0434, "negative": -0.1443, "neutral": 0.1877 }, "pardons convicted": { "positive": -0.025, "negative": 0.3515, "neutral": -0.3264 }, "part": { "positive": 0.0538, "negative": -0.3519, "neutral": 0.2981 }, "partner": { "positive": -0.0152, "negative": -0.0348, "neutral": 0.05 }, "partners": { "positive": 0.3191, "negative": -0.1514, "neutral": -0.1677 }, "partnership": { "positive": 0.5661, "negative": -0.218, "neutral": -0.348 }, "partnership announced": { "positive": 0.2213, "negative": -0.0992, "neutral": -0.122 }, "partnership near": { "positive": 0.0412, "negative": -0.0214, "neutral": -0.0198 }, "partnerships": { "positive": 0.1643, "negative": -0.0549, "neutral": -0.1093 }, "party": { "positive": -0.0942, "negative": 0.3445, "neutral": -0.2504 }, "pass": { "positive": 0.1093, "negative": 0.1854, "neutral": -0.2947 }, "passes": { "positive": 0.3012, "negative": -0.1425, "neutral": -0.1587 }, "passes stablecoin": { "positive": 0.3012, "negative": -0.1425, "neutral": -0.1587 }, "passing": { "positive": -0.1409, "negative": 0.1304, "neutral": 0.0105 }, "password": { "positive": -0.1562, "negative": -0.2026, "neutral": 0.3588 }, "past": { "positive": 0.414, "negative": -0.2151, "neutral": -0.199 }, "paste": { "positive": -0.0332, "negative": -0.0858, "neutral": 0.119 }, "patch": { "positive": 0.0407, "negative": -0.1594, "neutral": 0.1187 }, "patent": { "positive": 0.2923, "negative": -0.1308, "neutral": -0.1615 }, "path": { "positive": -0.1342, "negative": -0.1419, "neutral": 0.2761 }, "patience": { "positive": 0.0498, "negative": 0.1335, "neutral": -0.1833 }, "pattern": { "positive": 0.1622, "negative": 0.1193, "neutral": -0.2814 }, "patterns": { "positive": 0.167, "negative": -0.1967, "neutral": 0.0297 }, "paused": { "positive": -0.0765, "negative": 0.1646, "neutral": -0.0881 }, "paving": { "positive": -0.0833, "negative": -0.101, "neutral": 0.1843 }, "pay": { "positive": 0.141, "negative": -0.1507, "neutral": 98e-4 }, "paying": { "positive": 0.4553, "negative": -0.3703, "neutral": -0.085 }, "payment": { "positive": 0.1332, "negative": -0.2954, "neutral": 0.1621 }, "payments": { "positive": -0.1615, "negative": -0.1745, "neutral": 0.336 }, "paypal": { "positive": -0.0638, "negative": -0.1183, "neutral": 0.1821 }, "pc": { "positive": 0.0698, "negative": -23e-4, "neutral": -0.0675 }, "pdf": { "positive": -0.4869, "negative": -0.0375, "neutral": 0.5244 }, "peace": { "positive": 0.1645, "negative": -0.0425, "neutral": -0.122 }, "peak": { "positive": -0.1754, "negative": 0.1867, "neutral": -0.0113 }, "peg": { "positive": -0.1218, "negative": 0.072, "neutral": 0.0498 }, "penalising": { "positive": -0.0106, "negative": 0.0641, "neutral": -0.0535 }, "penalising miners": { "positive": -0.0106, "negative": 0.0641, "neutral": -0.0535 }, "penny": { "positive": 0.1216, "negative": -0.0244, "neutral": -0.0972 }, "people": { "positive": 0.1857, "negative": 0.1878, "neutral": -0.3736 }, "people get": { "positive": 0.0536, "negative": -0.0241, "neutral": -0.0296 }, "people know": { "positive": -0.0344, "negative": 0.2447, "neutral": -0.2103 }, "people make": { "positive": -0.1232, "negative": 0.0144, "neutral": 0.1088 }, "pepe": { "positive": -0.0333, "negative": -0.0886, "neutral": 0.122 }, "per": { "positive": -0.1123, "negative": -0.2384, "neutral": 0.3507 }, "per month": { "positive": -0.084, "negative": 0.0995, "neutral": -0.0155 }, "percent": { "positive": 0.1297, "negative": 0.3116, "neutral": -0.4413 }, "perfect": { "positive": 1.4455, "negative": -0.3627, "neutral": -1.0828 }, "perfect time": { "positive": 0.1665, "negative": -0.0389, "neutral": -0.1276 }, "perfectly": { "positive": 0.3311, "negative": -0.1968, "neutral": -0.1344 }, "performance": { "positive": -0.0192, "negative": -0.0576, "neutral": 0.0768 }, "performing": { "positive": 0.2084, "negative": 0.1126, "neutral": -0.321 }, "period": { "positive": -0.0886, "negative": -0.0538, "neutral": 0.1424 }, "perma": { "positive": -0.1024, "negative": 0.1725, "neutral": -0.0701 }, "perma bears": { "positive": -0.1024, "negative": 0.1725, "neutral": -0.0701 }, "perplexity": { "positive": -0.0707, "negative": 0.2527, "neutral": -0.182 }, "person": { "positive": -0.1357, "negative": 0.0632, "neutral": 0.0725 }, "personal": { "positive": -0.0871, "negative": 0.0886, "neutral": -15e-4 }, "personal finance": { "positive": -0.0331, "negative": -0.0348, "neutral": 0.0678 }, "personal information": { "positive": -0.0274, "negative": 0.1668, "neutral": -0.1394 }, "perspective": { "positive": -0.0778, "negative": -0.1437, "neutral": 0.2215 }, "peter": { "positive": 0.1769, "negative": -0.1913, "neutral": 0.0143 }, "peter thiel": { "positive": 0.1208, "negative": -0.0566, "neutral": -0.0642 }, "peter thiel's": { "positive": 0.0561, "negative": -0.1347, "neutral": 0.0785 }, "pgp": { "positive": -0.0393, "negative": 0.0468, "neutral": -75e-4 }, "phantom": { "positive": 0.0686, "negative": -0.2142, "neutral": 0.1456 }, "phantom wallet": { "positive": -0.0925, "negative": -0.2116, "neutral": 0.3042 }, "phase": { "positive": 0.2353, "negative": -0.0474, "neutral": -0.1879 }, "phishing": { "positive": 0.1124, "negative": -0.3725, "neutral": 0.2601 }, "phone": { "positive": 0.3446, "negative": -0.0714, "neutral": -0.2732 }, "photos": { "positive": -0.0559, "negative": 0.2636, "neutral": -0.2077 }, "php": { "positive": -0.1101, "negative": -0.1512, "neutral": 0.2613 }, "phrase": { "positive": -0.0555, "negative": 0.2413, "neutral": -0.1858 }, "pi": { "positive": -0.1193, "negative": -0.0738, "neutral": 0.1931 }, "pick": { "positive": 0.2682, "negative": 0.0651, "neutral": -0.3333 }, "picking": { "positive": -0.0879, "negative": -0.1297, "neutral": 0.2175 }, "picks": { "positive": 0.0776, "negative": -0.0259, "neutral": -0.0516 }, "piece": { "positive": -0.3292, "negative": 0.7099, "neutral": -0.3807 }, "piece fucking": { "positive": -0.0185, "negative": 0.0365, "neutral": -0.018 }, "piece sh": { "positive": -0.0605, "negative": 0.0774, "neutral": -0.0169 }, "piece shit": { "positive": -0.1004, "negative": 0.2036, "neutral": -0.1032 }, "piece shitcoin": { "positive": -0.0743, "negative": 0.2233, "neutral": -0.1489 }, "pile": { "positive": -0.082, "negative": 0.1372, "neutral": -0.0552 }, "pipe": { "positive": 0.0412, "negative": -0.0214, "neutral": -0.0198 }, "pipe investment": { "positive": 0.0412, "negative": -0.0214, "neutral": -0.0198 }, "place": { "positive": 0.1305, "negative": -0.3079, "neutral": 0.1774 }, "plan": { "positive": 0.4129, "negative": -0.2713, "neutral": -0.1416 }, "plans": { "positive": 0.2512, "negative": -0.0694, "neutral": -0.1818 }, "plate": { "positive": -0.1889, "negative": 0.0259, "neutral": 0.163 }, "platform mango": { "positive": -0.0308, "negative": 0.1975, "neutral": -0.1667 }, "platforms": { "positive": 0.1121, "negative": -0.0164, "neutral": -0.0957 }, "play": { "positive": -0.0616, "negative": -0.0938, "neutral": 0.1554 }, "plays": { "positive": 0.1173, "negative": -0.0374, "neutral": -0.0799 }, "plea": { "positive": -0.1248, "negative": 0.4672, "neutral": -0.3424 }, "plead": { "positive": -0.0382, "negative": 0.0694, "neutral": -0.0311 }, "plead guilty": { "positive": -0.0382, "negative": 0.0694, "neutral": -0.0311 }, "pleads": { "positive": -0.0906, "negative": 0.3263, "neutral": -0.2357 }, "pleads guilty": { "positive": -0.0906, "negative": 0.3263, "neutral": -0.2357 }, "please": { "positive": -0.0944, "negative": -47e-4, "neutral": 0.0991 }, "plummet": { "positive": -0.1301, "negative": 0.3537, "neutral": -0.2236 }, "plummeting": { "positive": -0.2806, "negative": 0.7139, "neutral": -0.4333 }, "plummets": { "positive": -0.2638, "negative": 0.9348, "neutral": -0.671 }, "plunges": { "positive": -0.1814, "negative": 0.5247, "neutral": -0.3433 }, "point": { "positive": 0.3738, "negative": -0.1444, "neutral": -0.2294 }, "points": { "positive": -0.0454, "negative": -0.0941, "neutral": 0.1395 }, "poison": { "positive": -0.1048, "negative": 0.4851, "neutral": -0.3803 }, "police": { "positive": -0.2499, "negative": 0.4516, "neutral": -0.2017 }, "police arrest": { "positive": -9e-3, "negative": 0.0849, "neutral": -0.0759 }, "policy": { "positive": 0.0964, "negative": -0.1838, "neutral": 0.0874 }, "polish": { "positive": -0.0653, "negative": 0.3221, "neutral": -0.2568 }, "political": { "positive": -0.1569, "negative": 3e-4, "neutral": 0.1566 }, "politics": { "positive": -0.0767, "negative": 0.1593, "neutral": -0.0826 }, "polkadot": { "positive": 0.1205, "negative": 0.2433, "neutral": -0.3637 }, "polygon": { "positive": -0.1327, "negative": -0.0409, "neutral": 0.1736 }, "ponzi": { "positive": -0.4343, "negative": 1.2144, "neutral": -0.7801 }, "ponzi scheme": { "positive": -0.1476, "negative": 0.4354, "neutral": -0.2879 }, "ponzi schemes": { "positive": -0.1419, "negative": 0.3824, "neutral": -0.2405 }, "pool": { "positive": -0.0575, "negative": 0.1553, "neutral": -0.0977 }, "pools": { "positive": -0.185, "negative": 0.0399, "neutral": 0.1451 }, "poor": { "positive": -0.025, "negative": 0.0741, "neutral": -0.0491 }, "pop": { "positive": -46e-4, "negative": 0.1481, "neutral": -0.1435 }, "portfolio": { "positive": 0.0234, "negative": 0.1396, "neutral": -0.163 }, "pos": { "positive": -0.0468, "negative": -0.0557, "neutral": 0.1025 }, "position": { "positive": -0.05, "negative": 0.1186, "neutral": -0.0686 }, "position here": { "positive": 0.0923, "negative": -0.0571, "neutral": -0.0352 }, "positioned": { "positive": 0.1124, "negative": -0.0409, "neutral": -0.0714 }, "possible": { "positive": 0.5711, "negative": -0.2549, "neutral": -0.3161 }, "post": { "positive": -0.2583, "negative": 0.1659, "neutral": 0.0923 }, "post quantum": { "positive": -0.054, "negative": 0.0612, "neutral": -72e-4 }, "post so": { "positive": 0.0537, "negative": -0.0413, "neutral": -0.0125 }, "posted": { "positive": -0.1098, "negative": -0.1847, "neutral": 0.2945 }, "postgresql": { "positive": -0.0994, "negative": -0.1635, "neutral": 0.2629 }, "posting": { "positive": -0.1397, "negative": -0.0678, "neutral": 0.2075 }, "posts": { "positive": 0.0469, "negative": -0.1209, "neutral": 0.074 }, "potential": { "positive": 0.4956, "negative": -0.3234, "neutral": -0.1722 }, "pow": { "positive": 0.3622, "negative": -0.0822, "neutral": -0.28 }, "power": { "positive": 0.0128, "negative": -0.0926, "neutral": 0.0799 }, "power cryptocurrencies": { "positive": 0.1264, "negative": -0.0351, "neutral": -0.0913 }, "powered": { "positive": 0.1818, "negative": -0.2638, "neutral": 0.082 }, "powered ai": { "positive": 0.0412, "negative": -0.0214, "neutral": -0.0198 }, "powerful": { "positive": -0.1138, "negative": -0.0989, "neutral": 0.2127 }, "pre": { "positive": -0.3066, "negative": 0.0636, "neutral": 0.243 }, "prediction": { "positive": -0.4259, "negative": -0.1601, "neutral": 0.586 }, "prediction market": { "positive": -0.0455, "negative": 0.0431, "neutral": 24e-4 }, "prediction markets": { "positive": -0.0612, "negative": -0.2255, "neutral": 0.2868 }, "prepares": { "positive": -0.0299, "negative": 0.1033, "neutral": -0.0734 }, "president": { "positive": -0.0227, "negative": 0.1203, "neutral": -0.0977 }, "pressure": { "positive": -0.1963, "negative": 0.0725, "neutral": 0.1238 }, "presumed": { "positive": -0.0476, "negative": 0.2876, "neutral": -0.24 }, "pretty": { "positive": -0.268, "negative": 0.3383, "neutral": -0.0703 }, "prevented": { "positive": -0.0519, "negative": 0.3777, "neutral": -0.3258 }, "previous": { "positive": 0.1543, "negative": 0.1302, "neutral": -0.2844 }, "previously": { "positive": 0.0537, "negative": -0.0413, "neutral": -0.0125 }, "previously post": { "positive": 0.0537, "negative": -0.0413, "neutral": -0.0125 }, "price": { "positive": 0.173, "negative": -0.1221, "neutral": -0.0509 }, "price action": { "positive": -0.2341, "negative": 0.3172, "neutral": -0.0831 }, "price inflation": { "positive": 0.0293, "negative": 0.0662, "neutral": -0.0955 }, "price prediction": { "positive": -0.274, "negative": -0.2055, "neutral": 0.4794 }, "price surge": { "positive": 0.2437, "negative": -0.1304, "neutral": -0.1134 }, "price target": { "positive": 0.1202, "negative": -0.0248, "neutral": -0.0954 }, "prices": { "positive": 0.1615, "negative": 0.3004, "neutral": -0.4619 }, "printing": { "positive": 0.174, "negative": -0.246, "neutral": 0.0719 }, "prison": { "positive": -0.3122, "negative": 1.0789, "neutral": -0.7668 }, "prison time": { "positive": -0.0823, "negative": 0.2432, "neutral": -0.1609 }, "privacy": { "positive": 0.025, "negative": -0.0959, "neutral": 0.0709 }, "privacy coins": { "positive": 0.1594, "negative": -0.0598, "neutral": -0.0996 }, "private": { "positive": -0.0535, "negative": 0.1308, "neutral": -0.0773 }, "pro": { "positive": -0.0397, "negative": 0.0276, "neutral": 0.0121 }, "pro israel": { "positive": -84e-4, "negative": 0.0841, "neutral": -0.0757 }, "probably": { "positive": -0.3258, "negative": 0.0302, "neutral": 0.2956 }, "probe": { "positive": -0.0752, "negative": 0.1382, "neutral": -0.063 }, "probes": { "positive": -0.064, "negative": 0.2296, "neutral": -0.1655 }, "problem": { "positive": -0.0974, "negative": 0.7212, "neutral": -0.6237 }, "processed": { "positive": -0.2007, "negative": -0.1088, "neutral": 0.3095 }, "processing": { "positive": -0.0952, "negative": 0.2322, "neutral": -0.1371 }, "product": { "positive": -0.089, "negative": -0.1772, "neutral": 0.2662 }, "production": { "positive": 0.4088, "negative": -0.1697, "neutral": -0.2392 }, "profit": { "positive": 1.6493, "negative": -0.554, "neutral": -1.0953 }, "profit taking": { "positive": 0.0413, "negative": -9e-3, "neutral": -0.0323 }, "profitable": { "positive": 1.4587, "negative": -0.3472, "neutral": -1.1115 }, "profits": { "positive": 1.8403, "negative": -0.5436, "neutral": -1.2968 }, "programming": { "positive": -0.0639, "negative": -0.1366, "neutral": 0.2005 }, "progress": { "positive": -0.1503, "negative": -0.0513, "neutral": 0.2016 }, "project": { "positive": 0.3045, "negative": -0.6353, "neutral": 0.3308 }, "project real": { "positive": 0.4251, "negative": -0.3165, "neutral": -0.1086 }, "projects": { "positive": -0.2292, "negative": -0.1729, "neutral": 0.4021 }, "prompt": { "positive": -0.0504, "negative": -0.098, "neutral": 0.1485 }, "proof": { "positive": -0.3618, "negative": 0.0271, "neutral": 0.3347 }, "proof stake": { "positive": -0.0559, "negative": -0.062, "neutral": 0.1179 }, "proof work": { "positive": -0.1051, "negative": 0.1802, "neutral": -0.0751 }, "proofs": { "positive": 33e-4, "negative": -0.0444, "neutral": 0.0412 }, "proposal": { "positive": -0.1105, "negative": -0.1708, "neutral": 0.2813 }, "propose": { "positive": -0.0794, "negative": -0.0197, "neutral": 0.0991 }, "propose cryptocurrency": { "positive": -0.0106, "negative": 0.0641, "neutral": -0.0535 }, "proposes": { "positive": -0.0793, "negative": 0.3997, "neutral": -0.3204 }, "protect": { "positive": 0.3315, "negative": -0.19, "neutral": -0.1415 }, "protected": { "positive": -0.019, "negative": 0.0863, "neutral": -0.0673 }, "protests": { "positive": -0.0316, "negative": 8e-4, "neutral": 0.0308 }, "protocol": { "positive": -0.1313, "negative": 0.0106, "neutral": 0.1207 }, "protocol drained": { "positive": -0.0797, "negative": 0.1512, "neutral": -0.0715 }, "protocols": { "positive": -0.1131, "negative": 0.0152, "neutral": 0.098 }, "prove": { "positive": -0.0539, "negative": -0.2561, "neutral": 0.3099 }, "provides": { "positive": -0.0191, "negative": 0.1662, "neutral": -0.1471 }, "pt": { "positive": -0.0991, "negative": -0.2629, "neutral": 0.3619 }, "public": { "positive": -0.0728, "negative": -0.1962, "neutral": 0.2689 }, "published": { "positive": -0.1815, "negative": -0.0859, "neutral": 0.2674 }, "pull": { "positive": -0.4636, "negative": 0.5239, "neutral": -0.0602 }, "pump": { "positive": 1.7917, "negative": -0.5264, "neutral": -1.2653 }, "pump dump": { "positive": 0.0642, "negative": -0.0556, "neutral": -86e-4 }, "pumping": { "positive": 1.2768, "negative": -0.3597, "neutral": -0.9171 }, "pumping $nonja": { "positive": 0.0434, "negative": -52e-4, "neutral": -0.0382 }, "pumping soon": { "positive": 0.0931, "negative": -7e-3, "neutral": -0.0861 }, "purchased": { "positive": -0.2572, "negative": -0.1247, "neutral": 0.3818 }, "purchases": { "positive": -0.0841, "negative": 0.32, "neutral": -0.236 }, "pure": { "positive": -0.0779, "negative": 0.0104, "neutral": 0.0675 }, "purpose": { "positive": -0.1463, "negative": 0.0623, "neutral": 0.084 }, "push": { "positive": 0.0408, "negative": -0.36, "neutral": 0.3192 }, "pushing": { "positive": -0.1407, "negative": -0.0163, "neutral": 0.1571 }, "put": { "positive": -0.3776, "negative": 0.1708, "neutral": 0.2068 }, "putin": { "positive": -0.0558, "negative": -0.0549, "neutral": 0.1107 }, "puts": { "positive": -0.0675, "negative": -0.1208, "neutral": 0.1883 }, "putting": { "positive": -0.3347, "negative": 0.2247, "neutral": 0.11 }, "pxyakyuvwwzt": { "positive": 0.0951, "negative": -0.0725, "neutral": -0.0226 }, "pxyakyuvwwzt zerdofr": { "positive": 0.0951, "negative": -0.0725, "neutral": -0.0226 }, "python": { "positive": 0.0492, "negative": -0.2209, "neutral": 0.1718 }, "qr": { "positive": -0.1226, "negative": -0.1525, "neutral": 0.2752 }, "quadrigacx": { "positive": -0.0432, "negative": 0.0629, "neutral": -0.0197 }, "quantum": { "positive": 0.4065, "negative": -0.2078, "neutral": -0.1987 }, "quantum computing": { "positive": -0.1501, "negative": 0.0371, "neutral": 0.113 }, "quantum crypto": { "positive": -0.0401, "negative": 0.0845, "neutral": -0.0444 }, "quantum resistant": { "positive": -0.0386, "negative": -0.0377, "neutral": 0.0763 }, "quantum safe": { "positive": 0.303, "negative": -0.1194, "neutral": -0.1836 }, "quarter": { "positive": 95e-4, "negative": -0.0307, "neutral": 0.0212 }, "quarterly": { "positive": 0.186, "negative": 0.017, "neutral": -0.203 }, "question": { "positive": -0.1898, "negative": 0.1938, "neutral": -4e-3 }, "quick": { "positive": -0.235, "negative": 0.119, "neutral": 0.116 }, "quiet": { "positive": -0.0232, "negative": -0.2199, "neutral": 0.2431 }, "quietly": { "positive": 0.2031, "negative": -0.2077, "neutral": 46e-4 }, "quit": { "positive": 0.0648, "negative": 0.1004, "neutral": -0.1653 }, "quits": { "positive": -0.082, "negative": -0.0515, "neutral": 0.1336 }, "qzhyms": { "positive": -0.0801, "negative": -0.0587, "neutral": 0.1388 }, "qzhyms hgp": { "positive": -0.0801, "negative": -0.0587, "neutral": 0.1388 }, "race": { "positive": 0.1293, "negative": -0.1345, "neutral": 51e-4 }, "rag": { "positive": -0.0448, "negative": -0.1972, "neutral": 0.242 }, "raid": { "positive": -0.1449, "negative": 0.2997, "neutral": -0.1548 }, "raided": { "positive": -0.0924, "negative": 0.4922, "neutral": -0.3998 }, "raise": { "positive": -0.0905, "negative": -0.053, "neutral": 0.1435 }, "raised": { "positive": 0.4465, "negative": -0.1759, "neutral": -0.2707 }, "raises": { "positive": 0.6619, "negative": -0.2197, "neutral": -0.4422 }, "rallies": { "positive": 0.3812, "negative": -0.1814, "neutral": -0.1998 }, "rally": { "positive": 1.879, "negative": -0.5906, "neutral": -1.2885 }, "ran": { "positive": -0.0475, "negative": 0.2468, "neutral": -0.1993 }, "random": { "positive": -0.0374, "negative": -0.1021, "neutral": 0.1395 }, "range": { "positive": 0.1967, "negative": -0.204, "neutral": 74e-4 }, "ranks": { "positive": 0.03, "negative": 0.07, "neutral": -0.1 }, "ranks top": { "positive": 0.03, "negative": 0.07, "neutral": -0.1 }, "ransomware": { "positive": -0.1328, "negative": 0.7092, "neutral": -0.5764 }, "rapid": { "positive": -0.0465, "negative": -0.0856, "neutral": 0.1321 }, "rare": { "positive": 0.4784, "negative": -0.2024, "neutral": -0.2759 }, "rate": { "positive": 0.1142, "negative": -0.2408, "neutral": 0.1267 }, "ratio": { "positive": -0.1061, "negative": -0.0354, "neutral": 0.1415 }, "raw": { "positive": -0.0236, "negative": -0.1735, "neutral": 0.1971 }, "re": { "positive": 0.2332, "negative": -0.0974, "neutral": -0.1358 }, "re gonna": { "positive": 0.1362, "negative": -0.0534, "neutral": -0.0828 }, "re welcome": { "positive": 0.0231, "negative": -0.1434, "neutral": 0.1203 }, "reach": { "positive": 0.5326, "negative": -0.0613, "neutral": -0.4713 }, "reaches": { "positive": 0.2556, "negative": -0.0937, "neutral": -0.1619 }, "read": { "positive": -0.1421, "negative": 0.0717, "neutral": 0.0703 }, "readers": { "positive": -0.064, "negative": 0.0792, "neutral": -0.0152 }, "reading": { "positive": -0.1296, "negative": -0.0774, "neutral": 0.207 }, "ready": { "positive": 0.4593, "negative": -0.1827, "neutral": -0.2766 }, "ready send": { "positive": 0.1873, "negative": -0.0356, "neutral": -0.1517 }, "real": { "positive": -0.2073, "negative": 0.184, "neutral": 0.0234 }, "real action": { "positive": 0.1207, "negative": -0.2031, "neutral": 0.0824 }, "real adoption": { "positive": 0.4251, "negative": -0.3165, "neutral": -0.1086 }, "real infra": { "positive": 0.0753, "negative": -0.0429, "neutral": -0.0324 }, "real time": { "positive": -0.1282, "negative": -0.1596, "neutral": 0.2878 }, "real world": { "positive": -0.0722, "negative": 0.0981, "neutral": -0.026 }, "realize": { "positive": -0.2391, "negative": -0.1402, "neutral": 0.3793 }, "really": { "positive": -0.0185, "negative": 0.3477, "neutral": -0.3292 }, "really well": { "positive": 0.0676, "negative": -0.0554, "neutral": -0.0122 }, "reason": { "positive": 0.0412, "negative": 97e-4, "neutral": -0.0509 }, "rebound": { "positive": 0.5955, "negative": -0.182, "neutral": -0.4135 }, "recent": { "positive": -0.0741, "negative": -0.1373, "neutral": 0.2114 }, "recently": { "positive": 0.2576, "negative": 0.0506, "neutral": -0.3082 }, "reclaim": { "positive": 0.2288, "negative": -0.0279, "neutral": -0.201 }, "recommend": { "positive": 0.2164, "negative": -0.0249, "neutral": -0.1914 }, "recommendations": { "positive": -0.0621, "negative": -0.1056, "neutral": 0.1677 }, "record": { "positive": 0.9015, "negative": -0.1934, "neutral": -0.7081 }, "record high": { "positive": 0.06, "negative": -0.029, "neutral": -0.031 }, "records": { "positive": 0.2174, "negative": -0.0995, "neutral": -0.1179 }, "recover": { "positive": 0.5602, "negative": -0.0713, "neutral": -0.4889 }, "recovery": { "positive": -0.0742, "negative": 0.2597, "neutral": -0.1856 }, "red": { "positive": -0.4412, "negative": 0.9808, "neutral": -0.5396 }, "red candles": { "positive": -0.1803, "negative": 0.2624, "neutral": -0.0821 }, "red flat": { "positive": -79e-4, "negative": 0.0306, "neutral": -0.0227 }, "reddit": { "positive": -0.1113, "negative": 0.2738, "neutral": -0.1624 }, "refuse": { "positive": -0.0295, "negative": -0.1011, "neutral": 0.1306 }, "regime": { "positive": -0.0613, "negative": -0.033, "neutral": 0.0943 }, "regret": { "positive": 0.0365, "negative": 0.2411, "neutral": -0.2776 }, "regulate": { "positive": -0.1244, "negative": -0.1208, "neutral": 0.2451 }, "regulation": { "positive": -0.1627, "negative": 0.0693, "neutral": 0.0934 }, "regulations": { "positive": -0.169, "negative": -0.3077, "neutral": 0.4767 }, "regulator": { "positive": 0.1804, "negative": 0.2444, "neutral": -0.4249 }, "regulators": { "positive": -0.2523, "negative": -0.33, "neutral": 0.5823 }, "regulators announced": { "positive": -0.0369, "negative": 0.2884, "neutral": -0.2515 }, "rekt": { "positive": -0.2715, "negative": 0.8284, "neutral": -0.5569 }, "rekt chart": { "positive": -0.0559, "negative": 0.1756, "neutral": -0.1197 }, "rekt fundamentals": { "positive": -0.0292, "negative": 0.0937, "neutral": -0.0645 }, "rekt looks": { "positive": -0.071, "negative": 0.0894, "neutral": -0.0184 }, "rekt support": { "positive": -0.0316, "negative": 0.0556, "neutral": -0.024 }, "rekt trend": { "positive": -0.0268, "negative": 0.1209, "neutral": -0.0941 }, "rekt volume": { "positive": -0.0148, "negative": 0.0406, "neutral": -0.0257 }, "related": { "positive": -0.1689, "negative": 0.446, "neutral": -0.2771 }, "release": { "positive": -0.2413, "negative": -0.3082, "neutral": 0.5495 }, "released": { "positive": -0.1715, "negative": -0.1553, "neutral": 0.3268 }, "releases": { "positive": 0.4218, "negative": -0.1823, "neutral": -0.2395 }, "remain": { "positive": 84e-4, "negative": -0.0636, "neutral": 0.0552 }, "remains": { "positive": -0.032, "negative": -0.0927, "neutral": 0.1247 }, "remember": { "positive": -0.2719, "negative": -0.108, "neutral": 0.3799 }, "remittance": { "positive": 0.4721, "negative": -0.1807, "neutral": -0.2913 }, "removal": { "positive": -0.0421, "negative": -0.067, "neutral": 0.1091 }, "render": { "positive": 0.1251, "negative": -0.0212, "neutral": -0.1039 }, "renewable": { "positive": -0.1513, "negative": 0.0104, "neutral": 0.1409 }, "renewable energy": { "positive": -0.1513, "negative": 0.0104, "neutral": 0.1409 }, "repeated": { "positive": -0.0547, "negative": -0.1161, "neutral": 0.1709 }, "replace": { "positive": -0.0925, "negative": -0.1614, "neutral": 0.2539 }, "replacing": { "positive": -0.1171, "negative": 0.0345, "neutral": 0.0827 }, "repo": { "positive": -0.0902, "negative": 0.0479, "neutral": 0.0423 }, "report": { "positive": -0.1802, "negative": 0.2864, "neutral": -0.1062 }, "reported": { "positive": -0.0834, "negative": 0.3387, "neutral": -0.2553 }, "reports": { "positive": 0.2923, "negative": 0.0193, "neutral": -0.3116 }, "reports record": { "positive": 0.3134, "negative": -0.1262, "neutral": -0.1872 }, "reputation": { "positive": -0.026, "negative": 0.0321, "neutral": -61e-4 }, "requests": { "positive": -0.0653, "negative": 0.0927, "neutral": -0.0274 }, "research": { "positive": 28e-4, "negative": -0.2178, "neutral": 0.2149 }, "researcher": { "positive": -0.0503, "negative": 0.3259, "neutral": -0.2756 }, "researchers": { "positive": -0.0787, "negative": 0.3559, "neutral": -0.2772 }, "reserve": { "positive": 0.0969, "negative": -0.0908, "neutral": -61e-4 }, "reserves": { "positive": -0.095, "negative": 0.4592, "neutral": -0.3642 }, "resigns": { "positive": -0.0223, "negative": 0.0443, "neutral": -0.022 }, "resist": { "positive": -0.2291, "negative": -0.2564, "neutral": 0.4856 }, "resist retire": { "positive": -0.1762, "negative": -0.1615, "neutral": 0.3377 }, "resistance": { "positive": -0.1413, "negative": 0.1465, "neutral": -53e-4 }, "resistant": { "positive": -0.1695, "negative": -0.2083, "neutral": 0.3778 }, "resists": { "positive": 0.1127, "negative": -0.0222, "neutral": -0.0906 }, "resolution": { "positive": 0.4953, "negative": -0.0413, "neutral": -0.4541 }, "response": { "positive": -0.1328, "negative": -0.3054, "neutral": 0.4382 }, "response apple": { "positive": -0.0295, "negative": -0.0819, "neutral": 0.1114 }, "rest": { "positive": -0.103, "negative": -0.1234, "neutral": 0.2264 }, "resting": { "positive": -0.0192, "negative": 0.1037, "neutral": -0.0844 }, "result": { "positive": -61e-4, "negative": 0.1286, "neutral": -0.1225 }, "resulting": { "positive": -0.011, "negative": 0.0467, "neutral": -0.0357 }, "retail": { "positive": 0.2299, "negative": -0.0312, "neutral": -0.1987 }, "retail investors": { "positive": 0.1834, "negative": -8e-4, "neutral": -0.1826 }, "retire": { "positive": -0.0617, "negative": -0.1818, "neutral": 0.2435 }, "retirement": { "positive": 0.3403, "negative": -0.1209, "neutral": -0.2194 }, "return": { "positive": 0.0583, "negative": 0.1307, "neutral": -0.189 }, "returns": { "positive": -0.1172, "negative": -0.158, "neutral": 0.2751 }, "reuters": { "positive": -0.0517, "negative": -0.2888, "neutral": 0.3405 }, "reveals": { "positive": -0.0753, "negative": 0.0363, "neutral": 0.039 }, "revenue": { "positive": 0.1689, "negative": -0.0276, "neutral": -0.1413 }, "revenue jumps": { "positive": 0.2264, "negative": -0.0912, "neutral": -0.1353 }, "reversal": { "positive": 0.4854, "negative": -0.2368, "neutral": -0.2486 }, "review": { "positive": -0.2057, "negative": 0.0966, "neutral": 0.1091 }, "revive": { "positive": -0.0648, "negative": 0.1078, "neutral": -0.0431 }, "revives": { "positive": -0.0363, "negative": 0.1236, "neutral": -0.0873 }, "revolt": { "positive": -0.198, "negative": 0.0822, "neutral": 0.1158 }, "reward": { "positive": 0.1266, "negative": -0.0706, "neutral": -0.056 }, "rewards": { "positive": -0.0497, "negative": -0.1221, "neutral": 0.1717 }, "rewrite": { "positive": 0.1277, "negative": 0.134, "neutral": -0.2617 }, "rggtracxfrge": { "positive": 0.2497, "negative": -0.0442, "neutral": -0.2055 }, "rh": { "positive": 0.3244, "negative": -0.1272, "neutral": -0.1973 }, "rich": { "positive": 0.0596, "negative": -0.1162, "neutral": 0.0566 }, "ride": { "positive": -0.0915, "negative": -0.0689, "neutral": 0.1604 }, "right": { "positive": 0.3029, "negative": -0.1549, "neutral": -0.148 }, "right here": { "positive": -0.0992, "negative": -0.0421, "neutral": 0.1412 }, "right now": { "positive": -0.0422, "negative": -0.1753, "neutral": 0.2176 }, "riot": { "positive": -0.034, "negative": -0.0911, "neutral": 0.1251 }, "riot blockchain": { "positive": -0.034, "negative": -0.0911, "neutral": 0.1251 }, "rip": { "positive": 0.0465, "negative": -0.1335, "neutral": 0.087 }, "ripple": { "positive": -0.1478, "negative": 0.0976, "neutral": 0.0502 }, "ripple all": { "positive": -0.0779, "negative": 0.096, "neutral": -0.0181 }, "ripple breaking": { "positive": 0.0843, "negative": -0.0308, "neutral": -0.0534 }, "ripple buy": { "positive": -0.0423, "negative": -38e-4, "neutral": 0.0461 }, "ripple chart": { "positive": 33e-4, "negative": 0.0177, "neutral": -0.021 }, "ripple crashes": { "positive": -0.0242, "negative": 0.1276, "neutral": -0.1034 }, "ripple getting": { "positive": -0.0178, "negative": 0.0458, "neutral": -0.0281 }, "ripple here": { "positive": 0.0234, "negative": -0.0453, "neutral": 0.0219 }, "ripple momentum": { "positive": 0.0386, "negative": -99e-4, "neutral": -0.0287 }, "ripple news": { "positive": -0.0207, "negative": -0.0175, "neutral": 0.0382 }, "ripple surges": { "positive": 0.0294, "negative": -99e-4, "neutral": -0.0194 }, "ripple trading": { "positive": -0.0217, "negative": -0.0194, "neutral": 0.0411 }, "rise": { "positive": 0.4512, "negative": -0.3087, "neutral": -0.1426 }, "rising": { "positive": 0.6747, "negative": -0.2007, "neutral": -0.474 }, "risk": { "positive": 0.1453, "negative": -0.0682, "neutral": -0.0771 }, "rival": { "positive": -0.016, "negative": -0.215, "neutral": 0.231 }, "rival ftx": { "positive": -65e-4, "negative": -0.1467, "neutral": 0.1532 }, "road": { "positive": 0.0589, "negative": 0.0971, "neutral": -0.1559 }, "roadmap": { "positive": -0.2217, "negative": -0.4364, "neutral": 0.6581 }, "roads": { "positive": -0.0891, "negative": -0.011, "neutral": 0.1002 }, "roads lead": { "positive": -0.0891, "negative": -0.011, "neutral": 0.1002 }, "robinhood": { "positive": -0.1902, "negative": 0.0292, "neutral": 0.161 }, "rock": { "positive": 0.5592, "negative": -0.3189, "neutral": -0.2403 }, "rocket": { "positive": 0.8266, "negative": -0.2214, "neutral": -0.6051 }, "role": { "positive": -0.1326, "negative": -0.0901, "neutral": 0.2226 }, "round": { "positive": 0.1321, "negative": -0.0564, "neutral": -0.0757 }, "rpc": { "positive": -0.0627, "negative": -0.0682, "neutral": 0.1309 }, "rsi": { "positive": -19e-4, "negative": 0.2388, "neutral": -0.2369 }, "rug": { "positive": -0.1737, "negative": 0.7004, "neutral": -0.5267 }, "rug pull": { "positive": -0.1659, "negative": 0.6548, "neutral": -0.4889 }, "rugpull": { "positive": -0.1066, "negative": 0.4368, "neutral": -0.3301 }, "rule": { "positive": -0.0342, "negative": 0.1841, "neutral": -0.15 }, "rules": { "positive": -0.0229, "negative": -0.0546, "neutral": 0.0775 }, "run": { "positive": 0.2123, "negative": -0.3644, "neutral": 0.1521 }, "run $updog": { "positive": 0.2795, "negative": -0.0563, "neutral": -0.2232 }, "run also": { "positive": 0.0469, "negative": -0.0144, "neutral": -0.0324 }, "run now": { "positive": 0.0481, "negative": -79e-4, "neutral": -0.0402 }, "run started": { "positive": 0.1284, "negative": -0.0356, "neutral": -0.0928 }, "run up": { "positive": -0.144, "negative": 0.3096, "neutral": -0.1656 }, "runner": { "positive": 0.0108, "negative": -0.0878, "neutral": 0.077 }, "running": { "positive": 0.114, "negative": -0.1954, "neutral": 0.0814 }, "runs": { "positive": -0.0713, "negative": -0.1691, "neutral": 0.2403 }, "runtime": { "positive": -0.0666, "negative": -0.0885, "neutral": 0.1551 }, "runway": { "positive": -0.0647, "negative": 0.1072, "neutral": -0.0425 }, "russia": { "positive": -0.2078, "negative": 0.1712, "neutral": 0.0365 }, "russian": { "positive": 0.1845, "negative": 0.2724, "neutral": -0.4569 }, "rust": { "positive": -0.2645, "negative": -0.0789, "neutral": 0.3434 }, "sad": { "positive": 0.0343, "negative": -0.0158, "neutral": -0.0186 }, "safe": { "positive": -0.1644, "negative": 0.4585, "neutral": -0.2941 }, "safe crypto": { "positive": 0.303, "negative": -0.1194, "neutral": -0.1836 }, "safedollar": { "positive": -0.0352, "negative": 0.0936, "neutral": -0.0583 }, "safedollar stablecoin": { "positive": -0.0352, "negative": 0.0936, "neutral": -0.0583 }, "safety": { "positive": -0.1697, "negative": 0.2446, "neutral": -0.0749 }, "said": { "positive": 0.3907, "negative": 0.0934, "neutral": -0.4841 }, "said buy": { "positive": 0.1171, "negative": -0.0383, "neutral": -0.0788 }, "sale": { "positive": -0.0836, "negative": 0.3017, "neutral": -0.2181 }, "sales": { "positive": 0.0229, "negative": 0.2925, "neutral": -0.3154 }, "salvador": { "positive": -0.1386, "negative": 0.2071, "neutral": -0.0685 }, "sam": { "positive": -0.2103, "negative": 0.0939, "neutral": 0.1164 }, "sam bankman": { "positive": -0.1416, "negative": 7e-4, "neutral": 0.1409 }, "same": { "positive": -0.1196, "negative": -89e-4, "neutral": 0.1285 }, "sanctions": { "positive": 0.1574, "negative": -0.0704, "neutral": -0.087 }, "satoshi's": { "positive": -0.0638, "negative": 0.2986, "neutral": -0.2348 }, "save": { "positive": 0.0789, "negative": 0.1743, "neutral": -0.2532 }, "saves": { "positive": 0.2538, "negative": -0.2012, "neutral": -0.0526 }, "savings": { "positive": -0.0212, "negative": 0.0451, "neutral": -0.0239 }, "saw": { "positive": -0.2084, "negative": 0.2407, "neutral": -0.0323 }, "say": { "positive": -0.3147, "negative": 0.5297, "neutral": -0.215 }, "saying": { "positive": -0.1591, "negative": 0.3053, "neutral": -0.1463 }, "saylor": { "positive": 0.1359, "negative": -0.0328, "neutral": -0.103 }, "says": { "positive": -0.1298, "negative": 0.0371, "neutral": 0.0926 }, "says ceo": { "positive": -0.041, "negative": -0.0233, "neutral": 0.0643 }, "says ftx": { "positive": -0.0417, "negative": 0.132, "neutral": -0.0903 }, "says sec": { "positive": -0.0112, "negative": 0.0319, "neutral": -0.0207 }, "says stolen": { "positive": -0.0238, "negative": 0.1034, "neutral": -0.0797 }, "scale": { "positive": -0.1241, "negative": -0.0551, "neutral": 0.1793 }, "scaling": { "positive": -0.0867, "negative": 0.0792, "neutral": 75e-4 }, "scam": { "positive": -0.5025, "negative": 2.1884, "neutral": -1.6859 }, "scam chain": { "positive": -0.0685, "negative": 0.1035, "neutral": -0.035 }, "scam coin": { "positive": -0.0578, "negative": 0.0932, "neutral": -0.0354 }, "scam crypto": { "positive": 0.0249, "negative": -0.0191, "neutral": -58e-4 }, "scammed": { "positive": -0.2031, "negative": 0.7425, "neutral": -0.5394 }, "scammers": { "positive": -0.131, "negative": 0.5979, "neutral": -0.4668 }, "scams": { "positive": -0.4463, "negative": 1.4488, "neutral": -1.0026 }, "scandal": { "positive": -0.0649, "negative": -0.2397, "neutral": 0.3046 }, "schedule": { "positive": -0.3161, "negative": -0.1343, "neutral": 0.4504 }, "scheduled": { "positive": -0.1199, "negative": -0.0911, "neutral": 0.2109 }, "scheme": { "positive": -0.1617, "negative": 0.4564, "neutral": -0.2947 }, "schemes": { "positive": -0.1419, "negative": 0.3824, "neutral": -0.2405 }, "schwab": { "positive": 0.0676, "negative": -0.0835, "neutral": 0.0159 }, "scooped": { "positive": -0.2383, "negative": 0.2569, "neutral": -0.0186 }, "scooped up": { "positive": -0.2383, "negative": 0.2569, "neutral": -0.0186 }, "scratch": { "positive": -0.2732, "negative": 0.3177, "neutral": -0.0445 }, "screener": { "positive": 0.0343, "negative": -0.0392, "neutral": 49e-4 }, "sdk": { "positive": 0.3061, "negative": -0.0194, "neutral": -0.2867 }, "search": { "positive": -0.2706, "negative": -0.1396, "neutral": 0.4101 }, "search engine": { "positive": -0.1697, "negative": -0.0953, "neutral": 0.265 }, "searching": { "positive": -0.1038, "negative": -0.0128, "neutral": 0.1167 }, "season": { "positive": -0.0656, "negative": 0.1356, "neutral": -0.0699 }, "sec": { "positive": -0.1445, "negative": 1.3247, "neutral": -1.1803 }, "sec charges": { "positive": -0.0581, "negative": 0.1533, "neutral": -0.0951 }, "sec filed": { "positive": -0.0202, "negative": 0.0375, "neutral": -0.0174 }, "sec files": { "positive": -92e-4, "negative": 0.0507, "neutral": -0.0415 }, "sec lawsuit": { "positive": -0.0491, "negative": 0.0771, "neutral": -0.028 }, "sec sues": { "positive": -0.0141, "negative": 0.0352, "neutral": -0.0212 }, "sec's": { "positive": -0.0411, "negative": 0.2787, "neutral": -0.2376 }, "second": { "positive": -0.2281, "negative": -0.0226, "neutral": 0.2507 }, "seconds": { "positive": -0.0852, "negative": -0.1856, "neutral": 0.2708 }, "secret": { "positive": -0.0964, "negative": 0.2993, "neutral": -0.2029 }, "secrets": { "positive": -0.1016, "negative": -0.0589, "neutral": 0.1605 }, "sector": { "positive": -0.0507, "negative": 0.149, "neutral": -0.0982 }, "secure": { "positive": -0.1022, "negative": -0.1685, "neutral": 0.2706 }, "secured": { "positive": -0.066, "negative": -0.26, "neutral": 0.326 }, "securities": { "positive": -0.0563, "negative": 0.1462, "neutral": -0.0899 }, "security": { "positive": 0.1364, "negative": 0.0559, "neutral": -0.1923 }, "see": { "positive": 0.2243, "negative": 0.3653, "neutral": -0.5897 }, "see again": { "positive": -0.14, "negative": -0.252, "neutral": 0.3919 }, "see cents": { "positive": -0.0458, "negative": -0.0721, "neutral": 0.1179 }, "see updog": { "positive": 0.0997, "negative": -0.0311, "neutral": -0.0686 }, "see ya": { "positive": 0.0861, "negative": 0.0206, "neutral": -0.1067 }, "seed": { "positive": -0.2576, "negative": -0.1106, "neutral": 0.3682 }, "seed phrase": { "positive": -0.0555, "negative": 0.2413, "neutral": -0.1858 }, "seeing": { "positive": -0.0547, "negative": -0.1721, "neutral": 0.2268 }, "seeking": { "positive": -0.049, "negative": -0.0516, "neutral": 0.1006 }, "seems": { "positive": -0.1256, "negative": -0.1112, "neutral": 0.2368 }, "seems like": { "positive": 0.0294, "negative": -0.0151, "neutral": -0.0143 }, "seen": { "positive": 0.0557, "negative": 0.1248, "neutral": -0.1805 }, "seen so": { "positive": 0.0377, "negative": 0.0183, "neutral": -0.056 }, "sees": { "positive": -0.0289, "negative": 0.05, "neutral": -0.021 }, "seized": { "positive": -0.3551, "negative": 1.3613, "neutral": -1.0062 }, "seized crypto": { "positive": -0.0174, "negative": 0.1056, "neutral": -0.0882 }, "seized iran's": { "positive": -0.0723, "negative": 0.1678, "neutral": -0.0955 }, "seized nearly": { "positive": -0.0859, "negative": 0.2067, "neutral": -0.1208 }, "seizes": { "positive": -0.036, "negative": 0.1561, "neutral": -0.1201 }, "self": { "positive": -0.0571, "negative": -0.1674, "neutral": 0.2244 }, "sell": { "positive": -0.808, "negative": 0.9859, "neutral": -0.1779 }, "sell here": { "positive": -0.6558, "negative": -0.4368, "neutral": 1.0926 }, "sell soon": { "positive": -0.0379, "negative": 0.0413, "neutral": -34e-4 }, "sellers": { "positive": 0.0286, "negative": 0.2043, "neutral": -0.2329 }, "selling": { "positive": -0.6194, "negative": 1.486, "neutral": -0.8665 }, "selling $btc": { "positive": -0.0864, "negative": 0.1547, "neutral": -0.0682 }, "selling $eth": { "positive": -0.0119, "negative": 0.0355, "neutral": -0.0236 }, "selling $sol": { "positive": -0.0203, "negative": 0.0388, "neutral": -0.0184 }, "selling ada": { "positive": -0.0171, "negative": 0.0562, "neutral": -0.039 }, "selling altcoins": { "positive": -0.0207, "negative": 0.0294, "neutral": -87e-4 }, "selling bnb": { "positive": -0.0266, "negative": 0.0457, "neutral": -0.019 }, "selling btc": { "positive": -0.042, "negative": 0.0748, "neutral": -0.0328 }, "selling crypto": { "positive": -0.0146, "negative": 0.0401, "neutral": -0.0255 }, "selling eth": { "positive": -0.0457, "negative": 0.0796, "neutral": -0.0338 }, "selling ethereum": { "positive": -0.0458, "negative": 0.1231, "neutral": -0.0773 }, "selling link": { "positive": -0.0169, "negative": 0.0476, "neutral": -0.0307 }, "selling market": { "positive": -0.0119, "negative": 0.0206, "neutral": -87e-4 }, "selling ripple": { "positive": -0.032, "negative": 0.0582, "neutral": -0.0262 }, "selling sol": { "positive": -0.0152, "negative": 0.0384, "neutral": -0.0232 }, "selling xrp": { "positive": -0.0203, "negative": 0.0479, "neutral": -0.0276 }, "selloff": { "positive": -0.0216, "negative": -0.1452, "neutral": 0.1667 }, "sells": { "positive": -0.0334, "negative": 0.2921, "neutral": -0.2587 }, "senate": { "positive": 0.4367, "negative": -0.1966, "neutral": -0.24 }, "senate bill": { "positive": 0.0299, "negative": -0.167, "neutral": 0.1372 }, "senate passes": { "positive": 0.3012, "negative": -0.1425, "neutral": -0.1587 }, "send": { "positive": 0.665, "negative": -0.4987, "neutral": -0.1663 }, "send $updog": { "positive": 0.0802, "negative": -0.0195, "neutral": -0.0606 }, "send higher": { "positive": 0.1484, "negative": -0.0213, "neutral": -0.1271 }, "sends": { "positive": 0.179, "negative": -0.1482, "neutral": -0.0308 }, "sense": { "positive": -0.0366, "negative": 0.0937, "neutral": -0.0571 }, "sent": { "positive": -0.0336, "negative": 0.1526, "neutral": -0.1191 }, "sentence": { "positive": -0.0683, "negative": -0.1156, "neutral": 0.1839 }, "sentenced": { "positive": -0.0582, "negative": 0.3068, "neutral": -0.2486 }, "sentenced four": { "positive": -0.012, "negative": 0.0753, "neutral": -0.0633 }, "sentencing": { "positive": -0.0629, "negative": -0.0565, "neutral": 0.1194 }, "sentiment": { "positive": 0.0444, "negative": 0.1003, "neutral": -0.1447 }, "sepa": { "positive": -94e-4, "negative": 0.1295, "neutral": -0.1202 }, "sepa network": { "positive": -94e-4, "negative": 0.1295, "neutral": -0.1202 }, "seriously": { "positive": -0.0927, "negative": -62e-4, "neutral": 0.0989 }, "server": { "positive": -0.0127, "negative": 0.2018, "neutral": -0.1891 }, "servers": { "positive": -0.1047, "negative": -25e-4, "neutral": 0.1072 }, "service": { "positive": -0.2282, "negative": 0.3286, "neutral": -0.1004 }, "services": { "positive": 0.1266, "negative": -0.2175, "neutral": 0.0909 }, "set": { "positive": 0.1921, "negative": -0.0527, "neutral": -0.1393 }, "setting": { "positive": -0.0299, "negative": -0.0903, "neutral": 0.1202 }, "settle": { "positive": 0.2052, "negative": -0.123, "neutral": -0.0822 }, "settlement": { "positive": 0.3188, "negative": -69e-4, "neutral": -0.3119 }, "setup": { "positive": 0.1945, "negative": 53e-4, "neutral": -0.1997 }, "seven": { "positive": -0.0421, "negative": 0.196, "neutral": -0.154 }, "several": { "positive": 96e-4, "negative": -0.1326, "neutral": 0.123 }, "sh": { "positive": -0.1501, "negative": 6e-4, "neutral": 0.1495 }, "shake": { "positive": -0.0286, "negative": 0.1822, "neutral": -0.1535 }, "shaken": { "positive": -0.1186, "negative": 0.1764, "neutral": -0.0577 }, "shaken out": { "positive": -0.1186, "negative": 0.1764, "neutral": -0.0577 }, "shame": { "positive": -0.0398, "negative": 0.1365, "neutral": -0.0967 }, "share": { "positive": 0.1676, "negative": -0.1473, "neutral": -0.0203 }, "shared": { "positive": -0.1758, "negative": -0.2138, "neutral": 0.3897 }, "shared roadmap": { "positive": -0.0717, "negative": -0.0608, "neutral": 0.1326 }, "shares": { "positive": 0.0198, "negative": 0.1192, "neutral": -0.1391 }, "sharing": { "positive": -0.049, "negative": -0.2126, "neutral": 0.2616 }, "sharply": { "positive": 0.2082, "negative": -0.063, "neutral": -0.1452 }, "sheds": { "positive": -0.0619, "negative": -0.034, "neutral": 0.0959 }, "shift": { "positive": 0.1079, "negative": -0.2264, "neutral": 0.1185 }, "ship": { "positive": 0.1344, "negative": 0.3026, "neutral": -0.437 }, "shit": { "positive": -0.8015, "negative": 2.3952, "neutral": -1.5937 }, "shit block": { "positive": -0.0235, "negative": 0.1241, "neutral": -0.1006 }, "shit coin": { "positive": 0.0466, "negative": 0.079, "neutral": -0.1256 }, "shit just": { "positive": -0.0439, "negative": 0.0854, "neutral": -0.0415 }, "shitcoin": { "positive": -0.4479, "negative": 1.4417, "neutral": -0.9938 }, "shittamoley": { "positive": -0.0221, "negative": 0.0502, "neutral": -0.0281 }, "shock": { "positive": 0.1835, "negative": -0.0456, "neutral": -0.1379 }, "short": { "positive": 0.1762, "negative": 0.5603, "neutral": -0.7365 }, "short term": { "positive": 0.0909, "negative": -0.0771, "neutral": -0.0138 }, "shorting": { "positive": -0.3998, "negative": 0.5535, "neutral": -0.1537 }, "shorts": { "positive": -0.2052, "negative": 0.8331, "neutral": -0.6279 }, "shorts start": { "positive": 0.032, "negative": 0.1762, "neutral": -0.2083 }, "shot": { "positive": 0.1746, "negative": -0.2073, "neutral": 0.0327 }, "shouldn't": { "positive": -0.0678, "negative": 41e-4, "neutral": 0.0638 }, "show hn": { "positive": 0.1, "negative": -0.3901, "neutral": 0.2902 }, "showing": { "positive": 0.0296, "negative": -0.1042, "neutral": 0.0745 }, "shows": { "positive": 0.0961, "negative": -0.1762, "neutral": 0.0801 }, "shows how": { "positive": -0.1725, "negative": 0.2628, "neutral": -0.0903 }, "shut": { "positive": -0.0498, "negative": 0.1215, "neutral": -0.0717 }, "shutdown": { "positive": -0.3303, "negative": 1.4217, "neutral": -1.0914 }, "shuts": { "positive": -0.0401, "negative": 0.1877, "neutral": -0.1476 }, "shuts down": { "positive": -0.0401, "negative": 0.1877, "neutral": -0.1476 }, "shutting": { "positive": -0.0956, "negative": 0.3946, "neutral": -0.299 }, "shutting down": { "positive": -0.0956, "negative": 0.3946, "neutral": -0.299 }, "sick": { "positive": -77e-4, "negative": 0.0243, "neutral": -0.0166 }, "side": { "positive": -0.0746, "negative": -0.083, "neutral": 0.1576 }, "sideways": { "positive": 0.0726, "negative": -0.134, "neutral": 0.0614 }, "sideways no": { "positive": -0.1312, "negative": -0.171, "neutral": 0.3022 }, "sign": { "positive": -0.0445, "negative": 0.1205, "neutral": -0.076 }, "signal": { "positive": -0.1235, "negative": 0.0417, "neutral": 0.0818 }, "signals": { "positive": -0.0564, "negative": -0.1021, "neutral": 0.1585 }, "signed": { "positive": 0.0125, "negative": -0.0334, "neutral": 0.021 }, "significantly": { "positive": 0.3169, "negative": 12e-4, "neutral": -0.318 }, "signs": { "positive": 0.2214, "negative": -0.0734, "neutral": -0.148 }, "silicon": { "positive": -0.0851, "negative": 0.2655, "neutral": -0.1804 }, "silk": { "positive": -0.0331, "negative": 0.1152, "neutral": -0.0821 }, "silk road": { "positive": -0.0331, "negative": 0.1152, "neutral": -0.0821 }, "silver": { "positive": -0.1658, "negative": -0.0309, "neutral": 0.1967 }, "simple": { "positive": -0.0523, "negative": -0.052, "neutral": 0.1043 }, "simplest": { "positive": -0.0595, "negative": -0.0977, "neutral": 0.1572 }, "since": { "positive": 0.4886, "negative": 0.2998, "neutral": -0.7884 }, "singapore": { "positive": -0.0949, "negative": 0.1152, "neutral": -0.0203 }, "single": { "positive": 0.0206, "negative": -8e-3, "neutral": -0.0126 }, "sinks": { "positive": -0.1532, "negative": 0.7223, "neutral": -0.569 }, "sister": { "positive": 0.06, "negative": -0.0147, "neutral": -0.0452 }, "sister crypto": { "positive": 0.0567, "negative": -0.0135, "neutral": -0.0432 }, "sites": { "positive": -0.0993, "negative": -0.1331, "neutral": 0.2324 }, "skpqpump": { "positive": 0.0951, "negative": -0.0725, "neutral": -0.0226 }, "sky": { "positive": 0.0876, "negative": 0.1815, "neutral": -0.2691 }, "skyrocket": { "positive": 0.942, "negative": -0.3217, "neutral": -0.6203 }, "slammed": { "positive": -81e-4, "negative": 0.0229, "neutral": -0.0148 }, "slams": { "positive": -0.049, "negative": 0.1942, "neutral": -0.1453 }, "sleep": { "positive": -0.1161, "negative": -0.0535, "neutral": 0.1696 }, "sleep one": { "positive": -0.1497, "negative": -0.0494, "neutral": 0.1991 }, "sleeping": { "positive": -0.2109, "negative": -0.1516, "neutral": 0.3624 }, "slide": { "positive": 0.0987, "negative": 0.0682, "neutral": -0.1669 }, "slides": { "positive": -0.2509, "negative": -0.0596, "neutral": 0.3105 }, "slowly": { "positive": 0.4785, "negative": -0.0664, "neutral": -0.4122 }, "slumps": { "positive": -0.1141, "negative": 0.5556, "neutral": -0.4415 }, "sma": { "positive": 0.0229, "negative": -0.0114, "neutral": -0.0114 }, "small": { "positive": -0.0323, "negative": -0.1351, "neutral": 0.1673 }, "small position": { "positive": -0.0397, "negative": -0.0945, "neutral": 0.1342 }, "smart": { "positive": 0.2942, "negative": 0.289, "neutral": -0.5833 }, "smart chain": { "positive": -0.0247, "negative": 0.0816, "neutral": -0.0569 }, "smart contract": { "positive": -0.112, "negative": 0.2327, "neutral": -0.1207 }, "smart contracts": { "positive": -0.1434, "negative": 0.2888, "neutral": -0.1454 }, "smart money": { "positive": 0.5678, "negative": -0.3983, "neutral": -0.1694 }, "smell": { "positive": 0.3001, "negative": -0.0599, "neutral": -0.2401 }, "smells": { "positive": 0.2129, "negative": -0.0579, "neutral": -0.155 }, "so": { "positive": -0.4504, "negative": 0.2668, "neutral": 0.1836 }, "so cheap": { "positive": 0.0761, "negative": -0.1348, "neutral": 0.0588 }, "so far": { "positive": -0.0763, "negative": -57e-4, "neutral": 0.0821 }, "so fucked": { "positive": -0.035, "negative": 0.4041, "neutral": -0.3691 }, "so hard": { "positive": 0.0941, "negative": -0.0391, "neutral": -0.055 }, "so many": { "positive": -0.2117, "negative": 0.158, "neutral": 0.0537 }, "so much": { "positive": -0.0792, "negative": -0.0946, "neutral": 0.1737 }, "so top": { "positive": 0.0537, "negative": -0.0413, "neutral": -0.0125 }, "soar": { "positive": 0.868, "negative": -0.2857, "neutral": -0.5822 }, "soar unaware": { "positive": 0.1355, "negative": -0.0867, "neutral": -0.0488 }, "soaring": { "positive": 0.6609, "negative": -0.1691, "neutral": -0.4918 }, "soars": { "positive": 1.0147, "negative": -0.3037, "neutral": -0.711 }, "social": { "positive": 0.0582, "negative": -0.0155, "neutral": -0.0427 }, "social media": { "positive": 0.2588, "negative": 72e-4, "neutral": -0.266 }, "software": { "positive": -0.1203, "negative": -0.2363, "neutral": 0.3566 }, "sol": { "positive": -0.0908, "negative": 0.1873, "neutral": -0.0966 }, "sol all": { "positive": -0.0377, "negative": 0.0481, "neutral": -0.0103 }, "sol breaking": { "positive": 0.0543, "negative": -0.0362, "neutral": -0.0181 }, "sol buy": { "positive": -0.0532, "negative": 0.0228, "neutral": 0.0304 }, "sol news": { "positive": -0.0314, "negative": -0.0272, "neutral": 0.0585 }, "sol support": { "positive": -0.015, "negative": 0.023, "neutral": -79e-4 }, "sol surges": { "positive": 0.026, "negative": -0.0107, "neutral": -0.0153 }, "sol trading": { "positive": -0.0207, "negative": -0.0198, "neutral": 0.0404 }, "sol volume": { "positive": 0.055, "negative": -0.0249, "neutral": -0.0301 }, "solana": { "positive": -0.1586, "negative": -0.0449, "neutral": 0.2035 }, "solana aih": { "positive": 0.2404, "negative": -0.129, "neutral": -0.1114 }, "solana all": { "positive": -0.0598, "negative": 0.0772, "neutral": -0.0174 }, "solana based": { "positive": -0.0308, "negative": 0.1975, "neutral": -0.1667 }, "solana breaking": { "positive": 0.0866, "negative": -0.0373, "neutral": -0.0493 }, "solana crashes": { "positive": -0.0312, "negative": 0.0893, "neutral": -0.0581 }, "solana here": { "positive": 0.0205, "negative": -0.0385, "neutral": 0.0181 }, "solana meme": { "positive": -0.09, "negative": 0.0844, "neutral": 56e-4 }, "solana news": { "positive": -0.0267, "negative": -0.0205, "neutral": 0.0472 }, "solana nft": { "positive": -0.0232, "negative": 6e-3, "neutral": 0.0172 }, "solana stablecoin": { "positive": -0.0547, "negative": -0.0133, "neutral": 0.068 }, "solana trading": { "positive": -0.0223, "negative": -0.0205, "neutral": 0.0428 }, "solana volume": { "positive": 0.0273, "negative": -0.0128, "neutral": -0.0145 }, "solana web": { "positive": -0.0769, "negative": 0.0907, "neutral": -0.0137 }, "solana's": { "positive": 0.0187, "negative": -0.1549, "neutral": 0.1362 }, "sold": { "positive": -0.0112, "negative": 0.3179, "neutral": -0.3066 }, "solid": { "positive": 0.8034, "negative": -0.4633, "neutral": -0.3401 }, "solid project": { "positive": 0.4251, "negative": -0.3165, "neutral": -0.1086 }, "solution": { "positive": 0.1078, "negative": 0.1325, "neutral": -0.2403 }, "some": { "positive": 0.2221, "negative": -0.2542, "neutral": 0.0321 }, "some coins": { "positive": 0.0454, "negative": -0.0287, "neutral": -0.0167 }, "some love": { "positive": 0.1111, "negative": -0.0167, "neutral": -0.0945 }, "some more": { "positive": -0.1629, "negative": 0.1837, "neutral": -0.0207 }, "some volume": { "positive": 0.0212, "negative": -42e-4, "neutral": -0.017 }, "someone": { "positive": -0.0555, "negative": 86e-4, "neutral": 0.0469 }, "something": { "positive": -0.3781, "negative": -0.1149, "neutral": 0.493 }, "something off": { "positive": -0.0565, "negative": -0.0775, "neutral": 0.134 }, "sometime": { "positive": -0.1018, "negative": 0.1906, "neutral": -0.0889 }, "son": { "positive": -0.108, "negative": 0.0705, "neutral": 0.0375 }, "sons": { "positive": -0.0221, "negative": -0.1224, "neutral": 0.1445 }, "soon": { "positive": -0.1729, "negative": -0.4362, "neutral": 0.6092 }, "soon buy": { "positive": -0.0351, "negative": 0.04, "neutral": -48e-4 }, "sophie": { "positive": 0.0239, "negative": -0.0459, "neutral": 0.022 }, "sophie how": { "positive": 0.0239, "negative": -0.0459, "neutral": 0.022 }, "source": { "positive": -0.1797, "negative": 0.0162, "neutral": 0.1634 }, "source code": { "positive": -0.0851, "negative": -0.1098, "neutral": 0.195 }, "south": { "positive": -0.0841, "negative": -0.0789, "neutral": 0.163 }, "south korea": { "positive": -0.0959, "negative": -0.1356, "neutral": 0.2315 }, "sovereignai": { "positive": 0.0412, "negative": -0.0214, "neutral": -0.0198 }, "sovereignai buildout": { "positive": 0.0412, "negative": -0.0214, "neutral": -0.0198 }, "space": { "positive": -0.0756, "negative": -0.045, "neutral": 0.1206 }, "spacex": { "positive": -0.0101, "negative": -0.2395, "neutral": 0.2495 }, "spacex ipo": { "positive": 0.0874, "negative": -0.0276, "neutral": -0.0598 }, "spam": { "positive": -0.128, "negative": -0.1791, "neutral": 0.3071 }, "speaks": { "positive": -0.0229, "negative": 0.0824, "neutral": -0.0595 }, "speed": { "positive": 0.1417, "negative": 39e-4, "neutral": -0.1456 }, "spend": { "positive": -0.0241, "negative": 0.0825, "neutral": -0.0584 }, "spending": { "positive": 0.0202, "negative": -0.1829, "neutral": 0.1627 }, "spent": { "positive": 0.2553, "negative": -0.0875, "neutral": -0.1678 }, "spiking": { "positive": -46e-4, "negative": -0.1219, "neutral": 0.1265 }, "spot": { "positive": 0.4118, "negative": -0.274, "neutral": -0.1378 }, "spot bitcoin": { "positive": 0.3158, "negative": -0.1675, "neutral": -0.1483 }, "spot etf": { "positive": 0.1033, "negative": -0.0321, "neutral": -0.0712 }, "spreading": { "positive": 0.164, "negative": 0.0878, "neutral": -0.2518 }, "spreading fud": { "positive": 0.1925, "negative": -0.0114, "neutral": -0.1811 }, "squeeze": { "positive": -0.2897, "negative": -0.0362, "neutral": 0.326 }, "st": { "positive": -0.0899, "negative": 0.1064, "neutral": -0.0164 }, "stable": { "positive": 0.914, "negative": -0.432, "neutral": -0.482 }, "stable coin": { "positive": 0.1634, "negative": 0.1074, "neutral": -0.2708 }, "stable coins": { "positive": 0.3614, "negative": -0.2606, "neutral": -0.1008 }, "stablecoin": { "positive": 0.2115, "negative": -0.158, "neutral": -0.0535 }, "stablecoin bill": { "positive": 0.2775, "negative": -0.1134, "neutral": -0.1641 }, "stablecoin collapsed": { "positive": -0.0841, "negative": 0.2083, "neutral": -0.1242 }, "stablecoin drops": { "positive": -0.0352, "negative": 0.0936, "neutral": -0.0583 }, "stablecoin ex": { "positive": -0.0126, "negative": 0.0426, "neutral": -0.03 }, "stablecoin issuer": { "positive": 0.177, "negative": 76e-4, "neutral": -0.1847 }, "stablecoin market": { "positive": -0.1613, "negative": -0.0503, "neutral": 0.2117 }, "stablecoin payments": { "positive": -0.0604, "negative": -0.0789, "neutral": 0.1392 }, "stablecoin project": { "positive": -0.0823, "negative": 0.2727, "neutral": -0.1904 }, "stablecoin reserve": { "positive": -0.1881, "negative": 55e-4, "neutral": 0.1826 }, "stablecoin startup": { "positive": 0.0711, "negative": -0.1443, "neutral": 0.0732 }, "stablecoin tether": { "positive": -0.0963, "negative": 0.3053, "neutral": -0.209 }, "stablecoin trading": { "positive": -0.0707, "negative": 0.2227, "neutral": -0.152 }, "stablecoins": { "positive": -0.1615, "negative": -0.1886, "neutral": 0.35 }, "stack": { "positive": 5e-4, "negative": 0.1029, "neutral": -0.1034 }, "stackshighsociety": { "positive": 0.1157, "negative": 0.1309, "neutral": -0.2465 }, "staff": { "positive": -0.1139, "negative": -0.3413, "neutral": 0.4552 }, "stake": { "positive": 0.1231, "negative": -0.3196, "neutral": 0.1966 }, "stake forbes": { "positive": -0.0362, "negative": -0.1769, "neutral": 0.2132 }, "staking": { "positive": 0.2877, "negative": -0.185, "neutral": -0.1027 }, "staking tokens": { "positive": 0.0847, "negative": -0.055, "neutral": -0.0297 }, "standard": { "positive": -0.0102, "negative": -0.0575, "neutral": 0.0676 }, "standard chartered": { "positive": 0.2304, "negative": -0.0779, "neutral": -0.1525 }, "stanley": { "positive": 0.1544, "negative": -0.1323, "neutral": -0.0221 }, "stark": { "positive": -0.211, "negative": -0.0856, "neutral": 0.2967 }, "starknet": { "positive": 0.1627, "negative": -9e-3, "neutral": -0.1537 }, "start": { "positive": 0.1386, "negative": 0.1312, "neutral": -0.2698 }, "start move": { "positive": -0.2864, "negative": 0.2817, "neutral": 47e-4 }, "start pump": { "positive": 0.0667, "negative": -0.0388, "neutral": -0.0279 }, "started": { "positive": -0.1827, "negative": 0.1315, "neutral": 0.0512 }, "starting": { "positive": 0.3524, "negative": 0.0608, "neutral": -0.4132 }, "starts": { "positive": -0.1559, "negative": -0.2659, "neutral": 0.4218 }, "startup": { "positive": -0.3302, "negative": 0.0642, "neutral": 0.266 }, "state": { "positive": -0.0174, "negative": -0.0165, "neutral": 0.0339 }, "stated": { "positive": 0.0537, "negative": -0.0413, "neutral": -0.0125 }, "stated previously": { "positive": 0.0537, "negative": -0.0413, "neutral": -0.0125 }, "statements": { "positive": -0.0522, "negative": 0.2646, "neutral": -0.2125 }, "stats": { "positive": -0.1796, "negative": -0.0545, "neutral": 0.2341 }, "stats published": { "positive": -0.1158, "negative": -0.0814, "neutral": 0.1972 }, "stay": { "positive": -0.1043, "negative": 0.3456, "neutral": -0.2413 }, "stay away": { "positive": -0.1704, "negative": 0.4918, "neutral": -0.3214 }, "stay strong": { "positive": 0.0277, "negative": -0.013, "neutral": -0.0147 }, "stayed": { "positive": -0.1097, "negative": 45e-4, "neutral": 0.1052 }, "stays": { "positive": 0.036, "negative": 0.033, "neutral": -0.069 }, "stays up": { "positive": 0.0698, "negative": -0.0207, "neutral": -0.0491 }, "steady": { "positive": 0.221, "negative": -0.2597, "neutral": 0.0387 }, "steal": { "positive": -0.2669, "negative": 1.1792, "neutral": -0.9122 }, "steal crypto": { "positive": -0.0251, "negative": 0.1016, "neutral": -0.0765 }, "steal cryptocurrency": { "positive": -0.0791, "negative": 0.3548, "neutral": -0.2758 }, "stealing": { "positive": -0.2729, "negative": 0.8967, "neutral": -0.6238 }, "stealing crypto": { "positive": -0.148, "negative": 0.2632, "neutral": -0.1152 }, "steam": { "positive": -0.1148, "negative": -62e-4, "neutral": 0.121 }, "stellar": { "positive": 0.0943, "negative": -0.0658, "neutral": -0.0285 }, "step": { "positive": 0.7432, "negative": -0.2795, "neutral": -0.4636 }, "step down": { "positive": -0.0382, "negative": 0.0694, "neutral": -0.0311 }, "steps": { "positive": 0.1018, "negative": -23e-4, "neutral": -0.0995 }, "steps up": { "positive": -0.078, "negative": 0.0968, "neutral": -0.0188 }, "still": { "positive": 0.1072, "negative": -0.0886, "neutral": -0.0186 }, "still coming": { "positive": 0.1904, "negative": -0.1804, "neutral": -0.01 }, "still early": { "positive": 0.4047, "negative": -0.1647, "neutral": -0.24 }, "still holding": { "positive": 0.1355, "negative": 0.1712, "neutral": -0.3067 }, "still think": { "positive": -0.0817, "negative": 0.1818, "neutral": -0.1001 }, "stock": { "positive": 0.3158, "negative": 0.4266, "neutral": -0.7424 }, "stock tumbles": { "positive": -0.0643, "negative": 0.134, "neutral": -0.0697 }, "stocks": { "positive": 0.0475, "negative": 0.1805, "neutral": -0.228 }, "stocks instead": { "positive": -0.1585, "negative": 0.28, "neutral": -0.1215 }, "stocktwits": { "positive": -0.0215, "negative": -0.0363, "neutral": 0.0578 }, "stole": { "positive": -0.0602, "negative": 0.2204, "neutral": -0.1602 }, "stolen": { "positive": -0.3327, "negative": 1.5561, "neutral": -1.2234 }, "stolen crypto": { "positive": -0.0537, "negative": 0.1557, "neutral": -0.102 }, "stolen cryptocurrency": { "positive": -0.0191, "negative": 0.0609, "neutral": -0.0418 }, "stolen data": { "positive": -0.0274, "negative": 0.1668, "neutral": -0.1394 }, "stop": { "positive": -0.1904, "negative": -0.0279, "neutral": 0.2183 }, "storage": { "positive": 0.0978, "negative": -0.0692, "neutral": -0.0286 }, "store": { "positive": -0.2083, "negative": -0.2186, "neutral": 0.4269 }, "store value": { "positive": -0.0731, "negative": 1e-4, "neutral": 0.073 }, "story": { "positive": -0.0399, "negative": 0.0542, "neutral": -0.0143 }, "straight": { "positive": -0.1147, "negative": 0.2742, "neutral": -0.1595 }, "strategies": { "positive": -0.0631, "negative": -0.026, "neutral": 0.0892 }, "stratosphere": { "positive": 0.0978, "negative": -9e-3, "neutral": -0.0887 }, "street": { "positive": -0.0255, "negative": 0.1814, "neutral": -0.1559 }, "street's": { "positive": 0.2355, "negative": -0.0102, "neutral": -0.2254 }, "strength": { "positive": 0.0718, "negative": -0.0741, "neutral": 23e-4 }, "stress": { "positive": -0.1002, "negative": -6e-3, "neutral": 0.1062 }, "stripe": { "positive": -0.1406, "negative": 0.0119, "neutral": 0.1287 }, "strong": { "positive": 1.6798, "negative": -0.8233, "neutral": -0.8565 }, "strong confident": { "positive": 0.09, "negative": -0.0356, "neutral": -0.0544 }, "strong support": { "positive": 0.0552, "negative": -0.0179, "neutral": -0.0374 }, "stronger": { "positive": -0.0929, "negative": -0.1947, "neutral": 0.2875 }, "structure": { "positive": 0.2525, "negative": -0.1058, "neutral": -0.1467 }, "study": { "positive": 0.2526, "negative": -0.1344, "neutral": -0.1182 }, "stupid": { "positive": -0.452, "negative": 1.1244, "neutral": -0.6724 }, "sub": { "positive": 0.1728, "negative": -0.1161, "neutral": -0.0567 }, "subpoena": { "positive": -0.0624, "negative": -0.2001, "neutral": 0.2625 }, "succeed": { "positive": -0.1201, "negative": 0.2374, "neutral": -0.1173 }, "such": { "positive": -0.0161, "negative": 0.0841, "neutral": -0.0681 }, "such life": { "positive": 0.0456, "negative": -0.0174, "neutral": -0.0282 }, "suck": { "positive": -0.2765, "negative": 1.0071, "neutral": -0.7306 }, "suckers": { "positive": -0.0898, "negative": -0.2075, "neutral": 0.2973 }, "sucks": { "positive": -0.1291, "negative": 0.6207, "neutral": -0.4917 }, "suddenly": { "positive": -0.0135, "negative": -0.085, "neutral": 0.0985 }, "sue": { "positive": -0.1575, "negative": 0.7344, "neutral": -0.5769 }, "sued": { "positive": -0.1518, "negative": 0.4596, "neutral": -0.3078 }, "sued sec": { "positive": -0.0729, "negative": 0.1814, "neutral": -0.1085 }, "sues": { "positive": -0.1432, "negative": 0.6371, "neutral": -0.4939 }, "sues crypto": { "positive": -0.0172, "negative": 0.1001, "neutral": -0.083 }, "sues perplexity": { "positive": -0.0707, "negative": 0.2527, "neutral": -0.182 }, "suffers": { "positive": -0.0632, "negative": 0.2859, "neutral": -0.2227 }, "suggest": { "positive": 0.224, "negative": -0.0429, "neutral": -0.1811 }, "suggests": { "positive": -0.2513, "negative": 0.3799, "neutral": -0.1285 }, "sui": { "positive": -0.2006, "negative": 0.3674, "neutral": -0.1668 }, "sui network": { "positive": -0.0428, "negative": 0.1688, "neutral": -0.1261 }, "summer": { "positive": 0.1958, "negative": -0.2547, "neutral": 0.0588 }, "super": { "positive": 0.1166, "negative": -0.0801, "neutral": -0.0365 }, "super bullish": { "positive": 0.0272, "negative": -0.0116, "neutral": -0.0156 }, "supply": { "positive": 0.6667, "negative": -0.322, "neutral": -0.3447 }, "supply chain": { "positive": -0.0624, "negative": -0.1116, "neutral": 0.174 }, "supply shock": { "positive": 0.2928, "negative": -0.0764, "neutral": -0.2164 }, "support": { "positive": 1.0688, "negative": -92e-4, "neutral": -1.0597 }, "support held": { "positive": 0.347, "negative": -0.2051, "neutral": -0.1419 }, "support just": { "positive": -0.259, "negative": 0.3572, "neutral": -0.0982 }, "support level": { "positive": 0.094, "negative": -0.0473, "neutral": -0.0468 }, "supports": { "positive": 0.3066, "negative": -0.0687, "neutral": -0.2379 }, "sure": { "positive": -0.0384, "negative": 0.0701, "neutral": -0.0317 }, "surge": { "positive": 0.7785, "negative": -0.2326, "neutral": -0.5459 }, "surges": { "positive": 0.6604, "negative": -0.3388, "neutral": -0.3216 }, "surges new": { "positive": 0.2937, "negative": -0.1092, "neutral": -0.1845 }, "surges past": { "positive": 0.0342, "negative": -0.0145, "neutral": -0.0197 }, "surpasses": { "positive": -0.179, "negative": -0.2071, "neutral": 0.3861 }, "surprise": { "positive": 0.1402, "negative": -0.2045, "neutral": 0.0643 }, "surveillance": { "positive": -0.0823, "negative": 91e-4, "neutral": 0.0732 }, "survive": { "positive": 0.1778, "negative": 0.0512, "neutral": -0.229 }, "suspected": { "positive": -0.0267, "negative": 0.1412, "neutral": -0.1146 }, "suspended": { "positive": -0.2071, "negative": 0.9547, "neutral": -0.7476 }, "suspends": { "positive": -0.1376, "negative": 0.9658, "neutral": -0.8282 }, "suspends payments": { "positive": -94e-4, "negative": 0.1295, "neutral": -0.1202 }, "suspends withdrawals": { "positive": -0.0366, "negative": 0.1718, "neutral": -0.1352 }, "sustainability": { "positive": 0.1817, "negative": -0.101, "neutral": -0.0807 }, "sustainable": { "positive": 0.2279, "negative": -0.0825, "neutral": -0.1454 }, "swap": { "positive": -0.0501, "negative": -0.0811, "neutral": 0.1311 }, "swap $sol": { "positive": -0.2215, "negative": -0.0391, "neutral": 0.2606 }, "swe": { "positive": 0.021, "negative": 0.2959, "neutral": -0.3169 }, "sweden": { "positive": -0.1684, "negative": 0.3401, "neutral": -0.1717 }, "swings": { "positive": 0.4501, "negative": -0.1156, "neutral": -0.3345 }, "switch": { "positive": -0.074, "negative": 0.3322, "neutral": -0.2582 }, "system": { "positive": -0.4893, "negative": -42e-4, "neutral": 0.4936 }, "system end": { "positive": -0.0116, "negative": 0.2541, "neutral": -0.2425 }, "systems": { "positive": -0.0377, "negative": -0.1426, "neutral": 0.1803 }, "taiwan": { "positive": -0.2495, "negative": -0.1163, "neutral": 0.3658 }, "take": { "positive": 0.5024, "negative": -0.1439, "neutral": -0.3585 }, "take off": { "positive": 0.3965, "negative": -0.0489, "neutral": -0.3477 }, "taken": { "positive": -0.0376, "negative": -0.1965, "neutral": 0.2341 }, "takeover": { "positive": 0.1247, "negative": -0.2927, "neutral": 0.1679 }, "takes": { "positive": 0.1076, "negative": 0.0149, "neutral": -0.1225 }, "takes aim": { "positive": 0.2222, "negative": -0.0597, "neutral": -0.1626 }, "takes bitcoin": { "positive": -0.0366, "negative": 0.086, "neutral": -0.0493 }, "takes place": { "positive": -0.0496, "negative": -0.13, "neutral": 0.1795 }, "taking": { "positive": -0.0641, "negative": -0.2104, "neutral": 0.2745 }, "taking sister": { "positive": 0.06, "negative": -0.0147, "neutral": -0.0452 }, "talk": { "positive": -0.1386, "negative": 0.2407, "neutral": -0.1021 }, "talk shit": { "positive": -0.0235, "negative": 0.1241, "neutral": -0.1006 }, "talking": { "positive": -0.1938, "negative": 0.125, "neutral": 0.0689 }, "talking negative": { "positive": -0.0814, "negative": -0.0456, "neutral": 0.1269 }, "talks": { "positive": -0.0722, "negative": 0.307, "neutral": -0.2348 }, "target": { "positive": -52e-4, "negative": -0.2024, "neutral": 0.2075 }, "target together": { "positive": 0.1264, "negative": -0.0351, "neutral": -0.0913 }, "targets": { "positive": -0.14, "negative": 0.1641, "neutral": -0.0241 }, "task": { "positive": -0.1066, "negative": -0.0855, "neutral": 0.1921 }, "tax": { "positive": -0.161, "negative": 0.4832, "neutral": -0.3222 }, "tbh": { "positive": 0.1545, "negative": -0.029, "neutral": -0.1255 }, "team": { "positive": -0.2242, "negative": 0.227, "neutral": -28e-4 }, "team shared": { "positive": -0.0717, "negative": -0.0608, "neutral": 0.1326 }, "teams": { "positive": -0.0745, "negative": -0.124, "neutral": 0.1985 }, "tech": { "positive": -0.2501, "negative": 0.0378, "neutral": 0.2123 }, "tech stocks": { "positive": -0.0655, "negative": 0.1178, "neutral": -0.0523 }, "technical": { "positive": 0.0246, "negative": 0.1087, "neutral": -0.1333 }, "technology": { "positive": 0.0446, "negative": 0.1026, "neutral": -0.1473 }, "telegram": { "positive": -0.2134, "negative": 0.0325, "neutral": 0.1809 }, "tell": { "positive": -0.1236, "negative": 0.3571, "neutral": -0.2335 }, "tell already": { "positive": -0.026, "negative": 0.0417, "neutral": -0.0157 }, "tell hn": { "positive": -0.1524, "negative": -0.027, "neutral": 0.1794 }, "tells": { "positive": 0.0719, "negative": 0.1127, "neutral": -0.1846 }, "temporarily": { "positive": -0.0968, "negative": 0.4736, "neutral": -0.3767 }, "temporarily suspends": { "positive": -0.0179, "negative": 0.1565, "neutral": -0.1386 }, "temporary": { "positive": -0.0785, "negative": 0.0401, "neutral": 0.0384 }, "term": { "positive": 0.0267, "negative": 0.1547, "neutral": -0.1814 }, "term holders": { "positive": 0.0134, "negative": 0.0783, "neutral": -0.0918 }, "terminal": { "positive": -0.1507, "negative": -0.2407, "neutral": 0.3914 }, "terms": { "positive": -0.0533, "negative": 0.0792, "neutral": -0.0259 }, "terms conditions": { "positive": -0.0533, "negative": 0.0792, "neutral": -0.0259 }, "terra": { "positive": -0.229, "negative": 0.5311, "neutral": -0.3022 }, "terra colleagues": { "positive": -0.0126, "negative": 0.0426, "neutral": -0.03 }, "terra stablecoin": { "positive": -0.0677, "negative": -0.0698, "neutral": 0.1375 }, "terrausd": { "positive": -0.0514, "negative": 0.1231, "neutral": -0.0718 }, "terrible": { "positive": -0.2755, "negative": 0.9156, "neutral": -0.6401 }, "tesla": { "positive": -0.0558, "negative": 0.3167, "neutral": -0.2608 }, "test": { "positive": 0.0611, "negative": -0.0559, "neutral": -52e-4 }, "tether": { "positive": 0.0864, "negative": 0.1019, "neutral": -0.1883 }, "tether breaks": { "positive": -0.0913, "negative": -0.0144, "neutral": 0.1057 }, "tether says": { "positive": 0.0809, "negative": 0.0623, "neutral": -0.1432 }, "texas": { "positive": 0.1095, "negative": 0.0171, "neutral": -0.1266 }, "textbook": { "positive": 0.0694, "negative": -0.169, "neutral": 0.0996 }, "tf": { "positive": -0.0743, "negative": -0.1291, "neutral": 0.2034 }, "tg": { "positive": 0.0239, "negative": -75e-4, "neutral": -0.0164 }, "th": { "positive": -0.2312, "negative": -0.0693, "neutral": 0.3005 }, "than": { "positive": -0.1833, "negative": -0.1613, "neutral": 0.3446 }, "than all": { "positive": -0.0143, "negative": -0.0289, "neutral": 0.0432 }, "than ever": { "positive": 0.134, "negative": -0.1066, "neutral": -0.0274 }, "than meme": { "positive": -0.0662, "negative": 0.1577, "neutral": -0.0915 }, "thank": { "positive": -0.0177, "negative": -0.0365, "neutral": 0.0541 }, "thank attention": { "positive": -0.0379, "negative": 0.0413, "neutral": -34e-4 }, "thank later": { "positive": -0.0516, "negative": -0.0557, "neutral": 0.1073 }, "thanks": { "positive": 0.0729, "negative": 0.1666, "neutral": -0.2395 }, "that's": { "positive": 0.0485, "negative": 0.2605, "neutral": -0.309 }, "thats": { "positive": 0.0437, "negative": -0.0161, "neutral": -0.0276 }, "theft": { "positive": -0.1962, "negative": 0.7005, "neutral": -0.5043 }, "theory": { "positive": -0.0762, "negative": -0.0702, "neutral": 0.1464 }, "there": { "positive": 0.0627, "negative": -0.0549, "neutral": -77e-4 }, "there better": { "positive": 0.1961, "negative": -0.0637, "neutral": -0.1324 }, "there no": { "positive": -0.1148, "negative": 0.1044, "neutral": 0.0104 }, "thief": { "positive": -0.0529, "negative": 0.2902, "neutral": -0.2373 }, "thiel": { "positive": 0.1208, "negative": -0.0566, "neutral": -0.0642 }, "thiel backed": { "positive": 0.1208, "negative": -0.0566, "neutral": -0.0642 }, "thiel's": { "positive": 0.0561, "negative": -0.1347, "neutral": 0.0785 }, "thin": { "positive": -0.081, "negative": 0.1774, "neutral": -0.0964 }, "thing": { "positive": -0.0417, "negative": 0.0902, "neutral": -0.0485 }, "things": { "positive": 0.0822, "negative": -0.2932, "neutral": 0.211 }, "think": { "positive": -0.1371, "negative": -0.2051, "neutral": 0.3422 }, "think bitcoin": { "positive": -0.0431, "negative": -55e-4, "neutral": 0.0486 }, "thinking": { "positive": -0.3464, "negative": 0.3096, "neutral": 0.0368 }, "thinks": { "positive": -0.2007, "negative": 0.2694, "neutral": -0.0687 }, "third": { "positive": -0.0746, "negative": -0.0965, "neutral": 0.1711 }, "though": { "positive": 0.1148, "negative": -0.0821, "neutral": -0.0327 }, "thought": { "positive": 0.5219, "negative": -0.0874, "neutral": -0.4345 }, "thoughts": { "positive": -0.2403, "negative": -0.0455, "neutral": 0.2858 }, "thousands": { "positive": 0.525, "negative": -0.1278, "neutral": -0.3972 }, "thread": { "positive": -0.1066, "negative": -0.1532, "neutral": 0.2598 }, "threat": { "positive": -0.4164, "negative": 1.7633, "neutral": -1.3469 }, "threat crypto": { "positive": -0.027, "negative": 0.0634, "neutral": -0.0364 }, "threatens": { "positive": -0.0331, "negative": 0.1614, "neutral": -0.1283 }, "threats": { "positive": -0.1845, "negative": 1.0496, "neutral": -0.8651 }, "three": { "positive": 0.3334, "negative": 0.0454, "neutral": -0.3788 }, "throwing": { "positive": -0.1678, "negative": 0.0956, "neutral": 0.0722 }, "tia": { "positive": -0.1214, "negative": 0.2691, "neutral": -0.1477 }, "tied": { "positive": -0.0482, "negative": -0.1319, "neutral": 0.1801 }, "tight": { "positive": -0.1171, "negative": -0.1861, "neutral": 0.3032 }, "till": { "positive": -0.1305, "negative": -0.249, "neutral": 0.3794 }, "time": { "positive": 0.4612, "negative": -0.2357, "neutral": -0.2255 }, "time buy": { "positive": 0.2271, "negative": -0.0877, "neutral": -0.1394 }, "time fly": { "positive": 0.2898, "negative": -0.0524, "neutral": -0.2374 }, "time get": { "positive": -0.4534, "negative": 0.2, "neutral": 0.2534 }, "time high": { "positive": 0.3813, "negative": -0.1694, "neutral": -0.2119 }, "time highs": { "positive": -0.3085, "negative": -0.0966, "neutral": 0.405 }, "time load": { "positive": -0.0482, "negative": -0.0515, "neutral": 0.0997 }, "times": { "positive": -0.3831, "negative": 0.3056, "neutral": 0.0776 }, "times pump": { "positive": -0.0379, "negative": 0.0413, "neutral": -34e-4 }, "tip": { "positive": 0.2074, "negative": -0.0721, "neutral": -0.1353 }, "today": { "positive": 0.1413, "negative": -0.434, "neutral": 0.2928 }, "today $btc": { "positive": 0.1941, "negative": -0.0386, "neutral": -0.1554 }, "today ama": { "positive": -0.1199, "negative": -0.0911, "neutral": 0.2109 }, "today conference": { "positive": -0.2127, "negative": -0.1289, "neutral": 0.3416 }, "today developer": { "positive": -0.0801, "negative": -0.0679, "neutral": 0.148 }, "today mainnet": { "positive": -0.1158, "negative": -0.0814, "neutral": 0.1972 }, "today team": { "positive": -0.0717, "negative": -0.0608, "neutral": 0.1326 }, "today's": { "positive": 0.0301, "negative": 0.0425, "neutral": -0.0726 }, "today's litepaper": { "positive": -0.1192, "negative": -0.0338, "neutral": 0.153 }, "together": { "positive": 0.1264, "negative": -0.0351, "neutral": -0.0913 }, "together get": { "positive": 0.1264, "negative": -0.0351, "neutral": -0.0913 }, "token": { "positive": -0.381, "negative": 0.2018, "neutral": 0.1792 }, "token launch": { "positive": 0.0499, "negative": -0.0149, "neutral": -0.035 }, "tokenization": { "positive": -0.0221, "negative": -0.1123, "neutral": 0.1344 }, "tokens": { "positive": 0.0868, "negative": 0.2759, "neutral": -0.3627 }, "tokens coins": { "positive": 0.1029, "negative": -0.0666, "neutral": -0.0362 }, "told": { "positive": -0.2784, "negative": -0.0171, "neutral": 0.2955 }, "told many": { "positive": -0.0379, "negative": 0.0413, "neutral": -34e-4 }, "tom": { "positive": -0.054, "negative": 0.1032, "neutral": -0.0493 }, "tom lee": { "positive": -0.054, "negative": 0.1032, "neutral": -0.0493 }, "tomorrow": { "positive": -0.3475, "negative": -0.1275, "neutral": 0.4751 }, "too": { "positive": -0.2897, "negative": -0.0839, "neutral": 0.3736 }, "too late": { "positive": -0.0108, "negative": 0.2221, "neutral": -0.2113 }, "took": { "positive": -0.0583, "negative": -0.1566, "neutral": 0.2149 }, "took profits": { "positive": 0.1662, "negative": -0.0386, "neutral": -0.1276 }, "tool": { "positive": 0.0303, "negative": -0.126, "neutral": 0.0956 }, "toolkit": { "positive": 0.3052, "negative": -0.1837, "neutral": -0.1215 }, "tools": { "positive": -0.0744, "negative": -0.0763, "neutral": 0.1508 }, "top": { "positive": 0.1386, "negative": -0.1806, "neutral": 0.042 }, "top crypto": { "positive": -0.1636, "negative": 0.2753, "neutral": -0.1116 }, "top favorite": { "positive": 0.0537, "negative": -0.0413, "neutral": -0.0125 }, "top staking": { "positive": 0.031, "negative": -0.0137, "neutral": -0.0173 }, "total": { "positive": -0.059, "negative": -0.0979, "neutral": 0.1568 }, "total loss": { "positive": -0.0242, "negative": 0.0468, "neutral": -0.0226 }, "touch": { "positive": -0.1682, "negative": -0.0986, "neutral": 0.2668 }, "touches": { "positive": -0.1285, "negative": 0.2354, "neutral": -0.1069 }, "tough": { "positive": 0.0962, "negative": 0.0622, "neutral": -0.1583 }, "toward": { "positive": -35e-4, "negative": -0.2366, "neutral": 0.2401 }, "town": { "positive": -0.2313, "negative": 0.2439, "neutral": -0.0127 }, "track": { "positive": 0.2689, "negative": -0.288, "neutral": 0.0191 }, "tracker": { "positive": -0.1599, "negative": 0.2627, "neutral": -0.1028 }, "tracking": { "positive": 0.0124, "negative": -0.027, "neutral": 0.0146 }, "trade": { "positive": 0.4028, "negative": -0.2651, "neutral": -0.1376 }, "traded": { "positive": -0.0511, "negative": -0.0168, "neutral": 0.0679 }, "trader": { "positive": -0.0856, "negative": 0.0339, "neutral": 0.0517 }, "traders": { "positive": 0.1605, "negative": -0.099, "neutral": -0.0615 }, "trading": { "positive": -0.0836, "negative": -0.2071, "neutral": 0.2907 }, "trading around": { "positive": -0.5092, "negative": -0.3931, "neutral": 0.9024 }, "trading bot": { "positive": 0.0393, "negative": -0.2176, "neutral": 0.1783 }, "trading platform": { "positive": 0.0417, "negative": -67e-4, "neutral": -0.035 }, "trading sideways": { "positive": 0.195, "negative": -0.1062, "neutral": -0.0888 }, "traditional": { "positive": -0.0461, "negative": -0.1088, "neutral": 0.1549 }, "traffic": { "positive": -0.0541, "negative": -0.0978, "neutral": 0.1518 }, "transaction": { "positive": 0.2639, "negative": -0.3056, "neutral": 0.0417 }, "transactions": { "positive": 0.2161, "negative": -0.3464, "neutral": 0.1303 }, "transfers": { "positive": -0.0733, "negative": 0.1602, "neutral": -0.0869 }, "transparent": { "positive": -0.1452, "negative": -0.1986, "neutral": 0.3438 }, "trap": { "positive": -0.4357, "negative": 0.6195, "neutral": -0.1837 }, "trash": { "positive": -0.7916, "negative": 1.5437, "neutral": -0.752 }, "treasuries": { "positive": -0.0451, "negative": 0.0554, "neutral": -0.0102 }, "treasury": { "positive": 0.5537, "negative": -0.3594, "neutral": -0.1943 }, "trend": { "positive": -0.2085, "negative": 0.5529, "neutral": -0.3445 }, "trend broken": { "positive": -0.1916, "negative": 0.5299, "neutral": -0.3383 }, "trending": { "positive": 0.451, "negative": -0.4433, "neutral": -77e-4 }, "trending $updog": { "positive": -0.1305, "negative": -0.1635, "neutral": 0.294 }, "trending updog": { "positive": -0.1185, "negative": -0.1601, "neutral": 0.2786 }, "tried": { "positive": 0.0258, "negative": 0.1315, "neutral": -0.1573 }, "tries": { "positive": 0.0443, "negative": -0.0935, "neutral": 0.0491 }, "trigger": { "positive": -0.3773, "negative": 0.2271, "neutral": 0.1502 }, "trigger next": { "positive": -0.3384, "negative": 0.1589, "neutral": 0.1795 }, "triggered": { "positive": -0.0125, "negative": 0.0792, "neutral": -0.0667 }, "trillion": { "positive": -0.0262, "negative": -0.1491, "neutral": 0.1753 }, "trip": { "positive": 0.2835, "negative": -0.0748, "neutral": -0.2087 }, "triple": { "positive": -0.1564, "negative": 0.0781, "neutral": 0.0783 }, "tron": { "positive": 0.2922, "negative": 0.1313, "neutral": -0.4234 }, "true": { "positive": -0.0935, "negative": 0.3302, "neutral": -0.2367 }, "true long": { "positive": 0.0358, "negative": -0.0162, "neutral": -0.0196 }, "trump": { "positive": 0.1556, "negative": -0.3165, "neutral": 0.1609 }, "trump family": { "positive": -0.0727, "negative": 0.0366, "neutral": 0.0361 }, "trump going": { "positive": 0.1958, "negative": -0.0366, "neutral": -0.1592 }, "trump got": { "positive": -0.088, "negative": 0.2087, "neutral": -0.1207 }, "trump media": { "positive": 0.1705, "negative": 0.0781, "neutral": -0.2486 }, "trump pardons": { "positive": -0.0434, "negative": -0.1443, "neutral": 0.1877 }, "trump sons": { "positive": -0.0221, "negative": -0.1224, "neutral": 0.1445 }, "trump's": { "positive": -0.2126, "negative": -0.1926, "neutral": 0.4052 }, "trust": { "positive": 0.1477, "negative": -0.0694, "neutral": -0.0783 }, "try": { "positive": -0.0793, "negative": 0.0403, "neutral": 0.039 }, "trying": { "positive": -0.3163, "negative": 0.2733, "neutral": 0.043 }, "tuesday": { "positive": -0.198, "negative": -0.0793, "neutral": 0.2773 }, "tumbles": { "positive": -0.1149, "negative": 0.4281, "neutral": -0.3132 }, "turkey": { "positive": -0.3037, "negative": -0.0497, "neutral": 0.3534 }, "turn": { "positive": 0.0369, "negative": 0.4698, "neutral": -0.5067 }, "turn any": { "positive": -0.0443, "negative": -0.0521, "neutral": 0.0964 }, "turned": { "positive": -0.0559, "negative": -0.0406, "neutral": 0.0965 }, "turning": { "positive": 0.5916, "negative": -0.1686, "neutral": -0.423 }, "turns": { "positive": 0.063, "negative": -71e-4, "neutral": -0.056 }, "tvl": { "positive": 0.5625, "negative": -0.085, "neutral": -0.4776 }, "twitter": { "positive": 0.3532, "negative": -0.2879, "neutral": -0.0653 }, "twitter accounts": { "positive": -0.0248, "negative": 0.1123, "neutral": -0.0875 }, "two": { "positive": -0.2356, "negative": 0.2394, "neutral": -38e-4 }, "two brothers": { "positive": -0.0198, "negative": 0.1199, "neutral": -0.1001 }, "txs": { "positive": -0.0265, "negative": -0.1012, "neutral": 0.1276 }, "type": { "positive": -0.2247, "negative": -0.0547, "neutral": 0.2795 }, "typical": { "positive": -0.0607, "negative": 0.1388, "neutral": -0.0781 }, "ugly": { "positive": -0.3766, "negative": 0.817, "neutral": -0.4405 }, "ui": { "positive": -0.1388, "negative": 0.2392, "neutral": -0.1004 }, "uk": { "positive": -0.2109, "negative": 0.3978, "neutral": -0.1869 }, "ukraine": { "positive": 0.2729, "negative": -0.0184, "neutral": -0.2545 }, "unable": { "positive": -0.09, "negative": 0.0708, "neutral": 0.0192 }, "unaware": { "positive": 0.1355, "negative": -0.0867, "neutral": -0.0488 }, "unaware infamous": { "positive": 0.1355, "negative": -0.0867, "neutral": -0.0488 }, "under": { "positive": -0.0926, "negative": -0.0596, "neutral": 0.1522 }, "undermine": { "positive": -0.0799, "negative": -0.0639, "neutral": 0.1439 }, "understanding": { "positive": -0.119, "negative": 0.0309, "neutral": 0.0881 }, "undervalued": { "positive": 0.3577, "negative": -0.1052, "neutral": -0.2526 }, "undervalued great": { "positive": 0.0667, "negative": -0.0322, "neutral": -0.0345 }, "uniswap": { "positive": -0.1429, "negative": -0.142, "neutral": 0.2849 }, "unit": { "positive": -0.0925, "negative": -0.0394, "neutral": 0.1319 }, "units": { "positive": 0.1252, "negative": -0.1021, "neutral": -0.0231 }, "universal": { "positive": -0.1401, "negative": -0.194, "neutral": 0.3341 }, "unlike": { "positive": 0.2307, "negative": -0.2091, "neutral": -0.0217 }, "unlimited": { "positive": 0.1167, "negative": -0.128, "neutral": 0.0113 }, "unregistered": { "positive": -0.0513, "negative": 0.2457, "neutral": -0.1944 }, "unregistered securities": { "positive": -0.0344, "negative": 0.2096, "neutral": -0.1751 }, "unstoppable": { "positive": -0.0701, "negative": -0.0919, "neutral": 0.162 }, "until": { "positive": 0.2423, "negative": 0.0281, "neutral": -0.2704 }, "up": { "positive": 0.1238, "negative": -0.0903, "neutral": -0.0335 }, "up $btc": { "positive": -0.1183, "negative": 0.2276, "neutral": -0.1092 }, "up $eth": { "positive": 0.0362, "negative": -0.0133, "neutral": -0.0229 }, "up ada": { "positive": -0.0244, "negative": -0.0649, "neutral": 0.0893 }, "up altcoins": { "positive": 0.0654, "negative": -0.0277, "neutral": -0.0378 }, "up atom": { "positive": -0.1342, "negative": -0.1097, "neutral": 0.2439 }, "up avax": { "positive": 0.0358, "negative": -0.0109, "neutral": -0.0249 }, "up bitcoin": { "positive": -0.0922, "negative": -0.0927, "neutral": 0.1849 }, "up bnb": { "positive": 0.0914, "negative": -0.0321, "neutral": -0.0592 }, "up call": { "positive": -0.1295, "negative": -0.1038, "neutral": 0.2333 }, "up cardano": { "positive": 0.0461, "negative": -0.0184, "neutral": -0.0276 }, "up crackdown": { "positive": -0.078, "negative": 0.0968, "neutral": -0.0188 }, "up crypto": { "positive": -0.01, "negative": 0.1763, "neutral": -0.1664 }, "up doge": { "positive": 0.0609, "negative": -0.0181, "neutral": -0.0428 }, "up end": { "positive": -0.1284, "negative": -0.163, "neutral": 0.2915 }, "up eth": { "positive": 0.2526, "negative": -0.0785, "neutral": -0.1742 }, "up ethereum": { "positive": 0.0714, "negative": -0.0179, "neutral": -0.0535 }, "up just": { "positive": -0.1485, "negative": 0.1777, "neutral": -0.0292 }, "up last": { "positive": 0.063, "negative": -0.0195, "neutral": -0.0435 }, "up link": { "positive": 0.0575, "negative": -0.0225, "neutral": -0.0351 }, "up market": { "positive": -0.0163, "negative": 0.0901, "neutral": -0.0738 }, "up once": { "positive": -0.0798, "negative": -0.2337, "neutral": 0.3135 }, "up only": { "positive": -0.2316, "negative": 0.3224, "neutral": -0.0907 }, "up ripple": { "positive": 0.0406, "negative": -0.0164, "neutral": -0.0242 }, "up so": { "positive": 0.3856, "negative": -0.1263, "neutral": -0.2593 }, "up sol": { "positive": 0.0416, "negative": -0.0148, "neutral": -0.0268 }, "up solana": { "positive": 0.0349, "negative": -0.0111, "neutral": -0.0238 }, "up some": { "positive": -0.164, "negative": -0.2889, "neutral": 0.4529 }, "up xrp": { "positive": 0.0453, "negative": -0.0175, "neutral": -0.0278 }, "upbit": { "positive": -0.0287, "negative": 0.2169, "neutral": -0.1882 }, "upcoming": { "positive": -0.0692, "negative": -0.0689, "neutral": 0.1381 }, "update": { "positive": -0.189, "negative": -0.3401, "neutral": 0.5291 }, "update posted": { "positive": -0.0801, "negative": -0.0679, "neutral": 0.148 }, "updog": { "positive": -0.0612, "negative": -0.1652, "neutral": 0.2265 }, "updog let": { "positive": -0.2583, "negative": -0.0438, "neutral": 0.3022 }, "updog phantom": { "positive": -0.2258, "negative": -0.038, "neutral": 0.2638 }, "upgrade": { "positive": 0.8912, "negative": -0.2707, "neutral": -0.6205 }, "upgrade went": { "positive": 0.2446, "negative": -0.0819, "neutral": -0.1626 }, "upside": { "positive": 0.9513, "negative": -0.3065, "neutral": -0.6448 }, "upside potential": { "positive": 0.2821, "negative": -0.0886, "neutral": -0.1935 }, "upward": { "positive": -0.0806, "negative": 0.269, "neutral": -0.1884 }, "ur": { "positive": -0.1706, "negative": 0.1005, "neutral": 0.0701 }, "usa": { "positive": 0.227, "negative": -0.0797, "neutral": -0.1473 }, "usage": { "positive": -0.1936, "negative": -0.0837, "neutral": 0.2773 }, "usd": { "positive": -0.0686, "negative": 0.1054, "neutral": -0.0368 }, "usdc": { "positive": 0.254, "negative": 0.0259, "neutral": -0.2799 }, "usdc stablecoin": { "positive": 0.2017, "negative": -0.0358, "neutral": -0.1659 }, "usdd": { "positive": 57e-4, "negative": 0.0646, "neutral": -0.0703 }, "usdt": { "positive": -0.1157, "negative": 0.1485, "neutral": -0.0328 }, "use": { "positive": -0.2899, "negative": 0.1601, "neutral": 0.1298 }, "use case": { "positive": -0.1404, "negative": 0.2362, "neutral": -0.0959 }, "used": { "positive": -0.2275, "negative": -0.1982, "neutral": 0.4257 }, "useless": { "positive": -0.4136, "negative": 1.464, "neutral": -1.0504 }, "user": { "positive": 0.2394, "negative": -0.2906, "neutral": 0.0512 }, "users": { "positive": -0.1153, "negative": 0.1976, "neutral": -0.0823 }, "uses": { "positive": 0.1979, "negative": -0.1017, "neutral": -0.0962 }, "using": { "positive": -0.2334, "negative": 0.1798, "neutral": 0.0536 }, "using cryptocurrencies": { "positive": -0.1334, "negative": 0.3876, "neutral": -0.2542 }, "using llms": { "positive": -0.0264, "negative": -0.0385, "neutral": 0.0649 }, "ust": { "positive": -0.1551, "negative": 0.5216, "neutral": -0.3665 }, "ust stablecoin": { "positive": -0.1222, "negative": 0.0924, "neutral": 0.0298 }, "ust ustc": { "positive": 0.1011, "negative": -0.0689, "neutral": -0.0321 }, "ustc": { "positive": 0.1011, "negative": -0.0689, "neutral": -0.0321 }, "ustc high": { "positive": 0.031, "negative": -0.0137, "neutral": -0.0173 }, "utility": { "positive": 0.1063, "negative": -0.2533, "neutral": 0.147 }, "ux": { "positive": -85e-4, "negative": -0.0246, "neutral": 0.0332 }, "validator": { "positive": 0.2576, "negative": -0.2768, "neutral": 0.0192 }, "validators": { "positive": 0.2356, "negative": -0.0889, "neutral": -0.1467 }, "value": { "positive": -0.1888, "negative": -0.0381, "neutral": 0.2268 }, "vanishes": { "positive": -0.0749, "negative": 0.0128, "neutral": 0.0621 }, "vault": { "positive": -0.1203, "negative": -0.0499, "neutral": 0.1702 }, "ve": { "positive": 0.0398, "negative": 0.1382, "neutral": -0.1781 }, "ve ever": { "positive": -0.0903, "negative": 0.1624, "neutral": -0.0721 }, "ve seen": { "positive": 0.0416, "negative": -0.0291, "neutral": -0.0126 }, "venture": { "positive": -0.0505, "negative": -0.208, "neutral": 0.2585 }, "verge": { "positive": -0.1463, "negative": -0.045, "neutral": 0.1912 }, "verifiable": { "positive": -0.0967, "negative": -0.0983, "neutral": 0.1949 }, "verification": { "positive": -0.051, "negative": -0.0472, "neutral": 0.0982 }, "verify": { "positive": -0.0636, "negative": -0.1527, "neutral": 0.2163 }, "version": { "positive": 0.2586, "negative": -0.191, "neutral": -0.0676 }, "versus": { "positive": -0.4234, "negative": -0.1229, "neutral": 0.5463 }, "very": { "positive": 0.2321, "negative": -0.0834, "neutral": -0.1487 }, "very nice": { "positive": 0.0625, "negative": -0.0413, "neutral": -0.0212 }, "very soon": { "positive": -0.0355, "negative": -0.0422, "neutral": 0.0777 }, "vets": { "positive": 0.1355, "negative": -0.0867, "neutral": -0.0488 }, "vets helped": { "positive": 0.1355, "negative": -0.0867, "neutral": -0.0488 }, "via": { "positive": -0.2262, "negative": -0.0542, "neutral": 0.2804 }, "victim": { "positive": -0.0112, "negative": 0.0232, "neutral": -0.012 }, "victims": { "positive": -0.0945, "negative": 0.2315, "neutral": -0.137 }, "video": { "positive": 0.258, "negative": -0.2054, "neutral": -0.0526 }, "vidz": { "positive": 0.0772, "negative": -0.0131, "neutral": -0.0641 }, "vietnam": { "positive": 0.6814, "negative": -0.1132, "neutral": -0.5682 }, "vietnamese": { "positive": -0.0146, "negative": 0.0618, "neutral": -0.0471 }, "view": { "positive": 87e-4, "negative": -0.0815, "neutral": 0.0728 }, "virginia": { "positive": -0.1066, "negative": 0.0107, "neutral": 0.0959 }, "virtual": { "positive": -0.0907, "negative": 0.1347, "neutral": -0.044 }, "virus": { "positive": -0.1488, "negative": -0.0217, "neutral": 0.1705 }, "visa": { "positive": 0.4398, "negative": -0.3209, "neutral": -0.1189 }, "vision": { "positive": 0.0752, "negative": -0.1299, "neutral": 0.0547 }, "vitalik": { "positive": -0.1791, "negative": 0.0773, "neutral": 0.1018 }, "volatility": { "positive": -92e-4, "negative": -0.0449, "neutral": 0.054 }, "volume": { "positive": -0.1212, "negative": 0.1578, "neutral": -0.0366 }, "volume dead": { "positive": -0.1534, "negative": 0.2831, "neutral": -0.1297 }, "volume exploding": { "positive": 0.8449, "negative": -0.3781, "neutral": -0.4668 }, "volume heating": { "positive": 0.2219, "negative": -0.0233, "neutral": -0.1986 }, "volume kicks": { "positive": 0.0208, "negative": -0.0148, "neutral": -6e-3 }, "voting": { "positive": -0.1932, "negative": 0.2476, "neutral": -0.0544 }, "vs": { "positive": -0.2315, "negative": 0.1154, "neutral": 0.1161 }, "vsfvprv": { "positive": -0.0801, "negative": -0.0587, "neutral": 0.1388 }, "vsfvprv qzhyms": { "positive": -0.0801, "negative": -0.0587, "neutral": 0.1388 }, "wait": { "positive": -0.2514, "negative": -0.6561, "neutral": 0.9075 }, "waiting": { "positive": -0.1521, "negative": 0.0458, "neutral": 0.1062 }, "waiting clear": { "positive": -0.2519, "negative": -0.2, "neutral": 0.452 }, "wake": { "positive": 0.0198, "negative": -0.131, "neutral": 0.1112 }, "wake up": { "positive": 0.0891, "negative": -0.3538, "neutral": 0.2647 }, "wall": { "positive": 0.132, "negative": 0.0254, "neutral": -0.1574 }, "wall street's": { "positive": 0.2355, "negative": -0.0102, "neutral": -0.2254 }, "wallet": { "positive": 0.136, "negative": -0.2556, "neutral": 0.1196 }, "wallets": { "positive": -0.1689, "negative": 0.2812, "neutral": -0.1123 }, "want": { "positive": 0.0272, "negative": -0.0371, "neutral": 0.01 }, "wanted": { "positive": -0.1542, "negative": 0.2571, "neutral": -0.1029 }, "wants": { "positive": -0.18, "negative": -0.3398, "neutral": 0.5198 }, "wants orderly": { "positive": -0.0367, "negative": 0.0436, "neutral": -69e-4 }, "warn": { "positive": -0.0546, "negative": 0.0211, "neutral": 0.0335 }, "warning": { "positive": -0.2827, "negative": 0.6795, "neutral": -0.3968 }, "warns": { "positive": -0.3069, "negative": 0.9912, "neutral": -0.6844 }, "warren": { "positive": -0.1295, "negative": -0.0821, "neutral": 0.2115 }, "washington": { "positive": 0.0235, "negative": -0.2154, "neutral": 0.1919 }, "wasn't": { "positive": 0.1089, "negative": 0.0419, "neutral": -0.1507 }, "waste": { "positive": -0.1645, "negative": 0.2063, "neutral": -0.0418 }, "waste money": { "positive": -0.1645, "negative": 0.2063, "neutral": -0.0418 }, "watch": { "positive": 0.109, "negative": -0.3402, "neutral": 0.2311 }, "watch alert": { "positive": 0.103, "negative": -0.0631, "neutral": -0.0399 }, "watchdog": { "positive": -0.0718, "negative": -0.0217, "neutral": 0.0935 }, "watched": { "positive": 0.0336, "negative": -0.026, "neutral": -75e-4 }, "watchers": { "positive": 99e-4, "negative": -0.0689, "neutral": 0.0591 }, "watching": { "positive": 0.0672, "negative": -0.3591, "neutral": 0.2919 }, "watching key": { "positive": -0.2967, "negative": -0.1911, "neutral": 0.4878 }, "watchlist": { "positive": -0.1879, "negative": -0.1492, "neutral": 0.3371 }, "wave": { "positive": 0.1018, "negative": -0.0459, "neutral": -0.0559 }, "way": { "positive": -0.4524, "negative": 0.1878, "neutral": 0.2646 }, "way back": { "positive": -0.0546, "negative": -0.0866, "neutral": 0.1413 }, "ways": { "positive": -0.2302, "negative": -0.0805, "neutral": 0.3106 }, "wayyy": { "positive": -0.0995, "negative": -0.0493, "neutral": 0.1487 }, "wazirx": { "positive": -0.031, "negative": 0.0768, "neutral": -0.0458 }, "we're": { "positive": -0.026, "negative": -0.0601, "neutral": 0.0861 }, "we're going": { "positive": 0.0847, "negative": -0.0882, "neutral": 36e-4 }, "weak": { "positive": -0.5906, "negative": 1.1919, "neutral": -0.6012 }, "weak hands": { "positive": -0.1478, "negative": 0.1972, "neutral": -0.0494 }, "wealth": { "positive": 0.3244, "negative": -0.0747, "neutral": -0.2496 }, "web": { "positive": -0.118, "negative": -0.2623, "neutral": 0.3802 }, "web apps": { "positive": -0.018, "negative": -0.039, "neutral": 0.057 }, "web js": { "positive": -0.0769, "negative": 0.0907, "neutral": -0.0137 }, "web security": { "positive": 94e-4, "negative": 0.0221, "neutral": -0.0315 }, "website": { "positive": -0.1152, "negative": 0.1497, "neutral": -0.0345 }, "websites": { "positive": -0.0535, "negative": -0.1314, "neutral": 0.1849 }, "wedge": { "positive": -0.1394, "negative": 0.254, "neutral": -0.1146 }, "week": { "positive": 0.0482, "negative": 0.0288, "neutral": -0.077 }, "weekend": { "positive": 0.176, "negative": 0.1424, "neutral": -0.3184 }, "weekly": { "positive": 0.0929, "negative": -0.0779, "neutral": -0.015 }, "weeks": { "positive": -0.3348, "negative": -0.151, "neutral": 0.4858 }, "weight": { "positive": -0.0552, "negative": 0.2576, "neutral": -0.2024 }, "weight loss": { "positive": -0.0552, "negative": 0.2576, "neutral": -0.2024 }, "weirdest": { "positive": 0.0736, "negative": -0.1523, "neutral": 0.0787 }, "welcome": { "positive": -2e-3, "negative": -0.0983, "neutral": 0.1003 }, "welcome getting": { "positive": -0.1981, "negative": -0.0309, "neutral": 0.2291 }, "well": { "positive": 0.294, "negative": -0.0411, "neutral": -0.2529 }, "went": { "positive": 0.25, "negative": -0.209, "neutral": -0.0411 }, "went live": { "positive": 0.0582, "negative": -0.1452, "neutral": 0.0871 }, "whale": { "positive": 0.3894, "negative": -0.1697, "neutral": -0.2197 }, "whale dumped": { "positive": -0.0882, "negative": 0.241, "neutral": -0.1528 }, "whales": { "positive": 0.2891, "negative": 0.0124, "neutral": -0.3015 }, "whales accumulating": { "positive": 0.0393, "negative": -76e-4, "neutral": -0.0317 }, "what's": { "positive": -0.3286, "negative": 0.3048, "neutral": 0.0238 }, "what's happening": { "positive": 0.0121, "negative": -0.0881, "neutral": 0.0759 }, "whatever": { "positive": 0.1032, "negative": -95e-4, "neutral": -0.0937 }, "where": { "positive": -0.4785, "negative": 0.1945, "neutral": 0.284 }, "white": { "positive": -0.0738, "negative": -0.0994, "neutral": 0.1732 }, "white paper": { "positive": -0.0191, "negative": -0.0734, "neutral": 0.0925 }, "whitepaper": { "positive": -0.159, "negative": 0.2057, "neutral": -0.0466 }, "why": { "positive": 0.173, "negative": 0.039, "neutral": -0.212 }, "why anyone": { "positive": -0.2149, "negative": 0.2764, "neutral": -0.0616 }, "why stablecoins": { "positive": -47e-4, "negative": -0.1864, "neutral": 0.1912 }, "wif": { "positive": -0.1993, "negative": -0.0757, "neutral": 0.275 }, "wild": { "positive": -0.1317, "negative": 0.2169, "neutral": -0.0851 }, "willing": { "positive": -0.0999, "negative": 0.0667, "neutral": 0.0331 }, "win": { "positive": 0.6507, "negative": -0.152, "neutral": -0.4987 }, "windows": { "positive": -0.0637, "negative": -0.0699, "neutral": 0.1336 }, "winklevoss": { "positive": -0.0425, "negative": 0.2967, "neutral": -0.2541 }, "winner": { "positive": 1.1876, "negative": -0.4104, "neutral": -0.7772 }, "wins": { "positive": 0.6775, "negative": -0.3025, "neutral": -0.3751 }, "wins sec": { "positive": 0.3203, "negative": -0.2224, "neutral": -0.0978 }, "winter": { "positive": 0.0367, "negative": 0.304, "neutral": -0.3407 }, "wiped": { "positive": -0.0148, "negative": 0.3453, "neutral": -0.3305 }, "wiped out": { "positive": -0.0148, "negative": 0.3453, "neutral": -0.3305 }, "withdraw": { "positive": -0.0738, "negative": -0.1905, "neutral": 0.2644 }, "withdrawal": { "positive": -0.1351, "negative": 0.1088, "neutral": 0.0263 }, "withdrawals": { "positive": -0.1805, "negative": 0.6736, "neutral": -0.4931 }, "withdrawals customers": { "positive": -0.0357, "negative": 0.1377, "neutral": -0.102 }, "within": { "positive": 29e-4, "negative": -0.0539, "neutral": 0.0509 }, "without": { "positive": 0.1801, "negative": -0.0157, "neutral": -0.1644 }, "witness": { "positive": 0.1993, "negative": -0.0695, "neutral": -0.1297 }, "wluna": { "positive": 0.1011, "negative": -0.0689, "neutral": -0.0321 }, "wluna luna": { "positive": 0.1011, "negative": -0.0689, "neutral": -0.0321 }, "woman": { "positive": -0.0151, "negative": 0.4575, "neutral": -0.4423 }, "won": { "positive": 0.3779, "negative": -0.0731, "neutral": -0.3049 }, "won't": { "positive": -0.1575, "negative": 0.2044, "neutral": -0.0469 }, "won't help": { "positive": -0.0674, "negative": 0.1772, "neutral": -0.1097 }, "wonder": { "positive": 0.1987, "negative": 5e-3, "neutral": -0.2037 }, "wont": { "positive": 0.0803, "negative": 0.0226, "neutral": -0.1029 }, "word": { "positive": -0.0319, "negative": 0.2448, "neutral": -0.2129 }, "work": { "positive": -0.0896, "negative": 0.0798, "neutral": 98e-4 }, "workflows": { "positive": -0.0991, "negative": 0.0908, "neutral": 83e-4 }, "workforce": { "positive": -0.2296, "negative": -0.1224, "neutral": 0.352 }, "working": { "positive": -0.2759, "negative": -0.1739, "neutral": 0.4497 }, "works": { "positive": -34e-4, "negative": -0.0436, "neutral": 0.047 }, "world": { "positive": -0.0953, "negative": 0.3548, "neutral": -0.2595 }, "worlds": { "positive": 0.4016, "negative": -0.0661, "neutral": -0.3355 }, "worry": { "positive": 55e-4, "negative": 0.2573, "neutral": -0.2628 }, "worse": { "positive": -0.1009, "negative": 0.2277, "neutral": -0.1268 }, "worse than": { "positive": -0.0662, "negative": 0.1577, "neutral": -0.0915 }, "worst": { "positive": -0.59, "negative": 1.4325, "neutral": -0.8425 }, "worth": { "positive": -0.0885, "negative": -0.0547, "neutral": 0.1432 }, "worth back": { "positive": -0.0149, "negative": 0.086, "neutral": -0.0711 }, "worth buy": { "positive": 0.1038, "negative": -0.0191, "neutral": -0.0847 }, "worth holding": { "positive": 0.1952, "negative": -0.1502, "neutral": -0.045 }, "worthless": { "positive": -0.1114, "negative": 0.2817, "neutral": -0.1703 }, "wow": { "positive": -0.0278, "negative": -0.0925, "neutral": 0.1202 }, "wow shit": { "positive": -0.0309, "negative": 0.0484, "neutral": -0.0175 }, "wrapped": { "positive": -0.1577, "negative": 0.6778, "neutral": -0.5202 }, "written": { "positive": 0.2099, "negative": -0.1345, "neutral": -0.0754 }, "wrong": { "positive": 0.0183, "negative": 0.2904, "neutral": -0.3087 }, "wsj": { "positive": -0.0236, "negative": -35e-4, "neutral": 0.0271 }, "wtf": { "positive": -0.1155, "negative": 0.3617, "neutral": -0.2463 }, "ww": { "positive": -0.0339, "negative": 0.0394, "neutral": -54e-4 }, "xc": { "positive": 0.0761, "negative": -0.0319, "neutral": -0.0442 }, "xc da": { "positive": 0.0761, "negative": -0.0319, "neutral": -0.0442 }, "xian": { "positive": -0.0304, "negative": -0.0601, "neutral": 0.0905 }, "xlm": { "positive": 0.0932, "negative": 0.1195, "neutral": -0.2127 }, "xrp": { "positive": -0.2538, "negative": 0.1415, "neutral": 0.1123 }, "xrp all": { "positive": -0.0477, "negative": 0.0617, "neutral": -0.014 }, "xrp breaking": { "positive": 0.0883, "negative": -0.0375, "neutral": -0.0508 }, "xrp buy": { "positive": -0.0472, "negative": 0.0179, "neutral": 0.0293 }, "xrp crashes": { "positive": -0.0127, "negative": 0.1033, "neutral": -0.0906 }, "xrp fundamentals": { "positive": 0.0224, "negative": -0.011, "neutral": -0.0114 }, "xrp getting": { "positive": -0.015, "negative": 0.0344, "neutral": -0.0194 }, "xrp here": { "positive": 0.042, "negative": -92e-4, "neutral": -0.0329 }, "xrp looks": { "positive": -0.0274, "negative": 0.0338, "neutral": -64e-4 }, "xrp momentum": { "positive": 0.0571, "negative": -0.0161, "neutral": -0.0409 }, "xrp news": { "positive": -0.0262, "negative": -0.0258, "neutral": 0.052 }, "xrp smart": { "positive": 0.0242, "negative": -0.0185, "neutral": -57e-4 }, "xrp volume": { "positive": 0.0625, "negative": -0.017, "neutral": -0.0455 }, "ya": { "positive": 0.0912, "negative": 0.1677, "neutral": -0.2589 }, "ya ll": { "positive": -0.1243, "negative": 0.0443, "neutral": 0.08 }, "ya trending": { "positive": 0.0806, "negative": -0.0209, "neutral": -0.0597 }, "ya updog": { "positive": 0.057, "negative": -0.0276, "neutral": -0.0294 }, "yall": { "positive": -0.0563, "negative": 0.1321, "neutral": -0.0758 }, "yc": { "positive": 0.2172, "negative": -0.0167, "neutral": -0.2005 }, "year": { "positive": -0.0832, "negative": 0.238, "neutral": -0.1548 }, "year crypto": { "positive": -83e-4, "negative": 0.0531, "neutral": -0.0448 }, "year old": { "positive": -0.1465, "negative": 0.1955, "neutral": -0.049 }, "years": { "positive": 0.2759, "negative": -0.4357, "neutral": 0.1598 }, "years ago": { "positive": 0.027, "negative": 38e-4, "neutral": -0.0308 }, "yep": { "positive": -0.0544, "negative": 0.1711, "neutral": -0.1167 }, "yes": { "positive": 0.2759, "negative": -0.271, "neutral": -49e-4 }, "yet": { "positive": 0.1646, "negative": -0.4146, "neutral": 0.2499 }, "yield": { "positive": 0.4846, "negative": 0.0649, "neutral": -0.5495 }, "york": { "positive": -0.1256, "negative": -0.1199, "neutral": 0.2455 }, "you'll": { "positive": -0.071, "negative": -0.0979, "neutral": 0.1689 }, "you're": { "positive": -0.5177, "negative": 0.3838, "neutral": 0.1339 }, "youtube": { "positive": -0.0265, "negative": 0.1013, "neutral": -0.0748 }, "yzv": { "positive": 0.0951, "negative": -0.0725, "neutral": -0.0226 }, "yzv skpqpump": { "positive": 0.0951, "negative": -0.0725, "neutral": -0.0226 }, "zcash": { "positive": 0.2441, "negative": -0.0397, "neutral": -0.2044 }, "zerdofr": { "positive": 0.0951, "negative": -0.0725, "neutral": -0.0226 }, "zerdofr ndt": { "positive": 0.0951, "negative": -0.0725, "neutral": -0.0226 }, "zero": { "positive": -0.1745, "negative": -0.1316, "neutral": 0.306 }, "zero knowledge": { "positive": -0.0235, "negative": -0.0645, "neutral": 0.088 }, "zhao": { "positive": -0.1336, "negative": 0.1497, "neutral": -0.0161 }, "zhao plead": { "positive": -0.0382, "negative": 0.0694, "neutral": -0.0311 }, "zhao sentenced": { "positive": -97e-4, "negative": 0.079, "neutral": -0.0693 }, "zipmex": { "positive": -0.0158, "negative": 0.1201, "neutral": -0.1043 }, "zk": { "positive": 0.2474, "negative": -0.1337, "neutral": -0.1137 }, "zone": { "positive": -0.1655, "negative": -0.0538, "neutral": 0.2193 }, "zoom": { "positive": 0.0278, "negative": 0.084, "neutral": -0.1118 } }, "oovLogLikelihood": { "positive": 0, "negative": 0, "neutral": 0 }, "vocabulary": ["$aave", "$aave buy", "$ada", "$ada going", "$ada huge", "$aero", "$aioz", "$akt", "$algo", "$algo $btc", "$algo $fil", "$algo $hbar", "$algo $xrp", "$algo nice", "$amp", "$apt", "$apt here", "$apt nice", "$apt target", "$arb", "$arb $op", "$atom", "$atom re", "$avax", "$avax fuckamoley", "$avax fucking", "$avax just", "$avax trending", "$avt", "$bch", "$bch $spermwha", "$bch nice", "$bch time", "$bera", "$bmnr", "$bnb", "$bnb $btc", "$bnb $hbar", "$bnb $uni", "$bnb nice", "$bonk", "$btc", "$btc $bnb", "$btc $doge", "$btc $etc", "$btc $eth", "$btc $mstr", "$btc $qqq", "$btc $sol", "$btc $tia", "$btc $xrp", "$btc all", "$btc breaking", "$btc buy", "$btc crashes", "$btc dominance", "$btc getting", "$btc here", "$btc just", "$btc like", "$btc looks", "$btc momentum", "$btc news", "$btc next", "$btc support", "$btc trading", "$btc volume", "$chip", "$cock", "$coin", "$comp", "$cro", "$cro $bnb", "$ctx", "$cxai", "$darth", "$darth fourth", "$dash", "$dog", "$doge", "$doge $shib", "$doge just", "$doge love", "$dot", "$dot trending", "$dot wow", "$ena", "$epic", "$etc", "$etc $btc", "$etc $eth", "$etc nice", "$eth", "$eth $ada", "$eth $bch", "$eth $btc", "$eth $dog", "$eth $doge", "$eth $etc", "$eth $hood", "$eth $sol", "$eth $tia", "$eth $uni", "$eth $xrp", "$eth buy", "$eth chart", "$eth crashes", "$eth getting", "$eth here", "$eth hits", "$eth momentum", "$eth news", "$eth trading", "$eth volume", "$fartcoin", "$fet", "$fet $render", "$fida", "$fil", "$fil nice", "$fil scooped", "$fil storage", "$ftm", "$glnk", "$grass", "$grt", "$gwei", "$hbar", "$hbar $avax", "$hnt", "$hnt $algo", "$hood", "$hype", "$icp", "$inj", "$inj $nonja", "$inj goes", "$inj literally", "$inj moves", "$inj nice", "$inj pumping", "$iren", "$jasmy", "$jup", "$jyai", "$kaio", "$kta", "$link", "$link $xrp", "$ltc", "$ltc new", "$ltc ready", "$lunc", "$lunc wluna", "$matic", "$maulcoin", "$mram", "$mstr", "$muln", "$near", "$near one", "$near trending", "$nonja", "$nonja $inj", "$nonja moves", "$nonja one", "$nonja pumping", "$nonja starting", "$nvda", "$ondo", "$ondo $near", "$op", "$op $arb", "$op $hnt", "$papl", "$paw", "$pengu", "$pepe", "$pepe $btc", "$pepe ayyy", "$pepe cd", "$pepe make", "$pol", "$pol $matic", "$prime", "$pump", "$pypl", "$qqq", "$qqq $spy", "$rari", "$rave", "$render", "$render great", "$retire", "$rls", "$roam", "$rose", "$shib", "$shib $pepe", "$shib $uni", "$shib gm", "$shib long", "$sol", "$sol $bnb", "$sol $btc", "$sol $tia", "$sol $updog", "$sol $xrp", "$sol all", "$sol breaking", "$sol buy", "$sol chart", "$sol getting", "$sol news", "$sol sol", "$sol trading", "$sol updog", "$spermwha", "$spermwha le", "$spy", "$spy $qqq", "$strk", "$sui", "$sui $sui", "$sui just", "$sui love", "$sui sui", "$sui trending", "$tao", "$tao $render", "$tel", "$tia", "$tia $atom", "$tia $op", "$tia celestia", "$toshi", "$troll", "$trx", "$trx $usdt", "$tsla", "$uni", "$uni $btc", "$uni $pepe", "$updog", "$updog $avax", "$updog $bnb", "$updog $etc", "$updog congrats", "$updog let", "$usdt", "$veil", "$wif", "$wif another", "$wif down", "$wif fuck", "$wif here", "$wif ing", "$wif nice", "$wif trending", "$wif yep", "$wld", "$wlfi", "$xdc", "$xlm", "$xlm $hbar", "$xlm $xrp", "$xlm back", "$xlm here", "$xlm how", "$xlm well", "$xrp", "$xrp $ada", "$xrp $algo", "$xrp $btc", "$xrp $fil", "$xrp $sol", "$xrp $xlm", "$xrp god", "$xtz", "$yfi", "$zbcn", "$zec", "$zec $atom", "$zk", "'cz'", "'s", "aave", "aax", "aax crypto", "aax suspends", "absolute", "absolutely", "absolutely trash", "abuse", "academic", "accelerate", "accelerates", "accept", "accept bitcoin", "accepting", "accepting bitcoin", "accepts", "accepts bitcoin", "access", "according", "account", "account hacked", "accounting", "accounts", "accumulate", "accumulated", "accumulating", "accumulating $btc", "accumulating $eth", "accumulating altcoins", "accumulating avax", "accumulating btc", "accumulating doge", "accumulating eth", "accumulating market", "accumulating ripple", "accumulating solana", "accumulating xrp", "accumulation", "accumulation phase", "accurate", "accused", "acquire", "acquire rival", "acquires", "acquisition", "across", "act", "action", "active", "activity", "actor", "actual", "actual fuck", "actually", "ad", "ada", "ada all", "ada breaking", "ada buy", "ada crashes", "ada getting", "ada news", "ada trading", "ada trend", "ada volume", "ada weak", "add", "added", "added more", "adding", "addresses", "adds", "administration", "admits", "admits stablecoin", "adopt", "adoption", "adoption hit", "adoption metrics", "ads", "advertising", "advice", "advisor", "af", "af cd", "affected", "afford", "afkcdbxdsaymexo", "afkcdbxdsaymexo vsfvprv", "africa", "african", "ag", "again", "age", "agent", "agentic", "agents", "aggregator", "ago", "agree", "agreed", "agrees", "ahead", "ai", "ai agent", "ai agentic", "ai agents", "ai chatbots", "ai generated", "ai infrastructure", "ai powered", "ai runtime", "ai stocks", "aih", "aih mn", "aim", "aims", "ain't", "air", "alert", "alert multiple", "alert top", "algorithm", "algorithms", "alive", "all", "all afford", "all chart", "all crypto", "all day", "all digital", "all fundamentals", "all looks", "all money", "all need", "all over", "all roads", "all shit", "all support", "all think", "all time", "all trend", "all volume", "all week", "allegations", "alleged", "allegedly", "allow", "allowed", "allows", "alloy", "almost", "almost every", "along", "alpha", "already", "already ing", "alright", "also", "alt", "alt coin", "alt coins", "alt season", "altcoin", "altcoin exchange", "altcoins", "altcoins all", "altcoins buy", "altcoins chart", "altcoins crashes", "altcoins getting", "altcoins here", "altcoins news", "altcoins surges", "altcoins trading", "altering", "altering data", "alternative", "alts", "altseason", "always", "am", "am building", "ama", "ama scheduled", "amazing", "amazon", "america", "american", "americans", "amid", "amid crypto", "amnesia", "amount", "analysis", "analysts", "analyzing", "anarchist", "anatomy", "android", "angel", "announced", "announced crackdown", "announcement", "announces", "announces pipe", "annoying", "another", "another day", "another dump", "another shit", "another weekend", "any", "any update", "anymore", "anyone", "anyone still", "aomst", "aomst pxyakyuvwwzt", "apecoin", "api", "apis", "app", "appears", "appetite", "apple", "approval", "approval landed", "approves", "apps", "april", "aptos", "ar", "arb", "arbitrage", "arbitrum", "architecture", "area", "aren", "around", "around even", "around right", "arrest", "arrested", "arrested allegedly", "arrive", "arrogant", "art", "artificial", "artificial intelligence", "asia", "asic", "asics", "ask", "ask hn", "asked", "asks", "ass", "asset", "assets", "assets blockchain", "assistant", "asteroid's", "ath", "atl", "atm", "atms", "atom", "attack", "attacker", "attackers", "attacks", "attempt", "attention", "attention matter", "audit", "audit failed", "auditor", "auto", "automated", "autonomous", "available", "avalanche", "avax", "avax all", "avax breaking", "avax fundamentals", "avax getting", "avax here", "avax news", "avax trading", "average", "avg", "aware", "away", "awesome", "aws", "ayyy", "ayyy trending", "ba", "ba cbedd", "babies", "baby", "back", "back down", "back off", "back over", "back rich", "back soon", "back up", "backdoored", "backed", "backed crypto", "backs", "bad", "bag", "bags", "ban", "ban all", "ban bitcoin", "ban crypto", "ban cryptocurrencies", "ban cryptocurrency", "ban penalising", "bandwidth", "bank", "banking", "bankman", "bankman fried", "bankruptcy", "banks", "banned", "banning", "banning politics", "bans", "bans cryptocurrency", "barely", "base", "based", "basic", "basically", "battle", "bch", "beanstalk", "bear", "bear cycle", "bear flag", "bear market", "bearing", "bearish", "bearish $btc", "bearish $eth", "bearish $sol", "bearish ada", "bearish bnb", "bearish cardano", "bearish market", "bearish sol", "bearish solana", "bearish xrp", "bears", "beat", "beats", "beautiful", "became", "because", "because going", "become", "becomes", "begin", "beginner", "begins", "behavior", "behind", "behind earlier", "believe", "benchmarks", "bend", "best", "best altcoins", "best community", "best crypto", "best cryptocurrency", "best month", "best performing", "bet", "beta", "bets", "better", "better know", "better start", "better than", "betterment", "beware", "beyond", "bid", "big", "big bitcoin", "big time", "bigger", "bigger than", "biggest", "biggest ponzi", "biggest stablecoin", "bill", "bill incoming", "bill per", "billion", "billion dollar", "billions", "binance", "binance admits", "binance ceo", "binance chain", "binance coinbase", "binance cz", "binance founder", "binance halts", "binance lawsuit", "binance says", "binance smart", "binance temporarily", "binance's", "bingo", "bit", "bitcoin", "bitcoin all", "bitcoin altcoin", "bitcoin atm", "bitcoin best", "bitcoin bitcoin", "bitcoin blockchain", "bitcoin boom", "bitcoin breaking", "bitcoin btc", "bitcoin bubble", "bitcoin buy", "bitcoin cash", "bitcoin ceo", "bitcoin coming", "bitcoin crashed", "bitcoin crashes", "bitcoin depot", "bitcoin etf", "bitcoin ethereum", "bitcoin failed", "bitcoin futures", "bitcoin here", "bitcoin it's", "bitcoin mine", "bitcoin miner", "bitcoin miners", "bitcoin mining", "bitcoin mixing", "bitcoin news", "bitcoin only", "bitcoin other", "bitcoin payments", "bitcoin price", "bitcoin rallies", "bitcoin stolen", "bitcoin surges", "bitcoin trading", "bitcoin tumbles", "bitcoin using", "bitcoin volume", "bitcoin's", "bitcoins", "bitcoins stolen", "bitfinex", "bithumb", "bitmart", "bittrex", "bitzlato", "black", "black rock", "blackrock", "blame", "bleed", "block", "block chain", "blockchain", "blockchain based", "blockchain bridge", "blockchain cryptocurrency", "blockchain implementation", "blockchain technology", "blockchain voting", "blockchains", "blockchains stablecoins", "blocks", "blockscale", "blockscale chips", "blog", "bloomberg", "blow", "blow global", "bnb", "bnb all", "bnb buy", "bnb crashes", "bnb here", "bnb news", "bnb trading", "bnb volume", "board", "boat", "body", "bonanza", "bond", "bonds", "book", "books", "boom", "booming", "border", "border payments", "born", "boss", "bot", "both", "bottom", "bottoms", "bought", "bought more", "bounce", "bounce back", "bounce taking", "bouncing", "bound", "bounty", "box", "boy", "brazil", "breach", "break", "break ath", "break even", "breaking", "breaking out", "breakout", "breaks", "breaks out", "breaks peg", "breakthrough", "bridge", "bridges", "briefly", "bright", "bring", "bringing", "bro", "broken", "broker", "bros", "brothers", "brothers arrested", "browser", "browser extension", "bs", "btc", "btc breaking", "btc buy", "btc consolidating", "btc crashes", "btc goes", "btc here", "btc lost", "btc news", "btc trading", "btc weak", "bubble", "bucks", "buddy", "bug", "build", "build crypto", "building", "building best", "building crypto", "buildout", "buildout near", "builds", "built", "built ai", "built crypto", "built ethereum", "bull", "bull cycle", "bull market", "bull run", "bull trap", "bulletproof", "bullish", "bullish $btc", "bullish $eth", "bullish $sol", "bullish ada", "bullish altcoins", "bullish avax", "bullish bitcoin", "bullish bnb", "bullish cardano", "bullish case", "bullish crypto", "bullish doge", "bullish eth", "bullish ethereum", "bullish ripple", "bullish sol", "bullish solana", "bullish xrp", "bulls", "bulls followers", "burnshot", "burnshot zero", "business", "buy", "buy $btc", "buy $nonja", "buy ai", "buy all", "buy bitcoin", "buy buy", "buy dip", "buy gold", "buy hold", "buy memecoins", "buy more", "buy now", "buy nvidia", "buy other", "buy right", "buy sell", "buy tech", "buy wait", "buyers", "buying", "buying accelerates", "buying dip", "buying holding", "buying more", "buys", "bvnk", "bybit", "bybit hack", "bybit says", "bye", "bytes", "ca", "ca xc", "call", "called", "calls", "calls ban", "camera", "campaign", "can't", "canada", "candle", "candles", "cannot", "cant", "cap", "cap barely", "cap still", "capitulation", "capitulation continues", "car", "card", "cardano", "cardano all", "cardano buy", "cardano crashes", "cardano getting", "cardano momentum", "cardano news", "cardano trading", "cardano volume", "cascade", "case", "cases", "cash", "cat", "cat bounce", "catalyst", "catalysts", "catalysts incoming", "catch", "cats", "cause", "caused", "causes", "cbedd", "cbedd cfcb", "cd", "cd cd", "cd ec", "celestia", "celestia $tia", "celsius", "cent", "center", "central", "central bank", "central banks", "centralized", "cents", "cents lol", "ceo", "ceo collapsed", "ceo says", "certain", "cfcb", "cftc", "chain", "chain attack", "chain bridge", "chain data", "chainlink", "chains", "challenge", "chance", "change", "change name", "changed", "changes", "changing", "changpeng", "changpeng zhao", "chaos", "charged", "charges", "charges binance", "charles", "chart", "chart looks", "chart shows", "chart ugly", "chartered", "charts", "chasing", "chat", "chatbots", "chatgpt", "cheap", "cheaper", "cheapies", "check", "check out", "checking", "checks", "chief", "child", "child abuse", "china", "china bitcoin", "china steps", "china wants", "chinese", "chinese bitcoin", "chip", "chips", "choose", "christ", "ci", "circle", "citing", "city", "cla", "cla afkcdbxdsaymexo", "claim", "claiming", "claims", "clarity", "clarity act", "clarity bill", "classic", "claude", "clear", "clear direction", "clear move", "clear winner", "cli", "cli tool", "clickhouse", "client", "clients", "climate", "climbing", "clone", "close", "closed", "closer", "cloud", "cloudflare", "clown", "cmon", "cmon bulls", "co", "co founder", "code", "codebase", "codebases", "codex", "coding", "coin", "coin scam", "coin sell", "coinbase", "coinbase account", "coinbase acquires", "coinbase ceo", "coinbase chief", "coinbase hacked", "coinbase mission", "coinbase says", "coinbase stock", "coinbase sued", "coinbase support", "coinbase yc", "coindcx", "coins", "coins compounded", "coins instead", "collapse", "collapsed", "collapsed crypto", "collapsed stablecoin", "collapsing", "collateral", "collateral damage", "colleagues", "colleagues say", "collectibles", "com", "come", "come join", "comeback", "comes", "comes another", "coming", "coming next", "coming off", "coming soon", "comment", "comments", "comming", "communities", "community", "companies", "company", "compiler", "complete", "completed", "completely", "compound", "compound gains", "compounded", "compounded gains", "compromised", "compute", "computer", "computing", "concerns", "conditions", "conference", "conference happening", "confidence", "confident", "confirmed", "confirms", "confirms hack", "congrats", "congrats $dot", "congrats $wif", "congress", "consensus", "consensys", "conservative", "consider", "considered", "consolidating", "consolidating waiting", "consolidation", "conspiracy", "conspiracy launder", "content", "context", "continue", "continues", "contract", "contracts", "control", "controlled", "controls", "convicted", "convicted binance", "conviction", "cooked", "cool", "cools", "copy", "core", "corporate", "corporation", "cosmos", "cosmos sdk", "cost", "costs", "couldn't", "count", "country", "couple", "course", "course crypto", "court", "covid", "cpu", "crackdown", "crap", "crash", "crashed", "crashed all", "crashes", "crashes hack", "crashes liquidity", "crashes major", "crashes regulators", "crashes sec", "crashes stablecoin", "crashes whale", "crashing", "crazy", "create", "created", "creating", "creative", "creator", "credit", "crime", "criminal", "crisis", "critical", "cross", "cross border", "cross chain", "cross platform", "crossed", "crowd", "crying", "cryo", "crypto", "crypto adoption", "crypto anarchist", "crypto bank", "crypto bear", "crypto breaking", "crypto bros", "crypto bull", "crypto buy", "crypto chart", "crypto coin", "crypto crackdown", "crypto crash", "crypto currencies", "crypto currency", "crypto custody", "crypto exchange", "crypto exchanges", "crypto firm", "crypto firms", "crypto getting", "crypto giant", "crypto hack", "crypto hacked", "crypto hacker", "crypto hackers", "crypto hacking", "crypto hacks", "crypto here", "crypto how", "crypto industry", "crypto investors", "crypto lender", "crypto market", "crypto markets", "crypto mining", "crypto news", "crypto payments", "crypto prediction", "crypto price", "crypto prices", "crypto rally", "crypto regulation", "crypto regulations", "crypto scam", "crypto scams", "crypto selloff", "crypto so", "crypto stablecoins", "crypto startup", "crypto stolen", "crypto summer", "crypto theft", "crypto token", "crypto tokens", "crypto trading", "crypto treasury", "crypto venture", "crypto wallet", "crypto winter", "crypto withdrawals", "crypto without", "crypto's", "cryptocurrencies", "cryptocurrencies $xrp", "cryptocurrency", "cryptocurrency ban", "cryptocurrency company", "cryptocurrency exchange", "cryptocurrency investment", "cryptocurrency market", "cryptocurrency mining", "cryptocurrency pump", "cryptocurrency scam", "cryptocurrency trading", "cryptocurrency transactions", "cryptographic", "cryptographically", "cryptography", "cryptokitties", "cryptos", "currencies", "currency", "current", "currently", "curve", "custody", "custom", "customer", "customers", "cut", "cuts", "cuts staff", "cuts workforce", "cycle", "cz", "cz binance", "da", "da db", "daily", "damage", "dangerous", "dao", "dao attacker", "dao hack", "dao raised", "daos", "dapp", "dark", "darkside", "dashboard", "data", "data breach", "data center", "database", "datadog", "date", "day", "day another", "day nothing", "day trading", "day week", "days", "db", "db ed", "dca", "dea", "dead", "dead cat", "dead man's", "dead money", "deal", "dealing", "deals", "dear", "dear life", "dear sophie", "death", "debate", "debt", "debut", "decade", "decades", "decent", "decentralization", "decentralized", "decentralized exchange", "decentralized finance", "declares", "deep", "defense", "defi", "defi exploit", "defi hack", "defi protocol", "defichain", "defies", "define", "defined", "defines", "defining", "definitely", "definition", "degen", "delisted", "deliver", "deliver malware", "delivering", "demand", "department", "depends", "depin", "deposits", "deposits withdrawals", "depot", "depot files", "derivatives", "design", "designed", "designer", "desperate", "despite", "detect", "detecting", "detecting cryptocurrency", "deterministic", "dev", "developer", "developer update", "developers", "developers release", "development", "developments", "devices", "devs", "dex", "dfi", "dfi defichain", "didn", "didn't", "die", "dies", "difference", "different", "different crypto", "difficulty", "difficulty drops", "digital", "digital asset", "digital assets", "digital currency", "digital dogshit", "digital gold", "digital silver", "digits", "dilution", "dip", "dip cardano", "dip ripple", "dip solana", "dip xrp", "direction", "direction yet", "dirty", "disables", "disaster", "disclosure", "discord", "discount", "discovery", "discussion", "dismiss", "distributed", "dive", "divergence", "divergence daily", "dm", "documentation", "doesn", "doesn't", "dog", "dog shit", "doge", "doge all", "doge breaking", "doge buy", "doge here", "doge news", "doge surges", "doge trading", "doge volume", "dogecoin", "dogshit", "doing", "doj", "doj seizes", "dollar", "dollars", "domain", "dominance", "don", "don fade", "don sleep", "don think", "don't", "don't know", "donations", "done", "dont", "doom", "doomed", "doomed fail", "door", "dosent", "dosent feel", "dot", "dots", "double", "doubled", "down", "down due", "down goes", "down not", "download", "downtrend", "dprk", "drain", "drained", "drained funds", "drains", "dream", "dried", "dried up", "driven", "drop", "dropped", "dropped sharply", "drops", "drug", "duck", "dude", "due", "dumb", "dump", "dump shit", "dumped", "dumped millions", "dumping", "dumping $sol", "dumping ada", "dumping altcoins", "dumping bnb", "dumping btc", "dumping buy", "dumping crypto", "dumping doge", "dumping ing", "dumping link", "dumping ripple", "dumping sol", "dumping xrp", "dumps", "dust", "dying", "each", "earlier", "earlier failed", "early", "earn", "earnings", "earnings call", "ease", "easiest", "easily", "easy", "easy money", "ec", "ec af", "eco", "economic", "economics", "economy", "ecosystem", "ed", "ed ba", "educational", "efficient", "eggs", "eiejem", "eiejem rggtracxfrge", "el", "el salvador", "elon", "em", "emails", "emergency", "emissions", "employees", "emulator", "encouraging", "encrypted", "encryption", "end", "end encrypted", "end end", "ending", "ends", "energy", "engine", "engineer", "engineer pleads", "enjoy", "enough", "enough hold", "enterprise", "entire", "entire defi", "entry", "entry point", "environment", "environmental", "environmental impact", "era", "established", "etf", "etf approval", "etf inflows", "etfs", "eth", "eth all", "eth breaking", "eth crashes", "eth fees", "eth fundamentals", "eth getting", "eth here", "eth news", "eth trading", "ether", "ethereum", "ethereum all", "ethereum based", "ethereum blockchain", "ethereum breaking", "ethereum buy", "ethereum chart", "ethereum classic", "ethereum co", "ethereum community", "ethereum contracts", "ethereum crashes", "ethereum devs", "ethereum etf", "ethereum fundamentals", "ethereum getting", "ethereum network", "ethereum news", "ethereum price", "ethereum trading", "ethereum's", "eu", "euro", "europe", "even", "even more", "event", "ever", "ever created", "ever seen", "every", "every coin", "every day", "every other", "every time", "every week", "everybody", "everyone", "everyone dumping", "everything", "everywhere", "evil", "evolution", "ex", "ex terra", "exactly", "exch", "exchange", "exchange aax", "exchange announces", "exchange backed", "exchange binance", "exchange bittrex", "exchange bitzlato", "exchange bybit", "exchange coinbase", "exchange coindcx", "exchange collapse", "exchange ftx", "exchange got", "exchange hacked", "exchange kraken", "exchange listings", "exchange nobitex", "exchange suspends", "exchange wazirx", "exchanges", "exchanges volume", "execs", "executives", "executives arrested", "exit", "exit scam", "expect", "expected", "expected range", "expects", "experiment", "expert", "experts", "explained", "explode", "exploding", "exploit", "exploit drains", "exploit polygon", "exploited", "exploiting", "exposes", "extension", "eye", "eyes", "fa", "face", "facebook", "facebook's", "facebook's libra", "faces", "faces lawsuit", "facts", "fade", "fades", "fail", "failed", "failed crypto", "failed stablecoin", "failing", "fails", "failure", "failures", "fair", "fake", "fake tesla", "fall", "falling", "falling wedge", "falls", "fam", "families", "family", "fan", "faq", "far", "farm", "farm aih", "fashion", "fast", "faster", "faster than", "favorite", "favorite staking", "favorites", "fbi", "fbnsx", "fbnsx eiejem", "fear", "fears", "feature", "features", "fed", "federal", "feds", "feds seized", "fee", "feedback", "feel", "feel good", "feel like", "feels", "feels good", "fees", "fees dropped", "few", "few months", "fiat", "fidelity", "figures", "fil", "file", "file coin", "filed", "filed lawsuit", "files", "files bankruptcy", "files charges", "filing", "filings", "filling", "final", "finally", "finance", "finance app", "finance bitcoin", "finances", "financial", "financial advice", "financial crisis", "financial system", "find", "finds", "fine", "fines", "fintech", "fire", "firm", "firm soar", "firms", "first", "first bitcoin", "first crypto", "first day", "first ever", "first impressions", "first quarter", "first time", "five", "fix", "flag", "flash", "flash crash", "flat", "flat never", "floods", "floor", "flush", "fly", "fly price", "focus", "focused", "focused company", "folks", "follow", "followers", "followers friends", "following", "follows", "fomo", "forbes", "force", "forced", "forget", "forgotten", "fork", "format", "former", "forming", "forms", "found", "foundation", "foundation announces", "founder", "founder changpeng", "founder hobnobs", "founder's", "founders", "four", "four months", "fourth", "framework", "fraud", "fraudulent", "free", "free service", "freedom", "freezes", "friday", "fried", "friends", "front", "frozen", "frozen out", "ftx", "ftx collapse", "ftx files", "fuck", "fuckamoley", "fucked", "fuckin", "fucking", "fucking piece", "fud", "fueled", "full", "fully", "fun", "fund", "fundamentals", "fundamentals strong", "fundamentals weak", "funded", "funding", "funds", "funds lying", "further", "future", "future blockchain", "future finance", "futures", "gain", "gains", "gains clarity", "gambling", "game", "games", "gaming", "gap", "garbage", "garbage never", "garbage piece", "gas", "gas fees", "gave", "gd", "gd dm", "gem", "gemini", "gen", "generated", "generation", "generations", "genesis", "gensyn", "get", "get off", "get paid", "get power", "get ready", "get started", "gets", "getting", "getting closer", "getting rekt", "getting started", "getting trending", "giant", "giant binance", "gift", "gig", "git", "github", "github repo", "give", "giveaway", "gives", "giving", "giving out", "glad", "global", "global bitcoin", "global payment", "glta", "gm", "go", "go $updog", "go back", "go up", "goal", "god", "god great", "gods", "goes", "goes back", "goes ing", "goes parabolic", "goes up", "going", "going back", "going down", "going moon", "going zero", "gold", "gold instead", "goldman", "gone", "gonna", "good", "good day", "good job", "good luck", "good man", "good morning", "google", "google cloud", "got", "got hacked", "gotta", "gotta love", "gov", "gov't", "government", "gox", "gox crypto", "gpu", "grabbed", "graph", "graphics", "grayscale", "great", "great again", "great news", "great see", "great seeing", "great such", "great time", "great utility", "great week", "great weekend", "greatest", "green", "green candle", "green green", "grok", "group", "growing", "growing $updog", "grows", "growth", "guaranteed", "guide", "guilty", "guilty hacking", "guy", "guys", "hack", "hack drained", "hacked", "hacked crypto", "hacked over", "hacker", "hacker behind", "hacker news", "hackers", "hackers behind", "hackers drain", "hackers steal", "hackers stole", "hackers use", "hacking", "hacking crypto", "hacks", "half", "halt", "halted", "halts", "halts all", "halts deposits", "halts withdrawals", "halving", "hand", "hands", "hands shaken", "happen", "happened", "happening", "happy", "hard", "hard fork", "hard way", "harder", "hardware", "hardware wallets", "hashrate", "hasn", "hate", "haters", "hates", "haven", "hayes", "head", "headed", "healthy", "heap", "heating", "heating up", "heats", "heavy", "hedge", "hedge fund", "heist", "held", "held perfectly", "hell", "help", "helped", "helped crypto", "helping", "helps", "here", "here chart", "here comes", "here don", "here even", "here fundamentals", "here gain", "here great", "here momentum", "here see", "here smart", "here so", "here support", "here volume", "here's", "hey", "hgp", "hid", "hidden", "hide", "high", "high adoption", "high etf", "high fees", "high institutional", "high major", "high network", "high watch", "higher", "higher $updog", "highly", "highs", "hilarious", "historically", "history", "hit", "hit crypto", "hit new", "hit record", "hits", "hn", "hn ai", "hn am", "hn bitcoin", "hn built", "hn burnshot", "hn create", "hn created", "hn crypto", "hn dao", "hn decentralized", "hn financial", "hn free", "hn how", "hn made", "hn new", "hn open", "hn what's", "hn why", "hobnobs", "hobnobs trump", "hodlers", "hold", "holders", "holding", "holding ada", "holding altcoins", "holding avax", "holding bnb", "holding btc", "holding dear", "holding doge", "holding link", "holding long", "holding market", "holding ripple", "holding solana", "holding strong", "holding up", "holds", "holy", "holy shittamoley", "home", "homepage", "hong", "hong kong", "hope", "hopeful", "hopefully", "hopes", "hophn", "hophn fbnsx", "hoping", "hopium", "horizon", "hoskinson", "hosting", "hot", "hour", "hours", "house", "how", "how bitcoin", "how build", "how create", "how crypto", "how get", "how long", "how make", "http", "hub", "huge", "huge news", "human", "humans", "hunting", "hurry", "hurry up", "hype", "hyperliquid", "i'm", "i'm going", "i've", "ico", "icos", "icp", "id", "idea", "ideas", "identity", "idiot", "ignore", "ill", "illegal", "illicit", "im", "image", "imagine", "imagine buying", "imminent", "immutability", "imo", "impact", "implementation", "important", "impressions", "impressive", "incident", "incoming", "incoming stated", "increased", "increasingly", "incredible", "indefinitely", "index", "indexer", "india", "india propose", "indian", "indian crypto", "indicator", "industry", "infamous", "infamous hacker", "inflation", "inflows", "inflows hit", "information", "information stolen", "infra", "infrastructure", "ing", "ing cent", "ing dumping", "ing figures", "ing garbage", "ing typical", "inj", "injective", "input", "insane", "inside", "insider", "insider trading", "insolvent", "install", "instant", "instead", "instead ada", "instead btc", "institutional", "institutional adoption", "institutional buying", "institutions", "intel", "intel vets", "intel's", "intel's bitcoin", "intelligence", "interactive", "interest", "interested", "interesting", "internet", "internet shutdown", "interview", "intro", "invest", "invest crypto", "invested", "investigation", "investment", "investment launch", "investment scam", "investments", "investor", "investors", "investors wiped", "io", "ios", "iota", "iphone", "ipo", "iran", "iran's", "iran's crypto", "iran's largest", "iranian", "iranian crypto", "irs", "isn't", "israel", "issuer", "issues", "issues warning", "issuing", "it's", "it's not", "it's time", "itself", "jack", "jackct", "jail", "jailed", "jam", "jan", "january", "japan", "javascript", "jersey", "jito", "jk", "job", "join", "joke", "jp", "jp morgan", "jpmorgan", "js", "js library", "judge", "jump", "jumps", "june", "junk", "just another", "just bought", "just buy", "just failed", "just got", "just great", "just hoping", "just keep", "just like", "just need", "just needs", "just pump", "just thought", "just went", "just worst", "justice", "kalshi", "kazakhstan", "kazakhstan internet", "keep", "keep accumulating", "keep buying", "keep eye", "keeping", "keeps", "keeps growing", "kentucky", "key", "key levels", "key support", "keys", "kicking", "kicks", "kicks gone", "kill", "king", "know", "knowing", "knowledge", "knowledge proofs", "known", "knows", "kodak", "kodakcoin", "kong", "kong crypto", "korea", "korea's", "korea's crypto", "korean", "korean crypto", "korean hackers", "kraken", "kraken crypto", "kwon", "kwon behind", "kyc", "lab", "labs", "lady", "lago", "lambo", "land", "landed", "language", "laptop", "large", "large codebases", "larger", "largest", "largest bitcoin", "largest crypto", "largest defi", "last", "last time", "last week", "last year", "late", "lately", "later", "latest", "launch", "launch sovereignai", "launched", "launches", "launching", "launder", "launder stolen", "laundering", "laureate", "law", "laws", "lawsuit", "lawsuit dao", "lawsuit over", "layer", "layoffs", "lays", "lays off", "le", "lead", "leak", "learn", "learned", "learning", "least", "leave", "leaves", "leaving", "ledger", "lee", "left", "left behind", "leftist", "leftists", "leg", "leg up", "legal", "legit", "lender", "lender genesis", "lending", "less", "less than", "lesson", "lessons", "lessons learned", "let", "let get", "let go", "let's", "lets", "lets go", "level", "levels", "leverage", "leveraged", "lfg", "libra", "libra cryptocurrency", "libraries", "library", "library backdoored", "licence", "lies", "life", "life savings", "lifts", "light", "lightning", "lightweight", "like", "like bull", "like buying", "like most", "like need", "like nice", "likely", "line", "link", "link breaking", "link buy", "link chart", "link crashes", "link fundamentals", "link getting", "link here", "link momentum", "link news", "link trading", "linked", "links", "linux", "liquid", "liquidated", "liquidation", "liquidation cascade", "liquidations", "liquidity", "liquidity dried", "list", "listed", "listen", "listings", "litepaper", "literally", "little", "live", "live crypto", "ll", "ll just", "llm", "llms", "lmfao", "load", "load up", "loaded", "loading", "loading up", "loan", "local", "local ai", "locally", "lock", "locked", "login", "logs", "lol", "long", "long $btc", "long $eth", "long ada", "long avax", "long bitcoin", "long bnb", "long bulls", "long cardano", "long crypto", "long link", "long market", "long ripple", "long sol", "long solana", "long strong", "long term", "long time", "long xrp", "longer", "longs", "look", "looking", "looking good", "looks", "looks bullish", "looks good", "looks like", "lose", "loser", "losers", "loses", "loses exploit", "losing", "loss", "loss crypto", "losses", "lost", "lost crypto", "lot", "lots", "love", "love back", "love sui", "low", "lower", "lows", "ltc", "luck", "lummis", "luna", "luna ust", "lying", "lying regulators", "mac", "machine", "macos", "macro", "made", "mainnet", "mainnet stats", "maintain", "major", "major exchange", "major partnership", "make", "make money", "maker", "makes", "makes ai", "making", "making crypto", "malicious", "malware", "man", "man $eth", "man's", "man's switch", "manager", "managing", "mango", "manipulation", "many", "many people", "many times", "map", "mar", "mar lago", "march", "margin", "margin trading", "mark", "market", "market breaking", "market buy", "market cap", "market collapse", "market conditions", "market crashes", "market getting", "market here", "market manipulation", "market news", "market sentiment", "market share", "market still", "market structure", "market trading", "marketcap", "marketing", "marketplace", "markets", "markets crashed", "mass", "massive", "massively", "mastercard", "math", "matic", "matic $lunc", "matter", "mc", "mcap", "md", "mean", "means", "mechanisms", "media", "meets", "melt", "melt faces", "meme", "meme coin", "meme coins", "memecoin", "memecoins", "memecoins instead", "memes", "memory", "men", "menu", "metrics", "michael", "michael saylor", "microsoft", "million", "million coins", "million dollars", "million market", "millionaires", "millions", "millions crypto", "mind", "mine", "mine bitcoin", "mined", "miner", "miners", "miners traders", "mini", "minimum", "mining", "mining bitcoin", "mining blockscale", "mining boom", "mining companies", "mining energy", "mining hub", "mining operation", "mining pools", "mining power", "minnesota", "mint", "minute", "minutes", "misery", "misery trash", "mishandling", "mishandling funds", "misleading", "miss", "miss out", "missing", "mission", "mission focused", "mistake", "mit", "mix", "mixing", "mln", "mms", "mn", "mn hophn", "mobile", "mode", "model", "models", "modular", "moment", "momentum", "momentum building", "monero", "money", "money accumulating", "money gone", "money laundering", "money printing", "money'", "moneygram", "monitor", "month", "month month", "month years", "months", "months prison", "moon", "moon shot", "moratorium", "more", "more bullish", "more here", "more money", "more people", "more than", "more tokens", "morgan", "morgan stanley", "morning", "most", "most bullish", "most likely", "mounting", "mouth", "move", "moved", "movement", "moves", "moves $nonja", "movie", "moving", "moving up", "mt", "mt gox", "much", "multi", "multiple", "multiple catalysts", "music", "musk", "nails", "name", "nancy", "narrative", "narratives", "nasa", "national", "native", "native blockchain", "nd", "ndt", "ndt yzv", "near", "near foundation", "near powered", "nearly", "nears", "necessary", "need", "need farm", "needed", "needs", "negative", "nervous", "net", "net domain", "network", "network upgrade", "networks", "neural", "never", "new", "new all", "new ath", "new crypto", "new era", "new highs", "new jersey", "new lows", "new study", "new york", "news", "news today", "next", "next bch", "next bull", "next crypto", "next few", "next financial", "next gen", "next leg", "next level", "next week", "next year", "nft", "nft sales", "nfts", "nice", "nice bounce", "nice run", "nice see", "nicehash", "nix", "no", "no clear", "no crypto", "no login", "no longer", "no more", "no one", "no use", "nobel", "nobel laureate", "nobitex", "nobitex hacked", "nobody", "node", "nodes", "noise", "nomina", "non", "nonja", "nonsense", "nope", "north", "north american", "north korea", "north korea's", "north korean", "not", "not accept", "not all", "not bullish", "not even", "not financial", "not just", "not long", "not next", "not public", "not scam", "not short", "not too", "not used", "notes", "nothing", "nothing ing", "notice", "notification", "notifications", "now", "now accepts", "now lol", "now time", "npm", "nsa", "nuclear", "number", "nvidia", "nvidia instead", "nyt", "oceanpal", "oceanpal partnership", "october", "off", "off apecoin", "offering", "offers", "office", "officer", "official", "officials", "offline", "often", "oh", "oh god", "okay", "old", "omg", "once", "one", "one best", "one ever", "one ing", "one largest", "one memes", "one more", "one thing", "one time", "online", "only", "only million", "only thank", "only way", "open", "open source", "openai", "opening", "opens", "operating", "operation", "operations", "opportunity", "optimism", "optimistic", "option", "options", "orange", "order", "order book", "order books", "ordered", "orderly", "orderly exit", "orders", "original", "orm", "os", "other", "other coins", "other cryptocurrencies", "other cryptocurrency", "others", "out", "out chart", "out crypto", "out fundamentals", "out get", "out momentum", "out smart", "out support", "out there", "out volume", "outage", "outflows", "outlook", "outperform", "over", "over alleged", "over bitcoin", "over crypto", "over here", "over past", "over people", "overnight", "overseas", "oversold", "overtakes", "overtakes china", "own", "own crypto", "owned", "owner", "owns", "ozempic", "packages", "packed", "page", "paid", "pain", "paint", "paint net", "palantir", "pamp", "panic", "panicking", "paper", "parabolic", "pardon", "pardons", "pardons convicted", "part", "partner", "partners", "partnership", "partnership announced", "partnership near", "partnerships", "party", "pass", "passes", "passes stablecoin", "passing", "password", "past", "paste", "patch", "patent", "path", "patience", "pattern", "patterns", "paused", "paving", "pay", "paying", "payment", "payments", "paypal", "pc", "pdf", "peace", "peak", "peg", "penalising", "penalising miners", "penny", "people", "people get", "people know", "people make", "pepe", "per", "per month", "percent", "perfect", "perfect time", "perfectly", "performance", "performing", "period", "perma", "perma bears", "perplexity", "person", "personal", "personal finance", "personal information", "perspective", "peter", "peter thiel", "peter thiel's", "pgp", "phantom", "phantom wallet", "phase", "phishing", "phone", "photos", "php", "phrase", "pi", "pick", "picking", "picks", "piece", "piece fucking", "piece sh", "piece shit", "piece shitcoin", "pile", "pipe", "pipe investment", "place", "plan", "plans", "plate", "platform mango", "platforms", "play", "plays", "plea", "plead", "plead guilty", "pleads", "pleads guilty", "please", "plummet", "plummeting", "plummets", "plunges", "point", "points", "poison", "police", "police arrest", "policy", "polish", "political", "politics", "polkadot", "polygon", "ponzi", "ponzi scheme", "ponzi schemes", "pool", "pools", "poor", "pop", "portfolio", "pos", "position", "position here", "positioned", "possible", "post", "post quantum", "post so", "posted", "postgresql", "posting", "posts", "potential", "pow", "power", "power cryptocurrencies", "powered", "powered ai", "powerful", "pre", "prediction", "prediction market", "prediction markets", "prepares", "president", "pressure", "presumed", "pretty", "prevented", "previous", "previously", "previously post", "price", "price action", "price inflation", "price prediction", "price surge", "price target", "prices", "printing", "prison", "prison time", "privacy", "privacy coins", "private", "pro", "pro israel", "probably", "probe", "probes", "problem", "processed", "processing", "product", "production", "profit", "profit taking", "profitable", "profits", "programming", "progress", "project", "project real", "projects", "prompt", "proof", "proof stake", "proof work", "proofs", "proposal", "propose", "propose cryptocurrency", "proposes", "protect", "protected", "protests", "protocol", "protocol drained", "protocols", "prove", "provides", "pt", "public", "published", "pull", "pump", "pump dump", "pumping", "pumping $nonja", "pumping soon", "purchased", "purchases", "pure", "purpose", "push", "pushing", "put", "putin", "puts", "putting", "pxyakyuvwwzt", "pxyakyuvwwzt zerdofr", "python", "qr", "quadrigacx", "quantum", "quantum computing", "quantum crypto", "quantum resistant", "quantum safe", "quarter", "quarterly", "question", "quick", "quiet", "quietly", "quit", "quits", "qzhyms", "qzhyms hgp", "race", "rag", "raid", "raided", "raise", "raised", "raises", "rallies", "rally", "ran", "random", "range", "ranks", "ranks top", "ransomware", "rapid", "rare", "rate", "ratio", "raw", "re", "re gonna", "re welcome", "reach", "reaches", "read", "readers", "reading", "ready", "ready send", "real", "real action", "real adoption", "real infra", "real time", "real world", "realize", "really", "really well", "reason", "rebound", "recent", "recently", "reclaim", "recommend", "recommendations", "record", "record high", "records", "recover", "recovery", "red", "red candles", "red flat", "reddit", "refuse", "regime", "regret", "regulate", "regulation", "regulations", "regulator", "regulators", "regulators announced", "rekt", "rekt chart", "rekt fundamentals", "rekt looks", "rekt support", "rekt trend", "rekt volume", "related", "release", "released", "releases", "remain", "remains", "remember", "remittance", "removal", "render", "renewable", "renewable energy", "repeated", "replace", "replacing", "repo", "report", "reported", "reports", "reports record", "reputation", "requests", "research", "researcher", "researchers", "reserve", "reserves", "resigns", "resist", "resist retire", "resistance", "resistant", "resists", "resolution", "response", "response apple", "rest", "resting", "result", "resulting", "retail", "retail investors", "retire", "retirement", "return", "returns", "reuters", "reveals", "revenue", "revenue jumps", "reversal", "review", "revive", "revives", "revolt", "reward", "rewards", "rewrite", "rggtracxfrge", "rh", "rich", "ride", "right", "right here", "right now", "riot", "riot blockchain", "rip", "ripple", "ripple all", "ripple breaking", "ripple buy", "ripple chart", "ripple crashes", "ripple getting", "ripple here", "ripple momentum", "ripple news", "ripple surges", "ripple trading", "rise", "rising", "risk", "rival", "rival ftx", "road", "roadmap", "roads", "roads lead", "robinhood", "rock", "rocket", "role", "round", "rpc", "rsi", "rug", "rug pull", "rugpull", "rule", "rules", "run", "run $updog", "run also", "run now", "run started", "run up", "runner", "running", "runs", "runtime", "runway", "russia", "russian", "rust", "sad", "safe", "safe crypto", "safedollar", "safedollar stablecoin", "safety", "said", "said buy", "sale", "sales", "salvador", "sam", "sam bankman", "same", "sanctions", "satoshi's", "save", "saves", "savings", "saw", "say", "saying", "saylor", "says", "says ceo", "says ftx", "says sec", "says stolen", "scale", "scaling", "scam", "scam chain", "scam coin", "scam crypto", "scammed", "scammers", "scams", "scandal", "schedule", "scheduled", "scheme", "schemes", "schwab", "scooped", "scooped up", "scratch", "screener", "sdk", "search", "search engine", "searching", "season", "sec", "sec charges", "sec filed", "sec files", "sec lawsuit", "sec sues", "sec's", "second", "seconds", "secret", "secrets", "sector", "secure", "secured", "securities", "security", "see", "see again", "see cents", "see updog", "see ya", "seed", "seed phrase", "seeing", "seeking", "seems", "seems like", "seen", "seen so", "sees", "seized", "seized crypto", "seized iran's", "seized nearly", "seizes", "self", "sell", "sell here", "sell soon", "sellers", "selling", "selling $btc", "selling $eth", "selling $sol", "selling ada", "selling altcoins", "selling bnb", "selling btc", "selling crypto", "selling eth", "selling ethereum", "selling link", "selling market", "selling ripple", "selling sol", "selling xrp", "selloff", "sells", "senate", "senate bill", "senate passes", "send", "send $updog", "send higher", "sends", "sense", "sent", "sentence", "sentenced", "sentenced four", "sentencing", "sentiment", "sepa", "sepa network", "seriously", "server", "servers", "service", "services", "set", "setting", "settle", "settlement", "setup", "seven", "several", "sh", "shake", "shaken", "shaken out", "shame", "share", "shared", "shared roadmap", "shares", "sharing", "sharply", "sheds", "shift", "ship", "shit", "shit block", "shit coin", "shit just", "shitcoin", "shittamoley", "shock", "short", "short term", "shorting", "shorts", "shorts start", "shot", "shouldn't", "show hn", "showing", "shows", "shows how", "shut", "shutdown", "shuts", "shuts down", "shutting", "shutting down", "sick", "side", "sideways", "sideways no", "sign", "signal", "signals", "signed", "significantly", "signs", "silicon", "silk", "silk road", "silver", "simple", "simplest", "since", "singapore", "single", "sinks", "sister", "sister crypto", "sites", "skpqpump", "sky", "skyrocket", "slammed", "slams", "sleep", "sleep one", "sleeping", "slide", "slides", "slowly", "slumps", "sma", "small", "small position", "smart", "smart chain", "smart contract", "smart contracts", "smart money", "smell", "smells", "so", "so cheap", "so far", "so fucked", "so hard", "so many", "so much", "so top", "soar", "soar unaware", "soaring", "soars", "social", "social media", "software", "sol", "sol all", "sol breaking", "sol buy", "sol news", "sol support", "sol surges", "sol trading", "sol volume", "solana", "solana aih", "solana all", "solana based", "solana breaking", "solana crashes", "solana here", "solana meme", "solana news", "solana nft", "solana stablecoin", "solana trading", "solana volume", "solana web", "solana's", "sold", "solid", "solid project", "solution", "some", "some coins", "some love", "some more", "some volume", "someone", "something", "something off", "sometime", "son", "sons", "soon", "soon buy", "sophie", "sophie how", "source", "source code", "south", "south korea", "sovereignai", "sovereignai buildout", "space", "spacex", "spacex ipo", "spam", "speaks", "speed", "spend", "spending", "spent", "spiking", "spot", "spot bitcoin", "spot etf", "spreading", "spreading fud", "squeeze", "st", "stable", "stable coin", "stable coins", "stablecoin", "stablecoin bill", "stablecoin collapsed", "stablecoin drops", "stablecoin ex", "stablecoin issuer", "stablecoin market", "stablecoin payments", "stablecoin project", "stablecoin reserve", "stablecoin startup", "stablecoin tether", "stablecoin trading", "stablecoins", "stack", "stackshighsociety", "staff", "stake", "stake forbes", "staking", "staking tokens", "standard", "standard chartered", "stanley", "stark", "starknet", "start", "start move", "start pump", "started", "starting", "starts", "startup", "state", "stated", "stated previously", "statements", "stats", "stats published", "stay", "stay away", "stay strong", "stayed", "stays", "stays up", "steady", "steal", "steal crypto", "steal cryptocurrency", "stealing", "stealing crypto", "steam", "stellar", "step", "step down", "steps", "steps up", "still", "still coming", "still early", "still holding", "still think", "stock", "stock tumbles", "stocks", "stocks instead", "stocktwits", "stole", "stolen", "stolen crypto", "stolen cryptocurrency", "stolen data", "stop", "storage", "store", "store value", "story", "straight", "strategies", "stratosphere", "street", "street's", "strength", "stress", "stripe", "strong", "strong confident", "strong support", "stronger", "structure", "study", "stupid", "sub", "subpoena", "succeed", "such", "such life", "suck", "suckers", "sucks", "suddenly", "sue", "sued", "sued sec", "sues", "sues crypto", "sues perplexity", "suffers", "suggest", "suggests", "sui", "sui network", "summer", "super", "super bullish", "supply", "supply chain", "supply shock", "support", "support held", "support just", "support level", "supports", "sure", "surge", "surges", "surges new", "surges past", "surpasses", "surprise", "surveillance", "survive", "suspected", "suspended", "suspends", "suspends payments", "suspends withdrawals", "sustainability", "sustainable", "swap", "swap $sol", "swe", "sweden", "swings", "switch", "system", "system end", "systems", "taiwan", "take", "take off", "taken", "takeover", "takes", "takes aim", "takes bitcoin", "takes place", "taking", "taking sister", "talk", "talk shit", "talking", "talking negative", "talks", "target", "target together", "targets", "task", "tax", "tbh", "team", "team shared", "teams", "tech", "tech stocks", "technical", "technology", "telegram", "tell", "tell already", "tell hn", "tells", "temporarily", "temporarily suspends", "temporary", "term", "term holders", "terminal", "terms", "terms conditions", "terra", "terra colleagues", "terra stablecoin", "terrausd", "terrible", "tesla", "test", "tether", "tether breaks", "tether says", "texas", "textbook", "tf", "tg", "th", "than", "than all", "than ever", "than meme", "thank", "thank attention", "thank later", "thanks", "that's", "thats", "theft", "theory", "there", "there better", "there no", "thief", "thiel", "thiel backed", "thiel's", "thin", "thing", "things", "think", "think bitcoin", "thinking", "thinks", "third", "though", "thought", "thoughts", "thousands", "thread", "threat", "threat crypto", "threatens", "threats", "three", "throwing", "tia", "tied", "tight", "till", "time", "time buy", "time fly", "time get", "time high", "time highs", "time load", "times", "times pump", "tip", "today", "today $btc", "today ama", "today conference", "today developer", "today mainnet", "today team", "today's", "today's litepaper", "together", "together get", "token", "token launch", "tokenization", "tokens", "tokens coins", "told", "told many", "tom", "tom lee", "tomorrow", "too", "too late", "took", "took profits", "tool", "toolkit", "tools", "top", "top crypto", "top favorite", "top staking", "total", "total loss", "touch", "touches", "tough", "toward", "town", "track", "tracker", "tracking", "trade", "traded", "trader", "traders", "trading", "trading around", "trading bot", "trading platform", "trading sideways", "traditional", "traffic", "transaction", "transactions", "transfers", "transparent", "trap", "trash", "treasuries", "treasury", "trend", "trend broken", "trending", "trending $updog", "trending updog", "tried", "tries", "trigger", "trigger next", "triggered", "trillion", "trip", "triple", "tron", "true", "true long", "trump", "trump family", "trump going", "trump got", "trump media", "trump pardons", "trump sons", "trump's", "trust", "try", "trying", "tuesday", "tumbles", "turkey", "turn", "turn any", "turned", "turning", "turns", "tvl", "twitter", "twitter accounts", "two", "two brothers", "txs", "type", "typical", "ugly", "ui", "uk", "ukraine", "unable", "unaware", "unaware infamous", "under", "undermine", "understanding", "undervalued", "undervalued great", "uniswap", "unit", "units", "universal", "unlike", "unlimited", "unregistered", "unregistered securities", "unstoppable", "until", "up", "up $btc", "up $eth", "up ada", "up altcoins", "up atom", "up avax", "up bitcoin", "up bnb", "up call", "up cardano", "up crackdown", "up crypto", "up doge", "up end", "up eth", "up ethereum", "up just", "up last", "up link", "up market", "up once", "up only", "up ripple", "up so", "up sol", "up solana", "up some", "up xrp", "upbit", "upcoming", "update", "update posted", "updog", "updog let", "updog phantom", "upgrade", "upgrade went", "upside", "upside potential", "upward", "ur", "usa", "usage", "usd", "usdc", "usdc stablecoin", "usdd", "usdt", "use", "use case", "used", "useless", "user", "users", "uses", "using", "using cryptocurrencies", "using llms", "ust", "ust stablecoin", "ust ustc", "ustc", "ustc high", "utility", "ux", "validator", "validators", "value", "vanishes", "vault", "ve", "ve ever", "ve seen", "venture", "verge", "verifiable", "verification", "verify", "version", "versus", "very", "very nice", "very soon", "vets", "vets helped", "via", "victim", "victims", "video", "vidz", "vietnam", "vietnamese", "view", "virginia", "virtual", "virus", "visa", "vision", "vitalik", "volatility", "volume", "volume dead", "volume exploding", "volume heating", "volume kicks", "voting", "vs", "vsfvprv", "vsfvprv qzhyms", "wait", "waiting", "waiting clear", "wake", "wake up", "wall", "wall street's", "wallet", "wallets", "want", "wanted", "wants", "wants orderly", "warn", "warning", "warns", "warren", "washington", "wasn't", "waste", "waste money", "watch", "watch alert", "watchdog", "watched", "watchers", "watching", "watching key", "watchlist", "wave", "way", "way back", "ways", "wayyy", "wazirx", "we're", "we're going", "weak", "weak hands", "wealth", "web", "web apps", "web js", "web security", "website", "websites", "wedge", "week", "weekend", "weekly", "weeks", "weight", "weight loss", "weirdest", "welcome", "welcome getting", "well", "went", "went live", "whale", "whale dumped", "whales", "whales accumulating", "what's", "what's happening", "whatever", "where", "white", "white paper", "whitepaper", "why", "why anyone", "why stablecoins", "wif", "wild", "willing", "win", "windows", "winklevoss", "winner", "wins", "wins sec", "winter", "wiped", "wiped out", "withdraw", "withdrawal", "withdrawals", "withdrawals customers", "within", "without", "witness", "wluna", "wluna luna", "woman", "won", "won't", "won't help", "wonder", "wont", "word", "work", "workflows", "workforce", "working", "works", "world", "worlds", "worry", "worse", "worse than", "worst", "worth", "worth back", "worth buy", "worth holding", "worthless", "wow", "wow shit", "wrapped", "written", "wrong", "wsj", "wtf", "ww", "xc", "xc da", "xian", "xlm", "xrp", "xrp all", "xrp breaking", "xrp buy", "xrp crashes", "xrp fundamentals", "xrp getting", "xrp here", "xrp looks", "xrp momentum", "xrp news", "xrp smart", "xrp volume", "ya", "ya ll", "ya trending", "ya updog", "yall", "yc", "year", "year crypto", "year old", "years", "years ago", "yep", "yes", "yet", "yield", "york", "you'll", "you're", "youtube", "yzv", "yzv skpqpump", "zcash", "zerdofr", "zerdofr ndt", "zero", "zero knowledge", "zhao", "zhao plead", "zhao sentenced", "zipmex", "zk", "zone", "zoom"], "trainedAt": "2026-06-04T17:29:40Z", "trainSize": 3984, "testSize": 155 };
  }
});

// api/_lib/ai/nlp/model-metrics.ts
var MODEL_METRICS;
var init_model_metrics = __esm({
  "api/_lib/ai/nlp/model-metrics.ts"() {
    MODEL_METRICS = { "accuracy": 0.6387, "macroF1": 0.6261, "perClass": { "positive": { "precision": 0.6875, "recall": 0.6769, "f1": 0.6822, "support": 65 }, "negative": { "precision": 0.8537, "recall": 0.614, "f1": 0.7143, "support": 57 }, "neutral": { "precision": 0.4, "recall": 0.6061, "f1": 0.4819, "support": 33 } }, "confusion": { "positive": { "positive": 44, "negative": 4, "neutral": 17 }, "negative": { "positive": 9, "negative": 35, "neutral": 13 }, "neutral": { "positive": 11, "negative": 2, "neutral": 20 } }, "testSize": 155, "errors": [{ "text": "Dead Cat Bounce \u2026 Trap for bulls \u2026 The targets are much lower Arb 0.17$ Op 0.275$ Ethereum 1600$", "trueLabel": "negative", "predicted": "positive", "confidence": 0 }, { "text": "$WIF.X Can't wait for another thrilling day of trading sideways at 19 cents. \u{1F644}", "trueLabel": "negative", "predicted": "neutral", "confidence": 0 }, { "text": "$NEAR.X Give us 10$ and Wake me up then it gets exciting $ADA.X $LTC.X $ETH.X", "trueLabel": "neutral", "predicted": "positive", "confidence": 0 }, { "text": "Mainstream payment processor enables instant crypto checkout", "trueLabel": "positive", "predicted": "neutral", "confidence": 0 }, { "text": "$AAVE.X if it goes under 100.15, you can fold up the tent", "trueLabel": "negative", "predicted": "neutral", "confidence": 0 }, { "text": "PayPal expands crypto payments to more European countries", "trueLabel": "positive", "predicted": "neutral", "confidence": 0 }, { "text": "Network upgrade smooth as butter, no incidents reported", "trueLabel": "positive", "predicted": "neutral", "confidence": 0 }, { "text": "NE1 dare to call it? I will. Barrng macro bad news, this going fly. Is simple math. See what did there? BAF LFG", "trueLabel": "positive", "predicted": "neutral", "confidence": 0 }, { "text": "$ARB.X In the last 3 months, $25.8 billion in funds flowed into Arbitrum, while the network's net profit was realized at the $2.3 billion level. $ARB.X $ETH.X $HOOD $XRP.X", "trueLabel": "neutral", "predicted": "positive", "confidence": 0 }, { "text": "DePIN not just hype. Real networks, real usage. $HNT.X $RNDR $FIL.X led. $ROAM.X building in mobility + connectivity.", "trueLabel": "positive", "predicted": "neutral", "confidence": 0 }, { "text": "Crypto education startup raises $50M, mission gaining traction", "trueLabel": "positive", "predicted": "neutral", "confidence": 0 }, { "text": "$ATOM.X charting says 3-4 weeks away from 4.00 $ALGO.X $XRP.X $FIL.X $JASMY.X", "trueLabel": "neutral", "predicted": "positive", "confidence": 0 }, { "text": "$SOL.X your stake rewards get eaten by price drops.", "trueLabel": "negative", "predicted": "neutral", "confidence": 0 }, { "text": "$OP.X is cooked, Base $COIN is moving away from the optimism stack to build proprietary software. $ARB.X looks like the better L2 right now", "trueLabel": "negative", "predicted": "positive", "confidence": 0 }, { "text": "Bitcoin mining now uses 50 percent renewable energy industry says", "trueLabel": "positive", "predicted": "neutral", "confidence": 0 }, { "text": "$LTC.X whales where you waiting for me to finally add", "trueLabel": "neutral", "predicted": "positive", "confidence": 0 }, { "text": "Mining hashrate breaks all-time high signaling network strength", "trueLabel": "positive", "predicted": "neutral", "confidence": 0 }, { "text": "Hopes for ETF approval dashed by SEC last minute rejection", "trueLabel": "negative", "predicted": "positive", "confidence": 0 }, { "text": "Bitcoin price prediction model says continued upside through Q4", "trueLabel": "positive", "predicted": "neutral", "confidence": 0 }, { "text": "Retail interest revives as Google searches for Bitcoin double", "trueLabel": "positive", "predicted": "neutral", "confidence": 0 }, { "text": "$OP.X When the volume wick supersedes the price wick you know there\u2019s a big move coming \u2764\uFE0F\u2764\uFE0F\u2764\uFE0F $SUI.X $ETH.X", "trueLabel": "neutral", "predicted": "positive", "confidence": 0 }, { "text": "$NEAR.X back at it, down 8% again on 1.6x vol after barely holding 2.30 yesterday. it keeps tagging these highs and rejecting the retest, third time now. either it bases here or 2.20 prints. who's still defending this?", "trueLabel": "negative", "predicted": "positive", "confidence": 0 }, { "text": "$ONDO.X $NEAR.X At approach of it\u2019s first support \u{1F3AF}", "trueLabel": "neutral", "predicted": "positive", "confidence": 0 }, { "text": "$PEPE.X Me talking shiz to my lady bc i bought every dip. Gotta go deepa", "trueLabel": "positive", "predicted": "neutral", "confidence": 0 }, { "text": "$XLM.X $XRP.X Yup. XRP needs to trade below its 200MA to gain real support for a reversal XLM was able to get below its 200MA first, only reason for the green candle", "trueLabel": "neutral", "predicted": "positive", "confidence": 0 }], "vocabSize": 4454, "trainSize": 3984, "trainedAt": "2026-06-04T17:29:40Z", "algorithm": "logistic-regression", "smoothingAlpha": 0, "comparedModels": [{ "name": "multinomial-naive-bayes", "macroF1": 0.5876, "accuracy": 0.6194, "cvF1": 0.8019 }, { "name": "complement-naive-bayes", "macroF1": 0.5807, "accuracy": 0.6129, "cvF1": 0.8132 }, { "name": "logistic-regression", "macroF1": 0.6261, "accuracy": 0.6387, "cvF1": 0.8689 }, { "name": "linear-svc", "macroF1": 0.5769, "accuracy": 0.5871, "cvF1": 0.8864 }] };
  }
});

// api/_lib/ai/nlp/training/dataset.ts
var init_dataset = __esm({
  "api/_lib/ai/nlp/training/dataset.ts"() {
  }
});

// api/_lib/ai/nlp/training/trainer.ts
function preprocess(text) {
  if (!text) return [];
  const cleaned = text.toLowerCase().replace(/https?:\/\/\S+/g, " ").replace(/[*_`>#~]/g, " ");
  const matched = cleaned.match(/[a-z']+|\$[a-z]{2,8}/g) || [];
  const unigrams = matched.filter((t) => t.length >= 2 && t.length <= 20 && !STOPWORDS.has(t));
  const tokens = unigrams.slice();
  for (let i = 0; i < unigrams.length - 1; i++) tokens.push(unigrams[i] + " " + unigrams[i + 1]);
  return tokens;
}
function predict(model, text) {
  const tokens = preprocess(text);
  const logScore = {
    positive: model.logPrior.positive,
    negative: model.logPrior.negative,
    neutral: model.logPrior.neutral
  };
  const featureContribs = [];
  for (const t of tokens) {
    const row = model.logLikelihood[t];
    const contrib = {
      positive: row?.positive ?? model.oovLogLikelihood.positive,
      negative: row?.negative ?? model.oovLogLikelihood.negative,
      neutral: row?.neutral ?? model.oovLogLikelihood.neutral
    };
    logScore.positive += contrib.positive;
    logScore.negative += contrib.negative;
    logScore.neutral += contrib.neutral;
    if (row) featureContribs.push({ token: t, contributions: contrib });
  }
  const maxLog = Math.max(logScore.positive, logScore.negative, logScore.neutral);
  const expScores = {
    positive: Math.exp(logScore.positive - maxLog),
    negative: Math.exp(logScore.negative - maxLog),
    neutral: Math.exp(logScore.neutral - maxLog)
  };
  const Z = expScores.positive + expScores.negative + expScores.neutral;
  const perClassProb = {
    positive: expScores.positive / Z,
    negative: expScores.negative / Z,
    neutral: expScores.neutral / Z
  };
  const label = Object.keys(perClassProb).reduce((a, b) => perClassProb[a] >= perClassProb[b] ? a : b);
  const confidence = perClassProb[label];
  const topFeatures = featureContribs.map((f) => ({
    token: f.token,
    contributions: {
      positive: Number(f.contributions.positive.toFixed(3)),
      negative: Number(f.contributions.negative.toFixed(3)),
      neutral: Number(f.contributions.neutral.toFixed(3))
    },
    // Boost the winning class score for ranking purposes.
    _score: f.contributions[label] - (label === "positive" ? Math.max(f.contributions.negative, f.contributions.neutral) : label === "negative" ? Math.max(f.contributions.positive, f.contributions.neutral) : Math.max(f.contributions.positive, f.contributions.negative))
  })).sort((a, b) => b._score - a._score).slice(0, 8).map(({ token, contributions }) => ({ token, contributions }));
  return {
    label,
    perClassLogProb: {
      positive: Number(logScore.positive.toFixed(4)),
      negative: Number(logScore.negative.toFixed(4)),
      neutral: Number(logScore.neutral.toFixed(4))
    },
    perClassProb: {
      positive: Number(perClassProb.positive.toFixed(4)),
      negative: Number(perClassProb.negative.toFixed(4)),
      neutral: Number(perClassProb.neutral.toFixed(4))
    },
    confidence: Number(confidence.toFixed(4)),
    matchedFeatures: topFeatures
  };
}
var STOPWORDS;
var init_trainer = __esm({
  "api/_lib/ai/nlp/training/trainer.ts"() {
    init_dataset();
    STOPWORDS = /* @__PURE__ */ new Set([
      "the",
      "a",
      "an",
      "is",
      "are",
      "was",
      "were",
      "be",
      "been",
      "being",
      "have",
      "has",
      "had",
      "do",
      "does",
      "did",
      "will",
      "would",
      "shall",
      "should",
      "can",
      "could",
      "may",
      "might",
      "must",
      "and",
      "or",
      "but",
      "if",
      "then",
      "else",
      "when",
      "while",
      "as",
      "of",
      "in",
      "on",
      "at",
      "to",
      "for",
      "from",
      "by",
      "with",
      "about",
      "against",
      "between",
      "into",
      "through",
      "during",
      "before",
      "after",
      "above",
      "below",
      "this",
      "that",
      "these",
      "those",
      "i",
      "you",
      "he",
      "she",
      "it",
      "we",
      "they",
      "them",
      "their",
      "my",
      "your",
      "his",
      "her",
      "its",
      "our",
      "us",
      "me",
      "him",
      "who",
      "what",
      "which",
      "whom",
      "whose"
    ]);
  }
});

// api/_lib/ai/nlp/classifier.ts
function classify2(text) {
  const p = predict(MODEL, text);
  return {
    label: p.label,
    confidence: p.confidence,
    compound: Number((p.perClassProb.positive - p.perClassProb.negative).toFixed(4)),
    perClassProb: p.perClassProb,
    perClassLogProb: p.perClassLogProb,
    matchedFeatures: p.matchedFeatures
  };
}
function classifyCorpus(docs) {
  if (docs.length === 0) {
    return {
      docCount: 0,
      matchedDocCount: 0,
      weightedCompound: 0,
      perClassShare: { positive: 0, negative: 0, neutral: 1 },
      label: "neutral",
      perDoc: []
    };
  }
  const perDoc = docs.map((d) => classify2(d.text));
  const matched = perDoc.filter((d) => d.matchedFeatures.length > 0);
  const wSum = docs.reduce((s, d, i) => s + (matched.includes(perDoc[i]) ? Math.max(1, d.weight ?? 1) : 0), 0) || 1;
  const weightedCompound = docs.reduce(
    (s, d, i) => matched.includes(perDoc[i]) ? s + perDoc[i].compound * Math.max(1, d.weight ?? 1) : s,
    0
  ) / wSum;
  const counts = { positive: 0, negative: 0, neutral: 0 };
  for (const d of matched.length ? matched : perDoc) counts[d.label]++;
  const total = matched.length || perDoc.length;
  const perClassShare = {
    positive: Number((counts.positive / total).toFixed(3)),
    negative: Number((counts.negative / total).toFixed(3)),
    neutral: Number((counts.neutral / total).toFixed(3))
  };
  const label = Object.keys(counts).reduce((a, b) => counts[a] >= counts[b] ? a : b);
  return {
    docCount: docs.length,
    matchedDocCount: matched.length,
    weightedCompound: Number(weightedCompound.toFixed(4)),
    perClassShare,
    label,
    perDoc
  };
}
function getModelInfo() {
  return {
    algorithm: MODEL.algorithm,
    version: MODEL.version,
    smoothingAlpha: MODEL.smoothingAlpha,
    classes: MODEL.classes,
    vocabSize: MODEL.vocabulary.length,
    trainSize: MODEL.trainSize,
    testSize: MODEL.testSize,
    trainedAt: MODEL.trainedAt,
    classDistribution: MODEL.classDocCount,
    metrics: MODEL_METRICS
  };
}
var init_classifier = __esm({
  "api/_lib/ai/nlp/classifier.ts"() {
    init_model();
    init_model_metrics();
    init_trainer();
  }
});

// api/_lib/ai/pipeline.ts
function compositeSignal(compound, confidence) {
  if (confidence < 0.3) return "NEUTRAL";
  if (compound >= 0.5) return "STRONG_BUY";
  if (compound >= 0.15) return "BUY";
  if (compound <= -0.5) return "STRONG_SELL";
  if (compound <= -0.15) return "SELL";
  return "HOLD";
}
function buildApplication(composite, spike, signal) {
  const fraudTriggered = composite < -0.4 || spike && composite < 0;
  const fraudRule = {
    label: "Sentiment-contradiction & FOMO-spike rule",
    triggered: fraudTriggered,
    rationale: fraudTriggered ? "Buy intent contradicts bearish sentiment OR mention spike suggests retail FOMO. Require confirmation." : "No sentiment-driven anomaly detected on this transaction context."
  };
  const tiltPct = Math.round(composite * 25);
  const advisorTilt = {
    label: "Sentiment-weighted allocation tilt",
    tiltPct,
    rationale: signal === "STRONG_BUY" ? `Tilt target weight up ${tiltPct}% \u2014 strong real-time social signal.` : signal === "STRONG_SELL" ? `Tilt target weight down ${Math.abs(tiltPct)}% \u2014 capitulation detected, reduce exposure.` : "Hold base allocation \u2014 no actionable tilt."
  };
  return { fraudRule, advisorTilt };
}
async function runAltDataPipeline(symbol) {
  const base = symbol.replace(/USDT$|USD$/i, "").toUpperCase();
  const startedAt3 = Date.now();
  const stages = [];
  const t1a = Date.now();
  const reddit = await collectCorpusForSymbol(symbol).catch((e) => ({
    posts: [],
    sources: [],
    errors: [e.message]
  }));
  stages.push({
    name: "collect.reddit",
    status: reddit.posts.length > 0 ? "ok" : reddit.errors.length === 0 ? "partial" : "failed",
    message: reddit.posts.length > 0 ? `${reddit.posts.length} posts from ${reddit.sources.length} subreddits` : `Reddit blocked (${reddit.errors[0] || "no data"}). News API used instead.`,
    latencyMs: Date.now() - t1a
  });
  const t1aPrime = Date.now();
  let news = await collectStockTwits(symbol).catch((e) => ({
    posts: [],
    sources: [],
    errors: [e.message]
  }));
  let socialSrc = "StockTwits";
  if (news.posts.length === 0) {
    const hn = await collectHnForSymbol(symbol).catch((e) => ({
      posts: [],
      sources: [],
      errors: [e.message]
    }));
    if (hn.posts.length > 0) {
      news = hn;
      socialSrc = "Hacker News (fallback)";
    } else {
      news = { posts: [], sources: [...news.sources, ...hn.sources], errors: [...news.errors, ...hn.errors] };
      socialSrc = "StockTwits + HN";
    }
  }
  stages.push({
    name: "collect.social",
    status: news.posts.length > 0 ? "ok" : news.errors.length === 0 ? "partial" : "failed",
    message: `${news.posts.length} posts from ${socialSrc}` + (news.errors.length ? ` (errors: ${news.errors.length})` : ""),
    latencyMs: Date.now() - t1aPrime
  });
  const t1b = Date.now();
  const fg = await fetchFearGreedReal();
  const fgMsg = fg.ok ? `value=${fg.current.value} (${fg.current.classification})` : "error" in fg ? fg.error : "fail";
  stages.push({
    name: "collect.fearGreed",
    status: fg.ok ? "ok" : "failed",
    message: fgMsg,
    latencyMs: Date.now() - t1b
  });
  const t1c = Date.now();
  const cg = await fetchCoinGecko(symbol);
  const cgMsg = cg.ok ? `vote\u2191 ${cg.voteUpPct.toFixed(1)}% | community ${cg.communityScore.toFixed(1)}` : "error" in cg ? cg.error : "fail";
  stages.push({
    name: "collect.coinGecko",
    status: cg.ok ? "ok" : "failed",
    message: cgMsg,
    latencyMs: Date.now() - t1c
  });
  const t1d = Date.now();
  const allNews = await fetchLatestNews(50).catch(() => []);
  const newsCutoffSec = Date.now() / 1e3 - 365 * 24 * 3600;
  const coinNews = allNews.filter(
    (h) => (h.tag === base || h.tag === "MACRO") && (!h.publishedAt || h.publishedAt >= newsCutoffSec)
  );
  stages.push({
    name: "collect.news",
    status: coinNews.length > 0 ? "ok" : "partial",
    message: `${coinNews.length} headlines (of ${allNews.length}) for ${base} + MACRO`,
    latencyMs: Date.now() - t1d
  });
  const t2a = Date.now();
  const RECENCY_HALF_LIFE_DAYS = 180;
  const nowSec = Date.now() / 1e3;
  const freshCutoff = nowSec - 365 * 24 * 3600;
  reddit.posts = reddit.posts.filter((p) => p.createdUtc >= freshCutoff);
  news.posts = news.posts.filter((n) => n.createdUtc >= freshCutoff);
  const recencyDecay = (createdUtcSec) => Math.pow(0.5, Math.max(0, (nowSec - createdUtcSec) / 86400) / RECENCY_HALF_LIFE_DAYS);
  const recencyOf = (ageMin) => Math.pow(0.5, Math.max(0, ageMin / 1440) / RECENCY_HALF_LIFE_DAYS);
  const docs = [
    ...reddit.posts.map((p) => ({
      kind: "reddit",
      src: p,
      text: `${p.title}
${p.selftext.slice(0, 300)}`,
      weight: Math.max(1, p.ups * recencyDecay(p.createdUtc))
    })),
    ...news.posts.map((n) => ({
      kind: "news",
      src: n,
      text: n.title,
      weight: Math.max(1, (n.points + 1) * recencyDecay(n.createdUtc))
    }))
  ];
  const corpus = aggregateCorpus(docs.map((d) => ({ text: d.text, weight: d.weight })));
  const perPost = docs.map((d, idx) => {
    const ds = corpus.perDoc[idx]?.sentiment ?? analyzeText(d.text);
    if (d.kind === "reddit") {
      const p = d.src;
      return {
        id: `r:${p.id}`,
        title: p.title,
        subreddit: `r/${p.subreddit}`,
        ups: p.ups,
        numComments: p.numComments,
        ageMin: Math.round((Date.now() / 1e3 - p.createdUtc) / 60),
        url: p.url,
        compound: ds.compound,
        label: ds.label,
        matchedTerms: ds.matchedTerms
      };
    }
    const n = d.src;
    return {
      id: `n:${n.id}`,
      title: n.title,
      subreddit: `${n.platform ?? "HN"}/${n.author}`,
      ups: n.points,
      numComments: n.numComments,
      ageMin: Math.round((Date.now() / 1e3 - n.createdUtc) / 60),
      url: n.hnUrl,
      compound: ds.compound,
      label: ds.label,
      matchedTerms: ds.matchedTerms
    };
  });
  const topPositive = perPost.filter((p) => p.matchedTerms.length > 0 && p.compound > 0.05).sort((a, b) => b.compound * Math.log10(b.ups + 2) * recencyOf(b.ageMin) - a.compound * Math.log10(a.ups + 2) * recencyOf(a.ageMin)).slice(0, 5);
  const topNegative = perPost.filter((p) => p.matchedTerms.length > 0 && p.compound < -0.05).sort((a, b) => a.compound * Math.log10(a.ups + 2) * recencyOf(a.ageMin) - b.compound * Math.log10(b.ups + 2) * recencyOf(b.ageMin)).slice(0, 5);
  stages.push({
    name: "analyse.nlp.vader",
    status: corpus.corpus.matchedDocCount > 0 ? "ok" : "partial",
    message: `VADER (lexicon) matched ${corpus.corpus.matchedDocCount}/${corpus.corpus.docCount}, weighted=${corpus.corpus.weightedCompound}`,
    latencyMs: Date.now() - t2a
  });
  const t2aPrime = Date.now();
  const nbCorpus = classifyCorpus(docs.map((d) => ({ text: d.text, weight: d.weight })));
  const nbPerDoc = nbCorpus.perDoc;
  const vaderLabels = corpus.perDoc.map((d) => d.sentiment.compound >= 0.05 ? "positive" : d.sentiment.compound <= -0.05 ? "negative" : "neutral");
  let agreed = 0, comparable = 0;
  for (let i = 0; i < Math.min(vaderLabels.length, nbPerDoc.length); i++) {
    if (corpus.perDoc[i]?.sentiment.matchedTerms.length || nbPerDoc[i]?.matchedFeatures.length) {
      comparable++;
      if (vaderLabels[i] === nbPerDoc[i].label) agreed++;
    }
  }
  const agreement = comparable > 0 ? agreed / comparable : 0;
  const nbTopPositive = docs.map((d, i) => ({ d, nb: nbPerDoc[i], idx: i })).filter((x) => x.nb.label === "positive" && x.nb.matchedFeatures.length > 0).sort((a, b) => b.nb.confidence * Math.log10(a.d.weight + 2) - a.nb.confidence * Math.log10(b.d.weight + 2)).slice(0, 5).map((x) => {
    const post = perPost[x.idx];
    return {
      id: post.id,
      title: post.title,
      subreddit: post.subreddit,
      ups: post.ups,
      numComments: post.numComments,
      ageMin: post.ageMin,
      url: post.url,
      compound: x.nb.compound,
      confidence: x.nb.confidence,
      topFeatures: x.nb.matchedFeatures.slice(0, 5).map((f) => ({
        token: f.token,
        positiveLogProb: f.contributions.positive,
        negativeLogProb: f.contributions.negative
      }))
    };
  });
  const nbTopNegative = docs.map((d, i) => ({ d, nb: nbPerDoc[i], idx: i })).filter((x) => x.nb.label === "negative" && x.nb.matchedFeatures.length > 0).sort((a, b) => b.nb.confidence * Math.log10(b.d.weight + 2) - a.nb.confidence * Math.log10(a.d.weight + 2)).slice(0, 5).map((x) => {
    const post = perPost[x.idx];
    return {
      id: post.id,
      title: post.title,
      subreddit: post.subreddit,
      ups: post.ups,
      numComments: post.numComments,
      ageMin: post.ageMin,
      url: post.url,
      compound: x.nb.compound,
      confidence: x.nb.confidence,
      topFeatures: x.nb.matchedFeatures.slice(0, 5).map((f) => ({
        token: f.token,
        positiveLogProb: f.contributions.positive,
        negativeLogProb: f.contributions.negative
      }))
    };
  });
  stages.push({
    name: "analyse.nlp.naiveBayes",
    status: nbCorpus.matchedDocCount > 0 ? "ok" : "partial",
    message: `NB classifier weighted=${nbCorpus.weightedCompound} (matched ${nbCorpus.matchedDocCount}/${nbCorpus.docCount}, agree-w-VADER ${(agreement * 100).toFixed(0)}%)`,
    latencyMs: Date.now() - t2aPrime
  });
  const t2b = Date.now();
  const mentions = reddit.posts.length + news.posts.length;
  const zs = await recordAndScore(base, mentions, Date.now());
  const spike = zs.spike;
  stages.push({
    name: "analyse.anomaly",
    status: "ok",
    message: `z=${zs.z} (history n=${zs.n}, \u03BC=${zs.mean}, \u03C3=${zs.std}) \u2192 ${spike ? "SPIKE" : "normal"}`,
    latencyMs: Date.now() - t2b
  });
  const t2bPrime = Date.now();
  const newsDocs = coinNews.map((h) => ({ text: h.title, weight: 1 }));
  const newsVader = aggregateCorpus(newsDocs);
  const newsNb = classifyCorpus(newsDocs);
  const newsHasSignal = newsVader.corpus.matchedDocCount + newsNb.matchedDocCount > 0;
  const topHeadlines = coinNews.map((h, i) => ({
    title: h.title,
    source: h.source,
    url: h.url,
    ageMin: h.publishedAt ? Math.round((Date.now() / 1e3 - h.publishedAt) / 60) : 0,
    compound: newsVader.perDoc[i]?.sentiment.compound ?? 0
  })).filter((h) => Math.abs(h.compound) > 0.05).sort((a, b) => Math.abs(b.compound) - Math.abs(a.compound)).slice(0, 6);
  stages.push({
    name: "analyse.newsTone",
    status: newsHasSignal ? "ok" : "partial",
    message: `news VADER=${newsVader.corpus.weightedCompound} NB=${newsNb.weightedCompound} (matched ${Math.max(newsVader.corpus.matchedDocCount, newsNb.matchedDocCount)}/${coinNews.length})`,
    latencyMs: Date.now() - t2bPrime
  });
  const t2c = Date.now();
  const wVader = 0.4, wNB = 0.6;
  const socialAlive = corpus.corpus.matchedDocCount + nbCorpus.matchedDocCount > 0;
  const socialTextScore = socialAlive ? corpus.corpus.weightedCompound * wVader + nbCorpus.weightedCompound * wNB : 0;
  const newsTone = newsHasSignal ? Number((newsVader.corpus.weightedCompound * wVader + newsNb.weightedCompound * wNB).toFixed(4)) : 0;
  let wSocial = socialAlive ? 0.3 : 0;
  let wNews = newsHasSignal ? 0.2 : 0;
  let wCg = cg.ok ? 0.25 : 0;
  let wFg = fg.ok ? 0.25 : 0;
  const wTotal = wSocial + wNews + wCg + wFg || 1;
  wSocial /= wTotal;
  wNews /= wTotal;
  wCg /= wTotal;
  wFg /= wTotal;
  const cgScore = cg.ok ? (cg.voteUpPct - cg.voteDownPct) / 100 : 0;
  const fgScore = fg.ok ? (fg.current.value - 50) / 50 : 0;
  const composite = Number(
    (socialTextScore * wSocial + newsTone * wNews + cgScore * wCg + fgScore * wFg).toFixed(4)
  );
  const composite0to100 = Math.round((composite + 1) * 50);
  const confidence = Math.min(
    0.97,
    0.3 + (corpus.corpus.matchedDocCount > 0 ? 0.2 : 0) + (newsHasSignal ? 0.1 : 0) + (cg.ok ? 0.2 : 0) + (fg.ok ? 0.12 : 0) + (Math.abs(composite) > 0.4 ? 0.08 : 0)
  );
  const signal = compositeSignal(composite, confidence);
  const label = composite >= 0.5 ? "Euphoric" : composite >= 0.05 ? "Bullish" : composite > -0.05 ? "Neutral" : composite > -0.5 ? "Bearish" : "Capitulation";
  stages.push({
    name: "analyse.fusion",
    status: "ok",
    message: `composite=${composite} (signal=${signal}, conf=${(confidence * 100).toFixed(0)}%, VADER:NB blend ${wVader}:${wNB})`,
    latencyMs: Date.now() - t2c
  });
  const application = buildApplication(composite, spike, signal);
  const ML_ALGO_NAMES = {
    "linear-svc": "Linear SVM (trained from scratch)",
    "logistic-regression": "Logistic Regression (trained from scratch)",
    "multinomial-naive-bayes": "Multinomial Naive Bayes (trained from scratch)",
    "complement-naive-bayes": "Complement Naive Bayes (trained from scratch)"
  };
  const mlTechnique = ML_ALGO_NAMES[MODEL_METRICS.algorithm] || `${MODEL_METRICS.algorithm} (trained from scratch)`;
  return {
    symbol,
    base,
    sources: {
      reddit: reddit.sources,
      news: news.sources,
      coinGecko: cg.ok ? `coingecko.com/coins/${cg.coinId}` : null,
      fearGreed: fg.ok ? "alternative.me/fng" : null
    },
    collected: {
      redditPosts: reddit.posts.length,
      newsPosts: news.posts.length,
      totalDocs: reddit.posts.length + news.posts.length,
      coinGeckoOk: cg.ok,
      fearGreedOk: fg.ok
    },
    nlp: {
      technique: "VADER-style lexicon analyzer",
      docCount: corpus.corpus.docCount,
      matchedDocCount: corpus.corpus.matchedDocCount,
      weightedCompound: corpus.corpus.weightedCompound,
      posShare: corpus.corpus.posShare,
      negShare: corpus.corpus.negShare,
      neuShare: corpus.corpus.neuShare,
      topPositive,
      topNegative
    },
    mlClassifier: {
      technique: mlTechnique,
      modelTrainedAt: MODEL_METRICS.trainedAt,
      modelAccuracy: MODEL_METRICS.accuracy,
      modelMacroF1: MODEL_METRICS.macroF1,
      docCount: nbCorpus.docCount,
      matchedDocCount: nbCorpus.matchedDocCount,
      weightedCompound: nbCorpus.weightedCompound,
      perClassShare: {
        positive: nbCorpus.perClassShare.positive,
        negative: nbCorpus.perClassShare.negative,
        neutral: nbCorpus.perClassShare.neutral
      },
      label: nbCorpus.label,
      topPositive: nbTopPositive,
      topNegative: nbTopNegative,
      agreementWithVader: Number(agreement.toFixed(3))
    },
    anomaly: {
      technique: "Z-score on mention volume",
      currentMentions: mentions,
      zScore: zs.z,
      baselineMean: zs.mean,
      baselineStd: zs.std,
      historyN: zs.n,
      spike
    },
    newsTone: {
      technique: `VADER + ${MODEL_METRICS.algorithm} on RSS headlines`,
      headlineCount: coinNews.length,
      matchedCount: Math.max(newsVader.corpus.matchedDocCount, newsNb.matchedDocCount),
      tone: newsTone,
      label: newsTone >= 0.5 ? "Euphoric" : newsTone >= 0.05 ? "Bullish" : newsTone > -0.05 ? "Neutral" : newsTone > -0.5 ? "Bearish" : "Capitulation",
      topHeadlines
    },
    fusion: {
      vaderWeight: wVader,
      naiveBayesWeight: wNB,
      redditWeight: Number(wSocial.toFixed(2)),
      newsWeight: Number(wNews.toFixed(2)),
      coinGeckoWeight: Number(wCg.toFixed(2)),
      fearGreedWeight: Number(wFg.toFixed(2)),
      compositeScore: composite,
      composite0to100,
      label,
      confidence: Number(confidence.toFixed(3)),
      signal
    },
    application,
    raw: {
      fearGreed: fg.ok ? fg : null,
      coinGecko: cg.ok ? cg : null
    },
    stages,
    generatedAt: (/* @__PURE__ */ new Date()).toISOString(),
    totalLatencyMs: Date.now() - startedAt3
  };
}
async function getRealSentimentScore(symbol) {
  const key = symbol.toUpperCase();
  const now = Date.now();
  const hit = sentimentCache.get(key);
  if (hit && now - hit.ts < SENTIMENT_CACHE_TTL_MS) return hit.p;
  const p = runAltDataPipeline(symbol).then((r) => ({
    score: r.fusion.compositeScore,
    label: r.fusion.label,
    spike: r.anomaly.spike
  }));
  sentimentCache.set(key, { p, ts: now });
  p.catch(() => {
    if (sentimentCache.get(key)?.p === p) sentimentCache.delete(key);
  });
  return p;
}
var SENTIMENT_CACHE_TTL_MS, sentimentCache;
var init_pipeline = __esm({
  "api/_lib/ai/pipeline.ts"() {
    init_reddit();
    init_hackerNews();
    init_stocktwits();
    init_mentionHistory();
    init_fearGreed();
    init_coingecko();
    init_cryptoNewsRss();
    init_vader();
    init_classifier();
    SENTIMENT_CACHE_TTL_MS = 10 * 60 * 1e3;
    sentimentCache = /* @__PURE__ */ new Map();
  }
});

// api/_lib/ai/fraud.ts
function checkFraud(accountId, tx, snapshot) {
  const acc = snapshot ?? getAccount(accountId);
  const reasons = [];
  let risk = 0;
  const txTotal = Math.abs(tx.total ?? (tx.amount ?? 0) * (tx.price ?? 0));
  const lastMinute = acc.transactions.filter((t) => Date.now() - t.timestamp < 6e4);
  if (lastMinute.length > 5) {
    risk += 0.3;
    reasons.push(`High velocity: ${lastMinute.length} trades within the last minute.`);
  }
  const buys = acc.transactions.filter((t) => t.type === "BUY");
  const avg = buys.length ? buys.reduce((s, t) => s + Math.abs(t.total), 0) / buys.length : 0;
  if (avg > 0 && txTotal > avg * 5) {
    risk += 0.25;
    reasons.push(`Order size ${txTotal.toFixed(0)} USD is >5x the user's historical average.`);
  }
  if (txTotal > acc.cashUsd * 0.3) {
    risk += 0.2;
    reasons.push("Trade consumes >30% of available cash \u2014 concentration risk.");
  }
  const hour = new Date(tx.timestamp ?? Date.now()).getUTCHours();
  if (hour >= 19 && hour <= 22) {
    risk += 0.05;
    reasons.push("Off-hours trade (2\u20135am Vietnam time) \u2014 mild account-takeover signal.");
  }
  risk = Math.min(1, Number(risk.toFixed(3)));
  const verdict = risk > 0.7 ? "BLOCK" : risk > 0.4 ? "REVIEW" : "SAFE";
  const recommendedAction = verdict === "BLOCK" ? "Hold transaction. Trigger step-up authentication or manual review." : verdict === "REVIEW" ? "Show user a confirmation dialog and require explicit consent." : "Auto-approve transaction.";
  return { riskScore: risk, verdict, reasons, recommendedAction };
}
async function checkFraudWithRealAltData(accountId, tx, snapshot) {
  const base = checkFraud(accountId, tx, snapshot);
  if (!tx.asset) {
    return { ...base, altData: { compositeScore: 0, label: "Neutral", spike: false } };
  }
  try {
    const alt = await getRealSentimentScore(tx.asset);
    let risk = base.riskScore;
    const reasons = [...base.reasons];
    if (tx.type === "BUY" && alt.score < -0.4) {
      risk = Math.min(1, risk + 0.12);
      reasons.push(
        `REAL alt-data: buying ${tx.asset} while VADER+CoinGecko composite is ${alt.label} (${alt.score.toFixed(2)}).`
      );
    }
    if (tx.type === "BUY" && alt.spike) {
      risk = Math.min(1, risk + 0.1);
      reasons.push(`REAL alt-data: Reddit mention spike detected (z>1.5\u03C3) \u2014 possible retail FOMO.`);
    }
    const verdict = risk > 0.7 ? "BLOCK" : risk > 0.4 ? "REVIEW" : "SAFE";
    const recommendedAction = verdict === "BLOCK" ? "Hold transaction. Trigger step-up authentication or manual review." : verdict === "REVIEW" ? "Show user a confirmation dialog and require explicit consent." : "Auto-approve transaction.";
    return {
      riskScore: Number(risk.toFixed(3)),
      verdict,
      reasons,
      recommendedAction,
      altData: { compositeScore: alt.score, label: alt.label, spike: alt.spike }
    };
  } catch {
    return { ...base, altData: { compositeScore: 0, label: "Neutral", spike: false } };
  }
}
var init_fraud = __esm({
  "api/_lib/ai/fraud.ts"() {
    init_state();
    init_pipeline();
  }
});

// api/_lib/ai/advisor.ts
function withTimeout2(p, ms) {
  return new Promise((resolve2) => {
    const t = setTimeout(() => resolve2(null), ms);
    p.then((v) => {
      clearTimeout(t);
      resolve2(v);
    }).catch(() => {
      clearTimeout(t);
      resolve2(null);
    });
  });
}
async function fetchTickers(symbols) {
  const map = /* @__PURE__ */ new Map();
  if (!symbols.length) return map;
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 4500);
    const param = encodeURIComponent(JSON.stringify(symbols));
    const res = await fetch(`${BINANCE2}/ticker/24hr?symbols=${param}`, { signal: ctrl.signal });
    clearTimeout(timer);
    if (!res.ok) throw new Error(`http ${res.status}`);
    const arr = await res.json();
    for (const d of arr) {
      map.set(d.symbol, { price: Number(d.lastPrice), change24h: Number(d.priceChangePercent) });
    }
  } catch {
  }
  return map;
}
async function buildAdvisor(accountId, profile = "BALANCED") {
  const acc = getAccount(accountId);
  const [fg, cg] = await Promise.all([getFearGreed(), loadCoinGecko()]);
  const universeSymbols = UNIVERSE.map((u) => u.symbol);
  const heldSymbols = acc.positions.map((p) => p.symbol);
  const tickers = await fetchTickers(Array.from(/* @__PURE__ */ new Set([...universeSymbols, ...heldSymbols])));
  const ALT_TIMEOUT_MS = 8e3;
  const composites = await Promise.all(
    UNIVERSE.map((u) => withTimeout2(getRealSentimentScore(u.symbol), ALT_TIMEOUT_MS))
  );
  const compBySymbol = /* @__PURE__ */ new Map();
  UNIVERSE.forEach((u, i) => {
    const c = composites[i];
    if (c && Number.isFinite(c.score)) compBySymbol.set(u.symbol, c.score);
  });
  const modelUsed = compBySymbol.size > 0;
  const cgOk = cg.size > 0;
  const pxOk = tickers.size > 0;
  const fgReal = fg.source === "alternative.me";
  const raw2 = UNIVERSE.map((u) => {
    const snap = cg.get(u.symbol);
    const tk = tickers.get(u.symbol);
    const cgSentiment = snap ? snap.sentiment : 0;
    const composite = compBySymbol.get(u.symbol);
    const usingModel = composite !== void 0;
    const aiSent = usingModel ? composite : cgSentiment;
    const change24h = tk ? tk.change24h : 0;
    const momentum = Math.max(-1, Math.min(1, change24h / 20));
    const tilt = usingModel ? aiSent * 0.45 + momentum * 0.15 : aiSent * 0.35 + momentum * 0.15 + (fg.value > 60 ? -0.05 : fg.value < 40 ? 0.07 : 0);
    const base = u.defaultWeight[profile];
    const adjusted = Math.max(0, base * (1 + tilt));
    const sentTxt = usingModel ? `AI sentiment ${(aiSent * 100).toFixed(0)}/100 (VADER+NB on social/news)` : snap ? `CoinGecko sentiment ${(cgSentiment * 100).toFixed(0)}/100` : "sentiment n/a";
    const momTxt = tk ? `24h ${change24h >= 0 ? "+" : ""}${change24h.toFixed(1)}%` : "momentum n/a";
    const rationale = tilt > 0.05 ? `Overweight \u2014 ${sentTxt}, ${momTxt}.` : tilt < -0.05 ? `Underweight \u2014 ${sentTxt}, ${momTxt}.` : `Base weight \u2014 neutral signals (${sentTxt}, ${momTxt}).`;
    return { symbol: u.symbol, weight: adjusted, rationale };
  });
  const sum = raw2.reduce((s, r) => s + r.weight, 0) || 1;
  const cashBuffer = CASH_BUFFER[profile];
  const investable = 1 - cashBuffer;
  const targetAllocation = raw2.map((r) => ({
    symbol: r.symbol,
    weight: Number((r.weight / sum * investable).toFixed(4)),
    rationale: r.rationale
  })).filter((r) => r.weight > 0.01);
  const currentValueBySymbol = {};
  let netWorth = acc.cashUsd;
  for (const p of acc.positions) {
    const px = tickers.get(p.symbol)?.price ?? 0;
    const v = p.amount * px;
    currentValueBySymbol[p.symbol] = v;
    netWorth += v;
  }
  const actions = targetAllocation.slice(0, 5).map((t) => {
    const targetUsd = t.weight * netWorth;
    const currentUsd = currentValueBySymbol[t.symbol] || 0;
    const delta = targetUsd - currentUsd;
    if (Math.abs(delta) < 50) return `${t.symbol}: hold (within band)`;
    return delta > 0 ? `${t.symbol}: BUY +$${delta.toFixed(0)} to reach target weight ${(t.weight * 100).toFixed(1)}%` : `${t.symbol}: SELL -$${Math.abs(delta).toFixed(0)} to trim`;
  });
  const sources = {
    sentiment: modelUsed ? "ai-pipeline" : cgOk ? "coingecko" : "unavailable",
    momentum: pxOk ? "binance" : "unavailable",
    fearGreed: fgReal ? "alternative.me" : "synthetic",
    prices: pxOk ? "binance" : "unavailable"
  };
  const degraded = !modelUsed && !cgOk || !pxOk || !fgReal;
  return {
    riskProfile: profile,
    targetAllocation,
    cashBufferPct: cashBuffer * 100,
    expectedReturnPct: EXPECTED_RETURN[profile],
    volatilityPct: VOL[profile],
    rebalanceActions: actions,
    sources,
    degraded,
    narrative: `For a ${profile.toLowerCase()} investor, the AI advisor tilts the portfolio primarily on ${modelUsed ? "the alt-data sentiment model \u2014 VADER + trained Naive Bayes on live StockTwits/news, blended with CoinGecko vote & Fear & Greed" : cgOk ? "CoinGecko community sentiment" : "sentiment unavailable"}, overlaid with ${pxOk ? "24h price momentum from Binance" : "momentum unavailable"}. Fear & Greed ${fg.value} (${fg.classification}${fgReal ? "" : ", synthetic fallback"}). Expected ~${EXPECTED_RETURN[profile]}% return / ~${VOL[profile]}% volatility are ${profile.toLowerCase()} model assumptions, not live-derived. Cash buffer ${(cashBuffer * 100).toFixed(0)}% kept for dip-buys.`
  };
}
var UNIVERSE, EXPECTED_RETURN, VOL, CASH_BUFFER, BINANCE2;
var init_advisor = __esm({
  "api/_lib/ai/advisor.ts"() {
    init_state();
    init_altdata();
    init_pipeline();
    UNIVERSE = [
      { symbol: "BTCUSDT", defaultWeight: { CONSERVATIVE: 0.45, BALANCED: 0.35, GROWTH: 0.25, AGGRESSIVE: 0.18 } },
      { symbol: "ETHUSDT", defaultWeight: { CONSERVATIVE: 0.25, BALANCED: 0.25, GROWTH: 0.22, AGGRESSIVE: 0.18 } },
      { symbol: "SOLUSDT", defaultWeight: { CONSERVATIVE: 0.05, BALANCED: 0.1, GROWTH: 0.15, AGGRESSIVE: 0.18 } },
      { symbol: "BNBUSDT", defaultWeight: { CONSERVATIVE: 0.05, BALANCED: 0.08, GROWTH: 0.1, AGGRESSIVE: 0.1 } },
      { symbol: "LINKUSDT", defaultWeight: { CONSERVATIVE: 0, BALANCED: 0.05, GROWTH: 0.08, AGGRESSIVE: 0.1 } },
      { symbol: "AVAXUSDT", defaultWeight: { CONSERVATIVE: 0, BALANCED: 0.03, GROWTH: 0.08, AGGRESSIVE: 0.1 } },
      { symbol: "INJUSDT", defaultWeight: { CONSERVATIVE: 0, BALANCED: 0.02, GROWTH: 0.06, AGGRESSIVE: 0.08 } },
      { symbol: "ARBUSDT", defaultWeight: { CONSERVATIVE: 0, BALANCED: 0.02, GROWTH: 0.06, AGGRESSIVE: 0.08 } }
    ];
    EXPECTED_RETURN = {
      CONSERVATIVE: 8,
      BALANCED: 14,
      GROWTH: 22,
      AGGRESSIVE: 35
    };
    VOL = {
      CONSERVATIVE: 12,
      BALANCED: 22,
      GROWTH: 38,
      AGGRESSIVE: 60
    };
    CASH_BUFFER = {
      CONSERVATIVE: 0.2,
      BALANCED: 0.1,
      GROWTH: 0.05,
      AGGRESSIVE: 0.02
    };
    BINANCE2 = "https://api.binance.com/api/v3";
  }
});

// api/_lib/ai/sources/btcMarket.ts
async function fetchBtcSnapshot() {
  if (SNAPSHOT_CACHE && Date.now() - SNAPSHOT_CACHE.ts < SNAPSHOT_TTL_MS) return SNAPSHOT_CACHE.data;
  try {
    const [marketsRes, globalRes] = await Promise.all([
      fetch("https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=bitcoin&price_change_percentage=24h", {
        headers: { "User-Agent": USER_AGENT6, "Accept": "application/json" }
      }),
      fetch("https://api.coingecko.com/api/v3/global", {
        headers: { "User-Agent": USER_AGENT6, "Accept": "application/json" }
      })
    ]);
    if (!marketsRes.ok) throw new Error(`markets_${marketsRes.status}`);
    if (!globalRes.ok) throw new Error(`global_${globalRes.status}`);
    const markets = await marketsRes.json();
    const globalJson = await globalRes.json();
    const btc = markets[0];
    if (!btc) throw new Error("empty_markets_payload");
    const snap = {
      ok: true,
      source: "coingecko",
      fetchedAt: (/* @__PURE__ */ new Date()).toISOString(),
      priceUsd: Number(btc.current_price) || 0,
      volume24hUsd: Number(btc.total_volume) || 0,
      marketCapUsd: Number(btc.market_cap) || 0,
      priceChange24hPct: Number(btc.price_change_percentage_24h_in_currency ?? btc.price_change_percentage_24h) || 0,
      marketCapChange24hPct: Number(globalJson.data.market_cap_change_percentage_24h_usd) || 0,
      totalMarketCapUsd: Number(globalJson.data.total_market_cap.usd) || 0,
      totalVolume24hUsd: Number(globalJson.data.total_volume.usd) || 0
    };
    SNAPSHOT_CACHE = { ts: Date.now(), data: snap };
    return snap;
  } catch (e) {
    return { ok: false, error: e.message, fetchedAt: (/* @__PURE__ */ new Date()).toISOString() };
  }
}
async function fetchBtcHistory(days = 365) {
  const cappedDays = Math.min(Math.max(days, 7), 365);
  if (HISTORY_CACHE && Date.now() - HISTORY_CACHE.ts < HISTORY_TTL_MS && HISTORY_CACHE.days >= cappedDays) {
    if (HISTORY_CACHE.days === cappedDays) return HISTORY_CACHE.data;
    const trimmed = HISTORY_CACHE.data.points.slice(-cappedDays);
    return { ...HISTORY_CACHE.data, days: cappedDays, points: trimmed };
  }
  try {
    const url2 = `https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=${cappedDays}&interval=daily`;
    const res = await fetch(url2, { headers: { "User-Agent": USER_AGENT6, "Accept": "application/json" } });
    if (!res.ok) throw new Error(`market_chart_${res.status}`);
    const json = await res.json();
    if (!json?.prices?.length) throw new Error("empty_history_payload");
    const volByDate = /* @__PURE__ */ new Map();
    for (const [ts, v] of json.total_volumes || []) {
      const date = new Date(ts).toISOString().slice(0, 10);
      volByDate.set(date, Number(v) || 0);
    }
    const points = json.prices.map(([ts, price]) => {
      const date = new Date(ts).toISOString().slice(0, 10);
      return { date, priceUsd: Number(price) || 0, volumeUsd: volByDate.get(date) || 0 };
    });
    const data = {
      ok: true,
      source: "coingecko",
      fetchedAt: (/* @__PURE__ */ new Date()).toISOString(),
      days: cappedDays,
      points
    };
    HISTORY_CACHE = { ts: Date.now(), days: cappedDays, data };
    return data;
  } catch (e) {
    return { ok: false, error: e.message, fetchedAt: (/* @__PURE__ */ new Date()).toISOString() };
  }
}
var USER_AGENT6, SNAPSHOT_CACHE, SNAPSHOT_TTL_MS, HISTORY_CACHE, HISTORY_TTL_MS;
var init_btcMarket = __esm({
  "api/_lib/ai/sources/btcMarket.ts"() {
    USER_AGENT6 = "CoinWiseAI/1.0 (Vietnam fintech assignment)";
    SNAPSHOT_CACHE = null;
    SNAPSHOT_TTL_MS = 5 * 60 * 1e3;
    HISTORY_CACHE = null;
    HISTORY_TTL_MS = 6 * 60 * 60 * 1e3;
  }
});

// api/_lib/routes/ai.ts
function mapPipelineLabel(l) {
  if (l === "Euphoric") return "Euphoric";
  if (l === "Bullish") return "Bullish";
  if (l === "Bearish" || l === "Capitulation") return "Bearish";
  return "Neutral";
}
function withTimeout3(p, ms) {
  return new Promise((resolve2) => {
    const t = setTimeout(() => resolve2(null), ms);
    p.then((v) => {
      clearTimeout(t);
      resolve2(v);
    }).catch(() => {
      clearTimeout(t);
      resolve2(null);
    });
  });
}
var aiRouter, INSIGHT_PIPELINE_TIMEOUT_MS;
var init_ai = __esm({
  "api/_lib/routes/ai.ts"() {
    init_dist();
    init_fraud();
    init_advisor();
    init_altdata();
    init_pipeline();
    init_classifier();
    init_vader();
    init_reddit();
    init_hackerNews();
    init_fearGreed();
    init_coingecko();
    init_btcMarket();
    aiRouter = new Hono2();
    aiRouter.post("/fraud-check", async (c) => {
      const body = await c.req.json().catch(() => null);
      if (!body?.accountId || !body.transaction) return c.json({ error: "accountId & transaction required" }, 400);
      return c.json(await checkFraudWithRealAltData(body.accountId, body.transaction, body.account));
    });
    aiRouter.post("/advisor", async (c) => {
      const body = await c.req.json().catch(() => ({}));
      if (!body.accountId) return c.json({ error: "accountId required" }, 400);
      return c.json(await buildAdvisor(body.accountId, body.riskProfile || "BALANCED"));
    });
    INSIGHT_PIPELINE_TIMEOUT_MS = 9e3;
    aiRouter.post("/insight", async (c) => {
      const body = await c.req.json().catch(() => ({}));
      if (!body.symbol) return c.json({ error: "symbol required" }, 400);
      const sym = body.symbol.toUpperCase();
      const base = sym.replace(/USDT?$/, "");
      const real = await withTimeout3(runAltDataPipeline(base), INSIGHT_PIPELINE_TIMEOUT_MS);
      const fg = await getFearGreed();
      let sentiment;
      let signal;
      let confidence;
      let sources;
      let degraded;
      if (real) {
        const score = real.fusion.compositeScore;
        const mentions = real.collected.totalDocs;
        sentiment = {
          symbol: sym,
          score,
          label: mapPipelineLabel(real.fusion.label),
          mentions24h: mentions,
          sources: { twitter: 0, reddit: 0, news: 0 },
          topThemes: [],
          aiSummary: `${base} \u2014 ${real.fusion.label} (${(score * 100).toFixed(0)}/100) from ${mentions} 24h docs.`,
          updatedAt: (/* @__PURE__ */ new Date()).toISOString()
        };
        signal = real.fusion.signal || "HOLD";
        confidence = Number(real.fusion.confidence.toFixed(3));
        sources = {
          sentimentScore: "real",
          sentimentMentions: mentions > 0 ? "real" : "synthetic",
          fearGreed: "hybrid",
          signal: "real",
          confidence: "real"
        };
        degraded = real.stages.some((s) => s.status === "failed");
      } else {
        const synth = getSentiment(sym);
        sentiment = synth;
        const blended = signalFromSentiment(synth.score, 0);
        signal = blended === "BUY" && synth.score > 0.5 ? "STRONG_BUY" : blended === "SELL" && synth.score < -0.5 ? "STRONG_SELL" : blended;
        confidence = Number(Math.min(0.6, 0.4 + Math.abs(synth.score) * 0.2).toFixed(3));
        sources = {
          sentimentScore: "synthetic",
          sentimentMentions: "synthetic",
          fearGreed: "hybrid",
          signal: "synthetic",
          confidence: "synthetic"
        };
        degraded = true;
      }
      const narrative = `${base} \u2014 Composite AI signal: ${signal} (confidence ${(confidence * 100).toFixed(0)}%). Sentiment is ${sentiment.label.toLowerCase()} (${(sentiment.score * 100).toFixed(0)}/100) across ${sentiment.mentions24h.toLocaleString()} 24h mentions${sources.sentimentMentions === "real" ? " (Reddit + HN)" : ""}. Market mood: ${fg.classification} (${fg.value}/100).`;
      return c.json({
        symbol: sym,
        signal,
        confidence,
        sentiment,
        fearGreed: fg,
        narrative,
        sources,
        pipeline: real ? {
          totalLatencyMs: real.totalLatencyMs,
          stages: real.stages.map((s) => ({ name: s.name ?? "", status: s.status, message: s.message })),
          degraded
        } : { totalLatencyMs: INSIGHT_PIPELINE_TIMEOUT_MS, stages: [], degraded: true }
      });
    });
    aiRouter.get("/alt-data/pipeline/:symbol", async (c) => {
      const sym = c.req.param("symbol").toUpperCase();
      try {
        const result = await runAltDataPipeline(sym);
        return c.json(result);
      } catch (e) {
        return c.json({ error: "pipeline_failed", message: e.message }, 500);
      }
    });
    aiRouter.get("/alt-data/model/info", (c) => c.json(getModelInfo()));
    aiRouter.post("/alt-data/classify", async (c) => {
      const body = await c.req.json().catch(() => ({}));
      if (!body.text) return c.json({ error: "text required" }, 400);
      const nb = classify2(body.text);
      const vader = analyzeText(body.text);
      const nbHasSignal = nb.matchedFeatures.length > 0;
      const vaderHasSignal = vader.matchedTerms.length > 0;
      if (!nbHasSignal && vaderHasSignal) {
        const cmp = vader.compound;
        const label = cmp >= 0.05 ? "positive" : cmp <= -0.05 ? "negative" : "neutral";
        return c.json({
          ...nb,
          label,
          compound: Number(cmp.toFixed(4)),
          confidence: Number(Math.min(0.95, 0.55 + Math.abs(cmp) * 0.45).toFixed(4)),
          source: "vader-fallback",
          vader: { compound: cmp, matchedTerms: vader.matchedTerms }
        });
      }
      if (!nbHasSignal && !vaderHasSignal) {
        return c.json({ ...nb, label: "neutral", compound: 0, confidence: 0.34, source: "no-signal" });
      }
      return c.json({ ...nb, source: "trained-model" });
    });
    aiRouter.get("/alt-data/sources/health", async (c) => {
      const [reddit, news, fg, cg] = await Promise.all([
        pingReddit(),
        pingHackerNews(),
        pingFearGreed(),
        pingCoinGecko()
      ]);
      return c.json({
        reddit,
        news,
        fearGreed: fg,
        coinGecko: cg,
        overall: news.ok || fg.ok || cg.ok ? "live" : "down",
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      });
    });
    aiRouter.get("/fear-greed/full", async (c) => {
      const [fg, snap, hist] = await Promise.all([
        fetchFearGreedReal(365),
        fetchBtcSnapshot(),
        fetchBtcHistory(365)
      ]);
      if (!fg.ok) return c.json({ ok: false, error: "error" in fg ? fg.error : "unknown", fetchedAt: fg.fetchedAt }, 502);
      const points = fg.history;
      const last = points[points.length - 1];
      const yesterday = points[points.length - 2];
      const lastWeek = points[points.length - 8];
      const lastMonth = points[points.length - 31];
      const lastYear = points[0];
      let yearHigh = last;
      let yearLow = last;
      for (const p of points) {
        if (p.value > yearHigh.value) yearHigh = p;
        if (p.value < yearLow.value) yearLow = p;
      }
      return c.json({
        ok: true,
        fetchedAt: (/* @__PURE__ */ new Date()).toISOString(),
        fearGreed: {
          source: fg.source,
          current: fg.current,
          delta24h: fg.delta24h,
          delta7d: fg.delta7d,
          history: fg.history,
          periods: {
            yesterday: yesterday || null,
            lastWeek: lastWeek || null,
            lastMonth: lastMonth || null,
            lastYear: lastYear || null
          },
          yearHigh,
          yearLow
        },
        btc: snap.ok ? snap : null,
        btcHistory: hist.ok ? hist : null,
        sources: {
          fearGreed: "real",
          btcSnapshot: snap.ok ? "real" : "unavailable",
          btcHistory: hist.ok ? "real" : "unavailable"
        }
      });
    });
    aiRouter.post("/fraud-check-real", async (c) => {
      const body = await c.req.json().catch(() => null);
      if (!body?.accountId || !body.transaction) return c.json({ error: "accountId & transaction required" }, 400);
      const result = await checkFraudWithRealAltData(body.accountId, body.transaction, body.account);
      return c.json(result);
    });
  }
});

// api/_lib/routes/accounts.ts
async function priceFor(symbol) {
  try {
    const r = await fetch(`${BINANCE3}/ticker/price?symbol=${symbol}`);
    const j = await r.json();
    return j.price ? Number(j.price) : 0;
  } catch {
    return 0;
  }
}
var accountsRouter, BINANCE3;
var init_accounts = __esm({
  "api/_lib/routes/accounts.ts"() {
    init_dist();
    init_state();
    init_fx();
    init_fraud();
    accountsRouter = new Hono2();
    BINANCE3 = "https://api.binance.com/api/v3";
    accountsRouter.get("/:accountId/balance", async (c) => {
      const acc = getAccount(c.req.param("accountId"));
      const positions = await Promise.all(
        acc.positions.map(async (p) => {
          const px = await priceFor(p.symbol);
          const valueUsd = p.amount * px;
          return { symbol: p.symbol, amount: p.amount, valueUsd, valueVnd: usdToVnd(valueUsd) };
        })
      );
      const assetsUsd = positions.reduce((s, p) => s + p.valueUsd, 0);
      const netUsd = assetsUsd + acc.cashUsd;
      return c.json({
        accountId: acc.accountId,
        cashUsd: acc.cashUsd,
        cashVnd: usdToVnd(acc.cashUsd),
        assetsUsd,
        assetsVnd: usdToVnd(assetsUsd),
        netWorthUsd: netUsd,
        netWorthVnd: usdToVnd(netUsd),
        positions,
        asOf: (/* @__PURE__ */ new Date()).toISOString()
      });
    });
    accountsRouter.get("/:accountId/transactions", (c) => {
      const acc = getAccount(c.req.param("accountId"));
      return c.json(acc.transactions.slice(-100).reverse());
    });
    accountsRouter.post("/:accountId/deposit-vnd", async (c) => {
      const id = c.req.param("accountId");
      const body = await c.req.json().catch(() => ({}));
      if (!body.amountVnd || body.amountVnd <= 0) return c.json({ error: "amountVnd required" }, 400);
      const acc = getAccount(id);
      const usd = vndToUsd(body.amountVnd);
      const rate = getRates().rates.VND;
      acc.cashUsd += usd;
      const txn = {
        id: shortId("dep"),
        type: "DEPOSIT",
        asset: "VND",
        amount: body.amountVnd,
        price: 1 / rate,
        total: usd,
        timestamp: Date.now(),
        currency: "VND",
        fxRate: rate,
        channel: body.channel || "BANK_TRANSFER"
      };
      acc.transactions.push(txn);
      return c.json({
        accountId: id,
        amountVnd: body.amountVnd,
        amountUsd: usd,
        rate,
        channel: txn.channel,
        ref: txn.id,
        newBalanceUsd: acc.cashUsd
      });
    });
    accountsRouter.post("/:accountId/trade", async (c) => {
      const id = c.req.param("accountId");
      const body = await c.req.json().catch(() => ({}));
      if (!body.side || !body.symbol) return c.json({ error: "side & symbol required" }, 400);
      const acc = getAccount(id);
      const symbol = body.symbol.toUpperCase();
      let price = await priceFor(symbol);
      if (!price && body.priceHint && Number.isFinite(body.priceHint) && body.priceHint > 0) {
        price = body.priceHint;
      }
      if (!price) return c.json({ error: "Failed to fetch market price" }, 502);
      let usdNotional = typeof body.amountUsd === "number" ? body.amountUsd : typeof body.amountVnd === "number" ? vndToUsd(body.amountVnd) : typeof body.amount === "number" ? body.amount * price : 0;
      if (!usdNotional || usdNotional <= 0) return c.json({ error: "Notional amount required" }, 400);
      const FEE_RATE = 1e-3;
      if (body.side === "BUY") {
        const cashForClamp = Number.isFinite(body.currentCashUsd) ? Number(body.currentCashUsd) : 0;
        if (cashForClamp > 0) {
          const maxBuyNotional = cashForClamp / (1 + FEE_RATE);
          if (usdNotional <= cashForClamp && usdNotional > maxBuyNotional) {
            usdNotional = maxBuyNotional;
          }
        }
      }
      const baseAmount = usdNotional / price;
      const fee = usdNotional * FEE_RATE;
      const txCandidate = {
        type: body.side,
        asset: symbol,
        amount: baseAmount,
        price,
        total: body.side === "BUY" ? -usdNotional : usdNotional,
        timestamp: Date.now()
      };
      const fraud = await checkFraudWithRealAltData(id, txCandidate);
      if (fraud.verdict === "BLOCK") {
        return c.json({ ok: false, blocked: true, fraudCheck: fraud }, 200);
      }
      if (body.side === "BUY") {
        const cashAvailable = Number.isFinite(body.currentCashUsd) ? Number(body.currentCashUsd) : acc.cashUsd;
        const CASH_EPS = Math.max(0.01, cashAvailable * 1e-9);
        if (cashAvailable + CASH_EPS < usdNotional + fee) {
          return c.json({ error: "Insufficient cash" }, 400);
        }
        acc.cashUsd = Math.max(0, cashAvailable - (usdNotional + fee));
        const pos = acc.positions.find((p) => p.symbol === symbol);
        if (pos) pos.amount += baseAmount;
        else acc.positions.push({ symbol, amount: baseAmount });
      } else {
        const positionAvailable = Number.isFinite(body.currentPositionAmount) ? Number(body.currentPositionAmount) : acc.positions.find((p) => p.symbol === symbol)?.amount ?? 0;
        const EPSILON = 1e-6;
        let baseAmountClamped = baseAmount;
        if (baseAmountClamped > positionAvailable && baseAmountClamped - positionAvailable <= EPSILON) {
          baseAmountClamped = positionAvailable;
        }
        if (positionAvailable + EPSILON < baseAmountClamped) {
          return c.json({ error: "Insufficient position" }, 400);
        }
        const pos = acc.positions.find((p) => p.symbol === symbol);
        if (pos) {
          pos.amount = Math.max(0, positionAvailable - baseAmountClamped);
          if (pos.amount < 1e-9) acc.positions = acc.positions.filter((p) => p.symbol !== symbol);
        }
        const cashBase = Number.isFinite(body.currentCashUsd) ? Number(body.currentCashUsd) : acc.cashUsd;
        acc.cashUsd = cashBase + (usdNotional - fee);
      }
      const txn = {
        id: shortId(body.side.toLowerCase()),
        type: body.side,
        asset: symbol,
        amount: baseAmount,
        price,
        total: body.side === "BUY" ? -usdNotional : usdNotional,
        timestamp: Date.now(),
        currency: "USD"
      };
      acc.transactions.push(txn);
      return c.json({
        ok: true,
        txId: txn.id,
        side: body.side,
        symbol,
        executedAmount: baseAmount,
        executedPriceUsd: price,
        feeUsd: fee,
        newBalanceUsd: acc.cashUsd,
        fraudCheck: fraud
      });
    });
  }
});

// api/_lib/routes/agent.ts
function syncAccountFromSnapshot(accountId, snapshot) {
  if (!snapshot) return;
  const acc = getAccount(accountId);
  if (Number.isFinite(snapshot.cashUsd)) {
    acc.cashUsd = Number(snapshot.cashUsd);
  }
  if (Array.isArray(snapshot.positions)) {
    acc.positions = snapshot.positions.filter((p) => p && typeof p.symbol === "string" && Number.isFinite(p.amount) && p.amount > 0).map((p) => ({ symbol: String(p.symbol).toUpperCase(), amount: Number(p.amount) }));
  }
}
async function priceFor2(symbol) {
  try {
    const r = await fetch(`${BINANCE4}/ticker/price?symbol=${symbol}`);
    const j = await r.json();
    return j.price ? Number(j.price) : 0;
  } catch {
    return 0;
  }
}
var agentRouter, BINANCE4;
var init_agent = __esm({
  "api/_lib/routes/agent.ts"() {
    init_dist();
    init_state();
    init_fx();
    init_altdata();
    init_pipeline();
    init_advisor();
    init_fraud();
    agentRouter = new Hono2();
    BINANCE4 = "https://api.binance.com/api/v3";
    agentRouter.post("/execute", async (c) => {
      const body = await c.req.json().catch(() => ({}));
      const tool = body.tool || "";
      const args = body.args || {};
      const accountId = body.accountId || args.accountId;
      if (accountId) syncAccountFromSnapshot(accountId, body.accountSnapshot);
      try {
        switch (tool) {
          case "getBalance": {
            if (!accountId) throw new Error("accountId required");
            const acc = getAccount(accountId);
            let assetsUsd = 0;
            const positions = [];
            for (const p of acc.positions) {
              const px = await priceFor2(p.symbol);
              assetsUsd += p.amount * px;
              positions.push({ symbol: p.symbol, amount: p.amount, valueUsd: p.amount * px });
            }
            const netUsd = assetsUsd + acc.cashUsd;
            return c.json({
              cashUsd: acc.cashUsd,
              cashVnd: usdToVnd(acc.cashUsd),
              assetsUsd,
              netUsd,
              netVnd: usdToVnd(netUsd),
              positions
            });
          }
          case "getSentiment": {
            if (!args.symbol) throw new Error("symbol required");
            return c.json(getSentiment(String(args.symbol).toUpperCase()));
          }
          case "getInsight": {
            if (!args.symbol) throw new Error("symbol required");
            const sym = String(args.symbol).toUpperCase();
            const [alt, fg] = await Promise.all([getRealSentimentScore(sym), getFearGreed()]);
            const signal = alt.score >= 0.15 ? "BUY" : alt.score <= -0.15 ? "SELL" : "HOLD";
            return c.json({
              symbol: sym,
              sentiment: {
                score: Number(alt.score.toFixed(3)),
                label: alt.label,
                spike: alt.spike,
                source: "VADER + Naive Bayes (live Reddit/HN + news), CoinGecko vote, Fear & Greed"
              },
              signal,
              fearGreed: fg
            });
          }
          case "getFearGreed":
            return c.json(await getFearGreed());
          case "getAdvisor": {
            if (!accountId) throw new Error("accountId required");
            const profile = args.riskProfile || "BALANCED";
            return c.json(await buildAdvisor(accountId, profile));
          }
          case "convertCurrency": {
            const amount = Number(args.amount);
            if (!amount) throw new Error("amount required");
            const r = convert(amount, String(args.from || "USD"), String(args.to || "VND"));
            return c.json({ amount, from: args.from, to: args.to, ...r });
          }
          case "placeTrade": {
            if (!accountId) throw new Error("accountId required");
            const side = (args.side || "BUY").toUpperCase();
            const symbol = String(args.symbol || "BTCUSDT").toUpperCase();
            let price = await priceFor2(symbol);
            const hint = Number(args.priceHint);
            if ((!price || !Number.isFinite(price) || price <= 0) && Number.isFinite(hint) && hint > 0) {
              price = hint;
            }
            if (!price || !Number.isFinite(price) || price <= 0) {
              throw new Error(`Could not fetch live price for ${symbol}. Try again in a moment.`);
            }
            const FEE_RATE = 1e-3;
            const sellPct = Number(args.sellPercent);
            const buyPct = Number(args.buyPercent);
            let amountUsd;
            if (args.sellAll === true && side === "SELL") {
              const acc = getAccount(accountId);
              const pos = acc.positions.find((p) => p.symbol === symbol);
              if (!pos || pos.amount <= 0) {
                throw new Error(`You don't own any ${symbol.replace("USDT", "")} to sell.`);
              }
              amountUsd = pos.amount * price;
            } else if (Number.isFinite(sellPct) && sellPct > 0 && side === "SELL") {
              const acc = getAccount(accountId);
              const pos = acc.positions.find((p) => p.symbol === symbol);
              if (!pos || pos.amount <= 0) {
                throw new Error(`You don't own any ${symbol.replace("USDT", "")} to sell.`);
              }
              const pct = Math.min(100, Math.max(0, sellPct));
              amountUsd = pos.amount * (pct / 100) * price;
            } else if (args.buyAllCash === true && side === "BUY") {
              const acc = getAccount(accountId);
              if (acc.cashUsd <= 0) {
                throw new Error("Insufficient cash balance to buy.");
              }
              amountUsd = acc.cashUsd / (1 + FEE_RATE);
            } else if (Number.isFinite(buyPct) && buyPct > 0 && side === "BUY") {
              const acc = getAccount(accountId);
              if (acc.cashUsd <= 0) {
                throw new Error("Insufficient cash balance to buy.");
              }
              const pct = Math.min(100, Math.max(0, buyPct));
              const target = acc.cashUsd * (pct / 100);
              amountUsd = target / (1 + FEE_RATE);
            } else {
              amountUsd = Number(args.amountUsd ?? (args.amountVnd ? vndToUsd(Number(args.amountVnd)) : 0));
              if (!amountUsd || !Number.isFinite(amountUsd) || amountUsd <= 0) {
                throw new Error("amountUsd, amountVnd, sellAll, buyAllCash, sellPercent, or buyPercent required");
              }
            }
            if (side === "BUY") {
              const acc = getAccount(accountId);
              const maxBuyNotional = acc.cashUsd / (1 + FEE_RATE);
              if (amountUsd <= acc.cashUsd && amountUsd > maxBuyNotional) {
                amountUsd = maxBuyNotional;
              }
            }
            const baseAmount = amountUsd / price;
            const amountVnd = usdToVnd(amountUsd);
            const txCandidate = {
              type: side,
              asset: symbol,
              amount: baseAmount,
              price,
              total: side === "BUY" ? -amountUsd : amountUsd,
              timestamp: Date.now()
            };
            const fraud = await checkFraudWithRealAltData(accountId, txCandidate);
            return c.json({
              quoted: true,
              requiresUserConfirm: true,
              side,
              symbol,
              amountUsd,
              amountVnd,
              priceUsd: price,
              baseAmount,
              fraudCheck: fraud,
              message: `Quote: ${side} ${baseAmount.toFixed(6)} ${symbol.replace("USDT", "")} \u2248 $${amountUsd.toFixed(2)} / ${amountVnd.toLocaleString("vi-VN")} \u20AB. Risk: ${fraud.verdict}.`
            });
          }
          case "depositVnd": {
            if (!accountId) throw new Error("accountId required");
            const amountVnd = Number(args.amountVnd);
            if (!amountVnd) throw new Error("amountVnd required");
            const usd = vndToUsd(amountVnd);
            return c.json({
              quoted: true,
              requiresUserConfirm: true,
              amountVnd,
              amountUsd: usd,
              rate: getRates().rates.VND,
              channel: args.channel || "VNPAY",
              message: `Deposit quote: ${amountVnd.toLocaleString("vi-VN")} \u20AB \u2248 $${usd.toFixed(2)}.`
            });
          }
          default:
            return c.json({ error: `Unknown tool '${tool}'` }, 400);
        }
      } catch (e) {
        return c.json({ error: e.message }, 400);
      }
    });
  }
});

// api/_lib/routes/bank.ts
function usdToVnd2(usd) {
  const r = convert(usd, "USD", "VND");
  return { vnd: r.result, rate: r.rate };
}
async function summary(accountId, holder) {
  const acc = await getBankAccount(accountId, holder);
  const rate = getRates().rates.VND;
  return {
    accountId: acc.accountId,
    holder: acc.holder,
    bankAccountNo: acc.bankAccountNo,
    balanceVnd: acc.balanceVnd,
    balanceUsd: Number((acc.balanceVnd / rate).toFixed(2)),
    rate,
    openedAt: acc.openedAt
  };
}
var bankRouter, DEFAULT_ENTRY_FEE_USD, PURPOSE_TO_TYPE, PURPOSE_TO_VI;
var init_bank = __esm({
  "api/_lib/routes/bank.ts"() {
    init_dist();
    init_state();
    init_fx();
    bankRouter = new Hono2();
    DEFAULT_ENTRY_FEE_USD = 5;
    bankRouter.get("/:id", async (c) => c.json(await summary(c.req.param("id"))));
    bankRouter.get("/:id/statement", async (c) => {
      const acc = await getBankAccount(c.req.param("id"));
      return c.json(acc.transactions.slice(-100).reverse());
    });
    bankRouter.post("/:id/deposit", async (c) => {
      const id = c.req.param("id");
      const body = await c.req.json().catch(() => ({}));
      const amt = Math.round(Number(body.amountVnd));
      if (!Number.isFinite(amt) || amt <= 0) return c.json({ error: "amountVnd must be a positive number" }, 400);
      if (amt > 1e9) return c.json({ error: "amountVnd exceeds 1,000,000,000 demo limit" }, 400);
      const acc = await getBankAccount(id, body.holder);
      acc.balanceVnd += amt;
      const txn = recordBankTxn(acc, "DEPOSIT", amt, "Deposit to account");
      await saveBankToFirebase(acc);
      return c.json({ ok: true, ...await summary(id), ref: txn.ref, transaction: txn });
    });
    bankRouter.post("/:id/withdraw", async (c) => {
      const id = c.req.param("id");
      const body = await c.req.json().catch(() => ({}));
      const amt = Math.round(Number(body.amountVnd));
      if (!Number.isFinite(amt) || amt <= 0) return c.json({ error: "amountVnd must be a positive number" }, 400);
      const acc = await getBankAccount(id);
      if (acc.balanceVnd < amt) {
        return c.json({ ok: false, error: "Insufficient balance", balanceVnd: acc.balanceVnd, required: amt }, 402);
      }
      acc.balanceVnd -= amt;
      const txn = recordBankTxn(acc, "WITHDRAW", -amt, "Withdrawal from account");
      await saveBankToFirebase(acc);
      return c.json({ ok: true, ...await summary(id), ref: txn.ref, transaction: txn });
    });
    bankRouter.post("/arena/pay-entry", async (c) => {
      const body = await c.req.json().catch(() => ({}));
      if (!body.accountId) return c.json({ error: "accountId required" }, 400);
      const usd = Number.isFinite(body.amountUsd) && Number(body.amountUsd) > 0 ? Number(body.amountUsd) : DEFAULT_ENTRY_FEE_USD;
      const acc = await getBankAccount(body.accountId, body.holder);
      const { vnd, rate } = usdToVnd2(usd);
      if (acc.balanceVnd < vnd) {
        return c.json(
          { ok: false, paid: false, error: "Insufficient bank balance to pay the entry fee", requiredVnd: vnd, amountUsd: usd, balanceVnd: acc.balanceVnd },
          402
        );
      }
      acc.balanceVnd -= vnd;
      const txn = recordBankTxn(acc, "ARENA_ENTRY", -vnd, `Arena entry fee${body.room ? ` \xB7 ${body.room}` : ""} ($${usd})`);
      await saveBankToFirebase(acc);
      return c.json({ ok: true, paid: true, amountUsd: usd, amountVnd: vnd, rate, ref: txn.ref, ...await summary(body.accountId) });
    });
    PURPOSE_TO_TYPE = {
      PREMIUM_UPGRADE: "PREMIUM_UPGRADE",
      COURSE_PURCHASE: "COURSE_PURCHASE",
      STAKE_LOCK: "STAKE_LOCK",
      ACCOUNT_TOPUP: "ACCOUNT_TOPUP"
    };
    PURPOSE_TO_VI = {
      PREMIUM_UPGRADE: "Membership plan upgrade",
      COURSE_PURCHASE: "Academy course purchase",
      STAKE_LOCK: "Earn product lock-up",
      ACCOUNT_TOPUP: "Top up trading account"
    };
    bankRouter.post("/pay-purchase", async (c) => {
      const body = await c.req.json().catch(() => ({}));
      if (!body.accountId) return c.json({ error: "accountId required" }, 400);
      const usd = Number(body.amountUsd);
      if (!Number.isFinite(usd) || usd <= 0) {
        return c.json({ error: "amountUsd must be a positive number" }, 400);
      }
      const purposeKey = (body.purpose || "").toUpperCase();
      const txnType = PURPOSE_TO_TYPE[purposeKey];
      if (!txnType) {
        return c.json({ error: `purpose must be one of ${Object.keys(PURPOSE_TO_TYPE).join(", ")}` }, 400);
      }
      const acc = await getBankAccount(body.accountId, body.holder);
      const { vnd, rate } = usdToVnd2(usd);
      if (acc.balanceVnd < vnd) {
        return c.json(
          { ok: false, paid: false, error: "Insufficient bank balance", requiredVnd: vnd, amountUsd: usd, balanceVnd: acc.balanceVnd },
          402
        );
      }
      acc.balanceVnd -= vnd;
      const noteBase = PURPOSE_TO_VI[purposeKey];
      const note = body.label ? `${noteBase} \xB7 ${body.label} ($${usd})` : `${noteBase} ($${usd})`;
      const txn = recordBankTxn(acc, txnType, -vnd, note);
      await saveBankToFirebase(acc);
      return c.json({
        ok: true,
        paid: true,
        purpose: purposeKey,
        amountUsd: usd,
        amountVnd: vnd,
        rate,
        ref: txn.ref,
        ...await summary(body.accountId)
      });
    });
    bankRouter.post("/referral-payout", async (c) => {
      const body = await c.req.json().catch(() => ({}));
      if (!body.accountId) return c.json({ error: "accountId required" }, 400);
      const usd = Number(body.amountUsd);
      if (!Number.isFinite(usd) || usd <= 0) return c.json({ error: "amountUsd must be a positive number" }, 400);
      const acc = await getBankAccount(body.accountId, body.holder);
      const { vnd, rate } = usdToVnd2(usd);
      acc.balanceVnd += vnd;
      const txn = recordBankTxn(acc, "REFERRAL_PAYOUT", vnd, `Referral reward payout ($${usd})`);
      await saveBankToFirebase(acc);
      return c.json({ ok: true, credited: true, amountUsd: usd, amountVnd: vnd, rate, ref: txn.ref, ...await summary(body.accountId) });
    });
    bankRouter.post("/arena/payout", async (c) => {
      const body = await c.req.json().catch(() => ({}));
      if (!body.accountId) return c.json({ error: "accountId required" }, 400);
      const usd = Number(body.amountUsd);
      if (!Number.isFinite(usd) || usd <= 0) return c.json({ error: "amountUsd must be a positive number" }, 400);
      const acc = await getBankAccount(body.accountId, body.holder);
      const { vnd, rate } = usdToVnd2(usd);
      acc.balanceVnd += vnd;
      const txn = recordBankTxn(acc, "ARENA_PRIZE", vnd, `Arena prize ($${usd})`);
      await saveBankToFirebase(acc);
      return c.json({ ok: true, credited: true, amountUsd: usd, amountVnd: vnd, rate, ref: txn.ref, ...await summary(body.accountId) });
    });
  }
});

// api/_lib/earn.ts
function median(xs) {
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}
async function getEarnYields() {
  const now = Date.now();
  if (cache2 && now - cache2.ts < TTL_MS8) return cache2.data;
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 6e3);
    const res = await fetch("https://yields.llama.fi/pools", {
      signal: ctrl.signal,
      headers: { accept: "application/json" }
    });
    clearTimeout(timer);
    if (!res.ok) throw new Error(`http ${res.status}`);
    const json = await res.json();
    const pools = json.data || [];
    if (!pools.length) throw new Error("empty payload");
    const out = {};
    Object.keys(ASSETS).forEach((sym) => {
      const cfg = ASSETS[sym];
      const set = new Set(cfg.match);
      const floor = cfg.kind === "staking" ? STAKING_FLOOR : 0;
      const apys = pools.filter((p) => p.symbol && set.has(p.symbol.toUpperCase())).filter((p) => p.exposure === "single").filter((p) => Number.isFinite(p.apy) && p.apy > floor && p.apy <= 100).filter((p) => Number.isFinite(p.tvlUsd) && p.tvlUsd >= MIN_TVL).sort((a, b) => b.tvlUsd - a.tvlUsd).slice(0, 20).map((p) => p.apy);
      if (apys.length) out[sym] = Number((median(apys) / 100).toFixed(4));
    });
    if (!Object.keys(out).length) throw new Error("no symbol matches");
    const data = {
      yields: out,
      source: "defillama",
      degraded: false,
      asOf: (/* @__PURE__ */ new Date()).toISOString()
    };
    cache2 = { data, ts: now };
    return data;
  } catch {
    return { yields: {}, source: "unavailable", degraded: true, asOf: (/* @__PURE__ */ new Date()).toISOString() };
  }
}
var ASSETS, MIN_TVL, STAKING_FLOOR, TTL_MS8, cache2;
var init_earn = __esm({
  "api/_lib/earn.ts"() {
    ASSETS = {
      USDT: { match: ["USDT"], kind: "lending" },
      BTC: { match: ["WBTC", "BTCB", "TBTC", "CBBTC"], kind: "lending" },
      ETH: { match: ["STETH", "WSTETH", "RETH", "CBETH"], kind: "staking" },
      SOL: { match: ["MSOL", "JITOSOL", "BSOL", "JSOL"], kind: "staking" },
      BNB: { match: ["SLISBNB", "BNBX", "ANKRBNB"], kind: "staking" }
    };
    MIN_TVL = 1e7;
    STAKING_FLOOR = 1;
    TTL_MS8 = 30 * 60 * 1e3;
    cache2 = null;
  }
});

// api/_lib/routes/earn.ts
var earnRouter;
var init_earn2 = __esm({
  "api/_lib/routes/earn.ts"() {
    init_dist();
    init_earn();
    earnRouter = new Hono2();
    earnRouter.get("/yields", async (c) => c.json(await getEarnYields()));
  }
});

// api/_lib/app.ts
var app_exports = {};
__export(app_exports, {
  app: () => app
});
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
function loadSpec() {
  const here = (() => {
    try {
      return dirname(fileURLToPath(import.meta.url));
    } catch {
      return "";
    }
  })();
  const candidates = [
    here && resolve(here, "openapi.yaml"),
    here && resolve(here, "../api/_lib/openapi.yaml"),
    resolve(process.cwd(), "api/_lib/openapi.yaml"),
    resolve(process.cwd(), "openapi.yaml")
  ].filter(Boolean);
  for (const path of candidates) {
    try {
      return readFileSync(path, "utf8");
    } catch {
    }
  }
  return null;
}
var startedAt2, app;
var init_app = __esm({
  "api/_lib/app.ts"() {
    init_dist();
    init_cors();
    init_fx2();
    init_market();
    init_ai();
    init_accounts();
    init_agent();
    init_bank();
    init_earn2();
    startedAt2 = Date.now();
    app = new Hono2();
    app.use("*", cors({ origin: "*", allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"] }));
    app.get(
      "/api/ping",
      (c) => c.json({ ok: true, uptimeSec: Math.floor((Date.now() - startedAt2) / 1e3), time: (/* @__PURE__ */ new Date()).toISOString() })
    );
    app.get(
      "/api/v1/health",
      (c) => c.json({
        status: "ok",
        uptimeSec: Math.floor((Date.now() - startedAt2) / 1e3),
        version: "1.0.0",
        name: "CoinWise AI Fintech OpenAPI"
      })
    );
    app.route("/api/v1/fx", fxRouter);
    app.route("/api/v1/market", marketRouter);
    app.route("/api/v1/ai", aiRouter);
    app.route("/api/v1/accounts", accountsRouter);
    app.route("/api/v1/agent", agentRouter);
    app.route("/api/v1/bank", bankRouter);
    app.route("/api/v1/earn", earnRouter);
    app.get("/api/openapi.yaml", (c) => {
      const spec = loadSpec();
      if (!spec) return c.json({ error: "Spec file not in bundle. Check vercel.json includeFiles." }, 500);
      return new Response(spec, { headers: { "content-type": "text/yaml; charset=utf-8" } });
    });
    app.get("/api/docs", (c) => {
      const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>CoinWise AI \xB7 OpenAPI Docs</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.17.14/swagger-ui.css" />
  <style>body{margin:0;background:#0f172a}.swagger-ui .topbar{background:#0f172a}</style>
</head>
<body>
  <div id="swagger"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5.17.14/swagger-ui-bundle.js"></script>
  <script>
    window.onload = () => {
      window.ui = SwaggerUIBundle({
        url: '/openapi.yaml',
        dom_id: '#swagger',
        deepLinking: true,
        docExpansion: 'list',
        presets: [SwaggerUIBundle.presets.apis]
      });
    };
  </script>
</body>
</html>`;
      return new Response(html, { headers: { "content-type": "text/html; charset=utf-8" } });
    });
    app.get("/openapi.yaml", (c) => {
      const spec = loadSpec();
      if (!spec) return c.json({ error: "Spec not found" }, 500);
      return new Response(spec, { headers: { "content-type": "text/yaml; charset=utf-8" } });
    });
    app.get("/docs", (c) => c.redirect("/api/docs"));
    app.get("/", (c) => c.redirect("/api/docs"));
    app.get(
      "/meta",
      (c) => c.json({
        name: "CoinWise AI Fintech OpenAPI",
        docs: "/api/docs",
        spec: "/api/openapi.yaml",
        health: "/api/v1/health"
      })
    );
  }
});

// api/_lib/_entry.ts
var config = { runtime: "nodejs" };
async function handler(req, res) {
  try {
    const mod = await Promise.resolve().then(() => (init_app(), app_exports)).catch((e) => {
      throw new Error("IMPORT_FAILED: " + e.message);
    });
    const app2 = mod.app;
    if (!app2) throw new Error("App export is missing from _lib/app");
    const proto = req.headers["x-forwarded-proto"] || "https";
    const host = req.headers["x-forwarded-host"] || req.headers["host"] || "localhost";
    let path = req.url || "/";
    if (path.startsWith("/api/dispatch")) {
      const matched = req.headers["x-matched-path"];
      const original = req.headers["x-vercel-original-pathname"];
      path = matched || original || path;
    }
    const url2 = `${proto}://${host}${path}`;
    const method = (req.method || "GET").toUpperCase();
    const hasBody = !["GET", "HEAD"].includes(method);
    const headers = new Headers();
    for (const [k, v] of Object.entries(req.headers || {})) {
      if (typeof v === "string") headers.set(k, v);
      else if (Array.isArray(v)) headers.set(k, v.join(", "));
    }
    let body;
    if (hasBody && req.body !== void 0 && req.body !== null) {
      if (typeof req.body === "string") body = req.body;
      else if (Buffer.isBuffer(req.body)) body = req.body;
      else body = JSON.stringify(req.body);
      if (!headers.has("content-type")) headers.set("content-type", "application/json");
    }
    const webReq = new Request(url2, { method, headers, body });
    const webRes = await app2.fetch(webReq);
    res.status(webRes.status);
    webRes.headers.forEach((value, key) => res.setHeader(key, value));
    const buf = Buffer.from(await webRes.arrayBuffer());
    res.end(buf);
  } catch (err) {
    const e = err;
    res.setHeader("content-type", "application/json; charset=utf-8");
    res.status(500).end(JSON.stringify({
      error: "function_crash",
      message: e.message,
      stack: e.stack?.split("\n").slice(0, 12)
    }));
  }
}
export {
  config,
  handler as default
};

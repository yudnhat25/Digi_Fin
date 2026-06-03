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
      const url = request.url;
      const start = url.indexOf("/", url.indexOf(":") + 4);
      let i = start;
      for (; i < url.length; i++) {
        const charCode = url.charCodeAt(i);
        if (charCode === 37) {
          const queryIndex = url.indexOf("?", i);
          const hashIndex = url.indexOf("#", i);
          const end = queryIndex === -1 ? hashIndex === -1 ? void 0 : hashIndex : hashIndex === -1 ? queryIndex : Math.min(queryIndex, hashIndex);
          const path = url.slice(start, end);
          return tryDecodeURI(path.includes("%25") ? path.replace(/%25/g, "%2525") : path);
        } else if (charCode === 63 || charCode === 35) {
          break;
        }
      }
      return url.slice(start, i);
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
    _getQueryParam = (url, key, multiple) => {
      let encoded;
      if (!multiple && key && !/[%+]/.test(key)) {
        let keyIndex2 = url.indexOf("?", 8);
        if (keyIndex2 === -1) {
          return void 0;
        }
        if (!url.startsWith(key, keyIndex2 + 1)) {
          keyIndex2 = url.indexOf(`&${key}`, keyIndex2 + 1);
        }
        while (keyIndex2 !== -1) {
          const trailingKeyCode = url.charCodeAt(keyIndex2 + key.length + 1);
          if (trailingKeyCode === 61) {
            const valueIndex = keyIndex2 + key.length + 2;
            const endIndex = url.indexOf("&", valueIndex);
            return _decodeURI(url.slice(valueIndex, endIndex === -1 ? void 0 : endIndex));
          } else if (trailingKeyCode == 38 || isNaN(trailingKeyCode)) {
            return "";
          }
          keyIndex2 = url.indexOf(`&${key}`, keyIndex2 + 1);
        }
        encoded = /[%+]/.test(url);
        if (!encoded) {
          return void 0;
        }
      }
      const results = {};
      encoded ??= /[%+]/.test(url);
      let keyIndex = url.indexOf("?", 8);
      while (keyIndex !== -1) {
        const nextKeyIndex = url.indexOf("&", keyIndex + 1);
        let valueIndex = url.indexOf("=", keyIndex);
        if (valueIndex > nextKeyIndex && nextKeyIndex !== -1) {
          valueIndex = -1;
        }
        let name = url.slice(
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
          value = url.slice(valueIndex + 1, nextKeyIndex === -1 ? void 0 : nextKeyIndex);
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
    getQueryParams = (url, key) => {
      return _getQueryParam(url, key, true);
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
            const url = new URL(request.url);
            url.pathname = this.getPath(request).slice(pathPrefixLength) || "/";
            return new Request(url, request);
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
function getWhaleFlow(symbol) {
  const base = symbol.replace("USDT", "").toUpperCase();
  const rnd = pseudoRandom(hash(`whale-${base}`) + Math.floor(Date.now() / (10 * 60 * 1e3)));
  const net = Math.round((rnd() - 0.45) * 48e5);
  const buys = Math.floor(8 + rnd() * 24);
  const sells = Math.floor(6 + rnd() * 22);
  const series = Array.from({ length: 24 }, (_, i) => ({
    t: new Date(Date.now() - (23 - i) * 60 * 60 * 1e3).toISOString(),
    netUsd: Math.round((rnd() - 0.5) * 12e5)
  }));
  return {
    symbol,
    netFlow24hUsd: net,
    largeBuys: buys,
    largeSells: sells,
    biggestSingle: Math.round(rnd() * 35e5 + 5e5),
    verdict: net > 1e6 ? "Smart-money is accumulating" : net < -1e6 ? "Smart-money is distributing" : "Neutral whale flow \u2014 wait for confirmation",
    series
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
      const url = `https://api.coingecko.com/api/v3/coins/${id}?localization=false&tickers=false&market_data=true&community_data=true&developer_data=false&sparkline=false`;
      const res = await fetch(url, {
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
    marketRouter.get("/:symbol/whale-flow", (c) => c.json(getWhaleFlow(c.req.param("symbol"))));
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
async function fetchJson(url, attempt = 0) {
  const target = attempt === 0 ? url : url.replace("www.reddit.com", "old.reddit.com");
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
      return fetchJson(url, attempt + 1);
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
  const url = `https://www.reddit.com/r/${encodeURIComponent(subreddit)}/hot.json?limit=${limit}&t=day`;
  const json = await fetchJson(url);
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
  const url = new URL("https://hn.algolia.com/api/v1/search");
  url.searchParams.set("query", query);
  url.searchParams.set("tags", "story");
  url.searchParams.set("hitsPerPage", "50");
  url.searchParams.set("page", String(page));
  const finalUrl = page === 0 ? url.toString() : url.toString().replace("/v1/search?", "/v1/search_by_date?");
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
    hnUrl: `https://news.ycombinator.com/item?id=${h.objectID}`
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
  const posts = Array.from(dedup.values()).sort(
    (a, b) => b.points - a.points || b.createdUtc - a.createdUtc
  );
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

// api/_lib/ai/sources/fearGreed.ts
async function fetchFearGreedReal(limit = 30) {
  const cappedLimit = Math.min(Math.max(limit, 1), 365);
  if (CACHE4 && Date.now() - CACHE4.ts < TTL_MS5 && CACHE4.limit >= cappedLimit) {
    if (CACHE4.limit === cappedLimit) return CACHE4.data;
    const trimmed = CACHE4.data.history.slice(-cappedLimit);
    const cur = trimmed[trimmed.length - 1];
    const yesterday = trimmed[trimmed.length - 2];
    const lastWeek = trimmed[trimmed.length - 8] || trimmed[0];
    return {
      ...CACHE4.data,
      current: cur,
      delta24h: yesterday ? cur.value - yesterday.value : 0,
      delta7d: lastWeek ? cur.value - lastWeek.value : 0,
      history: trimmed
    };
  }
  try {
    const url = `https://api.alternative.me/fng/?limit=${cappedLimit}&format=json`;
    const res = await fetch(url, { headers: { "User-Agent": USER_AGENT3 } });
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
    CACHE4 = { ts: Date.now(), limit: cappedLimit, data };
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
var CACHE4, TTL_MS5, USER_AGENT3;
var init_fearGreed = __esm({
  "api/_lib/ai/sources/fearGreed.ts"() {
    CACHE4 = null;
    TTL_MS5 = 30 * 60 * 1e3;
    USER_AGENT3 = "CoinWiseAI/1.0 (Vietnam fintech assignment)";
  }
});

// api/_lib/ai/sources/coingecko.ts
async function fetchCoinGecko(symbol) {
  const base = symbol.replace(/USDT$|USD$/i, "").toUpperCase();
  const coinId = COIN_IDS[base];
  if (!coinId) {
    return { ok: false, coinId: base, error: "unknown_coin_id", fetchedAt: (/* @__PURE__ */ new Date()).toISOString() };
  }
  const hit = CACHE5.get(coinId);
  if (hit && Date.now() - hit.ts < TTL_MS6) return hit.data;
  try {
    const url = `https://api.coingecko.com/api/v3/coins/${coinId}?localization=false&tickers=false&market_data=false&community_data=true&developer_data=true&sparkline=false`;
    const res = await fetch(url, { headers: { "User-Agent": USER_AGENT4, "Accept": "application/json" } });
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
    CACHE5.set(coinId, { ts: Date.now(), data });
    return data;
  } catch (e) {
    return { ok: false, coinId, error: e.message, fetchedAt: (/* @__PURE__ */ new Date()).toISOString() };
  }
}
async function pingCoinGecko() {
  const t0 = Date.now();
  try {
    const res = await fetch("https://api.coingecko.com/api/v3/ping", {
      headers: { "User-Agent": USER_AGENT4 }
    });
    return { ok: res.ok, latencyMs: Date.now() - t0 };
  } catch (e) {
    return { ok: false, latencyMs: Date.now() - t0, error: e.message };
  }
}
var COIN_IDS, CACHE5, TTL_MS6, USER_AGENT4;
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
    CACHE5 = /* @__PURE__ */ new Map();
    TTL_MS6 = 10 * 60 * 1e3;
    USER_AGENT4 = "CoinWiseAI/1.0 (Vietnam fintech assignment)";
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
    MODEL = { "version": "1.0.0", "algorithm": "multinomial-naive-bayes", "smoothingAlpha": 1, "classes": ["positive", "negative", "neutral"], "classDocCount": { "positive": 354, "negative": 355, "neutral": 80 }, "classTokenCount": { "positive": 2599, "negative": 2699, "neutral": 633 }, "logPrior": { "positive": -0.8014694077120997, "negative": -0.7986485313704584, "neutral": -2.2887396861719926 }, "logLikelihood": { "btc": { "positive": -6.092337737035083, "negative": -6.02566466531935, "neutral": -7.972810784121404 }, "liquidity": { "positive": -7.103938648713564, "negative": -6.718811845879295, "neutral": -7.972810784121404 }, "profile": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "healthiest": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "ever": { "positive": -7.103938648713564, "negative": -7.817424134547405, "neutral": -7.279663603561459 }, "right": { "positive": -7.391620721165345, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "now": { "positive": -6.544322860778141, "negative": -6.564661166052037, "neutral": -6.586516423001513 }, "mainstream": { "positive": -6.544322860778141, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "payment": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "processor": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "enables": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "instant": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "crypto": { "positive": -4.035885713579947, "negative": -3.6822575778050495, "neutral": -6.363372871687304 }, "checkout": { "positive": -7.391620721165345, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "tradfi": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "institutions": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "allocating": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "inflation": { "positive": -7.391620721165345, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "hedge": { "positive": -7.391620721165345, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "huge": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "healthy": { "positive": -7.103938648713564, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "correction": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "completed": { "positive": -7.7970858292735095, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "base": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "building": { "positive": -6.8807950973993535, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "next": { "positive": -6.410791468153619, "negative": -6.90113340267325, "neutral": -6.181051314893349 }, "leg": { "positive": -7.7970858292735095, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "up": { "positive": -6.410791468153619, "negative": -7.817424134547405, "neutral": -6.874198495453294 }, "long": { "positive": -6.092337737035083, "negative": -7.4119590264392405, "neutral": -7.972810784121404 }, "term": { "positive": -6.6984735406053995, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "holders": { "positive": -7.7970858292735095, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "refuse": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "sell": { "positive": -7.7970858292735095, "negative": -7.12427695398746, "neutral": -7.972810784121404 }, "despite": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "price": { "positive": -6.187647916839409, "negative": -6.90113340267325, "neutral": -6.874198495453294 }, "surge": { "positive": -6.6984735406053995, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "supply": { "positive": -6.8807950973993535, "negative": -7.817424134547405, "neutral": -7.279663603561459 }, "shock": { "positive": -7.391620721165345, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "stoked": { "positive": -7.391620721165345, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "see": { "positive": -7.391620721165345, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "protocol": { "positive": -6.8807950973993535, "negative": -6.718811845879295, "neutral": -6.586516423001513 }, "shipping": { "positive": -7.391620721165345, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "real": { "positive": -7.391620721165345, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "products": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "not": { "positive": -7.103938648713564, "negative": -7.12427695398746, "neutral": -7.279663603561459 }, "just": { "positive": -5.545794030667014, "negative": -6.564661166052037, "neutral": -5.893369242441568 }, "hype": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "vietnamese": { "positive": -7.391620721165345, "negative": -7.4119590264392405, "neutral": -7.972810784121404 }, "traders": { "positive": -7.103938648713564, "negative": -7.12427695398746, "neutral": -6.586516423001513 }, "posting": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.279663603561459 }, "impressive": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "ytd": { "positive": -7.391620721165345, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "gains": { "positive": -6.8807950973993535, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "greenlight": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "regulators": { "positive": -7.103938648713564, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "bullish": { "positive": -5.494500736279464, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "af": { "positive": -7.391620721165345, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "whole": { "positive": -7.7970858292735095, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "sector": { "positive": -7.391620721165345, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "adoption": { "positive": -5.851175680218196, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "growing": { "positive": -7.391620721165345, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "emerging": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "markets": { "positive": -7.391620721165345, "negative": -8.51057131510735, "neutral": -6.586516423001513 }, "faster": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "than": { "positive": -7.103938648713564, "negative": -7.4119590264392405, "neutral": -7.279663603561459 }, "analysts": { "positive": -7.391620721165345, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "expected": { "positive": -7.391620721165345, "negative": -7.4119590264392405, "neutral": -7.279663603561459 }, "standard": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "chartered": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "predicts": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "bitcoin": { "positive": -3.9904233395031894, "negative": -4.320916573080925, "neutral": -5.5749155113230335 }, "reach": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "year": { "positive": -6.293008432497235, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "sol": { "positive": -7.103938648713564, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "position": { "positive": -7.391620721165345, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "since": { "positive": -7.103938648713564, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "aped": { "positive": -7.7970858292735095, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "no": { "positive": -7.7970858292735095, "negative": -6.90113340267325, "neutral": -6.181051314893349 }, "regrets": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "all": { "positive": -6.6984735406053995, "negative": -6.313346737771131, "neutral": -7.279663603561459 }, "jp": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "morgan": { "positive": -7.103938648713564, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "upgrades": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "allocation": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "calls": { "positive": -7.7970858292735095, "negative": -7.4119590264392405, "neutral": -7.972810784121404 }, "strategic": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "halving": { "positive": -7.103938648713564, "negative": -8.51057131510735, "neutral": -7.279663603561459 }, "approaches": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "catalyst": { "positive": -7.391620721165345, "negative": -8.51057131510735, "neutral": -7.279663603561459 }, "horizon": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "layer": { "positive": -6.8807950973993535, "negative": -8.51057131510735, "neutral": -6.874198495453294 }, "exploding": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "chain": { "positive": -7.391620721165345, "negative": -6.313346737771131, "neutral": -6.363372871687304 }, "metrics": { "positive": -7.391620721165345, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "extremely": { "positive": -7.7970858292735095, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "hodling": { "positive": -7.391620721165345, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "fundamentals": { "positive": -7.391620721165345, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "stronger": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "etf": { "positive": -5.851175680218196, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "approval": { "positive": -6.005326360045454, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "marks": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "watershed": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "moment": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "institutional": { "positive": -6.8807950973993535, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "finance": { "positive": -7.7970858292735095, "negative": -7.817424134547405, "neutral": -7.279663603561459 }, "best": { "positive": -7.103938648713564, "negative": -8.51057131510735, "neutral": -7.279663603561459 }, "trade": { "positive": -7.391620721165345, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "life": { "positive": -7.391620721165345, "negative": -7.4119590264392405, "neutral": -7.972810784121404 }, "made": { "positive": -7.103938648713564, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "financially": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "tether": { "positive": -6.410791468153619, "negative": -6.718811845879295, "neutral": -7.972810784121404 }, "market": { "positive": -5.851175680218196, "negative": -5.677357971051134, "neutral": -6.181051314893349 }, "cap": { "positive": -7.103938648713564, "negative": -7.817424134547405, "neutral": -7.279663603561459 }, "grows": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "steadily": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "returning": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "saigon": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "based": { "positive": -7.103938648713564, "negative": -6.90113340267325, "neutral": -7.972810784121404 }, "fintech": { "positive": -7.391620721165345, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "wins": { "positive": -6.544322860778141, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "asean": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "award": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "remittance": { "positive": -7.103938648713564, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "app": { "positive": -7.391620721165345, "negative": -7.4119590264392405, "neutral": -7.972810784121404 }, "crossed": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "break": { "positive": -7.103938648713564, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "even": { "positive": -7.391620721165345, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "months": { "positive": -7.391620721165345, "negative": -7.4119590264392405, "neutral": -7.972810784121404 }, "feels": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "amazing": { "positive": -7.391620721165345, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "strong": { "positive": -6.6984735406053995, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "support": { "positive": -6.544322860778141, "negative": -7.12427695398746, "neutral": -7.972810784121404 }, "held": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.279663603561459 }, "day": { "positive": -7.391620721165345, "negative": -6.90113340267325, "neutral": -6.586516423001513 }, "moving": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.279663603561459 }, "average": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.279663603561459 }, "performing": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "asset": { "positive": -7.391620721165345, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "far": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "very": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.279663603561459 }, "first": { "positive": -6.187647916839409, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "profitable": { "positive": -6.293008432497235, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "thanks": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "community": { "positive": -7.391620721165345, "negative": -8.51057131510735, "neutral": -6.363372871687304 }, "optimistic": { "positive": -7.391620721165345, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "outlook": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "veteran": { "positive": -7.7970858292735095, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "analyst": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "says": { "positive": -5.925283652371918, "negative": -5.871513985492092, "neutral": -7.972810784121404 }, "cycle": { "positive": -7.391620721165345, "negative": -7.4119590264392405, "neutral": -7.972810784121404 }, "starting": { "positive": -7.7970858292735095, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "roadmap": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "update": { "positive": -7.391620721165345, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "devs": { "positive": -6.8807950973993535, "negative": -7.4119590264392405, "neutral": -7.972810784121404 }, "delivering": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "exactly": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -6.874198495453294 }, "schedule": { "positive": -7.391620721165345, "negative": -8.51057131510735, "neutral": -7.279663603561459 }, "twitter": { "positive": -7.391620721165345, "negative": -7.12427695398746, "neutral": -7.972810784121404 }, "euphoric": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "rightly": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "so": { "positive": -7.391620721165345, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "look": { "positive": -7.7970858292735095, "negative": -7.817424134547405, "neutral": -7.279663603561459 }, "new": { "positive": -6.092337737035083, "negative": -7.12427695398746, "neutral": -6.586516423001513 }, "treasury": { "positive": -7.103938648713564, "negative": -7.12427695398746, "neutral": -7.972810784121404 }, "policy": { "positive": -7.391620721165345, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "lets": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "corporate": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "reserve": { "positive": -7.391620721165345, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "decentralized": { "positive": -7.7970858292735095, "negative": -7.4119590264392405, "neutral": -7.972810784121404 }, "exchange": { "positive": -5.925283652371918, "negative": -4.772901696823983, "neutral": -6.874198495453294 }, "volumes": { "positive": -7.7970858292735095, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "recover": { "positive": -6.544322860778141, "negative": -7.4119590264392405, "neutral": -7.972810784121404 }, "activity": { "positive": -7.103938648713564, "negative": -8.51057131510735, "neutral": -7.279663603561459 }, "eth": { "positive": -7.103938648713564, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "gas": { "positive": -7.7970858292735095, "negative": -7.817424134547405, "neutral": -6.586516423001513 }, "cheap": { "positive": -7.391620721165345, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "fees": { "positive": -6.8807950973993535, "negative": -8.51057131510735, "neutral": -7.279663603561459 }, "nearly": { "positive": -7.391620721165345, "negative": -7.4119590264392405, "neutral": -7.972810784121404 }, "zero": { "positive": -7.391620721165345, "negative": -6.90113340267325, "neutral": -7.279663603561459 }, "ux": { "positive": -7.391620721165345, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "finally": { "positive": -6.6984735406053995, "negative": -7.4119590264392405, "neutral": -7.972810784121404 }, "there": { "positive": -7.391620721165345, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "structure": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "matured": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "significantly": { "positive": -7.7970858292735095, "negative": -7.4119590264392405, "neutral": -7.972810784121404 }, "mining": { "positive": -5.089035628171299, "negative": -5.945621957645814, "neutral": -6.874198495453294 }, "uses": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "percent": { "positive": -7.391620721165345, "negative": -8.51057131510735, "neutral": -6.874198495453294 }, "renewable": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "energy": { "positive": -6.6984735406053995, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "industry": { "positive": -6.8807950973993535, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "funding": { "positive": -7.7970858292735095, "negative": -7.12427695398746, "neutral": -7.972810784121404 }, "rates": { "positive": -7.7970858292735095, "negative": -7.4119590264392405, "neutral": -7.972810784121404 }, "positive": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "longs": { "positive": -7.7970858292735095, "negative": -7.4119590264392405, "neutral": -7.972810784121404 }, "control": { "positive": -7.391620721165345, "negative": -8.51057131510735, "neutral": -7.279663603561459 }, "momentum": { "positive": -6.6984735406053995, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "undeniable": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "network": { "positive": -7.103938648713564, "negative": -6.90113340267325, "neutral": -6.363372871687304 }, "time": { "positive": -7.103938648713564, "negative": -8.51057131510735, "neutral": -6.874198495453294 }, "high": { "positive": -6.6984735406053995, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "second": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "month": { "positive": -7.103938648713564, "negative": -8.51057131510735, "neutral": -6.181051314893349 }, "friend": { "positive": -7.391620721165345, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "called": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "crazy": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "buying": { "positive": -5.925283652371918, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "asking": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.279663603561459 }, "advice": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "diamond": { "positive": -7.391620721165345, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "hands": { "positive": -7.391620721165345, "negative": -7.4119590264392405, "neutral": -7.972810784121404 }, "won": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "again": { "positive": -6.6984735406053995, "negative": -6.564661166052037, "neutral": -7.972810784121404 }, "never": { "positive": -7.7970858292735095, "negative": -6.718811845879295, "neutral": -7.972810784121404 }, "doubted": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "conviction": { "positive": -7.391620721165345, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "paid": { "positive": -7.391620721165345, "negative": -7.4119590264392405, "neutral": -7.972810784121404 }, "off": { "positive": -6.8807950973993535, "negative": -7.12427695398746, "neutral": -7.972810784121404 }, "big": { "positive": -6.6984735406053995, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "self": { "positive": -7.391620721165345, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "proud": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "stablecoin": { "positive": -5.024497107033728, "negative": -5.945621957645814, "neutral": -7.279663603561459 }, "philippines": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "saves": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "families": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "thousands": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "monthly": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.279663603561459 }, "onboarding": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "flow": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "wallet": { "positive": -7.103938648713564, "negative": -6.90113340267325, "neutral": -6.181051314893349 }, "nailed": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "completely": { "positive": -7.7970858292735095, "negative": -7.12427695398746, "neutral": -7.972810784121404 }, "textbook": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "breakout": { "positive": -7.391620721165345, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "multi": { "positive": -7.7970858292735095, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "accumulation": { "positive": -7.391620721165345, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "pattern": { "positive": -7.391620721165345, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "across": { "positive": -7.103938648713564, "negative": -7.4119590264392405, "neutral": -6.586516423001513 }, "majors": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "alt": { "positive": -7.103938648713564, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "season": { "positive": -7.103938648713564, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "near": { "positive": -7.7970858292735095, "negative": -7.12427695398746, "neutral": -7.972810784121404 }, "education": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "startup": { "positive": -7.391620721165345, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "raises": { "positive": -6.410791468153619, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "mission": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "gaining": { "positive": -7.391620721165345, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "traction": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "sentiment": { "positive": -7.391620721165345, "negative": -6.90113340267325, "neutral": -7.972810784121404 }, "turns": { "positive": -7.7970858292735095, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "macro": { "positive": -7.391620721165345, "negative": -7.12427695398746, "neutral": -7.279663603561459 }, "fears": { "positive": -7.7970858292735095, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "ease": { "positive": -7.391620721165345, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "blackrock": { "positive": -7.391620721165345, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "buys": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "another": { "positive": -6.6984735406053995, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "spot": { "positive": -6.6984735406053995, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "week": { "positive": -7.103938648713564, "negative": -7.12427695398746, "neutral": -6.363372871687304 }, "major": { "positive": -6.8807950973993535, "negative": -7.12427695398746, "neutral": -6.874198495453294 }, "retailer": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "announces": { "positive": -7.103938648713564, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "accept": { "positive": -7.391620721165345, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "nationwide": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "visa": { "positive": -7.391620721165345, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "partners": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "solana": { "positive": -6.6984735406053995, "negative": -6.431129773427514, "neutral": -7.972810784121404 }, "settle": { "positive": -7.7970858292735095, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "cross": { "positive": -7.7970858292735095, "negative": -7.12427695398746, "neutral": -7.972810784121404 }, "border": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "payments": { "positive": -6.544322860778141, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "retail": { "positive": -7.103938648713564, "negative": -7.12427695398746, "neutral": -7.972810784121404 }, "investors": { "positive": -7.391620721165345, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "net": { "positive": -7.7970858292735095, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "buyers": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "dca": { "positive": -7.391620721165345, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "over": { "positive": -6.6984735406053995, "negative": -6.11267604230898, "neutral": -7.972810784121404 }, "last": { "positive": -6.6984735406053995, "negative": -7.12427695398746, "neutral": -6.363372871687304 }, "outperformed": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "handily": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "open": { "positive": -7.103938648713564, "negative": -8.51057131510735, "neutral": -6.874198495453294 }, "interest": { "positive": -7.103938648713564, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "spiking": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "continuation": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "rebound": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "full": { "positive": -7.391620721165345, "negative": -7.4119590264392405, "neutral": -7.279663603561459 }, "swing": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "fear": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "greed": { "positive": -7.391620721165345, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "flipping": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "ecosystem": { "positive": -7.103938648713564, "negative": -7.4119590264392405, "neutral": -7.972810784121404 }, "reaches": { "positive": -7.391620721165345, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "billion": { "positive": -7.7970858292735095, "negative": -7.4119590264392405, "neutral": -7.279663603561459 }, "tvl": { "positive": -7.391620721165345, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "sustainable": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "growth": { "positive": -7.103938648713564, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "recovers": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "losses": { "positive": -7.7970858292735095, "negative": -6.431129773427514, "neutral": -7.972810784121404 }, "quarter": { "positive": -7.391620721165345, "negative": -7.817424134547405, "neutral": -7.279663603561459 }, "macroeconomic": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.279663603561459 }, "tailwinds": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "align": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "beautifully": { "positive": -7.391620721165345, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "digital": { "positive": -6.8807950973993535, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "assets": { "positive": -6.8807950973993535, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "gold": { "positive": -6.8807950973993535, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "figuring": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "out": { "positive": -6.6984735406053995, "negative": -5.80252111400514, "neutral": -7.972810784121404 }, "approved": { "positive": -6.8807950973993535, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "waiting": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.279663603561459 }, "bag": { "positive": -7.7970858292735095, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "mooning": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "today": { "positive": -7.103938648713564, "negative": -7.817424134547405, "neutral": -5.775586206785185 }, "getting": { "positive": -7.7970858292735095, "negative": -6.90113340267325, "neutral": -7.972810784121404 }, "lambo": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "ethereum": { "positive": -5.024497107033728, "negative": -5.871513985492092, "neutral": -6.874198495453294 }, "staking": { "positive": -7.7970858292735095, "negative": -7.817424134547405, "neutral": -6.874198495453294 }, "yield": { "positive": -7.391620721165345, "negative": -7.12427695398746, "neutral": -7.972810784121404 }, "ticks": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "validators": { "positive": -7.7970858292735095, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "happy": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "fed": { "positive": -7.7970858292735095, "negative": -7.4119590264392405, "neutral": -7.972810784121404 }, "dovish": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "pivot": { "positive": -7.7970858292735095, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "lifts": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "risk": { "positive": -7.391620721165345, "negative": -6.90113340267325, "neutral": -7.972810784121404 }, "rallies": { "positive": -7.391620721165345, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "hard": { "positive": -7.103938648713564, "negative": -6.90113340267325, "neutral": -7.972810784121404 }, "stacked": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "more": { "positive": -6.410791468153619, "negative": -7.12427695398746, "neutral": -7.279663603561459 }, "sats": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "dip": { "positive": -7.391620721165345, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "strategy": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "still": { "positive": -7.391620721165345, "negative": -8.51057131510735, "neutral": -7.279663603561459 }, "working": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.279663603561459 }, "massive": { "positive": -7.103938648713564, "negative": -6.718811845879295, "neutral": -7.972810784121404 }, "inflows": { "positive": -7.103938648713564, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "offset": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "miner": { "positive": -6.8807950973993535, "negative": -6.90113340267325, "neutral": -7.279663603561459 }, "selling": { "positive": -7.391620721165345, "negative": -6.718811845879295, "neutral": -7.972810784121404 }, "holds": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.279663603561459 }, "firm": { "positive": -6.293008432497235, "negative": -7.4119590264392405, "neutral": -7.972810784121404 }, "fire": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "nonstop": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "vietnam": { "positive": -7.103938648713564, "negative": -7.817424134547405, "neutral": -7.279663603561459 }, "ranks": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "top": { "positive": -7.7970858292735095, "negative": -7.4119590264392405, "neutral": -7.279663603561459 }, "globally": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "index": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "demand": { "positive": -7.391620721165345, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "continues": { "positive": -6.8807950973993535, "negative": -7.4119590264392405, "neutral": -7.972810784121404 }, "fourth": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "realized": { "positive": -7.391620721165345, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "am": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "bull": { "positive": -5.717644287593673, "negative": -8.51057131510735, "neutral": -7.279663603561459 }, "unreal": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "smart": { "positive": -7.391620721165345, "negative": -6.718811845879295, "neutral": -7.972810784121404 }, "contract": { "positive": -7.7970858292735095, "negative": -7.12427695398746, "neutral": -7.972810784121404 }, "audit": { "positive": -7.7970858292735095, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "cleared": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "pros": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "trust": { "positive": -7.7970858292735095, "negative": -7.4119590264392405, "neutral": -7.972810784121404 }, "well": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "dominance": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "falling": { "positive": -7.7970858292735095, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "officially": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "underway": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "book": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "bank": { "positive": -6.6984735406053995, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "quietly": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "opens": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "custody": { "positive": -7.391620721165345, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "wealth": { "positive": -7.391620721165345, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "clients": { "positive": -7.391620721165345, "negative": -7.817424134547405, "neutral": -6.874198495453294 }, "receives": { "positive": -7.391620721165345, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "official": { "positive": -7.103938648713564, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "sec": { "positive": -6.6984735406053995, "negative": -5.80252111400514, "neutral": -7.972810784121404 }, "setup": { "positive": -7.391620721165345, "negative": -8.51057131510735, "neutral": -6.874198495453294 }, "looks": { "positive": -7.391620721165345, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "chefs": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "kiss": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "end": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "rate": { "positive": -6.6984735406053995, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "cut": { "positive": -7.103938648713564, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "bets": { "positive": -7.391620721165345, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "loses": { "positive": -7.7970858292735095, "negative": -7.4119590264392405, "neutral": -7.972810784121404 }, "coinbase": { "positive": -5.158028499658251, "negative": -5.252474777085869, "neutral": -7.972810784121404 }, "reports": { "positive": -7.391620721165345, "negative": -7.4119590264392405, "neutral": -7.972810784121404 }, "record": { "positive": -6.293008432497235, "negative": -7.12427695398746, "neutral": -7.972810784121404 }, "quarterly": { "positive": -7.7970858292735095, "negative": -7.817424134547405, "neutral": -6.586516423001513 }, "revenue": { "positive": -6.8807950973993535, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "profitability": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "surprise": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "insane": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "early": { "positive": -7.7970858292735095, "negative": -7.4119590264392405, "neutral": -7.972810784121404 }, "party": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "money": { "positive": -6.8807950973993535, "negative": -6.431129773427514, "neutral": -7.972810784121404 }, "rotating": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "ahead": { "positive": -7.391620721165345, "negative": -7.817424134547405, "neutral": -7.279663603561459 }, "event": { "positive": -7.7970858292735095, "negative": -7.4119590264392405, "neutral": -7.972810784121404 }, "broke": { "positive": -7.7970858292735095, "negative": -7.4119590264392405, "neutral": -7.972810784121404 }, "wedge": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "parabolic": { "positive": -7.103938648713564, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "move": { "positive": -7.391620721165345, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "incoming": { "positive": -7.7970858292735095, "negative": -7.4119590264392405, "neutral": -7.972810784121404 }, "imo": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "arbitrum": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "hits": { "positive": -6.8807950973993535, "negative": -7.12427695398746, "neutral": -7.972810784121404 }, "defi": { "positive": -7.7970858292735095, "negative": -6.11267604230898, "neutral": -7.972810784121404 }, "returns": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "upgrade": { "positive": -6.092337737035083, "negative": -8.51057131510735, "neutral": -6.874198495453294 }, "goes": { "positive": -7.103938648713564, "negative": -7.4119590264392405, "neutral": -7.972810784121404 }, "live": { "positive": -6.8807950973993535, "negative": -7.4119590264392405, "neutral": -7.972810784121404 }, "transaction": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -6.586516423001513 }, "drop": { "positive": -7.7970858292735095, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "prediction": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "model": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "continued": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "upside": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "printed": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "ath": { "positive": -7.391620721165345, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "only": { "positive": -7.391620721165345, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "beginning": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "lfg": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "lightning": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.279663603561459 }, "capacity": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "milestone": { "positive": -6.8807950973993535, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "mainnet": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "ships": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "throughput": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "previous": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "confirmed": { "positive": -7.7970858292735095, "negative": -6.90113340267325, "neutral": -7.972810784121404 }, "technical": { "positive": -7.7970858292735095, "negative": -7.817424134547405, "neutral": -6.874198495453294 }, "paypal": { "positive": -7.7970858292735095, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "expands": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "european": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "countries": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "doubled": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "stack": { "positive": -7.391620721165345, "negative": -7.4119590264392405, "neutral": -7.972810784121404 }, "december": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "plan": { "positive": -7.103938648713564, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "worked": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "central": { "positive": -7.391620721165345, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "pilots": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "settlement": { "positive": -7.7970858292735095, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "cheer": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "reclaimed": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "psychological": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "level": { "positive": -7.7970858292735095, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "becomes": { "positive": -7.391620721165345, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "deflationary": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "shrink": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "surges": { "positive": -6.8807950973993535, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "past": { "positive": -7.391620721165345, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "hit": { "positive": -7.391620721165345, "negative": -7.12427695398746, "neutral": -7.972810784121404 }, "run": { "positive": -6.187647916839409, "negative": -8.51057131510735, "neutral": -6.874198495453294 }, "sticking": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "partnership": { "positive": -6.544322860778141, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "announcement": { "positive": -7.391620721165345, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "token": { "positive": -7.103938648713564, "negative": -6.431129773427514, "neutral": -7.279663603561459 }, "ripping": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "one": { "positive": -7.391620721165345, "negative": -7.12427695398746, "neutral": -7.972810784121404 }, "hour": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.279663603561459 }, "grandma": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "asked": { "positive": -7.7970858292735095, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "fomo": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "heating": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "rumored": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "works": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.279663603561459 }, "super": { "positive": -7.391620721165345, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "revives": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "google": { "positive": -7.391620721165345, "negative": -7.12427695398746, "neutral": -7.972810784121404 }, "searches": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "double": { "positive": -6.8807950973993535, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "wagmi": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "here": { "positive": -7.103938648713564, "negative": -7.817424134547405, "neutral": -6.874198495453294 }, "alts": { "positive": -7.7970858292735095, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "pumping": { "positive": -7.391620721165345, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "digits": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "board": { "positive": -7.7970858292735095, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "thesis": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "playing": { "positive": -7.7970858292735095, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "patience": { "positive": -7.391620721165345, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "rewarded": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "once": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "collapse": { "positive": -7.7970858292735095, "negative": -6.207986222113305, "neutral": -7.972810784121404 }, "user": { "positive": -7.7970858292735095, "negative": -7.12427695398746, "neutral": -7.972810784121404 }, "experience": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.279663603561459 }, "par": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "web": { "positive": -7.103938648713564, "negative": -7.4119590264392405, "neutral": -7.972810784121404 }, "serious": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "profit": { "positive": -6.293008432497235, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "deal": { "positive": -7.103938648713564, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "numbers": { "positive": -7.7970858292735095, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "charts": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "users": { "positive": -7.391620721165345, "negative": -6.431129773427514, "neutral": -7.279663603561459 }, "coins": { "positive": -7.103938648713564, "negative": -7.12427695398746, "neutral": -7.972810784121404 }, "hashrate": { "positive": -7.391620721165345, "negative": -7.817424134547405, "neutral": -6.874198495453294 }, "breaks": { "positive": -7.7970858292735095, "negative": -7.4119590264392405, "neutral": -7.972810784121404 }, "signaling": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "strength": { "positive": -7.391620721165345, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "launches": { "positive": -7.103938648713564, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "lineup": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "paying": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "portfolio": { "positive": -6.8807950973993535, "negative": -7.12427695398746, "neutral": -7.972810784121404 }, "changing": { "positive": -7.391620721165345, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "territory": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "absorbed": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "without": { "positive": -7.391620721165345, "negative": -8.51057131510735, "neutral": -7.279663603561459 }, "flinching": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "ending": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "continue": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "absorb": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "turning": { "positive": -7.7970858292735095, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "around": { "positive": -7.7970858292735095, "negative": -7.817424134547405, "neutral": -7.279663603561459 }, "optimism": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "contagious": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "negative": { "positive": -8.490233009833455, "negative": -7.4119590264392405, "neutral": -7.972810784121404 }, "shorts": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "piling": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "down": { "positive": -7.391620721165345, "negative": -5.56613233594091, "neutral": -7.972810784121404 }, "sells": { "positive": -8.490233009833455, "negative": -7.4119590264392405, "neutral": -7.972810784121404 }, "entire": { "positive": -8.490233009833455, "negative": -6.718811845879295, "neutral": -7.972810784121404 }, "bottom": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "capitulation": { "positive": -8.490233009833455, "negative": -6.564661166052037, "neutral": -7.972810784121404 }, "vc": { "positive": -8.490233009833455, "negative": -7.4119590264392405, "neutral": -7.972810784121404 }, "dead": { "positive": -8.490233009833455, "negative": -6.207986222113305, "neutral": -7.972810784121404 }, "projects": { "positive": -8.490233009833455, "negative": -7.4119590264392405, "neutral": -7.972810784121404 }, "talent": { "positive": -7.7970858292735095, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "leaving": { "positive": -8.490233009833455, "negative": -7.4119590264392405, "neutral": -7.972810784121404 }, "daily": { "positive": -8.490233009833455, "negative": -7.4119590264392405, "neutral": -6.586516423001513 }, "exploit": { "positive": -8.490233009833455, "negative": -6.207986222113305, "neutral": -7.972810784121404 }, "drains": { "positive": -7.7970858292735095, "negative": -7.12427695398746, "neutral": -7.972810784121404 }, "instantly": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "regulator": { "positive": -7.7970858292735095, "negative": -7.4119590264392405, "neutral": -7.972810784121404 }, "bans": { "positive": -8.490233009833455, "negative": -7.4119590264392405, "neutral": -7.972810784121404 }, "advertising": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "found": { "positive": -8.490233009833455, "negative": -7.12427695398746, "neutral": -7.972810784121404 }, "project": { "positive": -8.490233009833455, "negative": -6.718811845879295, "neutral": -7.972810784121404 }, "invested": { "positive": -8.490233009833455, "negative": -7.4119590264392405, "neutral": -7.972810784121404 }, "complete": { "positive": -8.490233009833455, "negative": -7.4119590264392405, "neutral": -7.279663603561459 }, "scam": { "positive": -8.490233009833455, "negative": -4.955223253617937, "neutral": -7.972810784121404 }, "crashes": { "positive": -8.490233009833455, "negative": -6.564661166052037, "neutral": -7.972810784121404 }, "hot": { "positive": -8.490233009833455, "negative": -7.4119590264392405, "neutral": -7.972810784121404 }, "cpi": { "positive": -8.490233009833455, "negative": -7.4119590264392405, "neutral": -7.972810784121404 }, "print": { "positive": -8.490233009833455, "negative": -7.4119590264392405, "neutral": -7.972810784121404 }, "leverage": { "positive": -8.490233009833455, "negative": -6.90113340267325, "neutral": -7.972810784121404 }, "flush": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "hopes": { "positive": -8.490233009833455, "negative": -7.4119590264392405, "neutral": -7.972810784121404 }, "recovery": { "positive": -7.7970858292735095, "negative": -6.90113340267325, "neutral": -7.972810784121404 }, "destroyed": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "yet": { "positive": -8.490233009833455, "negative": -7.4119590264392405, "neutral": -7.279663603561459 }, "flash": { "positive": -8.490233009833455, "negative": -7.12427695398746, "neutral": -7.972810784121404 }, "crash": { "positive": -8.490233009833455, "negative": -5.514839041553359, "neutral": -7.972810784121404 }, "morning": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "unfolding": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "ponzi": { "positive": -8.490233009833455, "negative": -6.11267604230898, "neutral": -7.972810784121404 }, "scheme": { "positive": -8.490233009833455, "negative": -6.90113340267325, "neutral": -7.972810784121404 }, "nobel": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "laureate": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "pressure": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "miners": { "positive": -7.391620721165345, "negative": -7.12427695398746, "neutral": -7.972810784121404 }, "alike": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "got": { "positive": -7.103938648713564, "negative": -6.431129773427514, "neutral": -7.279663603561459 }, "nuked": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "liquidation": { "positive": -8.490233009833455, "negative": -7.4119590264392405, "neutral": -7.972810784121404 }, "cascade": { "positive": -8.490233009833455, "negative": -7.4119590264392405, "neutral": -7.972810784121404 }, "brutal": { "positive": -8.490233009833455, "negative": -7.4119590264392405, "neutral": -7.972810784121404 }, "liquidated": { "positive": -8.490233009833455, "negative": -7.4119590264392405, "neutral": -7.972810784121404 }, "learned": { "positive": -8.490233009833455, "negative": -7.12427695398746, "neutral": -7.972810784121404 }, "expensive": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "lesson": { "positive": -8.490233009833455, "negative": -7.4119590264392405, "neutral": -7.972810784121404 }, "cefi": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "lender": { "positive": -8.490233009833455, "negative": -6.718811845879295, "neutral": -7.972810784121404 }, "suspends": { "positive": -8.490233009833455, "negative": -7.4119590264392405, "neutral": -7.972810784121404 }, "operations": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "indefinitely": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "frozen": { "positive": -8.490233009833455, "negative": -7.12427695398746, "neutral": -7.972810784121404 }, "stop": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "loss": { "positive": -8.490233009833455, "negative": -6.718811845879295, "neutral": -7.972810784121404 }, "hunted": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "reversed": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "makers": { "positive": -8.490233009833455, "negative": -7.4119590264392405, "neutral": -7.972810784121404 }, "dirty": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "going": { "positive": -7.7970858292735095, "negative": -7.12427695398746, "neutral": -7.972810784121404 }, "scorched": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "earth": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "every": { "positive": -8.490233009833455, "negative": -7.12427695398746, "neutral": -7.972810784121404 }, "subpoenaed": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "ugly": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "everywhere": { "positive": -8.490233009833455, "negative": -7.4119590264392405, "neutral": -7.972810784121404 }, "tanking": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "stocks": { "positive": -6.8807950973993535, "negative": -7.4119590264392405, "neutral": -7.279663603561459 }, "hack": { "positive": -8.490233009833455, "negative": -4.984210790491189, "neutral": -7.972810784121404 }, "million": { "positive": -7.7970858292735095, "negative": -7.12427695398746, "neutral": -7.972810784121404 }, "dollars": { "positive": -8.490233009833455, "negative": -7.12427695398746, "neutral": -7.972810784121404 }, "bridge": { "positive": -8.490233009833455, "negative": -7.12427695398746, "neutral": -7.279663603561459 }, "gov": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "cracking": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "terrible": { "positive": -8.490233009833455, "negative": -7.12427695398746, "neutral": -7.972810784121404 }, "winter": { "positive": -7.391620721165345, "negative": -6.718811845879295, "neutral": -7.972810784121404 }, "keeps": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "colder": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "nowhere": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "done": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "dumping": { "positive": -8.490233009833455, "negative": -7.4119590264392405, "neutral": -7.972810784121404 }, "like": { "positive": -7.7970858292735095, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "brick": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "leveraged": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "absolutely": { "positive": -8.490233009833455, "negative": -7.12427695398746, "neutral": -7.972810784121404 }, "cooked": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "bear": { "positive": -8.490233009833455, "negative": -6.564661166052037, "neutral": -7.972810784121404 }, "flag": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "forms": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "chart": { "positive": -7.7970858292735095, "negative": -7.817424134547405, "neutral": -6.586516423001513 }, "lower": { "positive": -8.490233009833455, "negative": -7.4119590264392405, "neutral": -7.972810784121404 }, "lows": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "likely": { "positive": -7.7970858292735095, "negative": -7.12427695398746, "neutral": -7.972810784121404 }, "froze": { "positive": -8.490233009833455, "negative": -7.4119590264392405, "neutral": -7.972810784121404 }, "withdrawals": { "positive": -7.7970858292735095, "negative": -7.12427695398746, "neutral": -7.972810784121404 }, "gone": { "positive": -8.490233009833455, "negative": -7.12427695398746, "neutral": -7.972810784121404 }, "forever": { "positive": -8.490233009833455, "negative": -7.4119590264392405, "neutral": -7.972810784121404 }, "investor": { "positive": -8.490233009833455, "negative": -7.12427695398746, "neutral": -7.972810784121404 }, "faces": { "positive": -7.7970858292735095, "negative": -7.12427695398746, "neutral": -7.972810784121404 }, "criminal": { "positive": -8.490233009833455, "negative": -7.4119590264392405, "neutral": -7.972810784121404 }, "charges": { "positive": -8.490233009833455, "negative": -6.431129773427514, "neutral": -7.972810784121404 }, "promoting": { "positive": -8.490233009833455, "negative": -7.4119590264392405, "neutral": -7.972810784121404 }, "fraudulent": { "positive": -8.490233009833455, "negative": -6.718811845879295, "neutral": -7.972810784121404 }, "pool": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.279663603561459 }, "grim": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "report": { "positive": -6.8807950973993535, "negative": -7.4119590264392405, "neutral": -6.874198495453294 }, "shows": { "positive": -7.7970858292735095, "negative": -7.817424134547405, "neutral": -6.874198495453294 }, "abandoning": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "platform": { "positive": -7.391620721165345, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "tax": { "positive": -7.391620721165345, "negative": -7.817424134547405, "neutral": -7.279663603561459 }, "authority": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "fines": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "heavily": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "unreported": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "media": { "positive": -7.7970858292735095, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "pump": { "positive": -7.103938648713564, "negative": -7.4119590264392405, "neutral": -7.972810784121404 }, "dump": { "positive": -8.490233009833455, "negative": -7.4119590264392405, "neutral": -7.972810784121404 }, "shills": { "positive": -8.490233009833455, "negative": -7.4119590264392405, "neutral": -7.972810784121404 }, "rotten": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "telegrams": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "worst": { "positive": -8.490233009833455, "negative": -7.12427695398746, "neutral": -7.972810784121404 }, "seen": { "positive": -8.490233009833455, "negative": -7.4119590264392405, "neutral": -7.972810784121404 }, "unbearable": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "half": { "positive": -8.490233009833455, "negative": -7.4119590264392405, "neutral": -7.279663603561459 }, "friends": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "quit": { "positive": -8.490233009833455, "negative": -7.4119590264392405, "neutral": -7.972810784121404 }, "space": { "positive": -8.490233009833455, "negative": -7.4119590264392405, "neutral": -7.972810784121404 }, "already": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "mt": { "positive": -8.490233009833455, "negative": -7.12427695398746, "neutral": -7.972810784121404 }, "gox": { "positive": -8.490233009833455, "negative": -7.12427695398746, "neutral": -7.972810784121404 }, "style": { "positive": -8.490233009833455, "negative": -7.4119590264392405, "neutral": -7.972810784121404 }, "signs": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "ordered": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "halt": { "positive": -8.490233009833455, "negative": -7.4119590264392405, "neutral": -7.972810784121404 }, "trading": { "positive": -6.6984735406053995, "negative": -7.12427695398746, "neutral": -6.874198495453294 }, "government": { "positive": -7.7970858292735095, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "rigged": { "positive": -8.490233009833455, "negative": -7.4119590264392405, "neutral": -7.972810784121404 }, "always": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "gets": { "positive": -7.7970858292735095, "negative": -7.4119590264392405, "neutral": -7.972810784121404 }, "dumped": { "positive": -8.490233009833455, "negative": -6.90113340267325, "neutral": -7.972810784121404 }, "whales": { "positive": -8.490233009833455, "negative": -7.4119590264392405, "neutral": -7.972810784121404 }, "brace": { "positive": -8.490233009833455, "negative": -7.12427695398746, "neutral": -7.972810784121404 }, "years": { "positive": -7.7970858292735095, "negative": -6.718811845879295, "neutral": -7.279663603561459 }, "pain": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "fud": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "multisig": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.279663603561459 }, "compromised": { "positive": -8.490233009833455, "negative": -7.4119590264392405, "neutral": -7.972810784121404 }, "funds": { "positive": -7.7970858292735095, "negative": -6.02566466531935, "neutral": -7.972810784121404 }, "drained": { "positive": -8.490233009833455, "negative": -6.431129773427514, "neutral": -7.972810784121404 }, "minutes": { "positive": -8.490233009833455, "negative": -7.4119590264392405, "neutral": -7.279663603561459 }, "death": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "weekly": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "technicals": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "because": { "positive": -7.7970858292735095, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "cannot": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "face": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "anti": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "bill": { "positive": -7.103938648713564, "negative": -7.4119590264392405, "neutral": -7.972810784121404 }, "introduced": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "congress": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "under": { "positive": -7.103938648713564, "negative": -6.90113340267325, "neutral": -6.874198495453294 }, "existential": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "threat": { "positive": -8.490233009833455, "negative": -7.12427695398746, "neutral": -7.972810784121404 }, "halts": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "two": { "positive": -8.490233009833455, "negative": -6.564661166052037, "neutral": -7.972810784121404 }, "hours": { "positive": -7.7970858292735095, "negative": -6.90113340267325, "neutral": -7.972810784121404 }, "panicking": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "bleeding": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "red": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "coin": { "positive": -6.410791468153619, "negative": -6.90113340267325, "neutral": -7.972810784121404 }, "abandoned": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "founders": { "positive": -7.7970858292735095, "negative": -6.90113340267325, "neutral": -7.972810784121404 }, "ago": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.279663603561459 }, "breaking": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "triangle": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "launcher": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "exits": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "victims": { "positive": -8.490233009833455, "negative": -7.4119590264392405, "neutral": -7.972810784121404 }, "luck": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "shambles": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "wants": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "touch": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "anymore": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "fade": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "environment": { "positive": -7.7970858292735095, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "worsens": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "failed": { "positive": -8.490233009833455, "negative": -6.718811845879295, "neutral": -7.972810784121404 }, "resistance": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.279663603561459 }, "downtrend": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "multiple": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "indicators": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.279663603561459 }, "lessons": { "positive": -7.7970858292735095, "negative": -7.4119590264392405, "neutral": -7.972810784121404 }, "way": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "tumbles": { "positive": -8.490233009833455, "negative": -6.90113340267325, "neutral": -7.972810784121404 }, "outflows": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "accelerate": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "weak": { "positive": -8.490233009833455, "negative": -7.4119590264392405, "neutral": -7.972810784121404 }, "shaken": { "positive": -8.490233009833455, "negative": -7.12427695398746, "neutral": -7.972810784121404 }, "savings": { "positive": -8.490233009833455, "negative": -7.12427695398746, "neutral": -7.972810784121404 }, "family": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "forgive": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "target": { "positive": -8.490233009833455, "negative": -7.4119590264392405, "neutral": -7.972810784121404 }, "bad": { "positive": -8.490233009833455, "negative": -7.12427695398746, "neutral": -7.972810784121404 }, "regret": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "everything": { "positive": -8.490233009833455, "negative": -7.12427695398746, "neutral": -7.972810784121404 }, "phished": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "lost": { "positive": -8.490233009833455, "negative": -5.871513985492092, "neutral": -7.972810784121404 }, "fault": { "positive": -8.490233009833455, "negative": -7.4119590264392405, "neutral": -7.972810784121404 }, "careless": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "online": { "positive": -7.7970858292735095, "negative": -7.4119590264392405, "neutral": -7.972810784121404 }, "exit": { "positive": -8.490233009833455, "negative": -6.564661166052037, "neutral": -7.972810784121404 }, "providers": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "wiped": { "positive": -7.7970858292735095, "negative": -7.4119590264392405, "neutral": -7.972810784121404 }, "sudden": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "depeg": { "positive": -8.490233009833455, "negative": -7.4119590264392405, "neutral": -7.972810784121404 }, "tokens": { "positive": -8.490233009833455, "negative": -6.431129773427514, "neutral": -7.972810784121404 }, "classic": { "positive": -7.7970858292735095, "negative": -7.4119590264392405, "neutral": -7.972810784121404 }, "rug": { "positive": -8.490233009833455, "negative": -6.313346737771131, "neutral": -7.972810784121404 }, "pull": { "positive": -8.490233009833455, "negative": -6.564661166052037, "neutral": -7.972810784121404 }, "six": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "figures": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "disappeared": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "entirely": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "wall": { "positive": -7.7970858292735095, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "order": { "positive": -7.7970858292735095, "negative": -7.817424134547405, "neutral": -7.279663603561459 }, "books": { "positive": -7.391620721165345, "negative": -7.817424134547405, "neutral": -7.279663603561459 }, "bears": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "defending": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "key": { "positive": -8.490233009833455, "negative": -7.4119590264392405, "neutral": -7.972810784121404 }, "firmly": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "learn": { "positive": -7.7970858292735095, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "mistake": { "positive": -7.7970858292735095, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "home": { "positive": -7.7970858292735095, "negative": -7.817424134547405, "neutral": -7.279663603561459 }, "despair": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "palpable": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "maxis": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "peg": { "positive": -8.490233009833455, "negative": -7.4119590264392405, "neutral": -7.972810784121404 }, "becoming": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "systemic": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "grinds": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "closer": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "each": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "sued": { "positive": -8.490233009833455, "negative": -7.4119590264392405, "neutral": -7.972810784121404 }, "misleading": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "statements": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "reserves": { "positive": -7.7970858292735095, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "whale": { "positive": -7.391620721165345, "negative": -7.4119590264392405, "neutral": -7.972810784121404 }, "viciously": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "spikes": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "complain": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "altcoin": { "positive": -7.391620721165345, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "feeling": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "rugged": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "dreams": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "bagholders": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "left": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "holding": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.279663603561459 }, "worthless": { "positive": -8.490233009833455, "negative": -7.12427695398746, "neutral": -7.972810784121404 }, "contracts": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "unaudited": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "dangerous": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "liquidations": { "positive": -8.490233009833455, "negative": -7.12427695398746, "neutral": -7.972810784121404 }, "exceed": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "get": { "positive": -8.490233009833455, "negative": -7.4119590264392405, "neutral": -7.972810784121404 }, "rekt": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "tokenomics": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "broken": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "design": { "positive": -7.391620721165345, "negative": -7.817424134547405, "neutral": -6.874198495453294 }, "sale": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "closed": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -6.586516423001513 }, "admin": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "keys": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "famous": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "fund": { "positive": -7.391620721165345, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "manager": { "positive": -7.391620721165345, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "collapses": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "overnight": { "positive": -8.490233009833455, "negative": -7.12427695398746, "neutral": -7.972810784121404 }, "farm": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "vulnerabilities": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "persist": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "collapsing": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "rapidly": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "enforcement": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "action": { "positive": -8.490233009833455, "negative": -6.90113340267325, "neutral": -7.279663603561459 }, "targets": { "positive": -8.490233009833455, "negative": -7.4119590264392405, "neutral": -7.972810784121404 }, "pauses": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "counterparty": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "default": { "positive": -8.490233009833455, "negative": -7.4119590264392405, "neutral": -7.972810784121404 }, "contagion": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "founder": { "positive": -7.7970858292735095, "negative": -6.564661166052037, "neutral": -7.972810784121404 }, "absconds": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "suspected": { "positive": -8.490233009833455, "negative": -7.4119590264392405, "neutral": -7.972810784121404 }, "cratered": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "collapsed": { "positive": -8.490233009833455, "negative": -6.90113340267325, "neutral": -7.972810784121404 }, "within": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -6.874198495453294 }, "launch": { "positive": -6.005326360045454, "negative": -7.4119590264392405, "neutral": -7.972810784121404 }, "ma": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "breakdown": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.279663603561459 }, "severe": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "hacked": { "positive": -7.7970858292735095, "negative": -5.214734449103021, "neutral": -7.972810784121404 }, "attackers": { "positive": -8.490233009833455, "negative": -7.4119590264392405, "neutral": -7.972810784121404 }, "usd": { "positive": -7.391620721165345, "negative": -7.12427695398746, "neutral": -7.972810784121404 }, "bubble": { "positive": -8.490233009833455, "negative": -7.12427695398746, "neutral": -7.972810784121404 }, "burst": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "economist": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "customer": { "positive": -8.490233009833455, "negative": -6.718811845879295, "neutral": -7.972810784121404 }, "process": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "take": { "positive": -7.7970858292735095, "negative": -7.4119590264392405, "neutral": -7.972810784121404 }, "triggered": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "decisively": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "active": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.279663603561459 }, "developers": { "positive": -7.7970858292735095, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "many": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "chains": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "bug": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "allowed": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "attacker": { "positive": -7.7970858292735095, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "mint": { "positive": -8.490233009833455, "negative": -7.4119590264392405, "neutral": -7.972810784121404 }, "infinite": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "activates": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "dormancy": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "panic": { "positive": -8.490233009833455, "negative": -7.4119590264392405, "neutral": -7.972810784121404 }, "seed": { "positive": -8.490233009833455, "negative": -7.4119590264392405, "neutral": -7.279663603561459 }, "phrase": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.279663603561459 }, "own": { "positive": -7.7970858292735095, "negative": -7.4119590264392405, "neutral": -7.972810784121404 }, "influencer": { "positive": -8.490233009833455, "negative": -7.4119590264392405, "neutral": -7.972810784121404 }, "arrested": { "positive": -8.490233009833455, "negative": -6.313346737771131, "neutral": -7.972810784121404 }, "company": { "positive": -7.391620721165345, "negative": -7.12427695398746, "neutral": -7.972810784121404 }, "files": { "positive": -7.7970858292735095, "negative": -6.11267604230898, "neutral": -7.972810784121404 }, "chapter": { "positive": -8.490233009833455, "negative": -7.4119590264392405, "neutral": -7.972810784121404 }, "amid": { "positive": -7.7970858292735095, "negative": -6.718811845879295, "neutral": -7.279663603561459 }, "hash": { "positive": -7.7970858292735095, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "bankruptcy": { "positive": -8.490233009833455, "negative": -5.737982592867569, "neutral": -7.972810784121404 }, "back": { "positive": -7.391620721165345, "negative": -7.12427695398746, "neutral": -7.972810784121404 }, "vengeance": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "hodlers": { "positive": -8.490233009833455, "negative": -7.4119590264392405, "neutral": -7.972810784121404 }, "underwater": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "unlock": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.279663603561459 }, "cliff": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "crater": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "throwing": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "towel": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "worth": { "positive": -7.7970858292735095, "negative": -6.718811845879295, "neutral": -7.972810784121404 }, "halved": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "weeks": { "positive": -8.490233009833455, "negative": -7.12427695398746, "neutral": -7.279663603561459 }, "destroying": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "lose": { "positive": -8.490233009833455, "negative": -7.12427695398746, "neutral": -7.972810784121404 }, "millions": { "positive": -8.490233009833455, "negative": -6.718811845879295, "neutral": -7.972810784121404 }, "unregulated": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "overseas": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "steals": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "unsuspecting": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "farmers": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "job": { "positive": -8.490233009833455, "negative": -6.718811845879295, "neutral": -7.972810784121404 }, "cuts": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "expects": { "positive": -7.7970858292735095, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "extended": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "insolvent": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "customers": { "positive": -7.7970858292735095, "negative": -6.90113340267325, "neutral": -7.972810784121404 }, "deposits": { "positive": -8.490233009833455, "negative": -7.4119590264392405, "neutral": -7.972810784121404 }, "team": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "silent": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "social": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "channels": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "clearly": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "pulled": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "ran": { "positive": -8.490233009833455, "negative": -6.90113340267325, "neutral": -7.972810784121404 }, "shitcoin": { "positive": -7.7970858292735095, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "mempool": { "positive": -8.490233009833455, "negative": -8.51057131510735, "neutral": -7.279663603561459 }, "currently": { "positive": -8.490233009833455, "negative": -8.51057131510735, "neutral": -7.279663603561459 }, "sitting": { "positive": -8.490233009833455, "negative": -8.51057131510735, "neutral": -7.279663603561459 }, "pending": { "positive": -8.490233009833455, "negative": -8.51057131510735, "neutral": -7.279663603561459 }, "transactions": { "positive": -7.103938648713564, "negative": -8.51057131510735, "neutral": -6.874198495453294 }, "normal": { "positive": -8.490233009833455, "negative": -8.51057131510735, "neutral": -7.279663603561459 }, "levels": { "positive": -8.490233009833455, "negative": -8.51057131510735, "neutral": -7.279663603561459 }, "fyi": { "positive": -8.490233009833455, "negative": -8.51057131510735, "neutral": -7.279663603561459 }, "reorg": { "positive": -8.490233009833455, "negative": -8.51057131510735, "neutral": -7.279663603561459 }, "block": { "positive": -8.490233009833455, "negative": -8.51057131510735, "neutral": -6.586516423001513 }, "shallow": { "positive": -8.490233009833455, "negative": -8.51057131510735, "neutral": -7.279663603561459 }, "non": { "positive": -8.490233009833455, "negative": -8.51057131510735, "neutral": -7.279663603561459 }, "impactful": { "positive": -8.490233009833455, "negative": -8.51057131510735, "neutral": -7.279663603561459 }, "yesterdays": { "positive": -8.490233009833455, "negative": -8.51057131510735, "neutral": -7.279663603561459 }, "close": { "positive": -8.490233009833455, "negative": -8.51057131510735, "neutral": -7.279663603561459 }, "quiet": { "positive": -8.490233009833455, "negative": -8.51057131510735, "neutral": -6.586516423001513 }, "blockchain": { "positive": -6.005326360045454, "negative": -5.945621957645814, "neutral": -6.874198495453294 }, "conference": { "positive": -8.490233009833455, "negative": -8.51057131510735, "neutral": -7.279663603561459 }, "released": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.279663603561459 }, "explainer": { "positive": -8.490233009833455, "negative": -8.51057131510735, "neutral": -7.279663603561459 }, "post": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -6.874198495453294 }, "how": { "positive": -6.187647916839409, "negative": -6.564661166052037, "neutral": -5.08243902622524 }, "amms": { "positive": -8.490233009833455, "negative": -8.51057131510735, "neutral": -7.279663603561459 }, "swaps": { "positive": -8.490233009833455, "negative": -8.51057131510735, "neutral": -7.279663603561459 }, "using": { "positive": -7.7970858292735095, "negative": -7.4119590264392405, "neutral": -6.874198495453294 }, "constant": { "positive": -8.490233009833455, "negative": -8.51057131510735, "neutral": -7.279663603561459 }, "product": { "positive": -8.490233009833455, "negative": -8.51057131510735, "neutral": -7.279663603561459 }, "formula": { "positive": -8.490233009833455, "negative": -8.51057131510735, "neutral": -7.279663603561459 }, "retrospective": { "positive": -8.490233009833455, "negative": -8.51057131510735, "neutral": -6.874198495453294 }, "merge": { "positive": -7.391620721165345, "negative": -8.51057131510735, "neutral": -7.279663603561459 }, "changed": { "positive": -8.490233009833455, "negative": -8.51057131510735, "neutral": -7.279663603561459 }, "pow": { "positive": -8.490233009833455, "negative": -8.51057131510735, "neutral": -7.279663603561459 }, "pos": { "positive": -8.490233009833455, "negative": -8.51057131510735, "neutral": -7.279663603561459 }, "mechanics": { "positive": -8.490233009833455, "negative": -8.51057131510735, "neutral": -7.279663603561459 }, "oracles": { "positive": -8.490233009833455, "negative": -8.51057131510735, "neutral": -7.279663603561459 }, "aggregate": { "positive": -8.490233009833455, "negative": -8.51057131510735, "neutral": -7.279663603561459 }, "data": { "positive": -6.8807950973993535, "negative": -7.4119590264392405, "neutral": -6.363372871687304 }, "looking": { "positive": -8.490233009833455, "negative": -8.51057131510735, "neutral": -6.181051314893349 }, "references": { "positive": -8.490233009833455, "negative": -8.51057131510735, "neutral": -7.279663603561459 }, "documentation": { "positive": -8.490233009833455, "negative": -8.51057131510735, "neutral": -6.586516423001513 }, "knowledge": { "positive": -8.490233009833455, "negative": -8.51057131510735, "neutral": -7.279663603561459 }, "proofs": { "positive": -8.490233009833455, "negative": -8.51057131510735, "neutral": -7.279663603561459 }, "work": { "positive": -8.490233009833455, "negative": -7.12427695398746, "neutral": -6.586516423001513 }, "mathematically": { "positive": -8.490233009833455, "negative": -8.51057131510735, "neutral": -7.279663603561459 }, "curious": { "positive": -8.490233009833455, "negative": -8.51057131510735, "neutral": -6.363372871687304 }, "everyone": { "positive": -8.490233009833455, "negative": -8.51057131510735, "neutral": -6.363372871687304 }, "organizes": { "positive": -8.490233009833455, "negative": -8.51057131510735, "neutral": -7.279663603561459 }, "bookkeeping": { "positive": -8.490233009833455, "negative": -8.51057131510735, "neutral": -7.279663603561459 }, "wallets": { "positive": -7.7970858292735095, "negative": -7.817424134547405, "neutral": -6.586516423001513 }, "anyone": { "positive": -8.490233009833455, "negative": -8.51057131510735, "neutral": -6.586516423001513 }, "know": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.279663603561459 }, "filter": { "positive": -8.490233009833455, "negative": -8.51057131510735, "neutral": -7.279663603561459 }, "queries": { "positive": -8.490233009833455, "negative": -8.51057131510735, "neutral": -7.279663603561459 }, "type": { "positive": -8.490233009833455, "negative": -8.51057131510735, "neutral": -7.279663603561459 }, "running": { "positive": -7.391620721165345, "negative": -8.51057131510735, "neutral": -6.586516423001513 }, "node": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -6.181051314893349 }, "vps": { "positive": -8.490233009833455, "negative": -8.51057131510735, "neutral": -7.279663603561459 }, "routine": { "positive": -8.490233009833455, "negative": -8.51057131510735, "neutral": -7.279663603561459 }, "disclosure": { "positive": -8.490233009833455, "negative": -8.51057131510735, "neutral": -7.279663603561459 }, "foundation": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.279663603561459 }, "notable": { "positive": -8.490233009833455, "negative": -8.51057131510735, "neutral": -7.279663603561459 }, "updates": { "positive": -8.490233009833455, "negative": -8.51057131510735, "neutral": -6.874198495453294 }, "inside": { "positive": -8.490233009833455, "negative": -8.51057131510735, "neutral": -7.279663603561459 }, "period": { "positive": -8.490233009833455, "negative": -8.51057131510735, "neutral": -7.279663603561459 }, "portal": { "positive": -8.490233009833455, "negative": -8.51057131510735, "neutral": -6.874198495453294 }, "launched": { "positive": -7.391620721165345, "negative": -8.51057131510735, "neutral": -6.874198495453294 }, "content": { "positive": -8.490233009833455, "negative": -8.51057131510735, "neutral": -6.874198495453294 }, "unchanged": { "positive": -8.490233009833455, "negative": -8.51057131510735, "neutral": -6.874198495453294 }, "scheduled": { "positive": -8.490233009833455, "negative": -8.51057131510735, "neutral": -6.586516423001513 }, "increase": { "positive": -8.490233009833455, "negative": -8.51057131510735, "neutral": -7.279663603561459 }, "modestly": { "positive": -8.490233009833455, "negative": -8.51057131510735, "neutral": -7.279663603561459 }, "distribution": { "positive": -8.490233009833455, "negative": -8.51057131510735, "neutral": -7.279663603561459 }, "updated": { "positive": -8.490233009833455, "negative": -8.51057131510735, "neutral": -7.279663603561459 }, "pools": { "positive": -8.490233009833455, "negative": -8.51057131510735, "neutral": -7.279663603561459 }, "steady": { "positive": -8.490233009833455, "negative": -8.51057131510735, "neutral": -6.586516423001513 }, "reading": { "positive": -8.490233009833455, "negative": -8.51057131510735, "neutral": -6.026900635066091 }, "significant": { "positive": -8.490233009833455, "negative": -8.51057131510735, "neutral": -7.279663603561459 }, "change": { "positive": -8.490233009833455, "negative": -8.51057131510735, "neutral": -6.874198495453294 }, "observed": { "positive": -8.490233009833455, "negative": -8.51057131510735, "neutral": -7.279663603561459 }, "required": { "positive": -8.490233009833455, "negative": -8.51057131510735, "neutral": -7.279663603561459 }, "flat": { "positive": -8.490233009833455, "negative": -8.51057131510735, "neutral": -6.586516423001513 }, "low": { "positive": -7.391620721165345, "negative": -8.51057131510735, "neutral": -7.279663603561459 }, "summer": { "positive": -8.490233009833455, "negative": -8.51057131510735, "neutral": -7.279663603561459 }, "volume": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -6.586516423001513 }, "approximately": { "positive": -8.490233009833455, "negative": -8.51057131510735, "neutral": -7.279663603561459 }, "days": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -6.586516423001513 }, "away": { "positive": -7.7970858292735095, "negative": -7.817424134547405, "neutral": -7.279663603561459 }, "recommendations": { "positive": -8.490233009833455, "negative": -8.51057131510735, "neutral": -7.279663603561459 }, "good": { "positive": -6.187647916839409, "negative": -8.51057131510735, "neutral": -7.279663603561459 }, "analytics": { "positive": -8.490233009833455, "negative": -8.51057131510735, "neutral": -7.279663603561459 }, "tool": { "positive": -8.490233009833455, "negative": -8.51057131510735, "neutral": -7.279663603561459 }, "size": { "positive": -8.490233009833455, "negative": -8.51057131510735, "neutral": -7.279663603561459 }, "averaged": { "positive": -8.490233009833455, "negative": -8.51057131510735, "neutral": -6.874198495453294 }, "mb": { "positive": -8.490233009833455, "negative": -8.51057131510735, "neutral": -7.279663603561459 }, "usage": { "positive": -8.490233009833455, "negative": -8.51057131510735, "neutral": -6.874198495453294 }, "whitepaper": { "positive": -8.490233009833455, "negative": -8.51057131510735, "neutral": -7.279663603561459 }, "question": { "positive": -8.490233009833455, "negative": -8.51057131510735, "neutral": -6.586516423001513 }, "light": { "positive": -8.490233009833455, "negative": -8.51057131510735, "neutral": -7.279663603561459 }, "verify": { "positive": -8.490233009833455, "negative": -8.51057131510735, "neutral": -6.874198495453294 }, "state": { "positive": -7.391620721165345, "negative": -7.817424134547405, "neutral": -6.874198495453294 }, "academic": { "positive": -8.490233009833455, "negative": -8.51057131510735, "neutral": -6.874198495453294 }, "comparison": { "positive": -8.490233009833455, "negative": -8.51057131510735, "neutral": -7.279663603561459 }, "different": { "positive": -8.490233009833455, "negative": -8.51057131510735, "neutral": -7.279663603561459 }, "consensus": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -6.874198495453294 }, "algorithm": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.279663603561459 }, "tradeoffs": { "positive": -8.490233009833455, "negative": -8.51057131510735, "neutral": -6.874198495453294 }, "extractable": { "positive": -8.490233009833455, "negative": -8.51057131510735, "neutral": -7.279663603561459 }, "value": { "positive": -8.490233009833455, "negative": -8.51057131510735, "neutral": -7.279663603561459 }, "impact": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.279663603561459 }, "ordering": { "positive": -8.490233009833455, "negative": -8.51057131510735, "neutral": -7.279663603561459 }, "forum": { "positive": -8.490233009833455, "negative": -8.51057131510735, "neutral": -7.279663603561459 }, "maintenance": { "positive": -8.490233009833455, "negative": -8.51057131510735, "neutral": -6.874198495453294 }, "features": { "positive": -8.490233009833455, "negative": -8.51057131510735, "neutral": -7.279663603561459 }, "eip": { "positive": -8.490233009833455, "negative": -8.51057131510735, "neutral": -6.874198495453294 }, "proposal": { "positive": -8.490233009833455, "negative": -8.51057131510735, "neutral": -6.874198495453294 }, "merits": { "positive": -8.490233009833455, "negative": -8.51057131510735, "neutral": -7.279663603561459 }, "nuanced": { "positive": -8.490233009833455, "negative": -8.51057131510735, "neutral": -7.279663603561459 }, "structured": { "positive": -8.490233009833455, "negative": -8.51057131510735, "neutral": -7.279663603561459 }, "faq": { "positive": -8.490233009833455, "negative": -8.51057131510735, "neutral": -7.279663603561459 }, "thread": { "positive": -8.490233009833455, "negative": -8.51057131510735, "neutral": -6.363372871687304 }, "explorer": { "positive": -8.490233009833455, "negative": -8.51057131510735, "neutral": -7.279663603561459 }, "tomorrow": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -6.874198495453294 }, "utc": { "positive": -8.490233009833455, "negative": -8.51057131510735, "neutral": -7.279663603561459 }, "summary": { "positive": -8.490233009833455, "negative": -8.51057131510735, "neutral": -7.279663603561459 }, "participants": { "positive": -8.490233009833455, "negative": -8.51057131510735, "neutral": -7.279663603561459 }, "awaiting": { "positive": -8.490233009833455, "negative": -8.51057131510735, "neutral": -6.586516423001513 }, "fomc": { "positive": -8.490233009833455, "negative": -8.51057131510735, "neutral": -7.279663603561459 }, "release": { "positive": -8.490233009833455, "negative": -8.51057131510735, "neutral": -6.586516423001513 }, "wednesday": { "positive": -8.490233009833455, "negative": -8.51057131510735, "neutral": -7.279663603561459 }, "published": { "positive": -8.490233009833455, "negative": -8.51057131510735, "neutral": -7.279663603561459 }, "notes": { "positive": -8.490233009833455, "negative": -8.51057131510735, "neutral": -6.363372871687304 }, "latest": { "positive": -7.7970858292735095, "negative": -7.4119590264392405, "neutral": -6.874198495453294 }, "ethresearch": { "positive": -8.490233009833455, "negative": -8.51057131510735, "neutral": -7.279663603561459 }, "posts": { "positive": -8.490233009833455, "negative": -8.51057131510735, "neutral": -7.279663603561459 }, "availability": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.279663603561459 }, "sharing": { "positive": -8.490233009833455, "negative": -8.51057131510735, "neutral": -6.586516423001513 }, "beginner": { "positive": -8.490233009833455, "negative": -8.51057131510735, "neutral": -7.279663603561459 }, "friendly": { "positive": -8.490233009833455, "negative": -8.51057131510735, "neutral": -7.279663603561459 }, "intro": { "positive": -8.490233009833455, "negative": -8.51057131510735, "neutral": -7.279663603561459 }, "elliptic": { "positive": -8.490233009833455, "negative": -8.51057131510735, "neutral": -7.279663603561459 }, "curve": { "positive": -8.490233009833455, "negative": -8.51057131510735, "neutral": -7.279663603561459 }, "cryptography": { "positive": -8.490233009833455, "negative": -8.51057131510735, "neutral": -7.279663603561459 }, "concepts": { "positive": -8.490233009833455, "negative": -8.51057131510735, "neutral": -7.279663603561459 }, "estimation": { "positive": -8.490233009833455, "negative": -8.51057131510735, "neutral": -7.279663603561459 }, "algorithms": { "positive": -8.490233009833455, "negative": -8.51057131510735, "neutral": -7.279663603561459 }, "modern": { "positive": -8.490233009833455, "negative": -8.51057131510735, "neutral": -7.279663603561459 }, "primer": { "positive": -7.391620721165345, "negative": -8.51057131510735, "neutral": -7.279663603561459 }, "derivatives": { "positive": -8.490233009833455, "negative": -7.4119590264392405, "neutral": -7.279663603561459 }, "implemented": { "positive": -8.490233009833455, "negative": -8.51057131510735, "neutral": -7.279663603561459 }, "technically": { "positive": -8.490233009833455, "negative": -8.51057131510735, "neutral": -7.279663603561459 }, "rollup": { "positive": -8.490233009833455, "negative": -8.51057131510735, "neutral": -6.874198495453294 }, "compression": { "positive": -8.490233009833455, "negative": -8.51057131510735, "neutral": -7.279663603561459 }, "scaling": { "positive": -8.490233009833455, "negative": -8.51057131510735, "neutral": -7.279663603561459 }, "developer": { "positive": -8.490233009833455, "negative": -8.51057131510735, "neutral": -6.874198495453294 }, "reposts": { "positive": -8.490233009833455, "negative": -8.51057131510735, "neutral": -7.279663603561459 }, "changelog": { "positive": -8.490233009833455, "negative": -8.51057131510735, "neutral": -7.279663603561459 }, "minor": { "positive": -8.490233009833455, "negative": -8.51057131510735, "neutral": -7.279663603561459 }, "versus": { "positive": -8.490233009833455, "negative": -8.51057131510735, "neutral": -6.874198495453294 }, "current": { "positive": -8.490233009833455, "negative": -8.51057131510735, "neutral": -7.279663603561459 }, "protocols": { "positive": -8.490233009833455, "negative": -8.51057131510735, "neutral": -6.874198495453294 }, "source": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.279663603561459 }, "reliably": { "positive": -8.490233009833455, "negative": -8.51057131510735, "neutral": -7.279663603561459 }, "poll": { "positive": -8.490233009833455, "negative": -8.51057131510735, "neutral": -7.279663603561459 }, "feature": { "positive": -8.490233009833455, "negative": -8.51057131510735, "neutral": -7.279663603561459 }, "prioritize": { "positive": -8.490233009833455, "negative": -8.51057131510735, "neutral": -7.279663603561459 }, "hardware": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -6.874198495453294 }, "everyones": { "positive": -8.490233009833455, "negative": -8.51057131510735, "neutral": -7.279663603561459 }, "preferred": { "positive": -8.490233009833455, "negative": -8.51057131510735, "neutral": -7.279663603561459 }, "cold": { "positive": -8.490233009833455, "negative": -8.51057131510735, "neutral": -7.279663603561459 }, "storage": { "positive": -8.490233009833455, "negative": -8.51057131510735, "neutral": -7.279663603561459 }, "solution": { "positive": -8.490233009833455, "negative": -8.51057131510735, "neutral": -7.279663603561459 }, "digesting": { "positive": -8.490233009833455, "negative": -8.51057131510735, "neutral": -7.279663603561459 }, "recent": { "positive": -8.490233009833455, "negative": -8.51057131510735, "neutral": -6.874198495453294 }, "moves": { "positive": -7.391620721165345, "negative": -8.51057131510735, "neutral": -7.279663603561459 }, "clarity": { "positive": -8.490233009833455, "negative": -8.51057131510735, "neutral": -7.279663603561459 }, "paper": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -6.874198495453294 }, "mechanisms": { "positive": -8.490233009833455, "negative": -8.51057131510735, "neutral": -6.874198495453294 }, "refresh": { "positive": -8.490233009833455, "negative": -8.51057131510735, "neutral": -6.874198495453294 }, "mostly": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -6.363372871687304 }, "same": { "positive": -8.490233009833455, "negative": -8.51057131510735, "neutral": -7.279663603561459 }, "anybody": { "positive": -8.490233009833455, "negative": -8.51057131510735, "neutral": -7.279663603561459 }, "raspberry": { "positive": -8.490233009833455, "negative": -8.51057131510735, "neutral": -7.279663603561459 }, "pi": { "positive": -8.490233009833455, "negative": -8.51057131510735, "neutral": -7.279663603561459 }, "shared": { "positive": -8.490233009833455, "negative": -8.51057131510735, "neutral": -7.279663603561459 }, "research": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.279663603561459 }, "validator": { "positive": -8.490233009833455, "negative": -8.51057131510735, "neutral": -6.874198495453294 }, "economics": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.279663603561459 }, "mev": { "positive": -7.391620721165345, "negative": -8.51057131510735, "neutral": -7.279663603561459 }, "protection": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.279663603561459 }, "newer": { "positive": -8.490233009833455, "negative": -8.51057131510735, "neutral": -7.279663603561459 }, "implementations": { "positive": -8.490233009833455, "negative": -8.51057131510735, "neutral": -7.279663603561459 }, "governance": { "positive": -8.490233009833455, "negative": -8.51057131510735, "neutral": -7.279663603561459 }, "proposals": { "positive": -8.490233009833455, "negative": -8.51057131510735, "neutral": -7.279663603561459 }, "review": { "positive": -8.490233009833455, "negative": -8.51057131510735, "neutral": -7.279663603561459 }, "changes": { "positive": -8.490233009833455, "negative": -8.51057131510735, "neutral": -6.874198495453294 }, "session": { "positive": -8.490233009833455, "negative": -8.51057131510735, "neutral": -6.874198495453294 }, "both": { "positive": -8.490233009833455, "negative": -8.51057131510735, "neutral": -7.279663603561459 }, "reminder": { "positive": -8.490233009833455, "negative": -8.51057131510735, "neutral": -6.586516423001513 }, "need": { "positive": -8.490233009833455, "negative": -8.51057131510735, "neutral": -7.279663603561459 }, "firmware": { "positive": -8.490233009833455, "negative": -8.51057131510735, "neutral": -7.279663603561459 }, "sidelined": { "positive": -8.490233009833455, "negative": -8.51057131510735, "neutral": -7.279663603561459 }, "discussing": { "positive": -8.490233009833455, "negative": -8.51057131510735, "neutral": -7.279663603561459 }, "architecture": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.279663603561459 }, "choices": { "positive": -8.490233009833455, "negative": -8.51057131510735, "neutral": -7.279663603561459 }, "deep": { "positive": -8.490233009833455, "negative": -8.51057131510735, "neutral": -7.279663603561459 }, "dive": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.279663603561459 }, "analysis": { "positive": -7.391620721165345, "negative": -7.817424134547405, "neutral": -7.279663603561459 }, "trades": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.279663603561459 }, "range": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -6.874198495453294 }, "gwei": { "positive": -8.490233009833455, "negative": -8.51057131510735, "neutral": -7.279663603561459 }, "stable": { "positive": -6.6984735406053995, "negative": -8.51057131510735, "neutral": -7.279663603561459 }, "threshold": { "positive": -8.490233009833455, "negative": -8.51057131510735, "neutral": -7.279663603561459 }, "signatures": { "positive": -8.490233009833455, "negative": -8.51057131510735, "neutral": -7.279663603561459 }, "hourly": { "positive": -8.490233009833455, "negative": -8.51057131510735, "neutral": -7.279663603561459 }, "tight": { "positive": -8.490233009833455, "negative": -8.51057131510735, "neutral": -7.279663603561459 }, "consolidation": { "positive": -8.490233009833455, "negative": -8.51057131510735, "neutral": -7.279663603561459 }, "zk": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.279663603561459 }, "snarks": { "positive": -8.490233009833455, "negative": -8.51057131510735, "neutral": -7.279663603561459 }, "used": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.279663603561459 }, "privacy": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.279663603561459 }, "preserving": { "positive": -8.490233009833455, "negative": -8.51057131510735, "neutral": -7.279663603561459 }, "constructions": { "positive": -8.490233009833455, "negative": -8.51057131510735, "neutral": -7.279663603561459 }, "share": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.279663603561459 }, "any": { "positive": -8.490233009833455, "negative": -8.51057131510735, "neutral": -7.279663603561459 }, "reason": { "positive": -8.490233009833455, "negative": -8.51057131510735, "neutral": -7.279663603561459 }, "ui": { "positive": -8.490233009833455, "negative": -8.51057131510735, "neutral": -7.279663603561459 }, "dropped": { "positive": -8.490233009833455, "negative": -8.51057131510735, "neutral": -7.279663603561459 }, "cosmetic": { "positive": -8.490233009833455, "negative": -8.51057131510735, "neutral": -7.279663603561459 }, "prior": { "positive": -8.490233009833455, "negative": -8.51057131510735, "neutral": -6.874198495453294 }, "version": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.279663603561459 }, "less": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.279663603561459 }, "addresses": { "positive": -8.490233009833455, "negative": -8.51057131510735, "neutral": -7.279663603561459 }, "trend": { "positive": -8.490233009833455, "negative": -8.51057131510735, "neutral": -7.279663603561459 }, "recently": { "positive": -8.490233009833455, "negative": -8.51057131510735, "neutral": -7.279663603561459 }, "compiled": { "positive": -8.490233009833455, "negative": -8.51057131510735, "neutral": -7.279663603561459 }, "please": { "positive": -8.490233009833455, "negative": -8.51057131510735, "neutral": -6.874198495453294 }, "questions": { "positive": -8.490233009833455, "negative": -8.51057131510735, "neutral": -7.279663603561459 }, "software": { "positive": -7.7970858292735095, "negative": -7.817424134547405, "neutral": -7.279663603561459 }, "geth": { "positive": -8.490233009833455, "negative": -8.51057131510735, "neutral": -7.279663603561459 }, "nethermind": { "positive": -8.490233009833455, "negative": -8.51057131510735, "neutral": -7.279663603561459 }, "besu": { "positive": -8.490233009833455, "negative": -8.51057131510735, "neutral": -7.279663603561459 }, "remained": { "positive": -8.490233009833455, "negative": -8.51057131510735, "neutral": -7.279663603561459 }, "bound": { "positive": -8.490233009833455, "negative": -8.51057131510735, "neutral": -7.279663603561459 }, "educational": { "positive": -8.490233009833455, "negative": -8.51057131510735, "neutral": -7.279663603561459 }, "account": { "positive": -7.7970858292735095, "negative": -6.718811845879295, "neutral": -7.279663603561459 }, "abstraction": { "positive": -8.490233009833455, "negative": -8.51057131510735, "neutral": -7.279663603561459 }, "differs": { "positive": -8.490233009833455, "negative": -8.51057131510735, "neutral": -7.279663603561459 }, "eoa": { "positive": -8.490233009833455, "negative": -8.51057131510735, "neutral": -7.279663603561459 }, "discussion": { "positive": -8.490233009833455, "negative": -8.51057131510735, "neutral": -6.874198495453294 }, "fee": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.279663603561459 }, "dynamics": { "positive": -8.490233009833455, "negative": -8.51057131510735, "neutral": -7.279663603561459 }, "conditions": { "positive": -8.490233009833455, "negative": -8.51057131510735, "neutral": -7.279663603561459 }, "line": { "positive": -8.490233009833455, "negative": -8.51057131510735, "neutral": -7.279663603561459 }, "seven": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.279663603561459 }, "anomalies": { "positive": -8.490233009833455, "negative": -8.51057131510735, "neutral": -7.279663603561459 }, "use": { "positive": -7.103938648713564, "negative": -7.817424134547405, "neutral": -7.279663603561459 }, "framework": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.279663603561459 }, "unlike": { "positive": -8.490233009833455, "negative": -8.51057131510735, "neutral": -7.279663603561459 }, "traditional": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.279663603561459 }, "workshop": { "positive": -8.490233009833455, "negative": -8.51057131510735, "neutral": -7.279663603561459 }, "practices": { "positive": -8.490233009833455, "negative": -8.51057131510735, "neutral": -7.279663603561459 }, "difficulty": { "positive": -8.490233009833455, "negative": -7.4119590264392405, "neutral": -7.279663603561459 }, "adjustment": { "positive": -8.490233009833455, "negative": -8.51057131510735, "neutral": -7.279663603561459 }, "mechanically": { "positive": -8.490233009833455, "negative": -8.51057131510735, "neutral": -7.279663603561459 }, "simplified": { "positive": -8.490233009833455, "negative": -8.51057131510735, "neutral": -7.279663603561459 }, "explanation": { "positive": -8.490233009833455, "negative": -8.51057131510735, "neutral": -7.279663603561459 }, "history": { "positive": -8.490233009833455, "negative": -8.51057131510735, "neutral": -6.874198495453294 }, "differences": { "positive": -8.490233009833455, "negative": -8.51057131510735, "neutral": -7.279663603561459 }, "proof": { "positive": -8.490233009833455, "negative": -8.51057131510735, "neutral": -6.874198495453294 }, "stake": { "positive": -8.490233009833455, "negative": -8.51057131510735, "neutral": -7.279663603561459 }, "thoughts": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.279663603561459 }, "fork": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.279663603561459 }, "export": { "positive": -8.490233009833455, "negative": -8.51057131510735, "neutral": -7.279663603561459 }, "filing": { "positive": -8.490233009833455, "negative": -7.4119590264392405, "neutral": -7.279663603561459 }, "thorchain": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "bsc": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "hackers": { "positive": -8.490233009833455, "negative": -5.332517484759405, "neutral": -7.972810784121404 }, "steal": { "positive": -8.490233009833455, "negative": -5.620199557211186, "neutral": -7.972810784121404 }, "sends": { "positive": -7.103938648713564, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "tumbling": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "scammers": { "positive": -8.490233009833455, "negative": -6.718811845879295, "neutral": -7.972810784121404 }, "capitalize": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "binance": { "positive": -5.657019665777238, "negative": -5.178366804932146, "neutral": -7.972810784121404 }, "lawsuit": { "positive": -8.490233009833455, "negative": -6.431129773427514, "neutral": -7.972810784121404 }, "discord": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "phishing": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "via": { "positive": -7.7970858292735095, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "rails": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "stolen": { "positive": -8.490233009833455, "negative": -5.80252111400514, "neutral": -7.972810784121404 }, "yggtorrent": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "shuts": { "positive": -8.490233009833455, "negative": -7.12427695398746, "neutral": -7.972810784121404 }, "leak": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "bribed": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "staff": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "demanding": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "ransom": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "dollar": { "positive": -7.7970858292735095, "negative": -6.90113340267325, "neutral": -7.972810784121404 }, "bloodbath": { "positive": -8.490233009833455, "negative": -7.4119590264392405, "neutral": -7.972810784121404 }, "hodlnaut": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "celsius": { "positive": -8.490233009833455, "negative": -7.12427695398746, "neutral": -7.972810784121404 }, "charged": { "positive": -8.490233009833455, "negative": -7.12427695398746, "neutral": -7.972810784121404 }, "fraud": { "positive": -8.490233009833455, "negative": -5.80252111400514, "neutral": -7.972810784121404 }, "bankrupt": { "positive": -8.490233009833455, "negative": -7.12427695398746, "neutral": -7.972810784121404 }, "startups": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "wake": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "victim": { "positive": -8.490233009833455, "negative": -7.12427695398746, "neutral": -7.972810784121404 }, "nft": { "positive": -7.391620721165345, "negative": -7.12427695398746, "neutral": -7.972810784121404 }, "cryptocurrency": { "positive": -5.717644287593673, "negative": -4.927052376651241, "neutral": -7.972810784121404 }, "investment": { "positive": -7.7970858292735095, "negative": -7.12427695398746, "neutral": -7.972810784121404 }, "collateral": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "loophole": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "force": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "feds": { "positive": -7.7970858292735095, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "arrest": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "couple": { "positive": -8.490233009833455, "negative": -7.4119590264392405, "neutral": -7.972810784121404 }, "seize": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "warns": { "positive": -8.490233009833455, "negative": -6.90113340267325, "neutral": -7.972810784121404 }, "holdings": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "aax": { "positive": -8.490233009833455, "negative": -7.12427695398746, "neutral": -7.972810784121404 }, "executives": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "rd": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "scams": { "positive": -8.490233009833455, "negative": -7.4119590264392405, "neutral": -7.972810784121404 }, "cost": { "positive": -7.7970858292735095, "negative": -7.4119590264392405, "neutral": -7.972810784121404 }, "owners": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "driven": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "pulls": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "fake": { "positive": -8.490233009833455, "negative": -6.90113340267325, "neutral": -7.972810784121404 }, "pre": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "loaded": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "openai's": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "press": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "betterment": { "positive": -8.490233009833455, "negative": -7.4119590264392405, "neutral": -7.972810784121404 }, "modular": { "positive": -8.490233009833455, "negative": -7.4119590264392405, "neutral": -7.972810784121404 }, "exploiting": { "positive": -8.490233009833455, "negative": -7.4119590264392405, "neutral": -7.972810784121404 }, "ads": { "positive": -8.490233009833455, "negative": -7.4119590264392405, "neutral": -7.972810784121404 }, "inflencers": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "sites": { "positive": -8.490233009833455, "negative": -7.4119590264392405, "neutral": -7.972810784121404 }, "celebrities": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "bittrex": { "positive": -8.490233009833455, "negative": -7.12427695398746, "neutral": -7.972810784121404 }, "sim": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "tokyo": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "losing": { "positive": -8.490233009833455, "negative": -7.4119590264392405, "neutral": -7.972810784121404 }, "nhk": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "due": { "positive": -8.490233009833455, "negative": -6.718811845879295, "neutral": -7.972810784121404 }, "dao": { "positive": -5.925283652371918, "negative": -6.718811845879295, "neutral": -7.972810784121404 }, "theft": { "positive": -8.490233009833455, "negative": -6.564661166052037, "neutral": -7.972810784121404 }, "brother": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "ceo": { "positive": -7.7970858292735095, "negative": -6.02566466531935, "neutral": -7.972810784121404 }, "pleads": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "guilty": { "positive": -8.490233009833455, "negative": -6.90113340267325, "neutral": -7.972810784121404 }, "stealing": { "positive": -8.490233009833455, "negative": -7.12427695398746, "neutral": -7.972810784121404 }, "irs": { "positive": -8.490233009833455, "negative": -7.4119590264392405, "neutral": -7.972810784121404 }, "bro": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "scammed": { "positive": -8.490233009833455, "negative": -7.12427695398746, "neutral": -7.972810784121404 }, "reporters": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "readers": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "nork": { "positive": -8.490233009833455, "negative": -7.4119590264392405, "neutral": -7.972810784121404 }, "hunters": { "positive": -8.490233009833455, "negative": -7.4119590264392405, "neutral": -7.972810784121404 }, "cashio": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "plummets": { "positive": -8.490233009833455, "negative": -7.12427695398746, "neutral": -7.972810784121404 }, "multimillion": { "positive": -8.490233009833455, "negative": -7.4119590264392405, "neutral": -7.972810784121404 }, "potentially": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "illegal": { "positive": -8.490233009833455, "negative": -7.12427695398746, "neutral": -7.972810784121404 }, "crashed": { "positive": -8.490233009833455, "negative": -6.564661166052037, "neutral": -7.972810784121404 }, "stopped": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "notifications": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "detectives": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "track": { "positive": -7.7970858292735095, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "confirms": { "positive": -8.490233009833455, "negative": -7.12427695398746, "neutral": -7.972810784121404 }, "breach": { "positive": -8.490233009833455, "negative": -7.4119590264392405, "neutral": -7.972810784121404 }, "send": { "positive": -7.7970858292735095, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "notification": { "positive": -8.490233009833455, "negative": -7.4119590264392405, "neutral": -7.972810784121404 }, "ether": { "positive": -7.7970858292735095, "negative": -7.4119590264392405, "neutral": -7.972810784121404 }, "triggers": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "selloff": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "ftx": { "positive": -6.8807950973993535, "negative": -6.207986222113305, "neutral": -7.972810784121404 }, "failure": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "reverberates": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "chicago": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "area": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "man": { "positive": -7.7970858292735095, "negative": -6.90113340267325, "neutral": -7.972810784121404 }, "bond": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "iota": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "bitmart": { "positive": -8.490233009833455, "negative": -6.90113340267325, "neutral": -7.972810784121404 }, "following": { "positive": -8.490233009833455, "negative": -7.12427695398746, "neutral": -7.972810784121404 }, "mevboost": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "stole": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "mevbots": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "doj": { "positive": -8.490233009833455, "negative": -6.718811845879295, "neutral": -7.972810784121404 }, "criminally": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "nassim": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "taleb": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "currency": { "positive": -7.7970858292735095, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "became": { "positive": -7.7970858292735095, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "speculative": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "bitfinex": { "positive": -8.490233009833455, "negative": -7.4119590264392405, "neutral": -7.972810784121404 }, "moved": { "positive": -8.490233009833455, "negative": -7.12427695398746, "neutral": -7.972810784121404 }, "apparent": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "behind": { "positive": -7.103938648713564, "negative": -7.4119590264392405, "neutral": -7.972810784121404 }, "kia": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "ransomware": { "positive": -8.490233009833455, "negative": -7.12427695398746, "neutral": -7.972810784121404 }, "attack": { "positive": -7.391620721165345, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "entrepreneur": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "justin": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "sun": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "companies": { "positive": -8.490233009833455, "negative": -7.12427695398746, "neutral": -7.972810784121404 }, "sues": { "positive": -8.490233009833455, "negative": -7.4119590264392405, "neutral": -7.972810784121404 }, "deduct": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "criminals": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "mailing": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "ledger": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "devices": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "terra": { "positive": -8.490233009833455, "negative": -7.12427695398746, "neutral": -7.972810784121404 }, "crisis": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "ust": { "positive": -8.490233009833455, "negative": -6.90113340267325, "neutral": -7.972810784121404 }, "takes": { "positive": -7.7970858292735095, "negative": -7.4119590264392405, "neutral": -7.972810784121404 }, "estimates": { "positive": -7.7970858292735095, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "fi": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "fa": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "hijacked": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "bancor": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "wazirx": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "india's": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "biggest": { "positive": -7.103938648713564, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "popular": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "code": { "positive": -7.7970858292735095, "negative": -7.4119590264392405, "neutral": -7.972810784121404 }, "packages": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "bitclout's": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "nader": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "al": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "naji": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "grow": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "increasingly": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "bearish": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "etfs": { "positive": -7.7970858292735095, "negative": -7.4119590264392405, "neutral": -7.972810784121404 }, "bleed": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "sinks": { "positive": -8.490233009833455, "negative": -7.4119590264392405, "neutral": -7.972810784121404 }, "turkish": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "jail": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "trt": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "slips": { "positive": -8.490233009833455, "negative": -7.4119590264392405, "neutral": -7.972810784121404 }, "hacker": { "positive": -7.391620721165345, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "sold": { "positive": -8.490233009833455, "negative": -7.4119590264392405, "neutral": -7.972810784121404 }, "access": { "positive": -7.7970858292735095, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "oregon": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "emergency": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "prison": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "flaw": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "security": { "positive": -8.490233009833455, "negative": -7.4119590264392405, "neutral": -7.972810784121404 }, "slammed": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "service": { "positive": -8.490233009833455, "negative": -7.4119590264392405, "neutral": -7.972810784121404 }, "drain": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "accounts": { "positive": -8.490233009833455, "negative": -7.12427695398746, "neutral": -7.972810784121404 }, "turkey": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "return": { "positive": -7.391620721165345, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "darkside": { "positive": -8.490233009833455, "negative": -7.4119590264392405, "neutral": -7.972810784121404 }, "gang": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "quits": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "servers": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "stash": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "seized": { "positive": -8.490233009833455, "negative": -7.12427695398746, "neutral": -7.972810784121404 }, "phone": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "'biggest": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "heist'": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "colorado": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "pastor": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "perpetrated": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "god's": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "command": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "north": { "positive": -8.490233009833455, "negative": -6.564661166052037, "neutral": -7.972810784121404 }, "korean": { "positive": -7.7970858292735095, "negative": -7.12427695398746, "neutral": -7.972810784121404 }, "offers": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "island": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "iced": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "tea": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "soars": { "positive": -6.8807950973993535, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "name": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "bitcoins": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "tsb": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "concerns": { "positive": -7.7970858292735095, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "kraken": { "positive": -7.7970858292735095, "negative": -7.4119590264392405, "neutral": -7.972810784121404 }, "halted": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "bnb": { "positive": -8.490233009833455, "negative": -6.718811845879295, "neutral": -7.972810784121404 }, "admits": { "positive": -7.7970858292735095, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "least": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "wipe": { "positive": -8.490233009833455, "negative": -7.4119590264392405, "neutral": -7.972810784121404 }, "experiencing": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "outage": { "positive": -8.490233009833455, "negative": -7.4119590264392405, "neutral": -7.972810784121404 }, "prices": { "positive": -7.7970858292735095, "negative": -7.4119590264392405, "neutral": -7.972810784121404 }, "plummet": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "issues": { "positive": -8.490233009833455, "negative": -7.4119590264392405, "neutral": -7.972810784121404 }, "warning": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "americans": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "mass": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "layoffs": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "resulting": { "positive": -8.490233009833455, "negative": -7.12427695398746, "neutral": -7.972810784121404 }, "world": { "positive": -7.7970858292735095, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "largest": { "positive": -8.490233009833455, "negative": -6.90113340267325, "neutral": -7.972810784121404 }, "possible": { "positive": -7.7970858292735095, "negative": -7.4119590264392405, "neutral": -7.972810784121404 }, "destroy": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "iran's": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "japanese": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "korea's": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "presents": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "national": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "contractor's": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "son": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "alleged": { "positive": -8.490233009833455, "negative": -7.4119590264392405, "neutral": -7.972810784121404 }, "marshals": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "upbit": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "protected": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "circle": { "positive": -6.8807950973993535, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "adds": { "positive": -7.103938648713564, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "stellar": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "stock": { "positive": -7.391620721165345, "negative": -6.90113340267325, "neutral": -7.972810784121404 }, "binance's": { "positive": -7.7970858292735095, "negative": -7.4119590264392405, "neutral": -7.972810784121404 }, "extension": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "bybit": { "positive": -8.490233009833455, "negative": -6.90113340267325, "neutral": -7.972810784121404 }, "bithumb": { "positive": -8.490233009833455, "negative": -7.4119590264392405, "neutral": -7.972810784121404 }, "evernote": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "immigrant": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "ruin": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "doesn": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "pay": { "positive": -7.7970858292735095, "negative": -7.4119590264392405, "neutral": -7.972810784121404 }, "booms": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "kidnappings": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "originates": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "iran": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "china": { "positive": -7.7970858292735095, "negative": -7.4119590264392405, "neutral": -7.972810784121404 }, "brothers": { "positive": -8.490233009833455, "negative": -7.12427695398746, "neutral": -7.972810784121404 }, "allegedly": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "seconds": { "positive": -7.7970858292735095, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "attacking": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "conspiracy": { "positive": -8.490233009833455, "negative": -7.4119590264392405, "neutral": -7.972810784121404 }, "launder": { "positive": -8.490233009833455, "negative": -7.4119590264392405, "neutral": -7.972810784121404 }, "falls": { "positive": -8.490233009833455, "negative": -7.12427695398746, "neutral": -7.972810784121404 }, "acala": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "issue": { "positive": -8.490233009833455, "negative": -7.4119590264392405, "neutral": -7.972810784121404 }, "changpeng": { "positive": -8.490233009833455, "negative": -7.4119590264392405, "neutral": -7.972810784121404 }, "zhao": { "positive": -7.391620721165345, "negative": -7.12427695398746, "neutral": -7.972810784121404 }, "plead": { "positive": -8.490233009833455, "negative": -7.12427695398746, "neutral": -7.972810784121404 }, "federal": { "positive": -8.490233009833455, "negative": -7.4119590264392405, "neutral": -7.972810784121404 }, "step": { "positive": -8.490233009833455, "negative": -7.12427695398746, "neutral": -7.972810784121404 }, "robinhood": { "positive": -8.490233009833455, "negative": -7.4119590264392405, "neutral": -7.972810784121404 }, "related": { "positive": -8.490233009833455, "negative": -7.4119590264392405, "neutral": -7.972810784121404 }, "short": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "expectations": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "exch": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "korea": { "positive": -8.490233009833455, "negative": -7.4119590264392405, "neutral": -7.972810784121404 }, "aws": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "mine": { "positive": -7.103938648713564, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "heavy": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "cryptocurrencies": { "positive": -6.6984735406053995, "negative": -7.12427695398746, "neutral": -7.972810784121404 }, "three": { "positive": -7.7970858292735095, "negative": -7.12427695398746, "neutral": -7.972810784121404 }, "buzz": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "drives": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "graveyard": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "intrusions": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "financials": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "shutdown": { "positive": -8.490233009833455, "negative": -7.12427695398746, "neutral": -7.972810784121404 }, "controversial": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "cents": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "nations": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "join": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "internet": { "positive": -8.490233009833455, "negative": -7.12427695398746, "neutral": -7.972810784121404 }, "giants": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "ad": { "positive": -8.490233009833455, "negative": -7.12427695398746, "neutral": -7.972810784121404 }, "ban": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "fia": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "notice": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "taking": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "gdax": { "positive": -8.490233009833455, "negative": -7.4119590264392405, "neutral": -7.972810784121404 }, "russians": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "attempt": { "positive": -8.490233009833455, "negative": -7.12427695398746, "neutral": -7.972810784121404 }, "saving": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "speaks": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "quantum": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "video": { "positive": -7.7970858292735095, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "butterfly": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "labs": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "shut": { "positive": -8.490233009833455, "negative": -7.4119590264392405, "neutral": -7.972810784121404 }, "ftc": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "drops": { "positive": -8.490233009833455, "negative": -6.718811845879295, "neutral": -7.972810784121404 }, "nears": { "positive": -7.391620721165345, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "misused": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "sec's": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "safedollar": { "positive": -8.490233009833455, "negative": -7.4119590264392405, "neutral": -7.972810784121404 }, "polygon": { "positive": -8.490233009833455, "negative": -7.4119590264392405, "neutral": -7.972810784121404 }, "blamed": { "positive": -8.490233009833455, "negative": -7.4119590264392405, "neutral": -7.972810784121404 }, "spike": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "thefts": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "nvidia": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "peak": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "seizes": { "positive": -8.490233009833455, "negative": -7.12427695398746, "neutral": -7.972810784121404 }, "'pig": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "butchering'": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "cambodia": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "tied": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "global": { "positive": -7.7970858292735095, "negative": -7.12427695398746, "neutral": -7.972810784121404 }, "eminifx": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "sentenced": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "ditch": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "save": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "tell": { "positive": -8.490233009833455, "negative": -7.12427695398746, "neutral": -7.972810784121404 }, "gsd": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "it's": { "positive": -7.7970858292735095, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "rugpull": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "list": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "dotcom": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "coming": { "positive": -7.391620721165345, "negative": -7.4119590264392405, "neutral": -7.972810784121404 }, "cryptoasset": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "realization": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "forfeited": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "plunges": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "bankman": { "positive": -7.7970858292735095, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "fried": { "positive": -7.7970858292735095, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "itself": { "positive": -8.490233009833455, "negative": -7.4119590264392405, "neutral": -7.972810784121404 }, "desperate": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "turn": { "positive": -7.7970858292735095, "negative": -7.4119590264392405, "neutral": -7.972810784121404 }, "allegations": { "positive": -8.490233009833455, "negative": -7.4119590264392405, "neutral": -7.972810784121404 }, "goldman": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "downgrades": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "rout": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "documents": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "detail": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "scores": { "positive": -7.7970858292735095, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "filed": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "class": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "nicehash": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "canada": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "mulls": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "fine": { "positive": -8.490233009833455, "negative": -7.4119590264392405, "neutral": -7.972810784121404 }, "power": { "positive": -7.103938648713564, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "plant": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "members": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "jointly": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "liable": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "except": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "paxos": { "positive": -7.7970858292735095, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "era": { "positive": -7.391620721165345, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "blame": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "timeline": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "chaincoin": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "actor": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "murray": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "raised": { "positive": -6.8807950973993535, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "charity": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "crackdown": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "hurt": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "too": { "positive": -7.7970858292735095, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "old": { "positive": -7.7970858292735095, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "rigs": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "'shutdown'": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "extortionists": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "api": { "positive": -8.490233009833455, "negative": -7.4119590264392405, "neutral": -7.972810784121404 }, "blacklisted": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "rumors": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "'cz'": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "eos": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "fbi": { "positive": -8.490233009833455, "negative": -7.12427695398746, "neutral": -7.972810784121404 }, "people": { "positive": -7.7970858292735095, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "indicted": { "positive": -8.490233009833455, "negative": -7.4119590264392405, "neutral": -7.972810784121404 }, "sbi": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "reportedly": { "positive": -7.7970858292735095, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "dprk": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "links": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "peter": { "positive": -7.391620721165345, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "thiel": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "backed": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "group": { "positive": -7.391620721165345, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "ipo": { "positive": -7.103938648713564, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "debut": { "positive": -7.391620721165345, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "kelp": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "exploited": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "rally": { "positive": -6.293008432497235, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "warehouse": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "hamilton": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "teen": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "embroiled": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "probe": { "positive": -8.490233009833455, "negative": -7.4119590264392405, "neutral": -7.972810784121404 }, "fingered": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "clear": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "dxsale": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "extend": { "positive": -7.391620721165345, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "almost": { "positive": -7.7970858292735095, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "other": { "positive": -7.391620721165345, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "scammer": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "swan": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "started": { "positive": -7.7970858292735095, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "banning": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "anything": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "depot": { "positive": -8.490233009833455, "negative": -7.12427695398746, "neutral": -7.972810784121404 }, "atms": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "offline": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "american": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "atm": { "positive": -8.490233009833455, "negative": -7.4119590264392405, "neutral": -7.972810784121404 }, "operator": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "dissecting": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "schemes": { "positive": -8.490233009833455, "negative": -7.12427695398746, "neutral": -7.972810784121404 }, "identification": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "show": { "positive": -6.092337737035083, "negative": -7.4119590264392405, "neutral": -7.972810784121404 }, "hn": { "positive": -5.494500736279464, "negative": -6.718811845879295, "neutral": -7.972810784121404 }, "honeypotscan": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "detect": { "positive": -8.490233009833455, "negative": -7.4119590264392405, "neutral": -7.972810784121404 }, "judge": { "positive": -7.7970858292735095, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "declares": { "positive": -8.490233009833455, "negative": -7.4119590264392405, "neutral": -7.972810784121404 }, "mistrial": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "mit": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "grad": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "case": { "positive": -7.391620721165345, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "ethereum's": { "positive": -7.103938648713564, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "fusaka": { "positive": -7.391620721165345, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "costs": { "positive": -6.8807950973993535, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "fluencelabs": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "pushing": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "foss": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "unclear": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "tesla": { "positive": -7.7970858292735095, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "youtube": { "positive": -8.490233009833455, "negative": -6.718811845879295, "neutral": -7.972810784121404 }, "doubling": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "werewolf": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "spent": { "positive": -7.391620721165345, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "moon": { "positive": -7.391620721165345, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "chatgpt": { "positive": -8.490233009833455, "negative": -7.4119590264392405, "neutral": -7.972810784121404 }, "floods": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "actors": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "don't": { "positive": -7.7970858292735095, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "read": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "accelerates": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "deepens": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "slip": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "faked": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "catch": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "longer": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "prosecute": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "turned": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "small": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "town": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "swindled": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "pension": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "defining": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "detecting": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "dumps": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "anatomy": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "john": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "mcafee": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "replaying": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "absurdly": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "giant": { "positive": -8.490233009833455, "negative": -7.4119590264392405, "neutral": -7.972810784121404 }, "networks": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "dogecoin": { "positive": -7.7970858292735095, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "co": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "help": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "rich": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "richer": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "giveaway": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "stream": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "ohio": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "result": { "positive": -8.490233009833455, "negative": -7.4119590264392405, "neutral": -7.972810784121404 }, "'blockchain'": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "contrastive": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "learning": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "vcs": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "strangling": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "luna": { "positive": -8.490233009833455, "negative": -7.4119590264392405, "neutral": -7.972810784121404 }, "cto": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "welcomes": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "fair": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "regulation": { "positive": -7.391620721165345, "negative": -7.4119590264392405, "neutral": -7.972810784121404 }, "rebooted": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "buy": { "positive": -5.545794030667014, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "profits": { "positive": -6.544322860778141, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "mogul": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "kwon": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "set": { "positive": -7.7970858292735095, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "sentencing": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "replacing": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "altcoing": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "stats": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "clobbered": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "safesnipe": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "ai": { "positive": -7.391620721165345, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "detector": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "meme": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "contributor": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "todd": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "promotion": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "writing": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "bump": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "bot": { "positive": -7.7970858292735095, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "recommended": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "website": { "positive": -8.490233009833455, "negative": -7.4119590264392405, "neutral": -7.972810784121404 }, "turtledex": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "want": { "positive": -7.7970858292735095, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "margin": { "positive": -8.490233009833455, "negative": -7.4119590264392405, "neutral": -7.972810784121404 }, "okcupid": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "florida": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "followed": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "crashing": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "coinbase's": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "users'": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "subject": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "claim": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "spending": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "superbowl": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "prevent": { "positive": -8.490233009833455, "negative": -7.4119590264392405, "neutral": -7.972810784121404 }, "steep": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "slide": { "positive": -7.7970858292735095, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "shares": { "positive": -7.7970858292735095, "negative": -7.4119590264392405, "neutral": -7.972810784121404 }, "fall": { "positive": -8.490233009833455, "negative": -7.4119590264392405, "neutral": -7.972810784121404 }, "wasn't": { "positive": -7.7970858292735095, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "problem": { "positive": -8.490233009833455, "negative": -7.4119590264392405, "neutral": -7.972810784121404 }, "terrausd": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "speed": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "facebook": { "positive": -7.7970858292735095, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "linkedin": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "deleted": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "embattled": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "exchanges": { "positive": -6.6984735406053995, "negative": -7.4119590264392405, "neutral": -7.972810784121404 }, "hunt": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "missing": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "auditor": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "grindset": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "course": { "positive": -7.7970858292735095, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "hacking": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "keeping": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "sanity": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "creative": { "positive": -8.490233009833455, "negative": -7.4119590264392405, "neutral": -7.972810784121404 }, "accounting": { "positive": -8.490233009833455, "negative": -7.4119590264392405, "neutral": -7.972810784121404 }, "kazakhstan": { "positive": -8.490233009833455, "negative": -7.4119590264392405, "neutral": -7.972810784121404 }, "blow": { "positive": -8.490233009833455, "negative": -7.4119590264392405, "neutral": -7.972810784121404 }, "deals": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "operation": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "kncminer": { "positive": -7.7970858292735095, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "core": { "positive": -7.7970858292735095, "negative": -7.4119590264392405, "neutral": -7.972810784121404 }, "scientific": { "positive": -8.490233009833455, "negative": -7.4119590264392405, "neutral": -7.972810784121404 }, "falters": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "green": { "positive": -6.8807950973993535, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "clean": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "genesis": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "funded": { "positive": -7.7970858292735095, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "gig": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "economy": { "positive": -7.7970858292735095, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "securities": { "positive": -7.7970858292735095, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "caution": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "naturally": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "arising": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "alex": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "mashinsky": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "sentence": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "vacated": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "retired": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "court": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "usdc": { "positive": -6.8807950973993535, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "depegs": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "dai": { "positive": -7.391620721165345, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "usdd": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "frax": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "follow": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "yc": { "positive": -6.544322860778141, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "crowd": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "nyt": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "investigation": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "fallen": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "guild": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "games": { "positive": -7.391620721165345, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "produced": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "xrp": { "positive": -7.7970858292735095, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "cryptos": { "positive": -7.7970858292735095, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "marketplace": { "positive": -7.7970858292735095, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "citing": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "'rampant'": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "fakes": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "plagiarism": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "doom": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "polkadot": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "jam": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "laptop": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "lag": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "nine": { "positive": -7.103938648713564, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "cools": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "agrees": { "positive": -7.391620721165345, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "illicit": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "ask": { "positive": -6.6984735406053995, "negative": -7.4119590264392405, "neutral": -7.972810784121404 }, "financial": { "positive": -7.391620721165345, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "vs": { "positive": -7.7970858292735095, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "where": { "positive": -7.7970858292735095, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "go": { "positive": -6.8807950973993535, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "el": { "positive": -7.7970858292735095, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "salvador": { "positive": -7.7970858292735095, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "temporarily": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "suspended": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "'bitcoin": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "wallet'": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "apple": { "positive": -7.7970858292735095, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "store": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "'follow": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "founder's": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "shakedown": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "bros": { "positive": -8.490233009833455, "negative": -7.817424134547405, "neutral": -7.972810784121404 }, "sink": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "eightco": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "skyrocket": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "amass": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "worldcoin": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "issuer": { "positive": -7.103938648713564, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "revolutionary": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "tron": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "free": { "positive": -6.6984735406053995, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "yearend": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "intel": { "positive": -7.103938648713564, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "vets": { "positive": -7.391620721165345, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "helped": { "positive": -7.391620721165345, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "soar": { "positive": -6.8807950973993535, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "unaware": { "positive": -7.391620721165345, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "infamous": { "positive": -7.391620721165345, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "energizing": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "sustainability": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "innovation": { "positive": -6.8807950973993535, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "texas": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "kodak": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "kodakcoin": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "plans": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "records": { "positive": -7.391620721165345, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "theminermag": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "brian": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "armstrong": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "why": { "positive": -6.187647916839409, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "re": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "collectibles": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "nfts": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "africa": { "positive": -7.103938648713564, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "large": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "most": { "positive": -7.391620721165345, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "thing": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "moni": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "human": { "positive": -7.103938648713564, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "centered": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "idea": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "runs": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "jump": { "positive": -7.391620721165345, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "ship": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "bulls": { "positive": -7.391620721165345, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "lone": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "fueled": { "positive": -7.391620721165345, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "study": { "positive": -7.103938648713564, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "futures": { "positive": -7.391620721165345, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "part": { "positive": -7.391620721165345, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "street's": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "race": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "soaring": { "positive": -7.391620721165345, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "surging": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "production": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "crimp": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "margins": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "experiment": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "senate": { "positive": -7.103938648713564, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "passes": { "positive": -7.391620721165345, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "trump": { "positive": -7.103938648713564, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "com": { "positive": -7.391620721165345, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "build": { "positive": -7.391620721165345, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "cro": { "positive": -7.391620721165345, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "jumps": { "positive": -6.8807950973993535, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "caused": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "single": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "delusions": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "booming": { "positive": -7.391620721165345, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "start": { "positive": -7.391620721165345, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "bang": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "trips": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "circuit": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "breaker": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "bitcoin's": { "positive": -7.391620721165345, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "relies": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "strategy's": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "michael": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "saylor": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "kill": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "prophets": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "survey": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "boom": { "positive": -6.293008432497235, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "bust": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "banks": { "positive": -6.8807950973993535, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "ignore": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "breakthrough": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "dispute": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "resolution": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "fueling": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "great": { "positive": -6.6984735406053995, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "irony": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "smaller": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "cousins": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "leading": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "golem": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "bounce": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "alpenglow": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "solana's": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "rewrite": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "black": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "box": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "filings": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "tries": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "confidence": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "washington": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "aim": { "positive": -7.391620721165345, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "win": { "positive": -6.6984735406053995, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "anticipated": { "positive": -7.391620721165345, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "environmental": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "burden": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "united": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "states'": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "europe": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "weirdest": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "empty": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "plants": { "positive": -7.103938648713564, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "few": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "rules": { "positive": -7.391620721165345, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "chip": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "art": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "blocks": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "resists": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "hopium": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "sales": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "observations": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "today's": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "former": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "md": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "stanley": { "positive": -7.391620721165345, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "volatility": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "lead": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "fad": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "future": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "make": { "positive": -7.391620721165345, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "thiel's": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "patterns": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "guide": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "flags": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "wedges": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "triangles": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "desks": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "staffing": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "anticipation": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "prolonged": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "surviving": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "rule": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "covid": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "unlimited": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "printing": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "reached": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "went": { "positive": -7.391620721165345, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "planning": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "golf": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "fit": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "sectors": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "department": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "justice": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "creating": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "units": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "bet": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "legitimate": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "python": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "hold": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "$msbt": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "listing": { "positive": -6.6984735406053995, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "nyse": { "positive": -7.391620721165345, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "mastercard": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "bvnk": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "mythbusting": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "altcoins": { "positive": -7.391620721165345, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "snark": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "technology": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "indexer": { "positive": -7.391620721165345, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "fast": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "latency": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "written": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "kit": { "positive": -7.391620721165345, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "cryptokitties": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "breedable": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "cats": { "positive": -7.391620721165345, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "ethwaterloo": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "winner": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "launching": { "positive": -7.391620721165345, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "stablecoins": { "positive": -7.391620721165345, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "tether's": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "billions": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "makes": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "agree": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "hasten": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "briefly": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "amazon": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "better": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "chasing": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "riskless": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "triangular": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "arbitrage": { "positive": -7.391620721165345, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "widespread": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "swings": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "income": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "profbit": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "drive": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "wave": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "gain": { "positive": -7.391620721165345, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "rivals": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "cash": { "positive": -7.103938648713564, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "easy": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "steps": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "calculator": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "patent": { "positive": -7.391620721165345, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "efficient": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "explained": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "harder": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "adjusts": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "clamping": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "icos": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "predictive": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "spreadsheet": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "brought": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "happen": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "aren't": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "certain": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "mongodb": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "morphia": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "russian": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "born": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "cofounder": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "supported": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "ukraine": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "buildfinance": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "hostile": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "takeover": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "utterly": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "system": { "positive": -7.103938648713564, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "novi": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "fb": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "usdp": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "guatemala": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "usa": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "regulated": { "positive": -7.391620721165345, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "genius": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "act": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "much": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "silver": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "plutonium": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "successful": { "positive": -6.293008432497235, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "spend": { "positive": -7.391620721165345, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "confirm": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "majority": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "goerli": { "positive": -7.391620721165345, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "test": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "dex": { "positive": -7.391620721165345, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "tops": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "winning": { "positive": -7.391620721165345, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "streak": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "overhaul": { "positive": -7.391620721165345, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "scrambling": { "positive": -7.391620721165345, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "fix": { "positive": -7.391620721165345, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "form": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "seeks": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "middle": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "east": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "france": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "branded": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "incomprehensible": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "mep": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "tokenized": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "consumer": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "transition": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "react": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "native": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "jumped": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "fold": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "cloud": { "positive": -7.391620721165345, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "services": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "jpmorgan": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "facilitate": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "chief": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "speedy": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "laws": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "surpasses": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "taylor": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "swift": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "agreed": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "baile": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "proposed": { "positive": -7.391620721165345, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "climate": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "built": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "partnerships": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "recursive": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "split": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "america": { "positive": -7.391620721165345, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "legal": { "positive": -7.391620721165345, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "wyoming": { "positive": -7.103938648713564, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "america's": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "'dao": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "law'": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "effect": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "july": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "receiving": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "final": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "private": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "testnet": { "positive": -7.391620721165345, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "infra": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "cointracker": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "hexel": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "create": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "hedgehog": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "multis": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "business": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "busd": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "discontinue": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "rival": { "positive": -7.103938648713564, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "makerdao": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "erc": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "representatives": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "unveil": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "focused": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "legislation": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "lib": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "ticksupply": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "tick": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "csv": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "dfj": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "usaa": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "series": { "positive": -7.391620721165345, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "led": { "positive": -7.391620721165345, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "ivp": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "stacks": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "qualified": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "offering": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "african": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "valr": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "pantera": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "capital": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "nm": { "positive": -7.391620721165345, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "asic": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "leaderless": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "organization": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "trying": { "positive": -7.391620721165345, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "julian": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "assange": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "late": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "squeeze": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "threaten": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "sue": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "wafers": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "tsmc": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "per": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "taproot": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "activated": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "venture": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "capitalist": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "tim": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "draper": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "auction": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "winklevoss": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "twins": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "gift": { "positive": -7.391620721165345, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "cards": { "positive": -7.391620721165345, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "helps": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "virtual": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "zig": { "positive": -7.391620721165345, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "pure": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "library": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "benchmark": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "alloy": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "rs": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "added": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "sharding": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "sampling": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "pectra": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "what's": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "metamask": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "public": { "positive": -7.103938648713564, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "xnames": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "instead": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "address": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "naming": { "positive": -7.391620721165345, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "mapping": { "positive": -7.391620721165345, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "readable": { "positive": -7.391620721165345, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "names": { "positive": -7.391620721165345, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "dencun": { "positive": -7.103938648713564, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "ushering": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "march": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "th": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "evolved": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "blobs": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "putin": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "aide": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "eyeing": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "beat": { "positive": -7.391620721165345, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "sanctions": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "driving": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "finds": { "positive": -7.391620721165345, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "success": { "positive": -7.391620721165345, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "vendors": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "call": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "solutions": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "battling": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "credit": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "card": { "positive": -7.391620721165345, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "firms": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "issuing": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "ripple": { "positive": -7.391620721165345, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "rail": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "boost": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "rlusd": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "said": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "offered": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "quark": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "coinzest": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "accidental": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "airdrop": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "watched": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "billboards": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "bounced": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "cz's": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "sam": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "crunch": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "pardon": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "clemency": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "pig": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "butchers": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "voyager's": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "walk": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "direct": { "positive": -7.391620721165345, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "valued": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "date": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "nasdaq": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "tells": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "collecting": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "beanie": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "babies": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "fed's": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "megadeal": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "play": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "rbc": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "transfer": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "estimated": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "total": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "south": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "races": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "sent": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "polymarket": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "tiny": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "wood": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "ark": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "planet": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "isn't": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "battle": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "keep": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "mum": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "development": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "unlocking": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "telsa": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "resume": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "easily": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "anthony": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "scaramucci": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "coffee": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "button": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "donations": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "gpus": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "unchained": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "neural": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "nets": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "hurting": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "seeking": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "offer": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "spook": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "lagged": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "tech": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "soared": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "worry": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "find": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "some": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "resources": { "positive": -7.7970858292735095, "negative": -8.51057131510735, "neutral": -7.972810784121404 } }, "oovLogLikelihood": { "positive": -8.490233009833455, "negative": -8.51057131510735, "neutral": -7.972810784121404 }, "vocabulary": ["$msbt", "'biggest", "'bitcoin", "'blockchain'", "'cz'", "'dao", "'follow", "'pig", "'rampant'", "'shutdown'", "aax", "abandoned", "abandoning", "absconds", "absolutely", "absorb", "absorbed", "abstraction", "absurdly", "academic", "acala", "accelerate", "accelerates", "accept", "access", "accidental", "account", "accounting", "accounts", "accumulation", "across", "act", "action", "activated", "activates", "active", "activity", "actor", "actors", "ad", "added", "address", "addresses", "adds", "adjustment", "adjusts", "admin", "admits", "adoption", "ads", "advertising", "advice", "af", "africa", "african", "again", "aggregate", "ago", "agree", "agreed", "agrees", "ahead", "ai", "aide", "aim", "airdrop", "al", "alex", "algorithm", "algorithms", "align", "alike", "all", "allegations", "alleged", "allegedly", "allocating", "allocation", "allowed", "alloy", "almost", "alpenglow", "already", "alt", "altcoin", "altcoing", "altcoins", "alts", "always", "am", "amass", "amazing", "amazon", "america", "america's", "american", "americans", "amid", "amms", "analysis", "analyst", "analysts", "analytics", "anatomy", "announcement", "announces", "anomalies", "another", "anthony", "anti", "anticipated", "anticipation", "any", "anybody", "anymore", "anyone", "anything", "aped", "api", "app", "apparent", "apple", "approaches", "approval", "approved", "approximately", "arbitrage", "arbitrum", "architecture", "area", "aren't", "arising", "ark", "armstrong", "around", "arrest", "arrested", "art", "asean", "asic", "ask", "asked", "asking", "assange", "asset", "assets", "ath", "atm", "atms", "attack", "attacker", "attackers", "attacking", "attempt", "auction", "audit", "auditor", "authority", "availability", "average", "averaged", "awaiting", "award", "away", "aws", "babies", "back", "backed", "bad", "bag", "bagholders", "baile", "ban", "bancor", "bang", "bank", "bankman", "bankrupt", "bankruptcy", "banks", "banning", "bans", "base", "based", "battle", "battling", "beanie", "bear", "bearish", "bears", "beat", "beautifully", "became", "because", "becomes", "becoming", "beginner", "beginning", "behind", "benchmark", "best", "besu", "bet", "bets", "better", "betterment", "big", "biggest", "bill", "billboards", "billion", "billions", "binance", "binance's", "bitclout's", "bitcoin", "bitcoin's", "bitcoins", "bitfinex", "bithumb", "bitmart", "bittrex", "black", "blacklisted", "blackrock", "blame", "blamed", "bleed", "bleeding", "blobs", "block", "blockchain", "blocks", "bloodbath", "blow", "bnb", "board", "bond", "book", "bookkeeping", "books", "boom", "booming", "booms", "boost", "border", "born", "bot", "both", "bottom", "bounce", "bounced", "bound", "box", "brace", "branded", "breach", "break", "breakdown", "breaker", "breaking", "breakout", "breaks", "breakthrough", "breedable", "brian", "bribed", "brick", "bridge", "briefly", "bro", "broke", "broken", "bros", "brother", "brothers", "brought", "brutal", "bsc", "btc", "bubble", "bug", "build", "buildfinance", "building", "built", "bull", "bullish", "bulls", "bump", "burden", "burst", "busd", "business", "bust", "butchering'", "butchers", "butterfly", "button", "buy", "buyers", "buying", "buys", "buzz", "bvnk", "bybit", "calculator", "call", "called", "calls", "cambodia", "canada", "cannot", "cap", "capacity", "capital", "capitalist", "capitalize", "capitulation", "card", "cards", "careless", "cascade", "case", "cash", "cashio", "catalyst", "catch", "cats", "caused", "caution", "cefi", "celebrities", "celsius", "centered", "central", "cents", "ceo", "certain", "chain", "chaincoin", "chains", "change", "changed", "changelog", "changes", "changing", "changpeng", "channels", "chapter", "charged", "charges", "charity", "chart", "chartered", "charts", "chasing", "chatgpt", "cheap", "checkout", "cheer", "chefs", "chicago", "chief", "china", "chip", "choices", "circle", "circuit", "citing", "claim", "clamping", "clarity", "class", "classic", "clean", "clear", "cleared", "clearly", "clemency", "clients", "cliff", "climate", "clobbered", "close", "closed", "closer", "cloud", "co", "code", "coffee", "cofounder", "coin", "coinbase", "coinbase's", "coins", "cointracker", "coinzest", "cold", "colder", "collapse", "collapsed", "collapses", "collapsing", "collateral", "collectibles", "collecting", "colorado", "com", "coming", "command", "community", "companies", "company", "comparison", "compiled", "complain", "complete", "completed", "completely", "compression", "compromised", "concepts", "concerns", "conditions", "conference", "confidence", "confirm", "confirmed", "confirms", "congress", "consensus", "consolidation", "conspiracy", "constant", "constructions", "consumer", "contagion", "contagious", "content", "continuation", "continue", "continued", "continues", "contract", "contractor's", "contracts", "contrastive", "contributor", "control", "controversial", "conviction", "cooked", "cools", "core", "corporate", "correction", "cosmetic", "cost", "costs", "counterparty", "countries", "couple", "course", "court", "cousins", "covid", "cpi", "crackdown", "cracking", "crash", "crashed", "crashes", "crashing", "crater", "cratered", "crazy", "create", "creating", "creative", "credit", "criminal", "criminally", "criminals", "crimp", "crisis", "cro", "cross", "crossed", "crowd", "crunch", "crypto", "cryptoasset", "cryptocurrencies", "cryptocurrency", "cryptography", "cryptokitties", "cryptos", "csv", "cto", "curious", "currency", "current", "currently", "curve", "custody", "customer", "customers", "cut", "cuts", "cycle", "cz's", "dai", "daily", "dangerous", "dao", "darkside", "data", "date", "day", "days", "dca", "dead", "deal", "deals", "death", "debut", "december", "decentralized", "decisively", "declares", "deduct", "deep", "deepens", "default", "defending", "defi", "defining", "deflationary", "deleted", "delivering", "delusions", "demand", "demanding", "dencun", "department", "depeg", "depegs", "deposits", "depot", "derivatives", "design", "desks", "despair", "desperate", "despite", "destroy", "destroyed", "destroying", "detail", "detect", "detecting", "detectives", "detector", "developer", "developers", "development", "devices", "devs", "dex", "dfj", "diamond", "differences", "different", "differs", "difficulty", "digesting", "digital", "digits", "dip", "direct", "dirty", "disappeared", "disclosure", "discontinue", "discord", "discussing", "discussion", "dispute", "dissecting", "distribution", "ditch", "dive", "documentation", "documents", "doesn", "dogecoin", "doj", "dollar", "dollars", "dominance", "don't", "donations", "done", "doom", "dormancy", "dotcom", "double", "doubled", "doubling", "doubted", "dovish", "down", "downgrades", "downtrend", "dprk", "drain", "drained", "drains", "draper", "dreams", "drive", "driven", "drives", "driving", "drop", "dropped", "drops", "due", "dump", "dumped", "dumping", "dumps", "dxsale", "dynamics", "each", "early", "earth", "ease", "easily", "east", "easy", "economics", "economist", "economy", "ecosystem", "education", "educational", "effect", "efficient", "eightco", "eip", "el", "elliptic", "embattled", "embroiled", "emergency", "emerging", "eminifx", "empty", "enables", "end", "ending", "energizing", "energy", "enforcement", "entire", "entirely", "entrepreneur", "environment", "environmental", "eoa", "eos", "era", "erc", "estimated", "estimates", "estimation", "etf", "etfs", "eth", "ether", "ethereum", "ethereum's", "ethresearch", "ethwaterloo", "euphoric", "europe", "european", "even", "event", "ever", "evernote", "every", "everyone", "everyones", "everything", "everywhere", "evolved", "exactly", "exceed", "except", "exch", "exchange", "exchanges", "executives", "existential", "exit", "exits", "expands", "expectations", "expected", "expects", "expensive", "experience", "experiencing", "experiment", "explained", "explainer", "explanation", "exploding", "exploit", "exploited", "exploiting", "explorer", "export", "extend", "extended", "extension", "extortionists", "extractable", "extremely", "eyeing", "fa", "face", "facebook", "faces", "facilitate", "fad", "fade", "failed", "failure", "fair", "fake", "faked", "fakes", "fall", "fallen", "falling", "falls", "falters", "families", "family", "famous", "faq", "far", "farm", "farmers", "fast", "faster", "fault", "fb", "fbi", "fear", "fears", "feature", "features", "fed", "fed's", "federal", "feds", "fee", "feeling", "feels", "fees", "few", "fi", "fia", "figures", "figuring", "filed", "files", "filing", "filings", "filter", "final", "finally", "finance", "financial", "financially", "financials", "find", "finds", "fine", "fines", "fingered", "fintech", "fire", "firm", "firmly", "firms", "firmware", "first", "fit", "fix", "flag", "flags", "flash", "flat", "flaw", "flinching", "flipping", "floods", "florida", "flow", "fluencelabs", "flush", "focused", "fold", "follow", "followed", "following", "fomc", "fomo", "force", "forever", "forfeited", "forgive", "fork", "form", "former", "forms", "formula", "forum", "foss", "found", "foundation", "founder", "founder's", "founders", "fourth", "framework", "france", "fraud", "fraudulent", "frax", "free", "fried", "friend", "friendly", "friends", "froze", "frozen", "ftc", "ftx", "fud", "fueled", "fueling", "full", "fund", "fundamentals", "funded", "funding", "funds", "fusaka", "future", "futures", "fyi", "gain", "gaining", "gains", "games", "gang", "gas", "gdax", "genesis", "genius", "get", "geth", "gets", "getting", "giant", "giants", "gift", "gig", "giveaway", "global", "globally", "go", "god's", "goerli", "goes", "going", "gold", "goldman", "golem", "golf", "gone", "good", "google", "got", "gov", "governance", "government", "gox", "gpus", "grad", "grandma", "graveyard", "great", "greed", "green", "greenlight", "grim", "grinds", "grindset", "group", "grow", "growing", "grows", "growth", "gsd", "guatemala", "guide", "guild", "guilty", "gwei", "hack", "hacked", "hacker", "hackers", "hacking", "half", "halt", "halted", "halts", "halved", "halving", "hamilton", "handily", "hands", "happen", "happy", "hard", "harder", "hardware", "hash", "hashrate", "hasten", "healthiest", "healthy", "heating", "heavily", "heavy", "hedge", "hedgehog", "heist'", "held", "help", "helped", "helps", "here", "hexel", "high", "hijacked", "history", "hit", "hits", "hn", "hodlers", "hodling", "hodlnaut", "hold", "holders", "holding", "holdings", "holds", "home", "honeypotscan", "hopes", "hopium", "horizon", "hostile", "hot", "hour", "hourly", "hours", "how", "huge", "human", "hunt", "hunted", "hunters", "hurt", "hurting", "hype", "iced", "icos", "idea", "identification", "ignore", "illegal", "illicit", "immigrant", "imo", "impact", "impactful", "implementations", "implemented", "impressive", "income", "incoming", "incomprehensible", "increase", "increasingly", "indefinitely", "index", "indexer", "india's", "indicators", "indicted", "industry", "infamous", "infinite", "inflation", "inflencers", "inflows", "influencer", "infra", "innovation", "insane", "inside", "insolvent", "instant", "instantly", "instead", "institutional", "institutions", "intel", "interest", "internet", "intro", "introduced", "intrusions", "invested", "investigation", "investment", "investor", "investors", "iota", "ipo", "iran", "iran's", "irony", "irs", "island", "isn't", "issue", "issuer", "issues", "issuing", "it's", "itself", "ivp", "jail", "jam", "japanese", "job", "john", "join", "jointly", "jp", "jpmorgan", "judge", "julian", "july", "jump", "jumped", "jumps", "just", "justice", "justin", "kazakhstan", "keep", "keeping", "keeps", "kelp", "key", "keys", "kia", "kidnappings", "kill", "kiss", "kit", "kncminer", "know", "knowledge", "kodak", "kodakcoin", "korea", "korea's", "korean", "kraken", "kwon", "labs", "lag", "lagged", "lambo", "laptop", "large", "largest", "last", "late", "latency", "latest", "launch", "launched", "launcher", "launches", "launching", "launder", "laureate", "law'", "laws", "lawsuit", "layer", "layoffs", "lead", "leaderless", "leading", "leak", "learn", "learned", "learning", "least", "leaving", "led", "ledger", "left", "leg", "legal", "legislation", "legitimate", "lender", "less", "lesson", "lessons", "lets", "level", "levels", "leverage", "leveraged", "lfg", "liable", "lib", "library", "life", "lifts", "light", "lightning", "like", "likely", "line", "lineup", "linkedin", "links", "liquidated", "liquidation", "liquidations", "liquidity", "list", "listing", "live", "loaded", "lone", "long", "longer", "longs", "look", "looking", "looks", "loophole", "lose", "loses", "losing", "loss", "losses", "lost", "low", "lower", "lows", "luck", "luna", "ma", "macro", "macroeconomic", "made", "mailing", "mainnet", "mainstream", "maintenance", "major", "majority", "majors", "make", "makerdao", "makers", "makes", "man", "manager", "many", "mapping", "march", "margin", "margins", "market", "marketplace", "markets", "marks", "marshals", "mashinsky", "mass", "massive", "mastercard", "mathematically", "matured", "maxis", "mb", "mcafee", "md", "mechanically", "mechanics", "mechanisms", "media", "megadeal", "members", "meme", "mempool", "mep", "merge", "merits", "metamask", "metrics", "mev", "mevboost", "mevbots", "michael", "middle", "milestone", "million", "millions", "mine", "miner", "miners", "mining", "minor", "mint", "minutes", "misleading", "missing", "mission", "mistake", "mistrial", "misused", "mit", "model", "modern", "modestly", "modular", "mogul", "moment", "momentum", "money", "mongodb", "moni", "month", "monthly", "months", "moon", "mooning", "more", "morgan", "morning", "morphia", "most", "mostly", "move", "moved", "moves", "moving", "mt", "much", "mulls", "multi", "multimillion", "multiple", "multis", "multisig", "mum", "murray", "mythbusting", "nader", "nailed", "naji", "name", "names", "naming", "nasdaq", "nassim", "national", "nations", "nationwide", "native", "naturally", "near", "nearly", "nears", "need", "negative", "net", "nethermind", "nets", "network", "networks", "neural", "never", "new", "newer", "next", "nft", "nfts", "nhk", "nicehash", "nine", "nm", "no", "nobel", "node", "non", "nonstop", "nork", "normal", "north", "not", "notable", "notes", "notice", "notification", "notifications", "novi", "now", "nowhere", "nuanced", "nuked", "numbers", "nvidia", "nyse", "nyt", "observations", "observed", "off", "offer", "offered", "offering", "offers", "official", "officially", "offline", "offset", "ohio", "okcupid", "old", "onboarding", "once", "one", "online", "only", "open", "openai's", "opens", "operation", "operations", "operator", "optimism", "optimistic", "oracles", "order", "ordered", "ordering", "oregon", "organization", "organizes", "originates", "other", "out", "outage", "outflows", "outlook", "outperformed", "over", "overhaul", "overnight", "overseas", "own", "owners", "packages", "paid", "pain", "palpable", "panic", "panicking", "pantera", "paper", "par", "parabolic", "pardon", "part", "participants", "partners", "partnership", "partnerships", "party", "passes", "past", "pastor", "patent", "patience", "pattern", "patterns", "pauses", "paxos", "pay", "paying", "payment", "payments", "paypal", "peak", "pectra", "peg", "pending", "pension", "people", "per", "percent", "performing", "period", "perpetrated", "persist", "peter", "philippines", "phished", "phishing", "phone", "phrase", "pi", "pig", "piling", "pilots", "pivot", "plagiarism", "plan", "planet", "planning", "plans", "plant", "plants", "platform", "play", "playing", "plead", "pleads", "please", "plummet", "plummets", "plunges", "plutonium", "policy", "polkadot", "poll", "polygon", "polymarket", "ponzi", "pool", "pools", "popular", "portal", "portfolio", "pos", "position", "positive", "possible", "post", "posting", "posts", "potentially", "pow", "power", "practices", "pre", "prediction", "predictive", "predicts", "preferred", "presents", "preserving", "press", "pressure", "prevent", "previous", "price", "prices", "primer", "print", "printed", "printing", "prior", "prioritize", "prison", "privacy", "private", "probe", "problem", "process", "processor", "produced", "product", "production", "products", "profbit", "profile", "profit", "profitability", "profitable", "profits", "project", "projects", "prolonged", "promoting", "promotion", "proof", "proofs", "prophets", "proposal", "proposals", "proposed", "pros", "prosecute", "protected", "protection", "protocol", "protocols", "proud", "providers", "psychological", "public", "published", "pull", "pulled", "pulls", "pump", "pumping", "pure", "pushing", "putin", "python", "qualified", "quantum", "quark", "quarter", "quarterly", "queries", "question", "questions", "quiet", "quietly", "quit", "quits", "race", "races", "rail", "rails", "raised", "raises", "rallies", "rally", "ran", "range", "ranks", "ransom", "ransomware", "rapidly", "raspberry", "rate", "rates", "rbc", "rd", "re", "reach", "reached", "reaches", "react", "read", "readable", "readers", "reading", "real", "realization", "realized", "reason", "rebooted", "rebound", "receives", "receiving", "recent", "recently", "reclaimed", "recommendations", "recommended", "record", "records", "recover", "recovers", "recovery", "recursive", "red", "references", "refresh", "refuse", "regret", "regrets", "regulated", "regulation", "regulator", "regulators", "rekt", "related", "release", "released", "reliably", "relies", "remained", "reminder", "remittance", "renewable", "reorg", "replacing", "replaying", "report", "reportedly", "reporters", "reports", "reposts", "representatives", "required", "research", "reserve", "reserves", "resistance", "resists", "resolution", "resources", "result", "resulting", "resume", "retail", "retailer", "retired", "retrospective", "return", "returning", "returns", "revenue", "reverberates", "reversed", "review", "revives", "revolutionary", "rewarded", "rewrite", "rich", "richer", "rigged", "right", "rightly", "rigs", "ripping", "ripple", "risk", "riskless", "rival", "rivals", "rlusd", "roadmap", "robinhood", "rollup", "rotating", "rotten", "rout", "routine", "rs", "rug", "rugged", "rugpull", "ruin", "rule", "rules", "rumored", "rumors", "run", "running", "runs", "russian", "russians", "safedollar", "safesnipe", "said", "saigon", "sale", "sales", "salvador", "sam", "same", "sampling", "sanctions", "sanity", "sats", "save", "saves", "saving", "savings", "saylor", "says", "sbi", "scaling", "scam", "scammed", "scammer", "scammers", "scams", "scaramucci", "schedule", "scheduled", "scheme", "schemes", "scientific", "scorched", "scores", "scrambling", "searches", "season", "sec", "sec's", "second", "seconds", "sector", "sectors", "securities", "security", "see", "seed", "seeking", "seeks", "seen", "seize", "seized", "seizes", "self", "sell", "selling", "selloff", "sells", "senate", "send", "sends", "sent", "sentence", "sentenced", "sentencing", "sentiment", "series", "serious", "servers", "service", "services", "session", "set", "settle", "settlement", "setup", "seven", "severe", "shakedown", "shaken", "shallow", "shambles", "sharding", "share", "shared", "shares", "sharing", "shills", "ship", "shipping", "ships", "shitcoin", "shock", "short", "shorts", "show", "shows", "shrink", "shut", "shutdown", "shuts", "sidelined", "signaling", "signatures", "significant", "significantly", "signs", "silent", "silver", "sim", "simplified", "since", "single", "sink", "sinks", "sites", "sitting", "six", "size", "skyrocket", "slammed", "slide", "slip", "slips", "small", "smaller", "smart", "snark", "snarks", "so", "soar", "soared", "soaring", "soars", "social", "software", "sol", "solana", "solana's", "sold", "solution", "solutions", "some", "son", "source", "south", "space", "speaks", "speculative", "speed", "speedy", "spend", "spending", "spent", "spike", "spikes", "spiking", "split", "spook", "spot", "spreadsheet", "squeeze", "stable", "stablecoin", "stablecoins", "stack", "stacked", "stacks", "staff", "staffing", "stake", "staking", "standard", "stanley", "start", "started", "starting", "startup", "startups", "stash", "state", "statements", "states'", "stats", "steadily", "steady", "steal", "stealing", "steals", "steep", "stellar", "step", "steps", "sticking", "still", "stock", "stocks", "stoked", "stole", "stolen", "stop", "stopped", "storage", "store", "strangling", "strategic", "strategy", "strategy's", "streak", "stream", "street's", "strength", "strong", "stronger", "structure", "structured", "study", "style", "subject", "subpoenaed", "success", "successful", "sudden", "sue", "sued", "sues", "summary", "summer", "sun", "super", "superbowl", "supply", "support", "supported", "surge", "surges", "surging", "surpasses", "surprise", "survey", "surviving", "suspected", "suspended", "suspends", "sustainability", "sustainable", "swan", "swaps", "swift", "swindled", "swing", "swings", "system", "systemic", "tailwinds", "take", "takeover", "takes", "taking", "taleb", "talent", "tanking", "taproot", "target", "targets", "tax", "taylor", "tea", "team", "tech", "technical", "technically", "technicals", "technology", "teen", "telegrams", "tell", "tells", "telsa", "temporarily", "term", "terra", "terrausd", "terrible", "territory", "tesla", "test", "testnet", "tether", "tether's", "texas", "textbook", "th", "than", "thanks", "theft", "thefts", "theminermag", "there", "thesis", "thiel", "thiel's", "thing", "thorchain", "thoughts", "thousands", "thread", "threat", "threaten", "three", "threshold", "throughput", "throwing", "tick", "ticks", "ticksupply", "tied", "tight", "tim", "time", "timeline", "tiny", "today", "today's", "todd", "token", "tokenized", "tokenomics", "tokens", "tokyo", "tomorrow", "too", "tool", "top", "tops", "total", "touch", "towel", "town", "track", "traction", "trade", "tradeoffs", "traders", "trades", "tradfi", "trading", "traditional", "transaction", "transactions", "transfer", "transition", "treasury", "trend", "triangle", "triangles", "triangular", "tries", "triggered", "triggers", "trips", "tron", "trt", "trump", "trust", "trying", "tsb", "tsmc", "tumbles", "tumbling", "turkey", "turkish", "turn", "turned", "turning", "turns", "turtledex", "tvl", "twins", "twitter", "two", "type", "ugly", "ui", "ukraine", "unaudited", "unaware", "unbearable", "unchained", "unchanged", "unclear", "undeniable", "under", "underwater", "underway", "unfolding", "united", "units", "unlike", "unlimited", "unlock", "unlocking", "unreal", "unregulated", "unreported", "unsuspecting", "unveil", "up", "upbit", "update", "updated", "updates", "upgrade", "upgrades", "upside", "usa", "usaa", "usage", "usd", "usdc", "usdd", "usdp", "use", "used", "user", "users", "users'", "uses", "ushering", "using", "ust", "utc", "utterly", "ux", "vacated", "validator", "validators", "valr", "value", "valued", "vc", "vcs", "vendors", "vengeance", "venture", "verify", "version", "versus", "very", "veteran", "vets", "via", "viciously", "victim", "victims", "video", "vietnam", "vietnamese", "virtual", "visa", "volatility", "volume", "volumes", "voyager's", "vps", "vs", "vulnerabilities", "wafers", "wagmi", "waiting", "wake", "walk", "wall", "wallet", "wallet'", "wallets", "want", "wants", "warehouse", "warning", "warns", "washington", "wasn't", "watched", "watershed", "wave", "way", "wazirx", "weak", "wealth", "web", "website", "wedge", "wedges", "wednesday", "week", "weekly", "weeks", "weirdest", "welcomes", "well", "went", "werewolf", "whale", "whales", "what's", "where", "whitepaper", "whole", "why", "widespread", "win", "winklevoss", "winner", "winning", "wins", "winter", "wipe", "wiped", "withdrawals", "within", "without", "won", "wood", "work", "worked", "working", "works", "workshop", "world", "worldcoin", "worry", "worsens", "worst", "worth", "worthless", "writing", "written", "wyoming", "xnames", "xrp", "yc", "year", "yearend", "years", "yesterdays", "yet", "yggtorrent", "yield", "youtube", "ytd", "zero", "zhao", "zig", "zk"], "trainedAt": "2026-05-31T18:01:04.049Z", "trainSize": 789, "testSize": 72 };
  }
});

// api/_lib/ai/nlp/model-metrics.ts
var MODEL_METRICS;
var init_model_metrics = __esm({
  "api/_lib/ai/nlp/model-metrics.ts"() {
    MODEL_METRICS = { "accuracy": 0.7361, "macroF1": 0.7385, "perClass": { "positive": { "precision": 0.6786, "recall": 0.7308, "f1": 0.7037, "support": 26 }, "negative": { "precision": 0.85, "recall": 0.6538, "f1": 0.7391, "support": 26 }, "neutral": { "precision": 0.7083, "recall": 0.85, "f1": 0.7727, "support": 20 } }, "confusion": { "positive": { "positive": 19, "negative": 2, "neutral": 5 }, "negative": { "positive": 7, "negative": 17, "neutral": 2 }, "neutral": { "positive": 2, "negative": 1, "neutral": 17 } }, "testSize": 72, "errors": [{ "text": "Massive whale wallet accumulating quietly, smart money moving in", "trueLabel": "positive", "predicted": "negative", "confidence": 0.5469 }, { "text": "Whales accumulated 30,000 BTC last week, on-chain data shows", "trueLabel": "positive", "predicted": "neutral", "confidence": 0.4358 }, { "text": "Validator decentralization improves, security profile strengthens", "trueLabel": "positive", "predicted": "neutral", "confidence": 0.7643 }, { "text": "Locked in stable yields on a defi vault, passive income looking nice", "trueLabel": "positive", "predicted": "neutral", "confidence": 0.8959 }, { "text": "Loaded up the truck at support, looking like a generational entry", "trueLabel": "positive", "predicted": "neutral", "confidence": 0.647 }, { "text": "Network upgrade smooth as butter, no incidents reported", "trueLabel": "positive", "predicted": "neutral", "confidence": 0.874 }, { "text": "No fud can shake my conviction, this cycle is just getting started", "trueLabel": "positive", "predicted": "negative", "confidence": 0.4662 }, { "text": "Validators slashed for double-signing, network reliability questioned", "trueLabel": "negative", "predicted": "neutral", "confidence": 0.4647 }, { "text": "Btc breakdown looks terminal, bear market may have another year left", "trueLabel": "negative", "predicted": "positive", "confidence": 0.563 }, { "text": "Bitcoin is in a bubble, this will not end well says hedge fund manager", "trueLabel": "negative", "predicted": "positive", "confidence": 0.9101 }, { "text": "Stablecoin depegs below 70 cents, ecosystem in panic mode", "trueLabel": "negative", "predicted": "positive", "confidence": 0.5403 }, { "text": "Tokenomics broken, inflation outpacing burn, terminal decline ahead", "trueLabel": "negative", "predicted": "neutral", "confidence": 0.642 }, { "text": "Total losses from crypto scams in Vietnam reach record this year", "trueLabel": "negative", "predicted": "positive", "confidence": 0.8445 }, { "text": "Hopes for ETF approval dashed by SEC last minute rejection", "trueLabel": "negative", "predicted": "positive", "confidence": 0.9412 }, { "text": "Fear and greed index plunges into extreme fear territory", "trueLabel": "negative", "predicted": "positive", "confidence": 0.8248 }, { "text": "Bitcoin dropped sharply on regulatory concerns from Vietnam SBV", "trueLabel": "negative", "predicted": "positive", "confidence": 0.5448 }, { "text": "Sharing a useful spreadsheet for tracking your crypto cost basis over time", "trueLabel": "neutral", "predicted": "positive", "confidence": 0.6289 }, { "text": "Beginner asking what the difference is between coins and tokens", "trueLabel": "neutral", "predicted": "negative", "confidence": 0.5916 }, { "text": "Bitcoin trading sideways for the past week, low volatility regime", "trueLabel": "neutral", "predicted": "positive", "confidence": 0.8745 }], "vocabSize": 2268, "trainSize": 789, "trainedAt": "2026-05-31T18:01:04.049Z", "algorithm": "multinomial-naive-bayes (distant-supervision: gold=289 + silver=500)", "smoothingAlpha": 1 };
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
  const tokens = cleaned.match(/[a-z']+|🚀|💎|\$[a-z]{2,8}/g) || [];
  return tokens.filter((t) => t.length >= 2 && t.length <= 20 && !STOPWORDS.has(t));
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
    if (row) {
      const vals = [contrib.positive, contrib.negative, contrib.neutral];
      const span = Math.max(...vals) - Math.min(...vals);
      featureContribs.push({ token: t, contributions: contrib });
      featureContribs.__lastSpan = span;
    }
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
function pushMentionSample(coin, count) {
  const arr = MENTION_HISTORY.get(coin) || [];
  arr.push({ ts: Date.now(), count });
  if (arr.length > HISTORY_MAX) arr.shift();
  MENTION_HISTORY.set(coin, arr);
}
function zScore(coin, current) {
  const arr = MENTION_HISTORY.get(coin) || [];
  if (arr.length < 3) return { z: 0, mean: current, std: 0, n: arr.length };
  const values = arr.map((s) => s.count);
  const mean = values.reduce((s, v) => s + v, 0) / values.length;
  const variance = values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length;
  const std = Math.sqrt(variance);
  const z = std > 0 ? (current - mean) / std : 0;
  return { z: Number(z.toFixed(2)), mean: Math.round(mean), std: Math.round(std), n: arr.length };
}
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
  const news = await collectHnForSymbol(symbol).catch((e) => ({
    posts: [],
    sources: [],
    errors: [e.message]
  }));
  stages.push({
    name: "collect.hackerNews",
    status: news.errors.length === 0 ? "ok" : news.posts.length > 0 ? "partial" : "failed",
    message: `${news.posts.length} HN stories from ${news.sources.length} queries` + (news.errors.length ? ` (errors: ${news.errors.length})` : ""),
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
  const t2a = Date.now();
  const docs = [
    ...reddit.posts.map((p) => ({
      kind: "reddit",
      src: p,
      text: `${p.title}
${p.selftext.slice(0, 300)}`,
      weight: Math.max(1, p.ups)
    })),
    ...news.posts.map((n) => ({
      kind: "news",
      src: n,
      text: n.title,
      weight: Math.max(1, n.points + 1)
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
      subreddit: `HN/${n.author}`,
      ups: n.points,
      numComments: n.numComments,
      ageMin: Math.round((Date.now() / 1e3 - n.createdUtc) / 60),
      url: n.hnUrl,
      compound: ds.compound,
      label: ds.label,
      matchedTerms: ds.matchedTerms
    };
  });
  const topPositive = perPost.filter((p) => p.matchedTerms.length > 0 && p.compound > 0.05).sort((a, b) => b.compound * Math.log10(b.ups + 2) - a.compound * Math.log10(a.ups + 2)).slice(0, 5);
  const topNegative = perPost.filter((p) => p.matchedTerms.length > 0 && p.compound < -0.05).sort((a, b) => a.compound * Math.log10(a.ups + 2) - b.compound * Math.log10(b.ups + 2)).slice(0, 5);
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
  pushMentionSample(base, mentions);
  const zs = zScore(base, mentions);
  const spike = zs.z > 1.5 && zs.n >= 5;
  stages.push({
    name: "analyse.anomaly",
    status: "ok",
    message: `z=${zs.z} (history n=${zs.n}, \u03BC=${zs.mean}, \u03C3=${zs.std}) \u2192 ${spike ? "SPIKE" : "normal"}`,
    latencyMs: Date.now() - t2b
  });
  const t2c = Date.now();
  const wVader = 0.4, wNB = 0.6;
  const socialTextScore = corpus.corpus.matchedDocCount + nbCorpus.matchedDocCount > 0 ? corpus.corpus.weightedCompound * wVader + nbCorpus.weightedCompound * wNB : 0;
  let w = { socialText: 0.5, coinGecko: 0.25, fearGreed: 0.25 };
  if (!cg.ok) {
    w.socialText += w.coinGecko * 0.7;
    w.fearGreed += w.coinGecko * 0.3;
    w.coinGecko = 0;
  }
  if (!fg.ok) {
    w.socialText += w.fearGreed * 0.7;
    w.coinGecko += w.fearGreed * 0.3;
    w.fearGreed = 0;
  }
  if (corpus.corpus.matchedDocCount + nbCorpus.matchedDocCount === 0) {
    w.coinGecko += w.socialText * 0.5;
    w.fearGreed += w.socialText * 0.5;
    w.socialText = 0;
  }
  const cgScore = cg.ok ? (cg.voteUpPct - cg.voteDownPct) / 100 : 0;
  const fgScore = fg.ok ? (fg.current.value - 50) / 50 : 0;
  const composite = Number(
    (socialTextScore * w.socialText + cgScore * w.coinGecko + fgScore * w.fearGreed).toFixed(4)
  );
  const composite0to100 = Math.round((composite + 1) * 50);
  const confidence = Math.min(
    0.97,
    0.3 + (corpus.corpus.matchedDocCount > 0 ? 0.25 : 0) + (cg.ok ? 0.2 : 0) + (fg.ok ? 0.15 : 0) + (Math.abs(composite) > 0.4 ? 0.1 : 0)
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
      technique: "Multinomial Naive Bayes (trained from scratch)",
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
    fusion: {
      vaderWeight: wVader,
      naiveBayesWeight: wNB,
      redditWeight: Number(w.socialText.toFixed(2)),
      coinGeckoWeight: Number(w.coinGecko.toFixed(2)),
      fearGreedWeight: Number(w.fearGreed.toFixed(2)),
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
  const r = await runAltDataPipeline(symbol);
  return { score: r.fusion.compositeScore, label: r.fusion.label, spike: r.anomaly.spike };
}
var MENTION_HISTORY, HISTORY_MAX;
var init_pipeline = __esm({
  "api/_lib/ai/pipeline.ts"() {
    init_reddit();
    init_hackerNews();
    init_fearGreed();
    init_coingecko();
    init_vader();
    init_classifier();
    MENTION_HISTORY = /* @__PURE__ */ new Map();
    HISTORY_MAX = 24;
  }
});

// api/_lib/ai/fraud.ts
function checkFraud(accountId, tx) {
  const acc = getAccount(accountId);
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
  if (tx.asset) {
    const s = getSentiment(tx.asset);
    if (tx.type === "BUY" && s.score < -0.5) {
      risk += 0.18;
      reasons.push(
        `Buying ${tx.asset} while social sentiment is ${s.label.toLowerCase()} (${s.score.toFixed(2)}).`
      );
    }
  }
  const hour = new Date(tx.timestamp ?? Date.now()).getUTCHours();
  if (hour >= 19 || hour <= 22) {
    risk += 0.05;
  }
  risk = Math.min(1, Number(risk.toFixed(3)));
  const verdict = risk > 0.7 ? "BLOCK" : risk > 0.4 ? "REVIEW" : "SAFE";
  const recommendedAction = verdict === "BLOCK" ? "Hold transaction. Trigger step-up authentication or manual review." : verdict === "REVIEW" ? "Show user a confirmation dialog and require explicit consent." : "Auto-approve transaction.";
  return { riskScore: risk, verdict, reasons, recommendedAction };
}
async function checkFraudWithRealAltData(accountId, tx) {
  const base = checkFraud(accountId, tx);
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
    init_altdata();
    init_pipeline();
  }
});

// api/_lib/ai/advisor.ts
async function buildAdvisor(accountId, profile = "BALANCED") {
  const acc = getAccount(accountId);
  const fg = await getFearGreed();
  const raw2 = UNIVERSE.map((u) => {
    const sent = getSentiment(u.symbol);
    const whale = getWhaleFlow(u.symbol);
    const tilt = sent.score * 0.35 + (whale.netFlow24hUsd > 0 ? 0.15 : -0.1) + (fg.value > 60 ? -0.05 : fg.value < 40 ? 0.07 : 0);
    const base = u.defaultWeight[profile];
    const adjusted = Math.max(0, base * (1 + tilt));
    const signal = signalFromSentiment(sent.score, 0);
    const rationale = signal === "BUY" ? `AI BUY \u2014 sentiment ${sent.label} (${sent.score.toFixed(2)}), whales accumulating.` : signal === "SELL" ? `Reduced from base \u2014 sentiment ${sent.label}, whales distributing.` : `Neutral tilt \u2014 sentiment ${sent.label}, holding base allocation.`;
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
    const v = p.amount * 1e3;
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
  return {
    riskProfile: profile,
    targetAllocation,
    cashBufferPct: cashBuffer * 100,
    expectedReturnPct: EXPECTED_RETURN[profile],
    volatilityPct: VOL[profile],
    rebalanceActions: actions,
    narrative: `For a ${profile.toLowerCase()} investor, the AI advisor tilts the portfolio using live alternative-data signals \u2014 Fear & Greed ${fg.value} (${fg.classification}), social sentiment, and on-chain whale flow. Expected 12-month return ~${EXPECTED_RETURN[profile]}% with ~${VOL[profile]}% volatility. Cash buffer ${(cashBuffer * 100).toFixed(0)}% kept for dip-buy opportunities.`
  };
}
var UNIVERSE, EXPECTED_RETURN, VOL, CASH_BUFFER;
var init_advisor = __esm({
  "api/_lib/ai/advisor.ts"() {
    init_state();
    init_altdata();
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
  }
});

// api/_lib/ai/sources/btcMarket.ts
async function fetchBtcSnapshot() {
  if (SNAPSHOT_CACHE && Date.now() - SNAPSHOT_CACHE.ts < SNAPSHOT_TTL_MS) return SNAPSHOT_CACHE.data;
  try {
    const [marketsRes, globalRes] = await Promise.all([
      fetch("https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=bitcoin&price_change_percentage=24h", {
        headers: { "User-Agent": USER_AGENT5, "Accept": "application/json" }
      }),
      fetch("https://api.coingecko.com/api/v3/global", {
        headers: { "User-Agent": USER_AGENT5, "Accept": "application/json" }
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
    const url = `https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=${cappedDays}&interval=daily`;
    const res = await fetch(url, { headers: { "User-Agent": USER_AGENT5, "Accept": "application/json" } });
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
var USER_AGENT5, SNAPSHOT_CACHE, SNAPSHOT_TTL_MS, HISTORY_CACHE, HISTORY_TTL_MS;
var init_btcMarket = __esm({
  "api/_lib/ai/sources/btcMarket.ts"() {
    USER_AGENT5 = "CoinWiseAI/1.0 (Vietnam fintech assignment)";
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
      return c.json(checkFraud(body.accountId, body.transaction));
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
      const real = await withTimeout2(runAltDataPipeline(base), INSIGHT_PIPELINE_TIMEOUT_MS);
      const whale = getWhaleFlow(sym);
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
          whale: "synthetic",
          fearGreed: "hybrid",
          signal: "real",
          confidence: "real"
        };
        degraded = real.stages.some((s) => s.status === "failed");
      } else {
        const synth = getSentiment(sym);
        sentiment = synth;
        const blended = signalFromSentiment(synth.score, whale.netFlow24hUsd > 0 ? 5 : -5);
        signal = blended === "BUY" && synth.score > 0.5 ? "STRONG_BUY" : blended === "SELL" && synth.score < -0.5 ? "STRONG_SELL" : blended;
        confidence = Number(Math.min(0.6, 0.4 + Math.abs(synth.score) * 0.2).toFixed(3));
        sources = {
          sentimentScore: "synthetic",
          sentimentMentions: "synthetic",
          whale: "synthetic",
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
        whale,
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
      const nbConfident = nbHasSignal && nb.confidence >= 0.6;
      if (!nbConfident && vaderHasSignal) {
        const cmp = vader.compound;
        const label = cmp >= 0.05 ? "positive" : cmp <= -0.05 ? "negative" : "neutral";
        return c.json({
          ...nb,
          label,
          compound: Number(cmp.toFixed(4)),
          confidence: Number(Math.min(0.95, 0.55 + Math.abs(cmp) * 0.45).toFixed(4)),
          source: nbHasSignal ? "vader-override" : "vader-fallback",
          vader: { compound: cmp, matchedTerms: vader.matchedTerms }
        });
      }
      if (!nbHasSignal && !vaderHasSignal) {
        return c.json({ ...nb, label: "neutral", compound: 0, confidence: 0.34, source: "no-signal" });
      }
      return c.json({ ...nb, source: "naive-bayes" });
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
      if (!fg.ok) return c.json({ ok: false, error: fg.error, fetchedAt: fg.fetchedAt }, 502);
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
      const result = await checkFraudWithRealAltData(body.accountId, body.transaction);
      return c.json(result);
    });
  }
});

// api/_lib/routes/accounts.ts
async function priceFor(symbol) {
  try {
    const r = await fetch(`${BINANCE2}/ticker/price?symbol=${symbol}`);
    const j = await r.json();
    return j.price ? Number(j.price) : 0;
  } catch {
    return 0;
  }
}
var accountsRouter, BINANCE2;
var init_accounts = __esm({
  "api/_lib/routes/accounts.ts"() {
    init_dist();
    init_state();
    init_fx();
    init_fraud();
    accountsRouter = new Hono2();
    BINANCE2 = "https://api.binance.com/api/v3";
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
      const fraud = checkFraud(id, txCandidate);
      if (fraud.verdict === "BLOCK") {
        return c.json({ ok: false, blocked: true, fraudCheck: fraud }, 200);
      }
      if (body.side === "BUY") {
        const cashAvailable = Number.isFinite(body.currentCashUsd) ? Number(body.currentCashUsd) : acc.cashUsd;
        if (cashAvailable < usdNotional + fee) {
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
    const r = await fetch(`${BINANCE3}/ticker/price?symbol=${symbol}`);
    const j = await r.json();
    return j.price ? Number(j.price) : 0;
  } catch {
    return 0;
  }
}
var agentRouter, BINANCE3;
var init_agent = __esm({
  "api/_lib/routes/agent.ts"() {
    init_dist();
    init_state();
    init_fx();
    init_altdata();
    init_advisor();
    init_fraud();
    agentRouter = new Hono2();
    BINANCE3 = "https://api.binance.com/api/v3";
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
            return c.json({
              sentiment: getSentiment(sym),
              whale: getWhaleFlow(sym),
              fearGreed: await getFearGreed()
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
            const fraud = checkFraud(accountId, txCandidate);
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
    const url = `${proto}://${host}${path}`;
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
    const webReq = new Request(url, { method, headers, body });
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

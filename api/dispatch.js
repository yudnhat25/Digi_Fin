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
function jitter(amplitude) {
  const t = (Date.now() - startedAt) / 1e3;
  return Math.sin(t / 37) * amplitude + (Math.random() - 0.5) * amplitude * 0.25;
}
function getRates() {
  const usdVnd = 24850 + jitter(120);
  const usdEur = 0.92 + jitter(4e-3);
  const usdJpy = 156.4 + jitter(0.8);
  const usdSgd = 1.34 + jitter(0.01);
  return {
    base: "USD",
    asOf: (/* @__PURE__ */ new Date()).toISOString(),
    rates: {
      USD: 1,
      VND: Math.round(usdVnd),
      EUR: Number(usdEur.toFixed(4)),
      JPY: Number(usdJpy.toFixed(3)),
      SGD: Number(usdSgd.toFixed(4))
    }
  };
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
    default:
      return `$${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
}
var startedAt;
var init_fx = __esm({
  "api/_lib/fx.ts"() {
    startedAt = Date.now();
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
function getFearGreed() {
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
  return { value, classification, delta24h: delta, history };
}
function getSocialPulse() {
  return PULSE_SYMBOLS.map((sym) => {
    const s = getSentiment(sym);
    const delta = Number(((Math.random() - 0.5) * 0.8).toFixed(2));
    const momentum = delta > 0.3 ? "Spike" : delta > 0.05 ? "Rising" : delta < -0.2 ? "Cooling" : "Stable";
    return {
      symbol: sym,
      mentions24h: s.mentions24h,
      sentiment: s.score,
      delta,
      momentum
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
var SENTIMENT_THEMES, PULSE_SYMBOLS;
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
  }
});

// api/_lib/routes/market.ts
var marketRouter, BINANCE;
var init_market = __esm({
  "api/_lib/routes/market.ts"() {
    init_dist();
    init_fx();
    init_altdata();
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
    marketRouter.get("/fear-greed", (c) => c.json(getFearGreed()));
    marketRouter.get("/social-pulse", (c) => c.json(getSocialPulse()));
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
var store;
var init_state = __esm({
  "api/_lib/state.ts"() {
    store = /* @__PURE__ */ new Map();
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
  const hit = CACHE.get(key);
  if (hit && Date.now() - hit.ts < TTL_MS) return hit.data;
  const url = `https://www.reddit.com/r/${encodeURIComponent(subreddit)}/hot.json?limit=${limit}&t=day`;
  const json = await fetchJson(url);
  const posts = parseChildren(json);
  CACHE.set(key, { ts: Date.now(), data: posts });
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
var CACHE, TTL_MS, USER_AGENT, PER_COIN_SUBS;
var init_reddit = __esm({
  "api/_lib/ai/sources/reddit.ts"() {
    CACHE = /* @__PURE__ */ new Map();
    TTL_MS = 5 * 60 * 1e3;
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
  const hit = CACHE2.get(key);
  if (hit && Date.now() - hit.ts < TTL_MS2) return hit.data;
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
  CACHE2.set(key, { ts: Date.now(), data: hits });
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
var CACHE2, TTL_MS2, USER_AGENT2, COIN_QUERIES;
var init_hackerNews = __esm({
  "api/_lib/ai/sources/hackerNews.ts"() {
    CACHE2 = /* @__PURE__ */ new Map();
    TTL_MS2 = 10 * 60 * 1e3;
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
async function fetchFearGreedReal() {
  if (CACHE3 && Date.now() - CACHE3.ts < TTL_MS3) return CACHE3.data;
  try {
    const url = "https://api.alternative.me/fng/?limit=30&format=json";
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
    CACHE3 = { ts: Date.now(), data };
    return data;
  } catch (e) {
    return { ok: false, error: e.message, fetchedAt: (/* @__PURE__ */ new Date()).toISOString() };
  }
}
async function pingFearGreed() {
  const t0 = Date.now();
  const r = await fetchFearGreedReal();
  if (r.ok === true) return { ok: true, latencyMs: Date.now() - t0, value: r.current.value };
  const err = "error" in r ? r.error : "unknown";
  return { ok: false, latencyMs: Date.now() - t0, error: err };
}
var CACHE3, TTL_MS3, USER_AGENT3;
var init_fearGreed = __esm({
  "api/_lib/ai/sources/fearGreed.ts"() {
    CACHE3 = null;
    TTL_MS3 = 30 * 60 * 1e3;
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
  const hit = CACHE4.get(coinId);
  if (hit && Date.now() - hit.ts < TTL_MS4) return hit.data;
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
    CACHE4.set(coinId, { ts: Date.now(), data });
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
var COIN_IDS, CACHE4, TTL_MS4, USER_AGENT4;
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
    CACHE4 = /* @__PURE__ */ new Map();
    TTL_MS4 = 10 * 60 * 1e3;
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
    MODEL = { "version": "1.0.0", "algorithm": "multinomial-naive-bayes", "smoothingAlpha": 1, "classes": ["positive", "negative", "neutral"], "classDocCount": { "positive": 314, "negative": 315, "neutral": 40 }, "classTokenCount": { "positive": 2285, "negative": 2362, "neutral": 306 }, "logPrior": { "positive": -0.7563910742199751, "negative": -0.7532114213025953, "neutral": -2.816904606014292 }, "logLikelihood": { "btc": { "positive": -6.412052816790367, "negative": -6.766422102865493, "neutral": -7.734121303328305 }, "consolidating": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "bullishly": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "support": { "positive": -6.160738388509461, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "accumulation": { "positive": -6.74852505341158, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "phase": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "clear": { "positive": -7.25935067717757, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "adoption": { "positive": -5.793013608384143, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "growing": { "positive": -7.25935067717757, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "emerging": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "markets": { "positive": -7.25935067717757, "negative": -8.375860015299594, "neutral": -6.635509014660196 }, "faster": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "than": { "positive": -7.25935067717757, "negative": -7.277247726631484, "neutral": -7.734121303328305 }, "analysts": { "positive": -7.25935067717757, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "expected": { "positive": -7.25935067717757, "negative": -7.277247726631484, "neutral": -7.040974122768359 }, "decentralized": { "positive": -7.664815785285735, "negative": -7.277247726631484, "neutral": -7.734121303328305 }, "exchange": { "positive": -5.718905636230422, "negative": -4.638190397016225, "neutral": -7.040974122768359 }, "volumes": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "recover": { "positive": -6.412052816790367, "negative": -7.277247726631484, "neutral": -7.734121303328305 }, "healthy": { "positive": -7.25935067717757, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "chain": { "positive": -6.97166860472579, "negative": -6.178635437963374, "neutral": -6.635509014660196 }, "activity": { "positive": -7.25935067717757, "negative": -8.375860015299594, "neutral": -7.040974122768359 }, "bitcoin": { "positive": -3.8920548471910967, "negative": -4.171167395908627, "neutral": -5.788211154272992 }, "halving": { "positive": -6.97166860472579, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "approaches": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "supply": { "positive": -6.74852505341158, "negative": -7.6827128347396485, "neutral": -7.040974122768359 }, "shock": { "positive": -7.25935067717757, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "catalyst": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.040974122768359 }, "horizon": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "mining": { "positive": -4.956765584183525, "negative": -5.890953365511593, "neutral": -6.635509014660196 }, "now": { "positive": -6.74852505341158, "negative": -6.766422102865493, "neutral": -7.040974122768359 }, "uses": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "percent": { "positive": -7.25935067717757, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "renewable": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "energy": { "positive": -6.74852505341158, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "industry": { "positive": -6.74852505341158, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "says": { "positive": -5.8730563160576805, "negative": -5.667809814197383, "neutral": -7.734121303328305 }, "validator": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.040974122768359 }, "decentralization": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "improves": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "security": { "positive": -7.664815785285735, "negative": -7.277247726631484, "neutral": -7.734121303328305 }, "profile": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "strengthens": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "quarter": { "positive": -7.25935067717757, "negative": -7.6827128347396485, "neutral": -7.040974122768359 }, "ending": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "strong": { "positive": -6.74852505341158, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "etf": { "positive": -5.96006769304731, "negative": -7.277247726631484, "neutral": -7.734121303328305 }, "inflows": { "positive": -7.25935067717757, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "continue": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "absorb": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "diamond": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "hands": { "positive": -7.664815785285735, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "paying": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "off": { "positive": -7.664815785285735, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "conviction": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "right": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "layer": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.040974122768359 }, "fees": { "positive": -6.97166860472579, "negative": -8.375860015299594, "neutral": -7.040974122768359 }, "collapse": { "positive": -7.664815785285735, "negative": -6.42994986624428, "neutral": -7.734121303328305 }, "user": { "positive": -7.664815785285735, "negative": -6.766422102865493, "neutral": -7.734121303328305 }, "experience": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "finally": { "positive": -7.25935067717757, "negative": -7.277247726631484, "neutral": -7.734121303328305 }, "par": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "web": { "positive": -6.97166860472579, "negative": -7.277247726631484, "neutral": -7.734121303328305 }, "bullish": { "positive": -5.649912764743471, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "momentum": { "positive": -6.74852505341158, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "across": { "positive": -7.25935067717757, "negative": -8.375860015299594, "neutral": -6.635509014660196 }, "majors": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.040974122768359 }, "alt": { "positive": -7.25935067717757, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "season": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "near": { "positive": -7.664815785285735, "negative": -7.277247726631484, "neutral": -7.734121303328305 }, "institutional": { "positive": -6.74852505341158, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "demand": { "positive": -7.25935067717757, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "spot": { "positive": -6.74852505341158, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "continues": { "positive": -6.74852505341158, "negative": -7.277247726631484, "neutral": -7.734121303328305 }, "fourth": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "week": { "positive": -6.566203496617625, "negative": -7.277247726631484, "neutral": -6.124683390894205 }, "gold": { "positive": -6.74852505341158, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "both": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.040974122768359 }, "rallying": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "currency": { "positive": -7.25935067717757, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "debasement": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "concerns": { "positive": -7.25935067717757, "negative": -7.277247726631484, "neutral": -7.734121303328305 }, "rise": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "lightning": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "network": { "positive": -6.74852505341158, "negative": -6.766422102865493, "neutral": -7.040974122768359 }, "capacity": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "reaches": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "new": { "positive": -6.278521424165844, "negative": -7.277247726631484, "neutral": -6.635509014660196 }, "milestone": { "positive": -6.74852505341158, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "rallies": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "rate": { "positive": -6.74852505341158, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "cut": { "positive": -6.97166860472579, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "bets": { "positive": -7.25935067717757, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "loses": { "positive": -7.664815785285735, "negative": -7.277247726631484, "neutral": -7.734121303328305 }, "digital": { "positive": -7.25935067717757, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "dca": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "over": { "positive": -6.566203496617625, "negative": -5.977964742501223, "neutral": -7.734121303328305 }, "last": { "positive": -6.566203496617625, "negative": -6.989565654179703, "neutral": -6.635509014660196 }, "year": { "positive": -6.412052816790367, "negative": -6.989565654179703, "neutral": -7.734121303328305 }, "outperformed": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "handily": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "crypto": { "positive": -3.951243718581427, "negative": -3.648472196587253, "neutral": -6.635509014660196 }, "market": { "positive": -5.96006769304731, "negative": -5.810910657838057, "neutral": -5.94236183410025 }, "structure": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "matured": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "significantly": { "positive": -7.664815785285735, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "cycle": { "positive": -7.25935067717757, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "solana": { "positive": -6.74852505341158, "negative": -6.296418473619758, "neutral": -7.734121303328305 }, "mainnet": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "upgrade": { "positive": -5.8730563160576805, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "ships": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "throughput": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "previous": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "record": { "positive": -6.160738388509461, "negative": -6.766422102865493, "neutral": -7.734121303328305 }, "profitable": { "positive": -6.160738388509461, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "run": { "positive": -6.0553778728516345, "negative": -8.375860015299594, "neutral": -7.040974122768359 }, "sticking": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "long": { "positive": -6.160738388509461, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "term": { "positive": -6.97166860472579, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "plan": { "positive": -7.25935067717757, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "coinbase": { "positive": -5.025758455670476, "negative": -5.117763477278111, "neutral": -7.734121303328305 }, "reports": { "positive": -7.25935067717757, "negative": -7.277247726631484, "neutral": -7.734121303328305 }, "quarterly": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.040974122768359 }, "revenue": { "positive": -6.97166860472579, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "profitability": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "surprise": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "vietnam": { "positive": -6.97166860472579, "negative": -7.277247726631484, "neutral": -7.040974122768359 }, "ranks": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "top": { "positive": -7.664815785285735, "negative": -6.989565654179703, "neutral": -7.734121303328305 }, "globally": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "index": { "positive": -7.25935067717757, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "again": { "positive": -6.97166860472579, "negative": -7.277247726631484, "neutral": -7.734121303328305 }, "jp": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "morgan": { "positive": -6.97166860472579, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "upgrades": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "allocation": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "calls": { "positive": -7.664815785285735, "negative": -7.277247726631484, "neutral": -7.734121303328305 }, "strategic": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "hedge": { "positive": -7.664815785285735, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "major": { "positive": -6.97166860472579, "negative": -6.989565654179703, "neutral": -6.635509014660196 }, "retailer": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "announces": { "positive": -6.74852505341158, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "accept": { "positive": -7.25935067717757, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "nationwide": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "standard": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "chartered": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "predicts": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "reach": { "positive": -7.664815785285735, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "next": { "positive": -6.278521424165844, "negative": -7.277247726631484, "neutral": -6.347826942208415 }, "visa": { "positive": -7.25935067717757, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "partners": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "settle": { "positive": -7.664815785285735, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "cross": { "positive": -7.664815785285735, "negative": -7.277247726631484, "neutral": -7.734121303328305 }, "border": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "payments": { "positive": -6.412052816790367, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "sentiment": { "positive": -7.664815785285735, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "turns": { "positive": -7.664815785285735, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "macro": { "positive": -7.664815785285735, "negative": -7.277247726631484, "neutral": -7.734121303328305 }, "fears": { "positive": -7.664815785285735, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "ease": { "positive": -7.25935067717757, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "smart": { "positive": -7.664815785285735, "negative": -6.766422102865493, "neutral": -7.734121303328305 }, "money": { "positive": -6.97166860472579, "negative": -6.42994986624428, "neutral": -7.734121303328305 }, "rotating": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "ahead": { "positive": -7.25935067717757, "negative": -7.277247726631484, "neutral": -7.734121303328305 }, "event": { "positive": -7.664815785285735, "negative": -7.277247726631484, "neutral": -7.734121303328305 }, "ethereum": { "positive": -4.892227063045954, "negative": -5.810910657838057, "neutral": -7.040974122768359 }, "goes": { "positive": -6.97166860472579, "negative": -7.277247726631484, "neutral": -7.734121303328305 }, "live": { "positive": -6.74852505341158, "negative": -7.277247726631484, "neutral": -7.734121303328305 }, "transaction": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -6.635509014660196 }, "drop": { "positive": -7.664815785285735, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "vietnamese": { "positive": -7.664815785285735, "negative": -7.277247726631484, "neutral": -7.734121303328305 }, "traders": { "positive": -7.25935067717757, "negative": -6.989565654179703, "neutral": -6.635509014660196 }, "posting": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "impressive": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "ytd": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "gains": { "positive": -6.74852505341158, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "recovers": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "all": { "positive": -6.566203496617625, "negative": -6.42994986624428, "neutral": -7.734121303328305 }, "losses": { "positive": -7.664815785285735, "negative": -6.073274922305548, "neutral": -7.734121303328305 }, "smooth": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "butter": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "no": { "positive": -7.664815785285735, "negative": -7.277247726631484, "neutral": -7.040974122768359 }, "incidents": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "reported": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "correction": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "completed": { "positive": -7.664815785285735, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "base": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "building": { "positive": -6.97166860472579, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "leg": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "up": { "positive": -6.74852505341158, "negative": -7.6827128347396485, "neutral": -6.347826942208415 }, "staking": { "positive": -7.664815785285735, "negative": -7.6827128347396485, "neutral": -7.040974122768359 }, "yield": { "positive": -7.25935067717757, "negative": -7.277247726631484, "neutral": -7.734121303328305 }, "ticks": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "validators": { "positive": -7.664815785285735, "negative": -7.277247726631484, "neutral": -7.734121303328305 }, "happy": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "becomes": { "positive": -7.25935067717757, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "deflationary": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "shrink": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "whales": { "positive": -7.664815785285735, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "accumulated": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "data": { "positive": -6.566203496617625, "negative": -7.277247726631484, "neutral": -6.635509014660196 }, "shows": { "positive": -7.25935067717757, "negative": -8.375860015299594, "neutral": -6.635509014660196 }, "wallet": { "positive": -7.25935067717757, "negative": -6.766422102865493, "neutral": -5.94236183410025 }, "app": { "positive": -6.97166860472579, "negative": -7.277247726631484, "neutral": -7.734121303328305 }, "surges": { "positive": -6.74852505341158, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "southeast": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "asia": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "mainstream": { "positive": -6.412052816790367, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "payment": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "processor": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "enables": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "instant": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "checkout": { "positive": -7.25935067717757, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "approval": { "positive": -5.96006769304731, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "marks": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "watershed": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "moment": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "finance": { "positive": -7.664815785285735, "negative": -7.6827128347396485, "neutral": -7.040974122768359 }, "metrics": { "positive": -7.25935067717757, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "break": { "positive": -6.97166860472579, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "time": { "positive": -7.25935067717757, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "high": { "positive": -6.566203496617625, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "second": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "month": { "positive": -6.97166860472579, "negative": -8.375860015299594, "neutral": -6.347826942208415 }, "textbook": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "breakout": { "positive": -7.25935067717757, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "multi": { "positive": -7.664815785285735, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "pattern": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "holders": { "positive": -7.25935067717757, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "refuse": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "sell": { "positive": -7.664815785285735, "negative": -7.277247726631484, "neutral": -7.734121303328305 }, "despite": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "price": { "positive": -6.412052816790367, "negative": -7.277247726631484, "neutral": -7.734121303328305 }, "surge": { "positive": -6.566203496617625, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "blackrock": { "positive": -7.25935067717757, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "buys": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "another": { "positive": -6.566203496617625, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "held": { "positive": -7.25935067717757, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "day": { "positive": -7.25935067717757, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "moving": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "average": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "paypal": { "positive": -7.664815785285735, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "expands": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "more": { "positive": -6.566203496617625, "negative": -6.989565654179703, "neutral": -7.040974122768359 }, "european": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "countries": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "retail": { "positive": -7.25935067717757, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "investors": { "positive": -7.25935067717757, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "net": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "buyers": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "months": { "positive": -7.25935067717757, "negative": -7.277247726631484, "neutral": -7.734121303328305 }, "confirmed": { "positive": -7.664815785285735, "negative": -7.277247726631484, "neutral": -7.734121303328305 }, "technical": { "positive": -7.664815785285735, "negative": -7.277247726631484, "neutral": -7.040974122768359 }, "setup": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "parabolic": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "past": { "positive": -7.25935067717757, "negative": -8.375860015299594, "neutral": -7.040974122768359 }, "hit": { "positive": -7.664815785285735, "negative": -6.989565654179703, "neutral": -7.734121303328305 }, "treasury": { "positive": -6.74852505341158, "negative": -7.277247726631484, "neutral": -7.734121303328305 }, "announcement": { "positive": -7.25935067717757, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "triples": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "public": { "positive": -6.74852505341158, "negative": -8.375860015299594, "neutral": -7.040974122768359 }, "company": { "positive": -6.97166860472579, "negative": -7.277247726631484, "neutral": -7.734121303328305 }, "stock": { "positive": -6.97166860472579, "negative": -6.766422102865493, "neutral": -7.734121303328305 }, "zero": { "positive": -7.25935067717757, "negative": -6.989565654179703, "neutral": -7.040974122768359 }, "fee": { "positive": -7.25935067717757, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "vnd": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "fiat": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "onramp": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "education": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "startup": { "positive": -7.25935067717757, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "raises": { "positive": -6.160738388509461, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "mission": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "gaining": { "positive": -7.25935067717757, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "traction": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "suggest": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "fintech": { "positive": -6.97166860472579, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "series": { "positive": -6.97166860472579, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "expanding": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "remittance": { "positive": -6.74852505341158, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "very": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "first": { "positive": -6.0553778728516345, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "trade": { "positive": -7.664815785285735, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "thanks": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "community": { "positive": -7.25935067717757, "negative": -8.375860015299594, "neutral": -6.635509014660196 }, "optimistic": { "positive": -7.25935067717757, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "outlook": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "veteran": { "positive": -7.664815785285735, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "analyst": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "just": { "positive": -6.0553778728516345, "negative": -6.989565654179703, "neutral": -6.635509014660196 }, "starting": { "positive": -7.664815785285735, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "arbitrum": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "tvl": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "hits": { "positive": -6.74852505341158, "negative": -7.277247726631484, "neutral": -7.734121303328305 }, "defi": { "positive": -7.664815785285735, "negative": -6.073274922305548, "neutral": -7.734121303328305 }, "returns": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "hashrate": { "positive": -7.25935067717757, "negative": -7.6827128347396485, "neutral": -7.040974122768359 }, "breaks": { "positive": -7.664815785285735, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "signaling": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "strength": { "positive": -7.25935067717757, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "key": { "positive": -7.664815785285735, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "bulls": { "positive": -6.97166860472579, "negative": -8.375860015299594, "neutral": -7.040974122768359 }, "control": { "positive": -7.25935067717757, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "stablecoin": { "positive": -4.923975761360534, "negative": -5.810910657838057, "neutral": -7.040974122768359 }, "philippines": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "saves": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "families": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "thousands": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "monthly": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "saigon": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "based": { "positive": -6.97166860472579, "negative": -6.766422102865493, "neutral": -7.734121303328305 }, "wins": { "positive": -6.412052816790367, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "asean": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "award": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "portfolio": { "positive": -6.74852505341158, "negative": -7.277247726631484, "neutral": -7.734121303328305 }, "green": { "positive": -6.566203496617625, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "tough": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "lessons": { "positive": -7.25935067717757, "negative": -7.277247726631484, "neutral": -7.734121303328305 }, "learned": { "positive": -7.664815785285735, "negative": -7.277247726631484, "neutral": -7.734121303328305 }, "crossed": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "even": { "positive": -7.25935067717757, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "feels": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "amazing": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "bank": { "positive": -6.74852505341158, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "quietly": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "opens": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "custody": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "wealth": { "positive": -7.25935067717757, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "clients": { "positive": -7.25935067717757, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "fear": { "positive": -7.25935067717757, "negative": -7.277247726631484, "neutral": -7.734121303328305 }, "greed": { "positive": -7.664815785285735, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "moves": { "positive": -6.97166860472579, "negative": -8.375860015299594, "neutral": -7.040974122768359 }, "extreme": { "positive": -7.664815785285735, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "neutral": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.040974122768359 }, "interest": { "positive": -7.25935067717757, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "revives": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "google": { "positive": -7.25935067717757, "negative": -6.989565654179703, "neutral": -7.734121303328305 }, "searches": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "double": { "positive": -6.97166860472579, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "policy": { "positive": -7.25935067717757, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "lets": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "corporate": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "reserve": { "positive": -7.25935067717757, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "asset": { "positive": -7.664815785285735, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "halts": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "two": { "positive": -8.357962965845681, "negative": -6.5841005460715385, "neutral": -7.734121303328305 }, "hours": { "positive": -7.664815785285735, "negative": -6.989565654179703, "neutral": -7.734121303328305 }, "panicking": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "winter": { "positive": -7.25935067717757, "negative": -7.277247726631484, "neutral": -7.734121303328305 }, "brace": { "positive": -8.357962965845681, "negative": -6.989565654179703, "neutral": -7.734121303328305 }, "years": { "positive": -7.664815785285735, "negative": -6.989565654179703, "neutral": -7.040974122768359 }, "pain": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "bear": { "positive": -8.357962965845681, "negative": -6.766422102865493, "neutral": -7.734121303328305 }, "back": { "positive": -7.25935067717757, "negative": -6.989565654179703, "neutral": -7.734121303328305 }, "vengeance": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "hodlers": { "positive": -8.357962965845681, "negative": -7.277247726631484, "neutral": -7.734121303328305 }, "underwater": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "rug": { "positive": -8.357962965845681, "negative": -6.5841005460715385, "neutral": -7.734121303328305 }, "pull": { "positive": -8.357962965845681, "negative": -6.5841005460715385, "neutral": -7.734121303328305 }, "steals": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "unsuspecting": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "farmers": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "overnight": { "positive": -8.357962965845681, "negative": -6.989565654179703, "neutral": -7.734121303328305 }, "hopes": { "positive": -8.357962965845681, "negative": -7.277247726631484, "neutral": -7.734121303328305 }, "dashed": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "sec": { "positive": -6.74852505341158, "negative": -5.603271293059812, "neutral": -7.734121303328305 }, "minute": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "rejection": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "hacked": { "positive": -7.664815785285735, "negative": -5.117763477278111, "neutral": -7.734121303328305 }, "attackers": { "positive": -8.357962965845681, "negative": -7.277247726631484, "neutral": -7.734121303328305 }, "drained": { "positive": -8.357962965845681, "negative": -6.766422102865493, "neutral": -7.734121303328305 }, "usd": { "positive": -7.25935067717757, "negative": -6.989565654179703, "neutral": -7.734121303328305 }, "slashed": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "signing": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "reliability": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "questioned": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "plunges": { "positive": -8.357962965845681, "negative": -7.277247726631484, "neutral": -7.734121303328305 }, "territory": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "total": { "positive": -7.664815785285735, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "scams": { "positive": -8.357962965845681, "negative": -6.989565654179703, "neutral": -7.734121303328305 }, "lose": { "positive": -8.357962965845681, "negative": -6.989565654179703, "neutral": -7.734121303328305 }, "millions": { "positive": -8.357962965845681, "negative": -6.42994986624428, "neutral": -7.734121303328305 }, "unregulated": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "overseas": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "insolvent": { "positive": -8.357962965845681, "negative": -7.277247726631484, "neutral": -7.734121303328305 }, "customers": { "positive": -7.664815785285735, "negative": -6.766422102865493, "neutral": -7.734121303328305 }, "never": { "positive": -8.357962965845681, "negative": -7.277247726631484, "neutral": -7.734121303328305 }, "deposits": { "positive": -8.357962965845681, "negative": -7.277247726631484, "neutral": -7.734121303328305 }, "dropped": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.040974122768359 }, "sharply": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "regulatory": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "sbv": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "recovery": { "positive": -7.664815785285735, "negative": -7.277247726631484, "neutral": -7.734121303328305 }, "fade": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "environment": { "positive": -7.664815785285735, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "worsens": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "investor": { "positive": -8.357962965845681, "negative": -7.277247726631484, "neutral": -7.734121303328305 }, "faces": { "positive": -7.664815785285735, "negative": -6.766422102865493, "neutral": -7.734121303328305 }, "criminal": { "positive": -8.357962965845681, "negative": -7.277247726631484, "neutral": -7.734121303328305 }, "charges": { "positive": -8.357962965845681, "negative": -6.296418473619758, "neutral": -7.734121303328305 }, "promoting": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "fraudulent": { "positive": -8.357962965845681, "negative": -6.766422102865493, "neutral": -7.734121303328305 }, "token": { "positive": -7.25935067717757, "negative": -6.5841005460715385, "neutral": -7.040974122768359 }, "crashes": { "positive": -8.357962965845681, "negative": -6.5841005460715385, "neutral": -7.734121303328305 }, "hot": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.040974122768359 }, "cpi": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "print": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "leverage": { "positive": -8.357962965845681, "negative": -7.277247726631484, "neutral": -7.734121303328305 }, "flush": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "incoming": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "job": { "positive": -8.357962965845681, "negative": -6.5841005460715385, "neutral": -7.734121303328305 }, "cuts": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "expects": { "positive": -7.664815785285735, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "extended": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "ordered": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "halt": { "positive": -8.357962965845681, "negative": -7.277247726631484, "neutral": -7.734121303328305 }, "trading": { "positive": -6.566203496617625, "negative": -6.989565654179703, "neutral": -7.040974122768359 }, "government": { "positive": -7.664815785285735, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "regulator": { "positive": -7.664815785285735, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "hack": { "positive": -8.357962965845681, "negative": -4.849499490683432, "neutral": -7.734121303328305 }, "exposes": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "million": { "positive": -7.664815785285735, "negative": -6.5841005460715385, "neutral": -7.734121303328305 }, "accounts": { "positive": -8.357962965845681, "negative": -6.766422102865493, "neutral": -7.734121303328305 }, "under": { "positive": -6.97166860472579, "negative": -6.766422102865493, "neutral": -7.040974122768359 }, "fire": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "breaking": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "down": { "positive": -7.25935067717757, "negative": -5.736802685684335, "neutral": -7.734121303328305 }, "out": { "positive": -7.664815785285735, "negative": -5.977964742501223, "neutral": -7.734121303328305 }, "triangle": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "capitulation": { "positive": -8.357962965845681, "negative": -6.989565654179703, "neutral": -7.734121303328305 }, "likely": { "positive": -7.664815785285735, "negative": -6.989565654179703, "neutral": -7.734121303328305 }, "protocol": { "positive": -7.664815785285735, "negative": -6.766422102865493, "neutral": -6.347826942208415 }, "exploit": { "positive": -8.357962965845681, "negative": -5.977964742501223, "neutral": -7.734121303328305 }, "drains": { "positive": -7.664815785285735, "negative": -6.766422102865493, "neutral": -7.734121303328305 }, "liquidity": { "positive": -7.664815785285735, "negative": -6.766422102865493, "neutral": -7.734121303328305 }, "instantly": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "negative": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "funding": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "rates": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "persist": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "collapsing": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "rapidly": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "founder": { "positive": -7.664815785285735, "negative": -6.42994986624428, "neutral": -7.734121303328305 }, "absconds": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "funds": { "positive": -7.664815785285735, "negative": -5.977964742501223, "neutral": -7.734121303328305 }, "exit": { "positive": -8.357962965845681, "negative": -6.766422102865493, "neutral": -7.734121303328305 }, "scam": { "positive": -8.357962965845681, "negative": -4.910124112499867, "neutral": -7.734121303328305 }, "suspected": { "positive": -8.357962965845681, "negative": -7.277247726631484, "neutral": -7.734121303328305 }, "ponzi": { "positive": -8.357962965845681, "negative": -5.977964742501223, "neutral": -7.734121303328305 }, "launcher": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "exits": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "victims": { "positive": -8.357962965845681, "negative": -6.989565654179703, "neutral": -7.734121303328305 }, "luck": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "massive": { "positive": -8.357962965845681, "negative": -6.5841005460715385, "neutral": -7.734121303328305 }, "dollars": { "positive": -8.357962965845681, "negative": -6.989565654179703, "neutral": -7.734121303328305 }, "bridge": { "positive": -8.357962965845681, "negative": -6.766422102865493, "neutral": -7.734121303328305 }, "ma": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "breakdown": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "severe": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "cratered": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "classic": { "positive": -7.664815785285735, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "lesson": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "contract": { "positive": -8.357962965845681, "negative": -7.277247726631484, "neutral": -7.734121303328305 }, "pool": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "bubble": { "positive": -8.357962965845681, "negative": -6.766422102865493, "neutral": -7.734121303328305 }, "burst": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "economist": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "tumbles": { "positive": -8.357962965845681, "negative": -6.766422102865493, "neutral": -7.734121303328305 }, "outflows": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "accelerate": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "weak": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "shaken": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "issuer": { "positive": -6.97166860472579, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "fraud": { "positive": -8.357962965845681, "negative": -5.603271293059812, "neutral": -7.734121303328305 }, "probe": { "positive": -8.357962965845681, "negative": -6.989565654179703, "neutral": -7.734121303328305 }, "reserves": { "positive": -7.664815785285735, "negative": -7.277247726631484, "neutral": -7.734121303328305 }, "throwing": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "towel": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "not": { "positive": -7.25935067717757, "negative": -6.766422102865493, "neutral": -7.734121303328305 }, "end": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "well": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "fund": { "positive": -7.25935067717757, "negative": -6.989565654179703, "neutral": -7.734121303328305 }, "manager": { "positive": -7.25935067717757, "negative": -7.277247726631484, "neutral": -7.734121303328305 }, "famous": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "worthless": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "cap": { "positive": -7.25935067717757, "negative": -7.6827128347396485, "neutral": -7.040974122768359 }, "flag": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "forms": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "daily": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -6.347826942208415 }, "chart": { "positive": -7.664815785285735, "negative": -7.6827128347396485, "neutral": -7.040974122768359 }, "lower": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "lows": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "police": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "arrest": { "positive": -8.357962965845681, "negative": -7.277247726631484, "neutral": -7.734121303328305 }, "ring": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "lost": { "positive": -8.357962965845681, "negative": -5.977964742501223, "neutral": -7.734121303328305 }, "style": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "collapses": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "got": { "positive": -6.97166860472579, "negative": -7.277247726631484, "neutral": -7.734121303328305 }, "liquidated": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "learn": { "positive": -7.664815785285735, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "mistake": { "positive": -7.664815785285735, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "home": { "positive": -7.664815785285735, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "cefi": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "lender": { "positive": -8.357962965845681, "negative": -6.5841005460715385, "neutral": -7.734121303328305 }, "suspends": { "positive": -8.357962965845681, "negative": -6.989565654179703, "neutral": -7.734121303328305 }, "operations": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "indefinitely": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "users": { "positive": -7.664815785285735, "negative": -6.42994986624428, "neutral": -7.734121303328305 }, "frozen": { "positive": -8.357962965845681, "negative": -6.989565654179703, "neutral": -7.734121303328305 }, "failed": { "positive": -8.357962965845681, "negative": -6.5841005460715385, "neutral": -7.734121303328305 }, "resistance": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.040974122768359 }, "downtrend": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "multiple": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "indicators": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "dumping": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "aggressively": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "spike": { "positive": -8.357962965845681, "negative": -7.277247726631484, "neutral": -7.734121303328305 }, "yearly": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "multisig": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "compromised": { "positive": -8.357962965845681, "negative": -7.277247726631484, "neutral": -7.734121303328305 }, "minutes": { "positive": -8.357962965845681, "negative": -7.277247726631484, "neutral": -7.734121303328305 }, "withdrawals": { "positive": -7.664815785285735, "negative": -6.989565654179703, "neutral": -7.734121303328305 }, "citing": { "positive": -8.357962965845681, "negative": -7.277247726631484, "neutral": -7.734121303328305 }, "issues": { "positive": -8.357962965845681, "negative": -6.989565654179703, "neutral": -7.734121303328305 }, "worried": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "whale": { "positive": -7.25935067717757, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "activates": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "dormancy": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "panic": { "positive": -8.357962965845681, "negative": -7.277247726631484, "neutral": -7.734121303328305 }, "selling": { "positive": -8.357962965845681, "negative": -6.766422102865493, "neutral": -7.734121303328305 }, "hard": { "positive": -7.25935067717757, "negative": -7.277247726631484, "neutral": -7.734121303328305 }, "way": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "scheme": { "positive": -8.357962965845681, "negative": -6.766422102865493, "neutral": -7.734121303328305 }, "nobel": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "laureate": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "collapsed": { "positive": -8.357962965845681, "negative": -6.766422102865493, "neutral": -7.734121303328305 }, "within": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -6.635509014660196 }, "launch": { "positive": -5.8730563160576805, "negative": -7.277247726631484, "neutral": -7.734121303328305 }, "wall": { "positive": -7.664815785285735, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "order": { "positive": -7.664815785285735, "negative": -7.6827128347396485, "neutral": -7.040974122768359 }, "books": { "positive": -7.25935067717757, "negative": -7.6827128347396485, "neutral": -7.040974122768359 }, "bears": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.040974122768359 }, "defending": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "level": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "firmly": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "sale": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "closed": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.040974122768359 }, "early": { "positive": -8.357962965845681, "negative": -7.277247726631484, "neutral": -7.734121303328305 }, "admin": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "keys": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "seed": { "positive": -8.357962965845681, "negative": -7.277247726631484, "neutral": -7.734121303328305 }, "phrase": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "gone": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "forever": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "own": { "positive": -7.664815785285735, "negative": -7.277247726631484, "neutral": -7.734121303328305 }, "fault": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "everything": { "positive": -8.357962965845681, "negative": -7.277247726631484, "neutral": -7.734121303328305 }, "invested": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "shitcoin": { "positive": -7.664815785285735, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "trust": { "positive": -8.357962965845681, "negative": -7.277247726631484, "neutral": -7.734121303328305 }, "influencer": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "shills": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "files": { "positive": -7.664815785285735, "negative": -6.073274922305548, "neutral": -7.734121303328305 }, "bankruptcy": { "positive": -8.357962965845681, "negative": -5.603271293059812, "neutral": -7.734121303328305 }, "customer": { "positive": -8.357962965845681, "negative": -6.766422102865493, "neutral": -7.734121303328305 }, "founders": { "positive": -7.664815785285735, "negative": -7.277247726631484, "neutral": -7.734121303328305 }, "dumped": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "enforcement": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "action": { "positive": -8.357962965845681, "negative": -6.766422102865493, "neutral": -7.734121303328305 }, "targets": { "positive": -8.357962965845681, "negative": -7.277247726631484, "neutral": -7.734121303328305 }, "entire": { "positive": -8.357962965845681, "negative": -6.5841005460715385, "neutral": -7.734121303328305 }, "ecosystem": { "positive": -7.664815785285735, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "mass": { "positive": -8.357962965845681, "negative": -7.277247726631484, "neutral": -7.734121303328305 }, "liquidation": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "lending": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "providers": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "wiped": { "positive": -7.664815785285735, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "sudden": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "depeg": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "coin": { "positive": -6.278521424165844, "negative": -6.989565654179703, "neutral": -7.734121303328305 }, "dead": { "positive": -8.357962965845681, "negative": -6.5841005460715385, "neutral": -7.734121303328305 }, "project": { "positive": -8.357962965845681, "negative": -7.277247726631484, "neutral": -7.734121303328305 }, "abandoned": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "ago": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.040974122768359 }, "tether": { "positive": -6.412052816790367, "negative": -6.5841005460715385, "neutral": -7.734121303328305 }, "sued": { "positive": -8.357962965845681, "negative": -7.277247726631484, "neutral": -7.734121303328305 }, "misleading": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "statements": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "pauses": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "counterparty": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "default": { "positive": -8.357962965845681, "negative": -7.277247726631484, "neutral": -7.734121303328305 }, "contagion": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "risk": { "positive": -8.357962965845681, "negative": -7.277247726631484, "neutral": -7.734121303328305 }, "miner": { "positive": -7.25935067717757, "negative": -6.766422102865493, "neutral": -7.734121303328305 }, "sells": { "positive": -8.357962965845681, "negative": -7.277247726631484, "neutral": -7.734121303328305 }, "bottom": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "tokenomics": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "broken": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "inflation": { "positive": -7.664815785285735, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "outpacing": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "burn": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "terminal": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "decline": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "liquidates": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "position": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "bearish": { "positive": -8.357962965845681, "negative": -7.277247726631484, "neutral": -7.734121303328305 }, "signal": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "bug": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "allowed": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "attacker": { "positive": -7.664815785285735, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "mint": { "positive": -8.357962965845681, "negative": -7.277247726631484, "neutral": -7.734121303328305 }, "infinite": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "tokens": { "positive": -8.357962965845681, "negative": -6.5841005460715385, "neutral": -7.734121303328305 }, "pressure": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "miners": { "positive": -7.25935067717757, "negative": -6.989565654179703, "neutral": -7.734121303328305 }, "alike": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "tax": { "positive": -7.25935067717757, "negative": -7.6827128347396485, "neutral": -7.040974122768359 }, "authority": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "fines": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "heavily": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "unreported": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "discussion": { "positive": -8.357962965845681, "negative": -8.375860015299594, "neutral": -7.040974122768359 }, "thread": { "positive": -8.357962965845681, "negative": -8.375860015299594, "neutral": -6.124683390894205 }, "share": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.040974122768359 }, "software": { "positive": -7.664815785285735, "negative": -7.6827128347396485, "neutral": -7.040974122768359 }, "recommendations": { "positive": -8.357962965845681, "negative": -8.375860015299594, "neutral": -7.040974122768359 }, "please": { "positive": -8.357962965845681, "negative": -8.375860015299594, "neutral": -6.635509014660196 }, "today": { "positive": -7.664815785285735, "negative": -7.6827128347396485, "neutral": -6.347826942208415 }, "history": { "positive": -8.357962965845681, "negative": -8.375860015299594, "neutral": -7.040974122768359 }, "launched": { "positive": -7.25935067717757, "negative": -8.375860015299594, "neutral": -6.635509014660196 }, "report": { "positive": -6.74852505341158, "negative": -7.6827128347396485, "neutral": -6.635509014660196 }, "versus": { "positive": -8.357962965845681, "negative": -8.375860015299594, "neutral": -6.635509014660196 }, "prior": { "positive": -8.357962965845681, "negative": -8.375860015299594, "neutral": -6.635509014660196 }, "explainer": { "positive": -8.357962965845681, "negative": -8.375860015299594, "neutral": -7.040974122768359 }, "how": { "positive": -6.0553778728516345, "negative": -6.42994986624428, "neutral": -5.654679761648469 }, "proof": { "positive": -8.357962965845681, "negative": -8.375860015299594, "neutral": -7.040974122768359 }, "stake": { "positive": -8.357962965845681, "negative": -8.375860015299594, "neutral": -7.040974122768359 }, "consensus": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -6.635509014660196 }, "actually": { "positive": -8.357962965845681, "negative": -8.375860015299594, "neutral": -7.040974122768359 }, "works": { "positive": -8.357962965845681, "negative": -8.375860015299594, "neutral": -7.040974122768359 }, "reading": { "positive": -8.357962965845681, "negative": -8.375860015299594, "neutral": -7.040974122768359 }, "eip": { "positive": -8.357962965845681, "negative": -8.375860015299594, "neutral": -7.040974122768359 }, "proposal": { "positive": -8.357962965845681, "negative": -8.375860015299594, "neutral": -6.635509014660196 }, "merits": { "positive": -8.357962965845681, "negative": -8.375860015299594, "neutral": -7.040974122768359 }, "tradeoffs": { "positive": -8.357962965845681, "negative": -8.375860015299594, "neutral": -7.040974122768359 }, "nuanced": { "positive": -8.357962965845681, "negative": -8.375860015299594, "neutral": -7.040974122768359 }, "sideways": { "positive": -8.357962965845681, "negative": -8.375860015299594, "neutral": -7.040974122768359 }, "low": { "positive": -7.25935067717757, "negative": -8.375860015299594, "neutral": -6.635509014660196 }, "volatility": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.040974122768359 }, "regime": { "positive": -8.357962965845681, "negative": -8.375860015299594, "neutral": -7.040974122768359 }, "ui": { "positive": -8.357962965845681, "negative": -8.375860015299594, "neutral": -6.635509014660196 }, "refresh": { "positive": -8.357962965845681, "negative": -8.375860015299594, "neutral": -7.040974122768359 }, "mostly": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -6.635509014660196 }, "cosmetic": { "positive": -8.357962965845681, "negative": -8.375860015299594, "neutral": -7.040974122768359 }, "changes": { "positive": -8.357962965845681, "negative": -8.375860015299594, "neutral": -6.635509014660196 }, "version": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.040974122768359 }, "developer": { "positive": -8.357962965845681, "negative": -8.375860015299594, "neutral": -6.635509014660196 }, "compiled": { "positive": -8.357962965845681, "negative": -8.375860015299594, "neutral": -7.040974122768359 }, "protocols": { "positive": -8.357962965845681, "negative": -8.375860015299594, "neutral": -7.040974122768359 }, "shared": { "positive": -8.357962965845681, "negative": -8.375860015299594, "neutral": -7.040974122768359 }, "research": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.040974122768359 }, "notes": { "positive": -8.357962965845681, "negative": -8.375860015299594, "neutral": -6.635509014660196 }, "economics": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.040974122768359 }, "beginner": { "positive": -8.357962965845681, "negative": -8.375860015299594, "neutral": -7.040974122768359 }, "question": { "positive": -8.357962965845681, "negative": -8.375860015299594, "neutral": -7.040974122768359 }, "set": { "positive": -7.664815785285735, "negative": -7.6827128347396485, "neutral": -7.040974122768359 }, "hardware": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.040974122768359 }, "correctly": { "positive": -8.357962965845681, "negative": -8.375860015299594, "neutral": -7.040974122768359 }, "flat": { "positive": -8.357962965845681, "negative": -8.375860015299594, "neutral": -7.040974122768359 }, "amid": { "positive": -7.664815785285735, "negative": -6.766422102865493, "neutral": -7.040974122768359 }, "summer": { "positive": -8.357962965845681, "negative": -8.375860015299594, "neutral": -7.040974122768359 }, "volume": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -6.635509014660196 }, "post": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.040974122768359 }, "questions": { "positive": -8.357962965845681, "negative": -8.375860015299594, "neutral": -7.040974122768359 }, "here": { "positive": -7.25935067717757, "negative": -8.375860015299594, "neutral": -7.040974122768359 }, "reposts": { "positive": -8.357962965845681, "negative": -8.375860015299594, "neutral": -7.040974122768359 }, "changelog": { "positive": -8.357962965845681, "negative": -8.375860015299594, "neutral": -7.040974122768359 }, "minor": { "positive": -8.357962965845681, "negative": -8.375860015299594, "neutral": -6.635509014660196 }, "release": { "positive": -8.357962965845681, "negative": -8.375860015299594, "neutral": -6.347826942208415 }, "digesting": { "positive": -8.357962965845681, "negative": -8.375860015299594, "neutral": -7.040974122768359 }, "recent": { "positive": -8.357962965845681, "negative": -8.375860015299594, "neutral": -6.635509014660196 }, "waiting": { "positive": -8.357962965845681, "negative": -8.375860015299594, "neutral": -7.040974122768359 }, "clarity": { "positive": -8.357962965845681, "negative": -8.375860015299594, "neutral": -7.040974122768359 }, "looking": { "positive": -8.357962965845681, "negative": -8.375860015299594, "neutral": -7.040974122768359 }, "documentation": { "positive": -8.357962965845681, "negative": -8.375860015299594, "neutral": -6.635509014660196 }, "knowledge": { "positive": -8.357962965845681, "negative": -8.375860015299594, "neutral": -7.040974122768359 }, "proofs": { "positive": -8.357962965845681, "negative": -8.375860015299594, "neutral": -7.040974122768359 }, "work": { "positive": -8.357962965845681, "negative": -6.989565654179703, "neutral": -7.040974122768359 }, "mathematically": { "positive": -8.357962965845681, "negative": -8.375860015299594, "neutral": -7.040974122768359 }, "trades": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.040974122768359 }, "weeks": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.040974122768359 }, "range": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -6.124683390894205 }, "awaiting": { "positive": -8.357962965845681, "negative": -8.375860015299594, "neutral": -6.635509014660196 }, "developers": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.040974122768359 }, "patch": { "positive": -8.357962965845681, "negative": -8.375860015299594, "neutral": -7.040974122768359 }, "addressing": { "positive": -8.357962965845681, "negative": -8.375860015299594, "neutral": -7.040974122768359 }, "bugs": { "positive": -8.357962965845681, "negative": -8.375860015299594, "neutral": -7.040974122768359 }, "educational": { "positive": -8.357962965845681, "negative": -8.375860015299594, "neutral": -7.040974122768359 }, "primer": { "positive": -7.25935067717757, "negative": -8.375860015299594, "neutral": -7.040974122768359 }, "merkle": { "positive": -8.357962965845681, "negative": -8.375860015299594, "neutral": -7.040974122768359 }, "trees": { "positive": -8.357962965845681, "negative": -8.375860015299594, "neutral": -7.040974122768359 }, "newcomers": { "positive": -8.357962965845681, "negative": -8.375860015299594, "neutral": -7.040974122768359 }, "blockchain": { "positive": -5.8730563160576805, "negative": -5.810910657838057, "neutral": -6.635509014660196 }, "poll": { "positive": -8.357962965845681, "negative": -8.375860015299594, "neutral": -7.040974122768359 }, "feature": { "positive": -8.357962965845681, "negative": -8.375860015299594, "neutral": -7.040974122768359 }, "prioritize": { "positive": -8.357962965845681, "negative": -8.375860015299594, "neutral": -7.040974122768359 }, "discussing": { "positive": -8.357962965845681, "negative": -8.375860015299594, "neutral": -7.040974122768359 }, "architecture": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.040974122768359 }, "choices": { "positive": -8.357962965845681, "negative": -8.375860015299594, "neutral": -7.040974122768359 }, "deep": { "positive": -8.357962965845681, "negative": -8.375860015299594, "neutral": -7.040974122768359 }, "dive": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.040974122768359 }, "analysis": { "positive": -7.25935067717757, "negative": -7.6827128347396485, "neutral": -7.040974122768359 }, "read": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.040974122768359 }, "using": { "positive": -7.664815785285735, "negative": -7.277247726631484, "neutral": -7.040974122768359 }, "block": { "positive": -8.357962965845681, "negative": -8.375860015299594, "neutral": -7.040974122768359 }, "explorer": { "positive": -8.357962965845681, "negative": -8.375860015299594, "neutral": -7.040974122768359 }, "tools": { "positive": -8.357962965845681, "negative": -8.375860015299594, "neutral": -7.040974122768359 }, "guide": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.040974122768359 }, "choosing": { "positive": -8.357962965845681, "negative": -8.375860015299594, "neutral": -7.040974122768359 }, "cold": { "positive": -8.357962965845681, "negative": -8.375860015299594, "neutral": -7.040974122768359 }, "storage": { "positive": -8.357962965845681, "negative": -8.375860015299594, "neutral": -7.040974122768359 }, "options": { "positive": -8.357962965845681, "negative": -8.375860015299594, "neutral": -7.040974122768359 }, "sharing": { "positive": -8.357962965845681, "negative": -8.375860015299594, "neutral": -7.040974122768359 }, "academic": { "positive": -8.357962965845681, "negative": -8.375860015299594, "neutral": -7.040974122768359 }, "paper": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.040974122768359 }, "mechanisms": { "positive": -8.357962965845681, "negative": -8.375860015299594, "neutral": -7.040974122768359 }, "portal": { "positive": -8.357962965845681, "negative": -8.375860015299594, "neutral": -7.040974122768359 }, "content": { "positive": -8.357962965845681, "negative": -8.375860015299594, "neutral": -7.040974122768359 }, "unchanged": { "positive": -8.357962965845681, "negative": -8.375860015299594, "neutral": -6.635509014660196 }, "stats": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.040974122768359 }, "difficulty": { "positive": -8.357962965845681, "negative": -7.277247726631484, "neutral": -7.040974122768359 }, "adjusted": { "positive": -8.357962965845681, "negative": -8.375860015299594, "neutral": -7.040974122768359 }, "remained": { "positive": -8.357962965845681, "negative": -8.375860015299594, "neutral": -7.040974122768359 }, "bound": { "positive": -8.357962965845681, "negative": -8.375860015299594, "neutral": -7.040974122768359 }, "macroeconomic": { "positive": -8.357962965845681, "negative": -8.375860015299594, "neutral": -7.040974122768359 }, "tomorrow": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.040974122768359 }, "commentary": { "positive": -8.357962965845681, "negative": -8.375860015299594, "neutral": -7.040974122768359 }, "arguments": { "positive": -8.357962965845681, "negative": -8.375860015299594, "neutral": -7.040974122768359 }, "hourly": { "positive": -8.357962965845681, "negative": -8.375860015299594, "neutral": -7.040974122768359 }, "tight": { "positive": -8.357962965845681, "negative": -8.375860015299594, "neutral": -7.040974122768359 }, "consolidation": { "positive": -8.357962965845681, "negative": -8.375860015299594, "neutral": -7.040974122768359 }, "reminder": { "positive": -8.357962965845681, "negative": -8.375860015299594, "neutral": -7.040974122768359 }, "open": { "positive": -7.25935067717757, "negative": -8.375860015299594, "neutral": -7.040974122768359 }, "unlike": { "positive": -8.357962965845681, "negative": -8.375860015299594, "neutral": -7.040974122768359 }, "traditional": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.040974122768359 }, "anyone": { "positive": -8.357962965845681, "negative": -8.375860015299594, "neutral": -7.040974122768359 }, "know": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.040974122768359 }, "filter": { "positive": -8.357962965845681, "negative": -8.375860015299594, "neutral": -7.040974122768359 }, "queries": { "positive": -8.357962965845681, "negative": -8.375860015299594, "neutral": -7.040974122768359 }, "type": { "positive": -8.357962965845681, "negative": -8.375860015299594, "neutral": -7.040974122768359 }, "gas": { "positive": -8.357962965845681, "negative": -8.375860015299594, "neutral": -7.040974122768359 }, "averaged": { "positive": -8.357962965845681, "negative": -8.375860015299594, "neutral": -7.040974122768359 }, "gwei": { "positive": -8.357962965845681, "negative": -8.375860015299594, "neutral": -7.040974122768359 }, "usage": { "positive": -8.357962965845681, "negative": -8.375860015299594, "neutral": -7.040974122768359 }, "stable": { "positive": -6.566203496617625, "negative": -8.375860015299594, "neutral": -7.040974122768359 }, "conference": { "positive": -8.357962965845681, "negative": -8.375860015299594, "neutral": -7.040974122768359 }, "schedule": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.040974122768359 }, "released": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.040974122768359 }, "thoughts": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.040974122768359 }, "latest": { "positive": -7.664815785285735, "negative": -7.277247726631484, "neutral": -7.040974122768359 }, "fork": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.040974122768359 }, "holds": { "positive": -8.357962965845681, "negative": -8.375860015299594, "neutral": -7.040974122768359 }, "steady": { "positive": -8.357962965845681, "negative": -8.375860015299594, "neutral": -7.040974122768359 }, "billion": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.040974122768359 }, "retrospective": { "positive": -8.357962965845681, "negative": -8.375860015299594, "neutral": -7.040974122768359 }, "look": { "positive": -8.357962965845681, "negative": -8.375860015299594, "neutral": -7.040974122768359 }, "bull": { "positive": -5.649912764743471, "negative": -8.375860015299594, "neutral": -7.040974122768359 }, "current": { "positive": -8.357962965845681, "negative": -8.375860015299594, "neutral": -7.040974122768359 }, "update": { "positive": -7.664815785285735, "negative": -7.6827128347396485, "neutral": -7.040974122768359 }, "prices": { "positive": -7.664815785285735, "negative": -7.277247726631484, "neutral": -7.040974122768359 }, "narrow": { "positive": -8.357962965845681, "negative": -8.375860015299594, "neutral": -7.040974122768359 }, "unlock": { "positive": -8.357962965845681, "negative": -8.375860015299594, "neutral": -7.040974122768359 }, "scheduled": { "positive": -8.357962965845681, "negative": -8.375860015299594, "neutral": -7.040974122768359 }, "increase": { "positive": -8.357962965845681, "negative": -8.375860015299594, "neutral": -7.040974122768359 }, "modestly": { "positive": -8.357962965845681, "negative": -8.375860015299594, "neutral": -7.040974122768359 }, "structured": { "positive": -8.357962965845681, "negative": -8.375860015299594, "neutral": -7.040974122768359 }, "faq": { "positive": -8.357962965845681, "negative": -8.375860015299594, "neutral": -7.040974122768359 }, "everyone": { "positive": -8.357962965845681, "negative": -8.375860015299594, "neutral": -7.040974122768359 }, "holding": { "positive": -8.357962965845681, "negative": -8.375860015299594, "neutral": -7.040974122768359 }, "quiet": { "positive": -8.357962965845681, "negative": -8.375860015299594, "neutral": -7.040974122768359 }, "period": { "positive": -8.357962965845681, "negative": -8.375860015299594, "neutral": -7.040974122768359 }, "thorchain": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "bsc": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "hackers": { "positive": -8.357962965845681, "negative": -5.197806184951648, "neutral": -7.734121303328305 }, "steal": { "positive": -8.357962965845681, "negative": -5.4854882574034285, "neutral": -7.734121303328305 }, "crash": { "positive": -8.357962965845681, "negative": -5.431421036133153, "neutral": -7.734121303328305 }, "sends": { "positive": -6.97166860472579, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "tumbling": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "scammers": { "positive": -8.357962965845681, "negative": -6.5841005460715385, "neutral": -7.734121303328305 }, "capitalize": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "binance": { "positive": -5.524749621789464, "negative": -5.04365550512439, "neutral": -7.734121303328305 }, "lawsuit": { "positive": -8.357962965845681, "negative": -6.296418473619758, "neutral": -7.734121303328305 }, "discord": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "phishing": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "via": { "positive": -7.664815785285735, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "rails": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "stolen": { "positive": -8.357962965845681, "negative": -5.667809814197383, "neutral": -7.734121303328305 }, "yggtorrent": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "shuts": { "positive": -8.357962965845681, "negative": -6.989565654179703, "neutral": -7.734121303328305 }, "leak": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "bribed": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "staff": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "demanding": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "ransom": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "dollar": { "positive": -7.664815785285735, "negative": -6.766422102865493, "neutral": -7.734121303328305 }, "bloodbath": { "positive": -8.357962965845681, "negative": -7.277247726631484, "neutral": -7.734121303328305 }, "hodlnaut": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "celsius": { "positive": -8.357962965845681, "negative": -6.989565654179703, "neutral": -7.734121303328305 }, "arrested": { "positive": -8.357962965845681, "negative": -6.296418473619758, "neutral": -7.734121303328305 }, "charged": { "positive": -8.357962965845681, "negative": -6.989565654179703, "neutral": -7.734121303328305 }, "leaving": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "bankrupt": { "positive": -8.357962965845681, "negative": -6.989565654179703, "neutral": -7.734121303328305 }, "startups": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "wake": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "victim": { "positive": -8.357962965845681, "negative": -6.989565654179703, "neutral": -7.734121303328305 }, "nft": { "positive": -7.25935067717757, "negative": -6.989565654179703, "neutral": -7.734121303328305 }, "cryptocurrency": { "positive": -5.585374243605899, "negative": -4.792341076843483, "neutral": -7.734121303328305 }, "investment": { "positive": -7.664815785285735, "negative": -6.989565654179703, "neutral": -7.734121303328305 }, "take": { "positive": -7.664815785285735, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "use": { "positive": -6.97166860472579, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "collateral": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "loophole": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "force": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "liquidations": { "positive": -8.357962965845681, "negative": -7.277247726631484, "neutral": -7.734121303328305 }, "feds": { "positive": -7.664815785285735, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "couple": { "positive": -8.357962965845681, "negative": -7.277247726631484, "neutral": -7.734121303328305 }, "seize": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "warns": { "positive": -8.357962965845681, "negative": -6.766422102865493, "neutral": -7.734121303328305 }, "holdings": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "aax": { "positive": -8.357962965845681, "negative": -6.989565654179703, "neutral": -7.734121303328305 }, "executives": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "rd": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "ran": { "positive": -8.357962965845681, "negative": -6.989565654179703, "neutral": -7.734121303328305 }, "away": { "positive": -7.664815785285735, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "cost": { "positive": -7.664815785285735, "negative": -7.277247726631484, "neutral": -7.734121303328305 }, "owners": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "driven": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "pulls": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "fake": { "positive": -8.357962965845681, "negative": -6.766422102865493, "neutral": -7.734121303328305 }, "wallets": { "positive": -7.664815785285735, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "pre": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "loaded": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "openai's": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "press": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "account": { "positive": -7.664815785285735, "negative": -6.5841005460715385, "neutral": -7.734121303328305 }, "betterment": { "positive": -8.357962965845681, "negative": -7.277247726631484, "neutral": -7.734121303328305 }, "modular": { "positive": -8.357962965845681, "negative": -7.277247726631484, "neutral": -7.734121303328305 }, "exploiting": { "positive": -8.357962965845681, "negative": -7.277247726631484, "neutral": -7.734121303328305 }, "ads": { "positive": -8.357962965845681, "negative": -7.277247726631484, "neutral": -7.734121303328305 }, "inflencers": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "sites": { "positive": -8.357962965845681, "negative": -7.277247726631484, "neutral": -7.734121303328305 }, "celebrities": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "bittrex": { "positive": -8.357962965845681, "negative": -6.989565654179703, "neutral": -7.734121303328305 }, "target": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "sim": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "tokyo": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "losing": { "positive": -8.357962965845681, "negative": -7.277247726631484, "neutral": -7.734121303328305 }, "nhk": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "sol": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "due": { "positive": -8.357962965845681, "negative": -6.5841005460715385, "neutral": -7.734121303328305 }, "dao": { "positive": -5.793013608384143, "negative": -6.5841005460715385, "neutral": -7.734121303328305 }, "theft": { "positive": -8.357962965845681, "negative": -6.42994986624428, "neutral": -7.734121303328305 }, "brother": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "ceo": { "positive": -7.664815785285735, "negative": -5.890953365511593, "neutral": -7.734121303328305 }, "pleads": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "guilty": { "positive": -8.357962965845681, "negative": -6.766422102865493, "neutral": -7.734121303328305 }, "stealing": { "positive": -8.357962965845681, "negative": -6.989565654179703, "neutral": -7.734121303328305 }, "irs": { "positive": -8.357962965845681, "negative": -7.277247726631484, "neutral": -7.734121303328305 }, "bro": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "scammed": { "positive": -8.357962965845681, "negative": -6.989565654179703, "neutral": -7.734121303328305 }, "reporters": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "readers": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "nork": { "positive": -8.357962965845681, "negative": -7.277247726631484, "neutral": -7.734121303328305 }, "hunters": { "positive": -8.357962965845681, "negative": -7.277247726631484, "neutral": -7.734121303328305 }, "cashio": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "plummets": { "positive": -8.357962965845681, "negative": -6.989565654179703, "neutral": -7.734121303328305 }, "multimillion": { "positive": -8.357962965845681, "negative": -7.277247726631484, "neutral": -7.734121303328305 }, "potentially": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "illegal": { "positive": -8.357962965845681, "negative": -6.989565654179703, "neutral": -7.734121303328305 }, "crashed": { "positive": -8.357962965845681, "negative": -6.42994986624428, "neutral": -7.734121303328305 }, "stopped": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "notifications": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "detectives": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "track": { "positive": -7.664815785285735, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "confirms": { "positive": -8.357962965845681, "negative": -6.989565654179703, "neutral": -7.734121303328305 }, "breach": { "positive": -8.357962965845681, "negative": -7.277247726631484, "neutral": -7.734121303328305 }, "send": { "positive": -7.664815785285735, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "notification": { "positive": -8.357962965845681, "negative": -7.277247726631484, "neutral": -7.734121303328305 }, "ether": { "positive": -7.664815785285735, "negative": -7.277247726631484, "neutral": -7.734121303328305 }, "triggers": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "selloff": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "ftx": { "positive": -6.74852505341158, "negative": -6.073274922305548, "neutral": -7.734121303328305 }, "failure": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "reverberates": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "chicago": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "area": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "man": { "positive": -7.664815785285735, "negative": -6.766422102865493, "neutral": -7.734121303328305 }, "bond": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "iota": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "bitmart": { "positive": -8.357962965845681, "negative": -6.766422102865493, "neutral": -7.734121303328305 }, "following": { "positive": -8.357962965845681, "negative": -6.989565654179703, "neutral": -7.734121303328305 }, "mevboost": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "stole": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "mevbots": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "doj": { "positive": -8.357962965845681, "negative": -6.5841005460715385, "neutral": -7.734121303328305 }, "criminally": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "nassim": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "taleb": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "became": { "positive": -7.664815785285735, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "speculative": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "bitfinex": { "positive": -8.357962965845681, "negative": -7.277247726631484, "neutral": -7.734121303328305 }, "moved": { "positive": -8.357962965845681, "negative": -6.989565654179703, "neutral": -7.734121303328305 }, "apparent": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "behind": { "positive": -6.97166860472579, "negative": -7.277247726631484, "neutral": -7.734121303328305 }, "kia": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "ransomware": { "positive": -8.357962965845681, "negative": -6.989565654179703, "neutral": -7.734121303328305 }, "attack": { "positive": -7.25935067717757, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "entrepreneur": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "justin": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "sun": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "companies": { "positive": -8.357962965845681, "negative": -6.989565654179703, "neutral": -7.734121303328305 }, "sues": { "positive": -8.357962965845681, "negative": -7.277247726631484, "neutral": -7.734121303328305 }, "deduct": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "criminals": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "mailing": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "ledger": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "devices": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "terra": { "positive": -8.357962965845681, "negative": -6.989565654179703, "neutral": -7.734121303328305 }, "crisis": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "ust": { "positive": -8.357962965845681, "negative": -6.766422102865493, "neutral": -7.734121303328305 }, "takes": { "positive": -7.664815785285735, "negative": -7.277247726631484, "neutral": -7.734121303328305 }, "estimates": { "positive": -7.664815785285735, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "fi": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "fa": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "hijacked": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "bancor": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "wazirx": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "india's": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "biggest": { "positive": -6.97166860472579, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "popular": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "code": { "positive": -7.664815785285735, "negative": -7.277247726631484, "neutral": -7.734121303328305 }, "packages": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "rigged": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "bitclout's": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "nader": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "al": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "naji": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "grow": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "increasingly": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "etfs": { "positive": -7.664815785285735, "negative": -7.277247726631484, "neutral": -7.734121303328305 }, "bleed": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "eth": { "positive": -7.25935067717757, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "sinks": { "positive": -8.357962965845681, "negative": -7.277247726631484, "neutral": -7.734121303328305 }, "found": { "positive": -8.357962965845681, "negative": -7.277247726631484, "neutral": -7.734121303328305 }, "turkish": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "jail": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "trt": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "slips": { "positive": -8.357962965845681, "negative": -7.277247726631484, "neutral": -7.734121303328305 }, "hacker": { "positive": -7.25935067717757, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "sold": { "positive": -8.357962965845681, "negative": -7.277247726631484, "neutral": -7.734121303328305 }, "access": { "positive": -7.664815785285735, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "oregon": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "state": { "positive": -7.25935067717757, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "emergency": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "gets": { "positive": -7.664815785285735, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "prison": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "flaw": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "slammed": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "terrible": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "service": { "positive": -8.357962965845681, "negative": -7.277247726631484, "neutral": -7.734121303328305 }, "drain": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "turkey": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "return": { "positive": -7.25935067717757, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "darkside": { "positive": -8.357962965845681, "negative": -7.277247726631484, "neutral": -7.734121303328305 }, "gang": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "quits": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "servers": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "stash": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "seized": { "positive": -8.357962965845681, "negative": -6.989565654179703, "neutral": -7.734121303328305 }, "only": { "positive": -7.664815785285735, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "phone": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "numbers": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "'biggest": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "heist'": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "colorado": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "pastor": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "perpetrated": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "god's": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "command": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "north": { "positive": -8.357962965845681, "negative": -6.42994986624428, "neutral": -7.734121303328305 }, "korean": { "positive": -7.664815785285735, "negative": -6.989565654179703, "neutral": -7.734121303328305 }, "offers": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "island": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "iced": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "tea": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "soars": { "positive": -6.74852505341158, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "changing": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "name": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "bitcoins": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "worth": { "positive": -7.664815785285735, "negative": -6.766422102865493, "neutral": -7.734121303328305 }, "tsb": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "bans": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "kraken": { "positive": -7.664815785285735, "negative": -7.277247726631484, "neutral": -7.734121303328305 }, "halted": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "bnb": { "positive": -8.357962965845681, "negative": -6.5841005460715385, "neutral": -7.734121303328305 }, "admits": { "positive": -7.664815785285735, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "used": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "least": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "wipe": { "positive": -8.357962965845681, "negative": -7.277247726631484, "neutral": -7.734121303328305 }, "experiencing": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "outage": { "positive": -8.357962965845681, "negative": -7.277247726631484, "neutral": -7.734121303328305 }, "plummet": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "warning": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "americans": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "layoffs": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "resulting": { "positive": -8.357962965845681, "negative": -6.989565654179703, "neutral": -7.734121303328305 }, "loss": { "positive": -8.357962965845681, "negative": -6.989565654179703, "neutral": -7.734121303328305 }, "world": { "positive": -7.664815785285735, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "largest": { "positive": -8.357962965845681, "negative": -6.766422102865493, "neutral": -7.734121303328305 }, "possible": { "positive": -7.664815785285735, "negative": -7.277247726631484, "neutral": -7.734121303328305 }, "destroy": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "iran's": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "japanese": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "nearly": { "positive": -7.664815785285735, "negative": -7.277247726631484, "neutral": -7.734121303328305 }, "korea's": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "presents": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "national": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "threat": { "positive": -8.357962965845681, "negative": -7.277247726631484, "neutral": -7.734121303328305 }, "contractor's": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "son": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "alleged": { "positive": -8.357962965845681, "negative": -7.277247726631484, "neutral": -7.734121303328305 }, "marshals": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "upbit": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "protected": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "firm": { "positive": -6.278521424165844, "negative": -7.277247726631484, "neutral": -7.734121303328305 }, "circle": { "positive": -6.74852505341158, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "adds": { "positive": -6.97166860472579, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "stellar": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "binance's": { "positive": -7.664815785285735, "negative": -7.277247726631484, "neutral": -7.734121303328305 }, "extension": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "bybit": { "positive": -8.357962965845681, "negative": -6.766422102865493, "neutral": -7.734121303328305 }, "around": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "bithumb": { "positive": -8.357962965845681, "negative": -7.277247726631484, "neutral": -7.734121303328305 }, "evernote": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "immigrant": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "ruin": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "doesn": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "pay": { "positive": -7.664815785285735, "negative": -7.277247726631484, "neutral": -7.734121303328305 }, "booms": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "kidnappings": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "originates": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "iran": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "china": { "positive": -7.664815785285735, "negative": -7.277247726631484, "neutral": -7.734121303328305 }, "brothers": { "positive": -8.357962965845681, "negative": -6.989565654179703, "neutral": -7.734121303328305 }, "allegedly": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "seconds": { "positive": -7.664815785285735, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "attacking": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "conspiracy": { "positive": -8.357962965845681, "negative": -7.277247726631484, "neutral": -7.734121303328305 }, "launder": { "positive": -8.357962965845681, "negative": -7.277247726631484, "neutral": -7.734121303328305 }, "falls": { "positive": -8.357962965845681, "negative": -6.989565654179703, "neutral": -7.734121303328305 }, "acala": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "issue": { "positive": -8.357962965845681, "negative": -7.277247726631484, "neutral": -7.734121303328305 }, "changpeng": { "positive": -8.357962965845681, "negative": -7.277247726631484, "neutral": -7.734121303328305 }, "zhao": { "positive": -7.25935067717757, "negative": -6.989565654179703, "neutral": -7.734121303328305 }, "plead": { "positive": -8.357962965845681, "negative": -6.989565654179703, "neutral": -7.734121303328305 }, "federal": { "positive": -8.357962965845681, "negative": -7.277247726631484, "neutral": -7.734121303328305 }, "step": { "positive": -8.357962965845681, "negative": -6.989565654179703, "neutral": -7.734121303328305 }, "robinhood": { "positive": -8.357962965845681, "negative": -7.277247726631484, "neutral": -7.734121303328305 }, "related": { "positive": -8.357962965845681, "negative": -7.277247726631484, "neutral": -7.734121303328305 }, "short": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "expectations": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "so": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "exch": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "korea": { "positive": -8.357962965845681, "negative": -7.277247726631484, "neutral": -7.734121303328305 }, "aws": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "mine": { "positive": -6.97166860472579, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "heavy": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "cryptocurrencies": { "positive": -6.566203496617625, "negative": -6.989565654179703, "neutral": -7.734121303328305 }, "three": { "positive": -7.664815785285735, "negative": -6.989565654179703, "neutral": -7.734121303328305 }, "buzz": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "drives": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "graveyard": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "intrusions": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "financials": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "shutdown": { "positive": -8.357962965845681, "negative": -6.989565654179703, "neutral": -7.734121303328305 }, "controversial": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "cents": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "nations": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "join": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "internet": { "positive": -8.357962965845681, "negative": -6.989565654179703, "neutral": -7.734121303328305 }, "giants": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "ad": { "positive": -8.357962965845681, "negative": -6.989565654179703, "neutral": -7.734121303328305 }, "ban": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "fia": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "notice": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "taking": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "flash": { "positive": -8.357962965845681, "negative": -7.277247726631484, "neutral": -7.734121303328305 }, "gdax": { "positive": -8.357962965845681, "negative": -7.277247726631484, "neutral": -7.734121303328305 }, "russians": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "mt": { "positive": -8.357962965845681, "negative": -7.277247726631484, "neutral": -7.734121303328305 }, "gox": { "positive": -8.357962965845681, "negative": -7.277247726631484, "neutral": -7.734121303328305 }, "attempt": { "positive": -8.357962965845681, "negative": -6.989565654179703, "neutral": -7.734121303328305 }, "saving": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "speaks": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "quantum": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "video": { "positive": -7.664815785285735, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "butterfly": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "labs": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "shut": { "positive": -8.357962965845681, "negative": -7.277247726631484, "neutral": -7.734121303328305 }, "ftc": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "drops": { "positive": -8.357962965845681, "negative": -6.5841005460715385, "neutral": -7.734121303328305 }, "profit": { "positive": -6.278521424165844, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "nears": { "positive": -7.25935067717757, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "misused": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "sec's": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "yet": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "approved": { "positive": -6.97166860472579, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "safedollar": { "positive": -8.357962965845681, "negative": -7.277247726631484, "neutral": -7.734121303328305 }, "polygon": { "positive": -8.357962965845681, "negative": -7.277247726631484, "neutral": -7.734121303328305 }, "blamed": { "positive": -8.357962965845681, "negative": -7.277247726631484, "neutral": -7.734121303328305 }, "thefts": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "nvidia": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "peak": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "seizes": { "positive": -8.357962965845681, "negative": -6.989565654179703, "neutral": -7.734121303328305 }, "'pig": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "butchering'": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "cambodia": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "assets": { "positive": -7.664815785285735, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "tied": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "online": { "positive": -7.664815785285735, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "global": { "positive": -7.664815785285735, "negative": -6.989565654179703, "neutral": -7.734121303328305 }, "eminifx": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "sentenced": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "ditch": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "save": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "tell": { "positive": -8.357962965845681, "negative": -6.989565654179703, "neutral": -7.734121303328305 }, "gsd": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "it's": { "positive": -7.664815785285735, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "rugpull": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "coins": { "positive": -7.25935067717757, "negative": -7.277247726631484, "neutral": -7.734121303328305 }, "list": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "dotcom": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "coming": { "positive": -7.25935067717757, "negative": -7.277247726631484, "neutral": -7.734121303328305 }, "cryptoasset": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "realization": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "forfeited": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "peg": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "bankman": { "positive": -7.664815785285735, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "fried": { "positive": -7.664815785285735, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "itself": { "positive": -8.357962965845681, "negative": -7.277247726631484, "neutral": -7.734121303328305 }, "desperate": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "turn": { "positive": -7.664815785285735, "negative": -7.277247726631484, "neutral": -7.734121303328305 }, "allegations": { "positive": -8.357962965845681, "negative": -7.277247726631484, "neutral": -7.734121303328305 }, "goldman": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "downgrades": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "rout": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "documents": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "detail": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "scores": { "positive": -7.664815785285735, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "filed": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "class": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "nicehash": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "canada": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "mulls": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "fine": { "positive": -8.357962965845681, "negative": -7.277247726631484, "neutral": -7.734121303328305 }, "power": { "positive": -6.97166860472579, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "plant": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "members": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "jointly": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "liable": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "asked": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "except": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "paxos": { "positive": -7.664815785285735, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "era": { "positive": -7.25935067717757, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "bad": { "positive": -8.357962965845681, "negative": -7.277247726631484, "neutral": -7.734121303328305 }, "blame": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "seven": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "timeline": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "chaincoin": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "pump": { "positive": -6.97166860472579, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "dump": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "actor": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "bill": { "positive": -6.97166860472579, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "murray": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "raised": { "positive": -6.74852505341158, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "charity": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "crackdown": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "hurt": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "too": { "positive": -7.664815785285735, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "old": { "positive": -7.664815785285735, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "rigs": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "'shutdown'": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "paid": { "positive": -8.357962965845681, "negative": -7.277247726631484, "neutral": -7.734121303328305 }, "extortionists": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "api": { "positive": -8.357962965845681, "negative": -7.277247726631484, "neutral": -7.734121303328305 }, "blacklisted": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "rumors": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "'cz'": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "eos": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "fbi": { "positive": -8.357962965845681, "negative": -6.989565654179703, "neutral": -7.734121303328305 }, "people": { "positive": -7.664815785285735, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "indicted": { "positive": -8.357962965845681, "negative": -7.277247726631484, "neutral": -7.734121303328305 }, "sbi": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "reportedly": { "positive": -7.664815785285735, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "dprk": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "links": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "peter": { "positive": -7.25935067717757, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "thiel": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "backed": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "group": { "positive": -7.25935067717757, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "ipo": { "positive": -6.97166860472579, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "debut": { "positive": -7.25935067717757, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "kelp": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "exploited": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "rally": { "positive": -6.160738388509461, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "altcoin": { "positive": -7.25935067717757, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "warehouse": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "launches": { "positive": -7.25935067717757, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "hamilton": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "teen": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "embroiled": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "fingered": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "stocks": { "positive": -6.74852505341158, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "dxsale": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "extend": { "positive": -7.25935067717757, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "almost": { "positive": -7.664815785285735, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "every": { "positive": -8.357962965845681, "negative": -7.277247726631484, "neutral": -7.734121303328305 }, "other": { "positive": -7.25935067717757, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "worst": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "scammer": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "swan": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "started": { "positive": -7.664815785285735, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "banning": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "anything": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "depot": { "positive": -8.357962965845681, "negative": -6.989565654179703, "neutral": -7.734121303328305 }, "atms": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "offline": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "american": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "atm": { "positive": -8.357962965845681, "negative": -7.277247726631484, "neutral": -7.734121303328305 }, "operator": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "dissecting": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "schemes": { "positive": -8.357962965845681, "negative": -6.989565654179703, "neutral": -7.734121303328305 }, "identification": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "impact": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "show": { "positive": -5.96006769304731, "negative": -7.277247726631484, "neutral": -7.734121303328305 }, "hn": { "positive": -5.362230692291689, "negative": -6.5841005460715385, "neutral": -7.734121303328305 }, "honeypotscan": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "detect": { "positive": -8.357962965845681, "negative": -7.277247726631484, "neutral": -7.734121303328305 }, "judge": { "positive": -7.664815785285735, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "declares": { "positive": -8.357962965845681, "negative": -7.277247726631484, "neutral": -7.734121303328305 }, "mistrial": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "mit": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "grad": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "case": { "positive": -7.25935067717757, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "ethereum's": { "positive": -6.97166860472579, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "fusaka": { "positive": -7.25935067717757, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "node": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "costs": { "positive": -6.74852505341158, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "fluencelabs": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "pushing": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "foss": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "devs": { "positive": -7.664815785285735, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "unclear": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "tesla": { "positive": -7.664815785285735, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "youtube": { "positive": -8.357962965845681, "negative": -6.5841005460715385, "neutral": -7.734121303328305 }, "doubling": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "werewolf": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "spent": { "positive": -7.25935067717757, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "full": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "moon": { "positive": -7.25935067717757, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "chatgpt": { "positive": -8.357962965845681, "negative": -7.277247726631484, "neutral": -7.734121303328305 }, "floods": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "actors": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "don't": { "positive": -7.664815785285735, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "accelerates": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "fed": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "deepens": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "slip": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "faked": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "catch": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "makers": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "longer": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "prosecute": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "turned": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "small": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "town": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "swindled": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "pension": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "life": { "positive": -8.357962965845681, "negative": -7.277247726631484, "neutral": -7.734121303328305 }, "savings": { "positive": -8.357962965845681, "negative": -7.277247726631484, "neutral": -7.734121303328305 }, "defining": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "detecting": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "dumps": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "anatomy": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "john": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "mcafee": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "space": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "replaying": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "absurdly": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "giant": { "positive": -8.357962965845681, "negative": -7.277247726631484, "neutral": -7.734121303328305 }, "networks": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "dogecoin": { "positive": -7.664815785285735, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "co": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "help": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "rich": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "get": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "richer": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "giveaway": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "stream": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "ohio": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "half": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "result": { "positive": -8.357962965845681, "negative": -7.277247726631484, "neutral": -7.734121303328305 }, "'blockchain'": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "contrastive": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "learning": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "framework": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "vcs": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "strangling": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "luna": { "positive": -8.357962965845681, "negative": -7.277247726631484, "neutral": -7.734121303328305 }, "cto": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "welcomes": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "fair": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "regulation": { "positive": -7.25935067717757, "negative": -7.277247726631484, "neutral": -7.734121303328305 }, "rebooted": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "buy": { "positive": -5.41352398667924, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "realized": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "profits": { "positive": -6.412052816790367, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "mogul": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "kwon": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "sentencing": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "derivatives": { "positive": -8.357962965845681, "negative": -7.277247726631484, "neutral": -7.734121303328305 }, "replacing": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "altcoing": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "clobbered": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "safesnipe": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "ai": { "positive": -7.25935067717757, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "detector": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "meme": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "contributor": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "todd": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "promotion": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "writing": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "bump": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "bot": { "positive": -7.664815785285735, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "recommended": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "website": { "positive": -8.357962965845681, "negative": -7.277247726631484, "neutral": -7.734121303328305 }, "turtledex": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "froze": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "want": { "positive": -7.664815785285735, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "margin": { "positive": -8.357962965845681, "negative": -7.277247726631484, "neutral": -7.734121303328305 }, "okcupid": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "florida": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "followed": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "crashing": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "coinbase's": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "users'": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "subject": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "claim": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "spending": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "superbowl": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "prevent": { "positive": -8.357962965845681, "negative": -7.277247726631484, "neutral": -7.734121303328305 }, "steep": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "slide": { "positive": -7.664815785285735, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "shares": { "positive": -7.664815785285735, "negative": -7.277247726631484, "neutral": -7.734121303328305 }, "fall": { "positive": -8.357962965845681, "negative": -7.277247726631484, "neutral": -7.734121303328305 }, "wasn't": { "positive": -7.664815785285735, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "problem": { "positive": -8.357962965845681, "negative": -7.277247726631484, "neutral": -7.734121303328305 }, "terrausd": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "speed": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "facebook": { "positive": -7.664815785285735, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "linkedin": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "deleted": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "embattled": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "exchanges": { "positive": -6.566203496617625, "negative": -7.277247726631484, "neutral": -7.734121303328305 }, "hunt": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "missing": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "auditor": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "grindset": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "course": { "positive": -7.664815785285735, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "hacking": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "keeping": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "sanity": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "creative": { "positive": -8.357962965845681, "negative": -7.277247726631484, "neutral": -7.734121303328305 }, "accounting": { "positive": -8.357962965845681, "negative": -7.277247726631484, "neutral": -7.734121303328305 }, "kazakhstan": { "positive": -8.357962965845681, "negative": -7.277247726631484, "neutral": -7.734121303328305 }, "blow": { "positive": -8.357962965845681, "negative": -7.277247726631484, "neutral": -7.734121303328305 }, "deals": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "operation": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "kncminer": { "positive": -7.664815785285735, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "core": { "positive": -7.664815785285735, "negative": -7.277247726631484, "neutral": -7.734121303328305 }, "scientific": { "positive": -8.357962965845681, "negative": -7.277247726631484, "neutral": -7.734121303328305 }, "filing": { "positive": -8.357962965845681, "negative": -7.277247726631484, "neutral": -7.734121303328305 }, "chapter": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "falters": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "big": { "positive": -6.74852505341158, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "clean": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "quit": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "genesis": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "vc": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "funded": { "positive": -7.664815785285735, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "gig": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "economy": { "positive": -7.664815785285735, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "securities": { "positive": -7.664815785285735, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "caution": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "naturally": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "arising": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "alex": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "mashinsky": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "sentence": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "vacated": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "retired": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "court": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "usdc": { "positive": -6.74852505341158, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "depegs": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "dai": { "positive": -7.25935067717757, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "usdd": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "frax": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "follow": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "yc": { "positive": -6.412052816790367, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "crowd": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "nyt": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "investigation": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "settlement": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "fallen": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "guild": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "games": { "positive": -7.25935067717757, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "produced": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "xrp": { "positive": -7.664815785285735, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "cryptos": { "positive": -7.664815785285735, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "falling": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "marketplace": { "positive": -7.664815785285735, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "'rampant'": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "fakes": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "plagiarism": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "doom": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "polkadot": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "jam": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "laptop": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "lag": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "nine": { "positive": -6.97166860472579, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "cools": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "agrees": { "positive": -7.25935067717757, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "illicit": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "ask": { "positive": -6.566203496617625, "negative": -7.277247726631484, "neutral": -7.734121303328305 }, "financial": { "positive": -7.25935067717757, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "vs": { "positive": -7.664815785285735, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "where": { "positive": -7.664815785285735, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "real": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "go": { "positive": -6.74852505341158, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "el": { "positive": -7.664815785285735, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "salvador": { "positive": -7.664815785285735, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "temporarily": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "suspended": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "'bitcoin": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "wallet'": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "apple": { "positive": -7.664815785285735, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "store": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "'follow": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "founder's": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "twitter": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "shakedown": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "bros": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "broke": { "positive": -8.357962965845681, "negative": -7.6827128347396485, "neutral": -7.734121303328305 }, "sink": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "eightco": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "skyrocket": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "move": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "amass": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "worldcoin": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "revolutionary": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "tron": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "free": { "positive": -6.566203496617625, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "transactions": { "positive": -6.97166860472579, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "yearend": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "intel": { "positive": -6.97166860472579, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "vets": { "positive": -7.25935067717757, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "helped": { "positive": -7.25935067717757, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "soar": { "positive": -6.74852505341158, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "unaware": { "positive": -7.25935067717757, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "infamous": { "positive": -7.25935067717757, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "energizing": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "sustainability": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "innovation": { "positive": -6.74852505341158, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "texas": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "kodak": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "kodakcoin": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "plans": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "records": { "positive": -7.25935067717757, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "theminermag": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "brian": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "armstrong": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "ever": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "why": { "positive": -6.0553778728516345, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "re": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "collectibles": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "nfts": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "africa": { "positive": -6.97166860472579, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "large": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "most": { "positive": -7.25935067717757, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "thing": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "moni": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "human": { "positive": -6.97166860472579, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "centered": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "design": { "positive": -7.25935067717757, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "idea": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "runs": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "dip": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "jump": { "positive": -7.25935067717757, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "ship": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "lone": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "fueled": { "positive": -7.25935067717757, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "study": { "positive": -6.97166860472579, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "futures": { "positive": -7.25935067717757, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "part": { "positive": -7.25935067717757, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "street's": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "race": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "talent": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "soaring": { "positive": -7.25935067717757, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "surging": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "production": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "crimp": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "margins": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "because": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "experiment": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "senate": { "positive": -6.97166860472579, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "passes": { "positive": -7.25935067717757, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "trump": { "positive": -6.97166860472579, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "media": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "com": { "positive": -7.25935067717757, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "build": { "positive": -7.25935067717757, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "cro": { "positive": -7.25935067717757, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "jumps": { "positive": -6.74852505341158, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "caused": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "single": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "delusions": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "booming": { "positive": -7.25935067717757, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "start": { "positive": -7.25935067717757, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "bang": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "trips": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "circuit": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "breaker": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "bitcoin's": { "positive": -7.25935067717757, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "relies": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "strategy's": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "buying": { "positive": -5.96006769304731, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "michael": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "saylor": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "kill": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "prophets": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "survey": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "boom": { "positive": -6.160738388509461, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "bust": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "central": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "banks": { "positive": -6.74852505341158, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "ignore": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "breakthrough": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "dispute": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "resolution": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "fueling": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "great": { "positive": -6.566203496617625, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "irony": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "smaller": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "cousins": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "leading": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "golem": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "bounce": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "alpenglow": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "solana's": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "rewrite": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "black": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "box": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "filings": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "tries": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "confidence": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "washington": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "aim": { "positive": -7.25935067717757, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "win": { "positive": -6.566203496617625, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "anticipated": { "positive": -7.25935067717757, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "environmental": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "burden": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "united": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "states'": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "europe": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "weirdest": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "cheap": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "empty": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "plants": { "positive": -6.97166860472579, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "few": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "rules": { "positive": -7.25935067717757, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "chip": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "art": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "blocks": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "resists": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "hopium": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "sales": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "observations": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "today's": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "former": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "md": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "stanley": { "positive": -7.25935067717757, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "lead": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "fad": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "future": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "make": { "positive": -7.25935067717757, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "thiel's": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "made": { "positive": -7.25935067717757, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "patterns": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "flags": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "wedges": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "triangles": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "desks": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "staffing": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "anticipation": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "prolonged": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "surviving": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "privacy": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "rule": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "covid": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "unlimited": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "printing": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "reached": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "going": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "went": { "positive": -7.25935067717757, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "planning": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "golf": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "fit": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "sectors": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "department": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "justice": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "creating": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "units": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "bet": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "legitimate": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "python": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "hold": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "super": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "$msbt": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "official": { "positive": -7.25935067717757, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "listing": { "positive": -6.566203496617625, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "nyse": { "positive": -7.25935067717757, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "mastercard": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "platform": { "positive": -7.25935067717757, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "bvnk": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "mythbusting": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "altcoins": { "positive": -7.25935067717757, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "zk": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "snark": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "technology": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "indexer": { "positive": -7.25935067717757, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "fast": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "latency": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "written": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "kit": { "positive": -7.25935067717757, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "cryptokitties": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "breedable": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "cats": { "positive": -7.25935067717757, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "ethwaterloo": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "winner": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "launching": { "positive": -7.25935067717757, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "stablecoins": { "positive": -7.25935067717757, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "tether's": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "billions": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "makes": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "agree": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "hasten": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "briefly": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "amazon": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "better": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "chasing": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "riskless": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "triangular": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "arbitrage": { "positive": -7.25935067717757, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "widespread": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "swings": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "income": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "profbit": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "foundation": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "drive": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "wave": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "gain": { "positive": -7.25935067717757, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "rivals": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "cash": { "positive": -6.97166860472579, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "easy": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "steps": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "calculator": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "patent": { "positive": -7.25935067717757, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "efficient": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "still": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "explained": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "harder": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "less": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "algorithm": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "adjusts": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "clamping": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "icos": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "predictive": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "spreadsheet": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "brought": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "happen": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "aren't": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "certain": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "mongodb": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "morphia": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "pumping": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "russian": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "born": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "cofounder": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "supported": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "ukraine": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "buildfinance": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "hostile": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "takeover": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "utterly": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "system": { "positive": -6.97166860472579, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "novi": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "fb": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "usdp": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "guatemala": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "usa": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "regulated": { "positive": -7.25935067717757, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "genius": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "act": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "much": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "silver": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "plutonium": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "successful": { "positive": -6.160738388509461, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "spend": { "positive": -7.25935067717757, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "confirm": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "there": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "majority": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "merge": { "positive": -7.25935067717757, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "goerli": { "positive": -7.25935067717757, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "test": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "dex": { "positive": -7.25935067717757, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "tops": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "looks": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "winning": { "positive": -7.25935067717757, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "streak": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "overhaul": { "positive": -7.25935067717757, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "scrambling": { "positive": -7.25935067717757, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "fix": { "positive": -7.25935067717757, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "form": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "partnership": { "positive": -6.74852505341158, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "since": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "seeks": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "middle": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "east": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "france": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "branded": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "incomprehensible": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "mep": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "regulators": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "tokenized": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "consumer": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "transition": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "react": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "native": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "jumped": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "fold": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "cloud": { "positive": -7.25935067717757, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "services": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "jpmorgan": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "facilitate": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "chief": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "speedy": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "laws": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "surpasses": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "taylor": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "swift": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "agreed": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "baile": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "proposed": { "positive": -7.25935067717757, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "climate": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "built": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "partnerships": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "recursive": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "split": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "america": { "positive": -7.25935067717757, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "legal": { "positive": -7.25935067717757, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "wyoming": { "positive": -6.97166860472579, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "america's": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "'dao": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "law'": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "effect": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "july": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "receiving": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "final": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "private": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "testnet": { "positive": -7.25935067717757, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "mev": { "positive": -7.25935067717757, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "infra": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "cointracker": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "hexel": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "create": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "hedgehog": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "multis": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "business": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "busd": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "discontinue": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "rival": { "positive": -6.97166860472579, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "makerdao": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "erc": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "representatives": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "unveil": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "focused": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "legislation": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "source": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "lib": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "protection": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "ticksupply": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "tick": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "csv": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "dfj": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "growth": { "positive": -7.25935067717757, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "usaa": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "led": { "positive": -7.25935067717757, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "ivp": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "stacks": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "qualified": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "offering": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "african": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "valr": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "pantera": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "capital": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "nm": { "positive": -7.25935067717757, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "asic": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "leaderless": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "organization": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "trying": { "positive": -7.25935067717757, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "julian": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "assange": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "late": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "squeeze": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "threaten": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "sue": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "one": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "wafers": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "tsmc": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "per": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "taproot": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "activated": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "venture": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "capitalist": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "tim": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "draper": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "auction": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "winklevoss": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "twins": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "gift": { "positive": -7.25935067717757, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "cards": { "positive": -7.25935067717757, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "helps": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "virtual": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "good": { "positive": -6.0553778728516345, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "days": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "running": { "positive": -7.25935067717757, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "zig": { "positive": -7.25935067717757, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "pure": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "library": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "benchmark": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "alloy": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "rs": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "added": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "sharding": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "availability": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "sampling": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "pectra": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "what's": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "metamask": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "xnames": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "instead": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "address": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "naming": { "positive": -7.25935067717757, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "mapping": { "positive": -7.25935067717757, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "readable": { "positive": -7.25935067717757, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "names": { "positive": -7.25935067717757, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "dencun": { "positive": -6.97166860472579, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "ushering": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "march": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "th": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "evolved": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "blobs": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "putin": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "aide": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "eyeing": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "beat": { "positive": -7.25935067717757, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "sanctions": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "driving": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "sector": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "finds": { "positive": -7.25935067717757, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "success": { "positive": -7.25935067717757, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "vendors": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "call": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "solutions": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "battling": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "credit": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "card": { "positive": -7.25935067717757, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "firms": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "issuing": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "ripple": { "positive": -7.25935067717757, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "rail": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "boost": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "rlusd": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "said": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "offered": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "quark": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "coinzest": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "accidental": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "airdrop": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "watched": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "friend": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "billboards": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "bounced": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "cz's": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "sam": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "crunch": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "pardon": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "clemency": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "pig": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "butchers": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "voyager's": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "walk": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "deal": { "positive": -7.25935067717757, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "direct": { "positive": -7.25935067717757, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "valued": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "date": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "nasdaq": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "tells": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "like": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "collecting": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "beanie": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "babies": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "fed's": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "megadeal": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "play": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "rbc": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "transfer": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "see": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "estimated": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "south": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "races": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "sent": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "polymarket": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "tiny": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "wood": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "ark": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "planet": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "isn't": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "battle": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "keep": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "mum": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "development": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "unlocking": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "telsa": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "resume": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "easily": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "anthony": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "scaramucci": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "coffee": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "button": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "donations": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "gpus": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "unchained": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "neural": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "nets": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "without": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "hurting": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "hash": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "receives": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "seeking": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "offer": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "spook": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "lagged": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "tech": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "soared": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "worry": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "find": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "some": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "resources": { "positive": -7.664815785285735, "negative": -8.375860015299594, "neutral": -7.734121303328305 } }, "oovLogLikelihood": { "positive": -8.357962965845681, "negative": -8.375860015299594, "neutral": -7.734121303328305 }, "vocabulary": ["$msbt", "'biggest", "'bitcoin", "'blockchain'", "'cz'", "'dao", "'follow", "'pig", "'rampant'", "'shutdown'", "aax", "abandoned", "absconds", "absorb", "absurdly", "academic", "acala", "accelerate", "accelerates", "accept", "access", "accidental", "account", "accounting", "accounts", "accumulated", "accumulation", "across", "act", "action", "activated", "activates", "activity", "actor", "actors", "actually", "ad", "added", "address", "addressing", "adds", "adjusted", "adjusts", "admin", "admits", "adoption", "ads", "africa", "african", "again", "aggressively", "ago", "agree", "agreed", "agrees", "ahead", "ai", "aide", "aim", "airdrop", "al", "alex", "algorithm", "alike", "all", "allegations", "alleged", "allegedly", "allocation", "allowed", "alloy", "almost", "alpenglow", "alt", "altcoin", "altcoing", "altcoins", "amass", "amazing", "amazon", "america", "america's", "american", "americans", "amid", "analysis", "analyst", "analysts", "anatomy", "announcement", "announces", "another", "anthony", "anticipated", "anticipation", "anyone", "anything", "api", "app", "apparent", "apple", "approaches", "approval", "approved", "arbitrage", "arbitrum", "architecture", "area", "aren't", "arguments", "arising", "ark", "armstrong", "around", "arrest", "arrested", "art", "asean", "asia", "asic", "ask", "asked", "assange", "asset", "assets", "atm", "atms", "attack", "attacker", "attackers", "attacking", "attempt", "auction", "auditor", "authority", "availability", "average", "averaged", "awaiting", "award", "away", "aws", "babies", "back", "backed", "bad", "baile", "ban", "bancor", "bang", "bank", "bankman", "bankrupt", "bankruptcy", "banks", "banning", "bans", "base", "based", "battle", "battling", "beanie", "bear", "bearish", "bears", "beat", "became", "because", "becomes", "beginner", "behind", "benchmark", "bet", "bets", "better", "betterment", "big", "biggest", "bill", "billboards", "billion", "billions", "binance", "binance's", "bitclout's", "bitcoin", "bitcoin's", "bitcoins", "bitfinex", "bithumb", "bitmart", "bittrex", "black", "blacklisted", "blackrock", "blame", "blamed", "bleed", "blobs", "block", "blockchain", "blocks", "bloodbath", "blow", "bnb", "bond", "books", "boom", "booming", "booms", "boost", "border", "born", "bot", "both", "bottom", "bounce", "bounced", "bound", "box", "brace", "branded", "breach", "break", "breakdown", "breaker", "breaking", "breakout", "breaks", "breakthrough", "breedable", "brian", "bribed", "bridge", "briefly", "bro", "broke", "broken", "bros", "brother", "brothers", "brought", "bsc", "btc", "bubble", "bug", "bugs", "build", "buildfinance", "building", "built", "bull", "bullish", "bullishly", "bulls", "bump", "burden", "burn", "burst", "busd", "business", "bust", "butchering'", "butchers", "butter", "butterfly", "button", "buy", "buyers", "buying", "buys", "buzz", "bvnk", "bybit", "calculator", "call", "calls", "cambodia", "canada", "cap", "capacity", "capital", "capitalist", "capitalize", "capitulation", "card", "cards", "case", "cash", "cashio", "catalyst", "catch", "cats", "caused", "caution", "cefi", "celebrities", "celsius", "centered", "central", "cents", "ceo", "certain", "chain", "chaincoin", "changelog", "changes", "changing", "changpeng", "chapter", "charged", "charges", "charity", "chart", "chartered", "chasing", "chatgpt", "cheap", "checkout", "chicago", "chief", "china", "chip", "choices", "choosing", "circle", "circuit", "citing", "claim", "clamping", "clarity", "class", "classic", "clean", "clear", "clemency", "clients", "climate", "clobbered", "closed", "cloud", "co", "code", "coffee", "cofounder", "coin", "coinbase", "coinbase's", "coins", "cointracker", "coinzest", "cold", "collapse", "collapsed", "collapses", "collapsing", "collateral", "collectibles", "collecting", "colorado", "com", "coming", "command", "commentary", "community", "companies", "company", "compiled", "completed", "compromised", "concerns", "conference", "confidence", "confirm", "confirmed", "confirms", "consensus", "consolidating", "consolidation", "conspiracy", "consumer", "contagion", "content", "continue", "continues", "contract", "contractor's", "contrastive", "contributor", "control", "controversial", "conviction", "cools", "core", "corporate", "correction", "correctly", "cosmetic", "cost", "costs", "counterparty", "countries", "couple", "course", "court", "cousins", "covid", "cpi", "crackdown", "crash", "crashed", "crashes", "crashing", "cratered", "create", "creating", "creative", "credit", "criminal", "criminally", "criminals", "crimp", "crisis", "cro", "cross", "crossed", "crowd", "crunch", "crypto", "cryptoasset", "cryptocurrencies", "cryptocurrency", "cryptokitties", "cryptos", "csv", "cto", "currency", "current", "custody", "customer", "customers", "cut", "cuts", "cycle", "cz's", "dai", "daily", "dao", "darkside", "dashed", "data", "date", "day", "days", "dca", "dead", "deal", "deals", "debasement", "debut", "decentralization", "decentralized", "declares", "decline", "deduct", "deep", "deepens", "default", "defending", "defi", "defining", "deflationary", "deleted", "delusions", "demand", "demanding", "dencun", "department", "depeg", "depegs", "deposits", "depot", "derivatives", "design", "desks", "desperate", "despite", "destroy", "detail", "detect", "detecting", "detectives", "detector", "developer", "developers", "development", "devices", "devs", "dex", "dfj", "diamond", "difficulty", "digesting", "digital", "dip", "direct", "discontinue", "discord", "discussing", "discussion", "dispute", "dissecting", "ditch", "dive", "documentation", "documents", "doesn", "dogecoin", "doj", "dollar", "dollars", "don't", "donations", "doom", "dormancy", "dotcom", "double", "doubling", "down", "downgrades", "downtrend", "dprk", "drain", "drained", "drains", "draper", "drive", "driven", "drives", "driving", "drop", "dropped", "drops", "due", "dump", "dumped", "dumping", "dumps", "dxsale", "early", "ease", "easily", "east", "easy", "economics", "economist", "economy", "ecosystem", "education", "educational", "effect", "efficient", "eightco", "eip", "el", "embattled", "embroiled", "emergency", "emerging", "eminifx", "empty", "enables", "end", "ending", "energizing", "energy", "enforcement", "entire", "entrepreneur", "environment", "environmental", "eos", "era", "erc", "estimated", "estimates", "etf", "etfs", "eth", "ether", "ethereum", "ethereum's", "ethwaterloo", "europe", "european", "even", "event", "ever", "evernote", "every", "everyone", "everything", "evolved", "except", "exch", "exchange", "exchanges", "executives", "exit", "exits", "expanding", "expands", "expectations", "expected", "expects", "experience", "experiencing", "experiment", "explained", "explainer", "exploit", "exploited", "exploiting", "explorer", "exposes", "extend", "extended", "extension", "extortionists", "extreme", "eyeing", "fa", "facebook", "faces", "facilitate", "fad", "fade", "failed", "failure", "fair", "fake", "faked", "fakes", "fall", "fallen", "falling", "falls", "falters", "families", "famous", "faq", "farmers", "fast", "faster", "fault", "fb", "fbi", "fear", "fears", "feature", "fed", "fed's", "federal", "feds", "fee", "feels", "fees", "few", "fi", "fia", "fiat", "filed", "files", "filing", "filings", "filter", "final", "finally", "finance", "financial", "financials", "find", "finds", "fine", "fines", "fingered", "fintech", "fire", "firm", "firmly", "firms", "first", "fit", "fix", "flag", "flags", "flash", "flat", "flaw", "floods", "florida", "fluencelabs", "flush", "focused", "fold", "follow", "followed", "following", "force", "forever", "forfeited", "fork", "form", "former", "forms", "foss", "found", "foundation", "founder", "founder's", "founders", "fourth", "framework", "france", "fraud", "fraudulent", "frax", "free", "fried", "friend", "froze", "frozen", "ftc", "ftx", "fueled", "fueling", "full", "fund", "funded", "funding", "funds", "fusaka", "future", "futures", "gain", "gaining", "gains", "games", "gang", "gas", "gdax", "genesis", "genius", "get", "gets", "giant", "giants", "gift", "gig", "giveaway", "global", "globally", "go", "god's", "goerli", "goes", "going", "gold", "goldman", "golem", "golf", "gone", "good", "google", "got", "government", "gox", "gpus", "grad", "graveyard", "great", "greed", "green", "grindset", "group", "grow", "growing", "growth", "gsd", "guatemala", "guide", "guild", "guilty", "gwei", "hack", "hacked", "hacker", "hackers", "hacking", "half", "halt", "halted", "halts", "halving", "hamilton", "handily", "hands", "happen", "happy", "hard", "harder", "hardware", "hash", "hashrate", "hasten", "healthy", "heavily", "heavy", "hedge", "hedgehog", "heist'", "held", "help", "helped", "helps", "here", "hexel", "high", "hijacked", "history", "hit", "hits", "hn", "hodlers", "hodlnaut", "hold", "holders", "holding", "holdings", "holds", "home", "honeypotscan", "hopes", "hopium", "horizon", "hostile", "hot", "hourly", "hours", "how", "human", "hunt", "hunters", "hurt", "hurting", "iced", "icos", "idea", "identification", "ignore", "illegal", "illicit", "immigrant", "impact", "impressive", "improves", "incidents", "income", "incoming", "incomprehensible", "increase", "increasingly", "indefinitely", "index", "indexer", "india's", "indicators", "indicted", "industry", "infamous", "infinite", "inflation", "inflencers", "inflows", "influencer", "infra", "innovation", "insolvent", "instant", "instantly", "instead", "institutional", "intel", "interest", "internet", "intrusions", "invested", "investigation", "investment", "investor", "investors", "iota", "ipo", "iran", "iran's", "irony", "irs", "island", "isn't", "issue", "issuer", "issues", "issuing", "it's", "itself", "ivp", "jail", "jam", "japanese", "job", "john", "join", "jointly", "jp", "jpmorgan", "judge", "julian", "july", "jump", "jumped", "jumps", "just", "justice", "justin", "kazakhstan", "keep", "keeping", "kelp", "key", "keys", "kia", "kidnappings", "kill", "kit", "kncminer", "know", "knowledge", "kodak", "kodakcoin", "korea", "korea's", "korean", "kraken", "kwon", "labs", "lag", "lagged", "laptop", "large", "largest", "last", "late", "latency", "latest", "launch", "launched", "launcher", "launches", "launching", "launder", "laureate", "law'", "laws", "lawsuit", "layer", "layoffs", "lead", "leaderless", "leading", "leak", "learn", "learned", "learning", "least", "leaving", "led", "ledger", "leg", "legal", "legislation", "legitimate", "lender", "lending", "less", "lesson", "lessons", "lets", "level", "leverage", "liable", "lib", "library", "life", "lightning", "like", "likely", "linkedin", "links", "liquidated", "liquidates", "liquidation", "liquidations", "liquidity", "list", "listing", "live", "loaded", "lone", "long", "longer", "look", "looking", "looks", "loophole", "lose", "loses", "losing", "loss", "losses", "lost", "low", "lower", "lows", "luck", "luna", "ma", "macro", "macroeconomic", "made", "mailing", "mainnet", "mainstream", "major", "majority", "majors", "make", "makerdao", "makers", "makes", "man", "manager", "mapping", "march", "margin", "margins", "market", "marketplace", "markets", "marks", "marshals", "mashinsky", "mass", "massive", "mastercard", "mathematically", "matured", "mcafee", "md", "mechanisms", "media", "megadeal", "members", "meme", "mep", "merge", "merits", "merkle", "metamask", "metrics", "mev", "mevboost", "mevbots", "michael", "middle", "milestone", "million", "millions", "mine", "miner", "miners", "mining", "minor", "mint", "minute", "minutes", "misleading", "missing", "mission", "mistake", "mistrial", "misused", "mit", "modestly", "modular", "mogul", "moment", "momentum", "money", "mongodb", "moni", "month", "monthly", "months", "moon", "more", "morgan", "morphia", "most", "mostly", "move", "moved", "moves", "moving", "mt", "much", "mulls", "multi", "multimillion", "multiple", "multis", "multisig", "mum", "murray", "mythbusting", "nader", "naji", "name", "names", "naming", "narrow", "nasdaq", "nassim", "national", "nations", "nationwide", "native", "naturally", "near", "nearly", "nears", "negative", "net", "nets", "network", "networks", "neural", "neutral", "never", "new", "newcomers", "next", "nft", "nfts", "nhk", "nicehash", "nine", "nm", "no", "nobel", "node", "nork", "north", "not", "notes", "notice", "notification", "notifications", "novi", "now", "nuanced", "numbers", "nvidia", "nyse", "nyt", "observations", "off", "offer", "offered", "offering", "offers", "official", "offline", "ohio", "okcupid", "old", "one", "online", "only", "onramp", "open", "openai's", "opens", "operation", "operations", "operator", "optimistic", "options", "order", "ordered", "oregon", "organization", "originates", "other", "out", "outage", "outflows", "outlook", "outpacing", "outperformed", "over", "overhaul", "overnight", "overseas", "own", "owners", "packages", "paid", "pain", "panic", "panicking", "pantera", "paper", "par", "parabolic", "pardon", "part", "partners", "partnership", "partnerships", "passes", "past", "pastor", "patch", "patent", "pattern", "patterns", "pauses", "paxos", "pay", "paying", "payment", "payments", "paypal", "peak", "pectra", "peg", "pension", "people", "per", "percent", "period", "perpetrated", "persist", "peter", "phase", "philippines", "phishing", "phone", "phrase", "pig", "plagiarism", "plan", "planet", "planning", "plans", "plant", "plants", "platform", "play", "plead", "pleads", "please", "plummet", "plummets", "plunges", "plutonium", "police", "policy", "polkadot", "poll", "polygon", "polymarket", "ponzi", "pool", "popular", "portal", "portfolio", "position", "possible", "post", "posting", "potentially", "power", "pre", "predictive", "predicts", "presents", "press", "pressure", "prevent", "previous", "price", "prices", "primer", "print", "printing", "prior", "prioritize", "prison", "privacy", "private", "probe", "problem", "processor", "produced", "production", "profbit", "profile", "profit", "profitability", "profitable", "profits", "project", "prolonged", "promoting", "promotion", "proof", "proofs", "prophets", "proposal", "proposed", "prosecute", "protected", "protection", "protocol", "protocols", "providers", "public", "pull", "pulls", "pump", "pumping", "pure", "pushing", "putin", "python", "qualified", "quantum", "quark", "quarter", "quarterly", "queries", "question", "questioned", "questions", "quiet", "quietly", "quit", "quits", "race", "races", "rail", "rails", "raised", "raises", "rallies", "rally", "rallying", "ran", "range", "ranks", "ransom", "ransomware", "rapidly", "rate", "rates", "rbc", "rd", "re", "reach", "reached", "reaches", "react", "read", "readable", "readers", "reading", "real", "realization", "realized", "rebooted", "receives", "receiving", "recent", "recommendations", "recommended", "record", "records", "recover", "recovers", "recovery", "recursive", "refresh", "refuse", "regime", "regulated", "regulation", "regulator", "regulators", "regulatory", "rejection", "related", "release", "released", "reliability", "relies", "remained", "reminder", "remittance", "renewable", "replacing", "replaying", "report", "reported", "reportedly", "reporters", "reports", "reposts", "representatives", "research", "reserve", "reserves", "resistance", "resists", "resolution", "resources", "result", "resulting", "resume", "retail", "retailer", "retired", "retrospective", "return", "returns", "revenue", "reverberates", "revives", "revolutionary", "rewrite", "rich", "richer", "rigged", "right", "rigs", "ring", "ripple", "rise", "risk", "riskless", "rival", "rivals", "rlusd", "robinhood", "rotating", "rout", "rs", "rug", "rugpull", "ruin", "rule", "rules", "rumors", "run", "running", "runs", "russian", "russians", "safedollar", "safesnipe", "said", "saigon", "sale", "sales", "salvador", "sam", "sampling", "sanctions", "sanity", "save", "saves", "saving", "savings", "saylor", "says", "sbi", "sbv", "scam", "scammed", "scammer", "scammers", "scams", "scaramucci", "schedule", "scheduled", "scheme", "schemes", "scientific", "scores", "scrambling", "searches", "season", "sec", "sec's", "second", "seconds", "sector", "sectors", "securities", "security", "see", "seed", "seeking", "seeks", "seize", "seized", "seizes", "sell", "selling", "selloff", "sells", "senate", "send", "sends", "sent", "sentence", "sentenced", "sentencing", "sentiment", "series", "servers", "service", "services", "set", "settle", "settlement", "setup", "seven", "severe", "shakedown", "shaken", "sharding", "share", "shared", "shares", "sharing", "sharply", "shills", "ship", "ships", "shitcoin", "shock", "short", "show", "shows", "shrink", "shut", "shutdown", "shuts", "sideways", "signal", "signaling", "significantly", "signing", "silver", "sim", "since", "single", "sink", "sinks", "sites", "skyrocket", "slammed", "slashed", "slide", "slip", "slips", "small", "smaller", "smart", "smooth", "snark", "so", "soar", "soared", "soaring", "soars", "software", "sol", "solana", "solana's", "sold", "solutions", "some", "son", "source", "south", "southeast", "space", "speaks", "speculative", "speed", "speedy", "spend", "spending", "spent", "spike", "split", "spook", "spot", "spreadsheet", "squeeze", "stable", "stablecoin", "stablecoins", "stacks", "staff", "staffing", "stake", "staking", "standard", "stanley", "start", "started", "starting", "startup", "startups", "stash", "state", "statements", "states'", "stats", "steady", "steal", "stealing", "steals", "steep", "stellar", "step", "steps", "sticking", "still", "stock", "stocks", "stole", "stolen", "stopped", "storage", "store", "strangling", "strategic", "strategy's", "streak", "stream", "street's", "strength", "strengthens", "strong", "structure", "structured", "study", "style", "subject", "success", "successful", "sudden", "sue", "sued", "sues", "suggest", "summer", "sun", "super", "superbowl", "supply", "support", "supported", "surge", "surges", "surging", "surpasses", "surprise", "survey", "surviving", "suspected", "suspended", "suspends", "sustainability", "swan", "swift", "swindled", "swings", "system", "take", "takeover", "takes", "taking", "taleb", "talent", "taproot", "target", "targets", "tax", "taylor", "tea", "tech", "technical", "technology", "teen", "tell", "tells", "telsa", "temporarily", "term", "terminal", "terra", "terrausd", "terrible", "territory", "tesla", "test", "testnet", "tether", "tether's", "texas", "textbook", "th", "than", "thanks", "theft", "thefts", "theminermag", "there", "thiel", "thiel's", "thing", "thorchain", "thoughts", "thousands", "thread", "threat", "threaten", "three", "throughput", "throwing", "tick", "ticks", "ticksupply", "tied", "tight", "tim", "time", "timeline", "tiny", "today", "today's", "todd", "token", "tokenized", "tokenomics", "tokens", "tokyo", "tomorrow", "too", "tools", "top", "tops", "total", "tough", "towel", "town", "track", "traction", "trade", "tradeoffs", "traders", "trades", "trading", "traditional", "transaction", "transactions", "transfer", "transition", "treasury", "trees", "triangle", "triangles", "triangular", "tries", "triggers", "triples", "trips", "tron", "trt", "trump", "trust", "trying", "tsb", "tsmc", "tumbles", "tumbling", "turkey", "turkish", "turn", "turned", "turns", "turtledex", "tvl", "twins", "twitter", "two", "type", "ui", "ukraine", "unaware", "unchained", "unchanged", "unclear", "under", "underwater", "united", "units", "unlike", "unlimited", "unlock", "unlocking", "unregulated", "unreported", "unsuspecting", "unveil", "up", "upbit", "update", "upgrade", "upgrades", "usa", "usaa", "usage", "usd", "usdc", "usdd", "usdp", "use", "used", "user", "users", "users'", "uses", "ushering", "using", "ust", "utterly", "vacated", "validator", "validators", "valr", "valued", "vc", "vcs", "vendors", "vengeance", "venture", "version", "versus", "very", "veteran", "vets", "via", "victim", "victims", "video", "vietnam", "vietnamese", "virtual", "visa", "vnd", "volatility", "volume", "volumes", "voyager's", "vs", "wafers", "waiting", "wake", "walk", "wall", "wallet", "wallet'", "wallets", "want", "warehouse", "warning", "warns", "washington", "wasn't", "watched", "watershed", "wave", "way", "wazirx", "weak", "wealth", "web", "website", "wedges", "week", "weeks", "weirdest", "welcomes", "well", "went", "werewolf", "whale", "whales", "what's", "where", "why", "widespread", "win", "winklevoss", "winner", "winning", "wins", "winter", "wipe", "wiped", "withdrawals", "within", "without", "wood", "work", "works", "world", "worldcoin", "worried", "worry", "worsens", "worst", "worth", "worthless", "writing", "written", "wyoming", "xnames", "xrp", "yc", "year", "yearend", "yearly", "years", "yet", "yggtorrent", "yield", "youtube", "ytd", "zero", "zhao", "zig", "zk"], "trainedAt": "2026-05-30T12:48:07.752Z", "trainSize": 669, "testSize": 42 };
  }
});

// api/_lib/ai/nlp/model-metrics.ts
var MODEL_METRICS;
var init_model_metrics = __esm({
  "api/_lib/ai/nlp/model-metrics.ts"() {
    MODEL_METRICS = { "accuracy": 0.6905, "macroF1": 0.6821, "perClass": { "positive": { "precision": 0.6875, "recall": 0.6875, "f1": 0.6875, "support": 16 }, "negative": { "precision": 0.7059, "recall": 0.75, "f1": 0.7273, "support": 16 }, "neutral": { "precision": 0.6667, "recall": 0.6, "f1": 0.6316, "support": 10 } }, "confusion": { "positive": { "positive": 11, "negative": 4, "neutral": 1 }, "negative": { "positive": 2, "negative": 12, "neutral": 2 }, "neutral": { "positive": 3, "negative": 1, "neutral": 6 } }, "testSize": 42, "errors": [{ "text": "Fed dovish pivot lifts risk assets, Bitcoin rallies hard", "trueLabel": "positive", "predicted": "negative", "confidence": 0.6151 }, { "text": "Macroeconomic tailwinds align beautifully for digital assets", "trueLabel": "positive", "predicted": "neutral", "confidence": 0.5283 }, { "text": "Sentiment turning around, Crypto Twitter optimism is contagious", "trueLabel": "positive", "predicted": "negative", "confidence": 0.8048 }, { "text": "Massive ETF inflows offset miner selling, price holds firm", "trueLabel": "positive", "predicted": "negative", "confidence": 0.552 }, { "text": "Tether market cap grows steadily, liquidity returning to crypto", "trueLabel": "positive", "predicted": "negative", "confidence": 0.6652 }, { "text": "A grim quarterly report shows users abandoning the platform", "trueLabel": "negative", "predicted": "neutral", "confidence": 0.4843 }, { "text": "Liquidations exceed one billion in last 24 hours as longs get rekt", "trueLabel": "negative", "predicted": "neutral", "confidence": 0.5274 }, { "text": "Liquidation cascade triggered after key support breaks decisively", "trueLabel": "negative", "predicted": "positive", "confidence": 0.6777 }, { "text": "Bitcoin dumped 25% in one hour on news of state crackdown", "trueLabel": "negative", "predicted": "positive", "confidence": 0.4894 }, { "text": "Bitcoin closed the day at $65,000, change of less than 1%", "trueLabel": "neutral", "predicted": "positive", "confidence": 0.6619 }, { "text": "The next Bitcoin halving is approximately 90 days away from today", "trueLabel": "neutral", "predicted": "positive", "confidence": 0.9238 }, { "text": "Quiet trading session today across both stocks and crypto markets", "trueLabel": "neutral", "predicted": "positive", "confidence": 0.7361 }, { "text": "Beginner asking what the difference is between coins and tokens", "trueLabel": "neutral", "predicted": "negative", "confidence": 0.6532 }], "vocabSize": 1979, "trainSize": 669, "trainedAt": "2026-05-30T12:48:07.752Z", "algorithm": "multinomial-naive-bayes (distant-supervision: gold=169 + silver=500)", "smoothingAlpha": 1 };
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
  const creditImpact = Math.round(Math.max(-40, Math.min(60, composite * 60)));
  const creditScoreFactor = {
    label: "Social sentiment (alt-data, VADER NLP on HN+Reddit)",
    impact: creditImpact,
    rationale: composite > 0.2 ? "Sustained bullish discourse \u2014 borrower is engaging with healthy market context." : composite < -0.2 ? "Capitulation discourse around held assets \u2014 flag for over-leverage risk." : "Neutral social context \u2014 no adjustment."
  };
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
  return { creditScoreFactor, fraudRule, advisorTilt };
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

// api/_lib/ai/credit.ts
function computeCreditScore(accountId) {
  const acc = getAccount(accountId);
  const txs = acc.transactions;
  const depositCount = txs.filter((t) => t.type === "DEPOSIT").length;
  const tradeCount = txs.filter((t) => t.type === "BUY" || t.type === "SELL").length;
  const realisedPnl = txs.filter((t) => t.type === "SELL").reduce((s, t) => s + t.total, 0) - txs.filter((t) => t.type === "BUY").reduce((s, t) => s + Math.abs(t.total), 0);
  const cashRatio = acc.cashUsd / Math.max(1e6, acc.cashUsd + acc.positions.length * 1e5);
  const mobileSignalSeed = (accountId.charCodeAt(0) || 65) % 30;
  const mobileEngagement = 0.55 + mobileSignalSeed / 100;
  const utilityRegularity = 0.6 + accountId.length * 7 % 30 / 100;
  const factors = [
    {
      key: "deposit_cadence",
      label: "Deposit cadence (alt-data proxy for income stability)",
      impact: Math.min(160, depositCount * 12),
      value: `${depositCount} deposits`
    },
    {
      key: "trading_activity",
      label: "Trading footprint (paper-trade engagement)",
      impact: Math.min(140, tradeCount * 6),
      value: `${tradeCount} trades`
    },
    {
      key: "realised_pnl",
      label: "Realised P&L signal",
      impact: Math.max(-100, Math.min(180, Math.round(realisedPnl / 5e3))),
      value: `${realisedPnl >= 0 ? "+" : ""}$${realisedPnl.toFixed(0)}`
    },
    {
      key: "cash_discipline",
      label: "Cash discipline ratio",
      impact: Math.round(cashRatio * 150),
      value: `${(cashRatio * 100).toFixed(0)}%`
    },
    {
      key: "mobile_alt",
      label: "Mobile usage regularity (alt-data)",
      impact: Math.round(mobileEngagement * 120),
      value: `${(mobileEngagement * 100).toFixed(0)}/100`
    },
    {
      key: "utility_alt",
      label: "Utility-bill payment regularity (alt-data)",
      impact: Math.round(utilityRegularity * 130),
      value: `${(utilityRegularity * 100).toFixed(0)}/100`
    }
  ];
  const baseline = 480;
  const score = Math.max(
    280,
    Math.min(995, baseline + factors.reduce((s, f) => s + f.impact, 0))
  );
  const band = score >= 820 ? "Excellent" : score >= 720 ? "Good" : score >= 600 ? "Fair" : score >= 480 ? "Poor" : "Subprime";
  const marginLoanUsd = band === "Excellent" ? 25e3 : band === "Good" ? 12e3 : band === "Fair" ? 4e3 : band === "Poor" ? 1e3 : 0;
  const recommendation = band === "Excellent" ? "Eligible for Elite margin facility and VIP yield products. Consider enabling 2x margin." : band === "Good" ? "Solid alt-data profile \u2014 unlock Pro tier perks and 12% APY products." : band === "Fair" ? "Build deposit cadence and complete 5 more trades to reach Good band (\u2265720)." : "Increase utility-bill linkage and avoid loss-heavy trades. Education modules will lift score.";
  return {
    accountId,
    score,
    band,
    factors,
    recommendation,
    eligibility: {
      marginLoanVnd: usdToVnd(marginLoanUsd),
      premiumProducts: score >= 720
    },
    asOf: (/* @__PURE__ */ new Date()).toISOString()
  };
}
async function computeCreditScoreWithRealAltData(accountId, proxySymbol = "BTCUSDT") {
  const base = computeCreditScore(accountId);
  try {
    const alt = await getRealSentimentScore(proxySymbol);
    const impact = Math.round(Math.max(-40, Math.min(60, alt.score * 60)));
    const altFactor = {
      key: "sentiment_alt",
      label: `Real-time sentiment context (VADER+CoinGecko on ${proxySymbol})`,
      impact,
      value: `${alt.label} (${(alt.score * 100).toFixed(0)}/100)`
    };
    const factors = [...base.factors, altFactor];
    const baseline = 480;
    const adjustedScore = Math.max(280, Math.min(995, baseline + factors.reduce((s, f) => s + f.impact, 0)));
    const band = adjustedScore >= 820 ? "Excellent" : adjustedScore >= 720 ? "Good" : adjustedScore >= 600 ? "Fair" : adjustedScore >= 480 ? "Poor" : "Subprime";
    const marginLoanUsd = band === "Excellent" ? 25e3 : band === "Good" ? 12e3 : band === "Fair" ? 4e3 : band === "Poor" ? 1e3 : 0;
    return {
      ...base,
      score: adjustedScore,
      band,
      factors,
      eligibility: { marginLoanVnd: usdToVnd(marginLoanUsd), premiumProducts: adjustedScore >= 720 },
      altDataFactor: { score: alt.score, label: alt.label, impact }
    };
  } catch {
    return { ...base, altDataFactor: { score: 0, label: "Neutral", impact: 0 } };
  }
}
var init_credit = __esm({
  "api/_lib/ai/credit.ts"() {
    init_state();
    init_fx();
    init_pipeline();
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
function buildAdvisor(accountId, profile = "BALANCED") {
  const acc = getAccount(accountId);
  const fg = getFearGreed();
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

// api/_lib/routes/ai.ts
var aiRouter;
var init_ai = __esm({
  "api/_lib/routes/ai.ts"() {
    init_dist();
    init_credit();
    init_fraud();
    init_advisor();
    init_altdata();
    init_pipeline();
    init_classifier();
    init_reddit();
    init_hackerNews();
    init_fearGreed();
    init_coingecko();
    aiRouter = new Hono2();
    aiRouter.post("/credit-score", async (c) => {
      const body = await c.req.json().catch(() => ({}));
      if (!body.accountId) return c.json({ error: "accountId required" }, 400);
      return c.json(computeCreditScore(body.accountId));
    });
    aiRouter.post("/fraud-check", async (c) => {
      const body = await c.req.json().catch(() => null);
      if (!body?.accountId || !body.transaction) return c.json({ error: "accountId & transaction required" }, 400);
      return c.json(checkFraud(body.accountId, body.transaction));
    });
    aiRouter.post("/advisor", async (c) => {
      const body = await c.req.json().catch(() => ({}));
      if (!body.accountId) return c.json({ error: "accountId required" }, 400);
      return c.json(buildAdvisor(body.accountId, body.riskProfile || "BALANCED"));
    });
    aiRouter.post("/insight", async (c) => {
      const body = await c.req.json().catch(() => ({}));
      if (!body.symbol) return c.json({ error: "symbol required" }, 400);
      const sym = body.symbol.toUpperCase();
      const sentiment = getSentiment(sym);
      const whale = getWhaleFlow(sym);
      const fg = getFearGreed();
      const blendedSignal = signalFromSentiment(sentiment.score, whale.netFlow24hUsd > 0 ? 5 : -5);
      const confidence = Math.min(
        0.98,
        0.45 + Math.abs(sentiment.score) * 0.35 + (Math.abs(whale.netFlow24hUsd) > 1e6 ? 0.15 : 0)
      );
      const signal = blendedSignal === "BUY" && sentiment.score > 0.5 ? "STRONG_BUY" : blendedSignal === "SELL" && sentiment.score < -0.5 ? "STRONG_SELL" : blendedSignal;
      const narrative = `${sym.replace("USDT", "")} \u2014 Composite AI signal: ${signal} (confidence ${(confidence * 100).toFixed(0)}%). Sentiment is ${sentiment.label.toLowerCase()} (${(sentiment.score * 100).toFixed(0)}/100) across ${sentiment.mentions24h.toLocaleString()} 24h mentions. On-chain whales net ${whale.netFlow24hUsd >= 0 ? "+" : "-"}$${Math.abs(whale.netFlow24hUsd).toLocaleString()} \u2014 ${whale.verdict.toLowerCase()}. Market mood: ${fg.classification} (${fg.value}/100).`;
      return c.json({
        symbol: sym,
        signal,
        confidence: Number(confidence.toFixed(3)),
        sentiment,
        whale,
        fearGreed: fg,
        narrative
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
      return c.json(classify2(body.text));
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
    aiRouter.post("/credit-score-real", async (c) => {
      const body = await c.req.json().catch(() => ({}));
      if (!body.accountId) return c.json({ error: "accountId required" }, 400);
      const result = await computeCreditScoreWithRealAltData(body.accountId, body.proxySymbol || "BTCUSDT");
      return c.json(result);
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
    init_credit();
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
          case "getCreditScore": {
            if (!accountId) throw new Error("accountId required");
            return c.json(computeCreditScore(accountId));
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
              fearGreed: getFearGreed()
            });
          }
          case "getFearGreed":
            return c.json(getFearGreed());
          case "getAdvisor": {
            if (!accountId) throw new Error("accountId required");
            const profile = args.riskProfile || "BALANCED";
            return c.json(buildAdvisor(accountId, profile));
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
            let amountUsd;
            if (args.sellAll === true && side === "SELL") {
              const acc = getAccount(accountId);
              const pos = acc.positions.find((p) => p.symbol === symbol);
              if (!pos || pos.amount <= 0) {
                throw new Error(`B\u1EA1n kh\xF4ng s\u1EDF h\u1EEFu ${symbol.replace("USDT", "")} \u0111\u1EC3 b\xE1n.`);
              }
              amountUsd = pos.amount * price;
            } else if (args.buyAllCash === true && side === "BUY") {
              const acc = getAccount(accountId);
              if (acc.cashUsd <= 0) {
                throw new Error("S\u1ED1 d\u01B0 cash kh\xF4ng \u0111\u1EE7 \u0111\u1EC3 mua.");
              }
              amountUsd = acc.cashUsd / (1 + FEE_RATE);
            } else {
              amountUsd = Number(args.amountUsd ?? (args.amountVnd ? vndToUsd(Number(args.amountVnd)) : 0));
              if (!amountUsd || !Number.isFinite(amountUsd) || amountUsd <= 0) {
                throw new Error("amountUsd, amountVnd, sellAll=true, ho\u1EB7c buyAllCash=true b\u1EAFt bu\u1ED9c");
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

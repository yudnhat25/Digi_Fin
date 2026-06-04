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
  const cutoff = Math.floor(Date.now() / 1e3) - 365 * 24 * 3600;
  url.searchParams.set("numericFilters", `created_at_i>${cutoff}`);
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
    const url = `https://api.stocktwits.com/api/2/streams/symbol/${encodeURIComponent(ticker)}.json`;
    const res = await fetch(url, {
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
    const url = `https://api.alternative.me/fng/?limit=${cappedLimit}&format=json`;
    const res = await fetch(url, { headers: { "User-Agent": USER_AGENT4 } });
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
    const url = `https://api.coingecko.com/api/v3/coins/${coinId}?localization=false&tickers=false&market_data=false&community_data=true&developer_data=true&sparkline=false`;
    const res = await fetch(url, { headers: { "User-Agent": USER_AGENT5, "Accept": "application/json" } });
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
    MODEL = { "version": "2.0.0", "algorithm": "complement-naive-bayes", "smoothingAlpha": 0.3, "classes": ["positive", "negative", "neutral"], "classDocCount": { "positive": 1350, "negative": 1350, "neutral": 1350 }, "classTokenCount": { "positive": 0, "negative": 0, "neutral": 0 }, "logPrior": { "positive": -0.5988, "negative": -0.5988, "neutral": -0.5988 }, "logLikelihood": { "$aabb": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "$aave": { "positive": 3.8255, "negative": 3.6243, "neutral": 3.7568 }, "$aave buy": { "positive": 5.3234, "negative": 5.3754, "neutral": 5.1249 }, "$aave time": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "$ada": { "positive": 3.5724, "negative": 3.6077, "neutral": 3.6363 }, "$ada $xrp": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "$ada charles": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "$ada going": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "$ada huge": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "$aero": { "positive": 5.0125, "negative": 5.0644, "neutral": 5.1249 }, "$aioz": { "positive": 5.3234, "negative": 5.3754, "neutral": 5.1249 }, "$akt": { "positive": 5.3234, "negative": 4.7233, "neutral": 4.9281 }, "$algo": { "positive": 3.9796, "negative": 3.5458, "neutral": 3.6211 }, "$algo $btc": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "$algo $fil": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "$algo $hbar": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "$algo $xrp": { "positive": 6.1227, "negative": 4.8676, "neutral": 4.9281 }, "$algo just": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "$algo nice": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "$amp": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "$apt": { "positive": 3.7743, "negative": 3.3829, "neutral": 3.5377 }, "$apt $btc": { "positive": 5.3234, "negative": 4.8676, "neutral": 5.1249 }, "$apt here": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "$apt nice": { "positive": 6.1227, "negative": 4.7233, "neutral": 4.7838 }, "$apt target": { "positive": 5.0125, "negative": 4.8676, "neutral": 5.4358 }, "$arb": { "positive": 4.0165, "negative": 3.6243, "neutral": 3.6211 }, "$arb $op": { "positive": 5.3234, "negative": 5.0644, "neutral": 4.9281 }, "$arb last": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "$atom": { "positive": 4.0165, "negative": 3.6414, "neutral": 3.7019 }, "$atom re": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "$avax": { "positive": 3.9796, "negative": 3.6591, "neutral": 3.7019 }, "$avax just": { "positive": 5.0125, "negative": 4.8676, "neutral": 5.4358 }, "$avax trending": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "$avt": { "positive": 6.1227, "negative": 4.7233, "neutral": 4.7838 }, "$bch": { "positive": 3.5396, "negative": 3.5759, "neutral": 3.5778 }, "$bch $spermwha": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "$bch crypto": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "$bch nice": { "positive": 6.1227, "negative": 4.7233, "neutral": 4.7838 }, "$bch thing": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "$bch time": { "positive": 4.8157, "negative": 5.3754, "neutral": 5.1249 }, "$bmnr": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "$bnb": { "positive": 4.313, "negative": 3.5915, "neutral": 3.7196 }, "$bnb $btc": { "positive": 6.1227, "negative": 4.6094, "neutral": 4.6698 }, "$bnb $hbar": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "$bnb $uni": { "positive": 5.3234, "negative": 5.3754, "neutral": 5.1249 }, "$bnb nice": { "positive": 6.1227, "negative": 4.8676, "neutral": 4.9281 }, "$bonk": { "positive": 6.1227, "negative": 4.7233, "neutral": 4.7838 }, "$btc": { "positive": 2.9657, "negative": 2.8517, "neutral": 2.815 }, "$btc $bnb": { "positive": 5.3234, "negative": 4.8676, "neutral": 4.7838 }, "$btc $doge": { "positive": 5.0125, "negative": 5.3754, "neutral": 4.9281 }, "$btc $etc": { "positive": 4.8157, "negative": 5.0644, "neutral": 5.4358 }, "$btc $eth": { "positive": 3.9451, "negative": 3.934, "neutral": 3.8399 }, "$btc $mstr": { "positive": 4.8157, "negative": 4.8676, "neutral": 4.7838 }, "$btc $qqq": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "$btc $sol": { "positive": 5.0125, "negative": 4.7233, "neutral": 4.5756 }, "$btc $tia": { "positive": 5.3234, "negative": 4.8676, "neutral": 5.1249 }, "$btc $xrp": { "positive": 5.0125, "negative": 4.8676, "neutral": 5.4358 }, "$btc all": { "positive": 4.6714, "negative": 5.0644, "neutral": 4.7838 }, "$btc aptos": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "$btc bitcoin": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "$btc breaking": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "$btc buy": { "positive": 5.0125, "negative": 5.0644, "neutral": 5.1249 }, "$btc chart": { "positive": 5.0125, "negative": 5.3754, "neutral": 4.9281 }, "$btc crashes": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "$btc dead": { "positive": 5.3234, "negative": 5.3754, "neutral": 5.1249 }, "$btc dominance": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "$btc fundamentals": { "positive": 5.3234, "negative": 5.0644, "neutral": 4.9281 }, "$btc getting": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "$btc here": { "positive": 5.3234, "negative": 4.5152, "neutral": 4.6698 }, "$btc like": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "$btc looks": { "positive": 5.3234, "negative": 4.8676, "neutral": 4.7838 }, "$btc momentum": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "$btc news": { "positive": 4.8157, "negative": 4.8676, "neutral": 6.2351 }, "$btc next": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "$btc still": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "$btc support": { "positive": 5.0125, "negative": 5.3754, "neutral": 4.9281 }, "$btc trading": { "positive": 4.6714, "negative": 4.7233, "neutral": 6.2351 }, "$btc volume": { "positive": 5.3234, "negative": 5.3754, "neutral": 5.1249 }, "$btc weak": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "$chip": { "positive": 5.3234, "negative": 4.7233, "neutral": 4.6698 }, "$cock": { "positive": 6.1227, "negative": 4.8676, "neutral": 4.9281 }, "$coin": { "positive": 5.3234, "negative": 4.6094, "neutral": 4.5756 }, "$comp": { "positive": 5.3234, "negative": 5.3754, "neutral": 5.1249 }, "$cro": { "positive": 6.1227, "negative": 4.3029, "neutral": 4.3634 }, "$cro $bnb": { "positive": 6.1227, "negative": 4.7233, "neutral": 4.7838 }, "$cro $rave": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "$ctx": { "positive": 5.3234, "negative": 4.8676, "neutral": 5.1249 }, "$cxai": { "positive": 5.3234, "negative": 5.0644, "neutral": 4.9281 }, "$darth": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "$dash": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "$dog": { "positive": 6.1227, "negative": 4.8676, "neutral": 4.9281 }, "$dog $shib": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "$doge": { "positive": 3.882, "negative": 3.3513, "neutral": 3.5004 }, "$doge $shib": { "positive": 5.0125, "negative": 4.4349, "neutral": 4.6698 }, "$doge good": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "$doge love": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "$dot": { "positive": 3.7275, "negative": 3.7363, "neutral": 3.5919 }, "$dot trending": { "positive": 6.1227, "negative": 4.7233, "neutral": 4.7838 }, "$dot wow": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "$dsit": { "positive": 5.0125, "negative": 4.8676, "neutral": 5.4358 }, "$ena": { "positive": 6.1227, "negative": 4.8676, "neutral": 4.9281 }, "$epic": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "$etc": { "positive": 3.882, "negative": 3.6591, "neutral": 3.7568 }, "$etc $btc": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "$etc $eth": { "positive": 5.0125, "negative": 4.8676, "neutral": 5.4358 }, "$etc nice": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "$eth": { "positive": 3.1722, "negative": 2.95, "neutral": 2.9772 }, "$eth $ada": { "positive": 5.3234, "negative": 5.3754, "neutral": 5.1249 }, "$eth $bch": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "$eth $btc": { "positive": 5.0125, "negative": 4.8676, "neutral": 4.6698 }, "$eth $dog": { "positive": 6.1227, "negative": 4.8676, "neutral": 4.9281 }, "$eth $doge": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "$eth $etc": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "$eth $hood": { "positive": 5.3234, "negative": 4.8676, "neutral": 5.1249 }, "$eth $sol": { "positive": 4.5575, "negative": 4.5152, "neutral": 4.3634 }, "$eth $tia": { "positive": 5.3234, "negative": 5.3754, "neutral": 5.1249 }, "$eth $uni": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "$eth $xrp": { "positive": 5.0125, "negative": 5.0644, "neutral": 5.1249 }, "$eth all": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "$eth buy": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "$eth chart": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "$eth crashes": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "$eth getting": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "$eth here": { "positive": 5.3234, "negative": 4.5152, "neutral": 4.6698 }, "$eth hits": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "$eth looks": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "$eth momentum": { "positive": 6.1227, "negative": 4.8676, "neutral": 4.9281 }, "$eth news": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "$eth support": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "$eth trading": { "positive": 4.5575, "negative": 4.6094, "neutral": 6.2351 }, "$eth volume": { "positive": 5.3234, "negative": 5.0644, "neutral": 4.9281 }, "$eth weak": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "$fartcoin": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "$fet": { "positive": 4.6714, "negative": 4.4349, "neutral": 4.6698 }, "$fet $render": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "$fida": { "positive": 5.3234, "negative": 4.8676, "neutral": 5.1249 }, "$fil": { "positive": 4.0165, "negative": 3.5606, "neutral": 3.7196 }, "$fil nice": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "$fil scooped": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "$fil storage": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "$fox": { "positive": 5.3234, "negative": 5.3754, "neutral": 5.1249 }, "$ftm": { "positive": 3.9127, "negative": 3.7363, "neutral": 3.7019 }, "$glnk": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "$grass": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "$grt": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "$gwei": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "$hbar": { "positive": 5.0125, "negative": 4.1505, "neutral": 4.1289 }, "$hbar $algo": { "positive": 6.1227, "negative": 4.8676, "neutral": 4.9281 }, "$hbar $avax": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "$hnt": { "positive": 5.0125, "negative": 4.3649, "neutral": 4.5756 }, "$hnt $algo": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "$hood": { "positive": 5.3234, "negative": 4.5152, "neutral": 4.6698 }, "$hood $xrp": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "$hype": { "positive": 5.0125, "negative": 4.4349, "neutral": 4.6698 }, "$icp": { "positive": 4.8157, "negative": 4.3029, "neutral": 4.5756 }, "$inj": { "positive": 3.7275, "negative": 3.1558, "neutral": 3.2928 }, "$inj $nonja": { "positive": 4.5575, "negative": 4.0684, "neutral": 4.3634 }, "$inj goes": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "$inj literally": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "$inj memes": { "positive": 6.1227, "negative": 4.8676, "neutral": 4.9281 }, "$inj moves": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "$inj nice": { "positive": 6.1227, "negative": 4.4349, "neutral": 4.4953 }, "$inj pumping": { "positive": 6.1227, "negative": 4.8676, "neutral": 4.9281 }, "$iren": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "$jasmy": { "positive": 6.1227, "negative": 4.7233, "neutral": 4.7838 }, "$jup": { "positive": 6.1227, "negative": 4.6094, "neutral": 4.6698 }, "$jup strict": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "$jyai": { "positive": 5.3234, "negative": 4.7233, "neutral": 4.6698 }, "$kaio": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "$link": { "positive": 3.882, "negative": 3.6591, "neutral": 3.7568 }, "$link $xrp": { "positive": 5.3234, "negative": 4.8676, "neutral": 5.1249 }, "$ltc": { "positive": 3.882, "negative": 3.5606, "neutral": 3.7196 }, "$ltc new": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "$ltc ready": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "$lunc": { "positive": 6.1227, "negative": 4.7233, "neutral": 4.7838 }, "$lunc wluna": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "$matic": { "positive": 5.3234, "negative": 4.7233, "neutral": 4.9281 }, "$maulcoin": { "positive": 6.1227, "negative": 4.5152, "neutral": 4.5756 }, "$mram": { "positive": 5.3234, "negative": 4.8676, "neutral": 5.1249 }, "$mstr": { "positive": 4.6714, "negative": 4.5152, "neutral": 4.4254 }, "$mu": { "positive": 5.3234, "negative": 5.3754, "neutral": 5.1249 }, "$muln": { "positive": 5.3234, "negative": 4.7233, "neutral": 4.9281 }, "$near": { "positive": 4.1953, "negative": 3.6414, "neutral": 3.8179 }, "$near one": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "$near trending": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "$nonja": { "positive": 4.056, "negative": 3.3312, "neutral": 3.5126 }, "$nonja $inj": { "positive": 4.5575, "negative": 4.3649, "neutral": 4.6698 }, "$nonja moves": { "positive": 5.3234, "negative": 4.8676, "neutral": 5.1249 }, "$nonja one": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "$nonja pumping": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "$nonja starting": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "$nvda": { "positive": 5.3234, "negative": 5.0644, "neutral": 4.9281 }, "$ondo": { "positive": 4.6714, "negative": 4.4349, "neutral": 4.4953 }, "$ondo $near": { "positive": 5.3234, "negative": 4.7233, "neutral": 4.9281 }, "$op": { "positive": 3.9127, "negative": 3.6243, "neutral": 3.6681 }, "$op $arb": { "positive": 5.3234, "negative": 4.8676, "neutral": 4.7838 }, "$op $hnt": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "$op $sui": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "$papl": { "positive": 5.3234, "negative": 4.7233, "neutral": 4.6698 }, "$paw": { "positive": 6.1227, "negative": 4.6094, "neutral": 4.6698 }, "$pengu": { "positive": 5.3234, "negative": 4.7233, "neutral": 4.9281 }, "$pepe": { "positive": 4.313, "negative": 3.6077, "neutral": 3.7379 }, "$pepe $btc": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "$pepe ayyy": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "$pepe cd": { "positive": 6.1227, "negative": 4.2472, "neutral": 4.3077 }, "$pepe make": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "$pol": { "positive": 5.3234, "negative": 4.8676, "neutral": 5.1249 }, "$pol $matic": { "positive": 5.3234, "negative": 4.8676, "neutral": 5.1249 }, "$prime": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "$pump": { "positive": 6.1227, "negative": 4.8676, "neutral": 4.9281 }, "$pypl": { "positive": 6.1227, "negative": 4.8676, "neutral": 4.9281 }, "$qqq": { "positive": 4.6714, "negative": 4.8676, "neutral": 4.9281 }, "$qqq $spy": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "$rari": { "positive": 6.1227, "negative": 4.2472, "neutral": 4.3077 }, "$rari ever": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "$rari million": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "$rari rari": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "$rave": { "positive": 5.0125, "negative": 4.1505, "neutral": 4.3077 }, "$rave $bnb": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "$rave $cro": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "$render": { "positive": 4.056, "negative": 3.4645, "neutral": 3.652 }, "$render ayyy": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "$render great": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "$render nice": { "positive": 6.1227, "negative": 4.8676, "neutral": 4.9281 }, "$retire": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "$rls": { "positive": 5.3234, "negative": 5.3754, "neutral": 5.1249 }, "$roam": { "positive": 5.0125, "negative": 4.6094, "neutral": 4.6698 }, "$rose": { "positive": 6.1227, "negative": 4.8676, "neutral": 4.9281 }, "$shib": { "positive": 4.1448, "negative": 3.6414, "neutral": 3.7196 }, "$shib $pepe": { "positive": 5.3234, "negative": 4.7233, "neutral": 4.9281 }, "$shib $uni": { "positive": 6.1227, "negative": 4.6094, "neutral": 4.6698 }, "$shib $wif": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "$shib gm": { "positive": 6.1227, "negative": 4.6094, "neutral": 4.6698 }, "$shib long": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "$sol": { "positive": 3.2892, "negative": 3.095, "neutral": 3.1554 }, "$sol $bnb": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "$sol $ftm": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "$sol $link": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "$sol $tia": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "$sol $updog": { "positive": 5.0125, "negative": 5.0644, "neutral": 5.1249 }, "$sol $xrp": { "positive": 5.3234, "negative": 5.3754, "neutral": 5.1249 }, "$sol all": { "positive": 4.6714, "negative": 5.3754, "neutral": 4.9281 }, "$sol breaking": { "positive": 6.1227, "negative": 4.8676, "neutral": 4.9281 }, "$sol buy": { "positive": 4.5575, "negative": 5.3754, "neutral": 4.7838 }, "$sol chart": { "positive": 5.3234, "negative": 5.3754, "neutral": 5.1249 }, "$sol getting": { "positive": 4.6714, "negative": 6.1746, "neutral": 4.7838 }, "$sol here": { "positive": 5.3234, "negative": 4.7233, "neutral": 4.9281 }, "$sol it's": { "positive": 5.3234, "negative": 5.3754, "neutral": 5.1249 }, "$sol news": { "positive": 4.8157, "negative": 4.8676, "neutral": 6.2351 }, "$sol support": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "$sol surges": { "positive": 6.1227, "negative": 4.8676, "neutral": 4.9281 }, "$sol trading": { "positive": 4.6714, "negative": 4.7233, "neutral": 6.2351 }, "$sol updog": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "$spermwha": { "positive": 6.1227, "negative": 4.8676, "neutral": 4.9281 }, "$spermwha le": { "positive": 6.1227, "negative": 4.8676, "neutral": 4.9281 }, "$spy": { "positive": 4.3829, "negative": 4.6094, "neutral": 4.4254 }, "$spy $qqq": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "$strk": { "positive": 5.0125, "negative": 4.7233, "neutral": 4.5756 }, "$sui": { "positive": 3.7275, "negative": 3.5458, "neutral": 3.5508 }, "$sui $sui": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "$sui just": { "positive": 4.8157, "negative": 5.3754, "neutral": 5.1249 }, "$sui love": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "$sui sui": { "positive": 4.8157, "negative": 5.3754, "neutral": 4.7838 }, "$sui time": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "$sui trending": { "positive": 5.3234, "negative": 5.3754, "neutral": 5.1249 }, "$tao": { "positive": 5.3234, "negative": 4.5152, "neutral": 4.6698 }, "$tao $render": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "$tel": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "$tia": { "positive": 3.8255, "negative": 3.6414, "neutral": 3.6681 }, "$tia $atom": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "$tia $op": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "$tos": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "$toshi": { "positive": 5.3234, "negative": 4.6094, "neutral": 4.7838 }, "$troll": { "positive": 5.3234, "negative": 4.7233, "neutral": 4.9281 }, "$trx": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "$trx $usdt": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "$tsla": { "positive": 5.3234, "negative": 4.8676, "neutral": 4.7838 }, "$uni": { "positive": 3.9796, "negative": 3.6414, "neutral": 3.7568 }, "$uni $btc": { "positive": 5.3234, "negative": 4.8676, "neutral": 5.1249 }, "$uni $pepe": { "positive": 6.1227, "negative": 4.2472, "neutral": 4.3077 }, "$updog": { "positive": 4.0165, "negative": 3.1014, "neutral": 3.2456 }, "$updog $aave": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "$updog $avax": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "$updog $bnb": { "positive": 5.3234, "negative": 4.8676, "neutral": 5.1249 }, "$updog $etc": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "$updog $render": { "positive": 5.3234, "negative": 4.8676, "neutral": 5.1249 }, "$updog congrats": { "positive": 5.0125, "negative": 4.1505, "neutral": 4.3077 }, "$updog let": { "positive": 6.1227, "negative": 4.8676, "neutral": 4.9281 }, "$updog years": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "$usdt": { "positive": 5.3234, "negative": 5.0644, "neutral": 4.9281 }, "$veil": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "$wif": { "positive": 3.4253, "negative": 3.5458, "neutral": 3.3917 }, "$wif another": { "positive": 4.6714, "negative": 6.1746, "neutral": 4.7838 }, "$wif down": { "positive": 4.5575, "negative": 6.1746, "neutral": 4.6698 }, "$wif going": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "$wif here": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "$wif ing": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "$wif nice": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "$wif no": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "$wif trending": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "$wif yawn": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "$wif yep": { "positive": 4.8157, "negative": 6.1746, "neutral": 4.9281 }, "$wld": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "$wlfi": { "positive": 5.0125, "negative": 4.8676, "neutral": 4.9281 }, "$wyy": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "$xdc": { "positive": 5.3234, "negative": 5.3754, "neutral": 5.1249 }, "$xlm": { "positive": 3.7504, "negative": 3.5314, "neutral": 3.5778 }, "$xlm $hbar": { "positive": 5.0125, "negative": 5.3754, "neutral": 4.9281 }, "$xlm $xrp": { "positive": 5.3234, "negative": 4.8676, "neutral": 5.1249 }, "$xlm here": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "$xlm how": { "positive": 5.0125, "negative": 4.8676, "neutral": 5.4358 }, "$xlm well": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "$xrp": { "positive": 3.5895, "negative": 3.3312, "neutral": 3.3819 }, "$xrp $ada": { "positive": 5.3234, "negative": 5.3754, "neutral": 5.1249 }, "$xrp $algo": { "positive": 6.1227, "negative": 4.7233, "neutral": 4.7838 }, "$xrp $btc": { "positive": 6.1227, "negative": 4.8676, "neutral": 4.9281 }, "$xrp $doge": { "positive": 5.3234, "negative": 5.3754, "neutral": 5.1249 }, "$xrp $fil": { "positive": 6.1227, "negative": 4.8676, "neutral": 4.9281 }, "$xrp $sol": { "positive": 5.0125, "negative": 4.8676, "neutral": 4.9281 }, "$xrp $xlm": { "positive": 5.0125, "negative": 4.8676, "neutral": 4.9281 }, "$xrp god": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "$xtz": { "positive": 5.0125, "negative": 5.3754, "neutral": 4.9281 }, "$zbcn": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "$zec": { "positive": 4.5575, "negative": 4.1079, "neutral": 4.4254 }, "$zec $atom": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "$zk": { "positive": 5.3234, "negative": 5.0644, "neutral": 4.9281 }, "'bitcoin": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "'cz'": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "'ol": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "'ol sh": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "'s": { "positive": 5.3234, "negative": 4.8676, "neutral": 4.7838 }, "aave": { "positive": 5.0125, "negative": 5.3754, "neutral": 4.9281 }, "aax": { "positive": 4.3829, "negative": 5.3754, "neutral": 4.5756 }, "aax crypto": { "positive": 4.8157, "negative": 5.3754, "neutral": 5.1249 }, "aax suspends": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "able": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "abroad": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "absolute": { "positive": 5.0125, "negative": 5.0644, "neutral": 4.7838 }, "absolutely": { "positive": 4.8157, "negative": 6.1746, "neutral": 4.9281 }, "abuse": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "accelerate": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "accelerates": { "positive": 5.3234, "negative": 3.8512, "neutral": 3.8867 }, "accept": { "positive": 4.6714, "negative": 4.6094, "neutral": 4.9281 }, "accept bitcoin": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "accepts": { "positive": 4.6714, "negative": 4.7233, "neutral": 6.2351 }, "accepts bitcoin": { "positive": 4.6714, "negative": 4.7233, "neutral": 6.2351 }, "access": { "positive": 5.0125, "negative": 5.0644, "neutral": 5.1249 }, "accidentally": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "account": { "positive": 4.1953, "negative": 4.3649, "neutral": 4.3077 }, "account hacked": { "positive": 4.8157, "negative": 6.1746, "neutral": 4.9281 }, "accounting": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "accounts": { "positive": 4.4632, "negative": 5.3754, "neutral": 4.6698 }, "accumulate": { "positive": 6.1227, "negative": 4.5152, "neutral": 4.5756 }, "accumulated": { "positive": 6.1227, "negative": 4.8676, "neutral": 4.9281 }, "accumulating": { "positive": 5.3234, "negative": 2.9699, "neutral": 3.0253 }, "accumulating $btc": { "positive": 6.1227, "negative": 4.7233, "neutral": 4.7838 }, "accumulating $eth": { "positive": 6.1227, "negative": 4.6094, "neutral": 4.6698 }, "accumulating $sol": { "positive": 6.1227, "negative": 4.8676, "neutral": 4.9281 }, "accumulating altcoins": { "positive": 6.1227, "negative": 4.7233, "neutral": 4.7838 }, "accumulating avax": { "positive": 6.1227, "negative": 4.8676, "neutral": 4.9281 }, "accumulating bitcoin": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "accumulating bnb": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "accumulating btc": { "positive": 6.1227, "negative": 4.8676, "neutral": 4.9281 }, "accumulating cardano": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "accumulating doge": { "positive": 6.1227, "negative": 4.6094, "neutral": 4.6698 }, "accumulating eth": { "positive": 6.1227, "negative": 4.7233, "neutral": 4.7838 }, "accumulating link": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "accumulating market": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "accumulating ripple": { "positive": 6.1227, "negative": 4.8676, "neutral": 4.9281 }, "accumulating sol": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "accumulating solana": { "positive": 6.1227, "negative": 4.7233, "neutral": 4.7838 }, "accumulating xrp": { "positive": 6.1227, "negative": 4.8676, "neutral": 4.9281 }, "accumulation": { "positive": 6.1227, "negative": 4.3649, "neutral": 4.4254 }, "accumulation phase": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "accurate": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "accuses": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "acquire": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "acquires": { "positive": 4.6714, "negative": 4.7233, "neutral": 6.2351 }, "across": { "positive": 4.3829, "negative": 4.3649, "neutral": 4.6698 }, "act": { "positive": 4.5575, "negative": 4.4349, "neutral": 4.5756 }, "action": { "positive": 4.3829, "negative": 4.6094, "neutral": 4.3077 }, "active": { "positive": 5.0125, "negative": 5.0644, "neutral": 5.1249 }, "activity": { "positive": 4.4632, "negative": 4.3649, "neutral": 4.7838 }, "actor": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "actual": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "actually": { "positive": 4.5575, "negative": 4.6094, "neutral": 4.4254 }, "ad": { "positive": 4.6714, "negative": 5.0644, "neutral": 5.1249 }, "ada": { "positive": 3.4795, "negative": 3.5314, "neutral": 3.5641 }, "ada all": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "ada breaking": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "ada buy": { "positive": 4.8157, "negative": 5.3754, "neutral": 5.1249 }, "ada chart": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "ada crashes": { "positive": 4.8157, "negative": 6.1746, "neutral": 4.9281 }, "ada fundamentals": { "positive": 5.3234, "negative": 5.0644, "neutral": 4.9281 }, "ada getting": { "positive": 4.6714, "negative": 6.1746, "neutral": 4.7838 }, "ada news": { "positive": 4.5575, "negative": 4.6094, "neutral": 6.2351 }, "ada smart": { "positive": 6.1227, "negative": 4.8676, "neutral": 4.9281 }, "ada support": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "ada trading": { "positive": 4.5575, "negative": 4.6094, "neutral": 6.2351 }, "ada volume": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "ada weak": { "positive": 4.8157, "negative": 6.1746, "neutral": 4.9281 }, "add": { "positive": 4.5575, "negative": 4.1967, "neutral": 4.4254 }, "added": { "positive": 4.313, "negative": 4.1967, "neutral": 4.6698 }, "added some": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "adding": { "positive": 6.1227, "negative": 4.7233, "neutral": 4.7838 }, "addresses": { "positive": 4.6714, "negative": 4.8676, "neutral": 5.4358 }, "adds": { "positive": 5.3234, "negative": 4.8676, "neutral": 5.1249 }, "administration": { "positive": 4.5575, "negative": 4.6094, "neutral": 5.1249 }, "admits": { "positive": 5.0125, "negative": 5.0644, "neutral": 5.1249 }, "admits stablecoin": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "adopt": { "positive": 4.8157, "negative": 5.3754, "neutral": 5.1249 }, "adoption": { "positive": 6.1227, "negative": 3.3938, "neutral": 3.4543 }, "adoption hit": { "positive": 6.1227, "negative": 4.2472, "neutral": 4.3077 }, "adoption metrics": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "ads": { "positive": 4.6714, "negative": 5.3754, "neutral": 4.9281 }, "advice": { "positive": 4.8157, "negative": 4.8676, "neutral": 4.7838 }, "advisor": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "aergo": { "positive": 6.1227, "negative": 4.8676, "neutral": 4.9281 }, "af": { "positive": 6.1227, "negative": 4.1967, "neutral": 4.2572 }, "af cd": { "positive": 6.1227, "negative": 4.2472, "neutral": 4.3077 }, "affected": { "positive": 4.8157, "negative": 5.3754, "neutral": 5.1249 }, "afford": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "afkcdbxdsaymexo": { "positive": 5.0125, "negative": 4.8676, "neutral": 5.4358 }, "afkcdbxdsaymexo vsfvprv": { "positive": 5.0125, "negative": 4.8676, "neutral": 5.4358 }, "africa": { "positive": 4.8157, "negative": 4.6094, "neutral": 4.7838 }, "african": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "again": { "positive": 3.8255, "negative": 3.8023, "neutral": 3.7379 }, "age": { "positive": 5.0125, "negative": 4.8676, "neutral": 5.4358 }, "agent": { "positive": 4.3829, "negative": 4.4349, "neutral": 5.1249 }, "agentic": { "positive": 4.8157, "negative": 4.7233, "neutral": 5.4358 }, "agents": { "positive": 4.0986, "negative": 4.1967, "neutral": 4.6698 }, "aggregator": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "ago": { "positive": 4.6714, "negative": 4.7233, "neutral": 4.5756 }, "agree": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "agreed": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "agrees": { "positive": 5.3234, "negative": 5.3754, "neutral": 5.1249 }, "ahead": { "positive": 4.6714, "negative": 4.8676, "neutral": 4.6698 }, "ai": { "positive": 3.111, "negative": 3.2323, "neutral": 3.525 }, "ai agent": { "positive": 4.4632, "negative": 4.5152, "neutral": 5.1249 }, "ai agentic": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "ai agents": { "positive": 4.313, "negative": 4.3649, "neutral": 4.7838 }, "ai data": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "ai generated": { "positive": 4.6714, "negative": 4.8676, "neutral": 5.4358 }, "ai infrastructure": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "ai powered": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "ai stocks": { "positive": 4.0165, "negative": 6.1746, "neutral": 4.1289 }, "ai tool": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "aih": { "positive": 5.3234, "negative": 4.5152, "neutral": 4.4953 }, "aih mn": { "positive": 5.3234, "negative": 4.5152, "neutral": 4.4953 }, "aim": { "positive": 5.0125, "negative": 5.3754, "neutral": 4.9281 }, "aims": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "ain't": { "positive": 5.3234, "negative": 5.3754, "neutral": 5.1249 }, "air": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "alert": { "positive": 5.3234, "negative": 4.2472, "neutral": 4.3634 }, "alert multiple": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "alert top": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "algo": { "positive": 4.6714, "negative": 4.8676, "neutral": 5.4358 }, "algorand": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "algorithm": { "positive": 5.0125, "negative": 5.0644, "neutral": 5.1249 }, "algorithms": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "alive": { "positive": 5.0125, "negative": 5.0644, "neutral": 5.1249 }, "all": { "positive": 2.8511, "negative": 2.8768, "neutral": 2.7181 }, "all afford": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "all chart": { "positive": 4.6714, "negative": 6.1746, "neutral": 4.7838 }, "all crypto": { "positive": 4.5575, "negative": 5.3754, "neutral": 4.7838 }, "all day": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "all digital": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "all fundamentals": { "positive": 4.3829, "negative": 6.1746, "neutral": 4.4953 }, "all gains": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "all gd": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "all going": { "positive": 5.3234, "negative": 5.3754, "neutral": 5.1249 }, "all hype": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "all ing": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "all looks": { "positive": 4.251, "negative": 6.1746, "neutral": 4.3634 }, "all money": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "all need": { "positive": 5.3234, "negative": 5.3754, "neutral": 5.1249 }, "all other": { "positive": 5.3234, "negative": 5.3754, "neutral": 5.1249 }, "all over": { "positive": 5.3234, "negative": 5.3754, "neutral": 5.1249 }, "all roads": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "all support": { "positive": 4.0986, "negative": 6.1746, "neutral": 4.211 }, "all think": { "positive": 4.056, "negative": 4.1079, "neutral": 6.2351 }, "all time": { "positive": 4.6714, "negative": 3.3312, "neutral": 3.3917 }, "all trend": { "positive": 4.313, "negative": 6.1746, "neutral": 4.4254 }, "all volume": { "positive": 4.251, "negative": 6.1746, "neutral": 4.3634 }, "all way": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "all week": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "allegations": { "positive": 4.8157, "negative": 6.1746, "neutral": 4.9281 }, "alleged": { "positive": 4.5575, "negative": 6.1746, "neutral": 4.6698 }, "alleged crypto": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "allegedly": { "positive": 4.8157, "negative": 5.3754, "neutral": 5.1249 }, "allowed": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "almost": { "positive": 4.4632, "negative": 4.5152, "neutral": 4.4254 }, "almost every": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "alone": { "positive": 5.3234, "negative": 5.3754, "neutral": 5.1249 }, "alpha": { "positive": 4.8157, "negative": 5.0644, "neutral": 5.4358 }, "already": { "positive": 4.313, "negative": 4.4349, "neutral": 4.2572 }, "already ing": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "alright": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "also": { "positive": 4.5575, "negative": 4.2472, "neutral": 4.2572 }, "alt": { "positive": 5.0125, "negative": 4.3029, "neutral": 4.2572 }, "alt coin": { "positive": 6.1227, "negative": 4.7233, "neutral": 4.7838 }, "alt coins": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "alt season": { "positive": 5.3234, "negative": 5.0644, "neutral": 4.9281 }, "altcoin": { "positive": 4.056, "negative": 4.1505, "neutral": 4.6698 }, "altcoin exchange": { "positive": 4.6714, "negative": 5.0644, "neutral": 5.1249 }, "altcoins": { "positive": 3.5396, "negative": 3.4645, "neutral": 3.525 }, "altcoins all": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "altcoins chart": { "positive": 5.3234, "negative": 5.3754, "neutral": 5.1249 }, "altcoins crashes": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "altcoins getting": { "positive": 4.8157, "negative": 6.1746, "neutral": 4.9281 }, "altcoins here": { "positive": 6.1227, "negative": 4.7233, "neutral": 4.7838 }, "altcoins mine": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "altcoins news": { "positive": 4.5575, "negative": 4.6094, "neutral": 6.2351 }, "altcoins surges": { "positive": 6.1227, "negative": 4.7233, "neutral": 4.7838 }, "altcoins trading": { "positive": 4.8157, "negative": 4.8676, "neutral": 6.2351 }, "altcoins volume": { "positive": 5.0125, "negative": 5.3754, "neutral": 4.9281 }, "altering": { "positive": 4.1953, "negative": 4.3649, "neutral": 5.1249 }, "altering data": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "alternative": { "positive": 4.8157, "negative": 4.8676, "neutral": 6.2351 }, "although": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "alts": { "positive": 4.5575, "negative": 4.2472, "neutral": 4.3634 }, "altseason": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "always": { "positive": 4.6714, "negative": 4.1967, "neutral": 4.092 }, "always great": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "am": { "positive": 4.5575, "negative": 4.1505, "neutral": 4.3634 }, "am building": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "ama": { "positive": 3.9127, "negative": 3.9646, "neutral": 6.2351 }, "ama scheduled": { "positive": 3.9451, "negative": 3.997, "neutral": 6.2351 }, "amazing": { "positive": 5.3234, "negative": 4.3649, "neutral": 4.4953 }, "amazon": { "positive": 4.8157, "negative": 5.0644, "neutral": 4.9281 }, "america": { "positive": 4.8157, "negative": 5.3754, "neutral": 5.1249 }, "american": { "positive": 5.0125, "negative": 5.0644, "neutral": 5.1249 }, "americans": { "positive": 4.8157, "negative": 6.1746, "neutral": 4.9281 }, "amid": { "positive": 4.3829, "negative": 4.8676, "neutral": 4.5756 }, "amid crypto": { "positive": 5.3234, "negative": 5.3754, "neutral": 5.1249 }, "amount": { "positive": 4.8157, "negative": 4.8676, "neutral": 5.1249 }, "ams": { "positive": 6.1227, "negative": 4.5152, "neutral": 4.5756 }, "analysis": { "positive": 4.3829, "negative": 4.3649, "neutral": 4.3634 }, "analysts": { "positive": 5.3234, "negative": 5.0644, "neutral": 4.9281 }, "anarchist": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "anatomy": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "android": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "angel": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "announced": { "positive": 4.6714, "negative": 4.0315, "neutral": 4.0251 }, "announced crackdown": { "positive": 4.8157, "negative": 6.1746, "neutral": 4.9281 }, "announcement": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "announces": { "positive": 4.313, "negative": 4.3649, "neutral": 4.4254 }, "announces pipe": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "anonymous": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "another": { "positive": 3.853, "negative": 4.1967, "neutral": 3.7568 }, "another day": { "positive": 4.4632, "negative": 5.3754, "neutral": 4.6698 }, "another dump": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "any": { "positive": 3.5895, "negative": 3.6414, "neutral": 4.1289 }, "any better": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "any other": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "any update": { "positive": 3.9451, "negative": 3.997, "neutral": 6.2351 }, "anymore": { "positive": 4.8157, "negative": 5.0644, "neutral": 4.6698 }, "anyone": { "positive": 3.8255, "negative": 4.3649, "neutral": 3.8867 }, "anyone still": { "positive": 4.0165, "negative": 6.1746, "neutral": 4.1289 }, "anyway": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "aomst": { "positive": 6.1227, "negative": 4.8676, "neutral": 4.9281 }, "aomst pxyakyuvwwzt": { "positive": 6.1227, "negative": 4.8676, "neutral": 4.9281 }, "apecoin": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "api": { "positive": 4.6714, "negative": 4.8676, "neutral": 5.4358 }, "apis": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "app": { "positive": 4.0986, "negative": 4.1505, "neutral": 4.7838 }, "app store": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "appears": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "appetite": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "apple": { "positive": 4.3829, "negative": 4.7233, "neutral": 4.9281 }, "approval": { "positive": 6.1227, "negative": 3.9646, "neutral": 4.0251 }, "approval landed": { "positive": 6.1227, "negative": 4.1505, "neutral": 4.211 }, "approves": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "apps": { "positive": 4.5575, "negative": 4.7233, "neutral": 5.4358 }, "april": { "positive": 5.0125, "negative": 4.8676, "neutral": 4.9281 }, "aptos": { "positive": 4.8157, "negative": 4.3649, "neutral": 4.6698 }, "ar": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "arb": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "arbitrage": { "positive": 5.3234, "negative": 4.8676, "neutral": 5.1249 }, "arbitrum": { "positive": 5.3234, "negative": 4.8676, "neutral": 4.7838 }, "architecture": { "positive": 4.4632, "negative": 4.6094, "neutral": 5.4358 }, "area": { "positive": 5.3234, "negative": 5.0644, "neutral": 4.9281 }, "argentina": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "around": { "positive": 3.0001, "negative": 3.0289, "neutral": 4.4254 }, "around right": { "positive": 3.0242, "negative": 3.0761, "neutral": 6.2351 }, "arrest": { "positive": 4.4632, "negative": 6.1746, "neutral": 4.5756 }, "arrested": { "positive": 3.9796, "negative": 6.1746, "neutral": 4.092 }, "arrested allegedly": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "arrive": { "positive": 5.3234, "negative": 5.3754, "neutral": 5.1249 }, "arrogant": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "art": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "artificial": { "positive": 5.0125, "negative": 4.6094, "neutral": 4.9281 }, "artificial intelligence": { "positive": 5.0125, "negative": 4.6094, "neutral": 4.9281 }, "asia": { "positive": 4.5575, "negative": 5.0644, "neutral": 4.6698 }, "asic": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "asics": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "ask": { "positive": 3.3202, "negative": 3.4645, "neutral": 4.1289 }, "ask hn": { "positive": 3.3419, "negative": 3.5037, "neutral": 4.2572 }, "asked": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "asks": { "positive": 5.3234, "negative": 5.3754, "neutral": 5.1249 }, "ass": { "positive": 5.0125, "negative": 5.3754, "neutral": 4.9281 }, "asset": { "positive": 5.3234, "negative": 4.5152, "neutral": 4.6698 }, "assets": { "positive": 4.3829, "negative": 4.2472, "neutral": 4.2572 }, "assets pdf": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "assistant": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "asteroid's": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "ath": { "positive": 6.1227, "negative": 4.0315, "neutral": 4.092 }, "atl": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "atm": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "atms": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "atom": { "positive": 5.3234, "negative": 4.6094, "neutral": 4.7838 }, "attack": { "positive": 4.313, "negative": 4.5152, "neutral": 5.1249 }, "attacker": { "positive": 5.0125, "negative": 5.3754, "neutral": 4.9281 }, "attackers": { "positive": 4.8157, "negative": 6.1746, "neutral": 4.9281 }, "attacks": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "attention": { "positive": 5.0125, "negative": 5.3754, "neutral": 4.9281 }, "attention matter": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "audit": { "positive": 4.5575, "negative": 4.8676, "neutral": 5.1249 }, "audit failed": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "auditor": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "authorities": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "auto": { "positive": 4.8157, "negative": 4.8676, "neutral": 6.2351 }, "automated": { "positive": 5.0125, "negative": 4.8676, "neutral": 5.4358 }, "autonomous": { "positive": 4.8157, "negative": 4.8676, "neutral": 6.2351 }, "available": { "positive": 4.6714, "negative": 4.7233, "neutral": 6.2351 }, "avalanche": { "positive": 5.3234, "negative": 5.3754, "neutral": 5.1249 }, "avax": { "positive": 3.7275, "negative": 3.6414, "neutral": 3.6681 }, "avax all": { "positive": 4.8157, "negative": 6.1746, "neutral": 4.9281 }, "avax breaking": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "avax chart": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "avax crashes": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "avax fundamentals": { "positive": 5.3234, "negative": 5.3754, "neutral": 5.1249 }, "avax getting": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "avax here": { "positive": 5.3234, "negative": 4.7233, "neutral": 4.9281 }, "avax news": { "positive": 4.8157, "negative": 4.8676, "neutral": 6.2351 }, "avax smart": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "avax support": { "positive": 5.3234, "negative": 5.0644, "neutral": 4.9281 }, "avax trading": { "positive": 4.6714, "negative": 4.7233, "neutral": 6.2351 }, "avax weak": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "average": { "positive": 5.3234, "negative": 4.8676, "neutral": 4.7838 }, "avg": { "positive": 5.3234, "negative": 4.8676, "neutral": 4.7838 }, "away": { "positive": 4.1448, "negative": 4.4349, "neutral": 4.4254 }, "awesome": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "awhile": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "aws": { "positive": 4.3829, "negative": 4.7233, "neutral": 4.9281 }, "ayyy": { "positive": 4.6714, "negative": 4.3029, "neutral": 4.6698 }, "ayyy trending": { "positive": 4.6714, "negative": 4.3649, "neutral": 4.7838 }, "ba": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "ba cbedd": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "babies": { "positive": 5.0125, "negative": 4.7233, "neutral": 5.1249 }, "baby": { "positive": 5.0125, "negative": 4.6094, "neutral": 4.9281 }, "back": { "positive": 3.4939, "negative": 3.3214, "neutral": 3.4768 }, "back $updog": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "back down": { "positive": 4.8157, "negative": 6.1746, "neutral": 4.9281 }, "back over": { "positive": 5.3234, "negative": 4.8676, "neutral": 5.1249 }, "back rich": { "positive": 6.1227, "negative": 4.8676, "neutral": 4.9281 }, "back soon": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "back up": { "positive": 5.0125, "negative": 4.6094, "neutral": 4.9281 }, "back updog": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "backdoored": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "backed": { "positive": 4.313, "negative": 4.3649, "neutral": 5.1249 }, "backed crypto": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "backs": { "positive": 4.8157, "negative": 5.0644, "neutral": 5.4358 }, "bad": { "positive": 4.1448, "negative": 4.8676, "neutral": 4.1289 }, "bad debt": { "positive": 5.3234, "negative": 5.3754, "neutral": 5.1249 }, "bag": { "positive": 4.8157, "negative": 4.8676, "neutral": 4.7838 }, "bags": { "positive": 5.3234, "negative": 4.8676, "neutral": 4.7838 }, "ban": { "positive": 3.4795, "negative": 6.1746, "neutral": 3.5919 }, "ban all": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "ban bitcoin": { "positive": 4.6714, "negative": 6.1746, "neutral": 4.7838 }, "ban crypto": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "ban cryptocurrencies": { "positive": 4.8157, "negative": 6.1746, "neutral": 4.9281 }, "ban cryptocurrency": { "positive": 4.4632, "negative": 6.1746, "neutral": 4.5756 }, "ban penalising": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "bandwidth": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "bank": { "positive": 4.0165, "negative": 4.2472, "neutral": 4.4254 }, "banking": { "positive": 4.313, "negative": 4.5152, "neutral": 5.1249 }, "bankman": { "positive": 4.5575, "negative": 5.0644, "neutral": 4.9281 }, "bankman fried": { "positive": 4.6714, "negative": 5.3754, "neutral": 4.9281 }, "bankrupt": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "bankruptcy": { "positive": 4.056, "negative": 6.1746, "neutral": 4.1684 }, "bankruptcy wipe": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "banks": { "positive": 4.6714, "negative": 4.3649, "neutral": 4.7838 }, "banks working": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "banned": { "positive": 4.4632, "negative": 6.1746, "neutral": 4.5756 }, "banning": { "positive": 4.3829, "negative": 6.1746, "neutral": 4.4953 }, "banning politics": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "bans": { "positive": 4.8157, "negative": 5.3754, "neutral": 5.1249 }, "barely": { "positive": 6.1227, "negative": 4.7233, "neutral": 4.7838 }, "barely million": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "barrier": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "base": { "positive": 4.8157, "negative": 4.6094, "neutral": 4.5756 }, "based": { "positive": 3.9451, "negative": 4.3029, "neutral": 4.3634 }, "basically": { "positive": 5.3234, "negative": 5.3754, "neutral": 5.1249 }, "battle": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "bc": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "bch": { "positive": 5.3234, "negative": 5.0644, "neutral": 4.9281 }, "beanstalk": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "bear": { "positive": 3.5895, "negative": 5.0644, "neutral": 3.6681 }, "bear cycle": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "bear flag": { "positive": 4.8157, "negative": 6.1746, "neutral": 4.9281 }, "bear market": { "positive": 3.9451, "negative": 5.0644, "neutral": 3.9944 }, "bear trap": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "bearing": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "bearish": { "positive": 3.4384, "negative": 5.0644, "neutral": 3.525 }, "bearish $btc": { "positive": 4.6714, "negative": 6.1746, "neutral": 4.7838 }, "bearish ada": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "bearish altcoins": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "bearish bnb": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "bearish btc": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "bearish crypto": { "positive": 4.8157, "negative": 6.1746, "neutral": 4.9281 }, "bearish sol": { "positive": 4.8157, "negative": 6.1746, "neutral": 4.9281 }, "bearish solana": { "positive": 4.6714, "negative": 6.1746, "neutral": 4.7838 }, "bearish xrp": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "bears": { "positive": 4.056, "negative": 5.0644, "neutral": 4.092 }, "beat": { "positive": 6.1227, "negative": 4.7233, "neutral": 4.7838 }, "beats": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "beautiful": { "positive": 6.1227, "negative": 4.4349, "neutral": 4.4953 }, "became": { "positive": 4.6714, "negative": 4.8676, "neutral": 5.4358 }, "because": { "positive": 4.8157, "negative": 4.8676, "neutral": 4.7838 }, "because going": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "become": { "positive": 4.8157, "negative": 4.7233, "neutral": 5.4358 }, "becomes": { "positive": 4.6714, "negative": 4.7233, "neutral": 5.1249 }, "becomes first": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "begin": { "positive": 5.3234, "negative": 4.8676, "neutral": 4.7838 }, "beginners": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "begins": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "behind": { "positive": 4.4632, "negative": 4.6094, "neutral": 4.3634 }, "behind earlier": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "beijing": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "believe": { "positive": 4.8157, "negative": 4.3649, "neutral": 4.4953 }, "benchmarks": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "bend": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "best": { "positive": 6.1227, "negative": 3.428, "neutral": 3.4885 }, "best all": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "best altcoins": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "best community": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "best crypto": { "positive": 6.1227, "negative": 4.6094, "neutral": 4.6698 }, "best cryptocurrency": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "best month": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "best performing": { "positive": 6.1227, "negative": 4.8676, "neutral": 4.9281 }, "bet": { "positive": 5.0125, "negative": 5.0644, "neutral": 4.7838 }, "bets": { "positive": 6.1227, "negative": 4.7233, "neutral": 4.7838 }, "better": { "positive": 4.5575, "negative": 3.8512, "neutral": 3.7968 }, "better know": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "better right": { "positive": 5.3234, "negative": 5.3754, "neutral": 5.1249 }, "better start": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "better than": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "betterment": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "beware": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "beyond": { "positive": 4.5575, "negative": 4.8676, "neutral": 5.1249 }, "bid": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "bidding": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "big": { "positive": 4.056, "negative": 3.905, "neutral": 3.7968 }, "big bear": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "big bitcoin": { "positive": 5.3234, "negative": 5.3754, "neutral": 5.1249 }, "big time": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "bigger": { "positive": 5.0125, "negative": 4.7233, "neutral": 4.7838 }, "bigger than": { "positive": 5.0125, "negative": 5.0644, "neutral": 5.1249 }, "biggest": { "positive": 4.0986, "negative": 4.1967, "neutral": 4.1684 }, "biggest ponzi": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "biggest stablecoin": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "bill": { "positive": 4.251, "negative": 4.3029, "neutral": 4.211 }, "bill incoming": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "billion": { "positive": 4.313, "negative": 4.4349, "neutral": 4.092 }, "billion dollar": { "positive": 5.3234, "negative": 5.3754, "neutral": 5.1249 }, "billions": { "positive": 5.0125, "negative": 5.0644, "neutral": 4.7838 }, "binance": { "positive": 2.8932, "negative": 3.4903, "neutral": 3.2091 }, "binance admits": { "positive": 5.3234, "negative": 5.3754, "neutral": 5.1249 }, "binance ceo": { "positive": 4.5575, "negative": 6.1746, "neutral": 4.6698 }, "binance chain": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "binance cz": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "binance founder": { "positive": 4.1953, "negative": 4.8676, "neutral": 4.4953 }, "binance halts": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "binance says": { "positive": 4.3829, "negative": 4.6094, "neutral": 5.1249 }, "binance smart": { "positive": 4.8157, "negative": 6.1746, "neutral": 4.9281 }, "binance temporarily": { "positive": 4.5575, "negative": 6.1746, "neutral": 4.6698 }, "binance's": { "positive": 4.3829, "negative": 4.8676, "neutral": 4.5756 }, "bit": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "bitcoin": { "positive": 2.4124, "negative": 2.568, "neutral": 2.6358 }, "bitcoin all": { "positive": 5.0125, "negative": 5.3754, "neutral": 4.9281 }, "bitcoin altcoin": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "bitcoin atm": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "bitcoin best": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "bitcoin bitcoin": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "bitcoin blockchain": { "positive": 4.4632, "negative": 4.6094, "neutral": 5.4358 }, "bitcoin boom": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "bitcoin breaking": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "bitcoin btc": { "positive": 6.1227, "negative": 4.8676, "neutral": 4.9281 }, "bitcoin bubble": { "positive": 4.8157, "negative": 6.1746, "neutral": 4.9281 }, "bitcoin buy": { "positive": 5.0125, "negative": 5.0644, "neutral": 5.1249 }, "bitcoin cash": { "positive": 5.0125, "negative": 5.0644, "neutral": 5.1249 }, "bitcoin ceo": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "bitcoin coming": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "bitcoin crashes": { "positive": 4.6714, "negative": 6.1746, "neutral": 4.7838 }, "bitcoin crypto": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "bitcoin depot": { "positive": 4.8157, "negative": 6.1746, "neutral": 4.9281 }, "bitcoin etf": { "positive": 5.3234, "negative": 4.7233, "neutral": 4.6698 }, "bitcoin ethereum": { "positive": 4.6714, "negative": 5.3754, "neutral": 4.6698 }, "bitcoin exchange": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "bitcoin futures": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "bitcoin halving": { "positive": 5.0125, "negative": 4.8676, "neutral": 5.4358 }, "bitcoin here": { "positive": 5.3234, "negative": 4.8676, "neutral": 5.1249 }, "bitcoin it's": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "bitcoin mine": { "positive": 4.8157, "negative": 5.0644, "neutral": 5.4358 }, "bitcoin miners": { "positive": 4.8157, "negative": 5.0644, "neutral": 5.4358 }, "bitcoin mining": { "positive": 3.1804, "negative": 3.428, "neutral": 3.5377 }, "bitcoin mixing": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "bitcoin news": { "positive": 4.6714, "negative": 4.7233, "neutral": 6.2351 }, "bitcoin only": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "bitcoin other": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "bitcoin payments": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "bitcoin price": { "positive": 4.6714, "negative": 5.3754, "neutral": 4.9281 }, "bitcoin rallies": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "bitcoin smart": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "bitcoin surges": { "positive": 5.3234, "negative": 4.4349, "neutral": 4.5756 }, "bitcoin trading": { "positive": 4.5575, "negative": 4.6094, "neutral": 6.2351 }, "bitcoin tumbles": { "positive": 4.8157, "negative": 6.1746, "neutral": 4.9281 }, "bitcoin using": { "positive": 4.8157, "negative": 5.3754, "neutral": 5.1249 }, "bitcoin volume": { "positive": 5.3234, "negative": 5.3754, "neutral": 5.1249 }, "bitcoin's": { "positive": 4.8157, "negative": 4.6094, "neutral": 5.1249 }, "bitcoins": { "positive": 4.1448, "negative": 4.8676, "neutral": 4.4254 }, "bitcoins stolen": { "positive": 4.8157, "negative": 6.1746, "neutral": 4.9281 }, "bitfinex": { "positive": 4.8157, "negative": 5.3754, "neutral": 5.1249 }, "bithumb": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "bittrex": { "positive": 4.6714, "negative": 5.3754, "neutral": 4.9281 }, "black": { "positive": 6.1227, "negative": 4.8676, "neutral": 4.9281 }, "black rock": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "blackrock": { "positive": 5.3234, "negative": 4.7233, "neutral": 4.9281 }, "blame": { "positive": 5.0125, "negative": 5.0644, "neutral": 5.1249 }, "bleed": { "positive": 5.3234, "negative": 5.3754, "neutral": 5.1249 }, "block": { "positive": 4.5575, "negative": 4.7233, "neutral": 5.4358 }, "block chain": { "positive": 4.8157, "negative": 4.8676, "neutral": 6.2351 }, "blockchain": { "positive": 2.9657, "negative": 3.1558, "neutral": 3.5377 }, "blockchain based": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "blockchain bridge": { "positive": 4.8157, "negative": 6.1746, "neutral": 4.9281 }, "blockchain implementation": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "blockchain technology": { "positive": 5.0125, "negative": 4.8676, "neutral": 5.4358 }, "blockchains": { "positive": 4.1953, "negative": 4.3029, "neutral": 4.4953 }, "blockchains stablecoins": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "blocked": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "blocks": { "positive": 4.8157, "negative": 4.7233, "neutral": 5.4358 }, "blog": { "positive": 4.8157, "negative": 5.3754, "neutral": 5.1249 }, "bloomberg": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "blow": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "blow global": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "bnb": { "positive": 3.4253, "negative": 3.6414, "neutral": 3.5778 }, "bnb all": { "positive": 4.5575, "negative": 6.1746, "neutral": 4.6698 }, "bnb buy": { "positive": 4.8157, "negative": 5.3754, "neutral": 5.1249 }, "bnb crashes": { "positive": 4.8157, "negative": 6.1746, "neutral": 4.9281 }, "bnb fundamentals": { "positive": 5.3234, "negative": 5.3754, "neutral": 5.1249 }, "bnb here": { "positive": 5.3234, "negative": 4.8676, "neutral": 5.1249 }, "bnb news": { "positive": 4.6714, "negative": 4.7233, "neutral": 6.2351 }, "bnb support": { "positive": 5.0125, "negative": 5.3754, "neutral": 4.9281 }, "bnb trading": { "positive": 4.3829, "negative": 4.4349, "neutral": 6.2351 }, "bnb volume": { "positive": 5.3234, "negative": 5.3754, "neutral": 5.1249 }, "bnb weak": { "positive": 4.8157, "negative": 6.1746, "neutral": 4.9281 }, "board": { "positive": 4.6714, "negative": 4.4349, "neutral": 4.4953 }, "boat": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "body": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "bonanza": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "books": { "positive": 5.0125, "negative": 4.8676, "neutral": 4.9281 }, "boom": { "positive": 6.1227, "negative": 4.0315, "neutral": 4.092 }, "booming": { "positive": 6.1227, "negative": 4.7233, "neutral": 4.7838 }, "border": { "positive": 5.0125, "negative": 4.8676, "neutral": 5.4358 }, "border payments": { "positive": 5.0125, "negative": 4.8676, "neutral": 5.4358 }, "born": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "boss": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "bot": { "positive": 4.5575, "negative": 4.6094, "neutral": 4.5756 }, "both": { "positive": 4.8157, "negative": 4.1505, "neutral": 4.3634 }, "bottom": { "positive": 4.8157, "negative": 4.2472, "neutral": 4.2572 }, "bottom time": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "bottoms": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "bought": { "positive": 4.313, "negative": 4.2472, "neutral": 4.211 }, "bought all": { "positive": 5.3234, "negative": 5.3754, "neutral": 5.1249 }, "bought more": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "bounce": { "positive": 5.0125, "negative": 3.934, "neutral": 3.9944 }, "bounce back": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "bounce taking": { "positive": 6.1227, "negative": 4.8676, "neutral": 4.9281 }, "bound": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "bounty": { "positive": 4.8157, "negative": 6.1746, "neutral": 4.9281 }, "box": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "boy": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "brand": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "brazil": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "breach": { "positive": 4.313, "negative": 4.8676, "neutral": 4.6698 }, "break": { "positive": 4.6714, "negative": 4.0315, "neutral": 4.1684 }, "break ath": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "break even": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "break out": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "breaking": { "positive": 4.6714, "negative": 3.405, "neutral": 3.4433 }, "breaking out": { "positive": 5.0125, "negative": 3.405, "neutral": 3.4654 }, "breakout": { "positive": 6.1227, "negative": 4.2472, "neutral": 4.3077 }, "breaks": { "positive": 4.4632, "negative": 4.8676, "neutral": 4.6698 }, "breaks peg": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "breakthrough": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "bridge": { "positive": 4.3829, "negative": 5.3754, "neutral": 4.5756 }, "bridges": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "bridging": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "brief": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "briefly": { "positive": 5.3234, "negative": 5.3754, "neutral": 5.1249 }, "bright": { "positive": 5.3234, "negative": 4.8676, "neutral": 5.1249 }, "bring": { "positive": 4.6714, "negative": 4.8676, "neutral": 4.9281 }, "bringing": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "bro": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "broader": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "broke": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "broken": { "positive": 3.6444, "negative": 5.0644, "neutral": 3.7568 }, "broker": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "brothers": { "positive": 4.8157, "negative": 5.3754, "neutral": 4.7838 }, "brothers arrested": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "browser": { "positive": 4.6714, "negative": 4.5152, "neutral": 5.1249 }, "browser extension": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "btc": { "positive": 3.4654, "negative": 3.3513, "neutral": 3.3445 }, "btc breaking": { "positive": 6.1227, "negative": 4.8676, "neutral": 4.9281 }, "btc buy": { "positive": 4.8157, "negative": 5.3754, "neutral": 5.1249 }, "btc chart": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "btc getting": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "btc goes": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "btc here": { "positive": 6.1227, "negative": 4.8676, "neutral": 4.9281 }, "btc lost": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "btc news": { "positive": 4.8157, "negative": 4.8676, "neutral": 6.2351 }, "btc surges": { "positive": 6.1227, "negative": 4.8676, "neutral": 4.9281 }, "btc trading": { "positive": 4.5575, "negative": 4.6094, "neutral": 6.2351 }, "btc volume": { "positive": 5.3234, "negative": 5.3754, "neutral": 5.1249 }, "btc weak": { "positive": 4.8157, "negative": 6.1746, "neutral": 4.9281 }, "bubble": { "positive": 4.0986, "negative": 6.1746, "neutral": 4.211 }, "bucks": { "positive": 5.3234, "negative": 5.0644, "neutral": 4.9281 }, "buddy": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "bug": { "positive": 4.4632, "negative": 4.8676, "neutral": 4.9281 }, "build": { "positive": 3.882, "negative": 3.8512, "neutral": 4.6698 }, "build crypto": { "positive": 4.8157, "negative": 4.8676, "neutral": 6.2351 }, "builder": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "building": { "positive": 3.882, "negative": 3.2406, "neutral": 3.4768 }, "building best": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "building crypto": { "positive": 4.5575, "negative": 4.5152, "neutral": 5.4358 }, "buildout": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "buildout near": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "builds": { "positive": 5.3234, "negative": 4.8676, "neutral": 5.1249 }, "built": { "positive": 3.664, "negative": 3.6774, "neutral": 4.7838 }, "built ai": { "positive": 4.5575, "negative": 4.6094, "neutral": 6.2351 }, "built crypto": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "built ethereum": { "positive": 4.5575, "negative": 4.6094, "neutral": 6.2351 }, "bulk": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "bull": { "positive": 3.5396, "negative": 3.6077, "neutral": 3.3011 }, "bull cycle": { "positive": 6.1227, "negative": 4.7233, "neutral": 4.7838 }, "bull market": { "positive": 6.1227, "negative": 4.4349, "neutral": 4.4953 }, "bull run": { "positive": 5.3234, "negative": 4.1505, "neutral": 4.2572 }, "bull trap": { "positive": 3.5895, "negative": 5.3754, "neutral": 3.6847 }, "bulletproof": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "bullish": { "positive": 3.3202, "negative": 2.7684, "neutral": 2.6741 }, "bullish $btc": { "positive": 5.0125, "negative": 5.0644, "neutral": 4.7838 }, "bullish $eth": { "positive": 5.0125, "negative": 4.7233, "neutral": 4.5756 }, "bullish $sol": { "positive": 4.8157, "negative": 5.0644, "neutral": 4.6698 }, "bullish ada": { "positive": 5.0125, "negative": 4.7233, "neutral": 4.5756 }, "bullish altcoins": { "positive": 5.0125, "negative": 4.6094, "neutral": 4.4953 }, "bullish avax": { "positive": 4.8157, "negative": 5.0644, "neutral": 4.6698 }, "bullish bitcoin": { "positive": 5.0125, "negative": 4.7233, "neutral": 4.5756 }, "bullish bnb": { "positive": 4.5575, "negative": 5.0644, "neutral": 4.4953 }, "bullish btc": { "positive": 5.3234, "negative": 5.0644, "neutral": 4.9281 }, "bullish cardano": { "positive": 4.8157, "negative": 4.6094, "neutral": 4.4254 }, "bullish case": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "bullish crypto": { "positive": 6.1227, "negative": 4.4349, "neutral": 4.4953 }, "bullish doge": { "positive": 5.0125, "negative": 4.7233, "neutral": 4.5756 }, "bullish eth": { "positive": 4.8157, "negative": 5.0644, "neutral": 4.6698 }, "bullish ethereum": { "positive": 4.8157, "negative": 4.7233, "neutral": 4.4953 }, "bullish here": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "bullish link": { "positive": 5.0125, "negative": 4.8676, "neutral": 4.6698 }, "bullish market": { "positive": 5.3234, "negative": 4.8676, "neutral": 4.7838 }, "bullish ripple": { "positive": 4.6714, "negative": 6.1746, "neutral": 4.7838 }, "bullish sol": { "positive": 5.0125, "negative": 4.8676, "neutral": 4.6698 }, "bullish solana": { "positive": 4.6714, "negative": 4.7233, "neutral": 4.4254 }, "bullish xrp": { "positive": 4.8157, "negative": 4.7233, "neutral": 4.4953 }, "bulls": { "positive": 6.1227, "negative": 3.8023, "neutral": 3.8628 }, "bulls followers": { "positive": 6.1227, "negative": 4.6094, "neutral": 4.6698 }, "burnshot": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "burnshot zero": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "business": { "positive": 4.8157, "negative": 4.7233, "neutral": 4.6698 }, "butterfly": { "positive": 4.8157, "negative": 6.1746, "neutral": 4.9281 }, "butterfly labs": { "positive": 4.8157, "negative": 6.1746, "neutral": 4.9281 }, "buy": { "positive": 2.9387, "negative": 2.7972, "neutral": 2.7355 }, "buy $btc": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "buy $nonja": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "buy ai": { "positive": 4.0165, "negative": 6.1746, "neutral": 4.1289 }, "buy all": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "buy back": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "buy bitcoin": { "positive": 4.6714, "negative": 5.3754, "neutral": 4.6698 }, "buy buy": { "positive": 6.1227, "negative": 4.8676, "neutral": 4.9281 }, "buy dip": { "positive": 6.1227, "negative": 4.8676, "neutral": 4.9281 }, "buy gold": { "positive": 4.0986, "negative": 6.1746, "neutral": 4.211 }, "buy hold": { "positive": 6.1227, "negative": 4.6094, "neutral": 4.6698 }, "buy memecoins": { "positive": 4.1953, "negative": 6.1746, "neutral": 4.3077 }, "buy more": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "buy now": { "positive": 6.1227, "negative": 4.8676, "neutral": 4.9281 }, "buy nvidia": { "positive": 4.3829, "negative": 6.1746, "neutral": 4.4953 }, "buy other": { "positive": 4.1448, "negative": 6.1746, "neutral": 4.2572 }, "buy right": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "buy sell": { "positive": 3.9451, "negative": 3.997, "neutral": 6.2351 }, "buy signal": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "buy tech": { "positive": 4.1953, "negative": 6.1746, "neutral": 4.3077 }, "buy wait": { "positive": 3.9127, "negative": 3.9646, "neutral": 6.2351 }, "buyers": { "positive": 4.8157, "negative": 5.0644, "neutral": 4.9281 }, "buying": { "positive": 5.3234, "negative": 2.9802, "neutral": 3.0355 }, "buying accelerates": { "positive": 6.1227, "negative": 3.8512, "neutral": 3.9117 }, "buying dip": { "positive": 6.1227, "negative": 3.3412, "neutral": 3.4016 }, "buying holding": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "buying more": { "positive": 6.1227, "negative": 4.8676, "neutral": 4.9281 }, "buyout": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "buyout news": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "buys": { "positive": 4.6714, "negative": 4.7233, "neutral": 4.5756 }, "bybit": { "positive": 4.4632, "negative": 5.3754, "neutral": 4.6698 }, "bybit hack": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "bybit says": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "bytes": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "ca": { "positive": 6.1227, "negative": 4.5152, "neutral": 4.5756 }, "ca hj": { "positive": 6.1227, "negative": 4.8676, "neutral": 4.9281 }, "ca xc": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "california": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "call": { "positive": 4.251, "negative": 4.2472, "neutral": 4.6698 }, "called": { "positive": 4.8157, "negative": 6.1746, "neutral": 4.9281 }, "calls": { "positive": 4.3829, "negative": 5.0644, "neutral": 4.6698 }, "calls ban": { "positive": 4.8157, "negative": 6.1746, "neutral": 4.9281 }, "camera": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "campaign": { "positive": 4.5575, "negative": 5.0644, "neutral": 4.9281 }, "can't": { "positive": 5.0125, "negative": 4.8676, "neutral": 4.6698 }, "canada": { "positive": 4.8157, "negative": 5.3754, "neutral": 5.1249 }, "canadian": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "candle": { "positive": 6.1227, "negative": 4.6094, "neutral": 4.6698 }, "candles": { "positive": 5.0125, "negative": 5.3754, "neutral": 4.9281 }, "cant": { "positive": 5.3234, "negative": 5.0644, "neutral": 4.9281 }, "cap": { "positive": 4.251, "negative": 3.9646, "neutral": 3.9944 }, "cap ath": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "cap barely": { "positive": 6.1227, "negative": 4.8676, "neutral": 4.9281 }, "cap listed": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "cap still": { "positive": 5.3234, "negative": 5.3754, "neutral": 5.1249 }, "capitulation": { "positive": 4.5575, "negative": 6.1746, "neutral": 4.6698 }, "capitulation continues": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "car": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "card": { "positive": 5.0125, "negative": 4.6094, "neutral": 4.6698 }, "cardano": { "positive": 3.6844, "negative": 3.5314, "neutral": 3.5919 }, "cardano all": { "positive": 4.8157, "negative": 6.1746, "neutral": 4.9281 }, "cardano chart": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "cardano fundamentals": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "cardano getting": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "cardano here": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "cardano momentum": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "cardano news": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "cardano smart": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "cardano support": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "cardano surges": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "cardano trading": { "positive": 4.5575, "negative": 4.6094, "neutral": 6.2351 }, "cardano volume": { "positive": 6.1227, "negative": 4.8676, "neutral": 4.9281 }, "cardano weak": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "cart": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "case": { "positive": 4.1953, "negative": 4.5152, "neutral": 4.1289 }, "cases": { "positive": 4.8157, "negative": 5.0644, "neutral": 5.4358 }, "cash": { "positive": 4.4632, "negative": 4.6094, "neutral": 4.9281 }, "cashio": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "cat": { "positive": 6.1227, "negative": 4.8676, "neutral": 4.9281 }, "cat bounce": { "positive": 6.1227, "negative": 4.8676, "neutral": 4.9281 }, "catalyst": { "positive": 5.3234, "negative": 4.8676, "neutral": 5.1249 }, "catalysts": { "positive": 6.1227, "negative": 4.8676, "neutral": 4.9281 }, "catalysts incoming": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "catch": { "positive": 4.6714, "negative": 4.7233, "neutral": 5.1249 }, "cats": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "cause": { "positive": 6.1227, "negative": 4.8676, "neutral": 4.9281 }, "caused": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "cbedd": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "cbedd cfcb": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "cd": { "positive": 5.3234, "negative": 3.6414, "neutral": 3.7196 }, "cd cd": { "positive": 6.1227, "negative": 4.2472, "neutral": 4.3077 }, "cd ec": { "positive": 6.1227, "negative": 4.2472, "neutral": 4.3077 }, "celestia": { "positive": 6.1227, "negative": 4.7233, "neutral": 4.7838 }, "celestia $tia": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "celsius": { "positive": 4.5575, "negative": 5.3754, "neutral": 4.7838 }, "cent": { "positive": 4.6714, "negative": 4.8676, "neutral": 4.9281 }, "center": { "positive": 4.6714, "negative": 5.3754, "neutral": 4.9281 }, "center outage": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "central": { "positive": 4.8157, "negative": 4.6094, "neutral": 5.1249 }, "central bank": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "central banks": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "centre": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "cents": { "positive": 4.1953, "negative": 4.1967, "neutral": 4.2572 }, "ceo": { "positive": 3.6844, "negative": 4.4349, "neutral": 3.9654 }, "ceo collapsed": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "ceo says": { "positive": 4.8157, "negative": 5.3754, "neutral": 5.1249 }, "ceo zhao": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "certain": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "cfcb": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "cftc": { "positive": 4.8157, "negative": 5.3754, "neutral": 5.1249 }, "chain": { "positive": 3.6844, "negative": 3.8774, "neutral": 3.9944 }, "chain attack": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "chain bridge": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "chain data": { "positive": 5.3234, "negative": 5.3754, "neutral": 5.1249 }, "chainlink": { "positive": 4.8157, "negative": 5.0644, "neutral": 5.4358 }, "chains": { "positive": 5.0125, "negative": 5.0644, "neutral": 5.1249 }, "challenge": { "positive": 4.5575, "negative": 4.6094, "neutral": 6.2351 }, "chance": { "positive": 5.3234, "negative": 4.6094, "neutral": 4.5756 }, "change": { "positive": 4.4632, "negative": 4.5152, "neutral": 4.7838 }, "change name": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "changed": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "changes": { "positive": 4.3829, "negative": 4.6094, "neutral": 5.1249 }, "changing": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "changpeng": { "positive": 4.3829, "negative": 5.0644, "neutral": 4.6698 }, "changpeng zhao": { "positive": 4.3829, "negative": 5.0644, "neutral": 4.6698 }, "channel": { "positive": 5.3234, "negative": 5.3754, "neutral": 5.1249 }, "chaos": { "positive": 5.3234, "negative": 5.3754, "neutral": 5.1249 }, "charge": { "positive": 4.8157, "negative": 5.3754, "neutral": 5.1249 }, "charged": { "positive": 4.6714, "negative": 5.3754, "neutral": 4.6698 }, "charges": { "positive": 4.251, "negative": 6.1746, "neutral": 4.3634 }, "charges crypto": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "charles": { "positive": 5.0125, "negative": 4.8676, "neutral": 4.9281 }, "chart": { "positive": 3.6844, "negative": 3.2323, "neutral": 3.1491 }, "chart looks": { "positive": 6.1227, "negative": 3.3721, "neutral": 3.4326 }, "chart ugly": { "positive": 3.853, "negative": 6.1746, "neutral": 3.9654 }, "chartered": { "positive": 5.3234, "negative": 5.3754, "neutral": 5.1249 }, "charts": { "positive": 5.3234, "negative": 4.7233, "neutral": 4.9281 }, "chasing": { "positive": 5.3234, "negative": 4.8676, "neutral": 4.7838 }, "chat": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "chatgpt": { "positive": 4.6714, "negative": 5.3754, "neutral": 4.9281 }, "cheap": { "positive": 4.5575, "negative": 4.7233, "neutral": 4.6698 }, "cheaper": { "positive": 6.1227, "negative": 4.8676, "neutral": 4.9281 }, "cheaper than": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "check": { "positive": 4.5575, "negative": 4.3029, "neutral": 4.4254 }, "check out": { "positive": 5.0125, "negative": 4.5152, "neutral": 4.5756 }, "checking": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "chief": { "positive": 4.6714, "negative": 5.0644, "neutral": 5.1249 }, "child": { "positive": 4.6714, "negative": 4.7233, "neutral": 6.2351 }, "child abuse": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "china": { "positive": 3.7055, "negative": 4.2472, "neutral": 4.0251 }, "china ban": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "china binance": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "china declares": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "china steps": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "china wants": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "chinese": { "positive": 4.5575, "negative": 5.0644, "neutral": 4.9281 }, "chinese bitcoin": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "chip": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "chips": { "positive": 4.6714, "negative": 4.7233, "neutral": 6.2351 }, "choose": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "christ": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "ci": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "circle": { "positive": 4.8157, "negative": 4.6094, "neutral": 5.1249 }, "citing": { "positive": 4.8157, "negative": 6.1746, "neutral": 4.9281 }, "city": { "positive": 4.8157, "negative": 4.8676, "neutral": 6.2351 }, "cla": { "positive": 5.0125, "negative": 4.8676, "neutral": 5.4358 }, "cla afkcdbxdsaymexo": { "positive": 5.0125, "negative": 4.8676, "neutral": 5.4358 }, "claim": { "positive": 5.3234, "negative": 5.3754, "neutral": 5.1249 }, "claiming": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "claims": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "clarity": { "positive": 4.4632, "negative": 4.1505, "neutral": 4.211 }, "clarity act": { "positive": 4.6714, "negative": 4.5152, "neutral": 4.5756 }, "clarity bill": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "class": { "positive": 5.3234, "negative": 5.3754, "neutral": 5.1249 }, "classic": { "positive": 5.3234, "negative": 4.8676, "neutral": 4.7838 }, "claude": { "positive": 4.8157, "negative": 4.8676, "neutral": 6.2351 }, "clear": { "positive": 3.6072, "negative": 3.5314, "neutral": 4.211 }, "clear $rari": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "clear direction": { "positive": 4.056, "negative": 4.1079, "neutral": 6.2351 }, "clear move": { "positive": 3.9796, "negative": 4.0315, "neutral": 6.2351 }, "clear upside": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "clear winner": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "cli": { "positive": 4.4632, "negative": 4.5152, "neutral": 6.2351 }, "cli tool": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "clickhouse": { "positive": 4.8157, "negative": 4.8676, "neutral": 6.2351 }, "client": { "positive": 4.6714, "negative": 4.8676, "neutral": 5.4358 }, "climate": { "positive": 4.6714, "negative": 5.0644, "neutral": 5.1249 }, "climb": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "climbing": { "positive": 6.1227, "negative": 4.8676, "neutral": 4.9281 }, "clone": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "close": { "positive": 4.6714, "negative": 4.2472, "neutral": 4.4254 }, "closed": { "positive": 4.8157, "negative": 5.0644, "neutral": 5.4358 }, "closer": { "positive": 5.0125, "negative": 5.3754, "neutral": 4.9281 }, "cloud": { "positive": 4.8157, "negative": 4.8676, "neutral": 5.1249 }, "cmon": { "positive": 4.8157, "negative": 4.8676, "neutral": 4.7838 }, "cmon bulls": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "co": { "positive": 4.4632, "negative": 4.6094, "neutral": 4.9281 }, "co founder": { "positive": 4.6714, "negative": 5.0644, "neutral": 5.1249 }, "co founders": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "coal": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "code": { "positive": 4.1448, "negative": 4.2472, "neutral": 4.9281 }, "codebase": { "positive": 4.8157, "negative": 5.0644, "neutral": 5.4358 }, "codebases": { "positive": 4.8157, "negative": 4.8676, "neutral": 6.2351 }, "codex": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "coding": { "positive": 4.8157, "negative": 4.8676, "neutral": 6.2351 }, "coin": { "positive": 3.4939, "negative": 3.6963, "neutral": 3.5004 }, "coin scam": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "coin sell": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "coinbase": { "positive": 2.9884, "negative": 3.3214, "neutral": 3.2928 }, "coinbase account": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "coinbase ceo": { "positive": 4.6714, "negative": 5.3754, "neutral": 4.9281 }, "coinbase chief": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "coinbase data": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "coinbase mission": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "coinbase says": { "positive": 4.8157, "negative": 6.1746, "neutral": 4.9281 }, "coinbase stock": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "coinbase support": { "positive": 5.3234, "negative": 5.3754, "neutral": 5.1249 }, "coinbase warns": { "positive": 4.8157, "negative": 6.1746, "neutral": 4.9281 }, "coindcx": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "coins": { "positive": 3.882, "negative": 3.7794, "neutral": 3.5919 }, "coins compounded": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "coins instead": { "positive": 4.1448, "negative": 6.1746, "neutral": 4.2572 }, "coins million": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "coins no": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "collapse": { "positive": 3.7743, "negative": 5.3754, "neutral": 3.8628 }, "collapsed": { "positive": 4.0986, "negative": 6.1746, "neutral": 4.211 }, "collapsed crypto": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "collapsing": { "positive": 4.8157, "negative": 6.1746, "neutral": 4.9281 }, "collateral": { "positive": 4.6714, "negative": 6.1746, "neutral": 4.7838 }, "collateral damage": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "colleagues": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "colleagues say": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "collectibles": { "positive": 5.3234, "negative": 5.3754, "neutral": 5.1249 }, "college": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "com": { "positive": 4.313, "negative": 4.2472, "neutral": 4.5756 }, "come": { "positive": 4.6714, "negative": 4.0315, "neutral": 4.1684 }, "come join": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "comeback": { "positive": 5.3234, "negative": 5.0644, "neutral": 4.9281 }, "comes": { "positive": 4.3829, "negative": 4.8676, "neutral": 4.5756 }, "comes another": { "positive": 4.6714, "negative": 6.1746, "neutral": 4.7838 }, "coming": { "positive": 4.056, "negative": 3.997, "neutral": 4.0251 }, "coming next": { "positive": 5.3234, "negative": 5.0644, "neutral": 4.9281 }, "coming soon": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "comment": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "commerce": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "comming": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "communities": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "community": { "positive": 4.4632, "negative": 4.1505, "neutral": 4.5756 }, "companies": { "positive": 4.3829, "negative": 5.0644, "neutral": 4.6698 }, "company": { "positive": 4.1448, "negative": 4.2472, "neutral": 4.3634 }, "company butterfly": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "compiler": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "complete": { "positive": 4.6714, "negative": 5.3754, "neutral": 4.9281 }, "completed": { "positive": 5.0125, "negative": 4.8676, "neutral": 4.9281 }, "completely": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "compound": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "compound gains": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "compounded": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "compounded gains": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "compromised": { "positive": 4.6714, "negative": 6.1746, "neutral": 4.7838 }, "compute": { "positive": 4.8157, "negative": 4.7233, "neutral": 5.4358 }, "computer": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "computing": { "positive": 4.6714, "negative": 4.7233, "neutral": 6.2351 }, "concerns": { "positive": 5.3234, "negative": 5.3754, "neutral": 5.1249 }, "conditions": { "positive": 4.8157, "negative": 4.8676, "neutral": 5.1249 }, "conference": { "positive": 4.056, "negative": 4.1079, "neutral": 4.7838 }, "conference happening": { "positive": 4.1953, "negative": 4.2472, "neutral": 6.2351 }, "confidence": { "positive": 5.3234, "negative": 5.0644, "neutral": 4.9281 }, "confident": { "positive": 6.1227, "negative": 4.3649, "neutral": 4.4254 }, "confirmed": { "positive": 5.3234, "negative": 5.3754, "neutral": 5.1249 }, "confirms": { "positive": 4.5575, "negative": 5.0644, "neutral": 4.6698 }, "confirms hack": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "congrats": { "positive": 5.0125, "negative": 3.997, "neutral": 4.1289 }, "congrats $dot": { "positive": 6.1227, "negative": 4.8676, "neutral": 4.9281 }, "congrats $wif": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "congrats true": { "positive": 6.1227, "negative": 4.8676, "neutral": 4.9281 }, "congress": { "positive": 4.6714, "negative": 4.7233, "neutral": 5.1249 }, "connected": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "consensus": { "positive": 5.0125, "negative": 4.8676, "neutral": 5.4358 }, "consider": { "positive": 5.0125, "negative": 5.3754, "neutral": 4.9281 }, "considered": { "positive": 4.8157, "negative": 5.3754, "neutral": 5.1249 }, "consolidating": { "positive": 3.9796, "negative": 3.997, "neutral": 5.4358 }, "consolidating waiting": { "positive": 3.9796, "negative": 4.0315, "neutral": 6.2351 }, "consolidation": { "positive": 5.0125, "negative": 4.7233, "neutral": 5.1249 }, "conspiracy": { "positive": 4.8157, "negative": 5.3754, "neutral": 5.1249 }, "conspiracy launder": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "consumption": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "consumption index": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "contagion": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "container": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "content": { "positive": 4.5575, "negative": 4.7233, "neutral": 5.4358 }, "context": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "continue": { "positive": 6.1227, "negative": 4.6094, "neutral": 4.6698 }, "continues": { "positive": 4.6714, "negative": 4.7233, "neutral": 4.4254 }, "continuing": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "contract": { "positive": 4.8157, "negative": 5.3754, "neutral": 5.1249 }, "contractor's": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "contractor's son": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "contracts": { "positive": 4.5575, "negative": 5.3754, "neutral": 4.7838 }, "control": { "positive": 5.3234, "negative": 4.6094, "neutral": 4.7838 }, "controlled": { "positive": 5.3234, "negative": 5.3754, "neutral": 5.1249 }, "controls": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "conversations": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "convicted": { "positive": 4.6714, "negative": 6.1746, "neutral": 4.7838 }, "convicted binance": { "positive": 4.8157, "negative": 6.1746, "neutral": 4.9281 }, "conviction": { "positive": 6.1227, "negative": 4.8676, "neutral": 4.9281 }, "cooked": { "positive": 5.0125, "negative": 4.8676, "neutral": 5.4358 }, "cool": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "cools": { "positive": 5.0125, "negative": 5.0644, "neutral": 5.1249 }, "core": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "corporate": { "positive": 5.3234, "negative": 4.8676, "neutral": 4.7838 }, "corporation": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "correct": { "positive": 4.8157, "negative": 5.0644, "neutral": 5.4358 }, "cosmos": { "positive": 6.1227, "negative": 4.6094, "neutral": 4.6698 }, "cosmos sdk": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "cost": { "positive": 4.5575, "negative": 5.0644, "neutral": 4.6698 }, "costs": { "positive": 4.6714, "negative": 4.3649, "neutral": 4.7838 }, "count": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "country": { "positive": 4.8157, "negative": 6.1746, "neutral": 4.9281 }, "couple": { "positive": 4.6714, "negative": 5.0644, "neutral": 4.7838 }, "course": { "positive": 4.8157, "negative": 5.0644, "neutral": 4.9281 }, "course crypto": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "court": { "positive": 4.8157, "negative": 5.3754, "neutral": 5.1249 }, "covid": { "positive": 5.0125, "negative": 5.0644, "neutral": 5.1249 }, "cpb": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "cpu": { "positive": 4.8157, "negative": 4.7233, "neutral": 5.4358 }, "crackdown": { "positive": 4.1448, "negative": 4.6094, "neutral": 4.5756 }, "crap": { "positive": 4.6714, "negative": 5.3754, "neutral": 4.6698 }, "crash": { "positive": 3.8255, "negative": 6.1746, "neutral": 3.9379 }, "crashed": { "positive": 4.251, "negative": 6.1746, "neutral": 4.3634 }, "crashes": { "positive": 3.3309, "negative": 6.1746, "neutral": 3.4433 }, "crashes hack": { "positive": 4.313, "negative": 6.1746, "neutral": 4.4254 }, "crashes liquidity": { "positive": 4.313, "negative": 6.1746, "neutral": 4.4254 }, "crashes major": { "positive": 4.6714, "negative": 6.1746, "neutral": 4.7838 }, "crashes regulators": { "positive": 4.8157, "negative": 6.1746, "neutral": 4.9281 }, "crashes sec": { "positive": 4.313, "negative": 6.1746, "neutral": 4.4254 }, "crashes stablecoin": { "positive": 4.4632, "negative": 6.1746, "neutral": 4.5756 }, "crashes whale": { "positive": 4.3829, "negative": 6.1746, "neutral": 4.4953 }, "crashing": { "positive": 4.8157, "negative": 6.1746, "neutral": 4.9281 }, "crater": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "crazy": { "positive": 4.5575, "negative": 4.2472, "neutral": 4.1684 }, "crazy potential": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "create": { "positive": 4.3829, "negative": 4.5152, "neutral": 4.9281 }, "created": { "positive": 4.8157, "negative": 4.8676, "neutral": 5.1249 }, "creative": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "creator": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "credit": { "positive": 4.6714, "negative": 4.8676, "neutral": 5.4358 }, "criminal": { "positive": 5.0125, "negative": 5.0644, "neutral": 5.1249 }, "crisis": { "positive": 4.4632, "negative": 6.1746, "neutral": 4.5756 }, "critical": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "cross": { "positive": 4.313, "negative": 4.4349, "neutral": 4.6698 }, "cross border": { "positive": 5.0125, "negative": 4.8676, "neutral": 5.4358 }, "cross chain": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "crossed": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "crowd": { "positive": 5.3234, "negative": 4.8676, "neutral": 5.1249 }, "crypto": { "positive": 2.151, "negative": 2.4446, "neutral": 2.345 }, "crypto adoption": { "positive": 6.1227, "negative": 4.8676, "neutral": 4.9281 }, "crypto anarchist": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "crypto assets": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "crypto bear": { "positive": 4.4632, "negative": 6.1746, "neutral": 4.5756 }, "crypto breaking": { "positive": 6.1227, "negative": 4.8676, "neutral": 4.9281 }, "crypto bull": { "positive": 6.1227, "negative": 4.4349, "neutral": 4.4953 }, "crypto buy": { "positive": 4.8157, "negative": 5.0644, "neutral": 4.9281 }, "crypto challenge": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "crypto chart": { "positive": 6.1227, "negative": 4.8676, "neutral": 4.9281 }, "crypto coin": { "positive": 4.6714, "negative": 5.0644, "neutral": 5.1249 }, "crypto collapse": { "positive": 4.8157, "negative": 6.1746, "neutral": 4.9281 }, "crypto com": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "crypto crackdown": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "crypto crash": { "positive": 4.5575, "negative": 6.1746, "neutral": 4.6698 }, "crypto currencies": { "positive": 4.8157, "negative": 5.3754, "neutral": 5.1249 }, "crypto currency": { "positive": 4.6714, "negative": 5.0644, "neutral": 5.1249 }, "crypto custody": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "crypto exchange": { "positive": 3.0431, "negative": 3.7574, "neutral": 3.3267 }, "crypto exchanges": { "positive": 3.853, "negative": 4.6094, "neutral": 4.0575 }, "crypto firm": { "positive": 5.3234, "negative": 4.8676, "neutral": 4.7838 }, "crypto firms": { "positive": 4.8157, "negative": 6.1746, "neutral": 4.9281 }, "crypto getting": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "crypto hack": { "positive": 3.9796, "negative": 6.1746, "neutral": 4.092 }, "crypto hacked": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "crypto hacker": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "crypto hackers": { "positive": 4.6714, "negative": 6.1746, "neutral": 4.7838 }, "crypto hacking": { "positive": 4.6714, "negative": 4.8676, "neutral": 5.4358 }, "crypto hacks": { "positive": 4.6714, "negative": 5.3754, "neutral": 4.9281 }, "crypto here": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "crypto history": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "crypto how": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "crypto industry": { "positive": 4.8157, "negative": 4.7233, "neutral": 4.6698 }, "crypto investment": { "positive": 5.3234, "negative": 5.3754, "neutral": 5.1249 }, "crypto investors": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "crypto lender": { "positive": 4.8157, "negative": 5.3754, "neutral": 5.1249 }, "crypto market": { "positive": 4.5575, "negative": 4.7233, "neutral": 4.6698 }, "crypto markets": { "positive": 5.0125, "negative": 4.8676, "neutral": 5.4358 }, "crypto mining": { "positive": 4.5575, "negative": 4.8676, "neutral": 4.7838 }, "crypto news": { "positive": 4.6714, "negative": 4.6094, "neutral": 5.4358 }, "crypto not": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "crypto payments": { "positive": 4.8157, "negative": 5.0644, "neutral": 5.4358 }, "crypto prediction": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "crypto price": { "positive": 4.8157, "negative": 5.0644, "neutral": 5.4358 }, "crypto prices": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "crypto rally": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "crypto regulation": { "positive": 4.4632, "negative": 4.6094, "neutral": 5.4358 }, "crypto regulations": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "crypto scam": { "positive": 4.313, "negative": 6.1746, "neutral": 4.4254 }, "crypto scams": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "crypto selloff": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "crypto stablecoins": { "positive": 5.3234, "negative": 5.3754, "neutral": 5.1249 }, "crypto startup": { "positive": 4.8157, "negative": 6.1746, "neutral": 4.9281 }, "crypto stolen": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "crypto summer": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "crypto support": { "positive": 5.3234, "negative": 5.0644, "neutral": 4.9281 }, "crypto surges": { "positive": 6.1227, "negative": 4.8676, "neutral": 4.9281 }, "crypto theft": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "crypto token": { "positive": 4.8157, "negative": 4.8676, "neutral": 6.2351 }, "crypto tokens": { "positive": 5.3234, "negative": 5.3754, "neutral": 5.1249 }, "crypto trading": { "positive": 4.313, "negative": 4.5152, "neutral": 5.1249 }, "crypto treasury": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "crypto volume": { "positive": 5.3234, "negative": 5.0644, "neutral": 4.9281 }, "crypto wallet": { "positive": 4.8157, "negative": 5.0644, "neutral": 4.9281 }, "crypto wallets": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "crypto winter": { "positive": 5.0125, "negative": 5.0644, "neutral": 4.7838 }, "crypto withdrawals": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "crypto's": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "cryptocurrencies": { "positive": 3.7743, "negative": 3.9646, "neutral": 4.092 }, "cryptocurrencies $xrp": { "positive": 6.1227, "negative": 4.8676, "neutral": 4.9281 }, "cryptocurrency": { "positive": 2.8883, "negative": 3.3829, "neutral": 3.1305 }, "cryptocurrency ban": { "positive": 4.5575, "negative": 6.1746, "neutral": 4.6698 }, "cryptocurrency bubble": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "cryptocurrency donations": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "cryptocurrency exchange": { "positive": 5.3234, "negative": 5.0644, "neutral": 4.9281 }, "cryptocurrency giveaway": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "cryptocurrency investment": { "positive": 4.8157, "negative": 6.1746, "neutral": 4.9281 }, "cryptocurrency market": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "cryptocurrency mining": { "positive": 4.6714, "negative": 5.0644, "neutral": 5.1249 }, "cryptocurrency pump": { "positive": 5.3234, "negative": 5.3754, "neutral": 5.1249 }, "cryptocurrency scam": { "positive": 4.5575, "negative": 6.1746, "neutral": 4.6698 }, "cryptocurrency trading": { "positive": 4.4632, "negative": 5.3754, "neutral": 4.6698 }, "cryptocurrency transactions": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "cryptographic": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "cryptography": { "positive": 4.313, "negative": 4.4349, "neutral": 5.4358 }, "cryptohack": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "cryptokitties": { "positive": 5.3234, "negative": 5.3754, "neutral": 5.1249 }, "cryptotwits": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "currencies": { "positive": 4.5575, "negative": 4.8676, "neutral": 5.1249 }, "currency": { "positive": 4.1953, "negative": 4.4349, "neutral": 4.4953 }, "currency exchange": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "current": { "positive": 4.8157, "negative": 4.7233, "neutral": 4.9281 }, "currently": { "positive": 5.3234, "negative": 4.5152, "neutral": 4.6698 }, "curve": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "custody": { "positive": 5.3234, "negative": 4.8676, "neutral": 5.1249 }, "custom": { "positive": 4.5575, "negative": 4.7233, "neutral": 5.4358 }, "customer": { "positive": 4.6714, "negative": 6.1746, "neutral": 4.7838 }, "customer funds": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "customers": { "positive": 4.3829, "negative": 5.0644, "neutral": 4.6698 }, "customers'": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "cut": { "positive": 4.5575, "negative": 4.6094, "neutral": 4.5756 }, "cuts": { "positive": 4.5575, "negative": 4.8676, "neutral": 4.7838 }, "cuts workforce": { "positive": 4.8157, "negative": 5.3754, "neutral": 5.1249 }, "cycle": { "positive": 4.8157, "negative": 4.2472, "neutral": 4.1684 }, "cz": { "positive": 4.5575, "negative": 4.5152, "neutral": 4.9281 }, "da": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "da db": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "dai": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "daily": { "positive": 4.3829, "negative": 4.5152, "neutral": 4.4953 }, "damage": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "dangerous": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "dao": { "positive": 3.5724, "negative": 3.7574, "neutral": 3.9117 }, "dao hack": { "positive": 4.8157, "negative": 6.1746, "neutral": 4.9281 }, "dao raised": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "daos": { "positive": 4.6714, "negative": 4.7233, "neutral": 6.2351 }, "dark": { "positive": 4.8157, "negative": 5.0644, "neutral": 5.4358 }, "dashboard": { "positive": 4.8157, "negative": 5.0644, "neutral": 5.4358 }, "data": { "positive": 3.5724, "negative": 3.7794, "neutral": 3.9944 }, "data breach": { "positive": 4.5575, "negative": 5.3754, "neutral": 4.7838 }, "data center": { "positive": 4.6714, "negative": 5.3754, "neutral": 4.9281 }, "data stolen": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "database": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "date": { "positive": 4.8157, "negative": 5.3754, "neutral": 5.1249 }, "day": { "positive": 3.6844, "negative": 3.6591, "neutral": 3.652 }, "day another": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "day nothing": { "positive": 4.6714, "negative": 5.0644, "neutral": 4.7838 }, "day trading": { "positive": 5.3234, "negative": 5.3754, "neutral": 5.1249 }, "days": { "positive": 4.3829, "negative": 4.3649, "neutral": 4.3634 }, "db": { "positive": 5.3234, "negative": 4.8676, "neutral": 5.1249 }, "db ed": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "dca": { "positive": 5.3234, "negative": 4.4349, "neutral": 4.5756 }, "dea": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "dead": { "positive": 3.1887, "negative": 4.7233, "neutral": 3.2687 }, "dead cat": { "positive": 6.1227, "negative": 4.8676, "neutral": 4.9281 }, "dead internet": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "dead man's": { "positive": 4.8157, "negative": 6.1746, "neutral": 4.9281 }, "dead money": { "positive": 4.0165, "negative": 6.1746, "neutral": 4.1289 }, "deal": { "positive": 4.6714, "negative": 4.7233, "neutral": 4.7838 }, "dealing": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "deals": { "positive": 4.6714, "negative": 5.0644, "neutral": 4.7838 }, "dear": { "positive": 5.0125, "negative": 4.8676, "neutral": 4.9281 }, "dear life": { "positive": 5.3234, "negative": 5.3754, "neutral": 5.1249 }, "dear sophie": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "death": { "positive": 5.0125, "negative": 5.3754, "neutral": 4.9281 }, "debate": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "debt": { "positive": 5.0125, "negative": 5.0644, "neutral": 5.1249 }, "debut": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "decade": { "positive": 5.0125, "negative": 5.0644, "neutral": 5.1249 }, "decades": { "positive": 5.3234, "negative": 5.3754, "neutral": 5.1249 }, "decent": { "positive": 6.1227, "negative": 4.7233, "neutral": 4.7838 }, "decent exchanges": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "decentralization": { "positive": 5.0125, "negative": 5.0644, "neutral": 5.1249 }, "decentralized": { "positive": 3.882, "negative": 3.905, "neutral": 4.4953 }, "decentralized exchange": { "positive": 5.0125, "negative": 5.0644, "neutral": 5.1249 }, "decentralized finance": { "positive": 5.0125, "negative": 4.8676, "neutral": 4.9281 }, "decision": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "declares": { "positive": 4.6714, "negative": 6.1746, "neutral": 4.7838 }, "declares cryptocurrency": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "deep": { "positive": 5.3234, "negative": 4.8676, "neutral": 5.1249 }, "default": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "defense": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "defi": { "positive": 3.882, "negative": 4.6094, "neutral": 4.0251 }, "defi hack": { "positive": 4.6714, "negative": 6.1746, "neutral": 4.7838 }, "defi protocol": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "defichain": { "positive": 5.0125, "negative": 4.8676, "neutral": 5.4358 }, "defies": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "defined": { "positive": 4.8157, "negative": 4.8676, "neutral": 6.2351 }, "defines": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "defining": { "positive": 5.0125, "negative": 4.8676, "neutral": 5.4358 }, "definitely": { "positive": 5.0125, "negative": 4.5152, "neutral": 4.5756 }, "degen": { "positive": 5.3234, "negative": 5.3754, "neutral": 5.1249 }, "delist": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "delisted": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "delisting": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "deliver": { "positive": 4.8157, "negative": 6.1746, "neutral": 4.9281 }, "deliver malware": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "delivering": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "demand": { "positive": 4.3829, "negative": 4.8676, "neutral": 4.5756 }, "demo": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "department": { "positive": 5.3234, "negative": 5.3754, "neutral": 5.1249 }, "dependencies": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "depends": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "depin": { "positive": 5.3234, "negative": 4.7233, "neutral": 4.9281 }, "deposits": { "positive": 4.4632, "negative": 5.3754, "neutral": 4.6698 }, "deposits withdrawals": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "depot": { "positive": 4.8157, "negative": 6.1746, "neutral": 4.9281 }, "depot files": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "derivatives": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "design": { "positive": 4.313, "negative": 4.1967, "neutral": 4.9281 }, "designed": { "positive": 4.8157, "negative": 4.7233, "neutral": 5.4358 }, "designer": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "desperate": { "positive": 4.8157, "negative": 5.3754, "neutral": 5.1249 }, "despite": { "positive": 5.3234, "negative": 5.3754, "neutral": 5.1249 }, "destroy": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "detect": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "detecting": { "positive": 5.3234, "negative": 5.3754, "neutral": 5.1249 }, "detecting cryptocurrency": { "positive": 5.3234, "negative": 5.3754, "neutral": 5.1249 }, "detector": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "deterministic": { "positive": 4.8157, "negative": 4.8676, "neutral": 6.2351 }, "dev": { "positive": 5.0125, "negative": 5.0644, "neutral": 5.1249 }, "developer": { "positive": 3.9127, "negative": 3.934, "neutral": 5.4358 }, "developer update": { "positive": 4.0165, "negative": 4.0684, "neutral": 6.2351 }, "developers": { "positive": 4.3829, "negative": 4.5152, "neutral": 4.9281 }, "developers release": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "development": { "positive": 4.4632, "negative": 4.4349, "neutral": 5.4358 }, "developments": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "devs": { "positive": 4.6714, "negative": 5.0644, "neutral": 5.1249 }, "dex": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "dfi": { "positive": 5.0125, "negative": 4.8676, "neutral": 5.4358 }, "dfi defichain": { "positive": 5.0125, "negative": 4.8676, "neutral": 5.4358 }, "didn": { "positive": 5.3234, "negative": 5.0644, "neutral": 4.9281 }, "die": { "positive": 4.4632, "negative": 4.8676, "neutral": 4.6698 }, "dies": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "different": { "positive": 5.0125, "negative": 4.7233, "neutral": 4.7838 }, "different crypto": { "positive": 5.3234, "negative": 5.3754, "neutral": 5.1249 }, "difficult": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "difficulty": { "positive": 4.6714, "negative": 5.0644, "neutral": 5.1249 }, "difficulty drops": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "digital": { "positive": 3.9451, "negative": 3.905, "neutral": 4.092 }, "digital assets": { "positive": 6.1227, "negative": 4.8676, "neutral": 4.9281 }, "digital currency": { "positive": 4.8157, "negative": 5.0644, "neutral": 5.4358 }, "digital dogshit": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "digital gold": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "digital silver": { "positive": 5.3234, "negative": 4.8676, "neutral": 5.1249 }, "dilution": { "positive": 5.3234, "negative": 4.6094, "neutral": 4.5756 }, "dilution million": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "dip": { "positive": 4.5575, "negative": 3.2082, "neutral": 3.3095 }, "dip $btc": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "dip $eth": { "positive": 6.1227, "negative": 4.7233, "neutral": 4.7838 }, "dip $sol": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "dip ada": { "positive": 6.1227, "negative": 4.8676, "neutral": 4.9281 }, "dip avax": { "positive": 6.1227, "negative": 4.8676, "neutral": 4.9281 }, "dip bitcoin": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "dip btc": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "dip cardano": { "positive": 6.1227, "negative": 4.5152, "neutral": 4.5756 }, "dip crypto": { "positive": 6.1227, "negative": 4.8676, "neutral": 4.9281 }, "dip doge": { "positive": 6.1227, "negative": 4.8676, "neutral": 4.9281 }, "dip ethereum": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "dip link": { "positive": 6.1227, "negative": 4.8676, "neutral": 4.9281 }, "dip market": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "dip ripple": { "positive": 6.1227, "negative": 4.7233, "neutral": 4.7838 }, "dip sol": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "dip solana": { "positive": 6.1227, "negative": 4.7233, "neutral": 4.7838 }, "dip xrp": { "positive": 6.1227, "negative": 4.6094, "neutral": 4.6698 }, "direction": { "positive": 4.0165, "negative": 4.0684, "neutral": 6.2351 }, "direction yet": { "positive": 4.056, "negative": 4.1079, "neutral": 6.2351 }, "disables": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "disaster": { "positive": 4.313, "negative": 6.1746, "neutral": 4.4254 }, "disaster waiting": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "disclosure": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "discount": { "positive": 5.3234, "negative": 4.8676, "neutral": 4.7838 }, "discussion": { "positive": 5.0125, "negative": 4.8676, "neutral": 5.4358 }, "distributed": { "positive": 4.6714, "negative": 5.0644, "neutral": 5.1249 }, "divergence": { "positive": 5.3234, "negative": 5.0644, "neutral": 4.9281 }, "divergence daily": { "positive": 5.3234, "negative": 5.3754, "neutral": 5.1249 }, "dm": { "positive": 4.5575, "negative": 5.3754, "neutral": 4.7838 }, "dm day": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "dns": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "documentation": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "documents": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "doesn": { "positive": 5.0125, "negative": 5.0644, "neutral": 4.7838 }, "doesn't": { "positive": 4.8157, "negative": 5.0644, "neutral": 5.4358 }, "dog": { "positive": 5.0125, "negative": 5.0644, "neutral": 4.7838 }, "dog shit": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "doge": { "positive": 3.6072, "negative": 3.5174, "neutral": 3.525 }, "doge all": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "doge breaking": { "positive": 6.1227, "negative": 4.8676, "neutral": 4.9281 }, "doge buy": { "positive": 4.8157, "negative": 6.1746, "neutral": 4.9281 }, "doge chart": { "positive": 6.1227, "negative": 4.8676, "neutral": 4.9281 }, "doge crashes": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "doge fundamentals": { "positive": 5.3234, "negative": 5.3754, "neutral": 5.1249 }, "doge getting": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "doge here": { "positive": 5.3234, "negative": 4.5152, "neutral": 4.6698 }, "doge looks": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "doge news": { "positive": 4.8157, "negative": 4.8676, "neutral": 6.2351 }, "doge smart": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "doge surges": { "positive": 6.1227, "negative": 4.8676, "neutral": 4.9281 }, "doge trading": { "positive": 4.6714, "negative": 4.7233, "neutral": 6.2351 }, "doge volume": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "dogecoin": { "positive": 4.5575, "negative": 4.6094, "neutral": 4.7838 }, "dogshit": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "doing": { "positive": 4.5575, "negative": 4.3029, "neutral": 4.5756 }, "doj": { "positive": 4.4632, "negative": 5.3754, "neutral": 4.6698 }, "doj seizes": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "dollar": { "positive": 4.0165, "negative": 4.3029, "neutral": 4.2572 }, "dollar hack": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "dollars": { "positive": 4.3829, "negative": 6.1746, "neutral": 4.4953 }, "dominance": { "positive": 5.3234, "negative": 4.7233, "neutral": 4.9281 }, "don": { "positive": 4.3829, "negative": 3.9646, "neutral": 3.9379 }, "don fade": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "don sleep": { "positive": 5.3234, "negative": 4.8676, "neutral": 5.1249 }, "don think": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "don't": { "positive": 4.251, "negative": 4.1967, "neutral": 4.1289 }, "don't know": { "positive": 5.3234, "negative": 5.3754, "neutral": 5.1249 }, "donald": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "donations": { "positive": 4.6714, "negative": 5.0644, "neutral": 5.1249 }, "done": { "positive": 5.0125, "negative": 4.5152, "neutral": 4.5756 }, "dont": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "door": { "positive": 4.8157, "negative": 5.3754, "neutral": 5.1249 }, "dosent": { "positive": 6.1227, "negative": 4.8676, "neutral": 4.9281 }, "dosent feel": { "positive": 6.1227, "negative": 4.8676, "neutral": 4.9281 }, "dot": { "positive": 5.0125, "negative": 5.3754, "neutral": 4.9281 }, "dotcom": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "dots": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "double": { "positive": 4.5575, "negative": 4.8676, "neutral": 4.7838 }, "doubled": { "positive": 5.3234, "negative": 4.8676, "neutral": 5.1249 }, "down": { "positive": 3.353, "negative": 4.2472, "neutral": 3.3819 }, "down due": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "down goes": { "positive": 4.6714, "negative": 6.1746, "neutral": 4.7838 }, "down since": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "download": { "positive": 5.3234, "negative": 5.3754, "neutral": 5.1249 }, "dprk": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "drain": { "positive": 4.6714, "negative": 6.1746, "neutral": 4.7838 }, "drained": { "positive": 3.9451, "negative": 6.1746, "neutral": 4.0575 }, "drained funds": { "positive": 4.313, "negative": 6.1746, "neutral": 4.4254 }, "drains": { "positive": 4.8157, "negative": 5.3754, "neutral": 4.7838 }, "dream": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "dried": { "positive": 4.251, "negative": 6.1746, "neutral": 4.3634 }, "dried up": { "positive": 4.251, "negative": 6.1746, "neutral": 4.3634 }, "driven": { "positive": 4.8157, "negative": 5.3754, "neutral": 5.1249 }, "drone": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "drop": { "positive": 4.8157, "negative": 5.0644, "neutral": 4.6698 }, "dropped": { "positive": 5.0125, "negative": 3.9646, "neutral": 4.0251 }, "dropped sharply": { "positive": 6.1227, "negative": 3.997, "neutral": 4.0575 }, "dropping": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "drops": { "positive": 4.5575, "negative": 6.1746, "neutral": 4.6698 }, "drug": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "drugs": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "duck": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "due": { "positive": 4.6714, "negative": 5.0644, "neutral": 4.5756 }, "dumb": { "positive": 4.313, "negative": 5.3754, "neutral": 4.3634 }, "dump": { "positive": 3.9796, "negative": 5.0644, "neutral": 4.0251 }, "dump shit": { "positive": 4.8157, "negative": 6.1746, "neutral": 4.9281 }, "dumped": { "positive": 4.251, "negative": 6.1746, "neutral": 4.3634 }, "dumped millions": { "positive": 4.3829, "negative": 6.1746, "neutral": 4.4953 }, "dumping": { "positive": 3.1642, "negative": 5.0644, "neutral": 3.2609 }, "dumping $sol": { "positive": 4.6714, "negative": 6.1746, "neutral": 4.7838 }, "dumping ada": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "dumping bnb": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "dumping btc": { "positive": 5.0125, "negative": 5.3754, "neutral": 4.9281 }, "dumping buy": { "positive": 3.4795, "negative": 6.1746, "neutral": 3.5919 }, "dumping crypto": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "dumping doge": { "positive": 4.8157, "negative": 6.1746, "neutral": 4.9281 }, "dumping ing": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "dumping market": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "dumping sol": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "dumps": { "positive": 4.6714, "negative": 5.3754, "neutral": 4.6698 }, "dust": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "dying": { "positive": 4.8157, "negative": 6.1746, "neutral": 4.9281 }, "each": { "positive": 5.0125, "negative": 5.3754, "neutral": 4.9281 }, "earlier": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "earlier failed": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "early": { "positive": 4.6714, "negative": 4.3029, "neutral": 4.2572 }, "earn": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "earnings": { "positive": 4.8157, "negative": 5.0644, "neutral": 5.4358 }, "earnings call": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "ease": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "easily": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "easy": { "positive": 4.5575, "negative": 4.4349, "neutral": 4.5756 }, "easy money": { "positive": 5.3234, "negative": 5.3754, "neutral": 5.1249 }, "ebola": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "ec": { "positive": 6.1227, "negative": 4.2472, "neutral": 4.3077 }, "ec af": { "positive": 6.1227, "negative": 4.2472, "neutral": 4.3077 }, "eco": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "economics": { "positive": 5.0125, "negative": 5.0644, "neutral": 5.1249 }, "economist": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "economy": { "positive": 4.8157, "negative": 4.8676, "neutral": 5.1249 }, "ecosystem": { "positive": 4.5575, "negative": 4.4349, "neutral": 4.7838 }, "ed": { "positive": 5.3234, "negative": 4.7233, "neutral": 4.9281 }, "ed ba": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "educational": { "positive": 4.8157, "negative": 4.8676, "neutral": 6.2351 }, "eff": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "efficient": { "positive": 4.8157, "negative": 4.7233, "neutral": 5.4358 }, "eiejem": { "positive": 5.3234, "negative": 4.5152, "neutral": 4.4953 }, "eiejem rggtracxfrge": { "positive": 5.3234, "negative": 4.5152, "neutral": 4.4953 }, "either": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "el": { "positive": 4.8157, "negative": 5.3754, "neutral": 5.1249 }, "el salvador": { "positive": 4.8157, "negative": 5.3754, "neutral": 5.1249 }, "electricity": { "positive": 4.8157, "negative": 5.0644, "neutral": 5.4358 }, "em": { "positive": 5.3234, "negative": 5.3754, "neutral": 5.1249 }, "emails": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "emissions": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "employees": { "positive": 4.6714, "negative": 5.0644, "neutral": 5.1249 }, "encouraging": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "encrypted": { "positive": 4.313, "negative": 4.4349, "neutral": 5.4358 }, "encryption": { "positive": 4.8157, "negative": 4.8676, "neutral": 6.2351 }, "end": { "positive": 3.9451, "negative": 4.0315, "neutral": 4.6698 }, "end encrypted": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "end end": { "positive": 4.8157, "negative": 4.8676, "neutral": 6.2351 }, "ending": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "ends": { "positive": 4.5575, "negative": 5.3754, "neutral": 4.7838 }, "energy": { "positive": 4.056, "negative": 4.0684, "neutral": 4.9281 }, "engine": { "positive": 4.5575, "negative": 4.5152, "neutral": 5.4358 }, "engineer": { "positive": 4.8157, "negative": 6.1746, "neutral": 4.9281 }, "engineer pleads": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "enjoy": { "positive": 5.0125, "negative": 5.0644, "neutral": 4.7838 }, "enough": { "positive": 5.3234, "negative": 4.5152, "neutral": 4.6698 }, "enough hold": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "enterprise": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "entire": { "positive": 4.5575, "negative": 5.0644, "neutral": 4.4953 }, "entire defi": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "entry": { "positive": 6.1227, "negative": 4.8676, "neutral": 4.9281 }, "entry point": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "environment": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "environmental": { "positive": 5.0125, "negative": 5.3754, "neutral": 4.9281 }, "era": { "positive": 5.3234, "negative": 4.8676, "neutral": 4.7838 }, "established": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "estimates": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "etc": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "etf": { "positive": 4.5575, "negative": 3.5606, "neutral": 3.5778 }, "etf approval": { "positive": 6.1227, "negative": 4.0684, "neutral": 4.1289 }, "etf inflows": { "positive": 6.1227, "negative": 3.997, "neutral": 4.0575 }, "etfs": { "positive": 5.3234, "negative": 5.0644, "neutral": 4.9281 }, "eth": { "positive": 3.5396, "negative": 3.5037, "neutral": 3.4654 }, "eth all": { "positive": 4.8157, "negative": 6.1746, "neutral": 4.9281 }, "eth breaking": { "positive": 6.1227, "negative": 4.7233, "neutral": 4.7838 }, "eth crashes": { "positive": 4.8157, "negative": 6.1746, "neutral": 4.9281 }, "eth fees": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "eth fundamentals": { "positive": 5.0125, "negative": 5.3754, "neutral": 4.9281 }, "eth getting": { "positive": 4.8157, "negative": 6.1746, "neutral": 4.9281 }, "eth here": { "positive": 6.1227, "negative": 4.7233, "neutral": 4.7838 }, "eth news": { "positive": 4.8157, "negative": 4.8676, "neutral": 6.2351 }, "eth smart": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "eth surges": { "positive": 6.1227, "negative": 4.8676, "neutral": 4.9281 }, "eth trading": { "positive": 4.4632, "negative": 4.5152, "neutral": 6.2351 }, "eth weak": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "ether": { "positive": 4.5575, "negative": 5.0644, "neutral": 4.6698 }, "ethereum": { "positive": 2.9494, "negative": 3.0403, "neutral": 3.2091 }, "ethereum all": { "positive": 4.8157, "negative": 6.1746, "neutral": 4.9281 }, "ethereum based": { "positive": 4.8157, "negative": 5.0644, "neutral": 5.4358 }, "ethereum blockchain": { "positive": 4.6714, "negative": 4.8676, "neutral": 5.4358 }, "ethereum breaking": { "positive": 6.1227, "negative": 4.8676, "neutral": 4.9281 }, "ethereum chart": { "positive": 5.3234, "negative": 4.8676, "neutral": 4.7838 }, "ethereum classic": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "ethereum crashes": { "positive": 4.8157, "negative": 6.1746, "neutral": 4.9281 }, "ethereum dao": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "ethereum devs": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "ethereum etf": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "ethereum fundamentals": { "positive": 5.3234, "negative": 5.3754, "neutral": 5.1249 }, "ethereum getting": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "ethereum just": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "ethereum network": { "positive": 4.8157, "negative": 5.0644, "neutral": 4.9281 }, "ethereum news": { "positive": 4.8157, "negative": 4.8676, "neutral": 6.2351 }, "ethereum protocol": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "ethereum support": { "positive": 5.3234, "negative": 5.0644, "neutral": 4.9281 }, "ethereum surges": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "ethereum trading": { "positive": 4.6714, "negative": 4.7233, "neutral": 6.2351 }, "ethereum's": { "positive": 4.8157, "negative": 4.8676, "neutral": 5.1249 }, "eu": { "positive": 4.313, "negative": 4.8676, "neutral": 4.6698 }, "eu ban": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "euro": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "europe": { "positive": 4.8157, "negative": 4.8676, "neutral": 5.1249 }, "evade": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "even": { "positive": 4.1448, "negative": 3.8512, "neutral": 3.7968 }, "even close": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "even more": { "positive": 5.0125, "negative": 5.3754, "neutral": 4.9281 }, "event": { "positive": 5.3234, "negative": 5.0644, "neutral": 4.9281 }, "ever": { "positive": 3.9796, "negative": 3.9646, "neutral": 3.9379 }, "ever created": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "ever seen": { "positive": 5.0125, "negative": 5.3754, "neutral": 4.9281 }, "ever there": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "every": { "positive": 3.9796, "negative": 3.9646, "neutral": 4.0575 }, "every coin": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "every day": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "every dip": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "every other": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "every time": { "positive": 5.3234, "negative": 5.0644, "neutral": 4.9281 }, "every week": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "everybody": { "positive": 5.0125, "negative": 4.8676, "neutral": 4.9281 }, "everyone": { "positive": 3.5724, "negative": 4.2472, "neutral": 3.6847 }, "everyone dumping": { "positive": 3.6844, "negative": 6.1746, "neutral": 3.7968 }, "everything": { "positive": 4.5575, "negative": 4.8676, "neutral": 4.4254 }, "everywhere": { "positive": 5.3234, "negative": 4.8676, "neutral": 5.1249 }, "evidence": { "positive": 4.8157, "negative": 5.3754, "neutral": 5.1249 }, "evil": { "positive": 5.3234, "negative": 4.8676, "neutral": 5.1249 }, "ex": { "positive": 4.4632, "negative": 5.3754, "neutral": 4.6698 }, "ex terra": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "exactly": { "positive": 5.3234, "negative": 5.0644, "neutral": 4.9281 }, "exch": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "exchange": { "positive": 2.8741, "negative": 3.4773, "neutral": 3.1244 }, "exchange aax": { "positive": 4.6714, "negative": 6.1746, "neutral": 4.7838 }, "exchange announces": { "positive": 5.3234, "negative": 5.3754, "neutral": 5.1249 }, "exchange backed": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "exchange binance": { "positive": 4.5575, "negative": 4.8676, "neutral": 5.1249 }, "exchange bittrex": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "exchange bybit": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "exchange coinbase": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "exchange coindcx": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "exchange collapse": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "exchange founder": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "exchange ftx": { "positive": 4.5575, "negative": 5.3754, "neutral": 4.7838 }, "exchange got": { "positive": 4.6714, "negative": 6.1746, "neutral": 4.7838 }, "exchange hacked": { "positive": 4.5575, "negative": 6.1746, "neutral": 4.6698 }, "exchange listings": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "exchange suspends": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "exchange wazirx": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "exchanges": { "positive": 3.7743, "negative": 4.2472, "neutral": 3.8867 }, "exchanges fake": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "exchanges volume": { "positive": 5.3234, "negative": 5.0644, "neutral": 4.9281 }, "exciting": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "exec": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "execs": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "executives": { "positive": 4.6714, "negative": 6.1746, "neutral": 4.7838 }, "executives arrested": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "exit": { "positive": 4.313, "negative": 4.8676, "neutral": 4.4953 }, "exit scam": { "positive": 4.8157, "negative": 6.1746, "neutral": 4.9281 }, "expect": { "positive": 5.3234, "negative": 4.7233, "neutral": 4.6698 }, "expected": { "positive": 4.6714, "negative": 4.7233, "neutral": 4.7838 }, "expected range": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "expecting": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "expects": { "positive": 4.8157, "negative": 5.0644, "neutral": 5.4358 }, "experience": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "experiment": { "positive": 4.8157, "negative": 4.7233, "neutral": 4.9281 }, "experts": { "positive": 4.8157, "negative": 5.0644, "neutral": 5.4358 }, "explained": { "positive": 5.3234, "negative": 4.8676, "neutral": 5.1249 }, "explode": { "positive": 6.1227, "negative": 4.3649, "neutral": 4.4254 }, "exploding": { "positive": 6.1227, "negative": 3.4521, "neutral": 3.5126 }, "exploit": { "positive": 3.9796, "negative": 6.1746, "neutral": 4.092 }, "exploited": { "positive": 4.8157, "negative": 6.1746, "neutral": 4.9281 }, "exploiting": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "exploits": { "positive": 4.8157, "negative": 5.3754, "neutral": 5.1249 }, "export": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "exposes": { "positive": 4.8157, "negative": 5.3754, "neutral": 5.1249 }, "extension": { "positive": 4.8157, "negative": 4.8676, "neutral": 5.1249 }, "eye": { "positive": 5.3234, "negative": 4.6094, "neutral": 4.7838 }, "eyes": { "positive": 4.6714, "negative": 4.4349, "neutral": 4.6698 }, "face": { "positive": 4.6714, "negative": 5.0644, "neutral": 4.7838 }, "facebook": { "positive": 4.8157, "negative": 5.3754, "neutral": 4.7838 }, "faces": { "positive": 4.3829, "negative": 4.8676, "neutral": 4.5756 }, "faces sec": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "facts": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "fade": { "positive": 5.3234, "negative": 5.0644, "neutral": 4.9281 }, "fades": { "positive": 5.3234, "negative": 5.3754, "neutral": 5.1249 }, "fail": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "failed": { "positive": 3.3645, "negative": 6.1746, "neutral": 3.4768 }, "failed crypto": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "failed stablecoin": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "failing": { "positive": 4.8157, "negative": 6.1746, "neutral": 4.9281 }, "fails": { "positive": 4.6714, "negative": 6.1746, "neutral": 4.7838 }, "failure": { "positive": 4.5575, "negative": 6.1746, "neutral": 4.6698 }, "fair": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "fake": { "positive": 3.7055, "negative": 6.1746, "neutral": 3.8179 }, "fake tesla": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "fall": { "positive": 4.5575, "negative": 5.3754, "neutral": 4.7838 }, "falling": { "positive": 4.6714, "negative": 5.0644, "neutral": 4.5756 }, "falling wedge": { "positive": 5.3234, "negative": 5.0644, "neutral": 4.9281 }, "falls": { "positive": 4.8157, "negative": 6.1746, "neutral": 4.9281 }, "fam": { "positive": 6.1227, "negative": 4.8676, "neutral": 4.9281 }, "families": { "positive": 5.3234, "negative": 5.3754, "neutral": 5.1249 }, "fan": { "positive": 5.3234, "negative": 5.3754, "neutral": 5.1249 }, "far": { "positive": 4.313, "negative": 4.3649, "neutral": 4.5756 }, "farm": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "fashion": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "fast": { "positive": 4.251, "negative": 4.1079, "neutral": 4.211 }, "fast low": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "faster": { "positive": 6.1227, "negative": 4.7233, "neutral": 4.7838 }, "faster than": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "favorite": { "positive": 4.5575, "negative": 4.3649, "neutral": 4.9281 }, "favorite staking": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "favorites": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "fbi": { "positive": 4.313, "negative": 4.8676, "neutral": 4.6698 }, "fbnsx": { "positive": 5.3234, "negative": 4.5152, "neutral": 4.4953 }, "fbnsx eiejem": { "positive": 5.3234, "negative": 4.5152, "neutral": 4.4953 }, "fear": { "positive": 4.5575, "negative": 6.1746, "neutral": 4.6698 }, "feature": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "features": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "fed": { "positive": 5.3234, "negative": 5.3754, "neutral": 5.1249 }, "federal": { "positive": 4.8157, "negative": 6.1746, "neutral": 4.9281 }, "feds": { "positive": 4.5575, "negative": 5.3754, "neutral": 4.7838 }, "feds seized": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "fee": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "feedback": { "positive": 5.0125, "negative": 4.8676, "neutral": 5.4358 }, "feeds": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "feel": { "positive": 5.0125, "negative": 4.2472, "neutral": 4.211 }, "feel good": { "positive": 6.1227, "negative": 4.6094, "neutral": 4.6698 }, "feel like": { "positive": 6.1227, "negative": 4.8676, "neutral": 4.9281 }, "feeling": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "feels": { "positive": 6.1227, "negative": 4.3029, "neutral": 4.3634 }, "feels good": { "positive": 6.1227, "negative": 4.4349, "neutral": 4.4953 }, "fees": { "positive": 4.6714, "negative": 3.7794, "neutral": 3.8867 }, "fees dropped": { "positive": 6.1227, "negative": 3.997, "neutral": 4.0575 }, "few": { "positive": 5.0125, "negative": 4.3029, "neutral": 4.4953 }, "few months": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "fiat": { "positive": 4.6714, "negative": 4.8676, "neutral": 4.9281 }, "fidelity": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "figures": { "positive": 4.8157, "negative": 5.0644, "neutral": 4.9281 }, "fil": { "positive": 4.8157, "negative": 4.7233, "neutral": 5.4358 }, "file": { "positive": 4.5575, "negative": 4.4349, "neutral": 5.1249 }, "file coin": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "filecoin": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "filed": { "positive": 4.251, "negative": 6.1746, "neutral": 4.3634 }, "filed lawsuit": { "positive": 4.313, "negative": 6.1746, "neutral": 4.4254 }, "files": { "positive": 4.0165, "negative": 4.7233, "neutral": 4.211 }, "files bankruptcy": { "positive": 4.313, "negative": 6.1746, "neutral": 4.4254 }, "filing": { "positive": 4.6714, "negative": 5.0644, "neutral": 5.1249 }, "filings": { "positive": 5.3234, "negative": 5.3754, "neutral": 5.1249 }, "filling": { "positive": 5.0125, "negative": 5.0644, "neutral": 5.1249 }, "filter": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "final": { "positive": 5.3234, "negative": 5.3754, "neutral": 5.1249 }, "finally": { "positive": 5.0125, "negative": 4.3649, "neutral": 4.3077 }, "finance": { "positive": 4.1448, "negative": 4.3029, "neutral": 4.4254 }, "finance app": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "finance bitcoin": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "finances": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "financial": { "positive": 4.056, "negative": 4.4349, "neutral": 4.3077 }, "financial advice": { "positive": 5.3234, "negative": 5.0644, "neutral": 4.9281 }, "financial crisis": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "financial system": { "positive": 4.8157, "negative": 5.0644, "neutral": 5.4358 }, "find": { "positive": 4.6714, "negative": 4.8676, "neutral": 4.6698 }, "finds": { "positive": 5.3234, "negative": 5.3754, "neutral": 5.1249 }, "fine": { "positive": 5.3234, "negative": 5.0644, "neutral": 4.9281 }, "fintech": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "fire": { "positive": 5.0125, "negative": 4.8676, "neutral": 4.9281 }, "firm": { "positive": 4.3829, "negative": 4.4349, "neutral": 4.3077 }, "firm soar": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "firms": { "positive": 4.8157, "negative": 6.1746, "neutral": 4.9281 }, "first": { "positive": 3.5396, "negative": 3.5037, "neutral": 3.8399 }, "first crypto": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "first day": { "positive": 5.3234, "negative": 5.3754, "neutral": 5.1249 }, "first ever": { "positive": 4.8157, "negative": 4.8676, "neutral": 5.1249 }, "first quarter": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "first time": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "fish": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "five": { "positive": 5.0125, "negative": 5.3754, "neutral": 4.9281 }, "fix": { "positive": 4.6714, "negative": 5.3754, "neutral": 4.9281 }, "flag": { "positive": 4.6714, "negative": 6.1746, "neutral": 4.7838 }, "flat": { "positive": 4.6714, "negative": 6.1746, "neutral": 4.7838 }, "flat never": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "floods": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "floor": { "positive": 5.3234, "negative": 4.8676, "neutral": 5.1249 }, "florida": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "fly": { "positive": 4.8157, "negative": 4.3029, "neutral": 4.5756 }, "fly price": { "positive": 6.1227, "negative": 4.8676, "neutral": 4.9281 }, "focus": { "positive": 5.3234, "negative": 5.3754, "neutral": 5.1249 }, "focused": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "focused company": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "follow": { "positive": 6.1227, "negative": 4.8676, "neutral": 4.9281 }, "followed": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "followers": { "positive": 6.1227, "negative": 4.6094, "neutral": 4.6698 }, "followers friends": { "positive": 6.1227, "negative": 4.6094, "neutral": 4.6698 }, "following": { "positive": 4.6714, "negative": 5.0644, "neutral": 4.5756 }, "follows": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "fomo": { "positive": 6.1227, "negative": 4.8676, "neutral": 4.9281 }, "forbes": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "force": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "forced": { "positive": 4.8157, "negative": 6.1746, "neutral": 4.9281 }, "forever": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "forget": { "positive": 6.1227, "negative": 4.8676, "neutral": 4.9281 }, "forgotten": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "fork": { "positive": 4.5575, "negative": 4.7233, "neutral": 5.4358 }, "format": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "former": { "positive": 4.6714, "negative": 5.0644, "neutral": 4.7838 }, "forming": { "positive": 5.3234, "negative": 5.3754, "neutral": 5.1249 }, "forms": { "positive": 5.3234, "negative": 5.3754, "neutral": 5.1249 }, "found": { "positive": 4.313, "negative": 4.8676, "neutral": 4.4953 }, "foundation": { "positive": 4.5575, "negative": 4.4349, "neutral": 4.7838 }, "foundation announces": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "founder": { "positive": 3.7055, "negative": 4.4349, "neutral": 3.9944 }, "founder changpeng": { "positive": 4.8157, "negative": 5.3754, "neutral": 5.1249 }, "founder hobnobs": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "founder's": { "positive": 5.3234, "negative": 5.3754, "neutral": 5.1249 }, "founders": { "positive": 4.6714, "negative": 4.6094, "neutral": 5.4358 }, "four": { "positive": 5.0125, "negative": 5.3754, "neutral": 4.9281 }, "fourth": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "fraction": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "fraction ing": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "framework": { "positive": 4.5575, "negative": 4.6094, "neutral": 5.1249 }, "fraud": { "positive": 3.9451, "negative": 6.1746, "neutral": 4.0575 }, "fraudulent": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "free": { "positive": 4.1448, "negative": 4.1967, "neutral": 4.7838 }, "free service": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "freezes": { "positive": 4.5575, "negative": 6.1746, "neutral": 4.6698 }, "friday": { "positive": 5.0125, "negative": 4.6094, "neutral": 4.6698 }, "fried": { "positive": 4.6714, "negative": 5.3754, "neutral": 4.9281 }, "fried going": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "friends": { "positive": 5.3234, "negative": 4.6094, "neutral": 4.5756 }, "front": { "positive": 5.0125, "negative": 4.8676, "neutral": 5.4358 }, "frozen": { "positive": 4.4632, "negative": 6.1746, "neutral": 4.5756 }, "ftc": { "positive": 4.6714, "negative": 6.1746, "neutral": 4.7838 }, "ftx": { "positive": 3.7275, "negative": 4.6094, "neutral": 3.9654 }, "ftx collapse": { "positive": 4.6714, "negative": 6.1746, "neutral": 4.7838 }, "ftx crypto": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "ftx files": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "fuck": { "positive": 4.0986, "negative": 6.1746, "neutral": 4.211 }, "fucked": { "positive": 4.6714, "negative": 6.1746, "neutral": 4.7838 }, "fucking": { "positive": 4.4632, "negative": 4.5152, "neutral": 4.3077 }, "fud": { "positive": 5.3234, "negative": 5.3754, "neutral": 5.1249 }, "fueled": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "full": { "positive": 5.3234, "negative": 5.0644, "neutral": 4.9281 }, "fully": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "fun": { "positive": 6.1227, "negative": 4.5152, "neutral": 4.5756 }, "fund": { "positive": 4.251, "negative": 4.6094, "neutral": 4.5756 }, "fundamentals": { "positive": 3.6444, "negative": 3.3938, "neutral": 3.2234 }, "fundamentals strong": { "positive": 6.1227, "negative": 3.4164, "neutral": 3.4768 }, "fundamentals weak": { "positive": 3.664, "negative": 6.1746, "neutral": 3.7764 }, "funded": { "positive": 5.3234, "negative": 5.3754, "neutral": 5.1249 }, "funding": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "funds": { "positive": 3.664, "negative": 4.7233, "neutral": 3.7379 }, "funds lying": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "fungible": { "positive": 4.8157, "negative": 4.8676, "neutral": 6.2351 }, "further": { "positive": 6.1227, "negative": 4.8676, "neutral": 4.9281 }, "further dilution": { "positive": 6.1227, "negative": 4.8676, "neutral": 4.9281 }, "future": { "positive": 4.251, "negative": 3.997, "neutral": 4.1684 }, "future blockchain": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "future finance": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "futures": { "positive": 5.0125, "negative": 4.7233, "neutral": 5.1249 }, "futures ethereum": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "gain": { "positive": 5.3234, "negative": 4.1079, "neutral": 4.1289 }, "gains": { "positive": 5.0125, "negative": 3.934, "neutral": 3.9379 }, "gains clarity": { "positive": 6.1227, "negative": 4.8676, "neutral": 4.9281 }, "gambling": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "game": { "positive": 4.3829, "negative": 4.4349, "neutral": 4.7838 }, "games": { "positive": 4.8157, "negative": 4.8676, "neutral": 4.7838 }, "gaming": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "gap": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "garbage": { "positive": 3.7993, "negative": 6.1746, "neutral": 3.9117 }, "garbage never": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "garbage piece": { "positive": 4.5575, "negative": 6.1746, "neutral": 4.6698 }, "gas": { "positive": 4.5575, "negative": 4.7233, "neutral": 5.4358 }, "gas fees": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "gave": { "positive": 5.3234, "negative": 4.8676, "neutral": 5.1249 }, "gd": { "positive": 4.6714, "negative": 5.3754, "neutral": 4.9281 }, "gd dm": { "positive": 4.6714, "negative": 5.3754, "neutral": 4.9281 }, "gem": { "positive": 6.1227, "negative": 4.7233, "neutral": 4.7838 }, "gemini": { "positive": 4.6714, "negative": 5.3754, "neutral": 4.9281 }, "gen": { "positive": 4.5575, "negative": 4.5152, "neutral": 5.4358 }, "generated": { "positive": 4.6714, "negative": 4.8676, "neutral": 5.4358 }, "generations": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "genesis": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "gensyn": { "positive": 5.3234, "negative": 4.8676, "neutral": 5.1249 }, "gensyn artificial": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "get": { "positive": 3.5895, "negative": 3.4399, "neutral": 3.4885 }, "get back": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "get hacked": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "get power": { "positive": 6.1227, "negative": 4.8676, "neutral": 4.9281 }, "get ready": { "positive": 4.8157, "negative": 4.8676, "neutral": 4.7838 }, "get richer": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "get started": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "gets": { "positive": 4.4632, "negative": 4.1967, "neutral": 4.2572 }, "getting": { "positive": 3.2412, "negative": 4.0315, "neutral": 3.3445 }, "getting closer": { "positive": 5.0125, "negative": 5.3754, "neutral": 4.9281 }, "getting rekt": { "positive": 3.4002, "negative": 6.1746, "neutral": 3.5126 }, "getting trending": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "giant": { "positive": 4.313, "negative": 5.0644, "neutral": 4.5756 }, "giants": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "gig": { "positive": 5.0125, "negative": 5.0644, "neutral": 5.1249 }, "git": { "positive": 4.8157, "negative": 4.8676, "neutral": 6.2351 }, "github": { "positive": 4.5575, "negative": 4.7233, "neutral": 4.9281 }, "github repo": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "give": { "positive": 4.5575, "negative": 4.3029, "neutral": 4.7838 }, "giveaway": { "positive": 4.8157, "negative": 5.3754, "neutral": 5.1249 }, "gives": { "positive": 5.0125, "negative": 4.8676, "neutral": 5.4358 }, "giving": { "positive": 5.3234, "negative": 4.8676, "neutral": 5.1249 }, "giving out": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "glad": { "positive": 6.1227, "negative": 4.7233, "neutral": 4.7838 }, "global": { "positive": 4.0986, "negative": 4.3649, "neutral": 4.4254 }, "global bitcoin": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "global payment": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "glta": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "gm": { "positive": 6.1227, "negative": 4.5152, "neutral": 4.5756 }, "go": { "positive": 3.6844, "negative": 3.4645, "neutral": 3.525 }, "go $updog": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "go time": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "go up": { "positive": 4.8157, "negative": 4.7233, "neutral": 4.9281 }, "goal": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "god": { "positive": 5.3234, "negative": 4.3029, "neutral": 4.4254 }, "god great": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "gods": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "goes": { "positive": 4.056, "negative": 4.2472, "neutral": 4.092 }, "goes back": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "goes down": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "goes ing": { "positive": 4.8157, "negative": 6.1746, "neutral": 4.9281 }, "goes parabolic": { "positive": 6.1227, "negative": 4.8676, "neutral": 4.9281 }, "goes up": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "going": { "positive": 3.7055, "negative": 3.5037, "neutral": 3.6063 }, "going back": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "going down": { "positive": 5.3234, "negative": 5.3754, "neutral": 5.1249 }, "going moon": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "going prison": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "going up": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "going zero": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "gold": { "positive": 3.9127, "negative": 4.3029, "neutral": 3.9944 }, "gold instead": { "positive": 4.0986, "negative": 6.1746, "neutral": 4.211 }, "goldman": { "positive": 4.8157, "negative": 5.3754, "neutral": 5.1249 }, "gone": { "positive": 4.3829, "negative": 4.3649, "neutral": 4.2572 }, "gone $cro": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "gonna": { "positive": 4.6714, "negative": 4.3649, "neutral": 4.3077 }, "good": { "positive": 4.3829, "negative": 3.3312, "neutral": 3.3267 }, "good day": { "positive": 5.3234, "negative": 5.0644, "neutral": 4.9281 }, "good luck": { "positive": 5.3234, "negative": 5.3754, "neutral": 5.1249 }, "good man": { "positive": 6.1227, "negative": 4.2472, "neutral": 4.3077 }, "good morning": { "positive": 6.1227, "negative": 4.6094, "neutral": 4.6698 }, "good news": { "positive": 5.3234, "negative": 5.0644, "neutral": 4.9281 }, "good riddance": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "good spot": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "good time": { "positive": 6.1227, "negative": 4.8676, "neutral": 4.9281 }, "google": { "positive": 4.5575, "negative": 4.7233, "neutral": 4.6698 }, "google cloud": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "got": { "positive": 3.7993, "negative": 3.9646, "neutral": 3.7196 }, "got hacked": { "positive": 4.4632, "negative": 6.1746, "neutral": 4.5756 }, "gotta": { "positive": 5.3234, "negative": 4.8676, "neutral": 5.1249 }, "gotta love": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "gov": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "gov't": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "government": { "positive": 4.3829, "negative": 4.6094, "neutral": 4.5756 }, "gox": { "positive": 4.4632, "negative": 5.3754, "neutral": 4.6698 }, "gox crypto": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "gpu": { "positive": 4.6714, "negative": 4.6094, "neutral": 5.4358 }, "grabbed": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "graph": { "positive": 4.6714, "negative": 4.7233, "neutral": 6.2351 }, "graphics": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "grayscale": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "great": { "positive": 6.1227, "negative": 3.1212, "neutral": 3.1816 }, "great again": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "great crypto": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "great news": { "positive": 6.1227, "negative": 4.7233, "neutral": 4.7838 }, "great see": { "positive": 6.1227, "negative": 4.6094, "neutral": 4.6698 }, "great seeing": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "great such": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "great time": { "positive": 6.1227, "negative": 3.8262, "neutral": 3.8867 }, "great utility": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "great week": { "positive": 6.1227, "negative": 4.8676, "neutral": 4.9281 }, "great weekend": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "greatest": { "positive": 5.0125, "negative": 5.0644, "neutral": 5.1249 }, "green": { "positive": 6.1227, "negative": 3.8023, "neutral": 3.8628 }, "green candle": { "positive": 6.1227, "negative": 4.8676, "neutral": 4.9281 }, "green green": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "grok": { "positive": 6.1227, "negative": 4.8676, "neutral": 4.9281 }, "group": { "positive": 4.4632, "negative": 4.7233, "neutral": 4.7838 }, "growing": { "positive": 5.0125, "negative": 4.4349, "neutral": 4.6698 }, "growing $updog": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "grows": { "positive": 5.3234, "negative": 4.8676, "neutral": 5.1249 }, "growth": { "positive": 5.0125, "negative": 4.6094, "neutral": 4.9281 }, "guaranteed": { "positive": 5.0125, "negative": 5.0644, "neutral": 5.1249 }, "guess": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "guide": { "positive": 4.6714, "negative": 4.7233, "neutral": 5.1249 }, "guilty": { "positive": 4.1953, "negative": 6.1746, "neutral": 4.3077 }, "guilty hacking": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "guilty money": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "gunna": { "positive": 5.3234, "negative": 5.3754, "neutral": 5.1249 }, "guns": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "guy": { "positive": 5.0125, "negative": 5.0644, "neutral": 4.7838 }, "guys": { "positive": 4.313, "negative": 4.6094, "neutral": 4.2572 }, "hack": { "positive": 3.2056, "negative": 6.1746, "neutral": 3.318 }, "hack drained": { "positive": 4.313, "negative": 6.1746, "neutral": 4.4254 }, "hacked": { "positive": 3.3761, "negative": 5.3754, "neutral": 3.4768 }, "hacked bitcoin": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "hacked crypto": { "positive": 4.8157, "negative": 6.1746, "neutral": 4.9281 }, "hacker": { "positive": 4.0986, "negative": 4.7233, "neutral": 4.211 }, "hacker behind": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "hacker news": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "hackers": { "positive": 3.4939, "negative": 6.1746, "neutral": 3.6063 }, "hackers behind": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "hackers drain": { "positive": 4.8157, "negative": 6.1746, "neutral": 4.9281 }, "hackers steal": { "positive": 4.5575, "negative": 6.1746, "neutral": 4.6698 }, "hackers use": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "hackers using": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "hacking": { "positive": 4.4632, "negative": 4.8676, "neutral": 4.9281 }, "hacking crypto": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "hacks": { "positive": 4.3829, "negative": 5.0644, "neutral": 4.6698 }, "half": { "positive": 4.5575, "negative": 5.3754, "neutral": 4.5756 }, "halt": { "positive": 4.4632, "negative": 6.1746, "neutral": 4.5756 }, "halted": { "positive": 4.8157, "negative": 6.1746, "neutral": 4.9281 }, "halts": { "positive": 4.0986, "negative": 6.1746, "neutral": 4.211 }, "halts all": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "halts withdrawals": { "positive": 4.8157, "negative": 6.1746, "neutral": 4.9281 }, "halving": { "positive": 5.0125, "negative": 4.7233, "neutral": 5.1249 }, "hand": { "positive": 5.0125, "negative": 4.7233, "neutral": 5.1249 }, "handle": { "positive": 5.3234, "negative": 5.3754, "neutral": 5.1249 }, "hands": { "positive": 3.4654, "negative": 4.6094, "neutral": 3.5126 }, "hands shaken": { "positive": 3.4654, "negative": 6.1746, "neutral": 3.5778 }, "happen": { "positive": 4.8157, "negative": 4.8676, "neutral": 4.7838 }, "happened": { "positive": 4.8157, "negative": 5.0644, "neutral": 4.9281 }, "happening": { "positive": 4.0986, "negative": 4.0315, "neutral": 4.6698 }, "happy": { "positive": 6.1227, "negative": 4.4349, "neutral": 4.4953 }, "hard": { "positive": 4.313, "negative": 4.2472, "neutral": 4.3077 }, "harder": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "hardware": { "positive": 4.5575, "negative": 4.8676, "neutral": 5.1249 }, "hashes": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "hashrate": { "positive": 4.8157, "negative": 4.8676, "neutral": 5.1249 }, "hasn": { "positive": 5.3234, "negative": 5.0644, "neutral": 4.9281 }, "hate": { "positive": 4.8157, "negative": 6.1746, "neutral": 4.9281 }, "haters": { "positive": 4.8157, "negative": 5.3754, "neutral": 5.1249 }, "haven": { "positive": 5.3234, "negative": 4.7233, "neutral": 4.9281 }, "hayes": { "positive": 6.1227, "negative": 4.8676, "neutral": 4.9281 }, "head": { "positive": 4.8157, "negative": 4.8676, "neutral": 5.1249 }, "headed": { "positive": 4.5575, "negative": 4.8676, "neutral": 4.7838 }, "healthy": { "positive": 6.1227, "negative": 4.8676, "neutral": 4.9281 }, "heap": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "heating": { "positive": 5.0125, "negative": 4.7233, "neutral": 5.1249 }, "heating up": { "positive": 5.0125, "negative": 4.7233, "neutral": 5.1249 }, "heavy": { "positive": 4.8157, "negative": 5.3754, "neutral": 4.7838 }, "heavy losses": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "hedge": { "positive": 4.8157, "negative": 5.0644, "neutral": 4.9281 }, "hedge fund": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "heist": { "positive": 4.8157, "negative": 6.1746, "neutral": 4.9281 }, "held": { "positive": 5.3234, "negative": 3.4399, "neutral": 3.4885 }, "held perfectly": { "positive": 6.1227, "negative": 3.4903, "neutral": 3.5508 }, "hell": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "help": { "positive": 4.1448, "negative": 4.5152, "neutral": 4.4953 }, "helped": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "helped crypto": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "helping": { "positive": 5.3234, "negative": 5.3754, "neutral": 5.1249 }, "helps": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "here": { "positive": 3.2412, "negative": 2.7545, "neutral": 2.9502 }, "here chart": { "positive": 6.1227, "negative": 4.3029, "neutral": 4.3634 }, "here comes": { "positive": 4.4632, "negative": 5.3754, "neutral": 4.6698 }, "here don": { "positive": 5.3234, "negative": 5.3754, "neutral": 5.1249 }, "here even": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "here fundamentals": { "positive": 6.1227, "negative": 4.1079, "neutral": 4.1684 }, "here gain": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "here great": { "positive": 6.1227, "negative": 4.8676, "neutral": 4.9281 }, "here just": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "here lol": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "here market": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "here momentum": { "positive": 6.1227, "negative": 4.4349, "neutral": 4.4953 }, "here see": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "here smart": { "positive": 6.1227, "negative": 4.3649, "neutral": 4.4254 }, "here so": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "here support": { "positive": 6.1227, "negative": 4.3649, "neutral": 4.4254 }, "here undeniable": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "here volume": { "positive": 6.1227, "negative": 4.2472, "neutral": 4.3077 }, "here's": { "positive": 4.8157, "negative": 4.8676, "neutral": 5.1249 }, "hey": { "positive": 5.3234, "negative": 5.3754, "neutral": 5.1249 }, "hgp": { "positive": 5.0125, "negative": 4.8676, "neutral": 5.4358 }, "hidden": { "positive": 5.0125, "negative": 4.8676, "neutral": 5.4358 }, "hide": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "hiding": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "high": { "positive": 4.4632, "negative": 3.1851, "neutral": 3.2456 }, "high adoption": { "positive": 6.1227, "negative": 4.5152, "neutral": 4.5756 }, "high etf": { "positive": 6.1227, "negative": 4.4349, "neutral": 4.4953 }, "high fees": { "positive": 6.1227, "negative": 4.3029, "neutral": 4.3634 }, "high institutional": { "positive": 6.1227, "negative": 4.3029, "neutral": 4.3634 }, "high major": { "positive": 6.1227, "negative": 4.4349, "neutral": 4.4953 }, "high network": { "positive": 6.1227, "negative": 4.3649, "neutral": 4.4254 }, "high spot": { "positive": 6.1227, "negative": 4.8676, "neutral": 4.9281 }, "high watch": { "positive": 6.1227, "negative": 4.3649, "neutral": 4.4254 }, "higher": { "positive": 5.0125, "negative": 4.1967, "neutral": 4.3634 }, "higher $updog": { "positive": 6.1227, "negative": 4.7233, "neutral": 4.7838 }, "highly": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "highs": { "positive": 5.0125, "negative": 4.0684, "neutral": 4.211 }, "historically": { "positive": 5.3234, "negative": 5.0644, "neutral": 4.9281 }, "history": { "positive": 4.5575, "negative": 5.3754, "neutral": 4.7838 }, "hit": { "positive": 3.9796, "negative": 3.5759, "neutral": 3.5641 }, "hit new": { "positive": 5.3234, "negative": 4.1967, "neutral": 4.3077 }, "hit record": { "positive": 5.3234, "negative": 4.0315, "neutral": 4.0575 }, "hits": { "positive": 4.0986, "negative": 4.1079, "neutral": 4.2572 }, "hitting": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "hj": { "positive": 6.1227, "negative": 4.8676, "neutral": 4.9281 }, "hj rrz": { "positive": 6.1227, "negative": 4.8676, "neutral": 4.9281 }, "hn": { "positive": 2.5916, "negative": 2.6751, "neutral": 3.5004 }, "hn ai": { "positive": 4.5575, "negative": 4.6094, "neutral": 6.2351 }, "hn am": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "hn anyone": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "hn bitcoin": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "hn built": { "positive": 4.251, "negative": 4.3029, "neutral": 6.2351 }, "hn burnshot": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "hn create": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "hn crypto": { "positive": 4.4632, "negative": 4.6094, "neutral": 5.4358 }, "hn decentralized": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "hn how": { "positive": 4.3829, "negative": 4.3649, "neutral": 5.4358 }, "hn made": { "positive": 5.0125, "negative": 4.8676, "neutral": 5.4358 }, "hn new": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "hn open": { "positive": 4.8157, "negative": 4.8676, "neutral": 6.2351 }, "hn what's": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "hn why": { "positive": 4.4632, "negative": 4.6094, "neutral": 5.4358 }, "hobnobs": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "hobnobs trump": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "hodlers": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "hodlnaut": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "hold": { "positive": 4.6714, "negative": 3.9646, "neutral": 3.9117 }, "holder": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "holders": { "positive": 4.6714, "negative": 4.5152, "neutral": 4.5756 }, "holding": { "positive": 3.5557, "negative": 3.4773, "neutral": 3.5778 }, "holding $btc": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "holding $sol": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "holding ada": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "holding bitcoin": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "holding bnb": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "holding dear": { "positive": 5.3234, "negative": 5.3754, "neutral": 5.1249 }, "holding eth": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "holding ethereum": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "holding long": { "positive": 6.1227, "negative": 4.8676, "neutral": 4.9281 }, "holding market": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "holding solana": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "holding strong": { "positive": 6.1227, "negative": 4.8676, "neutral": 4.9281 }, "holding up": { "positive": 5.3234, "negative": 4.6094, "neutral": 4.7838 }, "holding xrp": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "holds": { "positive": 5.0125, "negative": 5.0644, "neutral": 5.1249 }, "holy": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "home": { "positive": 4.3829, "negative": 4.4349, "neutral": 4.7838 }, "homepage": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "honestly": { "positive": 5.3234, "negative": 5.3754, "neutral": 5.1249 }, "hong": { "positive": 4.8157, "negative": 5.0644, "neutral": 5.4358 }, "hong kong": { "positive": 4.8157, "negative": 5.0644, "neutral": 5.4358 }, "hood": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "hope": { "positive": 5.0125, "negative": 4.5152, "neutral": 4.5756 }, "hopeful": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "hopefully": { "positive": 5.3234, "negative": 4.8676, "neutral": 4.7838 }, "hopes": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "hophn": { "positive": 5.3234, "negative": 4.5152, "neutral": 4.4953 }, "hophn fbnsx": { "positive": 5.3234, "negative": 4.5152, "neutral": 4.4953 }, "hoping": { "positive": 6.1227, "negative": 4.8676, "neutral": 4.9281 }, "hopium": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "horizon": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "horrible": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "hoskinson": { "positive": 5.3234, "negative": 5.3754, "neutral": 5.1249 }, "hosted": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "hosting": { "positive": 4.8157, "negative": 4.8676, "neutral": 6.2351 }, "hot": { "positive": 4.8157, "negative": 4.7233, "neutral": 4.6698 }, "hours": { "positive": 4.1953, "negative": 5.0644, "neutral": 4.3077 }, "house": { "positive": 4.5575, "negative": 4.8676, "neutral": 5.1249 }, "how": { "positive": 3.1971, "negative": 3.3024, "neutral": 3.5641 }, "how bitcoin": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "how build": { "positive": 4.6714, "negative": 4.7233, "neutral": 6.2351 }, "how create": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "how crypto": { "positive": 4.8157, "negative": 6.1746, "neutral": 4.9281 }, "how get": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "how long": { "positive": 6.1227, "negative": 4.8676, "neutral": 4.9281 }, "how make": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "how trump's": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "hub": { "positive": 4.8157, "negative": 5.3754, "neutral": 5.1249 }, "huge": { "positive": 4.4632, "negative": 4.1967, "neutral": 4.2572 }, "huge news": { "positive": 5.3234, "negative": 4.8676, "neutral": 5.1249 }, "huge win": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "human": { "positive": 4.5575, "negative": 4.7233, "neutral": 4.9281 }, "humans": { "positive": 4.8157, "negative": 5.3754, "neutral": 5.1249 }, "hunt": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "hunting": { "positive": 5.0125, "negative": 5.0644, "neutral": 5.1249 }, "hurry": { "positive": 6.1227, "negative": 4.8676, "neutral": 4.9281 }, "hurry up": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "hype": { "positive": 4.5575, "negative": 4.7233, "neutral": 4.9281 }, "hyperliquid": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "i'm": { "positive": 4.5575, "negative": 4.3649, "neutral": 4.6698 }, "i've": { "positive": 5.0125, "negative": 4.8676, "neutral": 4.6698 }, "ian": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "ico": { "positive": 4.5575, "negative": 4.8676, "neutral": 5.1249 }, "icp": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "id": { "positive": 4.8157, "negative": 4.8676, "neutral": 5.1249 }, "idea": { "positive": 4.6714, "negative": 4.7233, "neutral": 4.7838 }, "idiot": { "positive": 4.8157, "negative": 6.1746, "neutral": 4.9281 }, "ignore": { "positive": 4.8157, "negative": 5.0644, "neutral": 4.9281 }, "illegal": { "positive": 4.251, "negative": 6.1746, "neutral": 4.3634 }, "illegal crypto": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "illicit": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "im": { "positive": 5.3234, "negative": 4.5152, "neutral": 4.4953 }, "image": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "images": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "imagine": { "positive": 4.5575, "negative": 4.3029, "neutral": 4.4254 }, "imagine buying": { "positive": 5.3234, "negative": 5.3754, "neutral": 5.1249 }, "imf": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "imminent": { "positive": 5.0125, "negative": 5.3754, "neutral": 4.9281 }, "immutability": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "imo": { "positive": 5.3234, "negative": 4.7233, "neutral": 4.6698 }, "impact": { "positive": 4.6714, "negative": 5.3754, "neutral": 4.9281 }, "implementation": { "positive": 4.6714, "negative": 4.7233, "neutral": 6.2351 }, "important": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "impressive": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "incoming": { "positive": 5.3234, "negative": 4.5152, "neutral": 4.4953 }, "incoming stated": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "increasingly": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "index": { "positive": 5.0125, "negative": 4.7233, "neutral": 5.1249 }, "indexer": { "positive": 5.3234, "negative": 4.8676, "neutral": 5.1249 }, "india": { "positive": 4.5575, "negative": 5.3754, "neutral": 4.7838 }, "india propose": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "indian": { "positive": 4.6714, "negative": 5.3754, "neutral": 4.9281 }, "indian crypto": { "positive": 4.8157, "negative": 6.1746, "neutral": 4.9281 }, "indicator": { "positive": 5.3234, "negative": 5.0644, "neutral": 4.9281 }, "indicted": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "industry": { "positive": 4.251, "negative": 4.3649, "neutral": 4.3634 }, "industry isn't": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "infamous": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "infamous hacker": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "infinite": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "inflation": { "positive": 4.5575, "negative": 4.8676, "neutral": 4.7838 }, "inflows": { "positive": 5.0125, "negative": 3.9646, "neutral": 4.0251 }, "inflows hit": { "positive": 6.1227, "negative": 4.0315, "neutral": 4.092 }, "information": { "positive": 4.8157, "negative": 5.3754, "neutral": 5.1249 }, "information stolen": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "infra": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "infrastructure": { "positive": 4.6714, "negative": 4.5152, "neutral": 4.7838 }, "ing": { "positive": 3.5557, "negative": 4.6094, "neutral": 3.7196 }, "ing cent": { "positive": 4.8157, "negative": 5.0644, "neutral": 5.4358 }, "ing dumping": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "ing figures": { "positive": 5.0125, "negative": 5.3754, "neutral": 4.9281 }, "ing garbage": { "positive": 3.9796, "negative": 6.1746, "neutral": 4.092 }, "ing penny": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "ing trash": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "inj": { "positive": 6.1227, "negative": 4.7233, "neutral": 4.7838 }, "injective": { "positive": 6.1227, "negative": 4.4349, "neutral": 4.4953 }, "input": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "insane": { "positive": 5.0125, "negative": 4.8676, "neutral": 4.9281 }, "inside": { "positive": 5.0125, "negative": 5.0644, "neutral": 5.1249 }, "insider": { "positive": 4.6714, "negative": 5.0644, "neutral": 5.1249 }, "insider trading": { "positive": 4.6714, "negative": 5.0644, "neutral": 5.1249 }, "insolvent": { "positive": 4.8157, "negative": 6.1746, "neutral": 4.9281 }, "install": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "instant": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "instead": { "positive": 3.1563, "negative": 5.0644, "neutral": 3.2846 }, "instead $btc": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "instead $eth": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "instead ada": { "positive": 4.8157, "negative": 6.1746, "neutral": 4.9281 }, "instead altcoins": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "instead avax": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "instead bnb": { "positive": 4.8157, "negative": 6.1746, "neutral": 4.9281 }, "instead btc": { "positive": 4.8157, "negative": 6.1746, "neutral": 4.9281 }, "instead cardano": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "instead eth": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "instead link": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "instead market": { "positive": 4.8157, "negative": 6.1746, "neutral": 4.9281 }, "instead ripple": { "positive": 4.8157, "negative": 6.1746, "neutral": 4.9281 }, "instead sol": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "instead solana": { "positive": 4.8157, "negative": 6.1746, "neutral": 4.9281 }, "institutional": { "positive": 5.0125, "negative": 3.6963, "neutral": 3.7968 }, "institutional adoption": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "institutional buying": { "positive": 6.1227, "negative": 3.8512, "neutral": 3.9117 }, "institutions": { "positive": 6.1227, "negative": 4.8676, "neutral": 4.9281 }, "intel": { "positive": 4.8157, "negative": 4.5152, "neutral": 4.9281 }, "intel vets": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "intelligence": { "positive": 5.0125, "negative": 4.6094, "neutral": 4.9281 }, "intelligence token": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "interest": { "positive": 6.1227, "negative": 4.8676, "neutral": 4.9281 }, "interested": { "positive": 5.3234, "negative": 5.3754, "neutral": 5.1249 }, "interesting": { "positive": 5.0125, "negative": 4.6094, "neutral": 4.9281 }, "internet": { "positive": 4.1448, "negative": 4.6094, "neutral": 4.3077 }, "internet shutdown": { "positive": 4.8157, "negative": 6.1746, "neutral": 4.9281 }, "interview": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "intro": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "invest": { "positive": 4.8157, "negative": 4.7233, "neutral": 5.4358 }, "investigation": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "investigators": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "investment": { "positive": 4.1953, "negative": 4.3029, "neutral": 4.092 }, "investment launch": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "investment scam": { "positive": 4.8157, "negative": 6.1746, "neutral": 4.9281 }, "investor": { "positive": 4.8157, "negative": 5.3754, "neutral": 4.7838 }, "investors": { "positive": 3.882, "negative": 4.7233, "neutral": 3.9379 }, "investors wiped": { "positive": 4.0165, "negative": 6.1746, "neutral": 4.1289 }, "io": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "ios": { "positive": 4.8157, "negative": 5.0644, "neutral": 5.4358 }, "iota": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "iphone": { "positive": 4.8157, "negative": 4.8676, "neutral": 6.2351 }, "ipo": { "positive": 5.0125, "negative": 4.5152, "neutral": 4.5756 }, "iran": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "iran's": { "positive": 4.6714, "negative": 5.3754, "neutral": 4.9281 }, "iran's crypto": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "iranian": { "positive": 4.8157, "negative": 5.3754, "neutral": 5.1249 }, "iranian crypto": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "irs": { "positive": 4.6714, "negative": 4.8676, "neutral": 5.4358 }, "isn": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "isn't": { "positive": 4.6714, "negative": 4.7233, "neutral": 4.7838 }, "isn't any": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "issue": { "positive": 4.8157, "negative": 6.1746, "neutral": 4.9281 }, "issuer": { "positive": 5.3234, "negative": 5.0644, "neutral": 4.9281 }, "issues": { "positive": 4.3829, "negative": 6.1746, "neutral": 4.4953 }, "issues warning": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "issuing": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "it's": { "positive": 4.1448, "negative": 4.1967, "neutral": 3.9944 }, "itself": { "positive": 4.8157, "negative": 6.1746, "neutral": 4.9281 }, "jack": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "jackct": { "positive": 6.1227, "negative": 4.8676, "neutral": 4.9281 }, "jail": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "jailed": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "jam": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "jan": { "positive": 5.3234, "negative": 4.8676, "neutral": 5.1249 }, "january": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "japan": { "positive": 5.3234, "negative": 5.3754, "neutral": 5.1249 }, "javascript": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "jk": { "positive": 4.3829, "negative": 4.0684, "neutral": 4.2572 }, "job": { "positive": 4.1448, "negative": 4.5152, "neutral": 4.2572 }, "join": { "positive": 4.8157, "negative": 4.4349, "neutral": 4.5756 }, "joke": { "positive": 4.6714, "negative": 6.1746, "neutral": 4.7838 }, "jonathan": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "jonathan morgan": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "jp": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "jp morgan": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "jpmorgan": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "js": { "positive": 4.5575, "negative": 4.7233, "neutral": 5.4358 }, "js library": { "positive": 4.8157, "negative": 5.0644, "neutral": 5.4358 }, "judge": { "positive": 5.0125, "negative": 5.3754, "neutral": 4.9281 }, "jump": { "positive": 5.3234, "negative": 4.6094, "neutral": 4.7838 }, "jumps": { "positive": 6.1227, "negative": 4.8676, "neutral": 4.9281 }, "june": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "junk": { "positive": 4.8157, "negative": 5.3754, "neutral": 5.1249 }, "just": { "positive": 3.0304, "negative": 3.1702, "neutral": 3.0104 }, "just another": { "positive": 5.3234, "negative": 5.3754, "neutral": 5.1249 }, "just bought": { "positive": 5.3234, "negative": 5.0644, "neutral": 4.9281 }, "just buy": { "positive": 6.1227, "negative": 4.8676, "neutral": 4.9281 }, "just failed": { "positive": 3.5239, "negative": 6.1746, "neutral": 3.6363 }, "just got": { "positive": 5.0125, "negative": 4.8676, "neutral": 4.9281 }, "just great": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "just hoping": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "just keep": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "just like": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "just need": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "just needs": { "positive": 6.1227, "negative": 4.8676, "neutral": 4.9281 }, "just one": { "positive": 5.3234, "negative": 5.3754, "neutral": 5.1249 }, "just pump": { "positive": 6.1227, "negative": 4.7233, "neutral": 4.7838 }, "just went": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "justice": { "positive": 4.8157, "negative": 5.3754, "neutral": 4.7838 }, "justin": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "justin sun": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "kalshi": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "kazakhstan": { "positive": 4.8157, "negative": 6.1746, "neutral": 4.9281 }, "kazakhstan internet": { "positive": 4.8157, "negative": 6.1746, "neutral": 4.9281 }, "kdb": { "positive": 6.1227, "negative": 4.8676, "neutral": 4.9281 }, "kdb usxdgnsl": { "positive": 6.1227, "negative": 4.8676, "neutral": 4.9281 }, "keep": { "positive": 4.1953, "negative": 3.905, "neutral": 3.9117 }, "keep accumulating": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "keep buying": { "positive": 6.1227, "negative": 4.8676, "neutral": 4.9281 }, "keep eye": { "positive": 5.3234, "negative": 4.6094, "neutral": 4.7838 }, "keeping": { "positive": 5.0125, "negative": 5.0644, "neutral": 5.1249 }, "keeps": { "positive": 5.0125, "negative": 4.6094, "neutral": 4.6698 }, "kentucky": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "key": { "positive": 3.8255, "negative": 3.905, "neutral": 4.6698 }, "key levels": { "positive": 3.9451, "negative": 3.997, "neutral": 6.2351 }, "key support": { "positive": 5.3234, "negative": 5.3754, "neutral": 5.1249 }, "keys": { "positive": 4.6714, "negative": 5.0644, "neutral": 5.1249 }, "kicking": { "positive": 5.3234, "negative": 5.3754, "neutral": 5.1249 }, "kicks": { "positive": 6.1227, "negative": 4.7233, "neutral": 4.7838 }, "kicks gone": { "positive": 6.1227, "negative": 4.8676, "neutral": 4.9281 }, "kickstarter": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "kids": { "positive": 5.3234, "negative": 5.3754, "neutral": 5.1249 }, "kill": { "positive": 4.8157, "negative": 5.3754, "neutral": 4.7838 }, "killer": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "kimi": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "kinda": { "positive": 5.3234, "negative": 5.3754, "neutral": 5.1249 }, "king": { "positive": 4.8157, "negative": 5.0644, "neutral": 5.4358 }, "know": { "positive": 4.0986, "negative": 3.997, "neutral": 4.1289 }, "know worth": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "knowing": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "knowledge": { "positive": 4.6714, "negative": 4.6094, "neutral": 5.4358 }, "knowledge proofs": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "known": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "kodak": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "kodakcoin": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "kong": { "positive": 4.8157, "negative": 5.0644, "neutral": 5.4358 }, "kong crypto": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "korea": { "positive": 4.313, "negative": 4.8676, "neutral": 4.4953 }, "korea's": { "positive": 4.8157, "negative": 6.1746, "neutral": 4.9281 }, "korea's crypto": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "korean": { "positive": 4.313, "negative": 6.1746, "neutral": 4.4254 }, "korean crypto": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "korean hackers": { "positive": 4.5575, "negative": 6.1746, "neutral": 4.6698 }, "kraken": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "kwon": { "positive": 4.5575, "negative": 6.1746, "neutral": 4.6698 }, "kwon behind": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "kyc": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "lab": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "labs": { "positive": 4.8157, "negative": 5.0644, "neutral": 4.6698 }, "lady": { "positive": 5.0125, "negative": 5.0644, "neutral": 5.1249 }, "lago": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "lake": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "lambo": { "positive": 5.0125, "negative": 5.0644, "neutral": 5.1249 }, "landed": { "positive": 5.3234, "negative": 4.1505, "neutral": 4.1684 }, "language": { "positive": 4.6714, "negative": 4.7233, "neutral": 6.2351 }, "laptop": { "positive": 5.0125, "negative": 5.3754, "neutral": 4.9281 }, "large": { "positive": 4.8157, "negative": 4.6094, "neutral": 5.1249 }, "large codebases": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "larger": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "largest": { "positive": 4.056, "negative": 4.8676, "neutral": 4.211 }, "largest bitcoin": { "positive": 4.8157, "negative": 6.1746, "neutral": 4.9281 }, "largest crypto": { "positive": 4.6714, "negative": 5.3754, "neutral": 4.9281 }, "largest defi": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "last": { "positive": 4.1448, "negative": 3.8774, "neutral": 3.8628 }, "last buy": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "last month": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "last time": { "positive": 6.1227, "negative": 4.8676, "neutral": 4.9281 }, "last week": { "positive": 5.3234, "negative": 5.3754, "neutral": 5.1249 }, "last year": { "positive": 5.3234, "negative": 5.0644, "neutral": 4.9281 }, "late": { "positive": 4.5575, "negative": 4.7233, "neutral": 4.4953 }, "lately": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "later": { "positive": 4.5575, "negative": 4.8676, "neutral": 4.7838 }, "latest": { "positive": 4.3829, "negative": 4.8676, "neutral": 4.7838 }, "latest crypto": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "launch": { "positive": 5.0125, "negative": 4.1079, "neutral": 4.1684 }, "launch sovereignai": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "launched": { "positive": 5.3234, "negative": 4.8676, "neutral": 5.1249 }, "launches": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "launching": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "launder": { "positive": 4.6714, "negative": 5.3754, "neutral": 4.9281 }, "launder stolen": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "laundered": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "laundering": { "positive": 4.3829, "negative": 6.1746, "neutral": 4.4953 }, "laureate": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "law": { "positive": 4.6714, "negative": 4.8676, "neutral": 5.4358 }, "lawsuit": { "positive": 3.7055, "negative": 6.1746, "neutral": 3.8179 }, "lawsuit dao": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "lawsuit over": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "layer": { "positive": 4.4632, "negative": 4.1967, "neutral": 4.6698 }, "layoffs": { "positive": 4.5575, "negative": 6.1746, "neutral": 4.6698 }, "lays": { "positive": 4.8157, "negative": 5.0644, "neutral": 5.4358 }, "lays off": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "le": { "positive": 6.1227, "negative": 4.8676, "neutral": 4.9281 }, "lead": { "positive": 4.5575, "negative": 4.7233, "neutral": 4.6698 }, "leads": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "learn": { "positive": 4.4632, "negative": 4.3649, "neutral": 4.7838 }, "learned": { "positive": 5.3234, "negative": 5.0644, "neutral": 4.9281 }, "learning": { "positive": 4.6714, "negative": 5.0644, "neutral": 5.1249 }, "least": { "positive": 4.8157, "negative": 4.8676, "neutral": 4.7838 }, "leave": { "positive": 4.6714, "negative": 5.3754, "neutral": 4.9281 }, "leaves": { "positive": 5.0125, "negative": 5.3754, "neutral": 4.9281 }, "leaving": { "positive": 5.3234, "negative": 5.3754, "neutral": 5.1249 }, "ledger": { "positive": 5.0125, "negative": 5.0644, "neutral": 5.1249 }, "lee": { "positive": 5.0125, "negative": 5.3754, "neutral": 4.9281 }, "left": { "positive": 4.6714, "negative": 4.8676, "neutral": 4.4953 }, "left behind": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "leftist": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "leftists": { "positive": 4.8157, "negative": 4.7233, "neutral": 5.4358 }, "leg": { "positive": 5.3234, "negative": 4.6094, "neutral": 4.7838 }, "leg up": { "positive": 6.1227, "negative": 4.7233, "neutral": 4.7838 }, "legal": { "positive": 4.5575, "negative": 4.7233, "neutral": 5.4358 }, "legit": { "positive": 5.3234, "negative": 5.3754, "neutral": 5.1249 }, "lender": { "positive": 4.5575, "negative": 5.3754, "neutral": 4.7838 }, "lender genesis": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "lending": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "less": { "positive": 4.5575, "negative": 4.3649, "neutral": 4.9281 }, "less than": { "positive": 4.6714, "negative": 4.7233, "neutral": 6.2351 }, "lesson": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "lessons": { "positive": 5.0125, "negative": 5.0644, "neutral": 4.7838 }, "lessons learned": { "positive": 5.3234, "negative": 5.3754, "neutral": 5.1249 }, "let": { "positive": 4.1448, "negative": 3.7794, "neutral": 3.8628 }, "let get": { "positive": 5.0125, "negative": 4.7233, "neutral": 4.7838 }, "let go": { "positive": 4.5575, "negative": 4.3029, "neutral": 4.4254 }, "lets": { "positive": 4.8157, "negative": 4.3649, "neutral": 4.3634 }, "lets go": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "level": { "positive": 4.8157, "negative": 4.1967, "neutral": 4.3077 }, "levels": { "positive": 3.853, "negative": 3.905, "neutral": 4.7838 }, "leverage": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "lfg": { "positive": 5.0125, "negative": 4.2472, "neutral": 4.4254 }, "libraries": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "library": { "positive": 4.4632, "negative": 4.6094, "neutral": 5.4358 }, "library backdoored": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "licence": { "positive": 4.8157, "negative": 4.8676, "neutral": 6.2351 }, "lies": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "life": { "positive": 4.1953, "negative": 4.1967, "neutral": 4.2572 }, "life savings": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "lifts": { "positive": 5.0125, "negative": 5.3754, "neutral": 4.9281 }, "light": { "positive": 5.0125, "negative": 5.0644, "neutral": 5.1249 }, "lightweight": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "like": { "positive": 3.388, "negative": 3.3214, "neutral": 3.0837 }, "like $nonja": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "like bull": { "positive": 3.5895, "negative": 6.1746, "neutral": 3.7019 }, "like buying": { "positive": 6.1227, "negative": 4.8676, "neutral": 4.9281 }, "like most": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "like need": { "positive": 5.3234, "negative": 5.3754, "neutral": 5.1249 }, "like nice": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "like rave": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "like said": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "likely": { "positive": 4.313, "negative": 5.3754, "neutral": 4.3634 }, "line": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "link": { "positive": 3.6844, "negative": 3.5759, "neutral": 3.6363 }, "link all": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "link breaking": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "link buy": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "link chart": { "positive": 5.3234, "negative": 5.3754, "neutral": 5.1249 }, "link crashes": { "positive": 4.8157, "negative": 6.1746, "neutral": 4.9281 }, "link fundamentals": { "positive": 5.3234, "negative": 5.0644, "neutral": 4.9281 }, "link here": { "positive": 5.3234, "negative": 4.8676, "neutral": 5.1249 }, "link momentum": { "positive": 6.1227, "negative": 4.8676, "neutral": 4.9281 }, "link news": { "positive": 4.6714, "negative": 4.7233, "neutral": 6.2351 }, "link smart": { "positive": 6.1227, "negative": 4.8676, "neutral": 4.9281 }, "link support": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "link surges": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "link trading": { "positive": 4.6714, "negative": 4.7233, "neutral": 6.2351 }, "link weak": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "linked": { "positive": 4.3829, "negative": 4.7233, "neutral": 4.9281 }, "links": { "positive": 4.8157, "negative": 5.3754, "neutral": 5.1249 }, "linux": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "liquid": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "liquidated": { "positive": 4.8157, "negative": 6.1746, "neutral": 4.9281 }, "liquidation": { "positive": 4.6714, "negative": 6.1746, "neutral": 4.7838 }, "liquidations": { "positive": 4.6714, "negative": 6.1746, "neutral": 4.7838 }, "liquidity": { "positive": 4.0986, "negative": 4.4349, "neutral": 4.0251 }, "liquidity dried": { "positive": 4.313, "negative": 6.1746, "neutral": 4.4254 }, "list": { "positive": 4.6714, "negative": 4.4349, "neutral": 4.6698 }, "listed": { "positive": 6.1227, "negative": 4.7233, "neutral": 4.7838 }, "listed some": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "listen": { "positive": 5.0125, "negative": 5.3754, "neutral": 4.9281 }, "listings": { "positive": 5.3234, "negative": 5.0644, "neutral": 4.9281 }, "litepaper": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "literally": { "positive": 5.3234, "negative": 4.8676, "neutral": 4.7838 }, "little": { "positive": 4.5575, "negative": 4.5152, "neutral": 4.4953 }, "live": { "positive": 4.251, "negative": 3.7574, "neutral": 3.8399 }, "live crypto": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "lives": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "ll": { "positive": 4.313, "negative": 4.2472, "neutral": 4.5756 }, "ll back": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "ll just": { "positive": 6.1227, "negative": 4.8676, "neutral": 4.9281 }, "llm": { "positive": 4.8157, "negative": 4.8676, "neutral": 6.2351 }, "llms": { "positive": 4.8157, "negative": 4.7233, "neutral": 5.4358 }, "lmao": { "positive": 5.3234, "negative": 5.3754, "neutral": 5.1249 }, "lmfao": { "positive": 4.8157, "negative": 6.1746, "neutral": 4.9281 }, "load": { "positive": 4.8157, "negative": 4.3649, "neutral": 4.6698 }, "load up": { "positive": 5.0125, "negative": 4.6094, "neutral": 4.9281 }, "loaded": { "positive": 4.8157, "negative": 4.8676, "neutral": 5.1249 }, "loaded up": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "loading": { "positive": 5.3234, "negative": 3.284, "neutral": 3.3355 }, "loading up": { "positive": 5.3234, "negative": 3.3214, "neutral": 3.3723 }, "local": { "positive": 4.313, "negative": 4.4349, "neutral": 5.4358 }, "local ai": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "local first": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "locally": { "positive": 4.8157, "negative": 4.8676, "neutral": 6.2351 }, "lock": { "positive": 5.3234, "negative": 4.8676, "neutral": 5.1249 }, "locked": { "positive": 5.3234, "negative": 5.3754, "neutral": 5.1249 }, "login": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "logs": { "positive": 4.8157, "negative": 5.0644, "neutral": 5.4358 }, "lol": { "positive": 3.9451, "negative": 4.0684, "neutral": 3.8867 }, "long": { "positive": 4.6714, "negative": 3.0886, "neutral": 3.1244 }, "long $btc": { "positive": 6.1227, "negative": 4.8676, "neutral": 4.9281 }, "long $eth": { "positive": 6.1227, "negative": 4.8676, "neutral": 4.9281 }, "long ada": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "long avax": { "positive": 6.1227, "negative": 4.8676, "neutral": 4.9281 }, "long bitcoin": { "positive": 6.1227, "negative": 4.7233, "neutral": 4.7838 }, "long bnb": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "long bulls": { "positive": 6.1227, "negative": 4.6094, "neutral": 4.6698 }, "long cardano": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "long crypto": { "positive": 6.1227, "negative": 4.8676, "neutral": 4.9281 }, "long doge": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "long eth": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "long link": { "positive": 6.1227, "negative": 4.6094, "neutral": 4.6698 }, "long market": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "long ripple": { "positive": 6.1227, "negative": 4.8676, "neutral": 4.9281 }, "long sol": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "long solana": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "long strong": { "positive": 6.1227, "negative": 4.5152, "neutral": 4.5756 }, "long term": { "positive": 4.8157, "negative": 4.1967, "neutral": 4.1289 }, "long time": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "long xrp": { "positive": 6.1227, "negative": 4.7233, "neutral": 4.7838 }, "longer": { "positive": 5.0125, "negative": 5.0644, "neutral": 5.1249 }, "longs": { "positive": 6.1227, "negative": 4.6094, "neutral": 4.6698 }, "look": { "positive": 4.4632, "negative": 4.0315, "neutral": 4.1684 }, "looking": { "positive": 4.5575, "negative": 4.0684, "neutral": 4.3634 }, "looking good": { "positive": 6.1227, "negative": 4.8676, "neutral": 4.9281 }, "looks": { "positive": 3.5239, "negative": 3.2082, "neutral": 3.0672 }, "looks bullish": { "positive": 6.1227, "negative": 3.3721, "neutral": 3.4326 }, "looks good": { "positive": 6.1227, "negative": 4.8676, "neutral": 4.9281 }, "looks like": { "positive": 3.5724, "negative": 4.3029, "neutral": 3.5508 }, "loophole": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "lose": { "positive": 4.4632, "negative": 6.1746, "neutral": 4.5756 }, "loser": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "losers": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "loses": { "positive": 4.251, "negative": 4.7233, "neutral": 4.2572 }, "loses exploit": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "losing": { "positive": 4.5575, "negative": 6.1746, "neutral": 4.6698 }, "loss": { "positive": 3.9127, "negative": 6.1746, "neutral": 4.0251 }, "loss drugs": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "losses": { "positive": 4.056, "negative": 5.3754, "neutral": 4.1289 }, "lost": { "positive": 4.1448, "negative": 6.1746, "neutral": 4.2572 }, "lot": { "positive": 5.3234, "negative": 4.6094, "neutral": 4.5756 }, "love": { "positive": 6.1227, "negative": 3.5606, "neutral": 3.6211 }, "love back": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "love sui": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "low": { "positive": 4.5575, "negative": 4.1967, "neutral": 4.3077 }, "lower": { "positive": 4.5575, "negative": 4.8676, "neutral": 4.4254 }, "lows": { "positive": 4.6714, "negative": 5.0644, "neutral": 4.7838 }, "ltc": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "luck": { "positive": 4.5575, "negative": 5.0644, "neutral": 4.6698 }, "lummis": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "luna": { "positive": 5.0125, "negative": 4.7233, "neutral": 4.5756 }, "luna ust": { "positive": 6.1227, "negative": 4.7233, "neutral": 4.7838 }, "lying": { "positive": 4.6714, "negative": 6.1746, "neutral": 4.7838 }, "lying regulators": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "mac": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "machine": { "positive": 4.6714, "negative": 4.8676, "neutral": 4.9281 }, "macos": { "positive": 4.3829, "negative": 4.6094, "neutral": 5.1249 }, "macro": { "positive": 5.0125, "negative": 5.3754, "neutral": 4.9281 }, "macroeconomic": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "made": { "positive": 4.0986, "negative": 4.0684, "neutral": 4.3077 }, "main": { "positive": 5.3234, "negative": 5.3754, "neutral": 5.1249 }, "mainnet": { "positive": 3.9796, "negative": 3.997, "neutral": 5.4358 }, "mainnet stats": { "positive": 3.9796, "negative": 4.0315, "neutral": 6.2351 }, "major": { "positive": 3.9127, "negative": 3.8512, "neutral": 3.7568 }, "major crypto": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "major exchange": { "positive": 4.6714, "negative": 6.1746, "neutral": 4.7838 }, "major partnership": { "positive": 6.1227, "negative": 4.0684, "neutral": 4.1289 }, "make": { "positive": 4.313, "negative": 3.934, "neutral": 3.9944 }, "make bitcoin": { "positive": 5.3234, "negative": 5.3754, "neutral": 5.1249 }, "make money": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "maker": { "positive": 5.0125, "negative": 5.0644, "neutral": 5.1249 }, "makers": { "positive": 5.3234, "negative": 5.3754, "neutral": 5.1249 }, "makes": { "positive": 4.4632, "negative": 4.7233, "neutral": 4.5756 }, "makes sense": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "making": { "positive": 4.251, "negative": 4.2472, "neutral": 4.3634 }, "malicious": { "positive": 4.8157, "negative": 5.0644, "neutral": 5.4358 }, "malware": { "positive": 4.251, "negative": 5.3754, "neutral": 4.4254 }, "man": { "positive": 4.0986, "negative": 4.0684, "neutral": 3.8399 }, "man $eth": { "positive": 6.1227, "negative": 4.2472, "neutral": 4.3077 }, "man's": { "positive": 4.8157, "negative": 6.1746, "neutral": 4.9281 }, "man's switch": { "positive": 4.8157, "negative": 6.1746, "neutral": 4.9281 }, "manager": { "positive": 4.8157, "negative": 5.0644, "neutral": 5.4358 }, "managing": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "mandates": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "mango": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "manipulation": { "positive": 4.5575, "negative": 4.5152, "neutral": 4.6698 }, "many": { "positive": 3.9796, "negative": 4.1079, "neutral": 3.9379 }, "many bitcoins": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "many people": { "positive": 5.3234, "negative": 5.3754, "neutral": 5.1249 }, "many times": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "map": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "mar": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "mar lago": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "march": { "positive": 4.8157, "negative": 5.0644, "neutral": 4.9281 }, "margin": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "markdown": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "market": { "positive": 3.0242, "negative": 3.0403, "neutral": 2.9959 }, "market breaking": { "positive": 6.1227, "negative": 4.7233, "neutral": 4.7838 }, "market buy": { "positive": 4.8157, "negative": 5.3754, "neutral": 5.1249 }, "market cap": { "positive": 4.313, "negative": 3.997, "neutral": 4.0575 }, "market collapse": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "market conditions": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "market crashes": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "market fundamentals": { "positive": 5.3234, "negative": 5.0644, "neutral": 4.9281 }, "market getting": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "market here": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "market hits": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "market makers": { "positive": 5.3234, "negative": 5.3754, "neutral": 5.1249 }, "market manipulation": { "positive": 5.0125, "negative": 4.7233, "neutral": 4.7838 }, "market news": { "positive": 4.6714, "negative": 4.7233, "neutral": 6.2351 }, "market sentiment": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "market share": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "market smart": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "market still": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "market structure": { "positive": 5.3234, "negative": 5.3754, "neutral": 5.1249 }, "market surges": { "positive": 6.1227, "negative": 4.8676, "neutral": 4.9281 }, "market trading": { "positive": 4.5575, "negative": 4.6094, "neutral": 6.2351 }, "market weak": { "positive": 4.8157, "negative": 6.1746, "neutral": 4.9281 }, "marketcap": { "positive": 5.3234, "negative": 5.3754, "neutral": 5.1249 }, "marketing": { "positive": 5.0125, "negative": 5.0644, "neutral": 5.1249 }, "marketplace": { "positive": 4.8157, "negative": 4.6094, "neutral": 4.7838 }, "markets": { "positive": 4.056, "negative": 4.1505, "neutral": 4.4953 }, "mass": { "positive": 4.8157, "negative": 5.0644, "neutral": 4.6698 }, "massive": { "positive": 4.3829, "negative": 4.8676, "neutral": 4.3077 }, "massively": { "positive": 5.3234, "negative": 4.8676, "neutral": 5.1249 }, "mastercard": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "math": { "positive": 4.8157, "negative": 4.8676, "neutral": 6.2351 }, "matic": { "positive": 6.1227, "negative": 4.8676, "neutral": 4.9281 }, "matic $lunc": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "matter": { "positive": 4.8157, "negative": 5.3754, "neutral": 5.1249 }, "maybe": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "mc": { "positive": 6.1227, "negative": 4.8676, "neutral": 4.9281 }, "mcafee": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "mcap": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "mcp": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "md": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "mean": { "positive": 4.8157, "negative": 4.8676, "neutral": 4.7838 }, "means": { "positive": 4.8157, "negative": 4.5152, "neutral": 4.4953 }, "media": { "positive": 4.6714, "negative": 4.8676, "neutral": 4.6698 }, "meets": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "melt": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "melt faces": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "meme": { "positive": 4.4632, "negative": 4.2472, "neutral": 4.4254 }, "meme coins": { "positive": 5.3234, "negative": 5.3754, "neutral": 5.1249 }, "memecoin": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "memecoins": { "positive": 4.1953, "negative": 6.1746, "neutral": 4.3077 }, "memecoins instead": { "positive": 4.1953, "negative": 6.1746, "neutral": 4.3077 }, "memes": { "positive": 5.0125, "negative": 4.2472, "neutral": 4.3077 }, "memes like": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "men": { "positive": 4.8157, "negative": 5.3754, "neutral": 5.1249 }, "menu": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "merge": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "messages": { "positive": 4.8157, "negative": 5.0644, "neutral": 5.4358 }, "metrics": { "positive": 6.1227, "negative": 4.8676, "neutral": 4.9281 }, "michael": { "positive": 5.0125, "negative": 5.0644, "neutral": 4.7838 }, "michael saylor": { "positive": 5.3234, "negative": 5.0644, "neutral": 4.9281 }, "microsoft": { "positive": 4.8157, "negative": 5.0644, "neutral": 5.4358 }, "million": { "positive": 4.3829, "negative": 3.9646, "neutral": 3.8399 }, "million coins": { "positive": 6.1227, "negative": 4.6094, "neutral": 4.6698 }, "million dollars": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "million market": { "positive": 6.1227, "negative": 4.7233, "neutral": 4.7838 }, "million some": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "millionaires": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "millions": { "positive": 3.9127, "negative": 5.0644, "neutral": 4.092 }, "millions dollars": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "mind": { "positive": 5.0125, "negative": 4.7233, "neutral": 5.1249 }, "mine": { "positive": 4.3829, "negative": 4.4349, "neutral": 4.7838 }, "mine bitcoin": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "miner": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "miners": { "positive": 4.0986, "negative": 4.5152, "neutral": 4.5756 }, "miners traders": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "mines": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "minimum": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "mining": { "positive": 3.0001, "negative": 3.2082, "neutral": 3.3723 }, "mining bitcoin": { "positive": 4.3829, "negative": 4.5152, "neutral": 5.4358 }, "mining boom": { "positive": 6.1227, "negative": 4.8676, "neutral": 4.9281 }, "mining centre": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "mining companies": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "mining energy": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "mining firm": { "positive": 4.8157, "negative": 5.3754, "neutral": 5.1249 }, "mining hub": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "mining operation": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "mining pools": { "positive": 4.8157, "negative": 5.3754, "neutral": 5.1249 }, "mining power": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "minnesota": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "mint": { "positive": 4.6714, "negative": 5.0644, "neutral": 5.1249 }, "minute": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "minutes": { "positive": 4.6714, "negative": 5.3754, "neutral": 4.9281 }, "mishandling": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "mishandling funds": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "misleading": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "miss": { "positive": 6.1227, "negative": 4.6094, "neutral": 4.6698 }, "miss out": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "missing": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "mission": { "positive": 4.6714, "negative": 4.7233, "neutral": 6.2351 }, "mission focused": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "mistake": { "positive": 4.8157, "negative": 6.1746, "neutral": 4.9281 }, "mit": { "positive": 4.6714, "negative": 5.0644, "neutral": 5.1249 }, "mix": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "mixing": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "mln": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "mms": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "mn": { "positive": 5.3234, "negative": 4.5152, "neutral": 4.4953 }, "mn hophn": { "positive": 5.3234, "negative": 4.5152, "neutral": 4.4953 }, "mobile": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "mode": { "positive": 5.3234, "negative": 4.8676, "neutral": 5.1249 }, "model": { "positive": 4.4632, "negative": 4.5152, "neutral": 6.2351 }, "models": { "positive": 4.6714, "negative": 4.8676, "neutral": 5.4358 }, "modular": { "positive": 5.0125, "negative": 5.0644, "neutral": 5.1249 }, "moment": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "momentum": { "positive": 5.0125, "negative": 3.4773, "neutral": 3.5126 }, "momentum building": { "positive": 6.1227, "negative": 3.5174, "neutral": 3.5778 }, "monero": { "positive": 5.0125, "negative": 4.8676, "neutral": 5.4358 }, "money": { "positive": 3.4126, "negative": 3.2931, "neutral": 3.1008 }, "money accumulating": { "positive": 6.1227, "negative": 3.5037, "neutral": 3.5641 }, "money crypto": { "positive": 5.3234, "negative": 5.3754, "neutral": 5.1249 }, "money gone": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "money laundering": { "positive": 4.5575, "negative": 6.1746, "neutral": 4.6698 }, "money printing": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "moneygram": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "monitor": { "positive": 4.8157, "negative": 4.7233, "neutral": 5.4358 }, "month": { "positive": 4.1953, "negative": 4.0315, "neutral": 4.0251 }, "month years": { "positive": 5.3234, "negative": 5.3754, "neutral": 5.1249 }, "months": { "positive": 4.4632, "negative": 4.3029, "neutral": 4.2572 }, "moon": { "positive": 5.3234, "negative": 3.7574, "neutral": 3.7968 }, "moon shot": { "positive": 6.1227, "negative": 4.8676, "neutral": 4.9281 }, "moratorium": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "more": { "positive": 3.5895, "negative": 3.3412, "neutral": 3.4768 }, "more bullish": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "more here": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "more longs": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "more money": { "positive": 5.3234, "negative": 5.3754, "neutral": 5.1249 }, "more people": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "more than": { "positive": 4.4632, "negative": 4.6094, "neutral": 4.9281 }, "morgan": { "positive": 4.6714, "negative": 4.5152, "neutral": 4.7838 }, "morgan stanley": { "positive": 5.3234, "negative": 4.8676, "neutral": 5.1249 }, "morning": { "positive": 4.8157, "negative": 4.3029, "neutral": 4.4254 }, "most": { "positive": 4.1953, "negative": 4.0315, "neutral": 4.0251 }, "most bullish": { "positive": 6.1227, "negative": 4.8676, "neutral": 4.9281 }, "most crypto": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "most likely": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "mostly": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "mounting": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "move": { "positive": 3.664, "negative": 3.5458, "neutral": 3.9944 }, "moved": { "positive": 4.6714, "negative": 5.0644, "neutral": 5.1249 }, "movement": { "positive": 4.5575, "negative": 5.0644, "neutral": 4.6698 }, "movement whatsoever": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "moves": { "positive": 4.6714, "negative": 4.1505, "neutral": 4.3077 }, "moves $nonja": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "movie": { "positive": 5.3234, "negative": 5.3754, "neutral": 5.1249 }, "moving": { "positive": 4.8157, "negative": 4.5152, "neutral": 4.4953 }, "moving up": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "mt": { "positive": 4.4632, "negative": 5.3754, "neutral": 4.6698 }, "mt gox": { "positive": 4.4632, "negative": 5.3754, "neutral": 4.6698 }, "much": { "positive": 4.5575, "negative": 4.0684, "neutral": 4.1684 }, "much $nonja": { "positive": 5.3234, "negative": 5.3754, "neutral": 5.1249 }, "much more": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "multi": { "positive": 5.3234, "negative": 4.8676, "neutral": 4.7838 }, "multimillion": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "multimillion dollar": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "multiple": { "positive": 6.1227, "negative": 4.7233, "neutral": 4.7838 }, "multiple catalysts": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "nails": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "name": { "positive": 4.5575, "negative": 4.6094, "neutral": 5.1249 }, "nancy": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "narrative": { "positive": 5.3234, "negative": 4.8676, "neutral": 5.1249 }, "narratives": { "positive": 5.3234, "negative": 5.3754, "neutral": 5.1249 }, "nasa": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "national": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "native": { "positive": 4.4632, "negative": 4.3649, "neutral": 4.7838 }, "nd": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "ndt": { "positive": 6.1227, "negative": 4.8676, "neutral": 4.9281 }, "ndt yzv": { "positive": 6.1227, "negative": 4.8676, "neutral": 4.9281 }, "near": { "positive": 4.6714, "negative": 4.2472, "neutral": 4.211 }, "near foundation": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "near powered": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "nearly": { "positive": 4.313, "negative": 5.0644, "neutral": 4.4254 }, "nearly billion": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "nears": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "necessary": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "need": { "positive": 4.251, "negative": 4.1079, "neutral": 4.0575 }, "needed": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "needs": { "positive": 4.8157, "negative": 4.3649, "neutral": 4.3634 }, "needs some": { "positive": 5.3234, "negative": 5.0644, "neutral": 4.9281 }, "negative": { "positive": 5.0125, "negative": 5.0644, "neutral": 5.1249 }, "nervous": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "net": { "positive": 4.4632, "negative": 4.5152, "neutral": 4.5756 }, "net profit": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "netherlands": { "positive": 4.8157, "negative": 5.3754, "neutral": 5.1249 }, "netherlands ban": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "network": { "positive": 3.7993, "negative": 3.6963, "neutral": 3.7379 }, "network upgrade": { "positive": 6.1227, "negative": 4.0315, "neutral": 4.092 }, "networks": { "positive": 4.8157, "negative": 5.0644, "neutral": 5.4358 }, "neural": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "never": { "positive": 3.882, "negative": 4.5152, "neutral": 4.1289 }, "never ends": { "positive": 4.8157, "negative": 6.1746, "neutral": 4.9281 }, "new": { "positive": 3.4253, "negative": 2.9802, "neutral": 3.1184 }, "new all": { "positive": 5.3234, "negative": 3.3938, "neutral": 3.4654 }, "new ath": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "new crypto": { "positive": 4.3829, "negative": 4.4349, "neutral": 5.1249 }, "new era": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "new highs": { "positive": 6.1227, "negative": 4.2472, "neutral": 4.3077 }, "new lows": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "news": { "positive": 3.0967, "negative": 3.07, "neutral": 3.8399 }, "news today": { "positive": 3.1722, "negative": 3.2161, "neutral": 5.4358 }, "next": { "positive": 3.7055, "negative": 3.2662, "neutral": 3.3723 }, "next bch": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "next bull": { "positive": 6.1227, "negative": 4.8676, "neutral": 4.9281 }, "next few": { "positive": 6.1227, "negative": 4.8676, "neutral": 4.9281 }, "next financial": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "next gen": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "next leg": { "positive": 6.1227, "negative": 4.7233, "neutral": 4.7838 }, "next level": { "positive": 5.3234, "negative": 4.7233, "neutral": 4.9281 }, "next only": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "next step": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "next stop": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "next week": { "positive": 5.0125, "negative": 4.4349, "neutral": 4.6698 }, "next year": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "nft": { "positive": 4.1953, "negative": 4.4349, "neutral": 4.3634 }, "nft sales": { "positive": 5.3234, "negative": 5.3754, "neutral": 5.1249 }, "nfts": { "positive": 4.5575, "negative": 5.0644, "neutral": 4.6698 }, "nice": { "positive": 6.1227, "negative": 3.3312, "neutral": 3.3917 }, "nice bounce": { "positive": 6.1227, "negative": 4.6094, "neutral": 4.6698 }, "nice run": { "positive": 6.1227, "negative": 3.905, "neutral": 3.9654 }, "nice see": { "positive": 6.1227, "negative": 4.1505, "neutral": 4.211 }, "nicehash": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "night": { "positive": 5.3234, "negative": 5.3754, "neutral": 5.1249 }, "nightmare": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "nix": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "no": { "positive": 3.3761, "negative": 3.4903, "neutral": 3.7379 }, "no clear": { "positive": 4.056, "negative": 4.1079, "neutral": 6.2351 }, "no crypto": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "no further": { "positive": 6.1227, "negative": 4.8676, "neutral": 4.9281 }, "no login": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "no longer": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "no more": { "positive": 5.0125, "negative": 5.0644, "neutral": 4.7838 }, "no movement": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "no one": { "positive": 5.3234, "negative": 4.8676, "neutral": 5.1249 }, "no use": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "nobel": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "nobel laureate": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "nobody": { "positive": 4.4632, "negative": 4.6094, "neutral": 4.6698 }, "node": { "positive": 4.6714, "negative": 4.6094, "neutral": 5.4358 }, "nodes": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "noise": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "nomina": { "positive": 6.1227, "negative": 4.8676, "neutral": 4.9281 }, "non": { "positive": 4.6714, "negative": 4.7233, "neutral": 6.2351 }, "nonja": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "nonsense": { "positive": 4.8157, "negative": 6.1746, "neutral": 4.9281 }, "nope": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "north": { "positive": 3.9451, "negative": 5.0644, "neutral": 4.0575 }, "north american": { "positive": 5.3234, "negative": 5.3754, "neutral": 5.1249 }, "north korea": { "positive": 4.5575, "negative": 6.1746, "neutral": 4.6698 }, "north korea's": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "north korean": { "positive": 4.4632, "negative": 6.1746, "neutral": 4.5756 }, "not": { "positive": 2.9548, "negative": 3.1558, "neutral": 2.9245 }, "not accept": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "not all": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "not bullish": { "positive": 3.3419, "negative": 5.3754, "neutral": 3.4433 }, "not even": { "positive": 5.3234, "negative": 5.0644, "neutral": 4.9281 }, "not financial": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "not long": { "positive": 5.3234, "negative": 5.3754, "neutral": 5.1249 }, "not making": { "positive": 5.0125, "negative": 5.3754, "neutral": 4.9281 }, "not next": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "not public": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "not scam": { "positive": 6.1227, "negative": 3.905, "neutral": 3.9654 }, "not short": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "not too": { "positive": 5.0125, "negative": 5.3754, "neutral": 4.9281 }, "not used": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "nothing": { "positive": 4.0986, "negative": 4.3029, "neutral": 4.2572 }, "nothing ing": { "positive": 4.8157, "negative": 6.1746, "neutral": 4.9281 }, "notice": { "positive": 5.0125, "negative": 5.3754, "neutral": 4.9281 }, "notification": { "positive": 5.0125, "negative": 5.3754, "neutral": 4.9281 }, "notifications": { "positive": 5.0125, "negative": 4.8676, "neutral": 4.9281 }, "now": { "positive": 2.7876, "negative": 2.7511, "neutral": 3.2162 }, "now accepts": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "now back": { "positive": 5.3234, "negative": 5.0644, "neutral": 4.9281 }, "now like": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "now lol": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "now taking": { "positive": 6.1227, "negative": 4.7233, "neutral": 4.7838 }, "now time": { "positive": 5.3234, "negative": 4.8676, "neutral": 5.1249 }, "npm": { "positive": 4.8157, "negative": 5.3754, "neutral": 5.1249 }, "nuclear": { "positive": 4.6714, "negative": 5.3754, "neutral": 4.9281 }, "number": { "positive": 5.0125, "negative": 5.3754, "neutral": 4.9281 }, "numbers": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "nvidia": { "positive": 4.251, "negative": 5.3754, "neutral": 4.3077 }, "nvidia instead": { "positive": 4.3829, "negative": 6.1746, "neutral": 4.4953 }, "observations": { "positive": 5.3234, "negative": 5.3754, "neutral": 5.1249 }, "obvious": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "oceanpal": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "oceanpal partnership": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "october": { "positive": 5.3234, "negative": 4.8676, "neutral": 5.1249 }, "off": { "positive": 3.7055, "negative": 3.7794, "neutral": 3.8628 }, "off apecoin": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "offers": { "positive": 4.6714, "negative": 5.0644, "neutral": 5.1249 }, "office": { "positive": 4.8157, "negative": 5.3754, "neutral": 5.1249 }, "officer": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "official": { "positive": 5.3234, "negative": 5.0644, "neutral": 4.9281 }, "officially": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "officials": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "offline": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "often": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "oh": { "positive": 4.8157, "negative": 4.7233, "neutral": 4.6698 }, "oil": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "okay": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "old": { "positive": 4.251, "negative": 4.4349, "neutral": 4.5756 }, "once": { "positive": 4.3829, "negative": 4.1967, "neutral": 4.211 }, "onchain": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "one": { "positive": 3.6255, "negative": 3.5037, "neutral": 3.525 }, "one best": { "positive": 6.1227, "negative": 4.7233, "neutral": 4.7838 }, "one ing": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "one largest": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "one memes": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "one thing": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "one time": { "positive": 5.0125, "negative": 5.0644, "neutral": 5.1249 }, "online": { "positive": 4.3829, "negative": 4.7233, "neutral": 4.9281 }, "only": { "positive": 3.7504, "negative": 3.6591, "neutral": 3.7019 }, "only million": { "positive": 6.1227, "negative": 4.8676, "neutral": 4.9281 }, "only thank": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "only way": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "open": { "positive": 3.7275, "negative": 3.8512, "neutral": 4.9281 }, "open source": { "positive": 3.9451, "negative": 4.0684, "neutral": 5.1249 }, "openai": { "positive": 4.8157, "negative": 5.0644, "neutral": 4.9281 }, "opens": { "positive": 5.3234, "negative": 5.3754, "neutral": 5.1249 }, "operating": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "operation": { "positive": 4.8157, "negative": 5.3754, "neutral": 5.1249 }, "operations": { "positive": 4.8157, "negative": 5.3754, "neutral": 5.1249 }, "operator": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "opportunity": { "positive": 4.6714, "negative": 4.3649, "neutral": 4.5756 }, "optimism": { "positive": 5.0125, "negative": 4.7233, "neutral": 4.7838 }, "optimistic": { "positive": 5.3234, "negative": 4.8676, "neutral": 4.7838 }, "option": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "options": { "positive": 4.6714, "negative": 4.7233, "neutral": 6.2351 }, "order": { "positive": 4.6714, "negative": 4.8676, "neutral": 5.4358 }, "orderly": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "orderly exit": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "orders": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "original": { "positive": 5.0125, "negative": 4.8676, "neutral": 5.4358 }, "oss": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "other": { "positive": 3.7743, "negative": 4.1967, "neutral": 3.8179 }, "other coins": { "positive": 4.1448, "negative": 6.1746, "neutral": 4.2572 }, "other cryptocurrencies": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "other cryptocurrency": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "others": { "positive": 5.3234, "negative": 5.0644, "neutral": 4.9281 }, "out": { "positive": 3.0242, "negative": 3.1629, "neutral": 2.8503 }, "out chart": { "positive": 6.1227, "negative": 4.3029, "neutral": 4.3634 }, "out crypto": { "positive": 4.8157, "negative": 5.3754, "neutral": 5.1249 }, "out fundamentals": { "positive": 6.1227, "negative": 4.3029, "neutral": 4.3634 }, "out get": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "out momentum": { "positive": 6.1227, "negative": 4.3649, "neutral": 4.4254 }, "out now": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "out smart": { "positive": 6.1227, "negative": 4.4349, "neutral": 4.4953 }, "out support": { "positive": 6.1227, "negative": 4.3649, "neutral": 4.4254 }, "out there": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "out user": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "out volume": { "positive": 6.1227, "negative": 4.5152, "neutral": 4.5756 }, "outage": { "positive": 4.5575, "negative": 6.1746, "neutral": 4.6698 }, "outflows": { "positive": 4.6714, "negative": 6.1746, "neutral": 4.7838 }, "outlook": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "outperform": { "positive": 6.1227, "negative": 4.7233, "neutral": 4.7838 }, "over": { "positive": 3.353, "negative": 3.6243, "neutral": 3.4654 }, "over alleged": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "over binance": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "over bitcoin": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "over crypto": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "over here": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "over past": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "over people": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "over re": { "positive": 5.3234, "negative": 5.3754, "neutral": 5.1249 }, "over usd": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "overnight": { "positive": 5.3234, "negative": 5.3754, "neutral": 5.1249 }, "overseas": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "oversold": { "positive": 5.3234, "negative": 4.8676, "neutral": 5.1249 }, "own": { "positive": 4.0986, "negative": 4.1079, "neutral": 4.4953 }, "owns": { "positive": 5.0125, "negative": 4.8676, "neutral": 5.4358 }, "pace": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "packed": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "paid": { "positive": 4.4632, "negative": 5.0644, "neutral": 4.7838 }, "pain": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "palantir": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "pamp": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "panic": { "positive": 4.6714, "negative": 6.1746, "neutral": 4.7838 }, "panicking": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "paper": { "positive": 4.6714, "negative": 4.3649, "neutral": 4.7838 }, "parabolic": { "positive": 6.1227, "negative": 4.3029, "neutral": 4.3634 }, "pardon": { "positive": 5.3234, "negative": 5.3754, "neutral": 5.1249 }, "pardons": { "positive": 4.5575, "negative": 5.0644, "neutral": 4.9281 }, "pardons convicted": { "positive": 4.8157, "negative": 6.1746, "neutral": 4.9281 }, "part": { "positive": 4.313, "negative": 4.3029, "neutral": 4.9281 }, "partner": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "partners": { "positive": 5.0125, "negative": 4.8676, "neutral": 5.4358 }, "partnership": { "positive": 6.1227, "negative": 3.8774, "neutral": 3.9379 }, "partnership announced": { "positive": 6.1227, "negative": 4.0684, "neutral": 4.1289 }, "partnership near": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "partnerships": { "positive": 6.1227, "negative": 4.8676, "neutral": 4.9281 }, "party": { "positive": 5.0125, "negative": 5.0644, "neutral": 5.1249 }, "pass": { "positive": 5.0125, "negative": 5.0644, "neutral": 5.1249 }, "passes": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "passes stablecoin": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "passing": { "positive": 5.0125, "negative": 5.0644, "neutral": 5.1249 }, "password": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "past": { "positive": 5.0125, "negative": 4.5152, "neutral": 4.5756 }, "patch": { "positive": 5.0125, "negative": 4.8676, "neutral": 5.4358 }, "patent": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "path": { "positive": 4.8157, "negative": 4.8676, "neutral": 5.1249 }, "patience": { "positive": 5.3234, "negative": 5.0644, "neutral": 4.9281 }, "pattern": { "positive": 5.0125, "negative": 4.4349, "neutral": 4.4953 }, "patterns": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "pause": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "pauses": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "paving": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "paxos": { "positive": 5.3234, "negative": 5.3754, "neutral": 5.1249 }, "pay": { "positive": 4.6714, "negative": 4.4349, "neutral": 4.9281 }, "paying": { "positive": 4.8157, "negative": 4.5152, "neutral": 4.9281 }, "payment": { "positive": 4.6714, "negative": 4.7233, "neutral": 5.1249 }, "payments": { "positive": 3.9127, "negative": 4.0684, "neutral": 4.6698 }, "paypal": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "pc": { "positive": 5.3234, "negative": 5.3754, "neutral": 5.1249 }, "pdf": { "positive": 4.0165, "negative": 4.2472, "neutral": 4.7838 }, "peace": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "peak": { "positive": 4.8157, "negative": 4.8676, "neutral": 4.7838 }, "pedo": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "peg": { "positive": 4.6714, "negative": 5.3754, "neutral": 4.9281 }, "penalising": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "penalising miners": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "penny": { "positive": 4.8157, "negative": 5.0644, "neutral": 4.6698 }, "penny ing": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "people": { "positive": 3.882, "negative": 3.7794, "neutral": 3.7196 }, "people get": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "people know": { "positive": 5.3234, "negative": 5.3754, "neutral": 5.1249 }, "people make": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "pepe": { "positive": 5.3234, "negative": 4.8676, "neutral": 5.1249 }, "per": { "positive": 4.3829, "negative": 4.4349, "neutral": 5.1249 }, "per month": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "percent": { "positive": 5.3234, "negative": 5.3754, "neutral": 5.1249 }, "perfect": { "positive": 6.1227, "negative": 4.2472, "neutral": 4.3077 }, "perfect time": { "positive": 6.1227, "negative": 4.8676, "neutral": 4.9281 }, "perfectly": { "positive": 6.1227, "negative": 3.4903, "neutral": 3.5508 }, "performance": { "positive": 5.0125, "negative": 5.0644, "neutral": 5.1249 }, "performing": { "positive": 5.3234, "negative": 4.8676, "neutral": 4.7838 }, "period": { "positive": 5.0125, "negative": 5.0644, "neutral": 5.1249 }, "person": { "positive": 4.5575, "negative": 5.3754, "neutral": 4.7838 }, "personal": { "positive": 4.3829, "negative": 4.4349, "neutral": 4.7838 }, "personal finance": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "personal information": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "perspective": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "peter": { "positive": 4.8157, "negative": 4.7233, "neutral": 4.9281 }, "peter thiel": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "peter thiel's": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "phantom": { "positive": 5.0125, "negative": 4.7233, "neutral": 5.1249 }, "phantom wallet": { "positive": 5.0125, "negative": 4.8676, "neutral": 5.4358 }, "phase": { "positive": 5.3234, "negative": 5.0644, "neutral": 4.9281 }, "phishing": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "phone": { "positive": 5.0125, "negative": 5.0644, "neutral": 4.7838 }, "photos": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "php": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "pi": { "positive": 4.8157, "negative": 5.0644, "neutral": 5.4358 }, "pick": { "positive": 5.3234, "negative": 4.8676, "neutral": 4.7838 }, "picking": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "picks": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "piece": { "positive": 4.1448, "negative": 5.0644, "neutral": 4.3634 }, "piece sh": { "positive": 4.4632, "negative": 5.3754, "neutral": 4.6698 }, "piece shit": { "positive": 4.8157, "negative": 6.1746, "neutral": 4.9281 }, "pile": { "positive": 4.8157, "negative": 6.1746, "neutral": 4.9281 }, "pile shit": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "pipe": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "pipe investment": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "place": { "positive": 5.0125, "negative": 4.4349, "neutral": 4.6698 }, "plan": { "positive": 4.6714, "negative": 4.4349, "neutral": 4.6698 }, "plans": { "positive": 4.5575, "negative": 4.8676, "neutral": 4.7838 }, "plate": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "platform": { "positive": 4.0165, "negative": 4.1505, "neutral": 4.3077 }, "platform mango": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "platforms": { "positive": 5.0125, "negative": 5.0644, "neutral": 5.1249 }, "play": { "positive": 4.5575, "negative": 4.5152, "neutral": 4.9281 }, "plays": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "plea": { "positive": 4.8157, "negative": 6.1746, "neutral": 4.9281 }, "plead": { "positive": 4.6714, "negative": 6.1746, "neutral": 4.7838 }, "plead guilty": { "positive": 4.6714, "negative": 6.1746, "neutral": 4.7838 }, "pleads": { "positive": 4.5575, "negative": 6.1746, "neutral": 4.6698 }, "pleads guilty": { "positive": 4.5575, "negative": 6.1746, "neutral": 4.6698 }, "please": { "positive": 4.5575, "negative": 4.6094, "neutral": 4.7838 }, "plummet": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "plummeting": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "plummets": { "positive": 4.8157, "negative": 6.1746, "neutral": 4.9281 }, "plunges": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "point": { "positive": 5.0125, "negative": 4.3029, "neutral": 4.4953 }, "points": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "police": { "positive": 4.3829, "negative": 5.3754, "neutral": 4.5756 }, "police arrest": { "positive": 4.8157, "negative": 6.1746, "neutral": 4.9281 }, "policy": { "positive": 5.0125, "negative": 5.0644, "neutral": 5.1249 }, "polish": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "political": { "positive": 4.3829, "negative": 5.0644, "neutral": 4.6698 }, "political donations": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "politics": { "positive": 4.8157, "negative": 5.3754, "neutral": 5.1249 }, "polkadot": { "positive": 5.3234, "negative": 5.3754, "neutral": 5.1249 }, "polygon": { "positive": 4.8157, "negative": 5.0644, "neutral": 4.9281 }, "ponzi": { "positive": 4.056, "negative": 6.1746, "neutral": 4.1684 }, "ponzi scheme": { "positive": 4.5575, "negative": 6.1746, "neutral": 4.6698 }, "ponzi schemes": { "positive": 4.8157, "negative": 6.1746, "neutral": 4.9281 }, "pool": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "pools": { "positive": 4.8157, "negative": 5.3754, "neutral": 5.1249 }, "poor": { "positive": 5.0125, "negative": 5.3754, "neutral": 4.9281 }, "pop": { "positive": 5.3234, "negative": 4.8676, "neutral": 5.1249 }, "portfolio": { "positive": 4.3829, "negative": 4.3029, "neutral": 4.4254 }, "pos": { "positive": 4.8157, "negative": 5.0644, "neutral": 5.4358 }, "position": { "positive": 4.4632, "negative": 4.3649, "neutral": 4.4254 }, "position here": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "positioned": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "positions": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "possibility": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "possible": { "positive": 4.4632, "negative": 4.2472, "neutral": 4.4254 }, "possible futures": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "post": { "positive": 4.313, "negative": 4.3029, "neutral": 4.6698 }, "post quantum": { "positive": 4.8157, "negative": 4.8676, "neutral": 6.2351 }, "post so": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "posted": { "positive": 4.0165, "negative": 4.0315, "neutral": 5.4358 }, "postgresql": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "posting": { "positive": 5.0125, "negative": 5.0644, "neutral": 5.1249 }, "posts": { "positive": 4.8157, "negative": 4.8676, "neutral": 5.1249 }, "potential": { "positive": 5.0125, "negative": 4.3029, "neutral": 4.4953 }, "potential here": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "pow": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "power": { "positive": 4.4632, "negative": 4.3029, "neutral": 4.3634 }, "power cryptocurrencies": { "positive": 6.1227, "negative": 4.8676, "neutral": 4.9281 }, "powered": { "positive": 4.5575, "negative": 4.3649, "neutral": 4.9281 }, "powered ai": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "powerful": { "positive": 5.0125, "negative": 5.0644, "neutral": 5.1249 }, "pre": { "positive": 4.5575, "negative": 5.0644, "neutral": 4.6698 }, "prediction": { "positive": 4.313, "negative": 4.4349, "neutral": 5.4358 }, "prediction market": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "prediction markets": { "positive": 4.6714, "negative": 4.7233, "neutral": 6.2351 }, "prepares": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "president": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "pressure": { "positive": 4.4632, "negative": 5.0644, "neutral": 4.7838 }, "presumed": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "pretty": { "positive": 4.8157, "negative": 5.3754, "neutral": 5.1249 }, "prevent": { "positive": 4.8157, "negative": 6.1746, "neutral": 4.9281 }, "previous": { "positive": 5.3234, "negative": 5.3754, "neutral": 5.1249 }, "previously": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "previously post": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "price": { "positive": 3.7743, "negative": 3.5458, "neutral": 3.6363 }, "price action": { "positive": 5.0125, "negative": 5.0644, "neutral": 4.7838 }, "price inflation": { "positive": 5.3234, "negative": 5.3754, "neutral": 5.1249 }, "price prediction": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "price surge": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "price target": { "positive": 5.3234, "negative": 4.8676, "neutral": 4.7838 }, "prices": { "positive": 4.3829, "negative": 4.6094, "neutral": 4.4254 }, "printing": { "positive": 5.0125, "negative": 4.7233, "neutral": 4.7838 }, "prior": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "prison": { "positive": 4.1953, "negative": 6.1746, "neutral": 4.3077 }, "prison crypto": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "prison time": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "privacy": { "positive": 4.5575, "negative": 4.4349, "neutral": 4.7838 }, "privacy coins": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "private": { "positive": 4.4632, "negative": 4.7233, "neutral": 4.7838 }, "probably": { "positive": 4.6714, "negative": 4.8676, "neutral": 4.6698 }, "probe": { "positive": 4.8157, "negative": 6.1746, "neutral": 4.9281 }, "probes": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "problem": { "positive": 4.5575, "negative": 6.1746, "neutral": 4.6698 }, "processing": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "product": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "production": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "profit": { "positive": 6.1227, "negative": 4.0315, "neutral": 4.092 }, "profit taking": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "profitable": { "positive": 5.3234, "negative": 4.3649, "neutral": 4.3634 }, "profits": { "positive": 5.3234, "negative": 4.1967, "neutral": 4.211 }, "progress": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "project": { "positive": 4.0986, "negative": 3.5915, "neutral": 3.7196 }, "project real": { "positive": 6.1227, "negative": 3.905, "neutral": 3.9654 }, "projects": { "positive": 4.4632, "negative": 4.5152, "neutral": 6.2351 }, "promoting": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "prompt": { "positive": 4.8157, "negative": 4.8676, "neutral": 6.2351 }, "proof": { "positive": 4.313, "negative": 4.6094, "neutral": 4.9281 }, "proof work": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "proofs": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "proposal": { "positive": 4.6714, "negative": 4.8676, "neutral": 5.4358 }, "propose": { "positive": 4.8157, "negative": 5.3754, "neutral": 5.1249 }, "propose cryptocurrency": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "proposes": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "protect": { "positive": 5.0125, "negative": 4.8676, "neutral": 5.4358 }, "protected": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "protocol": { "positive": 4.1448, "negative": 4.3029, "neutral": 4.5756 }, "protocol drained": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "protocol part": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "protocols": { "positive": 4.8157, "negative": 5.0644, "neutral": 5.4358 }, "prove": { "positive": 4.6714, "negative": 4.6094, "neutral": 5.4358 }, "provider": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "provides": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "pt": { "positive": 5.0125, "negative": 4.8676, "neutral": 5.4358 }, "public": { "positive": 4.251, "negative": 4.3649, "neutral": 4.9281 }, "published": { "positive": 3.9451, "negative": 3.997, "neutral": 6.2351 }, "pull": { "positive": 3.853, "negative": 4.7233, "neutral": 3.9117 }, "pump": { "positive": 4.5575, "negative": 3.7574, "neutral": 3.7196 }, "pump dump": { "positive": 4.6714, "negative": 5.3754, "neutral": 4.6698 }, "pumping": { "positive": 6.1227, "negative": 4.1967, "neutral": 4.2572 }, "pumping $nonja": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "pumping soon": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "purchases": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "pure": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "push": { "positive": 4.8157, "negative": 4.6094, "neutral": 5.1249 }, "pushing": { "positive": 4.8157, "negative": 5.3754, "neutral": 5.1249 }, "put": { "positive": 4.313, "negative": 4.6094, "neutral": 4.9281 }, "putin": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "puts": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "putting": { "positive": 4.6714, "negative": 5.0644, "neutral": 4.7838 }, "pxyakyuvwwzt": { "positive": 6.1227, "negative": 4.8676, "neutral": 4.9281 }, "pxyakyuvwwzt zerdofr": { "positive": 6.1227, "negative": 4.8676, "neutral": 4.9281 }, "python": { "positive": 4.6714, "negative": 4.6094, "neutral": 5.4358 }, "quadrigacx": { "positive": 4.8157, "negative": 5.3754, "neutral": 5.1249 }, "quant": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "quantum": { "positive": 4.0986, "negative": 4.0684, "neutral": 4.5756 }, "quantum computing": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "quantum resistant": { "positive": 4.8157, "negative": 4.8676, "neutral": 6.2351 }, "quantum safe": { "positive": 5.3234, "negative": 5.3754, "neutral": 5.1249 }, "quarter": { "positive": 4.5575, "negative": 4.6094, "neutral": 4.7838 }, "quarterly": { "positive": 4.8157, "negative": 4.8676, "neutral": 5.1249 }, "question": { "positive": 5.0125, "negative": 5.0644, "neutral": 5.1249 }, "quick": { "positive": 4.8157, "negative": 5.3754, "neutral": 5.1249 }, "quiet": { "positive": 4.8157, "negative": 4.5152, "neutral": 4.9281 }, "quietly": { "positive": 5.3234, "negative": 4.7233, "neutral": 4.9281 }, "quit": { "positive": 5.3234, "negative": 5.3754, "neutral": 5.1249 }, "quite": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "qzhyms": { "positive": 5.0125, "negative": 4.8676, "neutral": 5.4358 }, "qzhyms hgp": { "positive": 5.0125, "negative": 4.8676, "neutral": 5.4358 }, "race": { "positive": 4.4632, "negative": 4.5152, "neutral": 4.7838 }, "rag": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "raid": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "raided": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "raise": { "positive": 4.6714, "negative": 5.0644, "neutral": 5.1249 }, "raised": { "positive": 5.3234, "negative": 5.0644, "neutral": 4.9281 }, "raises": { "positive": 5.3234, "negative": 4.7233, "neutral": 4.6698 }, "rallies": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "rally": { "positive": 6.1227, "negative": 4.0315, "neutral": 4.092 }, "ran": { "positive": 4.6714, "negative": 6.1746, "neutral": 4.7838 }, "random": { "positive": 4.8157, "negative": 5.0644, "neutral": 5.4358 }, "range": { "positive": 4.6714, "negative": 4.3649, "neutral": 4.5756 }, "rank": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "ranks": { "positive": 5.3234, "negative": 5.3754, "neutral": 5.1249 }, "ranks top": { "positive": 5.3234, "negative": 5.3754, "neutral": 5.1249 }, "ransom": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "ransomware": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "rapid": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "rare": { "positive": 5.3234, "negative": 4.8676, "neutral": 5.1249 }, "rari": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "rate": { "positive": 5.0125, "negative": 4.7233, "neutral": 4.7838 }, "ratio": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "rave": { "positive": 6.1227, "negative": 4.8676, "neutral": 4.9281 }, "rave april": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "re": { "positive": 4.313, "negative": 3.997, "neutral": 4.0575 }, "re gonna": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "re still": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "re welcome": { "positive": 5.3234, "negative": 4.6094, "neutral": 4.7838 }, "reach": { "positive": 4.8157, "negative": 4.6094, "neutral": 4.5756 }, "reaches": { "positive": 5.3234, "negative": 4.8676, "neutral": 5.1249 }, "react": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "read": { "positive": 4.4632, "negative": 4.5152, "neutral": 4.7838 }, "reading": { "positive": 5.0125, "negative": 4.8676, "neutral": 5.4358 }, "ready": { "positive": 4.4632, "negative": 3.905, "neutral": 4.0251 }, "ready send": { "positive": 6.1227, "negative": 4.8676, "neutral": 4.9281 }, "ready true": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "real": { "positive": 3.9451, "negative": 3.6077, "neutral": 3.6681 }, "real action": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "real adoption": { "positive": 6.1227, "negative": 3.905, "neutral": 3.9654 }, "real infra": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "real time": { "positive": 4.8157, "negative": 4.8676, "neutral": 6.2351 }, "real world": { "positive": 4.6714, "negative": 5.0644, "neutral": 5.1249 }, "realize": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "realized": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "really": { "positive": 4.4632, "negative": 4.4349, "neutral": 4.2572 }, "really well": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "reason": { "positive": 4.6714, "negative": 4.7233, "neutral": 4.5756 }, "reasons": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "rebound": { "positive": 6.1227, "negative": 4.7233, "neutral": 4.7838 }, "recent": { "positive": 4.6714, "negative": 4.6094, "neutral": 5.4358 }, "recently": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "reclaim": { "positive": 5.0125, "negative": 5.0644, "neutral": 4.7838 }, "recommend": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "record": { "positive": 4.8157, "negative": 3.8023, "neutral": 3.7968 }, "record high": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "recover": { "positive": 6.1227, "negative": 4.8676, "neutral": 4.9281 }, "recovery": { "positive": 5.3234, "negative": 5.3754, "neutral": 5.1249 }, "red": { "positive": 4.0986, "negative": 5.0644, "neutral": 4.1289 }, "red candles": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "red flat": { "positive": 4.8157, "negative": 6.1746, "neutral": 4.9281 }, "reddit": { "positive": 4.6714, "negative": 5.0644, "neutral": 5.1249 }, "refresh": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "regret": { "positive": 5.3234, "negative": 5.0644, "neutral": 4.9281 }, "regulate": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "regulation": { "positive": 4.251, "negative": 4.4349, "neutral": 4.7838 }, "regulations": { "positive": 4.5575, "negative": 4.6094, "neutral": 6.2351 }, "regulator": { "positive": 4.8157, "negative": 5.0644, "neutral": 4.9281 }, "regulators": { "positive": 4.313, "negative": 4.8676, "neutral": 4.6698 }, "regulators announced": { "positive": 4.8157, "negative": 6.1746, "neutral": 4.9281 }, "reimburse": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "rekt": { "positive": 3.388, "negative": 6.1746, "neutral": 3.5004 }, "rekt chart": { "positive": 4.3829, "negative": 6.1746, "neutral": 4.4953 }, "rekt fundamentals": { "positive": 4.251, "negative": 6.1746, "neutral": 4.3634 }, "rekt looks": { "positive": 4.3829, "negative": 6.1746, "neutral": 4.4953 }, "rekt support": { "positive": 4.251, "negative": 6.1746, "neutral": 4.3634 }, "rekt trend": { "positive": 4.3829, "negative": 6.1746, "neutral": 4.4953 }, "rekt volume": { "positive": 4.5575, "negative": 6.1746, "neutral": 4.6698 }, "related": { "positive": 4.5575, "negative": 6.1746, "neutral": 4.6698 }, "relative": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "release": { "positive": 4.4632, "negative": 4.5152, "neutral": 6.2351 }, "released": { "positive": 4.8157, "negative": 4.8676, "neutral": 5.1249 }, "releases": { "positive": 5.0125, "negative": 5.0644, "neutral": 5.1249 }, "remain": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "remains": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "remember": { "positive": 4.6714, "negative": 4.8676, "neutral": 4.9281 }, "remittance": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "remote": { "positive": 4.8157, "negative": 4.7233, "neutral": 5.4358 }, "removal": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "render": { "positive": 6.1227, "negative": 4.8676, "neutral": 4.9281 }, "renewable": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "renewable energy": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "repeated": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "replace": { "positive": 4.6714, "negative": 4.8676, "neutral": 5.4358 }, "replacing": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "repo": { "positive": 4.8157, "negative": 5.0644, "neutral": 5.4358 }, "report": { "positive": 4.5575, "negative": 4.8676, "neutral": 4.7838 }, "reported": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "reports": { "positive": 4.8157, "negative": 4.8676, "neutral": 4.5756 }, "reports record": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "reputation": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "requests": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "rescue": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "research": { "positive": 4.3829, "negative": 4.3649, "neutral": 4.9281 }, "reserve": { "positive": 5.0125, "negative": 5.0644, "neutral": 5.1249 }, "reserves": { "positive": 4.5575, "negative": 5.3754, "neutral": 4.5756 }, "resist": { "positive": 4.6714, "negative": 4.7233, "neutral": 5.1249 }, "resist retire": { "positive": 5.0125, "negative": 4.8676, "neutral": 5.4358 }, "resistance": { "positive": 5.3234, "negative": 4.8676, "neutral": 5.1249 }, "resistant": { "positive": 4.5575, "negative": 4.6094, "neutral": 6.2351 }, "resists": { "positive": 5.3234, "negative": 5.3754, "neutral": 5.1249 }, "resolution": { "positive": 5.3234, "negative": 5.3754, "neutral": 5.1249 }, "response": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "response apple": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "result": { "positive": 5.3234, "negative": 5.3754, "neutral": 5.1249 }, "resulting": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "retail": { "positive": 5.0125, "negative": 5.0644, "neutral": 4.7838 }, "retail investors": { "positive": 5.3234, "negative": 5.3754, "neutral": 5.1249 }, "retard": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "retarded": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "retire": { "positive": 5.0125, "negative": 4.7233, "neutral": 5.1249 }, "retirement": { "positive": 5.3234, "negative": 4.8676, "neutral": 5.1249 }, "return": { "positive": 4.6714, "negative": 5.0644, "neutral": 4.7838 }, "returns": { "positive": 4.8157, "negative": 4.7233, "neutral": 4.9281 }, "reuters": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "revenue": { "positive": 4.3829, "negative": 4.3029, "neutral": 4.3077 }, "revenue jumps": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "reversal": { "positive": 5.0125, "negative": 4.4349, "neutral": 4.6698 }, "review": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "revive": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "revives": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "revolt": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "reward": { "positive": 5.3234, "negative": 5.3754, "neutral": 5.1249 }, "rggtracxfrge": { "positive": 5.3234, "negative": 4.5152, "neutral": 4.4953 }, "rh": { "positive": 6.1227, "negative": 4.8676, "neutral": 4.9281 }, "rich": { "positive": 4.5575, "negative": 4.3649, "neutral": 4.4953 }, "rich get": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "richer": { "positive": 4.8157, "negative": 5.3754, "neutral": 5.1249 }, "riddance": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "right": { "positive": 2.944, "negative": 2.9451, "neutral": 3.7968 }, "right here": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "right now": { "positive": 2.9884, "negative": 2.9959, "neutral": 4.0575 }, "rip": { "positive": 5.0125, "negative": 4.6094, "neutral": 4.9281 }, "ripple": { "positive": 3.6072, "negative": 3.6077, "neutral": 3.5778 }, "ripple all": { "positive": 4.6714, "negative": 6.1746, "neutral": 4.7838 }, "ripple breaking": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "ripple buy": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "ripple chart": { "positive": 5.3234, "negative": 5.0644, "neutral": 4.9281 }, "ripple crashes": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "ripple getting": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "ripple here": { "positive": 5.3234, "negative": 4.7233, "neutral": 4.9281 }, "ripple momentum": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "ripple news": { "positive": 4.6714, "negative": 4.7233, "neutral": 6.2351 }, "ripple support": { "positive": 5.3234, "negative": 5.3754, "neutral": 5.1249 }, "ripple surges": { "positive": 6.1227, "negative": 4.7233, "neutral": 4.7838 }, "ripple trading": { "positive": 4.8157, "negative": 4.8676, "neutral": 6.2351 }, "ripple weak": { "positive": 4.8157, "negative": 6.1746, "neutral": 4.9281 }, "rise": { "positive": 4.8157, "negative": 4.7233, "neutral": 4.6698 }, "rising": { "positive": 6.1227, "negative": 4.8676, "neutral": 4.9281 }, "risk": { "positive": 4.4632, "negative": 4.8676, "neutral": 4.4953 }, "risks": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "rkiqmsc": { "positive": 6.1227, "negative": 4.8676, "neutral": 4.9281 }, "rkiqmsc yl": { "positive": 6.1227, "negative": 4.8676, "neutral": 4.9281 }, "rn": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "road": { "positive": 4.8157, "negative": 5.3754, "neutral": 4.7838 }, "roadmap": { "positive": 3.6072, "negative": 3.6414, "neutral": 5.4358 }, "roads": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "roads lead": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "robinhood": { "positive": 4.4632, "negative": 4.7233, "neutral": 4.7838 }, "rock": { "positive": 6.1227, "negative": 4.7233, "neutral": 4.7838 }, "rocket": { "positive": 6.1227, "negative": 4.6094, "neutral": 4.6698 }, "role": { "positive": 4.8157, "negative": 5.0644, "neutral": 4.9281 }, "round": { "positive": 4.8157, "negative": 4.8676, "neutral": 5.1249 }, "royal": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "rrz": { "positive": 6.1227, "negative": 4.8676, "neutral": 4.9281 }, "rrz ys": { "positive": 6.1227, "negative": 4.8676, "neutral": 4.9281 }, "rsi": { "positive": 5.3234, "negative": 5.3754, "neutral": 5.1249 }, "rug": { "positive": 3.9127, "negative": 6.1746, "neutral": 4.0251 }, "rug pull": { "positive": 3.9451, "negative": 6.1746, "neutral": 4.0575 }, "rugpull": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "rule": { "positive": 4.8157, "negative": 5.0644, "neutral": 4.9281 }, "rules": { "positive": 4.3829, "negative": 4.5152, "neutral": 4.6698 }, "rumours": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "run": { "positive": 4.313, "negative": 3.3938, "neutral": 3.4768 }, "run $updog": { "positive": 6.1227, "negative": 4.1967, "neutral": 4.2572 }, "run also": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "run now": { "positive": 6.1227, "negative": 4.8676, "neutral": 4.9281 }, "run started": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "run up": { "positive": 5.0125, "negative": 5.0644, "neutral": 4.7838 }, "runner": { "positive": 5.0125, "negative": 4.5152, "neutral": 4.7838 }, "runners": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "running": { "positive": 4.6714, "negative": 4.5152, "neutral": 4.5756 }, "runs": { "positive": 4.8157, "negative": 4.7233, "neutral": 5.4358 }, "runtime": { "positive": 4.8157, "negative": 4.8676, "neutral": 6.2351 }, "runway": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "russia": { "positive": 4.5575, "negative": 5.3754, "neutral": 4.7838 }, "russian": { "positive": 4.8157, "negative": 5.3754, "neutral": 4.7838 }, "rust": { "positive": 4.4632, "negative": 4.5152, "neutral": 6.2351 }, "rwa": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "sad": { "positive": 5.3234, "negative": 4.8676, "neutral": 5.1249 }, "safe": { "positive": 4.313, "negative": 4.7233, "neutral": 4.5756 }, "safe crypto": { "positive": 5.3234, "negative": 5.3754, "neutral": 5.1249 }, "safety": { "positive": 4.5575, "negative": 4.8676, "neutral": 5.1249 }, "said": { "positive": 5.3234, "negative": 4.1079, "neutral": 4.1289 }, "said buy": { "positive": 6.1227, "negative": 4.8676, "neutral": 4.9281 }, "sale": { "positive": 5.3234, "negative": 5.3754, "neutral": 5.1249 }, "sales": { "positive": 4.8157, "negative": 5.0644, "neutral": 4.9281 }, "salvador": { "positive": 4.8157, "negative": 5.3754, "neutral": 5.1249 }, "salvage": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "salvage lose": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "sam": { "positive": 4.6714, "negative": 5.0644, "neutral": 5.1249 }, "sam bankman": { "positive": 4.6714, "negative": 5.0644, "neutral": 5.1249 }, "same": { "positive": 4.251, "negative": 4.3029, "neutral": 4.3077 }, "same 'ol": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "sanctions": { "positive": 4.8157, "negative": 4.8676, "neutral": 5.1249 }, "save": { "positive": 5.0125, "negative": 5.0644, "neutral": 4.7838 }, "saves": { "positive": 5.0125, "negative": 4.8676, "neutral": 5.4358 }, "saving": { "positive": 5.3234, "negative": 5.3754, "neutral": 5.1249 }, "savings": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "saw": { "positive": 5.0125, "negative": 5.0644, "neutral": 5.1249 }, "say": { "positive": 4.251, "negative": 4.4349, "neutral": 4.211 }, "saying": { "positive": 4.6714, "negative": 6.1746, "neutral": 4.7838 }, "saylor": { "positive": 5.3234, "negative": 4.8676, "neutral": 4.7838 }, "says": { "positive": 3.3309, "negative": 3.8512, "neutral": 3.525 }, "says binance": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "says bitcoin": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "says ceo": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "says hackers": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "says stolen": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "scaling": { "positive": 4.5575, "negative": 4.7233, "neutral": 4.9281 }, "scaling ethereum": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "scam": { "positive": 3.3309, "negative": 3.905, "neutral": 3.2687 }, "scam chain": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "scam solana": { "positive": 5.3234, "negative": 5.3754, "neutral": 5.1249 }, "scammed": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "scammers": { "positive": 4.6714, "negative": 6.1746, "neutral": 4.7838 }, "scams": { "positive": 4.313, "negative": 6.1746, "neutral": 4.4254 }, "scandal": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "schedule": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "scheduled": { "positive": 3.9451, "negative": 3.997, "neutral": 6.2351 }, "scheme": { "positive": 4.251, "negative": 6.1746, "neutral": 4.3634 }, "schemes": { "positive": 4.6714, "negative": 6.1746, "neutral": 4.7838 }, "schwab": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "scientific": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "scooped": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "scooped up": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "scores": { "positive": 5.3234, "negative": 5.3754, "neutral": 5.1249 }, "scratch": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "screener": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "sdk": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "search": { "positive": 4.3829, "negative": 4.4349, "neutral": 5.1249 }, "search engine": { "positive": 4.8157, "negative": 4.8676, "neutral": 6.2351 }, "season": { "positive": 4.4632, "negative": 4.3029, "neutral": 4.3634 }, "sec": { "positive": 3.5239, "negative": 5.0644, "neutral": 3.6063 }, "sec charges": { "positive": 4.6714, "negative": 6.1746, "neutral": 4.7838 }, "sec filed": { "positive": 4.313, "negative": 6.1746, "neutral": 4.4254 }, "sec lawsuit": { "positive": 4.6714, "negative": 6.1746, "neutral": 4.7838 }, "sec sues": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "second": { "positive": 4.1953, "negative": 4.3649, "neutral": 4.5756 }, "seconds": { "positive": 4.5575, "negative": 4.6094, "neutral": 5.1249 }, "secret": { "positive": 4.8157, "negative": 5.3754, "neutral": 5.1249 }, "secrets": { "positive": 4.8157, "negative": 4.8676, "neutral": 6.2351 }, "sector": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "secure": { "positive": 4.8157, "negative": 4.8676, "neutral": 6.2351 }, "secured": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "securities": { "positive": 4.313, "negative": 4.6094, "neutral": 4.6698 }, "security": { "positive": 4.0986, "negative": 4.3649, "neutral": 4.4254 }, "security engineer": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "see": { "positive": 3.882, "negative": 3.5915, "neutral": 3.5919 }, "see again": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "see cents": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "see how": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "see updog": { "positive": 6.1227, "negative": 4.7233, "neutral": 4.7838 }, "see ya": { "positive": 5.3234, "negative": 4.1505, "neutral": 4.1684 }, "seed": { "positive": 4.5575, "negative": 4.8676, "neutral": 5.1249 }, "seeing": { "positive": 5.0125, "negative": 4.6094, "neutral": 4.9281 }, "seeking": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "seems": { "positive": 5.3234, "negative": 4.7233, "neutral": 4.9281 }, "seems like": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "seen": { "positive": 4.4632, "negative": 4.4349, "neutral": 4.1684 }, "seen so": { "positive": 5.3234, "negative": 5.3754, "neutral": 5.1249 }, "sees": { "positive": 5.0125, "negative": 5.3754, "neutral": 4.9281 }, "seized": { "positive": 4.251, "negative": 6.1746, "neutral": 4.3634 }, "seized iran's": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "seized nearly": { "positive": 4.8157, "negative": 6.1746, "neutral": 4.9281 }, "seizes": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "self": { "positive": 4.313, "negative": 4.3649, "neutral": 5.1249 }, "self hosted": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "sell": { "positive": 3.5724, "negative": 3.905, "neutral": 3.9654 }, "sell here": { "positive": 3.9451, "negative": 3.997, "neutral": 6.2351 }, "sell soon": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "sellers": { "positive": 4.8157, "negative": 5.3754, "neutral": 4.7838 }, "selling": { "positive": 3.3202, "negative": 6.1746, "neutral": 3.4326 }, "selling $btc": { "positive": 4.8157, "negative": 6.1746, "neutral": 4.9281 }, "selling $eth": { "positive": 4.8157, "negative": 6.1746, "neutral": 4.9281 }, "selling ada": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "selling altcoins": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "selling bnb": { "positive": 4.8157, "negative": 6.1746, "neutral": 4.9281 }, "selling btc": { "positive": 4.8157, "negative": 6.1746, "neutral": 4.9281 }, "selling doge": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "selling eth": { "positive": 4.6714, "negative": 6.1746, "neutral": 4.7838 }, "selling ethereum": { "positive": 4.6714, "negative": 6.1746, "neutral": 4.7838 }, "selling link": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "selling market": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "selling ripple": { "positive": 4.8157, "negative": 6.1746, "neutral": 4.9281 }, "selling sol": { "positive": 4.8157, "negative": 6.1746, "neutral": 4.9281 }, "selling xrp": { "positive": 4.8157, "negative": 6.1746, "neutral": 4.9281 }, "selloff": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "sells": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "senate": { "positive": 4.8157, "negative": 4.5152, "neutral": 4.6698 }, "senate bill": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "senate passes": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "send": { "positive": 5.0125, "negative": 4.1505, "neutral": 4.211 }, "send $updog": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "send higher": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "sending": { "positive": 5.3234, "negative": 5.3754, "neutral": 5.1249 }, "sends": { "positive": 4.6714, "negative": 4.8676, "neutral": 4.9281 }, "sense": { "positive": 4.8157, "negative": 5.3754, "neutral": 5.1249 }, "sentence": { "positive": 4.8157, "negative": 5.3754, "neutral": 5.1249 }, "sentenced": { "positive": 4.8157, "negative": 6.1746, "neutral": 4.9281 }, "sentencing": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "sentiment": { "positive": 4.5575, "negative": 4.6094, "neutral": 4.5756 }, "sepa": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "sepa network": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "seriously": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "server": { "positive": 4.8157, "negative": 5.0644, "neutral": 4.9281 }, "service": { "positive": 4.4632, "negative": 5.0644, "neutral": 4.7838 }, "services": { "positive": 4.8157, "negative": 4.8676, "neutral": 5.1249 }, "set": { "positive": 4.5575, "negative": 4.5152, "neutral": 4.4953 }, "settle": { "positive": 5.0125, "negative": 5.0644, "neutral": 5.1249 }, "setup": { "positive": 6.1227, "negative": 4.8676, "neutral": 4.9281 }, "seven": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "several": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "sh": { "positive": 4.0986, "negative": 5.0644, "neutral": 4.3077 }, "shake": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "shaken": { "positive": 3.4654, "negative": 5.3754, "neutral": 3.5641 }, "shaken out": { "positive": 3.4654, "negative": 5.3754, "neutral": 3.5641 }, "shame": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "share": { "positive": 4.8157, "negative": 4.6094, "neutral": 4.7838 }, "shared": { "positive": 4.056, "negative": 4.1079, "neutral": 6.2351 }, "shared roadmap": { "positive": 4.0986, "negative": 4.1505, "neutral": 6.2351 }, "shares": { "positive": 4.6714, "negative": 4.8676, "neutral": 4.9281 }, "sharing": { "positive": 4.3829, "negative": 4.3649, "neutral": 5.4358 }, "sharply": { "positive": 6.1227, "negative": 3.997, "neutral": 4.0575 }, "sheds": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "shift": { "positive": 5.3234, "negative": 4.7233, "neutral": 4.9281 }, "ship": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "shit": { "positive": 3.3419, "negative": 5.0644, "neutral": 3.4326 }, "shit coin": { "positive": 4.251, "negative": 5.3754, "neutral": 4.3077 }, "shit just": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "shitcoin": { "positive": 4.6714, "negative": 6.1746, "neutral": 4.7838 }, "shitcoins": { "positive": 5.3234, "negative": 5.3754, "neutral": 5.1249 }, "shitty": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "shock": { "positive": 4.8157, "negative": 5.0644, "neutral": 4.6698 }, "shopping": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "short": { "positive": 4.3829, "negative": 4.3029, "neutral": 4.0575 }, "short term": { "positive": 6.1227, "negative": 4.6094, "neutral": 4.6698 }, "shorts": { "positive": 5.0125, "negative": 5.0644, "neutral": 4.7838 }, "shot": { "positive": 4.5575, "negative": 4.3029, "neutral": 4.7838 }, "show": { "positive": 2.7836, "negative": 2.8199, "neutral": 3.6847 }, "show hn": { "positive": 2.7876, "negative": 2.8316, "neutral": 3.7568 }, "showing": { "positive": 5.3234, "negative": 4.6094, "neutral": 4.7838 }, "shows": { "positive": 4.6714, "negative": 4.5152, "neutral": 5.1249 }, "shutdown": { "positive": 4.1953, "negative": 6.1746, "neutral": 4.3077 }, "shuts": { "positive": 4.5575, "negative": 6.1746, "neutral": 4.6698 }, "shuts down": { "positive": 4.6714, "negative": 6.1746, "neutral": 4.7838 }, "shutting": { "positive": 4.4632, "negative": 6.1746, "neutral": 4.5756 }, "shutting down": { "positive": 4.4632, "negative": 6.1746, "neutral": 4.5756 }, "side": { "positive": 4.8157, "negative": 4.8676, "neutral": 5.1249 }, "sideways": { "positive": 3.9796, "negative": 4.0315, "neutral": 4.7838 }, "sideways no": { "positive": 4.056, "negative": 4.1079, "neutral": 6.2351 }, "sign": { "positive": 5.3234, "negative": 5.3754, "neutral": 5.1249 }, "signal": { "positive": 4.6714, "negative": 4.6094, "neutral": 4.6698 }, "signed": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "significantly": { "positive": 5.3234, "negative": 5.3754, "neutral": 5.1249 }, "signs": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "silicon": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "silicon valley": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "silk": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "silk road": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "silver": { "positive": 5.3234, "negative": 4.8676, "neutral": 5.1249 }, "simplest": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "since": { "positive": 4.3829, "negative": 4.3649, "neutral": 4.092 }, "single": { "positive": 4.313, "negative": 4.3649, "neutral": 4.5756 }, "sinks": { "positive": 4.8157, "negative": 6.1746, "neutral": 4.9281 }, "sister": { "positive": 6.1227, "negative": 4.3649, "neutral": 4.4254 }, "sister crypto": { "positive": 6.1227, "negative": 4.5152, "neutral": 4.5756 }, "sites": { "positive": 4.8157, "negative": 5.0644, "neutral": 5.4358 }, "skpqpump": { "positive": 6.1227, "negative": 4.8676, "neutral": 4.9281 }, "sky": { "positive": 5.3234, "negative": 5.3754, "neutral": 5.1249 }, "skyrocket": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "sleep": { "positive": 5.3234, "negative": 4.8676, "neutral": 5.1249 }, "sleep one": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "slide": { "positive": 5.3234, "negative": 5.3754, "neutral": 5.1249 }, "slides": { "positive": 4.8157, "negative": 5.0644, "neutral": 5.4358 }, "slowly": { "positive": 5.3234, "negative": 4.6094, "neutral": 4.5756 }, "slumps": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "sma": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "small": { "positive": 4.8157, "negative": 4.6094, "neutral": 4.7838 }, "small position": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "smart": { "positive": 4.0986, "negative": 3.4399, "neutral": 3.4118 }, "smart chain": { "positive": 4.8157, "negative": 6.1746, "neutral": 4.9281 }, "smart contract": { "positive": 4.8157, "negative": 5.3754, "neutral": 5.1249 }, "smart contracts": { "positive": 4.5575, "negative": 5.3754, "neutral": 4.7838 }, "smart money": { "positive": 6.1227, "negative": 3.4903, "neutral": 3.5508 }, "smell": { "positive": 6.1227, "negative": 4.8676, "neutral": 4.9281 }, "smells": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "so": { "positive": 3.4384, "negative": 3.5915, "neutral": 3.5004 }, "so cheap": { "positive": 5.0125, "negative": 5.0644, "neutral": 5.1249 }, "so far": { "positive": 4.5575, "negative": 4.7233, "neutral": 4.9281 }, "so fucked": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "so hard": { "positive": 5.3234, "negative": 5.3754, "neutral": 5.1249 }, "so many": { "positive": 4.3829, "negative": 4.6094, "neutral": 4.4254 }, "so much": { "positive": 4.8157, "negative": 4.7233, "neutral": 4.9281 }, "so top": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "soar": { "positive": 6.1227, "negative": 4.6094, "neutral": 4.6698 }, "soar unaware": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "soaring": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "soars": { "positive": 6.1227, "negative": 4.5152, "neutral": 4.5756 }, "social": { "positive": 4.5575, "negative": 4.7233, "neutral": 4.9281 }, "social media": { "positive": 5.3234, "negative": 5.3754, "neutral": 5.1249 }, "social network": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "software": { "positive": 4.1953, "negative": 4.1967, "neutral": 4.9281 }, "sol": { "positive": 3.5557, "negative": 3.5606, "neutral": 3.525 }, "sol all": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "sol breaking": { "positive": 6.1227, "negative": 4.8676, "neutral": 4.9281 }, "sol buy": { "positive": 4.8157, "negative": 5.0644, "neutral": 4.9281 }, "sol crashes": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "sol fundamentals": { "positive": 5.3234, "negative": 5.3754, "neutral": 5.1249 }, "sol getting": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "sol here": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "sol news": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "sol support": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "sol surges": { "positive": 6.1227, "negative": 4.7233, "neutral": 4.7838 }, "sol trading": { "positive": 4.6714, "negative": 4.7233, "neutral": 6.2351 }, "sol volume": { "positive": 5.0125, "negative": 4.8676, "neutral": 4.6698 }, "sol weak": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "solana": { "positive": 3.1971, "negative": 3.3214, "neutral": 3.3267 }, "solana aih": { "positive": 6.1227, "negative": 4.8676, "neutral": 4.9281 }, "solana all": { "positive": 4.6714, "negative": 6.1746, "neutral": 4.7838 }, "solana based": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "solana breaking": { "positive": 6.1227, "negative": 4.8676, "neutral": 4.9281 }, "solana buy": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "solana chart": { "positive": 5.3234, "negative": 5.0644, "neutral": 4.9281 }, "solana crashes": { "positive": 4.4632, "negative": 6.1746, "neutral": 4.5756 }, "solana getting": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "solana here": { "positive": 5.3234, "negative": 4.6094, "neutral": 4.7838 }, "solana meme": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "solana news": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "solana support": { "positive": 5.3234, "negative": 4.8676, "neutral": 4.7838 }, "solana token": { "positive": 4.8157, "negative": 4.8676, "neutral": 6.2351 }, "solana trading": { "positive": 4.8157, "negative": 4.8676, "neutral": 6.2351 }, "solana volume": { "positive": 5.3234, "negative": 5.0644, "neutral": 4.9281 }, "solana wallets": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "solana weak": { "positive": 4.8157, "negative": 6.1746, "neutral": 4.9281 }, "solana web": { "positive": 4.8157, "negative": 5.0644, "neutral": 5.4358 }, "solana's": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "solar": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "sold": { "positive": 4.5575, "negative": 4.8676, "neutral": 4.4254 }, "solid": { "positive": 6.1227, "negative": 3.7794, "neutral": 3.8399 }, "solid project": { "positive": 6.1227, "negative": 3.905, "neutral": 3.9654 }, "solidity": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "solution": { "positive": 5.0125, "negative": 5.3754, "neutral": 4.9281 }, "some": { "positive": 3.7055, "negative": 3.4399, "neutral": 3.5641 }, "some coins": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "some crazy": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "some decent": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "some love": { "positive": 6.1227, "negative": 4.8676, "neutral": 4.9281 }, "some more": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "some point": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "some real": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "some volume": { "positive": 6.1227, "negative": 4.8676, "neutral": 4.9281 }, "someone": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "something": { "positive": 4.251, "negative": 4.3649, "neutral": 4.6698 }, "something off": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "sometime": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "son": { "positive": 4.6714, "negative": 5.0644, "neutral": 5.1249 }, "sonic": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "sons": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "soon": { "positive": 3.7743, "negative": 3.6243, "neutral": 3.8399 }, "soon buy": { "positive": 5.0125, "negative": 5.3754, "neutral": 4.9281 }, "sophie": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "sophie how": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "sorry": { "positive": 5.3234, "negative": 5.3754, "neutral": 5.1249 }, "source": { "positive": 3.853, "negative": 4.0315, "neutral": 4.7838 }, "south": { "positive": 4.6714, "negative": 4.8676, "neutral": 4.9281 }, "south korea": { "positive": 4.8157, "negative": 5.0644, "neutral": 5.4358 }, "sovereignai": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "sovereignai buildout": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "space": { "positive": 4.6714, "negative": 4.3649, "neutral": 4.5756 }, "spacex": { "positive": 5.0125, "negative": 4.6094, "neutral": 4.9281 }, "spacex ipo": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "spam": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "speaks": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "speed": { "positive": 5.3234, "negative": 5.3754, "neutral": 5.1249 }, "spend": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "spending": { "positive": 5.0125, "negative": 5.0644, "neutral": 5.1249 }, "spent": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "spiking": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "spot": { "positive": 5.0125, "negative": 3.8774, "neutral": 3.8867 }, "spot bitcoin": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "spot etf": { "positive": 6.1227, "negative": 4.1505, "neutral": 4.211 }, "spreading": { "positive": 5.0125, "negative": 5.3754, "neutral": 4.9281 }, "spreading fud": { "positive": 5.3234, "negative": 5.3754, "neutral": 5.1249 }, "square": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "squeeze": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "stable": { "positive": 5.0125, "negative": 4.0684, "neutral": 4.1289 }, "stable coin": { "positive": 5.3234, "negative": 4.6094, "neutral": 4.5756 }, "stable coins": { "positive": 6.1227, "negative": 4.7233, "neutral": 4.7838 }, "stablecoin": { "positive": 3.2143, "negative": 3.4164, "neutral": 3.3723 }, "stablecoin bill": { "positive": 5.3234, "negative": 5.0644, "neutral": 4.9281 }, "stablecoin collapsed": { "positive": 4.4632, "negative": 6.1746, "neutral": 4.5756 }, "stablecoin ex": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "stablecoin issuer": { "positive": 5.3234, "negative": 5.0644, "neutral": 4.9281 }, "stablecoin market": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "stablecoin payments": { "positive": 4.6714, "negative": 4.7233, "neutral": 6.2351 }, "stablecoin project": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "stablecoin reserve": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "stablecoin startup": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "stablecoin tether": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "stablecoin trading": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "stablecoins": { "positive": 3.664, "negative": 3.8023, "neutral": 4.0575 }, "stack": { "positive": 5.0125, "negative": 4.8676, "neutral": 4.9281 }, "stackshighsociety": { "positive": 4.8157, "negative": 5.3754, "neutral": 4.7838 }, "staff": { "positive": 4.8157, "negative": 5.0644, "neutral": 5.4358 }, "stake": { "positive": 4.8157, "negative": 4.7233, "neutral": 5.4358 }, "stake forbes": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "staking": { "positive": 5.3234, "negative": 4.3649, "neutral": 4.4953 }, "staking tokens": { "positive": 6.1227, "negative": 4.7233, "neutral": 4.7838 }, "standard": { "positive": 4.5575, "negative": 4.6094, "neutral": 4.7838 }, "standard chartered": { "positive": 5.3234, "negative": 5.3754, "neutral": 5.1249 }, "stanley": { "positive": 5.3234, "negative": 4.8676, "neutral": 5.1249 }, "stark": { "positive": 5.0125, "negative": 4.8676, "neutral": 5.4358 }, "starknet": { "positive": 5.3234, "negative": 4.6094, "neutral": 4.5756 }, "start": { "positive": 4.5575, "negative": 3.997, "neutral": 4.1684 }, "start move": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "start pump": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "start staking": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "started": { "positive": 4.3829, "negative": 4.3029, "neutral": 4.211 }, "starting": { "positive": 5.0125, "negative": 4.3649, "neutral": 4.4254 }, "starts": { "positive": 4.5575, "negative": 4.5152, "neutral": 4.9281 }, "startup": { "positive": 4.1953, "negative": 4.5152, "neutral": 4.5756 }, "state": { "positive": 4.5575, "negative": 4.7233, "neutral": 4.6698 }, "stated": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "stated previously": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "statements": { "positive": 5.3234, "negative": 5.3754, "neutral": 5.1249 }, "stats": { "positive": 3.9127, "negative": 3.997, "neutral": 5.4358 }, "stats published": { "positive": 3.9796, "negative": 4.0315, "neutral": 6.2351 }, "stay": { "positive": 4.313, "negative": 4.5152, "neutral": 4.3077 }, "stay away": { "positive": 4.8157, "negative": 6.1746, "neutral": 4.9281 }, "stay strong": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "stayed": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "stays": { "positive": 5.3234, "negative": 5.0644, "neutral": 4.9281 }, "stays up": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "steady": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "steal": { "positive": 3.7993, "negative": 6.1746, "neutral": 3.9117 }, "steal crypto": { "positive": 4.8157, "negative": 6.1746, "neutral": 4.9281 }, "steal cryptocurrency": { "positive": 4.5575, "negative": 6.1746, "neutral": 4.6698 }, "stealing": { "positive": 4.3829, "negative": 6.1746, "neutral": 4.4953 }, "stealing crypto": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "steam": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "stellar": { "positive": 5.3234, "negative": 4.8676, "neutral": 5.1249 }, "step": { "positive": 4.5575, "negative": 4.5152, "neutral": 4.3634 }, "step down": { "positive": 4.8157, "negative": 6.1746, "neutral": 4.9281 }, "steps": { "positive": 4.6714, "negative": 4.8676, "neutral": 4.9281 }, "steps up": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "still": { "positive": 3.4939, "negative": 3.5759, "neutral": 3.4433 }, "still bearish": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "still coming": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "still early": { "positive": 6.1227, "negative": 4.7233, "neutral": 4.7838 }, "still holding": { "positive": 4.0165, "negative": 4.8676, "neutral": 4.0251 }, "still think": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "stock": { "positive": 4.4632, "negative": 4.5152, "neutral": 4.3077 }, "stock market": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "stocks": { "positive": 3.5724, "negative": 4.5152, "neutral": 3.7196 }, "stocks crypto": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "stocks instead": { "positive": 3.7275, "negative": 6.1746, "neutral": 3.8399 }, "stocktwits": { "positive": 5.3234, "negative": 4.8676, "neutral": 5.1249 }, "stole": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "stolen": { "positive": 3.664, "negative": 6.1746, "neutral": 3.7764 }, "stolen crypto": { "positive": 4.8157, "negative": 6.1746, "neutral": 4.9281 }, "stolen cryptocurrency": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "stolen data": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "stop": { "positive": 4.056, "negative": 4.2472, "neutral": 4.4953 }, "stopped": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "storage": { "positive": 5.0125, "negative": 4.6094, "neutral": 4.9281 }, "store": { "positive": 4.6714, "negative": 4.8676, "neutral": 5.4358 }, "story": { "positive": 5.0125, "negative": 5.0644, "neutral": 5.1249 }, "straight": { "positive": 4.313, "negative": 5.3754, "neutral": 4.4953 }, "straight back": { "positive": 4.8157, "negative": 6.1746, "neutral": 4.9281 }, "strategies": { "positive": 4.6714, "negative": 4.8676, "neutral": 5.4358 }, "stratosphere": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "street": { "positive": 5.0125, "negative": 5.0644, "neutral": 5.1249 }, "street's": { "positive": 5.3234, "negative": 5.3754, "neutral": 5.1249 }, "strength": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "stress": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "strict": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "strict list": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "stripe": { "positive": 4.8157, "negative": 5.0644, "neutral": 5.4358 }, "strong": { "positive": 6.1227, "negative": 3.1629, "neutral": 3.2234 }, "strong confident": { "positive": 6.1227, "negative": 4.4349, "neutral": 4.4953 }, "strong support": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "structure": { "positive": 5.3234, "negative": 5.3754, "neutral": 5.1249 }, "study": { "positive": 5.0125, "negative": 4.7233, "neutral": 4.7838 }, "stuff": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "stupid": { "positive": 4.313, "negative": 5.3754, "neutral": 4.3634 }, "sub": { "positive": 5.3234, "negative": 4.6094, "neutral": 4.7838 }, "subscriptions": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "succeed": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "such": { "positive": 4.4632, "negative": 4.4349, "neutral": 4.3634 }, "such life": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "suck": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "suckers": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "sucks": { "positive": 4.8157, "negative": 6.1746, "neutral": 4.9281 }, "sue": { "positive": 4.6714, "negative": 6.1746, "neutral": 4.7838 }, "sued": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "sues": { "positive": 4.3829, "negative": 6.1746, "neutral": 4.4953 }, "suffers": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "suggest": { "positive": 6.1227, "negative": 4.8676, "neutral": 4.9281 }, "suggests": { "positive": 4.6714, "negative": 5.3754, "neutral": 4.9281 }, "sui": { "positive": 4.3829, "negative": 4.5152, "neutral": 4.2572 }, "summer": { "positive": 5.3234, "negative": 4.8676, "neutral": 5.1249 }, "sun": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "super": { "positive": 4.8157, "negative": 4.2472, "neutral": 4.4953 }, "super bullish": { "positive": 6.1227, "negative": 4.8676, "neutral": 4.9281 }, "supply": { "positive": 4.6714, "negative": 4.3029, "neutral": 4.4953 }, "supply chain": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "supply shock": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "support": { "positive": 3.4517, "negative": 3.2931, "neutral": 3.0726 }, "support held": { "positive": 6.1227, "negative": 3.4773, "neutral": 3.5377 }, "support just": { "positive": 3.5239, "negative": 6.1746, "neutral": 3.6363 }, "support level": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "supports": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "supposed": { "positive": 5.3234, "negative": 5.3754, "neutral": 5.1249 }, "sure": { "positive": 5.0125, "negative": 4.6094, "neutral": 4.6698 }, "surge": { "positive": 6.1227, "negative": 4.6094, "neutral": 4.6698 }, "surges": { "positive": 5.0125, "negative": 3.3214, "neutral": 3.4016 }, "surges new": { "positive": 6.1227, "negative": 3.405, "neutral": 3.4654 }, "surges past": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "surpasses": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "surprise": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "surveillance": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "suspected": { "positive": 4.6714, "negative": 6.1746, "neutral": 4.7838 }, "suspended": { "positive": 4.5575, "negative": 6.1746, "neutral": 4.6698 }, "suspends": { "positive": 4.1448, "negative": 6.1746, "neutral": 4.2572 }, "suspends payments": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "suspends withdrawals": { "positive": 4.6714, "negative": 6.1746, "neutral": 4.7838 }, "sustainability": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "sustainable": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "suuku": { "positive": 6.1227, "negative": 4.8676, "neutral": 4.9281 }, "suuku tg": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "swap": { "positive": 4.8157, "negative": 4.5152, "neutral": 4.9281 }, "swap $sol": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "swe": { "positive": 5.3234, "negative": 5.3754, "neutral": 5.1249 }, "sweden": { "positive": 4.6714, "negative": 5.3754, "neutral": 4.9281 }, "swift": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "swings": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "switch": { "positive": 4.8157, "negative": 5.3754, "neutral": 4.7838 }, "system": { "positive": 3.853, "negative": 4.0684, "neutral": 4.6698 }, "system end": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "systems": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "tail": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "take": { "positive": 4.4632, "negative": 4.1967, "neutral": 4.092 }, "take off": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "taken": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "takeover": { "positive": 5.0125, "negative": 5.0644, "neutral": 5.1249 }, "takes": { "positive": 4.4632, "negative": 4.7233, "neutral": 4.5756 }, "takes aim": { "positive": 5.3234, "negative": 5.3754, "neutral": 5.1249 }, "takes bitcoin": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "takes place": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "taking": { "positive": 4.5575, "negative": 4.1505, "neutral": 4.1684 }, "taking sister": { "positive": 6.1227, "negative": 4.4349, "neutral": 4.4953 }, "talk": { "positive": 4.6714, "negative": 5.3754, "neutral": 4.9281 }, "talking": { "positive": 4.5575, "negative": 4.7233, "neutral": 4.9281 }, "talking negative": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "talks": { "positive": 5.0125, "negative": 5.3754, "neutral": 4.9281 }, "target": { "positive": 4.313, "negative": 4.1505, "neutral": 4.3077 }, "target together": { "positive": 6.1227, "negative": 4.8676, "neutral": 4.9281 }, "targeting": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "targets": { "positive": 4.5575, "negative": 5.3754, "neutral": 4.7838 }, "task": { "positive": 4.6714, "negative": 4.7233, "neutral": 6.2351 }, "tax": { "positive": 4.8157, "negative": 5.0644, "neutral": 4.9281 }, "tbh": { "positive": 6.1227, "negative": 4.8676, "neutral": 4.9281 }, "team": { "positive": 3.9796, "negative": 4.0684, "neutral": 4.9281 }, "team shared": { "positive": 4.0986, "negative": 4.1505, "neutral": 6.2351 }, "teams": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "tech": { "positive": 4.0165, "negative": 4.6094, "neutral": 4.1684 }, "tech stocks": { "positive": 4.1953, "negative": 6.1746, "neutral": 4.3077 }, "technical": { "positive": 4.8157, "negative": 4.7233, "neutral": 4.9281 }, "technology": { "positive": 4.5575, "negative": 4.5152, "neutral": 4.9281 }, "teen": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "telegram": { "positive": 4.6714, "negative": 4.8676, "neutral": 5.4358 }, "tell": { "positive": 3.9127, "negative": 4.4349, "neutral": 4.1289 }, "tell already": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "tell hn": { "positive": 4.313, "negative": 4.7233, "neutral": 4.7838 }, "telling": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "tells": { "positive": 5.3234, "negative": 5.0644, "neutral": 4.9281 }, "temporarily": { "positive": 4.313, "negative": 6.1746, "neutral": 4.4254 }, "temporarily suspended": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "temporarily suspends": { "positive": 4.6714, "negative": 6.1746, "neutral": 4.7838 }, "temporary": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "term": { "positive": 4.6714, "negative": 3.934, "neutral": 3.9379 }, "term holders": { "positive": 5.3234, "negative": 5.0644, "neutral": 4.9281 }, "terminal": { "positive": 4.313, "negative": 4.4349, "neutral": 5.4358 }, "terms": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "terms conditions": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "terra": { "positive": 4.1448, "negative": 4.8676, "neutral": 4.3077 }, "terra colleagues": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "terra stablecoin": { "positive": 4.8157, "negative": 5.3754, "neutral": 5.1249 }, "terrausd": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "terrible": { "positive": 4.6714, "negative": 6.1746, "neutral": 4.7838 }, "tesla": { "positive": 5.0125, "negative": 5.3754, "neutral": 4.9281 }, "tesla's": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "test": { "positive": 5.0125, "negative": 5.0644, "neutral": 5.1249 }, "tether": { "positive": 4.0986, "negative": 4.2472, "neutral": 4.211 }, "tether backs": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "tether breaks": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "tether says": { "positive": 5.3234, "negative": 5.0644, "neutral": 4.9281 }, "texas": { "positive": 5.0125, "negative": 4.8676, "neutral": 5.4358 }, "textbook": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "tf": { "positive": 5.0125, "negative": 4.8676, "neutral": 5.4358 }, "tg": { "positive": 6.1227, "negative": 4.6094, "neutral": 4.6698 }, "th": { "positive": 4.8157, "negative": 5.0644, "neutral": 5.4358 }, "than": { "positive": 3.7993, "negative": 3.7159, "neutral": 3.9944 }, "than ever": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "thank": { "positive": 4.6714, "negative": 5.0644, "neutral": 4.7838 }, "thank attention": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "thank later": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "thanks": { "positive": 5.0125, "negative": 5.3754, "neutral": 4.9281 }, "that's": { "positive": 4.4632, "negative": 5.3754, "neutral": 4.4953 }, "thats": { "positive": 5.0125, "negative": 5.0644, "neutral": 4.7838 }, "theft": { "positive": 4.4632, "negative": 6.1746, "neutral": 4.5756 }, "theory": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "there": { "positive": 4.056, "negative": 3.7363, "neutral": 3.7764 }, "there better": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "there clear": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "there no": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "there's": { "positive": 5.0125, "negative": 5.0644, "neutral": 5.1249 }, "they're": { "positive": 5.3234, "negative": 5.3754, "neutral": 5.1249 }, "thief": { "positive": 4.6714, "negative": 5.3754, "neutral": 4.9281 }, "thiel": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "thiel backed": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "thiel's": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "thin": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "thing": { "positive": 4.251, "negative": 4.1967, "neutral": 4.1289 }, "thing just": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "things": { "positive": 5.0125, "negative": 4.6094, "neutral": 4.6698 }, "think": { "positive": 3.7743, "negative": 3.6243, "neutral": 3.8867 }, "think bitcoin": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "thinking": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "thinks": { "positive": 4.8157, "negative": 5.3754, "neutral": 5.1249 }, "third": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "though": { "positive": 6.1227, "negative": 4.8676, "neutral": 4.9281 }, "thought": { "positive": 5.0125, "negative": 4.6094, "neutral": 4.6698 }, "thoughts": { "positive": 4.5575, "negative": 4.7233, "neutral": 4.9281 }, "thousands": { "positive": 5.3234, "negative": 5.0644, "neutral": 4.9281 }, "thread": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "threat": { "positive": 4.0986, "negative": 6.1746, "neutral": 4.211 }, "threat crypto": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "threatening": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "threats": { "positive": 4.5575, "negative": 6.1746, "neutral": 4.6698 }, "three": { "positive": 4.3829, "negative": 4.4349, "neutral": 4.3077 }, "throwing": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "tia": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "tickers": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "tied": { "positive": 4.6714, "negative": 5.0644, "neutral": 5.1249 }, "tight": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "till": { "positive": 5.3234, "negative": 4.8676, "neutral": 5.1249 }, "time": { "positive": 3.4384, "negative": 2.8122, "neutral": 2.8614 }, "time buy": { "positive": 6.1227, "negative": 3.6243, "neutral": 3.6847 }, "time crypto": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "time fly": { "positive": 6.1227, "negative": 4.7233, "neutral": 4.7838 }, "time get": { "positive": 4.6714, "negative": 5.0644, "neutral": 5.1249 }, "time high": { "positive": 6.1227, "negative": 3.3721, "neutral": 3.4326 }, "time highs": { "positive": 5.0125, "negative": 4.8676, "neutral": 5.4358 }, "time load": { "positive": 5.3234, "negative": 4.8676, "neutral": 5.1249 }, "time lows": { "positive": 5.3234, "negative": 5.3754, "neutral": 5.1249 }, "time move": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "time some": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "times": { "positive": 4.5575, "negative": 5.0644, "neutral": 4.6698 }, "times pump": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "tip": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "tired": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "today": { "positive": 3.076, "negative": 3.0403, "neutral": 4.0575 }, "today $btc": { "positive": 6.1227, "negative": 4.8676, "neutral": 4.9281 }, "today ama": { "positive": 3.9451, "negative": 3.997, "neutral": 6.2351 }, "today conference": { "positive": 4.1953, "negative": 4.2472, "neutral": 6.2351 }, "today developer": { "positive": 4.0165, "negative": 4.0684, "neutral": 6.2351 }, "today mainnet": { "positive": 3.9796, "negative": 4.0315, "neutral": 6.2351 }, "today team": { "positive": 4.0986, "negative": 4.1505, "neutral": 6.2351 }, "today's": { "positive": 4.8157, "negative": 4.7233, "neutral": 4.6698 }, "today's litepaper": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "together": { "positive": 5.3234, "negative": 4.8676, "neutral": 4.7838 }, "together get": { "positive": 6.1227, "negative": 4.8676, "neutral": 4.9281 }, "token": { "positive": 3.882, "negative": 3.9646, "neutral": 4.3634 }, "token launch": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "tokenization": { "positive": 5.0125, "negative": 4.8676, "neutral": 5.4358 }, "tokens": { "positive": 4.1953, "negative": 4.1079, "neutral": 3.9654 }, "tokens coins": { "positive": 6.1227, "negative": 4.7233, "neutral": 4.7838 }, "told": { "positive": 4.5575, "negative": 5.0644, "neutral": 4.9281 }, "told many": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "tom": { "positive": 5.0125, "negative": 5.3754, "neutral": 4.9281 }, "tom lee": { "positive": 5.0125, "negative": 5.3754, "neutral": 4.9281 }, "tomorrow": { "positive": 4.3829, "negative": 4.5152, "neutral": 4.9281 }, "ton": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "too": { "positive": 4.0986, "negative": 4.1079, "neutral": 4.1684 }, "too late": { "positive": 4.8157, "negative": 5.0644, "neutral": 4.6698 }, "took": { "positive": 4.5575, "negative": 4.6094, "neutral": 4.7838 }, "took profits": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "tool": { "positive": 4.3829, "negative": 4.3649, "neutral": 5.4358 }, "toolkit": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "top": { "positive": 3.9451, "negative": 3.905, "neutral": 3.9117 }, "top crypto": { "positive": 4.6714, "negative": 5.3754, "neutral": 4.9281 }, "top favorite": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "top staking": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "total": { "positive": 4.8157, "negative": 4.7233, "neutral": 4.4953 }, "touch": { "positive": 5.0125, "negative": 4.8676, "neutral": 5.4358 }, "tough": { "positive": 5.3234, "negative": 5.0644, "neutral": 4.9281 }, "toward": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "town": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "track": { "positive": 4.6714, "negative": 4.7233, "neutral": 5.1249 }, "tracker": { "positive": 4.8157, "negative": 4.8676, "neutral": 6.2351 }, "tracking": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "trade": { "positive": 5.0125, "negative": 4.3029, "neutral": 4.4953 }, "traded": { "positive": 4.8157, "negative": 5.3754, "neutral": 5.1249 }, "trader": { "positive": 5.0125, "negative": 5.0644, "neutral": 5.1249 }, "traders": { "positive": 4.251, "negative": 4.5152, "neutral": 4.4953 }, "trades": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "trading": { "positive": 2.8422, "negative": 2.9214, "neutral": 3.7968 }, "trading around": { "positive": 3.0242, "negative": 3.07, "neutral": 5.4358 }, "trading bot": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "trading platform": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "trading sideways": { "positive": 5.3234, "negative": 5.3754, "neutral": 5.1249 }, "traditional": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "transaction": { "positive": 4.8157, "negative": 4.6094, "neutral": 5.1249 }, "transactions": { "positive": 4.3829, "negative": 4.5152, "neutral": 4.6698 }, "transfers": { "positive": 4.4632, "negative": 4.8676, "neutral": 4.9281 }, "transparent": { "positive": 4.8157, "negative": 4.8676, "neutral": 6.2351 }, "trap": { "positive": 3.5557, "negative": 5.3754, "neutral": 3.652 }, "trash": { "positive": 3.853, "negative": 5.3754, "neutral": 3.9944 }, "travel": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "treasuries": { "positive": 5.0125, "negative": 5.0644, "neutral": 5.1249 }, "treasury": { "positive": 4.1953, "negative": 4.3029, "neutral": 4.2572 }, "trenches": { "positive": 6.1227, "negative": 4.8676, "neutral": 4.9281 }, "trend": { "positive": 3.7055, "negative": 5.0644, "neutral": 3.7764 }, "trend broken": { "positive": 3.7275, "negative": 6.1746, "neutral": 3.8399 }, "trending": { "positive": 4.056, "negative": 3.3938, "neutral": 3.5377 }, "trending $updog": { "positive": 4.8157, "negative": 4.1967, "neutral": 4.4254 }, "trending stocktwits": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "trending updog": { "positive": 4.5575, "negative": 3.8774, "neutral": 4.092 }, "tried": { "positive": 4.5575, "negative": 5.3754, "neutral": 4.5756 }, "tries": { "positive": 5.0125, "negative": 5.0644, "neutral": 5.1249 }, "trigger": { "positive": 5.0125, "negative": 5.3754, "neutral": 4.9281 }, "trigger next": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "triggered": { "positive": 5.3234, "negative": 5.3754, "neutral": 5.1249 }, "triggers": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "trillion": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "trip": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "tron": { "positive": 5.0125, "negative": 5.0644, "neutral": 4.7838 }, "true": { "positive": 4.5575, "negative": 4.3029, "neutral": 4.3077 }, "true long": { "positive": 6.1227, "negative": 4.6094, "neutral": 4.6698 }, "trump": { "positive": 3.8255, "negative": 3.997, "neutral": 3.9944 }, "trump administration": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "trump going": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "trump got": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "trump media": { "positive": 5.3234, "negative": 5.3754, "neutral": 5.1249 }, "trump pardons": { "positive": 4.5575, "negative": 5.0644, "neutral": 4.9281 }, "trump sons": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "trump's": { "positive": 4.6714, "negative": 4.7233, "neutral": 6.2351 }, "trust": { "positive": 5.0125, "negative": 4.7233, "neutral": 5.1249 }, "trusted": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "try": { "positive": 4.8157, "negative": 5.0644, "neutral": 4.9281 }, "trying": { "positive": 4.4632, "negative": 5.0644, "neutral": 4.7838 }, "tuesday": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "tumbles": { "positive": 4.6714, "negative": 6.1746, "neutral": 4.7838 }, "turd": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "turkey": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "turn": { "positive": 4.3829, "negative": 4.4349, "neutral": 4.5756 }, "turn any": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "turned": { "positive": 5.0125, "negative": 5.0644, "neutral": 5.1249 }, "turning": { "positive": 6.1227, "negative": 4.8676, "neutral": 4.9281 }, "tvl": { "positive": 5.3234, "negative": 4.8676, "neutral": 4.7838 }, "tweet": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "twitter": { "positive": 4.3829, "negative": 4.4349, "neutral": 4.7838 }, "two": { "positive": 4.1448, "negative": 4.6094, "neutral": 4.211 }, "two brothers": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "txs": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "type": { "positive": 4.8157, "negative": 5.0644, "neutral": 5.4358 }, "typical": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "ugly": { "positive": 3.7993, "negative": 6.1746, "neutral": 3.9117 }, "ui": { "positive": 4.4632, "negative": 4.7233, "neutral": 5.1249 }, "uk": { "positive": 4.1953, "negative": 5.0644, "neutral": 4.4254 }, "ukraine": { "positive": 5.3234, "negative": 5.3754, "neutral": 5.1249 }, "unable": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "unaware": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "unaware infamous": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "undeniable": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "undeniable here": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "under": { "positive": 3.9127, "negative": 3.997, "neutral": 4.092 }, "undervalued": { "positive": 5.0125, "negative": 3.7574, "neutral": 3.8179 }, "undervalued great": { "positive": 6.1227, "negative": 3.905, "neutral": 3.9654 }, "unfortunately": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "unicorn": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "uniswap": { "positive": 5.0125, "negative": 4.8676, "neutral": 5.4358 }, "unit": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "united": { "positive": 5.0125, "negative": 5.0644, "neutral": 5.1249 }, "units": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "unlike": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "unlimited": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "unrealized": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "unregistered": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "unregistered securities": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "unstoppable": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "until": { "positive": 4.5575, "negative": 4.6094, "neutral": 4.4254 }, "up": { "positive": 3.111, "negative": 2.7649, "neutral": 2.8651 }, "up $btc": { "positive": 5.3234, "negative": 4.7233, "neutral": 4.6698 }, "up $eth": { "positive": 6.1227, "negative": 4.8676, "neutral": 4.9281 }, "up $sol": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "up ada": { "positive": 5.3234, "negative": 4.6094, "neutral": 4.7838 }, "up altcoins": { "positive": 6.1227, "negative": 4.7233, "neutral": 4.7838 }, "up atom": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "up avax": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "up bitcoin": { "positive": 5.3234, "negative": 4.8676, "neutral": 5.1249 }, "up bnb": { "positive": 6.1227, "negative": 4.7233, "neutral": 4.7838 }, "up btc": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "up call": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "up cardano": { "positive": 6.1227, "negative": 4.8676, "neutral": 4.9281 }, "up crackdown": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "up crypto": { "positive": 5.3234, "negative": 5.3754, "neutral": 5.1249 }, "up doge": { "positive": 6.1227, "negative": 4.8676, "neutral": 4.9281 }, "up end": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "up eth": { "positive": 6.1227, "negative": 4.7233, "neutral": 4.7838 }, "up ethereum": { "positive": 6.1227, "negative": 4.8676, "neutral": 4.9281 }, "up good": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "up last": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "up link": { "positive": 6.1227, "negative": 4.8676, "neutral": 4.9281 }, "up market": { "positive": 5.3234, "negative": 4.8676, "neutral": 4.7838 }, "up now": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "up once": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "up only": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "up ripple": { "positive": 6.1227, "negative": 4.8676, "neutral": 4.9281 }, "up so": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "up sol": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "up solana": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "up some": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "up there": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "up today": { "positive": 5.0125, "negative": 4.8676, "neutral": 5.4358 }, "up xrp": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "upbit": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "upcoming": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "update": { "positive": 3.5239, "negative": 3.5759, "neutral": 4.7838 }, "update bitcoin": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "update posted": { "positive": 4.0165, "negative": 4.0684, "neutral": 6.2351 }, "updog": { "positive": 4.251, "negative": 3.405, "neutral": 3.5508 }, "updog $doge": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "updog always": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "updog great": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "updog let": { "positive": 4.8157, "negative": 4.5152, "neutral": 4.9281 }, "upgrade": { "positive": 5.3234, "negative": 3.8262, "neutral": 3.8628 }, "upgrade huge": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "upgrade went": { "positive": 6.1227, "negative": 4.0315, "neutral": 4.092 }, "upside": { "positive": 6.1227, "negative": 4.2472, "neutral": 4.3077 }, "upside clear": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "upside here": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "upside potential": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "ur": { "positive": 5.0125, "negative": 5.0644, "neutral": 5.1249 }, "usa": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "usage": { "positive": 4.8157, "negative": 4.7233, "neutral": 5.4358 }, "usb": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "usd": { "positive": 4.4632, "negative": 4.8676, "neutral": 4.4953 }, "usdc": { "positive": 4.6714, "negative": 5.0644, "neutral": 4.5756 }, "usdc stablecoin": { "positive": 5.3234, "negative": 5.3754, "neutral": 5.1249 }, "usdd": { "positive": 5.0125, "negative": 5.3754, "neutral": 4.9281 }, "usdt": { "positive": 4.8157, "negative": 5.3754, "neutral": 5.1249 }, "use": { "positive": 4.056, "negative": 4.3029, "neutral": 4.4254 }, "use case": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "used": { "positive": 4.0986, "negative": 4.2472, "neutral": 4.5756 }, "useless": { "positive": 4.313, "negative": 6.1746, "neutral": 4.4254 }, "user": { "positive": 4.4632, "negative": 4.8676, "neutral": 4.4953 }, "user funds": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "users": { "positive": 3.9127, "negative": 4.3649, "neutral": 4.1684 }, "uses": { "positive": 5.3234, "negative": 4.8676, "neutral": 5.1249 }, "using": { "positive": 3.7275, "negative": 3.905, "neutral": 4.1684 }, "using cryptocurrencies": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "using only": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "ust": { "positive": 4.6714, "negative": 4.7233, "neutral": 4.4254 }, "ust ustc": { "positive": 6.1227, "negative": 4.7233, "neutral": 4.7838 }, "ustc": { "positive": 6.1227, "negative": 4.7233, "neutral": 4.7838 }, "ustc high": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "usxdgnsl": { "positive": 6.1227, "negative": 4.8676, "neutral": 4.9281 }, "usxdgnsl rkiqmsc": { "positive": 6.1227, "negative": 4.8676, "neutral": 4.9281 }, "utility": { "positive": 4.8157, "negative": 4.3649, "neutral": 4.6698 }, "ux": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "validator": { "positive": 4.5575, "negative": 4.5152, "neutral": 5.4358 }, "validators": { "positive": 4.8157, "negative": 5.0644, "neutral": 4.9281 }, "valley": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "value": { "positive": 4.1953, "negative": 4.4349, "neutral": 4.4953 }, "vanishes": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "vault": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "vc": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "ve": { "positive": 4.6714, "negative": 4.4349, "neutral": 4.2572 }, "ve ever": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "ve seen": { "positive": 5.3234, "negative": 5.0644, "neutral": 4.9281 }, "verge": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "verify": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "version": { "positive": 5.0125, "negative": 5.0644, "neutral": 5.1249 }, "versus": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "very": { "positive": 4.8157, "negative": 4.1505, "neutral": 4.2572 }, "very nice": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "very soon": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "veteran": { "positive": 5.3234, "negative": 5.3754, "neutral": 5.1249 }, "vets": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "vets helped": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "via": { "positive": 4.313, "negative": 4.6094, "neutral": 4.9281 }, "victim": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "victims": { "positive": 4.6714, "negative": 6.1746, "neutral": 4.7838 }, "video": { "positive": 4.251, "negative": 4.1967, "neutral": 4.211 }, "vidz": { "positive": 5.3234, "negative": 4.8676, "neutral": 4.7838 }, "vietnam": { "positive": 4.8157, "negative": 4.6094, "neutral": 4.5756 }, "vietnamese": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "view": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "virginia": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "virtual": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "virus": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "visa": { "positive": 5.0125, "negative": 4.6094, "neutral": 4.9281 }, "vitalik": { "positive": 4.8157, "negative": 5.0644, "neutral": 5.4358 }, "volatility": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "volume": { "positive": 3.5239, "negative": 3.3118, "neutral": 3.1491 }, "volume $cro": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "volume dead": { "positive": 3.664, "negative": 6.1746, "neutral": 3.7764 }, "volume exploding": { "positive": 6.1227, "negative": 3.4773, "neutral": 3.5377 }, "volume heating": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "volume kicks": { "positive": 6.1227, "negative": 4.8676, "neutral": 4.9281 }, "volumes": { "positive": 5.0125, "negative": 5.3754, "neutral": 4.9281 }, "voting": { "positive": 4.6714, "negative": 5.0644, "neutral": 5.1249 }, "vs": { "positive": 4.6714, "negative": 4.8676, "neutral": 4.9281 }, "vsfvprv": { "positive": 5.0125, "negative": 4.8676, "neutral": 5.4358 }, "vsfvprv qzhyms": { "positive": 5.0125, "negative": 4.8676, "neutral": 5.4358 }, "wait": { "positive": 3.853, "negative": 3.7794, "neutral": 4.6698 }, "waiting": { "positive": 3.7993, "negative": 3.8262, "neutral": 4.4953 }, "waiting clear": { "positive": 3.9796, "negative": 4.0315, "neutral": 6.2351 }, "waiting happen": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "wake": { "positive": 4.3829, "negative": 4.3649, "neutral": 4.6698 }, "wake up": { "positive": 4.4632, "negative": 4.3649, "neutral": 4.7838 }, "waking": { "positive": 5.3234, "negative": 5.3754, "neutral": 5.1249 }, "waking up": { "positive": 5.3234, "negative": 5.3754, "neutral": 5.1249 }, "wall": { "positive": 4.8157, "negative": 4.7233, "neutral": 4.9281 }, "wall street": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "wall street's": { "positive": 5.3234, "negative": 5.3754, "neutral": 5.1249 }, "wallet": { "positive": 3.853, "negative": 3.905, "neutral": 4.1289 }, "wallets": { "positive": 4.313, "negative": 4.7233, "neutral": 4.5756 }, "want": { "positive": 4.6714, "negative": 4.3029, "neutral": 4.4953 }, "wants": { "positive": 4.251, "negative": 4.3649, "neutral": 4.9281 }, "wants orderly": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "warn": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "warned": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "warning": { "positive": 4.6714, "negative": 6.1746, "neutral": 4.7838 }, "warns": { "positive": 4.3829, "negative": 6.1746, "neutral": 4.4953 }, "warns bankruptcy": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "warns new": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "warren": { "positive": 4.8157, "negative": 5.0644, "neutral": 5.4358 }, "washington": { "positive": 4.6714, "negative": 4.7233, "neutral": 5.1249 }, "wasn't": { "positive": 5.0125, "negative": 5.0644, "neutral": 5.1249 }, "waste": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "waste money": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "watch": { "positive": 5.3234, "negative": 4.0315, "neutral": 4.1289 }, "watch alert": { "positive": 6.1227, "negative": 4.3649, "neutral": 4.4254 }, "watchdog": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "watched": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "watchers": { "positive": 5.3234, "negative": 4.8676, "neutral": 5.1249 }, "watching": { "positive": 3.882, "negative": 3.8023, "neutral": 4.6698 }, "watching key": { "positive": 3.9451, "negative": 3.997, "neutral": 6.2351 }, "wave": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "way": { "positive": 4.1448, "negative": 4.1505, "neutral": 4.2572 }, "way back": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "ways": { "positive": 4.8157, "negative": 5.0644, "neutral": 5.4358 }, "wayyy": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "wazirx": { "positive": 4.8157, "negative": 5.3754, "neutral": 5.1249 }, "we're": { "positive": 4.6714, "negative": 4.6094, "neutral": 4.6698 }, "we're going": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "weak": { "positive": 3.1642, "negative": 5.3754, "neutral": 3.2687 }, "weak hands": { "positive": 3.4654, "negative": 6.1746, "neutral": 3.5778 }, "wealth": { "positive": 4.6714, "negative": 4.7233, "neutral": 4.7838 }, "web": { "positive": 3.7993, "negative": 3.8023, "neutral": 4.211 }, "web js": { "positive": 4.8157, "negative": 5.0644, "neutral": 5.4358 }, "web security": { "positive": 5.3234, "negative": 5.3754, "neutral": 5.1249 }, "webrtc": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "website": { "positive": 4.3829, "negative": 5.0644, "neutral": 4.6698 }, "websites": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "wedge": { "positive": 5.3234, "negative": 4.8676, "neutral": 4.7838 }, "week": { "positive": 3.9451, "negative": 3.7159, "neutral": 3.7379 }, "week lets": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "weekend": { "positive": 4.6714, "negative": 4.3029, "neutral": 4.2572 }, "weekly": { "positive": 6.1227, "negative": 4.8676, "neutral": 4.9281 }, "weeks": { "positive": 4.313, "negative": 4.3649, "neutral": 4.7838 }, "weight": { "positive": 4.8157, "negative": 6.1746, "neutral": 4.9281 }, "weight loss": { "positive": 4.8157, "negative": 6.1746, "neutral": 4.9281 }, "weirdest": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "welcome": { "positive": 5.0125, "negative": 4.6094, "neutral": 4.6698 }, "welcome getting": { "positive": 5.3234, "negative": 4.8676, "neutral": 5.1249 }, "well": { "positive": 4.313, "negative": 4.1079, "neutral": 4.0251 }, "went": { "positive": 5.3234, "negative": 3.8774, "neutral": 3.9654 }, "went live": { "positive": 5.3234, "negative": 3.997, "neutral": 4.092 }, "whale": { "positive": 4.251, "negative": 4.6094, "neutral": 4.3077 }, "whale dumped": { "positive": 4.3829, "negative": 6.1746, "neutral": 4.4953 }, "whales": { "positive": 5.0125, "negative": 4.6094, "neutral": 4.4953 }, "whales accumulate": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "whales accumulating": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "what's": { "positive": 4.3829, "negative": 4.6094, "neutral": 4.7838 }, "what's happening": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "whatever": { "positive": 5.3234, "negative": 5.3754, "neutral": 5.1249 }, "whatsoever": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "where": { "positive": 4.1448, "negative": 4.4349, "neutral": 4.211 }, "white": { "positive": 4.6714, "negative": 4.8676, "neutral": 4.9281 }, "white paper": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "whitepaper": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "whole": { "positive": 5.0125, "negative": 5.0644, "neutral": 4.7838 }, "why": { "positive": 3.4002, "negative": 3.6243, "neutral": 3.5126 }, "why anyone": { "positive": 4.0165, "negative": 6.1746, "neutral": 4.1289 }, "why so": { "positive": 4.8157, "negative": 5.3754, "neutral": 5.1249 }, "why stablecoins": { "positive": 4.8157, "negative": 4.7233, "neutral": 5.4358 }, "wif": { "positive": 4.8157, "negative": 4.8676, "neutral": 6.2351 }, "wiki": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "wild": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "willing": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "win": { "positive": 5.3234, "negative": 4.1079, "neutral": 4.1289 }, "windows": { "positive": 5.0125, "negative": 5.0644, "neutral": 6.2351 }, "winner": { "positive": 6.1227, "negative": 4.3029, "neutral": 4.3634 }, "winning": { "positive": 5.3234, "negative": 5.3754, "neutral": 5.1249 }, "wins": { "positive": 5.3234, "negative": 5.0644, "neutral": 4.9281 }, "wins sec": { "positive": 5.3234, "negative": 5.3754, "neutral": 5.1249 }, "winter": { "positive": 5.0125, "negative": 5.0644, "neutral": 4.7838 }, "wipe": { "positive": 4.8157, "negative": 5.3754, "neutral": 4.7838 }, "wipe out": { "positive": 4.8157, "negative": 6.1746, "neutral": 4.9281 }, "wiped": { "positive": 3.9796, "negative": 5.0644, "neutral": 4.0251 }, "wiped out": { "positive": 3.9796, "negative": 5.0644, "neutral": 4.0251 }, "withdraw": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "withdrawal": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "withdrawals": { "positive": 3.8255, "negative": 5.3754, "neutral": 3.9654 }, "within": { "positive": 4.8157, "negative": 4.6094, "neutral": 4.7838 }, "without": { "positive": 4.4632, "negative": 4.4349, "neutral": 4.3634 }, "witness": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "wluna": { "positive": 6.1227, "negative": 4.7233, "neutral": 4.7838 }, "wluna luna": { "positive": 6.1227, "negative": 4.7233, "neutral": 4.7838 }, "woman": { "positive": 5.3234, "negative": 5.3754, "neutral": 5.1249 }, "won": { "positive": 5.3234, "negative": 4.8676, "neutral": 4.7838 }, "won't": { "positive": 4.4632, "negative": 5.3754, "neutral": 4.6698 }, "won't help": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "wonder": { "positive": 5.0125, "negative": 5.0644, "neutral": 4.7838 }, "wondering": { "positive": 5.3234, "negative": 5.3754, "neutral": 5.1249 }, "wont": { "positive": 5.3234, "negative": 5.3754, "neutral": 5.1249 }, "word": { "positive": 5.0125, "negative": 5.0644, "neutral": 5.1249 }, "work": { "positive": 4.0165, "negative": 4.2472, "neutral": 4.3077 }, "workforce": { "positive": 4.4632, "negative": 4.8676, "neutral": 4.9281 }, "working": { "positive": 4.4632, "negative": 4.6094, "neutral": 5.4358 }, "works": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "world": { "positive": 4.251, "negative": 4.3029, "neutral": 4.3077 }, "worlds": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "worried": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "worry": { "positive": 5.3234, "negative": 5.3754, "neutral": 5.1249 }, "worse": { "positive": 4.8157, "negative": 6.1746, "neutral": 4.9281 }, "worst": { "positive": 3.9796, "negative": 6.1746, "neutral": 4.092 }, "worth": { "positive": 4.1448, "negative": 4.3029, "neutral": 4.211 }, "worth back": { "positive": 5.3234, "negative": 5.3754, "neutral": 5.1249 }, "worth buy": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "worth holding": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "worthless": { "positive": 4.4632, "negative": 6.1746, "neutral": 4.5756 }, "wow": { "positive": 4.4632, "negative": 4.5152, "neutral": 4.4254 }, "wow shit": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "wrapped": { "positive": 5.3234, "negative": 5.3754, "neutral": 5.1249 }, "writing": { "positive": 4.8157, "negative": 5.3754, "neutral": 5.1249 }, "written": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "wrong": { "positive": 4.5575, "negative": 5.0644, "neutral": 4.6698 }, "wsj": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "wtf": { "positive": 4.6714, "negative": 6.1746, "neutral": 4.7838 }, "ww": { "positive": 5.3234, "negative": 5.3754, "neutral": 5.1249 }, "xc": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "xc da": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "xlm": { "positive": 4.8157, "negative": 4.7233, "neutral": 4.6698 }, "xrp": { "positive": 3.4654, "negative": 3.428, "neutral": 3.4326 }, "xrp all": { "positive": 4.8157, "negative": 6.1746, "neutral": 4.9281 }, "xrp breaking": { "positive": 6.1227, "negative": 4.8676, "neutral": 4.9281 }, "xrp chart": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "xrp fundamentals": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "xrp getting": { "positive": 4.6714, "negative": 6.1746, "neutral": 4.7838 }, "xrp here": { "positive": 5.3234, "negative": 4.7233, "neutral": 4.9281 }, "xrp looks": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "xrp momentum": { "positive": 6.1227, "negative": 4.8676, "neutral": 4.9281 }, "xrp news": { "positive": 4.6714, "negative": 4.7233, "neutral": 6.2351 }, "xrp smart": { "positive": 6.1227, "negative": 4.8676, "neutral": 4.9281 }, "xrp surges": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "xrp trading": { "positive": 4.5575, "negative": 4.6094, "neutral": 6.2351 }, "xrp volume": { "positive": 5.0125, "negative": 4.8676, "neutral": 4.6698 }, "ya": { "positive": 4.3829, "negative": 3.9646, "neutral": 3.9379 }, "ya ll": { "positive": 5.0125, "negative": 5.3754, "neutral": 5.4358 }, "ya trending": { "positive": 6.1227, "negative": 4.6094, "neutral": 4.6698 }, "ya updog": { "positive": 6.1227, "negative": 4.8676, "neutral": 4.9281 }, "yall": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "yawn": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "yc": { "positive": 5.0125, "negative": 4.8676, "neutral": 4.9281 }, "year": { "positive": 3.7055, "negative": 3.8023, "neutral": 3.7568 }, "year crypto": { "positive": 5.3234, "negative": 5.3754, "neutral": 5.1249 }, "year old": { "positive": 4.8157, "negative": 5.3754, "neutral": 5.1249 }, "yearly": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "years": { "positive": 3.9127, "negative": 3.8023, "neutral": 3.8399 }, "years ago": { "positive": 5.0125, "negative": 5.0644, "neutral": 5.1249 }, "years trenches": { "positive": 6.1227, "negative": 4.8676, "neutral": 4.9281 }, "yep": { "positive": 4.8157, "negative": 6.1746, "neutral": 4.9281 }, "yes": { "positive": 4.6714, "negative": 4.5152, "neutral": 4.7838 }, "yet": { "positive": 3.9127, "negative": 3.905, "neutral": 4.7838 }, "yield": { "positive": 5.0125, "negative": 4.6094, "neutral": 4.9281 }, "yl": { "positive": 6.1227, "negative": 4.8676, "neutral": 4.9281 }, "yl suuku": { "positive": 6.1227, "negative": 4.8676, "neutral": 4.9281 }, "you'll": { "positive": 5.3234, "negative": 5.0644, "neutral": 5.4358 }, "you're": { "positive": 4.6714, "negative": 5.0644, "neutral": 4.7838 }, "youtube": { "positive": 4.4632, "negative": 6.1746, "neutral": 4.5756 }, "youtube live": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "ys": { "positive": 6.1227, "negative": 4.8676, "neutral": 4.9281 }, "ys kdb": { "positive": 6.1227, "negative": 4.8676, "neutral": 4.9281 }, "yzv": { "positive": 6.1227, "negative": 4.8676, "neutral": 4.9281 }, "yzv skpqpump": { "positive": 6.1227, "negative": 4.8676, "neutral": 4.9281 }, "zcash": { "positive": 6.1227, "negative": 5.0644, "neutral": 5.1249 }, "zerdofr": { "positive": 6.1227, "negative": 4.8676, "neutral": 4.9281 }, "zerdofr ndt": { "positive": 6.1227, "negative": 4.8676, "neutral": 4.9281 }, "zero": { "positive": 3.6255, "negative": 3.8262, "neutral": 4.092 }, "zero knowledge": { "positive": 4.8157, "negative": 4.7233, "neutral": 5.4358 }, "zhao": { "positive": 4.1448, "negative": 4.8676, "neutral": 4.4254 }, "zhao plead": { "positive": 4.8157, "negative": 6.1746, "neutral": 4.9281 }, "zipmex": { "positive": 5.0125, "negative": 6.1746, "neutral": 5.1249 }, "zk": { "positive": 5.3234, "negative": 4.8676, "neutral": 5.1249 }, "zone": { "positive": 5.3234, "negative": 4.6094, "neutral": 4.7838 }, "zoom": { "positive": 5.3234, "negative": 5.3754, "neutral": 5.1249 } }, "oovLogLikelihood": { "positive": 0, "negative": 0, "neutral": 0 }, "vocabulary": ["$aabb", "$aave", "$aave buy", "$aave time", "$ada", "$ada $xrp", "$ada charles", "$ada going", "$ada huge", "$aero", "$aioz", "$akt", "$algo", "$algo $btc", "$algo $fil", "$algo $hbar", "$algo $xrp", "$algo just", "$algo nice", "$amp", "$apt", "$apt $btc", "$apt here", "$apt nice", "$apt target", "$arb", "$arb $op", "$arb last", "$atom", "$atom re", "$avax", "$avax just", "$avax trending", "$avt", "$bch", "$bch $spermwha", "$bch crypto", "$bch nice", "$bch thing", "$bch time", "$bmnr", "$bnb", "$bnb $btc", "$bnb $hbar", "$bnb $uni", "$bnb nice", "$bonk", "$btc", "$btc $bnb", "$btc $doge", "$btc $etc", "$btc $eth", "$btc $mstr", "$btc $qqq", "$btc $sol", "$btc $tia", "$btc $xrp", "$btc all", "$btc aptos", "$btc bitcoin", "$btc breaking", "$btc buy", "$btc chart", "$btc crashes", "$btc dead", "$btc dominance", "$btc fundamentals", "$btc getting", "$btc here", "$btc like", "$btc looks", "$btc momentum", "$btc news", "$btc next", "$btc still", "$btc support", "$btc trading", "$btc volume", "$btc weak", "$chip", "$cock", "$coin", "$comp", "$cro", "$cro $bnb", "$cro $rave", "$ctx", "$cxai", "$darth", "$dash", "$dog", "$dog $shib", "$doge", "$doge $shib", "$doge good", "$doge love", "$dot", "$dot trending", "$dot wow", "$dsit", "$ena", "$epic", "$etc", "$etc $btc", "$etc $eth", "$etc nice", "$eth", "$eth $ada", "$eth $bch", "$eth $btc", "$eth $dog", "$eth $doge", "$eth $etc", "$eth $hood", "$eth $sol", "$eth $tia", "$eth $uni", "$eth $xrp", "$eth all", "$eth buy", "$eth chart", "$eth crashes", "$eth getting", "$eth here", "$eth hits", "$eth looks", "$eth momentum", "$eth news", "$eth support", "$eth trading", "$eth volume", "$eth weak", "$fartcoin", "$fet", "$fet $render", "$fida", "$fil", "$fil nice", "$fil scooped", "$fil storage", "$fox", "$ftm", "$glnk", "$grass", "$grt", "$gwei", "$hbar", "$hbar $algo", "$hbar $avax", "$hnt", "$hnt $algo", "$hood", "$hood $xrp", "$hype", "$icp", "$inj", "$inj $nonja", "$inj goes", "$inj literally", "$inj memes", "$inj moves", "$inj nice", "$inj pumping", "$iren", "$jasmy", "$jup", "$jup strict", "$jyai", "$kaio", "$link", "$link $xrp", "$ltc", "$ltc new", "$ltc ready", "$lunc", "$lunc wluna", "$matic", "$maulcoin", "$mram", "$mstr", "$mu", "$muln", "$near", "$near one", "$near trending", "$nonja", "$nonja $inj", "$nonja moves", "$nonja one", "$nonja pumping", "$nonja starting", "$nvda", "$ondo", "$ondo $near", "$op", "$op $arb", "$op $hnt", "$op $sui", "$papl", "$paw", "$pengu", "$pepe", "$pepe $btc", "$pepe ayyy", "$pepe cd", "$pepe make", "$pol", "$pol $matic", "$prime", "$pump", "$pypl", "$qqq", "$qqq $spy", "$rari", "$rari ever", "$rari million", "$rari rari", "$rave", "$rave $bnb", "$rave $cro", "$render", "$render ayyy", "$render great", "$render nice", "$retire", "$rls", "$roam", "$rose", "$shib", "$shib $pepe", "$shib $uni", "$shib $wif", "$shib gm", "$shib long", "$sol", "$sol $bnb", "$sol $ftm", "$sol $link", "$sol $tia", "$sol $updog", "$sol $xrp", "$sol all", "$sol breaking", "$sol buy", "$sol chart", "$sol getting", "$sol here", "$sol it's", "$sol news", "$sol support", "$sol surges", "$sol trading", "$sol updog", "$spermwha", "$spermwha le", "$spy", "$spy $qqq", "$strk", "$sui", "$sui $sui", "$sui just", "$sui love", "$sui sui", "$sui time", "$sui trending", "$tao", "$tao $render", "$tel", "$tia", "$tia $atom", "$tia $op", "$tos", "$toshi", "$troll", "$trx", "$trx $usdt", "$tsla", "$uni", "$uni $btc", "$uni $pepe", "$updog", "$updog $aave", "$updog $avax", "$updog $bnb", "$updog $etc", "$updog $render", "$updog congrats", "$updog let", "$updog years", "$usdt", "$veil", "$wif", "$wif another", "$wif down", "$wif going", "$wif here", "$wif ing", "$wif nice", "$wif no", "$wif trending", "$wif yawn", "$wif yep", "$wld", "$wlfi", "$wyy", "$xdc", "$xlm", "$xlm $hbar", "$xlm $xrp", "$xlm here", "$xlm how", "$xlm well", "$xrp", "$xrp $ada", "$xrp $algo", "$xrp $btc", "$xrp $doge", "$xrp $fil", "$xrp $sol", "$xrp $xlm", "$xrp god", "$xtz", "$zbcn", "$zec", "$zec $atom", "$zk", "'bitcoin", "'cz'", "'ol", "'ol sh", "'s", "aave", "aax", "aax crypto", "aax suspends", "able", "abroad", "absolute", "absolutely", "abuse", "accelerate", "accelerates", "accept", "accept bitcoin", "accepts", "accepts bitcoin", "access", "accidentally", "account", "account hacked", "accounting", "accounts", "accumulate", "accumulated", "accumulating", "accumulating $btc", "accumulating $eth", "accumulating $sol", "accumulating altcoins", "accumulating avax", "accumulating bitcoin", "accumulating bnb", "accumulating btc", "accumulating cardano", "accumulating doge", "accumulating eth", "accumulating link", "accumulating market", "accumulating ripple", "accumulating sol", "accumulating solana", "accumulating xrp", "accumulation", "accumulation phase", "accurate", "accuses", "acquire", "acquires", "across", "act", "action", "active", "activity", "actor", "actual", "actually", "ad", "ada", "ada all", "ada breaking", "ada buy", "ada chart", "ada crashes", "ada fundamentals", "ada getting", "ada news", "ada smart", "ada support", "ada trading", "ada volume", "ada weak", "add", "added", "added some", "adding", "addresses", "adds", "administration", "admits", "admits stablecoin", "adopt", "adoption", "adoption hit", "adoption metrics", "ads", "advice", "advisor", "aergo", "af", "af cd", "affected", "afford", "afkcdbxdsaymexo", "afkcdbxdsaymexo vsfvprv", "africa", "african", "again", "age", "agent", "agentic", "agents", "aggregator", "ago", "agree", "agreed", "agrees", "ahead", "ai", "ai agent", "ai agentic", "ai agents", "ai data", "ai generated", "ai infrastructure", "ai powered", "ai stocks", "ai tool", "aih", "aih mn", "aim", "aims", "ain't", "air", "alert", "alert multiple", "alert top", "algo", "algorand", "algorithm", "algorithms", "alive", "all", "all afford", "all chart", "all crypto", "all day", "all digital", "all fundamentals", "all gains", "all gd", "all going", "all hype", "all ing", "all looks", "all money", "all need", "all other", "all over", "all roads", "all support", "all think", "all time", "all trend", "all volume", "all way", "all week", "allegations", "alleged", "alleged crypto", "allegedly", "allowed", "almost", "almost every", "alone", "alpha", "already", "already ing", "alright", "also", "alt", "alt coin", "alt coins", "alt season", "altcoin", "altcoin exchange", "altcoins", "altcoins all", "altcoins chart", "altcoins crashes", "altcoins getting", "altcoins here", "altcoins mine", "altcoins news", "altcoins surges", "altcoins trading", "altcoins volume", "altering", "altering data", "alternative", "although", "alts", "altseason", "always", "always great", "am", "am building", "ama", "ama scheduled", "amazing", "amazon", "america", "american", "americans", "amid", "amid crypto", "amount", "ams", "analysis", "analysts", "anarchist", "anatomy", "android", "angel", "announced", "announced crackdown", "announcement", "announces", "announces pipe", "anonymous", "another", "another day", "another dump", "any", "any better", "any other", "any update", "anymore", "anyone", "anyone still", "anyway", "aomst", "aomst pxyakyuvwwzt", "apecoin", "api", "apis", "app", "app store", "appears", "appetite", "apple", "approval", "approval landed", "approves", "apps", "april", "aptos", "ar", "arb", "arbitrage", "arbitrum", "architecture", "area", "argentina", "around", "around right", "arrest", "arrested", "arrested allegedly", "arrive", "arrogant", "art", "artificial", "artificial intelligence", "asia", "asic", "asics", "ask", "ask hn", "asked", "asks", "ass", "asset", "assets", "assets pdf", "assistant", "asteroid's", "ath", "atl", "atm", "atms", "atom", "attack", "attacker", "attackers", "attacks", "attention", "attention matter", "audit", "audit failed", "auditor", "authorities", "auto", "automated", "autonomous", "available", "avalanche", "avax", "avax all", "avax breaking", "avax chart", "avax crashes", "avax fundamentals", "avax getting", "avax here", "avax news", "avax smart", "avax support", "avax trading", "avax weak", "average", "avg", "away", "awesome", "awhile", "aws", "ayyy", "ayyy trending", "ba", "ba cbedd", "babies", "baby", "back", "back $updog", "back down", "back over", "back rich", "back soon", "back up", "back updog", "backdoored", "backed", "backed crypto", "backs", "bad", "bad debt", "bag", "bags", "ban", "ban all", "ban bitcoin", "ban crypto", "ban cryptocurrencies", "ban cryptocurrency", "ban penalising", "bandwidth", "bank", "banking", "bankman", "bankman fried", "bankrupt", "bankruptcy", "bankruptcy wipe", "banks", "banks working", "banned", "banning", "banning politics", "bans", "barely", "barely million", "barrier", "base", "based", "basically", "battle", "bc", "bch", "beanstalk", "bear", "bear cycle", "bear flag", "bear market", "bear trap", "bearing", "bearish", "bearish $btc", "bearish ada", "bearish altcoins", "bearish bnb", "bearish btc", "bearish crypto", "bearish sol", "bearish solana", "bearish xrp", "bears", "beat", "beats", "beautiful", "became", "because", "because going", "become", "becomes", "becomes first", "begin", "beginners", "begins", "behind", "behind earlier", "beijing", "believe", "benchmarks", "bend", "best", "best all", "best altcoins", "best community", "best crypto", "best cryptocurrency", "best month", "best performing", "bet", "bets", "better", "better know", "better right", "better start", "better than", "betterment", "beware", "beyond", "bid", "bidding", "big", "big bear", "big bitcoin", "big time", "bigger", "bigger than", "biggest", "biggest ponzi", "biggest stablecoin", "bill", "bill incoming", "billion", "billion dollar", "billions", "binance", "binance admits", "binance ceo", "binance chain", "binance cz", "binance founder", "binance halts", "binance says", "binance smart", "binance temporarily", "binance's", "bit", "bitcoin", "bitcoin all", "bitcoin altcoin", "bitcoin atm", "bitcoin best", "bitcoin bitcoin", "bitcoin blockchain", "bitcoin boom", "bitcoin breaking", "bitcoin btc", "bitcoin bubble", "bitcoin buy", "bitcoin cash", "bitcoin ceo", "bitcoin coming", "bitcoin crashes", "bitcoin crypto", "bitcoin depot", "bitcoin etf", "bitcoin ethereum", "bitcoin exchange", "bitcoin futures", "bitcoin halving", "bitcoin here", "bitcoin it's", "bitcoin mine", "bitcoin miners", "bitcoin mining", "bitcoin mixing", "bitcoin news", "bitcoin only", "bitcoin other", "bitcoin payments", "bitcoin price", "bitcoin rallies", "bitcoin smart", "bitcoin surges", "bitcoin trading", "bitcoin tumbles", "bitcoin using", "bitcoin volume", "bitcoin's", "bitcoins", "bitcoins stolen", "bitfinex", "bithumb", "bittrex", "black", "black rock", "blackrock", "blame", "bleed", "block", "block chain", "blockchain", "blockchain based", "blockchain bridge", "blockchain implementation", "blockchain technology", "blockchains", "blockchains stablecoins", "blocked", "blocks", "blog", "bloomberg", "blow", "blow global", "bnb", "bnb all", "bnb buy", "bnb crashes", "bnb fundamentals", "bnb here", "bnb news", "bnb support", "bnb trading", "bnb volume", "bnb weak", "board", "boat", "body", "bonanza", "books", "boom", "booming", "border", "border payments", "born", "boss", "bot", "both", "bottom", "bottom time", "bottoms", "bought", "bought all", "bought more", "bounce", "bounce back", "bounce taking", "bound", "bounty", "box", "boy", "brand", "brazil", "breach", "break", "break ath", "break even", "break out", "breaking", "breaking out", "breakout", "breaks", "breaks peg", "breakthrough", "bridge", "bridges", "bridging", "brief", "briefly", "bright", "bring", "bringing", "bro", "broader", "broke", "broken", "broker", "brothers", "brothers arrested", "browser", "browser extension", "btc", "btc breaking", "btc buy", "btc chart", "btc getting", "btc goes", "btc here", "btc lost", "btc news", "btc surges", "btc trading", "btc volume", "btc weak", "bubble", "bucks", "buddy", "bug", "build", "build crypto", "builder", "building", "building best", "building crypto", "buildout", "buildout near", "builds", "built", "built ai", "built crypto", "built ethereum", "bulk", "bull", "bull cycle", "bull market", "bull run", "bull trap", "bulletproof", "bullish", "bullish $btc", "bullish $eth", "bullish $sol", "bullish ada", "bullish altcoins", "bullish avax", "bullish bitcoin", "bullish bnb", "bullish btc", "bullish cardano", "bullish case", "bullish crypto", "bullish doge", "bullish eth", "bullish ethereum", "bullish here", "bullish link", "bullish market", "bullish ripple", "bullish sol", "bullish solana", "bullish xrp", "bulls", "bulls followers", "burnshot", "burnshot zero", "business", "butterfly", "butterfly labs", "buy", "buy $btc", "buy $nonja", "buy ai", "buy all", "buy back", "buy bitcoin", "buy buy", "buy dip", "buy gold", "buy hold", "buy memecoins", "buy more", "buy now", "buy nvidia", "buy other", "buy right", "buy sell", "buy signal", "buy tech", "buy wait", "buyers", "buying", "buying accelerates", "buying dip", "buying holding", "buying more", "buyout", "buyout news", "buys", "bybit", "bybit hack", "bybit says", "bytes", "ca", "ca hj", "ca xc", "california", "call", "called", "calls", "calls ban", "camera", "campaign", "can't", "canada", "canadian", "candle", "candles", "cant", "cap", "cap ath", "cap barely", "cap listed", "cap still", "capitulation", "capitulation continues", "car", "card", "cardano", "cardano all", "cardano chart", "cardano fundamentals", "cardano getting", "cardano here", "cardano momentum", "cardano news", "cardano smart", "cardano support", "cardano surges", "cardano trading", "cardano volume", "cardano weak", "cart", "case", "cases", "cash", "cashio", "cat", "cat bounce", "catalyst", "catalysts", "catalysts incoming", "catch", "cats", "cause", "caused", "cbedd", "cbedd cfcb", "cd", "cd cd", "cd ec", "celestia", "celestia $tia", "celsius", "cent", "center", "center outage", "central", "central bank", "central banks", "centre", "cents", "ceo", "ceo collapsed", "ceo says", "ceo zhao", "certain", "cfcb", "cftc", "chain", "chain attack", "chain bridge", "chain data", "chainlink", "chains", "challenge", "chance", "change", "change name", "changed", "changes", "changing", "changpeng", "changpeng zhao", "channel", "chaos", "charge", "charged", "charges", "charges crypto", "charles", "chart", "chart looks", "chart ugly", "chartered", "charts", "chasing", "chat", "chatgpt", "cheap", "cheaper", "cheaper than", "check", "check out", "checking", "chief", "child", "child abuse", "china", "china ban", "china binance", "china declares", "china steps", "china wants", "chinese", "chinese bitcoin", "chip", "chips", "choose", "christ", "ci", "circle", "citing", "city", "cla", "cla afkcdbxdsaymexo", "claim", "claiming", "claims", "clarity", "clarity act", "clarity bill", "class", "classic", "claude", "clear", "clear $rari", "clear direction", "clear move", "clear upside", "clear winner", "cli", "cli tool", "clickhouse", "client", "climate", "climb", "climbing", "clone", "close", "closed", "closer", "cloud", "cmon", "cmon bulls", "co", "co founder", "co founders", "coal", "code", "codebase", "codebases", "codex", "coding", "coin", "coin scam", "coin sell", "coinbase", "coinbase account", "coinbase ceo", "coinbase chief", "coinbase data", "coinbase mission", "coinbase says", "coinbase stock", "coinbase support", "coinbase warns", "coindcx", "coins", "coins compounded", "coins instead", "coins million", "coins no", "collapse", "collapsed", "collapsed crypto", "collapsing", "collateral", "collateral damage", "colleagues", "colleagues say", "collectibles", "college", "com", "come", "come join", "comeback", "comes", "comes another", "coming", "coming next", "coming soon", "comment", "commerce", "comming", "communities", "community", "companies", "company", "company butterfly", "compiler", "complete", "completed", "completely", "compound", "compound gains", "compounded", "compounded gains", "compromised", "compute", "computer", "computing", "concerns", "conditions", "conference", "conference happening", "confidence", "confident", "confirmed", "confirms", "confirms hack", "congrats", "congrats $dot", "congrats $wif", "congrats true", "congress", "connected", "consensus", "consider", "considered", "consolidating", "consolidating waiting", "consolidation", "conspiracy", "conspiracy launder", "consumption", "consumption index", "contagion", "container", "content", "context", "continue", "continues", "continuing", "contract", "contractor's", "contractor's son", "contracts", "control", "controlled", "controls", "conversations", "convicted", "convicted binance", "conviction", "cooked", "cool", "cools", "core", "corporate", "corporation", "correct", "cosmos", "cosmos sdk", "cost", "costs", "count", "country", "couple", "course", "course crypto", "court", "covid", "cpb", "cpu", "crackdown", "crap", "crash", "crashed", "crashes", "crashes hack", "crashes liquidity", "crashes major", "crashes regulators", "crashes sec", "crashes stablecoin", "crashes whale", "crashing", "crater", "crazy", "crazy potential", "create", "created", "creative", "creator", "credit", "criminal", "crisis", "critical", "cross", "cross border", "cross chain", "crossed", "crowd", "crypto", "crypto adoption", "crypto anarchist", "crypto assets", "crypto bear", "crypto breaking", "crypto bull", "crypto buy", "crypto challenge", "crypto chart", "crypto coin", "crypto collapse", "crypto com", "crypto crackdown", "crypto crash", "crypto currencies", "crypto currency", "crypto custody", "crypto exchange", "crypto exchanges", "crypto firm", "crypto firms", "crypto getting", "crypto hack", "crypto hacked", "crypto hacker", "crypto hackers", "crypto hacking", "crypto hacks", "crypto here", "crypto history", "crypto how", "crypto industry", "crypto investment", "crypto investors", "crypto lender", "crypto market", "crypto markets", "crypto mining", "crypto news", "crypto not", "crypto payments", "crypto prediction", "crypto price", "crypto prices", "crypto rally", "crypto regulation", "crypto regulations", "crypto scam", "crypto scams", "crypto selloff", "crypto stablecoins", "crypto startup", "crypto stolen", "crypto summer", "crypto support", "crypto surges", "crypto theft", "crypto token", "crypto tokens", "crypto trading", "crypto treasury", "crypto volume", "crypto wallet", "crypto wallets", "crypto winter", "crypto withdrawals", "crypto's", "cryptocurrencies", "cryptocurrencies $xrp", "cryptocurrency", "cryptocurrency ban", "cryptocurrency bubble", "cryptocurrency donations", "cryptocurrency exchange", "cryptocurrency giveaway", "cryptocurrency investment", "cryptocurrency market", "cryptocurrency mining", "cryptocurrency pump", "cryptocurrency scam", "cryptocurrency trading", "cryptocurrency transactions", "cryptographic", "cryptography", "cryptohack", "cryptokitties", "cryptotwits", "currencies", "currency", "currency exchange", "current", "currently", "curve", "custody", "custom", "customer", "customer funds", "customers", "customers'", "cut", "cuts", "cuts workforce", "cycle", "cz", "da", "da db", "dai", "daily", "damage", "dangerous", "dao", "dao hack", "dao raised", "daos", "dark", "dashboard", "data", "data breach", "data center", "data stolen", "database", "date", "day", "day another", "day nothing", "day trading", "days", "db", "db ed", "dca", "dea", "dead", "dead cat", "dead internet", "dead man's", "dead money", "deal", "dealing", "deals", "dear", "dear life", "dear sophie", "death", "debate", "debt", "debut", "decade", "decades", "decent", "decent exchanges", "decentralization", "decentralized", "decentralized exchange", "decentralized finance", "decision", "declares", "declares cryptocurrency", "deep", "default", "defense", "defi", "defi hack", "defi protocol", "defichain", "defies", "defined", "defines", "defining", "definitely", "degen", "delist", "delisted", "delisting", "deliver", "deliver malware", "delivering", "demand", "demo", "department", "dependencies", "depends", "depin", "deposits", "deposits withdrawals", "depot", "depot files", "derivatives", "design", "designed", "designer", "desperate", "despite", "destroy", "detect", "detecting", "detecting cryptocurrency", "detector", "deterministic", "dev", "developer", "developer update", "developers", "developers release", "development", "developments", "devs", "dex", "dfi", "dfi defichain", "didn", "die", "dies", "different", "different crypto", "difficult", "difficulty", "difficulty drops", "digital", "digital assets", "digital currency", "digital dogshit", "digital gold", "digital silver", "dilution", "dilution million", "dip", "dip $btc", "dip $eth", "dip $sol", "dip ada", "dip avax", "dip bitcoin", "dip btc", "dip cardano", "dip crypto", "dip doge", "dip ethereum", "dip link", "dip market", "dip ripple", "dip sol", "dip solana", "dip xrp", "direction", "direction yet", "disables", "disaster", "disaster waiting", "disclosure", "discount", "discussion", "distributed", "divergence", "divergence daily", "dm", "dm day", "dns", "documentation", "documents", "doesn", "doesn't", "dog", "dog shit", "doge", "doge all", "doge breaking", "doge buy", "doge chart", "doge crashes", "doge fundamentals", "doge getting", "doge here", "doge looks", "doge news", "doge smart", "doge surges", "doge trading", "doge volume", "dogecoin", "dogshit", "doing", "doj", "doj seizes", "dollar", "dollar hack", "dollars", "dominance", "don", "don fade", "don sleep", "don think", "don't", "don't know", "donald", "donations", "done", "dont", "door", "dosent", "dosent feel", "dot", "dotcom", "dots", "double", "doubled", "down", "down due", "down goes", "down since", "download", "dprk", "drain", "drained", "drained funds", "drains", "dream", "dried", "dried up", "driven", "drone", "drop", "dropped", "dropped sharply", "dropping", "drops", "drug", "drugs", "duck", "due", "dumb", "dump", "dump shit", "dumped", "dumped millions", "dumping", "dumping $sol", "dumping ada", "dumping bnb", "dumping btc", "dumping buy", "dumping crypto", "dumping doge", "dumping ing", "dumping market", "dumping sol", "dumps", "dust", "dying", "each", "earlier", "earlier failed", "early", "earn", "earnings", "earnings call", "ease", "easily", "easy", "easy money", "ebola", "ec", "ec af", "eco", "economics", "economist", "economy", "ecosystem", "ed", "ed ba", "educational", "eff", "efficient", "eiejem", "eiejem rggtracxfrge", "either", "el", "el salvador", "electricity", "em", "emails", "emissions", "employees", "encouraging", "encrypted", "encryption", "end", "end encrypted", "end end", "ending", "ends", "energy", "engine", "engineer", "engineer pleads", "enjoy", "enough", "enough hold", "enterprise", "entire", "entire defi", "entry", "entry point", "environment", "environmental", "era", "established", "estimates", "etc", "etf", "etf approval", "etf inflows", "etfs", "eth", "eth all", "eth breaking", "eth crashes", "eth fees", "eth fundamentals", "eth getting", "eth here", "eth news", "eth smart", "eth surges", "eth trading", "eth weak", "ether", "ethereum", "ethereum all", "ethereum based", "ethereum blockchain", "ethereum breaking", "ethereum chart", "ethereum classic", "ethereum crashes", "ethereum dao", "ethereum devs", "ethereum etf", "ethereum fundamentals", "ethereum getting", "ethereum just", "ethereum network", "ethereum news", "ethereum protocol", "ethereum support", "ethereum surges", "ethereum trading", "ethereum's", "eu", "eu ban", "euro", "europe", "evade", "even", "even close", "even more", "event", "ever", "ever created", "ever seen", "ever there", "every", "every coin", "every day", "every dip", "every other", "every time", "every week", "everybody", "everyone", "everyone dumping", "everything", "everywhere", "evidence", "evil", "ex", "ex terra", "exactly", "exch", "exchange", "exchange aax", "exchange announces", "exchange backed", "exchange binance", "exchange bittrex", "exchange bybit", "exchange coinbase", "exchange coindcx", "exchange collapse", "exchange founder", "exchange ftx", "exchange got", "exchange hacked", "exchange listings", "exchange suspends", "exchange wazirx", "exchanges", "exchanges fake", "exchanges volume", "exciting", "exec", "execs", "executives", "executives arrested", "exit", "exit scam", "expect", "expected", "expected range", "expecting", "expects", "experience", "experiment", "experts", "explained", "explode", "exploding", "exploit", "exploited", "exploiting", "exploits", "export", "exposes", "extension", "eye", "eyes", "face", "facebook", "faces", "faces sec", "facts", "fade", "fades", "fail", "failed", "failed crypto", "failed stablecoin", "failing", "fails", "failure", "fair", "fake", "fake tesla", "fall", "falling", "falling wedge", "falls", "fam", "families", "fan", "far", "farm", "fashion", "fast", "fast low", "faster", "faster than", "favorite", "favorite staking", "favorites", "fbi", "fbnsx", "fbnsx eiejem", "fear", "feature", "features", "fed", "federal", "feds", "feds seized", "fee", "feedback", "feeds", "feel", "feel good", "feel like", "feeling", "feels", "feels good", "fees", "fees dropped", "few", "few months", "fiat", "fidelity", "figures", "fil", "file", "file coin", "filecoin", "filed", "filed lawsuit", "files", "files bankruptcy", "filing", "filings", "filling", "filter", "final", "finally", "finance", "finance app", "finance bitcoin", "finances", "financial", "financial advice", "financial crisis", "financial system", "find", "finds", "fine", "fintech", "fire", "firm", "firm soar", "firms", "first", "first crypto", "first day", "first ever", "first quarter", "first time", "fish", "five", "fix", "flag", "flat", "flat never", "floods", "floor", "florida", "fly", "fly price", "focus", "focused", "focused company", "follow", "followed", "followers", "followers friends", "following", "follows", "fomo", "forbes", "force", "forced", "forever", "forget", "forgotten", "fork", "format", "former", "forming", "forms", "found", "foundation", "foundation announces", "founder", "founder changpeng", "founder hobnobs", "founder's", "founders", "four", "fourth", "fraction", "fraction ing", "framework", "fraud", "fraudulent", "free", "free service", "freezes", "friday", "fried", "fried going", "friends", "front", "frozen", "ftc", "ftx", "ftx collapse", "ftx crypto", "ftx files", "fuck", "fucked", "fucking", "fud", "fueled", "full", "fully", "fun", "fund", "fundamentals", "fundamentals strong", "fundamentals weak", "funded", "funding", "funds", "funds lying", "fungible", "further", "further dilution", "future", "future blockchain", "future finance", "futures", "futures ethereum", "gain", "gains", "gains clarity", "gambling", "game", "games", "gaming", "gap", "garbage", "garbage never", "garbage piece", "gas", "gas fees", "gave", "gd", "gd dm", "gem", "gemini", "gen", "generated", "generations", "genesis", "gensyn", "gensyn artificial", "get", "get back", "get hacked", "get power", "get ready", "get richer", "get started", "gets", "getting", "getting closer", "getting rekt", "getting trending", "giant", "giants", "gig", "git", "github", "github repo", "give", "giveaway", "gives", "giving", "giving out", "glad", "global", "global bitcoin", "global payment", "glta", "gm", "go", "go $updog", "go time", "go up", "goal", "god", "god great", "gods", "goes", "goes back", "goes down", "goes ing", "goes parabolic", "goes up", "going", "going back", "going down", "going moon", "going prison", "going up", "going zero", "gold", "gold instead", "goldman", "gone", "gone $cro", "gonna", "good", "good day", "good luck", "good man", "good morning", "good news", "good riddance", "good spot", "good time", "google", "google cloud", "got", "got hacked", "gotta", "gotta love", "gov", "gov't", "government", "gox", "gox crypto", "gpu", "grabbed", "graph", "graphics", "grayscale", "great", "great again", "great crypto", "great news", "great see", "great seeing", "great such", "great time", "great utility", "great week", "great weekend", "greatest", "green", "green candle", "green green", "grok", "group", "growing", "growing $updog", "grows", "growth", "guaranteed", "guess", "guide", "guilty", "guilty hacking", "guilty money", "gunna", "guns", "guy", "guys", "hack", "hack drained", "hacked", "hacked bitcoin", "hacked crypto", "hacker", "hacker behind", "hacker news", "hackers", "hackers behind", "hackers drain", "hackers steal", "hackers use", "hackers using", "hacking", "hacking crypto", "hacks", "half", "halt", "halted", "halts", "halts all", "halts withdrawals", "halving", "hand", "handle", "hands", "hands shaken", "happen", "happened", "happening", "happy", "hard", "harder", "hardware", "hashes", "hashrate", "hasn", "hate", "haters", "haven", "hayes", "head", "headed", "healthy", "heap", "heating", "heating up", "heavy", "heavy losses", "hedge", "hedge fund", "heist", "held", "held perfectly", "hell", "help", "helped", "helped crypto", "helping", "helps", "here", "here chart", "here comes", "here don", "here even", "here fundamentals", "here gain", "here great", "here just", "here lol", "here market", "here momentum", "here see", "here smart", "here so", "here support", "here undeniable", "here volume", "here's", "hey", "hgp", "hidden", "hide", "hiding", "high", "high adoption", "high etf", "high fees", "high institutional", "high major", "high network", "high spot", "high watch", "higher", "higher $updog", "highly", "highs", "historically", "history", "hit", "hit new", "hit record", "hits", "hitting", "hj", "hj rrz", "hn", "hn ai", "hn am", "hn anyone", "hn bitcoin", "hn built", "hn burnshot", "hn create", "hn crypto", "hn decentralized", "hn how", "hn made", "hn new", "hn open", "hn what's", "hn why", "hobnobs", "hobnobs trump", "hodlers", "hodlnaut", "hold", "holder", "holders", "holding", "holding $btc", "holding $sol", "holding ada", "holding bitcoin", "holding bnb", "holding dear", "holding eth", "holding ethereum", "holding long", "holding market", "holding solana", "holding strong", "holding up", "holding xrp", "holds", "holy", "home", "homepage", "honestly", "hong", "hong kong", "hood", "hope", "hopeful", "hopefully", "hopes", "hophn", "hophn fbnsx", "hoping", "hopium", "horizon", "horrible", "hoskinson", "hosted", "hosting", "hot", "hours", "house", "how", "how bitcoin", "how build", "how create", "how crypto", "how get", "how long", "how make", "how trump's", "hub", "huge", "huge news", "huge win", "human", "humans", "hunt", "hunting", "hurry", "hurry up", "hype", "hyperliquid", "i'm", "i've", "ian", "ico", "icp", "id", "idea", "idiot", "ignore", "illegal", "illegal crypto", "illicit", "im", "image", "images", "imagine", "imagine buying", "imf", "imminent", "immutability", "imo", "impact", "implementation", "important", "impressive", "incoming", "incoming stated", "increasingly", "index", "indexer", "india", "india propose", "indian", "indian crypto", "indicator", "indicted", "industry", "industry isn't", "infamous", "infamous hacker", "infinite", "inflation", "inflows", "inflows hit", "information", "information stolen", "infra", "infrastructure", "ing", "ing cent", "ing dumping", "ing figures", "ing garbage", "ing penny", "ing trash", "inj", "injective", "input", "insane", "inside", "insider", "insider trading", "insolvent", "install", "instant", "instead", "instead $btc", "instead $eth", "instead ada", "instead altcoins", "instead avax", "instead bnb", "instead btc", "instead cardano", "instead eth", "instead link", "instead market", "instead ripple", "instead sol", "instead solana", "institutional", "institutional adoption", "institutional buying", "institutions", "intel", "intel vets", "intelligence", "intelligence token", "interest", "interested", "interesting", "internet", "internet shutdown", "interview", "intro", "invest", "investigation", "investigators", "investment", "investment launch", "investment scam", "investor", "investors", "investors wiped", "io", "ios", "iota", "iphone", "ipo", "iran", "iran's", "iran's crypto", "iranian", "iranian crypto", "irs", "isn", "isn't", "isn't any", "issue", "issuer", "issues", "issues warning", "issuing", "it's", "itself", "jack", "jackct", "jail", "jailed", "jam", "jan", "january", "japan", "javascript", "jk", "job", "join", "joke", "jonathan", "jonathan morgan", "jp", "jp morgan", "jpmorgan", "js", "js library", "judge", "jump", "jumps", "june", "junk", "just", "just another", "just bought", "just buy", "just failed", "just got", "just great", "just hoping", "just keep", "just like", "just need", "just needs", "just one", "just pump", "just went", "justice", "justin", "justin sun", "kalshi", "kazakhstan", "kazakhstan internet", "kdb", "kdb usxdgnsl", "keep", "keep accumulating", "keep buying", "keep eye", "keeping", "keeps", "kentucky", "key", "key levels", "key support", "keys", "kicking", "kicks", "kicks gone", "kickstarter", "kids", "kill", "killer", "kimi", "kinda", "king", "know", "know worth", "knowing", "knowledge", "knowledge proofs", "known", "kodak", "kodakcoin", "kong", "kong crypto", "korea", "korea's", "korea's crypto", "korean", "korean crypto", "korean hackers", "kraken", "kwon", "kwon behind", "kyc", "lab", "labs", "lady", "lago", "lake", "lambo", "landed", "language", "laptop", "large", "large codebases", "larger", "largest", "largest bitcoin", "largest crypto", "largest defi", "last", "last buy", "last month", "last time", "last week", "last year", "late", "lately", "later", "latest", "latest crypto", "launch", "launch sovereignai", "launched", "launches", "launching", "launder", "launder stolen", "laundered", "laundering", "laureate", "law", "lawsuit", "lawsuit dao", "lawsuit over", "layer", "layoffs", "lays", "lays off", "le", "lead", "leads", "learn", "learned", "learning", "least", "leave", "leaves", "leaving", "ledger", "lee", "left", "left behind", "leftist", "leftists", "leg", "leg up", "legal", "legit", "lender", "lender genesis", "lending", "less", "less than", "lesson", "lessons", "lessons learned", "let", "let get", "let go", "lets", "lets go", "level", "levels", "leverage", "lfg", "libraries", "library", "library backdoored", "licence", "lies", "life", "life savings", "lifts", "light", "lightweight", "like", "like $nonja", "like bull", "like buying", "like most", "like need", "like nice", "like rave", "like said", "likely", "line", "link", "link all", "link breaking", "link buy", "link chart", "link crashes", "link fundamentals", "link here", "link momentum", "link news", "link smart", "link support", "link surges", "link trading", "link weak", "linked", "links", "linux", "liquid", "liquidated", "liquidation", "liquidations", "liquidity", "liquidity dried", "list", "listed", "listed some", "listen", "listings", "litepaper", "literally", "little", "live", "live crypto", "lives", "ll", "ll back", "ll just", "llm", "llms", "lmao", "lmfao", "load", "load up", "loaded", "loaded up", "loading", "loading up", "local", "local ai", "local first", "locally", "lock", "locked", "login", "logs", "lol", "long", "long $btc", "long $eth", "long ada", "long avax", "long bitcoin", "long bnb", "long bulls", "long cardano", "long crypto", "long doge", "long eth", "long link", "long market", "long ripple", "long sol", "long solana", "long strong", "long term", "long time", "long xrp", "longer", "longs", "look", "looking", "looking good", "looks", "looks bullish", "looks good", "looks like", "loophole", "lose", "loser", "losers", "loses", "loses exploit", "losing", "loss", "loss drugs", "losses", "lost", "lot", "love", "love back", "love sui", "low", "lower", "lows", "ltc", "luck", "lummis", "luna", "luna ust", "lying", "lying regulators", "mac", "machine", "macos", "macro", "macroeconomic", "made", "main", "mainnet", "mainnet stats", "major", "major crypto", "major exchange", "major partnership", "make", "make bitcoin", "make money", "maker", "makers", "makes", "makes sense", "making", "malicious", "malware", "man", "man $eth", "man's", "man's switch", "manager", "managing", "mandates", "mango", "manipulation", "many", "many bitcoins", "many people", "many times", "map", "mar", "mar lago", "march", "margin", "markdown", "market", "market breaking", "market buy", "market cap", "market collapse", "market conditions", "market crashes", "market fundamentals", "market getting", "market here", "market hits", "market makers", "market manipulation", "market news", "market sentiment", "market share", "market smart", "market still", "market structure", "market surges", "market trading", "market weak", "marketcap", "marketing", "marketplace", "markets", "mass", "massive", "massively", "mastercard", "math", "matic", "matic $lunc", "matter", "maybe", "mc", "mcafee", "mcap", "mcp", "md", "mean", "means", "media", "meets", "melt", "melt faces", "meme", "meme coins", "memecoin", "memecoins", "memecoins instead", "memes", "memes like", "men", "menu", "merge", "messages", "metrics", "michael", "michael saylor", "microsoft", "million", "million coins", "million dollars", "million market", "million some", "millionaires", "millions", "millions dollars", "mind", "mine", "mine bitcoin", "miner", "miners", "miners traders", "mines", "minimum", "mining", "mining bitcoin", "mining boom", "mining centre", "mining companies", "mining energy", "mining firm", "mining hub", "mining operation", "mining pools", "mining power", "minnesota", "mint", "minute", "minutes", "mishandling", "mishandling funds", "misleading", "miss", "miss out", "missing", "mission", "mission focused", "mistake", "mit", "mix", "mixing", "mln", "mms", "mn", "mn hophn", "mobile", "mode", "model", "models", "modular", "moment", "momentum", "momentum building", "monero", "money", "money accumulating", "money crypto", "money gone", "money laundering", "money printing", "moneygram", "monitor", "month", "month years", "months", "moon", "moon shot", "moratorium", "more", "more bullish", "more here", "more longs", "more money", "more people", "more than", "morgan", "morgan stanley", "morning", "most", "most bullish", "most crypto", "most likely", "mostly", "mounting", "move", "moved", "movement", "movement whatsoever", "moves", "moves $nonja", "movie", "moving", "moving up", "mt", "mt gox", "much", "much $nonja", "much more", "multi", "multimillion", "multimillion dollar", "multiple", "multiple catalysts", "nails", "name", "nancy", "narrative", "narratives", "nasa", "national", "native", "nd", "ndt", "ndt yzv", "near", "near foundation", "near powered", "nearly", "nearly billion", "nears", "necessary", "need", "needed", "needs", "needs some", "negative", "nervous", "net", "net profit", "netherlands", "netherlands ban", "network", "network upgrade", "networks", "neural", "never", "never ends", "new", "new all", "new ath", "new crypto", "new era", "new highs", "new lows", "news", "news today", "next", "next bch", "next bull", "next few", "next financial", "next gen", "next leg", "next level", "next only", "next step", "next stop", "next week", "next year", "nft", "nft sales", "nfts", "nice", "nice bounce", "nice run", "nice see", "nicehash", "night", "nightmare", "nix", "no", "no clear", "no crypto", "no further", "no login", "no longer", "no more", "no movement", "no one", "no use", "nobel", "nobel laureate", "nobody", "node", "nodes", "noise", "nomina", "non", "nonja", "nonsense", "nope", "north", "north american", "north korea", "north korea's", "north korean", "not", "not accept", "not all", "not bullish", "not even", "not financial", "not long", "not making", "not next", "not public", "not scam", "not short", "not too", "not used", "nothing", "nothing ing", "notice", "notification", "notifications", "now", "now accepts", "now back", "now like", "now lol", "now taking", "now time", "npm", "nuclear", "number", "numbers", "nvidia", "nvidia instead", "observations", "obvious", "oceanpal", "oceanpal partnership", "october", "off", "off apecoin", "offers", "office", "officer", "official", "officially", "officials", "offline", "often", "oh", "oil", "okay", "old", "once", "onchain", "one", "one best", "one ing", "one largest", "one memes", "one thing", "one time", "online", "only", "only million", "only thank", "only way", "open", "open source", "openai", "opens", "operating", "operation", "operations", "operator", "opportunity", "optimism", "optimistic", "option", "options", "order", "orderly", "orderly exit", "orders", "original", "oss", "other", "other coins", "other cryptocurrencies", "other cryptocurrency", "others", "out", "out chart", "out crypto", "out fundamentals", "out get", "out momentum", "out now", "out smart", "out support", "out there", "out user", "out volume", "outage", "outflows", "outlook", "outperform", "over", "over alleged", "over binance", "over bitcoin", "over crypto", "over here", "over past", "over people", "over re", "over usd", "overnight", "overseas", "oversold", "own", "owns", "pace", "packed", "paid", "pain", "palantir", "pamp", "panic", "panicking", "paper", "parabolic", "pardon", "pardons", "pardons convicted", "part", "partner", "partners", "partnership", "partnership announced", "partnership near", "partnerships", "party", "pass", "passes", "passes stablecoin", "passing", "password", "past", "patch", "patent", "path", "patience", "pattern", "patterns", "pause", "pauses", "paving", "paxos", "pay", "paying", "payment", "payments", "paypal", "pc", "pdf", "peace", "peak", "pedo", "peg", "penalising", "penalising miners", "penny", "penny ing", "people", "people get", "people know", "people make", "pepe", "per", "per month", "percent", "perfect", "perfect time", "perfectly", "performance", "performing", "period", "person", "personal", "personal finance", "personal information", "perspective", "peter", "peter thiel", "peter thiel's", "phantom", "phantom wallet", "phase", "phishing", "phone", "photos", "php", "pi", "pick", "picking", "picks", "piece", "piece sh", "piece shit", "pile", "pile shit", "pipe", "pipe investment", "place", "plan", "plans", "plate", "platform", "platform mango", "platforms", "play", "plays", "plea", "plead", "plead guilty", "pleads", "pleads guilty", "please", "plummet", "plummeting", "plummets", "plunges", "point", "points", "police", "police arrest", "policy", "polish", "political", "political donations", "politics", "polkadot", "polygon", "ponzi", "ponzi scheme", "ponzi schemes", "pool", "pools", "poor", "pop", "portfolio", "pos", "position", "position here", "positioned", "positions", "possibility", "possible", "possible futures", "post", "post quantum", "post so", "posted", "postgresql", "posting", "posts", "potential", "potential here", "pow", "power", "power cryptocurrencies", "powered", "powered ai", "powerful", "pre", "prediction", "prediction market", "prediction markets", "prepares", "president", "pressure", "presumed", "pretty", "prevent", "previous", "previously", "previously post", "price", "price action", "price inflation", "price prediction", "price surge", "price target", "prices", "printing", "prior", "prison", "prison crypto", "prison time", "privacy", "privacy coins", "private", "probably", "probe", "probes", "problem", "processing", "product", "production", "profit", "profit taking", "profitable", "profits", "progress", "project", "project real", "projects", "promoting", "prompt", "proof", "proof work", "proofs", "proposal", "propose", "propose cryptocurrency", "proposes", "protect", "protected", "protocol", "protocol drained", "protocol part", "protocols", "prove", "provider", "provides", "pt", "public", "published", "pull", "pump", "pump dump", "pumping", "pumping $nonja", "pumping soon", "purchases", "pure", "push", "pushing", "put", "putin", "puts", "putting", "pxyakyuvwwzt", "pxyakyuvwwzt zerdofr", "python", "quadrigacx", "quant", "quantum", "quantum computing", "quantum resistant", "quantum safe", "quarter", "quarterly", "question", "quick", "quiet", "quietly", "quit", "quite", "qzhyms", "qzhyms hgp", "race", "rag", "raid", "raided", "raise", "raised", "raises", "rallies", "rally", "ran", "random", "range", "rank", "ranks", "ranks top", "ransom", "ransomware", "rapid", "rare", "rari", "rate", "ratio", "rave", "rave april", "re", "re gonna", "re still", "re welcome", "reach", "reaches", "react", "read", "reading", "ready", "ready send", "ready true", "real", "real action", "real adoption", "real infra", "real time", "real world", "realize", "realized", "really", "really well", "reason", "reasons", "rebound", "recent", "recently", "reclaim", "recommend", "record", "record high", "recover", "recovery", "red", "red candles", "red flat", "reddit", "refresh", "regret", "regulate", "regulation", "regulations", "regulator", "regulators", "regulators announced", "reimburse", "rekt", "rekt chart", "rekt fundamentals", "rekt looks", "rekt support", "rekt trend", "rekt volume", "related", "relative", "release", "released", "releases", "remain", "remains", "remember", "remittance", "remote", "removal", "render", "renewable", "renewable energy", "repeated", "replace", "replacing", "repo", "report", "reported", "reports", "reports record", "reputation", "requests", "rescue", "research", "reserve", "reserves", "resist", "resist retire", "resistance", "resistant", "resists", "resolution", "response", "response apple", "result", "resulting", "retail", "retail investors", "retard", "retarded", "retire", "retirement", "return", "returns", "reuters", "revenue", "revenue jumps", "reversal", "review", "revive", "revives", "revolt", "reward", "rggtracxfrge", "rh", "rich", "rich get", "richer", "riddance", "right", "right here", "right now", "rip", "ripple", "ripple all", "ripple breaking", "ripple buy", "ripple chart", "ripple crashes", "ripple getting", "ripple here", "ripple momentum", "ripple news", "ripple support", "ripple surges", "ripple trading", "ripple weak", "rise", "rising", "risk", "risks", "rkiqmsc", "rkiqmsc yl", "rn", "road", "roadmap", "roads", "roads lead", "robinhood", "rock", "rocket", "role", "round", "royal", "rrz", "rrz ys", "rsi", "rug", "rug pull", "rugpull", "rule", "rules", "rumours", "run", "run $updog", "run also", "run now", "run started", "run up", "runner", "runners", "running", "runs", "runtime", "runway", "russia", "russian", "rust", "rwa", "sad", "safe", "safe crypto", "safety", "said", "said buy", "sale", "sales", "salvador", "salvage", "salvage lose", "sam", "sam bankman", "same", "same 'ol", "sanctions", "save", "saves", "saving", "savings", "saw", "say", "saying", "saylor", "says", "says binance", "says bitcoin", "says ceo", "says hackers", "says stolen", "scaling", "scaling ethereum", "scam", "scam chain", "scam solana", "scammed", "scammers", "scams", "scandal", "schedule", "scheduled", "scheme", "schemes", "schwab", "scientific", "scooped", "scooped up", "scores", "scratch", "screener", "sdk", "search", "search engine", "season", "sec", "sec charges", "sec filed", "sec lawsuit", "sec sues", "second", "seconds", "secret", "secrets", "sector", "secure", "secured", "securities", "security", "security engineer", "see", "see again", "see cents", "see how", "see updog", "see ya", "seed", "seeing", "seeking", "seems", "seems like", "seen", "seen so", "sees", "seized", "seized iran's", "seized nearly", "seizes", "self", "self hosted", "sell", "sell here", "sell soon", "sellers", "selling", "selling $btc", "selling $eth", "selling ada", "selling altcoins", "selling bnb", "selling btc", "selling doge", "selling eth", "selling ethereum", "selling link", "selling market", "selling ripple", "selling sol", "selling xrp", "selloff", "sells", "senate", "senate bill", "senate passes", "send", "send $updog", "send higher", "sending", "sends", "sense", "sentence", "sentenced", "sentencing", "sentiment", "sepa", "sepa network", "seriously", "server", "service", "services", "set", "settle", "setup", "seven", "several", "sh", "shake", "shaken", "shaken out", "shame", "share", "shared", "shared roadmap", "shares", "sharing", "sharply", "sheds", "shift", "ship", "shit", "shit coin", "shit just", "shitcoin", "shitcoins", "shitty", "shock", "shopping", "short", "short term", "shorts", "shot", "show", "show hn", "showing", "shows", "shutdown", "shuts", "shuts down", "shutting", "shutting down", "side", "sideways", "sideways no", "sign", "signal", "signed", "significantly", "signs", "silicon", "silicon valley", "silk", "silk road", "silver", "simplest", "since", "single", "sinks", "sister", "sister crypto", "sites", "skpqpump", "sky", "skyrocket", "sleep", "sleep one", "slide", "slides", "slowly", "slumps", "sma", "small", "small position", "smart", "smart chain", "smart contract", "smart contracts", "smart money", "smell", "smells", "so", "so cheap", "so far", "so fucked", "so hard", "so many", "so much", "so top", "soar", "soar unaware", "soaring", "soars", "social", "social media", "social network", "software", "sol", "sol all", "sol breaking", "sol buy", "sol crashes", "sol fundamentals", "sol getting", "sol here", "sol news", "sol support", "sol surges", "sol trading", "sol volume", "sol weak", "solana", "solana aih", "solana all", "solana based", "solana breaking", "solana buy", "solana chart", "solana crashes", "solana getting", "solana here", "solana meme", "solana news", "solana support", "solana token", "solana trading", "solana volume", "solana wallets", "solana weak", "solana web", "solana's", "solar", "sold", "solid", "solid project", "solidity", "solution", "some", "some coins", "some crazy", "some decent", "some love", "some more", "some point", "some real", "some volume", "someone", "something", "something off", "sometime", "son", "sonic", "sons", "soon", "soon buy", "sophie", "sophie how", "sorry", "source", "south", "south korea", "sovereignai", "sovereignai buildout", "space", "spacex", "spacex ipo", "spam", "speaks", "speed", "spend", "spending", "spent", "spiking", "spot", "spot bitcoin", "spot etf", "spreading", "spreading fud", "square", "squeeze", "stable", "stable coin", "stable coins", "stablecoin", "stablecoin bill", "stablecoin collapsed", "stablecoin ex", "stablecoin issuer", "stablecoin market", "stablecoin payments", "stablecoin project", "stablecoin reserve", "stablecoin startup", "stablecoin tether", "stablecoin trading", "stablecoins", "stack", "stackshighsociety", "staff", "stake", "stake forbes", "staking", "staking tokens", "standard", "standard chartered", "stanley", "stark", "starknet", "start", "start move", "start pump", "start staking", "started", "starting", "starts", "startup", "state", "stated", "stated previously", "statements", "stats", "stats published", "stay", "stay away", "stay strong", "stayed", "stays", "stays up", "steady", "steal", "steal crypto", "steal cryptocurrency", "stealing", "stealing crypto", "steam", "stellar", "step", "step down", "steps", "steps up", "still", "still bearish", "still coming", "still early", "still holding", "still think", "stock", "stock market", "stocks", "stocks crypto", "stocks instead", "stocktwits", "stole", "stolen", "stolen crypto", "stolen cryptocurrency", "stolen data", "stop", "stopped", "storage", "store", "story", "straight", "straight back", "strategies", "stratosphere", "street", "street's", "strength", "stress", "strict", "strict list", "stripe", "strong", "strong confident", "strong support", "structure", "study", "stuff", "stupid", "sub", "subscriptions", "succeed", "such", "such life", "suck", "suckers", "sucks", "sue", "sued", "sues", "suffers", "suggest", "suggests", "sui", "summer", "sun", "super", "super bullish", "supply", "supply chain", "supply shock", "support", "support held", "support just", "support level", "supports", "supposed", "sure", "surge", "surges", "surges new", "surges past", "surpasses", "surprise", "surveillance", "suspected", "suspended", "suspends", "suspends payments", "suspends withdrawals", "sustainability", "sustainable", "suuku", "suuku tg", "swap", "swap $sol", "swe", "sweden", "swift", "swings", "switch", "system", "system end", "systems", "tail", "take", "take off", "taken", "takeover", "takes", "takes aim", "takes bitcoin", "takes place", "taking", "taking sister", "talk", "talking", "talking negative", "talks", "target", "target together", "targeting", "targets", "task", "tax", "tbh", "team", "team shared", "teams", "tech", "tech stocks", "technical", "technology", "teen", "telegram", "tell", "tell already", "tell hn", "telling", "tells", "temporarily", "temporarily suspended", "temporarily suspends", "temporary", "term", "term holders", "terminal", "terms", "terms conditions", "terra", "terra colleagues", "terra stablecoin", "terrausd", "terrible", "tesla", "tesla's", "test", "tether", "tether backs", "tether breaks", "tether says", "texas", "textbook", "tf", "tg", "th", "than", "than ever", "thank", "thank attention", "thank later", "thanks", "that's", "thats", "theft", "theory", "there", "there better", "there clear", "there no", "there's", "they're", "thief", "thiel", "thiel backed", "thiel's", "thin", "thing", "thing just", "things", "think", "think bitcoin", "thinking", "thinks", "third", "though", "thought", "thoughts", "thousands", "thread", "threat", "threat crypto", "threatening", "threats", "three", "throwing", "tia", "tickers", "tied", "tight", "till", "time", "time buy", "time crypto", "time fly", "time get", "time high", "time highs", "time load", "time lows", "time move", "time some", "times", "times pump", "tip", "tired", "today", "today $btc", "today ama", "today conference", "today developer", "today mainnet", "today team", "today's", "today's litepaper", "together", "together get", "token", "token launch", "tokenization", "tokens", "tokens coins", "told", "told many", "tom", "tom lee", "tomorrow", "ton", "too", "too late", "took", "took profits", "tool", "toolkit", "top", "top crypto", "top favorite", "top staking", "total", "touch", "tough", "toward", "town", "track", "tracker", "tracking", "trade", "traded", "trader", "traders", "trades", "trading", "trading around", "trading bot", "trading platform", "trading sideways", "traditional", "transaction", "transactions", "transfers", "transparent", "trap", "trash", "travel", "treasuries", "treasury", "trenches", "trend", "trend broken", "trending", "trending $updog", "trending stocktwits", "trending updog", "tried", "tries", "trigger", "trigger next", "triggered", "triggers", "trillion", "trip", "tron", "true", "true long", "trump", "trump administration", "trump going", "trump got", "trump media", "trump pardons", "trump sons", "trump's", "trust", "trusted", "try", "trying", "tuesday", "tumbles", "turd", "turkey", "turn", "turn any", "turned", "turning", "tvl", "tweet", "twitter", "two", "two brothers", "txs", "type", "typical", "ugly", "ui", "uk", "ukraine", "unable", "unaware", "unaware infamous", "undeniable", "undeniable here", "under", "undervalued", "undervalued great", "unfortunately", "unicorn", "uniswap", "unit", "united", "units", "unlike", "unlimited", "unrealized", "unregistered", "unregistered securities", "unstoppable", "until", "up", "up $btc", "up $eth", "up $sol", "up ada", "up altcoins", "up atom", "up avax", "up bitcoin", "up bnb", "up btc", "up call", "up cardano", "up crackdown", "up crypto", "up doge", "up end", "up eth", "up ethereum", "up good", "up last", "up link", "up market", "up now", "up once", "up only", "up ripple", "up so", "up sol", "up solana", "up some", "up there", "up today", "up xrp", "upbit", "upcoming", "update", "update bitcoin", "update posted", "updog", "updog $doge", "updog always", "updog great", "updog let", "upgrade", "upgrade huge", "upgrade went", "upside", "upside clear", "upside here", "upside potential", "ur", "usa", "usage", "usb", "usd", "usdc", "usdc stablecoin", "usdd", "usdt", "use", "use case", "used", "useless", "user", "user funds", "users", "uses", "using", "using cryptocurrencies", "using only", "ust", "ust ustc", "ustc", "ustc high", "usxdgnsl", "usxdgnsl rkiqmsc", "utility", "ux", "validator", "validators", "valley", "value", "vanishes", "vault", "vc", "ve", "ve ever", "ve seen", "verge", "verify", "version", "versus", "very", "very nice", "very soon", "veteran", "vets", "vets helped", "via", "victim", "victims", "video", "vidz", "vietnam", "vietnamese", "view", "virginia", "virtual", "virus", "visa", "vitalik", "volatility", "volume", "volume $cro", "volume dead", "volume exploding", "volume heating", "volume kicks", "volumes", "voting", "vs", "vsfvprv", "vsfvprv qzhyms", "wait", "waiting", "waiting clear", "waiting happen", "wake", "wake up", "waking", "waking up", "wall", "wall street", "wall street's", "wallet", "wallets", "want", "wants", "wants orderly", "warn", "warned", "warning", "warns", "warns bankruptcy", "warns new", "warren", "washington", "wasn't", "waste", "waste money", "watch", "watch alert", "watchdog", "watched", "watchers", "watching", "watching key", "wave", "way", "way back", "ways", "wayyy", "wazirx", "we're", "we're going", "weak", "weak hands", "wealth", "web", "web js", "web security", "webrtc", "website", "websites", "wedge", "week", "week lets", "weekend", "weekly", "weeks", "weight", "weight loss", "weirdest", "welcome", "welcome getting", "well", "went", "went live", "whale", "whale dumped", "whales", "whales accumulate", "whales accumulating", "what's", "what's happening", "whatever", "whatsoever", "where", "white", "white paper", "whitepaper", "whole", "why", "why anyone", "why so", "why stablecoins", "wif", "wiki", "wild", "willing", "win", "windows", "winner", "winning", "wins", "wins sec", "winter", "wipe", "wipe out", "wiped", "wiped out", "withdraw", "withdrawal", "withdrawals", "within", "without", "witness", "wluna", "wluna luna", "woman", "won", "won't", "won't help", "wonder", "wondering", "wont", "word", "work", "workforce", "working", "works", "world", "worlds", "worried", "worry", "worse", "worst", "worth", "worth back", "worth buy", "worth holding", "worthless", "wow", "wow shit", "wrapped", "writing", "written", "wrong", "wsj", "wtf", "ww", "xc", "xc da", "xlm", "xrp", "xrp all", "xrp breaking", "xrp chart", "xrp fundamentals", "xrp getting", "xrp here", "xrp looks", "xrp momentum", "xrp news", "xrp smart", "xrp surges", "xrp trading", "xrp volume", "ya", "ya ll", "ya trending", "ya updog", "yall", "yawn", "yc", "year", "year crypto", "year old", "yearly", "years", "years ago", "years trenches", "yep", "yes", "yet", "yield", "yl", "yl suuku", "you'll", "you're", "youtube", "youtube live", "ys", "ys kdb", "yzv", "yzv skpqpump", "zcash", "zerdofr", "zerdofr ndt", "zero", "zero knowledge", "zhao", "zhao plead", "zipmex", "zk", "zone", "zoom"], "trainedAt": "2026-06-04T16:32:37Z", "trainSize": 4050, "testSize": 52 };
  }
});

// api/_lib/ai/nlp/model-metrics.ts
var MODEL_METRICS;
var init_model_metrics = __esm({
  "api/_lib/ai/nlp/model-metrics.ts"() {
    MODEL_METRICS = { "accuracy": 0.7115, "macroF1": 0.707, "perClass": { "positive": { "precision": 0.75, "recall": 0.6, "f1": 0.6667, "support": 20 }, "negative": { "precision": 0.7273, "recall": 0.8, "f1": 0.7619, "support": 20 }, "neutral": { "precision": 0.6429, "recall": 0.75, "f1": 0.6923, "support": 12 } }, "confusion": { "positive": { "positive": 12, "negative": 4, "neutral": 4 }, "negative": { "positive": 3, "negative": 16, "neutral": 1 }, "neutral": { "positive": 1, "negative": 2, "neutral": 9 } }, "testSize": 52, "errors": [{ "text": "Bitcoin closed flat for the week amid low summer volume", "trueLabel": "neutral", "predicted": "negative", "confidence": 0 }, { "text": "Massive ETF inflows offset miner selling, price holds firm", "trueLabel": "positive", "predicted": "negative", "confidence": 0 }, { "text": "JP Morgan upgrades crypto allocation, calls Bitcoin a strategic hedge", "trueLabel": "positive", "predicted": "negative", "confidence": 0 }, { "text": "Hopes for ETF approval dashed by SEC last minute rejection", "trueLabel": "negative", "predicted": "positive", "confidence": 0 }, { "text": "PayPal expands crypto payments to more European countries", "trueLabel": "positive", "predicted": "neutral", "confidence": 0 }, { "text": "Bitcoin fear and greed index moves from extreme fear to neutral", "trueLabel": "positive", "predicted": "negative", "confidence": 0 }, { "text": "Bitcoin mining now uses 50 percent renewable energy industry says", "trueLabel": "positive", "predicted": "neutral", "confidence": 0 }, { "text": "Crypto market sentiment turns bullish as macro fears ease", "trueLabel": "positive", "predicted": "negative", "confidence": 0 }, { "text": "Bitcoin price prediction model says continued upside through Q4", "trueLabel": "positive", "predicted": "neutral", "confidence": 0 }, { "text": "A grim quarterly report shows users abandoning the platform", "trueLabel": "negative", "predicted": "neutral", "confidence": 0 }, { "text": "Crypto winter is just starting, brace for years of pain ahead", "trueLabel": "negative", "predicted": "positive", "confidence": 0 }, { "text": "A neutral market commentary, both bulls and bears have arguments", "trueLabel": "neutral", "predicted": "positive", "confidence": 0 }, { "text": "How exactly does miner extractable value impact transaction ordering", "trueLabel": "neutral", "predicted": "negative", "confidence": 0 }, { "text": "Crypto education startup raises $50M, mission gaining traction", "trueLabel": "positive", "predicted": "neutral", "confidence": 0 }, { "text": "Bitcoin dropped sharply on regulatory concerns from Vietnam SBV", "trueLabel": "negative", "predicted": "positive", "confidence": 0 }], "vocabSize": 4699, "trainSize": 4050, "trainedAt": "2026-06-04T16:32:37Z", "algorithm": "complement-naive-bayes", "smoothingAlpha": 0.3, "comparedModels": [{ "name": "multinomial-naive-bayes", "macroF1": 0.6469, "accuracy": 0.6538, "cvF1": 0.8034 }, { "name": "complement-naive-bayes", "macroF1": 0.707, "accuracy": 0.7115, "cvF1": 0.8072 }, { "name": "logistic-regression", "macroF1": 0.7047, "accuracy": 0.7115, "cvF1": 0.8697 }, { "name": "linear-svc", "macroF1": 0.6654, "accuracy": 0.6731, "cvF1": 0.8821 }] };
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
  pushMentionSample(base, mentions);
  const zs = zScore(base, mentions);
  const spike = zs.z > 1.5 && zs.n >= 5;
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
var MENTION_HISTORY, HISTORY_MAX, SENTIMENT_CACHE_TTL_MS, sentimentCache;
var init_pipeline = __esm({
  "api/_lib/ai/pipeline.ts"() {
    init_reddit();
    init_hackerNews();
    init_stocktwits();
    init_fearGreed();
    init_coingecko();
    init_cryptoNewsRss();
    init_vader();
    init_classifier();
    MENTION_HISTORY = /* @__PURE__ */ new Map();
    HISTORY_MAX = 24;
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
    const url = `https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=${cappedDays}&interval=daily`;
    const res = await fetch(url, { headers: { "User-Agent": USER_AGENT6, "Accept": "application/json" } });
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

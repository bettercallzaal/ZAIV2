exports.id = 809;
exports.ids = [809];
exports.modules = {

/***/ 394:
/***/ ((module) => {

"use strict";


module.exports = prettifyMetadata

/**
 * @typedef {object} PrettifyMetadataParams
 * @property {object} log The log that may or may not contain metadata to
 * be prettified.
 * @property {PrettyContext} context The context object built from parsing
 * the options.
 */

/**
 * Prettifies metadata that is usually present in a Pino log line. It looks for
 * fields `name`, `pid`, `hostname`, and `caller` and returns a formatted string using
 * the fields it finds.
 *
 * @param {PrettifyMetadataParams} input
 *
 * @returns {undefined|string} If no metadata is found then `undefined` is
 * returned. Otherwise, a string of prettified metadata is returned.
 */
function prettifyMetadata ({ log, context }) {
  const { customPrettifiers: prettifiers, colorizer } = context
  let line = ''

  if (log.name || log.pid || log.hostname) {
    line += '('

    if (log.name) {
      line += prettifiers.name
        ? prettifiers.name(log.name, 'name', log, { colors: colorizer.colors })
        : log.name
    }

    if (log.pid) {
      const prettyPid = prettifiers.pid
        ? prettifiers.pid(log.pid, 'pid', log, { colors: colorizer.colors })
        : log.pid
      if (log.name && log.pid) {
        line += '/' + prettyPid
      } else {
        line += prettyPid
      }
    }

    if (log.hostname) {
      // If `pid` and `name` were in the ignore keys list then we don't need
      // the leading space.
      const prettyHostname = prettifiers.hostname
        ? prettifiers.hostname(log.hostname, 'hostname', log, { colors: colorizer.colors })
        : log.hostname

      line += `${line === '(' ? 'on' : ' on'} ${prettyHostname}`
    }

    line += ')'
  }

  if (log.caller) {
    const prettyCaller = prettifiers.caller
      ? prettifiers.caller(log.caller, 'caller', log, { colors: colorizer.colors })
      : log.caller

    line += `${line === '' ? '' : ' '}<${prettyCaller}>`
  }

  if (line === '') {
    return undefined
  } else {
    return line
  }
}


/***/ }),

/***/ 815:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var once = __webpack_require__(3519)
var eos = __webpack_require__(6611)
var fs

try {
  fs = __webpack_require__(9896) // we only need fs to get the ReadStream and WriteStream prototypes
} catch (e) {}

var noop = function () {}
var ancient = typeof process === 'undefined' ? false : /^v?\.0/.test(process.version)

var isFn = function (fn) {
  return typeof fn === 'function'
}

var isFS = function (stream) {
  if (!ancient) return false // newer node version do not need to care about fs is a special way
  if (!fs) return false // browser
  return (stream instanceof (fs.ReadStream || noop) || stream instanceof (fs.WriteStream || noop)) && isFn(stream.close)
}

var isRequest = function (stream) {
  return stream.setHeader && isFn(stream.abort)
}

var destroyer = function (stream, reading, writing, callback) {
  callback = once(callback)

  var closed = false
  stream.on('close', function () {
    closed = true
  })

  eos(stream, {readable: reading, writable: writing}, function (err) {
    if (err) return callback(err)
    closed = true
    callback()
  })

  var destroyed = false
  return function (err) {
    if (closed) return
    if (destroyed) return
    destroyed = true

    if (isFS(stream)) return stream.close(noop) // use close for fs streams to avoid fd leaks
    if (isRequest(stream)) return stream.abort() // request.destroy just do .end - .abort is what we want

    if (isFn(stream.destroy)) return stream.destroy()

    callback(err || new Error('stream was destroyed'))
  }
}

var call = function (fn) {
  fn()
}

var pipe = function (from, to) {
  return from.pipe(to)
}

var pump = function () {
  var streams = Array.prototype.slice.call(arguments)
  var callback = isFn(streams[streams.length - 1] || noop) && streams.pop() || noop

  if (Array.isArray(streams[0])) streams = streams[0]
  if (streams.length < 2) throw new Error('pump requires two streams per minimum')

  var error
  var destroys = streams.map(function (stream, i) {
    var reading = i < streams.length - 1
    var writing = i > 0
    return destroyer(stream, reading, writing, function (err) {
      if (!error) error = err
      if (err) destroys.forEach(call)
      if (reading) return
      destroys.forEach(call)
      callback(error)
    })
  })

  return streams.reduce(pipe)
}

module.exports = pump


/***/ }),

/***/ 954:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


module.exports = interpretConditionals

const getPropertyValue = __webpack_require__(6901)

/**
 * Translates all conditional blocks from within the messageFormat. Translates
 * any matching {if key}{key}{end} statements and returns everything between
 * if and else blocks if the key provided was found in log.
 *
 * @param {MessageFormatString|MessageFormatFunction} messageFormat A format
 * string or function that defines how the logged message should be
 * conditionally formatted.
 * @param {object} log The log object to be modified.
 *
 * @returns {string} The parsed messageFormat.
 */
function interpretConditionals (messageFormat, log) {
  messageFormat = messageFormat.replace(/{if (.*?)}(.*?){end}/g, replacer)

  // Remove non-terminated if blocks
  messageFormat = messageFormat.replace(/{if (.*?)}/g, '')
  // Remove floating end blocks
  messageFormat = messageFormat.replace(/{end}/g, '')

  return messageFormat.replace(/\s+/g, ' ').trim()

  function replacer (_, key, value) {
    const propertyValue = getPropertyValue(log, key)
    if (propertyValue && value.includes(key)) {
      return value.replace(new RegExp('{' + key + '}', 'g'), propertyValue)
    } else {
      return ''
    }
  }
}


/***/ }),

/***/ 1381:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


module.exports = prettifyError

const joinLinesWithIndentation = __webpack_require__(7515)

/**
 * @typedef {object} PrettifyErrorParams
 * @property {string} keyName The key assigned to this error in the log object.
 * @property {string} lines The STRINGIFIED error. If the error field has a
 *  custom prettifier, that should be pre-applied as well.
 * @property {string} ident The indentation sequence to use.
 * @property {string} eol The EOL sequence to use.
 */

/**
 * Prettifies an error string into a multi-line format.
 *
 * @param {PrettifyErrorParams} input
 *
 * @returns {string}
 */
function prettifyError ({ keyName, lines, eol, ident }) {
  let result = ''
  const joinedLines = joinLinesWithIndentation({ input: lines, ident, eol })
  const splitLines = `${ident}${keyName}: ${joinedLines}${eol}`.split(eol)

  for (let j = 0; j < splitLines.length; j += 1) {
    if (j !== 0) result += eol

    const line = splitLines[j]
    if (/^\s*"stack"/.test(line)) {
      const matches = /^(\s*"stack":)\s*(".*"),?$/.exec(line)
      /* istanbul ignore else */
      if (matches && matches.length === 3) {
        const indentSize = /^\s*/.exec(line)[0].length + 4
        const indentation = ' '.repeat(indentSize)
        const stackMessage = matches[2]
        result += matches[1] + eol + indentation + JSON.parse(stackMessage).replace(/\n/g, eol + indentation)
      } else {
        result += line
      }
    } else {
      result += line
    }
  }

  return result
}


/***/ }),

/***/ 1584:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


module.exports = formatTime

const {
  DATE_FORMAT,
  DATE_FORMAT_SIMPLE
} = __webpack_require__(4160)

const dateformat = __webpack_require__(4075)
const createDate = __webpack_require__(7492)
const isValidDate = __webpack_require__(2993)

/**
 * Converts a given `epoch` to a desired display format.
 *
 * @param {number|string} epoch The time to convert. May be any value that is
 * valid for `new Date()`.
 * @param {boolean|string} [translateTime=false] When `false`, the given `epoch`
 * will simply be returned. When `true`, the given `epoch` will be converted
 * to a string at UTC using the `DATE_FORMAT` constant. If `translateTime` is
 * a string, the following rules are available:
 *
 * - `<format string>`: The string is a literal format string. This format
 * string will be used to interpret the `epoch` and return a display string
 * at UTC.
 * - `SYS:STANDARD`: The returned display string will follow the `DATE_FORMAT`
 * constant at the system's local timezone.
 * - `SYS:<format string>`: The returned display string will follow the given
 * `<format string>` at the system's local timezone.
 * - `UTC:<format string>`: The returned display string will follow the given
 * `<format string>` at UTC.
 *
 * @returns {number|string} The formatted time.
 */
function formatTime (epoch, translateTime = false) {
  if (translateTime === false) {
    return epoch
  }

  const instant = createDate(epoch)

  // If the Date is invalid, do not attempt to format
  if (!isValidDate(instant)) {
    return epoch
  }

  if (translateTime === true) {
    return dateformat(instant, DATE_FORMAT_SIMPLE)
  }

  const upperFormat = translateTime.toUpperCase()
  if (upperFormat === 'SYS:STANDARD') {
    return dateformat(instant, DATE_FORMAT)
  }

  const prefix = upperFormat.substr(0, 4)
  if (prefix === 'SYS:' || prefix === 'UTC:') {
    if (prefix === 'UTC:') {
      return dateformat(instant, translateTime)
    }
    return dateformat(instant, translateTime.slice(4))
  }

  return dateformat(instant, `UTC:${translateTime}`)
}


/***/ }),

/***/ 1600:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


module.exports = parseFactoryOptions

const {
  LEVEL_NAMES
} = __webpack_require__(4160)
const colors = __webpack_require__(7589)
const handleCustomLevelsOpts = __webpack_require__(2944)
const handleCustomLevelsNamesOpts = __webpack_require__(6635)
const handleLevelLabelData = __webpack_require__(3140)

/**
 * A `PrettyContext` is an object to be used by the various functions that
 * process log data. It is derived from the provided {@link PinoPrettyOptions}.
 * It may be used as a `this` context.
 *
 * @typedef {object} PrettyContext
 * @property {string} EOL The escape sequence chosen as the line terminator.
 * @property {string} IDENT The string to use as the indentation sequence.
 * @property {ColorizerFunc} colorizer A configured colorizer function.
 * @property {Array[Array<number, string>]} customColors A set of custom color
 * names associated with level numbers.
 * @property {object} customLevelNames A hash of level numbers to level names,
 * e.g. `{ 30: "info" }`.
 * @property {object} customLevels A hash of level names to level numbers,
 * e.g. `{ info: 30 }`.
 * @property {CustomPrettifiers} customPrettifiers A hash of custom prettifier
 * functions.
 * @property {object} customProperties Comprised of `customLevels` and
 * `customLevelNames` if such options are provided.
 * @property {string[]} errorLikeObjectKeys The key names in the log data that
 * should be considered as holding error objects.
 * @property {string[]} errorProps A list of error object keys that should be
 * included in the output.
 * @property {function} getLevelLabelData Pass a numeric level to return [levelLabelString,levelNum]
 * @property {boolean} hideObject Indicates the prettifier should omit objects
 * in the output.
 * @property {string[]} ignoreKeys Set of log data keys to omit.
 * @property {string[]} includeKeys Opposite of `ignoreKeys`.
 * @property {boolean} levelFirst Indicates the level should be printed first.
 * @property {string} levelKey Name of the key in the log data that contains
 * the message.
 * @property {string} levelLabel Format token to represent the position of the
 * level name in the output string.
 * @property {MessageFormatString|MessageFormatFunction} messageFormat
 * @property {string} messageKey Name of the key in the log data that contains
 * the message.
 * @property {string|number} minimumLevel The minimum log level to process
 * and output.
 * @property {ColorizerFunc} objectColorizer
 * @property {boolean} singleLine Indicates objects should be printed on a
 * single output line.
 * @property {string} timestampKey The name of the key in the log data that
 * contains the log timestamp.
 * @property {boolean} translateTime Indicates if timestamps should be
 * translated to a human-readable string.
 * @property {boolean} useOnlyCustomProps
 */

/**
 * @param {PinoPrettyOptions} options The user supplied object of options.
 *
 * @returns {PrettyContext}
 */
function parseFactoryOptions (options) {
  const EOL = options.crlf ? '\r\n' : '\n'
  const IDENT = '    '
  const {
    customPrettifiers,
    errorLikeObjectKeys,
    hideObject,
    levelFirst,
    levelKey,
    levelLabel,
    messageFormat,
    messageKey,
    minimumLevel,
    singleLine,
    timestampKey,
    translateTime
  } = options
  const errorProps = options.errorProps.split(',')
  const useOnlyCustomProps = typeof options.useOnlyCustomProps === 'boolean'
    ? options.useOnlyCustomProps
    : (options.useOnlyCustomProps === 'true')
  const customLevels = handleCustomLevelsOpts(options.customLevels)
  const customLevelNames = handleCustomLevelsNamesOpts(options.customLevels)
  const getLevelLabelData = handleLevelLabelData(useOnlyCustomProps, customLevels, customLevelNames)

  let customColors
  if (options.customColors) {
    if (typeof options.customColors === 'string') {
      customColors = options.customColors.split(',').reduce((agg, value) => {
        const [level, color] = value.split(':')
        const condition = useOnlyCustomProps
          ? options.customLevels
          : customLevelNames[level] !== undefined
        const levelNum = condition
          ? customLevelNames[level]
          : LEVEL_NAMES[level]
        const colorIdx = levelNum !== undefined
          ? levelNum
          : level
        agg.push([colorIdx, color])
        return agg
      }, [])
    } else if (typeof options.customColors === 'object') {
      customColors = Object.keys(options.customColors).reduce((agg, value) => {
        const [level, color] = [value, options.customColors[value]]
        const condition = useOnlyCustomProps
          ? options.customLevels
          : customLevelNames[level] !== undefined
        const levelNum = condition
          ? customLevelNames[level]
          : LEVEL_NAMES[level]
        const colorIdx = levelNum !== undefined
          ? levelNum
          : level
        agg.push([colorIdx, color])
        return agg
      }, [])
    } else {
      throw new Error('options.customColors must be of type string or object.')
    }
  }

  const customProperties = { customLevels, customLevelNames }
  if (useOnlyCustomProps === true && !options.customLevels) {
    customProperties.customLevels = undefined
    customProperties.customLevelNames = undefined
  }

  const includeKeys = options.include !== undefined
    ? new Set(options.include.split(','))
    : undefined
  const ignoreKeys = (!includeKeys && options.ignore)
    ? new Set(options.ignore.split(','))
    : undefined

  const colorizer = colors(options.colorize, customColors, useOnlyCustomProps)
  const objectColorizer = options.colorizeObjects
    ? colorizer
    : colors(false, [], false)

  return {
    EOL,
    IDENT,
    colorizer,
    customColors,
    customLevelNames,
    customLevels,
    customPrettifiers,
    customProperties,
    errorLikeObjectKeys,
    errorProps,
    getLevelLabelData,
    hideObject,
    ignoreKeys,
    includeKeys,
    levelFirst,
    levelKey,
    levelLabel,
    messageFormat,
    messageKey,
    minimumLevel,
    objectColorizer,
    singleLine,
    timestampKey,
    translateTime,
    useOnlyCustomProps
  }
}


/***/ }),

/***/ 1809:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


const { isColorSupported } = __webpack_require__(5844)
const pump = __webpack_require__(815)
const { Transform } = __webpack_require__(2203)
const abstractTransport = __webpack_require__(2398)
const colors = __webpack_require__(7589)
const {
  ERROR_LIKE_KEYS,
  LEVEL_KEY,
  LEVEL_LABEL,
  MESSAGE_KEY,
  TIMESTAMP_KEY
} = __webpack_require__(4160)
const {
  buildSafeSonicBoom,
  parseFactoryOptions
} = __webpack_require__(4683)
const pretty = __webpack_require__(8881)

/**
 * @typedef {object} PinoPrettyOptions
 * @property {boolean} [colorize] Indicates if colors should be used when
 * prettifying. The default will be determined by the terminal capabilities at
 * run time.
 * @property {boolean} [colorizeObjects=true] Apply coloring to rendered objects
 * when coloring is enabled.
 * @property {boolean} [crlf=false] End lines with `\r\n` instead of `\n`.
 * @property {string|null} [customColors=null] A comma separated list of colors
 * to use for specific level labels, e.g. `err:red,info:blue`.
 * @property {string|null} [customLevels=null] A comma separated list of user
 * defined level names and numbers, e.g. `err:99,info:1`.
 * @property {CustomPrettifiers} [customPrettifiers={}] A set of prettifier
 * functions to apply to keys defined in this object.
 * @property {K_ERROR_LIKE_KEYS} [errorLikeObjectKeys] A list of string property
 * names to consider as error objects.
 * @property {string} [errorProps=''] A comma separated list of properties on
 * error objects to include in the output.
 * @property {boolean} [hideObject=false] When `true`, data objects will be
 * omitted from the output (except for error objects).
 * @property {string} [ignore='hostname'] A comma separated list of log keys
 * to omit when outputting the prettified log information.
 * @property {undefined|string} [include=undefined] A comma separated list of
 * log keys to include in the prettified log information. Only the keys in this
 * list will be included in the output.
 * @property {boolean} [levelFirst=false] When true, the log level will be the
 * first field in the prettified output.
 * @property {string} [levelKey='level'] The key name in the log data that
 * contains the level value for the log.
 * @property {string} [levelLabel='levelLabel'] Token name to use in
 * `messageFormat` to represent the name of the logged level.
 * @property {null|MessageFormatString|MessageFormatFunction} [messageFormat=null]
 * When a string, defines how the prettified line should be formatted according
 * to defined tokens. When a function, a synchronous function that returns a
 * formatted string.
 * @property {string} [messageKey='msg'] Defines the key in incoming logs that
 * contains the message of the log, if present.
 * @property {undefined|string|number} [minimumLevel=undefined] The minimum
 * level for logs that should be processed. Any logs below this level will
 * be omitted.
 * @property {object} [outputStream=process.stdout] The stream to write
 * prettified log lines to.
 * @property {boolean} [singleLine=false] When `true` any objects, except error
 * objects, in the log data will be printed as a single line instead as multiple
 * lines.
 * @property {string} [timestampKey='time'] Defines the key in incoming logs
 * that contains the timestamp of the log, if present.
 * @property {boolean|string} [translateTime=true] When true, will translate a
 * JavaScript date integer into a human-readable string. If set to a string,
 * it must be a format string.
 * @property {boolean} [useOnlyCustomProps=true] When true, only custom levels
 * and colors will be used if they have been provided.
 */

/**
 * The default options that will be used when prettifying log lines.
 *
 * @type {PinoPrettyOptions}
 */
const defaultOptions = {
  colorize: isColorSupported,
  colorizeObjects: true,
  crlf: false,
  customColors: null,
  customLevels: null,
  customPrettifiers: {},
  errorLikeObjectKeys: ERROR_LIKE_KEYS,
  errorProps: '',
  hideObject: false,
  ignore: 'hostname',
  include: undefined,
  levelFirst: false,
  levelKey: LEVEL_KEY,
  levelLabel: LEVEL_LABEL,
  messageFormat: null,
  messageKey: MESSAGE_KEY,
  minimumLevel: undefined,
  outputStream: process.stdout,
  singleLine: false,
  timestampKey: TIMESTAMP_KEY,
  translateTime: true,
  useOnlyCustomProps: true
}

/**
 * Processes the supplied options and returns a function that accepts log data
 * and produces a prettified log string.
 *
 * @param {PinoPrettyOptions} options Configuration for the prettifier.
 * @returns {LogPrettifierFunc}
 */
function prettyFactory (options) {
  const context = parseFactoryOptions(Object.assign({}, defaultOptions, options))
  return pretty.bind({ ...context, context })
}

/**
 * @typedef {PinoPrettyOptions} BuildStreamOpts
 * @property {object|number|string} [destination] A destination stream, file
 * descriptor, or target path to a file.
 * @property {boolean} [append]
 * @property {boolean} [mkdir]
 * @property {boolean} [sync=false]
 */

/**
 * Constructs a {@link LogPrettifierFunc} and a stream to which the produced
 * prettified log data will be written.
 *
 * @param {BuildStreamOpts} opts
 * @returns {Transform | (Transform & OnUnknown)}
 */
function build (opts = {}) {
  let pretty = prettyFactory(opts)
  let destination
  return abstractTransport(function (source) {
    source.on('message', function pinoConfigListener (message) {
      if (!message || message.code !== 'PINO_CONFIG') return
      Object.assign(opts, {
        messageKey: message.config.messageKey,
        errorLikeObjectKeys: Array.from(new Set([...(opts.errorLikeObjectKeys || ERROR_LIKE_KEYS), message.config.errorKey])),
        customLevels: message.config.levels.values
      })
      pretty = prettyFactory(opts)
      source.off('message', pinoConfigListener)
    })
    const stream = new Transform({
      objectMode: true,
      autoDestroy: true,
      transform (chunk, enc, cb) {
        const line = pretty(chunk)
        cb(null, line)
      }
    })

    if (typeof opts.destination === 'object' && typeof opts.destination.write === 'function') {
      destination = opts.destination
    } else {
      destination = buildSafeSonicBoom({
        dest: opts.destination || 1,
        append: opts.append,
        mkdir: opts.mkdir,
        sync: opts.sync // by default sonic will be async
      })
    }

    source.on('unknown', function (line) {
      destination.write(line + '\n')
    })

    pump(source, stream, destination)
    return stream
  }, {
    parse: 'lines',
    close (err, cb) {
      destination.on('close', () => {
        cb(err)
      })
    }
  })
}

module.exports = build
module.exports.build = build
module.exports.PinoPretty = build
module.exports.prettyFactory = prettyFactory
module.exports.colorizerFactory = colors
module.exports.isColorSupported = isColorSupported
module.exports["default"] = build


/***/ }),

/***/ 2319:
/***/ ((__unused_webpack_module, exports) => {

"use strict";


Object.defineProperty(exports, "__esModule", ({ value: true }));

var toStringFunction = Function.prototype.toString;
var create = Object.create;
var toStringObject = Object.prototype.toString;
/**
 * @classdesc Fallback cache for when WeakMap is not natively supported
 */
var LegacyCache = /** @class */ (function () {
    function LegacyCache() {
        this._keys = [];
        this._values = [];
    }
    LegacyCache.prototype.has = function (key) {
        return !!~this._keys.indexOf(key);
    };
    LegacyCache.prototype.get = function (key) {
        return this._values[this._keys.indexOf(key)];
    };
    LegacyCache.prototype.set = function (key, value) {
        this._keys.push(key);
        this._values.push(value);
    };
    return LegacyCache;
}());
function createCacheLegacy() {
    return new LegacyCache();
}
function createCacheModern() {
    return new WeakMap();
}
/**
 * Get a new cache object to prevent circular references.
 */
var createCache = typeof WeakMap !== 'undefined' ? createCacheModern : createCacheLegacy;
/**
 * Get an empty version of the object with the same prototype it has.
 */
function getCleanClone(prototype) {
    if (!prototype) {
        return create(null);
    }
    var Constructor = prototype.constructor;
    if (Constructor === Object) {
        return prototype === Object.prototype ? {} : create(prototype);
    }
    if (Constructor &&
        ~toStringFunction.call(Constructor).indexOf('[native code]')) {
        try {
            return new Constructor();
        }
        catch (_a) { }
    }
    return create(prototype);
}
function getRegExpFlagsLegacy(regExp) {
    var flags = '';
    if (regExp.global) {
        flags += 'g';
    }
    if (regExp.ignoreCase) {
        flags += 'i';
    }
    if (regExp.multiline) {
        flags += 'm';
    }
    if (regExp.unicode) {
        flags += 'u';
    }
    if (regExp.sticky) {
        flags += 'y';
    }
    return flags;
}
function getRegExpFlagsModern(regExp) {
    return regExp.flags;
}
/**
 * Get the flags to apply to the copied regexp.
 */
var getRegExpFlags = /test/g.flags === 'g' ? getRegExpFlagsModern : getRegExpFlagsLegacy;
function getTagLegacy(value) {
    var type = toStringObject.call(value);
    return type.substring(8, type.length - 1);
}
function getTagModern(value) {
    return value[Symbol.toStringTag] || getTagLegacy(value);
}
/**
 * Get the tag of the value passed, so that the correct copier can be used.
 */
var getTag = typeof Symbol !== 'undefined' ? getTagModern : getTagLegacy;

var defineProperty = Object.defineProperty, getOwnPropertyDescriptor = Object.getOwnPropertyDescriptor, getOwnPropertyNames = Object.getOwnPropertyNames, getOwnPropertySymbols = Object.getOwnPropertySymbols;
var _a = Object.prototype, hasOwnProperty = _a.hasOwnProperty, propertyIsEnumerable = _a.propertyIsEnumerable;
var SUPPORTS_SYMBOL = typeof getOwnPropertySymbols === 'function';
function getStrictPropertiesModern(object) {
    return getOwnPropertyNames(object).concat(getOwnPropertySymbols(object));
}
/**
 * Get the properites used when copying objects strictly. This includes both keys and symbols.
 */
var getStrictProperties = SUPPORTS_SYMBOL
    ? getStrictPropertiesModern
    : getOwnPropertyNames;
/**
 * Striclty copy all properties contained on the object.
 */
function copyOwnPropertiesStrict(value, clone, state) {
    var properties = getStrictProperties(value);
    for (var index = 0, length_1 = properties.length, property = void 0, descriptor = void 0; index < length_1; ++index) {
        property = properties[index];
        if (property === 'callee' || property === 'caller') {
            continue;
        }
        descriptor = getOwnPropertyDescriptor(value, property);
        if (!descriptor) {
            // In extra edge cases where the property descriptor cannot be retrived, fall back to
            // the loose assignment.
            clone[property] = state.copier(value[property], state);
            continue;
        }
        // Only clone the value if actually a value, not a getter / setter.
        if (!descriptor.get && !descriptor.set) {
            descriptor.value = state.copier(descriptor.value, state);
        }
        try {
            defineProperty(clone, property, descriptor);
        }
        catch (error) {
            // Tee above can fail on node in edge cases, so fall back to the loose assignment.
            clone[property] = descriptor.value;
        }
    }
    return clone;
}
/**
 * Deeply copy the indexed values in the array.
 */
function copyArrayLoose(array, state) {
    var clone = new state.Constructor();
    // set in the cache immediately to be able to reuse the object recursively
    state.cache.set(array, clone);
    for (var index = 0, length_2 = array.length; index < length_2; ++index) {
        clone[index] = state.copier(array[index], state);
    }
    return clone;
}
/**
 * Deeply copy the indexed values in the array, as well as any custom properties.
 */
function copyArrayStrict(array, state) {
    var clone = new state.Constructor();
    // set in the cache immediately to be able to reuse the object recursively
    state.cache.set(array, clone);
    return copyOwnPropertiesStrict(array, clone, state);
}
/**
 * Copy the contents of the ArrayBuffer.
 */
function copyArrayBuffer(arrayBuffer, _state) {
    return arrayBuffer.slice(0);
}
/**
 * Create a new Blob with the contents of the original.
 */
function copyBlob(blob, _state) {
    return blob.slice(0, blob.size, blob.type);
}
/**
 * Create a new DataView with the contents of the original.
 */
function copyDataView(dataView, state) {
    return new state.Constructor(copyArrayBuffer(dataView.buffer));
}
/**
 * Create a new Date based on the time of the original.
 */
function copyDate(date, state) {
    return new state.Constructor(date.getTime());
}
/**
 * Deeply copy the keys and values of the original.
 */
function copyMapLoose(map, state) {
    var clone = new state.Constructor();
    // set in the cache immediately to be able to reuse the object recursively
    state.cache.set(map, clone);
    map.forEach(function (value, key) {
        clone.set(key, state.copier(value, state));
    });
    return clone;
}
/**
 * Deeply copy the keys and values of the original, as well as any custom properties.
 */
function copyMapStrict(map, state) {
    return copyOwnPropertiesStrict(map, copyMapLoose(map, state), state);
}
function copyObjectLooseLegacy(object, state) {
    var clone = getCleanClone(state.prototype);
    // set in the cache immediately to be able to reuse the object recursively
    state.cache.set(object, clone);
    for (var key in object) {
        if (hasOwnProperty.call(object, key)) {
            clone[key] = state.copier(object[key], state);
        }
    }
    return clone;
}
function copyObjectLooseModern(object, state) {
    var clone = getCleanClone(state.prototype);
    // set in the cache immediately to be able to reuse the object recursively
    state.cache.set(object, clone);
    for (var key in object) {
        if (hasOwnProperty.call(object, key)) {
            clone[key] = state.copier(object[key], state);
        }
    }
    var symbols = getOwnPropertySymbols(object);
    for (var index = 0, length_3 = symbols.length, symbol = void 0; index < length_3; ++index) {
        symbol = symbols[index];
        if (propertyIsEnumerable.call(object, symbol)) {
            clone[symbol] = state.copier(object[symbol], state);
        }
    }
    return clone;
}
/**
 * Deeply copy the properties (keys and symbols) and values of the original.
 */
var copyObjectLoose = SUPPORTS_SYMBOL
    ? copyObjectLooseModern
    : copyObjectLooseLegacy;
/**
 * Deeply copy the properties (keys and symbols) and values of the original, as well
 * as any hidden or non-enumerable properties.
 */
function copyObjectStrict(object, state) {
    var clone = getCleanClone(state.prototype);
    // set in the cache immediately to be able to reuse the object recursively
    state.cache.set(object, clone);
    return copyOwnPropertiesStrict(object, clone, state);
}
/**
 * Create a new primitive wrapper from the value of the original.
 */
function copyPrimitiveWrapper(primitiveObject, state) {
    return new state.Constructor(primitiveObject.valueOf());
}
/**
 * Create a new RegExp based on the value and flags of the original.
 */
function copyRegExp(regExp, state) {
    var clone = new state.Constructor(regExp.source, getRegExpFlags(regExp));
    clone.lastIndex = regExp.lastIndex;
    return clone;
}
/**
 * Return the original value (an identity function).
 *
 * @note
 * THis is used for objects that cannot be copied, such as WeakMap.
 */
function copySelf(value, _state) {
    return value;
}
/**
 * Deeply copy the values of the original.
 */
function copySetLoose(set, state) {
    var clone = new state.Constructor();
    // set in the cache immediately to be able to reuse the object recursively
    state.cache.set(set, clone);
    set.forEach(function (value) {
        clone.add(state.copier(value, state));
    });
    return clone;
}
/**
 * Deeply copy the values of the original, as well as any custom properties.
 */
function copySetStrict(set, state) {
    return copyOwnPropertiesStrict(set, copySetLoose(set, state), state);
}

var isArray = Array.isArray;
var assign = Object.assign;
var getPrototypeOf = Object.getPrototypeOf || (function (obj) { return obj.__proto__; });
var DEFAULT_LOOSE_OPTIONS = {
    array: copyArrayLoose,
    arrayBuffer: copyArrayBuffer,
    blob: copyBlob,
    dataView: copyDataView,
    date: copyDate,
    error: copySelf,
    map: copyMapLoose,
    object: copyObjectLoose,
    regExp: copyRegExp,
    set: copySetLoose,
};
var DEFAULT_STRICT_OPTIONS = assign({}, DEFAULT_LOOSE_OPTIONS, {
    array: copyArrayStrict,
    map: copyMapStrict,
    object: copyObjectStrict,
    set: copySetStrict,
});
/**
 * Get the copiers used for each specific object tag.
 */
function getTagSpecificCopiers(options) {
    return {
        Arguments: options.object,
        Array: options.array,
        ArrayBuffer: options.arrayBuffer,
        Blob: options.blob,
        Boolean: copyPrimitiveWrapper,
        DataView: options.dataView,
        Date: options.date,
        Error: options.error,
        Float32Array: options.arrayBuffer,
        Float64Array: options.arrayBuffer,
        Int8Array: options.arrayBuffer,
        Int16Array: options.arrayBuffer,
        Int32Array: options.arrayBuffer,
        Map: options.map,
        Number: copyPrimitiveWrapper,
        Object: options.object,
        Promise: copySelf,
        RegExp: options.regExp,
        Set: options.set,
        String: copyPrimitiveWrapper,
        WeakMap: copySelf,
        WeakSet: copySelf,
        Uint8Array: options.arrayBuffer,
        Uint8ClampedArray: options.arrayBuffer,
        Uint16Array: options.arrayBuffer,
        Uint32Array: options.arrayBuffer,
        Uint64Array: options.arrayBuffer,
    };
}
/**
 * Create a custom copier based on the object-specific copy methods passed.
 */
function createCopier(options) {
    var normalizedOptions = assign({}, DEFAULT_LOOSE_OPTIONS, options);
    var tagSpecificCopiers = getTagSpecificCopiers(normalizedOptions);
    var array = tagSpecificCopiers.Array, object = tagSpecificCopiers.Object;
    function copier(value, state) {
        state.prototype = state.Constructor = undefined;
        if (!value || typeof value !== 'object') {
            return value;
        }
        if (state.cache.has(value)) {
            return state.cache.get(value);
        }
        state.prototype = getPrototypeOf(value);
        state.Constructor = state.prototype && state.prototype.constructor;
        // plain objects
        if (!state.Constructor || state.Constructor === Object) {
            return object(value, state);
        }
        // arrays
        if (isArray(value)) {
            return array(value, state);
        }
        var tagSpecificCopier = tagSpecificCopiers[getTag(value)];
        if (tagSpecificCopier) {
            return tagSpecificCopier(value, state);
        }
        return typeof value.then === 'function' ? value : object(value, state);
    }
    return function copy(value) {
        return copier(value, {
            Constructor: undefined,
            cache: createCache(),
            copier: copier,
            prototype: undefined,
        });
    };
}
/**
 * Create a custom copier based on the object-specific copy methods passed, defaulting to the
 * same internals as `copyStrict`.
 */
function createStrictCopier(options) {
    return createCopier(assign({}, DEFAULT_STRICT_OPTIONS, options));
}
/**
 * Copy an value deeply as much as possible, where strict recreation of object properties
 * are maintained. All properties (including non-enumerable ones) are copied with their
 * original property descriptors on both objects and arrays.
 */
var copyStrict = createStrictCopier({});
/**
 * Copy an value deeply as much as possible.
 */
var index = createCopier({});

exports.copyStrict = copyStrict;
exports.createCopier = createCopier;
exports.createStrictCopier = createStrictCopier;
exports["default"] = index;
//# sourceMappingURL=index.cjs.map


/***/ }),

/***/ 2398:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


const metadata = Symbol.for('pino.metadata')
const split = __webpack_require__(4615)
const { Duplex } = __webpack_require__(2203)
const { parentPort, workerData } = __webpack_require__(8167)

function createDeferred () {
  let resolve
  let reject
  const promise = new Promise((_resolve, _reject) => {
    resolve = _resolve
    reject = _reject
  })
  promise.resolve = resolve
  promise.reject = reject
  return promise
}

module.exports = function build (fn, opts = {}) {
  const waitForConfig = opts.expectPinoConfig === true && workerData?.workerData?.pinoWillSendConfig === true
  const parseLines = opts.parse === 'lines'
  const parseLine = typeof opts.parseLine === 'function' ? opts.parseLine : JSON.parse
  const close = opts.close || defaultClose
  const stream = split(function (line) {
    let value

    try {
      value = parseLine(line)
    } catch (error) {
      this.emit('unknown', line, error)
      return
    }

    if (value === null) {
      this.emit('unknown', line, 'Null value ignored')
      return
    }

    if (typeof value !== 'object') {
      value = {
        data: value,
        time: Date.now()
      }
    }

    if (stream[metadata]) {
      stream.lastTime = value.time
      stream.lastLevel = value.level
      stream.lastObj = value
    }

    if (parseLines) {
      return line
    }

    return value
  }, { autoDestroy: true })

  stream._destroy = function (err, cb) {
    const promise = close(err, cb)
    if (promise && typeof promise.then === 'function') {
      promise.then(cb, cb)
    }
  }

  if (opts.expectPinoConfig === true && workerData?.workerData?.pinoWillSendConfig !== true) {
    setImmediate(() => {
      stream.emit('error', new Error('This transport is not compatible with the current version of pino. Please upgrade pino to the latest version.'))
    })
  }

  if (opts.metadata !== false) {
    stream[metadata] = true
    stream.lastTime = 0
    stream.lastLevel = 0
    stream.lastObj = null
  }

  if (waitForConfig) {
    let pinoConfig = {}
    const configReceived = createDeferred()
    parentPort.on('message', function handleMessage (message) {
      if (message.code === 'PINO_CONFIG') {
        pinoConfig = message.config
        configReceived.resolve()
        parentPort.off('message', handleMessage)
      }
    })

    Object.defineProperties(stream, {
      levels: {
        get () { return pinoConfig.levels }
      },
      messageKey: {
        get () { return pinoConfig.messageKey }
      },
      errorKey: {
        get () { return pinoConfig.errorKey }
      }
    })

    return configReceived.then(finish)
  }

  return finish()

  function finish () {
    let res = fn(stream)

    if (res && typeof res.catch === 'function') {
      res.catch((err) => {
        stream.destroy(err)
      })

      // set it to null to not retain a reference to the promise
      res = null
    } else if (opts.enablePipelining && res) {
      return Duplex.from({ writable: stream, readable: res })
    }

    return stream
  }
}

function defaultClose (err, cb) {
  process.nextTick(cb, err)
}


/***/ }),

/***/ 2438:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


module.exports = prettifyTime

const formatTime = __webpack_require__(1584)

/**
 * @typedef {object} PrettifyTimeParams
 * @property {object} log The log object with the timestamp to be prettified.
 * @property {PrettyContext} context The context object built from parsing
 * the options.
 */

/**
 * Prettifies a timestamp if the given `log` has either `time`, `timestamp` or custom specified timestamp
 * property.
 *
 * @param {PrettifyTimeParams} input
 *
 * @returns {undefined|string} If a timestamp property cannot be found then
 * `undefined` is returned. Otherwise, the prettified time is returned as a
 * string.
 */
function prettifyTime ({ log, context }) {
  const {
    timestampKey,
    translateTime: translateFormat
  } = context
  const prettifier = context.customPrettifiers?.time
  let time = null

  if (timestampKey in log) {
    time = log[timestampKey]
  } else if ('timestamp' in log) {
    time = log.timestamp
  }

  if (time === null) return undefined
  const output = translateFormat ? formatTime(time, translateFormat) : time

  return prettifier ? prettifier(output) : `[${output}]`
}


/***/ }),

/***/ 2531:
/***/ ((module) => {

"use strict";


module.exports = isObject

function isObject (input) {
  return Object.prototype.toString.apply(input) === '[object Object]'
}


/***/ }),

/***/ 2553:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


module.exports = deleteLogProperty

const getPropertyValue = __webpack_require__(6901)
const splitPropertyKey = __webpack_require__(4655)

/**
 * Deletes a specified property from a log object if it exists.
 * This function mutates the passed in `log` object.
 *
 * @param {object} log The log object to be modified.
 * @param {string} property A string identifying the property to be deleted from
 * the log object. Accepts nested properties delimited by a `.`
 * Delimiter can be escaped to preserve property names that contain the delimiter.
 * e.g. `'prop1.prop2'` or `'prop2\.domain\.corp.prop2'`
 */
function deleteLogProperty (log, property) {
  const props = splitPropertyKey(property)
  const propToDelete = props.pop()

  log = getPropertyValue(log, props)

  /* istanbul ignore else */
  if (log !== null && typeof log === 'object' && Object.prototype.hasOwnProperty.call(log, propToDelete)) {
    delete log[propToDelete]
  }
}


/***/ }),

/***/ 2699:
/***/ ((module) => {

"use strict";


const hasBuffer = typeof Buffer !== 'undefined'
const suspectProtoRx = /"(?:_|\\u005[Ff])(?:_|\\u005[Ff])(?:p|\\u0070)(?:r|\\u0072)(?:o|\\u006[Ff])(?:t|\\u0074)(?:o|\\u006[Ff])(?:_|\\u005[Ff])(?:_|\\u005[Ff])"\s*:/
const suspectConstructorRx = /"(?:c|\\u0063)(?:o|\\u006[Ff])(?:n|\\u006[Ee])(?:s|\\u0073)(?:t|\\u0074)(?:r|\\u0072)(?:u|\\u0075)(?:c|\\u0063)(?:t|\\u0074)(?:o|\\u006[Ff])(?:r|\\u0072)"\s*:/

function _parse (text, reviver, options) {
  // Normalize arguments
  if (options == null) {
    if (reviver !== null && typeof reviver === 'object') {
      options = reviver
      reviver = undefined
    }
  }

  if (hasBuffer && Buffer.isBuffer(text)) {
    text = text.toString()
  }

  // BOM checker
  if (text && text.charCodeAt(0) === 0xFEFF) {
    text = text.slice(1)
  }

  // Parse normally, allowing exceptions
  const obj = JSON.parse(text, reviver)

  // Ignore null and non-objects
  if (obj === null || typeof obj !== 'object') {
    return obj
  }

  const protoAction = (options && options.protoAction) || 'error'
  const constructorAction = (options && options.constructorAction) || 'error'

  // options: 'error' (default) / 'remove' / 'ignore'
  if (protoAction === 'ignore' && constructorAction === 'ignore') {
    return obj
  }

  if (protoAction !== 'ignore' && constructorAction !== 'ignore') {
    if (suspectProtoRx.test(text) === false && suspectConstructorRx.test(text) === false) {
      return obj
    }
  } else if (protoAction !== 'ignore' && constructorAction === 'ignore') {
    if (suspectProtoRx.test(text) === false) {
      return obj
    }
  } else {
    if (suspectConstructorRx.test(text) === false) {
      return obj
    }
  }

  // Scan result for proto keys
  return filter(obj, { protoAction, constructorAction, safe: options && options.safe })
}

function filter (obj, { protoAction = 'error', constructorAction = 'error', safe } = {}) {
  let next = [obj]

  while (next.length) {
    const nodes = next
    next = []

    for (const node of nodes) {
      if (protoAction !== 'ignore' && Object.prototype.hasOwnProperty.call(node, '__proto__')) { // Avoid calling node.hasOwnProperty directly
        if (safe === true) {
          return null
        } else if (protoAction === 'error') {
          throw new SyntaxError('Object contains forbidden prototype property')
        }

        delete node.__proto__ // eslint-disable-line no-proto
      }

      if (constructorAction !== 'ignore' &&
          Object.prototype.hasOwnProperty.call(node, 'constructor') &&
          Object.prototype.hasOwnProperty.call(node.constructor, 'prototype')) { // Avoid calling node.hasOwnProperty directly
        if (safe === true) {
          return null
        } else if (constructorAction === 'error') {
          throw new SyntaxError('Object contains forbidden prototype property')
        }

        delete node.constructor
      }

      for (const key in node) {
        const value = node[key]
        if (value && typeof value === 'object') {
          next.push(value)
        }
      }
    }
  }
  return obj
}

function parse (text, reviver, options) {
  const stackTraceLimit = Error.stackTraceLimit
  Error.stackTraceLimit = 0
  try {
    return _parse(text, reviver, options)
  } finally {
    Error.stackTraceLimit = stackTraceLimit
  }
}

function safeParse (text, reviver) {
  const stackTraceLimit = Error.stackTraceLimit
  Error.stackTraceLimit = 0
  try {
    return _parse(text, reviver, { safe: true })
  } catch (_e) {
    return null
  } finally {
    Error.stackTraceLimit = stackTraceLimit
  }
}

module.exports = parse
module.exports["default"] = parse
module.exports.parse = parse
module.exports.safeParse = safeParse
module.exports.scan = filter


/***/ }),

/***/ 2944:
/***/ ((module) => {

"use strict";


module.exports = handleCustomLevelsOpts

/**
 * Parse a CSV string or options object that specifies
 * configuration for custom levels.
 *
 * @param {string|object} cLevels An object mapping level
 * names to values, e.g. `{ info: 30, debug: 65 }`, or a
 * CSV string in the format `level_name:level_value`, e.g.
 * `info:30,debug:65`.
 *
 * @returns {object} An object mapping levels to labels that
 * appear in logs, e.g. `{ '30': 'INFO', '65': 'DEBUG' }`.
 */
function handleCustomLevelsOpts (cLevels) {
  if (!cLevels) return {}

  if (typeof cLevels === 'string') {
    return cLevels
      .split(',')
      .reduce((agg, value, idx) => {
        const [levelName, levelNum = idx] = value.split(':')
        agg[levelNum] = levelName.toUpperCase()
        return agg
      },
      { default: 'USERLVL' })
  } else if (Object.prototype.toString.call(cLevels) === '[object Object]') {
    return Object
      .keys(cLevels)
      .reduce((agg, levelName) => {
        agg[cLevels[levelName]] = levelName.toUpperCase()
        return agg
      }, { default: 'USERLVL' })
  } else {
    return {}
  }
}


/***/ }),

/***/ 2993:
/***/ ((module) => {

"use strict";


module.exports = isValidDate

/**
 * Checks if the argument is a JS Date and not 'Invalid Date'.
 *
 * @param {Date} date The date to check.
 *
 * @returns {boolean} true if the argument is a JS Date and not 'Invalid Date'.
 */
function isValidDate (date) {
  return date instanceof Date && !Number.isNaN(date.getTime())
}


/***/ }),

/***/ 3140:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


module.exports = getLevelLabelData
const { LEVELS, LEVEL_NAMES } = __webpack_require__(4160)

/**
 * Given initial settings for custom levels/names and use of only custom props
 * get the level label that corresponds with a given level number
 *
 * @param {boolean} useOnlyCustomProps
 * @param {object} customLevels
 * @param {object} customLevelNames
 *
 * @returns {function} A function that takes a number level and returns the level's label string
 */
function getLevelLabelData (useOnlyCustomProps, customLevels, customLevelNames) {
  const levels = useOnlyCustomProps ? customLevels || LEVELS : Object.assign({}, LEVELS, customLevels)
  const levelNames = useOnlyCustomProps ? customLevelNames || LEVEL_NAMES : Object.assign({}, LEVEL_NAMES, customLevelNames)
  return function (level) {
    let levelNum = 'default'
    if (Number.isInteger(+level)) {
      levelNum = Object.prototype.hasOwnProperty.call(levels, level) ? level : levelNum
    } else {
      levelNum = Object.prototype.hasOwnProperty.call(levelNames, level.toLowerCase()) ? levelNames[level.toLowerCase()] : levelNum
    }

    return [levels[levelNum], levelNum]
  }
}


/***/ }),

/***/ 3519:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var wrappy = __webpack_require__(6587)
module.exports = wrappy(once)
module.exports.strict = wrappy(onceStrict)

once.proto = once(function () {
  Object.defineProperty(Function.prototype, 'once', {
    value: function () {
      return once(this)
    },
    configurable: true
  })

  Object.defineProperty(Function.prototype, 'onceStrict', {
    value: function () {
      return onceStrict(this)
    },
    configurable: true
  })
})

function once (fn) {
  var f = function () {
    if (f.called) return f.value
    f.called = true
    return f.value = fn.apply(this, arguments)
  }
  f.called = false
  return f
}

function onceStrict (fn) {
  var f = function () {
    if (f.called)
      throw new Error(f.onceError)
    f.called = true
    return f.value = fn.apply(this, arguments)
  }
  var name = fn.name || 'Function wrapped with `once`'
  f.onceError = name + " shouldn't be called more than once"
  f.called = false
  return f
}


/***/ }),

/***/ 3733:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


module.exports = prettifyLevel

const getPropertyValue = __webpack_require__(6901)

/**
 * @typedef {object} PrettifyLevelParams
 * @property {object} log The log object.
 * @property {PrettyContext} context The context object built from parsing
 * the options.
 */

/**
 * Checks if the passed in log has a `level` value and returns a prettified
 * string for that level if so.
 *
 * @param {PrettifyLevelParams} input
 *
 * @returns {undefined|string} If `log` does not have a `level` property then
 * `undefined` will be returned. Otherwise, a string from the specified
 * `colorizer` is returned.
 */
function prettifyLevel ({ log, context }) {
  const {
    colorizer,
    customLevels,
    customLevelNames,
    levelKey,
    getLevelLabelData
  } = context
  const prettifier = context.customPrettifiers?.level
  const output = getPropertyValue(log, levelKey)
  if (output === undefined) return undefined
  const labelColorized = colorizer(output, { customLevels, customLevelNames })
  if (prettifier) {
    const [label] = getLevelLabelData(output)
    return prettifier(output, levelKey, log, { label, labelColorized, colors: colorizer.colors })
  }
  return labelColorized
}


/***/ }),

/***/ 4075:
/***/ ((module, exports, __webpack_require__) => {

"use strict";
var __WEBPACK_AMD_DEFINE_RESULT__;function _typeof(obj){"@babel/helpers - typeof";if(typeof Symbol==="function"&&typeof Symbol.iterator==="symbol"){_typeof=function _typeof(obj){return typeof obj}}else{_typeof=function _typeof(obj){return obj&&typeof Symbol==="function"&&obj.constructor===Symbol&&obj!==Symbol.prototype?"symbol":typeof obj}}return _typeof(obj)}(function(global){var _arguments=arguments;var dateFormat=function(){var token=/d{1,4}|D{3,4}|m{1,4}|yy(?:yy)?|([HhMsTt])\1?|W{1,2}|[LlopSZN]|"[^"]*"|'[^']*'/g;var timezone=/\b(?:[PMCEA][SDP]T|(?:Pacific|Mountain|Central|Eastern|Atlantic) (?:Standard|Daylight|Prevailing) Time|(?:GMT|UTC)(?:[-+]\d{4})?)\b/g;var timezoneClip=/[^-+\dA-Z]/g;return function(date,mask,utc,gmt){if(_arguments.length===1&&kindOf(date)==="string"&&!/\d/.test(date)){mask=date;date=undefined}date=date||date===0?date:new Date;if(!(date instanceof Date)){date=new Date(date)}if(isNaN(date)){throw TypeError("Invalid date")}mask=String(dateFormat.masks[mask]||mask||dateFormat.masks["default"]);var maskSlice=mask.slice(0,4);if(maskSlice==="UTC:"||maskSlice==="GMT:"){mask=mask.slice(4);utc=true;if(maskSlice==="GMT:"){gmt=true}}var _=function _(){return utc?"getUTC":"get"};var _d=function d(){return date[_()+"Date"]()};var D=function D(){return date[_()+"Day"]()};var _m=function m(){return date[_()+"Month"]()};var y=function y(){return date[_()+"FullYear"]()};var _H=function H(){return date[_()+"Hours"]()};var _M=function M(){return date[_()+"Minutes"]()};var _s=function s(){return date[_()+"Seconds"]()};var _L=function L(){return date[_()+"Milliseconds"]()};var _o=function o(){return utc?0:date.getTimezoneOffset()};var _W=function W(){return getWeek(date)};var _N=function N(){return getDayOfWeek(date)};var flags={d:function d(){return _d()},dd:function dd(){return pad(_d())},ddd:function ddd(){return dateFormat.i18n.dayNames[D()]},DDD:function DDD(){return getDayName({y:y(),m:_m(),d:_d(),_:_(),dayName:dateFormat.i18n.dayNames[D()],short:true})},dddd:function dddd(){return dateFormat.i18n.dayNames[D()+7]},DDDD:function DDDD(){return getDayName({y:y(),m:_m(),d:_d(),_:_(),dayName:dateFormat.i18n.dayNames[D()+7]})},m:function m(){return _m()+1},mm:function mm(){return pad(_m()+1)},mmm:function mmm(){return dateFormat.i18n.monthNames[_m()]},mmmm:function mmmm(){return dateFormat.i18n.monthNames[_m()+12]},yy:function yy(){return String(y()).slice(2)},yyyy:function yyyy(){return pad(y(),4)},h:function h(){return _H()%12||12},hh:function hh(){return pad(_H()%12||12)},H:function H(){return _H()},HH:function HH(){return pad(_H())},M:function M(){return _M()},MM:function MM(){return pad(_M())},s:function s(){return _s()},ss:function ss(){return pad(_s())},l:function l(){return pad(_L(),3)},L:function L(){return pad(Math.floor(_L()/10))},t:function t(){return _H()<12?dateFormat.i18n.timeNames[0]:dateFormat.i18n.timeNames[1]},tt:function tt(){return _H()<12?dateFormat.i18n.timeNames[2]:dateFormat.i18n.timeNames[3]},T:function T(){return _H()<12?dateFormat.i18n.timeNames[4]:dateFormat.i18n.timeNames[5]},TT:function TT(){return _H()<12?dateFormat.i18n.timeNames[6]:dateFormat.i18n.timeNames[7]},Z:function Z(){return gmt?"GMT":utc?"UTC":(String(date).match(timezone)||[""]).pop().replace(timezoneClip,"").replace(/GMT\+0000/g,"UTC")},o:function o(){return(_o()>0?"-":"+")+pad(Math.floor(Math.abs(_o())/60)*100+Math.abs(_o())%60,4)},p:function p(){return(_o()>0?"-":"+")+pad(Math.floor(Math.abs(_o())/60),2)+":"+pad(Math.floor(Math.abs(_o())%60),2)},S:function S(){return["th","st","nd","rd"][_d()%10>3?0:(_d()%100-_d()%10!=10)*_d()%10]},W:function W(){return _W()},WW:function WW(){return pad(_W())},N:function N(){return _N()}};return mask.replace(token,function(match){if(match in flags){return flags[match]()}return match.slice(1,match.length-1)})}}();dateFormat.masks={default:"ddd mmm dd yyyy HH:MM:ss",shortDate:"m/d/yy",paddedShortDate:"mm/dd/yyyy",mediumDate:"mmm d, yyyy",longDate:"mmmm d, yyyy",fullDate:"dddd, mmmm d, yyyy",shortTime:"h:MM TT",mediumTime:"h:MM:ss TT",longTime:"h:MM:ss TT Z",isoDate:"yyyy-mm-dd",isoTime:"HH:MM:ss",isoDateTime:"yyyy-mm-dd'T'HH:MM:sso",isoUtcDateTime:"UTC:yyyy-mm-dd'T'HH:MM:ss'Z'",expiresHeaderFormat:"ddd, dd mmm yyyy HH:MM:ss Z"};dateFormat.i18n={dayNames:["Sun","Mon","Tue","Wed","Thu","Fri","Sat","Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"],monthNames:["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec","January","February","March","April","May","June","July","August","September","October","November","December"],timeNames:["a","p","am","pm","A","P","AM","PM"]};var pad=function pad(val,len){val=String(val);len=len||2;while(val.length<len){val="0"+val}return val};var getDayName=function getDayName(_ref){var y=_ref.y,m=_ref.m,d=_ref.d,_=_ref._,dayName=_ref.dayName,_ref$short=_ref["short"],_short=_ref$short===void 0?false:_ref$short;var today=new Date;var yesterday=new Date;yesterday.setDate(yesterday[_+"Date"]()-1);var tomorrow=new Date;tomorrow.setDate(tomorrow[_+"Date"]()+1);var today_d=function today_d(){return today[_+"Date"]()};var today_m=function today_m(){return today[_+"Month"]()};var today_y=function today_y(){return today[_+"FullYear"]()};var yesterday_d=function yesterday_d(){return yesterday[_+"Date"]()};var yesterday_m=function yesterday_m(){return yesterday[_+"Month"]()};var yesterday_y=function yesterday_y(){return yesterday[_+"FullYear"]()};var tomorrow_d=function tomorrow_d(){return tomorrow[_+"Date"]()};var tomorrow_m=function tomorrow_m(){return tomorrow[_+"Month"]()};var tomorrow_y=function tomorrow_y(){return tomorrow[_+"FullYear"]()};if(today_y()===y&&today_m()===m&&today_d()===d){return _short?"Tdy":"Today"}else if(yesterday_y()===y&&yesterday_m()===m&&yesterday_d()===d){return _short?"Ysd":"Yesterday"}else if(tomorrow_y()===y&&tomorrow_m()===m&&tomorrow_d()===d){return _short?"Tmw":"Tomorrow"}return dayName};var getWeek=function getWeek(date){var targetThursday=new Date(date.getFullYear(),date.getMonth(),date.getDate());targetThursday.setDate(targetThursday.getDate()-(targetThursday.getDay()+6)%7+3);var firstThursday=new Date(targetThursday.getFullYear(),0,4);firstThursday.setDate(firstThursday.getDate()-(firstThursday.getDay()+6)%7+3);var ds=targetThursday.getTimezoneOffset()-firstThursday.getTimezoneOffset();targetThursday.setHours(targetThursday.getHours()-ds);var weekDiff=(targetThursday-firstThursday)/(864e5*7);return 1+Math.floor(weekDiff)};var getDayOfWeek=function getDayOfWeek(date){var dow=date.getDay();if(dow===0){dow=7}return dow};var kindOf=function kindOf(val){if(val===null){return"null"}if(val===undefined){return"undefined"}if(_typeof(val)!=="object"){return _typeof(val)}if(Array.isArray(val)){return"array"}return{}.toString.call(val).slice(8,-1).toLowerCase()};if(true){!(__WEBPACK_AMD_DEFINE_RESULT__ = (function(){return dateFormat}).call(exports, __webpack_require__, exports, module),
		__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__))}else // removed by dead control flow
{}})(void 0);

/***/ }),

/***/ 4160:
/***/ ((module) => {

"use strict";


/**
 * A set of property names that indicate the value represents an error object.
 *
 * @typedef {string[]} K_ERROR_LIKE_KEYS
 */

module.exports = {
  DATE_FORMAT: 'yyyy-mm-dd HH:MM:ss.l o',
  DATE_FORMAT_SIMPLE: 'HH:MM:ss.l',

  /**
   * @type {K_ERROR_LIKE_KEYS}
   */
  ERROR_LIKE_KEYS: ['err', 'error'],

  MESSAGE_KEY: 'msg',

  LEVEL_KEY: 'level',

  LEVEL_LABEL: 'levelLabel',

  TIMESTAMP_KEY: 'time',

  LEVELS: {
    default: 'USERLVL',
    60: 'FATAL',
    50: 'ERROR',
    40: 'WARN',
    30: 'INFO',
    20: 'DEBUG',
    10: 'TRACE'
  },

  LEVEL_NAMES: {
    fatal: 60,
    error: 50,
    warn: 40,
    info: 30,
    debug: 20,
    trace: 10
  },

  // Object keys that probably came from a logger like Pino or Bunyan.
  LOGGER_KEYS: [
    'pid',
    'hostname',
    'name',
    'level',
    'time',
    'timestamp',
    'caller'
  ]
}


/***/ }),

/***/ 4615:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";
/*
Copyright (c) 2014-2021, Matteo Collina <hello@matteocollina.com>

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted, provided that the above
copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR
IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
*/



const { Transform } = __webpack_require__(2203)
const { StringDecoder } = __webpack_require__(3193)
const kLast = Symbol('last')
const kDecoder = Symbol('decoder')

function transform (chunk, enc, cb) {
  let list
  if (this.overflow) { // Line buffer is full. Skip to start of next line.
    const buf = this[kDecoder].write(chunk)
    list = buf.split(this.matcher)

    if (list.length === 1) return cb() // Line ending not found. Discard entire chunk.

    // Line ending found. Discard trailing fragment of previous line and reset overflow state.
    list.shift()
    this.overflow = false
  } else {
    this[kLast] += this[kDecoder].write(chunk)
    list = this[kLast].split(this.matcher)
  }

  this[kLast] = list.pop()

  for (let i = 0; i < list.length; i++) {
    try {
      push(this, this.mapper(list[i]))
    } catch (error) {
      return cb(error)
    }
  }

  this.overflow = this[kLast].length > this.maxLength
  if (this.overflow && !this.skipOverflow) {
    cb(new Error('maximum buffer reached'))
    return
  }

  cb()
}

function flush (cb) {
  // forward any gibberish left in there
  this[kLast] += this[kDecoder].end()

  if (this[kLast]) {
    try {
      push(this, this.mapper(this[kLast]))
    } catch (error) {
      return cb(error)
    }
  }

  cb()
}

function push (self, val) {
  if (val !== undefined) {
    self.push(val)
  }
}

function noop (incoming) {
  return incoming
}

function split (matcher, mapper, options) {
  // Set defaults for any arguments not supplied.
  matcher = matcher || /\r?\n/
  mapper = mapper || noop
  options = options || {}

  // Test arguments explicitly.
  switch (arguments.length) {
    case 1:
      // If mapper is only argument.
      if (typeof matcher === 'function') {
        mapper = matcher
        matcher = /\r?\n/
      // If options is only argument.
      } else if (typeof matcher === 'object' && !(matcher instanceof RegExp) && !matcher[Symbol.split]) {
        options = matcher
        matcher = /\r?\n/
      }
      break

    case 2:
      // If mapper and options are arguments.
      if (typeof matcher === 'function') {
        options = mapper
        mapper = matcher
        matcher = /\r?\n/
      // If matcher and options are arguments.
      } else if (typeof mapper === 'object') {
        options = mapper
        mapper = noop
      }
  }

  options = Object.assign({}, options)
  options.autoDestroy = true
  options.transform = transform
  options.flush = flush
  options.readableObjectMode = true

  const stream = new Transform(options)

  stream[kLast] = ''
  stream[kDecoder] = new StringDecoder('utf8')
  stream.matcher = matcher
  stream.mapper = mapper
  stream.maxLength = options.maxLength
  stream.skipOverflow = options.skipOverflow || false
  stream.overflow = false
  stream._destroy = function (err, cb) {
    // Weird Node v12 bug that we need to work around
    this._writableState.errorEmitted = false
    cb(err)
  }

  return stream
}

module.exports = split


/***/ }),

/***/ 4655:
/***/ ((module) => {

"use strict";


module.exports = splitPropertyKey

/**
 * Splits the property key delimited by a dot character but not when it is preceded
 * by a backslash.
 *
 * @param {string} key A string identifying the property.
 *
 * @returns {string[]} Returns a list of string containing each delimited property.
 * e.g. `'prop2\.domain\.corp.prop2'` should return [ 'prop2.domain.com', 'prop2' ]
 */
function splitPropertyKey (key) {
  const result = []
  let backslash = false
  let segment = ''

  for (let i = 0; i < key.length; i++) {
    const c = key.charAt(i)

    if (c === '\\') {
      backslash = true
      continue
    }

    if (backslash) {
      backslash = false
      segment += c
      continue
    }

    /* Non-escaped dot, push to result */
    if (c === '.') {
      result.push(segment)
      segment = ''
      continue
    }

    segment += c
  }

  /* Push last entry to result */
  if (segment.length) {
    result.push(segment)
  }

  return result
}


/***/ }),

/***/ 4683:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


module.exports = {
  buildSafeSonicBoom: __webpack_require__(5214),
  createDate: __webpack_require__(7492),
  deleteLogProperty: __webpack_require__(2553),
  filterLog: __webpack_require__(4890),
  formatTime: __webpack_require__(1584),
  getPropertyValue: __webpack_require__(6901),
  handleCustomLevelsNamesOpts: __webpack_require__(6635),
  handleCustomLevelsOpts: __webpack_require__(2944),
  interpretConditionals: __webpack_require__(954),
  isObject: __webpack_require__(2531),
  isValidDate: __webpack_require__(2993),
  joinLinesWithIndentation: __webpack_require__(7515),
  noop: __webpack_require__(6111),
  parseFactoryOptions: __webpack_require__(1600),
  prettifyErrorLog: __webpack_require__(5538),
  prettifyError: __webpack_require__(1381),
  prettifyLevel: __webpack_require__(3733),
  prettifyMessage: __webpack_require__(7848),
  prettifyMetadata: __webpack_require__(394),
  prettifyObject: __webpack_require__(8136),
  prettifyTime: __webpack_require__(2438),
  splitPropertyKey: __webpack_require__(4655),
  getLevelLabelData: __webpack_require__(3140)
}

// The remainder of this file consists of jsdoc blocks that are difficult to
// determine a more appropriate "home" for. As an example, the blocks associated
// with custom prettifiers could live in either the `prettify-level`,
// `prettify-metadata`, or `prettify-time` files since they are the primary
// files where such code is used. But we want a central place to define common
// doc blocks, so we are picking this file as the answer.

/**
 * A hash of log property names mapped to prettifier functions. When the
 * incoming log data is being processed for prettification, any key on the log
 * that matches a key in a custom prettifiers hash will be prettified using
 * that matching custom prettifier. The value passed to the custom prettifier
 * will the value associated with the corresponding log key.
 *
 * The hash may contain any arbitrary keys for arbitrary log properties, but it
 * may also contain a set of predefined key names that map to well-known log
 * properties. These keys are:
 *
 * + `time` (for the timestamp field)
 * + `level` (for the level label field; value may be a level number instead
 * of a level label)
 * + `hostname`
 * + `pid`
 * + `name`
 * + `caller`
 *
 * @typedef {Object.<string, CustomPrettifierFunc>} CustomPrettifiers
 */

/**
 * A synchronous function to be used for prettifying a log property. It must
 * return a string.
 *
 * @typedef {function} CustomPrettifierFunc
 * @param {any} value The value to be prettified for the key associated with
 * the prettifier.
 * @returns {string}
 */

/**
 * A tokenized string that indicates how the prettified log line should be
 * formatted. Tokens are either log properties enclosed in curly braces, e.g.
 * `{levelLabel}`, `{pid}`, or `{req.url}`, or conditional directives in curly
 * braces. The only conditional directives supported are `if` and `end`, e.g.
 * `{if pid}{pid}{end}`; every `if` must have a matching `end`. Nested
 * conditions are not supported.
 *
 * @typedef {string} MessageFormatString
 *
 * @example
 * `{levelLabel} - {if pid}{pid} - {end}url:{req.url}`
 */

/**
 * @typedef {object} PrettifyMessageExtras
 * @property {object} colors Available color functions based on `useColor` (or `colorize`) context
 * the options.
 */

/**
 * A function that accepts a log object, name of the message key, and name of
 * the level label key and returns a formatted log line.
 *
 * Note: this function must be synchronous.
 *
 * @typedef {function} MessageFormatFunction
 * @param {object} log The log object to be processed.
 * @param {string} messageKey The name of the key in the `log` object that
 * contains the log message.
 * @param {string} levelLabel The name of the key in the `log` object that
 * contains the log level name.
 * @param {PrettifyMessageExtras} extras Additional data available for message context
 * @returns {string}
 *
 * @example
 * function (log, messageKey, levelLabel) {
 *   return `${log[levelLabel]} - ${log[messageKey]}`
 * }
 */


/***/ }),

/***/ 4890:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


module.exports = filterLog

const { createCopier } = __webpack_require__(2319)
const fastCopy = createCopier({})

const deleteLogProperty = __webpack_require__(2553)

/**
 * @typedef {object} FilterLogParams
 * @property {object} log The log object to be modified.
 * @property {PrettyContext} context The context object built from parsing
 * the options.
 */

/**
 * Filter a log object by removing or including keys accordingly.
 * When `includeKeys` is passed, `ignoredKeys` will be ignored.
 * One of ignoreKeys or includeKeys must be pass in.
 *
 * @param {FilterLogParams} input
 *
 * @returns {object} A new `log` object instance that
 *  either only includes the keys in ignoreKeys
 *  or does not include those in ignoredKeys.
 */
function filterLog ({ log, context }) {
  const { ignoreKeys, includeKeys } = context
  const logCopy = fastCopy(log)

  if (includeKeys) {
    const logIncluded = {}

    includeKeys.forEach((key) => {
      logIncluded[key] = logCopy[key]
    })
    return logIncluded
  }

  ignoreKeys.forEach((ignoreKey) => {
    deleteLogProperty(logCopy, ignoreKey)
  })
  return logCopy
}


/***/ }),

/***/ 5214:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


module.exports = buildSafeSonicBoom

const { isMainThread } = __webpack_require__(8167)
const SonicBoom = __webpack_require__(5146)
const noop = __webpack_require__(6111)

/**
 * Creates a safe SonicBoom instance
 *
 * @param {object} opts Options for SonicBoom
 *
 * @returns {object} A new SonicBoom stream
 */
function buildSafeSonicBoom (opts) {
  const stream = new SonicBoom(opts)
  stream.on('error', filterBrokenPipe)
  // if we are sync: false, we must flush on exit
  // NODE_V8_COVERAGE must breaks everything
  // https://github.com/nodejs/node/issues/49344
  if (!process.env.NODE_V8_COVERAGE && !opts.sync && isMainThread) {
    setupOnExit(stream)
  }
  return stream

  function filterBrokenPipe (err) {
    if (err.code === 'EPIPE') {
      stream.write = noop
      stream.end = noop
      stream.flushSync = noop
      stream.destroy = noop
      return
    }
    stream.removeListener('error', filterBrokenPipe)
  }
}

function setupOnExit (stream) {
  /* istanbul ignore next */
  if (global.WeakRef && global.WeakMap && global.FinalizationRegistry) {
    // This is leak free, it does not leave event handlers
    const onExit = __webpack_require__(6270)

    onExit.register(stream, autoEnd)

    stream.on('close', function () {
      onExit.unregister(stream)
    })
  }
}

/* istanbul ignore next */
function autoEnd (stream, eventName) {
  // This check is needed only on some platforms

  if (stream.destroyed) {
    return
  }

  if (eventName === 'beforeExit') {
    // We still have an event loop, let's use it
    stream.flush()
    stream.on('drain', function () {
      stream.end()
    })
  } else {
    // We do not have an event loop, so flush synchronously
    stream.flushSync()
  }
}


/***/ }),

/***/ 5538:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


module.exports = prettifyErrorLog

const {
  LOGGER_KEYS
} = __webpack_require__(4160)

const isObject = __webpack_require__(2531)
const joinLinesWithIndentation = __webpack_require__(7515)
const prettifyObject = __webpack_require__(8136)

/**
 * @typedef {object} PrettifyErrorLogParams
 * @property {object} log The error log to prettify.
 * @property {PrettyContext} context The context object built from parsing
 * the options.
 */

/**
 * Given a log object that has a `type: 'Error'` key, prettify the object and
 * return the result. In other
 *
 * @param {PrettifyErrorLogParams} input
 *
 * @returns {string} A string that represents the prettified error log.
 */
function prettifyErrorLog ({ log, context }) {
  const {
    EOL: eol,
    IDENT: ident,
    errorProps: errorProperties,
    messageKey
  } = context
  const stack = log.stack
  const joinedLines = joinLinesWithIndentation({ input: stack, ident, eol })
  let result = `${ident}${joinedLines}${eol}`

  if (errorProperties.length > 0) {
    const excludeProperties = LOGGER_KEYS.concat(messageKey, 'type', 'stack')
    let propertiesToPrint
    if (errorProperties[0] === '*') {
      // Print all sibling properties except for the standard exclusions.
      propertiesToPrint = Object.keys(log).filter(k => excludeProperties.includes(k) === false)
    } else {
      // Print only specified properties unless the property is a standard exclusion.
      propertiesToPrint = errorProperties.filter(k => excludeProperties.includes(k) === false)
    }

    for (let i = 0; i < propertiesToPrint.length; i += 1) {
      const key = propertiesToPrint[i]
      if (key in log === false) continue
      if (isObject(log[key])) {
        // The nested object may have "logger" type keys but since they are not
        // at the root level of the object being processed, we want to print them.
        // Thus, we invoke with `excludeLoggerKeys: false`.
        const prettifiedObject = prettifyObject({
          log: log[key],
          excludeLoggerKeys: false,
          context: {
            ...context,
            IDENT: ident + ident
          }
        })
        result = `${result}${ident}${key}: {${eol}${prettifiedObject}${ident}}${eol}`
        continue
      }
      result = `${result}${ident}${key}: ${log[key]}${eol}`
    }
  }

  return result
}


/***/ }),

/***/ 5844:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";


Object.defineProperty(exports, "__esModule", ({ value: true }));

var tty = __webpack_require__(2018);

function _interopNamespace(e) {
  if (e && e.__esModule) return e;
  var n = Object.create(null);
  if (e) {
    Object.keys(e).forEach(function (k) {
      if (k !== 'default') {
        var d = Object.getOwnPropertyDescriptor(e, k);
        Object.defineProperty(n, k, d.get ? d : {
          enumerable: true,
          get: function () { return e[k]; }
        });
      }
    });
  }
  n["default"] = e;
  return Object.freeze(n);
}

var tty__namespace = /*#__PURE__*/_interopNamespace(tty);

const {
  env = {},
  argv = [],
  platform = "",
} = typeof process === "undefined" ? {} : process;

const isDisabled = "NO_COLOR" in env || argv.includes("--no-color");
const isForced = "FORCE_COLOR" in env || argv.includes("--color");
const isWindows = platform === "win32";
const isDumbTerminal = env.TERM === "dumb";

const isCompatibleTerminal =
  tty__namespace && tty__namespace.isatty && tty__namespace.isatty(1) && env.TERM && !isDumbTerminal;

const isCI =
  "CI" in env &&
  ("GITHUB_ACTIONS" in env || "GITLAB_CI" in env || "CIRCLECI" in env);

const isColorSupported =
  !isDisabled &&
  (isForced || (isWindows && !isDumbTerminal) || isCompatibleTerminal || isCI);

const replaceClose = (
  index,
  string,
  close,
  replace,
  head = string.substring(0, index) + replace,
  tail = string.substring(index + close.length),
  next = tail.indexOf(close)
) => head + (next < 0 ? tail : replaceClose(next, tail, close, replace));

const clearBleed = (index, string, open, close, replace) =>
  index < 0
    ? open + string + close
    : open + replaceClose(index, string, close, replace) + close;

const filterEmpty =
  (open, close, replace = open, at = open.length + 1) =>
  (string) =>
    string || !(string === "" || string === undefined)
      ? clearBleed(
          ("" + string).indexOf(close, at),
          string,
          open,
          close,
          replace
        )
      : "";

const init = (open, close, replace) =>
  filterEmpty(`\x1b[${open}m`, `\x1b[${close}m`, replace);

const colors = {
  reset: init(0, 0),
  bold: init(1, 22, "\x1b[22m\x1b[1m"),
  dim: init(2, 22, "\x1b[22m\x1b[2m"),
  italic: init(3, 23),
  underline: init(4, 24),
  inverse: init(7, 27),
  hidden: init(8, 28),
  strikethrough: init(9, 29),
  black: init(30, 39),
  red: init(31, 39),
  green: init(32, 39),
  yellow: init(33, 39),
  blue: init(34, 39),
  magenta: init(35, 39),
  cyan: init(36, 39),
  white: init(37, 39),
  gray: init(90, 39),
  bgBlack: init(40, 49),
  bgRed: init(41, 49),
  bgGreen: init(42, 49),
  bgYellow: init(43, 49),
  bgBlue: init(44, 49),
  bgMagenta: init(45, 49),
  bgCyan: init(46, 49),
  bgWhite: init(47, 49),
  blackBright: init(90, 39),
  redBright: init(91, 39),
  greenBright: init(92, 39),
  yellowBright: init(93, 39),
  blueBright: init(94, 39),
  magentaBright: init(95, 39),
  cyanBright: init(96, 39),
  whiteBright: init(97, 39),
  bgBlackBright: init(100, 49),
  bgRedBright: init(101, 49),
  bgGreenBright: init(102, 49),
  bgYellowBright: init(103, 49),
  bgBlueBright: init(104, 49),
  bgMagentaBright: init(105, 49),
  bgCyanBright: init(106, 49),
  bgWhiteBright: init(107, 49),
};

const createColors = ({ useColor = isColorSupported } = {}) =>
  useColor
    ? colors
    : Object.keys(colors).reduce(
        (colors, key) => ({ ...colors, [key]: String }),
        {}
      );

const {
  reset,
  bold,
  dim,
  italic,
  underline,
  inverse,
  hidden,
  strikethrough,
  black,
  red,
  green,
  yellow,
  blue,
  magenta,
  cyan,
  white,
  gray,
  bgBlack,
  bgRed,
  bgGreen,
  bgYellow,
  bgBlue,
  bgMagenta,
  bgCyan,
  bgWhite,
  blackBright,
  redBright,
  greenBright,
  yellowBright,
  blueBright,
  magentaBright,
  cyanBright,
  whiteBright,
  bgBlackBright,
  bgRedBright,
  bgGreenBright,
  bgYellowBright,
  bgBlueBright,
  bgMagentaBright,
  bgCyanBright,
  bgWhiteBright,
} = createColors();

exports.bgBlack = bgBlack;
exports.bgBlackBright = bgBlackBright;
exports.bgBlue = bgBlue;
exports.bgBlueBright = bgBlueBright;
exports.bgCyan = bgCyan;
exports.bgCyanBright = bgCyanBright;
exports.bgGreen = bgGreen;
exports.bgGreenBright = bgGreenBright;
exports.bgMagenta = bgMagenta;
exports.bgMagentaBright = bgMagentaBright;
exports.bgRed = bgRed;
exports.bgRedBright = bgRedBright;
exports.bgWhite = bgWhite;
exports.bgWhiteBright = bgWhiteBright;
exports.bgYellow = bgYellow;
exports.bgYellowBright = bgYellowBright;
exports.black = black;
exports.blackBright = blackBright;
exports.blue = blue;
exports.blueBright = blueBright;
exports.bold = bold;
exports.createColors = createColors;
exports.cyan = cyan;
exports.cyanBright = cyanBright;
exports.dim = dim;
exports.gray = gray;
exports.green = green;
exports.greenBright = greenBright;
exports.hidden = hidden;
exports.inverse = inverse;
exports.isColorSupported = isColorSupported;
exports.italic = italic;
exports.magenta = magenta;
exports.magentaBright = magentaBright;
exports.red = red;
exports.redBright = redBright;
exports.reset = reset;
exports.strikethrough = strikethrough;
exports.underline = underline;
exports.white = white;
exports.whiteBright = whiteBright;
exports.yellow = yellow;
exports.yellowBright = yellowBright;


/***/ }),

/***/ 6111:
/***/ ((module) => {

"use strict";


module.exports = function noop () {}


/***/ }),

/***/ 6587:
/***/ ((module) => {

// Returns a wrapper function that returns a wrapped callback
// The wrapper function should do some stuff, and return a
// presumably different callback function.
// This makes sure that own properties are retained, so that
// decorations and such are not lost along the way.
module.exports = wrappy
function wrappy (fn, cb) {
  if (fn && cb) return wrappy(fn)(cb)

  if (typeof fn !== 'function')
    throw new TypeError('need wrapper function')

  Object.keys(fn).forEach(function (k) {
    wrapper[k] = fn[k]
  })

  return wrapper

  function wrapper() {
    var args = new Array(arguments.length)
    for (var i = 0; i < args.length; i++) {
      args[i] = arguments[i]
    }
    var ret = fn.apply(this, args)
    var cb = args[args.length-1]
    if (typeof ret === 'function' && ret !== cb) {
      Object.keys(cb).forEach(function (k) {
        ret[k] = cb[k]
      })
    }
    return ret
  }
}


/***/ }),

/***/ 6611:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var once = __webpack_require__(3519);

var noop = function() {};

var qnt = global.Bare ? queueMicrotask : process.nextTick.bind(process);

var isRequest = function(stream) {
	return stream.setHeader && typeof stream.abort === 'function';
};

var isChildProcess = function(stream) {
	return stream.stdio && Array.isArray(stream.stdio) && stream.stdio.length === 3
};

var eos = function(stream, opts, callback) {
	if (typeof opts === 'function') return eos(stream, null, opts);
	if (!opts) opts = {};

	callback = once(callback || noop);

	var ws = stream._writableState;
	var rs = stream._readableState;
	var readable = opts.readable || (opts.readable !== false && stream.readable);
	var writable = opts.writable || (opts.writable !== false && stream.writable);
	var cancelled = false;

	var onlegacyfinish = function() {
		if (!stream.writable) onfinish();
	};

	var onfinish = function() {
		writable = false;
		if (!readable) callback.call(stream);
	};

	var onend = function() {
		readable = false;
		if (!writable) callback.call(stream);
	};

	var onexit = function(exitCode) {
		callback.call(stream, exitCode ? new Error('exited with error code: ' + exitCode) : null);
	};

	var onerror = function(err) {
		callback.call(stream, err);
	};

	var onclose = function() {
		qnt(onclosenexttick);
	};

	var onclosenexttick = function() {
		if (cancelled) return;
		if (readable && !(rs && (rs.ended && !rs.destroyed))) return callback.call(stream, new Error('premature close'));
		if (writable && !(ws && (ws.ended && !ws.destroyed))) return callback.call(stream, new Error('premature close'));
	};

	var onrequest = function() {
		stream.req.on('finish', onfinish);
	};

	if (isRequest(stream)) {
		stream.on('complete', onfinish);
		stream.on('abort', onclose);
		if (stream.req) onrequest();
		else stream.on('request', onrequest);
	} else if (writable && !ws) { // legacy streams
		stream.on('end', onlegacyfinish);
		stream.on('close', onlegacyfinish);
	}

	if (isChildProcess(stream)) stream.on('exit', onexit);

	stream.on('end', onend);
	stream.on('finish', onfinish);
	if (opts.error !== false) stream.on('error', onerror);
	stream.on('close', onclose);

	return function() {
		cancelled = true;
		stream.removeListener('complete', onfinish);
		stream.removeListener('abort', onclose);
		stream.removeListener('request', onrequest);
		if (stream.req) stream.req.removeListener('finish', onfinish);
		stream.removeListener('end', onlegacyfinish);
		stream.removeListener('close', onlegacyfinish);
		stream.removeListener('finish', onfinish);
		stream.removeListener('exit', onexit);
		stream.removeListener('end', onend);
		stream.removeListener('error', onerror);
		stream.removeListener('close', onclose);
	};
};

module.exports = eos;


/***/ }),

/***/ 6635:
/***/ ((module) => {

"use strict";


module.exports = handleCustomLevelsNamesOpts

/**
 * Parse a CSV string or options object that maps level
 * labels to level values.
 *
 * @param {string|object} cLevels An object mapping level
 * names to level values, e.g. `{ info: 30, debug: 65 }`, or a
 * CSV string in the format `level_name:level_value`, e.g.
 * `info:30,debug:65`.
 *
 * @returns {object} An object mapping levels names to level values
 * e.g. `{ info: 30, debug: 65 }`.
 */
function handleCustomLevelsNamesOpts (cLevels) {
  if (!cLevels) return {}

  if (typeof cLevels === 'string') {
    return cLevels
      .split(',')
      .reduce((agg, value, idx) => {
        const [levelName, levelNum = idx] = value.split(':')
        agg[levelName.toLowerCase()] = levelNum
        return agg
      }, {})
  } else if (Object.prototype.toString.call(cLevels) === '[object Object]') {
    return Object
      .keys(cLevels)
      .reduce((agg, levelName) => {
        agg[levelName.toLowerCase()] = cLevels[levelName]
        return agg
      }, {})
  } else {
    return {}
  }
}


/***/ }),

/***/ 6901:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


module.exports = getPropertyValue

const splitPropertyKey = __webpack_require__(4655)

/**
 * Gets a specified property from an object if it exists.
 *
 * @param {object} obj The object to be searched.
 * @param {string|string[]} property A string, or an array of strings, identifying
 * the property to be retrieved from the object.
 * Accepts nested properties delimited by a `.`.
 * Delimiter can be escaped to preserve property names that contain the delimiter.
 * e.g. `'prop1.prop2'` or `'prop2\.domain\.corp.prop2'`.
 *
 * @returns {*}
 */
function getPropertyValue (obj, property) {
  const props = Array.isArray(property) ? property : splitPropertyKey(property)

  for (const prop of props) {
    if (!Object.prototype.hasOwnProperty.call(obj, prop)) {
      return
    }
    obj = obj[prop]
  }

  return obj
}


/***/ }),

/***/ 7492:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


module.exports = createDate

const isValidDate = __webpack_require__(2993)

/**
 * Constructs a JS Date from a number or string. Accepts any single number
 * or single string argument that is valid for the Date() constructor,
 * or an epoch as a string.
 *
 * @param {string|number} epoch The representation of the Date.
 *
 * @returns {Date} The constructed Date.
 */
function createDate (epoch) {
  // If epoch is already a valid argument, return the valid Date
  let date = new Date(epoch)
  if (isValidDate(date)) {
    return date
  }

  // Convert to a number to permit epoch as a string
  date = new Date(+epoch)
  return date
}


/***/ }),

/***/ 7515:
/***/ ((module) => {

"use strict";


module.exports = joinLinesWithIndentation

/**
 * @typedef {object} JoinLinesWithIndentationParams
 * @property {string} input The string to split and reformat.
 * @property {string} [ident] The indentation string. Default: `    ` (4 spaces).
 * @property {string} [eol] The end of line sequence to use when rejoining
 * the lines. Default: `'\n'`.
 */

/**
 * Given a string with line separators, either `\r\n` or `\n`, add indentation
 * to all lines subsequent to the first line and rejoin the lines using an
 * end of line sequence.
 *
 * @param {JoinLinesWithIndentationParams} input
 *
 * @returns {string} A string with lines subsequent to the first indented
 * with the given indentation sequence.
 */
function joinLinesWithIndentation ({ input, ident = '    ', eol = '\n' }) {
  const lines = input.split(/\r?\n/)
  for (let i = 1; i < lines.length; i += 1) {
    lines[i] = ident + lines[i]
  }
  return lines.join(eol)
}


/***/ }),

/***/ 7589:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


const nocolor = input => input
const plain = {
  default: nocolor,
  60: nocolor,
  50: nocolor,
  40: nocolor,
  30: nocolor,
  20: nocolor,
  10: nocolor,
  message: nocolor,
  greyMessage: nocolor
}

const { createColors } = __webpack_require__(5844)
const getLevelLabelData = __webpack_require__(3140)
const availableColors = createColors({ useColor: true })
const { white, bgRed, red, yellow, green, blue, gray, cyan } = availableColors

const colored = {
  default: white,
  60: bgRed,
  50: red,
  40: yellow,
  30: green,
  20: blue,
  10: gray,
  message: cyan,
  greyMessage: gray
}

function resolveCustomColoredColorizer (customColors) {
  return customColors.reduce(
    function (agg, [level, color]) {
      agg[level] = typeof availableColors[color] === 'function' ? availableColors[color] : white

      return agg
    },
    { default: white, message: cyan, greyMessage: gray }
  )
}

function colorizeLevel (useOnlyCustomProps) {
  return function (level, colorizer, { customLevels, customLevelNames } = {}) {
    const [levelStr, levelNum] = getLevelLabelData(useOnlyCustomProps, customLevels, customLevelNames)(level)

    return Object.prototype.hasOwnProperty.call(colorizer, levelNum) ? colorizer[levelNum](levelStr) : colorizer.default(levelStr)
  }
}

function plainColorizer (useOnlyCustomProps) {
  const newPlainColorizer = colorizeLevel(useOnlyCustomProps)
  const customColoredColorizer = function (level, opts) {
    return newPlainColorizer(level, plain, opts)
  }
  customColoredColorizer.message = plain.message
  customColoredColorizer.greyMessage = plain.greyMessage
  customColoredColorizer.colors = createColors({ useColor: false })
  return customColoredColorizer
}

function coloredColorizer (useOnlyCustomProps) {
  const newColoredColorizer = colorizeLevel(useOnlyCustomProps)
  const customColoredColorizer = function (level, opts) {
    return newColoredColorizer(level, colored, opts)
  }
  customColoredColorizer.message = colored.message
  customColoredColorizer.greyMessage = colored.greyMessage
  customColoredColorizer.colors = availableColors
  return customColoredColorizer
}

function customColoredColorizerFactory (customColors, useOnlyCustomProps) {
  const onlyCustomColored = resolveCustomColoredColorizer(customColors)
  const customColored = useOnlyCustomProps ? onlyCustomColored : Object.assign({}, colored, onlyCustomColored)
  const colorizeLevelCustom = colorizeLevel(useOnlyCustomProps)

  const customColoredColorizer = function (level, opts) {
    return colorizeLevelCustom(level, customColored, opts)
  }
  customColoredColorizer.colors = availableColors
  customColoredColorizer.message = customColoredColorizer.message || customColored.message
  customColoredColorizer.greyMessage = customColoredColorizer.greyMessage || customColored.greyMessage

  return customColoredColorizer
}

/**
 * Applies colorization, if possible, to a string representing the passed in
 * `level`. For example, the default colorizer will return a "green" colored
 * string for the "info" level.
 *
 * @typedef {function} ColorizerFunc
 * @param {string|number} level In either case, the input will map to a color
 * for the specified level or to the color for `USERLVL` if the level is not
 * recognized.
 * @property {function} message Accepts one string parameter that will be
 * colorized to a predefined color.
 * @property {Colorette.Colorette} colors Available color functions based on `useColor` (or `colorize`) context
 */

/**
 * Factory function get a function to colorized levels. The returned function
 * also includes a `.message(str)` method to colorize strings.
 *
 * @param {boolean} [useColors=false] When `true` a function that applies standard
 * terminal colors is returned.
 * @param {array[]} [customColors] Tuple where first item of each array is the
 * level index and the second item is the color
 * @param {boolean} [useOnlyCustomProps] When `true`, only use the provided
 * custom colors provided and not fallback to default
 *
 * @returns {ColorizerFunc} `function (level) {}` has a `.message(str)` method to
 * apply colorization to a string. The core function accepts either an integer
 * `level` or a `string` level. The integer level will map to a known level
 * string or to `USERLVL` if not known.  The string `level` will map to the same
 * colors as the integer `level` and will also default to `USERLVL` if the given
 * string is not a recognized level name.
 */
module.exports = function getColorizer (useColors = false, customColors, useOnlyCustomProps) {
  if (useColors && customColors !== undefined) {
    return customColoredColorizerFactory(customColors, useOnlyCustomProps)
  } else if (useColors) {
    return coloredColorizer(useOnlyCustomProps)
  }

  return plainColorizer(useOnlyCustomProps)
}


/***/ }),

/***/ 7848:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


module.exports = prettifyMessage

const {
  LEVELS
} = __webpack_require__(4160)

const getPropertyValue = __webpack_require__(6901)
const interpretConditionals = __webpack_require__(954)

/**
 * @typedef {object} PrettifyMessageParams
 * @property {object} log The log object with the message to colorize.
 * @property {PrettyContext} context The context object built from parsing
 * the options.
 */

/**
 * Prettifies a message string if the given `log` has a message property.
 *
 * @param {PrettifyMessageParams} input
 *
 * @returns {undefined|string} If the message key is not found, or the message
 * key is not a string, then `undefined` will be returned. Otherwise, a string
 * that is the prettified message.
 */
function prettifyMessage ({ log, context }) {
  const {
    colorizer,
    customLevels,
    levelKey,
    levelLabel,
    messageFormat,
    messageKey,
    useOnlyCustomProps
  } = context
  if (messageFormat && typeof messageFormat === 'string') {
    const parsedMessageFormat = interpretConditionals(messageFormat, log)

    const message = String(parsedMessageFormat).replace(
      /{([^{}]+)}/g,
      function (match, p1) {
        // return log level as string instead of int
        let level
        if (p1 === levelLabel && (level = getPropertyValue(log, levelKey)) !== undefined) {
          const condition = useOnlyCustomProps ? customLevels === undefined : customLevels[level] === undefined
          return condition ? LEVELS[level] : customLevels[level]
        }

        // Parse nested key access, e.g. `{keyA.subKeyB}`.
        return getPropertyValue(log, p1) || ''
      })
    return colorizer.message(message)
  }
  if (messageFormat && typeof messageFormat === 'function') {
    const msg = messageFormat(log, messageKey, levelLabel, { colors: colorizer.colors })
    return colorizer.message(msg)
  }
  if (messageKey in log === false) return undefined
  if (typeof log[messageKey] !== 'string' && typeof log[messageKey] !== 'number' && typeof log[messageKey] !== 'boolean') return undefined
  return colorizer.message(log[messageKey])
}


/***/ }),

/***/ 8136:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


module.exports = prettifyObject

const {
  LOGGER_KEYS
} = __webpack_require__(4160)

const stringifySafe = __webpack_require__(8463)
const joinLinesWithIndentation = __webpack_require__(7515)
const prettifyError = __webpack_require__(1381)

/**
 * @typedef {object} PrettifyObjectParams
 * @property {object} log The object to prettify.
 * @property {boolean} [excludeLoggerKeys] Indicates if known logger specific
 * keys should be excluded from prettification. Default: `true`.
 * @property {string[]} [skipKeys] A set of object keys to exclude from the
 *  * prettified result. Default: `[]`.
 * @property {PrettyContext} context The context object built from parsing
 * the options.
 */

/**
 * Prettifies a standard object. Special care is taken when processing the object
 * to handle child objects that are attached to keys known to contain error
 * objects.
 *
 * @param {PrettifyObjectParams} input
 *
 * @returns {string} The prettified string. This can be as little as `''` if
 * there was nothing to prettify.
 */
function prettifyObject ({
  log,
  excludeLoggerKeys = true,
  skipKeys = [],
  context
}) {
  const {
    EOL: eol,
    IDENT: ident,
    customPrettifiers,
    errorLikeObjectKeys: errorLikeKeys,
    objectColorizer,
    singleLine,
    colorizer
  } = context
  const keysToIgnore = [].concat(skipKeys)

  /* istanbul ignore else */
  if (excludeLoggerKeys === true) Array.prototype.push.apply(keysToIgnore, LOGGER_KEYS)

  let result = ''

  // Split object keys into two categories: error and non-error
  const { plain, errors } = Object.entries(log).reduce(({ plain, errors }, [k, v]) => {
    if (keysToIgnore.includes(k) === false) {
      // Pre-apply custom prettifiers, because all 3 cases below will need this
      const pretty = typeof customPrettifiers[k] === 'function'
        ? customPrettifiers[k](v, k, log, { colors: colorizer.colors })
        : v
      if (errorLikeKeys.includes(k)) {
        errors[k] = pretty
      } else {
        plain[k] = pretty
      }
    }
    return { plain, errors }
  }, { plain: {}, errors: {} })

  if (singleLine) {
    // Stringify the entire object as a single JSON line
    /* istanbul ignore else */
    if (Object.keys(plain).length > 0) {
      result += objectColorizer.greyMessage(stringifySafe(plain))
    }
    result += eol
    // Avoid printing the escape character on escaped backslashes.
    result = result.replace(/\\\\/gi, '\\')
  } else {
    // Put each object entry on its own line
    Object.entries(plain).forEach(([keyName, keyValue]) => {
      // custom prettifiers are already applied above, so we can skip it now
      let lines = typeof customPrettifiers[keyName] === 'function'
        ? keyValue
        : stringifySafe(keyValue, null, 2)

      if (lines === undefined) return

      // Avoid printing the escape character on escaped backslashes.
      lines = lines.replace(/\\\\/gi, '\\')

      const joinedLines = joinLinesWithIndentation({ input: lines, ident, eol })
      result += `${ident}${keyName}:${joinedLines.startsWith(eol) ? '' : ' '}${joinedLines}${eol}`
    })
  }

  // Errors
  Object.entries(errors).forEach(([keyName, keyValue]) => {
    // custom prettifiers are already applied above, so we can skip it now
    const lines = typeof customPrettifiers[keyName] === 'function'
      ? keyValue
      : stringifySafe(keyValue, null, 2)

    if (lines === undefined) return

    result += prettifyError({ keyName, lines, eol, ident })
  })

  return result
}


/***/ }),

/***/ 8463:
/***/ ((module) => {

module.exports = stringify
stringify.default = stringify
stringify.stable = deterministicStringify
stringify.stableStringify = deterministicStringify

var LIMIT_REPLACE_NODE = '[...]'
var CIRCULAR_REPLACE_NODE = '[Circular]'

var arr = []
var replacerStack = []

function defaultOptions () {
  return {
    depthLimit: Number.MAX_SAFE_INTEGER,
    edgesLimit: Number.MAX_SAFE_INTEGER
  }
}

// Regular stringify
function stringify (obj, replacer, spacer, options) {
  if (typeof options === 'undefined') {
    options = defaultOptions()
  }

  decirc(obj, '', 0, [], undefined, 0, options)
  var res
  try {
    if (replacerStack.length === 0) {
      res = JSON.stringify(obj, replacer, spacer)
    } else {
      res = JSON.stringify(obj, replaceGetterValues(replacer), spacer)
    }
  } catch (_) {
    return JSON.stringify('[unable to serialize, circular reference is too complex to analyze]')
  } finally {
    while (arr.length !== 0) {
      var part = arr.pop()
      if (part.length === 4) {
        Object.defineProperty(part[0], part[1], part[3])
      } else {
        part[0][part[1]] = part[2]
      }
    }
  }
  return res
}

function setReplace (replace, val, k, parent) {
  var propertyDescriptor = Object.getOwnPropertyDescriptor(parent, k)
  if (propertyDescriptor.get !== undefined) {
    if (propertyDescriptor.configurable) {
      Object.defineProperty(parent, k, { value: replace })
      arr.push([parent, k, val, propertyDescriptor])
    } else {
      replacerStack.push([val, k, replace])
    }
  } else {
    parent[k] = replace
    arr.push([parent, k, val])
  }
}

function decirc (val, k, edgeIndex, stack, parent, depth, options) {
  depth += 1
  var i
  if (typeof val === 'object' && val !== null) {
    for (i = 0; i < stack.length; i++) {
      if (stack[i] === val) {
        setReplace(CIRCULAR_REPLACE_NODE, val, k, parent)
        return
      }
    }

    if (
      typeof options.depthLimit !== 'undefined' &&
      depth > options.depthLimit
    ) {
      setReplace(LIMIT_REPLACE_NODE, val, k, parent)
      return
    }

    if (
      typeof options.edgesLimit !== 'undefined' &&
      edgeIndex + 1 > options.edgesLimit
    ) {
      setReplace(LIMIT_REPLACE_NODE, val, k, parent)
      return
    }

    stack.push(val)
    // Optimize for Arrays. Big arrays could kill the performance otherwise!
    if (Array.isArray(val)) {
      for (i = 0; i < val.length; i++) {
        decirc(val[i], i, i, stack, val, depth, options)
      }
    } else {
      var keys = Object.keys(val)
      for (i = 0; i < keys.length; i++) {
        var key = keys[i]
        decirc(val[key], key, i, stack, val, depth, options)
      }
    }
    stack.pop()
  }
}

// Stable-stringify
function compareFunction (a, b) {
  if (a < b) {
    return -1
  }
  if (a > b) {
    return 1
  }
  return 0
}

function deterministicStringify (obj, replacer, spacer, options) {
  if (typeof options === 'undefined') {
    options = defaultOptions()
  }

  var tmp = deterministicDecirc(obj, '', 0, [], undefined, 0, options) || obj
  var res
  try {
    if (replacerStack.length === 0) {
      res = JSON.stringify(tmp, replacer, spacer)
    } else {
      res = JSON.stringify(tmp, replaceGetterValues(replacer), spacer)
    }
  } catch (_) {
    return JSON.stringify('[unable to serialize, circular reference is too complex to analyze]')
  } finally {
    // Ensure that we restore the object as it was.
    while (arr.length !== 0) {
      var part = arr.pop()
      if (part.length === 4) {
        Object.defineProperty(part[0], part[1], part[3])
      } else {
        part[0][part[1]] = part[2]
      }
    }
  }
  return res
}

function deterministicDecirc (val, k, edgeIndex, stack, parent, depth, options) {
  depth += 1
  var i
  if (typeof val === 'object' && val !== null) {
    for (i = 0; i < stack.length; i++) {
      if (stack[i] === val) {
        setReplace(CIRCULAR_REPLACE_NODE, val, k, parent)
        return
      }
    }
    try {
      if (typeof val.toJSON === 'function') {
        return
      }
    } catch (_) {
      return
    }

    if (
      typeof options.depthLimit !== 'undefined' &&
      depth > options.depthLimit
    ) {
      setReplace(LIMIT_REPLACE_NODE, val, k, parent)
      return
    }

    if (
      typeof options.edgesLimit !== 'undefined' &&
      edgeIndex + 1 > options.edgesLimit
    ) {
      setReplace(LIMIT_REPLACE_NODE, val, k, parent)
      return
    }

    stack.push(val)
    // Optimize for Arrays. Big arrays could kill the performance otherwise!
    if (Array.isArray(val)) {
      for (i = 0; i < val.length; i++) {
        deterministicDecirc(val[i], i, i, stack, val, depth, options)
      }
    } else {
      // Create a temporary object in the required way
      var tmp = {}
      var keys = Object.keys(val).sort(compareFunction)
      for (i = 0; i < keys.length; i++) {
        var key = keys[i]
        deterministicDecirc(val[key], key, i, stack, val, depth, options)
        tmp[key] = val[key]
      }
      if (typeof parent !== 'undefined') {
        arr.push([parent, k, val])
        parent[k] = tmp
      } else {
        return tmp
      }
    }
    stack.pop()
  }
}

// wraps replacer function to handle values we couldn't replace
// and mark them as replaced value
function replaceGetterValues (replacer) {
  replacer =
    typeof replacer !== 'undefined'
      ? replacer
      : function (k, v) {
        return v
      }
  return function (key, val) {
    if (replacerStack.length > 0) {
      for (var i = 0; i < replacerStack.length; i++) {
        var part = replacerStack[i]
        if (part[1] === key && part[0] === val) {
          val = part[2]
          replacerStack.splice(i, 1)
          break
        }
      }
    }
    return replacer.call(this, key, val)
  }
}


/***/ }),

/***/ 8881:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


module.exports = pretty

const sjs = __webpack_require__(2699)

const isObject = __webpack_require__(2531)
const prettifyErrorLog = __webpack_require__(5538)
const prettifyLevel = __webpack_require__(3733)
const prettifyMessage = __webpack_require__(7848)
const prettifyMetadata = __webpack_require__(394)
const prettifyObject = __webpack_require__(8136)
const prettifyTime = __webpack_require__(2438)
const filterLog = __webpack_require__(4890)

const {
  LEVELS,
  LEVEL_KEY,
  LEVEL_NAMES
} = __webpack_require__(4160)

const jsonParser = input => {
  try {
    return { value: sjs.parse(input, { protoAction: 'remove' }) }
  } catch (err) {
    return { err }
  }
}

/**
 * Orchestrates processing the received log data according to the provided
 * configuration and returns a prettified log string.
 *
 * @typedef {function} LogPrettifierFunc
 * @param {string|object} inputData A log string or a log-like object.
 * @returns {string} A string that represents the prettified log data.
 */
function pretty (inputData) {
  let log
  if (!isObject(inputData)) {
    const parsed = jsonParser(inputData)
    if (parsed.err || !isObject(parsed.value)) {
      // pass through
      return inputData + this.EOL
    }
    log = parsed.value
  } else {
    log = inputData
  }

  if (this.minimumLevel) {
    // We need to figure out if the custom levels has the desired minimum
    // level & use that one if found. If not, determine if the level exists
    // in the standard levels. In both cases, make sure we have the level
    // number instead of the level name.
    let condition
    if (this.useOnlyCustomProps) {
      condition = this.customLevels
    } else {
      condition = this.customLevelNames[this.minimumLevel] !== undefined
    }
    let minimum
    if (condition) {
      minimum = this.customLevelNames[this.minimumLevel]
    } else {
      minimum = LEVEL_NAMES[this.minimumLevel]
    }
    if (!minimum) {
      minimum = typeof this.minimumLevel === 'string'
        ? LEVEL_NAMES[this.minimumLevel]
        : LEVEL_NAMES[LEVELS[this.minimumLevel].toLowerCase()]
    }

    const level = log[this.levelKey === undefined ? LEVEL_KEY : this.levelKey]
    if (level < minimum) return
  }

  const prettifiedMessage = prettifyMessage({ log, context: this.context })

  if (this.ignoreKeys || this.includeKeys) {
    log = filterLog({ log, context: this.context })
  }

  const prettifiedLevel = prettifyLevel({
    log,
    context: {
      ...this.context,
      // This is odd. The colorizer ends up relying on the value of
      // `customProperties` instead of the original `customLevels` and
      // `customLevelNames`.
      ...this.context.customProperties
    }
  })
  const prettifiedMetadata = prettifyMetadata({ log, context: this.context })
  const prettifiedTime = prettifyTime({ log, context: this.context })

  let line = ''
  if (this.levelFirst && prettifiedLevel) {
    line = `${prettifiedLevel}`
  }

  if (prettifiedTime && line === '') {
    line = `${prettifiedTime}`
  } else if (prettifiedTime) {
    line = `${line} ${prettifiedTime}`
  }

  if (!this.levelFirst && prettifiedLevel) {
    if (line.length > 0) {
      line = `${line} ${prettifiedLevel}`
    } else {
      line = prettifiedLevel
    }
  }

  if (prettifiedMetadata) {
    if (line.length > 0) {
      line = `${line} ${prettifiedMetadata}:`
    } else {
      line = prettifiedMetadata
    }
  }

  if (line.endsWith(':') === false && line !== '') {
    line += ':'
  }

  if (prettifiedMessage !== undefined) {
    if (line.length > 0) {
      line = `${line} ${prettifiedMessage}`
    } else {
      line = prettifiedMessage
    }
  }

  if (line.length > 0 && !this.singleLine) {
    line += this.EOL
  }

  // pino@7+ does not log this anymore
  if (log.type === 'Error' && typeof log.stack === 'string') {
    const prettifiedErrorLog = prettifyErrorLog({ log, context: this.context })
    if (this.singleLine) line += this.EOL
    line += prettifiedErrorLog
  } else if (this.hideObject === false) {
    const skipKeys = [
      this.messageKey,
      this.levelKey,
      this.timestampKey
    ]
      .map((key) => key.replaceAll(/\\/g, ''))
      .filter(key => {
        return typeof log[key] === 'string' ||
          typeof log[key] === 'number' ||
          typeof log[key] === 'boolean'
      })
    const prettifiedObject = prettifyObject({
      log,
      skipKeys,
      context: this.context
    })

    // In single line mode, include a space only if prettified version isn't empty
    if (this.singleLine && !/^\s$/.test(prettifiedObject)) {
      line += ' '
    }
    line += prettifiedObject
  }

  return line
}


/***/ })

};
;
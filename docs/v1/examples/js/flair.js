/**
 * @preserve
 * Flair.js
 * True Object Oriented JavaScript
 * 
 * Assembly: flair
 *     File: ./flair.js
 *  Version: 0.9.2
 *  Mon, 15 Jul 2019 00:29:00 GMT
 * 
 * (c) 2017-2019 Vikas Burman
 * MIT
 */
(function(root, factory) {
    'use strict';

    if (typeof define === 'function' && define.amd) { // AMD support
        define(factory);
    } else if (typeof exports === 'object') { // CommonJS and Node.js module support
        if (typeof module !== 'undefined' && module.exports) {
            exports = module.exports = factory(); // Node.js specific `module.exports`
        }
        module.exports = exports = factory(); // CommonJS        
    } else { // expose as global on window
        root.flair = factory();
    }
})(this, function() {
    'use strict';

    /* eslint-disable no-unused-vars */
    // locals
    let isServer = new Function("try {return this===global;}catch(e){return false;}")(),
        isWorker = isServer ? (!require('worker_threads').isMainThread) : (typeof WorkerGlobalScope !== 'undefined' ? true : false),
        sym = [],
        meta = Symbol('[meta]'),
        modulesRootFolder = 'modules',
        disposers = [],
        options = {},
        flairTypes = ['class', 'enum', 'interface', 'mixin', 'struct'],
        flairInstances = ['instance', 'sinstance'],
        argsString = '',
        settings = {},
        config = {},
        isAppStarted = false;
    /* eslint-enable no-unused-vars */

    // flairapp bootstrapper
    let flair = async (entryPointOrADO, config) => {
        // register ADO or start App
        if (entryPointOrADO !== null && typeof entryPointOrADO === 'object') {
            flair.AppDomain.registerAdo(entryPointOrADO);
        } else {
            if (!isAppStarted) {
                // boot
                isAppStarted = await flair.AppDomain.boot(entryPointOrADO, config);
            }
            // return
            return flair.AppDomain.app();
        }
    };

    // read symbols from environment
    if (isServer) {
        let argv = process.argv;
        if (isWorker) {
            argv = require('worker_threads').workerData.argv;
        }
        let idx = argv.findIndex((item) => { return (item.startsWith('--flairSymbols') ? true : false); });
        if (idx !== -1) { argsString = argv[idx].substr(2).split('=')[1]; }
    } else {
        if (isWorker) {
            argsString = WorkerGlobalScope.flairSymbols || '';
        } else {
            argsString = window.flairSymbols || '';
        }
    }
    if (argsString) { sym = argsString.split(',').map(item => item.trim()); }

    options.symbols = Object.freeze(sym);
    options.env = Object.freeze({
        type: (isServer ? 'server' : 'client'),
        isTesting: (sym.indexOf('TEST') !== -1),
        isServer: isServer,
        isClient: !isServer,
        isWorker : isWorker,
        isMain: !isWorker,
        cores: ((isServer ? (require('os').cpus().length) : window.navigator.hardwareConcurrency) || 4),
        isCordova: (!isServer && !!window.cordova),
        isNodeWebkit: (isServer && process.versions['node-webkit']),
        isProd: (sym.indexOf('DEBUG') === -1 && sym.indexOf('PROD') !== -1),
        isDebug: (sym.indexOf('DEBUG') !== -1),
        isAppMode: () => { return isAppStarted; }
    });

    // flair
    flair.members = [];
    flair.options = Object.freeze(options);
    flair.env = flair.options.env; // direct env access as well
    const a2f = (name, obj, disposer) => {
        flair[name] = Object.freeze(obj);
        flair.members.push(name);
        if (typeof disposer === 'function') { disposers.push(disposer); }
    };

    // members
    /**
     * @name noop
     * @description No Operation function
     * @example
     *  noop()
     * @params
     * @returns
     */ 
    const _noop = () => {};
    
    // attach to flair
    a2f('noop', _noop);
       
    /**
     * @name nip
     * @description Not Implemented Property
     * @example
     *  nip()
     * @params
     * @returns
     */ 
    const _nip = {
        get: () => { throw _Exception.NotImplemented('prop', _nip.get); },
        set: () => { throw _Exception.NotImplemented('prop', _nip.set); }
    };
    _nip.ni = true; // a special flag to quick check that this is a not-implemented object
    
    // attach to flair
    a2f('nip', _nip);
       
    /**
     * @name nim
     * @description Not Implemented Method
     * @example
     *  nim()
     * @params
     * @returns
     */ 
    const _nim = () => { throw _Exception.NotImplemented('func', _nim); };
    _nim.ni = true; // a special flag to quick check that this is a not-implemented object
    
    // attach to flair
    a2f('nim', _nim);
       
    
    /**
     * @name Exception
     * @description Lightweight Exception class that extends Error object and serves as base of all exceptions
     * @example
     *  Exception()
     *  Exception(type)
     *  Exception(type, stStart)
     *  Exception(error)
     *  Exception(error, stStart)
     *  Exception(type, message)
     *  Exception(type, message, stStart)
     *  Exception(type, error)
     *  Exception(type, error, stStart)
     *  Exception(type, message, error)
     *  Exception(type, message, error, stStart)
     * @params
     *  type: string - error name or type
     *  message: string - error message
     *  error: object - inner error or exception object
     *  stStart: function - hide stack trace before this function
     * @constructs Exception object
     */  
    const _Exception = function(arg1, arg2, arg3, arg4) {
        let _this = new Error(),
            stStart = _Exception;
        switch(typeof arg1) {
            case 'string':
                _this.name = arg1;
                switch(typeof arg2) {
                    case 'string': 
                        _this.message = arg2;
                        switch(typeof arg3) {
                            case 'object':
                                _this.error = arg3;
                                if (typeof arg4 === 'function') { stStart = arg4; }
                                break;
                            case 'function':
                                stStart = arg3;
                                break;
                        } 
                        break;
                    case 'object': 
                        _this.message = arg2.message || '';
                        _this.error = arg2;
                        if (typeof arg3 === 'function') { stStart = arg3; }
                        break;
                    case 'function': 
                        stStart = arg2;
                        break;
                }
                break;
            case 'object':
                _this.name = arg1.name || 'Unknown';
                _this.message = arg1.message || '';
                _this.error = arg1;
                if (typeof arg2 === 'function') { stStart = arg2; }
                break;
        }
    
        _this.name =  _this.name || 'Undefined';
        if (!_this.name.endsWith('Exception')) { _this.name += 'Exception'; }
    
        // limit stacktrace
        if (typeof Error.captureStackTrace === 'function') {
            Error.captureStackTrace(_this, stStart);
        }
    
        // add hint of error
        if (_this.error) {
            _this.message += '[' + _this.error + ']';
        }
    
        // return
        return Object.freeze(_this);
    };
    
    // all inbuilt exceptions
    _Exception.InvalidArgument = (name, stStart = _Exception.InvalidArgument) => { return new _Exception('InvalidArgument', `Argument type is invalid. (${name})`, stStart); }
    _Exception.OperationFailed = (name, error, stStart = _Exception.OperationFailed) => { return new _Exception('OperationFailed', `Operation failed with error. (${name})`, error, stStart); }
    _Exception.Duplicate = (name, stStart = _Exception.Duplicate) => { return new _Exception('Duplicate', `Item already exists.(${name})`, stStart); }
    _Exception.NotFound = (name, stStart = _Exception.NotFound) => { return new _Exception('NotFound', `Item not found. (${name})`, stStart); }
    _Exception.InvalidDefinition = (name, stStart = _Exception.InvalidDefinition) => { return new _Exception('InvalidDefinition', `Item definition is invalid. (${name})`, stStart); }
    _Exception.InvalidOperation = (name, stStart = _Exception.InvalidOperation) => { return new _Exception('InvalidOperation', `Operation is invalid in current context. (${name})`, stStart); }
    _Exception.Circular = (name, stStart = _Exception.Circular) => { return new _Exception('Circular', `Circular calls found. (${name})`, stStart); }
    _Exception.NotImplemented = (name, stStart = _Exception.NotImplemented) => { return new _Exception('NotImplemented', `Member is not implemented. (${name})`, stStart); }
    _Exception.NotDefined = (name, stStart = _Exception.NotDefined) => { return new _Exception('NotFound', `Member is not defined or is not accessible. (${name})`, stStart); }
    
    // attach to flair
    a2f('Exception', _Exception);
      
    const guid = () => {
        return '_xxxxxxxx_xxxx_4xxx_yxxx_xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    };
    const which = (def, isFile) => {
        if (isFile) { // debug/prod specific decision
            // pick minified or dev version
            if (def.indexOf('{.min}') !== -1) {
                if (options.env.isProd) {
                    return def.replace('{.min}', '.min'); // a{.min}.js => a.min.js
                } else {
                    return def.replace('{.min}', ''); // a{.min}.js => a.js
                }
            }
        } else { // server/client specific decision
            if (def.indexOf('|') !== -1) { 
                let items = def.split('|'),
                    item = '';
                if (options.env.isServer) {
                    item = items[0].trim();
                } else {
                    item = items[1].trim();
                }
                if (item === 'x') { item = ''; } // special case to explicitly mark absence of a type
    
                // worker environment specific pick
                if (item.indexOf('~') !== -1) {
                    items = item.split('~');
                    if (!options.env.isWorker) { // left is main thread
                        item = items[0].trim();
                    } else { // right is worker thread
                        item = items[1].trim(); 
                    }
                    if (item === 'x') { item = ''; } // special case to explicitly mark absence of a type
                }
    
                return item;
            }            
        }
        return def; // as is
    };
    const isArrow = (fn) => {
        return (!(fn).hasOwnProperty('prototype') && fn.constructor.name === 'Function');
    };
    const isASync = (fn) => {
        return (fn.constructor.name === 'AsyncFunction');
    };
    const findIndexByProp = (arr, propName, propValue) => {
        return arr.findIndex((item) => {
            return (item[propName] === propValue ? true : false);
        });
    };
    const findItemByProp = (arr, propName, propValue) => {
        let idx = arr.findIndex((item) => {
            return (item[propName] === propValue ? true : false);
        });
        if (idx !== -1) { return arr[idx]; }
        return null;
    };
    const splitAndTrim = (str, splitChar) => {
        if (!splitChar) { splitChar = ','; }
        return str.split(splitChar).map((item) => { return item.trim(); });
    };
    const escapeRegExp = (string) => {
        return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");  // eslint-disable-line no-useless-escape
    };
    const replaceAll = (string, find, replace) => {
        return string.replace(new RegExp(escapeRegExp(find), 'g'), replace);
    };
    const shallowCopy = (target, source, overwrite, except) => {
        if (!except) { except = []; }
        for(let item in source) {
            if (source.hasOwnProperty(item) && except.indexOf(item) === -1) { 
                if (!overwrite) { if (item in target) { continue; }}
                target[item] = source[item];
            }
        }
        return target;
    };
    const loadFile = (file) => { // text based file loading operation - not a general purpose fetch of any url (it assumes it is a phycical file)
        return new Promise((resolve, reject) => {
            let loader = null;
            if (isServer) {
                loader = _Port('serverFile');
            } else { // client
                loader = _Port('clientFile');
            }
            loader(file).then(resolve).catch(reject);
        });
    };
    const loadModule = (module, globalObjName, isDelete) => {
        return new Promise((resolve, reject) => {
            if (isServer) {
                _Port('serverModule').require(module).then(resolve).catch(reject);
            } else { // client
                _Port('clientModule').require(module).then((obj) => {
                    if (!obj && typeof globalObjName === 'string') {
                        if (isWorker) {
                            obj = WorkerGlobalScope[globalObjName] || null;
                            if (isDelete) { delete WorkerGlobalScope[globalObjName]; }
                        } else {
                            obj = window[globalObjName] || null;
                            if (isDelete) { delete window[globalObjName]; }
                        }
                    }
                    if (obj) {
                        resolve(obj);
                    } else {
                        resolve();
                    }
                }).catch(reject);
            }
        });
    };
    const apiCall = (url, resDataType, reqData) => { 
        return new Promise((resolve, reject) => {
            let fetchCaller = null;
            if (isServer) {
                fetchCaller = _Port('serverFetch');
            } else { // client
                fetchCaller = _Port('clientFetch');
            }
            fetchCaller(url, resDataType, reqData).then(resolve).catch(reject);
        });
    };
    const sieve = (obj, props, isFreeze, add) => {
        let _props = props ? splitAndTrim(props) : Object.keys(obj); // if props are not give, pick all
        const extract = (_obj) => {
            let result = {};
            if (_props.length > 0) { // copy defined
                for(let prop of _props) { result[prop] = _obj[prop]; } 
            } else { // copy all
                for(let prop in obj) { 
                    if (obj.hasOwnProperty(prop)) { result[prop] = obj[prop]; }
                }            
            }
            if (add) { for(let prop in add) { result[prop] = add[prop]; } }
            if (isFreeze) { result = Object.freeze(result); }
            return result;
        };
        if (Array.isArray(obj)) {
            let result = [];
            for(let item of obj) { result.push(extract(item)); }
            return result;
        } else {
            return extract(obj);
        }
    };
    const b64EncodeUnicode = (str) => { // eslint-disable-line no-unused-vars
        // first we use encodeURIComponent to get percent-encoded UTF-8,
        // then we convert the percent encodings into raw bytes which
        // can be fed into btoa.
        return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g,
            function toSolidBytes(match, p1) {
                return String.fromCharCode('0x' + p1);
        }));
    };
    const b64DecodeUnicode = (str) => {
        // Going backwards: from bytestream, to percent-encoding, to original string.
        return decodeURIComponent(atob(str).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
    }; 
    const uncacheModule = (module) => {
        if (isServer) {
            _Port('serverModule').undef(module);
        } else { 
            _Port('clientModule').undef(module);
        }
    };
    const forEachAsync = (items, asyncFn) => {
        return new Promise((resolve, reject) => {
            const processItems = (items) => {
                if (!items || items.length === 0) { resolve(); return; }
                Promise((_resolve, _reject) => {
                    asyncFn(_resolve, _reject, items.shift());
                }).then(() => { processItems(items); }).catch(reject); // process one from top
            };
    
            // start
            processItems(items.slice());
        });
    };
    const deepMerge = (objects, isMergeArray = true) => { // credit: https://stackoverflow.com/a/48218209
        const isObject = obj => obj && typeof obj === 'object';
        
        return objects.reduce((prev, obj) => {
            Object.keys(obj).forEach(key => {
                const pVal = prev[key];
                const oVal = obj[key];
            
                if (Array.isArray(pVal) && Array.isArray(oVal)) {
                    if (isMergeArray) {
                        prev[key] = pVal.concat(...oVal); // merge array
                    } else {
                        prev[key] = [].concat(...oVal); // overwrite as new array
                    }
                } else if (isObject(pVal) && isObject(oVal)) {
                    prev[key] = deepMerge([pVal, oVal], isMergeArray);
                } else {
                    prev[key] = oVal;
                }
            });
            return prev;
        }, {});
    };
    const getLoadedScript = (...scriptNames) => {
        if (isServer || isWorker) { return ''; }
        let scriptFile = '',
            baseUri = '',
            el = null;
        for(let scriptName of scriptNames) {
            for(let script of window.document.scripts) {
                if (script.src.endsWith(scriptName)) {
                    el = window.document.createElement('a');
                    el.href = script.src;
                    baseUri = el.protocol + '//' + el.host + '/';
                    el = null;
                    scriptFile = './' + script.src.replace(baseUri, '');
                    break;
                }
            }
            if (scriptFile) { break; }
        }
        return scriptFile;
    };  
    /**
     * @name typeOf
     * @description Finds the type of given object in flair type system
     * @example
     *  typeOf(obj)
     * @params
     *  obj: object - object that needs to be checked
     * @returns string - type of the given object
     *                   it can be following:
     *                    > special ones like 'undefined', 'null', 'NaN', infinity
     *                    > special javascript data types like 'array', 'date', etc.
     *                    > inbuilt flair object types like 'class', 'struct', 'enum', etc.
     *                    > native regular javascript data types like 'string', 'number', 'function', 'symbol', etc.
     */ 
    const _typeOf = (obj) => {
        let _type = '';
    
        // undefined
        if (typeof obj === 'undefined') { _type = 'undefined'; }
    
        // null
        if (!_type && obj === null) { _type = 'null'; }
    
        // infinity
        if (!_type && typeof obj === 'number' && isFinite(obj) === false) { _type = 'infinity'; }
    
        // array
        if (!_type && Array.isArray(obj)) { _type = 'array'; }
    
        // date
        if (!_type && (obj instanceof Date)) { _type = 'date'; }
    
        // flair types
        if (!_type && obj[meta]) { _type = obj[meta].type; }
    
        // native javascript types
        if (!_type) { _type = typeof obj; }
    
        // return
        return _type;
    };
    
    // attach to flair
    a2f('typeOf', _typeOf);   
    /**
     * @name is
     * @description Checks if given object is of a given type
     * @example
     *  is(obj, type)
     * @params
     *  obj: object - object that needs to be checked
     *  type: string OR type - type to be checked for, it can be following:
     *                         > expected native javascript data types like 'string', 'number', 'function', 'array', 'date', etc.
     *                         > 'function' - any function, cfunction' - constructor function and 'afunction - arrow function
     *                         > any 'flair' object or type, 'flairtype' - only flair types and 'flairinstance' - only flair instances
     *                         > inbuilt flair object types like 'class', 'struct', 'enum', etc.
     *                         > custom flair object instance types which are checked in following order:
     *                           >> for class instances: 
     *                              isInstanceOf given as type
     *                              isImplements given as interface 
     *                              isMixed given as mixin
     *                           >> for struct instances:
     *                              isInstance of given as struct type
     * @returns boolean - true/false
     */ 
    const _is = (obj, type) => {
        // NOTE: in all 'check' type functions, Args() is not to be used, as Args use them itself
    
        // obj may be undefined or null or false, so don't check for validation of that here
        if (type[meta]) { type = type[meta].name; } // since it can be a type as well
        if (_typeOf(type) !== 'string') { throw _Exception.InvalidArgument('type', _is); }
        
        let isMatched = false;
    
        if (obj) {
            switch(type) {
                case 'NaN': 
                    isMatched = isNaN(obj); break;
                case 'infinity': 
                    isMatched = (typeof obj === 'number' && isFinite(obj) === false); break;
                case 'array':
                case 'Array':
                    isMatched = Array.isArray(obj); break;
                case 'date':
                case 'Date':
                    isMatched = (obj instanceof Date); break;
                case 'flairtype':
                    isMatched = (obj[meta] && flairTypes.indexOf(obj[meta].type) !== -1); break;
                case 'flairinstance':
                    isMatched = (obj[meta] && flairInstances.indexOf(obj[meta].type) !== -1); break;
                case 'flair':
                    // presence ot meta symbol means it is flair type/instance
                    isMatched = typeof obj[meta] !== 'undefined'; break;
                case 'cfunction':
                    isMatched = (typeof obj === 'function' && !isArrow(obj)); break;
                case 'afunction':
                    isMatched = (typeof obj === 'function' && isArrow(obj)); break;
                default:
                    // native javascript types (including simple 'function')
                    if (!isMatched) { isMatched = (typeof obj === type); }
        
                    if (!isMatched && obj[meta]) {
                        // flair types
                        if (!isMatched) { isMatched = (type === obj[meta].type); }
        
                        // flair instance check (instance)
                        if (!isMatched && flairInstances.indexOf(obj[meta].type) !== -1) { isMatched = _isInstanceOf(obj, type); }
        
                        // flair type check (derived from)
                        if (!isMatched && obj[meta].type === 'class') { isMatched = _isDerivedFrom(obj, type); }
                        
                        // flair type check (direct name)
                        if (!isMatched && flairTypes.indexOf(obj[meta].type) !== -1) { isMatched = (obj[meta].name === type); }
                    }
            }
        } else {
            switch(type) {
                case 'undefined': 
                    isMatched = (typeof obj === 'undefined'); break;
                case 'null': 
                    isMatched = (obj === null); break;
                case 'NaN': 
                    isMatched = isNaN(obj); break;
            }
        }
    
        // return
        return isMatched;
    };
    
    // attach to flair
    a2f('is', _is);
     
    /**
     * @name is
     * @description Checks if given object has specified member defined
     * @example
     *  isDefined(obj, memberName)
     * @params
     *  obj: object - object that needs to be checked
     *  memberName: string - name of the member to check
     * @returns boolean - true/false
     */ 
    const _isDefined = (obj, memberName) => {
        // NOTE: in all 'check' type functions, Args() is not to be used, as Args use them itself
    
        let isErrorOccured = false;
        try {
            obj[memberName]; // try to access it, it will throw error if not defined on an object which is a flair-object
    
            // if error does not occur above, means either member is defined or it was not a flairjs object, in that case check for 'undefined'
            isErrorOccured = (typeof obj[memberName] === 'undefined');
        } catch (err) {
            isErrorOccured = true;
        }
        
        // return
        return !isErrorOccured;
    };
    
    // attach to flair
    a2f('isDefined', _isDefined);
     
    /**
     * @name Args
     * @description Lightweight args pattern processing that returns a validator function to validate arguments against given arg patterns
     * @example
     *  Args(...patterns)
     * @params
     *  patterns: string(s) - multiple pattern strings, each representing one pattern set
     *                        each pattern set can take following forms:
     *                        'type, type, type, ...' OR 'name: type, name: type, name: type, ...'
     *                          type: can be following:
     *                              > special types: 'undefined' - for absence of a passed value
     *                              > expected native javascript data types like 'string', 'number', 'function', 'array', etc.
     *                              > 'function' - any function, cfunction' - constructor function and 'afunction - arrow function
     *                              > inbuilt flair object types like 'class', 'struct', 'enum', etc.
     *                              > custom flair object instance types which are checked in following order:
     *                                  >> for class instances: 
     *                                     isInstanceOf given as type
     *                                     isImplements given as interface 
     *                                     isMixed given as mixin
     *                                  >> for struct instances:
     *                                     isInstance of given as struct type
     *                          name: argument name which will be used to store extracted value by parser
     * @returns function - validator function that is configured for specified patterns
     */ 
    const _Args = (...patterns) => {
        if (patterns.length === 0) { throw _Exception.InvalidArgument('patterns', _Args); }
    
        /**
         * @description Args validator function that validates against given patterns
         * @example
         *  (...args)
         * @params
         *  args: any - multiple arguments to match against given pattern sets
         * @returns object - result object, having:
         *  raw: (array) - original arguments as passed
         *  index: (number) - index of pattern-set that matches for given arguments, -1 if no match found
         *                    if more than one patterns may match, it will stop at first match
         *  types: (string) - types which matched - e.g., string_string
         *                    this is the '_' joint string of all type definition part from the matching pattern-set
         *  isInvalid: (boolean) - to check if any match could not be achieved
         *  <name(s)>: <value(s)> - argument name as given in pattern having corresponding argument value
         *                          if a name was not given in pattern, a default unique name will be created
         *                          special names like 'raw', 'index' and 'isInvalid' cannot be used.
         */    
        let _args = (...args) => {
            // process each pattern - exit with first matching pattern
            let types = null, items = null,
                name = '', type = '',
                pIndex = -1, aIndex = -1,   // pattern index, argument index
                matched = false,
                mCount = 0, // matched arguments count of pattern
                faliedMatch = '',
                result = {
                    raw: args || [],
                    index: -1,
                    isInvalid: false,
                    error: null,
                    values: {}
                };
            if (patterns) {
                for(let pattern of patterns) { // pattern
                    pIndex++; aIndex=-1; matched = false; mCount = 0;
                    types = pattern.split(',');
                    for(let item of types) {
                        aIndex++;
                        items = item.split(':');
                        if (items.length !== 2) { 
                            name = `_${pIndex}_${aIndex}`; // e.g., _0_0 or _1_2, etc.
                            type = item.trim() || '';
                        } else {
                            name = items[0].trim() || '',
                            type = items[1].trim() || '';
                        }
                        if (aIndex > result.raw.length) { matched = false; break; }
                        if (!_is(result.raw[aIndex], type)) { matched = false; faliedMatch = name; break; }
                        result.values[name] = result.raw[aIndex]; matched = true; mCount++;
                    }
                    if (matched && mCount === types.length) {result.index = pIndex; break; }
                }
            }
    
            // set state
            result.isInvalid = (result.index === -1 ? true : false);
            result.error = (result.isInvalid ? _Exception.InvalidArgument(faliedMatch) : null);
    
            // throw helper
            result.throwOnError = (stStart) => {
                if (result.error) { throw new _Exception(result.error, stStart || _args); }
            };
    
            // return
            return Object.freeze(result);
        };
    
        // return freezed
        return Object.freeze(_args);
    };
    
    // attach to flair
    a2f('Args', _Args);
       
    /**
     * @name event
     * @description Event marker
     * @example
     *  event()
     * @params
     *  argsProcessor - args processor function, if args to be processed before event is raised
     * @returns
     *  function - returns given function or a noop function as is with an event marked tag
     */ 
    const _event = (argsProcessor) => { 
        let args = _Args('argsProcessor: undefined',
                         'argsProcessor: afunction')(argsProcessor); args.throwOnError(_event);
        argsProcessor = argsProcessor || ((...eventArgs) => { return eventArgs; });
        argsProcessor.event = true; // attach tag
        return argsProcessor;
    }
    
    // attach to flair
    a2f('event', _event);
       
    /**
     * @name nie
     * @description Not Implemented Event
     * @example
     *  nie()
     * @params
     * @returns
     */ 
    const _nie = _event(() => { throw _Exception.NotImplemented('event', _nie); });
    _nie.ni = true; // a special flag to quick check that this is a not-implemented object
    
    // attach to flair
    a2f('nie', _nie);
       
    /**
     * @name Dispatcher
     * @description Event dispatching. 
     */ 
    const Dispatcher = function(eventHost) {
        let events = {};
        eventHost = eventHost || '';
    
        // add event listener
        this.add = (event, handler) => {
            let args = _Args('event: string, handler: afunction')(event, handler); args.throwOnError(this.add);
            if (!events[event]) { events[event] = []; }
            events[event].push(handler);
        };
    
        // remove event listener
        this.remove = (event, handler) => {
            let args = _Args('event: string, handler: afunction')(event, handler); args.throwOnError(this.remove);
            if (events[event]) {
                let idx = events[event].indexOf(handler);
                if (idx !== -1) { events[event].splice(idx, 1); }
            }
        };
    
        // dispatch event
        this.dispatch = (event, eventArgs) => {
            let args = _Args('event: string')(event); args.throwOnError(this.dispatch); // note: no check for eventArgs, as it can be anything
            if (events[event]) {
                events[event].forEach(handler => {
                    // NOTE: any change here should also be done in SharedChannel where progress event is being routed across threads
                    setTimeout(() => { handler(Object.freeze({ host: eventHost, name: event, args: eventArgs || [] })); }, 0); // <-- event handler will receive this
                });
            }
        };
    
        // get number of attached listeners
        this.count = (event) => {
            let args = _Args('event: string')(event); args.throwOnError(this.count);
            return (events[event] ? events[event].length : 0);
        };
    
        // clear all handlers for all events associated with this dispatcher
        this.clear = () => {
            events = {};
        };
    };
    
    
    /**
     * @name Port
     * @description Customize configurable functionality of the core. This gives a way to configure a different component to
     *              handle some specific functionalities of the core, e.g., fetching a file on server, or loading a module on
     *              client, or handling sessionStorage, to name a few.
     *              Ports are defined by a component and handlers of required interface types can be supplied from outside
     *              as per usage requirements
     * @example
     *  Port(name)                     // @returns handler/null - if connected returns handler else null
     *  Port.define(name, members, intf)  // @returns void
     *  Port.connect(name, handler)    // @returns void
     *  Port.disconnect(name)          // @returns void
     *  Port.disconnect.all()          // @returns void
     *  Port.isDefined(name)           // @returns boolean - true/false
     *  Port.isConnected(name)         // @returns boolean - true/false
     * @params
     *  name: string - name of the port
     *  members: array of strings - having member names that are checked for their presence
     *  handler: function - a factory that return the actual handler to provide named functionality for current environment
     *  inbuilt: function - an inbuilt factory implementation of the port functionality, if nothing is configured, this implementation will be returned
     *          NOTE: Both handler and inbuilt are passed flair.options.env object to return most suited implementation of the port
     * @returns handler/boolean/void - as specified above
     */ 
    let ports_registry = {};
    const _Port = (name) => {
        if (typeof name !== 'string') { throw _Exception.InvalidArgument('name', _Port); }
        if (ports_registry[name]) {
            return (ports_registry[name].handler ? ports_registry[name].handler : ports_registry[name].inbuilt); // inbuilt could also be null if not inbuilt implementation is given
        }
        return null;
    };
    _Port.define = (name, members, inbuilt) => {
        let args = _Args('name: string, members: array, inbuilt: afunction',
                         'name: string, inbuilt: afunction',
                         'name: string, members: array',
                         'name: string')(name, members, inbuilt); args.throwOnError(_Port.define);
    
        if (ports_registry[name]) { throw _Exception.Duplicate(name, _Port.define); }
        ports_registry[name] = {
            type: (args.values.members ? 'object' : 'function'), // a port handler can be 
            members: args.values.members || null,
            handler: null,
            inbuilt: (args.values.inbuilt ? args.values.inbuilt(options.env) : null)
        };
    };
    _Port.connect = (name, handler) => {
        let args = _Args('name: string, handler: afunction')(name, handler); args.throwOnError(_Port.connect);
    
        if (!ports_registry[name]) { throw _Exception.NotFound(name, _Port.connect); } 
        let actualHandler = handler(options.env); // let it return handler as per context
        if (typeof actualHandler !== ports_registry[name].type) { throw _Exception.InvalidArgument('handler', _Port.connect); } 
        let members = ports_registry[name].members;
        if (members) { 
            for(let member of members) {
                if (typeof actualHandler[member] === 'undefined') { throw  _Exception.NotImplemented(member, _Port.connect); }
            }
        }
        ports_registry[name].handler = actualHandler;
    };
    _Port.disconnect = (name) => {
        if (typeof name !== 'string') { throw _Exception.InvalidArgument('name', _Port.disconnect); }
        if (ports_registry[name]) {
            ports_registry[name].handler = null;
        }
    };
    _Port.isDefined = (name) => {
        if (typeof name !== 'string') { throw _Exception.InvalidArgument('name', _Port.isDefined); }
        return (ports_registry[name] ? true : false);
    };
    _Port.isConnected = (name) => {
        if (typeof name !== 'string') { throw _Exception.InvalidArgument('name', _Port.isConnected); }
        return (ports_registry[name] && ports_registry[name].handler ? false : true);
    };
    
    // attach to flair
    a2f('Port', _Port, () => {
        // disconnect all ports
        for(let port in ports_registry) {
            if (ports_registry.hasOwnProperty(port)) {
                ports_registry[port].handler = null;
            }
        }
    
        // clear registry
        ports_registry = {};
    });

    /**
     * @name AssemblyLoadContext
     * @description The isolation boundary of type loading across assemblies. 
     */
    const AssemblyLoadContext = function(name, domain, defaultLoadContext, currentContexts, contexts) {
        let alcTypes = {},
            alcResources = {},
            alcRoutes = {},
            instances = {},
            asmFiles = {},
            asmNames = {},
            namespaces = {},
            isUnloaded = false,
            currentAssemblyBeingLoaded = '';
    
        // context
        this.name = name;
        this.domain = domain;
        this.isUnloaded = () => { return isUnloaded || domain.isUnloaded(); };
        this.unload = () => {
            if (!isUnloaded) {
                // mark unloaded
                isUnloaded = true;
    
                // delete from domain registry
                delete contexts[name];
    
                // dispose all active instances
                for(let instance in instances) {
                    if (instance.hasOwnProperty(instance)) {
                        _dispose(instances[instance]);
                    }
                }
    
                // clear registries
                alcTypes = {};
                asmFiles = {};
                asmNames = {};
                alcResources = {};
                alcRoutes = {};
                instances = {};
                namespaces = {};
            }
        };
        this.current = () => {
            if (this.isUnloaded()) { throw _Exception.InvalidOperation(`Context is already unloaded. (${this.name})`, this.current); }
    
            if (currentContexts.length === 0) {
                return defaultLoadContext || this; // the first content created is the default context, so in first case, it will come as null, hence return this
            } else { // return last added context
                // when a context load any assembly, it pushes itself to this list, so
                // that context become current context and all loading types will attach itself to this
                // new context, and as soon as load is completed, it removes itself.
                // Now, if for some reason, an assembly load operation itself (via some code in index.js)
                // initiate another context load operation, that will push itself on top of this context and
                // it will trickle back to this context when that secondary load is done
                // so always return from here the last added context in list
                return currentContexts[currentContexts.length - 1];
            }
        };
    
         // types
        this.registerType = (Type) => {
            if (this.isUnloaded()) { throw _Exception.InvalidOperation(`Context is already unloaded. (${this.name})`, this.registerType); }
    
            // certain types are built as instances, like interface and enum
            let name = '',
                type = '',
                typeMeta = Type[meta];
            if (typeMeta.Type) {
                name = typeMeta.Type[meta].name;
                type = typeMeta.Type[meta].type;
            } else {
                name = typeMeta.name;
                type = typeMeta.type;
            }
    
            // only valid types are allowed
            if (flairTypes.indexOf(type) === -1) { throw _Exception.InvalidArgument('Type', this.registerType); }
    
            // namespace name is already attached to it, and for all '(root)' 
            // marked types' no namespace is added, so it will automatically go to root
            let ns = name.substr(0, name.lastIndexOf('.')),
                onlyName = name.replace(ns + '.', '');
    
            // check if already registered
            if (alcTypes[name]) { throw _Exception.Duplicate(name, this.registerType); }
            if (alcResources[name]) { throw _Exception.Duplicate(`Already registered as Resource. (${name})`, this.registerType); }
            if (alcRoutes[name]) { throw _Exception.Duplicate(`Already registered as Route. (${name})`, this.registerType); }
    
            // register
            alcTypes[name] = Type;
    
            // register to namespace as well
            if (ns) {
                if (!namespaces[ns]) { namespaces[ns] = {}; }
                namespaces[ns][onlyName] = Type;
            } else { // root
                namespaces[onlyName] = Type;
            }
    
            // return namespace where it gets registered
            return ns;
        };
        this.getType = (qualifiedName) => {
            if (this.isUnloaded()) { throw _Exception.InvalidOperation(`Context is already unloaded. (${this.name})`, this.getType); }
            if (typeof qualifiedName !== 'string') { throw _Exception.InvalidArgument('qualifiedName', this.getType); }
            return alcTypes[qualifiedName] || null;
        };
        this.ensureType = (qualifiedName) => {
            return new Promise((resolve, reject) => {
                if (this.isUnloaded()) { reject(_Exception.InvalidOperation(`Context is already unloaded. (${this.name})`)); return; }
                if (typeof qualifiedName !== 'string') { reject(_Exception.InvalidArgument('qualifiedName')); return; }
        
                let Type = this.getType(qualifiedName);
                if (!Type) {
                    let asmFile = domain.resolve(qualifiedName);
                    if (asmFile) { 
                        this.loadAssembly(asmFile).then(() => {
                            Type = this.getType(qualifiedName);
                            if (!Type) {
                                reject(_Exception.OperationFailed(`Assembly could not be loaded. (${asmFile})`));
                            } else {
                                resolve(Type);
                            }
                        }).catch(reject);
                    } else {
                        reject(_Exception.NotFound(qualifiedName));
                    }
                } else {
                    resolve(Type);
                }
            });
        };
        this.allTypes = () => { 
            if (this.isUnloaded()) { throw _Exception.InvalidOperation(`Context is already unloaded. (${this.name})`, this.allTypes); }
            return Object.keys(alcTypes); 
        };
        this.execute = (info, progressListener) => {
            // NOTE: The logic goes as:
            // 1. instance of given type is created with given constructor arguments
            // 2. if the type implements IProgressReporter and progressListener is passed,
            //    it hooks progressListener to 'progress' event of instance.
            // 3. given function is then executed with given arguments
            // 4. if keepAlive is set to true, it keeps the instance for later use, using info.type as identifier
            //    if in next run, keepAlive is found true, and instance was previously created, it uses same instance
            //    if instance was kept because of previous call of keepAlive, but now in this call keepAlive is set to false
            //    after this execution it is removed from internal stored instances list
            //    if just the instance is to be removed and no func is to be called, set funcName to '' and keepAlive to false
            //    and it will not call function but just remove stored instance
    
            return new Promise((_resolve, _reject) => {
                if (this.isUnloaded()) { _reject(_Exception.InvalidOperation(`Context is already unloaded. (${this.name})`)); return; }
    
                // execution info
                info.type = info.type || '';
                info.typeArgs = info.typeArgs || [];
                info.func = info.func || '';
                info.args = info.args || [];
                info.ctx = info.ctx || {};
                info.keepAlive = (typeof info.keepAlive !== 'undefined' ? info.keepAlive : false);
                
                const getInstance = () => {
                    return new Promise((resolve, reject) => {
                        let instance = null;
                        this.ensureType(info.type).then((Type) => {
                            try {
                                instance = new Type(...info.typeArgs);
    
                                // listen to progress report, if need be
                                if (typeof progressListener === 'function' && _is(instance, 'IProgressReporter')) {
                                    instance.progress.add(progressListener);
                                }
    
                                resolve(instance);
                            } catch (err) {
                                reject(err);
                            }
                        }).catch(reject);
                    });
                };
                const runInstanceFunc = (instance) => {
                    return new Promise((resolve, reject) => {
                        let result = null;
                        result = instance[info.func](...info.args);
                        if (result && typeof result.then === 'function') {
                            result.then(resolve).catch(reject);
                        } else {
                            resolve(result);
                        }                
                    });
                };
    
                // process
                let instance = null;
                if (info.keepAlive) {
                    if (instances[info.type]) {
                        instance = instances[info.type];
                        runInstanceFunc(instance).then(_resolve).catch(_reject);
                    } else {
                        getInstance().then((obj) => {
                            instance = obj;
                            instances[info.type] = instance;
                            runInstanceFunc(instance).then(_resolve).catch(_reject);
                        }).catch(_reject);
                    }
                } else {
                    if (instances[info.type]) {
                        instance = instances[info.type];
                        if (info.func) {
                            runInstanceFunc(instance).then(_resolve).catch(_reject).finally(() => {
                                _dispose(instance);
                                delete instances[info.type];
                            });
                        } else { // special request of just removing the instance - by keeping func name as empty
                            _dispose(instance);
                            delete instances[info.type];
                            _resolve();
                        }
                    } else {
                        getInstance().then((obj) => {
                            runInstanceFunc(obj).then(_resolve).catch(_reject).finally(() => {
                                _dispose(obj);
                            });
                        }).catch(_reject);                
                    }
                }
            });
        };
    
        // namespace
        this.namespace = (name) => { 
            if (name && name === '(root)') { name = ''; }
            let source = null;
            if (name) {
                source = namespaces[name] || null;
            } else { // root
                source = namespaces;
            }
            if (source) {
                return Object.freeze(shallowCopy({}, source)); // return a freezed copy of the namespace segment
            } else {
                return null;
            }
        };
    
        // assembly
        this.currentAssemblyBeingLoaded = (value) => {
            // NOTE: called at build time, so no checking is required
            if (typeof value !== 'undefined') { 
                currentAssemblyBeingLoaded = which(value, true); // min/dev contextual pick
            }
            return currentAssemblyBeingLoaded;
        }
        const assemblyLoaded = (file, ado, alc, asmClosureVars) => {
            if (typeof file === 'string' && !asmFiles[file] && ado && alc && asmClosureVars) {
                // add to list
                asmFiles[file] = Object.freeze(new Assembly(ado, alc, asmClosureVars));
                asmNames[asmClosureVars.name] = asmFiles[file];
            }
        };
        this.getAssemblyFile = (file) => {
            let asmADO = this.domain.getAdo(file),
                file2 = file;
            if (file2.startsWith('./')) { file2 = file2.substr(2); }
            if (asmADO && asmADO.mainAssembly) { // in relation to mainAssembly
                file2 = this.domain.loadPathOf(asmADO.mainAssembly) + file2;
            } else { // in relation to start location
                file2 = this.domain.root() + file2;
            }
            return file2;
        };
        this.getAssemblyAssetsPath = (file) => {
            let file2 = this.getAssemblyFile(file);
            if (file2.indexOf('.min.js') !== -1) {
                return file2.replace('.min.js', '/');
            } else {
                return file2.replace('.js', '/');
            }
        };
        this.loadAssembly = (file) => {
            return new Promise((resolve, reject) => {
                if (this.isUnloaded()) { reject(_Exception.InvalidOperation(`Context is already unloaded. (${this.name})`)); return; }
    
                if (!asmFiles[file] && this.currentAssemblyBeingLoaded() !== file) { // load only when it is not already loaded (or not already being loaded) in this load context
                    // set this context as current context, so all types being loaded in this assembly will get attached to this context;
                    currentContexts.push(this);
    
                    // get resolved file name of this assembly
                    let asmADO = this.domain.getAdo(file),
                        file2 = this.getAssemblyFile(file);
    
                    // uncache module, so it's types get to register again with this new context
                    uncacheModule(file2);
    
                    // load module
                    loadModule(file2, asmADO.name, true).then((asmFactory) => {
                        // run asm factory to load assembly
                        asmFactory(flair, file2).then((asmClosureVars) => {
                            // current context where this was loaded
                            let loadedInContext = this.current();
    
                            // remove this from current context list
                            currentContexts.pop();
    
                            // assembly loaded
                            assemblyLoaded(file, asmADO, loadedInContext, asmClosureVars);
    
                            // resolve
                            resolve();
                        }).catch((err) => {
                            // remove this from current context list
                            currentContexts.pop();
    
                            // reject
                            reject(err);
                        });
                    }).catch((err) => {
                        // remove this from current context list
                        currentContexts.pop();
    
                        // reject
                        reject(err);
                    });
                } else {
                    resolve();
                }
            });        
        };  
        this.loadBundledAssembly = (file, loadedFile, asmFactory) => {
            if (this.isUnloaded()) { throw _Exception.InvalidOperation(`Context is already unloaded. (${this.name})`); }
    
            let asmClosureVars = {};
    
            // set this context as current context, so all types being loaded in this assembly will get attached to this context;
            currentContexts.push(this);
    
            // get resolved file name of this assembly, in ths case it is loadedFile
            let file2 = loadedFile;
            try {
                // run given asm factory (sync)
                // this means embedded types built-in here in this factory does not support await 
                // type calls, as this factory's outer closure is not an async function
                asmClosureVars = asmFactory(flair, file2); // let it throw error, if any
    
                // current context where this was loaded
                let loadedInContext = this.current();
    
                // remove this from current context list
                currentContexts.pop();
    
                // assembly loaded
                let asmADO = this.domain.getAdo(file);
                assemblyLoaded(file, asmADO, loadedInContext, asmClosureVars);
            } finally {
                // remove this from current context list
                currentContexts.pop();
            }
                
            // return
            return asmClosureVars;
        };  
        this.getAssembly = (file) => {
            if (this.isUnloaded()) { throw _Exception.InvalidOperation(`Context is already unloaded. (${this.name})`, this.getAssembly); }
            if (typeof file !== 'string') { throw _Exception.InvalidArgument('file', this.getAssembly); }
            return asmFiles[file] || null;
        };
        this.getAssemblyByName = (name) => {
            if (this.isUnloaded()) { throw _Exception.InvalidOperation(`Context is already unloaded. (${this.name})`, this.getAssemblyByName); }
            if (typeof name !== 'string') { throw _Exception.InvalidArgument('name', this.getAssemblyByName); }
            return asmNames[name] || null;
        };
        this.allAssemblies = (isRaw) => { 
            if (this.isUnloaded()) { throw _Exception.InvalidOperation(`Context is already unloaded. (${this.name})`, this.allAssemblies); }
            if (isRaw) {
                let all = [],
                    keys = Object.keys(asmFiles);
                for(let r of keys) { all.push(asmFiles[r]); }
                return all;
            } else {
                return Object.keys(asmFiles);
            }
        };
    
        // resources
        this.registerResource = (rdo) => {
            if (this.isUnloaded()) { throw _Exception.InvalidOperation(`Context is already unloaded. (${this.name})`, this.registerResource); }
    
            if (typeof rdo.name !== 'string' || rdo.name === '' ||
                typeof rdo.encodingType !== 'string' || rdo.encodingType === '' ||
                typeof rdo.file !== 'string' || rdo.file === '' ||
                typeof rdo.data !== 'string' || rdo.data === '') {
                throw _Exception.InvalidArgument('rdo', this.registerResource);
            }
    
            // namespace name is already attached to it, and for all '(root)'    
            // marked types' no namespace is added, so it will automatically go to root
            let ns = rdo.name.substr(0, rdo.name.lastIndexOf('.')),
                onlyName = rdo.name.replace(ns + '.', '');
    
            // check if already registered
            if (alcResources[rdo.name]) { throw _Exception.Duplicate(rdo.name, this.registerResource); }
            if (alcTypes[rdo.name]) { throw _Exception.Duplicate(`Already registered as Type. (${rdo.name})`, this.registerResource); }
            if (alcRoutes[rdo.name]) { throw _Exception.Duplicate(`Already registered as Route. (${rdo.name})`, this.registerResource); }
    
            // register
            alcResources[rdo.name] = Object.freeze(new Resource(rdo, ns, this));
    
            // register to namespace as well
            if (ns) {
                if (!namespaces[ns]) { namespaces[ns] = {}; }
                namespaces[ns][onlyName] =  alcResources[rdo.name];
            } else { // root
                namespaces[onlyName] =  alcResources[rdo.name];
            }        
    
            // return namespace where it gets registered
            return ns;
        };
        this.getResource = (qualifiedName) => {
            if (this.isUnloaded()) { throw _Exception.InvalidOperation(`Context is already unloaded. (${this.name})`, this.getResource); }
            if (typeof qualifiedName !== 'string') { throw _Exception.InvalidArgument('qualifiedName', this.getResource); }
            return alcResources[qualifiedName] || null;
        };     
        this.allResources = (isRaw) => { 
            if (this.isUnloaded()) { throw _Exception.InvalidOperation(`Context is already unloaded. (${this.name})`, this.allResources); }
            if (isRaw) {
                let all = [],
                    keys = Object.keys(alcResources);
                for(let r of keys) { all.push(alcResources[r]); }
                return all;
            } else {
                return Object.keys(alcResources);
            }
        };
    
        // routes
        this.registerRoutes = (routes, asmFile) => {
            if (this.isUnloaded()) { throw _Exception.InvalidOperation(`Context is already unloaded. (${this.name})`, this.registerRoutes); }
    
            // process each route
            for(let route of routes) {
                if (typeof route.name !== 'string' || route.name === '' ||
                    typeof route.index !== 'number' ||
                    typeof route.mount !== 'string' || route.mount === '' ||
                    typeof route.path !== 'string' || route.path === '' ||
                    typeof route.handler !== 'string' || route.handler === '') {
                    throw _Exception.InvalidArgument('route: ' + route.name, this.registerRoutes);
                }
    
                // namespace name is already attached to it, and for all '(root)'    
                // marked types' no namespace is added, so it will automatically go to root
                let ns = route.name.substr(0, route.name.lastIndexOf('.')),
                    onlyName = route.name.replace(ns + '.', '');
    
                // check if already registered
                if (alcRoutes[route.name]) { throw _Exception.Duplicate(route.name, this.registerRoutes); }
                if (alcTypes[route.name]) { throw _Exception.Duplicate(`Already registered as Type. (${route.name})`, this.registerRoutes); }
                if (alcResources[route.name]) { throw _Exception.Duplicate(`Already registered as Resource. (${route.name})`, this.registerRoutes); }
    
                // register
                alcRoutes[route.name] = Object.freeze(new Route(asmFile, route, ns, this));
    
                // register to namespace as well
                if (ns) {
                    if (!namespaces[ns]) { namespaces[ns] = {}; }
                    namespaces[ns][onlyName] =  alcRoutes[route.name];
                } else { // root
                    namespaces[onlyName] =  alcRoutes[route.name];
                }        
            }
        };
        this.getRoute = (qualifiedName) => {
            if (this.isUnloaded()) { throw _Exception.InvalidOperation(`Context is already unloaded. (${this.name})`, this.getRoute); }
            if (typeof qualifiedName !== 'string') { throw _Exception.InvalidArgument('qualifiedName', this.getRoute); }
            return alcRoutes[qualifiedName] || null;
        };     
        this.allRoutes = (isRaw) => { 
            if (this.isUnloaded()) { throw _Exception.InvalidOperation(`Context is already unloaded. (${this.name})`, this.allRoutes); }
            if (isRaw) {
                let all = [],
                    keys = Object.keys(alcRoutes);
                for(let r of keys) { all.push(alcRoutes[r]); }
                return all;
            } else {
                return Object.keys(alcRoutes);
            }
        };
        
        // state (just to be in sync with proxy)
        this.isBusy = () => { return false; }
        this.hasActiveInstances = () => { return Object.keys(instances).length; }
    };
      
    /**
     * @name Assembly
     * @description Assembly object.
     */ 
    const Assembly = function (ado, alc, asmClosureVars) {
        this.context = alc;
        this.domain = alc.domain;
    
        this.name = ado.name;
        this.file = ado.file;
        this.mainAssembly = ado.mainAssembly;
        this.desc = ado.desc;
        this.title = ado.title;
        this.version = ado.version;
        this.copyright = ado.copyright;
        this.license = ado.license;
        this.lupdate = ado.lupdate;
        this.builder = ado.builder.name;
        this.builderVersion = ado.builder.version;
        this.format = Object.freeze({
            name: ado.builder.format,
            version: ado.builder.formatVersion,
            contains: ado.builder.contains.slice()
        });
       
        // types
        this.types = () => { return ado.types.slice(); }
        this.getType = (qualifiedName) => {
            if (typeof qualifiedName !== 'string') { throw _Exception.InvalidArgument('qualifiedName', this.getType); }
            if (ado.types.indexOf(qualifiedName) === -1) { throw _Exception.NotFound(qualifiedName, this.getType); }
            return this.context.getType(qualifiedName);
        };
        this.getTypes = (intf) => {
            if (['string', 'interface'] !== _typeOf(intf)) { throw _Exception.InvalidArgument('intf', this.getTypes); }
            let result = [];
            for(let qualifiedName of ado.types) {
                try {
                    let Type = this.context.getType(qualifiedName);
                    if (_isImplements(Type, intf)) {
                        result.push(Type);
                    }
                } catch (err) {
                    // ignore as for incompatible types it will throw, and that's ok in this context
                }
            }
            return result;
        };
    
        // resources
        this.resources = () => { return ado.resources.slice(); }
        this.getResource = (qualifiedName) => {
            if (typeof qualifiedName !== 'string') { throw _Exception.InvalidArgument('qualifiedName', this.getResource); }
            if (ado.resources.indexOf(qualifiedName) === -1) { throw _Exception.NotFound(qualifiedName, this.getResource); }
            return this.context.getResource(qualifiedName);
        };
    
        // routes
        this.routes = () => { return ado.routes.slice(); }
        this.getRoute = (qualifiedName) => {
            if (typeof qualifiedName !== 'string') { throw _Exception.InvalidArgument('qualifiedName', this.getRoute); }
            if (ado.routes.indexOf(qualifiedName) === -1) { throw _Exception.NotFound(qualifiedName, this.getRoute); }
            return this.context.getRoute(qualifiedName);
        };
    
        // assets
        this.assets = () => { return ado.assets.slice(); }
        this.path = () => {
            return this.alc.getAssemblyFile(this.file);
        };
        this.assetsPath = () => {
            return alc.getAssemblyAssetsPath(this.file);
        };
        this.getAssetFilePath = (file) => { 
            if (typeof file !== 'string') { throw _Exception.InvalidArgument('file', this.getAssetFilePath); }
    
            // file: will be in local context of assembly, e.g., <asmFolder>/(assets)/myCSS.css will be referred everywhere as './myCSS.css'
            // passing ./myCSS.css to this method will return './<asmFolder>/myCSS.css'
            let astFile = file.replace('./', this.assetsPath());
            if (ado.assets.indexOf(file) === -1) {  throw _Exception.NotFound(astFile, this.getAssetFilePath); }
            return astFile;        
        };
        this.getLocaleFilePath = (locale, file) => {
            if (typeof locale !== 'string') { throw _Exception.InvalidArgument('locale', this.getLocaleFilePath); }
            if (typeof file !== 'string') { throw _Exception.InvalidArgument('file', this.getLocaleFilePath); }
    
            // file: will be in local context of assembly, e.g., <asmFolder>/(locale)/strings.json will be referred everywhere as './strings.json'
            // passing ./strings.json to this method will return './<asmFolder>/locales/<given-locale>/strings.json'
            let localeFile = file.replace('./', this.assetsPath() + 'locales/' + locale + '/');
            return localeFile;        
        };
    
        // config
        this.config = () => { return asmClosureVars.config; }
        
        // settings
        this.settings = () => { return asmClosureVars.settings; }
    };
      
    /**
     * @name Resource
     * @description Resource object.
     */ 
    const Resource = function(rdo, ns, alc) {
        this.context = alc;
    
        this.name = rdo.name;
        this.ns = ns;
        this.assembly = () => { return alc.getAssembly(which(rdo.asmFile, true)) || null; };
        this.encodingType = rdo.encodingType;
        this.file = rdo.file;
        this.type = rdo.file.substr(rdo.file.lastIndexOf('.') + 1).toLowerCase();
        this.data = rdo.data;
    
        try {
            // decode data (rdo.data is base64 encoded string, added by build engine)
            if (rdo.encodingType.indexOf('utf8;') !== -1) {
                if (isServer) {
                    let buff = Buffer.from(rdo.data, 'base64');
                    this.data = buff.toString('utf8');
                } else { // client
                    this.data = b64DecodeUnicode(rdo.data); 
                }
            } else { // binary
                if (isServer) {
                    this.data = Buffer.from(rdo.data, 'base64');
                } // else no change on client
            }
        } catch (err) {
            throw _Exception.OperationFailed(`Resource data could not be decoded. (${rdo.name})`, Resource);
        }
    
        // special case of JSON
        if (this.type === 'json') {
            this.data = Object.freeze(JSON.parse(this.data));
        }
    };
      
    /**
     * @name Route
     * @description Route object.
     */ 
    const Route = function(asmFile, route, ns, alc) {
        this.context = alc;
    
        this.name = route.name;
        this.ns = ns;
        this.assembly = () => { return alc.getAssembly(asmFile) || null; };
        this.index = route.index;
        this.mount = route.mount;
        this.verbs = route.verbs || (isServer ? ['get'] : ['view']); // default verb
        this.path = route.path;
        this.handler = route.handler;
    };
      
    /**
     * @name SharedChannel
     * @description Shared channel that communicates between two threads.
     */
    const SharedChannel = function(allADOs, onError) { 
        let openMessages = {}, // {id: messageId, promise: promise }
            openMessagesCount = 0,
            channelPort = null,
            wk = null;     
    
        // NOTE: This function's script is loaded independently by worker thread constructor as text/code.
        const remoteMessageHandler = function() {
            let isServer = ('<<{{isServer}}>>' === 'true' ? true : false), // eslint-disable-line no-constant-condition
                port = null;
            // let ados = JSON.parse('<<{{ados}}>>');
    
            // build communication pipeline between main thread and worker thread
            const onMessageFromMain = (e) => { // message received from main thread
                let funcName = e.data.func,
                    func = null;
                const postSuccessToMain = (data) => {
                    port.postMessage({
                        data: {
                            id: e.data.id,
                            isComplete: true,
                            isError: false,
                            error: null,
                            ctx: e.data.ctx,
                            result: (e.data.returnsAsIs ? data : (data ? true : false))
                        }
                    }); 
                };
                const postProgressToMain = (progressData) => {
                    port.postMessage({
                        data: {
                            id: e.data.id,
                            isComplete: false,
                            isError: false,
                            error: null,
                            ctx: e.data.ctx,
                            result: progressData
                        }
                    }); 
                };            
                const postErrorToMain = (err) => {
                    port.postMessage({
                        data: {
                            id: e.data.id,
                            isComplete: true,
                            isError: true,
                            error: (err ? err.toString() : 'UnknownError'),
                            ctx: e.data.ctx,
                            result: null
                        }
                    });  
                };
                const runFunction = () => {
                    try {
                        // special case
                        if (e.data.obj === 'alc' && funcName === 'execute') {
                            e.data.args.push((e) => { // progressListener
                                postProgressToMain(e.args);
                            });
                        }
                        let result = func(...e.data.args);
                        if (result && typeof result.then === 'function') {
                            result.then(postSuccessToMain).catch(postErrorToMain);
                        } else {
                            postSuccessToMain(result);
                        }
                    } catch (err) {
                        postErrorToMain(err);
                    }
                };    
    
                // run
                switch(e.data.obj) {
                    case 'ad': func = AppDomain[funcName]; runFunction(); break;
                    case 'alc': func = AppDomain.contexts(e.data.name)[funcName]; runFunction(); break;
                }
            };
    
            // initialize environment
            if (isServer) {
                // load entry point
                require('<<{{entryPoint}}>>');
    
                // plumb to parent port for private port connection
                let parentPort = require('worker_threads').parentPort;
                port = parentPort;
                parentPort.once('message', (value) => {
                    port = value.privatePort;
                    port.on('message', onMessageFromMain);
                });
            } else {
                // load requirejs and entry point
                importScripts('<<{{requirejs}}>>', '<<{{entryPoint}}>>');
    
                // plumb to private port 
                port = this;
                port.onmessage = onMessageFromMain;
            }
        };
        let remoteMessageHandlerScript = remoteMessageHandler.toString().replace('<<{{entryPoint}}>>', AppDomain.entryPoint());
        remoteMessageHandlerScript = remoteMessageHandlerScript.replace('<<{{requirejs}}>>', getLoadedScript('require.js', 'require.min.js')); // dev/min file
        remoteMessageHandlerScript = remoteMessageHandlerScript.replace('<<{{isServer}}>>', isServer.toString());
        // remoteMessageHandlerScript = remoteMessageHandlerScript.replace('<<{{ados}}>>', JSON.stringify(allADOs));
        remoteMessageHandlerScript = `(${remoteMessageHandlerScript})();`
        // NOTE: script/end
    
        const postMessageToWorker = (objId, name, returnsAsIs, func, args, ctx, progressListener) => { // async message sent to worker thread
            return new Promise((resolve, reject) => {
                // store message for post processing handling
                let messageId = guid();
                openMessages[messageId] = {
                    resolve: resolve,
                    reject: reject,
                    progressListener: progressListener
                };
                openMessagesCount++;
                
                // post message to worker
                wk.postMessage({
                    data: {
                        id: messageId,
                        obj: objId,
                        name: name,
                        returnsAsIs: returnsAsIs,
                        ctx: ctx || {},
                        func: func,
                        args: ((args && Array.isArray(args)) ? args : [])
                    }
                });
            });
        };
        const onMessageFromWorker = (e) => { // async response received from worker thread
            if (openMessages[e.data.id]) {
                // pick message
                let msg = openMessages[e.data.id];
    
                if (e.data.isComplete) { // done
                    delete openMessages[e.data.id];
                    openMessagesCount--;
    
                    // resolve/reject 
                    if (e.data.isError) {
                        msg.reject(e.data.error);
                    } else {
                        msg.resolve(Object.freeze({
                            ctx: e.data.ctx,
                            result: e.data.result
                        }));
                    }
                } else { // progress
                    if (typeof progressListener === 'function' && msg.progressListener) {
                        // should match with Dispatcher's dispatch event style of passing data
                        setTimeout(() => { msg.progressListener(Object.freeze({ host: (e.data.ctx._ ? e.data.ctx._.host : ''), name: 'progress', args: e.data.result })); }, 0); // <-- event handler will receive this
                    }
                }
            } else { // unsolicited message
                onError(`Unknown operation is not supported. (${e.data.id})`);
            }
        };
    
        // create new worker
        if (isServer) {
            const { Worker, MessageChannel } = require('worker_threads');
            wk = new Worker(remoteMessageHandlerScript, {
                eval: true,
                workerData: {
                    argv: process.argv
                }
            });
    
            // create private channel
            const subChannel = new MessageChannel();
            wk.postMessage({ privatePort: subChannel.port1 }, [subChannel.port1])
            subChannel.port2.on('error', onError);
            subChannel.port2.on('message', onMessageFromWorker);
        } else { // client
            let blob = new Blob([remoteMessageHandlerScript]),
                blobURL = window.URL.createObjectURL(blob, {
                    type: 'application/javascript; charset=utf-8'
                });
            wk = new window.Worker(blobURL);
            wk.onmessage = onMessageFromWorker;
            wk.onerror = onError;
        }
    
        // run something in worker thread
        this.remoteCall = postMessageToWorker;
    
        // close channel
        this.close = () => {
            if (isServer) { 
                channelPort.close(); 
                wk.unref();
            }
            wk.terminate();
        };
    
        // state
        this.isBusy = () => { return openMessagesCount; }
    };
      
    /**
     * @name AppDomainProxy
     * @description Proxy to AppDomain that is created inside other worker.
     * @example
     *  
     */
    const AppDomainProxy = function(name, domains, allADOs) {
        let isUnloaded = false,
            contextProxies = {};
    
        // shared communication channel between main and worker thread
        let channel = new SharedChannel(allADOs, (err) => {  // eslint-disable-line no-unused-vars
            throw _Exception.OperationFailed('Remote operation failed.', err); 
        });
    
        // app domain
        this.name = name;
        this.isRemote = true;
        this.isUnloaded = () => { return isUnloaded; };
        this.unload = () => {
            // this initiates unloading of secondary thread
            if (!isUnloaded) {
                // mark unloaded
                isUnloaded = true;
    
                // remove from domains list
                delete domains[name];
    
                // clear list
                contextProxies = {};
    
                // unload
                channel.remoteCall('ad', '', false, 'unload').finally(() => {
                    channel.close();
                });
            }
        };
    
        // assembly load context
        this.context = Object.freeze(new AssemblyLoadContextProxy('default', this, channel));
        this.contexts = (name) => { return contextProxies[name] || null; }    
        this.createContext = (name) => {
            return new Promise((resolve, reject) => {
                if(typeof name !== 'string' || (name && name === 'default') || contextProxies[name]) { reject(_Exception.InvalidArguments('name')); return; }
                channel.remoteCall('ad', '', false, 'createContext', [name]).then((state) => {
                    if (state) { // state is true, if context was created
                        let alcp = Object.freeze(new AssemblyLoadContextProxy(name, this, channel));
                        contextProxies[name] = alcp;
                        resolve(alcp);
                    } else {
                        reject(_Exception.OperationFailed('Context could not be created.'));
                    }
                }).catch(reject);
            });
        };
    
        // scripts
        this.loadScripts = (...scripts) => {
            if (this.isUnloaded()) { throw _Exception.InvalidOperation(`AppDomain is already unloaded. (${this.name})`, this.loadScripts); }
            return channel.remoteCall('ad', '', false, 'loadScripts', scripts);
        };
    };
      
    /**
     * @name AssemblyLoadContextProxy
     * @description Proxy of the AssemblyLoadContext that is created inside other AppDomain.
     */
    const AssemblyLoadContextProxy = function(name, domainProxy, channel) {
        let isUnloaded = false;
    
        // context
        this.name = name;
        this.domain = domainProxy;
        this.isUnloaded = () => { return isUnloaded || domainProxy.isUnloaded(); };
        this.unload = () => {
            if (!isUnloaded) {
                // mark unloaded
                isUnloaded = true;
    
                // initiate remote unload
                channel.remoteCall('alc', name, false, 'unload');
            }
        };
    
        // types
        this.execute = (info, progressListener) => { // check AssemblyLoadContext.execute for greater details about 'info' and others
            if (this.isUnloaded()) { throw _Exception.InvalidOperation(`Context is already unloaded. (${this.name})`, this.execute); }
    
            // extract context, and add internal context
            let ctx = info.ctx || {};
            ctx._ = {
                host: info.type
            };
            return channel.remoteCall('alc', name, true, 'execute', [info], ctx, progressListener); // info.type is passed in context, so progress event's host is set properly
        };
    
        // assembly
        this.loadAssembly = (file) => {
            if (this.isUnloaded()) { throw _Exception.InvalidOperation(`Context is already unloaded. (${this.name})`, this.loadAssembly); }
            return channel.remoteCall('alc', name, false, 'loadAssembly', [file]);
        };  
        
        // state
        this.isBusy = () => { 
            if (this.isUnloaded()) { throw _Exception.InvalidOperation(`Context is already unloaded. (${this.name})`, this.isBusy); }
            return channel.isBusy(); 
        };
        this.hasActiveInstances = () => { 
            channel.remoteCall('alc', name, false, 'hasActiveInstances');
        };
     };
      
    /**
     * @name AppDomain
     * @description Thread level isolation.
     * @example
     *  
     */
    const AppDomain = function(name) {
        let asmFiles = {},
            asmTypes = {}, // lists all Types and Resource Types
            domains = {},
            contexts = {},
            currentContexts = [],
            allADOs = [],
            loadPaths = {},
            entryPoint = '',
            rootPath = '',
            configFileJSON = null,
            app = null,
            host = null,
            defaultLoadContext = null,
            unloadDefaultContext = null,
            isUnloaded = false,
            isBooted = false;
        
        // app domain
        domains[name] = this;
        this.name = name;
        this.isRemote = false;
        this.isUnloaded = () => { return isUnloaded; };
        this.unload = async () => {
            if (!isUnloaded) {
                // mark unloaded
                isUnloaded = true;
    
                // stop app 
                if (app && typeof app.stop === 'function') { await app.stop(); _dispose(app); }
    
                // stop host 
                if (host && typeof host.stop === 'function') { await host.stop(); _dispose(host); }
    
                // unload all contexts of this domain, including default one (async)
                for(let context in contexts) {
                    if (contexts.hasOwnProperty(context)) {
                        if (typeof contexts[context].unload === 'function') {
                            contexts[context].unload();
                        }
                    }
                }
                unloadDefaultContext();
    
                // unload all domains, including this one
                for(let domain in domains) {
                    if (domains.hasOwnProperty(domain) && domains[domain] !== this) {
                        domains[domain].unload();
                    }
                }
    
                // clear registries and vars
                asmFiles = {},
                asmTypes = {};
                contexts = {};
                domains = {};
                currentContexts = [];
                allADOs = [];
                loadPaths = {};
                entryPoint = '';
                rootPath = '';
                configFileJSON = null;
                app = null;
                host = null;
                defaultLoadContext = null;
                unloadDefaultContext = null;
            }
        };
        this.createDomain = (name) => {
            return new Promise((resolve, reject) => {
                if(typeof name !== 'string' || (name && name === 'default') || domains[name]) { reject(_Exception.InvalidArguments('name')); return; }
                let proxy = Object.freeze(new AppDomainProxy(name, domains, allADOs));
                domains[name] = proxy;
                resolve(proxy);
            });
        };
        this.domains = (name) => { return domains[name] || null; }
       
        // assembly load context
        const setNewDefaultContext = () => {
            defaultLoadContext = new AssemblyLoadContext('default', this, null, currentContexts, contexts),
            unloadDefaultContext = defaultLoadContext.unload;
            delete defaultLoadContext.unload; // default load context cannot be unloaded directly, unless app domain is unloaded
            defaultLoadContext = Object.freeze(defaultLoadContext);
            contexts[defaultLoadContext.name] = defaultLoadContext;
            return defaultLoadContext;
        };
        this.context = setNewDefaultContext();
        this.contexts = (name) => { return contexts[name] || null; }
        this.createContext = (name) => {
            return new Promise((resolve, reject) => {
                if(typeof name !== 'string' || (name && name === 'default') || contexts[name]) { reject(_Exception.InvalidArguments('name')); return; }
                let alc = Object.freeze(new AssemblyLoadContext(name, this, defaultLoadContext, currentContexts, contexts));
                contexts[name] = alc;
                resolve(alc);
            });
        };
    
        // ados
        this.registerAdo = (ado) => {
            if (typeof ado === 'string') { ado = JSON.parse(ado); }
    
            // validate
            if (_typeOf(ado.types) !== 'array' || 
                _typeOf(ado.resources) !== 'array' ||
                _typeOf(ado.routes) !== 'array' ||
                _typeOf(ado.assets) !== 'array' ||
                typeof ado.name !== 'string' ||
                typeof ado.file !== 'string' || ado.file === '') {
                throw _Exception.InvalidArgument('ado', this.registerAdo);
            }
    
            // register (no overwrite ever)
            ado.file = which(ado.file, true); // min/dev contextual pick
            if (!asmFiles[ado.file]) {
                asmFiles[ado.file] = Object.freeze(ado);
    
                // flatten types
                ado.types.forEach(qualifiedName => {
                    // qualified names across anywhere should be unique
                    if (asmTypes[qualifiedName]) {
                        throw _Exception.Duplicate(qualifiedName, this.registerAdo);
                    } else {
                        asmTypes[qualifiedName] = ado.file; // means this type can be loaded from this assembly 
                    }
                });
    
                // flatten resources
                ado.resources.forEach(qualifiedName => {
                    // qualified names across anywhere should be unique
                    if (asmTypes[qualifiedName]) {
                        throw _Exception.Duplicate(qualifiedName, this.registerAdo);
                    } else {
                        asmTypes[qualifiedName] = ado.file; // means this resource can be loaded from this assembly
                    }
                });
                    
                // register routes
                this.context.registerRoutes(ado.routes, ado.file);
    
                // store raw, for later use and reference
                allADOs.push(ado);
            }  
        };
        this.getAdo = (file) => {
            if (typeof file !== 'string') { throw _Exception.InvalidArgument('file', this.getAdo); }
            return asmFiles[file] || null;
        };
        this.allAdos = () => { return Object.keys(asmFiles); }
    
        // types
        this.resolve = (qualifiedName) => {
            if (typeof qualifiedName !== 'string') { throw _Exception.InvalidArgument('qualifiedName', this.resolve); }
            return asmTypes[qualifiedName] || null; // gives the assembly file name where this type reside     
        };
        this.allTypes = () => { return Object.keys(asmTypes); }
    
        // app domain start/restart
        this.boot = async (__entryPoint, __config) => {
            __config = __config || this.config();
            __entryPoint = __entryPoint || this.entryPoint();
    
            // don't boot if bootEngine is not configured
            if (!settings.bootEngine) {
                console.log('No boot engine is configured, boot aborted.'); // eslint-disable-line no-console
                return false; 
            }
    
            // don't boot if entry point is not defined
            if (!__entryPoint) { 
                console.log('No entry point defined, boot aborted.'); // eslint-disable-line no-console
                return false; 
            }
    
            // this is a place where all basic settings are done on start time
            // and now ready to start boot engine
            // also, this is called when app wants to restart
            // in that case, it do the same operations again
    
            // if this is a restart scenario, these will exist
            if (isBooted) { // if already booted, unload domain first
                await this.unload();
                isUnloaded = false; // so for next unload it remains same as on first load
    
                // initialize new default load context (for reboot context only)
                setNewDefaultContext();
            }
    
            // set root
            this.root(isServer ? process.cwd() : './');
    
            // set entry point, if specified, otherwise ignore
            if (__entryPoint) {
                this.entryPoint(__entryPoint);
            }
    
            // load config, if specified, otherwise ignore
            if (__config) {
                await this.config(__config);
            }
    
            // boot 
            let be = await _include(settings.bootEngine);
            if (!be) { 
                console.log('Could not load configured boot engine, boot aborted.'); // eslint-disable-line no-console
                return false; 
            }
            isBooted = await be.start(); 
    
            // return
            return isBooted;
        };
    
        // set onces, read many times
        this.config = (configFile) => {
            if (!configFileJSON && configFile) { // load only when not already loaded
                return new Promise((resolve, reject) => {
                    _include(configFile).then((json) => {
                        configFileJSON = json;
                        resolve(Object.assign({}, configFileJSON)); // return a copy
                    }).catch(reject);
                });
            } else {
                if (configFileJSON) {
                    return Object.assign({}, configFileJSON); // return a copy
                }
                return null;
            }
        };
        this.entryPoint = (file) => {
            if (typeof file === 'string' && !entryPoint) { entryPoint = file; }
            return entryPoint;
        };
        this.app = (appObj) => {
            if (appObj && !app) { app = appObj; }
            return app;
        };
        this.host = (hostObj) => {
            if (hostObj) { host = hostObj; }
            return host;
        };
        this.loadPathOf = (file, path) => {
            if (typeof file !== 'string') { throw _Exception.InvalidArgument('file', this.loadPath); }
            if (path) { // set
                if (!loadPaths[file]) {
                    if (!path.endsWith('/')) { path += '/'; }
                    loadPaths[file] = path;
                }
            }
            return loadPaths[file] || '';
        };
        this.root = (path) => {
            if (typeof path === 'string' && !rootPath) { 
                rootPath = path; 
                if (!rootPath.endsWith('/')) { rootPath += '/'; }
            }
            return rootPath;
        };
        this.resolvePath = (path) => {
            if (typeof path !== 'string') { throw _Exception.InvalidArgument('path', this.resolvePath); }
            return path.replace('./', this.root());
        };
    
        // scripts
        this.loadScripts = (...scripts) => {
            return new Promise((resolve, reject) => {
                try {
                    _bring(scripts, () => {
                        resolve(); // resolve without passing anything
                    });
                } catch (err) {
                    reject(err);
                }
            });
        };
    
        // error router
        this.onError = (err) => {
            if (host) {
                host.raiseError(err);
            } else {
                throw err;
            }
        };
    };
    
    // build default app domain
    let defaultAppDomain = new AppDomain('default'),
        unloadDefaultAppDomain = defaultAppDomain.unload;
    delete defaultAppDomain.unload; // default app domain cannot be unloaded directly
    
    const _AppDomain = defaultAppDomain;
    
    // attach to flair
    a2f('AppDomain', _AppDomain, () => {
        unloadDefaultAppDomain(); // unload default app domain
    });
      

    /**
     * @name getAttr
     * @description Gets the attributes for given object or Type.
     * @example
     *  getAttr(obj, name, attrName)
     * @params
     *  obj: object - flair object instance or flair Type that needs to be checked
     *  memberName: string - when passed is flair object instance - member name for which attributes are to be read 
     *                 when passed is flair type - attribute name - if any specific attribute needs to be read (it will read all when this is null)
     *  attrName: string - if any specific attribute needs to be read (it will read all when this is null)
     * @returns array of attributes information objects { name, isCustom, args, type }
     *          name: name of the attribute
     *          isCustom: true/false - if this is a custom attribute
     *          args: attribute arguments
     *          type: name of the Type (in inheritance hierarchy) where this attribute comes from (when a type is inherited, attributes can be applied anywhere in hierarchy)
     */ 
    const _getAttr = (obj, memberName, attrName) => {
        let args = _Args('obj: flairinstance, memberName: string',
                         'obj: flairinstance, memberName: string, attrName: string',
                         'obj: flairtype',
                         'obj: flairtype, attrName: string')(obj, memberName, attrName); args.throwOnError(_getAttr);
    
        let result = [],
            objMeta = obj[meta],
            found_attrs = null,
            found_attr = null;
    
        if (!args.values.attrName) { // all
            if (args.index > 1) { // type
                found_attrs = objMeta.attrs.type.all().current();
            } else { // instance
                found_attrs = objMeta.attrs.members.all(args.values.memberName).current();
            }
            if (found_attrs) { result.push(...sieve(found_attrs, 'name, isCustom, args, type', true)); }
        } else { // specific
            if (args.index > 1) { // type
                found_attr = objMeta.attrs.type.probe(args.values.attrName).current();
            } else { // instance
                found_attr = objMeta.attrs.members.probe(args.values.attrName, args.values.memberName).current();
            }
            if (found_attr) { result.push(sieve(found_attr, 'name, isCustom, args, type', true)); }
        }
    
        // return
        return result;
    };
    
    // attach to flair
    a2f('getAttr', _getAttr);
    
    /**
     * @name getAssembly
     * @description Gets the assembly of a given flair type/instance
     * @example
     *  _getAssembly(Type)
     * @params
     *  Type: type/instance/string - flair type or instance whose assembly is required
     *                               qualified type name, if it is needed to know in which assembly this exists
     *                               assembly name, if assembly is to be looked for by assembly name
     *                               (since this is also string, this must be enclosed in [] to represent this is assembly name and not qualified type name)
     *                               (if assembly is not loaded, it will return null)
     * @returns object - assembly object
     */ 
    const _getAssembly = (Type) => { 
        let args = _Args('Type: flairtype',
                         'Type: flairinstance',
                         'Type: string')(Type); args.throwOnError(_getAssembly);
    
        let result = null,
            asmFile = '',
            asmName = '';
        switch(args.index) {
            case 0: // type
                result = Type[meta].assembly(); break;
            case 1: // instance
                result = Type[meta].Type[meta].assembly(); break;
            case 2: // qualifiedName or assembly name
                if (Type.startsWith('[') && Type.endsWith(']')) { // assembly name
                    asmName = Type.substr(1, Type.length - 2); // remove [ and ]
                    result = _AppDomain.context.getAssemblyByName(asmName);
                } else { // qualified type name
                    asmFile = _AppDomain.resolve(Type);
                    if (asmFile) { result = _AppDomain.context.getAssembly(asmFile); } 
                }
                break;
        }
        return result;
    };
    
    // attach to flair
    a2f('getAssembly', _getAssembly);
       
    /**
     * @name getAssemblyOf
     * @description Gets the assembly file of a given flair type
     * @example
     *  _getAssemblyOf(Type)
     * @params
     *  Type: string - qualified type name, if it is needed to know in which assembly file this exists
     *                               
     * @returns string - assembly file name which contains this type
     */ 
    const _getAssemblyOf = (Type) => { 
        let args = _Args('Type: string')(Type); args.throwOnError(_getAssemblyOf);
    
        return _AppDomain.resolve(Type);
    };
    
    // attach to flair
    a2f('getAssemblyOf', _getAssemblyOf);
       
    /**
     * @name getContext
     * @description Gets the assembly load context where a given flair type is loaded
     * @example
     *  _getContext(Type)
     * @params
     *  Type: type - flair type whose context is required
     * @returns object - assembly load context object where this type is loaded
     */ 
    const _getContext = (Type) => {
        let args = _Args('Type: flairtype')(Type); args.throwOnError(_getContext);
    
        return Type[meta].context;
    };
    
    // attach to flair
    a2f('getContext', _getContext);
       
    /**
     * @name getResource
     * @description Gets the registered resource from default assembly load context of default appdomain
     * @example
     *  getResource(qualifiedName)
     * @params
     *  qualifiedName: string - qualified resource name
     * @returns object - resource object's data
     */ 
    const _getResource = (qualifiedName) => { 
        let args = _Args('qualifiedName: string')(qualifiedName); args.throwOnError(_getResource);
        
        let res = _AppDomain.context.getResource(qualifiedName) || null;
        return (res ? res.data : null);
    };
    
    // attach to flair
    a2f('getResource', _getResource);  
    /**
     * @name getRoute
     * @description Gets the registered route from default assembly load context of default appdomain
     * @example
     *  getRoute(qualifiedName)
     * @params
     *  qualifiedName: string - qualified route name
     * @returns object - route's data
     */ 
    const _getRoute= (qualifiedName) => { 
        let args = _Args('qualifiedName: string')(qualifiedName); args.throwOnError(_getRoute);
        
        _AppDomain.context.getRoute(qualifiedName);
    };
    
    // attach to flair
    a2f('getRoute', _getRoute);
    /**
     * @name getType
     * @description Gets the flair Type from default assembly load context of default appdomain
     * @example
     *  getType(qualifiedName)
     * @params
     *  qualifiedName: string - qualified type name whose reference is needed
     * @returns object - if assembly which contains this type is loaded, it will return flair type object OR will return null
     */ 
    const _getType = (qualifiedName) => { 
        let args = _Args('qualifiedName: string')(qualifiedName); args.throwOnError(_getType);
        
        return _AppDomain.context.getType(qualifiedName);
    };
    
    // attach to flair
    a2f('getType', _getType);
       
    /**
     * @name getTypeOf
     * @description Gets the underlying type which was used to construct this object
     * @example
     *  getType(obj)
     * @params
     *  obj: object - object that needs to be checked
     * @returns type - flair type for the given object
     */ 
    const _getTypeOf = (obj) => {
        let args = _Args('obj: flair')(obj); args.throwOnError(_getTypeOf);
    
        let objMeta = obj[meta];
        return (objMeta ? (objMeta.Type || null) : null);
    };
    
    // attach to flair
    a2f('getTypeOf', _getTypeOf);
        
    /**
     * @name getTypeName
     * @description Gets the name of the underlying type which was used to construct this object
     * @example
     *  getTypeName(obj)
     * @params
     *  obj: object - object that needs to be checked
     * @returns string - name of the type of given object
     */ 
    const _getTypeName = (obj) => {
        let args = _Args('obj: flair')(obj); args.throwOnError(_getTypeName);
    
        let typeMeta = obj[meta].Type ? obj[meta].Type[meta] : obj[meta];
        return (typeMeta ? (typeMeta.name || '') : '');
    };
    
    // attach to flair
    a2f('getTypeName', _getTypeName);
        
    /**
     * @name ns
     * @description Gets the registered namespace from default assembly load context of default appdomain
     * @example
     *  ns(name)
     *  ns(name, where)
     * @params
     *  name: string - name of the namespace
     *  asInType: string - qualified name of any type which exists in this namespace
     *          this will look for correct assembly to load before returning namespace object
     * @returns object/promise - namespace object (if only namespace was passed) OR promise object (if asInType name was also passed)
     */ 
    const _ns = (name, asInType) => { 
        let args = _Args('name: undefined', 
                         'name: string',
                         'name: string, asInType: string')(name, asInType); args.throwOnError(_ns);
        
        if (typeof asInType === 'string') {
            return new Promise((resolve, reject) => {
                // include the type, this will load corresponding assembly, if not already loaded
                _include(asInType).then(() => {
                    resolve(_AppDomain.context.namespace(name)); // now resolve with the namespace object
                }).catch(reject);
            });
        } else {
            return _AppDomain.context.namespace(name);
        }
    };
    
    // attach to flair
    a2f('ns', _ns);
        
    /**
     * @name isDerivedFrom
     * @description Checks if given flair class type is derived from given class type, directly or indirectly
     * @example
     *  isDerivedFrom(type, parent)
     * @params
     *  Type: class - flair class type that needs to be checked
     *  Parent: string OR class - class type to be checked for being in parent hierarchy, it can be following:
     *                            > fully qualified class type name
     *                            > class type reference
     * @returns boolean - true/false
     */ 
    const _isDerivedFrom = (Type, Parent) => {
        // NOTE: in all 'check' type functions, Args() is not to be used, as Args use them itself
        if (_typeOf(Type) !== 'class') { throw _Exception.InvalidArgument('Type', _isDerivedFrom); }
        if (['string', 'class'].indexOf(_typeOf(Parent)) === -1) { throw _Exception.InvalidArgument('Parent', _isDerivedFrom); }
    
        return Type[meta].isDerivedFrom(Parent);
    }; 
    
    // attach to flair
    a2f('isDerivedFrom', _isDerivedFrom);
     
    /**
     * @name isAbstract
     * @description Checks if given flair class type is abstract.
     * @example
     *  isAbstract(type)
     * @params
     *  Type: class - flair class type that needs to be checked
     * @returns boolean - true/false
     */ 
    const _isAbstract = (Type) => {
        // NOTE: in all 'check' type functions, Args() is not to be used, as Args use them itself
        if (_typeOf(Type) !== 'class') { throw _Exception.InvalidArgument('Type', _isAbstract); }
    
        return Type[meta].isAbstract();
    }; 
    
    // attach to flair
    a2f('isAbstract', _isAbstract);
     
    /**
     * @name isSealed
     * @description Checks if given flair class type is sealed.
     * @example
     *  isSealed(type)
     * @params
     *  Type: class - flair class type that needs to be checked
     * @returns boolean - true/false
     */ 
    const _isSealed = (Type) => {
        // NOTE: in all 'check' type functions, Args() is not to be used, as Args use them itself
        if (_typeOf(Type) !== 'class') { throw _Exception.InvalidArgument('Type', _isSealed); }
    
        return Type[meta].isSealed();
    }; 
    
    // attach to flair
    a2f('isSealed', _isSealed);
     
    /**
     * @name isStatic
     * @description Checks if given flair class type is static.
     * @example
     *  isStatic(type)
     * @params
     *  Type: class - flair class type that needs to be checked
     * @returns boolean - true/false
     */ 
    const _isStatic = (Type) => {
        // NOTE: in all 'check' type functions, Args() is not to be used, as Args use them itself
        if (_typeOf(Type) !== 'class') { throw _Exception.InvalidArgument('Type', _isStatic); }
    
        return Type[meta].isStatic();
    }; 
    
    // attach to flair
    a2f('isStatic', _isStatic);
     
    /**
     * @name isSingleton
     * @description Checks if given flair class type is singleton.
     * @example
     *  isSingleton(type)
     * @params
     *  Type: class - flair class type that needs to be checked
     * @returns boolean - true/false
     */ 
    const _isSingleton = (Type) => {
        // NOTE: in all 'check' type functions, Args() is not to be used, as Args use them itself
        if (_typeOf(Type) !== 'class') { throw _Exception.InvalidArgument('Type', _isSingleton); }
    
        return Type[meta].isSingleton();
    }; 
    
    // attach to flair
    a2f('isSingleton', _isSingleton);
     
    /**
     * @name isDeprecated
     * @description Checks if given flair class type is deprecated.
     * @example
     *  isDeprecated(type)
     * @params
     *  Type: class - flair class type that needs to be checked
     * @returns boolean - true/false
     */ 
    const _isDeprecated = (Type) => {
        // NOTE: in all 'check' type functions, Args() is not to be used, as Args use them itself
        if (_typeOf(Type) !== 'class') { throw _Exception.InvalidArgument('Type', _isDeprecated); }
    
        return Type[meta].isDeprecated();
    }; 
    
    // attach to flair
    a2f('isDeprecated', _isDeprecated);
     
    /**
     * @name isInstanceOf
     * @description Checks if given flair class/struct instance is an instance of given class/struct type or
     *              if given class instance implements given interface or has given mixin mixed somewhere in class
     *              hierarchy
     * @example
     *  isInstanceOf(obj, type)
     * @params
     *  obj: object - flair object instance that needs to be checked
     *  Type: flair type of string
     * @returns boolean - true/false
     */ 
    const _isInstanceOf = (obj, Type) => {
        // NOTE: in all 'check' type functions, Args() is not to be used, as Args use them itself
        let _objType = _typeOf(obj),
            _typeType = _typeOf(Type),
            isMatched = false;
        if (flairInstances.indexOf(_objType) === -1) { throw _Exception.InvalidArgument('obj', _isInstanceOf); }
        if (flairTypes.indexOf(_typeType) === -1 && _typeType !== 'string') { throw _Exception.InvalidArgument('Type', _isInstanceOf); }
    
        let objMeta = obj[meta];
        switch(_typeType) {
            case 'class':
                isMatched = objMeta.isInstanceOf(Type); 
                if (!isMatched) {
                    isMatched = objMeta.Type[meta].isDerivedFrom(Type);
                }
                break;
            case 'struct':
                isMatched = objMeta.isInstanceOf(Type); break;
            case 'interface':
                isMatched = objMeta.isImplements(Type); break;
            case 'mixin':
                isMatched = objMeta.isMixed(Type); break;
            case 'string':
                isMatched = objMeta.isInstanceOf(Type);
                if (!isMatched && typeof objMeta.isImplements === 'function') { isMatched = objMeta.isImplements(Type); }
                if (!isMatched && typeof objMeta.isMixed === 'function') { isMatched = objMeta.isMixed(Type); }
                break;
        }
    
        // return
        return isMatched;
    };
    
    // attach to flair
    a2f('isInstanceOf', _isInstanceOf);
      
    /**
     * @name as
     * @description Checks if given object can be consumed as an instance of given type
     * @example
     *  as(obj, type)
     * @params
     *  obj: object - object that needs to be checked
     *  type: string OR type - type to be checked for, it can be following:
     *                         > expected native javascript data types like 'string', 'number', 'function', 'array', 'date', etc.
     *                         > 'function' - any function, cfunction' - constructor function and 'afunction - arrow function
     *                         > any 'flair' object or type
     *                         > inbuilt flair object types like 'class', 'struct', 'enum', etc.
     *                         > custom flair object instance types which are checked in following order:
     *                           >> for class instances: 
     *                              isInstanceOf given as type
     *                              isImplements given as interface 
     *                              isMixed given as mixin
     *                           >> for struct instances:
     *                              isInstance of given as struct type
     * @returns object - if can be used as specified type, return same object, else null
     */ 
    const _as = (obj, type) => {
        // NOTE: in all 'check' type functions, Args() is not to be used, as Args use them itself
    
        // obj may be undefined or null or false, so don't check for validation of that here
        if (type[meta]) { type = type[meta].name; } // since it can be a type as well
        if (_typeOf(type) !== 'string') { throw _Exception.InvalidArgument('type', _as); }
    
        if (_is(obj, type)) { return obj; }
        return null;
    };
    
    // attach to flair
    a2f('as', _as);
     
    /**
     * @name isComplies
     * @description Checks if given object complies to given flair interface
     * @example
     *  isComplies(obj, intf)
     * @params
     *  obj: object - any object that needs to be checked
     *  intf: interface - flair interface type to be checked for
     * @returns boolean - true/false
     */ 
    const _isComplies = (obj, intf) => {
        // NOTE: in all 'check' type functions, Args() is not to be used, as Args use them itself
        if (!obj) { throw _Exception.InvalidArgument('obj', _isComplies); }
        if (_typeOf(intf) !== 'interface') { throw _Exception.InvalidArgument('intf', _isComplies); }
        
        let complied = true;
        for(let member in intf) {
            if (intf.hasOwnProperty(member) && member !== meta) {
                if (!obj[member]) { complied = false; break; } // member not available
                if (typeof intf[member] === 'function') { // function or event
                    if (typeof obj[member] !== 'function') { complied = false; break; } // member is not a function or event
                } // else property, just presence was to be checked
            }
        }
        return complied;
    };
    
    // attach to flair
    a2f('isComplies', _isComplies);
      
    /**
     * @name isImplements
     * @description Checks if given flair class/struct instance or class/struct implements given interface
     * @example
     *  isImplements(obj, intf)
     * @params
     *  obj: object - flair object that needs to be checked
     *  intf: string OR interface - interface to be checked for, it can be following:
     *                              > fully qualified interface name
     *                              > interface type reference
     * @returns boolean - true/false
     */ 
    const _isImplements = (obj, intf) => {
        // NOTE: in all 'check' type functions, Args() is not to be used, as Args use them itself
        if (['class', 'instance'].indexOf(_typeOf(obj)) === -1) { throw _Exception.InvalidArgument('obj', _isImplements); }
        if (['string', 'interface'].indexOf(_typeOf(intf)) === -1) {  throw _Exception.InvalidArgument('intf', _isImplements); }
        
        return obj[meta].isImplements(intf);
    };
    
    // attach to flair
    a2f('isImplements', _isImplements);
       
    /**
     * @name isMixed
     * @description Checks if given flair class/struct instance or class/struct has mixed with given mixin
     * @example
     *  isMixed(obj, mixin)
     * @params
     *  obj: object - flair object instance or type that needs to be checked
     *  mixin: string OR mixin - mixin to be checked for, it can be following:
     *                           > fully qualified mixin name
     *                           > mixin type reference
     * @returns boolean - true/false
     */ 
    const _isMixed = (obj, mixin) => {
        // NOTE: in all 'check' type functions, Args() is not to be used, as Args use them itself
        if (['class', 'instance'].indexOf(_typeOf(obj)) === -1) { throw _Exception.InvalidArgument('obj', _isMixed); }
        if (['string', 'mixin'].indexOf(_typeOf(mixin)) === -1) {  throw _Exception.InvalidArgument('mixin', _isMixed); }
    
        return obj[meta].isMixed(mixin);
    };
    
    // attach to flair
    a2f('isMixed', _isMixed);
     

    /**
     * @name bring
     * @description Fetch, load and/or resolve an external dependency for required context
     * @example
     *  bring(deps, fn)
     * @usage
     *  bring([
     *    'my.namespace.MyStruct',
     *    '[IBase]'
     *    'myServerClass | myClientClass'
     *    'fs | x'
     *    'x | page/page.js'
     *    './abc.mjs'
     *    './somepath/somefile.css'
     *  ], (MyStruct, IBase, MyClass, fs, abc, someCSS) => {
     *      ... use them here
     *  });
     * @params
     *  deps: array - array of strings, each defining a dependency to fetch/load or resolve
     *      >> each dep definition string  can take following form:
     *
     *          >> [<name>]
     *              >> e.g., '[IBase]'
     *              >> this can be a registered alias to any type and is resolved via DI container
     *              >> if resolved type is an string, it will again pass through <namespace>.<name> resolution process
     
     *          >> <namespace>.<name>
     *              >> e.g., 'my.namespace.MyClass' or 'my.namespace.MyResource'
     *              >> this will be looked in given namespace first, so an already loaded type will be picked first
     *              >> if not found in given namespace, it will look for the assembly where this type might be registered
     *              >> if found in a registered assembly, it will load that assembly and again look for it in given namespace
     * 
     *          >> <name>
     *              >> e.g., 'fs'
     *              >> this can be a NodeJS module name (on server side) or a JavaScript module name (on client side)
     *              >> on server, it uses require('moduleName') to resolve
     *              >> on client-side it look for this in './modules/moduleName/?' file
     *                  >> to get on the file 
     * 
     *          >> <path>/<file>.js|.mjs
     *              >> e.g., './my/path/somefile.js'
     *              >> this can be a bare file to load to
     *              >> path is always treated in context of the root path - full, relative paths from current place are not supported
     *              >> to handle PRODUCTION and DEBUG scenarios automatically, use <path>/<file>{.min}.js|.mjs format. 
     *              >> it PROD symbol is available, it will use it as <path>/<file>.min.js otherwise it will use <path>/<file>.js
     * 
     *          >> <path>/<file.css|json|html|...>
     *              >> e.g., './my/path/somefile.css'
     *              >>  if ths is not a js|mjs file, it will treat it as a resource file and will use fetch/require, as applicable
     *      
     *          NOTE: <path> for a file MUST start with './' to represent this is a file path from root
     *                if ./ is not used in path - it will be assumed to be a path inside a module and on client ./modules/ will be prefixed to reach to the file inside module
     *                on server if file started with './', it will be replaced with '' instead of './' to represents root
     * 
     *          NOTE: Each dep definition can also be defined for contextual consideration as:
     *          '<depA> | <depB>'
     *          when running on server, <depA> would be considered, and when running on client <depB> will be used
     * 
     *          IMPORTANT: Each dependency is resolved with the resolved Object/content returned by dependency
     *                     if a dependency could not be resolved, it will throw the console.error()
     *                     cyclic dependencies are taken care of - if A is looking for B which is looking for C and that is looking for A - or any such scenario - it will throw error
     *  fn: function - function where to pass resolved dependencies, in order they are defined in deps
     * @returns void
     */ 
    const bringCycle = [];
    const _bring = (deps, fn) => {
        let args = _Args('deps: string, fn: afunction',
                         'deps: array, fn: afunction')(deps, fn); args.throwOnError(_bring);
        if (args.index === 0) { deps = [deps]; }
    
        let _resolvedItems = [],
            _deps = deps.slice();
    
        let processedAll = () => {
            fn(..._resolvedItems); 
        };
        let resolveNext = () => {
            if (_deps.length === 0) {
                processedAll(); return;
            } else {
                let _dep = _deps.shift().trim(),
                    _resolved = null;
    
                // pick contextual dep
                _dep = which(_dep); // server/client pick
    
                // check if this is an alias registered on DI container
                let option1 = (done) => {
                    if (_dep.startsWith('[') && _dep.endsWith(']') && _dep.indexOf('.') === -1) {
                        let _alias = _dep.substr(1, _dep.length -2).trim(); // remove [ and ]
                        _resolved = _Container.resolve(_alias, false); // first item
                        if (typeof _resolved === 'string') { // this was an alias to something else, treat it as not resolved
                            _dep = _resolved; // instead continue resolving with this new redirected _dep 
                            _resolved = null;
                        }
                    }
                    done();
                };            
    
                // check if it is available in any namespace
                let option2 = (done) => {
                    if (_dep.indexOf('/') === -1) { // type name may not have '.' when on root, but will never have '/'
                        _resolved = _getType(_dep); 
                        if (!_resolved) { // check as resource
                            _resolved = _getResource(_dep);
                        }
                    }
                    done();
                };
    
                // check if it is available in any unloaded assembly
                let option3 = (done) => {
                    if (_dep.indexOf('/') === -1) { // type name may not have '.' when on root, but will never have '/'                
                        let asmFile = _getAssemblyOf(_dep);
                        if (asmFile) { // if type exists in an assembly
                            _AppDomain.context.loadAssembly(asmFile).then(() => {
                                _resolved = _getType(_dep); 
                                if (!_resolved) { // check as resource
                                    _resolved = _getResource(_dep); 
                                }
                                done();
                            }).catch((err) => {
                                throw _Exception.OperationFailed(`Assembly could not be loaded. (${asmFile})`, err, _bring);
                            });
                        } else {
                            done();
                        }
                    } else {
                        done();
                    }
                };
    
                // check if this is a file
                let option4 = (done) => {
                    if (_dep.startsWith('./')) { // all files must start with ./
                        let ext = _dep.substr(_dep.lastIndexOf('.') + 1).toLowerCase();
                        _dep = _AppDomain.resolvePath(_dep);
                        if (ext) {
                            if (ext === 'js' || ext === 'mjs') {
                                _dep = which(_dep, true); // min/dev contextual pick
    
                                // load as module, since this is a js file and we need is executed and not the content as such
                                loadModule(_dep).then((content) => { 
                                    _resolved = content || true; done(); // it may or may not give a content
                                }).catch((err) => {
                                    throw _Exception.OperationFailed(`Module/File could not be loaded. (${_dep})`, err, _bring);
                                });
                            } else { // some other file (could be json, css, html, etc.)
                                if (isServer) {
                                    if (ext === 'json') {
                                        loadModule(_dep).then((content) => { 
                                            _resolved = content || true; done(); // it may or may not give a content
                                        }).catch((err) => {
                                            throw _Exception.OperationFailed(`Local Module/File could not be loaded. (${_dep})`, err, _bring);
                                        });
                                    } else { // read it as file
                                        let fs = require('fs');
                                        try {
                                            _resolved = fs.readFileSync(_dep);
                                            done();
                                        } catch (err) {
                                            throw _Exception.OperationFailed(`Local File could not be read. (${_dep})`, err, _bring);
                                        }
                                    }
                                } else {
                                    loadFile(_dep).then((content) => {
                                        _resolved = content; done();
                                    }).catch((err) => {
                                        throw _Exception.OperationFailed(`File could not be loaded. (${_dep})`, err, _bring);
                                    });
                                }
                            }
                        } else { // not a file
                            done();
                        }
                    } else { // not a file
                        done();
                    }
                };
    
                // check if this is a module
                let option5 = (done) => {
                    if (!_dep.startsWith('./')) { // all modules (or a file inside a module) must not start with ./
                        // on server require() finds modules automatically
                        // on client modules are supposed to be inside ./modules/ folder, therefore prefix it
                        if (!isServer) { _dep = `./${modulesRootFolder}/${_dep}`; }
                        _dep = which(_dep, true); // min/dev contextual pick
                        loadModule(_dep).then((content) => { 
                            _resolved = content || true; done();
                        }).catch((err) => {
                            throw _Exception.OperationFailed(`Module could not be loaded. (${_dep})`, err, _bring);
                        });
                    } else { // not a module
                        done();
                    }
                };
    
                // done
                let resolved = (isExcludePop) => {
                    _resolvedItems.push(_resolved);
                    if (!isExcludePop) { bringCycle.pop(); } // removed the last added dep
                    resolveNext();
                };
    
                // process
                if (_dep === '') { // nothing is defined to process
                    _resolved = true;
                    resolved(true); return;
                } else {
                    // cycle break check
                    if (bringCycle.indexOf(_dep) !== -1) {
                        throw _Exception.Circular(_dep, _bring);
                    } else {
                        bringCycle.push(_dep);
                    }
    
                    // run
                    option1(() => {
                        if (!_resolved) { option2(() => {
                            if (!_resolved) { option3(() => {
                                if (!_resolved) { option4(() => {
                                    if (!_resolved) { option5(() => {
                                        if (!_resolved) {
                                            throw _Exception.OperationFailed(`Dependency could not be resolved. (${_dep})`, _bring);
                                        } else { resolved(); }
                                    }) } else { resolved(); }
                                }) } else { resolved(); }
                            }) } else { resolved(); }
                        }) } else { resolved(); }
                    });
                }
            }
        }
    
        // start processing
        resolveNext();
    };
    
    // attach to flair
    a2f('bring', _bring, () => {
        bringCycle.length = 0;
    });
      
    /**
     * @name include
     * @description bring the required dependency
     * @example
     *  include(dep)
     * @params
     *  dep: string - dependency to be included
     *                NOTE: Dep can be of any type as defined for 'bring'
     *  globalVar: string - globally added variable name by the dependency
     *             NOTE: if dependency is a file and it emits a global variable, this should be name
     *                   of that variable and it will return that variable itself
     * @returns promise - that gets resolved with given dependency
     */ 
    const _include = (dep, globalVar) => { 
        return new Promise((resolve, reject) => {
            if (typeof dep !== 'string') { reject(_Exception.InvalidArgument('dep')); return; }
            try {
                _bring([dep], (obj) => {
                    if (!obj) {
                        reject(_Exception.OperationFailed(`Dependency could not be resolved. (${dep})`)); 
                        return;
                    } else {
                        if (typeof obj === 'boolean' && typeof globalVar === 'string') { // was resolved w true, but not an object AND if global var is given to look at
                            obj = (isServer ? global[globalVar] : (isWorker ? WorkerGlobalScope[globalVar] : window[globalVar]));
                            if (!obj) {
                                reject(_Exception.OperationFailed(`Dependency object could not be located. (${dep})`)); 
                                return;
                            }
                        }
                    }
                    resolve(obj); // this may be resolved object OR object picked from global scope OR TRUE value
                });
            } catch (err) {
                reject(err);
            }
        });
    };
    
    // attach to flair
    a2f('include', _include);
      
    /**
     * @name dispose
     * @description Call dispose of given flair object
     * @example
     *  dispose(obj)
     * @params
     *  obj: object - flair object that needs to be disposed
     *       boolean - if passed true, it will clear all of flair internal system
     * @returns void
     */ 
    const _dispose = (obj) => {
        let args = _Args('obj: instance', 
                         'obj: boolean')(obj); args.throwOnError(_dispose);
    
        if (args.index === 1 && obj === true) { // special call to dispose flair
            // dispose anything that builder engine might need to do
            builder_dispose();
    
            // dispose each member
            disposers.forEach(disposer => { disposer(); });
            disposers.length = 0;        
        } else { // regular call
            if (typeof obj[meta].dispose === 'function') { // call disposer
                obj[meta].dispose();
            }
        }
    };
    
    // attach to flair
    a2f('dispose', _dispose);  
    /**
     * @name using
     * @description Ensures the dispose of the given object instance is called, even if there was an error 
     *              in executing processor function
     * @example
     *  using(obj, fn)
     * @params
     *  obj: object/string - object that needs to be processed by processor function or qualified name for which object will be created
     *                If a disposer is not defined for the object, it will not do anything
     *  fn: function - processor function
     * @returns any - returns anything that is returned by processor function, it may also be a promise
     */ 
    const _using = (obj, fn) => {
        let args = _Args('obj: instance, fn: afunction', 
                         'obj: string, fn: afunction')(obj, fn); args.throwOnError(_using);
    
        // create instance, if need be
        if (args.index === 1) { // i.e., obj = string
            let Type = _getType(obj);
            if (!Type) { throw _Exception.NotFound(obj, _using); }
            obj = new Type(); // this does not support constructor args, for ease of use only.
        }
    
        let result = null,
            isDone = false,
            isPromiseReturned = false,
            doDispose = () => {
                if (!isDone && typeof obj[meta].dispose === 'function') {
                    isDone = true; obj[meta].dispose();
                }
            };
        try {
            result = fn(obj);
            if (result && typeof result.finally === 'function') { // a promise is returned
                isPromiseReturned = true;
                result = result.finally(() => {
                    doDispose();
                });
            }
        } finally {
            if (!isPromiseReturned) { doDispose(); }
        }
    
        // return
        return result;
    };
    
    // attach to flair
    a2f('using', _using);   
    /**
     * @name attr / $$
     * @description Decorator function to apply attributes on type and member definitions
     * @example
     *  $$(name)
     * @params
     *  attrName: string/type - Name of the attribute, it can be an internal attribute or namespaced attribute name
     *                          It can also be the Attribute flair type itself
     *  attrArgs: any - Any arguments that may be needed by attribute
     * @returns void
     */ 
    let isInsertAttrOnTop = false;
    const _$$ = (name, ...attrArgs) => {
        let args = _Args('name: string',
                         'name: Attribute')(name); args.throwOnError(_$$);
    
        let AttrType = null,
            attrInstance = null, // for inbuilt, this will remain null
            cfg = null;
        if (args.index === 0) { // name = string
            cfg = _attrMeta.inbuilt[name] || null;
            if (!cfg) { // not an inbuilt attr
                AttrType = _getType(name);
                if (!AttrType) { throw _Exception.NotFound(name, _$$); }
                name = AttrType[meta].name;
            }
        } else {
            AttrType = name; // the actual Attribute type
            name = AttrType[meta].name;
        }
    
        // duplicate check
        if (findIndexByProp(_attrMeta.bucket, 'name', name) !== -1) { throw _Exception.Duplicate(name, _$$); }
    
        // custom attribute instance
        if (AttrType) {
            try {
                attrInstance = new AttrType(...attrArgs);
            } catch (err) {
                throw new _Exception(err, _$$);
            }
            cfg = new _attrConfig(attrInstance.constraints);
        }
    
        // store
        if (isInsertAttrOnTop) {
            _attrMeta.bucket.unshift({name: name, cfg: cfg, isCustom: (attrInstance !== null), attr: attrInstance, args: attrArgs});
        } else {
            _attrMeta.bucket.push({name: name, cfg: cfg, isCustom: (attrInstance !== null), attr: attrInstance, args: attrArgs});
        }
    };
    
    /**
     * @name attr.Config
     * @description Attribute definition configuration
     * @example
     *  attr(constraints)
     *  attr(isModifier, constraints)
     * @params
     *  isModifier: boolean - if this is actually a modifier
     *  constraints: string - An expression that defined the constraints of applying this attribute 
     *                        using NAMES, PREFIXES, SUFFIXES and logical Javascript operator
     * 
     *                  NAMES can be: 
     *                      type names: class, struct, enum, interface, mixin, resource
     *                      type member names: prop, func, construct, dispose, event
     *                      inbuilt modifier names: static, abstract, sealed, virtual, override, private, protected, readonly, async, etc.
     *                      inbuilt attribute names: promise, singleton, serialize, deprecate, session, state, conditional, noserialize, etc.
     *                      custom attribute names: any registered custom attribute name
     *                      type names itself: e.g., Assembly, Attribute, etc. (any registered type name is fine)
     *                          SUFFIX: A typename must have a suffix (^) e.g., Assembly^, Attribute^, etc. Otherwise this name will be treated as custom attribute name
     *                  
     *                  PREFIXES can be:
     *                      No Prefix: means it must match or be present at the level where it is being defined
     *                      @: means it must be inherited from or present at up in hierarchy chain
     *                      $: means it either must be present at the level where it is being defined or must be present up in hierarchy chain
     *                  <name> 
     *                  @<name>
     *                  $<name>
     * 
     *                  BOOLEAN Not (!) can also be used to negate:
     *                  !<name>
     *                  !@<name>
     *                  !$<name>
     *                  
     *                  NOTE: Constraints are processed as logical boolean expressions and 
     *                        can be grouped, ANDed or ORed as:
     * 
     *                        AND: <name1> && <name2> && ...
     *                        OR: <name1> || <name2>
     *                        GROUPING: ((<name1> || <name2>) && (<name1> || <name2>))
     *                                  (((<name1> || <name2>) && (<name1> || <name2>)) || <name3>)
     * 
     * 
     * @constructs Constructs attribute configuration object
     */ 
    const _attrConfig = function(isModifier, constraints) {
        let args = _Args('isModifier: boolean, constraints: string',
                         'constraints: string',
                         'isModifier: boolean,')(isModifier, constraints); args.throwOnError(_attrConfig);
    
        // config object
        let _this = {
            isModifier: args.values.isModifier || false,
            constraints: args.values.constraints
        };
    
        // return
        return _this;
    };
    
    const _attr = (name, ...attrArgs) => { // _attr is for internal use only, so collect/clear etc. are not exposed out)
        return _$$(name, ...attrArgs);
    };
    const _attr_i = (name, ...attrArgs) => { // _attr is for internal use only, so collect/clear etc. are not exposed out)
        isInsertAttrOnTop = true;
        let result = _$$(name, ...attrArgs);
        isInsertAttrOnTop = false;
        return result;
    };
    const _attrMeta = _attr[meta] = Object.freeze({
        bucket: [],
        inbuilt: Object.freeze({ 
            static: new _attrConfig(true, '(class && !$abstract) || ((class && (prop || func)) && !($abstract || $virtual || $override))'),
        
            abstract: new _attrConfig(true, '(class && !$sealed && !$static) || ((class && (prop || func || event)) && !($override || $sealed || $static))'),
            virtual: new _attrConfig(true, 'class && (prop || func || construct || dispose || event) && !($abstract || $override || $sealed || $static)'),
            override: new _attrConfig(true, '(class && (prop || func || construct || dispose || event) && ((@virtual || @abstract || @override) && !(virtual || abstract)) && !(@sealed || $static))'),
            sealed: new _attrConfig(true, '(class || ((class && (prop || func || event)) && override))'), 
        
            private: new _attrConfig(true, '(class || struct) && (prop || func || event) && !($protected || @private || $static)'),
            protected: new _attrConfig(true, '(class) && (prop || func || event) && !($private || $static)'),
            readonly: new _attrConfig(true, '(class || struct) && prop && !abstract'),
            async: new _attrConfig(true, '(class || struct) && func'),
            privateSet: new _attrConfig(true, '(class || struct) && prop && !($private || $static)'),
            protectedSet: new _attrConfig(true, '(class) && prop && !($protected || $private || $static)'),
        
            overload: new _attrConfig('((class || struct) && (func || construct) && !($virtual || $abstract || $override || $args))'),
            enumerate: new _attrConfig('(class || struct) && prop || func || event'),
            dispose: new _attrConfig('class && prop'),
            post: new _attrConfig('(class || struct) && event'),
            fetch: new _attrConfig('(class || struct) && (func && async) && !(timer || on || @fetch)'),
            on: new _attrConfig('class && func && !(event || $async || $args || $overload || $inject || $static)'),
            timer: new _attrConfig('class && func && !(event || $async || $args || $inject || @timer || $static)'),
            type: new _attrConfig('(class || struct) && prop'),
            args: new _attrConfig('(class || struct) && (func || construct) && !$on && !$overload'),
            inject: new _attrConfig('class && (prop || func || construct) && !(static || session || state)'),
            resource: new _attrConfig('class && prop && !(session || state || inject || asset)'),
            asset: new _attrConfig('class && prop && !(session || state || inject || resource)'),
            singleton: new _attrConfig('(class && !(prop || func || event) && !($abstract || $static))'),
            serialize: new _attrConfig('((class || struct) || ((class || struct) && prop)) && !($abstract || $static || noserialize)'),
            deprecate: new _attrConfig('!construct && !dispose'),
            session: new _attrConfig('(class && prop) && !($static || $state || $readonly || $abstract || $virtual)'),
            state: new _attrConfig('(class && prop) && !($static || $session || $readonly || $abstract || $virtual)'),
            conditional: new _attrConfig('(class || struct) && (prop || func || event)'),
            noserialize: new _attrConfig('(class || struct) && prop'),
            aspects: new _attrConfig('(class && func)'),
            ns: new _attrConfig('(class || struct || mixin || interface || enum) && !(prop || func || event || construct || dispose)'),
        
            mixin: new _attrConfig('class && (prop || func || event)'),
            interface: new _attrConfig('class && (prop || func || event)')
        })
    });
    
    // define easy-syntax methods to be made available in assembly closure
    for(let inbuilt_attr in _attrMeta.inbuilt) {
        if (_attrMeta.inbuilt.hasOwnProperty(inbuilt_attr)) {
            _$$[`$$${inbuilt_attr}`] = (...args) => { _$$(inbuilt_attr, ...args); };
        }
    }
    
    _attr.collect = () => {
        let attrs = _attrMeta.bucket.slice(); _attr.clear();
        return attrs;
    };
    _attr.has = (name) => {
        if (typeof name !== 'string') { throw _Exception.InvalidArgument('name'); }
        
        return (_attrMeta.bucket.findIndex(item => item.name === name) !== -1);
    };
    _attr.get = (name) => {
        if (typeof name !== 'string') { throw _Exception.InvalidArgument('name'); }
    
        let idx = _attrMeta.bucket.findIndex(item => item.name === name);
        if (idx !== -1) { return _attrMeta.bucket[idx]; }
        return null;
    };
    _attr.count = () => {
        return _attrMeta.bucket.length;
    };
    _attr.clear = () => {
        _attrMeta.bucket.length = 0; // remove all
    };
    
    // attach to flair
    a2f('$$', _$$);
      

    const attributesAndModifiers = (def, typeDef, memberName, isTypeLevel, isCustomAllowed) => {
        let appliedAttrs = _attr.collect(), // [{name, cfg, isCustom, attr, args}]
            attrBucket = null,
            modifierBucket = null,
            modifiers = modifierOrAttrRefl(true, def, typeDef),
            attrs = modifierOrAttrRefl(false, def, typeDef),
            errorInName = '';
        if (isTypeLevel) {
            attrBucket = typeDef.attrs.type;
            modifierBucket = typeDef.modifiers.type;
            errorInName = `${typeDef.name}`;
        } else {
            attrBucket = def.attrs.members[memberName]; // pick bucket
            modifierBucket = def.modifiers.members[memberName]; // pick bucket
            errorInName = `${def.name}::${memberName}`;
        }
    
        // throw if custom attributes are applied but not allowed
        if (!isCustomAllowed) {
            for(let item of appliedAttrs) {
                if (item.isCustom) {
                    throw _Exception.InvalidOperation(`Custom attribute cannot be applied. (${item.name})`, builder);
                }
            }
        }
    
        // validator
        const validator = (appliedAttr) => {
            let result = false,
                _supportedTypes = flairTypes,
                _supportedMemberTypes = ['prop', 'func', 'construct', 'dispose', 'event'],
                _supportedModifiers = ['static', 'abstract', 'sealed', 'virtual', 'override', 'private', 'privateSet', 'protected', 'protectedSet', 'readonly', 'async'],
                _list = [], // { withWhat, matchType, original, name, value }
                _list2 = [], // to store all struct types, which needs to be processed at end, else replaceAll causes problem and 'struct' state is replaced on 'construct' too
                constraintsLex = appliedAttr.cfg.constraints; // logical version with filled booleans
    
            // extract names
            const sortAndStore = (match) => {
                let item = {
                    withWhat: '',
                    matchType: '',
                    original: match,
                    name: '',
                    value: false
                };
    
                // which type of match
                switch(match.substr(0, 1)) { 
                    case '$': 
                        item.matchType = 'anywhere';
                        item.name = match.substr(1);
                        break;
                    case '@':
                        item.matchType = 'inherited';
                        item.name = match.substr(1);
                        break;
                    default:
                        item.matchType = 'current';
                        item.name = match;
                        break;
                }
    
                // match with what
                if (match.endsWith('^')) { // type name
                    item.withWhat = 'typeName';
                    item.name = item.name.replace('^', ''); // remove ^
                } else { // members, types, modifiers or attributes
                    if (_supportedTypes.indexOf(item.name) !== -1) {
                        item.withWhat = 'typeType';
                        item.matchType = 'current'; // match type in this case is always taken as current
                    } else if (_supportedMemberTypes.indexOf(item.name) !== -1) {
                        item.withWhat = 'memberType';
                        item.matchType = 'current'; // match type in this case is always taken as current
                    } else if (_supportedModifiers.indexOf(item.name) !== 0-1) {
                        item.withWhat = 'modifier';
                    } else { // inbuilt or custom attribute name
                        item.withWhat = 'attribute';
                    }
                }
    
                // store
                if (item.name === 'struct') {
                    // note: 'struct' falls inside 'construct', so replaceAll happens to replace 'struct's state over 'construct'
                    // too, and so, it being collected in _list2 and will be added at the end
                    _list2.push(item);
                } else {
                    _list.push(item);
                }
            }; 
            const extractConstraints = () => {
                // select everything except these !, &, |, (, and )
                let rex = new RegExp('[^!\&!|()]', 'g'), // eslint-disable-line no-useless-escape
                    match = '',
                    dump = [],
                    idx = 0;
                while(true) { // eslint-disable-line no-constant-condition
                    match = rex.exec(constraintsLex);
                    if (match !== null) { dump.push(match); continue; }
                    break; 
                }
                match = ''; idx = 0;
                for(let char of dump) {
                    idx++;
                    if (char[0] !== ' ') { 
                        match+= char[0];
                        if (idx === dump.length)  { 
                            if (match !== '') { sortAndStore(match); }
                            match = '';
                        }
                    } else {
                        if (match !== '') { sortAndStore(match); }
                        match = '';
                    }
                }
    
                // merge _list and _list
                _list = _list.concat(_list2);
            };    
            extractConstraints(); // this will populate _list 
    
            // get true/false value of each item in expression
            for(let item of _list) {
                switch(item.withWhat) {
                    case 'typeName':
                        switch(item.matchType) {
                            case 'anywhere':
                                item.value = ((item.name === typeDef.name) || typeDef.Type[meta].isDerivedFrom(item.name)); break;
                            case 'inherited':
                                item.value = typeDef.Type[meta].isDerivedFrom(item.name); break;
                            case 'current':
                                item.value = (item.name === typeDef.name); break;
                        }
                        break;
                    case 'typeType':
                        // matchType is always 'current' in this case 
                        item.value = (typeDef.type === item.name); 
                        break;
                    case 'memberType':
                        // matchType is always 'current' in this case 
                        if (isTypeLevel) {
                            item.value = false; // member matching at type level is always false
                        } else {
                            item.value = (def.members[memberName] === item.name);
                        }
                        break;
                    case 'modifier':
                        // call to configured probe's anywhere, inherited or current function
                        if (isTypeLevel) {
                            item.value = (modifiers.type.probe(item.name)[item.matchType]() ? true : false);
                        } else {
                            item.value = (modifiers.members.probe(item.name, memberName)[item.matchType]() ? true : false);
                        }
                        break;
                    case 'attribute':
                        // call to configured probe's anywhere, inherited or current function
                        if (isTypeLevel) {
                            item.value = (attrs.type.probe(item.name)[item.matchType]() ? true : false);
                        } else {
                            item.value = (attrs.members.probe(item.name, memberName)[item.matchType]() ? true : false);
                        }
                        break;
                }
                constraintsLex = replaceAll(constraintsLex, item.original, item.value.toString());
            }
            
            // validate expression
            try {
                result = (new Function("try {return (" + constraintsLex + ");}catch(e){return false;}")());
                if (!result) {
                    // TODO: send telemetry of _list, so it can be debugged
                    throw _Exception.InvalidOperation(`${appliedAttr.cfg.isModifier ? 'Modifier' : 'Attribute'} ${appliedAttr.name} could not be applied. (${errorInName} --> [${constraintsLex}])`, builder);
                }
            } catch (err) {
                throw _Exception.OperationFailed(`${appliedAttr.cfg.isModifier ? 'Modifier' : 'Attribute'} ${appliedAttr.name} could not be applied. (${errorInName} --> [${constraintsLex}])`, err, builder);
            }
    
            // return
            return result;
        };
    
        // validate and collect
        for (let appliedAttr of appliedAttrs) {
            if (validator(appliedAttr)) {
                appliedAttr = sieve(appliedAttr, null, false, { type: (isTypeLevel ? typeDef.name : def.name) });
                if (appliedAttr.isCustom) { // custom attribute instance
                    attrBucket.push(appliedAttr);
                } else { // inbuilt attribute or modifier
                    if (appliedAttr.cfg.isModifier) { 
                        modifierBucket.push(appliedAttr);
                    } else {
                        attrBucket.push(appliedAttr);
                    }
                }
            }
        }
    };
    const modifierOrAttrRefl = (isModifier, def, typeDef) => {
        let defItemName = (isModifier ? 'modifiers' : 'attrs');
        let root_get = (name, memberName, isCheckInheritance, isTypeLevel) => {
            let result = null; 
            if (memberName && memberName === 'construct') { memberName = '_construct'; }
            if (memberName && memberName === 'dispose') { memberName = '_dispose'; }
            if (isTypeLevel) {
                if (!isCheckInheritance) {
                    if (typeDef[defItemName] && typeDef[defItemName].type) { result = findItemByProp(typeDef[defItemName].type, 'name', name); }
                } else {
                    // check from parent onwards, keep going up till find it or hierarchy ends
                    let prv = typeDef.previous();
                    while(true) { // eslint-disable-line no-constant-condition
                        if (prv === null) { break; }
                        if (prv[defItemName] && prv[defItemName].type) { result = findItemByProp(prv[defItemName].type, 'name', name); }
                        if (!result) {
                            prv = prv.previous();
                        } else {
                            break;
                        }
                    }
                }
            } else {
                if (!isCheckInheritance) {
                    if (def[defItemName] && def[defItemName].members[memberName]) { result = findItemByProp(def[defItemName].members[memberName], 'name', name); }
                } else {
                    let prv = def.previous();
                    while(true) { // eslint-disable-line no-constant-condition
                        if (prv === null) { break; }
                        if (prv[defItemName] && prv[defItemName].members[memberName]) { result = findItemByProp(prv[defItemName].members[memberName], 'name', name); }
                        if (!result) { 
                            prv = prv.previous();
                        } else {
                            break;
                        }
                    }
                }
            }
            return result; // {name, cfg, attr, args}
        };     
        let root_has = (name, memberName, isCheckInheritance, isTypeLevel) => {
            return root_get(name, memberName, isCheckInheritance, isTypeLevel) !== null;
        }; 
        const members_probe = (name, memberName) => {
            let _probe = Object.freeze({
                anywhere: () => {
                    return root_get(name, memberName, false, false) || root_get(name, memberName, true, false); 
                },
                current: () => {
                    return root_get(name, memberName, false, false); 
                },
                inherited: () => {
                    return root_get(name, memberName, true, false); 
                },
                only: Object.freeze({
                    current: () => {
                        return root_get(name, memberName, false, false) && !root_get(name, memberName, true, false); 
                    },
                    inherited: () => {
                        return !root_get(name, memberName, false, false) && root_get(name, memberName, true, false); 
                    }
                })
            });
            return _probe;      
        };    
        const type_probe = (name) => {
            let _probe = Object.freeze({
                anywhere: () => {
                    return root_get(name, null, false, true) || root_get(name, null, true, true); 
                },
                current: () => {
                    return root_get(name, null, false, true); 
                },
                inherited: () => {
                    return root_get(name, null, true, true); 
                },
                only: Object.freeze({
                    current: () => {
                        return root_get(name, null, false, true) && !root_get(name, null, true, true); 
                    },
                    inherited: () => {
                        return !root_get(name, null, false, true) && root_get(name, null, true, true); 
                    }
                })
            });
            return _probe;
        };
        const members_all = (memberName) => {
            let _all = Object.freeze({
                current: () => {
                    return def[defItemName].members[memberName].slice();
                },
                inherited: () => {
                    let all_inherited_attrs = [],
                        prv_attrs = null;
                    // check from parent onwards, keep going up till hierarchy ends
                    let prv = def.previous();
                    while(true) { // eslint-disable-line no-constant-condition
                        if (prv === null) { break; }
                        if (prv[defItemName] && prv[defItemName].members) { prv_attrs = findItemByProp(prv[defItemName].members, 'name', memberName); }
                        if (prv_attrs) { all_inherited_attrs.push(...prv_attrs); }
                        prv = prv.previous(); // go one level back now
                    }
                    return all_inherited_attrs;
                },
                anywhere: () => {
                    return [..._all.current(), ..._all.inherited()];
                }
            });
            return _all;
        };
        const type_all = () => {
            let _all = Object.freeze({
                current: () => {
                    return typeDef[defItemName].type.slice();
                },
                inherited: () => {
                    let all_inherited_attrs = [],
                        prv_attrs = null;
                    // check from parent onwards, keep going up till hierarchy ends
                    let prv = typeDef.previous();
                    while(true) { // eslint-disable-line no-constant-condition
                        if (prv === null) { break; }
                        if (prv[defItemName] && prv[defItemName].type) { prv_attrs = prv[defItemName].type.slice(); }
                        if (prv_attrs) { all_inherited_attrs.push(...prv_attrs); }
                        prv = prv.previous(); // go one level back now
                    }
                    return all_inherited_attrs;
                },
                anywhere: () => {
                    return [..._all.current(), ..._all.inherited()];
                }
            });
            return _all;
        };
        const root = {
            type: Object.freeze({
                get: (name, isCheckInheritance) => {
                    return root_get(name, null, isCheckInheritance, true);
                },
                has: (name, isCheckInheritance) => {
                    return root_has(name, null, isCheckInheritance, true);
                },
                all: type_all,
                probe: type_probe
            }),
            members: {
                get: (name, memberName, isCheckInheritance) => {
                    return root_get(name, memberName, isCheckInheritance, false);
                },
                has: (name, memberName, isCheckInheritance) => {
                    return root_has(name, memberName, isCheckInheritance, false);
                }, 
                all: members_all,
                probe: members_probe
            }
        };
        if (isModifier) {
            root.members.is = (modifierName, memberName) => {
                // it applied modifiers' relative logic to identify 
                // if specified member is of that type depending upon
                // modifier definitions on current and previous levels
                let _probe = members_probe(modifierName, memberName); // local
                switch(modifierName) {
                    case 'static': 
                        return _probe.anywhere(); 
                    case 'abstract':
                        return _probe.anywhere() && !(members_probe('virtual', memberName).anywhere() || members_probe('override', memberName).anywhere()); 
                    case 'virtual':
                        return _probe.anywhere() && !members_probe('override', memberName).anywhere(); 
                    case 'override':
                        return _probe.anywhere() && !members_probe('sealed', memberName).anywhere(); 
                    case 'sealed':
                        return _probe.anywhere(); 
                    case 'private':
                        return _probe.anywhere(); 
                    case 'protected':
                        return _probe.anywhere(); 
                    case 'readonly':
                        return _probe.anywhere(); 
                    case 'async':
                        return _probe.anywhere(); 
                }
            };
            root.members.type = (memberName) => {
                let isTypeLevel = (def.level === 'type'),
                    result = ''; 
                if (!isTypeLevel) {
                    let prv = def; // start from current
                    while(true) { // eslint-disable-line no-constant-condition
                        if (prv === null) { break; }
                        if (prv.members[memberName]) { result = prv.members[memberName]; }
                        if (!result) { 
                            prv = prv.previous();
                        } else {
                            break;
                        }   
                    }         
                }
                return result;
            };
            root.members.isProperty = (memberName) => { return root.members.type(memberName) === 'prop'; };
            root.members.isFunction = (memberName) => { return root.members.type(memberName) === 'func'; };
            root.members.isEvent = (memberName) => { return root.members.type(memberName) === 'event'; };
        }
        root.members = Object.freeze(root.members);
        return Object.freeze(root);
    };
    const defineExtensions = (cfg) => {
        // object extensions
        let _oex = { // every object of every type will have this, that means all types are derived from this common object
            getType: function() {
                // get internal information { instance.{obj, def, attrs, modifiers}, type.{Type, def, attrs, modifiers}}
                let def = this.instance.def;
                
                // return
                return def.Type;
            }
        }; 
        let _omex = { // every object's meta will have this
            id: guid() // property
        }; 
        cfg.ex.instance = shallowCopy(cfg.ex.instance, _oex, false); // don't override, which means defaults overriding is allowed
        cfg.mex.instance = shallowCopy(cfg.mex.instance, _omex, false); // don't override, which means defaults overriding is allowed
    
        // type extensions
        let _tex = { // every type will have this, that means all types are derived from this common type
            getName: function(isFlat) {
                // get internal information { type.{Type, def, attrs, modifiers}}
                let typeDef = this.type.def;
                
                // return
                return isFlat ? typeDef.flatname : typeDef.name;
            },
            getType: function() {
                // get internal information { type.{Type, def, attrs, modifiers}}
                let typeDef = this.type.def;
    
                return typeDef.type;
            },
            getAssembly: function() {
                // get internal information { type.{Type, def, attrs, modifiers}}
                let _Object = this.type.Type,
                    _meta = this.type.meta,
                    _ObjectMeta = _Object[_meta];
                
                return _ObjectMeta.assembly();
            },
            getNamespace: function() {
                // get internal information { type.{Type, def, attrs, modifiers}}
                let _Object = this.type.Type,
                    _meta = this.type.meta,
                    _ObjectMeta = _Object[_meta];
                
                return _ObjectMeta.namespace;
            }
        }; 
        let _tmex = { // every type's meta will have this
            id: guid() // property
        }; 
        cfg.ex.type = shallowCopy(cfg.ex.type, _tex, false); // don't override, which means defaults overriding is allowed
        cfg.mex.type = shallowCopy(cfg.mex.type, _tmex, false); // don't override, which means defaults overriding is allowed
    };
    const addTypeExtensions = (typeEx, Type, addTarget, typeDef, type_attrs, type_modifiers, meta) => {
        let bindWith = {
            type: {
                Type: Type,
                def: typeDef,
                attrs: type_attrs,
                modifiers: type_modifiers,
                meta: meta
            }
        }
        for(let ex in typeEx) {
            if (typeEx.hasOwnProperty(ex)) {
                if (typeof typeEx[ex] === 'function') {
                    Object.defineProperty(addTarget, ex, {
                        configurable: true, enumerable: false,
                        value: typeEx[ex].bind(bindWith)
                    });
                } else {
                    Object.defineProperty(addTarget, ex, {
                        configurable: true, enumerable: false,
                        value: typeEx[ex]
                    });
                }
            }
        }
    };
    const addInstanceExtensions = (instanceEx, obj, addTarget, Type, def, typeDef, attrs, modifiers, type_attrs, type_modifiers, meta) => {
        let bindWith = {
            instance: {
                obj: obj,
                def: def,
                attrs: attrs,
                modifiers: modifiers,
                meta: meta
            },
            type: {
                Type: Type,
                typeDef: typeDef,
                attrs: type_attrs,
                modifiers: type_modifiers,
                meta: meta
            }
        }
        for(let ex in instanceEx) {
            if (typeof instanceEx[ex] === 'function') {
                Object.defineProperty(addTarget, ex, {
                    configurable: true, enumerable: false,
                    value: instanceEx[ex].bind(bindWith)
                });
            } else {
                Object.defineProperty(addTarget, ex, {
                    configurable: true, enumerable: false,
                    value: instanceEx[ex]
                });
            }
        }
    };
    const buildTypeInstance = (cfg, Type, obj, _flag, _static, ...args) => {
        // define parameters and context
        let TypeMeta = Type[meta],
            $Type = null, 
            typeDef = TypeMeta.def(),
            _flagName = '___flag___',
            params = {
                _flagName: _flagName
            };
        if (typeof _flag !== 'undefined' && _flag === _flagName) { // inheritance in play
            params.isNeedProtected = true;
            params.isTopLevelInstance = false;
            params.staticInterface = cfg.static ? _static : null;
            params.args = args;
        } else {
            params.isNeedProtected = false;
            params.isTopLevelInstance = true;
            params.staticInterface = cfg.static ? Type : null;
            if (typeof _flag !== 'undefined') {
                if (typeof _static !== 'undefined') {
                    params.args = [_flag, _static].concat(args); // one set
                } else {
                    params.args = [_flag]; // no other args given
                }
            } else {
                params.args = []; // no args
            }
        }
        $Type = params.staticInterface || Type; // if a type is coming as staticInterface - means that is the main Type being created, else Type (the actual type being created (in case of inheritance - this will be consistently same for all levels - the top level Type that is being created)
    
        // singleton specific case
        if (cfg.singleton && !typeDef.staticConstructionCycle && !isNewFromReflector && params.isTopLevelInstance && TypeMeta.singleInstance.value) { return TypeMeta.singleInstance.value; }
    
        // define vars
        let exposed_obj = {},
            parentObjs = 'parentObjs',
            objMeta = null,
            exposed_objMeta = null,
            mixin_being_applied = null,
            _constructName = '_construct',
            _disposeName = '_dispose',
            _props = {}, // plain property values storage inside this closure
            _overloads = {}, // each named (funcName_type_type_...) overload of any function will be added here
            _previousDef = null,
            def = { 
                name: cfg.params.typeName,
                flatname: replaceAll(cfg.params.typeName, '.', '_'),
                type: cfg.types.type, // the type of the type itself: class, struct, etc.
                Type: Type,
                level: 'object',
                members: {}, // each named item here defines the type of member: func, prop, event, construct, etc.
                scope: {},  // each names item here defined the scope of the member: private, protected, public
                attrs: { 
                    members: {} // each named item array in here will have: {name, cfg, isCustom, attr, args}
                },
                modifiers: {
                    members: {} // each named item array in here will have: {name, cfg, attr, args}
                },
                previous: () => {
                    return _previousDef;
                }
            },
            proxy = null,
            isBuildingObj = false,
            _member_dispatcher = null,
            _sessionStorage = (cfg.storage ? _Port('sessionStorage') : null),
            _localStorage = (cfg.storage ? _Port('localStorage') : null);
    
        const applyCustomAttributes = (bindingHost, memberName, memberType, member) => {
            for(let appliedAttr of attrs.members.all(memberName).current()) {
                if (appliedAttr.isCustom) { // custom attribute instance
                    if (memberType === 'prop') {
                        let newSet = appliedAttr.attr.decorateProperty(def.name, memberName, member); // set must return a object with get and set members
                        if (newSet.get && newSet.set) {
                            newSet.get = newSet.get.bind(bindingHost);
                            newSet.set = newSet.set.bind(bindingHost);
                            member = newSet; // update for next attribute application
                        } else {
                            throw _Exception.OperationFailed(`${appliedAttr.name} decoration result is unexpected. (${def.name}::${memberName})`, builder);
                        }
                    } else { // func or event
                        let newFn = null;
                        if (memberType === 'func') { // func
                            newFn = appliedAttr.attr.decorateFunction(def.name, memberName, member);
                            if (isASync(member) !== isASync(newFn)) { throw _Exception.OperationFailed(`${appliedAttr.name} decoration result is unexpected. (${def.name}::${memberName})`, builder); }
                        } else { // event
                            newFn = appliedAttr.attr.decorateEvent(def.name, memberName, member);
                        }
                        if (newFn) {
                            member = newFn.bind(bindingHost); // update for next attribute application
                        } else {
                            throw _Exception.OperationFailed(`${appliedAttr.name} decoration result is unexpected. (${def.name}::${memberName})`, builder);
                        }
                    }
    
                    // now since attribute is applied, this attribute instance is of no use,
                    appliedAttr.attr = null;
                }
            }
            return member;           
        };
        const applyAspects = (memberName, member, cannedAspects) => {
            let weavedFn = null,
                funcAspects = [];
    
            // get aspects that are applicable for this function (NOTE: Optimization will be needed here, eventually)
            funcAspects = _get_Aspects(def.name, memberName, cannedAspects);
            def.aspects.members[memberName] = funcAspects; // store for reference by reflector
                
            // apply these aspects
            if (funcAspects.length > 0) {
                weavedFn = _attach_Aspects(member, def.name, memberName, funcAspects); 
                if (weavedFn) {
                    member = weavedFn; // update member itself
                }
            }
    
            // return weaved or unchanged member
            return member;
        };
        const getObjToOperateOn = (memberName, memberType, memberScope, isWrite) => {
            let operate_obj = null;
            if (memberName !== meta) {
                switch(memberScope) {
                    case 'private': // always read/write on local interface
                        operate_obj = obj; break;
                    case 'protected': 
                        // obj.parentObjs[] array contains all parent objects' 'obj' object in reverse order
                        // e.g, if D derives from C, which derives from B, which derives from A, this array will contain [D, C, B, A]
                        // if A defines a virtual method, which gets overridden on B and then on C also and not on D
                        // it will pick the C's overridden version, (which with the help of 'base' automatically will call B's and A's versions , if base() was called in tjese override)
                        // in case at no place it was overridden, it will call A's virtual itself
                        for(let ___obj of obj[parentObjs]) {
                            if (typeof ___obj[memberName] !== 'undefined') {
                                operate_obj = ___obj; break; 
                            }
                        }
                        if (!operate_obj) { // will never be a case, yet handled
                            operate_obj = obj;
                        }
                        break;
                    case 'public':
                        if (isWrite) { // write case
                            operate_obj = exposed_obj; break;
                        } else { // read case
                            if (memberType === 'event') { 
                                // events carry different interface for public and private/protected case
                                // therefore, if event is defined locally, read from here, else read from exposed interface
                                operate_obj = (typeof obj[memberName] !== 'undefined' ? obj : exposed_obj); break;                             
                            } else { // all non-events, read from exposed interface
                                operate_obj = exposed_obj; 
                            }
                        }
                        break;
                    default: // when member is not defined here then it must be protected or public at some parent level (and must be present in exposed_obj)
                        if (isWrite) { // write case
                            if (typeof exposed_obj[memberName] !== 'undefined') {
                                operate_obj = exposed_obj; break;
                            } else { // some undefined member or a private member at a parent level
                                throw _Exception.NotDefined(memberName, builder);
                            }
                        } else { // read case
                            // special case for events (is a function locally, and do have .add and .remove on exposed)
                            if (typeof obj[memberName] === 'function' && typeof exposed_obj[memberName].add === 'function' && typeof exposed_obj[memberName].remove === 'function') { 
                                // this is a protected function (event raiser), hence pick from obj and not from exposed_obj (where it is just an object)
                                operate_obj = obj;
                            } else if (typeof exposed_obj[memberName] !== 'undefined') {
                                operate_obj = exposed_obj;
                            } else {
                                throw _Exception.NotDefined(memberName, builder);
                            }
                        }
                }
            } else {
                operate_obj = obj;
            }
            return operate_obj;
        };
        const buildExposedObj = () => {
            let isCopy = false,
            doCopy = (memberName) => { Object.defineProperty(exposed_obj, memberName, Object.getOwnPropertyDescriptor(obj, memberName)); };
            
            // copy meta member as non-enumerable
            let desc = Object.getOwnPropertyDescriptor(obj, meta);
            desc.enumerable = false;
            Object.defineProperty(exposed_obj, meta, desc);
            exposed_objMeta = exposed_obj[meta];
            
            // copy other members, excluding static members
            for(let memberName in obj) { 
                isCopy = false;
                if (obj.hasOwnProperty(memberName) && memberName !== meta && memberName !== parentObjs) { 
                    isCopy = true;
                    if (def.members[memberName]) { // member is defined here
                        if (modifiers.members.probe('private', memberName).current()) { isCopy = false; }   // private members don't get out
                        if (isCopy && (modifiers.members.probe('protected', memberName).current() && !params.isNeedProtected)) { isCopy = false; } // protected don't go out of top level instance
                    } else { // some derived member (protected or public)
                        if (modifiers.members.probe('protected', memberName).anywhere() && !params.isNeedProtected) { isCopy = false; } // protected don't go out of top level instance
                    }
                    if (isCopy) { doCopy(memberName); }
    
                    // special case of privateSet and protectedSet for properties
                    if (isCopy && modifiers.members.isProperty(memberName)) { // if property that is copied
                        if (modifiers.members.probe('privateSet', memberName).current()) { // has private set
                            // take setter out
                            let propDesc = Object.getOwnPropertyDescriptor(exposed_obj, memberName);
                            propDesc.set = _noop;
                            Object.defineProperty(exposed_obj, memberName, propDesc);
                        } else if (modifiers.members.probe('protectedSet', memberName).current()) { // has protected set
                            if (!params.isNeedProtected) { // take setter out if protected is not needed
                                let propDesc = Object.getOwnPropertyDescriptor(exposed_obj, memberName);
                                propDesc.set = _noop;
                                Object.defineProperty(exposed_obj, memberName, propDesc);
                            }
                        }
                    }
    
                    // any abstract member should not left unimplemented now on top level instance
                    // and if present at lower levels, those types must be marked as abstract
                    if (isCopy && modifiers.members.is('abstract', memberName)) {
                        if (!params.isNeedProtected) {
                            throw _Exception.NotImplemented(`Abstract member is not implemented. (${def.name}::${memberName})`, builder);
                        } else {
                            if (!modifiers.type.probe('abstract').current()) {
                                throw _Exception.InvalidDefinition(`Abstract member can exists only in abstract type. (${def.name}::${memberName})`, builder);
                            }
                        }
                    }
    
                    // apply enumerate attribute now
                    if (isCopy) {
                        let the_attr = attrs.members.probe('enumerate', memberName).current();
                        if (the_attr && the_attr.args[0] === false) { // if attr('enumerate', false) is defined
                            let desc = Object.getOwnPropertyDescriptor(exposed_obj, memberName);
                            desc.enumerable = false;
                            Object.defineProperty(exposed_obj, memberName, desc);
                        } // else by default it is true anyways
                    }
    
                    // rewire event definition when at the top level object creation step
                    if (isCopy && !params.isNeedProtected && modifiers.members.isEvent(memberName)) { 
                        let desc = Object.getOwnPropertyDescriptor(exposed_obj, memberName);
                        desc.enumerable = false;   
                        desc.value = exposed_obj[memberName].strip();
                        Object.defineProperty(exposed_obj, memberName, desc);
                    }
                }
            }
    
            // extend with configured extensions only at top level, since (1) these will always be same at all levels
            // since these are of same object type, and since overwriting of this is allowed, add only at top level
            // and only missing ones
            if (params.isTopLevelInstance) {
                // add instance level extensions
                addInstanceExtensions(cfg.ex.instance, exposed_obj, exposed_obj, Type, def, typeDef, attrs, modifiers, TypeMeta.attrs, TypeMeta.modifiers, meta); 
    
                // add instance meta level extensions
                addInstanceExtensions(cfg.mex.instance, exposed_obj, exposed_objMeta, Type, def, typeDef, attrs, modifiers, TypeMeta.attrs, TypeMeta.modifiers, meta);
            }
    
            // expose def of this level for upper level to access if not on top level
            if (!params.isTopLevelInstance) {
                exposed_objMeta.def = def; // this will be deleted as soon as picked at top level
            }
    
            // create/update parentObjs array
            if (typeof obj[parentObjs] === 'undefined') { obj[parentObjs] = []; }
            obj[parentObjs].unshift(obj); // insert this level object in the array on top (so when looking for overrides, it look from top (last added first))
            if (!params.isTopLevelInstance) { exposed_obj[parentObjs] = obj[parentObjs]; } // same object
        };
        const validateMember = (memberName, interface_being_validated) => {
            // member must exists check + member type must match
            if (Object.keys(exposed_obj).indexOf(memberName) === -1 || modifiers.members.type(memberName) !== interface_being_validated[meta].modifiers.members.type(memberName)) {
                if (memberName === 'dispose' && (typeof exposed_obj[_disposeName] === 'function' || 
                                                 typeof exposed_objMeta.dispose === 'function')) {
                    // its ok, continue below
                } else {
                    throw _Exception.NotImplemented(`Interface member is not implemented. (${interface_being_validated[meta].name + ':' + memberName})`, builder); 
                }
            }
    
            // Note: type and args checking is intentionally not done, considering the flexible type nature of JavaScript
    
            // pick interface being validated at this time
            _attr('interface', interface_being_validated[meta].name);
    
            // collect attributes and modifiers - validate applied attributes as per attribute configuration - throw when failed
            attributesAndModifiers(def, typeDef, memberName, false, cfg.customAttrs);
        };       
        const validateInterfaces = () => {
            if (def.interfaces) {
                for(let _interfaceType of def.interfaces) { 
                    // an interface define members just like a type
                    // with but its functions, event and props will be nim, nie and nip respectively
                    for(let __memberName in _interfaceType) {
                        if (_interfaceType.hasOwnProperty(__memberName)) {
                            validateMember(__memberName, _interfaceType)
                        }
                    }
                }
    
                // delete it, no longer needed (a reference is available at Type level)
                delete def.interfaces;
            }
        };
        const validatePreMemberDefinitionFeasibility = (memberName, memberType, memberDef) => { // eslint-disable-line no-unused-vars
            if (['func', 'prop', 'event'].indexOf(memberType) !== -1 && memberName.startsWith('_')) { new _Exception('InvalidName', `Name is not valid. (${def.name}::${memberName})`); } // this is for some future usage, where internal names can be added starting with '_'
            switch(memberType) {
                case 'func':
                    if (!cfg.func) { throw _Exception.InvalidOperation(`Function cannot be defined on this type. (${def.name})`, builder); }
                    break;
                case 'prop':
                    if (!cfg.prop) { throw _Exception.InvalidOperation(`Property cannot be defined on this type. (${def.name})`, builder); }
                    break;
                case 'event':
                    if (!cfg.event) { throw _Exception.InvalidOperation(`Event cannot be defined on this type. (${def.name})`, builder); }
                    break;
                case 'construct':
                    if (!cfg.construct) { throw _Exception.InvalidOperation(`Constructor cannot be defined on this type. (${def.name})`, builder); }
                    memberType = 'func'; 
                    break;
                case 'dispose':
                    if (!cfg.dispose) { throw _Exception.InvalidOperation(`Dispose cannot be defined on this type. (${def.name})`, builder); }
                    memberType = 'func'; 
                    break;
            }
            return memberType;
        };
        const validateMemberDefinitionFeasibility = (bindingHost, memberName, memberType, memberDef) => {
            let result = true;
            // conditional check using AND - means, all specified conditions must be true to include this
            let the_attr = attrs.members.probe('conditional', memberName).current();
            if (the_attr) {
                let conditions = splitAndTrim(the_attr.args[0] || []);
                for (let condition of conditions) {
                    condition = condition.toLowerCase();
                    if (!(condition === 'test' && options.env.isTesting)) { result = false; break; }
                    if (!(condition === 'server' && options.env.isServer)) { result = false; break; }
                    if (!(condition === 'client' && options.env.isClient)) { result = false; break; }
                    if (!(condition === 'worker' && options.env.isWorker)) { result = false; break; }
                    if (!(condition === 'main' && options.env.isMain)) { result = false; break; }
                    if (!(condition === 'debug' && options.env.isDebug)) { result = false; break; }
                    if (!(condition === 'prod' && options.env.isProd)) { result = false; break; }
                    if (!(condition === 'cordova' && options.env.isCordova)) { result = false; break; }
                    if (!(condition === 'nodewebkit' && options.env.isNodeWebkit)) { result = false; break; }
                    if (!(options.symbols.indexOf(condition) !== -1)) { result = false; break; }
                }
                if (!result) { return result; } // don't go to define, yet leave meta as is, so at a later stage we know that this was conditional and yet not available, means condition failed
            }
            
            // abstract check
            if (cfg.inheritance && modifiers.members.probe('abstract', memberName).current() && memberDef.ni !== true) {
                throw _Exception.InvalidDefinition(`Abstract member must not be implemented. (${def.name}::${memberName})`, builder);
            }
    
            // for a static type, constructor arguments check and dispose check
            the_attr = modifiers.type.probe('static').current();
            if (the_attr && cfg.static) {
                if (TypeMeta.isStatic()) {
                    if (cfg.construct && memberName === _constructName && memberDef.length !== 0) {
                        throw _Exception.InvalidDefinition(`Static constructors cannot have arguments. (${def.name}::construct)`, builder);
                    }
                    if (cfg.dispose && memberName === _disposeName) {
                        throw _Exception.InvalidDefinition(`Static types cannot have destructors. (${def.name}::dispose)`, builder);
                    }        
                } else {
                    if (cfg.construct && memberName === _constructName) {
                        throw _Exception.InvalidDefinition(`Non-static types cannot have static constructors. (${def.name}::construct)`, builder);
                    }
                    if (cfg.dispose && memberName === _disposeName) {
                        throw _Exception.InvalidDefinition(`Static destructors cannot be defined. (${def.name}::dispose)`, builder);
                    }        
                }
            }
    
            // dispose arguments check always
            if (cfg.dispose && memberName === _disposeName && memberDef.length !== 0) {
                if (memberDef.length > 1 || (memberDef.length === 1 && !modifiers.members.probe('override', memberName).current())) { // in case of override (base will be passed as param
                    throw _Exception.InvalidDefinition(`Destructor method cannot have arguments. (${def.name}::dispose)`, builder);
                }
            }
            
            // duplicate check, if not overriding
            // special case for setting property values
            if (Object.keys(obj).indexOf(memberName) !== -1 && 
                (!cfg.inheritance || (cfg.inheritance && !modifiers.members.probe('override', memberName).current()))) {
                    if (memberType === 'prop' && 
                        def.attrs.members[memberName].length === 0 && def.modifiers.members[memberName].length === 0
                        && (!memberDef || (memberDef && !memberDef.get && !memberDef.set))) {
                            // when property and no attributes or modifiers are defined 
                            // and the value does not container get and set definitions
                            // then treat it as a value definition and define the value
                            bindingHost[memberName] = memberDef;
    
                            // return
                            return false; // don't go for definition, value updated here
                    } else {
                        throw _Exception.Duplicate(def.name + '::' + memberName, builder); 
                    }
            }
    
            // overriding member must be present and of the same type
            if (cfg.inheritance && modifiers.members.probe('override', memberName).current()) {
                if (Object.keys(obj).indexOf(memberName) === -1) {
                    throw _Exception.InvalidDefinition(`Member not found to override. (${def.name}::${memberName})`, builder); 
                } else if (modifiers.members.type(memberName) !== memberType) {
                    throw _Exception.InvalidDefinition(`Overriding member type is invalid. (${def.name}::${memberName})`, builder); 
                }
            }
    
            // static members cannot be arrow functions and properties cannot have custom getter/setter
            if (cfg.static && (modifiers.members.probe('static', memberName).current() || TypeMeta.isStatic())) {
                if (memberType === 'func') {
                    if (isArrow(memberDef)) { 
                        throw _Exception.InvalidDefinition(`Static functions cannot be defined as an arrow function. (${def.name}::${memberName})`, builder); 
                    }
                } else if (memberType === 'prop') {
                    if (memberDef && memberDef.get && typeof memberDef.get === 'function') {
                        if (isArrow(memberDef)) { 
                            throw _Exception.InvalidDefinition(`Static property getters cannot be defined as an arrow function. (${def.name}::${memberName})`, builder); 
                        }
                    }
                    if (memberDef && memberDef.set && typeof memberDef.set === 'function') {
                        if (isArrow(memberDef)) { 
                            throw _Exception.InvalidDefinition(`Static property setters cannot be defined as an arrow function. (${def.name}::${memberName})`, builder); 
                        }
                    }
                }
            }
    
            // session/state properties cannot have custom getter/setter and also relevant port must be configured
            if (cfg.storage && attrs.members.probe('session', memberName).current()) {
                if (memberDef && memberDef.get && typeof memberDef.get === 'function') {
                    throw _Exception.InvalidDefinition(`Session properties cannot be defined with a custom getter/setter. (${def.name}::${memberName})`, builder); 
                }
            }
            if (cfg.storage && attrs.members.probe('state', memberName).current()) {
                if (memberDef && memberDef.get && typeof memberDef.get === 'function') {
                    throw _Exception.InvalidDefinition(`State properties cannot be defined with a custom getter/setter. (${def.name}::${memberName})`, builder); 
                }
                if (!_localStorage) { throw _Exception.InvalidOperation('Port is not configured. (localStorage)', builder); }
            }
    
            // return (when all was a success)
            return result;
        };
        const buildProp = (memberName, memberType, memberDef) => {
            let _member = {
                get: null,
                set: null
            },
            _getter = _noop,
            _setter = _noop,
            _isReadOnly = modifiers.members.probe('readonly', memberName).anywhere(),
            _isStatic = modifiers.members.probe('static', memberName).anywhere(),
            _isSession = attrs.members.probe('session', memberName).anywhere(),
            _isState = attrs.members.probe('state', memberName).anywhere(),
            _deprecate_attr = attrs.members.probe('deprecate', memberName).current(),
            inject_attr = attrs.members.probe('inject', memberName).current(),
            asset_attr = attrs.members.probe('asset', memberName).current(),
            resource_attr = attrs.members.probe('resource', memberName).current(),
            type_attr = attrs.members.probe('type', memberName).current(),
            _isDeprecate = (_deprecate_attr !== null),
            _deprecate_message = (_isDeprecate ? (_deprecate_attr.args[0] || `Event is marked as deprecate. (${def.name}::${memberName})`) : ''),
            propHost = _props, // default place to store property values inside closure
            bindingHost = obj,
            isStorageHost = (cfg.storage && (_isSession || _isState)),
            uniqueName = def.flatname + '_' + memberName,
            _injections = null;  
            
            // NOTE: no check for isOverriding, because properties are always fully defined,
            // when being overridden 
    
            // define or redefine
            if (memberDef && (memberDef.get || memberDef.set)) { // normal property, cannot be static because static cannot have custom getter/setter
                if (!cfg.propGetterSetter) {
                    throw _Exception.InvalidDefinition(`Getter/Setter are not allowed. (${def.name}::${memberName})`, builder);
                }
                if (memberDef.get && typeof memberDef.get === 'function') {
                    _getter = memberDef.get;
                }
                if (memberDef.set && typeof memberDef.set === 'function') {
                    _setter = memberDef.set;
                }
                if (cfg.static && _isStatic) {
                    bindingHost = params.staticInterface; // binding to static interface, so with 'this' object internals are not accessible
                }
                _member.get = function() {
                    if (_isDeprecate) { console.log(_deprecate_message); } // eslint-disable-line no-console
                    return _getter.apply(bindingHost);
                }.bind(bindingHost);
                _member.set = function(value) {
                    if (_isDeprecate) { console.log(_deprecate_message); } // eslint-disable-line no-console
                    if (_isReadOnly && !bindingHost[meta].constructing) { throw _Exception.InvalidOperation(`Property is readonly. (${def.name}::${memberName})`, builder); } // readonly props can be set only when object is being constructed 
                    if (type_attr && type_attr.args[0] && !_is(value, type_attr.args[0])) { throw _Exception.InvalidArgument('value', builder); } // type attribute is defined
                    return _setter.apply(bindingHost, [value]);
                }.bind(bindingHost);
            } else { // direct value
                if (cfg.static && _isStatic) {
                    propHost = params.staticInterface[meta].props; // property values are stored on static interface itself in  .[meta].props
                    bindingHost = params.staticInterface; // binding to static interface, so with 'this' object internals are not accessible
                    if (type_attr && type_attr.args[0] && !_is(memberDef, type_attr.args[0])) { throw _Exception.InvalidArgument('value', builder); } // type attribute is defined
                    propHost[uniqueName] = memberDef;
                } else if (cfg.storage && (_isSession || _isState)) {
                    if (_isSession) { // session
                        propHost = _sessionStorage;
                        uniqueName = obj[meta].id + '_' + uniqueName; // because multiple instances of same object will have different id
                    } else { // state
                        propHost = _localStorage;
                        // no change in unique-name, so all instances of same object share same state, this is because at every new instance id is changed, and since state is supposed to persist, to reach back to same state, name has to be same
                    }
                    addDisposable((_isSession ? 'session' : 'state'), uniqueName);
                    if (!propHost.getItem(uniqueName)) { 
                        if (type_attr && type_attr.args[0] && !_is(memberDef, type_attr.args[0])) { throw _Exception.InvalidArgument('value', builder); } // type attribute is defined
                        propHost.setItem(uniqueName, JSON.stringify({value: memberDef})); 
                    }
                } else { // normal value
                    if (type_attr && type_attr.args[0] && !_is(memberDef, type_attr.args[0])) { throw _Exception.InvalidArgument('value', builder); } // type attribute is defined
                    if (cfg.numOnlyProps && typeof memberDef !== 'number') { throw _Exception.InvalidArgument('value', builder); } 
                    propHost[uniqueName] = memberDef;
                }
                _member.get = function() {
                    if (_isDeprecate) { console.log(_deprecate_message); } // eslint-disable-line no-console
                    if (isStorageHost) { 
                        let _json = propHost.getItem(uniqueName);
                        return (_json ? JSON.parse(_json).value : null);
                    }
                    return propHost[uniqueName];             
                }.bind(bindingHost);
                _member.set = function(value) {
                    if (_isDeprecate) { console.log(_deprecate_message); } // eslint-disable-line no-console
                    if (_isReadOnly && !bindingHost[meta].constructing) { throw _Exception.InvalidOperation(`Property is readonly. (${def.name}::${memberName})`, builder); } // readonly props can be set only when object is being constructed 
                    if (type_attr && type_attr.args[0] && !_is(value, type_attr.args[0])) { throw _Exception.InvalidArgument('value', builder); } // type attribute is defined
                    if (isStorageHost) {
                        let _json = {value: value};
                        propHost.setItem(uniqueName, JSON.stringify(_json));
                    } else {
                        propHost[uniqueName] = value;
                    }
                }.bind(bindingHost);
            }
    
            // set injected value now
            if (inject_attr && !_isStatic && !isStorageHost) {
                // resolve injections
                let _injectWhat = inject_attr.args[0],                                          // aliasName || qualifiedTypeName || Type itself
                    _injectWith = (inject_attr.args.length > 0 ? inject_attr.args[1] : []),     // [..., ...] <- any parameters to pass to constructor of type(s) being injected
                    _injectMany = (inject_attr.args.length > 1 ? inject_attr.args[2] : false);  // true | false <- if multi injection to be done
    
                let _Type = null;
                try {
                    switch(_typeOf(_injectWhat)) {
                        case 'class':
                        case 'struct':
                            _Type = _injectWith;
                            break;
                        case 'string':
                            _Type = _getType(_injectWhat);
                            if (!_Type) {
                                _injections = _Container.resolve(_injectWhat, _injectWith, _injectMany);
                                if (!Array.isArray(_injections)) { _injections = [_injections]; }
                            } else {
                                if (['class', 'struct'].indexOf(_typeOf(_Type)) === -1) {
                                    throw _Exception.InvalidArgument('inject', builder);
                                }
                            }
                            break;
                        default:
                            throw _Exception.InvalidArgument('inject', builder);
                    }
                    if (!_injections && _Type) {
                        _injections = [];
                        if (_injectWith.length > 0) {
                            _injections.push(new _Type(..._injectWith)); 
                        } else {
                            _injections.push(new _Type());
                        }
                    }
                } catch (err) {
                    throw new _Exception(err, builder);
                }
                _member.set(_injections); // set injected value now - this includes the case of custom setter
            }
    
            // disposable
            if (attrs.members.probe('dispose', memberName).anywhere() || inject_attr) { // if injected or marked for disposal
                addDisposable('prop', memberName);
            }
    
            // set resource or asset
            if ((resource_attr || asset_attr) && !isStorageHost) {
                let resOrAssetData = null;
                if (resource_attr) {
                    if (resource_attr.args[0]) { // qualified name of resource is given on attr parameter
                        resOrAssetData = _getResource(resource_attr.args[0]); 
                    }
                } else { // asset_attr
                    if (asset_attr.args[0]) { // asset file name with relative path within assets folder of assembly and must start with ./
                        let astFile = asset_attr.args[0];
                        resOrAssetData = $Type.getAssembly().getAssetFilePath(astFile);
                    }
                }
                if (resOrAssetData) {
                    _member.set(resOrAssetData); // set value now - this includes the case of custom setter
                }
            } 
    
    
            // apply custom attributes
            if (cfg.customAttrs) {
                _member = applyCustomAttributes(bindingHost, memberName, memberType, _member);
            }
    
            // return
            return _member;
        };
        const handleOverload = (memberName, memberType, memberDef) => {
            if (memberType === 'func') {
                let overload_attr = _attr.get('overload'); // peek
                if (overload_attr) {
                    let _isStatic = (cfg.static && modifiers.members.probe('static', memberName).current()),
                    bindingHost = (_isStatic ? params.staticInterface : obj);
                    setOverloadFunc(memberName, memberDef, overload_attr); // define overload at central place
    
                    // 2nd overload onwards, don't go via normal definition route,
                    if (bindingHost[memberName]) { 
                        // throw, if any other attribute is defined other than overload
                        if (_attr.count() > 1) { throw _Exception.InvalidDefinition(`Overloaded function cannot define additional modifiers or attributes. (${def.name}::${memberName})`, builder); }
                        _attr.collect(); // so _attr array is cleaned
                        return true; // handled, don't go normal definition route
                    }
                }
            }
            return false;
        };
        const setOverloadFunc = (memberName, memberDef, overload_attr) => {
            let _isStatic = (cfg.static && modifiers.members.probe('static', memberName).current()),
                bindingHost = (_isStatic ? params.staticInterface : obj),
                func_overloads = (_isStatic ? bindingHost[meta].overloads : _overloads),
                type_def_items = splitAndTrim(overload_attr.args[0]), // type, type, type, type, ...
                func_def = memberName + '_' + type_def_items.join('_');
            func_overloads[func_def] = memberDef; // store member for calling later
        };
        const getOverloadFunc = (memberName, ...args) => {
            let _isStatic = (cfg.static && modifiers.members.probe('static', memberName).current()),
                bindingHost = (_isStatic ? params.staticInterface : obj),
                func_overloads = (_isStatic ? bindingHost[meta].overloads : _overloads),
                type_def_items = '',
                func_def = '';
            for(let arg of args) { type_def_items += '_' + typeof(arg); }
            if (type_def_items.startsWith('_')) { type_def_items = type_def_items.substr(1); }
            func_def = memberName + '_' + type_def_items;
            return func_overloads[func_def] || null;
        };
        const buildFunc = (memberName, memberType, memberDef) => {
            let _member = null,
                bindingHost = obj,
                _isOverriding = (cfg.inheritance && modifiers.members.probe('override', memberName).current()),
                _isStatic = (cfg.static && modifiers.members.probe('static', memberName).current()),
                _isASync = (modifiers.members.probe('async', memberName).current()),
                _deprecate_attr = attrs.members.probe('deprecate', memberName).current(),
                inject_attr = attrs.members.probe('inject', memberName).current(),
                on_attr = attrs.members.probe('on', memberName).current(),              // always look for current on, inherited case would already be baked in
                timer_attr = attrs.members.probe('timer', memberName).current(),          // always look for current timer
                args_attr = attrs.members.probe('args', memberName).current(),
                aspects_attr = attrs.members.probe('aspects', memberName).current(),
                fetch_attr = attrs.members.probe('fetch', memberName).current(),
                overload_attr = attrs.members.probe('overload', memberName).current(),
                _isDeprecate = (_deprecate_attr !== null),
                _deprecate_message = (_isDeprecate ? (_deprecate_attr.args[0] || `Function is marked as deprecate. (${def.name}::${memberName})`) : ''),
                base = null,
                _fetchMethod = '',
                _fetchResponse = '',
                _fetchUrl = '',
                _api = null,
                _injections = [];
    
            // override, if required
            if (_isOverriding) {
                base = obj[memberName].bind(bindingHost);
                // handle abstract definition (and no-definition) scenario
                if (base.ni === true || base === _noop) {
                    base = null; // so it is not available
                }
            } else if (_isStatic) {
                // shared (static) copy bound to staticInterface
                // so with 'this' it will be able to access only static properties
                bindingHost = params.staticInterface; // redefine binding host
            }
    
            // resolve injections first
            if (inject_attr) {  
                let _injectWhat = inject_attr.args[0],                                          // aliasName || qualifiedTypeName || Type itself
                    _injectWith = (inject_attr.args.length > 0 ? inject_attr.args[1] : []),     // [..., ...] <- any parameters to pass to constructor of type(s) being injected
                    _injectMany = (inject_attr.args.length > 1 ? inject_attr.args[2] : false);  // true | false <- if multi injection to be done
    
                _injections = _Container.resolve(_injectWhat, _injectWith, _injectMany);
                if (!Array.isArray(_injections)) { _injections = [_injections]; }
            }
    
            // define
            _isASync = _isASync || isASync(memberDef); // if memberDef is an async function, mark it as async automatically
            if (_isASync) {
                // resolve fetch parameters once
                if (fetch_attr && fetch_attr.args.length > 0) {
                    _fetchMethod = fetch_attr.args[0]; // get, post, put, delete, etc.
                    _fetchResponse = fetch_attr.args[1]; // json, text, blob, buffer, form
                    _fetchUrl = fetch_attr.args[2]; // url to reach
                    _api = (reqData = {}) => {
                        // add method, rest should come by the call itself
                        reqData.method = _fetchMethod;
                        
                        // make api call
                        return apiCall(_fetchUrl, _fetchResponse, reqData); // this returns a promise
                    };
                } else {
                    _api = null;
                }
    
                _member = async function(...args) {
                    return new Promise(function(resolve, reject) {
                        if (_isDeprecate) { console.log(_deprecate_message); } // eslint-disable-line no-console
                        let fnArgs = [];
                        if (base) { fnArgs.push(base); }                                // base is always first, if overriding
                        if (_api) { fnArgs.push(_api); }                                // api is always next to base, if fetch is used
                        if (_injections.length > 0) { fnArgs.push(_injections); }       // injections comes after base or as first, if injected
                        if (args_attr && args_attr.args.length > 0) {
                            let argsObj = _Args(...args_attr.args)(...args); 
                            if (argsObj.error) { reject(argsObj.error, memberDef); }
                            fnArgs.push(argsObj);                                       // push a single args processor's result object
                        } else {
                            fnArgs = fnArgs.concat(args);                               // add args as is
                        }
                        // get correct overload memberDef
                        if (overload_attr) {
                            memberDef = getOverloadFunc(memberName, ...fnArgs); // this may return null also, in that case it will throw below
                        }
                        try {
                            let memberDefResult = memberDef.apply(bindingHost, fnArgs);
                            if (memberDefResult && typeof memberDefResult.then === 'function') { // send result when it comes
                                memberDefResult.then(resolve).catch((err) => { reject(err, memberDef); });
                            } else {
                                resolve(memberDefResult); // send result as is
                            }
                        } catch (err) {
                            reject(err, memberDef);
                        }
                    }.bind(bindingHost));
                }.bind(bindingHost);
            } else {
                _member = function(...args) {
                    if (_isDeprecate) { console.log(_deprecate_message); }          // eslint-disable-line no-console
                    let fnArgs = [];
                    if (base) { fnArgs.push(base); }                                // base is always first, if overriding
                    if (_injections.length > 0) { fnArgs.push(_injections); }       // injections comes after base or as first, if injected
                    if (args_attr && args_attr.args.length > 0) {
                        let argsObj = _Args(...args_attr.args)(...args); argsObj.throwOnError(builder);
                        fnArgs.push(argsObj);                                       // push a single args processor's result object
                    } else {
                        fnArgs = fnArgs.concat(args);                               // add args as is
                    }
                    // get correct overload memberDef
                    if (overload_attr) {
                        memberDef = getOverloadFunc(memberName, ...fnArgs); // this may return null also, in that case it will throw below
                    }                   
                    return memberDef.apply(bindingHost, fnArgs);
                }.bind(bindingHost);                  
            }
    
            // apply custom attributes
            if (cfg.customAttrs) {
                _member = applyCustomAttributes(bindingHost, memberName, memberType, _member);
            }
    
            // weave advices from aspects
            if (cfg.aop) {
                let staticAspects = [];
                if (aspects_attr && aspects_attr.args.length > 0) { 
                    // validate, each being of type Aspect
                    aspects_attr.args.forEach(item => {
                        if (!_is(item, 'Aspect')) {
                            throw _Exception.InvalidArgument(`Only Aspect types can be statically weaved on function. (${def.name}::${memberName})`, builder); 
                        }
                    });
                    staticAspects = aspects_attr.args; 
                }
                // staticAspects are actual type references - cannot be just type names
                _member = applyAspects(memberName, _member, staticAspects);
            }
    
            // hook it to handle posted event, if configured
            if (on_attr && on_attr.args.length > 0) {
                _on(on_attr.args[0], _member); // attach event handler
                addDisposable('handler', {name: on_attr.args[0], handler: _member});
            }
    
            // hook it to run on timer if configured
            if (timer_attr && timer_attr.args.length > 0) {
                let isInTimerCode = false;
                let intervalId = setInterval(() => {
                    // run only, when object construction is completed
                    if (!bindingHost[meta].constructing && !isInTimerCode) {
                        isInTimerCode = true;
                        obj[memberName](); // call as if called from outside
                        isInTimerCode = false;
                    }
                }, (timer_attr.args[0] * 1000));         // timer_attr.args[0] is number of seconds (not milliseconds)
                addDisposable('timer', intervalId);
            }
    
            // return
            return _member;
        };
        const buildEvent = (memberName, memberType, memberDef) => {
            let _member = null,
                argsProcessorFn = null,
                base = null,
                fnArgs = null,
                _isOverriding = (cfg.inheritance && modifiers.members.probe('override', memberName).current()), 
                _deprecate_attr = attrs.members.probe('deprecate', memberName).current(),
                _post_attr = attrs.members.probe('post', memberName).current(), // always post as per what is defined here, in case of overriding
                _isDeprecate = (_deprecate_attr !== null),
                _deprecate_message = (_isDeprecate ? (_deprecate_attr.args[0] || `Event is marked as deprecate. (${def.name}::${memberName})`) : ''),
                bindingHost = obj;
    
            // create dispatcher, if not already created
            if (!_member_dispatcher) {
                _member_dispatcher = new Dispatcher(def.name);
                addDisposable('event', _member_dispatcher); // so it can be cleared on dispose
            }
    
            // override, if required
            if (_isOverriding) {
                // wrap for base call
                base = obj[memberName][meta].processor;
                if (base.ni === true) {
                    base = null; // so it is not available
                }
            } 
       
            // define
            _member = function(...args) {
                if (_isDeprecate) { console.log(_deprecate_message); } // eslint-disable-line no-console
                if (base) {
                    fnArgs = [base].concat(args); 
                } else {
                    fnArgs = args; 
                }
                return memberDef.apply(bindingHost, fnArgs);
            }.bind(bindingHost);                  
    
           // apply custom attributes (before event interface is added)
            if (cfg.customAttrs) {
                _member = applyCustomAttributes(bindingHost, memberName, memberType, _member);
            }
    
            // attach event interface
            argsProcessorFn = _member; 
            _member = function(...args) {
                // preprocess args
                let processedArgs = args;
                if (typeof argsProcessorFn === 'function') { processedArgs = argsProcessorFn(...args); }
    
                // dispatch
                _member_dispatcher.dispatch(memberName, processedArgs);
    
                // post, if configured
                if (_post_attr && _post_attr.args.length > 0) { // post always happens for current() configuration, in case of overriding, any post defined on inherited event is lost
                    _post(_post_attr.args[0], processedArgs);   // .args[0] is supposed to the channel name on which to post, so there is no conflict
                }
            }.bind(bindingHost);
            _member[meta] = Object.freeze({
                processor: argsProcessorFn
            });
            _member.add = (handler) => { _member_dispatcher.add(memberName, handler); };
            _member.remove = (handler) => { _member_dispatcher.remove(memberName, handler); };
            _member.strip = () => {
                // returns the stripped version of the event without event raising ability
                let strippedEvent = shallowCopy({}, _member, true, ['strip']);
    
                // delete strip feature now, it is no longer needed
                delete _member.strip;
                
                // send redefined event function as event object
                return Object.freeze(strippedEvent);
            }
    
            // return
            return _member;
        };
        const addMember = (memberName, memberType, memberDef) => {
            // validate pre-definition feasibility of member definition - throw when failed - else return updated or same memberType
            memberType = validatePreMemberDefinitionFeasibility(memberName, memberType, memberDef); 
    
            // overload is defined only once, rest all times, it is just configured for the overload state
            // any attributes or modifiers are ignored the second time - and settings with first definition are taken
            if (handleOverload(memberName, memberType, memberDef)) { return; } // skip defining this member
    
            // set/update member meta
            // NOTE: This also means, when a mixed member is being overwritten either
            // because of other mixin or by being defined here, these values will be
            // overwritten as per last added member
            def.members[memberName] = memberType;
            def.attrs.members[memberName] = [];
            def.modifiers.members[memberName] = [];
            if (cfg.aop) {
                def.aspects = {
                    members: {} // each named item array in here will have: [aspect type]
                };
            }
    
            // pick mixin being applied at this time
            if (cfg.mixins) {        
                if (mixin_being_applied !== null) {
                    _attr('mixin', mixin_being_applied[meta].name);
                }
            }
    
            // add async attribute, if member is async function and async attribute is not added manually
            if (memberType === 'func' && isASync(memberDef) && !_attr.has('async'))  {
                _attr_i('async'); // insert on top, so other dependent attributes (like fetch) gets validated successfully
            }
    
            // collect attributes and modifiers - validate applied attributes as per attribute configuration - throw when failed
            attributesAndModifiers(def, typeDef, memberName, false, cfg.customAttrs);
    
            // static construction cycle specific control
            let memberValue = null,
                _isStatic = ((cfg.static && modifiers.members.probe('static', memberName).current())),
                bindingHost = (_isStatic ? params.staticInterface : obj);
            if (_isStatic) {  // a static member
                if (!typeDef.staticConstructionCycle) { return; } // don't process in a non static construction cycle
            } else { // non-static member
                if (typeDef.staticConstructionCycle) { return; } // don't process in a static construction cycle
            }
    
            // validate feasibility of member definition - throw when failed
            // it may update the property value, if situation is
            if (!validateMemberDefinitionFeasibility(bindingHost, memberName, memberType, memberDef)) { return; } // skip defining this member
    
            // member type specific logic
            switch(memberType) {
                case 'func':
                    memberValue = buildFunc(memberName, memberType, memberDef);
                    Object.defineProperty(bindingHost, memberName, {
                        configurable: true, enumerable: true,
                        value: memberValue
                    });
                    break;
                case 'prop':
                    memberValue = buildProp(memberName, memberType, memberDef);
                    Object.defineProperty(bindingHost, memberName, {
                        configurable: true, enumerable: true,
                        get: memberValue.get, set: memberValue.set
                    });
                    break;
                case 'event':
                    memberValue = buildEvent(memberName, memberType, memberDef);
                    Object.defineProperty(bindingHost, memberName, { // events are always defined on objects, and static definition is not allowed
                        configurable: true, enumerable: true,
                        value: memberValue
                    });
                    break;
            }
    
            // add to private list, if this is private
            if (modifiers.members.probe('private', memberName).current()) { 
                def.scope[memberName] = 'private';
            } else if (modifiers.members.probe('protected', memberName).current()) {
                def.scope[memberName] = 'protected';
            } else {
                def.scope[memberName] = 'public';
            }
        };
        const addDisposable = (disposableType, data) => {
            objMeta.disposables.push({type: disposableType, data: data});
        }
        const modifiers = modifierOrAttrRefl(true, def, typeDef);
        const attrs = modifierOrAttrRefl(false, def, typeDef);
        
        // construct base object from parent, if applicable
        if (cfg.inheritance) {
            if (params.isTopLevelInstance && !typeDef.staticConstructionCycle && !isNewFromReflector) {
                if (modifiers.type.probe('abstract').current()) { throw _Exception.InvalidOperation(`Cannot create instance of an abstract type. (${def.name})`, builder); }
            }
    
            // create parent instance, if required, else use passed object as base object
            let Parent = TypeMeta.inherits,
                ParentMeta = null;
            if (Parent) {
                ParentMeta = Parent[meta];
                if (ParentMeta.isSealed() || ParentMeta.isSingleton() || ParentMeta.isStatic()) {
                    throw _Exception.InvalidDefinition(`Cannot inherit from a sealed, static or singleton type. (${ParentMeta.name})`, builder); 
                }
                if (ParentMeta.type !== TypeMeta.type) {
                    throw _Exception.InvalidDefinition(`Cannot inherit from another type family. (${ParentMeta.type})`, builder); 
                }
                if (ParentMeta.context && ParentMeta.context.isUnloaded()) {
                    throw _Exception.InvalidOperation(`Parent context is not active anymore. (${ParentMeta.name})`, builder); 
                }
    
                // construct base object (the inherited one)
                obj = new Parent(params._flagName, params.staticInterface, params.args); // obj reference is now parent of object
                objMeta = obj[meta];
    
                // pick previous level def
                _previousDef = objMeta.def;
                delete objMeta.def;
            } else {
                // check for own context
                if (TypeMeta.context && TypeMeta.context.isUnloaded()) {
                    throw _Exception.InvalidOperation(`Type context is not active anymore. (${TypeMeta.name})`, builder); 
                }
            }
        }
    
        // set object meta
        if (typeof obj[meta] === 'undefined') {
            // these will always be same, since inheritance happen in same types, and these are defined at a type configuration level, so these will always be same and should behave just like the next set of definitions here
            obj[meta] = {};
            objMeta = obj[meta];
            if (cfg.dispose) {
                objMeta.disposables = []; // can have {type: 'session', data: 'unique name'} OR {type: 'state', data: 'unique name'} OR {type: 'prop', data: 'prop name'} OR {type: 'event', data: dispatcher object} OR {type: 'handler', data: {name: 'event name', handler: exact func that was attached}}
            }
        }
        if (cfg.mixins) {
            def.mixins = cfg.params.mixins; // mixin types that were applied to this type, will be deleted after apply
        }
        if (cfg.interfaces) {
            def.interfaces = cfg.params.interfaces; // interface types that were applied to this type, will be deleted after validation
        }
        objMeta.type = cfg.types.instance; // as defined for this instance by builder, this will always be same for all levels -- class 'instance' at all levels will be 'instance' only
        if (params.isTopLevelInstance) {
            objMeta.Type = Type; // top level Type (all inheritance for these types will come from TypeMeta.inherits)
            if (cfg.new) {
                objMeta.isInstanceOf = (name) => {
                    if (name[meta]) { name = name[meta].name; } // could be the 'Type' itself
                    if (!name) { throw _Exception.InvalidArgument('name', builder); }
                    return (TypeMeta.name === name) || TypeMeta.isDerivedFrom(name); 
                };
            }
            if (cfg.mixins) {
                objMeta.isMixed = (name) => { return TypeMeta.isMixed(name); };
            }
            if (cfg.interfaces) {
                objMeta.isImplements = (name) => { return TypeMeta.isImplements(name); };
            }
            objMeta.modifiers = modifiers;
            objMeta.attrs = attrs;
            if (isNewFromReflector) { // expose internals as well for reflector
                objMeta.def = def;
                objMeta.typeDef = typeDef;
                objMeta.obj = obj;
            }
        }
    
    
    
        // define proxy for clean syntax inside factory
        proxy = new Proxy({}, {
            get: (_obj, name) => { 
                if (cfg.new && name !== meta && name.substr(0, 1) === '$') {
                    if (name === '$Type') { return $Type; } // since when a class is inheriting from other class, it is actually the Type of the type being created, and not the chain of classes it is inheriting - so at any level, it will be same
                    if (name === '$static') { return def.Type; } // since static must be tied to the level where a static is being defined, therefore at runtime, it must be read from same level type itself
                }
                if (name === 'construct') {
                    name = _constructName;
                } else if (name === 'dispose') {
                    name = _disposeName;
                }
                let read_obj = getObjToOperateOn(name, def.members[name], def.scope[name]);
                return read_obj[name];
            },
            set: (_obj, name, value) => {
                if (cfg.new && name !== meta && name.substr(0, 1) === '$') { throw _Exception.InvalidOperation(`Special members cannot be custom defined. (${name})`, builder); }
                if (isBuildingObj) {
                    // get member type
                    let memberType = '';
                    if (name === 'construct') {
                        memberType = 'construct'; 
                        name = _constructName;
                    } else if (name === 'dispose') {
                        memberType = 'dispose'; 
                        name = _disposeName;
                    } else {
                        if (typeof value === 'function') {
                            if (value.event === true) {
                                if(value !== _nie) {
                                    delete value.event;
                                }
                                memberType = 'event'; 
                            } else {
                                memberType = 'func'; 
                            }
                        } else {
                            memberType = 'prop';
                        }
                    }
                    
                    // add or validate member
                    addMember(name, memberType, value);
                } else {
                    // a function or event is being redefined or noop is being redefined
                    if (typeof value === 'function') { throw _Exception.InvalidOperation(`Redefinition of members is not allowed. (${name})`, builder); }
    
                    // allow setting property values
                    let write_obj = getObjToOperateOn(name, def.members[name], def.scope[name], true); // true = write case
                    write_obj[name] = value;
                }
                return true;
            }
        });
    
        // building started
        isBuildingObj = true; 
    
        // apply mixins
        if (cfg.mixins && def.mixins && !typeDef.staticConstructionCycle) { 
            for(let mixin of def.mixins) {
                mixin_being_applied = mixin;
                mixin.apply(proxy); // run mixin's factory too having 'this' being proxy object
                mixin_being_applied = null;
            }
    
            // delete it, its no longer needed (a reference is available at Type level)
            delete def.mixins;
        }
    
        // construct using factory having 'this' being proxy object
        cfg.params.factory.apply(proxy);
    
        // clear any (by user's error left out) attributes, so that are not added by mistake elsewhere
        _attr.clear();
    
        // building ends
        isBuildingObj = false;    
    
        // move constructor and dispose out of main object
        if (params.isTopLevelInstance) { // so that till now, a normal override behavior can be applied to these functions as well
            if (cfg.construct && typeof obj[_constructName] === 'function') {
                objMeta.construct = obj[_constructName]; delete obj[_constructName];
            }
            if (cfg.dispose && typeof obj[_disposeName] === 'function') {
                // wrap dispose to clean all types of disposables
                let customDisposer = obj[_disposeName]; delete obj[_disposeName];
                objMeta.dispose = () => {
                    // clear all disposables
                    for(let item of objMeta.disposables) {
                        switch(item.type) {
                            case 'session': _sessionStorage.removeItem(item.data); break;           // data = sessionStorage key name
                            case 'state': _localStorage.removeItem(item.data); break;               // data = localStorage key name
                            case 'prop': obj[item.data] = null; break;                              // data = property name
                            case 'event': item.data.clear(); break;                                 // data = dispatcher object
                            case 'handler': _on(item.data.name, item.data.handler, true); break;    // data = {name: event name, handler: handler func}
                            case 'timer': clearInterval(item.data); break;                          // data = id returned by the setInterval() call
                        }
                    }
    
                    // call customer disposer
                    if (typeof customDisposer === 'function') {
                        customDisposer();
                    }
    
                    // clear all key references related to this object
                    objMeta.disposables.length = 0; 
                    _props = null;
                    _previousDef = null;
                    def = null;
                    proxy = null;
                    _member_dispatcher = null;
                    exposed_obj = null;
                    obj = null;
                };
            }  
        }
    
        // move static constructor out of main interface
        if (cfg.static && TypeMeta.isStatic() && typeDef.staticConstructionCycle) {
            if (Type.construct && typeof Type[_constructName] === 'function') {
                TypeMeta.construct = Type[_constructName]; delete Type[_constructName];
            }
        }
    
        // prepare protected and public interfaces of object
        buildExposedObj();
    
        // validate interfaces of type
        if (cfg.interfaces && !typeDef.staticConstructionCycle && !isNewFromReflector) {
            validateInterfaces();
        }
    
        // call constructor
        if (cfg.construct && params.isTopLevelInstance && !typeDef.staticConstructionCycle && !isNewFromReflector && typeof exposed_objMeta.construct === 'function') {
            exposed_objMeta.constructing = true;
            exposed_objMeta.construct(...params.args);
            delete exposed_objMeta.constructing;
        }
        if (cfg.construct && typeDef.staticConstructionCycle && typeof TypeMeta.construct === 'function') {
            TypeMeta.constructing = true;
            TypeMeta.construct();
            delete TypeMeta.constructing;
        }
    
        // add/update meta on top level instance
        if (params.isTopLevelInstance && !typeDef.staticConstructionCycle && !isNewFromReflector) {
            if (cfg.singleton && attrs.type.probe('singleton').current()) {
                TypeMeta.singleInstance.value = exposed_obj;
            }
        }
    
        // seal object, so nothing can be added/deleted from outside
        // also, keep protected version intact for 
        if (params.isTopLevelInstance && !typeDef.staticConstructionCycle && !isNewFromReflector) {
            exposed_objMeta = Object.freeze(exposed_objMeta); // freeze meta information
            exposed_obj = Object.seal(exposed_obj);
        }
    
        // return
        return exposed_obj;
    };
    const builder_dispose = () => {
        // all dispose time actions that builder need to do
        
        // clear sessionStorage
        let externalHandler = _Port('sessionStorage');   
        if (externalHandler) {
            externalHandler.clear();
        } else {
            if (isServer) {
                if (global.sessionStorage) { delete global.sessionStorage; }
            } else {
                sessionStorage.clear();
            }
        }
    };
    const builder = (cfg) => {
        // process cfg
        cfg.new = cfg.new || false;
        cfg.mixins = cfg.mixins || false;
        cfg.interfaces = cfg.interfaces || false;
        cfg.inheritance = cfg.inheritance || false;
        cfg.singleton = cfg.singleton || false;
        cfg.static = cfg.static || false;
        cfg.const = cfg.const || false;
        cfg.func = cfg.func || false;
        cfg.construct = cfg.construct || false;
        cfg.dispose = cfg.dispose || false;
        cfg.prop = cfg.prop || false;
        cfg.propGetterSetter = cfg.propGetterSetter || false;
        cfg.numOnlyProps = cfg.numOnlyProps || false;
        cfg.event = cfg.event || false;
        cfg.storage = cfg.storage || false;
        cfg.aop = cfg.aop || false;
        cfg.customAttrs = cfg.customAttrs || false;
        cfg.types = cfg.types || {};
        cfg.types.instance = cfg.types.instance || 'unknown';
        cfg.types.type = cfg.types.type || 'unknown';
        cfg.params = cfg.params || {};
        cfg.params.typeName = cfg.params.typeName || '';
        cfg.params.inherits = cfg.params.inherits || null;
        cfg.params.mixinsAndInterfaces = cfg.params.mixinsAndInterfaces || null; 
        cfg.params.factory = cfg.params.factory || null;
        cfg.mex = cfg.mex || {};
        cfg.mex.instance = ((cfg.mex && cfg.mex.instance) ? cfg.mex.instance : {});
        cfg.mex.type = ((cfg.mex && cfg.mex.type) ? cfg.mex.type : {})
        cfg.ex = cfg.ex || {};
        cfg.ex.instance = ((cfg.ex && cfg.ex.instance) ? cfg.ex.instance : {});
        cfg.ex.type = ((cfg.ex && cfg.ex.type) ? cfg.ex.type : {});
        cfg.params.ns = '';
        cfg.params.mixins = [];
        cfg.params.interfaces = [];
        if (!cfg.func) {
            cfg.construct = false;
            cfg.dispose = false;
        }
        if (!cfg.prop) {
            cfg.storage = false;
        }
        if (!cfg.inheritance) {
            cfg.singleton = false;
        }
        if (!cfg.func && !cfg.prop && !cfg.event) {
            cfg.aop = false;
        }
        if (cfg.new) {
            cfg.const = false;
        }
    
        // type name and namespace validations
        if (!cfg.params.typeName || cfg.params.typeName.indexOf('.') !== -1) { throw _Exception.InvalidDefinition(`Type name is invalid. (${cfg.params.typeName})`, builder); } // dots are not allowed in names
        // peer ns attribute on type and if found merge it with name
        let ns_attr = _attr.get('ns'),
            ns = ns_attr ? ns_attr.args[0] : '';
        if (ns) {
            switch(ns) {
                case '(auto)':  // this is a placeholder that gets replaced by assembly builder with dynamic namespace based on folder structure, so if is it left, it is wrong
                    throw _Exception.InvalidDefinition(`Namespace '(auto)' should be used only when bundling the type in an assembly. (${ns})`, builder);
                case '(root)':  // this is mark to instruct builder that register type at root namespace
                    break; // go on
                default: // anything else
                    // namespace name must not contain any special characters and must not start or end with .
                    if (ns.startsWith('.') || ns.endsWith('.') || /[~`!#$%\^&*+=\-\[\]\\';,/{}|\\":<>\?]/g.test(ns)) { throw  `Namespace name is invalid. (${ns})`; } // eslint-disable-line no-useless-escape
                    cfg.params.typeName = ns + '.' + cfg.params.typeName; // add namespace to name here onwards
                    cfg.params.ns = ns;
                    break;
            }
        }
    
        // extract mixins and interfaces
        if (cfg.params.mixinsAndInterfaces) {
            for(let item of cfg.params.mixinsAndInterfaces) {
                if (item[meta]) {
                    switch (item[meta].type) {
                        case 'mixin': cfg.params.mixins.push(item); break;
                        case 'interface': cfg.params.interfaces.push(item); break;
                    }
                }
            }
        }
        delete cfg.params.mixinsAndInterfaces;
    
        // define extensions
        defineExtensions(cfg);
    
        // pick current context in which this type is being registered
        let currentContext = _AppDomain.context.current();
    
        // base type definition
        let _Object = null,
            _ObjectMeta = null;
        if (cfg.new) { // class, struct
            if (cfg.inheritance) { // class
                if (cfg.params.inherits) {
                    if (_isStatic(cfg.params.inherits) || _isSingleton(cfg.params.inherits) || _isSealed(cfg.params.inherits)) {
                        throw _Exception.InvalidDefinition(`Cannot inherit from a sealed, static or singleton type. (${cfg.params.inherits[meta].name})`, builder); 
                    }
                }
                _Object = function(_flag, _static, ...args) {
                    return buildTypeInstance(cfg, _Object, {}, _flag, _static, ...args);
                };
            } else { // struct
                _Object = function(...args) {
                    return buildTypeInstance(cfg, _Object, {}, null, null, ...args);
                };
            }
        } else { // mixin, interface, enum
            if(cfg.const) { // enum, interface
                _Object = function() {
                    return buildTypeInstance(cfg, _Object, {});
                };            
            } else { // mixin
                _Object = function(...args) {
                    if (new.target) { // called with new which is not allowed
                        throw _Exception.InvalidOperation(`Construction cannot be done for this type. (${cfg.params.typeName})`, _Object);
                    } else {
                        cfg.params.factory.apply(this, ...args);
                    }
                }
            }
        }
    
        // type def
        let typeDef = { 
            name: cfg.params.typeName,
            flatname: replaceAll(cfg.params.typeName, '.', '_'),
            type: cfg.types.type, // the type of the type itself: class, struct, etc.
            Type: _Object,
            level: 'type',
            attrs: { 
                type: [], // will have: {name, cfg, isCustom, attr, args}
            },
            modifiers: {
                type: [], // will have: {name, cfg, attr, args}
            },
            previous: () => {
                return _Object[meta].inherits ? _Object[meta].inherits[meta].def() : null;
            }
        };
        const modifiers = modifierOrAttrRefl(true, null, typeDef);
        const attrs = modifierOrAttrRefl(false, null, typeDef);
    
        // set type meta
        _Object[meta] = {};
        _ObjectMeta = _Object[meta];
        _ObjectMeta.name = cfg.params.typeName;
        _ObjectMeta.type = cfg.types.type;
        _ObjectMeta.namespace = null;
        _ObjectMeta.assembly = () => { 
            let currentAssembly = _getAssemblyOf(cfg.params.typeName);
            return currentContext.getAssembly(currentAssembly) || null; 
        };
        _ObjectMeta.context = currentContext;
        if (cfg.inheritance) {
            _ObjectMeta.inherits = cfg.params.inherits || null;
            _ObjectMeta.isAbstract = () => { return modifiers.type.probe('abstract').current() ? true : false; };
            _ObjectMeta.isSealed = () => { return modifiers.type.probe('sealed').current() ? true : false; };
            _ObjectMeta.isDerivedFrom = (name) => { 
                if (name[meta]) { name = name[meta].name; }
                if (typeof name !== 'string') { throw _Exception.InvalidArgument('name', _ObjectMeta.isDerivedFrom); }
                let result = false,
                    prv = cfg.params.inherits; // look from parent onwards
                if (!result) {
                    while(true) { // eslint-disable-line no-constant-condition
                        if (prv === null) { break; }
                        if (prv[meta].name === name) { result = true; break; }
                        prv = prv[meta].inherits;
                    }
                }
                return result;
            };
    
            // warn for type deprecate at the time of inheritance
            if (_ObjectMeta.inherits) {
                let the_attr = attrs.type.probe('deprecate').anywhere();
                if (the_attr) {
                    let deprecateMessage = the_attr.args[0] || `Type is marked as deprecated. (${_ObjectMeta.name})`;
                    console.log(deprecateMessage); // eslint-disable-line no-console
                }            
            }
        }
        if (cfg.static) {
            _ObjectMeta.isStatic = () => { return modifiers.type.probe('static').current() ? true : false; };
            _ObjectMeta.props = {}; // static property values host
            _ObjectMeta.overloads = {}; // static overload functions host
        }
        if (cfg.singleton) {
            _ObjectMeta.isSingleton = () => { return attrs.type.probe('singleton').current() ? true : false; };
            _ObjectMeta.singleInstance = { value: null };
        }
        if (cfg.mixins) {
            _ObjectMeta.mixins = cfg.params.mixins; // mixin types that were applied to this type
            _ObjectMeta.isMixed = (name) => {
                if (name[meta]) { name = name[meta].name; }
                if (typeof name !== 'string') { throw _Exception.InvalidArgument('name', _ObjectMeta.isMixed); }
                let result = false,
                    prv = _Object; // look from this itself
                while(true) { // eslint-disable-line no-constant-condition
                    if (prv === null) { break; }
                    if (prv[meta].mixins) { result = (findItemByProp(prv[meta].mixins, 'name', name) !== -1); }
                    if (result) { break; }
                    prv = prv[meta].inherits;
                }
                return result;
            };
        }
        if (cfg.interfaces) {
            _ObjectMeta.interfaces = cfg.params.interfaces,     
            _ObjectMeta.isImplements = (name) => {
                if (name[meta]) { name = name[meta].name; }
                if (typeof name !== 'string') { throw _Exception.InvalidArgument('name', _ObjectMeta.isImplements); }
                let result = false,
                    prv = _Object; // look from this itself
                while(true) { // eslint-disable-line no-constant-condition
                    if (prv === null) { break; }
                    if (prv[meta].interfaces) { result = (findItemByProp(prv[meta].interfaces, 'name', name) !== -1); }
                    if (result) { break; }
                    prv = prv[meta].inherits;
                }
                return result;
            };                
        }
        _ObjectMeta.isDeprecated = () => { 
            return attrs.type.probe('deprecate').current() ? true : false;
        };
        _ObjectMeta.def = () => { return typeDef; };
        _ObjectMeta.modifiers = modifiers;
        _ObjectMeta.attrs = attrs;
    
        // type level attributes pick here
        attributesAndModifiers(null, typeDef, null, true, cfg.customAttrs);
    
        // validations
        if (cfg.static && modifiers.type.probe('static').current()) {
            if (cfg.params.interfaces.length > 0) {
                throw _Exception.InvalidDefinition('Static types cannot implement interfaces.', builder);
            }
            if (cfg.params.mixins.length > 0) {
                throw _Exception.InvalidDefinition('Static types cannot implement mixins.', builder);
            }
        }    
    
        // static construction cycle
        if (cfg.static) {
            let factoryCode = (cfg.params.factory ? cfg.params.factory.toString() : '');
            if (_ObjectMeta.isStatic() || factoryCode.indexOf(`$$('static')`) !== -1 || factoryCode.indexOf(`$$("static")`) !== -1) {
                typeDef.staticConstructionCycle = true;
                let tempObj = new _Object();
                _dispose(tempObj); // so any auto-wiring of events etc is cleaned up along with anything else done in types
                delete typeDef.staticConstructionCycle;
            }
        }
    
        // extend type itself with type's extensions
        // it may overwrite inbuilt defaults
        addTypeExtensions(cfg.ex.type, _Object, _Object, typeDef, attrs, modifiers, meta);
    
        // extend type meta  with type's meta extensions
        // it may overwrite inbuilt defaults
        addTypeExtensions(cfg.mex.type, _Object, _ObjectMeta, typeDef, attrs, modifiers, meta);
    
        // get final return value
        let _finalObject = null,
            toFreeze = false;
        if ((cfg.static && _ObjectMeta.isStatic()) || cfg.const) {
            _finalObject = new _Object();
            if (cfg.const) { toFreeze = true; }
        } else { // return type
            toFreeze = true;
            _finalObject = _Object;
        }
    
        // register type with current context of current load context
        if (ns) { // if actual namespace or '(root)' is there, then go and register
            _ObjectMeta.namespace = _AppDomain.context.current().registerType(_finalObject);
        }
    
        // freeze object meta
        _Object[meta] = Object.freeze(_ObjectMeta);
    
        // freeze final object
        if (toFreeze) { Object.freeze(_finalObject); }
    
        // return 
        return _finalObject;
    };
      
    /**
     * @name Class
     * @description Constructs a Class type.
     * @example
     *  Class(name, factory)
     *  Class(name, inherits, factory)
     *  Class(name, mixints, factory)
     *  Class(name, inherits, mixints, factory)
     * @params
     *  name: string - name of the class
     *                 it can take following forms:
     *                 >> simple, e.g.,
     *                    MyClass
     *                 >> auto naming, e.g., 
     *                    '(auto)'
     *                    Use this only when putting only one class in a file and using flairBuild builder to build assembly
     *                    And in that case, filename will be used as class name. So if file name is 'MyClass.js', name would be 'MyClass' (case sensitive)
     *                    To give namespace to a type, use $$('ns', 'com.product.feature');
     *                    Apply this attribute on class definition itself. then class can be accessed as getType('com.product.feature.MyClass');
     *                    To give automatic namespaces to types based on the folder structure under assembly folder, use
     *                    $$('ns', '(auto)'); In this case if MyClass was put in a folder hierarchy as com/product/feature, it will
     *                    be given namespace com.product.feature
     *                    To put a type in root namespace, use $$('ns' '(root)') or just put it in '(root)' folder and
     *                    use $$('ns', '(auto)');
     *                    Then class can be accessed as getType('MyClass');
     *  inherits: type - A flair class type from which to inherit this class
     *  mixints: array - An array of mixin and/or interface types which needs to be applied to this class type
     *                        mixins will be applied in order they are defined here
     *  factory: function - factory function to build class definition
     * @returns type - constructed flair class type
     */
    const _Class = (name, inherits, mixints, factory) => {
        let args = _Args('name: string, inherits: class, factory: cfunction',
                         'name: string, inherits: class, mixints: array, factory: cfunction',
                         'name: string, factory: cfunction', 
                         'name: string, mixints: array, factory: cfunction')(name, inherits, mixints, factory); args.throwOnError(_Class);
    
        // builder config (full set of configuration)
        let cfg = {
            new: true,
            mixins: true,
            interfaces: true,
            inheritance: true,
            singleton: true,
            static: true,
            func: true,
            construct: true,
            dispose: true,
            prop: true,
            propGetterSetter: true,
            event: true,
            storage: true,
            aop: true,
            customAttrs: true,
            types: {
                instance: 'instance',
                type: 'class'
            },
            params: {
                typeName: args.values.name,
                inherits: args.values.inherits,
                mixinsAndInterfaces: args.values.mixints,
                factory: args.values.factory
            },
            mex: {  // meta extensions (under <>[meta] property)
                instance: {},
                type: {}
            },
            ex: {   // extensions (on <> itself)
                instance: {},
                type: {}
            }
        };
        
        // return built type
        return builder(cfg);
    };
    
    // attach to flair
    a2f('Class', _Class);  
    /**
     * @name Interface
     * @description Constructs a Interface type
     * @example
     *  Interface(name, factory)
     * @params
     *  name: string - name of the interface
     *                 it can take following forms:
     *                 >> simple, e.g.,
     *                    IInterfaceName
     *                 >> auto naming, e.g., 
     *                    '(auto)'
     *                    Use this only when putting only one interface in a file and using flairBuild builder to build assembly
     *                    And in that case, filename will be used as interface name. So if file name is 'IInterfaceName.js', name would be 'IInterfaceName' (case sensitive)
     *                    To give namespace to a type, use $$('ns', 'com.product.feature');
     *                    Apply this attribute on interface definition itself. then interface can be accessed as getType('com.product.feature.IInterfaceName');
     *                    To give automatic namespaces to types based on the folder structure under assembly folder, use
     *                    $$('ns', '(auto)'); In this case if IInterfaceName was put in a folder hierarchy as com/product/feature, it will
     *                    be given namespace com.product.feature
     *                    To put a type in root namespace, use $$('ns' '(root)') or just put it in '(root)' folder and
     *                    use $$('ns', '(auto)');
     *                    Then interface can be accessed as getType('IInterfaceName');
     *  factory: function - factory function to build interface definition
     * @returns type - constructed flair interface type
     */
    const _Interface = (name, factory) => {
        let args = _Args('name: string, factory: cfunction')(name, factory); args.throwOnError(_Interface);
    
        // builder config
        let cfg = {
            const: true,
            func: true,
            dispose: true,
            prop: true,
            propGetterSetter: true, // note: because of allowing 'nip'
            event: true,
            types: {
                instance: 'interface',
                type: 'interface'
            },
            params: {
                typeName: args.values.name,
                factory: args.values.factory
            }
        };
    
        // return built type
        return builder(cfg);
    };
    
    // attach to flair
    a2f('Interface', _Interface);
      
    /**
     * @name Struct
     * @description Constructs a Struct type
     * @example
     *  Struct(name, factory)
     * @params
     *  name: string - name of the struct
     *                 >> simple, e.g.,
     *                    MyStruct
     *                 >> auto naming, e.g., 
     *                    '(auto)'
     *                    Use this only when putting only one struct in a file and using flairBuild builder to build assembly
     *                    And in that case, filename will be used as struct name. So if file name is 'MyStruct.js', name would be 'MyStruct' (case sensitive)
     *                    To give namespace to a type, use $$('ns', 'com.product.feature');
     *                    Apply this attribute on struct definition itself. then struct can be accessed as getType('com.product.feature.MyStruct');
     *                    To give automatic namespaces to types based on the folder structure under assembly folder, use
     *                    $$('ns', '(auto)'); In this case if MyStruct was put in a folder hierarchy as com/product/feature, it will
     *                    be given namespace com.product.feature
     *                    To put a type in root namespace, use $$('ns' '(root)') or just put it in '(root)' folder and
     *                    use $$('ns', '(auto)');
     *                    Then struct can be accessed as getType('MyStruct');
     *  factory: function - factory function to build struct definition
     * @returns type - constructed flair struct type
     */
    const _Struct = (name, factory) => {
        let args = _Args('name: string, factory: cfunction')(name, factory); args.throwOnError(_Struct);
    
        // builder config
        let cfg = {
            new: true,
            func: true,
            construct: true,
            prop: true,
            propGetterSetter: true,
            types: {
                instance: 'sinstance',
                type: 'struct'
            },
            params: {
                typeName: args.values.name,
                factory: args.values.factory
            }
        };
    
        // return built type
        return builder(cfg);
    };
    
    // attach to flair
    a2f('Struct', _Struct);
      
    /**
     * @name Enum
     * @description Constructs a Enum type
     * @example
     *  Enum(name, factory)
     * @params
     *  name: string - name of the enum
     *                 >> simple, e.g.,
     *                    MyEnum
     *                 >> auto naming, e.g., 
     *                    '(auto)'
     *                    Use this only when putting only one enum in a file and using flairBuild builder to build assembly
     *                    And in that case, filename will be used as enum name. So if file name is 'MyEnum.js', name would be 'MyEnum' (case sensitive)
     *                    To give namespace to a type, use $$('ns', 'com.product.feature');
     *                    Apply this attribute on enum definition itself. then enum can be accessed as getType('com.product.feature.MyEnum');
     *                    To give automatic namespaces to types based on the folder structure under assembly folder, use
     *                    $$('ns', '(auto)'); In this case if MyEnum was put in a folder hierarchy as com/product/feature, it will
     *                    be given namespace com.product.feature
     *                    To put a type in root namespace, use $$('ns' '(root)') or just put it in '(root)' folder and
     *                    use $$('ns', '(auto)');
     *                    Then enum can be accessed as getType('MyEnum');
     *  factory: function - factory function to build enum definition
     * @returns type - constructed flair enum type
     */
    const _Enum = (name, factory) => {
        let args = _Args('name: string, factory: cfunction')(name, factory); args.throwOnError(_Enum);
    
        // builder config
        let cfg = {
            const: true,
            prop: true,
            numOnlyProps: true,
            types: {
                instance: 'enum',
                type: 'enum'
            },
            params: {
                typeName: args.values.name,
                factory: args.values.factory
            },
            mex: {   // meta extensions
                instance: {
                    getName: function (value) { 
                        // get internal information { instance.{obj, def, attrs, modifiers}, type.{Type, def, attrs, modifiers}}
                        let obj = this.instance.obj,
                            def = this.instance.def;
    
                        // check where this value is
                        let name = '';
                        for(let memberName in def.members) {
                            if (def.members.hasOwnProperty(memberName)) {
                                if (def.members[memberName] === 'prop') {
                                    if (obj[memberName] === value) {
                                        name = memberName; break;
                                    }
                                }
                            }
                        }
    
                        // return
                        return name;
                    },
                    getNames: function () { 
                        // get internal information { instance.{obj, def, attrs, modifiers}, type.{Type, def, attrs, modifiers}}
                        let def = this.instance.def;
    
                        let names = [];
                        for(let memberName in def.members) {
                            if (def.members.hasOwnProperty(memberName)) {
                                if (def.members[memberName] === 'prop') {
                                    names.push(memberName);
                                }
                            }
                        }
    
                        // return
                        return names;
                    },
                    getValues: function () {
                        // get internal information { instance.{obj, def, attrs, modifiers}, type.{Type, def, attrs, modifiers}}
                        let def = this.instance.def,
                            obj = this.instance.obj;
    
                        let values = [];
                        for(let memberName in def.members) {
                            if (def.members.hasOwnProperty(memberName)) {
                                if (def.members[memberName] === 'prop') {
                                    values.push(obj[memberName]);
                                }
                            }
                        }
    
                        // return
                        return values;
                    }          
                }
            }
        };
    
        // return built type
        return builder(cfg);
    };
    
    // enum static methods
    _Enum.getName = (enumType, enumValue) => {
        let args = _Args('enumType: enum, enumValue: number')(enumType, enumValue); args.throwOnError(_Enum.getName);
        return enumType[meta].getName(enumValue);
    };
    _Enum.getNames = (enumType) => {
        let args = _Args('enumType: enum')(enumType); args.throwOnError(_Enum.getNames);
        return enumType[meta].getNames();
    };
    _Enum.getValues = (enumType) => {
        let args = _Args('enumType: enum')(enumType); args.throwOnError(_Enum.getValues);    
        return enumType[meta].getValues();
    };
    _Enum.isDefined = (enumType, nameOrValue) => {
        let args = _Args('enumType: enum, nameOrValue: number',
                         'enumType: enum, nameOrValue: string')(enumType, nameOrValue); args.throwOnError(_Enum.isDefined);
        if (args.index === 1) { // i.e., nameOrValue = string
            return (enumType[meta].getNames().indexOf(nameOrValue) !== -1);
        } 
        return (enumType[meta].getName(nameOrValue) !== '');
    };
    
    // attach to flair
    a2f('Enum', _Enum);
     
    /**
     * @name Mixin
     * @description Constructs a Mixin type
     * @example
     *  Mixin(name, factory)
     * @params
     *  name: string - name of the mixin
     *                 >> simple, e.g.,
     *                    MyMixin
     *                 >> auto naming, e.g., 
     *                    '(auto)'
     *                    Use this only when putting only one mixin in a file and using flairBuild builder to build assembly
     *                    And in that case, filename will be used as mixin name. So if file name is 'MyMixin.js', name would be 'MyMixin' (case sensitive)
     *                    To give namespace to a type, use $$('ns', 'com.product.feature');
     *                    Apply this attribute on mixin definition itself. then mixin can be accessed as getType('com.product.feature.MyMixin');
     *                    To give automatic namespaces to types based on the folder structure under assembly folder, use
     *                    $$('ns', '(auto)'); In this case if MyMixin was put in a folder hierarchy as com/product/feature, it will
     *                    be given namespace com.product.feature
     *                    To put a type in root namespace, use $$('ns' '(root)') or just put it in '(root)' folder and
     *                    use $$('ns', '(auto)');
     *                    Then mixin can be accessed as getType('MyMixin');
     *  factory: function - factory function to build mixin definition
     * @returns type - constructed flair mixin type
     */
    const _Mixin = (name, factory) => {
        let args = _Args('name: string, factory: cfunction')(name, factory); args.throwOnError(_Mixin);
    
        // builder config
        let cfg = {
            func: true,
            prop: true,
            propGetterSetter: true,
            event: true,
            customAttrs: true,
            types: {
                type: 'mixin'
            },
            params: {
                typeName: args.values.name,
                factory: args.values.factory
            }
        };
    
        // return built type
        return builder(cfg);
    };
    
    // attach to flair
    a2f('Mixin', _Mixin);
    

    /**
     * @name on
     * @description Register an event handler to handle a specific event. 
     * @example
     *  on(event, handler)
     *  on(event, handler, isRemove)
     * @params
     *  event: string - Name of the even to subscribe to
     *  handler: function - event handler function
     *  isRemove: boolean - is previously associated handler to be removed
     * @returns void
     */ 
    const _dispatcher = new Dispatcher();
    const _dispatchEvent = _dispatcher.dispatch;  // this can be used via dispatch member to dispatch any event
    const _on = (event, handler, isRemove) => {
        let args = _Args('event: string, handler: afunction')(event, handler); args.throwOnError(_on);
        if (isRemove) { _dispatcher.remove(event, handler); return; }
        _dispatcher.add(event, handler);
    };
    
    // attach to flair
    a2f('on', _on, () => {
        _dispatcher.clear();
    });
     
    /**
     * @name post
     * @description Dispatch an event for any flair component to react.
     *              This together with 'on' makes a local pub/sub system which is capable to react to external
     *              events when they are posted via 'post' here and raise to external world which can be hooked to 'on'
     * @example
     *  post(event)
     *  post(event, args)
     * @params
     *  event: string - Name of the even to dispatch
     *         Note: external events are generally namespaced like pubsub.channelName
     *  args: any - any arguments to pass to event handlers
     * @returns void
     */ 
    const _post = (event, args) => {
        if (typeof event !== 'string') { throw _Exception.InvalidArgument('event', _post); }
        _dispatchEvent(event, args);
    };
    
    // attach to flair
    a2f('post', _post);
     
    /**
     * @name Container
     * @description Dependency injection container system
     * @example
     *  .isRegistered(alias)                                // - true/false
     *  .get(alias, isAll)                                  // - item / array of registered unresolved items, as is
     *  .register(alias, item)                              // - void
     *  .resolve(alias, isAll, ...args)                     // - item / array of resolved items
     * @params
     *  alias: string - name of alias for an item
     *  item: type/object/string - either a flair type, any object or a qualified type name or a file name
     *        when giving string, it can be of format 'x | y' for different resolution on server and client
     *  args: arguments to pass to type constructor when created instances for items
     *  isAll: boolean - if resolve with all registered items against given alias or only first
     */ 
    let container_registry = {};
    const _Container = {
        // if an alias is registered
        isRegistered: (alias) => {
            if (typeof alias !== 'string') { throw _Exception.InvalidArgument('alias', _Container.isRegistered); }
            return (typeof container_registry[alias] !== 'undefined' && container_registry[alias].length > 0);
        },
    
        // get registered items as is for given alias
        get: (alias, isAll) => {
            if (typeof alias !== 'string') { throw _Exception.InvalidArgument('alias', _Container.get); }
    
            if (isAll) {
                return (container_registry[alias] ? container_registry[alias].slice() : []);
            } else {
                return (container_registry[alias] ? container_registry[alias][0] : null);
            }
        },
    
        // register given alias
        register: (alias, item) => {
            if (typeof alias !== 'string') { throw _Exception.InvalidArgument('alias', _Container.register); }
            if (!item) { throw _Exception.InvalidArgument('item', _Container.register); }
            if (alias.indexOf('.') !== -1) { throw _Exception.InvalidArgument('alias', _Container.register); }
    
            if (typeof item === 'string') { 
                item = which(item); // register only relevant item for server/client
                if (item.endsWith('.js') || item.endsWith('.mjs')) { 
                    item = which(item, true); // consider prod/dev scenario as well
                }
            }
            // register (first time or push more with same alias)
            if (!container_registry[alias]) { container_registry[alias] = []; }
            container_registry[alias].push(item);
        },
    
        // resolve alias with registered item(s)
        resolve: (alias, isAll, ...args) => {
            if (typeof alias !== 'string') { throw _Exception.InvalidArgument('alias', _Container.resolve); }
            if (typeof isAll !== 'boolean') { throw _Exception.InvalidArgument('isAll', _Container.resolve); }
        
            let result = null;
            const getResolvedObject = (Type) => {
                // TODO: resolve one alias only once for isAll and once for first item (if isAll was done, pick first from there)
                // and rest all times load from local resolved cache
    
                let obj = Type; // whatever it was
                if (typeof Type === 'string') {
                    if (Type.endsWith('.js') || Type.endsWith('.mjs')) { 
                        // file, leave it as is
                    } else { // try to resolve it from a loaded type
                        let _Type = _getType(Type);
                        if (_Type) { Type = _Type; }
                    }
                }
                if (['class', 'struct'].indexOf(_typeOf(Type)) !== -1) { // only class and struct need a new instance
                    try {
                        if (args) {
                            obj = new Type(...args); 
                        } else {
                            obj = new Type(); 
                        }
                    } catch (err) {
                        throw _Exception.OperationFailed(`Type could not be instantiated. (${Type[meta].name})`, _Container.resolve);
                    }
                }
                // any other type of object will be passed through as is
    
                // return
                return obj;
            };
    
            if (container_registry[alias] && container_registry[alias].length > 0) {
                if (isAll) {
                    result = [];
                    container_registry[alias].forEach(Type => { result.push(getResolvedObject(Type)); });
                } else {
                    result = getResolvedObject(container_registry[alias][0]); // pick first
                }
            }
    
            // return
            return result;
        }
    };
    
    // attach to flair
    a2f('Container', _Container, () => {
        container_registry = {};
    });  
    /**
     * @name telemetry
     * @description Telemetry enable/disable/filter/collect
     * @example
     *  .on()
     *  .on(...types)
     *  .on(handler, ...types)
     *  .collect()
     *  .off()
     *  .off(handler)
     *  .isOn()
     *  .types
     * @params
     *  types: string - as many types, as needed, when given, telemetry for given types only will be released
     *  handler: function - an event handler for telemetry event
     *                      Note: This can also be done using flair.on('telemetry', handler) call.
     */ 
    let telemetry = _noop,
        telemetry_buffer = [],
        telemetry_max_items = 500;
    const _telemetry = {
        // turn-on telemetry recording
        on: (handler, ...types) => {
            if (telemetry === _noop) {
                if (typeof handler === 'string') { types.unshift(handler); }
                else if (typeof handler === 'function') { _on('telemetry', handler); }
    
                // redefine telemetry
                telemetry = (type, data) => {
                    if (types.length === 0 || types.indexOf(type) !== -1) { // filter
                        // pack
                        let item = Object.freeze({type: type, data: data});
    
                        // buffer
                        telemetry_buffer.push(item);
                        if (telemetry_buffer.length > (telemetry_max_items - 25)) {
                            telemetry_buffer.splice(0, 25); // delete 25 items from top, so it is always running buffer of last 500 entries
                        }
    
                        // emit
                        _post('telemetry', item);
                    }
                };
            }
        },
    
        // collect buffered telemetry and clear buffer
        collect: () => {
            if (telemetry !== _noop) {
                let buffer = telemetry_buffer.slice();
                telemetry_buffer.length = 0; // initialize
                return buffer;
            }
            return [];
        },
    
        // turn-off telemetry recording
        off: (handler) => {
            if (telemetry !== _noop) {
                if (typeof handler === 'function') { _on('telemetry', handler, true); }
    
                // redefine telemetry
                telemetry = _noop;
    
                // return
                return _telemetry.collect();
            }
            return [];
        },
    
        // telemetry recording status check
        isOn: () => { return telemetry !== _noop; },
    
        // telemetry types list
        types: Object.freeze({
            RAW: 'raw',         // type and instances creation telemetry
            EXEC: 'exec',       // member access execution telemetry
            INFO: 'info',       // info, warning and exception telemetry
            INCL: 'incl'        // external component inclusion, fetch, load related telemetry
        })
    };
    
    // attach to flair
    a2f('telemetry', _telemetry, () => {
        telemetry_buffer.length = 0;
    });
        
    /**
     * @name Aspects
     * @description Aspect orientation support.
     * @example
     *  .register(pointcut, Aspect)             // - void
     * @params
     *  pointcut: string - pointcut identifier string as -> [namespace.]class[:func]
     *      namespace/class/func: use wildcard characters ? or * to build the pointcut identifier
     *     
     *      Examples:
     *          abc                 - on all functions of all classes named abc in root namespace (without any namespace)
     *          *.abc               - on all functions of all classes named abc in all namespaces
     *          xyz.*               - on all functions of all classes in xyz namespace
     *          xyz.abc             - on all functions of class abc under xyz namespace
     *          xyz.abc:*           - on all functions of class abc under xyz namespace
     *          xyz.abc:f1          - on func f1 of class abc under xyz namespace
     *          xyz.abc:f?test      - on all funcs that are named like f1test, f2test, f3test, etc. in class abc under xyz namespace
     *          xyz.xx*.abc         - on functions of all classes names abc under namespaces where pattern matches xyz.xx* (e.g., xyz.xx1 and xyz.xx2)
     *          *xyx.xx*.abc        - on functions of all classes names abc under namespaces where pattern matches *xyz.xx* (e.g., 1xyz.xx1 and 2xyz.xx1)
     *     
     * aspect: type - flair Aspect type
     */ 
    const allAspects = [];
    const _Aspects = {
        // register Aspect against given pointcut definition
        register: (pointcut, aspect) => {
            let args = _Args('pointcut: string, aspect: Aspect')(pointcut, aspect); args.throwOnError(_Aspects.register);
            
            // add new entry
            let pc = pointcut,
                __ns = '',
                __class = '',
                __func = '',
                __identifier = '',
                items = null;
    
            if (pc.indexOf(':') !== -1) { // extract func
                items = pc.split(':');
                pc = items[0].trim();
                __func = items[1].trim() || '*';
            }
    
            if (pc.indexOf('.') !== -1) { // extract class and namespace
                __ns = pc.substr(0, pc.lastIndexOf('.'));
                __class = pc.substr(pc.lastIndexOf('.') + 1);
            } else {
                __ns = ''; // no namespace
                __class = pc;
            }    
    
            // build regex
            __identifier = __ns + '\/' +__class + ':' + __func; // eslint-disable-line no-useless-escape
            __identifier = replaceAll(__identifier, '.', '[.]');    // . -> [.]
            __identifier = replaceAll(__identifier, '?', '.');      // ? -> .
            __identifier = replaceAll(__identifier, '*', '.*');     // * -> .*
    
            // register
            allAspects.push({rex: new RegExp(__identifier), Aspect: aspect});
        }
    };
    const _get_Aspects = (typeName, funcName, staticAspects) => {
        // NOTE: intentionally not checking type, because it is an internal call and this needs to run as fast as possible
        // get parts
        let funcAspects = [],
            __ns = '',
            __class = '',
            __func = funcName.trim(),
            __identifier = ''
    
        if (typeName.indexOf('.') !== -1) {
            __ns = typeName.substr(0, typeName.lastIndexOf('.')).trim();
            __class = typeName.substr(typeName.lastIndexOf('.') + 1).trim(); 
        } else {
            __ns = ''; // no namespace
            __class = typeName.trim();
        }
        __identifier = __ns + '/' + __class + ':' + __func;
    
        // add staticAspects first, if defined
        if (staticAspects) { funcAspects.push(...staticAspects); }
    
        allAspects.forEach(item => {
            if (item.rex.test(__identifier)) { 
                if (findIndexByProp(funcAspects, 'name', item.Aspect[meta].name) === -1) {
                    funcAspects.push({ name: item.Aspect[meta].name, Aspect: item.Aspect });
                }
            }
        });
    
        // return
        return funcAspects;
    };
    const _attach_Aspects = (fn, typeName, funcName, funcAspects) => {
        // NOTE: no type checking, as this is an internal call
        let before = [],
            after = [],
            around = [],
            instance = null;
    
        // collect all advices
        for(let item of funcAspects) {
            instance = new item.Aspect();
            if (instance.before !== _noop) { before.push(instance.before); }
            if (instance.around !== _noop) { around.push(instance.around); }
            if (instance.after !== _noop) { after.push(instance.after); }
        }
    
        // around weaving
        if (around.length > 0) { around.reverse(); }
    
        // weaved function
        let weavedFn = function(...args) {
            let error = null,
                result = null,
                ctx = {
                    typeName: () => { return typeName; },
                    funcName: () => { return funcName; },
                    error: (err) => { if (err) { error = err; } return error;  },
                    result: (value) => { if (typeof value !== 'undefined') { result = value; } return result; },
                    args: () => { return args; },
                    data: {}
                };
            
            // run before functions
            for(let beforeFn of before) {
                try {
                    beforeFn(ctx);
                } catch (err) {
                    error = err;
                }
            }
    
            // after functions executor
            const runAfterFn = (_ctx) =>{
                for(let afterFn of after) {
                    try {
                        afterFn(_ctx);
                    } catch (err) {
                        ctx.error(err);
                    }
                }
            };
    
            // run around func
            let newFn = fn,
                _result = null;
            for(let aroundFn of around) { // build a nested function call having each wrapper calling an inner function wrapped inside advices' functionality
                newFn = aroundFn(ctx, newFn);
            }                    
            try {
                _result = newFn(...args);
                if (_result && typeof _result.then === 'function') { // async function
                    ctx.result(new Promise((__resolve, __reject) => {
                        _result.then((value) => {
                            ctx.result(value);
                            runAfterFn(ctx);
                            __resolve(ctx.result());
                        }).catch((err) => {
                            ctx.error(err);
                            runAfterFn(ctx);
                            __reject(ctx.error());
                        });
                    }));
                } else {
                    ctx.result(_result);
                    runAfterFn(ctx);
                }
            } catch (err) {
                ctx.error(err);
            }
    
            // return
            return ctx.result();
        };
    
        // done
        return weavedFn;
    };
    
    // attach to flair
    a2f('Aspects', _Aspects, () => {
        allAspects.length = 0;
    });
       
    /**
     * @name Serializer
     * @description Serializer/Deserialize object instances
     * @example
     *  .serialiaze(instance)
     *  .deserialize(json)
     * @params
     *  instance: object - supported flair type's object instance to serialize
     *  json: object - previously serialized object by the same process
     * @returns
     *  string: json string when serialized
     *  object: flair object instance, when deserialized
     */ 
    const serializer_process = (source, isDeserialize) => {
        let result = null,
            memberNames = null,
            src = (isDeserialize ? JSON.parse(source) : source),
            Type = (isDeserialize ? null : source[meta].Type),
            TypeMeta = Type[meta];
        const getMemberNames = (obj, isSelectAll) => {
            let objMeta = obj[meta],
                attrRefl = objMeta.attrs,
                modiRefl = objMeta.modifiers,
                props = [],
                isOK = false;
            for(let memberName in obj) {
                if (obj.hasOwnProperty(memberName) && memberName !== meta) {
                    isOK = modiRefl.members.isProperty(memberName);
                    if (isOK) {
                        if (isSelectAll) {
                            isOK = !attrRefl.members.probe('noserialize', memberName).anywhere(); // not marked as noserialize when type itself is marked as serialize
                        } else {
                            isOK = attrRefl.members.probe('serialize', memberName).anywhere(); // marked as serialize when type is not marked as serialize
                        }
                        if (isOK) {
                            isOK = (!modiRefl.members.is('private', memberName) &&
                                    !modiRefl.members.is('protected', memberName) &&
                                    !modiRefl.members.is('static', memberName) &&
                                    !modiRefl.members.is('readonly', memberName) &&
                                    !attrRefl.members.probe('resource', memberName).anywhere() && 
                                    !attrRefl.members.probe('asset', memberName).anywhere() && 
                                    !attrRefl.members.probe('inject', memberName).anywhere());
                        }
                    }
                    if (isOK) { props.push(memberName); }
                }
            }
            return props;
        }; 
    
        if (isDeserialize) {
            // validate 
            if (!src.type && !src.data) { throw _Exception.InvalidArgument('json'); }
    
            // get base instance to load property values
            Type = _getType(src.type);
            if (!Type) { throw _Exception.NotFound(src.type, _Serializer.deserialize); }
            try {
                result = new Type(); // that's why serializable objects must be able to create themselves without arguments 
            } catch (err) {
                throw _Exception.OperationFailed(`Object could not be deserialized. (${src.type})`, err, _Serializer.deserialize); 
            }
            
            // get members to deserialize
            if (TypeMeta.attrs.type.probe('serialize').anywhere()) {
                memberNames = getMemberNames(result, true);
            } else {
                memberNames = getMemberNames(result, false);
            }
            
            // deserialize
            for(let memberName of memberNames) { result[memberName] = src.data[memberName]; }
        } else {
            // get members to serialize
            if (TypeMeta.attrs.type.probe('serialize').anywhere()) {
                memberNames = getMemberNames(src, true);
            } else {
                memberNames = getMemberNames(src, false);
            }
    
            // serialize
            result = {
                type: src[meta].Type[meta].name,
                data: {}
            };
            for(let memberName of memberNames) { result.data[memberName] = src[memberName]; }
            try {
                result = JSON.stringify(result);
            } catch (err) {
                throw _Exception.OperationFailed(`Object could not be serialized. (${src[meta].Type[meta].name})`, err, _Serializer.serialize); 
            }
        }
    
        // return
        return result;
    };
    const _Serializer = {
        // serialize given supported flair type's instance
        serialize: (instance) => { 
            if (flairInstances.indexOf(_typeOf(instance) === -1)) { throw _Exception.InvalidArgument('instance', _Serializer.serialize); }
            return serializer_process(instance);
        },
    
        // deserialize last serialized instance
        deserialize: (json) => {
            if (!json || typeof json !== 'string') { throw _Exception.InvalidArgument('json', _Serializer.deserialize); }
            return serializer_process(json, true);
        }
    };
    
    // attach to flair
    a2f('Serializer', _Serializer);
     
    /**
     * @name Tasks
     * @description Task execution
     * @example
     *  new Tasks.TaskInfo(qualifiedName, ...args)
     *  Tasks.invoke(task, progressListener)
     *  Tasks.getHandle(task, progressListener) -> handle
     *      handle.run(...args) // (can be executed many times)
     *      handle.close() // finally close
     *  Tasks.parallel.invoke.any(...tasks)
     *  Tasks.parallel.invoke.all(...tasks)
     *  Tasks.parallel.invoke.each(onSuccess, onError, ...tasks)
     *  Tasks.sequence.invoke(...tasks)
     * @params
     *  qualifiedName: string - qualified type name whose reference is needed
     * @returns object - if assembly which contains this type is loaded, it will return flair type object OR will return null
     */
    const max_pool_size = (options.env.cores * 4);
    const min_pool_size = Math.round(max_pool_size/4);
    const ADPool = [];
    const resetADPool = () => { // called by shared channel, whenever some AD goes idle
        if (ADPool.length <= min_pool_size) { return; } // not needed
        
        // take one pass to unload all domains which are not busy
        let allADs = ADPool.slice(0);
        let processNext = () => {
            if (allADs.length !== 0) { // unload idle sitting ad
                let ad = allADs.shift();
                if (!ad.context.isBusy()) { 
                    ad.context.hasActiveInstances().then((count) => {
                        if (count === 0) { // idle ad
                            ad.unload(); // unload
                            ADPool.shift(); // remove from top from main pool
                            if (ADPool.length > min_pool_size) { // do more, if need be
                                processNext();
                            }
                        } else {
                            processNext();
                        }
                    }).catch(() => {
                        // ignore error
                        processNext();
                    });
                } else {
                    processNext();
                }
            } 
        };
        processNext();
    
    };
    const getFreeAD = () => {
        return new Promise((resolve, reject) => {
            // get a free AD from pool
            // a free AD is whose default context does not have any open messages and instances count is zero
            let allADs = ADPool.slice(0);
            let processNext = () => {
                if (allADs.length !== 0) { // find a free sitting ad
                    let ad = allADs.shift();
                    if (!ad.context.isBusy()) { 
                        ad.context.hasActiveInstances().then((count) => {
                            if (count === 0) {
                                resolve(ad);
                            } else {
                                processNext();
                            }
                        }).catch(reject);
                    } else {
                        processNext();
                    }
                } else {
                    if (ADPool.length < max_pool_size) { // create new ad
                        _AppDomain.createDomain(guid()).then((ad) => { // with a random name
                            resolve(ad);
                        }).catch(reject);
                    } else { 
                        reject(_Exception.OperationFailed('AppDomain pool limit reached.'));
                    }
                }
            };
            processNext();
        });
    };
    
    const _Tasks = { 
        TaskInfo: function(qualifiedName, ...args) {
            if (typeof qualifiedName !== 'string') { throw _Exception.InvalidArgument('qualifiedName', _Tasks.TaskInfo); }
            return Object.freeze({
                type: qualifiedName,
                typeArgs: args
            });
        },
    
        getHandle: (task, progressListener) => {
            return new Promise((resolve, reject) => {
                getFreeAD().then((ad) => {
                    let taskHandle = {
                        run: (...args) => {
                            return new Promise((_resolve, _reject) => {
                                ad.context.execute({
                                    type: task.type,
                                    typeArgs: task.typeArgs,
                                    func: 'run',
                                    args: args,
                                    keepAlive: true
                                }, progressListener).then(_resolve).catch(_reject); 
                            });
                        },
                        close: () => {
                            return new Promise((_resolve, _reject) => {
                                ad.context.execute({
                                    type: task.type,
                                    typeArgs: task.typeArgs,
                                    func: '',   // keeping it empty together with keepAlive = false, removes the internal instance
                                    args: [],
                                    keepAlive: false
                                }, progressListener).then(_resolve).catch(_reject).finally(resetADPool); 
                            });
                        }
                    };
                    resolve(taskHandle);
                }).catch(reject);
            });
        },
    
        invoke: (task, progressListener) => {
            return new Promise((resolve, reject) => {
                getFreeAD().then((ad) => {
                    ad.context.execute({
                        type: task.type,
                        typeArgs: task.typeArgs,
                        func: 'run',
                        args: [],
                        keepAlive: false
                    }, progressListener).then(resolve).catch(reject).finally(resetADPool)
                }).catch(reject);
            });
        },
    
        parallel: Object.freeze({
            invokeMany: (...tasks) => {
                let promises = [];
                for(let task of tasks) {
                    promises.push(_Tasks.invoke(task));
                }
                return promises;
            },   
            invoke: Object.freeze({
                any: (...tasks) => { return Promise.race(_Tasks.parallel.invokeMany(...tasks)); },
                all: (...tasks) => { return Promise.all(_Tasks.parallel.invokeMany(...tasks)); },
                each: (onSuccess, onError, ...tasks) => {
                    return new Promise((resolve, reject) => { // eslint-disable-line no-unused-vars
                        let promises = _Tasks.parallel.invokeMany(...tasks),
                            done = 0;
                        for(let p of promises) {
                            p.then(onSuccess).catch(onError).finally(() => {
                                done++;
                                if (promises.length === done) {
                                    resolve();
                                }
                            })
                        }
                    });
                }
            })
        }),
    
        sequence: Object.freeze({
            invoke: (...tasks) => {
                return new Promise((resolve, reject) => {
                    let allTasks = tasks.slice(0),
                        results = [];
                    let processNext = () => {
                        if (allTasks.length === 0) { resolve(...results); return; }
                        let task = allTasks.shift();
                        _Tasks.invoke(task).then((result) => {
                            results.push(result);
                            processNext();
                        }).catch(reject);
                    };
                    if (allTasks.length > 0) { 
                        processNext(); 
                    } else {
                        resolve(...results);
                    }
                });
            }
        })
    };
    
    // attach to flair
    a2f('Tasks', _Tasks, () => {
        // unload pooled ADs
        ADPool.forEach((ad) => {
            ad.unload();
        });
    
        // clear pool
        ADPool.length = 0;
    });
     
    // define all ports with their inbuilt implementations as applicable
    
    // sessionStorage factory
    const __sessionStorage = (env) => {
        if (env.isServer) {
            if (!global.sessionStorage) { 
                // the way, on browser sessionStorage is different for each tab, 
                // here 'sessionStorage' property on global is different for each node instance in a cluster
                const nodeSessionStorage = function() {
                    let keys = {};
                    this.key = (key) => { 
                        if (!key) { throw _Exception.InvalidArgument('key', this.key); }
                        return (keys.key ? true : false); 
                    };
                    this.getItem = (key) => { 
                        if (!key) { throw _Exception.InvalidArgument('key', this.getItem); }
                        return keys.key || null;
                    };
                    this.setItem = (key, value) => {
                        if (!key) { throw _Exception.InvalidArgument('key', this.setItem); }
                        if (typeof value === 'undefined') { throw _Exception.InvalidArgument('value', this.setItem); }
                        keys[key] = value;
                    };
                    this.removeItem = (key) => { 
                        if (!key) { throw _Exception.InvalidArgument('key', this.removeItem); }
                        delete keys[key];
                    };
                    this.clear = () => { 
                        keys = {};
                    };                        
                };
                global.sessionStorage = new nodeSessionStorage();
            }
            return global.sessionStorage;
        } else { // client
            return window.sessionStorage;
        }
    };
    _Port.define('sessionStorage', ['key', 'getItem', 'setItem', 'removeItem', 'clear'], __sessionStorage);
    
    // localStorage factory
    const __localStorage = (env) => {
        if (env.isServer) {
            return __sessionStorage(env);
        } else { // client
            return window.localStorage;
        }
    };
    _Port.define('localStorage', ['key', 'getItem', 'setItem', 'removeItem', 'clear'], __localStorage);
    
    // serverModule factory
    const __serverModule = (env) => { // eslint-disable-line no-unused-vars
        let funcs = {
            require: (module) => {
                return new Promise((resolve, reject) => {
                    if (typeof module !== 'string') { reject(_Exception.InvalidArgument('module')); return; }
    
                    // both worker and normal scenarios, same loading technique
                    try {
                        resolve(require(module));
                    } catch (err) {
                        reject(new _Exception(err));
                    }
                });
            },
            undef: (module) => {
                if (typeof module !== 'string') { throw _Exception.InvalidArgument('module', funcs.undef); }
                try {
                    delete require.cache[require.resolve(module)]
                } catch (err) {
                    throw new _Exception(err, funcs.undef);
                }
            }
        };
        return funcs;
    };
    _Port.define('serverModule', ['require', 'undef'], __serverModule);
    
    // clientModule factory
    const __clientModule = (env) => {
        let funcs = {
            require: (module) => {
                return new Promise((resolve, reject) => {
                    if (typeof module !== 'string') { reject(_Exception.InvalidArgument('module')); return; }
    
                    let ext = module.substr(module.lastIndexOf('.') + 1).toLowerCase();
                    try {
                        if (typeof require !== 'undefined') { // if requirejs is available
                            try {
                                require([module], resolve, reject);
                            } catch (err) {
                                reject(new _Exception(err));
                            }
                        } else { // load it as file on browser or in web worker
                            if (env.isWorker) {
                                try {
                                    importScripts(module); // sync call
                                    resolve(); // TODO: Check how we can pass the loaded 'exported' object of module to this resolve.
                                } catch (err) {
                                    reject(new _Exception(err));
                                }
                            } else { // browser
                                let js = window.document.createElement('script');
                                if (ext === 'mjs') {
                                    js.type = 'module';
                                } else {
                                    js.type = 'text/javascript';
                                }
                                js.name = module;
                                js.src = module;
                                js.onload = () => { 
                                    resolve(); // TODO: Check how we can pass the loaded 'exported' object of module to this resolve.
                                };
                                js.onerror = (err) => {
                                    reject(new _Exception(err));
                                };
                                window.document.head.appendChild(js);
                            }
                        }
                    } catch(err) {
                        reject(new _Exception(err));
                    }
                });
            },
            undef: (module) => {
                if (typeof module !== 'string') { throw _Exception.InvalidArgument('module', funcs.undef); }
                let _requireJs = null;
                if (isWorker) {
                    _requireJs = WorkerGlobalScope.requirejs || null;
                } else {
                    _requireJs = window.requirejs || null;
                }
                if (_requireJs) { // if requirejs library is available
                    _requireJs.undef(module);
                } else {
                    // console.warn("No approach is available to undef a loaded module. Connect clientModule port to an external handler."); // eslint-disable-line no-console
                }
            }
        };
        return funcs;
    };
    _Port.define('clientModule', ['require', 'undef'], __clientModule);
    
    // serverFile factory
    const __serverFile = (env) => { // eslint-disable-line no-unused-vars
        return (file) => {
            return new Promise((resolve, reject) => {
                if (typeof file !== 'string') { reject(_Exception.InvalidArgument('file')); return; }
    
                let ext = file.substr(file.lastIndexOf('.') + 1).toLowerCase();
                try {
                    let httpOrhttps = null,
                        body = '';
                    if (file.startsWith('https')) {
                        httpOrhttps = require('https');
                    } else {
                        httpOrhttps = require('http'); // for urls where it is not defined
                    }
                    httpOrhttps.get(file, (resp) => {
                        resp.on('data', (chunk) => { body += chunk; });
                        resp.on('end', () => { 
                            let contentType = resp.headers['content-type'];
                            if (ext === 'json' || /^application\/json/.test(contentType)) { // special case of JSON
                                try {
                                    let data = JSON.parse(body);
                                    resolve(data);
                                } catch (err) {
                                    reject(new _Exception(err));
                                }
                            } else { // everything else is a text
                                resolve(body);
                            }
                        });
                    }).on('error', (err) => {
                        reject(new _Exception(err));
                    });
                } catch(err) {
                    reject(new _Exception(err));
                }
            });
        };
    };
    _Port.define('serverFile', __serverFile);
    
    // clientFile factory
    const __clientFile = (env) => { // eslint-disable-line no-unused-vars
        return (file) => {
            return new Promise((resolve, reject) => {
                if (typeof file !== 'string') { reject(_Exception.InvalidArgument('file')); return; }
    
                let ext = file.substr(file.lastIndexOf('.') + 1).toLowerCase();
                fetch(file).then((response) => {
                    if (!response.ok) {
                        reject(_Exception.OperationFailed(file, response.status));
                    } else {
                        let contentType = response.headers['content-type'];
                        if (ext === 'json' || /^application\/json/.test(contentType)) { // special case of JSON
                            response.json().then(resolve).catch((err) => {
                                reject(new _Exception(err));
                            });
                        } else { // everything else is a text
                            response.text().then(resolve).catch((err) => {
                                reject(new _Exception(err));
                            });
                        }
                    }
                }).catch((err) => {
                    reject(new _Exception(err));
                });
            });
        };
    };
    _Port.define('clientFile', __clientFile);
    
    // settingsReader factory
    const __settingsReader = (env) => {
        return (asmName) => {
            /** 
             * NOTE: appConfig.json (on server) and webConfig.json (on client)
             * is the standard config file which can contain settings for every
             * assembly for various settings. Only defined settings will be overwritten 
             * over inbuilt settings of that assembly's setting.json
             * there can be two versions of settings for each assembly:
             * 1. when assembly is loaded in main thread
             * 2. when assembly is loaded on worker thread
             * these can be defined as:
             * {
             *      "assemblyName": { <-- this is used when assembly is loaded in main thread
             *          "settingName1": "settingValue",
             *          "settingName2": "settingValue"
             *      }
             *      "worker:assemblyName": { <-- this is used when assembly is loaded in worker thread
             *          "settingName1": "settingValue",
             *          "settingName2": "settingValue"
             *      }
             * }
             * Note: The whole settings of the assembly are merged in following order as:
             * A. When assembly is being loaded in main thread:
             *      settings.json <-- appConfig/webConfig.assemblyName section
             * B. When assembly is being loaded in worker thread:
             *      settings.json <-- appConfig/webConfig:assemblyName section <-- appConfig/webConfig:worker:assemblyName section
             * 
             * This means, when being loaded on worker, only differentials should be defined for worker environment
             * which can be worker specific settings
             * 
             * NOTE: under every "assemblyName", all settings underneath are deep-merged, except arrays
             *       arrays are always overwritten
            */
    
            // return relevant settings
            let settings = {},
                configFileJSON = _AppDomain.config();
            if (configFileJSON && configFileJSON[asmName]) { // pick non-worker settings
                settings = deepMerge([settings, configFileJSON[asmName]], false);
            }
            if (env.isWorker && configFileJSON && configFileJSON[`worker:${asmName}`]) { // overwrite with worker section if defined
                settings = deepMerge([settings, configFileJSON[`worker:${asmName}`]], false);
            }
            return settings;
        };
    };
    _Port.define('settingsReader', __settingsReader);
    
    // fetch core logic
    const fetcher = (fetchFunc, url, resDataType, reqData) => {
        return new Promise((resolve, reject) => {
            if (typeof url !== 'string') { reject(_Exception.InvalidArgument('url')); return; }
            if (typeof resDataType !== 'string' || ['text', 'json', 'buffer', 'form', 'blob'].indexOf(resDataType) === -1) { reject(_Exception.InvalidArgument('resDataType')); return; }
            if (!reqData) { reject(_Exception.InvalidArgument('reqData')); return; }
    
            fetchFunc(url, reqData).then((response) => {
                if (!response.ok) {
                    reject(_Exception.OperationFailed(url, response.status));
                } else {
                    let resMethod = '';
                    switch(resDataType) {
                        case 'text': resMethod = 'text'; break;
                        case 'json': resMethod = 'json'; break;
                        case 'buffer': resMethod = 'arrayBuffer'; break;
                        case 'form': resMethod = 'formData'; break;
                        case 'blob': resMethod = 'blob'; break;
                    }
                    response[resMethod]().then(resolve).catch((err) => {
                        reject(new _Exception(err));
                    });
                }
            }).catch((err) => {
                reject(new _Exception(err));
            });
        });
    };
    // serverFetch factory
    const __serverFetch = (env) => { // eslint-disable-line no-unused-vars
        return (url, resDataType, reqData) => {
            return fetcher(require('node-fetch'), url, resDataType, reqData);
        };
    };
    _Port.define('serverFetch', __serverFetch);
    // clientFetch factory
    const __clientFetch = (env) => { // eslint-disable-line no-unused-vars
        return (url, resDataType, reqData) => {
            return fetcher(fetch, url, resDataType, reqData);
        };
    };
    _Port.define('clientFetch', __clientFetch);
     
    /**
     * @name Reflector
     * @description Reflection of flair type.
     * @example
     *  Reflector(Type)
     * @params
     *  Type: object - flair type to reflect on
     */
    let isNewFromReflector = false;
    const underReflection = [];
    const _Reflector = function (Type) {
        if (!Type || !(Type[meta] || flairTypes.indexOf(Type[meta].type) === -1)) { throw _Exception.InvalidArgument('Type', _Reflector); }
    
        // define
        let TypeMeta = null,
            objMeta = null,
            target = null,
            obj = null,
            objDef = null,
            typeDef = null,
            objMembers = null; // { memberName: memberReflector }
        const ModifierReflector = function(item) {
            this.getType = () => { return 'modifier'; }
            this.getName = () => { return item.name; }
            this.getArgs = () => { return item.args.slice(); }
            this.getConstraints = () => { return item.cfg.constraints; }
        };
        const AttrReflector = function(item) {
            this.getType = () => { return 'attribute'; }
            this.getName = () => { return item.name; }
            this.getArgs = () => { return item.args.slice(); }
            this.getConstraints = () => { return item.cfg.constraints; }
            this.isCustom = () => { return item.isCustom; }
        };        
        const CommonTypeReflector = function() {
            this.getTarget = () => { return target; };
            this.getTargetType = () => { return TypeMeta.type; }
            this.getName = () => { return TypeMeta.name || ''; };
            this.getType = () => { return TypeMeta.type; };
            this.getId = () => { return TypeMeta.id; };
            this.getNamespace = () => { return TypeMeta.namespace; };
            this.getAssembly = () => { return TypeMeta.assembly(); };
            this.getContext = () => { return TypeMeta.context; };
            this.isClass = () => { return TypeMeta.type === 'class'; };
            this.isEnum = () => { return TypeMeta.type === 'enum'; };
            this.isStruct = () => { return TypeMeta.type === 'struct'; };
            this.isMixin = () => { return TypeMeta.type === 'mixin'; };
            this.isInterface = () => { return TypeMeta.type === 'interface'; };
            this.isDeprecated = () => { return TypeMeta.isDeprecated(); };
            this.getModifiers = () => { 
                let list = [];
                for(let item of typeDef.modifiers.type) {
                    list.push(ModifierReflector(item));
                }
                return list; 
            };
            this.getAttributes = () => { 
                let list = [];
                for(let item of typeDef.attrs.type) {
                    list.push(AttrReflector(item));
                }
                return list; 
            };
            this.getAttribute = (name) => { 
                if (typeof name !== 'string') { throw _Exception.InvalidArgument('name', this.getAttribute); }
                let attribute = findItemByProp(typeDef.attrs.type, 'name', name);
                if (attribute) { return AttrReflector(attribute); }
                return null;
            };
            this.getModifier = (name) => { 
                if (typeof name !== 'string') { throw _Exception.InvalidArgument('name', this.getModifier); }
                let modifier = findItemByProp(typeDef.modifiers.type, 'name', name); 
                if (modifier) { return ModifierReflector(modifier); }
                return null;
            };
        };
        const addMixinsRefl = function(refl) {
            refl.getMixins = () => {
                let items = [];
                if (TypeMeta.mixins) {
                    for(let _mixin of TypeMeta.mixins) {
                        items.push(_Reflector(_mixin));
                    }
                }
                return items;
            };
            refl.isMixed = (name) => { 
                if (!name) { throw _Exception.InvalidArgument('name', refl.isMixed); }
                return TypeMeta.isMixed ? TypeMeta.isMixed(name) : false; 
            };
        };
        const addIntfRefl = function(refl) {
            refl.getInterfaces = () => {
                let items = [];
                if (TypeMeta.interfaces) {
                    for(let _interface of TypeMeta.interfaces) {
                        items.push(_Reflector(_interface));
                    }
                }            
                return items;
            };
            refl.isImplements = (name) => {
                if (!name) { throw _Exception.InvalidArgument('name', refl.isImplements); }
                return TypeMeta.isImplements ? TypeMeta.isImplements(name) : false; 
            }
        };
        const addInstanceRefl = function(refl) {
            refl.getInstanceType = () => { return objMeta.type; };
            refl.isInstanceOf = (name) => { 
                if (!name) { throw _Exception.InvalidArgument('name', refl.isInstanceOf); }
                return objMeta.isInstanceOf ? objMeta.isInstanceOf(name) : false; 
            }
        };
        const findMemberDef = (memberName) => {
            let def = objMeta.def; // start from this top one
            while(true) { // eslint-disable-line no-constant-condition
                if (def === null) { break; }
                if (def.members[memberName]) { break; }
                def = def.previous();
            }
            return def;
        };
        const buildMembersList = () => {
            let def = null,
                memberRefl = null;
            objMembers = {};
            for (let memberName in objMeta.obj) { // this obj is internal version which has all private, protected and public members of this object
                def = findMemberDef(memberName);
                switch(def.members[memberName]) {
                    case 'prop': memberRefl = new PropReflector(memberName, def); break;
                    case 'func': memberRefl = new FuncReflector(memberName, def); break;
                    case 'event': memberRefl = new EventReflector(memberName, def); break;
                    case 'construct': memberRefl = new FuncReflector(memberName, def); break;
                    case 'dispose': memberRefl = new FuncReflector(memberName, def); break;
                }
                objMembers[memberName] = memberRefl;
            }
        };
        const ensureMembers = () => {
            if (!objMembers) { buildMembersList(); } // lazy loading
        };
        const CommonMemberReflector = function(memberName, def) {
            this.getType = () => { return 'member'; }
            this.getMemberType = () => { return def.members[memberName]; }
            this.getName = () => { return memberName; }
            this.getModifiers = () => { 
                let list = [];
                for(let item of objDef.modifiers[memberName]) {
                    list.push(ModifierReflector(item));
                }
                return list; 
            };
            this.getAttributes = () => { 
                let list = [];
                for(let item of objDef.attrs[memberName]) {
                    list.push(AttrReflector(item));
                }
                return list; 
            };
            this.getAttribute = (name) => { 
                if (typeof name !== 'string') { throw _Exception.InvalidArgument('name', this.getAttribute); }
                let attribute = findItemByProp(objDef.attrs[memberName], 'name', name); 
                if (attribute) { return AttrReflector(attribute); }
                return null;
            };
            this.getModifier = (name) => { 
                if (typeof name !== 'string') { throw _Exception.InvalidArgument('name', this.getModifier); }
                let modifier = findItemByProp(objDef.modifiers[memberName], 'name', name); 
                if (modifier) { return ModifierReflector(modifier); }
                return null;
            };
            this.isPrivate = () => { return findItemByProp(objDef.modifiers[memberName], 'name', 'private') !== null; };
            this.isProtected = () => { return findItemByProp(objDef.modifiers[memberName], 'name', 'protected') !== null; };
            this.isPublic = () => { return (!this.isPrivate() && !this.isProtected()); };
            this.isStatic = () => { return findItemByProp(objDef.modifiers[memberName], 'name', 'static') !== null; };
            this.isSealed = () => { return findItemByProp(objDef.modifiers[memberName], 'name', 'sealed') !== null; };
            this.isAbstract = () => { return findItemByProp(objDef.modifiers[memberName], 'name', 'abstract') !== null; };
            this.isVirtual = () => { return findItemByProp(objDef.modifiers[memberName], 'name', 'virtual') !== null; };
            this.isOverride = () => { return findItemByProp(objDef.modifiers[memberName], 'name', 'virtual') !== null; };
            this.isEnumerable = () => { return Object.getOwnPropertyDescriptor(obj, memberName).enumerable; };
            this.isDeprecated = () => { return findItemByProp(objDef.attrs[memberName], 'name', 'deprecate') !== null; };
            this.isConditional = () => { return findItemByProp(objDef.attrs[memberName], 'name', 'conditional') !== null; };
            this.isMixed = () => { return findItemByProp(objDef.attrs[memberName], 'name', 'mixin') !== null; };
            this.isInterfaced = () => { return findItemByProp(objDef.attrs[memberName], 'name', 'interface') !== null; };
            this.getMixin = () => {
                let mixin = null;
                let mixin_attr = findItemByProp(objDef.attrs[memberName], 'name', 'mixin');
                if (mixin_attr && TypeMeta.mixins) {
                    for(let _mixin of TypeMeta.mixins) {
                        if (_mixin === mixin_attr.name) {
                            mixin = _Reflector(_mixin); break;
                        }
                    }
                }
                return mixin;
            };
            this.getInterface = () => {
                let intf = null;
                let intf_attr = findItemByProp(objDef.attrs[memberName], 'name', 'interface');
                if (intf_attr && TypeMeta.interfaces) {
                    for(let _intf of TypeMeta.interfaces) {
                        if (_intf === intf_attr.name) {
                            intf = _Reflector(_intf); break;
                        }
                    }
                }
                return intf;
            };        
        };   
        const PropReflector = function(memberName, def) {
            let refl = new CommonMemberReflector(memberName, def);
            refl.isReadOnly = () => { return findItemByProp(objDef.modifiers[memberName], 'name', 'readonly') !== null; };
            refl.isSerializable = () => { 
                return ((findItemByProp(objDef.attrs[memberName], 'name', 'serialize') !== null) ||
                        (findItemByProp(objDef.attrs[memberName], 'name', 'noserialize') === null && 
                        findItemByProp(typeDef.attrs.type, 'name', 'serialize') !== null));
            };
            refl.getValueType = () => {
                let type_attr = findItemByProp(objDef.attrs[memberName], 'name', 'type');
                if (type_attr) { return type_attr.args[0]; }
                return; // return nothing, so it remains undefined
            };
            refl.isDisposable = () => { return findItemByProp(objDef.attrs[memberName], 'name', 'dispose') !== null; };
            refl.isInjectable = () => { return findItemByProp(objDef.attrs[memberName], 'name', 'inject') !== null; };
            refl.isResource = () => { return findItemByProp(objDef.attrs[memberName], 'name', 'resource') !== null; };
            refl.isAsset = () => { return findItemByProp(objDef.attrs[memberName], 'name', 'asset') !== null; };
            refl.isSession = () => { return findItemByProp(objDef.attrs[memberName], 'name', 'session') !== null; };
            refl.isState = () => { return findItemByProp(objDef.attrs[memberName], 'name', 'state') !== null; };
            return refl;
        };
        const FuncReflector = function(memberName, def) {
            let refl = new CommonMemberReflector(memberName, def);
            refl.isASync = () => { return findItemByProp(objDef.modifiers[memberName], 'name', 'async') !== null; };
            refl.isConstructor = () => { return memberName === '_construct'; };
            refl.isDestructor = () => { return memberName === '_dispose'; };
            refl.isSub = () => { return findItemByProp(objDef.attrs[memberName], 'name', 'on') !== null; };
            refl.isTimered = () => { return findItemByProp(objDef.attrs[memberName], 'name', 'timer') !== null; };
            refl.isInjectable = () => { return findItemByProp(objDef.attrs[memberName], 'name', 'inject') !== null; };
            refl.getArgs = () => {
                let args_attr = findItemByProp(objDef.attrs[memberName], 'name', 'args');
                if (args_attr) { return args_attr.args.slice(); }
                return null;
            };
            refl.getAspects = () => {
                if (objDef.aspects && objDef.aspects[memberName].length > 0) {
                    let list = [];
                    for(let item of objDef.aspects[memberName]) {
                        list.push(_Reflector(item));
                    }
                    return list;                
                }
                return null;
            };
            refl.getAspect = (name) => {
                if (typeof name !== 'string') { throw _Exception.InvalidArgument('name', refl.getAspect); }
                if (objDef.aspects && objDef.aspects[memberName].length > 0) {
                    let item = findItemByProp(objDef.aspects[memberName], 'name', name);
                    if (item) { return _Reflector(item); }
                }
                return null;
            };        
            return refl;
        }; 
        const EventReflector = function(memberName, def) {
            let refl = new CommonMemberReflector(memberName, def);
            delete refl.isStatic;
            refl.isPub = () => { return findItemByProp(objDef.attrs[memberName], 'name', 'post') !== null; };
            return refl;
        };        
        const addMembersRefl = function(refl) {
            refl.getMembers = (filter) => {
                // set filter
                filter = filter || {};
                filter.types = filter.types || []; // name of member types
                filter.modifiers = filter.modifiers || []; // name of modifiers
                filter.attrs = filter.attrs || []; // name of attributes
                filter.aspects = filter.aspects || []; // name of aspect types
                filter.inherited = (typeof filter.inherited !== 'undefined' ? filter.inherited : true); // should include inherited members - or only own members
                
                ensureMembers();
                let memberRefl = null,
                    isInclude = true,
                    list = [];
                for(let memberName in objMembers) {
                    isInclude = true;
                    if (objMembers.hasOwnProperty(memberName)) {
                        memberRefl = objMembers[memberName];
                        if (filter.types.length > 0) { // member type check
                            if (filter.types.indexOf(memberRefl.getMemberType()) === -1) { 
                                isInclude = false;
                            } 
                        }
                        if (isInclude && !filter.inherited && !objDef.members[memberName]) { // inherited check
                            isInclude = false;
                        }
                        if (isInclude && filter.modifiers.length > 0) { // modifiers check
                            for(let modifier of filter.modifiers) {
                                if (findIndexByProp(objDef.modifiers[memberName], 'name', modifier) === -1) {
                                    isInclude = false; break;
                                }
                            }
                        }
                        if (isInclude && filter.attrs.length > 0) { // attrs check
                            for(let attr of filter.attrs) {
                                if (findIndexByProp(objDef.attrs[memberName], 'name', attr) === -1) {
                                    isInclude = false; break;
                                }
                            }
                        }
                        if (isInclude && filter.aspects.length > 0 && memberRefl.getMemberType() === 'func') { // aspects check
                            for(let aspect of filter.aspects) {
                                if (findIndexByProp(objDef.aspects[memberName], 'name', aspect) === -1) {
                                    isInclude = false; break;
                                }
                            }
                        }                        
                        if (isInclude) {
                            list.push(objMembers[memberName]);
                        }
                    }
                }
                return list;
            };
            refl.getMember = (memberName) => {
                if (typeof memberName !== 'string') { throw _Exception.InvalidArgument('memberName', refl.getMember); }
                ensureMembers();
                return objMembers[memberName] || null;
            };
        };
        const ClassReflector = function() {
            let refl = new CommonTypeReflector();
            refl.getParent = () => { 
                if (TypeMeta.inherits !== null) { return _Reflector(TypeMeta.inherits); }
                return null;
            };
            refl.isDerivedFrom = (name) => { 
                if (!name) { throw _Exception.InvalidArgument('name', refl.isDerivedFrom); }
                return (TypeMeta.isDerivedFrom ? TypeMeta.isDerivedFrom(name) : false); 
            };
            refl.getFamily = () => {
                let items = [],
                    prv = TypeMeta.inherits;
                if (TypeMeta.inherits !== null) { items.push(_Reflector(TypeMeta.inherits)); }
                while(true) { // eslint-disable-line no-constant-condition    
                    if (prv === null) { break; }
                    items.push(_Reflector(prv));
                    prv = prv[meta].inherits;
                }
                return items;
            };  
            refl.isSealed = () => { return (TypeMeta.isSealed ? TypeMeta.isSealed() : false); };
            refl.isAbstract = () => { return (TypeMeta.isAbstract ? TypeMeta.isAbstract() : false); };
            addMixinsRefl(refl);
            addIntfRefl(refl);
            refl.isSerializable = () => { return findItemByProp(typeDef.attrs.type, 'name', 'serialize') !== null; };        
            refl.isStatic = () => { return (TypeMeta.isStatic ? TypeMeta.isStatic() : false); };
            refl.isSingleton = () => { return (TypeMeta.isSingleton ? TypeMeta.isSingleton() : false); };                       
            refl.isSingleInstanceCreated = () => { return TypeMeta.singleInstance.value ? true : false; };
            addInstanceRefl(refl);
            addMembersRefl(refl);
            return refl;        
        };
        const StructReflector = function() {
            let refl = new CommonTypeReflector();
            refl.isSerializable = () => { return findItemByProp(typeDef.attrs.type, 'name', 'serialize') !== null; };        
            addInstanceRefl(refl);
            addMembersRefl(refl);
            return refl;              
        };
        const MixinReflector = function() {
            let refl = new CommonTypeReflector();
            addMembersRefl(refl);
            return refl;
        };
        const InterfaceReflector = function() {
            let refl = new CommonTypeReflector();
            addMembersRefl(refl);
            return refl;
        };
        const EnumReflector = function() {
            let refl = new CommonTypeReflector();
            refl.getNames = () => { 
                let list = [];
                for(let name of _Enum.getNames(obj)) {
                    list.push(PropReflector(name, objDef));
                }
                return list; 
            };
            refl.getName = (enumValue) => { 
                if (!enumValue) { throw _Exception.InvalidArgument('enumValue', refl.getName); }
                let name = _Enum.getName(obj, enumValue); 
                if (name) { return PropReflector(name, objDef); }
                return null;
            };
            refl.getValues = () => { return _Enum.getValues(obj); };
            refl.isDefined = (nameOrValue) => { 
                if (!nameOrValue) { throw _Exception.InvalidArgument('nameOrValue', refl.isDefined); }
                return _Enum.isDefined(obj, nameOrValue);
            }
            return refl;
        };
     
        // get reflector
        let ref = null,
            tempClass = null,
            isNewCreated = false;
        isNewFromReflector = true;
        switch(Type[meta].type) {
            case 'class': 
                target = Type; obj = new Type(); isNewCreated = true;
                ref = new ClassReflector();
                break;
            case 'struct': 
                target = Type; obj = new Type(); isNewCreated = true;
                ref = new StructReflector();
                break;
            case 'enum': 
                target = Type[meta].Type; obj = Type; 
                ref = new EnumReflector();
                break;
            case 'mixin': 
                target = Type;
                tempClass = _Class('temp', [target], function() {}); obj = new tempClass(); isNewCreated = true;
                ref = new MixinReflector();
                break;
            case 'interface': 
                target = Type[meta].Type; obj = Type; 
                ref = new InterfaceReflector();
                break;
        }
        isNewFromReflector = false; if (isNewCreated) { underReflection.push(obj); }
        TypeMeta = target[meta]; objMeta = obj[meta];
        objDef = objMeta.def; typeDef = objMeta.typeDef;
    
        // return
        return ref;
    };
    _Reflector.dispose = () => {
        if (underReflection.length > 0) {
            for(let item of underReflection) {
                _dispose(item);
            }
        }
        underReflection.length = 0;
    }
    
    // attach to flair
    a2f('Reflector', _Reflector, () => {
        _Reflector.dispose();
    });    
    /**
     * @name utils
     * @description Helper functions exposed.
     * @example
     *  utils.<...>
     * @params
     * @returns
     */ 
    const _utils = () => { };
    _utils.guid = guid;
    _utils.forEachAsync = forEachAsync;
    _utils.replaceAll = replaceAll;
    _utils.splitAndTrim = splitAndTrim;
    _utils.findIndexByProp = findIndexByProp;
    _utils.findItemByProp = findItemByProp;
    _utils.which = which;
    _utils.isArrowFunc = isArrow;
    _utils.isASyncFunc = isASync;
    _utils.sieve = sieve;
    _utils.deepMerge = deepMerge;
    _utils.getLoadedScript = getLoadedScript;
    _utils.b64EncodeUnicode = b64EncodeUnicode;
    _utils.b64DecodeUnicode = b64DecodeUnicode;
    
    // attach to flair
    a2f('utils', _utils);
        

    // freeze members
    flair.members = Object.freeze(flair.members);

    // get current file
    let currentFile = (isServer ? __filename : (isWorker ? self.location.href : getLoadedScript('flair.js', 'flair.min.js')));
    
    // info
    flair.info = Object.freeze({
        name: 'flairjs',
        title: 'Flair.js',
        file: currentFile,
        version: '0.9.2',
        copyright: '(c) 2017-2019 Vikas Burman',
        license: 'MIT',
        lupdate: new Date('Mon, 15 Jul 2019 00:29:00 GMT')
    });  

    // bundled assembly load process 
    let file = which('./flair{.min}.js', true);
    _AppDomain.context.current().loadBundledAssembly(file, currentFile, (flair, __asmFile) => {
        // NOTES: 
        // 1. Since this is a custom assembly index.js file, types built-in here does not support 
        //    await type calls, as this outer closure is not an async function

        // assembly closure init (start)
        /* eslint-disable no-unused-vars */
        
        // flair types, variables and functions
        const { Class, Struct, Enum, Interface, Mixin, Aspects, AppDomain, $$, attr, bring, Container, include, Port, on, post, telemetry,
                Reflector, Serializer, Tasks, as, is, isDefined, isComplies, isDerivedFrom, isAbstract, isSealed, isStatic, isSingleton, isDeprecated,
                isImplements, isInstanceOf, isMixed, getAssembly, getAttr, getContext, getResource, getRoute, getType, ns, getTypeOf,
                getTypeName, typeOf, dispose, using, Args, Exception, noop, nip, nim, nie, event } = flair;
        const { TaskInfo } = flair.Tasks;
        const { env } = flair.options;
        const { guid, forEachAsync, replaceAll, splitAndTrim, findIndexByProp, findItemByProp, which, isArrowFunc, isASyncFunc, sieve,
                deepMerge, getLoadedScript, b64EncodeUnicode, b64DecodeUnicode } = flair.utils;
        
        // inbuilt modifiers and attributes compile-time-safe support
        const { $$static, $$abstract, $$virtual, $$override, $$sealed, $$private, $$privateSet, $$protected, $$protectedSet, $$readonly, $$async,
                $$overload, $$enumerate, $$dispose, $$post, $$on, $$timer, $$type, $$args, $$inject, $$resource, $$asset, $$singleton, $$serialize,
                $$deprecate, $$session, $$state, $$conditional, $$noserialize, $$ns } = $$;
        
        // access to DOC
        const DOC = ((env.isServer || env.isWorker) ? null : window.document);
        
        // current for this assembly
        const __currentContextName = AppDomain.context.current().name;
        const __currentFile = __asmFile;
        const __currentPath = __currentFile.substr(0, __currentFile.lastIndexOf('/') + 1);
        AppDomain.loadPathOf('flair', __currentPath);
        
        // settings of this assembly
        let settings = JSON.parse('{"bootEngine":"flair.app.BootEngine"}');
        let settingsReader = flair.Port('settingsReader');
        if (typeof settingsReader === 'function') {
            let externalSettings = settingsReader('flair');
            if (externalSettings) { settings = deepMerge([settings, externalSettings], false); }
        }
        settings = Object.freeze(settings);
        
        // config of this assembly
        let config = JSON.parse('{}');
        config = Object.freeze(config);
        
        /* eslint-enable no-unused-vars */
        // assembly closure init (end)
        
        // assembly global functions (start)
        // (not defined)
        // assembly global functions (end)
        
        // set assembly being loaded
        AppDomain.context.current().currentAssemblyBeingLoaded('./flair{.min}.js');
        
        // assembly types (start)
            
    (() => { // type: ./src/flair/(root)/Aspect.js
        /**
         * @name Aspect
         * @description Aspect base class.
         */
        $$('abstract');
        $$('ns', '(root)');
        Class('Aspect', function() {
            /** 
             * @name before
             * @description Before advise
             * @example
             *  before(ctx)
             * @arguments
             * ctx: object - context object that is shared across all weavings
             *  typeName()      - gives the name of the type
             *  funcName()      - gives the name of the function
             *  error(err)      - store new error to context, or just call error() to get last error
             *  result(value)   - store new result to context, or just call result() to get last stored result
             *  args()          - get original args passed to main call
             *  data: {}        - an object to hold context data for temporary use, e.g., storing something in before advise and reading back in after advise
             */  
            $$('virtual');
            this.before = nim;
        
            /** 
             * @name around
             * @description Around advise
             * @example
             *  around(ctx, fn)
             * @arguments
             * ctx: object - context object that is shared across all weavings
             *  typeName()      - gives the name of the type
             *  funcName()      - gives the name of the function
             *  error(err)      - store new error to context, or just call error() to get last error
             *  result(value)   - store new result to context, or just call result() to get last stored result
             *  args()          - get original args passed to main call
             *  data: {}        - an object to hold context data for temporary use, e.g., storing something in before advise and reading back in after advise
             * fn: function - function which is wrapped, it should be called in between pre and post actions
             */  
            $$('virtual');
            this.around = nim;
        
            /** 
             * @name after
             * @description After advise
             * @example
             *  after(ctx)
             * @arguments
             * ctx: object - context object that is shared across all weavings
             *  typeName()      - gives the name of the type
             *  funcName()      - gives the name of the function
             *  error(err)      - store new error to context, or just call error() to get last error
             *  result(value)   - store new result to context, or just call result() to get last stored result
             *  args()          - get original args passed to main call
             *  data: {}        - an object to hold context data for temporary use, e.g., storing something in before advise and reading back in after advise
             */  
            $$('virtual');
            this.after = nim;
        });
        
    })();    
    (() => { // type: ./src/flair/(root)/Attribute.js
        /**
         * @name Attribute
         * @description Attribute base class.
         */
        $$('abstract');
        $$('ns', '(root)');
        Class('Attribute', function() {
            $$('virtual');
            this.construct = (args) => {
                this.args = args;
            };
        
           /** 
            *  @name args: array - arguments as defined where attribute is applied e.g., ('text', 012, false, Reference)
            */
            $$('readonly');
            this.args = [];
        
           /** 
            *  @name constraints: string - An expression that defined the constraints of applying this attribute 
            *                     using NAMES, PREFIXES, SUFFIXES and logical Javascript operator
            * 
            *                  NAMES can be: 
            *                      type names: class, struct, enum, interface, mixin
            *                      type member names: prop, func, construct, dispose, event
            *                      inbuilt modifier names: static, abstract, sealed, virtual, override, private, protected, readonly, async, etc.
            *                      inbuilt attribute names: promise, singleton, serialize, deprecate, session, state, conditional, noserialize, etc.
            *                      custom attribute names: any registered custom attribute name
            *                      type names itself: e.g., Aspect, Attribute, etc. (any registered type name is fine)
            *                          SUFFIX: A typename must have a suffix (^) e.g., Aspect^, Attribute^, etc. Otherwise this name will be treated as custom attribute name
            *                  
            *                  PREFIXES can be:
            *                      No Prefix: means it must match or be present at the level where it is being defined
            *                      @: means it must be inherited from or present at up in hierarchy chain
            *                      $: means it either must ne present at the level where it is being defined or must be present up in hierarchy chain
            *                  <name> 
            *                  @<name>
            *                  $<name>
            * 
            *                  BOOLEAN Not (!) can also be used to negate:
            *                  !<name>
            *                  !@<name>
            *                  !$<name>
            *                  
            *                  NOTE: Constraints are processed as logical boolean expressions and 
            *                        can be grouped, ANDed or ORed as:
            * 
            *                        AND: <name1> && <name2> && ...
            *                        OR: <name1> || <name2>
            *                        GROUPING: ((<name1> || <name2>) && (<name1> || <name2>))
            *                                  (((<name1> || <name2>) && (<name1> || <name2>)) || <name3>)
            * 
            **/
            $$('readonly');
            this.constraints = '';
        
            /** 
             * @name decorateProperty
             * @description Property decorator
             * @example
             *  decorateProperty(typeName, memberName, member)
             * @arguments
             *  typeName: string - typeName
             *  memberName: string - member name
             *  member - object - having get: getter function and set: setter function
             *          both getter and setter can be applied attribute functionality on
             * @returns
             *  object - having decorated { get: fn, set: fn }
             *           Note: decorated get must call member's get
             *                 decorated set must accept value argument and pass it to member's set with or without processing
             */  
            $$('virtual');
            this.decorateProperty = nim;
        
            /** 
             * @name decorateFunction
             * @description Function decorator
             * @example
             *  decorateFunction(typeName, memberName, member)
             * @arguments
             *  typeName: string - typeName
             *  memberName: string - member name
             *  member - function - function to decorate
             * @returns
             *  function - decorated function
             *             Note: decorated function must accept ...args and pass-it on (with/without processing) to member function
             */  
            $$('virtual');
            this.decorateFunction = nim;    
        
            /** 
             * @name decorateEvent
             * @description Event decorator
             * @example
             *  decorateEvent(typeName, memberName, member)
             * @arguments
             *  typeName: string - typeName
             *  memberName: string - member name
             *  member - function - event argument processor function
             * @returns
             *  function - decorated function
             *             Note: decorated function must accept ...args and pass-it on (with/without processing) to member function
             */  
            $$('virtual');
            this.decorateEvent = nim;
        });
        
        
    })();    
    (() => { // type: ./src/flair/(root)/IDisposable.js
        /**
         * @name IDisposable
         * @description IDisposable interface
         */
        $$('ns', '(root)');
        Interface('IDisposable', function() {
            this.dispose = nim;
        });
        
    })();    
    (() => { // type: ./src/flair/(root)/IProgressReporter.js
        /**
         * @name IProgressReporter
         * @description IProgressReporter interface
         */
        $$('ns', '(root)');
        Interface('IProgressReporter', function() {
            // progress report
            this.progress = nie;
        });
        
    })();    
    (() => { // type: ./src/flair/(root)/Task.js
        const { IProgressReporter, IDisposable } = ns();
        
        /**
         * @name Task
         * @description Task base class.
         */
        $$('ns', '(root)');
        Class('Task', [IProgressReporter, IDisposable], function() {
            let isSetupDone = false,
                isRunning = false,
                loadingContextName = AppDomain.context.current().name; // this will be processed at the time class is loaded
        
           /** 
            * @name construct
            * @description Task constructor
            */        
            this.construct = (...args) => {
                this.args = args;
        
                // set context and domain
                this.context = AppDomain.contexts(loadingContextName);
                this.domain = this.context.domain;
            };
        
           /** 
            * @name dispose
            * @description Task disposer
            */  
            $$('abstract');
            this.dispose = nim;
        
           /** 
            *  @name args: array - for task setup
            */
            $$('protected');
            this.args = [];
        
           /** 
            *  @name context: object - current assembly load context where this task is loaded
            */
           $$('protected');
           this.context = null;
        
           /** 
            *  @name domain: object - current assembly domain where this task is executing
            */
           $$('protected');
           this.domain = null;
        
           /** 
            * @name run
            * @description Task executor
            * @example
            *  run()
            * @arguments
            *  args: array - array as passed to task constructor* 
            * @returns
            *  any - anything
            */  
            this.run = async (...args) => {
                if (!isRunning) {
                    // mark
                    isRunning = true;
        
                    // setup
                    if (!isSetupDone) {
                        try {
                            await this.setup();
                            isSetupDone = true;
                        } catch(err) {
                            isRunning = false;
                            throw err;
                        }
                    }
        
                    // run
                    try {
                        let result = await this.onRun(...args);
                        return result;
                    } catch(err) {
                        throw err;
                    } finally {
                        isRunning = false;
                    }
                } else {
                     throw Exception.InvalidOperation('Task is already running', this.run);
                }
            };
           
           /** 
            * @name progress
            * @description Progress event
            * @example
            *  progress()
            */  
            this.progress = event((data) => {
                return { data: data };
            });
        
            /** 
             * @name setup
             * @description Task related setup, executed only once, before onRun is called, - async
             * @example
             *  setup()
             * @returns
             *  promise
             */  
            $$('virtual');
            $$('protected');
            $$('async');
            this.setup = noop;
        
            /** 
             * @name onRun
             * @description Task run handler - async
             * @example
             *  onRun(...args)
             * @arguments
             *  args: array - array as passed to task run
             * @returns
             *  any - anything
             */  
            $$('abstract');
            $$('protected');
            $$('async');
            this.onRun = nim;
        });
        
    })();
        // assembly types (end)
        
        // assembly embedded resources (start)
        // (not defined)
        // assembly embedded resources (end)        
        
        // clear assembly being loaded
        AppDomain.context.current().currentAssemblyBeingLoaded('');
        
        // register assembly definition object
        AppDomain.registerAdo('{"name":"flair","file":"./flair{.min}.js","mainAssembly":"flair","desc":"True Object Oriented JavaScript","title":"Flair.js","version":"0.9.2","lupdate":"Mon, 15 Jul 2019 00:29:00 GMT","builder":{"name":"flairBuild","version":"1","format":"fasm","formatVersion":"1","contains":["init","func","type","vars","reso","asst","rout","sreg"]},"copyright":"(c) 2017-2019 Vikas Burman","license":"MIT","types":["Aspect","Attribute","IDisposable","IProgressReporter","Task"],"resources":[],"assets":[],"routes":[]}');
        
        // assembly load complete
        if (typeof onLoadComplete === 'function') { 
            onLoadComplete();   // eslint-disable-line no-undef
        }
        
        // return settings and config
        return Object.freeze({
            name: 'flair',
            settings: settings,
            config: config
        });
    });

    // set settings and config for uniform access anywhere in this closure
    let asm = _getAssembly('[flair]');
    settings = asm.settings();
    config = asm.config();
    
    // return
    return Object.freeze(flair);
});
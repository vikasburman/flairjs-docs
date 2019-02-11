
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
 *                      inbuilt modifier names: static, abstract, sealed, virtual, override, private, protected, readonly, async
 *                      inbuilt attribute names: promise, singleton, serialize, deprecate, session, state, conditional, noserialize
 *                      custom attribute names: any registered custom attribute name
 *                      type names itself: e.g., Assembly, Attribute, etc. (any registered type name is fine)
 *                          SUFFIX: A typename must have a suffix (^) e.g., Assembly^, Attribute^, etc. Otherwise this name will be treated as custom attribute name
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
 * 
 * @constructs Constructs attribute configuration object
 */ 
const _attrConfig = function(isModifier, constraints) {
    if (typeof isModifier === 'string') {
        constraints = isModifier;
        isModifier = false;
    }
    if (typeof constraints !== 'string') { throw new _Exception.InvalidArgument('constraints'); }


    // config object
    let _this = {
        isModifier: isModifier,
        constraints: constraints
    };

    // return
    return _this;
};

/**
 * @name attr
 * @description Decorator function to apply attributes on type and member definitions
 * @example
 *  attr(attrName)
 *  attr(attrName, ...args)
 * @params
 *  attrName: string/type - Name of the attribute, it can be an internal attribute or namespaced attribute name
 *                          It can also be the Attribute flair type itself
 *  args: any - Any arguments that may be needed by attribute
 * @returns void
 */ 
const _attr = (name, ...args) => {
    if (!name || ['string', 'class'].indexOf(_typeOf(name) === -1)) { throw new _Exception('InvalidArgument', 'Argument type is invalid. (name)'); }
    if (name && typeof name !== 'string' && !_isDerivedFrom(name, 'Attribute')) { throw new _Exception('InvalidArgument', 'Argument type is invalid. (name)'); }

    let Attr = null,
        attrInstance = null,
        cfg = null;
    if (typeof name === 'string') {
        cfg = _attr._.inbuilt[name] || null;
        if (!cfg) { // not an inbuilt attr
            Attr = _Namespace.getType(name);
            if (!Attr) { throw new _Exception('NotFound', `Attribute is not found. (${name})`); }
            name = Attr._.name;
        }
    } else {
        Attr = name; // the actual Attribute type
        name = Attr._.name;
    }

    // duplicate check
    if (findIndexByProp(_attr._.bucket, 'name', name) !== -1) { throw new _Exception('Duplicate', `Duplicate attributes are not allowed. (${name})`); }

    // custom attribute instance
    if (Attr) {
        attrInstance = new Attr(...args);
        cfg = new _attrConfig(attrInstance.constraints);
    }

    // store
    _attr._.bucket.push({name: name, cfg: cfg, isCustom: (attrInstance !== null), attr: attrInstance, args: args});
};
_attr._ = Object.freeze({
    bucket: [],
    inbuilt: Object.freeze({ 
        static: new _attrConfig(true, '((class || struct) && !$abstract) || (((class || struct) && (prop || func)) && !$abstract && !$virtual && !$override)'),
    
        abstract: new _attrConfig(true, '((class || struct) && !$sealed && !$static) || (((class || struct) && (prop || func || event)) && !$override && !$sealed && !$static)'),
        virtual: new _attrConfig(true, '(class || struct) && (prop || func || event) && !$abstract && !$override && !$sealed && !$static'),
        override: new _attrConfig(true, '(class || struct) && (prop || func || event) && ((@virtual || @abstract) && !virtual && !abstract) && !$sealed, !$static)'),
        sealed: new _attrConfig(true, '(class || ((class && (prop || func || event)) && override)'), 
    
        private: new _attrConfig(true, '(class || struct) && (prop || func || event) && !$protected && !@private && !$static'),
        protected: new _attrConfig(true, '(class || struct) && (prop || func || event) && !$private && !$static'),
        readonly: new _attrConfig(true, '(class || struct) && prop && !abstract'),
        async: new _attrConfig(true, '(class || struct) && func'),
    
        enumerate: new _attrConfig('(class || struct) && prop || func || event'),
        singleton: new _attrConfig('(class && !$abstract && !$static && !(prop || func || event))'),
        serialize: new _attrConfig('((class || struct) || (class || struct && prop)) && !$abstract, !$static'),
        deprecate: new _attrConfig('!construct && !dispose'),
        session: new _attrConfig('(class || struct || mixin) && prop && !$static && !$state && !$readonly && !$abstract && !$virtual'),
        state: new _attrConfig('(class || struct || mixin) && prop && !$static && !$session && !$readonly && !$abstract && !$virtual'),
        conditional: new _attrConfig('(class || struct || mixin) && (prop || func || event)'),
        noserialize: new _attrConfig('(class || struct || mixin) && prop'),
    
        mixed: new _attrConfig('prop || func || event'),
        event: new _attrConfig('func')
    })
});
_attr.collect = () => {
    let attrs = _attr._.bucket.slice();
    _attr.clear();
    return attrs;
}
_attr.has = (name) => {
    return (_attr._.bucket.findIndex(item => item.name === name) !== -1);
};
_attr.clear = () => {
    _attr._.bucket.length = 0; // remove all
};

// attach
flair.attr = _attr;
flair.members.push('attr');

// TODO: define $$ which is just attr without any attr.collect etc.
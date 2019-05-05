(() => { let ados = JSON.parse('[{"name":"flair.app","file":"./flair.app{.min}.js","mainAssembly":"flair","desc":"True Object Oriented JavaScript","title":"Flair.js","version":"0.50.48","lupdate":"Sun, 05 May 2019 03:02:56 GMT","builder":{"name":"<<name>>","version":"<<version>>","format":"fasm","formatVersion":"1","contains":["initializer","functions","types","enclosureVars","enclosedTypes","resources","assets","routes","selfreg"]},"copyright":"(c) 2017-2019 Vikas Burman","license":"MIT","types":["flair.app.Bootware","flair.app.Handler","flair.app.App","flair.app.Host","flair.app.BootEngine","flair.boot.DIContainer"],"resources":[],"assets":[],"routes":[]},{"name":"flair.client","file":"./flair.client{.min}.js","mainAssembly":"flair","desc":"True Object Oriented JavaScript","title":"Flair.js","version":"0.50.48","lupdate":"Sun, 05 May 2019 03:02:56 GMT","builder":{"name":"<<name>>","version":"<<version>>","format":"fasm","formatVersion":"1","contains":["initializer","functions","types","enclosureVars","enclosedTypes","resources","assets","routes","selfreg"]},"copyright":"(c) 2017-2019 Vikas Burman","license":"MIT","types":["flair.ui.ViewTransition","flair.app.ClientHost","flair.boot.ClientRouter","flair.ui.ViewHandler","flair.ui.ViewInterceptor","flair.ui.ViewState"],"resources":[],"assets":[],"routes":[]},{"name":"flair.server","file":"./flair.server{.min}.js","mainAssembly":"flair","desc":"True Object Oriented JavaScript","title":"Flair.js","version":"0.50.48","lupdate":"Sun, 05 May 2019 03:02:57 GMT","builder":{"name":"<<name>>","version":"<<version>>","format":"fasm","formatVersion":"1","contains":["initializer","functions","types","enclosureVars","enclosedTypes","resources","assets","routes","selfreg"]},"copyright":"(c) 2017-2019 Vikas Burman","license":"MIT","types":["flair.api.RestHandler","flair.api.RestInterceptor","flair.app.ServerHost","flair.app.server.ExpressServer","flair.boot.Middlewares","flair.boot.NodeEnv","flair.boot.ResHeaders","flair.boot.ServerRouter"],"resources":[],"assets":[],"routes":[]},{"name":"flair.vue","file":"./flair.vue{.min}.js","mainAssembly":"flair","desc":"True Object Oriented JavaScript","title":"Flair.js","version":"0.50.48","lupdate":"Sun, 05 May 2019 03:02:57 GMT","builder":{"name":"<<name>>","version":"<<version>>","format":"fasm","formatVersion":"1","contains":["initializer","functions","types","enclosureVars","enclosedTypes","resources","assets","routes","selfreg"]},"copyright":"(c) 2017-2019 Vikas Burman","license":"MIT","types":["flair.ui.vue.VueComponentMembers","flair.ui.vue.VueComponent","flair.ui.vue.VueDirective","flair.ui.vue.VueFilter","flair.ui.vue.VueLayout","flair.ui.vue.VueMixin","flair.ui.vue.VuePlugin","flair.ui.vue.VueSetup","flair.ui.vue.VueView"],"resources":[],"assets":[],"routes":[{"name":"flair.ui.vue.test2","mount":"main","index":101,"verbs":[],"path":"test/:id","handler":"abc.xyz.Test"},{"name":"flair.ui.vue.exit2","mount":"main","index":103,"verbs":[],"path":"exit","handler":"abc.xyz.Exit"}]}]');
const flair = (typeof global !== 'undefined' ? require('flairjs') : (typeof WorkerGlobalScope !== 'undefined' ? WorkerGlobalScope.flair : window.flair));
flair.AppDomain.registerAdo(...ados);}
)();

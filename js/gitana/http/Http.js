(function(global)
{
    // the default timeout for xhr connections
    // this is set long at 2 minutes
    Gitana.HTTP_TIMEOUT = 120000;

    Gitana.Http = Base.extend(
    /** @lends Gitana.Http.prototype */
    {
        /**
         * @constructs
         *
         * @class Gitana.Http
         */
        constructor: function()
        {
            ///////////////////////////////////////////////////////////////////////////////////////
            //
            // PRIVILEDGED METHODS
            //

            this.invoke = function(options)
            {
                var method = options.method || 'GET';
                var url = options.url;
                //var data = options.data || {};
                var data = options.data;
                var headers = options.headers || {};
                var success = options.success || function () {};
                var failure = options.failure || function () {};

                // make sure that all responses come back as JSON if they can (instead of XML)
                //headers["Accept"] = "application/json,*/*;q=0.8";
                headers["Accept"] = "application/json";

                // ensure that CSRF token is applied (if available)
                // the csrf token
                var csrfToken = Gitana.CSRF_TOKEN;
                if (!csrfToken)
                {
                    // if we were not explicitly provided the token, look it up from a cookie
                    // NOTE: this only works in the browser
                    for (var t = 0; t < Gitana.CSRF_COOKIE_NAMES.length; t++)
                    {
                        var cookieName = Gitana.CSRF_COOKIE_NAMES[t];

                        var cookieValue = Gitana.readCookie(cookieName);
                        if (cookieValue)
                        {
                            csrfToken = cookieValue;
                            break;
                        }
                    }
                }
                if (csrfToken)
                {
                    headers[Gitana.CSRF_HEADER_NAME] = csrfToken;
                }

                var xhr = Gitana.Http.Request();
                xhr.withCredentials = true;
                xhr.onreadystatechange = function ()
                {
                    if (xhr.readyState === 4)
                    {
                        var regex = /^(.*?):\s*(.*?)\r?$/mg,
                            requestHeaders = headers,
                            responseHeaders = {},
                            responseHeadersString = '',
                            match;

                        if (!!xhr.getAllResponseHeaders)
                        {
                            responseHeadersString = xhr.getAllResponseHeaders();
                            while((match = regex.exec(responseHeadersString)))
                            {
                                responseHeaders[match[1]] = match[2];
                            }
                        }
                        else if(!!xhr.getResponseHeaders)
                        {
                            responseHeadersString = xhr.getResponseHeaders();
                            for (var i = 0, len = responseHeadersString.length; i < len; ++i)
                            {
                                responseHeaders[responseHeadersString[i][0]] = responseHeadersString[i][1];
                            }
                        }

                        var includeXML = false;
                        if ('Content-Type' in responseHeaders)
                        {
                            if (responseHeaders['Content-Type'] == 'text/xml')
                            {
                                includeXML = true;
                            }
                        }

                        var responseObject = {
                            text: xhr.responseText,
                            xml: (includeXML ? xhr.responseXML : ''),
                            requestHeaders: requestHeaders,
                            responseHeaders: responseHeaders
                        };

                        // handle the response
                        if (xhr.status === 0)
                        {
                            // not handled
                        }
                        if ((xhr.status >= 200 && xhr.status <= 226) || xhr.status == 304)
                        {
                            // ok
                            success(responseObject, xhr);
                        }
                        else if (xhr.status >= 400 && xhr.status !== 0)
                        {
                            // everything what is 400 and above is a failure code
                            failure(responseObject, xhr);
                        }
                        else if (xhr.status >= 300 && xhr.status <= 303)
                        {
                            // some kind of redirect, probably to a login server
                            // indicates missing access token?
                            failure(responseObject, xhr);
                        }
                    }
                };

                xhr.open(method, url, true);
                xhr.timeout = Gitana.HTTP_TIMEOUT;
                xhr.ontimeout = function () {
                    failure({
                        "timeout": true
                    }, xhr);
                };

                xhr.setRequestHeader('X-Requested-With','XMLHttpRequest');
                for (var header in headers)
                {
                    xhr.setRequestHeader(header, headers[header]);
                }

                try
                {
                    xhr.send(data);
                }
                catch (e)
                {
                    console.log(e);
                }
            };
        },

        /**
         * Performs an HTTP call.
         *
         * @param options
         */
        request: function(options)
        {
            return this.invoke(options);
        }
    });

    Gitana.Http.toQueryString = function(params)
    {
        var queryString = "";

        if (params)
        {
            for (var k in params)
            {
                if (queryString.length > 0)
                {
                    queryString += "&";
                }

                var val = null;
                if (params[k])
                {
                    val = params[k];

                    // url encode
                    val = Gitana.Http.URLEncode(val);
                }

                if (val)
                {
                    queryString += k + "=" + val;
                }
            }
        }

        return queryString;
    };

    Gitana.Http.Request = function()
    {
        var XHR;

        if (typeof global.Titanium !== 'undefined' && typeof global.Titanium.Network.createHTTPClient != 'undefined')
        {
            XHR = global.Titanium.Network.createHTTPClient();
        }
        else if (typeof require !== 'undefined')
        {
            // CommonJS require
            try
            {
                var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
                XHR = new XMLHttpRequest();
            }
            catch (e)
            {
               XHR = new global.XMLHttpRequest();
            }
        }
        else
        {
            // W3C
            XHR = new global.XMLHttpRequest();
        }

        return XHR;
    };

    var Hash = function() {};
    Hash.prototype =
    {
        join: function(string)
        {
            string = string || '';
            return this.values().join(string);
        },

        keys: function()
        {
            var i, arr = [], self = this;
            for (i in self) {
                if (self.hasOwnProperty(i)) {
                    arr.push(i);
                }
            }

            return arr;
        },

        values: function()
        {
            var i, arr = [], self = this;
            for (i in self) {
                if (self.hasOwnProperty(i)) {
                    arr.push(self[i]);
                }
            }

            return arr;
        },
        shift: function(){throw 'not implemented';},
        unshift: function(){throw 'not implemented';},
        push: function(){throw 'not implemented';},
        pop: function(){throw 'not implemented';},
        sort: function(){throw 'not implemented';},

        ksort: function(func){
            var self = this, keys = self.keys(), i, value, key;

            if (func == undefined) {
                keys.sort();
            } else {
                keys.sort(func);
            }

            for (i = 0; i  < keys.length; i++) {
                key = keys[i];
                value = self[key];
                delete self[key];
                self[key] = value;
            }

            return self;
        },
        toObject: function () {
            var obj = {}, i, self = this;
            for (i in self) {
                if (self.hasOwnProperty(i)) {
                    obj[i] = self[i];
                }
            }

            return obj;
        }
    };

    var Collection = function(obj)
    {
        var args = arguments, args_callee = args.callee, args_length = args.length,
            i, collection = this;

        if (!(this instanceof args_callee)) {
            return new args_callee(obj);
        }

        for(i in obj) {
            if (obj.hasOwnProperty(i)) {
                collection[i] = obj[i];
            }
        }

        return collection;
    };
    Collection.prototype = new Hash();

    Gitana.Http.URI = function(url)
    {
        var args = arguments, args_callee = args.callee,
            parsed_uri, scheme, host, port, path, query, anchor,
            parser = /^([^:\/?#]+?:\/\/)*([^\/:?#]*)?(:[^\/?#]*)*([^?#]*)(\?[^#]*)?(#(.*))*/,
            uri = this;

        if (!(this instanceof args_callee))
        {
            return new args_callee(url);
        }

        uri.scheme = '';
        uri.host = '';
        uri.port = '';
        uri.path = '';
        uri.query = new Gitana.Http.QueryString();
        uri.anchor = '';

        if (url !== null)
        {
            parsed_uri = url.match(parser);

            scheme = parsed_uri[1];
            host = parsed_uri[2];
            port = parsed_uri[3];
            path = parsed_uri[4];
            query = parsed_uri[5];
            anchor = parsed_uri[6];

            scheme = (scheme !== undefined) ? scheme.replace('://', '').toLowerCase() : 'http';
            port = (port ? port.replace(':', '') : (scheme === 'https' ? '443' : '80'));
            // correct the scheme based on port number
            scheme = (scheme == 'http' && port === '443' ? 'https' : scheme);
            query = query ? query.replace('?', '') : '';
            anchor = anchor ? anchor.replace('#', '') : '';


            // Fix the host name to include port if non-standard ports were given
            if ((scheme === 'https' && port !== '443') || (scheme === 'http' && port !== '80')) {
                host = host + ':' + port;
            }

            uri.scheme = scheme;
            uri.host = host;
            uri.port = port;
            uri.path = path || '/';
            uri.query.setQueryParams(query);
            uri.anchor = anchor || '';
        }
    };

    Gitana.Http.URI.prototype = {
        scheme: '',
        host: '',
        port: '',
        path: '',
        query: '',
        anchor: '',
        toString: function () {
            var self = this, query = self.query + '';
            return self.scheme + '://' + self.host + self.path + (query != '' ? '?' + query : '') + (self.anchor !== '' ? '#' + self.anchor : '');
        }
    };

    Gitana.Http.QueryString = function(obj)
    {
        var args = arguments, args_callee = args.callee, args_length = args.length,
            i, querystring = this;

        if (!(this instanceof args_callee)) {
            return new args_callee(obj);
        }

        if (obj != undefined) {
            for (i in obj) {
                if (obj.hasOwnProperty(i)) {
                    querystring[i] = obj[i];
                }
            }
        }

        return querystring;
    };

    // QueryString is a type of collection So inherit
    Gitana.Http.QueryString.prototype = new Collection();

    Gitana.Http.QueryString.prototype.toString = function ()
    {
        var i, self = this, q_arr = [], ret = '',
            val = '', encode = Gitana.Http.URLEncode;
        self.ksort(); // lexicographical byte value ordering of the keys

        for (i in self) {
            if (self.hasOwnProperty(i)) {
                if (i != undefined && self[i] != undefined) {
                    val = encode(i) + '=' + encode(self[i]);
                    q_arr.push(val);
                }
            }
        }

        if (q_arr.length > 0) {
            ret = q_arr.join('&');
        }

        return ret;
    };

    Gitana.Http.QueryString.prototype.setQueryParams = function (query)
    {
        var args = arguments, args_length = args.length, i, query_array,
            query_array_length, querystring = this, key_value;

        if (args_length == 1) {
            if (typeof query === 'object') {
                // iterate
                for (i in query) {
                    if (query.hasOwnProperty(i)) {
                        querystring[i] = query[i];
                    }
                }
            } else if (typeof query === 'string') {
                // split string on '&'
                query_array = query.split('&');
                // iterate over each of the array items
                for (i = 0, query_array_length = query_array.length; i < query_array_length; i++) {
                    // split on '=' to get key, value
                    key_value = query_array[i].split('=');
                    querystring[key_value[0]] = key_value[1];
                }
            }
        } else {
            for (i = 0; i < arg_length; i += 2) {
                // treat each arg as key, then value
                querystring[args[i]] = args[i+1];
            }
        }
    };

    Gitana.Http.URLEncode = function(string)
    {
        function hex(code) {
            var hex = code.toString(16).toUpperCase();
            if (hex.length < 2) {
                hex = 0 + hex;
            }
            return '%' + hex;
        }

        if (!string) {
            return '';
        }

        string = string + '';
        var reserved_chars = /[ \r\n!*"'();:@&=+$,\/?%#\[\]<>{}|`^\\\u0080-\uffff]/,
            str_len = string.length, i, string_arr = string.split(''), c;

        for (i = 0; i < str_len; i++)
        {
            c = string_arr[i].match(reserved_chars);
            if (c)
            {
                c = c[0].charCodeAt(0);

                if (c < 128) {
                    string_arr[i] = hex(c);
                } else if (c < 2048) {
                    string_arr[i] = hex(192+(c>>6)) + hex(128+(c&63));
                } else if (c < 65536) {
                    string_arr[i] = hex(224+(c>>12)) + hex(128+((c>>6)&63)) + hex(128+(c&63));
                } else if (c < 2097152) {
                    string_arr[i] = hex(240+(c>>18)) + hex(128+((c>>12)&63)) + hex(128+((c>>6)&63)) + hex(128+(c&63));
                }
            }
        }

        return string_arr.join('');
    };

    Gitana.Http.URLDecode = function (string)
    {
        if (!string)
        {
            return '';
        }

        return string.replace(/%[a-fA-F0-9]{2}/ig, function (match) {
            return String.fromCharCode(parseInt(match.replace('%', ''), 16));
        });
    };

}(this));

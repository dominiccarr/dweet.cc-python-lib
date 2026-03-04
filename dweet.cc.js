(function () {

	var request;
	var LAST_THING_NAME = "last-thing.dat";
	var DWEET_SERVER = "https://dweet.cc";
	var STRICT_SSL = true;
	var REQUEST_TIMEOUT = 5000;
	var lastThing;

		request = function (options, callback) {
			var self = this;
			var src = options.url + (options.url.indexOf("?") + 1 ? "&" : "?");
			var params = [];
			var param_name = "";

			for (param_name in options.json) {
				params.push(param_name + "=" + encodeURIComponent(options.json[param_name]));
			}

			src += params.join("&");
			console.log(src)

			fetch(src, {
				method: "POST",          
				body: params
			})
			.then(res => {
				if (!res.ok) {
					throw new Error(res.status);
				}
				return res.json();
				})
				.then(data => {
					callback(null, data, data)
					console.log(data);
				})
				.catch(err => {
					console.error(err);
				});

		};

	function isArray(obj) {
		return Object.prototype.toString.call( obj ) === '[object Array]'
	}

	function isFunction(obj) {
		return typeof obj === 'function';
	}

	var dweetioClient = function () {
		var self = this;
		var currentThing = lastThing;

		function normalizeDweet(dweet) {
			if (dweet.created) {
				dweet.created = new Date(dweet.created);
			}

			return dweet;
		}

		function normalizeDweets(dweets) {
			if (dweets instanceof Array) {
				for (var index = 0; index < dweets.length; index++) {
					var dweet = dweets[index];
					normalizeDweet(dweet);
				}
			}
			else {
				normalizeDweet(dweets);
			}

			return dweets;
		}

		function parseBody(body) {
			var responseData;

			try {
				if (typeof body == 'string' || body instanceof String) {
					responseData = JSON.parse(body);
				}
				else {
					responseData = body;
				}
			}
			catch (e) {
			}

			return responseData;
		}

		function processResponse(body) {
			var err;

			var responseData = parseBody(body);

			if (!responseData) {
				err = new Error("server returned an invalid response");
			}
			else if (responseData["this"] == "failed") {
				err = new Error(responseData["because"]);
			}

			return err;
		}

		function createKeyedURL(url, key) {
			if (key) {
				return url + (url.indexOf("?") + 1 ? "&" : "?") + "key=" + encodeURIComponent(key);
			}

			return url;
		}

		function processDweetResponse(err, callback, body) {
			var responseData = parseBody(body);

			if (!err) {
				err = processResponse(responseData);
			}

			if (responseData && responseData["with"]) {
				if (callback) callback(err, normalizeDweets(responseData["with"]));
			}
			else {
				if (callback) callback("no response from server", undefined);
			}
		}

		self.get_latest_dweet_for = function (thing, key, callback) {
			if (isFunction(key)) {
				callback = key;
				key = null;
			}

			request({
				url: createKeyedURL(DWEET_SERVER + "/get/latest/dweet/for/" + thing, key),
				jar: true,
				timeout: REQUEST_TIMEOUT,
				strictSSL: STRICT_SSL
			}, function (err, response, body) {
				processDweetResponse(err, callback, body);
			});
		}

		self.get_all_dweets_for = function (thing, key, callback) {
			console.log("getting all")
			if (isFunction(key)) {
				callback = key;
				key = null;
			}

			request({
				url: createKeyedURL(DWEET_SERVER + "/get/dweets/for/" + thing, key),
				jar: true,
				timeout: REQUEST_TIMEOUT,
				strictSSL: STRICT_SSL
			}, function (err, response, body) {
				console.log(response)
				processDweetResponse(err, callback, body);
			});
		}
		

		self.listen_for = async function (thing, callback) {

		  const response = await fetch(DWEET_SERVER + "/listen/for/dweets/from/"+thing);

		  if (!response.body) {
			throw new Error("No response body!");
		  }

		  const reader = response.body.getReader();
		  const decoder = new TextDecoder("utf-8");

		  while (true) {
			const { done, value } = await reader.read();
			if (done) break;

			const chunk = decoder.decode(value, { stream: true });
			console.log(chunk)
			const jsonString = chunk.replace(/^data:\s*/, '');
			const obj = JSON.parse(jsonString);

			callback(obj)
			
		  }
		}


	};

	window.dweetio = new dweetioClient();
	
})();
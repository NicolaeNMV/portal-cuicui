cuicui = {};

$(document).ready(function() {
	cuicui.main.main();
});

cuicui.feed_date = null; // date when cuicui feed was last checked

cuicui.main = (function(){
	$(document).bind("cuiTick",function(){recalculatePostsSinceText()});
	
	var main = function() {
		uiEnhancer(); // Open links in a new window, infinite scroll
		loadCui();
		
		Pict.send('ready', {
		    title: document.getElementsByTagName('title')[0].innerHTML,
		    icon: Pict.getIcon(),
		    height: 245
		});
		
		cuicui.local.load();
		cuicui.autoupdate.main();
	}
	
	var loadCui = function() {
		cuicui.tools.getJSONP("/cuicui/cake/?/"+ encodeURIComponent(cuicui.local.getLatest()),function(data){
			$("ol.notices").empty();
			if (data.youHaveLatest == "false")
				cuicui.local.store(data.xml);
			xml = cuicui.local.getXml();
			loadCuiXml(xml);
			$(document).trigger("loadCui");
		});
	}
	
	var loadCuiXml = function(xml,cssSelectLimit) {
		xml.find("feed entry").each(function(i,el) {
			cuicui.main.parseEntry(el);
		});		
	}
	
	var loadCuiPage = function(page) {
		cuicui.tools.getJSONP("/cuicui/cake/?/page/"+page,function(data){
			var xml = $($.parseXML(data.xml));
			loadCuiXml(xml);
			$(document).trigger("loadCui");
		});
	}
	
	var parseEntry = function(el) {
		var published = $(el).find('published')[0].textContent;
        var params = {
                "contentHtml": $(el).find('content[type="html"]')[0].textContent,
                "id": $(el).find('id')[0].textContent,
                "authorUri": $(el).find('author uri')[0].textContent,
                "authorAvatar48": $(el).find('link[rel="avatar"][media\\:width=48]')[0].getAttribute("href"),
                "authorName": $(el).find('author name')[0].textContent,
                "authorDisplayname": cuicui.tools.getByTagName($(el).find('author *'),"poco:displayName").textContent,
                "published": published,
                "deltaDate": cuicui.tools.deltaDateText(cuicui.tools.parseISO8601Date(published))
            };
        $( "#elementTemplate" ).tmpl( params ).appendTo( "ol.notices" );
	}
	
	var uiLoader = (function() {
		var show = function() {
			$("#loading_pacman").show();
		}
		var hide = function() {
			$("#loading_pacman").hide();
		}
		return {
			show: show,
			hide: hide
		}
	})();
	
	var uiEnhancer = function() {
		var cuicuiIsLoading = false; // One loading at a time
		var page = 1; // Current loaded cuis, used for infinite scrolling feature
		// Link in a new window
		$("ol.notices a").live("mousedown",function(){$(this).attr({target:"_blank"})});
		// Infinite scroll
		var content = $("#content");
		content.scroll(function() {
			if (cuicuiIsLoading == true) return;
			var height =  content.height();
			var tillTheEnd = content.prop("scrollHeight") - content.scrollTop() - height;
			if (tillTheEnd < height) {				
				console.log("Gogo",cuicuiIsLoading,page);
				cuicuiIsLoading = true;
				cuicui.main.loadCuiPage(++page);
				uiLoader.show();
			}
		});
		$(document).bind("loadCui",function(){
			cuicuiIsLoading=false;
			uiLoader.hide();
			}
		);
		
		//cuicui.local.lastView.get();
	}
	
	// Update posts since time, once in a tick
	var recalculatePostsSinceText = function() {
		$(".timestamp abbr").each(function(){
			var recalculatedElpased = cuicui.tools.parseISO8601Date($(this).prop("title"));
			$(this).text( cuicui.tools.deltaDateText(recalculatedElpased) );
		});
	}
	
	return {
		parseEntry: parseEntry,
		loadCui: loadCui,
		loadCuiXml: loadCuiXml,
		loadCuiPage: loadCuiPage,
		main: main
	}
})();

// Local cache
cuicui.local = (function(){
	var key = "xmlStr";
	var parsedXml = false;
	
	var get = function() {
		return Storage.get(key);
	}
	
	var getXml = function() {
		if (parsedXml == false && get()) {
			parsedXml = $($.parseXML(get()));
		}
		return parsedXml;
	}
	
	var lastView = function() {
		var key = "lastView";
		var mySet = function(data) {
			return set(lastView,data);
		}
		var myGet = function() {
			return get(lastView);			
		}
		return {
			set: mySet,
			get: myGet
		}
	}
	
	var load = function () {
		var xml = getXml(); 
		if (xml) {
			xml.find("feed entry").each(function(i,el) {
				cuicui.main.parseEntry(el);
			});
		}
	}

	var store = function(xmlStr) {
		Storage.set(key,xmlStr);
		parsedXml = $($.parseXML(xmlStr));
	}
	
	var getLatest = function() {
		var xml = getXml();
		return xml?$("feed entry:first published",getXml())[0].textContent:null;
	}
	
	return {
		load: load,
		store: store,
		getXml: getXml,
		lastView: lastView,
		getLatest: getLatest
	}
})();

// Autoupdate
(function(){
	var timer;
	cuicui.autoupdate = {};
	cuicui.autoupdate.timer;
	var timerInterval = 30;
	var audioElement;
	
	cuicui.autoupdate.main = function() {
		var pusher = new Pusher('e9aa43b8525b35866f30');
	    var channel = pusher.subscribe('cuicui');
	    channel.bind('pong', function(data) {
	    	cuicui.feed_date = new Date();

	    	if (data.latest === undefined) {
	    		data = jQuery.parseJSON(data);
	    	}
	    	if (data.latest != cuicui.local.getLatest()) {
		      cuicui.main.loadCui();
		      $(document).trigger("newCui");
	    	}
		});
	    cuicui.autoupdate.timer = setInterval(function(){tick()},timerInterval*1000);
	    tick();
	    
	    audioElement = $("#audioOnNewCuicui")[0];
	    audioElement.load();
	    audioElement.volume=0.8;
	}
	
	var tick = function() {
		if (cuicui.feed_date == null) {
			var latest = cuicui.local.getLatest();
			if (latest)
				cuicui.feed_date = cuicui.tools.parseISO8601Date(latest);
		}
		if (cuicui.feed_date) {
			var deltaSeconds = cuicui.tools.deltaSeconds(cuicui.feed_date);
			if (deltaSeconds < 60) {
				last = "< 60 seconds";
			} else {
				last = cuicui.tools.deltaDateText(cuicui.feed_date);
			}
			$(document).trigger("cuiTickLastUpdate",deltaSeconds);
		} else {
			last = "not yet";
		}
		$("#live-update-ago").text( last );
		$(document).trigger("cuiTick");
	}

	var now = function() {
		cuicui.feed_date = new Date();
		tick();
	}
	
	$(document).bind("loadCui",function() {
		now();
	});

	$(document).bind("newCui",function() {
		now();
		
	    audioElement.currentTime=0;
	    audioElement.play();
	});
	
	(function(){
		var firstTimeIveSeenThatWeNeedToRefresh = 0;
		// Time since we received last pong
		$(document).bind("cuiTickLastUpdate",function(e,deltaSeconds) {
			// We didn't receive pongs for 10 minutes, let's recharge
			if (deltaSeconds > 600) {
				if (firstTimeIveSeenThatWeNeedToRefresh == 0) {
					firstTimeIveSeenThatWeNeedToRefresh = new Date();
					return;
				}
				
				if (cuicui.tools.deltaSeconds(firstTimeIveSeenThatWeNeedToRefresh) > 60)
					window.location.reload();
			}
	
		});
	})();
		
	cuicui.autoupdate.tick = tick;
})();

cuicui.tools = {
		getJSONP: function(url, success) {
		    var ud = '_' + +new Date,
		        script = document.createElement('script'),
		        head = document.getElementsByTagName('head')[0] 
		               || document.documentElement;
		
		    window[ud] = function(data) {
		        head.removeChild(script);
		        success && success(data);
		    };
		
		    script.src = url.replace('?', ud);
		    head.appendChild(script);
		}, 
		// Find elements like namespace:tag that jquery selector cannot find
		getByTagName: function (elements, searchTagName) {
			for (var i=0; i<elements.length; i++) {
				if (elements[i].tagName == searchTagName) return elements[i];
			}
		},
		deltaSeconds: function(date) {
			var delta = ( (new Date()).getTime() - date.getTime() ) / 1000;
			delta = parseInt(delta);
			return delta;
		},
		deltaDateText: function(date) {
			var delta = cuicui.tools.deltaSeconds(date);
			if (delta < 0) delta = 0;
			if (delta < 60) text = delta + " secondes";
			else if (delta < 3600) text = Math.ceil(delta / 60) + " minutes";
			else if (delta < 3600*24) text = Math.ceil(delta / 3600) + " heures";
			else text = Math.ceil(delta / (3600*24)) + " jours";
			return text;
		},
		// @author nathan
		// @source http://n8v.enteuxis.org/2010/12/parsing-iso-8601-dates-in-javascript/
		parseISO8601Date: function(s){
			  // parenthese matches:
			  // year month day    hours minutes seconds  
			  // dotmilliseconds 
			  // tzstring plusminus hours minutes
			  var re = /(\d{4})-(\d\d)-(\d\d)T(\d\d):(\d\d):(\d\d)(\.\d+)?(Z|([+-])(\d\d):(\d\d))/;
			 
			  var d = [];
			  d = s.match(re);
			 
			  // "2010-12-07T11:00:00.000-09:00" parses to:
			  //  ["2010-12-07T11:00:00.000-09:00", "2010", "12", "07", "11",
			  //     "00", "00", ".000", "-09:00", "-", "09", "00"]
			  // "2010-12-07T11:00:00.000Z" parses to:
			  //  ["2010-12-07T11:00:00.000Z",      "2010", "12", "07", "11", 
			  //     "00", "00", ".000", "Z", undefined, undefined, undefined]
			 
			  if (! d) {
			    throw "Couldn't parse ISO 8601 date string '" + s + "'";
			  }
			 
			  // parse strings, leading zeros into proper ints
			  var a = [1,2,3,4,5,6,10,11];
			  for (var i in a) {
			    d[a[i]] = parseInt(d[a[i]], 10);
			  }
			  d[7] = parseFloat(d[7]);
			 
			  // Date.UTC(year, month[, date[, hrs[, min[, sec[, ms]]]]])
			  // note that month is 0-11, not 1-12
			  // see https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Date/UTC
			  var ms = Date.UTC(d[1], d[2] - 1, d[3], d[4], d[5], d[6]);
			 
			  // if there are milliseconds, add them
			  if (d[7] > 0) {  
			    ms += Math.round(d[7] * 1000);
			  }
			 
			  // if there's a timezone, calculate it
			  if (d[8] != "Z" && d[10]) {
			    var offset = d[10] * 60 * 60 * 1000;
			    if (d[11]) {
			      offset += d[11] * 60 * 1000;
			    }
			    if (d[9] == "-") {
			      ms -= offset;
			    }
			    else {
			      ms += offset;
			    }
			  }
			 
			  return new Date(ms);
		}
}

Storage = {
		get: function(key) {
			if (!Storage.isHtml5Storage()) return null;
			return localStorage.getItem(key);
		},
		set: function(key,value) {
			if (!Storage.isHtml5Storage()) return null;
			localStorage[key] = value;
		},
		isHtml5Storage: function() {
			try {
			    return 'localStorage' in window && window['localStorage'] !== null;
			  } catch (e) {
			    return false;
			  }
		}
}